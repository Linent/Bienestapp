const express = require("express");
import scheduleController from "../controllers/scheduleController";
const router = express.Router();
const Auth = require("../middlewares/authMiddleware");

router.post("/create", Auth, scheduleController.createSchedule);
router.get("/", Auth, scheduleController.getSchedules);
router.get("/:scheduleId", Auth, scheduleController.getScheduleById);
router.put("/:scheduleId", Auth, scheduleController.updateSchedule);
router.delete("/:scheduleId", Auth, scheduleController.deleteSchedule);

module.exports = router;
