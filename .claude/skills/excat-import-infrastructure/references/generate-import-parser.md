# Generate Import Parser for Block Variants

**Purpose**: Create a custom JavaScript parser function that transforms source HTML into structured block tables for import workflows. Parsers are the bridge between source HTML and AEM block format. Without parsers, content cannot be automatically imported across multiple pages.

**xwalk projects:** Additional requirements (field hinting, cells/rows, validation) are in [xwalk-parser-requirements.md](xwalk-parser-requirements.md).

---

## 🚨 PREREQUISITE CHECK
1. Identify the block you are creating a parser for.
2. Fetch block example using `get_block_examples` for the block type, make sure to use the block libraryUrl identified in ./migration/project.json
3. Mandate yourself to follow the design from the block library example, and description. Do NOT deviate from this when you generate the rows and cells in the parser.


## 🚨 CRITICAL CONTEXT: Source HTML Availability

**IMPORTANT: SOURCE HTML IS ALWAYS AVAILABLE DURING PARSER GENERATION**
**NEVER generate parser stubs or placeholder parsers claiming source HTML isn't available.**

The parser generation step occurs AFTER the page migration workflow has:
1. **Captured source HTML** - Extract Source Content
2. **Analyzed DOM structure** - including selectors and element hierarchy
3. **Created block variants** - with references to source HTML patterns

**Required context for each parser:**
- Block name and base block type
- **Source HTML for the block instance**
- **DOM structure and selectors**
- Block Library Examples: See the Project Settings .migration/project.json for the libraryUrl
- Block markdown example (defines table structure)
- Block description (defines content semantics)
- DOM selectors from page template (generated in Step 1 of this workflow)

**All of this source HTML and DOM analysis context MUST be used for parser generation.**
**For all parser being generated, you must follow the design/layout that the block library indicates for the design requirements for the structure of the blocks.**

---

For each block (from complete `variantMapping` object):

## 1. Prepare Parser Context

All parser generation uses this context from the page migration workflow (per variant). It is available after scraping, analysis, and block variant creation—**use it; do not generate without it.**

```javascript
// Required context from page migration (for each variant)
parserContext = {
  variantName, baseBlock,           // from variantMapping
  sourceHtml,                       // captured HTML for this block instance
  sourceScreenshot,                 // from browser capture
  sourceDomStructure: { selectors, elements, hierarchy },
  markdownExample,                  // block library – table structure (rows/columns)
  blockDescription,                 // block library – content semantics (what goes where)
  visualAnalysis                    // optional: layout, contentStructure, imagePattern
};
```

**Required for parser generation:** `variantName`, `baseBlock`, `sourceHtml`, `sourceDomStructure`, `markdownExample`, `blockDescription`. Use `sourceScreenshot` to confirm selectors; use block library (libraryUrl in `.migration/project.json`) for markdown + description.

## 2. Generate Parser Function

**🚨 CRITICAL REQUIREMENTS - PARSER MUST INCLUDE ALL FOUR:**

1. **✅ CORRECT FUNCTION SIGNATURE**: `export default function parse(element, { document })`
   - ❌ NOT `parseBlockName(document, blockName)` 
   - ❌ NOT `parse(document, element)`
   - ✅ MUST BE: `parse(element, { document })` - element first, document destructured second

2. **✅ USE WebImporter.Blocks.createBlock()**: 
   - ❌ NOT manually returning `{ blockName, cells }` objects
   - ❌ NOT returning arrays
   - ✅ MUST USE: `const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });`

3. **✅ REPLACE THE ELEMENT**: 
   - ❌ NOT `return results;`
   - ❌ NOT `return block;`
   - ✅ MUST USE: `element.replaceWith(block);` with no return statement

4. **✅ USE EXACT VARIANT NAME IN createBlock**: 
   - ❌ NOT `'Hero (title)'` (with parentheses)
   - ❌ NOT `'Hero-title'` (Title-Case)
   - ✅ MUST BE: `'hero-title'` (exact variant name from variantMapping)
   - The `name` parameter must use the variant name EXACTLY as defined, without transformation

