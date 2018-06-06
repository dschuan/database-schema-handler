const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
const dbData = require('./get-database-info');
const getCollectionName = require('./handle-collection-data');
const buildSchema = require('./format-schema').buildSchema;

// this function extracts keys that are actually array elements but have
// been corrupted
const keyPartOfArray = (arrayKeys, key) => {
  // key is actually an array element
  return arrayKeys.some((v) => {
    return (key.indexOf(v) > -1);
  });
};

const inputIsEmptyArray = (input) => {
  return Array.isArray(input) && input.length === 0;
};
const keyIsNotType = (key) => {
  const res = key.split('.');
  return res.indexOf('type') === -1;
};

const nullButArray = (key, schemaObj, keys) => {
  const typeNull = !schemaObj[key];
  const isRoot = key.split('.').length === 1;
  const matchingKeys = keys.filter((k) => {
    return k === key;
  });
  const hasChildren = matchingKeys.length !== 1;
  return typeNull && isRoot && hasChildren;
};
// this function deals with corrupted data and
// then returns the keys of the normalized schema
const returnKeys = (schema) => {
  const schemaAsObject =
  schema.reduce((obj, item) => (obj[item._id] = item.value, obj), {});
  const keyArray = schema.map((obj) => {
    const terms = obj._id.split('.');
    return terms[0];
  });
  let arrayKeys = [];
  schema.forEach((key) => {
    if (key.value) {
      if (key.value === 'Array') {
        arrayKeys.push(key);
      } else if (inputIsEmptyArray(key.value)) {
        key['value'] = 'Array';
        arrayKeys.push(key);
      }
    } else {
      if (nullButArray(key._id, schemaAsObject, keyArray)) {
        key['value'] = 'Array';
        arrayKeys.push(key);
      }
    }
  });
  schema = schema.map((key) => {
    const isObject =
    Array.isArray(key.value) && key.value.length === 1;
    if (isObject) {
      key['value'] = 'Object';
      return key;
    } else {
      return key;
    }
  });
  arrayKeys = arrayKeys.map((key) => {
    return key._id;
  });
  let keys = schema.map((key) => {
    return key._id;
  });
  keys = keys.filter((key) => {
    if (!keyPartOfArray(arrayKeys, key)) {
      return key;
    }
  });
  keys = keys.concat(arrayKeys);
  return keys;
};

// contains the function that executes the Map Reduce function on a collection,
// then builds the schema
const buildSchemaFromCollection = async function(db, collectionName) {
  let mr = await db.collection(collectionName).mapReduce(
    function() {
      // recursive function to obtain all sub fields of an object,
      // where applicable
      const getSubField = function(obj, baseField) {
        if (Array.isArray(obj) || typeof obj === 'function') {
          emit(baseField, typeof obj);
        } else if (typeof obj === 'object') {
          for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
              emit(baseField, typeof obj);
              getSubField(obj[key], baseField + '.' + key);
            }
          }
        } else {
          emit(baseField, typeof obj);
        };
      };
      for (let key in this) {
        if (this[key]) {
          if (this[key].constructor.name) {
            emit(key, this[key].constructor.name);
          } else {
            emit(key, this[key]);
          }

          getSubField(this[key], key);
        } else {
          emit(key, null);
        }
      }
    },
    function(key, value) {
      if (Array.isArray(value)) {
        let val = value[0];
        if (Array.isArray(val)) {
          val = val.map(function(v) {
            return typeof v;
          });
          val.filter(function(res, index, self) {
            return self.indexOf(res) === index;
          });
          const output = val[0];
          return 'Array.' + output;
        } else {
          if (typeof val === 'function') {
            return val.constructor.name;
          } else {
            return typeof val;
          }
        }
      } else {
        return typeof val;
      }
    },
    {'out': 'rocketchat_message' + '_keys'}
  );

  let schema = await mr.find({}).toArray();
  const keys = returnKeys(schema);
  // block of code below written so that it is synchronous,
  // and each element of array is handled one after another
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const count = await db.collection(collectionName)
      .find({[key]: {$exists: false}}).count();
    const optional = (count > 0);
    schema.forEach((obj) => {
      if (obj._id === key) {
        obj.optional = optional;
      }
    });
  }

  schema = schema.filter((obj) => {
    if (obj.hasOwnProperty('optional') && keyIsNotType(obj._id)) {
      return obj;
    }
  });
  await mr.drop();
  schema = buildSchema(schema);
  return schema;
};

// exports the final json schema into a /schema folder
const exportSchema = async (schema, collection, dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const content = JSON.stringify(schema, null, 2);
  const filePath = `${dir}/${collection}.json`;
  await fs.writeFile(filePath, content, (err) => {
    assert.equal(err);
    console.log('Saving file at ' + collection);
  });
};


// main function to be exported
module.exports = (async function() {
  const url = dbData.url;
  const dbName = dbData.dbName;
  const pathName = './schemas';
  let client;
  let collections = [];

  try {
    client = await MongoClient.connect(url, {useNewUrlParser: true});

    const db = client.db(dbName);

    collections = await db.command({'listCollections': 1});
    collections = getCollectionName(collections);

    for (let i = 0; i < collections.length; i++) {
      const col = collections[i];
      const schema = await buildSchemaFromCollection(db, col);
      await exportSchema(schema, col, pathName);
    };
    // const test = await
    // buildSchemaFromCollection(db, 'rocketchat_message');
  } catch (err) {
    console.log(err.stack);
  }

  if (client) {
    client.close();
  }
});
