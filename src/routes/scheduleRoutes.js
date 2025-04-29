const express = require("express");
const scheduleController = require ("../controllers/scheduleController");
const router = express.Router();
const Auth = require("../middlewares/authMiddleware");


router.get("/schedules-by-advisor", Auth, scheduleController.getSchedulesByAdvisor);
router.get("/attendance-per-schedule", Auth, scheduleController.getAttendancePerSchedule);
router.get("/schedules-by-topic", Auth, scheduleController.getSchedulesByTopic);
router.get("/schedules-by-month", Auth, scheduleController.getSchedulesByMonth);
router.get("/schedules-by-day", Auth, scheduleController.getSchedulesByDay);
router.get("/schedules-by-year", Auth, scheduleController.getSchedulesByYear);
// routes/schedule.js o advisory.js
router.get("/grouped-by-time", Auth,scheduleController.groupByTime);

// Schedule Reports
router.post("/create", Auth, scheduleController.createSchedule);
router.get("/", Auth, scheduleController.getSchedules);
router.get("/:scheduleId", Auth, scheduleController.getScheduleById);
router.put("/:scheduleId", Auth, scheduleController.updateSchedule);
router.delete("/:scheduleId", Auth, scheduleController.deleteSchedule);


router.get("/student/:studentId", Auth, scheduleController.getSchedulesByStudent);
router.get("/students/today", Auth, scheduleController.getStudentsScheduledToday);



module.exports = router;
