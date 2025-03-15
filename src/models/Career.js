const mongoose = require("mongoose");

const careerSchema = new mongoose.Schema(
  {
    code: { type: String, required: true }, // Código único de la carrera
    name: { type: String, required: true }, // Nombre de la carrera
  },
  { timestamps: true }
);

module.exports = mongoose.model("Career", careerSchema);
