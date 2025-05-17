// src/services/userQueryService.js
const UserQuery = require("../models/UserQuery");

/**
 * Registra una nueva consulta de usuario en la base de datos.
 * @param {Object} params
 * @param {String} params.userId   ObjectId de UserInfo
 * @param {String} params.rawQuery Texto original que envió el usuario
 * @param {String} params.topicKey Keyword mapeada (o el texto mismo)
 * @param {String} [params.topicId] ObjectId del Topic si existe
 */
async function saveUserQuery({ userId, rawQuery, topicKey, topicId = null }) {
  if (!userId || !rawQuery) {
    throw new Error("userId y rawQuery son obligatorios para guardar la consulta");
  }
  const query = new UserQuery({
    userId,
    rawQuery,
    topicKey,
    topicId,
  });
  return await query.save();
}
const UserQueryAll = async () =>{
  return UserQuery.find()
          .populate({path:"userId", select:"fullName"})
}


module.exports = {
  saveUserQuery,
  UserQueryAll,
};
