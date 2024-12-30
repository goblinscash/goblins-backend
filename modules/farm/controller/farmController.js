const response = require("../../../utility/response");
const Farm = require("../models/farmModel");
const CONST = require("../../../config/constant.json");
const request = require("../../../graphQl/requests");
const Web3Intraction = require("../../../utility/web3Intraction");
const { getQuote } = require("../../../helpers/quote");
const { calculateAPR } = require("../../../helpers/IncentiveHelper");
const Deposit = require("../models/depositModel");
const { makeComputeData } = require("../../../helpers/computeIncentive");

const usdtAddr = {
    10000: "0xBc2F884680c95A02cea099dA2F524b366d9028Ba", //bcusdt
    56: "0x55d398326f99059fF775485246999027B3197955", // usdt
    8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" //usdc
}

const farmData = {
    "chainId": 0,
    "incentiveId": "",
    "apr": "",
    "tvl": "",
    "feeTier": 0,
    "getPoolDetail": {
        "token0Symbol": "",
        "token0Address": "",
        "token1Symbol": "",
        "token1Address": ""
    },
    "minWidth": 0,
    "nftCount": 0,
    "reward": 0,
    "rewardSymbol": "",
    "rewardToken": "",
    "rewardDecimal": 0,
    "pool": "",
    "startTime": 0,
    "endTime": 0,
    "refundee": ""
}

const depositData = {
    "farmId": "",
    "chainId": 0,
    "wallet": "",
    "tokenId": "",
    "isUnstaked": false,
    "reward": 0,
    "tokenDecimal": 0
}

