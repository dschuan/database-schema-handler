const assert = require('assert');
const SimpleSchema = require('simpl-schema').default;
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');

const dbData = require('./get-database-info');
const getCollectionName = require('./handle-collection-data');
const getSchema = require('./format-schema').toSchema;

const validateFromSchema = (async (db, colName) => {
  console.log(`Validating ${colName}...`);
  let schema = getSchema(colName);
  schema = new SimpleSchema(schema).newContext();
  const col = db.collection(colName);
  const r = await col.find({}).toArray();
  const results = r.map((doc) => {
    schema.validate(doc);
    const res = {};
    res['isValid'] = schema.isValid();
    if (!schema.isValid()) {
      res['errors'] = schema.validationErrors();
    }
    return res;
  });
  console.log('Complete');
  return results;
});

const exportResults = (async (dir, results) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const content = JSON.stringify(results, null, 2);
  const filePath = `${dir}/results.json`;
  await fs.writeFile(filePath, content, (err) => {
    assert.equal(err);
    console.log('Results saved');
  });
});
module.exports = (async () => {
  const url = dbData.url;
  const dbName = dbData.dbName;
  let client;
  let documents = {date: new Date().toISOString()};
  try {
    client = await MongoClient.connect(url, {useNewUrlParser: true});

    const db = client.db(dbName);

    collections = await db.command({'listCollections': 1});
    collections = getCollectionName(collections);
    // console.log(collections);
    for (let i = 0; i < collections.length; i++) {
      const res = await validateFromSchema(db, collections[i]);
      documents[collections[i]] = res;
    }
    console.log(documents);
    await exportResults('./res', 'documents');
  } catch (error) {
    if (error) {
      console.log(error.stack);
    }
  }
  if (client) {
    client.close();
  }
});
