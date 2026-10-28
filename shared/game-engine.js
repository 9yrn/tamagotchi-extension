/**
 * Poyori (ポヨリ) — Game Mechanics Engine
 * Manages stats decay, activity tracking, evolution branching, feeding, and streaks.
 */

import { STAGES, CREATURES, FOOD_ITEMS, ACCESSORIES, DOMAIN_PRESETS, NSFW_DOMAINS, NSFW_KEYWORDS, BLOCKED_SILLY_QUOTES, CREATURE_THEMES, BRANCHES, PET_SIZES } from './constants.js';

export class PoyoriEngine {
  /**
   * Evaluates the elapsed time since last tick and updates vitals
   */
  static processTick(state, currentTime = Date.now()) {
    const pet = state.pet;
    const elapsedMs = currentTime - (pet.lastTickAt || currentTime);
    const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
    
    if (elapsedMinutes < 1) return { state, changed: false };

    pet.lastTickAt = currentTime;

    // Check bedtime
    if (state.settings.nightModeEnabled && this.isBedtime(state.settings.bedtimeStart, state.settings.bedtimeEnd)) {
      pet.isSleeping = true;
    }

    // Hunger decay (approx 5% per hour when awake, 2% when asleep)
    const hungerDecayRate = pet.isSleeping ? 0.033 : 0.083; // points per minute
    pet.onaka = Math.max(0, Math.min(100, Math.round((pet.onaka - (elapsedMinutes * hungerDecayRate)) * 100) / 100));

    // Energy regeneration while sleeping, decay while awake
    if (pet.isSleeping) {
      pet.genki = Math.min(100, Math.round((pet.genki + (elapsedMinutes * 0.2)) * 100) / 100);
      // Wake up if full energy and not in scheduled bedtime
      if (pet.genki >= 95 && !this.isBedtime(state.settings.bedtimeStart, state.settings.bedtimeEnd)) {
        pet.isSleeping = false;
      }
    } else {
      // Gentle waking energy decay
      pet.genki = Math.max(0, Math.round((pet.genki - (elapsedMinutes * 0.02)) * 100) / 100);
    }

    // Sickness check
    if (pet.onaka <= 0) {
      if (!pet.isSick) {
        pet.isSick = true;
        pet.sickSince = currentTime;
      }
    } else if (pet.isSick && !pet.sickSince) {
      pet.sickSince = currentTime;
    }

    // Hardcore neglect consequence check
    if (state.settings.consequenceMode === 'hardcore' && pet.isSick) {
      const sickOrigin = pet.sickSince || pet.lastFedAt || currentTime;
      const sickDurationHours = (currentTime - sickOrigin) / (1000 * 60 * 60);
      if (sickDurationHours > 48) {
        // Pet runs away / tombstone event
        return {
          state,
          changed: true,
          event: { type: 'runaway', message: 'Poyori has run away due to prolonged neglect...' }
        };
      }
    }

    // Update emotional mood state
    pet.mood = this.getPetMood(state);

    return { state, changed: true };
  }

  /**
   * Checks if domain matches known NSFW domains or keywords
   */
  static isNsfwDomain(domain) {
    if (!domain) return false;
    const clean = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0];
    
    // Exact domain match or subdomain match
    if (NSFW_DOMAINS.some(d => clean === d || clean.endsWith('.' + d))) {
      return true;
    }
    
    // Keyword match
    if (NSFW_KEYWORDS.some(k => clean.includes(k))) {
      return true;
    }
    
