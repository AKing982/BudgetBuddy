import React, { useMemo } from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { ClipboardCheck, AlertTriangle } from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import { MAROON, Portfolio, Contribution, portfolioMonthlyDollarContribution, fmt } from './InvestmentUtils';

interface ReconciliationPanelProps {
    contributions: Contribution[];
    portfolios: Portfolio[];
    monthlyIncome: number;
    monthsBack?: number;
}

function monthKey(dateStr: string): string {
    return dateStr.slice(0, 7); // YYYY-MM
}

const ReconciliationPanel: React.FC<ReconciliationPanelProps> = ({ contributions, portfolios, monthlyIncome, monthsBack = 6 }) => {
    // NOTE: this compares actual logged contributions against the *current*
    // combined portfolio target as a flat reference line, since historical
    // per-month budgeted amounts aren't tracked yet. Once contribution %
    // changes are stored with an effective date, swap this for the real
    // budgeted figure that was in effect during each specific month.
    const budgetedMonthly = useMemo(
        () => portfolios.reduce((s, p) => s + portfolioMonthlyDollarContribution(p, monthlyIncome), 0),
        [portfolios, monthlyIncome]
    );

    const data = useMemo(() => {
        const now = new Date();
        const months: { key: string; label: string }[] = [];
        for (let i = monthsBack - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString(undefined, { month: 'short' }) });
        }
        const totalsByMonth: Record<string, number> = {};
        contributions.forEach(c => {
            const k = monthKey(c.date);
            totalsByMonth[k] = (totalsByMonth[k] ?? 0) + c.amount;
        });
        return months.map(m => ({
            month: m.label,
            budgeted: Math.round(budgetedMonthly),
            actual: Math.round(totalsByMonth[m.key] ?? 0),
            gap: (totalsByMonth[m.key] ?? 0) < budgetedMonthly * 0.85,
        }));
    }, [contributions, budgetedMonthly, monthsBack]);

    const flaggedMonths = data.filter(d => d.gap);

    return (
        <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}` }}>
            <Box sx={{ background: `linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)`, px: 3, py: 1.5, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative' }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ClipboardCheck size={15} color="white" />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>Reconciliation</Typography>
                        <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>
                            Did the money actually move? Budgeted vs. logged contributions
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ bgcolor: '#fff', p: 3 }}>
                <Box sx={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#999' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#999' }} tickFormatter={(v) => `$${Math.round(v / 100) / 10}k`} />
                            <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="budgeted" name="Budgeted to save" fill="#d8c3c3" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="actual" name="Actually contributed" fill={MAROON} radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>

                {flaggedMonths.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mt: 2, p: 1.5, borderRadius: '8px', bgcolor: 'rgba(220,38,38,0.08)' }}>
                        <AlertTriangle size={14} color="#991b1b" style={{ marginTop: 1, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.78rem', color: '#991b1b', lineHeight: 1.55 }}>
                            {flaggedMonths.map(m => m.month).join(', ')}: logged contributions came in well under the budgeted amount — worth checking whether a transfer was missed.
                        </Typography>
                    </Box>
                ) : (
                    <Typography sx={{ fontSize: '0.78rem', color: '#888', mt: 2 }}>
                        No gaps in the last {monthsBack} months — logged contributions have kept pace with what's budgeted.
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default ReconciliationPanel;