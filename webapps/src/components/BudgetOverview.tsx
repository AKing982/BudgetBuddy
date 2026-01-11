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
    Typography
} from "@mui/material";
import React, {useMemo, useState} from "react";
import {BudgetRunnerResult} from "../services/BudgetRunnerService";

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


const BudgetOverview: React.FC<BudgetOverviewProps> = ({isLoading, data}) =>
{
    const calculateCategoryTotals = (categories: any[] = []): CategoryTotals => {
        console.log('Categories received:', categories);
        console.log('Type of categories:', typeof categories);
        console.log('Is Array?:', Array.isArray(categories));

        // Guard clause to ensure we have an array
        if (!Array.isArray(categories)) {
            console.warn('Categories is not an array:', categories);
            return { budgeted: 0, actual: 0, remaining: 0 };
        }

        return categories.reduce(
            (sum, cat) => ({
                budgeted: sum.budgeted + (cat?.budgetedAmount || 0),
                actual: sum.actual + (cat?.actualAmount || 0),
                remaining: sum.remaining + (cat?.remainingAmount || 0)
            }),
        );
    };

    const calculateBudgetTotals = (data: BudgetRunnerResult[]): BudgetTotals =>
    {
        const initialTotals: BudgetTotals = {
            income: { budgeted: 0, actual: 0, remaining: 0 },
            expenses: { budgeted: 0, actual: 0, remaining: 0 },
            savings: { budgeted: 0, actual: 0, remaining: 0 }
        };

        return data.reduce((acc: BudgetTotals, budget: BudgetRunnerResult) =>
        {
            // Extract categories from budgetCategoryStats if it exists
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

    const healthScore = useMemo(() => {
        if (!data.length) {
            console.log('No data found');
            return 0;
        }

        console.log('Full data:', data);

        const totalScore = data.reduce((sum, budget) => {
            // Handle budgetStats as an array
            const stats = Array.isArray(budget.budgetStats) ?
                budget.budgetStats[0] : budget.budgetStats;

            console.log('Stats being processed:', stats);

            if (!stats?.healthScore) {
                console.log('No health score found in stats');
                return sum;
            }

            const normalizedScore = Math.min(stats.healthScore, 100);
            console.log('Normalized score:', normalizedScore);
            const newSum = sum + normalizedScore;
            console.log('Running sum:', newSum);

            return newSum;
        }, 0);

        const finalScore = Math.round(totalScore / data.length);
        console.log('Final score:', finalScore);

        return finalScore;
    }, [data]);

    if (isLoading) {
        return (
            <Box>
                <Typography variant="h5" component="h2" gutterBottom>
                    Budget Overview
                </Typography>
                <Box mb={3}>
                    <Skeleton variant="text" width="60%" height={30} />
                    <Skeleton variant="rectangular" height={10} />
                    <Skeleton variant="text" width="40%" />
                </Box>
                <Skeleton variant="rectangular" height={200} />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h5" component="h2" gutterBottom sx={{
                mb: 2,
                fontWeight: 'bold',
                textAlign: 'left',
                fontSize: '0.875rem',
                color: 'text.secondary'
            }}>
                Budget Overview
            </Typography>
            <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                    Budget Health Score: {healthScore}/100
                </Typography>
                <LinearProgress
                    variant="determinate"
                    value={healthScore}
                    color={healthScore > 80 ? "success" : healthScore > 60 ? "warning" : "error"}
                    sx={{ height: 10, borderRadius: 5 }}
                />
                <Typography variant="body2" color="text.secondary" mt={1}>
                    {healthScore > 80 ? "Excellent! Keep it up!" :
                        healthScore > 60 ? "Good, but there's room for improvement." :
                            "Your budget needs attention. Consider adjusting your spending."}
                </Typography>
            </Box>
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
                                color: '#800000',
                                fontSize: '0.95rem'
                            }}>Name</TableCell>
                            <TableCell align="right" sx={{
                                fontWeight: 'bold',
                                color: '#800000',
                                fontSize: '0.95rem'
                            }}>Budgeted</TableCell>
                            <TableCell align="right" sx={{
                                fontWeight: 'bold',
                                color: '#800000',
                                fontSize: '0.95rem'
                            }}>Actual</TableCell>
                            <TableCell align="right" sx={{
                                fontWeight: 'bold',
                                color: '#800000',
                                fontSize: '0.95rem'
                            }}>Remaining</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell component="th" scope="row">Income</TableCell>
                            <TableCell align="right">{formatCurrency(totals.income.budgeted)}</TableCell>
                            <TableCell align="right">{formatCurrency(totals.income.actual)}</TableCell>
                            <TableCell align="right">{formatCurrency(totals.income.remaining)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell component="th" scope="row">Expenses</TableCell>
                            <TableCell align="right">{formatCurrency(totals.expenses.budgeted)}</TableCell>
                            <TableCell align="right">{formatCurrency(totals.expenses.actual)}</TableCell>
                            <TableCell align="right">{formatCurrency(totals.expenses.remaining)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell component="th" scope="row">Savings</TableCell>
                            <TableCell align="right">{formatCurrency(totals.savings.budgeted)}</TableCell>
                            <TableCell align="right">{formatCurrency(totals.savings.actual)}</TableCell>
                            <TableCell align="right">{formatCurrency(totals.savings.remaining)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

}

export default BudgetOverview;