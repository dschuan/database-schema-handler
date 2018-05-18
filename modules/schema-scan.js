const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;

const dbscan = require('./database-scan');
const dbData = require('./get-database-info');

const findDocs = (db, callback) => {
  const collection = db.collection('rocketchat_message');
  collection.find({}).toArray(function(err, docs) {
    assert.equal(null, err);
    console.log("Found records: ");
    console.log(docs);
    callback(docs);
  })
}



module.exports = () => {
  dbscan(function(res) {
    console.log(res)

    MongoClient.connect(dbData.url, {useNewUrlParser: true}, function(err, client){
      assert.equal(null, err);
      const db = client.db(dbData.dbName);
      findDocs(db, function(doc) {
        console.log(doc);
        client.close();
      })
    })
  })

}
