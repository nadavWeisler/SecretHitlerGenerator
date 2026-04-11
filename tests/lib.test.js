'use strict';

const {
  MIN_PLAYERS,
  MAX_PLAYERS,
  ROLE_TABLE,
  ROLES,
  ROLE_META,
  shuffle,
  buildDeck,
  escapeHtml,
  buildPrintCards,
} = require('../lib');

// ── Constants ────────────────────────────────────────────────────────────────

describe('Constants', () => {
  test('MIN_PLAYERS is 5', () => {
    expect(MIN_PLAYERS).toBe(5);
  });

  test('MAX_PLAYERS is 10', () => {
    expect(MAX_PLAYERS).toBe(10);
  });

  test('ROLE_TABLE covers every valid player count', () => {
    for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
      expect(ROLE_TABLE).toHaveProperty(String(n));
    }
  });

  test('ROLE_TABLE entries have correct total size', () => {
    for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
      const { liberals, fascists } = ROLE_TABLE[n];
      // liberals + fascists + 1 Hitler == total players
      expect(liberals + fascists + 1).toBe(n);
    }
  });

  test('ROLES has LIBERAL, FASCIST and HITLER', () => {
    expect(ROLES.LIBERAL).toBe('liberal');
    expect(ROLES.FASCIST).toBe('fascist');
    expect(ROLES.HITLER).toBe('hitler');
  });

  test('ROLE_META has an entry for each role', () => {
    [ROLES.LIBERAL, ROLES.FASCIST, ROLES.HITLER].forEach((role) => {
      expect(ROLE_META).toHaveProperty(role);
      expect(ROLE_META[role]).toMatchObject({
        label:    expect.any(String),
        icon:     expect.any(String),
        desc:     expect.any(String),
        cssClass: expect.any(String),
      });
    });
  });
});

// ── shuffle ──────────────────────────────────────────────────────────────────

describe('shuffle()', () => {
  test('returns the same array reference', () => {
    const arr = [1, 2, 3];
    expect(shuffle(arr)).toBe(arr);
  });

  test('preserves all elements', () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    shuffle(original);
    expect(original.sort()).toEqual(copy.sort());
  });

  test('does not crash on empty array', () => {
    expect(() => shuffle([])).not.toThrow();
  });

  test('does not crash on single-element array', () => {
    expect(shuffle([42])).toEqual([42]);
  });

  test('produces different orderings over many runs (statistical)', () => {
    const arr = [1, 2, 3, 4, 5];
    const results = new Set();
    for (let i = 0; i < 200; i++) {
      results.add(shuffle([...arr]).join(','));
    }
    // With 5 elements there are 120 permutations; 200 draws should give >1.
    expect(results.size).toBeGreaterThan(1);
  });
});

// ── buildDeck ────────────────────────────────────────────────────────────────

describe('buildDeck()', () => {
  const CASES = [
    { players: 5,  liberals: 3, fascists: 1 },
    { players: 6,  liberals: 4, fascists: 1 },
    { players: 7,  liberals: 4, fascists: 2 },
    { players: 8,  liberals: 5, fascists: 2 },
    { players: 9,  liberals: 5, fascists: 3 },
    { players: 10, liberals: 6, fascists: 3 },
  ];

  test.each(CASES)(
    '$players players → $liberals liberals, $fascists fascists, 1 Hitler',
    ({ players, liberals, fascists }) => {
      const deck = buildDeck(players);
      expect(deck).toHaveLength(players);
      expect(deck.filter((r) => r === ROLES.LIBERAL)).toHaveLength(liberals);
      expect(deck.filter((r) => r === ROLES.FASCIST)).toHaveLength(fascists);
      expect(deck.filter((r) => r === ROLES.HITLER)).toHaveLength(1);
    }
  );

  test('deck contains only valid role strings', () => {
    const validRoles = new Set(Object.values(ROLES));
    const deck = buildDeck(7);
    deck.forEach((role) => expect(validRoles).toContain(role));
  });

  test('deck is shuffled (returns array, not throws)', () => {
    expect(() => buildDeck(5)).not.toThrow();
    expect(Array.isArray(buildDeck(5))).toBe(true);
  });
});

// ── escapeHtml ───────────────────────────────────────────────────────────────

