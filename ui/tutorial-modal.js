/**
 * Poyori (ポヨリ) — Initial Setup Onboarding Tutorial Modal
 * Interactive 5-step retro walkthrough with starter egg breed selection,
 * companion custom naming, care guide, focus timer breakdown, and
 * a persistent skip option on every step.
 */

import { audioSynth } from './audio.js';
import { getPixelIconHtml } from '../shared/pixel-icons.js';
import { getCreatureSprite } from '../content/sprites.js';
import { CREATURES } from '../shared/constants.js';
import { PoyoriEngine } from '../shared/game-engine.js';

export class TutorialModal {
  constructor(container, options = {}) {
    this.container = container || (typeof document !== 'undefined' ? document.body : null);
    this.state = options.state || null;
    this.onFinishCallback = options.onFinish || null;
    this.isOpen = false;
    this.currentStep = 1;
    this.totalSteps = 5;
    this.selectedStarterId = options.state?.pet?.creatureId || 'coding_tamago';
    this.enteredPetName = options.state?.pet?.name || 'Poyori';
    this.selectedMode = options.state?.settings?.consequenceMode || 'cozy';
    this.element = null;
    this.init();
  }

  /**
   * Initializes modal DOM container
   */
  init() {
    const isBrowser = typeof document !== 'undefined';
    if (isBrowser) {
      this.element = document.createElement('div');
      this.element.className = 'poyori-tutorial-overlay';
      this.element.style.display = 'none';
      if (this.container && typeof this.container.appendChild === 'function') {
        this.container.appendChild(this.element);
      }
    } else {
      // Mock element for headless Node.js tests
      this.element = {
        className: 'poyori-tutorial-overlay',
        innerHTML: '',
        style: { display: 'none' },
        _listeners: {},
        addEventListener(event, fn) {
          this._listeners[event] = this._listeners[event] || [];
          this._listeners[event].push(fn);
        },
        querySelector(selector) {
          if (selector === '.tutorial-next-btn') return this._nextBtn || { click: () => {} };
          if (selector === '.tutorial-prev-btn') return this._prevBtn || { click: () => {} };
          if (selector === '.tutorial-skip-btn' || selector === '.tutorial-skip-top-btn') return this._skipBtn || { click: () => {} };
          if (selector === '#tutorial-pet-name') return this._nameInput || { value: 'Poyori' };
          return null;
        },
        querySelectorAll(selector) {
          if (selector.includes('tutorial-breed-card')) return this._breedCards || [];
          return [];
        }
      };
      if (this.container && typeof this.container.appendChild === 'function') {
        this.container.appendChild(this.element);
      }
    }
  }

  /**
   * Opens the tutorial at step 1 or specified step
   */
  show(options = {}) {
    this.isOpen = true;
    this.currentStep = options.step || 1;
    if (options.state) this.state = options.state;
    if (options.onFinish) this.onFinishCallback = options.onFinish;
    this.selectedStarterId = this.state?.pet?.creatureId || 'coding_tamago';
    this.enteredPetName = this.state?.pet?.name || 'Poyori';
    this.selectedMode = this.state?.settings?.consequenceMode || 'cozy';

    this.renderStep();
    if (this.element && this.element.style) {
      this.element.style.display = 'flex';
    }

    try {
      audioSynth.chirp();
    } catch (e) {}
  }

  /**
   * Hides the tutorial modal
   */
  hide() {
    this.isOpen = false;
    if (this.element && this.element.style) {
      this.element.style.display = 'none';
    }
  }

  /**
   * Advances to next step or completes tutorial
   */
  next() {
    // If leaving step 2, save the entered pet name
    if (this.currentStep === 2) {
      const isBrowser = typeof document !== 'undefined';
      if (isBrowser) {
        const input = this.element.querySelector('#tutorial-pet-name');
        if (input && input.value.trim()) {
          this.enteredPetName = input.value.trim().slice(0, 20);
        }
      } else if (this.element._nameInput) {
        this.enteredPetName = this.element._nameInput.value;
      }
      this.applyStarterChoice();
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      try { audioSynth.chirp(); } catch (e) {}
      this.renderStep();
    } else {
      this.complete();
    }
  }

