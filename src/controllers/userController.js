const User = require("../models/User");
const userService = require("../services/userService");
const { handlerError } = require("../handlers/errors.handlers");
const { errorsConstants } = require("../constants/errors.constant");
const JwtService = require("../services/jwt");


// Registro de usuario
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, career, codigo } = req.body;
    if (!name || !email || !password || !role || !codigo) {
      return handlerError(res, 400, errorsConstants.inputRequired);
    }

    const userCreated = await userService.registerUser(
      name, email, password, role, career, codigo
    );

    return res.status(201).send(userCreated);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Inicio de sesión
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    (email, password);
    if (!email || !password) return handlerError(res, 400, errorsConstants.inputRequired);

    const userData = await userService.loginUser(email, password);

    if (!userData) return handlerError(res, 401, errorsConstants.unauthorized);
    
    res.status(200).send(userData);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Obtener todos los usuarios (solo admin puede hacerlo)
exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    const users = await userService.getAllUsers();
    res.status(200).send(users);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Obtener un usuario por ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedUser = req.user;

    // Permisos: estudiantes solo ven su perfil, otros roles pueden ver cualquier usuario
    if (loggedUser.role === "student" && loggedUser.id.toString() !== userId) {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    const user = await userService.getUserById(userId);
    if (!user) return handlerError(res, 404, errorsConstants.userNotFound);

    res.status(200).send(user);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Actualizar usuario (solo el propio usuario o admin puede hacerlo)
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedUser = req.user;
    const body = req.body;
    
  
    if (loggedUser.role === "student" && loggedUser.id.toString() !== userId) {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    const updatedUser = await userService.updateUser(userId, body);
    if (!updatedUser) return handlerError(res, 404, errorsConstants.userNotFound);

    res.status(200).json(updatedUser);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Habilitar o deshabilitar usuario (solo admin puede hacerlo)
exports.disableUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { enable } = req.body;

    if (req.user.role !== "admin") {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    const updatedUser = await userService.disableUser(userId, enable);
    if (!updatedUser) return handlerError(res, 404, errorsConstants.userNotFound);

    return res.status(200).send({ success: true, message: `Usuario ${enable ? "habilitado" : "deshabilitado"} correctamente.` });
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

exports.forgotPassword = async (req, res) => {
  try {
      const { email } = req.body;

      if (!email) { 
        return handlerError(res, 400, errorsConstants.inputRequired);
      }

      const response = await userService.forgotPassword(email);
      return res.status(200).send(response);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

exports.recoveryPassword = async (req, res) => {
  try {
    const { token } = req.params;

    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).send(errorsConstants.shortPassword);
    }

    const jwtService = new JwtService();
    const decodedToken = jwtService.verifyToken(token); // Decodificar el token

    if (!decodedToken || !decodedToken.payload.id) {
      return res.status(401).send(errorsConstants.expiredToken);
    }
    const userId = decodedToken.payload.id

    const response = await userService.recoveryPassword(userId, password);
    return res.status(200).send(response);
    
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};