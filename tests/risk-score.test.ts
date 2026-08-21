import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeRiskScore, describeRiskScore, resolveEvidence, blocksGate, bearsOnGate,
  type RiskEvidence,
} from '@/server/risk/riskScoreEngine';
import {
  DEFAULT_RISK_SCORING_CONFIG, resolveRiskScoringConfig, riskLevelFor, riskBands,
  resetRiskScoringConfigCache, severityToRiskLevel,
} from '@/shared/config/riskScoringConfig';
import { evaluateGateRules, clampOutcome } from '@/server/risk/gateRules';

/** A phase with everything in place: nothing should score. */
function cleanEvidence(overrides: Partial<RiskEvidence> = {}): RiskEvidence {
  return {
    phaseId: 3,
    gateId: 3,
    phaseState: 'AwaitingGate',
    findings: [],
    actions: [],
    checkResults: [],
    inputs: [
      { inputRole: 'external', logicalName: 'Design Rules and Manufacturing Capabilities Package', readinessStatus: 'Synthetic System Input Ready' },
      { inputRole: 'internal', logicalName: 'Preliminary Design Package', readinessStatus: 'User Input Ready' },
    ],
    outputs: [
      { outputName: 'PDR Readiness Summary', approvalStatus: 'AwaitingReview' },
      { outputName: 'Early DFM/DFA Findings and Risk Register', approvalStatus: 'AwaitingReview' },
    ],
    ...overrides,
  };
}

function finding(severity: string, status = 'Open', id = `F3-${severity}`) {
  return {
    findingId: id, sourcePhase: 3, sourceGate: 3,
    description: `${severity} issue`, severity, status,
    detectedBy: 'AgentAnalysis' as const,
  };
}

function action(over: Record<string, unknown> = {}) {
  return {
    actionId: 'A3-001', sourceFindingId: 'F3-Major',
    sourcePhase: 3, sourceGate: 3,
    description: 'Revise the connector orientation.',
    ownerRole: 'Design Engineer',
    blocking: true, parallel: true,
    duePhase: 4, dueGate: 4,
    status: 'Open',
    ...over,
  } as RiskEvidence['actions'][number];
}

beforeEach(() => {
  delete process.env.RISK_SCORING_CONFIG;
  resetRiskScoringConfigCache();
});

