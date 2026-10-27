/**
 * Poyori (ポヨリ) — Quick Action Speech Bubble
 * In-page floating retro speech bubble for quick feeding, petting, and device launching.
 */

import { audioSynth } from './audio.js';
import { PoyoriEngine } from '../shared/game-engine.js';
import { getTerm } from '../shared/constants.js';
import { getPixelIconHtml } from '../shared/pixel-icons.js';

export class QuickBubble {
  constructor(shadowRoot, options = {}) {
    this.shadowRoot = shadowRoot;
    this.onOpenDevice = options.onOpenDevice || (() => {});
    this.onPetAction = options.onPetAction || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    this.container = null;
    this.isOpen = false;
    this.initDOM();
  }

  initDOM() {
    this.container = document.createElement('div');
    this.container.className = 'poyori-quick-bubble';
    this.container.style.display = 'none';
    this.shadowRoot.appendChild(this.container);

    // Close when clicking outside bubble and pet
    window.addEventListener('pointerdown', (e) => {
      if (this.isOpen && !e.composedPath().some(el => el.classList && (el.classList.contains('poyori-quick-bubble') || el.classList.contains('poyori-pet-container')))) {
        this.close();
      }
    });
  }

  toggle(petX, petY, state) {
    if (this.isOpen) {
      this.close();
    } else {
      this.open(petX, petY, state);
    }
  }

  open(petX, petY, state) {
    this.isOpen = true;
    const pet = state.pet;
    const mode = state.settings.languageMode || 'bilingual';

    // Position bubble just above pet
    const bubbleX = Math.max(10, Math.min(window.innerWidth - 240, petX - 80));
    const bubbleY = Math.max(10, petY - 110);

    this.container.style.left = `${bubbleX}px`;
    this.container.style.top = `${bubbleY}px`;
    this.container.style.display = 'flex';

    // Message with Grumpy neglect reaction and localization
    const mood = PoyoriEngine.getPetMood(state);
    let moodMsg = `${pet.name} is cheerful! (ご機嫌)`;
    if (mode === 'japanese') moodMsg = `${pet.name}はご機嫌です！`;
    else if (mode === 'english') moodMsg = `${pet.name} is cheerful!`;

    if (pet.isSleeping) {
      moodMsg = mode === 'japanese' ? `${pet.name}はぐっすり眠っています… zzz` : `${pet.name} is sound asleep... zzz`;
    } else if (pet.isSick) {
      moodMsg = mode === 'japanese' ? `${pet.name}は体調が悪そうです… 薬草を！` : `${pet.name} feels sick... needs medicine!`;
    } else if (mood === 'grumpy') {
      moodMsg = mode === 'japanese' 
        ? `ぷんぷん！${pet.name}は不機嫌です！構ってください！` 
        : `Hmph! ${pet.name} is grumpy... give me snacks and attention!`;
    } else if (pet.onaka < 30) {
      moodMsg = mode === 'japanese' ? `${pet.name}はお腹が空いています！` : `${pet.name} is feeling hungry!`;
    }

    this.container.innerHTML = `
      <div class="bubble-header">
        <span class="bubble-title">${getPixelIconHtml('star', 12)} ${pet.name}</span>
        <button class="bubble-close">${getPixelIconHtml('cross', 10)}</button>
      </div>
      <div class="bubble-msg">${moodMsg}</div>
      <div class="bubble-actions">
        <button class="bubble-btn" id="q-feed" title="Quick Feed">${getPixelIconHtml('apple', 14)} ${getTerm('feed', mode)}</button>
        <button class="bubble-btn" id="q-pet" title="Pet Poyori">${getPixelIconHtml('hand_pet', 14)} ${getTerm('pet', mode)}</button>
        <button class="bubble-btn" id="q-device" title="Open Handheld Device">${getPixelIconHtml('handheld_device', 14)} Device</button>
      </div>
    `;

    // Bindings
    this.container.querySelector('.bubble-close').addEventListener('click', () => this.close());

    this.container.querySelector('#q-feed').addEventListener('click', () => {
      // Feed first available item
      const inv = state.inventory;
      const itemToFeed = Object.keys(inv).find(k => inv[k] > 0) || 'ringo';
      const res = PoyoriEngine.feed(state, itemToFeed);
      if (res.success) {
        audioSynth.munch();
        this.onPetAction('feed');
        this.onStateChange(state);
        this.close();
      } else {
        audioSynth.boop();
        this.container.querySelector('.bubble-msg').textContent = 'No food items! Complete tasks to earn food.';
      }
    });

    this.container.querySelector('#q-pet').addEventListener('click', () => {
      audioSynth.purr();
      PoyoriEngine.pet(state);
      this.onPetAction('pet');
      this.onStateChange(state);
      this.close();
    });

    this.container.querySelector('#q-device').addEventListener('click', () => {
      this.close();
      this.onOpenDevice();
    });
  }

  close() {
    this.isOpen = false;
    this.container.style.display = 'none';
  }
}
