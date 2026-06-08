import React from 'react';
import { alpha, Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import { Calendar, CreditCard, Info } from 'lucide-react';
import {
    ENVELOPE_COLORS, MAROON,
    addMonths, autoMonthly, dateFromStr, fmtDate, fmt, monthsBetween,
    NewEnvelopeForm, FormUpdater,
} from '../../utils/EnvelopeStepTypes';

interface StepTimelineProps { form: NewEnvelopeForm; update: FormUpdater; }

const QUICK_OPTIONS = [
    { label: '3 months',  months: 3  },
    { label: '6 months',  months: 6  },
    { label: '1 year',    months: 12 },
    { label: '18 months', months: 18 },
    { label: '2 years',   months: 24 },
];

const StepTimeline: React.FC<StepTimelineProps> = ({ form, update }) => {
    const color        = form.envelopeType ? ENVELOPE_COLORS[form.envelopeType] : MAROON;
    const isPayoff     = form.envelopeType === 'PAYOFF';
    const payoffEndDate = isPayoff && form.paymentInfo?.endDate ? form.paymentInfo.endDate : null;

    return (
        <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>
                When do you want to reach this goal?
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
                {isPayoff && payoffEndDate
                    ? 'Your payment plan end date has been pre-filled below. You can adjust it if needed.'
                    : 'Optional — but setting a deadline helps us calculate a realistic contribution amount.'}
            </Typography>

            {/* Payoff hint — offer to use the payment plan end date */}
            {isPayoff && payoffEndDate && !form.targetDate && (
                <Box sx={{ mb: 2, p: 1.5, borderRadius: '10px', bgcolor: alpha(color, 0.06), border: `1px solid ${alpha(color, 0.2)}`, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <CreditCard size={13} color={color} style={{ flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '0.72rem', color: '#555', flex: 1 }}>
                        Payment plan end date:{' '}
                        <strong>{new Date(payoffEndDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>
                    </Typography>
                    <Button size="small" onClick={() => update('targetDate', payoffEndDate)}
                            sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700, fontSize: '0.68rem', bgcolor: alpha(color, 0.1), color, flexShrink: 0, '&:hover': { bgcolor: alpha(color, 0.18) } }}>
                        Use this
                    </Button>
                </Box>
            )}

            <Stack spacing={3}>
                {/* Quick-select chips — hidden for PAYOFF since deadline comes from payment plan */}
                {!isPayoff && (
                    <Box>
                        <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>
                            Quick select
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                            {QUICK_OPTIONS.map(({ label, months }) => {
                                const d        = addMonths(months).toISOString().split('T')[0];
                                const selected = form.targetDate === d;
                                return (
                                    <Chip key={label} label={label}
                                          onClick={() => update('targetDate', addMonths(months).toISOString().split('T')[0])}
                                          sx={{
                                              fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer',
                                              bgcolor: selected ? alpha(color, 0.12) : alpha('#000', 0.05),
                                              color:   selected ? color : '#555',
                                              border:  `1px solid ${selected ? alpha(color, 0.3) : 'transparent'}`,
                                              '&:hover': { bgcolor: alpha(color, 0.08), color },
                                          }}
                                    />
                                );
                            })}
                        </Box>
                    </Box>
                )}

                <TextField
                    label="Target Date (optional)"
                    type="date"
                    value={form.targetDate}
                    onChange={e => update('targetDate', e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: new Date().toISOString().split('T')[0] }}
                    sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
                />

                {form.targetDate && form.targetAmount !== '' && Number(form.targetAmount) > 0 && (
                    <Box sx={{ p: 2, borderRadius: '10px', bgcolor: alpha(color, 0.05), border: `1px solid ${alpha(color, 0.15)}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Calendar size={14} color={color} />
                            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color }}>
                                {fmtDate(dateFromStr(form.targetDate)!)}
                            </Typography>
                        </Box>
                        {(() => {
                            const months = monthsBetween(new Date(), dateFromStr(form.targetDate)!);
                            const needed = autoMonthly(Number(form.targetAmount), Number(form.startingAmount) || 0, form.targetDate);
                            return (
                                <Typography sx={{ fontSize: '0.72rem', color: '#666' }}>
                                    {months > 0
                                        ? `${months} month${months !== 1 ? 's' : ''} away — requires roughly ${fmt(needed)}/month`
                                        : 'Target date is in the past — please choose a future date.'}
                                </Typography>
                            );
                        })()}
                    </Box>
                )}

                {!form.targetDate && (
                    <Box sx={{ p: 2, borderRadius: '10px', bgcolor: alpha('#94a3b8', 0.07), border: `1px solid ${alpha('#94a3b8', 0.18)}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Info size={14} color="#94a3b8" />
                            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                No deadline set — the app will calculate a projected completion date from your contributions.
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Stack>
        </Box>
    );
};

export default StepTimeline;