module.exports = {
    create: async (req, res) => {
        try {
            let payload = req.body;
            if (!payload.chainId) {
                return response.sendValidationErrorResponse("Chain Id Required", res);
            }

            const web3 = new Web3Intraction(payload.chainId);
            let tokenData = await web3.getTokenDecimal(
                payload.createdData.rewardToken
            );

            const getPool = request.getPoolDetails(CONST.poolDetailGraphQL[payload.chainId]);
            let { pool } = await getPool(payload.createdData.pool);

            const usdPrice = await getQuote(payload.chainId, payload.createdData.rewardToken, usdtAddr[payload.chainId], tokenData.decimal)
            const incentiveData = {
                startTime: payload.createdData.startTime,
                endTime: payload.createdData.endTime
            }
            const apr = calculateAPR(pool, incentiveData, payload.createdData.reward, usdPrice)
            farmData.chainId = payload.chainId

            const incentiveId = await makeComputeData([
                payload.createdData.rewardToken,
                payload.createdData.pool,
                payload.createdData.startTime.toString(),
                payload.createdData.endTime.toString(),
                payload.createdData.refundee,
            ])

            farmData.incentiveId = incentiveId
            farmData.apr = apr.apr
            farmData.tvl = parseFloat(pool.totalValueLockedUSD).toFixed(3)
            farmData.rewardSymbol = tokenData.symbol
            farmData.rewardDecimal = tokenData.decimal

            farmData.getPoolDetail.token0Address = pool.token0.id
            farmData.getPoolDetail.token0Symbol = pool.token0.symbol

            farmData.getPoolDetail.token1Address = pool.token1.id
            farmData.getPoolDetail.token1Symbol = pool.token1.symbol

            farmData.feeTier = pool.feeTier
            farmData.reward = payload.createdData.reward
            farmData.pool = payload.createdData.pool
            farmData.rewardToken = payload.createdData.rewardToken
            farmData.refundee = payload.createdData.refundee
            farmData.minWidth = payload.createdData.minWidth
            farmData.startTime = payload.createdData.startTime
            farmData.endTime = payload.createdData.endTime

            await Farm.create(farmData)
            return res.status(200).send({ msg: farmData })
        } catch (error) {
            return response.sendErrorResponse(error, res);
        }
    },

    list: async (req, res) => {
        try {
            const { chainId, isEnded } = req.query;
            if (!chainId) {
                return response.sendValidationErrorResponse("Chain Id Required", res);
            }
            const currentTime = Math.floor(Date.now() / 1000);
            const isEndedBoolean = isEnded === "true";

            const query = isEndedBoolean
                ? { chainId: chainId, isUnstaked: false, endTime: { $lt: currentTime } }
                : { chainId: chainId, isUnstaked: false, endTime: { $gt: currentTime } };


            const farms = await Farm.find(query);

            const transformedFarms = farms.map(farm => ({
                apr: farm.apr,
                tvl: farm.tvl,
                incentiveId: farm.incentiveId,
                feeTier: farm.feeTier / 10000,
                getPoolDetail: {
                    token0Symbol: farm.getPoolDetail?.token0Symbol,
                    token0Address: farm.getPoolDetail?.token0Address,
                    token1Symbol: farm.getPoolDetail?.token1Symbol,
                    token1Address: farm.getPoolDetail?.token1Address,
                },
                minWidth: farm.minWidth,
                nftCount: farm.nftCount.toString(),
                id: farm.pool,
                _id: farm._id,
                reward: farm.reward,
                rewardSymbol: farm.rewardSymbol,
                isEnded: isEndedBoolean,
                key: {
                    rewardToken: farm.rewardToken,
                    pool: farm.pool,
                    startTime: farm.startTime.toString(),
                    endTime: farm.endTime.toString(),
                    refundee: farm.refundee,
                }
            }));

            return response.sendSuccessResponse({ data: transformedFarms }, res);
        } catch (error) {
            return response.sendErrorResponse(error, res);
        }
    },

    deposit: async (req, res) => {
        try {
            const { chainId, wallet, farmId, tokenId } = req.body
            if (!chainId) {
                return response.sendValidationErrorResponse("Chain Id Required", res);
            }
            if (!wallet) {
                return response.sendValidationErrorResponse("Wallet is Required", res);
            }
            if (!tokenId) {
                return response.sendValidationErrorResponse("TokenId is Required", res);
            }
            const farm = await Farm.findOne({ _id: farmId })
            if (!farm) {
                return response.sendValidationErrorResponse("Invalid farm id", res);
            }
            depositData.farmId = farmId
            depositData.chainId = chainId
            depositData.wallet = wallet.toLowerCase()
            depositData.tokenId = tokenId
            depositData.tokenDecimal = farm.rewardDecimal
            farm.nftCount += 1
            await farm.save()
            await Deposit.create(depositData)
            return res.status(200).send({ msg: "successfully deposited!" })
        } catch (error) {
            return response.sendErrorResponse(error, res)
        }
    },

    myFarm: async (req, res) => {
        try {
            const { chainId, wallet } = req.query
            if (!chainId) {
                return response.sendValidationErrorResponse("Chain Id Required", res);
            }
            if (!wallet) {
                return response.sendValidationErrorResponse("Wallet is Required", res);
            }
            const web3 = new Web3Intraction(chainId);
            const deposits = await Deposit.aggregate([
                {
                    $match: { wallet: wallet.toLowerCase(), chainId: parseInt(chainId), isUnstaked: false }
                },
                {
                    $lookup: {
                        from: "farms",
                        localField: "farmId",
                        foreignField: "_id",
                        as: "farmDetails",
                    },
                },
                {
                    $unwind: "$farmDetails",
                },
                {
                    $project: {
                        _id: "$farmId",
                        incentiveId: "$incentiveId",
                        feeTier: { $divide: ["$farmDetails.feeTier", 10000] },
                        getPoolDetail: "$farmDetails.getPoolDetail",
                        rewardSymbol: "$farmDetails.rewardSymbol",
                        tokenId: "$tokenId",
                        isUnstaked: "$isUnstaked",
                        rewardInfo: {
                            reward: { $ifNull: ["$reward", 0] },
                            tokenDecimal: { $ifNull: ["$tokenDecimal", 0] }
                        },
                        key: {
                            rewardToken: "$farmDetails.rewardToken",
                            pool: "$farmDetails.pool",
                            startTime: "$farmDetails.startTime",
                            endTime: "$farmDetails.endTime",
                            refundee: "$farmDetails.refundee"
                        }
                    },
                },
            ]);

            for (let index = 0; index < deposits.length; index++) {
                const element = deposits[index];
                let getRewards = await web3.getRewardInfo(
                    element.key,
                    element.tokenId
                );
                element.rewardInfo.reward = getRewards?.reward.toString() / 10 ** element.rewardInfo?.tokenDecimal
            }

            return response.sendSuccessResponse({ data: deposits }, res);
        } catch (error) {
            return response.sendErrorResponse(error, res)
        }
    },

    unstake: async (req, res) => {
        try {
            const { chainId, wallet, farmId } = req.body
            if (!chainId) {
                return response.sendValidationErrorResponse("Chain Id Required", res);
            }
            if (!wallet) {
                return response.sendValidationErrorResponse("Wallet is Required", res);
            }
            const status = await Deposit.findOneAndUpdate({ chainId, farmId, wallet: wallet.toLowerCase(), isUnstaked: false }, { isUnstaked: true })
            return res.status(200).send({ msg: "successfully unstaked!" })
        } catch (error) {
            return response.sendErrorResponse(error, res)
        }
    },

    deleteFarm: async (req, res) => {
        try {
            const { chainId, wallet, farmId } = req.body
            if (!chainId) {
                return response.sendValidationErrorResponse("Chain Id Required", res);
            }
            if (!wallet) {
                return response.sendValidationErrorResponse("Wallet is Required", res);
            }
            if (!farmId) {
                return response.sendValidationErrorResponse("Farm id is Required", res);
            }
            await Farm.findOneAndUpdate({ chainId, _id: farmId }, { isUnstaked: true })
            await Deposit.findOneAndUpdate({ farmId, chainId, wallet: wallet.toLowerCase() }, { isUnstaked: true })
            return res.status(200).send({ msg: "successfully removed the farm!" })
        } catch (error) {
            return response.sendErrorResponse(error, res)
        }
    },

    multiStake: async (req, res) => {
        try {
            const { chainId, wallet, farmId, tokenId } = req.body
            if (!chainId) {
                return response.sendValidationErrorResponse("Chain Id Required", res);
            }
            if (!wallet) {
                return response.sendValidationErrorResponse("Wallet is Required", res);
            }
            if (!tokenId) {
                return response.sendValidationErrorResponse("TokenId is Required", res);
            }
            if (farmId?.length == 0) {
                return response.sendValidationErrorResponse("Invalid farm id", res);
            }

            for (let index = 0; index < farmId.length; index++) {
                const id = farmId[index];
                const farm = await Farm.findOne({ _id: id })
                depositData.farmId = id
                depositData.chainId = chainId
                depositData.wallet = wallet?.toLowerCase()
                depositData.tokenId = tokenId
                depositData.tokenDecimal = farm?.rewardDecimal
                farm.nftCount += 1
                await farm.save()
                await Deposit.create(depositData)
            }

            return res.status(200).send({ msg: "successfully deposited!" })
        } catch (error) {
            return response.sendErrorResponse(error, res)
        }
    },

    unstakeAll: async (req, res) => {
        try {
            const { chainId, wallet, tokenId } = req.body
            if (!chainId) {
                return response.sendValidationErrorResponse("Chain Id Required", res);
            }
            if (!wallet) {
                return response.sendValidationErrorResponse("Wallet is Required", res);
            }
            const stakes = await Deposit.find({ chainId, wallet: wallet.toLowerCase(), isUnstaked: false })
            for (let index = 0; index < stakes.length; index++) {
                const element = stakes[index];
                await Deposit.findOneAndUpdate({ chainId, farmId: element?.farmId, wallet: wallet.toLowerCase(), tokenId, isUnstaked: false }, { isUnstaked: true })
            }
            return res.status(200).send({ msg: "successfully unstaked!" })

        } catch (error) {
            return response.sendErrorResponse(error, res)
        }
    },

    syncTvlAndApr: async (chainId) => {
        try {
            const query = { chainId, isUnstaked: true }
            const farms = await Farm.find(query);

            for (let index = 0; index < farms.length; index++) {
                const farm = farms[index];
                const getPool = request.getPoolDetails(CONST.poolDetailGraphQL[chainId]);
                let { pool } = await getPool(farm.pool);
                const usdPrice = await getQuote(chainId, farm.rewardToken, usdtAddr[chainId], farm.rewardDecimal)
                const incentiveData = {
                    startTime: farm.startTime,
                    endTime: farm.endTime
                }
                const apr = calculateAPR(pool, incentiveData, farm.reward, usdPrice)
                farm.apr = apr.apr
                farm.tvl = parseFloat(pool.totalValueLockedUSD).toFixed(3)
                await farm.save()
            }

        } catch (error) {

        }
    }
}