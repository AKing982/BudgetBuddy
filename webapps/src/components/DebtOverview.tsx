import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface Debt {
    name: string;
    balance: number;
    interestRate: number;
    minimumPayment: number;
}

const COLORS: string[] = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const DebtOverview: React.FC = () => {
    // Dummy data
    const debts: Debt[] = [
        { name: 'Credit Card', balance: 5000, interestRate: 18.9, minimumPayment: 150 },
        { name: 'Student Loan', balance: 20000, interestRate: 5.5, minimumPayment: 300 },
        { name: 'Car Loan', balance: 10000, interestRate: 4.2, minimumPayment: 250 },
        { name: 'Personal Loan', balance: 3000, interestRate: 10.5, minimumPayment: 100 },
    ];

    const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0);

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: '0.875rem', color: 'text.secondary' }}>
                Debt Overview
            </Typography>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            ${totalDebt.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Debt
                        </Typography>
                    </Box>
                    <ResponsiveContainer width="50%" height={200}>
                        <PieChart>
                            <Pie
                                data={debts}
                                dataKey="balance"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                label
                            >
                                {debts.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Debt Name</TableCell>
                                <TableCell align="right">Balance</TableCell>
                                <TableCell align="right">Interest Rate</TableCell>
                                <TableCell align="right">Minimum Payment</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {debts.map((debt) => (
                                <TableRow key={debt.name}>
                                    <TableCell component="th" scope="row">
                                        {debt.name}
                                    </TableCell>
                                    <TableCell align="right">${debt.balance.toLocaleString()}</TableCell>
                                    <TableCell align="right">{debt.interestRate}%</TableCell>
                                    <TableCell align="right">${debt.minimumPayment.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default DebtOverview;