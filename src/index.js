const config = require("./config/config");
const Database = require("./config/database").default;
const app = require("./app");

const port = process.env.PORT || config.PORT;

// MongoDB connection
const db = new Database();
db.connect();

app.listen(port, () => {
  console.log("Server running:", port);
});

