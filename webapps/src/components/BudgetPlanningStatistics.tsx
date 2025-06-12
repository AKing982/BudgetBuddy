import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    LinearProgress,
    CircularProgress,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    IconButton,
    Divider,
} from '@mui/material';
import {
    ShoppingCart,
    Savings,
    Home,
    DirectionsCar,
    Movie,
    TrendingUp,
    TrendingDown,
    AccountBalance,
    Download,
    Visibility,
    Warning,
    CheckCircle,
    Error,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { styled } from '@mui/material/styles';

// Type definitions
interface CategoryData {
    name: string;
    icon: JSX.Element;
    budgeted: number;
    actual: number;
    remaining: number;
}

interface WeeklyData {
    week: number;
    categories: CategoryData[];
    totalBudgeted: number;
    totalActual: number;
    expectedSavings: number;
    actualSavings: number;
    accountBalance: number;
    health: 'Good' | 'Warning' | 'Critical';
}

interface ChartData {
    week: string;
    Groceries: number;
    Utilities: number;
    Entertainment: number;
    Total: number;
    Budgeted: number;
}

// Styled components
const maroonColor = '#800000';

const WeekTile = styled(Card)<{ health: string }>(({ theme, health }) => ({
    height: '320px',
    transition: 'all 0.3s ease',
    border: `3px solid ${
        health === 'Good' ? '#4caf50' :
            health === 'Warning' ? '#ff9800' : '#f44336'
    }`,
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    },
}));

const MonthlyTile = styled(Card)(({ theme }) => ({
    background: `linear-gradient(135deg, ${maroonColor} 0%, #a00000 100%)`,
    color: 'white',
    minHeight: '200px',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 24px rgba(128,0,0,0.3)',
    },
}));

const CircularGauge = styled(Box)<{ health: string }>(({ health }) => ({
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& .MuiCircularProgress-root': {
        color: health === 'Good' ? '#4caf50' : health === 'Warning' ? '#ff9800' : '#f44336',
    },
}));

