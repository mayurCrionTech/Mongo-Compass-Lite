// Infer a lightweight schema from a sample of documents, Compass-style.

function typeOf(val) {
  if (val === null) return 'Null';
  if (Array.isArray(val)) return 'Array';
  if (val instanceof Date) return 'Date';
  if (val && val._bsontype === 'ObjectId') return 'ObjectId';
  if (val && val._bsontype === 'Decimal128') return 'Decimal128';
  if (val && val._bsontype === 'Long') return 'Long';
  const t = typeof val;
  if (t === 'number') return Number.isInteger(val) ? 'Int32' : 'Double';
  if (t === 'boolean') return 'Boolean';
  if (t === 'string') return 'String';
  if (t === 'object') return 'Object';
  return t;
}

function inferSchema(docs) {
  const fields = {}; // fieldPath -> { types: {typeName: count}, count }
  const total = docs.length;

  function walk(obj, prefix) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (!fields[path]) fields[path] = { types: {}, count: 0 };
      const t = typeOf(value);
      fields[path].types[t] = (fields[path].types[t] || 0) + 1;
      fields[path].count += 1;

      if (t === 'Object') {
        walk(value, path);
      } else if (t === 'Array' && value.length > 0) {
        // sample first element of arrays to describe element type
        const elType = typeOf(value[0]);
        const arrKey = `${path}[]`;
        if (!fields[arrKey]) fields[arrKey] = { types: {}, count: 0 };
        fields[arrKey].types[elType] = (fields[arrKey].types[elType] || 0) + 1;
        fields[arrKey].count += 1;
        if (elType === 'Object') walk(value[0], arrKey);
      }
    }
  }

  for (const doc of docs) walk(doc, '');

  const result = Object.entries(fields).map(([path, info]) => {
    const types = Object.entries(info.types)
      .map(([name, count]) => ({ name, count, percent: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);
    return {
      path,
      types,
      percentPresent: Math.round((info.count / total) * 100),
    };
  });

  result.sort((a, b) => (a.path > b.path ? 1 : -1));
  return { sampleSize: total, fields: result };
}

module.exports = { inferSchema };
