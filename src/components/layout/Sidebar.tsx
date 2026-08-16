'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, GitBranch,
  AlertTriangle, History
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Project Overview', icon: LayoutDashboard },
  { href: '/lifecycle', label: 'Lifecycle', icon: GitBranch },
  { href: '/findings-actions', label: 'Findings & Actions', icon: AlertTriangle },
  { href: '/audit', label: 'Audit Log', icon: History },
];

const PHASE_SHORTCUTS = Array.from({ length: 10 }, (_, i) => ({
  href: `/phase/${i}`,
  label: `Phase ${i}`,
}));

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] h-full"
      aria-label="Main navigation"
    >
      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === href
                ? 'bg-white/10 text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text-primary)]'
            )}
            aria-current={pathname === href ? 'page' : undefined}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 pb-2">
        <p className="text-xs text-[var(--color-text-muted)] px-3 py-1.5 uppercase tracking-wide">
          Phases
        </p>
        <div className="flex flex-col gap-0.5">
          {PHASE_SHORTCUTS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs transition-colors',
                pathname.startsWith(href) && href !== '/'
                  ? 'bg-white/10 text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-muted)] hover:bg-white/5'
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
