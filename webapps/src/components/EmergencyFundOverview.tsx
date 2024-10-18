import React from 'react';
import { Box, Typography, Paper, Grid, LinearProgress } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import Sidebar from "./Sidebar";

interface SavingsCategory {
    name: string;
    amount: number;
    target: number;
}

const COLORS: string[] = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const EmergencyFundOverview: React.FC = () => {
    // Dummy data
    const emergencyFund: SavingsCategory = { name: 'Emergency Fund', amount: 5000, target: 15000 };
    const otherSavings: SavingsCategory[] = [
        { name: 'Retirement', amount: 20000, target: 50000 },
        { name: 'Vacation', amount: 1500, target: 3000 },
        { name: 'New Car', amount: 3000, target: 10000 },
    ];

    const allSavings = [emergencyFund, ...otherSavings];
    const totalSavings = allSavings.reduce((sum, category) => sum + category.amount, 0);

    const pieChartData = allSavings.map(category => ({
        name: category.name,
        value: category.amount
    }));

    return (
        <Box>
            <Sidebar />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: '0.875rem', color: 'text.secondary' }}>
                Emergency Fund Overview
            </Typography>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h4" fontWeight="bold">
                            ${emergencyFund.amount.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Current Emergency Fund
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={(emergencyFund.amount / emergencyFund.target) * 100}
                            sx={{ height: 10, borderRadius: 5, mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            {((emergencyFund.amount / emergencyFund.target) * 100).toFixed(1)}% of ${emergencyFund.target.toLocaleString()} goal
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={pieChartData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    label
                                >
                                    {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="body1" gutterBottom>Total Savings Breakdown</Typography>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            ${totalSavings.toLocaleString()}
                        </Typography>
                        {allSavings.map((category, index) => (
                            <Box key={index} sx={{ mb: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                    {category.name}: ${category.amount.toLocaleString()} of ${category.target.toLocaleString()}
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={(category.amount / category.target) * 100}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                            </Box>
                        ))}
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default EmergencyFundOverview;