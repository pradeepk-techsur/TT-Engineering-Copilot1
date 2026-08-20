'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, GitBranch, BookOpen, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { phaseStateStyle, styleFor, toneDot } from '@/lib/status';
import { useLifecycle } from '@/lib/hooks';
import { PHASE_CONFIG_MAP } from '@/shared/constants/phaseConfig';

const NAV = [
  { href: '/',          label: 'Project Overview', icon: LayoutDashboard },
  { href: '/lifecycle', label: 'Lifecycle',        icon: GitBranch },
  { href: '/audit',     label: 'Audit & Findings', icon: BookOpen },
  { href: '/settings',  label: 'Settings',         icon: Settings },
];

/**
 * Names come from the canonical phase config — the sidebar used to keep its own
 * copy, which is exactly how a rename ends up half-applied.
 */
const phaseName = (id: number) =>
  PHASE_CONFIG_MAP[id as keyof typeof PHASE_CONFIG_MAP]?.phaseName ?? `Phase ${id}`;

export function Sidebar() {
  const path = usePathname();
  const { data } = useLifecycle();

  const phases: { phaseId: number; phaseState: string }[] =
    data?.phases ?? Array.from({ length: 10 }, (_, i) => ({ phaseId: i, phaseState: 'Pending' }));
  const currentPhase: number | undefined =
    typeof data?.currentPhase === 'number' ? data.currentPhase : undefined;

  const isActive = (href: string) => {
    if (href === '/') return path === '/';
    // /findings-actions redirects to /audit — treat both as active
    if (href === '/audit') return path === '/audit' || path === '/findings-actions';
    return path.startsWith(href);
  };

  return (
    <aside
      className="flex h-full w-60 shrink-0 flex-col overflow-y-auto border-r border-line bg-surface"
      aria-label="Main navigation"
    >
      <nav className="flex flex-col gap-0.5 p-2.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                // Interaction states use tokens, so they are visible in light
                // mode too — these used to be `bg-white/10`, which is
                // invisible on a white surface.
                'relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
                active
                  ? 'bg-active text-fg'
                  : 'text-fg-muted hover:bg-hover hover:text-fg'
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute top-1/2 left-0 h-4 w-[2.5px] -translate-y-1/2 rounded-r-full bg-accent-solid"
                />
              )}
              <Icon
                size={15}
                strokeWidth={2}
                className={cn('shrink-0', active ? 'text-accent-solid' : 'text-current')}
              />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Phase rail ──────────────────────────────────────────────────
          Was a 2-column grid of bare "P0…P9" chips, which told you nothing
          and duplicated the stepper. Now each row carries its name and a
          status dot, so it works as a table of contents for the programme. */}
      <div className="mt-1 border-t border-line px-2.5 pt-3 pb-4">
        <p className="px-2 pb-2 text-[10px] font-semibold tracking-[0.1em] text-fg-faint uppercase">
          Phases
        </p>
        <div className="flex flex-col gap-px">
          {phases.map(({ phaseId, phaseState }) => {
            const active = path === `/phase/${phaseId}` || path.startsWith(`/phase/${phaseId}/`);
            const status = styleFor(phaseStateStyle, phaseState);
            const isCurrent = phaseId === currentPhase;

            return (
              <Link
                key={phaseId}
                href={`/phase/${phaseId}`}
                aria-current={active ? 'page' : undefined}
                title={`Phase ${phaseId}: ${phaseName(phaseId)} — ${status.label}`}
                className={cn(
                  'group flex items-center gap-2 rounded-md px-2 py-[5px] text-[12px] transition-colors',
                  active
                    ? 'bg-active text-fg'
                    : 'text-fg-muted hover:bg-hover hover:text-fg'
                )}
              >
                <span
                  aria-hidden
                  className={cn('size-1.5 shrink-0 rounded-full', toneDot[status.tone])}
                />
                <span className="w-[15px] shrink-0 font-mono text-[10.5px] text-fg-faint tabular-nums">
                  {phaseId}
                </span>
                <span className="truncate">{phaseName(phaseId)}</span>
                {isCurrent && (
                  <span
                    className="ml-auto shrink-0 text-[9.5px] font-semibold tracking-wide text-accent-solid uppercase"
                    title="Current phase"
                  >
                    Now
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-auto border-t border-line px-4 py-3">
        <p className="text-[10.5px] leading-relaxed text-fg-faint">
          TT Electronics ENG 001 v4.1
        </p>
      </div>
    </aside>
  );
}
