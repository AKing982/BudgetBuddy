import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    alpha, Box, Button, Chip, CircularProgress, Container,
    Divider, Grid, Grow, IconButton, InputAdornment,
    LinearProgress, Skeleton, Snackbar, Alert, Stack,
    TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
    Dialog, DialogContent, DialogActions,
    Tab, Tabs, Select, MenuItem, FormControl, InputLabel,
    Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import {
    Plus, Target, Wallet, TrendingUp, CheckCircle, PauseCircle,
    XCircle, PiggyBank, Calendar, Flame, MoreHorizontal,
    ArrowUpRight, Clock, Layers, BarChart2,
    ArrowUp, ArrowDown, AlertTriangle, Zap, RefreshCw, Info,
    ChevronLeft, ChevronRight, Lock, Unlock, Calculator, Sparkles,
    RefreshCcw, DollarSign, Settings2, CreditCard,
    TrendingDown, ChevronDown, ChevronUp, Lightbulb,
    LayoutList, GripVertical,
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Filler, Tooltip as ChartTooltip, Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import Sidebar from './Sidebar';
import CreateEnvelopeDialog from './CreateEnvelopeDialog';
import MultiEnvelopeDashboard from "./MultiEnvelopeDashboard";

ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Filler, ChartTooltip, Legend,
);

// ── Design tokens ─────────────────────────────────────────────────────────────
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

const FREQUENCY_OPTIONS = [
    { value: 'MONTHLY_1ST',  label: 'Monthly — on the 1st'  },
    { value: 'MONTHLY_15TH', label: 'Monthly — on the 15th' },
    { value: 'BIWEEKLY',     label: 'Bi-weekly'             },
    { value: 'WEEKLY',       label: 'Weekly'                },
];

const TL_MONTHS = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TL_START  = new Date('2026-05-01').getTime();
const TL_END    = new Date('2026-12-31').getTime();
const TL_SPAN   = TL_END - TL_START;

const SOURCE_OPTIONS = [
    { value: 'checking_4821', label: 'Checking ····4821' },
    { value: 'savings_9043',  label: 'Savings ····9043'  },
];

// ── Types ──────────────────────────────────────────────────────────────────────
export interface AutoRule {
    frequency: string;
    amount:    number;
    startDate: string;
    source:    string;
}

export interface PaymentPlan {
    originalBalance:  number;
    apr:              number;
    isDeferred:       boolean;
    deferredInterest: number;
    minPayment:       number;
    termMonths:       number;
}

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
    contributionMode: 'MANUAL' | 'AUTO';
    autoRule?: AutoRule;
    paymentPlan?: PaymentPlan;
    streakMonths?: number;
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

interface AffordabilityResult {
    envelopeId: number;
    suggested:  number;
    status:     'FULL' | 'PARTIAL' | 'SKIP';
}

interface AmortizationRow {
    month:      number;
    date:       string;
    payment:    number;
    principal:  number;
    interest:   number;
    balance:    number;
    status:     'PAID' | 'DUE' | 'UPCOMING' | 'FINAL';
}

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_ENVELOPES: BudgetEnvelope[] = [
    {
        id: 1, envelopeName: 'Car Repair Fund', envelopeType: 'EMERGENCY',
        description: 'Set aside for unexpected car repairs',
        targetAmount: 1500, allocatedAmount: 200, currentAmount: 875, remainingAmount: 625,
        contributionFrequency: 'MONTHLY', startDate: '2026-01-01', targetDate: '2026-09-01',
        status: 'ACTIVE', priority: 1, contributionMode: 'MANUAL', streakMonths: 5,
    },
    {
        id: 2, envelopeName: 'Pay Off TV', envelopeType: 'PAYOFF',
        description: 'Samsung 65" — 0% APR ends Oct',
        targetAmount: 899, allocatedAmount: 150, currentAmount: 450, remainingAmount: 449,
        contributionFrequency: 'MONTHLY', startDate: '2026-01-01', targetDate: '2026-10-01',
        status: 'ACTIVE', priority: 2, contributionMode: 'MANUAL', streakMonths: 3,
        paymentPlan: {
            originalBalance: 899, apr: 0, isDeferred: true,
            deferredInterest: 214, minPayment: 150, termMonths: 10,
        },
    },
    {
        id: 3, envelopeName: 'Vacation Fund', envelopeType: 'SAVINGS',
        description: 'Summer trip to Colorado',
        targetAmount: 3000, allocatedAmount: 300, currentAmount: 2700, remainingAmount: 300,
        contributionFrequency: 'MONTHLY', startDate: '2025-09-01', targetDate: '2026-07-01',
        status: 'ACTIVE', priority: 3, contributionMode: 'AUTO',
        autoRule: { frequency: 'MONTHLY_1ST', amount: 300, startDate: '2026-01-01', source: 'checking_4821' },
        streakMonths: 8,
    },
    {
        id: 4, envelopeName: 'New Laptop', envelopeType: 'PURCHASE',
        description: 'MacBook Pro M4',
        targetAmount: 2500, allocatedAmount: 250, currentAmount: 2500, remainingAmount: 0,
        contributionFrequency: 'MONTHLY', startDate: '2025-06-01', targetDate: '2026-03-01',
        status: 'COMPLETED', priority: 4, contributionMode: 'MANUAL',
    },
    {
        id: 5, envelopeName: 'Holiday Gifts', envelopeType: 'SAVINGS',
        description: 'Christmas & holiday shopping',
        targetAmount: 800, allocatedAmount: 100, currentAmount: 200, remainingAmount: 600,
        contributionFrequency: 'MONTHLY', startDate: '2026-02-01', targetDate: '2026-12-01',
        status: 'ACTIVE', priority: 5, contributionMode: 'MANUAL', streakMonths: 3,
    },
    {
        id: 6, envelopeName: 'Home Maintenance', envelopeType: 'EMERGENCY',
        description: 'HVAC, plumbing, general repairs',
        targetAmount: 2000, allocatedAmount: 150, currentAmount: 550, remainingAmount: 1450,
        contributionFrequency: 'MONTHLY', startDate: '2026-01-01',
        status: 'PAUSED', priority: 6, contributionMode: 'MANUAL',
    },
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

// ── Helpers ────────────────────────────────────────────────────────────────────
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
        (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()), 1,
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

function velocityDays(env: BudgetEnvelope): number | null {
    if (!env.targetDate) return null;
    const start  = new Date(env.startDate).getTime();
    const end    = new Date(env.targetDate).getTime();
    const now    = Date.now();
    const total  = end - start;
    if (total <= 0) return null;
    const elapsed     = now - start;
    const expectedPct = Math.min(elapsed / total, 1);
    const actualPct   = progressPct(env.currentAmount, env.targetAmount) / 100;
    const diffPct     = actualPct - expectedPct;
    const totalDays   = total / 86400000;
    return Math.round(diffPct * totalDays);
}

function requiredMonthly(env: BudgetEnvelope): number | null {
    if (!env.targetDate) return null;
    const months = monthsBetween(new Date(), new Date(env.targetDate));
    return Math.max(Math.ceil((env.remainingAmount / months) * 100) / 100, 0);
}

function avgContribution(contributions: EnvelopeContribution[], envelopeId: number): number | null {
    const c = contributions.filter(x => x.envelopeId === envelopeId);
    if (!c.length) return null;
    return Math.round(c.reduce((s, x) => s + x.amount, 0) / c.length * 100) / 100;
}

/**
 * Returns true when an envelope overlaps with the given calendar month.
 * - startDate must be on or before the last day of the month
 * - targetDate (if present) must be on or after the first day of the month
 */
function isEnvelopeActiveInMonth(env: BudgetEnvelope, monthStart: Date, monthEnd: Date): boolean {
    const start = new Date(env.startDate);
    if (start > monthEnd) return false;       // starts after this month
    if (!env.targetDate)  return true;        // open-ended — always active once started
    const end = new Date(env.targetDate);
    return end >= monthStart;                 // closed before this month started
}

/**
 * Sum of contributions made within a specific month for one envelope.
 */
function monthlyContributed(
    contributions: EnvelopeContribution[],
    envelopeId: number,
    monthStart: Date,
    monthEnd: Date,
): number {
    return contributions
        .filter(c => {
            if (c.envelopeId !== envelopeId) return false;
            const d = new Date(c.contributedAt);
            return d >= monthStart && d <= monthEnd;
        })
        .reduce((s, c) => s + c.amount, 0);
}

function buildAmortization(plan: PaymentPlan, paid: number, monthly: number): AmortizationRow[] {
    const rows: AmortizationRow[] = [];
    let balance = plan.originalBalance;
    const start = new Date('2026-02-01');
    let paidSoFar = 0;
    let m = 0;
    while (balance > 0.01 && m < 60) {
        const payment   = Math.min(monthly, balance);
        const interest  = plan.apr > 0 ? balance * (plan.apr / 100 / 12) : 0;
        const principal = payment - interest;
        balance         = Math.max(balance - principal, 0);
        paidSoFar      += payment;
        const date = addMonths(start, m);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        let status: AmortizationRow['status'] = 'UPCOMING';
        if (paidSoFar - payment < paid && paidSoFar <= paid) status = 'PAID';
        else if (paidSoFar - payment < paid) status = 'DUE';
        if (balance < 0.01) status = status === 'PAID' ? 'PAID' : 'FINAL';
        rows.push({
            month: m + 1,
            date:  dateStr,
            payment: Math.round(payment * 100) / 100,
            principal: Math.round(principal * 100) / 100,
            interest: Math.round(interest * 100) / 100,
            balance:  Math.round(balance * 100) / 100,
            status,
        });
        m++;
    }
    return rows;
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
        const sc      = scores.find(s => s.id === entry.envelopeId);
        const alloc   = total > 0 ? (sc!.score / total) * remaining : remaining / unlocked.length;
        const rounded = Math.round(alloc * 100) / 100;
        return { ...entry, monthlyAlloc: rounded, autoAlloc: rounded };
    });
}

function computeResults(entries: PlanEntry[], envelopes: BudgetEnvelope[]): PlanResult[] {
    const envMap = new Map(envelopes.map(e => [e.id, e]));
    return entries.map(entry => {
        const env         = envMap.get(entry.envelopeId)!;
        const remaining   = env.remainingAmount;
        const monthly     = entry.monthlyAlloc;
        const projDate    = projectedCompletion(remaining, monthly);
        const targetDate  = env.targetDate ? new Date(env.targetDate) : null;
        const meetsTarget = !targetDate || projDate <= targetDate;
        const monthsNeeded = monthly > 0 ? Math.ceil(remaining / monthly) : 999;
        const shortfall    = targetDate && !meetsTarget
            ? Math.round((projDate.getTime() - targetDate.getTime()) / 86400000) : 0;
        return { envelopeId: entry.envelopeId, monthlyAlloc: monthly, projectedDate: projDate, meetsTarget, monthsNeeded, shortfall };
    });
}

function computeAffordability(envelopes: BudgetEnvelope[], availableBalance: number): AffordabilityResult[] {
    let remaining = availableBalance;
    return [...envelopes].sort((a, b) => a.priority - b.priority).map(env => {
        const needed = Math.min(env.allocatedAmount, env.remainingAmount);
        if (remaining <= 0) return { envelopeId: env.id, suggested: 0, status: 'SKIP' as const };
        if (remaining >= needed) { remaining -= needed; return { envelopeId: env.id, suggested: needed, status: 'FULL' as const }; }
        const partial = Math.round(remaining * 100) / 100;
        remaining = 0;
        return { envelopeId: env.id, suggested: partial, status: 'PARTIAL' as const };
    });
}

// ── Shared panel header ────────────────────────────────────────────────────────
const PanelHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
    <Box sx={{ background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 50%, #5a1515 100%)`, px: 3, py: 2, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ position: 'absolute', bottom: -20, right: 50, width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative' }}>
            <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</Box>
            <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>{title}</Typography>
                <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>{subtitle}</Typography>
            </Box>
        </Box>
    </Box>
);

// ── Velocity stat chip ─────────────────────────────────────────────────────────
const VelocityChip: React.FC<{ days: number | null }> = ({ days }) => {
    if (days === null) return null;
    const isAhead  = days > 0;
    const isOnTrack = Math.abs(days) <= 3;
    const color = isOnTrack ? '#0284c7' : isAhead ? '#16a34a' : '#dc2626';
    const bg    = isOnTrack ? alpha('#0284c7', 0.1) : isAhead ? alpha('#16a34a', 0.1) : alpha('#dc2626', 0.1);
    const label = isOnTrack ? 'On track' : isAhead ? `${days}d ahead` : `${Math.abs(days)}d behind`;
    const Icon  = isAhead ? TrendingUp : isOnTrack ? TrendingUp : TrendingDown;
    return (
        <Chip size="small"
              icon={<Box sx={{ display: 'flex', alignItems: 'center', color, ml: 0.5 }}><Icon size={9} /></Box>}
              label={label}
              sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: bg, color, '& .MuiChip-icon': { ml: '4px', mr: '-2px' } }} />
    );
};

// ── Payment Plan Panel ─────────────────────────────────────────────────────────
const PaymentPlanPanel: React.FC<{
    envelope:      BudgetEnvelope;
    contributions: EnvelopeContribution[];
}> = ({ envelope, contributions }) => {
    const plan = envelope.paymentPlan!;
    const [extraPayment, setExtraPayment] = useState(30);
    const [showFullTable, setShowFullTable] = useState(false);
    const color = ENVELOPE_COLORS[envelope.envelopeType];

    const monthly       = envelope.allocatedAmount + extraPayment;
    const rows          = useMemo(() => buildAmortization(plan, envelope.currentAmount, monthly), [plan, envelope.currentAmount, monthly]);
    const baseRows      = useMemo(() => buildAmortization(plan, envelope.currentAmount, plan.minPayment), [plan, envelope.currentAmount]);
    const displayRows   = showFullTable ? rows : rows.slice(0, 6);

    const accelDate     = rows[rows.length - 1]?.date ?? '—';
    const baseDate      = baseRows[baseRows.length - 1]?.date ?? '—';
    const deadlineDays  = daysUntil(envelope.targetDate);
    const accelMonths   = rows.length;
    const clearsByDeadline = deadlineDays !== null && accelMonths <= Math.ceil((deadlineDays) / 30);

    const chartLabels = Array.from({ length: Math.max(baseRows.length, rows.length) }, (_, i) => {
        const d = addMonths(new Date('2026-02-01'), i);
        return d.toLocaleDateString('en-US', { month: 'short' });
    });
    const baseBalances = chartLabels.map((_, i) => baseRows[i]?.balance ?? 0);
    const accelBalances = chartLabels.map((_, i) => rows[i]?.balance ?? 0);

    const statusColor: Record<string, string> = {
        PAID: '#16a34a', DUE: '#d97706', UPCOMING: '#94a3b8', FINAL: '#16a34a',
    };
    const statusBg: Record<string, string> = {
        PAID: alpha('#16a34a', 0.1), DUE: alpha('#d97706', 0.1), UPCOMING: alpha('#94a3b8', 0.08), FINAL: alpha('#16a34a', 0.1),
    };

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
                            {clearsByDeadline ? `Saves ${fmt(plan.deferredInterest)} interest` : `Increase more to beat deadline`}
                        </Typography>
                    </Box>
                </Grid>
            </Grid>

            <Box sx={{ mb: 2, height: 120 }}>
                <Line
                    data={{
                        labels: chartLabels,
                        datasets: [
                            { label: 'Minimum', data: baseBalances, borderColor: '#94a3b8', borderWidth: 1.5, borderDash: [4, 3], pointRadius: 0, tension: 0.3, fill: false },
                            { label: 'Accelerated', data: accelBalances, borderColor: color, borderWidth: 2, pointRadius: 2, pointBackgroundColor: color, tension: 0.3, fill: false },
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
                                    <Chip size="small" label={row.status === 'FINAL' ? 'Final' : row.status.charAt(0) + row.status.slice(1).toLowerCase()}
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

// ── Charts panel ───────────────────────────────────────────────────────────────
const ChartsPanel: React.FC<{
    envelopes:     BudgetEnvelope[];
    contributions: EnvelopeContribution[];
}> = ({ envelopes, contributions }) => {
    const active = envelopes.filter(e => e.status === 'ACTIVE');
    const MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

    const contribByMonth = MONTHS.map((_, mi) => {
        const monthDate = addMonths(new Date('2025-11-01'), mi);
        const monthStr  = monthDate.toISOString().slice(0, 7);
        return contributions.filter(c => c.contributedAt.startsWith(monthStr)).reduce((s, c) => s + c.amount, 0);
    });
    const emergencyByMonth = MONTHS.map((_, mi) => {
        const monthDate = addMonths(new Date('2025-11-01'), mi);
        const monthStr  = monthDate.toISOString().slice(0, 7);
        return contributions.filter(c => c.contributedAt.startsWith(monthStr) && envelopes.find(e => e.id === c.envelopeId)?.envelopeType === 'EMERGENCY').reduce((s, c) => s + c.amount, 0);
    });
    const payoffByMonth = MONTHS.map((_, mi) => {
        const monthDate = addMonths(new Date('2025-11-01'), mi);
        const monthStr  = monthDate.toISOString().slice(0, 7);
        return contributions.filter(c => c.contributedAt.startsWith(monthStr) && envelopes.find(e => e.id === c.envelopeId)?.envelopeType === 'PAYOFF').reduce((s, c) => s + c.amount, 0);
    });
    const savingsByMonth = MONTHS.map((_, mi) => {
        const monthDate = addMonths(new Date('2025-11-01'), mi);
        const monthStr  = monthDate.toISOString().slice(0, 7);
        return contributions.filter(c => c.contributedAt.startsWith(monthStr) && envelopes.find(e => e.id === c.envelopeId)?.envelopeType === 'SAVINGS').reduce((s, c) => s + c.amount, 0);
    });

    const totalTarget  = active.reduce((s, e) => s + e.targetAmount, 0);
    const velLabels    = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const plannedData  = velLabels.map((_, i) => Math.round((totalTarget / 8) * (i + 1)));
    const actualData   = [750, 1620, 2590, 3540, 4430, 4775, null, null];

    const totalAlloc      = active.reduce((s, e) => s + e.allocatedAmount, 0);
    const monthlyBudget   = 1000;
    const unallocated     = Math.max(monthlyBudget - totalAlloc, 0);
    const donutLabels     = [...active.map(e => e.envelopeName), 'Unallocated'];
    const donutData       = [...active.map(e => e.allocatedAmount), unallocated];
    const donutColors     = [...active.map(e => ENVELOPE_COLORS[e.envelopeType]), '#e5e7eb'];

    const now = Date.now();
    const mayStart = new Date('2026-05-01').getTime();
    const decEnd   = new Date('2026-12-31').getTime();
    const span     = decEnd - mayStart;

    const avgMonthly = contribByMonth.filter(x => x > 0);
    const avgContrib  = avgMonthly.length ? Math.round(avgMonthly.reduce((s, v) => s + v, 0) / avgMonthly.length) : 0;
    const bestMonth   = Math.max(...contribByMonth);

    const gridOpts = { color: 'rgba(0,0,0,0.05)' };

    return (
        <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '2px', bgcolor: MAROON }} />
                <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: MAROON }}>
                    Portfolio analytics
                </Typography>
            </Box>

            <Grid container spacing={2.5}>
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
                                            {
                                                label: 'Actual', data: actualData, borderColor: MAROON, borderWidth: 2.5,
                                                pointRadius: 3, pointBackgroundColor: MAROON,
                                                fill: { target: 0, above: alpha('#16a34a', 0.08), below: alpha('#dc2626', 0.06) },
                                                tension: 0.3,
                                            },
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
                                    const envStart  = new Date(env.startDate).getTime();
                                    const envEnd    = new Date(env.targetDate!).getTime();
                                    const leftPct   = Math.max(((Math.max(envStart, mayStart) - mayStart) / span) * 100, 0);
                                    const widthPct  = Math.min(((Math.min(envEnd, decEnd) - Math.max(envStart, mayStart)) / span) * 100, 100 - leftPct);
                                    const todayPct  = ((now - mayStart) / span) * 100;
                                    const c         = ENVELOPE_COLORS[env.envelopeType];
                                    const vel       = velocityDays(env);
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

// ── Insights panel ─────────────────────────────────────────────────────────────
const InsightsPanel: React.FC<{ envelopes: BudgetEnvelope[]; contributions: EnvelopeContribution[] }> = ({ envelopes, contributions }) => {
    const active = envelopes.filter(e => e.status === 'ACTIVE');
    const insights: { color: string; bg: string; icon: React.ReactNode; title: string; sub: string }[] = [];

    active.filter(e => e.envelopeType === 'PAYOFF' && e.targetDate).forEach(env => {
        const req  = requiredMonthly(env);
        const diff = req !== null ? req - env.allocatedAmount : 0;
        if (diff > 0) {
            insights.push({
                color: '#dc2626', bg: alpha('#dc2626', 0.06), icon: <AlertTriangle size={13} color="#dc2626" />,
                title: `${env.envelopeName} needs $${Math.ceil(diff)} more per month`,
                sub: `At $${env.allocatedAmount}/mo you'll miss the deadline. Increase to $${Math.ceil(req!.valueOf())}/mo to clear on time.`,
            });
        }
    });

    active.filter(e => e.remainingAmount > 0 && e.remainingAmount <= e.allocatedAmount * 2).forEach(env => {
        insights.push({
            color: '#16a34a', bg: alpha('#16a34a', 0.06), icon: <CheckCircle size={13} color="#16a34a" />,
            title: `${env.envelopeName} completes next month`,
            sub: `Only ${fmt(env.remainingAmount)} left. One more contribution and ${fmt(env.allocatedAmount)}/mo frees up for reallocation.`,
        });
    });

    const bestStreak = [...active].sort((a, b) => (b.streakMonths ?? 0) - (a.streakMonths ?? 0))[0];
    if (bestStreak?.streakMonths && bestStreak.streakMonths >= 3) {
        insights.push({
            color: '#7c3aed', bg: alpha('#7c3aed', 0.06), icon: <Flame size={13} color="#7c3aed" />,
            title: `${bestStreak.streakMonths}-month streak on ${bestStreak.envelopeName}`,
            sub: `Your longest active streak. Consistent monthly contributions are your strongest habit.`,
        });
    }

    active.forEach(env => {
        const vel = velocityDays(env);
        if (vel !== null && vel >= 20) {
            insights.push({
                color: '#0284c7', bg: alpha('#0284c7', 0.06), icon: <TrendingUp size={13} color="#0284c7" />,
                title: `${env.envelopeName} is ${vel} days ahead of pace`,
                sub: `You could reduce contributions by $${Math.max(Math.round(env.allocatedAmount * 0.15), 20)}/mo and still meet the target date.`,
            });
        }
    });

    if (!insights.length) return null;

    return (
        <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '2px', bgcolor: '#d97706' }} />
                <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#d97706' }}>
                    Insights
                </Typography>
                <Chip size="small" label={insights.length} sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: alpha('#d97706', 0.1), color: '#d97706' }} />
            </Box>
            <Grid container spacing={1.5}>
                {insights.slice(0, 3).map((ins, i) => (
                    <Grid item xs={12} sm={4} key={i}>
                        <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: ins.bg, border: `1px solid ${ins.color}22`, height: '100%' }}>
                            <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75, alignItems: 'flex-start' }}>{ins.icon}<Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#111', lineHeight: 1.3 }}>{ins.title}</Typography></Box>
                            <Typography sx={{ fontSize: '0.68rem', color: '#555', lineHeight: 1.5 }}>{ins.sub}</Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

