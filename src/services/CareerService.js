const Career = require("../models/Career");
const { handlerError } = require("../handlers/errors.handlers");

exports.createCareer = async (name, code, enable = true ) => {
  try {
    const duplicate = await Career.find({ code, name }); 

    if (duplicate.length > 0) {
      return null
    }

    const newCareer = new Career({ name, code, enable});
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

exports.getCareerById = async (id) => {
  try {
    const career = await Career.findById(id);
    if (!career) {
      return { success: false, status: 404, message: "Carrera no encontrada" };
    }
    // SIEMPRE retorna { success, status, data }
    return { success: true, status: 200, data: career };
  } catch (error) {
    return { success: false, status: 500, message: "Error al obtener la carrera" };
  }
};

 exports.updateCareer = async (id, data) => {
  try {
    const career = await Career.findByIdAndUpdate(id, data, { new: true });
    if (!career) {
      return { success: false, status: 404, message: "Carrera no encontrada" };
    }
    return { success: true, status: 200, data: career };
  } catch (error) {
    return { success: false, status: 500, message: "Error al actualizar la carrera" };
  }
}

exports.enableCareer = async (id, enable) => {
  try {
    const career = await Career.findByIdAndUpdate(
      id,
      { enable },
      { new: true }
    );
    if (!career) {
      return { success: false, status: 404, message: "Carrera no encontrada" };
    }
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      message: "Error al cambiar el estado de la carrera",
    };
  }
};
exports.findByCode = async (code) => {
  const career = await Career.findOne({ code });
  return career;
};
exports.findByCodes = async (codes) => {
  return Career.find({ code: { $in: codes } });
};