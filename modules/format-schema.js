
const formatToSchema = (currentKey, into, target) => {
  for (let i in into) {
    if (into.hasOwnProperty(i)) {
      let newKey = i;
      let newVal = into[i];
      const optional = newVal.optional;
      const type = newVal.type;
      delete newVal.optional;
      delete newVal.type;
      console.log(newVal);
      if (currentKey.length > 0) {
        newKey = `${currentKey}.${i}`;
      }
      if (!(Object.keys(newVal).length === 0 &&
      newVal.constructor === Object)) {
        target[newKey] = {
          optional,
          type,
        };
        formatToSchema(newKey, newVal, target);
      } else {
        newVal['optional'] = optional;
        newVal['type'] = type;
        target[newKey] = newVal;
      }
    }
  }
};

module.exports.buildSchema = (schema) => {
  let sortedSchema = schema.map((element) => {
    const field = element._id.split('.');
    element._id = field;
    return element;
  });
  sortedSchema = sortedSchema.filter((obj) => {
    let fields = obj._id;
    if (!fields.includes('tojson')) {
      return obj;
    }
  });
  let res = {};
  sortedSchema.forEach((obj) => {
    let fields = obj._id;
    const type = typeof obj.value !== 'string' ? obj.value :
      obj.value.replace(/\b\w/g, (c) => c.toUpperCase());
    const optional = obj.isOptional;
    const fieldIndent = fields.length;
    if (fieldIndent > 1) {
      const childField = fields.pop();
      const baseField = !(fields.length > 0) ?
        null : fields.reduce((prev, curr) => {
          prev + curr;
        });
      if (baseField) {
        res[baseField][childField] = {type, optional};
      } else {
        res[childField] = {type, optional};
      }
    } else {
      res[fields[0]] = {type, optional};
    }
  });
  return res;
};

module.exports.toSchema = (colName) => {
  let schema = require(`../schemas/${colName}.json`);
  let res = {};
  formatToSchema('', schema, res);
  return res;
};
