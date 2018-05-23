const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;

const dbData = require('./get-database-info');



//returns all collection names in database
const getCollectionName = (rawData) => {
  let collectionList = rawData.cursor.firstBatch
  collectionList = collectionList.map((collection) => {
    return collection.name
  })
  return collectionList
}


module.exports = (async function() {
  const url = dbData.url;
  const dbName = dbData.dbName;

  let client;
  let collections = [];
  let schema;

  try {
    client = await MongoClient.connect(url, {useNewUrlParser: true});

    const db = client.db(dbName);

    collections = await db.command({'listCollections': 1});
    collections = getCollectionName(collections);

    let mr = await db.collection('rocketchat_message').mapReduce(
      function() {
        //recursive function to obtain all sub fields of an object, where applicable
        const getSubField = function(obj, baseField) {
          emit(baseField, null)
          if (typeof obj === 'object') {
            for (var key in obj) {
              getSubField(obj[key], baseField + '.' + key)
            }
          }
        }

        for (var key in this) {
          emit(key, null)

          getSubField(this[key], key)


        }
      },
      function(key, val) {
        return typeof val
      },
      {"out": "rocketchat_message" + "_keys"}
    );

    schema = await mr.find({}).toArray();
    console.log(schema)


    //console.log(collections);
  } catch (err) {
    console.log(err.stack);
  }

  if (client) {
    client.close()
  }
})
