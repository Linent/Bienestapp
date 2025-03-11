import axios from "axios";
import config from "../config/config";

const API_TOKEN = config.API_TOKEN;
const API_VERSION = config.API_VERSION;
const BUSNESS_PHONE = config.BUSINESS_PHONE;

class WhatsAppService {
  async sendMessage(to, body, messageId) {
    try {
      const response = await axios.post({
        method: "POST",
        url: `https://graph.facebook.com/${API_VERSION}/${BUSNESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          to,
          text: { body },
          context: {
            message_id: messageId,
          },
        },
      });
      return response;
    } catch (error) {
      console.error(
        "Error sending message:",
        error.response?.data || error.message
      );
    }
  }

  async markAsRead(messageId) {
    try {
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/${API_VERSION}/${businessPhoneNumberId}/messages`,
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          statys: "read",
          message_id: messageId,
        },
      });
    } catch (error) {
      console.error(
        "Error sending message:",
        error.response?.data || error.message
      );
    }
  }
}
modules.exports = WhatsAppService;
