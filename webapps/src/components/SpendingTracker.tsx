import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Card,
    CardContent,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box,
    SelectChangeEvent
} from '@mui/material';
import PlaidService from "../services/PlaidService";

interface SpendingData {
    date: string;
    amount: number;
}

type PeriodType = 'monthly' | 'weekly' | 'daily';

const generateDummyData = (period: string): SpendingData[] => {
    // This is a placeholder function. In a real app, you'd fetch actual data based on the selected period
    const now = new Date();
    const data: SpendingData[] = [];
    let days = period === 'daily' ? 30 : period === 'weekly' ? 12 : 12;

    for (let i = 0; i < days; i++) {
        const date = new Date(now.getTime() - i * (period === 'daily' ? 86400000 : period === 'weekly' ? 604800000 : 2592000000));
        data.unshift({
            date: date.toISOString().split('T')[0],
            amount: Math.floor(Math.random() * 1000) + 500,
        });
    }
    return data;
};

const SpendingTracker: React.FC = () => {
    const [period, setPeriod] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
    const [spendingData, setSpendingData] = useState<SpendingData[]>(generateDummyData('monthly'));
    const plaidService = PlaidService.getInstance();

    const handlePeriodChange = (event: SelectChangeEvent<PeriodType>) => {
        const newPeriod = event.target.value as 'monthly' | 'weekly' | 'daily';
        setPeriod(newPeriod);
        setSpendingData(generateDummyData(newPeriod));
    };

    const currentSpend = spendingData[spendingData.length - 1]?.amount || 0;
    const lastPeriodSpend = spendingData[0]?.amount || 0;
    const difference = currentSpend - lastPeriodSpend;

    const handleSpentText = (period: PeriodType) : string => {
        switch(period)
        {
            case "monthly":
                return "Current spend this month";
            case "daily":
                return "Current spend this day";
            case "weekly":
                return "Current spend this week";
            default:
                throw new Error("Invalid period found: ", period);
        }
    }

    return (
        <Card sx={{ maxWidth: 1050, margin: 'auto', mt: 4 }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                        <Typography variant="subtitle1">
                            {handleSpentText(period)}
                        </Typography>
                        <Typography variant="h3" component="div">
                            ${currentSpend.toLocaleString()}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color={difference < 0 ? 'success.main' : 'error.main'}>
                        You've spent ${Math.abs(difference).toLocaleString()} {difference < 0 ? 'less' : 'more'} than last {period}
                    </Typography>
                </Box>

                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="period-select-label">Select Period</InputLabel>
                    <Select
                        labelId="period-select-label"
                        value={period}
                        label="Select Period"
                        onChange={handlePeriodChange}
                    >
                        <MenuItem value="monthly">Monthly</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="daily">Daily</MenuItem>
                    </Select>
                </FormControl>

                <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={spendingData}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    );
};

export default SpendingTracker;