let year = new Date().getFullYear();
module.exports = (user) => `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      p, a, h1, h2, h3, h4, h5, h6 {
        font-family: "Roboto", sans-serif !important;
      }
      h1 { font-size: 30px !important; }
      h2 { font-size: 25px !important; }
      h3 { font-size: 18px !important; }
      h4 { font-size: 16px !important; }
      p, a { font-size: 15px !important; }
      .claseBoton {
        width: 30%;
        background-color: #aa1916;
        color: white;
        padding: 16px 32px;
        text-align: center;
        text-decoration: none;
        font-weight: bold;
        display: inline-block;
        font-size: 16px;
        margin: 4px 2px;
        transition-duration: 0.4s;
        cursor: pointer;
        border-radius: 8px;
      }
      .claseBoton:hover {
        background-color: #424242;
      }
    </style>
  </head>
  <body>
    <div style="background: linear-gradient(180deg, #aa1916 0%, #ffffff 100%); width: 100%; background-color: #e3e3e3;">
      <div style="padding: 20px 10px;">
        <!-- Encabezado -->
        <div style="background-color: #ffffff; padding: 20px; text-align: center;">
          <img src="https://lh6.googleusercontent.com/3PYTRnji4GR6kBfcAPT8F0n8NLlZTqrILDKTmJNAsYc0lJHAL47iz4rT2FdJeF9ZlnQk2gcydg5rCYwrziKgMr16YKWLQCaEiPdfzsh93rXERgB4ZxKzx5jYIflsrxeZfoCzND4WRQ=w2054" alt="Bienestar Universitario UFPS" style="width: 40%; min-height: 100px;" />
        </div>
        <!-- Contenido Principal -->
        <div style="background-color: #ffffff; padding: 20px; text-align: center;">
          <h1>¡Bienvenido a Bienestar Universitario UFPS!</h1>
          <h4>Hola ${user.name},</h4>
          <p>Nos alegra tenerte como parte de nuestra comunidad. Aquí encontrarás apoyo en salud, actividades culturales, asesorías académicas y más.</p>
          <p>Explora nuestros servicios y aprovecha todo lo que Bienestar Universitario tiene para ofrecerte.</p>
          <p>
            <a class="claseBoton" href="https://86s54q6q-3000.use2.devtunnels.ms/" style="color: white" target="_blank">Ir a la Plataforma</a>
          </p>
          <p style="margin-bottom: 30px;">¡Esperamos verte pronto en nuestras actividades!</p>
          <p><b>Atentamente,</b></p>
          <p><i>Equipo de Bienestar Universitario UFPS</i></p>
        </div>
        <!-- Footer -->
        <div style="background-color: #ffffff; color: #000000; padding: 20px; text-align: center;">
          <p style="font-size: 14px;">© ${year} Bienestar Universitario UFPS, todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  </body>
</html>
`;
