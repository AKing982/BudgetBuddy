import {
    Box,
    LinearProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";
import React, {useState} from "react";



const BudgetOverview: React.FC = () => {
    const [budgetData, setBudgetData] = useState({
        income: {budgeted: 3285, actual: 2836, remaining: 2136},
        expenses: {budgeted: 3023, actual: 1200, remaining: 1823},
        savings: {budgeted: 1000, actual: 150, remaining: 850}
    });

    // Calculate budget health score
    const calculateHealthScore = () => {
        const incomeScore = Math.min(budgetData.income.actual / budgetData.income.budgeted, 1) * 50;
        const expenseScore = (1 - Math.max(0, budgetData.expenses.actual - budgetData.expenses.budgeted) / budgetData.expenses.budgeted) * 40;
        const savingsScore = Math.min(budgetData.savings.actual / budgetData.savings.budgeted, 1) * 10;
        return Math.round(incomeScore + expenseScore + savingsScore);
    };

    const healthScore = calculateHealthScore();

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

    // return (
    //     <Box>
    //         <Typography variant="h5" component="h2" gutterBottom sx={{
    //             mb: 2,
    //             fontWeight: 'bold',
    //             textAlign: 'left',
    //             fontSize: '0.875rem',
    //             color: 'text.secondary'
    //         }}>
    //             Budget Overview
    //         </Typography>
    //     <TableContainer component={Paper} sx={{
    //         boxShadow: 3,
    //         borderRadius: 4,
    //         overflow: 'hidden',
    //         transition: 'box-shadow 0.3s ease-in-out',
    //         '&:hover': {
    //             boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
    //         }
    //     }}>
    //         <Table>
    //             <TableHead>
    //                 <TableRow sx={{backgroundColor: 'background.paper'}}>
    //                     <TableCell sx={{
    //                         fontWeight: 'bold',
    //                         color: '#800000',
    //                         fontSize: '0.95rem'
    //                     }}>Name</TableCell>
    //                     <TableCell align="right" sx={{
    //                         fontWeight: 'bold',
    //                         color: '#800000',
    //                         fontSize: '0.95rem'
    //                     }}>Budgeted</TableCell>
    //                     <TableCell align="right" sx={{
    //                         fontWeight: 'bold',
    //                         color: '#800000',
    //                         fontSize: '0.95rem'
    //                     }}>Actual</TableCell>
    //                     <TableCell align="right" sx={{
    //                         fontWeight: 'bold',
    //                         color: '#800000',
    //                         fontSize: '0.95rem'
    //                     }}>Remaining</TableCell>
    //                 </TableRow>
    //             </TableHead>
    //             <TableBody>
    //                 <TableRow>
    //                     <TableCell component="th" scope="row">Income</TableCell>
    //                     <TableCell align="right">${budgetData.income.budgeted.toFixed(2)}</TableCell>
    //                     <TableCell align="right">${budgetData.income.actual.toFixed(2)}</TableCell>
    //                     <TableCell align="right">${budgetData.income.remaining.toFixed(2)}</TableCell>
    //                 </TableRow>
    //                 <TableRow>
    //                     <TableCell component="th" scope="row">Expenses</TableCell>
    //                     <TableCell align="right">${budgetData.expenses.budgeted.toFixed(2)}</TableCell>
    //                     <TableCell align="right">${budgetData.expenses.actual.toFixed(2)}</TableCell>
    //                     <TableCell align="right">${budgetData.expenses.remaining.toFixed(2)}</TableCell>
    //                 </TableRow>
    //             </TableBody>
    //         </Table>
    //     </TableContainer>
    //     </Box>
    // );
}

export default BudgetOverview;