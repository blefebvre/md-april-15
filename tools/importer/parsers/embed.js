/* eslint-disable */
/* global WebImporter */

/**
 * Parser for embed (video).
 * Base: embed. Source: usa.canon.com product pages.
 * Extracts video URL from video containers in the overview section.
 * DOM selectors from captured page: [data-content-type="video"], .video-container
 */
export default function parse(element, { document }) {
  // Try to find video source URL from various patterns
  const iframe = element.querySelector('iframe[src]');
  const videoEl = element.querySelector('video source[src], video[src]');
  const dataUrl = element.getAttribute('data-video-url') || element.querySelector('[data-video-url]')?.getAttribute('data-video-url');
  const href = element.querySelector('a[href*="youtube"], a[href*="youtu.be"], a[href*="vimeo"]');

  let videoUrl = null;
  if (iframe) {
    videoUrl = iframe.getAttribute('src');
  } else if (videoEl) {
    videoUrl = videoEl.getAttribute('src');
  } else if (dataUrl) {
    videoUrl = dataUrl;
  } else if (href) {
    videoUrl = href.getAttribute('href');
  }

  const cells = [];
  if (videoUrl) {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.textContent = videoUrl;
    cells.push([link]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'embed', cells });
  element.replaceWith(block);
}
