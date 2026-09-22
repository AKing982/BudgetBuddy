import { addMonths, format } from 'date-fns';
import {
    Box,
    Typography,
    Chip,
    ToggleButtonGroup,
    ToggleButton,
    Slider,
    Divider,
    Button,
    TextField,
    InputAdornment,
    LinearProgress,
    Grid,
    IconButton,
} from '@mui/material';
import {
    X,
    TrendingUp,
    CheckCircle2,
    AlertTriangle,
    Info,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
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
    ACCOUNT_THEMES,
    themeForAccount,
    thresholdStatus,
    goalProgress,
    fmt,
    defaultGrowthRate,
    projectSeries,
    monthsToReachGoal,
} from './InvestmentUtils';

const DURATIONS = [
    { label: '3 mo', months: 3 },
    { label: '6 mo', months: 6 },
    { label: '1 yr', months: 12 },
    { label: '3 yr', months: 36 },
    { label: '5 yr', months: 60 },
    { label: '10 yr', months: 120 },
];

interface AccountDetailPanelProps {
    account: InvestmentAccount | null;
    onClose: () => void;
    onUpdateThreshold: (id: number, value: number | null) => void;
}

const AccountDetailPanel: React.FC<AccountDetailPanelProps> = ({ account, onClose, onUpdateThreshold }) => {
    const [months, setMonths] = useState<number>(12);
    const [extra, setExtra] = useState<number>(0);
    const [editingThreshold, setEditingThreshold] = useState(false);
    const [thresholdInput, setThresholdInput] = useState<string>('');

    // Reset local controls whenever a different account is selected
    React.useEffect(() => {
        setMonths(12);
        setExtra(0);
        setEditingThreshold(false);
        if (account) setThresholdInput(account.floorThreshold?.toString() ?? '');
    }, [account?.id]);

    const growthRate = account ? defaultGrowthRate(account.type) : 0;

    const series = useMemo(
        () => (account ? projectSeries(account, months, extra, growthRate) : []),
        [account, months, extra, growthRate]
    );

    const chartData = useMemo(
        () => series.map(p => ({
            label: p.month === 0 ? 'Now' : format(addMonths(new Date(), p.month), 'MMM yy'),
            balance: p.balance,
        })),
        [series]
    );

    const endBalance = series.length ? series[series.length - 1].balance : 0;
    const totalContributed = account ? (account.monthlyContribution + extra) * months : 0;
    const growthEarned = account ? Math.max(0, endBalance - account.balance - totalContributed) : 0;

    const goalPace = useMemo(() => {
        if (!account || !account.goalAmount || !account.goalDate) return null;
        const monthsAtCurrentPace = monthsToReachGoal(account, growthRate, 0);
        if (monthsAtCurrentPace === null) return { onPace: false, text: `Won't reach ${fmt(account.goalAmount)} within 50 years at the current pace.` };
        const projectedDate = addMonths(new Date(), monthsAtCurrentPace);
        const targetDate = new Date(account.goalDate);
        const diffMonths = Math.round((targetDate.getTime() - projectedDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
        if (diffMonths >= 0) {
            return { onPace: true, text: diffMonths === 0 ? 'On pace to land right on your target date.' : `On pace — about ${diffMonths} month${diffMonths === 1 ? '' : 's'} ahead of ${format(targetDate, 'MMM yyyy')}.` };
        }
        return { onPace: false, text: `About ${Math.abs(diffMonths)} month${Math.abs(diffMonths) === 1 ? '' : 's'} behind your ${format(targetDate, 'MMM yyyy')} target at the current contribution.` };
    }, [account, growthRate]);

    if (!account) {
        return (
            <Box sx={{
                borderRadius: '16px', border: `1px dashed ${MAROON}55`, p: 4,
                textAlign: 'center', bgcolor: '#faf7f7',
            }}>
                <TrendingUp size={26} color={MAROON} style={{ opacity: 0.5, marginBottom: 10 }} />
                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 0.5 }}>
                    Select an account
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#888' }}>
                    Click any account on the left to see its details and preview where it's headed.
                </Typography>
            </Box>
        );
    }

    const { key, label } = themeForAccount(account.type);
    const t = ACCOUNT_THEMES[key];
    const status = thresholdStatus(account.balance, account.floorThreshold);
    const pct = goalProgress(account.balance, account.goalAmount);

    return (
        <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${MAROON}26`, boxShadow: `0 4px 24px ${MAROON}1a`, bgcolor: '#fff' }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <Box sx={{
                background: `linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)`,
                px: 3, py: 2.25, position: 'relative', overflow: 'hidden',
            }}>
                <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                    <Box>
                        <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, mb: 0.25 }}>
                            {label} · {account.institution}
                        </Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                            {account.name}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.75)', mt: -0.5, mr: -1 }}>
                        <X size={16} />
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{ p: 3 }}>

                {/* ── Balance + goal progress ──────────────────────────────── */}
                <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.9rem', color: t.valueColor, lineHeight: 1 }}>
                    {fmt(account.balance)}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#888', mt: 0.5, mb: 2 }}>
                    {account.monthlyContribution > 0 ? `+${fmt(account.monthlyContribution)}/mo contribution` : 'No auto-contribution set'}
                </Typography>

                {account.goalAmount && (
                    <Box sx={{ mb: 2.5 }}>
                        <LinearProgress variant="determinate" value={pct}
                                        sx={{ height: 6, borderRadius: 3, mb: 0.75, bgcolor: `${t.barColor}26`, '& .MuiLinearProgress-bar': { bgcolor: t.barColor, borderRadius: 3 } }} />
                        <Typography sx={{ fontSize: '0.72rem', color: '#888' }}>
                            {pct.toFixed(0)}% of {fmt(account.goalAmount)}
                            {account.goalDate ? ` · target ${format(new Date(account.goalDate), 'MMM yyyy')}` : ''}
                        </Typography>
                    </Box>
                )}

                <Chip
                    size="small"
                    icon={status.ok ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                    label={account.floorThreshold ? status.label : 'No floor set'}
                    onClick={() => setEditingThreshold(v => !v)}
                    sx={{
                        height: 24, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', mb: editingThreshold ? 1.5 : 3,
                        bgcolor: status.ok ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)',
                        color: status.ok ? '#15803d' : '#991b1b',
                    }}
                />

                {editingThreshold && (
                    <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
                        <TextField
                            size="small" fullWidth label="Balance floor" value={thresholdInput}
                            onChange={(e) => setThresholdInput(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                        />
                        <Button size="small" variant="contained" sx={{ textTransform: 'none', bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK } }}
                                onClick={() => { onUpdateThreshold(account.id, thresholdInput === '' ? null : Number(thresholdInput)); setEditingThreshold(false); }}>
                            Save
                        </Button>
                    </Box>
                )}

                <Divider sx={{ mb: 2.5 }} />

                {/* ── Prediction controls ──────────────────────────────────── */}
                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 1.5 }}>
                    Where this account will be
                </Typography>

                <ToggleButtonGroup
                    value={months}
                    exclusive
                    size="small"
                    onChange={(_, v) => { if (v !== null) setMonths(v); }}
                    sx={{
                        mb: 2, flexWrap: 'wrap', gap: 0.5,
                        '& .MuiToggleButton-root': {
                            border: `1px solid ${MAROON}33`, borderRadius: '6px !important', textTransform: 'none',
                            fontSize: '0.72rem', fontWeight: 700, color: MAROON, px: 1.25, py: 0.4,
                            '&.Mui-selected': { bgcolor: MAROON, color: '#fff', '&:hover': { bgcolor: MAROON_DARK } },
                        },
                    }}
                >
                    {DURATIONS.map(d => <ToggleButton key={d.months} value={d.months}>{d.label}</ToggleButton>)}
                </ToggleButtonGroup>

                <Typography sx={{ fontSize: '0.7rem', color: '#888', fontWeight: 700, mb: 1 }}>
                    TEST AN EXTRA MONTHLY CONTRIBUTION — <Box component="span" sx={{ color: MAROON, fontWeight: 800 }}>+${extra}</Box>
                </Typography>
                <Slider value={extra} min={0} max={500} step={25} onChange={(_, v) => setExtra(v as number)} sx={{ color: MAROON, mb: 2.5 }} />

                {/* ── Chart ─────────────────────────────────────────────────── */}
                <Box sx={{ height: 180, mb: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#999' }} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 10, fill: '#999' }} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                            <Tooltip formatter={(v: number) => fmt(v)} labelStyle={{ fontSize: 12 }} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                            {account.goalAmount && (
                                <ReferenceLine y={account.goalAmount} stroke={t.border} strokeDasharray="4 4"
                                               label={{ value: 'Goal', fontSize: 10, fill: t.border, position: 'insideTopLeft' }} />
                            )}
                            <Line type="monotone" dataKey="balance" stroke={MAROON} strokeWidth={2.5} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </Box>

                {/* ── Summary boxes ─────────────────────────────────────────── */}
                <Grid container spacing={1.5} sx={{ mb: goalPace ? 2 : 0 }}>
                    <Grid item xs={4}>
                        <Box sx={{ bgcolor: '#f8f9fa', borderRadius: '8px', p: 1.25, textAlign: 'center' }}>
                            <Typography sx={{ fontSize: '0.6rem', color: '#888', mb: 0.25 }}>PROJECTED</Typography>
                            <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: '#15803d' }}>{fmt(endBalance)}</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={4}>
                        <Box sx={{ bgcolor: '#f8f9fa', borderRadius: '8px', p: 1.25, textAlign: 'center' }}>
                            <Typography sx={{ fontSize: '0.6rem', color: '#888', mb: 0.25 }}>CONTRIBUTED</Typography>
                            <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem' }}>{fmt(totalContributed)}</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={4}>
                        <Box sx={{ bgcolor: '#f8f9fa', borderRadius: '8px', p: 1.25, textAlign: 'center' }}>
                            <Typography sx={{ fontSize: '0.6rem', color: '#888', mb: 0.25 }}>GROWTH</Typography>
                            <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: t.valueColor }}>{fmt(growthEarned)}</Typography>
                        </Box>
                    </Grid>
                </Grid>

                {goalPace && (
                    <Box sx={{
                        display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, borderRadius: '8px',
                        bgcolor: goalPace.onPace ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
                    }}>
                        {goalPace.onPace ? <CheckCircle2 size={14} color="#15803d" style={{ marginTop: 1, flexShrink: 0 }} /> : <Info size={14} color="#991b1b" style={{ marginTop: 1, flexShrink: 0 }} />}
                        <Typography sx={{ fontSize: '0.75rem', color: goalPace.onPace ? '#15803d' : '#991b1b', lineHeight: 1.5 }}>
                            {goalPace.text}
                        </Typography>
                    </Box>
                )}

                <Typography sx={{ fontSize: '0.65rem', color: '#aaa', mt: 2, lineHeight: 1.5 }}>
                    Assumes a {growthRate}% average annual return, compounded monthly. Estimate only — replace with a real projection service for production use.
                </Typography>
            </Box>
        </Box>
    );
};

export default AccountDetailPanel;