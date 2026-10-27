/**
 * Poyori (ポヨリ) — Standalone Dev Access Port Controller
 * Controls live extension state modification, creature morphing,
 * economy overrides, and celebratory fanfare previews.
 */

import { getState, saveState } from '../shared/storage.js';
import { CREATURES, STAGES, FOOD_ITEMS, ACCESSORIES, PALETTES, CREATURE_THEMES, DEFAULT_STATE } from '../shared/constants.js';
import { PoyoriEngine } from '../shared/game-engine.js';
import { getCreatureSprite } from '../content/sprites.js';
import { getPixelIconHtml, getPixelIconUrl } from '../shared/pixel-icons.js';
import { audioSynth } from '../ui/audio.js';
import { CelebrationModal } from '../ui/celebration-modal.js';

let state = null;
let celebrationModal = null;

function logDev(msg) {
  const logBox = document.getElementById('dev-console-log');
  if (!logBox) return;
  const line = document.createElement('div');
  line.className = 'dev-log-line';
  const time = new Date().toTimeString().slice(0, 8);
  line.textContent = `[${time}] ${msg}`;
  logBox.prepend(line);
}

async function initDevPortal() {
  // Gated Access Check: verify dev authorization
  const urlParams = new URLSearchParams(window.location.search);
  const isGestureAuth = urlParams.get('auth') === 'gesture' || window.location.hash === '#dev';

  if (isGestureAuth) {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('poyori_dev_auth', 'true');
    }
  } else if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('poyori_dev_auth') !== 'true') {
    const enteredKey = prompt('POYORI DEV ACCESS PORT // ENTER SECRET KEY:');
    if (enteredKey && PoyoriEngine.verifyDevKey(enteredKey)) {
      sessionStorage.setItem('poyori_dev_auth', 'true');
    } else {
      alert('Access Denied: Invalid Developer Key.');
      window.location.href = 'dashboard.html';
      return;
    }
  }

  state = await getState();

  // Snapshot original progress so all levels, Koban, and progress revert upon exit
  if (!state.devOriginalStateBackup) {
    PoyoriEngine.enterDevSandbox(state);
    await saveState(state);
    logDev('DEV SANDBOX ARMED: Original companion progress, levels & Koban safely snapshotted.');
  } else {
    logDev('DEV SANDBOX ACTIVE: Snapshot already stored. Progress will revert on exit.');
  }

  celebrationModal = new CelebrationModal(document.body);

  // Set up 9-bit pixel icons in cards
  document.getElementById('dev-icon-header').innerHTML = getPixelIconHtml('gear', 22);
  document.getElementById('icon-god-mode').innerHTML = getPixelIconHtml('star', 16);
  document.getElementById('icon-morpher').innerHTML = getPixelIconHtml('book_zukan', 16);
  document.getElementById('icon-economy').innerHTML = getPixelIconHtml('coin', 16);
  document.getElementById('icon-food').innerHTML = getPixelIconHtml('apple', 16);
  document.getElementById('icon-vitals').innerHTML = getPixelIconHtml('heart_full', 16);
  document.getElementById('icon-time').innerHTML = getPixelIconHtml('spark', 16);
  document.getElementById('icon-fanfare').innerHTML = getPixelIconHtml('crown', 16);
  document.getElementById('icon-security').innerHTML = getPixelIconHtml('shield_cross', 16);

  setupCreatureMorpher();
  setupEconomyControls();
  setupFoodControls();
  setupVitalsControls();
  setupTimeMachineControls();
  setupCelebrationTests();
  setupResetControls();

  updateDisplay();
  logDev('Connected to active companion state: ' + state.pet.name + ' (Stage ' + state.pet.stage + ')');
}

function updateDisplay() {
  if (!state) return;
  const pet = state.pet;
  const mood = PoyoriEngine.getPetMood(state);

  document.getElementById('lbl-current-koban').textContent = state.koban.toLocaleString();
  document.getElementById('lbl-pet-status').textContent = 
    `${pet.name} | Onaka: ${pet.onaka}% | Genki: ${pet.genki}% | Mood: ${mood.toUpperCase()}${pet.isSick ? ' | SICK' : ''}${pet.isSleeping ? ' | SLEEPING' : ''}`;
}

/**
 * 1. Creature Morpher setup
 */
