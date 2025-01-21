//response function
const response = require("../../../utility/response");
const redisFunc = require("../../../utility/redis");
const { getQuote } = require("../../../helpers/quote");
const { net } = require("web3");
const Web3Intraction = require("../../../utility/web3Intraction");


const gobAddr = {
    10000: {
        tokenIn: "0x56381cb87c8990971f3e9d948939e1a95ea113a3", //gob
        tokenOut: "0xBc2F884680c95A02cea099dA2F524b366d9028Ba" //usdt
    },
    56: {
        tokenIn: "0x701ACA29AE0F5d24555f1E8A6Cf007541291d110", //gob
        tokenOut: "0x55d398326f99059fF775485246999027B3197955" // usdt
    },
    8453: {
        tokenIn: "0xcdba3e4c5c505f37cfbbb7accf20d57e793568e3", //gob
        tokenOut: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" //usdc
    }
}


const bchAddr = {
    10000: {
        tokenIn: "BCH", //BCH
        tokenOut: "0xBc2F884680c95A02cea099dA2F524b366d9028Ba" //bcusdt
    },
    56: {
        tokenIn: "0x8fF795a6F4D97E7887C79beA79aba5cc76444aDf", //bvh
        tokenOut: "0x55d398326f99059fF775485246999027B3197955" // usdt
    }
}

async function fetchQuote(chain){
    try {
        const web3 = new Web3Intraction(chain);
        const totalSupply = await web3.getGobStakes();
        const gobPrice = await getQuote(chain, gobAddr[chain]?.tokenIn, gobAddr[chain]?.tokenOut, 9)
        let rewardTokenPrice = gobPrice
        if (parseInt(chain) != 8453) {
            rewardTokenPrice = await getQuote(chain, bchAddr[chain]?.tokenIn, bchAddr[chain]?.tokenOut, 18)
        }
        const apr = await web3.getAPR(totalSupply, rewardTokenPrice, gobPrice)
        quote = { gobPrice, rewardTokenPrice, apr }
        if (quote?.gobPrice) {
            await redisFunc.setStringsWithExpiry(chain.toString() + "price", JSON.stringify(quote), 3600);
        }
        return quote
    } catch (error) {
        console.log(error, "++sync gob price and tvl")
    }
}

module.exports = {
    getPrice: async (req, res) => {
        const chain = req.query.chainId;
        try {
            let quote = await redisFunc.getString(chain.toString() + "price");
            if (!quote) {
                quote = await fetchQuote(chain)
            } else {
                quote = JSON.parse(quote);
            }

            return res.status(200).send({ data: quote });
        } catch (error) {
            return response.sendErrorResponse(error, res);
        }
    },
    fetchQuote
}

