import React, { useMemo, useState } from 'react';
import {
    alpha, Box, Button, Chip, Divider, Grid, Table, TableBody,
    TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { BudgetEnvelope, EnvelopeContribution } from '../config/Types';
import { ENVELOPE_COLORS } from '../config/Constants';
import { fmt, daysUntil, addMonths, buildAmortization, monthsBetween } from '../config/Helpers';

interface PaymentPlanPanelProps {
    envelope:      BudgetEnvelope;
    contributions: EnvelopeContribution[];
}

const PaymentPlanPanel: React.FC<PaymentPlanPanelProps> = ({ envelope, contributions }) => {
    const plan = envelope.paymentPlan!;
    const [extraPayment,   setExtraPayment]   = useState(30);
    const [showFullTable,  setShowFullTable]   = useState(false);
    const color = ENVELOPE_COLORS[envelope.envelopeType];

    const monthly     = envelope.allocatedAmount + extraPayment;
    const rows        = useMemo(() => buildAmortization(plan, envelope.currentAmount, monthly), [plan, envelope.currentAmount, monthly]);
    const baseRows    = useMemo(() => buildAmortization(plan, envelope.currentAmount, plan.minPayment), [plan, envelope.currentAmount]);
    const displayRows = showFullTable ? rows : rows.slice(0, 6);

    const accelDate  = rows[rows.length - 1]?.date ?? '—';
    const baseDate   = baseRows[baseRows.length - 1]?.date ?? '—';
    const deadlineDays = daysUntil(envelope.targetDate);
    const accelMonths  = rows.length;
    const clearsByDeadline = deadlineDays !== null && accelMonths <= Math.ceil(deadlineDays / 30);

    const chartLabels = Array.from({ length: Math.max(baseRows.length, rows.length) }, (_, i) => {
        const d = addMonths(new Date('2026-02-01'), i);
        return d.toLocaleDateString('en-US', { month: 'short' });
    });
    const baseBalances  = chartLabels.map((_, i) => baseRows[i]?.balance ?? 0);
    const accelBalances = chartLabels.map((_, i) => rows[i]?.balance ?? 0);

    const statusColor: Record<string, string> = { PAID: '#16a34a', DUE: '#d97706', UPCOMING: '#94a3b8', FINAL: '#16a34a' };
    const statusBg:    Record<string, string> = { PAID: alpha('#16a34a', 0.1), DUE: alpha('#d97706', 0.1), UPCOMING: alpha('#94a3b8', 0.08), FINAL: alpha('#16a34a', 0.1) };

    return (
        <Box sx={{ mt: 2 }}>
            {plan.isDeferred && (
                <Box sx={{ mb: 2, p: 1.5, borderRadius: '10px', bgcolor: alpha('#dc2626', 0.06), border: `1px solid ${alpha('#dc2626', 0.2)}`, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <AlertTriangle size={14} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                    <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: '#dc2626' }}>
                            Deferred interest at risk: {fmt(plan.deferredInterest)}
                        </Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: '#7f1d1d', mt: 0.25, lineHeight: 1.4 }}>
                            If {fmt(envelope.remainingAmount)} isn't cleared by {envelope.targetDate ? new Date(envelope.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}, the full {plan.apr > 0 ? plan.apr : 26.99}% APR back-interest applies from day one.
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* Stats grid */}
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {[
                    { label: 'Original balance', value: fmt(plan.originalBalance) },
                    { label: 'Paid so far',       value: fmt(envelope.currentAmount), accent: '#16a34a' },
                    { label: 'Remaining',          value: fmt(envelope.remainingAmount), accent: '#dc2626' },
                    { label: 'Min payment',        value: `${fmt(plan.minPayment)}/mo` },
                    { label: 'Term',               value: `${plan.termMonths} months` },
                    { label: 'APR',                value: plan.apr === 0 ? '0% (deferred)' : `${plan.apr}%` },
                ].map(({ label, value, accent }) => (
                    <Grid item xs={6} sm={4} key={label}>
                        <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
                            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', mb: 0.25 }}>{label}</Typography>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: accent ?? '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>

            <Divider sx={{ mb: 2 }} />

            {/* Acceleration slider */}
            <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.25 }}>
                Payoff acceleration
            </Typography>
            <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#555', flexShrink: 0 }}>Extra per month</Typography>
                <Box sx={{ flex: 1, px: 1 }}>
                    <input type="range" min={0} max={200} step={5} value={extraPayment}
                           onChange={e => setExtraPayment(Number(e.target.value))}
                           style={{ width: '100%', accentColor: color }} />
                </Box>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color, minWidth: 44, fontVariantNumeric: 'tabular-nums' }}>
                    +${extraPayment}
                </Typography>
            </Box>

            <Grid container spacing={1.5} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                    <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: alpha('#94a3b8', 0.07), border: `1px solid ${alpha('#94a3b8', 0.2)}` }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#888', mb: 0.5 }}>Min only ({fmt(plan.minPayment)}/mo)</Typography>
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#555' }}>{baseDate}</Typography>
                        <Typography sx={{ fontSize: '0.62rem', color: plan.isDeferred ? '#dc2626' : '#888', mt: 0.25, fontWeight: plan.isDeferred ? 700 : 400 }}>
                            {plan.isDeferred ? `${fmt(plan.deferredInterest)} interest risk` : `${baseRows.length} months`}
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={6}>
                    <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: clearsByDeadline ? alpha('#16a34a', 0.06) : alpha('#d97706', 0.06), border: `1px solid ${clearsByDeadline ? alpha('#16a34a', 0.2) : alpha('#d97706', 0.2)}` }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: clearsByDeadline ? '#15803d' : '#92400e', mb: 0.5 }}>
                            With +${extraPayment} ({fmt(monthly)}/mo)
                        </Typography>
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: clearsByDeadline ? '#15803d' : '#d97706' }}>{accelDate}</Typography>
                        <Typography sx={{ fontSize: '0.62rem', color: clearsByDeadline ? '#15803d' : '#92400e', mt: 0.25, fontWeight: 700 }}>
                            {clearsByDeadline ? `Saves ${fmt(plan.deferredInterest)} interest` : 'Increase more to beat deadline'}
                        </Typography>
                    </Box>
                </Grid>
            </Grid>

            {/* Balance chart */}
            <Box sx={{ mb: 2, height: 120 }}>
                <Line
                    data={{
                        labels: chartLabels,
                        datasets: [
                            { label: 'Minimum',     data: baseBalances,  borderColor: '#94a3b8', borderWidth: 1.5, borderDash: [4, 3], pointRadius: 0, tension: 0.3, fill: false },
                            { label: 'Accelerated', data: accelBalances, borderColor: color,     borderWidth: 2,   pointRadius: 2, pointBackgroundColor: color, tension: 0.3, fill: false },
                        ],
                    }}
                    options={{
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` } } },
                        scales: {
                            x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#aaa', font: { size: 9 } } },
                            y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#aaa', font: { size: 9 }, callback: v => `$${v}` } },
                        },
                    }}
                />
            </Box>

            <Divider sx={{ mb: 1.5 }} />

            {/* Amortization table */}
            <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1 }}>
                Payment schedule
            </Typography>
            <Box sx={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f8f8f8' }}>
                            {['#', 'Month', 'Payment', 'Principal', 'Interest', 'Balance', ''].map(h => (
                                <TableCell key={h} sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', py: 0.75, px: 1, borderBottom: '1px solid #eee' }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayRows.map((row, i) => (
                            <TableRow key={i} sx={{ bgcolor: row.status === 'DUE' ? alpha('#d97706', 0.04) : i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                <TableCell sx={{ fontSize: '0.7rem', color: '#aaa', py: 0.75, px: 1 }}>{row.month}</TableCell>
                                <TableCell sx={{ fontSize: '0.72rem', color: '#111', py: 0.75, px: 1, fontWeight: 500 }}>{row.date}</TableCell>
                                <TableCell sx={{ fontSize: '0.72rem', color: '#111', py: 0.75, px: 1, fontVariantNumeric: 'tabular-nums' }}>{fmt(row.payment)}</TableCell>
                                <TableCell sx={{ fontSize: '0.72rem', color: '#16a34a', py: 0.75, px: 1, fontVariantNumeric: 'tabular-nums' }}>{fmt(row.principal)}</TableCell>
                                <TableCell sx={{ fontSize: '0.72rem', color: row.interest > 0 ? '#dc2626' : '#aaa', py: 0.75, px: 1, fontVariantNumeric: 'tabular-nums' }}>{fmt(row.interest)}</TableCell>
                                <TableCell sx={{ fontSize: '0.72rem', color: row.balance === 0 ? '#16a34a' : '#111', py: 0.75, px: 1, fontVariantNumeric: 'tabular-nums', fontWeight: row.balance === 0 ? 800 : 400 }}>
                                    {row.balance === 0 ? '—' : fmt(row.balance)}
                                </TableCell>
                                <TableCell sx={{ py: 0.75, px: 1 }}>
                                    <Chip size="small"
                                          label={row.status === 'FINAL' ? 'Final' : row.status.charAt(0) + row.status.slice(1).toLowerCase()}
                                          sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700, bgcolor: statusBg[row.status], color: statusColor[row.status] }} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Box>
            {rows.length > 6 && (
                <Button size="small" onClick={() => setShowFullTable(p => !p)}
                        endIcon={showFullTable ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        sx={{ mt: 0.75, textTransform: 'none', fontSize: '0.72rem', color: '#888', fontWeight: 600 }}>
                    {showFullTable ? 'Show less' : `Show all ${rows.length} payments`}
                </Button>
            )}
            <Box sx={{ mt: 1.5, p: 1.25, borderRadius: '8px', bgcolor: alpha('#16a34a', 0.06), border: `1px solid ${alpha('#16a34a', 0.2)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#333' }}>Total paid (0% APR)</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: '0.95rem', color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(plan.originalBalance)} · $0.00 interest
                </Typography>
            </Box>
        </Box>
    );
};

export default PaymentPlanPanel;