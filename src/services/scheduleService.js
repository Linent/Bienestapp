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