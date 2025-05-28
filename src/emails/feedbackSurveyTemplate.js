// emails/feedbackSurveyTemplate.js
const { FRONTEND_URL } = require("../config/config");

module.exports.feedbackSurveyTemplate = (schedule, token) =>{ 
  const fechaColombia = new Intl.DateTimeFormat("es-CO", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Bogota"
  }).format(new Date(schedule.dateStart));
  let year = new Date().getFullYear();
  return`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Califica tu asesoría</title>
  <style>
    body { font-family: "Roboto", sans-serif; color: #111; }
    .claseBoton {
      background-color: #aa1916;
      color: white !important;
      padding: 16px 32px;
      text-align: center;
      text-decoration: none;
      font-weight: bold;
      display: inline-block;
      font-size: 16px;
      margin: 12px 0;
      border-radius: 8px;
    }
    .claseBoton:hover {
      background-color: #424242;
    }
  </style>
</head>
<body>
  <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 40px 20px;">
    <h1>¡Queremos saber tu opinión!</h1>
    <p>Hola <b>${schedule.studentId.name}</b>,</p>
    <p>Gracias por asistir a la asesoría con el asesor <b>${
      schedule.AdvisoryId.advisorId.name
    }</b> el <b>${fechaColombia}</b>.</p>
    <p>Por favor, ayúdanos a mejorar respondiendo esta breve encuesta:</p>
    <p>
      <p>
    <a href="${FRONTEND_URL}rate-advice/${token}" class="claseBoton" target="_blank">Calificar asesoría</a>
  </p>
    </p>
    <p>¡Tu opinión es muy importante para nosotros!</p>
    <p style="margin-top: 40px; font-size: 14px; color: #666;">© ${year} Bienestar Universitario UFPS, todos los derechos reservados.</p>
  </div>
</body>
</html>
`};
