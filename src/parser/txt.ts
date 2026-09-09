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
  const sentences = splitIntoSentences(text);
  const pages: ReaderPage[] = [];
  const MAX_SENTENCES_PER_PAGE = 25;

  if (sentences.length === 0) {
    return {
      title,
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
    title,
    pages,
    totalSentences: sentences.length
  };
}
