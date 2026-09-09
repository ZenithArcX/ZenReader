import JSZip from 'jszip';
import { ReaderDocument, ReaderPage, ReaderSentence } from './txt';
import { splitIntoSentences, splitIntoWords } from '../text/tokenizer';

export async function parseEpub(file: File): Promise<ReaderDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  // 1. Locate OPF file path from container.xml if possible
  let opfPath = '';
  const containerFile = zip.file('META-INF/container.xml');
  
  if (containerFile) {
    const containerXml = await containerFile.async('text');
    const match = containerXml.match(/full-path="([^"]+)"/i);
    if (match) {
      opfPath = match[1];
    }
  }
  
  // Fallback: search for any .opf file in the zip
  if (!opfPath) {
    const opfEntry = Object.keys(zip.files).find(name => name.endsWith('.opf'));
    if (opfEntry) opfPath = opfEntry;
  }

  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  // 2. Parse Manifest & Spine from OPF if available
  const htmlFiles: string[] = [];
  
  if (opfPath && zip.file(opfPath)) {
    try {
      const opfText = await zip.file(opfPath)!.async('text');
      const parser = new DOMParser();
      const opfDoc = parser.parseFromString(opfText, 'application/xml');
      
      // Map item IDs to hrefs
      const manifestItems: Record<string, string> = {};
      const itemNodes = opfDoc.querySelectorAll('manifest > item');
      itemNodes.forEach(node => {
        const id = node.getAttribute('id');
        const href = node.getAttribute('href');
        if (id && href) {
          manifestItems[id] = opfDir + href;
        }
      });
      
      // Order by spine itemref
      const itemrefNodes = opfDoc.querySelectorAll('spine > itemref');
      itemrefNodes.forEach(node => {
        const idref = node.getAttribute('idref');
        if (idref && manifestItems[idref]) {
          htmlFiles.push(manifestItems[idref]);
        }
      });
    } catch (err) {
      console.warn('Failed parsing OPF manifest, falling back to scanning HTML entries:', err);
    }
  }

  // Fallback: collect all html/xhtml/htm files in zip
  if (htmlFiles.length === 0) {
    Object.keys(zip.files).forEach(filename => {
      const lower = filename.toLowerCase();
      if (!zip.files[filename].dir && (lower.endsWith('.html') || lower.endsWith('.xhtml') || lower.endsWith('.htm'))) {
        htmlFiles.push(filename);
      }
    });
    htmlFiles.sort();
  }

  // 3. Extract text content per chapter/page file
  const pages: ReaderPage[] = [];
  let totalSentences = 0;
  const domParser = new DOMParser();

  for (let i = 0; i < htmlFiles.length; i++) {
    const filePath = htmlFiles[i];
    // Standardize zip path lookup
    const zipEntry = zip.file(filePath) || zip.file(decodeURIComponent(filePath));
    if (!zipEntry) continue;

    try {
      const htmlText = await zipEntry.async('text');
      const doc = domParser.parseFromString(htmlText, 'text/html');

      // Remove script and style elements
      doc.querySelectorAll('script, style, noscript').forEach(el => el.remove());

      const rawContent = (doc.body ? doc.body.textContent : doc.documentElement.textContent) || '';
      const cleanText = rawContent.replace(/\s+/g, ' ').trim();

      if (!cleanText) continue;

      const sentences = splitIntoSentences(cleanText);
      if (sentences.length === 0) continue;

      const MAX_SENTENCES_PER_PAGE = 25;
      for (let sIdx = 0; sIdx < sentences.length; sIdx += MAX_SENTENCES_PER_PAGE) {
        const chunkSentences = sentences.slice(sIdx, sIdx + MAX_SENTENCES_PER_PAGE);
        const readerSentences: ReaderSentence[] = chunkSentences.map(s => ({
          text: s,
          words: splitIntoWords(s).map(w => ({ text: w }))
        }));

        const chunkText = chunkSentences.join(' ');
        const snippet = chunkText.length > 120 ? chunkText.substring(0, 120) + '...' : chunkText;

        pages.push({
          pageNumber: pages.length + 1,
          sentences: readerSentences,
          previewSnippet: snippet
        });

        totalSentences += readerSentences.length;
      }
    } catch (err) {
      console.warn(`Error parsing EPUB entry ${filePath}:`, err);
    }
  }

  // Fallback for empty/unreadable EPUBs
  if (pages.length === 0) {
    const fallbackSentence = splitIntoSentences("No readable content could be extracted from this EPUB file.");
    pages.push({
      pageNumber: 1,
      sentences: fallbackSentence.map(s => ({
        text: s,
        words: splitIntoWords(s).map(w => ({ text: w }))
      })),
      previewSnippet: "No readable content found"
    });
    totalSentences = 1;
  }

  return {
    title: file.name,
    pages,
    totalSentences
  };
}
