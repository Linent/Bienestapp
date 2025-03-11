const express = require('express');
const cors = require("cors");
const morgan = require("morgan");
//exportar rutas
const authRoutes = require("./routes/authRoutes");
import whatsappRoutes from "./routes/whatsappRoutes.js";
//
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const config = require("./config/config");
const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/auth', authRoutes);
app.use("/", whatsappRoutes);
/* app.use('/product', productRoutes);
app.use('/order', orderRoutes);
app.use('/client', clientRoutes);
app.use('/categoryProduct', categoryProductsRoutes);
app.use('/courtesy', courtesyRoutes); */



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