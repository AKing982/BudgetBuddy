import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Divider,
    Stack,
    alpha,
    useTheme,
    Card,
    LinearProgress,
    Chip
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import InsightsIcon from '@mui/icons-material/Insights';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { GroceryBudgetWithTotals } from "../config/Types";
import { parseISO, differenceInWeeks, addWeeks, endOfWeek, isWithinInterval, format } from 'date-fns';

const maroonColor = '#800000';
const tealColor = '#0d9488';

interface GroceryBudgetStatsPanelProps {
    budget: GroceryBudgetWithTotals | null;
}

const GroceryBudgetStatsPanel: React.FC<GroceryBudgetStatsPanelProps> = ({ budget }) => {
    const theme = useTheme();

    if (!budget) {
        return (
            <Paper sx={{
                height: '100%',
                borderRadius: 4,
                boxShadow: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                p: 4,
                background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
            }}>
                <InsightsIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
                <Typography variant="h6" color="text.secondary" fontWeight={500}>
                    Budget Insights
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mt: 1, textAlign: 'center' }}>
                    Statistics and comparisons will appear here
                </Typography>
            </Paper>
        );
    }

    // Calculate weekly data for comparisons
    const startDate = parseISO(budget.startDate);
    const endDate = parseISO(budget.endDate);
    const totalWeeks = Math.ceil(differenceInWeeks(endDate, startDate)) + 1;
    const weeklyBudget = budget.budgetAmount / totalWeeks;

    // Collect all items
    const allItems = budget.stores.flatMap(store =>
        store.items.map(item => ({ ...item, storeName: store.storeName }))
    );

    // Calculate spending per week
    const weeklySpending = [];
    for (let i = 0; i < totalWeeks; i++) {
        const weekStart = addWeeks(startDate, i);
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
        const actualWeekEnd = weekEnd > endDate ? endDate : weekEnd;

        const weekItems = allItems.filter(item => {
            const itemDate = parseISO(item.datePurchased);
            return isWithinInterval(itemDate, { start: weekStart, end: actualWeekEnd });
        });

        const spent = weekItems.reduce((sum, item) => sum + item.itemCost, 0);
        weeklySpending.push({
            week: i + 1,
            spent,
            budget: weeklyBudget,
            variance: weeklyBudget - spent,
            percentUsed: (spent / weeklyBudget) * 100
        });
    }

    // Calculate stats
    const avgWeeklySpending = weeklySpending.reduce((sum, w) => sum + w.spent, 0) / totalWeeks;
    const maxWeekSpending = Math.max(...weeklySpending.map(w => w.spent));
    const minWeekSpending = Math.min(...weeklySpending.filter(w => w.spent > 0).map(w => w.spent));
    const weeksOverBudget = weeklySpending.filter(w => w.spent > w.budget).length;
    const weeksUnderBudget = weeklySpending.filter(w => w.spent < w.budget).length;

    // Trend analysis
    const firstHalf = weeklySpending.slice(0, Math.floor(totalWeeks / 2));
    const secondHalf = weeklySpending.slice(Math.floor(totalWeeks / 2));
    const firstHalfAvg = firstHalf.reduce((sum, w) => sum + w.spent, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, w) => sum + w.spent, 0) / secondHalf.length;
    const trendDirection = secondHalfAvg > firstHalfAvg ? 'up' : 'down';
    const trendPercent = Math.abs(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100);

    const remaining = budget.budgetAmount - budget.totalSpent;
    const percentSpent = (budget.totalSpent / budget.budgetAmount) * 100;
    const onTrack = remaining >= budget.savingsGoal;

    const getProgressColor = (percent: number) => {
        if (percent < 70) return tealColor;
        if (percent < 90) return '#f59e0b';
        return '#dc2626';
    };

    return (
        <Paper sx={{
            height: '100%',
            borderRadius: 4,
            boxShadow: 3,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <Box sx={{
                background: `linear-gradient(135deg, ${maroonColor} 0%, #a00000 100%)`,
                color: 'white',
                p: 3
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <InsightsIcon />
                    <Typography variant="h6" fontWeight={600}>
                        Grocery Budget Insights
                    </Typography>
                </Box>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                </Typography>
            </Box>

            {/* Content */}
            <Box sx={{
                flex: 1,
                overflowY: 'auto',
                p: 3,
                '&::-webkit-scrollbar': {
                    width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                    backgroundColor: 'rgba(0,0,0,0.05)',
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: tealColor,
                    borderRadius: '4px',
                    '&:hover': {
                        backgroundColor: '#0f766e',
                    },
                },
            }}>
                {/* Overall Progress */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Overall Progress
                </Typography>

                <Card sx={{
                    p: 2.5,
                    mb: 3,
                    background: `linear-gradient(135deg, ${getProgressColor(percentSpent)}10 0%, ${getProgressColor(percentSpent)}05 100%)`,
                    border: `1px solid ${alpha(getProgressColor(percentSpent), 0.2)}`
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">
                            Total Spending
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color={maroonColor}>
                            {percentSpent.toFixed(0)}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(percentSpent, 100)}
                        sx={{
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: `${getProgressColor(percentSpent)}20`,
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: getProgressColor(percentSpent),
                                borderRadius: 5
                            }
                        }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            ${budget.totalSpent.toFixed(2)} spent
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            ${budget.budgetAmount.toFixed(2)} total
                        </Typography>
                    </Box>
                </Card>

                {/* Weekly Averages */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Weekly Analysis
                </Typography>

                <Stack spacing={2} sx={{ mb: 3 }}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        backgroundColor: alpha(tealColor, 0.05),
                        borderRadius: 2,
                        border: `1px solid ${alpha(tealColor, 0.2)}`
                    }}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Average per Week
                            </Typography>
                            <Typography variant="h6" fontWeight={600} color={maroonColor}>
                                ${avgWeeklySpending.toFixed(2)}
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" color="text.secondary">
                                Budget per Week
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                                ${weeklyBudget.toFixed(2)}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{
                        display: 'flex',
                        gap: 2
                    }}>
                        <Box sx={{
                            flex: 1,
                            p: 2,
                            backgroundColor: alpha('#059669', 0.05),
                            borderRadius: 2,
                            border: `1px solid ${alpha('#059669', 0.2)}`
                        }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Lowest Week
                            </Typography>
                            <Typography variant="h6" fontWeight={600} color="#059669">
                                ${minWeekSpending.toFixed(2)}
                            </Typography>
                        </Box>
                        <Box sx={{
                            flex: 1,
                            p: 2,
                            backgroundColor: alpha('#dc2626', 0.05),
                            borderRadius: 2,
                            border: `1px solid ${alpha('#dc2626', 0.2)}`
                        }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Highest Week
                            </Typography>
                            <Typography variant="h6" fontWeight={600} color="#dc2626">
                                ${maxWeekSpending.toFixed(2)}
                            </Typography>
                        </Box>
                    </Box>
                </Stack>

                {/* Spending Trend */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Spending Trend
                </Typography>

                <Card sx={{
                    p: 2.5,
                    mb: 3,
                    background: trendDirection === 'up'
                        ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, rgba(220, 38, 38, 0.02) 100%)'
                        : 'linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)',
                    border: `1px solid ${alpha(trendDirection === 'up' ? '#dc2626' : '#059669', 0.2)}`
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {trendDirection === 'up' ? (
                            <TrendingUpIcon sx={{ color: '#dc2626' }} />
                        ) : (
                            <TrendingDownIcon sx={{ color: '#059669' }} />
                        )}
                        <Typography variant="body1" fontWeight={600}>
                            {trendDirection === 'up' ? 'Increasing' : 'Decreasing'} Trend
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Spending is {trendDirection === 'up' ? 'up' : 'down'} by{' '}
                        <Typography component="span" fontWeight={600} color={trendDirection === 'up' ? '#dc2626' : '#059669'}>
                            {trendPercent.toFixed(1)}%
                        </Typography>
                        {' '}in recent weeks compared to earlier weeks
                    </Typography>
                </Card>

                {/* Week Performance */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Week Performance
                </Typography>

                <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
                    <Chip
                        icon={<TrendingDownIcon />}
                        label={`${weeksUnderBudget} Under Budget`}
                        sx={{
                            backgroundColor: alpha('#059669', 0.1),
                            color: '#059669',
                            fontWeight: 600,
                            border: `1px solid ${alpha('#059669', 0.3)}`
                        }}
                    />
                    <Chip
                        icon={<TrendingUpIcon />}
                        label={`${weeksOverBudget} Over Budget`}
                        sx={{
                            backgroundColor: alpha('#dc2626', 0.1),
                            color: '#dc2626',
                            fontWeight: 600,
                            border: `1px solid ${alpha('#dc2626', 0.3)}`
                        }}
                    />
                </Stack>

                <Divider sx={{ my: 3 }} />

                {/* Insights */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Key Insights
                </Typography>

                <Stack spacing={1.5}>
                    {onTrack && (
                        <Box sx={{
                            p: 2,
                            backgroundColor: alpha('#059669', 0.05),
                            borderRadius: 2,
                            borderLeft: `4px solid #059669`
                        }}>
                            <Typography variant="body2" fontWeight={500} color="#059669">
                                ✓ On track to meet savings goal
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                ${Math.abs(remaining).toFixed(2)} remaining should cover your ${budget.savingsGoal.toFixed(2)} savings target
                            </Typography>
                        </Box>
                    )}

                    {!onTrack && (
                        <Box sx={{
                            p: 2,
                            backgroundColor: alpha('#f59e0b', 0.05),
                            borderRadius: 2,
                            borderLeft: `4px solid #f59e0b`
                        }}>
                            <Typography variant="body2" fontWeight={500} color="#f59e0b">
                                ⚠ May not meet savings goal
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Need ${(budget.savingsGoal - remaining).toFixed(2)} more to reach your ${budget.savingsGoal.toFixed(2)} savings target
                            </Typography>
                        </Box>
                    )}

                    {avgWeeklySpending > weeklyBudget && (
                        <Box sx={{
                            p: 2,
                            backgroundColor: alpha('#dc2626', 0.05),
                            borderRadius: 2,
                            borderLeft: `4px solid #dc2626`
                        }}>
                            <Typography variant="body2" fontWeight={500} color="#dc2626">
                                Average exceeds weekly budget
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Averaging ${(avgWeeklySpending - weeklyBudget).toFixed(2)} over budget per week
                            </Typography>
                        </Box>
                    )}

                    {avgWeeklySpending <= weeklyBudget && (
                        <Box sx={{
                            p: 2,
                            backgroundColor: alpha('#059669', 0.05),
                            borderRadius: 2,
                            borderLeft: `4px solid #059669`
                        }}>
                            <Typography variant="body2" fontWeight={500} color="#059669">
                                Staying within weekly budget
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Averaging ${(weeklyBudget - avgWeeklySpending).toFixed(2)} under budget per week
                            </Typography>
                        </Box>
                    )}

                    {trendDirection === 'up' && trendPercent > 10 && (
                        <Box sx={{
                            p: 2,
                            backgroundColor: alpha('#f59e0b', 0.05),
                            borderRadius: 2,
                            borderLeft: `4px solid #f59e0b`
                        }}>
                            <Typography variant="body2" fontWeight={500} color="#f59e0b">
                                Spending increasing significantly
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Consider reviewing recent purchases to identify areas to cut back
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </Box>
        </Paper>
    );
};

export default GroceryBudgetStatsPanel;