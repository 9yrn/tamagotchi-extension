/**
 * Poyori (ポヨリ) — Mochimori Dashboard & Preferences Controller
 * Manages all dashboard tabs, interactive settings, bestiary matrix,
 * task management, and domain tracking.
 */

import { getState, saveState, subscribeState } from '../shared/storage.js';
import { CREATURES, STAGES, FOOD_ITEMS, ACCESSORIES, PALETTES, DOMAIN_PRESETS, getTerm, DEFAULT_STATE } from '../shared/constants.js';
import { PoyoriEngine } from '../shared/game-engine.js';
import { getCreatureSprite } from '../content/sprites.js';
import { audioSynth } from '../ui/audio.js';
import { getPixelIconHtml } from '../shared/pixel-icons.js';
import { CelebrationModal } from '../ui/celebration-modal.js';
import { TutorialModal } from '../ui/tutorial-modal.js';

let state = null;
let activeBranchFilter = 'all';
let celebrationModal = null;
let tutorialModal = null;
let dashFocusInterval = null;

/**
 * Initialize dashboard upon DOM ready
 */
async function initDashboard() {
  state = await getState();

  // If focus session is active, reconcile elapsed seconds since lastTickAt
  if (state.focusSession && state.focusSession.isActive) {
    const now = Date.now();
    const lastTick = state.focusSession.lastTickAt || state.focusSession.startTime || now;
    const elapsedSecs = Math.floor((now - lastTick) / 1000);
    if (elapsedSecs > 0) {
      state.focusSession.remainingSeconds = Math.max(0, state.focusSession.remainingSeconds - elapsedSecs);
      state.focusSession.lastTickAt = now;
      if (state.focusSession.remainingSeconds <= 0) {
        PoyoriEngine.completeFocusSession(state);
      }
      await saveState(state);
    }
  }

  // Initialize celebration & tutorial modals
  celebrationModal = new CelebrationModal(document.body);
  tutorialModal = new TutorialModal(document.body, {
    state,
    onFinish: async () => {
      await saveState(state);
      renderAll();
    }
  });

  // Check if initial onboarding tutorial needs to be shown
  if (state.settings && state.settings.tutorialCompleted === false) {
    tutorialModal.show({ state });
  }

  // Initialize audio volume and mute settings
  if (state.settings) {
    audioSynth.setVolume(state.settings.soundVolume);
    audioSynth.setMuted(state.settings.soundMuted);
  }

  // Bind sidebar navigation tabs
  setupNavigation();

  // Initial render of all views
  renderAll();

  // Bind actions across tabs
  setupOverviewActions();
  setupTaskActions();
  setupWebsiteActions();
  setupSettingsActions();
  setupDevAccess();
}

/**
 * Set up sidebar tab switching
 */
function setupNavigation() {
  // Populate navigation icons with 9-bit pixel art
  document.getElementById('nav-icon-overview').innerHTML = getPixelIconHtml('stats_bars', 16);
  document.getElementById('nav-icon-bestiary').innerHTML = getPixelIconHtml('book_zukan', 16);
  document.getElementById('nav-icon-tasks').innerHTML = getPixelIconHtml('tasks_scroll', 16);
  document.getElementById('nav-icon-wardrobe').innerHTML = getPixelIconHtml('wardrobe_robe', 16);
  document.getElementById('nav-icon-websites').innerHTML = getPixelIconHtml('globe', 16);
  document.getElementById('nav-icon-settings').innerHTML = getPixelIconHtml('gear', 16);

  const devIconEl = document.getElementById('nav-icon-devport');
  if (devIconEl) devIconEl.innerHTML = getPixelIconHtml('gear', 16);

  const navBtns = document.querySelectorAll('.nav-btn');
  const panes = document.querySelectorAll('.tab-pane');
  const heading = document.getElementById('page-heading');
  const subheading = document.getElementById('page-subheading');

  const titles = {
    overview: { h: 'Pet Overview', sub: 'Monitor your virtual companion\'s vitals, stage, and happiness.' },
    bestiary: { h: 'Mochimori Zukan (図鑑)', sub: 'Explore discovered creatures, evolution paths, and Kōmyō forms.' },
    tasks: { h: 'Tasks & Trials (Shiren)', sub: 'Complete your own daily to-dos to earn food items and pixel coins.' },
    wardrobe: { h: 'Wardrobe & Shop (Kisekae)', sub: 'Customize Poyori with pixel accessories and retro LCD palettes.' },
    websites: { h: 'Website Tracking & Rules', sub: 'Classify educational study domains and distracting time sinks.' },
    settings: { h: 'Preferences & Game Rules', sub: 'Customize language, consequence modes, sound, and sleep schedules.' },
    devport: { h: 'Dev Access Port // 神獣デバッグ', sub: 'God Mode, 24-Creature Morpher, Unlimited Koban & Sandbox Controls.' }
  };

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      navBtns.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(`tab-${tabId}`);
      if (targetPane) targetPane.classList.add('active');

      if (titles[tabId]) {
        heading.textContent = titles[tabId].h;
        subheading.textContent = titles[tabId].sub;
      }

      audioSynth.boop();
    });
  });
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function applyFontSizeClass(fontSize) {
  document.documentElement.classList.remove('font-size-normal', 'font-size-large', 'font-size-huge');
  document.documentElement.classList.add(`font-size-${fontSize || 'normal'}`);
}

/**
 * Master render function that refreshes all dashboard sections
 */
function renderAll() {
  applyFontSizeClass(state.settings?.fontSize || 'normal');
  renderSidebar();
  renderOverview();
  renderBestiary();
  renderTasks();
  renderWardrobe();
  renderMarket();
  renderWebsites();
  renderSettings();
}

/**
 * Renders sidebar metadata
 */
function renderSidebar() {
  const pet = state.pet;
  const brandImg = document.getElementById('brand-sprite');
  const isPetted = Date.now() - (pet.lastPettedAt || 0) < 2500;
  brandImg.src = getCreatureSprite(pet.creatureId, isPetted ? 'petted' : 'idle1', pet.accessory);

  document.getElementById('sidebar-coin-label').innerHTML = `${getPixelIconHtml('coin', 14)} Koban:`;
  document.getElementById('sidebar-streak-label').innerHTML = `${getPixelIconHtml('flame', 14)} Streak:`;

  document.getElementById('sidebar-coins').textContent = state.koban || 0;
  document.getElementById('sidebar-streak').textContent = `${state.stats.currentStreak} Days`;

  const isHardcore = state.settings?.consequenceMode === 'hardcore';
  const modeLabel = document.getElementById('sidebar-mode-label');
  if (modeLabel) {
    modeLabel.textContent = isHardcore ? '[HARDCORE MODE]' : '[COZY MODE]';
    modeLabel.style.color = isHardcore ? '#ff7675' : 'var(--accent-cyan)';
  }
}

let selectedOverviewRosterIndex = 0;

/**
 * Renders Pet Overview tab with Companion Carousel & 3D Flippable Card
 */
