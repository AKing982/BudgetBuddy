import React from 'react';
import { Box, Typography, Paper, LinearProgress, Grid } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Debt {
    name: string;
    balance: number;
    originalBalance: number;
}

const DebtPaymentProgress: React.FC = () => {
    // Dummy data
    const debts: Debt[] = [
        { name: 'Credit Card', balance: 3500, originalBalance: 7000 },
        { name: 'Student Loan', balance: 18000, originalBalance: 25000 },
        { name: 'Car Loan', balance: 8000, originalBalance: 15000 },
        { name: 'Personal Loan', balance: 2000, originalBalance: 5000 },
    ];

    const totalPaid: number = 20500;
    const monthlyPayment: number = 800;
    const projectedPayoffDate: Date = new Date('2026-09-15');

    const totalDebt = debts.reduce((sum, debt) => sum + debt.originalBalance, 0);
    const progress = (totalPaid / totalDebt) * 100;

    const chartData = debts.map(debt => ({
        name: debt.name,
        paid: debt.originalBalance - debt.balance,
        remaining: debt.balance
    }));

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: '0.875rem', color: 'text.secondary' }}>
                Debt Payment Progress
            </Typography>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Typography variant="body1" gutterBottom>Overall Progress</Typography>
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{ height: 10, borderRadius: 5, mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            ${totalPaid.toLocaleString()} paid of ${totalDebt.toLocaleString()} total debt
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="body1" gutterBottom>Monthly Payment</Typography>
                        <Typography variant="h5" fontWeight="bold" color="primary">
                            ${monthlyPayment.toLocaleString()}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="body1" gutterBottom>Projected Payoff Date</Typography>
                        <Typography variant="h5" fontWeight="bold" color="primary">
                            {projectedPayoffDate.toLocaleDateString()}
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="body1" gutterBottom>Individual Debt Progress</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={chartData}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="paid" stackId="a" fill="#82ca9d" name="Paid" />
                                <Bar dataKey="remaining" stackId="a" fill="#8884d8" name="Remaining" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default DebtPaymentProgress;