import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    alpha, Box, Button, Chip, Dialog, Divider, Grid,
    IconButton, InputAdornment, LinearProgress, Slide,
    Slider, Stack, TextField, ToggleButton, ToggleButtonGroup,
    Tooltip, Typography,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import {
    X, AlertTriangle, ArrowDown, ArrowUp, Calendar,
    CheckCircle, ChevronRight, Flame, GripVertical,
    Info, Layers, PiggyBank, Target, TrendingUp,
    Wallet, XCircle, Zap, ArrowRight, Clock,
    BarChart2, RefreshCw,
} from 'lucide-react';
import { BudgetEnvelope } from './BudgetEnvelopesPage';

// ── Design tokens ────────────────────────────────────────────────────────────
const MAROON      = '#6b1a1a';
const MAROON_DARK = '#4a1010';

const ENVELOPE_COLORS: Record<string, string> = {
    SAVINGS:   '#0284c7',
    PAYOFF:    '#dc2626',
    PURCHASE:  '#7c3aed',
    EMERGENCY: '#d97706',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
    SAVINGS:   <PiggyBank size={14} />,
    PAYOFF:    <XCircle   size={14} />,
    PURCHASE:  <Wallet    size={14} />,
    EMERGENCY: <Flame     size={14} />,
};

// ── Types ────────────────────────────────────────────────────────────────────
interface PlanEntry {
    envelopeId:   number;
    priority:     number;          // 1 = highest
    monthlyAlloc: number;          // user-adjusted or auto
    locked:       boolean;         // user pinned this amount
    autoAlloc:    number;          // system-suggested
}

interface PlanResult {
    envelopeId:    number;
    monthlyAlloc:  number;
    projectedDate: Date;
    meetsTarget:   boolean;
    monthsNeeded:  number;
    shortfall:     number;         // how many days late vs target (0 = on time)
}

