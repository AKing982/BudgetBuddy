import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Box, Typography, Stack, alpha } from '@mui/material';
import Chart from 'chart.js/auto';

// ── Tokens ────────────────────────────────────────────────────────────────────
const GREEN  = '#1D9E75';
const RED    = '#E24B4A';
const BLUE   = '#378ADD';
const GRAY   = '#D3D1C7';
const NAVY   = '#1e293b';
const MAROON = '#6b1a1a';

const CAT_COLORS: Record<string, string> = {
    Rent: '#378ADD', Gas: '#BA7517', Groceries: '#1D9E75',
    Payments: '#7c3aed', Payment: '#7c3aed',
    Insurance: '#0ea5e9', 'Order Out': '#D4537E', 'Order out': '#D4537E',
    Other: '#888780', Utilities: '#f59e0b', Electric: '#6366f1',
    'Gas Bill': '#ef4444', Subscription: '#8b5cf6', Subscriptions: '#8b5cf6',
    Haircut: '#14b8a6', 'To Go': '#f97316',
};

const fmt  = (v: number): string => '$' + Math.abs(Math.round(v)).toLocaleString();
const fmtS = (v: number): string => (v < 0 ? '-' : '') + fmt(v);

// ── Inline types (no import from BudgetPlanner) ───────────────────────────────
interface SpreadsheetRow {
    label:   string;
    rowType: 'expense' | 'salary' | 'expenses' | 'balance' | 'extra';
    values:  (number | null)[];
}
interface MonthGroup { name: string; cols: number[]; }
interface SpreadsheetTemplate {
    id:           string;
    name:         string;
    periodType:   string;
    months:       MonthGroup[];
    periods:      string[];
    rows:         SpreadsheetRow[];
    viewOverride?: string;
}

interface DerivedCat { name: string; color: string; vals: number[]; }

interface Props {
    template: SpreadsheetTemplate;
}

