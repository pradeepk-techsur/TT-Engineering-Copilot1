import { describe, it, expect, beforeEach } from 'vitest';
import { computeRiskScore, describeRiskScore } from '@/server/risk/riskScoreEngine';
import { evaluateGateRules } from '@/server/risk/gateRules';
import {
  composeStructuredAdvisory, composeKeyStrengths, composeKeyRisks, composeNextSteps,
  limitToSentences, rankRisks, MAX_ITEMS, NO_STRENGTHS, ADVISORY_LABEL,
} from '@/server/risk/advisoryComposer';
import { validate, buildGrounding } from '@/server/risk/gateAdvisoryAgent';
import { assembleFromMock } from '@/server/risk/evidenceAssembly';
import { clearPreviewDecisions, toDecisionRecord } from '@/server/risk/decisionRecordStore';
import { resetRiskScoringConfigCache } from '@/shared/config/riskScoringConfig';
import type { AssembledEvidence } from '@/server/risk/evidenceAssembly';
import type { GateAdvisory } from '@/shared/types/risk';

beforeEach(() => {
  delete process.env.RISK_SCORING_CONFIG;
  resetRiskScoringConfigCache();
  clearPreviewDecisions();
});

/** The full pipeline, exactly as the service runs it, minus the model call. */
function assess(phaseId: number) {
  const evidence = assembleFromMock(phaseId);
  const risk = computeRiskScore(evidence);
  risk.explanation = describeRiskScore(risk);
  const rules = evaluateGateRules(evidence, risk);
  const advisory = composeStructuredAdvisory(evidence, risk, rules);
  return { evidence, risk, rules, advisory };
}

describe('Gate advisory — shape and caps', () => {
  it('caps strengths, risks and next steps at three, on every gate', () => {
    for (let gate = 0; gate <= 9; gate++) {
      const { advisory } = assess(gate);
      expect(advisory.keyStrengths.length, `G${gate} strengths`).toBeLessThanOrEqual(MAX_ITEMS);
      expect(advisory.keyRisks.length, `G${gate} risks`).toBeLessThanOrEqual(MAX_ITEMS);
      expect(advisory.nextSteps.length, `G${gate} next steps`).toBeLessThanOrEqual(MAX_ITEMS);
    }
  });

  it('keeps the rationale to at most three sentences, on every gate', () => {
    for (let gate = 0; gate <= 9; gate++) {
      const { advisory } = assess(gate);
      const sentences = advisory.rationale.match(/[^.!?]+[.!?]+/g) ?? [];
      expect(sentences.length, `G${gate}: ${advisory.rationale}`).toBeLessThanOrEqual(3);
      expect(sentences.length, `G${gate} has no rationale`).toBeGreaterThanOrEqual(1);
    }
  });

  it('always carries the advisory label', () => {
    for (let gate = 0; gate <= 9; gate++) {
      expect(assess(gate).advisory.advisoryLabel).toBe(ADVISORY_LABEL);
    }
  });

  it('never recommends an outcome the configured rules forbid', () => {
    for (let gate = 0; gate <= 9; gate++) {
      const { advisory, rules } = assess(gate);
      expect(rules.allowedOutcomes, `G${gate}`).toContain(advisory.recommendedOutcome);
    }
  });

  it('offers no recommendation while the gate is locked', () => {
    // Gates 4–9 are locked in the seeded storyline.
    const locked = assess(8);
    expect(locked.evidence.gateState).toBe('Locked');
    expect(locked.advisory.recommendationAvailable).toBe(false);
    expect(locked.advisory.rationale).toContain('locked');

    const open = assess(3);
    expect(open.evidence.gateState).toBe('Open');
    expect(open.advisory.recommendationAvailable).toBe(true);
  });
});

