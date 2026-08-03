import React, { useState } from 'react';

export default function QueryBar({ onRun, initialFilter = '{}', initialSort = '{}' }) {
  const [filter, setFilter] = useState(initialFilter);
  const [sort, setSort] = useState(initialSort);
  const [showSort, setShowSort] = useState(false);

  function run() {
    onRun({ filter, sort });
  }

  return (
    <div className="query-bar">
      <div className="query-row">
        <span className="query-label">Filter</span>
        <input
          className="query-input"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          placeholder='{ "field": "value" }'
          spellCheck={false}
        />
        <button className="btn" onClick={() => setShowSort((s) => !s)}>
          Sort
        </button>
        <button className="btn primary" onClick={run}>
          Run
        </button>
        <button
          className="btn"
          onClick={() => {
            setFilter('{}');
            setSort('{}');
            onRun({ filter: '{}', sort: '{}' });
          }}
        >
          Reset
        </button>
      </div>
      {showSort && (
        <div className="query-row">
          <span className="query-label">Sort</span>
          <input
            className="query-input"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            placeholder='{ "createdAt": -1 }'
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
}