describe('Risk score — configured weights', () => {
  it('scores a clean gate at 0 / Low', () => {
    const risk = computeRiskScore(cleanEvidence());
    expect(risk.score).toBe(0);
    expect(risk.level).toBe('Low');
    expect(risk.display).toBe('Risk: 0 / 100, Low');
  });

  it('applies the specified per-severity finding weights', () => {
    expect(computeRiskScore(cleanEvidence({ findings: [finding('Minor')] })).score).toBe(10);
    expect(computeRiskScore(cleanEvidence({ findings: [finding('Major')] })).score).toBe(25);
    expect(computeRiskScore(cleanEvidence({ findings: [finding('Critical')] })).score).toBe(40);
  });

  it('ignores findings that are resolved', () => {
    for (const status of DEFAULT_RISK_SCORING_CONFIG.resolvedStatuses) {
      const risk = computeRiskScore(cleanEvidence({ findings: [finding('Critical', status)] }));
      expect(risk.score, `status ${status}`).toBe(0);
    }
  });

  it('still counts a finding that is closed but not yet verified', () => {
    const risk = computeRiskScore(
      cleanEvidence({ findings: [finding('Major', 'ClosedPendingVerification')] })
    );
    expect(risk.score).toBe(25);
  });

  it('scores a failed MANDATORY check and ignores a non-mandatory one', () => {
    const mandatory = computeRiskScore(cleanEvidence({
      phaseId: 4, gateId: 4,
      checkResults: [{ checkType: 'HVClearance', phaseId: 4, status: 'Fail' }],
      outputs: [
        { outputName: 'Source-Cited, Risk-Scored DFM and Standards Audit', approvalStatus: 'AwaitingReview' },
        { outputName: 'BOM Health and Manufacturability Report', approvalStatus: 'AwaitingReview' },
      ],
    }));
    expect(mandatory.counts.failedMandatoryChecks).toBe(1);
    expect(mandatory.score).toBe(20);

    // Phase 3 has no mandatory checks configured.
    const notMandatory = computeRiskScore(cleanEvidence({
      checkResults: [{ checkType: 'HVClearance', phaseId: 3, status: 'Fail' }],
    }));
    expect(notMandatory.counts.failedMandatoryChecks).toBe(0);
    expect(notMandatory.score).toBe(0);
  });

  it('ignores a superseded check run', () => {
    const risk = computeRiskScore(cleanEvidence({
      phaseId: 4, gateId: 4,
      checkResults: [{ checkType: 'HVClearance', phaseId: 4, status: 'Fail', invalidated: true }],
      outputs: [
        { outputName: 'Source-Cited, Risk-Scored DFM and Standards Audit', approvalStatus: 'AwaitingReview' },
        { outputName: 'BOM Health and Manufacturability Report', approvalStatus: 'AwaitingReview' },
      ],
    }));
    expect(risk.counts.failedMandatoryChecks).toBe(0);
  });

  it('scores a missing mandatory output at the configured weight', () => {
    const risk = computeRiskScore(cleanEvidence({ outputs: [] }));
    expect(risk.counts.missingMandatoryEvidence).toBe(2);
    expect(risk.score).toBe(40);
  });

  it('does not penalise intake state once the phase has executed', () => {
    const risk = computeRiskScore(cleanEvidence({
      inputs: [
        { inputRole: 'external', logicalName: 'x', readinessStatus: 'Waiting for Synthetic Sample Ingestion' },
        { inputRole: 'internal', logicalName: 'y', readinessStatus: 'Awaiting User Input' },
      ],
    }));
    expect(risk.counts.missingMandatoryEvidence).toBe(0);
  });

  /**
   * This previously asserted the opposite — a phase at 'AwaitingInputs' with
   * neither input ready scored the full 80 for four missing evidence items.
   * That is what a freshly seeded project looks like, so New Cycle returned the
   * lifecycle to Phase 0 and the screen immediately read "Risk: 80 / 100,
   * Critical" on a run nobody had started. The score is a gate score: nothing
   * is due from a phase that has not produced anything yet.
   */
  it('does not penalise a phase that is still waiting for its inputs', () => {
    const risk = computeRiskScore(cleanEvidence({
      phaseState: 'AwaitingInputs',
      outputs: [],
      inputs: [
        { inputRole: 'external', logicalName: 'x', readinessStatus: 'Waiting for Synthetic Sample Ingestion' },
        { inputRole: 'internal', logicalName: 'y', readinessStatus: 'Awaiting User Input' },
      ],
    }));
    expect(risk.counts.missingMandatoryEvidence).toBe(0);
    expect(risk.score).toBe(0);
  });

  it('does not penalise a phase while its agent is still running', () => {
    // Mid-run there are no outputs yet — that is the run in progress, not risk.
    const risk = computeRiskScore(cleanEvidence({
      phaseState: 'Running', inputs: [], outputs: [],
    }));
    expect(risk.score).toBe(0);
  });

  it('treats an unstarted phase as not yet due its evidence', () => {
    const risk = computeRiskScore(cleanEvidence({
      phaseState: 'Pending', inputs: [], outputs: [],
    }));
    expect(risk.counts.missingMandatoryEvidence).toBe(0);
    expect(risk.phaseStarted).toBe(false);
    expect(risk.score).toBe(0);
  });

  /**
   * The counterpart the change must not break: once the phase HAS executed,
   * a missing output is real — the gate has nothing to review.
   */
  it('still penalises an output the executed phase never produced', () => {
    const risk = computeRiskScore(cleanEvidence({
      phaseState: 'AwaitingGate', inputs: [], outputs: [],
    }));
    expect(risk.counts.missingMandatoryEvidence).toBeGreaterThan(0);
    expect(risk.score).toBeGreaterThan(0);
  });

  it('scores open blocking, overdue and prior-gate actions additively', () => {
    // Raised at Gate 3, due Gate 4, still open — seen from Gate 5.
    const risk = computeRiskScore(cleanEvidence({
      phaseId: 5, gateId: 5, phaseState: 'AwaitingGate',
      actions: [action()],
      inputs: [], outputs: [
        { outputName: 'Verification and Validation Matrix', approvalStatus: 'Approved' },
        { outputName: 'Gate 5 Verification and Validation Summary', approvalStatus: 'Approved' },
      ],
    }));
    expect(risk.counts.openBlockingActions).toBe(1);
    expect(risk.counts.overdueActions).toBe(1);
    expect(risk.counts.unclosedPriorGateActions).toBe(1);
    expect(risk.score).toBe(20 + 10 + 15);
  });

  it('does not attribute a later gate’s action to an earlier gate', () => {
    const risk = computeRiskScore(cleanEvidence({
      phaseId: 0, gateId: 0, phaseState: 'GatePassed',
      actions: [action()],
      inputs: [], outputs: [
        { outputName: 'Opportunity Summary and Bid/No-Bid Recommendation', approvalStatus: 'Approved' },
        { outputName: 'Capability-Match and Critical-Gap Matrix', approvalStatus: 'Approved' },
      ],
    }));
    expect(risk.counts.openBlockingActions).toBe(0);
    expect(risk.score).toBe(0);
  });

  it('caps the score at 100 and says so', () => {
    const risk = computeRiskScore(cleanEvidence({
      findings: [
        finding('Critical', 'Open', 'F1'), finding('Critical', 'Open', 'F2'),
        finding('Critical', 'Open', 'F3'), finding('Major', 'Open', 'F4'),
      ],
      outputs: [],
    }));
    expect(risk.rawScore).toBeGreaterThan(100);
    expect(risk.score).toBe(100);
    expect(risk.capped).toBe(true);
    expect(risk.level).toBe('Critical');
  });
});

