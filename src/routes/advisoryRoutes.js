const express = require("express");
const router = express.Router();
const advisoryController = require('../controllers/advisoryController')

router.post('/create', advisoryController.createAdvisory);
router.get('/', advisoryController.getAllAdvisories);
router.get("/:advisoryId", advisoryController.getAdvisoryById);
router.put("/:advisoryId", advisoryController.updateAdvisory);
router.delete("/:advisoryId", advisoryController.deleteAdvisory);


// Rutas para reportes
//router.get("/reports/weekly", advisoryController.getAdvisoryReportByWeek); // Reporte por semana
//router.get("/reports/monthly", advisoryController.getAdvisoryReportByMonth); // Reporte por mes
router.get("/report/last7days", advisoryController.getAdvisoryReportLast7Days);
router.get("/report/last30days", advisoryController.getAdvisoryReportLast30Days);
router.get("/report/lastyear", advisoryController.getAdvisoryReportLastYear);
router.get("/report/bydaterange", advisoryController.getAdvisoryReportByDateRange);
router.get("/report/mostActiveAdvisor", advisoryController.getMostActiveAdvisor);
router.get("/reports/yearly", advisoryController.getAdvisoryReportByYear); // Reporte por año

router.get("/report/top-careers", advisoryController.getTopCareersReport);
module.exports = router;