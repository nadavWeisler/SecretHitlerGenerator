/**
 * Secret Hitler – Game Generator
 * script.js  –  DOM interaction layer.
 *
 * Requires lib.js to be loaded first (provides MIN_PLAYERS, MAX_PLAYERS,
 * ROLES, ROLE_META, shuffle, buildDeck, buildPrintCards, escapeHtml as globals).
 */

'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Maximum number of description lines shown on each PDF card. */
const PDF_MAX_DESC_LINES = 3;

// ── State ─────────────────────────────────────────────────────────────────────

/** Player count is fixed to the full 10-player deck. */
const DEFAULT_PLAYER_COUNT = MAX_PLAYERS;

/**
 * Stores the most-recently generated player-role pairings.
 * @type {Array<{name: string, role: string}>}
 */
let currentPairs = [];

/** @type {{ liberal: string|null, fascist: string|null, hitler: string|null }} */
const customImageData = { liberal: null, fascist: null, hitler: null };

// ── DOM references ────────────────────────────────────────────────────────────

const setupSection            = document.getElementById('setup-section');
const generateBtn             = document.getElementById('generate-btn');

// Customisation inputs
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

// Results
const resultsSection = document.getElementById('results-section');
const roleCardsEl    = document.getElementById('role-cards');
const restartBtn     = document.getElementById('restart-btn');
const printBtn       = document.getElementById('print-btn');
const downloadPdfBtn = document.getElementById('download-pdf-btn');
const printCardsEl   = document.getElementById('print-cards');

// ── Setup helpers ────────────────────────────────────────────────────────────

function resetCustomizationDefaults() {
  customLabelInputs.liberal.value = ROLE_META[ROLES.LIBERAL].label;
  customLabelInputs.fascist.value = ROLE_META[ROLES.FASCIST].label;
  customLabelInputs.hitler.value  = ROLE_META[ROLES.HITLER].label;
}

// ── UI helpers ────────────────────────────────────────────────────────────────

/**
 * Build a single role card element.
 * @param {string} playerName
 * @param {string} role
 * @param {{ label: string, icon: string, desc: string, cssClass: string }} [metaOverride]
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

// ── Customisation helpers ─────────────────────────────────────────────────────

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

/**
 * Render print cards into the hidden print section.
 * @param {Array<{ playerName: string, role: string, label: string, icon: string, desc: string, cssClass: string, imageUrl: string|null }>} cards
 */
function renderPreparedPrintCards(cards) {
  printCardsEl.innerHTML = '';
  cards.forEach((cardData) => {
    printCardsEl.appendChild(buildPrintCardEl(cardData));
  });
}

function getPdfThemeByCssClass(cssClass) {
  if (cssClass === 'liberal') {
    return { fill: [240, 248, 255], stroke: [58, 122, 191], title: [26, 74, 128] };
  }
  if (cssClass === 'fascist') {
    return { fill: [255, 240, 240], stroke: [192, 57, 43], title: [139, 0, 0] };
  }
  if (cssClass === 'hitler') {
    return { fill: [255, 232, 232], stroke: [139, 0, 0], title: [107, 0, 0] };
  }
  return { fill: [255, 255, 255], stroke: [120, 120, 120], title: [30, 30, 30] };
}

