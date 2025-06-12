const User = require("../models/User");
const bcrypt = require("bcryptjs");
const JwtService = require("./jwt");
const welcomeTemplate = require("../emails/welcome_user");
const EmailService = require("../config/emailConfig");
const { errorsConstants } = require("../constants/errors.constant");
const Career = require("../models/Career");

exports.registerUser = async (name, email, password, role, career, codigo, dni) => {
  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { codigo }, { dni }, { delete: false}],
    });
    
    if (existingUser) {
      return errorsConstants.userExist;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      career,
      codigo,
      dni
    });
    const createUser = await newUser.save();
    if(newUser.role !=='studendt'){
      const userId = String(createUser._id);
      await exports.sendWelcomeEmail(userId);
    }

    return createUser;
  } catch (error) {
    throw new Error(error);
  }
};

exports.loginUser = async (email, password) => {
  const user = await User.findOne({ email }, { projection: { password: 0 } });

  if (!user || !user.enable) {
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return;
  }

  const jwtService = new JwtService();
  const token = jwtService.generateToken({ id: user._id, role: user.role });

  return { user, token };
};

exports.bulkRegisterUsers = async (rows) => {
  
  let created = 0;
  let skipped = 0;
  let errors = [];

  for (const row of rows) {
    const { Nombre, Correo, Código,dni } = row;

    if (!Nombre || !Correo || !Código) {
      skipped++;
      errors.push({ row, error: "Faltan campos obligatorios." });
      continue;
    }

    const codigo = String(Código);
    const careerPrefix = codigo.substring(0, 3); // extrae los 3 primeros caracteres

    const career = await Career.findOne({ code: careerPrefix }); // se asume que usas un campo 'code' en Career
    if (!career) {
      skipped++;
      errors.push({ row, error: `No se encontró carrera con código: ${careerPrefix}` });
      continue;
    }

    try {
      const result = await exports.registerUser(
        Nombre,
        Correo,
        codigo,
        "academic_friend",
        career._id,
        codigo,
        dni
      );

      if (typeof result !== "string") {
        created++;
      } else {
        skipped++;
        errors.push({ row, error: result });
      }
    } catch (err) {
      skipped++;
      errors.push({ row, error: err.message });
    }
  }

  return {
    success: true,
    created,
    skipped,
    errors,
  };
};

exports.getAllUsers = async () => {
  return await User.find({ delete: false })
    .populate({ path: "career", select: "name" })
    .select("-password");
};

exports.getUserById = async (id) => {
  return await User.findById(id).populate({ path: "career", select: "name" });
};
exports.deleteUser = async (id) => {
  const user = await User.findByIdAndUpdate(
    id,
    { delete: true },
    { new: true }
  );
  if (!user) {
    throw new Error(errorsConstants.userNotFound);
  }
  return user;
};
exports.updateUserFile = async (userId, updateData) => {
  return await User.findByIdAndUpdate(userId, updateData, { new: true });
};
exports.updateUser = async (id, data) => {
  // Si viene la contraseña, la codificamos
  if (data.password) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    data.password = hashedPassword;
  }
  return await User.findByIdAndUpdate(id, data, { new: true }).select(
    "-password"
  );
};

exports.disableUser = async (id, enable) => {
  return await User.findByIdAndUpdate(id, { enable }, { new: true });
};

exports.sendWelcomeEmail = async (userId) => {
  try {
    if (!userId) {
      throw new Error(errorsConstants.inputIdRequired);
    }
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    const subject = "Bienvenido a la Plataforma de Asesorías";
    const text = `Hola ${user.name}, bienvenido a nuestra plataforma.`;
    const html = welcomeTemplate(user);

    const Succesmail = await EmailService.sendEmail(
      user.email,
      subject,
      text,
      html
    );
    return { message: "Correo enviado" };
  } catch (error) {
    return { message: "error: " + error };
  }
};

exports.forgotPassword = async (email) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return { success: false, message: "Usuario no encontrado" };
    const jwtService = new JwtService();
    const hash = jwtService.generateToken({ id: user._id, role: user.role }); // Genera un token de recuperación
    await EmailService.forgotPassword(user, hash); // Envía el email

    return { success: true, message: "Correo de recuperación enviado" };
  } catch (error) {
    return { success: false, message: "Error al procesar la solicitud", error };
  }
};

exports.recoveryPassword = async (userId, newPassword) => {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true } // Retorna el usuario actualizado
    );

    if (!updatedUser) {
      throw new Error("Usuario no encontrado");
    }

    return { success: true, message: "Contraseña actualizada exitosamente" };
  } catch (error) {
    throw new Error(error.message || "Error al actualizar la contraseña");
  }
};

exports.getSchedulesByStudent = async (studentId) => {
  return await Schedule.find({ studentId }) // Filtra las asesorías del estudiante
    .populate("AdvisoryId") // Relación con la asesoría
    .populate({
      path: "AdvisoryId",
      populate: { path: "advisorId", select: "name email" }, // Info del asesor
    })
    .populate("studentId", "name email") // Info del estudiante
    .sort({ createdAt: -1 }); // Ordena por fecha de creación (más recientes primero)
};
exports.findByStudentCode = (codigo) => {
  return User.findOne({ codigo }).select("-password"); // Excluye la contraseña
};
exports.findByAdvisorCode = async (advisorCode) => {
  const advisor = await User.findById(advisorCode);

  return advisor;
};
