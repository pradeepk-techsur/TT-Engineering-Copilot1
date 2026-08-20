'use client';
import { useState } from 'react';
import {
  CheckCircle2, AlertTriangle, XCircle, ShieldBan, Loader2, Sparkles, GitCompareArrows,
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Callout } from '@/components/ui/callout';
import { StatusPillFor } from '@/components/ui/status-pill';
import { RiskScoreChip } from '@/components/risk/RiskScoreChip';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { toneText, gateOutcomeStyle, styleFor, type Tone } from '@/lib/status';
import type { GateAdvisory, RiskScore } from '@/shared/types/risk';

type GateOutcome = 'Pass' | 'Conditional Pass' | 'Fail';

interface GateDecisionSelectorProps {
  gateId: number;
  blockingActionsOpen: boolean;
  /** The advisory recommendation, shown so the human can agree or diverge. */
  aiRecommendation?: GateAdvisory | null;
  /** Preserved with the decision, so the record shows the risk at the time. */
  riskScore?: RiskScore | null;
  onDecisionRecorded: () => void;
}

/**
 * The three outcomes, with what each one means. The descriptions live
 * OUTSIDE the <Label> on purpose: the label's text is the control's
 * accessible name, and it must stay exactly the outcome word.
 */
/**
 * `id` must not contain whitespace: `htmlFor` and `aria-labelledby` treat a
 * space as a delimiter, so `outcome-Conditional Pass` silently failed to
 * associate — leaving that radio with no accessible name at all.
 */
function outcomeId(value: GateOutcome): string {
  return `outcome-${value.toLowerCase().replace(/\s+/g, '-')}`;
}

const OUTCOMES: {
  value: GateOutcome;
  tone: Tone;
  icon: typeof CheckCircle2;
  description: string;
}[] = [
  {
    value: 'Pass',
    tone: 'pass',
    icon: CheckCircle2,
    description: 'All criteria met. The phase closes and the next one opens.',
  },
  {
    value: 'Conditional Pass',
    tone: 'warn',
    icon: AlertTriangle,
    description: 'Proceed, but with corrective actions tracked to a due gate.',
  },
  {
    value: 'Fail',
    tone: 'fail',
    icon: XCircle,
    description: 'Criteria not met. The phase stays open and must be reworked.',
  },
];

