import express from "express";
import whatsappController from "../controllers/whatsappController.js";

const router = express.Router();

router.post("/webhook", whatsappController.handleIncoming);
router.get("/webhook", whatsappController.verifyWebhook);
module.exports = router;