function renderOverview() {
  const roster = (Array.isArray(state.roster) && state.roster.length > 0)
    ? state.roster
    : [{
        creatureId: state.pet.creatureId,
        name: state.pet.name,
        stage: state.pet.stage || 1,
        level: state.pet.level || 1,
        xp: state.pet.xp || 0,
        theme: state.pet.theme || 'classic_default'
      }];

  if (selectedOverviewRosterIndex >= roster.length) {
    selectedOverviewRosterIndex = 0;
  }

  const activeRosterIdx = state.activeRosterIndex || 0;
  const isSelectedActive = selectedOverviewRosterIndex === activeRosterIdx;
  const currentCompanion = roster[selectedOverviewRosterIndex] || roster[0];
  const pet = isSelectedActive ? state.pet : currentCompanion;

  const creature = CREATURES[pet.creatureId] || CREATURES.coding_tamago || CREATURES.denki_tamago;
  const stageMeta = STAGES[(pet.stage || 1) - 1] || STAGES[0];
  const mode = state.settings.languageMode || 'bilingual';

  // Render Companion Carousel Shelf
  const shelfCount = document.getElementById('dash-roster-count');
  if (shelfCount) {
    shelfCount.textContent = `${roster.length} Companion${roster.length > 1 ? 's' : ''}`;
  }

  const carouselTabs = document.getElementById('companion-tabs-row');
  if (carouselTabs) {
    carouselTabs.innerHTML = roster.map((comp, idx) => {
      const isSel = idx === selectedOverviewRosterIndex;
      const isAct = idx === activeRosterIdx;
      return `
        <button class="companion-tab-btn ${isSel ? 'active' : ''}" data-index="${idx}">
          ${isAct ? '<span class="tab-dot" title="Active Roaming Companion"></span>' : ''}
          <span>${escapeHtml(comp.name) || 'Companion'}</span>
          <span style="opacity: 0.7; font-size: 7px;">Lv. ${comp.level || 1}</span>
          ${isAct ? '<span style="color: var(--c-emerald); font-size: 7px;">[Active]</span>' : ''}
        </button>
      `;
    }).join('');

    carouselTabs.querySelectorAll('.companion-tab-btn').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.index);
        selectedOverviewRosterIndex = idx;
        audioSynth.chirp();
        renderOverview();
      };
    });
  }

  // Populate action button icons
  const careFeedIcon = document.getElementById('care-icon-feed');
  if (careFeedIcon) careFeedIcon.innerHTML = getPixelIconHtml('apple', 14);
  const carePetIcon = document.getElementById('care-icon-pet');
  if (carePetIcon) carePetIcon.innerHTML = getPixelIconHtml('hand_pet', 14);
  const careSleepIcon = document.getElementById('care-icon-sleep');
  if (careSleepIcon) careSleepIcon.innerHTML = getPixelIconHtml('sleep_zzz', 14);

  // Populate vital icons
  const vitalOnaka = document.getElementById('vital-icon-onaka');
  if (vitalOnaka) vitalOnaka.innerHTML = getPixelIconHtml('heart_full', 14);
  const vitalGenki = document.getElementById('vital-icon-genki');
  if (vitalGenki) vitalGenki.innerHTML = getPixelIconHtml('spark', 14);
  const vitalKizuna = document.getElementById('vital-icon-kizuna');
  if (vitalKizuna) vitalKizuna.innerHTML = getPixelIconHtml('sakura', 14);
  const vitalXp = document.getElementById('vital-icon-xp');
  if (vitalXp) vitalXp.innerHTML = getPixelIconHtml('star', 14);

  // Screen header & body
  const nameEl = document.getElementById('pet-display-name');
  if (nameEl) {
    const genderIcon = getPixelIconHtml(pet.gender === 'male' ? 'gender_male' : 'gender_female', 12);
    nameEl.innerHTML = `${escapeHtml(pet.name)} ${genderIcon} ${pet.isKomyo ? getPixelIconHtml('star', 12) : ''}`;
  }


  const dashRenameBtn = document.getElementById('dash-rename-btn');
  if (dashRenameBtn) {
    dashRenameBtn.onclick = async () => {
      const curName = pet.name || 'Poyori';
      const newName = window.prompt('Enter a custom name for your companion (1-20 characters):', curName);
      if (newName && newName.trim()) {
        const trimmed = newName.trim();
        if (isSelectedActive) {
          PoyoriEngine.setPetCustomName(state, trimmed);
        } else {
          currentCompanion.name = trimmed;
        }
        await saveState(state);
        renderAll();
      }
    };
  }

  const branchEl = document.getElementById('pet-display-branch');
  if (branchEl) {
    branchEl.textContent = (creature.branch || state.pet.chosenBranch || 'coding').toUpperCase();
  }

  const lvlEl = document.getElementById('pet-display-level');
  if (lvlEl) lvlEl.textContent = `Lv. ${pet.level || 1}`;

  const isHardcore = state.settings?.consequenceMode === 'hardcore';
  const petModeEl = document.getElementById('pet-display-mode');
  if (petModeEl) {
    petModeEl.textContent = isHardcore ? '[HARDCORE]' : '[COZY]';
    petModeEl.style.color = isHardcore ? '#ff7675' : '#45b7b8';
    petModeEl.style.borderColor = isHardcore ? '#ff7675' : '#45b7b8';
  }

  const currentMood = isSelectedActive ? PoyoriEngine.getPetMood(state) : 'cheerful';
  const isPetted = isSelectedActive && (Date.now() - (state.pet.lastPettedAt || 0) < 2500);
  let action = 'idle1';
  if (isPetted) action = 'petted';
  else if (isSelectedActive && state.pet.isSleeping) action = 'sleep';
  else if (currentMood === 'grumpy') action = 'grumpy';

  const spriteImg = document.getElementById('overview-pet-img');
  if (spriteImg) {
    spriteImg.src = getCreatureSprite(pet.creatureId, action, isSelectedActive ? state.pet.accessory : 'none', pet.theme || 'classic_default');
    const px = state.settings?.petSizePx || 64;
    spriteImg.style.width = `${px}px`;
    spriteImg.style.height = `${px}px`;
  }

  const stageTitleEl = document.getElementById('overview-stage-title');
  if (stageTitleEl) {
    stageTitleEl.textContent = `${getTerm(stageMeta.termKey, mode)} — ${creature.name}`;
  }

  let moodDesc = getTerm('moodCheerful', mode) || 'Cheerful & Healthy';
  if (isSelectedActive && state.pet.isSleeping) moodDesc = `${getTerm('moodSleepy', mode)} (Recovering Energy)`;
  else if (isSelectedActive && state.pet.isSick) moodDesc = `${getTerm('moodSick', mode)} (Needs Care / Medicine)`;
  else if (currentMood === 'grumpy') moodDesc = `${getTerm('moodGrumpy', mode)} (Neglected / Pouting)`;
  else if (!isSelectedActive) moodDesc = `Resting in Roster (Lv. ${pet.level || 1})`;
  const moodEl = document.getElementById('overview-mood-txt');
  if (moodEl) moodEl.textContent = moodDesc;

  // Active roaming status & switcher button
  const activeBadge = document.getElementById('companion-active-badge');
  const setActiveBtn = document.getElementById('btn-set-active-companion');
  if (activeBadge && setActiveBtn) {
    if (isSelectedActive) {
      activeBadge.style.display = 'inline-block';
      setActiveBtn.style.display = 'none';
    } else {
      activeBadge.style.display = 'none';
      setActiveBtn.style.display = 'inline-block';
      setActiveBtn.onclick = async () => {
        PoyoriEngine.switchActivePet(state, selectedOverviewRosterIndex);
        audioSynth.shinkaFanfare();
        await saveState(state);
        renderAll();
      };
    }
  }

  // 3D Flippable Card Information (i) and Flip-Back Button Setup
  const infoBtn = document.getElementById('btn-pet-info');
  const flipBackBtn = document.getElementById('btn-pet-flip-back');
  const flipperInner = document.getElementById('pet-card-3d-inner');

  if (infoBtn && flipperInner) {
    infoBtn.onclick = (e) => {
      e.stopPropagation();
      flipperInner.classList.toggle('is-flipped');
      audioSynth.chirp();
    };
  }

  if (flipBackBtn && flipperInner) {
    flipBackBtn.onclick = (e) => {
      e.stopPropagation();
      flipperInner.classList.remove('is-flipped');
      audioSynth.boop();
    };
  }

  // Back Face Header
  const backTitle = document.getElementById('back-vitals-title');
  if (backTitle) backTitle.textContent = `${pet.name}'s Vitals`;
  const backSubtitle = document.getElementById('back-companion-subtitle');
  if (backSubtitle) backSubtitle.textContent = `${creature.name} • Stage ${pet.stage || 1} • Lv. ${pet.level || 1}`;

  // Vitals meters
  const onakaVal = isSelectedActive ? state.pet.onaka : (pet.onaka ?? 80);
  const genkiVal = isSelectedActive ? state.pet.genki : (pet.genki ?? 100);
  const kizunaVal = isSelectedActive ? state.pet.kizuna : (pet.kizuna ?? 20);
  const xpVal = isSelectedActive ? state.pet.xp : (pet.xp ?? 0);
  const maxXp = stageMeta.minXp || 100;

  const txtOnaka = document.getElementById('txt-onaka');
  if (txtOnaka) txtOnaka.textContent = `${onakaVal}%`;
  const meterOnaka = document.getElementById('meter-onaka');
  if (meterOnaka) meterOnaka.style.width = `${onakaVal}%`;

  const txtGenki = document.getElementById('txt-genki');
  if (txtGenki) txtGenki.textContent = `${genkiVal}%`;
  const meterGenki = document.getElementById('meter-genki');
  if (meterGenki) meterGenki.style.width = `${genkiVal}%`;

  const txtKizuna = document.getElementById('txt-kizuna');
  if (txtKizuna) txtKizuna.textContent = `${kizunaVal}%`;
  const meterKizuna = document.getElementById('meter-kizuna');
  if (meterKizuna) meterKizuna.style.width = `${kizunaVal}%`;

  const txtXp = document.getElementById('txt-xp');
  if (txtXp) txtXp.textContent = `${xpVal} / ${maxXp} XP`;
  const meterXp = document.getElementById('meter-xp');
  if (meterXp) meterXp.style.width = `${Math.min(100, Math.round((xpVal / maxXp) * 100))}%`;

  // Meta statistics
  const statTasksDone = document.getElementById('stat-tasks-done');
  if (statTasksDone) statTasksDone.textContent = state.stats?.totalTasksDone || 0;

  const totalStudyMinutes = Math.round(
    (state.stats?.totalMinutesEdu?.denki || 0) +
    (state.stats?.totalMinutesEdu?.chishiki || 0) +
    (state.stats?.totalMinutesEdu?.monogatari || 0)
  );
  const statStudy = document.getElementById('stat-study-time');
  if (statStudy) statStudy.textContent = `${totalStudyMinutes}m`;
  const statDistract = document.getElementById('stat-distract-time');
  if (statDistract) statDistract.textContent = `${Math.round(state.stats?.totalMinutesDistraction || 0)}m`;

  // Sickness cure action
  const cureBtn = document.getElementById('btn-care-cure');
  if (cureBtn) {
    cureBtn.style.display = (isSelectedActive && state.pet.isSick) ? 'inline-block' : 'none';
    const cureIcon = document.getElementById('care-icon-cure');
    if (cureIcon) cureIcon.innerHTML = getPixelIconHtml('cross', 14);
    cureBtn.onclick = async () => {
      const inv = state.inventory || {};
      if (!inv.yakuso || inv.yakuso <= 0) {
        if (state.koban >= 15) {
          PoyoriEngine.buyFoodItem(state, 'yakuso');
        } else {
          alert('Need 15 Koban for Yakusō Medicine!');
          return;
        }
      }
      const res = PoyoriEngine.curePet(state);
      if (res.success) {
        audioSynth.shinkaFanfare();
        await saveState(state);
        renderAll();
      }
    };
  }

  // Focus Session Controls in Overview
  const focusCountdown = document.getElementById('dash-focus-countdown');
  const startFocusBtn = document.getElementById('dash-start-focus-btn');
  const stopFocusBtn = document.getElementById('dash-stop-focus-btn');
  const discSelect = document.getElementById('dash-focus-discipline');
  const durSelect = document.getElementById('dash-focus-duration');

  if (state.focusSession && state.focusSession.isActive) {
    if (focusCountdown) {
      focusCountdown.style.display = 'inline-block';
      const mins = Math.floor((state.focusSession.remainingSeconds || 0) / 60);
      const secs = (state.focusSession.remainingSeconds || 0) % 60;
      focusCountdown.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    if (startFocusBtn) startFocusBtn.style.display = 'none';
    if (stopFocusBtn) {
      stopFocusBtn.style.display = 'inline-block';
      stopFocusBtn.onclick = async () => {
        if (dashFocusInterval) {
          clearInterval(dashFocusInterval);
          dashFocusInterval = null;
        }
        PoyoriEngine.cancelFocusSession(state);
        audioSynth.boop();
        await saveState(state);
        renderAll();
      };
    }

    if (!dashFocusInterval && typeof window !== 'undefined') {
      dashFocusInterval = setInterval(async () => {
        if (!state.focusSession || !state.focusSession.isActive) {
          clearInterval(dashFocusInterval);
          dashFocusInterval = null;
          return;
        }

        if (state.focusSession.remainingSeconds > 0) {
          state.focusSession.remainingSeconds -= 1;
          const mins = Math.floor(state.focusSession.remainingSeconds / 60);
          const secs = state.focusSession.remainingSeconds % 60;
          const countdownEl = document.getElementById('dash-focus-countdown');
          if (countdownEl) {
            countdownEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
          }
          if (state.focusSession.remainingSeconds % 5 === 0) {
            state.focusSession.lastTickAt = Date.now();
            await saveState(state);
          }
        } else {
          clearInterval(dashFocusInterval);
          dashFocusInterval = null;
          PoyoriEngine.completeFocusSession(state);
          audioSynth.shinkaFanfare();
          await saveState(state);
          renderAll();
        }
      }, 1000);
    }
  } else {
    if (dashFocusInterval) {
      clearInterval(dashFocusInterval);
      dashFocusInterval = null;
    }
    if (focusCountdown) focusCountdown.style.display = 'none';
    if (stopFocusBtn) stopFocusBtn.style.display = 'none';
    if (startFocusBtn) {
      startFocusBtn.style.display = 'inline-block';
      startFocusBtn.onclick = async () => {
        const disc = discSelect?.value || 'coding';
        const dur = parseInt(durSelect?.value, 10) || 25;
        PoyoriEngine.startFocusSession(state, { discipline: disc, durationMinutes: dur });
        audioSynth.shinkaFanfare();
        await saveState(state);
        renderAll();
      };
    }
  }

  // Apply active LCD palette to the preview frame
  const palette = PALETTES[state.pet.palette] || PALETTES.classic_lcd;
  const frame = document.getElementById('lcd-screen-preview');
  if (frame) {
    frame.style.background = palette.screenBg;
    frame.style.color = palette.dark;
  }
}


