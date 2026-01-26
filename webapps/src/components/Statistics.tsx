import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    Chip,
    Alert,
    Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import {BudgetStatistics, GroceryBudget, SpendingInsight} from "../config/Types";


interface Props {
    statistics: BudgetStatistics;
    insights: SpendingInsight[];
    budget: GroceryBudget;
}

export const Statistics: React.FC<Props> = ({ statistics, insights, budget }) => {
    const progressPercentage = ((budget.budgetAmount - statistics.remainingBudget) / budget.budgetAmount) * 100;

    const getHealthColor = (score: number) => {
        if (score >= 80) return 'success';
        if (score >= 60) return 'warning';
        return 'error';
    };

    const getProgressColor = (percentage: number) => {
        if (percentage > 100) return 'error';
        if (percentage > 80) return 'warning';
        return 'success';
    };

    return (
        <Box>
            {/* Key Metrics */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Total Spent
                            </Typography>
                            <Typography variant="h4" fontWeight="bold">
                                ${statistics.totalSpent.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Remaining
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="success.main">
                                ${statistics.remainingBudget.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Savings Goal
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="h4" fontWeight="bold" color={statistics.savingsGoalAchieved ? 'success.main' : 'warning.main'}>
                                    ${statistics.savingsAmount}
                                </Typography>
                                {statistics.savingsGoalAchieved && <CheckCircleIcon color="success" />}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Health Score
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color={`${getHealthColor(statistics.healthScore)}.main`}>
                                {statistics.healthScore}/100
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Budget Progress */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Budget Progress
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(progressPercentage, 100)}
                        color={getProgressColor(progressPercentage)}
                        sx={{ height: 10, borderRadius: 5, mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                        {progressPercentage.toFixed(1)}% of budget used
                    </Typography>
                </CardContent>
            </Card>

            {/* Top Items */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Top 5 Most Purchased Items
                    </Typography>
                    <List>
                        {statistics.topFiveItems.map((item, idx) => (
                            <ListItem
                                key={idx}
                                sx={{ bgcolor: 'grey.50', mb: 1, borderRadius: 1 }}
                            >
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mr: 2,
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {idx + 1}
                                </Box>
                                <ListItemText
                                    primary={item.name}
                                    secondary={`Purchased ${item.count} times`}
                                />
                            </ListItem>
                        ))}
                    </List>
                </CardContent>
            </Card>

            {/* Spending Insights */}
            {insights.length > 0 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Spending Insights
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {insights.map((insight, idx) => (
                                <Alert
                                    key={idx}
                                    severity={
                                        insight.suggestion === 'overspending' ? 'error' :
                                            insight.suggestion === 'underspending' ? 'success' :
                                                'info'
                                    }
                                    icon={
                                        insight.suggestion === 'overspending' ? <TrendingUpIcon /> :
                                            insight.suggestion === 'underspending' ? <TrendingDownIcon /> :
                                                <WarningIcon />
                                    }
                                >
                                    <Typography fontWeight="bold" gutterBottom>
                                        {insight.category}
                                    </Typography>
                                    <Typography variant="body2" gutterBottom>
                                        {insight.message}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Current: ${insight.currentSpending.toFixed(2)} |
                                        Average: ${insight.averageSpending.toFixed(2)}
                                    </Typography>
                                </Alert>
                            ))}
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};