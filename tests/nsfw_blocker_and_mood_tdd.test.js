/**
 * Test Suite: TDD for NSFW Blocker, Custom Blocked Sites, Grumpy Mood & Task Controls
 *
 * Written PRIOR to code implementation to ensure strict requirement compliance:
 * 1. NSFW Control filter & custom blocked site detection.
 * 2. Silly theme-befitting blocked quotes.
 * 3. Logical pet mood & neglect mechanics (Grumpy state & sprite reactions).
 * 4. Fixed rewards for user-added tasks (prevent custom reward tampering).
 * 5. Comprehensive language switching across Japanese, English, and Bilingual modes.
 * 6. Handheld console buttons (A, B, C) contextual execution.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, TERMINOLOGY, getTerm, CREATURES } from '../shared/constants.js';
import { PoyoriEngine } from '../shared/game-engine.js';
import { getCreatureSprite } from '../content/sprites.js';

test('TDD: NSFW Filter identifies adult domains and respects settings toggle', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));

  // By default, NSFW filter should be toggleable in settings
  assert.equal(typeof state.settings.nsfwFilterEnabled, 'boolean', 'settings.nsfwFilterEnabled must be a boolean');

  const adultDomains = [
    'pornhub.com',
    'www.xvideos.com',
    'chaturbate.com',
    'onlyfans.com',
    'redtube.com',
    'hentaihaven.xxx',
    'rule34.xxx'
  ];

  const safeDomains = [
    'wikipedia.org',
    'github.com',
    'khanacademy.org',
    'duolingo.com',
    'google.com'
  ];

  // 1. When NSFW filter is DISABLED:
  state.settings.nsfwFilterEnabled = false;
  for (const domain of adultDomains) {
    assert.equal(
      PoyoriEngine.isBlocked(domain, state),
      false,
      `Adult domain ${domain} should not be blocked when filter is disabled`
    );
  }

  // 2. When NSFW filter is ENABLED:
  state.settings.nsfwFilterEnabled = true;
  for (const domain of adultDomains) {
    assert.equal(
      PoyoriEngine.isBlocked(domain, state),
      true,
      `Adult domain ${domain} must be blocked when filter is enabled`
    );
  }

  for (const domain of safeDomains) {
    assert.equal(
      PoyoriEngine.isBlocked(domain, state),
      false,
      `Safe domain ${domain} must NEVER be blocked by NSFW filter`
    );
  }
});

test('TDD: Custom Blocked Pages option allows user to define sites and triggers redirection', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  assert.ok(Array.isArray(state.settings.customBlockedSites), 'settings.customBlockedSites must be an array');

  // Add custom blocked sites
  state.settings.customBlockedSites = ['distracting-hub.net', 'procrastination.org', 'timewaster.tv'];

  assert.equal(PoyoriEngine.isBlocked('distracting-hub.net', state), true);
  assert.equal(PoyoriEngine.isBlocked('www.procrastination.org', state), true, 'Must handle www prefix');
  assert.equal(PoyoriEngine.isBlocked('subdomain.timewaster.tv', state), true, 'Must handle subdomains');
  assert.equal(PoyoriEngine.isBlocked('helpful-study.org', state), false);
});

test('TDD: Silly blocked quotes provide randomized, humorous Mochimori-themed lines', () => {
  const quotes = PoyoriEngine.getBlockedQuotes();
  assert.ok(Array.isArray(quotes), 'getBlockedQuotes must return an array');
  assert.ok(quotes.length >= 8, 'Must have at least 8 silly themed quotes');

  const samples = new Set();
  for (let i = 0; i < 30; i++) {
    const q = PoyoriEngine.getRandomBlockedQuote();
    assert.ok(typeof q === 'string' && q.length > 10, 'Each quote must be a substantial string');
    assert.ok(
      q.includes('Poyori') || q.includes('Mochimori') || q.includes('focus') || q.includes('task') || q.includes('BONK'),
      `Quote "${q}" must be befitting the Poyori theme`
    );
    samples.add(q);
  }

  // Ensure randomness is active
  assert.ok(samples.size >= 4, 'Multiple distinct quotes must be selected over 30 samples');
});

test('TDD: Pet Mood Engine accurately calculates Grumpy state when neglected', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));

  // Healthy pet -> Cheerful
  state.pet.onaka = 85;
  state.pet.genki = 90;
  state.pet.kizuna = 60;
  state.pet.isSleeping = false;
  state.pet.isSick = false;
  assert.equal(PoyoriEngine.getPetMood(state), 'cheerful');

  // Hungry pet (< 30) -> Grumpy
  state.pet.onaka = 20;
  assert.equal(PoyoriEngine.getPetMood(state), 'grumpy');

  // Low affection pet (< 20 kizuna) -> Grumpy
  state.pet.onaka = 70;
  state.pet.kizuna = 15;
  assert.equal(PoyoriEngine.getPetMood(state), 'grumpy');

  // Exhausted pet -> Sleepy
  state.pet.kizuna = 50;
  state.pet.genki = 15;
  assert.equal(PoyoriEngine.getPetMood(state), 'sleepy');

  // Sick pet -> Sick
  state.pet.isSick = true;
  assert.equal(PoyoriEngine.getPetMood(state), 'sick');
});

test('TDD: Grumpy Sprite Reaction generates distinct visual irritation on the creature', () => {
  const cid = 'pikoneko';
  const idleSvg = getCreatureSprite(cid, 'idle1');
  const grumpySvg = getCreatureSprite(cid, 'grumpy');

  assert.ok(grumpySvg.startsWith('data:image/svg+xml;base64,'), 'Grumpy sprite must be valid Base64 SVG');
  assert.notEqual(idleSvg, grumpySvg, 'Grumpy sprite must be visually distinct from idle sprite');

  // Decode and verify grumpy attributes
  const b64 = grumpySvg.replace('data:image/svg+xml;base64,', '');
  const decodedXml = Buffer.from(b64, 'base64').toString('utf8');
  assert.ok(decodedXml.includes('<svg'), 'Decoded grumpy sprite must be valid SVG');
});

test('TDD: Task Adding enforces fixed rewards (10 coins, 1 apple) and rejects custom tampering', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  const initialTaskCount = state.tasks.length;

  // Add a task through engine
  const res = PoyoriEngine.addTask(state, 'Read chapter 3 of math textbook', { coins: 9999, reward: 'golden_apple' });
  assert.equal(res.success, true);
  assert.equal(state.tasks.length, initialTaskCount + 1);

  const addedTask = state.tasks[state.tasks.length - 1];
  assert.equal(addedTask.title, 'Read chapter 3 of math textbook');

  // CRITICAL REQUIREMENT: Must NOT allow user to set reward to 9999 or golden_apple!
  assert.equal(addedTask.coins, 10, 'Task coins must be fixed to 10');
  assert.equal(addedTask.reward, 'ringo', 'Task food reward must be fixed to ringo');

  // Empty title must be rejected
  const emptyRes = PoyoriEngine.addTask(state, '   ');
  assert.equal(emptyRes.success, false, 'Empty task title must be rejected');
});

test('TDD: Language Mode changes update all terms and text across Japanese, English, and Bilingual', () => {
  const termsToVerify = ['hunger', 'energy', 'trials', 'feed', 'pet', 'sleep', 'settings', 'bestiary', 'wardrobe'];

  for (const key of termsToVerify) {
    const ja = getTerm(key, 'japanese');
    const en = getTerm(key, 'english');
    const bi = getTerm(key, 'bilingual');

    assert.ok(ja && ja.length > 0, `Term ${key} must have Japanese translation`);
    assert.ok(en && en.length > 0, `Term ${key} must have English translation`);
    assert.ok(bi && bi.length > 0, `Term ${key} must have Bilingual translation`);

    // Ensure they are distinctly different
    assert.notEqual(ja, en, `Japanese and English representations for ${key} must differ`);
    assert.ok(bi.includes('(') && bi.includes(')'), `Bilingual term ${key} should include both representations`);
  }
});
