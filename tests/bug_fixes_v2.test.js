import test from 'node:test';
import assert from 'node:assert/strict';
import { PoyoriEngine } from '../shared/game-engine.js';
import { DEFAULT_STATE, CREATURES } from '../shared/constants.js';
import { saveState, getState } from '../shared/storage.js';
import { CelebrationModal } from '../ui/celebration-modal.js';

function getFreshState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

test('BUG 1 & 4 FIX: saveState persists lower Koban balances (purchases, 99999, reset to 0)', async () => {
  const state = getFreshState();
  state.koban = 1011999;
  await saveState(state);

  // Set 99,999 Koban (lower than 1,011,999)
  state.koban = 99999;
  const saved = await saveState(state);
  assert.equal(saved.koban, 99999, 'Koban balance must persist 99,999 without Math.max revert');

  // Reset to 0
  state.koban = 0;
  const resetSaved = await saveState(state);
  assert.equal(resetSaved.koban, 0, 'Reset to 0 Koban must persist 0');
});

test('BUG 2 FIX: Hunger and energy decay and regenerate properly on 1-minute ticks', () => {
  const state = getFreshState();
  state.pet.onaka = 80;
  state.pet.genki = 80;
  state.pet.isSleeping = false;
  state.pet.lastTickAt = Date.now() - 60000; // exactly 1 minute ago

  PoyoriEngine.processTick(state, Date.now());

  assert.ok(state.pet.onaka < 80, `Onaka must decay on 1-min tick (got ${state.pet.onaka})`);
  assert.ok(state.pet.genki < 80, `Genki must decay when awake on 1-min tick (got ${state.pet.genki})`);

  // Asleep regeneration
  state.pet.isSleeping = true;
  state.pet.lastTickAt = Date.now() - 60000;
  const prevGenki = state.pet.genki;
  PoyoriEngine.processTick(state, Date.now());
  assert.ok(state.pet.genki > prevGenki, `Genki must regenerate when asleep on 1-min tick (got ${state.pet.genki})`);
});

test('BUG 3 FIX: Exiting dev sandbox restores original Koban and level correctly', async () => {
  const state = getFreshState();
  state.koban = 15;
  state.pet.xp = 20;
  state.pet.level = 1;

  PoyoriEngine.enterDevSandbox(state);
  state.koban = 99999;
  state.pet.xp = 500;
  state.pet.level = 10;
  await saveState(state);

  PoyoriEngine.exitDevSandbox(state);
  const reverted = await saveState(state);
  assert.equal(reverted.koban, 15, 'Sandbox exit must restore 15 Koban');
  assert.equal(reverted.pet.xp, 20, 'Sandbox exit must restore 20 XP');
});

test('BUG 6 FIX: Daily streak uses local calendar date rather than UTC', () => {
  const localDate = PoyoriEngine.getLocalDateString();
  assert.match(localDate, /^\d{4}-\d{2}-\d{2}$/, 'Local date must match YYYY-MM-DD');

  const testDate = new Date(2026, 9, 27, 23, 45); // Oct 27, 2026 late night local
  assert.equal(PoyoriEngine.getLocalDateString(testDate), '2026-10-27');
});

test('BUG 9 & EXP GAIN FIX: Slow XP accrual and automatic level recalculation', () => {
  const state = getFreshState();
  state.pet.xp = 0;
  state.pet.level = 1;
  state.pet.isSleeping = false;
  state.pet.isSick = false;

  // 4 minutes on educational site -> 2 XP (slow progression approx 0.5 XP/min)
  PoyoriEngine.recordBrowsing(state, 'github.com', 240);
  assert.equal(state.pet.xp, 2, 'XP accrual should be approx 0.5 XP/minute');
  assert.equal(state.pet.level, 1);

  // Big XP gain updates level automatically
  state.pet.xp = 250;
  PoyoriEngine.recordBrowsing(state, 'github.com', 120);
  assert.ok(state.pet.level > 1, `Pet level must be recalculated automatically upon XP gain (got Lv. ${state.pet.level})`);
});

test('BUG 10 FIX: Komyo 7-day streak check does not block normal stage 6 evolution', () => {
  const state = getFreshState();
  state.pet.stage = 5;
  state.pet.xp = 600; // Enough for stage 6
  state.pet.isKomyo = false;
  state.stats.currentStreak = 7;
  // If chosen branch does not match radiant komyo, normal evolution to stage 6 still proceeds
  state.pet.chosenBranch = 'coding';

  const res = PoyoriEngine.checkEvolution(state, true);
  assert.ok(res.evolved, 'Evolution must succeed even when streak >= 7');
});

test('BUG 11 FIX: Pet stage >= 2 sets isHatched to true', () => {
  const state = getFreshState();
  state.pet.stage = 1;
  state.pet.isHatched = false;
  state.pet.xp = 150;

  const res = PoyoriEngine.checkEvolution(state, true);
  assert.ok(res.evolved);
  assert.equal(state.pet.stage, 2);
  assert.equal(state.pet.isHatched, true, 'isHatched must be set to true when evolving beyond egg');
});

test('ROSTER SYNC FIX: Morphing and evolving pet updates active roster companion', () => {
  const state = getFreshState();
  assert.ok(Array.isArray(state.roster) && state.roster.length > 0);

  PoyoriEngine.morphPet(state, 'coding_adult');
  assert.equal(state.pet.creatureId, 'coding_adult');
  assert.equal(state.roster[0].creatureId, 'coding_adult', 'Roster active companion must match morphed creature');
});

test('IMAGE 3 CELEBRATION MODAL FIX: SVG string in spriteUrl renders cleanly without broken img tags', () => {
  const mockContainer = {
    appendChild: () => {},
    innerHTML: ''
  };

  const modal = new CelebrationModal(mockContainer);
  modal.show({
    type: 'cosmetic',
    title: 'NEW COSMETIC UNLOCKED!',
    subtitle: 'Omedetou!',
    name: 'Crown',
    badgeText: 'SHOP TREASURE',
    spriteUrl: '<svg viewBox="0 0 16 16"><rect width="16" height="16" fill="gold"/></svg>',
    desc: 'Golden Crown'
  });

  const dialogHtml = modal.element.innerHTML;
  assert.ok(!dialogHtml.includes('src="<svg'), 'SVG string must not be wrapped inside src="<svg attribute');
  assert.ok(dialogHtml.includes('class="celebrate-icon-wrap"'), 'SVG string must be rendered cleanly inside celebrate-icon-wrap');
});

test('ADJUSTABLE FONT SIZE SETTING: setFontSize updates setting and rejects invalid keys', () => {
  const state = getFreshState();
  assert.equal(state.settings.fontSize, 'normal');

  const resLarge = PoyoriEngine.setFontSize(state, 'large');
  assert.equal(resLarge.success, true);
  assert.equal(state.settings.fontSize, 'large');

  const resHuge = PoyoriEngine.setFontSize(state, 'huge');
  assert.equal(resHuge.success, true);
  assert.equal(state.settings.fontSize, 'huge');

  const resInvalid = PoyoriEngine.setFontSize(state, 'tiny');
  assert.equal(resInvalid.success, false);
  assert.equal(state.settings.fontSize, 'huge');
});