describe('Gate advisory — grounding', () => {
  it('every key strength carries evidence', () => {
    for (let gate = 0; gate <= 9; gate++) {
      for (const strength of assess(gate).advisory.keyStrengths) {
        expect(strength.evidence.id, `G${gate}`).toBeTruthy();
        expect(strength.evidence.label, `G${gate}`).toBeTruthy();
        expect(strength.evidence.href, `G${gate}: ${strength.statement}`).toBeTruthy();
        expect(strength.statement.endsWith('.')).toBe(true);
      }
    }
  });

  it('every key risk carries a level, a blocking status and a drill-down', () => {
    for (let gate = 0; gate <= 9; gate++) {
      for (const risk of assess(gate).advisory.keyRisks) {
        expect(['Low', 'Medium', 'High', 'Critical']).toContain(risk.level);
        expect(typeof risk.blocking).toBe('boolean');
        expect(risk.detail.fullFinding).toBeTruthy();
        expect(risk.detail.href).toBeTruthy();
      }
    }
  });

  it('every next step is attached to an existing record', () => {
    const KINDS = ['Finding', 'Action', 'FailedCheck', 'MissingEvidence', 'GateCondition'];
    for (let gate = 0; gate <= 9; gate++) {
      for (const step of assess(gate).advisory.nextSteps) {
        expect(KINDS, `G${gate}`).toContain(step.sourceKind);
        expect(step.source.id, `G${gate}: ${step.statement}`).toBeTruthy();
        expect(step.source.href, `G${gate}: ${step.statement}`).toBeTruthy();
      }
    }
  });

  it('says so plainly when no supported strengths exist', () => {
    const evidence: AssembledEvidence = {
      ...assembleFromMock(3),
      outputs: [], passedChecks: [], closedActions: [],
      closedFindings: [], priorClosedFindings: [], priorSummaries: [],
    };
    expect(composeKeyStrengths(evidence)).toHaveLength(0);
    // The panel renders this exact sentence when the list is empty.
    expect(NO_STRENGTHS).toBe('No evidence-supported Key Strengths identified.');
  });

  it('does not duplicate a finding as both a phase risk and an inherited one', () => {
    const { advisory } = assess(3);
    const ids = advisory.keyRisks.map(r => r.detail.findingId).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('does not repeat the same next step twice', () => {
    for (let gate = 0; gate <= 9; gate++) {
      const steps = assess(gate).advisory.nextSteps;
      const keys = steps.map(s => `${s.sourceKind}:${s.source.id}`);
      expect(new Set(keys).size, `G${gate}`).toBe(keys.length);
    }
  });
});

describe('Gate advisory — the seeded storyline', () => {
  it('Gate 3 is a Conditional Pass at Medium risk, with the coolant finding non-blocking', () => {
    const { risk, advisory } = assess(3);

    expect(risk.score).toBe(45);
    expect(risk.level).toBe('Medium');
    expect(risk.display).toBe('Risk: 45 / 100, Medium');

    expect(advisory.recommendedOutcome).toBe('Conditional Pass');
    expect(advisory.keyRisks).toHaveLength(1);
    expect(advisory.keyRisks[0].statement).toContain('Coolant connector');
    // Major → High, and its action is due at Gate 4, so it is not blocking here.
    expect(advisory.keyRisks[0].level).toBe('High');
    expect(advisory.keyRisks[0].blocking).toBe(false);
    expect(advisory.keyRisks[0].detail.ownerRole).toBe('Design Engineer');
    expect(advisory.keyRisks[0].detail.dueGate).toBe(4);

    // The next steps are the action itself, then closing it at its due gate.
    expect(advisory.nextSteps.map(s => s.sourceKind)).toEqual(['Action', 'GateCondition']);
    expect(advisory.nextSteps[1].statement).toContain('Gate 4');
  });

  it('the same finding becomes blocking at Gate 4, where its action is due', () => {
    const g4 = assess(4);
    expect(g4.advisory.keyRisks[0].blocking).toBe(true);
    expect(g4.rules.ruleOutcome).toBe('Fail');
  });

  it('a decided, clean gate is a Pass at zero risk with strengths and no risks', () => {
    const { risk, advisory } = assess(2);
    expect(risk.score).toBe(0);
    expect(risk.level).toBe('Low');
    expect(advisory.recommendedOutcome).toBe('Pass');
    expect(advisory.keyRisks).toHaveLength(0);
    expect(advisory.keyStrengths.length).toBeGreaterThan(0);
  });

  it('reuses the closed prior-phase finding as a strength', () => {
    const { advisory } = assess(3);
    const ids = advisory.keyStrengths.map(s => s.evidence.id);
    expect(ids).toContain('F2-001-original');
  });
});

describe('Rationale construction', () => {
  it('trims anything past the third sentence', () => {
    expect(limitToSentences('One. Two. Three. Four. Five.')).toBe('One. Two. Three.');
  });

  it('leaves a shorter rationale alone', () => {
    expect(limitToSentences('Only one sentence.')).toBe('Only one sentence.');
  });

  it('handles text with no terminator', () => {
    expect(limitToSentences('no terminator here')).toBe('no terminator here');
  });

  it('does not lower-case an acronym at the start of a clause', () => {
    const { advisory } = assess(3);
    expect(advisory.rationale).toContain('PDR Readiness Summary');
    expect(advisory.rationale).not.toContain('pDR');
  });

  it('states what is complete, what is unresolved, and why the outcome follows', () => {
    const { advisory } = assess(3);
    expect(advisory.rationale).toContain('Conditional Pass is recommended because');
    expect(advisory.rationale).toMatch(/However|No unresolved/);
    expect(advisory.rationale).toContain('Overall Risk Score of 45/100');
  });
});

describe('Key risks are ordered by severity', () => {
  it('puts higher severity first, and blocking ahead of non-blocking', () => {
    const ranked = rankRisks([
      { statement: 'low', level: 'Low', blocking: false, detail: {} },
      { statement: 'crit', level: 'Critical', blocking: false, detail: {} },
      { statement: 'high-nb', level: 'High', blocking: false, detail: {} },
      { statement: 'high-b', level: 'High', blocking: true, detail: {} },
    ]);
    expect(ranked.map(r => r.statement)).toEqual(['crit', 'high-b', 'high-nb', 'low']);
  });
});

describe('LLM reply validation', () => {
  function fixture() {
    const { evidence, risk, rules, advisory } = assess(3);
    return { evidence, risk, rules, fallback: advisory };
  }

  it('keeps the model’s wording but our structure and links', () => {
    const { rules, fallback } = fixture();
    const out = validate({
      recommendedOutcome: 'Conditional Pass',
      rationale: 'Preliminary architecture is mature. One assembly-access issue is open. It does not block this gate.',
      keyStrengths: [{ id: fallback.keyStrengths[0].evidence.id, statement: 'Rewritten strength' }],
      keyRisks: [{ id: 'F3-001', statement: 'Rewritten risk' }],
      nextSteps: [{ id: 'A3-001', statement: 'Rewritten step' }],
    }, fallback, rules);

    expect(out.generatedBy).toBe('LLM');
    expect(out.keyStrengths[0].statement).toBe('Rewritten strength.');
    // The evidence link is ours, not the model's.
    expect(out.keyStrengths[0].evidence).toEqual(fallback.keyStrengths[0].evidence);
    expect(out.keyRisks[0].statement).toBe('Rewritten risk.');
    expect(out.keyRisks[0].level).toBe('High');
    expect(out.keyRisks[0].blocking).toBe(false);
    expect(out.nextSteps[0].source.id).toBe('A3-001');
    expect(out.ruleOverrideApplied).toBe(false);
  });

  it('drops an item the model invented', () => {
    const { rules, fallback } = fixture();
    const out = validate({
      recommendedOutcome: 'Conditional Pass',
      rationale: 'Fine.',
      keyRisks: [
        { id: 'F9-999', statement: 'A finding that does not exist' },
        { id: 'F3-001', statement: 'The real one' },
      ],
    }, fallback, rules);

    expect(out.keyRisks).toHaveLength(1);
    expect(out.keyRisks[0].statement).toBe('The real one.');
  });

  it('overrides an outcome the configured rules forbid, and flags it', () => {
    const { rules, fallback } = fixture();
    const out = validate(
      { recommendedOutcome: 'Pass', rationale: 'Looks fine to me.' },
      fallback, rules
    );
    expect(out.recommendedOutcome).toBe('Conditional Pass');
    expect(out.ruleOverrideApplied).toBe(true);
    expect(out.ruleOutcome).toBe('Conditional Pass');
  });

  it('still caps the model at three items each', () => {
    const { rules, fallback } = fixture();
    const id = fallback.keyStrengths[0].evidence.id;
    const out = validate({
      recommendedOutcome: 'Conditional Pass',
      rationale: 'Fine.',
      keyStrengths: Array.from({ length: 8 }, (_, i) => ({ id, statement: `S${i}` })),
    }, fallback, rules);
    expect(out.keyStrengths.length).toBeLessThanOrEqual(MAX_ITEMS);
  });

  it('trims a rationale longer than three sentences', () => {
    const { rules, fallback } = fixture();
    const out = validate({
      recommendedOutcome: 'Conditional Pass',
      rationale: 'A. B. C. D. E.',
    }, fallback, rules);
    expect(out.rationale).toBe('A. B. C.');
  });

  it('keeps the structured content when the model returns an empty section', () => {
    const { rules, fallback } = fixture();
    const out = validate(
      { recommendedOutcome: 'Conditional Pass', rationale: '', keyStrengths: [], keyRisks: [] },
      fallback, rules
    );
    expect(out.rationale).toBe(fallback.rationale);
    expect(out.keyStrengths).toEqual(fallback.keyStrengths);
    expect(out.keyRisks).toEqual(fallback.keyRisks);
  });

  it('never lets the model restate the numeric score', () => {
    const { risk, rules, fallback } = fixture();
    const before = risk.score;
    validate(
      { recommendedOutcome: 'Conditional Pass', rationale: 'Risk is really 5/100.' },
      fallback, rules
    );
    // The score is not part of the reply contract at all — it cannot move.
    expect(risk.score).toBe(before);
    expect(Object.keys(fallback)).not.toContain('score');
  });
});

describe('LLM grounding payload', () => {
  it('sends structure and short excerpts — never a whole output document', () => {
    const { evidence, risk, rules, advisory } = assess(3);
    const payload = buildGrounding(evidence, risk, rules, advisory);

    // Exactly the inputs the spec allows.
    expect(payload.gateCriteria.length).toBeGreaterThan(0);
    expect(payload.riskScore.score).toBe(45);
    expect(payload.riskScore.level).toBe('Medium');
    expect(payload.candidateStrengths.length).toBeGreaterThan(0);
    expect(payload.candidateRisks.length).toBeGreaterThan(0);
    expect(payload.structuredFindings.map(f => f.id)).toEqual(['F3-001']);
    expect(payload.openActions.map(a => a.id)).toEqual(['A3-001']);
    expect(payload.allowedOutcomes).toEqual(['Conditional Pass']);

    // Output excerpts are names and approval state only.
    for (const excerpt of payload.outputExcerpts) {
      expect(Object.keys(excerpt).sort()).toEqual(['approvalStatus', 'name']);
    }

    // And it stays small — a document dump would blow past this.
    expect(JSON.stringify(payload).length).toBeLessThan(8000);
  });
});

describe('Decision records preserve both halves', () => {
  it('keeps the AI recommendation, risk score, human decision and rationale', () => {
    const { advisory, risk } = assess(3);
    const record = toDecisionRecord({
      gateNumber: 3,
      phaseName: 'Phase 3 — Preliminary Design',
      decision: 'Pass',
      reviewerRole: 'Engineering Lead',
      comments: 'Reviewed with the design team.',
      humanRationale: 'Assembly access verified on the physical mock-up.',
      advisory,
      riskScore: { score: risk.score, level: risk.level, display: risk.display },
      artifactVersionsReviewed: ['mock-artifact-int-3 v1'],
    }, 'd1', '2026-08-20T10:00:00Z');

    expect(record.aiRecommendation?.recommendedOutcome).toBe('Conditional Pass');
    expect(record.aiRecommendation?.rationale).toBeTruthy();
    expect(record.aiRecommendation?.keyStrengths.length).toBeGreaterThan(0);
    expect(record.aiRecommendation?.keyRisks.length).toBeGreaterThan(0);
    expect(record.aiRecommendation?.nextSteps.length).toBeGreaterThan(0);
    expect(record.riskScore).toEqual({ score: 45, level: 'Medium', display: 'Risk: 45 / 100, Medium' });
    expect(record.decision).toBe('Pass');
    expect(record.reviewerRole).toBe('Engineering Lead');
    expect(record.humanRationale).toContain('mock-up');
    expect(record.artifactVersionsReviewed).toEqual(['mock-artifact-int-3 v1']);
    expect(record.timestamp).toBe('2026-08-20T10:00:00Z');
    // The whole point: the divergence is visible in the record itself.
    expect(record.divergedFromAi).toBe(true);
  });

  it('marks agreement when the human matches the AI', () => {
    const { advisory, risk } = assess(3);
    const record = toDecisionRecord({
      gateNumber: 3, phaseName: 'x', decision: 'Conditional Pass',
      reviewerRole: 'Engineering Lead', comments: '', humanRationale: '',
      advisory, riskScore: { score: risk.score, level: risk.level, display: risk.display },
      artifactVersionsReviewed: [],
    }, 'd2', '2026-08-20T10:00:00Z');
    expect(record.divergedFromAi).toBe(false);
  });
});

describe('No new artifacts are introduced', () => {
  it('the advisory only ever references outputs the phase config already declares', async () => {
    const { PHASE_CONFIG_MAP } = await import('@/shared/constants/phaseConfig');
    for (let gate = 0; gate <= 9; gate++) {
      const declared = new Set<string>(
        (PHASE_CONFIG_MAP[gate as 0].outputs as readonly string[]).map(o => o.toLowerCase())
      );
      const { evidence } = assess(gate);
      for (const output of evidence.outputs) {
        expect(declared, `G${gate}: ${output.outputName}`).toContain(output.outputName.toLowerCase());
      }
    }
  });

  it('composers are pure reads — they never write anything back', () => {
    const evidence = assembleFromMock(3);
    const before = JSON.stringify(evidence);
    const risk = computeRiskScore(evidence);
    composeKeyStrengths(evidence);
    composeKeyRisks(evidence);
    composeNextSteps(evidence, risk);
    expect(JSON.stringify(evidence)).toBe(before);
  });
});

describe('Fallback advisory needs no model', () => {
  it('produces a complete advisory with no LLM key present', () => {
    const advisory: GateAdvisory = assess(3).advisory;
    expect(advisory.generatedBy).toBe('StructuredFallback');
    expect(advisory.recommendedOutcome).toBeTruthy();
    expect(advisory.rationale.length).toBeGreaterThan(40);
    expect(advisory.keyStrengths.length).toBeGreaterThan(0);
    expect(advisory.keyRisks.length).toBeGreaterThan(0);
    expect(advisory.nextSteps.length).toBeGreaterThan(0);
  });
});

describe('The LLM path, end to end with a stubbed model', () => {
  /**
   * Exercises the real `generate()` — prompt construction, JSON extraction,
   * validation and clamping — without a network call. Only the transport is
   * replaced.
   */
  async function generateWith(reply: string) {
    const { GateAdvisoryAgent } = await import('@/server/risk/gateAdvisoryAgent');
    const { evidence, risk, rules, advisory } = assess(3);

    class StubbedAgent extends GateAdvisoryAgent {
      lastPrompt = '';
      lastSystem = '';
      protected async callLLM(prompt: string, systemPrompt: string): Promise<string> {
        this.lastPrompt = prompt;
        this.lastSystem = systemPrompt;
        return reply;
      }
    }

    const agent = new StubbedAgent(3);
    const result = await agent.generate(evidence, risk, rules, advisory);
    return { agent, result, fallback: advisory, risk };
  }

  it('uses the model’s prose and its own structure', async () => {
    const { result } = await generateWith(JSON.stringify({
      recommendedOutcome: 'Conditional Pass',
      rationale:
        'The preliminary architecture and principal interfaces are mature enough for detailed design. ' +
        'One High-risk assembly-access issue remains open. It is tracked to Gate 4 and does not block progression.',
      riskExplanation: 'Medium because one Major finding and one open action remain.',
      keyStrengths: [{ id: 'mock-out-3-0', statement: 'Core power-stage architecture is feasible' }],
      keyRisks: [{ id: 'F3-001', statement: 'Coolant connector may obstruct assembly access' }],
      nextSteps: [{ id: 'A3-001', statement: 'Revise the coolant-connector orientation' }],
    }));

    expect(result.advisory.generatedBy).toBe('LLM');
    expect(result.advisory.recommendedOutcome).toBe('Conditional Pass');
    expect(result.advisory.keyStrengths[0].statement).toBe('Core power-stage architecture is feasible.');
    expect(result.advisory.keyRisks[0].statement).toBe('Coolant connector may obstruct assembly access.');
    // The level, blocking status and links stay ours.
    expect(result.advisory.keyRisks[0].level).toBe('High');
    expect(result.advisory.keyRisks[0].blocking).toBe(false);
    expect(result.advisory.keyRisks[0].detail.findingId).toBe('F3-001');
    expect(result.advisory.nextSteps[0].source.id).toBe('A3-001');
    expect(result.riskExplanation).toContain('Medium');
  });

  it('sends the model only the permitted grounding, and no document bodies', async () => {
    const { agent } = await generateWith('{"recommendedOutcome":"Conditional Pass","rationale":"Fine."}');

    expect(agent.lastSystem).toContain('do NOT calculate the Overall Risk Score');
    expect(agent.lastSystem).toContain('MUST be one of the allowedOutcomes');
    expect(agent.lastSystem).toContain('Maximum three key strengths');

    const payload = JSON.parse(agent.lastPrompt.slice(agent.lastPrompt.indexOf('{')));
    expect(Object.keys(payload).sort()).toEqual([
      'allowedOutcomes', 'candidateRisks', 'candidateStrengths', 'failedChecks',
      'gate', 'gateCriteria', 'missingEvidence', 'openActions', 'outputExcerpts',
      'phaseName', 'priorGateActionStatus', 'riskScore', 'ruleOutcome',
      'ruleReasons', 'structuredFindings',
    ]);
    // The score goes in already computed; the model is never asked for one.
    expect(payload.riskScore.score).toBe(45);
  });

  it('handles a reply wrapped in prose or a code fence', async () => {
    const { result } = await generateWith(
      'Here is my assessment:\n```json\n{"recommendedOutcome":"Conditional Pass","rationale":"All good."}\n```\nHope that helps.'
    );
    expect(result.advisory.recommendedOutcome).toBe('Conditional Pass');
    expect(result.advisory.rationale).toBe('All good.');
  });

  it('rejects an unparseable reply so the caller can fall back', async () => {
    await expect(generateWith('I would rather not answer in JSON.')).rejects.toThrow('ADVISORY_UNPARSEABLE');
  });

  it('overrides a model that tries to pass a gate the rules will not', async () => {
    const { result } = await generateWith(JSON.stringify({
      recommendedOutcome: 'Pass',
      rationale: 'This all looks acceptable to me.',
    }));
    expect(result.advisory.recommendedOutcome).toBe('Conditional Pass');
    expect(result.advisory.ruleOverrideApplied).toBe(true);
  });

  it('drops strengths, risks and steps the model made up', async () => {
    const { result, fallback } = await generateWith(JSON.stringify({
      recommendedOutcome: 'Conditional Pass',
      rationale: 'Fine.',
      keyStrengths: [{ id: 'invented-output', statement: 'Something nobody recorded' }],
      keyRisks: [{ id: 'F9-000', statement: 'An imaginary finding' }],
      nextSteps: [{ id: 'A9-000', statement: 'Do an imaginary thing' }],
    }));
    // Nothing matched, so the structured content stands rather than fiction.
    expect(result.advisory.keyStrengths).toEqual(fallback.keyStrengths);
    expect(result.advisory.keyRisks).toEqual(fallback.keyRisks);
    expect(result.advisory.nextSteps).toEqual(fallback.nextSteps);
  });

  it('cannot change the numeric score, whatever it claims', async () => {
    const { result, risk } = await generateWith(JSON.stringify({
      recommendedOutcome: 'Conditional Pass',
      rationale: 'The real risk here is 3 out of 100.',
      riskExplanation: 'Actually 3/100, Low.',
    }));
    // The engine's number is untouched — the model only ever wrote prose.
    expect(risk.score).toBe(45);
    expect(risk.level).toBe('Medium');
    expect(result.advisory).not.toHaveProperty('score');
  });
});
