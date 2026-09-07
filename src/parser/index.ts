import { parseTxt, ReaderDocument } from './txt';

export async function parseDocument(file: File): Promise<ReaderDocument> {
  const type = file.type;
  const name = file.name.toLowerCase();
  
  if (name.endsWith('.pdf') || type === 'application/pdf') {
    const { parsePdf } = await import('./pdf');
    return parsePdf(file);
  }
  
  if (name.endsWith('.docx') || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const { parseDocx } = await import('./docx');
    return parseDocx(file);
  }
  
  if (name.endsWith('.epub') || type === 'application/epub+zip') {
    const { parseEpub } = await import('./epub');
    return parseEpub(file);
  }
  
  if (name.endsWith('.doc') || type === 'application/msword') {
    throw new Error('Legacy .doc format is not supported locally. Please convert to .docx or .pdf.');
  }
  
  // Default to text
  const text = await file.text();
  return parseTxt(text, file.name);
}
