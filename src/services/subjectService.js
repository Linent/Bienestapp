const Subject = require("../models/Subject");
const { handlerError } = require("../handlers/errors.handlers");

exports.createSubject = async (name, careerCode) => {
  try {
    const existingSubject = await Subject.findOne({ name, career: careerCode });
    if (existingSubject) {
      throw new Error(
        "Subject with this name already exists for the given career."
      );
    }
    
    const newSubject = new Subject({ name, career: careerCode });
    await newSubject.save();

    return newSubject;
  } catch (error) {
    throw handlerError("Error in createSubject: " + error.message);
  }
};

/* exports.getAllSubjects = async () => {
  try {
    return await Subject.find().populate("career");
  } catch (error) {
    throw handlerError("Error fetching subjects: " + error.message);
  }
}; */


   exports.getSubjects = async () => {
    try {
      return await Subject.find().populate("career", "name");
    } catch (error) {
      throw new Error("Error obteniendo materias: " + error.message);
    }
  }

  exports.getSubjectBy_Id = async (subjectId) => {
    try {
      return await Subject.findById(subjectId).populate("career", "name");
    } catch (error) {
      throw new Error("Materia no encontrada");
    }
  }

  exports.updateSubject = async (subjectId, name, careerId) => {
    try {
      return await Subject.findByIdAndUpdate(subjectId, { name, career: careerId }, { new: true });
    } catch (error) {
      throw new Error("Error actualizando la materia: " + error.message);
    }
  }

   exports.deleteSubject= async (subjectId) => {
    try {
      return await Subject.findByIdAndDelete(subjectId);
    } catch (error) {
      throw new Error("Error eliminando la materia: " + error.message);
    }
  }



