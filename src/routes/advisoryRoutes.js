const express = require("express");
const router = express.Router();
const advisoryController = require('../controllers/advisoryController')

router.post('/create', advisoryController.createAdvisory);
router.get('/', advisoryController.getAllAdvisories);
router.get("/:advisoryId", advisoryController.getAdvisoryById);
router.put("/:advisoryId", advisoryController.updateAdvisory);
router.delete("/:advisoryId", advisoryController.deleteAdvisory);
router.get("/report/:filterType", advisoryController.getReportByDate);
router.get("/report/top-careers", advisoryController.getTopCareersReport);
module.exports = router;