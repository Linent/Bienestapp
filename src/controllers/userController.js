const User = require("../models/User");
const userService = require("../services/userService");
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
    const userSucces = await userService.registerUser(
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
    if (!email || !password)
      return handlerError(res, 400, errorsConstants.inputRequired);
    const userData = await userService.loginUser(email, password);

    if (!userData) return handlerError(res, 401, errorsConstants.unauthorized);

    res.status(200).send(userData);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).send(users);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return handlerError(res, 400, errorsConstants.userNotFound);
    res.send(user);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const body = req.body;
    const updatedUser = await userService.updateUser(userId, body);
    if (!updatedUser)
      return res.status(404).send({ message: "User not found" });
    res.json(updatedUser);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

exports.disableUser = async (req, res) => {
  try {
    const userId = req.params;
    const disabledUser = await userService.disableUser(userId);
    if (!disabledUser)
      return handlerError(res, 404, errorsConstants.userNotFound);
    return res.status(200).send({ succes: true });
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

exports.sendWelcomeEmail = async (req, res) => {
  try {
    const { userId } = req.body;
  
    const result = await userService.sendWelcomeEmail(userId);
    return res.status(200).send(result);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};
exports.sendPruebas = async () => {
  try {
    console.log("mpl mierdaaaaa");
    const pruebaExitosa = await userService.sendPruebas();
    return res.status(200).send({ pruebaExitosa });
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};