// ── Manual Contribution Dialog ─────────────────────────────────────────────────
interface ManualContributionDialogProps {
    open: boolean; envelope: BudgetEnvelope | null;
    onClose: () => void;
    onSubmit: (envelopeId: number, amount: number, date: string, note: string) => void;
    onSetupAuto: (envelopeId: number, rule: AutoRule) => void;
}

const ManualContributionDialog: React.FC<ManualContributionDialogProps> = ({ open, envelope, onClose, onSubmit, onSetupAuto }) => {
    const [tab, setTab]           = useState(0);
    const [amount, setAmount]     = useState('');
    const [date, setDate]         = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote]         = useState('');
    const [autoAmt, setAutoAmt]   = useState('');
    const [autoFreq, setAutoFreq] = useState('MONTHLY_1ST');
    const [autoStart, setAutoStart] = useState('');
    const [autoSrc, setAutoSrc]   = useState('checking_4821');

    useEffect(() => {
        if (open) {
            setTab(0); setAmount(''); setNote('');
            setDate(new Date().toISOString().split('T')[0]);
            const next = new Date(); next.setMonth(next.getMonth() + 1); next.setDate(1);
            setAutoStart(next.toISOString().split('T')[0]);
            if (envelope) setAutoAmt(String(envelope.allocatedAmount));
        }
    }, [open, envelope]);

    if (!envelope) return null;
    const color = ENVELOPE_COLORS[envelope.envelopeType];

    const handleOneTime = () => {
        const v = parseFloat(amount);
        if (isNaN(v) || v <= 0) return;
        onSubmit(envelope.id, v, date, note);
        onClose();
    };

    const handleAutoSetup = () => {
        const v = parseFloat(autoAmt);
        if (isNaN(v) || v <= 0) return;
        onSetupAuto(envelope.id, { frequency: autoFreq, amount: v, startDate: autoStart, source: autoSrc });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}>
            <Box sx={{ background: `linear-gradient(135deg, ${alpha(color, 0.9)}, ${color})`, px: 3, py: 2, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -16, right: -16, width: 70, height: 70, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>Add Contribution</Typography>
                        <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.75)', mt: 0.1 }}>{envelope.envelopeName}</Typography>
                    </Box>
                    <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}><XCircle size={16} /></IconButton>
                </Box>
            </Box>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}
                  sx={{ borderBottom: '1px solid #eee', px: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', minHeight: 42 }, '& .MuiTabs-indicator': { bgcolor: color } }}>
                <Tab label="One-time" />
                <Tab label="Set up auto-track" />
            </Tabs>
            <DialogContent sx={{ pt: 2.5 }}>
                {tab === 0 && (
                    <Stack spacing={2}>
                        <TextField label="Amount" size="small" fullWidth type="number" value={amount} onChange={e => setAmount(e.target.value)}
                                   InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: '#aaa' }}>$</Typography></InputAdornment> }}
                                   inputProps={{ min: 0, step: 0.01 }}
                                   sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }} />
                        <TextField label="Date" size="small" fullWidth type="date" value={date} onChange={e => setDate(e.target.value)}
                                   InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }} />
                        <TextField label="Note (optional)" size="small" fullWidth multiline rows={2} value={note} onChange={e => setNote(e.target.value)}
                                   placeholder="e.g. May contribution" sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }} />
                        {parseFloat(amount) > 0 && (
                            <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: alpha(color, 0.06), border: `1px solid ${alpha(color, 0.18)}` }}>
                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color, mb: 0.75 }}>After this contribution</Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography sx={{ fontSize: '0.72rem', color: '#555' }}>{fmt(envelope.currentAmount + parseFloat(amount))} saved</Typography>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color }}>{Math.min(((envelope.currentAmount + parseFloat(amount)) / envelope.targetAmount) * 100, 100).toFixed(0)}%</Typography>
                                </Box>
                                <LinearProgress variant="determinate"
                                                value={Math.min(((envelope.currentAmount + parseFloat(amount)) / envelope.targetAmount) * 100, 100)}
                                                sx={{ height: 5, borderRadius: 3, bgcolor: alpha(color, 0.12), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }} />
                            </Box>
                        )}
                    </Stack>
                )}
                {tab === 1 && (
                    <Stack spacing={2}>
                        <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: alpha('#0284c7', 0.06), border: `1px solid ${alpha('#0284c7', 0.2)}`, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                            <RefreshCcw size={14} color="#0284c7" style={{ marginTop: 2, flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.72rem', color: '#555', lineHeight: 1.5 }}>Auto-track posts contributions automatically each period. You can pause or cancel at any time.</Typography>
                        </Box>
                        <FormControl size="small" fullWidth>
                            <InputLabel sx={{ fontSize: '0.82rem' }}>Frequency</InputLabel>
                            <Select value={autoFreq} label="Frequency" onChange={e => setAutoFreq(e.target.value)} sx={{ '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: color } }}>
                                {FREQUENCY_OPTIONS.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: '0.82rem' }}>{o.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <TextField label="Amount per period" size="small" fullWidth type="number" value={autoAmt} onChange={e => setAutoAmt(e.target.value)}
                                   InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: '#aaa' }}>$</Typography></InputAdornment> }}
                                   inputProps={{ min: 0, step: 0.01 }} sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }} />
                        <TextField label="Starts" size="small" fullWidth type="date" value={autoStart} onChange={e => setAutoStart(e.target.value)}
                                   InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }} />
                        <FormControl size="small" fullWidth>
                            <InputLabel sx={{ fontSize: '0.82rem' }}>Source account</InputLabel>
                            <Select value={autoSrc} label="Source account" onChange={e => setAutoSrc(e.target.value)} sx={{ '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: color } }}>
                                {SOURCE_OPTIONS.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: '0.82rem' }}>{o.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Stack>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button fullWidth variant="outlined" onClick={onClose} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#d5d5d5', color: '#555', '&:hover': { borderColor: MAROON, color: MAROON } }}>Cancel</Button>
                <Button fullWidth variant="contained" onClick={tab === 0 ? handleOneTime : handleAutoSetup}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, bgcolor: color, '&:hover': { bgcolor: alpha(color, 0.85) } }}>
                    {tab === 0 ? 'Save contribution' : 'Enable auto-track'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ── Affordability Check Dialog ─────────────────────────────────────────────────
const AffordabilityDialog: React.FC<{
    open: boolean; envelopes: BudgetEnvelope[];
    onClose: () => void; onApplyAll: (results: AffordabilityResult[]) => void;
}> = ({ open, envelopes, onClose, onApplyAll }) => {
    const [balance, setBalance] = useState<number>(1200);
    const envMap   = useMemo(() => new Map(envelopes.map(e => [e.id, e])), [envelopes]);
    const results  = useMemo(() => computeAffordability(envelopes, balance), [envelopes, balance]);
    const total    = results.reduce((s, r) => s + r.suggested, 0);
    const STATUS_COLORS = { FULL: '#16a34a', PARTIAL: '#d97706', SKIP: '#94a3b8' } as const;
    const STATUS_LABELS = { FULL: 'Full', PARTIAL: 'Partial', SKIP: 'Skip' } as const;
    const STATUS_BG = { FULL: alpha('#16a34a', 0.1), PARTIAL: alpha('#d97706', 0.1), SKIP: alpha('#94a3b8', 0.1) } as const;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}>
            <Box sx={{ background: `linear-gradient(135deg, ${MAROON_DARK}, ${MAROON})`, px: 3, py: 2, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calculator size={14} color="white" /></Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>Affordability Check</Typography>
                            <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>{envelopes.length} active envelopes in your plan</Typography>
                        </Box>
                    </Box>
                    <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}><XCircle size={16} /></IconButton>
                </Box>
            </Box>
            <DialogContent sx={{ pt: 2.5 }}>
                <Box sx={{ p: 1.75, borderRadius: '10px', bgcolor: alpha('#16a34a', 0.06), border: `1px solid ${alpha('#16a34a', 0.2)}`, display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: '9px', bgcolor: alpha('#16a34a', 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><DollarSign size={16} color="#16a34a" /></Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', mb: 0.25 }}>Available balance this month</Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#15803d', fontVariantNumeric: 'tabular-nums' }}>{fmt(balance)}</Typography>
                    </Box>
                    <TextField size="small" type="number" value={balance}
                               onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0) setBalance(v); }}
                               inputProps={{ min: 0, step: 10 }}
                               InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa' }}>$</Typography></InputAdornment> }}
                               sx={{ width: 110, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.82rem' }, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#16a34a' } }} />
                </Box>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.25 }}>Recommendation — by priority</Typography>
                <Stack spacing={0}>
                    {results.map((r, i) => {
                        const env   = envMap.get(r.envelopeId)!;
                        if (!env) return null;
                        const color = ENVELOPE_COLORS[env.envelopeType];
                        return (
                            <Box key={r.envelopeId} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 1.1, borderBottom: i < results.length - 1 ? `1px solid ${alpha('#000', 0.05)}` : 'none' }}>
                                <Box sx={{ width: 22, height: 22, borderRadius: '6px', bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{TYPE_ICONS[env.envelopeType]}</Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{env.envelopeName}</Typography>
                                    <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>Priority #{env.priority} · needs {fmt(Math.min(env.allocatedAmount, env.remainingAmount))}/mo</Typography>
                                </Box>
                                <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: r.suggested > 0 ? color : '#ccc', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{fmt(r.suggested)}</Typography>
                                <Chip size="small" label={STATUS_LABELS[r.status]} sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: STATUS_BG[r.status], color: STATUS_COLORS[r.status], flexShrink: 0 }} />
                            </Box>
                        );
                    })}
                </Stack>
                <Box sx={{ mt: 2, p: 1.5, borderRadius: '10px', bgcolor: alpha(MAROON, 0.05), border: `1px solid ${alpha(MAROON, 0.15)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: MAROON }}>Total to contribute</Typography>
                        <Typography sx={{ fontSize: '0.62rem', color: alpha(MAROON, 0.7) }}>{fmt(balance - total)} remaining after contributions</Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', color: MAROON, fontVariantNumeric: 'tabular-nums' }}>{fmt(total)}</Typography>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button fullWidth variant="outlined" onClick={onClose} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#d5d5d5', color: '#555', '&:hover': { borderColor: MAROON, color: MAROON } }}>Cancel</Button>
                <Button fullWidth variant="contained" disabled={total === 0}
                        onClick={() => { onApplyAll(results.filter(r => r.suggested > 0)); onClose(); }}
                        startIcon={<Sparkles size={14} />}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK }, '&.Mui-disabled': { bgcolor: alpha(MAROON, 0.3) } }}>
                    Apply all contributions
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ── Envelope card ──────────────────────────────────────────────────────────────
const EnvelopeCard: React.FC<{
    envelope: BudgetEnvelope; animateIn: boolean; timeout: number;
    onClick: () => void; onAddManual: (id: number) => void;
    contributions: EnvelopeContribution[];
    monthContributed: number;   // ← NEW: total contributed in the selected month
}> = ({ envelope, animateIn, timeout, onClick, onAddManual, contributions, monthContributed }) => {
    const pct      = progressPct(envelope.currentAmount, envelope.targetAmount);
    const color    = ENVELOPE_COLORS[envelope.envelopeType] ?? MAROON;
    const status   = STATUS_META[envelope.status];
    const days     = daysUntil(envelope.targetDate);
    const isUrgent = days !== null && days <= 60 && envelope.status === 'ACTIVE';
    const vel = velocityDays(envelope);
    const req = requiredMonthly(envelope);

    const expectedPct = (() => {
        if (!envelope.targetDate) return null;
        const start   = new Date(envelope.startDate).getTime();
        const end     = new Date(envelope.targetDate).getTime();
        const elapsed = Date.now() - start;
        return Math.min(Math.max((elapsed / (end - start)) * 100, 0), 100);
    })();

    return (
        <Grow in={animateIn} timeout={timeout}>
            <Box onClick={onClick} sx={{
                background: '#fff', borderRadius: '12px',
                border: `1px solid ${alpha(color, 0.2)}`, borderTop: `3px solid ${color}`,
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
                {envelope.contributionMode === 'AUTO' && envelope.status === 'ACTIVE' && (
                    <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 0.4, px: 0.75, py: 0.25, borderRadius: '20px', bgcolor: alpha('#0284c7', 0.1), border: `1px solid ${alpha('#0284c7', 0.2)}` }}>
                        <RefreshCcw size={9} color="#0284c7" />
                        <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#0284c7' }}>Auto</Typography>
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
                    <Chip size="small" label={ENVELOPE_TYPE_LABELS[envelope.envelopeType]} sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(color, 0.1), color }} />
                    <Chip size="small"
                          icon={<Box sx={{ display: 'flex', alignItems: 'center', color: status.color, ml: 0.5 }}>{status.icon}</Box>}
                          label={status.label}
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(status.color, 0.1), color: status.color, '& .MuiChip-icon': { ml: '4px', mr: '-2px' } }} />
                    {isUrgent && <Chip size="small" label={`${days}d left`} icon={<Clock size={9} />}
                                       sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha('#d97706', 0.1), color: '#d97706', '& .MuiChip-icon': { ml: '4px', mr: '-2px', color: '#d97706' } }} />}
                    {envelope.status === 'ACTIVE' && <VelocityChip days={vel} />}
                    {envelope.streakMonths && envelope.streakMonths >= 3 && (
                        <Chip size="small" label={`${envelope.streakMonths}mo streak`}
                              icon={<Box sx={{ display: 'flex', alignItems: 'center', color: '#7c3aed', ml: 0.5 }}><Flame size={9} /></Box>}
                              sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha('#7c3aed', 0.1), color: '#7c3aed', '& .MuiChip-icon': { ml: '4px', mr: '-2px' } }} />
                    )}
                </Box>

                <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: '#555', fontWeight: 600 }}>{fmt(envelope.currentAmount)} saved</Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#555', fontWeight: 700 }}>{pct.toFixed(0)}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct}
                                    sx={{ height: 6, borderRadius: 3, bgcolor: alpha(color, 0.12), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }} />
                    {expectedPct !== null && envelope.status === 'ACTIVE' && (
                        <Box sx={{ mt: 0.5, position: 'relative' }}>
                            <LinearProgress variant="determinate" value={pct}
                                            sx={{ height: 3, borderRadius: 2, bgcolor: alpha(color, 0.08), '& .MuiLinearProgress-bar': { bgcolor: pct >= expectedPct ? '#16a34a' : '#dc2626', borderRadius: 2 } }} />
                            <Box sx={{ position: 'absolute', top: -1, left: `${Math.min(expectedPct, 98)}%`, width: 2, height: 5, bgcolor: alpha('#000', 0.25), borderRadius: '1px' }} />
                        </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>Goal: {fmt(envelope.targetAmount)}</Typography>
                        {envelope.remainingAmount > 0
                            ? <Typography sx={{ fontSize: '0.62rem', color, fontWeight: 700 }}>{fmt(envelope.remainingAmount)} to go</Typography>
                            : <Typography sx={{ fontSize: '0.62rem', color: '#16a34a', fontWeight: 700 }}>Goal reached! 🎉</Typography>}
                    </Box>
                </Box>

                {/* Per-envelope stats row — now includes "This month" contributed */}
                {envelope.status === 'ACTIVE' && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0.75, mb: 1.25 }}>
                        {[
                            {
                                label: 'Need/mo',
                                value: req !== null ? fmt(req) : '—',
                                accent: req !== null && req > envelope.allocatedAmount ? '#dc2626' : undefined,
                            },
                            {
                                label: 'This month',
                                value: monthContributed > 0 ? fmt(monthContributed) : '—',
                                accent: monthContributed >= envelope.allocatedAmount ? '#16a34a' : undefined,
                            },
                            {
                                label: 'Streak',
                                value: envelope.streakMonths ? `${envelope.streakMonths}mo` : '—',
                            },
                        ].map(({ label, value, accent }) => (
                            <Box key={label} sx={{ p: 0.75, borderRadius: '6px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
                                <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#bbb', mb: 0.15 }}>{label}</Typography>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: accent ?? '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                            </Box>
                        ))}
                    </Box>
                )}

                <Divider sx={{ mb: 1.25, borderColor: alpha(color, 0.1) }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Calendar size={11} color="#aaa" />
                        <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>
                            {envelope.contributionFrequency ? `${envelope.contributionFrequency.charAt(0) + envelope.contributionFrequency.slice(1).toLowerCase()} · ${fmt(envelope.allocatedAmount)}` : fmt(envelope.allocatedAmount)}
                        </Typography>
                    </Box>
                    {envelope.contributionMode === 'MANUAL' && envelope.status === 'ACTIVE' ? (
                        <Button size="small" variant="outlined" startIcon={<Plus size={11} />}
                                onClick={e => { e.stopPropagation(); onAddManual(envelope.id); }}
                                sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.62rem', borderColor: alpha(color, 0.4), color, py: 0.25, px: 0.9, minHeight: 0, '&:hover': { borderColor: color, bgcolor: alpha(color, 0.05) } }}>
                            Add
                        </Button>
                    ) : (
                        envelope.targetDate && (
                            <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>
                                Target: {new Date(envelope.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </Typography>
                        )
                    )}
                </Box>
            </Box>
        </Grow>
    );
};

// ── Contribution row ────────────────────────────────────────────────────────────
const ContributionRow: React.FC<{ c: EnvelopeContribution; color: string }> = ({ c, color }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${alpha('#000', 0.05)}`, '&:last-child': { borderBottom: 'none' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{ width: 28, height: 28, borderRadius: '7px', bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ArrowUpRight size={13} color={color} /></Box>
            <Box>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#111' }}>{c.note || 'Contribution'}</Typography>
                <Typography sx={{ fontSize: '0.62rem', color: '#888' }}>{new Date(c.contributedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Typography>
            </Box>
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color, fontVariantNumeric: 'tabular-nums' }}>+{fmt(c.amount)}</Typography>
    </Box>
);

// ── Planner row ────────────────────────────────────────────────────────────────
const PlannerRow: React.FC<{
    rank: number; entry: PlanEntry; env: BudgetEnvelope; result: PlanResult; total: number;
    onUp: () => void; onDown: () => void; onAlloc: (v: number) => void; onLock: () => void;
    isFirst: boolean; isLast: boolean; animateIn: boolean; timeout: number;
}> = ({ rank, entry, env, result, total, onUp, onDown, onAlloc, onLock, isFirst, isLast, animateIn, timeout }) => {
    const color    = ENVELOPE_COLORS[env.envelopeType];
    const pct      = total > 0 ? (entry.monthlyAlloc / total) * 100 : 0;
    const score    = urgencyScore(env);
    const urgLabel = score > 800 ? 'Critical' : score > 400 ? 'High' : score > 150 ? 'Medium' : 'Low';
    const urgColor = score > 800 ? '#dc2626' : score > 400 ? '#d97706' : score > 150 ? '#0284c7' : '#16a34a';
    const daysLeft = daysUntil(env.targetDate);

    return (
        <Grow in={animateIn} timeout={timeout}>
            <Box sx={{ borderRadius: '12px', border: `1.5px solid ${entry.locked ? alpha(color, 0.4) : alpha('#000', 0.08)}`, bgcolor: entry.locked ? alpha(color, 0.025) : '#fff', overflow: 'hidden', transition: 'all 0.18s', '&:hover': { borderColor: alpha(color, 0.35), boxShadow: `0 3px 14px ${alpha(color, 0.1)}` } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderBottom: `1px solid ${alpha('#000', 0.05)}` }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: '8px', flexShrink: 0, background: rank === 1 ? `linear-gradient(135deg, ${MAROON_DARK}, ${MAROON})` : rank === 2 ? 'linear-gradient(135deg, #374151, #6b7280)' : alpha('#000', 0.07), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 900, color: rank <= 2 ? '#fff' : '#888' }}>#{rank}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                        <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{TYPE_ICONS[env.envelopeType]}</Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.83rem', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{env.envelopeName}</Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.2, flexWrap: 'wrap' }}>
                                <Chip size="small" label={urgLabel} sx={{ height: 15, fontSize: '0.57rem', fontWeight: 800, bgcolor: alpha(urgColor, 0.1), color: urgColor }} />
                                {daysLeft !== null && daysLeft <= 90 && <Chip size="small" label={`${daysLeft}d left`} icon={<Clock size={8} />} sx={{ height: 15, fontSize: '0.57rem', fontWeight: 700, bgcolor: alpha('#d97706', 0.1), color: '#d97706', '& .MuiChip-icon': { ml: '3px', mr: '-2px', color: '#d97706' } }} />}
                                {entry.locked && <Chip size="small" label="locked" sx={{ height: 15, fontSize: '0.57rem', fontWeight: 700, bgcolor: alpha(color, 0.12), color }} />}
                                {env.contributionMode === 'AUTO' && <Chip size="small" label="auto-track" icon={<RefreshCcw size={7} />} sx={{ height: 15, fontSize: '0.57rem', fontWeight: 700, bgcolor: alpha('#0284c7', 0.1), color: '#0284c7', '& .MuiChip-icon': { ml: '3px', mr: '-2px', color: '#0284c7' } }} />}
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        <IconButton size="small" onClick={onUp} disabled={isFirst} sx={{ p: 0.3, borderRadius: '5px', '&:hover': { bgcolor: alpha(MAROON, 0.08) }, '&.Mui-disabled': { opacity: 0.2 } }}><ArrowUp size={12} color={MAROON} /></IconButton>
                        <IconButton size="small" onClick={onDown} disabled={isLast} sx={{ p: 0.3, borderRadius: '5px', '&:hover': { bgcolor: alpha(MAROON, 0.08) }, '&.Mui-disabled': { opacity: 0.2 } }}><ArrowDown size={12} color={MAROON} /></IconButton>
                    </Box>
                </Box>
                <Box sx={{ px: 2, py: 1.5 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', mb: 0.75 }}>Monthly Contribution</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TextField size="small" value={entry.monthlyAlloc}
                                           onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0) onAlloc(v); }}
                                           type="number"
                                           InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa' }}>$</Typography></InputAdornment>, sx: { fontSize: '0.82rem', fontWeight: 800, borderRadius: '8px' } }}
                                           inputProps={{ min: 0, step: 5 }}
                                           sx={{ width: 120, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }} />
                                <Tooltip title={entry.locked ? 'Unlock — allow auto-distribute to adjust' : 'Lock — protect from auto-distribute'}>
                                    <IconButton size="small" onClick={onLock} sx={{ borderRadius: '7px', border: `1.5px solid ${entry.locked ? color : alpha('#000', 0.15)}`, bgcolor: entry.locked ? alpha(color, 0.1) : 'transparent', color: entry.locked ? color : '#bbb', '&:hover': { borderColor: color, color, bgcolor: alpha(color, 0.08) }, p: 0.6 }}>
                                        {entry.locked ? <Lock size={12} /> : <Unlock size={12} />}
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <Box sx={{ mt: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.35 }}>
                                    <Typography sx={{ fontSize: '0.58rem', color: '#bbb' }}>{pct.toFixed(1)}% of total</Typography>
                                    <Typography sx={{ fontSize: '0.58rem', color: '#bbb' }}>{fmt(entry.autoAlloc)} suggested</Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={Math.min(pct, 100)} sx={{ height: 4, borderRadius: 2, bgcolor: alpha(color, 0.1), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 } }} />
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', mb: 0.75 }}>Projection</Typography>
                            <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: result.meetsTarget ? alpha('#16a34a', 0.06) : alpha('#dc2626', 0.06), border: `1px solid ${result.meetsTarget ? alpha('#16a34a', 0.2) : alpha('#dc2626', 0.2)}` }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.3 }}>
                                    {result.meetsTarget ? <CheckCircle size={12} color="#16a34a" /> : <AlertTriangle size={12} color="#dc2626" />}
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: result.meetsTarget ? '#15803d' : '#dc2626' }}>
                                        {result.projectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </Typography>
                                </Box>
                                <Typography sx={{ fontSize: '0.65rem', color: '#555', lineHeight: 1.4 }}>
                                    {result.meetsTarget
                                        ? env.targetDate ? `On track — ${result.monthsNeeded}mo to goal ✓` : `${result.monthsNeeded} months to goal`
                                        : `${result.shortfall}d late — needs ${fmt(env.remainingAmount / Math.max(monthsBetween(new Date(), new Date(env.targetDate!)), 1))}/mo`}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </Grow>
    );
};

