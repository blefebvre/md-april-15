#!/usr/bin/env node
/**
 * Post-process imported Canon security pillar pages.
 * Splits the single big content div into proper EDS sections.
 */
import { readFileSync, writeFileSync } from 'fs';
import { JSDOM } from 'jsdom';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node fix-sections.js <file1.plain.html> [file2.plain.html ...]');
  process.exit(1);
}

files.forEach((file) => {
  const html = readFileSync(file, 'utf-8');
  const dom = new JSDOM(`<body>${html}</body>`);
  const doc = dom.window.document;
  const body = doc.body;

  // Find the big content div (the one with hero-security, tabs, etc.)
  const contentDiv = body.querySelector('div:not(:empty)');
  if (!contentDiv) return;

  // Find the callout paragraph
  let calloutP = null;
  contentDiv.querySelectorAll('p').forEach((p) => {
    if (!calloutP && p.querySelector('strong') && (p.textContent || '').includes('5 Pillar')) {
      calloutP = p;
    }
  });

  // Remove ALL existing section-metadata (transformer creates them in wrong places)
  body.querySelectorAll('.section-metadata').forEach((sm) => sm.remove());

  if (!calloutP) {
    console.log(`${file}: no callout found, skipping section split`);
    return;
  }

  // Collect everything after the callout
  const afterCallout = [];
  let next = calloutP.nextSibling;
  while (next) {
    afterCallout.push(next);
    next = next.nextSibling;
  }

  // Remove callout and after-content from the big div
  calloutP.remove();
  afterCallout.forEach((n) => n.remove());

  // Create callout section with light-grey
  const calloutDiv = doc.createElement('div');
  calloutDiv.appendChild(calloutP);
  const metaDiv = doc.createElement('div');
  metaDiv.className = 'section-metadata';
  metaDiv.innerHTML = '<div><div>style</div><div>light-grey</div></div>';
  calloutDiv.appendChild(metaDiv);

  // Create body section with remaining content
  const bodyDiv = doc.createElement('div');
  afterCallout.forEach((n) => bodyDiv.appendChild(n));

  // Remove any section-metadata that ended up in the body section
  bodyDiv.querySelectorAll('.section-metadata').forEach((sm) => sm.remove());

  // Insert after the content div: [contentDiv] [calloutDiv] [bodyDiv]
  contentDiv.after(bodyDiv);
  contentDiv.after(calloutDiv);

  // Write back - extract just the inner divs
  const output = [...body.children].map((c) => c.outerHTML).join('\n');
  writeFileSync(file, output);
  
  const divCount = [...body.children].length;
  console.log(`${file}: split into ${divCount} sections, callout with light-grey`);
});
