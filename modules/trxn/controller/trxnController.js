const response = require("../../../utility/response");
const redisFunc = require("../../../utility/redis");
const { getLogs } = require("../../../script/getTransaction");
const { getUnStakeLogs } = require("../../../script/getTransactionUnstake");

module.exports = {
  getStakingTransaction: async (req, res) => {
    try {


      let payload = req.body;

      if (!payload.chainId) {
        return response.sendValidationErrorResponse("Chain Id Required", res);
      }


      let stakeTransaction = await redisFunc.getString(
        payload.chainId.toString() + "StakingTransaction"
      );
      let unStakeTransaction = await redisFunc.getString(
        payload.chainId.toString() + "UnStakingTransaction"
      );

      let data = null;
      if (!stakeTransaction || !unStakeTransaction) {


        data = {
          stakeTransaction: await getLogs(1000),
          unStakeTransaction: await getUnStakeLogs(1000),
        }
      } else {
        data = {
          stakeTransaction: JSON.parse(stakeTransaction),
          unStakeTransaction: JSON.parse(unStakeTransaction),
        };
      }

      return response.sendSuccessResponse({ data: data }, res);
    } catch (error) {
      console.log(error, "<====error");
      return response.sendErrorResponse(error, res);
    }
  },
};
