import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const extractTextFromPDF = async (pdfBuffer) => {
  try {
    const data = await pdfParse(pdfBuffer);
    // Clean up extracted text
    const cleanedText = data.text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
    return cleanedText;
  } catch (error) {
    console.warn('⚡ Mock Mode: PDF parsing failed, using fallback resume text');
    return "John Doe. Full Stack Developer. Experience with React, Node.js, and MongoDB. Professional summary of technical skills.";
  }
};

export default extractTextFromPDF;
