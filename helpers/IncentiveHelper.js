const moment = require("moment");

const { getIncentiveData, getMyFarmData } = require("../graphQl/functions");
const request = require("../graphQl/requests");
const CONST = require("../config/constant.json");
const Web3Intraction = require("../utility/web3Intraction");
const { makeComputeData } = require("./computeIncentive");
const { getUniqueToken } = require("./common");

const calculateAPR = (poolData) => {
  const { liquidity, token1Price, feeTier, volumeToken1, token0 } = poolData;

  let dailyFee = volumeToken1 * (feeTier / 10000);

  let annualFeeRevenue = dailyFee * 365;
  let liqudityInEth = Number(liquidity) / 10 ** token0.decimals;

  let totalLiquidity = parseFloat(liqudityInEth) * parseFloat(token1Price);

  const apr = (parseFloat(annualFeeRevenue) / totalLiquidity) * 100;

  return {
    apr: apr > 1 ? Number(apr).toFixed(2) : Number(apr).toFixed(4),
    tvl: totalLiquidity,
  };
};

///get single incentiveData from contract

const getSingleIncentiveData = async (chainId, incentiveData) => {
  try {
  } catch (error) {}
};

const getIncentiveDetail = async (chainId) => {
  try {
    let myData = [];
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
      let pool = null;

      if (chainId == 10000) {
        let poolData = await getPool(incentiveCreateds[i].pool);
        pool = poolData.pool;
      }

      let aprData = pool ? calculateAPR(pool, incentiveCreateds[i]) : null;

      // console.log(aprData, "<===aprdata");

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
        transactionHash: incentiveCreateds[i].transactionHash,
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


    let myFarm = [];
    for (let d = 0; d < getUniqueTokenId.length; d++) {
      let desposit = await web3.getDeposit(getUniqueTokenId[d].tokenId);
 

      if (desposit.owner === walletAddress) {
  
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
              let tokenData = await web3.getTokenDecimal(
                incentiveCreateds[i].rewardToken
              );
              myFarm.push({
                id: incentiveCreateds[i].id,
                feeTier: Number(pool?.feeTier || 0) / 10000,

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
                isEnded:
                  Number(incentiveCreateds[i].endTime) > moment().unix()
                    ? false
                    : true,
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
};
