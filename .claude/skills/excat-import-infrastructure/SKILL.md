---
name: excat-import-infrastructure
description: Creates import infrastructure (block parsers, page transformers) for content import operations. Focuses on parser and transformer generation - page templates are handled separately by excat-site-analysis and block-mapping-manager skills.
---

# Import Infrastructure Orchestrator

## Complete Workflow Checklist

**⛔ All steps are REQUIRED - follow in order:**

- [ ] **STEP 1: Generate Import Transformers**
- [ ] **STEP 2: Generate Block Parsers**
- [ ] **STEP 3: Final Verification**

**⛔ DO NOT proceed to next step until current step is complete.**

## Overview

This skill generates parsers and transformers for AEM content migration. This infrastructure enables automated content import workflows across multiple pages.

**Note:** Page templates are handled separately by:
- `excat-site-analysis` - Creates template skeletons
- `block-mapping-manager` - Populates block mappings

**Prerequisites:**
- Block variants identified (in authoring-analysis.json)
- Section identification completed
- Block variant mapping available 
- Source HTML and DOM selectors available for each block
- `tools/importer/page-templates.json` exists (created by excat-site-analysis)

**DO:**
- ✅ Generate transformers for site-wide DOM cleanup
- ✅ Generate parser functions for all block variants
- ✅ Review automatic validation output (hook runs on each save)
- ✅ Iterate until validation passes

**DON'T:**
- ❌ Generate page-templates.json (handled by other skills)
- ❌ Generate analysis reports
- ❌ Create documentation files unless explicitly requested
- ❌ Skip validation - parsers must be tested before completion
- ❌ Skip transformer generation
- ❌ Create transformers for block-specific tasks (use parsers)

**Key Differences: Transformers vs. Parsers**

| Aspect | Transformers | Parsers |
|--------|-------------|---------|
| **Scope** | Entire DOM | Single block element |
| **Purpose** | Cleanup, removal, fixing | Convert HTML to AEM table format |
| **Timing** | Before/after parsing | During block processing |
| **Output** | Modified DOM (in-place) | Table cell array |
| **Location** | `tools/importer/transformers/` | `tools/importer/parsers/` |

## Complete Workflow

### STEP 1: Generate Import Transformers

Create transformer functions for site-wide DOM cleanup and section management.

```bash
mkdir -p tools/importer/transformers
```

**⚠️ CRITICAL: Follow the complete transformer generation guide:** `./references/generate-import-transformer.md`

**1.1: Generate Site-Wide Cleanup Transformers**

Create transformers for site-wide DOM cleanup (cookie banners, consent dialogs, etc.).

**1.2: Check for Sections and Generate Section Transformer**

Check if the template has sections defined in `page-templates.json`:

```bash
# Check if template has sections
cat tools/importer/page-templates.json | jq '.templates[] | select(.name == "template-name") | .sections'
```

