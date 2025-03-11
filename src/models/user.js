const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "academic_friend", "admin"], required: true },
    career: { type: String }, // Campo opcional
  },
  { timestamps: true } // Habilita createdAt y updatedAt automáticamente
);

module.exports = mongoose.model("User", UserSchema);
