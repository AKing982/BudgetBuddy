// ── SpreadsheetMode — drop-in replacement for the SpreadsheetMode component
// inside ForecastPanel.tsx
//
// NEW FEATURES vs. the previous version:
//  1. Category selector — "All" overview pill + per-category pills.
//     Selecting a category shows a full SVG trend chart for that category
//     (past actuals, weighted prediction line, ±1σ band, future projections)
//     plus key stats: avg, min, max, trend direction, next predicted value.
//  2. Balance trajectory chart — SVG line showing cumulative balance across
//     all periods, split at "now" into actual (solid maroon) and projected
//     (dashed blue).  A future savings trajectory chart sits below it.
//  3. Goal threshold predictor — two inputs (balance target, savings target).
//     As the user types, the panel shows which period they're likely to cross
//     that threshold, an optimistic / pessimistic range, and a small progress
//     bar.  Both balance and savings goals are tracked simultaneously.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
//    the parent file; paste these inline or import them) ───────────────────────
import type { SpreadsheetTemplate } from '../domain/SpreadsheetTypes';
// ── Re-use the same tokens as ForecastPanel ───────────────────────────────────
const MAROON  = '#6b1a1a';
const GREEN   = '#059669';
const AMBER   = '#d97706';
const RED     = '#dc2626';
const NAVY    = '#0C447C';
const SLATE   = '#64748b';
const PROJ    = '#85B7EB';
const TEAL    = '#0d9488';

const CAT_COLORS: Record<string, string> = {
    Rent: '#1D9E75', Groceries: '#6b1a1a', Gas: '#BA7517',
    Payments: '#7c3aed', Other: '#888780', Insurance: '#0ea5e9',
    Utilities: '#f59e0b', Electric: '#6366f1', 'Gas Bill': '#ef4444',
    Subscriptions: '#8b5cf6', Haircut: '#14b8a6', Savings: '#059669',
    'Order out': '#D4537E', 'Other Stuff': '#888780', 'Coffee Supplies': '#ba7517',
    'Phone Insurance': '#0ea5e9', 'Trip Cost': '#d97706', Golf: '#639922',
};

// ── Types (subset — SpreadsheetTemplate + DerivedData must be imported from


export type SheetFocus   = 'historical' | 'future';
export type OptimizeMode = 'auto' | 'manual';

interface DerivedData {
    expAll: number[]; predAll: number[]; incAll: number[];
    netAll: number[]; predNetAll: number[];
    balTraj: number[]; predBalTraj: number[];
    savTraj: number[]; predSavTraj: number[];
    presentIdx: number; endBal: number; predEndBal: number; endSav: number;
    avgInc: number; avgExp: number; curExp: number; savRate: number; delta: number;
    catFlags: { label: string; color: string; entered: number; avg: number; pct: number; period: number }[];
    plans: { label: string; target: number; byPeriod: number; color: string; pct: number; predPct: number; atRisk: boolean; shortfall: number }[];
    catPredictions: { label: string; color: string; weighted: number; variance: number; conf: number; periods: number }[];
}

