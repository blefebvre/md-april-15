/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS
import canonCleanupTransformer from './transformers/canon-cleanup.js';

// PARSER IMPORTS
import cardsSocialParser from './parsers/cards-social.js';

// PARSER REGISTRY
const parsers = {
  'cards-social': cardsSocialParser,
};

// PAGE TEMPLATE
const PAGE_TEMPLATE = {
  name: 'newsroom-article',
  description: 'Canon newsroom press release article',
  blocks: [
    { name: 'cards-social', instances: ['.content-div.blacktext'] },
  ],
};

// TRANSFORMER REGISTRY
const transformers = [canonCleanupTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn.call(null, hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;
    const main = document.body;

    // 1. Cleanup
    executeTransformers('beforeTransform', main, payload);
    executeTransformers('afterTransform', main, payload);

    // 2. Parse blocks
    PAGE_TEMPLATE.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        main.querySelectorAll(selector).forEach((el) => {
          const parser = parsers[blockDef.name];
          if (parser) {
            try { parser(el, { document, url, params }); }
            catch (e) { console.error(`Failed to parse ${blockDef.name}:`, e); }
          }
        });
      });
    });

    // 3. Remove misplaced section-metadata
    main.querySelectorAll('.section-metadata').forEach((sm) => sm.remove());

    // 3. Add bumper cards (newsroom uses different bumper: GET SUPPORT / NEED IT FIRST / LEARN WITH CANON)
    const hasBumper = main.querySelector('.cards-bumper') || main.textContent.includes('GET SUPPORT');
    if (!hasBumper) {
      const bumperCells = [
        [(() => {
          const d = document.createElement('div');
          d.innerHTML = '<h3>GET SUPPORT</h3><p>Need help with your product? Let us help you find what you need.</p><p><a href="/support">Product Support</a></p>';
          return [...d.children];
        })()],
        [(() => {
          const d = document.createElement('div');
          d.innerHTML = '<h3>NEED IT FIRST</h3><p>Sign up for up-to-the-minute Canon News, Sales and Deals.</p><p><strong>SUBSCRIBE</strong></p>';
          return [...d.children];
        })()],
        [(() => {
          const d = document.createElement('div');
          d.innerHTML = '<h3>LEARN WITH CANON</h3><p>Discover great new ways to enjoy your products with exclusive articles, training and events.</p><p><a href="/learning">Learn more</a></p>';
          return [...d.children];
        })()],
      ];
      const bumperBlock = WebImporter.Blocks.createBlock(document, { name: 'cards-bumper', cells: bumperCells });
      const bumperHr = document.createElement('hr');
      main.appendChild(bumperHr);
      main.appendChild(bumperBlock);
    }

    // 4. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5. Generate path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '')
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
      },
    }];
  },
};
