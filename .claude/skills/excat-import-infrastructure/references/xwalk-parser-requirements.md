# Xwalk Parser Requirements (Optional)

**When this applies:** Check `.migration/project.json`. If `type !== "xwalk"`, skip this document entirely.

For **xwalk** projects, parser generation has additional requirements described below. See [generate-import-parser.md](generate-import-parser.md) for the main parser generation workflow.

---

## 1. Before Generating Any Parser

Before generating ANY parser for a xwalk project:

1. Read `.migration/project.json` to confirm project type is `"xwalk"`.
2. **MUST** read [hinting.md](../../excat-xwalk-expert/resources/hinting.md) FIRST.
3. DO NOT proceed until hinting.md has been read.
4. Ensure all generated parsers add field hint comments as specified in hinting.md.

---

## 2. Field Hinting

For xwalk projects, parsers must insert **field hints** as HTML comments to enable Universal Editor integration. Follow the complete field hinting and validation guidelines in [hinting.md](../../excat-xwalk-expert/resources/hinting.md).

---

## 3. Cells and Rows

- You must generate **all required columns and rows** from the block library; they can have no content, but the cell/row must exist.
- Follow the Block Library design/description for the block to understand what rows/columns the data is pushed into. This is critical for xwalk.

---

## 4. Parser Generation: UE Model

When assembling the parser:

- Check `.migration/project.json` to determine if project type is `"xwalk"`.
- If xwalk, read the block's model file: `blocks/<blockName>/_<blockName>.json`.
- This model defines field names needed for `<!-- field:fieldName -->` hints.
- Pass the UE model into parser assembly so that field hints can be generated (use `null` for non-xwalk projects).

---

## 5. Validation

When validating parser output (e.g. automatic validation on save), ensure that field hints are present in the markdown output as described in [hinting.md](../../excat-xwalk-expert/resources/hinting.md).
