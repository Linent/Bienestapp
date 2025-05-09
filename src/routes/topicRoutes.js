const express = require("express");
const topicController = require("../controllers/topicController");
const Auth = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", Auth, topicController.getTopics);
router.get("/search", topicController.getTopicsByKeyword);
router.get("/:topicId", Auth, topicController.getTopicById);
router.post("/create", Auth, topicController.createTopic);
router.put("/:topicId", Auth, topicController.updateTopic);
router.delete("/:topicId", Auth, topicController.deleteTopic);

module.exports = router;
