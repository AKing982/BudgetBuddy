import React, { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Cell,
    BarChart,
    Bar,
    Pie
} from 'recharts';
import {
    Card,
    CardContent,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box,
    SelectChangeEvent, useTheme, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import PlaidService from "../services/PlaidService";
import {CheckCircle} from "lucide-react";

interface SpendingData {
    date: string;
    amount: number;
    category?: string; // For Pie chart
}

type PeriodType = 'monthly' | 'weekly' | 'daily' | 'biweekly';
type ChartType = 'line' | 'pie' | 'bar';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']; // For Pie chart segments
const generateDummyData = (period: PeriodType): SpendingData[] => {
    const now = new Date();
    const data: SpendingData[] = [];
    let intervals: number;
    let milliseconds: number;

    switch (period) {
        case 'daily':
            intervals = 30;
            milliseconds = 86400000; // 1 day
            break;
        case 'weekly':
            intervals = 12;
            milliseconds = 604800000; // 1 week
            break;
        case 'biweekly':
            intervals = 12;
            milliseconds = 1209600000; // 2 weeks
            break;
        case 'monthly':
            intervals = 12;
            milliseconds = 2592000000; // ~30 days
            break;
        default:
            intervals = 12;
            milliseconds = 2592000000;
    }

    for (let i = 0; i < intervals; i++) {
        const date = new Date(now.getTime() - i * milliseconds);
        data.unshift({
            date: date.toISOString().split('T')[0],
            amount: Math.floor(Math.random() * 1000) + 500,
            category: `Category ${i % 5}` // Dummy categories for Pie chart
        });
    }
    return data;
};

const SpendingTracker: React.FC = () => {
    const [period, setPeriod] = useState<PeriodType>('monthly');
    const [chartType, setChartType] = useState<ChartType>('line');
    const [spendingData, setSpendingData] = useState<SpendingData[]>(generateDummyData('monthly'));
    const plaidService = PlaidService.getInstance();
    const theme = useTheme();

    const handlePeriodChange = (event: SelectChangeEvent<PeriodType>) => {
        const newPeriod = event.target.value as PeriodType;
        setPeriod(newPeriod);
        setSpendingData(generateDummyData(newPeriod));
    };

    const handleChartTypeChange = (_event: React.MouseEvent<HTMLElement>, newChartType: ChartType | null) => {
        if (newChartType) {
            setChartType(newChartType);
        }
    };

    const currentSpend = spendingData[spendingData.length - 1]?.amount || 0;
    const firstPeriodSpend = spendingData[0]?.amount || 0;
    const difference = currentSpend - firstPeriodSpend;

    const handleSpentText = (period: PeriodType): string => {
        switch (period) {
            case 'monthly': return 'Current spend this month';
            case 'biweekly': return 'Current spend this biweek';
            case 'weekly': return 'Current spend this week';
            case 'daily': return 'Current spend today';
            default: return 'Current spend';
        }
    };

    const totalSpend = spendingData.reduce((sum, item) => sum + item.amount, 0);

    const renderChart = () => {
        switch (chartType) {
            case 'line':
                return (
                    <LineChart data={spendingData}>
                        <XAxis dataKey="date" tick={{ fill: theme.palette.text.secondary }} axisLine={{ stroke: theme.palette.divider }} />
                        <YAxis tick={{ fill: theme.palette.text.secondary }} axisLine={{ stroke: theme.palette.divider }} />
                        <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: '8px' }} />
                        <Line
                            type="monotone"
                            dataKey="amount"
                            stroke={theme.palette.primary.main}
                            strokeWidth={3}
                            dot={{ fill: theme.palette.primary.main, strokeWidth: 2 }}
                            activeDot={{ r: 8 }}
                        />
                    </LineChart>
                );
            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={spendingData}
                            dataKey="amount"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                            {spendingData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: '8px' }} />
                    </PieChart>
                );
            case 'bar':
                return (
                    <BarChart data={spendingData}>
                        <XAxis dataKey="date" tick={{ fill: theme.palette.text.secondary }} axisLine={{ stroke: theme.palette.divider }} />
                        <YAxis tick={{ fill: theme.palette.text.secondary }} axisLine={{ stroke: theme.palette.divider }} />
                        <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: '8px' }} />
                        <Bar dataKey="amount" fill={theme.palette.primary.main} />
                    </BarChart>
                );
            default:
                // Fallback to LineChart instead of null
                return (
                    <LineChart data={spendingData}>
                        <XAxis dataKey="date" tick={{ fill: theme.palette.text.secondary }} axisLine={{ stroke: theme.palette.divider }} />
                        <YAxis tick={{ fill: theme.palette.text.secondary }} axisLine={{ stroke: theme.palette.divider }} />
                        <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: '8px' }} />
                        <Line
                            type="monotone"
                            dataKey="amount"
                            stroke={theme.palette.primary.main}
                            strokeWidth={3}
                            dot={{ fill: theme.palette.primary.main, strokeWidth: 2 }}
                            activeDot={{ r: 8 }}
                        />
                    </LineChart>
                );
        }
    };

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
                            px: 1.5,
                            borderRadius: '16px',
                            mb: 2,
                            alignSelf: 'flex-start',
                        }}
                    >
                        <CheckCircle size={16} style={{ marginRight: '8px' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {difference !== 0
                                ? `You've spent $${Math.abs(difference).toLocaleString()} ${difference < 0 ? 'less' : 'more'} than the first ${period}`
                                : `Spending matches the first ${period}`}
                        </Typography>
                    </Box>
                    <Typography
                        variant="h3"
                        component="div"
                        sx={{ fontWeight: 'bold', color: theme.palette.primary.main, mb: 0.5 }}
                    >
                        ${currentSpend.toLocaleString()}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary }}>
                        {handleSpentText(period)}
                    </Typography>
                    {chartType === 'pie' && (
                        <Typography variant="body2" sx={{ mt: 1, color: theme.palette.text.secondary }}>
                            Total Spend: ${totalSpend.toLocaleString()}
                        </Typography>
                    )}
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel id="period-select-label">Period</InputLabel>
                        <Select
                            labelId="period-select-label"
                            value={period}
                            label="Period"
                            onChange={handlePeriodChange}
                            sx={{ borderRadius: '8px' }}
                        >
                            <MenuItem value="monthly">Monthly</MenuItem>
                            <MenuItem value="biweekly">Biweekly</MenuItem>
                            <MenuItem value="weekly">Weekly</MenuItem>
                            <MenuItem value="daily">Daily</MenuItem>
                        </Select>
                    </FormControl>
                    <ToggleButtonGroup
                        value={chartType}
                        exclusive
                        onChange={handleChartTypeChange}
                        aria-label="chart type"
                        sx={{ bgcolor: theme.palette.grey[100], borderRadius: '8px' }}
                    >
                        <ToggleButton value="line" aria-label="line chart">Line</ToggleButton>
                        <ToggleButton value="pie" aria-label="pie chart">Pie</ToggleButton>
                        <ToggleButton value="bar" aria-label="bar chart">Bar</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        {renderChart()}
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    );
};


export default SpendingTracker;