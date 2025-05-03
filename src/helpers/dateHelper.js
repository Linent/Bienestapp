// helpers/dateHelper.js
const { DateTime } = require("luxon");

const diasSemana = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sábado: 6,
};

/**
 * Encuentra la próxima fecha futura que coincida con el día de la semana y la hora indicada (en UTC).
 * @param {string} dayName - Día en español (ej. "miércoles")
 * @param {string} hourUTC - Hora en formato HH:mm (ej. "13:00")
 * @returns {DateTime} Luxon DateTime en UTC
 */
function getNextMatchingDate(dayName, hourUTC) {
  const today = DateTime.utc();
  const targetDay = diasSemana[dayName.toLowerCase()];
  if (targetDay === undefined) throw new Error("Día no válido.");

  const daysToAdd = (targetDay + 7 - today.weekday) % 7 || 7;

  const [hour, minute] = hourUTC.split(":").map(Number);
  return today
    .plus({ days: daysToAdd })
    .set({ hour, minute, second: 0, millisecond: 0 });
}

module.exports = {
  getNextMatchingDate,
};
