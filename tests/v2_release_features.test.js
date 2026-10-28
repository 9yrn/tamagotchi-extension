import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ACCESSORIES, FOOD_ITEMS, CREATURE_THEMES, DOMAIN_PRESETS, DEFAULT_STATE, BREED_SOUNDS, getCreatureSound } from '../shared/constants.js';
import { PoyoriEngine } from '../shared/game-engine.js';
import { getAccessorySvg, getCreatureSprite } from '../content/sprites.js';
import { TutorialModal } from '../ui/tutorial-modal.js';
import { QuickBubble } from '../ui/quick-bubble.js';
import { audioSynth } from '../ui/audio.js';

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
    'domain-search-input',
    'domain-search-count',
    'domain-filter-tabs',
    'domain-category-banner',
    'badge-count-all',
    'badge-count-denki',
    'badge-count-chishiki',
    'badge-count-monogatari',
    'badge-count-distracting',
    'custom-domain-input',
    'custom-domain-category',
    'add-domain-btn',
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

test('V2 FEATURE: Website Tracking & Presets menu offers neat category filter tabs, search filter, and interactive chips', () => {
  const dashHtml = fs.readFileSync(path.join(rootDir, 'dashboard', 'dashboard.html'), 'utf8');
  const dashCss = fs.readFileSync(path.join(rootDir, 'dashboard', 'dashboard.css'), 'utf8');
  const dashJs = fs.readFileSync(path.join(rootDir, 'dashboard', 'dashboard.js'), 'utf8');

  // 1. Verify HTML Structure & Accessibility
  assert.ok(dashHtml.includes('id="domain-search-input"'), 'Must have domain search input');
  assert.ok(dashHtml.includes('id="domain-search-count"'), 'Must have domain count badge');
  assert.ok(dashHtml.includes('id="domain-filter-tabs"'), 'Must have category filter tabs container');
  assert.ok(dashHtml.includes('data-category="all"'), 'Must have "All Categories" filter tab');
  assert.ok(dashHtml.includes('data-category="denki"'), 'Must have Denki filter tab');
  assert.ok(dashHtml.includes('data-category="chishiki"'), 'Must have Chishiki filter tab');
  assert.ok(dashHtml.includes('data-category="monogatari"'), 'Must have Monogatari filter tab');
  assert.ok(dashHtml.includes('data-category="distracting"'), 'Must have Distracting filter tab');
  assert.ok(dashHtml.includes('id="domain-category-banner"'), 'Must have category lore & effect banner');
  assert.ok(dashHtml.includes('id="preset-badges-wrap"'), 'Must maintain preset-badges-wrap container');
  assert.ok(dashHtml.includes('preset-chips-container'), 'Must have preset-chips-container class');

  // 2. Verify CSS Styling & Retro Aesthetics
  assert.ok(dashCss.includes('.preset-domain-chip'), 'CSS must define .preset-domain-chip');
  assert.ok(dashCss.includes('.preset-chips-container'), 'CSS must define .preset-chips-container');
  assert.ok(dashCss.includes('.domain-filter-tabs'), 'CSS must define .domain-filter-tabs');
  assert.ok(dashCss.includes('.domain-tab-btn.active'), 'CSS must define active tab styling');
  assert.ok(dashCss.includes('.domain-category-banner'), 'CSS must define lore banner');
  assert.ok(dashCss.includes('.tag-denki'), 'CSS must style Denki tag');
  assert.ok(dashCss.includes('.tag-chishiki'), 'CSS must style Chishiki tag');
  assert.ok(dashCss.includes('.tag-monogatari'), 'CSS must style Monogatari tag');
  assert.ok(dashCss.includes('.tag-distracting'), 'CSS must style Distracting tag');

  // 3. Verify JavaScript Logic & Preset Counts
  const totalPresets = (DOMAIN_PRESETS.educational?.denki?.length || 0) +
                       (DOMAIN_PRESETS.educational?.chishiki?.length || 0) +
                       (DOMAIN_PRESETS.educational?.monogatari?.length || 0) +
                       (DOMAIN_PRESETS.distracting?.length || 0);
  assert.strictEqual(totalPresets, 111, 'Curated domain presets must total exactly 111 domains');
  assert.strictEqual(DOMAIN_PRESETS.educational?.denki?.length, 43, 'Denki preset must have 43 domains');
  assert.strictEqual(DOMAIN_PRESETS.educational?.chishiki?.length, 30, 'Chishiki preset must have 30 domains');
  assert.strictEqual(DOMAIN_PRESETS.educational?.monogatari?.length, 25, 'Monogatari preset must have 25 domains');
  assert.strictEqual(DOMAIN_PRESETS.distracting?.length, 13, 'Distracting preset must have 13 domains');

  // 4. Verify Interactive JS Handlers
  assert.ok(dashJs.includes('renderPresetDomains()'), 'dashboard.js must define renderPresetDomains()');
  assert.ok(dashJs.includes('currentWebsiteCategory'), 'dashboard.js must track active category filter');
  assert.ok(dashJs.includes('currentWebsiteSearch'), 'dashboard.js must track search query');
  assert.ok(dashJs.includes('.preset-domain-chip'), 'dashboard.js must generate individual domain chips');
  assert.ok(dashJs.includes('preset-empty-msg'), 'dashboard.js must handle zero-result searches with add prompt');
  assert.ok(dashJs.includes('chip.onclick'), 'dashboard.js must attach click listener to chips to prefill rules');
});

