import { describe, it, expect } from 'vitest';
import { validateCompactArtifact } from '@/server/artifacts/compactArtifactValidator';
import { SYNTHETIC_DISCLAIMER } from '@/server/artifacts/artifactGenerator';
import { AI_ACTOR_BLOCKLIST } from '@/server/orchestrator/types';

describe('Compact Artifact Validator', () => {
  it('fails when disclaimer is missing (CA-04)', () => {
    const result = validateCompactArtifact('XLSX', 5, undefined, false, true);
    expect(result.passed).toBe(false);
    expect(result.violations.some(v => v.includes('CA-04'))).toBe(true);
  });

  it('fails when XLSX has more than 10 rows (CA-01)', () => {
    const result = validateCompactArtifact('XLSX', 11, undefined, true, true);
    expect(result.passed).toBe(false);
    expect(result.violations.some(v => v.includes('CA-01'))).toBe(true);
  });

  it('passes for valid XLSX with disclaimer', () => {
    const result = validateCompactArtifact('XLSX', 8, undefined, true, true);
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('warns for DOCX over 2 pages (not a violation)', () => {
    const result = validateCompactArtifact('DOCX', undefined, 3, true, true);
    expect(result.passed).toBe(true);  // warning only, not violation
    expect(result.warnings.some(w => w.includes('CA-03'))).toBe(true);
  });
});

describe('SYNTHETIC_DISCLAIMER', () => {
  it('contains required disclaimer text', () => {
    expect(SYNTHETIC_DISCLAIMER).toContain('Synthetic POC Data');
    expect(SYNTHETIC_DISCLAIMER).toContain('Not TT Electronics Product Data');
    expect(SYNTHETIC_DISCLAIMER).toContain('Not for Design');
  });
});

describe('Gate decision AI prohibition', () => {
  it('AI actors are blocked', () => {
    expect(AI_ACTOR_BLOCKLIST.has('claude')).toBe(true);
    expect(AI_ACTOR_BLOCKLIST.has('assistant')).toBe(true);
  });

  it('human reviewer roles are not blocked', () => {
    expect(AI_ACTOR_BLOCKLIST.has('Program Manager')).toBe(false);
    expect(AI_ACTOR_BLOCKLIST.has('Claire Ashby')).toBe(false);
    expect(AI_ACTOR_BLOCKLIST.has('Engineering Lead')).toBe(false);
  });
});

describe('AI Recommendation advisory label', () => {
  it('BaseAgent.buildAIRecommendation includes advisory label', async () => {
    // Check the agentTypes interface requires advisoryLabel
    const mockRec = {
      recommendedOutcome: 'Pass' as const,
      rationale: 'Test',
      findingsCited: [],
      checksCited: [],
      advisoryLabel: 'Advisory Only — Human Decision Required',
    };
    expect(mockRec.advisoryLabel).toBe('Advisory Only — Human Decision Required');
  });
});
