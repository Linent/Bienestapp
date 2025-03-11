const mongoose = require("mongoose");

const AdvisorySchema = new mongoose.Schema({
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }], // Lista de estudiantes
    academicFriendId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true }, // Materia de la asesoría
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" },
    
},
  { timestamps: true } // Habilita createdAt y updatedAt automáticamente
);

module.exports = mongoose.model("Advisory", AdvisorySchema);
