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

export function calculateRateFromWpm(wpm: number): number {
  // Baseline: ~160 WPM = 1.0x rate
  const rate = wpm / 160;
  return Math.min(Math.max(rate, 0.5), 4.0);
}

export function speakText(
  text: string,
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

  window.speechSynthesis.cancel(); // Stop any ongoing speech

  if (!text.trim()) return;

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = getAvailableVoices();

  if (options.voiceURI) {
    const selectedVoice = voices.find(v => v.voiceURI === options.voiceURI);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  }

  utterance.pitch = options.pitch ?? 1.0;
  
  // Rate: use explicit rate or calculate from WPM
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
