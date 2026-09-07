import React, { useEffect, useRef, useState } from 'react';
import { FocusWord } from './FocusWord';
import { ReaderDocument } from '../parser/txt';
import { AppSettings, ShelfItem } from '../storage/db';
import { Controls } from './Controls';
import { themes } from '../theme/colors';
import { PageSelectorModal } from './PageSelectorModal';
import { speakWord, stopSpeech, isScannedPlaceholder } from '../utils/tts';

interface Props {
  document: ReaderDocument;
  initialProgress: Pick<ShelfItem, 'currentPage' | 'currentSentence' | 'currentWord'>;
  settings: AppSettings;
  onSettingsChange: (newSettings: Partial<AppSettings>) => void;
  onProgressUpdate: (progress: Pick<ShelfItem, 'currentPage' | 'currentSentence' | 'currentWord'>) => void;
  onClose: () => void;
}

export const ReaderView: React.FC<Props> = ({
  document,
  initialProgress,
  settings,
  onSettingsChange,
  onProgressUpdate,
  onClose
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [pageIdx, setPageIdx] = useState(initialProgress.currentPage);
  const [sentenceIdx, setSentenceIdx] = useState(initialProgress.currentSentence);
  const [wordIdx, setWordIdx] = useState(initialProgress.currentWord);
  const [showPageModal, setShowPageModal] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!window.document.fullscreenElement);
    };
    window.document.addEventListener('fullscreenchange', handleFSChange);
    return () => window.document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  const toggleFullscreen = () => {
    if (!window.document.fullscreenElement) {
      window.document.documentElement.requestFullscreen().catch(() => {});
    } else {
      window.document.exitFullscreen().catch(() => {});
    }
  };
  
  const page = document.pages[pageIdx];
  const sentence = page?.sentences[sentenceIdx];
  
  // Step size: 2 words at a time in Sentence Mode, 1 word in Word Mode
  const stepSize = settings.readingMode === 'sentence' ? 2 : 1;

  const handleNext = () => {
    if (!page || !sentence) return false;
    
    if (wordIdx + stepSize < sentence.words.length) {
      setWordIdx(w => w + stepSize);
      return true;
    }
    
    if (sentenceIdx + 1 < page.sentences.length) {
      setSentenceIdx(s => s + 1);
      setWordIdx(0);
      return true;
    }
    
    if (pageIdx + 1 < document.pages.length) {
      setPageIdx(p => p + 1);
      setSentenceIdx(0);
      setWordIdx(0);
      return true;
    }
    
    return false;
  };
  
  const handlePrev = () => {
    if (!page || !sentence) return;
    
    if (wordIdx >= stepSize) {
      setWordIdx(w => w - stepSize);
      return;
    }
    
    if (sentenceIdx > 0) {
      const prevSentence = page.sentences[sentenceIdx - 1];
      setSentenceIdx(s => s - 1);
      setWordIdx(prevSentence ? Math.max(0, prevSentence.words.length - stepSize) : 0);
      return;
    }
    
    if (pageIdx > 0) {
      const prevPage = document.pages[pageIdx - 1];
      const lastSentence = prevPage?.sentences[prevPage.sentences.length - 1];
      setPageIdx(p => p - 1);
      setSentenceIdx(prevPage ? Math.max(0, prevPage.sentences.length - 1) : 0);
      setWordIdx(lastSentence ? Math.max(0, lastSentence.words.length - stepSize) : 0);
    }
  };

  const handleNextSentence = () => {
    if (!page) return;
    if (sentenceIdx + 1 < page.sentences.length) {
      setSentenceIdx(s => s + 1);
      setWordIdx(0);
    } else if (pageIdx + 1 < document.pages.length) {
      setPageIdx(p => p + 1);
      setSentenceIdx(0);
      setWordIdx(0);
    } else {
      setIsPlaying(false);
      stopSpeech();
    }
  };

  const handlePrevSentence = () => {
    if (!page) return;
    if (sentenceIdx > 0) {
      setSentenceIdx(s => s - 1);
      setWordIdx(0);
    } else if (pageIdx > 0) {
      const prevPage = document.pages[pageIdx - 1];
      setPageIdx(p => p - 1);
      setSentenceIdx(prevPage ? Math.max(0, prevPage.sentences.length - 1) : 0);
      setWordIdx(0);
    }
  };
  
  const advance = () => {
    const success = handleNext();
    if (!success) {
      setIsPlaying(false);
      stopSpeech();
    }
  };
  
  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          setIsPlaying(p => {
            if (p) stopSpeech();
            return !p;
          });
          break;
        case 'ArrowRight':
          e.preventDefault();
          stopSpeech();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          stopSpeech();
          handlePrev();
          break;
        case 'ArrowDown':
          e.preventDefault();
          stopSpeech();
          handleNextSentence();
          break;
        case 'ArrowUp':
          e.preventDefault();
          stopSpeech();
          handlePrevSentence();
          break;
        case 'Escape':
          e.preventDefault();
          if (isFocusMode) {
            setIsFocusMode(false);
          } else {
            stopSpeech();
            onClose();
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageIdx, sentenceIdx, wordIdx, settings.readingMode, document, isFocusMode]);
  
  // Save progress
  useEffect(() => {
    onProgressUpdate({ currentPage: pageIdx, currentSentence: sentenceIdx, currentWord: wordIdx });
  }, [pageIdx, sentenceIdx, wordIdx]);
  
  // Playback & Speech Engine Loop
  useEffect(() => {
    if (!isPlaying || !sentence) {
      stopSpeech();
      return;
    }

    // Auto-skip scanned page placeholders without reading or halting
    if (isScannedPlaceholder(sentence.text)) {
      const timer = setTimeout(() => {
        handleNextSentence();
      }, 400);
      return () => clearTimeout(timer);
    }

    if (settings.ttsEnabled) {
      // Audio ON: Speak current active phrase (2 words in Sentence Mode, 1 word in Word Mode)
      const currentPhraseText = sentence.words
        .slice(wordIdx, wordIdx + stepSize)
        .map(w => w.text)
        .join(' ');

      if (currentPhraseText) {
        speakWord(currentPhraseText, {
          voiceURI: settings.ttsVoiceURI,
          pitch: settings.ttsPitch,
          rate: settings.ttsRate
        });
      }

      // Visual chunk advancement timer driven by Voice Speed (ttsRate)
      const msPerChunk = Math.max(180, Math.round((380 * stepSize) / settings.ttsRate));
      timeoutRef.current = window.setTimeout(() => {
        advance();
      }, msPerChunk);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    } else {
      // Audio OFF: Visual RSVP WPM timer loop
      const msPerChunk = Math.round((60000 * stepSize) / settings.wpm);
      timeoutRef.current = window.setTimeout(() => {
        advance();
      }, msPerChunk);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [
    isPlaying,
    pageIdx,
    sentenceIdx,
    wordIdx,
    stepSize,
    settings.readingMode,
    settings.ttsEnabled,
    settings.ttsVoiceURI,
    settings.ttsPitch,
    settings.ttsRate,
    settings.wpm
  ]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => stopSpeech();
  }, []);

  if (!page || !sentence) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Finished Reading!</div>;
  }
  
  const currentTheme = themes[settings.theme] || themes.light;
  const hideControls = isFocusMode || isLocked;

  // Active 2-word chunk calculation for Sentence Mode
  const currentChunkIdx = Math.floor(wordIdx / 2);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: currentTheme.bg,
      color: currentTheme.text,
      transition: 'background-color 0.2s, color 0.2s',
      position: 'relative',
      userSelect: 'none',
      overflow: 'hidden'
    }}>
      {/* Transparent Mistouch Lock Touch Blocker & Subtle Non-distracting Unlock Pill */}
      {isLocked && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9998,
              background: 'transparent',
              pointerEvents: 'all'
            }}
          />
          <div style={{
            position: 'fixed',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            pointerEvents: 'all'
          }}>
            <button
              onClick={() => setIsLocked(false)}
              style={{
                padding: '5px 14px',
                borderRadius: '20px',
                border: `1px solid ${currentTheme.border}`,
                background: currentTheme.controlBg,
                color: currentTheme.subtext,
                fontSize: '12px',
                cursor: 'pointer',
                opacity: 0.65,
                transition: 'opacity 0.2s ease, transform 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.65')}
            >
              🔒 Tap to unlock
            </button>
          </div>
        </>
      )}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxWidth: settings.readingWidth,
        margin: '0 auto',
        padding: '12px 16px',
        boxSizing: 'border-box'
      }}>
        {/* Top Header Bar (Hidden in Focus/Locked Mode) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          opacity: hideControls ? 0 : 1,
          pointerEvents: hideControls ? 'none' : 'auto',
          transition: 'opacity 0.25s ease',
          flexWrap: 'nowrap'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: 'clamp(0.95rem, 3.5vw, 1.25rem)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '35%'
          }}>
            {document.title}
          </h2>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            <button
              onClick={() => {
                setIsPlaying(false);
                stopSpeech();
                setShowPageModal(true);
              }}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: `1px solid ${currentTheme.border}`,
                background: currentTheme.controlBg,
                color: currentTheme.text,
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              📖 P.{page.pageNumber}/{document.pages.length}
            </button>

            <span style={{ color: currentTheme.subtext, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
              S.{sentenceIdx + 1}/{page.sentences.length}
            </span>

            <button onClick={() => {
              stopSpeech();
              onClose();
            }} style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: `1px solid ${currentTheme.border}`,
              background: currentTheme.btnBg,
              color: currentTheme.btnText,
              cursor: 'pointer',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap'
            }}>Close</button>
          </div>
        </div>
        
        {/* Main Reading Center (Tap toggles focus mode) */}
        <div 
          onClick={() => {
            if (!isLocked) setIsFocusMode(!isFocusMode);
          }}
          title="Tap anywhere to hide/show navigation controls"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `clamp(18px, ${settings.fontSize}px, 48px)`,
            lineHeight: settings.lineHeight,
            cursor: 'pointer',
            padding: '12px',
            borderRadius: '12px',
            transition: 'background 0.2s ease',
            overflow: 'hidden'
          }}
        >
          {settings.readingMode === 'word' ? (
            <div style={{ fontSize: '1.8em', maxWidth: '100%', textAlign: 'center' }}>
               {sentence.words[wordIdx] && (
                 <FocusWord word={sentence.words[wordIdx].text} focusColor={settings.focusColor} />
               )}
            </div>
          ) : (
            <div style={{
              textAlign: 'left',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px 8px',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: '100%'
            }}>
              {sentence.words.map((w, i) => {
                // Highlight 2-word phrase chunks together in Sentence Mode
                const isHighlighted = Math.floor(i / 2) === currentChunkIdx;
                return (
                  <span key={i} style={{ 
                    opacity: isHighlighted ? 1 : 0.28,
                    background: isHighlighted ? currentTheme.controlBg : 'transparent',
                    border: `1px solid ${isHighlighted ? currentTheme.border : 'transparent'}`,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    transition: 'opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1), background 0.22s ease, border-color 0.22s ease, transform 0.22s ease',
                    transform: isHighlighted ? 'scale(1.04)' : 'scale(1.0)',
                    display: 'inline-block'
                  }}>
                    <FocusWord word={w.text} focusColor={settings.focusColor} />
                  </span>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Bottom Controls Bar (Hidden in Focus/Locked Mode) */}
        <div style={{
          opacity: hideControls ? 0 : 1,
          pointerEvents: hideControls ? 'none' : 'auto',
          transition: 'opacity 0.25s ease',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <Controls 
            isPlaying={isPlaying}
            onPlayPause={() => {
              setIsPlaying(p => {
                if (p) stopSpeech();
                return !p;
              });
            }}
            onNext={() => {
              stopSpeech();
              handleNext();
            }}
            onPrev={() => {
              stopSpeech();
              handlePrev();
            }}
            settings={settings}
            onSettingsChange={onSettingsChange}
            isLocked={isLocked}
            onToggleLock={() => setIsLocked(!isLocked)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
          />
        </div>
      </div>

      {showPageModal && (
        <PageSelectorModal
          doc={document}
          theme={currentTheme}
          initialPageIdx={pageIdx}
          onSelectPage={(newIdx) => {
            stopSpeech();
            setPageIdx(newIdx);
            setSentenceIdx(0);
            setWordIdx(0);
            setShowPageModal(false);
          }}
          onClose={() => setShowPageModal(false)}
        />
      )}
    </div>
  );
};
