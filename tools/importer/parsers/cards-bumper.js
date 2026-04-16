/* eslint-disable */
/* global WebImporter */

/**
 * Parser: cards-bumper
 * Base block: cards
 * Source: https://www.usa.canon.com/business/it-and-security/five-pillars-of-security/device-security
 * Structure: 2 columns per row. Col1 = image (none here), Col2 = heading + description + CTA
 * Since bumper cards have no images, using Cards (no images) pattern: 1 column per row
 * Selectors from captured DOM: .bumper-container, .bumper-item, .bumper-item-header,
 *   .bumper-item-content, .bumper-item-button
 */
export default function parse(element, { document }) {
  const cells = [];

  const items = element.querySelectorAll('.bumper-item');

  items.forEach((item) => {
    const header = item.querySelector('.bumper-item-header');
    const content = item.querySelector('.bumper-item-content');
    const ctaLink = item.querySelector('.bumper-item-button, a');

    const cardContent = [];

    if (header) {
      const h = document.createElement('h3');
      h.textContent = header.textContent.trim();
      cardContent.push(h);
    }

    if (content) {
      const p = document.createElement('p');
      p.textContent = content.textContent.trim();
      cardContent.push(p);
    }

    if (ctaLink) {
      const a = document.createElement('a');
      a.href = ctaLink.href;
      a.textContent = ctaLink.textContent.trim();
      const p = document.createElement('p');
      p.appendChild(a);
      cardContent.push(p);
    }

    if (cardContent.length > 0) {
      cells.push([cardContent]);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-bumper', cells });
  element.replaceWith(block);
}
