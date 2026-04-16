/**
 * Run the import script transform against the local cleaned.html
 * instead of fetching from the live Canon site.
 */
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Minimal WebImporter polyfill
const WebImporter = {
  DOMUtils: {
    remove(element, selectors) {
      selectors.forEach((sel) => {
        element.querySelectorAll(sel).forEach((el) => el.remove());
      });
    },
  },
  Blocks: {
    createBlock(document, { name, cells }) {
      const table = document.createElement('table');
      const headerRow = document.createElement('tr');
      const headerCell = document.createElement('td');
      headerCell.setAttribute('colspan', '100');
      headerCell.textContent = name;
      headerRow.append(headerCell);
      table.append(headerRow);

      if (cells && cells.length > 0) {
        cells.forEach((row) => {
          const tr = document.createElement('tr');
          const rowItems = Array.isArray(row) ? row : [row];
          rowItems.forEach((cell) => {
            const td = document.createElement('td');
            if (typeof cell === 'string') {
              td.textContent = cell;
            } else if (cell instanceof Array) {
              cell.forEach((c) => {
                if (typeof c === 'string') {
                  td.append(document.createTextNode(c));
                } else if (c && c.nodeType) {
                  td.append(c);
                }
              });
            } else if (cell && cell.nodeType) {
              td.append(cell);
            } else if (typeof cell === 'object' && cell !== null) {
              // Handle key-value pairs for Section Metadata
              Object.entries(cell).forEach(([, v]) => {
                td.textContent = String(v);
              });
            }
            tr.append(td);
          });
          table.append(tr);
        });
      }
      return table;
    },
  },
  FileUtils: {
    sanitizePath(p) {
      return p.toLowerCase().replace(/[^a-z0-9/.-]/g, '-').replace(/-+/g, '-');
    },
  },
  rules: {
    createMetadata(main, document) {
      const meta = document.createElement('table');
      const headerRow = document.createElement('tr');
      const headerCell = document.createElement('td');
      headerCell.setAttribute('colspan', '2');
      headerCell.textContent = 'metadata';
      headerRow.append(headerCell);
      meta.append(headerRow);

      const title = document.querySelector('title')?.textContent || '';
      if (title) {
        const row = document.createElement('tr');
        row.innerHTML = `<td>Title</td><td>${title.replace(' | Canon U.S.A.', '')}</td>`;
        meta.append(row);
      }
      main.append(meta);
    },
  },
};

// Make WebImporter available globally
globalThis.WebImporter = WebImporter;

// Load the cleaned HTML
const cleanedHtml = fs.readFileSync('migration-work/cleaned.html', 'utf8');

// Create a DOM from it
const dom = new JSDOM(`<!DOCTYPE html><html><head><title>EOS R50 RF-S18-45mm F4.5-6.3 IS STM Lens Kit</title></head><body>${cleanedHtml}</body></html>`, {
  url: 'https://www.usa.canon.com/shop/p/eos-r50-rf-s18-45mm-f4-5-6-3-is-stm-lens-kit?color=Black&type=New',
});

const { document } = dom.window;

// Dynamically import the import script (ESM)
const importScript = await import('./import-product-page.js');

const payload = {
  document,
  url: 'https://www.usa.canon.com/shop/p/eos-r50-rf-s18-45mm-f4-5-6-3-is-stm-lens-kit?color=Black&type=New',
  html: cleanedHtml,
  params: {
    originalURL: 'https://www.usa.canon.com/shop/p/eos-r50-rf-s18-45mm-f4-5-6-3-is-stm-lens-kit?color=Black&type=New',
  },
};

try {
  const results = importScript.default.transform(payload);
  if (results && results.length > 0) {
    const { element, path: docPath } = results[0];

    // Convert tables back to EDS block divs
    let html = element.innerHTML;

    // Convert block tables to EDS div format
    html = html.replace(/<table>([\s\S]*?)<\/table>/g, (match, tableContent) => {
      const rows = [...tableContent.matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
      if (rows.length === 0) return match;

      // First row is the block name
      const nameMatch = rows[0][1].match(/<td[^>]*>(.*?)<\/td>/s);
      const blockName = nameMatch ? nameMatch[1].trim().toLowerCase() : '';

      if (blockName === 'metadata') {
        // Metadata block
        let metaHtml = `<div class="metadata">`;
        for (let i = 1; i < rows.length; i++) {
          const cells = [...rows[i][1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)];
          if (cells.length >= 2) {
            metaHtml += `\n  <div>\n    <div>${cells[0][1].trim()}</div>\n    <div>${cells[1][1].trim()}</div>\n  </div>`;
          }
        }
        metaHtml += `\n</div>`;
        return metaHtml;
      }

      if (blockName === 'section metadata') {
        let smHtml = `<div class="section-metadata">`;
        for (let i = 1; i < rows.length; i++) {
          const cells = [...rows[i][1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)];
          if (cells.length >= 2) {
            smHtml += `\n  <div><div>${cells[0][1].trim()}</div><div>${cells[1][1].trim()}</div></div>`;
          }
        }
        smHtml += `\n</div>`;
        return smHtml;
      }

      // Regular block
      let blockHtml = `<div class="${blockName}">`;
      for (let i = 1; i < rows.length; i++) {
        const cells = [...rows[i][1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)];
        blockHtml += `\n  <div>`;
        cells.forEach((cell) => {
          blockHtml += `\n    <div>${cell[1].trim()}</div>`;
        });
        blockHtml += `\n  </div>`;
      }
      blockHtml += `\n</div>`;
      return blockHtml;
    });

    // Wrap in sections (split by <hr>)
    const sections = html.split(/<hr\s*\/?>/);
    const finalHtml = sections.map((s) => `<div>\n${s.trim()}\n</div>`).join('\n');

    // Write output
    const outDir = `content${path.dirname(docPath)}`;
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = `content${docPath}.plain.html`;
    fs.writeFileSync(outPath, finalHtml);
    console.log(`✅ Written to ${outPath} (${finalHtml.length} bytes)`);
  }
} catch (e) {
  console.error('Transform error:', e.message);
  console.error(e.stack);
}
