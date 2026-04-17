/* eslint-disable */
/* global WebImporter */

/**
 * Canon Product Page Import Script
 * Transforms Canon PDP into EDS format with section-based tabs.
 *
 * DOM structure (usa.canon.com):
 *   #pdp-description > .xf-web-container > .aem-magento-container > .column-control
 *     > div > .column-control-cmp > .container > .row > .col-md-12 > .ccMaxWidth
 *       Components: .title, .contentsplit, .video, .mosaic-gallery, .textimage, .column-control
 *
 *   Images use data-src for Scene7 URLs (src is a placeholder).
 *   Videos use .thumbnail-video <img> with ytimg.com URLs (no iframes).
 */

const SCENE7_RE = /scene7\.com\/is\/image\/(.+)/;
const YTIMG_RE = /ytimg\.com\/vi\/([^/]+)/;
const CANON_HOST = 'https://www.usa.canon.com';

function scene7Link(document, src, alt) {
  if (!src) return null;
  const a = document.createElement('a');
  a.href = src.split('?')[0];
  a.textContent = alt || '';
  return a;
}

function getScene7Src(img) {
  return img.getAttribute('data-src') || img.getAttribute('src') || '';
}

function youtubeEmbed(document, videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const a = document.createElement('a');
  a.href = url;
  a.textContent = url;
  return WebImporter.Blocks.createBlock(document, { name: 'embed', cells: [[a]] });
}

function canonUrl(href) {
  if (!href) return '#';
  if (href.startsWith('http')) return href;
  if (href.startsWith('/')) return CANON_HOST + href;
  if (href === '#') return CANON_HOST + '/#';
  return href;
}

