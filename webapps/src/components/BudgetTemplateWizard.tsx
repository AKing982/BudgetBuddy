import React, { useState } from 'react';
import {
    Dialog, DialogContent, Box, Typography,
    TextField, Button, Select, MenuItem, FormControl, alpha,
} from '@mui/material';
import { CheckCircle2, PenLine } from 'lucide-react';
import BudgetPlannerService from '../services/BudgetPlannerService';
import { BPTemplateType, Period, BudgetPlannerRequest } from '../config/Types';

const MAROON = '#6b1a1a';
const TEAL   = '#0d9488';
const GREEN  = '#059669';
const SLATE  = '#64748b';
const NAVY   = '#1e293b';
const RED    = '#dc2626';

const TEMPLATE_OPTIONS = [
    { label: 'Monthly Standard',      value: BPTemplateType.MONTHLY_STD                  },
    { label: 'Bi-Weekly Standard',    value: BPTemplateType.BIWEEKLY_STD                 },
    { label: 'Weekly Standard',       value: BPTemplateType.WEEKLY_STD                   },
    { label: 'Bi-Weekly Paycheck',    value: BPTemplateType.BIWEEKLY_PAYCHECK            },
    { label: 'Monthly Paycheck',      value: BPTemplateType.MONTHLY_PAYCHECK             },
    { label: '50/30/20 Monthly',      value: BPTemplateType.FIFTY_THIRTY_TWENTY_MONTHLY  },
    { label: '50/30/20 Bi-Weekly',    value: BPTemplateType.FIFTY_THIRTY_TWENTY_BIWEEKLY },
    { label: 'Monthly Balance Sheet', value: BPTemplateType.MONTHLY_BALANCE_SHEET        },
    { label: 'Basic Essentials',      value: BPTemplateType.BASIC_ESSENTIALS             },
];

const PERIOD_OPTIONS = [
    { label: 'Weekly',    value: Period.WEEKLY    },
    { label: 'Bi-Weekly', value: Period.BIWEEKLY  },
    { label: 'Monthly',   value: Period.MONTHLY   },
    { label: 'Quarterly', value: Period.QUARTERLY },
    { label: 'Annual',    value: Period.ANNUAL    },
];

const STEPS = ['Template & Period', 'Date Range', 'Confirm'];

interface FormState {
    templateType: BPTemplateType | '';
    period:       Period | '';
    startDate:    string;
    endDate:      string;
}

const BLANK: FormState = { templateType: '', period: '', startDate: '', endDate: '' };

function getUserId(): number {
    const user = JSON.parse(sessionStorage.getItem('user') ?? '{}');
    return user.id ?? user.userId;
}

interface Props {
    open:      boolean;
    onClose:   () => void;
    onSuccess: () => void;
}

