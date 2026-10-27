/**
 * Poyori (ポヨリ) — Extension Toolbar Popup Logic
 */

import { getState, saveState, subscribeState } from '../shared/storage.js';
import { CREATURES, STAGES, getTerm } from '../shared/constants.js';
import { PoyoriEngine } from '../shared/game-engine.js';
import { getCreatureSprite } from '../content/sprites.js';
import { getPixelIconHtml } from '../shared/pixel-icons.js';
import { audioSynth } from '../ui/audio.js';

let state = null;
let currentDomain = null;

async function initPopup() {
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

  // Populate UI icons with authentic 9-bit pixel art
  const streakIcon = document.getElementById('streak-icon');
  if (streakIcon) streakIcon.innerHTML = getPixelIconHtml('flame', 12);
  const iconOnaka = document.getElementById('icon-onaka');
  if (iconOnaka) iconOnaka.innerHTML = getPixelIconHtml('heart_full', 12);
  const iconGenki = document.getElementById('icon-genki');
  if (iconGenki) iconGenki.innerHTML = getPixelIconHtml('spark', 12);
  const iconKizuna = document.getElementById('icon-kizuna');
  if (iconKizuna) iconKizuna.innerHTML = getPixelIconHtml('sakura', 12);
  const tagDenki = document.getElementById('tag-icon-denki');
  if (tagDenki) tagDenki.innerHTML = getPixelIconHtml('spark', 12);
  const tagChishiki = document.getElementById('tag-icon-chishiki');
  if (tagChishiki) tagChishiki.innerHTML = getPixelIconHtml('book_zukan', 12);
  const tagDistract = document.getElementById('tag-icon-distract');
  if (tagDistract) tagDistract.innerHTML = getPixelIconHtml('sleep_zzz', 12);
  const btnDev = document.getElementById('btn-icon-device');
  if (btnDev) btnDev.innerHTML = getPixelIconHtml('handheld_device', 14);
  const btnDash = document.getElementById('btn-icon-dash');
  if (btnDash) btnDash.innerHTML = getPixelIconHtml('gear', 14);
  const btnFeed = document.getElementById('btn-icon-feed');
  if (btnFeed) btnFeed.innerHTML = getPixelIconHtml('apple', 14);
  const btnPet = document.getElementById('btn-icon-pet');
  if (btnPet) btnPet.innerHTML = getPixelIconHtml('hand_pet', 14);
  const btnCure = document.getElementById('btn-icon-cure');
  if (btnCure) btnCure.innerHTML = getPixelIconHtml('cross', 14);
  const iconSize = document.getElementById('icon-size');
  if (iconSize) iconSize.innerHTML = getPixelIconHtml('spark', 10);

  renderPet();

  // Get active tab domain
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.url && !tabs[0].url.startsWith('chrome://')) {
      try {
        const urlObj = new URL(tabs[0].url);
        currentDomain = urlObj.hostname;
        renderDomainClassification();
      } catch (e) {
        document.getElementById('site-domain').textContent = 'System Page';
      }
    } else {
      document.getElementById('site-domain').textContent = 'Special Page';
    }
  });

  bindEvents();
}

