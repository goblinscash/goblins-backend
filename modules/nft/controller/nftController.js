const response = require("../../../utility/response");
const {
  loadWalletTokenIds,
  loadContractTokenIds,
  loadWithdrawTokenIds,
  loadStakeTokenIds
} = require("../../../helpers/nftHelper");

module.exports = {
  walletAddressNft: async (req, res) => {
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
      if (payload.stakedNft) {
        let resData = await loadStakeTokenIds(
          payload.chainId,
          payload.walletAddress
        );
        return response.sendSuccessResponse({ data: resData }, res);
      } else if (payload.withdrawNft) {
        let resData = await loadWithdrawTokenIds(
          payload.chainId,
          payload.walletAddress
        );
        return response.sendSuccessResponse({ data: resData }, res);
      } else if (payload.ownerNft) {
        let resData = await loadWalletTokenIds(
          payload.chainId,
          payload.walletAddress
        );
        return response.sendSuccessResponse({ data: resData }, res);
      } else {
        let resData = await loadContractTokenIds(
          payload.chainId,
          payload.walletAddress
        );
        return response.sendSuccessResponse({ data: resData }, res);
      }
    } catch (error) {
      console.log(error, "<====error");
      return response.sendErrorResponse(error, res);
    }
  },
};
