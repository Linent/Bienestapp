import { errorsConstants } from "../constants/errors.constant.js"
import config from "../config/config.js";
const { handlerError } = require("../handlers/errors.handlers");

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
      return handlerError(res, 500, errorsConstants.serverError);
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
      return handlerError(res, 500, errorsConstants.serverError);
    }
  }
}

export default new WhatsappController();
