import React, { useState } from 'react';
import { ReaderDocument } from '../parser/txt';
import { ThemeColors } from '../theme/colors';
import { ShelfItem } from '../storage/db';

interface Props {
  doc: ReaderDocument;
  theme: ThemeColors;
  initialPageIdx?: number;
  prevItem?: ShelfItem | null;
  onSelectPage: (pageIdx: number) => void;
  onClose: () => void;
}

export const PageSelectorModal: React.FC<Props> = ({
  doc,
  theme,
  initialPageIdx = 0,
  prevItem,
  onSelectPage,
  onClose
}) => {
  const [filterText, setFilterText] = useState('');
  const [inputPageStr, setInputPageStr] = useState<string>((initialPageIdx + 1).toString());
  const [selectedPage, setSelectedPage] = useState<number>(initialPageIdx);

  const filteredPages = doc.pages.filter(p => {
    if (!filterText) return true;
    const query = filterText.toLowerCase();
    const matchesNumber = p.pageNumber.toString().includes(query);
    const matchesSnippet = p.previewSnippet?.toLowerCase().includes(query);
    return matchesNumber || matchesSnippet;
  });

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(inputPageStr, 10);
    if (!isNaN(num)) {
      const targetIdx = Math.max(1, Math.min(num, doc.pages.length)) - 1;
      onSelectPage(targetIdx);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: theme.cardBg,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        maxWidth: '650px',
        width: '100%',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{doc.title}</h2>
            <div style={{ fontSize: '0.85rem', color: theme.subtext, marginTop: '4px' }}>
              Select starting position ({doc.pages.length} total pages)
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.border}`,
              color: theme.text,
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Direct Page Number Entry */}
        <div style={{
          padding: '14px 24px',
          background: theme.controlBg,
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <label style={{ fontSize: '0.88rem', fontWeight: 600, color: theme.text }}>
            📄 Enter Starting Page Number (1 to {doc.pages.length}):
          </label>
          <form 
            onSubmit={handleJumpSubmit}
            style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}
          >
            <input
              type="number"
              min={1}
              max={doc.pages.length}
              value={inputPageStr}
              onChange={(e) => setInputPageStr(e.target.value)}
              placeholder="Page #"
              style={{
                width: '130px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${theme.border}`,
                background: theme.bg,
                color: theme.text,
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                border: 'none',
                background: '#10b981',
                color: '#ffffff',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ▶ Start Reading Page {inputPageStr || 1}
            </button>
          </form>
        </div>

        {/* Saved Progress Banner if present */}
        {prevItem && (
          <div style={{
            padding: '12px 24px',
            background: theme.controlBg,
            borderBottom: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.9rem' }}>
              🔖 Saved position: <strong>Page {prevItem.currentPage + 1}</strong>
            </span>
            <button
              onClick={() => onSelectPage(prevItem.currentPage)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Resume Page {prevItem.currentPage + 1}
            </button>
          </div>
        )}

        {/* Search Filter */}
        <div style={{ padding: '12px 24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search page content snippet..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${theme.border}`,
              background: theme.bg,
              color: theme.text,
              fontSize: '0.9rem'
            }}
          />
        </div>

        {/* Page Cards List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {filteredPages.length === 0 ? (
            <div style={{ textAlign: 'center', color: theme.subtext, padding: '32px' }}>
              No matching pages found.
            </div>
          ) : (
            filteredPages.map((page) => {
              const isSelected = selectedPage === page.pageNumber - 1;
              return (
                <div
                  key={page.pageNumber}
                  onClick={() => setSelectedPage(page.pageNumber - 1)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '8px',
                    border: `1px solid ${isSelected ? '#2563eb' : theme.border}`,
                    background: isSelected ? theme.controlBg : theme.bg,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontWeight: 'bold',
                      fontSize: '0.95rem',
                      color: isSelected ? '#2563eb' : theme.text
                    }}>
                      Page {page.pageNumber}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPage(page.pageNumber - 1);
                      }}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '4px',
                        border: `1px solid ${theme.border}`,
                        background: isSelected ? '#2563eb' : theme.btnBg,
                        color: isSelected ? '#ffffff' : theme.btnText,
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}
                    >
                      Start Here
                    </button>
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: theme.subtext,
                    fontStyle: page.previewSnippet?.startsWith('[Scanned') ? 'italic' : 'normal',
                    lineHeight: '1.4'
                  }}>
                    {page.previewSnippet || `Page ${page.pageNumber} content preview...`}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${theme.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.85rem', color: theme.subtext }}>
            Selected Page: <strong>{selectedPage + 1}</strong> of {doc.pages.length}
          </span>
          <button
            onClick={() => onSelectPage(selectedPage)}
            style={{
              padding: '8px 20px',
              borderRadius: '6px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Read Page {selectedPage + 1}
          </button>
        </div>
      </div>
    </div>
  );
};
