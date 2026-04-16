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

  // tools/importer/import-newsroom-article.js
  var import_newsroom_article_exports = {};
  __export(import_newsroom_article_exports, {
    default: () => import_newsroom_article_default
  });

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
      element.querySelectorAll("a > img").forEach((img) => {
        const src = img.getAttribute("src") || "";
        if (src.includes("canon-image-default")) {
          const link = img.closest("a");
          const damHref = (link == null ? void 0 : link.getAttribute("href")) || "";
          const damPath = damHref.replace(/^\/content\/dam\//, "");
          if (damPath !== damHref) {
            const alt = img.alt || "";
            link.removeAttribute("class");
            link.setAttribute("href", `/dam/${damPath}`);
            link.textContent = alt || damPath.split("/").pop();
            img.remove();
          }
        }
      });
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

  // tools/importer/parsers/cards-social.js
  function parse(element, { document }) {
    const cardDivs = element.querySelectorAll(".filter-div");
    const cells = [];
    cardDivs.forEach((card) => {
      const img = card.querySelector("img");
      const h3 = card.querySelector("h3");
      const desc = card.querySelector('.title-description, [class*="description"]');
      const link = card.querySelector("a[href]");
      const imgCell = img ? scene7ImgToLink(img, document) : "";
      const textCell = [];
      if (h3) textCell.push(h3);
      if (desc) {
        const p = document.createElement("p");
        p.textContent = desc.textContent.trim();
        textCell.push(p);
      }
      if (link) {
        const a = document.createElement("a");
        a.href = link.href;
        a.textContent = link.textContent.trim();
        const p = document.createElement("p");
        p.appendChild(a);
        textCell.push(p);
      }
      if (textCell.length > 0) {
        cells.push([imgCell, textCell]);
      }
    });
    if (cells.length > 0) {
      const block = WebImporter.Blocks.createBlock(document, { name: "cards", cells });
      element.replaceWith(block);
    }
  }

  // tools/importer/import-newsroom-article.js
  var parsers = {
    "cards-social": parse
  };
  var PAGE_TEMPLATE = {
    name: "newsroom-article",
    description: "Canon newsroom press release article",
    blocks: [
      { name: "cards-social", instances: [".content-div.blacktext"] }
    ]
  };
  var transformers = [transform];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((fn) => {
      try {
        fn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  var import_newsroom_article_default = {
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      executeTransformers("afterTransform", main, payload);
      PAGE_TEMPLATE.blocks.forEach((blockDef) => {
        blockDef.instances.forEach((selector) => {
          main.querySelectorAll(selector).forEach((el) => {
            const parser = parsers[blockDef.name];
            if (parser) {
              try {
                parser(el, { document, url, params });
              } catch (e) {
                console.error(`Failed to parse ${blockDef.name}:`, e);
              }
            }
          });
        });
      });
      const cardsTables = [...main.querySelectorAll("table")].filter((t) => {
        const firstCell = t.querySelector("tr td, tr th");
        return firstCell && firstCell.textContent.trim().toLowerCase() === "cards";
      });
      if (cardsTables.length > 1) {
        const firstTable = cardsTables[0];
        const tbody = firstTable.querySelector("tbody") || firstTable;
        for (let i = 1; i < cardsTables.length; i++) {
          const otherTbody = cardsTables[i].querySelector("tbody") || cardsTables[i];
          [...otherTbody.rows].forEach((row, idx) => {
            if (idx > 0) tbody.appendChild(row.cloneNode(true));
          });
          cardsTables[i].remove();
        }
      }
      main.querySelectorAll(".section-metadata").forEach((sm) => sm.remove());
      const hasBumper = main.querySelector(".cards-bumper") || main.textContent.includes("GET SUPPORT");
      if (!hasBumper) {
        const bumperCells = [
          [(() => {
            const d = document.createElement("div");
            d.innerHTML = '<h3>GET SUPPORT</h3><p>Need help with your product? Let us help you find what you need.</p><p><a href="/support">Product Support</a></p>';
            return [...d.children];
          })()],
          [(() => {
            const d = document.createElement("div");
            d.innerHTML = "<h3>NEED IT FIRST</h3><p>Sign up for up-to-the-minute Canon News, Sales and Deals.</p><p><strong>SUBSCRIBE</strong></p>";
            return [...d.children];
          })()],
          [(() => {
            const d = document.createElement("div");
            d.innerHTML = '<h3>LEARN WITH CANON</h3><p>Discover great new ways to enjoy your products with exclusive articles, training and events.</p><p><a href="/learning">Learn more</a></p>';
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
          template: PAGE_TEMPLATE.name
        }
      }];
    }
  };
  return __toCommonJS(import_newsroom_article_exports);
})();
