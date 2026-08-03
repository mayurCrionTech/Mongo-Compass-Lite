require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const databasesRouter = require('./routes/databases');
const collectionsRouter = require('./routes/collections');
const documentsRouter = require('./routes/documents');
const { getClient } = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(morgan('dev'));

app.get('/api/health', async (req, res) => {
  try {
    const client = await getClient();
    await client.db().admin().ping();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use('/api/databases/:dbName/collections/:collName/documents', documentsRouter);
app.use('/api/databases/:dbName/collections', collectionsRouter);
app.use('/api/databases', databasesRouter);

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`[server] API listening on http://localhost:${PORT}`);
});