**These four requirements are NON-NEGOTIABLE. Parsers missing any of these will fail.**

---

### 🔴 CRITICAL: Block naming (parser must follow)

- **createBlock name:** The `name` argument in `WebImporter.Blocks.createBlock(document, { name, cells })` **must** be the **exact variant name** from `variantMapping` / `parserContext.variantName`. Use it directly—no transformation.
- **Forbidden:** Do not use parentheses (e.g. `'Hero (title)'`), Title-Case (e.g. `'Hero-Title'`), or any other formatting. Wrong names break block resolution and imports.
- **Correct examples:** `'hero-title'`, `'cards-product'`, `'accordion'` (lowercase-with-hyphens, exactly as in variantMapping).
- **Parser file name:** Write the parser to `tools/importer/parsers/${variantName}.js` so the filename matches the variant name.

### ❌ Common mistakes

Wrong: `parseAccordion(document, blockName)`, `return { blockName, cells }` or `return results`. Right: `parse(element, { document })`, `WebImporter.Blocks.createBlock(document, { name, cells })`, `element.replaceWith(block)` (no return). See template above.

---

**Principle:** Output (table structure) is defined by block library example + description; input (extraction) comes from actual source HTML. Source HTML will not match the library exactly—parser must handle variations and produce the same table format.

**How to use block library example and source DOM:**
1. **Block library markdown example** → Defines the **target table shape**: how many rows and columns, and the layout. Get it via `get_block_examples` using the block libraryUrl from `.migration/project.json`.
2. **Block library block description** → Defines **which content belongs in which cell** (e.g. "Row 2: heading, subheading, CTA buttons"). That tells you the semantics: what to put in each row/cell.
3. **Source DOM (sourceHtml / sourceDomStructure)** → Defines **where to extract from**: use it to choose and validate selectors (element types, classes, hierarchy) so you pull the right nodes from the page.
4. **Bridge:** Extract content from the source element using those selectors, then **place** the extracted nodes into the `cells` array in the **same order and structure** as the block library example. Each cell gets the content the description says belongs there (e.g. heading + description + buttons in one cell). Result: source content in the correct cells for the block.

**Template:** `/* eslint-disable */` `/* global WebImporter */`; comment with variantName, sourceUrl, baseBlock, timestamp; `export default function parse(element, { document }) { ... }`; extract with validated selectors; build `cells` to match markdown example; `const block = WebImporter.Blocks.createBlock(document, { name: '{variantName}', cells });` (variant name exact); `element.replaceWith(block);` (no return).

## 3. Implementation Guidelines for Parser Generation

### A. Analyze Source HTML Structure (INPUT EXTRACTION)

**Validate every selector against actual source HTML; do not guess.** From `parserContext.sourceHtml` identify: element types, exact class names, hierarchy, attributes. Use screenshot to confirm semantics. Example: if source has `<h2 class="hero-title">`, use `.hero-title` or `h2` (not `.hero-heading` or `h1`). After validating current page, add fallbacks for likely variations (e.g. `h1, h3`, `[class*="title"]`).

### B. Understand Target Block Structure (OUTPUT STRUCTURE)

Block library (markdown example + block description) defines **output**: rows/columns and what goes where. Use the project's block libraryUrl. Every parser run must produce this exact table format.

### C. Generate Flexible Extraction Logic (BRIDGING INPUT → OUTPUT)

Use validated selectors (from A) plus fallbacks for variation. **Comma-separated selectors must be mutually exclusive**—no overlapping (e.g. `.cta-primary, a.button` can double-select `<a class="button cta-primary">`). Avoid parent-child in same list (`div, div > p` duplicates). Prefer distinct classes or querySelector OR chains. Optional elements: only add row if present and block supports it. Use `:scope >` for direct children when appropriate.

