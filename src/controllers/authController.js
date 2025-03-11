const UserService = require("../services/userService");

class AuthController {
  async register(req, res) {
    try {
      const { name, email, password, role } = req.body;
      const userService = new UserService();
      const user = await userService.registerUser(name, email, password, role);
      res.status(201).send(user);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const userService = new UserService();
      const { user, token } = await userService.loginUser(email, password);
      res.status(200).send(user, token);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
  } 
}

module.exports = AuthController;
