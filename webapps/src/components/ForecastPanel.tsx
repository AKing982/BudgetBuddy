
// ── ForecastPanel.tsx ─────────────────────────────────────────────────────────

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
    Box, Paper, Typography, Divider, Chip, LinearProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import InsightsIcon from '@mui/icons-material/Insights';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { Chart, registerables } from 'chart.js';
import type { SpreadsheetTemplate } from '../domain/SpreadsheetTypes';
import SpreadsheetMode from './SpreadsheetMode';
import type { SheetFocus, OptimizeMode } from './SpreadsheetMode';

Chart.register(...registerables);

// ── Tokens ────────────────────────────────────────────────────────────────────
const MAROON  = '#6b1a1a';
const MAROON2 = '#4a1010';
const GREEN   = '#059669';
const AMBER   = '#d97706';
const RED     = '#dc2626';
const NAVY    = '#0C447C';
const SLATE   = '#64748b';
const PROJ    = '#85B7EB';
const PAST_C  = '#B4B2A9';
const TEAL    = '#0d9488';
const TEAL2   = '#0f766e';

const CAT_COLORS: Record<string, string> = {
    Rent: '#1D9E75', Groceries: '#6b1a1a', Gas: '#BA7517',
    Payments: '#7c3aed', Other: '#888780', Insurance: '#0ea5e9',
    Utilities: '#f59e0b', Electric: '#6366f1', 'Gas Bill': '#ef4444',
    Subscriptions: '#8b5cf6', Haircut: '#14b8a6', Savings: '#059669',
    'Order out': '#D4537E', 'Other Stuff': '#888780', 'Coffee Supplies': '#ba7517',
    'Phone Insurance': '#0ea5e9', 'Trip Cost': '#d97706', Golf: '#639922',
};

// ── Types ─────────────────────────────────────────────────────────────────────
export type ForecastMode  = 'review' | 'predict' | 'ripple';
export type RippleView    = 'balance' | 'savings' | 'budget';

interface ForecastPanelProps {
    template:             SpreadsheetTemplate;
    selectedPeriodIndex?: number;
    defaultMode?:         ForecastMode;
}

