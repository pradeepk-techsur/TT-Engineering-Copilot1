import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

async function getProjectData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/lifecycle`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function ProjectOverviewPage() {
  const data = await getProjectData();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Project Overview
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            TT Engineering Copilot — Proof of Concept
          </p>
        </div>

        {/* Project identity card */}
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardHeader>
            <CardTitle className="text-base text-[var(--color-text-primary)]">
              {data?.productName ?? 'EV-INV-800 Demonstration Traction Inverter'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[var(--color-text-muted)]">Project ID</dt>
                <dd className="font-mono text-xs mt-0.5 text-[var(--color-text-primary)]">
                  {data?.projectId ?? 'EVINV-POC-001'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-muted)]">Type</dt>
                <dd className="mt-0.5 text-[var(--color-text-primary)]">
                  {data?.projectType ?? 'NPI A'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-muted)]">Category</dt>
                <dd className="mt-0.5 text-[var(--color-text-primary)]">
                  {data?.projectCategory ?? 'Category 1'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-muted)]">Status</dt>
                <dd className="mt-0.5">
                  <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs">
                    {data?.projectStatus ?? 'Active'}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-muted)]">Current Phase</dt>
                <dd className="mt-0.5 text-[var(--color-text-primary)]">
                  Phase {data?.currentPhase ?? 0}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-muted)]">Current Gate</dt>
                <dd className="mt-0.5 text-[var(--color-text-primary)]">
                  Gate {data?.currentGate ?? 0}
                </dd>
              </div>
            </dl>
            <div className="mt-4">
              <Link
                href="/lifecycle"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                View full lifecycle →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Phase summary table */}
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardHeader>
            <CardTitle className="text-base text-[var(--color-text-primary)]">
              Phase Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Phase</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Name</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Review</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.phases ?? []).map((phase: any) => (
                    <tr
                      key={phase.phaseId}
                      className="border-b border-[var(--color-border)]/50 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono text-xs text-[var(--color-text-primary)]">
                        {phase.phaseId}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--color-text-primary)]">
                        <Link
                          href={`/phase/${phase.phaseId}`}
                          className="hover:text-blue-400 transition-colors"
                        >
                          {phase.phaseName}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-[var(--color-text-muted)] text-xs">
                        {phase.technicalReview ?? '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <PhaseStateBadge state={phase.phaseState} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
    Cancelled:       'bg-red-500/10 text-red-400 border-red-500/20',
    Paused:          'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
  return (
    <Badge className={`text-xs border ${styles[state] ?? styles.Pending}`}>
      {state}
    </Badge>
  );
}
