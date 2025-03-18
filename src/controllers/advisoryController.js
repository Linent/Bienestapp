const AdvisoryService = require("../services/advisoryService");
const { handlerError } = require("../handlers/errors.handlers");
const errorsConstants = require("../constants/errors.constant");

const createAdvisory = async (req, res) => {
  try {
    const { advisorId, careerId, dateStart, status } = req.body;

    if (
      !advisorId ||
      !careerId ||
      !dateStart ||
      !status
    ) {
      return handlerError(res, 404, errorsConstants.inputRequired);
    }
    
    // Calcular dateEnd sumando 2 horas a dateStart
    const dateEnd = new Date(dateStart);
    dateEnd.setHours(dateEnd.getHours() + 4);
    
    const advisory = await AdvisoryService.createAdvisory(
      advisorId,
      careerId,
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
    return handlerError(res, 500, errorsConstants.serverError);
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
    return handlerError(res, 500, errorsConstants.serverError);
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
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

const deleteAdvisory = async (req, res) => {
  try {
    const { advisoryId } = req.params;
    const advisory = await AdvisoryService.deleteAdvisory(advisoryId);
    if (!advisory) {
      return handlerError(res,400, errorsConstants.inputIdRequired);
    }
    res.status(200).send({ succes: true });
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

const getReportByDate = async (req, res) => {
  try {
    const { filterType } = req.params;
    const report = await AdvisoryService.getAdvisoryReport(filterType);
    res.status(200).send(report);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

const getTopCareersReport = async (req, res) => {
  try {
    const report = await AdvisoryService.getTopCareers();
    res.send(report);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

module.exports = {
  createAdvisory,
  getAllAdvisories,
  getAdvisoryById,
  updateAdvisory,
  deleteAdvisory,
  getTopCareersReport,
  getReportByDate
};
