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
const userQueryService = require("./userQueryService");

class MessageHandler {
  constructor() {
    this.menuState = {};
    this.appointmentState = {};
    this.assistandState = {};
    this.userInfoState = {};
    this.rescheduleState = {}; // Nuevo para reagendar
    this.cancelState = {};
  }

  async handleIncomingMessage(message, senderInfo) {
    try {
      // --- MENSAJE DE TEXTO ---
      if (message?.type === "text") {
        const incomingMessage = message.text.body.toLowerCase().trim();

        // Saludo inicial
        if (this.isGreeting(incomingMessage)) {
          await this.sendWelcome(message.from, message.id, senderInfo);
          // Limpiar cualquier estado previo y mostrar menú principal
          this.menuState[message.from] = { step: "mainMenu" };
          await this.showMainMenu(message.from);
          return;
        }
        if (this.rescheduleState && this.rescheduleState[message.from]) {
          await this.handleRescheduleFlow(message.from, incomingMessage);
          return;
        }
        // ---> ¡Aquí! <---
        // Si está en el flujo de cancelar asesoría
        if (this.cancelState && this.cancelState[message.from]) {
          await this.handleCancelFlow(message.from, incomingMessage);
          return;
        }
        // ----

        // ¿Hay un flujo activo?
        if (this.menuState[message.from]) {
          await this.handleMenuFlow(message.from, incomingMessage);
          return;
        }
        if (this.appointmentState[message.from]) {
          await this.handleAppointmentFlow(message.from, incomingMessage);
          return;
        }
        if (this.assistandState[message.from]) {
          await this.handleAssistandFlow(message.from, incomingMessage);
          return;
        }
        if (this.userInfoState[message.from]) {
          await this.handleAssistandFlow(message.from, incomingMessage);
          return;
        }

        // Por defecto: repetir mensaje
        const response = `Echo: ${message.text.body}`;
        await whatsappService.sendMessage(message.from, response, message.id);
        await whatsappService.markAsRead(message.id);
        return;
      }

      // --- MENSAJE INTERACTIVO (botón) ---
      if (message?.type === "interactive") {
        const selectedOption = message.interactive?.button_reply?.title?.trim();
        // Detectar feedback del asistente
        if (
          ["sí, gracias", "hacer otra pregunta"].includes(
            selectedOption?.toLowerCase()
          )
        ) {
          await this.handleAssistandFeedback(message.from, selectedOption);
        } else {
          await this.handleMenuFlow(message.from, selectedOption);
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
          // ✅ El flujo debe iniciar por TIPO DE DOCUMENTO
          this.userInfoState[to] = {
            step: "documentType",
            data: { phone: to },
          };
          responseMessage =
            "Has seleccionado consultar servicios.\n\n📋 Antes de continuar, necesitamos algunos datos básicos.\n\n" +
            `🪪 ¿Cuál es tu *tipo de documento*?\n${DOCUMENT_TYPES.map(
              (t) => `- ${t}`
            ).join("\n")}`;
        }
        break;

      default:
        responseMessage =
          "Opción no válida. Por favor, selecciona una opción válida del menú.";
    }

    await whatsappService.sendMessage(to, responseMessage);
  }
  async showMainMenu(to) {
    this.menuState[to] = { step: "mainMenu" };
    const menuMessage = "¿En qué podemos ayudarte hoy?";
    const buttons = [
      { type: "reply", reply: { id: "option_1", title: "Amigos académicos" } },
      {
        type: "reply",
        reply: { id: "option_2", title: "Consultar servicios" },
      },
    ];
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async showAmigosMenu(to) {
    this.menuState[to] = { step: "amigosMenu" };
    const menuMessage = "Menú Amigos Académicos:\nSelecciona una opción:";
    const buttons = [
      { type: "reply", reply: { id: "option_3", title: "Agendar asesoría" } },
      { type: "reply", reply: { id: "option_4", title: "Reagendar asesoría" } },
      { type: "reply", reply: { id: "option_5", title: "Cancelar asesoría" } },
    ];
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }
  async handleMenuFlow(to, input) {
    // Lee el estado actual del menú
    const state = this.menuState[to] || { step: "mainMenu" };
    const opt = input ? input.toLowerCase().trim() : "";

    // ---- MENÚ PRINCIPAL ----
    if (state.step === "mainMenu") {
      if (["amigos académicos", "amigos academicos", "1"].includes(opt)) {
        await this.showAmigosMenu(to);
        return;
      }
      if (["consultar servicios", "2"].includes(opt)) {
        // Inicia el flujo de servicios (¡no cambies!)
        delete this.menuState[to];
        await this.handleMenuOption(to, "consultar servicios");
        return;
      }
      // Si no reconoce, vuelve a mostrar menú principal
      await this.showMainMenu(to);
      return;
    }

    // ---- MENÚ AMIGOS ----
    if (state.step === "amigosMenu") {
      if (["agendar asesoría", "agendar asesoria", "1"].includes(opt)) {
        delete this.menuState[to];
        await this.handleMenuOption(to, "agendar asesoría");
        return;
      }
      if (["reagendar asesoría", "reagendar asesoria", "2"].includes(opt)) {
        delete this.menuState[to];
        this.rescheduleState[to] = { step: "askCode" };
        await this.handleRescheduleFlow(to, null);
        return;
      }
      if (["cancelar asesoría", "cancelar asesoria", "3"].includes(opt)) {
        delete this.menuState[to];
        this.cancelState[to] = { step: "askCode" };
        await this.handleCancelFlow(to, null);
        return;
      }
      // Si no reconoce, vuelve a mostrar menú de amigos
      await this.showAmigosMenu(to);
      return;
    }

    // Si no reconoce el estado, vuelve al menú principal
    await this.showMainMenu(to);
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
              .map((a) => `👤 *${a.name}*\n🆔 Código: ${a.codigo}\n`)
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

          // Buscar por código de estudiante
          let student = await userService.findByStudentCode(codigoEstudiante);

          state.career = career._id;
          state.studentCode = codigoEstudiante;

          if (student) {
            // Agenda directamente, NO pidas más datos
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
            responseMessage = `✅ ¡Listo ${student.name}!\nTu asesoría fue agendada con *${state.advisor.name}* el *${state.selectedDay}* a las *${state.selectedHour}* sobre *${state.topic}*.\n\n📍 Te esperamos.`;
            delete this.appointmentState[to];
          } else {
            // No existe el estudiante, pide los demás datos
            state.step = "name";
            responseMessage = "🧑 Ingresa tu *nombre completo*.";
          }
          break;
        }

        case "name": {
          state.name = message.trim();
          state.step = "email";
          responseMessage = "📧 Ingresa tu correo institucional.";
          break;
        }

        case "email": {
          state.email = message.trim().toLowerCase();
          state.step = "cedula";
          responseMessage = "🆔 Ingresa tu número de cédula.";
          break;
        }

        case "cedula": {
          state.cedula = message.trim();

          // Ahora SÍ registramos al usuario
          let student = await userService.registerUser(
            state.name,
            state.email,
            state.cedula,
            "student",
            state.career,
            state.studentCode
          );

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
          responseMessage = `✅ ¡Listo ${state.name}!\nTu asesoría fue agendada con *${state.advisor.name}* el *${state.selectedDay}* a las *${state.selectedHour}* sobre *${state.topic}*.\n\n📍 Te esperamos.`;
          delete this.appointmentState[to];
          break;
        }

        default:
          responseMessage = "❌ Algo salió mal. Reinicia el proceso.";
          delete this.appointmentState[to];
      }

      this.appointmentState[to] = state;
      if (responseMessage) {
        await whatsappService.sendMessage(to, responseMessage);
      }
    } catch (error) {
      console.error("Error en handleAppointmentFlow:", error);
      await whatsappService.sendMessage(
        to,
        "❌ Ocurrió un error. Intenta nuevamente."
      );
      delete this.appointmentState[to];
    }
  }
  async handleRescheduleFlow(to, message) {
  const state = this.rescheduleState[to] || { step: "askCode" };
  let responseMessage = "";

  try {
    switch (state.step) {
      // 1. Pedir código de estudiante
      case "askCode":
        responseMessage =
          "🔄 Para reagendar, por favor escribe tu *código de estudiante*:";
        state.step = "showSchedules";
        break;

      // 2. Mostrar asesorías próximas
      case "showSchedules": {
        const code = message.trim();
        state.studentCode = code;

        // Busca asesorías próximas y no canceladas
        const schedules = await scheduleService.getUpcomingByStudentCode(code);

        if (!schedules.length) {
          responseMessage = "😕 No tienes asesorías próximas para reagendar.";
          delete this.rescheduleState[to];
          break;
        }
        state.schedules = schedules;

        responseMessage =
          "📆 Tus asesorías próximas:\n\n" +
          schedules
            .map((s, i) => {
              // Validación para evitar errores si falta el populate
              const advisorName =
                s.AdvisoryId && s.AdvisoryId.advisorId
                  ? s.AdvisoryId.advisorId.name
                  : "No disponible";
              return `${i + 1}. Día: *${s.dateStart
                .toLocaleString()
                .slice(0, 16)}* - Asesor: *${advisorName}* - Tema: ${s.topic}`;
            })
            .join("\n") +
          "\n\n✍️ Escribe el número de la asesoría que quieres reagendar.";
        state.step = "pickSchedule";
        break;
      }

      // 3. Seleccionar cuál reagendar
      case "pickSchedule": {
        const idx = parseInt(message.trim(), 10) - 1;
        if (
          isNaN(idx) ||
          !state.schedules ||
          idx < 0 ||
          idx >= state.schedules.length
        ) {
          responseMessage = "❌ Número no válido. Intenta de nuevo.";
          break;
        }
        state.selectedSchedule = state.schedules[idx];
        state.step = "confirmReschedule";
        // Validación para nombre del asesor
        const selected = state.selectedSchedule;
        const advisorName =
          selected.AdvisoryId && selected.AdvisoryId.advisorId
            ? selected.AdvisoryId.advisorId.name
            : "No disponible";
        responseMessage =
          `¿Quieres reagendar esta asesoría?\n` +
          `Día: *${selected.dateStart
            .toLocaleString()
            .slice(0, 16)}* - Asesor: *${advisorName}* - Tema: ${
            selected.topic
          }\n\n` +
          "Responde 'sí' para continuar o 'no' para cancelar.";
        break;
      }

      // 4. Confirmar reagendamiento y disparar nuevo flujo de agendamiento
      case "confirmReschedule": {
        const respuesta = message.trim().toLowerCase();
        if (respuesta === "sí" || respuesta === "si") {
          // Cancela la actual
          await scheduleService.cancelSchedule(state.selectedSchedule._id);
          responseMessage =
            "✅ Asesoría cancelada. Vamos a agendar una nueva asesoría...";
          // Llama al flujo de agendamiento normal
          this.appointmentState[to] = { step: "showAdvisors" };
          delete this.rescheduleState[to];
          await whatsappService.sendMessage(to, responseMessage);
          await this.handleAppointmentFlow(to, null);
          return; // ¡Ojo! No sigas aquí, ya enviaste respuesta y saltaste de flujo
        } else {
          responseMessage =
            "❌ Operación cancelada. No se reagendó ninguna asesoría.";
          delete this.rescheduleState[to];
        }
        break;
      }

      // 5. Default por si algo se sale del flujo esperado
      default:
        responseMessage = "Algo salió mal. Intenta desde el menú.";
        delete this.rescheduleState[to];
    }

    this.rescheduleState[to] = state;
    await whatsappService.sendMessage(to, responseMessage);
  } catch (err) {
    console.error("Error en handleRescheduleFlow:", err);
    await whatsappService.sendMessage(
      to,
      "❌ Ocurrió un error. Intenta nuevamente."
    );
    delete this.rescheduleState[to];
  }
}
  async handleCancelFlow(to, message) {
    const state = this.cancelState[to] || { step: "askCode" };
    let responseMessage = "";

    try {
      switch (state.step) {
        case "askCode":
          responseMessage =
            "🗑️ Para cancelar, por favor escribe tu *código de estudiante*:";
          state.step = "showSchedules";
          break;

        case "showSchedules": {
          const code = message.trim();
          state.studentCode = code;
          const schedules = await scheduleService.getUpcomingByStudentCode(
            code
          );
          if (!schedules.length) {
            responseMessage = "😕 No tienes asesorías próximas para cancelar.";
            delete this.cancelState[to];
            break;
          }
          state.schedules = schedules;

          responseMessage =
            "📆 Tus asesorías próximas:\n\n" +
            schedules
              .map(
                (s, i) =>
                  `${i + 1}. Día: *${s.dateStart
                    .toLocaleString()
                    .slice(0, 16)}* - Asesor: *${
                    s.AdvisoryId?.advisorId?.name || "Desconocido"
                  }* - Tema: ${s.topic}`
              )
              .join("\n") +
            "\n\n✍️ Escribe el número de la asesoría que quieres cancelar.";
          state.step = "pickSchedule";
          break;
        }

        case "pickSchedule": {
          const idx = parseInt(message.trim(), 10) - 1;
          if (
            isNaN(idx) ||
            !state.schedules ||
            idx < 0 ||
            idx >= state.schedules.length
          ) {
            responseMessage = "❌ Número no válido. Intenta de nuevo.";
            break;
          }
          state.selectedSchedule = state.schedules[idx];
          state.step = "confirmCancel";
          responseMessage =
            `¿Quieres cancelar esta asesoría?\n` +
            `Día: *${state.selectedSchedule.dateStart
              .toLocaleString()
              .slice(0, 16)}* - Asesor: *${
              state.selectedSchedule.AdvisoryId.advisorId.name
            }* - Tema: ${state.selectedSchedule.topic}\n\n` +
            "Responde 'sí' para confirmar o 'no' para abortar.";
          break;
        }

        case "confirmCancel": {
          const respuesta = message.trim().toLowerCase();
          if (respuesta === "sí" || respuesta === "si") {
            await scheduleService.cancelSchedule(state.selectedSchedule._id);
            responseMessage = "✅ Asesoría cancelada correctamente.";
          } else {
            responseMessage =
              "❌ Operación cancelada. No se modificó ninguna asesoría.";
          }
          delete this.cancelState[to];
          break;
        }

        default:
          responseMessage = "Algo salió mal. Intenta desde el menú.";
          delete this.cancelState[to];
      }

      this.cancelState[to] = state;
      await whatsappService.sendMessage(to, responseMessage);
    } catch (err) {
      console.error("Error en handleCancelFlow:", err);
      await whatsappService.sendMessage(
        to,
        "❌ Ocurrió un error. Intenta nuevamente."
      );
      delete this.cancelState[to];
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
      { type: "reply", reply: { id: "option_4", title: "Sí, gracias" } },
      {
        type: "reply",
        reply: { id: "option_5", title: "Hacer otra pregunta" },
      },
    ];

    const normalize = (text) =>
      text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    try {
      // Paso 1: Si no hay estado previo, iniciar preguntando el tipo de documento
      if (!this.userInfoState[to] && !this.assistandState[to]) {
        this.userInfoState[to] = { step: "documentType", data: { phone: to } };
        await whatsappService.sendMessage(
          to,
          `🪪 ¿Cuál es tu *tipo de documento*?\n${DOCUMENT_TYPES.map(
            (t) => `- ${t}`
          ).join("\n")}`
        );
        return;
      }

      // Paso 2: Flujo de Onboarding (registro si no existe)
      const uState = this.userInfoState[to];
      if (uState) {
        switch (uState.step) {
          // Tipo de documento
          case "documentType": {
            const input = normalize(message.trim());
            const match = DOCUMENT_TYPES.find((t) =>
              normalize(t).includes(input)
            );
            if (!match) {
              await whatsappService.sendMessage(
                to,
                "❌ Tipo de documento no válido."
              );
              return;
            }
            uState.data.documentType = match;
            uState.step = "documentNumber";
            await whatsappService.sendMessage(
              to,
              "🔢 Ingresa tu *número de documento* (sin puntos ni espacios):"
            );
            return;
          }

          // Número de documento, buscar usuario en la BD
          case "documentNumber": {
            uState.data.documentNumber = message.trim();
            const user = await userInfoService.getByDocumentNumber(
              uState.data.documentNumber
            );
            if (user) {
              // Si el usuario existe, salta directo a sugerir temas y preguntas
              delete this.userInfoState[to];
              this.assistandState[to] = { step: "question", userId: user._id };
              await whatsappService.sendMessage(
                to,
                "✅ ¡Bienvenido de nuevo! ¿Sobre qué servicio deseas preguntar?\n" +
                  "1. Servicio Médico\n2. Servicio Psicológico\n3. Servicio Odontológico\n" +
                  "4. Amigos Académicos\n5. Psicosocial\n6. Asesoría Espiritual"
              );
              return;
            }
            // Si no existe, continuar el registro
            uState.step = "fullName";
            await whatsappService.sendMessage(
              to,
              "👤 Por favor, indícanos tu *nombre completo*."
            );
            return;
          }

          // Nombre completo
          case "fullName":
            uState.data.fullName = message.trim();
            uState.step = "ufpsCode";
            await whatsappService.sendMessage(
              to,
              "🎓 Ingresa tu *código UFPS* (o tu documento si no tienes código):"
            );
            return;

          // Código UFPS
          case "ufpsCode":
            uState.data.ufpsCode = message.trim();
            uState.step = "beneficiaryType";
            await whatsappService.sendMessage(
              to,
              `👥 ¿Cuál es tu *tipo de beneficiario*?\n${BENEFICIARY_TYPES.map(
                (t) => `- ${t}`
              ).join("\n")}`
            );
            return;

          // Tipo de beneficiario
          case "beneficiaryType": {
            const input = normalize(message.trim());
            const match = BENEFICIARY_TYPES.find((t) =>
              normalize(t).includes(input)
            );
            if (!match) {
              await whatsappService.sendMessage(
                to,
                "❌ Tipo de beneficiario no válido."
              );
              return;
            }
            uState.data.beneficiaryType = match;
            if (match !== "Externo(a) a la UFPS") {
              uState.step = "academicProgram";
              await whatsappService.sendMessage(
                to,
                "🏫 ¿Cuál es tu *programa académico* o *dependencia*?"
              );
              return;
            }
            uState.data.academicProgram = "Ninguno";
            break;
          }

          // Programa académico
          case "academicProgram":
            uState.data.academicProgram = message.trim();
            break;
        }

        // Registrar el usuario y pasar al flujo de preguntas
        const createdUser = await userInfoService.registerUserInfo(uState.data);
        delete this.userInfoState[to];
        this.assistandState[to] = { step: "question", userId: createdUser._id };

        await whatsappService.sendMessage(
          to,
          `✅ Gracias ${
            uState.data.fullName.split(" ")[0]
          }, tus datos han sido registrados.\n\n` +
            "¿Sobre qué servicio deseas preguntar?\n" +
            "1. Servicio Médico\n2. Servicio Psicológico\n3. Servicio Odontológico\n" +
            "4. Amigos Académicos\n5. Psicosocial\n6. Asesoría Espiritual"
        );
        return;
      }

      // Paso 3: Flujo de consultas de preguntas (usuario ya existe)
      if (this.assistandState[to]?.step === "question") {
        const { userId } = this.assistandState[to];
        const keyword = mapNumberToKeyword(message) || message;
        const topic =
          await require("../services/topicService").getTopicsByKeyword(keyword);

        // Guardar consulta
        await userQueryService.saveUserQuery({
          userId,
          rawQuery: message,
          topicKey: keyword,
          topicId: topic?._id ?? null,
        });

        // Generar respuesta
        let responseMessage = "";
        if (!topic) {
          responseMessage =
            "❌ No encontré información relacionada. Intenta reformular tu pregunta.";
        } else {
          const pdfText = await loadPDFContent(topic.filePath);
          try {
            responseMessage = await askGemini(message, pdfText);
          } catch (e) {
            console.error("Error con Gemini:", e);
            responseMessage =
              e.status === 429
                ? "⚠️ Límite de consultas alcanzado. Intenta más tarde."
                : "⚠️ Error al generar la respuesta. Intenta de nuevo.";
          }
        }

        await whatsappService.sendMessage(to, responseMessage);
        await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
        return;
      }
    } catch (err) {
      console.error("❌ Error en handleAssistandFlow:", err);
      await whatsappService.sendMessage(
        to,
        "⚠️ Ocurrió un error inesperado. Por favor intenta de nuevo."
      );
    }
  }
  async handleAssistandFeedback(to, selectedOption) {
    switch (selectedOption.toLowerCase()) {
      case "sí, gracias":
        delete this.assistandState[to];
        await whatsappService.sendMessage(
          to,
          "¡Nos alegra haber sido de ayuda! 😊 Si necesitas algo más, escríbenos."
        );
        break;
      case "hacer otra pregunta":
        // Solo setea el step, mantiene userId
        if (this.assistandState[to]) {
          this.assistandState[to].step = "question";
        }
        await whatsappService.sendMessage(
          to,
          "Perfecto. Puedes escribirme tu nueva pregunta sobre los servicios de bienestar universitario."
        );
        break;
      default:
        await whatsappService.sendMessage(to, "No entendimos tu respuesta.");
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
