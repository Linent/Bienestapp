const mongoose = require("mongoose");
const { DOCUMENT_TYPES, BENEFICIARY_TYPES } = require("../constants/userEnums");

const userInfoSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  fullName: { type: String, required: true },
  documentType: {
    type: String,
    enum: DOCUMENT_TYPES,
    required: true,
  },
  documentNumber: { type: String, required: true },
  ufpsCode: { type: String, required: true },
  beneficiaryType: {
    type: String,
    enum: BENEFICIARY_TYPES,
    required: true,
  },
  academicProgram: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("UserInfo", userInfoSchema);
