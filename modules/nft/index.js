const express = require("express");
const router = express.Router();

//Import Controller
const NftController = require("./controller/nftController");


//public routes
router.post("/ownerNft", NftController.walletAddressNft);


module.exports = router;
