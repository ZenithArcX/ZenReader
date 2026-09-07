// src/utils/tts.ts

export interface VoiceOption {
  name: string;
  lang: string;
  voiceURI: string;
  default: boolean;
}

let cachedVoices: SpeechSynthesisVoice[] = [];

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    cachedVoices = voices;
  }
  return cachedVoices;
}

export function subscribeVoices(callback: (voices: SpeechSynthesisVoice[]) => void): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return () => {};
  }

  const update = () => {
    const voices = getAvailableVoices();
    callback(voices);
  };

  update();

  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = update;
  }

  return () => {
    if (window.speechSynthesis.onvoiceschanged === update) {
      window.speechSynthesis.onvoiceschanged = null;
    }
  };
}

export function isScannedPlaceholder(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  return (
    lower.includes('scanned page') ||
    lower.includes('no extractable text layer') ||
    lower.includes('[scanned')
  );
}

export function calculateRateFromWpm(wpm: number): number {
  // Baseline: ~160 WPM = 1.0x rate
  const rate = wpm / 160;
  return Math.min(Math.max(rate, 0.5), 3.5);
}

export function speakSentence(
  sentenceText: string,
  options: {
    voiceURI?: string;
    pitch?: number;
    rate?: number;
    wpm?: number;
    onWordBoundary?: (wordCharIndex: number) => void;
    onEnd?: () => void;
    onError?: () => void;
  }
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  window.speechSynthesis.cancel(); // Stop any ongoing speech

  if (!sentenceText.trim() || isScannedPlaceholder(sentenceText)) {
    if (options.onEnd) options.onEnd();
    return null;
  }

  const utterance = new SpeechSynthesisUtterance(sentenceText);
  const voices = getAvailableVoices();

  if (options.voiceURI) {
    const selectedVoice = voices.find(v => v.voiceURI === options.voiceURI);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  }

  utterance.pitch = options.pitch ?? 1.0;
  
  if (options.rate !== undefined && options.rate !== 1.0) {
    utterance.rate = options.rate;
  } else if (options.wpm) {
    utterance.rate = calculateRateFromWpm(options.wpm);
  } else {
    utterance.rate = 1.0;
  }

  if (options.onWordBoundary) {
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        options.onWordBoundary!(event.charIndex);
      }
    };
  }

  if (options.onEnd) {
    utterance.onend = () => options.onEnd!();
  }

  if (options.onError) {
    utterance.onerror = () => options.onError!();
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function speakWord(
  wordText: string,
  options: {
    voiceURI?: string;
    pitch?: number;
    rate?: number;
    wpm?: number;
    onEnd?: () => void;
  }
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  window.speechSynthesis.cancel();

  if (!wordText.trim() || isScannedPlaceholder(wordText)) {
    if (options.onEnd) options.onEnd();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(wordText);
  const voices = getAvailableVoices();

  if (options.voiceURI) {
    const selectedVoice = voices.find(v => v.voiceURI === options.voiceURI);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  }

  utterance.pitch = options.pitch ?? 1.0;
  
  if (options.rate !== undefined && options.rate !== 1.0) {
    utterance.rate = options.rate;
  } else if (options.wpm) {
    utterance.rate = calculateRateFromWpm(options.wpm);
  } else {
    utterance.rate = 1.0;
  }

  if (options.onEnd) {
    utterance.onend = options.onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
