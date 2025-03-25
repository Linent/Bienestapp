const express = require("express");
const router = express.Router();
const careerController = require("../controllers/careerController");
const Auth = require("../middlewares/authMiddleware");

router.post("/create", Auth, careerController.createCareer);
router.get("/", Auth, careerController.getAllCareers);

module.exports = router;
