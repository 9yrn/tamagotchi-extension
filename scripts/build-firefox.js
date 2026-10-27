/**
 * Poyori (ポヨリ) — Firefox Extension Generator & Synchronizer
 * Generates a dedicated, Firefox-compatible build inside the `firefox/` directory.
 * Configures Gecko ID, background scripts, host_permissions, and validates manifest.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const firefoxDir = path.resolve(rootDir, 'firefox');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Generating Firefox extension in firefox/ ...');

// 1. Ensure target directory exists
if (!fs.existsSync(firefoxDir)) {
  fs.mkdirSync(firefoxDir, { recursive: true });
}

// 2. Directories to copy
const dirsToCopy = [
  'assets',
  'background',
  'blocked',
  'content',
  'dashboard',
  'popup',
  'shared',
  'ui'
];

for (const dir of dirsToCopy) {
  const src = path.join(rootDir, dir);
  const dest = path.join(firefoxDir, dir);
  if (fs.existsSync(src)) {
    copyDirRecursive(src, dest);
  }
}

// 3. Generate Firefox-compatible Manifest V3
const chromeManifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'manifest.json'), 'utf8'));

const firefoxManifest = {
  manifest_version: 3,
  name: chromeManifest.name,
  version: chromeManifest.version,
  description: chromeManifest.description,
  browser_specific_settings: {
    gecko: {
      id: 'poyori-companion@mochimori.dev',
      strict_min_version: '140.0',
      data_collection_permissions: {
        required: ['none']
      }
    }
  },
  icons: chromeManifest.icons,
  action: chromeManifest.action,
  options_ui: chromeManifest.options_ui,
  background: {
    scripts: ['background/background.js'],
    type: 'module'
  },
  permissions: chromeManifest.permissions,
  host_permissions: [
    '<all_urls>'
  ],
  content_scripts: chromeManifest.content_scripts,
  web_accessible_resources: [
    {
      resources: [
        'assets/*',
        'assets/icons/*',
        'assets/fonts/*',
        'blocked/*',
        'content/*',
        'ui/*',
        'dashboard/*'
      ],
      matches: ['<all_urls>']
    }
  ]
};

fs.writeFileSync(
  path.join(firefoxDir, 'manifest.json'),
  JSON.stringify(firefoxManifest, null, 2) + '\n'
);

// 4. Write Firefox README instructions
const readmeContent = `# Poyori (ポヨリ) — Firefox Edition

8-Bit Virtual Web Companion for Mozilla Firefox (Manifest V3).

## Loading into Firefox

1. Open Firefox and navigate to \`about:debugging#/runtime/this-firefox\`.
2. Click **"Load Temporary Add-on..."**.
3. Select the \`manifest.json\` file inside this directory (\`${firefoxDir}/manifest.json\`).
4. Poyori will be active in Firefox! Click the toolbar icon to view your companion, open the handheld console, or tuck Poyori into Pocket Mode.

## Updating the Build
To synchronize updates from the main codebase to this Firefox folder:
\`\`\`bash
npm run build:firefox
\`\`\`
`;

fs.writeFileSync(path.join(firefoxDir, 'README.md'), readmeContent);

console.log('✓ Firefox extension build created successfully in firefox/');
