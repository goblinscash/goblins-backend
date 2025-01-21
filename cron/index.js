const cron = require("node-cron");
const CONST = require("../config/constant.json");
const redisFunc = require("../utility/redis");
const { getIncentiveDetail } = require("../helpers/IncentiveHelper");
const { getLogs } = require("../script/getTransaction");
const { getUnStakeLogs } = require("../script/getTransactionUnstake");
const { syncTvlAndApr, handleFarmTermination, handleFarmCreation } = require("../modules/farm/controller/farmController");
const { fetchQuote } = require("../modules/price/controller/priceController");

const getIncentiveData = async () => {
  try {
    console.log("cron hit");
    for (let i = 0; i < CONST.supportedChain.length; i++) {
      const chainId = CONST.supportedChain[i];
      let data = await getIncentiveDetail(chainId);

      if (data) {
        await redisFunc.setString(chainId.toString(), JSON.stringify(data));
      }
    }
  } catch (error) {
    console.log(error, "<===err in cron");
  }
};

const syncFarmData = async () => {
  try {
    console.log("cron hit syncTvlAndApr");
    for (let i = 0; i < CONST.supportedChain.length; i++) {
      const chainId = CONST.supportedChain[i];
      await syncTvlAndApr(chainId);
    }
  } catch (error) {
    console.log(error, "<===err in cron syncTvlAndApr");
  }
};

const automateFarmTermination = async () => {
  try {
    console.log("cron hit automateFarmTermination");
    for (let i = 0; i < CONST.supportedChain.length; i++) {
      const chainId = CONST.supportedChain[i];
      await handleFarmTermination(chainId);
    }
  } catch (error) {
    console.log(error, "<===err in cron automateFarmTermination");
  }
};

const syncGobPriceAndTVL = async () => {
  try {
    console.log("cron hit syncGobPriceAndTVL");
    for (let i = 0; i < CONST.supportedChain.length; i++) {
      const chainId = CONST.supportedChain[i];
      await fetchQuote(chainId);
    }
  } catch (error) {
    console.log(error, "<===err in cron syncTvlAndApr");
  }
};

// // Schedule the getIncentiveData to run every 30 minutes
// cron.schedule("*/30 * * * *", getIncentiveData);
// cron.schedule("0 0 * * *", () => {
//   getLogs(10000);
//   getUnStakeLogs(10000);
// });


// handleFarmCreation(56)
// cron.schedule("0 0 * * 1", handleFarmCreation(56));
cron.schedule("*/30 * * * *", syncGobPriceAndTVL);
cron.schedule("*/59 * * * *", automateFarmTermination);
cron.schedule("*/50 * * * *", syncFarmData);


module.exports = cron;
