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


const BudgetOverview: React.FC<BudgetOverviewProps> = ({isLoading, data}) => {
    // const [budgetData, setBudgetData] = useState({
    //     income: {budgeted: 3285, actual: 2836, remaining: 2136},
    //     expenses: {budgeted: 3023, actual: 1200, remaining: 1823},
    //     savings: {budgeted: 1000, actual: 150, remaining: 850}
    // });

    const budgetData = useMemo(() => {
        if (!data.length) {
            return {
                income: { budgeted: 0, actual: 0, remaining: 0 },
                expenses: { budgeted: 0, actual: 0, remaining: 0 },
                savings: { budgeted: 0, actual: 0, remaining: 0 }
            };
        }

        // Aggregate data from all budgets
        return data.reduce((acc, budget) => {
            // Get income categories
            const incomeTotal = budget.incomeCategories.reduce((sum, cat) => sum + cat.amount, 0);

            // Get expense categories
            const expenseTotal = budget.topExpenseCategories.reduce((sum, cat) => sum + cat.amount, 0);

            // Get savings categories
            const savingsTotal = budget.savingsCategories.reduce((sum, cat) => sum + cat.amount, 0);

            return {
                income: {
                    budgeted: acc.income.budgeted + incomeTotal,
                    actual: acc.income.actual + (budget.actualAmount || 0),
                    remaining: acc.income.remaining + (incomeTotal - (budget.actualAmount || 0))
                },
                expenses: {
                    budgeted: acc.expenses.budgeted + expenseTotal,
                    actual: acc.expenses.actual + (budget.actualAmount || 0),
                    remaining: acc.expenses.remaining + (expenseTotal - (budget.actualAmount || 0))
                },
                savings: {
                    budgeted: acc.savings.budgeted + savingsTotal,
                    actual: acc.savings.actual + (budget.savingsAmount || 0),
                    remaining: acc.savings.remaining + (savingsTotal - (budget.savingsAmount || 0))
                }
            };
        }, {
            income: { budgeted: 0, actual: 0, remaining: 0 },
            expenses: { budgeted: 0, actual: 0, remaining: 0 },
            savings: { budgeted: 0, actual: 0, remaining: 0 }
        });
    }, [data]);

    const healthScore = useMemo(() => {
        if (!data.length) return 0;

        const avgHealthScore = data.reduce((sum, budget) =>
            sum + (budget.healthScore || 0), 0) / data.length;

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
                            <TableCell align="right">${budgetData.income.budgeted.toFixed(2)}</TableCell>
                            <TableCell align="right">${budgetData.income.actual.toFixed(2)}</TableCell>
                            <TableCell align="right">${budgetData.income.remaining.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell component="th" scope="row">Expenses</TableCell>
                            <TableCell align="right">${budgetData.expenses.budgeted.toFixed(2)}</TableCell>
                            <TableCell align="right">${budgetData.expenses.actual.toFixed(2)}</TableCell>
                            <TableCell align="right">${budgetData.expenses.remaining.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell component="th" scope="row">Savings</TableCell>
                            <TableCell align="right">${budgetData.savings.budgeted.toFixed(2)}</TableCell>
                            <TableCell align="right">${budgetData.savings.actual.toFixed(2)}</TableCell>
                            <TableCell align="right">${budgetData.savings.remaining.toFixed(2)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

}

export default BudgetOverview;