function setupCreatureMorpher() {
  const select = document.getElementById('select-morph-creature');
  const previewImg = document.getElementById('morph-preview-img');
  const previewName = document.getElementById('morph-preview-name');
  const previewMeta = document.getElementById('morph-preview-meta');
  const morphBtn = document.getElementById('btn-morph-now');

  // Populate all 24 creatures
  select.innerHTML = Object.values(CREATURES).map(c => `
    <option value="${c.id}" ${state.pet.creatureId === c.id ? 'selected' : ''}>
      ${c.branch.toUpperCase()} | Stage ${c.stage}: ${c.name} (${c.jaName}) ${c.isKomyo ? '[KOMYO]' : ''}
    </option>
  `).join('');

  const updatePreview = () => {
    const selectedId = select.value;
    const c = CREATURES[selectedId];
    if (!c) return;

    previewImg.src = getCreatureSprite(c.id, 'idle1', state.pet.accessory);
    previewName.textContent = `${c.name} (${c.jaName})`;
    previewMeta.textContent = `${c.branch.toUpperCase()} BRANCH - Stage ${c.stage} ${c.isKomyo ? '- KOMYO MYTHIC' : ''}`;
  };

  select.addEventListener('change', updatePreview);
  updatePreview();

  morphBtn.addEventListener('click', async () => {
    const selectedId = select.value;
    const res = PoyoriEngine.morphPet(state, selectedId);
    if (res.success) {
      audioSynth.shinkaFanfare();
      await saveState(state);
      updateDisplay();
      logDev(`Morphed companion to: ${res.creature.name} (Stage ${res.creature.stage})`);
    }
  });

  // God Mode Button
  document.getElementById('btn-activate-godmode').addEventListener('click', async () => {
    PoyoriEngine.applyDevGodMode(state);
    audioSynth.shinkaFanfare();
    await saveState(state);
    updateDisplay();
    updatePreview();
    logDev('GOD MODE APPLIED: 99,999 Koban, 24 Creatures, All Foods, All Wardrobe, All Color Themes');

    if (celebrationModal) {
      celebrationModal.show({
        type: 'evolution',
        title: 'GOD MODE UNLOCKED!',
        subtitle: 'Dev Access Port // All Features Enabled',
        name: '99,999 Koban + All 24 Creatures Unlocked',
        badgeText: 'DEV GOD MODE',
        spriteUrl: getCreatureSprite(state.pet.creatureId, 'idle1', state.pet.accessory),
        desc: 'All features, accessories, foods, color themes, and evolutions are now accessible for testing.',
        actionLabel: 'Proceed with Tests!'
      });
    }
  });

  const btnUnlockThemes = document.getElementById('btn-unlock-all-themes');
  if (btnUnlockThemes) {
    btnUnlockThemes.addEventListener('click', async () => {
      state.pet = state.pet || {};
      state.pet.unlockedThemes = Object.keys(CREATURE_THEMES);
      if (Array.isArray(state.roster)) {
        state.roster.forEach(c => { c.unlockedThemes = Object.keys(CREATURE_THEMES); });
      }
      audioSynth.shinkaFanfare();
      await saveState(state);
      updateDisplay();
      logDev('Unlocked all 6 creature color theme palettes for active pet and roster!');
    });
  }
}

/**
 * 2. Economy Controls
 */
function setupEconomyControls() {
  document.getElementById('btn-add-1k-koban').addEventListener('click', async () => {
    state.koban += 1000;
    audioSynth.chirp();
    await saveState(state);
    updateDisplay();
    logDev('Added +1,000 Koban (Total: ' + state.koban + ')');
  });

  document.getElementById('btn-add-10k-koban').addEventListener('click', async () => {
    state.koban += 10000;
    audioSynth.chirp();
    await saveState(state);
    updateDisplay();
    logDev('Added +10,000 Koban (Total: ' + state.koban + ')');
  });

  document.getElementById('btn-set-99k-koban').addEventListener('click', async () => {
    state.koban = 99999;
    audioSynth.chirp();
    await saveState(state);
    updateDisplay();
    logDev('Set Koban to 99,999');
  });

  document.getElementById('btn-reset-koban').addEventListener('click', async () => {
    state.koban = 0;
    audioSynth.boop();
    await saveState(state);
    updateDisplay();
    logDev('Reset Koban to 0');
  });
}

/**
 * 3. Food Inventory Controls
 */
function setupFoodControls() {
  const addFood = async (id, count) => {
    state.inventory = state.inventory || {};
    state.inventory[id] = (state.inventory[id] || 0) + count;
    audioSynth.munch();
    await saveState(state);
    logDev(`Added +${count} ${id} (Total: ${state.inventory[id]})`);
  };

  document.getElementById('btn-fill-all-food').addEventListener('click', async () => {
    Object.keys(FOOD_ITEMS).forEach(k => {
      state.inventory[k] = (state.inventory[k] || 0) + 50;
    });
    audioSynth.munch();
    await saveState(state);
    logDev('Added +50 to all food items');
  });

  document.getElementById('btn-add-ringo').addEventListener('click', () => addFood('ringo', 10));
  document.getElementById('btn-add-nikuman').addEventListener('click', () => addFood('nikuman', 10));
  document.getElementById('btn-add-senbei').addEventListener('click', () => addFood('senbei', 10));
  document.getElementById('btn-add-matcha').addEventListener('click', () => addFood('matcha', 10));
  document.getElementById('btn-add-kin-ringo').addEventListener('click', () => addFood('kin_ringo', 10));
  document.getElementById('btn-add-yakuso').addEventListener('click', () => addFood('yakuso', 10));

  document.getElementById('btn-clear-food').addEventListener('click', async () => {
    Object.keys(FOOD_ITEMS).forEach(k => {
      state.inventory[k] = 0;
    });
    audioSynth.boop();
    await saveState(state);
    logDev('Cleared all food items from inventory');
  });
}

