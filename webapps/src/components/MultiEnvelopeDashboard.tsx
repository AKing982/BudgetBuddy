import React, { useState } from 'react';
import {
    alpha, Box, Button, Grid, IconButton, InputAdornment,
    LinearProgress, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import {
    AlertTriangle, CheckCircle, ChevronRight, GripVertical,
    Lock, RefreshCw, TrendingUp, Unlock,
} from 'lucide-react';
import { BudgetEnvelope, EnvelopeContribution } from './BudgetEnvelopesPage';

// ── Types ──────────────────────────────────────────────────────────────────────
interface PlanEntry {
    envelopeId:   number;
    priority:     number;
    monthlyAlloc: number;
    locked:       boolean;
    autoAlloc:    number;
}

interface PlanResult {
    envelopeId:    number;
    monthlyAlloc:  number;
    projectedDate: Date;
    meetsTarget:   boolean;
    monthsNeeded:  number;
    shortfall:     number;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const MAROON      = '#6b1a1a';
const MAROON_DARK = '#4a1010';

const ENVELOPE_COLORS: Record<string, string> = {
    SAVINGS:   '#0284c7',
    PAYOFF:    '#dc2626',
    PURCHASE:  '#7c3aed',
    EMERGENCY: '#d97706',
};

const TL_MONTHS = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TL_START  = new Date('2026-05-01').getTime();
const TL_END    = new Date('2026-12-31').getTime();
const TL_SPAN   = TL_END - TL_START;

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
    `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function progressPct(current: number, target: number): number {
    if (target <= 0) return 100;
    return Math.min((current / target) * 100, 100);
}

function addMonths(base: Date, n: number): Date {
    const d = new Date(base);
    d.setMonth(d.getMonth() + n);
    return d;
}

function projectedCompletion(remaining: number, monthly: number): Date {
    if (monthly <= 0) return addMonths(new Date(), 999);
    return addMonths(new Date(), Math.ceil(remaining / monthly));
}

function velocityDays(env: BudgetEnvelope): number | null {
    if (!env.targetDate) return null;
    const start = new Date(env.startDate).getTime();
    const end   = new Date(env.targetDate).getTime();
    const total = end - start;
    if (total <= 0) return null;
    const elapsed     = Date.now() - start;
    const expectedPct = Math.min(elapsed / total, 1);
    const actualPct   = progressPct(env.currentAmount, env.targetAmount) / 100;
    return Math.round((actualPct - expectedPct) * (total / 86400000));
}

// ── Component ──────────────────────────────────────────────────────────────────
const MultiEnvelopeDashboard: React.FC<{
    envelopes:      BudgetEnvelope[];
    contributions:  EnvelopeContribution[];
    monthStart:     Date;
    monthEnd:       Date;
    monthLabel:     string;
    planEntries:    PlanEntry[];
    planResults:    PlanResult[];
    planBudget:     number;
    onBudgetChange: (v: number) => void;
    onAlloc:        (id: number, v: number) => void;
    onLock:         (id: number) => void;
    onMoveUp:       (idx: number) => void;
    onMoveDown:     (idx: number) => void;
    onAutoReset:    () => void;
    onApplyPlan:    () => void;
}> = ({
          envelopes, contributions, monthStart, monthEnd, monthLabel,
          planEntries, planResults, planBudget,
          onBudgetChange, onAlloc, onLock, onMoveUp, onMoveDown, onAutoReset, onApplyPlan,
      }) => {
    const [dragIdx,     setDragIdx]     = useState<number | null>(null);
    const [planApplied, setPlanApplied] = useState(false);

    const active        = envelopes.filter(e => e.status === 'ACTIVE');
    const planAllocated = planEntries.reduce((s, e) => s + e.monthlyAlloc, 0);
    const planSurplus   = planBudget - planAllocated;
    const allOnTrack    = planResults.every(r => r.meetsTarget);
    const criticalCount = planResults.filter(r => !r.meetsTarget).length;
    const envMap        = new Map(envelopes.map(e => [e.id, e]));
    const totalSaved    = active.reduce((s, e) => s + e.currentAmount, 0);
    const onTrackCount  = planResults.filter(r => r.meetsTarget).length;

    const nearestDeadline = [...active]
        .filter(e => e.targetDate)
        .sort((a, b) => new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime())[0];

    const thisMonthContrib = contributions
        .filter(c => { const d = new Date(c.contributedAt); return d >= monthStart && d <= monthEnd; })
        .reduce((s, c) => s + c.amount, 0);

    const now       = Date.now();
    const todayFrac = Math.min(Math.max((now - TL_START) / TL_SPAN, 0), 1);

    const handleApply = () => {
        onApplyPlan();
        setPlanApplied(true);
        setTimeout(() => setPlanApplied(false), 2000);
    };

    const handleDrop = (toIdx: number) => {
        if (dragIdx === null || dragIdx === toIdx) return;
        if (dragIdx < toIdx) { for (let i = dragIdx; i < toIdx; i++) onMoveDown(i); }
        else                 { for (let i = dragIdx; i > toIdx; i--) onMoveUp(i); }
        setDragIdx(null);
    };

    return (
        <Box>

            {/* ── Hero banner ────────────────────────────────────────────────── */}
            <Box sx={{
                background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 55%, #8b2525 100%)`,
                borderRadius: '18px', p: 3, mb: 2, position: 'relative', overflow: 'hidden',
            }}>
                <Box sx={{ position: 'absolute', top: -24, right: -24, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
                <Box sx={{ position: 'absolute', bottom: -16, right: 80, width: 70, height: 70, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
                <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                    <Box>
                        <Typography sx={{ fontSize: '0.67rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', mb: 0.75 }}>
                            {monthLabel} — total saved
                        </Typography>
                        <Typography sx={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-1.5px', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(totalSaved)}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', mt: 0.75 }}>
                            {active.length} active envelopes · {fmt(planBudget)}/mo committed
                        </Typography>
                    </Box>
                    <Stack spacing={0.75} alignItems="flex-end">
                        {allOnTrack ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1.25, py: 0.6, borderRadius: '99px', bgcolor: 'rgba(74,222,128,.14)', border: '1px solid rgba(74,222,128,.2)' }}>
                                <TrendingUp size={12} color="#86efac" />
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#86efac' }}>Portfolio on track</Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1.25, py: 0.6, borderRadius: '99px', bgcolor: 'rgba(251,191,36,.14)', border: '1px solid rgba(251,191,36,.2)' }}>
                                <AlertTriangle size={12} color="#fde68a" />
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#fde68a' }}>{criticalCount} need attention</Typography>
                            </Box>
                        )}
                        <Box sx={{ px: 1.25, py: 0.6, borderRadius: '99px', bgcolor: 'rgba(255,255,255,.1)' }}>
                            <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.7)' }}>
                                {planSurplus >= 0 ? `${fmt(planSurplus)} unallocated` : `${fmt(Math.abs(planSurplus))} over budget`}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
                <Box sx={{ mt: 2.5, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.45)' }}>Budget allocated</Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.55)', fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(planAllocated)} / {fmt(planBudget)}
                        </Typography>
                    </Box>
                    <Box sx={{ height: 5, borderRadius: '99px', bgcolor: 'rgba(0,0,0,.25)', overflow: 'hidden' }}>
                        <Box sx={{
                            height: '100%', borderRadius: '99px', transition: 'width 0.3s',
                            width: `${Math.min((planAllocated / Math.max(planBudget, 1)) * 100, 100)}%`,
                            bgcolor: planSurplus < 0 ? '#f87171' : 'rgba(255,255,255,.55)',
                        }} />
                    </Box>
                </Box>
            </Box>

            {/* ── Stat cards ─────────────────────────────────────────────────── */}
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {([
                    {
                        label: 'Contributed this month',
                        value: fmt(thisMonthContrib),
                        sub:   `of ${fmt(planBudget)} target`,
                    },
                    {
                        label:    'On-track goals',
                        value:    `${onTrackCount} / ${active.length}`,
                        sub:      criticalCount > 0 ? `${criticalCount} behind pace` : 'All goals healthy',
                        subColor: criticalCount > 0 ? '#b91c1c' : '#15803d',
                    },
                    {
                        label: 'Nearest deadline',
                        value: nearestDeadline
                            ? new Date(nearestDeadline.targetDate!).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                            : '—',
                        sub: nearestDeadline
                            ? `${nearestDeadline.envelopeName} · ${planResults.find(r => r.envelopeId === nearestDeadline.id)?.monthsNeeded ?? '?'}mo`
                            : 'No deadlines set',
                    },
                ] as { label: string; value: string; sub: string; subColor?: string }[]).map(({ label, value, sub, subColor }) => (
                    <Grid item xs={12} sm={4} key={label}>
                        <Box sx={{ bgcolor: 'background.paper', border: `0.5px solid ${alpha('#000', 0.08)}`, borderRadius: '14px', p: '14px 16px' }}>
                            <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', mb: 0.5 }}>{label}</Typography>
                            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: 'text.primary', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                            <Typography sx={{ fontSize: '0.68rem', color: subColor ?? 'text.secondary', mt: 0.5 }}>{sub}</Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>

            {/* ── Progress + Timeline ────────────────────────────────────────── */}
            <Grid container spacing={1.5} sx={{ mb: 2 }}>

                {/* Progress bars */}
                <Grid item xs={12} sm={6}>
                    <Box sx={{ bgcolor: 'background.paper', border: `0.5px solid ${alpha('#000', 0.08)}`, borderRadius: '14px', p: '16px 18px', height: '100%' }}>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary', mb: 0.5 }}>Progress this month</Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', mb: 1.5 }}>Tick marker = expected pace today</Typography>
                        <Stack spacing={1.25}>
                            {active.map(env => {
                                const pct       = Math.round(progressPct(env.currentAmount, env.targetAmount));
                                const vel       = velocityDays(env);
                                const isAhead   = (vel ?? 0) > 3;
                                const isOnTrack = vel !== null && Math.abs(vel) <= 3;
                                const chipColor = isOnTrack ? '#0369a1' : isAhead ? '#15803d' : '#b91c1c';
                                const chipBg    = isOnTrack ? alpha('#0284c7', 0.1) : isAhead ? alpha('#16a34a', 0.1) : alpha('#dc2626', 0.08);
                                const chipLabel = isOnTrack ? 'On track' : isAhead ? `+${vel}d` : vel !== null ? `${Math.abs(vel)}d behind` : '—';
                                const expectedPct = (() => {
                                    if (!env.targetDate) return null;
                                    const s = new Date(env.startDate).getTime();
                                    const e = new Date(env.targetDate).getTime();
                                    return Math.min(Math.max(((Date.now() - s) / (e - s)) * 100, 0), 100);
                                })();
                                const c = ENVELOPE_COLORS[env.envelopeType];
                                return (
                                    <Box key={env.id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.4 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <Box sx={{ width: 7, height: 7, borderRadius: '2px', bgcolor: c, flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.primary' }}>{env.envelopeName}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: c }}>{pct}%</Typography>
                                                {vel !== null && (
                                                    <Box sx={{ px: 0.75, py: 0.2, borderRadius: '99px', bgcolor: chipBg }}>
                                                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: chipColor }}>{chipLabel}</Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                        <Box sx={{ height: 5, borderRadius: '99px', bgcolor: alpha(c, 0.12), position: 'relative', overflow: 'visible' }}>
                                            <Box sx={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${pct}%`, borderRadius: '99px', bgcolor: c }} />
                                            {expectedPct !== null && (
                                                <Box sx={{ position: 'absolute', top: -3, left: `${Math.min(expectedPct, 97)}%`, width: 2, height: 11, borderRadius: '1px', bgcolor: alpha(c, 0.35) }} />
                                            )}
                                        </Box>
                                        <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mt: 0.3 }}>
                                            {fmt(env.currentAmount)} of {fmt(env.targetAmount)}
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                </Grid>

                {/* Payoff timeline */}
                <Grid item xs={12} sm={6}>
                    <Box sx={{ bgcolor: 'background.paper', border: `0.5px solid ${alpha('#000', 0.08)}`, borderRadius: '14px', p: '16px 18px', height: '100%' }}>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary', mb: 0.5 }}>Payoff timeline</Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', mb: 1.5 }}>When each envelope completes</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, pl: '68px' }}>
                            {TL_MONTHS.map((m: string) => (
                                <Typography key={m} sx={{ fontSize: '0.58rem', color: 'text.secondary' }}>{m}</Typography>
                            ))}
                        </Box>
                        <Stack spacing={0.75}>
                            {active.filter(e => e.targetDate || e.allocatedAmount > 0).map(env => {
                                const envStart  = Math.max(new Date(env.startDate).getTime(), TL_START);
                                const projEnd   = projectedCompletion(env.remainingAmount, env.allocatedAmount).getTime();
                                const envEnd    = env.targetDate
                                    ? Math.min(new Date(env.targetDate).getTime(), TL_END)
                                    : Math.min(projEnd, TL_END);
                                const leftPct   = Math.max(((envStart - TL_START) / TL_SPAN) * 100, 0);
                                const widthPct  = Math.min(((envEnd - envStart) / TL_SPAN) * 100, 100 - leftPct);
                                const behind    = (velocityDays(env) ?? 0) < -3;
                                const endLabel  = env.targetDate
                                    ? new Date(env.targetDate).toLocaleDateString('en-US', { month: 'short' })
                                    : new Date(projEnd).toLocaleDateString('en-US', { month: 'short' });
                                const c = ENVELOPE_COLORS[env.envelopeType];
                                return (
                                    <Box key={env.id} sx={{ display: 'grid', gridTemplateColumns: '64px 1fr', alignItems: 'center', gap: 1 }}>
                                        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {env.envelopeName.split(' ')[0]}
                                        </Typography>
                                        <Box sx={{ height: 20, bgcolor: alpha('#000', 0.04), borderRadius: '4px', position: 'relative' }}>
                                            <Box sx={{
                                                position: 'absolute', left: `${leftPct}%`, width: `${Math.max(widthPct, 2)}%`,
                                                height: '100%', borderRadius: '4px', bgcolor: alpha(c, 0.85),
                                                outline: behind ? '1.5px solid #f87171' : 'none', outlineOffset: -1,
                                                display: 'flex', alignItems: 'center', px: 0.75,
                                            }}>
                                                <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                                    {endLabel}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ position: 'absolute', left: `${todayFrac * 100}%`, top: -3, width: 1.5, height: 26, bgcolor: alpha(MAROON, 0.5), borderRadius: '1px' }} />
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Stack>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5, pl: '68px' }}>
                            <Box sx={{ width: 1.5, height: 10, bgcolor: alpha(MAROON, 0.5), borderRadius: '1px' }} />
                            <Typography sx={{ fontSize: '0.6rem', color: MAROON, fontWeight: 600 }}>Today</Typography>
                            <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', ml: 1 }}>Red outline = behind pace</Typography>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {/* ── Priority & Allocation ──────────────────────────────────────── */}
            <Box sx={{ bgcolor: 'background.paper', border: `0.5px solid ${alpha('#000', 0.08)}`, borderRadius: '14px', overflow: 'hidden' }}>

                {/* Header */}
                <Box sx={{ px: 2.5, py: 2, borderBottom: `0.5px solid ${alpha('#000', 0.07)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: 'text.primary' }}>Priority & allocation</Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', mt: 0.25 }}>
                            Drag to reorder · edit monthly amount · lock to protect from auto-reset
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {!allOnTrack && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.5, borderRadius: '8px', bgcolor: alpha('#d97706', 0.08), border: `0.5px solid ${alpha('#d97706', 0.25)}` }}>
                                <AlertTriangle size={12} color="#d97706" />
                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#92400e' }}>{criticalCount} behind</Typography>
                            </Box>
                        )}
                        <Button size="small" startIcon={<RefreshCw size={12} />} onClick={onAutoReset}
                                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', border: `0.5px solid ${alpha('#000', 0.15)}`, color: 'text.secondary', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: alpha(MAROON, 0.04) } }}>
                            Auto-reset
                        </Button>
                    </Box>
                </Box>

                {/* Budget bar */}
                <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(MAROON, 0.025), borderBottom: `0.5px solid ${alpha('#000', 0.05)}`, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', flexShrink: 0 }}>Monthly budget</Typography>
                    <Box sx={{ flex: 1, height: 4, borderRadius: '99px', bgcolor: alpha('#000', 0.06) }}>
                        <Box sx={{
                            height: '100%', borderRadius: '99px', transition: 'width .3s',
                            width: `${Math.min((planAllocated / Math.max(planBudget, 1)) * 100, 100)}%`,
                            bgcolor: planSurplus < 0 ? '#dc2626' : MAROON,
                        }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: MAROON, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(planAllocated)} / {fmt(planBudget)}
                    </Typography>
                    <TextField
                        size="small" type="number" value={planBudget}
                        onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0) onBudgetChange(v); }}
                        inputProps={{ min: 0, step: 10 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#aaa' }}>$</Typography></InputAdornment> }}
                        sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.78rem' }, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: MAROON } }}
                    />
                </Box>

                {/* Rows */}
                {planEntries.map((entry, idx) => {
                    const env    = envMap.get(entry.envelopeId);
                    const result = planResults.find(r => r.envelopeId === entry.envelopeId);
                    if (!env || !result) return null;
                    const color = ENVELOPE_COLORS[env.envelopeType];
                    const pct   = planAllocated > 0 ? (entry.monthlyAlloc / planAllocated) * 100 : 0;
                    return (
                        <Box
                            key={entry.envelopeId}
                            draggable
                            onDragStart={() => setDragIdx(idx)}
                            onDragOver={e => e.preventDefault()}
                            onDrop={() => handleDrop(idx)}
                            onDragEnd={() => setDragIdx(null)}
                            sx={{
                                display: 'grid', gridTemplateColumns: '32px 8px 1fr 130px 90px 36px',
                                alignItems: 'center', gap: 1.5, px: 2, py: 1.5,
                                borderBottom: idx < planEntries.length - 1 ? `0.5px solid ${alpha('#000', 0.05)}` : 'none',
                                bgcolor: entry.locked ? alpha(color, 0.02) : 'transparent',
                                transition: 'background .15s', cursor: 'default',
                                '&:hover': { bgcolor: alpha(color, 0.025) },
                            }}
                        >
                            {/* Rank */}
                            <Box sx={{
                                width: 26, height: 26, borderRadius: '7px', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: idx === 0
                                    ? `linear-gradient(135deg, ${MAROON_DARK}, ${MAROON})`
                                    : idx === 1 ? 'linear-gradient(135deg, #374151, #6b7280)'
                                        : alpha('#000', 0.07),
                            }}>
                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: idx <= 1 ? '#fff' : '#888' }}>#{idx + 1}</Typography>
                            </Box>

                            {/* Color dot */}
                            <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: color, flexShrink: 0 }} />

                            {/* Name */}
                            <Box sx={{ minWidth: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.2 }}>
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {env.envelopeName}
                                    </Typography>
                                    {entry.locked && (
                                        <Box sx={{ px: 0.6, py: 0.1, borderRadius: '4px', bgcolor: alpha(color, 0.12) }}>
                                            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color }}>locked</Typography>
                                        </Box>
                                    )}
                                    {env.contributionMode === 'AUTO' && (
                                        <Box sx={{ px: 0.6, py: 0.1, borderRadius: '4px', bgcolor: alpha('#0284c7', 0.1) }}>
                                            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#0369a1' }}>auto</Typography>
                                        </Box>
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary' }}>
                                        {env.targetDate ? `Due ${new Date(env.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : 'No deadline'}
                                    </Typography>
                                    <Box sx={{ height: 3, borderRadius: '99px', width: 60, bgcolor: alpha(color, 0.12), position: 'relative', overflow: 'hidden' }}>
                                        <Box sx={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${pct}%`, bgcolor: color }} />
                                    </Box>
                                    <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary' }}>{pct.toFixed(0)}% of budget</Typography>
                                </Box>
                            </Box>

                            {/* Alloc input */}
                            <Box>
                                <TextField
                                    size="small" type="number" value={entry.monthlyAlloc}
                                    onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0) onAlloc(entry.envelopeId, v); }}
                                    inputProps={{ min: 0, step: 5 }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#aaa' }}>$</Typography></InputAdornment>,
                                        sx: { fontSize: '0.82rem', fontWeight: 700 },
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' }, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
                                />
                                <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mt: 0.3 }}>
                                    {fmt(entry.autoAlloc)} suggested
                                </Typography>
                            </Box>

                            {/* Projection */}
                            <Box sx={{
                                p: 1, borderRadius: '8px',
                                bgcolor: result.meetsTarget ? alpha('#16a34a', 0.06) : alpha('#dc2626', 0.06),
                                border: `0.5px solid ${result.meetsTarget ? alpha('#16a34a', 0.2) : alpha('#dc2626', 0.2)}`,
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.2 }}>
                                    {result.meetsTarget ? <CheckCircle size={10} color="#16a34a" /> : <AlertTriangle size={10} color="#dc2626" />}
                                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: result.meetsTarget ? '#15803d' : '#dc2626' }}>
                                        {result.projectedDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                                    </Typography>
                                </Box>
                                <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', lineHeight: 1.3 }}>
                                    {result.meetsTarget ? `${result.monthsNeeded}mo to goal` : `${result.shortfall}d late`}
                                </Typography>
                            </Box>

                            {/* Lock + drag */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                                <Tooltip title={entry.locked ? 'Unlock' : 'Lock allocation'}>
                                    <IconButton size="small" onClick={() => onLock(entry.envelopeId)}
                                                sx={{ p: 0.5, borderRadius: '6px', border: `0.5px solid ${entry.locked ? alpha(color, 0.4) : alpha('#000', 0.12)}`, bgcolor: entry.locked ? alpha(color, 0.08) : 'transparent', color: entry.locked ? color : '#bbb', '&:hover': { borderColor: color, color, bgcolor: alpha(color, 0.06) } }}>
                                        {entry.locked ? <Lock size={11} /> : <Unlock size={11} />}
                                    </IconButton>
                                </Tooltip>
                                <Box sx={{ cursor: 'grab', color: alpha('#000', 0.2), display: 'flex', '&:hover': { color: alpha('#000', 0.4) } }}>
                                    <GripVertical size={13} />
                                </Box>
                            </Box>
                        </Box>
                    );
                })}

                {/* Footer */}
                <Box sx={{ px: 2.5, py: 2, bgcolor: alpha(MAROON, 0.03), borderTop: `0.5px solid ${alpha(MAROON, 0.1)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                        Changes apply to monthly contribution allocations across all envelopes.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={planApplied ? <CheckCircle size={14} /> : <ChevronRight size={14} />}
                        onClick={handleApply}
                        sx={{
                            borderRadius: '9px', textTransform: 'none', fontWeight: 700,
                            fontSize: '0.82rem', px: 2.5, py: 1, flexShrink: 0,
                            bgcolor: planApplied ? '#16a34a' : MAROON,
                            '&:hover': { bgcolor: planApplied ? '#15803d' : MAROON_DARK },
                            transition: 'background 0.3s',
                        }}
                    >
                        {planApplied ? 'Applied!' : 'Apply plan'}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default MultiEnvelopeDashboard;