test('V2 FEATURE: Vitals counters round off values and menu sections are correctly reorganized', () => {
  const dashHtml = fs.readFileSync(path.join(rootDir, 'dashboard', 'dashboard.html'), 'utf8');
  const dashJs = fs.readFileSync(path.join(rootDir, 'dashboard', 'dashboard.js'), 'utf8');
  const modalJs = fs.readFileSync(path.join(rootDir, 'ui', 'handheld-modal.js'), 'utf8');

  // 1. Verify Vitals Rounding logic
  assert.ok(dashJs.includes('const roundedOnaka = Math.round(onakaVal);'), 'dashboard.js must round Onaka');
  assert.ok(dashJs.includes('const roundedGenki = Math.round(genkiVal);'), 'dashboard.js must round Genki');
  assert.ok(dashJs.includes('const roundedKizuna = Math.round(kizunaVal);'), 'dashboard.js must round Kizuna');
  assert.ok(dashJs.includes('const roundedXp = Math.round(xpVal);'), 'dashboard.js must round XP');
  assert.ok(dashJs.includes('txtOnaka.textContent = `${roundedOnaka}%`;'), 'txt-onaka must display rounded percentage');
  assert.ok(modalJs.includes('${Math.round(pet.onaka)}%'), 'handheld-modal must display rounded onaka');
  assert.ok(modalJs.includes('${Math.round(pet.genki)}%'), 'handheld-modal must display rounded genki');
  assert.ok(modalJs.includes('${Math.round(pet.kizuna)}%'), 'handheld-modal must display rounded kizuna');

  // 2. Verify Tab Structure & Reorganization
  const bestiaryMatch = dashHtml.match(/<section id="tab-bestiary"[^>]*>([\s\S]*?)<\/section>/);
  const wardrobeMatch = dashHtml.match(/<section id="tab-wardrobe"[^>]*>([\s\S]*?)<\/section>/);
  const settingsMatch = dashHtml.match(/<section id="tab-settings"[^>]*>([\s\S]*?)<\/section>/);

  assert.ok(bestiaryMatch, 'tab-bestiary must exist in dashboard.html');
  assert.ok(wardrobeMatch, 'tab-wardrobe must exist in dashboard.html');
  assert.ok(settingsMatch, 'tab-settings must exist in dashboard.html');

  // Companion Roster moved to Zukan / Evolution (tab-bestiary)
  assert.ok(bestiaryMatch[1].includes('id="dash-roster-grid"'), 'tab-bestiary must contain dash-roster-grid');
  assert.ok(!wardrobeMatch[1].includes('id="dash-roster-grid"'), 'tab-wardrobe must not contain dash-roster-grid');

  // Three display/theme options moved to Settings (tab-settings)
  assert.ok(settingsMatch[1].includes('id="dash-creature-themes-row"'), 'tab-settings must contain dash-creature-themes-row');
  assert.ok(settingsMatch[1].includes('id="dash-pet-size-row"'), 'tab-settings must contain dash-pet-size-row');
  assert.ok(settingsMatch[1].includes('id="dash-font-size-row"'), 'tab-settings must contain dash-font-size-row');

  assert.ok(!wardrobeMatch[1].includes('id="dash-creature-themes-row"'), 'tab-wardrobe must not contain dash-creature-themes-row');
  assert.ok(!wardrobeMatch[1].includes('id="dash-pet-size-row"'), 'tab-wardrobe must not contain dash-pet-size-row');
  assert.ok(!wardrobeMatch[1].includes('id="dash-font-size-row"'), 'tab-wardrobe must not contain dash-font-size-row');
});

