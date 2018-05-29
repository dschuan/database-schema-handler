const assert = require('assert')
const MongoClient = require('mongodb').MongoClient;
const dbData = require('./get-database-info');
const getCollectionName = require('./handle-collection-data');


module.exports = (async function() {

  try {
    client = await MongoClient.connect(url, {useNewUrlParser: true});

    const db = client.db(dbName);

    collections = await db.command({'listCollections': 1});
    collections = getCollectionName(collections);
  }
  if (client) {
    client.close()
  })
})
