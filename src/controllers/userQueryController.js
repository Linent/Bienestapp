// controllers/userQueryController.js
const UserQuery = require("../models/UserQuery");
const UserInfo = require("../models/UserInfo");
const Topic = require("../models/Topic");
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
exports.byProgram = async (req, res) => {
  try{const stats = await UserQuery.aggregate([
    {
      $lookup: {
        from: "userinfos",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $group: {
        _id: "$user.academicProgram",
        total: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ]);
  res.status(200).send(stats.map(s => ({ academicProgram: s._id || "Sin programa", total: s.total })));
}
catch(error){
  return handlerError(res, 500, errorsConstants.serverError);
}
};
// KPIs para dashboard/gráficas
exports.getKpiStats = async (req, res) => {
  try {
    // Total de consultas
    const totalQueries = await UserQuery.countDocuments();

    // Últimos 7 días (incluido hoy)
    const fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0); // Inicio del día
    fromDate.setDate(fromDate.getDate() - 6); // Se cuentan hoy y los 6 días previos

    // 1. Aggregate igual que antes
    const aggResults = await UserQuery.aggregate([
      { $match: { createdAt: { $gte: fromDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 2. Generar array de los 7 días (incluido hoy)
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(fromDate);
      d.setDate(fromDate.getDate() + i);
      days.push(d.toISOString().slice(0, 10)); // "YYYY-MM-DD"
    }

    // 3. Armar el array asegurando que todos los días estén presentes
    const last7days = days.map(dateStr => {
      const found = aggResults.find(r => r._id === dateStr);
      return {
        _id: dateStr,
        count: found ? found.count : 0
      };
    });

    // Top topics usando topicId y trayendo el name
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

    // Usuarios únicos
    const uniqueUsers = await UserQuery.distinct("userId");
    const totalUniqueUsers = uniqueUsers.length;

    res.json({
      totalQueries,
      last7days,
      topTopics,           // [{ topicId, topicName, count }]
      totalUniqueUsers,
    });
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

