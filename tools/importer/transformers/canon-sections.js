/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Canon USA sections.
 * Pattern-based approach: detects section boundaries from DOM patterns
 * common across all Canon security pillar pages.
 * Runs in afterTransform only (after blocks are parsed, before metadata hr).
 */
const H = { after: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === H.after) {
    const doc = element.ownerDocument;

    // Strategy: Detect grey background sections and major content boundaries
    // Canon pillar pages use inline style background-color:#EFF0F3 for grey sections
    // and have distinct content areas separated by column-control divs

    // 1. Find all elements with grey background and add section breaks + metadata
    const greyBgElements = element.querySelectorAll('[style*="background-color:#EFF0F3"], [style*="background-color: #EFF0F3"], [style*="background-color: rgb(239, 240, 243)"]');

    // Process in reverse to avoid DOM shifting
    const greyArray = [...greyBgElements].reverse();
    greyArray.forEach((greyEl) => {
      // Walk up to find the nearest child of main/element
      let insertionPoint = greyEl;
      while (insertionPoint.parentElement && insertionPoint.parentElement !== element) {
        insertionPoint = insertionPoint.parentElement;
      }
      if (insertionPoint === element) return;

      // Add section-metadata for light-grey style
      const metaBlock = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: 'light-grey' },
      });
      insertionPoint.after(metaBlock);

      // Add hr before this section
      const hr = doc.createElement('hr');
      insertionPoint.before(hr);
    });

    // 2. Add section break before the category nav bar (tabs)
    const categoryNav = element.querySelector('.category-nav-bar, .category-navbar-list-container');
    if (categoryNav) {
      let navInsert = categoryNav;
      while (navInsert.parentElement && navInsert.parentElement !== element) {
        navInsert = navInsert.parentElement;
      }
      if (navInsert !== element && !navInsert.previousElementSibling?.matches('hr')) {
        const hr = doc.createElement('hr');
        navInsert.before(hr);
      }
    }

    // 3. Add section break before the contentsplit (intro columns)
    const contentSplits = element.querySelectorAll('.contentsplit, .contentsplit-cmp');
    contentSplits.forEach((cs) => {
      let csInsert = cs;
      while (csInsert.parentElement && csInsert.parentElement !== element) {
        csInsert = csInsert.parentElement;
      }
      if (csInsert !== element && !csInsert.previousElementSibling?.matches('hr')) {
        const hr = doc.createElement('hr');
        csInsert.before(hr);
      }
    });

    // 4. Add section break before CTA sections (e.g. "Let's talk" with contact button)
    const ctaSections = element.querySelectorAll('.cta-section, [class*="cta-banner"]');
    ctaSections.forEach((cta) => {
      let ctaInsert = cta;
      while (ctaInsert.parentElement && ctaInsert.parentElement !== element) {
        ctaInsert = ctaInsert.parentElement;
      }
      if (ctaInsert !== element && !ctaInsert.previousElementSibling?.matches('hr')) {
        const hr = doc.createElement('hr');
        ctaInsert.before(hr);
      }
    });
  }
}
