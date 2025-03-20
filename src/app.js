const express = require('express');
const cors = require("cors");
const morgan = require("morgan");
//exportar rutas

const careerRouter = require("./routes/careerRoutes.js");
const advisoryRouter = require("./routes/advisoryRoutes.js");
const userRouter = require("./routes/userRoutes.js");
const scheduleRouter = require('./routes/scheduleRoutes.js');
import whatsappRoutes from "./routes/whatsappRoutes.js";
//
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const config = require("./config/config");
const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/', whatsappRoutes);
app.use('/career',careerRouter);
app.use('/schedules', scheduleRouter);
app.use('/advisory',advisoryRouter)
app.use('/user',userRouter);



if (config.NODE_ENV !== 'production') {
    app.use(morgan("dev"));
    // rutas
    const swaggerDocument = YAML.load("./src/docs/swagger.yaml");
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }

  app.get("/", (req, res) => {
    res.status(200).send({
      message: "Welcome to amigosacademicos",
      environment: config.NODE_ENV,
    });
  });
  module.exports = app;