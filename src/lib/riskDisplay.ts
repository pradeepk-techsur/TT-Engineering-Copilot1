/**
 * Client-side risk presentation.
 *
 * Two rules the whole app follows:
 *   • the score is ALWAYS shown as a number AND a word — "68 / 100, High".
 *     Colour is reinforcement, never the only carrier of meaning; and
 *   • the weighting arithmetic never appears on a primary screen. It lives in
 *     the drill-down, next to the items that produced it.
 */

import type { RiskLevel, RiskScore } from '@/shared/types/risk';
import type { Tone, StatusStyle } from '@/lib/status';

/**
 * Risk level → the app's existing six-tone status language.
 *
 * Low used to be `pass`, which put a green risk pill immediately beside a
 * green "Passed" status pill on every completed lifecycle row — two greens
 * saying different things. A low risk is not an achievement; it is the absence
 * of a problem, so it reads neutral.
 */
export const riskLevelTone: Record<RiskLevel, Tone> = {
  Low: 'neutral',
  Medium: 'warn',
  High: 'warn',
  Critical: 'fail',
};

export const riskLevelStyle: Record<RiskLevel, StatusStyle> = {
  Low: { label: 'Low', tone: 'neutral' },
  Medium: { label: 'Medium', tone: 'warn' },
  High: { label: 'High', tone: 'warn' },
  Critical: { label: 'Critical', tone: 'fail' },
};

/**
 * Only High and Critical are tinted. Medium keeps its amber dot but drops the
 * fill, so a page can carry a Medium score without it competing with the one
 * thing on screen that actually needs a decision.
 */
export const riskLevelEmphasis: Record<RiskLevel, 'quiet' | 'loud'> = {
  Low: 'quiet',
  Medium: 'quiet',
  High: 'loud',
  Critical: 'loud',
};

/** "Risk: 68 / 100, High" — the compact display used in every header. */
export function riskDisplay(risk: Pick<RiskScore, 'score' | 'level' | 'assessed' | 'configSnapshot'>): string {
  if (!risk.assessed) return 'Risk: not assessed';
  const cap = risk.configSnapshot?.cap ?? 100;
  return `Risk: ${risk.score} / ${cap}, ${risk.level}`;
}

/** Human label for each drill-down list. */
export const RISK_DRILLDOWN_LABELS = {
  contributingFindings: 'Main contributing findings',
  openActions: 'Open actions',
  failedChecks: 'Failed checks',
  missingEvidence: 'Missing evidence',
} as const;

export type RiskDrillDownKey = keyof typeof RISK_DRILLDOWN_LABELS;

export const RISK_DRILLDOWN_ORDER: RiskDrillDownKey[] = [
  'contributingFindings', 'openActions', 'failedChecks', 'missingEvidence',
];

/** Category → the wording used in the drill-down's calculation breakdown. */
export const RISK_CATEGORY_LABELS: Record<string, string> = {
  UnresolvedFinding: 'Unresolved finding',
  FailedMandatoryCheck: 'Failed mandatory check',
  MissingMandatoryEvidence: 'Missing mandatory evidence',
  OpenBlockingAction: 'Open blocking action',
  OverdueAction: 'Overdue action',
  UnclosedPriorGateAction: 'Unclosed prior-gate action',
};
