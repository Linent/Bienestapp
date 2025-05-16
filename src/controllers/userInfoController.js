const userInfoService = require("../services/userInfoService");
const { handlerError } = require("../handlers/errors.handlers");
const { errorsConstants } = require("../constants/errors.constant");
exports.registerUserInfo = async (req, res) => {
  try {
    const body = req.body
    const result = await userInfoService.registerUserInfo(body);
    return res.status(201).send(result);
  } catch (error) {
    console.error("Error in registerUserInfo:", error);
    return handlerError(res, 500, errorsConstants.serverError);
  }
};
exports.getUserInfoAll = async (req, res) => {
  try {
    const result = await userInfoService.getUserInfoAll();
    return res.status(200).send(result);
  } catch (error) {
    console.error("Error in registerUserInfo:", error);
    return handlerError(res, 500, errorsConstants.serverError);
  }
}