import React from 'react';
import {
    Box,
    Typography,
    TextField,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    TextareaAutosize
} from '@mui/material';
import {DebtPayoffData} from "./DebtPayoffQuestions";
import {SpendingControlData} from "./SpendingControlQuestions";

export interface HistoricalBudgetData
{
    previousIncome: number;
    hadPreviousBudget: boolean;
    previousBudgetType?: string;
    previousGoalsSimilar?: boolean;
    previousGoalsDifference?: string;
    previousSavingsAmount?: number;
    previousDebtAmount?: number;
    previousSpendingAmount?: number;
}


interface HistoricalBudgetQuestionsProps {
    onDataChange: (data: HistoricalBudgetData) => void;
}
const HistoricalBudgetQuestions: React.FC<HistoricalBudgetQuestionsProps> = ({ onDataChange }) => {
    const [historyData, setHistoryData] = React.useState<HistoricalBudgetData>({
        previousIncome: 0,
        hadPreviousBudget: false
    });

    const handleChange = (field: keyof HistoricalBudgetData, value: any) => {
        const newData = { ...historyData, [field]: value };
        setHistoryData(newData);
        onDataChange(newData);
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom color="primary">
                Previous Year's Budget Information
            </Typography>

            <TextField
                fullWidth
                label="What was your annual income last year?"
                type="number"
                InputProps={{ startAdornment: '$' }}
                value={historyData.previousIncome || ''}
                onChange={(e) => handleChange('previousIncome', Number(e.target.value))}
                sx={{ mb: 3 }}
            />

            <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                <FormLabel component="legend">Did you have a budget last year?</FormLabel>
                <RadioGroup
                    value={historyData.hadPreviousBudget}
                    onChange={(e) => handleChange('hadPreviousBudget', e.target.value === 'true')}
                >
                    <FormControlLabel value={true} control={<Radio />} label="Yes" />
                    <FormControlLabel value={false} control={<Radio />} label="No" />
                </RadioGroup>
            </FormControl>

            {historyData.hadPreviousBudget && (
                <>
                    <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                        <FormLabel component="legend">What was your primary financial focus last year?</FormLabel>
                        <RadioGroup
                            value={historyData.previousBudgetType || ''}
                            onChange={(e) => handleChange('previousBudgetType', e.target.value)}
                        >
                            <FormControlLabel value="Saving" control={<Radio />} label="Saving money" />
                            <FormControlLabel value="DebtPayoff" control={<Radio />} label="Paying off debt" />
                            <FormControlLabel value="SpendingControl" control={<Radio />} label="Controlling spending" />
                            <FormControlLabel value="EmergencyFund" control={<Radio />} label="Building emergency fund" />
                        </RadioGroup>
                    </FormControl>

                    {historyData.previousBudgetType === 'Saving' && (
                        <TextField
                            fullWidth
                            label="How much did you manage to save?"
                            type="number"
                            InputProps={{ startAdornment: '$' }}
                            value={historyData.previousSavingsAmount || ''}
                            onChange={(e) => handleChange('previousSavingsAmount', Number(e.target.value))}
                            sx={{ mb: 3 }}
                        />
                    )}

                    {historyData.previousBudgetType === 'DebtPayoff' && (
                        <TextField
                            fullWidth
                            label="How much debt did you pay off?"
                            type="number"
                            InputProps={{ startAdornment: '$' }}
                            value={historyData.previousDebtAmount || ''}
                            onChange={(e) => handleChange('previousDebtAmount', Number(e.target.value))}
                            sx={{ mb: 3 }}
                        />
                    )}

                    {historyData.previousBudgetType === 'SpendingControl' && (
                        <TextField
                            fullWidth
                            label="What was your average monthly spending?"
                            type="number"
                            InputProps={{ startAdornment: '$' }}
                            value={historyData.previousSpendingAmount || ''}
                            onChange={(e) => handleChange('previousSpendingAmount', Number(e.target.value))}
                            sx={{ mb: 3 }}
                        />
                    )}

                    <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                        <FormLabel component="legend">Are your financial goals similar to last year?</FormLabel>
                        <RadioGroup
                            value={historyData.previousGoalsSimilar}
                            onChange={(e) => handleChange('previousGoalsSimilar', e.target.value === 'true')}
                        >
                            <FormControlLabel value={true} control={<Radio />} label="Yes" />
                            <FormControlLabel value={false} control={<Radio />} label="No" />
                        </RadioGroup>
                    </FormControl>

                    {historyData.previousGoalsSimilar === false && (
                        <Box sx={{ mb: 3 }}>
                            <FormLabel>Please describe what's different this year:</FormLabel>
                            <TextareaAutosize
                                minRows={3}
                                placeholder="Explain how your financial goals have changed..."
                                style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                                value={historyData.previousGoalsDifference || ''}
                                onChange={(e) => handleChange('previousGoalsDifference', e.target.value)}
                            />
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

export default HistoricalBudgetQuestions;