'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mutate as globalMutate } from 'swr';
import { toast } from 'sonner';
import { Loader2, RotateCcw } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * New Cycle — clear the current run and start the lifecycle again at Phase 0.
 *
 * A cycle leaves the uploaded input files and the generated output artifacts
 * behind, so the next walkthrough starts halfway through the story: phases
 * already have their inputs, outputs are already sitting there for approval.
 * This is the way back to Phase 0.
 *
 * It lives in the top bar because that is the only place present on every
 * screen — you notice the stale files on a phase workspace, not on the
 * overview. It is quiet chrome until you open it, and destructive only behind
 * the confirmation, because it deletes files.
 */
export function NewCycleButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  const handleNewCycle = async () => {
    setStarting(true);
    try {
      const res = await fetch('/api/project/new-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });

      // The preview proxy answers with a plain-text error page when the
      // upstream times out, so only parse JSON when it says it is JSON.
      const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
      const data = isJson ? await res.json() : null;

      if (!res.ok || !data) {
        toast.error('Could not start a new cycle', {
          description:
            data?.message ?? 'The server returned an unexpected response. Check that the app is running.',
        });
        return;
      }

      const files = (data.filesRemoved?.uploads ?? 0) + (data.filesRemoved?.outputs ?? 0);
      const filesCleared = files === 0
        ? 'There were no leftover files to clear.'
        : `${files} uploaded and generated ${files === 1 ? 'file' : 'files'} cleared.`;

      // Preview mode has no database to clear, so the phase states and outputs
      // on screen are unchanged. Saying "new cycle started" there would be a
      // reassuring lie about the half of the job that did not happen.
      if (data.database === 'unavailable') {
        toast.warning('Files cleared', {
          description:
            `${filesCleared} Run state was left as it is — no database is reachable, ` +
            'so phase states, findings and outputs are unchanged.',
        });
      } else {
        toast.success('New cycle started', {
          description: `${filesCleared} The lifecycle is back at Phase 0.`,
        });
      }

      setOpen(false);

      // Revalidate every SWR key — readiness, execution status, outputs, risk,
      // advisories and the lifecycle document all just changed — then re-render
      // the server components that read the same data directly.
      await globalMutate(() => true);
      router.refresh();
    } catch {
      toast.error('Could not start a new cycle', {
        description: 'Could not reach the server. Check your connection and try again.',
      });
    } finally {
      setStarting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            title="Clear the uploaded inputs and generated outputs, and start a new cycle at Phase 0"
            data-testid="new-cycle-button"
          />
        }
      >
        <RotateCcw size={13} strokeWidth={2} />
        New Cycle
      </DialogTrigger>

      <DialogContent data-testid="new-cycle-dialog">
        <DialogHeader>
          <DialogTitle>Start a new cycle?</DialogTitle>
          <DialogDescription>
            This clears the current cycle: the input files you uploaded, the artifacts the
            agents generated, and the findings, actions, deterministic check results and
            gate decisions they produced. Every phase goes back to waiting for its inputs,
            and the lifecycle returns to Phase 0.
          </DialogDescription>
        </DialogHeader>

        <p className="text-[12.5px] leading-relaxed text-fg-muted">
          Your Anthropic API key is kept. So is the audit trail — it is append-only, so the
          new cycle is recorded there rather than erasing what happened.
        </p>

        <DialogFooter>
          <Button variant="outline" disabled={starting} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={starting}
            data-testid="new-cycle-confirm"
            onClick={handleNewCycle}
          >
            {starting ? (
              <Loader2 size={14} strokeWidth={2} className="animate-spin" />
            ) : (
              <RotateCcw size={13} strokeWidth={2} />
            )}
            {starting ? 'Clearing…' : 'New Cycle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
