import { Badge } from '@/components/ui/badge';

export function SyntheticBadge() {
  return (
    <Badge
      className="bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-medium"
      aria-label="Synthetic POC data — not real TT Electronics product data"
    >
      SYNTHETIC POC
    </Badge>
  );
}
