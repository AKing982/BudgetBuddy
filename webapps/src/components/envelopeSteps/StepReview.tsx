import React, { useMemo } from 'react';
import { alpha, Box, Button, Chip, Grid, IconButton, LinearProgress, Stack, Typography } from '@mui/material';
import { AlertTriangle, CheckCircle, Plus, Trash2, Wallet } from 'lucide-react';
import {
    ENVELOPE_COLORS, ENVELOPE_ICONS, FREQUENCY_LABELS, MAROON,
    addMonths, autoMonthly, dateFromStr, fmtDate, fmt, monthsToReach,
    NewEnvelopeForm, FormUpdater,
} from '../../utils/EnvelopeStepTypes';

// ── Linked envelope manager ───────────────────────────────────────────────────
interface LinkedEnvelopeManagerProps {
    forms:     NewEnvelopeForm[];
    activeIdx: number;
    onSelect:  (i: number) => void;
    onAdd:     () => void;
    onRemove:  (i: number) => void;
}

export const LinkedEnvelopeManager: React.FC<LinkedEnvelopeManagerProps> = ({
                                                                                forms, activeIdx, onSelect, onAdd, onRemove,
                                                                            }) => (
    <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
            <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7c3aed' }}>
                Linked group — {forms.length} envelope{forms.length !== 1 ? 's' : ''}
            </Typography>
            <Button size="small" startIcon={<Plus size={12} />} onClick={onAdd}
                    sx={{ borderRadius: '7px', textTransform: 'none', fontWeight: 700, fontSize: '0.7rem',
                        bgcolor: alpha('#7c3aed', 0.1), color: '#7c3aed',
                        '&:hover': { bgcolor: alpha('#7c3aed', 0.18) } }}>
                Add envelope
            </Button>
        </Box>
        <Stack spacing={0.75}>
            {forms.map((f, i) => {
                const c = f.envelopeType ? ENVELOPE_COLORS[f.envelopeType] : '#94a3b8';
                return (
                    <Box key={i} onClick={() => onSelect(i)} sx={{
                        display: 'flex', alignItems: 'center', gap: 1.25,
                        p: 1.25, borderRadius: '9px', cursor: 'pointer',
                        border: `1.5px solid ${i === activeIdx ? c : alpha('#000', 0.08)}`,
                        bgcolor: i === activeIdx ? alpha(c, 0.05) : '#fafafa',
                        transition: 'all 0.15s',
                        '&:hover': { borderColor: c, bgcolor: alpha(c, 0.04) },
                    }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: '7px', bgcolor: alpha(c, 0.12),
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: c, flexShrink: 0 }}>
                            {f.envelopeType ? ENVELOPE_ICONS[f.envelopeType] : <Wallet size={14} />}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#111',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {f.envelopeName || `Envelope ${i + 1}`}
                            </Typography>
                            <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>
                                {f.targetAmount !== '' ? fmt(Number(f.targetAmount)) : 'No amount set'}
                                {f.envelopeType ? ` · ${f.envelopeType.charAt(0) + f.envelopeType.slice(1).toLowerCase()}` : ''}
                            </Typography>
                        </Box>
                        {i === activeIdx && (
                            <Chip size="small" label="Editing"
                                  sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700, bgcolor: alpha(c, 0.12), color: c }} />
                        )}
                        {forms.length > 2 && (
                            <IconButton size="small" onClick={e => { e.stopPropagation(); onRemove(i); }}
                                        sx={{ p: 0.4, color: '#ccc', '&:hover': { color: '#dc2626', bgcolor: alpha('#dc2626', 0.08) } }}>
                                <Trash2 size={12} />
                            </IconButton>
                        )}
                    </Box>
                );
            })}
        </Stack>
    </Box>
);

// ── StepReview ────────────────────────────────────────────────────────────────
interface StepReviewProps {
    form:      NewEnvelopeForm;
    update:    FormUpdater;
    isLinked:  boolean;
    allForms:  NewEnvelopeForm[];
    activeIdx: number;
    onSelect:  (i: number) => void;
    onAdd:     () => void;
    onRemove:  (i: number) => void;
}

