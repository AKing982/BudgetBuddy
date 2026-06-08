import React from 'react';
import { alpha, Box, Chip, Grid, Typography } from '@mui/material';
import { Wallet, Link, CheckCircle } from 'lucide-react';
import { MAROON } from '../../utils/EnvelopeStepTypes';

interface StepModeProps {
    isLinked:  boolean;
    linkCount: number;
    onChange:  (isLinked: boolean, count: number) => void;
}

const StepMode: React.FC<StepModeProps> = ({ isLinked, linkCount, onChange }) => (
    <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>
            How many envelopes would you like to create?
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
            Create a single dedicated envelope, or link multiple envelopes together
            that share a common goal or budget.
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Single */}
            <Grid item xs={12} sm={6}>
                <Box onClick={() => onChange(false, 1)} sx={{
                    p: 2.5, borderRadius: '14px', cursor: 'pointer',
                    border: `2px solid ${!isLinked ? MAROON : alpha('#000', 0.1)}`,
                    bgcolor: !isLinked ? alpha(MAROON, 0.05) : '#fafafa',
                    transition: 'all 0.18s',
                    '&:hover': { border: `2px solid ${MAROON}`, bgcolor: alpha(MAROON, 0.04) },
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
                        <Box sx={{
                            width: 44, height: 44, borderRadius: '11px',
                            bgcolor: !isLinked ? alpha(MAROON, 0.12) : alpha('#000', 0.06),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: !isLinked ? MAROON : '#888', transition: 'all 0.18s',
                        }}>
                            <Wallet size={22} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: !isLinked ? MAROON : '#111' }}>
                                Single Envelope
                            </Typography>
                            {!isLinked && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                    <CheckCircle size={11} color={MAROON} />
                                    <Typography sx={{ fontSize: '0.6rem', color: MAROON, fontWeight: 700 }}>Selected</Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                    <Typography sx={{ fontSize: '0.72rem', color: '#888', lineHeight: 1.55 }}>
                        One focused envelope for a single goal. Best for most use cases —
                        a vacation fund, a debt payoff, or an emergency buffer.
                    </Typography>
                    <Box sx={{ mt: 1.5, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        {['Simple setup', 'One goal', 'Full control'].map(t => (
                            <Chip key={t} label={t} size="small" sx={{
                                height: 18, fontSize: '0.6rem', fontWeight: 700,
                                bgcolor: !isLinked ? alpha(MAROON, 0.1) : alpha('#000', 0.05),
                                color: !isLinked ? MAROON : '#888',
                            }} />
                        ))}
                    </Box>
                </Box>
            </Grid>

            {/* Linked */}
            <Grid item xs={12} sm={6}>
                <Box onClick={() => onChange(true, linkCount < 2 ? 2 : linkCount)} sx={{
                    p: 2.5, borderRadius: '14px', cursor: 'pointer',
                    border: `2px solid ${isLinked ? '#7c3aed' : alpha('#000', 0.1)}`,
                    bgcolor: isLinked ? alpha('#7c3aed', 0.05) : '#fafafa',
                    transition: 'all 0.18s',
                    '&:hover': { border: '2px solid #7c3aed', bgcolor: alpha('#7c3aed', 0.04) },
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
                        <Box sx={{
                            width: 44, height: 44, borderRadius: '11px',
                            bgcolor: isLinked ? alpha('#7c3aed', 0.12) : alpha('#000', 0.06),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isLinked ? '#7c3aed' : '#888', transition: 'all 0.18s',
                        }}>
                            <Link size={22} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: isLinked ? '#7c3aed' : '#111' }}>
                                Linked Envelopes
                            </Typography>
                            {isLinked && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                    <CheckCircle size={11} color="#7c3aed" />
                                    <Typography sx={{ fontSize: '0.6rem', color: '#7c3aed', fontWeight: 700 }}>Selected</Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                    <Typography sx={{ fontSize: '0.72rem', color: '#888', lineHeight: 1.55 }}>
                        Two to five envelopes tied together under a shared goal or budget.
                        Great for splitting a large purchase or tracking related debts.
                    </Typography>
                    <Box sx={{ mt: 1.5, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        {['2–5 envelopes', 'Shared budget', 'Group tracking'].map(t => (
                            <Chip key={t} label={t} size="small" sx={{
                                height: 18, fontSize: '0.6rem', fontWeight: 700,
                                bgcolor: isLinked ? alpha('#7c3aed', 0.1) : alpha('#000', 0.05),
                                color: isLinked ? '#7c3aed' : '#888',
                            }} />
                        ))}
                    </Box>
                </Box>
            </Grid>
        </Grid>

        {isLinked && (
            <Box sx={{ p: 2.5, borderRadius: '12px', border: `1px solid ${alpha('#7c3aed', 0.25)}`, bgcolor: alpha('#7c3aed', 0.04) }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', mb: 1.5 }}>
                    How many envelopes do you want to link?
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {[2, 3, 4, 5].map(n => (
                        <Box key={n} onClick={() => onChange(true, n)} sx={{
                            flex: 1, py: 1.25, borderRadius: '10px', cursor: 'pointer', textAlign: 'center',
                            border: `2px solid ${linkCount === n ? '#7c3aed' : alpha('#000', 0.1)}`,
                            bgcolor: linkCount === n ? alpha('#7c3aed', 0.1) : '#fff',
                            transition: 'all 0.15s',
                            '&:hover': { borderColor: '#7c3aed', bgcolor: alpha('#7c3aed', 0.06) },
                        }}>
                            <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', color: linkCount === n ? '#7c3aed' : '#555' }}>
                                {n}
                            </Typography>
                            <Typography sx={{ fontSize: '0.6rem', color: linkCount === n ? '#7c3aed' : '#aaa', fontWeight: 600 }}>
                                envelope{n !== 1 ? 's' : ''}
                            </Typography>
                        </Box>
                    ))}
                </Box>
                <Typography sx={{ fontSize: '0.68rem', color: '#888', mt: 1.5, lineHeight: 1.5 }}>
                    You'll configure each envelope one at a time in the following steps.
                    All {linkCount} will be submitted together as a linked group.
                </Typography>
            </Box>
        )}
    </Box>
);

export default StepMode;