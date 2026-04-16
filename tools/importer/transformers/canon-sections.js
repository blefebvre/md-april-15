/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Canon USA sections.
 * Adds section breaks (<hr>) between sections defined in page-templates.json.
 * Selectors from captured DOM of usa.canon.com product pages.
 * Runs in afterTransform only.
 */
const H = { after: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === H.after) {
    const { template } = payload || {};
    if (!template || !template.sections || template.sections.length < 2) return;

    const { document } = element.ownerDocument ? { document: element.ownerDocument } : { document };

    // Process sections in reverse order to avoid shifting indices
    const sections = [...template.sections].reverse();

    sections.forEach((section) => {
      // Find the section element using the selector(s)
      const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
      let sectionEl = null;
      for (const sel of selectors) {
        sectionEl = element.querySelector(sel);
        if (sectionEl) break;
      }

      if (!sectionEl) return;

      // Add section-metadata block if section has a style
      if (section.style) {
        const metaBlock = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        sectionEl.after(metaBlock);
      }

      // Add <hr> before this section (but not before the first section)
      if (section.id !== template.sections[0].id) {
        const hr = document.createElement('hr');
        sectionEl.before(hr);
      }
    });
  }
}
