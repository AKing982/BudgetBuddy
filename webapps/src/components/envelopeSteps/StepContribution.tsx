import React, { useMemo } from 'react';
import {
    alpha, Box, InputAdornment, Stack, TextField,
    ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { AlertTriangle, CheckCircle, TrendingUp, Zap } from 'lucide-react';
import {
    ENVELOPE_COLORS, FREQUENCY_LABELS, MAROON,
    addMonths, autoMonthly, dateFromStr, fmtDate, fmt, monthsToReach,
    NewEnvelopeForm, FormUpdater,
} from '../../utils/EnvelopeStepTypes';

interface StepContributionProps { form: NewEnvelopeForm; update: FormUpdater; }

const StepContribution: React.FC<StepContributionProps> = ({ form, update }) => {
    const color = form.envelopeType ? ENVELOPE_COLORS[form.envelopeType] : MAROON;

    const autoAmt = useMemo(() => {
        if (!form.targetDate || form.targetAmount === '') return null;
        return autoMonthly(Number(form.targetAmount), Number(form.startingAmount) || 0, form.targetDate);
    }, [form.targetDate, form.targetAmount, form.startingAmount]);

    // For PAYOFF: prefer the firstPaymentAmount from the payment plan step
    const payoffSuggested =
        form.envelopeType === 'PAYOFF' && form.paymentInfo?.firstPaymentAmount
            ? form.paymentInfo.firstPaymentAmount
            : null;

    const effectiveAuto  = payoffSuggested ?? autoAmt ?? 0;
    const contrib        = form.contributionMode === 'auto' ? effectiveAuto : (Number(form.monthlyContribution) || 0);
    const freqFactor     = form.contributionFrequency === 'WEEKLY' ? 4.33 : form.contributionFrequency === 'BIWEEKLY' ? 2.17 : 1;
    const months         = monthsToReach(Number(form.targetAmount) || 0, Number(form.startingAmount) || 0, contrib * freqFactor);
    const projDate       = months ? addMonths(months) : null;
    const userDate       = dateFromStr(form.targetDate);
    const isOnTime       = userDate ? (projDate ? projDate <= userDate : false) : true;

    return (
        <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>
                How do you want to contribute?
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
                Tell us how much you'll put in, or let us figure out the right amount for you.
            </Typography>

            <Stack spacing={3}>
                {/* Mode selector */}
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    {([
                        { mode: 'auto',   icon: <Zap size={16} />,        label: 'Auto-calculate',    sub: 'We figure out the amount' },
                        { mode: 'manual', icon: <TrendingUp size={16} />,  label: 'Set my own amount', sub: 'You choose how much'       },
                    ] as const).map(({ mode, icon, label, sub }) => {
                        const active = form.contributionMode === mode;
                        return (
                            <Box key={mode} onClick={() => update('contributionMode', mode)} sx={{
                                flex: 1, p: 2, borderRadius: '10px', cursor: 'pointer',
                                border: `2px solid ${active ? color : alpha('#000', 0.1)}`,
                                bgcolor: active ? alpha(color, 0.06) : '#fafafa',
                                transition: 'all 0.15s',
                                '&:hover': { border: `2px solid ${color}`, bgcolor: alpha(color, 0.04) },
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, color: active ? color : '#888' }}>
                                    {icon}
                                    <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: active ? color : '#333' }}>{label}</Typography>
                                </Box>
                                <Typography sx={{ fontSize: '0.68rem', color: '#aaa' }}>{sub}</Typography>
                            </Box>
                        );
                    })}
                </Box>

                {/* Frequency */}
                <Box>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', mb: 1 }}>Contribution Frequency</Typography>
                    <ToggleButtonGroup
                        value={form.contributionFrequency} exclusive size="small"
                        onChange={(_, v) => v && update('contributionFrequency', v)}
                        sx={{ width: '100%', '& .MuiToggleButton-root': { flex: 1, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderRadius: '8px !important', mx: 0.25 } }}
                    >
                        {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                            <ToggleButton key={k} value={k}
                                          sx={{ '&.Mui-selected': { bgcolor: alpha(color, 0.12), color, borderColor: `${alpha(color, 0.3)} !important` }, '&:hover': { bgcolor: alpha(color, 0.06) } }}>
                                {v}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </Box>

                {/* Auto suggestion */}
                {form.contributionMode === 'auto' && (
                    <Box sx={{ p: 2, borderRadius: '10px', bgcolor: alpha(color, 0.05), border: `1px solid ${alpha(color, 0.18)}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Zap size={14} color={color} />
                            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color }}>
                                {payoffSuggested
                                    ? `Payment plan amount: ${fmt(payoffSuggested)} / ${FREQUENCY_LABELS[form.contributionFrequency].toLowerCase()}`
                                    : autoAmt !== null
                                        ? `Suggested: ${fmt(autoAmt)} / ${FREQUENCY_LABELS[form.contributionFrequency].toLowerCase()}`
                                        : 'Set a target date on the previous step for a suggestion'}
                            </Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.7rem', color: '#888' }}>
                            {payoffSuggested
                                ? `Based on your payment plan of ${fmt(payoffSuggested)} per payment.`
                                : autoAmt !== null && form.targetDate
                                    ? `Based on your target of ${fmt(Number(form.targetAmount))} by ${fmtDate(dateFromStr(form.targetDate)!)}, we suggest ${fmt(autoAmt)} every ${FREQUENCY_LABELS[form.contributionFrequency].toLowerCase()}.`
                                    : "Once you set a target date, we'll calculate the exact amount needed."}
                        </Typography>
                    </Box>
                )}

                {/* Manual input */}
                {form.contributionMode === 'manual' && (
                    <TextField
                        label={`${FREQUENCY_LABELS[form.contributionFrequency]} Contribution`}
                        placeholder="0.00"
                        value={form.monthlyContribution}
                        onChange={e => {
                            const v = e.target.value;
                            update('monthlyContribution', v === '' ? '' : parseFloat(v) || '');
                        }}
                        fullWidth type="number"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Typography sx={{ fontWeight: 700, color: '#aaa' }}>$</Typography>
                                </InputAdornment>
                            ),
                        }}
                        inputProps={{ min: 0, step: 0.01 }}
                        helperText={payoffSuggested ? `Payment plan suggests ${fmt(payoffSuggested)}` : undefined}
                        sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
                    />
                )}

                {/* Projection banner */}
                {projDate && contrib > 0 && form.targetAmount !== '' && (
                    <Box sx={{ p: 2, borderRadius: '10px', bgcolor: alpha(isOnTime ? '#16a34a' : '#d97706', 0.06), border: `1px solid ${alpha(isOnTime ? '#16a34a' : '#d97706', 0.2)}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
                            {isOnTime
                                ? <CheckCircle size={14} color="#16a34a" />
                                : <AlertTriangle size={14} color="#d97706" />}
                            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: isOnTime ? '#16a34a' : '#d97706' }}>
                                {isOnTime ? 'On track!' : 'Heads up'}
                            </Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.72rem', color: '#555' }}>
                            At {fmt(contrib)}/{FREQUENCY_LABELS[form.contributionFrequency].toLowerCase()} you'll reach your goal by{' '}
                            <strong>{fmtDate(projDate)}</strong>
                            {userDate && !isOnTime && ` — that's after your target of ${fmtDate(userDate)}. Consider increasing contributions.`}
                            {userDate &&  isOnTime && ' — right on schedule!'}
                        </Typography>
                    </Box>
                )}
            </Stack>
        </Box>
    );
};

export default StepContribution;