const express = require("express");
const router = express.Router();
const Auth = require("../middlewares/authMiddleware");
const userQueryController = require("../controllers/userQueryController");

// Obtener TODAS las consultas de usuario
router.get("/all", Auth, userQueryController.getAllQueries);

// KPIs / Estadísticas principales para dashboard
router.get("/kpis", Auth, userQueryController.getKpiStats);
router.get("/by-day",     Auth, userQueryController.byDay);
router.get("/top-topics", Auth, userQueryController.topTopics);
router.get("/by-beneficiary", Auth, userQueryController.byBeneficiary);
router.get("/by-program", Auth, userQueryController.byCareer);

module.exports = router;