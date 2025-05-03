const Schedule = require("../models/Schedule");
const Advisory = require("../models/Advisory");
const { getNextMatchingDate } = require("../helpers/dateHelper");
const { DateTime } = require("luxon");


exports.createSchedule = async (studentId, topic, advisoryId) => {
  try {
    const advisory = await Advisory.findById(advisoryId);
    if (!advisory) {
      throw new Error("No se encontró la asesoría.");
    }

    // Extrae el día y la hora desde el dateStart de la asesoría
    const advisoryDay = advisory.day;
    const advisoryHour = DateTime
      .fromJSDate(advisory.dateStart, { zone: "utc" })
      .toFormat("HH:mm");

    // Usa el helper
    const nextDate = getNextMatchingDate(advisoryDay, advisoryHour);
    console.log("➡ Próxima fecha sugerida:", nextDate.toISO());

    const newSchedule = new Schedule({
      studentId,
      topic,
      AdvisoryId: advisoryId,
      dateStart: nextDate.toJSDate(), // opcional, si lo quieres guardar
    });

    return await newSchedule.save();
  } catch (error) {
    throw new Error("Error al agendar: " + error.message);
  }
};
//{ path:'AdvisoryId', select: 'advisorId ' }
exports.getSchedules = async () => {
  try {
    const schedules = await Schedule.find()
      .populate({ path: "studentId", select: "name codigo email" })
      .populate({ path: "AdvisoryId", select: "advisorId careerId dateStart", populate:{ path:'advisorId careerId', select:'name enable codigo code' } });
    return schedules;
  } catch (error) {
    throw new Error("Error al buscar todas las citas" + error.message);
  }
};

exports.getStudentsByAdvisorAndDate = async (advisoryId, day, dateStart) => {
  const advisorySchedules = await Schedule.find({ AdvisoryId: advisoryId })
    .populate({ path: "AdvisoryId", select: "dateStart day" })
    .populate({
      path: "studentId",
      select: "name codigo email career",
      populate: { path: "career", select: "name" },
    });

    const filteredSchedules = advisorySchedules.filter((schedule) => {
      const advisory = schedule.AdvisoryId;
      if (!advisory || !schedule.dateStart) return false;
    
      const advisoryDay = advisory.day.toLowerCase();
    
      const scheduleMillis = DateTime.fromJSDate(schedule.dateStart).toUTC().startOf("minute").toMillis();
      const queryMillis = DateTime.fromISO(dateStart).toUTC().startOf("minute").toMillis();
    
      return advisoryDay === day.toLowerCase() && scheduleMillis === queryMillis;
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

exports.getSchedulesByStudent = async (studentId) => {
  return await Schedule.find({ studentId }) // Filtra las asesorías del estudiante
  .populate({ path: 'studentId', select: 'name email'})
  .populate({
    path: "AdvisoryId", select: 'advisorId careerId dateStart',
    populate: { path: 'advisorId careerId', select: 'name day email' },
  })
  .sort({ createdAt: -1 }); // Ordena por fecha de creación (más recientes primero)
};

exports.getSchedulesByDate = async (startDate, endDate) => {
  return Schedule.find({
    date: {
      $gte: startDate, // Mayor o igual a la fecha de hoy a las 00:00
      $lt: endDate,    // Menor a la fecha de mañana a las 00:00
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
  const advisoryIds = advisoriesToday.map(advisory => advisory._id);

  // Buscar en `Schedule` los estudiantes agendados en esas asesorías
  return await Schedule.find({
    AdvisoryId: { $in: advisoryIds }
  }).populate({
    path: 'studentId AdvisoryId', 
    select: 'name code email advisorId dateStart dateEnd status',
  })
  ;
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
          as: "advisory"
        }
      },
      { $unwind: "$advisory" },
      {
        $group: {
          _id: "$advisory.advisorId",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "advisor"
        }
      },
      { $unwind: "$advisor" },
      {
        $project: {
          _id: 0,
          advisorId: "$_id",
          advisorName: "$advisor.name",
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);
    console.log(result);
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
            $cond: ["$attendance", 1, 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        advisoryId: "$_id",
        attendanceRate: 1
      }
    }
  ]);
};


// Obtener cantidad de asesorías por tema
exports.getSchedulesByTopic = async () => {
  
   const byTopic = await Schedule.aggregate([
    {
      $group: {
        _id: "$topic",
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        topic: "$_id",
        count: 1
      }
    }
  ]);
  return byTopic
};

// Obtener cantidad de asesorías por mes
exports.getSchedulesByMonth = async () => {
  return await Schedule.aggregate([
    { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } }
  ]);
};

// Obtener cantidad de asesorías por día de la semana
exports.getSchedulesByDay = async () => {
  return await Schedule.aggregate([
    { $group: { _id: { $dayOfWeek: "$createdAt" }, count: { $sum: 1 } } }
  ]);
};

// Obtener cantidad de asesorías por año
exports.getSchedulesByYear = async () => {
  return await Schedule.aggregate([
    { $group: { _id: { $year: "$createdAt" }, count: { $sum: 1 } } }
  ]);
};
