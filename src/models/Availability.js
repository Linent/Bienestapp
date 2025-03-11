const mongoose = require("mongoose");

const AvailabilitySchema = new mongoose.Schema({
    academicFriendId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true }, // Formato HH:mm
    endTime: { type: String, required: true },
    isBooked: { type: Boolean, default: false }
},
  { timestamps: true });

module.exports = mongoose.model("Availability", AvailabilitySchema);
