import axios from 'axios';

// Backstop timeout: the server's document-fetch fallback chain (see documents.js) has a
// worst case of ~9s (4s + 3s + 2s across its 3 retry attempts, with the count query running
// in parallel rather than adding to that). 20s here gives real headroom above that plus
// network/JSON overhead, so the client never gives up right as the server is about to
// succeed on a later fallback attempt.
const api = axios.create({ baseURL: '/api', timeout: 20000 });

export const getHealth = () => api.get('/health').then((r) => r.data);

export const listDatabases = () => api.get('/databases').then((r) => r.data.databases);

export const listCollections = (dbName) =>
  api.get(`/databases/${encodeURIComponent(dbName)}/collections`).then((r) => r.data.collections);

export const createCollection = (dbName, name) =>
  api.post(`/databases/${encodeURIComponent(dbName)}/collections`, { name }).then((r) => r.data);

export const dropCollection = (dbName, collName) =>
  api
    .delete(`/databases/${encodeURIComponent(dbName)}/collections/${encodeURIComponent(collName)}`)
    .then((r) => r.data);

const base = (dbName, collName) =>
  `/databases/${encodeURIComponent(dbName)}/collections/${encodeURIComponent(collName)}/documents`;

export const getDocuments = (dbName, collName, { filter, sort, page, limit }) =>
  api
    .get(base(dbName, collName), { params: { filter, sort, page, limit } })
    .then((r) => r.data);

export const getSchema = (dbName, collName, sampleSize = 100) =>
  api.get(`${base(dbName, collName)}/schema`, { params: { sampleSize } }).then((r) => r.data);

export const getIndexes = (dbName, collName) =>
  api.get(`${base(dbName, collName)}/indexes`).then((r) => r.data.indexes);

export const createDocument = (dbName, collName, doc) =>
  api.post(base(dbName, collName), doc).then((r) => r.data);

export const updateDocument = (dbName, collName, id, doc) =>
  api.put(`${base(dbName, collName)}/${encodeURIComponent(id)}`, doc).then((r) => r.data);

export const deleteDocument = (dbName, collName, id) =>
  api.delete(`${base(dbName, collName)}/${encodeURIComponent(id)}`).then((r) => r.data);

export const importDocuments = (dbName, collName, documents) =>
  api.post(`${base(dbName, collName)}/import`, { documents }).then((r) => r.data);

export const exportUrl = (dbName, collName, filter) => {
  const params = new URLSearchParams();
  if (filter) params.set('filter', filter);
  return `/api${base(dbName, collName)}/export?${params.toString()}`;
};

export default api;
