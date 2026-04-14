import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    alpha, Box, Button, Chip, CircularProgress, Container,
    Divider, Grid, Grow, IconButton, InputAdornment,
    LinearProgress, Skeleton, Snackbar, Alert, Stack,
    TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import {
    Plus, Target, Wallet, TrendingUp, CheckCircle, PauseCircle,
    XCircle, PiggyBank, Calendar, Flame, MoreHorizontal,
    ArrowUpRight, Clock, Layers, BarChart2,
    ArrowUp, ArrowDown, AlertTriangle, Zap, RefreshCw, Info,
    ChevronRight, Lock, Unlock,
} from 'lucide-react';
import Sidebar from './Sidebar';
import CreateEnvelopeDialog from './CreateEnvelopeDialog';

// ── Design tokens ────────────────────────────────────────────────────────────
const MAROON      = '#6b1a1a';
const MAROON_DARK = '#4a1010';

const ENVELOPE_COLORS: Record<string, string> = {
    SAVINGS:   '#0284c7',
    PAYOFF:    '#dc2626',
    PURCHASE:  '#7c3aed',
    EMERGENCY: '#d97706',
};

const ENVELOPE_TYPE_LABELS: Record<string, string> = {
    SAVINGS:   'Savings',
    PAYOFF:    'Pay-Off',
    PURCHASE:  'Purchase',
    EMERGENCY: 'Emergency',
};

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    ACTIVE:    { label: 'Active',    color: '#16a34a', icon: <TrendingUp  size={11} /> },
    COMPLETED: { label: 'Completed', color: '#0284c7', icon: <CheckCircle size={11} /> },
    PAUSED:    { label: 'Paused',    color: '#d97706', icon: <PauseCircle size={11} /> },
    CANCELLED: { label: 'Cancelled', color: '#94a3b8', icon: <XCircle     size={11} /> },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
    SAVINGS:   <PiggyBank size={14} />,
    PAYOFF:    <XCircle   size={14} />,
    PURCHASE:  <Wallet    size={14} />,
    EMERGENCY: <Flame     size={14} />,
};

// ── Types ────────────────────────────────────────────────────────────────────
export interface BudgetEnvelope {
    id: number;
    envelopeName: string;
    envelopeType: 'SAVINGS' | 'PAYOFF' | 'PURCHASE' | 'EMERGENCY';
    description?: string;
    targetAmount: number;
    allocatedAmount: number;
    currentAmount: number;
    remainingAmount: number;
    contributionFrequency?: string;
    startDate: string;
    targetDate?: string;
    status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
    priority: number;
}

export interface EnvelopeContribution {
    id: number;
    envelopeId: number;
    amount: number;
    contributedAt: string;
    note?: string;
}

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

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK_ENVELOPES: BudgetEnvelope[] = [
    { id: 1, envelopeName: 'Car Repair Fund',  envelopeType: 'EMERGENCY', description: 'Set aside for unexpected car repairs',  targetAmount: 1500, allocatedAmount: 200, currentAmount: 875,  remainingAmount: 625,  contributionFrequency: 'MONTHLY', startDate: '2026-01-01', targetDate: '2026-09-01', status: 'ACTIVE',    priority: 1 },
    { id: 2, envelopeName: 'Pay Off TV',        envelopeType: 'PAYOFF',    description: 'Samsung 65" — 0% APR ends Oct',        targetAmount: 899,  allocatedAmount: 150, currentAmount: 450,  remainingAmount: 449,  contributionFrequency: 'MONTHLY', startDate: '2026-01-01', targetDate: '2026-10-01', status: 'ACTIVE',    priority: 2 },
    { id: 3, envelopeName: 'Vacation Fund',     envelopeType: 'SAVINGS',   description: 'Summer trip to Colorado',              targetAmount: 3000, allocatedAmount: 300, currentAmount: 2700, remainingAmount: 300,  contributionFrequency: 'MONTHLY', startDate: '2025-09-01', targetDate: '2026-07-01', status: 'ACTIVE',    priority: 3 },
    { id: 4, envelopeName: 'New Laptop',        envelopeType: 'PURCHASE',  description: 'MacBook Pro M4',                       targetAmount: 2500, allocatedAmount: 250, currentAmount: 2500, remainingAmount: 0,    contributionFrequency: 'MONTHLY', startDate: '2025-06-01', targetDate: '2026-03-01', status: 'COMPLETED', priority: 4 },
    { id: 5, envelopeName: 'Holiday Gifts',     envelopeType: 'SAVINGS',   description: 'Christmas & holiday shopping',         targetAmount: 800,  allocatedAmount: 100, currentAmount: 200,  remainingAmount: 600,  contributionFrequency: 'MONTHLY', startDate: '2026-02-01', targetDate: '2026-12-01', status: 'ACTIVE',    priority: 5 },
    { id: 6, envelopeName: 'Home Maintenance',  envelopeType: 'EMERGENCY', description: 'HVAC, plumbing, general repairs',      targetAmount: 2000, allocatedAmount: 150, currentAmount: 550,  remainingAmount: 1450, contributionFrequency: 'MONTHLY', startDate: '2026-01-01',                            status: 'PAUSED',    priority: 6 },
];

const MOCK_CONTRIBUTIONS: EnvelopeContribution[] = [
    { id: 1,  envelopeId: 1, amount: 200, contributedAt: '2026-04-01', note: 'April contribution' },
    { id: 2,  envelopeId: 1, amount: 200, contributedAt: '2026-03-01', note: 'March contribution' },
    { id: 3,  envelopeId: 1, amount: 200, contributedAt: '2026-02-01', note: 'February contribution' },
    { id: 4,  envelopeId: 1, amount: 175, contributedAt: '2026-01-01', note: 'January contribution' },
    { id: 5,  envelopeId: 2, amount: 150, contributedAt: '2026-04-01' },
    { id: 6,  envelopeId: 2, amount: 150, contributedAt: '2026-03-01' },
    { id: 7,  envelopeId: 2, amount: 150, contributedAt: '2026-02-01' },
    { id: 8,  envelopeId: 3, amount: 300, contributedAt: '2026-04-01', note: 'Tax refund boost' },
    { id: 9,  envelopeId: 3, amount: 300, contributedAt: '2026-03-01' },
    { id: 10, envelopeId: 5, amount: 100, contributedAt: '2026-04-01' },
    { id: 11, envelopeId: 5, amount: 100, contributedAt: '2026-03-01' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
    `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function daysUntil(dateStr?: string): number | null {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function progressPct(current: number, target: number) {
    if (target <= 0) return 100;
    return Math.min((current / target) * 100, 100);
}

function monthsBetween(from: Date, to: Date) {
    return Math.max(
        (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()),
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
    let score = 0;
    if (env.targetDate) {
        const days = Math.max((new Date(env.targetDate).getTime() - Date.now()) / 86400000, 1);
        score += 10000 / days;
    }
    if (env.envelopeType === 'PAYOFF')    score += 500;
    if (env.envelopeType === 'EMERGENCY') score += 300;
    score += (env.targetAmount > 0 ? env.remainingAmount / env.targetAmount : 0) * 100;
    return score;
}

function distributeAuto(entries: PlanEntry[], envelopes: BudgetEnvelope[], budget: number): PlanEntry[] {
    const locked    = entries.filter(e => e.locked);
    const unlocked  = entries.filter(e => !e.locked);
    const lockedSum = locked.reduce((s, e) => s + e.monthlyAlloc, 0);
    const remaining = Math.max(budget - lockedSum, 0);
    const envMap    = new Map(envelopes.map(e => [e.id, e]));
    const scores    = unlocked.map(e => ({ id: e.envelopeId, score: urgencyScore(envMap.get(e.envelopeId)!) }));
    const total     = scores.reduce((s, x) => s + x.score, 0);
    return entries.map(entry => {
        if (entry.locked) return entry;
        const sc    = scores.find(s => s.id === entry.envelopeId);
        const alloc = total > 0 ? (sc!.score / total) * remaining : remaining / unlocked.length;
        const rounded = Math.round(alloc * 100) / 100;
        return { ...entry, monthlyAlloc: rounded, autoAlloc: rounded };
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
            ? Math.round((projDate.getTime() - targetDate.getTime()) / 86400000) : 0;
        return { envelopeId: entry.envelopeId, monthlyAlloc: monthly, projectedDate: projDate, meetsTarget, monthsNeeded, shortfall };
    });
}

// ── Shared panel header ──────────────────────────────────────────────────────
const PanelHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
    <Box sx={{
        background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 50%, #5a1515 100%)`,
        px: 3, py: 2, position: 'relative', overflow: 'hidden',
    }}>
        <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ position: 'absolute', bottom: -20, right: 50, width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative' }}>
            <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {icon}
            </Box>
            <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>{title}</Typography>
                <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>{subtitle}</Typography>
            </Box>
        </Box>
    </Box>
);