function downloadPrintCardsPdf(cards) {
  const jspdfNs = window.jspdf;
  if (!jspdfNs || !jspdfNs.jsPDF) {
    window.alert('PDF download is unavailable right now. Please use Print Cards.');
    return;
  }

  const { jsPDF } = jspdfNs;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });

  const cardWidth   = 2.5;
  const cardHeight  = 3.5;
  const columnGap   = 0.2;
  const rowGap      = 0.2;
  const columns     = 3;
  const rowsPerPage = 2;
  const pageWidth   = 8.5;
  const leftMargin  = (pageWidth - (columns * cardWidth + (columns - 1) * columnGap)) / 2;
  const topMargin   = 0.75;

  cards.forEach((card, index) => {
    const indexInPage = index % (columns * rowsPerPage);
    if (index > 0 && indexInPage === 0) {
      doc.addPage();
    }

    const col   = indexInPage % columns;
    const row   = Math.floor(indexInPage / columns);
    const x     = leftMargin + col * (cardWidth + columnGap);
    const y     = topMargin  + row * (cardHeight + rowGap);
    const theme = getPdfThemeByCssClass(card.cssClass);

    doc.setFillColor(...theme.fill);
    doc.setDrawColor(...theme.stroke);
    doc.roundedRect(x, y, cardWidth, cardHeight, 0.08, 0.08, 'FD');

    doc.setTextColor(...theme.title);
    doc.setFont('times', 'bold');
    doc.setFontSize(15);
    doc.text(card.label, x + cardWidth / 2, y + 0.36, { align: 'center', maxWidth: cardWidth - 0.3 });

    const hasImage = card.imageUrl && card.imageUrl.startsWith('data:image/');
    if (hasImage) {
      try {
        doc.addImage(card.imageUrl, 'PNG', x + 0.35, y + 0.6, cardWidth - 0.7, 1.4, undefined, 'FAST');
      } catch (error) {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(28);
        doc.text(card.icon || '🎭', x + cardWidth / 2, y + 1.5, { align: 'center' });
      }
    } else {
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(28);
      doc.text(card.icon || '🎭', x + cardWidth / 2, y + 1.5, { align: 'center' });
    }

    doc.setDrawColor(153, 153, 153);
    doc.line(x + 0.15, y + 2.6, x + cardWidth - 0.15, y + 2.6);

    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text(card.playerName, x + cardWidth / 2, y + 2.84, { align: 'center', maxWidth: cardWidth - 0.3 });

    doc.setTextColor(68, 68, 68);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const descLines = doc.splitTextToSize(card.desc || '', cardWidth - 0.3).slice(0, PDF_MAX_DESC_LINES);
    doc.text(descLines, x + cardWidth / 2, y + 3.03, { align: 'center', maxWidth: cardWidth - 0.3 });
  });

  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`secret-hitler-print-and-play-${timestamp}.pdf`);
}

// ── Generation ────────────────────────────────────────────────────────────────

generateBtn.addEventListener('click', () => {
  const deck = buildDeck(DEFAULT_PLAYER_COUNT);

  // Auto-generate anonymous player labels (Player 1 … Player N)
  const pairs = Array.from({ length: DEFAULT_PLAYER_COUNT }, (_, i) => ({
    name: `Player ${i + 1}`,
    role: deck[i],
  }));
  shuffle(pairs);

  currentPairs = pairs;

  roleCardsEl.innerHTML = '';
  pairs.forEach(({ name, role }) => {
    roleCardsEl.appendChild(buildRoleCard(name, role));
  });

  setupSection.classList.add('hidden');
  resultsSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Auto-download the PDF immediately after generation.
  const cards = buildPrintCards(currentPairs, getCustomMeta());
  renderPreparedPrintCards(cards);
  downloadPrintCardsPdf(cards);
});

// ── Results – shared handlers ─────────────────────────────────────────────────

printBtn.addEventListener('click', () => {
  const cards = buildPrintCards(currentPairs, getCustomMeta());
  renderPreparedPrintCards(cards);
  window.print();
});

downloadPdfBtn.addEventListener('click', () => {
  const cards = buildPrintCards(currentPairs, getCustomMeta());
  renderPreparedPrintCards(cards);
  downloadPrintCardsPdf(cards);
});

restartBtn.addEventListener('click', () => {
  currentPairs = [];
  resetCustomizationDefaults();
  Object.keys(customImageData).forEach((role) => {
    customImageData[role] = null;
    customImgInputs[role].value = '';
    customImgPreviews[role].src = '';
    customImgPreviews[role].classList.add('hidden');
  });
  resultsSection.classList.add('hidden');
  setupSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Init ──────────────────────────────────────────────────────────────────────

resetCustomizationDefaults();
generateBtn.disabled = false;
