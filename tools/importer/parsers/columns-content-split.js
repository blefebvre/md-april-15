/* eslint-disable */
/* global WebImporter */

/**
 * Parser: columns-content-split
 * Base block: columns
 * Source: https://www.usa.canon.com/business/it-and-security/five-pillars-of-security/device-security
 * Structure: 1 row with 2 columns. Col1 = text content, Col2 = image
 * Selectors from captured DOM: .contentsplit-cmp, .cs-content-wrapper, .image-frame img
 * Also handles 2-column layout: .column-control-cmp.column-count-2
 */
export default function parse(element, { document }) {
  const cells = [];

  // Check if this is a content-split (70/30) layout
  const contentWrapper = element.querySelector('.cs-content-wrapper, .content-inner');
  const imageFrame = element.querySelector('.image-frame img, .image-wrapper img, .image img');

  if (contentWrapper || imageFrame) {
    // Content split: text column + image column
    const textCol = [];
    const contentEl = contentWrapper || element;
    const heading = contentEl.querySelector('h2, h3');
    const paragraphs = contentEl.querySelectorAll('p.text p, .classic p, .rte-textImage-cmp p');

    if (heading) textCol.push(heading);
    paragraphs.forEach((p) => {
      if (p.textContent.trim()) textCol.push(p);
    });

    const imgCol = [];
    if (imageFrame) imgCol.push(imageFrame);

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