// ── Envelope card ────────────────────────────────────────────────────────────
const EnvelopeCard: React.FC<{
    envelope: BudgetEnvelope;
    animateIn: boolean;
    timeout: number;
    onClick: () => void;
}> = ({ envelope, animateIn, timeout, onClick }) => {
    const pct      = progressPct(envelope.currentAmount, envelope.targetAmount);
    const color    = ENVELOPE_COLORS[envelope.envelopeType] ?? MAROON;
    const status   = STATUS_META[envelope.status];
    const days     = daysUntil(envelope.targetDate);
    const isUrgent = days !== null && days <= 60 && envelope.status === 'ACTIVE';

    return (
        <Grow in={animateIn} timeout={timeout}>
            <Box onClick={onClick} sx={{
                background: '#fff', borderRadius: '12px',
                border: `1px solid ${alpha(color, 0.2)}`,
                borderTop: `3px solid ${color}`,
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)', p: 2.5, cursor: 'pointer',
                transition: 'box-shadow 0.2s, transform 0.15s',
                '&:hover': { boxShadow: `0 6px 24px ${alpha(color, 0.18)}`, transform: 'translateY(-2px)' },
                position: 'relative', overflow: 'hidden',
            }}>
                {envelope.status === 'COMPLETED' && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', bgcolor: alpha('#16a34a', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={16} color="#16a34a" />
                    </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 34, height: 34, borderRadius: '9px', bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {envelope.envelopeType === 'SAVINGS'   && <PiggyBank size={16} color={color} />}
                            {envelope.envelopeType === 'PAYOFF'    && <XCircle   size={16} color={color} />}
                            {envelope.envelopeType === 'PURCHASE'  && <Wallet    size={16} color={color} />}
                            {envelope.envelopeType === 'EMERGENCY' && <Flame     size={16} color={color} />}
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#111', lineHeight: 1.2 }}>{envelope.envelopeName}</Typography>
                            <Typography sx={{ fontSize: '0.65rem', color: '#888', mt: 0.1 }}>{envelope.description}</Typography>
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
                    <Chip size="small" label={ENVELOPE_TYPE_LABELS[envelope.envelopeType]}
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(color, 0.1), color }} />
                    <Chip size="small"
                          icon={<Box sx={{ display: 'flex', alignItems: 'center', color: status.color, ml: 0.5 }}>{status.icon}</Box>}
                          label={status.label}
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(status.color, 0.1), color: status.color, '& .MuiChip-icon': { ml: '4px', mr: '-2px' } }} />
                    {isUrgent && (
                        <Chip size="small" label={`${days}d left`} icon={<Clock size={9} />}
                              sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha('#d97706', 0.1), color: '#d97706', '& .MuiChip-icon': { ml: '4px', mr: '-2px', color: '#d97706' } }} />
                    )}
                </Box>
                <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: '#555', fontWeight: 600 }}>{fmt(envelope.currentAmount)} saved</Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#555', fontWeight: 700 }}>{pct.toFixed(0)}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct}
                                    sx={{ height: 6, borderRadius: 3, bgcolor: alpha(color, 0.12), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>Goal: {fmt(envelope.targetAmount)}</Typography>
                        {envelope.remainingAmount > 0
                            ? <Typography sx={{ fontSize: '0.62rem', color, fontWeight: 700 }}>{fmt(envelope.remainingAmount)} to go</Typography>
                            : <Typography sx={{ fontSize: '0.62rem', color: '#16a34a', fontWeight: 700 }}>Goal reached! 🎉</Typography>}
                    </Box>
                </Box>
                <Divider sx={{ mb: 1.25, borderColor: alpha(color, 0.1) }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Calendar size={11} color="#aaa" />
                        <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>
                            {envelope.contributionFrequency
                                ? `${envelope.contributionFrequency.charAt(0) + envelope.contributionFrequency.slice(1).toLowerCase()} · ${fmt(envelope.allocatedAmount)}`
                                : fmt(envelope.allocatedAmount)}
                        </Typography>
                    </Box>
                    {envelope.targetDate && (
                        <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>
                            Target: {new Date(envelope.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Grow>
    );
};

// ── Contribution row ─────────────────────────────────────────────────────────
const ContributionRow: React.FC<{ c: EnvelopeContribution; color: string }> = ({ c, color }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${alpha('#000', 0.05)}`, '&:last-child': { borderBottom: 'none' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{ width: 28, height: 28, borderRadius: '7px', bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ArrowUpRight size={13} color={color} />
            </Box>
            <Box>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#111' }}>{c.note || 'Contribution'}</Typography>
                <Typography sx={{ fontSize: '0.62rem', color: '#888' }}>
                    {new Date(c.contributedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Typography>
            </Box>
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color, fontVariantNumeric: 'tabular-nums' }}>+{fmt(c.amount)}</Typography>
    </Box>
);

// ── Planner priority row ─────────────────────────────────────────────────────
const PlannerRow: React.FC<{
    rank:      number;
    entry:     PlanEntry;
    env:       BudgetEnvelope;
    result:    PlanResult;
    total:     number;
    onUp:      () => void;
    onDown:    () => void;
    onAlloc:   (v: number) => void;
    onLock:    () => void;
    isFirst:   boolean;
    isLast:    boolean;
    animateIn: boolean;
    timeout:   number;
}> = ({ rank, entry, env, result, total, onUp, onDown, onAlloc, onLock, isFirst, isLast, animateIn, timeout }) => {
    const color    = ENVELOPE_COLORS[env.envelopeType];
    const pct      = total > 0 ? (entry.monthlyAlloc / total) * 100 : 0;
    const score    = urgencyScore(env);
    const urgLabel = score > 800 ? 'Critical' : score > 400 ? 'High' : score > 150 ? 'Medium' : 'Low';
    const urgColor = score > 800 ? '#dc2626' : score > 400 ? '#d97706' : score > 150 ? '#0284c7' : '#16a34a';
    const daysLeft = daysUntil(env.targetDate);

    return (
        <Grow in={animateIn} timeout={timeout}>
            <Box sx={{
                borderRadius: '12px',
                border: `1.5px solid ${entry.locked ? alpha(color, 0.4) : alpha('#000', 0.08)}`,
                bgcolor: entry.locked ? alpha(color, 0.025) : '#fff',
                overflow: 'hidden',
                transition: 'all 0.18s',
                '&:hover': { borderColor: alpha(color, 0.35), boxShadow: `0 3px 14px ${alpha(color, 0.1)}` },
            }}>
                {/* Header row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderBottom: `1px solid ${alpha('#000', 0.05)}` }}>
                    {/* Rank badge */}
                    <Box sx={{
                        width: 30, height: 30, borderRadius: '8px', flexShrink: 0,
                        background: rank === 1
                            ? `linear-gradient(135deg, ${MAROON_DARK}, ${MAROON})`
                            : rank === 2 ? 'linear-gradient(135deg, #374151, #6b7280)'
                                : alpha('#000', 0.07),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 900, color: rank <= 2 ? '#fff' : '#888' }}>#{rank}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                        <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                            {TYPE_ICONS[env.envelopeType]}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.83rem', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {env.envelopeName}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.2, flexWrap: 'wrap' }}>
                                <Chip size="small" label={urgLabel}
                                      sx={{ height: 15, fontSize: '0.57rem', fontWeight: 800, bgcolor: alpha(urgColor, 0.1), color: urgColor }} />
                                {daysLeft !== null && daysLeft <= 90 && (
                                    <Chip size="small" label={`${daysLeft}d left`} icon={<Clock size={8} />}
                                          sx={{ height: 15, fontSize: '0.57rem', fontWeight: 700, bgcolor: alpha('#d97706', 0.1), color: '#d97706', '& .MuiChip-icon': { ml: '3px', mr: '-2px', color: '#d97706' } }} />
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
                                    sx={{ p: 0.3, borderRadius: '5px', '&:hover': { bgcolor: alpha(MAROON, 0.08) }, '&.Mui-disabled': { opacity: 0.2 } }}>
                            <ArrowUp size={12} color={MAROON} />
                        </IconButton>
                        <IconButton size="small" onClick={onDown} disabled={isLast}
                                    sx={{ p: 0.3, borderRadius: '5px', '&:hover': { bgcolor: alpha(MAROON, 0.08) }, '&.Mui-disabled': { opacity: 0.2 } }}>
                            <ArrowDown size={12} color={MAROON} />
                        </IconButton>
                    </Box>
                </Box>

                {/* Body */}
                <Box sx={{ px: 2, py: 1.5 }}>
                    <Grid container spacing={2} alignItems="center">
                        {/* Allocation control */}
                        <Grid item xs={12} sm={6}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', mb: 0.75 }}>
                                Monthly Contribution
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TextField size="small"
                                           value={entry.monthlyAlloc}
                                           onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0) onAlloc(v); }}
                                           type="number"
                                           InputProps={{
                                               startAdornment: <InputAdornment position="start">
                                                   <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa' }}>$</Typography>
                                               </InputAdornment>,
                                               sx: { fontSize: '0.82rem', fontWeight: 800, borderRadius: '8px' },
                                           }}
                                           inputProps={{ min: 0, step: 5 }}
                                           sx={{ width: 120, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
                                />
                                <Tooltip title={entry.locked ? 'Unlock — allow auto-distribute to adjust' : 'Lock — protect from auto-distribute'}>
                                    <IconButton size="small" onClick={onLock}
                                                sx={{
                                                    borderRadius: '7px',
                                                    border: `1.5px solid ${entry.locked ? color : alpha('#000', 0.15)}`,
                                                    bgcolor: entry.locked ? alpha(color, 0.1) : 'transparent',
                                                    color: entry.locked ? color : '#bbb',
                                                    '&:hover': { borderColor: color, color, bgcolor: alpha(color, 0.08) },
                                                    p: 0.6,
                                                }}>
                                        {entry.locked ? <Lock size={12} /> : <Unlock size={12} />}
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <Box sx={{ mt: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.35 }}>
                                    <Typography sx={{ fontSize: '0.58rem', color: '#bbb' }}>{pct.toFixed(1)}% of total</Typography>
                                    <Typography sx={{ fontSize: '0.58rem', color: '#bbb' }}>{fmt(entry.autoAlloc)} suggested</Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={Math.min(pct, 100)}
                                                sx={{ height: 4, borderRadius: 2, bgcolor: alpha(color, 0.1), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 } }} />
                            </Box>
                        </Grid>

                        {/* Projection */}
                        <Grid item xs={12} sm={6}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', mb: 0.75 }}>
                                Projection
                            </Typography>
                            <Box sx={{
                                p: 1.25, borderRadius: '8px',
                                bgcolor: result.meetsTarget ? alpha('#16a34a', 0.06) : alpha('#dc2626', 0.06),
                                border: `1px solid ${result.meetsTarget ? alpha('#16a34a', 0.2) : alpha('#dc2626', 0.2)}`,
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.3 }}>
                                    {result.meetsTarget ? <CheckCircle size={12} color="#16a34a" /> : <AlertTriangle size={12} color="#dc2626" />}
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: result.meetsTarget ? '#15803d' : '#dc2626' }}>
                                        {result.projectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </Typography>
                                </Box>
                                <Typography sx={{ fontSize: '0.65rem', color: '#555', lineHeight: 1.4 }}>
                                    {result.meetsTarget
                                        ? env.targetDate
                                            ? `On track — ${result.monthsNeeded}mo to goal ✓`
                                            : `${result.monthsNeeded} months to goal`
                                        : `${result.shortfall}d late — needs ${fmt(env.remainingAmount / Math.max(monthsBetween(new Date(), new Date(env.targetDate!)), 1))}/mo`
                                    }
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </Grow>
    );
};

// ════════════════════════════════════════════════════════════════════════════
// ── Main Page ────────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
type PageView = 'envelopes' | 'planner';

const BudgetEnvelopesPage: React.FC = () => {
    // ── UI state ────────────────────────────────────────────────────────────
    const [animateIn,  setAnimateIn]  = useState(false);
    const [isLoading,  setIsLoading]  = useState(false);
    const [pageView,   setPageView]   = useState<PageView>('envelopes');
    const [createOpen, setCreateOpen] = useState(false);
    const [snackOpen,  setSnackOpen]  = useState(false);
    const [snackMsg,   setSnackMsg]   = useState('');
    const [snackSev,   setSnackSev]   = useState<'success'|'error'|'info'|'warning'>('success');

    // ── Data state ──────────────────────────────────────────────────────────
    const [envelopes,     setEnvelopes]     = useState<BudgetEnvelope[]>([]);
    const [contributions, setContributions] = useState<EnvelopeContribution[]>([]);
    const [selectedId,    setSelectedId]    = useState<number | null>(null);
    const [filterStatus,  setFilterStatus]  = useState<string>('ALL');
    const [filterType,    setFilterType]    = useState<string>('ALL');

    // ── Planner state ───────────────────────────────────────────────────────
    const [planBudget,    setPlanBudget]    = useState<number>(0);
    const [planEntries,   setPlanEntries]   = useState<PlanEntry[]>([]);
    const [planTimeframe, setPlanTimeframe] = useState<number>(4);
    const [planApplied,   setPlanApplied]   = useState(false);

    // ── Init ────────────────────────────────────────────────────────────────
    useEffect(() => {
        document.title = 'Envelopes';
        setTimeout(() => setAnimateIn(true), 100);
        setIsLoading(true);
        setTimeout(() => {
            setEnvelopes(MOCK_ENVELOPES);
            setContributions(MOCK_CONTRIBUTIONS);
            setIsLoading(false);
        }, 600);
        return () => { document.title = 'BudgetBuddy'; };
    }, []);

    const activeEnvelopes = useMemo(() => envelopes.filter(e => e.status === 'ACTIVE'), [envelopes]);
    const defaultBudget   = useMemo(() => activeEnvelopes.reduce((s, e) => s + e.allocatedAmount, 0), [activeEnvelopes]);

    // Init planner when switching to planner view
    useEffect(() => {
        if (pageView !== 'planner' || activeEnvelopes.length === 0) return;
        const budget = defaultBudget;
        const sorted = [...activeEnvelopes].sort((a, b) => urgencyScore(b) - urgencyScore(a));
        const initial: PlanEntry[] = sorted.map((env, i) => ({
            envelopeId: env.id, priority: i + 1,
            monthlyAlloc: env.allocatedAmount, locked: false, autoAlloc: env.allocatedAmount,
        }));
        setPlanEntries(distributeAuto(initial, activeEnvelopes, budget));
        setPlanBudget(budget);
        setPlanApplied(false);
    }, [pageView, activeEnvelopes, defaultBudget]);

    // ── Planner handlers ────────────────────────────────────────────────────
    const redistributePlan = useCallback((budget: number, entries: PlanEntry[]) => {
        setPlanEntries(distributeAuto(entries, activeEnvelopes, budget));
    }, [activeEnvelopes]);

    const handlePlanBudgetChange = (v: number) => {
        setPlanBudget(v);
        redistributePlan(v, planEntries);
    };

    const handlePlanAlloc = (id: number, v: number) =>
        setPlanEntries(prev => prev.map(e => e.envelopeId === id ? { ...e, monthlyAlloc: v } : e));

    const handlePlanLock = (id: number) =>
        setPlanEntries(prev => prev.map(e => e.envelopeId === id ? { ...e, locked: !e.locked } : e));

    const movePlanUp = (idx: number) => {
        if (idx === 0) return;
        setPlanEntries(prev => {
            const next = [...prev];
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
            return next.map((e, i) => ({ ...e, priority: i + 1 }));
        });
    };

    const movePlanDown = (idx: number) => {
        setPlanEntries(prev => {
            if (idx >= prev.length - 1) return prev;
            const next = [...prev];
            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
            return next.map((e, i) => ({ ...e, priority: i + 1 }));
        });
    };

    const resetPlanToAuto = () => {
        const sorted = [...activeEnvelopes].sort((a, b) => urgencyScore(b) - urgencyScore(a));
        const reset: PlanEntry[] = sorted.map((env, i) => ({
            envelopeId: env.id, priority: i + 1,
            monthlyAlloc: env.allocatedAmount, locked: false, autoAlloc: env.allocatedAmount,
        }));
        setPlanEntries(distributeAuto(reset, activeEnvelopes, planBudget));
    };

    const handleApplyPlan = () => {
        setEnvelopes(prev => prev.map(e => {
            const entry = planEntries.find(p => p.envelopeId === e.id);
            return entry ? { ...e, allocatedAmount: entry.monthlyAlloc } : e;
        }));
        setPlanApplied(true);
        setSnackMsg('Priority plan applied — allocations updated!');
        setSnackSev('success');
        setSnackOpen(true);
        setTimeout(() => {
            setPlanApplied(false);
            setPageView('envelopes');
        }, 1400);
    };

    // ── Derived planner values ──────────────────────────────────────────────
    const planResults    = useMemo(() => computeResults(planEntries, activeEnvelopes), [planEntries, activeEnvelopes]);
    const planAllocated  = planEntries.reduce((s, e) => s + e.monthlyAlloc, 0);
    const planSurplus    = planBudget - planAllocated;
    const allOnTrack     = planResults.every(r => r.meetsTarget);
    const criticalCount  = planResults.filter(r => !r.meetsTarget).length;
    const envMap         = useMemo(() => new Map(activeEnvelopes.map(e => [e.id, e])), [activeEnvelopes]);
    const withinHorizon  = planResults.filter(r => r.monthsNeeded <= planTimeframe);
    const outsideHorizon = planResults.filter(r => r.monthsNeeded > planTimeframe);

    // ── Envelope view derived ───────────────────────────────────────────────
    const selectedEnvelope      = useMemo(() => envelopes.find(e => e.id === selectedId) ?? null, [envelopes, selectedId]);
    const selectedContributions = useMemo(() => contributions.filter(c => c.envelopeId === selectedId), [contributions, selectedId]);
    const filtered = useMemo(() => envelopes.filter(e => {
        const statusOk = filterStatus === 'ALL' || e.status === filterStatus;
        const typeOk   = filterType   === 'ALL' || e.envelopeType === filterType;
        return statusOk && typeOk;
    }), [envelopes, filterStatus, filterType]);

    const stats = useMemo(() => {
        const active = envelopes.filter(e => e.status === 'ACTIVE');
        return {
            totalEnvelopes: active.length,
            totalAllocated: active.reduce((s, e) => s + e.allocatedAmount, 0),
            totalSaved:     active.reduce((s, e) => s + e.currentAmount,   0),
            totalTarget:    active.reduce((s, e) => s + e.targetAmount,    0),
            completed:      envelopes.filter(e => e.status === 'COMPLETED').length,
        };
    }, [envelopes]);

    const overallPct = stats.totalTarget > 0 ? Math.min((stats.totalSaved / stats.totalTarget) * 100, 100) : 0;

    const filterBtn = (label: string, value: string, current: string, setter: (v: string) => void) => (
        <Button key={value} size="small" onClick={() => setter(value)}
                variant={current === value ? 'contained' : 'outlined'}
                sx={{
                    borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem',
                    ...(current === value
                        ? { bgcolor: MAROON, color: '#fff', borderColor: MAROON, '&:hover': { bgcolor: MAROON_DARK } }
                        : { borderColor: '#d5d5d5', color: '#555', bgcolor: '#fff', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: alpha(MAROON, 0.04) } }),
                }}>
            {label}
        </Button>
    );

    // ════════════════════════════════════════════════════════════════════════
    return (
        <Box sx={{ maxWidth: 'calc(100% - 240px)', ml: '240px', minHeight: '100vh', background: '#f0f2f5' }}>
            <Sidebar />

            {isLoading && (
                <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <CircularProgress size={52} thickness={4} sx={{ color: MAROON, mb: 2.5 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#111', mb: 0.5 }}>Loading Envelopes</Typography>
                    <Typography variant="body2" color="text.secondary">Fetching your savings goals…</Typography>
                </Box>
            )}

            <Container maxWidth="xl" sx={{ py: 4 }}>

                {/* ── Page header ─────────────────────────────────────────── */}
                <Grow in={animateIn} timeout={400}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                        <Box>
                            <Box sx={{ width: 28, height: 3, background: MAROON, borderRadius: '2px', mb: 0.75 }} />
                            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#111', letterSpacing: '-0.025em' }}>
                                Budget Envelopes
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: '#888', mt: 0.5 }}>
                                {pageView === 'envelopes'
                                    ? 'Dedicated funds for your short- and medium-term goals'
                                    : 'Optimise how your budget is distributed across active envelopes'}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>

                            {/* ── View toggle pill ───────────────────────── */}
                            <Box sx={{ display: 'flex', p: '4px', borderRadius: '12px', bgcolor: '#e4e4e7', gap: '3px' }}>
                                {([
                                    { view: 'envelopes' as PageView, label: 'Envelopes',       icon: <Wallet    size={13} /> },
                                    { view: 'planner'  as PageView, label: 'Priority Planner', icon: <BarChart2 size={13} />, disabled: activeEnvelopes.length < 2 },
                                ]).map(({ view, label, icon, disabled }) => (
                                    <Tooltip key={view} title={disabled ? 'Add at least 2 active envelopes to use the planner' : ''}>
                                        <Box>
                                            <Button size="small" disabled={disabled} onClick={() => setPageView(view)}
                                                    startIcon={icon}
                                                    sx={{
                                                        borderRadius: '8px', textTransform: 'none',
                                                        fontWeight: 700, fontSize: '0.78rem',
                                                        px: 1.75, py: 0.7, minWidth: 0,
                                                        transition: 'all 0.18s',
                                                        ...(pageView === view
                                                                ? { bgcolor: '#fff', color: MAROON, boxShadow: '0 1px 6px rgba(0,0,0,0.13)', '&:hover': { bgcolor: '#fff' } }
                                                                : { bgcolor: 'transparent', color: '#71717a', '&:hover': { bgcolor: alpha('#fff', 0.55), color: '#333' } }
                                                        ),
                                                        '&.Mui-disabled': { bgcolor: 'transparent', color: '#c4c4c4' },
                                                    }}>
                                                {label}
                                            </Button>
                                        </Box>
                                    </Tooltip>
                                ))}
                            </Box>

                            {/* ── Context action button ──────────────────── */}
                            {pageView === 'envelopes' ? (
                                <Button variant="contained" startIcon={<Plus size={15} />}
                                        onClick={() => setCreateOpen(true)}
                                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK }, px: 2.5, py: 1 }}>
                                    New Envelope
                                </Button>
                            ) : (
                                <Button variant="contained"
                                        startIcon={planApplied ? <CheckCircle size={15} /> : <ChevronRight size={15} />}
                                        onClick={handleApplyPlan}
                                        sx={{
                                            borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', px: 2.5, py: 1,
                                            bgcolor: planApplied ? '#16a34a' : MAROON,
                                            '&:hover': { bgcolor: planApplied ? '#15803d' : MAROON_DARK },
                                            transition: 'background 0.3s',
                                        }}>
                                    {planApplied ? 'Applied!' : 'Apply Plan'}
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Grow>

                {/* ── Summary cards — always visible ──────────────────────── */}
                <Grow in={animateIn} timeout={600}>
                    <Grid container spacing={2.5} sx={{ mb: 4 }}>
                        {[
                            { label: 'Active Envelopes', value: String(stats.totalEnvelopes), sub: `${stats.completed} completed`,                    color: MAROON,    bg: '#f0f4ff', chip: <><Layers size={10} /> All time</>,       pct: 100       },
                            { label: 'Monthly Allocated', value: fmt(stats.totalAllocated),   sub: `across ${stats.totalEnvelopes} envelopes`,         color: '#7c3aed', bg: '#faf5ff', chip: <><Calendar size={10} /> /month</>,     pct: 100       },
                            { label: 'Total Saved',       value: fmt(stats.totalSaved),       sub: `${overallPct.toFixed(0)}% of all targets`,         color: '#16a34a', bg: '#f0fdf4', chip: <><TrendingUp size={10} /> progress</>, pct: overallPct },
                            { label: 'Total Target',      value: fmt(stats.totalTarget),      sub: `${fmt(stats.totalTarget - stats.totalSaved)} left`, color: '#0284c7', bg: '#f0f9ff', chip: <><Target size={10} /> goal</>,        pct: 100       },
                        ].map(({ label, value, sub, color, bg, chip, pct }) => (
                            <Grid item xs={12} sm={6} md={3} key={label}>
                                <Box sx={{ background: bg, borderRadius: '10px', borderTop: `3px solid ${color}`, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', p: 2.5, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' } }}>
                                    <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: alpha(color, 0.7), fontWeight: 700, mb: 1 }}>{label}</Typography>
                                    {isLoading
                                        ? <Skeleton variant="text" width="60%" height={42} />
                                        : <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color, lineHeight: 1, mb: 0.5, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>}
                                    <LinearProgress variant="determinate" value={pct}
                                                    sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(color, 0.15), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 } }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography sx={{ fontSize: '0.72rem', color: alpha(color, 0.65) }}>{sub}</Typography>
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: alpha(color, 0.1), color, fontSize: '0.65rem', fontWeight: 700 }}>
                                            {chip}
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Grow>

                {/* ════════════════════════════════════════════════════════════
                    ENVELOPES VIEW
                ════════════════════════════════════════════════════════════ */}
                {pageView === 'envelopes' && (
                    <>
                        <Grow in={animateIn} timeout={700}>
                            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', mr: 0.5 }}>Status:</Typography>
                                {['ALL','ACTIVE','PAUSED','COMPLETED','CANCELLED'].map(v =>
                                    filterBtn(v === 'ALL' ? 'All' : STATUS_META[v]?.label ?? v, v, filterStatus, setFilterStatus)
                                )}
                                <Box sx={{ mx: 1, width: 1, height: 20, bgcolor: '#ddd' }} />
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', mr: 0.5 }}>Type:</Typography>
                                {['ALL','SAVINGS','PAYOFF','PURCHASE','EMERGENCY'].map(v =>
                                    filterBtn(v === 'ALL' ? 'All' : ENVELOPE_TYPE_LABELS[v], v, filterType, setFilterType)
                                )}
                            </Box>
                        </Grow>

                        <Grid container spacing={3}>
                            <Grid item xs={12} lg={8}>
                                <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}` }}>
                                    <PanelHeader icon={<Wallet size={15} color="white" />}
                                                 title="Your Envelopes"
                                                 subtitle={`${filtered.length} envelope${filtered.length !== 1 ? 's' : ''} — tap one to view details`} />
                                    <Box sx={{ bgcolor: '#fff', p: 3 }}>
                                        {filtered.length === 0 && !isLoading ? (
                                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                                <PiggyBank size={40} color={alpha(MAROON, 0.25)} />
                                                <Typography sx={{ mt: 2, fontWeight: 700, color: '#555' }}>No envelopes match your filters</Typography>
                                                <Typography sx={{ mt: 0.5, fontSize: '0.82rem', color: '#aaa' }}>Try adjusting the status or type filter above.</Typography>
                                            </Box>
                                        ) : (
                                            <Grid container spacing={2}>
                                                {isLoading
                                                    ? Array.from({ length: 4 }).map((_, i) => (
                                                        <Grid item xs={12} sm={6} key={i}><Skeleton variant="rounded" height={180} sx={{ borderRadius: '12px' }} /></Grid>
                                                    ))
                                                    : filtered.map((env, i) => (
                                                        <Grid item xs={12} sm={6} key={env.id}>
                                                            <EnvelopeCard envelope={env} animateIn={animateIn} timeout={700 + i * 80}
                                                                          onClick={() => setSelectedId(env.id === selectedId ? null : env.id)} />
                                                        </Grid>
                                                    ))}
                                            </Grid>
                                        )}
                                    </Box>
                                </Box>
                            </Grid>

                            <Grid item xs={12} lg={4}>
                                <Grow in={animateIn} timeout={800}>
                                    <Box sx={{ position: 'sticky', top: 24 }}>
                                        {selectedEnvelope ? (
                                            <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.25)}`, boxShadow: `0 4px 24px ${alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.12)}` }}>
                                                <Box sx={{ background: `linear-gradient(135deg, ${alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.9)} 0%, ${ENVELOPE_COLORS[selectedEnvelope.envelopeType]} 100%)`, px: 3, py: 2, position: 'relative', overflow: 'hidden' }}>
                                                    <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <Box>
                                                            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>{selectedEnvelope.envelopeName}</Typography>
                                                            <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.75)', mt: 0.1 }}>{selectedEnvelope.description}</Typography>
                                                        </Box>
                                                        <IconButton size="small" onClick={() => setSelectedId(null)}
                                                                    sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                                                            <XCircle size={16} />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                                <Box sx={{ bgcolor: '#fff', p: 2.5 }}>
                                                    <Box sx={{ textAlign: 'center', mb: 2.5 }}>
                                                        <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, color: ENVELOPE_COLORS[selectedEnvelope.envelopeType], fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                                                            {fmt(selectedEnvelope.currentAmount)}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.72rem', color: '#888', mt: 0.4 }}>of {fmt(selectedEnvelope.targetAmount)} goal</Typography>
                                                        <LinearProgress variant="determinate" value={progressPct(selectedEnvelope.currentAmount, selectedEnvelope.targetAmount)}
                                                                        sx={{ mt: 1.5, height: 8, borderRadius: 4, bgcolor: alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.12), '& .MuiLinearProgress-bar': { bgcolor: ENVELOPE_COLORS[selectedEnvelope.envelopeType], borderRadius: 4 } }} />
                                                        <Typography sx={{ fontSize: '0.72rem', color: ENVELOPE_COLORS[selectedEnvelope.envelopeType], fontWeight: 700, mt: 0.75 }}>
                                                            {progressPct(selectedEnvelope.currentAmount, selectedEnvelope.targetAmount).toFixed(1)}% complete
                                                        </Typography>
                                                    </Box>
                                                    <Divider sx={{ mb: 2 }} />
                                                    <Grid container spacing={1.5} sx={{ mb: 2 }}>
                                                        {[
                                                            { label: 'Remaining',   value: fmt(selectedEnvelope.remainingAmount) },
                                                            { label: 'Allocated',   value: `${fmt(selectedEnvelope.allocatedAmount)}/mo` },
                                                            { label: 'Target Date', value: selectedEnvelope.targetDate ? new Date(selectedEnvelope.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
                                                            { label: 'Days Left',   value: daysUntil(selectedEnvelope.targetDate) !== null ? `${daysUntil(selectedEnvelope.targetDate)}d` : '—' },
                                                        ].map(({ label, value }) => (
                                                            <Grid item xs={6} key={label}>
                                                                <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
                                                                    <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', mb: 0.3 }}>{label}</Typography>
                                                                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                                                                </Box>
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                    <Stack spacing={1} sx={{ mb: 2.5 }}>
                                                        <Button fullWidth variant="contained" startIcon={<Plus size={14} />}
                                                                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', bgcolor: ENVELOPE_COLORS[selectedEnvelope.envelopeType], '&:hover': { bgcolor: alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.85) } }}
                                                                onClick={() => { setSnackMsg('Add contribution — coming soon!'); setSnackSev('info'); setSnackOpen(true); }}>
                                                            Add Contribution
                                                        </Button>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <Button fullWidth variant="outlined" size="small" startIcon={<MoreHorizontal size={13} />}
                                                                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', borderColor: '#d5d5d5', color: '#555', '&:hover': { borderColor: MAROON, color: MAROON } }}
                                                                    onClick={() => { setSnackMsg('Edit — coming soon!'); setSnackSev('info'); setSnackOpen(true); }}>
                                                                Edit
                                                            </Button>
                                                            {selectedEnvelope.status === 'ACTIVE' && (
                                                                <Button fullWidth variant="outlined" size="small" startIcon={<PauseCircle size={13} />}
                                                                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', borderColor: '#d5d5d5', color: '#d97706', '&:hover': { borderColor: '#d97706', bgcolor: alpha('#d97706', 0.04) } }}
                                                                        onClick={() => { setSnackMsg('Pause — coming soon!'); setSnackSev('info'); setSnackOpen(true); }}>
                                                                    Pause
                                                                </Button>
                                                            )}
                                                        </Box>
                                                    </Stack>
                                                    <Divider sx={{ mb: 1.5 }} />
                                                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.25 }}>
                                                        Contribution History
                                                    </Typography>
                                                    {selectedContributions.length === 0
                                                        ? <Typography sx={{ fontSize: '0.75rem', color: '#bbb', textAlign: 'center', py: 2 }}>No contributions yet</Typography>
                                                        : <>
                                                            {selectedContributions.map(c => (
                                                                <ContributionRow key={c.id} c={c} color={ENVELOPE_COLORS[selectedEnvelope.envelopeType]} />
                                                            ))}
                                                            <Box sx={{ mt: 1.5, p: 1.25, borderRadius: '8px', bgcolor: alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.06), border: `1px solid ${alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.15)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#333' }}>Total contributed</Typography>
                                                                <Typography sx={{ fontWeight: 900, fontSize: '0.95rem', color: ENVELOPE_COLORS[selectedEnvelope.envelopeType], fontVariantNumeric: 'tabular-nums' }}>
                                                                    {fmt(selectedContributions.reduce((s, c) => s + c.amount, 0))}
                                                                </Typography>
                                                            </Box>
                                                        </>}
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}` }}>
                                                <PanelHeader icon={<Target size={15} color="white" />} title="Quick Overview" subtitle="Tap any envelope card for details" />
                                                <Box sx={{ bgcolor: '#fff', p: 2.5 }}>
                                                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.5 }}>By Priority</Typography>
                                                    <Stack spacing={1.25}>
                                                        {envelopes.filter(e => e.status === 'ACTIVE').sort((a, b) => a.priority - b.priority).map(env => {
                                                            const c   = ENVELOPE_COLORS[env.envelopeType];
                                                            const pct = progressPct(env.currentAmount, env.targetAmount);
                                                            return (
                                                                <Box key={env.id} onClick={() => setSelectedId(env.id)}
                                                                     sx={{ p: 1.5, borderRadius: '10px', cursor: 'pointer', border: `1px solid ${alpha(c, 0.2)}`, '&:hover': { bgcolor: alpha(c, 0.04), borderColor: alpha(c, 0.4) }, transition: 'all 0.15s' }}>
                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                            <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: c, flexShrink: 0 }} />
                                                                            <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#111' }}>{env.envelopeName}</Typography>
                                                                        </Box>
                                                                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: c, fontVariantNumeric: 'tabular-nums' }}>{pct.toFixed(0)}%</Typography>
                                                                    </Box>
                                                                    <LinearProgress variant="determinate" value={pct}
                                                                                    sx={{ height: 4, borderRadius: 2, bgcolor: alpha(c, 0.12), '& .MuiLinearProgress-bar': { bgcolor: c, borderRadius: 2 } }} />
                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                                                        <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>{fmt(env.currentAmount)}</Typography>
                                                                        <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>{fmt(env.targetAmount)}</Typography>
                                                                    </Box>
                                                                </Box>
                                                            );
                                                        })}
                                                    </Stack>
                                                    <Divider sx={{ my: 2 }} />
                                                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.25 }}>Upcoming Deadlines</Typography>
                                                    <Stack spacing={1}>
                                                        {envelopes.filter(e => e.status === 'ACTIVE' && e.targetDate)
                                                            .sort((a, b) => new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime())
                                                            .slice(0, 3)
                                                            .map(env => {
                                                                const days  = daysUntil(env.targetDate)!;
                                                                const dc    = days <= 60 ? '#d97706' : '#16a34a';
                                                                return (
                                                                    <Box key={env.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75, borderBottom: `1px solid ${alpha('#000', 0.05)}`, '&:last-child': { borderBottom: 'none' } }}>
                                                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#333' }}>{env.envelopeName}</Typography>
                                                                        <Chip size="small" label={`${days}d`} sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: alpha(dc, 0.1), color: dc }} />
                                                                    </Box>
                                                                );
                                                            })}
                                                    </Stack>
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                </Grow>
                            </Grid>
                        </Grid>
                    </>
                )}

                {/* ════════════════════════════════════════════════════════════
                    PLANNER VIEW
                ════════════════════════════════════════════════════════════ */}
                {pageView === 'planner' && (
                    <Grow in timeout={350}>
                        <Box>
                            {/* Controls panel */}
                            <Box sx={{ borderRadius: '14px', border: `1px solid ${alpha(MAROON, 0.15)}`, overflow: 'hidden', boxShadow: `0 4px 24px ${alpha(MAROON, 0.07)}`, mb: 3 }}>
                                <PanelHeader icon={<BarChart2 size={15} color="white" />}
                                             title="Priority Planner"
                                             subtitle={`Optimise monthly contributions across ${activeEnvelopes.length} active envelopes`} />
                                <Box sx={{ bgcolor: '#fff', px: 3, py: 2.5 }}>
                                    <Grid container spacing={3} alignItems="flex-end">
                                        {/* Budget */}
                                        <Grid item xs={12} sm={4}>
                                            <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888', mb: 0.75 }}>
                                                Monthly Envelope Budget
                                            </Typography>
                                            <TextField size="small" value={planBudget} fullWidth type="number"
                                                       onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0) handlePlanBudgetChange(v); }}
                                                       InputProps={{
                                                           startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: '#aaa' }}>$</Typography></InputAdornment>,
                                                           sx: { fontWeight: 800, borderRadius: '9px', fontSize: '0.9rem' },
                                                       }}
                                                       inputProps={{ min: 0, step: 10 }}
                                                       sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: MAROON } }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.6 }}>
                                                <Typography sx={{ fontSize: '0.62rem', color: planSurplus >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                                                    {planSurplus >= 0 ? `${fmt(planSurplus)} unallocated` : `${fmt(Math.abs(planSurplus))} over budget`}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>{fmt(planAllocated)} allocated</Typography>
                                            </Box>
                                            <LinearProgress variant="determinate"
                                                            value={Math.min((planAllocated / Math.max(planBudget, 1)) * 100, 100)}
                                                            sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: alpha(planSurplus < 0 ? '#dc2626' : '#16a34a', 0.12), '& .MuiLinearProgress-bar': { bgcolor: planSurplus < 0 ? '#dc2626' : '#16a34a', borderRadius: 2 } }} />
                                        </Grid>

                                        {/* Horizon */}
                                        <Grid item xs={12} sm={4}>
                                            <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888', mb: 0.75 }}>
                                                Planning Horizon
                                            </Typography>
                                            <ToggleButtonGroup value={planTimeframe} exclusive
                                                               onChange={(_, v) => v && setPlanTimeframe(v)} size="small"
                                                               sx={{ width: '100%', '& .MuiToggleButton-root': { flex: 1, textTransform: 'none', fontWeight: 700, fontSize: '0.7rem', borderRadius: '8px !important', mx: 0.2 } }}>
                                                {[3, 4, 6, 12].map(m => (
                                                    <ToggleButton key={m} value={m}
                                                                  sx={{ '&.Mui-selected': { bgcolor: alpha(MAROON, 0.1), color: MAROON, borderColor: `${alpha(MAROON, 0.3)} !important` }, '&:hover': { bgcolor: alpha(MAROON, 0.05) } }}>
                                                        {m}mo
                                                    </ToggleButton>
                                                ))}
                                            </ToggleButtonGroup>
                                            <Typography sx={{ fontSize: '0.62rem', color: '#aaa', mt: 0.6 }}>
                                                {withinHorizon.length} of {planResults.length} completable in {planTimeframe} months
                                            </Typography>
                                        </Grid>

                                        {/* Status + reset */}
                                        <Grid item xs={12} sm={4}>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { sm: 'flex-end' }, alignItems: 'center' }}>
                                                <Chip size="small"
                                                      icon={allOnTrack ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                                                      label={allOnTrack ? 'All on track' : `${criticalCount} need attention`}
                                                      sx={{ fontWeight: 700, fontSize: '0.68rem', height: 24,
                                                          bgcolor: allOnTrack ? alpha('#16a34a', 0.1) : alpha('#dc2626', 0.1),
                                                          color: allOnTrack ? '#15803d' : '#dc2626',
                                                          '& .MuiChip-icon': { color: allOnTrack ? '#15803d' : '#dc2626' } }} />
                                                <Button size="small" startIcon={<RefreshCw size={13} />} onClick={resetPlanToAuto}
                                                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', border: '1px solid #d5d5d5', color: '#555', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: alpha(MAROON, 0.04) } }}>
                                                    Auto-Reset
                                                </Button>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box>

                                {/* Insight warning banner */}
                                {!allOnTrack && (
                                    <Box sx={{ px: 3, py: 1.5, bgcolor: alpha('#d97706', 0.07), borderTop: `1px solid ${alpha('#d97706', 0.18)}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: alpha('#d97706', 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Zap size={14} color="#d97706" />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e' }}>
                                                {criticalCount} envelope{criticalCount !== 1 ? 's' : ''} won't meet {criticalCount !== 1 ? 'their' : 'its'} target date at current allocations.
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.65rem', color: '#b45309' }}>
                                                Increase your monthly budget or lock lower amounts on flexible envelopes to redirect funds to critical ones.
                                            </Typography>
                                        </Box>
                                        <Button size="small" onClick={resetPlanToAuto}
                                                sx={{ borderRadius: '7px', textTransform: 'none', fontWeight: 700, fontSize: '0.7rem', bgcolor: alpha('#d97706', 0.15), color: '#92400e', flexShrink: 0, '&:hover': { bgcolor: alpha('#d97706', 0.25) } }}>
                                            Fix Auto
                                        </Button>
                                    </Box>
                                )}
                            </Box>

                            {/* Priority rows + summary */}
                            <Grid container spacing={3}>
                                <Grid item xs={12} lg={8}>
                                    <Stack spacing={2}>
                                        {withinHorizon.length > 0 && (
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                                    <Box sx={{ width: 6, height: 6, borderRadius: '2px', bgcolor: '#16a34a' }} />
                                                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#16a34a' }}>
                                                        Completable within {planTimeframe} months
                                                    </Typography>
                                                    <Chip size="small" label={withinHorizon.length} sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: alpha('#16a34a', 0.1), color: '#16a34a' }} />
                                                </Box>
                                                <Stack spacing={1.5}>
                                                    {planEntries
                                                        .filter(e => { const r = planResults.find(r => r.envelopeId === e.envelopeId); return r && r.monthsNeeded <= planTimeframe; })
                                                        .map(entry => {
                                                            const env       = envMap.get(entry.envelopeId)!;
                                                            const result    = planResults.find(r => r.envelopeId === entry.envelopeId)!;
                                                            const globalIdx = planEntries.findIndex(e => e.envelopeId === entry.envelopeId);
                                                            return (
                                                                <PlannerRow key={entry.envelopeId}
                                                                            rank={entry.priority} entry={entry} env={env} result={result} total={planAllocated}
                                                                            onUp={() => movePlanUp(globalIdx)} onDown={() => movePlanDown(globalIdx)}
                                                                            onAlloc={v => handlePlanAlloc(entry.envelopeId, v)} onLock={() => handlePlanLock(entry.envelopeId)}
                                                                            isFirst={globalIdx === 0} isLast={globalIdx === planEntries.length - 1}
                                                                            animateIn timeout={300 + globalIdx * 60}
                                                                />
                                                            );
                                                        })}
                                                </Stack>
                                            </Box>
                                        )}

                                        {outsideHorizon.length > 0 && (
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, mt: withinHorizon.length > 0 ? 1 : 0 }}>
                                                    <Box sx={{ width: 6, height: 6, borderRadius: '2px', bgcolor: '#d97706' }} />
                                                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#d97706' }}>
                                                        Beyond {planTimeframe}-month horizon
                                                    </Typography>
                                                    <Chip size="small" label={outsideHorizon.length} sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: alpha('#d97706', 0.1), color: '#d97706' }} />
                                                </Box>
                                                <Stack spacing={1.5}>
                                                    {planEntries
                                                        .filter(e => { const r = planResults.find(r => r.envelopeId === e.envelopeId); return r && r.monthsNeeded > planTimeframe; })
                                                        .map(entry => {
                                                            const env       = envMap.get(entry.envelopeId)!;
                                                            const result    = planResults.find(r => r.envelopeId === entry.envelopeId)!;
                                                            const globalIdx = planEntries.findIndex(e => e.envelopeId === entry.envelopeId);
                                                            return (
                                                                <PlannerRow key={entry.envelopeId}
                                                                            rank={entry.priority} entry={entry} env={env} result={result} total={planAllocated}
                                                                            onUp={() => movePlanUp(globalIdx)} onDown={() => movePlanDown(globalIdx)}
                                                                            onAlloc={v => handlePlanAlloc(entry.envelopeId, v)} onLock={() => handlePlanLock(entry.envelopeId)}
                                                                            isFirst={globalIdx === 0} isLast={globalIdx === planEntries.length - 1}
                                                                            animateIn timeout={300 + globalIdx * 60}
                                                                />
                                                            );
                                                        })}
                                                </Stack>
                                            </Box>
                                        )}
                                    </Stack>
                                </Grid>

                                {/* Sticky summary panel */}
                                <Grid item xs={12} lg={4}>
                                    <Grow in timeout={500}>
                                        <Box sx={{ position: 'sticky', top: 24, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}` }}>
                                            <PanelHeader icon={<Target size={15} color="white" />} title="Plan Summary" subtitle="Projected completion per envelope" />
                                            <Box sx={{ bgcolor: '#fff' }}>
                                                {planEntries.map((entry, i) => {
                                                    const env    = envMap.get(entry.envelopeId)!;
                                                    const result = planResults.find(r => r.envelopeId === entry.envelopeId)!;
                                                    const c      = ENVELOPE_COLORS[env.envelopeType];
                                                    const pct    = progressPct(env.currentAmount, env.targetAmount);
                                                    return (
                                                        <Box key={entry.envelopeId} sx={{ px: 2.5, py: 1.75, bgcolor: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: i < planEntries.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                    <Box sx={{ width: 20, height: 20, borderRadius: '5px', bgcolor: alpha(c, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: c, flexShrink: 0 }}>
                                                                        {TYPE_ICONS[env.envelopeType]}
                                                                    </Box>
                                                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>
                                                                        {env.envelopeName}
                                                                    </Typography>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    {result.meetsTarget ? <CheckCircle size={11} color="#16a34a" /> : <AlertTriangle size={11} color="#dc2626" />}
                                                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: result.meetsTarget ? '#15803d' : '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
                                                                        {result.projectedDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                                                                <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>{fmt(env.currentAmount)} / {fmt(env.targetAmount)}</Typography>
                                                                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: c }}>{fmt(entry.monthlyAlloc)}/mo</Typography>
                                                            </Box>
                                                            <LinearProgress variant="determinate" value={pct}
                                                                            sx={{ height: 4, borderRadius: 2, bgcolor: alpha(c, 0.1), '& .MuiLinearProgress-bar': { bgcolor: c, borderRadius: 2 } }} />
                                                        </Box>
                                                    );
                                                })}
                                                <Box sx={{ px: 2.5, py: 1.75, bgcolor: alpha(MAROON, 0.04), borderTop: `1px solid ${alpha(MAROON, 0.12)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: MAROON }}>Total Monthly</Typography>
                                                    <Typography sx={{ fontSize: '0.92rem', fontWeight: 900, color: MAROON, fontVariantNumeric: 'tabular-nums' }}>{fmt(planAllocated)}</Typography>
                                                </Box>
                                                <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1, borderTop: '1px solid #f0f0f0' }}>
                                                    <Info size={12} color="#bbb" style={{ marginTop: 2, flexShrink: 0 }} />
                                                    <Typography sx={{ fontSize: '0.65rem', color: '#bbb', lineHeight: 1.5 }}>
                                                        Click "Apply Plan" in the header to save these allocations. Lock individual rows to protect them from auto-rebalancing.
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Grow>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grow>
                )}
            </Container>

            <CreateEnvelopeDialog open={createOpen} onClose={() => setCreateOpen(false)}
                                  onSubmit={async data => { console.log('New envelope:', data); setCreateOpen(false); }} />

            <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackOpen(false)} severity={snackSev} sx={{ width: '100%', borderRadius: 2 }}>{snackMsg}</Alert>
            </Snackbar>
        </Box>
    );
};

