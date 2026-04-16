/* eslint-disable */
/* global WebImporter */

/**
 * Parser: hero-security
 * Base block: hero
 * Source: https://www.usa.canon.com/business/it-and-security/five-pillars-of-security/device-security
 * Structure: Row 1 = background image (as link for Scene7), Row 2 = heading (h1)
 * Selectors from captured DOM: .hero-carousel, .hero-image-desktop img, .carousel-caption h1
 */
export default function parse(element, { document }) {
  const bgImage = element.querySelector('.hero-image-desktop img, .classelc img, img[alt]');
  const heading = element.querySelector('.carousel-caption h1, h1');

  const cells = [];

  // Row 1: Background image - convert Scene7 img to link for DA compatibility
  if (bgImage) {
    const src = bgImage.src || bgImage.getAttribute('src') || '';
    const alt = bgImage.alt || '';
    if (src.includes('scene7.com')) {
      // Strip query params to get clean Scene7 path
      const cleanSrc = src.split('?')[0].split(':')[0];
      const a = document.createElement('a');
      a.href = cleanSrc;
      a.textContent = alt;
      cells.push([a]);
    } else {
      cells.push([bgImage]);
    }
  }

  // Row 2: Heading content
  if (heading) {
    cells.push([heading]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-security', cells });
  element.replaceWith(block);
}
