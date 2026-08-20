import React, { useEffect, useState } from 'react';
import { listDatabases, listCollections, createCollection, dropCollection } from '../api';

export default function Sidebar({ selected, onSelect, refreshKey }) {
  const [databases, setDatabases] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [collectionsByDb, setCollectionsByDb] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCollDb, setNewCollDb] = useState(null);
  const [newCollName, setNewCollName] = useState('');
  const [collSearch, setCollSearch] = useState({});

  useEffect(() => {
    setLoading(true);
    listDatabases()
      .then((dbs) => setDatabases(dbs))
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  async function toggleDb(dbName) {
    const isOpen = !!expanded[dbName];
    setExpanded((prev) => ({ ...prev, [dbName]: !isOpen }));
    if (!isOpen && !collectionsByDb[dbName]) {
      try {
        const colls = await listCollections(dbName);
        setCollectionsByDb((prev) => ({ ...prev, [dbName]: colls }));
      } catch (e) {
        setCollectionsByDb((prev) => ({ ...prev, [dbName]: [] }));
      }
    }
  }

  async function refreshColls(dbName) {
    const colls = await listCollections(dbName);
    setCollectionsByDb((prev) => ({ ...prev, [dbName]: colls }));
  }

  async function handleAddCollection(dbName) {
    if (!newCollName.trim()) return;
    await createCollection(dbName, newCollName.trim());
    setNewCollName('');
    setNewCollDb(null);
    refreshColls(dbName);
  }

  async function handleDropCollection(dbName, collName) {
    if (!window.confirm(`Drop collection "${collName}"? This cannot be undone.`)) return;
    await dropCollection(dbName, collName);
    refreshColls(dbName);
    if (selected.collName === collName && selected.dbName === dbName) {
      onSelect({ dbName: null, collName: null });
    }
  }

  if (loading) return <div className="sidebar"><div className="sidebar-msg">Connecting…</div></div>;
  if (error)
    return (
      <div className="sidebar">
        <div className="sidebar-msg error">
          Connection failed: {error}
          <div className="hint">Check MONGODB_URI in server/.env and that the server is running.</div>
        </div>
      </div>
    );

  return (
    <div className="sidebar">
      <div className="sidebar-title">DATABASES</div>
      <div className="db-list">
        {databases.map((db) => (
          <div key={db.name} className="db-item">
            <div className="db-row" onClick={() => toggleDb(db.name)}>
              <span className="twisty">{expanded[db.name] ? '▾' : '▸'}</span>
              <span className="db-icon">🗄</span>
              <span className="db-name">{db.name}</span>
            </div>
            {expanded[db.name] && (
              <div className="coll-list">
                {(collectionsByDb[db.name] || []).length > 0 && (
                  <div className="coll-search-row">
                    <input
                      className="coll-search-input"
                      value={collSearch[db.name] || ''}
                      onChange={(e) =>
                        setCollSearch((prev) => ({ ...prev, [db.name]: e.target.value }))
                      }
                      placeholder="Search collections…"
                    />
                  </div>
                )}
                {(collectionsByDb[db.name] || [])
                  .filter((c) =>
                    c.name.toLowerCase().includes((collSearch[db.name] || '').toLowerCase())
                  )
                  .map((c) => (
                  <div
                    key={c.name}
                    className={
                      'coll-row' +
                      (selected.dbName === db.name && selected.collName === c.name ? ' active' : '')
                    }
                    onClick={() =>
                      onSelect({
                        dbName: db.name,
                        collName: c.name,
                        timeField: c.timeField || null,
                        isTimeSeries: !!c.isTimeSeries,
                      })
                    }
                  >
                    <span className="coll-icon">▤</span>
                    <span className="coll-name">{c.name}</span>
                    <span className="coll-count">{c.count ?? ''}</span>
                    <span
                      className="coll-drop"
                      title="Drop collection"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDropCollection(db.name, c.name);
                      }}
                    >
                      ✕
                    </span>
                  </div>
                ))}

                {newCollDb === db.name ? (
                  <div className="new-coll-row">
                    <input
                      autoFocus
                      value={newCollName}
                      onChange={(e) => setNewCollName(e.target.value)}
                      placeholder="collection name"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCollection(db.name);
                        if (e.key === 'Escape') setNewCollDb(null);
                      }}
                    />
                    <button onClick={() => handleAddCollection(db.name)}>Add</button>
                  </div>
                ) : (
                  <div className="add-coll-row" onClick={() => setNewCollDb(db.name)}>
                    + Create collection
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {databases.length === 0 && <div className="sidebar-msg">No databases found.</div>}
      </div>
    </div>
  );
}
