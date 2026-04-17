# excat-import-infrastructure scripts

This directory contains test files for the import infrastructure.

## Parser Validation

Parser validation is handled automatically by a PostToolUse hook. When you save a parser file in `tools/importer/parsers/`, the hook will:

1. Match the parser filename to a block in `page-templates.json`
2. Load the source URL and execute the parser
3. Display the extracted markdown for review

No manual validation commands are needed.

## Examples

Example parsers have been moved to the hooks directory:

```
/excat-marketplace/excat/hooks/import-validator/examples/
```

Local dev equivalent (from repo root):

```
excat-marketplace/excat/hooks/import-validator/examples/
```
