const express = require("express");
import scheduleController from '../controllers/scheduleController'
const router = express.Router();

router.post("/create", scheduleController.createSchedule);
router.get("/", scheduleController.getSchedules);
router.get("/:scheduleId", scheduleController.getScheduleById);
router.put("/:scheduleId", scheduleController.updateSchedule);
router.delete("/:scheduleId", scheduleController.deleteSchedule);

module.exports = router;