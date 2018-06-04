const schemaGenerator = require('./modules/schema-scan');
const dbChecker = require('./modules/check-database');

const rl = require('readline-sync');
let url = rl.question('Key 1 to generate schema, 2 to check database');

if (url === '1') {
  schemaGenerator();
} else if (url === '2') {
  const dbRes = dbChecker();
  console.log(dbRes);
} else {
  console.log('exiting');
}
