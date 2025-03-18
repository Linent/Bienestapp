const Advisory = require("../models/Advisory");
const { handlerError } = require("../handlers/errors.handlers");
const { deleteAdvisory } = require("../controllers/advisoryController");

class AdvisoryService {
  async createAdvisory(advisorId, careerId, dateStart, dateEnd, status) {
    try {
      const newAdvisory = new Advisory({
        advisorId,
        careerId,
        dateStart,
        dateEnd,
        status,
      });
      const registerAdvisory = await newAdvisory.save();
      return registerAdvisory;
    } catch (error) {
      throw handlerError("Error in createAdvisory: " + error.message);
    }
  }
  async getAllAdvisory() {
    try {
      console.log("llega acá");
      const advisories = await Advisory.find()
        .populate({ path: "advisorId", select: "name role" })
        .populate({ path: "careerId", select: "name" });

      return advisories;
    } catch (error) {
      throw handlerError("Error in get all advisory: " + error.message);
    }
  }
  async getAdvisoryById(advisoryId) {
    try {
      const advisory = await Advisory.findById(advisoryId).populate(
        "advisorId careerId"
      );
      return advisory;
    } catch (error) {
      throw handlerError("Error al obtener la asesoría: " + error.message);
    }
  }
  async updateAdvisory(advisoryId, body) {
    try {
      const advisoryUpdate = await Advisory.findByIdAndUpdate(
        advisoryId,
        { $set: body },
        {
          new: true,
        }
      );
      return advisoryUpdate;
    } catch (error) {
      throw handlerError("Error al actualizar la asesoría: " + error.message);
    }
  }
  async deleteAdvisory(advisoryId) {
    try {
      const advisory = await Advisory.findByIdAndDelete(advisoryId);
      return advisory;
    } catch (error) {
      throw handlerError("Error al eliminar la asesoría: " + error.message);
    }
  }

  // Obtener una asesoría por ID
}

module.exports = new AdvisoryService();
