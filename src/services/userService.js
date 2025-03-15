const User = require("../models/User");
const bcrypt = require("bcryptjs");
const JwtService = require("./jwt");
const { handlerError } = require("../handlers/errors.handlers");

exports.registerUser = async (name, email, password, role, career, codigo) => {
  try{const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("El usuario ya está registrado.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    role,
    career,
    codigo,
  });
  const createUser = await newUser.save();

  return createUser;
} catch(error){
  console.log(error);
}
};

exports.loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Usuario no encontrado.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Contraseña incorrecta.");
  }

  const jwtService = new JwtService();
  const token = jwtService.generateToken({ id: user._id, role: user.role });

  return { user, token };
};
