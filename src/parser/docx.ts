import * as mammoth from 'mammoth';
import { ReaderDocument, ReaderSentence } from './txt';
import { splitIntoSentences, splitIntoWords } from '../text/tokenizer';

export async function parseDocx(file: File): Promise<ReaderDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  
  const text = result.value;
  
  const sentences = splitIntoSentences(text);
  const readerSentences: ReaderSentence[] = sentences.map(s => {
    return {
      text: s,
      words: splitIntoWords(s).map(w => ({ text: w }))
    };
  });
  
  const snippet = text.trim().length > 120 ? text.trim().substring(0, 120) + '...' : text.trim();

  return {
    title: file.name,
    pages: [
      {
        pageNumber: 1,
        sentences: readerSentences,
        previewSnippet: snippet
      }
    ],
    totalSentences: readerSentences.length
  };
}
