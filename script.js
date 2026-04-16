/**
 * Secret Hitler – Game Generator
 * script.js  –  DOM interaction layer.
 *
 * Requires lib.js to be loaded first (provides MIN_PLAYERS, MAX_PLAYERS,
 * ROLES, ROLE_META, shuffle, buildDeck, buildCustomDeck, buildPrintCards,
 * escapeHtml as globals).
 */

'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Number of colour slots that cycle for custom roles. */
const CUSTOM_COLOR_COUNT = 5;

// ── State ─────────────────────────────────────────────────────────────────────

/** Active mode: null | 'standard' | 'custom' */
let currentMode = null;

// Standard-mode state
/** @type {string[]} */
let players = [];

/**
 * Stores the most-recently generated player-role pairings.
 * @type {Array<{name: string, role: string}>}
 */
let currentPairs = [];

/** @type {{ liberal: string|null, fascist: string|null, hitler: string|null }} */
const customImageData = { liberal: null, fascist: null, hitler: null };

// Custom-game state
/**
 * @type {Array<{key: string, name: string, icon: string, desc: string, colorIndex: number}>}
 */
let customRoles = [];

/** @type {string[]} */
let customPlayers = [];

// ── DOM references ────────────────────────────────────────────────────────────

// Mode selection
const modeSectionEl    = document.getElementById('mode-section');
const modeStandardBtn  = document.getElementById('mode-standard-btn');
const modeCustomBtn    = document.getElementById('mode-custom-btn');

// Standard mode
const setupSection     = document.getElementById('setup-section');
const standardBackBtn  = document.getElementById('standard-back-btn');
const playerForm       = document.getElementById('player-form');
const playerInput      = document.getElementById('player-input');
const addBtn           = document.getElementById('add-btn');
const playerListEl     = document.getElementById('player-list');
const playerCountEl    = document.getElementById('player-count');
const generateBtn      = document.getElementById('generate-btn');

// Standard customisation inputs
const customLabelInputs = {
  liberal: document.getElementById('custom-label-liberal'),
  fascist: document.getElementById('custom-label-fascist'),
  hitler:  document.getElementById('custom-label-hitler'),
};
const customImgInputs = {
  liberal: document.getElementById('custom-img-liberal'),
  fascist: document.getElementById('custom-img-fascist'),
  hitler:  document.getElementById('custom-img-hitler'),
};
const customImgPreviews = {
  liberal: document.getElementById('custom-preview-liberal'),
  fascist: document.getElementById('custom-preview-fascist'),
  hitler:  document.getElementById('custom-preview-hitler'),
};

// Custom game section
const customGameSectionEl  = document.getElementById('custom-game-section');
const customBackBtn        = document.getElementById('custom-back-btn');
const customRoleForm       = document.getElementById('custom-role-form');
const customRoleIconInput  = document.getElementById('custom-role-icon-input');
const customRoleNameInput  = document.getElementById('custom-role-name-input');
const customRoleCountInput = document.getElementById('custom-role-count-input');
const customRoleDescInput  = document.getElementById('custom-role-desc-input');
const customRoleListEl     = document.getElementById('custom-role-list');
const customRolesSummary   = document.getElementById('custom-roles-summary');
const customNeededCountEl  = document.getElementById('custom-needed-count');
const customPlayerForm     = document.getElementById('custom-player-form');
const customPlayerInput    = document.getElementById('custom-player-input');
const customAddPlayerBtn   = document.getElementById('custom-add-player-btn');
const customPlayerListEl   = document.getElementById('custom-player-list');
const customPlayerCountEl  = document.getElementById('custom-player-count');
const customGenerateBtn    = document.getElementById('custom-generate-btn');

// Results (shared)
const resultsSection = document.getElementById('results-section');
const roleCardsEl    = document.getElementById('role-cards');
const restartBtn     = document.getElementById('restart-btn');
const printBtn       = document.getElementById('print-btn');
const printCardsEl   = document.getElementById('print-cards');

// ── Mode navigation ───────────────────────────────────────────────────────────

function showModeSection() {
  modeSectionEl.classList.remove('hidden');
  setupSection.classList.add('hidden');
  customGameSectionEl.classList.add('hidden');
  resultsSection.classList.add('hidden');
  currentMode = null;
}

modeStandardBtn.addEventListener('click', () => {
  currentMode = 'standard';
  modeSectionEl.classList.add('hidden');
  setupSection.classList.remove('hidden');
  playerInput.focus();
});

modeCustomBtn.addEventListener('click', () => {
  currentMode = 'custom';
  modeSectionEl.classList.add('hidden');
  customGameSectionEl.classList.remove('hidden');
  customRoleNameInput.focus();
});

standardBackBtn.addEventListener('click', () => {
  showModeSection();
});

customBackBtn.addEventListener('click', () => {
  showModeSection();
});

