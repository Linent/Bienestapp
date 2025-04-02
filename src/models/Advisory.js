const mongoose = require("mongoose");

const advisorySchema = new mongoose.Schema(
  {
    advisorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Asesor académico asignado
    careerId: { type: mongoose.Schema.Types.ObjectId, ref: "Career", required: true }, // Materia de la asesoría
    day: { type: String, enum: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'], required: true },
    dateStart: { type: Date, required: true }, // Fecha y hora de la asesoría
    dateEnd: { type: Date, required: true }, //Fecha de la finalización de la asesoría
    status: { type: String, enum: ["pending", "approved", "canceled"], default: "pending" }, // Estado de la asesoría
  },
  { timestamps: true }
);

module.exports =  mongoose.model("Advisory", advisorySchema);

//attendance: { type: Boolean, default: false }, // Si el estudiante asistió o no
//student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Estudiante que solicita la asesoría