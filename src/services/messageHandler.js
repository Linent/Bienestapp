import advisoryService from "./advisoryService";
import whatsappService from "./whatsappService";
import userService from "./userService";
import scheduleService from "./scheduleService";
import careerService from "./CareerService";
class MessageHandler {
  constructor() {
    this.appointmentState = {};
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
        } else {
          const response = `Echo: ${message.text.body}`;
          await whatsappService.sendMessage(message.from, response, message.id);
        }

        await whatsappService.markAsRead(message.id);
      } else if (message?.type === "interactive") {
        const selectedOption = message.interactive?.button_reply?.title
          .toLowerCase()
          .trim();
        await this.handleMenuOption(message.from, selectedOption);
        await whatsappService.markAsRead(message.id);
      }
    } catch (error) {
      console.error("Error en handleIncomingMessage:", error);
    }
  }

  isGreeting(message) {
    const greetings = [
      "hola",
      "buenos días",
      "buenas tardes",
      "buenas noches",
      "hello",
      "hi",
    ];
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
    const nombre = this.capitalizarTexto(this.getSenderName(senderInfo)).split(
      " "
    )[0];
    const welcomeMessage = `Hola ${nombre}, bienvenido a nuestra plataforma. ¿En qué puedo ayudarte?`;
    await whatsappService.sendMessage(to, welcomeMessage, messageId);
    await whatsappService.markAsRead(messageId);
  }

  async sendWelcomeMenu(to) {
    const menuMessage = `Hola, ¿En qué puedo ayudarte?`;
    const buttons = [
      {
        type: "reply",
        reply: { id: "option_1", title: "Agendar asesoría" },
      },
      {
        type: "reply",
        reply: { id: "option_2", title: "Consultar servicios" },
      },
      /* {
        type: "reply",
        reply: { id: "option_3", title: "Ubicación" },
      }, */
    ];
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async handleMenuOption(to, selectedOption) {
    let responseMessage;

    switch (selectedOption.toLowerCase()) {
      case "agendar asesoría":
        this.appointmentState[to] = { step: "showAdvisors" };
        responseMessage =
          "Perfecto. Vamos a agendar tu asesoría. 📚 Buscando asesores disponibles...";

        // ⚠️ Ejecutamos directamente el flujo inicial
        await this.handleAppointmentFlow(to, null); // Pasamos `null` como message para iniciar
        return;

      case "consultar servicios":
        responseMessage =
          "Has seleccionado consultar servicios. ¿Qué necesitas saber?";
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

    // Manejo especial para iniciar flujo desde el menú
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
                  `👤 *${a.name}*\n📧 ${a.email}\n🆔 Código: *${
                    a.codigo
                  }*\n🕐 Horarios:\n${a.horarios
                    .map((h) => `- ${h}`)
                    .join("\n")}`
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

          // Buscar horarios disponibles para ese día
          const dayHorarios = state.advisor.horarios.filter((h) =>
            h.toLowerCase().startsWith(state.selectedDay)
          );

          const horasDisponibles = dayHorarios.map((h) => {
            const hora = h.split(" - "); // ejemplo: "miércoles 08:00 - 12:00"
            return hora.length > 1 ? hora[1].trim() : "Hora no definida";
          });

          responseMessage =
            `⏰ Ingresa la *hora* en la que deseas agendar tu asesoría (formato 24h, ej: 14:00).\n\n` +
            `📆 *Día:* ${state.selectedDay}\n🕐 *Franja:* ${dayHorarios.join(
              "\n"
            )}`;
          break;
        }
        case "selectHour": {
          // Validar que sea una hora con formato HH:mm
          const isValid = /^\d{2}:\d{2}$/.test(message.trim());
          if (!isValid) {
            responseMessage = "❌ Hora no válida. Usa el formato HH:mm (ej: 09:30).";
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
          state.step = "codigoCarrera";
          responseMessage =
            "🏫 Ingresa el *código de tu carrera* para asociarte correctamente.";
          break;
        }

        case "codigoCarrera": {
          const career = await careerService.findByCode(message.trim());
          if (!career) {
            responseMessage =
              "❌ Código de carrera no válido. Intenta de nuevo.";
            break;
          }

          state.career = career._id;
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

          // Verificar si el usuario existe
          let student = await userService.findByEmail(state.email);
          if (!student) {
            // Crear usuario si no existe
            student = await userService.registerUser(
              state.name,
              state.email,
              state.cedula,
              "student",
              state.career,
              state.cedula // Lo usamos como código también
            );
          }

          // Opcional: si luego quieres login y token
          // const login = await userService.loginUser(state.email, state.cedula);
          // const token = login.token;
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
}

export default new MessageHandler();
