/**
 * Poyori (ポヨリ) — Roaming Pet Physics & Animation Controller
 * Handles bottom-edge wandering, drag-and-drop, state animations, and emote bubbles.
 */

import { getCreatureSprite, getAccessorySvg } from './sprites.js';
import { audioSynth } from '../ui/audio.js';
import { getPixelIconHtml } from '../shared/pixel-icons.js';
import { getCreatureSound } from '../shared/constants.js';

export class PoyoriController {
  constructor(shadowRoot, options = {}) {
    this.shadowRoot = shadowRoot;
    this.options = options;

    // Elements
    this.container = null;
    this.spriteEl = null;
    this.accessoryEl = null;
    this.emoteEl = null;
    this.soundBubbleEl = null;
    this.bubbleContainer = null;

    // Pet Settings & Adjustable Size
    this.settings = options.settings || {};
    const presetSizes = { small: 48, normal: 64, large: 80, giant: 96 };
    this.sizePx = (options.settings && (options.settings.petSizePx || presetSizes[options.settings.petSize])) || 64;

    // Position & Physics — Corner-to-corner walking patrol
    const winW = (typeof window !== 'undefined' && window.innerWidth) || 1024;
    const winH = (typeof window !== 'undefined' && window.innerHeight) || 768;
    this.x = Math.max(12, winW - this.sizePx - 16);
    this.y = winH - this.sizePx - 6; // Bottom viewport edge
    this.vx = 0.85;
    this.direction = -1; // -1: left toward left corner, 1: right toward right corner
    this.state = 'idle';
    this.cornerRestSteps = 0;
    this.nextDirection = 1;
    
    // Animation frame timing
    this.frameIndex = 0;
    this.lastFrameTime = 0;
    this.stateTimer = 0;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };

    // Pet Data
    this.petData = options.petData || {
      creatureId: 'denki_tamago',
      accessory: 'none',
      isSleeping: false,
      isSick: false
    };

