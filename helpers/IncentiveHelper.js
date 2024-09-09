const moment = require("moment");

const { getIncentiveData, getMyFarmData } = require("../graphQl/functions");
const request = require("../graphQl/requests");
const CONST = require("../config/constant.json");
const Web3Intraction = require("../utility/web3Intraction");
const { makeComputeData } = require("./computeIncentive");
const { getUniqueToken, toFixedCustm } = require("./common");
const { getTokenPriceInUSD } = require("./getPrice");

const calculateAPR = (poolData, incentiveData, rewardAmount, usdPrice) => {
  const { startTime, endTime } = incentiveData;
  const rewardPeriodSeconds = endTime - startTime;
  // const rewardPeriodYears =  (365 * 24 * 60 * 60);
  const rewardPeriodYears = rewardPeriodSeconds / (365 * 24 * 60 * 60);

  let calculateReward = usdPrice ? rewardAmount * usdPrice : rewardAmount;

  calculateReward = Number(calculateReward).toFixed(2);

  // Calculate APR
  const apr = toFixedCustm(
    (calculateReward / poolData.totalValueLockedUSD) *
      (1 / rewardPeriodYears) *
      100
  );

  return {
    apr: apr > 1 ? Number(apr).toFixed(2) : Number(apr).toFixed(4),
    tvl: poolData.totalValueLockedUSD,
  };
};

///get single incentiveData from contract

const createSingleIncentiveData = async (chainId, incentiveData) => {
  try {
    const getPool = request.getPoolDetails(CONST.poolDetailGraphQL);
    const web3 = new Web3Intraction(chainId);
    let nftCount = 0;
    let tokenData = await web3.getTokenDecimal(incentiveData.rewardToken);
    let makeIncentiveId = await makeComputeData([
      incentiveData.rewardToken,
      incentiveData.pool,
      incentiveData.startTime,
      incentiveData.endTime,
      incentiveData.refundee,
    ]);
    let pool = null;
    if (chainId == 10000) {
      let poolData = await getPool(incentiveData.pool);
      pool = poolData.pool;
    }
    // console.log(aprData, "<===aprdata");
    if (Number(incentiveData.endTime) > moment().unix()) {
      nftCount = await web3.nftCount(makeIncentiveId);
    }

    let rewardPricing = await getTokenPriceInUSD(incentiveData.rewardToken);

    let aprData = pool
      ? calculateAPR(pool, incentiveData, incentiveData.reward, rewardPricing)
      : null;

    let data = {
      apr: aprData?.apr || 0,
      tvl: aprData?.tvl || 0,
      incentiveId: makeIncentiveId,
      feeTier: Number(pool?.feeTier || 0) / 10000,
      getPoolDetail: {
        token0Symbol: pool?.token0?.symbol,
        token0Address: pool?.token0?.id,
        token1Symbol: pool?.token1?.symbol,
        token1Address: pool?.token1?.id,
      },
      minWidth: incentiveData.minWidth,
      nftCount: nftCount.numberOfStakes?.toString(),

      reward: incentiveData.reward,
      rewardSymbol: tokenData.symbol,
      isEnded: Number(incentiveData.endTime) > moment().unix() ? false : true,
      key: {
        rewardToken: incentiveData.rewardToken,
        pool: incentiveData.pool,
        startTime: incentiveData.startTime,
        endTime: incentiveData.endTime,
        refundee: incentiveData.refundee,
      },
    };
    return data;
  } catch (error) {
    console.log(error, "<====error");
    return null;
  }
};

const getDepositIncentiveData = async (
  chainId,
  incentiveData,
  tokenId,
  walletAddress
) => {
  try {
    const web3 = new Web3Intraction(chainId);
    let desposit = await web3.getDeposit(tokenId);
    let data = null;
    if (desposit.owner === walletAddress) {
      try {
        let keyData = [
          incentiveData.key.rewardToken,
          incentiveData.key.pool,
          incentiveData.key.startTime,
          incentiveData.key.endTime,
          incentiveData.key.refundee,
        ];
        let getRewards = await web3.getRewardInfo(keyData, tokenId);

        if (getRewards) {
          let tokenData = await web3.getTokenDecimal(
            incentiveData.key.rewardToken
          );

          data = {
            tokenId: tokenId,
            rewardInfo: {
              reward: getRewards.reward.toString() / 10 ** tokenData.decimal,
            },

            ...incentiveData,
          };
        }
        return data;
      } catch (error) {
        console.log(error, "<====err in getMyFarmData");
      }
    }
    return data;
  } catch (error) {
    console.log(error, "<====error");
    return null;
  }
};