// ── Standard mode – UI helpers ────────────────────────────────────────────────

function updatePlayerCount() {
  const n = players.length;
  playerCountEl.textContent = `${n} / ${MAX_PLAYERS} players`;

  const ready = n >= MIN_PLAYERS && n <= MAX_PLAYERS;
  generateBtn.disabled = !ready;
}

function renderPlayerList() {
  playerListEl.innerHTML = '';
  players.forEach((name, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="player-number">${index + 1}.</span>
      <span class="player-name">${escapeHtml(name)}</span>
      <button class="remove-btn" aria-label="Remove ${escapeHtml(name)}" data-index="${index}">✕</button>
    `;
    playerListEl.appendChild(li);
  });
  updatePlayerCount();
}

/**
 * Build a single role card element.
 * @param {string} playerName
 * @param {string} role
 * @param {{ label: string, icon: string, desc: string, cssClass: string }} [metaOverride]
 *   Optional: supply custom role metadata for non-standard roles.
 * @returns {HTMLElement}
 */
function buildRoleCard(playerName, role, metaOverride) {
  const meta = metaOverride || ROLE_META[role];

  const card = document.createElement('div');
  card.className = 'role-card';
  card.setAttribute('aria-label', `Role card for ${playerName}. Tap to reveal.`);

  const labelText = document.createTextNode(meta.label);
  const descText  = document.createTextNode(meta.desc);

  card.innerHTML = `
    <div class="role-card-inner">
      <div class="role-front">
        <span class="card-icon">🃏</span>
        <span class="card-player-name">${escapeHtml(playerName)}</span>
        <span class="card-tap-hint">Tap to reveal</span>
      </div>
      <div class="role-back ${meta.cssClass}">
        <span class="role-icon">${meta.icon}</span>
        <span class="role-label"></span>
        <span class="role-desc"></span>
        <span class="card-tap-hint">Tap to hide</span>
      </div>
    </div>
  `;

  // Set user-supplied text via DOM to avoid XSS (icon comes from our own data only)
  card.querySelector('.role-label').appendChild(labelText);
  card.querySelector('.role-desc').appendChild(descText);

  card.addEventListener('click', () => {
    const isFlipped = card.classList.toggle('flipped');
    card.setAttribute(
      'aria-label',
      isFlipped
        ? `${playerName} is the ${meta.label}. Tap to hide.`
        : `Role card for ${playerName}. Tap to reveal.`
    );
  });

  return card;
}

// ── Standard mode – customisation helpers ─────────────────────────────────────

/**
 * Wire up a file input to read the selected image as a data-URL,
 * store it in customImageData, and show a thumbnail preview.
 * @param {string} role  'liberal' | 'fascist' | 'hitler'
 */
function setupImageUpload(role) {
  customImgInputs[role].addEventListener('change', () => {
    const file = customImgInputs[role].files[0];
    if (!file) {
      customImageData[role] = null;
      customImgPreviews[role].classList.add('hidden');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      customImageData[role] = e.target.result;
      customImgPreviews[role].src = e.target.result;
      customImgPreviews[role].classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  });
}

['liberal', 'fascist', 'hitler'].forEach(setupImageUpload);

/**
 * Read standard customisation inputs and return a customMeta object
 * suitable for passing to buildPrintCards().
 * @returns {Object}
 */
function getCustomMeta() {
  return {
    [ROLES.LIBERAL]: {
      label:    customLabelInputs.liberal.value.trim() || undefined,
      imageUrl: customImageData.liberal  || undefined,
    },
    [ROLES.FASCIST]: {
      label:    customLabelInputs.fascist.value.trim() || undefined,
      imageUrl: customImageData.fascist  || undefined,
    },
    [ROLES.HITLER]: {
      label:    customLabelInputs.hitler.value.trim()  || undefined,
      imageUrl: customImageData.hitler   || undefined,
    },
  };
}

// ── Print helpers ─────────────────────────────────────────────────────────────

/**
 * Build a single printable role-card element from data returned by buildPrintCards().
 * Uses DOM properties (not innerHTML) for user-supplied values to avoid XSS.
 * @param {{ playerName: string, role: string, label: string, icon: string, desc: string, cssClass: string, imageUrl: string|null }} cardData
 * @returns {HTMLElement}
 */
function buildPrintCardEl(cardData) {
  const article = document.createElement('article');
  article.className = `print-card ${cardData.cssClass}`;

  const roleDiv = document.createElement('div');
  roleDiv.className = 'print-card-role';
  roleDiv.textContent = cardData.label;

  let mediaEl;
  if (cardData.imageUrl && cardData.imageUrl.startsWith('data:image/')) {
    mediaEl = document.createElement('img');
    mediaEl.className = 'print-card-img';
    mediaEl.src = cardData.imageUrl; // validated data-URI from FileReader
    mediaEl.alt = '';
  } else {
    mediaEl = document.createElement('span');
    mediaEl.className = 'print-card-icon';
    mediaEl.setAttribute('aria-hidden', 'true');
    mediaEl.textContent = cardData.icon;
  }

  const nameDiv = document.createElement('div');
  nameDiv.className = 'print-card-name';
  nameDiv.textContent = cardData.playerName;

  const descDiv = document.createElement('div');
  descDiv.className = 'print-card-desc';
  descDiv.textContent = cardData.desc;

  article.append(roleDiv, mediaEl, nameDiv, descDiv);
  return article;
}

// ── Standard mode – event handlers ───────────────────────────────────────────

playerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = playerInput.value.trim();

  if (!name) return;
  if (players.length >= MAX_PLAYERS) return;

  // Prevent duplicate names (case-insensitive)
  if (players.some((p) => p.toLowerCase() === name.toLowerCase())) {
    playerInput.select();
    playerInput.setCustomValidity('Name already added.');
    playerInput.reportValidity();
    setTimeout(() => playerInput.setCustomValidity(''), 2000);
    return;
  }

  players.push(name);
  playerInput.value = '';
  playerInput.setCustomValidity('');
  renderPlayerList();
  playerInput.focus();

  addBtn.disabled = players.length >= MAX_PLAYERS;
});

playerInput.addEventListener('input', () => {
  playerInput.setCustomValidity('');
});

// Delegated event for remove buttons
playerListEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.remove-btn');
  if (!btn) return;
  const idx = parseInt(btn.dataset.index, 10);
  players.splice(idx, 1);
  addBtn.disabled = false;
  renderPlayerList();
});

generateBtn.addEventListener('click', () => {
  const deck   = buildDeck(players.length);
  const paired = players.map((name, i) => ({ name, role: deck[i] }));

  shuffle(paired);
  currentPairs = paired;

  roleCardsEl.innerHTML = '';
  paired.forEach(({ name, role }) => {
    roleCardsEl.appendChild(buildRoleCard(name, role));
  });

  setupSection.classList.add('hidden');
  resultsSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Custom game – helpers ─────────────────────────────────────────────────────

/** Total number of players required by the currently-defined custom roles. */
function customTotalRoleCount() {
  return customRoles.reduce((sum, r) => sum + r.count, 0);
}

/** Rebuild the custom role list display and update the summary + generate button state. */
function renderCustomRoleList() {
  customRoleListEl.innerHTML = '';
  customRoles.forEach((role, index) => {
    const li = document.createElement('li');

    const swatch = document.createElement('span');
    swatch.className = `custom-role-swatch custom-swatch-${role.colorIndex}`;

    const iconCol = document.createElement('span');
    iconCol.className = 'role-icon-col';
    iconCol.textContent = role.icon;

    const nameCol = document.createElement('span');
    nameCol.className = 'role-name-col';
    nameCol.textContent = role.name;

    if (role.desc) {
      const descSmall = document.createElement('small');
      descSmall.style.cssText = 'display:block;color:var(--color-muted);font-weight:400;font-size:0.75rem';
      descSmall.textContent = role.desc;
      nameCol.appendChild(descSmall);
    }

    const countBadge = document.createElement('span');
    countBadge.className = 'role-count-badge';
    countBadge.textContent = `×${role.count}`;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.setAttribute('aria-label', `Remove role ${role.name}`);
    removeBtn.dataset.index = index;
    removeBtn.textContent = '✕';

    li.append(swatch, iconCol, nameCol, countBadge, removeBtn);
    customRoleListEl.appendChild(li);
  });

  const total = customTotalRoleCount();
  customRolesSummary.textContent =
    `${customRoles.length} role${customRoles.length !== 1 ? 's' : ''} defined · ${total} player${total !== 1 ? 's' : ''} needed`;
  customNeededCountEl.textContent = total;

  updateCustomGenerateBtn();
}

/** Rebuild the custom player list and update the count display. */
function renderCustomPlayerList() {
  customPlayerListEl.innerHTML = '';
  customPlayers.forEach((name, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="player-number">${index + 1}.</span>
      <span class="player-name">${escapeHtml(name)}</span>
      <button class="remove-btn" aria-label="Remove ${escapeHtml(name)}" data-index="${index}">✕</button>
    `;
    customPlayerListEl.appendChild(li);
  });

  const total  = customTotalRoleCount();
  const added  = customPlayers.length;
  customPlayerCountEl.textContent = `${added} / ${total} players added`;
  customAddPlayerBtn.disabled = added >= total && total > 0;

  updateCustomGenerateBtn();
}

