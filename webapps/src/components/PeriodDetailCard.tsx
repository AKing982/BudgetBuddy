// ── PeriodDetailCard.tsx ──────────────────────────────────────────────────────
// Layout (top → bottom):
//   1. Maroon header — date range, income, edit toggle
//   2. SpendDonutChart — donut + legend with planned inputs + util bar + KPI row
//   3. SectionBand + rows (Fixed then Variable) — left-border cards, avg context
//   4. Footer — income · committed · period balance
//
// "planned" amounts live exclusively in the donut legend (optional per category).
// The old separate KPI strip and the old per-row "Target" input are gone —
// everything is unified in the donut section.
import React, { useMemo, useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Lock, Edit, Save, CheckCircleOutline } from '@mui/icons-material';

import { MAROON, NAVY, SLATE, GREEN, RED, fmt, fmtS } from '../domain/SpreadsheetTypes';
import type { SpreadsheetTemplate } from '../domain/SpreadsheetTypes';

// ── Tokens ────────────────────────────────────────────────────────────────────
const MAROON_DARK = '#4a1010';
const AMBER       = '#d97706';
const BLUE        = '#1d6fb8';

const CAT_COLORS: Record<string, string> = {
    Rent: '#1D9E75', Groceries: '#6b1a1a', Gas: '#BA7517',
    Payments: '#7c3aed', Other: '#888780', Insurance: '#0ea5e9',
    Utilities: '#f59e0b', Electric: '#6366f1', 'Gas Bill': '#ef4444',
    Subscriptions: '#8b5cf6', Haircut: '#14b8a6', Savings: '#059669',
    'Order out': '#D4537E', 'Dining out': '#D4537E', 'Other Stuff': '#888780',
    'Coffee Supplies': '#ba7517', 'Phone Insurance': '#0ea5e9',
    'Trip Cost': '#d97706', Golf: '#639922',
};
const PALETTE = [
    '#1D9E75','#6b1a1a','#BA7517','#7c3aed','#0ea5e9','#f59e0b',
    '#6366f1','#ef4444','#8b5cf6','#14b8a6','#059669','#D4537E',
    '#ba7517','#639922','#378ADD',
];
const DEFAULT_FIXED = new Set(['Rent', 'Payments', 'Insurance', 'Subscriptions']);

