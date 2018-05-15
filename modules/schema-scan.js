const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;

const findDocs = (db, callback) => {
  const collection = db.collection('rocketchat_message');
  collection.find({}).toArray(function(err, docs) {
    assert.equal(null, err);
    console.log("Found records: ");
    console.log(docs);
    callback(docs);
  })
}

//returns all collection names in database
const findCollections = (db, callback) => {
  db.command({'listCollections': 1}, function(err, col) {
    assert.equal(null, err);
    let collectionList = col.cursor.firstBatch;
    collectionList = collectionList.map((collection) => {
      return collection.name;
    });
    callback(collectionList);
  })
}

module.exports = () => {
  const url = "mongodb://127.0.0.1:3001/meteor";
  const dbName = "meteor";
  let collections = [];

  MongoClient.connect(url, {useNewUrlParser: true}, function(err, client){
    //tests initial connection to server
    assert.equal(null, err);
    console.log("Connected successfully to server.");


    const db = client.db(dbName);

    findCollections(db, function(res) {
      collections = res;
      console.log(collections);
    })

    findDocs(db, function() {
      client.close();
    });

  })

  console.log("test")
}
