const {createCareer, getAllCareers} = require("../services/CareerService");
const { handlerError } = require("../handlers/errors.handlers");
const errorsConstants = require("../constants/errors.constant");

exports.createCareer = async (req, res) => {
  try {
    const { name, code } = req.body;
    
    if (!name || !code) { 
      return  handlerError(res, 404, errorsConstants.inputRequired);
    }
    const career = await createCareer(name, code);
    if (!career) return handlerError(res, 409, errorsConstants.careerExist);

    return res.status(201).send(career);
  } catch (error) {
    console.log(error);
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

exports.getAllCareers = async (req, res) => {
  try {
    const careers = await getAllCareers();
    res.status(200).json(careers);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

