/**
 * Test Suite: In-Page Content Script Injection & Sprite Rendering Integrity
 *
 * Specifically verifies:
 * 1. SVG sprite URIs are safe base64 strings and NEVER leak raw markup or '%3Crect' text.
 * 2. Injected Shadow DOM structure exists and contains all required components.
 * 3. The Tamagotchi companion is present, styled, and interactive on web pages.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CREATURES } from '../shared/constants.js';
import { getCreatureSprite, getAccessorySvg } from '../content/sprites.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('Every creature sprite produces a valid, clean Base64 SVG Data URI with zero HTML clutter', () => {
  const creatureList = Object.values(CREATURES);
  assert.ok(creatureList.length >= 24, 'Must verify all 24 creatures');

  for (const creature of creatureList) {
    const idleUri = getCreatureSprite(creature.id, 'idle1');
    const walkUri = getCreatureSprite(creature.id, 'idle2');

    // Must be base64 data URI
    assert.ok(
      idleUri.startsWith('data:image/svg+xml;base64,'),
      `Creature ${creature.id} idle sprite must start with data:image/svg+xml;base64,`
    );
    assert.ok(
      walkUri.startsWith('data:image/svg+xml;base64,'),
      `Creature ${creature.id} walk sprite must start with data:image/svg+xml;base64,`
    );

    // CRITICAL: Must NEVER contain unescaped HTML characters that broke the display in the user's screenshot
    assert.equal(idleUri.includes('%3Crect'), false, `Sprite URI must NOT contain raw percent-encoded '%3Crect' text`);
    assert.equal(idleUri.includes('<svg'), false, `Sprite URI must NOT contain raw unencoded '<svg' text`);
    assert.equal(idleUri.includes('"'), false, `Sprite URI must NOT contain quotes that break HTML attributes`);

    // Verify base64 decodes back to valid SVG containing <svg and </svg>
    const b64Data = idleUri.replace('data:image/svg+xml;base64,', '');
    const decodedXml = Buffer.from(b64Data, 'base64').toString('utf8');
    assert.ok(decodedXml.includes('<svg xmlns="http://www.w3.org/2000/svg"'));
    assert.ok(decodedXml.includes('</svg>'));
    assert.ok(decodedXml.includes('<rect '));
  }
});

test('Accessory overlays produce valid Base64 SVG Data URIs', () => {
  const accessories = ['hachimaki', 'tanuki_leaf', 'wizard_hat', 'cyber_visor', 'golden_crown'];

  for (const acc of accessories) {
    const accUri = getAccessorySvg(acc);
    assert.ok(accUri, `Accessory ${acc} must generate an SVG URI`);
    assert.ok(accUri.startsWith('data:image/svg+xml;base64,'));
    assert.equal(accUri.includes('%3Crect'), false);

    const decoded = Buffer.from(accUri.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf8');
    assert.ok(decoded.includes('<svg'));
    assert.ok(decoded.includes('</svg>'));
  }
});

test('In-page Content Bundle contains all required runtime components and embedded fonts', () => {
  const bundlePath = path.join(rootDir, 'content/content.bundle.js');
  assert.ok(fs.existsSync(bundlePath), 'content/content.bundle.js must exist on disk');

  const bundleCode = fs.readFileSync(bundlePath, 'utf8');

  // Verify font embedding
  assert.ok(bundleCode.includes("font-family: 'PixelOperator8'"), 'Must contain PixelOperator8 font face');
  assert.ok(bundleCode.includes("font-family: 'PixelOperator'"), 'Must contain PixelOperator font face');

  // Verify DOM mount target setup
  assert.ok(bundleCode.includes('poyori-root'), 'Must reference poyori-root container');
  assert.ok(bundleCode.includes('attachShadow({ mode: \'open\' })'), 'Must attach Shadow DOM');
  assert.ok(bundleCode.includes('poyori-pet-container'), 'Must reference roaming pet container');
  assert.ok(bundleCode.includes('poyori-quick-bubble'), 'Must reference quick speech bubble');
  assert.ok(bundleCode.includes('poyori-device-overlay'), 'Must reference handheld device modal');
});

test('Content bundle parses cleanly as a non-module script without any illegal export/import tokens', async () => {
  const vm = await import('node:vm');
  const bundlePath = path.join(rootDir, 'content/content.bundle.js');
  const bundleCode = fs.readFileSync(bundlePath, 'utf8');

  // Must not throw SyntaxError: Unexpected token 'export'
  assert.doesNotThrow(() => {
    new vm.default.Script(bundleCode);
  }, 'Content bundle must parse cleanly as a classic browser script');

  // Verify no 'export ' statements exist anywhere in the bundle
  const matches = bundleCode.match(/^export\s+/gm);
  assert.equal(matches, null, 'Must contain zero export tokens');
});

test('DOM Simulation: Content bundle successfully initializes Shadow DOM and mounts pet', async () => {
  // Construct a minimal browser mock environment in Node to test execution
  class MockElement {
    constructor(tagName) {
      this.tagName = tagName.toUpperCase();
      this.children = [];
      this.style = {};
      this.classList = new Set();
      this.attributes = {};
      this.eventListeners = {};
      this.shadowRoot = null;
      this._innerHTML = '';
      this.textContent = '';
    }

    get className() { return Array.from(this.classList).join(' '); }
    set className(val) {
      this.classList = new Set(val.split(' ').filter(Boolean));
    }

    appendChild(child) {
      this.children.push(child);
      return child;
    }

    attachShadow(options) {
      this.shadowRoot = new MockElement('shadow-root');
      return this.shadowRoot;
    }

    addEventListener(event, handler) {
      this.eventListeners[event] = this.eventListeners[event] || [];
      this.eventListeners[event].push(handler);
    }

    querySelector(selector) {
      return this.children.find(c => {
        if (selector.startsWith('.')) return c.classList.has(selector.slice(1));
        if (selector.startsWith('#')) return c.id === selector.slice(1);
        return c.tagName === selector.toUpperCase();
      }) || null;
    }

    querySelectorAll(selector) {
      return this.children.filter(c => {
        if (selector.startsWith('.')) return c.classList.has(selector.slice(1));
        return c.tagName === selector.toUpperCase();
      });
    }

    set innerHTML(val) {
      this._innerHTML = val;
    }
    get innerHTML() {
      return this._innerHTML;
    }
  }

  const mockBody = new MockElement('body');
  const mockDoc = {
    body: mockBody,
    documentElement: new MockElement('html'),
    createElement: (tag) => new MockElement(tag),
    getElementById: (id) => (mockBody.children.find(c => c.id === id) || null),
    addEventListener: () => {},
    readyState: 'complete'
  };

  const bundlePath = path.join(rootDir, 'content/content.bundle.js');
  const bundleCode = fs.readFileSync(bundlePath, 'utf8');

  const vm = await import('node:vm');
  let loopRunning = true;
  const messageListeners = [];
  const sandbox = {
    window: {},
    document: mockDoc,
    location: { hostname: 'developer.mozilla.org' },
    innerWidth: 1024,
    innerHeight: 768,
    addEventListener: () => {},
    removeEventListener: () => {},
    requestAnimationFrame: (cb) => {
      if (loopRunning) {
        // Run once synchronously then stop
        loopRunning = false;
        cb(16);
      }
    },
    setTimeout: (fn) => { fn(); return 1; },
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    AudioContext: class {
      createGain() { return { gain: { value: 1, setValueAtTime: () => {} }, connect: () => {} }; }
      createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, frequency: { setValueAtTime: () => {} } }; }
    },
    chrome: {
      storage: {
        local: {
          get: (keys, cb) => cb({}),
          set: (items, cb) => cb && cb()
        },
        onChanged: { addListener: () => {} }
      },
      runtime: {
        onMessage: {
          addListener: (fn) => { messageListeners.push(fn); }
        },
        getURL: (p) => `chrome-extension://mock-id/${p}`
      }
    },
    console: { log: () => {}, error: () => {}, warn: () => {} }
  };
  sandbox.window = sandbox;

  vm.default.createContext(sandbox);
  vm.default.runInContext(bundleCode, sandbox);

  // Allow async bootPoyori() to complete
  await new Promise(resolve => setTimeout(resolve, 30));

  // Assert in-page root exists
  const root = mockDoc.getElementById('poyori-root');
  assert.ok(root, 'In-page host element #poyori-root must be mounted in document body');
  assert.ok(root.shadowRoot, 'Root host must attach an open Shadow DOM');

  // Verify all in-page components exist inside the Shadow DOM
  const shadowChildren = root.shadowRoot.children;
  assert.ok(shadowChildren.length >= 3, `Shadow DOM must contain stylesheets, pet container, bubble, and modal (found ${shadowChildren.length})`);

  const petContainer = shadowChildren.find(c => c.classList && c.classList.has('poyori-pet-container'));
  assert.ok(petContainer, 'Roaming pet container (.poyori-pet-container) must be present in Shadow DOM');

  // Verify bottom-right domain badge is cleanly removed so it does not clutter pages
  const domainBadge = shadowChildren.find(c => c.classList && c.classList.has('poyori-domain-badge'));
  assert.strictEqual(domainBadge, undefined, 'Intrusive bottom-right domain badge (.poyori-domain-badge) must be removed from web pages');

  const bubble = shadowChildren.find(c => c.classList && c.classList.has('poyori-quick-bubble'));
  assert.ok(bubble, 'Quick speech bubble (.poyori-quick-bubble) must be present in Shadow DOM');

  const deviceModal = shadowChildren.find(c => c.classList && c.classList.has('poyori-device-overlay'));
  assert.ok(deviceModal, 'Retro handheld device modal (.poyori-device-overlay) must be present in Shadow DOM');

  const celebrateModal = shadowChildren.find(c => c.classList && c.classList.has('poyori-celebrate-overlay'));
  assert.ok(celebrateModal, 'Celebration fanfare modal (.poyori-celebrate-overlay) must be mounted in Shadow DOM');

  // Verify bundled modal in DOM simulation has direct care actions and zero ABC buttons
  const modalHtml = deviceModal.innerHTML;
  assert.ok(modalHtml.includes('poyori-direct-care-bar'), 'Bundled device modal must include direct care action bar');
  assert.ok(modalHtml.includes('care-feed-btn'), 'Bundled device modal must include care-feed-btn');
  assert.ok(modalHtml.includes('care-pet-btn'), 'Bundled device modal must include care-pet-btn');
  assert.ok(modalHtml.includes('care-sleep-btn'), 'Bundled device modal must include care-sleep-btn');
  assert.ok(modalHtml.includes('console-btn-a'), 'Bundled device modal must include functional console-btn-a');
  assert.ok(modalHtml.includes('console-btn-b'), 'Bundled device modal must include functional console-btn-b');
  assert.ok(modalHtml.includes('console-btn-c'), 'Bundled device modal must include functional console-btn-c');

  // Verify runtime message listener handles set_pet_size and toggle_pet_visibility
  assert.ok(messageListeners.length > 0, 'Bundle must register a chrome.runtime.onMessage listener');
  const onMsg = messageListeners[0];

  // Test resizing via message
  let responseVal = null;
  onMsg({ action: 'set_pet_size', size: 'giant', sizePx: 96 }, {}, (res) => { responseVal = res; });
  assert.equal(responseVal?.success, true);
  assert.strictEqual(petContainer.style.width, '96px');
  assert.strictEqual(petContainer.style.height, '96px');

  // Test toggling visibility via Pocket Mode message
  responseVal = null;
  onMsg({ action: 'toggle_pet_visibility', visible: false, pocketMode: true }, {}, (res) => { responseVal = res; });
  assert.equal(responseVal?.success, true);
  assert.strictEqual(petContainer.style.display, 'none');

  // Test waking up from Pocket Mode
  responseVal = null;
  onMsg({ action: 'toggle_pet_visibility', visible: true, pocketMode: false }, {}, (res) => { responseVal = res; });
  assert.equal(responseVal?.success, true);
  assert.strictEqual(petContainer.style.display, 'flex');
});
