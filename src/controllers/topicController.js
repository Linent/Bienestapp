const topicService = require("../services/topicService");
const { handlerError } = require("../handlers/errors.handlers");
const { errorsConstants } = require("../constants/errors.constant");
const UploadFile = require("../helpers/uploadFile");
const isAdmin = (role) => role === "admin";
const cloudinary = require("../config/cloudinary"); // ajusta el path
const streamifier = require("streamifier");
const { uploader } = require("cloudinary").v2;
const createTopic = async (req, res) => {
  if (!isAdmin(req.user.role)) {
    return handlerError(res, 403, errorsConstants.unauthorized);
  }

  try {
    const { name, description } = req.body;
    let { keywords } = req.body;

    // Parsear keywords si vienen como string
    if (typeof keywords === "string") {
      try {
        keywords = JSON.parse(keywords);
      } catch {
        keywords = keywords.split(",").map((k) => k.trim());
      }
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return handlerError(
        res,
        400,
        "Las palabras clave deben ser un arreglo no vacío."
      );
    }

    const file = req.files?.file;
    if (!file) {
      return handlerError(res, 400, "No se ha proporcionado un archivo.");
    }

    const allowedExts = ["pdf", "jpg", "jpeg", "png"];
    const fileExt = file.name.split(".").pop().toLowerCase();

    if (!allowedExts.includes(fileExt)) {
      return handlerError(res, 400, "Extensión de archivo no permitida.");
    }

    // Subida a Cloudinary
    const streamUpload = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "topics",
            resource_type: "auto", // permite imágenes y PDFs
            access_mode: "public", // 👈 asegúrate de esto (opcional si el default es "public")
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(file.data).pipe(stream);
      });

    const result = await streamUpload();

    const topic = await topicService.createTopic({
      name,
      description,
      filePath: result.secure_url,
      keywords,
      publicId: result.public_id,
    });

    return res.status(201).send(topic);
  } catch (error) {
    console.error("Error en createTopic:", error);
    return handlerError(res, 500, errorsConstants.serverError);
  }
};
const getTopics = async (req, res) => {
  try {
    const topics = await topicService.getAllTopics({ delete: false });
    res.status(200).send(topics);
  } catch (error) {
    console.error("Error en getTopics:", error);
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

const getTopicsByKeyword = async (req, res) => {
  try {
    const keyword = req.query.q?.trim();
    if (!keyword) {
      return handlerError(res, 400, "Debe proporcionar una palabra clave.");
    }

    const topics = await topicService.getTopicsByKeyword(keyword);
    if (topics.length === 0) {
      return handlerError(res, 404, errorsConstants.notFound);
    }

    res.status(200).send(topics);
  } catch (error) {
    console.error("Error en getTopicsByKeyword:", error);
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

const getTopicById = async (req, res) => {
  try {
    const { topicId } = req.params;
    const topic = await topicService.getTopicById(topicId);
    if (!topic || topic.delete) {
      return handlerError(res, 404, errorsConstants.notFound);
    }

    res.status(200).send(topic);
  } catch (error) {
    console.error("Error en getTopicById:", error);
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

const updateTopic = async (req, res) => {
  if (!isAdmin(req.user.role)) {
    return handlerError(res, 403, errorsConstants.unauthorized);
  }

  try {
    const { topicId } = req.params;
    const { name, description } = req.body;
    let { keywords } = req.body;
    const updateData = {};

    // Buscar el topic existente
    const topic = await topicService.getTopicById(topicId);
    if (!topic || topic.delete) {
      return handlerError(res, 404, errorsConstants.notFound);
    }

    // Actualizar campos básicos
    if (name) updateData.name = name;
    if (description) updateData.description = description;

    // Parseo de palabras clave
    if (keywords) {
      if (typeof keywords === "string") {
        try {
          keywords = JSON.parse(keywords);
        } catch {
          keywords = keywords.split(",").map((k) => k.trim());
        }
      }

      if (!Array.isArray(keywords)) {
        return handlerError(res, 400, "Las palabras clave deben ser un arreglo.");
      }
      updateData.keywords = keywords;
    }

    // Manejo de archivo
    const file = req.files?.file;
    if (file) {
      const allowedExts = ["pdf", "jpg", "jpeg", "png"];
      const fileExt = file.name.split(".").pop().toLowerCase();

      if (!allowedExts.includes(fileExt)) {
        return handlerError(res, 400, "Extensión de archivo no permitida.");
      }

      // Eliminar archivo anterior en Cloudinary si existe
      if (topic.publicId) {
        // Detectar el tipo de recurso a eliminar
        let oldExt = "pdf";
        let resourceType = "image";
        if (topic.filePath) {
          oldExt = topic.filePath.split(".").pop().toLowerCase();
          if (["jpg", "jpeg", "png"].includes(oldExt)) resourceType = "image";
        }
        try {
          const destroyResult = await cloudinary.uploader.destroy(topic.publicId, {
            resource_type: resourceType,
          });
          console.log("Resultado al eliminar en Cloudinary:", destroyResult);
        } catch (err) {
          console.warn("No se pudo eliminar el archivo anterior de Cloudinary:", err);
        }
      }

      // Subir nuevo archivo (siempre en el folder "topics")
      const streamUpload = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "topics", resource_type: fileExt === "pdf" ? "image" : "image" },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(file.data).pipe(stream);
        });

      const result = await streamUpload();
      updateData.filePath = result.secure_url;
      updateData.publicId = result.public_id;
    }

    const updatedTopic = await topicService.updateTopic(topicId, updateData);

    return res.status(200).send(updatedTopic);
  } catch (error) {
    console.error("Error en updateTopic:", error);
    return handlerError(res, 500, errorsConstants.serverError);
  }
};


const deleteTopic = async (req, res) => {
  if (!isAdmin(req.user.role)) {
    return handlerError(res, 403, errorsConstants.unauthorized);
  }

  try {
    const { topicId } = req.params;

    // 1. Obtener el tópico antes de borrarlo
    const topic = await topicService.getTopicById(topicId);
    if (!topic || topic.delete) {
      return handlerError(res, 404, errorsConstants.notFound);
    }

    // 2. Eliminar el archivo en Cloudinary si tiene publicId
    if (topic.publicId) {
      await uploader.destroy(topic.publicId);
    }

    // 3. Marcar como eliminado o eliminar el documento
    const deletedTopic = await topicService.deleteTopic(topicId);
    if (!deletedTopic) {
      return handlerError(res, 404, errorsConstants.notFound);
    }

    return res
      .status(200)
      .send({ message: "Tema y archivo eliminados correctamente." });
  } catch (error) {
    console.error("Error en deleteTopic:", error);
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

module.exports = {
  createTopic,
  getTopics,
  getTopicById,
  updateTopic,
  deleteTopic,
  getTopicsByKeyword,
};