describe('escapeHtml()', () => {
  test('returns plain strings unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  test('escapes ampersand', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  test('escapes less-than and greater-than', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  test('escapes double quotes', () => {
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
  });

  test('escapes single quotes', () => {
    expect(escapeHtml("it's fine")).toBe("it&#039;s fine");
  });

  test('escapes a full XSS payload', () => {
    const payload = '<img src=x onerror="alert(\'xss\')">';
    const escaped = escapeHtml(payload);
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
    expect(escaped).not.toContain('"');
    expect(escaped).not.toContain("'");
  });

  test('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });
});

// ── buildPrintCards ───────────────────────────────────────────────────────────

describe('buildPrintCards()', () => {
  const SAMPLE_PAIRS = [
    { name: 'Alice', role: ROLES.LIBERAL },
    { name: 'Bob',   role: ROLES.FASCIST },
    { name: 'Carol', role: ROLES.HITLER  },
  ];

  test('returns one entry per pair', () => {
    const cards = buildPrintCards(SAMPLE_PAIRS);
    expect(cards).toHaveLength(3);
  });

  test('each card has required fields', () => {
    buildPrintCards(SAMPLE_PAIRS).forEach((card) => {
      expect(card).toHaveProperty('playerName', expect.any(String));
      expect(card).toHaveProperty('role',       expect.any(String));
      expect(card).toHaveProperty('label',      expect.any(String));
      expect(card).toHaveProperty('icon',       expect.any(String));
      expect(card).toHaveProperty('desc',       expect.any(String));
      expect(card).toHaveProperty('cssClass',   expect.any(String));
      expect(card).toHaveProperty('imageUrl');
    });
  });

  test('uses default ROLE_META values when no customMeta is given', () => {
    const [liberal] = buildPrintCards([{ name: 'Alice', role: ROLES.LIBERAL }]);
    expect(liberal.label).toBe(ROLE_META[ROLES.LIBERAL].label);
    expect(liberal.imageUrl).toBeNull();
  });

  test('custom label overrides default', () => {
    const customMeta = { [ROLES.LIBERAL]: { label: 'Resistance Fighter' } };
    const [card] = buildPrintCards([{ name: 'Alice', role: ROLES.LIBERAL }], customMeta);
    expect(card.label).toBe('Resistance Fighter');
  });

  test('custom label is trimmed', () => {
    const customMeta = { [ROLES.FASCIST]: { label: '  Spy  ' } };
    const [card] = buildPrintCards([{ name: 'Bob', role: ROLES.FASCIST }], customMeta);
    expect(card.label).toBe('Spy');
  });

  test('empty custom label falls back to default', () => {
    const customMeta = { [ROLES.HITLER]: { label: '   ' } };
    const [card] = buildPrintCards([{ name: 'Carol', role: ROLES.HITLER }], customMeta);
    expect(card.label).toBe(ROLE_META[ROLES.HITLER].label);
  });

  test('custom imageUrl is preserved', () => {
    const url = 'data:image/png;base64,abc123';
    const customMeta = { [ROLES.LIBERAL]: { imageUrl: url } };
    const [card] = buildPrintCards([{ name: 'Alice', role: ROLES.LIBERAL }], customMeta);
    expect(card.imageUrl).toBe(url);
  });

  test('imageUrl is null when not provided', () => {
    const [card] = buildPrintCards([{ name: 'Alice', role: ROLES.LIBERAL }], {});
    expect(card.imageUrl).toBeNull();
  });

  test('playerName and role pass through unchanged', () => {
    const [card] = buildPrintCards([{ name: 'Alice', role: ROLES.LIBERAL }]);
    expect(card.playerName).toBe('Alice');
    expect(card.role).toBe(ROLES.LIBERAL);
  });

  test('works with no customMeta argument', () => {
    expect(() => buildPrintCards(SAMPLE_PAIRS)).not.toThrow();
  });

  test('works with empty pairs array', () => {
    expect(buildPrintCards([])).toEqual([]);
  });

  test('customMeta for one role does not affect others', () => {
    const customMeta = { [ROLES.LIBERAL]: { label: 'Custom' } };
    const [, fascistCard] = buildPrintCards(
      [{ name: 'Alice', role: ROLES.LIBERAL }, { name: 'Bob', role: ROLES.FASCIST }],
      customMeta,
    );
    expect(fascistCard.label).toBe(ROLE_META[ROLES.FASCIST].label);
  });
});
