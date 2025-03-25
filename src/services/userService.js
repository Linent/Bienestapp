const User = require("../models/User");
const bcrypt = require("bcryptjs");
const JwtService = require("./jwt");
const welcomeTemplate   = require('../emails/welcome_user')
const EmailService = require("../config/emailConfig");
const { errorsConstants } = require("../constants/errors.constant");



exports.registerUser = async (name, email, password, role, career, codigo) => {
  try {
    const existingUser = await User.findOne({ email });
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
     const userId = String(createUser._id);
    const probando = await exports.sendWelcomeEmail(userId);
    console.log(probando);
    return createUser;
  } catch (error) {
    console.log(error);
  }
};

exports.loginUser = async (email, password) => {
  const user = await User.findOne({ email }, { projection: { password: 0 } });
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

exports.getAllUsers = async () => {
  return await User.find();
};

exports.getUserById = async (id) => {
  return await User.findById(id);
};

exports.updateUser = async (id, data) => {
  return await User.findByIdAndUpdate(id, data, { new: true });
};

exports.disableUser = async (id) => {
  return await User.findByIdAndUpdate(id, { enable: false }, { new: true });
};

exports.sendWelcomeEmail = async (userId) => {
try{
    if(!userId){
      throw new Error(errorsConstants.inputIdRequired);
    }
    const user = await User.findById(userId);
  if (!user) {
      throw new Error("Usuario no encontrado");
  }
  
  const subject = "Bienvenido a la Plataforma de Asesorías";
  const text = `Hola ${user.name}, bienvenido a nuestra plataforma.`;
  const html = welcomeTemplate(user)
 
  const Succesmail = await EmailService.sendEmail(user.email, subject, text, html);
  return { message: "Correo enviado" };
}catch(error){
  return { message: 'error: '+error };
}
};

exports.sendPruebas = async () => {
  try{
    console.log('llega acá');
  const pruebasSucces = await EmailService.pruebaEmail();
  return pruebasSucces 
}
  catch(error){
    console.log(error);
  }
}