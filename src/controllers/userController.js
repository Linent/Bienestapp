const userService = require("../services/userService");
const { handlerError } = require("../handlers/errors.handlers");
const { errorsConstants } = require("../constants/errors.constant");
const JwtService = require("../services/jwt");
const streamifier = require("streamifier");
const { uploader } = require("cloudinary").v2;
const cloudinary = require("../config/cloudinary");
const XLSX = require("xlsx");
// Registro de usuario
const register = async (req, res) => {
  try {
    const { name, email, password, role, career, codigo, dni } = req.body;
    if (!name || !email || !password || !role || !codigo) {
      return handlerError(res, 400, errorsConstants.inputRequired);
    }

    const userCreated = await userService.registerUser(
      name,
      email,
      password,
      role,
      career,
      codigo,
      dni
    );

    if (!userCreated || typeof userCreated === "string") {
      return handlerError(
        res,
        400,
        userCreated || errorsConstants.userNotCreate
      );
    }

    return res.status(201).send(userCreated);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Inicio de sesión
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    email, password;
    if (!email || !password)
      return handlerError(res, 400, errorsConstants.inputRequired);

    const userData = await userService.loginUser(email, password);

    if (!userData) return handlerError(res, 401, errorsConstants.unauthorized);

    res.status(200).send(userData);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

const importUsersFromFile = async (req, res) => {
  try {
   if (req.user.role !== "admin") {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }
    const file = req.files?.file;
    if (!file) {
      return handlerError(res, 400, "No se ha proporcionado ningún archivo.");
    }
    
    const allowedExts = ["xlsx", "xls", "csv"];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowedExts.includes(ext)) {
      return handlerError(res, 400, "Extensión no permitida.");
    }
    
    const workbook = XLSX.read(file.data, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const result = await userService.bulkRegisterUsers(rows);
    return res.status(200).send(result);
  } catch (error) {
    console.error("Error en importUsersFromFile:", error);
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Obtener todos los usuarios (solo admin puede hacerlo)
const getAllUsers = async (req, res) => {
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
const getUserById = async (req, res) => {
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

const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    const stream = uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(file.data).pipe(stream);
  });
};

const updateUserFiles = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userService.getUserById(userId);

    if (!user) {
      return handlerError(res, 404, errorsConstants.userNotFound);
    }

    const updateData = {};
    const allowedImageExts = ["jpg", "jpeg", "png", "webp"];
    const allowedResumeExts = ["pdf"];

    // 🧾 Subir hoja de vida
    if (req.files?.resume) {
      const resume = req.files.resume;
      const resumeExt = resume.name.split(".").pop().toLowerCase();

      if (!allowedResumeExts.includes(resumeExt)) {
        return handlerError(
          res,
          400,
          "La hoja de vida debe ser un archivo PDF."
        );
      }

      if (user.resumePublicId) {
        await uploader.destroy(user.resumePublicId, {
          resource_type: "raw", // 👈 para archivos PDF
        });
      }

      const uploadResume = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "resumes",
              resource_type: "auto", // permite imágenes y PDFs
              access_mode: "public",
              public_id: `resume_${userId}`,
            },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(resume.data).pipe(stream);
        });

      const resumeResult = await uploadResume();
      updateData.resume = resumeResult.secure_url;
      updateData.resumePublicId = resumeResult.public_id;
    }

    // 🖼 Subir imagen de perfil
    if (req.files?.image) {
      const image = req.files.image;
      const imageExt = image.name.split(".").pop().toLowerCase();

      if (!allowedImageExts.includes(imageExt)) {
        return handlerError(res, 400, "La imagen debe ser JPG o PNG.");
      }

      if (user.imagePublicId) {
        await uploader.destroy(user.imagePublicId, {
          resource_type: "image",
        });
      }

      const uploadImage = () =>
        new Promise((resolve, reject) => {
          const stream = uploader.upload_stream(
            {
              folder: "profile_images",
              resource_type: "image",
              access_mode: "public",
              public_id: `profile_${userId}`,
            },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(image.data).pipe(stream);
        });

      const imageResult = await uploadImage();
      updateData.profileImage = imageResult.secure_url;
      updateData.imagePublicId = imageResult.public_id;
    }

    const updatedUser = await userService.updateUserFile(userId, updateData);
    return res.status(200).send(updatedUser);
  } catch (error) {
    console.error("Error en updateUserFiles:", error);
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// Actualizar usuario (solo el propio usuario o admin puede hacerlo)
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedUser = req.user;
    const body = req.body;

    if (loggedUser.role === "student" && loggedUser.id.toString() !== userId) {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    const updatedUser = await userService.updateUser(userId, body);
    if (!updatedUser)
      return handlerError(res, 404, errorsConstants.userNotFound);

    res.status(200).send(updatedUser);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedUser = req.user;
    const { deleteStatus } = req.body;
    if (loggedUser.role !== "admin") {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    const deletedUser = await userService.deleteUser(userId, deleteStatus);
    if (!deletedUser)
      return handlerError(res, 404, errorsConstants.userNotFound);

    res
      .status(200)
      .send({ success: true, message: "Usuario eliminado correctamente." });
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};
// Habilitar o deshabilitar usuario (solo admin puede hacerlo)
const disableUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { enable } = req.body;

    if (req.user.role !== "admin") {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    const updatedUser = await userService.disableUser(userId, enable);
    if (!updatedUser)
      return handlerError(res, 404, errorsConstants.userNotFound);

    return res
      .status(200)
      .send({
        success: true,
        message: `Usuario ${
          enable ? "habilitado" : "deshabilitado"
        } correctamente.`,
      });
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

const sendWelcomeEmail = async (req, res) => {
  try {
    const { userId } = req.body;

    const result = await userService.sendWelcomeEmail(userId);
    return res.status(200).send(result);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

const forgotPassword = async (req, res) => {
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

const recoveryPassword = async (req, res) => {
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
    const userId = decodedToken.payload.id;

    const response = await userService.recoveryPassword(userId, password);
    return res.status(200).send(response);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

module.exports = {
  register,
  login,
  getAllUsers,
  getUserById,
  updateUser,
  disableUser,
  sendWelcomeEmail,
  forgotPassword,
  recoveryPassword,
  deleteUser,
  updateUserFiles,
  uploadToCloudinary,
  importUsersFromFile
};