export interface EnvelopePriorityPlannerProps {
    open:       boolean;
    onClose:    () => void;
    envelopes:  BudgetEnvelope[];
    onApply:    (plan: Record<number, number>) => void; // envelopeId → newMonthlyAlloc
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
    `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function monthsBetween(from: Date, to: Date) {
    return Math.max(
        (to.getFullYear() - from.getFullYear()) * 12 +
        (to.getMonth() - from.getMonth()),
        1
    );
}

function addMonths(base: Date, n: number) {
    const d = new Date(base);
    d.setMonth(d.getMonth() + n);
    return d;
}

function projectedCompletion(remaining: number, monthly: number): Date {
    if (monthly <= 0) return addMonths(new Date(), 999);
    return addMonths(new Date(), Math.ceil(remaining / monthly));
}

function urgencyScore(env: BudgetEnvelope): number {
    // Higher = more urgent. Weights: deadline proximity, type, % remaining
    let score = 0;
    if (env.targetDate) {
        const days = Math.max(
            (new Date(env.targetDate).getTime() - Date.now()) / 86400000,
            1
        );
        score += 10000 / days; // closer deadline → bigger score
    }
    if (env.envelopeType === 'PAYOFF')    score += 500; // interest risk
    if (env.envelopeType === 'EMERGENCY') score += 300;
    const pctLeft = env.targetAmount > 0 ? env.remainingAmount / env.targetAmount : 0;
    score += pctLeft * 100; // more left to save → slightly higher urgency
    return score;
}

// Distribute `budget` across entries respecting locked amounts, proportionally
// to urgency for unlocked entries.
function distributeAuto(
    entries:   PlanEntry[],
    envelopes: BudgetEnvelope[],
    budget:    number
): PlanEntry[] {
    const locked    = entries.filter(e => e.locked);
    const unlocked  = entries.filter(e => !e.locked);
    const lockedSum = locked.reduce((s, e) => s + e.monthlyAlloc, 0);
    const remaining = Math.max(budget - lockedSum, 0);

    const envMap = new Map(envelopes.map(e => [e.id, e]));
    const scores = unlocked.map(e => ({ id: e.envelopeId, score: urgencyScore(envMap.get(e.envelopeId)!) }));
    const total  = scores.reduce((s, x) => s + x.score, 0);

    return entries.map(entry => {
        if (entry.locked) return entry;
        const sc   = scores.find(s => s.id === entry.envelopeId);
        const alloc = total > 0 ? (sc!.score / total) * remaining : remaining / unlocked.length;
        return { ...entry, monthlyAlloc: Math.round(alloc * 100) / 100, autoAlloc: Math.round(alloc * 100) / 100 };
    });
}

function computeResults(entries: PlanEntry[], envelopes: BudgetEnvelope[]): PlanResult[] {
    const envMap = new Map(envelopes.map(e => [e.id, e]));
    return entries.map(entry => {
        const env          = envMap.get(entry.envelopeId)!;
        const remaining    = env.remainingAmount;
        const monthly      = entry.monthlyAlloc;
        const projDate     = projectedCompletion(remaining, monthly);
        const targetDate   = env.targetDate ? new Date(env.targetDate) : null;
        const meetsTarget  = !targetDate || projDate <= targetDate;
        const monthsNeeded = monthly > 0 ? Math.ceil(remaining / monthly) : 999;
        const shortfall    = targetDate && !meetsTarget
            ? Math.round((projDate.getTime() - targetDate.getTime()) / 86400000)
            : 0;
        return { envelopeId: entry.envelopeId, monthlyAlloc: monthly, projectedDate: projDate, meetsTarget, monthsNeeded, shortfall };
    });
}

// ── Slide transition ─────────────────────────────────────────────────────────
const SlideUp = React.forwardRef(function SlideUp(
    props: TransitionProps & { children: React.ReactElement },
    ref:   React.Ref<unknown>,
) { return <Slide direction="up" ref={ref} {...props} />; });

// ── Priority row ─────────────────────────────────────────────────────────────
const PriorityRow: React.FC<{
    rank:    number;
    entry:   PlanEntry;
    env:     BudgetEnvelope;
    result:  PlanResult;
    total:   number;
    onUp:    () => void;
    onDown:  () => void;
    onAlloc: (v: number) => void;
    onLock:  () => void;
    isFirst: boolean;
    isLast:  boolean;
}> = ({ rank, entry, env, result, total, onUp, onDown, onAlloc, onLock, isFirst, isLast }) => {
    const color    = ENVELOPE_COLORS[env.envelopeType];
    const pct      = total > 0 ? (entry.monthlyAlloc / total) * 100 : 0;
    const urgScore = urgencyScore(env);

    const urgLabel = urgScore > 800 ? 'Critical' : urgScore > 400 ? 'High' : urgScore > 150 ? 'Medium' : 'Low';
    const urgColor = urgScore > 800 ? '#dc2626' : urgScore > 400 ? '#d97706' : urgScore > 150 ? '#0284c7' : '#16a34a';

    const daysLeft = env.targetDate
        ? Math.ceil((new Date(env.targetDate).getTime() - Date.now()) / 86400000)
        : null;

    return (
        <Box sx={{
            borderRadius: '12px',
            border: `1.5px solid ${entry.locked ? alpha(color, 0.4) : alpha('#000', 0.08)}`,
            bgcolor: entry.locked ? alpha(color, 0.03) : '#fff',
            overflow: 'hidden',
            transition: 'all 0.18s',
            '&:hover': { borderColor: alpha(color, 0.35), boxShadow: `0 2px 12px ${alpha(color, 0.1)}` },
        }}>
            {/* Top bar: rank + name + urgency + controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderBottom: `1px solid ${alpha('#000', 0.06)}` }}>
                {/* Rank badge */}
                <Box sx={{
                    width: 28, height: 28, borderRadius: '7px', flexShrink: 0,
                    bgcolor: rank === 1 ? MAROON : rank === 2 ? alpha(MAROON, 0.7) : alpha('#000', 0.07),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 900, color: rank <= 2 ? '#fff' : '#888' }}>#{rank}</Typography>
                </Box>

                {/* Envelope icon + name */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                    <Box sx={{ width: 28, height: 28, borderRadius: '7px', bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                        {TYPE_ICONS[env.envelopeType]}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {env.envelopeName}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.2, flexWrap: 'wrap' }}>
                            <Chip size="small" label={urgLabel}
                                  sx={{ height: 15, fontSize: '0.57rem', fontWeight: 800,
                                      bgcolor: alpha(urgColor, 0.1), color: urgColor }} />
                            {daysLeft !== null && daysLeft <= 90 && (
                                <Chip size="small" label={`${daysLeft}d left`}
                                      icon={<Clock size={8} />}
                                      sx={{ height: 15, fontSize: '0.57rem', fontWeight: 700,
                                          bgcolor: alpha('#d97706', 0.1), color: '#d97706',
                                          '& .MuiChip-icon': { ml: '3px', mr: '-2px', color: '#d97706' } }} />
                            )}
                            {entry.locked && (
                                <Chip size="small" label="locked"
                                      sx={{ height: 15, fontSize: '0.57rem', fontWeight: 700, bgcolor: alpha(color, 0.12), color }} />
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* Reorder arrows */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <IconButton size="small" onClick={onUp} disabled={isFirst}
                                sx={{ p: 0.25, '&:hover': { bgcolor: alpha(MAROON, 0.08) }, '&.Mui-disabled': { opacity: 0.2 } }}>
                        <ArrowUp size={12} color={MAROON} />
                    </IconButton>
                    <IconButton size="small" onClick={onDown} disabled={isLast}
                                sx={{ p: 0.25, '&:hover': { bgcolor: alpha(MAROON, 0.08) }, '&.Mui-disabled': { opacity: 0.2 } }}>
                        <ArrowDown size={12} color={MAROON} />
                    </IconButton>
                </Box>
            </Box>

            {/* Body: allocation + projection */}
            <Box sx={{ px: 2, py: 1.5 }}>
                <Grid container spacing={2} alignItems="center">
                    {/* Allocation control */}
                    <Grid item xs={12} sm={6}>
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', mb: 0.75 }}>
                            Monthly Contribution
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                                size="small"
                                value={entry.monthlyAlloc}
                                onChange={e => {
                                    const v = parseFloat(e.target.value);
                                    if (!isNaN(v) && v >= 0) onAlloc(v);
                                }}
                                type="number"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa' }}>$</Typography>
                                    </InputAdornment>,
                                    sx: { fontSize: '0.82rem', fontWeight: 800, borderRadius: '8px' },
                                }}
                                inputProps={{ min: 0, step: 5 }}
                                sx={{
                                    width: 120,
                                    '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color },
                                }}
                            />
                            <Tooltip title={entry.locked ? 'Unlock to let auto-distribute adjust this' : 'Lock this amount — auto-distribute won\'t touch it'}>
                                <IconButton size="small" onClick={onLock}
                                            sx={{
                                                borderRadius: '7px', border: `1.5px solid ${entry.locked ? color : alpha('#000', 0.15)}`,
                                                bgcolor: entry.locked ? alpha(color, 0.1) : 'transparent',
                                                color: entry.locked ? color : '#aaa',
                                                '&:hover': { borderColor: color, color, bgcolor: alpha(color, 0.08) },
                                                p: 0.6,
                                            }}>
                                    <Layers size={12} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        {/* % of total bar */}
                        <Box sx={{ mt: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                                <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>{pct.toFixed(1)}% of total budget</Typography>
                                <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>{fmt(entry.autoAlloc)} suggested</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={Math.min(pct, 100)}
                                            sx={{ height: 4, borderRadius: 2, bgcolor: alpha(color, 0.1), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 } }} />
                        </Box>
                    </Grid>

                    {/* Projection */}
                    <Grid item xs={12} sm={6}>
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', mb: 0.75 }}>
                            Projection
                        </Typography>
                        <Box sx={{
                            p: 1.25, borderRadius: '8px',
                            bgcolor: result.meetsTarget ? alpha('#16a34a', 0.06) : alpha('#dc2626', 0.06),
                            border: `1px solid ${result.meetsTarget ? alpha('#16a34a', 0.2) : alpha('#dc2626', 0.2)}`,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.3 }}>
                                {result.meetsTarget
                                    ? <CheckCircle size={12} color="#16a34a" />
                                    : <AlertTriangle size={12} color="#dc2626" />
                                }
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: result.meetsTarget ? '#15803d' : '#dc2626' }}>
                                    {result.projectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </Typography>
                            </Box>
                            <Typography sx={{ fontSize: '0.65rem', color: '#555' }}>
                                {result.meetsTarget
                                    ? env.targetDate
                                        ? `On track — ${result.monthsNeeded}mo to goal ✓`
                                        : `${result.monthsNeeded} months to goal`
                                    : `${result.shortfall}d late — needs ${fmt(env.remainingAmount / Math.max(
                                        monthsBetween(new Date(), new Date(env.targetDate!)), 1
                                    ))}/mo to hit target`
                                }
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

// ── Main planner ─────────────────────────────────────────────────────────────
const EnvelopePriorityPlanner: React.FC<EnvelopePriorityPlannerProps> = ({
                                                                             open, onClose, envelopes, onApply,
                                                                         }) => {
    const activeEnvelopes = useMemo(
        () => envelopes.filter(e => e.status === 'ACTIVE'),
        [envelopes]
    );

    // Monthly budget the user is willing to allocate across all envelopes
    const defaultBudget = useMemo(
        () => activeEnvelopes.reduce((s, e) => s + e.allocatedAmount, 0),
        [activeEnvelopes]
    );

    const [budget,      setBudget]      = useState<number>(defaultBudget);
    const [entries,     setEntries]     = useState<PlanEntry[]>([]);
    const [timeframe,   setTimeframe]   = useState<number>(4); // months horizon
    const [applyDone,   setApplyDone]   = useState(false);

    // Initialise / reset whenever dialog opens or envelopes change
    useEffect(() => {
        if (!open) return;
        const sorted = [...activeEnvelopes].sort((a, b) => urgencyScore(b) - urgencyScore(a));
        const initial: PlanEntry[] = sorted.map((env, i) => ({
            envelopeId:   env.id,
            priority:     i + 1,
            monthlyAlloc: env.allocatedAmount,
            locked:       false,
            autoAlloc:    env.allocatedAmount,
        }));
        setEntries(distributeAuto(initial, activeEnvelopes, defaultBudget));
        setBudget(defaultBudget);
        setApplyDone(false);
    }, [open, activeEnvelopes, defaultBudget]);

    // Auto-redistribute whenever budget changes (only unlocked)
    const redistribute = useCallback((newBudget: number, currentEntries: PlanEntry[]) => {
        setEntries(distributeAuto(currentEntries, activeEnvelopes, newBudget));
    }, [activeEnvelopes]);

    const handleBudgetChange = (v: number) => {
        setBudget(v);
        redistribute(v, entries);
    };

    const handleAllocChange = (id: number, v: number) => {
        setEntries(prev => prev.map(e => e.envelopeId === id ? { ...e, monthlyAlloc: v } : e));
    };

    const handleLock = (id: number) => {
        setEntries(prev => prev.map(e => e.envelopeId === id ? { ...e, locked: !e.locked } : e));
    };

    const moveUp = (idx: number) => {
        if (idx === 0) return;
        setEntries(prev => {
            const next = [...prev];
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
            return next.map((e, i) => ({ ...e, priority: i + 1 }));
        });
    };

    const moveDown = (idx: number) => {
        setEntries(prev => {
            if (idx >= prev.length - 1) return prev;
            const next = [...prev];
            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
            return next.map((e, i) => ({ ...e, priority: i + 1 }));
        });
    };

    const resetToAuto = () => {
        const sorted = [...activeEnvelopes].sort((a, b) => urgencyScore(b) - urgencyScore(a));
        const reset: PlanEntry[] = sorted.map((env, i) => ({
            envelopeId:   env.id,
            priority:     i + 1,
            monthlyAlloc: env.allocatedAmount,
            locked:       false,
            autoAlloc:    env.allocatedAmount,
        }));
        setEntries(distributeAuto(reset, activeEnvelopes, budget));
    };

    const results   = useMemo(() => computeResults(entries, activeEnvelopes), [entries, activeEnvelopes]);
    const envMap    = useMemo(() => new Map(activeEnvelopes.map(e => [e.id, e])), [activeEnvelopes]);
    const allocated = entries.reduce((s, e) => s + e.monthlyAlloc, 0);
    const surplus   = budget - allocated;

    // Horizon-filtered: which envelopes can realistically be finished within timeframe
    const withinHorizon = results.filter(r => r.monthsNeeded <= timeframe);
    const outsideHorizon = results.filter(r => r.monthsNeeded > timeframe);

    const allOnTrack   = results.every(r => r.meetsTarget);
    const criticalCount = results.filter(r => !r.meetsTarget).length;

    const handleApply = () => {
        const plan: Record<number, number> = {};
        entries.forEach(e => { plan[e.envelopeId] = e.monthlyAlloc; });
        onApply(plan);
        setApplyDone(true);
        setTimeout(() => { setApplyDone(false); onClose(); }, 1200);
    };

    const color = MAROON;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            TransitionComponent={SlideUp}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: '18px', overflow: 'hidden', maxHeight: '94vh' } }}
        >
            {/* ── Header ────────────────────────────────────────────────── */}
            <Box sx={{
                background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 50%, #5a1515 100%)`,
                px: 3, pt: 2.5, pb: 2, position: 'relative', overflow: 'hidden',
            }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
                <Box sx={{ position: 'absolute', bottom: -30, right: 80, width: 70, height: 70, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                            <Box sx={{ width: 28, height: 28, borderRadius: '7px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <BarChart2 size={14} color="white" />
                            </Box>
                            <Typography sx={{ fontWeight: 900, fontSize: '1.05rem', color: '#fff', letterSpacing: '-0.01em' }}>
                                Priority Planner
                            </Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', ml: 0.5 }}>
                            Optimise how your money is distributed across {activeEnvelopes.length} active envelopes
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={onClose}
                                sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' } }}>
                        <X size={18} />
                    </IconButton>
                </Box>

                {/* Status pills */}
                <Box sx={{ display: 'flex', gap: 1, mt: 1.75, flexWrap: 'wrap' }}>
                    {[
                        { icon: <Target size={11} />,    label: `${activeEnvelopes.length} envelopes` },
                        { icon: <TrendingUp size={11} />, label: `${fmt(allocated)} allocated` },
                        { icon: allOnTrack ? <CheckCircle size={11} /> : <AlertTriangle size={11} />,
                            label: allOnTrack ? 'All on track' : `${criticalCount} need attention`,
                            warn: !allOnTrack },
                    ].map(({ icon, label, warn }) => (
                        <Box key={label} sx={{
                            display: 'flex', alignItems: 'center', gap: 0.5,
                            px: 1.1, py: 0.35, borderRadius: '20px',
                            bgcolor: warn ? 'rgba(220,38,38,0.25)' : 'rgba(255,255,255,0.12)',
                            color: '#fff',
                        }}>
                            {icon}
                            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700 }}>{label}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* ── Controls bar ──────────────────────────────────────────── */}
            <Box sx={{ px: 3, py: 2, bgcolor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                <Grid container spacing={3} alignItems="center">
                    {/* Budget input */}
                    <Grid item xs={12} sm={5}>
                        <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888', mb: 0.75 }}>
                            Monthly Envelope Budget
                        </Typography>
                        <TextField
                            size="small"
                            value={budget}
                            onChange={e => {
                                const v = parseFloat(e.target.value);
                                if (!isNaN(v) && v >= 0) handleBudgetChange(v);
                            }}
                            type="number"
                            fullWidth
                            InputProps={{
                                startAdornment: <InputAdornment position="start">
                                    <Typography sx={{ fontWeight: 700, color: '#aaa' }}>$</Typography>
                                </InputAdornment>,
                                sx: { fontWeight: 800, borderRadius: '9px', fontSize: '0.9rem' },
                            }}
                            inputProps={{ min: 0, step: 10 }}
                            sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: MAROON } }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.6 }}>
                            <Typography sx={{ fontSize: '0.62rem', color: surplus >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                                {surplus >= 0 ? `${fmt(surplus)} unallocated` : `${fmt(Math.abs(surplus))} over budget`}
                            </Typography>
                            <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>
                                {fmt(allocated)} allocated
                            </Typography>
                        </Box>
                        <LinearProgress variant="determinate"
                                        value={Math.min((allocated / Math.max(budget, 1)) * 100, 100)}
                                        sx={{ mt: 0.5, height: 4, borderRadius: 2,
                                            bgcolor: alpha(surplus < 0 ? '#dc2626' : '#16a34a', 0.12),
                                            '& .MuiLinearProgress-bar': { bgcolor: surplus < 0 ? '#dc2626' : '#16a34a', borderRadius: 2 } }} />
                    </Grid>

                    {/* Time horizon */}
                    <Grid item xs={12} sm={4}>
                        <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888', mb: 0.75 }}>
                            Planning Horizon
                        </Typography>
                        <ToggleButtonGroup value={timeframe} exclusive
                                           onChange={(_, v) => v && setTimeframe(v)} size="small"
                                           sx={{ width: '100%', '& .MuiToggleButton-root': { flex: 1, textTransform: 'none', fontWeight: 700, fontSize: '0.7rem', borderRadius: '8px !important', mx: 0.2 } }}>
                            {[3, 4, 6, 12].map(m => (
                                <ToggleButton key={m} value={m}
                                              sx={{ '&.Mui-selected': { bgcolor: alpha(MAROON, 0.1), color: MAROON, borderColor: `${alpha(MAROON, 0.3)} !important` }, '&:hover': { bgcolor: alpha(MAROON, 0.05) } }}>
                                    {m}mo
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                        <Typography sx={{ fontSize: '0.62rem', color: '#aaa', mt: 0.6 }}>
                            {withinHorizon.length} of {results.length} envelopes completable in {timeframe} months
                        </Typography>
                    </Grid>

                    {/* Reset */}
                    <Grid item xs={12} sm={3} sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                        <Button size="small" startIcon={<RefreshCw size={13} />} onClick={resetToAuto}
                                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem',
                                    borderColor: '#d5d5d5', color: '#555', border: '1px solid #d5d5d5',
                                    '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: alpha(MAROON, 0.04) } }}>
                            Auto-Reset
                        </Button>
                    </Grid>
                </Grid>
            </Box>

            {/* ── Insight banner ────────────────────────────────────────── */}
            {!allOnTrack && (
                <Box sx={{ px: 3, py: 1.5, bgcolor: alpha('#d97706', 0.07), borderBottom: `1px solid ${alpha('#d97706', 0.18)}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: alpha('#d97706', 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Zap size={14} color="#d97706" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e' }}>
                            {criticalCount} envelope{criticalCount !== 1 ? 's' : ''} won't meet {criticalCount !== 1 ? 'their' : 'its'} target date at current allocations.
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: '#b45309' }}>
                            Increase your monthly budget or lock a lower amount on envelopes with flexible deadlines to free up funds.
                        </Typography>
                    </Box>
                    <Button size="small" onClick={resetToAuto}
                            sx={{ borderRadius: '7px', textTransform: 'none', fontWeight: 700, fontSize: '0.7rem',
                                bgcolor: alpha('#d97706', 0.15), color: '#92400e',
                                '&:hover': { bgcolor: alpha('#d97706', 0.25) } }}>
                        Fix Automatically
                    </Button>
                </Box>
            )}

            {/* ── Priority list ─────────────────────────────────────────── */}
            <Box sx={{ overflowY: 'auto', px: 3, py: 2.5 }}>

                {/* Within horizon */}
                {withinHorizon.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '2px', bgcolor: '#16a34a' }} />
                            <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#16a34a' }}>
                                Completable within {timeframe} months
                            </Typography>
                            <Chip size="small" label={withinHorizon.length}
                                  sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: alpha('#16a34a', 0.1), color: '#16a34a' }} />
                        </Box>
                        <Stack spacing={1.5}>
                            {entries
                                .filter(e => {
                                    const r = results.find(r => r.envelopeId === e.envelopeId);
                                    return r && r.monthsNeeded <= timeframe;
                                })
                                .map((entry, idx, arr) => {
                                    const env    = envMap.get(entry.envelopeId)!;
                                    const result = results.find(r => r.envelopeId === entry.envelopeId)!;
                                    const globalIdx = entries.findIndex(e => e.envelopeId === entry.envelopeId);
                                    return (
                                        <PriorityRow key={entry.envelopeId}
                                                     rank={entry.priority}
                                                     entry={entry} env={env} result={result}
                                                     total={allocated}
                                                     onUp={() => moveUp(globalIdx)}
                                                     onDown={() => moveDown(globalIdx)}
                                                     onAlloc={v => handleAllocChange(entry.envelopeId, v)}
                                                     onLock={() => handleLock(entry.envelopeId)}
                                                     isFirst={globalIdx === 0}
                                                     isLast={globalIdx === entries.length - 1}
                                        />
                                    );
                                })}
                        </Stack>
                    </Box>
                )}

                {/* Outside horizon */}
                {outsideHorizon.length > 0 && (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '2px', bgcolor: '#d97706' }} />
                            <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#d97706' }}>
                                Beyond {timeframe}-month horizon
                            </Typography>
                            <Chip size="small" label={outsideHorizon.length}
                                  sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: alpha('#d97706', 0.1), color: '#d97706' }} />
                        </Box>
                        <Stack spacing={1.5}>
                            {entries
                                .filter(e => {
                                    const r = results.find(r => r.envelopeId === e.envelopeId);
                                    return r && r.monthsNeeded > timeframe;
                                })
                                .map((entry, idx, arr) => {
                                    const env    = envMap.get(entry.envelopeId)!;
                                    const result = results.find(r => r.envelopeId === entry.envelopeId)!;
                                    const globalIdx = entries.findIndex(e => e.envelopeId === entry.envelopeId);
                                    return (
                                        <PriorityRow key={entry.envelopeId}
                                                     rank={entry.priority}
                                                     entry={entry} env={env} result={result}
                                                     total={allocated}
                                                     onUp={() => moveUp(globalIdx)}
                                                     onDown={() => moveDown(globalIdx)}
                                                     onAlloc={v => handleAllocChange(entry.envelopeId, v)}
                                                     onLock={() => handleLock(entry.envelopeId)}
                                                     isFirst={globalIdx === 0}
                                                     isLast={globalIdx === entries.length - 1}
                                        />
                                    );
                                })}
                        </Stack>
                    </Box>
                )}

                {/* Summary table */}
                <Box sx={{ mt: 3, borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden' }}>
                    <Box sx={{ px: 2, py: 1.25, bgcolor: '#f8f8f8', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Target size={13} color={MAROON} />
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: MAROON, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            Plan Summary
                        </Typography>
                    </Box>
                    {entries.map((entry, i) => {
                        const env    = envMap.get(entry.envelopeId)!;
                        const result = results.find(r => r.envelopeId === entry.envelopeId)!;
                        const color  = ENVELOPE_COLORS[env.envelopeType];
                        return (
                            <Box key={entry.envelopeId} sx={{
                                display: 'flex', alignItems: 'center', px: 2, py: 1,
                                bgcolor: i % 2 === 0 ? '#fff' : '#fafafa',
                                borderBottom: i < entries.length - 1 ? '1px solid #f5f5f5' : 'none',
                                gap: 1.5,
                            }}>
                                <Box sx={{ width: 18, height: 18, borderRadius: '5px', bgcolor: alpha(color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                                    {TYPE_ICONS[env.envelopeType]}
                                </Box>
                                <Typography sx={{ flex: 1, fontSize: '0.75rem', fontWeight: 700, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {env.envelopeName}
                                </Typography>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', minWidth: 64, textAlign: 'right' }}>
                                    {fmt(entry.monthlyAlloc)}/mo
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 80, justifyContent: 'flex-end' }}>
                                    {result.meetsTarget
                                        ? <CheckCircle size={12} color="#16a34a" />
                                        : <AlertTriangle size={12} color="#dc2626" />
                                    }
                                    <Typography sx={{ fontSize: '0.68rem', color: result.meetsTarget ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                                        {result.projectedDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })}
                    {/* Totals row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.25, bgcolor: alpha(MAROON, 0.04), borderTop: `1px solid ${alpha(MAROON, 0.12)}`, gap: 1.5 }}>
                        <Typography sx={{ flex: 1, fontSize: '0.72rem', fontWeight: 800, color: MAROON }}>Total Monthly</Typography>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 900, color: MAROON, fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(allocated)}
                        </Typography>
                        <Box sx={{ minWidth: 80 }} />
                    </Box>
                </Box>
            </Box>

            {/* ── Footer ────────────────────────────────────────────────── */}
            <Box sx={{
                px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderTop: '1px solid #f0f0f0', bgcolor: '#fafafa',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info size={13} color="#aaa" />
                    <Typography sx={{ fontSize: '0.65rem', color: '#aaa', maxWidth: 260 }}>
                        Applying saves new monthly allocations. Lock individual amounts to protect them from future auto-rebalances.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button onClick={onClose} variant="outlined"
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.78rem',
                                borderColor: '#d5d5d5', color: '#555', '&:hover': { borderColor: MAROON, color: MAROON } }}>
                        Cancel
                    </Button>
                    <Button onClick={handleApply} variant="contained"
                            startIcon={applyDone ? <CheckCircle size={15} /> : <ChevronRight size={15} />}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', px: 2.5,
                                bgcolor: applyDone ? '#16a34a' : MAROON,
                                '&:hover': { bgcolor: applyDone ? '#15803d' : MAROON_DARK },
                                transition: 'background 0.3s' }}>
                        {applyDone ? 'Applied!' : 'Apply Plan'}
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
};

export default EnvelopePriorityPlanner;