import React, { useEffect, useState } from 'react';
import { getSchema } from '../api';

const TYPE_COLORS = {
  String: '#2f9e44',
  Int32: '#1971c2',
  Double: '#1971c2',
  Boolean: '#e8590c',
  Date: '#9c36b5',
  ObjectId: '#f08c00',
  Object: '#495057',
  Array: '#495057',
  Null: '#868e96',
};

export default function SchemaView({ dbName, collName }) {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getSchema(dbName, collName)
      .then(setSchema)
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [dbName, collName]);

  if (loading) return <div className="panel-msg">Analyzing schema…</div>;
  if (error) return <div className="panel-msg error">{error}</div>;
  if (!schema || schema.fields.length === 0)
    return <div className="panel-msg">No documents to sample.</div>;

  return (
    <div className="schema-view">
      <div className="schema-note">Based on a sample of {schema.sampleSize} documents</div>
      <table className="schema-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Type(s)</th>
            <th>Present</th>
          </tr>
        </thead>
        <tbody>
          {schema.fields.map((f) => (
            <tr key={f.path}>
              <td className="schema-field">{f.path}</td>
              <td>
                {f.types.map((t) => (
                  <span
                    key={t.name}
                    className="type-pill"
                    style={{ background: (TYPE_COLORS[t.name] || '#495057') + '22', color: TYPE_COLORS[t.name] || '#495057' }}
                  >
                    {t.name} {t.percent}%
                  </span>
                ))}
              </td>
              <td>{f.percentPresent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
