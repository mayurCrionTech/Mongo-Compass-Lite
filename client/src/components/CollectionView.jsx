import React, { useCallback, useEffect, useState } from 'react';
import Toolbar from './Toolbar.jsx';
import QueryBar from './QueryBar.jsx';
import Pagination from './Pagination.jsx';
import { TableView, ListView } from './DocumentTable.jsx';
import DocumentEditor from './DocumentEditor.jsx';
import SchemaView from './SchemaView.jsx';
import IndexesView from './IndexesView.jsx';
import {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  importDocuments,
  exportUrl,
} from '../api';

export default function CollectionView({ dbName, collName, timeField, isTimeSeries }) {
  const [tab, setTab] = useState('documents');
  const [view, setView] = useState('list');
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [approximateTotal, setApproximateTotal] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [filter, setFilter] = useState('{}');
  const [sort, setSort] = useState('{}');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null); // null | 'new' | doc
  const [status, setStatus] = useState(null);
  const [queryWarning, setQueryWarning] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDocuments(dbName, collName, { filter, sort, page, limit });
      setDocuments(res.documents);
      setTotal(res.total);
      setApproximateTotal(res.approximateTotal);
      setHasMore(res.hasMore);
      setQueryWarning(res.warning || null);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
      setQueryWarning(null);
    } finally {
      setLoading(false);
    }
  }, [dbName, collName, filter, sort, page, limit]);

  useEffect(() => {
    setPage(1);
  }, [dbName, collName]);

  useEffect(() => {
    if (tab === 'documents') load();
  }, [load, tab]);

  function handleRunQuery({ filter: f, sort: s }) {
    setFilter(f);
    setSort(s);
    setPage(1);
  }

  async function handleSaveDoc(doc) {
    try {
      if (editingDoc === 'new') {
        await createDocument(dbName, collName, doc);
        setStatus('Document created');
      } else {
        const id = editingDoc._id?.$oid || editingDoc._id;
        await updateDocument(dbName, collName, id, doc);
        setStatus('Document updated');
      }
      setEditingDoc(null);
      load();
    } catch (e) {
      alert('Save failed: ' + (e.response?.data?.error || e.message));
    }
  }

  async function handleDelete(doc) {
    if (!window.confirm('Delete this document?')) return;
    try {
      const id = doc._id?.$oid || doc._id;
      await deleteDocument(dbName, collName, id);
      setStatus('Document deleted');
      load();
    } catch (e) {
      alert('Delete failed: ' + (e.response?.data?.error || e.message));
    }
  }

  async function handleImportFile(file) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const docs = Array.isArray(parsed) ? parsed : [parsed];
      const res = await importDocuments(dbName, collName, docs);
      setStatus(`Imported ${res.insertedCount} document(s)${res.error ? ' — ' + res.error : ''}`);
      load();
    } catch (e) {
      alert('Import failed: ' + (e.response?.data?.error || e.message));
    }
  }

  function handleExport() {
    window.open(exportUrl(dbName, collName, filter), '_blank');
  }

  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 3500);
    return () => clearTimeout(t);
  }, [status]);

  return (
    <div className="collection-view">
      <div className="collection-header">
        <span className="breadcrumb">
          {dbName} <span className="sep">›</span> {collName}
        </span>
      </div>

      <Toolbar
        view={view}
        onView={setView}
        tab={tab}
        onTab={setTab}
        onAdd={() => setEditingDoc('new')}
        onExport={handleExport}
        onImportFile={handleImportFile}
      />

      {status && <div className="status-banner">{status}</div>}

      {tab === 'documents' && (
        <>
          <QueryBar onRun={handleRunQuery} initialFilter={filter} initialSort={sort} timeField={timeField} />
          {isTimeSeries && (
            <div className="ts-hint">
              Time-series collection (time field: <code>{timeField}</code>). For fast queries on
              millions of docs, filter on <code>{timeField}</code>, e.g.{' '}
              <code>{`{"${timeField}": {"$gte": {"$date": "2026-08-01T00:00:00Z"}}}`}</code>
            </div>
          )}
          {!loading && !error && queryWarning && (
            <div className="query-warning">⚡ {queryWarning}</div>
          )}
          {loading && <div className="panel-msg">Loading…</div>}
          {error && <div className="panel-msg error">{error}</div>}
          {!loading && !error && documents.length === 0 && (
            <div className="panel-msg">No documents match this query.</div>
          )}
          {!loading && !error && documents.length > 0 && (
            <>
              {view === 'table' ? (
                <TableView documents={documents} onEdit={setEditingDoc} onDelete={handleDelete} />
              ) : (
                <ListView documents={documents} onEdit={setEditingDoc} onDelete={handleDelete} />
              )}
              <Pagination
                page={page}
                total={total}
                approximateTotal={approximateTotal}
                hasMore={hasMore}
                limit={limit}
                onPage={setPage}
                onLimit={(l) => {
                  setLimit(l);
                  setPage(1);
                }}
              />
            </>
          )}
        </>
      )}

      {tab === 'schema' && <SchemaView dbName={dbName} collName={collName} />}
      {tab === 'indexes' && <IndexesView dbName={dbName} collName={collName} />}

      {editingDoc && (
        <DocumentEditor
          title={editingDoc === 'new' ? 'New document' : 'Edit document'}
          initialDoc={editingDoc === 'new' ? { field: 'value' } : editingDoc}
          onSave={handleSaveDoc}
          onCancel={() => setEditingDoc(null)}
        />
      )}
    </div>
  );
}