const IncomeTemplateDashboard: React.FC<Props> = ({ template }) => {
    const [activeIdx, setActiveIdx] = useState(0);
    const donutRef  = useRef<HTMLCanvasElement>(null);
    const lineRef   = useRef<HTMLCanvasElement>(null);
    const donutInst = useRef<any>(null);
    const lineInst  = useRef<any>(null);

    // ── Derive ────────────────────────────────────────────────────────────────
    const { periods, salary, expenses, runningBal, cats, totalInc, totalExp, finalBal, metCount } =
        useMemo(() => {
            const salRow  = template.rows.find((r: SpreadsheetRow) => r.rowType === 'salary');
            const expRow  = template.rows.find((r: SpreadsheetRow) => r.rowType === 'expenses');
            const expCats = template.rows.filter((r: SpreadsheetRow) => r.rowType === 'expense');

            const salary:   number[] = (salRow?.values ?? []).map((v: number | null) => v ?? 0);
            const expenses: number[] = (expRow?.values ?? []).map((v: number | null) => v ?? 0);
            const periods:  string[] = template.periods;

            const runningBal: number[] = [];
            let run = 0;
            salary.forEach((s: number, i: number) => {
                run += s - expenses[i];
                runningBal.push(Math.round(run));
            });

            const cats: DerivedCat[] = expCats
                .filter((row: SpreadsheetRow) => row.values.some((v: number | null) => v !== null && v > 0))
                .map((row: SpreadsheetRow) => ({
                    name:  row.label,
                    color: CAT_COLORS[row.label] ?? '#888780',
                    vals:  row.values.map((v: number | null) => v ?? 0),
                }));

            const totalInc  = salary.reduce((a: number, v: number) => a + v, 0);
            const totalExp  = expenses.reduce((a: number, v: number) => a + v, 0);
            const finalBal  = runningBal[runningBal.length - 1] ?? 0;
            const metCount  = periods.filter((_: string, i: number) =>
                salary[i] - expenses[i] >= Math.round(salary[i] * 0.226)
            ).length;

            return { periods, salary, expenses, runningBal, cats, totalInc, totalExp, finalBal, metCount };
        }, [template]);

    // ── Charts ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!donutRef.current || !lineRef.current) return;

        const i          = activeIdx;
        const activeCats = cats.filter((c: DerivedCat) => c.vals[i] > 0);
        const totalCat   = activeCats.reduce((a: number, c: DerivedCat) => a + c.vals[i], 0);

        donutInst.current?.destroy();
        lineInst.current?.destroy();

        donutInst.current = new Chart(donutRef.current, {
            type: 'doughnut' as const,
            data: {
                labels:   activeCats.map((c: DerivedCat) => c.name),
                datasets: [{
                    data:            activeCats.map((c: DerivedCat) => c.vals[i]),
                    backgroundColor: activeCats.map((c: DerivedCat) => c.color),
                    borderWidth:     2,
                    borderColor:     '#ffffff',
                    hoverOffset:     4,
                }],
            },
            options: {
                responsive:          true,
                maintainAspectRatio: false,
                cutout:              '62%',
                plugins: {
                    legend:  { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx: any) =>
                                `${ctx.label}: ${fmt(ctx.raw)} (${Math.round(ctx.raw / (totalCat || 1) * 100)}%)`,
                        },
                    },
                },
                animation: false as const,
            },
        } as any);

        lineInst.current = new Chart(lineRef.current, {
            type: 'line' as const,
            data: {
                labels:   periods,
                datasets: [{
                    data:                 runningBal,
                    borderWidth:          1.5,
                    pointRadius:          runningBal.map((_: number, idx: number) => idx === i ? 4 : 0),
                    pointBackgroundColor: runningBal.map((v: number, idx: number) =>
                        idx === i ? (v >= 0 ? GREEN : RED) : BLUE
                    ),
                    fill:    false,
                    tension: 0.3,
                    segment: {
                        borderColor: (ctx: any) => ctx.p1DataIndex <= i ? BLUE : GRAY,
                    },
                }],
            },
            options: {
                responsive:          true,
                maintainAspectRatio: false,
                plugins: {
                    legend:  { display: false },
                    tooltip: { callbacks: { label: (ctx: any) => fmtS(ctx.raw) } },
                },
                scales:    { x: { display: false }, y: { display: false } },
                animation: false as const,
            },
        } as any);

        return () => {
            donutInst.current?.destroy();
            lineInst.current?.destroy();
        };
    }, [activeIdx, cats, periods, runningBal]);

    // ── Per-period values ─────────────────────────────────────────────────────
    const i          = activeIdx;
    const inc        = salary[i]   ?? 0;
    const exp        = expenses[i] ?? 0;
    const sav        = inc - exp;
    const goal       = Math.round(inc * 0.226);
    const met        = sav >= goal;
    const prevBal    = i > 0 ? runningBal[i - 1] : 0;
    const balChange  = (runningBal[i] ?? 0) - prevBal;
    const balPct     = Math.min(Math.round(Math.abs(runningBal[i] ?? 0) / Math.abs(finalBal || 1) * 100), 100);
    const goalPct    = Math.max(Math.min(Math.round(sav / (goal || 1) * 100), 100), 0);
    const activeCats = cats.filter((c: DerivedCat) => c.vals[i] > 0);
    const totalCat   = activeCats.reduce((a: number, c: DerivedCat) => a + c.vals[i], 0);

    const summaryRows: { label: string; val: string; color: string }[] = [
        { label: 'Income',         val: fmt(inc),                                 color: NAVY },
        { label: 'Expenses',       val: fmt(exp),                                 color: exp > inc ? RED : NAVY },
        { label: 'Saved',          val: fmtS(sav),                                color: sav >= 0 ? GREEN : RED },
        { label: 'Spend rate',     val: Math.round(exp / (inc || 1) * 100) + '%', color: exp > inc ? RED : NAVY },
        { label: 'Savings rate',   val: Math.round(sav / (inc || 1) * 100) + '%', color: sav >= 0 ? GREEN : RED },
        { label: 'Period balance', val: fmtS(runningBal[i] ?? 0),                 color: (runningBal[i] ?? 0) >= 0 ? GREEN : RED },
    ];

    const topCards: { label: string; val: string; sub: string; color: string }[] = [
        { label: 'Total income',   val: fmt(totalInc),  sub: `across ${periods.length} periods`, color: NAVY },
        { label: 'Total expenses', val: fmt(totalExp),  sub: 'all categories',                   color: NAVY },
        { label: 'Final balance',  val: fmtS(finalBal), sub: 'end of all periods',               color: finalBal >= 0 ? GREEN : RED },
        {
            label: 'Goals met',
            val:   `${metCount} / ${periods.length}`,
            sub:   'savings goal periods',
            color: metCount >= Math.ceil(periods.length / 2) ? GREEN : RED,
        },
    ];

    return (
        <Box sx={{ fontFamily: 'inherit' }}>

            {/* Top strip */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 1, mb: 1.75 }}>
                {topCards.map(m => (
                    <Box key={m.label} sx={{ bgcolor: alpha('#000', 0.03), borderRadius: '8px', p: '10px 12px' }}>
                        <Typography sx={{ fontSize: '0.69rem', color: '#64748b', mb: 0.5 }}>{m.label}</Typography>
                        <Typography sx={{ fontSize: '1.2rem', fontWeight: 500, color: m.color, lineHeight: 1.2 }}>{m.val}</Typography>
                        <Typography sx={{ fontSize: '0.69rem', color: '#94a3b8', mt: 0.25 }}>{m.sub}</Typography>
                    </Box>
                ))}
            </Box>

            {/* Period pills */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.625, mb: 1.75 }}>
                {periods.map((p: string, idx: number) => {
                    const periodMet = salary[idx] - expenses[idx] >= Math.round(salary[idx] * 0.226);
                    return (
                        <Box
                            key={idx}
                            onClick={() => setActiveIdx(idx)}
                            sx={{
                                fontSize: '0.69rem', px: 1.125, py: 0.5,
                                borderRadius: '20px', cursor: 'pointer',
                                border: '0.5px solid',
                                borderColor: activeIdx === idx ? NAVY : periodMet ? GREEN : RED,
                                bgcolor:     activeIdx === idx ? NAVY : '#fff',
                                color:       activeIdx === idx ? '#fff' : '#64748b',
                                whiteSpace: 'nowrap', transition: 'all 0.15s',
                                '&:hover': { opacity: 0.8 },
                                userSelect: 'none',
                            }}
                        >
                            {p}
                        </Box>
                    );
                })}
            </Box>

            {/* Balance tracker */}
            <Box sx={{
                bgcolor: '#fff', border: '0.5px solid', borderColor: alpha('#000', 0.1),
                borderRadius: '12px', p: '12px 14px', mb: 1.25,
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
                    <Typography sx={{ fontSize: '0.69rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Balance tracker — {periods[i]}
                    </Typography>
                    <Typography sx={{ fontSize: '0.69rem', color: '#94a3b8' }}>
                        period {i + 1} of {periods.length}
                    </Typography>
                </Box>
                <Box sx={{ bgcolor: alpha('#000', 0.03), borderRadius: '8px', p: '8px 10px', mb: 1.25 }}>
                    <Typography sx={{ fontSize: '0.69rem', color: '#64748b', mb: 0.375 }}>Overall final balance</Typography>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: finalBal >= 0 ? GREEN : RED }}>
                        {fmtS(finalBal)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.69rem', color: '#94a3b8', mt: 0.25 }}>
                        end of all {periods.length} periods
                    </Typography>
                </Box>
                <Box sx={{ height: 6, bgcolor: alpha('#000', 0.07), borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                    <Box sx={{
                        position: 'absolute', left: 0, top: 0, height: '100%',
                        width: `${balPct}%`,
                        bgcolor: (runningBal[i] ?? 0) >= 0 ? GREEN : RED,
                        borderRadius: '3px',
                    }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.375 }}>
                    <Typography sx={{ fontSize: '0.625rem', color: '#94a3b8' }}>
                        running balance through this period: {fmtS(runningBal[i] ?? 0)} ({balChange >= 0 ? '+' : ''}{fmtS(balChange)} vs prior)
                    </Typography>
                    <Typography sx={{ fontSize: '0.625rem', color: '#94a3b8' }}>{balPct}% of final</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Typography sx={{ fontSize: '0.69rem', color: '#64748b', flexShrink: 0 }}>Savings goal</Typography>
                    <Box sx={{ flex: 1, height: 5, bgcolor: alpha('#000', 0.07), borderRadius: '3px', overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', width: `${goalPct}%`, bgcolor: met ? GREEN : RED, borderRadius: '3px' }} />
                    </Box>
                    <Box sx={{
                        fontSize: '0.625rem', px: 0.875, py: 0.25, borderRadius: '10px', flexShrink: 0,
                        bgcolor: met ? alpha(GREEN, 0.12) : alpha(RED, 0.1),
                        color:   met ? '#27500A' : '#A32D2D',
                    }}>
                        {met ? 'met' : 'missed'} — {fmt(goal)} goal
                    </Box>
                </Box>
            </Box>

            {/* Detail grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>

                {/* Donut */}
                <Box sx={{
                    bgcolor: '#fff', border: '0.5px solid', borderColor: alpha('#000', 0.1),
                    borderRadius: '12px', p: '12px 14px',
                }}>
                    <Typography sx={{ fontSize: '0.69rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.25 }}>
                        Spending breakdown
                    </Typography>
                    <Box sx={{ position: 'relative', height: 180 }}>
                        <canvas ref={donutRef} role="img" aria-label={`Spending breakdown for ${periods[i]}`} />
                    </Box>
                    <Stack spacing={0.5} sx={{ mt: 1.25 }}>
                        {activeCats.map((c: DerivedCat) => {
                            const pct = Math.round(c.vals[i] / (totalCat || 1) * 100);
                            return (
                                <Box key={c.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <Box sx={{ width: 9, height: 9, borderRadius: '2px', bgcolor: c.color, flexShrink: 0 }} />
                                    <Typography sx={{ fontSize: '0.69rem', color: '#64748b', flex: 1 }}>
                                        {c.name}{' '}
                                        <Box component="span" sx={{ color: '#94a3b8' }}>{pct}%</Box>
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.69rem', fontWeight: 500, color: NAVY }}>
                                        {fmt(c.vals[i])}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Stack>
                </Box>

                {/* Period summary + line */}
                <Box sx={{
                    bgcolor: '#fff', border: '0.5px solid', borderColor: alpha('#000', 0.1),
                    borderRadius: '12px', p: '12px 14px',
                }}>
                    <Typography sx={{ fontSize: '0.69rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.25 }}>
                        Period summary
                    </Typography>
                    <Stack divider={<Box sx={{ height: '0.5px', bgcolor: alpha('#000', 0.07) }} />}>
                        {summaryRows.map(r => (
                            <Box key={r.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', py: '5px' }}>
                                <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{r.label}</Typography>
                                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: r.color }}>{r.val}</Typography>
                            </Box>
                        ))}
                    </Stack>
                    <Typography sx={{ fontSize: '0.69rem', color: '#64748b', mt: 1.25, mb: 0.625 }}>
                        Balance over all periods
                    </Typography>
                    <Box sx={{ position: 'relative', height: 44 }}>
                        <canvas ref={lineRef} role="img" aria-label="Running balance line chart across all periods" />
                    </Box>
                </Box>

            </Box>
        </Box>
    );
};

export default IncomeTemplateDashboard;