/**
 * Secret Hitler – Role Generator
 * script.js  –  DOM interaction layer.
 *
 * Requires lib.js to be loaded first (provides MIN_PLAYERS, MAX_PLAYERS,
 * ROLES, ROLE_META, shuffle, buildDeck, buildPrintCards, escapeHtml as globals).
 */

'use strict';

// ── State ────────────────────────────────────────────────────────────────────

/** @type {string[]} */
let players = [];

/** @type {Array<{name: string, role: string}>} Last generated player-role pairings. */
let currentPairs = [];

/** @type {{ liberal: string|null, fascist: string|null, hitler: string|null }} */
const customImageData = { liberal: null, fascist: null, hitler: null };

// ── DOM references ───────────────────────────────────────────────────────────

const playerForm     = document.getElementById('player-form');
const playerInput    = document.getElementById('player-input');
const addBtn         = document.getElementById('add-btn');
const playerListEl   = document.getElementById('player-list');
const playerCountEl  = document.getElementById('player-count');
const generateBtn    = document.getElementById('generate-btn');
const setupSection   = document.getElementById('setup-section');
const resultsSection = document.getElementById('results-section');
const roleCardsEl    = document.getElementById('role-cards');
const restartBtn     = document.getElementById('restart-btn');

// Customization inputs
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

// Print elements
const printBtn     = document.getElementById('print-btn');
const printCardsEl = document.getElementById('print-cards');

// ── UI helpers ───────────────────────────────────────────────────────────────

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
 * @returns {HTMLElement}
 */
function buildRoleCard(playerName, role) {
  const meta = ROLE_META[role];

  const card = document.createElement('div');
  card.className = 'role-card';
  card.setAttribute('aria-label', `Role card for ${playerName}. Tap to reveal.`);

  card.innerHTML = `
    <div class="role-card-inner">
      <div class="role-front">
        <span class="card-icon">🃏</span>
        <span class="card-player-name">${escapeHtml(playerName)}</span>
        <span class="card-tap-hint">Tap to reveal</span>
      </div>
      <div class="role-back ${meta.cssClass}">
        <span class="role-icon">${meta.icon}</span>
        <span class="role-label">${meta.label}</span>
        <span class="role-desc">${meta.desc}</span>
        <span class="card-tap-hint">Tap to hide</span>
      </div>
    </div>
  `;

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

// ── Customization helpers ────────────────────────────────────────────────────

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
 * Read current customization inputs and return a customMeta object
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
  if (cardData.imageUrl) {
    mediaEl = document.createElement('img');
    mediaEl.className = 'print-card-img';
    mediaEl.src = cardData.imageUrl; // data-URI from FileReader – safe as src
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

// ── Event handlers ───────────────────────────────────────────────────────────

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

  // Disable add button once max reached
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

  // Shuffle the display order so position doesn't hint at role
  shuffle(paired);

  // Store for use by the print button
  currentPairs = paired;

  roleCardsEl.innerHTML = '';
  paired.forEach(({ name, role }) => {
    roleCardsEl.appendChild(buildRoleCard(name, role));
  });

  setupSection.classList.add('hidden');
  resultsSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

restartBtn.addEventListener('click', () => {
  players = [];
  currentPairs = [];
  playerInput.value = '';
  addBtn.disabled = false;
  renderPlayerList();
  resultsSection.classList.add('hidden');
  setupSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  playerInput.focus();
});

printBtn.addEventListener('click', () => {
  const cards = buildPrintCards(currentPairs, getCustomMeta());
  printCardsEl.innerHTML = '';
  cards.forEach((cardData) => {
    printCardsEl.appendChild(buildPrintCardEl(cardData));
  });
  window.print();
});

// ── Init ─────────────────────────────────────────────────────────────────────

updatePlayerCount();
