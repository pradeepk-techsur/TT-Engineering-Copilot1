/**
 * Status language — the single source of truth for every state the UI shows.
 *
 * Before this existed, each component carried its own `Record<string, string>`
 * of Tailwind classes, so the same state was a different colour on different
 * screens and raw enum names ("GatePassed", "AwaitingReview") leaked to users.
 *
 * Add a state here, never in a component. Six tones, no more:
 *   pass      something is done / valid / approved
 *   fail      something is blocked / invalid / rejected
 *   warn      something needs a human / is conditional / is waiting on input
 *   info      in flight, or advisory (AI) — never an outcome
 *   synthetic POC / simulated / seeded data provenance
 *   neutral   not started, not applicable, no opinion
 *
 * ── Emphasis ──────────────────────────────────────────────────────────────
 * Tone says what a state MEANS. Emphasis says how loudly to say it.
 *
 * A screen that tints every pill teaches the eye nothing: ten green "Passed"
 * rows and one amber "Awaiting Gate" read as eleven decorations rather than
 * one thing that needs you. So only states that ask for action — warn and
 * fail — are rendered LOUD (tinted fill, tinted border, tinted text). Settled
 * states are QUIET: one neutral chip, with the tone carried by its dot.
 *
 * The dot means colour is never the only carrier of meaning, and the label is
 * always spelled out, so a quiet pill loses no information — only volume.
 */

export type Tone = 'pass' | 'fail' | 'warn' | 'info' | 'synthetic' | 'neutral' | 'accent';

export interface StatusStyle {
  /** Human-readable label. Enum names are never shown to users. */
  label: string;
  tone: Tone;
  /** Pulse the pill's dot — reserved for genuinely in-flight work. */
  pulse?: boolean;
}

/** Tailwind class triplet per tone. Tokens only — theme-safe in both modes. */
export const toneClass: Record<Tone, string> = {
  pass:      'text-pass bg-pass-soft border-pass-line',
  fail:      'text-fail bg-fail-soft border-fail-line',
  warn:      'text-warn bg-warn-soft border-warn-line',
  info:      'text-info bg-info-soft border-info-line',
  synthetic: 'text-synthetic bg-synthetic-soft border-synthetic-line',
  neutral:   'text-fg-muted bg-neutral-soft border-neutral-line',
  accent:    'text-accent-solid bg-accent-soft border-accent-line',
};

export type Emphasis = 'quiet' | 'loud';

/**
 * The quiet pill: one neutral chip in every tone, so a list of settled states
 * reads as a column of labels instead of a row of swatches. The tone survives
 * in the dot (see `toneDot`), which every quiet pill renders.
 */
export const toneClassQuiet: Record<Tone, string> = {
  pass:      'text-fg-2 bg-raised border-line',
  fail:      'text-fg-2 bg-raised border-line',
  warn:      'text-fg-2 bg-raised border-line',
  info:      'text-fg-2 bg-raised border-line',
  synthetic: 'text-fg-2 bg-raised border-line',
  neutral:   'text-fg-muted bg-raised border-line',
  accent:    'text-fg-2 bg-raised border-line',
};

/**
 * How loudly each tone speaks by default. Only the two tones that ask
 * something of the reader are tinted; the rest stay quiet so those two can be
 * seen. Override per instance with `emphasis` when a specific cluster needs it
 * (e.g. a severity chip sitting next to a status chip, where two tinted pills
 * would compete).
 */
export const defaultEmphasis: Record<Tone, Emphasis> = {
  pass:      'quiet',
  fail:      'loud',
  warn:      'loud',
  info:      'quiet',
  synthetic: 'quiet',
  neutral:   'quiet',
  accent:    'quiet',
};

/** Just the foreground colour — for icons and inline text. */
export const toneText: Record<Tone, string> = {
  pass:      'text-pass',
  fail:      'text-fail',
  warn:      'text-warn',
  info:      'text-info',
  synthetic: 'text-synthetic',
  neutral:   'text-fg-muted',
  accent:    'text-accent-solid',
};

/** Just the background colour — for dots and progress fills. */
export const toneDot: Record<Tone, string> = {
  pass:      'bg-pass',
  fail:      'bg-fail',
  warn:      'bg-warn',
  info:      'bg-info',
  synthetic: 'bg-synthetic',
  neutral:   'bg-fg-faint',
  accent:    'bg-accent-solid',
};

/* ── Phase lifecycle state (ProjectState.phaseState) ───────────────────── */
export const phaseStateStyle: Record<string, StatusStyle> = {
  GatePassed:      { label: 'Passed',           tone: 'pass' },
  GateConditional: { label: 'Conditional',      tone: 'warn' },
  GateFailed:      { label: 'Failed',           tone: 'fail' },
  AwaitingGate:    { label: 'Awaiting Gate',    tone: 'warn' },
  Running:         { label: 'Running',          tone: 'info', pulse: true },
  AwaitingInputs:  { label: 'Awaiting Inputs',  tone: 'info' },
  Pending:         { label: 'Not Started',      tone: 'neutral' },
  Cancelled:       { label: 'Cancelled',        tone: 'fail' },
  Paused:          { label: 'Paused',           tone: 'warn' },
};

/** Compact form for the G0–G9 summary rail, where space is tight. */
export const gateOutcomeShort: Record<string, StatusStyle> = {
  GatePassed:      { label: 'Pass',      tone: 'pass' },
  GateConditional: { label: 'Cond.',     tone: 'warn' },
  GateFailed:      { label: 'Fail',      tone: 'fail' },
  AwaitingGate:    { label: 'Open',      tone: 'warn' },
  Running:         { label: 'Running',   tone: 'info', pulse: true },
  AwaitingInputs:  { label: 'Inputs',    tone: 'info' },
  Pending:         { label: '—',         tone: 'neutral' },
  Cancelled:       { label: 'Cancelled', tone: 'fail' },
  Paused:          { label: 'Paused',    tone: 'warn' },
};