/**
 * 4. Vitals & Mood Controls
 */
function setupVitalsControls() {
  document.getElementById('btn-vitals-max').addEventListener('click', async () => {
    PoyoriEngine.setDevVitals(state, { onaka: 100, genki: 100, kizuna: 100, isSick: false, isSleeping: false });
    audioSynth.chirp();
    await saveState(state);
    updateDisplay();
    logDev('Vitals maxed to 100% (Cheerful, healthy)');
  });

  document.getElementById('btn-vitals-starve').addEventListener('click', async () => {
    PoyoriEngine.setDevVitals(state, { onaka: 0, isSick: true });
    audioSynth.boop();
    await saveState(state);
    updateDisplay();
    logDev('Hunger dropped to 0% (Starvation & Sick)');
  });

  document.getElementById('btn-vitals-exhaust').addEventListener('click', async () => {
    PoyoriEngine.setDevVitals(state, { genki: 0, isSleeping: true });
    audioSynth.snore();
    await saveState(state);
    updateDisplay();
    logDev('Energy dropped to 0% (Exhaustion & Sleeping)');
  });

  document.getElementById('btn-toggle-sick').addEventListener('click', async () => {
    state.pet.isSick = !state.pet.isSick;
    state.pet.mood = PoyoriEngine.getPetMood(state);
    audioSynth.boop();
    await saveState(state);
    updateDisplay();
    logDev('Pet sickness toggled: ' + state.pet.isSick);
  });

  document.getElementById('btn-toggle-sleep').addEventListener('click', async () => {
    state.pet.isSleeping = !state.pet.isSleeping;
    if (state.pet.isSleeping) audioSynth.snore();
    else audioSynth.chirp();
    await saveState(state);
    updateDisplay();
    logDev('Pet sleep state toggled: ' + state.pet.isSleeping);
  });
}

/**
 * 5. Time Machine & Streak Simulator
 */
function setupTimeMachineControls() {
  document.getElementById('btn-advance-1day-streak').addEventListener('click', async () => {
    state.stats.currentStreak = (state.stats.currentStreak || 1) + 1;
    state.stats.bestStreak = Math.max(state.stats.bestStreak || 1, state.stats.currentStreak);
    audioSynth.chirp();
    await saveState(state);
    updateDisplay();
    logDev('Streak advanced by +1 day (Current: ' + state.stats.currentStreak + ')');
  });

  document.getElementById('btn-advance-7day-streak').addEventListener('click', async () => {
    state.stats.currentStreak = Math.max((state.stats.currentStreak || 1) + 7, 7);
    state.stats.bestStreak = Math.max(state.stats.bestStreak || 1, state.stats.currentStreak);
    audioSynth.shinkaFanfare();
    await saveState(state);
    updateDisplay();
    logDev('Streak advanced to 7+ days (Komyo Ascension Unlocked!)');
  });

  document.getElementById('btn-simulate-12h-neglect').addEventListener('click', async () => {
    PoyoriEngine.simulateDevTimeDelta(state, 12);
    audioSynth.boop();
    await saveState(state);
    updateDisplay();
    logDev('Simulated 12 hours of neglect (Mood set to GRUMPY)');
  });

  document.getElementById('btn-simulate-48h-neglect').addEventListener('click', async () => {
    PoyoriEngine.simulateDevTimeDelta(state, 48);
    audioSynth.boop();
    await saveState(state);
    updateDisplay();
    logDev('Simulated 48 hours of neglect (Severe neglect)');
  });

  document.getElementById('btn-add-100xp').addEventListener('click', async () => {
    state.pet.xp += 100;
    audioSynth.chirp();
    await saveState(state);
    logDev('Added +100 Study XP (Total: ' + state.pet.xp + ')');
  });

  document.getElementById('btn-add-500xp').addEventListener('click', async () => {
    state.pet.xp += 500;
    audioSynth.shinkaFanfare();
    await saveState(state);
    logDev('Added +500 Study XP (Total: ' + state.pet.xp + ')');
  });
}

/**
 * 6. Celebratory Fanfare Previews
 */
