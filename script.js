/**
 * Secret Hitler – Role Generator
 * script.js
 *
 * Role distribution (official rules):
 *   Players |  Liberals | Fascists | Hitler
 *   --------|-----------|----------|-------
 *      5    |     3     |    1     |   1
 *      6    |     4     |    1     |   1
 *      7    |     4     |    2     |   1
 *      8    |     5     |    2     |   1
 *      9    |     5     |    3     |   1
 *     10    |     6     |    3     |   1
 */

'use strict';

// ── Constants ────────────────────────────────────────────────────────────────

const MIN_PLAYERS = 5;
const MAX_PLAYERS = 10;

/** Role distribution indexed by player count (index 0 unused). */
const ROLE_TABLE = {
  5:  { liberals: 3, fascists: 1 },
  6:  { liberals: 4, fascists: 1 },
  7:  { liberals: 4, fascists: 2 },
  8:  { liberals: 5, fascists: 2 },
  9:  { liberals: 5, fascists: 3 },
  10: { liberals: 6, fascists: 3 },
};

const ROLES = {
  LIBERAL: 'liberal',
  FASCIST: 'fascist',
  HITLER:  'hitler',
};

const ROLE_META = {
  [ROLES.LIBERAL]: {
    label:   'Liberal',
    icon:    '🕊️',
    desc:    'Enact 5 Liberal policies or assassinate Hitler to win.',
    cssClass: 'liberal',
  },
  [ROLES.FASCIST]: {
    label:   'Fascist',
    icon:    '⚡',
    desc:    'Enact 6 Fascist policies or elect Hitler Chancellor to win.',
    cssClass: 'fascist',
  },
  [ROLES.HITLER]: {
    label:   'Hitler',
    icon:    '💀',
    desc:    'Appear innocent. Get elected Chancellor after 3 Fascist policies to win.',
    cssClass: 'hitler',
  },
};

// ── State ────────────────────────────────────────────────────────────────────

/** @type {string[]} */
let players = [];

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

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Shuffle an array in-place using the Fisher-Yates algorithm.
 * @template T
 * @param {T[]} arr
 * @returns {T[]}
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Build the role deck for the given player count.
 * @param {number} count
 * @returns {string[]} shuffled array of role strings
 */
function buildDeck(count) {
  const { liberals, fascists } = ROLE_TABLE[count];
  const deck = [
    ...Array(liberals).fill(ROLES.LIBERAL),
    ...Array(fascists).fill(ROLES.FASCIST),
    ROLES.HITLER,
  ];
  return shuffle(deck);
}

/**
 * Escape HTML to prevent XSS when inserting player names.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
  playerInput.value = '';
  addBtn.disabled = false;
  renderPlayerList();
  resultsSection.classList.add('hidden');
  setupSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  playerInput.focus();
});

// ── Init ─────────────────────────────────────────────────────────────────────

updatePlayerCount();
