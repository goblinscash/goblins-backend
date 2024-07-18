//response function
const response = require("../../../utility/response");
const redisFunc = require("../../../utility/redis");

const moment = require("moment");
const {
  getIncentiveDetail,
  getMyFarmDetail,
  getDeletedDataForClaim,
  createSingleIncentiveData,
  getDepositIncentiveData,
} = require("../../../helpers/IncentiveHelper");

module.exports = {
  getData: async (req, res) => {
    try {
      let payload = req.body;
      const currentTime = moment().unix();
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

      if (!payload.isEnded) {
        let resData = data.availableFarm.filter(
          (item) => Number(item.key.endTime) > currentTime
        );
        return response.sendSuccessResponse({ data: resData }, res);
      } else {
        let resData = data.availableFarm.filter(
          (item) => Number(item.key.endTime) < currentTime
        );
        return response.sendSuccessResponse({ data: resData }, res);
      }
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

      // let farmData = await redisFunc.getString(
      //   "deleted" +
      //     "_" +
      //     payload.walletAddress.toLowerCase() +
      //     "_" +
      //     payload.chainId.toString()
      // );
      // if (!farmData) {
      let data = await getDeletedDataForClaim(
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
      // } else {
      //   data = JSON.parse(farmData);
      // }

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

      let incentiveData = await redisFunc.getString(payload.chainId.toString());
      incentiveData = JSON.parse(incentiveData);

      let farmData = null;

      if (payload.walletAddress) {
        farmData = await redisFunc.getString(
          payload.walletAddress.toLowerCase() + "_" + payload.chainId.toString()
        );

        farmData = farmData ? JSON.parse(farmData) : [];
      }

      switch (payload.type) {
        case "Create":
          let newCreate = await createSingleIncentiveData(
            payload.chainId,
            payload.createdData
          );

          if (newCreate) {
            incentiveData = {
              availableFarm: incentiveData.availableFarm.unshift(newCreate),
              ...incentiveData,
            };

            await redisFunc.setString(
              payload.chainId.toString(),
              JSON.stringify(incentiveData)
            );
          }

          return response.sendSuccessResponse({ data: incentiveData }, res);
          break;

        case "Deposit":
          if (payload.isMutliStake) {
            let depositMultiData = [];
            for (let i = 0; i < payload.incentiveId.length; i++) {
              let getIncentiveData = incentiveData.availableFarm.find(
                (data) => data.incentiveId == payload.incentiveId[i]
              );

              let depositData = await getDepositIncentiveData(
                payload.chainId,
                getIncentiveData,
                payload.tokenId,
                payload.walletAddress
              );

              if (depositData) {
                depositMultiData.push(depositData);
              }
            }
            let newData = [...depositMultiData, ...farmData];

            await redisFunc.setString(
              payload.walletAddress.toLowerCase() +
                "_" +
                payload.chainId.toString(),
              JSON.stringify(newData)
            );
          } else {
            let getIncentiveData = incentiveData.availableFarm.find(
              (data) => data.incentiveId == payload.incentiveId
            );

            let depositData = await getDepositIncentiveData(
              payload.chainId,
              getIncentiveData,
              payload.tokenId,
              payload.walletAddress
            );

            if (depositData) {
              let newData = [depositData, ...farmData];

              await redisFunc.setString(
                payload.walletAddress.toLowerCase() +
                  "_" +
                  payload.chainId.toString(),
                JSON.stringify(newData)
              );
            }
          }

          return response.sendSuccessResponse({ data: farmData }, res);
          break;

        case "Unstake":
          if (farmData) {
            let newData = farmData.filter(
              (data) => data.incentiveId !== payload.incentiveId
            );
            await redisFunc.setString(
              payload.walletAddress.toLowerCase() +
                "_" +
                payload.chainId.toString(),
              JSON.stringify(newData)
            );
          }
          return response.sendSuccessResponse({ data: farmData }, res);

          break;

        case "End":
          if (incentiveData) {

            console.log(payload.incentiveId, "<===payload.incentiveId")
            let newData = incentiveData.availableFarm.filter(
              (data) => data.incentiveId !== payload.incentiveId
            );

            console.log(newData, "<===newData")


            incentiveData = {
              availableFarm: newData,
              ...incentiveData,
            };

            console.log(incentiveData, "<===incentiveData")

            await redisFunc.setString(
              payload.chainId.toString(),
              JSON.stringify(incentiveData)
            );
          }
          return response.sendSuccessResponse({ data: incentiveData }, res);

          break;

        default:
          break;
      }
    } catch (error) {
      console.log(error, "<====error");
      return response.sendErrorResponse(error, res);
    }
  },
};
