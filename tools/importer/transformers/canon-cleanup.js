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

    // Remove data-tracking attributes
    element.querySelectorAll('[data-track]').forEach((el) => el.removeAttribute('data-track'));
    element.querySelectorAll('[onclick]').forEach((el) => el.removeAttribute('onclick'));
    element.querySelectorAll('[data-cmp-is]').forEach((el) => el.removeAttribute('data-cmp-is'));

    // Convert remaining Scene7/Dynamic Media <img> to <a> links for DA compatibility
    // DA corrupts external image URLs with curly quotes; links are preserved correctly
    const document = element.ownerDocument;
    element.querySelectorAll('img').forEach((img) => {
      const src = img.src || img.getAttribute('src') || '';
      if (src.includes('scene7.com/is/image')) {
        const cleanSrc = src.split('?')[0].split(':')[0];
        const a = document.createElement('a');
        a.href = cleanSrc;
        a.textContent = img.alt || '';
        const wrapper = img.closest('p') || img.parentElement;
        if (wrapper.tagName === 'P') {
          wrapper.textContent = '';
          wrapper.appendChild(a);
        } else {
          img.replaceWith(a);
        }
      }
    });
  }
}
