import fs from 'fs/promises';
import pdfParse from 'pdf-parse';

export const loadPDFContent = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);
  return data.text; // contenido plano del PDF
};
