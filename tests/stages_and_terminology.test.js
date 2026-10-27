/**
 * Test Suite: Life Stages & Terminology
 * Verifies Japanese-oriented stages (Tamago -> Shin'en), worldbuilding terms,
 * and bilingual localization modes according to user specifications.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGES, TERMINOLOGY, getTerm } from '../shared/constants.js';

test('Life Stages (1 to 6) strictly match requirements', () => {
  assert.equal(STAGES.length, 6, 'Must define exactly 6 life stages');

  const expectedStages = [
    { level: 1, id: 'tamago', termKey: 'stage1' },
    { level: 2, id: 'umare', termKey: 'stage2' },
    { level: 3, id: 'kodama', termKey: 'stage3' },
    { level: 4, id: 'seishin', termKey: 'stage4' },
    { level: 5, id: 'shinju', termKey: 'stage5' },
    { level: 6, id: 'shinen', termKey: 'stage6' }
  ];

  expectedStages.forEach((exp, idx) => {
    const stage = STAGES[idx];
    assert.equal(stage.level, exp.level, `Stage ${idx + 1} level must match`);
    assert.equal(stage.id, exp.id, `Stage ${idx + 1} id must match`);
    assert.equal(stage.termKey, exp.termKey, `Stage ${idx + 1} termKey must match`);
  });
});

test('Terminology dictionary contains all Japanese lore & concepts', () => {
  const dict = TERMINOLOGY.dict;

  // Stages
  assert.equal(dict.stage1.ja, '卵');
  assert.equal(dict.stage1.romaji, 'Tamago');

  assert.equal(dict.stage2.ja, '生まれ');
  assert.equal(dict.stage2.romaji, 'Umare');

  assert.equal(dict.stage3.ja, '木霊');
  assert.equal(dict.stage3.romaji, 'Kodama');

  assert.equal(dict.stage4.ja, '精神');
  assert.equal(dict.stage4.romaji, 'Seishin');

  assert.equal(dict.stage5.ja, '神獣');
  assert.equal(dict.stage5.romaji, 'Shinju');

  assert.equal(dict.stage6.ja, '神焔');
  assert.equal(dict.stage6.romaji, 'Shin\'en');

  // Core Lore & Systems
  assert.equal(dict.world.ja, 'もちもり');
  assert.equal(dict.world.romaji, 'Mochimori');

  assert.equal(dict.evolution.ja, '進化');
  assert.equal(dict.evolution.romaji, 'Shinka');

  assert.equal(dict.bond.ja, '絆');
  assert.equal(dict.bond.romaji, 'Kizuna');

  assert.equal(dict.radiant.ja, '光明');
  assert.equal(dict.radiant.romaji, 'Kōmyō');

  assert.equal(dict.awakening.ja, '覚醒');
  assert.equal(dict.awakening.romaji, 'Kakusei');

  assert.equal(dict.trials.ja, '試練');
  assert.equal(dict.trials.romaji, 'Shiren');

  assert.equal(dict.achievements.ja, '達成');
  assert.equal(dict.achievements.romaji, 'Tassei');

  assert.equal(dict.hunger.ja, 'お腹');
  assert.equal(dict.hunger.romaji, 'Onaka');

  assert.equal(dict.energy.ja, '元気');
  assert.equal(dict.energy.romaji, 'Genki');
});

test('getTerm() supports bilingual, japanese, and english modes', () => {
  // Bilingual: Romaji (English)
  const biBond = getTerm('bond', 'bilingual');
  assert.match(biBond, /Kizuna/);
  assert.match(biBond, /Bond/);

  // Japanese: Kanji (Romaji)
  const jaBond = getTerm('bond', 'japanese');
  assert.match(jaBond, /絆/);
  assert.match(jaBond, /Kizuna/);

  // English: English meaning only
  const enBond = getTerm('bond', 'english');
  assert.equal(enBond, 'Bond & Affection');
});
