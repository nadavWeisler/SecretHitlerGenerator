/**
 * Secret Hitler – Role Generator
 * lib.js  –  Pure game-logic helpers (no DOM dependencies).
 *
 * Loaded as a plain <script> in the browser (exposes globals) and
 * required as a CommonJS module by Jest tests.
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

/** Role distribution indexed by player count. */
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
    label:    'Liberal',
    icon:     '🕊️',
    desc:     'Enact 5 Liberal policies or assassinate Hitler to win.',
    cssClass: 'liberal',
  },
  [ROLES.FASCIST]: {
    label:    'Fascist',
    icon:     '⚡',
    desc:     'Enact 6 Fascist policies or elect Hitler Chancellor to win.',
    cssClass: 'fascist',
  },
  [ROLES.HITLER]: {
    label:    'Hitler',
    icon:     '💀',
    desc:     'Appear innocent. Get elected Chancellor after 3 Fascist policies to win.',
    cssClass: 'hitler',
  },
};

// ── Pure helpers ─────────────────────────────────────────────────────────────

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
 * @param {number} count  Number of players (5–10)
 * @returns {string[]} Shuffled array of role strings
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
 * Escape HTML special characters to prevent XSS when inserting player names.
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

/**
 * Merge player-role pairs with optional custom role-metadata overrides.
 * Returns plain data objects suitable for rendering print cards (no DOM dependency).
 *
 * @param {Array<{name: string, role: string}>} pairs     Ordered player-role pairings
 * @param {Object}                              [customMeta]  Per-role overrides
 *   customMeta[roleKey] may contain { label?: string, imageUrl?: string }
 * @returns {Array<{playerName: string, role: string, label: string, icon: string, desc: string, cssClass: string, imageUrl: string|null}>}
 */
function buildPrintCards(pairs, customMeta) {
  const overrides = customMeta || {};
  return pairs.map(({ name, role }) => {
    const base   = ROLE_META[role];
    const custom = overrides[role] || {};
    return {
      playerName: name,
      role,
      label:    (typeof custom.label === 'string' && custom.label.trim()) ? custom.label.trim() : base.label,
      icon:     base.icon,
      desc:     base.desc,
      cssClass: base.cssClass,
      imageUrl: custom.imageUrl || null,
    };
  });
}

// ── Module export (Node.js / Jest) / global exposure (browser) ───────────────

/* istanbul ignore next */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MIN_PLAYERS,
    MAX_PLAYERS,
    ROLE_TABLE,
    ROLES,
    ROLE_META,
    shuffle,
    buildDeck,
    escapeHtml,
    buildPrintCards,
  };
}
