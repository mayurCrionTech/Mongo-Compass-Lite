# Compass Lite

A self-hosted, browser-based MongoDB client — a lightweight clone of MongoDB
Compass. Point it at any MongoDB connection string and browse databases,
collections, and documents; run filter/sort queries; edit/add/delete
documents; import/export JSON; and inspect an inferred schema + indexes.

Stack: **Node.js/Express** (API) + **React/Vite** (UI). Talks to MongoDB
using the official `mongodb` driver — no Mongoose, so it works against any
database regardless of schema.

## Features

- Sidebar tree of databases → collections, with document counts
- Create / drop collections
- Document browser with two views: JSON (tree, expandable) and Table
- Compass-style filter bar (`{"age": {"$gt": 30}}`) and sort bar, with
  paging (10/25/50/100/200 per page)
- Add / edit (raw JSON editor) / delete documents
- Import documents from a `.json` file (array or single object)
- Export a collection (or the current filtered result) to `.json`
- **Schema tab** — samples documents and shows each field's inferred type(s)
  and how often it's present, like Compass's Schema tab
- **Indexes tab** — lists indexes and their keys
- Supports `ObjectId("...")` / `ISODate("...")` shorthand in filters

## Requirements

- Node.js 18+ (works fine on Windows)
- A reachable MongoDB instance (local, remote, or Atlas connection string)

## Setup

From the project root:

```bash
npm run install-all
```

This installs dependencies for both `server/` and `client/`.

Then configure your connection string:

```bash
cd server
copy .env.example .env      # Windows
# or: cp .env.example .env   # macOS/Linux
```

Edit `server/.env` and set:

```
MONGODB_URI=mongodb://localhost:27017
PORT=4000
```

(Use your real URI — including `mongodb+srv://...` Atlas strings with
username/password if needed.)

## Run

From the project root:

```bash
npm run dev
```

This starts the API on `http://localhost:4000` and the Vite dev server on
`http://localhost:5173` (which proxies `/api` to the backend). Open
`http://localhost:5173` in your browser.

If you'd rather run them separately (two terminals):

```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
cd client
npm run dev
```

## Project structure

```
mongo-compass-clone/
  server/                 Express API (talks to MongoDB via the mongodb driver)
    src/
      index.js            App entrypoint, route mounting
      db.js               Lazy MongoClient singleton
      routes/
        databases.js      GET /api/databases
        collections.js    GET/POST/DELETE /api/databases/:db/collections
        documents.js      Documents CRUD, schema, indexes, import/export
      utils/
        ejson.js           Parses filter/sort/doc strings (EJSON + ObjectId(...) shorthand)
        schema.js           Infers a field-level schema from a sample of documents
  client/                 React (Vite) frontend
    src/
      App.jsx
      api.js              Axios wrapper around the API
      components/
        Sidebar.jsx
        Toolbar.jsx
        QueryBar.jsx
        CollectionView.jsx
        DocumentTable.jsx (Table + JSON list views)
        DocumentEditor.jsx (add/edit modal)
        JsonView.jsx        (recursive collapsible JSON tree)
        SchemaView.jsx
        IndexesView.jsx
        Pagination.jsx
      styles/app.css
```

## API reference

All endpoints are under `/api`:

| Method | Path | Description |
|---|---|---|
| GET | `/databases` | List databases |
| GET | `/databases/:db/collections` | List collections + stats |
| POST | `/databases/:db/collections` | Create collection (`{ "name": "..." }`) |
| DELETE | `/databases/:db/collections/:coll` | Drop collection |
| GET | `/databases/:db/collections/:coll/documents?filter=&sort=&page=&limit=` | Query documents |
| POST | `/databases/:db/collections/:coll/documents` | Insert one document |
| PUT | `/databases/:db/collections/:coll/documents/:id` | Update one document |
| DELETE | `/databases/:db/collections/:coll/documents/:id` | Delete one document |
| GET | `/databases/:db/collections/:coll/documents/schema?sampleSize=100` | Inferred schema |
| GET | `/databases/:db/collections/:coll/documents/indexes` | List indexes |
| GET | `/databases/:db/collections/:coll/documents/export?filter=` | Download as JSON |
| POST | `/databases/:db/collections/:coll/documents/import` | Bulk insert (`{ "documents": [...] }`) |

## Notes / ideas to extend further

- Add auth (e.g. a simple password gate) before exposing this beyond localhost
- Add aggregation-pipeline support (a "Pipeline" tab)
- Add CSV export/import
- Add a dark/light theme toggle (currently dark-only, Compass-style)

This is a lightweight tool for local development/inspection — it does not aim
to replace Compass's full feature set (explain plans, validation rules,
charts, etc.), but covers the day-to-day browsing/editing workflow.
