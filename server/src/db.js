const { MongoClient } = require('mongodb');

let client = null;
let connecting = null;

async function getClient() {
  if (client) return client;
  if (connecting) return connecting;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to server/.env');
  }

  const newClient = new MongoClient(uri, {
    serverSelectionTimeoutMS: 8000,
  });

  connecting = newClient
    .connect()
    .then((c) => {
      client = c;
      connecting = null;
      console.log('[db] Connected to MongoDB');
      return client;
    })
    .catch((err) => {
      connecting = null;
      throw err;
    });

  return connecting;
}

async function closeClient() {
  if (client) {
    await client.close();
    client = null;
  }
}

module.exports = { getClient, closeClient };
