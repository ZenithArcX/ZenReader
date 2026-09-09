import * as mammoth from 'mammoth';
import { ReaderDocument, ReaderPage, ReaderSentence } from './txt';
import { splitIntoSentences, splitIntoWords } from '../text/tokenizer';

export async function parseDocx(file: File): Promise<ReaderDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  
  const text = result.value;
  const sentences = splitIntoSentences(text);
  const pages: ReaderPage[] = [];
  const MAX_SENTENCES_PER_PAGE = 25;

  if (sentences.length === 0) {
    return {
      title: file.name,
      pages: [{ pageNumber: 1, sentences: [], previewSnippet: 'Empty document' }],
      totalSentences: 0
    };
  }

  for (let i = 0; i < sentences.length; i += MAX_SENTENCES_PER_PAGE) {
    const chunk = sentences.slice(i, i + MAX_SENTENCES_PER_PAGE);
    const readerSentences: ReaderSentence[] = chunk.map(s => ({
      text: s,
      words: splitIntoWords(s).map(w => ({ text: w }))
    }));
    const chunkText = chunk.join(' ');
    const snippet = chunkText.length > 120 ? chunkText.substring(0, 120) + '...' : chunkText;

    pages.push({
      pageNumber: pages.length + 1,
      sentences: readerSentences,
      previewSnippet: snippet
    });
  }

  return {
    title: file.name,
    pages,
    totalSentences: sentences.length
  };
}
