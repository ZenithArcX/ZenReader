import React, { useEffect, useRef, useState } from 'react';
import { FocusWord } from './FocusWord';
import { ReaderDocument } from '../parser/txt';
import { AppSettings, ShelfItem } from '../storage/db';
import { Controls } from './Controls';
import { themes } from '../theme/colors';
import { PageSelectorModal } from './PageSelectorModal';

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
    }
  };
  
  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          setIsPlaying(p => !p);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrev();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleNextSentence();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handlePrevSentence();
          break;
        case 'Escape':
          e.preventDefault();
          if (isFocusMode) {
            setIsFocusMode(false);
          } else {
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
  
  // Playback loop
  useEffect(() => {
    if (isPlaying) {
      const msPerWord = 60000 / settings.wpm;
      
      timeoutRef.current = window.setTimeout(() => {
        advance();
      }, msPerWord);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying, pageIdx, sentenceIdx, wordIdx, settings.wpm, settings.readingMode]);
  
  if (!page || !sentence) {
    return <div>Finished!</div>;
  }
  
  const currentTheme = themes[settings.theme] || themes.light;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: currentTheme.bg,
      color: currentTheme.text,
      transition: 'background-color 0.2s, color 0.2s',
      position: 'relative',
      userSelect: 'none'
    }}>
      {/* Mistouch Lock Overlay */}
      {isLocked && (
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.2)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            paddingTop: '20px'
          }}
        >
          <button
            onClick={() => setIsLocked(false)}
            style={{
              padding: '10px 24px',
              borderRadius: '30px',
              border: '2px solid #ef4444',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(239, 68, 68, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🔒 Mistouch Lock Active — Tap to Unlock
          </button>
        </div>
      )}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxWidth: settings.readingWidth,
        margin: '0 auto',
        padding: '24px',
        boxSizing: 'border-box'
      }}>
        {/* Top Bar (Hidden in Focus Mode) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          opacity: isFocusMode ? 0 : 1,
          pointerEvents: isFocusMode ? 'none' : 'auto',
          transition: 'opacity 0.25s ease'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '40%' }}>{document.title}</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => {
                setIsPlaying(false);
                setShowPageModal(true);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: `1px solid ${currentTheme.border}`,
                background: currentTheme.controlBg,
                color: currentTheme.text,
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              📖 Page {page.pageNumber} / {document.pages.length} (Jump)
            </button>
            <span style={{ color: currentTheme.subtext, fontSize: '0.85rem' }}>
              Sentence {sentenceIdx + 1} / {page.sentences.length}
            </span>
            <button onClick={onClose} style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: `1px solid ${currentTheme.border}`,
              background: currentTheme.btnBg,
              color: currentTheme.btnText,
              cursor: 'pointer',
              fontSize: '0.85rem'
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
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            cursor: 'pointer',
            padding: '20px',
            borderRadius: '12px',
            transition: 'background 0.2s ease'
          }}
        >
          {settings.readingMode === 'word' ? (
            <div style={{ fontSize: '2em' }}>
               {sentence.words[wordIdx] && (
                 <FocusWord word={sentence.words[wordIdx].text} focusColor={settings.focusColor} />
               )}
            </div>
          ) : (
            <div style={{ textAlign: 'left', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {sentence.words.map((w, i) => {
                const isActive = i === wordIdx;
                return (
                  <span key={i} style={{ 
                    opacity: isActive ? 1 : 0.35,
                    background: isActive ? currentTheme.controlBg : 'transparent',
                    border: `1px solid ${isActive ? currentTheme.border : 'transparent'}`,
                    padding: '3px 7px',
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
        
        {/* Bottom Controls Bar (Hidden in Focus Mode) */}
        <div style={{
          opacity: isFocusMode ? 0 : 1,
          pointerEvents: isFocusMode ? 'none' : 'auto',
          transition: 'opacity 0.25s ease'
        }}>
          <Controls 
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onNext={handleNext}
            onPrev={handlePrev}
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
