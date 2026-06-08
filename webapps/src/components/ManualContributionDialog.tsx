import React, { useEffect, useState } from 'react';
import {
    alpha, Box, Button, Dialog, DialogActions, DialogContent,
    FormControl, IconButton, InputAdornment, InputLabel, LinearProgress,
    MenuItem, Select, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import { XCircle, RefreshCcw } from 'lucide-react';
import { BudgetEnvelope, AutoRule } from '../config/Types';
import { ENVELOPE_COLORS, FREQUENCY_OPTIONS, SOURCE_OPTIONS } from '../config/Constants';
import { fmt } from '../config/Helpers';

export interface ManualContributionDialogProps {
    open:        boolean;
    envelope:    BudgetEnvelope | null;
    onClose:     () => void;
    onSubmit:    (envelopeId: number, amount: number, date: string, note: string) => void;
    onSetupAuto: (envelopeId: number, rule: AutoRule) => void;
}

const ManualContributionDialog: React.FC<ManualContributionDialogProps> = ({
                                                                               open, envelope, onClose, onSubmit, onSetupAuto,
                                                                           }) => {
    const [tab,       setTab]       = useState(0);
    const [amount,    setAmount]    = useState('');
    const [date,      setDate]      = useState(new Date().toISOString().split('T')[0]);
    const [note,      setNote]      = useState('');
    const [autoAmt,   setAutoAmt]   = useState('');
    const [autoFreq,  setAutoFreq]  = useState('MONTHLY_1ST');
    const [autoStart, setAutoStart] = useState('');
    const [autoSrc,   setAutoSrc]   = useState('checking_4821');

    useEffect(() => {
        if (open) {
            setTab(0); setAmount(''); setNote('');
            setDate(new Date().toISOString().split('T')[0]);
            const next = new Date(); next.setMonth(next.getMonth() + 1); next.setDate(1);
            setAutoStart(next.toISOString().split('T')[0]);
            if (envelope) setAutoAmt(String(envelope.allocatedAmount));
        }
    }, [open, envelope]);

    if (!envelope) return null;
    const color = ENVELOPE_COLORS[envelope.envelopeType];

    const handleOneTime = () => {
        const v = parseFloat(amount);
        if (isNaN(v) || v <= 0) return;
        onSubmit(envelope.id, v, date, note);
        onClose();
    };

    const handleAutoSetup = () => {
        const v = parseFloat(autoAmt);
        if (isNaN(v) || v <= 0) return;
        onSetupAuto(envelope.id, { frequency: autoFreq, amount: v, startDate: autoStart, source: autoSrc });
        onClose();
    };

    const focused = { '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}>
            {/* Header */}
            <Box sx={{ background: `linear-gradient(135deg, ${alpha(color, 0.9)}, ${color})`, px: 3, py: 2, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -16, right: -16, width: 70, height: 70, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>Add Contribution</Typography>
                        <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.75)', mt: 0.1 }}>{envelope.envelopeName}</Typography>
                    </Box>
                    <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                        <XCircle size={16} />
                    </IconButton>
                </Box>
            </Box>

            <Tabs value={tab} onChange={(_, v) => setTab(v)}
                  sx={{ borderBottom: '1px solid #eee', px: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', minHeight: 42 }, '& .MuiTabs-indicator': { bgcolor: color } }}>
                <Tab label="One-time" />
                <Tab label="Set up auto-track" />
            </Tabs>

            <DialogContent sx={{ pt: 2.5 }}>
                {tab === 0 && (
                    <Stack spacing={2}>
                        <TextField label="Amount" size="small" fullWidth type="number" value={amount} onChange={e => setAmount(e.target.value)}
                                   InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: '#aaa' }}>$</Typography></InputAdornment> }}
                                   inputProps={{ min: 0, step: 0.01 }} sx={focused} />
                        <TextField label="Date" size="small" fullWidth type="date" value={date} onChange={e => setDate(e.target.value)}
                                   InputLabelProps={{ shrink: true }} sx={focused} />
                        <TextField label="Note (optional)" size="small" fullWidth multiline rows={2} value={note} onChange={e => setNote(e.target.value)}
                                   placeholder="e.g. May contribution" sx={focused} />
                        {parseFloat(amount) > 0 && (
                            <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: alpha(color, 0.06), border: `1px solid ${alpha(color, 0.18)}` }}>
                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color, mb: 0.75 }}>After this contribution</Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography sx={{ fontSize: '0.72rem', color: '#555' }}>{fmt(envelope.currentAmount + parseFloat(amount))} saved</Typography>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color }}>
                                        {Math.min(((envelope.currentAmount + parseFloat(amount)) / envelope.targetAmount) * 100, 100).toFixed(0)}%
                                    </Typography>
                                </Box>
                                <LinearProgress variant="determinate"
                                                value={Math.min(((envelope.currentAmount + parseFloat(amount)) / envelope.targetAmount) * 100, 100)}
                                                sx={{ height: 5, borderRadius: 3, bgcolor: alpha(color, 0.12), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }} />
                            </Box>
                        )}
                    </Stack>
                )}
                {tab === 1 && (
                    <Stack spacing={2}>
                        <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: alpha('#0284c7', 0.06), border: `1px solid ${alpha('#0284c7', 0.2)}`, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                            <RefreshCcw size={14} color="#0284c7" style={{ marginTop: 2, flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.72rem', color: '#555', lineHeight: 1.5 }}>
                                Auto-track posts contributions automatically each period. You can pause or cancel at any time.
                            </Typography>
                        </Box>
                        <FormControl size="small" fullWidth>
                            <InputLabel sx={{ fontSize: '0.82rem' }}>Frequency</InputLabel>
                            <Select value={autoFreq} label="Frequency" onChange={e => setAutoFreq(e.target.value)} sx={{ '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: color } }}>
                                {FREQUENCY_OPTIONS.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: '0.82rem' }}>{o.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <TextField label="Amount per period" size="small" fullWidth type="number" value={autoAmt} onChange={e => setAutoAmt(e.target.value)}
                                   InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: '#aaa' }}>$</Typography></InputAdornment> }}
                                   inputProps={{ min: 0, step: 0.01 }} sx={focused} />
                        <TextField label="Starts" size="small" fullWidth type="date" value={autoStart} onChange={e => setAutoStart(e.target.value)}
                                   InputLabelProps={{ shrink: true }} sx={focused} />
                        <FormControl size="small" fullWidth>
                            <InputLabel sx={{ fontSize: '0.82rem' }}>Source account</InputLabel>
                            <Select value={autoSrc} label="Source account" onChange={e => setAutoSrc(e.target.value)} sx={{ '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: color } }}>
                                {SOURCE_OPTIONS.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: '0.82rem' }}>{o.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button fullWidth variant="outlined" onClick={onClose}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#d5d5d5', color: '#555', '&:hover': { borderColor: '#6b1a1a', color: '#6b1a1a' } }}>
                    Cancel
                </Button>
                <Button fullWidth variant="contained" onClick={tab === 0 ? handleOneTime : handleAutoSetup}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, bgcolor: color, '&:hover': { bgcolor: alpha(color, 0.85) } }}>
                    {tab === 0 ? 'Save contribution' : 'Enable auto-track'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ManualContributionDialog;