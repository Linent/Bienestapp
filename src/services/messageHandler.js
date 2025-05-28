const advisoryService = require("./advisoryService");
const whatsappService = require("./whatsappService");
const userService = require("./userService");
const userInfoService = require("./userInfoService");
const scheduleService = require("./scheduleService");
const careerService = require("./CareerService");
const { loadPDFContent } = require("../utils/loadPdfContent");
const askGemini = require("./geminiService");

const { DOCUMENT_TYPES, BENEFICIARY_TYPES } = require("../constants/userEnums");

const userQueryService = require("./userQueryService");
const { getAllTopics } = require("./topicService")

class MessageHandler {
  constructor() {
    this.menuState = {};
    this.appointmentState = {};
    this.assistandState = {};
    this.userInfoState = {};
    this.rescheduleState = {};
    this.cancelState = {};
  }

  // ======= NUEVA FUNCIÓN: Limpia todos los estados excepto el actual ==========
  clearOtherStates(currentState, to) {
    const states = [
      "menuState",
      "appointmentState",
      "assistandState",
      "userInfoState",
      "cancelState",
      "rescheduleState",
    ];
    for (const state of states) {
      if (state !== currentState && this[state][to]) {
        delete this[state][to];
      }
    }
  }
  // ============================================================================

  async handleIncomingMessage(message, senderInfo) {
    try {
      if (message?.type === "text") {
        const incomingMessage = message.text.body.toLowerCase().trim();

        // Saludo inicial
        if (this.isGreeting(incomingMessage)) {
          this.clearOtherStates(null, message.from);
          await this.sendWelcome(message.from, message.id, senderInfo);
          this.menuState[message.from] = { step: "mainMenu" };
          await this.showMainMenu(message.from);
          return;
        }

        // FLUJO CANCELAR ASESORÍA
        if (
          incomingMessage === "cancelar asesoría" ||
          incomingMessage === "cancelar asesoria"
        ) {
          this.clearOtherStates("cancelState", message.from);
          this.cancelState[message.from] = { step: "askCode" };
          await this.handleCancelFlow(message.from, null);
          return;
        }

        // FLUJO AGENDAR ASESORÍA
        if (
          incomingMessage === "agendar asesoría" ||
          incomingMessage === "agendar asesoria"
        ) {
          this.clearOtherStates("appointmentState", message.from);
          this.appointmentState[message.from] = { step: "showAdvisors" };
          await this.handleAppointmentFlow(message.from, null);
          return;
        }

        // FLUJO REAGENDAR ASESORÍA
        if (
          incomingMessage === "reagendar asesoría" ||
          incomingMessage === "reagendar asesoria"
        ) {
          this.clearOtherStates("rescheduleState", message.from);
          this.rescheduleState[message.from] = { step: "askCode" };
          await this.handleRescheduleFlow(message.from, null);
          return;
        }

        // FLUJO CONSULTAR SERVICIOS
        if (incomingMessage === "consultar servicios") {
          this.clearOtherStates("userInfoState", message.from);
          this.userInfoState[message.from] = {
            step: "documentType",
            data: { phone: message.from },
          };
          await this.handleAssistandFlow(message.from, incomingMessage);
          return;
        }

        // Si ya hay un flujo activo, lo seguimos
        if (this.rescheduleState && this.rescheduleState[message.from]) {
          await this.handleRescheduleFlow(message.from, incomingMessage);
          return;
        }
        if (this.cancelState && this.cancelState[message.from]) {
          await this.handleCancelFlow(message.from, incomingMessage);
          return;
        }
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

  // ... el resto de tus métodos (NO necesitan cambios) ...
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
              (t, i) => `${i + 1} - ${t}` // ¡Usa números aquí!
            ).join("\n")}\n\n(Responde con el número o el nombre)`;
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
        // 💥 LIMPIA todos los estados menos el de menú antes de mostrar submenú
        this.clearOtherStates("menuState", to);
        await this.showAmigosMenu(to);
        return;
      }
      if (["consultar servicios", "2"].includes(opt)) {
        // 💥 LIMPIA y abre flujo de consulta
        this.clearOtherStates("userInfoState", to);
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
        // 💥 LIMPIA antes de cambiar a flujo de agendar
        this.clearOtherStates("appointmentState", to);
        delete this.menuState[to];
        await this.handleMenuOption(to, "agendar asesoría");
        return;
      }
      if (["reagendar asesoría", "reagendar asesoria", "2"].includes(opt)) {
        this.clearOtherStates("rescheduleState", to);
        delete this.menuState[to];
        this.rescheduleState[to] = { step: "askCode" };
        await this.handleRescheduleFlow(to, null);
        return;
      }
      if (["cancelar asesoría", "cancelar asesoria", "3"].includes(opt)) {
        this.clearOtherStates("cancelState", to);
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
          const schedules = await scheduleService.getUpcomingByStudentCode(
            code
          );

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
                  .slice(0, 16)}* - Asesor: *${advisorName}* - Tema: ${
                  s.topic
                }`;
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
    { type: "reply", reply: { id: "option_5", title: "Hacer otra pregunta" } },
  ];
  const normalize = (text) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  try {
    // 1. Inicio: preguntar tipo de documento
    if (!this.userInfoState[to] && !this.assistandState[to]) {
      this.userInfoState[to] = { step: "documentType", data: { phone: to } };
      const tipoDocMenu = DOCUMENT_TYPES.map(
        (t, i) => `${i + 1} - ${t}`
      ).join("\n");
      await whatsappService.sendMessage(
        to,
        `🪪 ¿Cuál es tu *tipo de documento*?\n${tipoDocMenu}\n\n(Responde con el número o el nombre)`
      );
      return;
    }

    // 2. Registro de usuario (onboarding)
    const uState = this.userInfoState[to];
    if (uState) {
      switch (uState.step) {
        case "documentType": {
          const input = normalize(message.trim());
          let match = null;
          if (/^\d+$/.test(input)) {
            const idx = parseInt(input, 10) - 1;
            if (DOCUMENT_TYPES[idx]) match = DOCUMENT_TYPES[idx];
          }
          if (!match) {
            match = DOCUMENT_TYPES.find((t) => normalize(t).includes(input));
          }
          if (!match) {
            const tipoDocMenu = DOCUMENT_TYPES.map(
              (t, i) => `${i + 1} - ${t}`
            ).join("\n");
            await whatsappService.sendMessage(
              to,
              `❌ Tipo de documento no válido.\n\nEl número o el nombre como aparece en la lista:\n${tipoDocMenu}`
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

        case "documentNumber": {
          uState.data.documentNumber = message.trim();
          const user = await userInfoService.getByDocumentNumber(
            uState.data.documentNumber
          );
          if (user) {
            // Si el usuario existe, pasar a selección de servicio (topics dinámicos)
            delete this.userInfoState[to];
            this.assistandState[to] = { step: "selectService", userId: user._id };
            // Obtener los topics de la BD
            const topics = await getAllTopics();
            if (!topics.length) {
              await whatsappService.sendMessage(
                to,
                "No hay servicios/temas disponibles por el momento."
              );
              return;
            }
            // Guardar la lista para luego saber el index
            this.assistandState[to].topicsList = topics;
            const servicesMenu = topics.map(
              (t, i) => `${i + 1} - ${t.name}`
            ).join("\n");
            await whatsappService.sendMessage(
              to,
              "✅ ¡Bienvenido de nuevo! ¿Sobre qué servicio deseas preguntar?\n" +
                servicesMenu + "\n\n(Responde con el número o el nombre)"
            );
            return;
          }
          // Si no existe, continuar registro
          uState.step = "fullName";
          await whatsappService.sendMessage(
            to,
            "👤 Por favor, indícanos tu *nombre completo*."
          );
          return;
        }

        case "fullName":
          uState.data.fullName = message.trim();
          uState.step = "ufpsCode";
          await whatsappService.sendMessage(
            to,
            "🎓 Ingresa tu *código UFPS* (o tu documento si no tienes código):"
          );
          return;

        case "ufpsCode":
          uState.data.ufpsCode = message.trim();
          uState.step = "beneficiaryType";
          const beneficiarioMenu = BENEFICIARY_TYPES.map(
            (t, i) => `${i + 1} - ${t}`
          ).join("\n");
          await whatsappService.sendMessage(
            to,
            `👥 ¿Cuál es tu *tipo de beneficiario*?\n${beneficiarioMenu}\n\n(Responde con el número o el nombre)`
          );
          return;

        case "beneficiaryType": {
          const input = normalize(message.trim());
          let match = null;
          if (/^\d+$/.test(input)) {
            const idx = parseInt(input, 10) - 1;
            if (BENEFICIARY_TYPES[idx]) match = BENEFICIARY_TYPES[idx];
          }
          if (!match) {
            match = BENEFICIARY_TYPES.find((t) =>
              normalize(t).includes(input)
            );
          }
          if (!match) {
            const beneficiarioMenu = BENEFICIARY_TYPES.map(
              (t, i) => `${i + 1} - ${t}`
            ).join("\n");
            await whatsappService.sendMessage(
              to,
              `❌ Tipo de beneficiario no válido.\n\nEl número o el nombre como aparece en la lista:\n${beneficiarioMenu}`
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

        case "academicProgram":
          uState.data.academicProgram = message.trim();
          break;
      }

      // Registrar usuario y pasar a seleccionar servicio (topics dinámicos)
      const createdUser = await userInfoService.registerUserInfo(uState.data);
      delete this.userInfoState[to];
      this.assistandState[to] = { step: "selectService", userId: createdUser._id };
      const topics = await getAllTopics();
      if (!topics.length) {
        await whatsappService.sendMessage(
          to,
          "No hay servicios/temas disponibles por el momento."
        );
        return;
      }
      this.assistandState[to].topicsList = topics;
      const servicesMenu = topics.map(
        (t, i) => `${i + 1} - ${t.name}`
      ).join("\n");
      await whatsappService.sendMessage(
        to,
        `✅ Gracias ${uState.data.fullName.split(" ")[0]}, tus datos han sido registrados.\n\n` +
          "¿Sobre qué servicio deseas preguntar?\n" +
          servicesMenu +
          "\n\n(Responde con el número o el nombre)"
      );
      return;
    }

    // 3. Selección de servicio/tema (desde la BD)
    if (this.assistandState[to]?.step === "selectService") {
      const topics = this.assistandState[to].topicsList || [];
      const input = normalize(message.trim());
      let selectedTopic = null;

      // Buscar por número
      if (/^\d+$/.test(input)) {
        const idx = parseInt(input, 10) - 1;
        if (topics[idx]) selectedTopic = topics[idx];
      }
      // Buscar por nombre
      if (!selectedTopic) {
        selectedTopic = topics.find((t) =>
          normalize(t.name).includes(input)
        );
      }
      if (!selectedTopic) {
        const servicesMenu = topics.map(
          (t, i) => `${i + 1} - ${t.name}`
        ).join("\n");
        await whatsappService.sendMessage(
          to,
          `❌ Servicio no válido.\n\nEl número o el nombre como aparece en la lista:\n${servicesMenu}`
        );
        return;
      }
      // Guardar el topic y pasar a preguntar
      this.assistandState[to].selectedTopic = selectedTopic;
      this.assistandState[to].step = "writeQuestion";
      await whatsappService.sendMessage(
        to,
        `✍️ Por favor escribe tu pregunta sobre *${selectedTopic.name}*:`
      );
      return;
    }

    // 4. Pregunta sobre el servicio/tema (se almacena)
    if (this.assistandState[to]?.step === "writeQuestion") {
      const { userId, selectedTopic } = this.assistandState[to];
      const rawQuery = message.trim();

      // Guardar la consulta con el topic y la pregunta del usuario
      await userQueryService.saveUserQuery({
        userId,
        rawQuery,
        topicKey: selectedTopic.name,
        topicId: selectedTopic._id,
      });

      // Generar respuesta
      let responseMessage = "";
      if (!selectedTopic || !selectedTopic.filePath) {
        responseMessage =
          "❌ No encontré información relacionada. Intenta reformular tu pregunta.";
      } else {
        const pdfText = await loadPDFContent(selectedTopic.filePath);
        try {
          responseMessage = await askGemini(rawQuery, pdfText);
        } catch (e) {
          console.error("Error con Gemini:", e);
          responseMessage =
            e.status === 429
              ? "⚠️ Límite de consultas alcanzado. Intenta más tarde."
              : "⚠️ Error al generar la respuesta. Intenta de nuevo.";
        }
      }

      // Termina el flujo de pregunta y muestra botones de feedback
      delete this.assistandState[to].selectedTopic;
      this.assistandState[to].step = "question"; // Si quieres que pueda volver a preguntar
      await whatsappService.sendMessage(to, responseMessage);
      await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
      return;
    }

    // 5. Si ya está en modo preguntar varias veces, volver a ofrecer menú de servicios dinámico
    if (this.assistandState[to]?.step === "question") {
      this.assistandState[to].step = "selectService";
      const topics = await getAllTopics();
      this.assistandState[to].topicsList = topics;
      const servicesMenu = topics.map(
        (t, i) => `${i + 1} - ${t.name}`
      ).join("\n");
      await whatsappService.sendMessage(
        to,
        "¿Sobre qué servicio deseas preguntar?\n" +
          servicesMenu +
          "\n\n(Responde con el número o el nombre)"
      );
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
  const menuMessage = "¿La respuesta fue de tu ayuda?";
  const buttons = [
    { type: "reply", reply: { id: "option_4", title: "Sí, gracias" } },
    { type: "reply", reply: { id: "option_5", title: "Hacer otra pregunta" } },
  ];

  switch (selectedOption.toLowerCase()) {
    case "sí, gracias":
      delete this.assistandState[to];
      await whatsappService.sendMessage(
        to,
        "¡Nos alegra haber sido de ayuda! 😊 Si necesitas algo más, escríbenos."
      );
      break;

    case "hacer otra pregunta": {
      // Reinicia el flujo y muestra de nuevo los temas/servicios
      this.assistandState[to] = { step: "selectService", userId: this.assistandState[to]?.userId };
      const topics = await getAllTopics();
      if (!topics.length) {
        await whatsappService.sendMessage(
          to,
          "No hay servicios/temas disponibles por el momento."
        );
        return;
      }
      this.assistandState[to].topicsList = topics;
      const servicesMenu = topics
        .map((t, i) => `${i + 1} - ${t.name}`)
        .join("\n");
      await whatsappService.sendMessage(
        to,
        "¿Sobre qué servicio deseas preguntar?\n" +
          servicesMenu +
          "\n\n(Responde con el número o el nombre)"
      );
      break;
    }

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
