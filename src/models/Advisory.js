const mongoose = require("mongoose");

const advisorySchema = new mongoose.Schema(
  {
    advisorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Asesor académico asignado
    careerId: { type: mongoose.Schema.Types.ObjectId, ref: "Career", required: true }, // Materia de la asesoría
    day: { type: String, enum: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'], required: true },
    dateStart: { type: Date, required: true }, // Fecha y hora de la asesoría
    dateEnd: { type: Date, required: true }, //Fecha de la finalización de la asesoría
    status: { type: String, enum: ["pending", "approved", "canceled"], default: "approved" }, // Estado de la asesoría
    recurring: { type: Boolean, default: true }, // Si la asesoría es recurrente o no
  },
  { timestamps: true }
);

module.exports =  mongoose.model("Advisory", advisorySchema);
