const advisoryService = require("./advisoryService");
const whatsappService = require("./whatsappService");
const userService = require("./userService");
const userInfoService = require("./userInfoService");
const scheduleService = require("./scheduleService");
const careerService = require("./CareerService");
//const openAiService = require("./openAiService");
const { loadPDFContent } = require("../utils/loadPdfContent");
const askGemini = require("./geminiService");
const Topic = require("../services/topicService");
const config = require("../config/config");
const { DOCUMENT_TYPES, BENEFICIARY_TYPES } = require("../constants/userEnums");
const { mapNumberToKeyword } = require("../utils/mapNumberToKeyWord");

const BASE_URL = config.API_BASE_URL;

class MessageHandler {
  constructor() {
    this.appointmentState = {};
    this.assistandState = {};
    this.userInfoState = {};
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
        } else if (this.userInfoState[message.from]) {
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
    const normalized = message
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const greetings = [
      "hola",
      "holaa",
      "holi",
      "holis",
      "ola",
      "ola k ase",
      "hello",
      "hey",
      "buenos dias",
      "buenas tardes",
      "buenas noches",
      "buen dia",
      "buenas",
      "saludos",
      "que tal",
      "que mas",
      "necesito ayuda",
      "tengo una duda",
      "quiero saber algo",
      "quiero preguntar algo",
      "ayuda",
      "informacion",
      "una pregunta",
      "👋",
      "🙋",
      "🙋‍♂️",
      "🙋‍♀️",
    ];

    return greetings.some((greet) => normalized.includes(greet));
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
        if (!this.userInfoState[to]) {
          this.userInfoState[to] = { step: "fullName", data: { phone: to } };
          responseMessage =
            "Has seleccionado consultar servicios.\n\n📋 Antes de continuar, necesitamos algunos datos básicos.\n\n👤 Por favor, indícanos tu *nombre completo*.";
        }
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
              .map((a, i) => `👤 *${a.name}*\n🆔 Código: ${a.codigo}\n`)
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

    let responseMessage = "";

    const normalize = (text) =>
      text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    try {
      if (!this.userInfoState[to] && !this.assistandState[to]) {
        this.userInfoState[to] = { step: "fullName", data: { phone: to } };
        await whatsappService.sendMessage(
          to,
          "👤 Por favor, indícanos tu *nombre completo*."
        );
        return;
      }

      const state = this.userInfoState[to];

      if (state) {
        switch (state.step) {
          case "fullName":
            state.data.fullName = message;
            state.step = "documentType";
            await whatsappService.sendMessage(
              to,
              `🪪 ¿Cuál es tu *tipo de documento*?\n\nOpciones:\n${DOCUMENT_TYPES.map(
                (t) => `- ${t}`
              ).join("\n")}`
            );
            return;

          case "documentType": {
            const input = normalize(message.trim());
            const matched = DOCUMENT_TYPES.find((t) =>
              normalize(t).includes(input)
            );
            if (!matched) {
              await whatsappService.sendMessage(
                to,
                "❌ Tipo de documento no válido. Intenta usar una opción válida como 'cédula', 'pasaporte', etc."
              );
              return;
            }
            state.data.documentType = matched;
            state.step = "documentNumber";
            await whatsappService.sendMessage(
              to,
              "🔢 Ingresa tu *número de documento* (sin puntos ni espacios):"
            );
            return;
          }

          case "documentNumber":
            state.data.documentNumber = message.trim();
            state.step = "ufpsCode";
            await whatsappService.sendMessage(
              to,
              "🎓 Ingresa tu *código UFPS* (o tu número de documento si no tienes uno):"
            );
            return;

          case "ufpsCode":
            state.data.ufpsCode = message.trim();
            state.step = "beneficiaryType";
            await whatsappService.sendMessage(
              to,
              `👥 ¿Cuál es tu *tipo de beneficiario*?\n\nOpciones:\n${BENEFICIARY_TYPES.map(
                (t) => `- ${t}`
              ).join("\n")}`
            );
            return;

          case "beneficiaryType": {
            const input = normalize(message.trim());
            const matched = BENEFICIARY_TYPES.find((t) =>
              normalize(t).includes(input)
            );

            if (!matched) {
              await whatsappService.sendMessage(
                to,
                "❌ Tipo de beneficiario no válido. Intenta usar una de las opciones válidas como 'estudiante', 'egresado', 'externo', etc."
              );
              return;
            }

            state.data.beneficiaryType = matched;

            // Si es externo, asignar directamente "ninguno"
            if (matched === "Externo(a) a la UFPS") {
              state.data.academicProgram = "Ninguno";

              try {
                await userInfoService.registerUserInfo(state.data);
                console.log("✅ Usuario registrado:", state.data.phone);
              } catch (err) {
                console.error("❌ Error al guardar userInfo:", err);
                await whatsappService.sendMessage(
                  to,
                  "⚠️ Ocurrió un error al guardar tus datos. Por favor intenta más tarde."
                );
                delete this.userInfoState[to];
                return;
              }

              delete this.userInfoState[to];
              this.assistandState[to] = { step: "question" };

              await whatsappService.sendMessage(
                to,
                `✅ Gracias ${
                  state.data.fullName.split(" ")[0]
                }, tus datos han sido registrados.\n\nAhora dime, ¿sobre qué servicio de Bienestar Universitario deseas preguntar?\nPuedes escribir el tema directamente o elegir entre:\n\n1. Servicio Médico\n2. Servicio Psicológico\n3. Servicio Odontológico\n4. Amigos Académicos\n5. Psicosocial\n6. Asesoría Espiritual`
              );
              return;
            }

            // Si NO es externo, pedir programa académico
            state.step = "academicProgram";
            await whatsappService.sendMessage(
              to,
              "🏫 ¿Cuál es tu *programa académico* o *dependencia*?"
            );
            return;
          }

          case "academicProgram":
            state.data.academicProgram = message.trim();

            try {
              await userInfoService.registerUserInfo(state.data);
              console.log("✅ Usuario registrado:", state.data.phone);
            } catch (err) {
              console.error("❌ Error al guardar userInfo:", err);
              await whatsappService.sendMessage(
                to,
                "⚠️ Ocurrió un error al guardar tus datos. Por favor intenta más tarde."
              );
              delete this.userInfoState[to];
              return;
            }

            delete this.userInfoState[to];
            this.assistandState[to] = { step: "question" };

            await whatsappService.sendMessage(
              to,
              `✅ Gracias ${
                state.data.fullName.split(" ")[0]
              }, tus datos han sido registrados.\n\nAhora dime, ¿sobre qué servicio de Bienestar Universitario deseas preguntar?\nPuedes escribir el tema directamente o elegir entre:\n\n1. Servicio Médico\n2. Servicio Psicológico\n3. Servicio Odontológico\n4. Amigos Académicos\n5. Psicosocial\n6. Asesoría Espiritual`
            );
            return;
        }
      }

      // 🟢 Ya tiene los datos, procesar pregunta
      if (this.assistandState[to]?.step === "question") {
        const keyword = mapNumberToKeyword(message) || message;
        const topic = await Topic.getTopicsByKeyword(keyword);

        if (!topic) {
          responseMessage =
            "❌ No encontré información relacionada con tu consulta. Intenta reformular la pregunta.";
        } else {
          const pdfText = await loadPDFContent(topic.filePath);
          try {
            responseMessage = await askGemini(message, pdfText);
          } catch (geminiError) {
            console.error("Error con Gemini:", geminiError);
            responseMessage =
              geminiError.status === 429
                ? "⚠️ Has alcanzado el límite de consultas gratuitas. Intenta más tarde."
                : "⚠️ Ocurrió un error al generar la respuesta. Intenta de nuevo.";
          }
        }

        await whatsappService.sendMessage(to, responseMessage);
        await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
      }
    } catch (error) {
      console.error("❌ Error general en handleAssistandFlow:", error);
      await whatsappService.sendMessage(to, "⚠️ Ocurrió un error inesperado.");
    }
  }
  normalize(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }
}

module.exports = new MessageHandler();
