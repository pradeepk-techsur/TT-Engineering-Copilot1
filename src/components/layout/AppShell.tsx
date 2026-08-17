import { Sidebar } from './Sidebar';
import { Breadcrumb } from './Breadcrumb';
import { SyntheticBadge } from './SyntheticBadge';

interface AppShellProps {
  children: React.ReactNode;
  phaseId?: number;
  gateId?: number;
}

export function AppShell({ children, phaseId, gateId }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      {/* Top bar */}
      <header className="h-14 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center px-4 gap-3 flex-shrink-0">
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          TT Engineering Copilot
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">
          EV-INV-800 · EVINV-POC-001
        </span>
        <div className="ml-auto">
          <SyntheticBadge />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-auto">
          {/* Breadcrumb */}
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/50 px-6 py-2">
            <Breadcrumb phaseId={phaseId} gateId={gateId} />
          </div>

          {/* Page content */}
          <div className="flex-1 p-6 max-w-[1440px] w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