const BudgetPlanningStatistics: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState<string>('June 2025');

    // Sample data
    const weeklyData: WeeklyData[] = [
        {
            week: 1,
            categories: [
                { name: 'Groceries', icon: <ShoppingCart />, budgeted: 200, actual: 185, remaining: 15 },
                { name: 'Utilities', icon: <Home />, budgeted: 150, actual: 140, remaining: 10 },
                { name: 'Entertainment', icon: <Movie />, budgeted: 100, actual: 120, remaining: -20 },
                { name: 'Transportation', icon: <DirectionsCar />, budgeted: 80, actual: 75, remaining: 5 },
            ],
            totalBudgeted: 530,
            totalActual: 520,
            expectedSavings: 20,
            actualSavings: 10,
            accountBalance: 1835,
            health: 'Good',
        },
        {
            week: 2,
            categories: [
                { name: 'Groceries', icon: <ShoppingCart />, budgeted: 200, actual: 195, remaining: 5 },
                { name: 'Utilities', icon: <Home />, budgeted: 150, actual: 145, remaining: 5 },
                { name: 'Entertainment', icon: <Movie />, budgeted: 100, actual: 85, remaining: 15 },
                { name: 'Transportation', icon: <DirectionsCar />, budgeted: 80, actual: 90, remaining: -10 },
            ],
            totalBudgeted: 530,
            totalActual: 515,
            expectedSavings: 25,
            actualSavings: 15,
            accountBalance: 1650,
            health: 'Warning',
        },
        {
            week: 3,
            categories: [
                { name: 'Groceries', icon: <ShoppingCart />, budgeted: 200, actual: 210, remaining: -10 },
                { name: 'Utilities', icon: <Home />, budgeted: 150, actual: 135, remaining: 15 },
                { name: 'Entertainment', icon: <Movie />, budgeted: 100, actual: 95, remaining: 5 },
                { name: 'Transportation', icon: <DirectionsCar />, budgeted: 80, actual: 85, remaining: -5 },
            ],
            totalBudgeted: 530,
            totalActual: 525,
            expectedSavings: 15,
            actualSavings: 5,
            accountBalance: 1425,
            health: 'Warning',
        },
        {
            week: 4,
            categories: [
                { name: 'Groceries', icon: <ShoppingCart />, budgeted: 200, actual: 190, remaining: 10 },
                { name: 'Utilities', icon: <Home />, budgeted: 150, actual: 148, remaining: 2 },
                { name: 'Entertainment', icon: <Movie />, budgeted: 100, actual: 110, remaining: -10 },
                { name: 'Transportation', icon: <DirectionsCar />, budgeted: 80, actual: 82, remaining: -2 },
            ],
            totalBudgeted: 530,
            totalActual: 530,
            expectedSavings: 10,
            actualSavings: 0,
            accountBalance: 1200,
            health: 'Critical',
        },
    ];

    const chartData: ChartData[] = [
        { week: 'Week 1', Groceries: 185, Utilities: 140, Entertainment: 120, Total: 520, Budgeted: 530 },
        { week: 'Week 2', Groceries: 195, Utilities: 145, Entertainment: 85, Total: 515, Budgeted: 530 },
        { week: 'Week 3', Groceries: 210, Utilities: 135, Entertainment: 95, Total: 525, Budgeted: 530 },
        { week: 'Week 4', Groceries: 190, Utilities: 148, Entertainment: 110, Total: 530, Budgeted: 530 },
    ];

    const getHealthIcon = (health: string) => {
        switch (health) {
            case 'Good': return <CheckCircle sx={{ color: '#4caf50' }} />;
            case 'Warning': return <Warning sx={{ color: '#ff9800' }} />;
            case 'Critical': return <Error sx={{ color: '#f44336' }} />;
            default: return <CheckCircle sx={{ color: '#4caf50' }} />;
        }
    };

    const getHealthValue = (health: string) => {
        switch (health) {
            case 'Good': return 85;
            case 'Warning': return 60;
            case 'Critical': return 30;
            default: return 85;
        }
    };

    const findHighestSpending = (categories: CategoryData[]) => {
        return categories.reduce((prev, current) =>
            prev.actual > current.actual ? prev : current
        );
    };

    const findMostSaved = (categories: CategoryData[]) => {
        return categories.reduce((prev, current) =>
            prev.remaining > current.remaining ? prev : current
        );
    };

    const monthlyTotals = {
        totalBudgeted: weeklyData.reduce((sum, week) => sum + week.totalBudgeted, 0),
        totalActual: weeklyData.reduce((sum, week) => sum + week.totalActual, 0),
        expectedSavings: weeklyData.reduce((sum, week) => sum + week.expectedSavings, 0),
        actualSavings: weeklyData.reduce((sum, week) => sum + week.actualSavings, 0),
        finalBalance: weeklyData[weeklyData.length - 1].accountBalance,
    };

    return (
        <Box sx={{ p: 3, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography
                    variant="h4"
                    gutterBottom
                    sx={{
                        fontWeight: 'bold',
                        color: maroonColor,
                        mb: 1
                    }}
                >
                    Budget Statistics
                </Typography>
                <Typography
                    variant="subtitle1"
                    sx={{
                        color: 'text.secondary',
                        mb: 3
                    }}
                >
                    Monitor your weekly and monthly budget performance
                </Typography>

                {/* Month Filter */}
                <FormControl sx={{ minWidth: 200, mb: 3 }}>
                    <InputLabel>Select Month</InputLabel>
                    <Select
                        value={selectedMonth}
                        label="Select Month"
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        <MenuItem value="May 2025">May 2025</MenuItem>
                        <MenuItem value="June 2025">June 2025</MenuItem>
                        <MenuItem value="July 2025">July 2025</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Weekly Tiles */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {weeklyData.map((week) => {
                    const highestSpending = findHighestSpending(week.categories);
                    const mostSaved = findMostSaved(week.categories);

                    return (
                        <Grid item xs={12} md={6} key={week.week}>
                            <WeekTile health={week.health}>
                                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    {/* Tile Header */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: maroonColor }}>
                                            Week {week.week}
                                        </Typography>
                                        {getHealthIcon(week.health)}
                                    </Box>

                                    {/* Highest Spending Category */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                        {highestSpending.icon}
                                        <Box sx={{ ml: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: '500' }}>
                                                Highest Spending
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#f44336' }}>
                                                {highestSpending.name}: ${highestSpending.actual.toFixed(2)}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Most Saved Category */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                        <Savings sx={{ color: '#4caf50' }} />
                                        <Box sx={{ ml: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: '500' }}>
                                                Most Saved
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#4caf50' }}>
                                                {mostSaved.name}: ${Math.max(0, mostSaved.remaining).toFixed(2)} remaining
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Savings Comparison */}
                                    <Box sx={{ mb: 1.5 }}>
                                        <Typography variant="body2" sx={{ fontWeight: '500', mb: 0.5 }}>
                                            Savings
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption">Expected: ${week.expectedSavings}</Typography>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={100}
                                                    sx={{ height: 6, borderRadius: 3, backgroundColor: '#e0e0e0' }}
                                                />
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption">Actual: ${week.actualSavings}</Typography>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={(week.actualSavings / week.expectedSavings) * 100}
                                                    color={week.actualSavings >= 0 ? "success" : "error"}
                                                    sx={{ height: 6, borderRadius: 3 }}
                                                />
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Health Gauge */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                        <CircularGauge health={week.health}>
                                            <CircularProgress
                                                variant="determinate"
                                                value={getHealthValue(week.health)}
                                                size={40}
                                                thickness={6}
                                            />
                                            <Box sx={{ position: 'absolute', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                {getHealthValue(week.health)}%
                                            </Box>
                                        </CircularGauge>
                                        <Box sx={{ ml: 2 }}>
                                            <Typography variant="body2" sx={{ fontWeight: '500' }}>
                                                Health: {week.health}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Budgeted vs Actual */}
                                    <Box sx={{ mb: 1.5 }}>
                                        <Typography variant="body2" sx={{ fontWeight: '500', mb: 0.5 }}>
                                            Budgeted vs. Actual
                                        </Typography>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(week.totalActual / week.totalBudgeted) * 100}
                                            color={week.totalActual <= week.totalBudgeted ? "success" : "error"}
                                            sx={{ height: 8, borderRadius: 4 }}
                                        />
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            ${week.totalActual}/${week.totalBudgeted}
                                        </Typography>
                                    </Box>

                                    {/* Account Balance */}
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" sx={{ fontWeight: '500' }}>
                                            Account Balance
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                color: week.accountBalance < 500 ? '#f44336' : maroonColor,
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            ${week.accountBalance.toLocaleString()}
                                        </Typography>
                                    </Box>

                                    {/* Action Button */}
                                    <Box sx={{ mt: 'auto' }}>
                                        <Button
                                            variant="outlined"
                                            startIcon={<Visibility />}
                                            fullWidth
                                            sx={{
                                                borderColor: maroonColor,
                                                color: maroonColor,
                                                '&:hover': {
                                                    backgroundColor: maroonColor,
                                                    color: 'white',
                                                }
                                            }}
                                        >
                                            View Details
                                        </Button>
                                    </Box>
                                </CardContent>
                            </WeekTile>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Monthly Overview Tile */}
            <MonthlyTile sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: 'white' }}>
                        Monthly Overview - {selectedMonth}
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Grid container spacing={2}>
                                <Grid item xs={6} md={3}>
                                    <Box>
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                            Total Budgeted
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                            ${monthlyTotals.totalBudgeted.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Box>
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                            Total Actual
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                            ${monthlyTotals.totalActual.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Box>
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                            Expected Savings
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                            ${monthlyTotals.expectedSavings}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Box>
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                            Actual Savings
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 'bold',
                                                color: monthlyTotals.actualSavings >= 0 ? '#4caf50' : '#ffcdd2'
                                            }}
                                        >
                                            ${monthlyTotals.actualSavings}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Box sx={{ height: '100px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, p: 2 }}>
                                <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                                    Account Balance Trend
                                </Typography>
                                <ResponsiveContainer width="100%" height={60}>
                                    <LineChart data={chartData}>
                                        <Line
                                            type="monotone"
                                            dataKey="Total"
                                            stroke="#ffffff"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </MonthlyTile>

            {/* Line Chart Visualization */}
            <Card sx={{ mb: 4, p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: maroonColor, mb: 3 }}>
                    Spending Trends - Actual vs. Budgeted
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Groceries" stroke="#ff7300" strokeWidth={2} />
                        <Line type="monotone" dataKey="Utilities" stroke="#387908" strokeWidth={2} />
                        <Line type="monotone" dataKey="Entertainment" stroke="#8884d8" strokeWidth={2} />
                        <Line type="monotone" dataKey="Total" stroke="#82ca9d" strokeWidth={3} />
                        <Line type="monotone" dataKey="Budgeted" stroke={maroonColor} strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            {/* Footer Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                    variant="contained"
                    startIcon={<Download />}
                    sx={{
                        backgroundColor: maroonColor,
                        '&:hover': {
                            backgroundColor: '#600000',
                        }
                    }}
                >
                    Download Stats as CSV
                </Button>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                        label="Export to PDF"
                        clickable
                        sx={{
                            backgroundColor: '#1976d2',
                            color: 'white',
                            '&:hover': {
                                backgroundColor: '#1565c0',
                            }
                        }}
                    />
                    <Chip
                        label="Share Report"
                        clickable
                        sx={{
                            backgroundColor: '#ff9800',
                            color: 'white',
                            '&:hover': {
                                backgroundColor: '#f57c00',
                            }
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default BudgetPlanningStatistics;