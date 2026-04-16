/* eslint-disable */
/* global WebImporter */
import { scene7ImgToLink } from '../utils.js';

/**
 * Parser: columns-content-split
 * Structure: 1 row with 2 columns. Col1 = text, Col2 = image
 * Also handles 2-column equal layout.
 */
export default function parse(element, { document }) {
  const cells = [];

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
    if (imageFrame) imgCol.push(scene7ImgToLink(imageFrame, document));

    if (textCol.length > 0 || imgCol.length > 0) {
      cells.push([textCol.length > 0 ? textCol : '', imgCol.length > 0 ? imgCol : '']);
    }
  } else {
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
