const AdvisoryService = require("../services/advisoryService");
const { handlerError } = require("../handlers/errors.handlers");
const errorsConstants = require("../constants/errors.constant");
const Advisory = require("../models/Advisory");



const createAdvisory = async (req, res) => {
  try {
    const { studentCode, academicFriendCode, subjectCode, date, status, topic } = req.body;
    
    if (!studentCode || !academicFriendCode || !subjectCode|| !topic || !status|| !date) {
      return handlerError(res, 404, errorsConstants.inputRequired);
    }
    const advisory = await AdvisoryService.createAdvisory(studentCode, academicFriendCode, subjectCode, date, status, topic);
    return res.status(201).send(advisory);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

const getAllAdvisories = async (req, res) => {
  try {
    const advisories = await Advisory.find().populate("student advisor subject");
    res.status(200).send(advisories);
  } catch (error) {
    return handlerError(res, 500, error.message);
  }
};

const getAdvisoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const advisory = await Advisory.findById(id).populate("student advisor subject");
    if (!advisory) {
      return handlerError(res, 404, "Asesoría no encontrada");
    }
    res.status(200).send(advisory);
  } catch (error) {
    return handlerError(res, 500, error.message);
  }
};

const updateAdvisory = async (req, res) => {
  try {
    const { id } = req.params;
    const advisory = await Advisory.findByIdAndUpdate(id, req.body, { new: true });
    if (!advisory) {
      return handlerError(res, 404, "Asesoría no encontrada");
    }
    res.status(200).send({ message: "Asesoría actualizada con éxito", advisory });
  } catch (error) {
    return handlerError(res, 500, error.message);
  }
};

const deleteAdvisory = async (req, res) => {
  try {
    const { id } = req.params;
    const advisory = await Advisory.findByIdAndDelete(id);
    if (!advisory) {
      return handlerError(res, 404, "Asesoría no encontrada");
    }
    res.status(200).send({ message: "Asesoría eliminada con éxito" });
  } catch (error) {
    return handlerError(res, 500, error.message);
  }
};

module.exports = { createAdvisory, getAllAdvisories, getAdvisoryById, updateAdvisory, deleteAdvisory };
