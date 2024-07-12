const express = require("express");
const router = express.Router();

//Import Controller
const UserController = require("./controller/incentiveController");



//public routes
router.post('/list', UserController.getData);
router.post('/myFarm', UserController.myFarm);
router.post('/deleted', UserController.deletedFarm);


module.exports = router;