const BudgetTemplateWizard: React.FC<Props> = ({ open, onClose, onSuccess }) => {
    const [step,        setStep]        = useState(0);
    const [form,        setForm]        = useState<FormState>(BLANK);
    const [submitting,  setSubmitting]  = useState(false);
    const [error,       setError]       = useState<string | null>(null);

    const patch = (p: Partial<FormState>) => setForm(prev => ({ ...prev, ...p }));
    const reset = () => { setStep(0); setForm(BLANK); setError(null); };
    const handleClose = () => { reset(); onClose(); };

    const canAdvance =
        step === 0 ? !!form.templateType && !!form.period :
            step === 1 ? !!form.startDate && !!form.endDate && form.startDate <= form.endDate : true;

    const handleAdvance = async () => {
        if (step < STEPS.length - 1) { setStep(s => s + 1); return; }
        setSubmitting(true);
        setError(null);
        try {
            const request: BudgetPlannerRequest = {
                userId:       getUserId(),
                templateType: form.templateType as BPTemplateType,
                period:       form.period as Period,
                dateRanges:   [{ startDate: form.startDate, endDate: form.endDate }],
            };
            await BudgetPlannerService.getInstance().createBudgetTemplate(request);
            reset();
            onSuccess();
            onClose();
        } catch {
            setError('Failed to create template. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden', m: 2 } }}>

            {/* Header — matches ManualTemplateWizard style */}
            <Box sx={{ background: 'linear-gradient(135deg,#4a1010 0%,#6b1a1a 55%,#5a1515 100%)', px: 3, py: 2.25, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -18, right: -18, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
                <Box sx={{ position: 'absolute', bottom: -22, right: 55, width: 55, height: 55, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative' }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <PenLine size={15} color="white" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', letterSpacing: '-0.01em' }}>
                            New Budget Template
                        </Typography>
                        <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.65)', mt: 0.15 }}>
                            {STEPS[step]}
                        </Typography>
                    </Box>
                    <Box sx={{ px: 1.25, py: 0.35, borderRadius: '20px', bgcolor: 'rgba(255,255,255,0.12)', flexShrink: 0 }}>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                            Step {step + 1} of {STEPS.length}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>

                    {/* Step indicator */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        {STEPS.map((label, i) => (
                            <React.Fragment key={label}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                    <Box sx={{
                                        width: 32, height: 32, borderRadius: '8px', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                                        bgcolor: i < step ? TEAL : i === step ? MAROON : alpha('#000', 0.06),
                                        color: i <= step ? '#fff' : SLATE,
                                        border: `1.5px solid ${i < step ? TEAL : i === step ? MAROON : alpha('#000', 0.1)}`,
                                    }}>
                                        {i < step
                                            ? <CheckCircle2 size={14} />
                                            : <Typography sx={{ fontSize: '0.65rem', fontWeight: 800 }}>{i + 1}</Typography>
                                        }
                                    </Box>
                                    <Typography sx={{ fontSize: '0.62rem', fontWeight: i === step ? 700 : 500, color: i === step ? MAROON : i < step ? TEAL : SLATE, whiteSpace: 'nowrap' }}>
                                        {label}
                                    </Typography>
                                </Box>
                                {i < STEPS.length - 1 && (
                                    <Box sx={{ flex: 1, height: '1.5px', mx: 0.5, mb: 2, bgcolor: i < step ? TEAL : alpha('#000', 0.1), transition: 'background-color 0.3s' }} />
                                )}
                            </React.Fragment>
                        ))}
                    </Box>

                    {/* Step 0 — Template & Period */}
                    {step === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75 }}>
                                    Template Type
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select value={form.templateType} displayEmpty
                                            onChange={e => patch({ templateType: e.target.value as BPTemplateType })}
                                            renderValue={v => v
                                                ? <Typography sx={{ fontSize: '0.85rem', color: NAVY, fontWeight: 600 }}>{TEMPLATE_OPTIONS.find(t => t.value === v)?.label}</Typography>
                                                : <Typography sx={{ fontSize: '0.85rem', color: alpha(SLATE, 0.6) }}>Choose a template…</Typography>
                                            }
                                            sx={{ borderRadius: '8px', bgcolor: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#000', 0.15) } }}>
                                        {TEMPLATE_OPTIONS.map(t => (
                                            <MenuItem key={t.value} value={t.value}>
                                                <Typography sx={{ fontSize: '0.85rem' }}>{t.label}</Typography>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75 }}>
                                    Period
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select value={form.period} displayEmpty
                                            onChange={e => patch({ period: e.target.value as Period })}
                                            renderValue={v => v
                                                ? <Typography sx={{ fontSize: '0.85rem', color: NAVY, fontWeight: 600 }}>{PERIOD_OPTIONS.find(p => p.value === v)?.label}</Typography>
                                                : <Typography sx={{ fontSize: '0.85rem', color: alpha(SLATE, 0.6) }}>Choose a period…</Typography>
                                            }
                                            sx={{ borderRadius: '8px', bgcolor: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#000', 0.15) } }}>
                                        {PERIOD_OPTIONS.map(p => (
                                            <MenuItem key={p.value} value={p.value}>
                                                <Typography sx={{ fontSize: '0.85rem' }}>{p.label}</Typography>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                    )}

                    {/* Step 1 — Date Range */}
                    {step === 1 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75 }}>
                                    Start Date
                                </Typography>
                                <TextField fullWidth size="small" type="date" value={form.startDate}
                                           onChange={e => patch({ startDate: e.target.value })}
                                           InputLabelProps={{ shrink: true }}
                                           sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75 }}>
                                    End Date
                                </Typography>
                                <TextField fullWidth size="small" type="date" value={form.endDate}
                                           onChange={e => patch({ endDate: e.target.value })}
                                           InputLabelProps={{ shrink: true }}
                                           sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            </Box>
                            {form.startDate && form.endDate && form.startDate > form.endDate && (
                                <Typography sx={{ fontSize: '0.75rem', color: RED, fontWeight: 600 }}>
                                    End date must be after start date.
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* Step 2 — Confirm */}
                    {step === 2 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {[
                                { label: 'Template', value: TEMPLATE_OPTIONS.find(t => t.value === form.templateType)?.label },
                                { label: 'Period',   value: PERIOD_OPTIONS.find(p => p.value === form.period)?.label        },
                                { label: 'Start',    value: form.startDate                                                   },
                                { label: 'End',      value: form.endDate                                                     },
                            ].map(({ label, value }) => (
                                <Box key={label} sx={{ p: 1.25, borderRadius: '8px', bgcolor: alpha('#000', 0.025), border: `0.5px solid ${alpha('#000', 0.07)}` }}>
                                    <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: SLATE, mb: 0.3 }}>{label}</Typography>
                                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: NAVY }}>{value}</Typography>
                                </Box>
                            ))}
                        </Box>
                    )}

                    {error && (
                        <Typography sx={{ mt: 2, fontSize: '0.78rem', color: RED, fontWeight: 600 }}>
                            {error}
                        </Typography>
                    )}

                    {/* Nav — matches ManualTemplateWizard NavRow */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, pt: 2, borderTop: `0.5px solid ${alpha('#000', 0.08)}` }}>
                        {step > 0
                            ? <Button onClick={() => setStep(s => s - 1)} sx={{ color: SLATE, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderRadius: '8px', border: `0.5px solid ${alpha('#000', 0.12)}`, px: 1.75, py: 0.75, '&:hover': { bgcolor: alpha('#000', 0.04) } }}>← Back</Button>
                            : <Button onClick={handleClose}               sx={{ color: SLATE, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderRadius: '8px', border: `0.5px solid ${alpha('#000', 0.12)}`, px: 1.75, py: 0.75, '&:hover': { bgcolor: alpha('#000', 0.04) } }}>Cancel</Button>
                        }
                        <Button onClick={handleAdvance} disabled={!canAdvance || submitting} variant="contained" sx={{
                            bgcolor: step === STEPS.length - 1 ? GREEN : MAROON, color: '#fff',
                            textTransform: 'none', fontWeight: 700, fontSize: '0.82rem',
                            borderRadius: '8px', px: 2.25, py: 0.8, boxShadow: 'none',
                            '&:hover': { bgcolor: step === STEPS.length - 1 ? '#047857' : '#4a1010', boxShadow: 'none' },
                            '&:disabled': { bgcolor: alpha('#000', 0.1), color: alpha('#000', 0.3) },
                        }}>
                            {step === STEPS.length - 1 ? (submitting ? 'Creating…' : '✓ Create Template') : 'Continue →'}
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default BudgetTemplateWizard;