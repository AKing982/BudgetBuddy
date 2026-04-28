// ── ClassicSpreadsheet.tsx ────────────────────────────────────────────────────
// Concept A: future period cells show a stacked two-line display —
//   top line:    planned amount  (blue P badge) — always shown
//   bottom line: actual amount   (green/red A badge) — shown ONLY when:
//                  (a) the backend has provided a non-null actual, AND
//                  (b) the period starts within 14 days (current or imminent)
//
// Actuals are NEVER user-editable here — they come exclusively from the backend
// via the `plannedValues` prop (planned) and `row.values` (actual when synced).
// Past / present cells are unchanged.
import React, { useMemo, useState, useRef } from 'react';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Collapse, Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';

import {
    MAROON, NAVY, SLATE, GREEN, RED, TEAL, fmt, fmtS,
    GROUP_ORDER, CAT_PCTS,
} from '../domain/SpreadsheetTypes';
import type { SpreadsheetTemplate, SpreadsheetRow, PeriodFilter } from '../domain/SpreadsheetTypes';
import { PeriodPills } from './SharedBudgetUI';

// ── Local tokens ──────────────────────────────────────────────────────────────
const AMBER        = '#d97706';
const MAROON_DARK  = '#4a1010';
const HEAT_GREEN   = 'rgba(5,150,105,0.09)';
const HEAT_RED     = 'rgba(226,75,74,0.08)';
const HEAT_TEXT_G  = '#059669';
const HEAT_TEXT_R  = '#c0392b';

// Future cell colours
const PLAN_BG    = '#E6F1FB';          // blue-50
const PLAN_COLOR = '#0C447C';          // blue-800
const ACT_BG_OK  = '#EAF3DE';         // green-50 — actual ≤ planned
const ACT_BG_OVR = '#FCEBEB';         // red-50   — actual > planned
const ACT_OK     = '#27500A';          // green-800
const ACT_OVR    = '#A32D2D';          // red-800

const CATEGORY_GROUPS: Record<string, string> = {
    Rent: 'Housing', Utilities: 'Housing', Electric: 'Housing', 'Gas Bill': 'Housing',
    Groceries: 'Food', 'Order out': 'Food', 'Coffee Supplies': 'Food',
    Gas: 'Transportation',
    Golf: 'Entertainment', Subscriptions: 'Entertainment', 'Trip Cost': 'Entertainment', Haircut: 'Entertainment',
    Insurance: 'Other', 'Phone Insurance': 'Other', Payments: 'Other', 'Other Stuff': 'Other', Savings: 'Other',
};
const CAT_COLORS: Record<string, string> = {
    Housing:       '#1D9E75',
    Food:          '#6b1a1a',
    Transportation:'#BA7517',
    Entertainment: '#378ADD',
    Other:         '#D4537E',
};
const HEAT_THRESHOLD = 0.12;
const SPARK_PERIODS  = 6;

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtC = (n: number | null | undefined): string => {
    if (n === null || n === undefined) return '—';
    return (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString();
};

function rowAvg(values: (number | null)[]): number {
    const valid = values.filter((v): v is number => v !== null && v > 0);
    return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
}

function isPeriodFuture(template: SpreadsheetTemplate, pi: number): boolean {
    const pd = (template as any).periodDates?.[pi];
    return pd ? (pd.start as Date) > new Date() : false;
}

// True when a future period's actual row should be shown:
// the period must have started OR started within the last 14 days,
// AND the backend has provided a non-null actual value.
function isInActualWindow(template: SpreadsheetTemplate, pi: number): boolean {
    const pd = (template as any).periodDates?.[pi];
    if (!pd) return false;
    const now        = new Date();
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
    // Period has started (current or just-started future) or started ≤14 days from now
    return (pd.start as Date) <= new Date(now.getTime() + twoWeeksMs);
}

function filterByPeriod(t: SpreadsheetTemplate, pf: PeriodFilter): SpreadsheetTemplate {
    if (pf !== 'Monthly') return t;
    const newPeriods = t.months.map(m => m.name);
    const newMonths  = t.months.map((m, mi) => ({ name: m.name, cols: [mi] }));
    const newRows: SpreadsheetRow[] = t.rows.map(row => ({
        ...row,
        values: t.months.map(m => {
            if (row.rowType === 'expenses' || row.rowType === 'balance') return null;
            const sum = m.cols.reduce((a, ci) => a + (row.values[ci] ?? 0), 0);
            return sum === 0 && m.cols.every(ci => row.values[ci] === null) ? null : sum;
        }),
    }));
    const expIdx = newRows.findIndex(r => r.rowType === 'expenses');
    const balIdx = newRows.findIndex(r => r.rowType === 'balance');
    const salIdx = newRows.findIndex(r => r.rowType === 'salary');
    if (expIdx >= 0) {
        const er = newRows.filter(r => r.rowType === 'expense');
        newRows[expIdx] = { ...newRows[expIdx], values: newRows[expIdx].values.map((_, ci) => er.reduce((s, r) => s + (r.values[ci] ?? 0), 0)) };
    }
    if (balIdx >= 0 && salIdx >= 0) {
        let run = 0;
        newRows[balIdx] = { ...newRows[balIdx], values: newRows[balIdx].values.map((_, ci) => {
                const s = newRows[salIdx].values[ci] ?? 0;
                const e = expIdx >= 0 ? newRows[expIdx].values[ci] ?? 0 : 0;
                run = run + s - e;
                return run;
            })};
    }
    return { ...t, periods: newPeriods, months: newMonths, rows: newRows };
}

// ── A: Sparkline ──────────────────────────────────────────────────────────────
const SparkLine: React.FC<{ values: (number | null)[]; color: string }> = ({ values, color }) => {
    const recent = values
        .map((v, i) => ({ v, i }))
        .filter(x => x.v !== null && x.v > 0)
        .slice(-SPARK_PERIODS)
        .map(x => x.v as number);
    if (recent.length < 2) return null;
    const W = 40, H = 14;
    const mn = Math.min(...recent), mx = Math.max(...recent), rng = mx - mn || 1;
    const pts = recent.map((v, i) => {
        const x = Math.round((i / (recent.length - 1)) * W);
        const y = Math.round(H - (((v - mn) / rng) * (H - 3) + 1.5));
        return `${x},${y}`;
    }).join(' ');
    const trend = recent[recent.length - 1] > recent[recent.length - 2] ? 'up'
        : recent[recent.length - 1] < recent[recent.length - 2] ? 'down' : 'flat';
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.375, ml: 'auto', flexShrink: 0 }}>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
                <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {trend === 'up'   && <TrendingUp   size={10} color={RED}   style={{ flexShrink: 0 }} />}
            {trend === 'down' && <TrendingDown  size={10} color={GREEN} style={{ flexShrink: 0 }} />}
            {trend === 'flat' && <Minus         size={10} color={SLATE} style={{ flexShrink: 0 }} />}
        </Box>
    );
};

const AvgChip: React.FC<{ avg: number }> = ({ avg }) => (
    <Box sx={{ fontSize: '0.6rem', color: SLATE, px: 0.625, py: 0.1, borderRadius: '3px', bgcolor: alpha('#000', 0.05), whiteSpace: 'nowrap', flexShrink: 0, ml: 0.25 }}>
        avg ${fmtS(avg)}
    </Box>
);

// ── Concept A: FutureCell ─────────────────────────────────────────────────────
// Planned is always shown (top line, blue P badge).
// Actual is shown ONLY when:
//   (a) the backend has provided a non-null actual value, AND
//   (b) the period has started (is current) or started within the last 14 days.
// The actual is never user-editable here — it comes exclusively from the server.
const FutureCell: React.FC<{
    planned:    number | null;
    actual:     number | null;
    showActual: boolean;
    rowType:    SpreadsheetRow['rowType'];
}> = ({ planned, actual, showActual, rowType }) => {
    const hasActual = showActual && actual !== null;
    const over      = hasActual && planned !== null && actual! > planned;
    const actColor  = over ? ACT_OVR : ACT_OK;
    const actBg     = over ? ACT_BG_OVR : ACT_BG_OK;

    // No actual from server — render exactly like a normal past/present cell
    if (!hasActual) {
        return (
            <Typography sx={{ fontSize: rowType === 'expenses' || rowType === 'salary' ? '0.8rem' : '0.79rem', fontWeight: rowType === 'expenses' || rowType === 'salary' ? 600 : 400, color: PLAN_COLOR, fontVariantNumeric: 'tabular-nums', textAlign: 'right', display: 'block' }}>
                {planned !== null ? `$${fmt(planned)}` : ''}
            </Typography>
        );
    }

    // Actual exists — show stacked P / A
    return (
        <Box sx={{ textAlign: 'right', minWidth: 78 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mb: '3px' }}>
                <Box sx={{ fontSize: '0.6rem', fontWeight: 700, px: '4px', py: '1px', borderRadius: '3px', bgcolor: PLAN_BG, color: PLAN_COLOR, letterSpacing: '0.04em', flexShrink: 0 }}>P</Box>
                <Typography sx={{ fontSize: '0.79rem', color: PLAN_COLOR, fontVariantNumeric: 'tabular-nums' }}>
                    {planned !== null ? `$${fmt(planned)}` : '—'}
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                <Box sx={{ fontSize: '0.6rem', fontWeight: 700, px: '4px', py: '1px', borderRadius: '3px', bgcolor: actBg, color: actColor, letterSpacing: '0.04em', flexShrink: 0 }}>A</Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Typography sx={{ fontSize: '0.79rem', color: actColor, fontVariantNumeric: 'tabular-nums', fontWeight: over ? 600 : 400 }}>
                        ${fmt(actual!)}
                    </Typography>
                    {over && <Typography sx={{ fontSize: '0.62rem', color: ACT_OVR, fontWeight: 700 }}>▲</Typography>}
                </Box>
            </Box>
        </Box>
    );
};

