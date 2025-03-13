import mongoose from "mongoose";

const careerSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // Código único de la carrera
    name: { type: String, required: true }, // Nombre de la carrera
  },
  { timestamps: true }
);

export default mongoose.model("Career", careerSchema);
