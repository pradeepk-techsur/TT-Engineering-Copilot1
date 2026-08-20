import { FlaskConical } from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';

/**
 * The standing "this is not real product data" disclosure.
 *
 * It was a filled purple pill. Because it is on every screen, that made purple
 * a permanent member of the palette for a fact that never changes — and a
 * constant is the last thing that should be shouting. Quiet chip, same words.
 */
export function SyntheticBadge() {
  return (
    <StatusPill
      tone="neutral"
      size="sm"
      className="gap-1.5 tracking-[0.04em] uppercase"
      title="Synthetic POC Data — not real TT Electronics product data"
      aria-label="Synthetic POC data — not real TT Electronics product data"
    >
      <FlaskConical size={10} strokeWidth={2.5} />
      Synthetic POC
    </StatusPill>
  );
}
