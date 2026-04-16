/* eslint-disable */
/* global WebImporter */

/**
 * Parser: accordion-resources
 * Base block: accordion
 * Source: https://www.usa.canon.com/business/it-and-security/five-pillars-of-security/device-security
 * Structure: 2 columns per row. Col1 = accordion title, Col2 = accordion content
 * Selectors from captured DOM: .canon-accordion-container, .accordion-card, .accordion-title,
 *   .downloadable-table-wrapper, .downloadable-asset-title, .btn--download
 */
export default function parse(element, { document }) {
  const cells = [];

  // Extract accordion panels
  const panels = element.querySelectorAll('.accordion-card, .accordionItems > div');

  panels.forEach((panel) => {
    const titleEl = panel.querySelector('.accordion-title, .card-header');
    const title = titleEl ? titleEl.textContent.trim() : '';
    if (!title) return;

    // Build content cell from download table or body content
    const contentCell = [];
    const downloadRows = panel.querySelectorAll('.canon-table-cell.canon-table-regular-cell');

    if (downloadRows.length > 0) {
      // Process download table items
      const items = panel.querySelectorAll('.downloadable-asset-title');
      const links = panel.querySelectorAll('a.btn--download');

      items.forEach((item, idx) => {
        const p = document.createElement('p');
        const itemText = item.textContent.trim();

        if (links[idx]) {
          const a = document.createElement('a');
          a.href = links[idx].href;
          a.textContent = itemText;
          p.appendChild(a);
        } else {
          p.textContent = itemText;
        }
        contentCell.push(p);
      });
    } else {
      // Fallback: use card body content
      const body = panel.querySelector('.card-body, .panel-collapse');
      if (body) contentCell.push(body);
    }

    if (contentCell.length > 0) {
      cells.push([title, contentCell]);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-resources', cells });
  element.replaceWith(block);
}
