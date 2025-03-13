import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    advisory: { type: mongoose.Schema.Types.ObjectId, ref: "Advisory", required: true }, // Asesoría registrada
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Estudiante que asistió
    status: { type: String, enum: ["present", "absent"], required: true }, // Estado de asistencia
    recordedAt: { type: Date, default: Date.now }, // Fecha y hora de registro
  },
  { timestamps: true }
);

export default mongoose.model("Attendance", attendanceSchema);