// ── Local helpers ─────────────────────────────────────────────────────────────
const fmt   = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString()}`;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function periodType(t: SpreadsheetTemplate, pi: number): 'past' | 'present' | 'future' {
    const pd = t.periodDates?.[pi];
    if (!pd) return pi < Math.floor(t.periods.length / 2) ? 'past' : 'future';
    const now = new Date();
    if (pd.end < now)   return 'past';
    if (pd.start > now) return 'future';
    return 'present';
}
const isFuture  = (t: SpreadsheetTemplate, pi: number) => periodType(t, pi) === 'future';
const isPast    = (t: SpreadsheetTemplate, pi: number) => periodType(t, pi) === 'past';
const isPresent = (t: SpreadsheetTemplate, pi: number) => periodType(t, pi) === 'present';

function trendDir(vals: (number | null)[]): 'up' | 'down' | 'flat' {
    const vs = vals.filter((v): v is number => v !== null && v > 0);
    if (vs.length < 2) return 'flat';
    const half  = Math.floor(vs.length / 2);
    const early = vs.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const late  = vs.slice(half).reduce((a, b) => a + b, 0) / (vs.length - half);
    if (late > early * 1.08) return 'up';
    if (late < early * 0.92) return 'down';
    return 'flat';
}

// ── Tiny SVG line chart ───────────────────────────────────────────────────────
interface LineSeries {
    data:    (number | null)[];
    color:   string;
    width?:  number;
    dashed?: boolean;
    filled?: boolean;
}

const SvgLineChart: React.FC<{
    series:     LineSeries[];
    labels:     string[];
    height?:    number;
    dividerIdx?: number;         // vertical "now" line
    threshold?: number;          // horizontal target line
    thresholdColor?: string;
    bandData?:  { upper: number[]; lower: number[]; color: string }; // ±σ band
}> = ({ series, labels, height = 140, dividerIdx, threshold, thresholdColor = AMBER, bandData }) => {
    const W = 380; const H = height;
    const PAD = { t: 10, r: 8, b: 26, l: 48 };
    const CW = W - PAD.l - PAD.r;
    const CH = H - PAD.t - PAD.b;
    const n  = labels.length || 1;

    const allVals: number[] = series.flatMap(s => s.data.filter((v): v is number => v !== null));
    if (bandData) { allVals.push(...bandData.upper, ...bandData.lower); }
    if (threshold !== undefined) allVals.push(threshold);
    const minV = Math.min(...allVals, 0);
    const maxV = Math.max(...allVals, 1);
    const range = maxV - minV || 1;

    const px = (i: number) => PAD.l + (i / Math.max(n - 1, 1)) * CW;
    const py = (v: number) => PAD.t + CH - ((v - minV) / range) * CH;

    // Y tick step
    const tickStep = range > 5000 ? 2000 : range > 2000 ? 1000 : range > 800 ? 400 : range > 300 ? 100 : 50;
    const ticks: number[] = [];
    for (let v = Math.ceil(minV / tickStep) * tickStep; v <= maxV + tickStep * 0.1; v += tickStep) ticks.push(v);

    // Build SVG path for a series
    const buildPath = (data: (number | null)[]): string => {
        const segs: string[] = [];
        let open = false;
        data.forEach((v, i) => {
            if (v === null) { open = false; return; }
            segs.push(`${open ? 'L' : 'M'} ${px(i).toFixed(1)},${py(v).toFixed(1)}`);
            open = true;
        });
        return segs.join(' ');
    };

    // Band area path
    const bandPath = bandData ? (() => {
        const upper = bandData.upper.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
        const lower = [...bandData.lower].reverse().map((v, i) => `L ${px(bandData.lower.length - 1 - i).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
        return `${upper} ${lower} Z`;
    })() : '';

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible', display: 'block' }}>
            {/* Grid lines */}
            {ticks.map(v => (
                <line key={v} x1={PAD.l} y1={py(v)} x2={PAD.l + CW} y2={py(v)}
                      stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
            ))}
            {/* Y axis labels */}
            {ticks.filter((_, i) => i % Math.ceil(ticks.length / 4) === 0).map(v => (
                <text key={v} x={PAD.l - 4} y={py(v) + 4} textAnchor="end" fontSize="9" fill={SLATE}>
                    {v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : v < 0 ? `-$${Math.abs(v)}` : `$${v}`}
                </text>
            ))}
            {/* Zero line */}
            {minV < 0 && maxV > 0 && (
                <line x1={PAD.l} y1={py(0)} x2={PAD.l + CW} y2={py(0)}
                      stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeDasharray="3 2" />
            )}
            {/* "Now" divider */}
            {dividerIdx !== undefined && dividerIdx >= 0 && (
                <line x1={px(dividerIdx)} y1={PAD.t} x2={px(dividerIdx)} y2={PAD.t + CH}
                      stroke={alpha(MAROON, 0.25)} strokeWidth="1.5" strokeDasharray="4 3" />
            )}
            {/* Threshold line */}
            {threshold !== undefined && py(threshold) >= PAD.t && py(threshold) <= PAD.t + CH && (
                <>
                    <line x1={PAD.l} y1={py(threshold)} x2={PAD.l + CW} y2={py(threshold)}
                          stroke={thresholdColor} strokeWidth="1.5" strokeDasharray="5 3" />
                    <text x={PAD.l + CW + 2} y={py(threshold) + 4} fontSize="8" fill={thresholdColor} fontWeight="700">
                        {fmt(threshold)}
                    </text>
                </>
            )}
            {/* Band */}
            {bandData && bandPath && (
                <path d={bandPath} fill={bandData.color} opacity="0.18" />
            )}
            {/* Series lines */}
            {series.map((s, si) => {
                const d = buildPath(s.data);
                if (!d) return null;
                return (
                    <path key={si} d={d} fill="none"
                          stroke={s.color} strokeWidth={s.width ?? 2}
                          strokeDasharray={s.dashed ? '5 3' : undefined}
                          strokeLinecap="round" strokeLinejoin="round" />
                );
            })}
            {/* Dots on last data point of each non-dashed series */}
            {series.filter(s => !s.dashed).map((s, si) => {
                const lastIdx = [...s.data].reverse().findIndex(v => v !== null);
                if (lastIdx < 0) return null;
                const realIdx = s.data.length - 1 - lastIdx;
                const v = s.data[realIdx] as number;
                return <circle key={`dot-${si}`} cx={px(realIdx)} cy={py(v)} r="3"
                               fill={s.color} stroke="#fff" strokeWidth="1.5" />;
            })}
            {/* X axis labels — show first, now, last */}
            {[0, dividerIdx, n - 1].filter((v): v is number => v !== undefined && v >= 0 && v < n)
                .filter((v, i, arr) => arr.indexOf(v) === i)
                .map(i => (
                    <text key={i} x={px(i)} y={H - 4} textAnchor="middle" fontSize="8.5"
                          fill={i === dividerIdx ? MAROON : SLATE}
                          fontWeight={i === dividerIdx ? '700' : '400'}>
                        {labels[i]}
                    </text>
                ))
            }
        </svg>
    );
};

