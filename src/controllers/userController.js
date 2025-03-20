const User = require("../models/User");
const { loginUser, registerUser } = require("../services/userService");
const { handlerError } = require("../handlers/errors.handlers");
const { errorsConstants } = require("../constants/errors.constant");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, career, codigo } = req.body;

    if (!name || !email || !password || !role || !codigo) {
      return handlerError(res, 404, errorsConstants.inputRequired);
    }
    const userExist = await User.findOne({ email });
    if (userExist) {
      return handlerError(res, 401, errorsConstants.userExist);
    }
    const userSucces = await registerUser(
      name,
      email,
      password,
      role,
      career,
      codigo
    );
    return res.status(201).send(userSucces);
  } catch (error) {
    console.log(error);
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if(!email|| !password) return handlerError(res,400,errorsConstants.inputRequired);
    const userData = await loginUser(email, password);

    if (!userData) return handlerError(res, 401, errorsConstants.unauthorized);

    res.status(200).send(userData);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

