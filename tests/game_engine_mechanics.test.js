/**
 * Test Suite: Game Engine Mechanics
 * Verifies core game loops: feeding, task rewards, activity tracking,
 * XP progression, evolution branching, and streak unlocks.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PoyoriEngine } from '../shared/game-engine.js';
import { DEFAULT_STATE } from '../shared/constants.js';

function getFreshState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

test('Feeding restores Onaka, Kizuna and consumes inventory', () => {
  const state = getFreshState();
  state.pet.onaka = 40;
  state.pet.kizuna = 20;
  state.inventory.ringo = 2;

  const result = PoyoriEngine.feed(state, 'ringo');
  assert.equal(result.success, true);
  assert.equal(state.inventory.ringo, 1, 'Inventory item count must decrement');
  assert.equal(state.pet.onaka, 65, 'Ringo must restore 25 hunger');
  assert.equal(state.pet.kizuna, 25, 'Ringo must boost Kizuna by 5');
});

test('Feeding medicine (Yakusō) cures sickness', () => {
  const state = getFreshState();
  state.pet.isSick = true;
  state.inventory.yakuso = 1;

  const result = PoyoriEngine.feed(state, 'yakuso');
  assert.equal(result.success, true);
  assert.equal(state.pet.isSick, false, 'Yakuso must cure illness');
});

test('Completing a task awards food, pixel coins, and advances quests', () => {
  const state = getFreshState();
  const initialCoins = state.koban;
  const initialTasksDone = state.stats.totalTasksDone;

  const result = PoyoriEngine.completeTask(state, 'task-1');
  assert.equal(result.success, true);
  assert.equal(state.stats.totalTasksDone, initialTasksDone + 1);
  assert.equal(state.koban, initialCoins + 10, 'Task 1 must award 10 coins');
  assert.ok(state.inventory.ringo > 0, 'Task 1 must award ringo');

  // Verify task status
  const task = state.tasks.find(t => t.id === 'task-1');
  assert.equal(task.completed, true);
});

test('Educational website browsing awards XP to the correct branch', () => {
  const state = getFreshState();
  state.pet.xp = 0;
  state.pet.isSleeping = false;
  state.pet.isSick = false;

  // Visit github.com for 120 seconds (2 minutes)
  PoyoriEngine.recordBrowsing(state, 'github.com', 120);

  assert.ok(state.stats.totalMinutesEdu.denki >= 2, 'Denki minutes must increase');
  assert.ok(state.pet.xp > 0, 'XP must be awarded for educational browsing');
});

test('Distracting browsing drains energy and triggers fatigue sleep', () => {
  const state = getFreshState();
  state.pet.genki = 20;
  state.pet.isSleeping = false;

  // Visit youtube.com for 600 seconds (10 minutes)
  PoyoriEngine.recordBrowsing(state, 'youtube.com', 600);

  assert.ok(state.stats.totalMinutesDistraction >= 10);
  assert.ok(state.pet.genki <= 15, 'Energy must be drained');
  assert.equal(state.pet.isSleeping, true, 'Pet must fall asleep when fatigued by distraction');
});

test('Evolution branching favors dominant study category', () => {
  // Test Denki Branch
  const denkiState = getFreshState();
  denkiState.pet.stage = 1;
  denkiState.pet.xp = 150;
  denkiState.stats.totalMinutesEdu.denki = 50;
  denkiState.stats.totalMinutesEdu.chishiki = 10;
  denkiState.stats.totalMinutesEdu.monogatari = 5;

  const denkiResult = PoyoriEngine.checkEvolution(denkiState);
  assert.equal(denkiResult.evolved, true);
  assert.equal(denkiState.pet.chosenBranch, 'denki');
  assert.equal(denkiState.pet.creatureId, 'pikoneko');

  // Test Chishiki Branch
  const scholarState = getFreshState();
  scholarState.pet.stage = 1;
  scholarState.pet.xp = 150;
  scholarState.stats.totalMinutesEdu.chishiki = 60;
  scholarState.stats.totalMinutesEdu.denki = 10;

  const scholarResult = PoyoriEngine.checkEvolution(scholarState);
  assert.equal(scholarResult.evolved, true);
  assert.equal(scholarState.pet.chosenBranch, 'chishiki');
  assert.equal(scholarState.pet.creatureId, 'fukuro_ko');

  // Test Monogatari Branch
  const storyState = getFreshState();
  storyState.pet.stage = 1;
  storyState.pet.xp = 150;
  storyState.stats.totalMinutesEdu.monogatari = 70;

  const storyResult = PoyoriEngine.checkEvolution(storyState);
  assert.equal(storyResult.evolved, true);
  assert.equal(storyState.pet.chosenBranch, 'monogatari');
  assert.equal(storyState.pet.creatureId, 'hanabira_sprite');
});

test('7-Day streak unlocks radiant Kōmyō (光明) form', () => {
  const state = getFreshState();
  state.pet.stage = 5;
  state.pet.chosenBranch = 'denki';
  state.pet.creatureId = 'raijin_drake';
  state.stats.currentStreak = 7;

  const result = PoyoriEngine.checkEvolution(state);
  assert.equal(result.evolved, true);
  assert.equal(result.isKomyo, true);
  assert.equal(state.pet.creatureId, 'komyo_raijin');
  assert.equal(state.pet.isKomyo, true);
});
