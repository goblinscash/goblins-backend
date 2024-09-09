const response = require("../../../utility/response");
const redisFunc = require("../../../utility/redis");
const { getLogs } = require("../../../script/getTransaction");

module.exports = {
  getStakingTransaction: async (req, res) => {
    try {


      let payload = req.body;

      if (!payload.chainId) {
        return response.sendValidationErrorResponse("Chain Id Required", res);
      }


      let transactionData = await redisFunc.getString(
        payload.chainId.toString() + "StakingTransaction"
      );

      let data = null;
      if (!transactionData) {
        data = await getLogs(payload.chainId);
      } else {
        data = JSON.parse(transactionData);
      }

      return response.sendSuccessResponse({ data: data }, res);
    } catch (error) {
      console.log(error, "<====error");
      return response.sendErrorResponse(error, res);
    }
  },
};
