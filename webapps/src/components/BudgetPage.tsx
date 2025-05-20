import { addMonths, format, subMonths } from 'date-fns';
import {
    Box,
    Button,
    Grid,
    Typography,
    Card,
    IconButton,
    useTheme,
    alpha,
    Container,
    Paper,
    Grow,
    Chip,
    Skeleton,
    Stack,
    LinearProgress
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    Download,
    Share2,
    PieChart,
    TrendingUp,
    Award,
    Download as DownloadIcon
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from './Sidebar';
import BudgetOverview from './BudgetOverview';
import TopExpenseCategory from './TopExpenseCategory';
import BudgetPeriodTable from './BudgetPeriodTable';
import BudgetSummary from "./BudgetSummary";
import BudgetProgressSummary from "./BudgetProgressSummary";
import BudgetRunnerService, { BudgetRunnerResult } from "../services/BudgetRunnerService";
import {
    BudgetPeriodCategory,
    BudgetStats,
    DateRangeInput,
    InputStats,
    ProcessedStats
} from "../utils/Items";
import DateRange from "../domain/DateRange";

interface DateArrays {
    startDate: [number, number, number];
    endDate: [number, number, number];
}

// Define gradients for modern UI elements
const gradients = {
    blue: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    green: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    purple: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
    orange: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
    indigo: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
};


const BudgetPage: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [budgetType, setBudgetType] = useState('50/30/20');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [animateIn, setAnimateIn] = useState(false);
    const budgetRunnerService = BudgetRunnerService.getInstance();
    const [budgetData, setBudgetData] = useState<BudgetRunnerResult[]>([]);
    const userId = Number(sessionStorage.getItem('userId'));
    const theme = useTheme();

    const handlePreviousMonth = () => {
        setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
    };

    useEffect(() => {
        document.title = 'Budget Dashboard';
        // Trigger animation after component mounts
        setTimeout(() => setAnimateIn(true), 100);

        return () => {
            document.title = "BudgetBuddy";
        };
    }, []);

    const fetchBudgetData = async (date: Date) => {
        try {
            setIsLoading(true);
            setError(null);

            // Get first and last day of the month
            const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
            const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const results = await budgetRunnerService.getBudgetsByDateRange(
                userId,
                startDate,
                endDate
            );

            setBudgetData(results);
        } catch (err) {
            setError('Failed to fetch budget data. Please try again later.');
            console.error('Error fetching budget data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgetData(currentMonth);
    }, [currentMonth, userId]);

    const defaultBudgetStats: BudgetStats = {
        averageSpendingPerDay: 0,
        budgetId: 0,
        dateRange: new DateRange(new Date(), new Date()),
        healthScore: 0,
        monthlyProjection: null,
        remaining: 0,
        totalBudget: 0,
        totalSaved: 0,
        totalSpent: 0
    };

    const budgetStats = useMemo(() => {
        if (!budgetData?.length) {
            return defaultBudgetStats;
        }

        const stats = budgetData[0]?.budgetStats[0];
        if (!stats) return defaultBudgetStats;

        // Just tell TypeScript these are number arrays
        const startDate = (stats.dateRange.startDate as unknown) as number[];
        const endDate = (stats.dateRange.endDate as unknown) as number[];

        return {
            averageSpendingPerDay: stats.averageSpendingPerDay ?? 0,
            budgetId: stats.budgetId,
            dateRange: new DateRange(
                new Date(startDate[0], startDate[1] - 1, startDate[2]),
                new Date(endDate[0], endDate[1] - 1, endDate[2])
            ),
            healthScore: stats.healthScore ?? 0,
            monthlyProjection: stats.monthlyProjection,
            remaining: stats.remaining,
            totalBudget: stats.totalBudget,
            totalSaved: stats.totalSaved,
            totalSpent: stats.totalSpent
        };
    }, [budgetData]);

    // Calculate additional metrics for display
    const metrics = useMemo(() => {
        const today = new Date();
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const currentDate = today.getDate();

        // Calculate days elapsed and days remaining
        let daysElapsed = currentDate;
        let daysRemaining = daysInMonth - currentDate;

        // If we're viewing a month in the past, all days have elapsed
        if (currentMonth.getMonth() < today.getMonth() || currentMonth.getFullYear() < today.getFullYear()) {
            daysElapsed = daysInMonth;
            daysRemaining = 0;
        }

        // If we're viewing a month in the future, no days have elapsed
        if (currentMonth.getMonth() > today.getMonth() || currentMonth.getFullYear() > today.getFullYear()) {
            daysElapsed = 0;
            daysRemaining = daysInMonth;
        }

        const percentElapsed = (daysElapsed / daysInMonth) * 100;

        // Calculate spending rate metrics
        const idealSpendRate = budgetStats.totalBudget / daysInMonth;
        const actualSpendRate = budgetStats.totalSpent / (daysElapsed || 1); // Avoid division by zero
        const dailyBudget = budgetStats.remaining / (daysRemaining || 1);

        // Calculate if over or under budget based on elapsed time
        const idealSpentSoFar = budgetStats.totalBudget * (percentElapsed / 100);
        const spendingDifference = idealSpentSoFar - budgetStats.totalSpent;
        const isUnderBudget = spendingDifference > 0;

        return {
            daysElapsed,
            daysRemaining,
            percentElapsed,
            idealSpendRate,
            actualSpendRate,
            dailyBudget,
            isUnderBudget,
            spendingDifference: Math.abs(spendingDifference)
        };
    }, [currentMonth, budgetStats]);

    const topExpenseCategories = useMemo(() => {
        if (!budgetData?.length) return [];

        // Flatten topExpenseCategories from all budget results
        return budgetData.reduce<any[]>((acc, budget) => {
            const stats = budget.budgetCategoryStats;
            if (!stats || !stats.topExpenseCategories) {
                return acc;
            }

            // Map the top expenses to match the component's expected structure
            const mappedExpenses = stats.topExpenseCategories.map(expense => ({
                categoryName: expense.category,
                budgetedAmount: expense.budgetedExpenses,
                actualAmount: expense.actualExpenses,
                remainingAmount: expense.remainingExpenses,
                startDate: expense.startDate,
                endDate: expense.endDate,
                isActive: expense.active
            }));

            return [...acc, ...mappedExpenses];
        }, []);
    }, [budgetData]);

    return (
        <Box sx={{
            maxWidth: 'calc(100% - 240px)',
            ml: '240px',
            minHeight: '100vh',
            background: '#f9fafc',
            backgroundImage: 'radial-gradient(rgba(0, 0, 120, 0.01) 2px, transparent 2px)',
            backgroundSize: '40px 40px'
        }}>
            <Sidebar />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Header with title and month navigation */}
                <Grow in={animateIn} timeout={600}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 4,
                        flexDirection: { xs: 'column', sm: 'row' },
                        textAlign: { xs: 'center', sm: 'left' },
                        gap: 2
                    }}>
                        <Box>
                            <Typography variant="h4" component="h1" sx={{
                                fontWeight: 800,
                                color: theme.palette.text.primary,
                                letterSpacing: '-0.025em'
                            }}>
                                {format(currentMonth, 'MMMM yyyy')} Budget
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                                Track your progress and stay within your spending limits
                            </Typography>
                        </Box>

                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <IconButton
                                onClick={handlePreviousMonth}
                                disabled={isLoading}
                                sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                                    }
                                }}
                            >
                                <ChevronLeft />
                            </IconButton>

                            <Card sx={{
                                px: 2.5,
                                py: 1,
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: 2,
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                            }}>
                                <Calendar size={18} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {format(currentMonth, 'MMMM yyyy')}
                                </Typography>
                            </Card>

                            <IconButton
                                onClick={handleNextMonth}
                                disabled={isLoading}
                                sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                                    }
                                }}
                            >
                                <ChevronRight />
                            </IconButton>

                            <Button
                                variant="outlined"
                                startIcon={<DownloadIcon size={18} />}
                                sx={{
                                    ml: 1,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderColor: alpha(theme.palette.divider, 0.8),
                                    color: theme.palette.text.primary,
                                    '&:hover': {
                                        borderColor: theme.palette.primary.main,
                                        backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                    }
                                }}
                            >
                                Export
                            </Button>
                        </Box>
                    </Box>
                </Grow>

                {/* Error Message */}
                {error && (
                    <Grow in={true} timeout={800}>
                        <Paper sx={{
                            mb: 4,
                            p: 3,
                            bgcolor: alpha(theme.palette.error.main, 0.1),
                            color: theme.palette.error.main,
                            borderRadius: 3,
                            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    bgcolor: alpha(theme.palette.error.main, 0.2),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 2
                                }}
                            >
                                <Award size={24} color={theme.palette.error.main} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Error Loading Budget Data
                                </Typography>
                                <Typography variant="body2">
                                    {error}
                                </Typography>
                            </Box>
                        </Paper>
                    </Grow>
                )}

                {/* Budget Summary Stats */}
                <Grow in={animateIn} timeout={800}>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {/* Total Budget */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{
                                p: 3,
                                borderRadius: 4,
                                height: '100%',
                                background: gradients.blue,
                                color: 'white',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                                position: 'relative',
                                overflow: 'hidden',
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    width: '50%',
                                    height: '100%',
                                    backgroundImage: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1))',
                                    transform: 'skewX(-20deg) translateX(10%)',
                                }
                            }}>
                                <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>
                                    Total Budget
                                </Typography>
                                {isLoading ? (
                                    <Skeleton variant="text" width="80%" height={48} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
                                ) : (
                                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        ${budgetStats.totalBudget.toLocaleString()}
                                    </Typography>
                                )}
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                    for {format(currentMonth, 'MMMM yyyy')}
                                </Typography>
                            </Card>
                        </Grid>

                        {/* Remaining Budget */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{
                                p: 3,
                                borderRadius: 4,
                                height: '100%',
                                background: gradients.green,
                                color: 'white',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                                position: 'relative',
                                overflow: 'hidden',
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    width: '50%',
                                    height: '100%',
                                    backgroundImage: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1))',
                                    transform: 'skewX(-20deg) translateX(10%)',
                                }
                            }}>
                                <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>
                                    Remaining
                                </Typography>
                                {isLoading ? (
                                    <Skeleton variant="text" width="80%" height={48} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
                                ) : (
                                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        ${budgetStats.remaining.toLocaleString()}
                                    </Typography>
                                )}
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                        {metrics.daysRemaining} days left
                                    </Typography>
                                    <Chip
                                        label={`$${Math.round(metrics.dailyBudget)}/day`}
                                        size="small"
                                        sx={{
                                            ml: 1,
                                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                                            color: 'white',
                                            fontWeight: 600,
                                            height: 20,
                                            fontSize: '0.7rem'
                                        }}
                                    />
                                </Box>
                            </Card>
                        </Grid>

                        {/* Total Spent */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{
                                p: 3,
                                borderRadius: 4,
                                height: '100%',
                                background: gradients.purple,
                                color: 'white',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                                position: 'relative',
                                overflow: 'hidden',
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    width: '50%',
                                    height: '100%',
                                    backgroundImage: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1))',
                                    transform: 'skewX(-20deg) translateX(10%)',
                                }
                            }}>
                                <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>
                                    Total Spent
                                </Typography>
                                {isLoading ? (
                                    <Skeleton variant="text" width="80%" height={48} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
                                ) : (
                                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        ${budgetStats.totalSpent.toLocaleString()}
                                    </Typography>
                                )}
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                        Avg. ${Math.round(metrics.actualSpendRate)}/day
                                    </Typography>
                                    {metrics.isUnderBudget ? (
                                        <Chip
                                            label="Under budget"
                                            size="small"
                                            sx={{
                                                ml: 1,
                                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                fontWeight: 600,
                                                height: 20,
                                                fontSize: '0.7rem'
                                            }}
                                        />
                                    ) : (
                                        <Chip
                                            label="Over budget"
                                            size="small"
                                            sx={{
                                                ml: 1,
                                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                fontWeight: 600,
                                                height: 20,
                                                fontSize: '0.7rem'
                                            }}
                                        />
                                    )}
                                </Box>
                            </Card>
                        </Grid>

                        {/* Budget Health */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{
                                p: 3,
                                borderRadius: 4,
                                height: '100%',
                                background: gradients.orange,
                                color: 'white',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                                position: 'relative',
                                overflow: 'hidden',
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    width: '50%',
                                    height: '100%',
                                    backgroundImage: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1))',
                                    transform: 'skewX(-20deg) translateX(10%)',
                                }
                            }}>
                                <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>
                                    Budget Health
                                </Typography>
                                {isLoading ? (
                                    <Skeleton variant="text" width="80%" height={48} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
                                ) : (
                                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        {budgetStats.healthScore}/100
                                    </Typography>
                                )}
                                <Box sx={{ mt: 1 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={budgetStats.healthScore}
                                        sx={{
                                            height: 6,
                                            borderRadius: 3,
                                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: 'white',
                                                borderRadius: 3
                                            }
                                        }}
                                    />
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                </Grow>

                {/* Main Content */}
                <Grid container spacing={4}>
                    {/* Left Column */}
                    <Grid item xs={12} md={8}>
                        <Stack spacing={4}>
                            {/* Budget Overview */}
                            <Grow in={animateIn} timeout={900}>
                                <Card sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                                }}>
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 2
                                    }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            Budget Overview
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<PieChart size={16} />}
                                                sx={{
                                                    borderRadius: 2,
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                    fontSize: '0.75rem',
                                                    borderColor: alpha(theme.palette.divider, 0.8),
                                                    color: theme.palette.text.primary,
                                                    '&:hover': {
                                                        borderColor: theme.palette.primary.main,
                                                        backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                                    }
                                                }}
                                            >
                                                View as Chart
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<Share2 size={16} />}
                                                sx={{
                                                    borderRadius: 2,
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                    fontSize: '0.75rem',
                                                    borderColor: alpha(theme.palette.divider, 0.8),
                                                    color: theme.palette.text.primary,
                                                    '&:hover': {
                                                        borderColor: theme.palette.primary.main,
                                                        backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                                    }
                                                }}
                                            >
                                                Share
                                            </Button>
                                        </Box>
                                    </Box>

                                    {/* Budget Completion Progress */}
                                    <Box sx={{ mb: 3 }}>
                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mb: 1
                                        }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Monthly Budget Progress
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {Math.round(budgetStats.totalSpent / budgetStats.totalBudget * 100)}% used
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={Math.min(budgetStats.totalSpent / budgetStats.totalBudget * 100, 100)}
                                            sx={{
                                                height: 8,
                                                borderRadius: 3,
                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                '& .MuiLinearProgress-bar': {
                                                    bgcolor: budgetStats.totalSpent / budgetStats.totalBudget > 1
                                                        ? theme.palette.error.main
                                                        : theme.palette.primary.main,
                                                    borderRadius: 3
                                                }
                                            }}
                                        />
                                    </Box>

                                    {/* Time Elapsed Progress */}
                                    <Box>
                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mb: 1
                                        }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Month Progress
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {Math.round(metrics.percentElapsed)}% elapsed
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={metrics.percentElapsed}
                                            sx={{
                                                height: 8,
                                                borderRadius: 3,
                                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                                '& .MuiLinearProgress-bar': {
                                                    bgcolor: theme.palette.warning.main,
                                                    borderRadius: 3
                                                }
                                            }}
                                        />
                                    </Box>

                                    <BudgetOverview isLoading={isLoading} data={budgetData} />
                                </Card>
                            </Grow>

                            {/* Top Expense Categories */}
                            <Grow in={animateIn} timeout={1000}>
                                <Card sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                                }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                                        Top Spending Categories
                                    </Typography>
                                    <TopExpenseCategory isLoading={isLoading} categories={topExpenseCategories} />
                                </Card>
                            </Grow>

                            {/* Budget Period Table */}
                            <Grow in={animateIn} timeout={1100}>
                                <Card sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                                }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                                        Budget Breakdown
                                    </Typography>
                                    <BudgetPeriodTable isLoading={isLoading} data={budgetData} />
                                </Card>
                            </Grow>
                        </Stack>
                    </Grid>

                    {/* Right Column */}
                    <Grid item xs={12} md={4}>
                        <Stack spacing={4}>
                            {/* Budget Summary */}
                            <Grow in={animateIn} timeout={1200}>
                                <Card sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                                }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                                        Budget Summary
                                    </Typography>
                                    <BudgetSummary
                                        isLoading={isLoading}
                                        budgetStats={budgetStats}
                                    />
                                </Card>
                            </Grow>

                            {/* Budget Progress */}
                            <Grow in={animateIn} timeout={1300}>
                                <Card sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                                }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                                        Daily Budget Tracking
                                    </Typography>

                                    {isLoading ? (
                                        <Stack spacing={2}>
                                            <Skeleton variant="rectangular" height={20} width="60%" />
                                            <Skeleton variant="rectangular" height={100} />
                                            <Skeleton variant="rectangular" height={20} width="40%" />
                                            <Skeleton variant="rectangular" height={20} width="80%" />
                                        </Stack>
                                    ) : (
                                        <>
                                            <Box sx={{ mb: 3 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Ideal Daily Spending
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        ${Math.round(metrics.idealSpendRate)}/day
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Actual Daily Spending
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={600}
                                                        color={metrics.actualSpendRate > metrics.idealSpendRate ? 'error.main' : 'success.main'}
                                                    >
                                                        ${Math.round(metrics.actualSpendRate)}/day
                                                    </Typography>
                                                </Box>

                                                <Box
                                                    sx={{
                                                        mt: 2,
                                                        p: 2,
                                                        borderRadius: 2,
                                                        bgcolor: metrics.isUnderBudget
                                                            ? alpha(theme.palette.success.main, 0.1)
                                                            : alpha(theme.palette.error.main, 0.1),
                                                        border: `1px solid ${metrics.isUnderBudget
                                                            ? alpha(theme.palette.success.main, 0.2)
                                                            : alpha(theme.palette.error.main, 0.2)}`
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        {metrics.isUnderBudget ? (
                                                            <TrendingUp
                                                                size={20}
                                                                color={theme.palette.success.main}
                                                                style={{ marginRight: 8 }}
                                                            />
                                                        ) : (
                                                            <TrendingUp
                                                                size={20}
                                                                color={theme.palette.error.main}
                                                                style={{ marginRight: 8, transform: 'rotate(180deg)' }}
                                                            />
                                                        )}
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={600}
                                                            color={metrics.isUnderBudget
                                                                ? theme.palette.success.main
                                                                : theme.palette.error.main}
                                                        >
                                                            {metrics.isUnderBudget
                                                                ? `$${Math.round(metrics.spendingDifference)} under budget`
                                                                : `$${Math.round(metrics.spendingDifference)} over budget`}
                                                        </Typography>
                                                    </Box>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            mt: 1,
                                                            display: 'block',
                                                            color: metrics.isUnderBudget
                                                                ? alpha(theme.palette.success.main, 0.8)
                                                                : alpha(theme.palette.error.main, 0.8)
                                                        }}
                                                    >
                                                        {metrics.isUnderBudget
                                                            ? `Based on the ${metrics.percentElapsed.toFixed(0)}% of the month that has passed, you're doing great!`
                                                            : `Based on the ${metrics.percentElapsed.toFixed(0)}% of the month that has passed, you're spending too quickly.`}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <BudgetProgressSummary />

                                            <Box sx={{ mt: 3 }}>
                                                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                                                    What You Can Spend
                                                </Typography>
                                                <Stack spacing={1}>
                                                    <Box sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        bgcolor: alpha(theme.palette.primary.main, 0.05)
                                                    }}>
                                                        <Typography variant="body2">Today</Typography>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            ${Math.round(metrics.dailyBudget)}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        bgcolor: alpha(theme.palette.primary.main, 0.05)
                                                    }}>
                                                        <Typography variant="body2">This week</Typography>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            ${Math.round(metrics.dailyBudget * Math.min(7, metrics.daysRemaining))}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        bgcolor: alpha(theme.palette.primary.main, 0.05)
                                                    }}>
                                                        <Typography variant="body2">Rest of the month</Typography>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            ${Math.round(budgetStats.remaining)}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </Box>
                                        </>
                                    )}
                                </Card>
                            </Grow>

                            {/* Monthly Insights */}
                            <Grow in={animateIn} timeout={1400}>
                                <Card sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                                    background: gradients.indigo,
                                    color: 'white'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '50%',
                                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mr: 2
                                            }}
                                        >
                                            <Award size={24} color="white" />
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            Budget Insights
                                        </Typography>
                                    </Box>

                                    {isLoading ? (
                                        <Stack spacing={2}>
                                            <Skeleton variant="rectangular" height={20} width="80%" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                                            <Skeleton variant="rectangular" height={20} width="60%" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                                            <Skeleton variant="rectangular" height={20} width="70%" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                                        </Stack>
                                    ) : (
                                        <Stack spacing={2}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: '50%',
                                                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mr: 1.5,
                                                        mt: 0.5,
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <Typography variant="caption" fontWeight={700}>1</Typography>
                                                </Box>
                                                <Typography variant="body2">
                                                    {metrics.isUnderBudget
                                                        ? `You're under budget by $${Math.round(metrics.spendingDifference)}. Keep up the good work!`
                                                        : `You're over budget by $${Math.round(metrics.spendingDifference)}. Try to reduce spending in the coming days.`}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: '50%',
                                                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mr: 1.5,
                                                        mt: 0.5,
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <Typography variant="caption" fontWeight={700}>2</Typography>
                                                </Box>
                                                <Typography variant="body2">
                                                    Your daily spending limit for the rest of the month is ${Math.round(metrics.dailyBudget)}.
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: '50%',
                                                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mr: 1.5,
                                                        mt: 0.5,
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <Typography variant="caption" fontWeight={700}>3</Typography>
                                                </Box>
                                                <Typography variant="body2">
                                                    {budgetStats.healthScore > 70
                                                        ? `Your budget health score is ${budgetStats.healthScore}/100, which is excellent!`
                                                        : budgetStats.healthScore > 50
                                                            ? `Your budget health score is ${budgetStats.healthScore}/100, which is good but could be improved.`
                                                            : `Your budget health score is ${budgetStats.healthScore}/100, which needs attention.`}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    )}

                                    <Button
                                        variant="contained"
                                        fullWidth
                                        sx={{
                                            mt: 3,
                                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                                            color: 'white',
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            borderRadius: 2,
                                            '&:hover': {
                                                bgcolor: 'rgba(255, 255, 255, 0.3)',
                                            }
                                        }}
                                    >
                                        View Detailed Analysis
                                    </Button>
                                </Card>
                            </Grow>
                        </Stack>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};


