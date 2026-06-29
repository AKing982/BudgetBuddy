import React, { useEffect, useState } from 'react';
import {
    alpha,
    Box,
    Button,
    Dialog,
    DialogContent,
    Divider,
    IconButton,
    InputAdornment,
    Slider,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    AlertTriangle,
    Bell,
    Calendar,
    ChevronRight,
    DollarSign,
    Flag,
    Info,
    Target,
    X as XIcon,
} from 'lucide-react';
import { BudgetEnvelope } from '../config/Types';
import { MAROON, MAROON_DARK } from '../config/Constants';
import { fmt } from '../config/Helpers';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GoalUpdateValues {
    targetAmount:       number | '';
    targetDate:         string;
    priority:           number;
    /** Only present for individual (non-linked) envelopes */
    balanceThreshold:   number | '' | null;
}

interface GoalUpdateDialogProps {
    open:             boolean;
    envelope:         BudgetEnvelope | null;
    /** Pass null/undefined if the envelope belongs to a linked group */
    isLinked?:        boolean;
    onClose:          () => void;
    /** Called with the final values when the user submits */
    onSubmit:         (envelopeId: number, values: GoalUpdateValues) => void | Promise<void>;
    /** Optional: total number of active envelopes, used to bound the priority slider */
    totalEnvelopes?:  number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns today formatted as YYYY-MM-DD for the min date on the date picker */
const todayStr = () => new Date().toISOString().split('T')[0];

/** Thin labelled input wrapper, styled to match the app's card language */
const FieldBlock: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({
                                                                                               label, hint, children,
                                                                                           }) => (
    <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
            <Typography sx={{
                fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: '#aaa',
            }}>
                {label}
            </Typography>
            {hint && (
                <Tooltip title={hint} placement="top" arrow>
                    <Info size={11} color="#bbb" style={{ cursor: 'help', flexShrink: 0 }} />
                </Tooltip>
            )}
        </Box>
        {children}
    </Box>
);

// ─── Component ────────────────────────────────────────────────────────────────

const GoalUpdateDialog: React.FC<GoalUpdateDialogProps> = ({
                                                               open, envelope, isLinked = false, onClose, onSubmit, totalEnvelopes = 10,
                                                           }) => {
    // ── Local form state ───────────────────────────────────────────────────────
    const [targetAmount,     setTargetAmount]     = useState<number | ''>('');
    const [targetDate,       setTargetDate]       = useState('');
    const [priority,         setPriority]         = useState(1);
    const [balanceThreshold, setBalanceThreshold] = useState<number | '' | null>(null);
    const [thresholdEnabled, setThresholdEnabled] = useState(false);
    const [submitting,       setSubmitting]       = useState(false);
    const [errors,           setErrors]           = useState<Partial<Record<keyof GoalUpdateValues | 'balanceThreshold', string>>>({});

    // Seed form when envelope changes or dialog opens
    useEffect(() => {
        if (!envelope || !open) return;
        setTargetAmount(envelope.targetAmount ?? '');
        setTargetDate(envelope.targetDate ?? '');
        setPriority(envelope.priority ?? 1);
        setThresholdEnabled(envelope.balanceThreshold != null);
        setBalanceThreshold(envelope.balanceThreshold ?? '');
        setErrors({});
        setSubmitting(false);
    }, [envelope, open]);

    if (!envelope) return null;

    const currentAmount = envelope.currentAmount ?? 0;
    const progressPct   = targetAmount !== '' && targetAmount > 0
        ? Math.min((currentAmount / (targetAmount as number)) * 100, 100)
        : 0;

    // ── Validation ─────────────────────────────────────────────────────────────
    const validate = (): boolean => {
        const next: typeof errors = {};

        if (targetAmount === '' || (targetAmount as number) <= 0) {
            next.targetAmount = 'Enter a target amount greater than $0.';
        } else if ((targetAmount as number) < currentAmount) {
            next.targetAmount = `Can't be less than current balance (${fmt(currentAmount)}).`;
        }

        if (targetDate && targetDate < todayStr()) {
            next.targetDate = 'Target date must be today or later.';
        }

        if (thresholdEnabled && !isLinked) {
            if (balanceThreshold === '' || balanceThreshold === null) {
                next.balanceThreshold = 'Enter a threshold amount, or disable the alert.';
            } else if ((balanceThreshold as number) <= 0) {
                next.balanceThreshold = 'Threshold must be greater than $0.';
            } else if ((balanceThreshold as number) > (targetAmount as number)) {
                next.balanceThreshold = `Threshold can't exceed the target (${fmt(targetAmount as number)}).`;
            }
        }

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            await onSubmit(envelope.id, {
                targetAmount,
                targetDate,
                priority,
                balanceThreshold: (!isLinked && thresholdEnabled)
                    ? balanceThreshold
                    : null,
            });
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    // ── Derived display values ─────────────────────────────────────────────────
    const delta = targetAmount !== '' ? (targetAmount as number) - envelope.targetAmount : 0;
    const deltaLabel = delta === 0
        ? 'No change'
        : delta > 0
            ? `↑ ${fmt(Math.abs(delta))} more to save`
            : `↓ ${fmt(Math.abs(delta))} less to save`;
    const deltaColor = delta > 0 ? '#d97706' : delta < 0 ? '#16a34a' : '#aaa';

    const priorityMax = Math.max(totalEnvelopes, envelope.priority ?? 1);

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '18px',
                    overflow: 'hidden',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
                },
            }}
        >
            {/* ── Header ────────────────────────────────────────────────────── */}
            <Box sx={{
                background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 60%, #5a1515 100%)`,
                px: 3, pt: 2.5, pb: 2.25,
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Decorative circle */}
                <Box sx={{
                    position: 'absolute', top: -20, right: -20,
                    width: 90, height: 90, borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.06)',
                }} />

                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box sx={{
                            width: 34, height: 34, borderRadius: '9px',
                            bgcolor: 'rgba(255,255,255,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <Target size={16} color="white" />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', lineHeight: 1.2 }}>
                                Update goal
                            </Typography>
                            <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.65)', mt: 0.25 }}>
                                {envelope.envelopeName}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton
                        size="small"
                        onClick={onClose}
                        sx={{ color: 'rgba(255,255,255,0.7)', mt: -0.25, '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}
                    >
                        <XIcon size={16} />
                    </IconButton>
                </Box>

                {/* Current-state pill */}
                <Box sx={{
                    mt: 1.75, px: 1.5, py: 0.75,
                    borderRadius: '8px', bgcolor: 'rgba(0,0,0,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.55)' }}>
                        Current balance
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(currentAmount)}
                        </Typography>
                        <ChevronRight size={12} color="rgba(255,255,255,0.35)" />
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(envelope.targetAmount)}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* ── Body ──────────────────────────────────────────────────────── */}
            <DialogContent sx={{ bgcolor: '#fff', px: 3, py: 3 }}>

                {/* Target amount */}
                <FieldBlock
                    label="Target amount"
                    hint="The total you're saving toward. Can't be less than what you've already saved."
                >
                    <TextField
                        fullWidth
                        size="small"
                        type="number"
                        placeholder="0.00"
                        value={targetAmount}
                        onChange={e => {
                            const v = e.target.value;
                            setTargetAmount(v === '' ? '' : parseFloat(v));
                            setErrors(prev => ({ ...prev, targetAmount: undefined }));
                        }}
                        error={!!errors.targetAmount}
                        helperText={errors.targetAmount}
                        inputProps={{ min: 0, step: 0.01 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <DollarSign size={14} color={errors.targetAmount ? '#dc2626' : '#aaa'} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700,
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: MAROON },
                            },
                        }}
                    />

                    {/* Live delta hint */}
                    {targetAmount !== '' && (
                        <Box sx={{
                            mt: 1, px: 1.25, py: 0.6,
                            borderRadius: '7px', bgcolor: alpha(deltaColor, 0.07),
                            border: `1px solid ${alpha(deltaColor, 0.2)}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box sx={{ width: 20, height: 4, borderRadius: 2, bgcolor: alpha(MAROON, 0.18), overflow: 'hidden' }}>
                                    <Box sx={{ width: `${progressPct}%`, height: '100%', bgcolor: MAROON, borderRadius: 2 }} />
                                </Box>
                                <Typography sx={{ fontSize: '0.63rem', color: '#aaa' }}>
                                    {progressPct.toFixed(0)}% saved
                                </Typography>
                            </Box>
                            <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: deltaColor }}>
                                {deltaLabel}
                            </Typography>
                        </Box>
                    )}
                </FieldBlock>

                {/* Target date */}
                <FieldBlock
                    label="Target date"
                    hint="Optional deadline. Leave blank for an open-ended goal."
                >
                    <TextField
                        fullWidth
                        size="small"
                        type="date"
                        value={targetDate}
                        onChange={e => {
                            setTargetDate(e.target.value);
                            setErrors(prev => ({ ...prev, targetDate: undefined }));
                        }}
                        error={!!errors.targetDate}
                        helperText={errors.targetDate}
                        inputProps={{ min: todayStr() }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Calendar size={14} color={errors.targetDate ? '#dc2626' : '#aaa'} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '8px', fontSize: '0.85rem',
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: MAROON },
                            },
                        }}
                    />
                </FieldBlock>

                {/* Priority */}
                <FieldBlock
                    label="Priority"
                    hint="Higher priority envelopes get funded first in the multi-envelope planner."
                >
                    <Box sx={{
                        px: 2, pt: 1.5, pb: 1,
                        borderRadius: '10px', bgcolor: '#f8f8f8', border: '1px solid #eee',
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                <Flag size={12} color={MAROON} />
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#333' }}>
                                    Priority
                                </Typography>
                            </Box>
                            <Box sx={{
                                px: 1.25, py: 0.3, borderRadius: '20px',
                                bgcolor: alpha(MAROON, 0.1), display: 'inline-flex',
                                alignItems: 'center', gap: 0.3,
                            }}>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, color: MAROON, fontVariantNumeric: 'tabular-nums' }}>
                                    #{priority}
                                </Typography>
                                <Typography sx={{ fontSize: '0.63rem', color: alpha(MAROON, 0.6) }}>
                                    of {priorityMax}
                                </Typography>
                            </Box>
                        </Box>
                        <Slider
                            value={priority}
                            onChange={(_, v) => setPriority(v as number)}
                            min={1}
                            max={priorityMax}
                            step={1}
                            marks
                            valueLabelDisplay="auto"
                            sx={{
                                color: MAROON,
                                '& .MuiSlider-thumb': {
                                    width: 16, height: 16,
                                    '&:hover, &.Mui-focusVisible': { boxShadow: `0 0 0 6px ${alpha(MAROON, 0.16)}` },
                                },
                                '& .MuiSlider-rail': { bgcolor: alpha(MAROON, 0.18) },
                                '& .MuiSlider-mark': { bgcolor: alpha(MAROON, 0.3) },
                                '& .MuiSlider-valueLabel': {
                                    bgcolor: MAROON, borderRadius: '6px',
                                    fontSize: '0.7rem', fontWeight: 800,
                                },
                            }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -0.5 }}>
                            <Typography sx={{ fontSize: '0.58rem', color: '#aaa' }}>Highest (1)</Typography>
                            <Typography sx={{ fontSize: '0.58rem', color: '#aaa' }}>Lowest ({priorityMax})</Typography>
                        </Box>
                    </Box>
                </FieldBlock>

                {/* Balance threshold — individual envelopes only */}
                {!isLinked && (
                    <>
                        <Divider sx={{ mb: 2.5 }} />

                        <FieldBlock
                            label="Balance threshold alert"
                            hint="Get notified when this envelope's balance crosses the threshold you set."
                        >
                            {/* Toggle row */}
                            <Box
                                onClick={() => setThresholdEnabled(p => !p)}
                                sx={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    p: 1.5, borderRadius: '10px', cursor: 'pointer',
                                    border: `1px solid ${thresholdEnabled ? alpha(MAROON, 0.3) : '#eee'}`,
                                    bgcolor: thresholdEnabled ? alpha(MAROON, 0.04) : '#f8f8f8',
                                    transition: 'all 0.18s', mb: thresholdEnabled ? 1.25 : 0,
                                    '&:hover': { borderColor: alpha(MAROON, 0.35) },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{
                                        width: 28, height: 28, borderRadius: '7px',
                                        bgcolor: thresholdEnabled ? alpha(MAROON, 0.12) : alpha('#aaa', 0.1),
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0, transition: 'all 0.18s',
                                    }}>
                                        <Bell size={13} color={thresholdEnabled ? MAROON : '#aaa'} />
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: thresholdEnabled ? '#111' : '#888' }}>
                                            {thresholdEnabled ? 'Alert enabled' : 'Enable threshold alert'}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.62rem', color: '#aaa', mt: 0.1 }}>
                                            Notify me when the balance reaches a set amount
                                        </Typography>
                                    </Box>
                                </Box>
                                {/* Pill toggle */}
                                <Box sx={{
                                    width: 36, height: 20, borderRadius: '10px',
                                    bgcolor: thresholdEnabled ? MAROON : '#ddd',
                                    position: 'relative', flexShrink: 0,
                                    transition: 'background 0.18s',
                                }}>
                                    <Box sx={{
                                        position: 'absolute', top: 2,
                                        left: thresholdEnabled ? 18 : 2,
                                        width: 16, height: 16,
                                        borderRadius: '50%', bgcolor: '#fff',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                        transition: 'left 0.18s',
                                    }} />
                                </Box>
                            </Box>

                            {/* Threshold input — only visible when enabled */}
                            {thresholdEnabled && (
                                <Box>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        placeholder="e.g. 500"
                                        value={balanceThreshold ?? ''}
                                        onChange={e => {
                                            const v = e.target.value;
                                            setBalanceThreshold(v === '' ? '' : parseFloat(v));
                                            setErrors(prev => ({ ...prev, balanceThreshold: undefined }));
                                        }}
                                        error={!!errors.balanceThreshold}
                                        helperText={errors.balanceThreshold}
                                        inputProps={{ min: 0, step: 0.01 }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <DollarSign size={14} color={errors.balanceThreshold ? '#dc2626' : '#aaa'} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700,
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: MAROON },
                                            },
                                        }}
                                    />

                                    {/* Context hint under the field */}
                                    {balanceThreshold !== '' && balanceThreshold !== null && !errors.balanceThreshold && (
                                        <Box sx={{
                                            mt: 1, px: 1.25, py: 0.75,
                                            borderRadius: '8px',
                                            bgcolor: alpha('#0284c7', 0.05),
                                            border: `1px solid ${alpha('#0284c7', 0.18)}`,
                                            display: 'flex', alignItems: 'flex-start', gap: 0.75,
                                        }}>
                                            <AlertTriangle size={12} color="#0284c7" style={{ marginTop: 1, flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: '0.63rem', color: '#0369a1', lineHeight: 1.5 }}>
                                                You'll be alerted once this envelope's balance reaches{' '}
                                                <strong>{fmt(balanceThreshold as number)}</strong>.
                                                {targetAmount !== '' && (balanceThreshold as number) > 0 && (
                                                    <> That's{' '}
                                                        {(((balanceThreshold as number) / (targetAmount as number)) * 100).toFixed(0)}% of your goal.</>
                                                )}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </FieldBlock>
                    </>
                )}

                {/* ── Actions ─────────────────────────────────────────────── */}
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={onClose}
                        disabled={submitting}
                        sx={{
                            borderRadius: '9px', textTransform: 'none',
                            fontWeight: 700, fontSize: '0.82rem',
                            borderColor: '#d5d5d5', color: '#555',
                            '&:hover': { borderColor: '#aaa', bgcolor: '#fafafa' },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={submitting}
                        sx={{
                            borderRadius: '9px', textTransform: 'none',
                            fontWeight: 700, fontSize: '0.82rem',
                            bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK },
                            '&.Mui-disabled': { bgcolor: alpha(MAROON, 0.4), color: '#fff' },
                        }}
                    >
                        {submitting ? 'Saving…' : 'Save changes'}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default GoalUpdateDialog;