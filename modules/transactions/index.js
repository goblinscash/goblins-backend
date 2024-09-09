const express = require("express");
const router = express.Router();

//Import Controller
const trxnController = require("./controller/trxnController");


//public routes
router.post("/stakingTrxn", trxnController.getStakingTransaction);


module.exports = router;
