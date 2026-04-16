/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Canon USA cleanup.
 * Selectors from captured DOM of usa.canon.com pages (product + security pillar).
 */
const H = { before: 'beforeTransform', after: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === H.before) {
    // Remove cookie/consent overlays, modals, and widgets that block parsing
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '.modal-popup',
      '.amsearch-overlay-block',
      '[class*="cookie"]',
      '[role="dialog"]',
      '#drift-widget',
      '.acsb-trigger',
      'script',
      'noscript',
    ]);

    // Remove accessibility/skip links and cart from security pillar pages
    // Found in DOM: a[href="#to-main-content"], a[href="#footer"], a[href*="checkout/cart"]
    element.querySelectorAll('a[href="#to-main-content"], a[href="#footer"], a[href*="checkout/cart"], a[href*="website-accessibility"]').forEach((link) => {
      const wrapper = link.closest('p') || link;
      wrapper.remove();
    });

    // Remove "Enable accessibility" link
    element.querySelectorAll('a').forEach((a) => {
      if (a.textContent.trim() === 'Enable accessibility') {
        const wrapper = a.closest('p') || a;
        wrapper.remove();
      }
    });
  }

  if (hookName === H.after) {
    // Remove non-authorable site chrome
    WebImporter.DOMUtils.remove(element, [
      'header',
      'footer',
      '[role="banner"]',
      '[role="contentinfo"]',
      '.breadcrumbs',
      'nav:not(.tabs-pillar-nav-list)',
      'ol.items',
      '.tabsContainer',
      '#pdp-discontinued',
      '.page-anchors-top',
      '.ambanners',
      '#upsell-modal-component',
      'iframe',
      'link',
      'style',
      'input[type="hidden"]',
    ]);

    // Save bumper cards from experience fragments before removing them
    // The bumper (.bumper-container) is inside .xfpage but is authorable content
    const doc = element.ownerDocument;
    const bumper = element.querySelector('.bumper-container, .bumper-gradient');
    if (bumper) {
      // Extract bumper items before xfpage is removed
      const bumperItems = bumper.querySelectorAll('.bumper-item');
      if (bumperItems.length > 0) {
        // Build a cards-bumper block from the bumper items
        const cells = [];
        bumperItems.forEach((item) => {
          const header = item.querySelector('.bumper-item-header');
          const content = item.querySelector('.bumper-item-content');
          const cta = item.querySelector('.bumper-item-button, a');
          const cellContent = [];
          if (header) {
            const h = doc.createElement('h3');
            h.textContent = header.textContent.trim();
            cellContent.push(h);
          }
          if (content) {
            const p = doc.createElement('p');
            p.textContent = content.textContent.trim();
            cellContent.push(p);
          }
          if (cta) {
            const a = doc.createElement('a');
            a.href = cta.href || cta.getAttribute('href') || '';
            a.textContent = cta.textContent.trim();
            const p = doc.createElement('p');
            p.appendChild(a);
            cellContent.push(p);
          }
          if (cellContent.length > 0) cells.push([cellContent]);
        });
        if (cells.length > 0) {
          const bumperBlock = WebImporter.Blocks.createBlock(doc, { name: 'cards-bumper', cells });
          // Insert bumper block at the end of main content (before footer)
          element.appendChild(doc.createElement('hr'));
          element.appendChild(bumperBlock);
        }
      }
    }

    // Remove Canon footer experience fragments
    WebImporter.DOMUtils.remove(element, [
      '.xfpage',
      '.experiencefragment',
      '.cmp-experiencefragment',
    ]);

    // Remove duplicate footer content that may have been captured
    // Canon footer sections have headings like "ABOUT CANON", "MYCANON", etc.
    const footerHeadings = ['ABOUT CANON', 'MYCANON', 'ORDER HELP', 'PRODUCT RESOURCES', 'LEGAL'];
    element.querySelectorAll('h3').forEach((h3) => {
      if (footerHeadings.includes(h3.textContent.trim().toUpperCase())) {
        // Remove the section containing this footer heading
        const section = h3.closest('div');
        if (section) section.remove();
      }
    });

    // Remove data-tracking attributes
    element.querySelectorAll('[data-track]').forEach((el) => el.removeAttribute('data-track'));
    element.querySelectorAll('[onclick]').forEach((el) => el.removeAttribute('onclick'));
    element.querySelectorAll('[data-cmp-is]').forEach((el) => el.removeAttribute('data-cmp-is'));

    // Fix placeholder images: when <a href="/content/dam/..."><img src="canon-image-default.webp">
    // Convert to /dam/ marker path link (DA-safe, resolved by client autoblock)
    element.querySelectorAll('a > img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (src.includes('canon-image-default')) {
        const link = img.closest('a');
        const damHref = link?.getAttribute('href') || '';
        // Strip /content/dam/ prefix, keep rest as /dam/ marker path
        const damPath = damHref.replace(/^\/content\/dam\//, '');
        if (damPath !== damHref) {
          const alt = img.alt || '';
          link.removeAttribute('class');
          link.setAttribute('href', `/dam/${damPath}`);
          link.textContent = alt || damPath.split('/').pop();
          img.remove();
        }
      }
    });

    // Convert remaining Scene7/Dynamic Media <img> to DA-safe <a> links
    // Uses relative /scene7/ marker path that DA won't corrupt
    // The autoblock in scripts.js resolves these to full Scene7 URLs at render time
    const document = element.ownerDocument;
    element.querySelectorAll('img').forEach((img) => {
      const src = img.src || img.getAttribute('src') || '';
      const match = src.match(/scene7\.com\/is\/image\/(.+)/);
      if (match) {
        const path = match[1].split('?')[0].split(':')[0];
        const a = document.createElement('a');
        a.href = `/scene7/${path}`;
        a.textContent = img.alt || path;
        const wrapper = img.closest('p') || img.parentElement;
        if (wrapper && wrapper.tagName === 'P') {
          wrapper.textContent = '';
          wrapper.appendChild(a);
        } else {
          img.replaceWith(a);
        }
      }
    });
  }
}