const StepReview: React.FC<StepReviewProps> = ({
                                                   form, isLinked, allForms, activeIdx, onSelect, onAdd, onRemove,
                                               }) => {
    const color = form.envelopeType ? ENVELOPE_COLORS[form.envelopeType] : MAROON;
    const pi    = form.envelopeType === 'PAYOFF' ? form.paymentInfo : null;

    const contrib = useMemo(() => {
        if (form.contributionMode === 'auto' && form.targetDate && form.targetAmount !== '') {
            return autoMonthly(Number(form.targetAmount), Number(form.startingAmount) || 0, form.targetDate);
        }
        return Number(form.monthlyContribution) || 0;
    }, [form]);

    const freqFactor  = form.contributionFrequency === 'WEEKLY' ? 4.33 : form.contributionFrequency === 'BIWEEKLY' ? 2.17 : 1;
    const months      = monthsToReach(Number(form.targetAmount) || 0, Number(form.startingAmount) || 0, contrib * freqFactor);
    const projDate    = months ? addMonths(months) : null;
    const userDate    = dateFromStr(form.targetDate);
    const isRealistic = !userDate || !projDate || projDate <= userDate;
    const startPct    = form.targetAmount !== '' && Number(form.targetAmount) > 0
        ? Math.min((Number(form.startingAmount || 0) / Number(form.targetAmount)) * 100, 100)
        : 0;

    const rows = [
        { label: 'Envelope Type',   value: form.envelopeType ? (form.envelopeType === 'FUND' ? 'Fund' : form.envelopeType === 'PAYOFF' ? 'Pay-Off' : 'Purchase') : '—' },
        { label: 'Name',            value: form.envelopeName || '—' },
        { label: 'Target Amount',   value: form.targetAmount !== '' ? fmt(Number(form.targetAmount)) : '—' },
        { label: 'Starting Amount', value: form.startingAmount !== '' && Number(form.startingAmount) > 0 ? fmt(Number(form.startingAmount)) : 'None' },
        { label: 'Target Date',     value: userDate ? fmtDate(userDate) : 'Not set' },
        { label: 'Contribution',    value: contrib > 0 ? `${fmt(contrib)} / ${FREQUENCY_LABELS[form.contributionFrequency].toLowerCase()}` : 'Not set' },
        { label: 'Mode',            value: form.contributionMode === 'auto' ? 'Auto-calculated' : 'Manual' },
    ];

    return (
        <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>
                Review your envelope
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
                Here's everything at a glance — and what the app predicts for your goal.
            </Typography>

            {isLinked && (
                <LinkedEnvelopeManager
                    forms={allForms} activeIdx={activeIdx}
                    onSelect={onSelect} onAdd={onAdd} onRemove={onRemove}
                />
            )}

            {/* Visual summary */}
            <Box sx={{ p: 2.5, borderRadius: '14px', bgcolor: alpha(color, 0.06), border: `2px solid ${alpha(color, 0.2)}`, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ width: 42, height: 42, borderRadius: '11px', bgcolor: alpha(color, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                        {form.envelopeType ? ENVELOPE_ICONS[form.envelopeType] : <Wallet size={22} />}
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 900, fontSize: '1rem', color: '#111' }}>{form.envelopeName || 'Unnamed Envelope'}</Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: '#888' }}>{form.description || 'No description'}</Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color }}>Progress preview</Typography>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color }}>{startPct.toFixed(0)}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={startPct}
                                sx={{ height: 7, borderRadius: 3.5, bgcolor: alpha(color, 0.12), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3.5 } }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.6 }}>
                    <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>Starting: {fmt(Number(form.startingAmount) || 0)}</Typography>
                    <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>Goal: {form.targetAmount !== '' ? fmt(Number(form.targetAmount)) : '—'}</Typography>
                </Box>
            </Box>

            {/* Payment plan mini-summary for PAYOFF */}
            {pi && (pi.merchant || pi.totalAmount > 0) && (
                <Box sx={{ mb: 3, p: 2, borderRadius: '12px', bgcolor: alpha('#dc2626', 0.05), border: `1px solid ${alpha('#dc2626', 0.18)}` }}>
                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#dc2626', mb: 1 }}>
                        Payment Plan
                    </Typography>
                    <Grid container spacing={1}>
                        {[
                            { label: 'Merchant',    value: pi.merchant || '—' },
                            { label: 'Payments',    value: `${pi.numberOfPayments} × ${pi.firstPaymentAmount > 0 ? fmt(pi.firstPaymentAmount) : '—'}` },
                            { label: 'Payoff by',   value: pi.endDate ? new Date(pi.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
                            { label: 'Pay-in-Four', value: pi.isPayInFour ? 'Yes' : 'No' },
                        ].map(({ label, value }) => (
                            <Grid item xs={6} key={label}>
                                <Box sx={{ p: 1, borderRadius: '6px', bgcolor: '#fff', border: '1px solid #eee' }}>
                                    <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#bbb', mb: 0.2 }}>{label}</Typography>
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#111' }}>{value}</Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* App prediction */}
            <Box sx={{ p: 2, borderRadius: '12px', mb: 3,
                bgcolor: alpha(isRealistic ? '#16a34a' : '#d97706', 0.06),
                border: `1px solid ${alpha(isRealistic ? '#16a34a' : '#d97706', 0.22)}` }}>
                <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: isRealistic ? '#16a34a' : '#d97706', mb: 1 }}>
                    App Prediction
                </Typography>
                <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                        <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: '#fff', border: '1px solid #eee' }}>
                            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', mb: 0.3 }}>Projected Completion</Typography>
                            <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#111' }}>
                                {projDate ? fmtDate(projDate) : 'Set contributions'}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: '#fff', border: '1px solid #eee' }}>
                            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', mb: 0.3 }}>Your Target Date</Typography>
                            <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#111' }}>
                                {userDate ? fmtDate(userDate) : 'Not set'}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.25, borderRadius: '8px', bgcolor: '#fff', border: '1px solid #eee' }}>
                            {isRealistic
                                ? <CheckCircle size={15} color="#16a34a" style={{ marginTop: 1, flexShrink: 0 }} />
                                : <AlertTriangle size={15} color="#d97706" style={{ marginTop: 1, flexShrink: 0 }} />}
                            <Typography sx={{ fontSize: '0.72rem', color: '#555', lineHeight: 1.5 }}>
                                {!projDate
                                    ? "Add a contribution amount to see when you'll reach your goal."
                                    : !userDate
                                        ? `At your current rate you'll reach ${fmt(Number(form.targetAmount))} by ${fmtDate(projDate)} — about ${months} month${months !== 1 ? 's' : ''} from now.`
                                        : isRealistic
                                            ? `Your target date of ${fmtDate(userDate)} is achievable! Projected to finish ${months ? `in ${months} month${months !== 1 ? 's' : ''}` : 'on time'}.`
                                            : `Your target of ${fmtDate(userDate)} may be tight. At ${fmt(contrib)}/${FREQUENCY_LABELS[form.contributionFrequency].toLowerCase()} you'll finish by ${fmtDate(projDate)}.`}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* Detail rows */}
            <Box sx={{ borderRadius: '10px', border: '1px solid #eee', overflow: 'hidden' }}>
                {rows.map(({ label, value }, i) => (
                    <Box key={label} sx={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        px: 2, py: 1.25,
                        bgcolor: i % 2 === 0 ? '#fafafa' : '#fff',
                        borderBottom: i < rows.length - 1 ? '1px solid #f0f0f0' : 'none',
                    }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#888' }}>{label}</Typography>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                    </Box>
                ))}
            </Box>

            {/* Linked group total */}
            {isLinked && allForms.length > 1 && (
                <Box sx={{ mt: 2, p: 1.75, borderRadius: '10px', bgcolor: alpha('#7c3aed', 0.05), border: `1px solid ${alpha('#7c3aed', 0.18)}` }}>
                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7c3aed', mb: 1 }}>
                        Group total
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '0.75rem', color: '#555' }}>Combined target</Typography>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#7c3aed', fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(allForms.reduce((s, f) => s + (f.targetAmount !== '' ? Number(f.targetAmount) : 0), 0))}
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default StepReview;