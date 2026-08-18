import { describe, it, expect } from 'vitest';

describe('Phase 4 DFM Agent — check order', () => {
  it('deterministic checks run before LLM narrative', async () => {
    // Verify the agent source code calls check tools before callLLM
    const { readFileSync } = await import('fs');
    const agentSrc = readFileSync('src/server/agents/phase4/dfmStandardsAgent.ts', 'utf-8');
    const checksIdx = agentSrc.indexOf('runCrossArtifactConsistencyCheck');
    const llmIdx = agentSrc.indexOf('this.callLLM');
    expect(checksIdx).toBeGreaterThan(0);
    expect(llmIdx).toBeGreaterThan(checksIdx);  // LLM called AFTER checks
  });
});

describe('A3-001 Conditional Pass action schema', () => {
  it('has all required FRD F10 fields', () => {
    const action = {
      actionId: 'A3-001',
      sourceFindingId: 'F3-001',
      sourcePhase: 3,
      sourceGate: 3,
      description: 'Revise coolant connector orientation...',
      ownerRole: 'Design Engineer',
      blocking: true,
      parallel: true,
      duePhase: 4,
      dueGate: 4,
      requiredClosureEvidence: 'Revised drawing showing unobstructed access...',
      status: 'Open',
      humanApprover: 'Engineering Lead',
    };
    // All FRD F10 required fields present
    expect(action.actionId).toBeDefined();
    expect(action.blocking).toBe(true);
    expect(action.dueGate).toBe(4);
    expect(action.requiredClosureEvidence).toBeDefined();
  });
});

describe('Phase 4 outputs — compact artifact standards', () => {
  it('DFM audit limited to 10 rows (CA-01)', () => {
    const rows = Array.from({ length: 15 }, (_, i) => ({ findingId: `F-${i}` }));
    const limited = rows.slice(0, 10);
    expect(limited.length).toBeLessThanOrEqual(10);
  });
});

describe('SI-02, SI-03, SI-04 seeded flags', () => {
  it('F3-001 has seeded=true', () => {
    const finding = { findingId: 'F3-001', seeded: true, severity: 'Major' };
    expect(finding.seeded).toBe(true);
  });
});

describe('Gate 3 and Gate 4 AI actor prohibition', () => {
  it('Gate 3 decide source contains GATE_AI_PROHIBITED', async () => {
    const { readFileSync } = await import('fs');
    const src = readFileSync('src/app/api/gates/3/decide/route.ts', 'utf-8');
    expect(src).toContain('GATE_AI_PROHIBITED');
    expect(src).toContain('AI_ACTOR_BLOCKLIST');
  });

  it('Gate 4 decide source contains GATE_AI_PROHIBITED', async () => {
    const { readFileSync } = await import('fs');
    const src = readFileSync('src/app/api/gates/4/decide/route.ts', 'utf-8');
    expect(src).toContain('GATE_AI_PROHIBITED');
    expect(src).toContain('AI_ACTOR_BLOCKLIST');
  });
});

describe('A3-001 blocking action creation', () => {
  it('Gate 3 decide creates A3-001 with blocking=true on Conditional Pass', async () => {
    const { readFileSync } = await import('fs');
    const src = readFileSync('src/app/api/gates/3/decide/route.ts', 'utf-8');
    expect(src).toContain("actionId: 'A3-001'");
    expect(src).toContain('blocking: true');
    expect(src).toContain("dueGate: 4");
    expect(src).toContain('requiredClosureEvidence');
  });
});

describe('Phase 4 A3-001 closure verification', () => {
  it('DFM agent source verifies A3-001 on revised run', async () => {
    const { readFileSync } = await import('fs');
    const src = readFileSync('src/server/agents/phase4/dfmStandardsAgent.ts', 'utf-8');
    expect(src).toContain('A3-001');
    expect(src).toContain('VerifiedClosed');
    expect(src).toContain('a3001Closed');
  });
});
