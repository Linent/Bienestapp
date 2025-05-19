const express = require("express");
const scheduleController = require ("../controllers/scheduleController");
const router = express.Router();
const Auth = require("../middlewares/authMiddleware");

router.get("/upcoming/:studentCode", scheduleController.getUpcomingByStudentCode);
router.post("/cancel/:scheduleId", scheduleController.cancelSchedule);
router.get("/total-advisories", Auth, scheduleController.getTotalAdvisories);
router.get('/feedback/validate/:token', scheduleController.validateFeedbackToken);
router.get("/attendance-percentage", Auth, scheduleController.getAttendancePercentage);
router.get("/monthly-advisories", Auth, scheduleController.getMonthlyAdvisories);
router.get("/most-active-advisor", Auth, scheduleController.getMostActiveAdvisor);
router.get("/students-by-advisory", Auth, scheduleController.getStudentsByAdvisory);
router.get("/schedules-by-advisor", Auth, scheduleController.getSchedulesByAdvisor);
router.get("/schedules-by-advisorAll", Auth, scheduleController.getSchedulesByAdvisorAll);
router.get("/attendance-per-schedule", Auth, scheduleController.getAttendancePerSchedule);
router.get("/schedules-by-topic", Auth, scheduleController.getSchedulesByTopic);
router.get("/schedules-by-month", Auth, scheduleController.getSchedulesByMonth);
router.get("/schedules-by-day", Auth, scheduleController.getSchedulesByDay);
router.get("/schedules-by-year", Auth, scheduleController.getSchedulesByYear);
router.put("/update-attendance", Auth, scheduleController.updateAttendance);
router.put("/feedback/:scheduleId", scheduleController.submitFeedback);
// routes/schedule.js o advisory.js

// Schedule Reports
router.post("/create", Auth, scheduleController.createSchedule);
router.get("/", Auth, scheduleController.getSchedules);
router.get("/:scheduleId", Auth, scheduleController.getScheduleById);
router.put("/:scheduleId", Auth, scheduleController.updateSchedule);
router.delete("/:scheduleId", Auth, scheduleController.deleteSchedule);


router.get("/student/:studentId", Auth, scheduleController.getSchedulesByStudent);
router.get("/students/today", Auth, scheduleController.getStudentsScheduledToday);



module.exports = router;
