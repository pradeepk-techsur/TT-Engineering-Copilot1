import { Sidebar } from './Sidebar';
import { Breadcrumb } from './Breadcrumb';
import { SyntheticBadge } from './SyntheticBadge';
import { ThemeToggle } from './ThemeToggle';
import { PhaseStepper } from '@/components/lifecycle/PhaseStepper';
import { LlmKeyStatusBadge } from '@/components/settings/LlmKeyStatusBadge';

interface AppShellProps {
  children: React.ReactNode;
  phaseId?: number;
  gateId?: number;
  /** Full-bleed screens manage their own padding. */
  bleed?: boolean;
}

export function AppShell({ children, phaseId, gateId, bleed }: AppShellProps) {
  const hasBreadcrumb = phaseId !== undefined || gateId !== undefined;

  return (
    // h-screen + min-h-0 on the row is what lets the sidebar run the full
    // height of the viewport. It previously stopped wherever its content
    // ended, leaving a hard edge halfway down every page.
    <div className="flex h-screen flex-col overflow-hidden bg-canvas">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="flex h-13 shrink-0 items-center gap-3 border-b border-line bg-surface px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {/* Decorative mark only — the brand name lives in the text node
              beside it so it stays one selectable string. */}
          <span
            aria-hidden
            className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent-solid text-[11px] font-bold tracking-tight text-accent-fg"
          >
            TT
          </span>
          <span className="text-[13.5px] font-semibold tracking-[-0.01em] whitespace-nowrap text-fg">
            TT Engineering Copilot
          </span>
        </div>

        <span aria-hidden className="hidden h-4 w-px bg-line sm:block" />

        {/* Deliberately ONE flat text node. The project id also appears on
            the overview; giving it its own element here would make
            getByText('EVINV-POC-001', { exact: true }) match twice. */}
        <span className="hidden min-w-0 truncate text-[12.5px] text-fg-muted sm:block">
          EV-INV-800 · EVINV-POC-001
        </span>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <LlmKeyStatusBadge />
          <ThemeToggle />
          <SyntheticBadge />
        </div>
      </header>

      {/* ── Phase journey — persistent "where am I" across all 10 phases ── */}
      <div className="shrink-0 border-b border-line bg-surface px-4 py-2">
        <PhaseStepper currentPhaseId={phaseId} />
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        <Sidebar />

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          {hasBreadcrumb && (
            <div className="sticky top-0 z-10 shrink-0 border-b border-line bg-canvas/85 px-7 py-2 backdrop-blur-sm">
              <Breadcrumb phaseId={phaseId} gateId={gateId} />
            </div>
          )}

          {bleed ? (
            children
          ) : (
            <div className="mx-auto w-full max-w-[1400px] flex-1 animate-fade-up px-7 py-6">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
