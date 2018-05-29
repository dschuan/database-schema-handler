module.exports = (rawData) => {
  let collectionList = rawData.cursor.firstBatch;
  collectionList = collectionList.map((collection) => {
    return collection.name;
  });
  return collectionList;
};
