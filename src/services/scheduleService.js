const Schedule = require("../models/Schedule");
const Advisory = require("../models/Advisory");

exports.createSchedule = async (studentId, topic, advisoryId) => {
  try {
    const advisoryExists = await Advisory.findById(advisoryId);
    if (!advisoryExists) {
      throw new Error("No se encontro al asesor");
    }
    const newSchedule = new Schedule({
      studentId,
      topic,
      AdvisoryId: advisoryId,
    });
    const newScheduleSucces = await newSchedule.save();
    return newScheduleSucces;
  } catch (error) {
    throw new Error("Error creando al agendar: " + error.message);
  }
};
//{ path:'AdvisoryId', select: 'advisorId ' }
exports.getSchedules = async () => {
  try {
    const schedules = await Schedule.find()
      .populate({ path: "studentId", select: "name codigo email" })
      .populate({
        path: "AdvisoryId",
        select: "subjectId dateStart status",
        populate: { path: "AdvisorId ", select: "name" },
        populate: {
          path: "career",
          select: "name",
        },
      });
    return schedules;
  } catch (error) {
    throw new Error("Error al buscar todas las citas" + error.message);
  }
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
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) {
      throw new Error(errorsConstants.notFound);
  }

  schedule.attendance = attendanceStatus;
  schedule.status = attendanceStatus ? 'completed' : 'pending';
  await schedule.save();

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