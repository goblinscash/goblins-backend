const getUniqueToken = (data) => {
  const uniqueTokenIds = new Set(data.map((item) => item.tokenId));
  // Convert the Set back to an array of objects
  const uniqueData = Array.from(uniqueTokenIds).map((tokenId) => ({ tokenId }));
  return uniqueData;
};

module.exports = {
  getUniqueToken,
};
