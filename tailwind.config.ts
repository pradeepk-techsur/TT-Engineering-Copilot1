import type { Config } from 'tailwindcss';
const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        pass: 'var(--color-pass)',
        conditional: 'var(--color-conditional)',
        fail: 'var(--color-fail)',
        awaiting: 'var(--color-awaiting)',
        upcoming: 'var(--color-upcoming)',
        synthetic: 'var(--color-synthetic)',
        advisory: 'var(--color-advisory)',
        blocked: 'var(--color-blocked)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
