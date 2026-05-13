'use strict';

const { createApp } = require('../script');
const { FakeDocument, createStorage } = require('./helpers/fakeDom');

const APP_IDS = [
  'status-message', 'mode-section', 'wizard-section', 'builder-section', 'results-section', 'results-title', 'results-summary',
  'open-wizard-btn', 'open-builder-btn', 'wizard-back-btn', 'builder-back-btn', 'results-back-btn', 'restart-btn',
  'player-count', 'official-role-summary', 'wizard-preset-name', 'wizard-preset-select', 'save-wizard-preset-btn',
  'load-wizard-preset-btn', 'delete-wizard-preset-btn', 'custom-label-liberal', 'custom-label-fascist', 'custom-label-hitler',
  'custom-img-liberal', 'custom-img-fascist', 'custom-img-hitler', 'custom-preview-liberal', 'custom-preview-fascist',
  'custom-preview-hitler', 'reset-role-liberal', 'reset-role-fascist', 'reset-role-hitler', 'wizard-paper-size', 'wizard-columns',
  'wizard-rows', 'wizard-back-label', 'wizard-crop-marks', 'wizard-include-backs', 'wizard-duplex', 'wizard-png-scale', 'generate-btn',
  'builder-preset-select', 'apply-builder-preset-btn', 'builder-config-name', 'save-builder-config-btn', 'builder-config-select',
  'load-builder-config-btn', 'delete-builder-config-btn', 'builder-role-key', 'builder-role-label', 'builder-role-icon',
  'builder-role-count', 'builder-role-theme', 'builder-role-image', 'builder-role-image-preview', 'builder-role-desc',
  'builder-save-role-btn', 'builder-cancel-edit-btn', 'custom-role-list', 'builder-card-total', 'builder-paper-size', 'builder-columns',
  'builder-rows', 'builder-back-label', 'builder-crop-marks', 'builder-include-backs', 'builder-duplex', 'builder-png-scale',
  'generate-custom-btn', 'role-cards', 'download-pdf-btn', 'download-png-btn', 'print-btn', 'print-cards',
];

function setupApp() {
  const document = new FakeDocument(APP_IDS);
  const storage = createStorage();
  const alerts = [];
  const window = {
    alert(message) {
      alerts.push(message);
    },
    print: jest.fn(),
    scrollTo: jest.fn(),
  };

  const app = createApp({ document, window, storage });
  return { app, document, storage, window, alerts };
}

describe('createApp()', () => {
  test('generates an official deck with selected player count and custom labels', () => {
    const { app } = setupApp();
    app.elements['open-wizard-btn'].click();
    app.elements['player-count'].value = '5';
    app.elements['custom-label-liberal'].value = 'Reformer';

    app.elements['generate-btn'].click();

    expect(app.state.currentResult.cards).toHaveLength(5);
    expect(app.state.currentResult.cards.filter((card) => card.label === 'Reformer')).toHaveLength(3);
    expect(app.elements['role-cards'].children).toHaveLength(5);
    expect(app.elements['results-title'].textContent).toContain('5-player official deck');
  });

  test('saves, loads, and deletes wizard presets', () => {
    const { app, alerts } = setupApp();
    app.elements['open-wizard-btn'].click();
    app.elements['player-count'].value = '7';
    app.elements['custom-label-hitler'].value = 'Chancellor';
    app.elements['wizard-preset-name'].value = 'My preset';

    app.elements['save-wizard-preset-btn'].click();
    expect(app.state.wizardPresets).toHaveLength(1);

    app.elements['player-count'].value = '5';
    app.elements['custom-label-hitler'].value = 'Reset';
    app.elements['wizard-preset-select'].value = app.state.wizardPresets[0].id;
    app.elements['load-wizard-preset-btn'].click();

    expect(app.elements['player-count'].value).toBe('7');
    expect(app.elements['custom-label-hitler'].value).toBe('Chancellor');

    app.elements['delete-wizard-preset-btn'].click();
    expect(app.state.wizardPresets).toHaveLength(0);
    expect(alerts).toEqual([]);
  });

  test('applies a builder preset and generates a custom deck', () => {
    const { app } = setupApp();
    app.elements['open-builder-btn'].click();
    app.elements['builder-preset-select'].value = 'shadow-council';

    app.elements['apply-builder-preset-btn'].click();
    expect(app.state.builderRoles).toHaveLength(4);
    expect(app.elements['builder-card-total'].textContent).toBe('8 cards');

    app.elements['generate-custom-btn'].click();
    expect(app.state.currentResult.cards).toHaveLength(8);
    expect(app.elements['results-title'].textContent).toContain('8-card custom deck');
  });

  test('adds a builder role, saves a configuration, and resets state', () => {
    const { app } = setupApp();
    app.elements['open-builder-btn'].click();
    app.elements['builder-role-label'].value = 'Agent';
    app.elements['builder-role-key'].value = 'agent';
    app.elements['builder-role-icon'].value = '🕵️';
    app.elements['builder-role-count'].value = '2';
    app.elements['builder-role-desc'].value = 'Stay hidden and gather clues.';

    app.elements['builder-save-role-btn'].click();
    expect(app.state.builderRoles).toHaveLength(1);
    expect(app.elements['custom-role-list'].children).toHaveLength(1);

    app.elements['builder-config-name'].value = 'Agents only';
    app.elements['save-builder-config-btn'].click();
    expect(app.state.builderConfigs).toHaveLength(1);

    app.startOver();
    expect(app.state.builderRoles).toHaveLength(0);
    expect(app.state.currentResult).toBeNull();
    expect(app.elements['mode-section'].classList.contains('hidden')).toBe(false);
  });
});
