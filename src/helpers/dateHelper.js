const { DateTime } = require("luxon");

function getNextMatchingDate(dayOfWeek, hour) {
  const [hourNum, minuteNum] = hour.split(":").map(Number);
  const now = DateTime.now().setZone("America/Bogota");

  const dayMap = {
    lunes: 1,
    martes: 2,
    miércoles: 3,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sábado: 6,
    sabado: 6,
    domingo: 7,
  };

  const targetWeekday = dayMap[dayOfWeek.toLowerCase()];
  if (!targetWeekday) throw new Error("Día no válido");

  let targetDate = now.set({ hour: hourNum, minute: minuteNum, second: 0, millisecond: 0 });

  const daysToAdd =
    (targetWeekday - now.weekday + (targetWeekday <= now.weekday ? 7 : 0)) % 7;

  targetDate = targetDate.plus({ days: daysToAdd });

  return targetDate; // Ya está en zona Colombia
}


module.exports = { getNextMatchingDate };