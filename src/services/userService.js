const User = require("../models/User");
const bcrypt = require("bcryptjs");
const JwtService = require("./jwt");
const { handlerError } = require("../handlers/errors.handlers");

class UserService {
  async registerUser(name, email, password, role) {
    try {
      const existingUser = await User.findOne({ email });
      if (!name || !email || !password || !role) {
        throw new Error("Todos los campos (name, email, password, role) son obligatorios.");
      }

      if (existingUser) {
        throw new Error("El usuario ya está registrado"); // ✅ Lanza error si ya existe
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ name, email, password: hashedPassword, role });
      const registerNewUser = await newUser.save();
      return registerNewUser;
    } catch (error) {
        throw error;
    }
  }

  async loginUser(email, password) {
    try {
        // Validar que los campos requeridos no estén vacíos
        if (!email || !password) {
            throw new Error("El email y la contraseña son obligatorios.");
        }

        // Buscar usuario por email
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error("Usuario no encontrado.");
        }

        // Comparar contraseñas
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error("Contraseña incorrecta.");
        }

        // Generar token JWT
        const jwtService = new JwtService();
        const token = jwtService.generateToken({ id: user._id, role: user.role });

        return { user, token }; // ✅ Retorna el usuario y el token
    } catch (error) {
        console.error("Error en loginUser:", error.message);
        throw error; // ✅ Se lanza el error para que el controlador lo maneje
    }
}
}

module.exports = UserService;
