# database-schema-builder

This is a Node module specifically built to handle Mongo databases in Meteor.js projects

----
### Requirements
- Used on Meteor projects
- Only supports MongoDB 3.x
- Only supports Node.js <= 6.x

### Set up instructions

- Clone this repository into your local directory
- Navigate to the directory
- run `meteor npm install` to install the relevant packages
- Run `meteor node index.js`

### Usage

- Key in your MongoDB details:
![Key in DB details](https://snag.gy/RPbujV.jpg)

There are two functions, one to generate schema, and the other to check documents against the schemas generated.
![Select function](https://snag.gy/otzkOQ.jpg)

- Your schemas are output in `./schemas` from the root directory of this folder in JSON format.

Generate the schemas first before performing any validation.
The validation errors are logged in the console if documents have structural issues.