function buildOverviewSection(document, descEl) {
  const frag = document.createDocumentFragment();
  const h2 = document.createElement('h2');
  h2.textContent = 'Overview';
  frag.append(h2);

  const ccMax = descEl.querySelector('.ccMaxWidth');
  if (!ccMax) return frag;

  const children = Array.from(ccMax.children);
  let splitIdx = 0;

  children.forEach((child) => {
    const cls = child.className || '';

    // Title components (H2 headings)
    if (cls.includes('title')) {
      const heading = child.querySelector('h2');
      if (heading && heading.textContent.trim() !== 'Overview') {
        const el = document.createElement('h2');
        el.textContent = heading.textContent.trim();
        frag.append(el);
      }
      return;
    }

    // Contentsplit: image+text feature → columns block
    if (cls.includes('contentsplit')) {
      const img = child.querySelector('img[data-src*="scene7"]');
      const heading = child.querySelector('h3');
      const para = child.querySelector('p');
      const src = img ? getScene7Src(img) : '';

      if (heading && src && SCENE7_RE.test(src)) {
        const textDiv = document.createElement('div');
        const hEl = document.createElement('h3');
        hEl.textContent = heading.textContent.trim();
        textDiv.append(hEl);
        if (para) {
          const pEl = document.createElement('p');
          pEl.textContent = para.textContent.trim();
          textDiv.append(pEl);
        }

        const imgDiv = document.createElement('div');
        imgDiv.append(scene7Link(document, src, img.alt));

        const cells = splitIdx % 2 === 0
          ? [[textDiv, imgDiv]]
          : [[imgDiv, textDiv]];
        const colBlock = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
        frag.append(colBlock);
        splitIdx++;
      }
      return;
    }

    // Video component → embed block
    if (cls.includes('video')) {
      const thumb = child.querySelector('.thumbnail-video, img[src*="ytimg"]');
      if (thumb) {
        const match = thumb.src?.match(YTIMG_RE);
        if (match) {
          frag.append(youtubeEmbed(document, match[1]));
        }
      }
      return;
    }

    // Mosaic gallery → cards block (sample images)
    if (cls.includes('mosaic-gallery')) {
      const imgs = child.querySelectorAll('img[data-src*="scene7"]');
      const seen = new Set();
      const cells = [];
      imgs.forEach((img) => {
        const src = getScene7Src(img);
        if (src && SCENE7_RE.test(src) && !seen.has(src.split('?')[0])) {
          seen.add(src.split('?')[0]);
          cells.push([scene7Link(document, src, img.alt)]);
        }
      });
      if (cells.length > 0) {
        frag.append(WebImporter.Blocks.createBlock(document, { name: 'cards', cells }));
      }
      return;
    }

    // Textimage component → default content (h4 + paragraph)
    if (cls.includes('textimage')) {
      const heading = child.querySelector('h4');
      const para = child.querySelector('p');
      if (heading) {
        const hEl = document.createElement('h4');
        hEl.textContent = heading.textContent.trim();
        frag.append(hEl);
      }
      if (para) {
        const pEl = document.createElement('p');
        pEl.textContent = para.textContent.trim();
        frag.append(pEl);
      }
      return;
    }

    // Inner column-control → columns block with paired columns
    if (cls.includes('column-control')) {
      const leafRows = Array.from(child.querySelectorAll('.row'))
        .filter((r) => !r.querySelector('.row'));
      if (leafRows.length === 0) return;

      const singleCols = [];

      leafRows.forEach((row) => {
        const cols = row.querySelectorAll(':scope > [class*="col-"]');

        if (cols.length >= 2) {
          const colDivs = [];
          cols.forEach((col) => {
            const div = document.createElement('div');
            const img = col.querySelector('img[data-src*="scene7"]');
            const heading = col.querySelector('h4');
            const paras = col.querySelectorAll('p');

            if (img) {
              const src = getScene7Src(img);
              if (src && SCENE7_RE.test(src)) {
                const p = document.createElement('p');
                p.append(scene7Link(document, src, img.alt));
                div.append(p);
              }
            }

            const descPs = Array.from(paras).filter((p) => p.textContent.trim().length > 20);
            if (descPs.length > 0) {
              const pEl = document.createElement('p');
              pEl.textContent = descPs[0].textContent.trim();
              div.append(pEl);
            }

            if (heading) {
              const hEl = document.createElement('h4');
              hEl.textContent = heading.textContent.trim();
              div.append(hEl);
              if (descPs.length > 0) {
                const pEl2 = document.createElement('p');
                pEl2.textContent = descPs[0].textContent.trim();
                div.append(pEl2);
              }
            }

            colDivs.push(div);
          });

          if (colDivs.length >= 2) {
            frag.append(WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [colDivs] }));
          }
        } else if (cols.length === 1) {
          singleCols.push(cols[0]);
        }
      });

      if (singleCols.length >= 2) {
        const colDivs = singleCols.map((col) => {
          const div = document.createElement('div');
          const heading = col.querySelector('h3, h4');
          const strong = col.querySelector('b, strong');
          const paras = col.querySelectorAll('p');

          if (heading) {
            const hEl = document.createElement('h4');
            hEl.textContent = heading.textContent.trim();
            div.append(hEl);
          } else if (strong) {
            const hEl = document.createElement('h4');
            hEl.textContent = strong.textContent.trim();
            div.append(hEl);
          }

          paras.forEach((p) => {
            const text = p.textContent.trim();
            if (text && (!strong || text !== strong.textContent.trim())) {
              const pEl = document.createElement('p');
              pEl.textContent = text;
              div.append(pEl);
            }
          });

          return div;
        });
        frag.append(WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [colDivs] }));
      }

      return;
    }
  });

  return frag;
}

