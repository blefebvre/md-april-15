/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns.
 * Base: columns. Source: usa.canon.com product pages.
 * Extracts side-by-side image + text feature pairs into columns block.
 * DOM selectors from captured page: .feature-columns, .two-column
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find column children - typically two divs side by side
  const columnChildren = element.querySelectorAll(':scope > div, :scope > section');

  if (columnChildren.length >= 2) {
    // Build a single row with each column child as a cell
    const row = [];
    columnChildren.forEach((col) => {
      const cellContent = document.createElement('div');
      // Copy images, headings, and text
      const img = col.querySelector('img');
      const heading = col.querySelector('h2, h3, h4');
      const desc = col.querySelector('p');

      if (img) cellContent.appendChild(img.cloneNode(true));
      if (heading) cellContent.appendChild(heading.cloneNode(true));
      if (desc) cellContent.appendChild(desc.cloneNode(true));

      row.push(cellContent);
    });
    cells.push(row);
  } else {
    // Fallback: treat entire element content as a single-column
    const img = element.querySelector('img');
    const heading = element.querySelector('h2, h3, h4');
    const desc = element.querySelector('p');
    const col1 = document.createElement('div');
    if (img) col1.appendChild(img.cloneNode(true));
    const col2 = document.createElement('div');
    if (heading) col2.appendChild(heading.cloneNode(true));
    if (desc) col2.appendChild(desc.cloneNode(true));
    cells.push([col1, col2]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
