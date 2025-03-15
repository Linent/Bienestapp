const express = require("express");
const router = express.Router();
const subjectController = require('../controllers/subjectController');

router.post("/create", subjectController.create);
router.get("/", subjectController.getSubjects);
router.get("/:id", subjectController.getSubjectById);
router.put("/:id", subjectController.update);
router.delete("/:id", subjectController.deleteSub);

module.exports = router;