const axios = require("axios");

async function getQuote(chain, tokenIn, tokenOut, decimals) {
    try {
        const amount = 1* 10**decimals
        const params = {
            tokenInAddress: tokenIn,
            tokenInChainId: chain,
            tokenOutAddress: tokenOut,
            tokenOutChainId: chain,
            amount: amount.toString(),
            type: 'exactIn'
          };

          const baseURL = "https://vo7hqx6hkl.execute-api.us-east-1.amazonaws.com/prod"
          const result = await axios.get(`${baseURL}/quote`, { params });
          return parseFloat(result.data?.quoteDecimals).toFixed(2)

    } catch (error) {
        return null
    }
}


module.exports = {
    getQuote
}