const getIncentiveDetail = async (chainId) => {
  try {
    let myData = [];
    let rewardTokenPriceData = {};
    let { incentiveCreateds, incentiveEndeds } = await getIncentiveData(
      chainId
    );
    const getPool = request.getPoolDetails(CONST.poolDetailGraphQL);
    const web3 = new Web3Intraction(chainId);
    for (let i = 0; i < incentiveCreateds.length; i++) {
      let nftCount = 0;
      let tokenData = await web3.getTokenDecimal(
        incentiveCreateds[i].rewardToken
      );

      let makeIncentiveId = await makeComputeData([
        incentiveCreateds[i].rewardToken,
        incentiveCreateds[i].pool,
        incentiveCreateds[i].startTime,
        incentiveCreateds[i].endTime,
        incentiveCreateds[i].refundee,
      ]);
      let rewardPricing = null;
      if (!rewardTokenPriceData?.[incentiveCreateds[i].rewardToken]) {
        rewardPricing = await getTokenPriceInUSD(
          incentiveCreateds[i].rewardToken
        );

        rewardTokenPriceData[incentiveCreateds[i].rewardToken] = rewardPricing;
      }
      let pool = null;

      if (chainId == 10000) {
        let poolData = await getPool(incentiveCreateds[i].pool);
        pool = poolData.pool;
      }

      let aprData = pool
        ? calculateAPR(
            pool,
            incentiveCreateds[i],
            incentiveCreateds[i].reward.toString() / 10 ** tokenData.decimal,
            rewardPricing ||
              rewardTokenPriceData[incentiveCreateds[i].rewardToken]
          )
        : null;

      if (Number(incentiveCreateds[i].endTime) > moment().unix()) {
        nftCount = await web3.nftCount(makeIncentiveId);
      }

      myData.push({
        apr: aprData?.apr || 0,
        tvl: aprData?.tvl || 0,
        incentiveId: makeIncentiveId,

        feeTier: Number(pool?.feeTier || 0) / 10000,
        getPoolDetail: {
          token0Symbol: pool?.token0?.symbol,
          token0Address: pool?.token0?.id,
          token1Symbol: pool?.token1?.symbol,
          token1Address: pool?.token1?.id,
        },
        minWidth: incentiveCreateds[i].minWidth,
        nftCount: nftCount.numberOfStakes?.toString(),
        id: incentiveCreateds[i].id,
        reward:
          incentiveCreateds[i].reward.toString() / 10 ** tokenData.decimal,
        rewardSymbol: tokenData.symbol,
        isEnded:
          Number(incentiveCreateds[i].endTime) > moment().unix() ? false : true,
        key: {
          rewardToken: incentiveCreateds[i].rewardToken,
          pool: incentiveCreateds[i].pool,
          startTime: incentiveCreateds[i].startTime,
          endTime: incentiveCreateds[i].endTime,
          refundee: incentiveCreateds[i].refundee,
        },
      });
    }

    const availableFarm = myData.filter((item1) => {
      return !incentiveEndeds.some(
        (item2) => item2.incentiveId === item1.incentiveId
      );
    });

    const deletedFarm = myData.filter((item1) => {
      return incentiveEndeds.some(
        (item2) => item2.incentiveId === item1.incentiveId
      );
    });
    return {
      availableFarm,
      deletedFarm,
      incentiveEndeds,
    };
  } catch (error) {
    console.log(error, "<====error");
    return null;
  }
};

