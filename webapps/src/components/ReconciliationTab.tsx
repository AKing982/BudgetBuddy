import React, { useMemo, useState } from 'react';
import { Box, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { MAROON, MAROON_DARK, Contribution, fmt } from './InvestmentUtils';

interface ReconciliationTabProps {
    contributions: Contribution[];
    accountIds: number[];
    budgetedMonthly: number;
    monthsBack?: number;
}

function monthKey(dateStr: string): string {
    return dateStr.slice(0, 7); // YYYY-MM
}

const ReconciliationTab: React.FC<ReconciliationTabProps> = ({ contributions, accountIds, budgetedMonthly, monthsBack = 6 }) => {
    const [view, setView] = useState<'bar' | 'donut'>('bar');
    const accountIdSet = useMemo(() => new Set(accountIds), [accountIds]);
    const scoped = useMemo(() => contributions.filter(c => accountIdSet.has(c.accountId)), [contributions, accountIdSet]);

    // ── Bar view: budgeted vs. actual, last N months ─────────────────────────
    // NOTE: compares against the *current* contribution target as a flat
    // reference, since historical per-month budgeted amounts aren't tracked
    // yet. Swap for the real effective-dated figure once available.
    const monthlyData = useMemo(() => {
        const now = new Date();
        const months: { key: string; label: string }[] = [];
        for (let i = monthsBack - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString(undefined, { month: 'short' }) });
        }
        const totalsByMonth: Record<string, number> = {};
        scoped.forEach(c => { const k = monthKey(c.date); totalsByMonth[k] = (totalsByMonth[k] ?? 0) + c.amount; });
        return months.map(m => ({
            month: m.label,
            budgeted: Math.round(budgetedMonthly),
            actual: Math.round(totalsByMonth[m.key] ?? 0),
            gap: (totalsByMonth[m.key] ?? 0) < budgetedMonthly * 0.85,
        }));
    }, [scoped, budgetedMonthly, monthsBack]);
    const flaggedMonths = monthlyData.filter(d => d.gap);

    // ── Donut view: this calendar month's actual vs. budgeted, as a ring ────
    const thisMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const thisMonthActual = useMemo(
        () => scoped.filter(c => monthKey(c.date) === thisMonthKey).reduce((s, c) => s + c.amount, 0),
        [scoped, thisMonthKey]
    );
    const donutPct = budgetedMonthly > 0 ? Math.min(999, (thisMonthActual / budgetedMonthly) * 100) : 0;
    const donutData = budgetedMonthly <= 0
        ? [{ name: 'No target set', value: 1 }]
        : thisMonthActual >= budgetedMonthly
            ? [{ name: 'Contributed', value: thisMonthActual }]
            : [
                { name: 'Contributed', value: thisMonthActual },
                { name: 'Remaining', value: budgetedMonthly - thisMonthActual },
            ];
    const donutColors = budgetedMonthly <= 0 ? ['#e0e0e0'] : thisMonthActual >= budgetedMonthly ? [MAROON] : [MAROON, '#eee'];

    return (
        <Box>
            <ToggleButtonGroup
                value={view} exclusive size="small"
                onChange={(_, v) => { if (v !== null) setView(v); }}
                sx={{
                    mb: 2,
                    '& .MuiToggleButton-root': {
                        border: `1px solid ${MAROON}33`, textTransform: 'none', fontSize: '0.72rem', fontWeight: 700,
                        color: MAROON, px: 1.5, py: 0.4,
                        '&.Mui-selected': { bgcolor: MAROON, color: '#fff', '&:hover': { bgcolor: MAROON_DARK } },
                    },
                }}
            >
                <ToggleButton value="bar">Bar — by month</ToggleButton>
                <ToggleButton value="donut">Donut — this month</ToggleButton>
            </ToggleButtonGroup>

            {view === 'bar' ? (
                <>
                    <Box sx={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#999' }} />
                                <YAxis tick={{ fontSize: 10, fill: '#999' }} tickFormatter={(v) => `$${Math.round(v / 100) / 10}k`} />
                                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                <Legend wrapperStyle={{ fontSize: 10 }} />
                                <Bar dataKey="budgeted" name="Budgeted" fill="#d8c3c3" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="actual" name="Actual" fill={MAROON} radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                    {flaggedMonths.length > 0 ? (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mt: 1.5, p: 1.25, borderRadius: '8px', bgcolor: 'rgba(220,38,38,0.08)' }}>
                            <AlertTriangle size={13} color="#991b1b" style={{ marginTop: 1, flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.72rem', color: '#991b1b', lineHeight: 1.5 }}>
                                {flaggedMonths.map(m => m.month).join(', ')}: contributions came in well under budgeted — worth checking for a missed transfer.
                            </Typography>
                        </Box>
                    ) : (
                        <Typography sx={{ fontSize: '0.72rem', color: '#888', mt: 1.5 }}>
                            No gaps in the last {monthsBack} months.
                        </Typography>
                    )}
                </>
            ) : (
                <>
                    <Box sx={{ position: 'relative', height: 180 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={donutData} dataKey="value" innerRadius={55} outerRadius={78} startAngle={90} endAngle={-270}>
                                    {donutData.map((_, i) => <Cell key={i} fill={donutColors[i % donutColors.length]} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                            <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.3rem', color: MAROON }}>
                                {budgetedMonthly > 0 ? `${Math.round(donutPct)}%` : '—'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.62rem', color: '#888' }}>of this month</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mt: 1.5, p: 1.25, borderRadius: '8px', bgcolor: thisMonthActual >= budgetedMonthly ? 'rgba(22,163,74,0.08)' : 'rgba(217,119,6,0.08)' }}>
                        {thisMonthActual >= budgetedMonthly
                            ? <CheckCircle2 size={13} color="#15803d" style={{ marginTop: 1, flexShrink: 0 }} />
                            : <AlertTriangle size={13} color="#92400e" style={{ marginTop: 1, flexShrink: 0 }} />}
                        <Typography sx={{ fontSize: '0.72rem', color: thisMonthActual >= budgetedMonthly ? '#15803d' : '#92400e', lineHeight: 1.5 }}>
                            {fmt(thisMonthActual)} contributed of {fmt(budgetedMonthly)} budgeted this month
                            {thisMonthActual < budgetedMonthly ? ` — ${fmt(budgetedMonthly - thisMonthActual)} still to go.` : '.'}
                        </Typography>
                    </Box>
                </>
            )}
        </Box>
    );
};

export default ReconciliationTab;