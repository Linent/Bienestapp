const axios = require("axios");
const config = require("../config/config");

const { API_TOKEN, API_VERSION, BUSINESS_PHONE } = config;

const apiClient = axios.create({
  baseURL: `https://graph.facebook.com/${API_VERSION}/${BUSINESS_PHONE}`,
  headers: {
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
  },
});

class WhatsAppService {
  async sendMessage(to, body) {
    return this._post("/messages", {
      messaging_product: "whatsapp",
      to,
      text: { body },
    });
  }

  async markAsRead(messageId) {
    return this._post("/messages", {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    });
  }

  async sendInteractiveButtons(to, bodyText, buttons) {
    return this._post("/messages", {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: { buttons },
      },
    });
  }

  async sendMediaMessage(to, type, mediaUrl, caption) {
    const mediaPayload = {
      messaging_product: "whatsapp",
      to,
      type,
      [type]: { link: mediaUrl },
    };

    if (type === "document") {
      mediaPayload.document.caption = caption;
      mediaPayload.document.filename = "document.pdf";
    }

    return this._post("/messages", mediaPayload);
  }

  // Método privado para evitar repetición
  async _post(endpoint, data) {
    try {
      const response = await apiClient.post(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(
        "WhatsApp API Error:",
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

module.exports = new WhatsAppService();
