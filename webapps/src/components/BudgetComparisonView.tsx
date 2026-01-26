import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Grid,
    Divider,
    CircularProgress,
    Alert
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import {GroceryBudget} from "../config/Types";

import type {BudgetComparison} from "../config/Types";
import GroceryService from "../services/GroceryService";

interface Props {
    budgets: GroceryBudget[];
}

export const BudgetComparisonView: React.FC<Props> = ({ budgets }) => {
    const [budget1Id, setBudget1Id] = useState(1);
    const [budget2Id, setBudget2Id] = useState(2);
    const [comparison, setComparison] = useState<BudgetComparison | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCompare = async () => {
        if (!budget1Id || !budget2Id) return;

        setLoading(true);
        try {
            const result = await GroceryService.compareBudgets(budget1Id, budget2Id);
            setComparison(result);
        } catch (err) {
            console.error('Failed to compare budgets');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Compare Budgets
                </Typography>

                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Budget 1</InputLabel>
                            <Select
                                value={budget1Id}
                                label="Budget 1"
                                onChange={(e) => setBudget1Id(Number(e.target.value))}
                            >
                                <MenuItem value="">
                                    <em>Select Budget</em>
                                </MenuItem>
                                {budgets.map(budget => (
                                    <MenuItem key={budget.id} value={budget.id}>
                                        {budget.subBudgetId} - ${budget.budgetAmount}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Budget 2</InputLabel>
                            <Select
                                value={budget2Id}
                                label="Budget 2"
                                onChange={(e) => setBudget2Id(Number(e.target.value))}
                            >
                                <MenuItem value="">
                                    <em>Select Budget</em>
                                </MenuItem>
                                {budgets.map(budget => (
                                    <MenuItem key={budget.id} value={budget.id}>
                                        {budget.subBudgetId} - ${budget.budgetAmount}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CompareArrowsIcon />}
                    onClick={handleCompare}
                    disabled={!budget1Id || !budget2Id || loading}
                >
                    {loading ? 'Comparing...' : 'Compare Budgets'}
                </Button>

                {comparison && (
                    <Box sx={{ mt: 4 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Card sx={{ bgcolor: 'primary.50' }}>
                                    <CardContent>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                                            Budget 1
                                        </Typography>
                                        <Divider sx={{ my: 2 }} />
                                        <Box display="flex" justifyContent="space-between" sx={{ mb: 2 }}>
                                            <Typography>Total Spent:</Typography>
                                            <Typography fontWeight="bold">
                                                ${comparison.budget1.totalSpent}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography>Savings:</Typography>
                                            <Typography fontWeight="bold">
                                                {comparison.budget1.savingsPercentage}%
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Card sx={{ bgcolor: 'success.50' }}>
                                    <CardContent>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                                            Budget 2
                                        </Typography>
                                        <Divider sx={{ my: 2 }} />
                                        <Box display="flex" justifyContent="space-between" sx={{ mb: 2 }}>
                                            <Typography>Total Spent:</Typography>
                                            <Typography fontWeight="bold">
                                                ${comparison.budget2.totalSpent}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography>Savings:</Typography>
                                            <Typography fontWeight="bold">
                                                {comparison.budget2.savingsPercentage}%
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Card sx={{ mt: 3, bgcolor: 'grey.50' }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Comparison Summary
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <Box display="flex" justifyContent="space-between" sx={{ mb: 2 }}>
                                    <Typography>Spending Difference:</Typography>
                                    <Typography
                                        fontWeight="bold"
                                        color={comparison.spendingDifference > 0 ? 'error.main' : 'success.main'}
                                    >
                                        {comparison.spendingDifference > 0 ? '+' : ''}
                                        {comparison.spendingDifference}%
                                    </Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography>Savings Difference:</Typography>
                                    <Typography
                                        fontWeight="bold"
                                        color={comparison.savingsDifference > 0 ? 'success.main' : 'error.main'}
                                    >
                                        {comparison.savingsDifference > 0 ? '+' : ''}
                                        {comparison.savingsDifference}%
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};