/**
 * Overview care button handlers
 */
function setupOverviewActions() {
  document.getElementById('btn-care-feed').addEventListener('click', async () => {
    const inv = state.inventory;
    const itemToFeed = Object.keys(inv).find(k => inv[k] > 0) || 'ringo';
    const res = PoyoriEngine.feed(state, itemToFeed);
    if (res.success) {
      audioSynth.munch();
      await saveState(state);
      renderAll();

      if (res.evolution && res.evolution.evolved && celebrationModal) {
        const evo = res.evolution;
        const isHatch = evo.stage === 2;
        celebrationModal.show({
          type: isHatch ? 'hatch' : 'evolution',
          title: isHatch ? 'EGG HATCHED!' : (evo.isKomyo ? 'MYTHIC ASCENSION!' : 'EVOLUTION UNLOCKED!'),
          subtitle: isHatch ? '生まれ (Umare) - A New Life Begins!' : '神獣進化 (Shinju Shinka) - Divine Evolution!',
          name: `${evo.creature.name} (${evo.creature.jaName})`,
          badgeText: `STAGE ${evo.stage || 2} ・ ${evo.creature.branch.toUpperCase()}`,
          spriteUrl: getCreatureSprite(evo.newId, 'idle1', state.pet.accessory),
          description: evo.creature.desc || 'Your dedication and focused habits have guided Poyori to evolve!',
          actionLabel: 'Name & Continue!',
          enableNaming: true,
          currentName: state.pet.name,
          onAction: async (newName) => {
            if (newName && newName.trim()) {
              PoyoriEngine.setPetCustomName(state, newName.trim());
              await saveState(state);
              renderAll();
            }
          }
        });
      }
    } else {
      audioSynth.boop();
      alert('No food in stock! Complete tasks to earn snacks.');
    }
  });

  const handlePetInteraction = async () => {
    const res = PoyoriEngine.pet(state);
    audioSynth.purr();
    await saveState(state);
    renderSidebar();
    renderOverview();

    const petImg = document.getElementById('overview-pet-img');
    if (petImg) petImg.classList.add('petting-reaction');
    const brandImg = document.getElementById('brand-sprite');
    if (brandImg) brandImg.classList.add('petting-reaction');

    setTimeout(() => {
      if (petImg) petImg.classList.remove('petting-reaction');
      if (brandImg) brandImg.classList.remove('petting-reaction');
      renderSidebar();
      renderOverview();
    }, 2500);

    if (res.evolution && res.evolution.evolved && celebrationModal) {
      const evo = res.evolution;
      const isHatch = evo.stage === 2;
      celebrationModal.show({
        type: isHatch ? 'hatch' : 'evolution',
        title: isHatch ? 'EGG HATCHED!' : (evo.isKomyo ? 'MYTHIC ASCENSION!' : 'EVOLUTION UNLOCKED!'),
        subtitle: isHatch ? '生まれ (Umare) - A New Life Begins!' : '神獣進化 (Shinju Shinka) - Divine Evolution!',
        name: `${evo.creature.name} (${evo.creature.jaName})`,
        badgeText: `STAGE ${evo.stage || 2} ・ ${evo.creature.branch.toUpperCase()}`,
        spriteUrl: getCreatureSprite(evo.newId, 'idle1', state.pet.accessory),
        description: evo.creature.desc || 'Your dedication and focused habits have guided Poyori to evolve!',
        actionLabel: 'Name & Continue!',
        enableNaming: true,
        currentName: state.pet.name,
        onAction: async (newName) => {
          if (newName && newName.trim()) {
            PoyoriEngine.setPetCustomName(state, newName.trim());
            await saveState(state);
            renderAll();
          }
        }
      });
    }
  };

  const carePetBtn = document.getElementById('btn-care-pet');
  if (carePetBtn) carePetBtn.onclick = handlePetInteraction;
  const overviewPetSprite = document.getElementById('overview-pet-img');
  if (overviewPetSprite) overviewPetSprite.onclick = handlePetInteraction;
  const brandPetSprite = document.getElementById('brand-sprite');
  if (brandPetSprite) brandPetSprite.onclick = handlePetInteraction;
        badgeText: `STAGE ${evo.stage || 2} ・ ${evo.creature.branch.toUpperCase()}`,
        spriteUrl: getCreatureSprite(evo.newId, 'idle1', state.pet.accessory),
        description: evo.creature.desc || 'Your dedication and focused habits have guided Poyori to evolve!',
        actionLabel: 'Name & Continue!',
        enableNaming: true,
        currentName: state.pet.name,
        onAction: async (newName) => {
          if (newName && newName.trim()) {
            PoyoriEngine.setPetCustomName(state, newName.trim());
            await saveState(state);
            renderAll();
          }
        }
      });
    }
  });

  document.getElementById('btn-care-sleep').addEventListener('click', async () => {
    state.pet.isSleeping = !state.pet.isSleeping;
    if (state.pet.isSleeping) audioSynth.snore();
    else audioSynth.chirp();
    await saveState(state);
    renderAll();
  });
}

