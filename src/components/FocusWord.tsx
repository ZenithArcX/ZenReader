import React from 'react';
import { getFocusWord } from '../text/focus';

interface Props {
  word: string;
  focusColor: string;
}

export const FocusWord: React.FC<Props> = ({ word, focusColor }) => {
  const { prefix, focus, suffix } = getFocusWord(word);
  
  return (
    <span className="focus-word" style={{ whiteSpace: 'pre' }}>
      {prefix}
      <span style={{ color: focusColor, fontWeight: 'bold' }}>{focus}</span>
      {suffix}
    </span>
  );
};
