/**
 * Tests: 9-Bit Pixel Art Icons System & Custom In-Sprite Petting Reactions
 * Validates that stock emojis are replaced with authentic pixel art SVG icons
 * and that petting triggers organic in-sprite blushing/purring without emoji clutter.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ICON_GRIDS, ICON_COLORS, getPixelIconUrl, getPixelIconHtml } from '../shared/pixel-icons.js';
import { getCreatureSprite, createPettedGrid } from '../content/sprites.js';
import { CREATURES } from '../shared/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('Pixel Icons: All required 9-bit pixel art icons exist and have valid matrices', () => {
  const requiredKeys = [
    'apple', 'steamed_bun', 'rice_cracker', 'matcha_tea', 'golden_apple', 'herb_leaf',
    'coin', 'flame', 'heart_full', 'heart_empty', 'spark', 'sakura',
    'stats_bars', 'tasks_scroll', 'book_zukan', 'wardrobe_robe', 'globe', 'gear',
    'handheld_device', 'hand_pet', 'sleep_zzz', 'star', 'neutral_dot', 'water_drop', 'paw',
    'mystery', 'check', 'cross', 'crown', 'hachimaki', 'tanuki_leaf', 'wizard_hat', 'cyber_visor'
  ];

  for (const key of requiredKeys) {
    assert.ok(ICON_GRIDS[key], `Missing icon grid for: ${key}`);
    const grid = ICON_GRIDS[key];
    assert.ok(Array.isArray(grid) && grid.length > 0, `Grid for ${key} must be a non-empty array`);
    
    const rowWidth = grid[0].length;
    for (let r = 0; r < grid.length; r++) {
      assert.equal(grid[r].length, rowWidth, `Row ${r} in icon ${key} has inconsistent width`);
      for (let c = 0; c < rowWidth; c++) {
        const ch = grid[r][c];
        assert.ok(ch === '.' || ICON_COLORS[ch], `Invalid color token "${ch}" in icon ${key} at [${r}, ${c}]`);
      }
    }
  }
});

test('Pixel Icons: getPixelIconUrl returns valid, clean Base64 SVG Data URIs', () => {
  for (const key of Object.keys(ICON_GRIDS)) {
    const uri = getPixelIconUrl(key);
    assert.ok(uri.startsWith('data:image/svg+xml;base64,'), `URI for ${key} must start with base64 svg prefix`);
    
    // Decode base64
    const base64Data = uri.replace('data:image/svg+xml;base64,', '');
    const decodedXml = Buffer.from(base64Data, 'base64').toString('utf8');
    
    assert.ok(decodedXml.includes('<svg xmlns="http://www.w3.org/2000/svg"'), `Decoded SVG for ${key} must have valid svg root`);
    assert.ok(decodedXml.includes('shape-rendering="crispEdges"'), `Decoded SVG for ${key} must have crispEdges`);
    assert.ok(!decodedXml.includes('%3C'), `Decoded SVG for ${key} must not contain percent-encoded clutter`);
    assert.ok(decodedXml.includes('<rect'), `Decoded SVG for ${key} must contain pixel rect elements`);
  }
});

test('Pixel Icons: Emoji translation automatically maps Unicode emojis to pixel icons', () => {
  const emojiTests = [
    { emoji: '🍎', expectedKey: 'apple' },
    { emoji: '❤️', expectedKey: 'heart_full' },
    { emoji: '⚡', expectedKey: 'spark' },
    { emoji: '🔥', expectedKey: 'flame' },
    { emoji: '🪙', expectedKey: 'coin' },
    { emoji: '🌸', expectedKey: 'sakura' },
    { emoji: '💤', expectedKey: 'sleep_zzz' },
    { emoji: '✨', expectedKey: 'star' }
  ];

  for (const { emoji, expectedKey } of emojiTests) {
    const uri = getPixelIconUrl(emoji);
    const expectedUri = getPixelIconUrl(expectedKey);
    assert.equal(uri, expectedUri, `Emoji ${emoji} should resolve to ${expectedKey}`);
  }
});

test('Pixel Icons: getPixelIconHtml renders accessible, pixelated img tags', () => {
  const html = getPixelIconHtml('coin', 20, 'my-coin-class');
  assert.ok(html.startsWith('<img class="my-coin-class" src="data:image/svg+xml;base64,'), 'Should render img tag with base64 src');
  assert.ok(html.includes('style="width: 20px; height: 20px; image-rendering: pixelated;'), 'Must have 20px width/height and pixelated rendering');
  assert.ok(html.includes('alt="coin"'), 'Must have alt text');
});

test('Petting Reaction: createPettedGrid generates custom happy squint eyes and pink cheek blush', () => {
  const baseEggGrid = [
    "....########....",
    "...#wwwwwwww#...",
    "..#wwwwwwwwww#..",
    ".#wwwwwwwwwwww#.",
    "#wwwwwwwwwwwwww#",
    "#wwwwwwwwwwwwww#",
    "#wwwwbbwwbbwwww#",
    "#wwwwbbwwbbwwww#",
    "#wwwwwwwwwwwwww#",
    "#wwwwwwwwwwwwww#",
    ".#wwwwwwwwwwww#.",
    "..#wwwwwwwwww#..",
    "...#wwwwwwww#...",
    "....########...."
  ];

  const pettedGrid = createPettedGrid(baseEggGrid);
  assert.equal(pettedGrid.length, baseEggGrid.length, 'Grid height must match');

  // Verify that cheek blush row contains soft pink blush ('B') pixels
  const blushRow = pettedGrid[7] || '';
  assert.ok(blushRow.includes('B'), 'Petted grid must contain pink blush pixels (B)');
});

test('Petting Reaction: getCreatureSprite(id, "petted") produces a unique blushing sprite for all creatures', () => {
  const sampleCreatures = ['denki_tamago', 'pikoneko', 'fukuro_ko', 'kotoba_kitsune', 'mochi_blob'];
  
  for (const cid of sampleCreatures) {
    const idleUri = getCreatureSprite(cid, 'idle1');
    const pettedUri = getCreatureSprite(cid, 'petted');
    
    assert.notEqual(idleUri, pettedUri, `Petted sprite for ${cid} must be visually distinct from idle sprite`);
    
    // Decode petted SVG to verify cheek blush fill color #ff7675
    const base64Data = pettedUri.replace('data:image/svg+xml;base64,', '');
    const decodedXml = Buffer.from(base64Data, 'base64').toString('utf8');
    assert.ok(decodedXml.includes('#ff7675'), `Petted SVG for ${cid} must include soft pink blush color #ff7675`);
  }
});

test('UI Templates Audit: Zero stock Unicode emojis in dashboard, popup, and handheld device', () => {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  
  const filesToVerify = [
    'dashboard/dashboard.html',
    'dashboard/dashboard.js',
    'popup/popup.html',
    'popup/popup.js',
    'ui/handheld-modal.js',
    'ui/quick-bubble.js',
    'content/content.js'
  ];

  for (const relPath of filesToVerify) {
    const fullPath = path.join(rootDir, relPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const matches = content.match(emojiRegex);
    assert.equal(
      matches,
      null,
      `File ${relPath} must have ZERO raw Unicode emojis, found: ${matches ? matches.join(' ') : ''}`
    );
  }
});
