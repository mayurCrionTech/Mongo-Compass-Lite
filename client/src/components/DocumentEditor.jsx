import React, { useState } from 'react';

export default function DocumentEditor({ initialDoc, onSave, onCancel, title }) {
  const [text, setText] = useState(() => JSON.stringify(initialDoc ?? {}, null, 2));
  const [error, setError] = useState(null);

  function handleSave() {
    try {
      const parsed = JSON.parse(text);
      setError(null);
      onSave(parsed);
    } catch (e) {
      setError('Invalid JSON: ' + e.message);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">{title || 'Edit document'}</div>
        <textarea
          className="modal-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        />
        {error && <div className="modal-error">{error}</div>}
        <div className="modal-footer">
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
