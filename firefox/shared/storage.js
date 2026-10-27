/**
 * Poyori (ポヨリ) — Storage Manager
 *
 * This module handles persistent data synchronization with Google Chrome's local storage
 * (`chrome.storage.local`). It ensures that your pet's state, inventory, and stats are
 * safely saved across browser sessions, tabs, and window reloads.
 */

import { DEFAULT_STATE } from './constants.js';

// The primary storage key used to store Poyori's data in chrome.storage.local
const STORAGE_KEY = 'poyori_state';

function getStorageApi() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) return chrome;
  if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) return browser;
  return null;
}

let pendingInitPromise = null;

/**
 * Retrieves the current game state from storage.
 * If no state exists yet (e.g. on first launch), it initializes and returns the default state.
 *
 * @returns {Promise<Object>} The latest Poyori game state.
 */
export async function getState() {
  if (pendingInitPromise) {
    return pendingInitPromise;
  }

  pendingInitPromise = new Promise((resolve) => {
    const api = getStorageApi();
    // Graceful fallback for non-extension environments (e.g., automated tests or standalone dev)
    if (!api) {
      try {
        const local = localStorage.getItem(STORAGE_KEY);
        resolve(local ? JSON.parse(local) : JSON.parse(JSON.stringify(DEFAULT_STATE)));
      } catch (e) {
        resolve(JSON.parse(JSON.stringify(DEFAULT_STATE)));
      }
      return;
    }

    // Read from persistent local storage
    api.storage.local.get([STORAGE_KEY], (result) => {
      if ((api.runtime && api.runtime.lastError) || !result || !result[STORAGE_KEY]) {
        // First-time setup: initialize and save default state
        const initial = JSON.parse(JSON.stringify(DEFAULT_STATE));
        if (initial.pet && !initial.pet.gender) {
          initial.pet.gender = Math.random() < 0.5 ? 'male' : 'female';
        }
        api.storage.local.set({ [STORAGE_KEY]: initial }, () => {
          resolve(initial);
        });
      } else {
        // Deep merge with default state so any newly added settings/fields are populated
        const merged = deepMerge(JSON.parse(JSON.stringify(DEFAULT_STATE)), result[STORAGE_KEY]);
        if (merged.pet && !merged.pet.gender) {
          merged.pet.gender = Math.random() < 0.5 ? 'male' : 'female';
        }
        resolve(merged);
      }
    });
  }).finally(() => {
    pendingInitPromise = null;
  });

  return pendingInitPromise;
}

/**
 * Saves the updated game state to persistent storage.
 *
 * @param {Object} state - The complete Poyori state to persist.
 * @returns {Promise<Object>} Resolves with the saved state.
 */
export async function saveState(state) {
  return new Promise((resolve) => {
    const api = getStorageApi();
    if (!api) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {}
      resolve(state);
      return;
    }

    api.storage.local.set({ [STORAGE_KEY]: state }, () => {
      resolve(state);
    });
  });
}

/**
 * Updates specific properties on the pet object and saves immediately.
 *
 * @param {Object} petUpdates - Partial pet object containing properties to update.
 * @returns {Promise<Object>} The newly saved state.
 */
export async function updatePet(petUpdates) {
  const state = await getState();
  state.pet = { ...state.pet, ...petUpdates };
  return saveState(state);
}

/**
 * Listens for state changes broadcasted across different tabs or service workers.
 *
 * @param {Function} callback - Invoked whenever Poyori state changes in storage.
 * @returns {Function} An unsubscribe cleanup function.
 */
export function subscribeState(callback) {
  const api = getStorageApi();
  if (api && api.storage && api.storage.onChanged) {
    const listener = (changes, areaName) => {
      if (areaName === 'local' && changes[STORAGE_KEY]) {
        callback(changes[STORAGE_KEY].newValue, changes[STORAGE_KEY].oldValue);
      }
    };
    api.storage.onChanged.addListener(listener);
    return () => api.storage.onChanged.removeListener(listener);
  }
  return () => {};
}

/**
 * Recursively merges source properties into target.
 * Preserves nested default configuration when user state is loaded.
 */
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && !Array.isArray(source[key]) && target[key]) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}
