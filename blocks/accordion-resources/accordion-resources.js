/*
 * Accordion Resources Block
 * Recreate an accordion for resources/downloads
 * https://www.hlx.live/developer/block-collection/accordion
 */

export default function decorate(block) {
  [...block.children].forEach((row) => {
    // decorate accordion item label
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-resources-item-label';
    summary.append(...label.childNodes);
    // decorate accordion item body
    const body = row.children[1];
    body.className = 'accordion-resources-item-body';
    // decorate accordion item
    const details = document.createElement('details');
    details.className = 'accordion-resources-item';
    details.append(summary, body);
    row.replaceWith(details);
  });
}
