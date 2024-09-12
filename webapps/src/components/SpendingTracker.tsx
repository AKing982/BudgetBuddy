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
    SelectChangeEvent, useTheme
} from '@mui/material';
import PlaidService from "../services/PlaidService";
import {CheckCircle} from "lucide-react";

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
    const theme = useTheme();

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
        <Card
            sx={{
                maxWidth: 1050,
                margin: 'auto',
                mt: 4,
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                overflow: 'hidden',
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box display="flex" flexDirection="column" mb={3}>
                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            bgcolor: difference < 0 ? '#e6f4ea' : '#fce8e6',
                            color: difference < 0 ? '#137333' : '#c5221f',
                            py: 0.5,
                            px: 1,
                            borderRadius: '16px',
                            mb: 1,
                            alignSelf: 'flex-start',
                        }}
                    >
                        <CheckCircle size={16} style={{ marginRight: '4px' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            You've spent ${Math.abs(difference).toLocaleString()} {difference < 0 ? 'less' : 'more'} than last {period}
                        </Typography>
                    </Box>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: theme.palette.primary.main, mb: 0.5 }}>
                        ${currentSpend.toLocaleString()}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary }}>
                        {handleSpentText(period)}
                    </Typography>
                </Box>

                <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="period-select-label">Select Period</InputLabel>
                    <Select
                        labelId="period-select-label"
                        value={period}
                        label="Select Period"
                        onChange={handlePeriodChange}
                        sx={{
                            borderRadius: '8px',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.divider,
                            },
                        }}
                    >
                        <MenuItem value="monthly">Monthly</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="daily">Daily</MenuItem>
                    </Select>
                </FormControl>

                <Box sx={{ height: 300, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={spendingData}>
                            <XAxis
                                dataKey="date"
                                tick={{ fill: theme.palette.text.secondary }}
                                axisLine={{ stroke: theme.palette.divider }}
                            />
                            <YAxis
                                tick={{ fill: theme.palette.text.secondary }}
                                axisLine={{ stroke: theme.palette.divider }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: theme.palette.background.paper,
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: '8px',
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="amount"
                                stroke={theme.palette.primary.main}
                                strokeWidth={3}
                                dot={{ fill: theme.palette.primary.main, strokeWidth: 2 }}
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    );
    // return (
    //     <Card
    //         sx={{
    //             maxWidth: 1050,
    //             margin: 'auto',
    //             mt: 4,
    //             borderRadius: '16px',
    //             boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    //             overflow: 'hidden',
    //         }}
    //     >
    //         <CardContent sx={{ p: 3 }}>
    //             <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'start', sm: 'center' }} mb={3}>
    //                 <Box>
    //                     <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
    //                         {handleSpentText(period)}
    //                     </Typography>
    //                     <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
    //                         ${currentSpend.toLocaleString()}
    //                     </Typography>
    //                 </Box>
    //                 <Typography
    //                     variant="body2"
    //                     sx={{
    //                         color: difference < 0 ? theme.palette.success.main : theme.palette.error.main,
    //                         bgcolor: difference < 0 ? theme.palette.success.light : theme.palette.error.light,
    //                         p: 1,
    //                         borderRadius: '8px',
    //                         mt: { xs: 2, sm: 0 }
    //                     }}
    //                 >
    //                     You've spent ${Math.abs(difference).toLocaleString()} {difference < 0 ? 'less' : 'more'} than last {period}
    //                 </Typography>
    //             </Box>
    //
    //             <FormControl fullWidth sx={{ mb: 3 }}>
    //                 <InputLabel id="period-select-label">Select Period</InputLabel>
    //                 <Select
    //                     labelId="period-select-label"
    //                     value={period}
    //                     label="Select Period"
    //                     onChange={handlePeriodChange}
    //                     sx={{
    //                         borderRadius: '8px',
    //                         '& .MuiOutlinedInput-notchedOutline': {
    //                             borderColor: theme.palette.divider,
    //                         },
    //                     }}
    //                 >
    //                     <MenuItem value="monthly">Monthly</MenuItem>
    //                     <MenuItem value="weekly">Weekly</MenuItem>
    //                     <MenuItem value="daily">Daily</MenuItem>
    //                 </Select>
    //             </FormControl>
    //
    //             <Box sx={{ height: 300, mt: 2 }}>
    //                 <ResponsiveContainer width="100%" height="100%">
    //                     <LineChart data={spendingData}>
    //                         <XAxis
    //                             dataKey="date"
    //                             tick={{ fill: theme.palette.text.secondary }}
    //                             axisLine={{ stroke: theme.palette.divider }}
    //                         />
    //                         <YAxis
    //                             tick={{ fill: theme.palette.text.secondary }}
    //                             axisLine={{ stroke: theme.palette.divider }}
    //                         />
    //                         <Tooltip
    //                             contentStyle={{
    //                                 backgroundColor: theme.palette.background.paper,
    //                                 border: `1px solid ${theme.palette.divider}`,
    //                                 borderRadius: '8px',
    //                             }}
    //                         />
    //                         <Line
    //                             type="monotone"
    //                             dataKey="amount"
    //                             stroke={theme.palette.primary.main}
    //                             strokeWidth={3}
    //                             dot={{ fill: theme.palette.primary.main, strokeWidth: 2 }}
    //                             activeDot={{ r: 8 }}
    //                         />
    //                     </LineChart>
    //                 </ResponsiveContainer>
    //             </Box>
    //         </CardContent>
    //     </Card>
    // );
    //
};

export default SpendingTracker;