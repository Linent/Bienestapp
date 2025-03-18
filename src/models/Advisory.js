const mongoose = require("mongoose");

const advisorySchema = new mongoose.Schema(
  {
    advisorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Asesor académico asignado
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true }, // Materia de la asesoría
    dateStart: { type: Date, required: true }, // Fecha y hora de la asesoría
    dateEnd: { type: Date, required: true }, //Fecha de la finalización de la asesoría
    status: { type: String, enum: ["pending", "approved", "completed", "canceled"], default: "pending" }, // Estado de la asesoría
  },
  { timestamps: true }
);

module.exports =  mongoose.model("Advisory", advisorySchema);

//attendance: { type: Boolean, default: false }, // Si el estudiante asistió o no
//student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Estudiante que solicita la asesoría