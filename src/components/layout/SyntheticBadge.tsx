import { FlaskConical } from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';

export function SyntheticBadge() {
  return (
    <StatusPill
      tone="synthetic"
      className="gap-1.5 font-semibold tracking-[0.04em] uppercase"
      title="Synthetic POC Data — not real TT Electronics product data"
      aria-label="Synthetic POC data — not real TT Electronics product data"
    >
      <FlaskConical size={11} strokeWidth={2.5} />
      Synthetic POC
    </StatusPill>
  );
}
