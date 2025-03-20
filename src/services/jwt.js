const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const { handlerError } = require("../handlers/errors.handlers");
const errorsConstants = require("../constants/errors.constant");

class JwtService {
  constructor() {
    this.secretKey = process.env.SECRET_KEY || "clave_secreta";
  }

  // Generar token
  generateToken(payload, expiresIn = "2h") {
    return jwt.sign(payload, this.secretKey, { expiresIn });
  }

  // Verificar y decodificar token
  decodeToken(req, res) {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return handlerError(res, 401, errorsConstants.haventToken);
    }

    try {
      const decoded = jwt.verify(token, this.secretKey);
      return { success: true, payload: decoded };
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  }
}

module.exports = JwtService;
