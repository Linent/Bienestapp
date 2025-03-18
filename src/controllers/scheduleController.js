const { errorsConstants } = require("../constants/errors.constant");
const { handlerError } = require("../handlers/errors.handlers");
const ScheduleService = require('../services/scheduleService');

// Crear un nuevo registro en el horario (schedule)
const createSchedule = async (req, res) => {
  try {
    const { studentId, topic, advisoryId, status } = req.body;
    //console.log(studentId, attendance, topic, advisoryId, status);
    if(!studentId|| !topic|| !advisoryId|| !status){
        return handlerError(res,400, errorsConstants.inputRequired);
    }
    const newSchedule = await ScheduleService.createSchedule(studentId, topic, advisoryId, status);
    
    res.status(201).send(newSchedule);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Obtener todos los registros de horarios
const getSchedules = async (req, res) => {
  try {
    const allSchedules = await ScheduleService.getSchedules();
    return res.status(200).send(allSchedules);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Obtener un registro por ID
const getScheduleById = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    console.log('esto');

    if (!scheduleId) { return handlerError(res,400, errorsConstants.inputIdRequired) };

    const getSchedule = await ScheduleService.getScheduleById(scheduleId);
    return res.status(200).send(getSchedule);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Actualizar el estado de asistencia
const updateSchedule = async (req, res) => {
  try {
    const { attendance, status, AdvisoryId } = req.body;
    const ScheduleId = req.params;
    const updateScheduleStatus = await ScheduleService.updateSchedule(ScheduleId, AdvisoryId, attendance, status);
    
    if (!updatedSchedule) return res.status(404).send({ message: "Schedule not found" });
    res.send(updateScheduleStatus);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Eliminar un registro de horario
const deleteSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params
    if(!scheduleId){
      return handlerError(res,400, errorsConstants.inputIdRequired);
    }
    const deletedSchedule = await ScheduleService.deleteSchedule(scheduleId);

    if (!deletedSchedule) return res.status(404).json({ message: "Schedule not found" });
    res.status(200).send({ succes: true });
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

module.exports = { createSchedule, getSchedules, getScheduleById, updateSchedule, deleteSchedule };
