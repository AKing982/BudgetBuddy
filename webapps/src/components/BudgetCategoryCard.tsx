import React from 'react';
import { Card, Box, Typography, LinearProgress, alpha, useTheme } from '@mui/material';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface BudgetCategoryCardProps {
    categoryName: string;
    budgeted: number;
    actual: number;
    remaining: number;
    compact?: boolean;
}

const tealColor = '#0d9488';

const BudgetCategoryCard: React.FC<BudgetCategoryCardProps> = ({
                                                                   categoryName,
                                                                   budgeted,
                                                                   actual,
                                                                   remaining,
                                                                   compact = true
                                                               }) => {
    const theme = useTheme();

    const getProgressColor = (actual: number, budgeted: number) => {
        if (budgeted === 0) return tealColor;
        const percentage = (actual / budgeted) * 100;
        if (percentage < 70) return tealColor;
        if (percentage < 90) return '#f59e0b';
        return '#dc2626';
    };

    const formatCurrency = (amount: number) => {
        return `$${Math.abs(amount).toFixed(2)}`;
    };

    const percentage = (actual / budgeted) * 100;
    const progressColor = getProgressColor(actual, budgeted);
    const isOverBudget = remaining < 0;

    // Pie chart data
    const pieData = [
        {
            name: 'Spent',
            value: actual > budgeted ? budgeted : actual,
            color: progressColor
        },
        {
            name: 'Remaining',
            value: remaining > 0 ? remaining : 0,
            color: alpha(progressColor, 0.2)
        }
    ];

    // If over budget, show different pie
    const overBudgetPieData = [
        { name: 'Budget', value: budgeted, color: alpha(progressColor, 0.3) },
        { name: 'Overspent', value: actual - budgeted, color: progressColor }
    ];

    const chartData = isOverBudget ? overBudgetPieData : pieData;

    if (compact) {
        return (
            <Card sx={{
                p: 1.5,
                borderRadius: 1.5,
                background: `linear-gradient(135deg, ${alpha(progressColor, 0.08)} 0%, ${alpha(progressColor, 0.03)} 100%)`,
                border: `1px solid ${alpha(progressColor, 0.15)}`,
                transition: 'all 0.15s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    borderColor: alpha(progressColor, 0.3)
                }
            }}>
                {/* Header Row with Pie Chart */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ flex: 1, pr: 1 }}>
                        <Typography variant="caption" sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            color: 'text.primary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                            mb: 0.5
                        }}>
                            {categoryName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {isOverBudget ? (
                                <TrendingDown size={11} color="#dc2626" />
                            ) : (
                                <TrendingUp size={11} color="#059669" />
                            )}
                            <Typography variant="caption" sx={{
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                color: progressColor
                            }}>
                                {formatCurrency(actual)}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Mini Pie Chart with Center Label */}
                    <Box sx={{ width: 40, height: 40, flexShrink: 0, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={10}
                                    outerRadius={18}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Percentage Label in Center */}
                        <Box sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none'
                        }}>
                            <Typography sx={{
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                color: progressColor,
                                lineHeight: 1,
                                textAlign: 'center'
                            }}>
                                {Math.min(percentage, 100).toFixed(0)}%
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Progress Bar - Shows spending progress towards budget */}
                <Box sx={{ mb: 0.75 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" sx={{
                            fontSize: '0.65rem',
                            color: 'text.secondary'
                        }}>
                            Progress
                        </Typography>
                        <Typography variant="caption" sx={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            color: progressColor
                        }}>
                            {Math.min(percentage, 100).toFixed(0)}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(percentage, 100)}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: `${progressColor}15`,
                            '& .MuiLinearProgress-bar': {
                                bgcolor: progressColor,
                                borderRadius: 3
                            }
                        }}
                    />
                </Box>

                {/* Footer Row */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{
                        fontSize: '0.65rem',
                        color: 'text.secondary'
                    }}>
                        of {formatCurrency(budgeted)}
                    </Typography>
                    <Typography variant="caption" sx={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: isOverBudget ? '#dc2626' : '#059669'
                    }}>
                        {isOverBudget ? '+' : ''}{formatCurrency(Math.abs(remaining))}
                    </Typography>
                </Box>
            </Card>
        );
    }

    // Non-compact version (original design with larger pie chart)
    return (
        <Card sx={{
            p: 2.5,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${alpha(progressColor, 0.1)} 0%, ${alpha(progressColor, 0.05)} 100%)`,
            border: `1px solid ${alpha(progressColor, 0.2)}`,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        display: 'block',
                        mb: 0.5
                    }}>
                        {categoryName}
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color={progressColor}>
                        {formatCurrency(actual)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        of {formatCurrency(budgeted)}
                    </Typography>
                </Box>

                {/* Larger Pie Chart for non-compact with Center Label */}
                <Box sx={{ width: 70, height: 70, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={18}
                                outerRadius={32}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Percentage Label in Center */}
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none'
                    }}>
                        <Typography sx={{
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: progressColor,
                            lineHeight: 1,
                            textAlign: 'center'
                        }}>
                            {Math.min(percentage, 100).toFixed(0)}%
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                        Spending Progress
                    </Typography>
                    <Typography variant="caption" fontWeight={600} color={progressColor}>
                        {Math.min(percentage, 100).toFixed(0)}%
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={Math.min(percentage, 100)}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: `${progressColor}20`,
                        '& .MuiLinearProgress-bar': {
                            bgcolor: progressColor,
                            borderRadius: 4
                        }
                    }}
                />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                    {remaining >= 0 ? 'Remaining' : 'Over Budget'}
                </Typography>
                <Typography variant="caption" fontWeight={700} color={isOverBudget ? '#dc2626' : '#059669'}>
                    {formatCurrency(Math.abs(remaining))}
                </Typography>
            </Box>
        </Card>
    );
};

export default BudgetCategoryCard;