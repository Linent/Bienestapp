const SubjectService = require("../services/subjectService");
const { handlerError } = require("../handlers/errors.handlers");
const { errorsConstants } = require("../constants/errors.constant");
const subjectController = require("../services/subjectService");

const create = async (req, res) => {
  try {
    const { name, careerCode } = req.body;
    if (!name || !careerCode) {
      return handlerError(res, 400, errorsConstants.inputRequired);
    }
    const subject = await subjectController.createSubject(name, careerCode);
    if (!subject) return handlerError(res, 409, errorsConstants.userNotCreate);

    return res.status(201).send(subject);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

const getSubjects = async (req, res) => {
  try {
    const subjects = await subjectController.getSubjects();
    return res.status(200).send(subjects);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

//

const getSubjectById = async (req, res) => {
  try {
    const subjectId = req.params.id;
    const subject = await subjectController.getSubjectBy_Id(subjectId);
    if (!subject) {
      return handlerError(res, 400, errorsConstants.subjectNotExist);
    }
    res.status(200).send(subject);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

const update = async (req, res) => {
  try {
    const { name, career } = req.body;
    const subjectId = req.params.id;
    const subject = await subjectController.updateSubject(
      subjectId,
      name,
      career
    );
    if (!subject) {
      return handlerError(res, 400, errorsConstants.subjectNotUpdate);
    }
    res.status(200).send(subject);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

const deleteSub = async (req, res) => {
  try {
    const subjectId = req.params.id;
    const subject = await subjectController.deleteSubject(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Materia no encontrada" });
    }
    res.status(200).send({ succes: true });
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

module.exports = {
  create,
  getSubjects,
  getSubjectById,
  update,
  deleteSub,
};
