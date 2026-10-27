/**
 * Poyori (ポヨリ) — Background Service Worker
 * Manages active tab time tracking, idle detection, tick alarms, and streak calculations.
 */

import { getState, saveState } from '../shared/storage.js';
import { PoyoriEngine } from '../shared/game-engine.js';

let activeDomain = null;
let activeDomainStartTime = Date.now();

// 1. Extension Lifecycle
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Poyori Service Worker Installed.');
  await getState(); // Ensure default state is stored

  // Periodic 1-minute alarm for vitals tick
  chrome.alarms.create('poyori_tick', { periodInMinutes: 1 });

  // Open Mochimori Dashboard on initial fresh install for onboarding tutorial
  if (details && details.reason === 'install') {
    try {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
    } catch (e) {
      console.warn('Could not open initial dashboard onboarding tab:', e);
    }
  }
});


// Helper to reliably detect active tab's domain even after service worker wake-up
async function updateActiveDomain() {
  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const tab = tabs[0] || (await chrome.tabs.query({ active: true }))[0];
    if (tab?.url && !tab.url.startsWith('chrome://') && !tab.url.includes('blocked/blocked.html')) {
      const urlObj = new URL(tab.url);
      if (urlObj.hostname !== activeDomain) {
        activeDomain = urlObj.hostname;
        activeDomainStartTime = Date.now();
      }
    }
  } catch (e) {}
}

// 2. Alarm Listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'poyori_tick') {
    const state = await getState();
    
    // Update active domain in case service worker just started
    await updateActiveDomain();

    // Process current active tab time
    const flushed = flushBrowsingTime(state);

    // Process pet vitals tick
    const { changed, event } = PoyoriEngine.processTick(state);
    
    // Check daily streaks
    PoyoriEngine.checkDailyStreak(state);

    if (changed || event || flushed || (state.focusSession && state.focusSession.isActive)) {
      await saveState(state);
    }
  }
});

// 3. Tab Activity Tracking
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    handleTabChange(tab);
  } catch (e) {}
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    handleTabChange(tab);
  }
});

async function handleTabChange(tab) {
  if (!tab || !tab.url || 
      tab.url.startsWith('chrome:') || tab.url.startsWith('chrome-extension:') ||
      tab.url.startsWith('about:') || tab.url.startsWith('moz-extension:') ||
      tab.url.startsWith('edge:') || tab.url.startsWith('opera:') ||
      tab.url.includes('blocked/blocked.html')) {
    activeDomain = null;
    return;
  }

  const state = await getState();
  const flushed = flushBrowsingTime(state);
  if (flushed) {
    await saveState(state);
  }

  try {
    const urlObj = new URL(tab.url);
    activeDomain = urlObj.hostname;
    activeDomainStartTime = Date.now();

    // Check if domain is blocked by NSFW filter or custom blocked sites
    if (PoyoriEngine.isBlocked(activeDomain, state)) {
      const blockedUrl = chrome.runtime.getURL('blocked/blocked.html?domain=' + encodeURIComponent(activeDomain));
      chrome.tabs.update(tab.id, { url: blockedUrl }).catch(() => {});
      return;
    }
  } catch (e) {
    activeDomain = null;
  }
}

function flushBrowsingTime(state) {
  if (!activeDomain || !activeDomainStartTime) return false;

  const now = Date.now();
  const durationSecs = Math.floor((now - activeDomainStartTime) / 1000);
  let stateModified = false;

  if (durationSecs >= 5) {
    const result = PoyoriEngine.recordBrowsing(state, activeDomain, durationSecs);
    stateModified = true;

    // Process focus session timer if active
    if (state.focusSession && state.focusSession.isActive) {
      const focusResult = PoyoriEngine.processFocusTick(state, activeDomain, durationSecs);
      state.focusSession.lastTickAt = now;
      if (focusResult && focusResult.nudgeNeeded) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'focus_nudge',
              message: focusResult.nudgeMessage
            }).catch(() => {});
          }
        });
      }
      // Ensure state mutations from processFocusTick are saved properly
      if (state.focusSession.remainingSeconds <= 0) {
        PoyoriEngine.completeFocusSession(state);
      }
    }

    activeDomainStartTime = now;

    if (result && result.evolved) {
      // Notify active tab of evolution
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'shinka_evolved',
            creature: result.creature
          }).catch(() => {});
        }
      });
    }
  }
  return stateModified;
}

// 4. Idle Detection
chrome.idle.onStateChanged.addListener(async (newState) => {
  const state = await getState();
  if (newState === 'idle' || newState === 'locked') {
    flushBrowsingTime(state);
    activeDomain = null;
    activeDomainStartTime = null;
    state.pet.isSleeping = true;
    await saveState(state);
  } else if (newState === 'active') {
    activeDomainStartTime = Date.now();
    // If not bedtime and not in pocket mode, wake pet up
    if (!state.settings?.pocketMode && !PoyoriEngine.isBedtime(state.settings.bedtimeStart, state.settings.bedtimeEnd)) {
      state.pet.isSleeping = false;
      await saveState(state);
    }
  }
});

// 5. Message Listener for Safe Navigation & Tab Creation
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'open_dev_portal') {
    const devUrl = chrome.runtime.getURL('dashboard/dev-portal.html?auth=gesture');
    chrome.tabs.create({ url: devUrl });
    sendResponse({ success: true, url: devUrl });
    return true;
  }
  if (msg.action === 'open_dashboard') {
    const dashUrl = chrome.runtime.getURL('dashboard/dashboard.html');
    chrome.tabs.create({ url: dashUrl });
    sendResponse({ success: true, url: dashUrl });
    return true;
  }
});
