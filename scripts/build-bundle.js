/**
 * Poyori (ポヨリ) — Content Script Bundler
 * Inlines modular source files and CSS into a single self-contained
 * content.bundle.js file that runs in Chrome's Isolated World without CSP restrictions.
 * Validates non-module syntax using Node's vm engine before writing.
 */

import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function readFile(relPath) {
  return fs.readFileSync(path.join(rootDir, relPath), 'utf8');
}

/**
 * Strips all ES Module import/export keywords so the code can run
 * inside a standard IIFE closure in Chrome's Isolated World.
 */
function stripImportsExports(code) {
  let cleaned = code;
  // 1. Remove import statements (single-line and multi-line)
  cleaned = cleaned.replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
  cleaned = cleaned.replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '');
  cleaned = cleaned.replace(/^import\s+.*?;?\s*$/gm, '');

  // 2. Remove export default
  cleaned = cleaned.replace(/^export\s+default\s+/gm, '');

  // 3. Remove export { a, b, c }
  cleaned = cleaned.replace(/^export\s*\{[\s\S]*?\};?\s*$/gm, '');

  // 4. Remove leading 'export ' from declarations (const, let, var, function, async function, class)
  cleaned = cleaned.replace(/^export\s+/gm, '');

  return cleaned;
}

console.log('Building Poyori content bundle...');

const fontsCss = readFile('assets/fonts/fonts.css');
const contentCss = fontsCss + '\n' + readFile('content/content.css');
const modalCss = readFile('ui/handheld-modal.css');
const celebrationCss = readFile('ui/celebration-modal.css');

const constantsCode = stripImportsExports(readFile('shared/constants.js'));
const pixelIconsCode = stripImportsExports(readFile('shared/pixel-icons.js'));
const storageCode = stripImportsExports(readFile('shared/storage.js'));
const engineCode = stripImportsExports(readFile('shared/game-engine.js'));
const audioCode = stripImportsExports(readFile('ui/audio.js'));
const spritesCode = stripImportsExports(readFile('content/sprites.js'));
const controllerCode = stripImportsExports(readFile('content/pet-controller.js'));
const bubbleCode = stripImportsExports(readFile('ui/quick-bubble.js'));
const celebrationCode = stripImportsExports(readFile('ui/celebration-modal.js'));
const modalCode = stripImportsExports(readFile('ui/handheld-modal.js'));

