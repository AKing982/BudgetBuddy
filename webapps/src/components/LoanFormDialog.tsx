import React, { useEffect, useState } from 'react';
import { Box, Dialog, Typography, Stack, TextField, Button, InputAdornment } from '@mui/material';
import { MAROON, MAROON_DARK, Loan } from './InvestmentUtils';

interface LoanFormDialogProps {
    open: boolean;
    accountName: string;
    existingLoan?: Loan;
    // A calculator-produced draft, distinct from existingLoan — pre-fills the
    // fields without switching the dialog into "edit" mode (no title change,
    // no Remove button, since nothing's actually saved yet).
    prefill?: Loan;
    onClose: () => void;
    onSave: (loan: Loan) => void;
    onRemove?: () => void;
}

const LoanFormDialog: React.FC<LoanFormDialogProps> = ({ open, accountName, existingLoan, prefill, onClose, onSave, onRemove }) => {
    const [originalAmount, setOriginalAmount] = useState('');
    const [remainingBalance, setRemainingBalance] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [monthlyRepayment, setMonthlyRepayment] = useState('');

    // Reset the form each time the dialog opens: an existing loan's values take
    // priority, then a calculator prefill, else blank.
    useEffect(() => {
        if (open) {
            const source = existingLoan ?? prefill;
            setOriginalAmount(source ? String(source.originalAmount) : '');
            setRemainingBalance(source ? String(source.remainingBalance) : '');
            setInterestRate(source ? String(source.interestRate) : '');
            setMonthlyRepayment(source ? String(source.monthlyRepayment) : '');
        }
    }, [open, existingLoan, prefill]);

    const canSave = originalAmount !== '' && remainingBalance !== '' && interestRate !== '' && monthlyRepayment !== '';

    const save = () => {
        if (!canSave) return;
        onSave({
            originalAmount: Number(originalAmount),
            remainingBalance: Number(remainingBalance),
            interestRate: Number(interestRate),
            monthlyRepayment: Number(monthlyRepayment),
        });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
            <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5, letterSpacing: '-0.01em' }}>
                    {existingLoan ? 'Edit 401(k) loan' : 'Add a 401(k) loan'}
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: '#888', mb: 2.5 }}>
                    Against {accountName}. Plaid doesn't report loan details, so this is tracked manually.
                </Typography>

                <Stack spacing={2}>
                    <TextField
                        label="Original loan amount" size="small" fullWidth
                        value={originalAmount} onChange={e => setOriginalAmount(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    />
                    <TextField
                        label="Remaining balance" size="small" fullWidth
                        value={remainingBalance} onChange={e => setRemainingBalance(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    />
                    <TextField
                        label="Interest rate" size="small" fullWidth
                        value={interestRate} onChange={e => setInterestRate(e.target.value)}
                        InputProps={{ endAdornment: <InputAdornment position="end">% / yr</InputAdornment> }}
                    />
                    <TextField
                        label="Monthly repayment" size="small" fullWidth
                        value={monthlyRepayment} onChange={e => setMonthlyRepayment(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, endAdornment: <InputAdornment position="end">/mo</InputAdornment> }}
                    />
                </Stack>

                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: existingLoan && onRemove ? 'space-between' : 'flex-end', mt: 3 }}>
                    {existingLoan && onRemove && (
                        <Button
                            onClick={() => { onRemove(); onClose(); }}
                            sx={{ textTransform: 'none', fontWeight: 600, color: '#b91c1c' }}
                        >
                            Remove loan
                        </Button>
                    )}
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#ddd', color: '#555' }}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained" disabled={!canSave} onClick={save}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK } }}
                        >
                            Save
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Dialog>
    );
};

export default LoanFormDialog;