const request = require("./requests");

///helpers
const CONST = require("../config/constant.json");

let getIncentiveData = async (chainId) => {
  const subgraph = request.getIncentive(CONST.graphQLUrl[chainId]);
  return await subgraph({});
};

let getMyFarmData = async (chainId) => {
  const subgraph = request.getFarmData(CONST.graphQLUrl[chainId]);
  return await subgraph({});
};

let getPoolData = async (chainId) => {
  return request.getPoolDetails(CONST.graphQLUrl[chainId]);
};

module.exports = { getIncentiveData, getMyFarmData,getPoolData };
