/**
 * Poyori (ポヨリ) — Unlocked Roster, Custom Naming & Creature Themes Tests (TDD)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, CREATURE_THEMES } from '../shared/constants.js';
import { PoyoriEngine } from '../shared/game-engine.js';

test('ROSTER & NAMING TDD: Custom naming updates pet name and sanitizes input', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  
  const res = PoyoriEngine.setPetCustomName(state, 'CyberKitten');
  assert.equal(res.success, true);
  assert.equal(state.pet.name, 'CyberKitten');

  // Reject empty or overly long names
  const emptyRes = PoyoriEngine.setPetCustomName(state, '   ');
  assert.equal(emptyRes.success, false);

  const longRes = PoyoriEngine.setPetCustomName(state, 'SuperUltraLongNameExceedingLimit');
  assert.equal(longRes.success, false);
});

test('ROSTER & NAMING TDD: Unlocked companions are saved to roster and can be switched', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  
  // Roster initializes with default pet
  assert.ok(Array.isArray(state.roster), 'state.roster must be an array');
  assert.ok(state.roster.length >= 1, 'Roster must contain at least 1 companion');

  // Add an unlocked companion to roster
  PoyoriEngine.addToRoster(state, {
    creatureId: 'creative_child',
    name: 'FeatherPip',
    stage: 3,
    level: 12
  });

  assert.equal(state.roster.length, 2);

  // Switch active companion
  const switchRes = PoyoriEngine.switchActivePet(state, 1);
  assert.equal(switchRes.success, true);
  assert.equal(state.pet.creatureId, 'creative_child');
  assert.equal(state.pet.name, 'FeatherPip');
  assert.equal(state.activeRosterIndex, 1);
});

test('CREATURE THEMES TDD: Higher evolutions unlock creature-specific color themes', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  state.pet.stage = 1; // Tamago

  const themesStage1 = PoyoriEngine.getUnlockedCreatureThemes(state.pet);
  assert.equal(themesStage1.length, 1, 'Stage 1 only has default theme');

  // Stage 4 Teen unlocks 2 themes
  state.pet.stage = 4;
  const themesStage4 = PoyoriEngine.getUnlockedCreatureThemes(state.pet);
  assert.ok(themesStage4.length >= 2, 'Stage 4 must unlock additional theme');

  // Stage 5 Adult unlocks 3 themes
  state.pet.stage = 5;
  const themesStage5 = PoyoriEngine.getUnlockedCreatureThemes(state.pet);
  assert.ok(themesStage5.length >= 3, 'Stage 5 must unlock 3+ themes');

  // Stage 6 Radiant unlocks Celestial Shiny theme
  state.pet.stage = 6;
  state.pet.isKomyo = true;
  const themesStage6 = PoyoriEngine.getUnlockedCreatureThemes(state.pet);
  assert.ok(themesStage6.some(t => t.id === 'celestial_shiny'), 'Stage 6 must unlock celestial shiny theme');
});

test('CREATURE THEMES TDD: Setting creature theme updates pet theme in state', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  state.pet.stage = 5;

  const res = PoyoriEngine.setCreatureTheme(state, 'neon_cyber');
  assert.equal(res.success, true);
  assert.equal(state.pet.theme, 'neon_cyber');
});

test('ADJUSTABLE SIZE TDD: PoyoriEngine.setPetSize sets preset keys and numeric scales', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));

  // Default size
  assert.equal(state.settings.petSize, 'normal');
  assert.equal(state.settings.petSizePx, 64);
  assert.equal(state.settings.petScale, 1.0);

  // Set small preset (48px, 0.75x)
  const smallRes = PoyoriEngine.setPetSize(state, 'small');
  assert.equal(smallRes.success, true);
  assert.equal(state.settings.petSize, 'small');
  assert.equal(state.settings.petSizePx, 48);
  assert.equal(state.settings.petScale, 0.75);

  // Set large preset (80px, 1.25x)
  const largeRes = PoyoriEngine.setPetSize(state, 'large');
  assert.equal(largeRes.success, true);
  assert.equal(state.settings.petSize, 'large');
  assert.equal(state.settings.petSizePx, 80);
  assert.equal(state.settings.petScale, 1.25);

  // Set giant preset (96px, 1.5x)
  const giantRes = PoyoriEngine.setPetSize(state, 'giant');
  assert.equal(giantRes.success, true);
  assert.equal(state.settings.petSize, 'giant');
  assert.equal(state.settings.petSizePx, 96);
  assert.equal(state.settings.petScale, 1.5);

  // Set numeric size (e.g. 48)
  const numRes = PoyoriEngine.setPetSize(state, 48);
  assert.equal(numRes.success, true);
  assert.equal(state.settings.petSize, 'small');
  assert.equal(state.settings.petSizePx, 48);

  // Numeric clamp tests
  const clampLow = PoyoriEngine.setPetSize(state, 10);
  assert.equal(clampLow.px, 32);

  const clampHigh = PoyoriEngine.setPetSize(state, 300);
  assert.equal(clampHigh.px, 160);
});

class MockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.innerHTML = '';
    this.style = {};
    this.classList = new Set();
    this.children = [];
    this.eventListeners = {};
  }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  addEventListener(evt, fn) {
    if (!this.eventListeners[evt]) this.eventListeners[evt] = [];
    this.eventListeners[evt].push(fn);
  }
}

if (typeof global.document === 'undefined') {
  global.document = {
    createElement: (tag) => new MockElement(tag)
  };
}

test('ROSTER CLUTTER FIX TDD: Handheld companion roster displays clean layout with avatar, name row, formatted species, and active badge', async () => {
  const { HandheldModal } = await import('../ui/handheld-modal.js');

  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  state.roster = [
    { creatureId: 'coding_tamago', name: 'Mochi', stage: 1, level: 2 },
    { creatureId: 'creative_egg', name: 'Sora', stage: 1, level: 1 }
  ];
  const mockShadow = new MockElement('shadow-root');
  const modal = new HandheldModal(mockShadow, { state });
  modal.activeTab = 'wardrobe';
  modal.render();

  const html = modal.modalEl.innerHTML;
  // Must render clean roster name row
  assert.ok(html.includes('class="roster-name-row"'), 'Must contain .roster-name-row wrapper');
  assert.ok(html.includes('class="roster-avatar"'), 'Must contain .roster-avatar image');
  assert.ok(html.includes('class="roster-rename-btn"'), 'Must contain .roster-rename-btn');
  // Must render formatted creature name rather than raw snake_case id
  assert.ok(html.includes('Byte Egg') || html.includes('Egg'), 'Must format creature name cleanly');
  assert.ok(!html.includes('coding_tamago •'), 'Must not display raw snake_case creatureId');
});

test('FOCUS TIMER UI ENHANCEMENT TDD: Focus menu in Handheld Modal provides spacious layout, breed lineages, duration presets, and rewards preview', async () => {
  const { HandheldModal } = await import('../ui/handheld-modal.js');
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  const mockShadow = new MockElement('shadow-root');
  const modal = new HandheldModal(mockShadow, { state });
  modal.activeTab = 'focus';
  modal.render();

  const html = modal.modalEl.innerHTML;
  // Must contain lineage sublabels in discipline buttons
  assert.ok(html.includes('discipline-lineage'), 'Must include .discipline-lineage sublabels');
  assert.ok(html.includes('Cat Lineage') || html.includes('CAT'), 'Must mention animal lineage');
  // Must include rewards and stats preview banner
  assert.ok(html.includes('focus-rewards-card'), 'Must render .focus-rewards-card below setup box');
  assert.ok(html.includes('Accountability Guard Active') || html.includes('Distraction Guard'), 'Must mention accountability guard');
});

test('TAMAGOTCHI SIZE LIVE SCALING TDD: Status view and display size swatches apply and reflect active size', async () => {
  const { HandheldModal } = await import('../ui/handheld-modal.js');
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  PoyoriEngine.setPetSize(state, 'giant'); // 96px
  const mockShadow = new MockElement('shadow-root');
  const modal = new HandheldModal(mockShadow, { state });
  modal.activeTab = 'status';
  modal.render();

  const statusHtml = modal.modalEl.innerHTML;
  // Status sprite must reflect the 96px size
  assert.ok(statusHtml.includes('96px'), 'Status sprite must scale to 96px for giant size');

  // Switch to wardrobe: size swatch for giant must be marked active
  modal.activeTab = 'wardrobe';
  modal.render();
  const wardrobeHtml = modal.modalEl.innerHTML;
  assert.ok(wardrobeHtml.includes('class="size-swatch-btn active" data-size="giant"') || (wardrobeHtml.includes('data-size="giant"') && wardrobeHtml.includes('active')), 'Giant size swatch must be active');
  assert.ok(wardrobeHtml.includes('size-preview-box'), 'Must display live pet size preview box');
});