/**
 * Renders Bestiary tab with all 24 creatures
 */
function renderBestiary() {
  const container = document.getElementById('bestiary-grid');
  if (!container) return;
  const discovered = state.stats.evolutionsDiscovered || [];

  const filterBtns = document.querySelectorAll('.filter-chip');
  filterBtns.forEach(btn => {
    btn.onclick = () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeBranchFilter = btn.dataset.branch;
      renderBestiary();
    };
  });

  const allCreatures = Object.values(CREATURES).filter(c => {
    if (c.isAlias) return false;
    if (activeBranchFilter === 'all') return true;
    return c.branch === activeBranchFilter;
  });

  container.innerHTML = allCreatures.map(c => {
    const isKnown = discovered.includes(c.id);
    const sprite = isKnown ? getCreatureSprite(c.id, 'idle1') : '';
    return `
      <div class="creature-card ${isKnown ? 'discovered' : 'undiscovered'}">
        <div class="creature-card-img">
          ${isKnown ? `<img src="${sprite}" alt="${c.name}" class="pixel-sprite" style="width: 48px; height: 48px;">` : getPixelIconHtml('mystery', 36)}
        </div>
        <div class="creature-card-title">${isKnown ? `${c.name} (${c.jaName})` : '??? (Undiscovered)'}</div>
        <div class="creature-card-sub">${c.branch.toUpperCase()}・Stage ${c.stage} ${c.isKomyo ? `${getPixelIconHtml('star', 12)} Kōmyō` : ''}</div>
        <p class="creature-card-desc">${isKnown ? c.desc : 'Study and raise your companion to unlock this evolutionary form.'}</p>
      </div>
    `;
  }).join('');
}

/**
 * Renders Tasks & Quests tab
 */
function renderTasks() {
  const taskListEl = document.getElementById('dash-task-list');
  const tasks = state.tasks || [];

  taskListEl.innerHTML = tasks.length ? tasks.map(t => `
    <div class="task-item-dash ${t.completed ? 'done' : ''}" data-id="${t.id}">
      <input type="checkbox" class="task-chk-dash" ${t.completed ? 'checked' : ''} ${t.completed ? 'disabled' : ''}>
      <span>${t.title}</span>
      <strong style="color: var(--accent-gold);">+${getPixelIconHtml('coin', 12)} ${t.coins}</strong>
      <button class="task-del-dash" style="background: none; border: none; color: #ff7675; cursor: pointer;">${getPixelIconHtml('cross', 10)}</button>
    </div>
  `).join('') : '<p class="section-desc">No tasks active. Add one above!</p>';

  // Bind checkbox and delete
  taskListEl.querySelectorAll('.task-chk-dash').forEach(chk => {
    chk.onchange = async (e) => {
      const id = e.target.closest('.task-item-dash').dataset.id;
      const res = PoyoriEngine.completeTask(state, id);
      if (res.success) {
        audioSynth.taskDone();
        await saveState(state);
        renderAll();

        const evoRes = PoyoriEngine.checkEvolution(state);
        if (evoRes && evoRes.evolved && celebrationModal) {
          const isHatch = evoRes.stage === 2;
          celebrationModal.show({
            type: isHatch ? 'hatch' : 'evolution',
            title: isHatch ? 'EGG HATCHED!' : (evoRes.isKomyo ? 'MYTHIC ASCENSION!' : 'EVOLUTION UNLOCKED!'),
            subtitle: isHatch ? '生まれ (Umare) - A New Life Begins!' : '神獣進化 (Shinju Shinka) - Divine Evolution!',
            name: `${evoRes.creature.name} (${evoRes.creature.jaName})`,
            badgeText: `STAGE ${evoRes.stage || 2} ・ ${evoRes.creature.branch.toUpperCase()}`,
            spriteUrl: getCreatureSprite(evoRes.newId, 'idle1', state.pet.accessory),
            description: evoRes.creature.desc || 'Your dedication and focused habits have guided Poyori to evolve!',
            actionLabel: 'Name & Continue!',
            enableNaming: true,
            currentName: state.pet.name,
            onAction: async (newName) => {
              if (newName && newName.trim()) {
                PoyoriEngine.setPetCustomName(state, newName.trim());
                await saveState(state);
                renderAll();
              }
            }
          });
          await saveState(state);
          renderAll();
        }
      }
    };
  });

  taskListEl.querySelectorAll('.task-del-dash').forEach(btn => {
    btn.onclick = async (e) => {
      const id = e.target.closest('.task-item-dash').dataset.id;
      state.tasks = state.tasks.filter(t => t.id !== id);
      audioSynth.boop();
      await saveState(state);
      renderTasks();
    };
  });

  // Daily quests
  const questsEl = document.getElementById('dash-daily-quests-list');
  const quests = state.dailyQuests || [];
  questsEl.innerHTML = quests.map(q => {
    const cur = q.currentMinutes !== undefined ? Math.round(q.currentMinutes) : q.currentCount;
    const tgt = q.targetMinutes !== undefined ? q.targetMinutes : q.targetCount;
    const pct = Math.min(100, Math.round((cur / tgt) * 100));
    return `
      <div class="task-item-dash ${q.completed ? 'done' : ''}">
        <span>${q.title} (+${getPixelIconHtml('coin', 12)} ${q.coins})</span>
        <span>${cur} / ${tgt}</span>
        <strong>${q.completed ? `${getPixelIconHtml('check', 12)} Complete` : `${pct}%`}</strong>
      </div>
    `;
  }).join('');
}

