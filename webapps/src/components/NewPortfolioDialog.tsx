import React, { useState } from 'react';
import {
    Box,
    Dialog,
    Typography,
    Stack,
    TextField,
    Button,
    Checkbox,
    FormControlLabel,
    InputAdornment,
    Slider,
} from '@mui/material';
import { Calendar } from 'lucide-react';
import { InvestmentAccount, Portfolio, MAROON, MAROON_DARK } from './InvestmentUtils';

interface NewPortfolioDialogProps {
    open: boolean;
    accounts: InvestmentAccount[];
    onClose: () => void;
    onCreate: (portfolio: Omit<Portfolio, 'id'>) => void;
}

const NewPortfolioDialog: React.FC<NewPortfolioDialogProps> = ({ open, accounts, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [goal, setGoal] = useState('');
    const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
    const [targetAmount, setTargetAmount] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [contributionPct, setContributionPct] = useState<number>(5);

    const reset = () => {
        setName(''); setGoal(''); setSelectedAccountIds([]); setTargetAmount(''); setTargetDate(''); setContributionPct(5);
    };

    const toggleAccount = (id: number) => {
        setSelectedAccountIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const canSubmit = name.trim() !== '' && selectedAccountIds.length > 0 && targetAmount !== '' && targetDate !== '';

    const submit = () => {
        onCreate({
            name: name.trim(),
            goal: goal.trim() || 'No description set',
            accountIds: selectedAccountIds,
            targetAmount: Number(targetAmount),
            targetDate,
            contributionPercentage: contributionPct,
        });
        reset();
        onClose();
    };

    return (
        <Dialog open={open} onClose={() => { reset(); onClose(); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2, p: 1 } }}>
            <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>New portfolio</Typography>
                <Typography variant="body2" sx={{ color: '#888', mb: 2.5 }}>
                    Group one or more accounts under a shared target and contribution plan.
                </Typography>

                <Stack spacing={2}>
                    <TextField label="Portfolio name" size="small" fullWidth value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Retirement, House Down Payment" />
                    <TextField label="Goal / description" size="small" fullWidth value={goal} onChange={e => setGoal(e.target.value)} placeholder="What is this portfolio for?" />

                    <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#666', mb: 1 }}>
                            ACCOUNTS IN THIS PORTFOLIO
                        </Typography>
                        {accounts.length === 0 && (
                            <Typography sx={{ fontSize: '0.78rem', color: '#aaa' }}>Add an account first before creating a portfolio.</Typography>
                        )}
                        <Stack spacing={0}>
                            {accounts.map(a => (
                                <FormControlLabel
                                    key={a.id}
                                    control={<Checkbox size="small" checked={selectedAccountIds.includes(a.id)} onChange={() => toggleAccount(a.id)} sx={{ color: MAROON, '&.Mui-checked': { color: MAROON } }} />}
                                    label={<Typography sx={{ fontSize: '0.85rem' }}>{a.name} <Box component="span" sx={{ color: '#999', fontSize: '0.75rem' }}>· {a.institution}</Box></Typography>}
                                />
                            ))}
                        </Stack>
                        <Typography sx={{ fontSize: '0.68rem', color: '#aaa', mt: 0.5 }}>
                            Select one account for a single-account portfolio, or several to track them together.
                        </Typography>
                    </Box>

                    <TextField label="Target amount" size="small" fullWidth value={targetAmount} onChange={e => setTargetAmount(e.target.value)}
                               InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                    <TextField label="Target date" type="date" size="small" fullWidth value={targetDate} onChange={e => setTargetDate(e.target.value)}
                               InputLabelProps={{ shrink: true }} InputProps={{ startAdornment: <InputAdornment position="start"><Calendar size={14} /></InputAdornment> }} />

                    <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#666', mb: 1 }}>
                            CONTRIBUTION — <Box component="span" sx={{ color: MAROON }}>{contributionPct}% of income</Box>
                        </Typography>
                        <Slider value={contributionPct} min={0} max={50} step={0.5} onChange={(_, v) => setContributionPct(v as number)} sx={{ color: MAROON }} />
                    </Box>
                </Stack>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                    <Button variant="outlined" onClick={() => { reset(); onClose(); }} sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                    <Button variant="contained" disabled={!canSubmit} onClick={submit} sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700, bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK } }}>
                        Create portfolio
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
};

export default NewPortfolioDialog;