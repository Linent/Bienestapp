const fs = require('fs/promises');
const pdfParse = require('pdf-parse');

const loadPDFContent = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);
  return data.text; // contenido plano del PDF
};

module.exports = {
  loadPDFContent
};

