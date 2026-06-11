/**
 * Central design token reference.
 * These mirror the CSS custom properties in globals.css.
 * Use the CSS variables (var(--token)) in JSX inline styles when needed.
 * All Tailwind utility overrides are handled via globals.css.
 */

export const tokens = {
  light: {
    bgPage:      '#F8FAFC',   // slate-50  — outermost page background
    bgSurface:   '#FFFFFF',   // white     — cards, sidebar, modals
    bgSurface2:  '#F1F5F9',   // slate-100 — inner sections, table heads
    bgSurface3:  '#E2E8F0',   // slate-200 — tags, badges, hover chips

    border:       '#E2E8F0',  // slate-200
    borderSubtle: '#F1F5F9',  // slate-100
    borderStrong: '#CBD5E1',  // slate-300

    textPrimary:   '#1E293B', // slate-800
    textSecondary: '#64748B', // slate-500
    textMuted:     '#94A3B8', // slate-400

    brand:       '#059669',   // emerald-600
    brandHover:  '#047857',   // emerald-700
    brandSubtle: '#ECFDF5',   // emerald-50
    brandText:   '#065F46',   // emerald-800
  },

  dark: {
    bgPage:      '#080D1A',
    bgSurface:   '#0F172A',   // slate-900
    bgSurface2:  '#1E293B',   // slate-800
    bgSurface3:  '#334155',   // slate-700

    border:       '#334155',  // slate-700
    borderSubtle: '#1E293B',  // slate-800
    borderStrong: '#475569',  // slate-600

    textPrimary:   '#E2E8F0', // slate-200
    textSecondary: '#94A3B8', // slate-400
    textMuted:     '#64748B', // slate-500

    brand:       '#10B981',   // emerald-500 (brighter on dark bg)
    brandHover:  '#059669',   // emerald-600
    brandSubtle: '#052e16',   // emerald-950
    brandText:   '#34D399',   // emerald-400
  },
}

/** CSS variable names — use as var(--bg-surface) etc. */
export const cssVars = {
  bgPage:        'var(--bg-page)',
  bgSurface:     'var(--bg-surface)',
  bgSurface2:    'var(--bg-surface-2)',
  bgSurface3:    'var(--bg-surface-3)',
  border:        'var(--border)',
  borderSubtle:  'var(--border-subtle)',
  borderStrong:  'var(--border-strong)',
  textPrimary:   'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted:     'var(--text-muted)',
  brand:         'var(--brand)',
  brandHover:    'var(--brand-hover)',
  brandSubtle:   'var(--brand-subtle)',
  brandText:     'var(--brand-text)',
}
