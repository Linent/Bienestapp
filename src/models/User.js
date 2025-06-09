const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    codigo: { type: String, required: true },
    dni: { type: String, required: true},
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true, select: false },
    career: { type: mongoose.Schema.Types.ObjectId, ref: "Career" },
    role: { type: String, enum: ["student", "academic_friend", "admin"] },
    enable: { type: Boolean, default: true },
    availableHours: { type: Number, default: 0, max: 20 }, // Máximo 20 horas disponibles
    delete: { type: Boolean, default: false }, // Si el usuario está eliminado o no

    // Nueva propiedad para imagen de perfil
    profileImage: { type: String },     // URL Cloudinary
    resume: { type: String },           // URL Cloudinary
    resumePublicId: { type: String },   // ID público Cloudinary
    imagePublicId: { type: String },    // ID público Cloudinary
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