**If template has 2+ sections:**
- Generate section transformer (see `./references/generate-import-transformer.md` Pattern 7 for section transformer pattern)
- **Transformer filename:** Use `sections.js` or `<sitename>-sections.js` to match cleanup transformer naming pattern
- This transformer will:
  - Add section breaks (`<hr>`) before each section (except first, and only if there's content before it)
  - Add section-metadata blocks using `WebImporter.Blocks.createBlock()` for each section
  - Run in `afterTransform` hook (after block parsing, before the final metadata `<hr>` added by import script)

**If template has 0-1 sections:**
- Skip section transformer generation (no sections to process)

**Success:**
- [ ] Transformer files created in `tools/importer/transformers/`
- [ ] Transformers handle site-wide DOM cleanup (not block-specific)
- [ ] Section transformer (e.g., `<sitename>-sections.js` or `sections.js`) generated if template has 2+ sections

---

### STEP 2: Generate Block Parsers

```bash
mkdir -p tools/importer/parsers
```

**⚠️ CRITICAL: Follow the complete parser generation guide:** `./references/generate-import-parser.md`

This guide includes:
- Parser generation requirements and templates (Sections 1-6)
- Validation requirements (automatic via hook on save)
- Iterative validation workflow (Section 8)

**CRITICAL REQUIREMENTS**:
- ✅ **MANDATORY for EVERY migration** - No exceptions
- ✅ **MUST generate parsers for ALL variants** (both newly created and reused)
- ✅ **MUST validate EVERY parser** - See Section 7-8 of the guide
- ❌ **Migration is INCOMPLETE without validated parsers**

**Success:**
- [ ] Parser file exists for EVERY block variant
- [ ] All parsers validated and passing (automatic validation on save)

---

### STEP 3: Final Verification

**3.1 Verify all files generated:**

```bash
# Required files
ls -la tools/importer/parsers/
ls -la tools/importer/transformers/
```

**3.2 Run comprehensive validation:**

```bash
# Validate all parsers exist and have correct syntax
for parser in tools/importer/parsers/*.js; do
  echo "Checking syntax: $parser"
  node --check "$parser" || exit 1
done

# Validate all transformers exist and have correct syntax  
for transformer in tools/importer/transformers/*.js; do
  echo "Checking syntax: $transformer"
  node --check "$transformer" || exit 1
done

echo "✅ All files have valid syntax"
```

**3.3 Validation evidence checklist:**

- [ ] `tools/importer/parsers/${variant}.js` file exists for EVERY block variant
- [ ] Each parser validated automatically on save (produces complete markdown)
- [ ] All validation output reviewed and confirmed complete
- [ ] No parser validation errors or missing content issues
- [ ] All transformers validated and passing syntax checks

**3.4 Report validation results:**

Summarize validation directly in your response (do not create documentation files unless explicitly requested):
- Number of parsers validated
- Number of transformers validated
- Any failures and how they were fixed
- Final pass/fail status

**3.5 Verify no import.js was created:**

```bash
# Check for import.js (should NOT exist)
ls tools/importer/import.js 2>/dev/null && echo "❌ ERROR: import.js should not exist" || echo "✅ No import.js found"
```

**⚠️ CRITICAL**: An `import.js` file should **NOT** be generated in `tools/importer/`. The import infrastructure consists of:
- ✅ `page-templates.json` (created by excat-site-analysis)
- ✅ `parsers/*.js` (individual parser files for each block variant)
- ✅ `transformers/*.js` (transformer files for DOM cleanup)
- ❌ `import.js` (should NOT exist - this is generated by a separate skill)

If `import.js` exists, it indicates a workflow mismatch. Do not delete files automatically.
Instead:
- Report the unexpected file to the user
- Confirm whether to keep or remove it
- If removal is approved, remove it explicitly as a user-confirmed action

---

## Reference Documentation

- **`./references/generate-import-transformer.md`** - Complete transformer generation guide
- **`./references/generate-import-parser.md`** - Complete parser generation guide with validation

**Note:** Parser validation runs automatically via a PostToolUse hook when parser files in `tools/importer/parsers/` are saved.

## Related Skills

- **`excat-site-analysis`** - Creates template skeletons (name, URLs, description)
- **`block-mapping-manager`** - Populates block mappings with DOM selectors
- **`excat-import-script`** - Generates import.js from templates and parsers

## Integration with Orchestrators

This skill is invoked by `excat-site-migration` at **Step 5: Import Infrastructure** (after page analysis and block mapping).
It is **not** invoked by `excat-page-analysis`, which is analysis-only.

**Input:**
- Authoring analysis with variant names (from `migration-work/authoring-analysis.json`)
- cleaned.html (from `migration-work/cleaned.html`)

**Output:**
- `tools/importer/parsers/*.js` (one per block variant)
- `tools/importer/transformers/*.js` (site-wide cleanup)

**Prerequisite from earlier steps:**
- `tools/importer/page-templates.json` should already exist (from block-mapping-manager in Step 5)
