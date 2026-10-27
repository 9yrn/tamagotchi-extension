/**
 * Poyori (ポヨリ) — Toolbar Popup Classification Buttons Test
 * Verifies domain normalization (www prefix, subdomains),
 * interactive click reactions, toggling behavior, and visual active states.
 */

import test from 'node:test';
import assert from 'node:assert';
import { PoyoriEngine } from '../shared/game-engine.js';
import { DEFAULT_STATE } from '../shared/constants.js';

test('TDD: PoyoriEngine.classifyDomain normalizes www prefix in customEducational', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));

  // Case 1: Custom rule stored as "google.com", tested with "www.google.com"
  state.settings.customEducational = [{ domain: 'google.com', category: 'denki' }];
  const cat1 = PoyoriEngine.classifyDomain('www.google.com', state);
  assert.strictEqual(cat1, 'denki', 'www.google.com must match google.com custom rule');

  // Case 2: Custom rule stored as "www.google.com", tested with "google.com"
  state.settings.customEducational = [{ domain: 'www.google.com', category: 'chishiki' }];
  const cat2 = PoyoriEngine.classifyDomain('google.com', state);
  assert.strictEqual(cat2, 'chishiki', 'google.com must match www.google.com custom rule');

  // Case 3: Subdomain "docs.google.com" matches "google.com"
  state.settings.customEducational = [{ domain: 'google.com', category: 'denki' }];
  const cat3 = PoyoriEngine.classifyDomain('docs.google.com', state);
  assert.strictEqual(cat3, 'denki', 'docs.google.com must match google.com custom rule');
});

test('TDD: PoyoriEngine.classifyDomain normalizes www prefix in customDistracting', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));

  // Stored as "google.com", tested with "www.google.com"
  state.settings.customDistracting = ['google.com'];
  const cat1 = PoyoriEngine.classifyDomain('www.google.com', state);
  assert.strictEqual(cat1, 'distracting', 'www.google.com must match distracting rule for google.com');

  // Stored as "www.google.com", tested with "google.com"
  state.settings.customDistracting = ['www.google.com'];
  const cat2 = PoyoriEngine.classifyDomain('google.com', state);
  assert.strictEqual(cat2, 'distracting', 'google.com must match distracting rule for www.google.com');
});

test('TDD: Popup Category Tagging & Toggling logic', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  const currentDomain = 'www.google.com';
  const cleanDomain = currentDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0];

  // Helper simulating popup button click logic
  function applyCategoryClick(targetCat) {
    const currentCat = PoyoriEngine.classifyDomain(currentDomain, state);

    // Remove existing overrides
    state.settings.customEducational = (state.settings.customEducational || []).filter(e => {
      const cleanE = (e.domain || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0];
      return cleanE !== cleanDomain;
    });
    state.settings.customDistracting = (state.settings.customDistracting || []).filter(d => {
      const cleanD = (typeof d === 'string' ? d : d.domain || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0];
      return cleanD !== cleanDomain;
    });

    if (currentCat !== targetCat) {
      if (targetCat === 'distracting') {
        state.settings.customDistracting.push(cleanDomain);
      } else {
        state.settings.customEducational.push({ domain: cleanDomain, category: targetCat });
      }
    }
  }

  // 1. Initial state is neutral
  assert.strictEqual(PoyoriEngine.classifyDomain(currentDomain, state), 'neutral');

  // 2. Click "Coding" (denki)
  applyCategoryClick('denki');
  assert.strictEqual(PoyoriEngine.classifyDomain(currentDomain, state), 'denki');
  assert.strictEqual(state.settings.customEducational.length, 1);

  // 3. Click "Coding" again -> Toggles OFF back to neutral
  applyCategoryClick('denki');
  assert.strictEqual(PoyoriEngine.classifyDomain(currentDomain, state), 'neutral');
  assert.strictEqual(state.settings.customEducational.length, 0);

  // 4. Click "Study" (chishiki)
  applyCategoryClick('chishiki');
  assert.strictEqual(PoyoriEngine.classifyDomain(currentDomain, state), 'chishiki');

  // 5. Click "Distract" (distracting) -> Switches category directly
  applyCategoryClick('distracting');
  assert.strictEqual(PoyoriEngine.classifyDomain(currentDomain, state), 'distracting');
  assert.strictEqual(state.settings.customEducational.length, 0);
  assert.strictEqual(state.settings.customDistracting.length, 1);
});

test('Popup UI: CSS contains button active, hover, and press states with visual feedback', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const css = fs.readFileSync(path.join(__dirname, '../popup/popup.css'), 'utf-8');
  assert.ok(css.includes('.tag-btn:hover'), 'CSS must include hover state for .tag-btn');
  assert.ok(css.includes('.tag-btn:active'), 'CSS must include active/press state for .tag-btn');
  assert.ok(css.includes('.tag-btn.active[data-cat="denki"]'), 'CSS must include active style for denki button');
  assert.ok(css.includes('.tag-btn.active[data-cat="chishiki"]'), 'CSS must include active style for chishiki button');
  assert.ok(css.includes('.tag-btn.active[data-cat="distracting"]'), 'CSS must include active style for distracting button');
  assert.ok(css.includes('.site-feedback'), 'CSS must include site-feedback toast');
  assert.ok(css.includes('@keyframes tag-pop'), 'CSS must include tag-pop bounce animation');

  const html = fs.readFileSync(path.join(__dirname, '../popup/popup.html'), 'utf-8');
  assert.ok(html.includes('id="site-feedback"'), 'HTML must include site-feedback container');
});
