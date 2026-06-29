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
    ChevronLeft,
    ChevronRight,
    DollarSign,
    Flag,
    Info,
    Layers,
    X as XIcon,
} from 'lucide-react';
import { BudgetEnvelope } from '../config/Types';
import { ENVELOPE_COLORS, MAROON, MAROON_DARK } from '../config/Constants';
import { fmt, progressPct } from '../config/Helpers';
import { LinkedEnvelopeGroup } from '../services/BudgetEnvelopeService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LinkedGoalUpdateValues {
    targetDate:       string;
    priority:         number;
    balanceThreshold: number | '' | null;
}

interface LinkedGoalUpdateDialogProps {
    open:            boolean;
    group:           LinkedEnvelopeGroup | null;
    onClose:         () => void;
    onSubmit:        (envelopeId: number, values: LinkedGoalUpdateValues) => void | Promise<void>;
    /** Total active envelopes across all groups — bounds the priority slider */
    totalEnvelopes?: number;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split('T')[0];

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

// ─── Step 1: envelope picker ──────────────────────────────────────────────────

interface EnvelopePickerProps {
    group:    LinkedEnvelopeGroup;
    onSelect: (envelope: BudgetEnvelope) => void;
    onClose:  () => void;
}

const EnvelopePicker: React.FC<EnvelopePickerProps> = ({ group, onSelect, onClose }) => (
    <>
        {/* Header */}
        <Box sx={{
            background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 60%, #5a1515 100%)`,
            px: 3, pt: 2.5, pb: 2.25, position: 'relative', overflow: 'hidden',
        }}>
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
                        <Layers size={16} color="white" />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', lineHeight: 1.2 }}>
                            Update linked goal
                        </Typography>
                        <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.65)', mt: 0.25 }}>
                            {group.linkName} · {group.envelopes.length} envelopes
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

