import React, {useState} from "react";
import {Box, Button, Checkbox, FormControlLabel, Grid, SelectChangeEvent, TextField, Typography} from "@mui/material";

interface DebtItem {
    type: string;
    amount: number;
    allocation: number;
}


export interface DebtPayoffData {
    debts: DebtItem[];
    otherDebtType: string;
    otherDebtAmount: number;
    otherDebtAllocation: number;
}

interface DebtPayoffQuestionProps {
    onDataChange: (data: DebtPayoffData) => void;
}

const predefinedDebtTypes = ['Credit Card', 'Personal Loan', 'Student Loan', 'Mortgage', 'Auto Loan'];

const DebtPayoffQuestions: React.FC<DebtPayoffQuestionProps> = ({ onDataChange }) => {
    const [debtPayoffData, setDebtPayoffData] = useState<DebtPayoffData>({
        debts: [],
        otherDebtType: '',
        otherDebtAmount: 0,
        otherDebtAllocation: 0
    });

    const handleDebtTypeToggle = (debtType: string) => {
        setDebtPayoffData(prev => {
            const newDebts = prev.debts.some(debt => debt.type === debtType)
                ? prev.debts.filter(debt => debt.type !== debtType)
                : [...prev.debts, { type: debtType, amount: 0, allocation: 0 }];

            const updatedData = { ...prev, debts: newDebts };
            onDataChange(updatedData);
            return updatedData;
        });
    };

    const handleDebtItemChange = (debtType: string, field: 'amount' | 'allocation', value: number) => {
        setDebtPayoffData(prev => {
            const newDebts = prev.debts.map(debt =>
                debt.type === debtType ? { ...debt, [field]: value } : debt
            );

            const updatedData = { ...prev, debts: newDebts };
            onDataChange(updatedData);
            return updatedData;
        });
    };

    const handleOtherDebtChange = (field: keyof Pick<DebtPayoffData, 'otherDebtType' | 'otherDebtAmount' | 'otherDebtAllocation'>, value: string | number) => {
        setDebtPayoffData(prev => {
            const updatedData = { ...prev, [field]: value };
            onDataChange(updatedData);
            return updatedData;
        });
    };

    const addOtherDebt = () => {
        if (debtPayoffData.otherDebtType && debtPayoffData.otherDebtAmount > 0) {
            setDebtPayoffData(prev => {
                const newDebts = [
                    ...prev.debts,
                    {
                        type: prev.otherDebtType,
                        amount: prev.otherDebtAmount,
                        allocation: prev.otherDebtAllocation
                    }
                ];
                const updatedData = {
                    ...prev,
                    debts: newDebts,
                    otherDebtType: '',
                    otherDebtAmount: 0,
                    otherDebtAllocation: 0
                };
                onDataChange(updatedData);
                return updatedData;
            });
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Debt Payoff Specific Questions
            </Typography>

            <Typography variant="subtitle1" gutterBottom>
                Select your debt types:
            </Typography>
            {predefinedDebtTypes.map(debtType => (
                <FormControlLabel
                    key={debtType}
                    control={
                        <Checkbox
                            checked={debtPayoffData.debts.some(debt => debt.type === debtType)}
                            onChange={() => handleDebtTypeToggle(debtType)}
                        />
                    }
                    label={debtType}
                />
            ))}

            {debtPayoffData.debts.map(debt => (
                <Grid container spacing={2} key={debt.type} sx={{ mt: 2 }}>
                    <Grid item xs={12}>
                        <Typography variant="subtitle2">{debt.type}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            label="Debt Amount"
                            type="number"
                            InputProps={{ startAdornment: '$' }}
                            value={debt.amount}
                            onChange={(e) => handleDebtItemChange(debt.type, 'amount', Number(e.target.value))}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            label="Monthly Allocation"
                            type="number"
                            InputProps={{ startAdornment: '$' }}
                            value={debt.allocation}
                            onChange={(e) => handleDebtItemChange(debt.type, 'allocation', Number(e.target.value))}
                        />
                    </Grid>
                </Grid>
            ))}

            <Typography variant="subtitle1" gutterBottom sx={{ mt: 4 }}>
                Add other debt:
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Other Debt Type"
                        value={debtPayoffData.otherDebtType}
                        onChange={(e) => handleOtherDebtChange('otherDebtType', e.target.value)}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Debt Amount"
                        type="number"
                        InputProps={{ startAdornment: '$' }}
                        value={debtPayoffData.otherDebtAmount}
                        onChange={(e) => handleOtherDebtChange('otherDebtAmount', Number(e.target.value))}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Monthly Allocation"
                        type="number"
                        InputProps={{ startAdornment: '$' }}
                        value={debtPayoffData.otherDebtAllocation}
                        onChange={(e) => handleOtherDebtChange('otherDebtAllocation', Number(e.target.value))}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Button variant="contained" onClick={addOtherDebt}>
                        Add Other Debt
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
}
export default DebtPayoffQuestions;