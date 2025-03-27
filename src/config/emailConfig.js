const { createTransport } = require("nodemailer");
const config = require("../config/config"); // Asegúrate de importar tu configuración
const prueba = require("../emails/pruebas");
const forgot_password = require("../emails/forgot_password");

class EmailService {
    constructor() {

        this.transporter = createTransport({
            host: config.EMAIL_SMTP,
            port: Number(config.EMAIL_PORT),
            secure: false,
            auth: {
                user: config.EMAIL,
                pass: config.EMAIL_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false, // Evita el error del certificado autofirmado
            }
        });

        //const from = `Bienestar Universitario UFPS <noreply@bienestarufps.com>`;
    }

    async sendEmail(to, subject, text, html) {
        try {
            //console.log(`Enviando correo a: ${to}`);
            const mail = await this.transporter.sendMail({
                from: "Bienestar Universitario UFPS noreply@bienestarufps.com",
                to,
                subject,
                text,
                html,
            });
            
           // console.log(`Correo enviado con éxito: ${mail.envelope.from}`);
            return mail;
        } catch (error) {
            console.error("Error enviando correo:", error);
        }
    }

    async pruebaEmail() {
        //console.log("Enviando correo de prueba...");
        await this.sendEmail("ochoaanderson102@gmail.com", "Prueba de Envío", "", prueba());
    }

    async forgotPassword(user, hash) {
        //console.log(`Enviando correo de recuperación a ${user.email}`);
        await this.sendEmail(user.email, "Restablecer contraseña", "", forgot_password(user, hash));
    }
}

module.exports = new EmailService();
