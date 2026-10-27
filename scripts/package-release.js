/**
 * Poyori (ポヨリ) — Release Packager
 * Builds and packages clean distribution zip files for both Chrome Web Store
 * and Mozilla Add-ons (Firefox AMO).
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const releaseDir = path.resolve(rootDir, 'release');

console.log('Packaging Poyori v2.0.0 for Release...');

// 1. Run fresh build
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
execSync('npm run build:firefox', { cwd: rootDir, stdio: 'inherit' });

// 2. Ensure release directory exists
if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

const chromeZip = path.join(releaseDir, 'poyori-v2.0.0-chrome.zip');
const firefoxZip = path.join(releaseDir, 'poyori-v2.0.0-firefox.zip');

// Remove older archives if present
if (fs.existsSync(chromeZip)) fs.unlinkSync(chromeZip);
if (fs.existsSync(firefoxZip)) fs.unlinkSync(firefoxZip);

// 3. Package Chrome extension (exclude tests, scripts, release, .git, etc.)
console.log('Creating Chrome release zip...');
execSync(
  `zip -r "${chromeZip}" manifest.json assets background blocked content dashboard popup shared ui -x "*.DS_Store*" "*__MACOSX*"`,
  { cwd: rootDir, stdio: 'inherit' }
);

// 4. Package Firefox extension
console.log('Creating Firefox release zip...');
execSync(
  `zip -r "${firefoxZip}" manifest.json README.md assets background blocked content dashboard popup shared ui -x "*.DS_Store*" "*__MACOSX*"`,
  { cwd: path.join(rootDir, 'firefox'), stdio: 'inherit' }
);

console.log('\n✓ Release packages ready:');
console.log(`  - Chrome Web Store: ${chromeZip} (${(fs.statSync(chromeZip).size / 1024).toFixed(1)} KB)`);
console.log(`  - Firefox AMO:      ${firefoxZip} (${(fs.statSync(firefoxZip).size / 1024).toFixed(1)} KB)`);
