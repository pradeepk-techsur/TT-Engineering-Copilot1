'use client';
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

type GateOutcome = 'Pass' | 'Conditional Pass' | 'Fail';

interface GateDecisionSelectorProps {
  gateId: number;
  blockingActionsOpen: boolean;
  onDecisionRecorded: () => void;
}

export function GateDecisionSelector({ gateId, blockingActionsOpen, onDecisionRecorded }: GateDecisionSelectorProps) {
  // No pre-selection — user must make affirmative choice (GR-06)
  const [selectedOutcome, setSelectedOutcome] = useState<GateOutcome | null>(null);
  const [comments, setComments] = useState('');
  const [reviewerRole, setReviewerRole] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canRecordPass = selectedOutcome !== 'Pass' || !blockingActionsOpen;
  const canRecord = selectedOutcome !== null && reviewerRole.trim().length > 0 && canRecordPass;

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
        body: JSON.stringify({ decision: selectedOutcome, comments }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? 'Gate decision failed.');
      } else {
        toast.success(`Gate ${gateId} — ${selectedOutcome} recorded by ${reviewerRole}.`);
        onDecisionRecorded();
      }
    } catch {
      toast.error('Gate decision submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="gate-decision-selector">
      {/* Reviewer role input */}
      <div className="space-y-1">
        <Label className="text-xs text-[var(--color-text-muted)]">Your Reviewer Role</Label>
        <Input
          placeholder="e.g. Program Manager, Engineering Lead..."
          value={reviewerRole}
          onChange={e => setReviewerRole(e.target.value)}
          className="text-sm"
          data-testid="reviewer-role-input"
        />
      </div>

      {/* Radio group — NO default value (GR-06: no pre-selection) */}
      <RadioGroup
        value={selectedOutcome ?? ''}  // empty string = nothing selected
        onValueChange={v => setSelectedOutcome(v as GateOutcome)}
        data-testid="gate-outcome-radio"
      >
        {(['Pass', 'Conditional Pass', 'Fail'] as GateOutcome[]).map(outcome => (
          <div key={outcome} className="flex items-center space-x-2 py-1">
            <RadioGroupItem value={outcome} id={`outcome-${outcome}`} />
            <Label
              htmlFor={`outcome-${outcome}`}
              className={`text-sm cursor-pointer ${outcome === 'Fail' ? 'text-[var(--color-fail)]' : outcome === 'Conditional Pass' ? 'text-[var(--color-conditional)]' : 'text-[var(--color-pass)]'}`}
            >
              {outcome}
            </Label>
          </div>
        ))}
      </RadioGroup>

      {/* Blocking action warning */}
      {selectedOutcome === 'Pass' && blockingActionsOpen && (
        <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
          ⛔ Cannot record Pass: blocking action(s) must be verified closed first.
        </div>
      )}

      {/* Comments */}
      <div className="space-y-1">
        <Label className="text-xs text-[var(--color-text-muted)]">Comments (optional)</Label>
        <Textarea
          placeholder="Add reviewer comments..."
          value={comments}
          onChange={e => setComments(e.target.value)}
          rows={2}
          className="text-sm resize-none"
          data-testid="gate-comments-input"
        />
      </div>

      {/* Record Decision — DISABLED until outcome selected (GR-06) */}
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              disabled={!canRecord || submitting}
              className="w-full"
              data-testid="record-decision-button"
            >
              {submitting ? 'Recording...' : 'Record Decision'}
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Gate {gateId} Decision</AlertDialogTitle>
            <AlertDialogDescription>
              You are recording <strong>{selectedOutcome}</strong> for Gate {gateId}. This action cannot be undone.
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
              Confirm — Record {selectedOutcome}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
