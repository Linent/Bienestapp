const express = require("express");
const router = express.Router();
const careerController = require("../controllers/careerController");
const Auth = require("../middlewares/authMiddleware");

router.post("/create", Auth, careerController.createCareer);
router.get("/", Auth,careerController.getAllCareers);
router.get("/:id", Auth, careerController.getCareerById);
router.put("/:id", Auth, careerController.updateCareer);
router.post("/enable/:id", Auth, careerController.enableCareer);

module.exports = router;
