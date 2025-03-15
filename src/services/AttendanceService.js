const Attendance = require("../models/Attendance");


  exports.registerAttendance = async (advisoryId, studentCode, status) => {
    try {
      const newAttendance = new Attendance({
        advisory: advisoryId,
        student: studentCode,
        status,
      });

      return await newAttendance.save();
    } catch (error) {
      throw new Error("Error registrando asistencia: " + error.message);
    }
  }

  exports.getAttendanceByAdvisory = async (advisoryId) => {
    try {
      return await Attendance.find({ advisory: advisoryId }).populate("student", "name email");
    } catch (error) {
      throw new Error("Error obteniendo asistencias: " + error.message);
    }
  }

  exports.getAttendanceByStudent = async (studentId) => {
    try {
      return await Attendance.find({ student: studentId }).populate("advisory", "topic date");
    } catch (error) {
      throw new Error("Error obteniendo asistencia del estudiante: " + error.message);
    }
  }
  exports.getAllAttendance = async () => {
    try {
        return await Attendance.find();
    } catch (error) {
        throw new Error("Error obteniendo todas las asistencias: " + error.message);
    }
  }

