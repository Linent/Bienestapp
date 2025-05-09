const advisoryService = require("./advisoryService");
const whatsappService = require("./whatsappService");
const userService = require("./userService");
const scheduleService = require("./scheduleService");
const careerService = require("./CareerService");
const openAiService = require("./openAiService");
const { loadPDFContent } = require("../utils/loadPdfContent");
const askGemini = require("./geminiService");
const Topic = require("../services/topicService");
const config = require("../config/config");
const BASE_URL = config.API_BASE_URL

class MessageHandler {
  constructor() {
    this.appointmentState = {};
    this.assistandState = {};
  }

  async handleIncomingMessage(message, senderInfo) {
    try {
      if (message?.type === "text") {
        const incomingMessage = message.text.body.toLowerCase().trim();

        if (this.isGreeting(incomingMessage)) {
          await this.sendWelcome(message.from, message.id, senderInfo);
          await this.sendWelcomeMenu(message.from);
        } else if (incomingMessage === "media") {
          await this.sendMedia(message.from);
        } else if (this.appointmentState[message.from]) {
          await this.handleAppointmentFlow(message.from, incomingMessage);
        } else if (this.assistandState[message.from]) {
          await this.handleAssistandFlow(message.from, incomingMessage);
        } else {
          const response = `Echo: ${message.text.body}`;
          await whatsappService.sendMessage(message.from, response, message.id);
        }

        await whatsappService.markAsRead(message.id);
      } else if (message?.type === "interactive") {
        const selectedOption = message.interactive?.button_reply?.title
          ?.toLowerCase()
          .trim();

        // ✅ Detectar retroalimentación del asistente
        if (["sí, gracias", "hacer otra pregunta"].includes(selectedOption)) {
          await this.handleAssistandFeedback(message.from, selectedOption);
        } else {
          await this.handleMenuOption(message.from, selectedOption);
        }

        await whatsappService.markAsRead(message.id);
      }
    } catch (error) {
      console.error("Error en handleIncomingMessage:", error);
    }
  }

  // ✅ Saludo simple
  isGreeting(message) {
    return [
      "hola",
      "buenos días",
      "buenas tardes",
      "buenas noches",
      "quiero saber algo",
    ].includes(message);
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
  // ✅ Maneja botones después de una respuesta: "Sí, gracias" / "Hacer otra pregunta"
  async handleAssistandFeedback(to, selectedOption) {
    let responseMessage;

    switch (selectedOption.toLowerCase()) {
      case "sí, gracias":
        delete this.assistandState[to];
        responseMessage =
          "¡Nos alegra haber sido de ayuda! 😊 Si necesitas algo más, no dudes en escribirnos.";
        break;

      case "hacer otra pregunta":
        this.assistandState[to] = { step: "question" };
        responseMessage =
          "Perfecto. Puedes escribirme tu nueva pregunta sobre los servicios de bienestar universitario.";
        break;

      default:
        responseMessage =
          "No entendimos tu respuesta. Por favor selecciona una opción válida.";
    }

    await whatsappService.sendMessage(to, responseMessage);
  }
  // ✅ Enviar mensaje de bienvenida
  async sendWelcome(to, msgId, senderInfo) {
    const name = this.capitalizarTexto(this.getSenderName(senderInfo)).split(
      " "
    )[0];
    await whatsappService.sendMessage(
      to,
      `¡Hola ${name}! 👋 Bienvenido(a) al asistente de bienestar universitario.`,
      msgId
    );
  }

  async sendWelcomeMenu(to) {
    const menuMessage = "¿En qué podemos ayudarte hoy?";
    const buttons = [
      {
        type: "reply",
        reply: { id: "option_1", title: "Agendar asesoría" },
      },
      {
        type: "reply",
        reply: { id: "option_2", title: "Consultar servicios" },
      },
    ];

    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  // ✅ Muestra menú principal y activa flujos
  async handleMenuOption(to, selectedOption) {
    let responseMessage;

    switch (selectedOption.toLowerCase()) {
      case "agendar asesoría":
        this.appointmentState[to] = { step: "showAdvisors" };
        responseMessage =
          "Perfecto. Vamos a agendar tu asesoría. 📚 Buscando asesores disponibles...";
        await this.handleAppointmentFlow(to, null);
        return;

      case "consultar servicios":
        this.assistandState[to] = { step: "question" };
        responseMessage =
          `Has seleccionado consultar servicios. Estos son algunos temas sobre los que puedes preguntar:\n\n` +
          `1 Servicio Médico\n` +
          `2 Servicio Odontológico\n` +
          `3 Servicio Psicológico\n` +
          `4 Servicio Psicosocial\n` +
          `5 Asesoría Espiritual\n` +
          `6 Amigos Académicos\n` +
          `Bienestar Universitario \n`+
          `¿Sobre qué necesitas saber más?`;
        break;

      default:
        responseMessage =
          "Opción no válida. Por favor, selecciona una opción válida del menú.";
    }

    await whatsappService.sendMessage(to, responseMessage);
  }

  async sendMedia(to) {
    const mediaUrl = "https://s3.amazonaws.com/gndx.dev/medpet-file.pdf"; // cambia esto por tu URL real
    const caption = "Aquí tienes un archivo PDF de ejemplo.";
    const type = "document";
    await whatsappService.sendMediaMessage(to, type, mediaUrl, caption);
  }

  async handleAppointmentFlow(to, message) {
    const state = this.appointmentState[to] || { step: "showAdvisors" };
    let responseMessage;

    if (state.step === "showAdvisors" && message === null) {
      message = "";
    }

    try {
      switch (state.step) {
        case "showAdvisors": {
          const advisors = await advisoryService.getAdvisoriesThisWeek();
          if (!advisors.length) {
            responseMessage = "😕 No hay asesores disponibles esta semana.";
            break;
          }

          state.step = "selectAdvisor";
          state.advisors = advisors;

          responseMessage =
            "📚 *Asesores disponibles:*\n\n" +
            advisors
              .map(
                (a, i) =>
                  `👤 *${a.name}*\n🆔 Código: ${a.codigo}\n`
              )
              .join("\n\n") +
            `\n\n✍️ Escribe el código del asesor con el que deseas agendar.`;
          break;
        }

        case "selectAdvisor": {
          const selectedAdvisor = state.advisors.find(
            (a) => a.codigo === message.trim()
          );
          if (!selectedAdvisor) {
            responseMessage =
              "❌ Código no válido. Por favor intenta de nuevo.";
            break;
          }

          state.advisor = selectedAdvisor;
          state.step = "selectDay";
          responseMessage = `✅ Seleccionaste a *${
            selectedAdvisor.name
          }*.\n\nDías disponibles:\n${selectedAdvisor.horarios
            .map((h) => `- ${h}`)
            .join(
              "\n"
            )}\n\n✍️ Escribe el día en que deseas agendar (ej: *miércoles*).`;
          break;
        }

        case "selectDay": {
          const validDays = state.advisor.horarios.map((h) =>
            h.split(" ")[0].toLowerCase()
          );
          if (!validDays.includes(message.trim().toLowerCase())) {
            responseMessage = "❌ Día no válido. Intenta nuevamente.";
            break;
          }

          state.selectedDay = message.trim().toLowerCase();
          state.step = "selectHour";

          const dayHorarios = state.advisor.horarios.filter((h) =>
            h.toLowerCase().startsWith(state.selectedDay)
          );

          const horasDisponibles = dayHorarios.map((h) => {
            const hora = h.split(" - ");
            return hora.length > 1 ? hora[1].trim() : "Hora no definida";
          });

          responseMessage =
            `⏰ Ingresa la *hora* en la que deseas agendar tu asesoría (formato 24h, ej: 14:00).\n\n` +
            `📆 *Día:* ${state.selectedDay}\n🕐 *Franja:* \n` +
            dayHorarios.map((h) => `• ${h}`).join("\n");
          break;
        }

        case "selectHour": {
          const isValid = /^\d{2}:\d{2}$/.test(message.trim());
          if (!isValid) {
            responseMessage =
              "❌ Hora no válida. Usa el formato HH:mm (ej: 09:30).";
            break;
          }

          state.selectedHour = message.trim();
          state.step = "topic";
          responseMessage = "📝 ¿Cuál es el tema de la asesoría?";
          break;
        }

        case "topic": {
          state.topic = message.trim();
          state.step = "email";
          responseMessage = "📧 Por favor, ingresa tu correo institucional.";
          break;
        }

        case "email": {
          state.email = message.trim().toLowerCase();
          state.step = "codigoEstudiante";
          responseMessage =
            "🎓 Ingresa tu *código de estudiante* (Ej: 1012345678).";
          break;
        }

        case "codigoEstudiante": {
          const codigoEstudiante = message.trim();

          if (!/^\d{3,}$/.test(codigoEstudiante)) {
            responseMessage =
              "❌ Código de estudiante no válido. Intenta de nuevo.";
            break;
          }

          const codigoCarrera = codigoEstudiante.substring(0, 3);
          const career = await careerService.findByCode(codigoCarrera);

          if (!career) {
            responseMessage = `❌ No se encontró una carrera con el código ${codigoCarrera}. Intenta de nuevo.`;
            break;
          }

          state.career = career._id;
          state.studentCode = codigoEstudiante;
          state.step = "cedula";
          responseMessage = "🆔 Ingresa tu número de cédula.";
          break;
        }

        case "cedula": {
          state.cedula = message.trim();
          state.step = "name";
          responseMessage = "🧑 Por último, ingresa tu nombre completo.";
          break;
        }

        case "name": {
          state.name = message.trim();

          let student = await userService.findByEmail(state.email);
          if (!student) {
            student = await userService.registerUser(
              state.name,
              state.email,
              state.cedula,
              "student",
              state.career,
              state.studentCode
            );
          }

          const advisory = await advisoryService.findOneByAdvisorAndDay(
            state.advisor.advisorCode,
            state.selectedDay,
            state.selectedHour
          );

          if (!advisory) {
            responseMessage =
              "⚠️ No se encontró una asesoría activa ese día. Intenta otro.";
            break;
          }

          await scheduleService.createSchedule(
            student._id,
            state.topic,
            advisory._id
          );

          responseMessage = `✅ ¡Listo ${state.name}!\nTu asesoría fue agendada con *${state.advisor.name}* el *${state.selectedDay}* sobre *${state.topic}*.\n\n📍 Te esperamos.`;
          delete this.appointmentState[to];
          break;
        }

        default:
          responseMessage = "❌ Algo salió mal. Reinicia el proceso.";
          delete this.appointmentState[to];
      }

      this.appointmentState[to] = state;
      await whatsappService.sendMessage(to, responseMessage);
    } catch (error) {
      console.error("Error en handleAppointmentFlow:", error);
      await whatsappService.sendMessage(
        to,
        "❌ Ocurrió un error. Intenta nuevamente."
      );
      delete this.appointmentState[to];
    }
  }

  /* async handleAssistandFlow(to, message) {
    const state = this.assistandState[to];
    let responseMessage; 
    const menuMessage = '¿La respuesta fue de tu ayuda?'
    const buttons = [
      {
        type: 'reply',
        reply: { id: 'option_4', title: 'Sí, gracias' },
      },
      {
        type: 'reply',
        reply: { id: 'option_5', title: 'Hacer otra pregunta' },
      },
    ];
    if(state.step==='question'){
      responseMessage = await openAiService(message);
    }
    delete this.assistandState[to];
    await whatsappService.sendMessage(to, responseMessage);
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
    await whatsappService.markAsRead(message.id);
  } */
    async handleAssistandFlow(to, message) {
  const state = this.assistandState[to];
  let responseMessage;
  const menuMessage = "¿La respuesta fue de tu ayuda?";
  const buttons = [
    {
      type: "reply",
      reply: { id: "option_4", title: "Sí, gracias" },
    },
    {
      type: "reply",
      reply: { id: "option_5", title: "Hacer otra pregunta" },
    },
  ];

  try {
    if (state.step === "question") {
      // 👉 URL base dinámica

      const searchUrl = await Topic.getTopicsByKeyword(message);

      
      const foundTopic = searchUrl;
      if (!foundTopic) {
        responseMessage =
          "Lo siento, no encontré información relacionada con tu consulta. Intenta reformular la pregunta.";
      } else {
        // 👉 Construcción dinámica de URL pública del archivo
        const pdfUrl = `src/${foundTopic.filePath}`;
        console.log(pdfUrl);
        const pdfText = await loadPDFContent(pdfUrl);

        responseMessage = await askGemini(message, pdfText);
      }
    }

    await whatsappService.sendMessage(to, responseMessage);
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  } catch (error) {
    console.error("Error en handleAssistandFlow:", error);
    await whatsappService.sendMessage(
      to,
      "Lo sentimos, ocurrió un error al procesar tu consulta."
    );
  }
}
}

module.exports = new MessageHandler();
