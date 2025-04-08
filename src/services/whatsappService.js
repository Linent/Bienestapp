import axios from "axios";
import config from "../config/config";
import { fi } from "date-fns/locale";

const API_TOKEN = config.API_TOKEN;
const API_VERSION = config.API_VERSION;
const BUSNESS_PHONE = config.BUSINESS_PHONE;
const url = `https://graph.facebook.com/${API_VERSION}/${BUSNESS_PHONE}/messages`;
const headers = {
  Authorization: `Bearer ${API_TOKEN}`,
  "Content-Type": "application/json",
};
class WhatsAppService {
  async sendMessage(to, body, messageId) {
    try {
      console.log(body);
      const response = await axios({
        method: "POST",
        url,
        headers,
        data: {
          messaging_product: "whatsapp",
          to,
          text: { body },
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
        url,
        headers,
        data: {
          messaging_product: "whatsapp",
          status: "read",
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

  async sendInteractiveButtons(to, BodyText, buttons) {
    try {
      console.log(to, BodyText, buttons);
      const response = await axios({
        method: "POST",
        url,
        headers,
        data: {
          messaging_product: "whatsapp",
          to,
          type: "interactive",
          interactive: {
            type: "button",
            body: { text: BodyText },
            action: {
              buttons,
            },
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

  async sendMediaMessage(to, type, mediaUrl, caption) {
    try {
      const mediaObject = {};
      switch (type) {
        case "image":
          mediaObject.image = { link: mediaUrl };
          break;
        case "audio":
          mediaObject.audio = { link: mediaUrl };
          break;
        case "video":
          mediaObject.video = { link: mediaUrl };
          break;
        case "document":
          mediaObject.document = { link: mediaUrl, caption, filename: ".pdf" };
          break;
        default:
          throw new Error("Unsupported media type");
      }
      await axios({
        method: "POST",
        url,
        headers,
        data: {
          messaging_product: "whatsapp",
          to,
          type: type,
          ...mediaObject,
        },
      });
    } catch (error) {
      console.error(
        "Error sending Media:",
        error.response?.data || error.message
      );
    }
  }
}
export default new WhatsAppService();
