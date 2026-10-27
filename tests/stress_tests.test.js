/**
 * Poyori (ポヨリ) — Comprehensive Stress Tests Suite
 * Rigorously stress tests game engine performance, stat stability,
 * task reward enforcement, domain classification, silly quote entropy,
 * rapid sprite generation, and state invariant preservation.
 */

import test from 'node:test';
import assert from 'node:assert';
import { PoyoriEngine } from '../shared/game-engine.js';
import { DEFAULT_STATE, BLOCKED_SILLY_QUOTES, CREATURES, PALETTES, TERMINOLOGY, getTerm } from '../shared/constants.js';
import { getCreatureSprite } from '../content/sprites.js';

test('STRESS: 10,000 Game Engine Ticks under varying time-delta increments', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  state.settings.consequenceMode = 'cozy';
  state.settings.nightModeEnabled = false; // test pure tick math

  const start = performance.now();
  let sickCount = 0;
  let grumpyCount = 0;
  let cheerfulCount = 0;

  for (let i = 0; i < 10000; i++) {
    // Alternate feeding / petting / neglecting every few hundred ticks
    if (i % 200 === 0) {
      PoyoriEngine.feed(state, 'ringo');
    }
    if (i % 150 === 0) {
      PoyoriEngine.pet(state);
    }
    if (state.pet.isSick && i % 300 === 0) {
      PoyoriEngine.feed(state, 'yakuso');
    }

    // Step by random time delta (1 to 15 minutes)
    const elapsedMinutes = 1 + (i % 15);
    const mockTime = Date.now() + i * elapsedMinutes * 60 * 1000;
    PoyoriEngine.processTick(state, mockTime);

    // Assert vitals are strictly bounded between 0 and 100
    assert.ok(state.pet.onaka >= 0 && state.pet.onaka <= 100, `Onaka out of bounds: ${state.pet.onaka} at tick ${i}`);
    assert.ok(state.pet.genki >= 0 && state.pet.genki <= 100, `Genki out of bounds: ${state.pet.genki} at tick ${i}`);
    assert.ok(state.pet.kizuna >= 0 && state.pet.kizuna <= 100, `Kizuna out of bounds: ${state.pet.kizuna} at tick ${i}`);
    assert.ok(!Number.isNaN(state.pet.onaka), 'Onaka became NaN');
    assert.ok(!Number.isNaN(state.pet.genki), 'Genki became NaN');
    assert.ok(!Number.isNaN(state.pet.kizuna), 'Kizuna became NaN');

    // Count mood distribution
    const mood = state.pet.mood;
    assert.ok(['cheerful', 'grumpy', 'sleepy', 'sick'].includes(mood), `Invalid mood: ${mood}`);
    if (mood === 'sick') sickCount++;
    else if (mood === 'grumpy') grumpyCount++;
    else if (mood === 'cheerful') cheerfulCount++;
  }

  const duration = performance.now() - start;
  // 10,000 ticks should complete smoothly within 500ms
  assert.ok(duration < 500, `10,000 ticks took too long: ${duration.toFixed(2)}ms`);
  assert.ok(cheerfulCount > 0, 'Pet was never cheerful');
  assert.ok(grumpyCount > 0, 'Pet was never grumpy during prolonged hunger periods');
});

test('STRESS: 1,000 Rapid Task Creations & Completions with Fixed Reward Integrity', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  const initialCoins = state.koban;
  const initialApples = state.inventory.ringo || 0;

  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    // Malicious attempt to override reward
    const res = PoyoriEngine.addTask(state, `Task #${i}`, { reward: 'nikuman', coins: 9999 });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.task.reward, 'ringo', 'Tampered reward must be overwritten with ringo');
    assert.strictEqual(res.task.coins, 10, 'Tampered coins must be overwritten with 10');

    // Complete the task
    const compRes = PoyoriEngine.completeTask(state, res.task.id);
    assert.strictEqual(compRes.success, true);
  }

  const duration = performance.now() - start;
  assert.ok(duration < 250, `1,000 tasks took too long: ${duration.toFixed(2)}ms`);

  // Verify economy strictly added exactly 1,000 * 10 coins and 1,000 * 1 apple
  // (plus any coins from completed daily quests)
  const expectedTaskCoins = 1000 * 10;
  assert.ok(state.koban >= initialCoins + expectedTaskCoins, `Coins invariant failed: got ${state.koban}`);
  assert.strictEqual(state.inventory.ringo, initialApples + 1000, `Inventory apple invariant failed: got ${state.inventory.ringo}`);
  assert.strictEqual(state.stats.totalTasksDone, 1000);
});

