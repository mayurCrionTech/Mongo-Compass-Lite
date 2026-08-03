import React, { useState } from 'react';

function valueClass(v) {
  if (v === null) return 'jv-null';
  if (Array.isArray(v)) return 'jv-array';
  const t = typeof v;
  if (t === 'string') return 'jv-string';
  if (t === 'number') return 'jv-number';
  if (t === 'boolean') return 'jv-boolean';
  if (t === 'object') return 'jv-object';
  return '';
}

function renderPrimitive(v) {
  if (v === null) return 'null';
  if (typeof v === 'string') {
    // detect extended JSON wrappers like {$oid: ...} already flattened by caller
    return `"${v}"`;
  }
  return String(v);
}

function Node({ label, value, depth = 0 }) {
  const isObj = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArr = Array.isArray(value);
  const [open, setOpen] = useState(depth < 1);

  if (isObj || isArr) {
    const entries = isArr ? value.map((v, i) => [i, v]) : Object.entries(value);
    const count = entries.length;
    return (
      <div className="jv-node" style={{ marginLeft: depth ? 14 : 0 }}>
        <span className="jv-toggle" onClick={() => setOpen(!open)}>
          {open ? '▾' : '▸'}
        </span>
        {label !== undefined && <span className="jv-key">{label}: </span>}
        <span className="jv-bracket">
          {isArr ? `Array(${count})` : `Object`} {open ? '' : '{…}'}
        </span>
        {open && (
          <div>
            {entries.map(([k, v]) => (
              <Node key={k} label={k} value={v} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="jv-node" style={{ marginLeft: depth ? 14 : 0 }}>
      {label !== undefined && <span className="jv-key">{label}: </span>}
      <span className={valueClass(value)}>{renderPrimitive(value)}</span>
    </div>
  );
}

export default function JsonView({ data }) {
  return (
    <div className="jv-root">
      <Node value={data} />
    </div>
  );
}
