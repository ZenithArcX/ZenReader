import React from 'react';
import { AppSettings } from '../storage/db';
import { themes } from '../theme/colors';

interface Props {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  settings: AppSettings;
  onSettingsChange: (newSettings: Partial<AppSettings>) => void;
  isLocked: boolean;
  onToggleLock: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const Controls: React.FC<Props> = ({
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  settings,
  onSettingsChange,
  isLocked,
  onToggleLock,
  isFullscreen,
  onToggleFullscreen
}) => {
  const currentTheme = themes[settings.theme] || themes.light;

  const btnStyle: React.CSSProperties = {
    padding: '8px 10px',
    fontSize: '13px',
    cursor: 'pointer',
    borderRadius: '8px',
    border: `1px solid ${currentTheme.border}`,
    background: currentTheme.btnBg,
    color: currentTheme.btnText,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    flex: '1 1 auto',
    minWidth: '60px',
    boxSizing: 'border-box'
  };

  const selectStyle: React.CSSProperties = {
    padding: '5px 8px',
    borderRadius: '6px',
    border: `1px solid ${currentTheme.border}`,
    background: currentTheme.btnBg,
    color: currentTheme.btnText,
    fontSize: '13px',
    maxWidth: '100%',
    boxSizing: 'border-box'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      alignItems: 'center',
      padding: '12px 14px',
      background: currentTheme.controlBg,
      borderRadius: '12px',
      border: `1px solid ${currentTheme.border}`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Action Buttons Row */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%'
      }}>
        <button onClick={onPrev} style={btnStyle} title="Previous word/sentence">Prev</button>
        <button onClick={onPlayPause} style={{ ...btnStyle, minWidth: '70px', fontWeight: 600 }} title="Play or Pause">
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button onClick={onNext} style={btnStyle} title="Next word/sentence">Next</button>
        
        <button 
          onClick={onToggleLock} 
          style={{ 
            ...btnStyle, 
            background: isLocked ? currentTheme.btnBg : currentTheme.btnBg,
            color: isLocked ? '#ef4444' : currentTheme.btnText,
            borderColor: isLocked ? '#ef4444' : currentTheme.border
          }}
          title="Prevent accidental screen touches while reading"
        >
          {isLocked ? '🔒 Locked' : '🔓 Lock'}
        </button>

        <button 
          onClick={onToggleFullscreen} 
          style={btnStyle}
          title="Toggle Fullscreen / Maximise View"
        >
          {isFullscreen ? '⛶ Window' : '⛶ Maximise'}
        </button>
      </div>
      
      {/* Settings Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%'
      }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', whiteSpace: 'nowrap' }}>
          <span>WPM: <strong>{settings.wpm}</strong></span>
          <input
            type="range"
            min={50}
            max={1000}
            step={10}
            value={settings.wpm}
            onChange={(e) => onSettingsChange({ wpm: parseInt(e.target.value, 10) })}
            style={{ width: '85px', accentColor: settings.focusColor }}
          />
        </label>
        
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', whiteSpace: 'nowrap' }}>
          Theme:
          <select
            value={settings.theme}
            onChange={(e) => onSettingsChange({ theme: e.target.value as any })}
            style={selectStyle}
          >
            <option value="amoled">Amoled</option>
            <option value="dark">Dark</option>
            <option value="sepia">Sepia</option>
            <option value="light">Light</option>
          </select>
        </label>
        
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', whiteSpace: 'nowrap' }}>
          Mode:
          <select
            value={settings.readingMode}
            onChange={(e) => onSettingsChange({ readingMode: e.target.value as 'sentence' | 'word' })}
            style={selectStyle}
          >
            <option value="sentence">Sentence</option>
            <option value="word">Word</option>
          </select>
        </label>
      </div>

      <div style={{ fontSize: '11px', opacity: 0.65, textAlign: 'center' }}>
        💡 <em>Tap center text area to hide controls</em>
      </div>
    </div>
  );
};
