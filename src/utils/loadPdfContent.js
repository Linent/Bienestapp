const axios = require('axios');
const pdfParse = require('pdf-parse');

const loadPDFContent = async (url) => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data);
  const data = await pdfParse(buffer);
  return data.text;
};

module.exports = {
  loadPDFContent
};
