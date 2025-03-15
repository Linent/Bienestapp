const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Nombre de la materia
    career: { type: mongoose.Schema.Types.ObjectId, ref: "Career", required: true }, // Carrera a la que pertenece
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
