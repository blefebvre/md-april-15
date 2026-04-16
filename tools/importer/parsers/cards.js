/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards.
 * Base: cards. Source: usa.canon.com product pages.
 * Extracts image gallery items (sample images) into a cards block.
 * DOM selectors from captured page: .gallery-placeholder, .sample-images
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find all image items in the gallery
  const images = element.querySelectorAll('img');
  const buttons = element.querySelectorAll('button[data-gallery-role], a[data-gallery-role]');

  // If we have button-wrapped images (clickable gallery)
  if (buttons.length > 0) {
    buttons.forEach((btn) => {
      const img = btn.querySelector('img');
      if (img) {
        const cardCell = [img];
        const caption = img.getAttribute('alt') || '';
        if (caption) {
          const p = document.createElement('p');
          p.textContent = caption;
          cardCell.push(p);
        }
        cells.push(cardCell);
      }
    });
  } else if (images.length > 0) {
    // Fallback: direct images
    images.forEach((img) => {
      const cardCell = [img];
      const caption = img.getAttribute('alt') || '';
      if (caption) {
        const p = document.createElement('p');
        p.textContent = caption;
        cardCell.push(p);
      }
      cells.push(cardCell);
    });
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  element.replaceWith(block);
}
