var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-product-page.js
  var import_product_page_exports = {};
  __export(import_product_page_exports, {
    default: () => import_product_page_default
  });

  // tools/importer/parsers/product-details.js
  function parse(element, { document }) {
    const cells = [];
    const block = WebImporter.Blocks.createBlock(document, { name: "product-details", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/embed.js
  function parse2(element, { document }) {
    var _a;
    const iframe = element.querySelector("iframe[src]");
    const videoEl = element.querySelector("video source[src], video[src]");
    const dataUrl = element.getAttribute("data-video-url") || ((_a = element.querySelector("[data-video-url]")) == null ? void 0 : _a.getAttribute("data-video-url"));
    const href = element.querySelector('a[href*="youtube"], a[href*="youtu.be"], a[href*="vimeo"]');
    let videoUrl = null;
    if (iframe) {
      videoUrl = iframe.getAttribute("src");
    } else if (videoEl) {
      videoUrl = videoEl.getAttribute("src");
    } else if (dataUrl) {
      videoUrl = dataUrl;
    } else if (href) {
      videoUrl = href.getAttribute("href");
    }
    const cells = [];
    if (videoUrl) {
      const link = document.createElement("a");
      link.href = videoUrl;
      link.textContent = videoUrl;
      cells.push([link]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "embed", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards.js
  function parse3(element, { document }) {
    const cells = [];
    const images = element.querySelectorAll("img");
    const buttons = element.querySelectorAll("button[data-gallery-role], a[data-gallery-role]");
    if (buttons.length > 0) {
      buttons.forEach((btn) => {
        const img = btn.querySelector("img");
        if (img) {
          const cardCell = [img];
          const caption = img.getAttribute("alt") || "";
          if (caption) {
            const p = document.createElement("p");
            p.textContent = caption;
            cardCell.push(p);
          }
          cells.push(cardCell);
        }
      });
    } else if (images.length > 0) {
      images.forEach((img) => {
        const cardCell = [img];
        const caption = img.getAttribute("alt") || "";
        if (caption) {
          const p = document.createElement("p");
          p.textContent = caption;
          cardCell.push(p);
        }
        cells.push(cardCell);
      });
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  function parse4(element, { document }) {
    const cells = [];
    const columnChildren = element.querySelectorAll(":scope > div, :scope > section");
    if (columnChildren.length >= 2) {
      const row = [];
      columnChildren.forEach((col) => {
        const cellContent = document.createElement("div");
        const img = col.querySelector("img");
        const heading = col.querySelector("h2, h3, h4");
        const desc = col.querySelector("p");
        if (img) cellContent.appendChild(img.cloneNode(true));
        if (heading) cellContent.appendChild(heading.cloneNode(true));
        if (desc) cellContent.appendChild(desc.cloneNode(true));
        row.push(cellContent);
      });
      cells.push(row);
    } else {
      const img = element.querySelector("img");
      const heading = element.querySelector("h2, h3, h4");
      const desc = element.querySelector("p");
      const col1 = document.createElement("div");
      if (img) col1.appendChild(img.cloneNode(true));
      const col2 = document.createElement("div");
      if (heading) col2.appendChild(heading.cloneNode(true));
      if (desc) col2.appendChild(desc.cloneNode(true));
      cells.push([col1, col2]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion.js
  function parse5(element, { document }) {
    const cells = [];
    const triggers = element.querySelectorAll('[data-role="trigger"], [role="tab"], button[aria-expanded]');
    if (triggers.length > 0) {
      triggers.forEach((trigger) => {
        const heading = trigger.querySelector("h2, h3, h4, span") || trigger;
        const title = heading.textContent.trim();
        const content = trigger.nextElementSibling || element.querySelector('[data-role="content"]') || element.querySelector('[role="tabpanel"]');
        const titleEl = document.createElement("p");
        titleEl.textContent = title;
        if (content) {
          const contentClone = content.cloneNode(true);
          cells.push([titleEl, contentClone]);
        } else {
          cells.push([titleEl]);
        }
      });
    } else {
      const heading = element.querySelector("h2, h3, h4");
      const content = element.querySelector('[data-role="content"], .content, [role="tabpanel"]');
      const titleEl = document.createElement("p");
      titleEl.textContent = heading ? heading.textContent.trim() : "Accordion Item";
      if (content) {
        cells.push([titleEl, content.cloneNode(true)]);
      } else {
        cells.push([titleEl]);
      }
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/canon-cleanup.js
  var H = { before: "beforeTransform", after: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === H.before) {
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        ".modal-popup",
        ".amsearch-overlay-block",
        '[class*="cookie"]',
        "#drift-widget",
        "script",
        "noscript"
      ]);
    }
    if (hookName === H.after) {
      WebImporter.DOMUtils.remove(element, [
        "header",
        "footer",
        '[role="banner"]',
        '[role="contentinfo"]',
        ".breadcrumbs",
        "nav",
        "ol.items",
        ".tabsContainer",
        "#pdp-discontinued",
        ".page-anchors-top",
        ".ambanners",
        "#upsell-modal-component",
        "iframe",
        "link",
        "style",
        'input[type="hidden"]'
      ]);
      element.querySelectorAll("[data-track]").forEach((el) => el.removeAttribute("data-track"));
      element.querySelectorAll("[onclick]").forEach((el) => el.removeAttribute("onclick"));
    }
  }

  // tools/importer/transformers/canon-sections.js
  var H2 = { after: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName === H2.after) {
      const { template } = payload || {};
      if (!template || !template.sections || template.sections.length < 2) return;
      const { document } = element.ownerDocument ? { document: element.ownerDocument } : { document };
      const sections = [...template.sections].reverse();
      sections.forEach((section) => {
        const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
        let sectionEl = null;
        for (const sel of selectors) {
          sectionEl = element.querySelector(sel);
          if (sectionEl) break;
        }
        if (!sectionEl) return;
        if (section.style) {
          const metaBlock = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          sectionEl.after(metaBlock);
        }
        if (section.id !== template.sections[0].id) {
          const hr = document.createElement("hr");
          sectionEl.before(hr);
        }
      });
    }
  }

  // tools/importer/import-product-page.js
  var parsers = {
    "product-details": parse,
    "embed": parse2,
    "cards": parse3,
    "columns": parse4,
    "accordion": parse5
  };
  var PAGE_TEMPLATE = {
    name: "product-page",
    description: "Canon product detail page with product information, specifications, and related accessories",
    urls: [
      "https://www.usa.canon.com/shop/p/eos-r50-rf-s18-45mm-f4-5-6-3-is-stm-lens-kit?color=Black&type=New"
    ],
    blocks: [
      {
        name: "product-details",
        instances: [".wrap-media-product-info"]
      },
      {
        name: "embed",
        instances: ["#pdp-description .video-container", "#pdp-description [data-content-type='video']"]
      },
      {
        name: "cards",
        instances: ["#pdp-description .gallery-placeholder"]
      },
      {
        name: "columns",
        instances: ["#pdp-description .feature-columns", "#pdp-description .two-column"]
      },
      {
        name: "accordion",
        instances: ["#pdp-description [data-role='collapsible']"]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "Product Details",
        selector: ".wrap-media-product-info",
        style: null,
        blocks: ["product-details"],
        defaultContent: []
      },
      {
        id: "section-2",
        name: "Overview",
        selector: "#pdp-description",
        style: null,
        blocks: ["embed", "cards", "columns", "accordion"],
        defaultContent: ["#pdp-description h2", "#pdp-description h3", "#pdp-description h4", "#pdp-description p", "#pdp-description img"]
      },
      {
        id: "section-3",
        name: "Disclaimer",
        selector: "#description-disclaimer",
        style: null,
        blocks: [],
        defaultContent: ["#description-disclaimer ol", "#description-disclaimer li"]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_product_page_default = {
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_product_page_exports);
})();
