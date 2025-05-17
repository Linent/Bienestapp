const express = require("express");
const router = express.Router();
const Auth = require("../middlewares/authMiddleware");
const userQueryController = require("../controllers/userQueryController");

// Obtener TODAS las consultas de usuario
router.get("/all", Auth, userQueryController.getAllQueries);

// KPIs / Estadísticas principales para dashboard
router.get("/kpis", Auth, userQueryController.getKpiStats);

module.exports = router;