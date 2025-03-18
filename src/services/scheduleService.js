const Schedule = require("../models/Schedule");
const Advisory = require("../models/Advisory");

exports.createSchedule = async (studentId, topic, advisoryId, status) => {
  try {

    const advisoryExists = await Advisory.findById(advisoryId);
    if (!advisoryExists) {
      throw new Error("No se encontro al asesor");
    }
    console.log(advisoryExists);
    const newSchedule = new Schedule({
      studentId,
      topic,
      AdvisoryId:advisoryId,
      status
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
    console.log('llega acá');
    const schedules = await Schedule.find().populate({ path:'studentId', select:'name codigo email'}).populate({path: 'AdvisoryId', select:'subjectId dateStart status', populate:{path: 'advisorId ', select:'name'}, populate: { path: 'subjectId', select: 'name career', populate: { path: 'career', select: 'name' } } });
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
}

exports.updateSchedule = async (ScheduleId,attendance, AdvisoryId, status)=>{
    try {
        const updatedSchedule = await Schedule.findByIdAndUpdate(ScheduleId
            ,
            { $set:{ attendance, AdvisoryId, status } },
            { new: true }
          );
          return updatedSchedule;
    } catch (error) {
        throw new Error("Error al actualizar reservación" + error.message);
    }
}

exports.deleteSchedule = async (scheduleId) =>{
    try {
        const deletedSchedule = await Schedule.findByIdAndDelete(scheduleId);
        return deletedSchedule;
    } catch (error) {
        throw new Error("Error al eliminar reservación" + error.message);
    }
}