// ── Category detail view ──────────────────────────────────────────────────────
const CategoryDetail: React.FC<{
    template:  SpreadsheetTemplate;
    d:         DerivedData;
    label:     string;
    onBack:    () => void;
}> = ({ template, d, label, onBack }) => {
    const color   = CAT_COLORS[label] ?? SLATE;
    const CI      = d.presentIdx;
    const expRows = template.rows.filter(r => r.rowType === 'expense');
    const row     = expRows.find(r => r.label === label);
    const pred    = d.catPredictions.find(c => c.label === label);

    const allVals = row?.values ?? [];
    const pastVals = allVals
        .map((v, i) => ({ v, i }))
        .filter(({ v, i }) => v !== null && v > 0 && isPast(template, i))
        .map(({ v }) => v as number);

    const avg     = pastVals.length ? Math.round(pastVals.reduce((a, b) => a + b, 0) / pastVals.length) : 0;
    const minVal  = pastVals.length ? Math.min(...pastVals) : 0;
    const maxVal  = pastVals.length ? Math.max(...pastVals) : 0;
    const trend   = trendDir(allVals);
    const trendColor = trend === 'up' ? RED : trend === 'down' ? GREEN : SLATE;
    const trendLabel = trend === 'up' ? '↑ Trending up' : trend === 'down' ? '↓ Trending down' : '→ Stable';
    const confColor  = pred ? (pred.conf >= 80 ? GREEN : pred.conf >= 60 ? AMBER : RED) : SLATE;

    // Build series
    const actualSeries: (number | null)[] = allVals.map((v, i) =>
        isPast(template, i) || isPresent(template, i) ? (v ?? null) : null
    );
    const futureSeries: (number | null)[] = allVals.map((v, i) =>
        isFuture(template, i) ? (v ?? pred?.weighted ?? null) : (isPresent(template, i) ? (v ?? null) : null)
    );
    const predLine: (number | null)[] = allVals.map((_, i) =>
        isFuture(template, i) ? (pred?.weighted ?? null) : null
    );

    const upperBand = allVals.map((_, i) =>
        isFuture(template, i) ? (pred ? pred.weighted + pred.variance : 0) : 0
    );
    const lowerBand = allVals.map((_, i) =>
        isFuture(template, i) ? (pred ? Math.max(0, pred.weighted - pred.variance) : 0) : 0
    );
    const hasBand = pred && pred.variance > 0;

    return (
        <Box>
            {/* Back button */}
            <Box onClick={onBack} sx={{
                display: 'inline-flex', alignItems: 'center', gap: 0.5, mb: 1.5,
                cursor: 'pointer', color: SLATE, fontSize: '0.72rem', fontWeight: 600,
                '&:hover': { color: MAROON },
            }}>
                ← All categories
            </Box>

            {/* Category header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: NAVY }}>{label}</Typography>
                <Box sx={{ px: 0.875, py: '2px', borderRadius: '4px', bgcolor: alpha(trendColor, 0.1), ml: 'auto' }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: trendColor }}>{trendLabel}</Typography>
                </Box>
            </Box>

            {/* Stats row */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0.75, mb: 1.75 }}>
                {[
                    { label: 'Avg (past)', val: avg ? fmt(avg) : '—',   color: NAVY  },
                    { label: 'Min',        val: minVal ? fmt(minVal) : '—', color: GREEN },
                    { label: 'Max',        val: maxVal ? fmt(maxVal) : '—', color: RED   },
                ].map((k, i) => (
                    <Box key={i} sx={{ textAlign: 'center', p: '5px 4px', borderRadius: '6px', bgcolor: alpha('#000', 0.02), border: `0.5px solid ${alpha('#000', 0.07)}` }}>
                        <Typography sx={{ fontSize: '0.6rem', color: SLATE, mb: 0.2 }}>{k.label}</Typography>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: k.color, fontVariantNumeric: 'tabular-nums' }}>{k.val}</Typography>
                    </Box>
                ))}
            </Box>

            {/* Chart */}
            <Box sx={{ borderRadius: '8px', bgcolor: alpha('#000', 0.015), p: 1, mb: 1.5 }}>
                <SvgLineChart
                    labels={template.periods}
                    height={150}
                    dividerIdx={CI}
                    series={[
                        { data: actualSeries, color: color, width: 2.5 },
                        { data: futureSeries, color: color, width: 2, dashed: true },
                        { data: predLine, color: PROJ, width: 1.5, dashed: true },
                    ]}
                    bandData={hasBand ? { upper: upperBand, lower: lowerBand, color } : undefined}
                />
                {/* Legend */}
                <Box sx={{ display: 'flex', gap: 1.5, mt: 0.75, flexWrap: 'wrap' }}>
                    {[
                        { color, label: 'Actual', dashed: false },
                        { color, label: 'Entered / projected', dashed: true },
                        { color: PROJ, label: 'Model prediction', dashed: true },
                    ].map(l => (
                        <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <svg width={14} height={6}>
                                <line x1="0" y1="3" x2="14" y2="3" stroke={l.color}
                                      strokeWidth="2" strokeDasharray={l.dashed ? '4 2' : undefined} />
                            </svg>
                            <Typography sx={{ fontSize: '0.65rem', color: SLATE }}>{l.label}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Prediction box */}
            {pred ? (
                <Box sx={{ p: '10px 12px', borderRadius: '8px', border: `1px solid ${alpha(confColor, 0.25)}`, bgcolor: alpha(confColor, 0.04), mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: NAVY }}>Next period prediction</Typography>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: confColor }}>{pred.conf}% confidence</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: color, fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(pred.weighted)}
                        <Typography component="span" sx={{ fontSize: '0.72rem', color: SLATE, ml: 0.5 }}>± {fmt(pred.variance)}</Typography>
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: SLATE, mt: 0.25 }}>
                        Range: {fmt(Math.max(0, pred.weighted - pred.variance))} – {fmt(pred.weighted + pred.variance)} · based on {pred.periods} period{pred.periods !== 1 ? 's' : ''}
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ p: '9px 12px', borderRadius: '8px', bgcolor: alpha('#000', 0.03), mb: 1.5 }}>
                    <Typography sx={{ fontSize: '0.75rem', color: SLATE }}>Insufficient history to generate prediction.</Typography>
                </Box>
            )}

            {/* Future-period breakdown if any values entered */}
            {(() => {
                const futureVals = allVals
                    .map((v, i) => ({ v, i, label: template.periods[i] }))
                    .filter(({ v, i }) => v !== null && v > 0 && isFuture(template, i));
                if (!futureVals.length) return (
                    <Typography sx={{ fontSize: '0.72rem', color: alpha(SLATE, 0.65) }}>
                        No future values entered for {label}.
                    </Typography>
                );
                return (
                    <>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: alpha(MAROON, 0.55), textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
                            Future entries
                        </Typography>
                        {futureVals.map(({ v, i, label: pl }) => {
                            const delta = avg > 0 ? Math.round(((v as number) - avg) / avg * 100) : 0;
                            const dc    = delta > 0 ? RED : delta < 0 ? GREEN : SLATE;
                            return (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, borderBottom: `0.5px solid ${alpha('#000', 0.05)}` }}>
                                    <Typography sx={{ fontSize: '0.72rem', color: SLATE, flex: 1 }}>{pl}</Typography>
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>{fmt(v as number)}</Typography>
                                    <Box sx={{ px: 0.625, py: '1px', borderRadius: '4px', bgcolor: alpha(dc, 0.1) }}>
                                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: dc }}>{delta > 0 ? '+' : ''}{delta}%</Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                    </>
                );
            })()}
        </Box>
    );
};