/* ── Gate state ───────────────────────────────────────────────────────── */
export const gateStateStyle: Record<string, StatusStyle> = {
  Open:    { label: 'Open',    tone: 'warn' },
  Decided: { label: 'Decided', tone: 'pass' },
  Locked:  { label: 'Locked',  tone: 'neutral' },
};

/* ── Gate decision outcome (what a human records) ──────────────────────── */
export const gateOutcomeStyle: Record<string, StatusStyle> = {
  'Pass':             { label: 'Pass',             tone: 'pass' },
  'Conditional Pass': { label: 'Conditional Pass', tone: 'warn' },
  'Fail':             { label: 'Fail',             tone: 'fail' },
};

/* ── Phase execution status ────────────────────────────────────────────── */
export const executionStatusStyle: Record<string, StatusStyle> = {
  'Waiting for User Input':                 { label: 'Waiting for User Input',   tone: 'warn' },
  'Waiting for Synthetic Sample Ingestion': { label: 'Waiting for Ingestion',    tone: 'warn' },
  'Ready to Run':                           { label: 'Ready to Run',             tone: 'pass' },
  'Processing':                             { label: 'Running',                  tone: 'info', pulse: true },
  'Awaiting Human Decision':                { label: 'Awaiting Your Decision',   tone: 'warn' },
  'Complete':                               { label: 'Complete',                 tone: 'pass' },
};

/* ── Input readiness ──────────────────────────────────────────────────── */
/**
 * Readiness keeps the spec's own wording as its label. These strings come from
 * the FRD and the acceptance tests assert on them verbatim, so only the tone
 * and the pill treatment are ours — never the words.
 */
export const readinessStyle: Record<string, StatusStyle> = {
  'Ready':                                  { label: 'Ready',                                  tone: 'pass' },
  'User Input Ready':                       { label: 'User Input Ready',                       tone: 'pass' },
  'Synthetic System Input Ready':           { label: 'Synthetic System Input Ready',           tone: 'pass' },
  'Awaiting User Input':                    { label: 'Awaiting User Input',                    tone: 'warn' },
  'Waiting for Synthetic Sample Ingestion': { label: 'Waiting for Synthetic Sample Ingestion', tone: 'warn' },
  'Invalid':                                { label: 'Invalid',                                tone: 'fail' },
};

/* ── Output approval ──────────────────────────────────────────────────── */
export const approvalStyle: Record<string, StatusStyle> = {
  Pending:        { label: 'Pending',         tone: 'neutral' },
  AwaitingReview: { label: 'Awaiting Review', tone: 'warn' },
  Approved:       { label: 'Approved',        tone: 'pass' },
  Rejected:       { label: 'Rejected',        tone: 'fail' },
};

/* ── Finding severity ─────────────────────────────────────────────────── */
export const severityStyle: Record<string, StatusStyle> = {
  Critical:    { label: 'Critical',    tone: 'fail' },
  Major:       { label: 'Major',       tone: 'warn' },
  Minor:       { label: 'Minor',       tone: 'neutral' },
  Observation: { label: 'Observation', tone: 'neutral' },
};

/* ── Finding / action status ──────────────────────────────────────────── */
export const findingStatusStyle: Record<string, StatusStyle> = {
  Open:           { label: 'Open',            tone: 'warn' },
  InProgress:     { label: 'In Progress',     tone: 'info', pulse: true },
  'In Progress':  { label: 'In Progress',     tone: 'info', pulse: true },
  Closed:         { label: 'Closed',          tone: 'pass' },
  VerifiedClosed: { label: 'Verified Closed', tone: 'pass' },
  Deferred:       { label: 'Deferred',        tone: 'neutral' },
};

/* ── Deterministic check / checklist item result ──────────────────────── */
export const checkStatusStyle: Record<string, StatusStyle> = {
  Pass:    { label: 'Pass',           tone: 'pass' },
  Fail:    { label: 'Fail',           tone: 'fail' },
  Pending: { label: 'Not Yet Run',    tone: 'neutral' },
  NA:      { label: 'N/A',            tone: 'neutral' },
  'N/A':   { label: 'N/A',            tone: 'neutral' },
  Unknown: { label: 'Unknown',        tone: 'neutral' },
};

/* ── Intake behaviour (UP = user-provided, SI = simulated system input) ── */
export const behaviorStyle: Record<string, StatusStyle> = {
  // Provenance, not status — these were blue and purple, which made an audit
  // table of 4 rows carry 4 hues. Neutral: the letters already say it.
  UP: { label: 'UP', tone: 'neutral' },
  SI: { label: 'SI', tone: 'neutral' },
};

export const BEHAVIOR_GLOSSARY: Record<string, string> = {
  UP: 'User-Provided — you upload this input as a file',
  SI: 'Simulated System Input — ingested from a preloaded synthetic sample; no live system connection',
};

const FALLBACK: StatusStyle = { label: 'Unknown', tone: 'neutral' };

/**
 * Look a state up in a map without crashing on an unseen value from the API.
 * Falls back to a neutral pill showing the raw value, so a new backend enum
 * degrades to "visible but unstyled" instead of silently rendering nothing.
 */
export function styleFor(
  map: Record<string, StatusStyle>,
  key: string | null | undefined
): StatusStyle {
  if (!key) return FALLBACK;
  return map[key] ?? { label: key, tone: 'neutral' };
}