// ── Insight drawer (unchanged) ────────────────────────────────────────────────
interface Signal { label: string; msg: string; type: 'over' | 'jump' | 'streak-good'; }

function deriveSignals(template: SpreadsheetTemplate, filtered: SpreadsheetTemplate): Signal[] {
    const signals: Signal[] = [];
    const expenseRows = filtered.rows.filter(r => r.rowType === 'expense');
    expenseRows.forEach(row => {
        const vals = row.values.filter((v): v is number => v !== null && v > 0);
        if (vals.length < 2) return;
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        const cap = avg * 1.15;
        const last = vals[vals.length - 1];
        const prev = vals[vals.length - 2];
        if (last > cap && cap > 0) signals.push({ label: row.label, msg: `is $${Math.round(last - cap)} over its avg+15% cap of $${Math.round(cap)}.`, type: 'over' });
        else if (last > prev * 1.4 && prev > 50) signals.push({ label: row.label, msg: `jumped ${Math.round(((last - prev) / prev) * 100)}% vs last period ($${Math.round(prev)} → $${Math.round(last)}).`, type: 'jump' });
    });
    expenseRows.forEach(row => {
        const nonNull = row.values.map((v, i) => ({ v, i })).filter(x => x.v !== null && x.v > 0).slice(-4);
        if (nonNull.length < 3) return;
        const a = rowAvg(row.values);
        const streak = nonNull.filter(x => (x.v as number) < a * 0.9).length;
        if (streak >= 3 && !signals.find(s => s.label === row.label))
            signals.push({ label: row.label, msg: `has been under avg for ${streak} consecutive periods.`, type: 'streak-good' });
    });
    return signals.slice(0, 4);
}

const GroupBreakdown: React.FC<{ filtered: SpreadsheetTemplate }> = ({ filtered }) => {
    const totals: Record<string, number> = {};
    GROUP_ORDER.forEach(g => { totals[g] = 0; });
    filtered.rows.filter(r => r.rowType === 'expense').forEach(row => {
        const grp = CATEGORY_GROUPS?.[row.label] ?? 'Other';
        if (!(grp in totals)) totals[grp] = 0;
        totals[grp] += row.values.reduce((a: number, v) => a + (v ?? 0), 0);
    });
    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
    const GROUP_COLORS: Record<string, string> = { Housing:'#1D9E75', Food:'#6b1a1a', Transportation:'#BA7517', Entertainment:'#378ADD', Other:'#D4537E' };
    return (
        <Box>
            {GROUP_ORDER.map(grp => {
                const val = totals[grp] ?? 0;
                const pct = Math.round((val / grandTotal) * 100);
                const color = GROUP_COLORS[grp] ?? SLATE;
                return (
                    <Box key={grp} sx={{ display: 'flex', alignItems: 'center', gap: 0.875, mb: 0.875 }}>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 500, color: NAVY, minWidth: 88, flexShrink: 0 }}>{grp}</Typography>
                        <Box sx={{ flex: 1, height: 5, bgcolor: alpha('#000', 0.07), borderRadius: '3px', overflow: 'hidden' }}>
                            <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: color, borderRadius: '3px', transition: 'width .3s' }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.7rem', color: SLATE, minWidth: 28, textAlign: 'right', flexShrink: 0 }}>{pct}%</Typography>
                    </Box>
                );
            })}
        </Box>
    );
};

const SavingsGauge: React.FC<{ filtered: SpreadsheetTemplate }> = ({ filtered }) => {
    const salRow   = filtered.rows.find(r => r.rowType === 'salary');
    const expRow   = filtered.rows.find(r => r.rowType === 'expenses');
    const totalInc = salRow?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
    const totalExp = expRow?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
    const netSaved = totalInc - totalExp;
    const rate     = totalInc > 0 ? (netSaved / totalInc) * 100 : 0;
    const goalPct  = 20;
    const R = 42, C = Math.PI * R;
    const fill = Math.max(0, Math.min(rate, 100));
    const dash = (fill / 100) * C;
    const rateColor = rate >= goalPct ? GREEN : rate >= goalPct * 0.6 ? AMBER : RED;
    const cutNeeded = totalInc > 0 && rate < goalPct ? Math.round(((goalPct / 100) * totalInc - netSaved) / (filtered.periods.length || 1)) : 0;
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <svg width={110} height={64} viewBox="0 0 110 64">
                <path d={`M10,58 A${R},${R} 0 0 1 100,58`} fill="none" stroke={alpha('#000', 0.07)} strokeWidth="9" strokeLinecap="round" />
                <path d={`M10,58 A${R},${R} 0 0 1 100,58`} fill="none" stroke={alpha(GREEN, 0.25)} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${C}`} strokeDashoffset={C - (goalPct / 100) * C} />
                <path d={`M10,58 A${R},${R} 0 0 1 100,58`} fill="none" stroke={rateColor} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${C}`} strokeDashoffset={C - dash} />
                <text x="55" y="54" textAnchor="middle" fontSize="16" fontWeight="700" fill={rateColor}>{rate >= 0 ? '+' : ''}{rate.toFixed(1)}%</text>
            </svg>
            <Typography sx={{ fontSize: '0.67rem', color: SLATE, textAlign: 'center', lineHeight: 1.4 }}>of income saved · goal: {goalPct}%</Typography>
            <Typography sx={{ fontSize: '0.67rem', fontWeight: 600, color: GREEN, textAlign: 'center' }}>{fmtC(netSaved)} net saved</Typography>
            {cutNeeded > 0 && <Typography sx={{ fontSize: '0.63rem', color: SLATE, textAlign: 'center', mt: 0.25, lineHeight: 1.4 }}>Cut ~<strong style={{ color: NAVY }}>${fmtS(cutNeeded)}/period</strong> to reach 20%</Typography>}
        </Box>
    );
};

