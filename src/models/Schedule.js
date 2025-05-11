const mongoose = require("mongoose");

const scheludeShema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topic: { type: String, required: true }, // Tema específico de la asesoría
    attendance: { type: Boolean, default: false }, // Si el estudiante asistió o no
    status: {
      type: String,
      enum: ["approved","pending", "completed", "canceled"],
      default: "approved",
    },
    AdvisoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Advisory",
      required: true,
    },
    dateStart: { type: Date, required: true }, // Fecha y hora de inicio de la asesoría
    observation: { type: String, default: "" }, // Observaciones del asesor
    feedback: { type: String, default: "" }, // comentario del estudiante
    rating: { type: Number, min: 1, max: 5 }, // calificación de 1 a 5
  },
  { timestamps: true }
);

module.exports = mongoose.model("schedule", scheludeShema);