function updateCustomGenerateBtn() {
  const total = customTotalRoleCount();
  const ready = customRoles.length > 0 && customPlayers.length === total && total > 0;
  customGenerateBtn.disabled = !ready;
}

/**
 * Build a lookup map of role key → card metadata for custom roles.
 * @returns {Object}
 */
function buildCustomRoleMetaMap() {
  const map = {};
  customRoles.forEach((r) => {
    map[r.key] = {
      label:    r.name,
      icon:     r.icon,
      desc:     r.desc,
      cssClass: `custom-${r.colorIndex}`,
    };
  });
  return map;
}

// ── Custom game – event handlers ──────────────────────────────────────────────

customRoleForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name  = customRoleNameInput.value.trim();
  const icon  = customRoleIconInput.value.trim() || '🎭';
  const count = parseInt(customRoleCountInput.value, 10);
  const desc  = customRoleDescInput.value.trim();

  if (!name) {
    customRoleNameInput.focus();
    return;
  }
  if (!count || count < 1) {
    customRoleCountInput.focus();
    return;
  }

  const colorIndex = customRoles.length % CUSTOM_COLOR_COUNT;
  const key = `custom-role-${customRoles.length}-${Date.now()}`;

  customRoles.push({ key, name, icon, desc, count, colorIndex });

  customRoleNameInput.value  = '';
  customRoleIconInput.value  = '';
  customRoleCountInput.value = '';
  customRoleDescInput.value  = '';
  renderCustomRoleList();
  renderCustomPlayerList();
  customRoleNameInput.focus();
});

