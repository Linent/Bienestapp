// controllers/userQueryController.js
const UserQuery = require("../models/UserQuery");
const UserInfo = require("../models/UserInfo");
const Topic = require("../models/Topic");
const careerService = require ("../services/CareerService");
const { handlerError } = require("../handlers/errors.handlers");
const { errorsConstants } = require("../constants/errors.constant");

// Traer TODAS las consultas (puedes paginar después si es necesario)
exports.getAllQueries = async (req, res) => {
  try {
    const queries = await UserQuery.find()
      .populate("userId", "fullName documentType documentNumber beneficiaryType academicProgram ufpsCode") // si quieres info de usuario
      .populate("topicId", "name")
      .sort({ createdAt: -1 });
    res.json(queries);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};
exports.byDay = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30; // Si mandas ?days=10 trae los últimos 10 días
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const stats = await UserQuery.aggregate([
      { $match: { createdAt: { $gte: fromDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.status(200).send(stats.map(s => ({ fecha: s._id, total: s.total })));
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};
exports.topTopics = async (req, res) => {
  try {
    const stats = await UserQuery.aggregate([
      // Agrupa por topicId
      {
        $group: {
          _id: "$topicId",
          total: { $sum: 1 }
        }
      },
      // Lookup para traer el nombre del topic
      {
        $lookup: {
          from: "topics", // nombre de la colección Topic
          localField: "_id",
          foreignField: "_id",
          as: "topic"
        }
      },
      { $unwind: { path: "$topic", preserveNullAndEmptyArrays: true } },
      { $sort: { total: -1 } } // ordena por los más consultados
      // <--- Ya no hay $limit
    ]);

    res.status(200).send(
      stats.map(s => ({
        tema: s.topic?.name || "Sin tema",
        total: s.total
      }))
    );
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};
exports.byBeneficiary = async (req, res) => {
  try{
  const stats = await UserQuery.aggregate([
    {
      $lookup: {
        from: "userinfos",  // <--- nombre de tu colección UserInfo
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $group: {
        _id: "$user.beneficiaryType",
        total: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ]);
  res.status(200).send(stats.map(s => ({ beneficiaryType: s._id || "Sin tipo", total: s.total })));
}
catch(error){
  return handlerError(res, 500, errorsConstants.serverError);
}
};
exports.byCareer = async (req, res) => {
  try {
    // Paso 1: Agrupa por los 3 primeros dígitos del código UFPS
    const stats = await UserQuery.aggregate([
      {
        $lookup: {
          from: "userinfos",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      // Solo aquellos con ufpsCode de 7 dígitos
      {
        $match: {
          "user.ufpsCode": { $regex: /^\d{7}$/ }
        }
      },
      {
        $addFields: {
          careerCode: { $substr: ["$user.ufpsCode", 0, 3] }
        }
      },
      {
        $group: {
          _id: "$careerCode",
          total: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Paso 2: Trae los nombres de carreras (solo para los códigos encontrados)
    // Puedes optimizar haciendo una sola consulta a Career.find({ code: { $in: codes } })
    const codes = stats.map(s => s._id);
    console.log(codes);
    const careers = await careerService.findByCodes(codes);

    // Paso 3: Une el nombre de la carrera con el código y el total
    const results = stats.map(s => {
      const career = careers.find(c => c.code === s._id);
      return {
        code: s._id,
        careerName: career ? career.name : "Desconocida",
        total: s.total
      };
    });

    res.status(200).send(results);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};
// KPIs para dashboard/gráficas
exports.getKpiStats = async (req, res) => {
  try {
    // Total de consultas
    const totalQueries = await UserQuery.countDocuments();

    // Usuarios únicos (general)
    const uniqueUsers = await UserQuery.distinct("userId");
    const totalUniqueUsers = uniqueUsers.length;

    // Fechas en UTC para últimos 7 días
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const fromDateUTC = new Date(todayUTC);
    fromDateUTC.setUTCDate(todayUTC.getUTCDate() - 6);

    // Aggregate por fecha UTC
    const aggResults = await UserQuery.aggregate([
      { $match: { createdAt: { $gte: fromDateUTC } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Fechas de los últimos 7 días (UTC)
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(fromDateUTC);
      d.setUTCDate(fromDateUTC.getUTCDate() + i);
      days.push(d.toISOString().slice(0, 10)); // "YYYY-MM-DD"
    }

    // Conteos por día
    const last7days = days.map(dateStr => {
      const found = aggResults.find(r => r._id === dateStr);
      return {
        _id: dateStr,
        count: found ? found.count : 0
      };
    });

    // Consultas (hoy) -- el último día de last7days es HOY en UTC
    const consultasHoy = last7days[last7days.length - 1].count;

    // Top topics
    const topTopics = await UserQuery.aggregate([
      { $match: { topicId: { $ne: null } } },
      {
        $group: {
          _id: "$topicId",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "topics",
          localField: "_id",
          foreignField: "_id",
          as: "topic"
        }
      },
      { $unwind: "$topic" },
      {
        $project: {
          _id: 0,
          topicId: "$_id",
          topicName: "$topic.name",
          count: 1
        }
      }
    ]);

    res.json({
      totalQueries,
      totalUniqueUsers,
      last7days,
      consultasHoy,
      topTopics
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los KPIs" });
  }
};

