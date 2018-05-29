/*
TODO: Find way to determine url and dbname dynamically
*/
const rl = require('readline-sync');
let url = rl.question('Please key in url of your MongoDB:');
url = url.replace('mongodb://', '');

const username = rl.question('Please key in username, if applicable');
const password = (username !== '') ?
  rl.question('Please key in password, if applicable') : null;
const authMechanism = 'DEFAULT';
const dbName = rl.question('Key in your database name: (Default "meteor")');

url = (username !== '') ?
  `mongodb://${username}:${password}@${url}?authMechanism=${authMechanism}` :
  `mongodb://${url}`;

module.exports.dbName = (dbName === '') ? 'meteor' : dbName;
module.exports.url = url;

// mongodb://127.0.0.1:3001/meteor