// ── Trajectory charts + Goal predictor ───────────────────────────────────────
const TrajectoryAndGoals: React.FC<{
    template: SpreadsheetTemplate;
    d:        DerivedData;
}> = ({ template, d }) => {
    const [balTarget, setBalTarget]  = useState('');
    const [savTarget, setSavTarget]  = useState('');
    const CI = d.presentIdx;
    const N  = template.periods.length;

    // Extend trajectories beyond plan using avg net / avg net-predicted
    const avgFutureNet     = d.netAll.slice(CI).reduce((a, b) => a + b, 0) / Math.max(1, N - CI);
    const avgPredFutureNet = d.predNetAll.slice(CI).reduce((a, b) => a + b, 0) / Math.max(1, N - CI);

    // ── Threshold crossing calculator ─────────────────────────────────────────
    function findCrossing(traj: number[], target: number): { periodIdx: number; label: string } | null {
        for (let i = 0; i < traj.length; i++) {
            if (traj[i] >= target) return { periodIdx: i, label: template.periods[i] ?? `Period ${i + 1}` };
        }
        // Extrapolate beyond plan
        const last = traj[traj.length - 1];
        const perPeriod = avgFutureNet > 0 ? avgFutureNet : avgPredFutureNet;
        if (perPeriod <= 0) return null;
        const periodsNeeded = Math.ceil((target - last) / perPeriod);
        if (periodsNeeded > 52) return null; // don't project more than ~2yrs
        return { periodIdx: traj.length - 1 + periodsNeeded, label: `~${periodsNeeded} periods after plan end` };
    }

    function findSavingsCrossing(traj: number[], target: number): ReturnType<typeof findCrossing> {
        for (let i = 0; i < traj.length; i++) {
            if (traj[i] >= target) return { periodIdx: i, label: template.periods[i] ?? `Period ${i + 1}` };
        }
        const last = traj[traj.length - 1];
        const avgSavPerPeriod = d.savTraj.length > 1 ? (d.savTraj[d.savTraj.length - 1] - d.savTraj[0]) / d.savTraj.length : 0;
        if (avgSavPerPeriod <= 0) return null;
        const needed = Math.ceil((target - last) / avgSavPerPeriod);
        if (needed > 52) return null;
        return { periodIdx: traj.length - 1 + needed, label: `~${needed} periods after plan end` };
    }

    const balTargetNum = parseFloat(balTarget.replace(/[^0-9.-]/g, ''));
    const savTargetNum = parseFloat(savTarget.replace(/[^0-9.-]/g, ''));

    const balResult = !isNaN(balTargetNum) && balTargetNum > 0 ? findCrossing(d.balTraj, balTargetNum) : null;
    const savResult = !isNaN(savTargetNum) && savTargetNum > 0 ? findSavingsCrossing(d.savTraj, savTargetNum) : null;

    // Optimistic / pessimistic range (±20% around avg net)
    const balOptimistic = !isNaN(balTargetNum) && balTargetNum > 0
        ? findCrossing(d.balTraj.map((v, i) => v + Math.round(Math.abs(d.balTraj[Math.max(0, i - 1)] ?? 0) * 0.1)), balTargetNum)
        : null;

    // ── Chart series ──────────────────────────────────────────────────────────
    const balActual:    (number | null)[] = d.balTraj.map((v, i) => i <= CI ? v : null);
    const balPred:      (number | null)[] = d.predBalTraj.map((v, i) => i >= CI ? v : null);
    const balUser:      (number | null)[] = d.balTraj.map((v, i) => i >= CI ? v : null);
    const savActual:    (number | null)[] = d.savTraj.map((v, i) => i <= CI ? v : null);
    const savPred:      (number | null)[] = d.predSavTraj.map((v, i) => i >= CI ? v : null);
    const savUser:      (number | null)[] = d.savTraj.map((v, i) => i >= CI ? v : null);

    const userBalColor = d.delta > 50 ? RED : GREEN;

    return (
        <Box>
            {/* ── Balance trajectory ── */}
            <Box sx={{ mb: 0.625 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.625 }}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: alpha(MAROON, 0.55) }}>
                        Balance trajectory
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {[
                            { color: MAROON, label: 'Actual' },
                            { color: PROJ,   label: 'Baseline', dashed: true },
                            { color: userBalColor, label: 'Projected' },
                        ].map(l => (
                            <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.375 }}>
                                <svg width={12} height={5}>
                                    <line x1="0" y1="2.5" x2="12" y2="2.5" stroke={l.color}
                                          strokeWidth="2" strokeDasharray={l.dashed ? '3 2' : undefined} />
                                </svg>
                                <Typography sx={{ fontSize: '0.6rem', color: SLATE }}>{l.label}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
                <Box sx={{ borderRadius: '8px', bgcolor: alpha('#000', 0.015), p: '8px 8px 4px' }}>
                    <SvgLineChart
                        labels={template.periods}
                        height={130}
                        dividerIdx={CI}
                        threshold={!isNaN(balTargetNum) && balTargetNum > 0 ? balTargetNum : undefined}
                        thresholdColor={NAVY}
                        series={[
                            { data: balActual, color: MAROON,       width: 2.5 },
                            { data: balPred,   color: PROJ,         width: 1.5, dashed: true },
                            { data: balUser,   color: userBalColor, width: 2.5 },
                        ]}
                    />
                </Box>
            </Box>

            {/* ── Balance goal predictor ── */}
            <Box sx={{ mb: 2, p: '10px 12px', borderRadius: '8px', border: `1px solid ${alpha(NAVY, 0.15)}`, bgcolor: alpha(NAVY, 0.025) }}>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: NAVY, mb: 0.875 }}>
                    Balance goal — when will I reach…
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.875 }}>
                    <Box sx={{ position: 'relative', flex: 1 }}>
                        <Typography sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: SLATE, fontSize: '0.82rem', pointerEvents: 'none' }}>$</Typography>
                        <Box
                            component="input"
                            type="text"
                            value={balTarget}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBalTarget(e.target.value)}
                            placeholder="e.g. 5000"
                            sx={{
                                width: '100%', border: `1px solid ${alpha(NAVY, 0.2)}`, borderRadius: '6px',
                                pl: 2.5, pr: 1, py: 0.625, fontSize: '0.82rem', color: NAVY,
                                fontFamily: 'inherit', boxSizing: 'border-box', bgcolor: '#fff',
                                '&:focus': { outline: `1.5px solid ${NAVY}`, outlineOffset: '1px' },
                            }}
                        />
                    </Box>
                    {balResult && (
                        <Box sx={{ px: 1, py: '4px', borderRadius: '6px', bgcolor: alpha(GREEN, 0.1), border: `0.5px solid ${alpha(GREEN, 0.3)}`, flexShrink: 0 }}>
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: GREEN, whiteSpace: 'nowrap' }}>
                                By {balResult.label}
                            </Typography>
                        </Box>
                    )}
                    {!isNaN(balTargetNum) && balTargetNum > 0 && !balResult && (
                        <Box sx={{ px: 1, py: '4px', borderRadius: '6px', bgcolor: alpha(AMBER, 0.1), border: `0.5px solid ${alpha(AMBER, 0.3)}`, flexShrink: 0 }}>
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: AMBER, whiteSpace: 'nowrap' }}>
                                Beyond forecast
                            </Typography>
                        </Box>
                    )}
                </Box>
                {balResult && !isNaN(balTargetNum) && (
                    <>
                        <Box sx={{ height: 4, borderRadius: 2, bgcolor: alpha('#000', 0.07), mb: 0.5, overflow: 'hidden' }}>
                            <Box sx={{
                                height: '100%', borderRadius: 2, bgcolor: GREEN, transition: 'width .4s',
                                width: `${clamp(Math.round((d.endBal / balTargetNum) * 100), 0, 100)}%`,
                            }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.68rem', color: SLATE }}>
                            Current balance {fmt(d.endBal)} of {fmt(balTargetNum)} target
                            {' · '}{clamp(Math.round((d.endBal / balTargetNum) * 100), 0, 100)}% there
                        </Typography>
                    </>
                )}
                {!isNaN(balTargetNum) && balTargetNum > 0 && d.endBal >= balTargetNum && (
                    <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: GREEN, fontWeight: 600 }}>✓ Already met — balance exceeds target</Typography>
                    </Box>
                )}
            </Box>

            {/* ── Savings trajectory ── */}
            <Box sx={{ mb: 0.625 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.625 }}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: alpha(MAROON, 0.55) }}>
                        Cumulative savings trajectory
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {[
                            { color: GREEN, label: 'Actual' },
                            { color: PROJ,  label: 'Baseline', dashed: true },
                        ].map(l => (
                            <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.375 }}>
                                <svg width={12} height={5}>
                                    <line x1="0" y1="2.5" x2="12" y2="2.5" stroke={l.color}
                                          strokeWidth="2" strokeDasharray={l.dashed ? '3 2' : undefined} />
                                </svg>
                                <Typography sx={{ fontSize: '0.6rem', color: SLATE }}>{l.label}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
                <Box sx={{ borderRadius: '8px', bgcolor: alpha('#000', 0.015), p: '8px 8px 4px' }}>
                    <SvgLineChart
                        labels={template.periods}
                        height={130}
                        dividerIdx={CI}
                        threshold={!isNaN(savTargetNum) && savTargetNum > 0 ? savTargetNum : undefined}
                        thresholdColor={TEAL}
                        series={[
                            { data: savActual, color: GREEN, width: 2.5 },
                            { data: savPred,   color: PROJ,  width: 1.5, dashed: true },
                            { data: savUser,   color: GREEN, width: 2, dashed: true },
                        ]}
                    />
                </Box>
            </Box>

            {/* ── Savings goal predictor ── */}
            <Box sx={{ mb: 2, p: '10px 12px', borderRadius: '8px', border: `1px solid ${alpha(TEAL, 0.2)}`, bgcolor: alpha(TEAL, 0.025) }}>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: TEAL, mb: 0.875 }}>
                    Savings goal — when will I reach…
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.875 }}>
                    <Box sx={{ position: 'relative', flex: 1 }}>
                        <Typography sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: SLATE, fontSize: '0.82rem', pointerEvents: 'none' }}>$</Typography>
                        <Box
                            component="input"
                            type="text"
                            value={savTarget}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSavTarget(e.target.value)}
                            placeholder="e.g. 3000"
                            sx={{
                                width: '100%', border: `1px solid ${alpha(TEAL, 0.25)}`, borderRadius: '6px',
                                pl: 2.5, pr: 1, py: 0.625, fontSize: '0.82rem', color: NAVY,
                                fontFamily: 'inherit', boxSizing: 'border-box', bgcolor: '#fff',
                                '&:focus': { outline: `1.5px solid ${TEAL}`, outlineOffset: '1px' },
                            }}
                        />
                    </Box>
                    {savResult && (
                        <Box sx={{ px: 1, py: '4px', borderRadius: '6px', bgcolor: alpha(TEAL, 0.1), border: `0.5px solid ${alpha(TEAL, 0.3)}`, flexShrink: 0 }}>
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: TEAL, whiteSpace: 'nowrap' }}>
                                By {savResult.label}
                            </Typography>
                        </Box>
                    )}
                    {!isNaN(savTargetNum) && savTargetNum > 0 && !savResult && (
                        <Box sx={{ px: 1, py: '4px', borderRadius: '6px', bgcolor: alpha(AMBER, 0.1), border: `0.5px solid ${alpha(AMBER, 0.3)}`, flexShrink: 0 }}>
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: AMBER, whiteSpace: 'nowrap' }}>
                                Beyond forecast
                            </Typography>
                        </Box>
                    )}
                </Box>
                {savResult && !isNaN(savTargetNum) && (
                    <>
                        <Box sx={{ height: 4, borderRadius: 2, bgcolor: alpha('#000', 0.07), mb: 0.5, overflow: 'hidden' }}>
                            <Box sx={{
                                height: '100%', borderRadius: 2, bgcolor: TEAL, transition: 'width .4s',
                                width: `${clamp(Math.round((d.endSav / savTargetNum) * 100), 0, 100)}%`,
                            }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.68rem', color: SLATE }}>
                            Cumulative savings {fmt(d.endSav)} of {fmt(savTargetNum)} target
                            {' · '}{clamp(Math.round((d.endSav / savTargetNum) * 100), 0, 100)}% there
                        </Typography>
                    </>
                )}
                {!isNaN(savTargetNum) && savTargetNum > 0 && d.endSav >= savTargetNum && (
                    <Typography sx={{ fontSize: '0.75rem', color: TEAL, fontWeight: 600, mt: 0.5 }}>
                        ✓ Already met — cumulative savings exceed target
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

// ── All-category overview table ───────────────────────────────────────────────
const AllCategoriesTable: React.FC<{
    template:        SpreadsheetTemplate;
    d:               DerivedData;
    focus:           SheetFocus;
    onSelectCategory: (label: string) => void;
}> = ({ template, d, focus, onSelectCategory }) => {
    const expRows     = template.rows.filter(r => r.rowType === 'expense');
    const shownPeriods = focus === 'historical'
        ? template.periods.map((_, i) => i).filter(i => periodType(template, i) !== 'future')
        : template.periods.map((_, i) => i).filter(i => periodType(template, i) !== 'past');

    return (
        <Box sx={{ mb: 2, overflow: 'hidden', borderRadius: '10px', border: `1px solid ${alpha('#000', 0.1)}` }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '110px 1fr 68px 24px', bgcolor: '#f7f6f5', borderBottom: `1px solid ${alpha('#000', 0.08)}`, px: 1.5, py: 0.75 }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Category</Typography>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center' }}>
                    {focus === 'historical' ? 'Trend' : 'Projection'}
                </Typography>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>
                    {focus === 'historical' ? 'Avg' : 'Pred'}
                </Typography>
                <Box /> {/* arrow col */}
            </Box>

            {expRows.map((row, ri) => {
                const color    = CAT_COLORS[row.label] ?? SLATE;
                const vals     = shownPeriods.map(i => row.values[i] ?? null);
                const trend    = trendDir(row.values);
                const pv       = row.values.map((v, i) => ({ v, i })).filter(({ v, i }) => v !== null && v > 0 && isPast(template, i)).map(({ v }) => v as number);
                const avg      = pv.length ? Math.round(pv.reduce((a, b) => a + b, 0) / pv.length) : null;
                const pred     = d.catPredictions.find(c => c.label === row.label);
                const displayVal = focus === 'historical' ? (avg !== null ? fmt(avg) : '—') : (pred ? fmt(pred.weighted) : '—');
                const trendColor = trend === 'up' ? RED : trend === 'down' ? GREEN : SLATE;
                const trendIcon  = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

                // Mini sparkline values
                const sparkPts = vals.filter((v): v is number => v !== null);
                const sparkMin = sparkPts.length ? Math.min(...sparkPts) : 0;
                const sparkMax = sparkPts.length ? Math.max(...sparkPts) : 1;
                const sparkRange = sparkMax - sparkMin || 1;
                const sparkW = 72; const sparkH = 24;
                const sparkPath = vals
                    .map((v, idx) => v !== null
                        ? `${idx === 0 || vals.slice(0, idx).every(x => x === null) ? 'M' : 'L'} ${((idx / Math.max(vals.length - 1, 1)) * (sparkW - 4) + 2).toFixed(1)},${((1 - (v - sparkMin) / sparkRange) * (sparkH - 4) + 2).toFixed(1)}`
                        : null)
                    .filter(Boolean).join(' ');

                return (
                    <Box key={row.label}
                         onClick={() => onSelectCategory(row.label)}
                         sx={{
                             display: 'grid', gridTemplateColumns: '110px 1fr 68px 24px',
                             px: 1.5, py: 0.75,
                             borderBottom: ri < expRows.length - 1 ? `0.5px solid ${alpha('#000', 0.05)}` : 'none',
                             cursor: 'pointer',
                             '&:hover': { bgcolor: alpha(color, 0.04) },
                             transition: 'background .1s',
                         }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625, minWidth: 0 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.75rem', color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.label}</Typography>
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: trendColor, flexShrink: 0 }}>{trendIcon}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {sparkPath && (
                                <svg width={sparkW} height={sparkH} style={{ display: 'block' }}>
                                    <path d={sparkPath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>{displayVal}</Typography>
                            {focus === 'future' && pred && (
                                <Typography sx={{ fontSize: '0.6rem', color: pred.conf >= 80 ? GREEN : pred.conf >= 60 ? AMBER : RED }}>{pred.conf}%</Typography>
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: alpha(SLATE, 0.4), fontSize: '0.7rem' }}>›</Box>
                    </Box>
                );
            })}
        </Box>
    );
};

// ── Budget optimizer (unchanged from original) ────────────────────────────────
const BudgetOptimizer: React.FC<{
    template:             SpreadsheetTemplate;
    d:                    DerivedData;
    optimizeMode:         OptimizeMode;
    onOptimizeModeChange: (m: OptimizeMode) => void;
}> = ({ template, d, optimizeMode, onOptimizeModeChange }) => {
    const expRows = template.rows.filter(r => r.rowType === 'expense');

    const autoSuggestions = useMemo(() => {
        return expRows.map(row => {
            const pv = row.values.map((v, i) => ({ v, i })).filter(({ v, i }) => v !== null && v > 0 && isPast(template, i)).map(({ v }) => v as number);
            if (pv.length < 2) return null;
            const avg = Math.round(pv.reduce((a, b) => a + b, 0) / pv.length);
            const trend = trendDir(row.values);
            const suggestedCut = trend === 'up' ? Math.round(avg * 0.9) : null;
            return suggestedCut !== null ? { label: row.label, current: avg, suggested: suggestedCut, savings: avg - suggestedCut } : null;
        }).filter((x): x is NonNullable<typeof x> => x !== null).sort((a, b) => b.savings - a.savings).slice(0, 4);
    }, [expRows, template]);

    const totalAutoSavings = autoSuggestions.reduce((s, x) => s + x.savings, 0);

    return (
        <Box sx={{ borderRadius: '10px', border: `1px solid ${alpha(MAROON, 0.18)}`, overflow: 'hidden' }}>
            <Box sx={{ background: `linear-gradient(90deg, ${alpha(MAROON, 0.06)} 0%, transparent 100%)`, px: 1.5, py: 1, borderBottom: `0.5px solid ${alpha(MAROON, 0.1)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875 }}>
                    <AutoFixHighIcon sx={{ fontSize: '0.95rem', color: MAROON }} />
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: MAROON }}>Budget optimizer</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: `1px solid ${alpha('#000', 0.13)}`, borderRadius: '6px', overflow: 'hidden' }}>
                    {(['auto', 'manual'] as OptimizeMode[]).map(key => (
                        <Box key={key} onClick={() => onOptimizeModeChange(key)} sx={{
                            px: 1.125, py: 0.35, fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', userSelect: 'none',
                            bgcolor: optimizeMode === key ? MAROON : '#fff', color: optimizeMode === key ? '#fff' : SLATE,
                            borderRight: key === 'auto' ? `1px solid ${alpha('#000', 0.1)}` : 'none', transition: 'all .12s',
                            '&:hover': optimizeMode !== key ? { bgcolor: alpha(MAROON, 0.06), color: MAROON } : {},
                        }}>{key === 'auto' ? 'Auto' : 'Manual'}</Box>
                    ))}
                </Box>
            </Box>
            {optimizeMode === 'auto' && (
                <Box sx={{ px: 1.5, py: 1.25 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: SLATE }}>Suggested cuts based on upward trends</Typography>
                        {totalAutoSavings > 0 && (
                            <Box sx={{ px: 0.875, py: '2px', borderRadius: '10px', bgcolor: alpha(GREEN, 0.1), border: `0.5px solid ${alpha(GREEN, 0.25)}` }}>
                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: GREEN }}>+{fmt(totalAutoSavings)}/period</Typography>
                            </Box>
                        )}
                    </Box>
                    {autoSuggestions.length === 0 ? (
                        <Box sx={{ py: 1.5, textAlign: 'center' }}>
                            <Typography sx={{ fontSize: '0.75rem', color: SLATE }}>No optimization needed — spending stable</Typography>
                        </Box>
                    ) : autoSuggestions.map(s => {
                        const savePct = Math.round((s.savings / s.current) * 100);
                        return (
                            <Box key={s.label} sx={{ mb: 1, pb: 1, borderBottom: `0.5px solid ${alpha('#000', 0.06)}`, '&:last-child': { mb: 0, pb: 0, borderBottom: 'none' } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625 }}>
                                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: CAT_COLORS[s.label] ?? SLATE, flexShrink: 0 }} />
                                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: NAVY }}>{s.label}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625 }}>
                                        <Typography sx={{ fontSize: '0.72rem', color: alpha(SLATE, 0.6), textDecoration: 'line-through', fontVariantNumeric: 'tabular-nums' }}>{fmt(s.current)}</Typography>
                                        <Typography sx={{ fontSize: '0.6rem', color: SLATE }}>→</Typography>
                                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: GREEN, fontVariantNumeric: 'tabular-nums' }}>{fmt(s.suggested)}</Typography>
                                        <Box sx={{ px: 0.5, py: '1px', borderRadius: '4px', bgcolor: alpha(GREEN, 0.1) }}>
                                            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: GREEN }}>−{savePct}%</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Box sx={{ position: 'relative', height: 4, bgcolor: alpha('#000', 0.07), borderRadius: '3px', overflow: 'hidden' }}>
                                    <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.round((s.suggested / s.current) * 100)}%`, bgcolor: GREEN, borderRadius: '3px' }} />
                                </Box>
                                <Typography sx={{ fontSize: '0.65rem', color: alpha(SLATE, 0.65), mt: 0.25 }}>Trending up · reduce by {fmt(s.savings)}/period</Typography>
                            </Box>
                        );
                    })}
                </Box>
            )}
            {optimizeMode === 'manual' && (
                <Box sx={{ px: 1.5, py: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <AutoFixHighIcon sx={{ fontSize: '1.25rem', color: alpha(MAROON, 0.4) }} />
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>Manual optimization</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: SLATE, textAlign: 'center', maxWidth: 220, lineHeight: 1.5 }}>
                        Set custom targets per category and simulate the effect on your end balance.
                    </Typography>
                    <Box sx={{ px: 1.5, py: 0.5, borderRadius: '20px', bgcolor: alpha(AMBER, 0.1), border: `1px solid ${alpha(AMBER, 0.25)}` }}>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: AMBER }}>Coming soon</Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ── SpreadsheetMode (main export) ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
type SheetTab = 'trends' | 'trajectories' | 'optimize';

const SpreadsheetMode: React.FC<{
    template:             SpreadsheetTemplate;
    d:                    DerivedData;
    focus:                SheetFocus;
    onFocusChange:        (f: SheetFocus) => void;
    optimizeMode:         OptimizeMode;
    onOptimizeModeChange: (m: OptimizeMode) => void;
}> = ({ template, d, focus, onFocusChange, optimizeMode, onOptimizeModeChange }) => {

    const [tab,              setTab]             = useState<SheetTab>('trends');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const expRows = template.rows.filter(r => r.rowType === 'expense');

    // Tab strip
    const tabs: { key: SheetTab; label: string }[] = [
        { key: 'trends',       label: 'Category trends' },
        { key: 'trajectories', label: 'Balance & savings' },
        { key: 'optimize',     label: 'Optimizer' },
    ];

    return (
        <Box>
            {/* ── Top tab strip ── */}
            <Box sx={{ display: 'flex', gap: '4px', mb: 2 }}>
                {tabs.map(t => (
                    <Box key={t.key} onClick={() => { setTab(t.key); setSelectedCategory(null); }} sx={{
                        flex: 1, py: '6px', textAlign: 'center', fontSize: '0.68rem', fontWeight: 700,
                        cursor: 'pointer', borderRadius: '7px', transition: 'all .12s', userSelect: 'none',
                        border: `1px solid ${tab === t.key ? alpha(MAROON, 0.35) : alpha('#000', 0.1)}`,
                        bgcolor: tab === t.key ? alpha(MAROON, 0.07) : 'transparent',
                        color:   tab === t.key ? MAROON : SLATE,
                        '&:hover': tab !== t.key ? { bgcolor: alpha(MAROON, 0.03) } : {},
                    }}>{t.label}</Box>
                ))}
            </Box>

            {/* ══ TRENDS TAB ══════════════════════════════════════════════════ */}
            {tab === 'trends' && (
                <Box>
                    {/* Category is selected → drill-down */}
                    {selectedCategory ? (
                        <CategoryDetail
                            template={template}
                            d={d}
                            label={selectedCategory}
                            onBack={() => setSelectedCategory(null)}
                        />
                    ) : (
                        <>
                            {/* Historical / Future toggle */}
                            <Box sx={{ display: 'flex', gap: '5px', mb: 1.5 }}>
                                {([['historical', 'Historical trends'], ['future', 'Future projections']] as [SheetFocus, string][]).map(([key, label]) => (
                                    <Box key={key} onClick={() => onFocusChange(key)} sx={{
                                        flex: 1, py: '6px', textAlign: 'center', fontSize: '0.71rem', fontWeight: 700,
                                        cursor: 'pointer', borderRadius: '7px', transition: 'all .12s', userSelect: 'none',
                                        border: `1px solid ${focus === key ? alpha(MAROON, 0.35) : alpha('#000', 0.1)}`,
                                        bgcolor: focus === key ? alpha(MAROON, 0.07) : 'transparent',
                                        color:   focus === key ? MAROON : SLATE,
                                        '&:hover': focus !== key ? { bgcolor: alpha(MAROON, 0.04) } : {},
                                    }}>{label}</Box>
                                ))}
                            </Box>

                            <Typography sx={{ fontSize: '0.68rem', color: alpha(SLATE, 0.7), mb: 1, fontStyle: 'italic' }}>
                                Click a category row to see its detailed trend chart
                            </Typography>

                            <AllCategoriesTable
                                template={template}
                                d={d}
                                focus={focus}
                                onSelectCategory={setSelectedCategory}
                            />

                            {/* Budget impact summary */}
                            <Box sx={{ borderRadius: '10px', border: `1px solid ${alpha('#000', 0.1)}`, overflow: 'hidden' }}>
                                <Box sx={{ px: 1.5, py: 0.875, bgcolor: '#f7f6f5', borderBottom: `0.5px solid ${alpha('#000', 0.08)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Budget impact</Typography>
                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: d.endBal >= d.predEndBal ? GREEN : RED, fontVariantNumeric: 'tabular-nums' }}>
                                        {d.endBal >= d.predEndBal ? '+' : ''}{fmt(d.endBal - d.predEndBal)} vs baseline
                                    </Typography>
                                </Box>
                                <Box sx={{ px: 1.5, py: 1 }}>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0.75, mb: 1 }}>
                                        {[
                                            { label: 'End balance',    val: fmt(d.endBal),    color: d.endBal >= 0 ? GREEN : RED },
                                            { label: 'Baseline pred.', val: fmt(d.predEndBal), color: NAVY },
                                            { label: 'Savings rate',   val: `${d.savRate}%`,  color: d.savRate >= 10 ? GREEN : AMBER },
                                        ].map((k, i) => (
                                            <Box key={i} sx={{ textAlign: 'center', p: '5px 4px', borderRadius: '6px', bgcolor: alpha('#000', 0.02), border: `0.5px solid ${alpha('#000', 0.07)}` }}>
                                                <Typography sx={{ fontSize: '0.58rem', color: SLATE, mb: 0.2 }}>{k.label}</Typography>
                                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: k.color, fontVariantNumeric: 'tabular-nums' }}>{k.val}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                    {d.catFlags.slice(0, 3).map(f => {
                                        const over = f.pct > 0;
                                        const col  = Math.abs(f.pct) > 40 ? RED : AMBER;
                                        return (
                                            <Box key={f.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.875, py: 0.5, borderBottom: `0.5px solid ${alpha('#000', 0.05)}` }}>
                                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: CAT_COLORS[f.label] ?? SLATE, flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.72rem', flex: 1, color: NAVY }}>{f.label}</Typography>
                                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: over ? col : GREEN }}>
                                                    {over ? '+' : ''}{f.pct}%
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.68rem', color: SLATE, fontVariantNumeric: 'tabular-nums' }}>
                                                    {over ? '−' : '+'}{fmt(Math.abs(f.entered - f.avg))}
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                    {d.catFlags.length === 0 && (
                                        <Typography sx={{ fontSize: '0.72rem', color: SLATE, textAlign: 'center', py: 0.5 }}>
                                            No significant deviations — budget on track
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </>
                    )}
                </Box>
            )}

            {/* ══ TRAJECTORIES TAB ════════════════════════════════════════════ */}
            {tab === 'trajectories' && (
                <TrajectoryAndGoals template={template} d={d} />
            )}

            {/* ══ OPTIMIZER TAB ═══════════════════════════════════════════════ */}
            {tab === 'optimize' && (
                <BudgetOptimizer
                    template={template}
                    d={d}
                    optimizeMode={optimizeMode}
                    onOptimizeModeChange={onOptimizeModeChange}
                />
            )}
        </Box>
    );
};

export default SpreadsheetMode;