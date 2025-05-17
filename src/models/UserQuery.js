// models/UserQuery.js
const mongoose = require("mongoose");

const userQuerySchema = new mongoose.Schema({
  userId:    {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserInfo",
    required: true,
  },
  rawQuery:  { type: String, required: true },       // mensaje original
  topicKey:  { type: String },                       // palabra clave mapeada
  topicId:   {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Topic",
  },                                                 // enlace opcional
}, { timestamps: true });

module.exports = mongoose.model("UserQuery", userQuerySchema);
