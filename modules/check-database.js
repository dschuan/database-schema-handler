const assert = require('assert');
const SimpleSchema = require('simpl-schema').default;
const MongoClient = require('mongodb').MongoClient;

const dbData = require('./get-database-info');
const getCollectionName = require('./handle-collection-data');
const getSchema = require('./format-schema').toSchema;

module.exports = (async function() {
  const url = dbData.url;
  const dbName = dbData.dbName;
  const testCollection = 'rocketchat_apps';
  let client;
  let documents = [];
  try {
    client = await MongoClient.connect(url, {useNewUrlParser: true});

    const db = client.db(dbName);

    collections = await db.command({'listCollections': 1});
    collections = getCollectionName(collections);
    // console.log(collections);
    let schema = getSchema(testCollection);
    console.log(schema);
    schema = new SimpleSchema(schema).newContext();
    const col = db.collection(testCollection);
    const r = await col.find({}).toArray();
    console.log(r);
    documents = r.map((doc) => {
      schema.validate(doc);
      const res = {};
      console.log(schema.isValid());
      console.log(schema.validationErrors());
      res['isValid'] = schema.isValid();
      if (!schema.isValid()) {
        res['errors'] = schemas.validationErrors();
      }
      return res;
    });
    return documents;
  } catch (error) {
    if (error) {
      console.log(error.stack);
    }
  }
  if (client) {
    client.close();
  }
});
