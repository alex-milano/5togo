// ─── Light Mode CSS variable overrides per theme ──────────────────────────────
// Applied via: [data-light="true"] or [data-theme="X"][data-light="true"]

export const LIGHT_THEMES = {
  normal: {
    '--bg':         '#f4f6fb',
    '--bg2':        '#eef1f8',
    '--bg3':        '#e8ecf4',
    '--card':       '#ffffff',
    '--card-h':     '#f0f4ff',
    '--border':     'rgba(15,23,42,0.08)',
    '--border2':    'rgba(15,23,42,0.14)',
    '--text':       '#0f172a',
    '--text2':      '#475569',
    '--text3':      '#94a3b8',
    '--shadow':     '0 4px 24px rgba(0,0,0,0.08)',
    '--navbar-bg':  'rgba(244,246,251,0.92)',
  },

  aesthetic: {
    '--bg':         '#fdf4ff',
    '--bg2':        '#f9eeff',
    '--bg3':        '#f3e8ff',
    '--card':       '#ffffff',
    '--card-h':     '#fce7ff',
    '--border':     'rgba(168,85,247,0.1)',
    '--border2':    'rgba(168,85,247,0.18)',
    '--text':       '#3b0764',
    '--text2':      '#7c3aed',
    '--text3':      '#a78bfa',
    '--shadow':     '0 4px 24px rgba(168,85,247,0.1)',
    '--navbar-bg':  'rgba(253,244,255,0.92)',
  },

  football: {
    '--bg':         '#f0fdf4',
    '--bg2':        '#e8f9ed',
    '--bg3':        '#dcf5e5',
    '--card':       '#ffffff',
    '--card-h':     '#d1fae5',
    '--border':     'rgba(16,185,129,0.1)',
    '--border2':    'rgba(16,185,129,0.18)',
    '--text':       '#064e3b',
    '--text2':      '#065f46',
    '--text3':      '#6ee7b7',
    '--shadow':     '0 4px 24px rgba(16,185,129,0.1)',
    '--navbar-bg':  'rgba(240,253,244,0.92)',
  },

  soccer: {
    '--bg':         '#f0fdf4',
    '--bg2':        '#e6fbf0',
    '--bg3':        '#d1f5e0',
    '--card':       '#ffffff',
    '--card-h':     '#bbf7d0',
    '--border':     'rgba(34,197,94,0.1)',
    '--border2':    'rgba(34,197,94,0.18)',
    '--text':       '#14532d',
    '--text2':      '#166534',
    '--text3':      '#86efac',
    '--shadow':     '0 4px 24px rgba(34,197,94,0.1)',
    '--navbar-bg':  'rgba(240,253,244,0.92)',
  },

  basketball: {
    '--bg':         '#fff7ed',
    '--bg2':        '#ffedd5',
    '--bg3':        '#fed7aa',
    '--card':       '#ffffff',
    '--card-h':     '#ffedd5',
    '--border':     'rgba(249,115,22,0.1)',
    '--border2':    'rgba(249,115,22,0.18)',
    '--text':       '#431407',
    '--text2':      '#7c2d12',
    '--text3':      '#fdba74',
    '--shadow':     '0 4px 24px rgba(249,115,22,0.1)',
    '--navbar-bg':  'rgba(255,247,237,0.92)',
  },

  baseball: {
    '--bg':         '#fefce8',
    '--bg2':        '#fef9c3',
    '--bg3':        '#fef08a',
    '--card':       '#ffffff',
    '--card-h':     '#fef9c3',
    '--border':     'rgba(202,138,4,0.1)',
    '--border2':    'rgba(202,138,4,0.18)',
    '--text':       '#422006',
    '--text2':      '#713f12',
    '--text3':      '#fbbf24',
    '--shadow':     '0 4px 24px rgba(202,138,4,0.1)',
    '--navbar-bg':  'rgba(254,252,232,0.92)',
  },
}

export function getLightVars(themeName) {
  return LIGHT_THEMES[themeName] || LIGHT_THEMES.normal
}
