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

/**
 * Busca un UserInfo por número de documento.
 * @param {string} documentNumber
 * @returns {Promise<UserInfo|null>}
 */
exports.getByDocumentNumber = async (documentNumber) => {
  return UserInfo.findOne({ documentNumber });
}
exports.getUserInfoAll = async () => {
   return await UserInfo.find();
}