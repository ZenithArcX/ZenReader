import { ReaderDocument, ReaderPage, ReaderSentence } from './txt';
import { splitIntoSentences, splitIntoWords } from '../text/tokenizer';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function parsePdf(file: File): Promise<ReaderDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const pages: ReaderPage[] = [];
  let totalSentences = 0;
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    const textItems = textContent.items.map((item: any) => item.str);
    const rawText = textItems.join(' ').trim();
    
    let sentences = splitIntoSentences(rawText);

    // Handling scanned/image-only PDF pages gracefully
    if (sentences.length === 0) {
      sentences = [`[Scanned Page ${i}: No extractable text layer found on this page.]`];
    }
    
    const readerSentences: ReaderSentence[] = sentences.map(s => {
      return {
        text: s,
        words: splitIntoWords(s).map(w => ({ text: w }))
      };
    });

    const snippet = rawText.length > 0 
      ? (rawText.length > 120 ? rawText.substring(0, 120) + '...' : rawText)
      : `[Scanned / Image Page ${i}]`;
    
    pages.push({
      pageNumber: i,
      sentences: readerSentences,
      previewSnippet: snippet
    });
    
    totalSentences += readerSentences.length;
  }
  
  return {
    title: file.name,
    pages,
    totalSentences
  };
}
