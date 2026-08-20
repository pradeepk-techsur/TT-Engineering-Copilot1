'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, GitBranch, BookOpen, Settings } from 'lucide-react';

const NAV = [
  { href: '/',         label: 'Project Overview', icon: LayoutDashboard },
  { href: '/lifecycle', label: 'Lifecycle',        icon: GitBranch },
  { href: '/audit',    label: 'Audit & Findings', icon: BookOpen },
  { href: '/settings', label: 'Settings',          icon: Settings },
];

export function Sidebar() {
  const path = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return path === '/';
    // /findings-actions redirects to /audit — treat both as active
    if (href === '/audit') return path === '/audit' || path === '/findings-actions';
    return path.startsWith(href);
  };

  return (
    <aside
      className="w-48 flex-shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] h-full"
      aria-label="Main navigation"
    >
      <nav className="flex flex-col gap-0.5 p-2 pt-3">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
              isActive(href)
                ? 'bg-white/10 text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text-primary)]'
            )}
            aria-current={isActive(href) ? 'page' : undefined}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Phase quick-links — compact 2-column grid */}
      <div className="px-2 pb-3 mt-1 border-t border-[var(--color-border)]">
        <p className="text-[10px] text-[var(--color-text-muted)] px-3 py-2 uppercase tracking-widest font-medium">
          Phases
        </p>
        <div className="grid grid-cols-2 gap-0.5">
          {Array.from({ length: 10 }, (_, i) => (
            <Link
              key={i}
              href={`/phase/${i}`}
              className={cn(
                'px-2 py-1 rounded text-[11px] text-center transition-colors',
                path === `/phase/${i}`
                  ? 'bg-white/10 text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text-primary)]'
              )}
            >
              P{i}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
