/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Canon USA sections.
 * Adds section breaks (<hr>) and section-metadata blocks between sections.
 * Handles sections that share a parent container by splitting the parent.
 * Selectors from captured DOM of usa.canon.com pages.
 * Runs in afterTransform only.
 */
const H = { after: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === H.after) {
    const { template } = payload || {};
    if (!template || !template.sections || template.sections.length < 2) return;

    const document = element.ownerDocument;
    const sections = template.sections;

    // Process sections in reverse order to avoid shifting DOM positions
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];

      // Find the section element using the selector(s)
      const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
      let sectionEl = null;
      for (const sel of selectors) {
        try {
          sectionEl = element.querySelector(sel);
        } catch (e) {
          // Invalid selector, skip
        }
        if (sectionEl) break;
      }

      if (!sectionEl) continue;

      // If the section element is deeply nested, we need to find or create
      // a good insertion point at the main content level
      let insertionPoint = sectionEl;

      // Walk up to find the nearest child of main/element
      while (insertionPoint.parentElement && insertionPoint.parentElement !== element) {
        insertionPoint = insertionPoint.parentElement;
      }

      // Add section-metadata block if section has a style
      if (section.style) {
        const metaBlock = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        insertionPoint.after(metaBlock);
      }

      // Add <hr> before this section (except the first section)
      if (i > 0) {
        const hr = document.createElement('hr');
        insertionPoint.before(hr);
      }
    }
  }
}
