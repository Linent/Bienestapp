const Career = require("../models/Career");
const { handlerError } = require("../handlers/errors.handlers");

exports.createCareer = async (name, code) => {
  try {
    const newCareer = new Career({ name, code });
    await newCareer.save();

    return newCareer;
  } catch (error) {
    throw handlerError("Error in createCareer: " + error.message);
  }
};

exports.getAllCareers = async () => {
  try {
    return await Career.find();
  } catch (error) {
    throw handlerError("Error fetching careers: " + error.message);
  }
};
