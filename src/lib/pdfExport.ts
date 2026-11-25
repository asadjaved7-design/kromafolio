import { jsPDF } from 'jspdf';
import type { PortfolioDeck, PortfolioSlide } from '../types/portfolio';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [r, g, b];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
      return [r, g, b];
    }
  }
  return [37, 99, 235];
}

async function loadImageDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:image/')) return url;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function getSlideTheme(slide: PortfolioSlide, accentHex: string) {
  const accentRgb = hexToRgb(accentHex);
  if (slide.backgroundStyle === 'dark') {
    return {
      bg: [12, 16, 26] as [number, number, number],
      surface: [22, 29, 45] as [number, number, number],
      text: [248, 250, 252] as [number, number, number],
      muted: [148, 163, 184] as [number, number, number],
      accent: accentRgb,
    };
  }
  if (slide.backgroundStyle === 'accent') {
    return {
      bg: accentRgb,
      surface: [255, 255, 255] as [number, number, number],
      text: [255, 255, 255] as [number, number, number],
      muted: [226, 232, 240] as [number, number, number],
      accent: [255, 255, 255] as [number, number, number],
    };
  }
  return {
    bg: [248, 250, 252] as [number, number, number],
    surface: [255, 255, 255] as [number, number, number],
    text: [15, 23, 42] as [number, number, number],
    muted: [100, 116, 139] as [number, number, number],
    accent: accentRgb,
  };
}

