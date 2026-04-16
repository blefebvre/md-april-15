/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Canon USA cleanup.
 * Selectors from captured DOM of usa.canon.com product pages.
 */
const H = { before: 'beforeTransform', after: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === H.before) {
    // Remove cookie/consent overlays, modals, and widgets that block parsing
    // Found in DOM: .modal-popup, #onetrust-consent-sdk, .amsearch-overlay-block
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '.modal-popup',
      '.amsearch-overlay-block',
      '[class*="cookie"]',
      '#drift-widget',
      'script',
      'noscript',
    ]);
  }
  if (hookName === H.after) {
    // Remove non-authorable site chrome
    // Found in DOM: banner[aria-label="Site Header"], contentinfo[aria-label="Site Footer"]
    // breadcrumb: ol.items (breadcrumb list under .breadcrumbs)
    // tabs container: .tabsContainer (product tab navigation)
    // discontinued notice: #pdp-discontinued
    // page anchors: .page-anchors-top
    // banner ads: .ambanners
    WebImporter.DOMUtils.remove(element, [
      'header',
      'footer',
      '[role="banner"]',
      '[role="contentinfo"]',
      '.breadcrumbs',
      'nav',
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

    // Fix Scene7 image URLs: add ?fmt=jpg extension so DA can identify them as images
    // Scene7 URLs like s7d1.scene7.com/is/image/canon/... have no file extension
    element.querySelectorAll('img[src*="scene7.com"]').forEach((img) => {
      const src = img.getAttribute('src');
      if (src && !src.includes('fmt=')) {
        img.setAttribute('src', src + '?fmt=jpg');
      }
    });

    // Fix lazy-loaded images: replace placeholder src with data-src
    element.querySelectorAll('img[data-src]').forEach((img) => {
      const dataSrc = img.getAttribute('data-src');
      if (dataSrc) {
        img.setAttribute('src', dataSrc.includes('scene7.com') && !dataSrc.includes('fmt=')
          ? dataSrc + '?fmt=jpg'
          : dataSrc);
      }
    });
  }
}
