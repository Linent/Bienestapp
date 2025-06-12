const cloudinary = require('../config/cloudinary');
const { handlerError } = require('../handlers/errors.handlers');
const { errorsConstants } = require('../constants/errors.constant');
const UploadFile = require('../helpers/uploadFile');

exports.uploadFile = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).send({ message: "Archivo no encontrado" });
    }

    const uploader = new UploadFile(req.files.file, "topics", ["pdf", "jpg", "png", "jpeg"], "user123");
    const result = await uploader.uploadToCloudinary();

    return res.status(200).send({
      message: "Subida exitosa",
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Error al subir a Cloudinary:", error);
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

exports.deleteFileCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error al eliminar archivo de Cloudinary:", error);
    throw new Error("Error al eliminar archivo de Cloudinary");
  }
};