const bundle = `/**
 * Poyori (ポヨリ) — 8-Bit Virtual Web Companion
 * Compiled Standalone Content Bundle for Manifest V3 Isolated World
 * Zero CSP dependency, instant in-page rendering.
 */
(() => {
  // Prevent duplicate execution
  if (window.__POYORI_INJECTED__) return;
  window.__POYORI_INJECTED__ = true;

  // Inlined isolated stylesheets
  const INLINED_CONTENT_CSS = ${JSON.stringify(contentCss)};
  const INLINED_MODAL_CSS = ${JSON.stringify(modalCss)};
  const INLINED_CELEBRATION_CSS = ${JSON.stringify(celebrationCss)};

  // 1. Constants & Terminology
  ${constantsCode}

  // 1b. 8-Bit Pixel UI Icons
  ${pixelIconsCode}

  // 2. Storage
  ${storageCode}

  // 3. Game Engine
  ${engineCode}

  // 4. Procedural Audio Synthesizer
  ${audioCode}

  // 5. 8-Bit Pixel Sprites Engine
  ${spritesCode}

  // 6. Roaming Pet Controller
  ${controllerCode}

  // 7. Quick Speech Bubble
  ${bubbleCode}

  // 7b. Celebratory Fanfare Plaque Modal
  ${celebrationCode}

  // 8. Retro Handheld Device Modal
  ${modalCode}

  // 9. Main In-Page Bootstrapper
  async function bootPoyori() {
    // If element exists, exit
    if (document.getElementById('poyori-root')) return;

    // Create root host element
    const host = document.createElement('div');
    host.id = 'poyori-root';
    host.style.cssText = 'all: initial !important; position: fixed !important; bottom: 0 !important; left: 0 !important; width: 0 !important; height: 0 !important; overflow: visible !important; z-index: 2147483647 !important; pointer-events: none !important;';

    const shadowRoot = host.attachShadow({ mode: 'open' });

    // Inject styles directly via <style> tags (immune to CSP)
    const styleEl = document.createElement('style');
    styleEl.textContent = INLINED_CONTENT_CSS + '\\n' + INLINED_MODAL_CSS + '\\n' + INLINED_CELEBRATION_CSS;
    shadowRoot.appendChild(styleEl);

    // Attach to document safely
    const mountTarget = document.body || document.documentElement;
    if (!mountTarget) {
      document.addEventListener('DOMContentLoaded', bootPoyori);
      return;
    }
    mountTarget.appendChild(host);

    // Load state
    let state = await getState();

    // Check if domain is blocked
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      if (PoyoriEngine.isBlocked(window.location.hostname, state)) {
        window.location.href = chrome.runtime.getURL('blocked/blocked.html?domain=' + encodeURIComponent(window.location.hostname));
        return;
      }
    }

    // Init Audio Settings
    if (state.settings) {
      audioSynth.setVolume(state.settings.soundVolume);
      audioSynth.setMuted(state.settings.soundMuted);
    }

    // Init Handheld Device Modal
    const handheld = new HandheldModal(shadowRoot, {
      state,
      onStateChange: async (newState) => {
        state = newState;
        await saveState(state);
        controller.updatePetData(state.pet, state.settings);
      },
      onPetAction: (action) => {
        if (action === 'feed') controller.triggerFeedAnimation();
        if (action === 'cheer') controller.triggerCheerAnimation();
        if (action === 'pet') controller.triggerPetReaction();
      }
    });

    // Init Quick Action Bubble
    const bubble = new QuickBubble(shadowRoot, {
      onOpenDevice: () => handheld.open(),
      onPetAction: (action) => {
        if (action === 'feed') controller.triggerFeedAnimation();
        if (action === 'pet') controller.triggerPetReaction();
      },
      onStateChange: async (newState) => {
        state = newState;
        await saveState(state);
        controller.updatePetData(state.pet, state.settings);
        handheld.updateState(state);
      }
    });

    // Init Roaming Pet Controller
    const controller = new PoyoriController(shadowRoot, {
      petData: state.pet,
      settings: state.settings
    });

    const pageCat = PoyoriEngine.classifyDomain(window.location.hostname, state);
    if (pageCat === 'distracting') {
      controller.isProcrastinating = true;
      controller.updateSpriteGraphics();
    }

    // Pet click handler & 7-tap Dev Portal launcher
    let clickStartTime = 0;
    let petTapCount = 0;
    let lastPetTap = 0;
    controller.container.addEventListener('pointerdown', () => {
      clickStartTime = Date.now();
    });

    controller.container.addEventListener('pointerup', () => {
      const elapsed = Date.now() - clickStartTime;
      // If short tap (< 300ms)
      if (elapsed < 300) {
        const now = Date.now();
        if (now - lastPetTap < 1500) {
          petTapCount++;
        } else {
          petTapCount = 1;
        }
        lastPetTap = now;

        if (petTapCount >= 4 && petTapCount < 7) {
          audioSynth.boop();
        } else if (petTapCount >= 7) {
          // 7 rapid taps on Poyori launches Dev Access Port safely via service worker
          petTapCount = 0;
          audioSynth.shinkaFanfare();
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ action: 'open_dev_portal', auth: 'gesture' });
          } else if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
            window.location.href = chrome.runtime.getURL('dashboard/dev-portal.html?auth=gesture');
          }
          return;
        }

        bubble.toggle(controller.x, controller.y, state);
        audioSynth.chirp();
      }
    });

    // Subscribe to state updates across tabs
    subscribeState((newState) => {
      if (!newState) return;
      state = newState;
      controller.updatePetData(state.pet, state.settings);
      handheld.updateState(state);
    });

    // Message listener from popup
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.action === 'open_device') {
          handheld.open();
          sendResponse({ success: true });
        } else if (msg.action === 'cheer') {
          controller.triggerCheerAnimation();
          sendResponse({ success: true });
        } else if (msg.action === 'feed') {
          controller.triggerFeedAnimation();
          sendResponse({ success: true });
        } else if (msg.action === 'pet') {
          controller.triggerPetReaction();
          sendResponse({ success: true });
        } else if (msg.action === 'set_pet_size') {
          controller.setPetSize(msg.size || msg.sizePx);
          sendResponse({ success: true });
        } else if (msg.action === 'toggle_pet_visibility') {
          controller.setVisibility(!msg.pocketMode && msg.visible !== false);
          sendResponse({ success: true });
        } else if (msg.action === 'classification_updated') {
          getState().then(freshState => {
            if (freshState) state = freshState;
            if (msg.category === 'denki' || msg.category === 'chishiki' || msg.category === 'monogatari') {
              controller.isProcrastinating = false;
              controller.triggerCheerAnimation();
            } else if (msg.category === 'distracting') {
              controller.isProcrastinating = true;
              controller.updateSpriteGraphics();
            }
          });
          sendResponse({ success: true });
        }
      });
    }
  }

  // Safe bootstrap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootPoyori);
  } else {
    bootPoyori();
  }
})();
`;

// Validate that the bundle has ZERO unexpected module tokens like 'export' or 'import'
try {
  new vm.Script(bundle);
  console.log('✓ VM validation passed: Zero syntax errors or unexpected tokens!');
} catch (err) {
  console.error('❌ VM Validation failed! Bundle contains invalid non-module syntax:', err);
  process.exit(1);
}

fs.writeFileSync(path.join(rootDir, 'content/content.bundle.js'), bundle, 'utf8');
console.log('Built content/content.bundle.js successfully (' + bundle.length + ' bytes)!');
