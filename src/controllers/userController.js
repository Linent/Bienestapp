const UserService = require("../services/userService");
const handlerError = require("../utils/handlerError");
const { validationResult } = require("express-validator");

const userService = new UserService();

const registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, career, code } = req.body;
    const user = await userService.registerUser(name, email, password, role, career, code);
    if (!user) return handlerError(res, "User already exists", 409);

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await userService.loginUser(email, password);
    
    if (!userData) return handlerError(res, "Invalid credentials", 401);

    res.status(200).json(userData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser };
