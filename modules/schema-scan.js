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
          if (Array.isArray(obj) || typeof obj === 'function') {
            emit(baseField, obj)
          } else {
            emit(baseField, typeof obj)
          };
          if (typeof obj === 'object') {
            for (var key in obj) {
              getSubField(obj[key], baseField + '.' + key)
            }
          }
        }

        for (var key in this) {
          if (!!(this[key].constructor.name)) {
            emit(key, this[key].constructor.name)
          } else {
            emit(key, this[key])
          }

          getSubField(this[key], key)


        }
      },
      function(key, value) {
        if (Array.isArray(value)) {
          let val = value[0];
          if (Array.isArray(val)) {
            val = val.map(function(v) {
              return typeof v
            });
            val.filter(function(res, index, self) {
              return self.indexOf(res) === index;
            })

            if (val.length > 1) {
              const output = val.reduce(function(prev, next) {
                return prev + '/' + next;
              })
              return "Array." + output;
            } else {
              return "Array." + val[0]
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
      {"out": "rocketchat_message" + "_keys"}
    );

    schema = await mr.find({}).toArray();
    await mr.drop()
    console.log(schema)

    //console.log(collections);
  } catch (err) {
    console.log(err.stack);
  }

  if (client) {
    client.close()
  }
})