    this.initDOM();
    this.bindEvents();
    this.startLoop();
  }

  initDOM() {
    this.container = document.createElement('div');
    this.container.className = 'poyori-pet-container';
    if (this.container.style) {
      if (typeof this.container.style.setProperty === 'function') {
        this.container.style.setProperty('--pet-size', `${this.sizePx}px`);
      } else {
        this.container.style['--pet-size'] = `${this.sizePx}px`;
      }
      this.container.style.width = `${this.sizePx}px`;
      this.container.style.height = `${this.sizePx}px`;
      this.container.style.left = `${this.x}px`;
      this.container.style.top = `${this.y}px`;
    }

    // Inner sprite wrapper
    const spriteWrapper = document.createElement('div');
    spriteWrapper.className = 'poyori-sprite-wrapper';

    this.spriteEl = document.createElement('img');
    this.spriteEl.className = 'poyori-sprite';
    this.spriteEl.draggable = false;
    this.spriteEl.alt = 'Poyori';

    this.accessoryEl = document.createElement('img');
    this.accessoryEl.className = 'poyori-accessory';
    this.accessoryEl.draggable = false;

    // Emote bubble
    this.emoteEl = document.createElement('div');
    this.emoteEl.className = 'poyori-emote-bubble';

    // Animal Sound Bubble
    this.soundBubbleEl = document.createElement('div');
    this.soundBubbleEl.className = 'poyori-sound-bubble';

    spriteWrapper.appendChild(this.spriteEl);
    spriteWrapper.appendChild(this.accessoryEl);
    this.container.appendChild(this.emoteEl);
    this.container.appendChild(this.soundBubbleEl);
    this.container.appendChild(spriteWrapper);

    this.shadowRoot.appendChild(this.container);
    if (this.settings && this.settings.petVisible === false) {
      this.container.style.display = 'none';
    }
    this.updateSpriteGraphics();
  }

  updatePetData(newPetData, newSettings) {
    this.petData = { ...this.petData, ...newPetData };
    if (newSettings) {
      this.settings = { ...this.settings, ...newSettings };
      if (newSettings.petSizePx || newSettings.petSize) {
        this.setPetSize(newSettings.petSizePx || newSettings.petSize);
      }
      if (newSettings.petVisible !== undefined) {
        this.setVisibility(newSettings.petVisible);
      }
    }
    if (this.petData.isSleeping) {
      this.state = 'sleep';
    } else if (this.state === 'sleep' && !this.petData.isSleeping) {
      this.state = 'idle';
    }
    this.updateSpriteGraphics();
  }

  setVisibility(visible) {
    if (this.container && this.container.style) {
      this.container.style.display = visible ? 'flex' : 'none';
    }
  }

  setPetSize(sizeKeyOrPx) {
    let px = 64;
    if (typeof sizeKeyOrPx === 'number') {
      px = sizeKeyOrPx;
    } else if (typeof sizeKeyOrPx === 'string') {
      const sizes = { small: 48, normal: 64, large: 80, giant: 96 };
      px = sizes[sizeKeyOrPx] || 64;
    }
    this.sizePx = px;
    if (this.container && this.container.style) {
      if (typeof this.container.style.setProperty === 'function') {
        this.container.style.setProperty('--pet-size', `${this.sizePx}px`);
      } else {
        this.container.style['--pet-size'] = `${this.sizePx}px`;
      }
      this.container.style.width = `${this.sizePx}px`;
      this.container.style.height = `${this.sizePx}px`;

      if (this.spriteEl && this.spriteEl.style) {
        this.spriteEl.style.width = `${this.sizePx}px`;
        this.spriteEl.style.height = `${this.sizePx}px`;
      }
      if (this.accessoryEl && this.accessoryEl.style) {
        this.accessoryEl.style.width = `${this.sizePx}px`;
        this.accessoryEl.style.height = `${this.sizePx}px`;
      }

      // Keep within screen bounds and snap to floor if not being actively dragged
      const winW = typeof window !== 'undefined' ? window.innerWidth : 800;
      const winH = typeof window !== 'undefined' ? window.innerHeight : 600;
      const maxX = Math.max(10, winW - this.sizePx - 16);
      this.x = Math.max(10, Math.min(this.x, maxX));
      this.container.style.left = `${this.x}px`;
      const maxY = Math.max(10, winH - this.sizePx - 6);
      if (!this.isDragging) {
        this.y = maxY;
        this.container.style.top = `${this.y}px`;
      } else if (this.y > maxY) {
        this.y = maxY;
        this.container.style.top = `${this.y}px`;
      }
    }
  }

  updateSpriteGraphics() {
    if (!this.spriteEl) return;
    let action = (this.state === 'petted') ? 'petted'
               : (this.state === 'walk') ? (this.frameIndex % 2 === 0 ? 'idle1' : 'idle2')
               : (this.state === 'sleep') ? 'idle1'
               : (this.state === 'eat') ? 'idle2'
               : (this.frameIndex % 2 === 0 ? 'idle1' : 'idle2');

    // Emotive SVG actions when roaming or idling
    if (this.state === 'idle' || this.state === 'walk') {
      if (this.petData.mood === 'hungry' || (this.petData.onaka !== undefined && this.petData.onaka < 30)) {
        action = 'hungry';
      } else if (this.isProcrastinating || this.petData.mood === 'procrastinating') {
        action = 'procrastinating';
      } else if (this.petData.mood === 'grumpy') {
        action = 'grumpy';
      }
    }

    const svgUri = getCreatureSprite(this.petData.creatureId, action, this.petData.accessory);
    this.spriteEl.src = svgUri;

    // Accessory overlay
    if (this.petData.accessory && this.petData.accessory !== 'none') {
      const accUri = getAccessorySvg(this.petData.accessory);
      if (accUri) {
        this.accessoryEl.src = accUri;
        this.accessoryEl.style.display = 'block';
      } else {
        this.accessoryEl.style.display = 'none';
      }
    } else {
      this.accessoryEl.style.display = 'none';
    }

    // Direction flip
    this.spriteEl.style.transform = `scaleX(${this.direction})`;
    if (this.accessoryEl) {
      this.accessoryEl.style.transform = `scaleX(${this.direction})`;
    }
  }

  /**
   * Minimal, custom in-sprite reaction when petted:
   * Creature squishes, springs up affectionately, blushes with happy squint eyes, and purrs!
   * No emojis used.
   */
  triggerPetReaction() {
    this.state = 'petted';
    if (this.emoteEl) this.emoteEl.classList.remove('visible');
    this.container.classList.add('petting-reaction');
    this.updateSpriteGraphics();
    audioSynth.purr();

    clearTimeout(this._petTimeout);
    this._petTimeout = setTimeout(() => {
      this.container.classList.remove('petting-reaction');
      this.state = this.petData.isSleeping ? 'sleep' : 'idle';
      this.updateSpriteGraphics();
    }, 1800);
  }

  showEmote(iconKeyOrEmoji, duration = 2500) {
    if (!this.emoteEl) return;
    this.emoteEl.innerHTML = getPixelIconHtml(iconKeyOrEmoji, 16);
    this.emoteEl.classList.add('visible');
    clearTimeout(this._emoteTimeout);
    this._emoteTimeout = setTimeout(() => {
      this.emoteEl.classList.remove('visible');
    }, duration);
  }

  showSoundBubble(customText, duration = 2500) {
    if (!this.soundBubbleEl) return;
    const sound = customText || getCreatureSound(this.petData.creatureId);
    this.soundBubbleEl.textContent = sound;
    this.soundBubbleEl.classList.add('visible');
    try {
      if (audioSynth && typeof audioSynth.playAnimalSound === 'function') {
        audioSynth.playAnimalSound(this.petData.creatureId);
      }
    } catch (_) {}
    clearTimeout(this._soundTimeout);
    this._soundTimeout = setTimeout(() => {
      if (this.soundBubbleEl) this.soundBubbleEl.classList.remove('visible');
    }, duration);
  }

  reachCorner(nextDirection) {
    this.state = 'idle';
    this.nextDirection = nextDirection;
    this.cornerRestSteps = 6; // Rest at corner for ~2.7s before turning
    this.stateTimer = 0;
    this.showSoundBubble();
  }

  glideToFloor() {
    const floorY = Math.max(10, window.innerHeight - this.sizePx - 6);
    if (this.y >= floorY) return;

    cancelAnimationFrame(this._glideRaf);
    const startY = this.y;
    const diff = floorY - startY;
    const duration = 350;
    const startTime = performance.now();

    const step = (now) => {
      if (this.isDragging) return;
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.y = startY + (diff * eased);
      if (this.container) this.container.style.top = `${this.y}px`;
      if (progress < 1) {
        this._glideRaf = requestAnimationFrame(step);
      } else {
        this.y = floorY;
        if (this.container) this.container.style.top = `${this.y}px`;
      }
    };
    this._glideRaf = requestAnimationFrame(step);
  }

  bindEvents() {
    if (this.soundBubbleEl) {
      this.soundBubbleEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showSoundBubble();
      });
    }

    // Drag & Drop
    this.container.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return; // Left click only
      this.isDragging = true;
      try { this.container.setPointerCapture(e.pointerId); } catch (_) {}
      cancelAnimationFrame(this._glideRaf);
      this.dragOffset.x = e.clientX - this.x;
      this.dragOffset.y = e.clientY - this.y;
      this.container.classList.add('dragging');
      this.state = 'drag';
      this.showEmote('paw', 1500);
      audioSynth.boop();
      e.stopPropagation();
      e.preventDefault();
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      const maxX = Math.max(10, window.innerWidth - this.sizePx - 10);
      const maxY = Math.max(0, window.innerHeight - this.sizePx - 6);
      this.x = Math.max(0, Math.min(maxX, e.clientX - this.dragOffset.x));
      this.y = Math.max(0, Math.min(maxY, e.clientY - this.dragOffset.y));
      this.container.style.left = `${this.x}px`;
      this.container.style.top = `${this.y}px`;
    });

    const endDrag = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      try { if (e && e.pointerId) this.container.releasePointerCapture(e.pointerId); } catch (_) {}
      this.container.classList.remove('dragging');
      this.glideToFloor();
      this.state = this.petData.isSleeping ? 'sleep' : 'idle';
      this.updateSpriteGraphics();
    };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    window.addEventListener('blur', () => { if (this.isDragging) endDrag(); });

    // Smooth tab switching: synchronize state when returning to tab
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.lastFrameTime = performance.now();
          if (this.petData.isSleeping) {
            this.state = 'sleep';
          } else if (this.state === 'sleep' && !this.petData.isSleeping) {
            this.state = 'idle';
          }
          this.updateSpriteGraphics();
        }
      });
    }

    // Window resize adjustment with boundary guarantees for responsive and Arc split views
    window.addEventListener('resize', () => {
      const maxX = Math.max(10, window.innerWidth - this.sizePx - 16);
      const maxY = Math.max(10, window.innerHeight - this.sizePx - 6);
      this.x = Math.max(10, Math.min(this.x, maxX));
      this.y = Math.max(10, Math.min(this.y, maxY));
      this.container.style.left = `${this.x}px`;
      this.container.style.top = `${this.y}px`;
    });
  }

  triggerFeedAnimation() {
    this.state = 'eat';
    this.showEmote('heart_full', 2200);
    this.updateSpriteGraphics();
    setTimeout(() => {
      this.state = this.petData.isSleeping ? 'sleep' : 'idle';
      this.updateSpriteGraphics();
    }, 2000);
  }

  triggerCheerAnimation() {
    this.state = 'cheer';
    this.showEmote('star', 2500);
    this.container.classList.add('cheering');
    setTimeout(() => {
      this.container.classList.remove('cheering');
      this.state = this.petData.isSleeping ? 'sleep' : 'idle';
      this.updateSpriteGraphics();
    }, 2500);
  }

  startLoop() {
    const loop = (timestamp) => {
      // 2 FPS animation step for retro 8-bit feel
      if (timestamp - this.lastFrameTime > 450) {
        this.lastFrameTime = timestamp;
        this.frameIndex++;
        this.stepBehavior();
        this.updateSpriteGraphics();
      }

      // Smooth roaming physics: corner-to-corner walking patrol
      if (!this.isDragging && this.state === 'walk') {
        this.x += this.vx * this.direction;
        
        // Dynamic edge corners adapting to any aspect ratio and screen width
        const minX = 12;
        const winW = (typeof window !== 'undefined' && window.innerWidth) || 1024;
        const maxX = Math.max(minX, winW - this.sizePx - 12);

        if (this.direction === -1 && this.x <= minX) {
          this.x = minX;
          this.reachCorner(1); // Reached left corner, turn toward right corner
        } else if (this.direction === 1 && this.x >= maxX) {
          this.x = maxX;
          this.reachCorner(-1); // Reached right corner, turn toward left corner
        }
        if (this.container && this.container.style) {
          this.container.style.left = `${this.x}px`;
        }
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  stepBehavior() {
    if (this.isDragging || this.state === 'eat' || this.state === 'cheer') return;

    if (this.petData.isSleeping) {
      this.state = 'sleep';
      if (this.frameIndex % 3 === 0) {
        this.showEmote('sleep_zzz', 1800);
      }
      return;
    }

    if (this.petData.isSick) {
      if (this.frameIndex % 4 === 0) {
        this.showEmote('water_drop', 1800);
      }
    }

    // Visibly emote when hungry, procrastinating, or grumpy
    if (this.petData.mood === 'hungry' || (this.petData.onaka !== undefined && this.petData.onaka < 30)) {
      if (this.frameIndex % 6 === 0) {
        this.showEmote('apple', 2000);
      }
    } else if (this.isProcrastinating || this.petData.mood === 'procrastinating') {
      if (this.frameIndex % 5 === 0) {
        this.showEmote('sleep_zzz', 2000);
      }
    } else if (this.petData.mood === 'grumpy') {
      if (this.frameIndex % 6 === 0) {
        this.showEmote('sweat', 2000);
      }
    }

    // Occasional ambient quirky sound during roaming (every ~20-30 seconds)
    if (this.frameIndex > 0 && this.frameIndex % 45 === 0 && Math.random() > 0.3) {
      this.showSoundBubble();
    }

    this.stateTimer++;

    // Corner rest handling or idle-to-walk transition
    if (this.state === 'idle') {
      if (this.cornerRestSteps > 0) {
        this.cornerRestSteps--;
        if (this.cornerRestSteps <= 0) {
          // Finished resting at corner, flip and walk across to opposite corner!
          this.direction = (this.nextDirection !== undefined) ? this.nextDirection : (this.x <= 20 ? 1 : -1);
          this.state = 'walk';
          this.stateTimer = 0;
        }
      } else if (this.stateTimer > 6) {
        // Resume walking to opposite corner
        const minX = 12;
        const winW = (typeof window !== 'undefined' && window.innerWidth) || 1024;
        const maxX = Math.max(minX, winW - this.sizePx - 12);
        this.direction = (this.x <= minX + 50) ? 1 : -1;
        this.state = 'walk';
        this.stateTimer = 0;
      }
    }
  }
}
