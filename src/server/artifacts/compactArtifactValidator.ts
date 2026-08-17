export interface CompactArtifactValidationResult {
  passed: boolean;
  violations: string[];
  warnings: string[];
}

export function validateCompactArtifact(
  type: 'XLSX' | 'DOCX' | 'PDF',
  rowCount?: number,
  pageCount?: number,
  disclaimerPresent?: boolean,
  provenancePresent?: boolean
): CompactArtifactValidationResult {
  const violations: string[] = [];
  const warnings: string[] = [];

  // CA-04: Disclaimer must be present
  if (!disclaimerPresent) {
    violations.push('CA-04: Synthetic disclaimer not present in artifact');
  }

  // CA-05: Provenance must be present
  if (!provenancePresent) {
    warnings.push('CA-05: Provenance metadata may be missing from artifact');
  }

  if (type === 'XLSX') {
    // CA-01: ≤10 meaningful rows (maxRows = 10)
    if (rowCount !== undefined && rowCount > 10) {
      violations.push(`CA-01: XLSX has ${rowCount} rows; maximum is 10 meaningful data rows`);
    }
  }

  if (type === 'DOCX' || type === 'PDF') {
    // CA-03: ≤2 pages
    if (pageCount !== undefined && pageCount > 2) {
      warnings.push(`CA-03: Document has ~${pageCount} pages; guideline is ≤2 pages`);
    }
  }

  return { passed: violations.length === 0, violations, warnings };
}
