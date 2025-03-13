const AttendanceService = require("../services/AttendanceService");
const handlerError = require("../utils/handlerError");

const advisoryService = new AttendanceService();

const registerAttendance = async (req, res) => {
  try {
    const { advisoryId, studentCode, status } = req.body;
    if (!advisoryId || !studentCode || !status) {
      return handlerError(res, "All fields are required", 400);
    }

    const attendance = await advisoryService.registerAttendance(advisoryId, studentCode, status);
    res.status(201).json({ message: "Attendance registered successfully", attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerAttendance };
