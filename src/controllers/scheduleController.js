const { errorsConstants } = require("../constants/errors.constant");
const { handlerError } = require("../handlers/errors.handlers");
const ScheduleService = require("../services/scheduleService");

exports.createSchedule = async (req, res) => {
  try {
 
    const { studentId, topic, advisoryId } = req.body;
    if (!studentId || !topic || !advisoryId) {
      return handlerError(res, 400, errorsConstants.inputRequired);
    }
    const newSchedule = await ScheduleService.createSchedule(
      studentId,
      topic,
      advisoryId
    );

    res.status(201).send(newSchedule);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};
exports.getStudentsByAdvisory = async (req, res) => {
  try {
    const { advisoryId, day, dateStart } = req.query;

    if (!advisoryId || !day || !dateStart) {
      return handlerError(res, 400, errorsConstants.inputRequired);
    }

    const students = await ScheduleService.getStudentsByAdvisorAndDate(advisoryId, day, dateStart);
    if(!students || students.length === 0) {
      return handlerError(res, 400, errorsConstants.schedulesEmpty);
    }
    res.status(200).send(students);
  } catch (error) {
    console.error(error);
    return handlerError(res, 500, errorsConstants.serverError);
  }
};
// Obtener todos los registros de horarios
exports.getSchedules = async (req, res) => {
  try {
    //?example how to valid by role
    //!TODO on anothers controllers
    const usersValid = ["academic_friend", "admin"];

    if (!usersValid.includes(req.user.role)){
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    const allSchedules = await ScheduleService.getSchedules();
    return res.status(200).send(allSchedules);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Obtener un registro por ID
exports.getScheduleById = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    if (!scheduleId) {
      return handlerError(res, 400, errorsConstants.inputIdRequired);
    }

    const getSchedule = await ScheduleService.getScheduleById(scheduleId);
    return res.status(200).send(getSchedule);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Actualizar el estado de asistencia
exports.updateSchedule = async (req, res) => {
  try {
    //?example how to valid by role
    //!TODO on anothers controllers
    const usersValid = ["academic_friend", "admin"];

    if (!usersValid.includes(req.user.role))
      return handlerError(res, 403, errorsConstants.unauthorized);

    let dataToUpdate = {
      updateAt: new Date(),
      ...req.body,
    };

    const { scheduleId } = req.params;
    const updateScheduleStatus = await ScheduleService.updateSchedule(
      scheduleId,
      dataToUpdate
    );

    if (!updateScheduleStatus)
      return handlerError(res,404,errorsConstants.schedulesNotUpdate)
    res.send(updateScheduleStatus);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Eliminar un registro de horario
exports.deleteSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    if (!scheduleId) {
      return handlerError(res, 400, errorsConstants.inputIdRequired);
    }
    const deletedSchedule = await ScheduleService.deleteSchedule(scheduleId);

    if (!deletedSchedule)
      return res.status(404).send({ message: "Schedule not found" });
    res.status(200).send({ succes: true });
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    const { scheduleId, attendanceStatus } = req.body;

    const schedule = await ScheduleService.updateAttendance(scheduleId, attendanceStatus);
    return res.status(200).send(schedule);
  } catch (error) {
    return handlerError(res, 400, error.message);
  }
}; 

exports.getSchedulesByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    if(!studentId){
      return handlerError(res,400, errorsConstants.inputIdRequired);
    }
    const schedules = await ScheduleService.getSchedulesByStudent(studentId);

    if (!schedules || schedules.length === 0) {
      return handlerError(res,400, errorsConstants.schedulesEmpty)
    }

    return res.status(200).send(schedules);
  } catch (error) {
    return handlerError(res, 400, error.message);
  }
};



exports.getStudentsScheduledToday = async (req, res) => {
  try {
    // Validar que el usuario tenga permisos
    const usersValid = ["academic_friend", "admin"];
    if (!usersValid.includes(req.user.role)) {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }
    const studentsToday = await ScheduleService.getStudentsScheduledToday();
    return res.status(200).send(studentsToday);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Obtener cantidad de asesorías por asesor
exports.getSchedulesByAdvisor = async (req, res) => {
  try {
    const result = await ScheduleService.getAttendedSchedulesByAdvisor();
    console.log(result);
    if(!result || result.length === 0) {
      return handlerError(res, 404, errorsConstants.schedulesEmpty);
    }
    return res.status(200).send(result);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Obtener promedio de asistencia por asesoría
exports.getAttendancePerSchedule = async (req, res) => {
  try {
    const result = await ScheduleService.getAttendancePerSchedule();
    return res.status(200).send(result);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Obtener cantidad de asesorías por tema
exports.getSchedulesByTopic = async (req, res) => {
  try {
    const result = await ScheduleService.getSchedulesByTopic();
    return res.status(200).send(result);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Obtener cantidad de asesorías por mes
exports.getSchedulesByMonth = async (req, res) => {
  try {
    const result = await ScheduleService.getSchedulesByMonth();
    return res.status(200).send(result);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Obtener cantidad de asesorías por día de la semana
exports.getSchedulesByDay = async (req, res) => {
  try {
    const result = await ScheduleService.getSchedulesByDay();
    return res.status(200).send(result);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Obtener cantidad de asesorías por año
exports.getSchedulesByYear = async (req, res) => {
  try {
    const result = await ScheduleService.getSchedulesByYear();
    return res.status(200).send(result);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};