describe('Risk levels', () => {
  const config = DEFAULT_RISK_SCORING_CONFIG;

  it('maps the specified bands', () => {
    expect(riskLevelFor(0, config)).toBe('Low');
    expect(riskLevelFor(29, config)).toBe('Low');
    expect(riskLevelFor(30, config)).toBe('Medium');
    expect(riskLevelFor(59, config)).toBe('Medium');
    expect(riskLevelFor(60, config)).toBe('High');
    expect(riskLevelFor(79, config)).toBe('High');
    expect(riskLevelFor(80, config)).toBe('Critical');
    expect(riskLevelFor(100, config)).toBe('Critical');
  });

  it('publishes contiguous bands covering 0 to the cap', () => {
    const bands = riskBands(config);
    expect(bands.map(b => b.level)).toEqual(['Low', 'Medium', 'High', 'Critical']);
    expect(bands[0].min).toBe(0);
    expect(bands[3].max).toBe(config.cap);
    for (let i = 1; i < bands.length; i++) {
      expect(bands[i].min).toBe(bands[i - 1].max + 1);
    }
  });

  it('maps finding severity to the risk level shown on a key risk', () => {
    expect(severityToRiskLevel('Critical')).toBe('Critical');
    expect(severityToRiskLevel('Major')).toBe('High');
    expect(severityToRiskLevel('Minor')).toBe('Medium');
    expect(severityToRiskLevel('Observation')).toBe('Low');
  });
});

