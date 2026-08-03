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
    const { filter = '{}', sort = '{}', page = 1, limit = 25 } = req.query;

    const client = await getClient();
    const coll = getColl(client, dbName, collName);

    const parsedFilter = parseEjson(filter);
    const parsedSort = parseEjson(sort);

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 500);
    const skip = (pageNum - 1) * limitNum;

    const [docs, total] = await Promise.all([
      coll.find(parsedFilter).sort(parsedSort).skip(skip).limit(limitNum).toArray(),
      coll.countDocuments(parsedFilter),
    ]);

    res.json({
      documents: JSON.parse(toEjsonString(docs)),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(Math.ceil(total / limitNum), 1),
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
