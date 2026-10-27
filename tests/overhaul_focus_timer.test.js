/**
 * Poyori (ポヨリ) — Focus Session Timer & Real-Time Website Accountability Tests (TDD)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE } from '../shared/constants.js';
import { PoyoriEngine } from '../shared/game-engine.js';

test('FOCUS TIMER TDD: Start focus session initializes session timer and selected discipline', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  
  const res = PoyoriEngine.startFocusSession(state, {
    discipline: 'coding',
    durationMinutes: 25
  });

  assert.equal(res.success, true);
  assert.ok(state.focusSession, 'focusSession object must exist in state');
  assert.equal(state.focusSession.isActive, true);
  assert.equal(state.focusSession.discipline, 'coding');
  assert.equal(state.focusSession.durationSeconds, 25 * 60);
  assert.equal(state.focusSession.remainingSeconds, 25 * 60);
  assert.equal(state.focusSession.distractionsCount, 0);
});

test('FOCUS TIMER TDD: On-topic browsing smoothly advances timer and earns bonus XP', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  PoyoriEngine.startFocusSession(state, { discipline: 'coding', durationMinutes: 25 });
  
  const initialXp = state.pet.xp;
  
  // User visits GitHub (on-topic for coding)
  const tickRes = PoyoriEngine.processFocusTick(state, 'github.com', 60);
  assert.equal(tickRes.isOnTopic, true);
  assert.equal(tickRes.nudgeNeeded, false);
  assert.ok(state.pet.xp > initialXp, 'On-topic focus browsing must award bonus XP');
  assert.equal(state.focusSession.remainingSeconds, (25 * 60) - 60);
});

test('FOCUS TIMER TDD: Off-topic or distracting browsing triggers accountability nudge and increments distractions', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  PoyoriEngine.startFocusSession(state, { discipline: 'coding', durationMinutes: 25 });

  // User visits distracting site (e.g. reddit.com or youtube.com)
  const tickRes = PoyoriEngine.processFocusTick(state, 'youtube.com', 30);
  assert.equal(tickRes.isOnTopic, false);
  assert.equal(tickRes.nudgeNeeded, true);
  assert.ok(tickRes.nudgeMessage.includes('Coding') || tickRes.nudgeMessage.includes('focus'), 'Nudge message must remind user of chosen discipline');
  assert.equal(state.focusSession.distractionsCount, 1);
});

test('FOCUS TIMER TDD: Completing focus session grants major XP reward and Koban celebration', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  PoyoriEngine.startFocusSession(state, { discipline: 'coding', durationMinutes: 15 });
  state.focusSession.remainingSeconds = 0; // Simulate time expired

  const initialKoban = state.koban;
  const initialXp = state.pet.xp;

  const completeRes = PoyoriEngine.completeFocusSession(state);
  assert.equal(completeRes.success, true);
  assert.equal(state.focusSession.isActive, false);
  assert.ok(state.koban > initialKoban, 'Focus completion must award Koban');
  assert.ok(state.pet.xp > initialXp, 'Focus completion must award bonus XP');
});

test('FOCUS TIMER TDD: Cancelling focus session terminates timer cleanly without rewards', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  PoyoriEngine.startFocusSession(state, { discipline: 'coding', durationMinutes: 25 });
  
  const cancelRes = PoyoriEngine.cancelFocusSession(state);
  assert.equal(cancelRes.success, true);
  assert.equal(state.focusSession.isActive, false);
});

test('FOCUS TIMER TDD: Session records lastTickAt and updates timestamp across browsing ticks', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  const before = Date.now();
  PoyoriEngine.startFocusSession(state, { discipline: 'coding', durationMinutes: 25 });
  assert.ok(state.focusSession.lastTickAt >= before, 'lastTickAt must be recorded on start');

  PoyoriEngine.processFocusTick(state, 'github.com', 10);
  assert.ok(state.focusSession.lastTickAt >= before, 'lastTickAt must be maintained on tick');
  assert.equal(state.focusSession.remainingSeconds, 1500 - 10);
});

test('FOCUS TIMER TDD: Built-in DOMAIN_PRESETS.distracting correctly flags social media as distraction', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  PoyoriEngine.startFocusSession(state, { discipline: 'coding', durationMinutes: 25 });

  const res = PoyoriEngine.processFocusTick(state, 'tiktok.com', 30);
  assert.equal(res.isOnTopic, false);
  assert.equal(res.nudgeNeeded, true);
  assert.equal(state.focusSession.distractionsCount, 1);
});

