var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
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
  var DM_PATTERN = /^https?:\/\/s7[a-z0-9]*\.scene7\.com\/is\/image\//;
  function dmLink(document, src, alt) {
    if (!src) return null;
    const a = document.createElement("a");
    a.href = src.split("?")[0];
    a.textContent = alt || "";
    return a;
  }
  function imgSrc(img) {
    const dataSrc = img.getAttribute("data-src");
    const src = dataSrc || img.getAttribute("src") || "";
    return src.includes("canon-image-default") ? dataSrc || "" : src;
  }
  function buildOverviewSection(document, descEl) {
    const frag = document.createDocumentFragment();
    const h2 = document.createElement("h2");
    h2.textContent = "Overview";
    frag.append(h2);
    const colCtrl = descEl.querySelector(".column-control");
    if (!colCtrl) {
      const p = document.createElement("p");
      p.textContent = descEl.textContent.trim().substring(0, 500);
      frag.append(p);
      return frag;
    }
    const rows = colCtrl.querySelectorAll(":scope > .row");
    rows.forEach((row) => {
      const cols = row.querySelectorAll(':scope > [class*="col-"]');
      const headings = row.querySelectorAll("h2, h3, h4");
      const paragraphs = row.querySelectorAll("p");
      const images = row.querySelectorAll("img[src]");
      const videos = row.querySelectorAll('iframe[src*="youtube"], [data-video-url]');
      if (row.textContent.trim().length < 10 && images.length === 0 && videos.length === 0) return;
      videos.forEach((video) => {
        const src = video.getAttribute("src") || video.getAttribute("data-video-url") || "";
        if (src.includes("youtube")) {
          const embedBlock = WebImporter.Blocks.createBlock(document, {
            name: "embed",
            cells: [[(() => {
              const a = document.createElement("a");
              a.href = src;
              a.textContent = src;
              return a;
            })()]]
          });
          frag.append(embedBlock);
        }
      });
      if (images.length >= 3 && headings.length === 0 && cols.length === 1) {
        const heading = document.createElement("h2");
        const prevRow = row.previousElementSibling;
        const prevH2 = prevRow == null ? void 0 : prevRow.querySelector("h2");
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
          const cardsBlock = WebImporter.Blocks.createBlock(document, { name: "cards", cells });
          frag.append(cardsBlock);
        }
        return;
      }
      if (cols.length === 2) {
        const cells = [];
        const colPairs = [];
        for (let i = 0; i < cols.length; i++) {
          const col = cols[i];
          const colHeadings = col.querySelectorAll("h3, h4");
          const colParas = col.querySelectorAll("p");
          const colImgs = col.querySelectorAll("img[src]");
          const hasText = colHeadings.length > 0 || colParas.length > 0 && col.textContent.trim().length > 30;
          const hasImg = colImgs.length > 0;
          if (hasImg && hasText) {
            const cell = document.createElement("div");
            colImgs.forEach((img) => {
              const src = imgSrc(img);
              if (src && DM_PATTERN.test(src)) {
                const p = document.createElement("p");
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
                const newP = document.createElement("p");
                newP.textContent = p.textContent.trim();
                cell.append(newP);
              }
            });
            colPairs.push(cell);
          } else if (hasImg) {
            const cell = document.createElement("div");
            const img = colImgs[0];
            const src = imgSrc(img);
            if (src && DM_PATTERN.test(src)) {
              cell.append(dmLink(document, src, img.alt));
            }
            colPairs.push(cell);
          } else if (hasText) {
            const cell = document.createElement("div");
            colHeadings.forEach((h) => {
              const el = document.createElement(h.tagName.toLowerCase());
              el.textContent = h.textContent.trim();
              cell.append(el);
            });
            colParas.forEach((p) => {
              if (p.textContent.trim().length > 10) {
                const newP = document.createElement("p");
                newP.textContent = p.textContent.trim();
                cell.append(newP);
              }
            });
            colPairs.push(cell);
          }
        }
        if (colPairs.length >= 2) {
          cells.push(colPairs);
          const colBlock = WebImporter.Blocks.createBlock(document, { name: "columns", cells });
          frag.append(colBlock);
        }
        return;
      }
      if (cols.length <= 1) {
        const rowHeadings = Array.from(headings);
        const rowImages = Array.from(images).filter((img) => {
          const src = imgSrc(img);
          return src && DM_PATTERN.test(src);
        });
        const h2s = rowHeadings.filter((h) => h.tagName === "H2");
        if (h2s.length > 0 && rowHeadings.length === h2s.length && rowImages.length === 0) {
          h2s.forEach((h) => {
            const el = document.createElement("h2");
            el.textContent = h.textContent.trim();
            frag.append(el);
          });
          return;
        }
        const featureHeadings = rowHeadings.filter((h) => h.tagName === "H3" || h.tagName === "H4");
        if (featureHeadings.length > 0 && rowImages.length > 0) {
          let currentFeatureIdx = 0;
          featureHeadings.forEach((fh, idx) => {
            const textDiv = document.createElement("div");
            const hEl = document.createElement(fh.tagName.toLowerCase());
            hEl.textContent = fh.textContent.trim();
            textDiv.append(hEl);
            let sibling = fh.nextElementSibling;
            while (sibling && !["H2", "H3", "H4"].includes(sibling.tagName)) {
              if (sibling.tagName === "P" && sibling.textContent.trim().length > 10) {
                const pEl = document.createElement("p");
                pEl.textContent = sibling.textContent.trim();
                textDiv.append(pEl);
              }
              sibling = sibling.nextElementSibling;
            }
            const img = rowImages[currentFeatureIdx] || rowImages[rowImages.length - 1];
            if (img) {
              const src = imgSrc(img);
              const imgDiv = document.createElement("div");
              imgDiv.append(dmLink(document, src, img.alt));
              const cells = idx % 2 === 0 ? [[textDiv, imgDiv]] : [[imgDiv, textDiv]];
              const colBlock = WebImporter.Blocks.createBlock(document, { name: "columns", cells });
              frag.append(colBlock);
              currentFeatureIdx++;
            } else {
              frag.append(textDiv);
            }
          });
          return;
        }
        if (featureHeadings.length > 0) {
          featureHeadings.forEach((h) => {
            const el = document.createElement(h.tagName.toLowerCase());
            el.textContent = h.textContent.trim();
            frag.append(el);
          });
          paragraphs.forEach((p) => {
            if (p.textContent.trim().length > 20) {
              const newP = document.createElement("p");
              newP.textContent = p.textContent.trim();
              frag.append(newP);
            }
          });
        }
      }
    });
    const disclaimerSection = descEl.querySelector(".wrap-disclaimer, #description-disclaimer");
    const accordion = descEl.querySelector('[data-role="collapsible"], .cms-accordion');
    if (accordion) {
      const title = accordion.querySelector('h3, [data-role="trigger"]');
      const content = accordion.querySelector('[data-role="content"], .content');
      if (title && content) {
        const cells = [[
          (() => {
            const p = document.createElement("p");
            p.textContent = title.textContent.trim();
            return p;
          })(),
          content.cloneNode(true)
        ]];
        const accBlock = WebImporter.Blocks.createBlock(document, { name: "accordion", cells });
        frag.append(accBlock);
      }
    }
    return frag;
  }
  function createTabSection(document, title, content) {
    const section = document.createElement("div");
    section.append(content);
    const metaBlock = WebImporter.Blocks.createBlock(document, {
      name: "Section Metadata",
      cells: [
        ["style", "tab"],
        ["tab-title", title]
      ]
    });
    section.append(metaBlock);
    return section;
  }
  var import_product_page_default = {
    transform: (payload) => {
      var _a, _b, _c, _d, _e;
      const { document, url, params } = payload;
      const main = document.body;
      const removeSels = [
        "header",
        "footer",
        '[role="banner"]',
        '[role="contentinfo"]',
        "nav",
        ".breadcrumbs",
        ".tabsContainer",
        "#pdp-discontinued",
        ".page-anchors-top",
        ".ambanners",
        "#upsell-modal-component",
        ".amsearch-overlay-block",
        "script",
        "noscript",
        "style",
        "link",
        'input[type="hidden"]',
        ".modal-popup"
      ];
      WebImporter.DOMUtils.remove(main, removeSels);
      const result = document.createElement("div");
      const productInfo = main.querySelector(".wrap-media-product-info");
      if (productInfo) {
        const pdBlock = WebImporter.Blocks.createBlock(document, { name: "product-details", cells: [] });
        result.append(pdBlock);
      }
      result.append(document.createElement("hr"));
      const descSection = main.querySelector("#pdp-description, .pdp-akeneo-description");
      if (descSection) {
        const overviewContent = buildOverviewSection(document, descSection);
        const overviewSection = createTabSection(document, "Overview", overviewContent);
        result.append(overviewSection);
        result.append(document.createElement("hr"));
      }
      const specsSection = main.querySelector("#pdp-tech-spec-data");
      if (specsSection) {
        const specsFrag = document.createDocumentFragment();
        const h2 = document.createElement("h2");
        h2.textContent = "Specifications";
        specsFrag.append(h2);
        const p = document.createElement("p");
        p.textContent = "For full technical specifications, please visit the Canon USA product page.";
        specsFrag.append(p);
        const specSection = createTabSection(document, "Specifications", specsFrag);
        result.append(specSection);
        result.append(document.createElement("hr"));
      }
      const accSection = main.querySelector("#pdp-accessories");
      if (accSection) {
        const compFrag = document.createDocumentFragment();
        const h2 = document.createElement("h2");
        h2.textContent = "Compatibility";
        compFrag.append(h2);
        const links = accSection.querySelectorAll("a.product-item-link");
        if (links.length > 0) {
          const h3 = document.createElement("h3");
          h3.textContent = "Compatible Accessories";
          compFrag.append(h3);
          const ul = document.createElement("ul");
          links.forEach((a) => {
            const li = document.createElement("li");
            const link = document.createElement("a");
            link.href = a.href;
            link.textContent = a.textContent.trim();
            li.append(link);
            ul.append(li);
          });
          compFrag.append(ul);
        }
        const compTabSection = createTabSection(document, "Compatibility", compFrag);
        result.append(compTabSection);
        result.append(document.createElement("hr"));
      }
      const reviewsSection = main.querySelector("#pdp-reviews");
      if (reviewsSection) {
        const revFrag = document.createDocumentFragment();
        const h2 = document.createElement("h2");
        h2.textContent = "Reviews";
        revFrag.append(h2);
        const p = document.createElement("p");
        p.textContent = "How is your Canon product performing for you?";
        revFrag.append(p);
        const revTabSection = createTabSection(document, "Reviews", revFrag);
        result.append(revTabSection);
        result.append(document.createElement("hr"));
      }
      const resSection = main.querySelector("#pdp-resources");
      if (resSection) {
        const resFrag = document.createDocumentFragment();
        const h2 = document.createElement("h2");
        h2.textContent = "Resources";
        resFrag.append(h2);
        const reTabSection = createTabSection(document, "Resources", resFrag);
        result.append(reTabSection);
        result.append(document.createElement("hr"));
      }
      const supSection = main.querySelector("#pdp-support");
      if (supSection) {
        const supFrag = document.createDocumentFragment();
        const h2 = document.createElement("h2");
        h2.textContent = "Support";
        supFrag.append(h2);
        const supLinks = supSection.querySelectorAll("a[href]");
        if (supLinks.length > 0) {
          const ul = document.createElement("ul");
          const seen = /* @__PURE__ */ new Set();
          supLinks.forEach((a) => {
            const text = a.textContent.trim();
            if (text && !seen.has(text) && text.length > 3) {
              seen.add(text);
              const li = document.createElement("li");
              const link = document.createElement("a");
              link.href = a.href;
              link.textContent = text;
              li.append(link);
              ul.append(li);
            }
          });
          supFrag.append(ul);
        }
        const supTabSection = createTabSection(document, "Support", supFrag);
        result.append(supTabSection);
      }
      result.append(document.createElement("hr"));
      const disclaimer = main.querySelector("#description-disclaimer, .wrap-disclaimer");
      if (disclaimer) {
        const listItems = disclaimer.querySelectorAll("li");
        if (listItems.length > 0) {
          const h3 = document.createElement("h3");
          h3.textContent = "Product Disclaimer";
          result.append(h3);
          const ol = document.createElement("ol");
          listItems.forEach((li) => {
            const newLi = document.createElement("li");
            newLi.textContent = li.textContent.trim();
            ol.append(newLi);
          });
          result.append(ol);
        }
      }
      result.append(document.createElement("hr"));
      const title = ((_c = (_b = (_a = document.querySelector("title")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()) == null ? void 0 : _c.replace(" | Canon U.S.A.", "")) || "";
      const desc = ((_d = document.querySelector('meta[name="description"]')) == null ? void 0 : _d.content) || "";
      const ogImage = ((_e = document.querySelector('meta[property="og:image"]')) == null ? void 0 : _e.content) || "";
      WebImporter.rules.createMetadata(result, document);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      main.innerHTML = "";
      main.append(result);
      return [{
        element: main,
        path,
        report: { title, template: "product-page" }
      }];
    }
  };
  return __toCommonJS(import_product_page_exports);
})();
