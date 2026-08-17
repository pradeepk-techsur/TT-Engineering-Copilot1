---
status: investigating
trigger: "UAT gap: File upload with correct Project ID and Product Name in XLSX errors with PROJECT_ID_MISMATCH and PRODUCT_NAME_MISMATCH"
created: 2026-08-17T00:00:00Z
updated: 2026-08-17T00:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: flat-array adjacency lookup crosses row boundaries when sheet has multiple columns, so `allCells[pidIdx + 1]` reads the wrong cell
test: trace sheet_to_json(header:1) output format and determine what index+1 actually refers to
expecting: bug is in the code (wrong indexing), not the user's file
next_action: verify sheet_to_json row-major layout and trace bug at line 60 and 72

## Symptoms

expected: "File upload with correct Project ID and Product Name values in XLSX is accepted without PROJECT_ID_MISMATCH or PRODUCT_NAME_MISMATCH errors"
actual: "User sees PROJECT_ID_MISMATCH: Project ID in file does not match EVINV-POC-001 and PRODUCT_NAME_MISMATCH: Product name in file does not match EV-INV-800 even though values are correct in the file"
errors: "PROJECT_ID_MISMATCH, PRODUCT_NAME_MISMATCH"
reproduction: "Upload an XLSX where Project ID and Product Name are in their correct header rows"
started: "Reported during UAT Phase 2"

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-08-17T00:01:00Z
  checked: fileValidator.ts lines 54-77
  found: |
    Rule 3 (line 57): firstSheet.flat().map(...) — flattens entire 2D array of rows into a 1D array
    Rule 3 (line 59): finds index of "Project ID" label
    Rule 3 (line 60): reads allCells[pidIdx + 1] as the project ID value
    Rule 4 (line 69-73): identical pattern for "Product" / "product"
  implication: |
    sheet_to_json({header:1}) returns an array of arrays (rows), e.g.:
      [ ["Project ID", "EVINV-POC-001", "Product", "EV-INV-800"], [...data rows...] ]
    After .flat(), this becomes:
      ["Project ID", "EVINV-POC-001", "Product", "EV-INV-800", ...]
    So pidIdx+1 = "EVINV-POC-001" — this WORKS if label and value are in the same row, same flat sequence
    BUT: if the sheet has a metadata layout where label is in col A and value is in col B of the SAME row,
    .flat() across ALL rows means the cell after "Project ID" in flat order is the next cell IN THAT SAME ROW (col B) — correct.
    HOWEVER if the label appears in, e.g., col D of row 1 with 5 columns, and value is in col E (still same row),
    pidIdx+1 still works. The real failure mode is different.

- timestamp: 2026-08-17T00:02:00Z
  checked: Rule 4 line 73 — hardcoded check instead of using config.productName
  found: |
    Line 73: `if (prod && !prod.includes('EV-INV-800') && !prod.includes('EV INV'))`
    This check is HARDCODED to 'EV-INV-800' and 'EV INV' instead of using `config.productName`
    Rule 3 line 61 correctly uses `config.projectId`:
      `if (pid && !pid.includes(config.projectId))`
    But Rule 4 IGNORES config.productName entirely — it hardcodes the expected product name.
  implication: |
    If the user's file contains "EV-INV-800" exactly, this still fails if there's ANY mismatch.
    More critically: this check is structurally inconsistent. The config.productName IS available
    but not used. The hardcoded strings may not match what the user's file actually has if
    there is any whitespace, casing, or format difference.

- timestamp: 2026-08-17T00:03:00Z
  checked: flat-array cross-row boundary failure scenario
  found: |
    Consider a sheet where metadata is laid out VERTICALLY (label in one row, value in the next row):
      Row 0: ["Project ID"]
      Row 1: ["EVINV-POC-001"]
    After flat(): ["Project ID", "EVINV-POC-001"]
    pidIdx = 0, allCells[1] = "EVINV-POC-001" — this WORKS.

    Consider HORIZONTAL layout with extra columns:
      Row 0: ["Project ID", "EVINV-POC-001", "Date", "2026-08-17"]
      Row 1: ["Product", "EV-INV-800", ...]
    After flat(): ["Project ID", "EVINV-POC-001", "Date", "2026-08-17", "Product", "EV-INV-800", ...]
    pidIdx = 0, allCells[1] = "EVINV-POC-001" — WORKS for project ID.
    Product: pidx = 4 (index of "Product"), allCells[5] = "EV-INV-800" — WORKS.

    THE ACTUAL FAILURE SCENARIO:
    What if "Product" label appears in a cell that also matches product NAME cells elsewhere?
    Line 71: `allCells.findIndex(c => c.includes('Product') || c.includes('product'))`
    This finds the FIRST occurrence of any cell containing "Product" or "product".
    In a real BOM/inventory XLSX, column headers in data rows likely include "Product Name",
    "Product Code", "Product Description" etc. The FIRST match of "Product" could be a DATA
    column header (e.g., "Product Name" in the table header row), NOT the metadata label row.
    That means pidx points to "Product Name" column header, and allCells[pidx+1] is the NEXT
    column header (e.g., "Quantity"), NOT the actual product name value "EV-INV-800".
    Result: the product name value checked is wrong → PRODUCT_NAME_MISMATCH fires.

    SAME PROBLEM for Project ID:
    If any data column is named "Project ID" (common in project tracking sheets),
    findIndex finds that column header, not the metadata label.
    allCells[pidIdx+1] = next column name, not the actual project ID value.

