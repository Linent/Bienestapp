const Schedule = require("../models/Schedule");
const Advisory = require("../models/Advisory");
const User = require("../models/User");
const EmailService = require("./emailService");
const { getNextMatchingDate } = require("../helpers/dateHelper");
const { DateTime } = require("luxon");
const { startOfYear, subYears } = require("date-fns");
const { feedbackSurveyTemplate } = require("../emails/feedbackSurveyTemplate");
const JwtService = require("./jwt");
const jwtService = new JwtService();
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config/config");
const moment = require('moment-timezone');


exports.createSchedule = async (studentId, topic, advisoryId) => {
  try {
    const advisory = await Advisory.findById(advisoryId);
    if (!advisory) throw new Error("No se encontró la asesoría.");

    const advisoryDay = advisory.day; // ej: "lunes"
    const advisoryHour = DateTime.fromJSDate(advisory.dateStart)
      .setZone("America/Bogota")
      .toFormat("HH:mm");

    // Calcular fecha y hora de HOY de la asesoría
    const now = DateTime.now().setZone("America/Bogota");
    const sessionStart = DateTime.fromJSDate(advisory.dateStart)
      .setZone("America/Bogota")
      .set({
        year: now.year,
        month: now.month,
        day: now.day,
      });
    const sessionEnd = DateTime.fromJSDate(advisory.dateEnd)
      .setZone("America/Bogota")
      .set({
        year: now.year,
        month: now.month,
        day: now.day,
      });
    const maxAgendaTime = sessionEnd.minus({ minutes: 40 });

    let nextDate;

    // ¿Es hoy el mismo día de la asesoría?
    const daysMap = {
      lunes: 1,
      martes: 2,
      miércoles: 3,
      jueves: 4,
      viernes: 5,
      sabado: 6,
      domingo: 7,
    };
    const targetWeekday = daysMap[advisoryDay.toLowerCase()];
    if (!targetWeekday) throw new Error("Día inválido en asesoría");

    if (now.weekday === targetWeekday) {
      if (now < sessionStart) {
        // Antes de la asesoría: agenda para hoy
        nextDate = sessionStart;
      } else if (now >= sessionStart && now <= maxAgendaTime) {
        // Dentro del rango permitido: agenda para hoy
        nextDate = sessionStart;
      } else {
        // Ya no se puede agendar hoy: próxima semana
        nextDate = sessionStart.plus({ days: 7 });
      }
    } else {
      // No es el día: calcula el próximo día correcto
      let temp = now.startOf("day");
      while (temp.weekday !== targetWeekday || temp < now) {
        temp = temp.plus({ days: 1 });
      }
      const [hour, minute] = advisoryHour.split(":").map(Number);
      nextDate = temp.set({ hour, minute });
    }

    // VALIDACIÓN 1: No más de 10 estudiantes
    const count = await Schedule.countDocuments({
      AdvisoryId: advisoryId,
      dateStart: nextDate.toJSDate(),
    });
    if (count >= 10) {
      throw new Error("No hay cupos disponibles para esta asesoría.");
    }

    // VALIDACIÓN 2: No duplicados por estudiante
    const alreadyScheduled = await Schedule.findOne({
      AdvisoryId: advisoryId,
      dateStart: nextDate.toJSDate(),
      studentId: studentId,
      status: "approved",
    });
    if (alreadyScheduled) {
      throw new Error("Ya estás agendado a esta asesoría en ese horario.");
    }

    const newSchedule = new Schedule({
      studentId,
      topic,
      AdvisoryId: advisoryId,
      dateStart: nextDate.toJSDate(),
    });

    await newSchedule.save();

    const populatedSchedule = await Schedule.findById(newSchedule._id)
      .populate({
        path: "AdvisoryId",
        populate: { path: "advisorId", select: "name email" },
      })
      .populate({ path: "studentId", select: "name email" });

    const student = populatedSchedule.studentId;
    const advisor = populatedSchedule.AdvisoryId?.advisorId;

    await EmailService.sendAppointmentConfirmation(
      student,
      advisor,
      populatedSchedule,
      topic
    );
    return newSchedule;
  } catch (error) {
    throw new Error("Error al agendar: " + error.message);
  }
};

exports.getSchedules = async () => {
  try {
    const schedules = await Schedule.find()
      .populate({ path: "studentId", select: "name codigo email" })
      .populate({
        path: "AdvisoryId",
        select: "advisorId careerId day",
        populate: {
          path: "advisorId careerId",
          select: "name enable codigo code",
        },
      });
    return schedules;
  } catch (error) {
    throw new Error("Error al buscar todas las citas" + error.message);
  }
};

