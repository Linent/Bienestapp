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

  async getAdvisoryReport  (filterType)  {

    let groupBy;
    if (filterType === "day") {
      groupBy = {
        year: { $year: "$dateStart" },
        month: { $month: "$dateStart" },
        day: { $dayOfMonth: "$dateStart" }
      };
    } else if (filterType === "week") {
      groupBy = {
        year: { $year: "$dateStart" },
        week: { $week: "$dateStart" } // Agrupar por semana del año
      };
    } else if (filterType === "month") {
      groupBy = {
        year: { $year: "$dateStart" },
        month: { $month: "$dateStart" }
      };
    } else if (filterType === "year") {
      groupBy = {
        year: { $year: "$dateStart" }
      };
    } else {
      return res.status(400).json({ message: "Filtro no válido. Usa 'day', 'week', 'month' o 'year'." });
    }

    const report = await Advisory.aggregate([
      { $group: { _id: groupBy, totalAdvisories: { $sum: 1 } } },
      { $sort: { "_id.year": -1, "_id.month": -1, "_id.week": -1, "_id.day": -1 } } // Ordena por fecha descendente
    ]);
    
    console.log(report)
    return report;
  };
  
  async getTopCareers  () {
    return await Advisory.aggregate([
      {
        $group: {
          _id: "$careerId",
          totalAdvisories: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "careers",  // La colección de carreras
          localField: "_id",
          foreignField: "_id",
          as: "career"
        }
      },
      {
        $unwind: "$career"
      },
      {
        $project: {
          _id: 0,
          career: "$career.name",
          totalAdvisories: 1
        }
      },
      { $sort: { totalAdvisories: -1 } },
      { $limit: 5 }
    ]);
  };
}

module.exports = new AdvisoryService();
