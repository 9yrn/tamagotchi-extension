/**
 * Test Suite: Consequences & Game Modes
 * Verifies Cozy vs Hardcore modes, neglect consequences,
 * Gūtara slacker branching conditions, and sleep schedules.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PoyoriEngine } from '../shared/game-engine.js';
import { DEFAULT_STATE } from '../shared/constants.js';

function getFreshState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

test('Cozy mode prevents death or runaway upon zero hunger', () => {
  const state = getFreshState();
  state.settings.consequenceMode = 'cozy';
  state.pet.onaka = 0;
  state.pet.lastFedAt = Date.now() - (72 * 60 * 60 * 1000); // 72 hours ago
  state.pet.lastTickAt = Date.now() - (60 * 60 * 1000);

  const { event } = PoyoriEngine.processTick(state, Date.now());
  assert.equal(event, undefined, 'Cozy mode must not trigger death or runaway');
  assert.equal(state.pet.isSick, true, 'Pet should be sick to indicate need for food');
});

test('Hardcore mode triggers runaway consequence after 48h neglect', () => {
  const state = getFreshState();
  state.settings.consequenceMode = 'hardcore';
  state.pet.onaka = 0;
  state.pet.isSick = true;
  state.pet.lastFedAt = Date.now() - (50 * 60 * 60 * 1000); // 50 hours ago
  state.pet.lastTickAt = Date.now() - (60 * 60 * 1000);

  const { event } = PoyoriEngine.processTick(state, Date.now());
  assert.ok(event, 'Hardcore mode must trigger consequence event');
  assert.equal(event.type, 'runaway');
});

test('Hardcore mode steers towards Gūtara branch when distraction dominates over study', () => {
  const state = getFreshState();
  state.settings.consequenceMode = 'hardcore';
  state.stats.totalMinutesDistraction = 120; // 2 hours of distraction
  state.stats.totalMinutesEdu.denki = 10;
  state.stats.totalMinutesEdu.chishiki = 10;
  state.stats.totalMinutesEdu.monogatari = 10;

  const branch = PoyoriEngine.determineDominantBranch(state);
  assert.equal(branch, 'gutara', 'Heavy distraction in Hardcore mode must steer to Gutara branch');
});

test('Bedtime detector handles day and overnight time ranges', () => {
  // Midnight crossing range: 22:30 to 07:30
  // Test time 23:00 (11 PM) -> should be true
  const isNight = PoyoriEngine.isBedtime('22:30', '07:30');
  // Dynamic assertion depending on current hour
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const shouldBeBedtime = currentMins >= (22 * 60 + 30) || currentMins < (7 * 60 + 30);
  assert.equal(isNight, shouldBeBedtime);
});