exports.getStudentsByAdvisorAndDate = async (advisoryId, day, dateStart) => {
  const advisorySchedules = await Schedule.find({
    AdvisoryId: advisoryId,
    status: "approved",
  })
    .populate({
      path: "AdvisoryId",
      select: "dateStart advisorId day",
      populate: { path: "advisorId", select: "name email" },
    })
    .populate({
      path: "studentId",
      select: "name codigo email career",
      populate: { path: "career", select: "name" },
    });

  const filteredSchedules = advisorySchedules.filter((schedule) => {
    const advisory = schedule.AdvisoryId;
    if (!advisory || !schedule.dateStart) return false;

    const advisoryDay = advisory.day.toLowerCase();

    const scheduleTime = DateTime.fromJSDate(schedule.dateStart)
      .toUTC()
      .startOf("minute");
    const queryStartTime = DateTime.fromISO(dateStart)
      .toUTC()
      .startOf("minute");
    const queryEndTime = queryStartTime.plus({ hours: 2 });

    return (
      advisoryDay === day.toLowerCase() &&
      scheduleTime >= queryStartTime &&
      scheduleTime < queryEndTime
    );
  });

  return filteredSchedules;
};

exports.getScheduleById = async (scheduleId) => {
  try {
    const schedule = await Schedule.findById(scheduleId);
    return schedule;
  } catch (error) {
    throw new Error("Error al buscar la agenda" + error.message);
  }
};

exports.updateSchedule = async (ScheduleId, dataToUpdate) => {
  try {
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      ScheduleId,
      { $set: dataToUpdate },
      { new: true }
    );
    return updatedSchedule;
  } catch (error) {
    throw new Error("Error al actualizar reservación" + error.message);
  }
};

exports.deleteSchedule = async (scheduleId) => {
  try {
    const deletedSchedule = await Schedule.findByIdAndDelete(scheduleId);
    return deletedSchedule;
  } catch (error) {
    throw new Error("Error al eliminar reservación" + error.message);
  }
};

exports.updateAttendance = async (scheduleId, attendanceStatus) => {
  const schedule = await Schedule.findByIdAndUpdate(
    scheduleId,
    { attendance: attendanceStatus, status: "completed" },
    { new: true }
  ).populate([
    { path: "studentId", select: "name email" },
    {
      path: "AdvisoryId",
      populate: { path: "advisorId", select: "name" },
    },
  ]);

  if (!schedule) throw new Error("No se encontró el schedule");

  // 2. Solo si la asistencia es true, manda el correo
  if (attendanceStatus === true) {
    // Genera el token (válido 1 hora)
    const token = jwtService.generateFeedbackToken(schedule._id);
    await EmailService.sendFeedbackSurvey(schedule, token);
  }

  return schedule;
};

// services/scheduleService.js
exports.validateFeedbackToken = async (token) => {
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    const schedule = await Schedule.findById(payload.scheduleId).populate([
      { path: "studentId", select: "name" },
      { path: "AdvisoryId", populate: { path: "advisorId", select: "name" } },
    ]);

    if (!schedule) return null; // <-- ya NO usa res, solo retorna null
    // Retorna el objeto con los datos
    return {
      scheduleId: schedule._id,
      studentName: schedule.studentId.name,
      advisorName: schedule.AdvisoryId.advisorId.name,
      date: schedule.dateStart,
      topic: schedule.topic,
      rated: !!schedule.rating,
    };
  } catch (e) {
    // Puedes lanzar un error para que el controller lo maneje
    throw new Error("El enlace ha expirado, es inválido o ya calificaste.");
  }
};

exports.updateFeedback = async (scheduleId, feedback, rating) => {
  // Actualiza feedback y rating del schedule
  const schedule = await Schedule.findByIdAndUpdate(
    scheduleId,
    { feedback, rating },
    { new: true }
  );
  if (!schedule) throw new Error("No se encontró el schedule");
  return schedule;
};
exports.getSchedulesByStudent = async (studentId) => {
  return await Schedule.find({ studentId }) // Filtra las asesorías del estudiante
    .populate({ path: "studentId", select: "name email" })
    .populate({
      path: "AdvisoryId",
      select: "advisorId careerId dateStart",
      populate: { path: "advisorId careerId", select: "name day email" },
    })
    .sort({ createdAt: -1 }); // Ordena por fecha de creación (más recientes primero)
};

exports.getSchedulesByDate = async (startDate, endDate) => {
  return Schedule.find({
    date: {
      $gte: startDate, // Mayor o igual a la fecha de hoy a las 00:00
      $lt: endDate, // Menor a la fecha de mañana a las 00:00
    },
  });
};
exports.getStudentsScheduledToday = async () => {
  const fecha = new Date();
  const todayStart = new Date(fecha);
  todayStart.setHours(-5, 0, 0, 0);
  const todayEnd = new Date(fecha);
  todayEnd.setHours(18, 59, 59, 999);

  // Buscar asesorías que se realicen hoy
  const advisoriesToday = await Advisory.find({
    dateStart: { $gte: todayStart, $lte: todayEnd },
  });

  // Extraer los IDs de esas asesorías
  const advisoryIds = advisoriesToday.map((advisory) => advisory._id);

  // Buscar en `Schedule` los estudiantes agendados en esas asesorías
  return await Schedule.find({
    AdvisoryId: { $in: advisoryIds },
  }).populate({
    path: "studentId AdvisoryId",
    select: "name code email advisorId dateStart dateEnd status",
  });
};

