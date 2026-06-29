import React, { useMemo, useState } from 'react';
import { alpha, Box, Button, Divider, Grid, Slider, Typography } from '@mui/material';
import { AlertTriangle, RotateCcw, Check } from 'lucide-react';
import { BudgetEnvelope, EnvelopeContribution } from '../config/Types';
import { MAROON } from '../config/Constants';
import { fmt } from '../config/Helpers';

/**
 * Fallback APR used for the amortization math when the envelope's payment
 * plan doesn't carry a real rate yet. Pass the real `apr` prop in once
 * `PaymentPlan` exposes it so this stops being an estimate.
 */
const FALLBACK_APR = 0.2499;
const MAX_AMORTIZATION_MONTHS = 600;

interface PaymentPlanAdjusterProps {
    envelope:      BudgetEnvelope;
    contributions: EnvelopeContribution[];
    /** Annual percentage rate, as a decimal (0.2499 = 24.99%). Falls back to FALLBACK_APR if omitted. */
    apr?: number;
    /** Called when the user applies the adjusted schedule — passes the new monthly allocation to commit. */
    onApply: (envelopeId: number, newMonthlyAllocation: number) => void;
}

interface Schedule {
    /** Number of months to reach a zero balance, or null if the payment never covers the interest */
    months: number | null;
    totalInterest: number | null;
    /** Balance at the end of each month, index 0 = today */
    points: number[];
}

function buildSchedule(balance: number, monthlyRate: number, payment: number): Schedule {
    if (balance <= 0) return { months: 0, totalInterest: 0, points: [0] };
    if (payment <= balance * monthlyRate) return { months: null, totalInterest: null, points: [balance] };

    let remaining = balance;
    let months = 0;
    let totalInterest = 0;
    const points: number[] = [remaining];

    while (remaining > 0 && months < MAX_AMORTIZATION_MONTHS) {
        const interest  = remaining * monthlyRate;
        const principal = Math.min(payment - interest, remaining);
        remaining = Math.max(remaining - principal, 0);
        totalInterest += interest;
        months += 1;
        points.push(Math.round(remaining));
    }

    return { months, totalInterest: Math.round(totalInterest), points };
}

