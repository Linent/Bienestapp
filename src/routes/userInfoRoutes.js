const express = require("express");
const router = express.Router();
const Auth = require ("../middlewares/authMiddleware");
const userInfoController = require("../controllers/userInfoController");

router.post("/create", Auth,userInfoController.registerUserInfo);
router.get("/All", Auth, userInfoController.getUserInfoAll);

module.exports = router;