import React from 'react';
import { alpha, Box, Chip, Stack, TextField, Typography } from '@mui/material';
import { ENVELOPE_COLORS, MAROON, NewEnvelopeForm, FormUpdater } from '../../utils/EnvelopeStepTypes';

interface StepNameProps { form: NewEnvelopeForm; update: FormUpdater; }

const SUGGESTIONS: Record<string, string[]> = {
    FUND:     ['Vacation Fund', 'Wedding Fund', 'Home Down Payment', 'Education Fund'],
    PAYOFF:   ['Pay Off Credit Card', 'Pay Off Laptop', 'Pay Off TV', 'Pay Off Medical Bill'],
    PURCHASE: ['New Laptop', 'New Car', 'New Phone', 'Home Appliance'],
};

const StepName: React.FC<StepNameProps> = ({ form, update }) => {
    const color = form.envelopeType ? ENVELOPE_COLORS[form.envelopeType] : MAROON;
    const suggestions = SUGGESTIONS[form.envelopeType || ''] ?? [];

    return (
        <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>
                Name your envelope
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
                Give it a clear, memorable name so you always know what you're saving for.
            </Typography>
            <Stack spacing={2.5}>
                <TextField
                    label="Envelope Name"
                    placeholder='e.g. "Car Repair Fund", "Pay Off TV", "Hawaii Trip"'
                    value={form.envelopeName}
                    onChange={e => update('envelopeName', e.target.value)}
                    fullWidth
                    inputProps={{ maxLength: 60 }}
                    helperText={`${form.envelopeName.length}/60`}
                    sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
                />
                <TextField
                    label="Description (optional)"
                    placeholder="A short note about this goal…"
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                    fullWidth multiline rows={2}
                    inputProps={{ maxLength: 120 }}
                    helperText={`${form.description.length}/120`}
                    sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
                />
                {suggestions.length > 0 && (
                    <Box>
                        <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>
                            Quick suggestions
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                            {suggestions.map(s => (
                                <Chip key={s} label={s} size="small" onClick={() => update('envelopeName', s)}
                                      sx={{
                                          fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
                                          bgcolor: form.envelopeName === s ? alpha(color, 0.12) : alpha('#000', 0.05),
                                          color:   form.envelopeName === s ? color : '#555',
                                          border:  `1px solid ${form.envelopeName === s ? alpha(color, 0.3) : 'transparent'}`,
                                          '&:hover': { bgcolor: alpha(color, 0.08), color },
                                      }}
                                />
                            ))}
                        </Box>
                    </Box>
                )}
            </Stack>
        </Box>
    );
};

export default StepName;