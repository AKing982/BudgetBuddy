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
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { format } from 'date-fns';

const maroonColor = '#800000';
const tealColor = '#0d9488';

interface BudgetGoalsStatsPanelProps {
    monthlyGoal: number;
    currentSavings: number;
    totalBudget: number;
    totalSpent: number;
    daysElapsed: number;
    daysRemaining: number;
    monthStartDate: Date;
    monthEndDate: Date;
}

const BudgetGoalsStatsPanel: React.FC<BudgetGoalsStatsPanelProps> = ({
                                                                         monthlyGoal,
                                                                         currentSavings,
                                                                         totalBudget,
                                                                         totalSpent,
                                                                         daysElapsed,
                                                                         daysRemaining,
                                                                         monthStartDate,
                                                                         monthEndDate
                                                                     }) => {
    const theme = useTheme();

    const totalDays = daysElapsed + daysRemaining;
    const goalProgress = (currentSavings / monthlyGoal) * 100;
    const projectedSavings = (currentSavings / daysElapsed) * totalDays;
    const onTrack = projectedSavings >= monthlyGoal;
    const dailyBudget = totalBudget / totalDays;
    const actualDailySpending = totalSpent / daysElapsed;
    const projectedEndOfMonthSpend = actualDailySpending * totalDays;
    const projectedRemaining = totalBudget - projectedEndOfMonthSpend;

    const getProgressColor = (percent: number) => {
        if (percent < 70) return '#dc2626'; // Red - not enough progress
        if (percent < 90) return '#f59e0b'; // Orange - close
        return tealColor; // Teal - on track or exceeding
    };

    const goalColor = getProgressColor(goalProgress);

    return (
        <Paper sx={{
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
                    <EmojiEventsIcon />
                    <Typography variant="h6" fontWeight={600}>
                        Monthly Budget Goals
                    </Typography>
                </Box>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {format(monthStartDate, 'MMM d')} - {format(monthEndDate, 'MMM d, yyyy')}
                </Typography>
            </Box>

            {/* Content */}
            <Box sx={{ p: 3 }}>
                {/* Savings Goal Progress */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Savings Goal Progress
                </Typography>

                <Card sx={{
                    p: 2.5,
                    mb: 3,
                    background: `linear-gradient(135deg, ${alpha(goalColor, 0.1)} 0%, ${alpha(goalColor, 0.05)} 100%)`,
                    border: `1px solid ${alpha(goalColor, 0.2)}`
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Current Savings
                            </Typography>
                            <Typography variant="h4" fontWeight={700} color={maroonColor}>
                                ${currentSavings.toFixed(2)}
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" color="text.secondary">
                                Monthly Goal
                            </Typography>
                            <Typography variant="h5" fontWeight={600}>
                                ${monthlyGoal.toFixed(2)}
                            </Typography>
                        </Box>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(goalProgress, 100)}
                        sx={{
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: `${goalColor}20`,
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: goalColor,
                                borderRadius: 5
                            }
                        }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption" fontWeight={600} color={goalColor}>
                            {goalProgress.toFixed(0)}% Complete
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            ${(monthlyGoal - currentSavings).toFixed(2)} to go
                        </Typography>
                    </Box>
                </Card>

                {/* Time Progress */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Month Progress
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
                                Days Elapsed
                            </Typography>
                            <Typography variant="h6" fontWeight={600} color={maroonColor}>
                                {daysElapsed}
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                                Progress
                            </Typography>
                            <Typography variant="h6" fontWeight={600}>
                                {((daysElapsed / totalDays) * 100).toFixed(0)}%
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" color="text.secondary">
                                Days Remaining
                            </Typography>
                            <Typography variant="h6" fontWeight={600} color={maroonColor}>
                                {daysRemaining}
                            </Typography>
                        </Box>
                    </Box>
                </Stack>

                {/* Spending Analysis */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Spending Analysis
                </Typography>

                <Stack spacing={2} sx={{ mb: 3 }}>
                    <Box sx={{
                        display: 'flex',
                        gap: 2
                    }}>
                        <Box sx={{
                            flex: 1,
                            p: 2,
                            backgroundColor: alpha(maroonColor, 0.05),
                            borderRadius: 2,
                            border: `1px solid ${alpha(maroonColor, 0.2)}`
                        }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Daily Budget
                            </Typography>
                            <Typography variant="h6" fontWeight={600} color={maroonColor}>
                                ${dailyBudget.toFixed(2)}
                            </Typography>
                        </Box>
                        <Box sx={{
                            flex: 1,
                            p: 2,
                            backgroundColor: actualDailySpending > dailyBudget
                                ? alpha('#dc2626', 0.05)
                                : alpha('#059669', 0.05),
                            borderRadius: 2,
                            border: `1px solid ${alpha(actualDailySpending > dailyBudget ? '#dc2626' : '#059669', 0.2)}`
                        }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Actual Daily
                            </Typography>
                            <Typography variant="h6" fontWeight={600}
                                        color={actualDailySpending > dailyBudget ? '#dc2626' : '#059669'}>
                                ${actualDailySpending.toFixed(2)}
                            </Typography>
                        </Box>
                    </Box>
                </Stack>

                {/* Projection */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    End of Month Projection
                </Typography>

                <Card sx={{
                    p: 2.5,
                    mb: 3,
                    background: onTrack
                        ? 'linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)'
                        : 'linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, rgba(220, 38, 38, 0.02) 100%)',
                    border: `1px solid ${alpha(onTrack ? '#059669' : '#dc2626', 0.2)}`
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {onTrack ? (
                            <TrendingUpIcon sx={{ color: '#059669' }} />
                        ) : (
                            <TrendingDownIcon sx={{ color: '#dc2626' }} />
                        )}
                        <Typography variant="body1" fontWeight={600}>
                            Projected Savings: ${projectedSavings.toFixed(2)}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        At current spending rate, projected to end month with{' '}
                        <Typography component="span" fontWeight={600} color={onTrack ? '#059669' : '#dc2626'}>
                            ${Math.abs(projectedSavings - monthlyGoal).toFixed(2)}
                        </Typography>
                        {' '}{onTrack ? 'above' : 'below'} your goal
                    </Typography>
                </Card>

                <Divider sx={{ my: 3 }} />

                {/* Key Insights */}
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
                                ✓ On track to meet monthly goal
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Continue current spending habits to reach your ${monthlyGoal.toFixed(2)} savings target
                            </Typography>
                        </Box>
                    )}

                    {!onTrack && (
                        <Box sx={{
                            p: 2,
                            backgroundColor: alpha('#dc2626', 0.05),
                            borderRadius: 2,
                            borderLeft: `4px solid #dc2626`
                        }}>
                            <Typography variant="body2" fontWeight={500} color="#dc2626">
                                ⚠ May not meet monthly goal
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Need to reduce daily spending by ${(actualDailySpending - (totalBudget - monthlyGoal) / totalDays).toFixed(2)} to meet goal
                            </Typography>
                        </Box>
                    )}

                    {actualDailySpending > dailyBudget && (
                        <Box sx={{
                            p: 2,
                            backgroundColor: alpha('#f59e0b', 0.05),
                            borderRadius: 2,
                            borderLeft: `4px solid #f59e0b`
                        }}>
                            <Typography variant="body2" fontWeight={500} color="#f59e0b">
                                Spending above daily budget
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Averaging ${(actualDailySpending - dailyBudget).toFixed(2)} over daily budget
                            </Typography>
                        </Box>
                    )}

                    {actualDailySpending <= dailyBudget && (
                        <Box sx={{
                            p: 2,
                            backgroundColor: alpha('#059669', 0.05),
                            borderRadius: 2,
                            borderLeft: `4px solid #059669`
                        }}>
                            <Typography variant="body2" fontWeight={500} color="#059669">
                                Staying within daily budget
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Averaging ${(dailyBudget - actualDailySpending).toFixed(2)} under daily budget
                            </Typography>
                        </Box>
                    )}

                    {daysRemaining <= 7 && goalProgress < 100 && (
                        <Box sx={{
                            p: 2,
                            backgroundColor: alpha('#f59e0b', 0.05),
                            borderRadius: 2,
                            borderLeft: `4px solid #f59e0b`
                        }}>
                            <Typography variant="body2" fontWeight={500} color="#f59e0b">
                                Final week - goal not reached
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Need to save ${((monthlyGoal - currentSavings) / daysRemaining).toFixed(2)} per day to reach goal
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </Box>
        </Paper>
    );
};

export default BudgetGoalsStatsPanel;