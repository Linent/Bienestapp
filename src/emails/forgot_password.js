let year = new Date().getFullYear();
module.exports = (user, hash) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <style>
      p,
      a,
      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        font-family: "Roboto", sans-serif !important;
      }
      h1 {
        font-size: 30px !important;
      }
      h2 {
        font-size: 25px !important;
      }
      h3 {
        font-size: 18px !important;
      }
      h4 {
        font-size: 16px !important;
      }
      p,
      a {
        font-size: 15px !important;
      }

      .claseBoton {
        width: 30%;
        background-color: #aa1916;
        color: black;
        padding: 16px 32px;
        text-align: center;
        text-decoration: none;
        font-weight: bold;
        display: inline-block;
        font-size: 16px;
        margin: 4px 2px;
        transition-duration: 0.4s;
        cursor: pointer;
      }
      .claseBoton:hover {
        background-color: #424242;
        color: #ffffff;
      }
      .imag {
        width: 20px;
        height: 20px;
      }
      .contA {
        margin: 0px 10px 0 5px;
      }
      .afooter {
        color: #ffffff !important;
        text-decoration: none;
        font-size: 13px !important;
      }
    </style>
  </head>
  <body>
    <div
      style="
        background: linear-gradient(180deg, #aa1916 0%, #ffffff 100%);
        width: 100%;
        background-color: #e3e3e3;
      "
    >
      <div style="padding: 20px 10px 20px 10px" >
        <!-- Imagen inicial -->
        <div
          style="
            background-color: #ffffff;
            padding: 10px 0px 10px 0px;
            width: 100%;
            text-align: center;
            padding-left: 0px;
            padding-top: 25px;
          "
        >
          <img
            src="https://lh6.googleusercontent.com/3PYTRnji4GR6kBfcAPT8F0n8NLlZTqrILDKTmJNAsYc0lJHAL47iz4rT2FdJeF9ZlnQk2gcydg5rCYwrziKgMr16YKWLQCaEiPdfzsh93rXERgB4ZxKzx5jYIflsrxeZfoCzND4WRQ=w2054"
            alt="congenius"
            style="width: 40%; min-height: 126px"
          />
        </div>
        <!-- Imagen inicial -->

        <!-- Contenido principal -->
        <div
          style="
            background-color: #ffffff;
            padding: 20px 0px 5px 0px;
            width: 100%;
            text-align: center;
          "
        >
          <h1>Recuperar Contraseña</h1>
          <h4>
            Hola ${user.name}, En el siguiente botón puedes cambiar tu
            contraseña.
          </h4>
          <p>
            <!-- Botón -->
            <a
              class="claseBoton"
              style="color: white"
              href="https://86s54q6q-3000.use2.devtunnels.ms/recovery-password/${hash} target="
              _blank
              >Cambiar Contraseña</a>
          </p>
          <!-- Gracias -->
          <p>Gracias por tu tiempo.</p>
          <p style="margin-bottom: 50px">
            <b><i>Atentamente: </i>Equipo de Bienestar universitario</b>
          </p>
          <p>
            Si no Solicitaste restablecer tu contraseña, por favor ignora este
            correo.
          </p>
        </div>
        <!-- Contenido principal -->

        <!-- Footer -->
        <div
          style="
            background-color: #ffffff;
            color: #000000;
            padding: 20px 0px 0px 0px;
            width: 100%;
            text-align: center;
          "
        >


          <p
            style="
              background-color: rgb(255, 255, 255);
              padding: 10px 0px 10px 0px;
              font-size: 14px !important;
            "
          >
            © ${year} Bienestar Universitario UFPS, todos los derechos reservados.
          </p>
        </div>
        <!-- Footer -->
      </div>
    </div>
  </body>
</html>
`;