// Obtener cantidad de asesorías por asesor
exports.getAttendedSchedulesByAdvisor = async () => {
  try {
    const result = await Schedule.aggregate([
      { $match: { attendance: true } }, // Solo las asesorías atendidas
      {
        $lookup: {
          from: "advisories",
          localField: "AdvisoryId",
          foreignField: "_id",
          as: "advisory",
        },
      },
      { $unwind: "$advisory" },
      {
        $group: {
          _id: "$advisory.advisorId",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "advisor",
        },
      },
      { $unwind: "$advisor" },
      {
        $project: {
          _id: 0,
          advisorId: "$_id",
          advisorName: "$advisor.name",
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    return result;
  } catch (error) {
    throw new Error(
      "Error al obtener asesorías atendidas por asesor: " + error.message
    );
  }
};

exports.getAttendedSchedulesByAdvisorAll = async (startDate, endDate) => {
  try {
    const matchDateFilter = {
      ...(startDate &&
        endDate && {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        }),
    };

    const result = await User.aggregate([
      { $match: { role: "academic_friend" } },
      {
        $lookup: {
          from: "advisories",
          localField: "_id",
          foreignField: "advisorId",
          as: "advisories",
        },
      },
      { $unwind: { path: "$advisories", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "schedules",
          let: { advisoryId: "$advisories._id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$AdvisoryId", "$$advisoryId"] },
                ...matchDateFilter,
                attendance: true,
              },
            },
          ],
          as: "attendedSchedules",
        },
      },
      {
        $group: {
          _id: "$_id",
          advisorName: { $first: "$name" },
          profileImage: { $first: "$profileImage" },
          count: { $sum: { $size: "$attendedSchedules" } },
        },
      },
      {
        $project: {
          advisorId: "$_id",
          advisorName: 1,
          profileImage: 1,
          count: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);

    return result;
  } catch (error) {
    throw new Error(
      "Error al obtener asesorías atendidas por asesor: " + error.message
    );
  }
};
// Obtener promedio de asistencia por asesoría
exports.getAttendancePerSchedule = async () => {
  return await Schedule.aggregate([
    {
      $group: {
        _id: "$AdvisoryId",
        attendanceRate: {
          $avg: {
            $cond: ["$attendance", 1, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        advisoryId: "$_id",
        attendanceRate: 1,
      },
    },
  ]);
};

// Obtener cantidad de asesorías por tema
exports.getSchedulesByTopic = async () => {
  const byTopic = await Schedule.aggregate([
    {
      $group: {
        _id: "$topic",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        topic: "$_id",
        count: 1,
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
  return byTopic;
};

exports.getFeedbacksByMentor = async (mentorId) => {
  // Busca los schedules con feedback o rating, y asesoría del mentor indicado
  const schedules = await Schedule.find({
    $or: [
      { feedback: { $exists: true, $ne: "" } },
      { rating: { $exists: true, $ne: null } },
    ],
  })
    .populate({
      path: "studentId",
      select: "name email",
    })
    .populate({
      path: "AdvisoryId",
      match: { advisorId: mentorId },
      select: "advisorId",
      populate: { path: "advisorId", select: "name email" },
    })
    .sort({ updatedAt: -1 });

  // Filtrar los schedules que realmente pertenecen al mentor
  return schedules.filter((sch) => sch.AdvisoryId);
};

exports.getAllFeedbacks = async () => {
  // Busca todos los schedules con feedback o rating
  return Schedule.find({
    $or: [
      { feedback: { $exists: true, $ne: "" } },
      { rating: { $exists: true, $ne: null } },
    ],
  })
    .populate({
      path: "studentId",
      select: "name email",
    })
    .populate({
      path: "AdvisoryId",
      select: "advisorId",
      populate: { path: "advisorId", select: "name email" },
    })
    .sort({ updatedAt: -1 });
};
/**
 * Buscar asesorías próximas para un estudiante por su código.
 * @param {string} studentCode
 * @returns {Promise<Array>}
 */
exports.getUpcomingByStudentCode = async (codigo) => {
  // 1. Busca el usuario por el código de estudiante
  const user = await User.findOne({ codigo });
  if (!user) return [];

  const now = new Date();
  const margin = 80 * 60 * 1000; // 1 hora 20 minutos en ms

  return Schedule.find({
    studentId: user._id,
    status: { $ne: "canceled" },
    // Permite cancelar desde ahora y hasta 1h20min después de inicio
    dateStart: { $gte: new Date(now.getTime() - margin) },
  })
    .populate({
      path: "AdvisoryId",
      select: "advisorId",
      populate: {
        path: "advisorId",
        select: "name email",
      },
    })
    .sort({ dateStart: 1 });
};
/**
 * Cuenta los estudiantes agendados para una asesoría (y opcionalmente una fecha/hora específica)
 * @param {string} advisoryId
 * @param {string|Date} [dateStart] - (opcional) Fecha/hora exacta de la asesoría
 * @returns {Promise<number>}
 */
exports.countSchedulesByAdvisory = async (advisoryId, dateStart) => {
  try {
    if (!advisoryId || advisoryId.length !== 24) {
      throw new Error("advisoryId inválido");
    }
    const filter = { AdvisoryId: advisoryId, status: { $ne: "canceled" } };

    if (dateStart) {
      const start = moment.utc(dateStart).startOf("minute").toDate();
      const end = moment.utc(start).add(2, "hours").toDate();
      filter.dateStart = { $gte: start, $lt: end };
    }
    const count = await Schedule.countDocuments(filter);
    return count;
  } catch (error) {
    console.error("Error en countSchedulesByAdvisory:", error);
    throw error;
  }
};

/**
 * Cancela una asesoría por su ID
 * @param {string} scheduleId
 * @returns {Promise}
 */
exports.cancelSchedule = async (scheduleId) => {
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) throw new Error("No encontrada");

  const now = new Date();
  const margin = 80 * 60 * 1000; // 1 hora 20 minutos en ms

  // Solo permitir cancelar si estamos dentro del rango permitido
  if (now.getTime() > schedule.dateStart.getTime() + margin) {
    throw new Error(
      "Ya no es posible cancelar esta asesoría (fuera de tiempo permitido)"
    );
  }

  // Procede a cancelar...
  schedule.status = "canceled";
  await schedule.save();

  await schedule.populate([
    { path: "studentId", select: "name email" },
    {
      path: "AdvisoryId",
      populate: { path: "advisorId", select: "name email" },
    },
  ]);

  await EmailService.sendAppointmentCanceled(
    schedule.studentId,
    schedule.AdvisoryId.advisorId,
    schedule
  );

  return schedule;
};
// Obtener cantidad de asesorías por mes
exports.getSchedulesByMonth = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return await Schedule.aggregate([
    {
      $match: {
        dateStart: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$dateStart" },
          month: { $month: "$dateStart" },
          day: { $dayOfMonth: "$dateStart" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
        "_id.day": 1,
      },
    },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        day: "$_id.day",
        count: 1,
      },
    },
  ]);
};

// Obtener cantidad de asesorías por día de la semana
// Agrupar por día (fecha completa) y contar cuántas asesorías se agendaron ese día
exports.getSchedulesByDays = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return await Schedule.aggregate([
    {
      $match: {
        dateStart: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$dateStart" },
          month: { $month: "$dateStart" },
          day: { $dayOfMonth: "$dateStart" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
        "_id.day": 1,
      },
    },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        day: "$_id.day",
        count: 1,
      },
    },
  ]);
};

// Obtener cantidad de asesorías por año
exports.getSchedulesByLastYearByMonth = async () => {
  const oneYearAgo = subYears(new Date(), 1);

  return await Schedule.aggregate([
    {
      $match: {
        dateStart: { $gte: oneYearAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$dateStart" },
          month: { $month: "$dateStart" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        count: 1,
      },
    },
  ]);
};

exports.fetchTotalAdvisories = async () => {
  return await Schedule.countDocuments();
};

exports.fetchAttendancePercentage = async () => {
  const total = await Schedule.countDocuments({ status: "approved" });
  if (total === 0) return 0;

  const attended = await Schedule.countDocuments({
    attendance: true,
    status: "approved",
  });
  return ((attended / total) * 100).toFixed(1);
};

exports.fetchMonthlyAdvisories = async () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return await Schedule.countDocuments({
    createdAt: { $gte: firstDay, $lte: lastDay },
  });
};

exports.fetchMostActiveAdvisor = async () => {
  const result = await Schedule.aggregate([
    {
      $group: {
        _id: "$AdvisoryId",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 1 },
    {
      $lookup: {
        from: "advisories",
        localField: "_id",
        foreignField: "_id",
        as: "advisory",
      },
    },
    { $unwind: "$advisory" },
    {
      $lookup: {
        from: "users",
        localField: "advisory.advisorId",
        foreignField: "_id",
        as: "advisor",
      },
    },
    { $unwind: "$advisor" },
    {
      $project: {
        name: "$advisor.name",
        total: "$count",
      },
    },
  ]);

  return result[0] || { name: "Sin datos", total: 0 };
};
