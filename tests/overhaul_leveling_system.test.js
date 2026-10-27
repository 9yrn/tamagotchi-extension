/**
 * Poyori (ポヨリ) — Leveling Engine & Exponential EXP Curve Tests (TDD)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE } from '../shared/constants.js';
import { PoyoriEngine } from '../shared/game-engine.js';

test('LEVELING TDD: Exponential XP requirements scale challenging progression', () => {
  // Level 1 -> 2 requires 80 * 1^1.5 = 80 XP
  assert.equal(PoyoriEngine.getXpForNextLevel(1), 80);

  // Level 5 requires 80 * 5^1.5 ≈ 894 XP
  const xpL5 = PoyoriEngine.getXpForNextLevel(5);
  assert.ok(xpL5 > 800 && xpL5 < 1000, `Level 5 should require ~894 XP, got ${xpL5}`);

  // Level 20 requires 80 * 20^1.5 ≈ 7155 XP
  const xpL20 = PoyoriEngine.getXpForNextLevel(20);
  assert.ok(xpL20 > 6500, `Level 20 must require substantial XP (>6500), got ${xpL20}`);

  // Monotonically increasing challenge
  assert.ok(PoyoriEngine.getXpForNextLevel(10) > PoyoriEngine.getXpForNextLevel(5));
  assert.ok(PoyoriEngine.getXpForNextLevel(30) > PoyoriEngine.getXpForNextLevel(20));
});

test('LEVELING TDD: PoyoriEngine.calculateLevel accurately computes level from total XP', () => {
  assert.equal(PoyoriEngine.calculateLevel(0), 1, '0 XP is Level 1');
  assert.equal(PoyoriEngine.calculateLevel(50), 1, '50 XP is still Level 1');
  assert.ok(PoyoriEngine.calculateLevel(250) >= 2, '250 XP should be at least Level 2');
  
  // Level 32 (Adult threshold) requires cumulative progression
  const adultXp = PoyoriEngine.getCumulativeXpForLevel(32);
  assert.equal(PoyoriEngine.calculateLevel(adultXp), 32);
  assert.equal(PoyoriEngine.calculateLevel(adultXp - 1), 31);
});

test('LEVELING TDD: Milestone evolution checks adhere to progressive levels', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  state.pet.creatureId = 'coding_tamago';
  state.pet.stage = 1;
  state.pet.xp = 0;
  state.pet.level = 1;

  // Level 1 Tamago cannot evolve yet
  assert.equal(PoyoriEngine.isEligibleForEvolution(state.pet), false);

  // At Level 3, baby evolution is unlocked
  state.pet.level = 3;
  assert.equal(PoyoriEngine.isEligibleForEvolution(state.pet), true);
  const evoResult = PoyoriEngine.checkEvolution(state);
  assert.ok(evoResult, 'Must trigger evolution at Level 3');
  assert.equal(state.pet.stage, 2, 'Must evolve to Stage 2 Baby');
});

test('LEVELING TDD: Multi-field discipline allocation supports up to 3 active fields', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  
  // Player can select up to 3 fields
  const res = PoyoriEngine.setActiveDisciplines(state, ['coding', 'creative', 'literature']);
  assert.equal(res.success, true);
  assert.deepEqual(state.pet.activeDisciplines, ['coding', 'creative', 'literature']);

  // Selecting more than 3 fields is rejected
  const overflowRes = PoyoriEngine.setActiveDisciplines(state, ['coding', 'creative', 'literature', 'research']);
  assert.equal(overflowRes.success, false);
  assert.equal(overflowRes.reason, 'max_3_disciplines');
});
