# Generate Import Transformer for Page-Level Transformations

**Purpose**: Reusable JavaScript transformers for global DOM cleanup and modifications before/after block parsing. Output should contain only what authors would edit when creating a page.

## Two Types of Transformers

| Type | Purpose | When | Example |
|------|---------|------|---------|
| **Cleanup** | Remove non-authorable content (headers, footers, sidebars, breadcrumbs, search), widgets, malformed HTML; clean attributes. | Every migration; site-specific. | `{sitename}-cleanup.js` |
| **Section** | Add section breaks (`<hr>`) and section-metadata blocks from template sections. | Only when template has 2+ sections in `page-templates.json`. | `{sitename}-sections.js` |

Both use the same `transform(hookName, element, payload)` signature. Cleanup transformers usually run in both hooks; section transformers run only in `afterTransform` and use `payload.template.sections`. The rest of this doc applies to both unless noted.

## 🚨 DOM-Based Selectors Only

**ALL selectors MUST come from the actual DOM of the page being migrated.** Use the DOM already captured in the migration workflow. Never guess selectors, assume "common" patterns, or invent class/ID names.

**Valid:** Selectors extracted from captured DOM/HTML, page structure analysis, or source HTML inspection.  
**Invalid:** Guessing, assuming from similar sites, or using unverified selectors.

```javascript
// ✅ Document and use what you found in captured DOM
// Found in captured HTML: <div id="CybotCookiebotDialog">
WebImporter.DOMUtils.remove(element, ['#CybotCookiebotDialog']);

// ❌ Never guess
WebImporter.DOMUtils.remove(element, ['#cookie-banner']); // Guessed!
```

Check before manipulating: `if (el) el.remove();` or use `WebImporter.DOMUtils.remove`. Avoid broad selectors (e.g. `'div'`) that remove real content.

## Lifecycle and Reuse

- **Source-site-specific, template-agnostic**: One transformer set per site; reuse across templates.
- **First migration**: Create `{sitename}-cleanup.js` (and others as needed). **Later migrations (same site):** Check `tools/importer/transformers/` first → reuse, augment, or add. Naming: `{sitename}-{purpose}.js` (e.g. `acme-cleanup.js`).

## When to Create Transformers

**Cleanup:** Site-wide non-authorable content (see below), cookie/widgets, malformed HTML, scripts/tracking.  
**Section:** Only when the template has 2+ sections in `page-templates.json` (see Section Transformers below).  
**Do not create for:** Block-specific logic (parsers), single-page fixes (import script), content extraction (parsers), one-offs.

### 🚨 Remove Non-Authorable Content

Cleanup transformers **must remove** any content that is not authorable i.e. what authors would not create or edit when authoring a page. Strip anything added by the site shell/layout so the import contains only page-level authorable content.

**Remove (use selectors from captured DOM):** Headers, footers, breadcrumbs, sidebars, search, main/utility nav, and any global chrome. **Rule of thumb:** If an author wouldn’t type or configure it when creating a new page, remove it.

## Function Structure

1. **Signature:** `export default function transform(hookName, element, payload)`
2. **Hooks:** Use `if (hookName === 'beforeTransform')` and `if (hookName === 'afterTransform')`; no logic outside hooks.
3. **In-place only:** Modify DOM; no return statements.
4. **Selectors:** Only from captured DOM.

**Template:**

```javascript
/* eslint-disable */
/* global WebImporter */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Before block parsing: cookie banners, overlays, fix HTML, scrolling
    // ⚠️ All selectors from captured DOM
    WebImporter.DOMUtils.remove(element, ['#cookie-consent', '.chat-widget']);
  }
  if (hookName === TransformHook.afterTransform) {
    // After block parsing: non-authorable (header, footer, sidebar, breadcrumbs, search), then attributes/elements
    WebImporter.DOMUtils.remove(element, ['header', 'footer', '.breadcrumb', 'aside.sidebar', 'iframe', 'link']);
  }
}
```

