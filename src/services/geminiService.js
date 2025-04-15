const { GoogleGenerativeAI } = require ("@google/generative-ai");
const { GEMINI_API_KEY } = require ("../config/config.js"); // Asegúrate que exportas la constante correctamente

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const askGemini = async (question, knowledgeBase) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

  const result = await model.generateContent([
    "Actúa como un asistente académico que responde preguntas sobre los servicios de Bienestar Universitario de la UFPS con base en la siguiente información. No debes mencionar que esta información proviene de un documento PDF.\n\n" +
    knowledgeBase,
    `Responde de manera formal. Si puedes, guía al estudiante para:
  - acceder al servicio,
  - agendar una cita,
  - o consultar el sitio web oficial: https://ww2.ufps.edu.co/vicerrectoria/vice_bienestar_universitario/1676.
    
  Si no encuentras una respuesta, responde con amabilidad y recomienda contactar directamente al área de Bienestar.
  
  Pregunta del estudiante: ${question}`
  ]);

  const response = result.response;
  return response.text();
};

module.exports = askGemini;

