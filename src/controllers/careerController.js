const CareerService = require("../services/CareerService");
const handlerError = require("../utils/handlerError");

const careerService = new CareerService();

const createCareer = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return handlerError(res, "Name and code are required", 400);

    const career = await careerService.createCareer(name, code);
    if (!career) return handlerError(res, "Career already exists", 409);

    res.status(201).json({ message: "Career created successfully", career });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllCareers = async (req, res) => {
  try {
    const careers = await careerService.getAllCareers();
    res.status(200).json(careers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCareer, getAllCareers: getAllCareers };
