// ── budgetTheme.ts ────────────────────────────────────────────────────────────
// Maroon professional theme (Layout C). One accent; status colours only for status.

export const T = {
    ground:      '#F4F2F1',
    surface:     '#FFFFFF',
    footer:      '#FAF8F7',
    border:      '#E5DFDC',
    borderSoft:  '#EDE8E6',
    subtle:      '#F1ECEA',
    toggleTrack: '#E9E3E0',
    inputBorder: '#D9D1CE',
    track:       '#EDE8E6',
    text:        '#1F1A1A',
    ink2:        '#3F3534',
    muted:       '#5F5654',
    mutedSoft:   '#8F8481',
    accent:      '#6B1A1A',
    accentDark:  '#4A1010',
    accentSoft:  '#F3E6E6',
    success:     '#2E8B57',
    successText: '#1D6640',
    successBg:   '#E3F1E8',
    warn:        '#C27C3A',
    warnText:    '#7A4205',
    warnBg:      '#FBEBD3',
    danger:      '#B42318',
    dangerText:  '#9F1F15',
    dangerBg:    '#FBE4E1',
} as const;

// Load both in index.html:
// <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Public+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
export const FONT_SANS = "'Public Sans', 'Segoe UI', system-ui, sans-serif";
export const FONT_MONO = "'IBM Plex Mono', ui-monospace, monospace";

// Category colours differ in lightness as well as hue, so neighbouring donut slices stay distinguishable.
const CATEGORY_PALETTE = ['#6B1A1A', '#C27C3A', '#8F8481', '#A85D5D', '#2F6B5E', '#3F3534', '#5E7F95', '#D9C2BE', '#7A5C3E', '#9C8F8B'];

/** Stable colour per category name, so a category keeps its colour across every week. */
export function colorForCategory(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
}

export const money = (n: number, decimals = 0): string => {
    const abs = Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return `${n < 0 ? '−' : ''}$${abs}`;
};

export const cardSx = {
    bgcolor: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: '12px',
} as const;

export const eyebrowSx = {
    fontSize: '0.6875rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: T.muted,
} as const;