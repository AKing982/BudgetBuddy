import { useState, useCallback } from 'react';
import {
    alpha, Box, Button, Chip, Divider, Drawer, FormControlLabel,
    Grid, IconButton, InputAdornment, LinearProgress,
    MenuItem, Select, Stack, TextField, ToggleButton,
    ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import {
    AlertTriangle, Calculator, CheckCircle, ChevronRight,
    Info, Lightbulb, Lock, Plus, RefreshCcw, Sparkles,
    Target, TrendingDown, TrendingUp, X, XCircle, Zap,
} from 'lucide-react';
import { BudgetEnvelope } from './BudgetEnvelopesPage';

// ── Design tokens ─────────────────────────────────────────────────────────────
const MAROON      = '#6b1a1a';
const MAROON_DARK = '#4a1010';

const PRIORITY_META = {
    LOW:    { label: 'Low',    color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   border: '#16a34a',  budgetBoost: -0.2  },
    MEDIUM: { label: 'Medium', color: '#d97706', bg: 'rgba(217,119,6,0.1)',  border: '#d97706',  budgetBoost:  0    },
    HIGH:   { label: 'High',   color: '#dc2626', bg: 'rgba(220,38,38,0.1)',  border: '#dc2626',  budgetBoost:  0.25 },
};

const ENVELOPE_COLORS: Record<string, string> = {
    SAVINGS:   '#0284c7',
    PAYOFF:    '#dc2626',
    PURCHASE:  '#7c3aed',
    EMERGENCY: '#d97706',
};

const ENVELOPE_ICONS: Record<string, string> = {
    SAVINGS: '🐷', PAYOFF: '⚡', PURCHASE: '🛒', EMERGENCY: '🔥',
};

// ── Types ─────────────────────────────────────────────────────────────────────
export type PaymentType  = 'LUMP' | 'SPLIT' | 'PLAN';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type EstimateState = 'idle' | 'feasible' | 'partial' | 'blocked';

export interface EstimateForm {
    name:         string;
    amount:       number;
    goalType:     string;
    paymentType:  PaymentType;
    numPayments:  number;
    payFrequency: string;
    planTerm:     number;
    planAPR:      number;
    isDeferred:   boolean;
    purchaseDate: string;
    priority:     PriorityLevel;
    hardDeadline: string;
    maxMonthly:   number | null;
}

export interface EstimateResult {
    state:          EstimateState;
    requiredMonthly: number;
    adjustedMonthly: number;
    months:          number;
    projectedDate:   Date;
    budgetRemaining: number;
    existingPct:     number;
    newPct:          number;
    reasons:         { icon: string; text: string }[];
    suggestions:     string[];
    payLabel:        string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
    `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtShort = (n: number) =>
    `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function addMonths(d: Date, n: number): Date {
    const r = new Date(d);
    r.setMonth(r.getMonth() + n);
    return r;
}

function monthsBetween(from: Date, to: Date): number {
    return Math.max(
        (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()), 1,
    );
}

// ── Core calculation engine ───────────────────────────────────────────────────
export function computeEstimate(
    form: EstimateForm,
    monthlyBudget: number,
    existingAlloc: number,
): EstimateResult {
    const today     = new Date();
    const freeBudget = monthlyBudget - existingAlloc;
    const target     = form.purchaseDate ? new Date(form.purchaseDate) : addMonths(today, 6);
    const dlDate     = form.hardDeadline ? new Date(form.hardDeadline) : null;
    const pri        = PRIORITY_META[form.priority];

    let months       = monthsBetween(today, target);
    let reqMonthly   = 0;
    let payLabel     = '';

    // Calculate required monthly based on payment type
    if (form.paymentType === 'LUMP') {
        reqMonthly = form.amount / months;
        payLabel   = `${fmt(form.amount)} lump sum`;
    } else if (form.paymentType === 'SPLIT') {
        months     = form.numPayments;
        reqMonthly = form.amount / form.numPayments;
        payLabel   = `${form.numPayments}× ${fmtShort(reqMonthly)}/mo`;
    } else {
        months = form.planTerm;
        if (form.planAPR > 0) {
            const r    = form.planAPR / 100 / 12;
            reqMonthly = form.amount * r / (1 - Math.pow(1 + r, -form.planTerm));
        } else {
            reqMonthly = form.amount / form.planTerm;
        }
        payLabel = `${form.planTerm}-mo plan @ ${form.planAPR}% APR`;
    }
    reqMonthly = Math.ceil(reqMonthly * 100) / 100;

    // Effective free budget with priority modifier
    const effectiveFree = freeBudget * (1 + pri.budgetBoost);

    // Cap by user max
    const capped = form.maxMonthly !== null
        ? Math.min(reqMonthly, form.maxMonthly) : reqMonthly;

    const reasons:     { icon: string; text: string }[] = [];
    const suggestions: string[] = [];
    let state: EstimateState = 'feasible';

    // ── Validation gates ──
    if (form.amount <= 0) {
        reasons.push({ icon: '⚠️', text: 'Enter a valid goal amount greater than $0.' });
        state = 'blocked';
    }

    if (state !== 'blocked' && reqMonthly > effectiveFree + 0.01) {
        const gap       = reqMonthly - freeBudget;
        const altMonths = Math.ceil(form.amount / freeBudget);
        const altDate   = addMonths(today, altMonths)
            .toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        reasons.push({
            icon: '💸',
            text: `Needs ${fmt(reqMonthly)}/mo but only ${fmt(freeBudget)} is free after existing envelopes — a ${fmt(gap)} shortfall.`,
        });
        suggestions.push(`Save ${fmtShort(freeBudget)}/mo → reach goal by ${altDate} (${altMonths} mo)`);
        suggestions.push(`Pause a lower-priority envelope to free up ${fmt(gap)} more/mo`);
        suggestions.push(`Reduce amount to ${fmtShort(freeBudget * months)} to fit your ${months}-month window`);
        state = 'blocked';
    }

    if (state !== 'blocked' && dlDate && target > dlDate) {
        reasons.push({
            icon: '📅',
            text: `Purchase date (${target.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}) is after your hard deadline (${dlDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}).`,
        });
        state = 'blocked';
    }

    // Partial: user-capped monthly means extended timeline
    if (state === 'feasible' && capped < reqMonthly - 0.01) {
        const adjMonths = Math.ceil(form.amount / capped);
        reasons.push({
            icon: '📉',
            text: `Your cap of ${fmt(form.maxMonthly!)}/mo extends the timeline to ${adjMonths} months instead of ${months}.`,
        });
        months     = adjMonths;
        state      = 'partial';
    }

    const adjMonthly    = state === 'partial' ? capped : reqMonthly;
    const projectedDate = addMonths(today, months);
    const budgetRemaining = Math.max(freeBudget - adjMonthly, 0);
    const existingPct   = Math.round((existingAlloc / monthlyBudget) * 100);
    const newPct        = Math.min(Math.round((adjMonthly / monthlyBudget) * 100), 100 - existingPct);

    return {
        state, requiredMonthly: reqMonthly, adjustedMonthly: adjMonthly,
        months, projectedDate, budgetRemaining,
        existingPct, newPct, reasons, suggestions, payLabel,
    };
}

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionDivider: React.FC<{ label: string }> = ({ label }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.5 }}>
        <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#bbb', whiteSpace: 'nowrap' }}>{label}</Typography>
        <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
    </Box>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888', mb: 0.5 }}>{children}</Typography>
);

