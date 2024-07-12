//response function
const response = require("../../../utility/response");
const redisFunc = require("../../../utility/redis");
const {
  getIncentiveDetail,
  getMyFarmDetail,
  getDeletedDataForClaim,
} = require("../../../helpers/IncentiveHelper");

module.exports = {
  getData: async (req, res) => {
    try {
      let payload = req.body;

      if (!payload.chainId) {
        return response.sendValidationErrorResponse("Chain Id Required", res);
      }

      let data = null;
      let farmData = await redisFunc.getString(payload.chainId.toString());
      if (!farmData) {
        data = await getIncentiveDetail(payload.chainId);

        if (data) {
          await redisFunc.setString(
            payload.chainId.toString(),
            JSON.stringify(data)
          );
        }
      } else {
        data = JSON.parse(farmData);
      }
      let resData = data.availableFarm.filter(
        (data) => data.isEnded == payload.isEnded
      );
      return response.sendSuccessResponse({ data: resData }, res);
    } catch (error) {
      console.log(error, "<====error");
      return response.sendErrorResponse(error, res);
    }
  },

  myFarm: async (req, res) => {
    try {
      let payload = req.body;

      if (!payload.chainId) {
        return response.sendValidationErrorResponse("Chain Id Required", res);
      }
      if (!payload.walletAddress) {
        return response.sendValidationErrorResponse(
          "Wallet Address Required",
          res
        );
      }
      
      let data = null;
      let farmData = await redisFunc.getString(
        payload.walletAddress.toLowerCase() + "_" + payload.chainId.toString()
      );
      if (!farmData) {
      data = await getMyFarmDetail(payload.chainId, payload.walletAddress);

      if (data) {
        await redisFunc.setString(
          payload.walletAddress.toLowerCase() + "_" + payload.chainId.toString(),
          JSON.stringify(data)
        );
      }
      } else {
        data = JSON.parse(farmData);
      }

      return response.sendSuccessResponse({ data: data }, res);
    } catch (error) {
      console.log(error, "<====error");
      return response.sendErrorResponse(error, res);
    }
  },

  deletedFarm: async (req, res) => {
    try {
      let payload = req.body;

      if (!payload.chainId) {
        return response.sendValidationErrorResponse("Chain Id Required", res);
      }
      if (!payload.walletAddress) {
        return response.sendValidationErrorResponse(
          "Wallet Address Required",
          res
        );
      }

      let incentiveData = await redisFunc.getString(payload.chainId.toString());

      if (!incentiveData) {
        return response.sendValidationErrorResponse(
          "Try Again After Sometime",
          res
        );
      }

      incentiveData = JSON.parse(incentiveData);

      let data = null;
      let farmData = await redisFunc.getString(
        "deleted" +
          "_" +
          payload.walletAddress.toLowerCase() +
          "_" +
          payload.chainId.toString()
      );
      if (!farmData) {
        data = await getDeletedDataForClaim(
          payload.chainId,
          payload.walletAddress,
          incentiveData.deletedFarm,
          incentiveData.incentiveEndeds
        );

        if (data) {
          await redisFunc.setString(
            "deleted" +
              "_" +
              payload.walletAddress.toLowerCase() +
              "_" +
              payload.chainId.toString(),
            JSON.stringify(data)
          );
        }
      } else {
        data = JSON.parse(farmData);
      }

      return response.sendSuccessResponse({ data: data }, res);
    } catch (error) {
      console.log(error, "<====error");
      return response.sendErrorResponse(error, res);
    }
  },

  updateData: async (req, res) => {
    try {
      let payload = req.body;
      if (!payload.chainId) {
        return response.sendValidationErrorResponse("Chain Id Required", res);
      }

      if (!payload.type) {
        return response.sendValidationErrorResponse("Type Required", res);
      }
      let resData = null;
      switch (key) {
        case "Create":
          data = await getIncentiveDetail(payload.chainId);

          if (data) {
            await redisFunc.setString(
              payload.chainId.toString(),
              JSON.stringify(data)
            );
          }

          return response.sendSuccessResponse({ data: data }, res);
          break;

        case "Deposit":
          break;

        case "Unstake":
          break;

        case "End":
          break;

        case "Claim":
          break;

        default:
          break;
      }

      return response.sendSuccessResponse({ data: resData }, res);
    } catch (error) {}
  },
};
