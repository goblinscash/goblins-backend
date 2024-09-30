const { ethers } = require("ethers");
const uniswapV3FactoryABI = require("../utility/ABI/UniswapV3Factory.json");
const {
  contract,
  feeTiers,
  poolDetailGraphQL,
} = require("../config/constant.json");
const request = require("../graphQl/requests");
const { findKeyBySymbol } = require("./common");

// Function to get pool address
async function getPool(tokenA, tokenB) {
  try {
    const provider = new ethers.getDefaultProvider("https://smartbch.greyh.at"); // Replace with your SmartBCH node URL
    // Uniswap V3 Factory and Pool ABI and addresses
    const uniswapV3FactoryAddress = contract["10000"].uniswapV3FactoryAddress; // Uniswap V3 Factory contract address

    // Create Uniswap V3 Factory contract instance
    const factoryContract = new ethers.Contract(
      uniswapV3FactoryAddress,
      uniswapV3FactoryABI,
      provider
    );

    let poolAddress = null;

    for (let i = 0; i < feeTiers.length; i++) {
      let poolData = await factoryContract.getPool(tokenA, tokenB, feeTiers[i]);
      if (poolData != "0x0000000000000000000000000000000000000000") {
        poolAddress = poolData;
        break;
      }
    }
    return poolAddress;
  } catch (error) {
    console.log(error, "<===== Error in getPool");
    return null;
  }
}

async function getTokenPriceInUSD(
  tokenAddress,
  chainId
) {
  try {
 
    // Setup Ethers
    const stablecoinAddress = "0xBc2F884680c95A02cea099dA2F524b366d9028Ba"; //  (e.g., USDT)
    const getTokenAndUsdtPair = await getPool(tokenAddress, stablecoinAddress);
    const getPoolDetails = request.getPoolDetails(poolDetailGraphQL[chainId || 10000]);
    if (!getTokenAndUsdtPair) {
      return null;
    }

    let poolData = await getPoolDetails(getTokenAndUsdtPair.toLowerCase());
    let findKey = findKeyBySymbol(poolData.pool, "bcUSDT");
    poolData = poolData.pool;
    return findKey === "token0"
      ? Number(poolData.token0Price).toFixed(2)
      : Number(poolData.token1Price).toFixed(2);
  } catch (error) {
    return null;
  }
}

module.exports = {
  getTokenPriceInUSD,
};
