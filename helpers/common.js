const getUniqueToken = (data) => {
  const uniqueTokenIds = new Set(data.map((item) => item.tokenId));
  // Convert the Set back to an array of objects
  const uniqueData = Array.from(uniqueTokenIds).map((tokenId) => ({ tokenId }));
  return uniqueData;
};

function findKeyBySymbol(pool, symbol) {
  for (let key in pool) {

    if (pool[key] && pool[key].symbol && pool[key].symbol === symbol) {
      return key;
    }
  }
  return null;
}

module.exports = {
  getUniqueToken,
  findKeyBySymbol
};
