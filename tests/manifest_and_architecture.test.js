/**
 * Test Suite: Manifest & Architecture Validation
 * Ensures Chrome Manifest V3 compliance, options page integration,
 * permissions, and required asset paths.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_STATE } from '../shared/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('manifest.json conforms to Manifest V3 specification', () => {
  const manifestPath = path.join(rootDir, 'manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert.equal(manifest.manifest_version, 3, 'Must be Manifest V3');
  assert.ok(manifest.name.includes('Poyori'), 'Name must include Poyori');
  assert.ok(manifest.version, 'Version must be specified');

  // Background Service Worker
  assert.equal(manifest.background.service_worker, 'background/background.js');
  assert.equal(manifest.background.type, 'module');

  // Options UI (Dashboard)
  assert.ok(manifest.options_ui, 'options_ui must be declared for Dashboard');
  assert.equal(manifest.options_ui.page, 'dashboard/dashboard.html');
  assert.equal(manifest.options_ui.open_in_tab, true);

  // Content Scripts
  assert.ok(Array.isArray(manifest.content_scripts));
  const cs = manifest.content_scripts[0];
  assert.ok(cs.matches.includes('<all_urls>'));
  assert.ok(cs.js.includes('content/content.bundle.js'), 'Must use bundled content script to avoid CSP blocks');

  // Required Permissions
  const requiredPerms = ['storage', 'alarms', 'idle', 'tabs'];
  requiredPerms.forEach(p => {
    assert.ok(manifest.permissions.includes(p), `Permission ${p} must be present`);
  });
});

test('All critical extension UI and asset files exist on disk', () => {
  const files = [
    'dashboard/dashboard.html',
    'dashboard/dashboard.css',
    'dashboard/dashboard.js',
    'popup/popup.html',
    'popup/popup.css',
    'popup/popup.js',
    'content/content.bundle.js',
    'background/background.js',
    'blocked/blocked.html',
    'blocked/blocked.css',
    'blocked/blocked.js',
    'dashboard/dev-portal.html',
    'dashboard/dev-portal.css',
    'dashboard/dev-portal.js',
    'assets/icons/icon16.png',
    'assets/icons/icon32.png',
    'assets/icons/icon48.png',
    'assets/icons/icon128.png'
  ];

  files.forEach(f => {
    const fullPath = path.join(rootDir, f);
    assert.ok(fs.existsSync(fullPath), `File ${f} must exist`);
  });
});

test('Extension icons conform to required square dimensions (16, 32, 48, 128)', () => {
  const iconSizes = [
    { file: 'assets/icons/icon16.png', expected: 16 },
    { file: 'assets/icons/icon32.png', expected: 32 },
    { file: 'assets/icons/icon48.png', expected: 48 },
    { file: 'assets/icons/icon128.png', expected: 128 }
  ];

  for (const { file, expected } of iconSizes) {
    const full = path.join(rootDir, file);
    const buf = fs.readFileSync(full);
    assert.equal(buf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${file} must be a valid PNG`);
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    assert.equal(width, expected, `${file} width must be ${expected}`);
    assert.equal(height, expected, `${file} height must be ${expected}`);
  }
});

test('Default state structure satisfies all game requirements', () => {
  assert.ok(DEFAULT_STATE.pet, 'pet object must exist');
  assert.equal(DEFAULT_STATE.pet.stage, 1, 'Initial stage must be 1 (Tamago)');
  assert.equal(DEFAULT_STATE.pet.creatureId, 'denki_tamago');
  assert.ok(DEFAULT_STATE.inventory, 'inventory object must exist');
  assert.ok(DEFAULT_STATE.stats, 'stats object must exist');
  assert.ok(DEFAULT_STATE.settings, 'settings object must exist');
  assert.ok(Array.isArray(DEFAULT_STATE.tasks), 'tasks list must exist');
  assert.ok(Array.isArray(DEFAULT_STATE.dailyQuests), 'dailyQuests list must exist');
});
