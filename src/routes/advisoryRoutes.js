const express = require("express");
const router = express.Router();
const advisoryController = require("../controllers/advisoryController");
const Auth = require("../middlewares/authMiddleware");

router.get("/thisweek",  advisoryController.getAdvisoriesThisWeek);
router.post("/create", Auth, advisoryController.createAdvisory);
router.get("/advisor/:advisorId", Auth, advisoryController.getAdvisoriesByAdvisor);
router.get("/", Auth, advisoryController.getAllAdvisories);
router.get("/:advisoryId", Auth, advisoryController.getAdvisoryById);
router.put("/:advisoryId", Auth, advisoryController.updateAdvisory);
router.put("/updateStatus/:advisoryId", Auth, advisoryController.updateAdvisoryStatus);
router.delete("/:advisoryId", Auth, advisoryController.deleteAdvisory);

// Obtener asesorías agendadas para un asesor
// Rutas para reportes
router.get("/report/last7days", Auth, advisoryController.getAdvisoryReportLast7Days);
router.get("/report/last30days", Auth, advisoryController.getAdvisoryReportLast30Days);
router.get("/report/lastyear", Auth, advisoryController.getAdvisoryReportLastYear);
router.get("/report/bydaterange", Auth, advisoryController.getAdvisoryReportByDateRange);
router.get("/report/mostActiveAdvisor", Auth, advisoryController.getMostActiveAdvisor);
router.get("/reports/yearly", Auth,advisoryController.getAdvisoryReportByYear); // Reporte por año

router.get("/report/top-careers", Auth, advisoryController.getTopCareersReport);




module.exports = router;
