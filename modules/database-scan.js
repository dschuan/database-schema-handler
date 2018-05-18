/*
This module connects to the database, then scans it for a list of collections
*/
const axios = require('axios');
const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;

const dbData = require('./get-database-info');

let collections = [];

const findDocs = (db, callback) => {
  const collection = db.collection('rocketchat_message');
  collection.find({}).toArray(function(err, docs) {
    assert.equal(null, err);

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

module.exports = (callback) => {
  const url = dbData.url;
  const dbName = dbData.dbName;

  MongoClient.connect(url, {useNewUrlParser: true}, function(err, client){
    //tests initial connection to server
    assert.equal(null, err);
    console.log("Connected successfully to server.");

    const db = client.db(dbName);

    findCollections(db, function(res) {
      callback(res);
      client.close();
    })
  })
}
