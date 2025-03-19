const express = require("express");
const router = express.Router();
const advisoryController = require("../controllers/advisoryController");
const Auth = require("../middlewares/authMiddleware");

router.post("/create", Auth, advisoryController.createAdvisory);
router.get("/", Auth, advisoryController.getAllAdvisories);
router.get("/:advisoryId", Auth, advisoryController.getAdvisoryById);
router.put("/:advisoryId", Auth, advisoryController.updateAdvisory);
router.delete("/:advisoryId", Auth, advisoryController.deleteAdvisory);
router.get("/report/:filterType", Auth, advisoryController.getReportByDate);
router.get("/report/top-careers", Auth, advisoryController.getTopCareersReport);
module.exports = router;