function setupTaskActions() {
  const addBtn = document.getElementById('dash-add-task-btn');
  const input = document.getElementById('dash-new-task-text');

  const handleAdd = async () => {
    const title = input.value.trim();
    if (!title) return;
    const res = PoyoriEngine.addTask(state, title);
    if (res.success) {
      input.value = '';
      audioSynth.chirp();
      await saveState(state);
      renderTasks();
    }
  };

  if (addBtn) addBtn.onclick = handleAdd;
  if (input) input.onkeydown = (e) => { if (e.key === 'Enter') handleAdd(); };
}

/**
 * Renders Wardrobe & Shop
 */
function renderWardrobe() {
  const pet = state.pet;
  const grid = document.getElementById('wardrobe-items-grid');
  const unlocked = pet.unlockedAccessories || ['none'];

  grid.innerHTML = Object.values(ACCESSORIES).map(acc => {
    const isOwned = unlocked.includes(acc.id);
    const isEquipped = pet.accessory === acc.id;
    return `
      <div class="wardrobe-card">
        <div class="wardrobe-card-icon">${getPixelIconHtml(acc.iconKey || 'crown', 24)}</div>
        <strong>${acc.name} (${acc.jaName})</strong>
        <small>${isOwned ? 'Owned' : `${getPixelIconHtml('coin', 12)} ${acc.cost}`}</small>
        ${isEquipped 
          ? '<span style="color: var(--accent-green); font-size: 11px;">Active</span>'
          : isOwned 
            ? `<button class="btn-primary acc-equip-btn" data-id="${acc.id}">Equip</button>`
            : `<button class="btn-secondary acc-buy-btn" data-id="${acc.id}" data-cost="${acc.cost}" ${state.koban < acc.cost ? 'disabled' : ''}>Buy</button>`
        }
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.acc-equip-btn').forEach(b => {
    b.onclick = async () => {
      pet.accessory = b.dataset.id;
      audioSynth.chirp();
      await saveState(state);
      renderAll();
    };
  });

  grid.querySelectorAll('.acc-buy-btn').forEach(b => {
    b.onclick = async () => {
      const cost = Number(b.dataset.cost);
      const id = b.dataset.id;
      if (state.koban >= cost) {
        state.koban -= cost;
        if (!pet.unlockedAccessories.includes(id)) {
          pet.unlockedAccessories.push(id);
        }
        await saveState(state);
        renderAll();

        // Celebratory cosmetic unlock modal!
        const accItem = ACCESSORIES[id];
        if (accItem && celebrationModal) {
          celebrationModal.show({
            type: 'cosmetic',
            title: 'NEW COSMETIC UNLOCKED!',
            subtitle: 'Omedetou! Rare Wardrobe Unlocked!',
            name: `${accItem.name} (${accItem.jaName})`,
            badgeText: 'SHOP TREASURE',
            spriteUrl: getPixelIconHtml(accItem.iconKey || 'crown', 64),
            description: `You saved ${cost} Koban to acquire this exquisite accessory! Dress Poyori to stand out on your productivity journeys.`,
            cost: cost,
            actionLabel: 'Equip Now!',
            onAction: async () => {
              pet.accessory = id;
              await saveState(state);
              renderAll();
            }
          });
        }
      }
    };
  });

  // Palettes
  const paletteRow = document.getElementById('palette-choices-row');
  paletteRow.innerHTML = Object.values(PALETTES).map(pal => `
    <button class="filter-chip pal-btn ${pet.palette === pal.id ? 'active' : ''}" data-id="${pal.id}" style="background: ${pal.screenBg}; color: ${pal.dark}; font-weight: bold;">
      ${pal.name}
    </button>
  `).join('');

  paletteRow.onclick = async (e) => {
    const b = e.target.closest('.pal-btn');
    if (!b) return;
    pet.palette = b.dataset.id;
    audioSynth.chirp();
    await saveState(state);
    renderAll();
  };

  // Creature Theme Palettes
  const themesRow = document.getElementById('dash-creature-themes-row');
  if (themesRow) {
    const unlockedThemes = PoyoriEngine.getUnlockedCreatureThemes(pet);
    themesRow.innerHTML = unlockedThemes.map(th => `
      <button class="palette-card theme-btn ${pet.theme === th.id ? 'active' : ''}" data-id="${th.id}">
        <strong>${th.name} (${th.jaName})</strong>
        <div class="theme-desc">${th.desc}</div>
      </button>
    `).join('');

    themesRow.querySelectorAll('.theme-btn').forEach(b => {
      b.onclick = async () => {
        PoyoriEngine.setCreatureTheme(state, b.dataset.id);
        audioSynth.chirp();
        await saveState(state);
        renderAll();
      };
    });
  }

  // Tamagotchi Display Size Row
  const sizeRow = document.getElementById('dash-pet-size-row');
  if (sizeRow) {
    const currentSize = state.settings?.petSize || 'normal';
    sizeRow.querySelectorAll('.dash-size-btn').forEach(btn => {
      const isAct = btn.dataset.size === currentSize;
      btn.classList.toggle('active', isAct);
      btn.onclick = async () => {
        PoyoriEngine.setPetSize(state, btn.dataset.size);
        audioSynth.boop();
        await saveState(state);
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(t => {
              chrome.tabs.sendMessage(t.id, { action: 'set_pet_size', size: btn.dataset.size }).catch(() => {});
            });
          });
        }
        renderAll();
      };
    });
  }

  // UI Font Size Row
  const fontRow = document.getElementById('dash-font-size-row');
  if (fontRow) {
    const currentFontSize = state.settings?.fontSize || 'normal';
    fontRow.querySelectorAll('.dash-font-size-btn').forEach(btn => {
      const isAct = btn.dataset.fontSize === currentFontSize;
      btn.classList.toggle('active', isAct);
      btn.onclick = async () => {
        PoyoriEngine.setFontSize(state, btn.dataset.fontSize);
        audioSynth.boop();
        await saveState(state);
        applyFontSizeClass(state.settings?.fontSize || 'normal');
        renderAll();
      };
    });
  }

  // Companion Roster
  const rosterGrid = document.getElementById('dash-roster-grid');
  if (rosterGrid) {
    const roster = state.roster || [];
    rosterGrid.innerHTML = roster.map((comp, idx) => {
      const isAct = idx === (state.activeRosterIndex || 0);
      const cMeta = CREATURES[comp.creatureId] || CREATURES.denki_tamago;
      const compSprite = getCreatureSprite(comp.creatureId, 'idle1', 'none', comp.theme || 'classic_default');
      return `
        <div class="wardrobe-card" style="position: relative; border-color: ${isAct ? 'var(--accent-cyan)' : 'inherit'};">
          <img src="${compSprite}" alt="${escapeHtml(comp.name)}" style="width: 48px; height: 48px; image-rendering: pixelated; margin: 0 auto 6px auto; display: block;" />
          <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
            <strong style="font-size: 13px;">${escapeHtml(comp.name)}</strong>
            <button class="dash-roster-rename-btn" data-index="${idx}" title="Rename Companion" style="background:none; border:none; cursor:pointer; font-size:10px; color:inherit; opacity:0.8;">[edit]</button>
          </div>
          <small>${cMeta.name} • Lv. ${comp.level || 1}</small>
          <div style="margin-top: 8px;">
            ${isAct 
              ? '<span style="color: var(--accent-green); font-size: 11px; font-weight: bold;">Active Companion</span>'
              : `<button class="btn-primary dash-switch-roster-btn" data-index="${idx}" style="padding: 4px 10px; font-size: 11px;">Switch</button>`
            }
          </div>
        </div>
      `;
    }).join('');

    rosterGrid.querySelectorAll('.dash-switch-roster-btn').forEach(b => {
      b.onclick = async () => {
        const idx = Number(b.dataset.index);
        PoyoriEngine.switchActivePet(state, idx);
        audioSynth.shinkaFanfare();
        await saveState(state);
        renderAll();
      };
    });

    rosterGrid.querySelectorAll('.dash-roster-rename-btn').forEach(b => {
      b.onclick = async () => {
        const idx = Number(b.dataset.index);
        const comp = state.roster && state.roster[idx];
        if (!comp) return;
        const newName = window.prompt(`Enter a custom name for ${comp.name} (1-20 characters):`, comp.name);
        if (newName && newName.trim()) {
          comp.name = newName.trim();
          if (idx === (state.activeRosterIndex || 0)) {
            state.pet.name = newName.trim();
          }
          audioSynth.chirp();
          await saveState(state);
          renderAll();
        }
      };
    });
  }
}

/**
 * Renders Mochimori Market (Provisions & Medicine)
 */
function renderMarket() {
  const grid = document.getElementById('market-items-grid');
  if (!grid) return;
  const inv = state.inventory || {};

  grid.innerHTML = Object.values(FOOD_ITEMS).map(food => {
    const qty = inv[food.id] || 0;
    const canAfford = state.koban >= food.cost;
    const effectDesc = food.curesIllness 
      ? 'Cures sickness & restores health' 
      : `+${food.hungerRestore} Hunger, +${food.energyRestore} Energy`;

    return `
      <div class="wardrobe-card">
        <div class="wardrobe-card-icon">${getPixelIconHtml(food.iconKey || 'apple', 24)}</div>
        <strong>${food.name} (${food.jaName})</strong>
        <p style="font-size: 8px; color: var(--c-parchment-dark); margin: 2px 0;">${food.desc || effectDesc}</p>
        <small style="color: var(--accent-cyan); font-weight: bold;">In Bag: x${qty}</small>
        <button class="btn-primary market-buy-btn" data-id="${food.id}" data-cost="${food.cost}" ${!canAfford ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
          ${getPixelIconHtml('coin', 11)} ${food.cost} Buy
        </button>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.market-buy-btn').forEach(b => {
    b.onclick = async () => {
      const id = b.dataset.id;
      const res = PoyoriEngine.buyFoodItem(state, id);
      if (res.success) {
        audioSynth.coin();
        await saveState(state);
        renderSidebar();
        renderMarket();
      } else {
        audioSynth.error();
      }
    };
  });
}

/**
 * Renders Website Tracking Manager
 */
function renderWebsites() {
  const rulesList = document.getElementById('custom-rules-list');
  const customEdu = state.settings.customEducational || [];
  const customDis = state.settings.customDistracting || [];

  let rows = [];
  customEdu.forEach((e, idx) => {
    rows.push(`
      <div class="task-item-dash">
        <span>${escapeHtml(e.domain)}</span>
        <strong style="color: var(--accent-cyan);">${escapeHtml(e.category).toUpperCase()} (Educational)</strong>
        <button class="del-rule-btn" data-type="edu" data-idx="${idx}" style="background:none; border:none; cursor:pointer;">${getPixelIconHtml('cross', 10)}</button>
      </div>
    `);
  });

  customDis.forEach((domain, idx) => {
    rows.push(`
      <div class="task-item-dash">
        <span>${escapeHtml(domain)}</span>
        <strong style="color: #ff7675;">DISTRACTING</strong>
        <button class="del-rule-btn" data-type="dis" data-idx="${idx}" style="background:none; border:none; cursor:pointer;">${getPixelIconHtml('cross', 10)}</button>
      </div>
    `);
  });

  rulesList.innerHTML = rows.length ? rows.join('') : '<p class="section-desc">No custom domain rules added yet.</p>';

  rulesList.querySelectorAll('.del-rule-btn').forEach(btn => {
    btn.onclick = async () => {
      const type = btn.dataset.type;
      const idx = Number(btn.dataset.idx);
      if (type === 'edu') state.settings.customEducational.splice(idx, 1);
      else state.settings.customDistracting.splice(idx, 1);
      audioSynth.boop();
      await saveState(state);
      renderWebsites();
    };
  });

  // Render expanded built-in presets dynamically
  const presetWrap = document.getElementById('preset-badges-wrap');
  if (presetWrap && typeof DOMAIN_PRESETS !== 'undefined') {
    const denkiList = (DOMAIN_PRESETS.educational?.denki || []).join(', ');
    const chishikiList = (DOMAIN_PRESETS.educational?.chishiki || []).join(', ');
    const monogatariList = (DOMAIN_PRESETS.educational?.monogatari || []).join(', ');
    const distractingList = (DOMAIN_PRESETS.distracting || []).join(', ');

    presetWrap.innerHTML = `
      <div class="preset-col">
        <strong>Denki (Coding - ${DOMAIN_PRESETS.educational?.denki?.length || 0} Domains)</strong>
        <p>${escapeHtml(denkiList)}</p>
      </div>
      <div class="preset-col">
        <strong>Chishiki (Scholar - ${DOMAIN_PRESETS.educational?.chishiki?.length || 0} Domains)</strong>
        <p>${escapeHtml(chishikiList)}</p>
      </div>
      <div class="preset-col">
        <strong>Monogatari (Story - ${DOMAIN_PRESETS.educational?.monogatari?.length || 0} Domains)</strong>
        <p>${escapeHtml(monogatariList)}</p>
      </div>
      <div class="preset-col">
        <strong>Distracting (${DOMAIN_PRESETS.distracting?.length || 0} Domains)</strong>
        <p>${escapeHtml(distractingList)}</p>
      </div>
    `;
  }
}

function setupWebsiteActions() {
  const addBtn = document.getElementById('add-domain-btn');
  const domainInput = document.getElementById('custom-domain-input');
  const catSelect = document.getElementById('custom-domain-category');

  addBtn.onclick = async () => {
    const rawDomain = domainInput.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!rawDomain) return;
    const cat = catSelect.value;

    // Remove existing rule
    state.settings.customEducational = (state.settings.customEducational || []).filter(e => e.domain !== rawDomain);
    state.settings.customDistracting = (state.settings.customDistracting || []).filter(d => d !== rawDomain);

    if (cat === 'distracting') {
      state.settings.customDistracting.push(rawDomain);
    } else {
      state.settings.customEducational.push({ domain: rawDomain, category: cat });
    }

    domainInput.value = '';
    audioSynth.chirp();
    await saveState(state);
    renderWebsites();
  };
}

