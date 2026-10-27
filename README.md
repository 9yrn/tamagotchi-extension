# Poyori (ポヨリ). 🐾

**Poyori** is a nostalgic, 9-bit retro virtual pet Chrome extension built entirely with Vanilla JavaScript, Web Components (Shadow DOM), and Manifest V3. Roaming freely along the bottom edge of your webpages in the mystical realm of **Mochimori (餅森)**, Poyori responds to your real-time browsing habits, evolves across 6 distinct animal lineages, keeps you focused with a built-in focus accountability timer, and provides deep care mechanics with zero website interference.

![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-%234285F4.svg?style=for-the-badge&logo=googlechrome&logoColor=white)
![JavaScript](https://img.shields.io/badge/ES6_JavaScript-%23F7DF1E.svg?style=for-the-badge&logo=javascript&logoColor=black)
![Web Audio API](https://img.shields.io/badge/Web_Audio_API-Chiptune_Synth-%23FF6F00.svg?style=for-the-badge&logo=audio&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Test_Runner-%23339933.svg?style=for-the-badge&logo=nodedotjs&logoColor=white)

## ✨ Features

- **In-Page Roaming Web Companion:** Roams across any website safely inside an isolated, CSP-immune Shadow DOM (`#poyori-root`) with physics, walking animations, dragging, and zero style collision.
- **6 Distinct Animal Lineages (36 Unique 9-Bit Sprites):** Evolve your companion across 6 disciplined branches with 100% consistent animal breeds (Coding Cat, Creative Bird, Literature Fox, Research Owl, Gaming Wyvern, and Personal Dev Shiba) through 6 life stages (Tamago → Umare → Kodama → Seishin → Shinju → Shin'en).
- **Focus Accountability Timer:** Choose your discipline, select session duration (15m, 25m, 45m, 60m), and receive real-time on-page speech bubble nudges if you drift to off-task websites, earning major XP and Koban (小判) upon completion.
- **Handheld Tamagotchi Device Console:** A retro handheld popout with 3 tactile arcade buttons (`TAB`, `ACT`, `WAKE`/`REST`), status vitals (Hunger, Energy, Bond, Sickness), daily quests, food market, almanac (Zukan), and companion roster.
- **Adjustable Display Sizing & Creature Themes:** Dynamically toggle between Small (48px), Normal (64px), Large (80px), and Giant (96px) display sizes with real-time live preview stages and unlockable color themes for higher evolutions.
- **Multi-Pet Roster & Custom Naming:** Name and rename your companions with live input sanitization, and switch between unlocked pets in your active roster shelf.
- **Illness & Yakusō Herbal Medicine:** Sickness conditions triggered by neglect or poor care can be treated and cured with authentic Yakusō (薬草) medicine purchased with Koban.
- **Onboarding Tutorial & Skip:** Interactive 5-step RPG tutorial for first-time installation that introduces lore, lets players pick their starter egg breed and assign their pet's first name, with skip controls on every step and dashboard replayability.
- **Zero Unicode Emojis & Pure 9-Bit Aesthetics:** Every visual element uses handcrafted pixel art SVGs and the authentic `PixelOperator8` retro typography with procedural chiptune synthesizers (Web Audio API).
- **Authenticated Developer Access Port:** Hidden 7-tap developer gesture or hotkey access to God Mode, vitals simulation, and instant morphing across all 36 creatures without exposing cheats to normal users.

## 🛠 Tech Stack

- **Chrome Extensions API (Manifest V3):** Background service worker (`background/background.js`) handling tab focus tracking, alarms, idle state, and cross-tab communication.
- **Vanilla ES6+ JavaScript & Shadow DOM:** Zero external runtime framework dependencies. Runs in an isolated Shadow DOM container with complete immunity from host webpage CSS and CSP policies.
- **Web Audio API:** Procedural 8-bit retro sound synthesizer generating real-time chiptune boops, chirps, purrs, and fanfares without external audio audio files.
- **Chrome Storage API:** Persistent local data synchronization (`chrome.storage.local`) managing companion vitals, inventory, tasks, stats, and settings across browser sessions.
- **Node.js Native Test Runner (`node:test`):** Lightweight, zero-dependency TDD test suite validating game engine ticks, domain classifications, leveling, sickness, and UI regressions.

## 🚀 Getting Started

If you want to run **Poyori** locally on your machine, follow these steps:

### Prerequisites

Make sure you have:
- Google Chrome (or any Chromium-based browser like Brave, Edge, Opera, or Arc).
- [Node.js](https://nodejs.org/) (`>= 18.0.0`) installed on your machine (for tests and bundle compilation).

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/poyori-extension.git
   cd poyori-extension
   ```

2. **Build the content script bundle:**

   ```bash
   npm run build
   ```

   _This command compiles and validates `content/content.bundle.js` with zero syntax errors._

3. **Load the extension into Google Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`.
   - In the top-right corner, toggle **Developer mode** to **ON**.
   - In the top-left corner, click **Load unpacked**.
   - Select the `tamagotchi-extension/` directory.
   - Click the Extensions puzzle icon in Chrome's toolbar and **Pin** 📌 **Poyori**!
   - Visit any website (e.g. GitHub, MDN, Wikipedia) — Poyori will appear roaming along the bottom of your screen!

### Building for Production

To bundle the files and package a fresh distribution archive for the Chrome Web Store, run:

```bash
# 1. Compile bundle
npm run build

# 2. Package distribution zip (excluding dev files and git metadata)
zip -r -FS ../tamagotchi-extension.zip . -x "node_modules/*" ".git/*" ".DS_Store"
```

This will produce the production-ready `tamagotchi-extension.zip` in the parent directory.

## 📂 Project Structure

This project is built with clean separation of concerns and modular ES6 architecture. Here is a breakdown of the key directories in the repository:

- `/background` - Manifest V3 background service worker managing website classification, focus ticks, alarms, and fresh install hooks.
- `/content` - In-page Shadow DOM host, wandering physics controller (`pet-controller.js`), 9-bit creature sprites (`sprites.js`), and bundled script (`content.bundle.js`).
- `/dashboard` - Full-screen Mochimori Dashboard page (`dashboard.html`), 3D flipping overview card, preferences, almanac, companion shelf, and developer access portal (`dev-portal.html`).
- `/popup` - Quick Chrome toolbar popup (`popup.html`) with real-time domain classification buttons, quick actions, and pet vitals.
- `/shared` - Core cross-environment game logic:
  - `constants.js` - Central source of truth for creature lineages, stages, food items, accessories, palettes, and default state.
  - `game-engine.js` - Pure engine functions for vitals decay, feeding, focus ticks, leveling calculations, and evolution milestone checks.
  - `pixel-icons.js` - Zero-emoji 9-bit SVG icon matrices and Base64 data URI generators.
  - `storage.js` - Local storage wrapper with deep merge and cross-tab update subscriptions.
- `/ui` - Modular retro RPG UI components:
  - `handheld-modal.js` & `.css` - In-page 9-bit console device with A/B/C action buttons and multi-tab interface.
  - `tutorial-modal.js` & `.css` - First-time setup onboarding walkthrough with starter breed selection and skip support.
  - `celebration-modal.js` & `.css` - Shinka evolution fanfare and Koban reward celebration dialogs.
  - `quick-bubble.js` - One-click speech bubble for in-page pet care and device launching.
  - `audio.js` - Procedural chiptune Web Audio synthesizer.
- `/assets` - Embedded pixel fonts (`PixelOperator8`, `PixelOperator`) and extension icon artwork.
- `/tests` - Comprehensive test suite (116+ automated unit and integration tests).

## 🧪 Testing

This project is configured out-of-the-box with comprehensive unit tests for all game engine mechanics, breed trees, focus timers, and UI integrity. To run the automated test suite, simply execute:

```bash
npm test
```

_All 116+ test cases run with sub-second execution using Node.js's native test runner (`node --test`), verifying zero stock Unicode emojis, life stage progressions, sickness remedies, domain classifications, and responsive layouts._
