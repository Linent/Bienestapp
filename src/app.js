const express = require('express');
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const fileUpload = require("express-fileupload");
const path = require("path");

// Rutas
const careerRouter = require("./routes/careerRoutes.js");
const advisoryRouter = require("./routes/advisoryRoutes.js");
const userRouter = require("./routes/userRoutes.js");
const scheduleRouter = require('./routes/scheduleRoutes.js');
const whatsappRoutes = require("./routes/whatsappRoutes.js");
const topicRouter = require("./routes/topicRoutes.js");
const uploadRoutes = require("./routes/uploadRoutes.js");
const userInfoRouter = require("./routes/userInfoRoutes.js");
const userQueryRouter = require("./routes/userQuery.js");

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

// 👉 habilita express-fileupload
app.use(fileUpload());

// 👉 sirve archivos de la carpeta uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


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
app.use('/topics', topicRouter);
app.use('/upload', uploadRoutes);
app.use('/userInfo',userInfoRouter);
app.use('/userqueries', userQueryRouter);
// Swagger
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
