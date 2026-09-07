# ZenReader

ZenReader is a lightweight, privacy-first web application for reading local documents using guided optical fixation (focus reading). The central characters of words are highlighted to facilitate rapid word recognition and minimize saccadic eye movement.

All document processing, text parsing, rendering, and history persistence happen entirely in the browser. No server, cloud API, tracking, or network connection is required.

---

## 📖 Complete Documentation Book & Standalone HTML
- **Technical Architecture Manual**: See [DOCUMENTATION_BOOK.md](file:///data/AKHIL/FocusReader/DOCUMENTATION_BOOK.md) for full details on project design choices, library justifications, development phase audits, and complete architectural documentation.
- **Standalone Offline Single-File HTML**: Run `node scripts/bundle_single_file.js` to produce `dist/ZenReader_SingleFile_Standalone.html` — a single 100% self-contained offline HTML file that runs anywhere without a web server.

---

## Features

- **Local Document Support**:
  - **PDF**: Preserves page boundaries using lazy-loaded `pdfjs-dist`. Includes fallback handling for scanned or image-only pages.
  - **EPUB**: Custom ZIP-based chapter and manifest reader using `jszip` and native `DOMParser`.
  - **DOCX**: Client-side document text extraction using `mammoth`.
  - **TXT**: Plain text document tokenization using browser APIs.
- **Reading Modes**:
  - **Sentence Mode**: Displays full sentences with 2-word phrase chunking, active highlight progression, and dimmed context.
  - **Word Focus Mode**: Displays single centered words for RSVP (Rapid Serial Visual Presentation) speed reading.
- **Native Text-to-Speech (TTS)**: Built-in device voice synthesis with multi-language support, custom voice selection, pitch tuning, and isolated Voice Speed control.
- **PWA & Touchscreen Features**:
  - **Standalone PWA**: Installable on Android/Desktop to run without URL bar.
  - **Mistouch Lock**: Touchscreen lock overlay preventing accidental taps while reading.
  - **Fullscreen Toggle**: Native browser fullscreen mode trigger (`⛶ Maximise`).
  - **Focus Mode**: Tap center text area to hide top/bottom navigation bars.
- **Themes**: Light, Sepia, AMOLED Pitch Black (`#000000`), and Dark themes.
- **WPM & Speed Controls**: Configurable reading speed (50 to 1000 WPM) with `−` and `+` 10 WPM step buttons.
- **Offline Persistence**: Reading history and preferences saved locally in IndexedDB.

---

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript 5
- **Build System**: Vite 5
- **Local Storage**: IndexedDB
- **Parsers**: `pdfjs-dist`, `jszip`, `mammoth`
- **Speech Engine**: Native Browser Web Speech API (`window.speechSynthesis`)

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
node scripts/bundle_single_file.js
```

Generates production assets in `dist/` and standalone single-file HTML at `dist/ZenReader_SingleFile_Standalone.html`.

---

## Technical Architecture Overview

See [DOCUMENTATION_BOOK.md](file:///data/AKHIL/FocusReader/DOCUMENTATION_BOOK.md) for comprehensive deep dives into:
1. **Fixation Calculation (`src/text/focus.ts`)**: Strips non-word boundary punctuation before calculating central character position.
2. **EPUB Parser (`src/parser/epub.ts`)**: Replaced 345 KB `epubjs` with a 2 KB custom `JSZip` + `DOMParser` reader.
3. **Web Speech Engine (`src/utils/tts.ts`)**: Manages system voice loading, pitch, rate, and scanned placeholder skipping.

---

## License

MIT
