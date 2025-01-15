const cron = require("node-cron");
const CONST = require("../config/constant.json");
const redisFunc = require("../utility/redis");
const { getIncentiveDetail } = require("../helpers/IncentiveHelper");
const { getLogs } = require("../script/getTransaction");
const { getUnStakeLogs } = require("../script/getTransactionUnstake");
const { syncTvlAndApr } = require("../modules/farm/controller/farmController");

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

// // Schedule the getIncentiveData to run every 30 minutes
// cron.schedule("*/30 * * * *", getIncentiveData);
// cron.schedule("0 0 * * *", () => {
//   getLogs(10000);
//   getUnStakeLogs(10000);
// });

cron.schedule("*/50 * * * *", syncFarmData);


module.exports = cron;