test('STRESS: 2,000 Rapid Domain & Blocker Evaluations under high throughput', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  state.settings.nsfwFilterEnabled = true;
  state.settings.customBlockedSites = ['distracting-site.com', 'procrastinate.org', 'social-media.io'];

  const testDomains = [
    'https://www.github.com/project',
    'http://subdomain.wikipedia.org/wiki/Tamagotchi',
    'https://pornhub.com/video',
    'https://xhamster.com',
    'http://distracting-site.com/feed',
    'https://safe-study-site.edu/course',
    'https://www.youtube.com/watch?v=abc',
    'https://xxx-movies.net/clip',
    'http://duolingo.com/learn',
    'https://random-neutral-blog.org/article'
  ];

  const start = performance.now();
  let blockedCount = 0;
  let nsfwCount = 0;

  for (let i = 0; i < 2000; i++) {
    const domain = testDomains[i % testDomains.length];
    if (PoyoriEngine.isBlocked(domain, state)) {
      blockedCount++;
    }
    if (PoyoriEngine.isNsfwDomain(domain)) {
      nsfwCount++;
    }
  }

  const duration = performance.now() - start;
  // 2,000 evaluations must complete well under 100ms
  assert.ok(duration < 100, `2,000 domain checks took too long: ${duration.toFixed(2)}ms`);
  assert.ok(blockedCount > 0, 'Expected blocked sites to be caught');
  assert.ok(nsfwCount > 0, 'Expected nsfw sites to be identified');
});

test('STRESS: Silly Blocked Quotes Uniformity and Non-Emptiness across 1,000 draws', () => {
  const counts = {};
  BLOCKED_SILLY_QUOTES.forEach(q => { counts[q] = 0; });

  for (let i = 0; i < 1000; i++) {
    const quote = PoyoriEngine.getRandomBlockedQuote();
    assert.ok(quote && typeof quote === 'string', 'Returned empty or invalid quote');
    assert.ok(quote.length > 10, 'Quote is suspiciously short');
    assert.ok(counts.hasOwnProperty(quote), 'Quote not in BLOCKED_SILLY_QUOTES list');
    counts[quote]++;
  }

  // Ensure every single quote was selected at least once across 1,000 random picks
  for (const quote of BLOCKED_SILLY_QUOTES) {
    assert.ok(counts[quote] > 0, `Quote "${quote}" was never selected in 1,000 draws`);
  }
});

test('STRESS: Terminology dictionary multi-language invariance across all terms', () => {
  const modes = ['bilingual', 'japanese', 'english'];
  const dictKeys = Object.keys(TERMINOLOGY.dict);
  assert.ok(dictKeys.length >= 25, `Expected at least 25 dictionary entries, got ${dictKeys.length}`);

  for (const key of dictKeys) {
    for (const mode of modes) {
      const term = getTerm(key, mode);
      assert.ok(term && typeof term === 'string', `Failed for key "${key}" in mode "${mode}"`);
      assert.ok(term.trim().length > 0, `Empty string returned for key "${key}" in mode "${mode}"`);
      assert.ok(!term.includes('undefined'), `Term contains "undefined" for key "${key}" in mode "${mode}"`);
    }
  }
});

test('STRESS: Sprite Generation across all creatures and 7 actions (2,000+ renders)', () => {
  const creatureIds = Object.keys(CREATURES);
  assert.ok(creatureIds.length >= 24, 'All Mochimori creatures must be registered');

  const actions = ['idle1', 'idle2', 'happy', 'sad', 'sleep', 'petted', 'grumpy'];
  const accessories = ['none', 'ribbon', 'glasses', 'crown', 'leaf'];

  const start = performance.now();
  let renderCount = 0;

  for (const id of creatureIds) {
    for (const action of actions) {
      for (const acc of accessories) {
        const spriteUri = getCreatureSprite(id, action, acc === 'none' ? null : acc);
        assert.ok(spriteUri.startsWith('data:image/svg+xml;base64,'), `Invalid URI for ${id} ${action} ${acc}`);
        assert.ok(spriteUri.length > 100, `Sprite URI too small for ${id} ${action} ${acc}`);
        renderCount++;
      }
    }
  }

  const duration = performance.now() - start;
  const expectedRenders = creatureIds.length * actions.length * accessories.length;
  assert.strictEqual(renderCount, expectedRenders);
  assert.ok(duration < 3000, `${renderCount} sprite renders took too long: ${duration.toFixed(2)}ms`);
});

test('STRESS: Hardcore Neglect Runaway Boundary Invariant', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  state.settings.consequenceMode = 'hardcore';
  state.pet.isSick = true;
  state.pet.onaka = 0;

  const now = Date.now();
  state.pet.lastFedAt = now;

  // Tick at 47 hours (should NOT trigger runaway yet)
  const time47h = now + 47 * 60 * 60 * 1000;
  const res47 = PoyoriEngine.processTick(state, time47h);
  assert.strictEqual(res47.event?.type, undefined, 'Runaway must not trigger before 48h neglect');

  // Tick at 49 hours (MUST trigger runaway)
  const time49h = now + 49 * 60 * 60 * 1000;
  const res49 = PoyoriEngine.processTick(state, time49h);
  assert.strictEqual(res49.event?.type, 'runaway', 'Runaway must trigger after >48h neglect');
});
