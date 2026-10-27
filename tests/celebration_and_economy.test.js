/**
 * Poyori (ポヨリ) — Celebration Modal & Economy Rebalance Tests
 * Verifies the challenging economy progression, starting balance,
 * cosmetic pricing ladder, and celebratory popup modal functionality.
 */

import test from 'node:test';
import assert from 'node:assert';
import { ACCESSORIES, DEFAULT_STATE } from '../shared/constants.js';
import { PoyoriEngine } from '../shared/game-engine.js';
import { CelebrationModal } from '../ui/celebration-modal.js';

test('ECONOMY: Rebalanced cosmetic costs make unlocking challenging and meaningful', () => {
  // Verify starting conditions: humble beginning
  assert.strictEqual(DEFAULT_STATE.koban, 10, 'Starting Koban must be 10 (not 50) so beginner must earn coins');
  assert.deepStrictEqual(DEFAULT_STATE.pet.unlockedAccessories, ['none'], 'Only "none" must be unlocked by default; all accessories must be earned');

  // Verify challenging tiered pricing
  assert.strictEqual(ACCESSORIES.hachimaki.cost, 100, 'Hachimaki (Apprentice tier) must cost 100 Koban');
  assert.strictEqual(ACCESSORIES.tanuki_leaf.cost, 200, 'Tanuki Leaf (Rookie tier) must cost 200 Koban');
  assert.strictEqual(ACCESSORIES.wizard_hat.cost, 400, 'Scholar Hat (Mage tier) must cost 400 Koban');
  assert.strictEqual(ACCESSORIES.cyber_visor.cost, 650, 'Cyber Visor (Champion tier) must cost 650 Koban');
  assert.strictEqual(ACCESSORIES.golden_crown.cost, 1200, 'Kōmyō Crown (Mythic Emperor tier) must cost 1200 Koban');
});

test('ECONOMY: Task addition enforces 10 Koban reward to support balanced progression', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  const res = PoyoriEngine.addTask(state, 'Complete deep work session', { coins: 9999, reward: 'nikuman' });

  assert.strictEqual(res.success, true);
  assert.strictEqual(res.task.coins, 10, 'Task coins must strictly be 10 Koban');
  assert.strictEqual(res.task.reward, 'ringo', 'Task reward must strictly be ringo');

  // To unlock the 100-coin Hachimaki, user must legitimately finish 10 tasks
  const requiredTasks = Math.ceil(ACCESSORIES.hachimaki.cost / res.task.coins);
  assert.strictEqual(requiredTasks, 10, 'Requires 10 completed focus tasks to buy first accessory');
});

test('CELEBRATION MODAL: Instantiation and DOM mounting in mock container', () => {
  // Create mock container
  const mockContainer = {
    children: [],
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    removeChild(child) {
      this.children = this.children.filter(c => c !== child);
    }
  };

  const modal = new CelebrationModal(mockContainer);
  assert.ok(modal, 'CelebrationModal instance created successfully');
  assert.ok(modal.element, 'Modal DOM element initialized');
});

test('CELEBRATION MODAL: Cosmetic purchase celebration modal content and equip callback', () => {
  const mockContainer = {
    children: [],
    appendChild(child) { this.children.push(child); },
    removeChild(child) { this.children = this.children.filter(c => c !== child); }
  };

  const modal = new CelebrationModal(mockContainer);
  let equipCalled = false;

  modal.show({
    type: 'cosmetic',
    title: 'ACCESSORY UNLOCKED!',
    subtitle: 'Focus Headband (鉢巻)',
    badgeText: '✨ NEW GEAR ✨',
    desc: 'Traditional white headband radiating unwavering determination.',
    cost: 100,
    actionLabel: 'Equip Now! ✨',
    onAction: () => { equipCalled = true; }
  });

  assert.strictEqual(modal.isOpen, true, 'Modal must be open');
  assert.ok(modal.element.innerHTML.includes('ACCESSORY UNLOCKED!'), 'Must include celebratory title');
  assert.ok(modal.element.innerHTML.includes('Focus Headband'), 'Must include accessory name');
  assert.ok(modal.element.innerHTML.includes('100'), 'Must display coin cost');

  // Trigger action button
  const actionBtn = modal.element.querySelector('.celebrate-action-btn');
  assert.ok(actionBtn, 'Must render primary celebratory action button');
  actionBtn.click();

  assert.strictEqual(equipCalled, true, 'Action callback (equip) must be executed');
  assert.strictEqual(modal.isOpen, false, 'Modal must close after action');
});

test('CELEBRATION MODAL: Evolution unlock celebration modal content', () => {
  const mockContainer = {
    children: [],
    appendChild(child) { this.children.push(child); },
    removeChild(child) { this.children = this.children.filter(c => c !== child); }
  };

  const modal = new CelebrationModal(mockContainer);

  modal.show({
    type: 'evolution',
    title: 'SHINKA! EVOLUTION! (進化)',
    subtitle: 'Kikai Neko (機械猫)',
    stageTitle: 'Stage 3: Kodama (Child / Rookie)',
    branch: 'Denki (Cyber)',
    desc: 'A cybernetic cat with mechanical paws and a mini LCD screen face.',
    actionLabel: 'Sugoi! (Awesome!) 🎉'
  });

  assert.strictEqual(modal.isOpen, true, 'Evolution celebration modal must be open');
  assert.ok(modal.element.innerHTML.includes('SHINKA! EVOLUTION!'), 'Must include evolution title');
  assert.ok(modal.element.innerHTML.includes('Kikai Neko'), 'Must include creature name');
  assert.ok(modal.element.innerHTML.includes('Stage 3'), 'Must include stage info');
});

test('CELEBRATION MODAL: Unlock naming prompt enables custom naming upon creature unlock/evolution', () => {
  const mockContainer = {
    children: [],
    appendChild(child) { this.children.push(child); },
    removeChild(child) { this.children = this.children.filter(c => c !== child); }
  };

  const modal = new CelebrationModal(mockContainer);
  let capturedName = null;

  modal.show({
    type: 'evolution',
    title: 'SHINKA! EVOLUTION! (進化)',
    subtitle: 'Kikai Neko (機械猫)',
    stageTitle: 'Stage 3: Kodama',
    defaultName: 'Poyori',
    currentName: 'Sparky',
    onAction: (name) => {
      capturedName = name;
    }
  });

  // Verify naming input exists in HTML
  assert.ok(modal.element.innerHTML.includes('NAME YOUR COMPANION:'), 'Modal must contain companion naming section');
  assert.ok(modal.element.innerHTML.includes('celebrate-name-input'), 'Modal must contain name input field');

  // Simulate user changing name in input field and pressing action button
  modal.element._nameInput.value = 'CyberWhiskers';
  modal.element._actionBtn.click();

  assert.strictEqual(capturedName, 'CyberWhiskers', 'Custom name entered by user must be passed to onAction callback');
  assert.strictEqual(modal.isOpen, false, 'Modal should close after naming companion');
});

