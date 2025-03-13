const Subject = require("../models/Subject");
const { handlerError } = require("../handlers/errors.handlers");

class SubjectService {
  async createSubject(name, careerCode) {
    try {
      if (!name || !careerCode) {
        throw new Error("Name and career code are required.");
      }

      const existingSubject = await Subject.findOne({ name, career: careerCode });
      if (existingSubject) {
        throw new Error("Subject with this name already exists for the given career.");
      }

      const newSubject = new Subject({ name, career: careerCode });
      await newSubject.save();

      return newSubject;
    } catch (error) {
      throw handlerError("Error in createSubject: " + error.message);
    }
  }

  async getAllSubjects() {
    try {
      return await Subject.find().populate("career");
    } catch (error) {
      throw handlerError("Error fetching subjects: " + error.message);
    }
  }
}

module.exports = SubjectService;