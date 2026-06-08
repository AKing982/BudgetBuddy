import React, { useMemo, useState } from 'react';
import {
    alpha, Box, Button, Chip, Dialog, DialogActions, DialogContent,
    IconButton, InputAdornment, Stack, TextField, Typography,
} from '@mui/material';
import { Calculator, DollarSign, Sparkles, XCircle } from 'lucide-react';
import { BudgetEnvelope, AffordabilityResult } from '../config/Types';
import { ENVELOPE_COLORS, MAROON, MAROON_DARK, TYPE_ICONS } from '../config/Constants';
import { fmt, computeAffordability } from '../config/Helpers';

interface AffordabilityDialogProps {
    open:       boolean;
    envelopes:  BudgetEnvelope[];
    onClose:    () => void;
    onApplyAll: (results: AffordabilityResult[]) => void;
}

const STATUS_COLORS = { FULL: '#16a34a', PARTIAL: '#d97706', SKIP: '#94a3b8' } as const;
const STATUS_LABELS = { FULL: 'Full',    PARTIAL: 'Partial', SKIP: 'Skip'   } as const;
const STATUS_BG     = {
    FULL:    alpha('#16a34a', 0.1),
    PARTIAL: alpha('#d97706', 0.1),
    SKIP:    alpha('#94a3b8', 0.1),
} as const;

const AffordabilityDialog: React.FC<AffordabilityDialogProps> = ({ open, envelopes, onClose, onApplyAll }) => {
    const [balance, setBalance] = useState<number>(1200);
    const envMap  = useMemo(() => new Map(envelopes.map(e => [e.id, e])), [envelopes]);
    const results = useMemo(() => computeAffordability(envelopes, balance), [envelopes, balance]);
    const total   = results.reduce((s, r) => s + r.suggested, 0);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}>
            {/* Header */}
            <Box sx={{ background: `linear-gradient(135deg, ${MAROON_DARK}, ${MAROON})`, px: 3, py: 2, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Calculator size={14} color="white" />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>Affordability Check</Typography>
                            <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>{envelopes.length} active envelopes in your plan</Typography>
                        </Box>
                    </Box>
                    <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                        <XCircle size={16} />
                    </IconButton>
                </Box>
            </Box>

            <DialogContent sx={{ pt: 2.5 }}>
                {/* Balance input */}
                <Box sx={{ p: 1.75, borderRadius: '10px', bgcolor: alpha('#16a34a', 0.06), border: `1px solid ${alpha('#16a34a', 0.2)}`, display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: '9px', bgcolor: alpha('#16a34a', 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <DollarSign size={16} color="#16a34a" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', mb: 0.25 }}>Available balance this month</Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#15803d', fontVariantNumeric: 'tabular-nums' }}>{fmt(balance)}</Typography>
                    </Box>
                    <TextField size="small" type="number" value={balance}
                               onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0) setBalance(v); }}
                               inputProps={{ min: 0, step: 10 }}
                               InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa' }}>$</Typography></InputAdornment> }}
                               sx={{ width: 110, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.82rem' }, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#16a34a' } }} />
                </Box>

                {/* Results list */}
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.25 }}>
                    Recommendation — by priority
                </Typography>
                <Stack spacing={0}>
                    {results.map((r, i) => {
                        const env   = envMap.get(r.envelopeId);
                        if (!env) return null;
                        const color = ENVELOPE_COLORS[env.envelopeType];
                        return (
                            <Box key={r.envelopeId} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 1.1, borderBottom: i < results.length - 1 ? `1px solid ${alpha('#000', 0.05)}` : 'none' }}>
                                <Box sx={{ width: 22, height: 22, borderRadius: '6px', bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                                    {TYPE_ICONS[env.envelopeType]}
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{env.envelopeName}</Typography>
                                    <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>Priority #{env.priority} · needs {fmt(Math.min(env.allocatedAmount, env.remainingAmount))}/mo</Typography>
                                </Box>
                                <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: r.suggested > 0 ? color : '#ccc', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                                    {fmt(r.suggested)}
                                </Typography>
                                <Chip size="small" label={STATUS_LABELS[r.status]}
                                      sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: STATUS_BG[r.status], color: STATUS_COLORS[r.status], flexShrink: 0 }} />
                            </Box>
                        );
                    })}
                </Stack>

                {/* Total summary */}
                <Box sx={{ mt: 2, p: 1.5, borderRadius: '10px', bgcolor: alpha(MAROON, 0.05), border: `1px solid ${alpha(MAROON, 0.15)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: MAROON }}>Total to contribute</Typography>
                        <Typography sx={{ fontSize: '0.62rem', color: alpha(MAROON, 0.7) }}>{fmt(balance - total)} remaining after contributions</Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', color: MAROON, fontVariantNumeric: 'tabular-nums' }}>{fmt(total)}</Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button fullWidth variant="outlined" onClick={onClose}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#d5d5d5', color: '#555', '&:hover': { borderColor: MAROON, color: MAROON } }}>
                    Cancel
                </Button>
                <Button fullWidth variant="contained" disabled={total === 0}
                        onClick={() => { onApplyAll(results.filter(r => r.suggested > 0)); onClose(); }}
                        startIcon={<Sparkles size={14} />}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK }, '&.Mui-disabled': { bgcolor: alpha(MAROON, 0.3) } }}>
                    Apply all contributions
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AffordabilityDialog;