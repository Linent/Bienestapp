import mongoose from "mongoose";

const advisorySchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Estudiante que solicita la asesoría
    advisor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Asesor académico asignado
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true }, // Materia de la asesoría
    topic: { type: String, required: true }, // Tema específico de la asesoría
    date: { type: Date, required: true }, // Fecha y hora de la asesoría
    status: { type: String, enum: ["pending", "approved", "completed", "canceled"], default: "pending" }, // Estado de la asesoría
    attendance: { type: Boolean, default: false }, // Si el estudiante asistió o no
  },
  { timestamps: true }
);

export default mongoose.model("Advisory", advisorySchema);
