# ZenReader

ZenReader is a lightweight, privacy-first web application for reading local documents using guided optical fixation (focus reading). The central characters of words are highlighted to facilitate rapid word recognition and minimize saccadic eye movement.

All document processing, text parsing, rendering, and history persistence happen entirely in the browser. No server, cloud API, tracking, or network connection is required.

---

## Features

- **Local Document Support**:
  - **PDF**: Preserves page boundaries using lazy-loaded `pdfjs-dist`. Includes fallback handling for scanned or image-only pages.
  - **EPUB**: Custom ZIP-based chapter and manifest reader using `jszip` and native `DOMParser`.
  - **DOCX**: Client-side document text extraction using `mammoth`.
  - **TXT**: Plain text document tokenization using browser APIs.
- **Reading Modes**:
  - **Sentence Mode**: Displays full sentences with active word-by-word highlight progression and dimmed context.
  - **Word Focus Mode**: Displays single centered words for RSVP (Rapid Serial Visual Presentation) speed reading.
- **Page Preview & Jump Navigation**: Interactive page preview dialog with live text snippets and search filtering.
- **Themes**: Light, Sepia, AMOLED Pitch Black (`#000000`), and Dark themes.
- **WPM Controls**: Configurable reading speed from 50 to 1000 WPM with instant playback timing updates.
- **Offline Persistence**: Reading history (page, sentence, word index) and preferences saved locally in IndexedDB.

---

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript 5
- **Build System**: Vite 5
- **Local Storage**: IndexedDB
- **Parsers**: `pdfjs-dist`, `jszip`, `mammoth`

---

## Getting Started

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x

### Installation

```bash
git clone https://github.com/ZenithArcX/ZenReader.git
cd ZenReader
npm install
```

### Development Server

```bash
npm run dev
```

The application runs at `http://localhost:5173`.

### Production Build

```bash
npm run build
```

Generates optimized production assets in the `dist/` folder.

---

## Project Structure

```
src/
├── components/          # Reader UI, playback controls, page selector modal, focus word component
├── parser/              # Format parsers (PDF, EPUB, DOCX, TXT)
├── storage/             # IndexedDB wrapper and settings management
├── text/                # Sentence tokenizer and middle-character fixation calculation
├── theme/               # Color definitions for Light, Sepia, AMOLED, and Dark themes
├── App.tsx              # Root component and application state
└── main.tsx             # Application entry point
```

---

## Technical Details

- **Fixation Calculation (`src/text/focus.ts`)**: Strips non-word boundary punctuation before calculating odd/even central character positions to ensure accurate red focus alignment.
- **Sentence Tokenizer (`src/text/tokenizer.ts`)**: Splitting algorithm that accounts for standard punctuation while ignoring common abbreviations (`Mr.`, `Dr.`, `i.e.`, `e.g.`).
- **Dynamic Imports (`src/parser/index.ts`)**: Parser modules (`pdf.ts`, `epub.ts`, `docx.ts`) are lazy-loaded dynamically when a matching document type is selected.

---

## License

MIT
