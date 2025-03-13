import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "academic_friend", "admin"], required: true },
    career: { type: mongoose.Schema.Types.ObjectId, ref: "Career", required: false }, // Carrera del estudiante o asesor
    codigo: { type: String, required: true, unique: true }, // Código del estudiante o asesor
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
