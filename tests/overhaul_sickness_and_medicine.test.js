/**
 * Poyori (ポヨリ) — Sickness Treatment & Yakusō Medicine Flow Tests (TDD)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, FOOD_ITEMS } from '../shared/constants.js';
import { PoyoriEngine } from '../shared/game-engine.js';

test('SICKNESS TDD: Yakusō item definition exists with curesIllness flag and proper stats', () => {
  const yakuso = FOOD_ITEMS.yakuso;
  assert.ok(yakuso, 'Yakusō item must exist in FOOD_ITEMS');
  assert.equal(yakuso.curesIllness, true, 'Yakusō must have curesIllness: true');
  assert.equal(yakuso.energyRestore, 50);
  assert.equal(yakuso.hungerRestore, 10);
  assert.equal(yakuso.cost, 15, 'Yakusō must cost 15 Koban in shop');
});

test('SICKNESS TDD: Feeding Yakusō cures sickness and updates pet mood away from sick', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  state.pet.isSick = true;
  state.pet.mood = 'sick';
  state.inventory.yakuso = 2;

  assert.equal(PoyoriEngine.getPetMood(state), 'sick');

  const res = PoyoriEngine.feed(state, 'yakuso');
  assert.equal(res.success, true);
  assert.equal(state.pet.isSick, false, 'Pet must no longer be sick');
  assert.equal(state.inventory.yakuso, 1, 'Inventory count must decrement');
  assert.notEqual(PoyoriEngine.getPetMood(state), 'sick', 'Mood must no longer be sick');
});

test('SICKNESS TDD: PoyoriEngine.curePet cures illness when medicine is available', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  state.pet.isSick = true;
  state.inventory.yakuso = 1;

  const cureRes = PoyoriEngine.curePet(state);
  assert.equal(cureRes.success, true);
  assert.equal(state.pet.isSick, false);
  assert.equal(state.inventory.yakuso, 0);

  // Subsequent call when no medicine remains fails gracefully
  state.pet.isSick = true;
  const failRes = PoyoriEngine.curePet(state);
  assert.equal(failRes.success, false);
  assert.equal(failRes.reason, 'no_medicine');
});

test('SICKNESS TDD: Purchasing Yakusō from the Mochimori Market adds it to inventory', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  state.koban = 50;
  state.inventory.yakuso = 0;

  const res = PoyoriEngine.buyFoodItem(state, 'yakuso');
  assert.equal(res.success, true);
  assert.equal(state.koban, 35, '50 - 15 = 35 Koban');
  assert.equal(state.inventory.yakuso, 1);

  // Insufficient Koban fails gracefully
  state.koban = 10;
  const poorRes = PoyoriEngine.buyFoodItem(state, 'yakuso');
  assert.equal(poorRes.success, false);
  assert.equal(poorRes.reason, 'insufficient_koban');
});
