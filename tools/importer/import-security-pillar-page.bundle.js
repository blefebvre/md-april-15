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

  // tools/importer/utils.js
  var SCENE7_PATTERN = /scene7\.com\/is\/image\//;
  var SCENE7_PREFIX = "/scene7/";
  function extractScene7Path(src) {
    const match = src.match(/scene7\.com\/is\/image\/(.+)/);
    if (!match) return null;
    return match[1].split("?")[0].split(":")[0];
  }
  function scene7ImgToLink(img, document) {
    const src = img.src || img.getAttribute("src") || "";
    if (SCENE7_PATTERN.test(src)) {
      const path = extractScene7Path(src);
      if (path) {
        const a = document.createElement("a");
        a.href = `${SCENE7_PREFIX}${path}`;
        a.textContent = img.alt || path;
        return a;
      }
    }
    return img;
  }

  // tools/importer/parsers/hero-security.js
  function parse(element, { document }) {
    const bgImage = element.querySelector(".hero-image-desktop img, .classelc img, img[alt]");
    const heading = element.querySelector(".carousel-caption h1, h1");
    const cells = [];
    if (bgImage) cells.push([scene7ImgToLink(bgImage, document)]);
    if (heading) cells.push([heading]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-security", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-pillar-nav.js
  function parse2(element, { document }) {
    const navItems = element.querySelectorAll(
      ".category-navbar-list-items .navlist-item-desktop a"
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
      if (imageFrame) imgCol.push(scene7ImgToLink(imageFrame, document));
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
        ".modal-popup",
        ".amsearch-overlay-block",
        '[class*="cookie"]',
        '[role="dialog"]',
        "#drift-widget",
        ".acsb-trigger",
        "script",
        "noscript"
      ]);
      element.querySelectorAll('a[href="#to-main-content"], a[href="#footer"], a[href*="checkout/cart"], a[href*="website-accessibility"]').forEach((link) => {
        const wrapper = link.closest("p") || link;
        wrapper.remove();
      });
      element.querySelectorAll("a").forEach((a) => {
        if (a.textContent.trim() === "Enable accessibility") {
          const wrapper = a.closest("p") || a;
          wrapper.remove();
        }
      });
    }
    if (hookName === H.after) {
      WebImporter.DOMUtils.remove(element, [
        "header",
        "footer",
        '[role="banner"]',
        '[role="contentinfo"]',
        ".breadcrumbs",
        "nav:not(.tabs-pillar-nav-list)",
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
      const doc = element.ownerDocument;
      const bumper = element.querySelector(".bumper-container, .bumper-gradient");
      if (bumper) {
        const bumperItems = bumper.querySelectorAll(".bumper-item");
        if (bumperItems.length > 0) {
          const cells = [];
          bumperItems.forEach((item) => {
            const header = item.querySelector(".bumper-item-header");
            const content = item.querySelector(".bumper-item-content");
            const cta = item.querySelector(".bumper-item-button, a");
            const cellContent = [];
            if (header) {
              const h = doc.createElement("h3");
              h.textContent = header.textContent.trim();
              cellContent.push(h);
            }
            if (content) {
              const p = doc.createElement("p");
              p.textContent = content.textContent.trim();
              cellContent.push(p);
            }
            if (cta) {
              const a = doc.createElement("a");
              a.href = cta.href || cta.getAttribute("href") || "";
              a.textContent = cta.textContent.trim();
              const p = doc.createElement("p");
              p.appendChild(a);
              cellContent.push(p);
            }
            if (cellContent.length > 0) cells.push([cellContent]);
          });
          if (cells.length > 0) {
            const bumperBlock = WebImporter.Blocks.createBlock(doc, { name: "cards-bumper", cells });
            element.appendChild(doc.createElement("hr"));
            element.appendChild(bumperBlock);
          }
        }
      }
      WebImporter.DOMUtils.remove(element, [
        ".xfpage",
        ".experiencefragment",
        ".cmp-experiencefragment"
      ]);
      const footerHeadings = ["ABOUT CANON", "MYCANON", "ORDER HELP", "PRODUCT RESOURCES", "LEGAL"];
      element.querySelectorAll("h3").forEach((h3) => {
        if (footerHeadings.includes(h3.textContent.trim().toUpperCase())) {
          const section = h3.closest("div");
          if (section) section.remove();
        }
      });
      element.querySelectorAll("[data-track]").forEach((el) => el.removeAttribute("data-track"));
      element.querySelectorAll("[onclick]").forEach((el) => el.removeAttribute("onclick"));
      element.querySelectorAll("[data-cmp-is]").forEach((el) => el.removeAttribute("data-cmp-is"));
      const document = element.ownerDocument;
      element.querySelectorAll("img").forEach((img) => {
        const src = img.src || img.getAttribute("src") || "";
        const match = src.match(/scene7\.com\/is\/image\/(.+)/);
        if (match) {
          const path = match[1].split("?")[0].split(":")[0];
          const a = document.createElement("a");
          a.href = `/scene7/${path}`;
          a.textContent = img.alt || path;
          const wrapper = img.closest("p") || img.parentElement;
          if (wrapper && wrapper.tagName === "P") {
            wrapper.textContent = "";
            wrapper.appendChild(a);
          } else {
            img.replaceWith(a);
          }
        }
      });
    }
  }

  // tools/importer/transformers/canon-sections.js
  var H2 = { after: "afterTransform" };
  function transform2(hookName, element, payload) {
    var _a;
    if (hookName === H2.after) {
      const doc = element.ownerDocument;
      const greyBgElements = element.querySelectorAll('[style*="background-color:#EFF0F3"], [style*="background-color: #EFF0F3"], [style*="background-color: rgb(239, 240, 243)"]');
      const greyArray = [...greyBgElements].reverse();
      greyArray.forEach((greyEl) => {
        let insertionPoint = greyEl;
        while (insertionPoint.parentElement && insertionPoint.parentElement !== element) {
          insertionPoint = insertionPoint.parentElement;
        }
        if (insertionPoint === element) return;
        const metaBlock = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: "light-grey" }
        });
        insertionPoint.after(metaBlock);
        const hr = doc.createElement("hr");
        insertionPoint.before(hr);
      });
      const categoryNav = element.querySelector(".category-nav-bar, .category-navbar-list-container");
      if (categoryNav) {
        let navInsert = categoryNav;
        while (navInsert.parentElement && navInsert.parentElement !== element) {
          navInsert = navInsert.parentElement;
        }
        if (navInsert !== element && !((_a = navInsert.previousElementSibling) == null ? void 0 : _a.matches("hr"))) {
          const hr = doc.createElement("hr");
          navInsert.before(hr);
        }
      }
      const contentSplits = element.querySelectorAll(".contentsplit, .contentsplit-cmp");
      contentSplits.forEach((cs) => {
        var _a2;
        let csInsert = cs;
        while (csInsert.parentElement && csInsert.parentElement !== element) {
          csInsert = csInsert.parentElement;
        }
        if (csInsert !== element && !((_a2 = csInsert.previousElementSibling) == null ? void 0 : _a2.matches("hr"))) {
          const hr = doc.createElement("hr");
          csInsert.before(hr);
        }
      });
      const ctaSections = element.querySelectorAll('.cta-section, [class*="cta-banner"]');
      ctaSections.forEach((cta) => {
        var _a2;
        let ctaInsert = cta;
        while (ctaInsert.parentElement && ctaInsert.parentElement !== element) {
          ctaInsert = ctaInsert.parentElement;
        }
        if (ctaInsert !== element && !((_a2 = ctaInsert.previousElementSibling) == null ? void 0 : _a2.matches("hr"))) {
          const hr = doc.createElement("hr");
          ctaInsert.before(hr);
        }
      });
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
      main.querySelectorAll(".section-metadata").forEach((sm) => sm.remove());
      if (!main.querySelector(".cards-bumper")) {
        const bumperCells = [
          [(() => {
            const d = document.createElement("div");
            d.innerHTML = '<h3>GET SUPPORT</h3><p>Need help with your product? Let us help you find what you need.</p><p><a href="/support">Product Support</a></p>';
            return [...d.children];
          })()],
          [(() => {
            const d = document.createElement("div");
            d.innerHTML = '<h3>DOWNLOADS &amp; DRIVERS</h3><p>Search by product or browse by product type.</p><p><a href="/support/software-and-drivers">Software Support</a></p>';
            return [...d.children];
          })()],
          [(() => {
            const d = document.createElement("div");
            d.innerHTML = '<h3>WHY CANON</h3><p>Learn what sets Canon apart from our competitors.</p><p><a href="/business/why-canon">Learn more</a></p>';
            return [...d.children];
          })()]
        ];
        const bumperBlock = WebImporter.Blocks.createBlock(document, { name: "cards-bumper", cells: bumperCells });
        const bumperHr = document.createElement("hr");
        main.appendChild(bumperHr);
        main.appendChild(bumperBlock);
      }
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
