const SubjectService = require("../services/SubjectService");
const handlerError = require("../utils/handlerError");

const subjectService = new SubjectService();

const createSubject = async (req, res) => {
  try {
    const { name, careerCode } = req.body;
    if (!name || !careerCode) {
      return handlerError(res, "Name and career code are required", 400);
    }

    const subject = await subjectService.createSubject(name, careerCode);
    if (!subject) return handlerError(res, "Subject already exists", 409);

    res.status(201).json({ message: "Subject created successfully", subject });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllSubjects = async (req, res) => {
  try {
    const subjects = await subjectService.getAllSubjects();
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createSubject, getAllSubjects };