  /**
   * Returns to previous step
   */
  prev() {
    if (this.currentStep > 1) {
      this.currentStep--;
      try { audioSynth.chirp(); } catch (e) {}
      this.renderStep();
    }
  }

  /**
   * Skips remaining tutorial steps immediately
   */
  skip() {
    // If on or past step 2, apply any choices made so far
    if (this.currentStep >= 2) {
      const isBrowser = typeof document !== 'undefined';
      if (isBrowser) {
        const input = this.element.querySelector('#tutorial-pet-name');
        if (input && input.value.trim()) {
          this.enteredPetName = input.value.trim().slice(0, 20);
        }
      }
      this.applyStarterChoice();
    }

    if (this.state) {
      this.state.settings = this.state.settings || {};
      this.state.settings.tutorialCompleted = true;
    }

    try { audioSynth.boop(); } catch (e) {}
    this.hide();

    if (typeof this.onFinishCallback === 'function') {
      this.onFinishCallback({ skipped: true, state: this.state });
    }
  }

  /**
   * Applies starter breed and name to player state
   */
  applyStarterChoice() {
    if (!this.state || !this.state.pet) return;

    const breedMeta = CREATURES[this.selectedStarterId] || CREATURES.coding_tamago;
    this.state.pet.creatureId = this.selectedStarterId;
    this.state.pet.name = this.enteredPetName || 'Poyori';
    this.state.pet.chosenBranch = breedMeta.branch || 'coding';
    this.state.pet.activeDisciplines = [breedMeta.branch || 'coding'];

    if (this.state.settings) {
      this.state.settings.consequenceMode = this.selectedMode || 'cozy';
    }

    if (Array.isArray(this.state.roster) && this.state.roster[0]) {
      this.state.roster[0].creatureId = this.selectedStarterId;
      this.state.roster[0].name = this.enteredPetName || 'Poyori';
    }
  }

  /**
   * Completes tutorial journey
   */
  complete() {
    this.applyStarterChoice();
    if (this.state) {
      this.state.settings = this.state.settings || {};
      this.state.settings.tutorialCompleted = true;
    }

    try {
      audioSynth.shinkaFanfare();
    } catch (e) {}

    this.hide();

    if (typeof this.onFinishCallback === 'function') {
      this.onFinishCallback({ skipped: false, state: this.state });
    }
  }

  /**
   * Renders current step HTML
   */
  renderStep() {
    const isBrowser = typeof document !== 'undefined';
    let stepContentHtml = '';

    switch (this.currentStep) {
      case 1:
        stepContentHtml = this.renderStep1();
        break;
      case 2:
        stepContentHtml = this.renderStep2();
        break;
      case 3:
        stepContentHtml = this.renderStep3();
        break;
      case 4:
        stepContentHtml = this.renderStep4();
        break;
      case 5:
        stepContentHtml = this.renderStep5();
        break;
      default:
        stepContentHtml = this.renderStep1();
        break;
    }

    const html = `
      <div class="poyori-tutorial-dialog">
        <!-- Header Bar -->
        <div class="tutorial-header">
          <span class="tutorial-step-badge">${getPixelIconHtml('star', 12)} TUTORIAL STEP ${this.currentStep} / ${this.totalSteps}</span>
          <button class="tutorial-skip-top-btn" title="Skip remaining tutorial">✕ Skip Tutorial</button>
        </div>

        <!-- Slide Body -->
        <div class="tutorial-slide-body">
          ${stepContentHtml}
        </div>

        <!-- Footer Navigation -->
        <div class="tutorial-footer">
          <button class="tutorial-skip-btn">Skip Tutorial</button>
          <div class="tutorial-nav-btns">
            ${this.currentStep > 1 ? '<button class="tutorial-prev-btn">← Back</button>' : ''}
            <button class="tutorial-next-btn btn-primary">
              ${this.currentStep === this.totalSteps ? 'Begin Journey! 🌟' : 'Next Step →'}
            </button>
          </div>
        </div>
      </div>
    `;

    if (isBrowser) {
      this.element.innerHTML = html;
      this.bindEvents();
    } else {
      this.element.innerHTML = html;
      this.element._nextBtn = { click: () => this.next() };
      this.element._prevBtn = { click: () => this.prev() };
      this.element._skipBtn = { click: () => this.skip() };
      this.element._nameInput = { value: this.enteredPetName };
    }
  }