/**
 * Renders Preferences & Settings tab
 */
function renderSettings() {
  const s = state.settings;
  document.getElementById('opt-language').value = s.languageMode || 'bilingual';
  document.getElementById('opt-consequence').value = s.consequenceMode || 'cozy';
  document.getElementById('opt-volume').value = s.soundVolume !== undefined ? s.soundVolume : 0.4;
  document.getElementById('opt-volume-val').textContent = `${Math.round((s.soundVolume || 0.4) * 100)}% Volume`;
  document.getElementById('opt-mute').checked = !!s.soundMuted;
  document.getElementById('opt-silence-audible').checked = s.silenceOnAudioTabs !== false;
  document.getElementById('opt-bedtime-start').value = s.bedtimeStart || '22:30';
  document.getElementById('opt-bedtime-end').value = s.bedtimeEnd || '07:30';
  document.getElementById('opt-distract-tolerance').value = String(s.distractionFatigueMinutes || 15);

  // NSFW Content Protection Toggle
  const nsfwEl = document.getElementById('opt-nsfw-filter');
  if (nsfwEl) nsfwEl.checked = !!s.nsfwFilterEnabled;

  // Custom Blocked Sites List
  const blockedListEl = document.getElementById('dash-blocked-list');
  if (blockedListEl) {
    const list = s.customBlockedSites || [];
    blockedListEl.innerHTML = list.length ? list.map((domain, idx) => `
      <span class="blocked-tag" style="display:inline-flex; align-items:center; gap:6px; background:#ffeaa7; color:#2d3436; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold;">
        ${domain}
        <button class="dash-del-blocked-btn" data-idx="${idx}" style="background:none; border:none; cursor:pointer; font-weight:bold; color:#d63031; font-size:14px; line-height:1;">×</button>
      </span>
    `).join('') : '<small style="color:var(--text-muted, #888);">No custom blocked sites added yet.</small>';

    blockedListEl.querySelectorAll('.dash-del-blocked-btn').forEach(btn => {
      btn.onclick = async () => {
        const idx = Number(btn.dataset.idx);
        state.settings.customBlockedSites.splice(idx, 1);
        audioSynth.boop();
        await saveState(state);
        renderSettings();
      };
    });
  }
}

