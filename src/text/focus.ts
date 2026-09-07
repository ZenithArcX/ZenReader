// focus.ts

export interface FocusWord {
  prefix: string;
  focus: string;
  suffix: string;
}

export function getFocusWord(word: string): FocusWord {
  // Punctuation should not affect the calculation.
  // We'll strip common punctuation from the start and end to find the "core" word.
  const match = word.match(/^([^\w\s]*)(.*?)([^\w\s]*)$/);
  
  if (!match) {
    return { prefix: '', focus: word, suffix: '' };
  }
  
  const [, startPunct, core, endPunct] = match;
  
  if (!core) {
    return { prefix: startPunct, focus: '', suffix: endPunct };
  }
  
  const len = core.length;
  
  let focusStart = 0;
  let focusEnd = 0;
  
  if (len === 1) {
    focusStart = 0;
    focusEnd = 1;
  } else if (len % 2 === 1) {
    // Odd length
    focusStart = Math.floor(len / 2);
    focusEnd = focusStart + 1;
  } else {
    // Even length
    focusStart = (len / 2) - 1;
    focusEnd = focusStart + 2;
  }
  
  const prefix = startPunct + core.substring(0, focusStart);
  const focus = core.substring(focusStart, focusEnd);
  const suffix = core.substring(focusEnd) + endPunct;
  
  return { prefix, focus, suffix };
}