  /**
   * Step 1: Welcome to Mochimori
   */
  renderStep1() {
    const eggSprite = getCreatureSprite('coding_tamago', 'idle1');
    return `
      <h2 class="tutorial-title">WELCOME TO POYORI!</h2>
      <div class="tutorial-subtitle">Your Virtual Productivity & Mindful Habit Companion (もちもり)</div>
      
      <div class="tutorial-hero-art">
        <img src="${eggSprite}" alt="Poyori Egg" />
      </div>

      <p class="tutorial-text-desc">
        Ancient spirits called <strong>Mochimori (もちもり)</strong> draw energy and wisdom from focused human minds. 
        Poyori has arrived in your browser as a loyal companion to celebrate your study milestones and keep your daily habits grounded!
      </p>

      <div class="tutorial-features-grid">
        <div class="tutorial-feature-card">
          <div class="tutorial-feature-title">${getPixelIconHtml('spark', 12)} 100% 9-Bit Pixel Art</div>
          <div class="tutorial-feature-desc">Authentic retro LCD & RPG aesthetics with nostalgic sound effects and custom color themes.</div>
        </div>
        <div class="tutorial-feature-card">
          <div class="tutorial-feature-title">${getPixelIconHtml('sakura', 12)} Roaming Web Companion</div>
          <div class="tutorial-feature-desc">Poyori wanders across your web tabs, reacting to your study habits, tasks, and focus sessions.</div>
        </div>
      </div>
    `;
  }

  /**
   * Step 2: Choose Starter Egg & Custom Name
   */
  renderStep2() {
    const starters = [
      { id: 'coding_tamago', name: 'Coding Cat', branch: 'Denki (Tech)', desc: 'Feline of logic matrices & code.' },
      { id: 'creative_tamago', name: 'Creative Bird', branch: 'Geijutsu (Art)', desc: 'Prism chick scattering vibrant hues.' },
      { id: 'literature_tamago', name: 'Literature Fox', branch: 'Bungaku (Lore)', desc: 'Clever kitsune holding sacred scrolls.' },
      { id: 'research_tamago', name: 'Research Owl', branch: 'Kenkyū (Science)', desc: 'Sage owl of temporal inquiry.' },
      { id: 'gaming_tamago', name: 'Gaming Wyvern', branch: 'Yūgi (Reflex)', desc: 'Tactical dragon of quick reflexes.' },
      { id: 'personal_tamago', name: 'Personal Shiba', branch: 'Shūshin (Zen)', desc: 'Loyal canine guardian of willpower.' }
    ];

    const cardsHtml = starters.map(s => {
      const isSel = s.id === this.selectedStarterId;
      const sprite = getCreatureSprite(s.id, 'idle1');
      return `
        <div class="tutorial-breed-card ${isSel ? 'selected' : ''}" data-id="${s.id}">
          <img src="${sprite}" alt="${s.name}" class="tutorial-breed-sprite" />
          <div class="tutorial-breed-name">${s.name}</div>
          <div class="tutorial-breed-branch">${s.branch}</div>
        </div>
      `;
    }).join('');

    return `
      <h2 class="tutorial-title">CHOOSE YOUR STARTER BREED</h2>
      <div class="tutorial-subtitle">Select an egg that aligns with your passions and name your new companion!</div>

      <div class="tutorial-breed-grid">
        ${cardsHtml}
      </div>

      <div class="tutorial-naming-box">
        <label class="tutorial-naming-label" for="tutorial-pet-name">
          ${getPixelIconHtml('star', 12)} NAME YOUR COMPANION:
        </label>
        <input type="text" id="tutorial-pet-name" class="tutorial-name-input" maxlength="20" placeholder="Poyori" value="${this.enteredPetName || 'Poyori'}" />
      </div>
    `;
  }

