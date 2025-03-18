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
      enum: ["pending", "approved", "completed", "canceled"],
      default: "pending",
    },
    AdvisoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Advisory",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("schedule", scheludeShema);
