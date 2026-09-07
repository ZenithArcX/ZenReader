import React, { useEffect, useState } from 'react';
import { AppSettings } from '../storage/db';
import { themes } from '../theme/colors';
import { subscribeVoices } from '../utils/tts';

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
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showTtsPanel, setShowTtsPanel] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeVoices((v) => setVoices(v));
    return () => unsubscribe();
  }, []);

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

  const smallBtnStyle: React.CSSProperties = {
    padding: '5px 10px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    borderRadius: '6px',
    border: `1px solid ${currentTheme.border}`,
    background: currentTheme.btnBg,
    color: currentTheme.btnText,
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '30px',
    touchAction: 'manipulation'
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

  const changeWpm = (delta: number) => {
    const nextWpm = Math.min(Math.max(settings.wpm + delta, 50), 1000);
    onSettingsChange({ wpm: nextWpm });
  };

  const changeTtsRate = (delta: number) => {
    const nextRate = Math.min(Math.max(parseFloat((settings.ttsRate + delta).toFixed(1)), 0.5), 3.0);
    onSettingsChange({ ttsRate: nextRate });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      alignItems: 'center',
      padding: '12px 14px',
      background: currentTheme.controlBg,
      borderRadius: '12px',
      border: `1px solid ${currentTheme.border}`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Row 1: Primary Action Buttons */}
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
          onClick={() => onSettingsChange({ ttsEnabled: !settings.ttsEnabled })} 
          style={{ 
            ...btnStyle, 
            color: settings.ttsEnabled ? '#10b981' : currentTheme.btnText,
            borderColor: settings.ttsEnabled ? '#10b981' : currentTheme.border
          }}
          title="Toggle Read Aloud Speech (TTS)"
        >
          {settings.ttsEnabled ? '🔊 Audio ON' : '🔇 Audio OFF'}
        </button>

        <button 
          onClick={onToggleLock} 
          style={{ 
            ...btnStyle, 
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
      
      {/* Row 2: Speed Controls (Clean, non-overlapping row) */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        alignItems: 'center'
      }}>
        {/* Visual WPM Speed Control */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          whiteSpace: 'nowrap',
          width: '100%',
          maxWidth: '360px',
          justifyContent: 'center'
        }}>
          <span style={{ minWidth: '75px', textAlign: 'left' }}>Visual WPM: <strong>{settings.wpm}</strong></span>
          <button onClick={() => changeWpm(-10)} style={smallBtnStyle} title="Decrease WPM by 10">−</button>
          <input
            type="range"
            min={50}
            max={1000}
            step={10}
            value={settings.wpm}
            onChange={(e) => onSettingsChange({ wpm: parseInt(e.target.value, 10) })}
            style={{ flex: 1, accentColor: settings.focusColor }}
          />
          <button onClick={() => changeWpm(10)} style={smallBtnStyle} title="Increase WPM by 10">+</button>
        </div>

        {/* Independent Voice Audio Speed Control (Only when Audio is Enabled) */}
        {settings.ttsEnabled && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            width: '100%',
            maxWidth: '360px',
            justifyContent: 'center'
          }}>
            <span style={{ minWidth: '75px', textAlign: 'left' }}>Voice Speed: <strong>{settings.ttsRate.toFixed(1)}x</strong></span>
            <button onClick={() => changeTtsRate(-0.1)} style={smallBtnStyle} title="Decrease Voice Speed by 0.1x">−</button>
            <input
              type="range"
              min={0.5}
              max={3.0}
              step={0.1}
              value={settings.ttsRate}
              onChange={(e) => onSettingsChange({ ttsRate: parseFloat(e.target.value) })}
              style={{ flex: 1, accentColor: '#10b981' }}
            />
            <button onClick={() => changeTtsRate(0.1)} style={smallBtnStyle} title="Increase Voice Speed by 0.1x">+</button>
          </div>
        )}
      </div>

      {/* Row 3: Dropdowns (Theme, Mode, Voice Settings) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%'
      }}>
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

        <button
          onClick={() => setShowTtsPanel(!showTtsPanel)}
          style={{
            ...btnStyle,
            flex: '0 0 auto',
            fontSize: '12px',
            padding: '4px 8px'
          }}
          title="Configure TTS Voice and Pitch"
        >
          ⚙️ Voice Settings
        </button>
      </div>

      {/* Expanded Voice & Pitch Settings Panel */}
      {(showTtsPanel || settings.ttsEnabled) && (
        <div style={{
          width: '100%',
          padding: '10px 12px',
          background: currentTheme.cardBg,
          borderRadius: '8px',
          border: `1px solid ${currentTheme.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxSizing: 'border-box',
          marginTop: '4px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🎙️ Voice Configuration</span>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.ttsEnabled}
                onChange={(e) => onSettingsChange({ ttsEnabled: e.target.checked })}
              />
              <span>Audio Mode</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 180px', fontSize: '12px' }}>
              <span>Voice:</span>
              <select
                value={settings.ttsVoiceURI}
                onChange={(e) => onSettingsChange({ ttsVoiceURI: e.target.value })}
                style={selectStyle}
              >
                <option value="">System Default Voice</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 140px', fontSize: '12px' }}>
              <span>Pitch: <strong>{settings.ttsPitch.toFixed(1)}x</strong></span>
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.1}
                value={settings.ttsPitch}
                onChange={(e) => onSettingsChange({ ttsPitch: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: settings.focusColor }}
              />
            </label>
          </div>
        </div>
      )}

      <div style={{ fontSize: '11px', opacity: 0.65, textAlign: 'center' }}>
        💡 <em>Tap center text area to hide controls</em>
      </div>
    </div>
  );
};
