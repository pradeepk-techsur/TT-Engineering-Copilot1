'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('tt-copilot-theme');
    const prefersDark = stored !== 'light';
    setIsDark(prefersDark);
    document.documentElement.classList.toggle('light', !prefersDark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('light', !next);
    localStorage.setItem('tt-copilot-theme', next ? 'dark' : 'light');
  };

  // Avoid hydration mismatch
  if (!mounted) return <div className="w-7 h-7" />;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="h-7 w-7 p-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      data-testid="theme-toggle"
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
    </Button>
  );
}
