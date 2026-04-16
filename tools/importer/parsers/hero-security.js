/* eslint-disable */
/* global WebImporter */
import { scene7ImgToLink } from '../utils.js';

/**
 * Parser: hero-security
 * Structure: Row 1 = background image, Row 2 = heading (h1)
 */
export default function parse(element, { document }) {
  const bgImage = element.querySelector('.hero-image-desktop img, .classelc img, img[alt]');
  const heading = element.querySelector('.carousel-caption h1, h1');

  const cells = [];
  if (bgImage) cells.push([scene7ImgToLink(bgImage, document)]);
  if (heading) cells.push([heading]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-security', cells });
  element.replaceWith(block);
}
