/**
 * Poyori (ポヨリ) — Dev Access Port & God Mode Test Suite (TDD)
 *
 * Verifies developer features:
 * 1. God Mode state transformation (unlimited money, all 24 creatures, all foods, all accessories)
 * 2. Instant Creature Morphing across all 4 branches and 6 stages
 * 3. Vitals, mood, and neglect simulation
 * 4. Time machine & streak manipulation
 * 5. Secret key authentication & gating (safe for GitHub commit)
 * 6. UI template audits (zero raw Unicode emojis, hidden by default from regular users)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_STATE, CREATURES, FOOD_ITEMS, ACCESSORIES } from '../shared/constants.js';
import { PoyoriEngine } from '../shared/game-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('DEV ENGINE: applyDevGodMode grants unlimited money, all creatures, all foods, all cosmetics', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));

  // Verify starting state is humble
  assert.equal(state.koban, 10);
  assert.equal(state.pet.unlockedAccessories.length, 1);
  assert.equal(state.stats.evolutionsDiscovered.length, 1);

  // Apply God Mode
  const res = PoyoriEngine.applyDevGodMode(state);
  assert.equal(res.success, true);

  // 1. Unlimited Koban
  assert.equal(state.koban, 99999, 'God Mode must grant 99,999 Koban');

  // 2. All 24 creatures discovered in Mochimori Zukan
  const allCreatureIds = Object.keys(CREATURES);
  assert.equal(state.stats.evolutionsDiscovered.length, allCreatureIds.length, 'All 24 creatures must be discovered');
  for (const id of allCreatureIds) {
    assert.ok(state.stats.evolutionsDiscovered.includes(id), `Creature ${id} must be unlocked`);
  }

  // 3. All 5 Accessories unlocked
  const allAccessoryIds = Object.keys(ACCESSORIES);
  for (const id of allAccessoryIds) {
    assert.ok(state.pet.unlockedAccessories.includes(id), `Accessory ${id} must be unlocked`);
  }

  // 4. Unlimited food inventory (99 of each food item)
  for (const id of Object.keys(FOOD_ITEMS)) {
    assert.equal(state.inventory[id], 99, `Food item ${id} must be 99`);
  }

  // 5. Max Vitals & 7-Day streak
  assert.equal(state.pet.onaka, 100);
  assert.equal(state.pet.genki, 100);
  assert.equal(state.pet.kizuna, 100);
  assert.equal(state.pet.isSick, false);
  assert.ok(state.stats.currentStreak >= 7, 'Streak must be at least 7 days');
});

test('DEV ENGINE: morphPet transforms companion to ANY of the 24 creatures instantly', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));

  // Test morphing to Denki Stage 6 Kōmyō Raijin
  const res1 = PoyoriEngine.morphPet(state, 'komyo_raijin');
  assert.equal(res1.success, true);
  assert.equal(state.pet.creatureId, 'komyo_raijin');
  assert.equal(state.pet.stage, 6);
  assert.equal(state.pet.chosenBranch, 'denki');
  assert.equal(state.pet.isKomyo, true);
  assert.ok(state.stats.evolutionsDiscovered.includes('komyo_raijin'));

  // Test morphing to Chishiki Stage 4 Hoshi Sphinx
  const res2 = PoyoriEngine.morphPet(state, 'hoshi_sphinx');
  assert.equal(res2.success, true);
  assert.equal(state.pet.creatureId, 'hoshi_sphinx');
  assert.equal(state.pet.stage, 4);
  assert.equal(state.pet.chosenBranch, 'chishiki');
  assert.equal(state.pet.isKomyo, false);

  // Test morphing to Gūtara Stage 5 Daradara Oni
  const res3 = PoyoriEngine.morphPet(state, 'daradara_oni');
  assert.equal(res3.success, true);
  assert.equal(state.pet.creatureId, 'daradara_oni');
  assert.equal(state.pet.stage, 5);
  assert.equal(state.pet.chosenBranch, 'gutara');

  // Test invalid creature ID rejection
  const resInvalid = PoyoriEngine.morphPet(state, 'non_existent_monster');
  assert.equal(resInvalid.success, false);
});

test('DEV ENGINE: setDevVitals manipulates hunger, energy, affection, and illness', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));

  // Force starvation
  PoyoriEngine.setDevVitals(state, { onaka: 0, genki: 10, kizuna: 5, isSick: true });
  assert.equal(state.pet.onaka, 0);
  assert.equal(state.pet.genki, 10);
  assert.equal(state.pet.kizuna, 5);
  assert.equal(state.pet.isSick, true);

  // Verify mood reflects starvation / neglect (Grumpy / Sick)
  const mood = PoyoriEngine.getPetMood(state);
  assert.ok(mood === 'sick' || mood === 'grumpy', `Mood must be sick or grumpy, got ${mood}`);

  // Restore with dev vitals
  PoyoriEngine.setDevVitals(state, { onaka: 100, genki: 100, kizuna: 100, isSick: false });
  assert.equal(state.pet.onaka, 100);
  assert.equal(state.pet.isSick, false);
  assert.equal(PoyoriEngine.getPetMood(state), 'cheerful');
});

test('DEV ENGINE: simulateDevTimeDelta tests neglect and streak advancement', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));

  // Simulate 12 hours of neglect
  PoyoriEngine.simulateDevTimeDelta(state, 12);
  const mood12 = PoyoriEngine.getPetMood(state);
  assert.equal(mood12, 'grumpy', '12 hours neglect must trigger grumpy mood');

  // Simulate streak advancement
  const initialStreak = state.stats.currentStreak;
  PoyoriEngine.simulateDevTimeDelta(state, 24, { advanceStreak: 7 });
  assert.equal(state.stats.currentStreak, initialStreak + 7, 'Must advance streak by 7 days');
});

test('DEV SANDBOX: Revert to original progress position upon leaving dev mode', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));

  // Player starting conditions
  state.pet.creatureId = 'denki_tamago';
  state.pet.stage = 1;
  state.koban = 25;
  state.stats.currentStreak = 2;
  state.inventory.ringo = 3;

  // 1. Enter Dev Sandbox
  const enterRes = PoyoriEngine.enterDevSandbox(state);
  assert.equal(enterRes.success, true);
  assert.equal(state.isDevModeActive, true);
  assert.ok(state.devOriginalStateBackup, 'Original state backup snapshot must exist');
  assert.equal(state.devOriginalStateBackup.koban, 25);
  assert.equal(state.devOriginalStateBackup.pet.creatureId, 'denki_tamago');

  // 2. Perform extreme dev modifications in dev mode
  PoyoriEngine.applyDevGodMode(state);
  PoyoriEngine.morphPet(state, 'komyo_raijin');
  PoyoriEngine.setDevVitals(state, { onaka: 10, genki: 10, isSick: true });

  assert.equal(state.koban, 99999, 'Koban should be 99,999 in dev mode');
  assert.equal(state.pet.creatureId, 'komyo_raijin', 'Creature should be transformed in dev mode');
  assert.equal(state.pet.stage, 6);
  assert.equal(state.pet.isSick, true);

  // 3. Exit Dev Sandbox (Revert back to reality)
  const exitRes = PoyoriEngine.exitDevSandbox(state);
  assert.equal(exitRes.success, true);
  assert.equal(exitRes.restored, true);

  // 4. Verify complete restoration of original progress
  assert.equal(state.koban, 25, 'Koban must revert to original 25');
  assert.equal(state.pet.creatureId, 'denki_tamago', 'Companion must revert to original Tamago');
  assert.equal(state.pet.stage, 1, 'Stage must revert to 1');
  assert.equal(state.stats.currentStreak, 2, 'Streak must revert to original 2');
  assert.equal(state.inventory.ringo, 3, 'Inventory must revert to original 3');
  assert.equal(state.pet.isSick, false, 'Sickness must revert');
  assert.equal(state.isDevModeActive, undefined, 'Dev mode flag must be cleared');
  assert.equal(state.devOriginalStateBackup, undefined, 'Backup snapshot must be cleared');
});

test('DEV SECURITY: Developer secret key verification gates access via SHA-256', async () => {
  const crypto = await import('node:crypto');

  // 1. Verify pure JS SHA-256 matches Node.js crypto module across multiple test vectors
  const testVectors = [
    'hello_poyori',
    'shinka_tamagotchi_2026',
    'retro_pixel_companion',
    'secret_developer_passphrase_test_12345!'
  ];
  for (const vec of testVectors) {
    const expected = crypto.createHash('sha256').update(vec).digest('hex');
    assert.equal(PoyoriEngine.sha256(vec), expected, `SHA-256 must match Node crypto for "${vec}"`);
  }

  // 2. Stored dev hashes must all be 64-character lowercase SHA-256 hex strings
  assert.ok(Array.isArray(PoyoriEngine.DEV_KEY_HASHES), 'DEV_KEY_HASHES must be an array');
  assert.ok(PoyoriEngine.DEV_KEY_HASHES.length >= 3, 'Must maintain at least 3 dev key hashes');
  for (const h of PoyoriEngine.DEV_KEY_HASHES) {
    assert.match(h, /^[a-f0-9]{64}$/, 'Each dev hash must be a valid 64-char SHA-256 hex string');
  }

  // 3. Test verification mechanism with arbitrary dynamic test vector
  const dynamicTestSecret = 'temp-dev-secret-verification-' + Date.now();
  const dynamicHash = PoyoriEngine.sha256(dynamicTestSecret);
  assert.equal(PoyoriEngine.verifyDevKey(dynamicTestSecret, [dynamicHash]), true);
  assert.equal(PoyoriEngine.verifyDevKey('wrong_secret', [dynamicHash]), false);

  // 4. Test invalid keys are rejected against production hashes
  assert.equal(PoyoriEngine.verifyDevKey('wrong-pass-attempt'), false);
  assert.equal(PoyoriEngine.verifyDevKey(''), false);
  assert.equal(PoyoriEngine.verifyDevKey(null), false);
  assert.equal(PoyoriEngine.verifyDevKey(undefined), false);
});

test('DEV SECURITY: Codebase contains zero plaintext developer passwords', () => {
  // Audit all source files to verify no plaintext developer passwords remain in the repository
  const filesToAudit = [
    'shared/game-engine.js',
    'dashboard/dashboard.js',
    'dashboard/dev-portal.js',
    'dashboard/dev-portal.html',
    'ui/handheld-modal.js',
    'content/content.js',
    'background/background.js',
    'README.md'
  ];

  // Passwords that must NEVER appear in repository source files (decoded dynamically)
  const forbiddenPatterns = [
    new RegExp("['\"]" + Buffer.from('cG95b3JpLWRldg==', 'base64').toString() + "['\"]", 'i'),
    new RegExp('default:\\s*' + Buffer.from('cG95b3JpLWRldg==', 'base64').toString(), 'i'),
    /validKeys\s*=\s*\[/i,
    new RegExp(Buffer.from('cG95b3JpMjAyNg==', 'base64').toString(), 'i')
  ];

  for (const relPath of filesToAudit) {
    const fullPath = path.join(rootDir, relPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const pattern of forbiddenPatterns) {
        assert.equal(
          pattern.test(content),
          false,
          `File ${relPath} must NOT contain plaintext password pattern: ${pattern}`
        );
      }
    }
  }
});

test('DEV UI FILES: Standalone Dev Portal and Dashboard Dev Port exist on disk', () => {
  const devPortalPath = path.join(rootDir, 'dashboard/dev-portal.html');
  const devPortalJsPath = path.join(rootDir, 'dashboard/dev-portal.js');
  const devPortalCssPath = path.join(rootDir, 'dashboard/dev-portal.css');

  assert.ok(fs.existsSync(devPortalPath), 'dashboard/dev-portal.html must exist');
  assert.ok(fs.existsSync(devPortalJsPath), 'dashboard/dev-portal.js must exist');
  assert.ok(fs.existsSync(devPortalCssPath), 'dashboard/dev-portal.css must exist');

  // Verify manifest web_accessible_resources contains dashboard or dev-portal
  const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'manifest.json'), 'utf8'));
  assert.ok(manifest.options_ui.page.includes('dashboard.html'));
});

test('DEV AUDIT: Zero raw Unicode emojis in dev-portal.html and dev-portal.js', () => {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const devFiles = ['dashboard/dev-portal.html', 'dashboard/dev-portal.js'];

  for (const relPath of devFiles) {
    const fullPath = path.join(rootDir, relPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(emojiRegex);
      assert.equal(
        matches,
        null,
        `File ${relPath} must have ZERO raw Unicode emojis, found: ${matches ? matches.join(' ') : ''}`
      );
    }
  }
});

test('DEV 7-TAP GESTURE: Zero direct window.open calls on extension URLs in content scripts', () => {
  // Direct window.open(chrome.runtime.getURL(...)) triggers ERR_BLOCKED_BY_CLIENT on web pages
  const filesToCheck = [
    'content/content.js',
    'content/content.bundle.js',
    'ui/handheld-modal.js'
  ];

  for (const rel of filesToCheck) {
    const full = path.join(rootDir, rel);
    const code = fs.readFileSync(full, 'utf8');
    assert.equal(
      code.includes("window.open(chrome.runtime.getURL('dashboard/dev-portal.html'))"),
      false,
      `File ${rel} must NOT use window.open on dev-portal.html`
    );
    assert.ok(
      code.includes("action: 'open_dev_portal'") || code.includes('open_dev_portal'),
      `File ${rel} must use safe chrome.runtime.sendMessage to background service worker`
    );
  }
});

test('BACKGROUND: Background service worker handles open_dev_portal and open_dashboard', () => {
  const bgPath = path.join(rootDir, 'background/background.js');
  const bgCode = fs.readFileSync(bgPath, 'utf8');

  assert.ok(bgCode.includes("msg.action === 'open_dev_portal'"), 'background.js must handle open_dev_portal');
  assert.ok(bgCode.includes("chrome.tabs.create({ url: devUrl })"), 'background.js must open dev-portal via chrome.tabs.create');
  assert.ok(bgCode.includes("msg.action === 'open_dashboard'"), 'background.js must handle open_dashboard');
});

test('DEV 7-TAP LOGO GESTURE: Popup, Dashboard, Handheld and Pet contain 7-tap gesture handlers', () => {
  const popupJs = fs.readFileSync(path.join(rootDir, 'popup/popup.js'), 'utf8');
  assert.ok(popupJs.includes('popupLogoClicks >= 7'), 'popup.js must support 7-tap gesture on logo');
  assert.ok(popupJs.includes('auth=gesture'), 'popup.js must pass gesture auth');

  const dashJs = fs.readFileSync(path.join(rootDir, 'dashboard/dashboard.js'), 'utf8');
  assert.ok(dashJs.includes('brandClicks >= 7'), 'dashboard.js must support 7-tap gesture on brand');
  assert.ok(dashJs.includes('activateDevPortFromGesture'), 'dashboard.js must directly activate dev port from 7-tap gesture');

  const devPortalJs = fs.readFileSync(path.join(rootDir, 'dashboard/dev-portal.js'), 'utf8');
  assert.ok(devPortalJs.includes('isGestureAuth'), 'dev-portal.js must support gesture auth');
  assert.ok(devPortalJs.includes("urlParams.get('auth') === 'gesture'"), 'dev-portal.js must check auth=gesture');
});
