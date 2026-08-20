import type { Config } from 'tailwindcss';

/**
 * Tailwind CSS v4.
 *
 * Theme is defined in `src/app/globals.css` via `@theme inline` — that is the
 * single source of truth for colours, fonts, radii and animations. This file
 * previously duplicated a colour list (`pass`, `conditional`, `advisory`…) that
 * had drifted out of sync with the CSS and, without a `@config` directive, was
 * never loaded anyway. Keep it minimal so it can't lie.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  plugins: [],
};
export default config;