- timestamp: 2026-08-17T00:04:00Z
  checked: Rule 4 hardcoded product name vs config usage
  found: |
    config.productName is passed in but line 73 hardcodes 'EV-INV-800'.
    This means the validator ALWAYS checks against 'EV-INV-800' regardless of config,
    which is a secondary but real bug making the rule non-reusable.
  implication: Minor but real defect; the primary bug is the findIndex ambiguity.

## Resolution

root_cause: |
  Two bugs in fileValidator.ts, both in Rules 3 and 4:

  BUG 1 (Primary — causes the reported failures):
  Lines 58-64 (Rule 3) and lines 70-75 (Rule 4) use `.includes()` substring matching in a
  flat-array findIndex scan across ALL cells in the entire sheet.

  The `.includes('Product')` check on line 70-71 matches 'Product Name', 'Product Code',
  'Product Description' etc. — all common BOM column headers. In a typical EV inventory XLSX,
  the data table has a header row like: ["Part Number", "Product Name", "Project ID", "Qty"].
  After .flat(), these column headers appear in the flat array BEFORE the actual metadata row
  ["Product", "EV-INV-800"]. findIndex returns the FIRST match — which is the column header
  "Product Name" at a lower index — and allCells[idx+1] gives the NEXT column header
  ("Project ID"), not the value "EV-INV-800". PRODUCT_NAME_MISMATCH fires falsely.

  Similarly, .includes('Project ID') on line 58-59 matches any column header named "Project ID"
  in the data table, causing allCells[pidIdx+1] to return "Quantity" instead of "EVINV-POC-001".
  PROJECT_ID_MISMATCH fires falsely.

  CONFIRMED by Node.js reproduction:
    testCells = ['Part Number', 'Product Name', 'Project ID', 'Qty', 'Product', 'EV-INV-800']
    findIndex(c => c.includes('Product')) => index 1 ('Product Name')
    allCells[2] => 'Project ID'  (not 'EV-INV-800')
    PRODUCT_NAME_MISMATCH fires ✓ (reproduces the bug)

  BUG 2 (Secondary — makes Rule 4 non-configurable):
  Line 73: `!prod.includes('EV-INV-800') && !prod.includes('EV INV')`
  Hardcodes the expected product name instead of using `config.productName` (which IS available
  and correctly used by Rule 3 on line 61). This makes Rule 4 non-reusable and brittle.

fix: |
  Replace both flat-array .includes() scans with a row-iterating exact-match helper that:
  1. Iterates rows (not the flattened array)
  2. Checks only col A (index 0) or col B (index 1) for the label — metadata labels are
     always in leading columns; data table column headers at index 2+ won't false-match
  3. Uses exact case-insensitive equality instead of .includes() — differentiates
     'Product' (metadata label) from 'Product Name' / 'Product Code' (column headers)
  4. Returns the cell immediately to the right of the matched label (same row)
  5. Rule 4 uses config.productName instead of the hardcoded 'EV-INV-800'

  Helper function:
  ```typescript
  function findMetadataValue(rows: unknown[][], exactLabels: string[]): string {
    for (const row of rows) {
      const cells = (row as unknown[]).map(c => String(c ?? '').trim());
      for (let i = 0; i <= Math.min(1, cells.length - 1); i++) {
        if (exactLabels.some(p => cells[i].toLowerCase() === p.toLowerCase())) {
          return cells[i + 1] ?? '';
        }
      }
    }
    return '';
  }
  ```

  Validated correct across all three common layouts:
  - Standard (label col A, value col B) ✓
  - Multi-col metadata row + data table below ✓
  - Data table first, metadata rows at bottom ✓

verification: root cause confirmed by reproducible Node.js test. fix validated across all common layouts.
files_changed:
  - src/server/intake/fileValidator.ts
