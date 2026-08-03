import React, { useEffect, useState } from 'react';
import { getIndexes } from '../api';

export default function IndexesView({ dbName, collName }) {
  const [indexes, setIndexes] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    setIndexes(null);
    getIndexes(dbName, collName)
      .then(setIndexes)
      .catch((e) => setError(e.response?.data?.error || e.message));
  }, [dbName, collName]);

  if (error) return <div className="panel-msg error">{error}</div>;
  if (!indexes) return <div className="panel-msg">Loading indexes…</div>;

  return (
    <div className="indexes-view">
      <table className="schema-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Keys</th>
            <th>Unique</th>
          </tr>
        </thead>
        <tbody>
          {indexes.map((idx) => (
            <tr key={idx.name}>
              <td>{idx.name}</td>
              <td>{JSON.stringify(idx.key)}</td>
              <td>{idx.unique ? 'Yes' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
