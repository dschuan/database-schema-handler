const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;

const dbData = require('./get-database-info');



//returns all collection names in database
const getCollectionName = (rawData) => {
  let collectionList = rawData.cursor.firstBatch
  collectionList = collectionList.map((collection) => {
    return collection.name;
  })
  return collectionList
}

const buildSchema = (schema) => {
  let sortedSchema = schema.map((element) => {
    const field = element._id.split('.');
    element._id = field;
    return element
  })
  sortedSchema = sortedSchema.filter((obj) => {
    let fields = obj._id;
    if (!fields.includes('tojson')) {
      return obj
    }
  })
  let res = {};
  sortedSchema.forEach((obj) => {
    let fields = obj._id;
    const dataType = obj.value;
    const isOptional = obj.isOptional;
    const fieldIndent = fields.length;
    if (fieldIndent > 1) {
      const childField = fields.pop();
      const baseField = fields.reduce((prev, curr) => {
        prev + curr;
      });
      res[baseField][childField] = { dataType, isOptional }
    } else {
      res[fields[0]] = {dataType, isOptional}
    }

  })
  return res;
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
    const keys = schema.map((key) => {
      return key._id
    })
    /*block of code below written so that it is synchronous,
    and each element of array is handled one after another*/
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const count = await db.collection('rocketchat_message').find({ [key]: {$exists: false}}).count();
      const isOptional = (count > 0)
      schema.forEach((obj) => {
        if (obj._id === key) {
          obj.isOptional = isOptional;
        }
      })

    }
    schema = buildSchema(schema)
    console.log(schema)

    await mr.drop()

    //console.log(collections);
  } catch (err) {
    console.log(err.stack);
  }

  if (client) {
    client.close()
  }
})