describe('Risk scoring is configurable', () => {
  it('honours weights and thresholds from the environment', () => {
    process.env.RISK_SCORING_CONFIG = JSON.stringify({
      weights: { majorUnresolvedFinding: 60 },
      thresholds: { high: 50 },
    });
    resetRiskScoringConfigCache();

    const config = resolveRiskScoringConfig();
    expect(config.weights.majorUnresolvedFinding).toBe(60);
    // Untouched fields keep their defaults.
    expect(config.weights.criticalUnresolvedFinding).toBe(40);

    const risk = computeRiskScore(cleanEvidence({ findings: [finding('Major')] }));
    expect(risk.score).toBe(60);
    expect(risk.level).toBe('High');
  });

  it('honours a call-site override, and it wins over the environment', () => {
    process.env.RISK_SCORING_CONFIG = JSON.stringify({
      weights: { majorUnresolvedFinding: 60 },
    });
    resetRiskScoringConfigCache();

    const risk = computeRiskScore(
      cleanEvidence({ findings: [finding('Major')] }),
      { weights: { majorUnresolvedFinding: 5 } }
    );
    expect(risk.score).toBe(5);
  });

  it('honours a configurable cap', () => {
    const risk = computeRiskScore(
      cleanEvidence({ findings: [finding('Critical'), finding('Critical', 'Open', 'F2')] }),
      { cap: 50 }
    );
    expect(risk.score).toBe(50);
    expect(risk.capped).toBe(true);
  });

  it('falls back to defaults on malformed configuration', () => {
    process.env.RISK_SCORING_CONFIG = '{not json';
    resetRiskScoringConfigCache();
    expect(resolveRiskScoringConfig().weights).toEqual(DEFAULT_RISK_SCORING_CONFIG.weights);
  });
});

describe('Risk score explains itself', () => {
  it('names the top contributors', () => {
    const risk = computeRiskScore(cleanEvidence({
      findings: [finding('Major')], actions: [action()],
    }));
    risk.explanation = describeRiskScore(risk);
    expect(risk.explanation).toContain('Medium risk (45/100)');
    expect(risk.explanation).toContain('1 major unresolved finding');
    expect(risk.explanation).toContain('1 open blocking action');
  });

  it('says so when nothing contributes', () => {
    expect(describeRiskScore(computeRiskScore(cleanEvidence()))).toContain('No unresolved findings');
  });

  it('every drill-down item links to its record', () => {
    const risk = computeRiskScore(cleanEvidence({
      findings: [finding('Major')], actions: [action()], outputs: [],
    }));
    const all = [
      ...risk.drillDown.contributingFindings,
      ...risk.drillDown.openActions,
      ...risk.drillDown.missingEvidence,
    ];
    expect(all.length).toBeGreaterThan(0);
    for (const ref of all) {
      expect(ref.href, `${ref.id} has no link`).toBeTruthy();
      expect(ref.label).toBeTruthy();
    }
  });
});

describe('Action relevance predicates', () => {
  it('blocks a gate only once the action is due', () => {
    expect(blocksGate(action({ dueGate: 4 }), 3)).toBe(false);
    expect(blocksGate(action({ dueGate: 4 }), 4)).toBe(true);
    expect(blocksGate(action({ dueGate: 4 }), 5)).toBe(true);
    expect(blocksGate(action({ blocking: false, dueGate: 4 }), 4)).toBe(false);
  });

  it('bears on a gate at or after where it was raised, or by its due gate', () => {
    expect(bearsOnGate(action({ sourceGate: 3, dueGate: 4 }), 2)).toBe(false);
    expect(bearsOnGate(action({ sourceGate: 3, dueGate: 4 }), 3)).toBe(true);
    expect(bearsOnGate(action({ sourceGate: 3, dueGate: 4 }), 9)).toBe(true);
  });
});

