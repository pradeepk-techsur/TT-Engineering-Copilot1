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
}

export function AppShell({ children, phaseId, gateId }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      {/* Top bar */}
      <header className="h-12 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center px-4 gap-3 flex-shrink-0 z-10">
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          TT Engineering Copilot
        </span>
        <span className="text-xs text-[var(--color-text-muted)] hidden sm:block">
          EV-INV-800 · EVINV-POC-001
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <LlmKeyStatusBadge />
          <ThemeToggle />
          <SyntheticBadge />
        </div>
      </header>

      {/* Phase stepper — journey indicator across all 10 TT lifecycle phases */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 py-1.5">
        <PhaseStepper currentPhaseId={phaseId} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-auto">
          {/* Contextual breadcrumb — starts with phase, not product name */}
          {(phaseId !== undefined || gateId !== undefined) && (
            <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/50 px-6 py-1.5">
              <Breadcrumb phaseId={phaseId} gateId={gateId} />
            </div>
          )}
          <div className="flex-1 p-6 max-w-[1440px] w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
