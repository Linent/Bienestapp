const Schedule = require("../models/Schedule");
const Advisory = require("../models/Advisory");
const User = require("../models/User");
const { getNextMatchingDate } = require("../helpers/dateHelper");
const { DateTime } = require("luxon");
const { startOfYear, subYears } = require("date-fns");
exports.createSchedule = async (studentId, topic, advisoryId) => {
  try {
    const advisory = await Advisory.findById(advisoryId);
    if (!advisory) throw new Error("No se encontró la asesoría.");

    // Obtener fecha exacta de la asesoría (día y hora)
    const advisoryDay = advisory.day; // Ej: "Monday"
    const advisoryHour = DateTime.fromJSDate(advisory.dateStart)
      .setZone("America/Bogota")
      .toFormat("HH:mm");

    // Calcular la próxima fecha en que se repite esa asesoría
    const nextDate = getNextMatchingDate(advisoryDay, advisoryHour);

    // Contar cuántos estudiantes ya están agendados para esa fecha exacta
    const count = await Schedule.countDocuments({
      AdvisoryId: advisoryId,
      dateStart: nextDate.toJSDate(),
    });

    if (count >= 10) {
      throw new Error("No hay cupos disponibles para esta asesoría.");
    }

    // Crear nuevo agendamiento en esa misma hora
    const newSchedule = new Schedule({
      studentId,
      topic,
      AdvisoryId: advisoryId,
      dateStart: nextDate.toJSDate(), // siempre la misma hora
    });

    await newSchedule.save();
    return newSchedule;
  } catch (error) {
    throw new Error("Error al agendar: " + error.message);
  }
};

// Ayuda: función para obtener la próxima fecha con ese día de la semana

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
  const advisorySchedules = await Schedule.find({ AdvisoryId: advisoryId })
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
    { attendance: attendanceStatus },
    { new: true }
  );

  if (!schedule) throw new Error("No se encontró el schedule");

  return schedule;
};

exports.updateFeedback = async (scheduleId, description, rating) => {
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) {
    throw new Error("Asesoría no encontrada.");
  }

  if (schedule.status !== "completed") {
    throw new Error("Solo puedes calificar asesorías completadas.");
  }

  schedule.description = description;
  schedule.rating = rating;
  return await schedule.save();
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
      ...(startDate && endDate && {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      })
    };

    const result = await User.aggregate([
      { $match: { role: "academic_friend" } },
      {
        $lookup: {
          from: "advisories",
          localField: "_id",
          foreignField: "advisorId",
          as: "advisories"
        }
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
                attendance: true
              }
            }
          ],
          as: "attendedSchedules"
        }
      },
      {
        $group: {
          _id: "$_id",
          advisorName: { $first: "$name" },
          profileImage: { $first: "$profileImage" },
          count: { $sum: { $size: "$attendedSchedules" } }
        }
      },
      {
        $project: {
          advisorId: "$_id",
          advisorName: 1,
          profileImage: 1,
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    return result;
  } catch (error) {
    throw new Error("Error al obtener asesorías atendidas por asesor: " + error.message);
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
      $sort: { count: -1 }
    }
  ]);
  return byTopic;
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
  const total = await Schedule.countDocuments();
  if (total === 0) return 0;

  const attended = await Schedule.countDocuments({ attendance: true });
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
