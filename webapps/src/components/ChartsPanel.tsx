import React from 'react';
import { alpha, Box, Divider, Grid, LinearProgress, Stack, Typography } from '@mui/material';
import { BarChart2, Target, TrendingUp, Calendar } from 'lucide-react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { BudgetEnvelope, EnvelopeContribution } from '../config/Types';
import { ENVELOPE_COLORS, MAROON, MAROON_DARK } from '../config/Constants';
import { VelocityChip } from './Shared';
import { fmt, addMonths, progressPct, velocityDays } from '../config/Helpers';

interface ChartsPanelProps {
    envelopes:     BudgetEnvelope[];
    contributions: EnvelopeContribution[];
}

const ChartsPanel: React.FC<ChartsPanelProps> = ({ envelopes, contributions }) => {
    const active = envelopes.filter(e => e.status === 'ACTIVE');
    const MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

    const byTypeAndMonth = (type: string | null, mi: number) => {
        const monthDate = addMonths(new Date('2025-11-01'), mi);
        const monthStr  = monthDate.toISOString().slice(0, 7);
        return contributions
            .filter(c => {
                if (!c.contributedAt.startsWith(monthStr)) return false;
                if (!type) return true;
                return envelopes.find(e => e.id === c.envelopeId)?.envelopeType === type;
            })
            .reduce((s, c) => s + c.amount, 0);
    };

    const contribByMonth   = MONTHS.map((_, i) => byTypeAndMonth(null, i));
    const emergencyByMonth = MONTHS.map((_, i) => byTypeAndMonth('EMERGENCY', i));
    const payoffByMonth    = MONTHS.map((_, i) => byTypeAndMonth('PAYOFF', i));
    const savingsByMonth   = MONTHS.map((_, i) => byTypeAndMonth('SAVINGS', i));

    const totalTarget  = active.reduce((s, e) => s + e.targetAmount, 0);
    const velLabels    = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const plannedData  = velLabels.map((_, i) => Math.round((totalTarget / 8) * (i + 1)));
    const actualData   = [750, 1620, 2590, 3540, 4430, 4775, null, null];

    const totalAlloc    = active.reduce((s, e) => s + e.allocatedAmount, 0);
    const monthlyBudget = 1000;
    const unallocated   = Math.max(monthlyBudget - totalAlloc, 0);
    const donutLabels   = [...active.map(e => e.envelopeName), 'Unallocated'];
    const donutData     = [...active.map(e => e.allocatedAmount), unallocated];
    const donutColors   = [...active.map(e => ENVELOPE_COLORS[e.envelopeType]), '#e5e7eb'];

    const now      = Date.now();
    const mayStart = new Date('2026-05-01').getTime();
    const decEnd   = new Date('2026-12-31').getTime();
    const span     = decEnd - mayStart;

    const avgMonthly  = contribByMonth.filter(x => x > 0);
    const avgContrib  = avgMonthly.length ? Math.round(avgMonthly.reduce((s, v) => s + v, 0) / avgMonthly.length) : 0;
    const bestMonth   = Math.max(...contribByMonth);
    const gridOpts    = { color: 'rgba(0,0,0,0.05)' };

    return (
        <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '2px', bgcolor: MAROON }} />
                <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: MAROON }}>
                    Portfolio analytics
                </Typography>
            </Box>

            <Grid container spacing={2.5}>
                {/* Contribution history */}
                <Grid item xs={12} md={4}>
                    <Box sx={{ borderRadius: '12px', border: `1px solid ${alpha('#000', 0.08)}`, overflow: 'hidden' }}>
                        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${alpha('#000', 0.06)}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 22, height: 22, borderRadius: '5px', bgcolor: alpha(MAROON, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <BarChart2 size={12} color={MAROON} />
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#111' }}>Contribution history</Typography>
                                <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>Last 6 months · stacked by type</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ bgcolor: '#fff', p: 2 }}>
                            <Box sx={{ height: 130, mb: 1.5 }}>
                                <Bar
                                    data={{
                                        labels: MONTHS,
                                        datasets: [
                                            { label: 'Emergency', data: emergencyByMonth, backgroundColor: '#d97706', borderRadius: 3, stack: 'a' },
                                            { label: 'Pay-off',   data: payoffByMonth,   backgroundColor: '#dc2626', borderRadius: 3, stack: 'a' },
                                            { label: 'Savings',   data: savingsByMonth,  backgroundColor: '#0284c7', borderRadius: 3, stack: 'a' },
                                        ],
                                    }}
                                    options={{
                                        responsive: true, maintainAspectRatio: false,
                                        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` } } },
                                        scales: {
                                            x: { stacked: true, grid: gridOpts, ticks: { color: '#aaa', font: { size: 9 } } },
                                            y: { stacked: true, grid: gridOpts, ticks: { color: '#aaa', font: { size: 9 }, callback: v => `$${v}` } },
                                        },
                                    }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
                                {[['#d97706', 'Emergency'], ['#dc2626', 'Pay-off'], ['#0284c7', 'Savings']].map(([c, l]) => (
                                    <Box key={l} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: c }} />
                                        <Typography sx={{ fontSize: '0.6rem', color: '#888' }}>{l}</Typography>
                                    </Box>
                                ))}
                            </Box>
                            <Divider sx={{ mb: 1.25 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography sx={{ fontSize: '0.6rem', color: '#aaa', mb: 0.25 }}>Avg/month</Typography>
                                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{fmt(avgContrib)}</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography sx={{ fontSize: '0.6rem', color: '#aaa', mb: 0.25 }}>Best month</Typography>
                                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>{fmt(bestMonth)}</Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Grid>

                {/* Monthly allocation donut */}
                <Grid item xs={12} md={4}>
                    <Box sx={{ borderRadius: '12px', border: `1px solid ${alpha('#000', 0.08)}`, overflow: 'hidden', height: '100%' }}>
                        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${alpha('#000', 0.06)}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 22, height: 22, borderRadius: '5px', bgcolor: alpha('#16a34a', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Target size={12} color="#16a34a" />
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#111' }}>Monthly allocation</Typography>
                                <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>Budget split across envelopes</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ bgcolor: '#fff', p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ width: 110, height: 110, flexShrink: 0 }}>
                                    <Doughnut
                                        data={{ labels: donutLabels, datasets: [{ data: donutData, backgroundColor: donutColors, borderWidth: 0, hoverOffset: 4 }] }}
                                        options={{ cutout: '68%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmt(ctx.parsed)}` } } } }}
                                    />
                                </Box>
                                <Stack spacing={0.75} sx={{ flex: 1 }}>
                                    {donutLabels.map((label, i) => (
                                        <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: donutColors[i], flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: '0.65rem', color: '#333', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</Typography>
                                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#555', fontVariantNumeric: 'tabular-nums' }}>
                                                {Math.round((donutData[i] / monthlyBudget) * 100)}%
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                            <Divider sx={{ my: 1.5 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography sx={{ fontSize: '0.72rem', color: '#555' }}>Total committed</Typography>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: MAROON, fontVariantNumeric: 'tabular-nums' }}>{fmt(totalAlloc)} / {fmt(monthlyBudget)}</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={Math.min((totalAlloc / monthlyBudget) * 100, 100)}
                                            sx={{ height: 5, borderRadius: 3, bgcolor: alpha(MAROON, 0.1), '& .MuiLinearProgress-bar': { bgcolor: MAROON, borderRadius: 3 } }} />
                        </Box>
                    </Box>
                </Grid>

                {/* Savings velocity */}
                <Grid item xs={12} md={4}>
                    <Box sx={{ borderRadius: '12px', border: `1px solid ${alpha('#000', 0.08)}`, overflow: 'hidden', height: '100%' }}>
                        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${alpha('#000', 0.06)}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 22, height: 22, borderRadius: '5px', bgcolor: alpha('#d97706', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrendingUp size={12} color="#d97706" />
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#111' }}>Savings velocity</Typography>
                                <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>Actual vs. planned trajectory</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ bgcolor: '#fff', p: 2 }}>
                            <Box sx={{ height: 130, mb: 1.5 }}>
                                <Line
                                    data={{
                                        labels: velLabels,
                                        datasets: [
                                            { label: 'Planned', data: plannedData, borderColor: '#94a3b8', borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, fill: false, tension: 0.3 },
                                            { label: 'Actual',  data: actualData,  borderColor: MAROON,   borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: MAROON,
                                                fill: { target: 0, above: alpha('#16a34a', 0.08), below: alpha('#dc2626', 0.06) }, tension: 0.3 },
                                        ],
                                    }}
                                    options={{
                                        responsive: true, maintainAspectRatio: false,
                                        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` } } },
                                        scales: {
                                            x: { grid: gridOpts, ticks: { color: '#aaa', font: { size: 9 } } },
                                            y: { grid: gridOpts, ticks: { color: '#aaa', font: { size: 9 }, callback: v => `$${Number(v) >= 1000 ? (Number(v) / 1000).toFixed(1) + 'k' : v}` } },
                                        },
                                    }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                                {[['#94a3b8', 'Planned', true], [MAROON, 'Actual', false]].map(([c, l, dashed]) => (
                                    <Box key={String(l)} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box sx={{ width: 16, height: 2, bgcolor: String(c), opacity: dashed ? 0.5 : 1 }} />
                                        <Typography sx={{ fontSize: '0.6rem', color: '#888' }}>{String(l)}</Typography>
                                    </Box>
                                ))}
                            </Box>
                            <Divider sx={{ mb: 1.25 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography sx={{ fontSize: '0.6rem', color: '#aaa', mb: 0.25 }}>Portfolio pace</Typography>
                                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#16a34a' }}>Ahead</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography sx={{ fontSize: '0.6rem', color: '#aaa', mb: 0.25 }}>Projected Dec 31</Typography>
                                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: MAROON, fontVariantNumeric: 'tabular-nums' }}>$6,140</Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Grid>

                {/* Timeline */}
                <Grid item xs={12}>
                    <Box sx={{ borderRadius: '12px', border: `1px solid ${alpha('#000', 0.08)}`, overflow: 'hidden' }}>
                        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${alpha('#000', 0.06)}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 22, height: 22, borderRadius: '5px', bgcolor: alpha('#7c3aed', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Calendar size={12} color="#7c3aed" />
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#111' }}>Envelope timeline</Typography>
                                <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>All active goals plotted against the calendar — today marker shows current position</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ bgcolor: '#fff', p: 2 }}>
                            <Stack spacing={1.25}>
                                {active.filter(e => e.targetDate).map(env => {
                                    const envStart = new Date(env.startDate).getTime();
                                    const envEnd   = new Date(env.targetDate!).getTime();
                                    const leftPct  = Math.max(((Math.max(envStart, mayStart) - mayStart) / span) * 100, 0);
                                    const widthPct = Math.min(((Math.min(envEnd, decEnd) - Math.max(envStart, mayStart)) / span) * 100, 100 - leftPct);
                                    const todayPct = ((now - mayStart) / span) * 100;
                                    const c        = ENVELOPE_COLORS[env.envelopeType];
                                    const vel      = velocityDays(env);
                                    return (
                                        <Box key={env.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#555', width: 110, flexShrink: 0, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {env.envelopeName}
                                            </Typography>
                                            <Box sx={{ flex: 1, height: 20, borderRadius: '4px', bgcolor: alpha('#000', 0.04), position: 'relative', overflow: 'visible' }}>
                                                <Box sx={{ position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`, height: '100%', bgcolor: alpha(c, 0.85), borderRadius: '4px', display: 'flex', alignItems: 'center', px: 0.75, minWidth: 30 }}>
                                                    <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {new Date(env.targetDate!).toLocaleDateString('en-US', { month: 'short' })}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ position: 'absolute', left: `${Math.min(Math.max(todayPct, 0), 100)}%`, top: -4, width: 2, height: 28, bgcolor: alpha(MAROON, 0.7), borderRadius: '1px' }} />
                                            </Box>
                                            {vel !== null && (
                                                <Box sx={{ width: 70, flexShrink: 0 }}>
                                                    <VelocityChip days={vel} />
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Stack>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5, pl: '118px' }}>
                                {['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                                    <Typography key={m} sx={{ fontSize: '0.6rem', color: '#bbb' }}>{m}</Typography>
                                ))}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1, pl: '118px' }}>
                                <Box sx={{ width: 2, height: 12, bgcolor: alpha(MAROON, 0.6), borderRadius: '1px' }} />
                                <Typography sx={{ fontSize: '0.6rem', color: MAROON, fontWeight: 600 }}>Today</Typography>
                            </Box>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ChartsPanel;