const InsightDrawer: React.FC<{ template: SpreadsheetTemplate; filtered: SpreadsheetTemplate }> = ({ template, filtered }) => {
    const [open, setOpen] = useState(false);
    const signals = useMemo(() => deriveSignals(template, filtered), [template, filtered]);
    const signalBg:    Record<Signal['type'], string> = { over: alpha(RED, 0.1), jump: alpha(AMBER, 0.1), 'streak-good': alpha(GREEN, 0.1) };
    const signalColor: Record<Signal['type'], string> = { over: RED, jump: AMBER, 'streak-good': GREEN };
    const signalIcon:  Record<Signal['type'], string> = { over: '▲', jump: '~', 'streak-good': '✓' };
    return (
        <Box sx={{ borderTop: `0.5px solid ${alpha(MAROON, 0.12)}` }}>
            <Box onClick={() => setOpen(v => !v)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.75, py: 1, cursor: 'pointer', bgcolor: open ? alpha(MAROON, 0.03) : '#fff', borderTop: `0.5px solid ${alpha(MAROON, 0.08)}`, '&:hover': { bgcolor: alpha(MAROON, 0.025) }, transition: 'background .12s', userSelect: 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875 }}>
                    <Box sx={{ width: 20, height: 20, borderRadius: '5px', bgcolor: alpha(MAROON, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4.75" stroke={MAROON} strokeWidth="1.1"/><line x1="5.5" y1="4" x2="5.5" y2="7.5" stroke={MAROON} strokeWidth="1.1" strokeLinecap="round"/><circle cx="5.5" cy="2.8" r=".55" fill={MAROON}/></svg>
                    </Box>
                    <Typography sx={{ fontSize: '0.77rem', fontWeight: 600, color: MAROON }}>Insights</Typography>
                    {signals.length > 0 && <Box sx={{ fontSize: '0.62rem', fontWeight: 700, px: 0.625, py: 0.1, borderRadius: '10px', bgcolor: alpha(RED, 0.1), color: RED }}>{signals.filter(s => s.type === 'over' || s.type === 'jump').length} signals</Box>}
                    <Typography sx={{ fontSize: '0.7rem', color: SLATE }}>— spending patterns, group breakdown, savings rate</Typography>
                </Box>
                <Box sx={{ color: SLATE, display: 'flex', alignItems: 'center' }}>{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</Box>
            </Box>
            <Collapse in={open}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px', gap: 2, px: 2, py: 2, bgcolor: '#f9fafb', borderTop: `0.5px solid ${alpha('#000', 0.06)}` }}>
                    <Box>
                        <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Spending signals</Typography>
                        {signals.length === 0 ? <Typography sx={{ fontSize: '0.73rem', color: SLATE }}>No anomalies detected.</Typography>
                            : signals.map((s, i) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, p: 0.875, mb: 0.75, bgcolor: '#fff', border: `0.5px solid ${alpha('#000', 0.08)}`, borderRadius: '7px', '&:last-child': { mb: 0 } }}>
                                    <Box sx={{ width: 20, height: 20, borderRadius: '4px', bgcolor: signalBg[s.type], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.1, fontSize: '0.65rem', fontWeight: 700, color: signalColor[s.type] }}>{signalIcon[s.type]}</Box>
                                    <Typography sx={{ fontSize: '0.72rem', color: NAVY, lineHeight: 1.45 }}><strong>{s.label}</strong> {s.msg}</Typography>
                                </Box>
                            ))}
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Spending by group</Typography>
                        <GroupBreakdown filtered={filtered} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Savings rate</Typography>
                        <SavingsGauge filtered={filtered} />
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
};

// ── EditCell (past/present — unchanged) ───────────────────────────────────────
const EditCell: React.FC<{ value: number | null; onChange: (v: number | null) => void }> = ({ value, onChange }) => {
    const [active, setActive] = React.useState(false);
    const [local,  setLocal]  = React.useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const activate = () => { setLocal(value === null ? '' : String(value)); setActive(true); setTimeout(() => { inputRef.current?.focus(); inputRef.current?.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length); }, 0); };
    const commit   = () => { const n = parseFloat(local); onChange(local === '' ? null : isNaN(n) ? null : n); setActive(false); };
    if (!active) return <Box onClick={activate} sx={{ cursor: 'cell', textAlign: 'right', px: 0.5, borderRadius: '3px', minWidth: 70, '&:hover': { bgcolor: alpha(MAROON, 0.06) } }}>{value !== null ? `$${fmt(value)}` : ''}</Box>;
    return <Box component="input" ref={inputRef} value={local} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocal(e.target.value)} onBlur={commit} onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === 'Tab') commit(); if (e.key === 'Escape') setActive(false); }} sx={{ width: '100%', minWidth: 70, border: `1.5px solid ${MAROON}`, borderRadius: '3px', px: 0.75, py: 0.25, fontSize: '0.78rem', textAlign: 'right', bgcolor: '#fff', outline: 'none', fontFamily: 'inherit' }} />;
};

// ═════════════════════════════════════════════════════════════════════════════
// ── Main ClassicSpreadsheet ───────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
interface Props {
    template:        SpreadsheetTemplate;
    editMode:        boolean;
    onCellChange:    (rowIndex: number, colIndex: number, value: number | null) => void;
    periodFilter:    PeriodFilter;
    onPeriodFilter:  (p: PeriodFilter) => void;
    // Optional: planned values keyed by row label, parallel to template.periods.
    // When provided, future cells show planned from this map and actual from row.values.
    // When absent, row.values is used as the planned amount for future periods
    // (actual is then derived from row.values only when isInActualWindow is true
    //  and the backend mapping already placed the actual into row.values).
    plannedValues?:  Record<string, (number | null)[]>;
}