// ── Result: Feasible ──────────────────────────────────────────────────────────
const FeasibleResult: React.FC<{ result: EstimateResult; form: EstimateForm; onApply: () => void }> = ({ result, form, onApply }) => (
    <Box sx={{ p: 2, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderTop: '3px solid #16a34a' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
            <Chip size="small" icon={<CheckCircle size={10} />} label="AFFORDABLE"
                  sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#16a34a', color: '#fff', '& .MuiChip-icon': { color: '#fff' } }} />
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#15803d', mb: 0.25 }}>{form.name}</Typography>
        <Typography sx={{ fontSize: '0.65rem', color: '#166534', mb: 1.25 }}>{result.payLabel} · won't disrupt existing envelopes</Typography>

        <Grid container spacing={1} sx={{ mb: 1.5 }}>
            {[
                { label: 'Monthly',   value: fmt(result.adjustedMonthly), color: '#16a34a' },
                { label: 'Completes', value: result.projectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) },
                { label: 'Months',    value: `${result.months} mo` },
                { label: 'Budget left', value: fmt(result.budgetRemaining) },
            ].map(({ label, value, color }) => (
                <Grid item xs={6} key={label}>
                    <Box sx={{ p: 1, borderRadius: '7px', bgcolor: 'rgba(255,255,255,0.72)', border: '1px solid rgba(22,163,74,0.15)' }}>
                        <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', mb: 0.25 }}>{label}</Typography>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: color ?? '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                    </Box>
                </Grid>
            ))}
        </Grid>

        {/* Budget impact bar */}
        <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.62rem', color: '#555' }}>Budget impact</Typography>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#333' }}>{result.existingPct + result.newPct}% used</Typography>
            </Box>
            <Box sx={{ height: 6, borderRadius: 3, bgcolor: '#e5e7eb', overflow: 'hidden', display: 'flex' }}>
                <Box sx={{ width: `${result.existingPct}%`, bgcolor: MAROON, transition: 'width 0.5s' }} />
                <Box sx={{ width: `${result.newPct}%`, bgcolor: '#7c3aed', opacity: 0.65, transition: 'width 0.5s' }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
                {[['#6b1a1a', 'Existing'], ['rgba(124,58,237,0.65)', 'New goal'], ['#e5e7eb', 'Free']].map(([c, l]) => (
                    <Box key={l} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: c }} />
                        <Typography sx={{ fontSize: '0.58rem', color: '#888' }}>{l}</Typography>
                    </Box>
                ))}
            </Box>
        </Box>

        <Button fullWidth variant="contained" onClick={onApply} startIcon={<Plus size={13} />}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}>
            Apply to plan
        </Button>
    </Box>
);

