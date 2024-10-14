import React, {useState} from "react";
import {Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField, Typography} from "@mui/material";

export interface SavingsGoalData {
    goalName: string;
    goalDescription: string;
    targetAmount: number;
    currentSavings: number;
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
            <TextField
                fullWidth
                label="Target Date"
                name="targetDate"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={savingsGoalData.targetDate}
                onChange={handleChange}
                sx={{ mb: 2 }}
            />
        </Box>
    );
};

export default SavingsGoalQuestions;