test('V2 FEATURE: Quirky Animal Sounds for All 6 Breeds, Eggs & Slacker', () => {
  const breeds = ['cat', 'bird', 'fox', 'owl', 'dragon', 'shiba', 'egg', 'slacker'];

  for (const b of breeds) {
    assert.ok(Array.isArray(BREED_SOUNDS[b]), `BREED_SOUNDS must contain sound array for breed "${b}"`);
    assert.ok(BREED_SOUNDS[b].length >= 3, `Breed "${b}" must have at least 3 quirky sound variations`);
    
    // Test getCreatureSound helper
    const sound = getCreatureSound(b);
    assert.ok(typeof sound === 'string' && sound.length > 0, `getCreatureSound("${b}") must return non-empty sound string`);
    assert.ok(BREED_SOUNDS[b].includes(sound), `Sound "${sound}" must be one of breed "${b}" sounds`);
  }

  // Test creature ID mapping to sound
  const creatureSample = [
    { id: 'coding_tamago', breed: 'egg' },
    { id: 'coding_cat_1', breed: 'cat' },
    { id: 'creative_bird_2', breed: 'bird' },
    { id: 'lit_fox_3', breed: 'fox' },
    { id: 'research_owl_4', breed: 'owl' },
    { id: 'game_dragon_5', breed: 'dragon' },
    { id: 'personal_shiba_6', breed: 'shiba' },
    { id: 'gutara_taida', breed: 'slacker' }
  ];

  for (const c of creatureSample) {
    const sound = getCreatureSound(c.id);
    assert.ok(BREED_SOUNDS[c.breed].includes(sound), `Creature "${c.id}" should map to "${c.breed}" sound, got "${sound}"`);
  }

  // Audio synthesizer playAnimalSound method exists and does not throw
  assert.ok(typeof audioSynth.playAnimalSound === 'function', 'audioSynth must expose playAnimalSound');
  assert.doesNotThrow(() => audioSynth.playAnimalSound('coding_cat_1'), 'playAnimalSound should not throw in non-browser env');
});

test('V2 FEATURE: Observational Third-Person Speech Bubbles (No First-Person Speech)', () => {
  if (typeof global.document === 'undefined') {
    global.document = {
      createElement: () => ({
        style: {},
        classList: { add: () => {}, remove: () => {} },
        appendChild: (c) => c
      })
    };
  }

  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  state.pet.name = 'Mochi';
  state.settings.languageMode = 'english';

  const testCases = [
    { setup: (s) => { s.pet.isSleeping = false; s.pet.isSick = false; s.pet.onaka = 80; s.pet.genki = 80; s.pet.kizuna = 80; }, mood: 'cheerful' },
    { setup: (s) => { s.pet.isSleeping = true; }, mood: 'sleepy' },
    { setup: (s) => { s.pet.isSleeping = false; s.pet.isSick = true; }, mood: 'sick' },
    { setup: (s) => { s.pet.isSleeping = false; s.pet.isSick = false; s.pet.onaka = 10; s.pet.genki = 10; }, mood: 'grumpy' },
    { setup: (s) => { s.pet.isSleeping = false; s.pet.isSick = false; s.pet.onaka = 20; s.pet.genki = 80; }, mood: 'hungry' }
  ];

  for (const tc of testCases) {
    tc.setup(state);
    const line = QuickBubble.getMoodMessage(state);
    assert.ok(line.includes('Mochi'), `Dialogue for state "${tc.mood}" must include pet name "Mochi"`);

    // Ensure zero first-person pet speech
    const forbiddenFirstPerson = [/\bI am\b/i, /\bI'm\b/i, /\bmy\b/i, /\bme\b/i, /\bI want\b/i, /\bfeed me\b/i, /\bpet me\b/i];
    for (const rx of forbiddenFirstPerson) {
      assert.ok(!rx.test(line), `Mood "${tc.mood}" line "${line}" must not contain first person pronoun matching ${rx}`);
    }
  }

  // Focus accountability nudge in PoyoriEngine must also be observational
  const focusState = JSON.parse(JSON.stringify(DEFAULT_STATE));
  focusState.pet.name = 'Pori';
  const nudge = PoyoriEngine.getFocusNudge(focusState, 'coding');
  assert.ok(nudge.includes('Pori glances up curiously'), 'Focus nudge must be in third-person observational narration');
  assert.ok(!nudge.includes('I am') && !nudge.includes('my focus'), 'Focus nudge must not use first-person speech');
});

test('V2 FEATURE: Sound Bubbles Present in Handheld Modal and Dashboard Overview', () => {
  const dashHtml = fs.readFileSync(path.join(rootDir, 'dashboard/dashboard.html'), 'utf8');
  assert.ok(dashHtml.includes('id="dash-sound-bubble"'), 'dashboard.html must contain #dash-sound-bubble');
  assert.ok(dashHtml.includes('class="dash-sound-bubble"'), 'dashboard.html must contain .dash-sound-bubble class');

  const handheldJs = fs.readFileSync(path.join(rootDir, 'ui/handheld-modal.js'), 'utf8');
  assert.ok(handheldJs.includes('id="device-sound-bubble"'), 'handheld-modal.js must render #device-sound-bubble');
  assert.ok(handheldJs.includes('device-sound-bubble'), 'handheld-modal.js must include .device-sound-bubble class');
  assert.ok(handheldJs.includes('getCreatureSound('), 'handheld-modal.js must call getCreatureSound');
});