function setupSettingsActions() {
  document.getElementById('opt-language').onchange = async (e) => {
    state.settings.languageMode = e.target.value;
    await saveState(state);
    renderAll();
  };

  document.getElementById('opt-consequence').onchange = async (e) => {
    state.settings.consequenceMode = e.target.value;
    await saveState(state);
  };

  document.getElementById('opt-volume').oninput = async (e) => {
    const val = Number(e.target.value);
    state.settings.soundVolume = val;
    document.getElementById('opt-volume-val').textContent = `${Math.round(val * 100)}% Volume`;
    audioSynth.setVolume(val);
    await saveState(state);
  };

  document.getElementById('opt-mute').onchange = async (e) => {
    state.settings.soundMuted = e.target.checked;
    audioSynth.setMuted(state.settings.soundMuted);
    await saveState(state);
  };

  document.getElementById('opt-silence-audible').onchange = async (e) => {
    state.settings.silenceOnAudioTabs = e.target.checked;
    await saveState(state);
  };

  document.getElementById('opt-bedtime-start').onchange = async (e) => {
    state.settings.bedtimeStart = e.target.value;
    await saveState(state);
  };

  document.getElementById('opt-bedtime-end').onchange = async (e) => {
    state.settings.bedtimeEnd = e.target.value;
    await saveState(state);
  };

  document.getElementById('opt-distract-tolerance').onchange = async (e) => {
    state.settings.distractionFatigueMinutes = Number(e.target.value);
    await saveState(state);
  };

  const nsfwToggle = document.getElementById('opt-nsfw-filter');
  if (nsfwToggle) {
    nsfwToggle.onchange = async (e) => {
      state.settings.nsfwFilterEnabled = e.target.checked;
      await saveState(state);
    };
  }

  const addBlockedBtn = document.getElementById('dash-add-blocked-btn');
  const blockedInput = document.getElementById('dash-blocked-input');
  if (addBlockedBtn && blockedInput) {
    const handleAddBlocked = async () => {
      const raw = blockedInput.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (!raw) return;
      if (!state.settings.customBlockedSites) state.settings.customBlockedSites = [];
      if (!state.settings.customBlockedSites.includes(raw)) {
        state.settings.customBlockedSites.push(raw);
        audioSynth.chirp();
        await saveState(state);
        renderSettings();
      }
      blockedInput.value = '';
    };
    addBlockedBtn.onclick = handleAddBlocked;
    blockedInput.onkeydown = (e) => { if (e.key === 'Enter') handleAddBlocked(); };
  }

  // Replay Onboarding Tutorial
  const replayTutorialBtn = document.getElementById('btn-replay-tutorial');
  if (replayTutorialBtn) {
    replayTutorialBtn.onclick = () => {
      if (tutorialModal) {
        tutorialModal.show({ state, step: 1 });
      }
    };
  }

  // Export Save
  document.getElementById('btn-export-data').onclick = () => {
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poyori-save-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reset Data
  document.getElementById('btn-reset-data').onclick = async () => {
    if (confirm('Are you sure you want to reset Poyori back to a mysterious egg? This cannot be undone.')) {
      state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      await saveState(state);
      audioSynth.shinkaFanfare();
      renderAll();
    }
  };
}

/**
 * Developer Access Port Security & Controller
 * Gated behind secret key, 7-tap gesture on brand logo, hotkey (Ctrl+Shift+D),
 * or URL query parameter (?dev=true).
 */
function setupDevAccess() {
  const devNavBtn = document.getElementById('nav-btn-devport');

  const unlockDevPort = async () => {
    devPortUnlocked = true;
    sessionStorage.setItem('poyori_dev_unlocked', 'true');
    if (devNavBtn) devNavBtn.style.display = 'flex';
    PoyoriEngine.enterDevSandbox(state);
    await saveState(state);
    audioSynth.shinkaFanfare();
  };

  const lockDevPort = async () => {
    sessionStorage.removeItem('poyori_dev_unlocked');
    devPortUnlocked = false;
    if (devNavBtn) devNavBtn.style.display = 'none';
    const res = PoyoriEngine.exitDevSandbox(state);
    if (res.restored) {
      await saveState(state);
      updateOverviewTab();
    }
    const overviewBtn = document.querySelector('.nav-btn[data-tab="overview"]');
    if (overviewBtn) overviewBtn.click();
    audioSynth.boop();
    alert('Dev Port locked: companion, levels, and Koban reverted to your original save progress.');
  };

  // 1. Check URL parameters or active session
  const params = new URLSearchParams(window.location.search);
  if (params.get('dev') === 'true' || window.location.hash === '#dev' || sessionStorage.getItem('poyori_dev_unlocked') === 'true') {
    unlockDevPort();
    if (params.get('dev') === 'true' || window.location.hash === '#dev') {
      setTimeout(() => { if (devNavBtn) devNavBtn.click(); }, 150);
    }
  } else if (state.devOriginalStateBackup) {
    // If not in dev session but previous dev session left backup, restore original player progress
    const res = PoyoriEngine.exitDevSandbox(state);
    if (res.restored) {
      saveState(state).then(() => updateOverviewTab());
    }
  }

  // 2. Secret 7-Tap Gesture on Brand Header
  const brandHeader = document.querySelector('.dash-brand');
  let brandClicks = 0;
  let lastClickTime = 0;

  if (brandHeader) {
    brandHeader.style.cursor = 'pointer';
    brandHeader.title = 'Poyori Portal';

    const activateDevPortFromGesture = () => {
      const enteredKey = prompt('POYORI DEV ACCESS // ENTER SECRET KEY:');
      if (enteredKey && PoyoriEngine.verifyDevKey(enteredKey)) {
        unlockDevPort();
        audioSynth.shinkaFanfare();
        if (devNavBtn) devNavBtn.click();
        if (celebrationModal) {
          celebrationModal.show({
            type: 'evolution',
            title: 'DEV MODE UNLOCKED!',
            subtitle: 'Developer Access Port Activated',
            name: 'Secret Discovered',
            badgeText: 'DEV PORT',
            spriteUrl: getCreatureSprite(state.pet.creatureId, 'cheer', state.pet.accessory),
            description: 'Dev God Mode, 24-Creature Morpher, and sandbox tools are now unlocked!',
            actionLabel: 'Enter Dev Port'
          });
        } else {
          alert('DEV ACCESS PORT UNLOCKED! Welcome to God Mode.');
        }
      } else if (enteredKey !== null) {
        audioSynth.boop();
        alert('Access Denied: Invalid Developer Key.');
      }
    };

    const onBrandClick = () => {
      const now = Date.now();
      if (now - lastClickTime < 1500) {
        brandClicks++;
      } else {
        brandClicks = 1;
      }
      lastClickTime = now;

      if (brandClicks >= 4 && brandClicks < 7) {
        audioSynth.boop();
        const subheading = document.getElementById('page-subheading');
        if (subheading) {
          subheading.textContent = `[Dev Access] ${7 - brandClicks} more taps to unlock God Mode Port...`;
        }
      } else if (brandClicks >= 7) {
        brandClicks = 0;
        activateDevPortFromGesture();
      }
    };

    brandHeader.addEventListener('click', onBrandClick);
  }

  // 3. Hotkey Shortcut: Ctrl + Shift + D or Cmd + Shift + D
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
      e.preventDefault();
      if (devPortUnlocked) {
        if (devNavBtn) devNavBtn.click();
      } else {
        const enteredKey = prompt('POYORI DEV ACCESS // ENTER SECRET KEY:');
        if (enteredKey && PoyoriEngine.verifyDevKey(enteredKey)) {
          unlockDevPort();
          if (devNavBtn) devNavBtn.click();
          alert('DEV ACCESS PORT UNLOCKED! Welcome to God Mode.');
        } else if (enteredKey !== null) {
          audioSynth.boop();
          alert('Access Denied: Invalid Developer Key.');
        }
      }
    }
  });

  // Lock button
  const lockBtn = document.getElementById('dash-lock-dev-btn');
  if (lockBtn) lockBtn.addEventListener('click', lockDevPort);

  // Setup Dev Actions
  setupDevPortActions();
}

