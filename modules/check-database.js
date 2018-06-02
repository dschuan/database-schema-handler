const assert = require('assert');
const SimpleSchema = require('simpl-schema').default;
const MongoClient = require('mongodb').MongoClient;
const dbData = require('./get-database-info');
const getCollectionName = require('./handle-collection-data');

const formatSchema = (currentKey, into, target) => {
  for (let i in into) {
    if (into.hasOwnProperty(i)) {
      let newKey = i;
      let newVal = into[i];
      const optional = newVal.optional;
      const type = newVal.type;
      delete newVal.optional;
      delete newVal.type;
      console.log(newVal);
      if (currentKey.length > 0) {
        newKey = `${currentKey}.${i}`;
      }
      if (!(Object.keys(newVal).length === 0 &&
      newVal.constructor === Object)) {
        target[newKey] = {
          optional,
          type,
        };
        formatSchema(newKey, newVal, target);
      } else {
        newVal['optional'] = optional;
        newVal['type'] = type;
        target[newKey] = newVal;
      }
    }
  }
};

const getSchema = (colName) => {
  let schema = require(`../schemas/${colName}.json`);
  let res = {};
  formatSchema('', schema, res);
  return res;
};

module.exports = (async function() {
  const url = dbData.url;
  const dbName = dbData.dbName;
  const testCollection = 'rocketchat_apps';
  let client;
  let documents;
  try {
    client = await MongoClient.connect(url, {useNewUrlParser: true});

    const db = client.db(dbName);

    collections = await db.command({'listCollections': 1});
    collections = getCollectionName(collections);
    // console.log(collections);
    let schema = getSchema(testCollection);
    console.log(schema);
    schema = new SimpleSchema(schema);
    const col = db.collection(testCollection);
    const r = await col.find({});
    await r.forEach((doc) => {
      documents.push(doc);
      console.log(doc);
    });
  } catch (error) {
    if (error) {
      console.log(error.stack);
    }
  }
  if (client) {
    client.close();
  }
});
