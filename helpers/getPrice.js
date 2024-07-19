const { ethers } = require("ethers");
const uniswapV3FactoryABI = require("../utility/ABI/UniswapV3Factory.json");
const uniswapV3PoolABI = require("../utility/ABI/uniswapV3PoolABI.json");
const {
  contract,
  feeTiers,
  poolDetailGraphQL,
} = require("../config/constant.json");
const request = require("../graphQl/requests");
const { findKeyBySymbol } = require("./common");

// Setup Ethers
const provider = new ethers.getDefaultProvider("https://smartbch.greyh.at"); // Replace with your SmartBCH node URL
// Uniswap V3 Factory and Pool ABI and addresses
const uniswapV3FactoryAddress = contract["10000"].uniswapV3FactoryAddress; // Uniswap V3 Factory contract address

// Create Uniswap V3 Factory contract instance
const factoryContract = new ethers.Contract(
  uniswapV3FactoryAddress,
  uniswapV3FactoryABI,
  provider
);

const Q192 = ethers.BigNumber.from(2).pow(192); // 2^192
// Function to get pool address
async function getPool(tokenA, tokenB) {
  try {
    let poolAddress = null;

    for (let i = 0; i < feeTiers.length; i++) {
      let poolData = await factoryContract.getPool(tokenA, tokenB, feeTiers[i]);
      if (poolData != "0x0000000000000000000000000000000000000000") {
        poolAddress = poolData;
        break;
      }
    }
    console.log(`Pool Address for ${tokenA}-${tokenB}: ${poolAddress}`);
    return poolAddress;
  } catch (error) {
    console.log(error, "<===== Error in getPool");
    return null;
  }
}

// Function to get reserves from the pool
async function getPoolReserves(poolAddress) {
  try {
    const poolContract = new ethers.Contract(
      poolAddress,
      uniswapV3PoolABI,
      provider
    );

    const slot0 = await poolContract.slot0();

    console.log(slot0, "<=====slot0");
    console.log(`sqrtPriceX96 for Pool ${poolAddress}: ${slot0.sqrtPriceX96}`);
    return slot0.sqrtPriceX96;
  } catch (error) {
    console.log(error, "<===== Error in getPoolReserves");
    return null;
  }
}

// Function to calculate price from sqrtPriceX96
function calculatePriceFromSqrtPriceX96(sqrtPriceX96) {
  try {
    const price = (sqrtPriceX96 / 2 ** 96) ** 2;

    // const sqrtPrice = ethers.BigNumber.from(sqrtPriceX96);
    // const price = sqrtPrice.mul(sqrtPrice).div(Q192);
    console.log(
      `Calculated Price from sqrtPriceX96 ${sqrtPriceX96}: ${price.toString()}`
    );
    return price.toString();
  } catch (error) {
    console.log(error, "<==== Error in calculatePriceFromSqrtPriceX96");
    return null;
  }
}

async function getTokenPriceInUSD(
  tokenAddress = "0xbc9bd8dde6c5a8e1cbe293356e02f5984693b195"
) {
  const smartBCHAddress = "0x3743eC0673453E5009310C727Ba4eaF7b3a1cc04"; // WBCH token address
  const stablecoinAddress = "0xBc2F884680c95A02cea099dA2F524b366d9028Ba"; //  (e.g., USDT)

  const getTokenAndUsdtPair = await getPool(tokenAddress, stablecoinAddress);
  const getPoolDetails = request.getPoolDetails(poolDetailGraphQL);

  if (!getTokenAndUsdtPair) {
    throw new Error("Pool not found for TOKEN-SmartBCH");
  }
  if (getTokenAndUsdtPair) {
    let poolData = await getPoolDetails(getTokenAndUsdtPair.toLowerCase());

  

    let findKey = findKeyBySymbol(poolData.pool, "bcUSDT");

    

    const sqrtPriceX96TokenAndUsdt = await getPoolReserves(getTokenAndUsdtPair);

    const priceUsd = calculatePriceFromSqrtPriceX96(sqrtPriceX96TokenAndUsdt);
    console.log(parseFloat(priceUsd), "<====priceUsd");
    return priceUsd;
  }

  // Get the pool address for TOKEN-SmartBCH
  const tokenSmartBCHPoolAddress = await getPool(tokenAddress, smartBCHAddress);

  if (!tokenSmartBCHPoolAddress) {
    throw new Error("Pool not found for TOKEN-SmartBCH");
  }

  // Get the pool address for SmartBCH-Stablecoin
  const smartBCHStablecoinPoolAddress = await getPool(
    smartBCHAddress,
    stablecoinAddress
  );
  if (!smartBCHStablecoinPoolAddress) {
    throw new Error("Pool not found for SmartBCH-Stablecoin");
  }

  // Fetch reserves and slot0 for TOKEN-SmartBCH pool
  const sqrtPriceX96TokenSmartBCH = await getPoolReserves(
    tokenSmartBCHPoolAddress
  );

  // Fetch reserves and slot0 for SmartBCH-Stablecoin pool
  const sqrtPriceX96SmartBCHStablecoin = await getPoolReserves(
    smartBCHStablecoinPoolAddress
  );

  // Ensure sqrtPriceX96 values are valid
  if (!sqrtPriceX96TokenSmartBCH || !sqrtPriceX96SmartBCHStablecoin) {
    throw new Error("Failed to retrieve sqrtPriceX96 values");
  }

  // Calculate the price of SmartBCH in USD
  const priceSmartBCHInUSD = calculatePriceFromSqrtPriceX96(
    sqrtPriceX96SmartBCHStablecoin
  );

  // Calculate the price of TOKEN in SmartBCH
  const priceTokenInSmartBCH = calculatePriceFromSqrtPriceX96(
    sqrtPriceX96TokenSmartBCH,
    1
  );

  // Convert the prices to floating-point numbers for the final calculation
  const priceTokenInSmartBCHFloat = parseFloat(priceTokenInSmartBCH);
  const priceSmartBCHInUSDFloat = parseFloat(priceSmartBCHInUSD);

  // Calculate the price of TOKEN in USD
  const priceTokenInUSD = priceTokenInSmartBCHFloat * priceSmartBCHInUSDFloat;

  console.log(`Token Price in USD: ${priceTokenInUSD}`);
  return priceTokenInUSD;
}

getTokenPriceInUSD().catch(console.error);
