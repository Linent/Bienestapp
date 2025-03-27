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
   // Verificar token (si es inválido, lanza error en lugar de devolver null)
   verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.secretKey);
      return { success: true, payload: decoded };
    } catch (error) {
      throw new Error("Token inválido o expirado");
    }
  }

  // Verificar y decodificar token
  decodeToken(req, res) {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");
      if (!token) {
        return handlerError(res, 401, errorsConstants.haventToken);
      }
    return this.verifyToken(token);
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  }
}

module.exports = JwtService;
