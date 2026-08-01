const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

// Ensure data folder exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-memory cache loaded from / saved to db.json
let dbData = {};
try {
  if (fs.existsSync(DB_FILE)) {
    dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  }
} catch (err) {
  console.error('Error loading mock database, initializing empty:', err);
  dbData = {};
}

const saveDB = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving mock database:', err);
  }
};

// Map of foreign keys to their ref collections
const REF_MAPPINGS = {
  ownerUserId: 'User',
  tenantUserId: 'User',
  raisedBy: 'User',
  assignedTo: 'User',
  tenantId: 'User',
  ownerId: 'User',
  recordedBy: 'User',
  sender: 'User',
  receiver: 'User',
  postedBy: 'User',
  requestedBy: 'User'
};

// Helper to generate 24-char hex ObjectID
const generateId = () => {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

// Deep clone helper
const clone = (obj) => {
  if (obj === null || obj === undefined) return obj;
  return JSON.parse(JSON.stringify(obj));
};

// Check if document matches query
const matchQuery = (doc, query) => {
  if (!query) return true;

  // Handle $or
  if (query.$or && Array.isArray(query.$or)) {
    return query.$or.some(subQuery => matchQuery(doc, subQuery));
  }

  // Handle $and
  if (query.$and && Array.isArray(query.$and)) {
    return query.$and.every(subQuery => matchQuery(doc, subQuery));
  }

  for (const key in query) {
    if (key === '$or' || key === '$and') continue;

    const val = query[key];
    const docVal = doc[key];

    // Operator objects ($in, $ne, $regex, ...)
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if (val.$in !== undefined) {
        const list = Array.isArray(val.$in) ? val.$in.map(String) : [];
        if (!list.includes(String(docVal))) {
          return false;
        }
        continue;
      }
      if (val.$nin !== undefined) {
        const list = Array.isArray(val.$nin) ? val.$nin.map(String) : [];
        if (list.includes(String(docVal))) {
          return false;
        }
        continue;
      }
      if (val.$ne !== undefined) {
        if (String(docVal) === String(val.$ne)) {
          return false;
        }
        continue;
      }
      if (val.$regex !== undefined) {
        const flags = val.$options || '';
        const regex = new RegExp(val.$regex, flags);
        if (!regex.test(String(docVal || ''))) {
          return false;
        }
        continue;
      }
    }

    // Direct match (handling ObjectIds as strings)
    const strVal = val === null || val === undefined ? '' : String(val);
    const strDocVal = docVal === null || docVal === undefined ? '' : String(docVal);
    if (strVal !== strDocVal) {
      return false;
    }
  }

  return true;
};

// Run hooks for a schema
const runHooks = async (schema, hookName, doc) => {
  if (schema && schema.hooks && schema.hooks[hookName]) {
    for (const fn of schema.hooks[hookName]) {
      await new Promise((resolve, reject) => {
        try {
          fn.call(doc, (err) => {
            if (err) reject(err);
            else resolve();
          });
        } catch (e) {
          reject(e);
        }
      });
    }
  }
};

// Document wrapper that adds Mongoose methods like .save() and .toObject()
const wrapDoc = (modelName, schema, rawDoc) => {
  if (!rawDoc) return null;
  const doc = applyDefaults(rawDoc, schema);

  // Define save method
  Object.defineProperty(doc, 'save', {
    value: async function() {
      // Run pre-validate and pre-save hooks
      await runHooks(schema, 'validate', this);
      await runHooks(schema, 'save', this);

      if (!dbData[modelName]) dbData[modelName] = [];
      const idx = dbData[modelName].findIndex(d => String(d._id) === String(this._id));
      
      const cleanDoc = {};
      Object.keys(this).forEach(k => {
        if (typeof this[k] !== 'function') {
          cleanDoc[k] = this[k];
        }
      });

      if (idx !== -1) {
        dbData[modelName][idx] = cleanDoc;
      } else {
        dbData[modelName].push(cleanDoc);
      }
      saveDB();
      return this;
    },
    enumerable: false
  });

  Object.defineProperty(doc, 'toObject', {
    value: function() {
      const obj = {};
      Object.keys(this).forEach(k => {
        if (typeof this[k] !== 'function') {
          obj[k] = this[k];
        }
      });
      return obj;
    },
    enumerable: false
  });

  return doc;
};

class Query {
  constructor(modelName, schema, initDocsPromise) {
    this.modelName = modelName;
    this.schema = schema;
    this.initDocsPromise = initDocsPromise;
    this.populates = [];
    this.selectStr = null;
    this.sortObj = null;
    this.skipNum = 0;
    this.limitNum = null;
  }

