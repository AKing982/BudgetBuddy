import { addMonths, format } from 'date-fns';
import {
    Box,
    Dialog,
    Typography,
    Slider,
    Grid,
    LinearProgress,
    Button,
    IconButton,
    Divider,
} from '@mui/material';
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
} from 'recharts';
import {
    MAROON,
    MAROON_DARK,
    InvestmentAccount,
    Portfolio,
    portfolioBalance,
    portfolioGrowthRate,
    portfolioMonthlyDollarContribution,
    monthsUntil,
    projectBalanceSeries,
    monthsToReachAmount,
    fmt,
} from './InvestmentUtils';

interface AdjustContributionDialogProps {
    open: boolean;
    portfolio: Portfolio | null;
    accounts: InvestmentAccount[];
    monthlyIncome: number;
    availableBudget: number; // unallocated budget across all portfolios, before this preview change
    onClose: () => void;
    onApply: (portfolioId: number, newPct: number) => void;
}

const EMPTY_PORTFOLIO: Portfolio = { id: 0, name: '', goal: '', accountIds: [], targetAmount: 0, targetDate: new Date().toISOString(), contributionPercentage: 0 };

const AdjustContributionDialog: React.FC<AdjustContributionDialogProps> = ({
                                                                               open, portfolio, accounts, monthlyIncome, availableBudget, onClose, onApply,
                                                                           }) => {
    const [previewPct, setPreviewPct] = useState<number>(portfolio?.contributionPercentage ?? 0);

    useEffect(() => {
        if (open && portfolio) setPreviewPct(portfolio.contributionPercentage);
    }, [open, portfolio?.id]);

    // Every hook below must run on every render regardless of whether a
    // portfolio is selected, so we compute against a safe fallback and only
    // bail out (return null) after every hook has been called.
    const active = portfolio ?? EMPTY_PORTFOLIO;

    const balance = portfolioBalance(active, accounts);
    const growthRate = portfolioGrowthRate(active, accounts);
    const monthsRemaining = monthsUntil(active.targetDate);
    const currentMonthly = portfolioMonthlyDollarContribution(active, monthlyIncome);
    const previewMonthly = monthlyIncome * (previewPct / 100);

    // ── Investments side: projected balance at the target date ──────────────
    const series = useMemo(
        () => projectBalanceSeries(balance, previewMonthly, monthsRemaining, growthRate),
        [balance, previewMonthly, monthsRemaining, growthRate]
    );
    const chartData = useMemo(
        () => series.map(p => ({ label: p.month === 0 ? 'Now' : format(addMonths(new Date(), p.month), 'MMM yy'), balance: p.balance })),
        [series]
    );
    const projectedAtTargetDate = series.length ? series[series.length - 1].balance : balance;
    const pacePct = active.targetAmount > 0 ? Math.min(100, (projectedAtTargetDate / active.targetAmount) * 100) : 0;

    const monthsAtPreview = monthsToReachAmount(balance, previewMonthly, active.targetAmount, growthRate);
    const pace = useMemo(() => {
        if (monthsAtPreview === null) return { onPace: false, text: `Won't reach ${fmt(active.targetAmount)} within 50 years at this rate.` };
        const projectedDate = addMonths(new Date(), monthsAtPreview);
        const diffMonths = Math.round((new Date(active.targetDate).getTime() - projectedDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
        if (diffMonths >= 0) return { onPace: true, text: diffMonths === 0 ? `Right on pace for ${format(new Date(active.targetDate), 'MMM yyyy')}.` : `${diffMonths} month${diffMonths === 1 ? '' : 's'} ahead of target.` };
        return { onPace: false, text: `${Math.abs(diffMonths)} month${Math.abs(diffMonths) === 1 ? '' : 's'} behind target.` };
    }, [monthsAtPreview, active.targetAmount, active.targetDate]);

    // ── Budget side: what this change does to this month's remaining budget ──
    // availableBudget already has every portfolio's *current* contribution
    // subtracted out, including this one — so shifting this portfolio's %
    // only moves remaining by the delta between preview and current.
    const delta = previewMonthly - currentMonthly;
    const newRemaining = availableBudget - delta;
    const remainingStatus: 'good' | 'warn' | 'bad' =
        newRemaining < 0 ? 'bad' : newRemaining < monthlyIncome * 0.05 ? 'warn' : 'good';
    const remainingColor = remainingStatus === 'bad' ? '#991b1b' : remainingStatus === 'warn' ? '#92400e' : '#15803d';
    const remainingBarPct = Math.max(0, Math.min(100, (newRemaining / monthlyIncome) * 100 * 6));

    if (!portfolio) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <Box sx={{ background: `linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)`, px: 3, py: 2.25, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                    <Box>
                        <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>Adjust contribution</Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>{portfolio.name}</Typography>
                    </Box>
                    <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.75)', mt: -0.5, mr: -1 }}><X size={16} /></IconButton>
                </Box>
            </Box>

            <Box sx={{ p: 3 }}>
                <Typography sx={{ fontSize: '0.7rem', color: '#888', fontWeight: 700, mb: 1 }}>
                    CONTRIBUTION — <Box component="span" sx={{ color: MAROON, fontWeight: 800 }}>{previewPct.toFixed(1)}% (${Math.round(previewMonthly)}/mo)</Box>
                </Typography>
                <Slider value={previewPct} min={0} max={50} step={0.5} onChange={(_, v) => setPreviewPct(v as number)} sx={{ color: MAROON, mb: 3 }} />

                <Grid container sx={{ border: '1px solid #eee', borderRadius: 2, overflow: 'hidden', mb: 2.5 }}>
                    <Grid item xs={6} sx={{ p: 2, borderRight: '1px solid #eee' }}>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#888', letterSpacing: '0.04em', mb: 1 }}>FROM THIS PORTFOLIO</Typography>
                        <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.4rem', color: MAROON, lineHeight: 1 }}>{fmt(projectedAtTargetDate)}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#888', mt: 0.5 }}>projected at target date</Typography>
                        <LinearProgress variant="determinate" value={pacePct} sx={{ height: 5, borderRadius: 3, mt: 1.5, bgcolor: `${MAROON}26`, '& .MuiLinearProgress-bar': { bgcolor: MAROON, borderRadius: 3 } }} />
                    </Grid>
                    <Grid item xs={6} sx={{ p: 2 }}>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#888', letterSpacing: '0.04em', mb: 1 }}>FROM YOUR BUDGET</Typography>
                        <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.4rem', color: remainingColor, lineHeight: 1 }}>{fmt(newRemaining)}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#888', mt: 0.5 }}>remaining this month</Typography>
                        <LinearProgress variant="determinate" value={remainingBarPct} sx={{ height: 5, borderRadius: 3, mt: 1.5, bgcolor: '#eee', '& .MuiLinearProgress-bar': { bgcolor: remainingColor, borderRadius: 3 } }} />
                    </Grid>
                </Grid>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, borderRadius: '8px', bgcolor: pace.onPace ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)', mb: 1.5 }}>
                    {pace.onPace ? <CheckCircle2 size={14} color="#15803d" style={{ marginTop: 1, flexShrink: 0 }} /> : <Info size={14} color="#991b1b" style={{ marginTop: 1, flexShrink: 0 }} />}
                    <Typography sx={{ fontSize: '0.75rem', color: pace.onPace ? '#15803d' : '#991b1b', lineHeight: 1.5 }}>{pace.text}</Typography>
                </Box>

                {remainingStatus !== 'good' && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, borderRadius: '8px', bgcolor: remainingStatus === 'bad' ? 'rgba(220,38,38,0.08)' : 'rgba(217,119,6,0.08)', mb: 2 }}>
                        <AlertTriangle size={14} color={remainingStatus === 'bad' ? '#991b1b' : '#92400e'} style={{ marginTop: 1, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.75rem', color: remainingStatus === 'bad' ? '#991b1b' : '#92400e', lineHeight: 1.5 }}>
                            {remainingStatus === 'bad'
                                ? `This would put your budget ${fmt(Math.abs(newRemaining))} over for the month.`
                                : `This leaves very little unallocated — one unexpected expense would put you over budget.`}
                        </Typography>
                    </Box>
                )}

                <Box sx={{ height: 160, mb: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#999' }} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 10, fill: '#999' }} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                            <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                            <ReferenceLine y={portfolio.targetAmount} stroke={MAROON} strokeDasharray="4 4" label={{ value: 'Target', fontSize: 10, fill: MAROON, position: 'insideTopLeft' }} />
                            <Line type="monotone" dataKey="balance" stroke={MAROON} strokeWidth={2.5} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                    <Button variant="outlined" onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '6px' }}>Cancel</Button>
                    <Button
                        variant="contained" disabled={previewPct === portfolio.contributionPercentage}
                        onClick={() => { onApply(portfolio.id, previewPct); onClose(); }}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '6px', bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK } }}
                    >
                        Apply {previewPct.toFixed(1)}%
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
};

export default AdjustContributionDialog;