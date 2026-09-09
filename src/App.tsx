import { useEffect, useState } from 'react';
import { parseDocument } from './parser';
import { ReaderDocument } from './parser/txt';
import { ReaderView } from './components/ReaderView';
import { getShelfItems, saveShelfItem, ShelfItem, getSettings, saveSettings, AppSettings, defaultSettings } from './storage/db';
import { themes } from './theme/colors';
import { PageSelectorModal } from './components/PageSelectorModal';

export default function App() {
  const [document, setDocument] = useState<ReaderDocument | null>(null);
  const [shelf, setShelf] = useState<ShelfItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [currentProgress, setCurrentProgress] = useState<ShelfItem | null>(null);
  
  const [isParsing, setIsParsing] = useState(false);
  
  const [startDialog, setStartDialog] = useState<{
    show: boolean;
    doc: ReaderDocument | null;
    prevItem: ShelfItem | null;
  }>({ show: false, doc: null, prevItem: null });
  

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const items = await getShelfItems();
    setShelf(items.sort((a, b) => b.lastOpenedTime - a.lastOpenedTime));
    
    const sets = await getSettings();
    setSettings(sets);
  };

  const handleSettingsChange = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await saveSettings(updated);
  };

  const handleFile = async (file: File) => {
    try {
      setIsParsing(true);
      const doc = await parseDocument(file);
      
      const existing = shelf.find(s => s.id === file.name);

      setStartDialog({
        show: true,
        doc,
        prevItem: existing || null
      });
      
    } catch (err) {
      console.error(err);
      alert('Error parsing document: ' + (err as Error).message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleStart = (pageIdx: number, startFromPrev: boolean) => {
    const doc = startDialog.doc;
    const prevItem = startDialog.prevItem;
    if (!doc) return;
    
    let progress: ShelfItem = {
      id: doc.title,
      filename: doc.title,
      fileType: 'unknown',
      progress: 0,
      currentPage: pageIdx,
      currentSentence: 0,
      currentWord: 0,
      lastOpenedTime: Date.now()
    };
    
    if (startFromPrev && prevItem) {
      progress = { ...prevItem, lastOpenedTime: Date.now() };
    }
    
    setDocument(doc);
    setCurrentProgress(progress);
    setStartDialog({ show: false, doc: null, prevItem: null });
  };
  
  const handleProgressUpdate = async (p: Pick<ShelfItem, 'currentPage' | 'currentSentence' | 'currentWord'>) => {
    if (!currentProgress) return;
    const updated: ShelfItem = {
      ...currentProgress,
      ...p,
      lastOpenedTime: Date.now()
    };
    setCurrentProgress(updated);
    await saveShelfItem(updated);
  };

  if (document && currentProgress) {
    return (
      <ReaderView 
        document={document} 
        initialProgress={currentProgress}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onProgressUpdate={handleProgressUpdate}
        onClose={() => {
          setDocument(null);
          setCurrentProgress(null);
          loadData();
        }}
      />
    );
  }

  const currentTheme = themes[settings.theme] || themes.light;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: currentTheme.bg,
      color: currentTheme.text,
      transition: 'background-color 0.2s, color 0.2s'
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '3em', margin: '0 0 10px 0' }}>ZenReader</h1>
            <p style={{ color: currentTheme.subtext, fontSize: '1.2em', margin: '0 0 40px 0' }}>A simple privacy-first reading application.</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9em', color: currentTheme.subtext }}>
            Theme:
            <select
              value={settings.theme}
              onChange={(e) => handleSettingsChange({ theme: e.target.value as any })}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: `1px solid ${currentTheme.border}`,
                background: currentTheme.cardBg,
                color: currentTheme.text
              }}
            >
              <option value="light">Light</option>
              <option value="sepia">Sepia</option>
              <option value="amoled">Amoled (Pitch Black)</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
        
        <div 
          style={{
            border: `2px dashed ${currentTheme.border}`,
            borderRadius: '12px',
            padding: '60px',
            textAlign: 'center',
            background: currentTheme.cardBg,
            cursor: 'pointer',
            marginBottom: '40px'
          }}
          onClick={() => window.document.getElementById('file-upload')?.click()}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFile(e.dataTransfer.files[0]);
            }
          }}
        >
          {isParsing ? (
            <h2 style={{ margin: 0 }}>Processing Document...</h2>
          ) : (
            <h2 style={{ margin: 0 }}>Choose File or Drag & Drop</h2>
          )}
          <input 
            id="file-upload" 
            type="file" 
            style={{ display: 'none' }} 
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
          />
        </div>
        
        <h3>Recent Reading</h3>
        {shelf.length === 0 ? (
          <p style={{ color: currentTheme.subtext }}>No recent documents.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {shelf.map(item => (
              <li key={item.id} style={{
                padding: '16px',
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '8px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: currentTheme.cardBg
              }}>
                <div>
                  <strong>{item.filename}</strong>
                  <div style={{ fontSize: '0.9em', color: currentTheme.subtext, marginTop: '4px' }}>
                    Page {item.currentPage + 1}
                  </div>
                </div>
                <button 
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: `1px solid ${currentTheme.border}`,
                    background: currentTheme.btnBg,
                    color: currentTheme.btnText,
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    alert('Please choose the file again from your device to resume.');
                    window.document.getElementById('file-upload')?.click();
                  }}
                >
                  Re-open to resume
                </button>
              </li>
            ))}
          </ul>
        )}
        
        {startDialog.show && startDialog.doc && (
          <PageSelectorModal
            doc={startDialog.doc}
            theme={currentTheme}
            prevItem={startDialog.prevItem}
            initialPageIdx={startDialog.prevItem ? startDialog.prevItem.currentPage : 0}
            onSelectPage={(pageIdx) => handleStart(pageIdx, false)}
            onClose={() => setStartDialog({ show: false, doc: null, prevItem: null })}
          />
        )}
      </div>
    </div>
  );
}
