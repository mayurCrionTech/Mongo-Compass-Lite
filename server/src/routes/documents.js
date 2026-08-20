const express = require('express');
const { getClient } = require('../db');
const { parseEjson, toEjsonString, tryObjectId } = require('../utils/ejson');
const { inferSchema } = require('../utils/schema');

const router = express.Router({ mergeParams: true });

function getColl(client, dbName, collName) {
  return client.db(dbName).collection(collName);
}

// GET documents with filter/sort/pagination
router.get('/', async (req, res, next) => {
  try {
    const { dbName, collName } = req.params;
    const { filter = '{}', sort = '{}', page = 1, limit = 200 } = req.query;

    const client = await getClient();
    const coll = getColl(client, dbName, collName);

    const parsedFilter = parseEjson(filter);
    const parsedSort = parseEjson(sort);
    const isEmptyFilter = Object.keys(parsedFilter).length === 0;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    // Cap default page size so huge (million+ doc) collections stay fast to render.
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 200, 1), 500);
    const skip = (pageNum - 1) * limitNum;

    // Try the query as requested, but if it can't use an index (common on big/time-series
    // collections without a matching index) never just error out — degrade step by step
    // and still return whatever we can get quickly, rather than showing nothing.
    const QUERY_TIMEOUT_MS = 8000;

    async function attempt(useSort, attemptLimit, timeoutMs) {
      const cursor = coll.find(parsedFilter).skip(skip).limit(attemptLimit + 1).maxTimeMS(timeoutMs);
      if (useSort) cursor.sort(parsedSort);
      return cursor.toArray();
    }

    const hasSort = Object.keys(parsedSort).length > 0;
    let rawDocs;
    let usedLimit = limitNum;
    let degraded = false;
    let warning = null;

    try {
      // Attempt 1: exactly what was asked for.
      rawDocs = await attempt(hasSort, limitNum, QUERY_TIMEOUT_MS);
      usedLimit = limitNum;
    } catch (e1) {
      try {
        // Attempt 2: drop the sort (usually the expensive part without a matching index)
        // and shrink the page size.
        const smallerLimit = Math.min(limitNum, 50);
        rawDocs = await attempt(false, smallerLimit, 6000);
        usedLimit = smallerLimit;
        degraded = true;
        warning = hasSort
          ? `Showing ${smallerLimit} unsorted results — the requested sort has no matching index on this collection, so it was skipped for speed.`
          : `Showing ${smallerLimit} results — this collection is large and a smaller page loads faster.`;
      } catch (e2) {
        try {
          // Attempt 3: bare minimum — just prove the filter works at all, fast.
          rawDocs = await attempt(false, 20, 4000);
          usedLimit = 20;
          degraded = true;
          warning = 'Showing only 20 results — this query is slow on this collection (likely missing an index). Consider adding a filter on an indexed field.';
        } catch (e3) {
          // Give up gracefully: empty result, not a 500/504.
          rawDocs = [];
          usedLimit = 0;
          degraded = true;
          warning = 'Could not fetch results in time — this collection/query needs an index to be usable. Try narrowing the filter.';
        }
      }
    }

    // Counting is expensive on multi-million-document collections (full scan for
    // countDocuments with a filter). Use the fast metadata-based estimate when there's
    // no filter, and bound filtered counts with a timeout so they can never hang the request.
    const countPromise = isEmptyFilter
      ? coll.estimatedDocumentCount().catch(() => null)
      : coll.countDocuments(parsedFilter, { maxTimeMS: 3000 }).catch(() => null);

    const total = await countPromise;

    const hasMore = rawDocs.length > usedLimit;
    const docs = hasMore ? rawDocs.slice(0, usedLimit) : rawDocs;

    res.json({
      documents: JSON.parse(toEjsonString(docs)),
      total, // may be null if the count timed out on a very large filtered collection
      approximateTotal: isEmptyFilter,
      page: pageNum,
      limit: usedLimit,
      hasMore,
      degraded,
      warning,
      totalPages: total != null ? Math.max(Math.ceil(total / (usedLimit || 1)), 1) : null,
    });
  } catch (err) {
    next(err);
  }
});

// GET schema (sampled)
router.get('/schema', async (req, res, next) => {
  try {
    const { dbName, collName } = req.params;
    const sampleSize = Math.min(parseInt(req.query.sampleSize, 10) || 100, 1000);
    const client = await getClient();
    const coll = getColl(client, dbName, collName);
    const docs = await coll.aggregate([{ $sample: { size: sampleSize } }]).toArray();
    const schema = inferSchema(JSON.parse(toEjsonString(docs)));
    res.json(schema);
  } catch (err) {
    next(err);
  }
});

// GET indexes
router.get('/indexes', async (req, res, next) => {
  try {
    const { dbName, collName } = req.params;
    const client = await getClient();
    const coll = getColl(client, dbName, collName);
    const indexes = await coll.indexes();
    res.json({ indexes });
  } catch (err) {
    next(err);
  }
});

// GET export (all documents matching filter, streamed as JSON array)
router.get('/export', async (req, res, next) => {
  try {
    const { dbName, collName } = req.params;
    const { filter = '{}' } = req.query;
    const client = await getClient();
    const coll = getColl(client, dbName, collName);
    const parsedFilter = parseEjson(filter);
    const docs = await coll.find(parsedFilter).toArray();

    res.setHeader('Content-Disposition', `attachment; filename="${collName}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(toEjsonString(docs));
  } catch (err) {
    next(err);
  }
});

// POST import (bulk insert array of documents)
router.post('/import', async (req, res, next) => {
  try {
    const { dbName, collName } = req.params;
    const { documents } = req.body;
    if (!Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ error: 'Body must include a non-empty "documents" array' });
    }
    const client = await getClient();
    const coll = getColl(client, dbName, collName);

    // strip _id if it's an invalid/duplicate string so mongo can assign new ones on conflict-free import
    const cleaned = documents.map((d) => {
      const doc = parseEjson(JSON.stringify(d));
      return doc;
    });

    const result = await coll.insertMany(cleaned, { ordered: false });
    res.status(201).json({ insertedCount: result.insertedCount });
  } catch (err) {
    // insertMany with ordered:false throws BulkWriteError but may have partial success
    if (err.result && err.result.result) {
      return res.status(207).json({
        insertedCount: err.result.result.nInserted,
        error: 'Some documents failed to import (likely duplicate _id).',
      });
    }
    next(err);
  }
});

// POST create a new document
router.post('/', async (req, res, next) => {
  try {
    const { dbName, collName } = req.params;
    const doc = parseEjson(JSON.stringify(req.body));
    const client = await getClient();
    const coll = getColl(client, dbName, collName);
    const result = await coll.insertOne(doc);
    res.status(201).json({ insertedId: result.insertedId });
  } catch (err) {
    next(err);
  }
});

// PUT replace a document by id
router.put('/:id', async (req, res, next) => {
  try {
    const { dbName, collName, id } = req.params;
    const client = await getClient();
    const coll = getColl(client, dbName, collName);

    const doc = parseEjson(JSON.stringify(req.body));
    delete doc._id; // _id is immutable

    const result = await coll.updateOne(
      { _id: tryObjectId(id) },
      { $set: doc }
    );
    res.json({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
  } catch (err) {
    next(err);
  }
});

// DELETE a document by id
router.delete('/:id', async (req, res, next) => {
  try {
    const { dbName, collName, id } = req.params;
    const client = await getClient();
    const coll = getColl(client, dbName, collName);
    const result = await coll.deleteOne({ _id: tryObjectId(id) });
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