/**
 * Binds all interactive controls in the integrated Dev Port pane
 */
function setupDevPortActions() {
  // Populate icons
  const iconGod = document.getElementById('dash-icon-god');
  if (iconGod) iconGod.innerHTML = getPixelIconHtml('star', 16);
  const iconMorph = document.getElementById('dash-icon-morph');
  if (iconMorph) iconMorph.innerHTML = getPixelIconHtml('book_zukan', 16);
  const iconCoins = document.getElementById('dash-icon-coins');
  if (iconCoins) iconCoins.innerHTML = getPixelIconHtml('coin', 16);
  const iconApple = document.getElementById('dash-icon-apple');
  if (iconApple) iconApple.innerHTML = getPixelIconHtml('apple', 16);
  const iconHeart = document.getElementById('dash-icon-heart');
  if (iconHeart) iconHeart.innerHTML = getPixelIconHtml('heart_full', 16);
  const iconStreak = document.getElementById('dash-icon-streak');
  if (iconStreak) iconStreak.innerHTML = getPixelIconHtml('spark', 16);

  // Populate Morpher Dropdown with all 24 creatures
  const morphSelect = document.getElementById('dash-select-morph');
  if (morphSelect) {
    morphSelect.innerHTML = Object.values(CREATURES).map(c => `
      <option value="${c.id}" ${state.pet && state.pet.creatureId === c.id ? 'selected' : ''}>
        ${c.branch.toUpperCase()} | Stage ${c.stage}: ${c.name} (${c.jaName}) ${c.isKomyo ? '[KOMYO]' : ''}
      </option>
    `).join('');
  }

  // God Mode Button
  const godBtn = document.getElementById('dash-btn-godmode');
  if (godBtn) {
    godBtn.addEventListener('click', async () => {
      PoyoriEngine.applyDevGodMode(state);
      audioSynth.shinkaFanfare();
      await saveState(state);
      renderAll();

      if (celebrationModal) {
        celebrationModal.show({
          type: 'evolution',
          title: 'GOD MODE UNLOCKED!',
          subtitle: 'All Features & Unlimited Koban Ready',
          name: '99,999 Koban + 24 Creatures Unlocked',
          badgeText: 'GOD MODE',
          spriteUrl: getCreatureSprite(state.pet.creatureId, 'idle1', state.pet.accessory),
          description: 'All 24 creatures, accessories, foods, and vitals are maxed.',
          actionLabel: 'Awesome!'
        });
      }
    });
  }

  // Morpher Button
  const morphBtn = document.getElementById('dash-btn-morph');
  if (morphBtn && morphSelect) {
    morphBtn.addEventListener('click', async () => {
      const selectedId = morphSelect.value;
      const res = PoyoriEngine.morphPet(state, selectedId);
      if (res.success) {
        audioSynth.shinkaFanfare();
        await saveState(state);
        renderAll();
      }
    });
  }

  // Economy Buttons
  const btn1k = document.getElementById('dash-btn-coin-1k');
  if (btn1k) btn1k.addEventListener('click', async () => {
    state.koban += 1000;
    audioSynth.chirp();
    await saveState(state);
    renderAll();
  });

  const btn10k = document.getElementById('dash-btn-coin-10k');
  if (btn10k) btn10k.addEventListener('click', async () => {
    state.koban += 10000;
    audioSynth.chirp();
    await saveState(state);
    renderAll();
  });

  const btn99k = document.getElementById('dash-btn-coin-99k');
  if (btn99k) btn99k.addEventListener('click', async () => {
    state.koban = 99999;
    audioSynth.chirp();
    await saveState(state);
    renderAll();
  });

  const btn0k = document.getElementById('dash-btn-coin-0');
  if (btn0k) btn0k.addEventListener('click', async () => {
    state.koban = 0;
    audioSynth.boop();
    await saveState(state);
    renderAll();
  });

  // Food Buttons
  const btnFoodAll = document.getElementById('dash-btn-food-all');
  if (btnFoodAll) btnFoodAll.addEventListener('click', async () => {
    Object.keys(FOOD_ITEMS).forEach(k => {
      state.inventory[k] = (state.inventory[k] || 0) + 50;
    });
    audioSynth.munch();
    await saveState(state);
    renderAll();
  });

  const btnFoodClear = document.getElementById('dash-btn-food-clear');
  if (btnFoodClear) btnFoodClear.addEventListener('click', async () => {
    Object.keys(FOOD_ITEMS).forEach(k => { state.inventory[k] = 0; });
    audioSynth.boop();
    await saveState(state);
    renderAll();
  });

  // Vitals Buttons
  const btnVitalMax = document.getElementById('dash-btn-vital-max');
  if (btnVitalMax) btnVitalMax.addEventListener('click', async () => {
    PoyoriEngine.setDevVitals(state, { onaka: 100, genki: 100, kizuna: 100, isSick: false, isSleeping: false });
    audioSynth.chirp();
    await saveState(state);
    renderAll();
  });

  const btnVitalStarve = document.getElementById('dash-btn-vital-starve');
  if (btnVitalStarve) btnVitalStarve.addEventListener('click', async () => {
    PoyoriEngine.setDevVitals(state, { onaka: 0, isSick: true });
    audioSynth.boop();
    await saveState(state);
    renderAll();
  });

  const btnVitalExhaust = document.getElementById('dash-btn-vital-exhaust');
  if (btnVitalExhaust) btnVitalExhaust.addEventListener('click', async () => {
    PoyoriEngine.setDevVitals(state, { genki: 0, isSleeping: true });
    audioSynth.snore();
    await saveState(state);
    renderAll();
  });

  const btnVitalSick = document.getElementById('dash-btn-vital-sick');
  if (btnVitalSick) btnVitalSick.addEventListener('click', async () => {
    state.pet.isSick = !state.pet.isSick;
    state.pet.mood = PoyoriEngine.getPetMood(state);
    audioSynth.boop();
    await saveState(state);
    renderAll();
  });

  // Time Machine Buttons
  const btnTime1d = document.getElementById('dash-btn-time-1day');
  if (btnTime1d) btnTime1d.addEventListener('click', async () => {
    state.stats.currentStreak = (state.stats.currentStreak || 1) + 1;
    state.stats.bestStreak = Math.max(state.stats.bestStreak || 1, state.stats.currentStreak);
    audioSynth.chirp();
    await saveState(state);
    renderAll();
  });

  const btnTime7d = document.getElementById('dash-btn-time-7days');
  if (btnTime7d) btnTime7d.addEventListener('click', async () => {
    state.stats.currentStreak = Math.max((state.stats.currentStreak || 1) + 7, 7);
    state.stats.bestStreak = Math.max(state.stats.bestStreak || 1, state.stats.currentStreak);
    audioSynth.shinkaFanfare();
    await saveState(state);
    renderAll();
  });

  const btnTimeNeglect = document.getElementById('dash-btn-time-neglect');
  if (btnTimeNeglect) btnTimeNeglect.addEventListener('click', async () => {
    PoyoriEngine.simulateDevTimeDelta(state, 12);
    audioSynth.boop();
    await saveState(state);
    renderAll();
  });
}

// Synchronize state across tabs and background service worker
subscribeState((newState) => {
  if (!newState) return;
  state = newState;
  renderAll();
});

initDashboard();