## Hook Timing

| Hook | Use for |
|------|--------|
| **beforeTransform** | Elements blocking parsing (modals, overlays), broken HTML, overflow, anything affecting block matching |
| **afterTransform** | Non-authorable content (headers, footers, sidebars, breadcrumbs, search, nav), leftover elements, attribute cleanup, iframes/videos |

**Rule:** Affects block parsing? → beforeTransform. Otherwise → afterTransform.

## Common Patterns (selectors from captured DOM)

- **Cookie/widgets (beforeTransform):** `WebImporter.DOMUtils.remove(element, ['#CybotCookiebotDialog', '.gdpr-banner'])`
- **Non-authorable (afterTransform):** Remove `header`, `footer`, `[class*="breadcrumb"]`, `[id*="sidebar"]`, `.site-search`, `nav` (or site-specific selectors).
- **Attributes (afterTransform):** `el.removeAttribute('onclick')` / `removeAttribute('data-track')` on `querySelectorAll('*')` where present in DOM.
- **Safe element removal (afterTransform):** `source`, `iframe`, `link`, `noscript`.
- **Nested spans (beforeTransform, if present in DOM):** `span > span:only-child` → `span.replaceWith(span.textContent)`.
- **Overflow (beforeTransform, if needed):** `element.style.overflow === 'hidden'` → set to `scroll`.

## Section Transformers (Section Breaks and Section Metadata)

