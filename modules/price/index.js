const express = require("express");
const router = express.Router();

//Import Controller
const PriceController = require("./controller/priceController");

//public routes
router.get("/gob", PriceController.getPrice);


module.exports = router;