function renderPet() {
  const pet = state.pet;
  const creature = CREATURES[pet.creatureId] || CREATURES.denki_tamago;
  const mode = state.settings.languageMode || 'bilingual';
  const stageMeta = STAGES[pet.stage - 1] || STAGES[0];

  const spriteEl = document.getElementById('pet-sprite');
  const isPocket = state.settings?.petVisible === false || state.settings?.pocketMode === true;
  if (isPocket) {
    spriteEl.src = getCreatureSprite(pet.creatureId, 'sleep', pet.accessory, pet.theme);
    spriteEl.style.opacity = '0.7';
    spriteEl.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))';
    spriteEl.title = 'Pocket Mode: Poyori is resting safely in your pocket. Click to wake and summon!';
  } else {
    spriteEl.src = getCreatureSprite(pet.creatureId, pet.isSleeping ? 'sleep' : (pet.isSick ? 'idle1' : 'idle1'), pet.accessory, pet.theme);
    spriteEl.style.opacity = '1';
    spriteEl.style.filter = 'none';
    spriteEl.title = 'Click Poyori to tuck into Pocket Mode (resting)!';
  }

  const genderIcon = getPixelIconHtml(pet.gender === 'male' ? 'gender_male' : 'gender_female', 11);
  document.getElementById('pet-name').innerHTML = `${pet.name} ${genderIcon} ${pet.isKomyo ? getPixelIconHtml('star', 12) : ''}`;
  const lvlEl = document.getElementById('pet-level');
  if (lvlEl) lvlEl.textContent = `Lv. ${pet.level || 1}`;

  const stageEl = document.getElementById('pet-stage');
  if (stageEl) {
    if (isPocket) {
      stageEl.innerHTML = `<span style="color: #fedb72; font-weight: bold;">[POCKET MODE]</span> Resting in Pocket ${getPixelIconHtml('sleep_zzz', 10)}`;
    } else {
      stageEl.textContent = `${creature.name} (${getTerm(stageMeta.termKey, mode)})`;
    }
  }
  document.getElementById('val-onaka').textContent = pet.onaka;
  document.getElementById('val-genki').textContent = pet.genki;
  document.getElementById('val-kizuna').textContent = pet.kizuna;
  document.getElementById('streak-val').textContent = state.stats.currentStreak;

  // Cure illness button display
  const cureBtn = document.getElementById('quick-cure-btn');
  if (cureBtn) {
    cureBtn.style.display = pet.isSick ? 'flex' : 'none';
  }

  // Pet Size Selector UI
  const currentSize = state.settings?.petSize || 'normal';
  const sizeLabels = { small: 'Small (48px)', normal: 'Normal (64px)', large: 'Large (80px)', giant: 'Giant (96px)' };
  const sizeLabelEl = document.getElementById('pet-size-label');
  if (sizeLabelEl) sizeLabelEl.textContent = sizeLabels[currentSize] || 'Normal (64px)';
  document.querySelectorAll('.popup-size-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.size === currentSize);
  });

  // Active Focus Session mini display
  renderFocusCard();
}

let focusInterval = null;

function renderFocusCard() {
  const focusCard = document.getElementById('focus-mini-card');
  if (!focusCard) return;

  if (state.focusSession && state.focusSession.isActive) {
    focusCard.style.display = 'block';
    updateFocusDisplay();

    if (!focusInterval) {
      focusInterval = setInterval(() => {
        if (!state.focusSession || !state.focusSession.isActive) {
          clearInterval(focusInterval);
          focusInterval = null;
          renderFocusCard();
          return;
        }

        if (state.focusSession.remainingSeconds > 0) {
          state.focusSession.remainingSeconds -= 1;
          updateFocusDisplay();

          // Sync with storage every 5 seconds
          if (state.focusSession.remainingSeconds % 5 === 0) {
            state.focusSession.lastTickAt = Date.now();
            saveState(state);
          }
        } else {
          clearInterval(focusInterval);
          focusInterval = null;
          PoyoriEngine.completeFocusSession(state);
          audioSynth.shinkaFanfare();
          saveState(state);
          renderPet();
          showFeedback('Focus Session Complete! (+50 Koban, +150 XP)');
        }
      }, 1000);
    }
  } else {
    focusCard.style.display = 'none';
    if (focusInterval) {
      clearInterval(focusInterval);
      focusInterval = null;
    }
  }
}

function updateFocusDisplay() {
  const timerVal = document.getElementById('focus-timer-val');
  const discName = document.getElementById('focus-discipline-name');
  if (!timerVal || !state.focusSession) return;

  const mins = Math.floor((state.focusSession.remainingSeconds || 0) / 60);
  const secs = (state.focusSession.remainingSeconds || 0) % 60;
  timerVal.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  if (discName) {
    discName.textContent = (state.focusSession.discipline || 'coding').toUpperCase();
  }
}

let feedbackTimer = null;
function showFeedback(msg) {
  const el = document.getElementById('site-feedback');
  if (!el) return;
  el.innerHTML = `${getPixelIconHtml('check', 10)} ${msg}`;
  el.classList.add('show');
  if (feedbackTimer) clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    el.classList.remove('show');
  }, 2200);
}

