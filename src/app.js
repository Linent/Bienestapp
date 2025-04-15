const express = require('express');
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");

// Rutas
const careerRouter = require("./routes/careerRoutes.js");
const advisoryRouter = require("./routes/advisoryRoutes.js");
const userRouter = require("./routes/userRoutes.js");
const scheduleRouter = require('./routes/scheduleRoutes.js');
const whatsappRoutes = require("./routes/whatsappRoutes.js");

// Swagger
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load("./src/docs/swagger.yaml");

const config = require("./config/config");
const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

// Mostrar logs solo en desarrollo
if (config.NODE_ENV !== 'production') {
  app.use(morgan("dev"));
}

// Rutas de tu API
app.use('/', whatsappRoutes);
app.use('/career', careerRouter);
app.use('/schedules', scheduleRouter);
app.use('/advisory', advisoryRouter);
app.use('/user', userRouter);

// Swagger disponible en todos los entornos
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Ruta de prueba
app.get("/", (req, res) => {
  res.status(200).send({
    message: "Bienvenido a amigos académicos",
    environment: config.NODE_ENV,
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Algo salió mal en el servidor" });
});

module.exports = app;

