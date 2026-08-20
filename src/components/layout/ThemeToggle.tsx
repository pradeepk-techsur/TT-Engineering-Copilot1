'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const [dark, setDark] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('tt-theme');
    const isDark = stored !== 'light';
    setDark(isDark);
    document.documentElement.classList.toggle('light', !isDark);
    setReady(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('light', !next);
    localStorage.setItem('tt-theme', next ? 'dark' : 'light');
  };

  if (!ready) return <div className="w-7 h-7" />;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="h-7 w-7 p-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      data-testid="theme-toggle"
    >
      {dark ? <Sun size={14} /> : <Moon size={14} />}
    </Button>
  );
}
