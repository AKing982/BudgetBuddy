import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Chip,
    SelectChangeEvent,
    Grid as MuiGrid,
    alpha,
    useTheme
} from '@mui/material';
import {
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    AlertCircle,
    AlertTriangle,
    ChevronUp,
    ChevronDown,
    ChevronRight,
    Info,
    MessageSquare,
    CheckCircle
} from 'lucide-react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, Tooltip } from 'recharts';
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from '@mui/x-date-pickers';


interface SpendingData {
    date: string;
    amount: number;
    category?: string; // For Pie chart
}

interface BudgetData {
    totalBudget: number;
    spent: number;
    remaining: number;
    percentUsed: number;
}

interface CategorySpending {
    category: string;
    amount: number;
    percentage: number;
    color: string;
}

type PeriodType = 'weekly' | 'monthly' | 'yearly';

const CATEGORIES = [
    { name: 'Groceries', color: '#0088FE' },
    { name: 'Dining', color: '#00C49F' },
    { name: 'Transportation', color: '#FFBB28' },
    { name: 'Entertainment', color: '#FF8042' },
    { name: 'Utilities', color: '#8884D8' },
    { name: 'Shopping', color: '#82ca9d' },
    { name: 'Health', color: '#ffc658' },
    { name: 'Other', color: '#a4de6c' }
];

type ChartType = 'line' | 'pie' | 'bar';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']; // For Pie chart segments

