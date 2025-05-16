const UserInfo = require("../models/UserInfo");

exports.registerUserInfo = async (data) => {
  try {
    const newUser = new UserInfo(data);
    await newUser.save();
    return newUser;
  } catch (error) {
    throw new Error("Error registering user information: " + error.message);
  }
};

exports.getUserInfoAll = async () => {
   return await UserInfo.find();
}