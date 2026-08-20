import Link from 'next/link';
import { ArrowRight, CircleDot, Gauge, ClipboardCheck, ShieldCheck } from 'lucide-react';
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
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3010'}/api/lifecycle`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
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
        tone: 'info' as const,
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
        subtitle="Programme status across the ten-phase TT Electronics engineering lifecycle."
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
            <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
              <Stat
                label="Gates cleared"
                value={
                  <>
                    {gatesPassed}
                    <span className="text-fg-faint">/10</span>
                  </>
                }
                tone={gatesPassed > 0 ? 'pass' : 'neutral'}
                hint={conditional > 0 ? `${conditional} conditional` : 'G0 through G9'}
              />
              <Stat
                label="Current phase"
                value={`P${currentPhaseId}`}
                hint={currentPhase?.phaseName ?? '—'}
              />
              <Stat
                label="Current gate"
                value={`G${data?.currentGate ?? currentPhaseId}`}
                hint={currentPhase ? styleFor(phaseStateStyle, currentPhase.phaseState).label : '—'}
              />
              <Stat
                label="Technical reviews"
                value={reviewCount}
                hint="Kickoff, SLR, PDR, CDR"
              />
            </div>

            {/* Progress rail — the same 10 phases, as one bar */}
            <div className="mt-6 flex items-center gap-3">
              <div
                className="flex h-1.5 flex-1 gap-0.5 overflow-hidden rounded-full"
                role="img"
                aria-label={`${gatesPassed} of 10 gates cleared`}
              >
                {phases.map(p => {
                  const s = styleFor(phaseStateStyle, p.phaseState);
                  return (
                    <span
                      key={p.phaseId}
                      className={`flex-1 rounded-full ${
                        s.tone === 'pass'
                          ? 'bg-pass'
                          : s.tone === 'warn'
                            ? 'bg-warn'
                            : s.tone === 'fail'
                              ? 'bg-fail'
                              : s.tone === 'info'
                                ? 'bg-info'
                                : 'bg-line-strong'
                      }`}
                    />
                  );
                })}
              </div>
              <span className="shrink-0 text-[11.5px] text-fg-muted tabular-nums">
                {Math.round((gatesPassed / 10) * 100)}% complete
              </span>
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
                          className={isCurrent ? 'bg-accent-soft/40' : undefined}
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

        {/* ── Quick links ──────────────────────────────────────────── */}
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickLink
            href="/lifecycle"
            icon={Gauge}
            title="Lifecycle"
            body="All ten phases with gate outcomes and intake behaviour."
          />
          <QuickLink
            href="/audit"
            icon={ClipboardCheck}
            title="Audit & Findings"
            body="Immutable event log, findings and corrective actions."
          />
          <QuickLink
            href={`/gate/${currentPhaseId}/review`}
            icon={ShieldCheck}
            title={`Gate ${currentPhaseId} review`}
            body="Record the human decision for the current gate."
          />
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

function QuickLink({
  href,
  icon: Icon,
  title,
  body,
}: {
  href: string;
  icon: typeof Gauge;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl border border-line bg-surface p-4 shadow-sm transition-colors hover:border-accent-line hover:bg-hover"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-raised text-fg-muted transition-colors group-hover:border-accent-line group-hover:text-accent-solid">
        <Icon size={15} strokeWidth={2} />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-fg">
          {title}
          <ArrowRight
            size={12}
            strokeWidth={2}
            className="text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent-solid"
          />
        </span>
        <span className="mt-1 block text-[12px] leading-relaxed text-fg-muted">{body}</span>
      </span>
    </Link>
  );
}
