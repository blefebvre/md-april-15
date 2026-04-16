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

  // tools/importer/import-security-pillar-page.js
  var import_security_pillar_page_exports = {};
  __export(import_security_pillar_page_exports, {
    default: () => import_security_pillar_page_default
  });

  // tools/importer/parsers/hero-security.js
  function parse(element, { document }) {
    const bgImage = element.querySelector(".hero-image-desktop img, .classelc img, img[alt]");
    const heading = element.querySelector(".carousel-caption h1, h1");
    const cells = [];
    if (bgImage) {
      cells.push([bgImage]);
    }
    const contentCell = [];
    if (heading) {
      contentCell.push(heading);
    }
    if (contentCell.length > 0) {
      cells.push(contentCell);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-security", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-pillar-nav.js
  function parse2(element, { document }) {
    const navItems = element.querySelectorAll(
      ".category-navbar-list-items .navlist-item-desktop a, .category-navbar-list-mobile .navlist-item-mobile a"
    );
    const cells = [];
    navItems.forEach((link) => {
      const label = link.textContent.trim();
      if (!label) return;
      const linkEl = document.createElement("a");
      linkEl.href = link.href;
      linkEl.textContent = label;
      cells.push([label, linkEl]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs-pillar-nav", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-content-split.js
  function parse3(element, { document }) {
    const cells = [];
    const contentWrapper = element.querySelector(".cs-content-wrapper, .content-inner");
    const imageFrame = element.querySelector(".image-frame img, .image-wrapper img, .image img");
    if (contentWrapper || imageFrame) {
      const textCol = [];
      const contentEl = contentWrapper || element;
      const heading = contentEl.querySelector("h2, h3");
      const paragraphs = contentEl.querySelectorAll("p.text p, .classic p, .rte-textImage-cmp p");
      if (heading) textCol.push(heading);
      paragraphs.forEach((p) => {
        if (p.textContent.trim()) textCol.push(p);
      });
      const imgCol = [];
      if (imageFrame) imgCol.push(imageFrame);
      if (textCol.length > 0 || imgCol.length > 0) {
        cells.push([textCol.length > 0 ? textCol : "", imgCol.length > 0 ? imgCol : ""]);
      }
    } else {
      const columns = element.querySelectorAll(".colctrl-column, .col-md-6");
      if (columns.length >= 2) {
        const row = [];
        columns.forEach((col) => {
          const colContent = [];
          const h = col.querySelector("h4, h3, h2");
          const p = col.querySelector("p");
          if (h) colContent.push(h);
          if (p) colContent.push(p);
          row.push(colContent.length > 0 ? colContent : "");
        });
        cells.push(row);
      }
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-content-split", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-resources.js
  function parse4(element, { document }) {
    const cells = [];
    const panels = element.querySelectorAll(".accordion-card, .accordionItems > div");
    panels.forEach((panel) => {
      const titleEl = panel.querySelector(".accordion-title, .card-header");
      const title = titleEl ? titleEl.textContent.trim() : "";
      if (!title) return;
      const contentCell = [];
      const downloadRows = panel.querySelectorAll(".canon-table-cell.canon-table-regular-cell");
      if (downloadRows.length > 0) {
        const items = panel.querySelectorAll(".downloadable-asset-title");
        const links = panel.querySelectorAll("a.btn--download");
        items.forEach((item, idx) => {
          const p = document.createElement("p");
          const itemText = item.textContent.trim();
          if (links[idx]) {
            const a = document.createElement("a");
            a.href = links[idx].href;
            a.textContent = itemText;
            p.appendChild(a);
          } else {
            p.textContent = itemText;
          }
          contentCell.push(p);
        });
      } else {
        const body = panel.querySelector(".card-body, .panel-collapse");
        if (body) contentCell.push(body);
      }
      if (contentCell.length > 0) {
        cells.push([title, contentCell]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-resources", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-bumper.js
  function parse5(element, { document }) {
    const cells = [];
    const items = element.querySelectorAll(".bumper-item");
    items.forEach((item) => {
      const header = item.querySelector(".bumper-item-header");
      const content = item.querySelector(".bumper-item-content");
      const ctaLink = item.querySelector(".bumper-item-button, a");
      const cardContent = [];
      if (header) {
        const h = document.createElement("h3");
        h.textContent = header.textContent.trim();
        cardContent.push(h);
      }
      if (content) {
        const p = document.createElement("p");
        p.textContent = content.textContent.trim();
        cardContent.push(p);
      }
      if (ctaLink) {
        const a = document.createElement("a");
        a.href = ctaLink.href;
        a.textContent = ctaLink.textContent.trim();
        const p = document.createElement("p");
        p.appendChild(a);
        cardContent.push(p);
      }
      if (cardContent.length > 0) {
        cells.push([cardContent]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-bumper", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/canon-cleanup.js
  var H = { before: "beforeTransform", after: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === H.before) {
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        '[class*="cookie"]',
        '[role="dialog"]'
      ]);
      WebImporter.DOMUtils.remove(element, [
        'input[type="hidden"]'
      ]);
    }
    if (hookName === H.after) {
      WebImporter.DOMUtils.remove(element, [
        "header",
        "nav",
        '[role="navigation"]',
        "footer",
        '[class*="footer"]',
        ".acsb-trigger",
        "iframe",
        "link",
        "noscript"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("data-track");
        el.removeAttribute("onclick");
        el.removeAttribute("data-cmp-is");
      });
    }
  }

  // tools/importer/transformers/canon-sections.js
  var H2 = { after: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName === H2.after) {
      const { template } = payload;
      if (!template || !template.sections || template.sections.length < 2) return;
      const document = element.ownerDocument;
      const sections = template.sections;
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        let sectionEl = null;
        const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
        for (const sel of selectors) {
          sectionEl = element.querySelector(sel);
          if (sectionEl) break;
        }
        if (!sectionEl) continue;
        if (section.style) {
          const sectionMetadata = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          sectionEl.after(sectionMetadata);
        }
        if (i > 0) {
          const hr = document.createElement("hr");
          sectionEl.before(hr);
        }
      }
    }
  }

  // tools/importer/import-security-pillar-page.js
  var parsers = {
    "hero-security": parse,
    "tabs-pillar-nav": parse2,
    "columns-content-split": parse3,
    "accordion-resources": parse4,
    "cards-bumper": parse5
  };
  var PAGE_TEMPLATE = {
    name: "security-pillar-page",
    description: "Security pillar detail page showcasing a specific security pillar with hero, features, and related content",
    urls: [
      "https://www.usa.canon.com/business/it-and-security/five-pillars-of-security/device-security"
    ],
    blocks: [
      {
        name: "hero-security",
        instances: [".hero-carousel"]
      },
      {
        name: "tabs-pillar-nav",
        instances: [".category-nav-bar"]
      },
      {
        name: "columns-content-split",
        instances: [".contentsplit"]
      },
      {
        name: "accordion-resources",
        instances: [".canon-accordion-container"]
      },
      {
        name: "cards-bumper",
        instances: [".bumper-container"]
      }
    ],
    sections: [
      {
        id: "section-1-hero",
        name: "Hero Banner",
        selector: ".hero-carousel",
        style: null,
        blocks: ["hero-security"],
        defaultContent: []
      },
      {
        id: "section-2-category-nav",
        name: "Category Navigation Bar",
        selector: ".category-nav-bar",
        style: null,
        blocks: ["tabs-pillar-nav"],
        defaultContent: []
      },
      {
        id: "section-3-intro",
        name: "Introduction",
        selector: ".contentsplit-cmp.contentsplit__70-30:first-of-type",
        style: null,
        blocks: ["columns-content-split"],
        defaultContent: []
      },
      {
        id: "section-4-callout",
        name: "Device Security Callout",
        selector: [
          "div[style*='background-color:#EFF0F3'] .textimage:first-of-type",
          ".rte-textImage-cmp"
        ],
        style: "light-grey",
        blocks: [],
        defaultContent: [".rte-textImage-cmp p"]
      },
      {
        id: "section-5-cybercriminals",
        name: "Cybercriminals Section",
        selector: ".column-control-cmp.column-count-1.standard-component-spacing .textimage",
        style: null,
        blocks: [],
        defaultContent: ["h2", "p", "img"]
      },
      {
        id: "section-6-access-control",
        name: "Access Control and Trellix",
        selector: [
          "div[style*='background-color:#EFF0F3']:nth-of-type(2)",
          ".column-control-cmp[style*='background-color:#EFF0F3'] .container"
        ],
        style: "light-grey",
        blocks: ["columns-content-split"],
        defaultContent: ["h2", "p", "img", "h3", "h4"]
      },
      {
        id: "section-7-printer-fleet",
        name: "Printer Fleet Security",
        selector: ".contentsplit-cmp:last-of-type",
        style: null,
        blocks: ["columns-content-split"],
        defaultContent: ["h2", "h3"]
      },
      {
        id: "section-8-resources",
        name: "Resources Downloads",
        selector: ".canon-accordion-container",
        style: null,
        blocks: ["accordion-resources"],
        defaultContent: ["h2"]
      },
      {
        id: "section-9-bumper",
        name: "Support Bumper Cards",
        selector: ".bumper-container",
        style: null,
        blocks: ["cards-bumper"],
        defaultContent: []
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
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element
          });
        });
      });
    });
    return pageBlocks;
  }
  var import_security_pillar_page_default = {
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
  return __toCommonJS(import_security_pillar_page_exports);
})();
