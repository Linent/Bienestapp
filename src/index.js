const config = require("./config/config");
const db = require("./config/database");
const app = require("./app");

const port = process.env.PORT || config.PORT;

// MongoDB connection
db.connect();

app.listen(port, () => {
  console.log("Server running:", port);
});

