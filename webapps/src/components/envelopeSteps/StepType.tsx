import React from 'react';
import { alpha, Box, Grid, Typography } from '@mui/material';
import { CheckCircle, CreditCard } from 'lucide-react';
import {
    ENVELOPE_COLORS, ENVELOPE_ICONS, ENVELOPE_DESCRIPTIONS,
    BLANK_PAYMENT_INFO, NewEnvelopeForm, FormUpdater,
} from '../../utils/EnvelopeStepTypes';

interface StepTypeProps {
    form:   NewEnvelopeForm;
    update: FormUpdater;
}

const StepType: React.FC<StepTypeProps> = ({ form, update }) => (
    <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>
            What kind of envelope is this?
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
            Choose the type that best describes your goal — this shapes how we track and report it.
        </Typography>
        <Grid container spacing={2}>
            {(['FUND', 'PAYOFF', 'PURCHASE'] as const).map(type => {
                const color  = ENVELOPE_COLORS[type];
                const active = form.envelopeType === type;
                return (
                    <Grid item xs={12} sm={6} key={type}>
                        <Box
                            onClick={() => {
                                update('envelopeType', type);
                                if (type !== 'PAYOFF') update('paymentInfo', null);
                                else if (!form.paymentInfo) update('paymentInfo', BLANK_PAYMENT_INFO());
                            }}
                            sx={{
                                p: 2.5, borderRadius: '12px', cursor: 'pointer',
                                border: `2px solid ${active ? color : alpha('#000', 0.1)}`,
                                bgcolor: active ? alpha(color, 0.06) : '#fafafa',
                                transition: 'all 0.18s',
                                '&:hover': { border: `2px solid ${color}`, bgcolor: alpha(color, 0.04) },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <Box sx={{
                                    width: 40, height: 40, borderRadius: '10px',
                                    bgcolor: active ? alpha(color, 0.15) : alpha('#000', 0.06),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: active ? color : '#888', transition: 'all 0.18s',
                                }}>
                                    {ENVELOPE_ICONS[type]}
                                </Box>
                                <Box>
                                    <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: active ? color : '#111' }}>
                                        {type === 'FUND' ? 'Fund' : type === 'PAYOFF' ? 'Pay-Off' : 'Purchase'}
                                    </Typography>
                                    {active && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                            <CheckCircle size={11} color={color} />
                                            <Typography sx={{ fontSize: '0.6rem', color, fontWeight: 700 }}>Selected</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                            <Typography sx={{ fontSize: '0.72rem', color: '#888', lineHeight: 1.5 }}>
                                {ENVELOPE_DESCRIPTIONS[type]}
                            </Typography>
                            {type === 'PAYOFF' && (
                                <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 0.5, p: 0.75, borderRadius: '6px', bgcolor: alpha(color, 0.06) }}>
                                    <CreditCard size={10} color={color} />
                                    <Typography sx={{ fontSize: '0.62rem', color, fontWeight: 600 }}>
                                        Includes payment plan setup
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Grid>
                );
            })}
        </Grid>
    </Box>
);

export default StepType;