### D. Build Cells Array (CONSTRUCTING OUTPUT)

Build `cells` to match block library table structure (rows/columns from markdown example, semantics from description). Cells can be strings, elements, or arrays. Optional rows (e.g. background image): add only if element exists and block supports it. Combine content per example (e.g. `[heading, description, ...buttons]` in one row). Cells can reference source elements, there is no need to make copies.

### E. Handle Variations

Use fallbacks and conditionals for optional elements, multiple vs single CTAs, heading levels, image presence. Comment what variations are handled.

### F. Field Hinting (xwalk projects only)

**If the project type is `xwalk`** (see `.migration/project.json`), additional requirements apply: field hinting, cells/rows rules, and validation. See [xwalk-parser-requirements.md](xwalk-parser-requirements.md) for the full xwalk section.

### G. Summary

Input (source HTML) varies; output (block table) is fixed by block library. Validate all selectors against source HTML; use fallbacks; never guess. Invalid selectors break the parser.

## 4. Parser Generation Process

**🚨 MANDATORY: Use source HTML from parser context to generate accurate selectors**

**xwalk projects:** If project type is `xwalk` (see `.migration/project.json`), follow [xwalk-parser-requirements.md](xwalk-parser-requirements.md) before and during parser generation.

Generate the parser using ALL available context from the page migration workflow:

