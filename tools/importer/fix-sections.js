#!/usr/bin/env node
/**
 * Post-process imported Canon security pillar pages.
 * Splits content into proper EDS sections with section-metadata.
 *
 * Handles:
 * - Callout text (bold "5 Pillars" paragraph) → light-grey section
 * - "How Canon Can Help" / dark background sections → dark section
 * - "Let's talk" / CTA sections → light-grey section
 * - Missing Scene7 images → converts remaining <img> with canon-image-default to /scene7/ links
 * - Removes empty divs
 */
import { readFileSync, writeFileSync } from 'fs';
import { JSDOM } from 'jsdom';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node fix-sections.js <file1.plain.html> [file2.plain.html ...]');
  process.exit(1);
}

function createSectionMeta(doc, style) {
  const meta = doc.createElement('div');
  meta.className = 'section-metadata';
  meta.innerHTML = `<div><div>style</div><div>${style}</div></div>`;
  return meta;
}

function splitAtElement(el, parentDiv) {
  // Splits parentDiv at el: everything from el onward goes into a new div
  const newDiv = el.ownerDocument.createElement('div');
  let node = el;
  while (node) {
    const next = node.nextSibling;
    newDiv.appendChild(node);
    node = next;
  }
  parentDiv.after(newDiv);
  return newDiv;
}

files.forEach((file) => {
  const html = readFileSync(file, 'utf-8');
  const dom = new JSDOM(`<body>${html}</body>`);
  const doc = dom.window.document;
  const body = doc.body;

  // Remove ALL existing section-metadata
  body.querySelectorAll('.section-metadata').forEach((sm) => sm.remove());

  // Remove empty top-level divs
  [...body.children].forEach((child) => {
    if (child.tagName === 'DIV' && !child.innerHTML.trim()) child.remove();
  });

  // Find the big content div
  const contentDiv = body.querySelector('div:not(:empty)');
  if (!contentDiv) {
    console.log(`${file}: no content div found, skipping`);
    return;
  }

  let changes = [];

  // 1. Split at callout paragraph ("5 Pillars of Security presents...")
  let calloutP = null;
  contentDiv.querySelectorAll(':scope > p').forEach((p) => {
    if (!calloutP && p.querySelector('strong') && (p.textContent || '').includes('5 Pillar')) {
      calloutP = p;
    }
  });

  if (calloutP) {
    const calloutSection = splitAtElement(calloutP, contentDiv);

    // Find where the callout text ends (next heading or block starts the body)
    const firstHeadingAfter = calloutSection.querySelector('h2, h3, h4, [class*="columns"], [class*="accordion"]');
    if (firstHeadingAfter) {
      // Split body content from callout
      splitAtElement(firstHeadingAfter, calloutSection);
    }

    // Add light-grey to the callout section
    calloutSection.appendChild(createSectionMeta(doc, 'light-grey'));
    changes.push('callout→light-grey');
  }

  // 2. Find "How Canon Can Help" heading and split it into its own dark section
  body.querySelectorAll('h2').forEach((h2) => {
    const text = h2.textContent || '';
    if (text.includes('How Canon Can Help')) {
      const parent = h2.parentElement;
      if (parent && parent.tagName === 'DIV') {
        // Split at this h2: create a new section for "How Canon Can Help"
        const darkSection = doc.createElement('div');

        // Move the h2 and following content until next h2/h3/block into darkSection
        let node = h2;
        while (node) {
          const next = node.nextSibling;
          const isNextSection = node !== h2 && node.nodeType === 1 && (
            node.matches('h2, h3') ||
            node.classList?.contains('accordion-resources') ||
            node.classList?.contains('section-metadata')
          );
          if (isNextSection) break;
          darkSection.appendChild(node);
          node = next;
        }

        darkSection.appendChild(createSectionMeta(doc, 'dark'));
        // Insert the dark section in place
        if (node) {
          node.before(darkSection);
        } else {
          parent.appendChild(darkSection);
        }
        // Now split the dark section out of its parent to be a top-level div
        parent.after(darkSection);
        // Move remaining content after darkSection back
        if (node) {
          const remainDiv = doc.createElement('div');
          while (node) {
            const next = node.nextSibling;
            remainDiv.appendChild(node);
            node = next;
          }
          if (remainDiv.childNodes.length > 0) darkSection.after(remainDiv);
        }
        changes.push('canon-help→dark');
      }
    }
  });

  // 3. Find "Let's talk" / CTA heading and split it into its own section
  body.querySelectorAll('h3, h2').forEach((h) => {
    const text = h.textContent || '';
    if (text.includes("step up your security") || text.includes("Let's talk")) {
      const parent = h.parentElement;
      if (parent && parent.tagName === 'DIV' && !h.closest('.section-metadata')) {
        // Split: move the CTA heading + next link/paragraph into its own section
        const ctaSection = doc.createElement('div');
        let node = h;
        while (node) {
          const next = node.nextSibling;
          // Stop at disclaimer paragraph or tracking images or section-metadata
          const isEnd = node !== h && node.nodeType === 1 && (
            node.matches('.section-metadata, .accordion-resources, .cards-bumper') ||
            (node.tagName === 'P' && (node.textContent || '').includes('Many variables can impact'))
          );
          if (isEnd) break;
          ctaSection.appendChild(node);
          node = next;
        }
        ctaSection.appendChild(createSectionMeta(doc, 'light-grey'));

        // Insert CTA section, move remaining content after it
        if (node) {
          const remainDiv = doc.createElement('div');
          while (node) {
            const next = node.nextSibling;
            remainDiv.appendChild(node);
            node = next;
          }
          parent.after(remainDiv);
        }
        parent.after(ctaSection);
        changes.push('cta→light-grey');
      }
    }
  });

  // 4. Fix remaining Canon default placeholder images
  // Some images point to canon-image-default.webp (lazy-load placeholder)
  // These should have been Scene7 images but weren't loaded due to bot protection
  body.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (src.includes('canon-image-default')) {
      // Remove the placeholder image (it's broken anyway)
      const wrapper = img.closest('p') || img.parentElement;
      if (wrapper) wrapper.remove();
      changes.push('removed-placeholder-img');
    }
  });

  // 5. Remove empty top-level divs (cleanup after splits)
  [...body.children].forEach((child) => {
    if (child.tagName === 'DIV' && !child.innerHTML.trim()) child.remove();
  });

  // Write back
  const output = [...body.children].map((c) => c.outerHTML).join('\n');
  writeFileSync(file, output);

  const divCount = [...body.children].length;
  console.log(`${file}: ${divCount} sections [${changes.join(', ')}]`);
});
