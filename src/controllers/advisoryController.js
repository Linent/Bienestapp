const AdvisoryService = require("../services/advisoryService");
const { handlerError } = require("../handlers/errors.handlers");
const errorsConstants = require("../constants/errors.constant");

const createAdvisory = async (req, res) => {
  try {
    const { advisorId, subjectId, dateStart, status } = req.body;

    if (
      !advisorId ||
      !subjectId ||
      !dateStart ||
      !status
    ) {
      return handlerError(res, 404, errorsConstants.inputRequired);
    }
    
    // Calcular dateEnd sumando 2 horas a dateStart
    const dateEnd = new Date(dateStart);
    dateEnd.setHours(dateEnd.getHours() + 2);
    
    const advisory = await AdvisoryService.createAdvisory(
      advisorId,
      subjectId,
      dateStart,
      dateEnd,
      status
    );
    return res.status(201).send(advisory);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

const getAllAdvisories = async (req, res) => {
  try {
    const allAdvisories = await AdvisoryService.getAllAdvisory()
    return res.status(200).send(allAdvisories);
  } catch (error) {
    return handlerError(res, 500, error.message);
  }
};

const getAdvisoryById = async (req, res) => {
  try {
    const { advisoryId } = req.params;
    console.log(advisoryId);
    if (!advisoryId) {
      return handlerError(res, 404, errorsConstants.inputIdRequired);
    }
    const advisory = await AdvisoryService.getAdvisoryById(advisoryId);
    
    res.status(200).send(advisory);
  } catch (error) {
    return handlerError(res, 500, error.message);
  }
};

const updateAdvisory = async (req, res) => {
  try {
    const { advisoryId } = req.params;
    if(!advisoryId){
      return handlerError(res,400, errorsConstants.inputIdRequired);
    }
    const body = req.body;
    const advisory = await AdvisoryService.updateAdvisory(advisoryId, body );
    if (!advisory) {
      return handlerError(res, 404, errorsConstants.advisoryNotUpdate);
    }
    res.status(200).send(advisory );
  } catch (error) {
    return handlerError(res, 500, error.message);
  }
};

const deleteAdvisory = async (req, res) => {
  try {
    const { advisoryId } = req.params;
    const advisory = await AdvisoryService.deleteAdvisory(advisoryId);
    if (!advisory) {
      return handlerError(res, 404, "Asesoría no encontrada");
    }
    res.status(200).send({ succes: true });
  } catch (error) {
    return handlerError(res, 500, error.message);
  }
};

module.exports = {
  createAdvisory,
  getAllAdvisories,
  getAdvisoryById,
  updateAdvisory,
  deleteAdvisory,
};