    return false;
  }

  /**
   * Checks whether a site is blocked either by custom blocked list or by NSFW filter
   */
  static isBlocked(domain, state) {
    if (!domain || !state || !state.settings) return false;
    const clean = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0];

    // Check custom blocked sites list
    if (state.settings.customBlockedSites && Array.isArray(state.settings.customBlockedSites)) {
      for (const site of state.settings.customBlockedSites) {
        const cleanSite = site.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0];
        if (clean === cleanSite || clean.endsWith('.' + cleanSite)) {
          return true;
        }
      }
    }

    // Check NSFW filter
    if (state.settings.nsfwFilterEnabled && this.isNsfwDomain(clean)) {
      return true;
    }

    return false;
  }

  /**
   * Returns list of all silly blocked page quotes
   */
  static getBlockedQuotes() {
    return BLOCKED_SILLY_QUOTES;
  }

  /**
   * Returns a randomly selected silly blocked quote
   */
  static getRandomBlockedQuote() {
    const quotes = BLOCKED_SILLY_QUOTES;
    const idx = Math.floor(Math.random() * quotes.length);
    return quotes[idx];
  }

  /**
   * Evaluates current pet mood based on vitals, sickness, sleep, and neglect
   */
  static getPetMood(state) {
    if (!state || !state.pet) return 'cheerful';
    const pet = state.pet;

    if (pet.isSick) return 'sick';
    if (pet.isSleeping || pet.genki < 25) return 'sleepy';
    if (pet.onaka < 30 || pet.kizuna < 20) return 'grumpy';
    
    // Check neglect duration (if last fed or interacted > 8 hours ago while awake)
    const now = Date.now();
    const hoursSinceFed = (now - (pet.lastFedAt || now)) / (1000 * 60 * 60);
    const hoursSincePet = (now - (pet.lastInteractedAt || now)) / (1000 * 60 * 60);
    if (hoursSinceFed > 8 || hoursSincePet > 10) {
      return 'grumpy';
    }

    return 'cheerful';
  }

  /**
   * Adds a user task with fixed rewards (10 coins, 1 ringo)
   * Disallows setting custom rewards so users cannot cheat their own economy.
   */
  static addTask(state, title, options = {}) {
    if (!title || typeof title !== 'string' || !title.trim()) {
      return { success: false, message: 'Task title cannot be empty' };
    }

    const cleanTitle = title.trim();
    state.tasks = state.tasks || [];
    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${state.tasks.length + 1}`,
      title: cleanTitle,
      completed: false,
      reward: 'ringo', // FIXED REWARD: Always ringo, ignores options.reward
      coins: 10        // FIXED REWARD: Always 10 coins, ignores options.coins
    };

    state.tasks.push(newTask);
    return { success: true, task: newTask };
  }

  /**
   * Helper to determine if current time is within bedtime hours
   */
  static isBedtime(startStr = '22:30', endStr = '07:30') {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (startMins > endMins) {
      // Crosses midnight (e.g. 22:30 to 07:30)
      return currentMins >= startMins || currentMins < endMins;
    } else {
      return currentMins >= startMins && currentMins < endMins;
    }
  }

  /**
   * Classifies a domain into category:
   * 'denki' | 'chishiki' | 'monogatari' | 'distracting' | 'neutral'
   */
  static classifyDomain(domain, state) {
    if (!domain || !state || !state.settings) return 'neutral';

    const normalizeDomain = (d) => {
      if (!d) return '';
      return String(d).toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0];
    };

    const cleanDomain = normalizeDomain(domain);
    if (!cleanDomain) return 'neutral';

    // Helper: matches exact domain or any subdomain (e.g. docs.google.com matches google.com)
    const matchesDomain = (target, pattern) => {
      const normPattern = normalizeDomain(pattern);
      if (!target || !normPattern) return false;
      return target === normPattern || target.endsWith('.' + normPattern);
    };

    // Check user custom overrides first
    if (state.settings.customEducational && Array.isArray(state.settings.customEducational)) {
      for (const item of state.settings.customEducational) {
        if (!item || !item.domain) continue;
        if (matchesDomain(cleanDomain, item.domain)) return item.category;
      }
    }
    if (state.settings.customDistracting && Array.isArray(state.settings.customDistracting)) {
      for (const item of state.settings.customDistracting) {
        if (!item) continue;
        const rawPattern = typeof item === 'string' ? item : item.domain || '';
        if (matchesDomain(cleanDomain, rawPattern)) return 'distracting';
      }
    }

    // Check built-in presets
    for (const [branch, domains] of Object.entries(DOMAIN_PRESETS.educational)) {
      if (domains.some(d => matchesDomain(cleanDomain, d))) return branch;
    }
    if (DOMAIN_PRESETS.distracting.some(d => matchesDomain(cleanDomain, d))) {
      return 'distracting';
    }

    return 'neutral';
  }

  /**
   * Logs browsing duration on a domain and awards XP or inflicts fatigue
   */
  static recordBrowsing(state, domain, seconds) {
    const category = this.classifyDomain(domain, state);
    const minutes = seconds / 60;
    const pet = state.pet;

    const branchAlias = {
      denki: 'coding',
      chishiki: 'research',
      monogatari: 'literature',
      coding: 'denki',
      research: 'chishiki',
      literature: 'monogatari'
    };
    if (category === 'denki' || category === 'chishiki' || category === 'monogatari' || category === 'coding' || category === 'research' || category === 'literature') {
      // Educational site!
      state.stats.totalMinutesEdu = state.stats.totalMinutesEdu || {};
      state.stats.totalMinutesEdu[category] = (state.stats.totalMinutesEdu[category] || 0) + minutes;
      const counterpart = branchAlias[category];
      if (counterpart) {
        state.stats.totalMinutesEdu[counterpart] = (state.stats.totalMinutesEdu[counterpart] || 0) + minutes;
      }
      
      // Award slow, steady XP for educational browsing (approx 1 XP per 2 minutes, max 0.5/min)
      if (!pet.isSleeping && !pet.isSick) {
        const xpGain = minutes >= 2 ? Math.floor(minutes * 0.5) : (minutes >= 1 ? 1 : 0);
        if (xpGain > 0) {
          pet.xp += xpGain;
          pet.level = this.calculateLevel(pet.xp);
          if (Array.isArray(state.roster) && state.roster[state.activeRosterIndex || 0]) {
            state.roster[state.activeRosterIndex || 0].xp = pet.xp;
            state.roster[state.activeRosterIndex || 0].level = pet.level;
          }
        }
        pet.kizuna = Math.min(100, pet.kizuna + (minutes * 0.05));
      }

      // Update Daily Quests
      const eduQuest = state.dailyQuests.find(q => q.id === 'quest-edu');
      if (eduQuest && !eduQuest.completed) {
        eduQuest.currentMinutes += minutes;
        if (eduQuest.currentMinutes >= eduQuest.targetMinutes) {
          eduQuest.completed = true;
          state.koban += eduQuest.coins;
        }
      }
    } else if (category === 'distracting') {
      // Distracting site!
      state.stats.totalMinutesDistraction += minutes;
      
      // Fatigue accumulation
      if (!pet.isSleeping) {
        pet.genki = Math.max(0, pet.genki - Math.round(minutes * 1.5));
        
        // If energy hits zero or prolonged distraction, pet gets drowsy and dozes off
        if (pet.genki <= 15) {
          pet.isSleeping = true;
        }
      }
    }

    // Check for potential evolution
    return this.checkEvolution(state);
  }

  /**
   * Feeds Poyori with an item from inventory
   */
  static feed(state, itemId) {
    const item = FOOD_ITEMS[itemId];
    if (!item) return { success: false, message: 'Item not found' };
    if (!state.inventory[itemId] || state.inventory[itemId] <= 0) {
      return { success: false, message: 'Item out of stock' };
    }

    // Decrement inventory
    state.inventory[itemId]--;
    const pet = state.pet;

    // Apply boosts
    pet.onaka = Math.min(100, pet.onaka + (item.hungerRestore || 0));
    pet.genki = Math.min(100, pet.genki + (item.energyRestore || 0));
    pet.kizuna = Math.min(100, pet.kizuna + (item.kizunaBoost || 0));
    if (item.xpBoost) {
      pet.xp += item.xpBoost;
      pet.level = this.calculateLevel(pet.xp);
      if (Array.isArray(state.roster) && state.roster[state.activeRosterIndex || 0]) {
        state.roster[state.activeRosterIndex || 0].xp = pet.xp;
        state.roster[state.activeRosterIndex || 0].level = pet.level;
      }
    }

    if (item.curesIllness && pet.isSick) {
      pet.isSick = false;
      pet.sickSince = null;
    }

    pet.lastFedAt = Date.now();
    pet.lastInteractedAt = Date.now();

    // Check if egg hatches upon first feeding/care
    let evolution = null;
    if (pet.stage === 1 && !pet.isHatched && pet.kizuna >= 25) {
      pet.isHatched = true;
      evolution = this.checkEvolution(state, true);
    }

    pet.mood = this.getPetMood(state);
    return { success: true, item, pet, evolution };
  }

  /**
   * Cures pet illness using Yakusō medicine from inventory
   */
  static curePet(state) {
    if (!state || !state.pet) return { success: false, reason: 'no_pet' };
    if (!state.pet.isSick) return { success: true, alreadyHealthy: true };
    if (!state.inventory || !state.inventory.yakuso || state.inventory.yakuso <= 0) {
      return { success: false, reason: 'no_medicine' };
    }
    return this.feed(state, 'yakuso');
  }

  /**
   * Purchases food / provision item from Mochimori Market
   */
  static buyFoodItem(state, itemId) {
    const item = FOOD_ITEMS[itemId];
    if (!item) return { success: false, reason: 'item_not_found' };
    const cost = item.cost || 10;
    if (state.koban < cost) {
      return { success: false, reason: 'insufficient_koban', cost, balance: state.koban };
    }
    state.koban -= cost;
    state.inventory[itemId] = (state.inventory[itemId] || 0) + 1;
    return { success: true, item, balance: state.koban, count: state.inventory[itemId] };
  }

  /**
   * Petting action to boost affection
   */
  static pet(state) {
    const pet = state.pet;
    pet.kizuna = Math.min(100, pet.kizuna + 3);
    pet.lastInteractedAt = Date.now();
    pet.lastPettedAt = Date.now();
    
    // Hatch egg if petted enough
    let evolution = null;
    if (pet.stage === 1 && !pet.isHatched && pet.kizuna >= 25) {
      pet.isHatched = true;
      evolution = this.checkEvolution(state, true);
    }

    pet.mood = this.getPetMood(state);
    return { success: true, pet, evolution };
  }

  /**
   * Evaluates life stage progression and branch evolution
   */
  static checkEvolution(state, forceHatch = false) {
    const pet = state.pet;
    const currentStageIndex = pet.stage - 1;
    const currentStageMeta = STAGES[currentStageIndex];
    const nextStageMeta = STAGES[currentStageIndex + 1];

    // Check 7-day streak for Kōmyō radiant form (eligible once reaching Adult stage 5+)
    if (pet.stage >= 5 && !pet.isKomyo && state.stats.currentStreak >= 7) {
      const komyoRes = this.triggerKomyo(state);
      if (komyoRes && komyoRes.evolved) return komyoRes;
    }

    if (!nextStageMeta) {
      return { evolved: false };
    }

    // Conditions to advance to next stage:
    // Need enough XP, milestone level reached, or forced hatching
    const canEvolve = forceHatch || this.isEligibleForEvolution(pet) || (pet.xp >= nextStageMeta.minXp);

    if (!canEvolve) return { evolved: false };

    // Determine branch based on dominant study time or consistent breed lineage
    const currentCreature = CREATURES[pet.creatureId];
    let branch = pet.chosenBranch;
    if (pet.stage > 1) {
      branch = (currentCreature && currentCreature.branch) || pet.chosenBranch;
    } else {
      // Stage 1 (Egg): if specific new breed egg (e.g. coding_tamago, creative_tamago), honor breed;
      // otherwise evaluate player's study time
      if (currentCreature && currentCreature.branch && currentCreature.branch !== 'denki' && currentCreature.branch !== 'gutara') {
        branch = currentCreature.branch;
      } else {
        branch = this.determineDominantBranch(state) || (pet.activeDisciplines && pet.activeDisciplines[0]) || 'denki';
      }
    }
    const branchMap = { denki: 'coding', chishiki: 'research', monogatari: 'literature' };
    pet.chosenBranch = branch;
    pet.stage = nextStageMeta ? nextStageMeta.level : pet.stage;
    if (pet.stage >= 2) {
      pet.isHatched = true;
    }

    // Find creature matching branch and new stage
    const newCreature = Object.values(CREATURES).find(
      c => c.branch === branch && c.stage === pet.stage && !c.isKomyo
    ) || Object.values(CREATURES).find(
      c => (c.branch === branchMap[branch] || branchMap[c.branch] === branch) && c.stage === pet.stage && !c.isKomyo
    ) || Object.values(CREATURES).find(c => c.stage === pet.stage && !c.isKomyo);

    if (newCreature && newCreature.id !== pet.creatureId) {
      const prevId = pet.creatureId;
      pet.creatureId = newCreature.id;
      if (!state.stats.evolutionsDiscovered.includes(newCreature.id)) {
        state.stats.evolutionsDiscovered.push(newCreature.id);
      }
      if (Array.isArray(state.roster) && state.roster[state.activeRosterIndex || 0]) {
        const activeComp = state.roster[state.activeRosterIndex || 0];
        activeComp.creatureId = newCreature.id;
        activeComp.name = pet.name;
        activeComp.stage = pet.stage;
        activeComp.level = pet.level || 1;
        activeComp.xp = pet.xp || 0;
      }
      return {
        evolved: true,
        previousId: prevId,
        newId: newCreature.id,
        creature: newCreature,
        stage: pet.stage
      };
    }

    return { evolved: false };
  }

  /**
   * Evaluates dominant educational branch
   */
  static determineDominantBranch(state) {
    // If in hardcore mode and excessive distraction/neglect
    if (state.settings.consequenceMode === 'hardcore') {
      const totalEdu = (state.stats.totalMinutesEdu.denki || 0) +
                       (state.stats.totalMinutesEdu.chishiki || 0) +
                       (state.stats.totalMinutesEdu.monogatari || 0);
      if (state.stats.totalMinutesDistraction > totalEdu * 2 && state.stats.totalMinutesDistraction > 30) {
        return 'gutara';
      }
    }

    const { denki = 0, chishiki = 0, monogatari = 0 } = state.stats.totalMinutesEdu;
    if (denki >= chishiki && denki >= monogatari) return 'denki';
    if (chishiki >= denki && chishiki >= monogatari) return 'chishiki';
    return 'monogatari';
  }

  /**
   * Unlocks the 7-day streak Kōmyō (Radiant) form
   */
  static triggerKomyo(state) {
    const pet = state.pet;
    const rawBranch = pet.chosenBranch || 'coding';
    const branchMap = {
      denki: 'coding',
      chishiki: 'research',
      monogatari: 'literature',
      gutara: 'personal',
      coding: 'denki',
      research: 'chishiki',
      literature: 'monogatari',
      personal: 'gutara'
    };
    // Prioritize exact raw branch match (e.g. 'denki' -> 'komyo_raijin', 'coding' -> 'coding_radiant')
    let komyoCreature = Object.values(CREATURES).find(
      c => c.branch === rawBranch && c.isKomyo
    );
    if (!komyoCreature) {
      const canonicalBranch = branchMap[rawBranch];
      komyoCreature = Object.values(CREATURES).find(
        c => c.branch === canonicalBranch && c.isKomyo
      );
    }

    if (komyoCreature && pet.creatureId !== komyoCreature.id) {
      const prevId = pet.creatureId;
      pet.isKomyo = true;
      pet.creatureId = komyoCreature.id;
      pet.stage = 6;
      if (!state.stats.evolutionsDiscovered.includes(komyoCreature.id)) {
        state.stats.evolutionsDiscovered.push(komyoCreature.id);
      }
      if (Array.isArray(state.roster) && state.roster[state.activeRosterIndex || 0]) {
        const activeComp = state.roster[state.activeRosterIndex || 0];
        activeComp.creatureId = komyoCreature.id;
        activeComp.name = pet.name;
        activeComp.stage = 6;
      }
      return {
        evolved: true,
        isKomyo: true,
        previousId: prevId,
        newId: komyoCreature.id,
        creature: komyoCreature
      };
    }
    return { evolved: false };
  }

  /**
   * Completes a task, awards reward items & pixel coins
   */
  static completeTask(state, taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || task.completed) return { success: false };

    task.completed = true;
    state.stats.totalTasksDone++;
    
    // Award coins
    state.koban = (state.koban || 0) + (task.coins || 10);

    // Award item reward
    if (task.reward && FOOD_ITEMS[task.reward]) {
      state.inventory[task.reward] = (state.inventory[task.reward] || 0) + 1;
    }

    // Boost Kizuna and XP
    state.pet.xp += 25;
    state.pet.kizuna = Math.min(100, state.pet.kizuna + 5);

    // Update daily quests
    const taskQuest = state.dailyQuests.find(q => q.id === 'quest-task');
    if (taskQuest && !taskQuest.completed) {
      taskQuest.currentCount = (taskQuest.currentCount || 0) + 1;
      if (taskQuest.currentCount >= taskQuest.targetCount) {
        taskQuest.completed = true;
        state.koban += taskQuest.coins;
      }
    }

    return { success: true, task, reward: task.reward, coins: task.coins };
  }

  /**
   * Returns YYYY-MM-DD representing local calendar date (respecting player timezone)
   */
  static getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Daily streak maintenance check
   */
  static checkDailyStreak(state) {
    const today = this.getLocalDateString();
    const lastActive = state.stats.lastActiveDate;

    if (today === lastActive) return false;

    const yDate = new Date();
    yDate.setDate(yDate.getDate() - 1);
    const yesterday = this.getLocalDateString(yDate);
    if (lastActive === yesterday) {
      state.stats.currentStreak += 1;
      if (state.stats.currentStreak > state.stats.bestStreak) {
        state.stats.bestStreak = state.stats.currentStreak;
      }
    } else {
      // Missed a day
      state.stats.currentStreak = 1;
    }

    state.stats.lastActiveDate = today;

    // Reset daily quests
    state.dailyQuests.forEach(q => {
      q.completed = false;
      if (q.currentMinutes !== undefined) q.currentMinutes = 0;
      if (q.currentCount !== undefined) q.currentCount = 0;
    });

    return true;
  }

  // ==========================================
  // DEV ACCESS PORT & GOD MODE HELPER METHODS
  // ==========================================

  /**
   * Applies God Mode presets for developer inspection:
   * 99,999 Koban, all 24 creatures discovered, all accessories unlocked,
   * max food inventory, max vitals, and streak advancement.
   */
  static applyDevGodMode(state) {
    if (!state) return { success: false };
    this.enterDevSandbox(state);
    state.koban = 99999;

    // All foods to 99
    state.inventory = state.inventory || {};
    Object.keys(FOOD_ITEMS).forEach(k => {
      state.inventory[k] = 99;
    });

    // All 24 creatures discovered in Mochimori Bestiary
    state.stats = state.stats || {};
    state.stats.evolutionsDiscovered = Object.keys(CREATURES);

    // All accessories unlocked
    state.pet = state.pet || {};
    state.pet.unlockedAccessories = Object.keys(ACCESSORIES);

    // All 5 retro screen palettes unlocked
    state.pet.unlockedPalettes = ['rpg_parchment', 'classic_lcd', 'gameboy_pocket', 'cyber_neon', 'sakura_retro'];

    // All creature color theme palettes unlocked
    if (typeof CREATURE_THEMES !== 'undefined') {
      state.pet.unlockedThemes = Object.keys(CREATURE_THEMES);
      if (Array.isArray(state.roster)) {
        state.roster.forEach(c => { c.unlockedThemes = Object.keys(CREATURE_THEMES); });
      }
    }

    // Max vitals & cured sickness
    state.pet.onaka = 100;
    state.pet.genki = 100;
    state.pet.kizuna = 100;
    state.pet.xp = 500;
    state.pet.isSick = false;
    state.pet.isSleeping = false;
    state.stats.currentStreak = Math.max(state.stats.currentStreak || 1, 7);

    state.pet.mood = this.getPetMood(state);
    return { success: true, message: 'God Mode Activated' };
  }

  /**
   * Instantly morphs the pet to ANY of the 24 creatures across all branches & stages
   */
  static morphPet(state, creatureId) {
    if (!state || !state.pet) return { success: false, message: 'No pet state' };
    const creature = CREATURES[creatureId];
    if (!creature) return { success: false, message: `Creature ${creatureId} not found` };

    state.pet.creatureId = creature.id;
    state.pet.name = creature.name;
    state.pet.stage = creature.stage;
    state.pet.chosenBranch = creature.branch;
    state.pet.isKomyo = !!creature.isKomyo;
    state.pet.isHatched = creature.stage > 1;

    state.stats = state.stats || {};
    state.stats.evolutionsDiscovered = state.stats.evolutionsDiscovered || [];
    if (!state.stats.evolutionsDiscovered.includes(creature.id)) {
      state.stats.evolutionsDiscovered.push(creature.id);
    }

    if (Array.isArray(state.roster) && state.roster[state.activeRosterIndex || 0]) {
      const activeComp = state.roster[state.activeRosterIndex || 0];
      activeComp.creatureId = creature.id;
      activeComp.name = creature.name;
      activeComp.stage = creature.stage;
      activeComp.level = state.pet.level || 1;
      activeComp.xp = state.pet.xp || 0;
    }

    state.pet.mood = this.getPetMood(state);
    return { success: true, creature, pet: state.pet };
  }

  /**
   * Sets arbitrary vitals to test boundary conditions (e.g., starving, exhaustion, sickness)
   */
  static setDevVitals(state, vitals = {}) {
    if (!state || !state.pet) return { success: false };
    const pet = state.pet;
    if (vitals.onaka !== undefined) pet.onaka = Math.max(0, Math.min(100, vitals.onaka));
    if (vitals.genki !== undefined) pet.genki = Math.max(0, Math.min(100, vitals.genki));
    if (vitals.kizuna !== undefined) pet.kizuna = Math.max(0, Math.min(100, vitals.kizuna));
    if (vitals.xp !== undefined) pet.xp = Math.max(0, vitals.xp);
    if (vitals.isSick !== undefined) pet.isSick = !!vitals.isSick;
    if (vitals.isSleeping !== undefined) pet.isSleeping = !!vitals.isSleeping;
    pet.mood = this.getPetMood(state);
    return { success: true, pet };
  }

  /**
   * Simulates neglect or streak advancement without waiting real hours/days
   */
  static simulateDevTimeDelta(state, hours, options = {}) {
    if (!state || !state.pet) return { success: false };
    const pet = state.pet;
    const ms = hours * 60 * 60 * 1000;
    pet.lastFedAt = (pet.lastFedAt || Date.now()) - ms;
    pet.lastInteractedAt = (pet.lastInteractedAt || Date.now()) - ms;
    pet.lastTickAt = (pet.lastTickAt || Date.now()) - ms;

    if (options.advanceStreak) {
      state.stats = state.stats || {};
      state.stats.currentStreak = (state.stats.currentStreak || 1) + options.advanceStreak;
      state.stats.bestStreak = Math.max(state.stats.bestStreak || 1, state.stats.currentStreak);
    }

    pet.mood = this.getPetMood(state);
    return { success: true, state };
  }

  /**
   * Enters Developer Sandbox mode by capturing a non-destructive backup snapshot
   * of the player's genuine progress, levels, Koban, and collection.
   */
  static enterDevSandbox(state) {
    if (!state) return { success: false };
    if (!state.devOriginalStateBackup) {
      const backup = JSON.parse(JSON.stringify(state));
      delete backup.devOriginalStateBackup;
      delete backup.isDevModeActive;
      state.devOriginalStateBackup = backup;
    }
    state.isDevModeActive = true;
    return { success: true, state };
  }

  /**
   * Exits Developer Sandbox mode and restores the original progress position,
   * reverting all creature morphs, Koban grants, and vitals back to player reality.
   */
  static exitDevSandbox(state) {
    if (!state) return { success: false };
    if (state.devOriginalStateBackup) {
      const backup = state.devOriginalStateBackup;
      if (backup.pet) state.pet = JSON.parse(JSON.stringify(backup.pet));
      if (backup.koban !== undefined) state.koban = backup.koban;
      if (backup.inventory) state.inventory = JSON.parse(JSON.stringify(backup.inventory));
      if (backup.stats) state.stats = JSON.parse(JSON.stringify(backup.stats));
      if (backup.tasks) state.tasks = JSON.parse(JSON.stringify(backup.tasks));
      if (backup.dailyQuests) state.dailyQuests = JSON.parse(JSON.stringify(backup.dailyQuests));
      if (backup.settings) state.settings = JSON.parse(JSON.stringify(backup.settings));
      if (backup.roster) state.roster = JSON.parse(JSON.stringify(backup.roster));
      if (backup.activeRosterIndex !== undefined) state.activeRosterIndex = backup.activeRosterIndex;
      delete state.devOriginalStateBackup;
      delete state.isDevModeActive;
      return { success: true, restored: true, state };
    }
    delete state.isDevModeActive;
    return { success: true, restored: false, state };
  }

  /**
   * Cryptographic SHA-256 hash implementation (FIPS 180-4 compliant).
   * Pure JS, zero-dependency, works in browser, worker, Shadow DOM, and Node.js.
   */
  static sha256(ascii) {
    if (typeof ascii !== 'string') return '';
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    const lengthProperty = 'length';
    let i, j;
    let result = '';

    const words = [];
    const asciiBitLength = ascii[lengthProperty] * 8;
    
    let hash = [];
    const k = [];
    let primeCounter = 0;

    const isPrime = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isPrime[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isPrime[i] = candidate;
        }
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    
    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength | 0);
    
    for (j = 0; j < words[lengthProperty];) {
      const w = words.slice(j, j += 16);
      const oldHash = hash;
      hash = hash.slice(0, 8);
      
      for (i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2];
        const a = hash[0], e = hash[4];
        const temp1 = hash[7]
          + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
          + ((e & hash[5]) ^ ((~e) & hash[6]))
          + k[i]
          + (w[i] = (i < 16) ? w[i] : (
              w[i - 16]
              + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
              + w[i - 7]
              + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
            ) | 0
          );
        const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
          + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      
      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }
    
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        const b = (hash[i] >> (j * 8)) & 255;
        result += ((b < 16) ? 0 : '') + b.toString(16);
      }
    }
    return result;
  }

  /**
   * Cryptographic SHA-256 hash digests of authorized developer passphrases.
   * Stored ONLY as one-way SHA-256 digests so repository source files
   * can be committed to public GitHub repositories with zero plaintext password exposure.
   */
  static DEV_KEY_HASHES = Object.freeze([
    '03a86b41099786f6c8fbdea7d102894e29845d36a5b1a40331be504c5c38d436', // Dev Hash A
    'a6f729fd5067563dc134d2e7fab567efa731fd86a4efe956ee67b816ce9b0891', // Dev Hash B
    'e150c2e5c5421f42105081b58c282ad5a89c30781c99bcfe71913a5adaa88b52', // Dev Hash C
    'ed33764a44839613a2e73e1e8a4b2118f96f7fefe6f702e096cf5b04ebe78f27', // Dev Hash D
    '975b485d52d93ea0f2d6e472b5e1086ac67fd8139d7f90b6b1e6a9e16bc57a5a'  // Dev Hash E
  ]);

  /**
   * Verifies developer secret access key by computing its SHA-256 digest
   * and comparing against authorized hash signatures.
   * Never stores or leaks plaintext passwords in the codebase.
   */
  static verifyDevKey(key, allowedHashes = PoyoriEngine.DEV_KEY_HASHES) {
    if (!key || typeof key !== 'string') return false;
    const cleanKey = key.trim().toLowerCase();
    const digest = this.sha256(cleanKey);
    return Array.isArray(allowedHashes) && allowedHashes.includes(digest);
  }

  /**
   * Exponential XP calculation for next level
   * Formula: floor(80 * Level^1.5)
   */
  static getXpForNextLevel(level) {
    const lvl = Math.max(1, parseInt(level, 10) || 1);
    return Math.floor(80 * Math.pow(lvl, 1.5));
  }

  /**
   * Cumulative XP required to reach a specific target level from Level 1
   */
  static getCumulativeXpForLevel(targetLevel) {
    const target = Math.max(1, parseInt(targetLevel, 10) || 1);
    let total = 0;
    for (let l = 1; l < target; l++) {
      total += this.getXpForNextLevel(l);
    }
    return total;
  }

  /**
   * Calculates current level from total accumulated XP
   */
  static calculateLevel(xp) {
    const totalXp = Math.max(0, parseInt(xp, 10) || 0);
    let lvl = 1;
    let cumulative = 0;
    while (true) {
      const nextReq = this.getXpForNextLevel(lvl);
      if (cumulative + nextReq <= totalXp) {
        cumulative += nextReq;
        lvl++;
      } else {
        break;
      }
    }
    return lvl;
  }

  /**
   * Evaluates if pet has reached milestone level to evolve to the next stage
   */
  static isEligibleForEvolution(pet) {
    if (!pet || pet.stage >= 6) return false;
    const nextStageMeta = STAGES.find(s => s.level === pet.stage + 1);
    if (!nextStageMeta) return false;
    const milestone = nextStageMeta.milestoneLevel || 1;
    return (pet.level || 1) >= milestone;
  }

  /**
   * Multi-discipline selection (up to 3 simultaneous study tracks)
   */
  static setActiveDisciplines(state, disciplines) {
    if (!state || !state.pet) return { success: false, reason: 'no_state' };
    if (!Array.isArray(disciplines) || disciplines.length === 0) {
      return { success: false, reason: 'invalid_disciplines' };
    }
    if (disciplines.length > 3) {
      return { success: false, reason: 'max_3_disciplines' };
    }
    state.pet.activeDisciplines = [...disciplines];
    return { success: true, activeDisciplines: state.pet.activeDisciplines };
  }

  /**
   * Starts a focused study / work Pomodoro session with chosen discipline
   */
  static startFocusSession(state, { discipline = 'coding', durationMinutes = 25 } = {}) {
    if (!state) return { success: false, reason: 'no_state' };
    const durationSeconds = Math.max(1, parseInt(durationMinutes, 10) || 25) * 60;
    const now = Date.now();
    state.focusSession = {
      isActive: true,
      discipline: discipline,
      durationSeconds: durationSeconds,
      remainingSeconds: durationSeconds,
      distractionsCount: 0,
      startTime: now,
      lastTickAt: now
    };
    return { success: true, session: state.focusSession };
  }

  /**
   * Real-time website accountability tick during active focus sessions
   */
  static processFocusTick(state, currentHostname = '', elapsedSeconds = 60) {
    if (!state || !state.focusSession || !state.focusSession.isActive) {
      return { success: false, reason: 'no_active_session' };
    }

    const session = state.focusSession;
    const discipline = session.discipline || 'coding';
    const branchMeta = (BRANCHES && BRANCHES[discipline]) || {};
    const disciplineName = branchMeta.name || (discipline.charAt(0).toUpperCase() + discipline.slice(1));

    const cleanHost = (currentHostname || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0];

    // Standard distracting sites
    const distractingSites = [
      'youtube.com', 'reddit.com', 'tiktok.com', 'twitter.com', 'x.com',
      'instagram.com', 'facebook.com', 'netflix.com', 'twitch.tv', 'pinterest.com',
      'bilibili.com', 'discord.com', 'weibo.com', '9gag.com', 'buzzfeed.com'
    ];

    // Check custom blocked sites and NSFW
    const isCustomBlocked = state.settings?.customBlockedSites?.some(site => {
      const cleanSite = site.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0];
      return cleanHost === cleanSite || cleanHost.endsWith('.' + cleanSite);
    });

    const isPresetDistracting = Boolean(
      DOMAIN_PRESETS && (
        (Array.isArray(DOMAIN_PRESETS.distracting) && DOMAIN_PRESETS.distracting.some(d => cleanHost === d || cleanHost.endsWith('.' + d))) ||
        (Array.isArray(DOMAIN_PRESETS.distraction) && DOMAIN_PRESETS.distraction.some(d => cleanHost === d || cleanHost.endsWith('.' + d)))
      )
    );

    const isDistraction = distractingSites.some(d => cleanHost === d || cleanHost.endsWith('.' + d)) ||
      isPresetDistracting ||
      isCustomBlocked ||
      this.isNsfwDomain(cleanHost);

    if (isDistraction) {
      session.distractionsCount = (session.distractionsCount || 0) + 1;
      const nudgeMessage = this.getFocusNudge(state, session.discipline);
      return {
        isOnTopic: false,
        nudgeNeeded: true,
        nudgeMessage,
        distractionsCount: session.distractionsCount
      };
    }

    // On-topic browsing advances timer and awards bonus XP
    session.remainingSeconds = Math.max(0, session.remainingSeconds - elapsedSeconds);
    session.lastTickAt = Date.now();
    const bonusXp = Math.max(1, Math.round(elapsedSeconds * 0.25));
    state.pet.xp = (state.pet.xp || 0) + bonusXp;
    state.pet.level = this.calculateLevel(state.pet.xp);

    return {
      isOnTopic: true,
      nudgeNeeded: false,
      bonusXp,
      remainingSeconds: session.remainingSeconds
    };
  }

  /**
   * Generates a third-person observational focus accountability nudge
   */
  static getFocusNudge(state, discipline = 'coding') {
    const petName = state?.pet?.name || 'Poyori';
    const discMeta = DOMAIN_PRESETS[discipline] || { name: 'Focus' };
    const disciplineName = discMeta.name || discipline;
    return `${petName} glances up curiously. This website doesn't look like ${disciplineName} focus study!`;
  }

  /**
   * Completes focus session successfully and awards Koban & bonus XP
   */
  static completeFocusSession(state) {
    if (!state || !state.focusSession || !state.focusSession.isActive) {
      return { success: false, reason: 'no_active_session' };
    }
    state.focusSession.isActive = false;
    state.focusSession.remainingSeconds = 0;
    
    // Reward: 50 Koban + 150 XP bonus
    const kobanReward = 50;
    const xpReward = 150;
    state.koban = (state.koban || 0) + kobanReward;
    state.pet.xp = (state.pet.xp || 0) + xpReward;
    state.pet.level = this.calculateLevel(state.pet.xp);
    state.pet.kizuna = Math.min(100, (state.pet.kizuna || 0) + 10);

    return {
      success: true,
      kobanReward,
      xpReward,
      session: state.focusSession
    };
  }

  /**
   * Cancels ongoing focus session without rewards
   */
  static cancelFocusSession(state) {
    if (!state || !state.focusSession) return { success: false };
    state.focusSession.isActive = false;
    return { success: true };
  }

  /**
   * Sets custom given name for the companion
   */
  static setPetCustomName(state, name) {
    if (!state || !state.pet) return { success: false, reason: 'no_pet' };
    if (!name || typeof name !== 'string') return { success: false, reason: 'invalid_name' };
    const trimmed = name.trim();
    if (trimmed.length < 1) return { success: false, reason: 'empty_name' };
    if (trimmed.length > 20) return { success: false, reason: 'name_too_long' };

    state.pet.name = trimmed;
    if (Array.isArray(state.roster) && state.roster[state.activeRosterIndex || 0]) {
      state.roster[state.activeRosterIndex || 0].name = trimmed;
    }
    return { success: true, name: trimmed };
  }

  /**
   * Sets pet visual roaming size
   * @param {Object} state
   * @param {string|number} size - 'small', 'normal', 'large', 'giant', or pixel number (48, 64, 80, 96)
   */
  static setPetSize(state, size) {
    if (!state) return { success: false, reason: 'no_state' };
    state.settings = state.settings || {};
    
    let sizeKey = 'normal';
    let px = 64;
    let scale = 1.0;

    if (typeof size === 'string' && PET_SIZES && PET_SIZES[size]) {
      sizeKey = size;
      px = PET_SIZES[size].px;
      scale = PET_SIZES[size].scale;
    } else if (typeof size === 'number') {
      px = Math.max(32, Math.min(160, Math.round(size)));
      scale = px / 64;
      if (px <= 52) sizeKey = 'small';
      else if (px <= 72) sizeKey = 'normal';
      else if (px <= 88) sizeKey = 'large';
      else sizeKey = 'giant';
    }

    state.settings.petSize = sizeKey;
    state.settings.petSizePx = px;
    state.settings.petScale = scale;

    return { success: true, size: sizeKey, px, scale };
  }

  /**
   * Adds an unlocked creature to player's companion roster
   */
  static addToRoster(state, companion) {
    if (!state) return { success: false, reason: 'no_state' };
    if (!Array.isArray(state.roster)) {
      state.roster = [{ ...state.pet }];
    }
    state.roster.push({
      creatureId: companion.creatureId || state.pet.creatureId,
      name: companion.name || 'Companion',
      stage: companion.stage || 1,
      level: companion.level || 1,
      theme: companion.theme || 'classic_default'
    });
    return { success: true, roster: state.roster };
  }

  /**
   * Switches active companion from roster
   */
  static switchActivePet(state, rosterIndex) {
    if (!state || !Array.isArray(state.roster)) return { success: false, reason: 'no_roster' };
    const companion = state.roster[rosterIndex];
    if (!companion) return { success: false, reason: 'companion_not_found' };

    state.activeRosterIndex = rosterIndex;
    state.pet.creatureId = companion.creatureId;
    state.pet.name = companion.name;
    state.pet.stage = companion.stage || state.pet.stage;
    state.pet.level = companion.level || state.pet.level;
    if (companion.theme) state.pet.theme = companion.theme;

    return { success: true, pet: state.pet };
  }

  /**
   * Lists all unlocked creature theme palettes based on pet's stage
   */
  static getUnlockedCreatureThemes(pet) {
    const stage = pet?.stage || 1;
    const isKomyo = !!pet?.isKomyo;
    const customUnlocked = pet?.unlockedThemes || [];
    const unlocked = [];

    if (!CREATURE_THEMES) return [];

    for (const theme of Object.values(CREATURE_THEMES)) {
      if (customUnlocked.includes(theme.id) || customUnlocked.includes('all')) {
        unlocked.push(theme);
      } else if (theme.id === 'celestial_shiny') {
        if (stage >= 6 || isKomyo) {
          unlocked.push(theme);
        }
      } else if (stage >= (theme.minStage || 1)) {
        unlocked.push(theme);
      }
    }
    return unlocked;
  }

  /**
   * Sets creature theme palette
   */
  static setCreatureTheme(state, themeId) {
    if (!state || !state.pet) return { success: false, reason: 'no_pet' };
    if (!CREATURE_THEMES || !CREATURE_THEMES[themeId]) return { success: false, reason: 'invalid_theme' };
    state.pet.theme = themeId;
    if (Array.isArray(state.roster) && state.roster[state.activeRosterIndex || 0]) {
      state.roster[state.activeRosterIndex || 0].theme = themeId;
    }
    return { success: true, theme: themeId };
  }

  /**
   * Sets the global font size scale preference ('normal' | 'large' | 'huge')
   */
  static setFontSize(state, sizeKey) {
    if (!state || !state.settings) return { success: false, reason: 'no_settings' };
    const allowed = ['normal', 'large', 'huge'];
    if (!allowed.includes(sizeKey)) return { success: false, reason: 'invalid_size' };
    state.settings.fontSize = sizeKey;
    return { success: true, fontSize: sizeKey };
  }

}
