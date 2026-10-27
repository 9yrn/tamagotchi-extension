/**
 * Test Suite: Refinements & User Feature Requests
 * Verifies:
 * 1. Radiant Komyo evolution across canonical and Japanese branch aliases.
 * 2. Predefined website presets classification for expanded educational domains.
 * 3. Emotional sprite variants (hungry, procrastinating) and memoization caching.
 * 4. Companion random gender assignment and visibility toggle.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PoyoriEngine } from '../shared/game-engine.js';
import { DEFAULT_STATE, DOMAIN_PRESETS } from '../shared/constants.js';
import { getCreatureSprite } from '../content/sprites.js';

function getFreshState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

test('REFINEMENT: triggerKomyo evolves pets across both canonical and alias branches', () => {
  const branchesToTest = [
    { chosen: 'coding', expectedId: 'coding_radiant' },
    { chosen: 'research', expectedId: 'research_radiant' },
    { chosen: 'denki', expectedId: 'komyo_raijin' },
    { chosen: 'chishiki', expectedId: 'komyo_kenja' },
    { chosen: 'literature', expectedId: 'literature_radiant' },
    { chosen: 'monogatari', expectedId: 'komyo_kitsune' }
  ];

  for (const { chosen, expectedId } of branchesToTest) {
    const state = getFreshState();
    state.pet.stage = 5;
    state.pet.chosenBranch = chosen;
    state.pet.creatureId = 'any_adult_stage';
    state.stats.currentStreak = 7;

    const res = PoyoriEngine.triggerKomyo(state);
    assert.equal(res.evolved, true, `Must evolve for branch ${chosen}`);
    assert.equal(res.isKomyo, true);
    assert.equal(state.pet.creatureId, expectedId, `Expected ${expectedId} for branch ${chosen}`);
    assert.equal(state.pet.isKomyo, true);
  }
});

test('REFINEMENT: Expanded domain presets classify popular dev, research, and literature sites', () => {
  const state = getFreshState();

  // Coding / Tech
  assert.equal(PoyoriEngine.classifyDomain('npmjs.com', state), 'denki');
  assert.equal(PoyoriEngine.classifyDomain('react.dev', state), 'denki');
  assert.equal(PoyoriEngine.classifyDomain('chatgpt.com', state), 'denki');
  assert.equal(PoyoriEngine.classifyDomain('claude.ai', state), 'denki');
  assert.equal(PoyoriEngine.classifyDomain('pypi.org', state), 'denki');

  // Study / Research
  assert.equal(PoyoriEngine.classifyDomain('semanticscholar.org', state), 'chishiki');
  assert.equal(PoyoriEngine.classifyDomain('researchgate.net', state), 'chishiki');
  assert.equal(PoyoriEngine.classifyDomain('openstax.org', state), 'chishiki');

  // Literature / Culture
  assert.equal(PoyoriEngine.classifyDomain('gutenberg.org', state), 'monogatari');
  assert.equal(PoyoriEngine.classifyDomain('archive.org', state), 'monogatari');
  assert.equal(PoyoriEngine.classifyDomain('deepl.com', state), 'monogatari');
});

test('REFINEMENT: Emotional SVG sprites generate valid Base64 data and utilize memoization cache', () => {
  const creatureId = 'denki_tamago';

  // Hungry sprite
  const hungryUri = getCreatureSprite(creatureId, 'hungry');
  assert.ok(hungryUri.startsWith('data:image/svg+xml;base64,'), 'Hungry sprite must return valid SVG Data URI');

  // Procrastinating sprite
  const procUri = getCreatureSprite(creatureId, 'procrastinating');
  assert.ok(procUri.startsWith('data:image/svg+xml;base64,'), 'Procrastinating sprite must return valid SVG Data URI');

  // Grumpy and Petted
  const grumpyUri = getCreatureSprite(creatureId, 'grumpy');
  const pettedUri = getCreatureSprite(creatureId, 'petted');
  assert.ok(grumpyUri.startsWith('data:image/svg+xml;base64,'));
  assert.ok(pettedUri.startsWith('data:image/svg+xml;base64,'));

  // Memoization cache verification: second call must return exact identical string
  const cachedCall = getCreatureSprite(creatureId, 'hungry');
  assert.equal(hungryUri, cachedCall, 'Subsequent call must return cached sprite URI');
});

test('REFINEMENT: Pet state includes gender assignment and roaming visibility', () => {
  const state = getFreshState();
  assert.ok(['male', 'female'].includes(state.pet.gender), 'Pet must have male or female gender');
  assert.equal(state.settings.petVisible, true, 'Default pet roaming visibility must be true');
});
