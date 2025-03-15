const express = require("express");
const router = express.Router();
const advisoryController = require('../controllers/advisoryController')

router.post('/create', advisoryController.createAdvisory);
router.get('/', advisoryController.getAllAdvisories);

module.exports = router;