// Delegated remove for custom roles
customRoleListEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.remove-btn');
  if (!btn) return;
  const idx = parseInt(btn.dataset.index, 10);
  customRoles.splice(idx, 1);
  // Re-assign colorIndex so colours stay consistent after deletion
  customRoles.forEach((r, i) => { r.colorIndex = i % CUSTOM_COLOR_COUNT; });
  renderCustomRoleList();
  renderCustomPlayerList();
});

customPlayerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name  = customPlayerInput.value.trim();
  const total = customTotalRoleCount();

  if (!name) return;
  if (customPlayers.length >= total) return;

  if (customPlayers.some((p) => p.toLowerCase() === name.toLowerCase())) {
    customPlayerInput.select();
    customPlayerInput.setCustomValidity('Name already added.');
    customPlayerInput.reportValidity();
    setTimeout(() => customPlayerInput.setCustomValidity(''), 2000);
    return;
  }

  customPlayers.push(name);
  customPlayerInput.value = '';
  customPlayerInput.setCustomValidity('');
  renderCustomPlayerList();
  customPlayerInput.focus();
});

customPlayerInput.addEventListener('input', () => {
  customPlayerInput.setCustomValidity('');
});

// Delegated remove for custom players
customPlayerListEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.remove-btn');
  if (!btn) return;
  const idx = parseInt(btn.dataset.index, 10);
  customPlayers.splice(idx, 1);
  customAddPlayerBtn.disabled = false;
  renderCustomPlayerList();
});

customGenerateBtn.addEventListener('click', () => {
  const roleDefs = customRoles.map(({ key, count }) => ({ key, count }));
  const deck     = buildCustomDeck(roleDefs);
  const metaMap  = buildCustomRoleMetaMap();

  const paired = customPlayers.map((name, i) => ({ name, role: deck[i] }));
  shuffle(paired);
  currentPairs = paired;

  roleCardsEl.innerHTML = '';
  paired.forEach(({ name, role }) => {
    roleCardsEl.appendChild(buildRoleCard(name, role, metaMap[role]));
  });

  customGameSectionEl.classList.add('hidden');
  resultsSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Results – shared handlers ─────────────────────────────────────────────────

restartBtn.addEventListener('click', () => {
  // Reset standard state
  players      = [];
  currentPairs = [];
  playerInput.value = '';
  addBtn.disabled   = false;
  renderPlayerList();

  // Reset custom state
  customRoles   = [];
  customPlayers = [];
  customRoleNameInput.value  = '';
  customRoleIconInput.value  = '';
  customRoleCountInput.value = '';
  customRoleDescInput.value  = '';
  customPlayerInput.value    = '';
  renderCustomRoleList();
  renderCustomPlayerList();

  resultsSection.classList.add('hidden');
  showModeSection();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

printBtn.addEventListener('click', () => {
  let cards;
  if (currentMode === 'custom') {
    const metaMap = buildCustomRoleMetaMap();
    cards = buildPrintCards(currentPairs, {}, metaMap);
  } else {
    cards = buildPrintCards(currentPairs, getCustomMeta());
  }
  printCardsEl.innerHTML = '';
  cards.forEach((cardData) => {
    printCardsEl.appendChild(buildPrintCardEl(cardData));
  });
  window.print();
});

// ── Init ──────────────────────────────────────────────────────────────────────

updatePlayerCount();
renderCustomRoleList();
renderCustomPlayerList();
