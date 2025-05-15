const { createTransport } = require("nodemailer");
const config = require("../config/config"); // Asegúrate de importar tu configuración

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
            
            const mail = await this.transporter.sendMail({
                from: "Bienestar Universitario UFPS noreply@bienestarufps.com",
                to,
                subject,
                text,
                html,
            });
            
           
            return mail;
        } catch (error) {
            console.error("Error enviando correo:", error);
        }
    }



    async forgotPassword(user, hash) {
        
        await this.sendEmail(user.email, "Restablecer contraseña", "", forgot_password(user, hash));
    }
}

module.exports = new EmailService();
