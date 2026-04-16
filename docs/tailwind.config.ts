// tailwind.config.ts
// Auto-derived from streamvault-tokens.json
// Drop this into your project root, replacing the default config.

import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class', // Add class="dark" to <html> — it's always dark for v1
  theme: {
    extend: {
      colors: {
        bg: {
          void:     '#0a0a0f',
          base:     '#111118',
          surface:  '#1a1a24',
          elevated: '#22222f',
          hover:    '#2a2a3a',
        },
        border: {
          subtle:   'rgba(255,255,255,0.06)',
          default:  'rgba(255,255,255,0.10)',
          emphasis: 'rgba(255,255,255,0.20)',
        },
        text: {
          primary:   '#f0f0f8',
          secondary: '#9090a8',
          muted:     '#555568',
          inverse:   '#0a0a0f',
        },
        accent: {
          DEFAULT: '#e8454a',
          hover:   '#f05055',
          dim:     'rgba(232,69,74,0.15)',
        },
        highlight: {
          DEFAULT: '#3b82f6',
          hover:   '#60a5fa',
          dim:     'rgba(59,130,246,0.15)',
        },
        tag: {
          new:      '#10b981',
          'new-bg': 'rgba(16,185,129,0.12)',
          top:      '#f59e0b',
          'top-bg': 'rgba(245,158,11,0.12)',
          live:     '#e8454a',
          season:   '#a78bfa',
        },
      },

      fontFamily: {
        sans: ["'DM Sans'", 'system-ui', '-apple-system', 'sans-serif'],
        mono: ["'DM Mono'", "'Fira Code'", 'monospace'],
      },

      fontSize: {
        'hero': ['48px', { lineHeight: '1.15', letterSpacing: '-1px',  fontWeight: '600' }],
        'xl':   ['28px', { lineHeight: '1.20', letterSpacing: '-0.5px', fontWeight: '600' }],
        'lg':   ['22px', { lineHeight: '1.25', letterSpacing: '-0.3px', fontWeight: '600' }],
        'md':   ['17px', { lineHeight: '1.30', letterSpacing: '-0.2px', fontWeight: '600' }],
        'base': ['15px', { lineHeight: '1.60', letterSpacing: '0',      fontWeight: '400' }],
        'sm':   ['13px', { lineHeight: '1.50', letterSpacing: '0',      fontWeight: '400' }],
        'xs':   ['11px', { lineHeight: '1.40', letterSpacing: '0.5px',  fontWeight: '500' }],
      },

      borderRadius: {
        none: '0px',
        xs:   '4px',
        sm:   '6px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        full: '9999px',
      },

      boxShadow: {
        card:  '0 4px 24px rgba(0,0,0,0.5)',
        hover: '0 8px 40px rgba(0,0,0,0.7)',
        focus: '0 0 0 2px rgba(59,130,246,0.5)',
      },

      transitionDuration: {
        fast: '150ms',
        base: '220ms',
        slow: '350ms',
      },

      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        snappy: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      zIndex: {
        navbar:  '200',
        modal:   '300',
        tooltip: '400',
        player:  '500',
      },

      // Named spacing aliases (use sparingly — prefer numeric scale)
      spacing: {
        'page': '24px',
      },
    },
  },
  plugins: [],
}

export default config
