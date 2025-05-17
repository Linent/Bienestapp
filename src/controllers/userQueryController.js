// controllers/userQueryController.js
const UserQuery = require("../models/UserQuery");
const UserInfo = require("../models/UserInfo");
const Topic = require("../models/Topic");

// Traer TODAS las consultas (puedes paginar después si es necesario)
exports.getAllQueries = async (req, res) => {
  try {
    const queries = await UserQuery.find()
      .populate("userId", "fullName documentType documentNumber beneficiaryType academicProgram") // si quieres info de usuario
      .populate("topicId", "name")
      .sort({ createdAt: -1 });
    res.json(queries);
  } catch (error) {
    res.status(500).json({ error: "Error al traer las consultas." });
  }
};

// KPIs para dashboard/gráficas
exports.getKpiStats = async (req, res) => {
  try {
    // Total de consultas
    const totalQueries = await UserQuery.countDocuments();

    // Cantidad de preguntas por día (últimos 7 días)
    const last7days = await UserQuery.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Temas más consultados (Top 5)
    const topTopics = await UserQuery.aggregate([
      { $group: { _id: "$topicKey", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Usuarios únicos que han consultado
    const uniqueUsers = await UserQuery.distinct("userId");
    const totalUniqueUsers = uniqueUsers.length;

    res.json({
      totalQueries,
      last7days,
      topTopics,
      totalUniqueUsers,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al traer los KPIs." });
  }
};