  populate(path, select) {
    this.populates.push({ path, select });
    return this;
  }

  select(selectStr) {
    this.selectStr = selectStr;
    return this;
  }

  sort(sortVal) {
    if (typeof sortVal === 'string') {
      if (sortVal.startsWith('-')) {
        this.sortObj = { [sortVal.slice(1)]: -1 };
      } else {
        this.sortObj = { [sortVal]: 1 };
      }
    } else {
      this.sortObj = sortVal;
    }
    return this;
  }

  skip(n) {
    this.skipNum = Number(n) || 0;
    return this;
  }

  limit(n) {
    this.limitNum = Number(n) || null;
    return this;
  }

  async exec() {
    let docs = await this.initDocsPromise;
    if (!Array.isArray(docs)) {
      if (!docs) return null;
      docs = [docs];
    }

    // Sort
    if (this.sortObj) {
      const keys = Object.keys(this.sortObj);
      if (keys.length > 0) {
        const key = keys[0];
        const dir = this.sortObj[key];
        docs.sort((a, b) => {
          const valA = a[key] || '';
          const valB = b[key] || '';
          if (valA < valB) return dir === 1 ? -1 : 1;
          if (valA > valB) return dir === 1 ? 1 : -1;
          return 0;
        });
      }
    }

    // Skip
    if (this.skipNum > 0) {
      docs = docs.slice(this.skipNum);
    }

    // Limit
    if (this.limitNum !== null) {
      docs = docs.slice(0, this.limitNum);
    }

    // Populate
    for (const pop of this.populates) {
      const refModel = REF_MAPPINGS[pop.path];
      if (!refModel || !dbData[refModel]) continue;

      docs.forEach(doc => {
        const foreignId = doc[pop.path];
        if (foreignId) {
          const refDoc = dbData[refModel].find(r => String(r._id) === String(foreignId));
          if (refDoc) {
            let populated = clone(refDoc);
            // Apply select filter if any
            if (pop.select) {
              const isExclude = pop.select.includes('-');
              const selectFields = pop.select.split(' ').map(s => s.trim()).filter(Boolean);
              
              if (isExclude) {
                const excludeKeys = selectFields.map(s => s.replace('-', ''));
                const filtered = {};
                Object.keys(populated).forEach(k => {
                  if (!excludeKeys.includes(k)) {
                    filtered[k] = populated[k];
                  }
                });
                populated = filtered;
              } else {
                const filtered = { _id: populated._id };
                selectFields.forEach(f => {
                  if (populated[f] !== undefined) {
                    filtered[f] = populated[f];
                  }
                });
                populated = filtered;
              }
            }
            doc[pop.path] = populated;
          }
        }
      });
    }

    // Select fields on root doc
    if (this.selectStr) {
      const selectFields = this.selectStr.split(' ').map(s => s.trim()).filter(Boolean);
      const isExclude = selectFields.some(s => s.startsWith('-'));

      docs = docs.map(doc => {
        if (isExclude) {
          const excludeKeys = selectFields
            .filter(s => s.startsWith('-'))
            .map(s => s.slice(1));
          const filtered = {};
          Object.keys(doc).forEach(k => {
            if (!excludeKeys.includes(k)) {
              filtered[k] = doc[k];
            }
          });
          return wrapDoc(this.modelName, this.schema, filtered);
        } else {
          const filtered = { _id: doc._id };
          selectFields.forEach(f => {
            if (doc[f] !== undefined) {
              filtered[f] = doc[f];
            }
          });
          return wrapDoc(this.modelName, this.schema, filtered);
        }
      });
    } else {
      docs = docs.map(doc => wrapDoc(this.modelName, this.schema, doc));
    }

    // If query was for findOne/findById (which initially passed single object instead of array), return single
    const originalDocs = await this.initDocsPromise;
    if (!Array.isArray(originalDocs)) {
      return docs[0] || null;
    }

    return docs;
  }

  // Allow awaiting the query directly
  then(onResolve, onReject) {
    return this.exec().then(onResolve, onReject);
  }
}

function applyDefaults(data, schema) {
  if (!schema || !schema.definition) return data;
  const res = clone(data) || {};
  for (const key in schema.definition) {
    if (res[key] === undefined) {
      const field = schema.definition[key];
      if (field && typeof field === 'object' && !Array.isArray(field)) {
        if (field.default !== undefined) {
          if (typeof field.default === 'function') {
            res[key] = field.default();
          } else {
            res[key] = clone(field.default);
          }
        }
      }
    }
  }
  return res;
}

