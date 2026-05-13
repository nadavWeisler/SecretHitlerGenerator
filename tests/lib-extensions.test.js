'use strict';

const {
  ROLES,
  buildNamedPairs,
  buildOfficialPairs,
  normalizeRoleDefs,
  buildCustomRoleMeta,
} = require('../lib');

describe('buildNamedPairs()', () => {
  test('creates numbered player names with a custom prefix', () => {
    expect(buildNamedPairs([ROLES.LIBERAL, ROLES.HITLER], 'Seat')).toEqual([
      { name: 'Seat 1', role: ROLES.LIBERAL },
      { name: 'Seat 2', role: ROLES.HITLER },
    ]);
  });
});

describe('buildOfficialPairs()', () => {
  test('returns one named pair per player', () => {
    const pairs = buildOfficialPairs(6);
    expect(pairs).toHaveLength(6);
    expect(pairs.every((pair, index) => pair.name === `Player ${index + 1}`)).toBe(true);
  });
});

describe('normalizeRoleDefs()', () => {
  test('drops invalid roles, deduplicates keys, and normalizes defaults', () => {
    const roles = normalizeRoleDefs([
      { key: 'agent', label: 'Agent', count: 2, icon: '🕵️', desc: 'Sneak around.', cssClass: 'custom-3' },
      { key: 'agent', label: 'Duplicate', count: 1 },
      { key: 'ghost', count: 0 },
      { key: 'seer', count: '1' },
    ]);

    expect(roles).toHaveLength(2);
    expect(roles[0]).toMatchObject({ key: 'agent', label: 'Agent', count: 2, cssClass: 'custom-3' });
    expect(roles[1]).toMatchObject({ key: 'seer', label: 'seer', count: 1, icon: '🎭' });
  });
});

describe('buildCustomRoleMeta()', () => {
  test('returns ROLE_META-like lookup data', () => {
    expect(buildCustomRoleMeta([
      { key: 'agent', label: 'Agent', icon: '🕵️', desc: 'Sneak around.', count: 2, cssClass: 'custom-1', imageUrl: 'data:image/png;base64,abc' },
    ])).toEqual({
      agent: {
        label: 'Agent',
        icon: '🕵️',
        desc: 'Sneak around.',
        cssClass: 'custom-1',
        imageUrl: 'data:image/png;base64,abc',
      },
    });
  });
});
