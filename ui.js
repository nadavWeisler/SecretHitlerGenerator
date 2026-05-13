'use strict';

(function initUi(globalScope) {
  function createNode(documentRef, tagName, options) {
    const node = documentRef.createElement(tagName);
    const settings = options || {};

    if (settings.className) {
      node.className = settings.className;
    }
    if (settings.text) {
      node.textContent = settings.text;
    }
    if (settings.html) {
      node.innerHTML = settings.html;
    }
    if (settings.id) {
      node.id = settings.id;
    }
    if (settings.type) {
      node.type = settings.type;
    }
    if (settings.value !== undefined) {
      node.value = settings.value;
    }
    if (settings.disabled !== undefined) {
      node.disabled = settings.disabled;
    }
    if (settings.attrs) {
      Object.entries(settings.attrs).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          node.setAttribute(key, String(value));
        }
      });
    }
    return node;
  }

  function buildRoleCard(documentRef, cardData) {
    const card = createNode(documentRef, 'button', {
      className: 'role-card',
      type: 'button',
      attrs: {
        'aria-label': `Role card for ${cardData.playerName}. Activate to reveal.`,
        'aria-pressed': 'false',
      },
    });

    const inner = createNode(documentRef, 'div', { className: 'role-card-inner' });
    const front = createNode(documentRef, 'div', { className: 'role-front' });
    const frontIcon = createNode(documentRef, 'span', { className: 'card-icon', text: '🃏' });
    const frontName = createNode(documentRef, 'span', { className: 'card-player-name', text: cardData.playerName });
    const frontHint = createNode(documentRef, 'span', { className: 'card-tap-hint', text: 'Tap or press Enter to reveal' });

    const back = createNode(documentRef, 'div', { className: `role-back ${cardData.cssClass || ''}`.trim() });
    let mediaEl;
    if (cardData.imageUrl) {
      mediaEl = createNode(documentRef, 'img', {
        className: 'role-image',
        attrs: {
          src: cardData.imageUrl,
          alt: '',
        },
      });
    } else {
      mediaEl = createNode(documentRef, 'span', { className: 'role-icon', text: cardData.icon || '🎭' });
    }
    const backLabel = createNode(documentRef, 'span', { className: 'role-label', text: cardData.label });
    const backDesc = createNode(documentRef, 'span', { className: 'role-desc', text: cardData.desc });
    const backHint = createNode(documentRef, 'span', { className: 'card-tap-hint', text: 'Tap or press Enter to hide' });

    front.append(frontIcon, frontName, frontHint);
    back.append(mediaEl, backLabel, backDesc, backHint);
    inner.append(front, back);
    card.appendChild(inner);

    const toggle = () => {
      const revealed = card.classList.toggle('flipped');
      card.setAttribute('aria-pressed', revealed ? 'true' : 'false');
      card.setAttribute(
        'aria-label',
        revealed
          ? `${cardData.playerName} is ${cardData.label}. Activate to hide.`
          : `Role card for ${cardData.playerName}. Activate to reveal.`
      );
    };

    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    });

    return card;
  }

  function buildPrintCardEl(documentRef, cardData, options) {
    const printCard = createNode(documentRef, 'article', {
      className: `print-card ${cardData.cssClass || ''}`.trim(),
    });

    if (options && options.cropMarks) {
      ['tl', 'tr', 'bl', 'br'].forEach((corner) => {
        printCard.appendChild(createNode(documentRef, 'span', { className: `crop-mark crop-mark-${corner}` }));
      });
    }

    const role = createNode(documentRef, 'div', { className: 'print-card-role', text: cardData.label });
    const name = createNode(documentRef, 'div', { className: 'print-card-name', text: cardData.playerName });
    const desc = createNode(documentRef, 'div', { className: 'print-card-desc', text: cardData.desc });

    let mediaEl;
    if (cardData.imageUrl) {
      mediaEl = createNode(documentRef, 'img', {
        className: 'print-card-img',
        attrs: { src: cardData.imageUrl, alt: '' },
      });
    } else {
      mediaEl = createNode(documentRef, 'div', { className: 'print-card-icon', text: cardData.icon || '🎭' });
      mediaEl.setAttribute('aria-hidden', 'true');
    }

    printCard.append(role, mediaEl, name, desc);
    return printCard;
  }

  function buildPrintBackCardEl(documentRef, options) {
    const backLabel = (options && options.backLabel) || 'Secret Hitler';
    const backNote = (options && options.backNote) || 'Role Card Back';
    const backCard = createNode(documentRef, 'article', {
      className: 'print-card print-card-back',
    });

    if (options && options.cropMarks) {
      ['tl', 'tr', 'bl', 'br'].forEach((corner) => {
        backCard.appendChild(createNode(documentRef, 'span', { className: `crop-mark crop-mark-${corner}` }));
      });
    }

    backCard.append(
      createNode(documentRef, 'div', { className: 'print-card-back-emblem', text: '🦅' }),
      createNode(documentRef, 'div', { className: 'print-card-back-title', text: backLabel }),
      createNode(documentRef, 'div', { className: 'print-card-back-desc', text: backNote }),
    );
    return backCard;
  }

  function renderRoleCards(documentRef, container, cards) {
    container.innerHTML = '';
    cards.forEach((cardData) => {
      container.appendChild(buildRoleCard(documentRef, cardData));
    });
  }

  function renderPrintCards(documentRef, container, pages, options) {
    container.innerHTML = '';
    pages.forEach((page, pageIndex) => {
      const pageEl = createNode(documentRef, 'section', {
        className: `print-page ${page.isBackPage ? 'print-page-backs' : 'print-page-fronts'}`,
        attrs: { 'data-page-index': pageIndex + 1 },
      });
      const grid = createNode(documentRef, 'div', { className: 'print-grid' });
      page.cards.forEach((cardData) => {
        grid.appendChild(
          page.isBackPage
            ? buildPrintBackCardEl(documentRef, options)
            : buildPrintCardEl(documentRef, cardData, options)
        );
      });
      pageEl.appendChild(grid);
      container.appendChild(pageEl);
    });
  }

  function renderPresetSelect(selectEl, presets, placeholder) {
    const previousValue = selectEl.value;
    selectEl.innerHTML = '';
    const placeholderOption = selectEl.ownerDocument.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder;
    selectEl.appendChild(placeholderOption);

    presets.forEach((preset) => {
      const option = selectEl.ownerDocument.createElement('option');
      option.value = preset.id;
      option.textContent = preset.name;
      selectEl.appendChild(option);
    });

    selectEl.value = presets.some((preset) => preset.id === previousValue) ? previousValue : '';
  }

  function renderCustomRoleList(documentRef, listEl, roles, handlers) {
    listEl.innerHTML = '';
    roles.forEach((role, index) => {
      const item = createNode(documentRef, 'li');
      item.append(
        createNode(documentRef, 'span', { className: `custom-role-swatch custom-swatch-${(role.cssClass || 'custom-0').split('-').pop()}` }),
        createNode(documentRef, 'span', { className: 'role-icon-col', text: role.icon }),
        createNode(documentRef, 'span', { className: 'role-name-col', text: role.label }),
        createNode(documentRef, 'span', { className: 'role-count-badge', text: `${role.count} cards` }),
      );

      const actions = createNode(documentRef, 'div', { className: 'custom-role-actions' });
      const editBtn = createNode(documentRef, 'button', { className: 'btn btn-secondary btn-inline', type: 'button', text: 'Edit' });
      const removeBtn = createNode(documentRef, 'button', { className: 'btn btn-secondary btn-inline', type: 'button', text: 'Remove' });
      editBtn.addEventListener('click', () => handlers.onEdit(index));
      removeBtn.addEventListener('click', () => handlers.onRemove(index));
      actions.append(editBtn, removeBtn);
      item.appendChild(actions);
      listEl.appendChild(item);
    });
  }

  function announce(liveRegion, message) {
    if (!liveRegion) {
      return;
    }
    liveRegion.textContent = '';
    liveRegion.textContent = message;
  }

  const publicApi = {
    buildRoleCard,
    buildPrintCardEl,
    buildPrintBackCardEl,
    renderRoleCards,
    renderPrintCards,
    renderPresetSelect,
    renderCustomRoleList,
    announce,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = publicApi;
  }

  globalScope.SecretHitlerUI = publicApi;
}(typeof globalThis !== 'undefined' ? globalThis : window));
