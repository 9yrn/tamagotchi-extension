/**
 * Poyori (ポヨリ) — Content Script
 * Injects isolated Shadow DOM container and coordinates roaming pet, bubble, and handheld device.
 */

import { getState, saveState, subscribeState } from '../shared/storage.js';
import { PoyoriEngine } from '../shared/game-engine.js';
import { PoyoriController } from './pet-controller.js';
import { QuickBubble } from '../ui/quick-bubble.js';
import { HandheldModal } from '../ui/handheld-modal.js';
import { audioSynth } from '../ui/audio.js';
import { getPixelIconHtml } from '../shared/pixel-icons.js';

(async function initPoyori() {
  // Prevent duplicate injection
  if (document.getElementById('poyori-root')) return;

  // Create isolated host element
  const host = document.createElement('div');
  host.id = 'poyori-root';
  document.documentElement.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: 'open' });

  // Inject stylesheets into Shadow DOM
  await injectStyles(shadowRoot);

  // Load initial game state
  let state = await getState();

  // Intercept blocked domains and redirect to silly decree page
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    if (PoyoriEngine.isBlocked(window.location.hostname, state)) {
      window.location.replace(chrome.runtime.getURL('blocked/blocked.html?domain=' + encodeURIComponent(window.location.hostname)));
      return;
    }
  }

  // Initialize Audio settings
  if (state.settings) {
    audioSynth.setVolume(state.settings.soundVolume);
    audioSynth.setMuted(state.settings.soundMuted);
  }

  const applyHostFont = (fSize) => {
    host.classList.remove('font-size-normal', 'font-size-large', 'font-size-huge');
    host.classList.add(`font-size-${fSize || 'normal'}`);
  };
  applyHostFont(state.settings?.fontSize);

  // Initialize Handheld Device Modal
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

  // Initialize Quick Action Bubble
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

  // Initialize Roaming Pet Controller
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
    applyHostFont(state.settings?.fontSize);
    controller.updatePetData(state.pet, state.settings);
    handheld.updateState(state);
  });

  // Listen for extension popup messages
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
      } else if (msg.action === 'focus_nudge') {
        controller.showEmote('sweat', 2500);
        bubble.showNudge(msg.message || 'Stay focused on your quest!', controller.x, controller.y);
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
})();

/**
 * Loads and injects CSS into Shadow DOM
 */
async function injectStyles(shadowRoot) {
  const contentCssUrl = chrome.runtime.getURL('content/content.css');
  const modalCssUrl = chrome.runtime.getURL('ui/handheld-modal.css');

  const link1 = document.createElement('link');
  link1.rel = 'stylesheet';
  link1.href = contentCssUrl;

  const link2 = document.createElement('link');
  link2.rel = 'stylesheet';
  link2.href = modalCssUrl;

  const link3 = document.createElement('link');
  link3.rel = 'stylesheet';
  link3.href = chrome.runtime.getURL('ui/celebration-modal.css');

  shadowRoot.appendChild(link1);
  shadowRoot.appendChild(link2);
  shadowRoot.appendChild(link3);
}