describe('Mandatory evidence resolution', () => {
  it('resolves both configured inputs and both configured outputs', () => {
    const statuses = resolveEvidence(cleanEvidence(), DEFAULT_RISK_SCORING_CONFIG);
    expect(statuses).toHaveLength(4);
    expect(statuses.filter(s => s.requirement.kind === 'input')).toHaveLength(2);
    expect(statuses.filter(s => s.requirement.kind === 'output')).toHaveLength(2);
    expect(statuses.every(s => s.present)).toBe(true);
  });

  it('matches an output by name, not only by position', () => {
    const statuses = resolveEvidence(
      cleanEvidence({
        outputs: [
          { outputName: 'Early DFM/DFA Findings and Risk Register', approvalStatus: 'Approved' },
          { outputName: 'PDR Readiness Summary', approvalStatus: 'Approved' },
        ],
      }),
      DEFAULT_RISK_SCORING_CONFIG
    );
    expect(statuses.filter(s => s.requirement.kind === 'output').every(s => s.present)).toBe(true);
  });

  it('reports a pending output as not yet generated', () => {
    const statuses = resolveEvidence(
      cleanEvidence({ outputs: [{ outputName: 'PDR Readiness Summary', approvalStatus: 'Pending' }] }),
      DEFAULT_RISK_SCORING_CONFIG
    );
    const missing = statuses.filter(s => !s.present);
    expect(missing).toHaveLength(2);
    expect(missing[0].note).toContain('Not generated');
  });
});

describe('Configured gate rules', () => {
  function rulesFor(evidence: RiskEvidence) {
    return evaluateGateRules(evidence, computeRiskScore(evidence));
  }

  it('PASS when evidence is complete and nothing blocking is open', () => {
    const rules = rulesFor(cleanEvidence());
    expect(rules.ruleOutcome).toBe('Pass');
    expect(rules.failReasons).toEqual([]);
    expect(rules.passBlockers).toEqual([]);
  });

  it('FAIL when mandatory evidence is missing', () => {
    const rules = rulesFor(cleanEvidence({ outputs: [] }));
    expect(rules.ruleOutcome).toBe('Fail');
    expect(rules.failReasons.join(' ')).toContain('Mandatory evidence missing');
  });

  it('FAIL on an unresolved critical finding', () => {
    const rules = rulesFor(cleanEvidence({ findings: [finding('Critical')] }));
    expect(rules.ruleOutcome).toBe('Fail');
    expect(rules.failReasons.join(' ')).toContain('Critical blocking issue unresolved');
  });

  it('FAIL when a mandatory gate criterion has failed', () => {
    const rules = rulesFor(cleanEvidence({
      phaseId: 4, gateId: 4,
      checkResults: [{ checkType: 'HVClearance', phaseId: 4, status: 'Fail' }],
      outputs: [
        { outputName: 'Source-Cited, Risk-Scored DFM and Standards Audit', approvalStatus: 'AwaitingReview' },
        { outputName: 'BOM Health and Manufacturability Report', approvalStatus: 'AwaitingReview' },
      ],
    }));
    expect(rules.ruleOutcome).toBe('Fail');
    expect(rules.failReasons.join(' ')).toContain('Mandatory gate criterion failed');
  });

  it('FAIL when a prior-gate action blocks progression', () => {
    const rules = rulesFor(cleanEvidence({
      phaseId: 4, gateId: 4,
      actions: [action({ sourceGate: 3, dueGate: 4 })],
      outputs: [
        { outputName: 'Source-Cited, Risk-Scored DFM and Standards Audit', approvalStatus: 'AwaitingReview' },
        { outputName: 'BOM Health and Manufacturability Report', approvalStatus: 'AwaitingReview' },
      ],
    }));
    expect(rules.ruleOutcome).toBe('Fail');
    expect(rules.failReasons.join(' ')).toContain('Prior-gate action blocks progression');
  });

  it('CONDITIONAL PASS when the only open work runs in parallel to a later gate', () => {
    const rules = rulesFor(cleanEvidence({
      findings: [finding('Major')],
      actions: [action({ dueGate: 4, parallel: true })],
    }));
    expect(rules.ruleOutcome).toBe('Conditional Pass');
    expect(rules.failReasons).toEqual([]);
    expect(rules.signals.deferrableActions).toHaveLength(1);
  });
});

