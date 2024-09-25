import {Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography} from "@mui/material";
import React, {useState} from "react";



const BudgetOverview: React.FC = () => {
    const [budgetData, setBudgetData] = useState({
        income: {budgeted: 0, actual: 0, remaining: 0},
        expenses: {budgeted: 0, actual: 0, remaining: 0}
    });

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
                </TableBody>
            </Table>
        </TableContainer>
        </Box>
    );
}

export default BudgetOverview;