export default BudgetEnvelopesPage;

// import React, { useEffect, useMemo, useState } from 'react';
// import {
//     alpha, Box, Button, Card, Chip, CircularProgress, Container,
//     Dialog, Divider, Grid, Grow, IconButton, LinearProgress,
//     Skeleton, Snackbar, Alert, Stack, Typography,
// } from '@mui/material';
// import {
//     ChevronLeft, ChevronRight, Plus, Target, Wallet,
//     TrendingUp, CheckCircle, PauseCircle, XCircle,
//     PiggyBank, Calendar, Flame, MoreHorizontal,
//     ArrowUpRight, Clock, Layers,
// } from 'lucide-react';
// import Sidebar from './Sidebar';
// import CreateEnvelopeDialog from "./CreateEnvelopeDialog";
// import EnvelopePriorityPlanner from './EnvelopePriorityPlanner';
//
// // ── Design tokens (matching existing pages) ────────────────────────────────
// const MAROON      = '#6b1a1a';
// const MAROON_DARK = '#4a1010';
//
// // ── Envelope type colours ──────────────────────────────────────────────────
// const ENVELOPE_COLORS: Record<string, string> = {
//     SAVINGS:   '#0284c7',
//     PAYOFF:    '#dc2626',
//     PURCHASE:  '#7c3aed',
//     EMERGENCY: '#d97706',
// };
//
// const ENVELOPE_TYPE_LABELS: Record<string, string> = {
//     SAVINGS:   'Savings',
//     PAYOFF:    'Pay-Off',
//     PURCHASE:  'Purchase',
//     EMERGENCY: 'Emergency',
// };
//
// const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
//     ACTIVE:    { label: 'Active',    color: '#16a34a', icon: <TrendingUp    size={11} /> },
//     COMPLETED: { label: 'Completed', color: '#0284c7', icon: <CheckCircle   size={11} /> },
//     PAUSED:    { label: 'Paused',    color: '#d97706', icon: <PauseCircle   size={11} /> },
//     CANCELLED: { label: 'Cancelled', color: '#94a3b8', icon: <XCircle       size={11} /> },
// };
//
// // ── Types ──────────────────────────────────────────────────────────────────
// export interface BudgetEnvelope {
//     id: number;
//     envelopeName: string;
//     envelopeType: 'SAVINGS' | 'PAYOFF' | 'PURCHASE' | 'EMERGENCY';
//     description?: string;
//     targetAmount: number;
//     allocatedAmount: number;
//     currentAmount: number;
//     remainingAmount: number;
//     contributionFrequency?: string;
//     startDate: string;
//     targetDate?: string;
//     status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
//     priority: number;
// }
//
// export interface EnvelopeContribution {
//     id: number;
//     envelopeId: number;
//     amount: number;
//     contributedAt: string;
//     note?: string;
// }
//
// // ── Mock data ──────────────────────────────────────────────────────────────
// const MOCK_ENVELOPES: BudgetEnvelope[] = [
//     { id: 1, envelopeName: 'Car Repair Fund',    envelopeType: 'EMERGENCY', description: 'Set aside for unexpected car repairs', targetAmount: 1500, allocatedAmount: 200, currentAmount: 875,  remainingAmount: 625,  contributionFrequency: 'MONTHLY', startDate: '2026-01-01', targetDate: '2026-09-01', status: 'ACTIVE',    priority: 1 },
//     { id: 2, envelopeName: 'Pay Off TV',         envelopeType: 'PAYOFF',    description: 'Samsung 65" - 0% APR ends Oct',        targetAmount: 899,  allocatedAmount: 150, currentAmount: 450,  remainingAmount: 449,  contributionFrequency: 'MONTHLY', startDate: '2026-01-01', targetDate: '2026-10-01', status: 'ACTIVE',    priority: 2 },
//     { id: 3, envelopeName: 'Vacation Fund',      envelopeType: 'SAVINGS',   description: 'Summer trip to Colorado',              targetAmount: 3000, allocatedAmount: 300, currentAmount: 2700, remainingAmount: 300,  contributionFrequency: 'MONTHLY', startDate: '2025-09-01', targetDate: '2026-07-01', status: 'ACTIVE',    priority: 3 },
//     { id: 4, envelopeName: 'New Laptop',         envelopeType: 'PURCHASE',  description: 'MacBook Pro M4',                       targetAmount: 2500, allocatedAmount: 250, currentAmount: 2500, remainingAmount: 0,    contributionFrequency: 'MONTHLY', startDate: '2025-06-01', targetDate: '2026-03-01', status: 'COMPLETED', priority: 4 },
//     { id: 5, envelopeName: 'Holiday Gifts',      envelopeType: 'SAVINGS',   description: 'Christmas & holiday shopping',         targetAmount: 800,  allocatedAmount: 100, currentAmount: 200,  remainingAmount: 600,  contributionFrequency: 'MONTHLY', startDate: '2026-02-01', targetDate: '2026-12-01', status: 'ACTIVE',    priority: 5 },
//     { id: 6, envelopeName: 'Home Maintenance',   envelopeType: 'EMERGENCY', description: 'HVAC, plumbing, general repairs',      targetAmount: 2000, allocatedAmount: 150, currentAmount: 550,  remainingAmount: 1450, contributionFrequency: 'MONTHLY', startDate: '2026-01-01',                             status: 'PAUSED',    priority: 6 },
// ];
//
// const MOCK_CONTRIBUTIONS: EnvelopeContribution[] = [
//     { id: 1,  envelopeId: 1, amount: 200, contributedAt: '2026-04-01', note: 'April contribution' },
//     { id: 2,  envelopeId: 1, amount: 200, contributedAt: '2026-03-01', note: 'March contribution' },
//     { id: 3,  envelopeId: 1, amount: 200, contributedAt: '2026-02-01', note: 'February contribution' },
//     { id: 4,  envelopeId: 1, amount: 175, contributedAt: '2026-01-01', note: 'January contribution' },
//     { id: 5,  envelopeId: 2, amount: 150, contributedAt: '2026-04-01' },
//     { id: 6,  envelopeId: 2, amount: 150, contributedAt: '2026-03-01' },
//     { id: 7,  envelopeId: 2, amount: 150, contributedAt: '2026-02-01' },
//     { id: 8,  envelopeId: 3, amount: 300, contributedAt: '2026-04-01', note: 'Tax refund boost' },
//     { id: 9,  envelopeId: 3, amount: 300, contributedAt: '2026-03-01' },
//     { id: 10, envelopeId: 5, amount: 100, contributedAt: '2026-04-01' },
//     { id: 11, envelopeId: 5, amount: 100, contributedAt: '2026-03-01' },
// ];
//
// // ── Helpers ────────────────────────────────────────────────────────────────
// const fmt = (n: number) =>
//     `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
//
// function daysUntil(dateStr?: string): number | null {
//     if (!dateStr) return null;
//     const diff = new Date(dateStr).getTime() - new Date().getTime();
//     return Math.ceil(diff / (1000 * 60 * 60 * 24));
// }
//
// function progressPct(current: number, target: number) {
//     if (target <= 0) return 100;
//     return Math.min((current / target) * 100, 100);
// }
//
// // ── Sub-components ─────────────────────────────────────────────────────────
//
// /** Panel header — identical to Dashboard/Budget pages */
// const PanelHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
//     <Box sx={{
//         background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 50%, #5a1515 100%)`,
//         px: 3, py: 2, position: 'relative', overflow: 'hidden',
//     }}>
//         <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
//         <Box sx={{ position: 'absolute', bottom: -20, right: 50, width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative' }}>
//             <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                 {icon}
//             </Box>
//             <Box>
//                 <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>{title}</Typography>
//                 <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>{subtitle}</Typography>
//             </Box>
//         </Box>
//     </Box>
// );
//
// /** Single envelope card */
// const EnvelopeCard: React.FC<{
//     envelope: BudgetEnvelope;
//     animateIn: boolean;
//     timeout: number;
//     onClick: () => void;
// }> = ({ envelope, animateIn, timeout, onClick }) => {
//     const pct       = progressPct(envelope.currentAmount, envelope.targetAmount);
//     const color     = ENVELOPE_COLORS[envelope.envelopeType] ?? MAROON;
//     const status    = STATUS_META[envelope.status];
//     const days      = daysUntil(envelope.targetDate);
//     const isUrgent  = days !== null && days <= 60 && envelope.status === 'ACTIVE';
//
//     return (
//         <Grow in={animateIn} timeout={timeout}>
//             <Box
//                 onClick={onClick}
//                 sx={{
//                     background: '#fff',
//                     borderRadius: '12px',
//                     borderTop: `3px solid ${color}`,
//                     border: `1px solid ${alpha(color, 0.2)}`,
//                     borderTopWidth: 3,
//                     boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
//                     p: 2.5,
//                     cursor: 'pointer',
//                     transition: 'box-shadow 0.2s, transform 0.15s',
//                     '&:hover': {
//                         boxShadow: `0 6px 24px ${alpha(color, 0.18)}`,
//                         transform: 'translateY(-2px)',
//                     },
//                     position: 'relative',
//                     overflow: 'hidden',
//                 }}
//             >
//                 {/* Completed watermark */}
//                 {envelope.status === 'COMPLETED' && (
//                     <Box sx={{
//                         position: 'absolute', top: 8, right: 8,
//                         width: 28, height: 28, borderRadius: '50%',
//                         bgcolor: alpha('#16a34a', 0.1),
//                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                     }}>
//                         <CheckCircle size={16} color="#16a34a" />
//                     </Box>
//                 )}
//
//                 {/* Header row */}
//                 <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                         <Box sx={{ width: 34, height: 34, borderRadius: '9px', bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                             {envelope.envelopeType === 'SAVINGS'   && <PiggyBank   size={16} color={color} />}
//                             {envelope.envelopeType === 'PAYOFF'    && <XCircle     size={16} color={color} />}
//                             {envelope.envelopeType === 'PURCHASE'  && <Wallet      size={16} color={color} />}
//                             {envelope.envelopeType === 'EMERGENCY' && <Flame       size={16} color={color} />}
//                         </Box>
//                         <Box>
//                             <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#111', lineHeight: 1.2 }}>
//                                 {envelope.envelopeName}
//                             </Typography>
//                             <Typography sx={{ fontSize: '0.65rem', color: '#888', mt: 0.1 }}>
//                                 {envelope.description}
//                             </Typography>
//                         </Box>
//                     </Box>
//                 </Box>
//
//                 {/* Chips */}
//                 <Box sx={{ display: 'flex', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
//                     <Chip size="small" label={ENVELOPE_TYPE_LABELS[envelope.envelopeType]}
//                           sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(color, 0.1), color }} />
//                     <Chip size="small"
//                           icon={<Box sx={{ display: 'flex', alignItems: 'center', color: status.color, ml: 0.5 }}>{status.icon}</Box>}
//                           label={status.label}
//                           sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(status.color, 0.1), color: status.color,
//                               '& .MuiChip-icon': { ml: '4px', mr: '-2px' } }} />
//                     {isUrgent && (
//                         <Chip size="small" label={`${days}d left`}
//                               icon={<Clock size={9} />}
//                               sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha('#d97706', 0.1), color: '#d97706',
//                                   '& .MuiChip-icon': { ml: '4px', mr: '-2px', color: '#d97706' } }} />
//                     )}
//                 </Box>
//
//                 {/* Progress */}
//                 <Box sx={{ mb: 1.5 }}>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
//                         <Typography sx={{ fontSize: '0.72rem', color: '#555', fontWeight: 600 }}>
//                             {fmt(envelope.currentAmount)} saved
//                         </Typography>
//                         <Typography sx={{ fontSize: '0.72rem', color: '#555', fontWeight: 700 }}>
//                             {pct.toFixed(0)}%
//                         </Typography>
//                     </Box>
//                     <LinearProgress
//                         variant="determinate"
//                         value={pct}
//                         sx={{
//                             height: 6, borderRadius: 3,
//                             bgcolor: alpha(color, 0.12),
//                             '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
//                         }}
//                     />
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
//                         <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>Goal: {fmt(envelope.targetAmount)}</Typography>
//                         {envelope.remainingAmount > 0
//                             ? <Typography sx={{ fontSize: '0.62rem', color: color, fontWeight: 700 }}>{fmt(envelope.remainingAmount)} to go</Typography>
//                             : <Typography sx={{ fontSize: '0.62rem', color: '#16a34a', fontWeight: 700 }}>Goal reached! 🎉</Typography>
//                         }
//                     </Box>
//                 </Box>
//
//                 {/* Footer */}
//                 <Divider sx={{ mb: 1.25, borderColor: alpha(color, 0.1) }} />
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                         <Calendar size={11} color="#aaa" />
//                         <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>
//                             {envelope.contributionFrequency
//                                 ? `${envelope.contributionFrequency.charAt(0) + envelope.contributionFrequency.slice(1).toLowerCase()} · ${fmt(envelope.allocatedAmount)}`
//                                 : fmt(envelope.allocatedAmount)}
//                         </Typography>
//                     </Box>
//                     {envelope.targetDate && (
//                         <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>
//                             Target: {new Date(envelope.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
//                         </Typography>
//                     )}
//                 </Box>
//             </Box>
//         </Grow>
//     );
// };
//
// /** Contribution history row */
// const ContributionRow: React.FC<{ c: EnvelopeContribution; color: string }> = ({ c, color }) => (
//     <Box sx={{
//         display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//         py: 1, borderBottom: `1px solid ${alpha('#000', 0.05)}`,
//         '&:last-child': { borderBottom: 'none' },
//     }}>
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
//             <Box sx={{ width: 28, height: 28, borderRadius: '7px', bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                 <ArrowUpRight size={13} color={color} />
//             </Box>
//             <Box>
//                 <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#111' }}>
//                     {c.note || 'Contribution'}
//                 </Typography>
//                 <Typography sx={{ fontSize: '0.62rem', color: '#888' }}>
//                     {new Date(c.contributedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
//                 </Typography>
//             </Box>
//         </Box>
//         <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color, fontVariantNumeric: 'tabular-nums' }}>
//             +{fmt(c.amount)}
//         </Typography>
//     </Box>
// );
//
// // ── Main Page ──────────────────────────────────────────────────────────────
// const BudgetEnvelopesPage: React.FC = () => {
//     const [animateIn,      setAnimateIn]      = useState(false);
//     const [isLoading,      setIsLoading]      = useState(false);
//     const [envelopes,      setEnvelopes]      = useState<BudgetEnvelope[]>([]);
//     const [contributions,  setContributions]  = useState<EnvelopeContribution[]>([]);
//     const [selectedId,     setSelectedId]     = useState<number | null>(null);
//     const [filterStatus,   setFilterStatus]   = useState<string>('ALL');
//     const [filterType,     setFilterType]     = useState<string>('ALL');
//     const [snackOpen,      setSnackOpen]      = useState(false);
//     const [snackMsg,       setSnackMsg]       = useState('');
//     const [snackSev,       setSnackSev]       = useState<'success'|'error'|'info'|'warning'>('success');
//     const [createOpen, setCreateOpen] = useState<boolean>(false);
//     const [plannerOpen, setPlannerOpen] = useState<boolean>(false);
//     useEffect(() => {
//         document.title = 'Envelopes';
//         setTimeout(() => setAnimateIn(true), 100);
//
//         // Simulate fetch
//         setIsLoading(true);
//         setTimeout(() => {
//             setEnvelopes(MOCK_ENVELOPES);
//             setContributions(MOCK_CONTRIBUTIONS);
//             setIsLoading(false);
//         }, 600);
//
//         return () => { document.title = 'BudgetBuddy'; };
//     }, []);
//
//     const selectedEnvelope = useMemo(
//         () => envelopes.find(e => e.id === selectedId) ?? null,
//         [envelopes, selectedId]
//     );
//
//     const selectedContributions = useMemo(
//         () => contributions.filter(c => c.envelopeId === selectedId),
//         [contributions, selectedId]
//     );
//
//     const filtered = useMemo(() => {
//         return envelopes.filter(e => {
//             const statusOk = filterStatus === 'ALL' || e.status === filterStatus;
//             const typeOk   = filterType   === 'ALL' || e.envelopeType === filterType;
//             return statusOk && typeOk;
//         });
//     }, [envelopes, filterStatus, filterType]);
//
//     // ── Summary stats ──────────────────────────────────────────────────────
//     const stats = useMemo(() => {
//         const active = envelopes.filter(e => e.status === 'ACTIVE');
//         return {
//             totalEnvelopes:  active.length,
//             totalAllocated:  active.reduce((s, e) => s + e.allocatedAmount, 0),
//             totalSaved:      active.reduce((s, e) => s + e.currentAmount,   0),
//             totalTarget:     active.reduce((s, e) => s + e.targetAmount,    0),
//             completed:       envelopes.filter(e => e.status === 'COMPLETED').length,
//         };
//     }, [envelopes]);
//
//     const overallPct = stats.totalTarget > 0
//         ? Math.min((stats.totalSaved / stats.totalTarget) * 100, 100)
//         : 0;
//
//     const filterBtn = (label: string, value: string, current: string, setter: (v: string) => void) => (
//         <Button
//             key={value}
//             size="small"
//             onClick={() => setter(value)}
//             variant={current === value ? 'contained' : 'outlined'}
//             sx={{
//                 borderRadius: '6px', textTransform: 'none',
//                 fontWeight: 600, fontSize: '0.72rem',
//                 ...(current === value
//                         ? { bgcolor: MAROON, color: '#fff', borderColor: MAROON, '&:hover': { bgcolor: MAROON_DARK } }
//                         : { borderColor: '#d5d5d5', color: '#555', bgcolor: '#fff',
//                             '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: alpha(MAROON, 0.04) } }
//                 ),
//             }}
//         >
//             {label}
//         </Button>
//     );
//
//     return (
//         <Box sx={{ maxWidth: 'calc(100% - 240px)', ml: '240px', minHeight: '100vh', background: '#f0f2f5' }}>
//             <Sidebar />
//
//             {isLoading && (
//                 <Box sx={{
//                     position: 'fixed', inset: 0, bgcolor: 'rgba(255,255,255,0.92)',
//                     backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column',
//                     alignItems: 'center', justifyContent: 'center', zIndex: 9999,
//                 }}>
//                     <CircularProgress size={52} thickness={4} sx={{ color: MAROON, mb: 2.5 }} />
//                     <Typography variant="h6" sx={{ fontWeight: 700, color: '#111', mb: 0.5 }}>Loading Envelopes</Typography>
//                     <Typography variant="body2" color="text.secondary">Fetching your savings goals…</Typography>
//                 </Box>
//             )}
//
//             <Container maxWidth="xl" sx={{ py: 4 }}>
//
//                 {/* ── Header ──────────────────────────────────────────────── */}
//                 <Grow in={animateIn} timeout={400}>
//                     <Box sx={{
//                         display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//                         mb: 4, flexDirection: { xs: 'column', sm: 'row' },
//                         textAlign: { xs: 'center', sm: 'left' }, gap: 2,
//                     }}>
//                         <Box>
//                             <Box sx={{ width: 28, height: 3, background: MAROON, borderRadius: '2px', mb: 0.75 }} />
//                             <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#111', letterSpacing: '-0.025em' }}>
//                                 Budget Envelopes
//                             </Typography>
//                             <Typography variant="subtitle1" sx={{ color: '#888', mt: 0.5 }}>
//                                 Dedicated funds for your short- and medium-term goals
//                             </Typography>
//                         </Box>
//                         <Button
//                             variant="contained"
//                             startIcon={<Plus size={15} />}
//                             sx={{
//                                 borderRadius: '8px', textTransform: 'none',
//                                 fontWeight: 700, fontSize: '0.82rem',
//                                 bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK },
//                                 px: 2.5, py: 1,
//                             }}
//                             onClick={() => {
//                                 setCreateOpen(true);
//                             }}
//                         >
//                             New Envelope
//                         </Button>
//                     </Box>
//                 </Grow>
//
//                 {/* ── Summary cards ───────────────────────────────────────── */}
//                 <Grow in={animateIn} timeout={600}>
//                     <Grid container spacing={2.5} sx={{ mb: 4 }}>
//
//                         {/* Active Envelopes */}
//                         {(() => {
//                             const color = MAROON;
//                             return (
//                                 <Grid item xs={12} sm={6} md={3}>
//                                     <Box sx={{ background: '#f0f4ff', borderRadius: '10px', borderTop: `3px solid ${color}`, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', p: 2.5, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' } }}>
//                                         <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5a5a7a', fontWeight: 700, mb: 1 }}>Active Envelopes</Typography>
//                                         {isLoading ? <Skeleton variant="text" width="60%" height={42} /> :
//                                             <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e1e2e', lineHeight: 1, mb: 0.5 }}>{stats.totalEnvelopes}</Typography>}
//                                         <LinearProgress variant="determinate" value={100} sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(color, 0.15), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 } }} />
//                                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                                             <Typography sx={{ fontSize: '0.72rem', color: '#5a5a7a' }}>{stats.completed} completed</Typography>
//                                             <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: alpha(color, 0.1), color, fontSize: '0.65rem', fontWeight: 700 }}>
//                                                 <Layers size={10} /> All time
//                                             </Box>
//                                         </Box>
//                                     </Box>
//                                 </Grid>
//                             );
//                         })()}
//
//                         {/* Monthly Allocated */}
//                         {(() => {
//                             const color = '#7c3aed';
//                             return (
//                                 <Grid item xs={12} sm={6} md={3}>
//                                     <Box sx={{ background: '#faf5ff', borderRadius: '10px', borderTop: `3px solid ${color}`, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', p: 2.5, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' } }}>
//                                         <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5a4070', fontWeight: 700, mb: 1 }}>Monthly Allocated</Typography>
//                                         {isLoading ? <Skeleton variant="text" width="70%" height={42} /> :
//                                             <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: '#2e1065', lineHeight: 1, mb: 0.5 }}>{fmt(stats.totalAllocated)}</Typography>}
//                                         <LinearProgress variant="determinate" value={100} sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(color, 0.15), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 } }} />
//                                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                                             <Typography sx={{ fontSize: '0.72rem', color: '#5a4070' }}>across {stats.totalEnvelopes} envelopes</Typography>
//                                             <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: alpha(color, 0.1), color, fontSize: '0.65rem', fontWeight: 700 }}>
//                                                 <Calendar size={10} /> /month
//                                             </Box>
//                                         </Box>
//                                     </Box>
//                                 </Grid>
//                             );
//                         })()}
//
//                         {/* Total Saved */}
//                         {(() => {
//                             const color = '#16a34a';
//                             return (
//                                 <Grid item xs={12} sm={6} md={3}>
//                                     <Box sx={{ background: '#f0fdf4', borderRadius: '10px', borderTop: `3px solid ${color}`, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', p: 2.5, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' } }}>
//                                         <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4a7060', fontWeight: 700, mb: 1 }}>Total Saved</Typography>
//                                         {isLoading ? <Skeleton variant="text" width="70%" height={42} /> :
//                                             <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: '#14532d', lineHeight: 1, mb: 0.5 }}>{fmt(stats.totalSaved)}</Typography>}
//                                         <LinearProgress variant="determinate" value={overallPct} sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(color, 0.15), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 } }} />
//                                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                                             <Typography sx={{ fontSize: '0.72rem', color: '#4a7060' }}>{overallPct.toFixed(0)}% of all targets</Typography>
//                                             <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: alpha(color, 0.1), color, fontSize: '0.65rem', fontWeight: 700 }}>
//                                                 <TrendingUp size={10} /> progress
//                                             </Box>
//                                         </Box>
//                                     </Box>
//                                 </Grid>
//                             );
//                         })()}
//
//                         {/* Total Target */}
//                         {(() => {
//                             const color = '#0284c7';
//                             return (
//                                 <Grid item xs={12} sm={6} md={3}>
//                                     <Box sx={{ background: '#f0f9ff', borderRadius: '10px', borderTop: `3px solid ${color}`, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', p: 2.5, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' } }}>
//                                         <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#3a6070', fontWeight: 700, mb: 1 }}>Total Target</Typography>
//                                         {isLoading ? <Skeleton variant="text" width="70%" height={42} /> :
//                                             <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: '#0c4a6e', lineHeight: 1, mb: 0.5 }}>{fmt(stats.totalTarget)}</Typography>}
//                                         <LinearProgress variant="determinate" value={100} sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(color, 0.15), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 } }} />
//                                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                                             <Typography sx={{ fontSize: '0.72rem', color: '#3a6070' }}>{fmt(stats.totalTarget - stats.totalSaved)} remaining</Typography>
//                                             <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: alpha(color, 0.1), color, fontSize: '0.65rem', fontWeight: 700 }}>
//                                                 <Target size={10} /> goal
//                                             </Box>
//                                         </Box>
//                                     </Box>
//                                 </Grid>
//                             );
//                         })()}
//
//                     </Grid>
//                 </Grow>
//
//                 {/* ── Filters ─────────────────────────────────────────────── */}
//                 <Grow in={animateIn} timeout={700}>
//                     <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
//                         <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', mr: 0.5 }}>Status:</Typography>
//                         {['ALL','ACTIVE','PAUSED','COMPLETED','CANCELLED'].map(v =>
//                             filterBtn(v === 'ALL' ? 'All' : STATUS_META[v]?.label ?? v, v, filterStatus, setFilterStatus)
//                         )}
//                         <Box sx={{ mx: 1, width: 1, height: 20, bgcolor: '#ddd' }} />
//                         <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', mr: 0.5 }}>Type:</Typography>
//                         {['ALL','SAVINGS','PAYOFF','PURCHASE','EMERGENCY'].map(v =>
//                             filterBtn(v === 'ALL' ? 'All' : ENVELOPE_TYPE_LABELS[v], v, filterType, setFilterType)
//                         )}
//                     </Box>
//                 </Grow>
//
//                 {/* ── Main grid ───────────────────────────────────────────── */}
//                 <Grid container spacing={3}>
//
//                     {/* ── Envelope cards (left 8 cols) ─────────────────────── */}
//                     <Grid item xs={12} lg={8}>
//                         {filtered.length === 0 && !isLoading ? (
//                             <Grow in={animateIn} timeout={800}>
//                                 <Box sx={{
//                                     borderRadius: '16px', overflow: 'hidden',
//                                     border: `1px solid ${alpha(MAROON, 0.15)}`,
//                                     boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}`,
//                                 }}>
//                                     <PanelHeader icon={<Wallet size={15} color="white" />} title="Envelopes" subtitle="Your goal-based savings" />
//                                     <Box sx={{ bgcolor: '#fff', p: 5, textAlign: 'center' }}>
//                                         <PiggyBank size={40} color={alpha(MAROON, 0.25)} />
//                                         <Typography sx={{ mt: 2, fontWeight: 700, color: '#555' }}>No envelopes match your filters</Typography>
//                                         <Typography sx={{ mt: 0.5, fontSize: '0.82rem', color: '#aaa' }}>Try adjusting the status or type filter above.</Typography>
//                                     </Box>
//                                 </Box>
//                             </Grow>
//                         ) : (
//                             <Box sx={{
//                                 borderRadius: '16px', overflow: 'hidden',
//                                 border: `1px solid ${alpha(MAROON, 0.15)}`,
//                                 boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}`,
//                             }}>
//                                 <PanelHeader
//                                     icon={<Wallet size={15} color="white" />}
//                                     title="Your Envelopes"
//                                     subtitle={`${filtered.length} envelope${filtered.length !== 1 ? 's' : ''} — tap one to view details`}
//                                 />
//                                 <Box sx={{ bgcolor: '#fff', p: 3 }}>
//                                     <Grid container spacing={2}>
//                                         {isLoading
//                                             ? Array.from({ length: 4 }).map((_, i) => (
//                                                 <Grid item xs={12} sm={6} key={i}>
//                                                     <Skeleton variant="rounded" height={180} sx={{ borderRadius: '12px' }} />
//                                                 </Grid>
//                                             ))
//                                             : filtered.map((env, i) => (
//                                                 <Grid item xs={12} sm={6} key={env.id}>
//                                                     <EnvelopeCard
//                                                         envelope={env}
//                                                         animateIn={animateIn}
//                                                         timeout={700 + i * 80}
//                                                         onClick={() => setSelectedId(env.id === selectedId ? null : env.id)}
//                                                     />
//                                                 </Grid>
//                                             ))
//                                         }
//                                     </Grid>
//                                 </Box>
//                             </Box>
//                         )}
//                     </Grid>
//
//                     {/* ── Right panel: detail or overview ─────────────────── */}
//                     <Grid item xs={12} lg={4}>
//                         <Grow in={animateIn} timeout={800}>
//                             <Box sx={{ position: 'sticky', top: 24 }}>
//
//                                 {selectedEnvelope ? (
//                                     /* ── Detail panel ─────────────────────────── */
//                                     <Box sx={{
//                                         borderRadius: '16px', overflow: 'hidden',
//                                         border: `1px solid ${alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.25)}`,
//                                         boxShadow: `0 4px 24px ${alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.12)}`,
//                                     }}>
//                                         {/* Header uses envelope colour */}
//                                         <Box sx={{
//                                             background: `linear-gradient(135deg, ${alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.9)} 0%, ${ENVELOPE_COLORS[selectedEnvelope.envelopeType]} 100%)`,
//                                             px: 3, py: 2, position: 'relative', overflow: 'hidden',
//                                         }}>
//                                             <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
//                                             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                                                 <Box>
//                                                     <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
//                                                         {selectedEnvelope.envelopeName}
//                                                     </Typography>
//                                                     <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.75)', mt: 0.1 }}>
//                                                         {selectedEnvelope.description}
//                                                     </Typography>
//                                                 </Box>
//                                                 <IconButton size="small" onClick={() => setSelectedId(null)}
//                                                             sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
//                                                     <XCircle size={16} />
//                                                 </IconButton>
//                                             </Box>
//                                         </Box>
//
//                                         <Box sx={{ bgcolor: '#fff', p: 2.5 }}>
//                                             {/* Big progress ring via linear for consistency */}
//                                             <Box sx={{ textAlign: 'center', mb: 2.5 }}>
//                                                 <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, color: ENVELOPE_COLORS[selectedEnvelope.envelopeType], fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
//                                                     {fmt(selectedEnvelope.currentAmount)}
//                                                 </Typography>
//                                                 <Typography sx={{ fontSize: '0.72rem', color: '#888', mt: 0.4 }}>
//                                                     of {fmt(selectedEnvelope.targetAmount)} goal
//                                                 </Typography>
//                                                 <LinearProgress
//                                                     variant="determinate"
//                                                     value={progressPct(selectedEnvelope.currentAmount, selectedEnvelope.targetAmount)}
//                                                     sx={{
//                                                         mt: 1.5, height: 8, borderRadius: 4,
//                                                         bgcolor: alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.12),
//                                                         '& .MuiLinearProgress-bar': { bgcolor: ENVELOPE_COLORS[selectedEnvelope.envelopeType], borderRadius: 4 },
//                                                     }}
//                                                 />
//                                                 <Typography sx={{ fontSize: '0.72rem', color: ENVELOPE_COLORS[selectedEnvelope.envelopeType], fontWeight: 700, mt: 0.75 }}>
//                                                     {progressPct(selectedEnvelope.currentAmount, selectedEnvelope.targetAmount).toFixed(1)}% complete
//                                                 </Typography>
//                                             </Box>
//
//                                             <Divider sx={{ mb: 2 }} />
//
//                                             {/* Stats grid */}
//                                             <Grid container spacing={1.5} sx={{ mb: 2 }}>
//                                                 {[
//                                                     { label: 'Remaining',  value: fmt(selectedEnvelope.remainingAmount) },
//                                                     { label: 'Allocated',  value: `${fmt(selectedEnvelope.allocatedAmount)}/mo` },
//                                                     { label: 'Target Date', value: selectedEnvelope.targetDate ? new Date(selectedEnvelope.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
//                                                     { label: 'Days Left',  value: daysUntil(selectedEnvelope.targetDate) !== null ? `${daysUntil(selectedEnvelope.targetDate)}d` : '—' },
//                                                 ].map(({ label, value }) => (
//                                                     <Grid item xs={6} key={label}>
//                                                         <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
//                                                             <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', mb: 0.3 }}>{label}</Typography>
//                                                             <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
//                                                         </Box>
//                                                     </Grid>
//                                                 ))}
//                                             </Grid>
//
//                                             {/* Actions */}
//                                             <Stack spacing={1} sx={{ mb: 2.5 }}>
//                                                 <Button fullWidth variant="contained"
//                                                         startIcon={<Plus size={14} />}
//                                                         sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', bgcolor: ENVELOPE_COLORS[selectedEnvelope.envelopeType], '&:hover': { bgcolor: alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.85) } }}
//                                                         onClick={() => { setSnackMsg('Add contribution — coming soon!'); setSnackSev('info'); setSnackOpen(true); }}>
//                                                     Add Contribution
//                                                 </Button>
//                                                 <Box sx={{ display: 'flex', gap: 1 }}>
//                                                     <Button fullWidth variant="outlined" size="small"
//                                                             startIcon={<MoreHorizontal size={13} />}
//                                                             sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', borderColor: '#d5d5d5', color: '#555', '&:hover': { borderColor: MAROON, color: MAROON } }}
//                                                             onClick={() => { setSnackMsg('Edit envelope — coming soon!'); setSnackSev('info'); setSnackOpen(true); }}>
//                                                         Edit
//                                                     </Button>
//                                                     {selectedEnvelope.status === 'ACTIVE' && (
//                                                         <Button fullWidth variant="outlined" size="small"
//                                                                 startIcon={<PauseCircle size={13} />}
//                                                                 sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', borderColor: '#d5d5d5', color: '#d97706', '&:hover': { borderColor: '#d97706', bgcolor: alpha('#d97706', 0.04) } }}
//                                                                 onClick={() => { setSnackMsg('Pause envelope — coming soon!'); setSnackSev('info'); setSnackOpen(true); }}>
//                                                             Pause
//                                                         </Button>
//                                                     )}
//                                                 </Box>
//                                             </Stack>
//
//                                             {/* Contribution history */}
//                                             <Divider sx={{ mb: 1.5 }} />
//                                             <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.25 }}>
//                                                 Contribution History
//                                             </Typography>
//                                             {selectedContributions.length === 0 ? (
//                                                 <Typography sx={{ fontSize: '0.75rem', color: '#bbb', textAlign: 'center', py: 2 }}>No contributions yet</Typography>
//                                             ) : (
//                                                 <Box>
//                                                     {selectedContributions.map(c => (
//                                                         <ContributionRow key={c.id} c={c} color={ENVELOPE_COLORS[selectedEnvelope.envelopeType]} />
//                                                     ))}
//                                                     <Box sx={{ mt: 1.5, p: 1.25, borderRadius: '8px', bgcolor: alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.06), border: `1px solid ${alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.15)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                                         <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#333' }}>Total contributed</Typography>
//                                                         <Typography sx={{ fontWeight: 900, fontSize: '0.95rem', color: ENVELOPE_COLORS[selectedEnvelope.envelopeType], fontVariantNumeric: 'tabular-nums' }}>
//                                                             {fmt(selectedContributions.reduce((s, c) => s + c.amount, 0))}
//                                                         </Typography>
//                                                     </Box>
//                                                 </Box>
//                                             )}
//                                         </Box>
//                                     </Box>
//                                 ) : (
//                                     /* ── Overview panel when nothing is selected ─ */
//                                     <Box sx={{
//                                         borderRadius: '16px', overflow: 'hidden',
//                                         border: `1px solid ${alpha(MAROON, 0.15)}`,
//                                         boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}`,
//                                     }}>
//                                         <PanelHeader icon={<Target size={15} color="white" />} title="Quick Overview" subtitle="Tap any envelope card for details" />
//                                         <Box sx={{ bgcolor: '#fff', p: 2.5 }}>
//
//                                             {/* Priority order */}
//                                             <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.5 }}>
//                                                 By Priority
//                                             </Typography>
//                                             <Stack spacing={1.25}>
//                                                 {envelopes
//                                                     .filter(e => e.status === 'ACTIVE')
//                                                     .sort((a, b) => a.priority - b.priority)
//                                                     .map(env => {
//                                                         const color = ENVELOPE_COLORS[env.envelopeType];
//                                                         const pct   = progressPct(env.currentAmount, env.targetAmount);
//                                                         return (
//                                                             <Box key={env.id}
//                                                                  onClick={() => setSelectedId(env.id)}
//                                                                  sx={{
//                                                                      p: 1.5, borderRadius: '10px', cursor: 'pointer',
//                                                                      border: `1px solid ${alpha(color, 0.2)}`,
//                                                                      '&:hover': { bgcolor: alpha(color, 0.04), borderColor: alpha(color, 0.4) },
//                                                                      transition: 'all 0.15s',
//                                                                  }}>
//                                                                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
//                                                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                                                                         <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: color, flexShrink: 0 }} />
//                                                                         <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#111' }}>{env.envelopeName}</Typography>
//                                                                     </Box>
//                                                                     <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
//                                                                         {pct.toFixed(0)}%
//                                                                     </Typography>
//                                                                 </Box>
//                                                                 <LinearProgress variant="determinate" value={pct}
//                                                                                 sx={{ height: 4, borderRadius: 2, bgcolor: alpha(color, 0.12), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 } }} />
//                                                                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
//                                                                     <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>{fmt(env.currentAmount)}</Typography>
//                                                                     <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>{fmt(env.targetAmount)}</Typography>
//                                                                 </Box>
//                                                             </Box>
//                                                         );
//                                                     })}
//                                             </Stack>
//
//                                             <Divider sx={{ my: 2 }} />
//
//                                             {/* Upcoming target dates */}
//                                             <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.25 }}>
//                                                 Upcoming Deadlines
//                                             </Typography>
//                                             <Stack spacing={1}>
//                                                 {envelopes
//                                                     .filter(e => e.status === 'ACTIVE' && e.targetDate)
//                                                     .sort((a, b) => new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime())
//                                                     .slice(0, 3)
//                                                     .map(env => {
//                                                         const days  = daysUntil(env.targetDate)!;
//                                                         const color = days <= 60 ? '#d97706' : '#16a34a';
//                                                         return (
//                                                             <Box key={env.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75, borderBottom: `1px solid ${alpha('#000', 0.05)}`, '&:last-child': { borderBottom: 'none' } }}>
//                                                                 <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#333' }}>{env.envelopeName}</Typography>
//                                                                 <Chip size="small"
//                                                                       label={`${days}d`}
//                                                                       sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: alpha(color, 0.1), color }} />
//                                                             </Box>
//                                                         );
//                                                     })}
//                                             </Stack>
//                                         </Box>
//                                     </Box>
//                                 )}
//                             </Box>
//                         </Grow>
//                     </Grid>
//                 </Grid>
//             </Container>
//
//             <CreateEnvelopeDialog
//                 open={createOpen}
//                 onClose={() => setCreateOpen(false)}
//                 onSubmit={async (data) => {
//                     // call your service here
//                     console.log('New envelope:', data);
//                 }}
//             />
//             <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
//                 <Alert onClose={() => setSnackOpen(false)} severity={snackSev} sx={{ width: '100%', borderRadius: 2 }}>{snackMsg}</Alert>
//             </Snackbar>
//         </Box>
//     );
// };
//
// export default BudgetEnvelopesPage;