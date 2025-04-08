const Advisory = require("../models/Advisory");
const { handlerError } = require("../handlers/errors.handlers");
const { errorsConstants } = require("../constants/errors.constant");
const moment = require("moment");
const userService = require("./userService");

class AdvisoryService {
  async createAdvisory(
    advisorId,
    careerId,
    dateStart,
    dateEnd,
    status 
  ) {
      const advisor = await userService.getUserById(advisorId);
      if (!advisor || advisor.role !== "academic_friend") {
          throw new Error(errorsConstants.unauthorized);
      }
  
      const Day = moment(dateStart).locale('es').format('dddd');
      // Calcular duración en horas de la asesoría
      const start = new Date(dateStart);
      const end = new Date(dateEnd);
      const durationHours = (end - start) / (1000 * 60 * 60); // Convertir ms a horas
  
      // Si al sumar las horas supera 20, no se permite
      if (advisor.availableHours + durationHours > 20) {
          throw new Error("El asesor no puede exceder las 20 horas disponibles.");
      }
  
      // Crear la asesoría con el estado definido
      const newAdvisory = new Advisory({
          advisorId,
          careerId,
          dateStart,
          dateEnd,
          day: Day,
          status,
      });
      
      // Sumar las horas de la asesoría a las horas disponibles del asesor
      const horasAcumuladas = advisor.availableHours + durationHours;
      await userService.updateUser(advisorId, { availableHours: horasAcumuladas });
  
      const advisoryCreate = await newAdvisory.save();
        
      return advisoryCreate;
  
  
  }
  async getAllAdvisory() {
    try {
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

  // Reporte de los últimos 7 días
  async getReportLast7Days() {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const report = await Advisory.aggregate([
      { $match: { dateStart: { $gte: last7Days } } },
      {
        $group: {
          _id: {
            year: { $year: "$dateStart" },
            day: { $dayOfMonth: "$dateStart" },
            month: { $month: "$dateStart" },
          },
          totalAdvisories: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    return report;
  }

  // Reporte de los últimos 30 días
  async getReportLast30Days() {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const report = await Advisory.aggregate([
      { $match: { dateStart: { $gte: last30Days } } },
      {
        $group: {
          _id: {
            year: { $year: "$dateStart" },
            day: { $dayOfMonth: "$dateStart" },
            month: { $month: "$dateStart" },
          },
          totalAdvisories: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    return report;
  }

  // Reporte de todas las asesorías por mes en el último año
  async getReportLastYear() {
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    const report = await Advisory.aggregate([
      { $match: { dateStart: { $gte: lastYear } } },
      {
        $group: {
          _id: {
            year: { $year: "$dateStart" },
            month: { $month: "$dateStart" },
          },
          totalAdvisories: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    return report;
  }

  // Reporte en un rango de fechas personalizado
  async getReportByDateRange(startDate, endDate) {
    const report = await Advisory.aggregate([
      {
        $match: {
          dateStart: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$dateStart" },
            month: { $month: "$dateStart" },
            day: { $dayOfMonth: "$dateStart" },
          },
          totalAdvisories: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    return report;
  }

  // Usuario con más asesorías asignadas
  async getMostActiveAdvisor() {
    try {
      const result = await Advisory.aggregate([
        {
          $group: {
            _id: "$advisorId",
            totalAdvisories: { $sum: 1 },
            career: { $first: "$careerId" },
          },
        },
        { $sort: { totalAdvisories: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "advisorInfo",
          },
        },
        {
          $unwind: "$advisorInfo",
        },
        {
          $lookup: {
            from: "careers",
            localField: "career",
            foreignField: "_id",
            as: "careerInfo",
          },
        },
        {
          $unwind: "$careerInfo",
        },
        {
          $lookup: {
            from: "schedules",
            localField: "_id",
            foreignField: "advisoryId",
            as: "scheduleInfo",
          },
        },
        {
          $unwind: { path: "$schedule", preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            _id: 0,
            advisorName: "$advisorInfo.name",
            totalAdvisories: 1,
            topic: "$scheduleInfo.topic",
            career: "$careerInfo.name",
          },
        },
      ]);

      return result.length > 0
        ? result[0]
        : { message: "No se encontraron asesorías." };
    } catch (error) {
      throw new Error(
        "Error al obtener el asesor más activo: " + error.message
      );
    }
  }

  // Reporte por año (asesorías realizadas en un año específico)
  async getReportByYear(year) {
    const report = await Advisory.aggregate([
      {
        $match: {
          dateStart: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`),
          },
        },
      },
      {
        $group: {
          _id: { year: { $year: "$dateStart" } },
          totalAdvisories: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1 } },
    ]);

    return report;
  }

  async getTopCareers() {
    return await Advisory.aggregate([
      {
        $group: {
          _id: "$careerId",
          totalAdvisories: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "careers", // La colección de carreras
          localField: "_id",
          foreignField: "_id",
          as: "career",
        },
      },
      {
        $unwind: "$career",
      },
      {
        $project: {
          _id: 0,
          career: "$career.name",
          totalAdvisories: 1,
        },
      },
      { $sort: { totalAdvisories: -1 } },
      { $limit: 5 },
    ]);
  }

  async getAdvisoriesByAdvisor(advisorId) {
    return await Advisory.find({ advisorId }) // Filtra asesorías por el ID del asesor
      .populate("careerId", "name code") // Muestra la información de la carrera
      .populate({
        path: "advisorId",
        select: "name email",
      })
      .sort({ dateStart: -1 }); // Ordena por fecha descendente
  }
   getDayOfWeekNumber  (dayName)  {
    const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    return days.indexOf(dayName);
  };
  // service/advisoryService.js
  async getAdvisoriesThisWeek  () {
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Lunes
      startOfWeek.setHours(0, 0, 0, 0);
  
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Domingo
      endOfWeek.setHours(23, 59, 59, 999);
  
      const advisories = await Advisory.find({
        status: "approved",
        recurring: true,
      })
        .populate({ path: "advisorId", select: "name email codigo" });
  
      // Procesamos para esta semana
      const resultMap = new Map();
  
      advisories.forEach((advisory) => {
        const dayNumber = this.getDayOfWeekNumber(advisory.day);
  
        const advisoryDate = new Date(startOfWeek);
        advisoryDate.setDate(startOfWeek.getDate() + (dayNumber - 1));
  
        const start = new Date(advisoryDate);
        start.setHours(advisory.dateStart.getUTCHours(), advisory.dateStart.getUTCMinutes());
  
        const end = new Date(advisoryDate);
        end.setHours(advisory.dateEnd.getUTCHours(), advisory.dateEnd.getUTCMinutes());
  
        const advisorId = advisory.advisorId._id.toString();
  
        if (!resultMap.has(advisorId)) {
          resultMap.set(advisorId, {
            advisorCode: advisorId,
            name: advisory.advisorId.name,
            email: advisory.advisorId.email,
            codigo: advisory.advisorId.codigo,
            horarios: [],
          });
        }
  
        const horarioTexto = `${advisory.day} de ${start.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        })} a ${end.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
  
        resultMap.get(advisorId).horarios.push(horarioTexto);
      });
  
      return Array.from(resultMap.values());
    } catch (error) {
      console.error(error);
      throw new Error("Error al agrupar asesorías semanales: " + error.message);
    }
};
async findOneByAdvisorAndDay(advisorId, day, hour) {
  try {
    const advisories = await Advisory.find({ advisorId, day });
    console.log(advisories);
    const advisory = advisories.find(a => {
      const start = new Date(a.dateStart);
      const end = new Date(a.dateEnd);

      // Extraer año, mes y día de la fecha en UTC
      const year = start.getUTCFullYear();
      const month = start.getUTCMonth(); // ¡Ojo! Los meses son 0-indexados
      const date = start.getUTCDate();

      const [h, m] = hour.split(":").map(Number);

      // Crear una nueva fecha en UTC con la hora del usuario
      const targetTime = new Date(Date.UTC(year, month, date, h, m, 0));

      // Comparar en UTC
      return targetTime >= start && targetTime <= end;
    });

    return advisory;
  } catch (error) {
    console.error("Error en findOneByAdvisorDayAndHour:", error);
    throw error;
  }
}


}

module.exports = new AdvisoryService();
