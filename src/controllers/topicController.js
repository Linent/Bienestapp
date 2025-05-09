const topicService = require("../services/topicService");
const { handlerError } = require("../handlers/errors.handlers");
const { errorsConstants } = require("../constants/errors.constant");
const UploadFile = require("../helpers/uploadFile");
const isAdmin = (role) => role === "admin";
console.log("UploadFile helper cargado correctamente:", typeof UploadFile);

const createTopic = async (req, res) => {
  if (!isAdmin(req.user.role)) {
    return handlerError(res, 403, errorsConstants.unauthorized);
  }

  try {
    const { name, description } = req.body;
    let { keywords } = req.body;

    // Parsear keywords si viene como string
    if (typeof keywords === "string") {
      try {
        keywords = JSON.parse(keywords); // Si viene como JSON string
      } catch {
        keywords = keywords.split(",").map((k) => k.trim());
      }
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return handlerError(res, 400, "Las palabras clave deben ser un arreglo no vacío.");
    }

    const file = req.files?.file;
    if (!file) {
      return handlerError(res, 400, "No se ha proporcionado un archivo.");
    }

    const upload = new UploadFile(file, "topics", ["pdf"], req.user.id);

    if (!upload.validExt()) {
      return handlerError(res, 400, "Extensión de archivo no permitida.");
    }

    upload.saveFile(async (err) => {
      if (err) {
        console.error("Error al guardar archivo:", err);
        return handlerError(res, 500, errorsConstants.serverError);
      }

      const filePath = `uploads/topics/${upload.getName()}`;

      const topic = await topicService.createTopic({
        name,
        description,
        filePath,
        keywords,
      });

      return res.status(201).send(topic);
    });
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

    if (name) updateData.name = name;
    if (description) updateData.description = description;

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

    const file = req.files?.file;
    if (file) {
      const upload = new UploadFile(file, "topics", ["pdf"], req.user.id);
      if (!upload.validExt()) {
        return handlerError(res, 400, "Extensión de archivo no permitida.");
      }

      upload.saveFile(async (err) => {
        if (err) {
          return handlerError(res, 500, "Error al guardar el archivo.");
        }

        updateData.filePath = `uploads/topics/${upload.getName()}`;
        const updated = await topicService.updateTopic(topicId, updateData);
        if (!updated) {
          return handlerError(res, 404, errorsConstants.notFound);
        }

        res.status(200).send(updated);
      });
    } else {
      const updated = await topicService.updateTopic(topicId, updateData);
      if (!updated) {
        return handlerError(res, 404, errorsConstants.notFound);
      }

      res.status(200).send(updated);
    }
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
    const topic = await topicService.deleteTopic(topicId);
    if (!topic) {
      return handlerError(res, 404, errorsConstants.notFound);
    }

    res.status(200).send({ message: "Tema eliminado correctamente." });
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
  getTopicsByKeyword
};