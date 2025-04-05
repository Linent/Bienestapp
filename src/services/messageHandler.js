import whatsappService from "./whatsappService";

class MessageHandler {
  async handleIncomingMessage(message, senderInfo) {
    try {
      if (message?.type === "text") {
        const incommingMessage = message.text.body.toLowerCase().trim();

        if (this.isGreeting(incommingMessage)) {
          await this.sendWelcome(message.from, message.id, senderInfo);
          await this.sendWelcomeMenu(message.from);
          return;
        }
        const response = `Echo: ${message.text.body}`;
        await whatsappService.sendMessage(message.form, response, message.id);
        await whatsappService.markAsRead(message.id);
      } else if (message?.type === "interactive") {
        const selectedOption = message.interactive?.button_reply?.title
          .toLowerCase()
          .trim();
        const response = `Has seleccionado la opción: ${selectedOption}`;
        await this.handleMenuOption(message.from, selectedOption);
        await whatsappService.markAsRead(message.id);
      }
    } catch (error) {
      console.error(error);
    }
  }
  async isGreeting(message) {
    const greetings = ["hola", "buenos días", "buenas tardes", "buenas noches"];
    return greetings.includes(message);
  }
  getSenderName(senderInfo) {
    return senderInfo?.profile?.name || senderInfo?.wa_id || "Estudiante";
  }
  capitalizarTexto(texto) {
    return texto
      .toLowerCase()
      .split(" ")
      .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(" ");
  }

  async sendWelcome(to, messageId, senderInfo) {
    const nameMayuscula = this.getSenderName(senderInfo);
    const name = this.capitalizarTexto(nameMayuscula).split(" ")[0];
    const welcomeMessage = `Hola ${name}, bienvenido a nuestra plataforma. ¿En qué puedo ayudarte?`;
    await whatsappService.sendMessage(to, welcomeMessage, messageId);
    await whatsappService.markAsRead(messageId);
  }

  async sendWelcomeMenu(to) {
    const menuMessage = `Hola, ¿En qué puedo ayudarte?`;
    const buttons = [
      {
        type: "reply",
        reply: { id: "option_1", title: "Agendar una asesoria" },
      },
      {
        type: "reply",
        reply: { id: "option_2", title: "Consultar servicios" },
      },
      // { type: "reply", reply: { id: "option_1", title: "Perfil" } },
    ];
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }
  async handleMenuOption(to, selectedOption) {
    let responseMessage = "";
    switch (selectedOption) {
      case "agendar una asesoria":
        responseMessage =
          "Has seleccionado la opción de agendar una asesoría. ¿En qué puedo ayudarte?";
        break;
      case "consultar servicios":
        responseMessage =
          "Has seleccionado la opción de consultar servicios. ¿En qué puedo ayudarte?";
        break;
      default:
        responseMessage =
          "Opción no válida. Por favor, selecciona una opción válida.";
    }
    await whatsappService.sendMessage(to, responseMessage);
  }
}

export default new MessageHandler();
