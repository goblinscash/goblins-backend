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
    // console.log(req.body, "------------------")
    try {
      let payload = req.body;
      // console.log(payload, "payload")
      const currentTime = moment().unix();
      if (!payload.chainId) {
        // console.log(!payload.chainId, "00000000000000")
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
      }
      else {
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
      const payload = req.body;
  
      // Validate payload
      if (!payload.chainId) {
        return response.sendValidationErrorResponse("Chain ID is required.", res);
      }
      if (!payload.walletAddress) {
        return response.sendValidationErrorResponse("Wallet address is required.", res);
      }
  
      const redisKey = `${payload.walletAddress.toLowerCase()}_${payload.chainId}`;
      let farmData;
  
      try {
        // Attempt to fetch data from Redis
        const cachedData = await redisFunc.getString(redisKey);
  
        if (cachedData) {
          try {
            farmData = JSON.parse(cachedData);
  
            // Ensure the cached data is valid
            if (!Array.isArray(farmData) || farmData.length === 0) {
              farmData = null;
            }
          } catch (parseError) {
            console.warn(`Failed to parse cache for key: ${redisKey}`, parseError);
            farmData = null; // Fall back to fresh data
          }
        }
      } catch (redisError) {
        console.error("Redis error:", redisError);
        // Proceed without Redis in case of failure
        farmData = null;
      }
  
      // Fetch fresh data if no valid cache exists
      if (!farmData) {
        console.log("Fetching fresh data...");
        farmData = await getMyFarmDetail(payload.chainId, payload.walletAddress);
  
        if (farmData) {
          try {
            // Cache the fresh data with expiry
            await redisFunc.setStringWithExpiry(redisKey, JSON.stringify(farmData));
          } catch (cacheError) {
            console.warn("Failed to cache farm data:", cacheError);
          }
        }
      }
  
      // Respond with the farm data
      return response.sendSuccessResponse({ data: farmData || [] }, res);
  
    } catch (error) {
      console.error("Unexpected error in myFarm:", error);
      return response.sendErrorResponse("An unexpected error occurred. Please try again.", res);
    }
  },
  

  updateMyFarm: async (req, res) => {
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

  


      let data = await getMyFarmDetail(payload.chainId, payload.walletAddress);


      if (data) {
      await redisFunc.setStringWithExpiry(
        payload.walletAddress.toLowerCase() +
        "_" +
        payload.chainId.toString(),
        JSON.stringify(data)
      );
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
      const redisKey = `deleted_${payload.walletAddress.toLowerCase()}_${payload.chainId}`;

      let incentiveData = await redisFunc.getString(payload.chainId.toString());
      if (!incentiveData) {
        return response.sendValidationErrorResponse(
          "Try Again After Sometime",
          res
        );
      }
      incentiveData = JSON.parse(incentiveData);

      let deletedForClaim = await redisFunc.getString(redisKey)
      let data=null;

      if(!deletedForClaim || !deletedForClaim.length){

         data = await getDeletedDataForClaim(
          payload.chainId,
          payload.walletAddress,
          incentiveData.deletedFarm,
          incentiveData.incentiveEndeds
        );
      

      if (data) {
        await redisFunc.setStringWithExpiry(
          redisKey,
          JSON.stringify(data)
        );
      }
    }
    else{
      data = JSON.parse(deletedForClaim);
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

          // console.log(newCreate, "<====newCreate");
          if (newCreate) {
            incentiveData = {
              ...incentiveData,
              availableFarm: [newCreate, ...incentiveData.availableFarm],
            };
            // console.log(incentiveData.availableFarm, "<====incentiveData");

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

            await redisFunc.setStringWithExpiry(
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

              await redisFunc.setStringWithExpiry(
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
            await redisFunc.setStringWithExpiry(
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

            let newData = incentiveData.availableFarm.filter(
              (data) => data.incentiveId != payload.incentiveId
            );

            let newIncentiveData = {
              ...incentiveData,
              availableFarm: newData,
            };



            await redisFunc.setString(
              payload.chainId.toString(),
              JSON.stringify(newIncentiveData)
            );

            let getNewIncenties = await getIncentiveDetail(payload.chainId);

            if (getNewIncenties) {
              await redisFunc.setString(
                payload.chainId.toString(),
                JSON.stringify(getNewIncenties)
              );
            }
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