            {/* Step indicator */}
            <Box sx={{
                mt: 1.75, px: 1.5, py: 0.75, borderRadius: '8px',
                bgcolor: 'rgba(0,0,0,0.22)',
                display: 'flex', alignItems: 'center', gap: 1,
            }}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Box sx={{ width: 16, height: 4, borderRadius: 2, bgcolor: '#fff' }} />
                    <Box sx={{ width: 16, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.3)' }} />
                </Box>
                <Typography sx={{ fontSize: '0.63rem', color: 'rgba(255,255,255,0.6)' }}>
                    Step 1 of 2 — choose an envelope to update
                </Typography>
            </Box>
        </Box>

        {/* Envelope list */}
        <DialogContent sx={{ bgcolor: '#fff', px: 3, py: 3 }}>
            <Typography sx={{
                fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: '#aaa', mb: 1.5,
            }}>
                Envelopes in this group
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {group.envelopes.map(env => {
                    const color = ENVELOPE_COLORS[env.envelopeType];
                    const pct   = progressPct(env.currentAmount, env.targetAmount);
                    return (
                        <Box
                            key={env.id}
                            onClick={() => onSelect(env)}
                            sx={{
                                p: 1.75, borderRadius: '12px', cursor: 'pointer',
                                border: `1px solid ${alpha(color, 0.22)}`,
                                bgcolor: alpha(color, 0.03),
                                display: 'flex', alignItems: 'center', gap: 1.5,
                                transition: 'all 0.15s',
                                '&:hover': {
                                    borderColor: alpha(color, 0.5),
                                    bgcolor: alpha(color, 0.07),
                                    transform: 'translateX(2px)',
                                },
                            }}
                        >
                            {/* Color swatch */}
                            <Box sx={{
                                width: 36, height: 36, borderRadius: '9px', flexShrink: 0,
                                bgcolor: alpha(color, 0.14),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: color }} />
                            </Box>

                            {/* Info */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#111', mb: 0.3 }}>
                                    {env.envelopeName}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {/* Mini progress bar */}
                                    <Box sx={{
                                        flex: 1, height: 4, borderRadius: 2,
                                        bgcolor: alpha(color, 0.15), overflow: 'hidden',
                                    }}>
                                        <Box sx={{
                                            width: `${pct}%`, height: '100%',
                                            bgcolor: color, borderRadius: 2,
                                        }} />
                                    </Box>
                                    <Typography sx={{
                                        fontSize: '0.63rem', fontWeight: 700,
                                        color: alpha(color, 0.8), flexShrink: 0,
                                        fontVariantNumeric: 'tabular-nums',
                                    }}>
                                        {pct.toFixed(0)}%
                                    </Typography>
                                </Box>
                                <Typography sx={{ fontSize: '0.6rem', color: '#aaa', mt: 0.25 }}>
                                    {fmt(env.currentAmount)} of {fmt(env.targetAmount)}
                                    {env.targetDate && ` · due ${new Date(env.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                                </Typography>
                            </Box>

                            <ChevronRight size={15} color="#ccc" style={{ flexShrink: 0 }} />
                        </Box>
                    );
                })}
            </Box>
        </DialogContent>
    </>
);

// ─── Step 2: edit form ────────────────────────────────────────────────────────

interface EditFormProps {
    envelope:       BudgetEnvelope;
    group:          LinkedEnvelopeGroup;
    totalEnvelopes: number;
    onBack:         () => void;
    onClose:        () => void;
    onSubmit:       (envelopeId: number, values: LinkedGoalUpdateValues) => void | Promise<void>;
}

const EditForm: React.FC<EditFormProps> = ({
                                               envelope, group, totalEnvelopes, onBack, onClose, onSubmit,
                                           }) => {
    const color = ENVELOPE_COLORS[envelope.envelopeType];

    const [targetDate,       setTargetDate]       = useState(envelope.targetDate ?? '');
    const [priority,         setPriority]         = useState(envelope.priority ?? 1);
    const [balanceThreshold, setBalanceThreshold] = useState<number | '' | null>(envelope.balanceThreshold ?? '');
    const [thresholdEnabled, setThresholdEnabled] = useState(envelope.balanceThreshold != null);
    const [submitting,       setSubmitting]       = useState(false);
    const [errors,           setErrors]           = useState<Partial<Record<'targetDate' | 'balanceThreshold', string>>>({});

    const priorityMax = Math.max(totalEnvelopes, envelope.priority ?? 1);

    useEffect(() => {
        setTargetDate(envelope.targetDate ?? '');
        setPriority(envelope.priority ?? 1);
        setBalanceThreshold(envelope.balanceThreshold ?? '');
        setThresholdEnabled(envelope.balanceThreshold != null);
        setSubmitting(false);
        setErrors({});
    }, [envelope.id]);

    const validate = (): boolean => {
        const next: typeof errors = {};
        if (targetDate && targetDate < todayStr()) {
            next.targetDate = 'Target date must be today or later.';
        }
        if (thresholdEnabled) {
            if (balanceThreshold === '' || balanceThreshold === null) {
                next.balanceThreshold = 'Enter a threshold amount, or disable the alert.';
            } else if ((balanceThreshold as number) <= 0) {
                next.balanceThreshold = 'Threshold must be greater than $0.';
            } else if ((balanceThreshold as number) > envelope.targetAmount) {
                next.balanceThreshold = `Threshold can't exceed the target (${fmt(envelope.targetAmount)}).`;
            }
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            await onSubmit(envelope.id, {
                targetDate,
                priority,
                balanceThreshold: thresholdEnabled ? balanceThreshold : null,
            });
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {/* Header */}
            <Box sx={{
                background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 60%, #5a1515 100%)`,
                px: 3, pt: 2.5, pb: 2.25, position: 'relative', overflow: 'hidden',
            }}>
                <Box sx={{
                    position: 'absolute', top: -20, right: -20,
                    width: 90, height: 90, borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.06)',
                }} />
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        {/* Back button */}
                        <IconButton
                            size="small"
                            onClick={onBack}
                            sx={{
                                color: 'rgba(255,255,255,0.8)', flexShrink: 0,
                                bgcolor: 'rgba(255,255,255,0.1)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                            }}
                        >
                            <ChevronLeft size={15} />
                        </IconButton>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', lineHeight: 1.2 }}>
                                {envelope.envelopeName}
                            </Typography>
                            <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.65)', mt: 0.25 }}>
                                {group.linkName}
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

                {/* Step indicator + current state */}
                <Box sx={{
                    mt: 1.75, px: 1.5, py: 0.75, borderRadius: '8px',
                    bgcolor: 'rgba(0,0,0,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Box sx={{ width: 16, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.35)' }} />
                            <Box sx={{ width: 16, height: 4, borderRadius: 2, bgcolor: '#fff' }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.63rem', color: 'rgba(255,255,255,0.6)' }}>
                            Step 2 of 2
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(envelope.currentAmount)}
                        </Typography>
                        <ChevronRight size={11} color="rgba(255,255,255,0.35)" />
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(envelope.targetAmount)}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Form body */}
            <DialogContent sx={{ bgcolor: '#fff', px: 3, py: 3 }}>

                {/* Target date */}
                <FieldBlock
                    label="Target date"
                    hint="Optional deadline for this envelope. Updating this only affects this envelope, not others in the group."
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
                    hint="Controls where this envelope sits in the multi-envelope planner's funding order."
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
                                bgcolor: alpha(MAROON, 0.1),
                                display: 'inline-flex', alignItems: 'center', gap: 0.3,
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

                {/* Balance threshold */}
                <Divider sx={{ mb: 2.5 }} />

                <FieldBlock
                    label="Balance threshold alert"
                    hint="Get notified when this envelope's balance reaches the amount you set. Applies to this envelope only."
                >
                    {/* Toggle row */}
                    <Box
                        onClick={() => setThresholdEnabled(p => !p)}
                        sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            p: 1.5, borderRadius: '10px', cursor: 'pointer',
                            border: `1px solid ${thresholdEnabled ? alpha(color, 0.35) : '#eee'}`,
                            bgcolor: thresholdEnabled ? alpha(color, 0.05) : '#f8f8f8',
                            transition: 'all 0.18s', mb: thresholdEnabled ? 1.25 : 0,
                            '&:hover': { borderColor: alpha(color, 0.4) },
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                                width: 28, height: 28, borderRadius: '7px',
                                bgcolor: thresholdEnabled ? alpha(color, 0.14) : alpha('#aaa', 0.1),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, transition: 'all 0.18s',
                            }}>
                                <Bell size={13} color={thresholdEnabled ? color : '#aaa'} />
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
                            bgcolor: thresholdEnabled ? color : '#ddd',
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

                    {/* Threshold input */}
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
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: color },
                                    },
                                }}
                            />

                            {/* Context hint */}
                            {balanceThreshold !== '' && balanceThreshold !== null && !errors.balanceThreshold && (
                                <Box sx={{
                                    mt: 1, px: 1.25, py: 0.75, borderRadius: '8px',
                                    bgcolor: alpha('#0284c7', 0.05),
                                    border: `1px solid ${alpha('#0284c7', 0.18)}`,
                                    display: 'flex', alignItems: 'flex-start', gap: 0.75,
                                }}>
                                    <AlertTriangle size={12} color="#0284c7" style={{ marginTop: 1, flexShrink: 0 }} />
                                    <Typography sx={{ fontSize: '0.63rem', color: '#0369a1', lineHeight: 1.5 }}>
                                        You'll be alerted once <strong>{envelope.envelopeName}</strong>'s balance
                                        reaches <strong>{fmt(balanceThreshold as number)}</strong>
                                        {envelope.targetAmount > 0 && (
                                            <> — {(((balanceThreshold as number) / envelope.targetAmount) * 100).toFixed(0)}% of its goal</>
                                        )}.
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </FieldBlock>

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={onBack}
                        disabled={submitting}
                        sx={{
                            borderRadius: '9px', textTransform: 'none',
                            fontWeight: 700, fontSize: '0.82rem',
                            borderColor: '#d5d5d5', color: '#555',
                            '&:hover': { borderColor: '#aaa', bgcolor: '#fafafa' },
                        }}
                    >
                        Back
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
        </>
    );
};

// ─── Root dialog ──────────────────────────────────────────────────────────────

const LinkedGoalUpdateDialog: React.FC<LinkedGoalUpdateDialogProps> = ({
                                                                           open, group, onClose, onSubmit, totalEnvelopes = 10,
                                                                       }) => {
    const [selectedEnvelope, setSelectedEnvelope] = useState<BudgetEnvelope | null>(null);

    // Reset to step 1 whenever the dialog opens or the group changes
    useEffect(() => {
        if (open) setSelectedEnvelope(null);
    }, [open, group]);

    const handleClose = () => {
        setSelectedEnvelope(null);
        onClose();
    };

    if (!group) return null;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
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
            {selectedEnvelope === null ? (
                <EnvelopePicker
                    group={group}
                    onSelect={setSelectedEnvelope}
                    onClose={handleClose}
                />
            ) : (
                <EditForm
                    envelope={selectedEnvelope}
                    group={group}
                    totalEnvelopes={totalEnvelopes}
                    onBack={() => setSelectedEnvelope(null)}
                    onClose={handleClose}
                    onSubmit={onSubmit}
                />
            )}
        </Dialog>
    );
};

export default LinkedGoalUpdateDialog;