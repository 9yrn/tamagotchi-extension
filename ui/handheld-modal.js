/**
 * Poyori (ポヨリ) — Handheld Tamagotchi Device Modal UI Logic
 * Authentically 9-bit retro virtual pet console popout inspired by classic RPG frames.
 * Features functional console hardware buttons (A, B, C), in-screen direct care actions,
 * fixed-reward task adding, NSFW filter control, custom blocked site manager,
 * and comprehensive multi-language support.
 */

import { STAGES, CREATURES, FOOD_ITEMS, ACCESSORIES, PALETTES, BRANCHES, CREATURE_THEMES, getTerm } from '../shared/constants.js';
import { PoyoriEngine } from '../shared/game-engine.js';
import { audioSynth } from './audio.js';
import { getCreatureSprite } from '../content/sprites.js';
import { getPixelIconHtml } from '../shared/pixel-icons.js';
import { CelebrationModal } from './celebration-modal.js';

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export class HandheldModal {
  constructor(shadowRoot, options = {}) {
    this.shadowRoot = shadowRoot;
    this.state = options.state;
    this.onStateChange = options.onStateChange || (() => {});
    this.onPetAction = options.onPetAction || (() => {});

    this.activeTab = 'status'; // 'status' | 'tasks' | 'food' | 'zukan' | 'wardrobe' | 'settings'
    this.isOpen = false;
    this.modalEl = null;

    // Instantiate celebratory fanfare & award popup
    this.celebrationModal = new CelebrationModal(this.shadowRoot);

    this.initDOM();
  }

  initDOM() {
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'poyori-device-overlay';
    this.modalEl.style.display = 'none';

    this.render();
    this.shadowRoot.appendChild(this.modalEl);
  }

  open() {
    this.isOpen = true;
    this.modalEl.style.display = 'flex';
    audioSynth.chirp();
    this.render();
  }

  close() {
    this.isOpen = false;
    this.stopFocusCountdown();
    this.modalEl.style.display = 'none';
    audioSynth.boop();
  }

  updateState(newState) {
    this.state = newState;
    if (this.isOpen) {
      this.render();
    }
  }

  render() {
    if (!this.state) return;
    const pet = this.state.pet;
    const creature = CREATURES[pet.creatureId] || CREATURES.denki_tamago;
    const mode = this.state.settings.languageMode || 'bilingual';
    const palette = PALETTES[pet.palette] || PALETTES.rpg_parchment;

    this.modalEl.innerHTML = `
      <div class="poyori-device-shell" style="
        --screen-bg: ${palette.screenBg};
        --screen-text: ${palette.text || palette.dark};
        --screen-label: ${palette.label || palette.mid};
        --screen-dark: ${palette.dark};
        --screen-mid: ${palette.mid};
        --screen-light: ${palette.light};
        --screen-card-bg: ${palette.cardBg};
        --screen-card-border: ${palette.cardBorder};
      ">
        <div class="poyori-device-header">
          <div class="poyori-power-led" title="Power / Heartbeat"></div>
          <div class="poyori-title-banner">
            <span class="banner-text">POYORI・ポヨリ</span>
          </div>
          <button class="poyori-close-btn" title="${getTerm('close', mode)}">${getPixelIconHtml('cross', 10)}</button>
        </div>

        <div class="poyori-screen-bezel">
          <!-- Navigation Tabs Bar -->
          <div class="poyori-tabs-bar">
            <button class="poyori-tab-btn ${this.activeTab === 'status' ? 'active' : ''}" data-tab="status" title="${getTerm('tabStatus', mode)}">${getPixelIconHtml('stats_bars', 16)}</button>
            <button class="poyori-tab-btn ${this.activeTab === 'tasks' ? 'active' : ''}" data-tab="tasks" title="${getTerm('tabTasks', mode)}">${getPixelIconHtml('tasks_scroll', 16)}</button>
            <button class="poyori-tab-btn ${this.activeTab === 'food' ? 'active' : ''}" data-tab="food" title="${getTerm('tabFood', mode)}">${getPixelIconHtml('apple', 16)}</button>
            <button class="poyori-tab-btn ${this.activeTab === 'zukan' ? 'active' : ''}" data-tab="zukan" title="${getTerm('tabZukan', mode)}">${getPixelIconHtml('book_zukan', 16)}</button>
            <button class="poyori-tab-btn ${this.activeTab === 'wardrobe' ? 'active' : ''}" data-tab="wardrobe" title="${getTerm('tabWardrobe', mode)}">${getPixelIconHtml('wardrobe_robe', 16)}</button>
            <button class="poyori-tab-btn ${this.activeTab === 'focus' ? 'active' : ''}" data-tab="focus" title="Focus Timer">${getPixelIconHtml('spark', 16)}</button>
            <button class="poyori-tab-btn ${this.activeTab === 'settings' ? 'active' : ''}" data-tab="settings" title="${getTerm('tabSettings', mode)}">${getPixelIconHtml('gear', 16)}</button>
          </div>

          <!-- LCD / Parchment Screen Content -->
          <div class="poyori-lcd-screen">
            ${this.renderTabContent(pet, creature, mode)}
          </div>
        </div>

        <!-- 3 Handheld Console Buttons with Clear, Contextual Functions -->
        <div class="poyori-console-controls">
          <button class="poyori-console-btn" id="console-btn-a" title="Cycle Tab">
            <span class="console-btn-label">TAB</span>
          </button>
          <button class="poyori-console-btn" id="console-btn-b" title="Action / Interact">
            <span class="console-btn-label">ACT</span>
          </button>
          <button class="poyori-console-btn" id="console-btn-c" title="Rest / Sleep">
            <span class="console-btn-label">${pet.isSleeping ? 'WAKE' : 'REST'}</span>
          </button>
        </div>
      </div>
    `;

    this.bindEvents();

    if (this.activeTab === 'focus' && this.state.focusSession && this.state.focusSession.isActive) {
      this.startFocusCountdown();
    } else {
      this.stopFocusCountdown();
    }
  }

  startFocusCountdown() {
    this.stopFocusCountdown();
    if (typeof window === 'undefined' || typeof setInterval === 'undefined') return;

    this.focusInterval = setInterval(() => {
      const session = this.state && this.state.focusSession;
      if (!session || !session.isActive) {
        this.stopFocusCountdown();
        return;
      }

      if (session.remainingSeconds > 0) {
        session.remainingSeconds -= 1;
        const countdownEl = this.modalEl && this.modalEl.querySelector ? this.modalEl.querySelector('#focus-countdown') : null;
        if (countdownEl) {
          const mins = Math.floor(session.remainingSeconds / 60);
          const secs = session.remainingSeconds % 60;
          countdownEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        const barEl = this.modalEl && this.modalEl.querySelector ? this.modalEl.querySelector('.focus-progress-bar') : null;
        if (barEl) {
          const elapsed = (session.durationSeconds || 1500) - session.remainingSeconds;
          const pct = Math.min(100, Math.round((elapsed / (session.durationSeconds || 1500)) * 100));
          barEl.style.width = `${pct}%`;
        }
        if (session.remainingSeconds % 5 === 0) {
          session.lastTickAt = Date.now();
          if (this.onStateChange) this.onStateChange(this.state);
        }
      } else {
        this.stopFocusCountdown();
        PoyoriEngine.completeFocusSession(this.state);
        audioSynth.shinkaFanfare();
        if (this.onStateChange) this.onStateChange(this.state);
        this.render();
      }
    }, 1000);
  }

  stopFocusCountdown() {
    if (this.focusInterval) {
      clearInterval(this.focusInterval);
      this.focusInterval = null;
    }
  }

  renderTabContent(pet, creature, mode) {
    switch (this.activeTab) {
      case 'status':
        return this.renderStatusTab(pet, creature, mode);
      case 'tasks':
        return this.renderTasksTab(mode);
      case 'food':
        return this.renderFoodTab(mode);
      case 'zukan':
        return this.renderZukanTab(mode);
      case 'wardrobe':
        return this.renderWardrobeTab(mode);
      case 'focus':
        return this.renderFocusTab(mode);
      case 'settings':
        return this.renderSettingsTab(mode);
      default:
        return this.renderStatusTab(pet, creature, mode);
    }
  }

  renderStatusTab(pet, creature, mode) {
    const stageMeta = STAGES[pet.stage - 1] || STAGES[0];
    const stageTerm = getTerm(stageMeta.termKey, mode);
    const branchTerm = getTerm(`branch${pet.chosenBranch.charAt(0).toUpperCase() + pet.chosenBranch.slice(1)}`, mode);
    
    // Evaluate Mood & Pose
    const mood = PoyoriEngine.getPetMood(this.state);
    const isPetted = this.isBlushing || (Date.now() - (pet.lastPettedAt || 0) < 2500);
    let pose = 'idle1';
    if (isPetted) pose = 'petted';
    else if (pet.isSleeping) pose = 'sleep';
    else if (mood === 'grumpy') pose = 'grumpy';
    else if (pet.isSick) pose = 'idle1';

    const spriteSvg = getCreatureSprite(pet.creatureId, pose, pet.accessory);

    const onakaHearts = Array.from({length: 5}, (_, i) => getPixelIconHtml(i < Math.round(pet.onaka / 20) ? 'heart_full' : 'heart_empty', 12)).join(' ');
    const genkiBars = Array.from({length: 5}, (_, i) => i < Math.round(pet.genki / 20) ? getPixelIconHtml('spark', 12) : '<span style="display:inline-block;width:12px;text-align:center;opacity:0.4;">·</span>').join(' ');

    let moodTerm = getTerm('moodCheerful', mode);
    let moodIcon = 'spark';
    if (mood === 'grumpy') { moodTerm = getTerm('moodGrumpy', mode); moodIcon = 'flame'; }
    else if (mood === 'sleepy') { moodTerm = getTerm('moodSleepy', mode); moodIcon = 'sleep_zzz'; }
    else if (mood === 'sick') { moodTerm = getTerm('moodSick', mode); moodIcon = 'cross'; }

    const isPocket = this.state.settings?.pocketMode === true || this.state.settings?.petVisible === false;
    const isHardcore = this.state.settings?.consequenceMode === 'hardcore';

    return `
      <div class="poyori-status-view">
        <div class="poyori-pet-portrait">
          <!-- Left Screen Column: Stage and Mood Badges -->
          <div class="poyori-portrait-meta-left">
            <div class="poyori-badge-tag">Lv. ${pet.level || 1}</div>
            <div class="poyori-badge-tag ${isPocket ? 'pocket-active' : ''}" style="${isPocket ? 'background:#fedb72;color:#24140e;font-weight:bold;' : ''}">${isPocket ? '[POCKET]' : stageTerm}</div>
            <div class="poyori-breed-tag">${(creature.breedName || creature.breed || 'Pet').toUpperCase()}</div>
            <div class="poyori-mood-tag ${mood}">${getPixelIconHtml(moodIcon, 10)} ${getTerm('mood', mode)}: ${isPocket ? 'Resting' : moodTerm}</div>
            <div class="poyori-mode-badge" style="font-size: 7px; font-weight: bold; margin-top: 3px; color: ${isHardcore ? '#d63031' : '#0984e3'}; letter-spacing: 0.5px;">${isHardcore ? '[HARDCORE]' : '[COZY]'}</div>
          </div>
          <!-- Center/Right Creature Sprite & Name Display -->
          <div class="poyori-portrait-creature-center">
            <img class="poyori-screen-sprite ${isPocket ? 'pocket-sleeping' : ''}" id="status-pet-sprite" src="${spriteSvg}" alt="${creature.name}" style="cursor: pointer; width: ${(this.state.settings && this.state.settings.petSizePx) || 64}px; height: ${(this.state.settings && this.state.settings.petSizePx) || 64}px; ${isPocket ? 'opacity: 0.75; filter: drop-shadow(0 0 4px rgba(0,0,0,0.5));' : ''}" title="Click Poyori to toggle Pocket Mode (resting companion)!">
            <div class="poyori-pet-name">${escapeHtml(pet.name) || creature.name} ${getPixelIconHtml(pet.gender === 'male' ? 'gender_male' : 'gender_female', 10)} <button class="poyori-rename-btn" id="rename-pet-btn" title="Rename Companion" style="background:none;border:none;cursor:pointer;font-size:8px;color:var(--screen-text,#0f380f);opacity:0.8;">[edit]</button> ${pet.isKomyo ? getPixelIconHtml('star', 12) : ''}</div>
            <div class="poyori-creature-species">${creature.name} (${creature.jaName})</div>
          </div>
        </div>

        <!-- In-Screen Direct Care Action Bar -->
        <div class="poyori-direct-care-bar">
          ${pet.isSick ? `
            <button class="poyori-care-btn cure pulse-sick" id="care-cure-btn" title="Administer Yakusō Herbal Medicine">
              ${getPixelIconHtml('cross', 14)} <span>薬草 Cure</span>
            </button>
          ` : ''}
          <button class="poyori-care-btn feed" id="care-feed-btn" title="Feed Pet">
            ${getPixelIconHtml('apple', 14)} <span>${getTerm('feed', mode)}</span>
          </button>
          <button class="poyori-care-btn pet" id="care-pet-btn" title="Pet Poyori">
            ${getPixelIconHtml('hand_pet', 14)} <span>${getTerm('pet', mode)}</span>
          </button>
          <button class="poyori-care-btn sleep" id="care-sleep-btn" title="${pet.isSleeping ? getTerm('wake', mode) : getTerm('sleep', mode)}">
            ${getPixelIconHtml('sleep_zzz', 14)} <span>${pet.isSleeping ? getTerm('wake', mode).split(' ')[0] : getTerm('sleep', mode).split(' ')[0]}</span>
          </button>
          <button class="poyori-care-btn pocket ${isPocket ? 'active' : ''}" id="care-pocket-btn" title="Toggle Pocket Mode (Tuck Poyori into pocket / Resume roaming)">
            ${getPixelIconHtml('handheld_device', 14)} <span>${isPocket ? 'Pocket (ON)' : 'Pocket'}</span>
          </button>
        </div>

        <div class="poyori-vitals-card">
          <div class="poyori-vital-row">
            <span class="v-label">${getTerm('hunger', mode)}:</span>
            <span class="v-val">${onakaHearts} (${pet.onaka}%)</span>
          </div>
          <div class="poyori-vital-row">
            <span class="v-label">${getTerm('energy', mode)}:</span>
            <span class="v-val">${genkiBars} (${pet.genki}%)</span>
          </div>
          <div class="poyori-vital-row">
            <span class="v-label">${getTerm('bond', mode)}:</span>
            <span class="v-val">${getPixelIconHtml('sakura', 12)} ${pet.kizuna}%</span>
          </div>
          <div class="poyori-vital-row">
            <span class="v-label">${getTerm('streak', mode)}:</span>
            <span class="v-val">${getPixelIconHtml('flame', 12)} ${this.state.stats.currentStreak} Days</span>
          </div>
          <div class="poyori-vital-row">
            <span class="v-label">${getTerm('branchDenki', mode).split('/')[0]}:</span>
            <span class="v-val">${branchTerm}</span>
          </div>
          <div class="poyori-vital-row">
            <span class="v-label">${getTerm('coins', mode)}:</span>
            <span class="v-val">${getPixelIconHtml('coin', 12)} ${this.state.koban}</span>
          </div>

          <div class="poyori-vital-row">
            <span class="v-label">Level:</span>
            <span class="v-val">Lv. ${pet.level || 1} (${pet.xp} XP)</span>
          </div>
          <div class="poyori-xp-bar-wrap">
            <div class="poyori-xp-label">
              <span>${getTerm('experience', mode)}</span>
              <span>${pet.xp} / ${stageMeta.minXp || 100}</span>
            </div>
            <div class="poyori-xp-track">
              <div class="poyori-xp-fill" style="width: ${Math.min(100, Math.round((pet.xp / (stageMeta.minXp || 100)) * 100))}%;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderTasksTab(mode) {
    const tasks = this.state.tasks || [];
    const quests = this.state.dailyQuests || [];

    const tasksHtml = tasks.map(t => `
      <div class="poyori-task-item ${t.completed ? 'done' : ''}" data-id="${t.id}">
        <input type="checkbox" class="task-check" ${t.completed ? 'checked' : ''} ${t.completed ? 'disabled' : ''}>
        <span class="task-title">${t.title}</span>
        <span class="task-reward">+${getPixelIconHtml('coin', 12)} ${t.coins || 15} ${getPixelIconHtml('apple', 12)}</span>
        <button class="task-del-btn" title="Delete">${getPixelIconHtml('cross', 10)}</button>
      </div>
    `).join('');

    const questsHtml = quests.map(q => {
      const current = q.currentMinutes !== undefined ? Math.round(q.currentMinutes) : q.currentCount;
      const target = q.targetMinutes !== undefined ? q.targetMinutes : q.targetCount;
      const pct = Math.min(100, Math.round((current / target) * 100));
      return `
        <div class="poyori-quest-item ${q.completed ? 'done' : ''}">
          <div class="quest-title">${q.title} (+${getPixelIconHtml('coin', 12)} ${q.coins})</div>
          <div class="quest-bar">
            <div class="quest-fill" style="width: ${pct}%;"></div>
          </div>
          <div class="quest-status">${current} / ${target} ${q.completed ? `${getPixelIconHtml('check', 12)} ${getTerm('complete', mode)}` : ''}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="poyori-tasks-view">
        <div class="poyori-subhead">${getPixelIconHtml('tasks_scroll', 14)} ${getTerm('trials', mode)}</div>
        
        <!-- Fixed Reward Task Creation Row -->
        <div class="poyori-add-task-row">
          <input type="text" id="new-task-input" placeholder="${getTerm('taskPlaceholder', mode)}" maxlength="45">
          <button id="add-task-btn">+ ${getTerm('addTask', mode)}</button>
        </div>
        <div class="task-fixed-reward-callout">
          <span>Fixed Quest Reward:</span>
          <span class="callout-badges">${getPixelIconHtml('coin', 12)} +10 Koban &nbsp; ${getPixelIconHtml('apple', 12)} +1 Ringo</span>
        </div>

        <div class="poyori-task-list">
          ${tasks.length ? tasksHtml : `<div class="empty-msg">${getTerm('noTasks', mode)}</div>`}
        </div>

        <div class="poyori-subhead" style="margin-top: 10px;">${getPixelIconHtml('star', 14)} ${getTerm('dailyQuests', mode)}</div>
        <div class="poyori-quest-list">
          ${questsHtml}
        </div>
      </div>
    `;
  }

  renderFoodTab(mode) {
    const inv = this.state.inventory || {};
    const itemsHtml = Object.values(FOOD_ITEMS).map(item => {
      const count = inv[item.id] || 0;
      return `
        <div class="poyori-food-card" data-id="${item.id}">
          <div class="food-icon">${getPixelIconHtml(item.iconKey || 'apple', 22)}</div>
          <div class="food-info">
            <div class="food-name">${item.name} (${item.jaName})</div>
            <div class="food-desc">${item.desc}</div>
            <div class="food-boosts">+Onaka ${item.hungerRestore}% | +Genki ${item.energyRestore}%</div>
          </div>
          <div class="food-action">
            <span class="food-count">x${count}</span>
            <button class="feed-btn" ${count <= 0 ? 'disabled' : ''}>${getTerm('feed', mode)}</button>
            <button class="buy-food-btn price-indicator-badge" data-id="${item.id}" data-cost="${item.cost || 10}" title="Buy with Koban" ${this.state.koban < (item.cost || 10) ? 'disabled' : ''}>
              <span class="price-coin-icon">${getPixelIconHtml('coin', 10)}</span>
              <span class="price-value">${item.cost || 10}</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="poyori-food-view">
        <div class="poyori-subhead">${getPixelIconHtml('apple', 14)} ${getTerm('feed', mode)} (Inventory)</div>
        <div class="poyori-food-grid">
          ${itemsHtml}
        </div>
      </div>
    `;
  }

  renderZukanTab(mode) {
    const discovered = this.state.stats.evolutionsDiscovered || [];
    const creaturesHtml = Object.values(CREATURES).filter(c => !c.isAlias).map(c => {
      const isKnown = discovered.includes(c.id);
      const sprite = isKnown ? getCreatureSprite(c.id, 'idle1') : '';
      return `
        <div class="poyori-zukan-entry ${isKnown ? 'discovered' : 'undiscovered'}">
          <div class="zukan-img">
            ${isKnown ? `<img src="${sprite}" alt="${c.name}">` : getPixelIconHtml('mystery', 24)}
          </div>
          <div class="zukan-meta">
            <div class="zukan-name">${isKnown ? `${c.name} (${c.jaName})` : '???'}</div>
            <div class="zukan-branch">${c.branch.toUpperCase()}・Stage ${c.stage} ${c.isKomyo ? `${getPixelIconHtml('star', 12)} Kōmyō` : ''}</div>
            <div class="zukan-desc">${isKnown ? c.desc : 'Keep studying and raising Poyori to unlock.'}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="poyori-zukan-view">
        <div class="poyori-subhead">${getPixelIconHtml('book_zukan', 14)} ${getTerm('bestiary', mode)} (Mochimori Almanac)</div>
        <div class="zukan-info-banner">
          7+ day streak unlocks the radiant <b>Kōmyō (光明)</b> form!
        </div>
        <div class="poyori-zukan-list">
          ${creaturesHtml}
        </div>
      </div>
    `;
  }

  renderWardrobeTab(mode) {
    const pet = this.state.pet;
    const unlocked = pet.unlockedAccessories || ['none'];

    const accessoriesHtml = Object.values(ACCESSORIES).map(acc => {
      const isOwned = unlocked.includes(acc.id);
      const isEquipped = pet.accessory === acc.id;
      return `
        <div class="poyori-wardrobe-item">
          <div class="wardrobe-icon">${getPixelIconHtml(acc.iconKey || 'crown', 22)}</div>
          <div class="wardrobe-info">
            <div class="wardrobe-name">${acc.name} (${acc.jaName})</div>
            <div class="wardrobe-cost ${isOwned ? '' : 'price-indicator-badge'}">
              ${isOwned ? getTerm('owned', mode) : `<span class="price-coin-icon">${getPixelIconHtml('coin', 10)}</span> <span class="price-value">${acc.cost}</span>`}
            </div>
          </div>
          <div class="wardrobe-action">
            ${isEquipped 
              ? `<span class="equipped-tag">${getTerm('active', mode)}</span>` 
              : isOwned 
                ? `<button class="equip-btn" data-id="${acc.id}">${getTerm('equip', mode)}</button>`
                : `<button class="buy-btn" data-id="${acc.id}" data-cost="${acc.cost}" ${this.state.koban < acc.cost ? 'disabled' : ''}>${getTerm('buy', mode)}</button>`
            }
          </div>
        </div>
      `;
    }).join('');

    const palettesHtml = Object.values(PALETTES).map(pal => `
      <button class="palette-swatch-btn ${pet.palette === pal.id ? 'active' : ''}" data-palette="${pal.id}" style="background: ${pal.screenBg}; color: ${pal.text || pal.dark}; border-color: ${pal.mid};">
        ${pal.name}
      </button>
    `).join('');

    return `
      <div class="poyori-wardrobe-view">
        <div class="poyori-subhead">${getPixelIconHtml('wardrobe_robe', 14)} ${getTerm('wardrobe', mode)} & Shop</div>
        <div class="poyori-wardrobe-grid">
          ${accessoriesHtml}
        </div>
        <div class="poyori-subhead" style="margin-top: 10px;">${getPixelIconHtml('handheld_device', 14)} Retro Screen Palettes</div>
        <div class="poyori-palette-row">
          ${palettesHtml}
        </div>
        <div class="poyori-subhead" style="margin-top: 10px;">${getPixelIconHtml('spark', 14)} Creature Theme Palettes</div>
        <div class="poyori-theme-grid">
          ${PoyoriEngine.getUnlockedCreatureThemes(pet).map(th => `
            <button class="theme-swatch-btn ${pet.theme === th.id ? 'active' : ''}" data-theme="${th.id}">
              ${th.name}
            </button>
          `).join('')}
        </div>

        <div class="poyori-subhead" style="margin-top: 10px;">${getPixelIconHtml('spark', 14)} Tamagotchi Display Size</div>
        <div class="size-preview-box">
          <div class="size-preview-stage">
            <img class="size-preview-sprite" src="${getCreatureSprite(pet.creatureId, 'idle1', pet.accessory, pet.theme || 'classic_default')}" alt="${escapeHtml(pet.name)}" style="width: ${(this.state.settings && this.state.settings.petSizePx) || 64}px; height: ${(this.state.settings && this.state.settings.petSizePx) || 64}px;">
          </div>
          <div class="poyori-size-grid">
            ${['small', 'normal', 'large', 'giant'].map(s => {
              const labels = { small: 'Small (48px)', normal: 'Normal (64px)', large: 'Large (80px)', giant: 'Giant (96px)' };
              const currentSize = (this.state.settings && this.state.settings.petSize) || 'normal';
              const isActive = currentSize === s;
              return `
                <button class="size-swatch-btn ${isActive ? 'active' : ''}" data-size="${s}">
                  ${labels[s]}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <div class="poyori-subhead" style="margin-top: 10px;">${getPixelIconHtml('book_zukan', 14)} Companion Roster</div>
        <div class="poyori-roster-list">
          ${(this.state.roster || []).map((comp, idx) => {
            const isAct = idx === (this.state.activeRosterIndex || 0);
            const cMeta = CREATURES[comp.creatureId] || CREATURES.coding_tamago || CREATURES.denki_tamago;
            const thumbSprite = getCreatureSprite(comp.creatureId, 'idle1', 'none', comp.theme || 'classic_default');
            const cleanSpecies = cMeta.name || comp.creatureId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `
              <div class="poyori-roster-item ${isAct ? 'active' : ''}">
                <img class="roster-avatar" src="${thumbSprite}" alt="${escapeHtml(comp.name)}">
                <div class="roster-info">
                  <div class="roster-name-row">
                    <span class="roster-name">${escapeHtml(comp.name)}</span>
                    <button class="roster-rename-btn" data-index="${idx}" title="Rename Companion">[rename]</button>
                  </div>
                  <div class="roster-sub-row">
                    <span class="roster-stage">${cleanSpecies} • Lv. ${comp.level || 1}</span>
                  </div>
                </div>
                <div class="roster-action">
                  ${isAct 
                    ? `<span class="roster-active-badge">${getPixelIconHtml('check', 10)} Active</span>`
                    : `<button class="switch-roster-btn" data-index="${idx}">Switch</button>`
                  }
                </div>
              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;
  }


  renderFocusTab(mode) {
    if (this.state && this.state.focusSession && this.state.focusSession.isActive) {
      const now = Date.now();
      const lastTick = this.state.focusSession.lastTickAt || this.state.focusSession.startTime || now;
      const elapsedSecs = Math.floor((now - lastTick) / 1000);
      if (elapsedSecs > 0) {
        this.state.focusSession.remainingSeconds = Math.max(0, this.state.focusSession.remainingSeconds - elapsedSecs);
        this.state.focusSession.lastTickAt = now;
        if (this.state.focusSession.remainingSeconds <= 0) {
          PoyoriEngine.completeFocusSession(this.state);
        }
        if (this.onStateChange) this.onStateChange(this.state);
      }
    }
    const session = this.state.focusSession || { isActive: false, discipline: 'coding', durationMinutes: 25, remainingSeconds: 1500, distractionsCount: 0 };
    const activeDiscipline = this.selectedFocusDiscipline || session.discipline || (this.state.pet.activeDisciplines && this.state.pet.activeDisciplines[0]) || 'coding';
    const branches = BRANCHES || {};

    const mins = Math.floor((session.remainingSeconds || 0) / 60);
    const secs = (session.remainingSeconds || 0) % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const breedLineages = {
      coding: 'Cat Lineage',
      creative: 'Bird Lineage',
      literature: 'Fox Lineage',
      research: 'Owl Lineage',
      gaming: 'Wyvern Lineage',
      personal: 'Shiba Lineage'
    };

    if (session.isActive) {
      const branchInfo = branches[session.discipline] || {};
      const lineageName = breedLineages[session.discipline] || `${(branchInfo.breed || '').toUpperCase()} Lineage`;
      const elapsed = (session.durationSeconds || 1500) - (session.remainingSeconds || 0);
      const pct = Math.min(100, Math.round((elapsed / (session.durationSeconds || 1500)) * 100));
      return `
        <div class="poyori-focus-view">
          <div class="poyori-subhead">${getPixelIconHtml('spark', 14)} Focus Session Active</div>
          <div class="poyori-focus-timer-box active">
            <div class="focus-active-badge">${branchInfo.name || session.discipline} • ${lineageName}</div>
            <div class="poyori-focus-digits" id="focus-countdown">${timeStr}</div>
            
            <div class="focus-progress-wrap">
              <div class="focus-progress-bar" style="width: ${pct}%;"></div>
            </div>

            <div class="focus-guard-status">
              ${getPixelIconHtml('check', 10)} <span>Accountability Guard Active</span>
            </div>
            <div class="focus-distractions-pill">
              ${getPixelIconHtml('cross', 10)} <span>Distractions caught: <b>${session.distractionsCount || 0}</b></span>
            </div>

            <button class="stop-focus-btn" id="stop-focus-btn">Stop Focus Session</button>
          </div>

          <div class="focus-rewards-card active">
            <div class="rewards-card-header">${getPixelIconHtml('star', 12)} Guaranteed Completion Reward</div>
            <div class="rewards-row">
              <span class="reward-pill">${getPixelIconHtml('spark', 10)} +${Math.round((session.durationSeconds || 1500) / 30)} Discipline XP</span>
              <span class="reward-pill">${getPixelIconHtml('coin', 10)} +${Math.round((session.durationSeconds || 1500) / 60)} Koban</span>
            </div>
          </div>
        </div>
      `;
    }

    const disciplinesHtml = Object.values(branches).map(b => {
      const lineageName = breedLineages[b.id] || `${(b.breed || '').toUpperCase()} Lineage`;
      return `
        <button class="discipline-btn ${activeDiscipline === b.id ? 'active' : ''}" data-discipline="${b.id}">
          <div class="discipline-title-row">
            ${getPixelIconHtml(b.iconKey || 'spark', 14)}
            <span class="discipline-name">${b.name.split(' ')[0]}</span>
          </div>
          <span class="discipline-lineage">${lineageName}</span>
        </button>
      `;
    }).join('');

    const dur = this.focusDuration || 25;

    return `
      <div class="poyori-focus-view">
        <div class="poyori-subhead">${getPixelIconHtml('spark', 14)} Focus Accountability Timer</div>
        
        <div class="poyori-focus-timer-box">
          <div class="focus-section-label">Choose Focus Discipline:</div>
          <div class="poyori-discipline-grid">
            ${disciplinesHtml}
          </div>

          <div class="focus-section-label" style="margin-top: 10px;">Session Duration:</div>
          <div class="duration-selector">
            <button class="duration-btn ${dur === 15 ? 'active' : ''}" data-mins="15">15m</button>
            <button class="duration-btn ${dur === 25 ? 'active' : ''}" data-mins="25">25m</button>
            <button class="duration-btn ${dur === 45 ? 'active' : ''}" data-mins="45">45m</button>
            <button class="duration-btn ${dur === 60 ? 'active' : ''}" data-mins="60">60m</button>
          </div>

          <button class="start-focus-btn" id="start-focus-btn">Start Focus Session</button>
        </div>

        <!-- Focus Session Rewards & Streak Card -->
        <div class="focus-rewards-card">
          <div class="rewards-card-header">${getPixelIconHtml('star', 12)} Session Completion Bonus</div>
          <div class="rewards-row">
            <span class="reward-pill">${getPixelIconHtml('spark', 10)} +${dur * 2} Discipline XP</span>
            <span class="reward-pill">${getPixelIconHtml('coin', 10)} +${dur} Koban</span>
          </div>
          <div class="focus-shield-status">
            ${getPixelIconHtml('shield', 10)} <span>Accountability Guard Active: Off-task tab nudges enabled</span>
          </div>
          <div class="focus-stats-row">
            <span>${getPixelIconHtml('flame', 10)} Streak: ${this.state.stats?.currentStreak || 0} Days</span>
            <span>${getPixelIconHtml('tasks_scroll', 10)} Total Focused: ${this.state.stats?.totalFocusMinutes || 0}m</span>
          </div>
        </div>
      </div>
    `;
  }

  renderSettingsTab(mode) {
    const s = this.state.settings;
    const blockedList = s.customBlockedSites || [];

    const blockedHtml = blockedList.map(domain => `
      <div class="blocked-site-tag" data-domain="${domain}">
        <span>${domain}</span>
        <button class="del-blocked-btn" title="Remove">${getPixelIconHtml('cross', 8)}</button>
      </div>
    `).join('');

    return `
      <div class="poyori-settings-view">
        <div class="poyori-subhead">${getPixelIconHtml('gear', 14)} ${getTerm('settings', mode)}</div>
        
        <!-- Language Switcher -->
        <div class="settings-row">
          <label>${getTerm('languageOption', mode)}:</label>
          <select id="setting-language">
            <option value="bilingual" ${s.languageMode === 'bilingual' ? 'selected' : ''}>Bilingual (Romaji + English)</option>
            <option value="japanese" ${s.languageMode === 'japanese' ? 'selected' : ''}>Japanese (日本語)</option>
            <option value="english" ${s.languageMode === 'english' ? 'selected' : ''}>English Only</option>
          </select>
        </div>

        <!-- NSFW Content Control Blocker -->
        <div class="settings-row">
          <label>${getTerm('nsfwControl', mode)}:</label>
          <div class="checkbox-line">
            <input type="checkbox" id="setting-nsfw-filter" ${s.nsfwFilterEnabled ? 'checked' : ''}>
            <span>Block all adult & NSFW websites</span>
          </div>
        </div>

        <!-- Custom Blocked Sites Manager -->
        <div class="settings-row">
          <label>${getTerm('blockedSites', mode)}:</label>
          <div class="poyori-add-blocked-row">
            <input type="text" id="new-blocked-input" placeholder="${getTerm('blockedPlaceholder', mode)}" maxlength="50">
            <button id="add-blocked-btn">+ Block</button>
          </div>
          <div class="poyori-blocked-tags-container">
            ${blockedList.length ? blockedHtml : '<div class="empty-msg">No custom sites blocked.</div>'}
          </div>
        </div>

        <!-- Consequence Mode -->
        <div class="settings-row">
          <label>${getTerm('consequenceOption', mode)}:</label>
          <select id="setting-consequence">
            <option value="cozy" ${s.consequenceMode === 'cozy' ? 'selected' : ''}>Cozy (Gentle, No Death)</option>
            <option value="hardcore" ${s.consequenceMode === 'hardcore' ? 'selected' : ''}>Hardcore (Permadeath / Gūtara Branch)</option>
          </select>
        </div>

        <!-- Audio Volume -->
        <div class="settings-row">
          <label>${getTerm('soundVolume', mode)}:</label>
          <input type="range" id="setting-volume" min="0" max="1" step="0.1" value="${s.soundVolume}">
        </div>

        <div class="settings-row">
          <label>${getTerm('muteAudio', mode)}:</label>
          <div class="checkbox-line">
            <input type="checkbox" id="setting-mute" ${s.soundMuted ? 'checked' : ''}>
            <span>Mute 8-bit sound effects</span>
          </div>
        </div>

        <!-- Bedtime -->
        <div class="settings-row">
          <label>${getTerm('nightBedtime', mode)}:</label>
          <div class="time-inputs">
            <input type="time" id="setting-bedtime-start" value="${s.bedtimeStart}">
            <span>to</span>
            <input type="time" id="setting-bedtime-end" value="${s.bedtimeEnd}">
          </div>
        </div>

        <!-- Classify Tab & Dashboard Link -->
        <div class="settings-row">
          <button id="classify-current-btn" class="poyori-btn-primary">${getTerm('classifyCurrent', mode)}</button>
        </div>

        <div class="settings-row" style="margin-top: 6px;">
          <button id="open-full-dash-btn" class="poyori-btn-primary" style="background: #0984e3;">${getPixelIconHtml('star', 14)} ${getTerm('openDashboard', mode)}</button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Close button
    const closeBtn = this.modalEl.querySelector('.poyori-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    // Secret 7-tap gesture on handheld title banner to launch Dev Access Port
    const titleBanner = this.modalEl.querySelector('.poyori-title-banner');
    let bannerClicks = 0;
    let lastBannerClick = 0;
    if (titleBanner) {
      titleBanner.style.cursor = 'pointer';
      titleBanner.addEventListener('click', () => {
        const now = Date.now();
        if (now - lastBannerClick < 1500) {
          bannerClicks++;
        } else {
          bannerClicks = 1;
        }
        lastBannerClick = now;

        if (bannerClicks >= 4 && bannerClicks < 7) {
          audioSynth.boop();
        } else if (bannerClicks >= 7) {
          bannerClicks = 0;
          audioSynth.shinkaFanfare();
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ action: 'open_dev_portal', auth: 'gesture' });
          } else if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
            window.location.href = chrome.runtime.getURL('dashboard/dev-portal.html?auth=gesture');
          }
        }
      });
    }

    // Navigation Tabs
    this.modalEl.querySelectorAll('.poyori-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        audioSynth.boop();
        this.render();
      });
    });

    // Console Button A: Cycle Tab
    const consoleBtnA = this.modalEl.querySelector('#console-btn-a');
    if (consoleBtnA) {
      consoleBtnA.addEventListener('click', () => {
        const tabs = ['status', 'tasks', 'food', 'zukan', 'wardrobe', 'focus', 'settings'];
        const currentIdx = tabs.indexOf(this.activeTab);
        this.activeTab = tabs[(currentIdx + 1) % tabs.length];
        audioSynth.boop();
        this.render();
      });
    }

    // Console Button B: Primary Action / Interact
    const consoleBtnB = this.modalEl.querySelector('#console-btn-b');
    if (consoleBtnB) {
      consoleBtnB.addEventListener('click', () => {
        if (this.activeTab === 'status') {
          // Pet pet
          audioSynth.purr();
          PoyoriEngine.pet(this.state);
          this.onPetAction('pet');
          this.onStateChange(this.state);
          this.render();
        } else if (this.activeTab === 'tasks') {
          // Complete first pending task
          const pending = (this.state.tasks || []).find(t => !t.completed);
          if (pending) {
            const res = PoyoriEngine.completeTask(this.state, pending.id);
            if (res.success) {
              audioSynth.taskDone();
              this.onPetAction('cheer');
              this.onStateChange(this.state);
              this.render();
            }
          }
        } else if (this.activeTab === 'food') {
          // Feed first available item
          const inv = this.state.inventory || {};
          const availableKey = Object.keys(inv).find(k => inv[k] > 0);
          if (availableKey) {
            const res = PoyoriEngine.feed(this.state, availableKey);
            if (res.success) {
              audioSynth.munch();
              this.onPetAction('feed');
              this.onStateChange(this.state);
              this.render();
            }
          }
        } else if (this.activeTab === 'wardrobe') {
          // Cycle palette
          const pals = Object.keys(PALETTES);
          const nextPal = pals[(pals.indexOf(this.state.pet.palette) + 1) % pals.length];
          this.state.pet.palette = nextPal;
          audioSynth.chirp();
          this.onStateChange(this.state);
          this.render();
        } else {
          audioSynth.chirp();
        }
      });
    }

    // Console Button C: Rest / Sleep Toggle
    const consoleBtnC = this.modalEl.querySelector('#console-btn-c');
    if (consoleBtnC) {
      consoleBtnC.addEventListener('click', () => {
        this.state.pet.isSleeping = !this.state.pet.isSleeping;
        if (this.state.pet.isSleeping) {
          audioSynth.boop();
        } else {
          audioSynth.chirp();
        }
        this.onStateChange(this.state);
        this.render();
      });
    }

    // In-Screen Direct Care Action Bar
    const careFeedBtn = this.modalEl.querySelector('#care-feed-btn');
    if (careFeedBtn) {
      careFeedBtn.addEventListener('click', () => {
        const inv = this.state.inventory || {};
        const availableFoodKey = Object.keys(inv).find(k => inv[k] > 0);
        if (availableFoodKey) {
          const res = PoyoriEngine.feed(this.state, availableFoodKey);
          if (res.success) {
            audioSynth.munch();
            this.onPetAction('feed');
            this.onStateChange(this.state);
            this.render();
          }
        } else {
          this.activeTab = 'food';
          audioSynth.boop();
          this.render();
        }
      });
    }

    const carePetBtn = this.modalEl.querySelector('#care-pet-btn');
    if (carePetBtn) {
      carePetBtn.addEventListener('click', () => {
        audioSynth.purr();
        PoyoriEngine.pet(this.state);
        this.isBlushing = true;
        this.onPetAction('pet');
        this.onStateChange(this.state);
        this.render();
        setTimeout(() => {
          this.isBlushing = false;
          this.render();
        }, 2500);
      });
    }

    const careSleepBtn = this.modalEl.querySelector('#care-sleep-btn');
    if (careSleepBtn) {
      careSleepBtn.addEventListener('click', () => {
        this.state.pet.isSleeping = !this.state.pet.isSleeping;
        this.state.pet.mood = this.state.pet.isSleeping ? 'sleepy' : PoyoriEngine.getPetMood(this.state);
        if (this.state.pet.isSleeping) {
          audioSynth.boop();
        } else {
          audioSynth.chirp();
        }
        this.onStateChange(this.state);
        this.render();
      });
    }

    // Toggle Pocket Mode from Handheld Device (Care Bar or Pet Avatar tap)
    const togglePocket = () => {
      const willBePocket = !(this.state.settings?.pocketMode || this.state.settings?.petVisible === false);
      this.state.settings = this.state.settings || {};
      this.state.settings.pocketMode = willBePocket;
      this.state.settings.petVisible = !willBePocket;
      this.state.pet.isSleeping = willBePocket;
      this.state.pet.mood = willBePocket ? 'sleepy' : PoyoriEngine.getPetMood(this.state);

      if (willBePocket) {
        audioSynth.boop();
      } else {
        audioSynth.chirp();
      }

      this.onStateChange(this.state);
      this.render();
    };

    const carePocketBtn = this.modalEl.querySelector('#care-pocket-btn');
    if (carePocketBtn) {
      carePocketBtn.addEventListener('click', togglePocket);
    }

    const statusSprite = this.modalEl.querySelector('#status-pet-sprite');
    if (statusSprite) {
      statusSprite.addEventListener('click', togglePocket);
    }

    // Fixed-Reward Task actions
    const addTaskBtn = this.modalEl.querySelector('#add-task-btn');
    const taskInput = this.modalEl.querySelector('#new-task-input');
    if (addTaskBtn && taskInput) {
      const doAdd = () => {
        const text = taskInput.value.trim();
        if (!text) return;
        const res = PoyoriEngine.addTask(this.state, text);
        if (res.success) {
          audioSynth.chirp();
          taskInput.value = '';
          this.onStateChange(this.state);
          this.render();
        }
      };
      addTaskBtn.addEventListener('click', doAdd);
      taskInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doAdd(); });
    }

    this.modalEl.querySelectorAll('.task-check').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const taskItem = e.target.closest('.poyori-task-item');
        const id = taskItem.dataset.id;
        const res = PoyoriEngine.completeTask(this.state, id);
        if (res.success) {
          audioSynth.taskDone();
          this.onPetAction('cheer');
          this.onStateChange(this.state);
          this.render();

          // Check if completing task triggered evolution
          const evoRes = PoyoriEngine.checkEvolution(this.state);
          if (evoRes && evoRes.evolved && this.celebrationModal) {
            const isHatch = evoRes.stage === 2;
            this.celebrationModal.show({
              type: isHatch ? 'hatch' : 'evolution',
              title: isHatch ? 'EGG HATCHED!' : (evoRes.isKomyo ? 'MYTHIC ASCENSION!' : 'EVOLUTION UNLOCKED!'),
              subtitle: isHatch ? '生まれ (Umare) - A New Life Begins!' : '神獣進化 (Shinju Shinka) - Divine Evolution!',
              name: `${evoRes.creature.name} (${evoRes.creature.jaName})`,
              badgeText: `STAGE ${evoRes.stage || 2} ・ ${evoRes.creature.branch.toUpperCase()}`,
              spriteUrl: getCreatureSprite(evoRes.newId, 'idle1', this.state.pet.accessory),
              description: evoRes.creature.desc || 'Your dedication and focused habits have guided Poyori to evolve!',
              actionLabel: 'Name & Continue!',
              enableNaming: true,
              currentName: this.state.pet.name,
              onAction: (newName) => {
                if (newName && newName.trim()) {
                  PoyoriEngine.setPetCustomName(this.state, newName.trim());
                  this.onStateChange(this.state);
                  this.render();
                }
              }
            });
            this.onStateChange(this.state);
            this.render();
          }
        }
      });
    });

    this.modalEl.querySelectorAll('.task-del-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const taskItem = e.target.closest('.poyori-task-item');
        const id = taskItem.dataset.id;
        this.state.tasks = this.state.tasks.filter(t => t.id !== id);
        audioSynth.boop();
        this.onStateChange(this.state);
        this.render();
      });
    });

    // Feeding
    this.modalEl.querySelectorAll('.feed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.poyori-food-card');
        const id = card.dataset.id;
        const res = PoyoriEngine.feed(this.state, id);
        if (res.success) {
          audioSynth.munch();
          this.onPetAction('feed');
          this.onStateChange(this.state);
          this.render();

          if (res.evolution && res.evolution.evolved && this.celebrationModal) {
            const evo = res.evolution;
            const isHatch = evo.stage === 2;
            this.celebrationModal.show({
              type: isHatch ? 'hatch' : 'evolution',
              title: isHatch ? 'EGG HATCHED!' : (evo.isKomyo ? 'MYTHIC ASCENSION!' : 'EVOLUTION UNLOCKED!'),
              subtitle: isHatch ? '生まれ (Umare) - A New Life Begins!' : '神獣進化 (Shinju Shinka) - Divine Evolution!',
              name: `${evo.creature.name} (${evo.creature.jaName})`,
              badgeText: `STAGE ${evo.stage || 2} ・ ${evo.creature.branch.toUpperCase()}`,
              spriteUrl: getCreatureSprite(evo.newId, 'idle1', this.state.pet.accessory),
              description: evo.creature.desc || 'Your dedication and focused habits have guided Poyori to evolve!',
              actionLabel: 'Name & Continue!',
              enableNaming: true,
              currentName: this.state.pet.name,
              onAction: (newName) => {
                if (newName && newName.trim()) {
                  PoyoriEngine.setPetCustomName(this.state, newName.trim());
                  this.onStateChange(this.state);
                  this.render();
                }
              }
            });
          }
        }
      });
    });

    // Wardrobe & Palettes
    this.modalEl.querySelectorAll('.equip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.pet.accessory = btn.dataset.id;
        audioSynth.chirp();
        this.onStateChange(this.state);
        this.render();
      });
    });

    this.modalEl.querySelectorAll('.buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cost = Number(btn.dataset.cost);
        const id = btn.dataset.id;
        if (this.state.koban >= cost) {
          this.state.koban -= cost;
          if (!this.state.pet.unlockedAccessories.includes(id)) {
            this.state.pet.unlockedAccessories.push(id);
          }
          this.onStateChange(this.state);
          this.render();

          // Celebratory cosmetic unlock modal!
          const accItem = ACCESSORIES[id];
          if (accItem && this.celebrationModal) {
            this.celebrationModal.show({
              type: 'cosmetic',
              title: 'NEW COSMETIC UNLOCKED!',
              subtitle: 'Omedetou! Rare Wardrobe Unlocked!',
              name: `${accItem.name} (${accItem.jaName})`,
              badgeText: 'SHOP TREASURE',
              spriteUrl: getPixelIconHtml(accItem.iconKey || 'crown', 64),
              description: `You saved ${cost} Koban to acquire this exquisite accessory! Dress Poyori to stand out on your productivity journeys.`,
              cost: cost,
              actionLabel: 'Equip Now!',
              onAction: () => {
                this.state.pet.accessory = id;
                this.onStateChange(this.state);
                this.render();
              }
            });
          }
        }
      });
    });

    this.modalEl.querySelectorAll('.palette-swatch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.pet.palette = btn.dataset.palette;
        audioSynth.chirp();
        this.onStateChange(this.state);
        this.render();
      });
    });

    // Settings: Language Mode (triggers re-render with full terminology)
    const langSelect = this.modalEl.querySelector('#setting-language');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        this.state.settings.languageMode = e.target.value;
        audioSynth.chirp();
        this.onStateChange(this.state);
        this.render();
      });
    }

    // Settings: NSFW Content Blocker
    const nsfwChk = this.modalEl.querySelector('#setting-nsfw-filter');
    if (nsfwChk) {
      nsfwChk.addEventListener('change', (e) => {
        this.state.settings.nsfwFilterEnabled = e.target.checked;
        audioSynth.boop();
        this.onStateChange(this.state);
      });
    }

    // Settings: Custom Blocked Sites
    const addBlockedBtn = this.modalEl.querySelector('#add-blocked-btn');
    const blockedInput = this.modalEl.querySelector('#new-blocked-input');
    if (addBlockedBtn && blockedInput) {
      const doAddBlocked = () => {
        let domain = blockedInput.value.trim().toLowerCase();
        domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0];
        if (!domain) return;
        this.state.settings.customBlockedSites = this.state.settings.customBlockedSites || [];
        if (!this.state.settings.customBlockedSites.includes(domain)) {
          this.state.settings.customBlockedSites.push(domain);
        }
        blockedInput.value = '';
        audioSynth.chirp();
        this.onStateChange(this.state);
        this.render();
      };
      addBlockedBtn.addEventListener('click', doAddBlocked);
      blockedInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doAddBlocked(); });
    }

    this.modalEl.querySelectorAll('.del-blocked-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tag = e.target.closest('.blocked-site-tag');
        const domain = tag.dataset.domain;
        this.state.settings.customBlockedSites = (this.state.settings.customBlockedSites || []).filter(d => d !== domain);
        audioSynth.boop();
        this.onStateChange(this.state);
        this.render();
      });
    });

    const conSelect = this.modalEl.querySelector('#setting-consequence');
    if (conSelect) {
      conSelect.addEventListener('change', (e) => {
        this.state.settings.consequenceMode = e.target.value;
        this.onStateChange(this.state);
      });
    }

    const volSlider = this.modalEl.querySelector('#setting-volume');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        this.state.settings.soundVolume = Number(e.target.value);
        audioSynth.setVolume(this.state.settings.soundVolume);
        this.onStateChange(this.state);
      });
    }

    const muteChk = this.modalEl.querySelector('#setting-mute');
    if (muteChk) {
      muteChk.addEventListener('change', (e) => {
        this.state.settings.soundMuted = e.target.checked;
        audioSynth.setMuted(this.state.settings.soundMuted);
        this.onStateChange(this.state);
      });
    }

    const openDashBtn = this.modalEl.querySelector('#open-full-dash-btn');
    if (openDashBtn) {
      openDashBtn.addEventListener('click', () => {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
          chrome.runtime.openOptionsPage();
        } else if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
          window.open(chrome.runtime.getURL('dashboard/dashboard.html'));
        }
      });
    }

    // Rename Companion
    const renameBtn = this.modalEl.querySelector('#rename-pet-btn');
    if (renameBtn) {
      renameBtn.addEventListener('click', () => {
        const currentName = this.state.pet.name || 'Poyori';
        const newName = window.prompt('Enter a custom name for your companion (1-20 characters):', currentName);
        if (newName) {
          const res = PoyoriEngine.setPetCustomName(this.state, newName);
          if (res.success) {
            audioSynth.chirp();
            this.onStateChange(this.state);
            this.render();
          } else {
            alert('Invalid name. Must be 1 to 20 characters.');
          }
        }
      });
    }

    // Direct Care: Cure Illness
    const careCureBtn = this.modalEl.querySelector('#care-cure-btn');
    if (careCureBtn) {
      careCureBtn.addEventListener('click', () => {
        const inv = this.state.inventory || {};
        if (!inv.yakuso || inv.yakuso <= 0) {
          // If out of medicine, offer to buy for 15 Koban
          if (this.state.koban >= 15) {
            PoyoriEngine.buyFoodItem(this.state, 'yakuso');
          } else {
            alert('You need 15 Koban to purchase Yakusō (Herbal Medicine) from the market!');
            return;
          }
        }
        const res = PoyoriEngine.curePet(this.state);
        if (res.success) {
          audioSynth.shinkaFanfare();
          this.onPetAction('cheer');
          this.onStateChange(this.state);
          this.render();
        }
      });
    }

    // Focus Session Controls
    this.modalEl.querySelectorAll('.discipline-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedFocusDiscipline = btn.dataset.discipline;
        audioSynth.boop();
        this.render();
      });
    });

    this.modalEl.querySelectorAll('.duration-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.focusDuration = parseInt(btn.dataset.mins, 10);
        audioSynth.boop();
        this.render();
      });
    });

    const startFocusBtn = this.modalEl.querySelector('#start-focus-btn');
    if (startFocusBtn) {
      startFocusBtn.addEventListener('click', () => {
        const disc = this.selectedFocusDiscipline || (this.state.pet.activeDisciplines && this.state.pet.activeDisciplines[0]) || 'coding';
        const dur = this.focusDuration || 25;
        PoyoriEngine.startFocusSession(this.state, { discipline: disc, durationMinutes: dur });
        audioSynth.shinkaFanfare();
        this.onStateChange(this.state);
        this.render();
      });
    }

    const stopFocusBtn = this.modalEl.querySelector('#stop-focus-btn');
    if (stopFocusBtn) {
      stopFocusBtn.addEventListener('click', () => {
        this.stopFocusCountdown();
        PoyoriEngine.cancelFocusSession(this.state);
        audioSynth.boop();
        this.onStateChange(this.state);
        this.render();
      });
    }

    // Buy Food Item in Mochimori Market
    this.modalEl.querySelectorAll('.buy-food-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const res = PoyoriEngine.buyFoodItem(this.state, id);
        if (res.success) {
          audioSynth.taskDone();
          this.onStateChange(this.state);
          this.render();
        } else {
          audioSynth.boop();
        }
      });
    });

    // Creature Theme Swatches
    this.modalEl.querySelectorAll('.theme-swatch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const themeId = btn.dataset.theme;
        const res = PoyoriEngine.setCreatureTheme(this.state, themeId);
        if (res.success) {
          audioSynth.chirp();
          this.onStateChange(this.state);
          this.render();
        }
      });
    });

    // Switch Active Companion from Roster
    this.modalEl.querySelectorAll('.switch-roster-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const res = PoyoriEngine.switchActivePet(this.state, idx);
        if (res.success) {
          audioSynth.shinkaFanfare();
          this.onStateChange(this.state);
          this.render();
        }
      });
    });

    // Rename Companion in Roster
    this.modalEl.querySelectorAll('.roster-rename-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        const comp = this.state.roster && this.state.roster[idx];
        if (!comp) return;
        const newName = window.prompt(`Enter a custom name for ${comp.name} (1-20 characters):`, comp.name);
        if (newName && newName.trim()) {
          comp.name = newName.trim();
          if (idx === (this.state.activeRosterIndex || 0)) {
            this.state.pet.name = newName.trim();
          }
          audioSynth.chirp();
          this.onStateChange(this.state);
          this.render();
        }
      });
    });

    // Tamagotchi Display Size Swatches
    this.modalEl.querySelectorAll('.size-swatch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const size = btn.dataset.size;
        PoyoriEngine.setPetSize(this.state, size);
        audioSynth.boop();
        this.onStateChange(this.state);
        this.render();
      });
    });
  }
}
