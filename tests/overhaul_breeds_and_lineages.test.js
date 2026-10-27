/**
 * Poyori (ポヨリ) — 6 Animal Breed Lineages Test Suite (TDD)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { BRANCHES, CREATURES, STAGES } from '../shared/constants.js';

test('BREEDS TDD: Exactly 6 distinct branches exist with proper animal breed metadata', () => {
  const branchKeys = Object.keys(BRANCHES);
  assert.equal(branchKeys.length, 6, 'Must define exactly 6 branches');
  
  const expectedBranches = ['coding', 'creative', 'literature', 'research', 'gaming', 'personal'];
  for (const b of expectedBranches) {
    assert.ok(BRANCHES[b], `Branch ${b} must exist in BRANCHES`);
    assert.ok(BRANCHES[b].breed, `Branch ${b} must define its breed animal`);
    assert.ok(BRANCHES[b].name, `Branch ${b} must have a name`);
    assert.ok(BRANCHES[b].jaName, `Branch ${b} must have a jaName`);
  }

  // Verify the specific animal breeds
  assert.equal(BRANCHES.coding.breed, 'cat', 'Coding must be Cat / Feline breed');
  assert.equal(BRANCHES.creative.breed, 'bird', 'Creative Arts must be Bird / Avian breed');
  assert.equal(BRANCHES.literature.breed, 'fox', 'Literature must be Fox / Kitsune breed');
  assert.equal(BRANCHES.research.breed, 'owl', 'Research must be Owl / Strigine breed');
  assert.equal(BRANCHES.gaming.breed, 'dragon', 'Gaming must be Dragon / Ryū breed');
  assert.equal(BRANCHES.personal.breed, 'shiba', 'Personal Development must be Shiba Inu / Canine breed');
});

test('BREEDS TDD: Every branch has a complete 6-stage lineage with consistent breed', () => {
  const branches = ['coding', 'creative', 'literature', 'research', 'gaming', 'personal'];

  for (const branch of branches) {
    const breed = BRANCHES[branch].breed;
    const creaturesInBranch = Object.values(CREATURES).filter(c => c.branch === branch);
    
    assert.equal(creaturesInBranch.length, 6, `Branch ${branch} must have exactly 6 stages`);
    
    // Check stages 1 through 6
    for (let stage = 1; stage <= 6; stage++) {
      const creature = creaturesInBranch.find(c => c.stage === stage);
      assert.ok(creature, `Branch ${branch} must have a creature for stage ${stage}`);
      assert.equal(creature.breed, breed, `Stage ${stage} in ${branch} must maintain consistent breed ${breed}`);
      assert.ok(creature.name, `Creature ${creature.id} must have a name`);
      assert.ok(creature.jaName, `Creature ${creature.id} must have a jaName`);
      assert.ok(creature.desc, `Creature ${creature.id} must have a desc`);
    }

    // Verify stage 6 is radiant mythic (Kōmyō)
    const stage6 = creaturesInBranch.find(c => c.stage === 6);
    assert.equal(stage6.isKomyo, true, `Stage 6 of ${branch} must be Kōmyō radiant form`);
  }
});

test('BREEDS TDD: Glitch Golem and inconsistent morphs are retired', () => {
  const allIds = Object.keys(CREATURES);
  assert.equal(allIds.includes('gutara_golem'), false, 'Glitch golem must be retired');
  assert.equal(allIds.includes('gutara_egg'), false, 'Old slacker line must be retired');
  
  // Verify total count is 36 creatures (6 branches * 6 stages)
  const nonAliasCount = Object.values(CREATURES).filter(c => !c.isAlias).length;
  assert.equal(nonAliasCount, 36, 'Must define exactly 36 main creatures across 6 branches');
});

test('BREEDS TDD: Legacy creature IDs alias cleanly to corresponding new breed forms', () => {
  // Existing states with denki_tamago or chishiki_tamago must resolve
  assert.ok(CREATURES['denki_tamago'], 'denki_tamago must exist as backward-compatible alias');
  assert.ok(CREATURES['denki_adult'] || CREATURES['coding_adult'], 'adult must exist as backward-compatible alias');
  assert.equal(CREATURES['denki_tamago'].breed, 'cat');
});

test('BREEDS TDD: All 36 canonical creatures have unique, dedicated 9-bit SVG sprites with zero fallbacks to eggs/blobs', async () => {
  const { getCreatureSprite } = await import('../content/sprites.js');
  const canonical = Object.values(CREATURES).filter(c => !c.isAlias);
  assert.equal(canonical.length, 36, 'Must test exactly 36 canonical models');

  const fallbackSample = getCreatureSprite('completely_unknown_pet_id_fallback', 'idle1');
  const distinctSprites = new Set();

  for (const c of canonical) {
    const sprite = getCreatureSprite(c.id, 'idle1');
    assert.ok(sprite.startsWith('data:image/svg+xml;base64,'), `Sprite for ${c.id} must be a valid base64 data URI`);
    assert.notEqual(sprite, fallbackSample, `Creature ${c.id} (${c.name}) must NOT fall back to default egg/blob sprite`);
    distinctSprites.add(sprite);
  }

  // All 36 sprites must be uniquely distinct
  assert.equal(distinctSprites.size, 36, 'All 36 canonical creatures must produce completely distinct, unique 9-bit SVG sprites');
});

test('BREEDS TDD: Glitch Golem is retired and Bit Panther is active with feline sprite', async () => {
  const { getCreatureSprite } = await import('../content/sprites.js');
  assert.equal(CREATURES.coding_teen.id, 'coding_teen');
  assert.equal(CREATURES.coding_teen.name, 'Bit Panther');
  assert.equal(CREATURES.coding_teen.breed, 'cat');

  // Both coding_teen and legacy glitch_golem render the Bit Panther feline sprite
  const teenSprite = getCreatureSprite('coding_teen', 'idle1');
  const golemSprite = getCreatureSprite('glitch_golem', 'idle1');
  assert.equal(teenSprite, golemSprite, 'Legacy glitch_golem must render the sleek Bit Panther sprite');
});

test('BREEDS TDD: Descriptions and special tricks are strictly aligned with animal breed identities', () => {
  const canonical = Object.values(CREATURES).filter(c => !c.isAlias);

  for (const c of canonical) {
    assert.ok(c.desc && c.desc.length > 10, `${c.id} must have a rich, evocative description`);
    assert.ok(c.specialTrick && c.specialTrick.length > 5, `${c.id} must have a special trick`);
    assert.ok(c.jaName && c.jaName.length > 0, `${c.id} must have a Japanese name`);

    // Verify breed keyword presence in either name, desc, or trick
    const text = (c.name + ' ' + c.desc + ' ' + c.specialTrick).toLowerCase();
    const breedKeywords = {
      cat: ['cat', 'kitten', 'feline', 'panther', 'purr', 'whiskers', 'paws', 'nekomata'],
      bird: ['egg', 'bird', 'chick', 'finch', 'crane', 'phoenix', 'feather', 'wings', 'plume', 'chirp', 'suzaku'],
      fox: ['egg', 'fox', 'kit', 'kitsune', 'tail', 'scroll', 'tenko', 'kyūbi', 'kyubi', 'foxfire'],
      owl: ['egg', 'owl', 'owlet', 'monocle', 'sage', 'strigid', 'chrono', 'chronos', 'astrolabe'],
      dragon: ['egg', 'dragon', 'wyrm', 'drake', 'wyvern', 'shinryu', 'shinryū', 'scales', 'fireball'],
      shiba: ['egg', 'pup', 'shiba', 'inu', 'canine', 'zen', 'komainu', 'dog', 'meditation']
    };

    const expectedKeywords = breedKeywords[c.breed];
    assert.ok(expectedKeywords, `Unknown breed ${c.breed} for ${c.id}`);
    const matchesKeyword = expectedKeywords.some(kw => text.includes(kw));
    assert.ok(matchesKeyword, `Creature ${c.id} (${c.name}) with breed ${c.breed} must contain breed-specific vocabulary. Text: "${text}"`);
  }
});

