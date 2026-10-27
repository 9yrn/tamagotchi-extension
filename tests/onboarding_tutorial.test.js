/**
 * Poyori (ポヨリ) — Initial Setup Onboarding Tutorial Tests (TDD)
 * Verifies initial setup detection, 5-step tutorial walkthrough,
 * starter breed selection, custom naming, skip accessibility on every step,
 * and tutorial replay from preferences.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEFAULT_STATE, CREATURES } from '../shared/constants.js';
import { TutorialModal } from '../ui/tutorial-modal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('TUTORIAL TDD: Default state specifies tutorialCompleted as false', () => {
  assert.strictEqual(DEFAULT_STATE.settings.tutorialCompleted, false, 'Default state must require initial onboarding');
});

test('TUTORIAL TDD: TutorialModal renders 5 steps with skip button accessible on every step', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  const mockContainer = {
    children: [],
    appendChild(c) { this.children.push(c); return c; }
  };

  const modal = new TutorialModal(mockContainer, { state });
  modal.show();

  assert.strictEqual(modal.isOpen, true, 'Modal must be open');
  assert.strictEqual(modal.totalSteps, 5, 'Tutorial must have exactly 5 steps');

  // Verify each step renders and has skip button
  for (let s = 1; s <= 5; s++) {
    modal.currentStep = s;
    modal.renderStep();

    assert.ok(modal.element.innerHTML.includes(`TUTORIAL STEP ${s} / 5`), `Step ${s} must render step indicator`);
    assert.ok(modal.element.innerHTML.includes('Skip Tutorial'), `Step ${s} must contain accessible skip button`);
    assert.ok(modal.element.innerHTML.includes('tutorial-skip-top-btn'), `Step ${s} must have top-right quick skip`);
    assert.ok(modal.element.innerHTML.includes('tutorial-skip-btn'), `Step ${s} must have bottom-left skip button`);
  }
});

test('TUTORIAL TDD: Starter breed selection and pet naming in Step 2 updates player state', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  const mockContainer = {
    children: [],
    appendChild(c) { this.children.push(c); return c; }
  };

  const modal = new TutorialModal(mockContainer, { state });
  modal.show({ step: 2 });

  assert.strictEqual(modal.currentStep, 2);
  assert.ok(modal.element.innerHTML.includes('CHOOSE YOUR STARTER BREED'), 'Must render starter selection header');
  assert.ok(modal.element.innerHTML.includes('tutorial-name-input'), 'Must render custom name input');

  // Select Creative Bird starter egg
  modal.selectedStarterId = 'creative_tamago';
  modal.enteredPetName = 'AuraPip';
  modal.applyStarterChoice();

  assert.strictEqual(state.pet.creatureId, 'creative_tamago', 'Pet creatureId must be creative_tamago');
  assert.strictEqual(state.pet.name, 'AuraPip', 'Pet name must update to AuraPip');
  assert.strictEqual(state.pet.chosenBranch, 'creative', 'Pet branch must update to creative');
  assert.strictEqual(state.roster[0].creatureId, 'creative_tamago', 'Roster slot 0 must update to selected starter');
  assert.strictEqual(state.roster[0].name, 'AuraPip', 'Roster slot 0 name must update');
});

test('TUTORIAL TDD: Skipping tutorial at any step marks tutorialCompleted as true', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  let callbackInvoked = false;

  const modal = new TutorialModal(null, {
    state,
    onFinish: ({ skipped }) => {
      callbackInvoked = true;
      assert.strictEqual(skipped, true, 'Callback must flag skipped');
    }
  });

  modal.show({ step: 1 });
  assert.strictEqual(state.settings.tutorialCompleted, false);

  modal.skip();
  assert.strictEqual(state.settings.tutorialCompleted, true, 'Skipping tutorial must mark tutorialCompleted as true');
  assert.strictEqual(modal.isOpen, false, 'Modal must close on skip');
  assert.strictEqual(callbackInvoked, true, 'Finish callback must be triggered on skip');
});

test('TUTORIAL TDD: Completing all 5 steps marks tutorialCompleted as true and invokes completion callback', () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  let completedCleanly = false;

  const modal = new TutorialModal(null, {
    state,
    onFinish: ({ skipped }) => {
      completedCleanly = !skipped;
    }
  });

  modal.show({ step: 1 });
  for (let s = 1; s <= 5; s++) {
    modal.next();
  }

  assert.strictEqual(state.settings.tutorialCompleted, true, 'Completing tutorial must mark tutorialCompleted as true');
  assert.strictEqual(completedCleanly, true, 'Completion must not be marked as skipped');
  assert.strictEqual(modal.isOpen, false, 'Modal must be closed after completion');
});

test('TUTORIAL TDD: Background service worker opens dashboard on fresh install', () => {
  const bgPath = path.join(rootDir, 'background/background.js');
  const bgContent = fs.readFileSync(bgPath, 'utf8');

  assert.ok(bgContent.includes("details.reason === 'install'"), 'Must check for fresh install reason');
  assert.ok(bgContent.includes("dashboard/dashboard.html"), 'Must open dashboard.html on install');
});

test('TUTORIAL TDD: Preferences tab contains Replay Onboarding Tutorial button', () => {
  const htmlPath = path.join(rootDir, 'dashboard/dashboard.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  assert.ok(htmlContent.includes('id="btn-replay-tutorial"'), 'Must contain #btn-replay-tutorial button in Preferences');
  assert.ok(htmlContent.includes('Replay Onboarding Tutorial'), 'Must display Replay Onboarding Tutorial label');
});

test('TUTORIAL TDD: Step 5 explains Pocket Mode and Sizing features', () => {
  const modal = new TutorialModal(null, { state: JSON.parse(JSON.stringify(DEFAULT_STATE)) });
  modal.show({ step: 5 });
  const html = modal.element.innerHTML;
  assert.ok(html.includes('Pocket Mode'), 'Step 5 must explain Pocket Mode');
  assert.ok(html.includes('Sizing'), 'Step 5 must explain Sizing');
  assert.ok(html.includes('Giant (96px)'), 'Step 5 must list size presets');
});
