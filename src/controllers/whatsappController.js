import { errorsConstants } from "../constants/errors.constant.js"
import config from "../config/config.js";
import { handlerError } from "../handlers/errors.handlers.js";
import { sendMessage } from "../services/whatsappService.js";
class WhatsappController {
  async verifyWebhook(req, res) {
    try {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode === "subscribe" && token === config.WEBHOOK_VERIFY_TOKEN) {
        res.status(200).send(challenge);
        console.log("Webhook verified successfully!");
      } else {
        res.sendStatus(403);
      }
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  }
  async handleIncoming(req, res) {
    try {
      const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
      const senderInfo = req.body.entry?.[0]?.changes[0]?.value?.contacts?.[0];
  
        if (message) {
          await messageHandler.handleIncomingMessage(message, senderInfo);  
        }
        res.sendStatus(200);
     
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  }
}

export default new WhatsappController();
