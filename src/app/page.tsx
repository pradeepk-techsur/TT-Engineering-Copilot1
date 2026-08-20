import Link from 'next/link';
import { fetchJson } from '@/lib/serverFetch';
import { ArrowRight, CircleDot, Gauge } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, SectionLabel } from '@/components/ui/page-header';
import { StatusPill, StatusPillFor } from '@/components/ui/status-pill';
import { Callout } from '@/components/ui/callout';
import { ButtonLink } from '@/components/ui/button-link';
import { EmptyState } from '@/components/ui/empty-state';
import { Stat } from '@/components/ui/stat';
import { DataTable, THead, TH, TBody, TR, TD, TEmpty } from '@/components/ui/data-table';
import { TechReviewBadge } from '@/components/lifecycle/TechReviewBadge';
import { phaseStateStyle, styleFor } from '@/lib/status';

async function getProjectData() {
  // Resolves against the origin this request arrived on, and returns null
  // rather than throwing — an unreachable API degrades the page, not a 500.
  return fetchJson<any>('/api/lifecycle');
}

const DONE = ['GatePassed', 'GateConditional'];

/** What the user should do next, given the current phase's state. */
function nextAction(phase: { phaseId: number; phaseState: string } | undefined) {
  if (!phase) return null;
  switch (phase.phaseState) {
    case 'AwaitingGate':
      return {
        tone: 'warn' as const,
        title: `Gate ${phase.phaseId} is open and waiting on a human decision`,
        body: 'Phase execution has finished. Review the findings and AI recommendation, then record the gate outcome.',
        cta: 'Review gate',
        href: `/gate/${phase.phaseId}/review`,
      };
    case 'AwaitingInputs':
      return {
        tone: 'warn' as const,
        title: `Phase ${phase.phaseId} is waiting for its inputs`,
        body: 'Both the external-source and internal-artifact inputs must be ready before the phase can run.',
        cta: 'Open intake',
        href: `/phase/${phase.phaseId}/intake`,
      };
    case 'Running':
      return {
        tone: 'info' as const,
        title: `Phase ${phase.phaseId} is running`,
        body: 'Agents are working through this phase. Outputs appear on the phase workspace as they complete.',
        cta: 'Watch progress',
        href: `/phase/${phase.phaseId}`,
      };
    case 'GateFailed':
      return {
        tone: 'fail' as const,
        title: `Gate ${phase.phaseId} failed`,
        body: 'Close the blocking actions raised at this gate before the programme can move forward.',
        cta: 'View findings',
        href: `/gate/${phase.phaseId}/review`,
      };
    default:
      return null;
  }
}

