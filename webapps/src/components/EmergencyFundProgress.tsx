import React from 'react';
import { Box, Typography, Paper, Grid, LinearProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyContribution {
    month: string;
    contribution: number;
}

const EmergencyFundProgress: React.FC = () => {
    // Dummy data
    const currentFund = 5000;
    const targetFund = 15000;
    const monthlyGoal = 500;
    const monthsToGoal = Math.ceil((targetFund - currentFund) / monthlyGoal);
    const projectedCompletionDate = new Date();
    projectedCompletionDate.setMonth(projectedCompletionDate.getMonth() + monthsToGoal);

    const monthlyContributions: MonthlyContribution[] = [
        { month: 'Jan', contribution: 400 },
        { month: 'Feb', contribution: 550 },
        { month: 'Mar', contribution: 500 },
        { month: 'Apr', contribution: 600 },
        { month: 'May', contribution: 450 },
        { month: 'Jun', contribution: 500 },
    ];

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: '0.875rem', color: 'text.secondary' }}>
                Emergency Fund Progress
            </Typography>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Typography variant="body1" gutterBottom>Overall Progress</Typography>
                        <LinearProgress
                            variant="determinate"
                            value={(currentFund / targetFund) * 100}
                            sx={{ height: 10, borderRadius: 5, mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            ${currentFund.toLocaleString()} saved of ${targetFund.toLocaleString()} goal
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="body1" gutterBottom>Monthly Contribution Goal</Typography>
                        <Typography variant="h5" fontWeight="bold" color="primary">
                            ${monthlyGoal.toLocaleString()}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="body1" gutterBottom>Projected Completion Date</Typography>
                        <Typography variant="h5" fontWeight="bold" color="primary">
                            {projectedCompletionDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="body1" gutterBottom>Monthly Contributions</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={monthlyContributions}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="contribution" fill="#82ca9d" name="Contribution" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default EmergencyFundProgress;