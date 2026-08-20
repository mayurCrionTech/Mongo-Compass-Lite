import React from 'react';

export default function Pagination({ page, total, approximateTotal, hasMore, limit, onPage, onLimit }) {
  const totalLabel =
    total == null
      ? 'document count unavailable (query timed out on this large collection)'
      : `${approximateTotal ? '~' : ''}${total.toLocaleString()} documents`;

  return (
    <div className="pagination">
      <span className="pg-total">{totalLabel}</span>
      <div className="pg-controls">
        <button className="btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          ‹ Prev
        </button>
        <span className="pg-page">Page {page}</span>
        <button className="btn" disabled={!hasMore} onClick={() => onPage(page + 1)}>
          Next ›
        </button>
        <select value={limit} onChange={(e) => onLimit(Number(e.target.value))}>
          {[50, 100, 200, 500].map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