const getMyFarmDetail = async (chainId, walletAddress) => {
  try {
    let { incentiveCreateds, tokenStakeds } = await getMyFarmData(chainId);

    const getPool = request.getPoolDetails(CONST.poolDetailGraphQL);
    const web3 = new Web3Intraction(chainId);

    const getUniqueTokenId = getUniqueToken(tokenStakeds);
    console.log(getUniqueTokenId, "<====getUniqueTokenId");

    let myFarm = [];
    for (let d = 0; d < getUniqueTokenId.length; d++) {
      let desposit = await web3.getDeposit(getUniqueTokenId[d].tokenId);
      if (getUniqueTokenId[d].tokenId == "537") {
        console.log(desposit, walletAddress, "<====data");
      }
      if (desposit.owner === walletAddress) {
        console.log(desposit.owner, "<====desposit.owner");
        for (let i = 0; i < incentiveCreateds.length; i++) {
          try {
            let keyData = [
              incentiveCreateds[i].rewardToken,
              incentiveCreateds[i].pool,
              incentiveCreateds[i].startTime,
              incentiveCreateds[i].endTime,
              incentiveCreateds[i].refundee,
            ];
            let getRewards = await web3.getRewardInfo(
              keyData,
              getUniqueTokenId[d].tokenId
            );

            if (getRewards) {
              let pool = null;

              if (chainId == 10000) {
                let poolData = await getPool(incentiveCreateds[i].pool);
                pool = poolData.pool;
              }

              let makeIncentiveId = await makeComputeData([
                incentiveCreateds[i].rewardToken,
                incentiveCreateds[i].pool,
                incentiveCreateds[i].startTime,
                incentiveCreateds[i].endTime,
                incentiveCreateds[i].refundee,
              ]);

              let tokenData = await web3.getTokenDecimal(
                incentiveCreateds[i].rewardToken
              );
              myFarm.push({
                id: incentiveCreateds[i].id,
                feeTier: Number(pool?.feeTier || 0) / 10000,
                incentiveId: makeIncentiveId,
                getPoolDetail: {
                  token0Symbol: pool?.token0?.symbol,
                  token0Address: pool?.token0?.id,
                  token1Symbol: pool?.token1?.symbol,
                  token1Address: pool?.token1?.id,
                },
                reward:
                  incentiveCreateds[i].reward.toString() /
                  10 ** tokenData.decimal,
                rewardSymbol: tokenData.symbol,
                tokenId: getUniqueTokenId[d].tokenId,
                isUnstaked: false,
                rewardInfo: {
                  reward:
                    getRewards.reward.toString() / 10 ** tokenData.decimal,
                },

                key: {
                  rewardToken: incentiveCreateds[i].rewardToken,
                  pool: incentiveCreateds[i].pool,
                  startTime: incentiveCreateds[i].startTime,
                  endTime: incentiveCreateds[i].endTime,
                  refundee: incentiveCreateds[i].refundee,
                },
              });
            }
          } catch (error) {
            console.log(error, "<====err in getMyFarmData");
          }
        }
      }
    }

    return myFarm;
  } catch (error) {
    console.log(error, "<====err in getMyFarmData");
    return null;
  }
};

const getDeletedDataForClaim = async (
  chainId,
  walletAddress,
  deletedIncentive,
  incentiveEndeds
) => {
  try {
    const web3 = new Web3Intraction(chainId);
    let myData = [];
    for (let i = 0; i < deletedIncentive.length; i++) {
      if (
        incentiveEndeds.find(
          (item) => item.incentiveId === deletedIncentive[i].incentiveId
        )
      ) {
        let isThatTokenExistInMyFarm = myData.find(
          (token) =>
            token.key.rewardToken == deletedIncentive[i].key.rewardToken
        );

        if (!isThatTokenExistInMyFarm) {
          let rewards = await web3.getRewards(
            deletedIncentive[i].key.rewardToken,
            walletAddress
          );

          let tokenData = await web3.getTokenDecimal(
            deletedIncentive[i].key.rewardToken
          );

          if (Number(rewards.toString()) > 0) {
            myData.push({
              ...deletedIncentive[i],
              rewardInfo: {
                reward: rewards.toString() / 10 ** tokenData.decimal,
              },
            });
          }
        }
      }
    }

    return myData;
  } catch (error) {
    console.log(error, "<====err in getDeletedDataForClaim");
    return null;
  }
};

module.exports = {
  getIncentiveDetail,
  getMyFarmDetail,
  getDeletedDataForClaim,
  createSingleIncentiveData,
  getDepositIncentiveData,
};
