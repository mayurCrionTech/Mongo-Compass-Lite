const { EJSON } = require('bson');
const { ObjectId } = require('mongodb');

// Parse a user-typed query/filter/sort/doc string (Mongo shell-ish JSON, allows
// {"_id": "..."} plain strings too) into a real JS object with proper BSON types.
function parseEjson(str) {
  if (str === undefined || str === null || str === '') return {};
  if (typeof str === 'object') return str;

  let text = String(str).trim();
  if (!text) return {};

  // Allow convenience syntax: ObjectId("...") -> {"$oid": "..."}
  text = text.replace(/ObjectId\(\s*"([a-fA-F0-9]{24})"\s*\)/g, '{"$oid":"$1"}');
  text = text.replace(/ISODate\(\s*"([^"]+)"\s*\)/g, '{"$date":"$1"}');

  try {
    return EJSON.parse(text, { relaxed: true });
  } catch (e) {
    // fall back to plain JSON.parse for simple cases
    try {
      return JSON.parse(text);
    } catch (e2) {
      const err = new Error(`Invalid JSON/EJSON: ${e.message}`);
      err.status = 400;
      throw err;
    }
  }
}

function toEjsonString(doc) {
  return EJSON.stringify(doc, null, 2, { relaxed: true });
}

function tryObjectId(id) {
  try {
    return new ObjectId(id);
  } catch (e) {
    return id; // fall back to raw id (string/number ids are valid too)
  }
}

module.exports = { parseEjson, toEjsonString, tryObjectId };
