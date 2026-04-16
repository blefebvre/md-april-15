/* eslint-disable */
/* global WebImporter */

/**
 * Parser: tabs-pillar-nav
 * Base block: tabs
 * Source: https://www.usa.canon.com/business/it-and-security/five-pillars-of-security/device-security
 * Structure: 2 columns per row. Col1 = tab label, Col2 = tab content (link)
 * Selectors from captured DOM: .category-navbar-list-items, .navlist-item-desktop a
 */
export default function parse(element, { document }) {
  // Extract navigation items from the desktop nav bar
  const navItems = element.querySelectorAll(
    '.category-navbar-list-items .navlist-item-desktop a, .category-navbar-list-mobile .navlist-item-mobile a'
  );

  const cells = [];

  navItems.forEach((link) => {
    const label = link.textContent.trim();
    if (!label) return;

    // Col1: tab label text, Col2: link element
    const linkEl = document.createElement('a');
    linkEl.href = link.href;
    linkEl.textContent = label;
    cells.push([label, linkEl]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-pillar-nav', cells });
  element.replaceWith(block);
}
