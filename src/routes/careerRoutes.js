const express = require("express");
const router = express.Router();
const careerController = require("../controllers/careerController");

router.post("/create", careerController.createCareer);
router.get("/", careerController.getAllCareers);

module.exports = router;
