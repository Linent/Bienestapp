const { handlerError } = require("../handlers/errors.handlers");
const errorsConstants = require("../constants/errors.constant");

const UserService = require("../services/userService");

class AuthController {
  async register(req, res) {
    try {
      const { name, email, password, role } = req.body;
      const userService = new UserService();
      if(!name|| !email|| password){
        return handlerError(res, 404, errorsConstants.inputRequired);
      }
      const user = await userService.registerUser(name, email, password, role);
      res.status(201).send(user);
    } catch (error) {
        return handlerError(res, 500, errorsConstants.serverError);
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const userService = new UserService();
      const { user, token } = await userService.loginUser(email, password);
      res.status(200).send(user, token);
    } catch (error) {
        return handlerError(res, 500, errorsConstants.serverError);
    }
  } 
}

module.exports = AuthController;
