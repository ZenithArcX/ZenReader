// tokenizer.ts

export function splitIntoSentences(text: string): string[] {
  // A basic sentence splitter that handles common cases.
  // It looks for ., !, ? followed by whitespace or end of string.
  // It tries to ignore common abbreviations (Mr., Mrs., Dr., etc.)
  
  if (!text) return [];
  
  // Normalize whitespace
  const normalized = text.replace(/\s+/g, ' ').trim();
  
  // Regex to split by sentence boundaries.
  // Lookbehind isn't supported in all browsers, but ES2018+ supports it.
  // We'll use a simpler approach: split by punctuation and re-attach if it's an abbreviation.
  
  const rawSplits = normalized.split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/g);
  
  const sentences: string[] = [];
  let current = '';
  
  const abbreviations = /^(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|i\.e|e\.g)\.$/i;
  
  for (const part of rawSplits) {
    if (!current) {
      current = part;
    } else {
      // Check if current ends with an abbreviation
      const words = current.split(' ');
      const lastWord = words[words.length - 1];
      if (abbreviations.test(lastWord)) {
        current += ' ' + part;
      } else {
        sentences.push(current);
        current = part;
      }
    }
  }
  
  if (current) {
    sentences.push(current);
  }
  
  return sentences.filter(s => s.trim().length > 0);
}

export function splitIntoWords(sentence: string): string[] {
  // Split by whitespace
  return sentence.split(/\s+/).filter(w => w.length > 0);
}
