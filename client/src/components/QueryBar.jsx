import React, { useState } from 'react';

export default function QueryBar({ onRun, initialFilter = '{}', initialSort = '{}', timeField }) {
  const [filter, setFilter] = useState(initialFilter);
  const [sort, setSort] = useState(initialSort);
  const [showSort, setShowSort] = useState(false);

  // Use the collection's real time field when known (e.g. a time-series collection's
  // timeField, which is indexed), otherwise fall back to the common "createdAt" convention.
  const field = timeField || 'createdAt';
  const descSort = JSON.stringify({ [field]: -1 });
  const ascSort = JSON.stringify({ [field]: 1 });

  const quickSortState = sort.replace(/\s/g, '') === descSort ? 'desc' : sort.replace(/\s/g, '') === ascSort ? 'asc' : 'off';

  function run(nextFilter = filter, nextSort = sort) {
    onRun({ filter: nextFilter, sort: nextSort });
  }

  function toggleQuickSort() {
    // Cycle: off -> newest first -> oldest first -> off
    const next = quickSortState === 'off' ? descSort : quickSortState === 'desc' ? ascSort : '{}';
    setSort(next);
    run(filter, next);
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
          placeholder='{ "field": "value" }  e.g. { "name": { "$regex": "john", "$options": "i" } }'
          spellCheck={false}
        />
        <button
          className={'btn' + (quickSortState !== 'off' ? ' primary' : '')}
          onClick={toggleQuickSort}
          title={`Quick sort by ${field}`}
        >
          {quickSortState === 'desc' && `${field} ↓ Newest`}
          {quickSortState === 'asc' && `${field} ↑ Oldest`}
          {quickSortState === 'off' && `Sort by ${field}`}
        </button>
        <button className="btn" onClick={() => setShowSort((s) => !s)}>
          Custom sort
        </button>
        <button className="btn primary" onClick={() => run()}>
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
            placeholder={`{ "${field}": -1 }`}
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
}