interface PlanItem {
    label: string; target: number; byPeriod: number; color: string;
    pct: number; predPct: number; atRisk: boolean; shortfall: number;
}
interface CatFlag {
    label: string; color: string; entered: number; avg: number;
    pct: number; period: number;
}
interface DerivedData {
    expAll: number[]; predAll: number[]; incAll: number[];
    netAll: number[]; predNetAll: number[];
    balTraj: number[]; predBalTraj: number[];
    savTraj: number[]; predSavTraj: number[];
    presentIdx: number; endBal: number; predEndBal: number; endSav: number;
    avgInc: number; avgExp: number; curExp: number; savRate: number; delta: number;
    catFlags: CatFlag[];
    plans: PlanItem[];
    catPredictions: { label: string; color: string; weighted: number; variance: number; conf: number; periods: number }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt   = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString()}`;
const fmtS  = (n: number) => Math.round(Math.abs(n)).toLocaleString();
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const sum   = (vals: (number | null)[]) => vals.reduce((a: number, v) => a + (v ?? 0), 0 as number);

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

// ── deriveData ────────────────────────────────────────────────────────────────
function deriveData(template: SpreadsheetTemplate): DerivedData {
    const N       = template.periods.length || 1;
    const salRow  = template.rows.find(r => r.rowType === 'salary');
    const expRows = template.rows.filter(r => r.rowType === 'expense');
    const CI      = Math.max(0, template.periods.findIndex((_, i) => isPresent(template, i)));

    const incAll: number[] = Array.from({ length: N }, (_, i) => salRow?.values[i] ?? 0);
    const predAll: number[] = Array.from({ length: N }, () => {
        const rp = expRows.map(r => {
            const past = r.values.slice(0, CI).filter((v): v is number => v !== null && v > 0);
            if (!past.length) return 0;
            const W = [0.4, 0.3, 0.2, 0.1]; const rc = past.slice(-4);
            const ws = rc.reduce((s, v, wi) => s + v * (W[W.length - rc.length + wi] ?? 0.1), 0);
            const wt = rc.reduce((s, _, wi) => s + (W[W.length - rc.length + wi] ?? 0.1), 0);
            return wt > 0 ? ws / wt : past[past.length - 1];
        });
        return Math.round(rp.reduce((a, b) => a + b, 0));
    });
    const expAll: number[] = Array.from({ length: N }, (_, i) => {
        const total = expRows.reduce((s, r) => s + (r.values[i] ?? 0), 0);
        return total > 0 ? total : predAll[i];
    });

    const netAll = expAll.map((e, i) => incAll[i] - e);
    const predNetAll = predAll.map((p, i) => incAll[i] - p);

    let bal = 0, predBal = 0, sav = 0, predSav = 0;
    const balTraj: number[] = [], predBalTraj: number[] = [], savTraj: number[] = [], predSavTraj: number[] = [];
    for (let i = 0; i < N; i++) {
        bal += netAll[i]; predBal += predNetAll[i];
        sav += Math.max(0, netAll[i]); predSav += Math.max(0, predNetAll[i]);
        balTraj.push(Math.round(bal)); predBalTraj.push(Math.round(predBal));
        savTraj.push(Math.round(sav)); predSavTraj.push(Math.round(predSav));
    }

    const futureEntered = expRows.flatMap(r =>
        r.values.map((v, i) => isFuture(template, i) && v !== null && v > 0 ? v : null).filter((v): v is number => v !== null)
    );
    const avgFE  = futureEntered.length ? Math.round(futureEntered.reduce((a, b) => a + b, 0) / futureEntered.length) : 0;
    const futurePredVals = predAll.filter((_, i) => isFuture(template, i));
    const avgPF  = futurePredVals.length ? Math.round(futurePredVals.reduce((a, b) => a + b, 0) / futurePredVals.length) : 0;
    const delta  = avgFE > 0 ? avgFE - avgPF : 0;

    const catFlags: CatFlag[] = [];
    expRows.forEach(row => {
        const pv = row.values.map((v, i) => ({ v, i })).filter(({ v, i }) => v !== null && v > 0 && isPast(template, i)).map(({ v }) => v as number);
        if (!pv.length) return;
        const avg = Math.round(pv.reduce((a, b) => a + b, 0) / pv.length);
        const fut = row.values.map((v, i) => ({ v, i })).filter(({ v, i }) => v !== null && v > 0 && isFuture(template, i));
        if (!fut.length) return;
        const worst = fut.reduce((a, b) => Math.abs((b.v as number) - avg) > Math.abs((a.v as number) - avg) ? b : a);
        const pct = avg > 0 ? Math.round(((worst.v as number) - avg) / avg * 100) : 0;
        if (Math.abs(pct) >= 15) catFlags.push({ label: row.label, color: CAT_COLORS[row.label] ?? SLATE, entered: worst.v as number, avg, pct, period: worst.i });
    });
    catFlags.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));

    const futureNet = netAll.slice(CI + 1).reduce((a, b) => a + Math.max(0, b), 0);
    const predFutureNet = predNetAll.slice(CI + 1).reduce((a, b) => a + Math.max(0, b), 0);
    const plans: PlanItem[] = [
        { label: 'Car repair fund', target: 1200, byPeriod: CI + 4, color: NAVY  },
        { label: 'Trip deposit',    target: 800,  byPeriod: CI + 5, color: AMBER },
        { label: 'Emergency fund',  target: 2400, byPeriod: N - 1,  color: GREEN },
    ].map(p => {
        const alloc = clamp(Math.round(futureNet * 0.3), 0, p.target);
        const predAlloc = clamp(Math.round(predFutureNet * 0.3), 0, p.target);
        const pct = clamp(Math.round((alloc / p.target) * 100), 0, 100);
        const predPct = clamp(Math.round((predAlloc / p.target) * 100), 0, 100);
        return { ...p, pct, predPct, atRisk: pct < predPct - 8, shortfall: Math.round(p.target * (1 - pct / 100)) };
    });

    const catPredictions = expRows.map(row => {
        const pv = row.values.slice(0, CI).filter((v): v is number => v !== null && v > 0);
        if (!pv.length) return null;
        const W = [0.4, 0.3, 0.2, 0.1]; const rc = pv.slice(-4);
        const weighted = Math.round(rc.reduce((s, v, wi) => s + v * (W[W.length - rc.length + wi] ?? 0.1), 0) / rc.reduce((s, _, wi) => s + (W[W.length - rc.length + wi] ?? 0.1), 0));
        const variance = Math.round(Math.sqrt(pv.reduce((s, v) => s + Math.pow(v - weighted, 2), 0) / pv.length));
        const conf = clamp(100 - Math.round((variance / Math.max(weighted, 1)) * 100), 40, 97);
        return { label: row.label, color: CAT_COLORS[row.label] ?? SLATE, weighted, variance, conf, periods: pv.length };
    }).filter((x): x is NonNullable<typeof x> => x !== null);

    return {
        expAll, predAll, incAll, netAll, predNetAll, balTraj, predBalTraj, savTraj, predSavTraj,
        presentIdx: CI, endBal: balTraj[N-1] ?? 0, predEndBal: predBalTraj[N-1] ?? 0, endSav: savTraj[N-1] ?? 0,
        avgInc: Math.round(sum(incAll) / N), avgExp: Math.round(sum(expAll) / N),
        curExp: expAll[CI] ?? 0, savRate: incAll[CI] > 0 ? Math.round(((incAll[CI] - (expAll[CI] ?? 0)) / incAll[CI]) * 100) : 0,
        delta, catFlags, plans, catPredictions,
    };
}

// ── Shared sub-components ─────────────────────────────────────────────────────
const SectionHead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: alpha(MAROON, 0.6), mb: 1.5 }}>
        {children}
    </Typography>
);

const ProgBar: React.FC<{ pct: number; color: string; trackColor?: string }> = ({ pct, color, trackColor }) => (
    <LinearProgress variant="determinate" value={clamp(pct, 0, 100)} sx={{
        height: 5, borderRadius: 3,
        bgcolor: trackColor ?? alpha(color, 0.15),
        '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
    }} />
);

const FlagCard: React.FC<{ color: string; title: string; sub: string }> = ({ color, title, sub }) => (
    <Box sx={{ p: '9px 11px', mb: 1, borderLeft: `3px solid ${color}`, borderTop: `0.5px solid ${alpha(color, 0.25)}`, borderRight: `0.5px solid ${alpha(color, 0.25)}`, borderBottom: `0.5px solid ${alpha(color, 0.25)}`, borderRadius: '0 8px 8px 0', bgcolor: alpha(color, 0.04) }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color, mb: 0.25 }}>{title}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>{sub}</Typography>
    </Box>
);

const PlanRow: React.FC<{ plan: PlanItem }> = ({ plan }) => {
    const sc = plan.pct >= 90 ? GREEN : plan.atRisk ? RED : AMBER;
    return (
        <Box sx={{ p: '9px 11px', mb: 0.75, borderRadius: '10px', border: `0.5px solid ${plan.atRisk ? alpha(RED, 0.35) : alpha('#000', 0.1)}`, bgcolor: plan.atRisk ? alpha(RED, 0.04) : 'transparent' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: plan.color, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: plan.atRisk ? RED : 'text.primary' }}>{plan.label}</Typography>
                </Box>
                <Chip label={plan.pct >= 90 ? 'on track' : plan.atRisk ? 'at risk' : 'reduced'} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(sc, 0.12), color: sc }} />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                target {fmt(plan.target)}{plan.shortfall > 0 ? ` · ${fmt(plan.shortfall)} needed` : ' · fully funded'}
            </Typography>
            <Box sx={{ position: 'relative', height: 5, borderRadius: 2, bgcolor: alpha('#000', 0.07) }}>
                <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2, width: `${plan.predPct}%`, bgcolor: alpha('#000', 0.18) }} />
                <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2, width: `${plan.pct}%`, bgcolor: sc, transition: 'width .4s' }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">baseline {plan.predPct}%</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: sc }}>{plan.pct}% on your data</Typography>
            </Box>
        </Box>
    );
};

// ── Chart hook ────────────────────────────────────────────────────────────────
function useChart(ref: React.RefObject<HTMLCanvasElement>, config: any, deps: React.DependencyList) {
    const chartRef = useRef<Chart | null>(null);
    useEffect(() => {
        if (!ref.current) return;
        chartRef.current?.destroy();
        chartRef.current = new Chart(ref.current, config);
        return () => { chartRef.current?.destroy(); chartRef.current = null; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

function chartDefaults() {
    return {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#fff', borderColor: 'rgba(0,0,0,.1)', borderWidth: 0.5, titleColor: '#1e293b', bodyColor: '#64748b', padding: 9, cornerRadius: 7, callbacks: { label: (ctx: any) => ' ' + (ctx.parsed.y < 0 ? '-' : '') + '$' + Math.round(Math.abs(ctx.parsed.y)).toLocaleString() } },
        },
        scales: {
            x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 }, maxRotation: 45, autoSkip: false } },
            y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 }, callback: (v: any) => (v < 0 ? '-' : '') + '$' + Math.round(Math.abs(v)).toLocaleString() } },
        },
    };
}

// ── Standard forecast views (Review / Predict / Ripple) ───────────────────────
const LiveReviewView: React.FC<{ template: SpreadsheetTemplate; d: DerivedData }> = ({ template, d }) => {
    const flags: { color: string; title: string; sub: string }[] = [];
    if (d.delta > 100) flags.push({ color: RED, title: `Future spend ${fmt(d.delta)}/period over prediction`, sub: `Your entered values average ${fmt(d.delta)} above the predicted budget across ${template.periods.filter((_, i) => isFuture(template, i)).length} remaining periods.` });
    else if (d.delta > 30) flags.push({ color: AMBER, title: 'Spending elevated in future periods', sub: `Entered values are ${fmt(d.delta)} above prediction on average.` });
    else flags.push({ color: GREEN, title: 'Future spend matches prediction', sub: 'All entered values align with predicted budget.' });
    d.plans.filter(p => p.atRisk).forEach(p => flags.push({ color: RED, title: `${p.label} at risk`, sub: `Current trajectory funds ${p.pct}% vs ${p.predPct}% baseline — ${fmt(p.shortfall)} short.` }));

    return (
        <Box>
            <SectionHead>Entered vs prediction</SectionHead>
            {d.catFlags.length === 0 && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>No future cells entered yet.</Typography>}
            {d.catFlags.slice(0, 5).map(f => {
                const over = f.pct > 0; const col = Math.abs(f.pct) > 40 ? RED : AMBER;
                const barPct = clamp(Math.round((f.entered / Math.max(f.avg * 1.6, 1)) * 100), 0, 100);
                const avgPct = clamp(Math.round((f.avg / Math.max(f.avg * 1.6, 1)) * 100), 0, 100);
                return (
                    <Box key={f.label} sx={{ p: '9px 11px', mb: 0.75, borderRadius: '10px', border: `0.5px solid ${over ? alpha(col, 0.35) : alpha(GREEN, 0.25)}`, bgcolor: over ? alpha(col, 0.04) : alpha(GREEN, 0.03) }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: f.color, flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, flex: 1 }}>{f.label}</Typography>
                            <Chip label={`${over ? '+' : ''}${f.pct}%`} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(over ? col : GREEN, 0.12), color: over ? col : GREEN }} />
                        </Box>
                        <Box sx={{ position: 'relative', height: 4, borderRadius: 2, bgcolor: alpha('#000', 0.07), mb: 0.5 }}>
                            <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${avgPct}%`, bgcolor: PAST_C, borderRadius: 2 }} />
                            <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${barPct}%`, bgcolor: over ? col : GREEN, borderRadius: 2 }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary">entered {fmt(f.entered)} · avg {fmt(f.avg)} · period {f.period + 1}</Typography>
                    </Box>
                );
            })}
            <Divider sx={{ my: 2, borderColor: alpha(MAROON, 0.08) }} />
            <SectionHead>Review flags</SectionHead>
            {flags.map((f, i) => <FlagCard key={i} {...f} />)}
            <Divider sx={{ my: 2, borderColor: alpha(MAROON, 0.08) }} />
            <SectionHead>Payment plan status</SectionHead>
            {d.plans.map(p => <PlanRow key={p.label} plan={p} />)}
        </Box>
    );
};

const PredictView: React.FC<{ template: SpreadsheetTemplate; d: DerivedData }> = ({ template, d }) => (
    <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: '8px 11px', borderRadius: '8px', border: `0.5px solid ${alpha(NAVY, 0.2)}`, bgcolor: alpha(NAVY, 0.04), mb: 2 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: NAVY, flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary">Weighted-recent model · {template.periods.filter((_, i) => isFuture(template, i)).length} unfilled periods</Typography>
        </Box>
        <SectionHead>Predicted values — unfilled periods</SectionHead>
        {d.catPredictions.map(c => {
            const cc = c.conf >= 80 ? GREEN : c.conf >= 60 ? AMBER : RED;
            return (
                <Box key={c.label} sx={{ p: '9px 11px', mb: 0.75, borderRadius: '10px', border: `0.5px solid ${alpha('#000', 0.1)}` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: c.color, flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{c.label}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(c.weighted)}<Typography component="span" variant="caption" color="text.secondary"> ±{fmt(c.variance)}</Typography>
                        </Typography>
                    </Box>
                    <ProgBar pct={c.conf} color={cc} />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {c.conf}% confidence · {c.periods} past period{c.periods !== 1 ? 's' : ''}
                    </Typography>
                </Box>
            );
        })}
        <Divider sx={{ my: 2, borderColor: alpha(MAROON, 0.08) }} />
        <SectionHead>Prediction signals</SectionHead>
        {[
            { on: true,  label: 'Weighted recent — last 3 periods' },
            { on: true,  label: 'Lock manually entered future cells' },
            { on: true,  label: 'Fixed cost detection' },
            { on: false, label: 'Seasonal pattern detection' },
            { on: false, label: 'Income-linked scaling' },
        ].map((s, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, borderBottom: `0.5px solid ${alpha('#000', 0.06)}` }}>
                <Box sx={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0, border: `1.5px solid ${s.on ? GREEN : alpha('#000', 0.2)}`, bgcolor: s.on ? alpha(GREEN, 0.1) : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s.on && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: GREEN }} />}
                </Box>
                <Typography sx={{ fontSize: '0.72rem', color: s.on ? 'text.primary' : 'text.secondary' }}>{s.label}</Typography>
            </Box>
        ))}
    </Box>
);

const RippleView: React.FC<{ template: SpreadsheetTemplate; d: DerivedData }> = ({ template, d }) => {
    const [view, setView] = useState<RippleView>('balance');
    const ref = useRef<HTMLCanvasElement>(null);
    const labels = template.periods;
    const CI = d.presentIdx;
    const userColor = d.delta > 50 ? RED : GREEN;

    const datasets: Record<RippleView, any[]> = {
        balance: [
            { data: d.balTraj.map((v, i) => i <= CI ? v : null),     borderColor: MAROON,    borderWidth: 2.5, fill: false, pointRadius: 3, pointBackgroundColor: MAROON,    tension: 0.4 },
            { data: d.predBalTraj.map((v, i) => i >= CI ? v : null), borderColor: PROJ,      borderWidth: 1.5, borderDash: [5,3], fill: false, pointRadius: 2, tension: 0.4 },
            { data: d.balTraj.map((v, i) => i >= CI ? v : null),     borderColor: userColor, borderWidth: 2.5, fill: false, pointRadius: 3, pointBackgroundColor: userColor, tension: 0.4 },
        ],
        savings: [
            { data: d.savTraj.map((v, i) => i <= CI ? v : null),     borderColor: GREEN, borderWidth: 2.5, fill: false, pointRadius: 3, tension: 0.4 },
            { data: d.predSavTraj.map((v, i) => i >= CI ? v : null), borderColor: PROJ,  borderWidth: 1.5, borderDash: [5,3], fill: false, pointRadius: 2, tension: 0.4 },
            { data: d.savTraj.map((v, i) => i >= CI ? v : null),     borderColor: userColor, borderWidth: 2.5, fill: false, pointRadius: 3, tension: 0.4 },
            { data: labels.map(() => 500), borderColor: AMBER, borderWidth: 1.5, borderDash: [4,3], fill: false, pointRadius: 0 },
        ],
        budget: [
            { type: 'bar', data: d.incAll.map((inc, i) => inc > 0 ? Math.round(((inc - d.predAll[i]) / inc) * 100) : 0), backgroundColor: 'rgba(180,178,169,0.35)', borderRadius: 3, borderSkipped: false },
            { type: 'bar', data: d.incAll.map((inc, i) => i >= CI && inc > 0 ? Math.round(((inc - d.expAll[i]) / inc) * 100) : null), backgroundColor: d.incAll.map((inc, i) => { const r = inc > 0 ? ((inc - d.expAll[i]) / inc) * 100 : 0; return r >= 10 ? GREEN : r >= 0 ? AMBER : RED; }), borderRadius: 3, borderSkipped: false },
        ],
    };

    const opts: any = {
        ...chartDefaults(),
        ...(view === 'budget' ? { scales: { x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 }, maxRotation: 45, autoSkip: false } }, y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 }, callback: (v: any) => `${v}%` } } } } : {}),
    };

    useChart(ref, { type: view === 'budget' ? 'bar' : 'line', data: { labels, datasets: datasets[view] }, options: opts }, [d, labels, view]);

    return (
        <Box>
            <Box sx={{ display: 'flex', gap: '5px', mb: 1.5 }}>
                {([['balance','Balance'],['savings','Savings'],['budget','Budget rate']] as [RippleView, string][]).map(([k, l]) => (
                    <Box key={k} onClick={() => setView(k)} sx={{ flex: 1, py: '6px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', borderRadius: '8px', transition: 'all .12s', border: `0.5px solid ${view === k ? alpha(MAROON, 0.3) : alpha('#000', 0.1)}`, bgcolor: view === k ? alpha(MAROON, 0.06) : 'transparent', color: view === k ? MAROON : 'text.secondary', userSelect: 'none' }}>{l}</Box>
                ))}
            </Box>
            <Box sx={{ position: 'relative', width: '100%', height: 180 }}>
                <canvas ref={ref} />
            </Box>
            <Divider sx={{ my: 2, borderColor: alpha(MAROON, 0.08) }} />
            <SectionHead>End-of-plan impact</SectionHead>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                {[
                    { label: 'Your end balance', value: fmt(d.endBal), color: d.endBal >= d.predEndBal ? GREEN : RED, sub: `pred. ${fmt(d.predEndBal)}` },
                    { label: 'Cumulative savings', value: fmt(d.endSav), color: GREEN, sub: `${d.savRate}% rate` },
                ].map((k, i) => (
                    <Box key={i} sx={{ p: 1.5, borderRadius: '10px', border: `1px solid ${alpha(k.color, 0.2)}`, bgcolor: alpha(k.color, 0.05) }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>{k.label}</Typography>
                        <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: k.color, fontVariantNumeric: 'tabular-nums' }}>{k.value}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>{k.sub}</Typography>
                    </Box>
                ))}
            </Box>
            <SectionHead>Plan cascade</SectionHead>
            {d.plans.map(p => <PlanRow key={p.label} plan={p} />)}
        </Box>
    );
};

// ── ForecastPanel ──────────────────────────────────────────────────────────────
const FORECAST_MODES: { key: ForecastMode; label: string }[] = [
    { key: 'review',  label: 'Live review' },
    { key: 'predict', label: 'Predict'     },
    { key: 'ripple',  label: 'Ripple'      },
];

const ForecastPanel: React.FC<ForecastPanelProps> = ({
                                                         template,
                                                         selectedPeriodIndex = 0,
                                                         defaultMode = 'review',
                                                     }) => {
    const [mode,         setMode]         = useState<ForecastMode>(defaultMode);
    const [activePi,     setActivePi]     = useState(selectedPeriodIndex);
    const [sheetMode,    setSheetMode]    = useState(true);
    const [sheetFocus,   setSheetFocus]   = useState<SheetFocus>('historical');
    const [optimizeMode, setOptimizeMode] = useState<OptimizeMode>('auto');

    useEffect(() => { setActivePi(selectedPeriodIndex); }, [selectedPeriodIndex]);

    const d = useMemo(() => deriveData(template), [template]);
    const N = template.periods.length || 1;
    const totInc = d.incAll.reduce((a, b) => a + b, 0);
    const totExp = d.expAll.reduce((a, b) => a + b, 0);

    return (
        <Paper elevation={0} sx={{
            width: 440, flexShrink: 0, borderRadius: '16px', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            border: `1px solid ${alpha(MAROON, 0.15)}`,
            boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}`,
            alignSelf: 'flex-start',
        }}>
            {/* ── Maroon header ── */}
            <Box sx={{
                background: `linear-gradient(135deg, ${MAROON2} 0%, ${MAROON} 55%, #5a1515 100%)`,
                color: '#fff', p: 2.5, position: 'relative', overflow: 'hidden', flexShrink: 0,
            }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 110, height: 110, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

                {/* Title row */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, position: 'relative' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <InsightsIcon sx={{ fontSize: '1rem' }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>Forecast</Typography>
                            <Typography sx={{ fontSize: '0.67rem', opacity: 0.65, mt: '1px' }}>
                                {template.periodType?.toLowerCase() ?? 'biweekly'} · {N} periods
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box
                            onClick={() => setSheetMode(v => !v)}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 0.625,
                                px: 1.125, py: 0.5, borderRadius: '7px', cursor: 'pointer',
                                border: '1px solid',
                                borderColor: sheetMode ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.3)',
                                bgcolor: sheetMode ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.08)',
                                transition: 'all .15s', userSelect: 'none',
                                '&:hover': { bgcolor: 'rgba(255,255,255,.18)' },
                            }}
                        >
                            <TableChartOutlinedIcon sx={{ fontSize: '0.85rem', color: sheetMode ? '#fff' : 'rgba(255,255,255,.75)' }} />
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: sheetMode ? '#fff' : 'rgba(255,255,255,.75)' }}>
                                Spreadsheet
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: '6px', px: 1.125, py: 0.5, border: '1px solid rgba(255,255,255,0.2)' }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#97c459' }} />
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700 }}>live</Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Mode pills — only shown when NOT in spreadsheet mode */}
                {!sheetMode && (
                    <Box sx={{ display: 'flex', gap: '5px', mb: 1.5, position: 'relative' }}>
                        {FORECAST_MODES.map(m => (
                            <Box key={m.key} onClick={() => setMode(m.key)} sx={{
                                px: '11px', py: '5px', borderRadius: '20px', border: '1px solid',
                                cursor: 'pointer', userSelect: 'none', fontSize: '0.68rem', fontWeight: 700, transition: 'all .12s',
                                borderColor: mode === m.key ? 'rgba(255,255,255,.65)' : 'rgba(255,255,255,.25)',
                                bgcolor:     mode === m.key ? 'rgba(255,255,255,.22)' : 'transparent',
                                color:       mode === m.key ? '#fff' : 'rgba(255,255,255,.65)',
                                '&:hover':   mode !== m.key ? { bgcolor: 'rgba(255,255,255,.12)', color: '#fff' } : {},
                            }}>{m.label}</Box>
                        ))}
                    </Box>
                )}

                {/* Spreadsheet mode subheader */}
                {sheetMode && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5, px: 0.25 }}>
                        <TableChartOutlinedIcon sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,.6)' }} />
                        <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.75)', fontWeight: 600 }}>
                            Category analysis · trends · projections · optimizer
                        </Typography>
                    </Box>
                )}

                {/* Period picker */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, position: 'relative' }}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>Period</Typography>
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box onClick={() => setActivePi(p => Math.max(0, p - 1))} sx={{ width: 22, height: 22, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', userSelect: 'none', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' }, opacity: activePi === 0 ? 0.35 : 1 }}>‹</Box>
                        <Box sx={{ flex: 1, display: 'flex', gap: '3px', overflow: 'hidden' }}>
                            {(() => {
                                const total = N; const windowSize = 5;
                                const start = Math.max(0, Math.min(activePi - 2, total - windowSize));
                                const end   = Math.min(total, start + windowSize);
                                return template.periods.slice(start, end).map((p, i) => {
                                    const pi = start + i; const isActive = pi === activePi; const isCurrent = isPresent(template, pi);
                                    return (
                                        <Box key={pi} onClick={() => setActivePi(pi)} sx={{ flex: 1, py: '3px', borderRadius: '5px', textAlign: 'center', cursor: 'pointer', border: '1px solid', transition: 'all .12s', userSelect: 'none', borderColor: isActive ? 'rgba(255,255,255,.75)' : isCurrent ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.2)', bgcolor: isActive ? 'rgba(255,255,255,.22)' : isCurrent ? 'rgba(255,255,255,.08)' : 'transparent', '&:hover': !isActive ? { bgcolor: 'rgba(255,255,255,.1)' } : {} }}>
                                            <Typography sx={{ fontSize: '0.58rem', fontWeight: isActive ? 800 : 500, color: isActive ? '#fff' : 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p}</Typography>
                                            {isCurrent && <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#fff', mx: 'auto', mt: '2px', opacity: 0.7 }} />}
                                        </Box>
                                    );
                                });
                            })()}
                        </Box>
                        <Box onClick={() => setActivePi(p => Math.min(N - 1, p + 1))} sx={{ width: 22, height: 22, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', userSelect: 'none', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' }, opacity: activePi === N - 1 ? 0.35 : 1 }}>›</Box>
                    </Box>
                </Box>

                {/* KPI strip */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0.75, position: 'relative' }}>
                    {[
                        { label: 'Avg income', value: `$${Math.round(totInc / N).toLocaleString()}` },
                        { label: 'Avg spend',  value: `$${Math.round(totExp / N).toLocaleString()}` },
                        { label: 'Balance',    value: `$${Math.round(d.endBal).toLocaleString()}`   },
                        { label: 'Saved %',    value: `${d.savRate}%`                               },
                    ].map(k => (
                        <Box key={k.label} sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '7px', p: '6px 7px', textAlign: 'center' }}>
                            <Typography sx={{ fontSize: '0.58rem', opacity: 0.65, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>{k.label}</Typography>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', mt: '2px' }}>{k.value}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* ── Scrollable body ── */}
            <Box sx={{
                flex: 1, overflowY: 'auto', p: 2.5, bgcolor: '#fff',
                maxHeight: 'calc(100vh - 300px)',
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-track': { bgcolor: 'rgba(0,0,0,0.03)' },
                '&::-webkit-scrollbar-thumb': { bgcolor: TEAL, borderRadius: 3, '&:hover': { bgcolor: TEAL2 } },
            }}>
                {sheetMode ? (
                    // ↓↓↓ THE FIX: pass all required props to SpreadsheetMode ↓↓↓
                    <SpreadsheetMode
                        template={template}
                        d={d}
                        focus={sheetFocus}
                        onFocusChange={setSheetFocus}
                        optimizeMode={optimizeMode}
                        onOptimizeModeChange={setOptimizeMode}
                    />
                ) : (
                    <>
                        {mode === 'review'  && <LiveReviewView template={template} d={d} />}
                        {mode === 'predict' && <PredictView    template={template} d={d} />}
                        {mode === 'ripple'  && <RippleView     template={template} d={d} />}
                    </>
                )}
            </Box>
        </Paper>
    );
};

export default ForecastPanel;
// // ── ForecastPanel.tsx ─────────────────────────────────────────────────────────
// // Standalone right-column forecast panel.
// // New: Spreadsheet Mode button in the header toggles a category × period
// //      analysis view with historical trends, future projections, budget impact,
// //      and an Auto/Manual optimize control.
// // ─────────────────────────────────────────────────────────────────────────────
//
// import React, { useMemo, useState, useEffect, useRef } from 'react';
// import {
//     Box, Paper, Typography, Divider, Chip, LinearProgress,
// } from '@mui/material';
// import { alpha } from '@mui/material/styles';
// import InsightsIcon from '@mui/icons-material/Insights';
// import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
// import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
// import { Chart, registerables } from 'chart.js';
// import type { SpreadsheetTemplate } from '../domain/SpreadsheetTypes';
//
// Chart.register(...registerables);
//
// // ── Tokens ────────────────────────────────────────────────────────────────────
// const MAROON  = '#6b1a1a';
// const MAROON2 = '#4a1010';
// const GREEN   = '#059669';
// const AMBER   = '#d97706';
// const RED     = '#dc2626';
// const NAVY    = '#0C447C';
// const SLATE   = '#64748b';
// const PROJ    = '#85B7EB';
// const PAST_C  = '#B4B2A9';
// const TEAL    = '#0d9488';
// const TEAL2   = '#0f766e';
//
// const CAT_COLORS: Record<string, string> = {
//     Rent: '#1D9E75', Groceries: '#6b1a1a', Gas: '#BA7517',
//     Payments: '#7c3aed', Other: '#888780', Insurance: '#0ea5e9',
//     Utilities: '#f59e0b', Electric: '#6366f1', 'Gas Bill': '#ef4444',
//     Subscriptions: '#8b5cf6', Haircut: '#14b8a6', Savings: '#059669',
//     'Order out': '#D4537E', 'Other Stuff': '#888780', 'Coffee Supplies': '#ba7517',
//     'Phone Insurance': '#0ea5e9', 'Trip Cost': '#d97706', Golf: '#639922',
// };
//
// // ── Types ─────────────────────────────────────────────────────────────────────
// export type ForecastMode  = 'review' | 'predict' | 'ripple';
// export type RippleView    = 'balance' | 'savings' | 'budget';
// export type SheetFocus    = 'historical' | 'future';
// export type OptimizeMode  = 'auto' | 'manual';
//
// interface ForecastPanelProps {
//     template:             SpreadsheetTemplate;
//     selectedPeriodIndex?: number;
//     defaultMode?:         ForecastMode;
// }
//
// interface PlanItem {
//     label: string; target: number; byPeriod: number; color: string;
//     pct: number; predPct: number; atRisk: boolean; shortfall: number;
// }
// interface CatFlag {
//     label: string; color: string; entered: number; avg: number;
//     pct: number; period: number;
// }
// interface DerivedData {
//     expAll: number[]; predAll: number[]; incAll: number[];
//     netAll: number[]; predNetAll: number[];
//     balTraj: number[]; predBalTraj: number[];
//     savTraj: number[]; predSavTraj: number[];
//     presentIdx: number; endBal: number; predEndBal: number; endSav: number;
//     avgInc: number; avgExp: number; curExp: number; savRate: number; delta: number;
//     catFlags: CatFlag[];
//     plans: PlanItem[];
//     catPredictions: { label: string; color: string; weighted: number; variance: number; conf: number; periods: number }[];
// }
//
// // ── Helpers ───────────────────────────────────────────────────────────────────
// const fmt   = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString()}`;
// const fmtS  = (n: number) => Math.round(Math.abs(n)).toLocaleString();
// const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
// const sum   = (vals: (number | null)[]) => vals.reduce((a: number, v) => a + (v ?? 0), 0 as number);
//
// function periodType(t: SpreadsheetTemplate, pi: number): 'past' | 'present' | 'future' {
//     const pd = t.periodDates?.[pi];
//     if (!pd) return pi < Math.floor(t.periods.length / 2) ? 'past' : 'future';
//     const now = new Date();
//     if (pd.end < now)   return 'past';
//     if (pd.start > now) return 'future';
//     return 'present';
// }
// const isFuture  = (t: SpreadsheetTemplate, pi: number) => periodType(t, pi) === 'future';
// const isPast    = (t: SpreadsheetTemplate, pi: number) => periodType(t, pi) === 'past';
// const isPresent = (t: SpreadsheetTemplate, pi: number) => periodType(t, pi) === 'present';
//
// // ── deriveData ────────────────────────────────────────────────────────────────
// function deriveData(template: SpreadsheetTemplate): DerivedData {
//     const N       = template.periods.length || 1;
//     const salRow  = template.rows.find(r => r.rowType === 'salary');
//     const expRows = template.rows.filter(r => r.rowType === 'expense');
//     const CI      = Math.max(0, template.periods.findIndex((_, i) => isPresent(template, i)));
//
//     const incAll: number[] = Array.from({ length: N }, (_, i) => salRow?.values[i] ?? 0);
//     const predAll: number[] = Array.from({ length: N }, () => {
//         const rp = expRows.map(r => {
//             const past = r.values.slice(0, CI).filter((v): v is number => v !== null && v > 0);
//             if (!past.length) return 0;
//             const W = [0.4, 0.3, 0.2, 0.1]; const rc = past.slice(-4);
//             const ws = rc.reduce((s, v, wi) => s + v * (W[W.length - rc.length + wi] ?? 0.1), 0);
//             const wt = rc.reduce((s, _, wi) => s + (W[W.length - rc.length + wi] ?? 0.1), 0);
//             return wt > 0 ? ws / wt : past[past.length - 1];
//         });
//         return Math.round(rp.reduce((a, b) => a + b, 0));
//     });
//     const expAll: number[] = Array.from({ length: N }, (_, i) => {
//         const total = expRows.reduce((s, r) => s + (r.values[i] ?? 0), 0);
//         return total > 0 ? total : predAll[i];
//     });
//
//     const netAll = expAll.map((e, i) => incAll[i] - e);
//     const predNetAll = predAll.map((p, i) => incAll[i] - p);
//
//     let bal = 0, predBal = 0, sav = 0, predSav = 0;
//     const balTraj: number[] = [], predBalTraj: number[] = [], savTraj: number[] = [], predSavTraj: number[] = [];
//     for (let i = 0; i < N; i++) {
//         bal += netAll[i]; predBal += predNetAll[i];
//         sav += Math.max(0, netAll[i]); predSav += Math.max(0, predNetAll[i]);
//         balTraj.push(Math.round(bal)); predBalTraj.push(Math.round(predBal));
//         savTraj.push(Math.round(sav)); predSavTraj.push(Math.round(predSav));
//     }
//
//     const futureEntered = expRows.flatMap(r =>
//         r.values.map((v, i) => isFuture(template, i) && v !== null && v > 0 ? v : null).filter((v): v is number => v !== null)
//     );
//     const avgFE  = futureEntered.length ? Math.round(futureEntered.reduce((a, b) => a + b, 0) / futureEntered.length) : 0;
//     const futurePredVals = predAll.filter((_, i) => isFuture(template, i));
//     const avgPF  = futurePredVals.length ? Math.round(futurePredVals.reduce((a, b) => a + b, 0) / futurePredVals.length) : 0;
//     const delta  = avgFE > 0 ? avgFE - avgPF : 0;
//
//     const catFlags: CatFlag[] = [];
//     expRows.forEach(row => {
//         const pv = row.values.map((v, i) => ({ v, i })).filter(({ v, i }) => v !== null && v > 0 && isPast(template, i)).map(({ v }) => v as number);
//         if (!pv.length) return;
//         const avg = Math.round(pv.reduce((a, b) => a + b, 0) / pv.length);
//         const fut = row.values.map((v, i) => ({ v, i })).filter(({ v, i }) => v !== null && v > 0 && isFuture(template, i));
//         if (!fut.length) return;
//         const worst = fut.reduce((a, b) => Math.abs((b.v as number) - avg) > Math.abs((a.v as number) - avg) ? b : a);
//         const pct = avg > 0 ? Math.round(((worst.v as number) - avg) / avg * 100) : 0;
//         if (Math.abs(pct) >= 15) catFlags.push({ label: row.label, color: CAT_COLORS[row.label] ?? SLATE, entered: worst.v as number, avg, pct, period: worst.i });
//     });
//     catFlags.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
//
//     const futureNet = netAll.slice(CI + 1).reduce((a, b) => a + Math.max(0, b), 0);
//     const predFutureNet = predNetAll.slice(CI + 1).reduce((a, b) => a + Math.max(0, b), 0);
//     const plans: PlanItem[] = [
//         { label: 'Car repair fund', target: 1200, byPeriod: CI + 4, color: NAVY  },
//         { label: 'Trip deposit',    target: 800,  byPeriod: CI + 5, color: AMBER },
//         { label: 'Emergency fund',  target: 2400, byPeriod: N - 1,  color: GREEN },
//     ].map(p => {
//         const alloc = clamp(Math.round(futureNet * 0.3), 0, p.target);
//         const predAlloc = clamp(Math.round(predFutureNet * 0.3), 0, p.target);
//         const pct = clamp(Math.round((alloc / p.target) * 100), 0, 100);
//         const predPct = clamp(Math.round((predAlloc / p.target) * 100), 0, 100);
//         return { ...p, pct, predPct, atRisk: pct < predPct - 8, shortfall: Math.round(p.target * (1 - pct / 100)) };
//     });
//
//     const catPredictions = expRows.map(row => {
//         const pv = row.values.slice(0, CI).filter((v): v is number => v !== null && v > 0);
//         if (!pv.length) return null;
//         const W = [0.4, 0.3, 0.2, 0.1]; const rc = pv.slice(-4);
//         const weighted = Math.round(rc.reduce((s, v, wi) => s + v * (W[W.length - rc.length + wi] ?? 0.1), 0) / rc.reduce((s, _, wi) => s + (W[W.length - rc.length + wi] ?? 0.1), 0));
//         const variance = Math.round(Math.sqrt(pv.reduce((s, v) => s + Math.pow(v - weighted, 2), 0) / pv.length));
//         const conf = clamp(100 - Math.round((variance / Math.max(weighted, 1)) * 100), 40, 97);
//         return { label: row.label, color: CAT_COLORS[row.label] ?? SLATE, weighted, variance, conf, periods: pv.length };
//     }).filter((x): x is NonNullable<typeof x> => x !== null);
//
//     return {
//         expAll, predAll, incAll, netAll, predNetAll, balTraj, predBalTraj, savTraj, predSavTraj,
//         presentIdx: CI, endBal: balTraj[N-1] ?? 0, predEndBal: predBalTraj[N-1] ?? 0, endSav: savTraj[N-1] ?? 0,
//         avgInc: Math.round(sum(incAll) / N), avgExp: Math.round(sum(expAll) / N),
//         curExp: expAll[CI] ?? 0, savRate: incAll[CI] > 0 ? Math.round(((incAll[CI] - (expAll[CI] ?? 0)) / incAll[CI]) * 100) : 0,
//         delta, catFlags, plans, catPredictions,
//     };
// }
//
// // ── Shared sub-components ─────────────────────────────────────────────────────
// const SectionHead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
//     <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: alpha(MAROON, 0.6), mb: 1.5 }}>
//         {children}
//     </Typography>
// );
//
// const ProgBar: React.FC<{ pct: number; color: string; trackColor?: string }> = ({ pct, color, trackColor }) => (
//     <LinearProgress variant="determinate" value={clamp(pct, 0, 100)} sx={{
//         height: 5, borderRadius: 3,
//         bgcolor: trackColor ?? alpha(color, 0.15),
//         '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
//     }} />
// );
//
// const FlagCard: React.FC<{ color: string; title: string; sub: string }> = ({ color, title, sub }) => (
//     <Box sx={{ p: '9px 11px', mb: 1, borderLeft: `3px solid ${color}`, borderTop: `0.5px solid ${alpha(color, 0.25)}`, borderRight: `0.5px solid ${alpha(color, 0.25)}`, borderBottom: `0.5px solid ${alpha(color, 0.25)}`, borderRadius: '0 8px 8px 0', bgcolor: alpha(color, 0.04) }}>
//         <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color, mb: 0.25 }}>{title}</Typography>
//         <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>{sub}</Typography>
//     </Box>
// );
//
// const PlanRow: React.FC<{ plan: PlanItem }> = ({ plan }) => {
//     const sc = plan.pct >= 90 ? GREEN : plan.atRisk ? RED : AMBER;
//     return (
//         <Box sx={{ p: '9px 11px', mb: 0.75, borderRadius: '10px', border: `0.5px solid ${plan.atRisk ? alpha(RED, 0.35) : alpha('#000', 0.1)}`, bgcolor: plan.atRisk ? alpha(RED, 0.04) : 'transparent' }}>
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                     <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: plan.color, flexShrink: 0 }} />
//                     <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: plan.atRisk ? RED : 'text.primary' }}>{plan.label}</Typography>
//                 </Box>
//                 <Chip label={plan.pct >= 90 ? 'on track' : plan.atRisk ? 'at risk' : 'reduced'} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(sc, 0.12), color: sc }} />
//             </Box>
//             <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
//                 target {fmt(plan.target)}{plan.shortfall > 0 ? ` · ${fmt(plan.shortfall)} needed` : ' · fully funded'}
//             </Typography>
//             <Box sx={{ position: 'relative', height: 5, borderRadius: 2, bgcolor: alpha('#000', 0.07) }}>
//                 <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2, width: `${plan.predPct}%`, bgcolor: alpha('#000', 0.18) }} />
//                 <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2, width: `${plan.pct}%`, bgcolor: sc, transition: 'width .4s' }} />
//             </Box>
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
//                 <Typography variant="caption" color="text.secondary">baseline {plan.predPct}%</Typography>
//                 <Typography variant="caption" sx={{ fontWeight: 700, color: sc }}>{plan.pct}% on your data</Typography>
//             </Box>
//         </Box>
//     );
// };
//
// // ── Chart hook ────────────────────────────────────────────────────────────────
// function useChart(ref: React.RefObject<HTMLCanvasElement>, config: any, deps: React.DependencyList) {
//     const chartRef = useRef<Chart | null>(null);
//     useEffect(() => {
//         if (!ref.current) return;
//         chartRef.current?.destroy();
//         chartRef.current = new Chart(ref.current, config);
//         return () => { chartRef.current?.destroy(); chartRef.current = null; };
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, deps);
// }
//
// function chartDefaults() {
//     return {
//         responsive: true, maintainAspectRatio: false,
//         plugins: {
//             legend: { display: false },
//             tooltip: { backgroundColor: '#fff', borderColor: 'rgba(0,0,0,.1)', borderWidth: 0.5, titleColor: '#1e293b', bodyColor: '#64748b', padding: 9, cornerRadius: 7, callbacks: { label: (ctx: any) => ' ' + (ctx.parsed.y < 0 ? '-' : '') + '$' + Math.round(Math.abs(ctx.parsed.y)).toLocaleString() } },
//         },
//         scales: {
//             x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 }, maxRotation: 45, autoSkip: false } },
//             y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 }, callback: (v: any) => (v < 0 ? '-' : '') + '$' + Math.round(Math.abs(v)).toLocaleString() } },
//         },
//     };
// }
//
// // ── Inline sparkline (pure SVG, no Chart.js) ──────────────────────────────────
// const Sparkline: React.FC<{ values: (number | null)[]; color: string; width?: number; height?: number; isPredicted?: boolean }> = ({
//                                                                                                                                        values, color, width = 72, height = 28, isPredicted = false,
//                                                                                                                                    }) => {
//     const pts = values.map((v, i) => v !== null ? { x: i, y: v } : null).filter((p): p is { x: number; y: number } => p !== null);
//     if (pts.length < 2) return <Box sx={{ width, height, display: 'inline-block' }} />;
//     const xs = pts.map(p => p.x); const ys = pts.map(p => p.y);
//     const minY = Math.min(...ys); const maxY = Math.max(...ys);
//     const rangeY = maxY - minY || 1; const rangeX = Math.max(...xs) - Math.min(...xs) || 1;
//     const px = (x: number) => ((x - Math.min(...xs)) / rangeX) * (width - 4) + 2;
//     const py = (y: number) => (1 - (y - minY) / rangeY) * (height - 4) + 2;
//     const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ');
//     const trend = ys.length >= 2 ? ys[ys.length - 1] - ys[0] : 0;
//     return (
//         <svg width={width} height={height} style={{ display: 'block' }}>
//             <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={isPredicted ? '3 2' : undefined} opacity={isPredicted ? 0.7 : 1} />
//             {!isPredicted && <circle cx={px(pts[pts.length - 1].x)} cy={py(pts[pts.length - 1].y)} r="2.5" fill={trend > 0 ? RED : GREEN} stroke="#fff" strokeWidth="1" />}
//         </svg>
//     );
// };
//
// // ═══════════════════════════════════════════════════════════════════════════════
// // ── SPREADSHEET MODE ───────────────────────────────────────────────────────────
// // ═══════════════════════════════════════════════════════════════════════════════
// const SpreadsheetMode: React.FC<{
//     template: SpreadsheetTemplate;
//     d: DerivedData;
//     focus: SheetFocus;
//     onFocusChange: (f: SheetFocus) => void;
//     optimizeMode: OptimizeMode;
//     onOptimizeModeChange: (m: OptimizeMode) => void;
// }> = ({ template, d, focus, onFocusChange, optimizeMode, onOptimizeModeChange }) => {
//
//     const expRows  = template.rows.filter(r => r.rowType === 'expense');
//     const N        = template.periods.length;
//     const CI       = d.presentIdx;
//
//     // Which periods to show based on focus
//     const shownPeriods: number[] = focus === 'historical'
//         ? template.periods.map((_, i) => i).filter(i => periodType(template, i) !== 'future')
//         : template.periods.map((_, i) => i).filter(i => periodType(template, i) !== 'past');
//
//     // Budget impact: how each future category's predicted vs actual delta affects end balance
//     const budgetImpact = useMemo(() => {
//         return expRows.map(row => {
//             const pastVals = row.values.map((v, i) => ({ v, i })).filter(({ v, i }) => v !== null && v > 0 && isPast(template, i)).map(({ v }) => v as number);
//             const avg = pastVals.length ? Math.round(pastVals.reduce((a, b) => a + b, 0) / pastVals.length) : null;
//             const futureDelta = shownPeriods
//                 .filter(i => isFuture(template, i))
//                 .reduce((s, i) => {
//                     const actual = row.values[i] ?? 0;
//                     const pred   = d.predAll[i] > 0 ? (d.predAll[i] / Math.max(expRows.reduce((ss, r) => ss + (r.values[i] ?? 0), 0), 1)) * (d.predAll[i]) : 0;
//                     return s + (actual - (avg ?? 0));
//                 }, 0);
//             return { label: row.label, avg, futureDelta: Math.round(futureDelta) };
//         });
//     }, [expRows, shownPeriods, d, template]);
//
//     // Trend direction per row (past only)
//     function trendDir(vals: (number | null)[]): 'up' | 'down' | 'flat' {
//         const vs = vals.filter((v): v is number => v !== null && v > 0);
//         if (vs.length < 2) return 'flat';
//         const half = Math.floor(vs.length / 2);
//         const early = vs.slice(0, half).reduce((a, b) => a + b, 0) / half;
//         const late  = vs.slice(half).reduce((a, b) => a + b, 0) / (vs.length - half);
//         if (late > early * 1.08) return 'up';
//         if (late < early * 0.92) return 'down';
//         return 'flat';
//     }
//
//     // Auto-optimize suggestions
//     const autoSuggestions = useMemo(() => {
//         return expRows
//             .map(row => {
//                 const pv = row.values.map((v, i) => ({ v, i })).filter(({ v, i }) => v !== null && v > 0 && isPast(template, i)).map(({ v }) => v as number);
//                 if (pv.length < 2) return null;
//                 const avg = Math.round(pv.reduce((a, b) => a + b, 0) / pv.length);
//                 const trend = trendDir(row.values);
//                 const suggestedCut = trend === 'up' ? Math.round(avg * 0.9) : null;
//                 return suggestedCut !== null ? { label: row.label, current: avg, suggested: suggestedCut, savings: avg - suggestedCut } : null;
//             })
//             .filter((x): x is NonNullable<typeof x> => x !== null)
//             .sort((a, b) => b.savings - a.savings)
//             .slice(0, 4);
//     }, [expRows, template]);
//
//     const totalAutoSavings = autoSuggestions.reduce((s, x) => s + x.savings, 0);
//
//     return (
//         <Box>
//             {/* ── Focus toggle: Historical / Future ── */}
//             <Box sx={{ display: 'flex', gap: '5px', mb: 2 }}>
//                 {([['historical', 'Historical trends'], ['future', 'Future projections']] as [SheetFocus, string][]).map(([key, label]) => (
//                     <Box key={key} onClick={() => onFocusChange(key)} sx={{
//                         flex: 1, py: '7px', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700,
//                         cursor: 'pointer', borderRadius: '8px', transition: 'all .12s', userSelect: 'none',
//                         border: `1px solid ${focus === key ? alpha(MAROON, 0.35) : alpha('#000', 0.12)}`,
//                         bgcolor: focus === key ? alpha(MAROON, 0.07) : 'transparent',
//                         color:   focus === key ? MAROON : SLATE,
//                         '&:hover': focus !== key ? { bgcolor: alpha(MAROON, 0.04) } : {},
//                     }}>{label}</Box>
//                 ))}
//             </Box>
//
//             {/* ── Category × Period table ── */}
//             <Box sx={{ mb: 2, overflow: 'hidden', borderRadius: '10px', border: `1px solid ${alpha('#000', 0.1)}` }}>
//
//                 {/* Table header */}
//                 <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr 72px', bgcolor: '#f7f6f5', borderBottom: `1px solid ${alpha('#000', 0.08)}`, px: 1.5, py: 0.875 }}>
//                     <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Category</Typography>
//                     <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center' }}>
//                         {focus === 'historical' ? 'Trend' : 'Projection'}
//                     </Typography>
//                     <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>
//                         {focus === 'historical' ? 'Avg' : 'Pred'}
//                     </Typography>
//                 </Box>
//
//                 {/* Category rows */}
//                 {expRows.map((row, ri) => {
//                     const color    = CAT_COLORS[row.label] ?? SLATE;
//                     const vals     = shownPeriods.map(i => row.values[i] ?? null);
//                     const predVals = shownPeriods.map(i => isFuture(template, i) ? d.predAll[i] / Math.max(expRows.reduce((s, r) => s + (r.values[i] ?? 0), 0), 1) * (row.values[i] ?? d.predAll[i] / expRows.length) : null);
//                     const trend    = trendDir(row.values);
//                     const pv       = row.values.map((v, i) => ({ v, i })).filter(({ v, i }) => v !== null && v > 0 && isPast(template, i)).map(({ v }) => v as number);
//                     const avg      = pv.length ? Math.round(pv.reduce((a, b) => a + b, 0) / pv.length) : null;
//                     const pred     = d.catPredictions.find(c => c.label === row.label);
//                     const displayVal = focus === 'historical' ? (avg !== null ? fmt(avg) : '—') : (pred ? fmt(pred.weighted) : '—');
//                     const trendColor = trend === 'up' ? RED : trend === 'down' ? GREEN : SLATE;
//                     const trendIcon  = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
//
//                     return (
//                         <Box key={row.label} sx={{
//                             display: 'grid', gridTemplateColumns: '120px 1fr 72px',
//                             px: 1.5, py: 0.875,
//                             borderBottom: ri < expRows.length - 1 ? `0.5px solid ${alpha('#000', 0.05)}` : 'none',
//                             '&:hover': { bgcolor: alpha(color, 0.03) },
//                             transition: 'background .1s',
//                         }}>
//                             {/* Name + trend icon */}
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
//                                 <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
//                                 <Typography sx={{ fontSize: '0.78rem', color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                                     {row.label}
//                                 </Typography>
//                                 <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: trendColor, flexShrink: 0 }}>
//                                     {trendIcon}
//                                 </Typography>
//                             </Box>
//
//                             {/* Sparkline */}
//                             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                                 {focus === 'historical' ? (
//                                     <Sparkline values={vals} color={color} />
//                                 ) : (
//                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                                         <Sparkline values={vals.map(v => v)} color={alpha(color, 0.4)} width={36} />
//                                         <Sparkline values={shownPeriods.map(i => isFuture(template, i) ? (pred?.weighted ?? null) : null)} color={color} width={36} isPredicted />
//                                     </Box>
//                                 )}
//                             </Box>
//
//                             {/* Avg / pred value */}
//                             <Box sx={{ textAlign: 'right' }}>
//                                 <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>
//                                     {displayVal}
//                                 </Typography>
//                                 {focus === 'future' && pred && (
//                                     <Typography sx={{ fontSize: '0.62rem', color: pred.conf >= 80 ? GREEN : pred.conf >= 60 ? AMBER : RED }}>
//                                         {pred.conf}% conf
//                                     </Typography>
//                                 )}
//                             </Box>
//                         </Box>
//                     );
//                 })}
//             </Box>
//
//             {/* ── Budget impact panel ── */}
//             <Box sx={{ mb: 2, borderRadius: '10px', border: `1px solid ${alpha('#000', 0.1)}`, overflow: 'hidden' }}>
//                 <Box sx={{ px: 1.5, py: 1, bgcolor: '#f7f6f5', borderBottom: `0.5px solid ${alpha('#000', 0.08)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                     <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Budget impact</Typography>
//                     <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: d.endBal >= d.predEndBal ? GREEN : RED, fontVariantNumeric: 'tabular-nums' }}>
//                         {d.endBal >= d.predEndBal ? '+' : ''}{fmt(d.endBal - d.predEndBal)} vs baseline
//                     </Typography>
//                 </Box>
//                 <Box sx={{ px: 1.5, py: 1.25 }}>
//                     {/* Balance trajectory mini-summary */}
//                     <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 1.25 }}>
//                         {[
//                             { label: 'End balance',    val: fmt(d.endBal),    color: d.endBal >= 0 ? GREEN : RED },
//                             { label: 'Baseline pred.', val: fmt(d.predEndBal), color: NAVY },
//                             { label: 'Savings rate',   val: `${d.savRate}%`,  color: d.savRate >= 10 ? GREEN : AMBER },
//                         ].map((k, i) => (
//                             <Box key={i} sx={{ textAlign: 'center', p: '6px 4px', borderRadius: '7px', bgcolor: alpha('#000', 0.02), border: `0.5px solid ${alpha('#000', 0.07)}` }}>
//                                 <Typography sx={{ fontSize: '0.6rem', color: SLATE, mb: 0.25 }}>{k.label}</Typography>
//                                 <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: k.color, fontVariantNumeric: 'tabular-nums' }}>{k.val}</Typography>
//                             </Box>
//                         ))}
//                     </Box>
//
//                     {/* Top deviating categories that affect the plan */}
//                     {d.catFlags.slice(0, 3).map(f => {
//                         const over = f.pct > 0;
//                         const col  = Math.abs(f.pct) > 40 ? RED : AMBER;
//                         return (
//                             <Box key={f.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, borderBottom: `0.5px solid ${alpha('#000', 0.05)}` }}>
//                                 <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: CAT_COLORS[f.label] ?? SLATE, flexShrink: 0 }} />
//                                 <Typography sx={{ fontSize: '0.75rem', flex: 1, color: NAVY }}>{f.label}</Typography>
//                                 <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: over ? col : GREEN }}>
//                                     {over ? '+' : ''}{f.pct}%
//                                 </Typography>
//                                 <Typography sx={{ fontSize: '0.7rem', color: SLATE, fontVariantNumeric: 'tabular-nums' }}>
//                                     {over ? '−' : '+'}{fmt(Math.abs(f.entered - f.avg))} impact
//                                 </Typography>
//                             </Box>
//                         );
//                     })}
//                     {d.catFlags.length === 0 && (
//                         <Typography sx={{ fontSize: '0.75rem', color: SLATE, textAlign: 'center', py: 0.5 }}>
//                             No significant deviations — budget on track
//                         </Typography>
//                     )}
//                 </Box>
//             </Box>
//
//             {/* ── Optimize section ── */}
//             <Box sx={{ borderRadius: '10px', border: `1px solid ${alpha(MAROON, 0.18)}`, overflow: 'hidden' }}>
//                 {/* Header */}
//                 <Box sx={{ background: `linear-gradient(90deg, ${alpha(MAROON, 0.06)} 0%, transparent 100%)`, px: 1.5, py: 1, borderBottom: `0.5px solid ${alpha(MAROON, 0.1)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875 }}>
//                         <AutoFixHighIcon sx={{ fontSize: '0.95rem', color: MAROON }} />
//                         <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: MAROON }}>Budget optimizer</Typography>
//                     </Box>
//                     {/* Auto / Manual toggle */}
//                     <Box sx={{ display: 'flex', border: `1px solid ${alpha('#000', 0.13)}`, borderRadius: '6px', overflow: 'hidden' }}>
//                         {([['auto', 'Auto'] as const, ['manual', 'Manual'] as const]).map(([key, label]) => (
//                             <Box key={key} onClick={() => onOptimizeModeChange(key)} sx={{
//                                 px: 1.125, py: 0.35, fontSize: '0.7rem', fontWeight: 700,
//                                 cursor: 'pointer', userSelect: 'none',
//                                 bgcolor: optimizeMode === key ? MAROON : '#fff',
//                                 color:   optimizeMode === key ? '#fff' : SLATE,
//                                 borderRight: key === 'auto' ? `1px solid ${alpha('#000', 0.1)}` : 'none',
//                                 transition: 'all .12s',
//                                 '&:hover': optimizeMode !== key ? { bgcolor: alpha(MAROON, 0.06), color: MAROON } : {},
//                             }}>{label}</Box>
//                         ))}
//                     </Box>
//                 </Box>
//
//                 {/* Auto mode body */}
//                 {optimizeMode === 'auto' && (
//                     <Box sx={{ px: 1.5, py: 1.25 }}>
//                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.125 }}>
//                             <Typography sx={{ fontSize: '0.72rem', color: SLATE }}>
//                                 Suggested cuts based on upward trends
//                             </Typography>
//                             {totalAutoSavings > 0 && (
//                                 <Box sx={{ px: 0.875, py: '2px', borderRadius: '10px', bgcolor: alpha(GREEN, 0.1), border: `0.5px solid ${alpha(GREEN, 0.25)}` }}>
//                                     <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: GREEN }}>+{fmt(totalAutoSavings)}/period</Typography>
//                                 </Box>
//                             )}
//                         </Box>
//
//                         {autoSuggestions.length === 0 ? (
//                             <Box sx={{ py: 1.5, textAlign: 'center' }}>
//                                 <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: alpha(GREEN, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 0.75 }}>
//                                     <Typography sx={{ fontSize: '1rem', color: GREEN }}>✓</Typography>
//                                 </Box>
//                                 <Typography sx={{ fontSize: '0.75rem', color: SLATE }}>No optimization needed — spending stable</Typography>
//                             </Box>
//                         ) : (
//                             autoSuggestions.map(s => {
//                                 const savePct = Math.round((s.savings / s.current) * 100);
//                                 return (
//                                     <Box key={s.label} sx={{ mb: 1, pb: 1, borderBottom: `0.5px solid ${alpha('#000', 0.06)}`, '&:last-child': { mb: 0, pb: 0, borderBottom: 'none' } }}>
//                                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.4 }}>
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625 }}>
//                                                 <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: CAT_COLORS[s.label] ?? SLATE, flexShrink: 0 }} />
//                                                 <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: NAVY }}>{s.label}</Typography>
//                                             </Box>
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                                                 <Typography sx={{ fontSize: '0.72rem', color: alpha(SLATE, 0.6), textDecoration: 'line-through', fontVariantNumeric: 'tabular-nums' }}>{fmt(s.current)}</Typography>
//                                                 <Typography sx={{ fontSize: '0.6rem', color: SLATE }}>→</Typography>
//                                                 <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: GREEN, fontVariantNumeric: 'tabular-nums' }}>{fmt(s.suggested)}</Typography>
//                                                 <Box sx={{ px: 0.625, py: '1px', borderRadius: '4px', bgcolor: alpha(GREEN, 0.1) }}>
//                                                     <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: GREEN }}>−{savePct}%</Typography>
//                                                 </Box>
//                                             </Box>
//                                         </Box>
//                                         <Box sx={{ position: 'relative', height: 4, bgcolor: alpha('#000', 0.07), borderRadius: '3px', overflow: 'hidden' }}>
//                                             <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.round((s.suggested / s.current) * 100)}%`, bgcolor: GREEN, borderRadius: '3px' }} />
//                                         </Box>
//                                         <Typography sx={{ fontSize: '0.65rem', color: alpha(SLATE, 0.65), mt: 0.3 }}>
//                                             Trending up · reduce by {fmt(s.savings)}/period
//                                         </Typography>
//                                     </Box>
//                                 );
//                             })
//                         )}
//                     </Box>
//                 )}
//
//                 {/* Manual mode — coming soon */}
//                 {optimizeMode === 'manual' && (
//                     <Box sx={{ px: 1.5, py: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
//                         <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: alpha(MAROON, 0.07), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                             <AutoFixHighIcon sx={{ fontSize: '1.25rem', color: alpha(MAROON, 0.4) }} />
//                         </Box>
//                         <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>Manual optimization</Typography>
//                         <Typography sx={{ fontSize: '0.75rem', color: SLATE, textAlign: 'center', maxWidth: 240, lineHeight: 1.5 }}>
//                             Set custom targets for each category and simulate how the changes affect your end balance and savings goals.
//                         </Typography>
//                         <Box sx={{ px: 1.5, py: 0.625, borderRadius: '20px', bgcolor: alpha(AMBER, 0.1), border: `1px solid ${alpha(AMBER, 0.25)}` }}>
//                             <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: AMBER }}>Coming soon</Typography>
//                         </Box>
//                     </Box>
//                 )}
//             </Box>
//         </Box>
//     );
// };
//
// // ═══════════════════════════════════════════════════════════════════════════════
// // ── Standard forecast views (Review / Predict / Ripple) ───────────────────────
// // ═══════════════════════════════════════════════════════════════════════════════
// const LiveReviewView: React.FC<{ template: SpreadsheetTemplate; d: DerivedData }> = ({ template, d }) => {
//     const flags: { color: string; title: string; sub: string }[] = [];
//     if (d.delta > 100) flags.push({ color: RED, title: `Future spend ${fmt(d.delta)}/period over prediction`, sub: `Your entered values average ${fmt(d.delta)} above the predicted budget across ${template.periods.filter((_, i) => isFuture(template, i)).length} remaining periods.` });
//     else if (d.delta > 30) flags.push({ color: AMBER, title: 'Spending elevated in future periods', sub: `Entered values are ${fmt(d.delta)} above prediction on average.` });
//     else flags.push({ color: GREEN, title: 'Future spend matches prediction', sub: 'All entered values align with predicted budget.' });
//     d.plans.filter(p => p.atRisk).forEach(p => flags.push({ color: RED, title: `${p.label} at risk`, sub: `Current trajectory funds ${p.pct}% vs ${p.predPct}% baseline — ${fmt(p.shortfall)} short.` }));
//
//     return (
//         <Box>
//             <SectionHead>Entered vs prediction</SectionHead>
//             {d.catFlags.length === 0 && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>No future cells entered yet.</Typography>}
//             {d.catFlags.slice(0, 5).map(f => {
//                 const over = f.pct > 0; const col = Math.abs(f.pct) > 40 ? RED : AMBER;
//                 const barPct = clamp(Math.round((f.entered / Math.max(f.avg * 1.6, 1)) * 100), 0, 100);
//                 const avgPct = clamp(Math.round((f.avg / Math.max(f.avg * 1.6, 1)) * 100), 0, 100);
//                 return (
//                     <Box key={f.label} sx={{ p: '9px 11px', mb: 0.75, borderRadius: '10px', border: `0.5px solid ${over ? alpha(col, 0.35) : alpha(GREEN, 0.25)}`, bgcolor: over ? alpha(col, 0.04) : alpha(GREEN, 0.03) }}>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
//                             <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: f.color, flexShrink: 0 }} />
//                             <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, flex: 1 }}>{f.label}</Typography>
//                             <Chip label={`${over ? '+' : ''}${f.pct}%`} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(over ? col : GREEN, 0.12), color: over ? col : GREEN }} />
//                         </Box>
//                         <Box sx={{ position: 'relative', height: 4, borderRadius: 2, bgcolor: alpha('#000', 0.07), mb: 0.5 }}>
//                             <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${avgPct}%`, bgcolor: PAST_C, borderRadius: 2 }} />
//                             <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${barPct}%`, bgcolor: over ? col : GREEN, borderRadius: 2 }} />
//                         </Box>
//                         <Typography variant="caption" color="text.secondary">entered {fmt(f.entered)} · avg {fmt(f.avg)} · period {f.period + 1}</Typography>
//                     </Box>
//                 );
//             })}
//             <Divider sx={{ my: 2, borderColor: alpha(MAROON, 0.08) }} />
//             <SectionHead>Review flags</SectionHead>
//             {flags.map((f, i) => <FlagCard key={i} {...f} />)}
//             <Divider sx={{ my: 2, borderColor: alpha(MAROON, 0.08) }} />
//             <SectionHead>Payment plan status</SectionHead>
//             {d.plans.map(p => <PlanRow key={p.label} plan={p} />)}
//         </Box>
//     );
// };
//
// const PredictView: React.FC<{ template: SpreadsheetTemplate; d: DerivedData }> = ({ template, d }) => (
//     <Box>
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: '8px 11px', borderRadius: '8px', border: `0.5px solid ${alpha(NAVY, 0.2)}`, bgcolor: alpha(NAVY, 0.04), mb: 2 }}>
//             <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: NAVY, flexShrink: 0 }} />
//             <Typography variant="caption" color="text.secondary">Weighted-recent model · {template.periods.filter((_, i) => isFuture(template, i)).length} unfilled periods</Typography>
//         </Box>
//         <SectionHead>Predicted values — unfilled periods</SectionHead>
//         {d.catPredictions.map(c => {
//             const cc = c.conf >= 80 ? GREEN : c.conf >= 60 ? AMBER : RED;
//             return (
//                 <Box key={c.label} sx={{ p: '9px 11px', mb: 0.75, borderRadius: '10px', border: `0.5px solid ${alpha('#000', 0.1)}` }}>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                             <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: c.color, flexShrink: 0 }} />
//                             <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{c.label}</Typography>
//                         </Box>
//                         <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
//                             {fmt(c.weighted)}<Typography component="span" variant="caption" color="text.secondary"> ±{fmt(c.variance)}</Typography>
//                         </Typography>
//                     </Box>
//                     <ProgBar pct={c.conf} color={cc} />
//                     <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
//                         {c.conf}% confidence · {c.periods} past period{c.periods !== 1 ? 's' : ''}
//                     </Typography>
//                 </Box>
//             );
//         })}
//         <Divider sx={{ my: 2, borderColor: alpha(MAROON, 0.08) }} />
//         <SectionHead>Prediction signals</SectionHead>
//         {[
//             { on: true,  label: 'Weighted recent — last 3 periods' },
//             { on: true,  label: 'Lock manually entered future cells' },
//             { on: true,  label: 'Fixed cost detection' },
//             { on: false, label: 'Seasonal pattern detection' },
//             { on: false, label: 'Income-linked scaling' },
//         ].map((s, i) => (
//             <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, borderBottom: `0.5px solid ${alpha('#000', 0.06)}` }}>
//                 <Box sx={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0, border: `1.5px solid ${s.on ? GREEN : alpha('#000', 0.2)}`, bgcolor: s.on ? alpha(GREEN, 0.1) : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                     {s.on && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: GREEN }} />}
//                 </Box>
//                 <Typography sx={{ fontSize: '0.72rem', color: s.on ? 'text.primary' : 'text.secondary' }}>{s.label}</Typography>
//             </Box>
//         ))}
//     </Box>
// );
//
// const RippleView: React.FC<{ template: SpreadsheetTemplate; d: DerivedData }> = ({ template, d }) => {
//     const [view, setView] = useState<RippleView>('balance');
//     const ref = useRef<HTMLCanvasElement>(null);
//     const labels = template.periods;
//     const CI = d.presentIdx;
//     const userColor = d.delta > 50 ? RED : GREEN;
//
//     const datasets: Record<RippleView, any[]> = {
//         balance: [
//             { data: d.balTraj.map((v, i) => i <= CI ? v : null),     borderColor: MAROON,    borderWidth: 2.5, fill: false, pointRadius: 3, pointBackgroundColor: MAROON,    tension: 0.4 },
//             { data: d.predBalTraj.map((v, i) => i >= CI ? v : null), borderColor: PROJ,      borderWidth: 1.5, borderDash: [5,3], fill: false, pointRadius: 2, tension: 0.4 },
//             { data: d.balTraj.map((v, i) => i >= CI ? v : null),     borderColor: userColor, borderWidth: 2.5, fill: false, pointRadius: 3, pointBackgroundColor: userColor, tension: 0.4 },
//         ],
//         savings: [
//             { data: d.savTraj.map((v, i) => i <= CI ? v : null),     borderColor: GREEN, borderWidth: 2.5, fill: false, pointRadius: 3, tension: 0.4 },
//             { data: d.predSavTraj.map((v, i) => i >= CI ? v : null), borderColor: PROJ,  borderWidth: 1.5, borderDash: [5,3], fill: false, pointRadius: 2, tension: 0.4 },
//             { data: d.savTraj.map((v, i) => i >= CI ? v : null),     borderColor: userColor, borderWidth: 2.5, fill: false, pointRadius: 3, tension: 0.4 },
//             { data: labels.map(() => 500), borderColor: AMBER, borderWidth: 1.5, borderDash: [4,3], fill: false, pointRadius: 0 },
//         ],
//         budget: [
//             { type: 'bar', data: d.incAll.map((inc, i) => inc > 0 ? Math.round(((inc - d.predAll[i]) / inc) * 100) : 0), backgroundColor: 'rgba(180,178,169,0.35)', borderRadius: 3, borderSkipped: false },
//             { type: 'bar', data: d.incAll.map((inc, i) => i >= CI && inc > 0 ? Math.round(((inc - d.expAll[i]) / inc) * 100) : null), backgroundColor: d.incAll.map((inc, i) => { const r = inc > 0 ? ((inc - d.expAll[i]) / inc) * 100 : 0; return r >= 10 ? GREEN : r >= 0 ? AMBER : RED; }), borderRadius: 3, borderSkipped: false },
//         ],
//     };
//
//     const opts: any = {
//         ...chartDefaults(),
//         ...(view === 'budget' ? { scales: { x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 }, maxRotation: 45, autoSkip: false } }, y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 }, callback: (v: any) => `${v}%` } } } } : {}),
//     };
//
//     useChart(ref, { type: view === 'budget' ? 'bar' : 'line', data: { labels, datasets: datasets[view] }, options: opts }, [d, labels, view]);
//
//     return (
//         <Box>
//             <Box sx={{ display: 'flex', gap: '5px', mb: 1.5 }}>
//                 {([['balance','Balance'],['savings','Savings'],['budget','Budget rate']] as [RippleView, string][]).map(([k, l]) => (
//                     <Box key={k} onClick={() => setView(k)} sx={{ flex: 1, py: '6px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', borderRadius: '8px', transition: 'all .12s', border: `0.5px solid ${view === k ? alpha(MAROON, 0.3) : alpha('#000', 0.1)}`, bgcolor: view === k ? alpha(MAROON, 0.06) : 'transparent', color: view === k ? MAROON : 'text.secondary', userSelect: 'none' }}>{l}</Box>
//                 ))}
//             </Box>
//             <Box sx={{ position: 'relative', width: '100%', height: 180 }}>
//                 <canvas ref={ref} />
//             </Box>
//             <Divider sx={{ my: 2, borderColor: alpha(MAROON, 0.08) }} />
//             <SectionHead>End-of-plan impact</SectionHead>
//             <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
//                 {[
//                     { label: 'Your end balance', value: fmt(d.endBal), color: d.endBal >= d.predEndBal ? GREEN : RED, sub: `pred. ${fmt(d.predEndBal)}` },
//                     { label: 'Cumulative savings', value: fmt(d.endSav), color: GREEN, sub: `${d.savRate}% rate` },
//                 ].map((k, i) => (
//                     <Box key={i} sx={{ p: 1.5, borderRadius: '10px', border: `1px solid ${alpha(k.color, 0.2)}`, bgcolor: alpha(k.color, 0.05) }}>
//                         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>{k.label}</Typography>
//                         <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: k.color, fontVariantNumeric: 'tabular-nums' }}>{k.value}</Typography>
//                         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>{k.sub}</Typography>
//                     </Box>
//                 ))}
//             </Box>
//             <SectionHead>Plan cascade</SectionHead>
//             {d.plans.map(p => <PlanRow key={p.label} plan={p} />)}
//         </Box>
//     );
// };
//
// // ═══════════════════════════════════════════════════════════════════════════════
// // ── ForecastPanel ──────────────────────────────────────────────────────────────
// // ═══════════════════════════════════════════════════════════════════════════════
// const FORECAST_MODES: { key: ForecastMode; label: string }[] = [
//     { key: 'review',  label: 'Live review' },
//     { key: 'predict', label: 'Predict'     },
//     { key: 'ripple',  label: 'Ripple'      },
// ];
//
// const ForecastPanel: React.FC<ForecastPanelProps> = ({
//                                                          template,
//                                                          selectedPeriodIndex = 0,
//                                                          defaultMode = 'review',
//                                                      }) => {
//     const [mode,           setMode]           = useState<ForecastMode>(defaultMode);
//     const [activePi,       setActivePi]       = useState(selectedPeriodIndex);
//     const [sheetMode,      setSheetMode]      = useState(true);   // ← Spreadsheet Mode toggle
//     const [sheetFocus,     setSheetFocus]     = useState<SheetFocus>('historical');
//     const [optimizeMode,   setOptimizeMode]   = useState<OptimizeMode>('auto');
//
//     useEffect(() => { setActivePi(selectedPeriodIndex); }, [selectedPeriodIndex]);
//
//     const d = useMemo(() => deriveData(template), [template]);
//     const N = template.periods.length || 1;
//     const totInc = d.incAll.reduce((a, b) => a + b, 0);
//     const totExp = d.expAll.reduce((a, b) => a + b, 0);
//
//     return (
//         <Paper elevation={0} sx={{
//             width: 440, flexShrink: 0, borderRadius: '16px', overflow: 'hidden',
//             display: 'flex', flexDirection: 'column',
//             border: `1px solid ${alpha(MAROON, 0.15)}`,
//             boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}`,
//             alignSelf: 'flex-start',
//         }}>
//
//             {/* ── Maroon header ── */}
//             <Box sx={{
//                 background: `linear-gradient(135deg, ${MAROON2} 0%, ${MAROON} 55%, #5a1515 100%)`,
//                 color: '#fff', p: 2.5, position: 'relative', overflow: 'hidden', flexShrink: 0,
//             }}>
//                 <Box sx={{ position: 'absolute', top: -20, right: -20, width: 110, height: 110, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
//
//                 {/* Title row */}
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, position: 'relative' }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
//                         <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                             <InsightsIcon sx={{ fontSize: '1rem' }} />
//                         </Box>
//                         <Box>
//                             <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>Forecast</Typography>
//                             <Typography sx={{ fontSize: '0.67rem', opacity: 0.65, mt: '1px' }}>
//                                 {template.periodType?.toLowerCase() ?? 'biweekly'} · {N} periods
//                             </Typography>
//                         </Box>
//                     </Box>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                         {/* ── Spreadsheet Mode toggle button ── */}
//                         <Box
//                             onClick={() => setSheetMode(v => !v)}
//                             sx={{
//                                 display: 'flex', alignItems: 'center', gap: 0.625,
//                                 px: 1.125, py: 0.5, borderRadius: '7px', cursor: 'pointer',
//                                 border: '1px solid',
//                                 borderColor: sheetMode ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.3)',
//                                 bgcolor: sheetMode ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.08)',
//                                 transition: 'all .15s', userSelect: 'none',
//                                 '&:hover': { bgcolor: 'rgba(255,255,255,.18)' },
//                             }}
//                         >
//                             <TableChartOutlinedIcon sx={{ fontSize: '0.85rem', color: sheetMode ? '#fff' : 'rgba(255,255,255,.75)' }} />
//                             <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: sheetMode ? '#fff' : 'rgba(255,255,255,.75)' }}>
//                                 Spreadsheet
//                             </Typography>
//                         </Box>
//                         {/* Live indicator */}
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: '6px', px: 1.125, py: 0.5, border: '1px solid rgba(255,255,255,0.2)' }}>
//                             <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#97c459' }} />
//                             <Typography sx={{ fontSize: '0.68rem', fontWeight: 700 }}>live</Typography>
//                         </Box>
//                     </Box>
//                 </Box>
//
//                 {/* Mode pills — only shown when NOT in spreadsheet mode */}
//                 {!sheetMode && (
//                     <Box sx={{ display: 'flex', gap: '5px', mb: 1.5, position: 'relative' }}>
//                         {FORECAST_MODES.map(m => (
//                             <Box key={m.key} onClick={() => setMode(m.key)} sx={{
//                                 px: '11px', py: '5px', borderRadius: '20px', border: '1px solid',
//                                 cursor: 'pointer', userSelect: 'none', fontSize: '0.68rem', fontWeight: 700, transition: 'all .12s',
//                                 borderColor: mode === m.key ? 'rgba(255,255,255,.65)' : 'rgba(255,255,255,.25)',
//                                 bgcolor:     mode === m.key ? 'rgba(255,255,255,.22)' : 'transparent',
//                                 color:       mode === m.key ? '#fff' : 'rgba(255,255,255,.65)',
//                                 '&:hover':   mode !== m.key ? { bgcolor: 'rgba(255,255,255,.12)', color: '#fff' } : {},
//                             }}>{m.label}</Box>
//                         ))}
//                     </Box>
//                 )}
//
//                 {/* Spreadsheet mode subheader */}
//                 {sheetMode && (
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5, px: 0.25 }}>
//                         <TableChartOutlinedIcon sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,.6)' }} />
//                         <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.75)', fontWeight: 600 }}>
//                             Category analysis · trends · projections · optimizer
//                         </Typography>
//                     </Box>
//                 )}
//
//                 {/* Period picker */}
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, position: 'relative' }}>
//                     <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>Period</Typography>
//                     <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                         <Box onClick={() => setActivePi(p => Math.max(0, p - 1))} sx={{ width: 22, height: 22, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', userSelect: 'none', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' }, opacity: activePi === 0 ? 0.35 : 1 }}>‹</Box>
//                         <Box sx={{ flex: 1, display: 'flex', gap: '3px', overflow: 'hidden' }}>
//                             {(() => {
//                                 const total = N; const window = 5;
//                                 const start = Math.max(0, Math.min(activePi - 2, total - window));
//                                 const end   = Math.min(total, start + window);
//                                 return template.periods.slice(start, end).map((p, i) => {
//                                     const pi = start + i; const isActive = pi === activePi; const isCurrent = isPresent(template, pi);
//                                     return (
//                                         <Box key={pi} onClick={() => setActivePi(pi)} sx={{ flex: 1, py: '3px', borderRadius: '5px', textAlign: 'center', cursor: 'pointer', border: '1px solid', transition: 'all .12s', userSelect: 'none', borderColor: isActive ? 'rgba(255,255,255,.75)' : isCurrent ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.2)', bgcolor: isActive ? 'rgba(255,255,255,.22)' : isCurrent ? 'rgba(255,255,255,.08)' : 'transparent', '&:hover': !isActive ? { bgcolor: 'rgba(255,255,255,.1)' } : {} }}>
//                                             <Typography sx={{ fontSize: '0.58rem', fontWeight: isActive ? 800 : 500, color: isActive ? '#fff' : 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p}</Typography>
//                                             {isCurrent && <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#fff', mx: 'auto', mt: '2px', opacity: 0.7 }} />}
//                                         </Box>
//                                     );
//                                 });
//                             })()}
//                         </Box>
//                         <Box onClick={() => setActivePi(p => Math.min(N - 1, p + 1))} sx={{ width: 22, height: 22, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', userSelect: 'none', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' }, opacity: activePi === N - 1 ? 0.35 : 1 }}>›</Box>
//                     </Box>
//                 </Box>
//
//                 {/* KPI strip */}
//                 <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0.75, position: 'relative' }}>
//                     {[
//                         { label: 'Avg income', value: `$${Math.round(totInc / N).toLocaleString()}` },
//                         { label: 'Avg spend',  value: `$${Math.round(totExp / N).toLocaleString()}` },
//                         { label: 'Balance',    value: `$${Math.round(d.endBal).toLocaleString()}`   },
//                         { label: 'Saved %',    value: `${d.savRate}%`                               },
//                     ].map(k => (
//                         <Box key={k.label} sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '7px', p: '6px 7px', textAlign: 'center' }}>
//                             <Typography sx={{ fontSize: '0.58rem', opacity: 0.65, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>{k.label}</Typography>
//                             <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', mt: '2px' }}>{k.value}</Typography>
//                         </Box>
//                     ))}
//                 </Box>
//             </Box>
//
//             {/* ── Scrollable body ── */}
//             <Box sx={{
//                 flex: 1, overflowY: 'auto', p: 2.5, bgcolor: '#fff',
//                 maxHeight: 'calc(100vh - 300px)',
//                 '&::-webkit-scrollbar': { width: 6 },
//                 '&::-webkit-scrollbar-track': { bgcolor: 'rgba(0,0,0,0.03)' },
//                 '&::-webkit-scrollbar-thumb': { bgcolor: TEAL, borderRadius: 3, '&:hover': { bgcolor: TEAL2 } },
//             }}>
//                 {sheetMode ? (
//                     <SpreadsheetMode
//                         template={template}
//                         d={d}
//                         focus={sheetFocus}
//                         onFocusChange={setSheetFocus}
//                         optimizeMode={optimizeMode}
//                         onOptimizeModeChange={setOptimizeMode}
//                     />
//                 ) : (
//                     <>
//                         {mode === 'review'  && <LiveReviewView template={template} d={d} />}
//                         {mode === 'predict' && <PredictView    template={template} d={d} />}
//                         {mode === 'ripple'  && <RippleView     template={template} d={d} />}
//                     </>
//                 )}
//             </Box>
//         </Paper>
//     );
// };
//
// export default ForecastPanel;
//
// // // ── ForecastPanel.tsx ─────────────────────────────────────────────────────────
// // // Standalone right-column forecast panel.
// // // Render as a SIBLING of PlanningView — never nested inside it.
// // //
// // // BudgetPlanner layout:
// // //   <Box sx={{ display:'flex', alignItems:'flex-start', gap: 2.5 }}>
// // //     <Box sx={{ flex: 1, minWidth: 0 }}><PlanningView ... /></Box>
// // //     <ForecastPanel template={currentTemplate} selectedPeriodIndex={selectedPeriodIndex} />
// // //   </Box>
// // //
// // // All data is READ-ONLY from the template prop.
// // // No user-adjustable category inputs exist in this component.
// // // The panel re-derives everything on every render when template changes.
// // // ─────────────────────────────────────────────────────────────────────────────
// //
// // import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
// // import {
// //     Box, Paper, Typography, Divider, Stack, Chip, LinearProgress, Card,
// // } from '@mui/material';
// // import { alpha } from '@mui/material/styles';
// // import InsightsIcon from '@mui/icons-material/Insights';
// // import { Chart, registerables } from 'chart.js';
// // import type { SpreadsheetTemplate } from '../domain/SpreadsheetTypes';
// //
// // Chart.register(...registerables);
// //
// // // ── Tokens ────────────────────────────────────────────────────────────────────
// // const MAROON  = '#6b1a1a';
// // const MAROON2 = '#4a1010';
// // const TEAL    = '#0d9488';
// // const TEAL2   = '#0f766e';
// // const GREEN   = '#059669';
// // const AMBER   = '#d97706';
// // const RED     = '#dc2626';
// // const NAVY    = '#0C447C';
// // const SLATE   = '#64748b';
// // const PROJ    = '#85B7EB';
// // const PAST_C  = '#B4B2A9';
// //
// // // ── Types ─────────────────────────────────────────────────────────────────────
// // export type ForecastMode = 'review' | 'predict' | 'ripple';
// // export type RippleView   = 'balance' | 'savings' | 'budget';
// //
// // interface ForecastPanelProps {
// //     template:             SpreadsheetTemplate;
// //     selectedPeriodIndex?: number;
// //     defaultMode?:         ForecastMode;
// // }
// //
// // interface PlanItem {
// //     label:    string;
// //     target:   number;
// //     byPeriod: number;
// //     color:    string;
// //     pct:      number;
// //     predPct:  number;
// //     atRisk:   boolean;
// //     shortfall: number;
// // }
// //
// // interface CatFlag {
// //     label:   string;
// //     color:   string;
// //     entered: number;
// //     avg:     number;
// //     pct:     number;    // % vs avg, signed
// //     period:  number;
// // }
// //
// // interface DerivedData {
// //     // per-period arrays length = N
// //     expAll:      number[];
// //     predAll:     number[];
// //     incAll:      number[];
// //     netAll:      number[];
// //     predNetAll:  number[];
// //     balTraj:     number[];
// //     predBalTraj: number[];
// //     savTraj:     number[];
// //     predSavTraj: number[];
// //     // scalars
// //     presentIdx:  number;
// //     endBal:      number;
// //     predEndBal:  number;
// //     endSav:      number;
// //     avgInc:      number;
// //     avgExp:      number;
// //     curExp:      number;
// //     savRate:     number;
// //     delta:       number;   // avg entered future spend vs predicted
// //     // flags
// //     catFlags:    CatFlag[];
// //     plans:       PlanItem[];
// //     // prediction confidence per cat
// //     catPredictions: { label: string; color: string; weighted: number; variance: number; conf: number; periods: number }[];
// // }
// //
// // // ── Helpers ───────────────────────────────────────────────────────────────────
// // const fmt    = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString()}`;
// // const fmtS   = (n: number) => Math.round(Math.abs(n)).toLocaleString();
// // const clamp  = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
// // const sum    = (vals: (number | null)[]) => vals.reduce((a: number, v) => a + (v ?? 0), 0 as number);
// //
// // function periodType(t: SpreadsheetTemplate, pi: number): 'past' | 'present' | 'future' {
// //     const pd = t.periodDates?.[pi];
// //     if (!pd) return pi < Math.floor(t.periods.length / 2) ? 'past' : 'future';
// //     const now = new Date();
// //     if (pd.end < now)   return 'past';
// //     if (pd.start > now) return 'future';
// //     return 'present';
// // }
// // function isFuture(t: SpreadsheetTemplate, pi: number) { return periodType(t, pi) === 'future'; }
// // function isPast(t:   SpreadsheetTemplate, pi: number) { return periodType(t, pi) === 'past'; }
// // function isPresent(t: SpreadsheetTemplate, pi: number) { return periodType(t, pi) === 'present'; }
// //
// // // ── Derive all data from template (memoised) ──────────────────────────────────
// // function deriveData(template: SpreadsheetTemplate): DerivedData {
// //     const N = template.periods.length || 1;
// //     const salRow  = template.rows.find(r => r.rowType === 'salary');
// //     const expRows = template.rows.filter(r => r.rowType === 'expense');
// //
// //     // Present index
// //     const presentIdx = template.periods.findIndex((_, i) => isPresent(template, i));
// //     const CI = presentIdx >= 0 ? presentIdx : Math.floor(N / 2);
// //
// //     // Income per period
// //     const incAll: number[] = Array.from({ length: N }, (_, i) => salRow?.values[i] ?? 0);
// //
// //     // Predicted spend per period: weighted-recent of past expense rows
// //     const predAll: number[] = Array.from({ length: N }, (_, i) => {
// //         const pastVals = expRows.map(r => {
// //             const past = r.values.slice(0, CI).filter((v): v is number => v !== null && v > 0);
// //             if (!past.length) return r.values[i] ?? 0;
// //             const weights = [0.4, 0.3, 0.2, 0.1];
// //             const recent  = past.slice(-4);
// //             const wSum    = recent.reduce((s, v, wi) => s + v * (weights[weights.length - recent.length + wi] ?? 0.1), 0);
// //             const wTotal  = recent.reduce((s, _, wi) => s + (weights[weights.length - recent.length + wi] ?? 0.1), 0);
// //             return wTotal > 0 ? wSum / wTotal : past[past.length - 1];
// //         });
// //         return Math.round(pastVals.reduce((a, b) => a + b, 0));
// //     });
// //
// //     // Actual entered spend: use whatever the user has filled into future cells
// //     const expAll: number[] = Array.from({ length: N }, (_, i) => {
// //         const total = expRows.reduce((s, r) => s + (r.values[i] ?? 0), 0);
// //         // If nothing entered for a future period, fall back to prediction
// //         return total > 0 ? total : predAll[i];
// //     });
// //
// //     const netAll     = expAll.map((e, i)    => incAll[i] - e);
// //     const predNetAll = predAll.map((p, i)   => incAll[i] - p);
// //
// //     // Trajectories
// //     let bal = 0, predBal = 0, sav = 0, predSav = 0;
// //     const balTraj: number[]     = [];
// //     const predBalTraj: number[] = [];
// //     const savTraj: number[]     = [];
// //     const predSavTraj: number[] = [];
// //     for (let i = 0; i < N; i++) {
// //         bal     += netAll[i];     predBal  += predNetAll[i];
// //         sav     += Math.max(0, netAll[i]);    predSav  += Math.max(0, predNetAll[i]);
// //         balTraj.push(Math.round(bal));        predBalTraj.push(Math.round(predBal));
// //         savTraj.push(Math.round(sav));        predSavTraj.push(Math.round(predSav));
// //     }
// //
// //     // Delta: avg future entered vs predicted
// //     const futureExpEntered = expRows.flatMap(r =>
// //         r.values.map((v, i) => isFuture(template, i) && v !== null && v > 0 ? v : null)
// //             .filter((v): v is number => v !== null)
// //     );
// //     const avgFutureEntered  = futureExpEntered.length
// //         ? Math.round(futureExpEntered.reduce((a, b) => a + b, 0) / futureExpEntered.length) : 0;
// //     const avgPredFuture     = Math.round(
// //         predAll.filter((_, i) => isFuture(template, i)).reduce((a, b) => a + b, 0) /
// //         Math.max(1, predAll.filter((_, i) => isFuture(template, i)).length)
// //     );
// //     const delta = avgFutureEntered > 0 ? avgFutureEntered - avgPredFuture : 0;
// //
// //     // Category flags: find categories where future-entered value deviates from avg
// //     const CAT_COLORS: Record<string, string> = {
// //         Rent: '#1d6fb8', Groceries: '#0d9488', Gas: '#ba7517',
// //         Insurance: '#64748b', Utilities: '#7c3aed', 'Order out': '#d97706',
// //         Subscriptions: '#639922', Other: '#d4537e', Savings: '#059669',
// //         Payments: '#7c3aed', Electric: '#6366f1', Haircut: '#14b8a6',
// //     };
// //
// //     const catFlags: CatFlag[] = [];
// //     expRows.forEach(row => {
// //         const pastVals = row.values
// //             .map((v, i) => ({ v, i }))
// //             .filter(({ v, i }) => v !== null && v > 0 && isPast(template, i))
// //             .map(({ v }) => v as number);
// //         if (!pastVals.length) return;
// //         const avg = Math.round(pastVals.reduce((a, b) => a + b, 0) / pastVals.length);
// //
// //         // Find the most-deviant future cell that has been entered
// //         const futureEntries = row.values
// //             .map((v, i) => ({ v, i }))
// //             .filter(({ v, i }) => v !== null && v > 0 && isFuture(template, i));
// //         if (!futureEntries.length) return;
// //
// //         const worst = futureEntries.reduce((a, b) =>
// //             Math.abs((b.v as number) - avg) > Math.abs((a.v as number) - avg) ? b : a
// //         );
// //         const pct = avg > 0 ? Math.round(((worst.v as number) - avg) / avg * 100) : 0;
// //         if (Math.abs(pct) >= 15) {
// //             catFlags.push({
// //                 label:   row.label,
// //                 color:   CAT_COLORS[row.label] ?? SLATE,
// //                 entered: worst.v as number,
// //                 avg,
// //                 pct,
// //                 period:  worst.i,
// //             });
// //         }
// //     });
// //     catFlags.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
// //
// //     // Payment plans (derived from goals in the template if available, else defaults)
// //     const futureNet     = netAll.slice(CI + 1).reduce((a, b) => a + Math.max(0, b), 0);
// //     const predFutureNet = predNetAll.slice(CI + 1).reduce((a, b) => a + Math.max(0, b), 0);
// //     const PLAN_DEFS = [
// //         { label: 'Car repair fund',  target: 1200, byPeriod: CI + 4, color: NAVY  },
// //         { label: 'Trip deposit',     target: 800,  byPeriod: CI + 5, color: AMBER },
// //         { label: 'Emergency fund',   target: 2400, byPeriod: N - 1,  color: GREEN },
// //     ];
// //     const plans: PlanItem[] = PLAN_DEFS.map(p => {
// //         const alloc     = clamp(Math.round(futureNet * 0.3),     0, p.target);
// //         const predAlloc = clamp(Math.round(predFutureNet * 0.3), 0, p.target);
// //         const pct       = clamp(Math.round((alloc     / p.target) * 100), 0, 100);
// //         const predPct   = clamp(Math.round((predAlloc / p.target) * 100), 0, 100);
// //         return {
// //             ...p,
// //             pct,
// //             predPct,
// //             atRisk:    pct < predPct - 8,
// //             shortfall: Math.round(p.target * (1 - pct / 100)),
// //         };
// //     });
// //
// //     // Per-category predictions with confidence
// //     const catPredictions = expRows.map(row => {
// //         const pastVals = row.values
// //             .slice(0, CI)
// //             .filter((v): v is number => v !== null && v > 0);
// //         if (!pastVals.length) return null;
// //         const weights = [0.4, 0.3, 0.2, 0.1];
// //         const recent  = pastVals.slice(-4);
// //         const weighted = Math.round(
// //             recent.reduce((s, v, wi) => s + v * (weights[weights.length - recent.length + wi] ?? 0.1), 0) /
// //             recent.reduce((s, _, wi) => s + (weights[weights.length - recent.length + wi] ?? 0.1), 0)
// //         );
// //         const variance = Math.round(
// //             Math.sqrt(pastVals.reduce((s, v) => s + Math.pow(v - weighted, 2), 0) / pastVals.length)
// //         );
// //         const conf = clamp(100 - Math.round((variance / Math.max(weighted, 1)) * 100), 40, 97);
// //         return {
// //             label:    row.label,
// //             color:    CAT_COLORS[row.label] ?? SLATE,
// //             weighted,
// //             variance,
// //             conf,
// //             periods:  pastVals.length,
// //         };
// //     }).filter((x): x is NonNullable<typeof x> => x !== null);
// //
// //     const avgInc = Math.round(sum(incAll) / N);
// //     const avgExp = Math.round(sum(expAll) / N);
// //     const curExp = expAll[CI] ?? 0;
// //     const savRate = incAll[CI] > 0 ? Math.round(((incAll[CI] - curExp) / incAll[CI]) * 100) : 0;
// //
// //     return {
// //         expAll, predAll, incAll, netAll, predNetAll,
// //         balTraj, predBalTraj, savTraj, predSavTraj,
// //         presentIdx: CI,
// //         endBal:     balTraj[N - 1]     ?? 0,
// //         predEndBal: predBalTraj[N - 1] ?? 0,
// //         endSav:     savTraj[N - 1]     ?? 0,
// //         avgInc, avgExp, curExp, savRate, delta,
// //         catFlags, plans, catPredictions,
// //     };
// // }
// //
// // // ── Shared sub-components ─────────────────────────────────────────────────────
// // const SectionHead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
// //     <Typography sx={{
// //         fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase',
// //         letterSpacing: '0.1em', color: alpha(MAROON, 0.6), mb: 1.5,
// //     }}>{children}</Typography>
// // );
// //
// // const MiniStat: React.FC<{ label: string; value: string; color: string; sub?: string }> = ({ label, value, color, sub }) => (
// //     <Box sx={{ p: 1.5, borderRadius: '10px', border: `1px solid ${alpha(color, 0.2)}`, bgcolor: alpha(color, 0.05) }}>
// //         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>{label}</Typography>
// //         <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
// //         {sub && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>{sub}</Typography>}
// //     </Box>
// // );
// //
// // const ProgBar: React.FC<{ pct: number; color: string; trackColor?: string }> = ({ pct, color, trackColor }) => (
// //     <LinearProgress variant="determinate" value={clamp(pct, 0, 100)} sx={{
// //         height: 5, borderRadius: 3,
// //         bgcolor: trackColor ?? alpha(color, 0.15),
// //         '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
// //     }} />
// // );
// //
// // const FlagCard: React.FC<{ color: string; title: string; sub: string }> = ({ color, title, sub }) => (
// //     <Box sx={{
// //         p: '9px 11px', mb: 1,
// //         borderLeft: `3px solid ${color}`,
// //         borderTop: `0.5px solid ${alpha(color, 0.25)}`,
// //         borderRight: `0.5px solid ${alpha(color, 0.25)}`,
// //         borderBottom: `0.5px solid ${alpha(color, 0.25)}`,
// //         borderRadius: '0 8px 8px 0',
// //         bgcolor: alpha(color, 0.04),
// //     }}>
// //         <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color, mb: 0.25 }}>{title}</Typography>
// //         <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>{sub}</Typography>
// //     </Box>
// // );
// //
// // const StatusBanner: React.FC<{ template: SpreadsheetTemplate; d: DerivedData }> = ({ template, d }) => {
// //     const futureCount = template.periods.filter((_, i) => isFuture(template, i)).length;
// //     const enteredFuture = template.rows
// //         .filter(r => r.rowType === 'expense')
// //         .flatMap(r => r.values.filter((v, i) => v !== null && isFuture(template, i) && v > 0));
// //     return (
// //         <Box sx={{
// //             display: 'flex', alignItems: 'center', gap: 1,
// //             p: '7px 10px', borderRadius: '8px', mb: 1.5,
// //             border: `0.5px solid ${alpha('#000', 0.1)}`,
// //             bgcolor: alpha('#000', 0.02),
// //         }}>
// //             <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: GREEN, flexShrink: 0 }} />
// //             <Typography variant="caption" color="text.secondary">
// //                 Reading template · {enteredFuture.length} future cells entered · {d.catFlags.length} category flag{d.catFlags.length !== 1 ? 's' : ''}
// //             </Typography>
// //         </Box>
// //     );
// // };
// //
// // // ── Chart hook ────────────────────────────────────────────────────────────────
// // function useChart(
// //     canvasRef: React.RefObject<HTMLCanvasElement>,
// //     config: any,
// //     deps: React.DependencyList,
// // ) {
// //     const chartRef = useRef<Chart | null>(null);
// //     useEffect(() => {
// //         if (!canvasRef.current) return;
// //         if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
// //         chartRef.current = new Chart(canvasRef.current, config);
// //         return () => { chartRef.current?.destroy(); chartRef.current = null; };
// //         // eslint-disable-next-line react-hooks/exhaustive-deps
// //     }, deps);
// // }
// //
// // function chartDefaults(labels: string[]) {
// //     return {
// //         responsive: true,
// //         maintainAspectRatio: false,
// //         plugins: {
// //             legend: { display: false },
// //             tooltip: {
// //                 backgroundColor: '#fff',
// //                 borderColor: 'rgba(0,0,0,.1)',
// //                 borderWidth: 0.5,
// //                 titleColor: '#1e293b',
// //                 bodyColor: '#64748b',
// //                 padding: 9,
// //                 cornerRadius: 7,
// //                 callbacks: {
// //                     label: (ctx: any) => ' ' + (ctx.parsed.y < 0 ? '-' : '') + '$' + Math.round(Math.abs(ctx.parsed.y)).toLocaleString(),
// //                 },
// //             },
// //         },
// //         scales: {
// //             x: {
// //                 grid: { color: 'rgba(0,0,0,0.05)' },
// //                 ticks: { color: '#94a3b8', font: { size: 9 }, maxRotation: 45, autoSkip: false },
// //             },
// //             y: {
// //                 grid: { color: 'rgba(0,0,0,0.05)' },
// //                 ticks: {
// //                     color: '#94a3b8', font: { size: 9 },
// //                     callback: (v: any) => (v < 0 ? '-' : '') + '$' + Math.round(Math.abs(v)).toLocaleString(),
// //                 },
// //             },
// //         },
// //     };
// // }
// //
// // // ── BalanceChart ──────────────────────────────────────────────────────────────
// // const BalanceChart: React.FC<{ d: DerivedData; labels: string[] }> = ({ d, labels }) => {
// //     const ref = useRef<HTMLCanvasElement>(null);
// //     const CI  = d.presentIdx;
// //     const actData  = d.balTraj.map((v, i) => i <= CI ? v : null);
// //     const predData = d.predBalTraj.map((v, i) => i >= CI ? v : null);
// //     const yourData = d.balTraj.map((v, i) => i >= CI ? v : null);
// //     const userColor = d.delta > 50 ? RED : GREEN;
// //
// //     useChart(ref, {
// //         type: 'line',
// //         data: {
// //             labels,
// //             datasets: [
// //                 { data: actData,  borderColor: MAROON, borderWidth: 2.5, backgroundColor: alpha(MAROON, 0.08), fill: true,  pointRadius: 3, pointBackgroundColor: MAROON, tension: 0.4 },
// //                 { data: predData, borderColor: PROJ,   borderWidth: 1.5, borderDash: [5, 3], backgroundColor: 'transparent', fill: false, pointRadius: 2, pointBackgroundColor: PROJ, tension: 0.4 },
// //                 { data: yourData, borderColor: userColor, borderWidth: 2.5, backgroundColor: alpha(userColor, 0.07), fill: true, pointRadius: 3, pointBackgroundColor: userColor, tension: 0.4 },
// //             ],
// //         },
// //         options: chartDefaults(labels),
// //     }, [d, labels]);
// //
// //     return (
// //         <Box sx={{ position: 'relative', width: '100%', height: 180 }}>
// //             <canvas ref={ref} role="img" aria-label="Balance trajectory: actual, predicted, and your-data lines" />
// //         </Box>
// //     );
// // };
// //
// // // ── SavingsChart ──────────────────────────────────────────────────────────────
// // const SavingsChart: React.FC<{ d: DerivedData; labels: string[] }> = ({ d, labels }) => {
// //     const ref = useRef<HTMLCanvasElement>(null);
// //     const CI  = d.presentIdx;
// //     const actData  = d.savTraj.map((v, i) => i <= CI ? v : null);
// //     const predData = d.predSavTraj.map((v, i) => i >= CI ? v : null);
// //     const yourData = d.savTraj.map((v, i) => i >= CI ? v : null);
// //     const userColor = d.delta > 50 ? RED : TEAL;
// //     const floorLine = labels.map(() => 500);
// //
// //     useChart(ref, {
// //         type: 'line',
// //         data: {
// //             labels,
// //             datasets: [
// //                 { data: actData,  borderColor: GREEN, borderWidth: 2.5, backgroundColor: alpha(GREEN, 0.08), fill: true,  pointRadius: 3, pointBackgroundColor: GREEN, tension: 0.4 },
// //                 { data: predData, borderColor: PROJ,  borderWidth: 1.5, borderDash: [5, 3], backgroundColor: 'transparent', fill: false, pointRadius: 2, pointBackgroundColor: PROJ, tension: 0.4 },
// //                 { data: yourData, borderColor: userColor, borderWidth: 2.5, backgroundColor: alpha(userColor, 0.07), fill: true, pointRadius: 3, pointBackgroundColor: userColor, tension: 0.4 },
// //                 { data: floorLine, borderColor: AMBER, borderWidth: 1.5, borderDash: [4, 3], backgroundColor: 'transparent', fill: false, pointRadius: 0, tension: 0 },
// //             ],
// //         },
// //         options: chartDefaults(labels),
// //     }, [d, labels]);
// //
// //     return (
// //         <Box sx={{ position: 'relative', width: '100%', height: 180 }}>
// //             <canvas ref={ref} role="img" aria-label="Savings trajectory with floor reference line" />
// //         </Box>
// //     );
// // };
// //
// // // ── BudgetRateChart ───────────────────────────────────────────────────────────
// // const BudgetRateChart: React.FC<{ d: DerivedData; labels: string[] }> = ({ d, labels }) => {
// //     const ref = useRef<HTMLCanvasElement>(null);
// //     const CI  = d.presentIdx;
// //     const ratesBase = d.incAll.map((inc, i) => inc > 0 ? Math.round(((inc - d.predAll[i]) / inc) * 100) : 0);
// //     const ratesUser = d.incAll.map((inc, i) => inc > 0 ? Math.round(((inc - d.expAll[i]) / inc) * 100) : 0);
// //     const barColors = ratesUser.map((v, i) => {
// //         if (i < CI) return PAST_C;
// //         return v >= 10 ? GREEN : v >= 0 ? AMBER : RED;
// //     });
// //
// //     const opts: any = {
// //         ...chartDefaults(labels),
// //         scales: {
// //             x: {
// //                 grid: { color: 'rgba(0,0,0,0.05)' },
// //                 ticks: { color: '#94a3b8', font: { size: 9 }, maxRotation: 45, autoSkip: false },
// //             },
// //             y: {
// //                 grid: { color: 'rgba(0,0,0,0.05)' },
// //                 ticks: { color: '#94a3b8', font: { size: 9 }, callback: (v: any) => `${v}%` },
// //             },
// //         },
// //     };
// //     opts.plugins.tooltip.callbacks.label = (ctx: any) => ` ${ctx.parsed.y}% savings rate`;
// //
// //     useChart(ref, {
// //         type: 'bar',
// //         data: {
// //             labels,
// //             datasets: [
// //                 { data: ratesBase, backgroundColor: 'rgba(180,178,169,0.35)', borderRadius: 3, borderSkipped: false, label: 'baseline' },
// //                 { data: ratesUser.map((v, i) => i >= CI ? v : null), backgroundColor: barColors.map((c, i) => i >= CI ? c : 'transparent'), borderRadius: 3, borderSkipped: false, label: 'your rate' },
// //             ],
// //         },
// //         options: opts,
// //     }, [d, labels]);
// //
// //     return (
// //         <Box sx={{ position: 'relative', width: '100%', height: 180 }}>
// //             <canvas ref={ref} role="img" aria-label="Per-period savings rate bars colored by target achievement" />
// //         </Box>
// //     );
// // };
// //
// // // ── Legend row ────────────────────────────────────────────────────────────────
// // const Legend: React.FC<{ items: { color: string; label: string; dashed?: boolean }[] }> = ({ items }) => (
// //     <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1.25 }}>
// //         {items.map(it => (
// //             <Box key={it.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
// //                 {it.dashed
// //                     ? <Box component="svg" width={14} height={6}><line x1="0" y1="3" x2="14" y2="3" stroke={it.color} strokeWidth="2" strokeDasharray="4 2" /></Box>
// //                     : <Box sx={{ width: 13, height: 3, borderRadius: 1, bgcolor: it.color }} />
// //                 }
// //                 <Typography variant="caption" color="text.secondary">{it.label}</Typography>
// //             </Box>
// //         ))}
// //     </Box>
// // );
// //
// // // ── DualBar plan row ──────────────────────────────────────────────────────────
// // const PlanRow: React.FC<{ plan: PlanItem }> = ({ plan }) => {
// //     const statusColor = plan.pct >= 90 ? GREEN : plan.atRisk ? RED : AMBER;
// //     return (
// //         <Box sx={{
// //             p: '9px 11px', mb: 0.75, borderRadius: '10px',
// //             border: `0.5px solid ${plan.atRisk ? alpha(RED, 0.35) : alpha('#000', 0.1)}`,
// //             bgcolor: plan.atRisk ? alpha(RED, 0.04) : 'transparent',
// //         }}>
// //             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
// //                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
// //                     <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: plan.color, flexShrink: 0 }} />
// //                     <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: plan.atRisk ? RED : 'text.primary' }}>{plan.label}</Typography>
// //                 </Box>
// //                 <Chip
// //                     label={plan.pct >= 90 ? 'on track' : plan.atRisk ? 'at risk' : 'reduced'}
// //                     size="small"
// //                     sx={{
// //                         height: 18, fontSize: '0.6rem', fontWeight: 700,
// //                         bgcolor: alpha(statusColor, 0.12), color: statusColor,
// //                     }}
// //                 />
// //             </Box>
// //             <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
// //                 target {fmt(plan.target)} · period {plan.byPeriod + 1}
// //                 {plan.shortfall > 0 ? ` · ${fmt(plan.shortfall)} needed` : ' · fully funded'}
// //             </Typography>
// //             {/* Dual bar: faded = baseline, solid = yours */}
// //             <Box sx={{ position: 'relative', height: 5, borderRadius: 2, bgcolor: alpha('#000', 0.07) }}>
// //                 <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2, width: `${plan.predPct}%`, bgcolor: alpha('#000', 0.18) }} />
// //                 <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2, width: `${plan.pct}%`, bgcolor: statusColor, transition: 'width .4s' }} />
// //             </Box>
// //             <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
// //                 <Typography variant="caption" color="text.secondary">baseline {plan.predPct}%</Typography>
// //                 <Typography variant="caption" sx={{ fontWeight: 700, color: statusColor }}>{plan.pct}% on your data</Typography>
// //             </Box>
// //         </Box>
// //     );
// // };
// //
// // // ═════════════════════════════════════════════════════════════════════════════
// // // ── Live Review View ──────────────────────────────────────────────────────────
// // // ═════════════════════════════════════════════════════════════════════════════
// // const LiveReviewView: React.FC<{ template: SpreadsheetTemplate; d: DerivedData }> = ({ template, d }) => {
// //     const flags: { color: string; title: string; sub: string }[] = [];
// //
// //     if (d.delta > 100) {
// //         flags.push({ color: RED, title: `Future spend ${fmt(d.delta)}/period over prediction`, sub: `Your entered values average ${fmt(d.delta)} above the predicted budget — compounds across ${template.periods.filter((_, i) => isFuture(template, i)).length} remaining periods.` });
// //     } else if (d.delta > 30) {
// //         flags.push({ color: AMBER, title: 'Spending elevated in future periods', sub: `Entered values are ${fmt(d.delta)} above prediction on average. Review discretionary categories.` });
// //     } else if (d.delta < -30) {
// //         flags.push({ color: GREEN, title: 'Spending below prediction — positive trend', sub: `Tracking ${fmt(Math.abs(d.delta))} under budget on entered future periods.` });
// //     } else {
// //         flags.push({ color: GREEN, title: 'Future spend matches prediction', sub: 'Entered values align with predicted budget. No issues detected.' });
// //     }
// //     d.plans.filter(p => p.atRisk).forEach(p => {
// //         flags.push({ color: RED, title: `${p.label} at risk`, sub: `Current trajectory funds ${p.pct}% vs ${p.predPct}% on baseline — ${fmt(p.shortfall)} short by period ${p.byPeriod + 1}.` });
// //     });
// //
// //     return (
// //         <Box>
// //             <StatusBanner template={template} d={d} />
// //
// //             <SectionHead>What you entered vs prediction</SectionHead>
// //             {d.catFlags.length === 0 && (
// //                 <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
// //                     No future cells entered yet — predictions shown.
// //                 </Typography>
// //             )}
// //             {d.catFlags.slice(0, 5).map(f => {
// //                 const over  = f.pct > 0;
// //                 const col   = Math.abs(f.pct) > 40 ? RED : AMBER;
// //                 const barPct = clamp(Math.round((f.entered / Math.max(f.avg * 1.6, 1)) * 100), 0, 100);
// //                 const avgPct = clamp(Math.round((f.avg     / Math.max(f.avg * 1.6, 1)) * 100), 0, 100);
// //                 return (
// //                     <Box key={f.label} sx={{
// //                         p: '9px 11px', mb: 0.75, borderRadius: '10px',
// //                         border: `0.5px solid ${over ? alpha(col, 0.35) : alpha(GREEN, 0.25)}`,
// //                         bgcolor: over ? alpha(col, 0.04) : alpha(GREEN, 0.03),
// //                     }}>
// //                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
// //                             <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: f.color, flexShrink: 0 }} />
// //                             <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, flex: 1 }}>{f.label}</Typography>
// //                             <Chip
// //                                 label={`${over ? '+' : ''}${f.pct}%`}
// //                                 size="small"
// //                                 sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(over ? col : GREEN, 0.12), color: over ? col : GREEN }}
// //                             />
// //                         </Box>
// //                         {/* Dual-track bar */}
// //                         <Box sx={{ position: 'relative', height: 4, borderRadius: 2, bgcolor: alpha('#000', 0.07), mb: 0.5 }}>
// //                             <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${avgPct}%`, bgcolor: PAST_C, borderRadius: 2 }} />
// //                             <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${barPct}%`, bgcolor: over ? col : GREEN, borderRadius: 2 }} />
// //                         </Box>
// //                         <Typography variant="caption" color="text.secondary">
// //                             entered {fmt(f.entered)} · avg {fmt(f.avg)} · period {f.period + 1}
// //                         </Typography>
// //                     </Box>
// //                 );
// //             })}
// //
// //             <Divider sx={{ my: 2, borderColor: alpha(MAROON, 0.08) }} />
// //             <SectionHead>Review flags</SectionHead>
// //             {flags.map((f, i) => <FlagCard key={i} {...f} />)}
// //
// //             <Divider sx={{ my: 2, borderColor: alpha(MAROON, 0.08) }} />
// //             <SectionHead>Payment plan status</SectionHead>
// //             {d.plans.map(p => <PlanRow key={p.label} plan={p} />)}
// //         </Box>
// //     );
// // };
// //
// // // ═════════════════════════════════════════════════════════════════════════════
// // // ── Predict View ──────────────────────────────────────────────────────────────
// // // ═════════════════════════════════════════════════════════════════════════════
// // const PredictView: React.FC<{ template: SpreadsheetTemplate; d: DerivedData }> = ({ template, d }) => {
// //     const futureCount = template.periods.filter((_, i) => isFuture(template, i)).length;
// //     return (
// //         <Box>
// //             <StatusBanner template={template} d={d} />
// //             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: '8px 11px', borderRadius: '8px', border: `0.5px solid ${alpha(NAVY, 0.2)}`, bgcolor: alpha(NAVY, 0.04), mb: 2 }}>
// //                 <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: NAVY, flexShrink: 0 }} />
// //                 <Typography variant="caption" color="text.secondary">
// //                     Prediction model: weighted recent · {futureCount} unfilled periods · auto-fills empty future cells
// //                 </Typography>
// //             </Box>
// //
// //             <SectionHead>Predicted values — unfilled periods</SectionHead>
// //             {d.catPredictions.map(c => {
// //                 const confColor = c.conf >= 80 ? GREEN : c.conf >= 60 ? AMBER : RED;
// //                 return (
// //                     <Box key={c.label} sx={{ p: '9px 11px', mb: 0.75, borderRadius: '10px', border: `0.5px solid ${alpha('#000', 0.1)}` }}>
// //                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
// //                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
// //                                 <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: c.color, flexShrink: 0 }} />
// //                                 <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{c.label}</Typography>
// //                             </Box>
// //                             <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
// //                                 {fmt(c.weighted)}
// //                                 <Typography component="span" variant="caption" color="text.secondary"> ±{fmt(c.variance)}</Typography>
// //                             </Typography>
// //                         </Box>
// //                         <ProgBar pct={c.conf} color={confColor} />
// //                         <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
// //                             {c.conf}% confidence · based on {c.periods} past period{c.periods !== 1 ? 's' : ''}
// //                         </Typography>
// //                     </Box>
// //                 );
// //             })}
// //
// //             <Divider sx={{ my: 2, borderColor: alpha(MAROON, 0.08) }} />
// //             <SectionHead>Prediction signals active</SectionHead>
// //             {[
// //                 { on: true,  label: 'Weighted recent — last 3 periods weighted most' },
// //                 { on: true,  label: 'Lock manually entered future cells' },
// //                 { on: true,  label: 'Fixed cost detection (rent, insurance)' },
// //                 { on: false, label: 'Seasonal pattern detection' },
// //                 { on: false, label: 'Income-linked discretionary scaling' },
// //             ].map((s, i) => (
// //                 <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, borderBottom: `0.5px solid ${alpha('#000', 0.06)}` }}>
// //                     <Box sx={{
// //                         width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
// //                         border: `1.5px solid ${s.on ? GREEN : alpha('#000', 0.2)}`,
// //                         bgcolor: s.on ? alpha(GREEN, 0.1) : 'transparent',
// //                         display: 'flex', alignItems: 'center', justifyContent: 'center',
// //                     }}>
// //                         {s.on && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: GREEN }} />}
// //                     </Box>
// //                     <Typography sx={{ fontSize: '0.72rem', color: s.on ? 'text.primary' : 'text.secondary' }}>{s.label}</Typography>
// //                 </Box>
// //             ))}
// //         </Box>
// //     );
// // };
// //
// // // ═════════════════════════════════════════════════════════════════════════════
// // // ── Ripple View ───────────────────────────────────────────────────────────────
// // // ═════════════════════════════════════════════════════════════════════════════
// // const RippleView: React.FC<{ template: SpreadsheetTemplate; d: DerivedData }> = ({ template, d }) => {
// //     const [view, setView] = useState<RippleView>('balance');
// //     const labels = template.periods;
// //     const userColor = d.delta > 50 ? RED : GREEN;
// //
// //     const VIEWS: { key: RippleView; label: string }[] = [
// //         { key: 'balance', label: 'Balance' },
// //         { key: 'savings', label: 'Savings' },
// //         { key: 'budget',  label: 'Budget rate' },
// //     ];
// //
// //     const legendItems: Record<RippleView, { color: string; label: string; dashed?: boolean }[]> = {
// //         balance: [
// //             { color: MAROON,    label: 'Actual' },
// //             { color: PROJ,      label: 'Prediction', dashed: true },
// //             { color: userColor, label: 'Your data' },
// //         ],
// //         savings: [
// //             { color: GREEN,     label: 'Actual' },
// //             { color: PROJ,      label: 'Prediction', dashed: true },
// //             { color: userColor, label: 'Your data' },
// //             { color: AMBER,     label: '$500 floor', dashed: true },
// //         ],
// //         budget: [
// //             { color: PAST_C, label: 'Past actual' },
// //             { color: alpha('#000', 0.2), label: 'Baseline' },
// //             { color: GREEN,  label: 'On target 10%+' },
// //             { color: AMBER,  label: 'Below target' },
// //         ],
// //     };
// //
// //     return (
// //         <Box>
// //             {/* View switcher */}
// //             <Box sx={{ display: 'flex', gap: '5px', mb: 1.5 }}>
// //                 {VIEWS.map(v => (
// //                     <Box key={v.key} onClick={() => setView(v.key)} sx={{
// //                         flex: 1, py: '6px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700,
// //                         cursor: 'pointer', borderRadius: '8px', transition: 'all .12s',
// //                         border: `0.5px solid ${view === v.key ? alpha(MAROON, 0.3) : alpha('#000', 0.1)}`,
// //                         bgcolor: view === v.key ? alpha(MAROON, 0.06) : 'transparent',
// //                         color:   view === v.key ? MAROON : 'text.secondary',
// //                         userSelect: 'none',
// //                     }}>{v.label}</Box>
// //                 ))}
// //             </Box>
// //
// //             <Legend items={legendItems[view]} />
// //
// //             {view === 'balance' && <BalanceChart  d={d} labels={labels} />}
// //             {view === 'savings' && <SavingsChart  d={d} labels={labels} />}
// //             {view === 'budget'  && <BudgetRateChart d={d} labels={labels} />}
// //
// //             <Divider sx={{ my: 2, borderColor: alpha(MAROON, 0.08) }} />
// //             <SectionHead>End-of-plan impact</SectionHead>
// //             <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
// //                 <MiniStat label="Your end balance" value={fmt(d.endBal)} color={d.endBal >= d.predEndBal ? GREEN : RED} sub={`pred. ${fmt(d.predEndBal)}`} />
// //                 <MiniStat label="Cumulative savings" value={fmt(d.endSav)} color={GREEN} sub={`${d.savRate}% current rate`} />
// //             </Box>
// //
// //             <Divider sx={{ my: 2, borderColor: alpha(MAROON, 0.08) }} />
// //             <SectionHead>Plan cascade</SectionHead>
// //             {d.plans.map(p => <PlanRow key={p.label} plan={p} />)}
// //         </Box>
// //     );
// // };
// //
// // // ═════════════════════════════════════════════════════════════════════════════
// // // ── ForecastPanel ─────────────────────────────────────────────────────────────
// // // ═════════════════════════════════════════════════════════════════════════════
// // const MODES: { key: ForecastMode; label: string }[] = [
// //     { key: 'review',  label: 'Live review' },
// //     { key: 'predict', label: 'Predict'     },
// //     { key: 'ripple',  label: 'Ripple'      },
// // ];
// //
// // const ForecastPanel: React.FC<ForecastPanelProps> = ({
// //                                                          template,
// //                                                          selectedPeriodIndex = 0,
// //                                                          defaultMode = 'review',
// //                                                      }) => {
// //     const [mode, setMode] = useState<ForecastMode>(defaultMode);
// //     const [activePi, setActivePi] = useState<number>(selectedPeriodIndex);
// //
// //     useEffect(() => { setActivePi(selectedPeriodIndex); }, [selectedPeriodIndex]);
// //
// //     // All derivations happen here — pure read from template
// //     const d = useMemo(() => deriveData(template), [template]);
// //
// //     const n       = template.periods.length || 1;
// //     const totInc  = d.incAll.reduce((a, b) => a + b, 0);
// //     const totExp  = d.expAll.reduce((a, b) => a + b, 0);
// //
// //     const renderContent = () => {
// //         switch (mode) {
// //             case 'review':  return <LiveReviewView template={template} d={d} />;
// //             case 'predict': return <PredictView    template={template} d={d} />;
// //             case 'ripple':  return <RippleView     template={template} d={d} />;
// //             default:        return null;
// //         }
// //     };
// //
// //     return (
// //         <Paper elevation={0} sx={{
// //             width: 440,
// //             flexShrink: 0,
// //             borderRadius: '16px',
// //             overflow: 'hidden',
// //             display: 'flex',
// //             flexDirection: 'column',
// //             border: `1px solid ${alpha(MAROON, 0.15)}`,
// //             boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}`,
// //             alignSelf: 'flex-start',
// //         }}>
// //             {/* ── Maroon header ── */}
// //             <Box sx={{
// //                 background: `linear-gradient(135deg, ${MAROON2} 0%, ${MAROON} 55%, #5a1515 100%)`,
// //                 color: '#fff', p: 2.5, position: 'relative', overflow: 'hidden', flexShrink: 0,
// //             }}>
// //                 {/* Decorative circles */}
// //                 <Box sx={{ position: 'absolute', top: -20, right: -20, width: 110, height: 110, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
// //                 <Box sx={{ position: 'absolute', bottom: -30, right: 50, width: 75, height: 75, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
// //
// //                 {/* Title row */}
// //                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, position: 'relative' }}>
// //                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
// //                         <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
// //                             <InsightsIcon sx={{ fontSize: '1rem' }} />
// //                         </Box>
// //                         <Box>
// //                             <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>Forecast</Typography>
// //                             <Typography sx={{ fontSize: '0.67rem', opacity: 0.65, mt: '1px' }}>
// //                                 {template.periodType?.toLowerCase() ?? 'biweekly'} · {template.periods.length} periods
// //                             </Typography>
// //                         </Box>
// //                     </Box>
// //                     {/* Live indicator */}
// //                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: '6px', px: 1.25, py: 0.5, border: '1px solid rgba(255,255,255,0.2)' }}>
// //                         <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#97c459' }} />
// //                         <Typography sx={{ fontSize: '0.68rem', fontWeight: 700 }}>live</Typography>
// //                     </Box>
// //                 </Box>
// //
// //                 {/* Mode pills */}
// //                 <Box sx={{ display: 'flex', gap: '5px', mb: 1.5, position: 'relative' }}>
// //                     {MODES.map(m => (
// //                         <Box key={m.key} onClick={() => setMode(m.key)} sx={{
// //                             px: '11px', py: '5px', borderRadius: '20px', border: '1px solid',
// //                             cursor: 'pointer', userSelect: 'none', fontSize: '0.68rem', fontWeight: 700, transition: 'all .12s',
// //                             borderColor: mode === m.key ? 'rgba(255,255,255,.65)' : 'rgba(255,255,255,.25)',
// //                             bgcolor:     mode === m.key ? 'rgba(255,255,255,.22)' : 'transparent',
// //                             color:       mode === m.key ? '#fff' : 'rgba(255,255,255,.65)',
// //                             '&:hover':   mode !== m.key ? { bgcolor: 'rgba(255,255,255,.12)', color: '#fff' } : {},
// //                         }}>{m.label}</Box>
// //                     ))}
// //                 </Box>
// //
// //                 {/* Period picker */}
// //                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, position: 'relative' }}>
// //                     <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>
// //                         Period
// //                     </Typography>
// //                     <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
// //                         <Box onClick={() => setActivePi(p => Math.max(0, p - 1))} sx={{
// //                             width: 22, height: 22, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center',
// //                             border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', flexShrink: 0,
// //                             color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', userSelect: 'none',
// //                             '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
// //                             opacity: activePi === 0 ? 0.35 : 1,
// //                         }}>‹</Box>
// //
// //                         <Box sx={{ flex: 1, display: 'flex', gap: '3px', overflow: 'hidden' }}>
// //                             {(() => {
// //                                 const total  = template.periods.length;
// //                                 const window = 5;
// //                                 const start  = Math.max(0, Math.min(activePi - Math.floor(window / 2), total - window));
// //                                 const end    = Math.min(total, start + window);
// //                                 return template.periods.slice(start, end).map((p, i) => {
// //                                     const pi        = start + i;
// //                                     const isActive  = pi === activePi;
// //                                     const isCurrent = isPresent(template, pi);
// //                                     return (
// //                                         <Box key={pi} onClick={() => setActivePi(pi)} sx={{
// //                                             flex: 1, py: '3px', borderRadius: '5px', textAlign: 'center',
// //                                             cursor: 'pointer', border: '1px solid', transition: 'all .12s', userSelect: 'none',
// //                                             borderColor: isActive ? 'rgba(255,255,255,.75)' : isCurrent ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.2)',
// //                                             bgcolor:     isActive ? 'rgba(255,255,255,.22)' : isCurrent ? 'rgba(255,255,255,.08)' : 'transparent',
// //                                             '&:hover':   !isActive ? { bgcolor: 'rgba(255,255,255,.1)' } : {},
// //                                         }}>
// //                                             <Typography sx={{ fontSize: '0.58rem', fontWeight: isActive ? 800 : 500, color: isActive ? '#fff' : 'rgba(255,255,255,0.7)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
// //                                                 {p}
// //                                             </Typography>
// //                                             {isCurrent && <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#fff', mx: 'auto', mt: '2px', opacity: 0.7 }} />}
// //                                         </Box>
// //                                     );
// //                                 });
// //                             })()}
// //                         </Box>
// //
// //                         <Box onClick={() => setActivePi(p => Math.min(template.periods.length - 1, p + 1))} sx={{
// //                             width: 22, height: 22, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center',
// //                             border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', flexShrink: 0,
// //                             color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', userSelect: 'none',
// //                             '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
// //                             opacity: activePi === template.periods.length - 1 ? 0.35 : 1,
// //                         }}>›</Box>
// //                     </Box>
// //
// //                     <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', flexShrink: 0, minWidth: 58, textAlign: 'right' }}>
// //                         {template.periods[activePi] ?? '—'}
// //                     </Typography>
// //                 </Box>
// //
// //                 {/* KPI strip */}
// //                 <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0.75, position: 'relative' }}>
// //                     {[
// //                         { label: 'Avg income', value: `$${Math.round(totInc / n).toLocaleString()}` },
// //                         { label: 'Avg spend',  value: `$${Math.round(totExp / n).toLocaleString()}` },
// //                         { label: 'Balance',    value: `$${Math.round(d.endBal).toLocaleString()}`   },
// //                         { label: 'Saved %',    value: `${d.savRate}%`                               },
// //                     ].map(k => (
// //                         <Box key={k.label} sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '7px', p: '6px 7px', textAlign: 'center' }}>
// //                             <Typography sx={{ fontSize: '0.58rem', opacity: 0.65, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>{k.label}</Typography>
// //                             <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', mt: '2px' }}>{k.value}</Typography>
// //                         </Box>
// //                     ))}
// //                 </Box>
// //             </Box>
// //
// //             {/* ── Scrollable body ── */}
// //             <Box sx={{
// //                 flex: 1, overflowY: 'auto', p: 2.5, bgcolor: '#fff',
// //                 maxHeight: 'calc(100vh - 300px)',
// //                 '&::-webkit-scrollbar': { width: 6 },
// //                 '&::-webkit-scrollbar-track': { bgcolor: 'rgba(0,0,0,0.03)' },
// //                 '&::-webkit-scrollbar-thumb': { bgcolor: TEAL, borderRadius: 3, '&:hover': { bgcolor: TEAL2 } },
// //             }}>
// //                 {renderContent()}
// //             </Box>
// //         </Paper>
// //     );
// // };
// //
// // export default ForecastPanel;