function createTabSection(document, title, content) {
  const section = document.createElement('div');
  section.append(content);
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
      result.append(WebImporter.Blocks.createBlock(document, { name: 'product-details', cells: [] }));
    }

    result.append(document.createElement('hr'));

    // 2. Overview tab
    const descSection = main.querySelector('#pdp-description, .pdp-akeneo-description');
    if (descSection) {
      const overviewContent = buildOverviewSection(document, descSection);
      result.append(createTabSection(document, 'Overview', overviewContent));
      result.append(document.createElement('hr'));
    }

    // 3. Specifications tab
    const specsSection = main.querySelector('#pdp-tech-spec-data');
    if (specsSection) {
      const specsFrag = document.createDocumentFragment();
      const h2 = document.createElement('h2');
      h2.textContent = 'Specifications';
      specsFrag.append(h2);
      const h3 = document.createElement('h3');
      h3.textContent = 'Technical Specifications';
      specsFrag.append(h3);
      const p = document.createElement('p');
      p.textContent = 'For full technical specifications, please visit the Canon USA product page.';
      specsFrag.append(p);
      result.append(createTabSection(document, 'Specifications', specsFrag));
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
        const seen = new Set();
        links.forEach((a) => {
          const text = a.textContent.trim();
          const href = canonUrl(a.getAttribute('href'));
          const key = text + '|' + href;
          if (text && !seen.has(key)) {
            seen.add(key);
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = href;
            link.textContent = text;
            li.append(link);
            ul.append(li);
          }
        });
        compFrag.append(ul);
      }
      result.append(createTabSection(document, 'Compatibility', compFrag));
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
      result.append(createTabSection(document, 'Reviews', revFrag));
      result.append(document.createElement('hr'));
    }

    // 6. Resources tab
    const resSection = main.querySelector('#pdp-resources');
    if (resSection) {
      const resFrag = document.createDocumentFragment();
      const h2 = document.createElement('h2');
      h2.textContent = 'Resources';
      resFrag.append(h2);

      const h3 = document.createElement('h3');
      h3.textContent = 'Videos';
      resFrag.append(h3);

      const videoThumbs = resSection.querySelectorAll('.thumbnail-video, img[src*="ytimg"]');
      videoThumbs.forEach((thumb) => {
        const match = thumb.src?.match(YTIMG_RE);
        if (match) {
          resFrag.append(youtubeEmbed(document, match[1]));
        }
      });

      result.append(createTabSection(document, 'Resources', resFrag));
      result.append(document.createElement('hr'));
    }

    // 7. Support tab
    const supSection = main.querySelector('#pdp-support');
    if (supSection) {
      const supFrag = document.createDocumentFragment();
      const h2 = document.createElement('h2');
      h2.textContent = 'Support';
      supFrag.append(h2);
      const p = document.createElement('p');
      p.textContent = 'Get started with these quick links.';
      supFrag.append(p);

      let supportBase = '';
      const supRefLink = main.querySelector('a[href*="/support/p/"]');
      if (supRefLink) {
        const supMatch = supRefLink.getAttribute('href').match(/\/support\/p\/([^#?]+)/);
        if (supMatch) supportBase = CANON_HOST + '/support/p/' + supMatch[1];
      }

      const supLinks = supSection.querySelectorAll('.support-links a[href], .support-section a[href], #pdp-support a[href]');
      const allLinks = supLinks.length > 0 ? supLinks : supSection.querySelectorAll('a[href]');
      if (allLinks.length > 0) {
        const ul = document.createElement('ul');
        const seen = new Set();
        allLinks.forEach((a) => {
          const text = a.textContent.trim();
          if (text && text.length > 3 && !seen.has(text)) {
            seen.add(text);
            const li = document.createElement('li');
            const link = document.createElement('a');

            const cardRef = a.getAttribute('data-card-id-reference');
            const rawHref = a.getAttribute('href');
            if (cardRef && supportBase) {
              link.href = supportBase + '#idReference=' + cardRef;
            } else if (a.classList.contains('support-link') && supportBase) {
              link.href = supportBase;
            } else {
              link.href = canonUrl(rawHref);
            }

            link.textContent = text;
            li.append(link);
            ul.append(li);
          }
        });
        supFrag.append(ul);
      }
      result.append(createTabSection(document, 'Support', supFrag));
    }

    // 8. Metadata
    result.append(document.createElement('hr'));
    WebImporter.rules.createMetadata(result, document);

    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    main.innerHTML = '';
    main.append(result);

    return [{
      element: main,
      path,
      report: { title: document.title, template: 'product-page' },
    }];
  },
};
