function mapNumberToKeyword(input) {
  switch (input.trim()) {
    case "1":
      return "Servicio Médico";
    case "2":
      return "Servicio Odontológico";
    case "3":
      return "Servicio Psicológico";
    case "4":
      return "Servicio Psicosocial";
    case "5":
      return "Asesoría Espiritual";
    case "6":
      return "Amigos Académicos";
    default:
      return null;
  }
}

module.exports = { mapNumberToKeyword };
