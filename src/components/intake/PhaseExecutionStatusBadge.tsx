import { StatusPillFor } from '@/components/ui/status-pill';
import { executionStatusStyle, styleFor } from '@/lib/status';

export function PhaseExecutionStatusBadge({ status }: { status: string }) {
  return (
    <span data-testid="phase-execution-status">
      <StatusPillFor status={styleFor(executionStatusStyle, status)} />
    </span>
  );
}
