const express = require("express");
const router = express.Router();
import userController from "../controllers/userController";
import Auth from "../middlewares/authMiddleware";

router.get("/", Auth, userController.getAllUsers);
router.post("/recovery-password/:token", userController.recoveryPassword);
router.post("/register", userController.register);
router.post("/login", userController.login);

router.post('/forgot-password', userController.forgotPassword);
router.get("/:userId", Auth,userController.getUserById);
router.post("/:userId", Auth, userController.updateUser);
router.post("/enable/:userId", Auth, userController.disableUser);
router.post("/send-email", Auth,userController.sendWelcomeEmail);

module.exports = router;
