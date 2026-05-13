'use strict';

(function initAppFactory(globalScope) {
  const lib = globalScope.SecretHitlerLib || require('./lib');
  const ui = globalScope.SecretHitlerUI || require('./ui');
  const exporters = globalScope.SecretHitlerExporters || require('./exporters');

  const STORAGE_KEYS = {
    wizardPresets: 'shg-wizard-presets-v2',
    builderConfigs: 'shg-builder-configs-v2',
  };

  const BUILDER_PRESETS = [
    {
      id: 'shadow-council',
      name: 'Shadow Council (8 cards)',
      roles: [
        { key: 'citizen', label: 'Citizen', icon: '🕊️', desc: 'Work with the table to expose the conspirators.', count: 4, cssClass: 'custom-0' },
        { key: 'cabalist', label: 'Cabalist', icon: '🗡️', desc: 'Protect the Shadow Speaker and survive until the endgame.', count: 2, cssClass: 'custom-1' },
        { key: 'shadow-speaker', label: 'Shadow Speaker', icon: '👁️', desc: 'Stay hidden until enough influence is in play.', count: 1, cssClass: 'custom-3' },
        { key: 'oracle', label: 'Oracle', icon: '🔮', desc: 'A neutral helper who can steer the table with one public clue.', count: 1, cssClass: 'custom-2' },
      ],
      exportOptions: { includeBacks: true, duplex: true },
    },
    {
      id: 'resistance-trio',
      name: 'Resistance Trio (7 cards)',
      roles: [
        { key: 'operative', label: 'Operative', icon: '🛡️', desc: 'Protect the resistance and identify the saboteur.', count: 3, cssClass: 'custom-0' },
        { key: 'saboteur', label: 'Saboteur', icon: '💣', desc: 'Derail the mission plan without being caught.', count: 2, cssClass: 'custom-1' },
        { key: 'analyst', label: 'Analyst', icon: '📡', desc: 'Receives extra information before the first round.', count: 1, cssClass: 'custom-2' },
        { key: 'double-agent', label: 'Double Agent', icon: '🎭', desc: 'Plays both sides and wins if chaos reigns.', count: 1, cssClass: 'custom-4' },
      ],
      exportOptions: { includeBacks: true, duplex: false, cropMarks: true },
    },
    {
      id: 'town-vs-conspiracy',
      name: 'Town vs Conspiracy (9 cards)',
      roles: [
        { key: 'townsfolk', label: 'Townsfolk', icon: '🏘️', desc: 'Root out the conspiracy before the vote locks in.', count: 5, cssClass: 'custom-0' },
        { key: 'plotter', label: 'Plotter', icon: '🕶️', desc: 'Shift suspicion away from the conspiracy.', count: 2, cssClass: 'custom-1' },
        { key: 'kingmaker', label: 'Kingmaker', icon: '👑', desc: 'A swing role that wants the final vote to be dramatic.', count: 1, cssClass: 'custom-4' },
        { key: 'investigator', label: 'Investigator', icon: '🧭', desc: 'Can publicly inspect one role card after a failed round.', count: 1, cssClass: 'custom-2' },
      ],
      exportOptions: { includeBacks: true, duplex: true, cropMarks: true },
    },
  ];

  function slugify(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readStorage(storage, key, fallbackValue) {
    try {
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : fallbackValue;
    } catch (error) {
      return fallbackValue;
    }
  }

  function writeStorage(storage, key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function defaultWizardMeta() {
    return {
      [lib.ROLES.LIBERAL]: { label: lib.ROLE_META[lib.ROLES.LIBERAL].label, imageUrl: null },
      [lib.ROLES.FASCIST]: { label: lib.ROLE_META[lib.ROLES.FASCIST].label, imageUrl: null },
      [lib.ROLES.HITLER]: { label: lib.ROLE_META[lib.ROLES.HITLER].label, imageUrl: null },
    };
  }

  function defaultExportOptions(overrides) {
    return exporters.normalizeExportOptions(Object.assign({
      paper: 'letter',
      columns: 3,
      rows: 2,
      cropMarks: false,
      includeBacks: false,
      duplex: true,
      backLabel: 'Secret Hitler',
      backNote: 'Role Card Back',
      pngScale: 2,
    }, overrides || {}));
  }

  function getOfficialRoleSummary(count) {
    const row = lib.ROLE_TABLE[count];
    return `${row.liberals} Liberals, ${row.fascists} Fascists, 1 Hitler`;
  }

  function collectElements(documentRef) {
    const ids = [
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

    return ids.reduce((acc, id) => {
      acc[id] = documentRef.getElementById(id);
      return acc;
    }, {});
  }

  function createApp(dependencies) {
    const documentRef = dependencies.document;
    const windowRef = dependencies.window;
    const storage = dependencies.storage;
    const elements = collectElements(documentRef);

    const state = {
      activeMode: 'mode',
      currentResult: null,
      wizardMeta: defaultWizardMeta(),
      wizardPresets: readStorage(storage, STORAGE_KEYS.wizardPresets, []),
      builderConfigs: readStorage(storage, STORAGE_KEYS.builderConfigs, []),
      builderRoles: [],
      builderEditingIndex: null,
      builderRoleImageData: null,
    };

    function announce(message) {
      ui.announce(elements['status-message'], message);
    }

    function setPreviewImage(imgEl, dataUrl) {
      if (!dataUrl) {
        imgEl.src = '';
        imgEl.classList.add('hidden');
        return;
      }
      imgEl.src = dataUrl;
      imgEl.classList.remove('hidden');
    }

    function setVisibleSection(nextMode) {
      state.activeMode = nextMode;
      elements['mode-section'].classList.toggle('hidden', nextMode !== 'mode');
      elements['wizard-section'].classList.toggle('hidden', nextMode !== 'wizard');
      elements['builder-section'].classList.toggle('hidden', nextMode !== 'builder');
      elements['results-section'].classList.toggle('hidden', nextMode !== 'results');
    }

    function readExportOptions(prefix) {
      return defaultExportOptions({
        paper: elements[`${prefix}-paper-size`].value,
        columns: elements[`${prefix}-columns`].value,
        rows: elements[`${prefix}-rows`].value,
        cropMarks: elements[`${prefix}-crop-marks`].checked,
        includeBacks: elements[`${prefix}-include-backs`].checked,
        duplex: elements[`${prefix}-duplex`].checked,
        backLabel: elements[`${prefix}-back-label`].value,
        pngScale: elements[`${prefix}-png-scale`].value,
      });
    }

    function writeExportOptions(prefix, options) {
      const normalized = defaultExportOptions(options);
      elements[`${prefix}-paper-size`].value = normalized.paper;
      elements[`${prefix}-columns`].value = String(normalized.columns);
      elements[`${prefix}-rows`].value = String(normalized.rows);
      elements[`${prefix}-crop-marks`].checked = normalized.cropMarks;
      elements[`${prefix}-include-backs`].checked = normalized.includeBacks;
      elements[`${prefix}-duplex`].checked = normalized.duplex;
      elements[`${prefix}-back-label`].value = normalized.backLabel;
      elements[`${prefix}-png-scale`].value = String(normalized.pngScale);
    }

    function syncWizardInputsFromState() {
      elements['custom-label-liberal'].value = state.wizardMeta[lib.ROLES.LIBERAL].label;
      elements['custom-label-fascist'].value = state.wizardMeta[lib.ROLES.FASCIST].label;
      elements['custom-label-hitler'].value = state.wizardMeta[lib.ROLES.HITLER].label;
      setPreviewImage(elements['custom-preview-liberal'], state.wizardMeta[lib.ROLES.LIBERAL].imageUrl);
      setPreviewImage(elements['custom-preview-fascist'], state.wizardMeta[lib.ROLES.FASCIST].imageUrl);
      setPreviewImage(elements['custom-preview-hitler'], state.wizardMeta[lib.ROLES.HITLER].imageUrl);
      updateOfficialSummary();
    }

    function updateOfficialSummary() {
      const count = Number.parseInt(elements['player-count'].value, 10) || lib.MAX_PLAYERS;
      elements['official-role-summary'].textContent = getOfficialRoleSummary(count);
    }

    function readWizardMetaFromInputs() {
      state.wizardMeta[lib.ROLES.LIBERAL].label = elements['custom-label-liberal'].value.trim() || lib.ROLE_META[lib.ROLES.LIBERAL].label;
      state.wizardMeta[lib.ROLES.FASCIST].label = elements['custom-label-fascist'].value.trim() || lib.ROLE_META[lib.ROLES.FASCIST].label;
      state.wizardMeta[lib.ROLES.HITLER].label = elements['custom-label-hitler'].value.trim() || lib.ROLE_META[lib.ROLES.HITLER].label;
      return clone(state.wizardMeta);
    }

    function resetWizardRole(roleKey) {
      state.wizardMeta[roleKey] = {
        label: lib.ROLE_META[roleKey].label,
        imageUrl: null,
      };
      if (roleKey === lib.ROLES.LIBERAL) {
        elements['custom-img-liberal'].value = '';
      } else if (roleKey === lib.ROLES.FASCIST) {
        elements['custom-img-fascist'].value = '';
      } else {
        elements['custom-img-hitler'].value = '';
      }
      syncWizardInputsFromState();
      announce(`Reset the ${lib.ROLE_META[roleKey].label} customization.`);
    }

    async function handleWizardImage(roleKey, inputEl, previewEl) {
      const file = inputEl.files && inputEl.files[0];
      if (!file) {
        state.wizardMeta[roleKey].imageUrl = null;
        setPreviewImage(previewEl, null);
        return;
      }
      try {
        state.wizardMeta[roleKey].imageUrl = await exporters.normalizeImageFile(file);
        setPreviewImage(previewEl, state.wizardMeta[roleKey].imageUrl);
        announce(`Updated the ${lib.ROLE_META[roleKey].label} image.`);
      } catch (error) {
        windowRef.alert(error.message);
      }
    }

    function wizardPresetPayload(name) {
      return {
        id: slugify(name) || `wizard-${Date.now()}`,
        name,
        playerCount: Number.parseInt(elements['player-count'].value, 10) || lib.MAX_PLAYERS,
        customMeta: readWizardMetaFromInputs(),
        exportOptions: readExportOptions('wizard'),
      };
    }

    function refreshWizardPresetSelect() {
      ui.renderPresetSelect(elements['wizard-preset-select'], state.wizardPresets, 'Select a preset');
    }

    function saveWizardPreset() {
      const name = elements['wizard-preset-name'].value.trim();
      if (!name) {
        windowRef.alert('Enter a preset name before saving.');
        return;
      }
      const payload = wizardPresetPayload(name);
      state.wizardPresets = state.wizardPresets.filter((preset) => preset.id !== payload.id);
      state.wizardPresets.push(payload);
      writeStorage(storage, STORAGE_KEYS.wizardPresets, state.wizardPresets);
      refreshWizardPresetSelect();
      elements['wizard-preset-select'].value = payload.id;
      announce(`Saved wizard preset “${name}”.`);
    }

    function applyWizardPreset(preset) {
      if (!preset) {
        return;
      }
      elements['player-count'].value = String(preset.playerCount || lib.MAX_PLAYERS);
      state.wizardMeta = Object.assign(defaultWizardMeta(), clone(preset.customMeta || {}));
      syncWizardInputsFromState();
      writeExportOptions('wizard', preset.exportOptions || {});
      announce(`Loaded wizard preset “${preset.name}”.`);
    }

    function loadWizardPreset() {
      const presetId = elements['wizard-preset-select'].value;
      const preset = state.wizardPresets.find((entry) => entry.id === presetId);
      if (!preset) {
        windowRef.alert('Choose a saved preset to load.');
        return;
      }
      applyWizardPreset(preset);
    }

    function deleteWizardPreset() {
      const presetId = elements['wizard-preset-select'].value;
      const preset = state.wizardPresets.find((entry) => entry.id === presetId);
      if (!preset) {
        windowRef.alert('Choose a saved preset to delete.');
        return;
      }
      state.wizardPresets = state.wizardPresets.filter((entry) => entry.id !== presetId);
      writeStorage(storage, STORAGE_KEYS.wizardPresets, state.wizardPresets);
      refreshWizardPresetSelect();
      announce(`Deleted wizard preset “${preset.name}”.`);
    }

    function currentBuilderRoleForm() {
      const label = elements['builder-role-label'].value.trim();
      const key = slugify(elements['builder-role-key'].value) || slugify(label) || `role-${Date.now()}`;
      return {
        key,
        label: label || key,
        icon: elements['builder-role-icon'].value.trim() || '🎭',
        desc: elements['builder-role-desc'].value.trim() || 'A custom role for your variant.',
        count: Math.max(1, Number.parseInt(elements['builder-role-count'].value, 10) || 1),
        cssClass: elements['builder-role-theme'].value,
        imageUrl: state.builderRoleImageData,
      };
    }

    function resetBuilderForm() {
      state.builderEditingIndex = null;
      state.builderRoleImageData = null;
      elements['builder-role-key'].value = '';
      elements['builder-role-label'].value = '';
      elements['builder-role-icon'].value = '';
      elements['builder-role-count'].value = '1';
      elements['builder-role-theme'].value = 'custom-0';
      elements['builder-role-desc'].value = '';
      elements['builder-role-image'].value = '';
      elements['builder-save-role-btn'].textContent = 'Add role';
      elements['builder-cancel-edit-btn'].classList.add('hidden');
      setPreviewImage(elements['builder-role-image-preview'], null);
    }

    async function handleBuilderImage() {
      const file = elements['builder-role-image'].files && elements['builder-role-image'].files[0];
      if (!file) {
        state.builderRoleImageData = null;
        setPreviewImage(elements['builder-role-image-preview'], null);
        return;
      }
      try {
        state.builderRoleImageData = await exporters.normalizeImageFile(file);
        setPreviewImage(elements['builder-role-image-preview'], state.builderRoleImageData);
        announce('Updated the custom role image.');
      } catch (error) {
        windowRef.alert(error.message);
      }
    }

    function refreshBuilderRoleList() {
      const normalizedRoles = lib.normalizeRoleDefs(state.builderRoles);
      state.builderRoles = normalizedRoles;
      ui.renderCustomRoleList(documentRef, elements['custom-role-list'], normalizedRoles, {
        onEdit(index) {
          const role = normalizedRoles[index];
          state.builderEditingIndex = index;
          state.builderRoleImageData = role.imageUrl || null;
          elements['builder-role-key'].value = role.key;
          elements['builder-role-label'].value = role.label;
          elements['builder-role-icon'].value = role.icon;
          elements['builder-role-count'].value = String(role.count);
          elements['builder-role-theme'].value = role.cssClass;
          elements['builder-role-desc'].value = role.desc;
          elements['builder-save-role-btn'].textContent = 'Update role';
          elements['builder-cancel-edit-btn'].classList.remove('hidden');
          setPreviewImage(elements['builder-role-image-preview'], state.builderRoleImageData);
          announce(`Editing ${role.label}.`);
        },
        onRemove(index) {
          const removed = normalizedRoles[index];
          state.builderRoles = normalizedRoles.filter((_, roleIndex) => roleIndex !== index);
          refreshBuilderRoleList();
          if (state.builderEditingIndex === index) {
            resetBuilderForm();
          }
          announce(`Removed ${removed.label} from the custom deck.`);
        },
      });
      const totalCards = normalizedRoles.reduce((sum, role) => sum + role.count, 0);
      elements['builder-card-total'].textContent = `${totalCards} cards`;
      elements['generate-custom-btn'].disabled = totalCards === 0;
    }

    function saveBuilderRole() {
      const role = currentBuilderRoleForm();
      const duplicateIndex = state.builderRoles.findIndex((entry, index) => entry.key === role.key && index !== state.builderEditingIndex);
      if (duplicateIndex !== -1) {
        windowRef.alert('Each custom role needs a unique key.');
        return;
      }
      if (state.builderEditingIndex !== null) {
        state.builderRoles[state.builderEditingIndex] = role;
        announce(`Updated ${role.label}.`);
      } else {
        state.builderRoles.push(role);
        announce(`Added ${role.label}.`);
      }
      resetBuilderForm();
      refreshBuilderRoleList();
    }

    function refreshBuilderPresetSelect() {
      ui.renderPresetSelect(elements['builder-preset-select'], BUILDER_PRESETS, 'Choose a variant preset');
    }

    function refreshBuilderConfigSelect() {
      ui.renderPresetSelect(elements['builder-config-select'], state.builderConfigs, 'Select a saved configuration');
    }

    function applyBuilderPreset(preset) {
      if (!preset) {
        windowRef.alert('Choose a variant preset first.');
        return;
      }
      state.builderRoles = clone(preset.roles);
      refreshBuilderRoleList();
      writeExportOptions('builder', Object.assign(defaultExportOptions({ includeBacks: true, backLabel: 'Variant Deck' }), preset.exportOptions || {}));
      resetBuilderForm();
      announce(`Loaded builder preset “${preset.name}”.`);
    }

    function saveBuilderConfig() {
      const name = elements['builder-config-name'].value.trim();
      if (!name) {
        windowRef.alert('Enter a configuration name before saving.');
        return;
      }
      const payload = {
        id: slugify(name) || `builder-${Date.now()}`,
        name,
        roles: clone(state.builderRoles),
        exportOptions: readExportOptions('builder'),
      };
      state.builderConfigs = state.builderConfigs.filter((config) => config.id !== payload.id);
      state.builderConfigs.push(payload);
      writeStorage(storage, STORAGE_KEYS.builderConfigs, state.builderConfigs);
      refreshBuilderConfigSelect();
      elements['builder-config-select'].value = payload.id;
      announce(`Saved builder configuration “${name}”.`);
    }

    function loadBuilderConfig() {
      const configId = elements['builder-config-select'].value;
      const config = state.builderConfigs.find((entry) => entry.id === configId);
      if (!config) {
        windowRef.alert('Choose a saved configuration to load.');
        return;
      }
      state.builderRoles = clone(config.roles || []);
      refreshBuilderRoleList();
      writeExportOptions('builder', config.exportOptions || {});
      resetBuilderForm();
      announce(`Loaded builder configuration “${config.name}”.`);
    }

    function deleteBuilderConfig() {
      const configId = elements['builder-config-select'].value;
      const config = state.builderConfigs.find((entry) => entry.id === configId);
      if (!config) {
        windowRef.alert('Choose a saved configuration to delete.');
        return;
      }
      state.builderConfigs = state.builderConfigs.filter((entry) => entry.id !== configId);
      writeStorage(storage, STORAGE_KEYS.builderConfigs, state.builderConfigs);
      refreshBuilderConfigSelect();
      announce(`Deleted builder configuration “${config.name}”.`);
    }

    function showResults(result) {
      state.currentResult = result;
      elements['results-title'].textContent = result.title;
      const printPages = exporters.buildPrintPages(result.cards, result.exportOptions);
      elements['results-summary'].textContent = `${result.cards.length} role cards across ${printPages.length} printable page${printPages.length === 1 ? '' : 's'}. Use tap, click, or keyboard controls to reveal cards privately.`;
      ui.renderRoleCards(documentRef, elements['role-cards'], result.cards);
      ui.renderPrintCards(documentRef, elements['print-cards'], printPages, result.exportOptions);
      setVisibleSection('results');
      elements['role-cards'].focus();
      windowRef.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function generateOfficialDeck() {
      const playerCount = Number.parseInt(elements['player-count'].value, 10) || lib.MAX_PLAYERS;
      const pairs = lib.buildOfficialPairs(playerCount);
      const cards = lib.buildPrintCards(pairs, readWizardMetaFromInputs());
      showResults({
        mode: 'wizard',
        title: `${playerCount}-player official deck`,
        cards,
        exportOptions: readExportOptions('wizard'),
      });
      announce(`Generated an official ${playerCount}-player deck.`);
    }

    function generateBuilderDeck() {
      const normalizedRoles = lib.normalizeRoleDefs(state.builderRoles);
      if (!normalizedRoles.length) {
        windowRef.alert('Add at least one custom role before generating cards.');
        return;
      }
      const baseMeta = lib.buildCustomRoleMeta(normalizedRoles);
      const deck = lib.buildCustomDeck(normalizedRoles);
      const pairs = lib.buildNamedPairs(deck);
      const cards = lib.buildPrintCards(pairs, {}, baseMeta);
      showResults({
        mode: 'builder',
        title: `${cards.length}-card custom deck`,
        cards,
        exportOptions: readExportOptions('builder'),
      });
      announce(`Generated a custom deck with ${cards.length} cards.`);
    }

    async function downloadCurrentPdf() {
      if (!state.currentResult) {
        return;
      }
      await exporters.downloadPrintCardsPdf(state.currentResult.cards, state.currentResult.exportOptions);
      announce('Downloaded the PDF export.');
    }

    async function downloadCurrentPngSheets() {
      if (!state.currentResult) {
        return;
      }
      await exporters.downloadPngSheets(state.currentResult.cards, state.currentResult.exportOptions);
      announce('Downloaded PNG sheet exports.');
    }

    function printCurrentDeck() {
      if (!state.currentResult) {
        return;
      }
      ui.renderPrintCards(documentRef, elements['print-cards'], exporters.buildPrintPages(state.currentResult.cards, state.currentResult.exportOptions), state.currentResult.exportOptions);
      windowRef.print();
      announce('Opened the print dialog.');
    }

    function backToSetup() {
      const nextMode = state.currentResult ? state.currentResult.mode : 'mode';
      setVisibleSection(nextMode);
      windowRef.scrollTo({ top: 0, behavior: 'smooth' });
      announce('Returned to setup.');
    }

    function startOver() {
      state.currentResult = null;
      state.wizardMeta = defaultWizardMeta();
      elements['player-count'].value = String(lib.MAX_PLAYERS);
      syncWizardInputsFromState();
      writeExportOptions('wizard', defaultExportOptions());
      state.builderRoles = [];
      refreshBuilderRoleList();
      resetBuilderForm();
      writeExportOptions('builder', defaultExportOptions({ includeBacks: true, backLabel: 'Variant Deck' }));
      setVisibleSection('mode');
      windowRef.scrollTo({ top: 0, behavior: 'smooth' });
      announce('Reset the generator and returned to the mode chooser.');
    }

    function bindEvents() {
      elements['open-wizard-btn'].addEventListener('click', () => {
        setVisibleSection('wizard');
        announce('Opened the official print and play wizard.');
      });
      elements['open-builder-btn'].addEventListener('click', () => {
        setVisibleSection('builder');
        announce('Opened the custom game builder.');
      });
      elements['wizard-back-btn'].addEventListener('click', () => setVisibleSection('mode'));
      elements['builder-back-btn'].addEventListener('click', () => setVisibleSection('mode'));
      elements['results-back-btn'].addEventListener('click', backToSetup);
      elements['restart-btn'].addEventListener('click', startOver);

      elements['player-count'].addEventListener('change', updateOfficialSummary);
      elements['save-wizard-preset-btn'].addEventListener('click', saveWizardPreset);
      elements['load-wizard-preset-btn'].addEventListener('click', loadWizardPreset);
      elements['delete-wizard-preset-btn'].addEventListener('click', deleteWizardPreset);

      elements['reset-role-liberal'].addEventListener('click', () => resetWizardRole(lib.ROLES.LIBERAL));
      elements['reset-role-fascist'].addEventListener('click', () => resetWizardRole(lib.ROLES.FASCIST));
      elements['reset-role-hitler'].addEventListener('click', () => resetWizardRole(lib.ROLES.HITLER));
      elements['custom-img-liberal'].addEventListener('change', () => handleWizardImage(lib.ROLES.LIBERAL, elements['custom-img-liberal'], elements['custom-preview-liberal']));
      elements['custom-img-fascist'].addEventListener('change', () => handleWizardImage(lib.ROLES.FASCIST, elements['custom-img-fascist'], elements['custom-preview-fascist']));
      elements['custom-img-hitler'].addEventListener('change', () => handleWizardImage(lib.ROLES.HITLER, elements['custom-img-hitler'], elements['custom-preview-hitler']));
      elements['generate-btn'].addEventListener('click', generateOfficialDeck);

      elements['apply-builder-preset-btn'].addEventListener('click', () => {
        const preset = BUILDER_PRESETS.find((entry) => entry.id === elements['builder-preset-select'].value);
        applyBuilderPreset(preset);
      });
      elements['save-builder-config-btn'].addEventListener('click', saveBuilderConfig);
      elements['load-builder-config-btn'].addEventListener('click', loadBuilderConfig);
      elements['delete-builder-config-btn'].addEventListener('click', deleteBuilderConfig);
      elements['builder-role-image'].addEventListener('change', handleBuilderImage);
      elements['builder-save-role-btn'].addEventListener('click', saveBuilderRole);
      elements['builder-cancel-edit-btn'].addEventListener('click', () => {
        resetBuilderForm();
        announce('Cancelled role editing.');
      });
      elements['generate-custom-btn'].addEventListener('click', generateBuilderDeck);

      elements['download-pdf-btn'].addEventListener('click', () => {
        downloadCurrentPdf().catch((error) => windowRef.alert(error.message));
      });
      elements['download-png-btn'].addEventListener('click', () => {
        downloadCurrentPngSheets().catch((error) => windowRef.alert(error.message));
      });
      elements['print-btn'].addEventListener('click', printCurrentDeck);
    }

    function init() {
      syncWizardInputsFromState();
      refreshWizardPresetSelect();
      refreshBuilderPresetSelect();
      refreshBuilderConfigSelect();
      writeExportOptions('wizard', defaultExportOptions());
      writeExportOptions('builder', defaultExportOptions({ includeBacks: true, backLabel: 'Variant Deck' }));
      refreshBuilderRoleList();
      resetBuilderForm();
      bindEvents();
      setVisibleSection('mode');
      announce('Ready to generate Secret Hitler cards.');
    }

    init();

    return {
      state,
      elements,
      generateOfficialDeck,
      generateBuilderDeck,
      saveWizardPreset,
      loadWizardPreset,
      deleteWizardPreset,
      saveBuilderRole,
      saveBuilderConfig,
      loadBuilderConfig,
      deleteBuilderConfig,
      startOver,
      setVisibleSection,
    };
  }

  const publicApi = { createApp, BUILDER_PRESETS, defaultExportOptions, defaultWizardMeta, getOfficialRoleSummary };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = publicApi;
  }

  globalScope.SecretHitlerApp = publicApi;

  if (globalScope.document && globalScope.document.getElementById('mode-section')) {
    createApp({
      document: globalScope.document,
      window: globalScope,
      storage: globalScope.localStorage,
    });
  }
}(typeof globalThis !== 'undefined' ? globalThis : window));
