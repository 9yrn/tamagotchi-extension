import test from 'node:test';
import assert from 'node:assert/strict';


// Mock DOM elements and environment
class MockElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.style = {
      setProperty: (k, v) => { this.style[k] = v; }
    };
    this.attributes = {};
    this.eventListeners = {};
    this.shadowRoot = null;
    this.innerHTML = '';
    this.textContent = '';
    this.src = '';
    this._className = '';
  }

  get className() { return this._className; }
  set className(val) { this._className = val; }

  get classList() {
    const self = this;
    return {
      add: (c) => self.className = (self.className + ' ' + c).trim(),
      remove: (c) => {
        self.className = self.className.split(' ').filter(x => x !== c).join(' ');
      },
      contains: (c) => self.className.split(' ').includes(c)
    };
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  addEventListener(type, listener) {
    if (!this.eventListeners[type]) this.eventListeners[type] = [];
    this.eventListeners[type].push(listener);
  }

  removeEventListener(type, listener) {
    if (!this.eventListeners[type]) return;
    this.eventListeners[type] = this.eventListeners[type].filter(l => l !== listener);
  }
}

global.document = {
  createElement: (tag) => new MockElement(tag)
};

global.window = {
  innerWidth: 1024,
  innerHeight: 768,
  addEventListener: () => {},
  removeEventListener: () => {}
};

// Mock AudioSynth since it requires a real window/audio context





global.requestAnimationFrame = (cb) => { /* do nothing to avoid infinite loop */ };


const { audioSynth } = await import('../ui/audio.js');
audioSynth.purr = () => {};
audioSynth.boop = () => {};
const { PoyoriController } = await import('../content/pet-controller.js');




test('PoyoriController Initialization', () => {
  const mockShadowRoot = new MockElement('div');
  const controller = new PoyoriController(mockShadowRoot, {
    settings: { petSize: 'normal' }
  });

  assert.equal(controller.state, 'idle', 'Default state should be idle');
  assert.equal(controller.sizePx, 64, 'Normal size should map to 64px');
  assert.equal(controller.direction, -1, 'Default direction should be left');

  // Initialize DOM
  controller.petData = { creatureId: 'denki_tamago', accessory: 'none' };
  controller.initDOM();

  assert.ok(controller.container, 'Container element should be created');
  assert.ok(controller.spriteEl, 'Sprite element should be created');
  assert.ok(controller.accessoryEl, 'Accessory element should be created');
  assert.ok(controller.emoteEl, 'Emote element should be created');

  // initDOM could be called by constructor, so we check >= 1
  assert.ok(mockShadowRoot.children.length >= 1, 'ShadowRoot should have at least one child');
  assert.ok(mockShadowRoot.children.includes(controller.container), 'Container should be appended to ShadowRoot');
});

test('PoyoriController setPetSize and bounds', () => {
  const mockShadowRoot = new MockElement('div');
  const controller = new PoyoriController(mockShadowRoot, {
    settings: { petSize: 'small' }
  });
  controller.petData = { creatureId: 'denki_tamago', accessory: 'none' };
  controller.initDOM();

  assert.equal(controller.sizePx, 48, 'Small size should be 48px');

  controller.setPetSize('large');
  assert.equal(controller.sizePx, 80, 'Large size should be 80px');
  assert.equal(controller.container.style['--pet-size'], '80px', 'CSS custom property should update');
  assert.equal(controller.container.style.width, '80px', 'Container width should update');

  controller.setPetSize(75);
  assert.equal(controller.sizePx, 75, 'Numeric size should set directly');

  // Test Bounds
  controller.x = 2000; // Out of bounds
  controller.setPetSize('normal'); // 64px, triggers boundary check
  const winW = global.window.innerWidth; // 1024
  const expectedMaxX = Math.max(20, winW - 64 - 16); // 944
  assert.equal(controller.x, expectedMaxX, 'X position should be constrained to max bounds');

  controller.y = 2000;
  controller.isDragging = false;
  controller.setPetSize('normal'); // triggers boundary check
  const winH = global.window.innerHeight; // 768
  const expectedMaxY = Math.max(20, winH - 64 - 6); // 698
  assert.equal(controller.y, expectedMaxY, 'Y position should snap to floor when not dragging');
});

