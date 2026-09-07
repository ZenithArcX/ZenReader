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
}

export const Controls: React.FC<Props> = ({
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  settings,
  onSettingsChange
}) => {
  const currentTheme = themes[settings.theme] || themes.light;

  const btnStyle = {
    padding: '8px 16px',
    fontSize: '16px',
    cursor: 'pointer',
    borderRadius: '6px',
    border: `1px solid ${currentTheme.border}`,
    background: currentTheme.btnBg,
    color: currentTheme.btnText
  };

  const selectStyle = {
    padding: '4px 8px',
    borderRadius: '4px',
    border: `1px solid ${currentTheme.border}`,
    background: currentTheme.btnBg,
    color: currentTheme.btnText
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      alignItems: 'center',
      padding: '16px',
      background: currentTheme.controlBg,
      borderRadius: '8px',
      border: `1px solid ${currentTheme.border}`
    }}>
      <div style={{ display: 'flex', gap: '16px' }}>
        <button onClick={onPrev} style={btnStyle}>Previous</button>
        <button onClick={onPlayPause} style={btnStyle}>{isPlaying ? 'Pause' : 'Play'}</button>
        <button onClick={onNext} style={btnStyle}>Next</button>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          Speed: {settings.wpm} WPM
          <input
            type="range"
            min={50}
            max={1000}
            step={10}
            value={settings.wpm}
            onChange={(e) => onSettingsChange({ wpm: parseInt(e.target.value, 10) })}
            style={{ marginLeft: '8px' }}
          />
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          Theme:
          <select
            value={settings.theme}
            onChange={(e) => onSettingsChange({ theme: e.target.value as any })}
            style={selectStyle}
          >
            <option value="light">Light</option>
            <option value="sepia">Sepia</option>
            <option value="amoled">Amoled (Pitch Black)</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
    </div>
  );
};
