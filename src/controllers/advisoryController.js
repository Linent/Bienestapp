const AdvisoryService = require("../services/AdvisoryService");
const handlerError = require("../utils/handlerError");

const advisoryService = new AdvisoryService();

const createAdvisory = async (req, res) => {
  try {
    const { studentCode, academicFriendCode, subjectCode, date, status, topic } = req.body;

    if (!studentCode || !academicFriendCode || !subject) {
      return handlerError(res, "All fields are required", 400);
    }

    const advisory = await advisoryService.createAdvisory(studentCode, academicFriendCode, subjectCode, date, status, topic);
    res.status(201).json({ message: "Advisory created successfully", advisory });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createAdvisory };
