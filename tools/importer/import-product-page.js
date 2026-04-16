/* eslint-disable */
/* global WebImporter */

/**
 * Canon Product Page Import Script
 * Transforms Canon PDP into EDS format with section-based tabs.
 */

const DM_PATTERN = /^https?:\/\/s7[a-z0-9]*\.scene7\.com\/is\/image\//;

/**
 * Convert a Scene7 image URL into an <a> link (for DM autoblock on client).
 */
function dmLink(document, src, alt) {
  if (!src) return null;
  const a = document.createElement('a');
  a.href = src.split('?')[0]; // strip query params
  a.textContent = alt || '';
  return a;
}

/**
 * Get the real image src from an img element (handles data-src lazy loading).
 */
function imgSrc(img) {
  const dataSrc = img.getAttribute('data-src');
  const src = dataSrc || img.getAttribute('src') || '';
  return src.includes('canon-image-default') ? dataSrc || '' : src;
}

/**
 * Extract Overview tab content — the richest section with features, videos, columns.
 */
function buildOverviewSection(document, descEl) {
  const frag = document.createDocumentFragment();
  const h2 = document.createElement('h2');
  h2.textContent = 'Overview';
  frag.append(h2);

  // The overview content lives inside: #description .xf-web-container .aem-magento-container .root.responsivegrid .aem-Grid .column-control
  const colCtrl = descEl.querySelector('.column-control');
  if (!colCtrl) {
    // Fallback: just grab all text content
    const p = document.createElement('p');
    p.textContent = descEl.textContent.trim().substring(0, 500);
    frag.append(p);
    return frag;
  }

  const rows = colCtrl.querySelectorAll(':scope > .row');
  rows.forEach((row) => {
    const cols = row.querySelectorAll(':scope > [class*="col-"]');
    const headings = row.querySelectorAll('h2, h3, h4');
    const paragraphs = row.querySelectorAll('p');
    const images = row.querySelectorAll('img[src]');
    const videos = row.querySelectorAll('iframe[src*="youtube"], [data-video-url]');

    // Skip rows with no meaningful content
    if (row.textContent.trim().length < 10 && images.length === 0 && videos.length === 0) return;

    // Video rows — create embed block
    videos.forEach((video) => {
      const src = video.getAttribute('src') || video.getAttribute('data-video-url') || '';
      if (src.includes('youtube')) {
        const embedBlock = WebImporter.Blocks.createBlock(document, {
          name: 'embed',
          cells: [[(() => { const a = document.createElement('a'); a.href = src; a.textContent = src; return a; })()]],
        });
        frag.append(embedBlock);
      }
    });

    // Sample images gallery (3 images in a row)
    if (images.length >= 3 && headings.length === 0 && cols.length === 1) {
      const heading = document.createElement('h2');
      const prevRow = row.previousElementSibling;
      const prevH2 = prevRow?.querySelector('h2');
      if (prevH2) {
        heading.textContent = prevH2.textContent.trim();
        frag.append(heading);
      }
      const cells = [];
      images.forEach((img) => {
        const src = imgSrc(img);
        if (src && DM_PATTERN.test(src)) {
          const link = dmLink(document, src, img.alt);
          if (link) cells.push([link]);
        }
      });
      if (cells.length > 0) {
        const cardsBlock = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
        frag.append(cardsBlock);
      }
      return;
    }

    // Two-column feature rows (image + text side by side)
    if (cols.length === 2) {
      const cells = [];
      const colPairs = [];
      for (let i = 0; i < cols.length; i++) {
        const col = cols[i];
        const colHeadings = col.querySelectorAll('h3, h4');
        const colParas = col.querySelectorAll('p');
        const colImgs = col.querySelectorAll('img[src]');

        const hasText = colHeadings.length > 0 || (colParas.length > 0 && col.textContent.trim().length > 30);
        const hasImg = colImgs.length > 0;

        if (hasImg && hasText) {
          // Single col with both image and text (icon + description pattern)
          const cell = document.createElement('div');
          colImgs.forEach((img) => {
            const src = imgSrc(img);
            if (src && DM_PATTERN.test(src)) {
              const p = document.createElement('p');
              p.append(dmLink(document, src, img.alt));
              cell.append(p);
            }
          });
          colHeadings.forEach((h) => {
            const el = document.createElement(h.tagName.toLowerCase());
            el.textContent = h.textContent.trim();
            cell.append(el);
          });
          colParas.forEach((p) => {
            if (p.textContent.trim().length > 10) {
              const newP = document.createElement('p');
              newP.textContent = p.textContent.trim();
              cell.append(newP);
            }
          });
          colPairs.push(cell);
        } else if (hasImg) {
          // Image-only column
          const cell = document.createElement('div');
          const img = colImgs[0];
          const src = imgSrc(img);
          if (src && DM_PATTERN.test(src)) {
            cell.append(dmLink(document, src, img.alt));
          }
          colPairs.push(cell);
        } else if (hasText) {
          // Text-only column
          const cell = document.createElement('div');
          colHeadings.forEach((h) => {
            const el = document.createElement(h.tagName.toLowerCase());
            el.textContent = h.textContent.trim();
            cell.append(el);
          });
          colParas.forEach((p) => {
            if (p.textContent.trim().length > 10) {
              const newP = document.createElement('p');
              newP.textContent = p.textContent.trim();
              cell.append(newP);
            }
          });
          colPairs.push(cell);
        }
      }
      if (colPairs.length >= 2) {
        cells.push(colPairs);
        const colBlock = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
        frag.append(colBlock);
      }
      return;
    }

    // Single-column content rows (heading + text + image = columns block)
    if (cols.length <= 1) {
      const rowHeadings = Array.from(headings);
      const rowImages = Array.from(images).filter((img) => {
        const src = imgSrc(img);
        return src && DM_PATTERN.test(src);
      });

      // H2 headings that precede content sections
      const h2s = rowHeadings.filter((h) => h.tagName === 'H2');
      if (h2s.length > 0 && rowHeadings.length === h2s.length && rowImages.length === 0) {
        h2s.forEach((h) => {
          const el = document.createElement('h2');
          el.textContent = h.textContent.trim();
          frag.append(el);
        });
        return;
      }

      // Feature pattern: h3/h4 + paragraph + image -> columns block
      const featureHeadings = rowHeadings.filter((h) => h.tagName === 'H3' || h.tagName === 'H4');
      if (featureHeadings.length > 0 && rowImages.length > 0) {
        // Group features: each heading + its following paragraphs + the next image
        let currentFeatureIdx = 0;
        featureHeadings.forEach((fh, idx) => {
          const textDiv = document.createElement('div');
          const hEl = document.createElement(fh.tagName.toLowerCase());
          hEl.textContent = fh.textContent.trim();
          textDiv.append(hEl);

          // Get paragraphs between this heading and next heading (or end)
          let sibling = fh.nextElementSibling;
          while (sibling && !['H2', 'H3', 'H4'].includes(sibling.tagName)) {
            if (sibling.tagName === 'P' && sibling.textContent.trim().length > 10) {
              const pEl = document.createElement('p');
              pEl.textContent = sibling.textContent.trim();
              textDiv.append(pEl);
            }
            sibling = sibling.nextElementSibling;
          }

          // Pair with image
          const img = rowImages[currentFeatureIdx] || rowImages[rowImages.length - 1];
          if (img) {
            const src = imgSrc(img);
            const imgDiv = document.createElement('div');
            imgDiv.append(dmLink(document, src, img.alt));

            // Alternate image position
            const cells = idx % 2 === 0
              ? [[textDiv, imgDiv]]
              : [[imgDiv, textDiv]];
            const colBlock = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
            frag.append(colBlock);
            currentFeatureIdx++;
          } else {
            // No image, just default content
            frag.append(textDiv);
          }
        });
        return;
      }

      // Plain content (just headings and text, no images)
      if (featureHeadings.length > 0) {
        featureHeadings.forEach((h) => {
          const el = document.createElement(h.tagName.toLowerCase());
          el.textContent = h.textContent.trim();
          frag.append(el);
        });
        paragraphs.forEach((p) => {
          if (p.textContent.trim().length > 20) {
            const newP = document.createElement('p');
            newP.textContent = p.textContent.trim();
            frag.append(newP);
          }
        });
      }
    }
  });

  // Accordion for firmware
  const disclaimerSection = descEl.querySelector('.wrap-disclaimer, #description-disclaimer');
  const accordion = descEl.querySelector('[data-role="collapsible"], .cms-accordion');
  if (accordion) {
    const title = accordion.querySelector('h3, [data-role="trigger"]');
    const content = accordion.querySelector('[data-role="content"], .content');
    if (title && content) {
      const cells = [[
        (() => { const p = document.createElement('p'); p.textContent = title.textContent.trim(); return p; })(),
        content.cloneNode(true),
      ]];
      const accBlock = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });
      frag.append(accBlock);
    }
  }

  return frag;
}

