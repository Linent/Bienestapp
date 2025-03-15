const AttendanceService = require("../services/AttendanceService");
const handlerError = require("../handlers/errors.handlers");
const errorsConstants = require("../constants/errors.constant");

exports.registerAttendance = async (req, res) => {
  try {
    const { advisoryId, studentCode, status } = req.body;
    if (!advisoryId || !studentCode || !status) {
      return handlerError(res, 404, errorsConstants.inputRequired);
    }

    const attendance = await AttendanceService.registerAttendance(advisoryId, studentCode, status);
    return res.status(201).send(attendance);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

exports.allAttendance = async (req, res) => {
  try {
      const Attendances = await AttendanceService
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};


