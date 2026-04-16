/* eslint-disable */
/* global WebImporter */

/**
 * Parser: hero-security
 * Base block: hero
 * Source: https://www.usa.canon.com/business/it-and-security/five-pillars-of-security/device-security
 * Structure: Row 1 = background image, Row 2 = heading (h1)
 * Selectors from captured DOM: .hero-carousel, .hero-image-desktop img, .carousel-caption h1
 */
export default function parse(element, { document }) {
  // Extract background image from hero carousel
  const bgImage = element.querySelector('.hero-image-desktop img, .classelc img, img[alt]');

  // Extract heading from carousel caption
  const heading = element.querySelector('.carousel-caption h1, h1');

  const cells = [];

  // Row 1: Background image (optional per block library)
  if (bgImage) {
    cells.push([bgImage]);
  }

  // Row 2: Heading content
  const contentCell = [];
  if (heading) {
    contentCell.push(heading);
  }
  if (contentCell.length > 0) {
    cells.push(contentCell);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-security', cells });
  element.replaceWith(block);
}
