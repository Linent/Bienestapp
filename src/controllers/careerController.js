const careerService = require("../services/CareerService");
const { handlerError } = require("../handlers/errors.handlers");
const { errorsConstants } = require("../constants/errors.constant");

exports.createCareer = async (req, res) => {
  try {
    const { name, code, enable } = req.body;
    const usersValid = ["academic_friend", "admin"];

    if (!usersValid.includes(req.user.role)){
      return handlerError(res, 403, errorsConstants.unauthorized);
    }
    if (!name || !code) {
      return handlerError(res, 404, errorsConstants.inputRequired);
    }
    const career = await careerService.createCareer(name, code, enable);
    if (!career) return handlerError(res, 409, errorsConstants.careerExist);

    return res.status(201).send(career);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

exports.getAllCareers = async (req, res) => {
  try {
    const usersValid = ["admin"];

    if (!usersValid.includes(req.user.role)){
      return handlerError(res, 403, errorsConstants.unauthorized);
    }
    const careers = await careerService.getAllCareers();
    res.status(200).send(careers);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

exports.getCareerById = async (req, res) => {
  try {
    const usersValid = ["admin"];

    if (!usersValid.includes(req.user.role)){
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    const { Id } = req.params;
    if (!careerId) {
      return handlerError(res, 400, errorsConstants.inputIdRequired);
    }
    const result = await careerService.getCareerById(Id);
    return res.status(result.status).send(result);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

exports.updateCareer = async (req, res) => {
  try {
    const usersValid = ["admin"];
    if (!usersValid.includes(req.user.role)){
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    const { Id } = req.params;
    const body = req.body;
    if (!body || !careerId) {
      return handlerError(res, 400, errorsConstants.inputRequired);
    }
    const result = await careerService.updateCareer(Id, body);
    return res.status(result.status).send(result);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

exports.enableCareer = async (req, res) => {
  try {
    const usersValid = ["academic_friend", "admin"];

    if (!usersValid.includes(req.user.role)){
      return handlerError(res, 403, errorsConstants.unauthorized);
    }
    const { enable } = req.body;
    const { Id } = req.params;
    const result = await careerService.enableCareer(Id, enable);
    return res.status(result.status).send(result);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }

};

exports.getCareerCode = async (req, res) => {
  try {
    const usersValid = ["admin"];
    if (!usersValid.includes(req.user.role)){
      return handlerError(res, 403, errorsConstants.unauthorized);
    }
    const { code } = req.params
    if(!code){
      return handlerError(res, 403, errorsConstants.inputRequired);
    }
    const foundCareer = await careerService.findByCode(code);
    if(!foundCareer){
      return handlerError(res, 403, errorsConstants.careerNotExist);
    }
    return res.status(200).send(foundCareer);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
}