**Type:** Section transformer (see table above). **When:** Only if `template.sections && template.sections.length > 1` in page-templates.  
**Where:** Separate file (e.g. `{sitename}-sections.js`). Runs in `afterTransform` only.  
**What:** From `payload.template.sections` — for each section (reverse order): create section-metadata block via `WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { 'style': section.style } })` when `section.style` is set; insert `<hr>` before section when not the first and when there is content before it. Use template section selectors to find first element per section. Reference: [Section Metadata](https://www.aem.live/developer/block-collection/section-metadata), [Blocks.js](https://github.com/adobe/helix-importer/blob/main/src/utils/Blocks.js#L23). Generate full implementation from template sections or reuse existing `sections.js`-style logic.

**Validation:** For section transformers only (and when the template has 2+ sections), the validator runs **section validation**. See **Section validation** under Transformer Validation.

## Augmenting Existing Transformers

Same site, new template: add new selectors to existing transformer (from captured DOM). Different site or unrelated need: new file.

```javascript
// Add to existing beforeTransform (selectors from new template’s captured DOM):
WebImporter.DOMUtils.remove(element, ['#cookie-consent', '.social-share-widget']);
```

## Transformer structure validation (run before save)

Run the following on the code **before** writing the file. The hook then performs runtime validation (removed/added elements; section validation for section transformers).

```javascript
// 🚨 Mandatory validation function – run on transformer code before writing the file
function validateTransformerStructure(code) {
  // Requirement #1: Check function signature
  const hasSignature = /export\s+default\s+function\s+transform\s*\(\s*hookName\s*,\s*element\s*,\s*payload\s*\)/.test(code);
  if (!hasSignature) {
    throw new Error('CRITICAL: Transformer must use signature: export default function transform(hookName, element, payload)');
  }

  // Requirement #2: Check hook conditionals (at least one of beforeTransform / afterTransform)
  if (!code.includes('beforeTransform') && !code.includes('afterTransform')) {
    throw new Error('CRITICAL: Transformer must use beforeTransform and/or afterTransform hook conditionals');
  }

  // Requirement #3: No return of a value (in-place DOM only)
  if (code.match(/return\s+(element|payload|document|main)/)) {
    throw new Error('CRITICAL: Transformer must NOT return a value; modify DOM in place only');
  }
}
```

Run `validateTransformerStructure(transformerCode)` before writing to `tools/importer/transformers/{name}.js`. The hook then runs the transformer against a live URL and shows removed/added elements (and section validation for section transformers).

## Validation checklists (use before save and when reviewing output)

**Before saving transformer code – verify:**

- [ ] Signature is `export default function transform(hookName, element, payload)` (not `(element, hookName)` or other order)
- [ ] Uses `if (hookName === 'beforeTransform')` and/or `if (hookName === 'afterTransform')`; no logic outside hook conditionals
- [ ] Modifies DOM in place only; no return statements (no `return` of values)
- [ ] `/* eslint-disable */` and `/* global WebImporter */` at top of file
- [ ] **Selectors:** Every selector is from captured DOM of the page being migrated; none guessed or assumed. See "DOM-Based Selectors Only" above.
- [ ] Non-authorable content (header, footer, sidebar, breadcrumbs, search, nav, cookie/widgets) is removed where intended; no authorable content removed
- [ ] File is in `tools/importer/transformers/` and named `{sitename}-{purpose}.js`

**When reviewing automatic validation output (list of removed/added elements or error) – verify:**

- [ ] **Success:** Validator reports success; no thrown errors
- [ ] **Removed list:** The "Elements removed by transformer" list matches what you intended (only non-authorable content: header, footer, nav, sidebar, breadcrumbs, cookie/widgets, etc.)
- [ ] **No authorable loss:** No authorable content appears in the removed list (e.g. no main content blocks, article body, or author-created sections)
- [ ] **Added list (if any):** Any "Elements added" are expected (e.g. section-metadata blocks, `<hr>` from section transformers)
- [ ] **Section validation (if shown):** When the validator displays a "Section validation" block (section transformer + template with 2+ sections), both section breaks and Section Metadata must show ✓. If ✗, see **Identify issues and fixes** below.

If any item fails, apply fixes using the **Identify issues and fixes** subsection below, then save again to re-run validation. Do not proceed until validation passes.

## Transformer Validation

**⚠️ CRITICAL VALIDATION PHASE - MANDATORY**

Transformer validation runs **automatically** when you save a transformer file in `tools/importer/transformers/`. A PostToolUse hook runs the transformer against a live URL from `page-templates.json` and displays the result for your review.

**Automatic Validation Process:**
1. Hook detects a transformer file was saved
2. Reads `page-templates.json` and selects a test URL (e.g. first template’s first URL)
3. Loads the URL in a browser
4. Injects helix-importer and the matching template data
5. Runs your `transform('beforeTransform', main, payload)` then `transform('afterTransform', main, payload)`
6. Diffs the DOM under `main` before vs after and builds a list of **elements removed** and **elements added** (by tag, id, and class)
7. If the transformer is a **section transformer** (script uses `template.sections` / `payload.template.sections`) and the template has 2+ sections, runs **section validation**: compares actual count of `<hr>` and Section Metadata blocks to the expected counts from the template
8. Displays the removed/added lists, section validation (only for section transformers when template has sections), and any error for your review

Review the output; confirm or fix and save again. Do not consider the transformer complete until validation passes.

### Analyze validation output

Use the **"When reviewing automatic validation output"** checklist above. Confirm success, removed list contains only non-authorable content, and no authorable content removed. If a Section validation block was shown, confirm both section breaks and Section Metadata show ✓. All items must pass before the transformer is valid.

### Section validation

When the file is a **section transformer** (uses `template.sections` or `payload.template.sections`) and the template has **2+ sections**, the validator runs section validation and reports:

- **Section breaks (`<hr>`):** Expected count = `sections.length - 1` (one `<hr>` before each section except the first). Actual = number of `<hr>` elements under `main`. If actual &lt; expected, the section transformer may not be inserting `<hr>` for every non-first section (e.g. a section selector didn’t match, or the insert logic was skipped).
- **Section Metadata blocks:** Expected count = number of sections that have a `style` property. Actual = number of blocks (tables) whose first row is "Section Metadata". If actual &lt; expected, the section transformer may not be calling `WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style: section.style } })` for every section with a style, or the section selector didn’t match.

Fix failures using **Identify issues and fixes** below.

### Identify issues and fixes

**Errors or no effect:** Signature wrong → use `transform(hookName, element, payload)`. Hook names wrong → use `'beforeTransform'` and `'afterTransform'` (string match). Returning a value → remove any `return`; modify DOM in place only.  
**Wrong removals:** Selector too broad (removed authorable content) → narrow selectors, use `:scope >` or more specific classes from captured DOM. Selector too narrow (left non-authorable content) → add selectors from captured DOM, document source in comments.  
**Missing or wrong hook:** Logic that should run before block parsing → put in `beforeTransform`. Logic for final cleanup/sections → put in `afterTransform`.  
**Section validation ✗:** Section breaks or Section Metadata count below expected → ensure section selectors in the transformer match elements on the test page (from captured DOM); process sections in reverse order; for each section with `section.style`, call `WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style: section.style } })` and insert after the section element; for each non-first section, insert `<hr>` before the section element.

Document issues, then apply fixes and save again to re-run validation.

### Iterate until valid

Repeat: save transformer → hook runs validation → review list of removed/added elements (or error) → if issues, apply fixes (see **Identify issues and fixes** above), save again. Do not complete migration or add more transformers until validation passes for this file.

### Final validation confirmation

Once validation passes, treat as valid. **⚠️ DO NOT PROCEED** to use this transformer in import scripts until automatic validation passes.

**Validation Success Criteria:** Validation reports success; removed list = only non-authorable content; no authorable content removed; added elements expected; if section validation ran, both ✓; no errors; selectors from captured DOM.

**Manual checks (optional):** The hook covers structure and runtime validation. You can additionally run a quick syntax check and the full import pipeline:
```bash
node --check tools/importer/transformers/{name}.js
node tools/importer/import.js   # or import-{template}.js  – full import with this transformer
```

## Common Mistakes

- Wrong signature order: `(hookName, element, payload)` not `(element, hookName)`.
- Returning from transform; use in-place DOM changes only.
- Running logic in both hooks: always guard with `if (hookName === 'beforeTransform')` / `'afterTransform'`.
- Guessing selectors; always take from captured DOM and document in comments.

## Transformer vs. Parser vs. Import Script

| Task | Use |
|------|-----|
| Cookie banners, headers/footers/sidebars/breadcrumbs, malformed HTML (site-wide) | **Transformer** |
| Block-specific extraction (hero, accordion, etc.) | **Parser** |
| Paths, orchestration, template-specific flow | **Import Script** |

## Best Practices

1. Selectors from captured DOM only; document source in comments.
2. Correct signature and hooks; no return; test on multiple pages; name `{sitename}-{purpose}.js`.
3. Check existing transformers before creating new ones.

## Short Example

```javascript
/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: {sitename} cleanup. Selectors from captured DOM.
 */
const H = { before: 'beforeTransform', after: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === H.before) {
    WebImporter.DOMUtils.remove(element, ['#onetrust-consent-sdk', '[class*="cookie"]', '#drift-widget']);
    const nested = element.querySelectorAll('span > span:only-child');
    nested.forEach(span => span.replaceWith(span.textContent));
  }
  if (hookName === H.after) {
    WebImporter.DOMUtils.remove(element, ['header', 'footer', '.breadcrumb', 'aside.sidebar', 'iframe', 'link', 'noscript']);
    element.querySelectorAll('*').forEach(el => { el.removeAttribute('data-track'); el.removeAttribute('onclick'); });
  }
}
```

## Output for This Action

- ✅ Transformer file(s) in `tools/importer/transformers/`: `{sitename}-cleanup.js`, and if needed `{sitename}-sections.js`
- ✅ Correct signature and hooks; selectors from captured DOM; no return; validation passes (removed/added list and, for section transformers, section validation ✓)

**Notes:** Run `validateTransformerStructure` before save; use validation checklists when reviewing hook output. Common mistakes: wrong signature order, returning a value, guessing selectors.
