# 📘 ZenReader — Technical Architecture & Documentation Manual

> **ZenReader** is a 100% local, privacy-first speed reading Progressive Web Application (PWA) with **Guided Optical Fixation** (middle character red highlighting), multi-format document parsing, distraction-free focus modes, touchscreen mistouch lock, and built-in native **Text-to-Speech (TTS)**.

---

## 📑 Table of Contents
1. [Project Overview & Core Philosophy](#1-project-overview--core-philosophy)
2. [Technical Architecture & Directory Structure](#2-technical-architecture--directory-structure)
3. [Tools, Libraries & Dependency Justification](#3-tools-libraries--dependency-justification)
4. [Chronological Development Phases & Task Audit](#4-chronological-development-phases--task-audit)
5. [Core Technical Implementations](#5-core-technical-implementations)
   - [A. Guided Optical Fixation Engine](#a-guided-optical-fixation-engine)
   - [B. Multi-Format Document Parsing](#b-multi-format-document-parsing)
   - [C. Touchscreen Mistouch Lock & Distraction-Free Focus Mode](#c-touchscreen-mistouch-lock--distraction-free-focus-mode)
   - [D. Native Web Speech API Text-to-Speech (TTS) Engine](#d-native-web-speech-api-text-to-speech-tts-engine)
   - [E. 2–3 Word Phrase Chunking in Sentence Mode](#e-23-word-phrase-chunking-in-sentence-mode)
6. [Standalone Single-File HTML Bundle Guide](#6-standalone-single-file-html-bundle-guide)
7. [Installation, Hosting & User Guide](#7-installation-hosting--user-guide)

---

## 1. Project Overview & Core Philosophy

**ZenReader** was designed to solve a fundamental problem with modern digital reading: traditional reading involves slow ocular saccades (eye movements across lines), leading to eye fatigue and poor comprehension speed. 

ZenReader uses **RSVP (Rapid Serial Visual Presentation)** combined with **Guided Optical Fixation** to anchor the user's eyes on the optimal recognition point of every word (highlighted in high-contrast red), allowing reading speeds of **250 to 1,000 WPM** with minimal effort.

### 🛡️ Core Principles
- **100% Privacy-First & Local**: No analytics, no tracking, no backend servers, no cloud APIs. Files uploaded by the user never leave their local device memory.
- **Zero URL Bar / Native PWA**: Installable on Android and Desktop as a standalone PWA running without browser toolbars.
- **Zero Third-Party API Cost**: Text-to-Speech uses the device's native Web Speech API offline voices.
- **Ultra-Lightweight**: Custom zero-dependency parsers replace heavy libraries to ensure instant loading under 1 second.

---

## 2. Technical Architecture & Directory Structure

```
FocusReader/
├── public/
│   ├── icon.svg             # Vector app icon (Zen brand mark)
│   ├── manifest.json        # PWA standalone manifest configuration
│   └── sw.js                # Offline Service Worker cache engine
├── scripts/
│   └── bundle_single_file.js # Standalone single-file HTML generator script
├── src/
│   ├── components/
│   │   ├── Controls.tsx     # Responsive touchscreen control panel & speed sliders
│   │   ├── FocusWord.tsx    # Guided Optical Fixation word renderer (red letter)
│   │   ├── PageSelectorModal.tsx # Page jump modal with live text search
│   │   └── ReaderView.tsx   # Core RSVP engine, TTS loop, mistouch lock & focus mode
│   ├── parser/
│   │   ├── index.ts         # Central document parser dispatcher
│   │   ├── txt.ts           # Plain text tokenizer & page builder
│   │   ├── pdf.ts           # PDF.js text extractor & scanned page handler
│   │   ├── epub.ts          # JSZip + DOMParser lightweight EPUB XML reader
│   │   └── docx.ts          # Mammoth.js DOCX document parser
│   ├── storage/
│   │   └── db.ts            # IndexedDB asynchronous database wrapper
│   ├── theme/
│   │   └── colors.ts        # Amoled (#000000), Dark, Sepia, Light theme tokens
│   ├── utils/
│   │   └── tts.ts           # Native Web Speech API speech engine wrapper
│   ├── App.tsx              # Root component, file dropzone, shelf & modal state
│   ├── index.css            # Global CSS, mobile touch targets & reset styles
│   └── main.tsx             # Application mount point
├── dist/                    # Compiled production assets
│   ├── index.html           # Production PWA entry point
│   └── ZenReader_SingleFile_Standalone.html # 100% Standalone bundled single-file HTML
├── CNAME                    # Custom domain configuration (zr.11042004.xyz)
├── package.json             # Project dependencies and npm build scripts
├── vite.config.ts           # Vite build pipeline configuration
└── README.md                # Developer & User manual
```

---

## 3. Tools, Libraries & Dependency Justification

Every tool, library, and framework in ZenReader was chosen with a specific technical rationale:

| Tool / Package | Category | Why It Was Chosen & Technical Rationale |
| :--- | :--- | :--- |
| **React 18** | UI Framework | Provides high-performance component re-rendering, memory-safe hook management (`useRef`, `useEffect`), and clean state synchronization needed for high-frequency WPM timer loops without memory leaks. |
| **TypeScript 5** | Language | Enforces strict type safety across document token structures, theme definitions, and database schemas, preventing runtime crashes (e.g. `undefined` property access). |
| **Vite 5** | Build Pipeline | Replaces legacy bundlers with ultra-fast ES module HMR, instant startup times, and optimal production Rollup tree-shaking. |
| **PDF.js (`pdfjs-dist`)** | PDF Parser | Developed by Mozilla; parses binary PDF streams directly in browser Web Workers without sending sensitive PDF files to cloud servers. |
| **JSZip + Native DOMParser** | EPUB Parser | **Replaced legacy `epubjs`**. `epubjs` was 345 KB and threw iframe DOM `textContent` crashes. Using `jszip` to extract container XML and parsing XHTML chapters directly reduced parser bundle size to **2 KB** (99% reduction). |
| **Mammoth.js (`mammoth`)** | DOCX Parser | The gold standard client-side DOCX parser for extracting clean text paragraphs from Microsoft Word documents without server dependencies. |
| **Web Speech API (`window.speechSynthesis`)** | Text-to-Speech | Built directly into modern browsers (Chrome, Edge, Safari, Android TTS). Provides offline, zero-latency, zero-cost voice synthesis in over 50 languages with custom pitch and rate tuning. |
| **IndexedDB** | Persistence | Native browser asynchronous database capable of storing megabytes of shelf items, reading progress, and app configurations locally with zero quota restrictions compared to localStorage. |
| **Service Worker & Manifest** | PWA Integration | Enables offline caching and allows mobile/desktop OSs to install ZenReader as a native app running in standalone window mode without browser URL bars. |

---

## 4. Chronological Development Phases & Task Audit

Below is a complete chronological audit of all development phases, problem statements, diagnostic findings, and technical solutions:

### Phase 1: Foundation & RSVP Engine
- **Task**: Built RSVP engine, `FocusWord` component, and IndexedDB storage.
- **Rationale**: Establish core speed reading functionality and local progress persistence.

### Phase 2: Multi-Format Parser Integration
- **Task**: Added PDF.js, EPUB, DOCX, and TXT parsing modules.
- **Rationale**: Allow users to upload and read any document format without pre-converting.

### Phase 3: EPUB Parser Optimization & PDF Worker Fix
- **Problem**: `epubjs` threw `undefined (reading 'textContent')` errors; PDF worker threw Vite 404 URL errors.
- **Solution**: Built lightweight JSZip + native DOMParser XML reader for EPUBs; imported PDF worker using Vite `import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url'` with `@ts-ignore`.
- **Rationale**: Cut bundle size by 99% and eliminate runtime crashes.

### Phase 4: Sentence Mode Guided Fixation Progression
- **Problem**: Sentence Mode visual highlight was stuck on word index `0`.
- **Solution**: Updated `handleNext` to advance `wordIdx` smoothly across words in sentences and pages.
- **Rationale**: Maintain visual fixation flow in both Word Focus Mode and Sentence Mode.

### Phase 5: Brand Renaming & Public Documentation
- **Task**: Renamed application to **ZenReader**, created SVG logo, professional `README.md`, and pushed code to GitHub repo `https://github.com/ZenithArcX/ZenReader.git`.

### Phase 6: Live GitHub Pages Deployment
- **Problem**: GitHub Pages default `main` branch served uncompiled `.tsx` resulting in blank screen.
- **Solution**: Configured relative base paths in Vite, generated `.nojekyll` and `CNAME` (`zr.11042004.xyz`), compiled production bundle to `dist/`, and pushed directly to `gh-pages` branch.

### Phase 7: PWA Support, Fullscreen, Tap-to-Hide & Mistouch Lock
- **Task**: Added `manifest.json`, `sw.js`, `⛶ Maximise` fullscreen button, tap-to-hide focus mode, and mistouch lock overlay.
- **Rationale**: Eliminate browser URL bar on mobile/desktop PWAs and prevent accidental touch gestures while reading.

### Phase 8: Mistouch Lock Redesign & Mobile Scaling Overhaul
- **Task**: Removed backdrop blur during lock; added subtle theme-integrated `🔒 Tap to unlock` pill; restructured controls into 3 non-overlapping rows; enlarged slider touch targets.
- **Rationale**: Remove visual reading distractions during lock and solve button overlap on narrow mobile screens.

### Phase 9: Built-in Device Text-to-Speech (TTS) Engine
- **Task**: Built `src/utils/tts.ts` Web Speech API wrapper with voice selector dropdown, pitch slider, and audio toggle button.
- **Rationale**: Provide built-in, offline read-aloud functionality across all devices.

### Phase 10: TTS WPM Sync & Scanned Page Filtering
- **Task**: Added `calculateRateFromWpm` to sync TTS speech rate with WPM; added `-` / `+` 10 WPM buttons; filtered out `[Scanned Page...]` placeholder strings from TTS.
- **Rationale**: Keep speech rate aligned with visual reading speed and prevent TTS from reading placeholder notes aloud.

### Phase 11: Speed Control Isolation
- **Task**: Displayed Voice Speed slider exclusively when Audio is ON, and Visual WPM slider exclusively when Audio is OFF.
- **Rationale**: Prevent speed control overlap and provide clear UI distinction between audio speed and visual speed.

### Phase 12: Voice Mode Visual Highlight Fix
- **Problem**: Mobile Chrome TTS voices omit `onboundary` events, freezing visual word highlight.
- **Solution**: Driven visual highlight in Voice Mode via Voice Speed timer pacing (`380 / ttsRate` ms).
- **Rationale**: Guarantee smooth visual word highlighting across all mobile browsers and voices.

### Phase 13: 2–3 Word Phrase Chunking in Sentence Mode
- **Task**: Highlighted 2-word phrase chunks together with smooth scale (`scale(1.04)`) and cubic-bezier opacity transitions; spoke 2-word phrases together in Audio mode.
- **Rationale**: Enhance reading comprehension and natural phrase cadence.

---

## 5. Core Technical Implementations

### A. Guided Optical Fixation Engine (`FocusWord.tsx`)
Calculates the optimal optical recognition character near the center of the word:
$$\text{focusIndex} = \lfloor \frac{\text{length} - 1}{2} \rfloor$$
Words are rendered in 3 spans:
1. `pre-focus`: Normal text color.
2. `focus-letter`: High-contrast red (`settings.focusColor`), bold weight.
3. `post-focus`: Normal text color.

### B. Multi-Format Document Parsing (`src/parser/`)
- **TXT**: Tokenizes text by newlines into pages, sentences, and words.
- **PDF**: Extracts text layers per page via PDF.js. If no text layer exists (scanned image page), adds a scanned page label.
- **EPUB**: Uses `JSZip` to unzip `.epub` archives, parses `container.xml` to locate `.opf` package manifests, reads chapter XHTML files, and strips HTML tags via native `DOMParser`.
- **DOCX**: Passes binary document buffer to `mammoth.extractRawText` to extract clean paragraphs.

### C. Touchscreen Mistouch Lock & Focus Mode (`ReaderView.tsx`)
- **Focus Mode**: Tapping the center reading area toggles `isFocusMode` (setting top header and bottom controls opacity to `0` with `pointerEvents: none`).
- **Mistouch Lock**: When active:
  - An invisible fixed backdrop (`pointerEvents: all`) absorbs all finger taps on screen.
  - A subtle theme-integrated pill button (`🔒 Tap to unlock`) floats at top center to allow unlocking.

### D. Native Web Speech API Text-to-Speech Engine (`src/utils/tts.ts`)
- Queries available system voices using `window.speechSynthesis.getVoices()`.
- Speaks text using `SpeechSynthesisUtterance` with custom `voice`, `pitch`, and `rate`.
- Automatically skips scanned placeholders (`isScannedPlaceholder`).

---

## 6. Standalone Single-File HTML Bundle Guide

ZenReader includes a build script `scripts/bundle_single_file.js` that packages the entire application (HTML, CSS, JavaScript, and asset dependencies) into a **100% standalone offline HTML file**:

### Generating the Standalone HTML Bundle:
```bash
npm run build
node scripts/bundle_single_file.js
```
Output location:
`dist/ZenReader_SingleFile_Standalone.html`

This single `.html` file can be double-clicked and opened directly in any browser on Android, Windows, Mac, or Linux without needing a web server or internet connection!

---

## 7. Installation, Hosting & User Guide

### 💻 Running Locally
```bash
# Clone repository
git clone https://github.com/ZenithArcX/ZenReader.git
cd ZenReader

# Install dependencies
npm install

# Start local development server
npm run dev
```

### 📱 Installing as PWA on Mobile (Android / iOS)
1. Open **[https://zr.11042004.xyz/](https://zr.11042004.xyz/)** in Google Chrome or Safari.
2. Tap the 3-dots menu icon (`⋮`) or Share icon.
3. Select **"Add to Home screen"** / **"Install App"**.
4. Launch ZenReader from your home screen — it opens in standalone mode **without any URL bar**.

### ⌨️ Keyboard Shortcuts
- `Space`: Play / Pause playback
- `ArrowRight`: Next word / phrase
- `ArrowLeft`: Previous word / phrase
- `ArrowDown`: Next sentence
- `ArrowUp`: Previous sentence
- `Escape`: Exit focus mode or close document

---

### 🌐 Links & Repository
- **Live Application**: [zr.11042004.xyz](https://zr.11042004.xyz/)
- **GitHub Repository**: [ZenithArcX/ZenReader](https://github.com/ZenithArcX/ZenReader.git)
