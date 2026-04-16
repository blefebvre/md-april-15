/* eslint-disable */
/* global WebImporter */

/**
 * Converts a Scene7 img to an anchor link for DA compatibility.
 * Non-Scene7 images are returned as-is.
 */
function imgToLink(img, document) {
  const src = img.src || img.getAttribute('src') || '';
  if (src.includes('scene7.com')) {
    const cleanSrc = src.split('?')[0].split(':')[0];
    const a = document.createElement('a');
    a.href = cleanSrc;
    a.textContent = img.alt || '';
    return a;
  }
  return img;
}

/**
 * Parser: columns-content-split
 * Base block: columns
 * Source: https://www.usa.canon.com/business/it-and-security/five-pillars-of-security/device-security
 * Structure: 1 row with 2 columns. Col1 = text content, Col2 = image (as link for Scene7)
 * Selectors from captured DOM: .contentsplit-cmp, .cs-content-wrapper, .image-frame img
 * Also handles 2-column layout: .column-control-cmp.column-count-2
 */
export default function parse(element, { document }) {
  const cells = [];

  // Check if this is a content-split (70/30) layout
  const contentWrapper = element.querySelector('.cs-content-wrapper, .content-inner');
  const imageFrame = element.querySelector('.image-frame img, .image-wrapper img, .image img');

  if (contentWrapper || imageFrame) {
    const textCol = [];
    const contentEl = contentWrapper || element;
    const heading = contentEl.querySelector('h2, h3');
    const paragraphs = contentEl.querySelectorAll('p.text p, .classic p, .rte-textImage-cmp p');

    if (heading) textCol.push(heading);
    paragraphs.forEach((p) => {
      if (p.textContent.trim()) textCol.push(p);
    });

    const imgCol = [];
    if (imageFrame) imgCol.push(imgToLink(imageFrame, document));

    if (textCol.length > 0 || imgCol.length > 0) {
      cells.push([textCol.length > 0 ? textCol : '', imgCol.length > 0 ? imgCol : '']);
    }
  } else {
    // Two-column equal layout (e.g., System Verification / Trellix Embedded Control)
    const columns = element.querySelectorAll('.colctrl-column, .col-md-6');
    if (columns.length >= 2) {
      const row = [];
      columns.forEach((col) => {
        const colContent = [];
        const h = col.querySelector('h4, h3, h2');
        const p = col.querySelector('p');
        if (h) colContent.push(h);
        if (p) colContent.push(p);
        row.push(colContent.length > 0 ? colContent : '');
      });
      cells.push(row);
    }
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-content-split', cells });
  element.replaceWith(block);
}
