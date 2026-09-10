const express = require('express');
const { getClient } = require('../db');

const router = express.Router({ mergeParams: true });

router.get('/', async (req, res, next) => {
  try {
    const { dbName } = req.params;
    const client = await getClient();
    const db = client.db(dbName);
    const collections = await db.listCollections({}, { nameOnly: false }).toArray();

    const withStats = await Promise.all(
      collections.map(async (c) => {
        const timeseries = c.options && c.options.timeseries ? c.options.timeseries : null;

        // Time-series collections are the slow part: estimatedDocumentCount() and collStats
        // both have to unpack/scan buckets and can take many seconds on collections with
        // millions of measurements. Skip both entirely so the collection list loads fast —
        // stats aren't shown for these, but the collection is still fully browsable.
        if (timeseries) {
          return {
            name: c.name,
            type: c.type,
            count: null,
            sizeBytes: null,
            storageSizeBytes: null,
            avgObjSize: null,
            indexCount: null,
            isTimeSeries: true,
            timeField: timeseries.timeField,
            metaField: timeseries.metaField || null,
            statsSkipped: true,
          };
        }

        try {
          const count = await db.collection(c.name).estimatedDocumentCount();
          const stats = await db.command({ collStats: c.name }).catch(() => null);
          return {
            name: c.name,
            type: c.type,
            count,
            sizeBytes: stats ? stats.size : null,
            storageSizeBytes: stats ? stats.storageSize : null,
            avgObjSize: stats ? stats.avgObjSize : null,
            indexCount: stats ? stats.nindexes : null,
            isTimeSeries: false,
            timeField: null,
            metaField: null,
          };
        } catch (e) {
          return { name: c.name, type: c.type, count: null };
        }
      })
    );

    res.json({ collections: withStats });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { dbName } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Collection name is required' });
    const client = await getClient();
    await client.db(dbName).createCollection(name);
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:collName', async (req, res, next) => {
  try {
    const { dbName, collName } = req.params;
    const client = await getClient();
    await client.db(dbName).collection(collName).drop();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
