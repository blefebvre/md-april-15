/* eslint-disable */
/* global WebImporter */
import { scene7ImgToLink } from '../utils.js';

/**
 * Parser: cards-social
 * Converts Canon social media platform cards into a Cards block.
 * Each card has: icon image + h3 heading + description + link
 * Selector: .content-div (container with .filter-div children)
 */
export default function parse(element, { document }) {
  const cardDivs = element.querySelectorAll('.filter-div');
  const cells = [];

  cardDivs.forEach((card) => {
    const img = card.querySelector('img');
    const h3 = card.querySelector('h3');
    const desc = card.querySelector('.title-description, [class*="description"]');
    const link = card.querySelector('a[href]');

    const imgCell = img ? scene7ImgToLink(img, document) : '';
    const textCell = [];

    if (h3) textCell.push(h3);
    if (desc) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.trim();
      textCell.push(p);
    }
    if (link) {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.textContent.trim();
      const p = document.createElement('p');
      p.appendChild(a);
      textCell.push(p);
    }

    if (textCell.length > 0) {
      cells.push([imgCell, textCell]);
    }
  });

  if (cells.length > 0) {
    const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
    element.replaceWith(block);
  }
}