function setupCelebrationTests() {
  document.getElementById('btn-test-fanfare-cosmetic').addEventListener('click', () => {
    if (!celebrationModal) return;
    const acc = ACCESSORIES.golden_crown;
    celebrationModal.show({
      type: 'cosmetic',
      title: 'NEW COSMETIC UNLOCKED!',
      subtitle: 'Omedetou! Rare Wardrobe Unlocked!',
      name: `${acc.name} (${acc.jaName})`,
      badgeText: 'SHOP TREASURE',
      spriteUrl: getPixelIconUrl(acc.iconKey),
      description: 'You saved 1,200 Koban to acquire this exquisite accessory! Wear it on your focus journeys.',
      cost: 1200,
      actionLabel: 'Equip Now!',
      onAction: () => { logDev('Test Equip callback executed'); }
    });
    logDev('Triggered Cosmetic Unlock Fanfare Modal');
  });

  document.getElementById('btn-test-fanfare-hatch').addEventListener('click', () => {
    if (!celebrationModal) return;
    celebrationModal.show({
      type: 'hatch',
      title: 'EGG HATCHED!',
      subtitle: 'Umare (Hatchling) - A New Life Begins!',
      name: 'Pikoneko (Piko Cat)',
      badgeText: 'STAGE 2 - DENKI',
      spriteUrl: getCreatureSprite('pikoneko', 'idle1'),
      description: 'A tiny pixel-inspired kitten with glowing eyes and an electronic tail.',
      actionLabel: 'Awesome!'
    });
    logDev('Triggered Egg Hatching Fanfare Modal');
  });

  document.getElementById('btn-test-fanfare-shinka').addEventListener('click', () => {
    if (!celebrationModal) return;
    celebrationModal.show({
      type: 'evolution',
      title: 'EVOLUTION UNLOCKED!',
      subtitle: 'Shinju Shinka - Divine Evolution!',
      name: 'Raijin Drake (Thunder Dragon)',
      badgeText: 'STAGE 5 - DENKI',
      spriteUrl: getCreatureSprite('raijin_drake', 'idle1'),
      description: 'A mechanical thunder dragon powered by lightning and deep work focus.',
      actionLabel: 'Awesome!'
    });
    logDev('Triggered Evolution Fanfare Modal');
  });

  document.getElementById('btn-test-fanfare-komyo').addEventListener('click', () => {
    if (!celebrationModal) return;
    celebrationModal.show({
      type: 'evolution',
      title: 'MYTHIC ASCENSION!',
      subtitle: 'Komyo Shinka - 7-Day Streak Radiant Form!',
      name: 'Komyo Raijin (Radiant Thunder Deity)',
      badgeText: 'STAGE 6 - MYTHIC',
      spriteUrl: getCreatureSprite('komyo_raijin', 'idle1'),
      description: 'Surrounded by golden electricity, luminous wings, and floating digital runes.',
      actionLabel: 'Praise the Deity!'
    });
    logDev('Triggered Mythic Komyo Ascension Fanfare Modal');
  });
}

/**
 * 7. Factory Reset & Security
 */
function setupResetControls() {
  document.getElementById('btn-factory-reset').addEventListener('click', async () => {
    if (confirm('Reset companion back to clean player starting conditions (Stage 1 Egg, 10 Koban)?')) {
      state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      await saveState(state);
      updateDisplay();
      logDev('COMPANION RESET: Returned to default pristine player state');
    }
  });

  async function revertAndExit() {
    logDev('Reverting dev state back to original player progress...');
    const res = PoyoriEngine.exitDevSandbox(state);
    if (res.restored) {
      await saveState(state);
      logDev('PROGRESS REVERTED: Original levels, creature, and Koban restored.');
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('poyori_dev_auth');
      sessionStorage.removeItem('poyori_dev_unlocked');
    }
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 400);
  }

  const exitLink = document.getElementById('dev-exit-link');
  if (exitLink) {
    exitLink.addEventListener('click', (e) => {
      e.preventDefault();
      revertAndExit();
    });
  }

  const revertBtn = document.getElementById('btn-revert-original');
  if (revertBtn) {
    revertBtn.addEventListener('click', async () => {
      if (confirm('Revert all dev changes now and restore original companion levels, Koban & progress?')) {
        const res = PoyoriEngine.exitDevSandbox(state);
        if (res.restored) {
          PoyoriEngine.enterDevSandbox(state); // Re-arm snapshot in case user continues testing
          await saveState(state);
          updateDisplay();
          logDev('RESTORED: Companion reverted to original save progress.');
          alert('Companion progress, levels, and Koban reverted to your original state!');
        } else {
          alert('No original backup snapshot was found.');
        }
      }
    });
  }

  document.getElementById('btn-lock-dev-mode').addEventListener('click', () => {
    revertAndExit();
  });
}

document.addEventListener('DOMContentLoaded', initDevPortal);
