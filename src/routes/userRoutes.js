const express = require("express");
const router = express.Router();
import userController from "../controllers/userController";
import Auth from "../middlewares/authMiddleware";

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/send-email", Auth,userController.sendWelcomeEmail);
router.get("/", Auth, userController.getAllUsers);
router.get("/:userId", Auth,userController.getUserById);
router.post("/:usarId", Auth, userController.disableUser);
router.get("/mail",  userController.sendPruebas);

module.exports = router;
