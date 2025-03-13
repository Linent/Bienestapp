const Career = require("../models/Career");
const { handlerError } = require("../handlers/errors.handlers");

class CareerService {
  async createCareer(name, code) {
    try {
      if (!name || !code) {
        throw new Error("Name and code are required.");
      }

      const existingCareer = await Career.findOne({ code });
      if (existingCareer) {
        throw new Error("Career code already exists.");
      }

      const newCareer = new Career({ name, code });
      await newCareer.save();

      return newCareer;
    } catch (error) {
      throw handlerError("Error in createCareer: " + error.message);
    }
  }

  async getAllCareers() {
    try {
      return await Career.find();
    } catch (error) {
      throw handlerError("Error fetching careers: " + error.message);
    }
  }
}

module.exports = CareerService;