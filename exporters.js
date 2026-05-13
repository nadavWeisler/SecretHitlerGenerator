'use strict';

(function initExporters(globalScope) {
  const PAPER_DIMENSIONS = {
    letter: { width: 8.5, height: 11, label: 'US Letter' },
    a4: { width: 8.27, height: 11.69, label: 'A4' },
  };

  const CUSTOM_THEMES = {
    'custom-0': { fill: [240, 248, 255], stroke: [58, 122, 191], title: [26, 74, 128] },
    'custom-1': { fill: [255, 240, 240], stroke: [192, 57, 43], title: [139, 0, 0] },
    'custom-2': { fill: [240, 255, 240], stroke: [39, 174, 96], title: [26, 92, 26] },
    'custom-3': { fill: [248, 240, 255], stroke: [142, 68, 173], title: [90, 26, 139] },
    'custom-4': { fill: [255, 248, 240], stroke: [230, 126, 34], title: [122, 64, 0] },
  };

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
    return CUSTOM_THEMES[cssClass] || { fill: [255, 255, 255], stroke: [120, 120, 120], title: [30, 30, 30] };
  }

  function normalizeExportOptions(options) {
    const input = options || {};
    const paper = PAPER_DIMENSIONS[input.paper] ? input.paper : 'letter';
    const columns = Math.min(3, Math.max(2, Number.parseInt(input.columns, 10) || 3));
    const rows = Math.min(3, Math.max(2, Number.parseInt(input.rows, 10) || 2));
    return {
      paper,
      columns,
      rows,
      cropMarks: Boolean(input.cropMarks),
      includeBacks: Boolean(input.includeBacks),
      duplex: Boolean(input.duplex),
      backLabel: (typeof input.backLabel === 'string' && input.backLabel.trim()) || 'Secret Hitler',
      backNote: (typeof input.backNote === 'string' && input.backNote.trim()) || 'Role Card Back',
      pngScale: Math.min(3, Math.max(1, Number.parseInt(input.pngScale, 10) || 2)),
    };
  }

  function chunkCards(cards, columns, rows) {
    const pageSize = columns * rows;
    const pages = [];
    for (let index = 0; index < cards.length; index += pageSize) {
      pages.push(cards.slice(index, index + pageSize));
    }
    return pages;
  }

  function reorderBackPageForDuplex(cards, columns) {
    const reordered = [];
    for (let index = 0; index < cards.length; index += columns) {
      reordered.push(...cards.slice(index, index + columns).reverse());
    }
    return reordered;
  }

  function buildPrintPages(cards, options) {
    const normalized = normalizeExportOptions(options);
    const frontPages = chunkCards(cards, normalized.columns, normalized.rows).map((pageCards) => ({
      isBackPage: false,
      cards: pageCards,
    }));

    if (!normalized.includeBacks) {
      return frontPages;
    }

    const backPages = frontPages.map((page) => ({
      isBackPage: true,
      cards: normalized.duplex ? reorderBackPageForDuplex(page.cards, normalized.columns) : page.cards.slice(),
    }));

    return frontPages.concat(backPages);
  }

  function extractImageTypeFromDataUrl(dataUrl) {
    const match = /^data:image\/(png|jpeg|jpg|webp);/i.exec(dataUrl || '');
    if (!match) {
      return 'PNG';
    }
    if (match[1].toLowerCase() === 'jpg') {
      return 'JPEG';
    }
    return match[1].toUpperCase();
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Unable to read image file.'));
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  function loadImageElement(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Unable to load image.'));
      image.src = dataUrl;
    });
  }

  async function normalizeImageFile(file) {
    const rawDataUrl = await readFileAsDataUrl(file);
    const image = await loadImageElement(rawDataUrl);
    const maxDimension = 1200;
    const longestSide = Math.max(image.width, image.height);
    const scale = longestSide > maxDimension ? maxDimension / longestSide : 1;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const mimeType = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    return canvas.toDataURL(mimeType, 0.86);
  }

  function addCropMarks(doc, x, y, width, height) {
    const mark = 0.08;
    doc.setDrawColor(140, 140, 140);
    doc.setLineWidth(0.01);
    doc.line(x - mark, y, x - 0.02, y);
    doc.line(x, y - mark, x, y - 0.02);
    doc.line(x + width + 0.02, y, x + width + mark, y);
    doc.line(x + width, y - mark, x + width, y - 0.02);
    doc.line(x - mark, y + height, x - 0.02, y + height);
    doc.line(x, y + height + 0.02, x, y + height + mark);
    doc.line(x + width + 0.02, y + height, x + width + mark, y + height);
    doc.line(x + width, y + height + 0.02, x + width, y + height + mark);
  }

  function drawCardBackPdf(doc, x, y, width, height, options) {
    doc.setFillColor(36, 20, 0);
    doc.setDrawColor(201, 152, 42);
    doc.roundedRect(x, y, width, height, 0.08, 0.08, 'FD');
    doc.setTextColor(240, 192, 64);
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.text('🦅', x + width / 2, y + 1.1, { align: 'center' });
    doc.setFontSize(16);
    doc.text(options.backLabel, x + width / 2, y + 1.75, { align: 'center', maxWidth: width - 0.4 });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(options.backNote, x + width / 2, y + 2.1, { align: 'center', maxWidth: width - 0.4 });
  }

  function paperDimensions(paper) {
    return PAPER_DIMENSIONS[paper] || PAPER_DIMENSIONS.letter;
  }

  async function drawImageIntoPdf(doc, imageUrl, x, y, width, height) {
    const imageType = extractImageTypeFromDataUrl(imageUrl);
    doc.addImage(imageUrl, imageType, x, y, width, height, undefined, 'FAST');
  }

  async function downloadPrintCardsPdf(cards, options) {
    const normalized = normalizeExportOptions(options);
    const jspdfNs = globalScope.jspdf;
    if (!jspdfNs || !jspdfNs.jsPDF) {
      globalScope.alert('PDF download is unavailable right now. Please use Print Cards.');
      return;
    }

    const dimensions = paperDimensions(normalized.paper);
    const { jsPDF } = jspdfNs;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [dimensions.width, dimensions.height],
    });

    const pageWidth = dimensions.width;
    const pageHeight = dimensions.height;
    const topMargin = 0.6;
    const sideMargin = 0.45;
    const titleHeight = 0.3;
    const availableWidth = pageWidth - sideMargin * 2;
    const availableHeight = pageHeight - topMargin - 0.45 - titleHeight;
    const columnGap = normalized.columns === 2 ? 0.22 : 0.16;
    const rowGap = normalized.rows === 3 ? 0.16 : 0.2;
    const cardWidth = (availableWidth - columnGap * (normalized.columns - 1)) / normalized.columns;
    const cardHeight = (availableHeight - rowGap * (normalized.rows - 1)) / normalized.rows;
    const descMaxLines = 4;
    const pages = buildPrintPages(cards, normalized);

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      if (pageIndex > 0) {
        doc.addPage();
      }

      const page = pages[pageIndex];
      doc.setTextColor(34, 34, 34);
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.text(
        page.isBackPage ? `${normalized.backLabel} – Card Backs` : 'Secret Hitler – Role Cards',
        pageWidth / 2,
        0.38,
        { align: 'center' }
      );

      for (let index = 0; index < page.cards.length; index++) {
        const card = page.cards[index];
        const col = index % normalized.columns;
        const row = Math.floor(index / normalized.columns);
        const x = sideMargin + col * (cardWidth + columnGap);
        const y = topMargin + titleHeight + row * (cardHeight + rowGap);

        if (normalized.cropMarks) {
          addCropMarks(doc, x, y, cardWidth, cardHeight);
        }

        if (page.isBackPage) {
          drawCardBackPdf(doc, x, y, cardWidth, cardHeight, normalized);
          continue;
        }

        const theme = getPdfThemeByCssClass(card.cssClass);
        doc.setFillColor(...theme.fill);
        doc.setDrawColor(...theme.stroke);
        doc.roundedRect(x, y, cardWidth, cardHeight, 0.08, 0.08, 'FD');

        doc.setTextColor(...theme.title);
        doc.setFont('times', 'bold');
        doc.setFontSize(13);
        doc.text(card.label, x + cardWidth / 2, y + 0.32, { align: 'center', maxWidth: cardWidth - 0.3 });

        if (card.imageUrl) {
          try {
            await drawImageIntoPdf(doc, card.imageUrl, x + 0.25, y + 0.5, cardWidth - 0.5, Math.min(1.45, cardHeight * 0.42));
          } catch (error) {
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(26);
            doc.text(card.icon || '🎭', x + cardWidth / 2, y + 1.25, { align: 'center' });
          }
        } else {
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(26);
          doc.text(card.icon || '🎭', x + cardWidth / 2, y + 1.25, { align: 'center' });
        }

        doc.setDrawColor(153, 153, 153);
        doc.line(x + 0.14, y + cardHeight - 0.86, x + cardWidth - 0.14, y + cardHeight - 0.86);
        doc.setTextColor(0, 0, 0);
        doc.setFont('times', 'bold');
        doc.setFontSize(11);
        doc.text(card.playerName, x + cardWidth / 2, y + cardHeight - 0.58, {
          align: 'center',
          maxWidth: cardWidth - 0.3,
        });

        doc.setTextColor(68, 68, 68);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const descLines = doc.splitTextToSize(card.desc || '', cardWidth - 0.32).slice(0, descMaxLines);
        doc.text(descLines, x + cardWidth / 2, y + cardHeight - 0.4, { align: 'center', maxWidth: cardWidth - 0.3 });
      }
    }

    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`secret-hitler-cards-${timestamp}.pdf`);
  }

  async function drawCardToCanvas(ctx, card, x, y, width, height, options, isBackPage) {
    ctx.save();
    ctx.fillStyle = isBackPage ? '#241400' : '#ffffff';
    ctx.strokeStyle = isBackPage ? '#c9982a' : '#8a8a8a';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);

    if (options.cropMarks) {
      const offset = 10;
      [[x, y], [x + width, y], [x, y + height], [x + width, y + height]].forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.moveTo(cx - offset, cy);
        ctx.lineTo(cx + offset, cy);
        ctx.moveTo(cx, cy - offset);
        ctx.lineTo(cx, cy + offset);
        ctx.strokeStyle = '#999';
        ctx.stroke();
      });
    }

    if (isBackPage) {
      ctx.fillStyle = '#f0c040';
      ctx.font = 'bold 28px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('🦅', x + width / 2, y + 90);
      ctx.font = 'bold 24px Georgia';
      ctx.fillText(options.backLabel, x + width / 2, y + 150, width - 30);
      ctx.fillStyle = '#f5e9d0';
      ctx.font = '16px sans-serif';
      ctx.fillText(options.backNote, x + width / 2, y + 185, width - 30);
      ctx.restore();
      return;
    }

    const theme = getPdfThemeByCssClass(card.cssClass);
    ctx.fillStyle = `rgb(${theme.fill.join(',')})`;
    ctx.fillRect(x + 4, y + 4, width - 8, height - 8);
    ctx.fillStyle = `rgb(${theme.title.join(',')})`;
    ctx.font = 'bold 22px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(card.label, x + width / 2, y + 34, width - 30);

    if (card.imageUrl) {
      try {
        const image = await loadImageElement(card.imageUrl);
        const mediaHeight = Math.min(110, height * 0.34);
        ctx.drawImage(image, x + 20, y + 48, width - 40, mediaHeight);
      } catch (error) {
        ctx.fillStyle = '#000';
        ctx.font = '36px sans-serif';
        ctx.fillText(card.icon || '🎭', x + width / 2, y + 120);
      }
    } else {
      ctx.fillStyle = '#000';
      ctx.font = '36px sans-serif';
      ctx.fillText(card.icon || '🎭', x + width / 2, y + 120);
    }

    ctx.strokeStyle = '#999';
    ctx.beginPath();
    ctx.moveTo(x + 16, y + height - 74);
    ctx.lineTo(x + width - 16, y + height - 74);
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.font = 'bold 18px Georgia';
    ctx.fillText(card.playerName, x + width / 2, y + height - 50, width - 24);
    ctx.fillStyle = '#444';
    ctx.font = '13px sans-serif';
    wrapCanvasText(ctx, card.desc || '', x + width / 2, y + height - 26, width - 24, 16, 3);
    ctx.restore();
  }

  function wrapCanvasText(ctx, text, centerX, startY, maxWidth, lineHeight, maxLines) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let currentLine = '';

    words.forEach((word) => {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth || !currentLine) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) {
      lines.push(currentLine);
    }

    lines.slice(0, maxLines).forEach((line, index) => {
      ctx.fillText(line, centerX, startY + index * lineHeight, maxWidth);
    });
  }

  async function downloadPngSheets(cards, options) {
    const normalized = normalizeExportOptions(options);
    const dimensions = paperDimensions(normalized.paper);
    const scale = normalized.pngScale * 100;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(dimensions.width * scale);
    canvas.height = Math.round(dimensions.height * scale);
    const ctx = canvas.getContext('2d');
    const pages = buildPrintPages(cards, normalized);

    const pageWidth = canvas.width;
    const pageHeight = canvas.height;
    const titleHeight = 48;
    const sideMargin = 36;
    const topMargin = 60;
    const availableWidth = pageWidth - sideMargin * 2;
    const availableHeight = pageHeight - topMargin - 40 - titleHeight;
    const columnGap = normalized.columns === 2 ? 22 : 16;
    const rowGap = normalized.rows === 3 ? 16 : 20;
    const cardWidth = Math.floor((availableWidth - columnGap * (normalized.columns - 1)) / normalized.columns);
    const cardHeight = Math.floor((availableHeight - rowGap * (normalized.rows - 1)) / normalized.rows);

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#222';
      ctx.font = 'bold 28px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText(pages[pageIndex].isBackPage ? `${normalized.backLabel} – Card Backs` : 'Secret Hitler – Role Cards', pageWidth / 2, 40);

      for (let index = 0; index < pages[pageIndex].cards.length; index++) {
        const card = pages[pageIndex].cards[index];
        const col = index % normalized.columns;
        const row = Math.floor(index / normalized.columns);
        const x = sideMargin + col * (cardWidth + columnGap);
        const y = topMargin + titleHeight + row * (cardHeight + rowGap);
        await drawCardToCanvas(ctx, card, x, y, cardWidth, cardHeight, normalized, pages[pageIndex].isBackPage);
      }

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `secret-hitler-sheet-${pageIndex + 1}.png`;
      link.click();
    }
  }

  const publicApi = {
    PAPER_DIMENSIONS,
    getPdfThemeByCssClass,
    normalizeExportOptions,
    chunkCards,
    reorderBackPageForDuplex,
    buildPrintPages,
    extractImageTypeFromDataUrl,
    normalizeImageFile,
    downloadPrintCardsPdf,
    downloadPngSheets,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = publicApi;
  }

  globalScope.SecretHitlerExporters = publicApi;
}(typeof globalThis !== 'undefined' ? globalThis : window));