test('PoyoriController updateSpriteGraphics', () => {
  const mockShadowRoot = new MockElement('div');
  const controller = new PoyoriController(mockShadowRoot, { settings: {} });
  controller.petData = { creatureId: 'denki_tamago', accessory: 'none' };
  controller.initDOM();

  controller.state = 'walk';
  controller.frameIndex = 0;
  controller.updateSpriteGraphics();
  const idle1Src = controller.spriteEl.src;

  controller.frameIndex = 1;
  controller.updateSpriteGraphics();
  const idle2Src = controller.spriteEl.src;

  // The getCreatureSprite might return the same SVG if 'idle2' isn't explicitly distinct for this creature in tests, so let's just check they are generated
  assert.ok(idle1Src.includes('data:image/svg+xml'), 'Should generate valid SVG for idle1');
  assert.ok(idle2Src.includes('data:image/svg+xml'), 'Should generate valid SVG for idle2');


  // Direction
  controller.direction = 1;
  controller.updateSpriteGraphics();
  assert.equal(controller.spriteEl.style.transform, 'scaleX(1)', 'Sprite transform should match direction 1');

  controller.direction = -1;
  controller.updateSpriteGraphics();
  assert.equal(controller.spriteEl.style.transform, 'scaleX(-1)', 'Sprite transform should match direction -1');

  // Accessory
  controller.petData.accessory = 'hachimaki';
  controller.updateSpriteGraphics();
  assert.ok(controller.accessoryEl.src.includes('data:image/svg+xml'), 'Accessory src should be set when accessory is equipped');
  assert.equal(controller.accessoryEl.style.display, 'block', 'Accessory should be visible');

  controller.petData.accessory = 'none';
  controller.updateSpriteGraphics();
  assert.equal(controller.accessoryEl.style.display, 'none', 'Accessory should be hidden when none');
});

test('PoyoriController Animations and Emotes', () => {
  const mockShadowRoot = new MockElement('div');
  const controller = new PoyoriController(mockShadowRoot, { settings: {} });
  controller.petData = { creatureId: 'denki_tamago', accessory: 'none', isSleeping: false };
  controller.initDOM();

  // Pet Reaction
  controller.triggerPetReaction();
  assert.equal(controller.state, 'petted', 'State should be petted');
  assert.ok(controller.container.classList.contains('petting-reaction'), 'Should add petting-reaction class');

  // Feed Animation
  controller.triggerFeedAnimation();
  assert.equal(controller.state, 'eat', 'State should be eat');
  assert.ok(controller.emoteEl.classList.contains('visible'), 'Emote should be visible');

  // Cheer Animation
  controller.triggerCheerAnimation();
  assert.equal(controller.state, 'cheer', 'State should be cheer');
  assert.ok(controller.container.classList.contains('cheering'), 'Should add cheering class');

  // Emote logic
  controller.showEmote('spark', 1000);
  assert.ok(controller.emoteEl.innerHTML.includes('<img'), 'Emote should contain an image tag');
  assert.ok(controller.emoteEl.classList.contains('visible'), 'Emote should be visible');
});

test('PoyoriController Corner-to-Corner Walking Patrol Across Aspect Ratios', () => {
  const mockShadowRoot = new MockElement('div');
  const controller = new PoyoriController(mockShadowRoot, { settings: { petSize: 'normal' } });
  controller.petData = { creatureId: 'coding_cat_1', accessory: 'none', isSleeping: false };
  controller.initDOM();

  assert.ok(controller.soundBubbleEl, 'Sound bubble element should exist in DOM');

  // Test across multiple aspect ratios: Mobile (375px), Desktop (1024px), Ultrawide (3440px)
  const viewports = [
    { name: 'Mobile 375px', width: 375 },
    { name: 'Desktop 1024px', width: 1024 },
    { name: 'Ultrawide 3440px', width: 3440 }
  ];

  for (const vp of viewports) {
    global.window.innerWidth = vp.width;
    const minX = 12;
    const maxX = Math.max(minX, vp.width - controller.sizePx - 12);

    // 1. Position pet at right corner, heading left (-1)
    controller.x = maxX;
    controller.direction = -1;
    controller.state = 'walk';
    controller.cornerRestSteps = 0;

    // Simulate stepping: pet should walk until reaching left corner
    let steps = 0;
    while (controller.x > minX && steps < 5000) {
      controller.x += controller.vx * controller.direction;
      if (controller.x <= minX) {
        controller.x = minX;
        controller.reachCorner(1);
        break;
      }
      steps++;
    }

    assert.equal(controller.x, minX, `${vp.name}: Pet must reach exact left corner`);
    assert.equal(controller.state, 'idle', `${vp.name}: Pet enters corner rest upon reaching corner`);
    assert.equal(controller.nextDirection, 1, `${vp.name}: Next direction set to walk toward right corner`);
    assert.ok(controller.cornerRestSteps > 0, `${vp.name}: Rest timer initialized`);
    assert.ok(controller.soundBubbleEl.classList.contains('visible'), `${vp.name}: Sound bubble is visible at corner`);

    // 2. Simulate corner rest countdown in stepBehavior()
    while (controller.cornerRestSteps > 0) {
      controller.stepBehavior();
    }
    assert.equal(controller.state, 'walk', `${vp.name}: Pet resumes walking after resting at corner`);
    assert.equal(controller.direction, 1, `${vp.name}: Direction flips toward right corner`);

    // 3. Walk all the way to right corner
    steps = 0;
    while (controller.x < maxX && steps < 5000) {
      controller.x += controller.vx * controller.direction;
      if (controller.x >= maxX) {
        controller.x = maxX;
        controller.reachCorner(-1);
        break;
      }
      steps++;
    }

    assert.equal(controller.x, maxX, `${vp.name}: Pet must reach exact right corner`);
    assert.equal(controller.nextDirection, -1, `${vp.name}: Next direction set to walk toward left corner`);
    assert.ok(controller.soundBubbleEl.classList.contains('visible'), `${vp.name}: Sound bubble triggers at right corner`);
  }
});
