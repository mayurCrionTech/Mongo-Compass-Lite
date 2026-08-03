import React from 'react';

export default function Pagination({ page, totalPages, total, limit, onPage, onLimit }) {
  return (
    <div className="pagination">
      <span className="pg-total">{total} documents</span>
      <div className="pg-controls">
        <button className="btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          ‹ Prev
        </button>
        <span className="pg-page">
          Page {page} / {totalPages}
        </span>
        <button className="btn" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next ›
        </button>
        <select value={limit} onChange={(e) => onLimit(Number(e.target.value))}>
          {[10, 25, 50, 100, 200].map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