const ClassicSpreadsheet: React.FC<Props> = ({
                                                 template, editMode, onCellChange, periodFilter, onPeriodFilter,
                                                 plannedValues,
                                             }) => {
    const t           = useMemo(() => filterByPeriod(template, periodFilter), [template, periodFilter]);
    const { months, periods, rows } = t;

    const isMonthStart = (ci: number) => months.some(m => m.cols[0] === ci);

    const rowAvgMap = useMemo(() => {
        const map: Record<string, number> = {};
        rows.filter(r => r.rowType === 'expense').forEach(r => { map[r.label] = rowAvg(r.values); });
        return map;
    }, [rows]);

    // Planned value for a future cell
    const getPlanned = (row: SpreadsheetRow, ci: number): number | null => {
        if (plannedValues?.[row.label]) return plannedValues[row.label][ci] ?? null;
        return row.values[ci];
    };

    // Actual value for a future cell — comes from backend (row.values when plannedValues
    // is provided, otherwise row.values already holds the display value so we return null
    // since we can't distinguish planned from actual without the separate map).
    const getActual = (row: SpreadsheetRow, ci: number): number | null => {
        if (plannedValues?.[row.label]) return row.values[ci];
        return null; // no separate planned map = can't isolate actual
    };

    const getCellStylePast = (row: SpreadsheetRow, val: number | null, ci: number) => {
        if (row.rowType === 'balance') return { color: (val ?? 0) >= 0 ? GREEN : RED };
        if (row.rowType === 'expenses') {
            const sal = rows.find(r => r.rowType === 'salary')?.values[ci];
            return { color: sal && (val ?? 0) > sal ? RED : NAVY };
        }
        if (row.rowType === 'expense' && val !== null) {
            const avg = rowAvgMap[row.label];
            if (avg > 0) {
                if (val < avg * (1 - HEAT_THRESHOLD)) return { bgcolor: HEAT_GREEN, color: HEAT_TEXT_G };
                if (val > avg * (1 + HEAT_THRESHOLD)) return { bgcolor: HEAT_RED, color: HEAT_TEXT_R, fontWeight: 500 };
            }
        }
        return { color: NAVY };
    };

    const solidBg = (rt: SpreadsheetRow['rowType'], ri: number): string => {
        if (rt === 'salary')   return '#fdf8f8';
        if (rt === 'balance')  return '#f0fdf9';
        if (rt === 'expenses') return '#f9fafb';
        return ri % 2 === 0 ? '#ffffff' : '#fafbfc';
    };

    return (
        <Box>
            {/* Toolbar */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <PeriodPills active={periodFilter} onChange={onPeriodFilter} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexShrink: 0, flexWrap: 'wrap' }}>
                    {/* Heat legend */}
                    {[
                        { bg: HEAT_GREEN, label: 'Under avg', color: HEAT_TEXT_G },
                        { bg: HEAT_RED,   label: 'Over avg',  color: HEAT_TEXT_R },
                    ].map(({ bg, label, color }) => (
                        <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 11, height: 11, borderRadius: '2px', bgcolor: bg, border: `0.5px solid ${alpha(color, 0.3)}`, flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.67rem', color: SLATE }}>{label}</Typography>
                        </Box>
                    ))}
                    {/* Sparkline legend */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <svg width="22" height="10" viewBox="0 0 22 10" style={{ flexShrink: 0 }}>
                            <polyline points="0,9 5,6 10,3 15,7 22,2" fill="none" stroke={MAROON} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <Typography sx={{ fontSize: '0.67rem', color: SLATE }}>Sparkline (last {SPARK_PERIODS})</Typography>
                    </Box>
                </Box>
            </Box>

            {editMode && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5, px: 0.5 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: AMBER, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '0.72rem', color: SLATE }}>Click any past/present expense cell to edit planned amounts</Typography>
                </Box>
            )}

            <Box sx={{ borderRadius: '10px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.14)}`, boxShadow: `0 2px 12px ${alpha(MAROON, 0.06)}` }}>
                <TableContainer sx={{ overflowX: 'auto', isolation: 'isolate' }}>
                    <Table size="small" sx={{ minWidth: 'max-content', borderCollapse: 'separate', borderSpacing: 0, '& .MuiTableCell-root': { border: 'none' } }}>
                        <TableHead>
                            <TableRow>
                                <TableCell rowSpan={2} sx={{
                                    position: 'sticky', left: 0, zIndex: 10, minWidth: 195,
                                    background: '#fdf8f8',
                                    borderRight: `1.5px solid ${alpha(MAROON, 0.2)}`,
                                    borderBottom: `1.5px solid ${alpha(MAROON, 0.15)}`,
                                    boxShadow: `2px 0 8px -2px rgba(0,0,0,0.1)`,
                                    fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase' as const,
                                    letterSpacing: '0.08em', color: MAROON, verticalAlign: 'middle', px: 2,
                                }}>
                                    Category
                                </TableCell>
                                {months.map(m => (
                                    <TableCell key={m.name} colSpan={m.cols.length} align="center" sx={{
                                        fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase' as const,
                                        letterSpacing: '0.07em', color: MAROON, py: 0.875, bgcolor: '#fdf8f8',
                                        borderLeft: `1px solid ${alpha(MAROON, 0.15)}`,
                                        borderBottom: `1px solid ${alpha(MAROON, 0.08)}`,
                                    }}>
                                        {m.name}
                                    </TableCell>
                                ))}
                                <TableCell align="right" sx={{
                                    fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase' as const,
                                    letterSpacing: '0.07em', color: NAVY, py: 0.875, bgcolor: '#f8fafc',
                                    borderLeft: `1.5px solid ${alpha(NAVY, 0.15)}`,
                                    borderBottom: `1px solid ${alpha(NAVY, 0.08)}`, minWidth: 80,
                                }}>
                                    Total
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                {periods.map((p, i) => {
                                    const isFut = isPeriodFuture(t, i);
                                    return (
                                        <TableCell key={i} align="center" sx={{
                                            fontWeight: 500, fontSize: '0.68rem', py: 0.75, minWidth: isFut ? 96 : 84,
                                            color: isFut ? PLAN_COLOR : SLATE,
                                            bgcolor: isFut ? PLAN_BG : '#fdf8f8',
                                            borderLeft: isMonthStart(i) ? `1px solid ${alpha(MAROON, 0.18)}` : `1px solid ${alpha('#000', 0.04)}`,
                                            borderBottom: `1.5px solid ${alpha(MAROON, 0.12)}`,
                                        }}>
                                            <Box>{p}</Box>
                                            {isFut && (
                                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: PLAN_COLOR, mx: 'auto', mt: '2px', opacity: 0.5 }} />
                                            )}
                                        </TableCell>
                                    );
                                })}
                                <TableCell sx={{ bgcolor: '#f8fafc', borderLeft: `1.5px solid ${alpha(NAVY, 0.12)}`, borderBottom: `1.5px solid ${alpha(MAROON, 0.12)}` }} />
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {rows.map((row, ri) => {
                                const rowTotal  = row.values.reduce((a: number, v) => a + (v ?? 0), 0);
                                const isSection = row.rowType === 'salary';
                                const isSummary = row.rowType === 'expenses' || row.rowType === 'balance';
                                const bg        = solidBg(row.rowType, ri);
                                const avg       = rowAvgMap[row.label] ?? 0;
                                const catColor  = CAT_COLORS[CATEGORY_GROUPS[row.label]] ?? SLATE;

                                return (
                                    <TableRow key={row.label} sx={{ '&:hover td': { bgcolor: row.rowType === 'expense' ? alpha(MAROON, 0.02) : undefined }, '&:hover td[data-sticky]': { bgcolor: `${bg} !important` } }}>

                                        {/* Sticky label */}
                                        <TableCell data-sticky="true" sx={{
                                            position: 'sticky', left: 0, zIndex: 8, bgcolor: bg,
                                            borderRight: `1.5px solid ${alpha(MAROON, 0.16)}`,
                                            borderTop: isSection ? `1.5px solid ${alpha(MAROON, 0.15)}` : `1px solid ${alpha('#000', 0.04)}`,
                                            boxShadow: `2px 0 8px -3px rgba(0,0,0,0.1)`,
                                            px: 0, py: 0,
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.75, py: 0.875 }}>
                                                {row.rowType === 'expense' && <Box sx={{ width: 3, height: 13, borderRadius: '1.5px', bgcolor: catColor, flexShrink: 0 }} />}
                                                <Typography sx={{ fontSize: '0.79rem', fontWeight: isSection ? 600 : isSummary ? 600 : 400, color: row.rowType === 'salary' ? MAROON : row.rowType === 'balance' ? '#0f766e' : NAVY, whiteSpace: 'nowrap' }}>
                                                    {row.label}
                                                </Typography>
                                                {row.rowType === 'expense' && avg > 0 && (
                                                    <>
                                                        <SparkLine values={row.values} color={catColor} />
                                                        <AvgChip avg={avg} />
                                                    </>
                                                )}
                                            </Box>
                                        </TableCell>

                                        {/* Value cells */}
                                        {row.values.map((val, ci) => {
                                            const isFut = isPeriodFuture(t, ci);

                                            if (isFut) {
                                                const planned    = getPlanned(row, ci);
                                                const actual     = getActual(row, ci);
                                                const showActual = isInActualWindow(t, ci);
                                                return (
                                                    <TableCell key={ci} sx={{
                                                        bgcolor: PLAN_BG,
                                                        borderLeft: isMonthStart(ci) ? `1px solid ${alpha(MAROON, 0.18)}` : `1px solid ${alpha(PLAN_COLOR, 0.1)}`,
                                                        borderTop: isSection ? `1.5px solid ${alpha(MAROON, 0.15)}` : `1px solid ${alpha(PLAN_COLOR, 0.08)}`,
                                                        p: '5px 8px',
                                                        verticalAlign: 'middle',
                                                    }}>
                                                        <FutureCell
                                                            planned={planned}
                                                            actual={actual}
                                                            showActual={showActual}
                                                            rowType={row.rowType}
                                                        />
                                                    </TableCell>
                                                );
                                            }

                                            // Past / present cell
                                            const cs     = getCellStylePast(row, val, ci);
                                            const canEdit = editMode && row.rowType !== 'balance' && row.rowType !== 'expenses';
                                            return (
                                                <TableCell key={ci} align="right" sx={{
                                                    position: 'relative', zIndex: 0,
                                                    color:      cs.color,
                                                    bgcolor:    canEdit ? alpha('#d97706', 0.04) : (cs as any).bgcolor ?? bg,
                                                    fontWeight: isSummary || isSection ? 600 : (cs as any).fontWeight ?? 400,
                                                    fontSize:   isSummary ? '0.8rem' : '0.79rem',
                                                    borderLeft: isMonthStart(ci) ? `1px solid ${alpha(MAROON, 0.18)}` : `1px solid ${alpha('#000', 0.04)}`,
                                                    borderTop:  isSection ? `1.5px solid ${alpha(MAROON, 0.15)}` : `1px solid ${alpha('#000', 0.04)}`,
                                                    p: canEdit ? 0.25 : undefined,
                                                    fontVariantNumeric: 'tabular-nums',
                                                    transition: 'background .12s',
                                                }}>
                                                    {canEdit
                                                        ? <EditCell value={val} onChange={v => onCellChange(ri, ci, v)} />
                                                        : val !== null ? `$${fmt(val)}` : ''
                                                    }
                                                </TableCell>
                                            );
                                        })}

                                        {/* Row total */}
                                        <TableCell align="right" sx={{
                                            fontWeight: 600, fontSize: isSummary ? '0.8rem' : '0.79rem',
                                            color: row.rowType === 'balance' ? (rowTotal >= 0 ? GREEN : RED) : NAVY,
                                            bgcolor: bg,
                                            borderLeft: `1.5px solid ${alpha(NAVY, 0.12)}`,
                                            borderTop: isSection ? `1.5px solid ${alpha(MAROON, 0.15)}` : `1px solid ${alpha('#000', 0.04)}`,
                                            fontVariantNumeric: 'tabular-nums',
                                        }}>
                                            {rowTotal !== 0 || row.values.some(v => v !== null) ? `$${fmt(rowTotal)}` : ''}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                <InsightDrawer template={template} filtered={t} />
            </Box>
        </Box>
    );
};

export default ClassicSpreadsheet;
//
// // ── ClassicSpreadsheet.tsx ────────────────────────────────────────────────────
// // Enhanced classic spreadsheet with two additive features:
// //
// //  A) Inline sparklines + heat cells
// //     • Each expense row's sticky label shows a 40px SVG sparkline of last 6 actuals
// //       plus a ▲/▼ trend arrow and an "avg $xxx" chip
// //     • Value cells are tinted green/red when actual is >12% below/above that
// //       row's rolling average — purely visual, no number changes
// //
// //  B) Collapsible insight drawer (collapsed by default, one-click toggle)
// //     • Sits at the bottom of the table
// //     • Left column:  top spending signals (over-cap, period jump, positive streak)
// //     • Center column: group breakdown horizontal bar chart
// //     • Right column:  savings-rate SVG arc gauge with goal nudge
// //
// // Both features are purely derived from existing template.rows data — no schema
// // changes required.
// import React, { useMemo, useState, useRef } from 'react';
// import {
//     Box, Typography, Table, TableBody, TableCell, TableContainer,
//     TableHead, TableRow, Collapse, Tooltip,
// } from '@mui/material';
// import { alpha } from '@mui/material/styles';
// import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';
//
// import {
//     MAROON, NAVY, SLATE, GREEN, RED, TEAL, fmt, fmtS,
//     GROUP_ORDER, CAT_PCTS,
// } from '../domain/SpreadsheetTypes';
// import type { SpreadsheetTemplate, SpreadsheetRow, PeriodFilter } from '../domain/SpreadsheetTypes';
// import { PeriodPills } from './SharedBudgetUI';
//
// // ── Local tokens ──────────────────────────────────────────────────────────────
// const AMBER        = '#d97706';
// const MAROON_DARK  = '#4a1010';
// const HEAT_GREEN   = 'rgba(5,150,105,0.09)';
// const HEAT_RED     = 'rgba(226,75,74,0.08)';
// const HEAT_TEXT_G  = '#059669';
// const HEAT_TEXT_R  = '#c0392b';
//
// // Category → group mapping (mirrors CATEGORY_GROUPS in SpreadsheetTypes)
// const CATEGORY_GROUPS: Record<string, string> = {
//     Rent: 'Housing', Utilities: 'Housing', Electric: 'Housing', 'Gas Bill': 'Housing',
//     Groceries: 'Food', 'Order out': 'Food', 'Coffee Supplies': 'Food',
//     Gas: 'Transportation',
//     Golf: 'Entertainment', Subscriptions: 'Entertainment', 'Trip Cost': 'Entertainment', Haircut: 'Entertainment',
//     Insurance: 'Other', 'Phone Insurance': 'Other', Payments: 'Other', 'Other Stuff': 'Other', Savings: 'Other',
// };
//
// // Category → color mapping
// const CAT_COLORS: Record<string, string> = {
//     Housing:       '#1D9E75',
//     Food:          '#6b1a1a',
//     Transportation:'#BA7517',
//     Entertainment: '#378ADD',
//     Other:         '#D4537E',
// };
//
// // Threshold: cell is "hot" if actual deviates more than this from row avg
// const HEAT_THRESHOLD = 0.12;
//
// // Number of recent periods shown in sparklines
// const SPARK_PERIODS = 6;
//
// // ── Helpers ───────────────────────────────────────────────────────────────────
// const fmtC = (n: number | null | undefined): string => {
//     if (n === null || n === undefined) return '—';
//     return (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString();
// };
//
// function rowAvg(values: (number | null)[]): number {
//     const valid = values.filter((v): v is number => v !== null && v > 0);
//     return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
// }
//
// function isPeriodFuture(template: SpreadsheetTemplate, pi: number): boolean {
//     const pd = (template as any).periodDates?.[pi];
//     return pd ? (pd.start as Date) > new Date() : false;
// }
//
// function filterByPeriod(t: SpreadsheetTemplate, pf: PeriodFilter): SpreadsheetTemplate {
//     if (pf !== 'Monthly') return t;
//     const newPeriods = t.months.map(m => m.name);
//     const newMonths  = t.months.map((m, mi) => ({ name: m.name, cols: [mi] }));
//     const newRows: SpreadsheetRow[] = t.rows.map(row => ({
//         ...row,
//         values: t.months.map(m => {
//             if (row.rowType === 'expenses' || row.rowType === 'balance') return null;
//             const sum = m.cols.reduce((a, ci) => a + (row.values[ci] ?? 0), 0);
//             return sum === 0 && m.cols.every(ci => row.values[ci] === null) ? null : sum;
//         }),
//     }));
//     const expIdx = newRows.findIndex(r => r.rowType === 'expenses');
//     const balIdx = newRows.findIndex(r => r.rowType === 'balance');
//     const salIdx = newRows.findIndex(r => r.rowType === 'salary');
//     if (expIdx >= 0) {
//         const er = newRows.filter(r => r.rowType === 'expense');
//         newRows[expIdx] = { ...newRows[expIdx], values: newRows[expIdx].values.map((_, ci) => er.reduce((s, r) => s + (r.values[ci] ?? 0), 0)) };
//     }
//     if (balIdx >= 0 && salIdx >= 0) {
//         let run = 0;
//         newRows[balIdx] = { ...newRows[balIdx], values: newRows[balIdx].values.map((_, ci) => {
//                 const s = newRows[salIdx].values[ci] ?? 0;
//                 const e = expIdx >= 0 ? newRows[expIdx].values[ci] ?? 0 : 0;
//                 run = run + s - e;
//                 return run;
//             })};
//     }
//     return { ...t, periods: newPeriods, months: newMonths, rows: newRows };
// }
//
// // ── A: Sparkline SVG ──────────────────────────────────────────────────────────
// const SparkLine: React.FC<{ values: (number | null)[]; color: string }> = ({ values, color }) => {
//     // Take last SPARK_PERIODS non-null values
//     const recent = values
//         .map((v, i) => ({ v, i }))
//         .filter(x => x.v !== null && x.v > 0)
//         .slice(-SPARK_PERIODS)
//         .map(x => x.v as number);
//
//     if (recent.length < 2) return null;
//
//     const W = 40, H = 14;
//     const mn = Math.min(...recent);
//     const mx = Math.max(...recent);
//     const rng = mx - mn || 1;
//     const pts = recent
//         .map((v, i) => {
//             const x = Math.round((i / (recent.length - 1)) * W);
//             const y = Math.round(H - (((v - mn) / rng) * (H - 3) + 1.5));
//             return `${x},${y}`;
//         })
//         .join(' ');
//
//     // Trend: last vs second-to-last
//     const trend = recent[recent.length - 1] > recent[recent.length - 2] ? 'up'
//         : recent[recent.length - 1] < recent[recent.length - 2] ? 'down'
//             : 'flat';
//
//     return (
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.375, ml: 'auto', flexShrink: 0 }}>
//             <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
//                 <polyline
//                     points={pts}
//                     fill="none"
//                     stroke={color}
//                     strokeWidth="1.4"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                 />
//             </svg>
//             {trend === 'up'   && <TrendingUp   size={10} color={RED}    style={{ flexShrink: 0 }} />}
//             {trend === 'down' && <TrendingDown  size={10} color={GREEN}  style={{ flexShrink: 0 }} />}
//             {trend === 'flat' && <Minus         size={10} color={SLATE}  style={{ flexShrink: 0 }} />}
//         </Box>
//     );
// };
//
// // ── A: Avg chip ───────────────────────────────────────────────────────────────
// const AvgChip: React.FC<{ avg: number }> = ({ avg }) => (
//     <Box sx={{
//         fontSize: '0.6rem', color: SLATE, px: 0.625, py: 0.1,
//         borderRadius: '3px', bgcolor: alpha('#000', 0.05),
//         whiteSpace: 'nowrap', flexShrink: 0, ml: 0.25,
//     }}>
//         avg ${fmtS(avg)}
//     </Box>
// );
//
// // ── B: Spending signals ───────────────────────────────────────────────────────
// interface Signal {
//     label: string;
//     msg:   string;
//     type:  'over' | 'jump' | 'streak-good';
// }
//
// function deriveSignals(template: SpreadsheetTemplate, filtered: SpreadsheetTemplate): Signal[] {
//     const signals: Signal[] = [];
//     const expenseRows = filtered.rows.filter(r => r.rowType === 'expense');
//
//     expenseRows.forEach(row => {
//         const vals = row.values.filter((v): v is number => v !== null && v > 0);
//         if (vals.length < 2) return;
//         const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
//         const cap = avg * 1.15;
//         const last = vals[vals.length - 1];
//         const prev = vals[vals.length - 2];
//
//         // Over cap signal
//         if (last > cap && cap > 0) {
//             signals.push({
//                 label: row.label,
//                 msg:   `is $${Math.round(last - cap)} over its avg+15% cap of $${Math.round(cap)}.`,
//                 type:  'over',
//             });
//         }
//         // Period jump >40%
//         else if (last > prev * 1.4 && prev > 50) {
//             signals.push({
//                 label: row.label,
//                 msg:   `jumped ${Math.round(((last - prev) / prev) * 100)}% vs last period ($${Math.round(prev)} → $${Math.round(last)}).`,
//                 type:  'jump',
//             });
//         }
//     });
//
//     // Positive streak: category under avg for 3+ consecutive recent periods
//     expenseRows.forEach(row => {
//         const nonNull = row.values
//             .map((v, i) => ({ v, i }))
//             .filter(x => x.v !== null && x.v > 0)
//             .slice(-4);
//         if (nonNull.length < 3) return;
//         const a = rowAvg(row.values);
//         const streak = nonNull.filter(x => (x.v as number) < a * 0.9).length;
//         if (streak >= 3 && !signals.find(s => s.label === row.label)) {
//             signals.push({
//                 label: row.label,
//                 msg:   `has been under avg for ${streak} consecutive periods.`,
//                 type:  'streak-good',
//             });
//         }
//     });
//
//     return signals.slice(0, 4);
// }
//
// // ── B: Group breakdown bars ───────────────────────────────────────────────────
// const GroupBreakdown: React.FC<{ filtered: SpreadsheetTemplate }> = ({ filtered }) => {
//     const totals: Record<string, number> = {};
//     GROUP_ORDER.forEach(g => { totals[g] = 0; });
//
//     filtered.rows.filter(r => r.rowType === 'expense').forEach(row => {
//         const grp = CATEGORY_GROUPS?.[row.label] ?? 'Other';
//         if (!(grp in totals)) totals[grp] = 0;
//         totals[grp] += row.values.reduce((a: number, v) => a + (v ?? 0), 0);
//     });
//
//     const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
//
//     const GROUP_COLORS: Record<string, string> = {
//         Housing:       '#1D9E75',
//         Food:          '#6b1a1a',
//         Transportation:'#BA7517',
//         Entertainment: '#378ADD',
//         Other:         '#D4537E',
//     };
//
//     return (
//         <Box>
//             {GROUP_ORDER.map(grp => {
//                 const val = totals[grp] ?? 0;
//                 const pct = Math.round((val / grandTotal) * 100);
//                 const color = GROUP_COLORS[grp] ?? SLATE;
//                 return (
//                     <Box key={grp} sx={{ display: 'flex', alignItems: 'center', gap: 0.875, mb: 0.875 }}>
//                         <Typography sx={{ fontSize: '0.7rem', fontWeight: 500, color: NAVY, minWidth: 88, flexShrink: 0 }}>
//                             {grp}
//                         </Typography>
//                         <Box sx={{ flex: 1, height: 5, bgcolor: alpha('#000', 0.07), borderRadius: '3px', overflow: 'hidden' }}>
//                             <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: color, borderRadius: '3px', transition: 'width .3s' }} />
//                         </Box>
//                         <Typography sx={{ fontSize: '0.7rem', color: SLATE, minWidth: 28, textAlign: 'right', flexShrink: 0 }}>
//                             {pct}%
//                         </Typography>
//                     </Box>
//                 );
//             })}
//         </Box>
//     );
// };
//
// // ── B: Savings arc gauge ──────────────────────────────────────────────────────
// const SavingsGauge: React.FC<{ filtered: SpreadsheetTemplate }> = ({ filtered }) => {
//     const salRow  = filtered.rows.find(r => r.rowType === 'salary');
//     const expRow  = filtered.rows.find(r => r.rowType === 'expenses');
//     const totalInc = salRow?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
//     const totalExp = expRow?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
//     const netSaved = totalInc - totalExp;
//     const rate     = totalInc > 0 ? (netSaved / totalInc) * 100 : 0;
//     const goalPct  = 20;
//
//     // Arc: semi-circle, 0% = leftmost, 100% = rightmost
//     // circumference of a semi-circle r=42 = π*42 ≈ 131.9
//     const R   = 42;
//     const C   = Math.PI * R;
//     const fill = Math.max(0, Math.min(rate, 100));
//     const dash = (fill / 100) * C;
//
//     const rateColor = rate >= goalPct ? GREEN : rate >= goalPct * 0.6 ? AMBER : RED;
//     const cutNeeded = totalInc > 0 && rate < goalPct
//         ? Math.round(((goalPct / 100) * totalInc - netSaved) / (filtered.periods.length || 1))
//         : 0;
//
//     return (
//         <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
//             <svg width={110} height={64} viewBox="0 0 110 64">
//                 {/* Track */}
//                 <path
//                     d={`M10,58 A${R},${R} 0 0 1 100,58`}
//                     fill="none"
//                     stroke={alpha('#000', 0.07)}
//                     strokeWidth="9"
//                     strokeLinecap="round"
//                 />
//                 {/* Goal marker */}
//                 <path
//                     d={`M10,58 A${R},${R} 0 0 1 100,58`}
//                     fill="none"
//                     stroke={alpha(GREEN, 0.25)}
//                     strokeWidth="9"
//                     strokeLinecap="round"
//                     strokeDasharray={`${C}`}
//                     strokeDashoffset={C - (goalPct / 100) * C}
//                 />
//                 {/* Fill */}
//                 <path
//                     d={`M10,58 A${R},${R} 0 0 1 100,58`}
//                     fill="none"
//                     stroke={rateColor}
//                     strokeWidth="9"
//                     strokeLinecap="round"
//                     strokeDasharray={`${C}`}
//                     strokeDashoffset={C - dash}
//                 />
//                 <text x="55" y="54" textAnchor="middle" fontSize="16" fontWeight="700" fill={rateColor}>
//                     {rate >= 0 ? '+' : ''}{rate.toFixed(1)}%
//                 </text>
//             </svg>
//             <Typography sx={{ fontSize: '0.67rem', color: SLATE, textAlign: 'center', lineHeight: 1.4 }}>
//                 of income saved · goal: {goalPct}%
//             </Typography>
//             <Typography sx={{ fontSize: '0.67rem', fontWeight: 600, color: GREEN, textAlign: 'center' }}>
//                 {fmtC(netSaved)} net saved
//             </Typography>
//             {cutNeeded > 0 && (
//                 <Typography sx={{ fontSize: '0.63rem', color: SLATE, textAlign: 'center', mt: 0.25, lineHeight: 1.4 }}>
//                     Cut ~<strong style={{ color: NAVY }}>${fmtS(cutNeeded)}/period</strong> to reach 20%
//                 </Typography>
//             )}
//         </Box>
//     );
// };
//
// // ── B: Insight drawer ─────────────────────────────────────────────────────────
// const InsightDrawer: React.FC<{ template: SpreadsheetTemplate; filtered: SpreadsheetTemplate }> = ({ template, filtered }) => {
//     const [open, setOpen] = useState(false);
//     const signals = useMemo(() => deriveSignals(template, filtered), [template, filtered]);
//
//     const signalBg:  Record<Signal['type'], string> = {
//         over:         alpha(RED,   0.1),
//         jump:         alpha(AMBER, 0.1),
//         'streak-good': alpha(GREEN, 0.1),
//     };
//     const signalColor: Record<Signal['type'], string> = {
//         over:         RED,
//         jump:         AMBER,
//         'streak-good': GREEN,
//     };
//     const signalIcon: Record<Signal['type'], string> = {
//         over:         '▲',
//         jump:         '~',
//         'streak-good': '✓',
//     };
//
//     return (
//         <Box sx={{ borderTop: `0.5px solid ${alpha(MAROON, 0.12)}` }}>
//             {/* Toggle bar */}
//             <Box
//                 onClick={() => setOpen(v => !v)}
//                 sx={{
//                     display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//                     px: 1.75, py: 1,
//                     cursor: 'pointer',
//                     bgcolor: open ? alpha(MAROON, 0.03) : '#fff',
//                     borderTop: `0.5px solid ${alpha(MAROON, 0.08)}`,
//                     '&:hover': { bgcolor: alpha(MAROON, 0.025) },
//                     transition: 'background .12s',
//                     userSelect: 'none',
//                 }}
//             >
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875 }}>
//                     <Box sx={{
//                         width: 20, height: 20, borderRadius: '5px',
//                         bgcolor: alpha(MAROON, 0.1),
//                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                         flexShrink: 0,
//                     }}>
//                         <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
//                             <circle cx="5.5" cy="5.5" r="4.75" stroke={MAROON} strokeWidth="1.1"/>
//                             <line x1="5.5" y1="4" x2="5.5" y2="7.5" stroke={MAROON} strokeWidth="1.1" strokeLinecap="round"/>
//                             <circle cx="5.5" cy="2.8" r=".55" fill={MAROON}/>
//                         </svg>
//                     </Box>
//                     <Typography sx={{ fontSize: '0.77rem', fontWeight: 600, color: MAROON }}>
//                         Insights
//                     </Typography>
//                     {signals.length > 0 && (
//                         <Box sx={{
//                             fontSize: '0.62rem', fontWeight: 700,
//                             px: 0.625, py: 0.1, borderRadius: '10px',
//                             bgcolor: alpha(RED, 0.1), color: RED,
//                         }}>
//                             {signals.filter(s => s.type === 'over' || s.type === 'jump').length} signals
//                         </Box>
//                     )}
//                     <Typography sx={{ fontSize: '0.7rem', color: SLATE }}>
//                         — spending patterns, group breakdown, savings rate
//                     </Typography>
//                 </Box>
//                 <Box sx={{ color: SLATE, display: 'flex', alignItems: 'center' }}>
//                     {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
//                 </Box>
//             </Box>
//
//             {/* Drawer content */}
//             <Collapse in={open}>
//                 <Box sx={{
//                     display: 'grid',
//                     gridTemplateColumns: '1fr 1fr 180px',
//                     gap: 2,
//                     px: 2, py: 2,
//                     bgcolor: '#f9fafb',
//                     borderTop: `0.5px solid ${alpha('#000', 0.06)}`,
//                 }}>
//
//                     {/* Column 1: Spending signals */}
//                     <Box>
//                         <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>
//                             Spending signals
//                         </Typography>
//                         {signals.length === 0 ? (
//                             <Typography sx={{ fontSize: '0.73rem', color: SLATE }}>No anomalies detected.</Typography>
//                         ) : signals.map((s, i) => (
//                             <Box key={i} sx={{
//                                 display: 'flex', alignItems: 'flex-start', gap: 0.75,
//                                 p: 0.875,
//                                 mb: 0.75,
//                                 bgcolor: '#fff',
//                                 border: `0.5px solid ${alpha('#000', 0.08)}`,
//                                 borderRadius: '7px',
//                                 '&:last-child': { mb: 0 },
//                             }}>
//                                 <Box sx={{
//                                     width: 20, height: 20, borderRadius: '4px',
//                                     bgcolor: signalBg[s.type],
//                                     display: 'flex', alignItems: 'center', justifyContent: 'center',
//                                     flexShrink: 0, mt: 0.1, fontSize: '0.65rem', fontWeight: 700,
//                                     color: signalColor[s.type],
//                                 }}>
//                                     {signalIcon[s.type]}
//                                 </Box>
//                                 <Typography sx={{ fontSize: '0.72rem', color: NAVY, lineHeight: 1.45 }}>
//                                     <strong>{s.label}</strong> {s.msg}
//                                 </Typography>
//                             </Box>
//                         ))}
//                     </Box>
//
//                     {/* Column 2: Group breakdown */}
//                     <Box>
//                         <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>
//                             Spending by group
//                         </Typography>
//                         <GroupBreakdown filtered={filtered} />
//                     </Box>
//
//                     {/* Column 3: Savings gauge */}
//                     <Box>
//                         <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>
//                             Savings rate
//                         </Typography>
//                         <SavingsGauge filtered={filtered} />
//                     </Box>
//
//                 </Box>
//             </Collapse>
//         </Box>
//     );
// };
//
// // ── EditCell (unchanged from original) ───────────────────────────────────────
// const EditCell: React.FC<{ value: number | null; onChange: (v: number | null) => void }> = ({ value, onChange }) => {
//     const [active, setActive] = React.useState(false);
//     const [local,  setLocal]  = React.useState('');
//     const inputRef = useRef<HTMLInputElement>(null);
//
//     const activate = () => {
//         setLocal(value === null ? '' : String(value));
//         setActive(true);
//         setTimeout(() => {
//             inputRef.current?.focus();
//             inputRef.current?.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
//         }, 0);
//     };
//     const commit = () => {
//         const n = parseFloat(local);
//         onChange(local === '' ? null : isNaN(n) ? null : n);
//         setActive(false);
//     };
//
//     if (!active) return (
//         <Box onClick={activate} sx={{
//             cursor: 'cell', textAlign: 'right', px: 0.5, borderRadius: '3px', minWidth: 70,
//             '&:hover': { bgcolor: alpha(MAROON, 0.06) },
//         }}>
//             {value !== null ? `$${fmt(value)}` : ''}
//         </Box>
//     );
//
//     return (
//         <Box
//             component="input"
//             ref={inputRef}
//             value={local}
//             onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocal(e.target.value)}
//             onBlur={commit}
//             onKeyDown={(e: React.KeyboardEvent) => {
//                 if (e.key === 'Enter' || e.key === 'Tab') commit();
//                 if (e.key === 'Escape') setActive(false);
//             }}
//             sx={{
//                 width: '100%', minWidth: 70,
//                 border: `1.5px solid ${MAROON}`, borderRadius: '3px',
//                 px: 0.75, py: 0.25, fontSize: '0.78rem', textAlign: 'right',
//                 bgcolor: '#fff', outline: 'none', fontFamily: 'inherit',
//             }}
//         />
//     );
// };
//
// // ── Main ClassicSpreadsheet ───────────────────────────────────────────────────
// interface Props {
//     template:        SpreadsheetTemplate;
//     editMode:        boolean;
//     onCellChange:    (rowIndex: number, colIndex: number, value: number | null) => void;
//     periodFilter:    PeriodFilter;
//     onPeriodFilter:  (p: PeriodFilter) => void;
// }
//
// const ClassicSpreadsheet: React.FC<Props> = ({
//                                                  template, editMode, onCellChange, periodFilter, onPeriodFilter,
//                                              }) => {
//     const t           = useMemo(() => filterByPeriod(template, periodFilter), [template, periodFilter]);
//     const { months, periods, rows } = t;
//     const [futurePeriodOpen, setFuturePeriodOpen] = useState(false);
//     const isMonthStart = (ci: number) => months.some(m => m.cols[0] === ci);
//
//     const handleFuturePeriodApply = (periodIndex: number, values: Record<string, number | null>) =>{
//         template.rows.forEach((row, ri) => {
//             if (row.label in values) onCellChange(ri, periodIndex, values[row.label]);
//         });
//     }
//
//     // Precompute per-row averages for heat coloring
//     const rowAvgMap = useMemo(() => {
//         const map: Record<string, number> = {};
//         rows.filter(r => r.rowType === 'expense').forEach(r => {
//             map[r.label] = rowAvg(r.values);
//         });
//         return map;
//     }, [rows]);
//
//     const getCellStyle = (row: SpreadsheetRow, val: number | null, ci: number) => {
//         if (row.rowType === 'balance') return { color: (val ?? 0) >= 0 ? GREEN : RED };
//         if (row.rowType === 'expenses') {
//             const sal = rows.find(r => r.rowType === 'salary')?.values[ci];
//             return { color: sal && (val ?? 0) > sal ? RED : NAVY };
//         }
//         if (row.rowType === 'expense' && val !== null) {
//             const avg = rowAvgMap[row.label];
//             if (avg > 0) {
//                 if (val < avg * (1 - HEAT_THRESHOLD)) return { bgcolor: HEAT_GREEN, color: HEAT_TEXT_G };
//                 if (val > avg * (1 + HEAT_THRESHOLD)) return { bgcolor: HEAT_RED,   color: HEAT_TEXT_R, fontWeight: 500 };
//             }
//         }
//         return { color: NAVY };
//     };
//
//     const solidBg = (rt: SpreadsheetRow['rowType'], ri: number): string => {
//         if (rt === 'salary')   return '#fdf8f8';
//         if (rt === 'balance')  return '#f0fdf9';
//         if (rt === 'expenses') return '#f9fafb';
//         return ri % 2 === 0 ? '#ffffff' : '#fafbfc';
//     };
//
//     return (
//         <Box>
//             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
//                 <PeriodPills active={periodFilter} onChange={onPeriodFilter} />
//                 {/* Heat legend */}
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexShrink: 0 }}>
//                     {[
//                         { bg: HEAT_GREEN, label: 'Under avg', color: HEAT_TEXT_G },
//                         { bg: HEAT_RED,   label: 'Over avg',  color: HEAT_TEXT_R },
//                     ].map(({ bg, label, color }) => (
//                         <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                             <Box sx={{ width: 11, height: 11, borderRadius: '2px', bgcolor: bg, border: `0.5px solid ${alpha(color, 0.3)}`, flexShrink: 0 }} />
//                             <Typography sx={{ fontSize: '0.67rem', color: SLATE }}>{label}</Typography>
//                         </Box>
//                     ))}
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                         <svg width="22" height="10" viewBox="0 0 22 10" style={{ flexShrink: 0 }}>
//                             <polyline points="0,9 5,6 10,3 15,7 22,2" fill="none" stroke={MAROON} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
//                         </svg>
//                         <Typography sx={{ fontSize: '0.67rem', color: SLATE }}>Sparkline (last {SPARK_PERIODS})</Typography>
//                     </Box>
//                 </Box>
//             </Box>
//
//             {editMode && (
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5, px: 0.5 }}>
//                     <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: AMBER, flexShrink: 0 }} />
//                     <Typography sx={{ fontSize: '0.72rem', color: SLATE }}>Click any expense cell to edit</Typography>
//                 </Box>
//             )}
//
//             <Box sx={{
//                 borderRadius: '10px', overflow: 'hidden',
//                 border: `1px solid ${alpha(MAROON, 0.14)}`,
//                 boxShadow: `0 2px 12px ${alpha(MAROON, 0.06)}`,
//             }}>
//                 <TableContainer sx={{ overflowX: 'auto', isolation: 'isolate' }}>
//                     <Table size="small" sx={{
//                         minWidth: 'max-content', borderCollapse: 'separate', borderSpacing: 0,
//                         '& .MuiTableCell-root': { border: 'none' },
//                     }}>
//                         <TableHead>
//                             <TableRow>
//                                 {/* Sticky category header */}
//                                 <TableCell rowSpan={2} sx={{
//                                     position: 'sticky', left: 0, zIndex: 10,
//                                     minWidth: 195,
//                                     background: '#fdf8f8',
//                                     borderRight: `1.5px solid ${alpha(MAROON, 0.2)}`,
//                                     borderBottom: `1.5px solid ${alpha(MAROON, 0.15)}`,
//                                     boxShadow: `2px 0 8px -2px rgba(0,0,0,0.1)`,
//                                     fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase' as const,
//                                     letterSpacing: '0.08em', color: MAROON, verticalAlign: 'middle', px: 2,
//                                     isolation: 'isolate',
//                                 }}>
//                                     Category
//                                 </TableCell>
//                                 {/* Month group headers */}
//                                 {months.map(m => (
//                                     <TableCell key={m.name} colSpan={m.cols.length} align="center" sx={{
//                                         fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase' as const,
//                                         letterSpacing: '0.07em', color: MAROON, py: 0.875, bgcolor: '#fdf8f8',
//                                         borderLeft: `1px solid ${alpha(MAROON, 0.15)}`,
//                                         borderBottom: `1px solid ${alpha(MAROON, 0.08)}`,
//                                     }}>
//                                         {m.name}
//                                     </TableCell>
//                                 ))}
//                                 <TableCell align="right" sx={{
//                                     fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase' as const,
//                                     letterSpacing: '0.07em', color: NAVY, py: 0.875, bgcolor: '#f8fafc',
//                                     borderLeft: `1.5px solid ${alpha(NAVY, 0.15)}`,
//                                     borderBottom: `1px solid ${alpha(NAVY, 0.08)}`, minWidth: 80,
//                                 }}>
//                                     Total
//                                 </TableCell>
//                             </TableRow>
//                             <TableRow>
//                                 {periods.map((p, i) => (
//                                     <TableCell key={i} align="center" sx={{
//                                         fontWeight: 500, fontSize: '0.68rem', color: SLATE, py: 0.75, minWidth: 84,
//                                         bgcolor: '#fdf8f8',
//                                         borderLeft: isMonthStart(i) ? `1px solid ${alpha(MAROON, 0.18)}` : `1px solid ${alpha('#000', 0.04)}`,
//                                         borderBottom: `1.5px solid ${alpha(MAROON, 0.12)}`,
//                                     }}>
//                                         {p}
//                                     </TableCell>
//                                 ))}
//                                 <TableCell sx={{
//                                     bgcolor: '#f8fafc',
//                                     borderLeft: `1.5px solid ${alpha(NAVY, 0.12)}`,
//                                     borderBottom: `1.5px solid ${alpha(MAROON, 0.12)}`,
//                                 }} />
//                             </TableRow>
//                         </TableHead>
//
//                         <TableBody>
//                             {rows.map((row, ri) => {
//                                 const rowTotal    = row.values.reduce((a: number, v) => a + (v ?? 0), 0);
//                                 const isSection   = row.rowType === 'salary';
//                                 const isSummary   = row.rowType === 'expenses' || row.rowType === 'balance';
//                                 const bg          = solidBg(row.rowType, ri);
//                                 const canEdit     = editMode && row.rowType !== 'balance' && row.rowType !== 'expenses';
//                                 const avg         = rowAvgMap[row.label] ?? 0;
//                                 const catColor    = CAT_COLORS[CATEGORY_GROUPS[row.label]] ?? SLATE;
//
//                                 return (
//                                     <TableRow
//                                         key={row.label}
//                                         sx={{
//                                             '&:hover td': { bgcolor: row.rowType === 'expense' ? alpha(MAROON, 0.02) : undefined },
//                                             '&:hover td[data-sticky]': { bgcolor: `${bg} !important` },
//                                         }}
//                                     >
//                                         {/* Sticky label cell — with sparkline for expense rows */}
//                                         <TableCell
//                                             data-sticky="true"
//                                             sx={{
//                                                 position: 'sticky', left: 0, zIndex: 8,
//                                                 bgcolor: bg,
//                                                 borderRight: `1.5px solid ${alpha(MAROON, 0.16)}`,
//                                                 borderTop: isSection
//                                                     ? `1.5px solid ${alpha(MAROON, 0.15)}`
//                                                     : `1px solid ${alpha('#000', 0.04)}`,
//                                                 boxShadow: `2px 0 8px -3px rgba(0,0,0,0.1)`,
//                                                 isolation: 'isolate',
//                                                 px: 0, py: 0,
//                                             }}
//                                         >
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.75, py: 0.875 }}>
//                                                 {/* Category color bar */}
//                                                 {row.rowType === 'expense' && (
//                                                     <Box sx={{ width: 3, height: 13, borderRadius: '1.5px', bgcolor: catColor, flexShrink: 0 }} />
//                                                 )}
//                                                 <Typography sx={{
//                                                     fontSize: '0.79rem',
//                                                     fontWeight: isSection ? 600 : isSummary ? 600 : 400,
//                                                     color: row.rowType === 'salary' ? MAROON
//                                                         : row.rowType === 'balance' ? '#0f766e'
//                                                             : NAVY,
//                                                     whiteSpace: 'nowrap',
//                                                 }}>
//                                                     {row.label}
//                                                 </Typography>
//
//                                                 {/* Sparkline — expense rows only */}
//                                                 {row.rowType === 'expense' && avg > 0 && (
//                                                     <>
//                                                         <SparkLine values={row.values} color={catColor} />
//                                                         <AvgChip avg={avg} />
//                                                     </>
//                                                 )}
//                                             </Box>
//                                         </TableCell>
//
//                                         {/* Value cells */}
//                                         {row.values.map((val, ci) => {
//                                             const cs = getCellStyle(row, val, ci);
//                                             return (
//                                                 <TableCell key={ci} align="right" sx={{
//                                                     position: 'relative', zIndex: 0,
//                                                     color:      cs.color,
//                                                     bgcolor:    canEdit ? alpha('#d97706', 0.04) : (cs as any).bgcolor ?? bg,
//                                                     fontWeight: isSummary || isSection ? 600 : (cs as any).fontWeight ?? 400,
//                                                     fontSize:   isSummary ? '0.8rem' : '0.79rem',
//                                                     borderLeft: isMonthStart(ci)
//                                                         ? `1px solid ${alpha(MAROON, 0.18)}`
//                                                         : `1px solid ${alpha('#000', 0.04)}`,
//                                                     borderTop: isSection
//                                                         ? `1.5px solid ${alpha(MAROON, 0.15)}`
//                                                         : `1px solid ${alpha('#000', 0.04)}`,
//                                                     p: canEdit ? 0.25 : undefined,
//                                                     fontVariantNumeric: 'tabular-nums',
//                                                     transition: 'background .12s',
//                                                 }}>
//                                                     {canEdit
//                                                         ? <EditCell value={val} onChange={v => onCellChange(ri, ci, v)} />
//                                                         : val !== null ? `$${fmt(val)}` : ''
//                                                     }
//                                                 </TableCell>
//                                             );
//                                         })}
//
//                                         {/* Row total */}
//                                         <TableCell align="right" sx={{
//                                             position: 'relative', zIndex: 0,
//                                             fontWeight: 600,
//                                             fontSize: isSummary ? '0.8rem' : '0.79rem',
//                                             color: row.rowType === 'balance'
//                                                 ? (rowTotal >= 0 ? GREEN : RED)
//                                                 : NAVY,
//                                             bgcolor: bg,
//                                             borderLeft: `1.5px solid ${alpha(NAVY, 0.12)}`,
//                                             borderTop: isSection
//                                                 ? `1.5px solid ${alpha(MAROON, 0.15)}`
//                                                 : `1px solid ${alpha('#000', 0.04)}`,
//                                             fontVariantNumeric: 'tabular-nums',
//                                         }}>
//                                             {rowTotal !== 0 || row.values.some(v => v !== null)
//                                                 ? `$${fmt(rowTotal)}`
//                                                 : ''
//                                             }
//                                         </TableCell>
//                                     </TableRow>
//                                 );
//                             })}
//                         </TableBody>
//                     </Table>
//                 </TableContainer>
//
//                 {/* ── B: Insight drawer ─────────────────────────────────── */}
//                 <InsightDrawer template={template} filtered={t} />
//             </Box>
//         </Box>
//     );
// };
//
// export default ClassicSpreadsheet;
