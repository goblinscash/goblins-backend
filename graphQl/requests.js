const axios = require("axios");
const { getAllDataQuery, getMyFarmQuery, getPoolDetailQuery, tokenUSDPriceQuery } = require("./queries");

function getIncentive(subgraphUrl) {
  return async function (variables) {
    try {
      const response = await axios.post(
        subgraphUrl,
        {
          query: getAllDataQuery,
          variables: variables,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { data } = response.data;

      return data;
    } catch (error) {
      throw new Error(`Error fetching data: ${error.message}`);
    }
  };
}

function getFarmData(subgraphUrl) {
  return async function (variables) {
    try {
      const response = await axios.post(
        subgraphUrl,
        {
          query: getMyFarmQuery,
          variables: variables,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { data } = response.data;

      return data;
    } catch (error) {
      throw new Error(`Error fetching data: ${error.message}`);
    }
  };
}

function getPoolDetails(subgraphUrl) {
  return async function (id) {
    const variables = { id };

    try {
      const response = await axios.post(
        subgraphUrl,
        {
          query: getPoolDetailQuery,
          variables: variables,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { data } = response.data;

      return data;
    } catch (error) {
      throw new Error(`Error fetching data: ${error.message}`);
    }
  };
}

function getTokenUSDPrice(subgraphUrl) {
  return async function (id) {
    const variables = { id };

    try {
      const response = await axios.post(
        subgraphUrl,
        {
          query: tokenUSDPriceQuery,
          variables: variables,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const {data}  = response.data;
    
    
      return data?.token?.tokenDayData[0]?.open
    } catch (error) {
      throw new Error(`Error fetching data: ${error.message}`);
    }
  };
}

module.exports = { getIncentive, getFarmData,getPoolDetails, getTokenUSDPrice };
