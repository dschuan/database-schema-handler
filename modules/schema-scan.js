const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
const dbData = require('./get-database-info');
const getCollectionName = require('./handle-collection-data');
const buildSchema = require('./format-schema').buildSchema;

// TODO: Run test on _raix_push_notification

// contains the function that executes the Map Reduce function on a collection,
// then builds the schema
const buildSchemaFromCollection = async function(db, collectionName) {
  let mr = await db.collection(collectionName).mapReduce(
    function() {
      // recursive function to obtain all sub fields of an object,
      // where applicable
      const getSubField = function(obj, baseField) {
        if (Array.isArray(obj) || typeof obj === 'function') {
          emit(baseField, obj);
        } else {
          emit(baseField, typeof obj);
        };
        if (typeof obj === 'object') {
          for (let key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                getSubField(obj[key], baseField + '.' + key);
            }
          }
        }
      };
      for (let key in this) {
        if (this[key]) {
          if (!!(this[key].constructor.name)) {
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

          if (val.length > 1) {
            const output = val.reduce(function(prev, next) {
              return prev + '/' + next;
            });
            return 'Array.' + output;
          } else {
            return 'Array.' + val[0];
          }
        } else {
          if (typeof val === 'function') {
            return val.constructor.name;
          } else {
            return val;
          }
        }
      }
    },
    {'out': 'rocketchat_message' + '_keys'}
  );

  schema = await mr.find({}).toArray();
  const keys = schema.map((key) => {
    return key._id;
  });
  // block of code below written so that it is synchronous,
  // and each element of array is handled one after another
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const count = await db.collection(collectionName)
      .find({[key]: {$exists: false}}).count();
    const isOptional = (count > 0);
    schema.forEach((obj) => {
      if (obj._id === key) {
        obj.isOptional = isOptional;
      }
    });
  }
  schema = buildSchema(schema);
  await mr.drop();

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
    }
  } catch (err) {
    console.log(err.stack);
  }

  if (client) {
    client.close();
  }
});
