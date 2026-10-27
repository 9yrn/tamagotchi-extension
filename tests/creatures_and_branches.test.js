/**
 * Test Suite: Creatures & Branches
 * Verifies all 4 evolution branches and 24 creatures specified in the prompt:
 * 1. Denki Branch (電気) — Cyber
 * 2. Chishiki Branch (知識) — Scholar
 * 3. Monogatari Branch (物語) — Story
 * 4. Gūtara Branch (ぐうたら) — Slacker
 * 5. Kōmyō (光明) Radiant forms
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { CREATURES } from '../shared/constants.js';

test('Denki Branch (Cyber) has complete creature lineage from Egg to Radiant Mythic', () => {
  const denkiLineage = [
    { stage: 1, id: 'denki_tamago', name: 'Denki Tamago', ja: '電気卵' },
    { stage: 2, id: 'pikoneko', name: 'Pikoneko', ja: 'ピコ猫' },
    { stage: 3, id: 'kikai_neko', name: 'Kikai Neko', ja: '機械猫' },
    { stage: 4, id: 'glitch_golem', name: 'Glitch Golem', ja: 'グリッチゴーレム' },
    { stage: 5, id: 'raijin_drake', name: 'Raijin Drake', ja: '雷神ドレイク' },
    { stage: 6, id: 'komyo_raijin', name: 'Kōmyō Raijin', ja: '光明雷神', isKomyo: true }
  ];

  denkiLineage.forEach(exp => {
    const c = CREATURES[exp.id];
    assert.ok(c, `Creature ${exp.id} must exist in bestiary`);
    assert.equal(c.branch, 'denki');
    assert.equal(c.stage, exp.stage);
    assert.equal(c.name, exp.name);
    assert.equal(c.jaName, exp.ja);
    if (exp.isKomyo) assert.equal(c.isKomyo, true);
  });
});

test('Chishiki Branch (Scholar) has complete creature lineage from Egg to Radiant Mythic', () => {
  const chishikiLineage = [
    { stage: 1, id: 'chishiki_tamago', name: 'Chishiki Tamago', ja: '知識卵' },
    { stage: 2, id: 'fukuro_ko', name: 'Fukurō-ko', ja: 'ふくろう子' },
    { stage: 3, id: 'owl_mage', name: 'Owl Mage', ja: 'オウルメイジ' },
    { stage: 4, id: 'hoshi_sphinx', name: 'Hoshi Sphinx', ja: '星スフィンクス' },
    { stage: 5, id: 'hoshi_no_kenja', name: 'Hoshi no Kenja', ja: '星の賢者' },
    { stage: 6, id: 'komyo_kenja', name: 'Kōmyō Kenja', ja: '光明賢者', isKomyo: true }
  ];

  chishikiLineage.forEach(exp => {
    const c = CREATURES[exp.id];
    assert.ok(c, `Creature ${exp.id} must exist in bestiary`);
    assert.equal(c.branch, 'chishiki');
    assert.equal(c.stage, exp.stage);
    assert.equal(c.name, exp.name);
    assert.equal(c.jaName, exp.ja);
    if (exp.isKomyo) assert.equal(c.isKomyo, true);
  });
});

test('Monogatari Branch (Story) has complete creature lineage from Egg to Radiant Mythic', () => {
  const monogatariLineage = [
    { stage: 1, id: 'yume_tamago', name: 'Yume Tamago', ja: '夢卵' },
    { stage: 2, id: 'hanabira_sprite', name: 'Hanabira Sprite', ja: '花びらスプライト' },
    { stage: 3, id: 'kotoba_kitsune', name: 'Kotoba Kitsune', ja: '言葉狐' },
    { stage: 4, id: 'hane_no_ryu', name: 'Hane no Ryū', ja: '羽の竜' },
    { stage: 5, id: 'monogatari_kitsune', name: 'Monogatari Kitsune', ja: '物語狐' },
    { stage: 6, id: 'komyo_kitsune', name: 'Kōmyō Kitsune', ja: '光明狐', isKomyo: true }
  ];

  monogatariLineage.forEach(exp => {
    const c = CREATURES[exp.id];
    assert.ok(c, `Creature ${exp.id} must exist in bestiary`);
    assert.equal(c.branch, 'monogatari');
    assert.equal(c.stage, exp.stage);
    assert.equal(c.name, exp.name);
    assert.equal(c.jaName, exp.ja);
    if (exp.isKomyo) assert.equal(c.isKomyo, true);
  });
});

test('Gūtara Branch (Slacker) has complete creature lineage from Sleepy Egg to Taida no Kami', () => {
  const gutaraLineage = [
    { stage: 1, id: 'nemu_tamago', name: 'Nemu Tamago', ja: 'ねむ卵' },
    { stage: 2, id: 'mochi_blob', name: 'Mochi Blob', ja: 'モチブロブ' },
    { stage: 3, id: 'gutara_slime', name: 'Gūtara Slime', ja: 'ぐうたらスライム' },
    { stage: 4, id: 'namakemono', name: 'Namakemono', ja: '怠け者' },
    { stage: 5, id: 'daradara_oni', name: 'Daradara Oni', ja: 'だらだら鬼' },
    { stage: 6, id: 'komyo_daradara', name: 'Taida no Kami', ja: '怠惰の神', isKomyo: true }
  ];

  gutaraLineage.forEach(exp => {
    const c = CREATURES[exp.id];
    assert.ok(c, `Creature ${exp.id} must exist in bestiary`);
    assert.equal(c.branch, 'gutara');
    assert.equal(c.stage, exp.stage);
    assert.equal(c.name, exp.name);
    assert.equal(c.jaName, exp.ja);
    if (exp.isKomyo) assert.equal(c.isKomyo, true);
  });
});
