import React, { useMemo } from 'react';
import JsonView from './JsonView.jsx';

function cellPreview(v) {
  if (v === undefined) return '';
  if (v === null) return 'null';
  if (typeof v === 'object') return Array.isArray(v) ? `Array(${v.length})` : '{…}';
  const s = String(v);
  return s.length > 60 ? s.slice(0, 60) + '…' : s;
}

export function TableView({ documents, onEdit, onDelete }) {
  const columns = useMemo(() => {
    const cols = new Set(['_id']);
    documents.slice(0, 50).forEach((d) => Object.keys(d).forEach((k) => cols.add(k)));
    return Array.from(cols);
  }, [documents]);

  return (
    <div className="table-scroll">
      <table className="doc-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
            <th className="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc, i) => (
            <tr key={doc._id?.$oid || doc._id || i}>
              {columns.map((c) => (
                <td key={c}>{cellPreview(doc[c])}</td>
              ))}
              <td className="actions-col">
                <button className="link-btn" onClick={() => onEdit(doc)}>
                  Edit
                </button>
                <button className="link-btn danger" onClick={() => onDelete(doc)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ListView({ documents, onEdit, onDelete }) {
  return (
    <div className="doc-list">
      {documents.map((doc, i) => (
        <div className="doc-card" key={doc._id?.$oid || doc._id || i}>
          <div className="doc-card-actions">
            <button className="link-btn" onClick={() => onEdit(doc)}>
              Edit
            </button>
            <button className="link-btn danger" onClick={() => onDelete(doc)}>
              Delete
            </button>
          </div>
          <JsonView data={doc} />
        </div>
      ))}
    </div>
  );
}
