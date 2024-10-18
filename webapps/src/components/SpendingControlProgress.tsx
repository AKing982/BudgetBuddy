import React from 'react';
import { Box, Typography, Paper, LinearProgress, Grid } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SpendingCategory {
    name: string;
    spent: number;
    limit: number;
}

const SpendingControlProgress: React.FC = () => {
    // Dummy data
    const categories: SpendingCategory[] = [
        { name: 'Housing', spent: 1200, limit: 1500 },
        { name: 'Food', spent: 450, limit: 500 },
        { name: 'Transportation', spent: 200, limit: 300 },
        { name: 'Entertainment', spent: 180, limit: 150 },
        { name: 'Utilities', spent: 220, limit: 250 },
    ];

    const totalSpent = categories.reduce((sum, category) => sum + category.spent, 0);
    const totalLimit = categories.reduce((sum, category) => sum + category.limit, 0);
    const overallProgress = (totalSpent / totalLimit) * 100;

    const daysInMonth = 30; // Simplified for example
    const currentDay = 20; // Simplified for example
    const idealSpendingRate = (currentDay / daysInMonth) * 100;

    const chartData = categories.map(category => ({
        name: category.name,
        spent: category.spent,
        limit: category.limit,
    }));

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: '0.875rem', color: 'text.secondary' }}>
                Spending Control Progress
            </Typography>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Typography variant="body1" gutterBottom>Overall Spending Progress</Typography>
                        <LinearProgress
                            variant="determinate"
                            value={overallProgress}
                            sx={{ height: 10, borderRadius: 5, mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            ${totalSpent.toLocaleString()} spent of ${totalLimit.toLocaleString()} total limit
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="body1" gutterBottom>Spending Rate</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ flexGrow: 1, mr: 1 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={idealSpendingRate}
                                    sx={{ height: 10, borderRadius: 5 }}
                                />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                                <Typography variant="body2" color="text.secondary">{idealSpendingRate.toFixed(0)}%</Typography>
                            </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Ideal spending rate based on current date
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="body1" gutterBottom>Category Spending vs Limits</Typography>
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
                                <Bar dataKey="spent" fill="#8884d8" name="Spent" />
                                <Bar dataKey="limit" fill="#82ca9d" name="Limit" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default SpendingControlProgress;