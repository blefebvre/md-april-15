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
  }
}
