import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import CollectionView from './components/CollectionView.jsx';

export default function App() {
  const [selected, setSelected] = useState({ dbName: null, collName: null });
  const [refreshKey, setRefreshKey] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('compass-lite-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('compass-lite-theme', theme);
  }, [theme]);

  return (
    <div className="app">
      <div className="app-header">
        <span className="app-logo">🍃</span>
        <span className="app-title">Compass Lite</span>
        <span className="app-subtitle">a self-hosted Mongo browser</span>
        <button
          className="btn theme-toggle"
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          title="Toggle theme"
        >
          {theme === 'dark' ? '☀ Light' : '🌙 Dark'}
        </button>
        <button className="btn refresh-btn" onClick={() => setRefreshKey((k) => k + 1)}>
          ↻ Refresh
        </button>
      </div>
      <div className="app-body">
        <Sidebar selected={selected} onSelect={setSelected} refreshKey={refreshKey} />
        <div className="main-panel">
          {selected.dbName && selected.collName ? (
            <CollectionView
              key={`${selected.dbName}.${selected.collName}`}
              dbName={selected.dbName}
              collName={selected.collName}
              timeField={selected.timeField}
              isTimeSeries={selected.isTimeSeries}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🍃</div>
              <div>Select a collection from the sidebar to browse its documents.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
