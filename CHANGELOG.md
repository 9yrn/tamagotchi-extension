# Changelog

All notable changes to **Poyori (ポヨリ) — 8-Bit Virtual Web Companion** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-10-27

### Added
* **Pocket Mode (Resting Companion):**
  * Click Poyori in the extension popup or tap the new **`[Pocket]`** button on the handheld console to tuck your pet into your pocket.
  * Pauses roaming across web tabs and puts your pet to sleep with a cozy resting mood indicator (`[POCKET MODE] Resting in Pocket 💤`).
  * Click Poyori or tap Pocket again to wake them up and resume web roaming.
* **Full Firefox (Gecko MV3) Support:**
  * Added dedicated `firefox/` build directory pre-configured with Gecko ID (`poyori-companion@mochimori.dev`), background module scripts, and strict manifest validation.
  * Added `npm run build:firefox` synchronization script. Verified with Mozilla `web-ext lint` (0 errors).
* **Cross-Browser Dynamic Storage:**
  * Added universal storage API detection (`getStorageApi`) supporting `chrome.storage`, `browser.storage`, and local fallback without vendor lock-in.
* **Onboarding Tutorial Expansion:**
  * Updated Step 3 (Vitals & Care) and Step 5 (Roaming & Adventure) in the interactive tutorial to guide new players through Pocket Mode, energy resting mechanics, and display sizing.
* **Dynamic Pet Emotional Sprites:**
  * Added emotional states (`hungry`, `procrastinating`, `grumpy`, `petted`) with real-time Base64 SVG generation and memoized caching.
* **Random Gender Assignment:**
  * Companions now receive an authentic random gender assignment (`male` ♂ or `female` ♀) upon hatching, indicated via pixel art gender glyphs.
* **Expanded Educational Domain Presets:**
  * Added presets for popular coding, research, and literature platforms (`chatgpt.com`, `claude.ai`, `pypi.org`, `npmjs.com`, `react.dev`, `semanticscholar.org`, `researchgate.net`, `openstax.org`, `gutenberg.org`, `archive.org`, `deepl.com`).

### Changed
* **Sizing Toggle Buttons Overhaul:**
  * Replaced unstyled inline button styles with authentic 9-bit Dark Slate RPG styling (`#262e49`), `PixelOperator8` typography, 3D beveled borders, and glowing cyan active indicators (`#45b7b8`).
* **Pixel Art Question Mark Redesign:**
  * Completely redrew the locked creature `mystery` icon in `shared/pixel-icons.js` from an asymmetrical 8x9 grid to a crisp, symmetrical 10x10 retro golden pixel art design with a centered 2x2 dot.
* **Bundle Build Synchronization:**
  * Updated `scripts/build-bundle.js` so inlined content scripts forward player settings and register runtime listeners for `set_pet_size` and `toggle_pet_visibility`.

### Fixed
* **In-Page Companion Sizing & Visibility Lag:**
  * Fixed an issue where changing pet size or toggling visibility in the popup saved to storage but failed to update active web tabs without a hard refresh.
* **Idle State Pocket Mode Overwrite:**
  * Fixed an issue in `background/background.js` where returning from system idle unconditionally woke the pet up, overriding active Pocket Mode.
* **Test Seam Invariants:**
  * Fixed cross-context prototype assertion errors in in-page DOM injection simulation tests. All 127 automated unit tests now run 100% green.

---

## [1.0.0] - 2026-10-15

### Added
* Initial release of Poyori (ポヨリ) virtual web companion for Chrome Manifest V3.
* 24 evolutions across 4 elemental branches (Denki, Chishiki, Monogatari, Gūtara).
* Pomodoro focus session sprints and study domain XP classification.
* Retro handheld console modal with 8-bit procedural Web Audio sound synthesizer.
