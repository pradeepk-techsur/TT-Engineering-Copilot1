import { describe, it, expect } from 'vitest';
import { validateUploadedFile } from '@/server/intake/fileValidator';
import { assertNoProhibitedLabels } from '@/server/intake/intakeAudit';
import { handleSampleIngest } from '@/server/intake/siHandler';
import * as XLSX from 'xlsx';

function makeXlsxBuffer(rows: (string | number)[][]): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

describe('File Validator', () => {
  it('rejects unsupported file type', async () => {
    const result = await validateUploadedFile(Buffer.from(''), 'test.txt', {
      acceptedFormats: ['.xlsx'],
    });
    expect(result.passed).toBe(false);
    expect(result.issues[0].code).toBe('FILE_TYPE_INVALID');
  });

  it('accepts valid XLSX', async () => {
    const buf = makeXlsxBuffer([
      ['ID', 'Requirement', 'Revision'],
      ['REQ-001', 'Power output ≥150kW', 'Rev A'],
    ]);
    const result = await validateUploadedFile(buf, 'test.xlsx', {
      acceptedFormats: ['.xlsx'],
      maxRows: 10,
    });
    expect(result.passed).toBe(true);
  });

  it('warns when row count exceeds 10', async () => {
    const rows: (string | number)[][] = [['ID', 'Value', 'Revision']];
    for (let i = 1; i <= 12; i++) rows.push([`REQ-${i.toString().padStart(3, '0')}`, `Value ${i}`, 'Rev A']);
    const buf = makeXlsxBuffer(rows);
    const result = await validateUploadedFile(buf, 'test.xlsx', {
      acceptedFormats: ['.xlsx'],
      maxRows: 10,
    });
    expect(result.warnings.some(w => w.code === 'ROW_COUNT_WARNING')).toBe(true);
    expect(result.passed).toBe(true); // warning, not rejection
  });

  it('rejects duplicate identifiers', async () => {
    const buf = makeXlsxBuffer([
      ['ID', 'Name'],
      ['REQ-001', 'First'],
      ['REQ-001', 'Duplicate'],
    ]);
    const result = await validateUploadedFile(buf, 'test.xlsx', {
      acceptedFormats: ['.xlsx'],
    });
    expect(result.issues.some(i => i.code === 'DUPLICATE_IDENTIFIERS')).toBe(true);
  });
});

describe('Prohibited Labels', () => {
  it('throws on "Connected to [SYSTEM]"', () => {
    expect(() => assertNoProhibitedLabels('Connected to Salesforce')).toThrow('PROHIBITED_LABEL_DETECTED');
  });

  it('throws on "replacement input"', () => {
    expect(() => assertNoProhibitedLabels('Please provide a replacement input')).toThrow('PROHIBITED_LABEL_DETECTED');
  });

  it('throws on "Live " prefix', () => {
    expect(() => assertNoProhibitedLabels('Live Cora Data available')).toThrow('PROHIBITED_LABEL_DETECTED');
  });

  it('allows correct labels', () => {
    expect(() => assertNoProhibitedLabels('Simulated Connector — Preloaded Synthetic Sample')).not.toThrow();
    expect(() => assertNoProhibitedLabels('Upload Revised Version')).not.toThrow();
  });
});

describe('SI Auto-Ingest Prevention', () => {
  it('throws AUTO_INGEST_PROHIBITED when confirmViewed is false', async () => {
    await expect(handleSampleIngest(0, 'internal', false)).rejects.toThrow('AUTO_INGEST_PROHIBITED');
  });
});
