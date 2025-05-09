const Topic = require("../models/Topic");


const createTopic = async (data) => {
  const topic = new Topic(data);
  return await topic.save();
};

const getAllTopics = async (filter = { delete: false }) => {
  return await Topic.find(filter).sort({ createdAt: -1 });
};

const getTopicsByKeyword = async (keyword) => {
  return await Topic.findOne(
    { $text: { $search: keyword }, delete: false },
    { score: { $meta: "textScore" } }
  ).sort({ score: { $meta: "textScore" } });
};

const getTopicById = async (id) => {
  return await Topic.findById(id);
};

const updateTopic = async (id, data) => {
  return await Topic.findByIdAndUpdate(id, data, { new: true });
};

const deleteTopic = async (id) => {
  return await Topic.findByIdAndUpdate(id, { delete: true }, { new: true });
};

module.exports = {
  createTopic,
  getAllTopics,
  getTopicById,
  updateTopic,
  deleteTopic,
  getTopicsByKeyword,
};
