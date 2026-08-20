/**
 * Risk scoring and gate advisory types.
 *
 * These are shared between the server (which CALCULATES the numeric score with
 * structured rules) and the client (which DISPLAYS it). Nothing here is
 * LLM-generated: the numeric score, its level, and its contributions are all
 * produced by `riskScoreEngine`. The LLM only ever writes prose — the
 * recommendation, its rationale, and the strength/risk/next-step summaries —
 * and even that is clamped to the configured gate rules before it reaches here.
 */

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type GateOutcome = 'Pass' | 'Conditional Pass' | 'Fail';

/** Every category the structured rules can score. One per suggested rule. */
export type RiskCategory =
  | 'UnresolvedFinding'
  | 'FailedMandatoryCheck'
  | 'MissingMandatoryEvidence'
  | 'OpenBlockingAction'
  | 'OverdueAction'
  | 'UnclosedPriorGateAction';

/** A pointer from a score contribution back to the artifact that caused it. */
export interface RiskRef {
  /** Stable id — finding id, action id, check type, or evidence key. */
  id: string;
  /** One-line human-readable description. */
  label: string;
  /** Where to go to see the whole thing. Drill-down, never inline. */
  href?: string;
  /** Extra qualifier shown next to the label (severity, owner, due gate…). */
  detail?: string;
  /** Points this single item added to the score. */
  points?: number;
}

/** One scoring category's total, with the items that produced it. */
export interface RiskContribution {
  category: RiskCategory;
  /** e.g. "Major unresolved findings" */
  label: string;
  /** Points per item, from the configured weights. */
  weight: number;
  count: number;
  /** weight × count, before the overall cap. */
  points: number;
  refs: RiskRef[];
}

/** The four drill-down lists the user can open from the score. */
export interface RiskDrillDown {
  contributingFindings: RiskRef[];
  openActions: RiskRef[];
  failedChecks: RiskRef[];
  missingEvidence: RiskRef[];
}

export interface RiskScore {
  phaseId: number;
  gateId: number;
  /** 0–100, capped. */
  score: number;
  /** Sum before the cap — kept so the drill-down can be honest about capping. */
  rawScore: number;
  capped: boolean;
  level: RiskLevel;
  /** Pre-formatted compact display, e.g. "Risk: 68 / 100, High". */
  display: string;
  /**
   * Always true — every phase and gate gets a real 0–100 score. Kept so callers
   * that guard on it keep working.
   */
  assessed: boolean;
  /**
   * Whether the phase is active or complete. The Product Lifecycle View shows
   * its compact indicator only for those; a not-started phase can still carry a
   * score from earlier open work, visible on its own workspace.
   */
  phaseStarted: boolean;
  contributions: RiskContribution[];
  drillDown: RiskDrillDown;
  counts: {
    unresolvedFindings: number;
    openBlockingActions: number;
    overdueActions: number;
    unclosedPriorGateActions: number;
    failedMandatoryChecks: number;
    missingMandatoryEvidence: number;
  };
  /** Short LLM-authored (or deterministic) explanation of the level. */
  explanation: string;
  /** Effective weights/thresholds used, for the drill-down only. */
  configSnapshot: {
    cap: number;
    thresholds: { level: RiskLevel; min: number; max: number }[];
    weights: Record<string, number>;
  };
}

/* ── Gate advisory ─────────────────────────────────────────────────────── */

export interface KeyStrength {
  /** One concise sentence. */
  statement: string;
  /** What backs it up. Never empty — an unsupported strength is dropped. */
  evidence: RiskRef;
}

export interface KeyRisk {
  /** Short risk statement. */
  statement: string;
  level: RiskLevel;
  blocking: boolean;
  /** Full finding text, evidence, rule, action, owner, due gate. */
  detail: {
    findingId?: string;
    fullFinding?: string;
    supportingEvidence?: string;
    applicableRule?: string;
    recommendedAction?: string;
    ownerRole?: string;
    duePhase?: number | null;
    dueGate?: number | null;
    actionId?: string;
    href?: string;
  };
}

export interface NextStep {
  /** Imperative, one sentence. */
  statement: string;
  /** What this step is attached to. Ungrounded steps are dropped. */
  source: RiskRef;
  sourceKind: 'Finding' | 'Action' | 'FailedCheck' | 'MissingEvidence' | 'GateCondition';
}

export interface GateAdvisory {
  gateNumber: number;
  phaseName: string;
  /** Advisory only. A human still decides. */
  recommendedOutcome: GateOutcome;
  /**
   * False while the gate is locked. There is no outcome to advise on a gate
   * that cannot be decided yet, so the screen says so rather than showing a
   * recommendation nobody can act on.
   */
  recommendationAvailable: boolean;
  /** Two or three sentences. Enforced, not merely requested. */
  rationale: string;
  keyStrengths: KeyStrength[];
  keyRisks: KeyRisk[];
  nextSteps: NextStep[];
  findingsCited: string[];
  checksCited: string[];
  actionsCited: string[];
  /** Always "Advisory Only — Human Decision Required". */
  advisoryLabel: string;
  /** How the prose was produced. */
  generatedBy: 'LLM' | 'StructuredFallback';
  /** True when the LLM proposed an outcome the configured rules forbid. */
  ruleOverrideApplied: boolean;
  /** The outcome the configured gate rules permit. */
  ruleOutcome: GateOutcome;
  allowedOutcomes: GateOutcome[];
  /** Why the rules landed where they did — shown in drill-down. */
  ruleReasons: string[];
}

/** What the Gate Review header shows above everything else. */
export interface GateAdvisoryHeader {
  gateNumber: number;
  phaseName: string;
  gateState: string;
  phaseState: string;
  openFindings: number;
  /** Open blocking actions bearing on this gate. */
  blockingActions: number;
  /**
   * The subset already due at this gate. A blocking action due later is
   * tracked work, not a blocker here — that distinction is what separates a
   * Conditional Pass from a Fail.
   */
  blockingActionsDueNow: number;
  requiredHumanDecision: string;
}

/** A preserved gate decision — AI side and human side, side by side. */
export interface GateDecisionRecord {
  decisionId: string;
  gateNumber: number;
  phaseName: string;
  /** AI recommendation + rationale + strengths + risks + next steps, frozen. */
  aiRecommendation: GateAdvisory | null;
  /** Numeric risk score at the time of the decision. */
  riskScore: { score: number; level: RiskLevel; display: string } | null;
  decision: GateOutcome;
  reviewerRole: string;
  /** Required when the human decision differs from the AI recommendation. */
  humanRationale: string;
  comments: string;
  artifactVersionsReviewed: string[];
  timestamp: string;
  divergedFromAi: boolean;
}

export interface GateAdvisoryResponse {
  header: GateAdvisoryHeader;
  riskScore: RiskScore;
  advisory: GateAdvisory;
  decisionRecords: GateDecisionRecord[];
}
