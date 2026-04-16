/* eslint-disable */

/**
 * Shared utilities for Canon import parsers and transformers.
 */

/**
 * Pattern matching Scene7 / Dynamic Media image URLs.
 */
export const SCENE7_PATTERN = /scene7\.com\/is\/image\//;

/**
 * Converts a Scene7/Dynamic Media <img> element to an <a> link.
 * DA editor corrupts external image URLs with curly quotes,
 * but preserves <a href> links correctly. The autoblock in
 * scripts.js converts these links back to <picture> at render time.
 *
 * @param {Element} img - The img element to convert
 * @param {Document} document - The document object
 * @returns {Element} An <a> element if Scene7, or the original img
 */
export function scene7ImgToLink(img, document) {
  const src = img.src || img.getAttribute('src') || '';
  if (SCENE7_PATTERN.test(src)) {
    // Strip query params and image presets (e.g. :5-1-Large)
    const cleanSrc = src.split('?')[0].split(':')[0];
    const a = document.createElement('a');
    a.href = cleanSrc;
    a.textContent = img.alt || '';
    return a;
  }
  return img;
}

/**
 * Converts ALL Scene7 <img> elements within a container to <a> links.
 * Used by the cleanup transformer to handle images in default content.
 *
 * @param {Element} container - The DOM element to scan
 * @param {Document} document - The document object
 */
export function convertAllScene7Images(container, document) {
  container.querySelectorAll('img').forEach((img) => {
    const src = img.src || img.getAttribute('src') || '';
    if (SCENE7_PATTERN.test(src)) {
      const a = scene7ImgToLink(img, document);
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
