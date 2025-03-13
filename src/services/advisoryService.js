const Advisory = require("../models/Advisory");
const { handlerError } = require("../handlers/errors.handlers");

class AdvisoryService {
  async createAdvisory(studentCode, academicFriendCode, subjectCode, date, status, topic) {
    try {
      if (!studentCode || !academicFriendCode || !subjectCode || !date || !topic) {
        throw new Error("All fields (studentCode, academicFriendCode, subjectCode, date, status, topic) are required.");
      }

      const newAdvisory = new Advisory({ studentCode, academicFriendCode, subjectCode, date, status, topic });
      await newAdvisory.save();

      return newAdvisory;
    } catch (error) {
      throw handlerError("Error in createAdvisory: " + error.message);
    }
  }

  async getAdvisoriesByFilter(filters) {
    try {
      const query = {};

      if (filters.date) query.date = filters.date;
      if (filters.studentCode) query.studentCode = filters.studentCode;
      if (filters.academicFriendCode) query.academicFriendCode = filters.academicFriendCode;
      if (filters.subjectCode) query.subjectCode = filters.subjectCode;

      return await Advisory.find(query).populate("studentCode").populate("academicFriendCode").populate("subjectCode");
    } catch (error) {
      throw handlerError(res, "Error fetching advisories: " + error.message);
    }
  }
}

module.exports = new AdvisoryService();
