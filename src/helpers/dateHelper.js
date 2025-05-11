const { DateTime } = require("luxon");

const getNextMatchingDate = (dayName, hourStr) => {
  const daysMap = {
    lunes: 1,
    martes: 2,
    miércoles: 3,
    jueves: 4,
    viernes: 5,
  };

  const targetWeekday = daysMap[dayName];
  if (!targetWeekday) throw new Error("Día inválido en asesoría");

  let nextDate = DateTime.now().setZone("America/Bogota").startOf("day");
  while (nextDate.weekday !== targetWeekday || nextDate < DateTime.now()) {
    nextDate = nextDate.plus({ days: 1 });
  }

  const [hour, minute] = hourStr.split(":").map(Number);
  return nextDate.set({ hour, minute });
};


module.exports = { getNextMatchingDate };