// ════════════════════════════════════════════════════════════════════════════════
// ── Main Page ─────────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════
// type PageView = 'envelopes' | 'planner';
type EnvelopeMode = 'single' | 'multi';

const BudgetEnvelopesPage: React.FC = () => {
    const [animateIn,    setAnimateIn]    = useState(false);
    const [isLoading,    setIsLoading]    = useState(false);
    // const [pageView,     setPageView]     = useState<PageView>('envelopes');
    const [envelopeMode, setEnvelopeMode] = useState<EnvelopeMode>('single');
    const [createOpen,   setCreateOpen]   = useState(false);
    const [snackOpen,    setSnackOpen]    = useState(false);
    const [snackMsg,     setSnackMsg]     = useState('');
    const [snackSev,     setSnackSev]     = useState<'success'|'error'|'info'|'warning'>('success');
    const [contribOpen,  setContribOpen]  = useState(false);
    const [contribEnvId, setContribEnvId] = useState<number | null>(null);
    const [affordOpen,   setAffordOpen]   = useState(false);

    const [envelopes,     setEnvelopes]     = useState<BudgetEnvelope[]>([]);
    const [contributions, setContributions] = useState<EnvelopeContribution[]>([]);
    const [selectedId,    setSelectedId]    = useState<number | null>(null);
    const [filterStatus,  setFilterStatus]  = useState<string>('ALL');
    const [filterType,    setFilterType]    = useState<string>('ALL');
    const [leftPanelView, setLeftPanelView] = useState<'envelopes' | 'analytics' | 'paymentplan'>('envelopes');

    // ── Month navigator ────────────────────────────────────────────────────────
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const monthStart = useMemo(() => {
        return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    }, [currentMonth]);

    const monthEnd = useMemo(() => {
        return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);
    }, [currentMonth]);

    const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const handlePrevMonth = () =>
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const handleNextMonth = () =>
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    // ──────────────────────────────────────────────────────────────────────────

    const [planBudget,    setPlanBudget]    = useState<number>(0);
    const [planEntries,   setPlanEntries]   = useState<PlanEntry[]>([]);
    const [planTimeframe, setPlanTimeframe] = useState<number>(4);
    const [planApplied,   setPlanApplied]   = useState(false);

    useEffect(() => {
        document.title = 'Envelopes';
        setTimeout(() => setAnimateIn(true), 100);
        setIsLoading(true);
        setTimeout(() => { setEnvelopes(MOCK_ENVELOPES); setContributions(MOCK_CONTRIBUTIONS); setIsLoading(false); }, 600);
        return () => { document.title = 'BudgetBuddy'; };
    }, []);

    const activeEnvelopes = useMemo(() => envelopes.filter(e => e.status === 'ACTIVE'), [envelopes]);
    const defaultBudget   = useMemo(() => activeEnvelopes.reduce((s, e) => s + e.allocatedAmount, 0), [activeEnvelopes]);

    useEffect(() => {
        if (activeEnvelopes.length < 2 && envelopeMode === 'multi')
            setEnvelopeMode('single');
    }, [activeEnvelopes.length]);

    useEffect(() => {
        if (activeEnvelopes.length === 0) return;
        const sorted  = [...activeEnvelopes].sort((a, b) => urgencyScore(b) - urgencyScore(a));
        const initial: PlanEntry[] = sorted.map((env, i) => ({ envelopeId: env.id, priority: i + 1, monthlyAlloc: env.allocatedAmount, locked: false, autoAlloc: env.allocatedAmount }));
        setPlanEntries(distributeAuto(initial, activeEnvelopes, defaultBudget));
        setPlanBudget(defaultBudget);
        setPlanApplied(false);
    }, [activeEnvelopes, defaultBudget]);

    useEffect(() => { setLeftPanelView('envelopes'); }, [selectedId]);

    const openContribDialog = (id: number) => { setContribEnvId(id); setContribOpen(true); };

    const handleAddContribution = (envelopeId: number, amount: number, date: string, note: string) => {
        setContributions(prev => [{ id: prev.length + 1, envelopeId, amount, contributedAt: date, note: note || undefined }, ...prev]);
        setEnvelopes(prev => prev.map(e => {
            if (e.id !== envelopeId) return e;
            const newCurrent   = Math.min(e.currentAmount + amount, e.targetAmount);
            const newRemaining = Math.max(e.targetAmount - newCurrent, 0);
            return { ...e, currentAmount: newCurrent, remainingAmount: newRemaining, status: newRemaining === 0 ? 'COMPLETED' : e.status };
        }));
        setSnackMsg(`Contribution of ${fmt(amount)} added!`); setSnackSev('success'); setSnackOpen(true);
    };

    const handleSetupAuto = (envelopeId: number, rule: AutoRule) => {
        setEnvelopes(prev => prev.map(e => e.id === envelopeId ? { ...e, contributionMode: 'AUTO', autoRule: rule, allocatedAmount: rule.amount } : e));
        setSnackMsg('Auto-tracking enabled!'); setSnackSev('success'); setSnackOpen(true);
    };

    const handleToggleContribMode = (envelopeId: number, mode: 'MANUAL' | 'AUTO') => {
        setEnvelopes(prev => prev.map(e => e.id === envelopeId ? { ...e, contributionMode: mode, autoRule: mode === 'MANUAL' ? undefined : e.autoRule } : e));
        if (mode === 'AUTO') openContribDialog(envelopeId);
    };

    const handleApplyAffordability = (results: AffordabilityResult[]) => {
        const today = new Date().toISOString().split('T')[0];
        results.forEach(r => handleAddContribution(r.envelopeId, r.suggested, today, 'Affordability check'));
        setSnackMsg(`Applied ${results.length} contribution${results.length !== 1 ? 's' : ''} from affordability check!`); setSnackSev('success'); setSnackOpen(true);
    };

    const redistributePlan = useCallback((budget: number, entries: PlanEntry[]) => {
        setPlanEntries(distributeAuto(entries, activeEnvelopes, budget));
    }, [activeEnvelopes]);

    const handlePlanBudgetChange = (v: number) => { setPlanBudget(v); redistributePlan(v, planEntries); };
    const handlePlanAlloc  = (id: number, v: number) => setPlanEntries(prev => prev.map(e => e.envelopeId === id ? { ...e, monthlyAlloc: v } : e));
    const handlePlanLock   = (id: number) => setPlanEntries(prev => prev.map(e => e.envelopeId === id ? { ...e, locked: !e.locked } : e));

    const movePlanUp = (idx: number) => { if (idx === 0) return; setPlanEntries(prev => { const n = [...prev]; [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]]; return n.map((e, i) => ({ ...e, priority: i + 1 })); }); };
    const movePlanDown = (idx: number) => { setPlanEntries(prev => { if (idx >= prev.length - 1) return prev; const n = [...prev]; [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]]; return n.map((e, i) => ({ ...e, priority: i + 1 })); }); };

    const resetPlanToAuto = () => {
        const sorted = [...activeEnvelopes].sort((a, b) => urgencyScore(b) - urgencyScore(a));
        const reset: PlanEntry[] = sorted.map((env, i) => ({ envelopeId: env.id, priority: i + 1, monthlyAlloc: env.allocatedAmount, locked: false, autoAlloc: env.allocatedAmount }));
        setPlanEntries(distributeAuto(reset, activeEnvelopes, planBudget));
    };

    const handleApplyPlan = () => {
        setEnvelopes(prev => prev.map(e => { const entry = planEntries.find(p => p.envelopeId === e.id); return entry ? { ...e, allocatedAmount: entry.monthlyAlloc } : e; }));
        setPlanApplied(true); setSnackMsg('Priority plan applied!'); setSnackSev('success'); setSnackOpen(true);
        setTimeout(() => setPlanApplied(false), 2000);
    };

    const planResults    = useMemo(() => computeResults(planEntries, activeEnvelopes), [planEntries, activeEnvelopes]);
    const planAllocated  = planEntries.reduce((s, e) => s + e.monthlyAlloc, 0);
    const planSurplus    = planBudget - planAllocated;
    const allOnTrack     = planResults.every(r => r.meetsTarget);
    const criticalCount  = planResults.filter(r => !r.meetsTarget).length;
    const envMap         = useMemo(() => new Map(activeEnvelopes.map(e => [e.id, e])), [activeEnvelopes]);
    const withinHorizon  = planResults.filter(r => r.monthsNeeded <= planTimeframe);
    const outsideHorizon = planResults.filter(r => r.monthsNeeded > planTimeframe);

    const selectedEnvelope      = useMemo(() => envelopes.find(e => e.id === selectedId) ?? null, [envelopes, selectedId]);

    // ── Scope contribution history to selected month ───────────────────────────
    const selectedContributions = useMemo(() =>
            contributions.filter(c => {
                if (c.envelopeId !== selectedId) return false;
                const d = new Date(c.contributedAt);
                return d >= monthStart && d <= monthEnd;
            }),
        [contributions, selectedId, monthStart, monthEnd]);

    // ── Filter envelopes: status + type + active-in-month ─────────────────────
    const filtered = useMemo(() => envelopes.filter(e => {
        const statusOk = filterStatus === 'ALL' || e.status === filterStatus;
        const typeOk   = filterType   === 'ALL' || e.envelopeType === filterType;
        const monthOk  = isEnvelopeActiveInMonth(e, monthStart, monthEnd);
        return statusOk && typeOk && monthOk;
    }), [envelopes, filterStatus, filterType, monthStart, monthEnd]);

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

    const overallPct     = stats.totalTarget > 0 ? Math.min((stats.totalSaved / stats.totalTarget) * 100, 100) : 0;
    const contribEnvelope = useMemo(() => envelopes.find(e => e.id === contribEnvId) ?? null, [envelopes, contribEnvId]);

    const filterBtn = (label: string, value: string, current: string, setter: (v: string) => void) => (
        <Button key={value} size="small" onClick={() => setter(value)} variant={current === value ? 'contained' : 'outlined'}
                sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', ...(current === value ? { bgcolor: MAROON, color: '#fff', borderColor: MAROON, '&:hover': { bgcolor: MAROON_DARK } } : { borderColor: '#d5d5d5', color: '#555', bgcolor: '#fff', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: alpha(MAROON, 0.04) } }) }}>
            {label}
        </Button>
    );

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

                {/* Header */}
                <Grow in={animateIn} timeout={400}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                        {/* Left — dynamic month title */}
                        <Box>
                            <Box sx={{ width: 28, height: 3, background: MAROON, borderRadius: '2px', mb: 0.75 }} />
                            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#111', letterSpacing: '-0.025em' }}>
                                {monthLabel.split(' ')[1]} {monthLabel.split(' ')[0]} Envelopes
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: '#888', mt: 0.5 }}>
                                {envelopeMode === 'single' ? 'Dedicated funds...Portfolio view — stats, timeline & priority management': ''}
                            </Typography>
                        </Box>

                        {/* Right — month navigator + view toggle + action */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>

                            {/* Month navigator */}
                            <IconButton
                                onClick={handlePrevMonth}
                                size="small"
                                sx={{ width: 32, height: 32, borderRadius: '6px', bgcolor: MAROON, color: '#fff', '&:hover': { bgcolor: MAROON_DARK } }}
                            >
                                <ChevronLeft size={16} />
                            </IconButton>
                            <Box sx={{ px: 2, py: 0.75, display: 'flex', alignItems: 'center', gap: 1, borderRadius: '8px', border: '1px solid #e0e0e0', bgcolor: '#f9f9f9' }}>
                                <Calendar size={13} color="#888" />
                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#222' }}>{monthLabel}</Typography>
                            </Box>
                            <IconButton
                                onClick={handleNextMonth}
                                size="small"
                                sx={{ width: 32, height: 32, borderRadius: '6px', bgcolor: MAROON, color: '#fff', '&:hover': { bgcolor: MAROON_DARK } }}
                            >
                                <ChevronRight size={16} />
                            </IconButton>

                            {/* View toggle pill */}
                            <Box sx={{ display: 'flex', p: '4px', borderRadius: '12px', bgcolor: '#e4e4e7', gap: '3px' }}>
                                <Button size="small" onClick={() => setEnvelopeMode('single')}
                                        startIcon={<Wallet size={13} />}
                                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', px: 1.75, py: 0.7, minWidth: 0, transition: 'all 0.18s',
                                            ...(envelopeMode === 'single'
                                                ? { bgcolor: '#fff', color: MAROON, boxShadow: '0 1px 6px rgba(0,0,0,0.13)', '&:hover': { bgcolor: '#fff' } }
                                                : { bgcolor: 'transparent', color: '#71717a', '&:hover': { bgcolor: alpha('#fff', 0.55), color: '#333' } }) }}>
                                    Envelopes
                                </Button>
                                <Tooltip title={activeEnvelopes.length < 2 ? 'Need at least 2 active envelopes' : ''}>
                                    <Box>
                                        <Button size="small" disabled={activeEnvelopes.length < 2}
                                                onClick={() => setEnvelopeMode('multi')}
                                                startIcon={<LayoutList size={13} />}
                                                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', px: 1.75, py: 0.7, minWidth: 0, transition: 'all 0.18s',
                                                    ...(envelopeMode === 'multi'
                                                        ? { bgcolor: '#fff', color: MAROON, boxShadow: '0 1px 6px rgba(0,0,0,0.13)', '&:hover': { bgcolor: '#fff' } }
                                                        : { bgcolor: 'transparent', color: '#71717a', '&:hover': { bgcolor: alpha('#fff', 0.55), color: '#333' } }),
                                                    '&.Mui-disabled': { bgcolor: 'transparent', color: '#c4c4c4' } }}>
                                            Multi-envelope
                                        </Button>
                                    </Box>
                                </Tooltip>
                            </Box>

                            {/* Action button */}
                            <Button variant="contained" startIcon={<Plus size={15} />} onClick={() => setCreateOpen(true)}
                                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem',
                                        bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK }, px: 2.5, py: 1 }}>
                                New Envelope
                            </Button>
                        </Box>
                    </Box>
                </Grow>

                {/* Summary stat cards */}
                <Grow in={animateIn} timeout={600}>
                    <Grid container spacing={2.5} sx={{ mb: 4 }}>
                        {[
                            { label: 'Active Envelopes',  value: String(stats.totalEnvelopes), sub: `${stats.completed} completed`,                    color: MAROON,    bg: '#f0f4ff', chip: <><Layers size={10} /> All time</>,       pct: 100        },
                            { label: 'Monthly Allocated', value: fmt(stats.totalAllocated),    sub: `across ${stats.totalEnvelopes} envelopes`,         color: '#7c3aed', bg: '#faf5ff', chip: <><Calendar size={10} /> /month</>,     pct: 100        },
                            { label: 'Total Saved',       value: fmt(stats.totalSaved),        sub: `${overallPct.toFixed(0)}% of all targets`,         color: '#16a34a', bg: '#f0fdf4', chip: <><TrendingUp size={10} /> progress</>, pct: overallPct },
                            { label: 'Total Target',      value: fmt(stats.totalTarget),       sub: `${fmt(stats.totalTarget - stats.totalSaved)} left`, color: '#0284c7', bg: '#f0f9ff', chip: <><Target size={10} /> goal</>,        pct: 100        },
                        ].map(({ label, value, sub, color, bg, chip, pct }) => (
                            <Grid item xs={12} sm={6} md={3} key={label}>
                                <Box sx={{ background: bg, borderRadius: '10px', borderTop: `3px solid ${color}`, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', p: 2.5, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' } }}>
                                    <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: alpha(color, 0.7), fontWeight: 700, mb: 1 }}>{label}</Typography>
                                    {isLoading ? <Skeleton variant="text" width="60%" height={42} /> : <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color, lineHeight: 1, mb: 0.5, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>}
                                    <LinearProgress variant="determinate" value={pct} sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(color, 0.15), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 } }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography sx={{ fontSize: '0.72rem', color: alpha(color, 0.65) }}>{sub}</Typography>
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: alpha(color, 0.1), color, fontSize: '0.65rem', fontWeight: 700 }}>{chip}</Box>
                                    </Box>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Grow>

                {/* ── ENVELOPES VIEW ─────────────────────────────────────────── */}
                {envelopeMode === 'single' && (
                    <>
                        {/* Affordability banner */}
                        {activeEnvelopes.length >= 2 && (
                            <Grow in={animateIn} timeout={650}>
                                <Box sx={{ mb: 3, p: 2, borderRadius: '12px', background: `linear-gradient(135deg, ${alpha(MAROON, 0.04)}, ${alpha(MAROON, 0.08)})`, border: `1px solid ${alpha(MAROON, 0.18)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha(MAROON, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Calculator size={16} color={MAROON} /></Box>
                                        <Box>
                                            <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#111' }}>Can I contribute this month?</Typography>
                                            <Typography sx={{ fontSize: '0.72rem', color: '#888', mt: 0.1 }}>Enter your available balance and see which of your {activeEnvelopes.length} active envelopes you can fund right now.</Typography>
                                        </Box>
                                    </Box>
                                    <Button variant="contained" startIcon={<Sparkles size={14} />} onClick={() => setAffordOpen(true)}
                                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK }, px: 2.5, py: 1, flexShrink: 0 }}>
                                        Run check
                                    </Button>
                                </Box>
                            </Grow>
                        )}

                        {/* Filters */}
                        <Grow in={animateIn} timeout={700}>
                            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', mr: 0.5 }}>Type:</Typography>
                                {['ALL','SAVINGS','PAYOFF','PURCHASE','EMERGENCY'].map(v => filterBtn(v === 'ALL' ? 'All' : ENVELOPE_TYPE_LABELS[v], v, filterType, setFilterType))}
                            </Box>
                        </Grow>

                        <Grid container spacing={3}>
                            {/* Envelope grid + analytics panel */}
                            <Grid item xs={12} lg={8}>
                                <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}` }}>
                                    {/* Panel header with view toggle */}
                                    <Box sx={{ background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 50%, #5a1515 100%)`, px: 3, py: 2, position: 'relative', overflow: 'hidden' }}>
                                        <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
                                        <Box sx={{ position: 'absolute', bottom: -20, right: 50, width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', gap: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                                                <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    {leftPanelView === 'envelopes' ? <Wallet size={15} color="white" />
                                                        : leftPanelView === 'analytics' ? <BarChart2 size={15} color="white" />
                                                            : <CreditCard size={15} color="white" />}
                                                </Box>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>
                                                        {leftPanelView === 'envelopes' ? 'Your Envelopes'
                                                            : leftPanelView === 'analytics' ? 'Analytics'
                                                                : `Payment Plan — ${selectedEnvelope?.envelopeName ?? ''}`}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>
                                                        {leftPanelView === 'envelopes'
                                                            ? `${filtered.length} envelope${filtered.length !== 1 ? 's' : ''} active in ${monthLabel}`
                                                            : leftPanelView === 'analytics'
                                                                ? 'Velocity, allocation, timeline & insights'
                                                                : 'Schedule, acceleration simulator & amortization'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            {/* Toggle pill */}
                                            <Box sx={{ display: 'flex', p: '3px', borderRadius: '9px', bgcolor: 'rgba(0,0,0,0.25)', gap: '2px', flexShrink: 0 }}>
                                                {[
                                                    { key: 'envelopes' as const,    label: 'Envelopes',     icon: <Wallet size={12} /> },
                                                    { key: 'analytics' as const,    label: 'Analytics',     icon: <BarChart2 size={12} /> },
                                                    ...(selectedEnvelope?.envelopeType === 'PAYOFF' && selectedEnvelope?.paymentPlan
                                                        ? [{ key: 'paymentplan' as const, label: 'Pay plan', icon: <CreditCard size={12} /> }]
                                                        : []),
                                                ].map(({ key, label, icon }) => (
                                                    <Button key={key} size="small" onClick={() => setLeftPanelView(key)} startIcon={icon}
                                                            sx={{
                                                                borderRadius: '6px', textTransform: 'none', fontWeight: 700,
                                                                fontSize: '0.72rem', px: 1.5, py: 0.5, minWidth: 0, gap: 0.5,
                                                                transition: 'all 0.18s',
                                                                ...(leftPanelView === key
                                                                        ? { bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.24)' } }
                                                                        : { bgcolor: 'transparent', color: 'rgba(255,255,255,0.55)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' } }
                                                                ),
                                                            }}>
                                                        {label}
                                                    </Button>
                                                ))}
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Envelopes view */}
                                    {leftPanelView === 'envelopes' && (
                                        <Box sx={{ bgcolor: '#fff', p: 3 }}>
                                            {filtered.length === 0 && !isLoading ? (
                                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                                    <PiggyBank size={40} color={alpha(MAROON, 0.25)} />
                                                    <Typography sx={{ mt: 2, fontWeight: 700, color: '#555' }}>No envelopes active in {monthLabel}</Typography>
                                                    <Typography sx={{ mt: 0.5, fontSize: '0.82rem', color: '#aaa' }}>
                                                        Try navigating to a different month or adjusting the filters above.
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <Grid container spacing={2}>
                                                    {isLoading
                                                        ? Array.from({ length: 4 }).map((_, i) => <Grid item xs={12} sm={6} key={i}><Skeleton variant="rounded" height={220} sx={{ borderRadius: '12px' }} /></Grid>)
                                                        : filtered.map((env, i) => (
                                                            <Grid item xs={12} sm={6} key={env.id}>
                                                                <EnvelopeCard
                                                                    envelope={env}
                                                                    animateIn={animateIn}
                                                                    timeout={700 + i * 80}
                                                                    contributions={contributions}
                                                                    monthContributed={monthlyContributed(contributions, env.id, monthStart, monthEnd)}
                                                                    onClick={() => setSelectedId(env.id === selectedId ? null : env.id)}
                                                                    onAddManual={openContribDialog}
                                                                />
                                                            </Grid>
                                                        ))}
                                                </Grid>
                                            )}
                                        </Box>
                                    )}

                                    {/* Analytics view */}
                                    {leftPanelView === 'analytics' && !isLoading && (
                                        <Box sx={{ bgcolor: '#fff', p: 3 }}>
                                            <InsightsPanel envelopes={envelopes} contributions={contributions} />
                                            <ChartsPanel envelopes={envelopes} contributions={contributions} />
                                        </Box>
                                    )}

                                    {/* Payment plan view */}
                                    {leftPanelView === 'paymentplan' && selectedEnvelope?.paymentPlan && (
                                        <Box sx={{ bgcolor: '#fff', p: 3 }}>
                                            {selectedEnvelope.paymentPlan.isDeferred && (
                                                <Box sx={{ mb: 3, p: 2, borderRadius: '10px', bgcolor: alpha('#dc2626', 0.05), border: `1px solid ${alpha('#dc2626', 0.2)}`, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                                    <Box sx={{ width: 34, height: 34, borderRadius: '9px', bgcolor: alpha('#dc2626', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <AlertTriangle size={16} color="#dc2626" />
                                                    </Box>
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#dc2626' }}>
                                                            Deferred interest at risk: {fmt(selectedEnvelope.paymentPlan.deferredInterest)}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.72rem', color: '#7f1d1d', mt: 0.3, lineHeight: 1.5 }}>
                                                            If {fmt(selectedEnvelope.remainingAmount)} isn't cleared by {selectedEnvelope.targetDate ? new Date(selectedEnvelope.targetDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}, the full 26.99% APR back-interest applies from the original purchase date.
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            )}
                                            <PaymentPlanPanel envelope={selectedEnvelope} contributions={selectedContributions} />
                                        </Box>
                                    )}
                                </Box>
                            </Grid>

                            {/* Right detail panel */}
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
                                                        <IconButton size="small" onClick={() => setSelectedId(null)} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}><XCircle size={16} /></IconButton>
                                                    </Box>
                                                </Box>
                                                <Box sx={{ bgcolor: '#fff', p: 2.5 }}>
                                                    {/* Big progress */}
                                                    <Box sx={{ textAlign: 'center', mb: 2 }}>
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

                                                    {/* Velocity summary */}
                                                    {(() => {
                                                        const vel = velocityDays(selectedEnvelope);
                                                        const req = requiredMonthly(selectedEnvelope);
                                                        if (!vel && !req) return null;
                                                        return (
                                                            <Box sx={{ mb: 2, p: 1.25, borderRadius: '8px', bgcolor: vel && vel > 0 ? alpha('#16a34a', 0.06) : alpha('#d97706', 0.06), border: `1px solid ${vel && vel > 0 ? alpha('#16a34a', 0.2) : alpha('#d97706', 0.2)}` }}>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <Box>
                                                                        <Typography sx={{ fontSize: '0.6rem', color: '#aaa', mb: 0.25 }}>Velocity</Typography>
                                                                        <VelocityChip days={vel} />
                                                                    </Box>
                                                                    {req !== null && (
                                                                        <Box sx={{ textAlign: 'right' }}>
                                                                            <Typography sx={{ fontSize: '0.6rem', color: '#aaa', mb: 0.25 }}>Need/mo to hit deadline</Typography>
                                                                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: req > selectedEnvelope.allocatedAmount ? '#dc2626' : '#16a34a', fontVariantNumeric: 'tabular-nums' }}>
                                                                                {fmt(req)}
                                                                            </Typography>
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        );
                                                    })()}

                                                    {/* Contribution mode */}
                                                    {selectedEnvelope.status === 'ACTIVE' && (
                                                        <Box sx={{ mb: 2, p: 1.5, borderRadius: '10px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
                                                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', mb: 1 }}>Contribution mode</Typography>
                                                            <Box sx={{ display: 'flex', gap: 0.75 }}>
                                                                {(['MANUAL', 'AUTO'] as const).map(mode => (
                                                                    <Button key={mode} size="small" fullWidth
                                                                            variant={selectedEnvelope.contributionMode === mode ? 'contained' : 'outlined'}
                                                                            startIcon={mode === 'MANUAL' ? <Plus size={12} /> : <RefreshCcw size={12} />}
                                                                            onClick={() => handleToggleContribMode(selectedEnvelope.id, mode)}
                                                                            sx={{ borderRadius: '7px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', ...(selectedEnvelope.contributionMode === mode ? { bgcolor: ENVELOPE_COLORS[selectedEnvelope.envelopeType], '&:hover': { bgcolor: alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.85) } } : { borderColor: '#d5d5d5', color: '#777', '&:hover': { borderColor: ENVELOPE_COLORS[selectedEnvelope.envelopeType], color: ENVELOPE_COLORS[selectedEnvelope.envelopeType] } }) }}>
                                                                        {mode === 'MANUAL' ? 'Manual' : 'Auto-track'}
                                                                    </Button>
                                                                ))}
                                                            </Box>
                                                            {selectedEnvelope.contributionMode === 'AUTO' && selectedEnvelope.autoRule && (
                                                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                    <RefreshCcw size={10} color="#0284c7" />
                                                                    <Typography sx={{ fontSize: '0.65rem', color: '#0284c7', fontWeight: 600 }}>
                                                                        {fmt(selectedEnvelope.autoRule.amount)} · {FREQUENCY_OPTIONS.find(o => o.value === selectedEnvelope.autoRule?.frequency)?.label ?? selectedEnvelope.autoRule.frequency}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    )}

                                                    <Divider sx={{ mb: 2 }} />

                                                    {/* Stats grid */}
                                                    <Grid container spacing={1.5} sx={{ mb: 2 }}>
                                                        {[
                                                            { label: 'Remaining',   value: fmt(selectedEnvelope.remainingAmount) },
                                                            { label: 'Allocated',   value: `${fmt(selectedEnvelope.allocatedAmount)}/mo` },
                                                            { label: 'Target Date', value: selectedEnvelope.targetDate ? new Date(selectedEnvelope.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
                                                            { label: 'Days Left',   value: daysUntil(selectedEnvelope.targetDate) !== null ? `${daysUntil(selectedEnvelope.targetDate)}d` : '—' },
                                                            { label: 'Streak',      value: `${selectedEnvelope.streakMonths ?? 0}mo` },
                                                            { label: 'This month',  value: (() => { const mc = monthlyContributed(contributions, selectedEnvelope.id, monthStart, monthEnd); return mc > 0 ? fmt(mc) : '—'; })() },
                                                        ].map(({ label, value }) => (
                                                            <Grid item xs={6} key={label}>
                                                                <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
                                                                    <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', mb: 0.3 }}>{label}</Typography>
                                                                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                                                                </Box>
                                                            </Grid>
                                                        ))}
                                                    </Grid>

                                                    {/* Actions */}
                                                    <Stack spacing={1} sx={{ mb: 2 }}>
                                                        {selectedEnvelope.contributionMode === 'MANUAL' ? (
                                                            <Button fullWidth variant="contained" startIcon={<Plus size={14} />}
                                                                    onClick={() => openContribDialog(selectedEnvelope.id)}
                                                                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', bgcolor: ENVELOPE_COLORS[selectedEnvelope.envelopeType], '&:hover': { bgcolor: alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.85) } }}>
                                                                Add Contribution
                                                            </Button>
                                                        ) : (
                                                            <Button fullWidth variant="outlined" startIcon={<Settings2 size={14} />}
                                                                    onClick={() => openContribDialog(selectedEnvelope.id)}
                                                                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', borderColor: '#0284c7', color: '#0284c7', '&:hover': { bgcolor: alpha('#0284c7', 0.05) } }}>
                                                                Edit auto-track rule
                                                            </Button>
                                                        )}
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

                                                    {/* Payment plan prompt */}
                                                    {selectedEnvelope.envelopeType === 'PAYOFF' && selectedEnvelope.paymentPlan && (
                                                        <Box sx={{ mb: 2, p: 1.5, borderRadius: '10px', bgcolor: alpha('#dc2626', 0.05), border: `1px solid ${alpha('#dc2626', 0.18)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <CreditCard size={14} color="#dc2626" style={{ flexShrink: 0 }} />
                                                                <Box>
                                                                    <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#dc2626' }}>Payment plan available</Typography>
                                                                    <Typography sx={{ fontSize: '0.63rem', color: '#7f1d1d', mt: 0.1 }}>
                                                                        {selectedEnvelope.paymentPlan.isDeferred ? `${fmt(selectedEnvelope.paymentPlan.deferredInterest)} interest at risk` : `${selectedEnvelope.paymentPlan.termMonths}-month plan`}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                            <Button size="small" variant="outlined"
                                                                    onClick={() => setLeftPanelView('paymentplan')}
                                                                    endIcon={<ChevronRight size={12} />}
                                                                    sx={{ borderRadius: '7px', textTransform: 'none', fontWeight: 700, fontSize: '0.7rem', borderColor: alpha('#dc2626', 0.35), color: '#dc2626', flexShrink: 0, '&:hover': { borderColor: '#dc2626', bgcolor: alpha('#dc2626', 0.05) } }}>
                                                                View plan
                                                            </Button>
                                                        </Box>
                                                    )}

                                                    <Divider sx={{ mb: 1.5 }} />

                                                    {/* Contribution history — scoped to selected month */}
                                                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.25 }}>
                                                        Contributions — {monthLabel}
                                                    </Typography>
                                                    {selectedContributions.length === 0
                                                        ? <Typography sx={{ fontSize: '0.75rem', color: '#bbb', textAlign: 'center', py: 2 }}>
                                                            No contributions in {monthLabel}
                                                        </Typography>
                                                        : <>
                                                            {selectedContributions.map(c => <ContributionRow key={c.id} c={c} color={ENVELOPE_COLORS[selectedEnvelope.envelopeType]} />)}
                                                            <Box sx={{ mt: 1.5, p: 1.25, borderRadius: '8px', bgcolor: alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.06), border: `1px solid ${alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.15)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#333' }}>Total this month</Typography>
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
                                                        {envelopes.filter(e => e.status === 'ACTIVE' && isEnvelopeActiveInMonth(e, monthStart, monthEnd)).sort((a, b) => a.priority - b.priority).map(env => {
                                                            const c   = ENVELOPE_COLORS[env.envelopeType];
                                                            const pct = progressPct(env.currentAmount, env.targetAmount);
                                                            const vel = velocityDays(env);
                                                            return (
                                                                <Box key={env.id} onClick={() => setSelectedId(env.id)}
                                                                     sx={{ p: 1.5, borderRadius: '10px', cursor: 'pointer', border: `1px solid ${alpha(c, 0.2)}`, '&:hover': { bgcolor: alpha(c, 0.04), borderColor: alpha(c, 0.4) }, transition: 'all 0.15s' }}>
                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                            <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: c, flexShrink: 0 }} />
                                                                            <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#111' }}>{env.envelopeName}</Typography>
                                                                        </Box>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                            {env.contributionMode === 'AUTO' && <RefreshCcw size={9} color="#0284c7" />}
                                                                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: c, fontVariantNumeric: 'tabular-nums' }}>{pct.toFixed(0)}%</Typography>
                                                                        </Box>
                                                                    </Box>
                                                                    <LinearProgress variant="determinate" value={pct} sx={{ height: 4, borderRadius: 2, bgcolor: alpha(c, 0.12), '& .MuiLinearProgress-bar': { bgcolor: c, borderRadius: 2 } }} />
                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, alignItems: 'center' }}>
                                                                        <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>{fmt(env.currentAmount)} / {fmt(env.targetAmount)}</Typography>
                                                                        <VelocityChip days={vel} />
                                                                    </Box>
                                                                </Box>
                                                            );
                                                        })}
                                                    </Stack>
                                                    <Divider sx={{ my: 2 }} />
                                                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.25 }}>Upcoming Deadlines</Typography>
                                                    <Stack spacing={1}>
                                                        {envelopes.filter(e => e.status === 'ACTIVE' && e.targetDate && isEnvelopeActiveInMonth(e, monthStart, monthEnd))
                                                            .sort((a, b) => new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime())
                                                            .slice(0, 3)
                                                            .map(env => {
                                                                const days = daysUntil(env.targetDate)!;
                                                                const dc   = days <= 60 ? '#d97706' : '#16a34a';
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

                {/* ── PLANNER VIEW ──────────────────────────────────────────── */}
                {envelopeMode === 'multi' && (
                //     <Grow in timeout={350}>
                //         <Box>
                //             <Box sx={{ borderRadius: '14px', border: `1px solid ${alpha(MAROON, 0.15)}`, overflow: 'hidden', boxShadow: `0 4px 24px ${alpha(MAROON, 0.07)}`, mb: 3 }}>
                //                 <PanelHeader icon={<BarChart2 size={15} color="white" />} title="Priority Planner" subtitle={`Optimise monthly contributions across ${activeEnvelopes.length} active envelopes`} />
                //                 <Box sx={{ bgcolor: '#fff', px: 3, py: 2.5 }}>
                //                     <Grid container spacing={3} alignItems="flex-end">
                //                         <Grid item xs={12} sm={4}>
                //                             <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888', mb: 0.75 }}>Monthly Envelope Budget</Typography>
                //                             <TextField size="small" value={planBudget} fullWidth type="number"
                //                                        onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0) handlePlanBudgetChange(v); }}
                //                                        InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: '#aaa' }}>$</Typography></InputAdornment>, sx: { fontWeight: 800, borderRadius: '9px', fontSize: '0.9rem' } }}
                //                                        inputProps={{ min: 0, step: 10 }}
                //                                        sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: MAROON } }} />
                //                             <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.6 }}>
                //                                 <Typography sx={{ fontSize: '0.62rem', color: planSurplus >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                //                                     {planSurplus >= 0 ? `${fmt(planSurplus)} unallocated` : `${fmt(Math.abs(planSurplus))} over budget`}
                //                                 </Typography>
                //                                 <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>{fmt(planAllocated)} allocated</Typography>
                //                             </Box>
                //                             <LinearProgress variant="determinate" value={Math.min((planAllocated / Math.max(planBudget, 1)) * 100, 100)}
                //                                             sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: alpha(planSurplus < 0 ? '#dc2626' : '#16a34a', 0.12), '& .MuiLinearProgress-bar': { bgcolor: planSurplus < 0 ? '#dc2626' : '#16a34a', borderRadius: 2 } }} />
                //                         </Grid>
                //                         <Grid item xs={12} sm={4}>
                //                             <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888', mb: 0.75 }}>Planning Horizon</Typography>
                //                             <ToggleButtonGroup value={planTimeframe} exclusive onChange={(_, v) => v && setPlanTimeframe(v)} size="small"
                //                                                sx={{ width: '100%', '& .MuiToggleButton-root': { flex: 1, textTransform: 'none', fontWeight: 700, fontSize: '0.7rem', borderRadius: '8px !important', mx: 0.2 } }}>
                //                                 {[3, 4, 6, 12].map(m => (
                //                                     <ToggleButton key={m} value={m} sx={{ '&.Mui-selected': { bgcolor: alpha(MAROON, 0.1), color: MAROON, borderColor: `${alpha(MAROON, 0.3)} !important` }, '&:hover': { bgcolor: alpha(MAROON, 0.05) } }}>{m}mo</ToggleButton>
                //                                 ))}
                //                             </ToggleButtonGroup>
                //                             <Typography sx={{ fontSize: '0.62rem', color: '#aaa', mt: 0.6 }}>{withinHorizon.length} of {planResults.length} completable in {planTimeframe} months</Typography>
                //                         </Grid>
                //                         <Grid item xs={12} sm={4}>
                //                             <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { sm: 'flex-end' }, alignItems: 'center' }}>
                //                                 <Chip size="small" icon={allOnTrack ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                //                                       label={allOnTrack ? 'All on track' : `${criticalCount} need attention`}
                //                                       sx={{ fontWeight: 700, fontSize: '0.68rem', height: 24, bgcolor: allOnTrack ? alpha('#16a34a', 0.1) : alpha('#dc2626', 0.1), color: allOnTrack ? '#15803d' : '#dc2626', '& .MuiChip-icon': { color: allOnTrack ? '#15803d' : '#dc2626' } }} />
                //                                 <Button size="small" startIcon={<RefreshCw size={13} />} onClick={resetPlanToAuto}
                //                                         sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', border: '1px solid #d5d5d5', color: '#555', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: alpha(MAROON, 0.04) } }}>
                //                                     Auto-Reset
                //                                 </Button>
                //                             </Box>
                //                         </Grid>
                //                     </Grid>
                //                 </Box>
                //                 {!allOnTrack && (
                //                     <Box sx={{ px: 3, py: 1.5, bgcolor: alpha('#d97706', 0.07), borderTop: `1px solid ${alpha('#d97706', 0.18)}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                //                         <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: alpha('#d97706', 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Zap size={14} color="#d97706" /></Box>
                //                         <Box sx={{ flex: 1 }}>
                //                             <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e' }}>{criticalCount} envelope{criticalCount !== 1 ? 's' : ''} won't meet {criticalCount !== 1 ? 'their' : 'its'} target date at current allocations.</Typography>
                //                             <Typography sx={{ fontSize: '0.65rem', color: '#b45309' }}>Increase your monthly budget or lock lower amounts on flexible envelopes to redirect funds to critical ones.</Typography>
                //                         </Box>
                //                         <Button size="small" onClick={resetPlanToAuto} sx={{ borderRadius: '7px', textTransform: 'none', fontWeight: 700, fontSize: '0.7rem', bgcolor: alpha('#d97706', 0.15), color: '#92400e', flexShrink: 0, '&:hover': { bgcolor: alpha('#d97706', 0.25) } }}>Fix Auto</Button>
                //                     </Box>
                //                 )}
                //             </Box>
                //
                //             <Grid container spacing={3}>
                //                 <Grid item xs={12} lg={8}>
                //                     <Stack spacing={2}>
                //                         {withinHorizon.length > 0 && (
                //                             <Box>
                //                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                //                                     <Box sx={{ width: 6, height: 6, borderRadius: '2px', bgcolor: '#16a34a' }} />
                //                                     <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#16a34a' }}>Completable within {planTimeframe} months</Typography>
                //                                     <Chip size="small" label={withinHorizon.length} sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: alpha('#16a34a', 0.1), color: '#16a34a' }} />
                //                                 </Box>
                //                                 <Stack spacing={1.5}>
                //                                     {planEntries.filter(e => { const r = planResults.find(r => r.envelopeId === e.envelopeId); return r && r.monthsNeeded <= planTimeframe; }).map(entry => {
                //                                         const env = envMap.get(entry.envelopeId)!;
                //                                         const result = planResults.find(r => r.envelopeId === entry.envelopeId)!;
                //                                         const globalIdx = planEntries.findIndex(e => e.envelopeId === entry.envelopeId);
                //                                         return <PlannerRow key={entry.envelopeId} rank={entry.priority} entry={entry} env={env} result={result} total={planAllocated} onUp={() => movePlanUp(globalIdx)} onDown={() => movePlanDown(globalIdx)} onAlloc={v => handlePlanAlloc(entry.envelopeId, v)} onLock={() => handlePlanLock(entry.envelopeId)} isFirst={globalIdx === 0} isLast={globalIdx === planEntries.length - 1} animateIn timeout={300 + globalIdx * 60} />;
                //                                     })}
                //                                 </Stack>
                //                             </Box>
                //                         )}
                //                         {outsideHorizon.length > 0 && (
                //                             <Box>
                //                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, mt: withinHorizon.length > 0 ? 1 : 0 }}>
                //                                     <Box sx={{ width: 6, height: 6, borderRadius: '2px', bgcolor: '#d97706' }} />
                //                                     <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#d97706' }}>Beyond {planTimeframe}-month horizon</Typography>
                //                                     <Chip size="small" label={outsideHorizon.length} sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: alpha('#d97706', 0.1), color: '#d97706' }} />
                //                                 </Box>
                //                                 <Stack spacing={1.5}>
                //                                     {planEntries.filter(e => { const r = planResults.find(r => r.envelopeId === e.envelopeId); return r && r.monthsNeeded > planTimeframe; }).map(entry => {
                //                                         const env = envMap.get(entry.envelopeId)!;
                //                                         const result = planResults.find(r => r.envelopeId === entry.envelopeId)!;
                //                                         const globalIdx = planEntries.findIndex(e => e.envelopeId === entry.envelopeId);
                //                                         return <PlannerRow key={entry.envelopeId} rank={entry.priority} entry={entry} env={env} result={result} total={planAllocated} onUp={() => movePlanUp(globalIdx)} onDown={() => movePlanDown(globalIdx)} onAlloc={v => handlePlanAlloc(entry.envelopeId, v)} onLock={() => handlePlanLock(entry.envelopeId)} isFirst={globalIdx === 0} isLast={globalIdx === planEntries.length - 1} animateIn timeout={300 + globalIdx * 60} />;
                //                                     })}
                //                                 </Stack>
                //                             </Box>
                //                         )}
                //                     </Stack>
                //                 </Grid>
                //
                //                 <Grid item xs={12} lg={4}>
                //                     <Grow in timeout={500}>
                //                         <Box sx={{ position: 'sticky', top: 24, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}` }}>
                //                             <PanelHeader icon={<Target size={15} color="white" />} title="Plan Summary" subtitle="Projected completion per envelope" />
                //                             <Box sx={{ bgcolor: '#fff' }}>
                //                                 {planEntries.map((entry, i) => {
                //                                     const env    = envMap.get(entry.envelopeId)!;
                //                                     const result = planResults.find(r => r.envelopeId === entry.envelopeId)!;
                //                                     const c      = ENVELOPE_COLORS[env.envelopeType];
                //                                     const pct    = progressPct(env.currentAmount, env.targetAmount);
                //                                     return (
                //                                         <Box key={entry.envelopeId} sx={{ px: 2.5, py: 1.75, bgcolor: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: i < planEntries.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                //                                             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                //                                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                //                                                     <Box sx={{ width: 20, height: 20, borderRadius: '5px', bgcolor: alpha(c, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: c, flexShrink: 0 }}>{TYPE_ICONS[env.envelopeType]}</Box>
                //                                                     <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{env.envelopeName}</Typography>
                //                                                 </Box>
                //                                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                //                                                     {result.meetsTarget ? <CheckCircle size={11} color="#16a34a" /> : <AlertTriangle size={11} color="#dc2626" />}
                //                                                     <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: result.meetsTarget ? '#15803d' : '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
                //                                                         {result.projectedDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                //                                                     </Typography>
                //                                                 </Box>
                //                                             </Box>
                //                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                //                                                 <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>{fmt(env.currentAmount)} / {fmt(env.targetAmount)}</Typography>
                //                                                 <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: c }}>{fmt(entry.monthlyAlloc)}/mo</Typography>
                //                                             </Box>
                //                                             <LinearProgress variant="determinate" value={pct} sx={{ height: 4, borderRadius: 2, bgcolor: alpha(c, 0.1), '& .MuiLinearProgress-bar': { bgcolor: c, borderRadius: 2 } }} />
                //                                         </Box>
                //                                     );
                //                                 })}
                //                                 <Box sx={{ px: 2.5, py: 1.75, bgcolor: alpha(MAROON, 0.04), borderTop: `1px solid ${alpha(MAROON, 0.12)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                //                                     <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: MAROON }}>Total Monthly</Typography>
                //                                     <Typography sx={{ fontSize: '0.92rem', fontWeight: 900, color: MAROON, fontVariantNumeric: 'tabular-nums' }}>{fmt(planAllocated)}</Typography>
                //                                 </Box>
                //                                 <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1, borderTop: '1px solid #f0f0f0' }}>
                //                                     <Info size={12} color="#bbb" style={{ marginTop: 2, flexShrink: 0 }} />
                //                                     <Typography sx={{ fontSize: '0.65rem', color: '#bbb', lineHeight: 1.5 }}>Click "Apply Plan" to save these allocations. Lock rows to protect them from auto-rebalancing.</Typography>
                //                                 </Box>
                //                             </Box>
                //                         </Box>
                //                     </Grow>
                //                 </Grid>
                //             </Grid>
                //         </Box>
                //     </Grow>
                // )}
                    <Grow in timeout={350}>
                        <Box>
                            <MultiEnvelopeDashboard
                                envelopes={envelopes}
                                contributions={contributions}
                                monthStart={monthStart}
                                monthEnd={monthEnd}
                                monthLabel={monthLabel}
                                planEntries={planEntries}
                                planResults={planResults}
                                planBudget={planBudget}
                                onBudgetChange={handlePlanBudgetChange}
                                onAlloc={handlePlanAlloc}
                                onLock={handlePlanLock}
                                onMoveUp={movePlanUp}
                                onMoveDown={movePlanDown}
                                onAutoReset={resetPlanToAuto}
                                onApplyPlan={handleApplyPlan}
                            />
                        </Box>
                    </Grow>
                )}
            </Container>

            {/* Dialogs */}
            <ManualContributionDialog open={contribOpen} envelope={contribEnvelope} onClose={() => setContribOpen(false)} onSubmit={handleAddContribution} onSetupAuto={handleSetupAuto} />
            <AffordabilityDialog open={affordOpen} envelopes={activeEnvelopes} onClose={() => setAffordOpen(false)} onApplyAll={handleApplyAffordability} />
            <CreateEnvelopeDialog open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={async data => { console.log('New envelope:', data); setCreateOpen(false); }} />
            <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackOpen(false)} severity={snackSev} sx={{ width: '100%', borderRadius: 2 }}>{snackMsg}</Alert>
            </Snackbar>
        </Box>
    );
};

export default BudgetEnvelopesPage;
// import React, { useCallback, useEffect, useMemo, useState } from 'react';
// import {
//     alpha, Box, Button, Chip, CircularProgress, Container,
//     Divider, Grid, Grow, IconButton, InputAdornment,
//     LinearProgress, Skeleton, Snackbar, Alert, Stack,
//     TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
// } from '@mui/material';
// import {
//     Plus, Target, Wallet, TrendingUp, CheckCircle, PauseCircle,
//     XCircle, PiggyBank, Calendar, Flame, MoreHorizontal,
//     ArrowUpRight, Clock, Layers, BarChart2,
//     ArrowUp, ArrowDown, AlertTriangle, Zap, RefreshCw, Info,
//     ChevronRight, Lock, Unlock,
// } from 'lucide-react';
// import Sidebar from './Sidebar';
// import CreateEnvelopeDialog from './CreateEnvelopeDialog';
//
// // ── Design tokens ────────────────────────────────────────────────────────────
// const MAROON      = '#6b1a1a';
// const MAROON_DARK = '#4a1010';
//
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
//     ACTIVE:    { label: 'Active',    color: '#16a34a', icon: <TrendingUp  size={11} /> },
//     COMPLETED: { label: 'Completed', color: '#0284c7', icon: <CheckCircle size={11} /> },
//     PAUSED:    { label: 'Paused',    color: '#d97706', icon: <PauseCircle size={11} /> },
//     CANCELLED: { label: 'Cancelled', color: '#94a3b8', icon: <XCircle     size={11} /> },
// };
//
// const TYPE_ICONS: Record<string, React.ReactNode> = {
//     SAVINGS:   <PiggyBank size={14} />,
//     PAYOFF:    <XCircle   size={14} />,
//     PURCHASE:  <Wallet    size={14} />,
//     EMERGENCY: <Flame     size={14} />,
// };
//
// // ── Types ────────────────────────────────────────────────────────────────────
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
// interface PlanEntry {
//     envelopeId:   number;
//     priority:     number;
//     monthlyAlloc: number;
//     locked:       boolean;
//     autoAlloc:    number;
// }
//
// interface PlanResult {
//     envelopeId:    number;
//     monthlyAlloc:  number;
//     projectedDate: Date;
//     meetsTarget:   boolean;
//     monthsNeeded:  number;
//     shortfall:     number;
// }
//
// // ── Mock data ────────────────────────────────────────────────────────────────
// const MOCK_ENVELOPES: BudgetEnvelope[] = [
//     { id: 1, envelopeName: 'Car Repair Fund',  envelopeType: 'EMERGENCY', description: 'Set aside for unexpected car repairs',  targetAmount: 1500, allocatedAmount: 200, currentAmount: 875,  remainingAmount: 625,  contributionFrequency: 'MONTHLY', startDate: '2026-01-01', targetDate: '2026-09-01', status: 'ACTIVE',    priority: 1 },
//     { id: 2, envelopeName: 'Pay Off TV',        envelopeType: 'PAYOFF',    description: 'Samsung 65" — 0% APR ends Oct',        targetAmount: 899,  allocatedAmount: 150, currentAmount: 450,  remainingAmount: 449,  contributionFrequency: 'MONTHLY', startDate: '2026-01-01', targetDate: '2026-10-01', status: 'ACTIVE',    priority: 2 },
//     { id: 3, envelopeName: 'Vacation Fund',     envelopeType: 'SAVINGS',   description: 'Summer trip to Colorado',              targetAmount: 3000, allocatedAmount: 300, currentAmount: 2700, remainingAmount: 300,  contributionFrequency: 'MONTHLY', startDate: '2025-09-01', targetDate: '2026-07-01', status: 'ACTIVE',    priority: 3 },
//     { id: 4, envelopeName: 'New Laptop',        envelopeType: 'PURCHASE',  description: 'MacBook Pro M4',                       targetAmount: 2500, allocatedAmount: 250, currentAmount: 2500, remainingAmount: 0,    contributionFrequency: 'MONTHLY', startDate: '2025-06-01', targetDate: '2026-03-01', status: 'COMPLETED', priority: 4 },
//     { id: 5, envelopeName: 'Holiday Gifts',     envelopeType: 'SAVINGS',   description: 'Christmas & holiday shopping',         targetAmount: 800,  allocatedAmount: 100, currentAmount: 200,  remainingAmount: 600,  contributionFrequency: 'MONTHLY', startDate: '2026-02-01', targetDate: '2026-12-01', status: 'ACTIVE',    priority: 5 },
//     { id: 6, envelopeName: 'Home Maintenance',  envelopeType: 'EMERGENCY', description: 'HVAC, plumbing, general repairs',      targetAmount: 2000, allocatedAmount: 150, currentAmount: 550,  remainingAmount: 1450, contributionFrequency: 'MONTHLY', startDate: '2026-01-01',                            status: 'PAUSED',    priority: 6 },
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
// // ── Helpers ──────────────────────────────────────────────────────────────────
// const fmt = (n: number) =>
//     `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
//
// function daysUntil(dateStr?: string): number | null {
//     if (!dateStr) return null;
//     return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
// }
//
// function progressPct(current: number, target: number) {
//     if (target <= 0) return 100;
//     return Math.min((current / target) * 100, 100);
// }
//
// function monthsBetween(from: Date, to: Date) {
//     return Math.max(
//         (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()),
//         1
//     );
// }
//
// function addMonths(base: Date, n: number) {
//     const d = new Date(base);
//     d.setMonth(d.getMonth() + n);
//     return d;
// }
//
// function projectedCompletion(remaining: number, monthly: number): Date {
//     if (monthly <= 0) return addMonths(new Date(), 999);
//     return addMonths(new Date(), Math.ceil(remaining / monthly));
// }
//
// function urgencyScore(env: BudgetEnvelope): number {
//     let score = 0;
//     if (env.targetDate) {
//         const days = Math.max((new Date(env.targetDate).getTime() - Date.now()) / 86400000, 1);
//         score += 10000 / days;
//     }
//     if (env.envelopeType === 'PAYOFF')    score += 500;
//     if (env.envelopeType === 'EMERGENCY') score += 300;
//     score += (env.targetAmount > 0 ? env.remainingAmount / env.targetAmount : 0) * 100;
//     return score;
// }
//
// function distributeAuto(entries: PlanEntry[], envelopes: BudgetEnvelope[], budget: number): PlanEntry[] {
//     const locked    = entries.filter(e => e.locked);
//     const unlocked  = entries.filter(e => !e.locked);
//     const lockedSum = locked.reduce((s, e) => s + e.monthlyAlloc, 0);
//     const remaining = Math.max(budget - lockedSum, 0);
//     const envMap    = new Map(envelopes.map(e => [e.id, e]));
//     const scores    = unlocked.map(e => ({ id: e.envelopeId, score: urgencyScore(envMap.get(e.envelopeId)!) }));
//     const total     = scores.reduce((s, x) => s + x.score, 0);
//     return entries.map(entry => {
//         if (entry.locked) return entry;
//         const sc    = scores.find(s => s.id === entry.envelopeId);
//         const alloc = total > 0 ? (sc!.score / total) * remaining : remaining / unlocked.length;
//         const rounded = Math.round(alloc * 100) / 100;
//         return { ...entry, monthlyAlloc: rounded, autoAlloc: rounded };
//     });
// }
//
// function computeResults(entries: PlanEntry[], envelopes: BudgetEnvelope[]): PlanResult[] {
//     const envMap = new Map(envelopes.map(e => [e.id, e]));
//     return entries.map(entry => {
//         const env          = envMap.get(entry.envelopeId)!;
//         const remaining    = env.remainingAmount;
//         const monthly      = entry.monthlyAlloc;
//         const projDate     = projectedCompletion(remaining, monthly);
//         const targetDate   = env.targetDate ? new Date(env.targetDate) : null;
//         const meetsTarget  = !targetDate || projDate <= targetDate;
//         const monthsNeeded = monthly > 0 ? Math.ceil(remaining / monthly) : 999;
//         const shortfall    = targetDate && !meetsTarget
//             ? Math.round((projDate.getTime() - targetDate.getTime()) / 86400000) : 0;
//         return { envelopeId: entry.envelopeId, monthlyAlloc: monthly, projectedDate: projDate, meetsTarget, monthsNeeded, shortfall };
//     });
// }
//
// // ── Shared panel header ──────────────────────────────────────────────────────
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
// // ── Envelope card ────────────────────────────────────────────────────────────
// const EnvelopeCard: React.FC<{
//     envelope: BudgetEnvelope;
//     animateIn: boolean;
//     timeout: number;
//     onClick: () => void;
// }> = ({ envelope, animateIn, timeout, onClick }) => {
//     const pct      = progressPct(envelope.currentAmount, envelope.targetAmount);
//     const color    = ENVELOPE_COLORS[envelope.envelopeType] ?? MAROON;
//     const status   = STATUS_META[envelope.status];
//     const days     = daysUntil(envelope.targetDate);
//     const isUrgent = days !== null && days <= 60 && envelope.status === 'ACTIVE';
//
//     return (
//         <Grow in={animateIn} timeout={timeout}>
//             <Box onClick={onClick} sx={{
//                 background: '#fff', borderRadius: '12px',
//                 border: `1px solid ${alpha(color, 0.2)}`,
//                 borderTop: `3px solid ${color}`,
//                 boxShadow: '0 2px 12px rgba(0,0,0,0.07)', p: 2.5, cursor: 'pointer',
//                 transition: 'box-shadow 0.2s, transform 0.15s',
//                 '&:hover': { boxShadow: `0 6px 24px ${alpha(color, 0.18)}`, transform: 'translateY(-2px)' },
//                 position: 'relative', overflow: 'hidden',
//             }}>
//                 {envelope.status === 'COMPLETED' && (
//                     <Box sx={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', bgcolor: alpha('#16a34a', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                         <CheckCircle size={16} color="#16a34a" />
//                     </Box>
//                 )}
//                 <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                         <Box sx={{ width: 34, height: 34, borderRadius: '9px', bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                             {envelope.envelopeType === 'SAVINGS'   && <PiggyBank size={16} color={color} />}
//                             {envelope.envelopeType === 'PAYOFF'    && <XCircle   size={16} color={color} />}
//                             {envelope.envelopeType === 'PURCHASE'  && <Wallet    size={16} color={color} />}
//                             {envelope.envelopeType === 'EMERGENCY' && <Flame     size={16} color={color} />}
//                         </Box>
//                         <Box>
//                             <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#111', lineHeight: 1.2 }}>{envelope.envelopeName}</Typography>
//                             <Typography sx={{ fontSize: '0.65rem', color: '#888', mt: 0.1 }}>{envelope.description}</Typography>
//                         </Box>
//                     </Box>
//                 </Box>
//                 <Box sx={{ display: 'flex', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
//                     <Chip size="small" label={ENVELOPE_TYPE_LABELS[envelope.envelopeType]}
//                           sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(color, 0.1), color }} />
//                     <Chip size="small"
//                           icon={<Box sx={{ display: 'flex', alignItems: 'center', color: status.color, ml: 0.5 }}>{status.icon}</Box>}
//                           label={status.label}
//                           sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(status.color, 0.1), color: status.color, '& .MuiChip-icon': { ml: '4px', mr: '-2px' } }} />
//                     {isUrgent && (
//                         <Chip size="small" label={`${days}d left`} icon={<Clock size={9} />}
//                               sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha('#d97706', 0.1), color: '#d97706', '& .MuiChip-icon': { ml: '4px', mr: '-2px', color: '#d97706' } }} />
//                     )}
//                 </Box>
//                 <Box sx={{ mb: 1.5 }}>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
//                         <Typography sx={{ fontSize: '0.72rem', color: '#555', fontWeight: 600 }}>{fmt(envelope.currentAmount)} saved</Typography>
//                         <Typography sx={{ fontSize: '0.72rem', color: '#555', fontWeight: 700 }}>{pct.toFixed(0)}%</Typography>
//                     </Box>
//                     <LinearProgress variant="determinate" value={pct}
//                                     sx={{ height: 6, borderRadius: 3, bgcolor: alpha(color, 0.12), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }} />
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
//                         <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>Goal: {fmt(envelope.targetAmount)}</Typography>
//                         {envelope.remainingAmount > 0
//                             ? <Typography sx={{ fontSize: '0.62rem', color, fontWeight: 700 }}>{fmt(envelope.remainingAmount)} to go</Typography>
//                             : <Typography sx={{ fontSize: '0.62rem', color: '#16a34a', fontWeight: 700 }}>Goal reached! 🎉</Typography>}
//                     </Box>
//                 </Box>
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
// // ── Contribution row ─────────────────────────────────────────────────────────
// const ContributionRow: React.FC<{ c: EnvelopeContribution; color: string }> = ({ c, color }) => (
//     <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${alpha('#000', 0.05)}`, '&:last-child': { borderBottom: 'none' } }}>
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
//             <Box sx={{ width: 28, height: 28, borderRadius: '7px', bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                 <ArrowUpRight size={13} color={color} />
//             </Box>
//             <Box>
//                 <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#111' }}>{c.note || 'Contribution'}</Typography>
//                 <Typography sx={{ fontSize: '0.62rem', color: '#888' }}>
//                     {new Date(c.contributedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
//                 </Typography>
//             </Box>
//         </Box>
//         <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color, fontVariantNumeric: 'tabular-nums' }}>+{fmt(c.amount)}</Typography>
//     </Box>
// );
//
// // ── Planner priority row ─────────────────────────────────────────────────────
// const PlannerRow: React.FC<{
//     rank:      number;
//     entry:     PlanEntry;
//     env:       BudgetEnvelope;
//     result:    PlanResult;
//     total:     number;
//     onUp:      () => void;
//     onDown:    () => void;
//     onAlloc:   (v: number) => void;
//     onLock:    () => void;
//     isFirst:   boolean;
//     isLast:    boolean;
//     animateIn: boolean;
//     timeout:   number;
// }> = ({ rank, entry, env, result, total, onUp, onDown, onAlloc, onLock, isFirst, isLast, animateIn, timeout }) => {
//     const color    = ENVELOPE_COLORS[env.envelopeType];
//     const pct      = total > 0 ? (entry.monthlyAlloc / total) * 100 : 0;
//     const score    = urgencyScore(env);
//     const urgLabel = score > 800 ? 'Critical' : score > 400 ? 'High' : score > 150 ? 'Medium' : 'Low';
//     const urgColor = score > 800 ? '#dc2626' : score > 400 ? '#d97706' : score > 150 ? '#0284c7' : '#16a34a';
//     const daysLeft = daysUntil(env.targetDate);
//
//     return (
//         <Grow in={animateIn} timeout={timeout}>
//             <Box sx={{
//                 borderRadius: '12px',
//                 border: `1.5px solid ${entry.locked ? alpha(color, 0.4) : alpha('#000', 0.08)}`,
//                 bgcolor: entry.locked ? alpha(color, 0.025) : '#fff',
//                 overflow: 'hidden',
//                 transition: 'all 0.18s',
//                 '&:hover': { borderColor: alpha(color, 0.35), boxShadow: `0 3px 14px ${alpha(color, 0.1)}` },
//             }}>
//                 {/* Header row */}
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderBottom: `1px solid ${alpha('#000', 0.05)}` }}>
//                     {/* Rank badge */}
//                     <Box sx={{
//                         width: 30, height: 30, borderRadius: '8px', flexShrink: 0,
//                         background: rank === 1
//                             ? `linear-gradient(135deg, ${MAROON_DARK}, ${MAROON})`
//                             : rank === 2 ? 'linear-gradient(135deg, #374151, #6b7280)'
//                                 : alpha('#000', 0.07),
//                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                     }}>
//                         <Typography sx={{ fontSize: '0.72rem', fontWeight: 900, color: rank <= 2 ? '#fff' : '#888' }}>#{rank}</Typography>
//                     </Box>
//
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
//                         <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
//                             {TYPE_ICONS[env.envelopeType]}
//                         </Box>
//                         <Box sx={{ minWidth: 0 }}>
//                             <Typography sx={{ fontWeight: 800, fontSize: '0.83rem', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                                 {env.envelopeName}
//                             </Typography>
//                             <Box sx={{ display: 'flex', gap: 0.5, mt: 0.2, flexWrap: 'wrap' }}>
//                                 <Chip size="small" label={urgLabel}
//                                       sx={{ height: 15, fontSize: '0.57rem', fontWeight: 800, bgcolor: alpha(urgColor, 0.1), color: urgColor }} />
//                                 {daysLeft !== null && daysLeft <= 90 && (
//                                     <Chip size="small" label={`${daysLeft}d left`} icon={<Clock size={8} />}
//                                           sx={{ height: 15, fontSize: '0.57rem', fontWeight: 700, bgcolor: alpha('#d97706', 0.1), color: '#d97706', '& .MuiChip-icon': { ml: '3px', mr: '-2px', color: '#d97706' } }} />
//                                 )}
//                                 {entry.locked && (
//                                     <Chip size="small" label="locked"
//                                           sx={{ height: 15, fontSize: '0.57rem', fontWeight: 700, bgcolor: alpha(color, 0.12), color }} />
//                                 )}
//                             </Box>
//                         </Box>
//                     </Box>
//
//                     {/* Reorder arrows */}
//                     <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
//                         <IconButton size="small" onClick={onUp} disabled={isFirst}
//                                     sx={{ p: 0.3, borderRadius: '5px', '&:hover': { bgcolor: alpha(MAROON, 0.08) }, '&.Mui-disabled': { opacity: 0.2 } }}>
//                             <ArrowUp size={12} color={MAROON} />
//                         </IconButton>
//                         <IconButton size="small" onClick={onDown} disabled={isLast}
//                                     sx={{ p: 0.3, borderRadius: '5px', '&:hover': { bgcolor: alpha(MAROON, 0.08) }, '&.Mui-disabled': { opacity: 0.2 } }}>
//                             <ArrowDown size={12} color={MAROON} />
//                         </IconButton>
//                     </Box>
//                 </Box>
//
//                 {/* Body */}
//                 <Box sx={{ px: 2, py: 1.5 }}>
//                     <Grid container spacing={2} alignItems="center">
//                         {/* Allocation control */}
//                         <Grid item xs={12} sm={6}>
//                             <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', mb: 0.75 }}>
//                                 Monthly Contribution
//                             </Typography>
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                 <TextField size="small"
//                                            value={entry.monthlyAlloc}
//                                            onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0) onAlloc(v); }}
//                                            type="number"
//                                            InputProps={{
//                                                startAdornment: <InputAdornment position="start">
//                                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa' }}>$</Typography>
//                                                </InputAdornment>,
//                                                sx: { fontSize: '0.82rem', fontWeight: 800, borderRadius: '8px' },
//                                            }}
//                                            inputProps={{ min: 0, step: 5 }}
//                                            sx={{ width: 120, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
//                                 />
//                                 <Tooltip title={entry.locked ? 'Unlock — allow auto-distribute to adjust' : 'Lock — protect from auto-distribute'}>
//                                     <IconButton size="small" onClick={onLock}
//                                                 sx={{
//                                                     borderRadius: '7px',
//                                                     border: `1.5px solid ${entry.locked ? color : alpha('#000', 0.15)}`,
//                                                     bgcolor: entry.locked ? alpha(color, 0.1) : 'transparent',
//                                                     color: entry.locked ? color : '#bbb',
//                                                     '&:hover': { borderColor: color, color, bgcolor: alpha(color, 0.08) },
//                                                     p: 0.6,
//                                                 }}>
//                                         {entry.locked ? <Lock size={12} /> : <Unlock size={12} />}
//                                     </IconButton>
//                                 </Tooltip>
//                             </Box>
//                             <Box sx={{ mt: 1 }}>
//                                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.35 }}>
//                                     <Typography sx={{ fontSize: '0.58rem', color: '#bbb' }}>{pct.toFixed(1)}% of total</Typography>
//                                     <Typography sx={{ fontSize: '0.58rem', color: '#bbb' }}>{fmt(entry.autoAlloc)} suggested</Typography>
//                                 </Box>
//                                 <LinearProgress variant="determinate" value={Math.min(pct, 100)}
//                                                 sx={{ height: 4, borderRadius: 2, bgcolor: alpha(color, 0.1), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 } }} />
//                             </Box>
//                         </Grid>
//
//                         {/* Projection */}
//                         <Grid item xs={12} sm={6}>
//                             <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', mb: 0.75 }}>
//                                 Projection
//                             </Typography>
//                             <Box sx={{
//                                 p: 1.25, borderRadius: '8px',
//                                 bgcolor: result.meetsTarget ? alpha('#16a34a', 0.06) : alpha('#dc2626', 0.06),
//                                 border: `1px solid ${result.meetsTarget ? alpha('#16a34a', 0.2) : alpha('#dc2626', 0.2)}`,
//                             }}>
//                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.3 }}>
//                                     {result.meetsTarget ? <CheckCircle size={12} color="#16a34a" /> : <AlertTriangle size={12} color="#dc2626" />}
//                                     <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: result.meetsTarget ? '#15803d' : '#dc2626' }}>
//                                         {result.projectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
//                                     </Typography>
//                                 </Box>
//                                 <Typography sx={{ fontSize: '0.65rem', color: '#555', lineHeight: 1.4 }}>
//                                     {result.meetsTarget
//                                         ? env.targetDate
//                                             ? `On track — ${result.monthsNeeded}mo to goal ✓`
//                                             : `${result.monthsNeeded} months to goal`
//                                         : `${result.shortfall}d late — needs ${fmt(env.remainingAmount / Math.max(monthsBetween(new Date(), new Date(env.targetDate!)), 1))}/mo`
//                                     }
//                                 </Typography>
//                             </Box>
//                         </Grid>
//                     </Grid>
//                 </Box>
//             </Box>
//         </Grow>
//     );
// };
//
// // ════════════════════════════════════════════════════════════════════════════
// // ── Main Page ────────────────────────────────────────────────────────────────
// // ════════════════════════════════════════════════════════════════════════════
// type PageView = 'envelopes' | 'planner';
//
// const BudgetEnvelopesPage: React.FC = () => {
//     // ── UI state ────────────────────────────────────────────────────────────
//     const [animateIn,  setAnimateIn]  = useState(false);
//     const [isLoading,  setIsLoading]  = useState(false);
//     const [pageView,   setPageView]   = useState<PageView>('envelopes');
//     const [createOpen, setCreateOpen] = useState(false);
//     const [snackOpen,  setSnackOpen]  = useState(false);
//     const [snackMsg,   setSnackMsg]   = useState('');
//     const [snackSev,   setSnackSev]   = useState<'success'|'error'|'info'|'warning'>('success');
//
//     // ── Data state ──────────────────────────────────────────────────────────
//     const [envelopes,     setEnvelopes]     = useState<BudgetEnvelope[]>([]);
//     const [contributions, setContributions] = useState<EnvelopeContribution[]>([]);
//     const [selectedId,    setSelectedId]    = useState<number | null>(null);
//     const [filterStatus,  setFilterStatus]  = useState<string>('ALL');
//     const [filterType,    setFilterType]    = useState<string>('ALL');
//
//     // ── Planner state ───────────────────────────────────────────────────────
//     const [planBudget,    setPlanBudget]    = useState<number>(0);
//     const [planEntries,   setPlanEntries]   = useState<PlanEntry[]>([]);
//     const [planTimeframe, setPlanTimeframe] = useState<number>(4);
//     const [planApplied,   setPlanApplied]   = useState(false);
//
//     // ── Init ────────────────────────────────────────────────────────────────
//     useEffect(() => {
//         document.title = 'Envelopes';
//         setTimeout(() => setAnimateIn(true), 100);
//         setIsLoading(true);
//         setTimeout(() => {
//             setEnvelopes(MOCK_ENVELOPES);
//             setContributions(MOCK_CONTRIBUTIONS);
//             setIsLoading(false);
//         }, 600);
//         return () => { document.title = 'BudgetBuddy'; };
//     }, []);
//
//     const activeEnvelopes = useMemo(() => envelopes.filter(e => e.status === 'ACTIVE'), [envelopes]);
//     const defaultBudget   = useMemo(() => activeEnvelopes.reduce((s, e) => s + e.allocatedAmount, 0), [activeEnvelopes]);
//
//     // Init planner when switching to planner view
//     useEffect(() => {
//         if (pageView !== 'planner' || activeEnvelopes.length === 0) return;
//         const budget = defaultBudget;
//         const sorted = [...activeEnvelopes].sort((a, b) => urgencyScore(b) - urgencyScore(a));
//         const initial: PlanEntry[] = sorted.map((env, i) => ({
//             envelopeId: env.id, priority: i + 1,
//             monthlyAlloc: env.allocatedAmount, locked: false, autoAlloc: env.allocatedAmount,
//         }));
//         setPlanEntries(distributeAuto(initial, activeEnvelopes, budget));
//         setPlanBudget(budget);
//         setPlanApplied(false);
//     }, [pageView, activeEnvelopes, defaultBudget]);
//
//     // ── Planner handlers ────────────────────────────────────────────────────
//     const redistributePlan = useCallback((budget: number, entries: PlanEntry[]) => {
//         setPlanEntries(distributeAuto(entries, activeEnvelopes, budget));
//     }, [activeEnvelopes]);
//
//     const handlePlanBudgetChange = (v: number) => {
//         setPlanBudget(v);
//         redistributePlan(v, planEntries);
//     };
//
//     const handlePlanAlloc = (id: number, v: number) =>
//         setPlanEntries(prev => prev.map(e => e.envelopeId === id ? { ...e, monthlyAlloc: v } : e));
//
//     const handlePlanLock = (id: number) =>
//         setPlanEntries(prev => prev.map(e => e.envelopeId === id ? { ...e, locked: !e.locked } : e));
//
//     const movePlanUp = (idx: number) => {
//         if (idx === 0) return;
//         setPlanEntries(prev => {
//             const next = [...prev];
//             [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
//             return next.map((e, i) => ({ ...e, priority: i + 1 }));
//         });
//     };
//
//     const movePlanDown = (idx: number) => {
//         setPlanEntries(prev => {
//             if (idx >= prev.length - 1) return prev;
//             const next = [...prev];
//             [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
//             return next.map((e, i) => ({ ...e, priority: i + 1 }));
//         });
//     };
//
//     const resetPlanToAuto = () => {
//         const sorted = [...activeEnvelopes].sort((a, b) => urgencyScore(b) - urgencyScore(a));
//         const reset: PlanEntry[] = sorted.map((env, i) => ({
//             envelopeId: env.id, priority: i + 1,
//             monthlyAlloc: env.allocatedAmount, locked: false, autoAlloc: env.allocatedAmount,
//         }));
//         setPlanEntries(distributeAuto(reset, activeEnvelopes, planBudget));
//     };
//
//     const handleApplyPlan = () => {
//         setEnvelopes(prev => prev.map(e => {
//             const entry = planEntries.find(p => p.envelopeId === e.id);
//             return entry ? { ...e, allocatedAmount: entry.monthlyAlloc } : e;
//         }));
//         setPlanApplied(true);
//         setSnackMsg('Priority plan applied — allocations updated!');
//         setSnackSev('success');
//         setSnackOpen(true);
//         setTimeout(() => {
//             setPlanApplied(false);
//             setPageView('envelopes');
//         }, 1400);
//     };
//
//     // ── Derived planner values ──────────────────────────────────────────────
//     const planResults    = useMemo(() => computeResults(planEntries, activeEnvelopes), [planEntries, activeEnvelopes]);
//     const planAllocated  = planEntries.reduce((s, e) => s + e.monthlyAlloc, 0);
//     const planSurplus    = planBudget - planAllocated;
//     const allOnTrack     = planResults.every(r => r.meetsTarget);
//     const criticalCount  = planResults.filter(r => !r.meetsTarget).length;
//     const envMap         = useMemo(() => new Map(activeEnvelopes.map(e => [e.id, e])), [activeEnvelopes]);
//     const withinHorizon  = planResults.filter(r => r.monthsNeeded <= planTimeframe);
//     const outsideHorizon = planResults.filter(r => r.monthsNeeded > planTimeframe);
//
//     // ── Envelope view derived ───────────────────────────────────────────────
//     const selectedEnvelope      = useMemo(() => envelopes.find(e => e.id === selectedId) ?? null, [envelopes, selectedId]);
//     const selectedContributions = useMemo(() => contributions.filter(c => c.envelopeId === selectedId), [contributions, selectedId]);
//     const filtered = useMemo(() => envelopes.filter(e => {
//         const statusOk = filterStatus === 'ALL' || e.status === filterStatus;
//         const typeOk   = filterType   === 'ALL' || e.envelopeType === filterType;
//         return statusOk && typeOk;
//     }), [envelopes, filterStatus, filterType]);
//
//     const stats = useMemo(() => {
//         const active = envelopes.filter(e => e.status === 'ACTIVE');
//         return {
//             totalEnvelopes: active.length,
//             totalAllocated: active.reduce((s, e) => s + e.allocatedAmount, 0),
//             totalSaved:     active.reduce((s, e) => s + e.currentAmount,   0),
//             totalTarget:    active.reduce((s, e) => s + e.targetAmount,    0),
//             completed:      envelopes.filter(e => e.status === 'COMPLETED').length,
//         };
//     }, [envelopes]);
//
//     const overallPct = stats.totalTarget > 0 ? Math.min((stats.totalSaved / stats.totalTarget) * 100, 100) : 0;
//
//     const filterBtn = (label: string, value: string, current: string, setter: (v: string) => void) => (
//         <Button key={value} size="small" onClick={() => setter(value)}
//                 variant={current === value ? 'contained' : 'outlined'}
//                 sx={{
//                     borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem',
//                     ...(current === value
//                         ? { bgcolor: MAROON, color: '#fff', borderColor: MAROON, '&:hover': { bgcolor: MAROON_DARK } }
//                         : { borderColor: '#d5d5d5', color: '#555', bgcolor: '#fff', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: alpha(MAROON, 0.04) } }),
//                 }}>
//             {label}
//         </Button>
//     );
//
//     // ════════════════════════════════════════════════════════════════════════
//     return (
//         <Box sx={{ maxWidth: 'calc(100% - 240px)', ml: '240px', minHeight: '100vh', background: '#f0f2f5' }}>
//             <Sidebar />
//
//             {isLoading && (
//                 <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
//                     <CircularProgress size={52} thickness={4} sx={{ color: MAROON, mb: 2.5 }} />
//                     <Typography variant="h6" sx={{ fontWeight: 700, color: '#111', mb: 0.5 }}>Loading Envelopes</Typography>
//                     <Typography variant="body2" color="text.secondary">Fetching your savings goals…</Typography>
//                 </Box>
//             )}
//
//             <Container maxWidth="xl" sx={{ py: 4 }}>
//
//                 {/* ── Page header ─────────────────────────────────────────── */}
//                 <Grow in={animateIn} timeout={400}>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
//                         <Box>
//                             <Box sx={{ width: 28, height: 3, background: MAROON, borderRadius: '2px', mb: 0.75 }} />
//                             <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#111', letterSpacing: '-0.025em' }}>
//                                 Budget Envelopes
//                             </Typography>
//                             <Typography variant="subtitle1" sx={{ color: '#888', mt: 0.5 }}>
//                                 {pageView === 'envelopes'
//                                     ? 'Dedicated funds for your short- and medium-term goals'
//                                     : 'Optimise how your budget is distributed across active envelopes'}
//                             </Typography>
//                         </Box>
//
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
//
//                             {/* ── View toggle pill ───────────────────────── */}
//                             <Box sx={{ display: 'flex', p: '4px', borderRadius: '12px', bgcolor: '#e4e4e7', gap: '3px' }}>
//                                 {([
//                                     { view: 'envelopes' as PageView, label: 'Envelopes',       icon: <Wallet    size={13} /> },
//                                     { view: 'planner'  as PageView, label: 'Priority Planner', icon: <BarChart2 size={13} />, disabled: activeEnvelopes.length < 2 },
//                                 ]).map(({ view, label, icon, disabled }) => (
//                                     <Tooltip key={view} title={disabled ? 'Add at least 2 active envelopes to use the planner' : ''}>
//                                         <Box>
//                                             <Button size="small" disabled={disabled} onClick={() => setPageView(view)}
//                                                     startIcon={icon}
//                                                     sx={{
//                                                         borderRadius: '8px', textTransform: 'none',
//                                                         fontWeight: 700, fontSize: '0.78rem',
//                                                         px: 1.75, py: 0.7, minWidth: 0,
//                                                         transition: 'all 0.18s',
//                                                         ...(pageView === view
//                                                                 ? { bgcolor: '#fff', color: MAROON, boxShadow: '0 1px 6px rgba(0,0,0,0.13)', '&:hover': { bgcolor: '#fff' } }
//                                                                 : { bgcolor: 'transparent', color: '#71717a', '&:hover': { bgcolor: alpha('#fff', 0.55), color: '#333' } }
//                                                         ),
//                                                         '&.Mui-disabled': { bgcolor: 'transparent', color: '#c4c4c4' },
//                                                     }}>
//                                                 {label}
//                                             </Button>
//                                         </Box>
//                                     </Tooltip>
//                                 ))}
//                             </Box>
//
//                             {/* ── Context action button ──────────────────── */}
//                             {pageView === 'envelopes' ? (
//                                 <Button variant="contained" startIcon={<Plus size={15} />}
//                                         onClick={() => setCreateOpen(true)}
//                                         sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK }, px: 2.5, py: 1 }}>
//                                     New Envelope
//                                 </Button>
//                             ) : (
//                                 <Button variant="contained"
//                                         startIcon={planApplied ? <CheckCircle size={15} /> : <ChevronRight size={15} />}
//                                         onClick={handleApplyPlan}
//                                         sx={{
//                                             borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', px: 2.5, py: 1,
//                                             bgcolor: planApplied ? '#16a34a' : MAROON,
//                                             '&:hover': { bgcolor: planApplied ? '#15803d' : MAROON_DARK },
//                                             transition: 'background 0.3s',
//                                         }}>
//                                     {planApplied ? 'Applied!' : 'Apply Plan'}
//                                 </Button>
//                             )}
//                         </Box>
//                     </Box>
//                 </Grow>
//
//                 {/* ── Summary cards — always visible ──────────────────────── */}
//                 <Grow in={animateIn} timeout={600}>
//                     <Grid container spacing={2.5} sx={{ mb: 4 }}>
//                         {[
//                             { label: 'Active Envelopes', value: String(stats.totalEnvelopes), sub: `${stats.completed} completed`,                    color: MAROON,    bg: '#f0f4ff', chip: <><Layers size={10} /> All time</>,       pct: 100       },
//                             { label: 'Monthly Allocated', value: fmt(stats.totalAllocated),   sub: `across ${stats.totalEnvelopes} envelopes`,         color: '#7c3aed', bg: '#faf5ff', chip: <><Calendar size={10} /> /month</>,     pct: 100       },
//                             { label: 'Total Saved',       value: fmt(stats.totalSaved),       sub: `${overallPct.toFixed(0)}% of all targets`,         color: '#16a34a', bg: '#f0fdf4', chip: <><TrendingUp size={10} /> progress</>, pct: overallPct },
//                             { label: 'Total Target',      value: fmt(stats.totalTarget),      sub: `${fmt(stats.totalTarget - stats.totalSaved)} left`, color: '#0284c7', bg: '#f0f9ff', chip: <><Target size={10} /> goal</>,        pct: 100       },
//                         ].map(({ label, value, sub, color, bg, chip, pct }) => (
//                             <Grid item xs={12} sm={6} md={3} key={label}>
//                                 <Box sx={{ background: bg, borderRadius: '10px', borderTop: `3px solid ${color}`, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', p: 2.5, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' } }}>
//                                     <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: alpha(color, 0.7), fontWeight: 700, mb: 1 }}>{label}</Typography>
//                                     {isLoading
//                                         ? <Skeleton variant="text" width="60%" height={42} />
//                                         : <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color, lineHeight: 1, mb: 0.5, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>}
//                                     <LinearProgress variant="determinate" value={pct}
//                                                     sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(color, 0.15), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 } }} />
//                                     <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                                         <Typography sx={{ fontSize: '0.72rem', color: alpha(color, 0.65) }}>{sub}</Typography>
//                                         <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: alpha(color, 0.1), color, fontSize: '0.65rem', fontWeight: 700 }}>
//                                             {chip}
//                                         </Box>
//                                     </Box>
//                                 </Box>
//                             </Grid>
//                         ))}
//                     </Grid>
//                 </Grow>
//
//                 {/* ════════════════════════════════════════════════════════════
//                     ENVELOPES VIEW
//                 ════════════════════════════════════════════════════════════ */}
//                 {pageView === 'envelopes' && (
//                     <>
//                         <Grow in={animateIn} timeout={700}>
//                             <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
//                                 <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', mr: 0.5 }}>Status:</Typography>
//                                 {['ALL','ACTIVE','PAUSED','COMPLETED','CANCELLED'].map(v =>
//                                     filterBtn(v === 'ALL' ? 'All' : STATUS_META[v]?.label ?? v, v, filterStatus, setFilterStatus)
//                                 )}
//                                 <Box sx={{ mx: 1, width: 1, height: 20, bgcolor: '#ddd' }} />
//                                 <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', mr: 0.5 }}>Type:</Typography>
//                                 {['ALL','SAVINGS','PAYOFF','PURCHASE','EMERGENCY'].map(v =>
//                                     filterBtn(v === 'ALL' ? 'All' : ENVELOPE_TYPE_LABELS[v], v, filterType, setFilterType)
//                                 )}
//                             </Box>
//                         </Grow>
//
//                         <Grid container spacing={3}>
//                             <Grid item xs={12} lg={8}>
//                                 <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}` }}>
//                                     <PanelHeader icon={<Wallet size={15} color="white" />}
//                                                  title="Your Envelopes"
//                                                  subtitle={`${filtered.length} envelope${filtered.length !== 1 ? 's' : ''} — tap one to view details`} />
//                                     <Box sx={{ bgcolor: '#fff', p: 3 }}>
//                                         {filtered.length === 0 && !isLoading ? (
//                                             <Box sx={{ textAlign: 'center', py: 4 }}>
//                                                 <PiggyBank size={40} color={alpha(MAROON, 0.25)} />
//                                                 <Typography sx={{ mt: 2, fontWeight: 700, color: '#555' }}>No envelopes match your filters</Typography>
//                                                 <Typography sx={{ mt: 0.5, fontSize: '0.82rem', color: '#aaa' }}>Try adjusting the status or type filter above.</Typography>
//                                             </Box>
//                                         ) : (
//                                             <Grid container spacing={2}>
//                                                 {isLoading
//                                                     ? Array.from({ length: 4 }).map((_, i) => (
//                                                         <Grid item xs={12} sm={6} key={i}><Skeleton variant="rounded" height={180} sx={{ borderRadius: '12px' }} /></Grid>
//                                                     ))
//                                                     : filtered.map((env, i) => (
//                                                         <Grid item xs={12} sm={6} key={env.id}>
//                                                             <EnvelopeCard envelope={env} animateIn={animateIn} timeout={700 + i * 80}
//                                                                           onClick={() => setSelectedId(env.id === selectedId ? null : env.id)} />
//                                                         </Grid>
//                                                     ))}
//                                             </Grid>
//                                         )}
//                                     </Box>
//                                 </Box>
//                             </Grid>
//
//                             <Grid item xs={12} lg={4}>
//                                 <Grow in={animateIn} timeout={800}>
//                                     <Box sx={{ position: 'sticky', top: 24 }}>
//                                         {selectedEnvelope ? (
//                                             <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.25)}`, boxShadow: `0 4px 24px ${alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.12)}` }}>
//                                                 <Box sx={{ background: `linear-gradient(135deg, ${alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.9)} 0%, ${ENVELOPE_COLORS[selectedEnvelope.envelopeType]} 100%)`, px: 3, py: 2, position: 'relative', overflow: 'hidden' }}>
//                                                     <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
//                                                     <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                                                         <Box>
//                                                             <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>{selectedEnvelope.envelopeName}</Typography>
//                                                             <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.75)', mt: 0.1 }}>{selectedEnvelope.description}</Typography>
//                                                         </Box>
//                                                         <IconButton size="small" onClick={() => setSelectedId(null)}
//                                                                     sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
//                                                             <XCircle size={16} />
//                                                         </IconButton>
//                                                     </Box>
//                                                 </Box>
//                                                 <Box sx={{ bgcolor: '#fff', p: 2.5 }}>
//                                                     <Box sx={{ textAlign: 'center', mb: 2.5 }}>
//                                                         <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, color: ENVELOPE_COLORS[selectedEnvelope.envelopeType], fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
//                                                             {fmt(selectedEnvelope.currentAmount)}
//                                                         </Typography>
//                                                         <Typography sx={{ fontSize: '0.72rem', color: '#888', mt: 0.4 }}>of {fmt(selectedEnvelope.targetAmount)} goal</Typography>
//                                                         <LinearProgress variant="determinate" value={progressPct(selectedEnvelope.currentAmount, selectedEnvelope.targetAmount)}
//                                                                         sx={{ mt: 1.5, height: 8, borderRadius: 4, bgcolor: alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.12), '& .MuiLinearProgress-bar': { bgcolor: ENVELOPE_COLORS[selectedEnvelope.envelopeType], borderRadius: 4 } }} />
//                                                         <Typography sx={{ fontSize: '0.72rem', color: ENVELOPE_COLORS[selectedEnvelope.envelopeType], fontWeight: 700, mt: 0.75 }}>
//                                                             {progressPct(selectedEnvelope.currentAmount, selectedEnvelope.targetAmount).toFixed(1)}% complete
//                                                         </Typography>
//                                                     </Box>
//                                                     <Divider sx={{ mb: 2 }} />
//                                                     <Grid container spacing={1.5} sx={{ mb: 2 }}>
//                                                         {[
//                                                             { label: 'Remaining',   value: fmt(selectedEnvelope.remainingAmount) },
//                                                             { label: 'Allocated',   value: `${fmt(selectedEnvelope.allocatedAmount)}/mo` },
//                                                             { label: 'Target Date', value: selectedEnvelope.targetDate ? new Date(selectedEnvelope.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
//                                                             { label: 'Days Left',   value: daysUntil(selectedEnvelope.targetDate) !== null ? `${daysUntil(selectedEnvelope.targetDate)}d` : '—' },
//                                                         ].map(({ label, value }) => (
//                                                             <Grid item xs={6} key={label}>
//                                                                 <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
//                                                                     <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', mb: 0.3 }}>{label}</Typography>
//                                                                     <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
//                                                                 </Box>
//                                                             </Grid>
//                                                         ))}
//                                                     </Grid>
//                                                     <Stack spacing={1} sx={{ mb: 2.5 }}>
//                                                         <Button fullWidth variant="contained" startIcon={<Plus size={14} />}
//                                                                 sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', bgcolor: ENVELOPE_COLORS[selectedEnvelope.envelopeType], '&:hover': { bgcolor: alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.85) } }}
//                                                                 onClick={() => { setSnackMsg('Add contribution — coming soon!'); setSnackSev('info'); setSnackOpen(true); }}>
//                                                             Add Contribution
//                                                         </Button>
//                                                         <Box sx={{ display: 'flex', gap: 1 }}>
//                                                             <Button fullWidth variant="outlined" size="small" startIcon={<MoreHorizontal size={13} />}
//                                                                     sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', borderColor: '#d5d5d5', color: '#555', '&:hover': { borderColor: MAROON, color: MAROON } }}
//                                                                     onClick={() => { setSnackMsg('Edit — coming soon!'); setSnackSev('info'); setSnackOpen(true); }}>
//                                                                 Edit
//                                                             </Button>
//                                                             {selectedEnvelope.status === 'ACTIVE' && (
//                                                                 <Button fullWidth variant="outlined" size="small" startIcon={<PauseCircle size={13} />}
//                                                                         sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', borderColor: '#d5d5d5', color: '#d97706', '&:hover': { borderColor: '#d97706', bgcolor: alpha('#d97706', 0.04) } }}
//                                                                         onClick={() => { setSnackMsg('Pause — coming soon!'); setSnackSev('info'); setSnackOpen(true); }}>
//                                                                     Pause
//                                                                 </Button>
//                                                             )}
//                                                         </Box>
//                                                     </Stack>
//                                                     <Divider sx={{ mb: 1.5 }} />
//                                                     <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.25 }}>
//                                                         Contribution History
//                                                     </Typography>
//                                                     {selectedContributions.length === 0
//                                                         ? <Typography sx={{ fontSize: '0.75rem', color: '#bbb', textAlign: 'center', py: 2 }}>No contributions yet</Typography>
//                                                         : <>
//                                                             {selectedContributions.map(c => (
//                                                                 <ContributionRow key={c.id} c={c} color={ENVELOPE_COLORS[selectedEnvelope.envelopeType]} />
//                                                             ))}
//                                                             <Box sx={{ mt: 1.5, p: 1.25, borderRadius: '8px', bgcolor: alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.06), border: `1px solid ${alpha(ENVELOPE_COLORS[selectedEnvelope.envelopeType], 0.15)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                                                 <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#333' }}>Total contributed</Typography>
//                                                                 <Typography sx={{ fontWeight: 900, fontSize: '0.95rem', color: ENVELOPE_COLORS[selectedEnvelope.envelopeType], fontVariantNumeric: 'tabular-nums' }}>
//                                                                     {fmt(selectedContributions.reduce((s, c) => s + c.amount, 0))}
//                                                                 </Typography>
//                                                             </Box>
//                                                         </>}
//                                                 </Box>
//                                             </Box>
//                                         ) : (
//                                             <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}` }}>
//                                                 <PanelHeader icon={<Target size={15} color="white" />} title="Quick Overview" subtitle="Tap any envelope card for details" />
//                                                 <Box sx={{ bgcolor: '#fff', p: 2.5 }}>
//                                                     <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.5 }}>By Priority</Typography>
//                                                     <Stack spacing={1.25}>
//                                                         {envelopes.filter(e => e.status === 'ACTIVE').sort((a, b) => a.priority - b.priority).map(env => {
//                                                             const c   = ENVELOPE_COLORS[env.envelopeType];
//                                                             const pct = progressPct(env.currentAmount, env.targetAmount);
//                                                             return (
//                                                                 <Box key={env.id} onClick={() => setSelectedId(env.id)}
//                                                                      sx={{ p: 1.5, borderRadius: '10px', cursor: 'pointer', border: `1px solid ${alpha(c, 0.2)}`, '&:hover': { bgcolor: alpha(c, 0.04), borderColor: alpha(c, 0.4) }, transition: 'all 0.15s' }}>
//                                                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
//                                                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                                                                             <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: c, flexShrink: 0 }} />
//                                                                             <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#111' }}>{env.envelopeName}</Typography>
//                                                                         </Box>
//                                                                         <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: c, fontVariantNumeric: 'tabular-nums' }}>{pct.toFixed(0)}%</Typography>
//                                                                     </Box>
//                                                                     <LinearProgress variant="determinate" value={pct}
//                                                                                     sx={{ height: 4, borderRadius: 2, bgcolor: alpha(c, 0.12), '& .MuiLinearProgress-bar': { bgcolor: c, borderRadius: 2 } }} />
//                                                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
//                                                                         <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>{fmt(env.currentAmount)}</Typography>
//                                                                         <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>{fmt(env.targetAmount)}</Typography>
//                                                                     </Box>
//                                                                 </Box>
//                                                             );
//                                                         })}
//                                                     </Stack>
//                                                     <Divider sx={{ my: 2 }} />
//                                                     <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.25 }}>Upcoming Deadlines</Typography>
//                                                     <Stack spacing={1}>
//                                                         {envelopes.filter(e => e.status === 'ACTIVE' && e.targetDate)
//                                                             .sort((a, b) => new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime())
//                                                             .slice(0, 3)
//                                                             .map(env => {
//                                                                 const days  = daysUntil(env.targetDate)!;
//                                                                 const dc    = days <= 60 ? '#d97706' : '#16a34a';
//                                                                 return (
//                                                                     <Box key={env.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75, borderBottom: `1px solid ${alpha('#000', 0.05)}`, '&:last-child': { borderBottom: 'none' } }}>
//                                                                         <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#333' }}>{env.envelopeName}</Typography>
//                                                                         <Chip size="small" label={`${days}d`} sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: alpha(dc, 0.1), color: dc }} />
//                                                                     </Box>
//                                                                 );
//                                                             })}
//                                                     </Stack>
//                                                 </Box>
//                                             </Box>
//                                         )}
//                                     </Box>
//                                 </Grow>
//                             </Grid>
//                         </Grid>
//                     </>
//                 )}
//
//                 {/* ════════════════════════════════════════════════════════════
//                     PLANNER VIEW
//                 ════════════════════════════════════════════════════════════ */}
//                 {pageView === 'planner' && (
//                     <Grow in timeout={350}>
//                         <Box>
//                             {/* Controls panel */}
//                             <Box sx={{ borderRadius: '14px', border: `1px solid ${alpha(MAROON, 0.15)}`, overflow: 'hidden', boxShadow: `0 4px 24px ${alpha(MAROON, 0.07)}`, mb: 3 }}>
//                                 <PanelHeader icon={<BarChart2 size={15} color="white" />}
//                                              title="Priority Planner"
//                                              subtitle={`Optimise monthly contributions across ${activeEnvelopes.length} active envelopes`} />
//                                 <Box sx={{ bgcolor: '#fff', px: 3, py: 2.5 }}>
//                                     <Grid container spacing={3} alignItems="flex-end">
//                                         {/* Budget */}
//                                         <Grid item xs={12} sm={4}>
//                                             <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888', mb: 0.75 }}>
//                                                 Monthly Envelope Budget
//                                             </Typography>
//                                             <TextField size="small" value={planBudget} fullWidth type="number"
//                                                        onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0) handlePlanBudgetChange(v); }}
//                                                        InputProps={{
//                                                            startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: '#aaa' }}>$</Typography></InputAdornment>,
//                                                            sx: { fontWeight: 800, borderRadius: '9px', fontSize: '0.9rem' },
//                                                        }}
//                                                        inputProps={{ min: 0, step: 10 }}
//                                                        sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: MAROON } }} />
//                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.6 }}>
//                                                 <Typography sx={{ fontSize: '0.62rem', color: planSurplus >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
//                                                     {planSurplus >= 0 ? `${fmt(planSurplus)} unallocated` : `${fmt(Math.abs(planSurplus))} over budget`}
//                                                 </Typography>
//                                                 <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>{fmt(planAllocated)} allocated</Typography>
//                                             </Box>
//                                             <LinearProgress variant="determinate"
//                                                             value={Math.min((planAllocated / Math.max(planBudget, 1)) * 100, 100)}
//                                                             sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: alpha(planSurplus < 0 ? '#dc2626' : '#16a34a', 0.12), '& .MuiLinearProgress-bar': { bgcolor: planSurplus < 0 ? '#dc2626' : '#16a34a', borderRadius: 2 } }} />
//                                         </Grid>
//
//                                         {/* Horizon */}
//                                         <Grid item xs={12} sm={4}>
//                                             <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888', mb: 0.75 }}>
//                                                 Planning Horizon
//                                             </Typography>
//                                             <ToggleButtonGroup value={planTimeframe} exclusive
//                                                                onChange={(_, v) => v && setPlanTimeframe(v)} size="small"
//                                                                sx={{ width: '100%', '& .MuiToggleButton-root': { flex: 1, textTransform: 'none', fontWeight: 700, fontSize: '0.7rem', borderRadius: '8px !important', mx: 0.2 } }}>
//                                                 {[3, 4, 6, 12].map(m => (
//                                                     <ToggleButton key={m} value={m}
//                                                                   sx={{ '&.Mui-selected': { bgcolor: alpha(MAROON, 0.1), color: MAROON, borderColor: `${alpha(MAROON, 0.3)} !important` }, '&:hover': { bgcolor: alpha(MAROON, 0.05) } }}>
//                                                         {m}mo
//                                                     </ToggleButton>
//                                                 ))}
//                                             </ToggleButtonGroup>
//                                             <Typography sx={{ fontSize: '0.62rem', color: '#aaa', mt: 0.6 }}>
//                                                 {withinHorizon.length} of {planResults.length} completable in {planTimeframe} months
//                                             </Typography>
//                                         </Grid>
//
//                                         {/* Status + reset */}
//                                         <Grid item xs={12} sm={4}>
//                                             <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { sm: 'flex-end' }, alignItems: 'center' }}>
//                                                 <Chip size="small"
//                                                       icon={allOnTrack ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
//                                                       label={allOnTrack ? 'All on track' : `${criticalCount} need attention`}
//                                                       sx={{ fontWeight: 700, fontSize: '0.68rem', height: 24,
//                                                           bgcolor: allOnTrack ? alpha('#16a34a', 0.1) : alpha('#dc2626', 0.1),
//                                                           color: allOnTrack ? '#15803d' : '#dc2626',
//                                                           '& .MuiChip-icon': { color: allOnTrack ? '#15803d' : '#dc2626' } }} />
//                                                 <Button size="small" startIcon={<RefreshCw size={13} />} onClick={resetPlanToAuto}
//                                                         sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', border: '1px solid #d5d5d5', color: '#555', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: alpha(MAROON, 0.04) } }}>
//                                                     Auto-Reset
//                                                 </Button>
//                                             </Box>
//                                         </Grid>
//                                     </Grid>
//                                 </Box>
//
//                                 {/* Insight warning banner */}
//                                 {!allOnTrack && (
//                                     <Box sx={{ px: 3, py: 1.5, bgcolor: alpha('#d97706', 0.07), borderTop: `1px solid ${alpha('#d97706', 0.18)}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                                         <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: alpha('#d97706', 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                                             <Zap size={14} color="#d97706" />
//                                         </Box>
//                                         <Box sx={{ flex: 1 }}>
//                                             <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e' }}>
//                                                 {criticalCount} envelope{criticalCount !== 1 ? 's' : ''} won't meet {criticalCount !== 1 ? 'their' : 'its'} target date at current allocations.
//                                             </Typography>
//                                             <Typography sx={{ fontSize: '0.65rem', color: '#b45309' }}>
//                                                 Increase your monthly budget or lock lower amounts on flexible envelopes to redirect funds to critical ones.
//                                             </Typography>
//                                         </Box>
//                                         <Button size="small" onClick={resetPlanToAuto}
//                                                 sx={{ borderRadius: '7px', textTransform: 'none', fontWeight: 700, fontSize: '0.7rem', bgcolor: alpha('#d97706', 0.15), color: '#92400e', flexShrink: 0, '&:hover': { bgcolor: alpha('#d97706', 0.25) } }}>
//                                             Fix Auto
//                                         </Button>
//                                     </Box>
//                                 )}
//                             </Box>
//
//                             {/* Priority rows + summary */}
//                             <Grid container spacing={3}>
//                                 <Grid item xs={12} lg={8}>
//                                     <Stack spacing={2}>
//                                         {withinHorizon.length > 0 && (
//                                             <Box>
//                                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
//                                                     <Box sx={{ width: 6, height: 6, borderRadius: '2px', bgcolor: '#16a34a' }} />
//                                                     <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#16a34a' }}>
//                                                         Completable within {planTimeframe} months
//                                                     </Typography>
//                                                     <Chip size="small" label={withinHorizon.length} sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: alpha('#16a34a', 0.1), color: '#16a34a' }} />
//                                                 </Box>
//                                                 <Stack spacing={1.5}>
//                                                     {planEntries
//                                                         .filter(e => { const r = planResults.find(r => r.envelopeId === e.envelopeId); return r && r.monthsNeeded <= planTimeframe; })
//                                                         .map(entry => {
//                                                             const env       = envMap.get(entry.envelopeId)!;
//                                                             const result    = planResults.find(r => r.envelopeId === entry.envelopeId)!;
//                                                             const globalIdx = planEntries.findIndex(e => e.envelopeId === entry.envelopeId);
//                                                             return (
//                                                                 <PlannerRow key={entry.envelopeId}
//                                                                             rank={entry.priority} entry={entry} env={env} result={result} total={planAllocated}
//                                                                             onUp={() => movePlanUp(globalIdx)} onDown={() => movePlanDown(globalIdx)}
//                                                                             onAlloc={v => handlePlanAlloc(entry.envelopeId, v)} onLock={() => handlePlanLock(entry.envelopeId)}
//                                                                             isFirst={globalIdx === 0} isLast={globalIdx === planEntries.length - 1}
//                                                                             animateIn timeout={300 + globalIdx * 60}
//                                                                 />
//                                                             );
//                                                         })}
//                                                 </Stack>
//                                             </Box>
//                                         )}
//
//                                         {outsideHorizon.length > 0 && (
//                                             <Box>
//                                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, mt: withinHorizon.length > 0 ? 1 : 0 }}>
//                                                     <Box sx={{ width: 6, height: 6, borderRadius: '2px', bgcolor: '#d97706' }} />
//                                                     <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#d97706' }}>
//                                                         Beyond {planTimeframe}-month horizon
//                                                     </Typography>
//                                                     <Chip size="small" label={outsideHorizon.length} sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: alpha('#d97706', 0.1), color: '#d97706' }} />
//                                                 </Box>
//                                                 <Stack spacing={1.5}>
//                                                     {planEntries
//                                                         .filter(e => { const r = planResults.find(r => r.envelopeId === e.envelopeId); return r && r.monthsNeeded > planTimeframe; })
//                                                         .map(entry => {
//                                                             const env       = envMap.get(entry.envelopeId)!;
//                                                             const result    = planResults.find(r => r.envelopeId === entry.envelopeId)!;
//                                                             const globalIdx = planEntries.findIndex(e => e.envelopeId === entry.envelopeId);
//                                                             return (
//                                                                 <PlannerRow key={entry.envelopeId}
//                                                                             rank={entry.priority} entry={entry} env={env} result={result} total={planAllocated}
//                                                                             onUp={() => movePlanUp(globalIdx)} onDown={() => movePlanDown(globalIdx)}
//                                                                             onAlloc={v => handlePlanAlloc(entry.envelopeId, v)} onLock={() => handlePlanLock(entry.envelopeId)}
//                                                                             isFirst={globalIdx === 0} isLast={globalIdx === planEntries.length - 1}
//                                                                             animateIn timeout={300 + globalIdx * 60}
//                                                                 />
//                                                             );
//                                                         })}
//                                                 </Stack>
//                                             </Box>
//                                         )}
//                                     </Stack>
//                                 </Grid>
//
//                                 {/* Sticky summary panel */}
//                                 <Grid item xs={12} lg={4}>
//                                     <Grow in timeout={500}>
//                                         <Box sx={{ position: 'sticky', top: 24, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}` }}>
//                                             <PanelHeader icon={<Target size={15} color="white" />} title="Plan Summary" subtitle="Projected completion per envelope" />
//                                             <Box sx={{ bgcolor: '#fff' }}>
//                                                 {planEntries.map((entry, i) => {
//                                                     const env    = envMap.get(entry.envelopeId)!;
//                                                     const result = planResults.find(r => r.envelopeId === entry.envelopeId)!;
//                                                     const c      = ENVELOPE_COLORS[env.envelopeType];
//                                                     const pct    = progressPct(env.currentAmount, env.targetAmount);
//                                                     return (
//                                                         <Box key={entry.envelopeId} sx={{ px: 2.5, py: 1.75, bgcolor: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: i < planEntries.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
//                                                             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
//                                                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                                                                     <Box sx={{ width: 20, height: 20, borderRadius: '5px', bgcolor: alpha(c, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: c, flexShrink: 0 }}>
//                                                                         {TYPE_ICONS[env.envelopeType]}
//                                                                     </Box>
//                                                                     <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>
//                                                                         {env.envelopeName}
//                                                                     </Typography>
//                                                                 </Box>
//                                                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                                                                     {result.meetsTarget ? <CheckCircle size={11} color="#16a34a" /> : <AlertTriangle size={11} color="#dc2626" />}
//                                                                     <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: result.meetsTarget ? '#15803d' : '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
//                                                                         {result.projectedDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
//                                                                     </Typography>
//                                                                 </Box>
//                                                             </Box>
//                                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
//                                                                 <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>{fmt(env.currentAmount)} / {fmt(env.targetAmount)}</Typography>
//                                                                 <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: c }}>{fmt(entry.monthlyAlloc)}/mo</Typography>
//                                                             </Box>
//                                                             <LinearProgress variant="determinate" value={pct}
//                                                                             sx={{ height: 4, borderRadius: 2, bgcolor: alpha(c, 0.1), '& .MuiLinearProgress-bar': { bgcolor: c, borderRadius: 2 } }} />
//                                                         </Box>
//                                                     );
//                                                 })}
//                                                 <Box sx={{ px: 2.5, py: 1.75, bgcolor: alpha(MAROON, 0.04), borderTop: `1px solid ${alpha(MAROON, 0.12)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                                     <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: MAROON }}>Total Monthly</Typography>
//                                                     <Typography sx={{ fontSize: '0.92rem', fontWeight: 900, color: MAROON, fontVariantNumeric: 'tabular-nums' }}>{fmt(planAllocated)}</Typography>
//                                                 </Box>
//                                                 <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1, borderTop: '1px solid #f0f0f0' }}>
//                                                     <Info size={12} color="#bbb" style={{ marginTop: 2, flexShrink: 0 }} />
//                                                     <Typography sx={{ fontSize: '0.65rem', color: '#bbb', lineHeight: 1.5 }}>
//                                                         Click "Apply Plan" in the header to save these allocations. Lock individual rows to protect them from auto-rebalancing.
//                                                     </Typography>
//                                                 </Box>
//                                             </Box>
//                                         </Box>
//                                     </Grow>
//                                 </Grid>
//                             </Grid>
//                         </Box>
//                     </Grow>
//                 )}
//             </Container>
//
//             <CreateEnvelopeDialog open={createOpen} onClose={() => setCreateOpen(false)}
//                                   onSubmit={async data => { console.log('New envelope:', data); setCreateOpen(false); }} />
//
//             <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
//                 <Alert onClose={() => setSnackOpen(false)} severity={snackSev} sx={{ width: '100%', borderRadius: 2 }}>{snackMsg}</Alert>
//             </Snackbar>
//         </Box>
//     );
// };
//
// export default BudgetEnvelopesPage;
