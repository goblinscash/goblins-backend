const response = require("../../../utility/response");
const Farm = require("../models/farmModel");
const CONST = require("../../../config/constant.json");
const request = require("../../../graphQl/requests");
const Web3Intraction = require("../../../utility/web3Intraction");
const { getQuote } = require("../../../helpers/quote");
const { calculateAPR } = require("../../../helpers/IncentiveHelper");
const Deposit = require("../models/depositModel");
const { makeComputeData } = require("../../../helpers/computeIncentive");
const { default: axios } = require("axios");

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

            const _farm = await Farm.findOne({ incentiveId })
            if (_farm) {
                return res.status(200).send({ msg: "Farm created successfully!" })
            }
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

            const _incentiveId = "0x10223c60c2b77ff082c1141571608933cb5d3d74f9c7de9aa14cff6756d792a6"
            const query = isEndedBoolean
                ? { chainId: chainId, isUnstaked: false, endTime: { $lt: currentTime }, incentiveId : { $ne: _incentiveId } }
                : { chainId: chainId, isUnstaked: false, endTime: { $gt: currentTime }, incentiveId : { $ne: _incentiveId } };


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

            const web3 = new Web3Intraction(chainId);
            const _farms = []
            for (let index = 0; index < transformedFarms.length; index++) {
                const element = transformedFarms[index];
                const count = await web3.nftCount(element.incentiveId)
                element.nftCount = count.numberOfStakes.toString()
                _farms.push(element)
                
            }

            return response.sendSuccessResponse({ data: _farms }, res);
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
            
            const _stake = await Deposit.findOne({ chainId, farmId, tokenId, wallet: wallet.toLowerCase(), isUnstaked: false })
            if (_stake) {
                return res.status(200).send({ msg: "successfully deposited!" })
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
                            reward: "$reward",
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
                console.log(getRewards?.reward, element.key, element.tokenId)
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
            await Deposit.findOneAndUpdate({ chainId, farmId, wallet: wallet.toLowerCase(), isUnstaked: false }, { isUnstaked: true })
            const _farm = await Farm.findOne({ _id: farmId })
            if (_farm) {
                _farm.nftCount = (_farm.nftCount || 0) - (_farm.nftCount ? 1 : 0);
                await _farm.save()
            }
            return res.status(200).send({ msg: "successfully unstaked!" })
        } catch (error) {
            return response.sendErrorResponse(error, res)
        }
    },

    deleteFarm: async (req, res) => {
        try {
            const { chainId, farmId } = req.body
            if (!chainId) {
                return response.sendValidationErrorResponse("Chain Id Required", res);
            }
            if (!farmId) {
                return response.sendValidationErrorResponse("Farm id is Required", res);
            }

            const farm = await Farm.findOne({ chainId, _id: farmId });
            if (!farm) {
                return response.sendValidationErrorResponse("Farm not found", res);
            }

            const currentTime = Date.now();
            if (currentTime < farm.endTime) {
                return res.status(400).send({
                    msg: "Cannot delete farm: End time has not been reached yet."
                });
            }

            await Farm.findOneAndUpdate({ chainId, _id: farmId }, { isUnstaked: true })
            await Deposit.updateMany(
                { farmId, chainId },
                { $set: { isUnstaked: true } }
            );
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
                const _stake = await Deposit.findOne({ chainId, farmId: id, tokenId, wallet: wallet.toLowerCase(), isUnstaked: false })
                if (!_stake) {
                    await farm.save()
                    await Deposit.create(depositData)
                }
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
                const _farm = await Farm.findOne({ _id: element?.farmId })
                if (_farm) {
                    _farm.nftCount = (_farm.nftCount || 0) - (_farm.nftCount ? 1 : 0);
                    await _farm.save()
                }
            }
            return res.status(200).send({ msg: "successfully unstaked!" })

        } catch (error) {
            return response.sendErrorResponse(error, res)
        }
    },

    getDeletedFarm: async (req, res) => {
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
                    $match: { wallet: wallet.toLowerCase(), chainId: parseInt(chainId), isUnstaked: true }
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

            const uniqueDeposits = deposits.filter((deposit, index, self) =>
                index === self.findIndex(d => d.key?.rewardToken.toLowerCase() === deposit.key?.rewardToken.toLowerCase())
            )

            for (let index = 0; index < uniqueDeposits.length; index++) {
                const element = uniqueDeposits[index];
                let getRewards = await web3.getRewards(
                    element.key?.rewardToken,
                    wallet
                );
                element.rewardInfo.reward = getRewards?.toString() / 10 ** element.rewardInfo?.tokenDecimal
            }

            const filteredDeposits = uniqueDeposits.filter(deposit => deposit.rewardInfo.reward > 0)

            return response.sendSuccessResponse({ data: filteredDeposits }, res);
        } catch (error) {
            return response.sendErrorResponse(error, res)
        }
    },

    getFarmId: async (req, res) => {
        try {
            const { chainId, incentiveId } = req.query
            if (!chainId) {
                return response.sendValidationErrorResponse("Chain Id Required", res);
            }

            const farm = await Farm.findOne({ chainId, incentiveId })
            return res.status(200).send({ id: farm._id })

        } catch (error) {
            return response.sendErrorResponse(error, res)
        }
    },

    unstakeStatus: async (req, res) => {
        try {
            const { chainId } = req.query
            if (!chainId) {
                return response.sendValidationErrorResponse("Chain Id Required", res);
            }

            const unstakedFarms = await Farm.find({ chainId, isUnstaked: true })
            let count = 0
            for (let index = 0; index < unstakedFarms.length; index++) {
                const element = unstakedFarms[index];
                const deposit = await Deposit.find({ farmId: element._id, isUnstaked: false })
                if (deposit) {
                    count += deposit.length
                }
            }
            return res.status(200).send({ data: count })

        } catch (error) {
            return response.sendErrorResponse(error, res)
        }
    },

    //CRON FUNTIONS
    syncTvlAndApr: async (chainId) => {
        try {
            const query = { chainId, isUnstaked: false }
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
                const _farm = await Farm.findOne({ _id: farm._id })
                _farm.apr = apr.apr
                _farm.tvl = parseFloat(pool.totalValueLockedUSD).toFixed(3)
                await _farm.save()
                console.log("++++++", apr)
            }

        } catch (error) {
            console.log(error, "++syncTVLAndApr")
        }
    },

    handleFarmTermination: async (chainId) => {
        try {
            const web3 = new Web3Intraction(chainId.toString());
            const currentTime = Math.floor(Date.now() / 1000);
            const farms = await Farm.find({ chainId, isUnstaked: false, endTime: { $lt: currentTime } })
            if (farms.length) {
                for (let index = 0; index < farms.length; index++) {
                    const element = farms[index];
                    const deposits = await Deposit.find({ chainId, farmId: element._id, isUnstaked: false })
                    const tokenIds = deposits.map((item) => item.tokenId)

                    await web3.endIncentive(
                        [element.rewardToken, element.pool, element.startTime.toString(), element.endTime.toString(), element.refundee],
                        tokenIds
                    )

                    await Farm.findOneAndUpdate({ chainId, _id: element._id }, { isUnstaked: true })
                    await Deposit.updateMany(
                        { farmId: element._id, chainId },
                        { $set: { isUnstaked: true } }
                    );

                }
            }

            console.log(farms.length, "+farm terminated")
        } catch (error) {
            console.log(error, "++handleFarmTermination")
        }
    },

    handleFarmCreation: async (chainId) => {
        try {
            const apiUrl = 'https://api.goblins.cash/api/v1/farm/create';
            const web3 = new Web3Intraction(chainId);
            for (let index = 0; index < CONST.farms[chainId].length; index++) {
                const element = CONST.farms[chainId][index];

                const start = Math.ceil((Date.now() / 1000 ) + 5 * 60);
                const end = start + 300 //7 * 24 * 60 * 60;
                element.startTime = start 
                element.endTime = end

                const incentiveId = await makeComputeData([
                    element.rewardToken,
                    element.pool,
                    element.startTime.toString(),
                    element.endTime.toString(),
                    element.refundee,
                ])
                await web3.createIncentive(
                    [
                        element.rewardToken,
                        element.pool,
                        element.startTime.toString(),
                        element.endTime.toString(),
                        element.refundee,
                    ],
                    element.reward,
                    element.minWidth,
                    element.rewardToken
                );

                const data = {
                    chainId,
                    createdData: element
                }
                await axios.post(apiUrl, data, { timeout: 10000 });
                console.log("farm created incentiveId: ", incentiveId);
            }
        } catch (error) {
            console.log(error, "++handleFarmCreation")
        }
    }
}