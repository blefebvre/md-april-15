/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import productDetailsParser from './parsers/product-details.js';
import embedParser from './parsers/embed.js';
import cardsParser from './parsers/cards.js';
import columnsParser from './parsers/columns.js';
import accordionParser from './parsers/accordion.js';

// TRANSFORMER IMPORTS
import canonCleanupTransformer from './transformers/canon-cleanup.js';
import canonSectionsTransformer from './transformers/canon-sections.js';

// PARSER REGISTRY
const parsers = {
  'product-details': productDetailsParser,
  'embed': embedParser,
  'cards': cardsParser,
  'columns': columnsParser,
  'accordion': accordionParser,
};

// PAGE TEMPLATE CONFIGURATION (from page-templates.json)
const PAGE_TEMPLATE = {
  name: 'product-page',
  description: 'Canon product detail page with product information, specifications, and related accessories',
  urls: [
    'https://www.usa.canon.com/shop/p/eos-r50-rf-s18-45mm-f4-5-6-3-is-stm-lens-kit?color=Black&type=New',
  ],
  blocks: [
    {
      name: 'product-details',
      instances: ['.wrap-media-product-info'],
    },
    {
      name: 'embed',
      instances: ['#pdp-description .video-container', "#pdp-description [data-content-type='video']"],
    },
    {
      name: 'cards',
      instances: ['#pdp-description .gallery-placeholder'],
    },
    {
      name: 'columns',
      instances: ['#pdp-description .feature-columns', '#pdp-description .two-column'],
    },
    {
      name: 'accordion',
      instances: ["#pdp-description [data-role='collapsible']"],
    },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Product Details',
      selector: '.wrap-media-product-info',
      style: null,
      blocks: ['product-details'],
      defaultContent: [],
    },
    {
      id: 'section-2',
      name: 'Overview',
      selector: '#pdp-description',
      style: null,
      blocks: ['embed', 'cards', 'columns', 'accordion'],
      defaultContent: ['#pdp-description h2', '#pdp-description h3', '#pdp-description h4', '#pdp-description p', '#pdp-description img'],
    },
    {
      id: 'section-3',
      name: 'Disclaimer',
      selector: '#description-disclaimer',
      style: null,
      blocks: [],
      defaultContent: ['#description-disclaimer ol', '#description-disclaimer li'],
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
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - The payload containing { document, url, html, params }
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
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
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
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Execute afterTransform transformers (final cleanup + section breaks)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
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
