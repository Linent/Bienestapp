const serverless = require('serverless-http');
const config = require("./config/config");
const Database = require("./config/database").default;
const app = require("./app");
//config de casbin
const casbinConfig = require("./config/casbin");

const port= config.PORT;
//MongoDB conecction
const db = new Database();
db.connect();

casbinConfig.on("serverStart", () => {
    app.listen(port, () => console.log("Server running:", port));
  });
module.exports.handler = serverless(app);