/**
 * Build a tab section with section-metadata.
 */
function createTabSection(document, title, content) {
  const section = document.createElement('div');
  section.append(content);

  // Add section-metadata block
  const metaBlock = WebImporter.Blocks.createBlock(document, {
    name: 'Section Metadata',
    cells: [
      ['style', 'tab'],
      ['tab-title', title],
    ],
  });
  section.append(metaBlock);
  return section;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // Clean up non-content elements
    const removeSels = [
      'header', 'footer', '[role="banner"]', '[role="contentinfo"]',
      'nav', '.breadcrumbs', '.tabsContainer', '#pdp-discontinued',
      '.page-anchors-top', '.ambanners', '#upsell-modal-component',
      '.amsearch-overlay-block', 'script', 'noscript', 'style', 'link',
      'input[type="hidden"]', '.modal-popup',
    ];
    WebImporter.DOMUtils.remove(main, removeSels);

    const result = document.createElement('div');

    // 1. Product Details placeholder
    const productInfo = main.querySelector('.wrap-media-product-info');
    if (productInfo) {
      const pdBlock = WebImporter.Blocks.createBlock(document, { name: 'product-details', cells: [] });
      result.append(pdBlock);
    }

    // Add section break before tabs
    result.append(document.createElement('hr'));

    // 2. Overview tab
    const descSection = main.querySelector('#pdp-description, .pdp-akeneo-description');
    if (descSection) {
      const overviewContent = buildOverviewSection(document, descSection);
      const overviewSection = createTabSection(document, 'Overview', overviewContent);
      result.append(overviewSection);
      result.append(document.createElement('hr'));
    }

    // 3. Specifications tab
    const specsSection = main.querySelector('#pdp-tech-spec-data');
    if (specsSection) {
      const specsFrag = document.createDocumentFragment();
      const h2 = document.createElement('h2');
      h2.textContent = 'Specifications';
      specsFrag.append(h2);
      const p = document.createElement('p');
      p.textContent = 'For full technical specifications, please visit the Canon USA product page.';
      specsFrag.append(p);
      const specSection = createTabSection(document, 'Specifications', specsFrag);
      result.append(specSection);
      result.append(document.createElement('hr'));
    }

    // 4. Compatibility tab
    const accSection = main.querySelector('#pdp-accessories');
    if (accSection) {
      const compFrag = document.createDocumentFragment();
      const h2 = document.createElement('h2');
      h2.textContent = 'Compatibility';
      compFrag.append(h2);
      const links = accSection.querySelectorAll('a.product-item-link');
      if (links.length > 0) {
        const h3 = document.createElement('h3');
        h3.textContent = 'Compatible Accessories';
        compFrag.append(h3);
        const ul = document.createElement('ul');
        links.forEach((a) => {
          const li = document.createElement('li');
          const link = document.createElement('a');
          link.href = a.href;
          link.textContent = a.textContent.trim();
          li.append(link);
          ul.append(li);
        });
        compFrag.append(ul);
      }
      const compTabSection = createTabSection(document, 'Compatibility', compFrag);
      result.append(compTabSection);
      result.append(document.createElement('hr'));
    }

    // 5. Reviews tab
    const reviewsSection = main.querySelector('#pdp-reviews');
    if (reviewsSection) {
      const revFrag = document.createDocumentFragment();
      const h2 = document.createElement('h2');
      h2.textContent = 'Reviews';
      revFrag.append(h2);
      const p = document.createElement('p');
      p.textContent = 'How is your Canon product performing for you?';
      revFrag.append(p);
      const revTabSection = createTabSection(document, 'Reviews', revFrag);
      result.append(revTabSection);
      result.append(document.createElement('hr'));
    }

    // 6. Resources tab
    const resSection = main.querySelector('#pdp-resources');
    if (resSection) {
      const resFrag = document.createDocumentFragment();
      const h2 = document.createElement('h2');
      h2.textContent = 'Resources';
      resFrag.append(h2);
      const reTabSection = createTabSection(document, 'Resources', resFrag);
      result.append(reTabSection);
      result.append(document.createElement('hr'));
    }

    // 7. Support tab
    const supSection = main.querySelector('#pdp-support');
    if (supSection) {
      const supFrag = document.createDocumentFragment();
      const h2 = document.createElement('h2');
      h2.textContent = 'Support';
      supFrag.append(h2);
      const supLinks = supSection.querySelectorAll('a[href]');
      if (supLinks.length > 0) {
        const ul = document.createElement('ul');
        const seen = new Set();
        supLinks.forEach((a) => {
          const text = a.textContent.trim();
          if (text && !seen.has(text) && text.length > 3) {
            seen.add(text);
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = a.href;
            link.textContent = text;
            li.append(link);
            ul.append(li);
          }
        });
        supFrag.append(ul);
      }
      const supTabSection = createTabSection(document, 'Support', supFrag);
      result.append(supTabSection);
    }

    // 8. Disclaimer (outside tabs)
    result.append(document.createElement('hr'));
    const disclaimer = main.querySelector('#description-disclaimer, .wrap-disclaimer');
    if (disclaimer) {
      const listItems = disclaimer.querySelectorAll('li');
      if (listItems.length > 0) {
        const h3 = document.createElement('h3');
        h3.textContent = 'Product Disclaimer';
        result.append(h3);
        const ol = document.createElement('ol');
        listItems.forEach((li) => {
          const newLi = document.createElement('li');
          newLi.textContent = li.textContent.trim();
          ol.append(newLi);
        });
        result.append(ol);
      }
    }

    // 9. Metadata
    result.append(document.createElement('hr'));
    const title = document.querySelector('title')?.textContent?.trim()?.replace(' | Canon U.S.A.', '') || '';
    const desc = document.querySelector('meta[name="description"]')?.content || '';
    const ogImage = document.querySelector('meta[property="og:image"]')?.content || '';

    WebImporter.rules.createMetadata(result, document);

    // Generate path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    // Replace main content
    main.innerHTML = '';
    main.append(result);

    return [{
      element: main,
      path,
      report: { title, template: 'product-page' },
    }];
  },
};
