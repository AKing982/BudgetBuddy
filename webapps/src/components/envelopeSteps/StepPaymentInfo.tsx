import React, { useCallback } from 'react';
import {
    alpha, Box, Grid, InputAdornment, Stack, TextField, Typography,
} from '@mui/material';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import {
    ENVELOPE_COLORS, BLANK_PAYMENT_INFO,
    PaymentInfo, NewEnvelopeForm, FormUpdater, fmt,
} from '../../utils/EnvelopeStepTypes';

interface StepPaymentInfoProps {
    form:   NewEnvelopeForm;
    update: FormUpdater;
}

const StepPaymentInfo: React.FC<StepPaymentInfoProps> = ({ form, update }) => {
    const color = ENVELOPE_COLORS['PAYOFF'];
    const pi    = form.paymentInfo ?? BLANK_PAYMENT_INFO();

    /**
     * Atomic patch — always merges into the *current* paymentInfo so multiple
     * fields changed in one handler never clobber each other.
     */
    const patchPi = useCallback((patch: Partial<PaymentInfo>) => {
        update('paymentInfo', { ...(form.paymentInfo ?? BLANK_PAYMENT_INFO()), ...patch });
    }, [form.paymentInfo, update]);

    // Derived display values — read-only, never written back to state
    const derivedFirstPayment = pi.numberOfPayments > 0 && pi.totalAmount > 0
        ? Math.round((pi.totalAmount / pi.numberOfPayments) * 100) / 100
        : 0;

    const derivedEndDate = pi.firstPaymentDate
        ? (() => {
            const d = new Date(pi.firstPaymentDate);
            d.setMonth(d.getMonth() + pi.totalMonths);
            return d.toISOString().split('T')[0];
        })()
        : '';

    return (
        <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>
                Payment plan details
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 2 }}>
                Tell us about the financing or payment arrangement so we can track your payoff correctly.
            </Typography>

            <Box sx={{
                mb: 3, p: 1.75, borderRadius: '10px',
                bgcolor: alpha(color, 0.06), border: `1px solid ${alpha(color, 0.2)}`,
                display: 'flex', gap: 1.25, alignItems: 'flex-start',
            }}>
                <AlertTriangle size={14} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
                <Typography sx={{ fontSize: '0.72rem', color: '#555', lineHeight: 1.55 }}>
                    Capture your financing terms — merchant, schedule, and first payment.
                    We'll use this to track your payoff and warn about deferred interest deadlines.
                </Typography>
            </Box>

            <Stack spacing={2.5}>
                {/* Merchant + description */}
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Merchant / Lender"
                            placeholder='e.g. "Best Buy", "Capital One", "Affirm"'
                            value={pi.merchant}
                            onChange={e => patchPi({ merchant: e.target.value })}
                            fullWidth
                            inputProps={{ maxLength: 80 }}
                            sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Payment description (optional)"
                            placeholder='e.g. "Samsung 65″ TV — 0% APR"'
                            value={pi.description}
                            onChange={e => patchPi({ description: e.target.value })}
                            fullWidth
                            inputProps={{ maxLength: 120 }}
                            sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
                        />
                    </Grid>
                </Grid>

                {/* Pay-in-four toggle — all affected fields batched in one patchPi call */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        onClick={() => {
                            const next = !pi.isPayInFour;
                            patchPi(next
                                ? { isPayInFour: true,  numberOfPayments: 4,                    totalMonths: 2 }
                                : { isPayInFour: false, numberOfPayments: pi.totalMonths || 12, totalMonths: pi.totalMonths || 12 },
                            );
                        }}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 0.75,
                            px: 1.5, py: 0.75, borderRadius: '8px', cursor: 'pointer',
                            border: `2px solid ${pi.isPayInFour ? color : alpha('#000', 0.12)}`,
                            bgcolor: pi.isPayInFour ? alpha(color, 0.06) : '#fafafa',
                            transition: 'all 0.15s',
                            '&:hover': { borderColor: color, bgcolor: alpha(color, 0.04) },
                        }}
                    >
                        <Box sx={{
                            width: 18, height: 18, borderRadius: '5px',
                            bgcolor: pi.isPayInFour ? color : alpha('#000', 0.1),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                        }}>
                            {pi.isPayInFour && <CheckCircle size={12} color="#fff" />}
                        </Box>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: pi.isPayInFour ? color : '#555' }}>
                            Pay-in-Four (4 installments)
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.68rem', color: '#aaa' }}>
                        Afterpay / Klarna / Affirm Pay-in-4
                    </Typography>
                </Box>

                {/* Schedule row */}
                <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                        <TextField
                            label="# of Payments"
                            value={pi.numberOfPayments}
                            onChange={e => {
                                const v = parseInt(e.target.value, 10);
                                if (!isNaN(v) && v > 0)
                                    patchPi(pi.isPayInFour
                                        ? { numberOfPayments: v }
                                        : { numberOfPayments: v, totalMonths: v });
                            }}
                            fullWidth type="number"
                            inputProps={{ min: 1, max: 120 }}
                            disabled={pi.isPayInFour}
                            sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
                        />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <TextField
                            label="Term (months)"
                            value={pi.totalMonths}
                            onChange={e => {
                                const v = parseInt(e.target.value, 10);
                                if (!isNaN(v) && v > 0)
                                    patchPi(pi.isPayInFour
                                        ? { totalMonths: v }
                                        : { totalMonths: v, numberOfPayments: v });
                            }}
                            fullWidth type="number"
                            inputProps={{ min: 1, max: 120 }}
                            disabled={pi.isPayInFour}
                            sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        {/*
                          * No InputAdornment on type="date" — it shifts the layout
                          * and breaks the native calendar picker in Chrome/Safari.
                          */}
                        <TextField
                            label="First payment date"
                            type="date"
                            value={pi.firstPaymentDate}
                            onChange={e => {
                                const val = e.target.value;
                                if (!val) { patchPi({ firstPaymentDate: '' }); return; }
                                const d = new Date(val);
                                d.setMonth(d.getMonth() + pi.totalMonths);
                                patchPi({ firstPaymentDate: val, endDate: d.toISOString().split('T')[0] });
                            }}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
                        />
                    </Grid>
                </Grid>

                {/* Amount row */}
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Total amount owed"
                            placeholder="0.00"
                            value={pi.totalAmount || ''}
                            onChange={e => {
                                const v = parseFloat(e.target.value);
                                const safe = isNaN(v) ? 0 : v;
                                patchPi({ totalAmount: safe });
                                // mirror to targetAmount if still blank
                                if (form.targetAmount === '' || form.targetAmount === 0)
                                    update('targetAmount', safe);
                            }}
                            fullWidth type="number"
                            inputProps={{ min: 0, step: 0.01 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Typography sx={{ fontWeight: 700, color: '#aaa' }}>$</Typography>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="First payment amount"
                            placeholder={derivedFirstPayment > 0 ? String(derivedFirstPayment) : '0.00'}
                            value={pi.firstPaymentAmount || ''}
                            onChange={e => {
                                const v = parseFloat(e.target.value);
                                patchPi({ firstPaymentAmount: isNaN(v) ? 0 : v });
                            }}
                            fullWidth type="number"
                            inputProps={{ min: 0, step: 0.01 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Typography sx={{ fontWeight: 700, color: '#aaa' }}>$</Typography>
                                    </InputAdornment>
                                ),
                            }}
                            helperText={
                                pi.firstPaymentAmount === 0 && derivedFirstPayment > 0
                                    ? `Suggested: ${fmt(derivedFirstPayment)}`
                                    : undefined
                            }
                            sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
                        />
                    </Grid>
                </Grid>

                {/* End date — no InputAdornment */}
                <TextField
                    label="Payment end date (payoff deadline)"
                    type="date"
                    value={pi.endDate || derivedEndDate}
                    onChange={e => patchPi({ endDate: e.target.value })}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    helperText={
                        derivedEndDate && !pi.endDate
                            ? `Auto-calculated from first payment date + ${pi.totalMonths} months`
                            : undefined
                    }
                    sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
                />

                {/* Summary card */}
                {(pi.totalAmount > 0 || (form.targetAmount !== '' && Number(form.targetAmount) > 0)) && (
                    <Box sx={{ p: 2, borderRadius: '10px', bgcolor: alpha(color, 0.05), border: `1px solid ${alpha(color, 0.18)}` }}>
                        <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color, mb: 1 }}>
                            Plan summary
                        </Typography>
                        <Grid container spacing={1}>
                            {[
                                { label: 'Total owed',  value: fmt(pi.totalAmount || Number(form.targetAmount) || 0) },
                                { label: 'Payments',    value: `${pi.numberOfPayments}×` },
                                { label: 'Per payment', value: derivedFirstPayment > 0 ? fmt(pi.firstPaymentAmount || derivedFirstPayment) : '—' },
                                { label: 'Payoff by',   value: (pi.endDate || derivedEndDate) ? new Date(pi.endDate || derivedEndDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
                            ].map(({ label, value }) => (
                                <Grid item xs={6} key={label}>
                                    <Box sx={{ p: 1, borderRadius: '6px', bgcolor: '#fff', border: '1px solid #eee' }}>
                                        <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#bbb', mb: 0.2 }}>{label}</Typography>
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}
            </Stack>
        </Box>
    );
};

export default StepPaymentInfo;