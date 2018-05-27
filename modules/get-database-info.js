/*
TODO: Find way to determine url and dbname dynamically
*/
const rl = require('readline-sync');
module.exports.url = rl.question("Please key in url of your MongoDB:");
const dbName = rl.question("Key i;n your database name: (Default 'meteor')");
console.log(dbName)
module.exports.dbName = (dbName === '') ? "meteor" : dbName;

const url = "mongodb://127.0.0.1:3001/meteor";
