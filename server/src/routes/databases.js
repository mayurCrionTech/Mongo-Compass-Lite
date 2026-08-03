const express = require('express');
const { getClient } = require('../db');

const router = express.Router();

const SYSTEM_DBS = new Set(['admin', 'local', 'config']);

router.get('/', async (req, res, next) => {
  try {
    const client = await getClient();
    const admin = client.db().admin();
    const { databases } = await admin.listDatabases();
    const hideSystem = process.env.HIDE_SYSTEM_DBS !== 'false';

    const list = databases
      .filter((d) => !hideSystem || !SYSTEM_DBS.has(d.name))
      .map((d) => ({ name: d.name, sizeOnDisk: d.sizeOnDisk, empty: d.empty }));

    res.json({ databases: list });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