const SpendingTracker: React.FC = () => {
    const [period, setPeriod] = useState<PeriodType>('weekly');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showCategoryDetail, setShowCategoryDetail] = useState<string | null>(null);
    const theme = useTheme();

    // Simulate data that would come from the backend
    const generateBudgetData = (): BudgetData => {
        const totalBudget = 1200;
        const spent = Math.floor(Math.random() * 900) + 300;
        const remaining = totalBudget - spent;
        const percentUsed = (spent / totalBudget) * 100;

        return {
            totalBudget,
            spent,
            remaining,
            percentUsed
        };
    };

    const generateCategorySpending = (): CategorySpending[] => {
        let total = 0;
        const rawData = CATEGORIES.map(cat => {
            const amount = Math.floor(Math.random() * 200) + 50;
            total += amount;
            return { category: cat.name, amount, color: cat.color };
        });

        return rawData.map(item => ({
            ...item,
            percentage: parseFloat(((item.amount / total) * 100).toFixed(1))
        }));
    };

    const generateWeeklyComparison = () => {
        const weeks = [];
        const currentDate = new Date();

        for (let i = 0; i < 4; i++) {
            const weekStart = new Date(currentDate);
            weekStart.setDate(currentDate.getDate() - (i * 7 + currentDate.getDay()));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            weeks.push({
                label: `Week ${4-i}`,
                dateRange: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                amount: Math.floor(Math.random() * 400) + 200
            });
        }

        return weeks.reverse(); // Most recent first
    };

    // Mock data for the UI
    const budgetData = generateBudgetData();
    const categorySpending = generateCategorySpending();
    const weeklyComparison = generateWeeklyComparison();

    const handlePeriodChange = (event: SelectChangeEvent<PeriodType>) => {
        setPeriod(event.target.value as PeriodType);
    };

    const handleDateChange = (date: Date | null) => {
        if (date) setSelectedDate(date);
    };

    const handleCategoryClick = (category: string) => {
        setShowCategoryDetail(category === showCategoryDetail ? null : category);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ maxWidth: 1100, margin: '0 auto', mt: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
                Spending Dashboard
            </Typography>

            <MuiGrid container spacing={3}>
                {/* Period selection and date picker */}
                <MuiGrid item xs={12}>
                    <Card sx={{ p: 2, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                            <FormControl sx={{ minWidth: 150 }}>
                                <InputLabel id="period-select-label">Time Period</InputLabel>
                                <Select
                                    labelId="period-select-label"
                                    value={period}
                                    label="Time Period"
                                    onChange={handlePeriodChange}
                                >
                                    <MenuItem value="weekly">Weekly</MenuItem>
                                    <MenuItem value="monthly">Monthly</MenuItem>
                                    <MenuItem value="yearly">Yearly</MenuItem>
                                </Select>
                            </FormControl>

                            <DatePicker
                                label={`Select ${period} date`}
                                value={selectedDate}
                                onChange={handleDateChange}
                                views={period === 'yearly' ? ['year'] : period === 'monthly' ? ['year', 'month'] : ['year', 'month', 'day']}
                            />
                        </Box>
                    </Card>
                </MuiGrid>

                {/* Budget Summary */}
                <MuiGrid item xs={12} md={6}>
                    <Card sx={{
                        height: '100%',
                        p: 3,
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Budget Status
                        </Typography>

                        <Box sx={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'space-between',
                            mb: 2
                        }}>
                            <Box>
                                <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                    ${budgetData.remaining}
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                    remaining from ${budgetData.totalBudget}
                                </Typography>
                            </Box>

                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: budgetData.remaining > 400 ? '#e6f4ea' : budgetData.remaining > 0 ? '#fff8e1' : '#fce8e6'
                            }}>
                                {budgetData.remaining > 400 ? (
                                    <TrendingUp color="#137333" size={20} style={{ marginRight: 8 }} />
                                ) : budgetData.remaining > 0 ? (
                                    <AlertCircle color="#f9a825" size={20} style={{ marginRight: 8 }} />
                                ) : (
                                    <AlertTriangle color="#c5221f" size={20} style={{ marginRight: 8 }} />
                                )}
                                <Typography variant="body2" sx={{
                                    fontWeight: 500,
                                    color: budgetData.remaining > 400 ? '#137333' : budgetData.remaining > 0 ? '#f9a825' : '#c5221f'
                                }}>
                                    {budgetData.remaining > 400 ? 'Well under budget' :
                                        budgetData.remaining > 0 ? 'Getting close to budget limit' :
                                            'Over budget'}
                                </Typography>
                            </Box>
                        </Box>

                        <LinearProgress
                            variant="determinate"
                            value={budgetData.percentUsed}
                            sx={{
                                height: 10,
                                borderRadius: 5,
                                mb: 1.5,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: budgetData.percentUsed > 90 ? '#c5221f' :
                                        budgetData.percentUsed > 75 ? '#f9a825' :
                                            theme.palette.primary.main,
                                    borderRadius: 5,
                                }
                            }}
                        />

                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                            {budgetData.percentUsed.toFixed(1)}% of budget used
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                                    ${budgetData.spent}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Spent
                                </Typography>
                            </Box>

                            <Box sx={{ borderLeft: `1px solid ${theme.palette.divider}`, height: '40px', mx: 2 }} />

                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#00C49F' }}>
                                    ${weeklyComparison[3].amount}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    This Week
                                </Typography>
                            </Box>

                            <Box sx={{ borderLeft: `1px solid ${theme.palette.divider}`, height: '40px', mx: 2 }} />

                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#FF8042' }}>
                                    ${Math.floor(budgetData.spent / 7).toFixed(0)}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Daily Avg
                                </Typography>
                            </Box>
                        </Box>
                    </Card>
                </MuiGrid>

                {/* Weekly Comparison */}
                <MuiGrid item xs={12} md={6}>
                    <Card sx={{ height: '100%', p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Weekly Comparison
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '85%', justifyContent: 'space-between' }}>
                            {weeklyComparison.map((week, index) => (
                                <Box key={week.label} sx={{ mb: index < weeklyComparison.length - 1 ? 2 : 0 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {week.label} ({week.dateRange})
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            ${week.amount}
                                        </Typography>
                                    </Box>

                                    <LinearProgress
                                        variant="determinate"
                                        value={(week.amount / budgetData.totalBudget) * 100}
                                        sx={{
                                            height: 10,
                                            borderRadius: 5,
                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: index === weeklyComparison.length - 1 ?
                                                    theme.palette.primary.main :
                                                    alpha(theme.palette.primary.main, 0.6 - (index * 0.15)),
                                                borderRadius: 5,
                                            }
                                        }}
                                    />

                                    {index < weeklyComparison.length - 1 && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto', mt: 0.5, width: 'fit-content' }}>
                                            {week.amount > weeklyComparison[index + 1].amount ? (
                                                <>
                                                    <ArrowUpRight size={16} color="#c5221f" />
                                                    <Typography variant="caption" sx={{ color: '#c5221f', fontWeight: 500, ml: 0.5 }}>
                                                        +${week.amount - weeklyComparison[index + 1].amount} from previous week
                                                    </Typography>
                                                </>
                                            ) : week.amount < weeklyComparison[index + 1].amount ? (
                                                <>
                                                    <ArrowDownRight size={16} color="#137333" />
                                                    <Typography variant="caption" sx={{ color: '#137333', fontWeight: 500, ml: 0.5 }}>
                                                        -${weeklyComparison[index + 1].amount - week.amount} from previous week
                                                    </Typography>
                                                </>
                                            ) : (
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                                    No change from previous week
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </Card>
                </MuiGrid>

                {/* Top Spending Categories */}
                <MuiGrid item xs={12}>
                    <Card sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                            Spending by Category
                        </Typography>

                        <MuiGrid container spacing={2}>
                            <MuiGrid item xs={12} md={7}>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Category</TableCell>
                                                <TableCell align="right">Amount</TableCell>
                                                <TableCell align="right">% of Total</TableCell>
                                                <TableCell align="right">Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {categorySpending.sort((a, b) => b.amount - a.amount).map((category) => (
                                                <TableRow
                                                    key={category.category}
                                                    sx={{
                                                        '&:last-child td, &:last-child th': { border: 0 },
                                                        bgcolor: showCategoryDetail === category.category ?
                                                            alpha(theme.palette.primary.light, 0.1) : 'transparent',
                                                    }}
                                                >
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Box
                                                                sx={{
                                                                    width: 12,
                                                                    height: 12,
                                                                    borderRadius: '50%',
                                                                    bgcolor: category.color,
                                                                    mr: 1.5
                                                                }}
                                                            />
                                                            {category.category}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            ${category.amount}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {category.percentage}%
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleCategoryClick(category.category)}
                                                        >
                                                            {showCategoryDetail === category.category ? (
                                                                <ChevronUp size={18} />
                                                            ) : (
                                                                <ChevronDown size={18} />
                                                            )}
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </MuiGrid>

                            <MuiGrid item xs={12} md={5}>
                                <Box sx={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categorySpending}
                                                dataKey="amount"
                                                nameKey="category"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                innerRadius={60}
                                                fill="#8884d8"
                                            >
                                                {categorySpending.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            </MuiGrid>

                            {/* Category Detail Section */}
                            {showCategoryDetail && (
                                <MuiGrid item xs={12}>
                                    <Box sx={{
                                        mt: 2,
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: alpha(theme.palette.primary.light, 0.1),
                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                                    }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                            {showCategoryDetail} Spending Breakdown
                                        </Typography>

                                        <MuiGrid container spacing={2}>
                                            <MuiGrid item xs={12} md={4}>
                                                <Box sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    bgcolor: theme.palette.background.paper,
                                                    height: '100%'
                                                }}>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                                                        Top Merchants
                                                    </Typography>

                                                    <List dense>
                                                        {[
                                                            { name: 'Merchant 1', amount: 45 },
                                                            { name: 'Merchant 2', amount: 32 },
                                                            { name: 'Merchant 3', amount: 27 }
                                                        ].map((merchant, i) => (
                                                            <ListItem key={i} sx={{ px: 0 }}>
                                                                <ListItemText
                                                                    primary={merchant.name}
                                                                    secondary={`$${merchant.amount}`}
                                                                />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </Box>
                                            </MuiGrid>

                                            <MuiGrid item xs={12} md={4}>
                                                <Box sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    bgcolor: theme.palette.background.paper,
                                                    height: '100%'
                                                }}>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                                                        Spending Trend
                                                    </Typography>

                                                    <Box sx={{ height: 100, mt: 2 }}>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <LineChart
                                                                data={[
                                                                    { day: 'Mon', amount: 15 },
                                                                    { day: 'Tue', amount: 10 },
                                                                    { day: 'Wed', amount: 18 },
                                                                    { day: 'Thu', amount: 8 },
                                                                    { day: 'Fri', amount: 22 },
                                                                    { day: 'Sat', amount: 30 },
                                                                    { day: 'Sun', amount: 12 }
                                                                ]}
                                                            >
                                                                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                                                                <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                                                                <Line
                                                                    type="monotone"
                                                                    dataKey="amount"
                                                                    stroke={categorySpending.find(c => c.category === showCategoryDetail)?.color || theme.palette.primary.main}
                                                                    strokeWidth={2}
                                                                    dot={{ r: 2 }}
                                                                />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </Box>
                                                </Box>
                                            </MuiGrid>

                                            <MuiGrid item xs={12} md={4}>
                                                <Box sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    bgcolor: theme.palette.background.paper,
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                }}>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                                                        Budget Status
                                                    </Typography>

                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                            ${categorySpending.find(c => c.category === showCategoryDetail)?.amount}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>
                                                            / $200
                                                        </Typography>
                                                    </Box>

                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={(categorySpending.find(c => c.category === showCategoryDetail)?.amount || 0) / 2}
                                                        sx={{
                                                            height: 8,
                                                            borderRadius: 4,
                                                            mb: 1,
                                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                            '& .MuiLinearProgress-bar': {
                                                                bgcolor: categorySpending.find(c => c.category === showCategoryDetail)?.color || theme.palette.primary.main,
                                                            }
                                                        }}
                                                    />

                                                    <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center' }}>
                                                        <Info size={16} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                            {categorySpending.find(c => c.category === showCategoryDetail)?.amount || 0 > 200 ?
                                                                'Over category budget by $' + ((categorySpending.find(c => c.category === showCategoryDetail)?.amount || 0) - 200) :
                                                                '$' + (200 - (categorySpending.find(c => c.category === showCategoryDetail)?.amount || 0)) + ' remaining'
                                                            }
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </MuiGrid>
                                        </MuiGrid>
                                    </Box>
                                </MuiGrid>
                            )}
                        </MuiGrid>
                    </Card>
                </MuiGrid>

                {/* Recent Transactions */}
                <MuiGrid item xs={12}>
                    <Card sx={{ p: 3, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Recent Transactions
                            </Typography>

                            <Button
                                variant="outlined"
                                size="small"
                                endIcon={<ChevronRight size={16} />}
                                sx={{ textTransform: 'none' }}
                            >
                                View All
                            </Button>
                        </Box>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Merchant</TableCell>
                                        <TableCell>Category</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell align="right">Amount</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {[
                                        {
                                            merchant: 'Grocery Store',
                                            category: 'Groceries',
                                            date: '2025-05-16',
                                            amount: 78.50
                                        },
                                        {
                                            merchant: 'Coffee Shop',
                                            category: 'Dining',
                                            date: '2025-05-16',
                                            amount: 4.33
                                        },
                                        {
                                            merchant: 'Fast Food',
                                            category: 'Dining',
                                            date: '2025-05-15',
                                            amount: 12.00
                                        },
                                        {
                                            merchant: 'Gas Station',
                                            category: 'Transportation',
                                            date: '2025-05-14',
                                            amount: 42.15
                                        },
                                        {
                                            merchant: 'Online Retailer',
                                            category: 'Shopping',
                                            date: '2025-05-13',
                                            amount: 65.99
                                        }
                                    ].map((transaction, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{transaction.merchant}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={transaction.category}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: alpha(CATEGORIES.find(c => c.name === transaction.category)?.color || '#000', 0.1),
                                                        color: CATEGORIES.find(c => c.name === transaction.category)?.color || '#000',
                                                        fontWeight: 500
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {new Date(transaction.date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    ${transaction.amount.toFixed(2)}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </MuiGrid>
            </MuiGrid>
        </Box>
        </LocalizationProvider>
    );
};

// const SpendingTracker: React.FC = () => {
//     const [period, setPeriod] = useState<PeriodType>('monthly');
//     const [chartType, setChartType] = useState<ChartType>('line');
//     const [spendingData, setSpendingData] = useState<SpendingData[]>(generateDummyData('monthly'));
//     const plaidService = PlaidService.getInstance();
//     const theme = useTheme();
//
//     const handlePeriodChange = (event: SelectChangeEvent<PeriodType>) => {
//         const newPeriod = event.target.value as PeriodType;
//         setPeriod(newPeriod);
//         setSpendingData(generateDummyData(newPeriod));
//     };
//
//     const handleChartTypeChange = (_event: React.MouseEvent<HTMLElement>, newChartType: ChartType | null) => {
//         if (newChartType) {
//             setChartType(newChartType);
//         }
//     };
//
//     const currentSpend = spendingData[spendingData.length - 1]?.amount || 0;
//     const firstPeriodSpend = spendingData[0]?.amount || 0;
//     const difference = currentSpend - firstPeriodSpend;
//
//     const handleSpentText = (period: PeriodType): string => {
//         switch (period) {
//             case 'monthly': return 'Current spend this month';
//             case 'biweekly': return 'Current spend this biweek';
//             case 'weekly': return 'Current spend this week';
//             case 'daily': return 'Current spend today';
//             default: return 'Current spend';
//         }
//     };
//
//     const totalSpend = spendingData.reduce((sum, item) => sum + item.amount, 0);
//
//     const renderChart = () => {
//         switch (chartType) {
//             case 'line':
//                 return (
//                     <LineChart data={spendingData}>
//                         <XAxis dataKey="date" tick={{ fill: theme.palette.text.secondary }} axisLine={{ stroke: theme.palette.divider }} />
//                         <YAxis tick={{ fill: theme.palette.text.secondary }} axisLine={{ stroke: theme.palette.divider }} />
//                         <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: '8px' }} />
//                         <Line
//                             type="monotone"
//                             dataKey="amount"
//                             stroke={theme.palette.primary.main}
//                             strokeWidth={3}
//                             dot={{ fill: theme.palette.primary.main, strokeWidth: 2 }}
//                             activeDot={{ r: 8 }}
//                         />
//                     </LineChart>
//                 );
//             case 'pie':
//                 return (
//                     <PieChart>
//                         <Pie
//                             data={spendingData}
//                             dataKey="amount"
//                             nameKey="category"
//                             cx="50%"
//                             cy="50%"
//                             outerRadius={100}
//                             fill="#8884d8"
//                             label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
//                         >
//                             {spendingData.map((_, index) => (
//                                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                             ))}
//                         </Pie>
//                         <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: '8px' }} />
//                     </PieChart>
//                 );
//             case 'bar':
//                 return (
//                     <BarChart data={spendingData}>
//                         <XAxis dataKey="date" tick={{ fill: theme.palette.text.secondary }} axisLine={{ stroke: theme.palette.divider }} />
//                         <YAxis tick={{ fill: theme.palette.text.secondary }} axisLine={{ stroke: theme.palette.divider }} />
//                         <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: '8px' }} />
//                         <Bar dataKey="amount" fill={theme.palette.primary.main} />
//                     </BarChart>
//                 );
//             default:
//                 // Fallback to LineChart instead of null
//                 return (
//                     <LineChart data={spendingData}>
//                         <XAxis dataKey="date" tick={{ fill: theme.palette.text.secondary }} axisLine={{ stroke: theme.palette.divider }} />
//                         <YAxis tick={{ fill: theme.palette.text.secondary }} axisLine={{ stroke: theme.palette.divider }} />
//                         <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: '8px' }} />
//                         <Line
//                             type="monotone"
//                             dataKey="amount"
//                             stroke={theme.palette.primary.main}
//                             strokeWidth={3}
//                             dot={{ fill: theme.palette.primary.main, strokeWidth: 2 }}
//                             activeDot={{ r: 8 }}
//                         />
//                     </LineChart>
//                 );
//         }
//     };
//
//     return (
//         <Card
//             sx={{
//                 maxWidth: 1050,
//                 margin: 'auto',
//                 mt: 4,
//                 borderRadius: '16px',
//                 boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
//                 overflow: 'hidden',
//             }}
//         >
//             <CardContent sx={{ p: 3 }}>
//                 <Box display="flex" flexDirection="column" mb={3}>
//                     <Box
//                         sx={{
//                             display: 'inline-flex',
//                             alignItems: 'center',
//                             bgcolor: difference < 0 ? '#e6f4ea' : '#fce8e6',
//                             color: difference < 0 ? '#137333' : '#c5221f',
//                             py: 0.5,
//                             px: 1.5,
//                             borderRadius: '16px',
//                             mb: 2,
//                             alignSelf: 'flex-start',
//                         }}
//                     >
//                         <CheckCircle size={16} style={{ marginRight: '8px' }} />
//                         <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                             {difference !== 0
//                                 ? `You've spent $${Math.abs(difference).toLocaleString()} ${difference < 0 ? 'less' : 'more'} than the first ${period}`
//                                 : `Spending matches the first ${period}`}
//                         </Typography>
//                     </Box>
//                     <Typography
//                         variant="h3"
//                         component="div"
//                         sx={{ fontWeight: 'bold', color: theme.palette.primary.main, mb: 0.5 }}
//                     >
//                         ${currentSpend.toLocaleString()}
//                     </Typography>
//                     <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary }}>
//                         {handleSpentText(period)}
//                     </Typography>
//                     {chartType === 'pie' && (
//                         <Typography variant="body2" sx={{ mt: 1, color: theme.palette.text.secondary }}>
//                             Total Spend: ${totalSpend.toLocaleString()}
//                         </Typography>
//                     )}
//                 </Box>
//
//                 <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
//                     <FormControl sx={{ minWidth: 120 }}>
//                         <InputLabel id="period-select-label">Period</InputLabel>
//                         <Select
//                             labelId="period-select-label"
//                             value={period}
//                             label="Period"
//                             onChange={handlePeriodChange}
//                             sx={{ borderRadius: '8px' }}
//                         >
//                             <MenuItem value="monthly">Monthly</MenuItem>
//                             <MenuItem value="biweekly">Biweekly</MenuItem>
//                             <MenuItem value="weekly">Weekly</MenuItem>
//                             <MenuItem value="daily">Daily</MenuItem>
//                         </Select>
//                     </FormControl>
//                     <ToggleButtonGroup
//                         value={chartType}
//                         exclusive
//                         onChange={handleChartTypeChange}
//                         aria-label="chart type"
//                         sx={{ bgcolor: theme.palette.grey[100], borderRadius: '8px' }}
//                     >
//                         <ToggleButton value="line" aria-label="line chart">Line</ToggleButton>
//                         <ToggleButton value="pie" aria-label="pie chart">Pie</ToggleButton>
//                         <ToggleButton value="bar" aria-label="bar chart">Bar</ToggleButton>
//                     </ToggleButtonGroup>
//                 </Box>
//
//                 <Box sx={{ height: 300 }}>
//                     <ResponsiveContainer width="100%" height="100%">
//                         {renderChart()}
//                     </ResponsiveContainer>
//                 </Box>
//             </CardContent>
//         </Card>
//     );
// };


export default SpendingTracker;