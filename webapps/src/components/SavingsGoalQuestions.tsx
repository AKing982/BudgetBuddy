import React, {useEffect, useState} from "react";
import {Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField, Typography} from "@mui/material";
import budgetSetupService from "../services/BudgetSetupService";
import BudgetSetupService from "../services/BudgetSetupService";

export interface SavingsGoalData {
    goalName: string;
    goalDescription: string;
    targetAmount: number;
    currentSavings: number;
    monthlyAllocation: number;
    savingsFrequency: 'weekly' | 'monthly' | 'yearly';
    targetDate: string;
}

interface SavingsGoalQuestionProps {
    onDataChange: (data: SavingsGoalData) => void;
}

const SavingsGoalQuestions: React.FC<SavingsGoalQuestionProps> = ({onDataChange}) => {

    const [savingsGoalData, setSavingsGoalData] = useState<SavingsGoalData>({
        goalName: '',
        goalDescription: '',
        targetAmount: 0,
        currentSavings: 0,
        monthlyAllocation: 0,
        savingsFrequency: 'monthly',
        targetDate: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
        const { name, value } = e.target;
        const updatedData = {
            ...savingsGoalData,
            [name]: ['targetAmount', 'currentSavings'].includes(name)
                ? parseFloat(value) || 0
                : value
        };
        setSavingsGoalData(updatedData);
        onDataChange(updatedData);
    };

    const budgetSetupService = BudgetSetupService.getInstance();

    const startDate = Date.now();

    // Calculate both monthlyAllocation and targetDate
    useEffect(() => {
        const { targetAmount, currentSavings, savingsFrequency } = savingsGoalData;

        if (targetAmount <= 0) return; // Skip calculation if targetAmount is invalid

        try {
            // Step 1: Calculate monthlyAllocation using a default targetDate (e.g., 1 year from start)

            const defaultTargetDate = new Date(startDate);
            defaultTargetDate.setFullYear(defaultTargetDate.getFullYear() + 1); // Default to 1 year
            const defaultTargetTimestamp = defaultTargetDate.getTime();

            let adjustedTargetAmount = targetAmount;
            let adjustedCurrentSavings = currentSavings;

            // Adjust for savings frequency if needed
            if (savingsFrequency === 'weekly') {
                adjustedTargetAmount *= 52; // Convert to yearly
                adjustedCurrentSavings *= 52;
            } else if (savingsFrequency === 'yearly') {
                adjustedTargetAmount /= 12; // Convert to monthly
                adjustedCurrentSavings /= 12;
            }

            const calculatedMonthlyAllocation = budgetSetupService.calculateMonthlyAllocationNeeded(
                startDate,
                defaultTargetTimestamp,
                adjustedTargetAmount,
                adjustedCurrentSavings
            );

            // Step 2: Use the calculated monthlyAllocation to determine the exact targetDate
            const calculatedDeadline = budgetSetupService.calculateExpectedSavingsDeadline(
                startDate,
                adjustedTargetAmount,
                calculatedMonthlyAllocation,
                adjustedCurrentSavings
            );
            const calculatedTargetDate = new Date(calculatedDeadline).toISOString().split('T')[0];

            const updatedData = {
                ...savingsGoalData,
                monthlyAllocation: calculatedMonthlyAllocation,
                targetDate: calculatedTargetDate
            };
            setSavingsGoalData(updatedData);
            onDataChange(updatedData);
        } catch (error) {
            console.error("Error in calculations:", error);
            const updatedData = {
                ...savingsGoalData,
                monthlyAllocation: 0,
                targetDate: ''
            };
            setSavingsGoalData(updatedData);
            onDataChange(updatedData);
        }
    }, [savingsGoalData.targetAmount, savingsGoalData.currentSavings, savingsGoalData.savingsFrequency, startDate]);

    const formatCurrency = (amount: number) => {
        return amount > 0 ? `$${amount.toFixed(2)}` : 'N/A';
    };

    const formatDate = (timestamp: string) => {
        return timestamp ? new Date(timestamp).toLocaleDateString() : 'N/A';
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Saving Goal Specific Questions
            </Typography>
            <TextField
                fullWidth
                label="Goal Name"
                name="goalName"
                value={savingsGoalData.goalName}
                onChange={handleChange}
                sx={{ mb: 2 }}
            />
            <TextField
                fullWidth
                label="Goal Description"
                name="goalDescription"
                value={savingsGoalData.goalDescription}
                onChange={handleChange}
                multiline
                rows={2}
                sx={{ mb: 2 }}
            />
            <TextField
                fullWidth
                label="Target Amount"
                name="targetAmount"
                type="number"
                InputProps={{ startAdornment: '$' }}
                value={savingsGoalData.targetAmount || ''}
                onChange={handleChange}
                sx={{ mb: 2 }}
            />
            <TextField
                fullWidth
                label="Current Savings"
                name="currentSavings"
                type="number"
                InputProps={{ startAdornment: '$' }}
                value={savingsGoalData.currentSavings || ''}
                onChange={handleChange}
                sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Saving Frequency</InputLabel>
                <Select
                    label="Saving Frequency"
                    name="savingsFrequency"
                    value={savingsGoalData.savingsFrequency}
                    onChange={handleChange}
                >
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
            </FormControl>

            <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                    Calculated Monthly Allocation: {formatCurrency(savingsGoalData.monthlyAllocation)}
                </Typography>
                <Typography variant="body1">
                    Calculated Target Date: {formatDate(savingsGoalData.targetDate)}
                </Typography>
            </Box>
        </Box>
    );
};

export default SavingsGoalQuestions;