function renderDomainClassification() {
  if (!currentDomain) return;
  document.getElementById('site-domain').textContent = currentDomain;
  const cat = PoyoriEngine.classifyDomain(currentDomain, state);

  const tagEl = document.getElementById('site-tag');
  tagEl.className = `site-tag ${cat}`;

  // Trigger pop bounce animation
  tagEl.classList.remove('pop');
  void tagEl.offsetWidth; // force DOM reflow
  tagEl.classList.add('pop');

  let icon = 'neutral_dot';
  let label = 'Neutral';
  if (cat === 'denki') { icon = 'spark'; label = 'Coding (+XP)'; }
  else if (cat === 'chishiki') { icon = 'book_zukan'; label = 'Study (+XP)'; }
  else if (cat === 'monogatari') { icon = 'tasks_scroll'; label = 'Story (+XP)'; }
  else if (cat === 'distracting') { icon = 'sleep_zzz'; label = 'Distracting'; }
  tagEl.innerHTML = `${getPixelIconHtml(icon, 12)} ${label}`;

  // Update visual active state on the 3 classification buttons
  document.querySelectorAll('.tag-btn').forEach(btn => {
    if (btn.dataset.cat === cat) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function bindEvents() {
  // Classification buttons
  document.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!currentDomain) return;
      const cleanDomain = currentDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0];
      const targetCat = btn.dataset.cat;
      const currentCat = PoyoriEngine.classifyDomain(currentDomain, state);

      // Remove existing overrides for this domain
      state.settings.customEducational = (state.settings.customEducational || []).filter(e => {
        if (!e || !e.domain) return false;
        const cleanE = e.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0];
        return cleanE !== cleanDomain;
      });
      state.settings.customDistracting = (state.settings.customDistracting || []).filter(d => {
        if (!d) return false;
        const cleanD = (typeof d === 'string' ? d : d.domain || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0];
        return cleanD !== cleanDomain;
      });

      let feedbackMsg = '';
      if (currentCat === targetCat) {
        // Toggle OFF back to neutral
        audioSynth.boop();
        feedbackMsg = `${cleanDomain} reset to Neutral`;
      } else {
        // Apply newly selected category
        if (targetCat === 'distracting') {
          state.settings.customDistracting.push(cleanDomain);
        } else {
          state.settings.customEducational.push({ domain: cleanDomain, category: targetCat });
        }
        audioSynth.chirp();
        const catLabels = { denki: 'Coding (+XP)', chishiki: 'Study (+XP)', distracting: 'Distracting' };
        feedbackMsg = `${cleanDomain} set to ${catLabels[targetCat] || targetCat}!`;
      }

      await saveState(state);
      renderDomainClassification();
      showFeedback(feedbackMsg);

      // Notify content script in current tab so pet immediately reacts
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'classification_updated',
            domain: cleanDomain,
            category: currentCat === targetCat ? 'neutral' : targetCat
          }).catch(() => {});
        }
      });
    });
  });

  // Open Handheld Device In-Page
  document.getElementById('open-device-btn').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'open_device' }).catch(() => {});
        window.close();
      }
    });
  });

  // Open Full Mochimori Dashboard Page
  document.getElementById('open-dashboard-btn').addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('dashboard/dashboard.html'));
    }
  });

  // Quick Feed
  document.getElementById('quick-feed-btn').addEventListener('click', async () => {
    const inv = state.inventory;
    const itemToFeed = Object.keys(inv).find(k => inv[k] > 0) || 'ringo';
    const res = PoyoriEngine.feed(state, itemToFeed);
    if (res.success) {
      audioSynth.munch();
      await saveState(state);
      renderPet();
      showFeedback('Fed Poyori delicious food!');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'feed' }).catch(() => {});
        }
      });
    } else {
      audioSynth.boop();
      showFeedback('No snacks left! Buy food in shop.');
    }
  });

  // Quick Pet
  document.getElementById('quick-pet-btn').addEventListener('click', async () => {
    PoyoriEngine.pet(state);
    await saveState(state);
    renderPet();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'pet' }).catch(() => {});
      }
    });
  });

  // Rename Companion
  const renameBtn = document.getElementById('popup-rename-btn');
  if (renameBtn) {
    renameBtn.addEventListener('click', async () => {
      const curName = state.pet.name || 'Poyori';
      const newName = window.prompt('Enter a custom name for your companion (1-20 characters):', curName);
      if (newName && newName.trim()) {
        PoyoriEngine.setPetCustomName(state, newName.trim());
        await saveState(state);
        renderPet();
        showFeedback(`Renamed to "${newName.trim()}"!`);
      }
    });
  }

  // Adjust Tamagotchi Display Size
  document.querySelectorAll('.popup-size-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const size = e.currentTarget.dataset.size;
      const res = PoyoriEngine.setPetSize(state, size);
      await saveState(state);
      renderPet();
      showFeedback(`Size set to ${size.toUpperCase()} (${res.px}px)!`);
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, {
                action: 'set_pet_size',
                size: size,
                sizePx: res.px
              }).catch(() => {});
            }
          });
        });
      }
    });
  });

  // Quick Cure Medicine
  const quickCureBtn = document.getElementById('quick-cure-btn');
  if (quickCureBtn) {
    quickCureBtn.addEventListener('click', async () => {
      const inv = state.inventory || {};
      if (!inv.yakuso || inv.yakuso <= 0) {
        if (state.koban >= 15) {
          PoyoriEngine.buyFoodItem(state, 'yakuso');
        } else {
          showFeedback('Need 15 Koban for Yakusō Medicine!');
          return;
        }
      }
      const res = PoyoriEngine.curePet(state);
      if (res.success) {
        await saveState(state);
        audioSynth.shinkaFanfare();
        renderPet();
        showFeedback('Poyori was cured with Yakusō!');
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'cheer' }).catch(() => {});
          }
        });
      }
    });
  }

  // Secret 7-tap gesture on popup logo to launch Dev Access Port
  let popupLogoClicks = 0;
  let lastLogoClickTime = 0;
  const brandEl = document.querySelector('.brand');
  const petSpriteEl = document.getElementById('pet-sprite');

  const onLogoTap = () => {
    const now = Date.now();
    if (now - lastLogoClickTime < 1500) {
      popupLogoClicks++;
    } else {
      popupLogoClicks = 1;
    }
    lastLogoClickTime = now;

    if (popupLogoClicks >= 4 && popupLogoClicks < 7) {
      audioSynth.boop();
      showFeedback(`${7 - popupLogoClicks} more taps for Dev Mode...`);
    } else if (popupLogoClicks >= 7) {
      popupLogoClicks = 0;
      const enteredKey = prompt('POYORI DEV ACCESS // ENTER SECRET KEY:');
      if (enteredKey && PoyoriEngine.verifyDevKey(enteredKey)) {
        audioSynth.shinkaFanfare();
        showFeedback('DEV MODE ACTIVATED!');
        const devUrl = chrome.runtime.getURL('dashboard/dev-portal.html?auth=gesture');
        if (chrome.tabs && chrome.tabs.create) {
          chrome.tabs.create({ url: devUrl });
        } else if (chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ action: 'open_dev_portal', auth: 'gesture' });
        }
        setTimeout(() => window.close(), 600);
      } else if (enteredKey !== null) {
        audioSynth.boop();
        showFeedback('Access Denied: Invalid Key');
      }
    }
  };

  if (brandEl) {
    brandEl.style.cursor = 'pointer';
    brandEl.title = 'Poyori';
    brandEl.addEventListener('click', onLogoTap);
  }

  // Clicking on the Tamagotchi sprite toggles Pocket Mode (rests / summons companion)
  if (petSpriteEl) {
    petSpriteEl.style.cursor = 'pointer';
    petSpriteEl.addEventListener('click', async () => {
      const willBePocket = !(state.settings?.pocketMode || state.settings?.petVisible === false);
      state.settings = state.settings || {};
      state.settings.pocketMode = willBePocket;
      state.settings.petVisible = !willBePocket;
      state.pet.isSleeping = willBePocket;
      state.pet.mood = willBePocket ? 'sleepy' : PoyoriEngine.getPetMood(state);

      if (willBePocket) {
        audioSynth.boop();
        showFeedback(`Pocket Mode Activated: Poyori is resting in your pocket ${getPixelIconHtml('sleep_zzz', 10)}`);
      } else {
        audioSynth.chirp();
        showFeedback(`Poyori woke up and is roaming web pages! ${getPixelIconHtml('spark', 10)}`);
      }
      await saveState(state);
      renderPet();

      // Broadcast visibility toggle to all open tabs
      if (chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, {
                action: 'toggle_pet_visibility',
                visible: !willBePocket,
                pocketMode: willBePocket
              }).catch(() => {});
            }
          });
        });
      }
    });
  }

  // Stop Focus Session Button
  const stopFocusBtn = document.getElementById('popup-stop-focus-btn');
  if (stopFocusBtn) {
    stopFocusBtn.addEventListener('click', async () => {
      if (state && state.focusSession && state.focusSession.isActive) {
        PoyoriEngine.cancelFocusSession(state);
        audioSynth.boop();
        await saveState(state);
        renderPet();
        showFeedback('Focus session stopped.');
      }
    });
  }
}

// Synchronize state across tabs and background service worker
subscribeState((newState) => {
  if (!newState) return;
  state = newState;
  renderPet();
});

window.addEventListener('beforeunload', () => {
  if (state && state.focusSession && state.focusSession.isActive) {
    state.focusSession.lastTickAt = Date.now();
    saveState(state);
  }
});

initPopup();