// ── Result: Partial ───────────────────────────────────────────────────────────
const PartialResult: React.FC<{ result: EstimateResult; form: EstimateForm; onApply: () => void }> = ({ result, form, onApply }) => (
    <Box sx={{ p: 2, background: 'linear-gradient(135deg, #fffbeb, #fef9c3)', borderTop: '3px solid #d97706' }}>
        <Chip size="small" label="FEASIBLE — ADJUSTED" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#d97706', color: '#fff', mb: 1 }} />
        <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#92400e', mb: 0.25 }}>{form.name}</Typography>
        <Typography sx={{ fontSize: '0.65rem', color: '#b45309', mb: 1 }}>Timeline extended due to contribution cap</Typography>
        <Grid container spacing={1} sx={{ mb: 1.25 }}>
            {[
                { label: 'Monthly', value: fmt(result.adjustedMonthly), color: '#d97706' },
                { label: 'Completes', value: result.projectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) },
            ].map(({ label, value, color }) => (
                <Grid item xs={6} key={label}>
                    <Box sx={{ p: 1, borderRadius: '7px', bgcolor: 'rgba(255,255,255,0.72)', border: '1px solid rgba(217,119,6,0.15)' }}>
                        <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', mb: 0.25 }}>{label}</Typography>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: color ?? '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                    </Box>
                </Grid>
            ))}
        </Grid>
        {result.reasons.map((r, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 0.75, p: 1, borderRadius: '6px', bgcolor: 'rgba(255,255,255,0.65)', border: '1px solid rgba(217,119,6,0.2)', mb: 0.75 }}>
                <Typography sx={{ fontSize: 12, flexShrink: 0 }}>{r.icon}</Typography>
                <Typography sx={{ fontSize: '0.67rem', color: '#92400e', lineHeight: 1.4 }}>{r.text}</Typography>
            </Box>
        ))}
        <Button fullWidth variant="contained" onClick={onApply}
                sx={{ mt: 0.5, borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', bgcolor: '#d97706', '&:hover': { bgcolor: '#b45309' } }}>
            Apply with adjusted timeline
        </Button>
    </Box>
);

// ── Result: Blocked ───────────────────────────────────────────────────────────
const BlockedResult: React.FC<{ result: EstimateResult; form: EstimateForm }> = ({ result, form }) => (
    <Box sx={{ p: 2, background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', borderTop: '3px solid #dc2626' }}>
        <Chip size="small" label="NOT FEASIBLE" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#dc2626', color: '#fff', mb: 1 }} />
        <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#991b1b', mb: 1 }}>{form.name} — {fmt(form.amount)}</Typography>
        {result.reasons.map((r, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 0.75, p: 1, borderRadius: '6px', bgcolor: 'rgba(255,255,255,0.65)', border: '1px solid rgba(220,38,38,0.15)', mb: 0.75 }}>
                <Typography sx={{ fontSize: 12, flexShrink: 0 }}>{r.icon}</Typography>
                <Typography sx={{ fontSize: '0.67rem', color: '#7f1d1d', lineHeight: 1.4 }}>{r.text}</Typography>
            </Box>
        ))}
        {result.suggestions.length > 0 && (
            <Box sx={{ p: 1.25, borderRadius: '7px', bgcolor: 'rgba(255,255,255,0.65)', border: '1px solid rgba(220,38,38,0.15)', mt: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <Lightbulb size={12} color="#991b1b" />
                    <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, color: '#991b1b' }}>How to make it work</Typography>
                </Box>
                {result.suggestions.map((s, i) => (
                    <Typography key={i} sx={{ fontSize: '0.65rem', color: '#7f1d1d', lineHeight: 1.6 }}>• {s}</Typography>
                ))}
            </Box>
        )}
    </Box>
);

// ════════════════════════════════════════════════════════════════════════════════
// ── Main AffordabilityEstimator Component ────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════
interface AffordabilityEstimatorProps {
    open:          boolean;
    onClose:       () => void;
    envelopes:     BudgetEnvelope[];
    monthlyBudget: number;
    existingAlloc: number;
    onApply:       (envelope: Partial<BudgetEnvelope>) => void;
}

const DEFAULT_FORM: EstimateForm = {
    name:         '',
    amount:       0,
    goalType:     'PURCHASE',
    paymentType:  'LUMP',
    numPayments:  3,
    payFrequency: 'MONTHLY',
    planTerm:     12,
    planAPR:      0,
    isDeferred:   false,
    purchaseDate: '',
    priority:     'MEDIUM',
    hardDeadline: '',
    maxMonthly:   null,
};

const AffordabilityEstimator: React.FC<AffordabilityEstimatorProps> = ({
                                                                           open, onClose, envelopes, monthlyBudget, existingAlloc, onApply,
                                                                       }) => {
    const [form,   setForm]   = useState<EstimateForm>(DEFAULT_FORM);
    const [result, setResult] = useState<EstimateResult | null>(null);

    const update = useCallback(<K extends keyof EstimateForm>(key: K, val: EstimateForm[K]) => {
        setForm(prev => ({ ...prev, [key]: val }));
        setResult(null); // clear stale result on any change
    }, []);

    const handleEstimate = () => {
        const r = computeEstimate(form, monthlyBudget, existingAlloc);
        setResult(r);
    };

    const handleApply = () => {
        if (!result || result.state === 'blocked') return;
        const projDate = result.projectedDate.toISOString().split('T')[0];
        onApply({
            envelopeName:        form.name || 'New Goal',
            envelopeType:        form.goalType as BudgetEnvelope['envelopeType'],
            targetAmount:        form.amount,
            allocatedAmount:     result.adjustedMonthly,
            currentAmount:       0,
            remainingAmount:     form.amount,
            startDate:           new Date().toISOString().split('T')[0],
            targetDate:          projDate,
            status:              'ACTIVE',
            priority:            (envelopes.filter(e => e.status === 'ACTIVE').length + 1),
            contributionMode:    'MANUAL',
        });
        setForm(DEFAULT_FORM);
        setResult(null);
        onClose();
    };

    const freeBudget = monthlyBudget - existingAlloc;
    const activeCount = envelopes.filter(e => e.status === 'ACTIVE').length;

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            variant="persistent"
            sx={{
                '& .MuiDrawer-paper': {
                    width: 368,
                    boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                },
            }}
        >
            {/* ── Header ── */}
            <Box sx={{
                background: 'linear-gradient(135deg, #3b1a6b 0%, #5b21b6 50%, #7c3aed 100%)',
                px: 2.5, py: 2, flexShrink: 0, position: 'relative', overflow: 'hidden',
            }}>
                <Box sx={{ position: 'absolute', top: -18, right: -18, width: 72, height: 72, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative' }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '9px', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                        🎯
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff' }}>Affordability Estimator</Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.72)', mt: 0.1 }}>
                            Will this new goal fit your budget?
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' } }}>
                        <X size={16} />
                    </IconButton>
                </Box>
            </Box>

            {/* ── Scrollable body ── */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1.75, display: 'flex', flexDirection: 'column', gap: 1.25 }}>

                {/* Budget context */}
                <Box sx={{ p: 1.5, borderRadius: '9px', bgcolor: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.18)' }}>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7c3aed', mb: 0.75 }}>
                        Your current budget
                    </Typography>
                    {[
                        ['Monthly income', `$${monthlyBudget.toLocaleString()}`],
                        ['Existing envelopes', `-$${existingAlloc.toLocaleString()}`],
                    ].map(([l, v]) => (
                        <Box key={l} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography sx={{ fontSize: '0.72rem', color: '#555' }}>{l}</Typography>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{v}</Typography>
                        </Box>
                    ))}
                    <Divider sx={{ my: 0.75 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#5b21b6' }}>Available</Typography>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 900, color: '#7c3aed', fontVariantNumeric: 'tabular-nums' }}>{fmt(freeBudget)}/mo</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={Math.min((existingAlloc / monthlyBudget) * 100, 100)}
                                    sx={{ mt: 1, height: 5, borderRadius: 3, bgcolor: 'rgba(124,58,237,0.12)', '& .MuiLinearProgress-bar': { bgcolor: MAROON } }} />
                    <Typography sx={{ fontSize: '0.6rem', color: '#888', mt: 0.5 }}>
                        {fmt(existingAlloc)} committed across {activeCount} envelopes · <b style={{ color: '#16a34a' }}>{fmt(freeBudget)} free</b>
                    </Typography>
                </Box>

                <SectionDivider label="New goal details" />

                {/* Name */}
                <Box>
                    <FieldLabel>Goal name</FieldLabel>
                    <TextField fullWidth size="small" placeholder="e.g. Standing Desk, MacBook, Vacation…"
                               value={form.name} onChange={e => update('name', e.target.value)}
                               sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#7c3aed' } }} />
                </Box>

                {/* Amount + type */}
                <Grid container spacing={1.25}>
                    <Grid item xs={6}>
                        <FieldLabel>Total amount</FieldLabel>
                        <TextField fullWidth size="small" type="number" value={form.amount || ''}
                                   onChange={e => update('amount', parseFloat(e.target.value) || 0)}
                                   InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: '#aaa', fontSize: '0.8rem' }}>$</Typography></InputAdornment> }}
                                   inputProps={{ min: 0, step: 10 }}
                                   sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#7c3aed' } }} />
                    </Grid>
                    <Grid item xs={6}>
                        <FieldLabel>Goal type</FieldLabel>
                        <Select fullWidth size="small" value={form.goalType}
                                onChange={e => update('goalType', e.target.value)}
                                sx={{ '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7c3aed' } }}>
                            {['PURCHASE','SAVINGS','EMERGENCY','PAYOFF'].map(t => (
                                <MenuItem key={t} value={t} sx={{ fontSize: '0.82rem' }}>
                                    {ENVELOPE_ICONS[t]} {t.charAt(0) + t.slice(1).toLowerCase()}
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>
                </Grid>

                {/* Payment type */}
                <Box>
                    <FieldLabel>Payment type</FieldLabel>
                    <ToggleButtonGroup exclusive fullWidth size="small" value={form.paymentType}
                                       onChange={(_, v) => v && update('paymentType', v as PaymentType)}
                                       sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.7rem', py: 0.6, borderRadius: '7px !important', mx: 0.2 },
                                           '& .MuiToggleButton-root.Mui-selected': { bgcolor: 'rgba(124,58,237,0.1)', color: '#7c3aed', borderColor: 'rgba(124,58,237,0.35) !important' } }}>
                        <ToggleButton value="LUMP">Lump sum</ToggleButton>
                        <ToggleButton value="SPLIT">Split</ToggleButton>
                        <ToggleButton value="PLAN">Payment plan</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* Split fields */}
                {form.paymentType === 'SPLIT' && (
                    <Grid container spacing={1.25}>
                        <Grid item xs={6}>
                            <FieldLabel>No. of payments</FieldLabel>
                            <TextField fullWidth size="small" type="number" value={form.numPayments}
                                       onChange={e => update('numPayments', parseInt(e.target.value) || 2)}
                                       inputProps={{ min: 2, max: 60 }}
                                       sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#7c3aed' } }} />
                        </Grid>
                        <Grid item xs={6}>
                            <FieldLabel>Frequency</FieldLabel>
                            <Select fullWidth size="small" value={form.payFrequency}
                                    onChange={e => update('payFrequency', e.target.value)}
                                    sx={{ '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7c3aed' } }}>
                                {['MONTHLY','BIWEEKLY','WEEKLY'].map(f => <MenuItem key={f} value={f} sx={{ fontSize: '0.82rem' }}>{f.charAt(0)+f.slice(1).toLowerCase()}</MenuItem>)}
                            </Select>
                        </Grid>
                    </Grid>
                )}

                {/* Plan fields */}
                {form.paymentType === 'PLAN' && (
                    <Stack spacing={1.25}>
                        <Grid container spacing={1.25}>
                            <Grid item xs={6}>
                                <FieldLabel>APR (%)</FieldLabel>
                                <TextField fullWidth size="small" type="number" value={form.planAPR}
                                           onChange={e => update('planAPR', parseFloat(e.target.value) || 0)}
                                           inputProps={{ min: 0, step: 0.1 }}
                                           sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#7c3aed' } }} />
                            </Grid>
                            <Grid item xs={6}>
                                <FieldLabel>Term (months)</FieldLabel>
                                <TextField fullWidth size="small" type="number" value={form.planTerm}
                                           onChange={e => update('planTerm', parseInt(e.target.value) || 1)}
                                           inputProps={{ min: 1 }}
                                           sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#7c3aed' } }} />
                            </Grid>
                        </Grid>
                        <FormControlLabel
                            control={<input type="checkbox" checked={form.isDeferred} onChange={e => update('isDeferred', e.target.checked)} style={{ accentColor: '#7c3aed', marginRight: 6 }} />}
                            label={<Typography sx={{ fontSize: '0.72rem', color: '#555' }}>Deferred interest (0% APR promotional period)</Typography>}
                            sx={{ ml: 0 }}
                        />
                    </Stack>
                )}

                {/* Purchase date */}
                <Box>
                    <FieldLabel>When do you plan to purchase / start?</FieldLabel>
                    <TextField fullWidth size="small" type="date" value={form.purchaseDate}
                               onChange={e => update('purchaseDate', e.target.value)}
                               InputLabelProps={{ shrink: true }}
                               sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#7c3aed' } }} />
                </Box>

                {/* Priority */}
                <Box>
                    <FieldLabel>Urgency / Priority</FieldLabel>
                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                        {(['LOW','MEDIUM','HIGH'] as PriorityLevel[]).map(p => {
                            const meta  = PRIORITY_META[p];
                            const isOn  = form.priority === p;
                            return (
                                <Button key={p} size="small" fullWidth onClick={() => update('priority', p)}
                                        sx={{
                                            borderRadius: '7px', textTransform: 'none', fontWeight: 700, fontSize: '0.7rem',
                                            border: `1.5px solid ${isOn ? meta.border : '#e0e0e0'}`,
                                            bgcolor: isOn ? meta.bg : '#fff',
                                            color:   isOn ? meta.color : '#888',
                                            '&:hover': { borderColor: meta.border, color: meta.color, bgcolor: meta.bg },
                                        }}>
                                    {p === 'LOW' ? '🟢' : p === 'MEDIUM' ? '🟡' : '🔴'} {meta.label}
                                </Button>
                            );
                        })}
                    </Box>
                </Box>

                <SectionDivider label="Optional constraints" />

                {/* Deadline + max */}
                <Grid container spacing={1.25}>
                    <Grid item xs={6}>
                        <FieldLabel>Hard deadline</FieldLabel>
                        <TextField fullWidth size="small" type="date" value={form.hardDeadline}
                                   onChange={e => update('hardDeadline', e.target.value)}
                                   InputLabelProps={{ shrink: true }}
                                   sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#7c3aed' } }} />
                    </Grid>
                    <Grid item xs={6}>
                        <FieldLabel>Max contribution/mo</FieldLabel>
                        <TextField fullWidth size="small" type="number" placeholder="Auto"
                                   value={form.maxMonthly ?? ''}
                                   onChange={e => update('maxMonthly', e.target.value ? parseFloat(e.target.value) : null)}
                                   InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: '#aaa', fontSize: '0.8rem' }}>$</Typography></InputAdornment> }}
                                   inputProps={{ min: 0, step: 5 }}
                                   sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#7c3aed' } }} />
                    </Grid>
                </Grid>

                {/* Run estimate button */}
                <Button fullWidth variant="contained" size="large" onClick={handleEstimate}
                        startIcon={<Sparkles size={15} />}
                        sx={{
                            borderRadius: '9px', textTransform: 'none', fontWeight: 800, fontSize: '0.85rem',
                            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                            boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                            '&:hover': { boxShadow: '0 6px 20px rgba(124,58,237,0.45)', transform: 'translateY(-1px)' },
                            transition: 'all 0.2s',
                            mt: 0.5,
                        }}>
                    Run Estimate
                </Button>

            </Box>

            {/* ── Result area ── */}
            {result && result.state !== 'idle' && (
                <Box sx={{ flexShrink: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                    {result.state === 'feasible' && <FeasibleResult result={result} form={form} onApply={handleApply} />}
                    {result.state === 'partial'  && <PartialResult  result={result} form={form} onApply={handleApply} />}
                    {result.state === 'blocked'  && <BlockedResult  result={result} form={form} />}
                </Box>
            )}
        </Drawer>
    );
};

export default AffordabilityEstimator;