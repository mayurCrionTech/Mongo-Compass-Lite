import React, { useRef } from 'react';

export default function Toolbar({
  view,
  onView,
  tab,
  onTab,
  onAdd,
  onExport,
  onImportFile,
}) {
  const fileRef = useRef(null);

  return (
    <div className="toolbar">
      <div className="tabs">
        <button className={'tab' + (tab === 'documents' ? ' active' : '')} onClick={() => onTab('documents')}>
          Documents
        </button>
        <button className={'tab' + (tab === 'schema' ? ' active' : '')} onClick={() => onTab('schema')}>
          Schema
        </button>
        <button className={'tab' + (tab === 'indexes' ? ' active' : '')} onClick={() => onTab('indexes')}>
          Indexes
        </button>
      </div>

      {tab === 'documents' && (
        <div className="toolbar-actions">
          <div className="view-toggle">
            <button className={view === 'list' ? 'active' : ''} onClick={() => onView('list')} title="JSON view">
              ☰
            </button>
            <button className={view === 'table' ? 'active' : ''} onClick={() => onView('table')} title="Table view">
              ▦
            </button>
          </div>
          <button className="btn" onClick={onAdd}>
            + Add document
          </button>
          <button className="btn" onClick={onExport}>
            Export
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <input
            type="file"
            ref={fileRef}
            accept=".json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportFile(file);
              e.target.value = '';
            }}
          />
        </div>
      )}
    </div>
  );
}