export async function exportPortfolioToPdf(deck: PortfolioDeck): Promise<void> {
  // 16:9 widescreen presentation format (297mm x 167mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [297, 167],
  });

  const pageW = 297;
  const pageH = 167;
  const margin = 16;

  // Preload images in parallel
  const imageUrls = deck.slides.map((s) => s.imageUrl || (s.layout === 'cover' ? deck.coverImage : ''));
  const loadedImages = await Promise.all(imageUrls.map((u) => loadImageDataUrl(u)));

  deck.slides.forEach((slide, index) => {
    if (index > 0) {
      doc.addPage([297, 167], 'landscape');
    }

    const theme = getSlideTheme(slide, deck.accentColor);
    const imgData = loadedImages[index];

    // Background canvas
    doc.setFillColor(...theme.bg);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Top accent bar
    doc.setFillColor(...theme.accent);
    doc.rect(0, 0, pageW, 2.5, 'F');

    // Slide header meta
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const eyebrowColor: [number, number, number] = slide.backgroundStyle === 'accent' ? [255, 255, 255] : theme.accent;
    doc.setTextColor(...eyebrowColor);
    doc.text((slide.eyebrow || `Slide ${index + 1}`).toUpperCase(), margin, 16);

    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...theme.muted);
    const pageTag = `${String(index + 1).padStart(2, '0')} / ${String(deck.slides.length).padStart(2, '0')}`;
    doc.text(pageTag, pageW - margin - 14, 16);

    const hasImage = Boolean(imgData);
    const isSplitLayout =
      hasImage && (slide.layout === 'cover' || slide.layout === 'editorial-split' || slide.layout === 'full-showcase');

    const textColWidth = isSplitLayout ? 132 : pageW - margin * 2;
    let cursorY = 30;

    // Slide Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(slide.layout === 'cover' ? 28 : 22);
    doc.setTextColor(...theme.text);
    const titleLines = doc.splitTextToSize(slide.title || deck.title, textColWidth);
    doc.text(titleLines, margin, cursorY);
    cursorY += titleLines.length * (slide.layout === 'cover' ? 11.5 : 9.2) + 3;

    // Subtitle
    if (slide.subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(...theme.muted);
      const subLines = doc.splitTextToSize(slide.subtitle, textColWidth);
      doc.text(subLines, margin, cursorY);
      cursorY += subLines.length * 5.8 + 4;
    }

    // Body copy
    if (slide.body) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(...theme.text);
      const bodyLines = doc.splitTextToSize(slide.body, textColWidth);
      doc.text(bodyLines, margin, cursorY);
      cursorY += bodyLines.length * 5.2 + 5;
    }

    // Metrics grid
    if (slide.metrics && slide.metrics.length > 0) {
      const cardCount = Math.min(slide.metrics.length, 4);
      const gap = 5;
      const availableW = isSplitLayout ? textColWidth : pageW - margin * 2;
      const cardW = (availableW - gap * (cardCount - 1)) / cardCount;
      const cardY = Math.max(cursorY + 2, 86);
      slide.metrics.slice(0, 4).forEach((m, mIdx) => {
        const cardX = margin + mIdx * (cardW + gap);
        if (slide.backgroundStyle === 'accent') {
          doc.setFillColor(255, 255, 255);
        } else {
          doc.setFillColor(...theme.surface);
        }
        doc.roundedRect(cardX, cardY, cardW, 30, 3, 3, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(...(slide.backgroundStyle === 'accent' ? hexToRgb(deck.accentColor) : theme.accent));
        doc.text(m.value, cardX + 5, cardY + 14);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const labelColor: [number, number, number] = slide.backgroundStyle === 'accent' ? [71, 85, 105] : theme.muted;
        doc.setTextColor(...labelColor);
        const labelLines = doc.splitTextToSize(m.label, cardW - 10);
        doc.text(labelLines, cardX + 5, cardY + 22);
      });
      cursorY = cardY + 36;
    }

    // Palette Swatches
    if (slide.layout === 'palette-type' && slide.paletteColors && slide.paletteColors.length > 0) {
      const swatchY = Math.max(cursorY + 2, 105);
      const swatchW = 36;
      slide.paletteColors.slice(0, 5).forEach((hex, cIdx) => {
        const sx = margin + cIdx * (swatchW + 5);
        const rgb = hexToRgb(hex);
        doc.setFillColor(...rgb);
        doc.roundedRect(sx, swatchY, swatchW, 18, 2.5, 2.5, 'F');
        doc.setFont('courier', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...theme.muted);
        doc.text(hex.toUpperCase(), sx, swatchY + 23);
      });
    }

    // Bullet highlights
    if (slide.bullets && slide.bullets.length > 0) {
      const bulletYStart = Math.min(cursorY + 2, 118);
      let bY = bulletYStart;
      slide.bullets.slice(0, 4).forEach((b) => {
        if (bY > pageH - 22) return;
        const dotColor: [number, number, number] = slide.backgroundStyle === 'accent' ? [255, 255, 255] : theme.accent;
        doc.setFillColor(...dotColor);
        doc.circle(margin + 1.8, bY - 1.2, 1.1, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.8);
        doc.setTextColor(...theme.text);
        const bLines = doc.splitTextToSize(b, textColWidth - 7);
        doc.text(bLines, margin + 6, bY);
        bY += bLines.length * 4.8 + 2.5;
      });
    }

    // Right-hand image frame when present
    if (isSplitLayout && imgData) {
      const imgX = 160;
      const imgY = 24;
      const imgW = pageW - imgX - margin;
      const imgH = 116;
      try {
        const format = imgData.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(imgData, format, imgX, imgY, imgW, imgH, undefined, 'FAST');
      } catch {
        // Fallback color block if image encoding fails
        doc.setFillColor(...theme.surface);
        doc.roundedRect(imgX, imgY, imgW, imgH, 3, 3, 'F');
      }
    }

    // Footer Attribution
    doc.setDrawColor(...theme.muted);
    doc.setLineWidth(0.2);
    doc.line(margin, pageH - 14, pageW - margin, pageH - 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...theme.text);
    doc.text(`${deck.creatorName}  ·  @${deck.creatorHandle}`, margin, pageH - 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...theme.muted);
    const rightFoot = `${deck.category}  ·  Generated with KromaFolio`;
    doc.text(rightFoot, pageW - margin - doc.getTextWidth(rightFoot), pageH - 8);
  });

  const safeSlug = (deck.title || 'kromafolio-presentation')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

  doc.save(`${safeSlug || 'portfolio'}-presentation.pdf`);
}
