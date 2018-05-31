const assert = require('assert')
const MongoClient = require('mongodb').MongoClient;
const dbData = require('./get-database-info');
const getCollectionName = require('./handle-collection-data');


module.exports = (async function() {
  const url = dbData.url;
  const dbName = dbData.dbName;

  let client;
  let documents;
  try {
    client = await MongoClient.connect(url, {useNewUrlParser: true});

    const db = client.db(dbName);

    collections = await db.command({'listCollections': 1});
    collections = getCollectionName(collections);
    console.log(collections);
    const col = db.collection('rocketchat_apps');
    const r = await col.find({});
    while (await r.hasNext()) {
      documents = r.next();
      console.log(documents);
    }
  } catch (error) {
    if (error) {
      console.log(error.stack);
    }
  }
  if (client) {
    client.close();
  }
});
