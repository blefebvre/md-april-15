/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion.
 * Base: accordion. Source: usa.canon.com product pages.
 * Extracts collapsible/expandable sections into an accordion block.
 * DOM selectors from captured page: [data-role="collapsible"]
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find accordion items - each has a trigger (heading/button) and content panel
  const triggers = element.querySelectorAll('[data-role="trigger"], [role="tab"], button[aria-expanded]');

  if (triggers.length > 0) {
    triggers.forEach((trigger) => {
      const heading = trigger.querySelector('h2, h3, h4, span') || trigger;
      const title = heading.textContent.trim();

      // Find the associated content panel
      const content = trigger.nextElementSibling
        || element.querySelector('[data-role="content"]')
        || element.querySelector('[role="tabpanel"]');

      const titleEl = document.createElement('p');
      titleEl.textContent = title;

      if (content) {
        const contentClone = content.cloneNode(true);
        cells.push([titleEl, contentClone]);
      } else {
        cells.push([titleEl]);
      }
    });
  } else {
    // Fallback: treat the element heading + content as a single item
    const heading = element.querySelector('h2, h3, h4');
    const content = element.querySelector('[data-role="content"], .content, [role="tabpanel"]');

    const titleEl = document.createElement('p');
    titleEl.textContent = heading ? heading.textContent.trim() : 'Accordion Item';

    if (content) {
      cells.push([titleEl, content.cloneNode(true)]);
    } else {
      cells.push([titleEl]);
    }
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });
  element.replaceWith(block);
}
