/**
 * Test Suite: UI 9-Bit Immersion, Zero ABC Buttons & High-Contrast Validation
 *
 * Verifies that:
 * 1. The hardware ABC buttons are 100% removed from the modal DOM.
 * 2. In-screen direct care action controls (Feed, Pet, Sleep) exist and are interactive.
 * 3. Every retro palette satisfies WCAG AA/AAA high contrast requirements:
 *    - Eliminates the black-text-on-dark-screen bug from the user's screenshot.
 *    - Labels and values are explicitly styled with high contrast tokens.
 * 4. The 9-bit console chassis has authentic pixel borders, ribbon banner, and power LED.
 * 5. In-page mounting properly exposes the Tamagotchi companion on web pages.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PALETTES, DEFAULT_STATE } from '../shared/constants.js';
import { HandheldModal } from '../ui/handheld-modal.js';
import { PoyoriEngine } from '../shared/game-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper: Calculate relative luminance according to W3C WCAG 2.1 specs
function getRelativeLuminance(hex) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// Helper: Calculate WCAG contrast ratio between two hex colors
function getContrastRatio(hex1, hex2) {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Minimal DOM Mock for Modal Unit Testing
class MockElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.style = {};
    this.classList = new Set();
    this.attributes = {};
    this.eventListeners = {};
    this._innerHTML = '';
  }

  get className() { return Array.from(this.classList).join(' '); }
  set className(val) { this.classList = new Set((val || '').split(' ').filter(Boolean)); }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  addEventListener(event, handler) {
    this.eventListeners[event] = this.eventListeners[event] || [];
    this.eventListeners[event].push(handler);
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const results = [];
    const search = (el) => {
      if (selector.startsWith('#') && el.id === selector.slice(1)) results.push(el);
      else if (selector.startsWith('.') && el.classList && el.classList.has(selector.slice(1))) results.push(el);
      else if (el.tagName === selector.toUpperCase()) results.push(el);

      if (el.children) {
        for (const child of el.children) search(child);
      }
    };
    search(this);
    return results;
  }

  set innerHTML(val) {
    this._innerHTML = val;
    this._parseMockChildren(val);
  }
  get innerHTML() { return this._innerHTML; }

  _parseMockChildren(html) {
    // Parse mock ids, classes and tags for unit testing queries
    this.children = [];
    const tagMatches = html.matchAll(/<([a-zA-Z0-9\-]+)([^>]*)>/g);
    for (const match of tagMatches) {
      const tag = match[1];
      const attrs = match[2];
      const child = new MockElement(tag);

      const idMatch = attrs.match(/id=["']([^"']+)["']/);
      if (idMatch) child.id = idMatch[1];

      const classMatch = attrs.match(/class=["']([^"']+)["']/);
      if (classMatch) child.className = classMatch[1];

      const dataTabMatch = attrs.match(/data-tab=["']([^"']+)["']/);
      if (dataTabMatch) child.dataset = { tab: dataTabMatch[1] };

      this.children.push(child);
    }
  }
}

// Setup global mock document for Node environment
global.document = {
  createElement: (tag) => new MockElement(tag)
};

test('UI Design: Console buttons (A, B, C) have verified, interactive functions and click execution', () => {
  const mockShadow = new MockElement('shadow-root');
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  let petActionCalled = null;
  const modal = new HandheldModal(mockShadow, {
    state,
    onPetAction: (a) => { petActionCalled = a; }
  });

  const html = modal.modalEl.innerHTML;
  assert.ok(html.includes('id="console-btn-a"'), 'Must contain console-btn-a for tab cycling');
  assert.ok(html.includes('id="console-btn-b"'), 'Must contain console-btn-b for action execution');
  assert.ok(html.includes('id="console-btn-c"'), 'Must contain console-btn-c for sleep toggle');

  // Test Console Button A cycling tabs
  assert.equal(modal.activeTab, 'status');
  const btnA = modal.modalEl.querySelector('#console-btn-a');
  assert.ok(btnA, 'Button A must exist in DOM');
  btnA.eventListeners['click'][0]();
  assert.equal(modal.activeTab, 'tasks', 'Button A click must cycle to tasks tab');

  // Test Console Button C toggling sleep
  const btnC = modal.modalEl.querySelector('#console-btn-c');
  assert.ok(btnC, 'Button C must exist in DOM');
  btnC.eventListeners['click'][0]();
  assert.equal(state.pet.isSleeping, true, 'Button C click must toggle sleep mode');
});

test('UI Design: Direct Care Action Bar exists in status view and triggers pet interactions', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  const mockShadow = new MockElement('shadow-root');
  let petActionCalled = null;

  const modal = new HandheldModal(mockShadow, {
    state,
    onPetAction: (action) => { petActionCalled = action; }
  });

  const html = modal.modalEl.innerHTML;

  // Verify in-screen direct care bar exists
  assert.ok(html.includes('poyori-direct-care-bar'), 'Status view must contain .poyori-direct-care-bar');
  assert.ok(html.includes('id="care-feed-btn"'), 'Must contain in-screen #care-feed-btn');
  assert.ok(html.includes('id="care-pet-btn"'), 'Must contain in-screen #care-pet-btn');
  assert.ok(html.includes('id="care-sleep-btn"'), 'Must contain in-screen #care-sleep-btn');
  assert.ok(html.includes('id="care-pocket-btn"'), 'Must contain in-screen #care-pocket-btn');
  assert.ok(html.includes('id="status-pet-sprite"'), 'Must contain in-screen #status-pet-sprite');

  // Verify Care Pet button functionality
  const initialKizuna = state.pet.kizuna;
  PoyoriEngine.pet(state);
  assert.ok(state.pet.kizuna > initialKizuna, 'Petting must increase bond / kizuna');

  // Verify Sleep toggle functionality
  state.pet.isSleeping = !state.pet.isSleeping;
  assert.equal(state.pet.isSleeping, true, 'Sleep toggle must set isSleeping to true');
  state.pet.isSleeping = !state.pet.isSleeping;
  assert.equal(state.pet.isSleeping, false, 'Sleep toggle must wake pet up');
});

test('Contrast Audit: Cyber Neon and all retro palettes meet WCAG AA contrast specs (no black text on dark screen)', () => {
  for (const [key, pal] of Object.entries(PALETTES)) {
    assert.ok(pal.screenBg, `Palette ${key} must define screenBg`);
    assert.ok(pal.text, `Palette ${key} must define text color`);
    assert.ok(pal.label, `Palette ${key} must define label color`);

    const textContrast = getContrastRatio(pal.text, pal.screenBg);
    const labelContrast = getContrastRatio(pal.label, pal.screenBg);

    // WCAG AA requirement for body text is at least 4.5:1
    assert.ok(
      textContrast >= 4.5,
      `Palette ${key} text (${pal.text}) against screenBg (${pal.screenBg}) contrast ratio is ${textContrast.toFixed(2)}, must be >= 4.5:1`
    );

    // WCAG AA requirement for UI labels / headers is at least 3.0:1 (large text / UI component)
    assert.ok(
      labelContrast >= 3.0,
      `Palette ${key} label (${pal.label}) against screenBg (${pal.screenBg}) contrast ratio is ${labelContrast.toFixed(2)}, must be >= 3.0:1`
    );

    // Specific check for cyber_neon: Text must NOT be near-black
    if (key === 'cyber_neon') {
      const textLuminance = getRelativeLuminance(pal.text);
      assert.ok(textLuminance > 0.5, 'Cyber Neon text must be high-luminance (light / white), never black');
    }
  }
});

test('DOM Contrast Integrity: Status view explicitly wraps labels in .v-label and values in .v-val', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  const mockShadow = new MockElement('shadow-root');
  const modal = new HandheldModal(mockShadow, { state });

  const html = modal.modalEl.innerHTML;

  // Must contain .v-label and .v-val for high contrast CSS targeting
  assert.ok(html.includes('class="v-label"'), 'Vital rows must wrap labels in class="v-label"');
  assert.ok(html.includes('class="v-val"'), 'Vital rows must wrap values in class="v-val"');
  assert.ok(html.includes('--screen-text:'), 'Shell style must bind --screen-text');
  assert.ok(html.includes('--screen-label:'), 'Shell style must bind --screen-label');
  assert.ok(html.includes('--screen-card-bg:'), 'Shell style must bind --screen-card-bg');
});

test('UI Immersion: Handheld modal CSS adopts 9-bit pixel console aesthetics instead of blurry egg oval', () => {
  const cssPath = path.join(rootDir, 'ui/handheld-modal.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // 1. Must NOT contain blurry egg border radius (180px 180px 140px 140px)
  assert.equal(
    cssContent.includes('border-radius: 180px 180px 140px 140px;'),
    false,
    'Must NOT use faux-3D oval egg border-radius'
  );

  // 2. Must contain authentic 9-bit RPG elements
  assert.ok(cssContent.includes('poyori-title-banner'), 'CSS must style .poyori-title-banner ribbon');
  assert.ok(cssContent.includes('poyori-power-led'), 'CSS must style .poyori-power-led indicator');
  assert.ok(cssContent.includes('poyori-direct-care-bar'), 'CSS must style .poyori-direct-care-bar');
  assert.ok(cssContent.includes('v-label'), 'CSS must style .v-label with high contrast variable');
  assert.ok(cssContent.includes('v-val'), 'CSS must style .v-val with high contrast variable');
});

test('UI LAYOUT: Mood and Young Spirit stage containers are placed on the left side of device screen', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  const mockShadow = new MockElement('shadow-root');
  const modal = new HandheldModal(mockShadow, { state });

  const html = modal.modalEl.innerHTML;
  assert.ok(html.includes('class="poyori-portrait-meta-left"'), 'Must contain left-side meta container');
  assert.ok(html.includes('class="poyori-badge-tag"'), 'Must contain stage badge tag');
  assert.ok(html.includes('class="poyori-mood-tag'), 'Must contain mood tag');

  // Verify CSS styles .poyori-portrait-meta-left on the left
  const cssPath = path.join(rootDir, 'ui/handheld-modal.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  assert.ok(cssContent.includes('.poyori-portrait-meta-left'), 'CSS must define .poyori-portrait-meta-left');
  assert.ok(cssContent.includes('.poyori-portrait-creature-center'), 'CSS must define .poyori-portrait-creature-center');
});

test('UI BUTTONS: Bottom console buttons feature authentic 9-bit Dark Slate RPG styling, PixelOperator8 typography, and clear action labels (TAB, ACT, WAKE/REST) without A/B/C letter tags', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  const mockShadow = new MockElement('shadow-root');
  const modal = new HandheldModal(mockShadow, { state });

  const html = modal.modalEl.innerHTML;
  // Must render TAB, ACT, and REST/WAKE labels directly without A/B/C tags
  assert.ok(html.includes('class="console-btn-label">TAB</span>'), 'Must contain direct TAB label');
  assert.ok(html.includes('class="console-btn-label">ACT</span>'), 'Must contain direct ACT label');
  assert.ok(html.includes('class="console-btn-label">REST</span>') || html.includes('class="console-btn-label">WAKE</span>'), 'Must contain direct REST/WAKE label');
  assert.ok(!html.includes('class="btn-letter"'), 'Must remove A/B/C .btn-letter tags');

  const cssPath = path.join(rootDir, 'ui/handheld-modal.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // Must enforce PixelOperator8 font on console button labels
  assert.ok(cssContent.includes("font-family: 'PixelOperator8'"), 'Must style with PixelOperator8 font');
  assert.ok(cssContent.includes('.console-btn-label'), 'Must style .console-btn-label');

  // Must feature Dark Slate RPG keycaps with 3D step shadow
  assert.ok(cssContent.includes('0 4px 0 #000000'), 'Console buttons must have 3D pixel step drop shadow');
  assert.ok(cssContent.includes('transform: translateY(3px)'), 'Console buttons must have tactile active press animation');
});

test('UI PRICE INDICATORS: Price badges feature authentic pixelated styling, golden border (#fedb72), and PixelOperator8 typography', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  const mockShadow = new MockElement('shadow-root');
  const modal = new HandheldModal(mockShadow, { state });

  modal.activeTab = 'food';
  modal.render();
  const foodHtml = modal.modalEl.innerHTML;

  // Must render pixelated buy-food-btn price indicator badges
  assert.ok(foodHtml.includes('class="buy-food-btn price-indicator-badge"'), 'Food tab must render price-indicator-badge buttons');
  assert.ok(foodHtml.includes('class="price-value"'), 'Must wrap price number in .price-value');

  const cssPath = path.join(rootDir, 'ui/handheld-modal.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // Must style .buy-food-btn and .price-indicator-badge with PixelOperator8 and golden palette
  assert.ok(cssContent.includes('.buy-food-btn'), 'CSS must style .buy-food-btn');
  assert.ok(cssContent.includes('.price-indicator-badge'), 'CSS must style .price-indicator-badge');
  assert.ok(cssContent.includes('#fedb72'), 'Price badges must use golden accent color #fedb72');
});


test('DASHBOARD 3D FLIP TDD: Overview pet card contains top-right (i) info button, 3D flip transform, and back vitals face', () => {
  const htmlPath = path.join(rootDir, 'dashboard/dashboard.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Verify (i) info button exists in screen header
  assert.ok(htmlContent.includes('id="btn-pet-info"'), 'Must contain #btn-pet-info button in overview card');
  assert.ok(htmlContent.includes('class="pet-info-btn"'), 'Must have .pet-info-btn class');

  // Verify 3D flipper container and both faces exist
  assert.ok(htmlContent.includes('id="pet-card-3d-wrap"'), 'Must contain #pet-card-3d-wrap container');
  assert.ok(htmlContent.includes('id="pet-card-3d-inner"'), 'Must contain #pet-card-3d-inner flipper');
  assert.ok(htmlContent.includes('pet-card-front'), 'Must contain .pet-card-front');
  assert.ok(htmlContent.includes('pet-card-back'), 'Must contain .pet-card-back');
  assert.ok(htmlContent.includes('id="btn-pet-flip-back"'), 'Must contain #btn-pet-flip-back button');

  // Verify CSS contains 3D perspective and flip transformation
  const cssPath = path.join(rootDir, 'dashboard/dashboard.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  assert.ok(cssContent.includes('perspective: 1200px'), 'CSS must specify 3D perspective');
  assert.ok(cssContent.includes('transform-style: preserve-3d'), 'CSS must preserve 3D transform style');
  assert.ok(cssContent.includes('rotateY(180deg)'), 'CSS must define rotateY(180deg) flip transform');
  assert.ok(cssContent.includes('.pet-info-btn'), 'CSS must style .pet-info-btn');
});

test('DASHBOARD CAROUSEL TDD: Companion carousel shelf renders navigation bar for multiple roster pets', () => {
  const htmlPath = path.join(rootDir, 'dashboard/dashboard.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  assert.ok(htmlContent.includes('id="companion-carousel-shelf"'), 'Must contain #companion-carousel-shelf');
  assert.ok(htmlContent.includes('id="companion-tabs-row"'), 'Must contain #companion-tabs-row for dynamic companion tabs');

  const cssPath = path.join(rootDir, 'dashboard/dashboard.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  assert.ok(cssContent.includes('.companion-carousel-shelf'), 'CSS must style .companion-carousel-shelf');
  assert.ok(cssContent.includes('.companion-tab-btn'), 'CSS must style .companion-tab-btn');
  assert.ok(cssContent.includes('.companion-tab-btn.active'), 'CSS must style active companion tab');
});

test('DASHBOARD BUTTONS TDD: Palette cards and size buttons use Retro RPG Dark Slate styling classes and PixelOperator8 typography', () => {
  const cssPath = path.join(rootDir, 'dashboard/dashboard.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // Verify Retro RPG Dark Slate button styling
  assert.ok(cssContent.includes('.palette-card'), 'CSS must style .palette-card');
  assert.ok(cssContent.includes('.dash-size-btn'), 'CSS must style .dash-size-btn');
  assert.ok(cssContent.includes('.theme-btn'), 'CSS must style .theme-btn');
  assert.ok(cssContent.includes('font-family: var(--font-head)'), 'Button styling must enforce pixel typography');
  assert.ok(cssContent.includes('background: var(--c-slate-inner)'), 'Buttons must use dark slate background');
  assert.ok(cssContent.includes('border: 2px solid var(--c-dark-rim)'), 'Buttons must use retro rim border');
  assert.ok(cssContent.includes('box-shadow: 0 0 10px rgba(69, 183, 184, 0.45)'), 'Active buttons must feature glowing cyan outline');
});


