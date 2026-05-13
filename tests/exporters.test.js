'use strict';

const {
  normalizeExportOptions,
  reorderBackPageForDuplex,
  buildPrintPages,
  extractImageTypeFromDataUrl,
} = require('../exporters');

describe('normalizeExportOptions()', () => {
  test('applies defaults and clamps invalid values', () => {
    expect(normalizeExportOptions({ columns: 9, rows: 1, pngScale: 9, paper: 'unknown' })).toMatchObject({
      paper: 'letter',
      columns: 3,
      rows: 2,
      pngScale: 3,
      includeBacks: false,
      duplex: false,
    });
  });

  test('preserves explicit supported values', () => {
    expect(normalizeExportOptions({
      paper: 'a4',
      columns: 2,
      rows: 3,
      cropMarks: true,
      includeBacks: true,
      duplex: true,
      backLabel: 'Variant Deck',
      pngScale: 1,
    })).toMatchObject({
      paper: 'a4',
      columns: 2,
      rows: 3,
      cropMarks: true,
      includeBacks: true,
      duplex: true,
      backLabel: 'Variant Deck',
      pngScale: 1,
    });
  });
});

describe('reorderBackPageForDuplex()', () => {
  test('mirrors each row independently', () => {
    expect(reorderBackPageForDuplex(['a', 'b', 'c', 'd', 'e', 'f'], 3)).toEqual(['c', 'b', 'a', 'f', 'e', 'd']);
  });
});

describe('buildPrintPages()', () => {
  const cards = Array.from({ length: 7 }, (_, index) => ({ playerName: `Player ${index + 1}` }));

  test('chunks front pages by layout size', () => {
    const pages = buildPrintPages(cards, { columns: 3, rows: 2 });
    expect(pages).toHaveLength(2);
    expect(pages[0].isBackPage).toBe(false);
    expect(pages[0].cards).toHaveLength(6);
    expect(pages[1].cards).toHaveLength(1);
  });

  test('adds mirrored back pages when requested', () => {
    const pages = buildPrintPages(cards.slice(0, 6), { columns: 3, rows: 2, includeBacks: true, duplex: true });
    expect(pages).toHaveLength(2);
    expect(pages[1].isBackPage).toBe(true);
    expect(pages[1].cards.map((card) => card.playerName)).toEqual([
      'Player 3', 'Player 2', 'Player 1', 'Player 6', 'Player 5', 'Player 4',
    ]);
  });
});

describe('extractImageTypeFromDataUrl()', () => {
  test('detects png, jpeg, and falls back to PNG', () => {
    expect(extractImageTypeFromDataUrl('data:image/png;base64,abc')).toBe('PNG');
    expect(extractImageTypeFromDataUrl('data:image/jpeg;base64,abc')).toBe('JPEG');
    expect(extractImageTypeFromDataUrl('not-a-data-url')).toBe('PNG');
  });
});
