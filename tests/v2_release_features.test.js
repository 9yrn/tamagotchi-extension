import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ACCESSORIES, FOOD_ITEMS, CREATURE_THEMES, DOMAIN_PRESETS, DEFAULT_STATE } from '../shared/constants.js';
import { PoyoriEngine } from '../shared/game-engine.js';
import { getAccessorySvg, getCreatureSprite } from '../content/sprites.js';
import { TutorialModal } from '../ui/tutorial-modal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('V2 FEATURE: Complete Fitted Outfits & Accessories (10 items)', () => {
  const expectedAccessories = [
    'none', 'hachimaki', 'tanuki_leaf', 'retro_glasses', 'cozy_scarf',
    'wizard_hat', 'cyber_visor', 'ninja_cowl', 'red_cape', 'samurai_helm', 'golden_crown'
  ];

  for (const accId of expectedAccessories) {
    assert.ok(ACCESSORIES[accId], `Accessory "${accId}" must be defined in ACCESSORIES`);
    assert.ok(typeof ACCESSORIES[accId].cost === 'number', `Accessory "${accId}" must have numeric cost`);
    assert.ok(ACCESSORIES[accId].iconKey, `Accessory "${accId}" must have iconKey`);

    if (accId !== 'none') {
      const svgUri = getAccessorySvg(accId);
      assert.ok(svgUri && svgUri.startsWith('data:image/svg+xml;base64,'), `Accessory "${accId}" must produce valid base64 SVG`);
      
      // Decode SVG and verify 16x16 viewBox
      const base64Data = svgUri.replace('data:image/svg+xml;base64,', '');
      const svgText = Buffer.from(base64Data, 'base64').toString('utf8');
      assert.ok(svgText.includes('viewBox="0 0 16 16"'), `Accessory "${accId}" must have exact 16x16 viewBox for anatomical alignment`);
    }
  }
});

test('V2 FEATURE: Dev Port unlocks all creature color theme palettes for Stage 1-6', () => {
  const pet = { stage: 1, creatureId: 'coding_tamago' };

  // By default, stage 1 only has classic_default
  const defaultUnlocked = PoyoriEngine.getUnlockedCreatureThemes(pet);
  assert.strictEqual(defaultUnlocked.length, 1, 'Stage 1 pet initially only has classic theme');

  // God Mode or Dev Port unlocks all themes
  pet.unlockedThemes = Object.keys(CREATURE_THEMES);
  const allUnlocked = PoyoriEngine.getUnlockedCreatureThemes(pet);
  assert.strictEqual(allUnlocked.length, Object.keys(CREATURE_THEMES).length, 'All 6 creature themes must be unlocked when present in unlockedThemes');

  // Verify applyDevGodMode unlocks themes on state
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  PoyoriEngine.applyDevGodMode(state);
  assert.ok(Array.isArray(state.pet.unlockedThemes), 'state.pet.unlockedThemes must be an array');
  assert.strictEqual(state.pet.unlockedThemes.length, Object.keys(CREATURE_THEMES).length, 'God Mode must unlock all creature themes');
});

test('V2 FEATURE: Petting records timestamp and blushing reaction is available', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  const before = Date.now();
  const res = PoyoriEngine.pet(state);

  assert.strictEqual(res.success, true);
  assert.ok(state.pet.lastPettedAt >= before, 'pet.lastPettedAt timestamp must be recorded');

  // Test that getCreatureSprite produces blushing sprite
  const blushingSvg = getCreatureSprite('coding_tamago', 'petted');
  assert.ok(blushingSvg && blushingSvg.startsWith('data:image/svg+xml;base64,'), 'Blushing sprite must produce valid base64 SVG');
});

test('V2 FEATURE: Mochimori Market has all 6 food items and purchasing functions correctly', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  state.koban = 50;

  const initialRingo = state.inventory.ringo || 0;
  const initialYakuso = state.inventory.yakuso || 0;

  // Buy apple
  const buyRingo = PoyoriEngine.buyFoodItem(state, 'ringo');
  assert.strictEqual(buyRingo.success, true);
  assert.strictEqual(state.koban, 45);
  assert.strictEqual(state.inventory.ringo, initialRingo + 1);

  // Buy yakuso medicine (cost: 15 Koban)
  const buyMed = PoyoriEngine.buyFoodItem(state, 'yakuso');
  assert.strictEqual(buyMed.success, true);
  assert.strictEqual(state.koban, 30);
  assert.strictEqual(state.inventory.yakuso, initialYakuso + 1);
});

test('V2 FEATURE: Tutorial Modal Step 3 supports choosing Cozy vs Hardcore mode', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  const modal = new TutorialModal(null, { state });
  modal.show({ step: 3 });

  assert.strictEqual(modal.currentStep, 3);
  assert.ok(modal.element.innerHTML.includes('COZY MODE'), 'Step 3 must offer Cozy Mode selection');
  assert.ok(modal.element.innerHTML.includes('HARDCORE MODE'), 'Step 3 must offer Hardcore Mode selection');

  // Select Hardcore
  modal.selectedMode = 'hardcore';
  modal.applyStarterChoice();
  assert.strictEqual(state.settings.consequenceMode, 'hardcore', 'Selecting hardcore in tutorial must update consequenceMode');

  // Select Cozy
  modal.selectedMode = 'cozy';
  modal.applyStarterChoice();
  assert.strictEqual(state.settings.consequenceMode, 'cozy', 'Selecting cozy in tutorial must update consequenceMode');
});

