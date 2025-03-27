const express = require("express");
const router = express.Router();
import userController from "../controllers/userController";
import Auth from "../middlewares/authMiddleware";

router.get("/", Auth, userController.getAllUsers);
router.post("/recovery-password/:token", userController.recoveryPassword);
router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/mail",  userController.sendPruebas);
router.post('/forgot-password', userController.forgotPassword);
router.get("/:userId", Auth,userController.getUserById);
router.post("/:usarId", Auth, userController.disableUser);
router.post("/send-email", userController.sendWelcomeEmail);

module.exports = router;
