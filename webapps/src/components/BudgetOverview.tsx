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


const BudgetOverview: React.FC<BudgetOverviewProps> = ({isLoading, data}) => {


    const calculateCategoryTotals = (categories: any[] = []): CategoryTotals => {
        return categories.reduce(
            (sum, cat) => ({
                budgeted: sum.budgeted + (cat?.budgetedAmount || 0),
                actual: sum.actual + (cat?.actualAmount || 0),
                remaining: sum.remaining + (cat?.remainingAmount || 0)
            }),
            { budgeted: 0, actual: 0, remaining: 0 }
        );
    };

    const calculateBudgetTotals = (data: BudgetRunnerResult[]): BudgetTotals => {
        const initialTotals: BudgetTotals = {
            income: { budgeted: 0, actual: 0, remaining: 0 },
            expenses: { budgeted: 0, actual: 0, remaining: 0 },
            savings: { budgeted: 0, actual: 0, remaining: 0 }
        };

        return data.reduce((acc: BudgetTotals, budget: BudgetRunnerResult) => {
            // Extract categories from budgetCategoryStats if it exists
            const stats = budget.budgetCategoryStats;
            if (!stats) return acc;

            const incomeTotals = calculateCategoryTotals(stats.incomeCategories);
            const expenseTotals = calculateCategoryTotals(stats.expenseCategories);
            const savingsTotals = calculateCategoryTotals(stats.savingsCategories);

            return {
                income: {
                    budgeted: acc.income.budgeted + incomeTotals.budgeted,
                    actual: acc.income.actual + incomeTotals.actual,
                    remaining: acc.income.remaining + incomeTotals.remaining
                },
                expenses: {
                    budgeted: acc.expenses.budgeted + expenseTotals.budgeted,
                    actual: acc.expenses.actual + expenseTotals.actual,
                    remaining: acc.expenses.remaining + expenseTotals.remaining
                },
                savings: {
                    budgeted: acc.savings.budgeted + savingsTotals.budgeted,
                    actual: acc.savings.actual + savingsTotals.actual,
                    remaining: acc.savings.remaining + savingsTotals.remaining
                }
            };
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



    // const budgetData = useMemo(() => {
    //     if (!data.length) {
    //         return {
    //             income: { budgeted: 0, actual: 0, remaining: 0 },
    //             expenses: { budgeted: 0, actual: 0, remaining: 0 },
    //             savings: { budgeted: 0, actual: 0, remaining: 0 }
    //         };
    //     }
    //
    //
    //     // // Aggregate data from all budgets
    //     // return data.reduce((acc, budget) => {
    //     //     // Get income from incomeCategories
    //     //     const incomeBudgeted = budget.incomeCategories.reduce((sum, cat) =>
    //     //         sum + (cat.budgetedAmount || 0), 0);
    //     //     const incomeActual = budget.incomeCategories.reduce((sum, cat) =>
    //     //         sum + (cat.actualAmount || 0), 0);
    //     //     const incomeRemaining = budget.incomeCategories.reduce((sum, cat) =>
    //     //         sum + (cat.remainingAmount || 0), 0);
    //     //
    //     //     // Get expense totals from topExpenseCategories
    //     //     const expenseBudgeted = budget.expenseCategories.reduce((sum, cat) =>
    //     //         sum + (cat.budgetedAmount || 0), 0);
    //     //     const expenseActual = budget.expenseCategories.reduce((sum, cat) =>
    //     //         sum + (cat.actualAmount || 0), 0);
    //     //     const expenseRemaining = budget.expenseCategories.reduce((sum, cat) =>
    //     //         sum + (cat.remainingAmount || 0), 0);
    //     //
    //     //     // Get savings from savingsCategories
    //     //     const savingsBudgeted = budget.savingsCategories.reduce((sum, cat) =>
    //     //         sum + (cat.budgetedAmount || 0), 0);
    //     //     const savingsActual = budget.savingsCategories.reduce((sum, cat) =>
    //     //         sum + (cat.actualAmount || 0), 0);
    //     //     const savingsRemaining = budget.savingsCategories.reduce((sum, cat) =>
    //     //         sum + (cat.remainingAmount || 0), 0);
    //     //
    //     //     return {
    //     //         income: {
    //     //             budgeted: acc.income.budgeted + incomeBudgeted,
    //     //             actual: acc.income.actual + incomeActual,
    //     //             remaining: acc.income.remaining + incomeRemaining
    //     //         },
    //     //         expenses: {
    //     //             budgeted: acc.expenses.budgeted + expenseBudgeted,
    //     //             actual: acc.expenses.actual + expenseActual,
    //     //             remaining: acc.expenses.remaining + expenseRemaining
    //     //         },
    //     //         savings: {
    //     //             budgeted: acc.savings.budgeted + savingsBudgeted,
    //     //             actual: acc.savings.actual + savingsActual,
    //     //             remaining: acc.savings.remaining + savingsRemaining
    //     //         }
    //     //     };
    //     // }, {
    //     //     income: { budgeted: 0, actual: 0, remaining: 0 },
    //     //     expenses: { budgeted: 0, actual: 0, remaining: 0 },
    //     //     savings: { budgeted: 0, actual: 0, remaining: 0 }
    //     // });
    //     // Aggregate data safely
    //     return data.reduce((acc, budget) => {
    //         const incomeBudgeted = (budget.incomeCategories || []).reduce((sum, cat) => sum + (cat.budgetedAmount || 0), 0);
    //         const incomeActual = (budget.incomeCategories || []).reduce((sum, cat) => sum + (cat.actualAmount || 0), 0);
    //         const incomeRemaining = (budget.incomeCategories || []).reduce((sum, cat) => sum + (cat.remainingAmount || 0), 0);
    //
    //
    //         const expenseBudgeted = (budget.expenseCategories || []).reduce((sum, cat) => sum + (cat?.budgetedAmount || 0), 0);
    //         const expenseActual = (budget.expenseCategories || []).reduce((sum, cat) => sum + (cat?.actualAmount || 0), 0);
    //         const expenseRemaining = (budget.expenseCategories || []).reduce((sum, cat) => sum + (cat?.remainingAmount || 0), 0);
    //
    //         const savingsBudgeted = (budget.savingsCategories || []).reduce((sum, cat) => sum + (cat?.budgetedAmount || 0), 0);
    //         const savingsActual = (budget.savingsCategories || []).reduce((sum, cat) => sum + (cat?.actualAmount || 0), 0);
    //         const savingsRemaining = (budget.savingsCategories || []).reduce((sum, cat) => sum + (cat?.remainingAmount || 0), 0);
    //
    //         return {
    //             income: {
    //                 budgeted: acc.income.budgeted + incomeBudgeted,
    //                 actual: acc.income.actual + incomeActual,
    //                 remaining: acc.income.remaining + incomeRemaining
    //             },
    //             expenses: {
    //                 budgeted: acc.expenses.budgeted + expenseBudgeted,
    //                 actual: acc.expenses.actual + expenseActual,
    //                 remaining: acc.expenses.remaining + expenseRemaining
    //             },
    //             savings: {
    //                 budgeted: acc.savings.budgeted + savingsBudgeted,
    //                 actual: acc.savings.actual + savingsActual,
    //                 remaining: acc.savings.remaining + savingsRemaining
    //             }
    //         };
    //     }, {
    //         income: { budgeted: 0, actual: 0, remaining: 0 },
    //         expenses: { budgeted: 0, actual: 0, remaining: 0 },
    //         savings: { budgeted: 0, actual: 0, remaining: 0 }
    //     });
    // }, [data]);

    const healthScore = useMemo(() => {
        if (!data.length) return 0;

        const avgHealthScore = data.reduce((sum, budget) =>
            sum + (budget.budgetStats.healthScore || 0), 0) / data.length;

        return Math.round(avgHealthScore);
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

    // // Calculate budget health score
    // const calculateHealthScore = () => {
    //     const incomeScore = Math.min(budgetData.income.actual / budgetData.income.budgeted, 1) * 50;
    //     const expenseScore = (1 - Math.max(0, budgetData.expenses.actual - budgetData.expenses.budgeted) / budgetData.expenses.budgeted) * 40;
    //     const savingsScore = Math.min(budgetData.savings.actual / budgetData.savings.budgeted, 1) * 10;
    //     return Math.round(incomeScore + expenseScore + savingsScore);
    // };
    //
    // const healthScore = calculateHealthScore();

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
                            <TableCell align="right">${totals.income.budgeted.toFixed(2)}</TableCell>
                            <TableCell align="right">${totals.income.actual.toFixed(2)}</TableCell>
                            <TableCell align="right">${totals.income.remaining.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell component="th" scope="row">Expenses</TableCell>
                            <TableCell align="right">${totals.expenses.budgeted.toFixed(2)}</TableCell>
                            <TableCell align="right">${totals.expenses.actual.toFixed(2)}</TableCell>
                            <TableCell align="right">${totals.expenses.remaining.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell component="th" scope="row">Savings</TableCell>
                            <TableCell align="right">${totals.savings.budgeted.toFixed(2)}</TableCell>
                            <TableCell align="right">${totals.savings.actual.toFixed(2)}</TableCell>
                            <TableCell align="right">${totals.savings.remaining.toFixed(2)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

}

export default BudgetOverview;