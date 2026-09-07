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

  const btnStyle = {
    padding: '8px 16px',
    fontSize: '15px',
    cursor: 'pointer',
    borderRadius: '6px',
    border: `1px solid ${currentTheme.border}`,
    background: currentTheme.btnBg,
    color: currentTheme.btnText,
    fontWeight: '500' as const,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  };

  const selectStyle = {
    padding: '6px 10px',
    borderRadius: '6px',
    border: `1px solid ${currentTheme.border}`,
    background: currentTheme.btnBg,
    color: currentTheme.btnText,
    fontSize: '14px'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      alignItems: 'center',
      padding: '16px',
      background: currentTheme.controlBg,
      borderRadius: '12px',
      border: `1px solid ${currentTheme.border}`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
    }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={onPrev} style={btnStyle}>Previous</button>
        <button onClick={onPlayPause} style={{ ...btnStyle, minWidth: '80px', justifyContent: 'center' }}>
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button onClick={onNext} style={btnStyle}>Next</button>
        
        <button 
          onClick={onToggleLock} 
          style={{ 
            ...btnStyle, 
            background: isLocked ? '#ef4444' : currentTheme.btnBg,
            color: isLocked ? '#ffffff' : currentTheme.btnText,
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
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <span>Speed: <strong>{settings.wpm} WPM</strong></span>
          <input
            type="range"
            min={50}
            max={1000}
            step={10}
            value={settings.wpm}
            onChange={(e) => onSettingsChange({ wpm: parseInt(e.target.value, 10) })}
            style={{ accentColor: settings.focusColor }}
          />
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
          Theme:
          <select
            value={settings.theme}
            onChange={(e) => onSettingsChange({ theme: e.target.value as any })}
            style={selectStyle}
          >
            <option value="amoled">Amoled (Pitch Black)</option>
            <option value="dark">Dark</option>
            <option value="sepia">Sepia</option>
            <option value="light">Light</option>
          </select>
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
          Mode:
          <select
            value={settings.readingMode}
            onChange={(e) => onSettingsChange({ readingMode: e.target.value as 'sentence' | 'word' })}
            style={selectStyle}
          >
            <option value="sentence">Sentence</option>
            <option value="word">Word Focus</option>
          </select>
        </label>
      </div>

      <div style={{ fontSize: '12px', opacity: 0.65, textAlign: 'center' }}>
        💡 <em>Tap the middle reading area to hide/show controls</em>
      </div>
    </div>
  );
};