function monthsToDateLabel(months: number): string {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** Downsamples a points array to at most `maxPoints` entries, always keeping the first and last. */
function downsample(points: number[], maxPoints: number): number[] {
    if (points.length <= maxPoints) return points;
    const stride = Math.ceil(points.length / maxPoints);
    const sampled: number[] = [];
    for (let i = 0; i < points.length; i += stride) sampled.push(points[i]);
    if (sampled[sampled.length - 1] !== points[points.length - 1]) sampled.push(points[points.length - 1]);
    return sampled;
}

/**
 * Pure visual + interactive content for adjusting a payoff envelope's
 * monthly payment estimate: current plan stats, a slider for extra monthly
 * payment, a live preview of the resulting payoff date / interest saved /
 * new required allocation, and a schedule comparison chart — all inert
 * until the user explicitly applies it.
 *
 * Takes the same `envelope` + `contributions` shape used elsewhere on the
 * page, so it can sit in the left panel's tab system as another view
 * alongside Envelopes / Analytics / Pay plan.
 */
const PaymentPlanAdjuster: React.FC<PaymentPlanAdjusterProps> = ({ envelope, contributions, apr, onApply }) => {
    const [extra, setExtra] = useState(0);

    const balance     = envelope.remainingAmount;
    const annualRate  = apr ?? FALLBACK_APR;
    const monthlyRate = annualRate / 12;
    const basePayment = envelope.allocatedAmount;

    const current  = useMemo(() => buildSchedule(balance, monthlyRate, basePayment), [balance, monthlyRate, basePayment]);
    const adjusted = useMemo(() => buildSchedule(balance, monthlyRate, basePayment + extra), [balance, monthlyRate, basePayment, extra]);

    const maxExtra = Math.max(Math.ceil(balance / 4 / 5) * 5, 50);

    const infeasible = adjusted.months === null;
    const monthsSaved    = !infeasible && current.months !== null ? current.months - (adjusted.months as number) : null;
    const interestSaved  = !infeasible && current.totalInterest !== null
        ? Math.max(current.totalInterest - (adjusted.totalInterest as number), 0)
        : null;

    const chartPoints = useMemo(() => {
        const span = Math.max(current.points.length, adjusted.points.length);
        const pad = (arr: number[]) => {
            if (arr.length >= span) return arr;
            return [...arr, ...Array(span - arr.length).fill(0)];
        };
        const currentPadded  = downsample(pad(current.points), 60);
        const adjustedPadded = downsample(pad(adjusted.points), 60);
        return { currentPadded, adjustedPadded };
    }, [current.points, adjusted.points]);

    const handleApply = () => {
        if (infeasible || extra === 0) return;
        onApply(envelope.id, basePayment + extra);
    };

    const handleDiscard = () => setExtra(0);

    // ── Chart geometry ──────────────────────────────────────────────────────
    const chartW = 600, chartH = 160, padL = 8, padR = 8, padT = 8, padB = 8;
    const maxBalance = Math.max(balance, 1);
    const toPath = (points: number[]) => points.map((v, i) => {
        const x = padL + (points.length > 1 ? (i / (points.length - 1)) * (chartW - padL - padR) : 0);
        const y = chartH - padB - (Math.min(v, maxBalance) / maxBalance) * (chartH - padT - padB);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const statCard = (label: string, value: string) => (
        <Box sx={{ p: 1, borderRadius: '6px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#bbb', mb: 0.25 }}>{label}</Typography>
            <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
        </Box>
    );

    return (
        <Box>
            {/* Current plan stats */}
            <Grid container spacing={1.25} sx={{ mb: 2.5 }}>
                <Grid item xs={6} sm={3}>{statCard('Remaining', fmt(balance))}</Grid>
                <Grid item xs={6} sm={3}>{statCard('APR', `${(annualRate * 100).toFixed(2)}%`)}</Grid>
                <Grid item xs={6} sm={3}>{statCard('Current payment', `${fmt(basePayment)}/mo`)}</Grid>
                <Grid item xs={6} sm={3}>{statCard('Current payoff', current.months !== null ? monthsToDateLabel(current.months) : 'Never')}</Grid>
            </Grid>

            {/* Adjustment slider */}
            <Box sx={{ mb: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#444' }}>Add extra to monthly payment</Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: MAROON }}>{fmt(extra)}</Typography>
                </Box>
                <Slider
                    value={extra}
                    onChange={(_, v) => setExtra(v as number)}
                    min={0}
                    max={maxExtra}
                    step={5}
                    sx={{
                        color: MAROON,
                        '& .MuiSlider-thumb': { width: 16, height: 16 },
                        '& .MuiSlider-rail': { opacity: 0.2 },
                    }}
                />
            </Box>

            {/* Preview */}
            <Box sx={{ mb: 2.5, p: 2, borderRadius: '10px', bgcolor: alpha(MAROON, 0.05), border: `1px solid ${alpha(MAROON, 0.18)}` }}>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: MAROON, mb: 1.25 }}>
                    Preview — not yet applied
                </Typography>

                {infeasible ? (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <AlertTriangle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                        <Typography sx={{ fontSize: '0.78rem', color: '#7f1d1d' }}>
                            This payment doesn't cover the monthly interest — increase it to make progress on the balance.
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={1.5}>
                        <Grid item xs={6} sm={3}>
                            <Typography sx={{ fontSize: '0.6rem', color: alpha(MAROON, 0.7), mb: 0.2 }}>New monthly total</Typography>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: MAROON }}>{fmt(basePayment + extra)}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Typography sx={{ fontSize: '0.6rem', color: alpha(MAROON, 0.7), mb: 0.2 }}>New payoff date</Typography>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: MAROON }}>{monthsToDateLabel(adjusted.months as number)}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Typography sx={{ fontSize: '0.6rem', color: alpha(MAROON, 0.7), mb: 0.2 }}>Time saved</Typography>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: MAROON }}>{monthsSaved !== null && monthsSaved > 0 ? `${monthsSaved} mo` : '0 mo'}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Typography sx={{ fontSize: '0.6rem', color: alpha(MAROON, 0.7), mb: 0.2 }}>Interest saved</Typography>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: MAROON }}>{interestSaved !== null ? fmt(interestSaved) : '—'}</Typography>
                        </Grid>
                    </Grid>
                )}
            </Box>

            {/* Schedule comparison chart */}
            <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: '#bbb' }} />
                        <Typography sx={{ fontSize: '0.65rem', color: '#888' }}>Current plan</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: MAROON }} />
                        <Typography sx={{ fontSize: '0.65rem', color: '#888' }}>Adjusted plan</Typography>
                    </Box>
                </Box>
                <Box sx={{ borderRadius: '8px', border: '1px solid #eee', bgcolor: '#fafafa', p: 1 }}>
                    <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" height="140" preserveAspectRatio="none">
                        <path d={toPath(chartPoints.currentPadded)} fill="none" stroke="#bbb" strokeWidth={2} />
                        <path d={toPath(chartPoints.adjustedPadded)} fill="none" stroke={MAROON} strokeWidth={2} />
                    </svg>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>Today</Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>{fmt(balance)} remaining</Typography>
                    </Box>
                </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<RotateCcw size={12} />}
                    onClick={handleDiscard}
                    disabled={extra === 0}
                    sx={{ borderRadius: '7px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderColor: '#d5d5d5', color: '#666', '&:hover': { borderColor: '#aaa', bgcolor: '#f5f5f5' } }}
                >
                    Discard
                </Button>
                <Button
                    size="small"
                    variant="contained"
                    startIcon={<Check size={12} />}
                    onClick={handleApply}
                    disabled={extra === 0 || infeasible}
                    sx={{ borderRadius: '7px', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', bgcolor: MAROON, '&:hover': { bgcolor: '#7f1d1d' } }}
                >
                    Apply this schedule
                </Button>
            </Box>
        </Box>
    );
};

export default PaymentPlanAdjuster;