/* eslint-disable */

/**
 * Shared utilities for Canon import parsers and transformers.
 *
 * Scene7 Image Strategy:
 * DA editor corrupts external https:// URLs (strips protocol, adds curly quotes).
 * Instead, we store Scene7 images as relative-path links:
 *   <a href="/scene7/canon/{image-name}">{alt text}</a>
 * The autoblock in scripts.js resolves these back to full Scene7 URLs at render time.
 */

/** Scene7 URL pattern */
export const SCENE7_PATTERN = /scene7\.com\/is\/image\//;

/** Prefix used for Scene7 marker paths in DA content */
export const SCENE7_PREFIX = '/scene7/';

/**
 * Extracts the Scene7 image path from a full URL.
 * e.g. "https://s7d1.scene7.com/is/image/canon/Hero_image" → "canon/Hero_image"
 */
function extractScene7Path(src) {
  const match = src.match(/scene7\.com\/is\/image\/(.+)/);
  if (!match) return null;
  // Strip query params and image presets
  return match[1].split('?')[0].split(':')[0];
}

/**
 * Converts a Scene7 <img> to a DA-safe <a> link using a relative marker path.
 * DA won't corrupt relative paths like /scene7/canon/image-name.
 *
 * @param {Element} img - The img element to convert
 * @param {Document} document - The document object
 * @returns {Element} An <a> with /scene7/ href if Scene7, or the original img
 */
export function scene7ImgToLink(img, document) {
  const src = img.src || img.getAttribute('src') || '';
  if (SCENE7_PATTERN.test(src)) {
    const path = extractScene7Path(src);
    if (path) {
      const a = document.createElement('a');
      a.href = `${SCENE7_PREFIX}${path}`;
      a.textContent = img.alt || path;
      return a;
    }
  }
  return img;
}

/**
 * Converts ALL Scene7 <img> elements within a container to DA-safe links.
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
