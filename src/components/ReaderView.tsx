import React, { useEffect, useRef, useState } from 'react';
import { FocusWord } from './FocusWord';
import { ReaderDocument } from '../parser/txt';
import { AppSettings, ShelfItem } from '../storage/db';
import { Controls } from './Controls';
import { themes } from '../theme/colors';
import { PageSelectorModal } from './PageSelectorModal';
import { speakSentence, speakWord, stopSpeech, isScannedPlaceholder } from '../utils/tts';

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
  const spokenSentenceKeyRef = useRef<string>('');

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
  
  const handleNext = () => {
    if (!page || !sentence) return false;
    
    if (wordIdx + 1 < sentence.words.length) {
      setWordIdx(w => w + 1);
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
    
    if (wordIdx > 0) {
      setWordIdx(w => w - 1);
      return;
    }
    
    if (sentenceIdx > 0) {
      const prevSentence = page.sentences[sentenceIdx - 1];
      setSentenceIdx(s => s - 1);
      setWordIdx(prevSentence ? Math.max(0, prevSentence.words.length - 1) : 0);
      return;
    }
    
    if (pageIdx > 0) {
      const prevPage = document.pages[pageIdx - 1];
      const lastSentence = prevPage?.sentences[prevPage.sentences.length - 1];
      setPageIdx(p => p - 1);
      setSentenceIdx(prevPage ? Math.max(0, prevPage.sentences.length - 1) : 0);
      setWordIdx(lastSentence ? Math.max(0, lastSentence.words.length - 1) : 0);
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
          spokenSentenceKeyRef.current = '';
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          stopSpeech();
          spokenSentenceKeyRef.current = '';
          handlePrev();
          break;
        case 'ArrowDown':
          e.preventDefault();
          stopSpeech();
          spokenSentenceKeyRef.current = '';
          handleNextSentence();
          break;
        case 'ArrowUp':
          e.preventDefault();
          stopSpeech();
          spokenSentenceKeyRef.current = '';
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
      spokenSentenceKeyRef.current = '';
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
      const currentSentenceKey = `${pageIdx}-${sentenceIdx}-${settings.ttsRate}-${settings.ttsVoiceURI}-${settings.ttsPitch}`;
      
      // Trigger full sentence speech audio once per sentence/setting change
      if (spokenSentenceKeyRef.current !== currentSentenceKey) {
        spokenSentenceKeyRef.current = currentSentenceKey;
        
        if (settings.readingMode === 'sentence') {
          speakSentence(sentence.text, {
            voiceURI: settings.ttsVoiceURI,
            pitch: settings.ttsPitch,
            rate: settings.ttsRate,
            onWordBoundary: (charIndex: number) => {
              if (!sentence || !sentence.words) return;
              let accumLen = 0;
              for (let i = 0; i < sentence.words.length; i++) {
                const wordLen = sentence.words[i].text.length;
                if (charIndex >= accumLen && charIndex <= accumLen + wordLen + 2) {
                  setWordIdx(i);
                  break;
                }
                accumLen += wordLen + 1;
              }
            }
          });
        }
      }

      if (settings.readingMode === 'word') {
        // Word Mode with Audio ON: speak individual word
        const currentWordObj = sentence.words[wordIdx];
        if (currentWordObj && currentWordObj.text) {
          speakWord(currentWordObj.text, {
            voiceURI: settings.ttsVoiceURI,
            pitch: settings.ttsPitch,
            rate: settings.ttsRate
          });
        }
      }

      // Visual highlight advancement timer driven by Voice Speed (ttsRate)
      // 1.0x rate = ~380ms per word
      const msPerWord = Math.max(100, Math.round(380 / settings.ttsRate));
      timeoutRef.current = window.setTimeout(() => {
        advance();
      }, msPerWord);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    } else {
      spokenSentenceKeyRef.current = '';
      // Audio OFF: Pure visual RSVP WPM timer loop
      const msPerWord = Math.round(60000 / settings.wpm);
      timeoutRef.current = window.setTimeout(() => {
        advance();
      }, msPerWord);

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
                const isActive = i === wordIdx;
                return (
                  <span key={i} style={{ 
                    opacity: isActive ? 1 : 0.35,
                    background: isActive ? currentTheme.controlBg : 'transparent',
                    border: `1px solid ${isActive ? currentTheme.border : 'transparent'}`,
                    padding: '2px 6px',
                    borderRadius: '5px',
                    transition: 'opacity 0.12s ease, background 0.12s ease',
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
              spokenSentenceKeyRef.current = '';
              handleNext();
            }}
            onPrev={() => {
              stopSpeech();
              spokenSentenceKeyRef.current = '';
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
            spokenSentenceKeyRef.current = '';
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
