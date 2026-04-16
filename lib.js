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
 * @param {Array<{name: string, role: string}>} pairs         Ordered player-role pairings
 * @param {Object}                              [customMeta]  Per-role label/image overrides
 *   customMeta[roleKey] may contain { label?: string, imageUrl?: string }
 * @param {Object}                              [baseMeta]    Base metadata lookup; defaults to ROLE_META.
 *   Pass a custom map when building print cards for a custom game.
 * @returns {Array<{playerName: string, role: string, label: string, icon: string, desc: string, cssClass: string, imageUrl: string|null}>}
 */
function buildPrintCards(pairs, customMeta, baseMeta) {
  const overrides = customMeta || {};
  const base_meta = baseMeta || ROLE_META;
  return pairs.map(({ name, role }) => {
    const base   = base_meta[role] || {};
    const custom = overrides[role] || {};
    return {
      playerName: name,
      role,
      label:    (typeof custom.label === 'string' && custom.label.trim()) ? custom.label.trim() : (base.label || role),
      icon:     base.icon || '🎭',
      desc:     base.desc || '',
      cssClass: base.cssClass || 'custom-0',
      imageUrl: custom.imageUrl || null,
    };
  });
}

/**
 * Build a shuffled role deck for a custom game.
 *
 * @param {Array<{key: string, count: number}>} roleDefs
 *   Each element must have a `key` (unique role identifier) and a `count` (number of cards).
 * @returns {string[]} Shuffled array of role keys
 */
function buildCustomDeck(roleDefs) {
  const deck = [];
  for (const def of roleDefs) {
    for (let i = 0; i < def.count; i++) {
      deck.push(def.key);
    }
  }
  return shuffle(deck);
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
    buildCustomDeck,
    escapeHtml,
    buildPrintCards,
  };
}
