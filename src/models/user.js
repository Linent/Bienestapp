const mongoose = require("mongoose");
const userSchema =  new mongoose.Schema(
    {
      codigo: { type:String, required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
      password: { type: String, required: true },
      career: { type: mongoose.Schema.Types.ObjectId, ref: 'Career' },
      role: { type: String, enum: ['student', 'academic_friend', 'admin'] },
      enable: { type: Boolean, default: true }
    },
    {
      timestamps: true 
    }
  );
  
  module.exports = mongoose.model("User", userSchema);