const advisoryService = require("../services/advisoryService");
const { handlerError } = require("../handlers/errors.handlers");
const { errorsConstants } = require("../constants/errors.constant");

// 📌 Crear una asesoría (solo admin)
exports.createAdvisory = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    const { advisorId, careerId, dateStart, day } = req.body;
    if (!advisorId || !careerId || !dateStart || !day  ) {
      return handlerError(res, 400, errorsConstants.inputRequired);
    }

    const advisory = await advisoryService.createAdvisory(advisorId, careerId, dateStart, day );
    return res.status(201).send(advisory);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// 📌 Obtener todas las asesorías (cualquier usuario autenticado)
exports.getAllAdvisories = async (req, res) => {
  try {
    const usersValid = ["admin"];
    if (!usersValid.includes(req.user.role)) {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }
    const advisories = await advisoryService.getAllAdvisory();
    return res.status(200).send(advisories);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

exports.getAllAdvisoriesWhatsapp = async (req, res) => {
  try {
    const advisories = await advisoryService.getAllAdvisory();
    return res.status(200).send(advisories);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// 📌 Obtener asesoría por ID (solo admin y el asesor asignado)
exports.getAdvisoryById = async (req, res) => {
  try {
    const { advisoryId } = req.params;
    if (!advisoryId) {
      return handlerError(res, 400, errorsConstants.inputIdRequired);
    }
    const advisory = await advisoryService.getAdvisoryById(advisoryId);
    if (!advisory) {
      return handlerError(res, 404, errorsConstants.notFound);
    }
    if (req.user.role !== "admin" && req.user.id.toString() !== advisory.advisorId.id.toString()) {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    res.status(200).send(advisory);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// 📌 Actualizar asesoría (solo admin)
exports.updateAdvisory = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }
    const { advisoryId } = req.params;
    if (!advisoryId) {
      return handlerError(res, 400, errorsConstants.inputIdRequired);
    }
    const body = req.body;

    const updatedAdvisory = await advisoryService.updateAdvisory(advisoryId, body);
    if (!updatedAdvisory) {
      return handlerError(res, 404, errorsConstants.advisoryNotUpdate);
    }

    res.status(200).send(updatedAdvisory);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// 📌 Eliminar asesoría (solo admin)
exports.deleteAdvisory = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    const { advisoryId } = req.params;
    if (!advisoryId) {
      return handlerError(res, 400, errorsConstants.inputIdRequired);
    }

    const deleted = await advisoryService.deleteAdvisory(advisoryId);
    if (!deleted) {
      return handlerError(res, 404, errorsConstants.notFound);
    }

    res.status(200).send({ success: true });
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// 📌 Obtener asesorías por asesor (solo admin y el asesor pueden verlas)
exports.getAdvisoriesByAdvisor = async (req, res) => {
  try {
    const { advisorId } = req.params;
    console.log(req.user.id);
    if (!advisorId) {
      return handlerError(res, 400, errorsConstants.inputIdRequired);
    }

    if ( req.user.role !== "admin" && req.user.id.toString() !== advisorId) {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    const advisories = await advisoryService.getAdvisoriesByAdvisor(advisorId);
    if (!advisories || advisories.length === 0) {
      return handlerError(res, 404, errorsConstants.advisoryEmpty);
    }

    return res.status(200).send(advisories);
  } catch (error) {
    console.error("Error al obtener asesorías del asesor:", error);
    return handlerError(res, 500, errorsConstants.serverError);
  }
};


// 📌 Reporte por año (solo admin)
exports.getAdvisoryReportByYear = async (req, res) => {
  try {
    const usersValid = ["admin"];
    if (!usersValid.includes(req.user.role)) {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    const { year } = req.query;
    if (!year) {
      return res.status(400).send({ message: "El año es obligatorio" });
    }

    const report = await advisoryService.getReportByYear(parseInt(year));
    return res.status(200).send(report);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// 📌 Reporte de los últimos 7 días (solo admin)
exports.getAdvisoryReportLast7Days = async (req, res) => {
  try {
    const usersValid = ["admin"];
    if (!usersValid.includes(req.user.role)) {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    const report = await advisoryService.getReportLast7Days();
    return res.status(200).send(report);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// 📌 Reporte de los últimos 30 días (solo admin)
exports.getAdvisoryReportLast30Days = async (req, res) => {
  try {
    const usersValid = ["admin"];
    if (!usersValid.includes(req.user.role)) {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    const report = await advisoryService.getReportLast30Days();
    return res.status(200).send(report);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// 📌 Reporte de asesorías mensuales en el último año (solo admin)
exports.getAdvisoryReportLastYear = async (req, res) => {
  try {
    const usersValid = ["admin"];
    if (!usersValid.includes(req.user.role)) {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    const report = await advisoryService.getReportLastYear();
    return res.status(200).send(report);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// 📌 Reporte en un rango de fechas personalizado (solo admin)
exports.getAdvisoryReportByDateRange = async (req, res) => {
  try {
    const usersValid = ["admin"];
    if (!usersValid.includes(req.user.role)) {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .send({ message: "Las fechas de inicio y fin son obligatorias" });
    }

    const report = await advisoryService.getReportByDateRange(startDate, endDate);
    return res.status(200).send(report);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// 📌 Reporte del usuario con más asesorías asignadas (solo admin)
exports.getMostActiveAdvisor = async (req, res) => {
  try {
    const usersValid = ["admin"];
    if (!usersValid.includes(req.user.role)) {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    const report = await advisoryService.getMostActiveAdvisor();
    res.status(200).send(report);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// 📌 Reporte de las carreras con más asesorías (solo admin)
exports.getTopCareersReport = async (req, res) => {
  try {
    const usersValid = ["admin"];
    if (!usersValid.includes(req.user.role)) {
      return handlerError(res, 403, errorsConstants.unauthorized);
    }

    const report = await advisoryService.getTopCareers();
    res.status(200).send(report);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};

// controller/advisoryController.js
exports.getAdvisoriesThisWeek = async (req, res) => {
  try {
    const advisories = await advisoryService.getAdvisoriesThisWeek();
    return res.status(200).send(advisories);
  } catch (error) {
    return handlerError(res, 500, errorsConstants.serverError);
  }
};
 


