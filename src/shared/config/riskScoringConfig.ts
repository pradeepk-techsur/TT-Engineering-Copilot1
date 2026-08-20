/**
 * Risk scoring configuration — weights and thresholds.
 *
 * The Overall Risk Score is ALWAYS computed by the application from these
 * structured rules. The LLM never calculates it. Everything here is
 * configurable: the defaults below match the specified rule set, and can be
 * overridden wholesale or field-by-field with the `RISK_SCORING_CONFIG`
 * environment variable (a JSON object using the same shape as
 * `RiskScoringConfigOverride`).
 *
 * Example — halve the weight of a minor finding and move the High band down:
 *   RISK_SCORING_CONFIG='{"weights":{"minorUnresolvedFinding":5},
 *                         "thresholds":{"high":50}}'
 */

import type { RiskLevel } from '@/shared/types/risk';

export interface RiskScoringWeights {
  /** Suggested rule: minor unresolved finding → +10. */
  minorUnresolvedFinding: number;
  /** Suggested rule: major unresolved finding → +25. */
  majorUnresolvedFinding: number;
  /** Suggested rule: critical unresolved finding → +40. */
  criticalUnresolvedFinding: number;
  /**
   * Observations are recorded but carry no risk by default. Raise this if an
   * observation should count toward the score.
   */
  observationUnresolvedFinding: number;
  /** Suggested rule: failed mandatory deterministic check → +20. */
  failedMandatoryCheck: number;
  /** Suggested rule: missing mandatory evidence item → +20. */
  missingMandatoryEvidence: number;
  /** Suggested rule: open blocking action → +20. */
  openBlockingAction: number;
  /** Suggested rule: action past its due gate → +10. */
  overdueAction: number;
  /** Suggested rule: action raised at an earlier gate, still open → +15. */
  unclosedPriorGateAction: number;
}

/**
 * Lower bound of each band. `low` is always 0. A score lands in the highest
 * band whose lower bound it reaches.
 */
export interface RiskLevelThresholds {
  medium: number;
  high: number;
  critical: number;
}

export interface RiskScoringConfig {
  /** Hard ceiling on the Overall Risk Score. */
  cap: number;
  weights: RiskScoringWeights;
  thresholds: RiskLevelThresholds;
  /**
   * Statuses that mean a finding or action no longer contributes risk.
   * `ClosedPendingVerification` is deliberately NOT here: until a human
   * verifies closure, the risk is still live.
   */
  resolvedStatuses: string[];
  /**
   * Count a not-ready phase input as missing mandatory evidence only while the
   * phase has not yet produced its outputs. Once a phase has executed, its
   * inputs are history and the gate reviews the outputs instead.
   */
  countInputEvidenceOnlyBeforeExecution: boolean;
}

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
export type RiskScoringConfigOverride = DeepPartial<RiskScoringConfig>;

export const DEFAULT_RISK_SCORING_CONFIG: RiskScoringConfig = {
  cap: 100,
  weights: {
    minorUnresolvedFinding: 10,
    majorUnresolvedFinding: 25,
    criticalUnresolvedFinding: 40,
    observationUnresolvedFinding: 0,
    failedMandatoryCheck: 20,
    missingMandatoryEvidence: 20,
    openBlockingAction: 20,
    overdueAction: 10,
    unclosedPriorGateAction: 15,
  },
  thresholds: {
    // 0–29 Low · 30–59 Medium · 60–79 High · 80–100 Critical
    medium: 30,
    high: 60,
    critical: 80,
  },
  resolvedStatuses: ['VerifiedClosed', 'Closed', 'Waived'],
  countInputEvidenceOnlyBeforeExecution: true,
};

function mergeConfig(
  base: RiskScoringConfig,
  override: RiskScoringConfigOverride | undefined
): RiskScoringConfig {
  if (!override) return base;
  return {
    cap: override.cap ?? base.cap,
    weights: { ...base.weights, ...(override.weights ?? {}) } as RiskScoringWeights,
    thresholds: { ...base.thresholds, ...(override.thresholds ?? {}) } as RiskLevelThresholds,
    resolvedStatuses: (override.resolvedStatuses as string[] | undefined) ?? base.resolvedStatuses,
    countInputEvidenceOnlyBeforeExecution:
      override.countInputEvidenceOnlyBeforeExecution ??
      base.countInputEvidenceOnlyBeforeExecution,
  };
}

/** Parsed once — a malformed env value must not take the app down. */
let envOverride: RiskScoringConfigOverride | null | undefined;

function readEnvOverride(): RiskScoringConfigOverride | null {
  if (envOverride !== undefined) return envOverride;
  const raw = process.env.RISK_SCORING_CONFIG;
  if (!raw || !raw.trim()) {
    envOverride = null;
    return null;
  }
  try {
    envOverride = JSON.parse(raw) as RiskScoringConfigOverride;
  } catch {
    console.warn('RISK_SCORING_CONFIG is not valid JSON — using default risk scoring rules.');
    envOverride = null;
  }
  return envOverride;
}

/** Effective configuration: defaults ← environment ← explicit call-site override. */
export function resolveRiskScoringConfig(
  override?: RiskScoringConfigOverride
): RiskScoringConfig {
  const fromEnv = readEnvOverride() ?? undefined;
  return mergeConfig(mergeConfig(DEFAULT_RISK_SCORING_CONFIG, fromEnv), override);
}

/** Test seam — drops the memoised env parse. */
export function resetRiskScoringConfigCache(): void {
  envOverride = undefined;
}

/** The band a score falls in. Never colour alone: the level is text. */
export function riskLevelFor(score: number, config: RiskScoringConfig): RiskLevel {
  const { medium, high, critical } = config.thresholds;
  if (score >= critical) return 'Critical';
  if (score >= high) return 'High';
  if (score >= medium) return 'Medium';
  return 'Low';
}

/** Explicit bands, for the drill-down and for the API's config endpoint. */
export function riskBands(
  config: RiskScoringConfig
): { level: RiskLevel; min: number; max: number }[] {
  const { medium, high, critical } = config.thresholds;
  return [
    { level: 'Low', min: 0, max: medium - 1 },
    { level: 'Medium', min: medium, max: high - 1 },
    { level: 'High', min: high, max: critical - 1 },
    { level: 'Critical', min: critical, max: config.cap },
  ];
}

/** Weight for one finding severity. Unknown severities score as minor. */
export function findingWeight(severity: string, config: RiskScoringConfig): number {
  switch (severity) {
    case 'Critical': return config.weights.criticalUnresolvedFinding;
    case 'Major': return config.weights.majorUnresolvedFinding;
    case 'Minor': return config.weights.minorUnresolvedFinding;
    case 'Observation': return config.weights.observationUnresolvedFinding;
    default: return config.weights.minorUnresolvedFinding;
  }
}

/** Severity → the risk level shown next to a Key Risk. */
export function severityToRiskLevel(severity: string): RiskLevel {
  switch (severity) {
    case 'Critical': return 'Critical';
    case 'Major': return 'High';
    case 'Minor': return 'Medium';
    default: return 'Low';
  }
}
