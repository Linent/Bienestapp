// services/emailService.js
const EmailService = require("../config/emailConfig");
const appointmentConfirmationTemplate = require("../emails/appointmentConfirmationTemplate");
const appointmentCanceledTemplate = require("../emails/appointmentCanceledTemplate");
const { feedbackSurveyTemplate } = require("../emails/feedbackSurveyTemplate");

exports.sendAppointmentConfirmation = async (student, advisor, schedule, topic) => {
  const subject = "Confirmación de Asesoría Académica";
  const text = `Hola ${student.name}, tu asesoría ha sido agendada.\nTema: ${topic}\nAsesor: ${advisor.name}\nFecha: ${schedule.dateStart}`;

  // Aquí pasas los datos al template (¡importante!)
  const html = appointmentConfirmationTemplate({
    student,
    advisor,
    topic,
    scheduleDate: schedule.dateStart,
  });

  await EmailService.sendEmail(student.email, subject, text, html);
};

exports.sendAppointmentCanceled = async (student, advisor, schedule) => {
  const subject = "Cancelación de Asesoría Académica";
  const text = `Hola ${student.name}, tu asesoría fue cancelada.\nAsesor: ${advisor?.name}\nFecha: ${schedule.dateStart}`;
  const html = appointmentCanceledTemplate({
    student,
    advisor,
    scheduleDate: schedule.dateStart,
  });

  await EmailService.sendEmail(student.email, subject, text, html);
};
exports.sendFeedbackSurvey = async (schedule, token) => {
  

  // Opcional: busca también los datos completos del estudiante y asesor si no vienen en schedule
  // schedule = await Schedule.findById(schedule._id).populate(...)

  const subject = "Califica tu asesoría";
  const html = feedbackSurveyTemplate(schedule, token);
  const text = `Por favor califica tu asesoría`;

  await EmailService.sendEmail(schedule.studentId.email, subject, text, html);
};