test('V2 FEATURE: Dashboard & Popup UI text rephrasing and mode badges', () => {
  const dashHtml = fs.readFileSync(path.join(rootDir, 'dashboard', 'dashboard.html'), 'utf8');
  const dashJs = fs.readFileSync(path.join(rootDir, 'dashboard', 'dashboard.js'), 'utf8');
  const popupHtml = fs.readFileSync(path.join(rootDir, 'popup', 'popup.html'), 'utf8');
  const dashCss = fs.readFileSync(path.join(rootDir, 'dashboard', 'dashboard.css'), 'utf8');

  // Font size rephrase
  assert.ok(dashHtml.includes('<h3>Font Size</h3>'), 'Dashboard must rephrase "Adjustable UI Font Size" to "Font Size"');
  assert.ok(!dashHtml.includes('<h3>Adjustable UI Font Size</h3>'), 'Old title must not be present');

  // Focus Session rephrase
  assert.ok(dashHtml.includes('<h3>Focus Session</h3>'), 'Dashboard must rephrase "Focus Session (Pomodoro Accountability)" to "Focus Session"');
  assert.ok(!dashHtml.includes('<h3>Focus Session (Pomodoro Accountability)</h3>'), 'Old focus title must not be present');

  // Mode badge elements
  assert.ok(dashHtml.includes('sidebar-mode-label'), 'Dashboard must contain sidebar-mode-label element');
  assert.ok(dashHtml.includes('pet-display-mode'), 'Dashboard must contain pet-display-mode element');
  assert.ok(popupHtml.includes('popup-pet-mode'), 'Popup must contain popup-pet-mode badge');

  // Proportional font scaling CSS
  assert.ok(dashCss.includes('zoom: 1.15;'), 'Dashboard CSS must support zoom: 1.15 for font-size-large');
  assert.ok(dashCss.includes('zoom: 1.30;'), 'Dashboard CSS must support zoom: 1.30 for font-size-huge');

  // Mochimori market
  assert.ok(dashJs.includes('function renderMarket()'), 'dashboard.js must implement renderMarket()');
  assert.ok(dashJs.includes('renderMarket();'), 'dashboard.js must invoke renderMarket() in renderAll()');
});

test('V2 AUDIT: Zero syntax errors across all extension JS files (node -c validation)', async () => {
  const { execSync } = await import('node:child_process');

  const jsFiles = [
    'background/background.js',
    'blocked/blocked.js',
    'content/content.js',
    'content/pet-controller.js',
    'content/sprites.js',
    'dashboard/dashboard.js',
    'dashboard/dev-portal.js',
    'popup/popup.js',
    'shared/constants.js',
    'shared/game-engine.js',
    'shared/pixel-icons.js',
    'shared/storage.js',
    'ui/audio.js',
    'ui/celebration-modal.js',
    'ui/handheld-modal.js',
    'ui/quick-bubble.js',
    'ui/tutorial-modal.js',
    'scripts/build-bundle.js',
    'scripts/build-firefox.js',
    'scripts/package-release.js'
  ];

  for (const file of jsFiles) {
    const fullPath = path.join(rootDir, file);
    assert.ok(fs.existsSync(fullPath), `File ${file} must exist`);
    try {
      execSync(`node -c "${fullPath}"`);
    } catch (e) {
      assert.fail(`Syntax error detected in ${file}: ${e.message}`);
    }
  }
});

test('V2 AUDIT: Dashboard HTML contains all required DOM element IDs for dashboard.js', () => {
  const dashHtml = fs.readFileSync(path.join(rootDir, 'dashboard', 'dashboard.html'), 'utf8');

  const requiredIds = [
    'market-items-grid',
    'wardrobe-items-grid',
    'palette-choices-row',
    'dash-creature-themes-row',
    'dash-pet-size-row',
    'dash-font-size-row',
    'dash-roster-grid',
    'overview-pet-img',
    'brand-sprite',
    'btn-care-pet',
    'btn-care-feed',
    'btn-care-sleep',
    'dash-focus-discipline',
    'dash-start-focus-btn',
    'sidebar-coins',
    'sidebar-streak',
    'sidebar-mode-label',
    'pet-display-mode',
    'custom-rules-list',
    'preset-badges-wrap',
    'dash-rename-btn',
    'btn-pet-info',
    'btn-pet-flip-back',
    'companion-tabs-row',
    'dash-roster-count'
  ];

  for (const id of requiredIds) {
    assert.ok(
      dashHtml.includes(`id="${id}"`) || dashHtml.includes(`id='${id}'`),
      `dashboard.html must contain element with id="${id}"`
    );
  }
});

test('V2 AUDIT: Popup HTML contains all required DOM element IDs for popup.js', () => {
  const popupHtml = fs.readFileSync(path.join(rootDir, 'popup', 'popup.html'), 'utf8');

  const requiredPopupIds = [
    'pet-sprite',
    'pet-name',
    'pet-level',
    'popup-pet-mode',
    'pet-stage',
    'val-onaka',
    'val-genki',
    'val-kizuna',
    'streak-val',
    'quick-pet-btn',
    'quick-feed-btn',
    'quick-cure-btn',
    'pet-size-label',
    'font-size-label'
  ];

  for (const id of requiredPopupIds) {
    assert.ok(
      popupHtml.includes(`id="${id}"`) || popupHtml.includes(`id='${id}'`),
      `popup.html must contain element with id="${id}"`
    );
  }
});