// ── Types ─────────────────────────────────────────────────────────────────────
type CategoryTypeMap = Record<string, 'fixed' | 'variable'>;
type PlannedMap      = Record<string, number | null>;
type CenterMode      = 'util' | 'spend' | 'remain';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtC = (n: number | null | undefined): string => {
    if (n === null || n === undefined) return '—';
    return (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString();
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function isPeriodFuture(t: SpreadsheetTemplate, pi: number): boolean {
    const pd = (t as any).periodDates?.[pi];
    return pd ? (pd.start as Date) > new Date() : false;
}
function isPeriodPresent(t: SpreadsheetTemplate, pi: number): boolean {
    const pd = (t as any).periodDates?.[pi];
    if (!pd) return false;
    const now = new Date();
    return (pd.start as Date) <= now && (pd.end as Date) >= now;
}
function getPeriodType(t: SpreadsheetTemplate, pi: number): 'past' | 'present' | 'future-manual' | 'future-auto' {
    if (isPeriodPresent(t, pi)) return 'present';
    if (isPeriodFuture(t, pi))  return 'future-manual';
    return 'past';
}
function fmtDate(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── TypePill ──────────────────────────────────────────────────────────────────
const TypePill: React.FC<{ isFixed: boolean; onChange: (fixed: boolean) => void }> = ({ isFixed, onChange }) => (
    <Box sx={{ display: 'flex', border: `1px solid ${alpha('#000', 0.13)}`, borderRadius: '5px', overflow: 'hidden', flexShrink: 0 }}>
        {[
            { label: 'Fixed',    value: true,  color: MAROON },
            { label: 'Variable', value: false, color: BLUE   },
        ].map(opt => (
            <Box key={opt.label} onClick={() => onChange(opt.value)} sx={{
                px: 1, py: 0.375, fontSize: '0.7rem', fontWeight: 700,
                cursor: 'pointer', userSelect: 'none',
                bgcolor: isFixed === opt.value ? opt.color : '#fff',
                color:   isFixed === opt.value ? '#fff' : SLATE,
                borderRight: opt.value ? `1px solid ${alpha('#000', 0.1)}` : 'none',
                transition: 'all .12s',
                '&:hover': isFixed !== opt.value ? { bgcolor: alpha(opt.color, 0.08), color: opt.color } : {},
            }}>{opt.label}</Box>
        ))}
    </Box>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ── SpendDonutChart ────────────────────────────────────────────────────────────
// Single source of truth for planned inputs + donut + utilization + KPIs.
// ═══════════════════════════════════════════════════════════════════════════════
interface DonutSlice {
    label:   string;
    value:   number;        // actual spend
    planned: number | null; // optional planned amount
    color:   string;
}

const SpendDonutChart: React.FC<{
    slices:         DonutSlice[];
    income:         number | null;
    totalSpend:     number;
    highlightLabel: string | null;
    onHover:        (label: string | null) => void;
    onSetPlanned:   (label: string, val: number | null) => void;
}> = ({ slices, income, totalSpend, highlightLabel, onHover, onSetPlanned }) => {
    const [localHover, setLocalHover] = useState<number | null>(null);
    const [centerMode, setCenterMode] = useState<CenterMode>('util');

    const SIZE  = 160;
    const THICK = 28;
    const R     = (SIZE / 2) - THICK / 2 - 2;
    const cx    = SIZE / 2;
    const cy    = SIZE / 2;
    const C     = 2 * Math.PI * R;
    const actualTotal = slices.reduce((s, x) => s + x.value, 0) || 1;

    // Stroke segments (actual spend)
    let cumPct = 0;
    const segments = slices.map((s, i) => {
        const pct    = s.value / actualTotal;
        const dash   = pct * C;
        const gap    = C - dash;
        const offset = C - cumPct * C;
        cumPct += pct;
        return { ...s, pct, dash, gap, offset, i };
    });

    const hoveredIdx: number | null = useMemo(() => {
        if (highlightLabel !== null) return slices.findIndex(s => s.label === highlightLabel);
        return localHover;
    }, [highlightLabel, localHover, slices]);

    const hov = hoveredIdx !== null && hoveredIdx >= 0 ? slices[hoveredIdx] : null;

    // Aggregate planned totals
    const totalPlanned = useMemo(() => slices.reduce((s, c) => s + (c.planned ?? 0), 0), [slices]);
    const hasPlan      = totalPlanned > 0;
    const utilPct      = hasPlan ? Math.round((totalSpend / totalPlanned) * 100) : null;
    const planDelta    = hasPlan ? totalSpend - totalPlanned : null;

    // Center text — changes based on mode and hover
    const center = useMemo(() => {
        if (hov) {
            if (centerMode === 'util') {
                return hov.planned
                    ? { top: `${Math.round((hov.value / hov.planned) * 100)}%`, mid: hov.label, bot: 'of plan' }
                    : { top: fmtC(hov.value), mid: hov.label, bot: 'actual' };
            }
            if (centerMode === 'spend')
                return { top: fmtC(hov.value), mid: hov.label, bot: hov.planned ? `of ${fmtC(hov.planned)}` : '' };
            const rem = hov.planned !== null ? hov.planned - hov.value : null;
            return { top: rem !== null ? fmtC(rem) : '—', mid: hov.label, bot: rem !== null ? (rem >= 0 ? 'remaining' : 'over') : 'no plan' };
        }
        if (centerMode === 'util') {
            if (!hasPlan) return { top: '—', mid: 'add plans below', bot: 'to track usage' };
            return { top: `${utilPct}%`, mid: 'of total plan', bot: `${fmtC(totalSpend)} spent` };
        }
        if (centerMode === 'spend')
            return { top: fmtC(totalSpend), mid: 'total spent', bot: hasPlan ? `of ${fmtC(totalPlanned)}` : '' };
        const rem = hasPlan ? totalPlanned - totalSpend : null;
        return { top: rem !== null ? fmtC(rem) : '—', mid: rem !== null && rem < 0 ? 'over plan' : 'remaining', bot: '' };
    }, [hov, centerMode, hasPlan, utilPct, totalSpend, totalPlanned]);

    const centerColor = hov ? hov.color : NAVY;

    return (
        <Box sx={{ px: 2, py: 1.75, borderBottom: `0.5px solid ${alpha('#000', 0.07)}`, bgcolor: '#fdfcfc' }}>

            {/* ── Mode toggle ── */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
                <Box sx={{ display: 'flex', border: `1px solid ${alpha('#000', 0.12)}`, borderRadius: '6px', overflow: 'hidden' }}>
                    {([
                        { key: 'util'   as CenterMode, label: '% used'  },
                        { key: 'spend'  as CenterMode, label: '$ spend' },
                        { key: 'remain' as CenterMode, label: '$ left'  },
                    ]).map((m, i, arr) => (
                        <Box key={m.key} onClick={() => setCenterMode(m.key)} sx={{
                            px: 1.25, py: 0.4,
                            fontSize: '0.72rem', fontWeight: 700,
                            cursor: 'pointer', userSelect: 'none',
                            bgcolor: centerMode === m.key ? MAROON : '#fff',
                            color:   centerMode === m.key ? '#fff' : SLATE,
                            borderRight: i < arr.length - 1 ? `1px solid ${alpha('#000', 0.1)}` : 'none',
                            transition: 'all .12s',
                            '&:hover': centerMode !== m.key ? { bgcolor: alpha(MAROON, 0.06), color: MAROON } : {},
                        }}>{m.label}</Box>
                    ))}
                </Box>
            </Box>

            {/* ── Donut + legend ── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: `${SIZE + 12}px 1fr`, gap: 2, alignItems: 'flex-start' }}>

                {/* Donut + util bar */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.25 }}>
                    <Box sx={{ position: 'relative', width: SIZE, height: SIZE }}>
                        <svg
                            width={SIZE} height={SIZE}
                            viewBox={`0 0 ${SIZE} ${SIZE}`}
                            style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
                        >
                            {/* Track ring */}
                            <circle cx={cx} cy={cy} r={R} fill="none"
                                    stroke={alpha('#000', 0.06)} strokeWidth={THICK} />

                            {/* Ghost planned arcs — wider, dimmer, behind actual */}
                            {(() => {
                                const planTotal = slices.reduce((s, c) => s + (c.planned ?? 0), 0) || 1;
                                let planCum = 0;
                                return slices.map((s, i) => {
                                    if (!s.planned) return null;
                                    const pPct  = s.planned / planTotal;
                                    const pDash = pPct * C;
                                    const pOff  = C - planCum * C;
                                    planCum += pPct;
                                    return (
                                        <circle key={`ghost-${i}`}
                                                cx={cx} cy={cy} r={R}
                                                fill="none"
                                                stroke={alpha(s.color, 0.18)}
                                                strokeWidth={THICK + 10}
                                                strokeDasharray={`${pDash} ${C - pDash}`}
                                                strokeDashoffset={pOff}
                                                strokeLinecap="butt"
                                                style={{ pointerEvents: 'none' }}
                                        />
                                    );
                                });
                            })()}

                            {/* Actual spend arcs */}
                            {segments.map((seg, i) => {
                                const isHov    = hoveredIdx === i;
                                const isDimmed = hoveredIdx !== null && hoveredIdx >= 0 && !isHov;
                                return (
                                    <circle key={i}
                                            cx={cx} cy={cy} r={R}
                                            fill="none"
                                            stroke={seg.color}
                                            strokeWidth={isHov ? THICK + 7 : THICK}
                                            strokeDasharray={`${seg.dash} ${seg.gap}`}
                                            strokeDashoffset={seg.offset}
                                            strokeLinecap="butt"
                                            style={{
                                                transition: 'stroke-width .15s ease, opacity .15s ease',
                                                cursor: 'pointer',
                                                opacity: isDimmed ? 0.28 : 1,
                                            }}
                                            onMouseEnter={() => { setLocalHover(i); onHover(seg.label); }}
                                            onMouseLeave={() => { setLocalHover(null); onHover(null); }}
                                    />
                                );
                            })}
                        </svg>

                        {/* Center text */}
                        <Box sx={{
                            position: 'absolute', inset: 0,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            pointerEvents: 'none', px: 1,
                        }}>
                            <Typography sx={{
                                fontSize: '1.1rem', fontWeight: 700, color: centerColor,
                                fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
                                transition: 'color .15s', textAlign: 'center',
                            }}>
                                {center.top}
                            </Typography>
                            <Typography sx={{ fontSize: '0.63rem', color: SLATE, mt: 0.3, textAlign: 'center', maxWidth: 72, lineHeight: 1.3 }}>
                                {center.mid}
                            </Typography>
                            {center.bot && (
                                <Typography sx={{ fontSize: '0.6rem', color: alpha(SLATE, 0.6), mt: 0.1, textAlign: 'center' }}>
                                    {center.bot}
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    {/* Utilization bar */}
                    <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                            <Typography sx={{ fontSize: '0.7rem', color: SLATE }}>budget used</Typography>
                            <Typography sx={{
                                fontSize: '0.7rem', fontWeight: 700,
                                color: utilPct === null ? SLATE : utilPct > 100 ? RED : utilPct > 85 ? AMBER : GREEN,
                            }}>
                                {utilPct !== null ? `${utilPct}%` : '—'}
                            </Typography>
                        </Box>
                        <Box sx={{ height: 6, bgcolor: alpha('#000', 0.07), borderRadius: '3px', overflow: 'hidden' }}>
                            <Box sx={{
                                height: '100%',
                                width: utilPct !== null ? `${Math.min(utilPct, 100)}%` : '0%',
                                bgcolor: utilPct === null ? alpha(SLATE, 0.2) : utilPct > 100 ? RED : utilPct > 85 ? AMBER : GREEN,
                                borderRadius: '3px',
                                transition: 'width .35s ease, background-color .2s',
                            }} />
                        </Box>
                        {planDelta !== null && (
                            <Typography sx={{
                                fontSize: '0.68rem', fontWeight: 600, mt: 0.4,
                                color: planDelta > 0 ? RED : '#059669',
                            }}>
                                {planDelta > 0 ? `+${fmtC(planDelta)} over plan` : `${fmtC(planDelta)} under plan`}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Legend rows — planned input + actual + pill */}
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    {slices.map((s, i) => {
                        const isHov    = hoveredIdx === i;
                        const isDimmed = hoveredIdx !== null && hoveredIdx >= 0 && !isHov;
                        const over     = s.planned !== null && s.value > s.planned;
                        const under    = s.planned !== null && s.value < s.planned;
                        const actColor = over ? RED : under ? '#059669' : NAVY;

                        const pillText = !s.planned         ? null
                            : s.value === s.planned         ? 'on plan'
                                : over                          ? `+${fmtC(s.value - s.planned)}`
                                    :                                  `${fmtC(s.value - s.planned)}`;
                        const pillBg  = over ? alpha(RED, 0.1) : alpha(GREEN, 0.1);
                        const pillCol = over ? RED : '#059669';

                        return (
                            <Box
                                key={s.label}
                                onMouseEnter={() => { setLocalHover(i); onHover(s.label); }}
                                onMouseLeave={() => { setLocalHover(null); onHover(null); }}
                                sx={{
                                    display: 'flex', alignItems: 'center',
                                    borderBottom: `0.5px solid ${alpha('#000', 0.05)}`,
                                    borderRadius: '5px',
                                    bgcolor: isHov ? alpha(s.color, 0.06) : 'transparent',
                                    opacity: isDimmed ? 0.4 : 1,
                                    transition: 'background .1s, opacity .15s',
                                    cursor: 'default',
                                    '&:last-child': { borderBottom: 'none' },
                                }}
                            >
                                {/* Dot */}
                                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: s.color, flexShrink: 0, mx: 1 }} />

                                {/* Name */}
                                <Typography sx={{
                                    fontSize: '0.82rem', py: '9px', flex: 1,
                                    minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    color: isHov ? s.color : NAVY,
                                    fontWeight: isHov ? 700 : 400,
                                    transition: 'color .1s',
                                }}>
                                    {s.label}
                                </Typography>

                                {/* Planned input */}
                                <Box sx={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                                    px: 0.75, py: '5px', minWidth: 80,
                                    borderLeft: `0.5px solid ${alpha('#000', 0.06)}`,
                                }}>
                                    <Typography sx={{ fontSize: '0.6rem', color: SLATE, textTransform: 'uppercase', letterSpacing: '0.05em', mb: '3px' }}>
                                        planned
                                    </Typography>
                                    <Box
                                        component="input"
                                        type="number"
                                        value={s.planned ?? ''}
                                        placeholder="add..."
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            const v = parseFloat(e.target.value);
                                            onSetPlanned(s.label, isNaN(v) || v <= 0 ? null : v);
                                        }}
                                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                        sx={{
                                            width: 70, textAlign: 'right',
                                            fontSize: '0.8rem', fontWeight: 600,
                                            color: s.planned ? NAVY : alpha(SLATE, 0.45),
                                            border: `0.5px solid ${
                                                over  ? alpha(RED, 0.4) :
                                                    under ? alpha(GREEN, 0.35) :
                                                        alpha('#000', 0.13)
                                            }`,
                                            borderRadius: '5px', px: 0.75, py: '3px',
                                            bgcolor: over ? alpha(RED, 0.04) : under ? alpha(GREEN, 0.03) : alpha('#000', 0.02),
                                            fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums',
                                            '&:focus': { outline: `1.5px solid ${MAROON}`, borderColor: 'transparent' },
                                            '&::placeholder': { color: alpha(SLATE, 0.35), fontStyle: 'italic', fontSize: '0.68rem' },
                                            '&::-webkit-inner-spin-button,&::-webkit-outer-spin-button': { opacity: 0 },
                                        }}
                                    />
                                </Box>

                                {/* Actual */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', px: 0.75, py: '5px', minWidth: 68 }}>
                                    <Typography sx={{ fontSize: '0.6rem', color: SLATE, textTransform: 'uppercase', letterSpacing: '0.05em', mb: '3px' }}>
                                        actual
                                    </Typography>
                                    <Typography sx={{
                                        fontSize: '0.9rem', fontWeight: 700,
                                        color: actColor, fontVariantNumeric: 'tabular-nums',
                                        transition: 'color .1s',
                                    }}>
                                        {fmtC(s.value)}
                                    </Typography>
                                </Box>

                                {/* Over/under pill */}
                                <Box sx={{ width: 76, pr: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}>
                                    {pillText ? (
                                        <Box sx={{
                                            fontSize: '0.68rem', fontWeight: 700,
                                            px: 0.75, py: '2px', borderRadius: '10px',
                                            bgcolor: pillBg, color: pillCol,
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {pillText}
                                        </Box>
                                    ) : (
                                        <Typography sx={{ fontSize: '0.68rem', color: alpha(SLATE, 0.35), fontStyle: 'italic' }}>
                                            no plan
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            {/* ── KPI row — total planned / actual / delta ── */}
            <Box sx={{
                display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                mt: 1.75, pt: 1.25,
                borderTop: `0.5px solid ${alpha('#000', 0.07)}`,
            }}>
                {[
                    { label: 'Total planned', val: hasPlan ? fmtC(totalPlanned) : '—', color: NAVY  },
                    { label: 'Total actual',  val: fmtC(totalSpend),                   color: NAVY  },
                    {
                        label: 'Over / under',
                        val:   planDelta !== null ? (planDelta > 0 ? '+' : '') + fmtC(planDelta) : '—',
                        color: planDelta === null ? SLATE : planDelta > 0 ? RED : '#059669',
                    },
                ].map((k, i) => (
                    <Box key={i} sx={{
                        px: 0.5,
                        borderRight: i < 2 ? `0.5px solid ${alpha('#000', 0.07)}` : 'none',
                        pl: i === 0 ? 0 : 0.75,
                    }}>
                        <Typography sx={{ fontSize: '0.65rem', color: SLATE, mb: 0.25 }}>{k.label}</Typography>
                        <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: k.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                            {k.val}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ── SectionBand ────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const SectionBand: React.FC<{
    label: string; total: number; maxTotal: number;
    badge: { text: string; bg: string; color: string };
    extra?: React.ReactNode; accentColor: string;
}> = ({ label, total, maxTotal, badge, extra, accentColor }) => {
    const pct = maxTotal > 0 ? clamp(Math.round((total / maxTotal) * 100), 0, 100) : 0;
    return (
        <Box sx={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${alpha('#000', 0.07)}` }}>
            <Box sx={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`,
                bgcolor: alpha(accentColor, 0.07),
                borderRight: pct > 0 && pct < 100 ? `1.5px solid ${alpha(accentColor, 0.18)}` : 'none',
                transition: 'width .4s ease', pointerEvents: 'none',
            }} />
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, bgcolor: '#f7f6f5' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 3, height: 16, borderRadius: 0, bgcolor: accentColor, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#3a3a3a', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                        {label}
                    </Typography>
                    <Box sx={{ fontSize: '0.65rem', fontWeight: 700, px: 0.875, py: '2px', borderRadius: '4px', bgcolor: badge.bg, color: badge.color }}>
                        {badge.text}
                    </Box>
                    {extra}
                </Box>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: accentColor, fontVariantNumeric: 'tabular-nums' }}>
                    {fmtC(total)}
                </Typography>
            </Box>
        </Box>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ── FixedRow ───────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const FixedRow: React.FC<{
    label: string; actual: number | null; catColor: string;
    editMode: boolean; isFixed: boolean; isHovered: boolean;
    onMouseEnter: () => void; onMouseLeave: () => void;
    onToggle: (fixed: boolean) => void; sectionMax: number;
}> = ({ label, actual, catColor, editMode, isFixed, isHovered, onMouseEnter, onMouseLeave, onToggle, sectionMax }) => {
    const pct = actual !== null && sectionMax > 0 ? clamp(Math.round((actual / sectionMax) * 100), 0, 100) : 0;
    return (
        <Box onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} sx={{
            position: 'relative', overflow: 'hidden',
            borderBottom: `0.5px solid ${alpha('#000', 0.05)}`,
            borderLeft: `3px solid ${isHovered ? catColor : alpha(catColor, 0.45)}`,
            transition: 'border-color .15s, background .12s',
            bgcolor: isHovered ? alpha(catColor, 0.04) : 'white',
            '&:hover': { bgcolor: alpha(catColor, 0.05) },
        }}>
            {pct > 0 && (
                <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, bgcolor: alpha(catColor, 0.06), pointerEvents: 'none', transition: 'width .3s ease' }} />
            )}
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1 }}>
                <Box sx={{
                    width: 10, height: 10, borderRadius: '50%', bgcolor: catColor, flexShrink: 0,
                    boxShadow: isHovered ? `0 0 0 3px ${alpha(catColor, 0.22)}` : 'none',
                    transition: 'box-shadow .15s',
                }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.86rem', fontWeight: 600, color: isHovered ? catColor : NAVY, transition: 'color .12s' }}>
                        {label}
                    </Typography>
                    {!editMode && (
                        <Typography sx={{ fontSize: '0.7rem', color: alpha(SLATE, 0.7), mt: 0.1 }}>
                            Fixed · recurring
                        </Typography>
                    )}
                </Box>
                {editMode ? (
                    <TypePill isFixed={isFixed} onChange={onToggle} />
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625, px: 0.875, py: 0.3, borderRadius: '5px', bgcolor: alpha('#000', 0.04), border: `0.5px solid ${alpha('#000', 0.1)}` }}>
                        <Lock sx={{ fontSize: '0.72rem', color: alpha(SLATE, 0.5) }} />
                        <Typography sx={{ fontSize: '0.68rem', color: alpha(SLATE, 0.6), fontWeight: 600 }}>locked</Typography>
                    </Box>
                )}
                <Box sx={{ minWidth: 76, textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: isHovered ? catColor : NAVY, fontVariantNumeric: 'tabular-nums', transition: 'color .12s' }}>
                        {actual !== null ? `$${fmt(actual)}` : '—'}
                    </Typography>
                    {pct > 0 && (
                        <Typography sx={{ fontSize: '0.65rem', color: alpha(SLATE, 0.55) }}>
                            {pct}% of fixed
                        </Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ── VariableRow — no target input (planning is in the donut legend) ────────────
// ═══════════════════════════════════════════════════════════════════════════════
const VariableRow: React.FC<{
    label: string; actual: number | null; avg: number | null;
    catColor: string; editMode: boolean; isFixed: boolean; isHovered: boolean;
    onMouseEnter: () => void; onMouseLeave: () => void;
    onToggle: (fixed: boolean) => void; sectionMax: number;
}> = ({ label, actual, avg, catColor, editMode, isFixed, isHovered, onMouseEnter, onMouseLeave, onToggle, sectionMax }) => {
    const hasActual = actual !== null;
    const bgFillPct = sectionMax > 0 && hasActual ? clamp(Math.round(((actual ?? 0) / sectionMax) * 100), 0, 100) : 0;

    // vs-avg signal
    const signal = !hasActual || avg === null ? null
        : (actual ?? 0) > avg * 1.15 ? { text: `▲ $${Math.round((actual ?? 0) - avg)} above avg`, color: AMBER }
            : (actual ?? 0) < avg * 0.85 ? { text: `▼ $${Math.round(avg - (actual ?? 0))} below avg`, color: '#059669' }
                : { text: 'near avg', color: SLATE };

    const barPct   = avg !== null && avg > 0 && hasActual ? clamp(Math.round(((actual ?? 0) / avg) * 100), 0, 130) : 0;
    const barColor = avg !== null && (actual ?? 0) > avg * 1.15 ? AMBER : catColor;

    return (
        <Box onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} sx={{
            position: 'relative', overflow: 'hidden',
            borderBottom: `0.5px solid ${alpha('#000', 0.05)}`,
            borderLeft: `3px solid ${isHovered ? catColor : alpha(catColor, 0.35)}`,
            transition: 'border-color .15s, background .12s',
            bgcolor: isHovered ? alpha(catColor, 0.03) : 'white',
            '&:hover': { bgcolor: alpha(catColor, 0.04) },
        }}>
            {bgFillPct > 0 && (
                <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${bgFillPct}%`, bgcolor: alpha(catColor, 0.055), pointerEvents: 'none', transition: 'width .3s ease' }} />
            )}
            <Box sx={{ position: 'relative', px: 2, pt: 1, pb: editMode ? 1 : 0.875 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: editMode || !hasActual ? 0 : 0.75 }}>
                    <Box sx={{
                        width: 10, height: 10, borderRadius: '50%', bgcolor: catColor, flexShrink: 0,
                        boxShadow: isHovered ? `0 0 0 3px ${alpha(catColor, 0.22)}` : 'none',
                        transition: 'box-shadow .15s',
                    }} />
                    <Typography sx={{ fontSize: '0.86rem', fontWeight: 500, color: isHovered ? catColor : NAVY, flex: 1, transition: 'color .12s' }}>
                        {label}
                    </Typography>
                    {editMode ? (
                        <TypePill isFixed={isFixed} onChange={onToggle} />
                    ) : (
                        <>
                            {signal && (
                                <Box sx={{ fontSize: '0.68rem', fontWeight: 700, px: 0.875, py: '3px', borderRadius: '12px', bgcolor: alpha(signal.color, 0.1), color: signal.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    {signal.text}
                                </Box>
                            )}
                            <Box sx={{ minWidth: 76, textAlign: 'right', flexShrink: 0 }}>
                                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: isHovered ? catColor : NAVY, fontVariantNumeric: 'tabular-nums', transition: 'color .12s', lineHeight: 1.1 }}>
                                    {hasActual ? `$${fmt(actual)}` : '—'}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>

                {/* Avg bar — only shown when not in edit mode and data exists */}
                {!editMode && hasActual && avg !== null && (
                    <Box sx={{ ml: '22px', mb: 0.75 }}>
                        <Box sx={{ position: 'relative', height: 5, bgcolor: alpha('#000', 0.07), borderRadius: '3px', overflow: 'hidden', mb: 0.375 }}>
                            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(barPct, 100)}%`, bgcolor: barColor, borderRadius: '3px', transition: 'width .3s ease' }} />
                            {barPct > 100 && (
                                <Box sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${Math.min(barPct - 100, 30)}%`, bgcolor: alpha(AMBER, 0.5), borderRadius: '0 3px 3px 0' }} />
                            )}
                        </Box>
                        <Typography sx={{ fontSize: '0.65rem', color: alpha(SLATE, 0.6) }}>
                            avg ${fmtS(avg)}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ── PeriodDetailCard ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
interface PeriodDetailCardProps {
    template:       SpreadsheetTemplate;
    periodIndex:    number;
    mode:           'manual' | 'auto';
    categoryTypes?: CategoryTypeMap;
    onSaveTypes?:   (types: CategoryTypeMap) => void;
}

const PeriodDetailCard: React.FC<PeriodDetailCardProps> = ({
                                                               template, periodIndex, mode, categoryTypes: externalTypes, onSaveTypes,
                                                           }) => {
    const period = template.periods[periodIndex] ?? '';
    const type   = getPeriodType(template, periodIndex);

    const [editMode,     setEditMode]     = useState(false);
    const [savedFlash,   setSavedFlash]   = useState(false);
    const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
    const [draftTypes,   setDraftTypes]   = useState<CategoryTypeMap>(() => externalTypes ?? {});
    const [planned,      setPlanned]      = useState<PlannedMap>({});

    const handleSetPlanned = useCallback((label: string, val: number | null) => {
        setPlanned(prev => ({ ...prev, [label]: val }));
    }, []);

    const getEffectiveType = useCallback((label: string): 'fixed' | 'variable' => {
        if (draftTypes[label]) return draftTypes[label];
        return DEFAULT_FIXED.has(label) ? 'fixed' : 'variable';
    }, [draftTypes]);

    const handleToggle = (label: string, isFixed: boolean) =>
        setDraftTypes(prev => ({ ...prev, [label]: isFixed ? 'fixed' : 'variable' }));
    const handleSave = () => {
        onSaveTypes?.(draftTypes);
        setEditMode(false);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
    };
    const handleCancel = () => { setDraftTypes(externalTypes ?? {}); setEditMode(false); };

    const dateRange = useMemo(() => {
        const pd = (template as any).periodDates?.[periodIndex];
        if (pd?.start && pd?.end) return `${fmtDate(pd.start)} – ${fmtDate(pd.end)}`;
        return period;
    }, [template, periodIndex, period]);

    const allExpenseRows = template.rows.filter(r => r.rowType === 'expense' || r.rowType === 'fixed-expense');
    const fixedRows      = allExpenseRows.filter(r => getEffectiveType(r.label) === 'fixed');
    const variableRows   = allExpenseRows.filter(r => getEffectiveType(r.label) === 'variable');

    const salaryRow  = template.rows.find(r => r.rowType === 'salary');
    const income     = salaryRow?.values[periodIndex] ?? null;
    const fixedTotal = fixedRows.reduce((s, r) => s + (r.values[periodIndex] ?? 0), 0);
    const varActual  = variableRows.reduce((s, r) => s + (r.values[periodIndex] ?? 0), 0);
    const totalSpend = fixedTotal + varActual;
    const balance    = income !== null ? income - totalSpend : null;

    const fixedMax = fixedRows.reduce((m, r) => Math.max(m, r.values[periodIndex] ?? 0), 0) * 1.1 || 1;
    const varMax   = variableRows.reduce((m, r) => Math.max(m, r.values[periodIndex] ?? 0), 0) * 1.1 || 1;

    const donutSlices = useMemo<DonutSlice[]>(() =>
            allExpenseRows
                .map((row, ri) => ({
                    label:   row.label,
                    value:   row.values[periodIndex] ?? 0,
                    planned: planned[row.label] ?? null,
                    color:   CAT_COLORS[row.label] ?? PALETTE[ri % PALETTE.length],
                }))
                .filter(s => s.value > 0)
                .sort((a, b) => b.value - a.value),
        [allExpenseRows, periodIndex, planned],
    );

    const TYPE_LABELS: Record<string, string> = { past: 'past period', present: 'current period', 'future-manual': 'planned period', 'future-auto': 'predicted period' };
    const TYPE_TAG_BG: Record<string, string> = { past: '#888780', present: '#8b1a1a', 'future-manual': '#85B7EB', 'future-auto': '#97C459' };
    const TYPE_TAG_FG: Record<string, string> = { past: '#fff', present: '#fff', 'future-manual': '#042C53', 'future-auto': '#173404' };

    return (
        <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.16)}`, mt: 1.75, boxShadow: `0 2px 12px ${alpha(MAROON, 0.07)}` }}>

            {/* ── Header ── */}
            <Box sx={{
                background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 70%, #5a1515 100%)`,
                px: 2, py: 1.375,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <Box>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{dateRange}</Typography>
                    {income !== null && (
                        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,.65)', mt: 0.2 }}>
                            {fmtC(income)} income
                        </Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {savedFlash && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.4, borderRadius: '5px', bgcolor: 'rgba(5,150,105,.25)', border: '1px solid rgba(5,150,105,.5)' }}>
                            <CheckCircleOutline sx={{ fontSize: '0.85rem', color: '#4ade80' }} />
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#4ade80' }}>Saved</Typography>
                        </Box>
                    )}
                    {!editMode ? (
                        <Box onClick={() => setEditMode(true)} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.125, py: 0.4, borderRadius: '5px', cursor: 'pointer', border: '1px solid rgba(255,255,255,.28)', bgcolor: 'rgba(255,255,255,.1)', color: '#fff', fontSize: '0.75rem', fontWeight: 600, transition: 'all .15s', '&:hover': { bgcolor: 'rgba(255,255,255,.2)' }, userSelect: 'none' }}>
                            <Edit sx={{ fontSize: '0.85rem' }} /> Edit categories
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 0.75 }}>
                            <Box onClick={handleCancel} sx={{ px: 1.125, py: 0.4, borderRadius: '5px', cursor: 'pointer', border: '1px solid rgba(255,255,255,.25)', color: 'rgba(255,255,255,.8)', fontSize: '0.75rem', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,.1)' }, userSelect: 'none' }}>
                                Cancel
                            </Box>
                            <Box onClick={handleSave} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.125, py: 0.4, borderRadius: '5px', cursor: 'pointer', bgcolor: 'rgba(255,255,255,.22)', border: '1px solid rgba(255,255,255,.45)', color: '#fff', fontSize: '0.75rem', fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,.32)' }, userSelect: 'none' }}>
                                <Save sx={{ fontSize: '0.85rem' }} /> Save
                            </Box>
                        </Box>
                    )}
                    <Box sx={{ fontSize: '0.68rem', fontWeight: 700, px: 0.875, py: '3px', borderRadius: '4px', bgcolor: TYPE_TAG_BG[type], color: TYPE_TAG_FG[type], whiteSpace: 'nowrap' }}>
                        {TYPE_LABELS[type]}
                    </Box>
                </Box>
            </Box>

            {/* ── Edit mode banner ── */}
            {editMode && (
                <Box sx={{ px: 2, py: 1, bgcolor: alpha(BLUE, 0.06), borderBottom: `1px solid ${alpha(BLUE, 0.18)}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: BLUE, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '0.8rem', color: '#0c3b6b', lineHeight: 1.5 }}>
                        <strong>Category edit mode</strong> — toggle each row between Fixed and Variable.
                    </Typography>
                </Box>
            )}

            {/* ── Donut chart (hidden in edit mode) ── */}
            {!editMode && donutSlices.length > 0 && (
                <SpendDonutChart
                    slices={donutSlices}
                    income={income}
                    totalSpend={totalSpend}
                    highlightLabel={hoveredLabel}
                    onHover={setHoveredLabel}
                    onSetPlanned={handleSetPlanned}
                />
            )}

            {/* ── Footer ── */}
            <Box sx={{ borderTop: `1px solid ${alpha(MAROON, 0.1)}`, bgcolor: '#fdfafa' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1 }}>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: NAVY }}>Income</Typography>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>{fmtC(income)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 0.875, borderTop: `0.5px solid ${alpha('#000', 0.06)}` }}>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: NAVY }}>Total committed</Typography>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>{fmtC(totalSpend)}</Typography>
                </Box>
                <Box sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    px: 2, py: 1.125,
                    borderTop: `1px solid ${alpha(MAROON, 0.14)}`,
                    bgcolor: balance !== null && balance >= 0 ? alpha(GREEN, 0.04) : alpha(RED, 0.04),
                }}>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: NAVY }}>Period balance</Typography>
                    <Typography sx={{
                        fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em',
                        color: balance !== null ? (balance >= 0 ? '#059669' : RED) : SLATE,
                        fontVariantNumeric: 'tabular-nums',
                    }}>
                        {balance !== null ? (balance >= 0 ? '+' : '') + `$${fmt(balance)}` : '—'}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default PeriodDetailCard;

// // ── PeriodDetailCard.tsx ──────────────────────────────────────────────────────
// // Enhanced with:
// //  • Per-category fixed/variable toggle — click the lock icon to switch
// //  • Edit mode button in the header (pencil icon)
// //  • In edit mode: each row shows a Fixed / Variable pill toggle
// //  • Save button persists the category type overrides
// //  • All existing layout/styling preserved exactly
// import React, { useMemo, useState, useCallback } from 'react';
// import { Box, Typography } from '@mui/material';
// import { alpha } from '@mui/material/styles';
// import { Lock, LockOpen, Edit, Save, CheckCircleOutline } from '@mui/icons-material';
//
// import {
//     MAROON, NAVY, SLATE, GREEN, RED, fmt, fmtS,
// } from '../domain/SpreadsheetTypes';
// import type { SpreadsheetTemplate } from '../domain/SpreadsheetTypes';
//
// // ── Local tokens ──────────────────────────────────────────────────────────────
// const MAROON_DARK = '#4a1010';
// const AMBER       = '#d97706';
// const BLUE        = '#1d6fb8';
//
// // ── Category dot colors ───────────────────────────────────────────────────────
// const CAT_COLORS: Record<string, string> = {
//     Rent: '#1D9E75', Groceries: '#6b1a1a', Gas: '#BA7517',
//     Payments: '#7c3aed', Other: '#888780', Insurance: '#0ea5e9',
//     Utilities: '#f59e0b', Electric: '#6366f1', 'Gas Bill': '#ef4444',
//     Subscriptions: '#8b5cf6', Haircut: '#14b8a6', Savings: '#059669',
//     'Order out': '#D4537E', 'Dining out': '#D4537E', 'Other Stuff': '#888780',
//     'Coffee Supplies': '#ba7517', 'Phone Insurance': '#0ea5e9',
//     'Trip Cost': '#d97706', Golf: '#639922',
// };
//
// // ── Default fixed categories ───────────────────────────────────────────────────
// const DEFAULT_FIXED = new Set(['Rent', 'Payments', 'Insurance', 'Subscriptions']);
//
// // ── Types ─────────────────────────────────────────────────────────────────────
// type CategoryTargets  = Record<string, number>;
// type CategoryTypeMap  = Record<string, 'fixed' | 'variable'>; // user overrides
//
// // ── Helpers ───────────────────────────────────────────────────────────────────
// const fmtC = (n: number | null | undefined): string => {
//     if (n === null || n === undefined) return '—';
//     return (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString();
// };
//
// function isPeriodFuture(template: SpreadsheetTemplate, pi: number): boolean {
//     const pd = (template as any).periodDates?.[pi];
//     return pd ? (pd.start as Date) > new Date() : false;
// }
// function isPeriodPresent(template: SpreadsheetTemplate, pi: number): boolean {
//     const pd = (template as any).periodDates?.[pi];
//     if (!pd) return false;
//     const now = new Date();
//     return (pd.start as Date) <= now && (pd.end as Date) >= now;
// }
// function getPeriodType(template: SpreadsheetTemplate, pi: number): 'past' | 'present' | 'future-manual' | 'future-auto' {
//     if (isPeriodPresent(template, pi))  return 'present';
//     if (isPeriodFuture(template, pi))   return 'future-manual';
//     return 'past';
// }
// function fmtDate(d: Date): string {
//     return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
// }
//
// // ── Props ─────────────────────────────────────────────────────────────────────
// interface PeriodDetailCardProps {
//     template:        SpreadsheetTemplate;
//     periodIndex:     number;
//     mode:            'manual' | 'auto';
//     targets:         CategoryTargets;
//     onSetTarget:     (pi: number, label: string, val: number | null) => void;
//     /** Optional: persist category type overrides externally */
//     categoryTypes?:  CategoryTypeMap;
//     onSaveTypes?:    (types: CategoryTypeMap) => void;
// }
//
// // ── Fixed/Variable pill toggle ────────────────────────────────────────────────
// const TypePill: React.FC<{
//     isFixed:  boolean;
//     onChange: (fixed: boolean) => void;
// }> = ({ isFixed, onChange }) => (
//     <Box sx={{
//         display: 'flex',
//         border: `1px solid ${alpha('#000', 0.13)}`,
//         borderRadius: '5px', overflow: 'hidden', flexShrink: 0,
//     }}>
//         {[
//             { label: 'Fixed',    value: true,  activeColor: MAROON },
//             { label: 'Variable', value: false, activeColor: BLUE   },
//         ].map(opt => (
//             <Box
//                 key={opt.label}
//                 onClick={() => onChange(opt.value)}
//                 sx={{
//                     px: 0.875, py: 0.3,
//                     fontSize: '0.63rem', fontWeight: 700,
//                     cursor: 'pointer', userSelect: 'none',
//                     bgcolor: isFixed === opt.value ? opt.activeColor : '#fff',
//                     color:   isFixed === opt.value ? '#fff' : SLATE,
//                     borderRight: opt.value ? `1px solid ${alpha('#000', 0.1)}` : 'none',
//                     transition: 'all .12s',
//                     '&:hover': isFixed !== opt.value ? { bgcolor: alpha(opt.activeColor, 0.07), color: opt.activeColor } : {},
//                 }}
//             >
//                 {opt.label}
//             </Box>
//         ))}
//     </Box>
// );
//
// // ── Component ─────────────────────────────────────────────────────────────────
// const PeriodDetailCard: React.FC<PeriodDetailCardProps> = ({
//                                                                template, periodIndex, mode, targets, onSetTarget,
//                                                                categoryTypes: externalTypes, onSaveTypes,
//                                                            }) => {
//     const period    = template.periods[periodIndex] ?? '';
//     const type      = getPeriodType(template, periodIndex);
//
//     // ── Edit mode state ────────────────────────────────────────────────────────
//     const [editMode,   setEditMode]   = useState(false);
//     const [savedFlash, setSavedFlash] = useState(false);
//
//     // Local draft of category type overrides — starts from external or defaults
//     const [draftTypes, setDraftTypes] = useState<CategoryTypeMap>(() =>
//         externalTypes ?? {}
//     );
//
//     // Resolve effective type for a label
//     const getEffectiveType = useCallback((label: string): 'fixed' | 'variable' => {
//         if (draftTypes[label]) return draftTypes[label];
//         return DEFAULT_FIXED.has(label) ? 'fixed' : 'variable';
//     }, [draftTypes]);
//
//     const handleToggle = (label: string, isFixed: boolean) => {
//         setDraftTypes(prev => ({ ...prev, [label]: isFixed ? 'fixed' : 'variable' }));
//     };
//
//     const handleSave = () => {
//         onSaveTypes?.(draftTypes);
//         setEditMode(false);
//         setSavedFlash(true);
//         setTimeout(() => setSavedFlash(false), 2000);
//     };
//
//     const handleCancel = () => {
//         setDraftTypes(externalTypes ?? {});
//         setEditMode(false);
//     };
//
//     // Date range
//     const dateRange = useMemo(() => {
//         const pd = (template as any).periodDates?.[periodIndex];
//         if (pd?.start && pd?.end) return `${fmtDate(pd.start)} – ${fmtDate(pd.end)}`;
//         return period;
//     }, [template, periodIndex, period]);
//
//     // Split rows
//     const allExpenseRows = template.rows.filter(r =>
//         r.rowType === 'expense' || r.rowType === 'fixed-expense'
//     );
//     const fixedRows    = allExpenseRows.filter(r => getEffectiveType(r.label) === 'fixed');
//     const variableRows = allExpenseRows.filter(r => getEffectiveType(r.label) === 'variable');
//
//     const salaryRow  = template.rows.find(r => r.rowType === 'salary');
//     const income     = salaryRow?.values[periodIndex] ?? null;
//     const fixedTotal = fixedRows.reduce((s, r)    => s + (r.values[periodIndex] ?? 0), 0);
//     const varActual  = variableRows.reduce((s, r) => s + (r.values[periodIndex] ?? 0), 0);
//     const varBudget  = variableRows.reduce((s, r) => s + (targets[`${periodIndex}-${r.label}`] ?? 0), 0);
//     const totalSpend = fixedTotal + varActual;
//     const balance    = income !== null ? income - totalSpend : null;
//     const varOver    = varBudget > 0 && varActual > varBudget;
//
//     const TYPE_LABELS = { past: 'past period', present: 'current period', 'future-manual': 'planned period', 'future-auto': 'predicted period' } as Record<string, string>;
//     const TYPE_TAG_BG = { past: '#888780', present: '#8b1a1a', 'future-manual': '#85B7EB', 'future-auto': '#97C459' } as Record<string, string>;
//     const TYPE_TAG_FG = { past: '#fff', present: '#fff', 'future-manual': '#042C53', 'future-auto': '#173404' } as Record<string, string>;
//
//     return (
//         <Box sx={{ borderRadius: '10px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.18)}`, mt: 1.5 }}>
//
//             {/* ── Header ─────────────────────────────────────────────────── */}
//             <Box sx={{
//                 background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 70%, #5a1515 100%)`,
//                 px: 1.75, py: 1.125,
//                 display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//             }}>
//                 <Box>
//                     <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>{dateRange}</Typography>
//                     {income !== null && (
//                         <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', mt: 0.2 }}>{fmtC(income)} Income</Typography>
//                     )}
//                 </Box>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                     {/* Save flash */}
//                     {savedFlash && (
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.35, borderRadius: '5px', bgcolor: 'rgba(5,150,105,0.25)', border: '1px solid rgba(5,150,105,0.5)' }}>
//                             <CheckCircleOutline sx={{ fontSize: '0.8rem', color: '#4ade80' }} />
//                             <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#4ade80' }}>Saved</Typography>
//                         </Box>
//                     )}
//
//                     {/* Edit / Save / Cancel buttons */}
//                     {!editMode ? (
//                         <Box
//                             onClick={() => setEditMode(true)}
//                             sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.35, borderRadius: '5px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.28)', bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.69rem', fontWeight: 600, transition: 'all .15s', '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' }, userSelect: 'none' }}
//                         >
//                             <Edit sx={{ fontSize: '0.8rem' }} /> Edit categories
//                         </Box>
//                     ) : (
//                         <Box sx={{ display: 'flex', gap: 0.625 }}>
//                             <Box onClick={handleCancel} sx={{ px: 1, py: 0.35, borderRadius: '5px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.75)', fontSize: '0.69rem', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }, userSelect: 'none' }}>
//                                 Cancel
//                             </Box>
//                             <Box onClick={handleSave} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.35, borderRadius: '5px', cursor: 'pointer', bgcolor: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.45)', color: '#fff', fontSize: '0.69rem', fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,0.32)' }, userSelect: 'none' }}>
//                                 <Save sx={{ fontSize: '0.8rem' }} /> Save changes
//                             </Box>
//                         </Box>
//                     )}
//
//                     <Box sx={{ fontSize: '0.65rem', fontWeight: 700, px: 0.875, py: 0.3, borderRadius: '4px', bgcolor: TYPE_TAG_BG[type], color: TYPE_TAG_FG[type], whiteSpace: 'nowrap' }}>
//                         {TYPE_LABELS[type]}
//                     </Box>
//                     <Typography sx={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', letterSpacing: '2px', lineHeight: 1, '&:hover': { color: '#fff' } }}>···</Typography>
//                 </Box>
//             </Box>
//
//             {/* ── Edit mode banner ───────────────────────────────────────── */}
//             {editMode && (
//                 <Box sx={{ px: 1.75, py: 1, bgcolor: alpha(BLUE, 0.06), borderBottom: `1px solid ${alpha(BLUE, 0.18)}`, display: 'flex', alignItems: 'center', gap: 1 }}>
//                     <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: BLUE, flexShrink: 0 }} />
//                     <Typography sx={{ fontSize: '0.75rem', color: '#0c3b6b', lineHeight: 1.5 }}>
//                         <strong>Category edit mode</strong> — toggle each row between Fixed and Variable. Fixed rows are locked; variable rows accept a target amount.
//                     </Typography>
//                 </Box>
//             )}
//
//             {/* ── KPI strip ──────────────────────────────────────────────── */}
//             <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: `0.5px solid ${alpha('#000', 0.08)}` }}>
//                 {[
//                     { label: 'Fixed committed', val: fmtC(fixedTotal),                                            color: NAVY   },
//                     { label: 'Variable budget',  val: varBudget > 0 ? fmtC(varBudget) : '—',                     color: MAROON },
//                     { label: 'Variable actual',  val: fmtC(varActual), color: varOver ? RED : varBudget > 0 ? '#059669' : NAVY },
//                 ].map((kpi, i) => (
//                     <Box key={i} sx={{ px: 1.75, py: 1.125, borderRight: i < 2 ? `0.5px solid ${alpha('#000', 0.08)}` : 'none' }}>
//                         <Typography sx={{ fontSize: '0.67rem', color: SLATE, mb: 0.2 }}>{kpi.label}</Typography>
//                         <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: kpi.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
//                             {kpi.val}
//                         </Typography>
//                     </Box>
//                 ))}
//             </Box>
//
//             {/* ── Scrollable body ────────────────────────────────────────── */}
//             <Box sx={{
//                 maxHeight: 420, overflowY: 'auto',
//                 '&::-webkit-scrollbar': { width: 5 },
//                 '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
//                 '&::-webkit-scrollbar-thumb': { bgcolor: alpha(MAROON, 0.2), borderRadius: '3px' },
//                 '&::-webkit-scrollbar-thumb:hover': { bgcolor: alpha(MAROON, 0.38) },
//             }}>
//
//                 {/* ── FIXED EXPENSES ─────────────────────────────────────── */}
//                 {fixedRows.length > 0 && (
//                     <>
//                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.75, py: 0.75, bgcolor: '#fafaf9', borderBottom: `0.5px solid ${alpha('#000', 0.07)}` }}>
//                             <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Fixed expenses</Typography>
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                 <Box sx={{ fontSize: '0.63rem', fontWeight: 600, px: 0.75, py: 0.2, borderRadius: '4px', bgcolor: '#e8e8e6', color: '#5f5e5a' }}>locked</Box>
//                                 <Typography sx={{ fontSize: '0.79rem', fontWeight: 700, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>{fmtC(fixedTotal)}</Typography>
//                             </Box>
//                         </Box>
//
//                         {fixedRows.map(row => {
//                             const actual   = row.values[periodIndex] ?? null;
//                             const catColor = CAT_COLORS[row.label] ?? SLATE;
//                             const subtext  = DEFAULT_FIXED.has(row.label) && row.label === 'Rent'
//                                 ? 'Fixed · matches committed amount'
//                                 : 'Fixed · recurring subscription';
//
//                             return (
//                                 <Box key={row.label} sx={{ px: 1.75, py: editMode ? 0.875 : 1, borderBottom: `0.5px solid ${alpha('#000', 0.05)}`, display: 'flex', alignItems: 'center', gap: 1, bgcolor: editMode ? alpha(MAROON, 0.015) : 'transparent', transition: 'background .12s', '&:hover': { bgcolor: alpha(MAROON, 0.025) } }}>
//                                     <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: catColor, flexShrink: 0 }} />
//                                     <Box sx={{ flex: 1 }}>
//                                         <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: NAVY }}>{row.label}</Typography>
//                                         {!editMode && <Typography sx={{ fontSize: '0.67rem', color: SLATE }}>{subtext}</Typography>}
//                                     </Box>
//
//                                     {/* Edit mode: type toggle */}
//                                     {editMode ? (
//                                         <TypePill
//                                             isFixed={getEffectiveType(row.label) === 'fixed'}
//                                             onChange={isFixed => handleToggle(row.label, isFixed)}
//                                         />
//                                     ) : (
//                                         <Lock sx={{ fontSize: '0.8rem', color: alpha(SLATE, 0.45), flexShrink: 0 }} />
//                                     )}
//
//                                     <Box sx={{ textAlign: 'right', minWidth: 72 }}>
//                                         <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>
//                                             {actual !== null ? `$${fmt(actual)}` : '—'}
//                                         </Typography>
//                                     </Box>
//                                     <Box sx={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, bgcolor: alpha('#000', 0.05), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                                         <Typography sx={{ fontSize: '0.7rem', color: SLATE }}>—</Typography>
//                                     </Box>
//                                 </Box>
//                             );
//                         })}
//                     </>
//                 )}
//
//                 {/* ── VARIABLE EXPENSES ──────────────────────────────────── */}
//                 {variableRows.length > 0 && (
//                     <>
//                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.75, py: 0.75, bgcolor: '#fafaf9', borderBottom: `0.5px solid ${alpha('#000', 0.07)}` }}>
//                             <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Variable expenses</Typography>
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                 <Box sx={{ fontSize: '0.63rem', fontWeight: 600, px: 0.75, py: 0.2, borderRadius: '4px', bgcolor: '#deeeff', color: '#185fa5' }}>adjustable</Box>
//                                 {varBudget > 0 && (
//                                     <Typography sx={{ fontSize: '0.79rem', fontWeight: 700, color: varOver ? RED : '#059669', fontVariantNumeric: 'tabular-nums' }}>
//                                         {fmtC(varActual)} of {fmtC(varBudget)}
//                                     </Typography>
//                                 )}
//                             </Box>
//                         </Box>
//
//                         {variableRows.map(row => {
//                             const actual   = row.values[periodIndex] ?? null;
//                             const target   = targets[`${periodIndex}-${row.label}`] ?? null;
//                             const catColor = CAT_COLORS[row.label] ?? SLATE;
//
//                             const avg = (() => {
//                                 const vals = row.values.map((v, i) => ({ v, i })).filter(({ v, i }) => v !== null && v > 0 && !isPeriodFuture(template, i)).map(({ v }) => v as number);
//                                 return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
//                             })();
//
//                             if (actual === null && target === null && avg === null) return null;
//
//                             const hasTarget = target !== null;
//                             const hasActual = actual !== null;
//                             const over      = hasTarget && hasActual && actual > target;
//                             const under     = hasTarget && hasActual && actual < target;
//                             const onTrack   = hasTarget && hasActual && actual <= target;
//                             const saved     = hasTarget && hasActual ? target - actual : null;
//                             const reference = target ?? avg ?? 0;
//                             const barPct    = reference > 0 && hasActual ? Math.min(120, Math.round((actual / reference) * 100)) : 0;
//                             const barColor  = over ? RED : onTrack ? '#059669' : catColor;
//
//                             const feedback = (() => {
//                                 if (over && saved !== null)    return { text: `+$${Math.abs(Math.round(saved))} over target ▲`, color: RED };
//                                 if (under && saved !== null)   return { text: `−$${Math.round(saved)} under target`, color: '#059669' };
//                                 if (onTrack)                   return { text: 'on target', color: '#059669' };
//                                 if (!hasTarget && avg !== null && hasActual)
//                                     return actual > avg * 1.15
//                                         ? { text: `▲ $${Math.round(actual - avg)} above avg`, color: AMBER }
//                                         : actual < avg * 0.85
//                                             ? { text: `▼ $${Math.round(avg - actual)} below avg`, color: '#0f766e' }
//                                             : { text: 'near avg', color: SLATE };
//                                 return null;
//                             })();
//
//                             return (
//                                 <Box key={row.label} sx={{ px: 1.75, pt: editMode ? 0.875 : 1, pb: 0.875, borderBottom: `0.5px solid ${alpha('#000', 0.05)}`, bgcolor: over ? 'rgba(226,75,74,0.038)' : onTrack ? 'rgba(5,150,105,0.018)' : 'transparent', '&:hover': { bgcolor: over ? 'rgba(226,75,74,0.055)' : alpha(MAROON, 0.018) }, transition: 'background .12s' }}>
//                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                         <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: catColor, flexShrink: 0 }} />
//                                         <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: NAVY, flex: 1, lineHeight: 1.2 }}>{row.label}</Typography>
//
//                                         {/* Edit mode: type toggle */}
//                                         {editMode && (
//                                             <TypePill
//                                                 isFixed={getEffectiveType(row.label) === 'fixed'}
//                                                 onChange={isFixed => handleToggle(row.label, isFixed)}
//                                             />
//                                         )}
//
//                                         {/* Target input — hidden in edit mode */}
//                                         {!editMode && (
//                                             <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mr: 0.5 }}>
//                                                 <Typography sx={{ fontSize: '0.58rem', color: SLATE, mb: 0.25, textTransform: 'uppercase', letterSpacing: '0.05em' }}>target</Typography>
//                                                 <Box
//                                                     component="input" type="number"
//                                                     value={target ?? ''}
//                                                     placeholder={avg !== null ? String(avg) : '—'}
//                                                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
//                                                         const v = parseFloat(e.target.value);
//                                                         onSetTarget(periodIndex, row.label, isNaN(v) ? null : v);
//                                                     }}
//                                                     sx={{
//                                                         width: 84, textAlign: 'right', fontSize: '0.82rem', fontWeight: 500,
//                                                         color: hasTarget ? NAVY : SLATE,
//                                                         border: `0.5px solid ${over ? alpha(RED, 0.4) : hasTarget ? alpha(MAROON, 0.3) : alpha('#000', 0.13)}`,
//                                                         borderRadius: '5px', px: 0.875, py: 0.375,
//                                                         bgcolor: over ? alpha(RED, 0.04) : hasTarget ? alpha(MAROON, 0.04) : alpha('#000', 0.02),
//                                                         fontFamily: 'inherit',
//                                                         '&:focus': { outline: `1.5px solid ${over ? RED : MAROON}`, borderColor: 'transparent' },
//                                                         '&::placeholder': { color: alpha(SLATE, 0.4), fontStyle: 'italic', fontSize: '0.75rem' },
//                                                         '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': { opacity: 0 },
//                                                     }}
//                                                 />
//                                             </Box>
//                                         )}
//
//                                         {/* Actual */}
//                                         <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 68 }}>
//                                             <Typography sx={{ fontSize: '0.58rem', color: SLATE, mb: 0.25, textTransform: 'uppercase', letterSpacing: '0.05em' }}>actual</Typography>
//                                             <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: over ? RED : onTrack ? '#059669' : NAVY, fontVariantNumeric: 'tabular-nums' }}>
//                                                 {hasActual ? `$${fmt(actual)}` : '—'}
//                                             </Typography>
//                                         </Box>
//
//                                         {/* Status badge — hidden in edit mode */}
//                                         {!editMode && (
//                                             <Box sx={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, bgcolor: over ? alpha(RED, 0.12) : onTrack ? alpha('#059669', 0.13) : alpha('#000', 0.05), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                                                 <Typography sx={{ fontSize: '0.7rem', lineHeight: 1, color: over ? RED : onTrack ? '#059669' : SLATE }}>
//                                                     {over ? '▲' : onTrack ? '✓' : '–'}
//                                                 </Typography>
//                                             </Box>
//                                         )}
//                                     </Box>
//
//                                     {/* Progress bar + feedback — hidden in edit mode */}
//                                     {!editMode && (hasActual || hasTarget) && (
//                                         <Box sx={{ mt: 0.75, ml: '17px' }}>
//                                             <Box sx={{ position: 'relative', height: 5, bgcolor: alpha('#000', 0.07), borderRadius: '3px', overflow: 'hidden', mb: 0.4 }}>
//                                                 <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(barPct, 100)}%`, bgcolor: barColor, borderRadius: '3px', transition: 'width .25s' }} />
//                                                 {over && barPct > 100 && (
//                                                     <Box sx={{ position: 'absolute', left: '100%', top: 0, bottom: 0, width: `${barPct - 100}%`, bgcolor: alpha(RED, 0.45), borderRadius: '0 3px 3px 0' }} />
//                                                 )}
//                                             </Box>
//                                             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                                                 {feedback && <Typography sx={{ fontSize: '0.68rem', fontWeight: 500, color: feedback.color }}>{feedback.text}</Typography>}
//                                                 {avg !== null && <Typography sx={{ fontSize: '0.64rem', color: alpha(SLATE, 0.6), ml: 'auto' }}>avg ${fmtS(avg)}</Typography>}
//                                             </Box>
//                                         </Box>
//                                     )}
//                                 </Box>
//                             );
//                         })}
//                     </>
//                 )}
//             </Box>
//
//             {/* ── Footer ─────────────────────────────────────────────────── */}
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1.75, py: 1, borderTop: `1px solid ${alpha(MAROON, 0.1)}` }}>
//                 <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>Income</Typography>
//                 <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>{fmtC(income)}</Typography>
//             </Box>
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1.75, py: 0.875, borderTop: `0.5px solid ${alpha('#000', 0.06)}` }}>
//                 <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>Total committed</Typography>
//                 <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>{fmtC(fixedTotal + varActual)}</Typography>
//             </Box>
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1.75, py: 1, borderTop: `0.5px solid ${alpha(MAROON, 0.12)}`, bgcolor: '#fdfafa' }}>
//                 <Box>
//                     <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>Period balance</Typography>
//                     {varBudget > 0 && (
//                         <Typography sx={{ fontSize: '0.67rem', color: SLATE, mt: 0.15 }}>
//                             {varOver
//                                 ? `$${Math.abs(Math.round(varActual - varBudget))} over variable budget`
//                                 : `$${Math.abs(Math.round(varBudget - varActual))} under variable budget`}
//                         </Typography>
//                     )}
//                 </Box>
//                 <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: balance !== null ? (balance >= 0 ? '#059669' : RED) : SLATE, fontVariantNumeric: 'tabular-nums' }}>
//                     {balance !== null ? (balance >= 0 ? '+' : '') + `$${fmt(balance)}` : '—'}
//                 </Typography>
//             </Box>
//         </Box>
//     );
// };
//
// export default PeriodDetailCard;
