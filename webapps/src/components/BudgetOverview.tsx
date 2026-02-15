import {
    Box,
    LinearProgress,
    Paper, Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    ToggleButtonGroup,
    ToggleButton,
    alpha,
    useTheme,
    Card,
    Grid
} from "@mui/material";
import React, {useMemo, useState} from "react";
import {BudgetRunnerResult} from "../services/BudgetRunnerService";
import { Table as TableIcon, BarChart3 } from 'lucide-react';

interface BudgetOverviewProps {
    isLoading: boolean;
    data: BudgetRunnerResult[];
}

interface CategoryTotals {
    budgeted: number;
    actual: number;
    remaining: number;
}

interface BudgetTotals {
    income: CategoryTotals;
    expenses: CategoryTotals;
    savings: CategoryTotals;
}

const maroonColor = '#800000';
const tealColor = '#0d9488';

const BudgetOverview: React.FC<BudgetOverviewProps> = ({isLoading, data}) =>
{
    const theme = useTheme();
    const [viewType, setViewType] = useState<'numeric' | 'visual'>('visual');

    const calculateBudgetTotals = (data: BudgetRunnerResult[]): BudgetTotals =>
    {
        const initialTotals: BudgetTotals = {
            income: { budgeted: 0, actual: 0, remaining: 0 },
            expenses: { budgeted: 0, actual: 0, remaining: 0 },
            savings: { budgeted: 0, actual: 0, remaining: 0 }
        };

        return data.reduce((acc: BudgetTotals, budget: BudgetRunnerResult) =>
        {
            const stats = budget.budgetCategoryStats;
            if (!stats) return acc;

            if(stats.incomeCategories){
                acc.income.budgeted += stats.incomeCategories?.budgetedIncome || 0;
                acc.income.actual += stats.incomeCategories.actualBudgetedIncome || 0;
                acc.income.remaining += stats.incomeCategories.remainingIncome || 0;
            }

            if(stats.expenseCategories){
                acc.expenses.budgeted += stats.expenseCategories.budgetedExpenses || 0;
                acc.expenses.actual += stats.expenseCategories.actualExpenses || 0;
                acc.expenses.remaining += stats.expenseCategories.remainingExpenses || 0;
            }

            if(stats.savingsCategories){
                acc.savings.budgeted += stats.savingsCategories.budgetedSavingsTarget || 0;
                acc.savings.actual += stats.savingsCategories.actualSavedAmount || 0;
                acc.savings.remaining += stats.savingsCategories.remainingToSave || 0;
            }
            return acc;
        }, initialTotals);
    };

    const totals = useMemo(() => {
        if (!data.length) {
            return {
                income: { budgeted: 0, actual: 0, remaining: 0 },
                expenses: { budgeted: 0, actual: 0, remaining: 0 },
                savings: { budgeted: 0, actual: 0, remaining: 0 }
            };
        }
        return calculateBudgetTotals(data);
    }, [data]);

    const formatCurrency = (amount: number) : string => {
        const absAmount = Math.abs(amount);
        const formatted = absAmount.toFixed(2);
        return amount < 0 ? `-$${formatted}` : `$${formatted}`;
    }

    const getProgressColor = (actual: number, budgeted: number) => {
        if (budgeted === 0) return tealColor;
        const percentage = (actual / budgeted) * 100;
        if (percentage < 70) return tealColor;
        if (percentage < 90) return '#f59e0b';
        return '#dc2626';
    };

    if (isLoading) {
        return (
            <Box>
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Box>
        );
    }

    const renderNumericView = () => (
        <TableContainer component={Paper} sx={{
            boxShadow: 3,
            borderRadius: 4,
            overflow: 'hidden',
            transition: 'box-shadow 0.3s ease-in-out',
            '&:hover': {
                boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
            }
        }}>
            <Table>
                <TableHead>
                    <TableRow sx={{backgroundColor: 'background.paper'}}>
                        <TableCell sx={{
                            fontWeight: 'bold',
                            color: maroonColor,
                            fontSize: '0.95rem'
                        }}>Category</TableCell>
                        <TableCell align="right" sx={{
                            fontWeight: 'bold',
                            color: maroonColor,
                            fontSize: '0.95rem'
                        }}>Budgeted</TableCell>
                        <TableCell align="right" sx={{
                            fontWeight: 'bold',
                            color: maroonColor,
                            fontSize: '0.95rem'
                        }}>Actual</TableCell>
                        <TableCell align="right" sx={{
                            fontWeight: 'bold',
                            color: maroonColor,
                            fontSize: '0.95rem'
                        }}>Remaining</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>Income</TableCell>
                        <TableCell align="right">{formatCurrency(totals.income.budgeted)}</TableCell>
                        <TableCell align="right">{formatCurrency(totals.income.actual)}</TableCell>
                        <TableCell align="right" sx={{
                            color: totals.income.remaining >= 0 ? '#059669' : '#dc2626',
                            fontWeight: 600
                        }}>{formatCurrency(totals.income.remaining)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>Expenses</TableCell>
                        <TableCell align="right">{formatCurrency(totals.expenses.budgeted)}</TableCell>
                        <TableCell align="right">{formatCurrency(totals.expenses.actual)}</TableCell>
                        <TableCell align="right" sx={{
                            color: totals.expenses.remaining >= 0 ? '#059669' : '#dc2626',
                            fontWeight: 600
                        }}>{formatCurrency(totals.expenses.remaining)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>Savings</TableCell>
                        <TableCell align="right">{formatCurrency(totals.savings.budgeted)}</TableCell>
                        <TableCell align="right">{formatCurrency(totals.savings.actual)}</TableCell>
                        <TableCell align="right" sx={{
                            color: totals.savings.remaining >= 0 ? '#059669' : '#dc2626',
                            fontWeight: 600
                        }}>{formatCurrency(totals.savings.remaining)}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );

    const renderVisualView = () => (
        <Box>
            {/* Category Cards */}
            <Grid container spacing={2}>
                {/* Income Card */}
                <Grid item xs={12} md={4}>
                    <Card sx={{
                        p: 2.5,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${alpha('#2563eb', 0.1)} 0%, ${alpha('#2563eb', 0.05)} 100%)`,
                        border: `1px solid ${alpha('#2563eb', 0.2)}`
                    }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                            Income
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Budgeted</Typography>
                                <Typography variant="body2" fontWeight={600}>{formatCurrency(totals.income.budgeted)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Actual</Typography>
                                <Typography variant="body2" fontWeight={700} color="#2563eb">{formatCurrency(totals.income.actual)}</Typography>
                            </Box>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min((totals.income.actual / totals.income.budgeted) * 100, 100)}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: alpha('#2563eb', 0.2),
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: '#2563eb',
                                    borderRadius: 4
                                }
                            }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {formatCurrency(totals.income.remaining)} remaining
                        </Typography>
                    </Card>
                </Grid>

                {/* Expenses Card */}
                <Grid item xs={12} md={4}>
                    <Card sx={{
                        p: 2.5,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${alpha('#dc2626', 0.1)} 0%, ${alpha('#dc2626', 0.05)} 100%)`,
                        border: `1px solid ${alpha('#dc2626', 0.2)}`
                    }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                            Expenses
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Budgeted</Typography>
                                <Typography variant="body2" fontWeight={600}>{formatCurrency(totals.expenses.budgeted)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Actual</Typography>
                                <Typography variant="body2" fontWeight={700} color="#dc2626">{formatCurrency(totals.expenses.actual)}</Typography>
                            </Box>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min((totals.expenses.actual / totals.expenses.budgeted) * 100, 100)}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: alpha(getProgressColor(totals.expenses.actual, totals.expenses.budgeted), 0.2),
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: getProgressColor(totals.expenses.actual, totals.expenses.budgeted),
                                    borderRadius: 4
                                }
                            }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {formatCurrency(Math.abs(totals.expenses.remaining))} {totals.expenses.remaining >= 0 ? 'remaining' : 'over'}
                        </Typography>
                    </Card>
                </Grid>

                {/* Savings Card */}
                <Grid item xs={12} md={4}>
                    <Card sx={{
                        p: 2.5,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${alpha(tealColor, 0.1)} 0%, ${alpha(tealColor, 0.05)} 100%)`,
                        border: `1px solid ${alpha(tealColor, 0.2)}`
                    }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                            Savings
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Target</Typography>
                                <Typography variant="body2" fontWeight={600}>{formatCurrency(totals.savings.budgeted)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Saved</Typography>
                                <Typography variant="body2" fontWeight={700} color={tealColor}>{formatCurrency(totals.savings.actual)}</Typography>
                            </Box>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min((totals.savings.actual / totals.savings.budgeted) * 100, 100)}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: alpha(tealColor, 0.2),
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: tealColor,
                                    borderRadius: 4
                                }
                            }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {formatCurrency(totals.savings.remaining)} to goal
                        </Typography>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );

    return (
        <Box>
            {/* View Toggle */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <ToggleButtonGroup
                    value={viewType}
                    exclusive
                    onChange={(e, newView) => newView && setViewType(newView)}
                    size="small"
                    sx={{
                        '& .MuiToggleButton-root': {
                            py: 0.5,
                            px: 2,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                            '&.Mui-selected': {
                                bgcolor: alpha(maroonColor, 0.1),
                                color: maroonColor,
                                borderColor: alpha(maroonColor, 0.4),
                                '&:hover': {
                                    bgcolor: alpha(maroonColor, 0.15)
                                }
                            }
                        }
                    }}
                >
                    <ToggleButton value="visual">
                        <BarChart3 size={14} style={{ marginRight: 6 }} /> Visual
                    </ToggleButton>
                    <ToggleButton value="numeric">
                        <TableIcon size={14} style={{ marginRight: 6 }} /> Numeric
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Content */}
            {viewType === 'numeric' ? renderNumericView() : renderVisualView()}
        </Box>
    );
}

export default BudgetOverview;