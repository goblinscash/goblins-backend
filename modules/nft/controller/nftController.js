const response = require("../../../utility/response");
const { loadWalletTokenIds, loadContractTokenIds } = require("../../../helpers/nftHelper");

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
      let resData = [];
      if (payload.ownerNft) {
        resData = await loadWalletTokenIds(
          payload.chainId,
          payload.walletAddress
        );
      } else {
        resData = await loadContractTokenIds(
          payload.chainId,
          payload.walletAddress
        );
      }

      return response.sendSuccessResponse({ data: resData }, res);
    } catch (error) {
      console.log(error, "<====error");
      return response.sendErrorResponse(error, res);
    }
  },

  contractAddressNft: async (req, res) => {
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

      let resData = await loadWalletTokenIds(
        payload.chainId,
        payload.walletAddress
      );

      return response.sendSuccessResponse({ data: resData }, res);
    } catch (error) {
      console.log(error, "<====error");
      return response.sendErrorResponse(error, res);
    }
  },
};