```javascript
// Pseudo-code: (1) parse sourceHtml; (2) validateAndExtractSelectors (no guessing);
// (3) analyzeMarkdownExample for table structure; (4) analyzeBlockDescription for semantics;
// (5) if xwalk, fetchUeModel (see xwalk-parser-requirements.md); (6) mergeMappings;
// (7) analyzeScreenshot; (8) verifySelectorSemantics(validatedSelectors, visualContext, cellMapping);
// (9) generateExtractionLogic; (10) generateCellsArray; (11) assembleParser with signature,
// useCreateBlock, useReplaceWith, ueModel; (12) validateParserStructure before return.
function generateParser(parserContext) {
  const parsedHtml = parseHtmlStructure(parserContext.sourceHtml);
  const validatedSelectors = validateAndExtractSelectors(parsedHtml);
  const tableStructure = analyzeMarkdownExample(parserContext.markdownExample);
  const contentSemantics = analyzeBlockDescription(parserContext.blockDescription);
  const ueModel = fetchUeModel(parserContext.baseBlock);
  const cellMapping = mergeMappings(tableStructure, contentSemantics, ueModel);
  const visualContext = analyzeScreenshot(parserContext.sourceScreenshot);
  const verifiedSelectors = verifySelectorSemantics(validatedSelectors, visualContext, cellMapping);
  const extractionCode = generateExtractionLogic(verifiedSelectors, cellMapping);
  const cellsCode = generateCellsArray(cellMapping, extractionCode);
  const parserCode = assembleParser({
    variantName: parserContext.variantName, baseBlock: parserContext.baseBlock,
    extractionCode, cellsCode, comments: generateComments(parserContext),
    validationNotes: documentValidatedSelectors(verifiedSelectors),
    signature: 'parse(element, { document })', useCreateBlock: true, useReplaceWith: true, ueModel
  });
  validateParserStructure(parserCode, parserContext.variantName);
  return parserCode;
}

// 🚨 Mandatory validation function
function validateParserStructure(code, variantName) {
  // Requirement #1: Check function signature
  if (!code.includes('export default function parse(element, { document })')) {
    throw new Error('CRITICAL: Parser must use signature: parse(element, { document })');
  }
  
  // Requirement #2: Check createBlock usage
  if (!code.includes('WebImporter.Blocks.createBlock(document, { name:')) {
    throw new Error('CRITICAL: Parser must use WebImporter.Blocks.createBlock()');
  }
  
  // Requirement #3: Check replaceWith usage
  if (!code.includes('element.replaceWith(block)')) {
    throw new Error('CRITICAL: Parser must call element.replaceWith(block)');
  }
  
  // Requirement #4: Check variant name is used correctly (no parentheses, no Title-Case)
  const incorrectPatterns = [
    /name:\s*['"`][A-Z][a-z]+\s*\([^)]+\)/,  // Matches: 'Hero (title)'
    /name:\s*['"`][A-Z][a-z]+-[A-Z][a-z]+/,   // Matches: 'Hero-Title'
  ];
  
  for (const pattern of incorrectPatterns) {
    if (pattern.test(code)) {
      throw new Error(`CRITICAL: Parser name must use exact variant name '${variantName}', not transformed with parentheses or Title-Case`);
    }
  }
  
  // Verify the exact variant name is used
  if (!code.includes(`name: '${variantName}'`) && !code.includes(`name: "${variantName}"`)) {
    throw new Error(`CRITICAL: Parser must use exact variant name '${variantName}' in createBlock`);
  }
  
  // Verify no return statement exists (common mistake)
  if (code.match(/return (results|block|cells)/)) {
    throw new Error('CRITICAL: Parser must NOT return anything, use element.replaceWith() instead');
  }
}
```

## 5. Validation checklists (use before save and when reviewing output)

**Before saving parser code – verify:**

- [ ] Signature is `export default function parse(element, { document })` (not parseBlockName, not parse(document, element))
- [ ] Uses `WebImporter.Blocks.createBlock(document, { name, cells })` (no manual return of { blockName, cells })
- [ ] Calls `element.replaceWith(block)` and does **not** return block/results/cells
- [ ] `name` in createBlock is the **exact** variant name from variantMapping (e.g. `'hero-title'`), no parentheses or Title-Case
- [ ] `/* eslint-disable */` and `/* global WebImporter */` at top of file
- [ ] **Selectors:** Each selector is from actual `parserContext.sourceHtml`; element types/classes match source; fallbacks for variation; comma-separated selectors mutually exclusive (no double-selection). See Section 3.A–3.C.

**When reviewing automatic validation output (markdown) – verify per instance:**

- [ ] **Completeness:** All text, images, videos, links/CTAs, headings from source DOM are present; optional elements (if in source) included
- [ ] **Accuracy:** No extra content; no content from outside the target element; no duplicates; hrefs/src/alt preserved
- [ ] **Structure:** Row count matches block library example; first row is block name; content in correct cells; optional rows correct
- [ ] **Semantics:** Headings/links/images preserved (not flattened to plain text); hierarchy preserved
- [ ] (xwalk only) Field hints present per [xwalk-parser-requirements.md](xwalk-parser-requirements.md)

If any item fails, fix using 7.2 (identify issues and fixes), regenerate, and re-run validation. Do not proceed to next variant until all items pass.

## 6. Write Parser File

`mkdir -p tools/importer/parsers`; write parser code to `tools/importer/parsers/${variantName}.js` via Write tool.

## 7. Parser Validation

**⚠️ CRITICAL VALIDATION PHASE - MANDATORY**

Parser validation runs **automatically** when you save a parser file in `tools/importer/parsers/`. A PostToolUse hook executes the parser against the live source URL and displays the extracted markdown output.

**Automatic Validation Process:**
1. Hook detects a parser file was saved
2. Matches the parser filename to a block in `page-templates.json`
3. Loads the source URL in a browser
4. Finds DOM elements matching the selector from page-templates.json
5. Executes your parser function on those elements
6. Converts the resulting block table to markdown
7. Displays the output for your review

The validation will block until you review the output and either confirm it's correct or fix issues and save again. After 3 attempts, it allows you to proceed.

For xwalk projects, ensure field hints are present per [xwalk-parser-requirements.md](xwalk-parser-requirements.md).

### 7.1 Analyze Markdown Output

Use the **"When reviewing automatic validation output"** checklist in Section 5. For each markdown table instance, go through every item (completeness, accuracy, structure, semantics; xwalk if applicable). All must pass before the parser is valid.

### 7.2 Identify Issues and Fixes

**Missing content** (selector too narrow, wrong conditional, wrong selector in Array.from): broaden selectors, add fallbacks, fix conditionals.  
**Extra content** (selector too broad, overlapping selectors, parent-child in same list): use `:scope >`, make selectors mutually exclusive, use querySelector OR chain.  
**Structure** (wrong rows/columns): align cells array with block library example and description.

**Common fixes:** Selector too specific → add `.cta-secondary, a.button`. Overlapping → use `a.button:not(.cta)` or querySelector OR. Too broad → `:scope > div.hero-content`. Optional element missing → add fallbacks e.g. `img[class*="bg"]`. Wrong rows → combine into one row e.g. `[heading, description, ...buttons]`.

Document issues in validationFeedback (missingContent, extraContent, structureIssues arrays), then regenerate with updated selectors and cells structure; re-validate against source HTML.

### 7.3 Iterate Until Valid

Repeat: save parser → hook runs validation → review markdown output → if issues, document in validationFeedback, apply fixes (7.2), regenerate, save again. After 3 attempts you may proceed; do not complete migration until validation passes for this variant.

### 7.4 Final Validation Confirmation

Once validation passes, document success (parser path, content complete, no extra content, structure matches block library, semantics preserved). **⚠️ DO NOT PROCEED** to next variant or complete migration until parser validation passes for this variant.

**Validation Success Criteria:** Automatic validation produces complete markdown; all source content present, no extra content; structure matches block library; multiple instances (if any) validated; parser handles variations.

## Example Generated Parser (hero-minimal)

```javascript
/* eslint-disable */
/* global WebImporter */
/** Parser for hero-minimal. Base: hero. Source: {url}. Generated: {timestamp} */
export default function parse(element, { document }) {
  const heading = element.querySelector('h1, h2, .hero-heading, [class*="title"]');
  const description = element.querySelector('p, .hero-description, [class*="subtitle"]');
  const ctaLinks = Array.from(element.querySelectorAll('a.cta, a.button, .hero-cta a'));
  const bgImage = element.querySelector('img[class*="background"], img[class*="hero-bg"]');
  const cells = [];
  if (bgImage) cells.push([bgImage]);
  const contentCell = [];
  if (heading) contentCell.push(heading);
  if (description) contentCell.push(description);
  contentCell.push(...ctaLinks);
  cells.push(contentCell);
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-minimal', cells });
  element.replaceWith(block);
}
```

**Parser requirements:** See Section 2 for the four mandatory requirements (signature, createBlock, replaceWith, exact variant name). Also: `/* eslint-disable */` and `/* global WebImporter */` at top; exact variant name in createBlock; cells match block library structure; defensive selectors; preserve semantic HTML; reference elements in cells, not HTML strings.

## Output for This Action

- ✅ **REQUIRED**: Parser files created in `tools/importer/parsers/` directory
- ✅ **REQUIRED**: One parser file per variant: `{variantName}.js`
- ✅ **REQUIRED**: Files contain complete, executable parser functions
- ✅ **REQUIRED**: Parsers are optimized for source HTML but handle common variations

**⚠️ VALIDATION**: Confirm ALL variant parsers are generated before completing migration. Migration is incomplete without parsers.

**Notes:** Use source HTML for structure/classes; markdown example for table structure; block description for semantics. Balance specificity (optimize for source) with fallbacks for variation. Preserve semantic HTML; reference elements in cells. Before considering a parser complete, run through the validation checklists in Section 5 (before save + when reviewing output) and ensure Section 4 validateParserStructure checks would pass. Common mistakes: wrong signature → use `parse(element, { document })`; not createBlock → use `WebImporter.Blocks.createBlock(document, { name, cells })`; returning → use `element.replaceWith(block)`; variant name with parentheses or Title-Case → use exact variant name from variantMapping.
