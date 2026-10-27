# Poyori (ポヨリ) — Firefox Edition

8-Bit Virtual Web Companion for Mozilla Firefox (Manifest V3).

## Loading into Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **"Load Temporary Add-on..."**.
3. Select the `manifest.json` file inside this directory (`/Users/earanhunukumbura/Documents/Projects/tamagotchi-extension/firefox/manifest.json`).
4. Poyori will be active in Firefox! Click the toolbar icon to view your companion, open the handheld console, or tuck Poyori into Pocket Mode.

## Updating the Build
To synchronize updates from the main codebase to this Firefox folder:
```bash
npm run build:firefox
```
