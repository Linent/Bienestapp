const dotenv = require("dotenv");
dotenv.config({ path: `./.env.${process.env.NODE_ENV || 'development'}` });

module.exports = {
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
    PORT: process.env.PORT || 10000,
    MONGODB_URI: process.env.MONGODB_URI || "",
    SECRET_KEY: process.env.SECRET_KEY || "",
    NODE_ENV: process.env.NODE_ENV || "development",
    API_BASE_URL: process.env.API_BASE_URL || "http://localhost:8080",
    // Corrección en la capitalización de variables de Cloudinary
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",

    // Variables para WhatsApp API
    WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN || "",
    API_TOKEN: process.env.API_TOKEN || "",
    BUSINESS_PHONE: process.env.BUSINESS_PHONE || "",
    API_VERSION: process.env.API_VERSION || "v22.0",

    //
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ,
    EMAIL: process.env.EMAIL_USER,
    EMAIL_SMTP: process.env.EMAIL_SMTP,
    EMAIL_PORT: process.env.EMAIL_PORT,

    CHATGPT_API_KEY: process.env.CHATGPT_API_KEY || "",
    GEMINI_API_KEY:process.env.GEMINI_API_KEY,
};

