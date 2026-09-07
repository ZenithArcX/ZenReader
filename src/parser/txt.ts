import { splitIntoSentences, splitIntoWords } from '../text/tokenizer';

export interface ReaderWord {
  text: string;
}

export interface ReaderSentence {
  text: string;
  words: ReaderWord[];
}

export interface ReaderPage {
  pageNumber: number;
  sentences: ReaderSentence[];
  previewSnippet?: string;
}

export interface ReaderDocument {
  title: string;
  pages: ReaderPage[];
  totalSentences: number;
}

export function parseTxt(text: string, title: string): ReaderDocument {
  // A simple TXT parser treats the whole text as a single page
  const sentences = splitIntoSentences(text);
  
  const readerSentences: ReaderSentence[] = sentences.map(s => {
    return {
      text: s,
      words: splitIntoWords(s).map(w => ({ text: w }))
    };
  });
  
  const snippet = text.trim().length > 120 ? text.trim().substring(0, 120) + '...' : text.trim();

  return {
    title,
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
