import React, {useState} from "react";
import {Box, Button, Checkbox, FormControlLabel, Grid, SelectChangeEvent, TextField, Typography} from "@mui/material";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers";

interface DebtItem {
    type: string;
    amount: number;
    allocation: number;
    targetDate: Date;
}


export interface DebtPayoffData {
    debts: DebtItem[];
    otherDebtType: string;
    otherDebtAmount: number;
    otherDebtAllocation: number;
    otherDebtTargetDate: Date;
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
        otherDebtAllocation: 0,
        otherDebtTargetDate: new Date()
    });

    const handleDebtTypeToggle = (debtType: string) => {
        setDebtPayoffData(prev => {
            const newDebts = prev.debts.some(debt => debt.type === debtType)
                ? prev.debts.filter(debt => debt.type !== debtType)
                : [...prev.debts, { type: debtType, amount: 0, allocation: 0, targetDate: new Date() }];

            const updatedData = { ...prev, debts: newDebts };
            onDataChange(updatedData);
            return updatedData;
        });
    };

    const handleDebtItemChange = (debtType: string, field: keyof DebtItem, value: number | Date) => {
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
                        allocation: prev.otherDebtAllocation,
                        targetDate: prev.otherDebtTargetDate

                    }
                ];
                const updatedData = {
                    ...prev,
                    debts: newDebts,
                    otherDebtType: '',
                    otherDebtAmount: 0,
                    otherDebtAllocation: 0,
                    otherDebtTargetDate: new Date()
                };
                onDataChange(updatedData);
                return updatedData;
            });
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>


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
                    <Grid item xs={4}>
                        <DatePicker
                            label="Target Payoff Date"
                            value={debt.targetDate}
                            onChange={(newDate) => {
                                if (newDate) {
                                    handleDebtItemChange(debt.type, 'targetDate', newDate);
                                }
                            }}
                            // renderInput={(params) => <TextField {...params} fullWidth />}
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
        </LocalizationProvider>
    );
}
export default DebtPayoffQuestions;