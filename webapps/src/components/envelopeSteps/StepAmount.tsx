import React from 'react';
import { alpha, Box, InputAdornment, LinearProgress, Stack, TextField, Typography } from '@mui/material';
import { ENVELOPE_COLORS, MAROON, fmt, NewEnvelopeForm, FormUpdater } from '../../utils/EnvelopeStepTypes';

interface StepAmountProps { form: NewEnvelopeForm; update: FormUpdater; }

const StepAmount: React.FC<StepAmountProps> = ({ form, update }) => {
    const color = form.envelopeType ? ENVELOPE_COLORS[form.envelopeType] : MAROON;
    const isPayoff = form.envelopeType === 'PAYOFF';

    return (
        <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>
                How much do you need?
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
                {isPayoff
                    ? 'This should match the total amount owed you entered in the payment plan step.'
                    : 'Set your total target and optionally kick things off with money you already have.'}
            </Typography>
            <Stack spacing={3}>
                <TextField
                    label="Total Target Amount"
                    placeholder="0.00"
                    value={form.targetAmount}
                    onChange={e => {
                        const v = e.target.value;
                        const parsed = v === '' ? '' : parseFloat(v) || '';
                        update('targetAmount', parsed);
                        // keep paymentInfo.totalAmount in sync for PAYOFF
                        if (isPayoff && form.paymentInfo && parsed !== '') {
                            update('paymentInfo', { ...form.paymentInfo, totalAmount: Number(parsed) });
                        }
                    }}
                    fullWidth type="number" required
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Typography sx={{ fontWeight: 700, color: '#aaa' }}>$</Typography>
                            </InputAdornment>
                        ),
                    }}
                    inputProps={{ min: 0, step: 0.01 }}
                    sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
                />

                {form.targetAmount !== '' && Number(form.targetAmount) > 0 && (
                    <Box sx={{ p: 2, borderRadius: '10px', bgcolor: alpha(color, 0.05), border: `1px solid ${alpha(color, 0.15)}` }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color }}>Target</Typography>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
                                {fmt(Number(form.targetAmount))}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={
                                form.startingAmount !== '' && Number(form.startingAmount) > 0
                                    ? Math.min((Number(form.startingAmount) / Number(form.targetAmount)) * 100, 100)
                                    : 0
                            }
                            sx={{ height: 6, borderRadius: 3, bgcolor: alpha(color, 0.12), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }}
                        />
                        <Typography sx={{ fontSize: '0.65rem', color: '#aaa', mt: 0.5 }}>
                            {form.startingAmount !== '' && Number(form.startingAmount) > 0
                                ? `Starting with ${fmt(Number(form.startingAmount))} — ${((Number(form.startingAmount) / Number(form.targetAmount)) * 100).toFixed(0)}% already covered`
                                : 'Starting from $0'}
                        </Typography>
                    </Box>
                )}

                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#333', mb: 0.4 }}>
                        Starting Amount{' '}
                        <Typography component="span" sx={{ color: '#aaa', fontWeight: 400 }}>(optional)</Typography>
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#aaa', mb: 1.25 }}>
                        {isPayoff
                            ? 'Have you already made any payments toward this balance?'
                            : 'Do you already have some money set aside for this goal?'}
                    </Typography>
                    <TextField
                        placeholder="0.00"
                        value={form.startingAmount}
                        onChange={e => {
                            const v = e.target.value;
                            update('startingAmount', v === '' ? '' : parseFloat(v) || '');
                        }}
                        fullWidth type="number"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Typography sx={{ fontWeight: 700, color: '#aaa' }}>$</Typography>
                                </InputAdornment>
                            ),
                        }}
                        inputProps={{ min: 0, step: 0.01, max: form.targetAmount || undefined }}
                        sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
                    />
                </Box>
            </Stack>
        </Box>
    );
};

export default StepAmount;