  /**
   * Step 3: Vitals & Care with Game Mode Selection
   */
  renderStep3() {
    const isHardcore = this.selectedMode === 'hardcore';
    return `
      <h2 class="tutorial-title">NURTURING YOUR SPIRIT & GAME MODE</h2>
      <div class="tutorial-subtitle">Choose your gameplay stakes and learn the essentials of companion care</div>

      <div class="tutorial-mode-select-wrap">
        <label class="tutorial-naming-label">${getPixelIconHtml('star', 12)} CHOOSE YOUR GAMEPLAY MODE:</label>
        <div class="tutorial-mode-grid">
          <div class="tutorial-mode-card ${!isHardcore ? 'selected' : ''}" data-mode="cozy">
            <div class="tutorial-mode-title">${getPixelIconHtml('sakura', 12)} COZY MODE</div>
            <div class="tutorial-mode-desc">Relaxed & forgiving companionship. Poyori will never run away or permanently leave if neglected. Perfect for casual, peaceful focus.</div>
          </div>
          <div class="tutorial-mode-card ${isHardcore ? 'selected' : ''}" data-mode="hardcore">
            <div class="tutorial-mode-title">${getPixelIconHtml('flame', 12)} HARDCORE MODE</div>
            <div class="tutorial-mode-desc">Authentic retro stakes! Neglecting Poyori for 48 hours will cause them to run away into Mochimori. Distractions drain energy faster.</div>
          </div>
        </div>
      </div>

      <div class="tutorial-features-grid">
        <div class="tutorial-feature-card">
          <div class="tutorial-feature-title">${getPixelIconHtml('heart_full', 14)} Onaka (Hunger / Satiety)</div>
          <div class="tutorial-feature-desc">Decreases gradually while active. Complete focus tasks to earn Koban coins and apples to feed Poyori.</div>
        </div>
        <div class="tutorial-feature-card">
          <div class="tutorial-feature-title">${getPixelIconHtml('spark', 14)} Genki (Energy / Stamina)</div>
          <div class="tutorial-feature-desc">Drains throughout the day. Recharges during bedtime or when putting your pet to sleep.</div>
        </div>
        <div class="tutorial-feature-card">
          <div class="tutorial-feature-title">${getPixelIconHtml('sakura', 14)} Kizuna (Bond & Affection)</div>
          <div class="tutorial-feature-desc">Increases when you click to pet Poyori or maintain your daily study streaks.</div>
        </div>
        <div class="tutorial-feature-card">
          <div class="tutorial-feature-title">${getPixelIconHtml('herb_leaf', 14)} Yakusō Herbal Medicine</div>
          <div class="tutorial-feature-desc">Prolonged hunger can cause illness (Byōki). Buy traditional Yakusō from the Mochimori Market to heal!</div>
        </div>
      </div>
    `;
  }

  /**
   * Step 4: Focus Timer & Web Accountability
   */
  renderStep4() {
    return `
      <h2 class="tutorial-title">FOCUS TIMER & STUDY SESSIONS</h2>
      <div class="tutorial-subtitle">Earn evolution experience (XP) by staying accountable during deep work</div>

      <div class="tutorial-features-grid">
        <div class="tutorial-feature-card">
          <div class="tutorial-feature-title">${getPixelIconHtml('clock', 14)} Pomodoro Focus Sprints</div>
          <div class="tutorial-feature-desc">Start 15, 25, 45, or 60-minute focus sprints from the Dashboard or Toolbar Popup.</div>
        </div>
        <div class="tutorial-feature-card">
          <div class="tutorial-feature-title">${getPixelIconHtml('star', 14)} Educational Experience (XP)</div>
          <div class="tutorial-feature-desc">Browsing study domains (e.g. GitHub, Wikipedia, Docs) awards massive XP to trigger Shinka (Evolution)!</div>
        </div>
        <div class="tutorial-feature-card">
          <div class="tutorial-feature-title">${getPixelIconHtml('cross', 14)} Accountability Nudges</div>
          <div class="tutorial-feature-desc">Wandering to distracting websites prompts speech bubble reminders from your pet to get back to work.</div>
        </div>
        <div class="tutorial-feature-card">
          <div class="tutorial-feature-title">${getPixelIconHtml('crown', 14)} 36 Ascensions (Zukan)</div>
          <div class="tutorial-feature-desc">Leveling up unlocks 6 progressive stages per breed, culminating in celestial Kōmyō (光明) gods!</div>
        </div>
      </div>
    `;
  }

