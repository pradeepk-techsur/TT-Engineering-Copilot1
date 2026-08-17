import { ValidationResult, ValidationIssue } from './types';
import * as XLSX from 'xlsx';

interface FileValidatorConfig {
  acceptedFormats: string[];             // e.g. ['.xlsx', '.csv']
  requiredSections?: string[];           // section/sheet/column names
  projectId?: string;                    // 'EVINV-POC-001'
  productName?: string;                  // 'EV-INV-800'
  phaseId?: number;
  maxRows?: number;                      // default 10
  maxPages?: number;                     // default 2
}

/**
 * Searches rows for a metadata label in col A or col B (index 0-1) using
 * exact case-insensitive equality, then returns the value in the adjacent cell
 * (same row, next column). Ignores data-table column headers that only partially
 * match (e.g. "Product Name" will NOT match exactLabel "Product").
 */
function findMetadataValue(rows: unknown[][], exactLabels: string[]): string {
  for (const row of rows) {
    const cells = (row as unknown[]).map(c => String(c ?? '').trim());
    // Only check leading columns (index 0 and 1) — metadata labels are always in col A or B
    for (let i = 0; i <= Math.min(1, cells.length - 2); i++) {
      if (exactLabels.some(label => cells[i].toLowerCase() === label.toLowerCase())) {
        return cells[i + 1] ?? '';
      }
    }
  }
  return '';
}

export async function validateUploadedFile(
  buffer: Buffer,
  fileName: string,
  config: FileValidatorConfig
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Rule 1: file_type
  const ext = '.' + fileName.split('.').pop()?.toLowerCase();
  if (!config.acceptedFormats.includes(ext)) {
    issues.push({
      code: 'FILE_TYPE_INVALID',
      message: `File type "${ext}" not accepted. Supported formats: ${config.acceptedFormats.join(', ')}.`,
      field: 'file_type',
    });
    return { passed: false, issues, warnings };
  }

  // Rule 2: parseability
  let parsedContent: { sheets?: Record<string, unknown[][]>; text?: string } = {};
  try {
    if (['.xlsx', '.csv'].includes(ext)) {
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const sheets: Record<string, unknown[][]> = {};
      wb.SheetNames.forEach(name => {
        sheets[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1 });
      });
      parsedContent = { sheets };
    } else if (['.pdf', '.docx'].includes(ext)) {
      // Basic parseability: non-empty buffer, valid header bytes
      if (buffer.length < 4) throw new Error('Too short');
      if (ext === '.pdf' && buffer.slice(0, 4).toString() !== '%PDF') throw new Error('Not a PDF');
      parsedContent = { text: 'parsed' }; // Simplified for framework
    }
  } catch (e) {
    issues.push({ code: 'FILE_NOT_PARSEABLE', message: 'The uploaded file could not be parsed. Please check the file and try again.' });
    return { passed: false, issues, warnings };
  }

  // Rule 3: project_id_field — exact-match label in col A/B, read adjacent value
  if (parsedContent.sheets && config.projectId) {
    const firstSheet = Object.values(parsedContent.sheets)[0] as unknown[][];
    const pid = findMetadataValue(firstSheet, ['Project ID', 'project_id', 'ProjectID']);
    if (pid && !pid.toLowerCase().includes(config.projectId.toLowerCase())) {
      issues.push({ code: 'PROJECT_ID_MISMATCH', message: `Project ID in file does not match ${config.projectId}.`, field: 'project_id' });
    }
  }

  // Rule 4: product_name_field — exact-match label in col A/B, compare against config.productName
  if (parsedContent.sheets && config.productName) {
    const firstSheet = Object.values(parsedContent.sheets)[0] as unknown[][];
    const prod = findMetadataValue(firstSheet, ['Product', 'product', 'Product Name', 'ProductName']);
    if (prod && !prod.toLowerCase().includes(config.productName.toLowerCase())) {
      issues.push({ code: 'PRODUCT_NAME_MISMATCH', message: `Product name in file does not match ${config.productName}.`, field: 'product_name' });
    }
  }

  // Rule 5: revision_field — check for revision/version field presence
  if (parsedContent.sheets) {
    const allCells = Object.values(parsedContent.sheets).flat(2).map(c => String(c ?? '').toLowerCase());
    const hasRevision = allCells.some(c => c.includes('revision') || c.includes('version') || c.includes('rev'));
    if (!hasRevision) {
      issues.push({ code: 'REVISION_MISSING', message: 'Revision or version field not found in document.', field: 'revision' });
    }
  }

  // Rule 6: row_count_guidance (XLSX/CSV warning only)
  if (parsedContent.sheets) {
    const maxRows = config.maxRows ?? 10;
    for (const [sheetName, rows] of Object.entries(parsedContent.sheets)) {
      const dataRows = (rows as unknown[][]).slice(1); // exclude header
      if (dataRows.length > maxRows) {
        warnings.push({ code: 'ROW_COUNT_WARNING', message: `Sheet "${sheetName}" has ${dataRows.length} data rows; guideline is ≤${maxRows}.`, field: 'row_count' });
      }
    }
  }

  // Rule 7: identifier_uniqueness (XLSX — check first column IDs)
  if (parsedContent.sheets) {
    const firstSheet = Object.values(parsedContent.sheets)[0] as unknown[][];
    const ids = firstSheet.slice(1).map(row => String((row as unknown[])[0] ?? '')).filter(Boolean);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      issues.push({ code: 'DUPLICATE_IDENTIFIERS', message: 'Duplicate row identifiers found in first column.', field: 'identifiers' });
    }
  }

  // Rule 8: required_sections
  if (config.requiredSections && config.requiredSections.length > 0) {
    if (parsedContent.sheets) {
      const sheetNames = Object.keys(parsedContent.sheets);
      const allCells = Object.values(parsedContent.sheets).flat(2).map(c => String(c ?? '').toLowerCase());
      for (const section of config.requiredSections) {
        const found = sheetNames.some(s => s.toLowerCase().includes(section.toLowerCase())) ||
                      allCells.some(c => c.includes(section.toLowerCase()));
        if (!found) {
          issues.push({ code: 'REQUIRED_SECTION_MISSING', message: `Required section "${section}" not found in uploaded file.`, field: section });
        }
      }
    }
  }

  // Rule 9: unit_presence — check numeric values have nearby unit strings (simplified heuristic)
  // For POC: warn only if no unit-like strings found alongside numbers
  // (Full implementation would parse each cell and check adjacent cell)

  return {
    passed: issues.length === 0,
    issues,
    warnings,
  };
}
