const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const { handlerError } = require("../handlers/errors.handlers");
const errorsConstants = require("../constants/errors.constant");

class JwtService {
  constructor() {
    this.secretKey = process.env.SECRET_KEY || "clave_secreta";
  }
  generateFeedbackToken(scheduleId) {
  return jwt.sign(
    { scheduleId }, // payload
    this.secretKey,     // tu secret (asegúrate de tenerlo en .env/config)
    { expiresIn: "3h" } // Expira en 1 hora
  );
}
  // Generar token
  generateToken(payload, expiresIn = "3h") {
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