export default async function ProjectOverviewPage() {
  const data = await getProjectData();
  const phases: any[] = data?.phases ?? [];

  const currentPhaseId: number = data?.currentPhase ?? 0;
  const currentPhase = phases.find(p => p.phaseId === currentPhaseId);
  const gatesPassed = phases.filter(p => DONE.includes(p.phaseState)).length;
  const conditional = phases.filter(p => p.phaseState === 'GateConditional').length;
  const reviewCount = phases.filter(p => p.technicalReview).length;
  const action = nextAction(currentPhase);

  return (
    <AppShell>
      <PageHeader
        title="Project Overview"
        actions={
          <ButtonLink variant="default" href={`/phase/${currentPhaseId}`}>
            Open current phase
            <ArrowRight size={14} strokeWidth={2} />
          </ButtonLink>
        }
      />

      <div className="space-y-5">
        {/* ── What needs you now. The overview used to make you infer this
               from a ten-row status table. ────────────────────────────── */}
        {action && (
          <Callout
            tone={action.tone}
            icon={CircleDot}
            title={action.title}
            action={
              <ButtonLink size="sm" variant="outline" href={action.href}>
                {action.cta}
                <ArrowRight size={13} strokeWidth={2} />
              </ButtonLink>
            }
          >
            {action.body}
          </Callout>
        )}

        {/* ── Programme metrics ─────────────────────────────────────── */}
        <Card>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
              <Stat
                label="Gates cleared"
                value={
                  <>
                    {gatesPassed}
                    <span className="text-fg-faint">/10</span>
                  </>
                }
                hint={conditional > 0 ? `${conditional} conditional` : undefined}
              />
              <Stat
                label="Current phase"
                value={`P${currentPhaseId}`}
                hint={
                  currentPhase
                    ? `${currentPhase.phaseName} · ${styleFor(phaseStateStyle, currentPhase.phaseState).label}`
                    : '—'
                }
              />
              <Stat
                label="Technical reviews"
                value={reviewCount}
                hint="Kickoff, SLR, PDR, CDR"
              />
            </div>

            {/* Progress rail. This used to tint each of the ten segments by
                that phase's state — a third rendering of the status column in
                the table below, and ten colour fields for information you
                were about to read anyway. Two tones: done, and not done. The
                "% complete" readout went with it; it was `gatesPassed / 10`
                spelled a second way, directly beside the fraction itself. */}
            <div className="mt-6 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
              {phases.map((p, i) => (
                <span
                  key={p.phaseId}
                  role={i === 0 ? 'img' : undefined}
                  aria-label={i === 0 ? `${gatesPassed} of 10 gates cleared` : undefined}
                  className={`flex-1 rounded-full ${
                    DONE.includes(p.phaseState) ? 'bg-accent-solid' : 'bg-line-strong'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Two columns: identity + phase table ──────────────────── */}
        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="min-w-0 lg:w-[340px] lg:shrink-0">
            <SectionLabel>Project</SectionLabel>
            <Card>
              <CardHeader>
                <CardTitle>
                  {data?.productName ?? 'EV-INV-800 Demonstration Traction Inverter'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-line text-[13px]">
                  <Row label="Project ID">
                    <span className="font-mono text-[11.5px] text-fg">
                      {data?.projectId ?? 'EVINV-POC-001'}
                    </span>
                  </Row>
                  <Row label="Type">{data?.projectType ?? 'NPI A'}</Row>
                  <Row label="Category">{data?.projectCategory ?? 'Category 1'}</Row>
                  <Row label="Status">
                    <StatusPill tone={data?.projectStatus === 'Closed' ? 'neutral' : 'pass'} dot>
                      {data?.projectStatus ?? 'Active'}
                    </StatusPill>
                  </Row>
                  <Row label="Standard">
                    <span className="text-fg-2">ENG 001 v4.1</span>
                  </Row>
                </dl>

                <Link
                  href="/lifecycle"
                  className="mt-4 inline-flex items-center gap-1.5 rounded text-[12.5px] font-medium text-accent-solid transition-colors hover:text-accent-hover"
                >
                  View full lifecycle
                  <ArrowRight size={13} strokeWidth={2} />
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="min-w-0 flex-1">
            <SectionLabel>Phase summary</SectionLabel>
            <Card className="py-0">
              <DataTable minWidth={560}>
                <THead>
                  <tr>
                    <TH className="w-[52px]">Phase</TH>
                    <TH>Name</TH>
                    <TH className="w-[150px]">Review</TH>
                    <TH className="w-[150px]">Status</TH>
                  </tr>
                </THead>
                <TBody>
                  {phases.length === 0 ? (
                    <TEmpty colSpan={4}>
                      <EmptyState
                        icon={Gauge}
                        title="Lifecycle data unavailable"
                        description="The lifecycle service did not return any phases. Check that the app's API is reachable."
                      />
                    </TEmpty>
                  ) : (
                    phases.map((phase: any) => {
                      const s = styleFor(phaseStateStyle, phase.phaseState);
                      const isCurrent = phase.phaseId === currentPhaseId;
                      return (
                        <TR
                          key={phase.phaseId}
                          interactive
                          className={isCurrent ? 'bg-hover' : undefined}
                        >
                          <TD className="font-mono text-[11.5px] text-fg-muted">
                            {isCurrent && (
                              <span
                                aria-hidden
                                className="mr-1.5 inline-block size-1 rounded-full bg-accent-solid align-middle"
                              />
                            )}
                            {phase.phaseId}
                          </TD>
                          <TD>
                            <Link
                              href={`/phase/${phase.phaseId}`}
                              className="rounded font-medium text-fg transition-colors hover:text-accent-solid"
                            >
                              {phase.phaseName}
                            </Link>
                          </TD>
                          <TD>
                            {phase.technicalReview ? (
                              <TechReviewBadge review={phase.technicalReview} />
                            ) : (
                              <span className="text-fg-faint">—</span>
                            )}
                          </TD>
                          <TD>
                            <StatusPillFor status={s} />
                          </TD>
                        </TR>
                      );
                    })
                  )}
                </TBody>
              </DataTable>
            </Card>
          </div>
        </div>

      </div>
    </AppShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-fg-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right text-fg">{children}</dd>
    </div>
  );
}
