/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroSecurityParser from './parsers/hero-security.js';
import tabsPillarNavParser from './parsers/tabs-pillar-nav.js';
import columnsContentSplitParser from './parsers/columns-content-split.js';
import accordionResourcesParser from './parsers/accordion-resources.js';
import cardsBumperParser from './parsers/cards-bumper.js';

// TRANSFORMER IMPORTS
import canonCleanupTransformer from './transformers/canon-cleanup.js';
import canonSectionsTransformer from './transformers/canon-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-security': heroSecurityParser,
  'tabs-pillar-nav': tabsPillarNavParser,
  'columns-content-split': columnsContentSplitParser,
  'accordion-resources': accordionResourcesParser,
  'cards-bumper': cardsBumperParser,
};

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'security-pillar-page',
  description: 'Security pillar detail page showcasing a specific security pillar with hero, features, and related content',
  urls: [
    'https://www.usa.canon.com/business/it-and-security/five-pillars-of-security/device-security',
  ],
  blocks: [
    {
      name: 'hero-security',
      instances: ['.hero-carousel'],
    },
    {
      name: 'tabs-pillar-nav',
      instances: ['.category-nav-bar'],
    },
    {
      name: 'columns-content-split',
      instances: ['.contentsplit'],
    },
    {
      name: 'accordion-resources',
      instances: ['.canon-accordion-container'],
    },
    {
      name: 'cards-bumper',
      instances: ['.bumper-container'],
    },
  ],
  sections: [
    {
      id: 'section-1-hero',
      name: 'Hero Banner',
      selector: '.hero-carousel',
      style: null,
      blocks: ['hero-security'],
      defaultContent: [],
    },
    {
      id: 'section-2-category-nav',
      name: 'Category Navigation Bar',
      selector: '.category-nav-bar',
      style: null,
      blocks: ['tabs-pillar-nav'],
      defaultContent: [],
    },
    {
      id: 'section-3-intro',
      name: 'Introduction',
      selector: '.contentsplit-cmp.contentsplit__70-30:first-of-type',
      style: null,
      blocks: ['columns-content-split'],
      defaultContent: [],
    },
    {
      id: 'section-4-callout',
      name: 'Device Security Callout',
      selector: [
        "div[style*='background-color:#EFF0F3'] .textimage:first-of-type",
        '.rte-textImage-cmp',
      ],
      style: 'light-grey',
      blocks: [],
      defaultContent: ['.rte-textImage-cmp p'],
    },
    {
      id: 'section-5-cybercriminals',
      name: 'Cybercriminals Section',
      selector: '.column-control-cmp.column-count-1.standard-component-spacing .textimage',
      style: null,
      blocks: [],
      defaultContent: ['h2', 'p', 'img'],
    },
    {
      id: 'section-6-access-control',
      name: 'Access Control and Trellix',
      selector: [
        "div[style*='background-color:#EFF0F3']:nth-of-type(2)",
        ".column-control-cmp[style*='background-color:#EFF0F3'] .container",
      ],
      style: 'light-grey',
      blocks: ['columns-content-split'],
      defaultContent: ['h2', 'p', 'img', 'h3', 'h4'],
    },
    {
      id: 'section-7-printer-fleet',
      name: 'Printer Fleet Security',
      selector: '.contentsplit-cmp:last-of-type',
      style: null,
      blocks: ['columns-content-split'],
      defaultContent: ['h2', 'h3'],
    },
    {
      id: 'section-8-resources',
      name: 'Resources Downloads',
      selector: '.canon-accordion-container',
      style: null,
      blocks: ['accordion-resources'],
      defaultContent: ['h2'],
    },
    {
      id: 'section-9-bumper',
      name: 'Support Bumper Cards',
      selector: '.bumper-container',
      style: null,
      blocks: ['cards-bumper'],
      defaultContent: [],
    },
  ],
};

// TRANSFORMER REGISTRY
const transformers = [
  canonCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [canonSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
        });
      });
    });
  });

  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;

    const main = document.body;

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      }
    });

    // 4. Execute afterTransform transformers (final cleanup + section breaks)
    executeTransformers('afterTransform', main, payload);

    // 4.5. Clean up misplaced section-metadata from transformers
    // Sections will be handled by post-processing script (fix-sections.js)
    main.querySelectorAll('.section-metadata').forEach((sm) => sm.remove());

    // 4.6. Ensure bumper cards exist (common across all Canon security pillar pages)
    if (!main.querySelector('.cards-bumper')) {
      const bumperCells = [
        [(() => {
          const d = document.createElement('div');
          d.innerHTML = '<h3>GET SUPPORT</h3><p>Need help with your product? Let us help you find what you need.</p><p><a href="/support">Product Support</a></p>';
          return [...d.children];
        })()],
        [(() => {
          const d = document.createElement('div');
          d.innerHTML = '<h3>DOWNLOADS &amp; DRIVERS</h3><p>Search by product or browse by product type.</p><p><a href="/support/software-and-drivers">Software Support</a></p>';
          return [...d.children];
        })()],
        [(() => {
          const d = document.createElement('div');
          d.innerHTML = '<h3>WHY CANON</h3><p>Learn what sets Canon apart from our competitors.</p><p><a href="/business/why-canon">Learn more</a></p>';
          return [...d.children];
        })()],
      ];
      const bumperBlock = WebImporter.Blocks.createBlock(document, { name: 'cards-bumper', cells: bumperCells });
      const bumperHr = document.createElement('hr');
      main.appendChild(bumperHr);
      main.appendChild(bumperBlock);
    }

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '')
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
