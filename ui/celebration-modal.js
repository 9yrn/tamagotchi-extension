/**
 * Poyori (ポヨリ) — Celebratory Reward & Evolution Modal
 * Renders celebratory 9-bit fanfare popups with animated particle sparkles,
 * sunburst rays, pixel icons, and dramatic chiptune fanfares when cosmetics
 * are unlocked or creatures evolve.
 */

import { audioSynth } from './audio.js';
import { getPixelIconHtml } from '../shared/pixel-icons.js';

export class CelebrationModal {
  constructor(container) {
    this.container = container || document.body;
    this.isOpen = false;
    this.element = null;
    this.onActionCallback = null;
    this.onDismissCallback = null;
    this.init();
  }

  /**
   * Builds the celebratory modal DOM structure
   */
  init() {
    // Check if running in browser or headless mock
    const isBrowser = typeof document !== 'undefined';
    
    if (isBrowser) {
      this.element = document.createElement('div');
      this.element.className = 'poyori-celebrate-overlay';
      this.element.style.display = 'none';
      this.container.appendChild(this.element);

      // Dismiss on backdrop click
      this.element.addEventListener('click', (e) => {
        if (e.target === this.element) {
          this.hide();
        }
      });
    } else {
      // Mock element for headless Node.js tests
      this.element = {
        className: 'poyori-celebrate-overlay',
        innerHTML: '',
        style: { display: 'none' },
        _listeners: {},
        addEventListener(event, fn) {
          this._listeners[event] = this._listeners[event] || [];
          this._listeners[event].push(fn);
        },
        querySelector(selector) {
          if (selector === '.celebrate-action-btn') {
            return this._actionBtn || { click: () => {} };
          }
          if (selector === '.celebrate-close-btn') {
            return this._closeBtn || { click: () => {} };
          }
          return null;
        }
      };
      this.container.appendChild(this.element);
    }
  }

  /**
   * Displays the celebratory modal with custom options
   */
  show(options = {}) {
    this.isOpen = true;
    this.onActionCallback = options.onAction || null;
    this.onDismissCallback = options.onDismiss || null;

    const {
      type = 'cosmetic',
      title = 'CONGRATULATIONS!',
      subtitle = '',
      badgeText = 'UNLOCKED!',
      desc = '',
      stageTitle = '',
      branch = '',
      cost = null,
      spriteUrl = '',
      iconKey = 'crown',
      actionLabel = 'Awesome!',
      enableNaming = (type === 'evolution' || type === 'hatch' || type === 'unlock'),
      currentName = '',
      defaultName = 'Poyori'
    } = options;

    const isBrowser = typeof document !== 'undefined';

    // Play triumphant 8-bit audio fanfare
    try {
      if (type === 'evolution' || type === 'hatch') {
        audioSynth.shinkaFanfare();
      } else {
        if (typeof audioSynth.itemFanfare === 'function') {
          audioSynth.itemFanfare();
        } else {
          audioSynth.shinkaFanfare();
        }
      }
    } catch (e) {
      // Audio fallback in non-interactive contexts
    }

    // Determine visual showcase HTML
    let showcaseHtml = '';
    if (spriteUrl && typeof spriteUrl === 'string' && spriteUrl.trim().startsWith('<')) {
      showcaseHtml = `<div class="celebrate-icon-wrap">${spriteUrl}</div>`;
    } else if (spriteUrl) {
      showcaseHtml = `<img src="${spriteUrl}" alt="${subtitle || 'Celebration'}" class="celebrate-sprite" />`;
    } else {
      showcaseHtml = `<div class="celebrate-icon-wrap">${getPixelIconHtml(iconKey, 48)}</div>`;
    }

    // Optional companion naming section
    const namingHtml = enableNaming ? `
      <div class="celebrate-naming-box">
        <label class="celebrate-naming-label" for="celebrate-pet-name">
          ${getPixelIconHtml('star', 12)} NAME YOUR COMPANION:
        </label>
        <div class="celebrate-naming-input-row">
          <input type="text" id="celebrate-pet-name" class="celebrate-name-input" maxlength="20" placeholder="${currentName || defaultName}" value="${currentName || ''}" />
        </div>
        <div class="celebrate-naming-hint">Give your new spirit a unique identity! (Max 20 chars)</div>
      </div>
    ` : '';

    const html = `
      <div class="poyori-celebrate-dialog ${type}">
        <button class="celebrate-close-btn" title="Close">×</button>

        <!-- Celebratory Sparkle Particles -->
        <div class="celebrate-sparkle sp-1">${getPixelIconHtml('spark', 12)}</div>
        <div class="celebrate-sparkle sp-2">${getPixelIconHtml('star', 14)}</div>
        <div class="celebrate-sparkle sp-3">${getPixelIconHtml('spark', 12)}</div>
        <div class="celebrate-sparkle sp-4">${getPixelIconHtml('star', 10)}</div>

        <!-- Header Badge -->
        <div class="celebrate-badge-wrap">
          <span class="celebrate-badge">${badgeText}</span>
        </div>

        <h2 class="celebrate-title">${title}</h2>
        <div class="celebrate-subtitle">${subtitle}</div>

        <!-- Spotlight Stage -->
        <div class="celebrate-stage">
          <div class="celebrate-sunburst"></div>
          <div class="celebrate-pedestal"></div>
          ${showcaseHtml}
        </div>

        <!-- Meta Details Box -->
        <div class="celebrate-info-box">
          ${stageTitle ? `<div class="celebrate-stage-tag">${stageTitle}</div>` : ''}
          ${branch ? `<div class="celebrate-branch-tag">${branch}</div>` : ''}
          ${cost !== null ? `<div class="celebrate-cost-tag">Cost: <strong>${cost} Koban</strong></div>` : ''}
          <p class="celebrate-desc">${desc}</p>
        </div>

        <!-- Optional Naming Input -->
        ${namingHtml}

        <!-- Action Button -->
        <div class="celebrate-actions">
          <button class="celebrate-action-btn btn-primary">${actionLabel}</button>
        </div>
      </div>
    `;

    this.element.innerHTML = html;
    this.element.style.display = 'flex';

    if (isBrowser) {
      const actionBtn = this.element.querySelector('.celebrate-action-btn');
      if (actionBtn) {
        actionBtn.addEventListener('click', () => {
          const nameInput = this.element.querySelector('#celebrate-pet-name');
          const enteredName = nameInput ? nameInput.value.trim() : null;
          if (typeof this.onActionCallback === 'function') {
            this.onActionCallback(enteredName);
          }
          this.hide();
        });
      }

      const closeBtn = this.element.querySelector('.celebrate-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.hide();
        });
      }
    } else {
      // Mock elements for headless testing
      this.element._nameInput = { value: currentName || defaultName };
      this.element._actionBtn = {
        click: () => {
          const enteredName = this.element._nameInput ? this.element._nameInput.value : null;
          if (typeof this.onActionCallback === 'function') {
            this.onActionCallback(enteredName);
          }
          this.hide();
        }
      };
      this.element._closeBtn = {
        click: () => {
          this.hide();
        }
      };
    }
  }

  /**
   * Closes the celebratory modal
   */
  hide() {
    this.isOpen = false;
    if (this.element) {
      this.element.style.display = 'none';
      this.element.innerHTML = '';
    }
    if (typeof this.onDismissCallback === 'function') {
      this.onDismissCallback();
    }
  }
}