  /**
   * Step 5: Roaming & Handheld Device
   */
  renderStep5() {
    const selectedEgg = getCreatureSprite(this.selectedStarterId || 'coding_tamago', 'idle1');
    return `
      <h2 class="tutorial-title">READY FOR ADVENTURE!</h2>
      <div class="tutorial-subtitle">Poyori is now bonded with you across the web</div>

      <div class="tutorial-hero-art">
        <img src="${selectedEgg}" alt="Starter Pet" />
      </div>

      <div class="tutorial-features-grid">
        <div class="tutorial-feature-card">
          <div class="tutorial-feature-title">${getPixelIconHtml('hand_pet', 14)} Web Roaming & Sizing</div>
          <div class="tutorial-feature-desc">Poyori walks along the bottom edge of your web tabs. Drag them anywhere, or switch sizes anytime: Small (48px), Normal (64px), Large (80px), or Giant (96px)!</div>
        </div>
        <div class="tutorial-feature-card">
          <div class="tutorial-feature-title">${getPixelIconHtml('sleep_zzz', 14)} Pocket Mode (Resting)</div>
          <div class="tutorial-feature-desc">Click Poyori in the toolbar popup or tap Pocket on your handheld device to tuck them into your pocket. Your pet rests asleep and in-page roaming pauses until summoned back!</div>
        </div>
        <div class="tutorial-feature-card">
          <div class="tutorial-feature-title">${getPixelIconHtml('gamepad', 14)} Handheld Retro Console</div>
          <div class="tutorial-feature-desc">Click the handheld device button to access your virtual 8-bit console with tactile care actions, habit quests, and nostalgic sound effects.</div>
        </div>
      </div>

      <p class="tutorial-text-desc" style="font-weight: bold; color: var(--c-gold-hilite);">
        You can review this tutorial anytime from the Preferences tab. Let's begin!
      </p>
    `;
  }

  /**
   * Binds browser DOM click and input events
   */
  bindEvents() {
    // Next button
    const nextBtn = this.element.querySelector('.tutorial-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.next());
    }

    // Prev button
    const prevBtn = this.element.querySelector('.tutorial-prev-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prev());
    }

    // Skip buttons (top right & footer)
    const skipTopBtn = this.element.querySelector('.tutorial-skip-top-btn');
    if (skipTopBtn) {
      skipTopBtn.addEventListener('click', () => this.skip());
    }

    const skipFooterBtn = this.element.querySelector('.tutorial-skip-btn');
    if (skipFooterBtn) {
      skipFooterBtn.addEventListener('click', () => this.skip());
    }

    // Breed card selector on Step 2
    if (this.currentStep === 2) {
      const breedCards = this.element.querySelectorAll('.tutorial-breed-card');
      breedCards.forEach(card => {
        card.addEventListener('click', () => {
          this.selectedStarterId = card.dataset.id;
          breedCards.forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          try { audioSynth.chirp(); } catch (e) {}
        });
      });

      const nameInput = this.element.querySelector('#tutorial-pet-name');
      if (nameInput) {
        nameInput.addEventListener('input', (e) => {
          this.enteredPetName = e.target.value.trim().slice(0, 20);
        });
      }
    }

    // Game mode selector on Step 3
    if (this.currentStep === 3) {
      const modeCards = this.element.querySelectorAll('.tutorial-mode-card');
      modeCards.forEach(card => {
        card.addEventListener('click', () => {
          this.selectedMode = card.dataset.mode;
          if (this.state && this.state.settings) {
            this.state.settings.consequenceMode = this.selectedMode;
          }
          try { audioSynth.chirp(); } catch (e) {}
          modeCards.forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
        });
      });
    }
  }
}
