# Plataforma de Agendamiento de Asesorías - Amigos Académicos UFPS

Este proyecto es una plataforma desarrollada para la gestión y agendamiento de asesorías entre estudiantes y asesores en el programa "Amigos Académicos" de la Universidad Francisco de Paula Santander (UFPS).

## 🚀 Tecnologías Utilizadas

- **Backend:** Node.js + Express
- **Base de Datos:** MongoDB
- **Autenticación:** JSON Web Tokens (JWT)
- **Documentación de API:** Swagger (archivo `swagger.yaml`)
- **Mensajería:** Integración con WhatsApp
- **IA (opcional):** Gemini de Google para asistente conversacional
- **ORM:** Mongoose
- **Control de versiones:** Git
- **Servidor:** Express
- **Middlewares:** Morgan, Cors, dotenv

## 📁 Estructura del Repositorio

```bash
.
├── config/              # Configuración general, base de datos, etc.
├── controllers/         # Lógica de controladores
├── models/              # Modelos de Mongoose
├── routes/              # Rutas de la API
├── services/            # Servicios auxiliares
├── src/docs/            # Documentación (PDFs, Swagger)
├── utils/               # Utilidades como manejo de archivos, etc.
├── app.js               # Archivo principal del backend
├── index.js             # Punto de entrada del servidor
└── .env.development     # Variables de entorno
