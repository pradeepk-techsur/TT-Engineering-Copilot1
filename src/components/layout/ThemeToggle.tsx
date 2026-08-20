'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  // The inline script in layout.tsx has already applied the stored theme
  // before paint, so we read from the DOM rather than guessing "dark" and
  // correcting after hydration.
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(!document.documentElement.classList.contains('light'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('light', !next);
    try {
      localStorage.setItem('tt-theme', next ? 'dark' : 'light');
    } catch {
      /* private mode — theme just won't persist */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'flex size-7 items-center justify-center rounded-lg text-fg-muted transition-colors',
        'hover:bg-hover hover:text-fg'
      )}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      data-testid="theme-toggle"
    >
      {dark ? <Sun size={14} strokeWidth={2} /> : <Moon size={14} strokeWidth={2} />}
    </button>
  );
}
