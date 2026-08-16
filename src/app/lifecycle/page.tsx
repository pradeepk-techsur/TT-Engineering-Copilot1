import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

async function getLifecycleData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/lifecycle`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function LifecycleViewPage() {
  const data = await getLifecycleData();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Product Lifecycle View
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            ENG 001 v4.1 — Phase 0 through Phase 9 · Gate 0 through Gate 9
          </p>
        </div>

        {/* Lifecycle timeline — all 10 phases */}
        <div className="grid gap-3">
          {(data?.phases ?? []).map((phase: any) => (
            <Card
              key={phase.phaseId}
              className="bg-[var(--color-surface)] border-[var(--color-border)]"
              data-testid={`phase-${phase.phaseId}`}
            >
              <CardContent className="flex items-start gap-4 p-4">
                {/* Phase number indicator */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-primary)]">
                  {phase.phaseId}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/phase/${phase.phaseId}`}
                      className="text-sm font-medium text-[var(--color-text-primary)] hover:text-blue-400 transition-colors"
                    >
                      Phase {phase.phaseId}: {phase.phaseName}
                    </Link>
                    {/* Technical review — ONLY show for phases 0, 1, 3, 4 (null for others) */}
                    {phase.technicalReview && (
                      <Badge className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {phase.technicalReview}
                      </Badge>
                    )}
                    <PhaseStateBadge state={phase.phaseState} />
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-[var(--color-text-muted)]">
                    <span>Gate {phase.phaseId}: {phase.gateState}</span>
                    <span>Ext: {phase.externalIntakeBehavior}</span>
                    <span>Int: {phase.internalIntakeBehavior}</span>
                  </div>
                </div>

                <Link
                  href={`/gate/${phase.phaseId}/review`}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex-shrink-0 transition-colors"
                  aria-label={`Go to Gate ${phase.phaseId} Review`}
                >
                  Gate Review →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function PhaseStateBadge({ state }: { state: string }) {
  const styles: Record<string, string> = {
    GatePassed:      'bg-green-500/10 text-green-400 border-green-500/20',
    GateConditional: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    GateFailed:      'bg-red-500/10 text-red-400 border-red-500/20',
    AwaitingGate:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Running:         'bg-blue-500/10 text-blue-400 border-blue-500/20',
    AwaitingInputs:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Pending:         'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  return (
    <Badge className={`text-xs border ${styles[state] ?? styles.Pending}`}>
      {state}
    </Badge>
  );
}
