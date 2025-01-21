const express = require("express")
const router = express.Router()

const farmController = require("./controller/farmController")

router.post("/create", farmController.create);
router.get('/list', farmController.list);
router.post('/deposit', farmController.deposit);
router.post('/unstake', farmController.unstake)
router.get('/myfarm', farmController.myFarm)
router.post('/delete', farmController.deleteFarm)
router.post('/multistake', farmController.multiStake);
router.post('/unstakeall', farmController.unstakeAll);
router.get('/claim', farmController.getDeletedFarm)
router.get('/id', farmController.getFarmId)
router.get('/checkstaked-status', farmController.unstakeStatus)


module.exports = router;