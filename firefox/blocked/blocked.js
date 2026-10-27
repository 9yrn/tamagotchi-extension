/**
 * Poyori (ポヨリ) — Silly Blocked Page Logic
 * Renders dynamic guardian sprite and distinct randomized silly decree on every access.
 */

import { getState } from '../shared/storage.js';
import { PoyoriEngine } from '../shared/game-engine.js';
import { getCreatureSprite } from '../content/sprites.js';

document.addEventListener('DOMContentLoaded', async () => {
  const state = await getState();

  // 1. Parse blocked target domain from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const domain = urlParams.get('domain') || 'restricted-domain.com';
  const domainEl = document.getElementById('blocked-domain');
  if (domainEl) {
    domainEl.textContent = domain;
  }

  // 2. Select a randomized, silly decree befitting Poyori
  const quoteEl = document.getElementById('silly-quote');
  if (quoteEl) {
    quoteEl.textContent = PoyoriEngine.getRandomBlockedQuote();
  }

  // 3. Render Guardian Poyori sprite (grumpy guardian pose)
  const spriteEl = document.getElementById('guardian-sprite');
  if (spriteEl) {
    const petId = (state.pet && state.pet.creatureId) || 'denki_tamago';
    spriteEl.src = getCreatureSprite(petId, 'grumpy');
  }

  // 4. Return to productivity button
  const returnBtn = document.getElementById('btn-return');
  if (returnBtn) {
    returnBtn.addEventListener('click', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = 'https://developer.mozilla.org';
      }
    });
  }

  // 5. Open Dashboard portal button
  const dashBtn = document.getElementById('btn-dashboard');
  if (dashBtn) {
    dashBtn.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        window.location.href = chrome.runtime.getURL('dashboard/dashboard.html');
      } else {
        window.location.href = '../dashboard/dashboard.html';
      }
    });
  }
});
