import { describe, it, expect } from 'vitest';
import { GatedStateMachine } from '@/server/orchestrator/stateMachine';
import { AI_ACTOR_BLOCKLIST } from '@/server/orchestrator/types';

describe('GatedStateMachine — gate enforcement', () => {
  it('rejects AI actor reviewer role', async () => {
    const sm = new GatedStateMachine('EVINV-POC-001');
    await expect(sm.recordGateDecision({
      gateNumber: 0,
      decision: 'Pass',
      reviewerRole: 'claude',
      comments: 'auto-approved',
    })).rejects.toThrow('GATE_AI_PROHIBITED');
  });

  it('rejects invalid gate outcome', async () => {
    const sm = new GatedStateMachine('EVINV-POC-001');
    await expect(sm.recordGateDecision({
      gateNumber: 0,
      decision: 'Approve' as 'Pass',
      reviewerRole: 'Marcus Webb',
    })).rejects.toThrow('INVALID_GATE_OUTCOME');
  });

  it('AI_ACTOR_BLOCKLIST contains expected values', () => {
    expect(AI_ACTOR_BLOCKLIST.has('claude')).toBe(true);
    expect(AI_ACTOR_BLOCKLIST.has('AI')).toBe(true);
    expect(AI_ACTOR_BLOCKLIST.has('Marcus Webb')).toBe(false);
  });
});

describe('PHASE_CONFIG', () => {
  it('has exactly 10 phases', async () => {
    const { PHASE_CONFIG } = await import('@/shared/constants/phaseConfig');
    expect(PHASE_CONFIG.length).toBe(10);
  });

  it('only phases 0, 1, 3, 4 have technicalReview', async () => {
    const { PHASE_CONFIG } = await import('@/shared/constants/phaseConfig');
    const withReview = PHASE_CONFIG.filter(p => p.technicalReview !== null).map(p => p.phaseId);
    expect([...withReview].sort((a, b) => a - b)).toEqual([0, 1, 3, 4]);
  });

  it('phase 8 has both inputs as SI (both simulated)', async () => {
    const { PHASE_CONFIG } = await import('@/shared/constants/phaseConfig');
    const phase8 = PHASE_CONFIG.find(p => p.phaseId === 8)!;
    expect(phase8.externalIntake.behavior).toBe('SI');
    expect(phase8.internalIntake.behavior).toBe('SI');
  });
});
