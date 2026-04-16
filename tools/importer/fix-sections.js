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

  // 2. Find "How Canon Can Help" heading and make it a dark section
  body.querySelectorAll('h2').forEach((h2) => {
    const text = h2.textContent || '';
    if (text.includes('How Canon Can Help')) {
      const parent = h2.parentElement;
      if (parent && parent.tagName === 'DIV') {
        // Check if there's content after this section to split
        const nextH2 = h2.nextElementSibling;
        // Find the end of this section (next major heading or block)
        let endEl = null;
        let sibling = parent.nextElementSibling;
        // The "How Canon Can Help" section is typically its own div already
        // Just add dark section-metadata
        parent.appendChild(createSectionMeta(doc, 'dark'));
        changes.push('canon-help→dark');
      }
    }
  });

  // 3. Find "Let's talk" / CTA heading and make it a styled section
  body.querySelectorAll('h3, h2').forEach((h) => {
    const text = h.textContent || '';
    if (text.includes("step up your security") || text.includes("Let's talk")) {
      const parent = h.parentElement;
      if (parent && parent.tagName === 'DIV' && !parent.querySelector('.section-metadata')) {
        parent.appendChild(createSectionMeta(doc, 'light-grey'));
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
