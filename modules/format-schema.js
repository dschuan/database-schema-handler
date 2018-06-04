const formatToSchema = (currentKey, into, target) => {
  for (let i in into) {
    if (into.hasOwnProperty(i)) {
      let newKey = i;
      let newVal = into[i];
      const optional = newVal.optional;
      const type = newVal.type;
      delete newVal.optional;
      delete newVal.type;
      if (currentKey.length > 0) {
        newKey = `${currentKey}.${i}`;
      }
      if (!(Object.keys(newVal).length === 0 &&
      newVal.constructor === Object)) {
        const val = type ? {optional, type} : {optional};
        target[newKey] = val;
        formatToSchema(newKey, newVal, target);
      } else {
        if (type) {
          newVal['type'] = type;
        }
        newVal['optional'] = optional;
        target[newKey] = newVal;
      }
    }
  }
};

const addKeys = (obj, arr, val) => {
  obj[arr[0]] = obj[arr[0]] || {};
  let tmpObj = obj[arr[0]];
  if (arr.length > 1) {
    arr.shift();
    addKeys(tmpObj, arr, val);
  } else {
    obj[arr[0]] = val;
  }
  return obj;
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
    const optional = obj.optional;
    const fieldIndent = fields.length;
    if (fieldIndent > 1) {
      const value = type ? {type, optional} : {optional};
      res = addKeys(res, fields, value);
    } else {
      res[fields[0]] = type ? {type, optional} : {optional};
    }
  });
  return res;
};

module.exports.toSchema = (colName) => {
  let schema = require(`../schemas/${colName}.json`);
  let res = {};
  formatToSchema('', schema, res);
  for (let key in res) {
    if (!res[key].hasOwnProperty('type')) {
      delete res[key];
    }
  }
  return res;
};