describe('The LLM cannot out-vote the configured rules', () => {
  function rulesWithOutcome(evidence: RiskEvidence) {
    return evaluateGateRules(evidence, computeRiskScore(evidence));
  }

  it('replaces a Pass the rules do not allow', () => {
    const rules = rulesWithOutcome(cleanEvidence({ outputs: [] }));  // Fail
    const { outcome, overridden } = clampOutcome('Pass', rules);
    expect(outcome).toBe('Fail');
    expect(overridden).toBe(true);
  });

  it('replaces a Conditional Pass when the rules require a Fail', () => {
    const rules = rulesWithOutcome(cleanEvidence({ findings: [finding('Critical')] }));
    expect(clampOutcome('Conditional Pass', rules).outcome).toBe('Fail');
  });

  it('replaces a Pass when the rules require a Conditional Pass', () => {
    const rules = rulesWithOutcome(cleanEvidence({
      findings: [finding('Major')], actions: [action()],
    }));
    expect(rules.ruleOutcome).toBe('Conditional Pass');
    expect(clampOutcome('Pass', rules).outcome).toBe('Conditional Pass');
  });

  it('keeps a recommendation the rules allow', () => {
    const rules = rulesWithOutcome(cleanEvidence());
    expect(clampOutcome('Pass', rules)).toEqual({ outcome: 'Pass', overridden: false });
  });

  it('lets the model be MORE cautious than a clean Pass', () => {
    const rules = rulesWithOutcome(cleanEvidence());
    expect(clampOutcome('Conditional Pass', rules)).toEqual({
      outcome: 'Conditional Pass', overridden: false,
    });
  });

  it('falls back to the rule outcome on a missing or nonsense reply', () => {
    const rules = rulesWithOutcome(cleanEvidence());
    expect(clampOutcome(undefined, rules).outcome).toBe('Pass');
    expect(clampOutcome('Approve', rules).overridden).toBe(true);
    expect(clampOutcome('', rules).overridden).toBe(true);
  });
});

describe('Robustness against unexpected data', () => {
  it('scores a severity this build has never seen, rather than silently ignoring it', () => {
    const risk = computeRiskScore(cleanEvidence({
      findings: [finding('Catastrophic', 'Open', 'F3-NEW')],
    }));
    // Counted AND charged — an unknown severity falls back to the minor weight.
    expect(risk.counts.unresolvedFindings).toBe(1);
    expect(risk.score).toBe(DEFAULT_RISK_SCORING_CONFIG.weights.minorUnresolvedFinding);
    expect(risk.contributions.map(c => c.label)).toContain('Catastrophic unresolved findings');
    // The sum of the contributions always equals the raw score.
    expect(risk.contributions.reduce((n, c) => n + c.points, 0)).toBe(risk.rawScore);
  });

  it('the contributions always add up to the raw score', () => {
    const risk = computeRiskScore(cleanEvidence({
      findings: [finding('Critical'), finding('Major', 'Open', 'F2'), finding('Observation', 'Open', 'F3')],
      actions: [action()],
      outputs: [],
    }));
    expect(risk.contributions.reduce((n, c) => n + c.points, 0)).toBe(risk.rawScore);
    expect(risk.score).toBe(Math.min(risk.rawScore, 100));
  });

  it('survives an action with no due gate', () => {
    const risk = computeRiskScore(cleanEvidence({
      actions: [action({ dueGate: null, duePhase: null })],
    }));
    // Blocking with no due gate blocks wherever it bears — here, its own gate.
    expect(risk.counts.openBlockingActions).toBe(1);
    expect(blocksGate(action({ dueGate: null }), 3)).toBe(true);
  });

  it('survives a phase with no configured inputs or outputs recorded', () => {
    const risk = computeRiskScore(cleanEvidence({ inputs: [], outputs: [] }));
    expect(risk.counts.missingMandatoryEvidence).toBe(2);  // the two outputs
    expect(risk.score).toBe(40);
  });
});
