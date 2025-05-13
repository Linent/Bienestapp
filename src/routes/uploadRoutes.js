const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");
const Auth = require("../middlewares/authMiddleware");

router.post("/", Auth, uploadController.uploadFile);

module.exports = router;