// const BudgetPage: React.FC = () => {
//     const [currentMonth, setCurrentMonth] = useState(new Date());
//     const [budgetType, setBudgetType] = useState('50/30/20');
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const budgetRunnerService = BudgetRunnerService.getInstance();
//     const [budgetData, setBudgetData] = useState<BudgetRunnerResult[]>([]);
//     const userId = Number(sessionStorage.getItem('userId'));
//
//     const handlePreviousMonth = () => {
//         setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
//     };
//
//     const handleNextMonth = () => {
//         setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
//     };
//
//     useEffect(() => {
//         document.title = 'Budgets';
//         // Optional: Return a cleanup function to reset the title when component unmounts
//         return () => {
//             document.title = "Budgets";
//         };
//     }, []);
//
//     const fetchBudgetData = async (date: Date) => {
//         try {
//             setIsLoading(true);
//             setError(null);
//
//             // Get first and last day of the month
//             const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
//             const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
//
//             const results = await budgetRunnerService.getBudgetsByDateRange(
//                 userId,
//                 startDate,
//                 endDate
//             );
//
//             setBudgetData(results);
//             console.log('Budget Data: ', results);
//         } catch (err) {
//             setError('Failed to fetch budget data. Please try again later.');
//             console.error('Error fetching budget data:', err);
//         } finally {
//             setIsLoading(false);
//         }
//     };
//
//
//     useEffect(() => {
//         fetchBudgetData(currentMonth);
//     }, [currentMonth, userId]);
//
//
//     const defaultBudgetStats: BudgetStats = {
//         averageSpendingPerDay: 0,
//         budgetId: 0,
//         dateRange: new DateRange(new Date(), new Date()),
//         healthScore: 0,
//         monthlyProjection: null,
//         remaining: 0,
//         totalBudget: 0,
//         totalSaved: 0,
//         totalSpent: 0
//     };
//
//
//     const budgetStats = useMemo(() => {
//         if (!budgetData?.length) {
//             return {
//                 averageSpendingPerDay: 0,
//                 budgetId: 0,
//                 dateRange: new DateRange(new Date(), new Date()),
//                 healthScore: 0,
//                 monthlyProjection: null,
//                 remaining: 0,
//                 totalBudget: 0,
//                 totalSaved: 0,
//                 totalSpent: 0
//             };
//         }
//
//         const stats = budgetData[0]?.budgetStats[0];
//         if (!stats) return defaultBudgetStats;
//
//         // Just tell TypeScript these are number arrays
//         const startDate = (stats.dateRange.startDate as unknown) as number[];
//         const endDate = (stats.dateRange.endDate as unknown) as number[];
//
//
//         return {
//             averageSpendingPerDay: stats.averageSpendingPerDay ?? 0,
//             budgetId: stats.budgetId,
//             dateRange: new DateRange(
//                 new Date(startDate[0], startDate[1] - 1, startDate[2]),
//                 new Date(endDate[0], endDate[1] - 1, endDate[2])
//             ),
//             healthScore: stats.healthScore ?? 0,
//             monthlyProjection: stats.monthlyProjection,
//             remaining: stats.remaining,
//             totalBudget: stats.totalBudget,
//             totalSaved: stats.totalSaved,
//             totalSpent: stats.totalSpent
//         };
//     }, [budgetData]);
//
//     const handleBudgetTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
//         setBudgetType(event.target.value as string);
//     };
//
//     const handleAddBudget = (newBudget: any) => {
//         // Implement the logic to add a new budget
//         console.log('Add new budget');
//     };
//
//     const topExpenseCategories = useMemo(() => {
//         if (!budgetData?.length) return [];
//
//         // Flatten topExpenseCategories from all budget results
//         return budgetData.reduce<any[]>((acc, budget) => {
//             const stats = budget.budgetCategoryStats;
//             if (!stats || !stats.topExpenseCategories) {
//                 return acc;
//             }
//
//             // Map the top expenses to match the component's expected structure
//             const mappedExpenses = stats.topExpenseCategories.map(expense => ({
//                 categoryName: expense.category,
//                 budgetedAmount: expense.budgetedExpenses,
//                 actualAmount: expense.actualExpenses,
//                 remainingAmount: expense.remainingExpenses,
//                 startDate: expense.startDate,
//                 endDate: expense.endDate,
//                 isActive: expense.active
//             }));
//
//             return [...acc, ...mappedExpenses];
//         }, []);
//     }, [budgetData]);
//
//     return (
//         <Box sx={{ p: 3, maxWidth: 937, margin: 'auto' }}>
//             <Sidebar />
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
//                 <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
//                     {format(currentMonth, 'MMMM yyyy')} Budget
//                 </Typography>
//                 <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                     <Button
//                         startIcon={<ChevronLeft />}
//                         onClick={handlePreviousMonth}
//                         sx={{ mr: 1 }}
//                         disabled={isLoading}
//                     >
//                         {format(subMonths(currentMonth, 1), 'MMM. yyyy')}
//                     </Button>
//                     <Button
//                         endIcon={<ChevronRight />}
//                         onClick={handleNextMonth}
//                         disabled={isLoading}
//                     >
//                         {format(addMonths(currentMonth, 1), 'MMM. yyyy')}
//                     </Button>
//                 </Box>
//             </Box>
//             {error && (
//                 <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
//                     {error}
//                 </Box>
//             )}
//
//             <Grid container spacing={4}>
//                 <Grid item xs={12} md={8}>
//                     <Box sx={{ mb: 4 }}>
//                         <BudgetOverview isLoading={isLoading} data={budgetData}/>
//                     </Box>
//
//                     <Box sx={{ mb: 4 }}>
//                         <TopExpenseCategory isLoading={isLoading} categories={topExpenseCategories}/>
//                     </Box>
//
//                     <Box>
//                         <BudgetPeriodTable isLoading={isLoading} data={budgetData} />
//                     </Box>
//                 </Grid>
//                 <Grid item xs={12} md={4}>
//                     <Box sx={{mb: 4}}>
//                         <BudgetSummary
//                            isLoading={isLoading}
//                            budgetStats={budgetStats}
//                         />
//                     </Box>
//                    <Box>
//                        <BudgetProgressSummary />
//                    </Box>
//                 </Grid>
//             </Grid>
//         </Box>
//     );
// }

export default BudgetPage;