export function GateDecisionSelector({
  gateId,
  blockingActionsOpen,
  aiRecommendation = null,
  riskScore = null,
  onDecisionRecorded,
}: GateDecisionSelectorProps) {
  // No pre-selection — user must make affirmative choice (GR-06)
  const [selectedOutcome, setSelectedOutcome] = useState<GateOutcome | null>(null);
  const [comments, setComments] = useState('');
  const [humanRationale, setHumanRationale] = useState('');
  const [reviewerRole, setReviewerRole] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Only a gate that can actually be decided carries a recommendation to
  // agree with or diverge from.
  const recommended = aiRecommendation?.recommendationAvailable
    ? aiRecommendation.recommendedOutcome
    : null;
  /**
   * The AI recommendation is advisory: a reviewer may record something else.
   * What they may not do is record it silently — a divergence has to carry a
   * reason, or the audit trail loses the only explanation of why.
   */
  const diverges = !!recommended && !!selectedOutcome && selectedOutcome !== recommended;
  const MIN_RATIONALE = 10;
  const rationaleTooShort = diverges && humanRationale.trim().length < MIN_RATIONALE;

  const canRecordPass = selectedOutcome !== 'Pass' || !blockingActionsOpen;
  const canRecord =
    selectedOutcome !== null &&
    reviewerRole.trim().length > 0 &&
    canRecordPass &&
    !rationaleTooShort;

  // Tell the user *why* the button is disabled instead of leaving them to
  // guess at a greyed-out control.
  const blockedReason = !selectedOutcome
    ? 'Choose an outcome to continue.'
    : !reviewerRole.trim()
      ? 'Enter your reviewer role to continue.'
      : !canRecordPass
        ? 'Blocking actions must be verified closed before a Pass.'
        : rationaleTooShort
          ? `Your decision differs from the AI recommendation — give a short rationale (at least ${MIN_RATIONALE} characters).`
          : null;

  const handleConfirm = async () => {
    if (!selectedOutcome || !reviewerRole.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/gates/${gateId}/decide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Human reviewer role required — AI actors are blocked server-side
          'X-Reviewer-Role': reviewerRole.trim(),
        },
        body: JSON.stringify({
          decision: selectedOutcome,
          comments,
          // Preserved alongside the AI recommendation and the risk score.
          humanRationale: humanRationale.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(`Gate ${gateId} decision was not recorded`, {
          description: data.message ?? 'The server rejected the decision. Please try again.',
        });
      } else {
        toast.success(`Gate ${gateId} — ${selectedOutcome} recorded`, {
          description: `Recorded by ${reviewerRole}.`,
        });
        onDecisionRecorded();
      }
    } catch {
      toast.error(`Gate ${gateId} decision was not recorded`, {
        description: 'Could not reach the server. Check your connection and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="gate-decision-selector">
      {/* The two are never the same thing, so they never look the same. */}
      {recommended && (
        <div
          className="rounded-lg border border-accent-line bg-accent-soft/40 px-2.5 py-2"
          data-testid="ai-vs-human"
        >
          {/* Wraps: at 360px the label, the outcome and the score do not fit
              on one line, and a clipped risk score is worse than a taller box. */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Sparkles size={11} strokeWidth={2.5} className="shrink-0 text-accent-solid" />
            <span className="text-[10px] font-semibold tracking-[0.07em] text-fg-muted uppercase">
              AI recommendation
            </span>
            <StatusPillFor status={styleFor(gateOutcomeStyle, recommended)} size="sm" />
            {riskScore && (
              <RiskScoreChip
                score={riskScore.score}
                level={riskScore.level}
                cap={riskScore.configSnapshot?.cap ?? 100}
                size="sm"
              />
            )}
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">
            Advisory only. Your decision below is the one that counts, and it may
            differ from this.
          </p>
        </div>
      )}

      {/* Reviewer role input */}
      <div className="space-y-1.5">
        <Label htmlFor="reviewer-role">Your reviewer role</Label>
        <Input
          id="reviewer-role"
          placeholder="e.g. Program Manager, Engineering Lead"
          value={reviewerRole}
          onChange={e => setReviewerRole(e.target.value)}
          data-testid="reviewer-role-input"
        />
      </div>

      {/* Outcome — NO default value (GR-06: no pre-selection).
          Each option is a full-height target; the control itself used to be a
          1px dark ring on a dark card, so this didn't read as a choice. */}
      <div className="space-y-1.5">
        <Label>Human decision</Label>
        <RadioGroup
          value={selectedOutcome ?? ''}  // empty string = nothing selected
          onValueChange={v => setSelectedOutcome(v as GateOutcome)}
          data-testid="gate-outcome-radio"
        >
          {OUTCOMES.map(({ value, tone, icon: Icon, description }) => {
            const selected = selectedOutcome === value;
            const disabledByBlock = value === 'Pass' && blockingActionsOpen;
            const isRecommended = recommended === value;

            return (
              <div
                key={value}
                onClick={() => setSelectedOutcome(value)}
                className={cn(
                  'cursor-pointer rounded-lg border p-2.5 transition-colors',
                  selected
                    ? 'border-accent-line bg-accent-soft'
                    : 'border-line bg-raised/40 hover:border-line-strong hover:bg-hover',
                  disabledByBlock && 'opacity-60'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <RadioGroupItem value={value} id={outcomeId(value)} />
                  <Icon
                    size={14}
                    strokeWidth={2}
                    className={cn('shrink-0', toneText[tone])}
                  />
                  {/* Label text is the accessible name — keep it exact. */}
                  <Label
                    htmlFor={outcomeId(value)}
                    className={cn(
                      'cursor-pointer text-[13px] font-semibold',
                      selected ? 'text-fg' : toneText[tone]
                    )}
                  >
                    {value}
                  </Label>
                  {/* Marks the advisory position without pre-selecting it. */}
                  {isRecommended && (
                    <span className="ml-auto flex shrink-0 items-center gap-1 text-[9.5px] font-bold tracking-[0.06em] text-accent-solid uppercase">
                      <Sparkles size={9} strokeWidth={3} />
                      AI advises
                    </span>
                  )}
                </div>
                <p className="mt-1 pl-[27px] text-[11.5px] leading-relaxed text-fg-muted">
                  {description}
                </p>
                {/* Say why this option is unavailable, at the point of the
                    decision — not only after it has been clicked. */}
                {disabledByBlock && (
                  <p className="mt-1 pl-[27px] text-[11.5px] font-medium text-fail">
                    Unavailable while blocking actions are open.
                  </p>
                )}
              </div>
            );
          })}
        </RadioGroup>
      </div>

      {/* Blocking action warning */}
      {selectedOutcome === 'Pass' && blockingActionsOpen && (
        <Callout tone="fail" icon={ShieldBan} title="Cannot record Pass">
          One or more blocking actions must be verified closed first.
        </Callout>
      )}

      {/* Divergence rationale — required, not optional, when the human and the
          AI disagree. */}
      {diverges && (
        <div className="space-y-1.5" data-testid="divergence-rationale-block">
          <Callout
            tone="warn"
            icon={GitCompareArrows}
            title={`Your decision differs from the AI recommendation (${recommended})`}
          >
            Record why. This rationale is preserved with the decision.
          </Callout>
          <Label htmlFor="human-rationale">
            Rationale for differing from the AI recommendation
            <span className="text-fail"> *</span>
          </Label>
          <Textarea
            id="human-rationale"
            placeholder={`Why ${selectedOutcome} rather than ${recommended}?`}
            value={humanRationale}
            onChange={e => setHumanRationale(e.target.value)}
            rows={3}
            className="resize-none"
            data-testid="human-rationale-input"
          />
        </div>
      )}

      {/* Comments */}
      <div className="space-y-1.5">
        <Label htmlFor="gate-comments">Reviewer comments (optional)</Label>
        <Textarea
          id="gate-comments"
          placeholder="Rationale, conditions, or context for this decision…"
          value={comments}
          onChange={e => setComments(e.target.value)}
          rows={3}
          className="resize-none"
          data-testid="gate-comments-input"
        />
      </div>

      {/* Approve Decision — DISABLED until outcome selected (GR-06) */}
      <div className="space-y-2 border-t border-line pt-3">
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                disabled={!canRecord || submitting}
                className="w-full"
                data-testid="record-decision-button"
              >
                {submitting && <Loader2 size={14} strokeWidth={2} className="animate-spin" />}
                {submitting ? 'Recording…' : 'Approve decision'}
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Gate {gateId} decision</AlertDialogTitle>
              <AlertDialogDescription>
                You are recording <strong>{selectedOutcome}</strong> for Gate {gateId}. This action cannot be undone.
                {recommended && (
                  <>
                    <br /><br />
                    AI recommendation: <strong>{recommended}</strong> (advisory)
                    <br />
                    Your decision: <strong>{selectedOutcome}</strong>
                    {diverges && ' — differs from the AI recommendation'}
                  </>
                )}
                <br /><br />
                Reviewer: <strong>{reviewerRole}</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                data-testid="confirm-gate-decision"
              >
                Confirm — record {selectedOutcome}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {blockedReason && (
          <p className="text-center text-[11.5px] text-fg-muted">{blockedReason}</p>
        )}
      </div>
    </div>
  );
}