const createModel = (name, schema) => {
  if (!dbData[name]) {
    dbData[name] = [];
  }

  class MockModel {
    constructor(data) {
      const defaulted = applyDefaults(data, schema);
      Object.assign(this, defaulted);
      if (!this._id) {
        this._id = generateId();
      }
      this.createdAt = this.createdAt || new Date();
      wrapDoc(name, schema, this);
    }

    static find(query = {}) {
      const list = dbData[name].filter(doc => matchQuery(doc, query));
      return new Query(name, schema, Promise.resolve(clone(list)));
    }

    static findOne(query = {}) {
      const doc = dbData[name].find(doc => matchQuery(doc, query));
      return new Query(name, schema, Promise.resolve(doc ? clone(doc) : null));
    }

    static findById(id) {
      const doc = dbData[name].find(d => String(d._id) === String(id));
      return new Query(name, schema, Promise.resolve(doc ? clone(doc) : null));
    }

    static async create(data) {
      const createDoc = async (item) => {
        const doc = applyDefaults(item, schema);
        if (!doc._id) {
          doc._id = generateId();
        }
        doc.createdAt = doc.createdAt || new Date();

        // Run pre-validate and pre-save hooks
        const wrapped = wrapDoc(name, schema, doc);
        await runHooks(schema, 'validate', wrapped);
        await runHooks(schema, 'save', wrapped);

        // Update doc values with what hook modified
        const finalDoc = wrapped.toObject();
        dbData[name].push(finalDoc);
        return wrapDoc(name, schema, finalDoc);
      };

      let result;
      if (Array.isArray(data)) {
        result = [];
        for (const item of data) {
          result.push(await createDoc(item));
        }
      } else {
        result = await createDoc(data);
      }
      saveDB();
      return result;
    }

    static async findByIdAndUpdate(id, update, options = {}) {
      const idx = dbData[name].findIndex(d => String(d._id) === String(id));
      if (idx === -1) return null;

      const current = dbData[name][idx];
      const updated = clone(current);

      const updatePayload = update.$set || update;
      Object.keys(updatePayload).forEach(k => {
        updated[k] = updatePayload[k];
      });

      dbData[name][idx] = updated;
      saveDB();

      const returnDoc = options.new ? updated : current;
      return wrapDoc(name, schema, clone(returnDoc));
    }

    static async findByIdAndDelete(id) {
      const idx = dbData[name].findIndex(d => String(d._id) === String(id));
      if (idx === -1) return null;
      const doc = dbData[name][idx];
      dbData[name].splice(idx, 1);
      saveDB();
      return wrapDoc(name, schema, clone(doc));
    }

    static async findOneAndDelete(query) {
      const idx = dbData[name].findIndex(doc => matchQuery(doc, query));
      if (idx === -1) return null;
      const doc = dbData[name][idx];
      dbData[name].splice(idx, 1);
      saveDB();
      return wrapDoc(name, schema, clone(doc));
    }

    static async deleteMany(query = {}) {
      const initialCount = dbData[name].length;
      dbData[name] = dbData[name].filter(doc => !matchQuery(doc, query));
      saveDB();
      return { deletedCount: initialCount - dbData[name].length };
    }

    static async deleteOne(query = {}) {
      const idx = dbData[name].findIndex(doc => matchQuery(doc, query));
      if (idx !== -1) {
        dbData[name].splice(idx, 1);
        saveDB();
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    }

    static async countDocuments(query = {}) {
      const list = dbData[name].filter(doc => matchQuery(doc, query));
      return list.length;
    }
  }

  return MockModel;
};

// Schema constructor supporting pre hooks
function MockSchema(definition) {
  this.definition = definition;
  this.hooks = {};
  this.pre = function(hookName, fn) {
    if (!this.hooks[hookName]) {
      this.hooks[hookName] = [];
    }
    this.hooks[hookName].push(fn);
    return this;
  };
}

const mongooseMock = {
  Schema: MockSchema,
  model: createModel,
  connect: async (uri, options) => {
    console.log('📡 Connected to Mock database (using local JSON file)');
    return mongooseMock;
  },
  connection: {
    close: async () => {
      console.log('📡 Mock database connection closed');
    },
    host: 'mock-local-json-db'
  },
  Types: {
    ObjectId: (id) => id || generateId()
  }
};

mongooseMock.Schema.Types = {
  ObjectId: String
};

module.exports = mongooseMock;
