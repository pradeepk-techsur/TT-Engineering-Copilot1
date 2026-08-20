'use client';

import { useEffect, useState } from 'react';
import { Toaster as SonnerToaster } from 'sonner';

/**
 * App-wide toast host.
 *
 * This was missing entirely — `toast()` was called from the gate-decision,
 * upload and ingest flows but nothing rendered them, so every success and
 * failure message in the app was silently dropped. Mounted once in the root
 * layout. Styling comes from the design tokens so it tracks the theme.
 */
export function Toaster() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const read = () =>
      setTheme(document.documentElement.classList.contains('light') ? 'light' : 'dark');
    read();
    // ThemeToggle flips a class on <html>; mirror it so toasts never
    // sit in the wrong palette.
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <SonnerToaster
      theme={theme}
      position="bottom-right"
      closeButton
      duration={5000}
      gap={10}
      offset={20}
      toastOptions={{
        classNames: {
          toast:
            'group !bg-surface !border !border-line !text-fg !rounded-xl !shadow-lg !text-[13px] !gap-3',
          title: '!font-medium !text-fg',
          description: '!text-fg-muted !text-[12.5px]',
          actionButton: '!bg-accent-solid !text-accent-fg !rounded-md !text-xs',
          cancelButton: '!bg-raised !text-fg-2 !rounded-md !text-xs',
          closeButton: '!bg-surface !border-line !text-fg-muted hover:!text-fg',
          success: '!border-pass-line [&_[data-icon]]:!text-pass',
          error: '!border-fail-line [&_[data-icon]]:!text-fail',
          warning: '!border-warn-line [&_[data-icon]]:!text-warn',
          info: '!border-info-line [&_[data-icon]]:!text-info',
        },
      }}
    />
  );
}
