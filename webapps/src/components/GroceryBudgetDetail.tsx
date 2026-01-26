import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    IconButton,
    Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { ManualItemEntry } from './ManualItemEntry';
import { ReceiptUpload } from './ReceiptUpload';
import { Statistics } from './Statistics';
import {BudgetStatistics, GroceryBudget, SpendingInsight} from "../config/Types";
import GroceryService from "../services/GroceryService";

interface Props {
    budget: GroceryBudget;
    onBack: () => void;
}

type Mode = 'view' | 'manual' | 'receipt';

export const GroceryBudgetDetail: React.FC<Props> = ({ budget, onBack }) => {
    const [mode, setMode] = useState<Mode>('view');
    const [statistics, setStatistics] = useState<BudgetStatistics | null>(null);
    const [insights, setInsights] = useState<SpendingInsight[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (budget.id) {
            loadStatistics();
            loadInsights();
        }
    }, [budget.id]);

    const loadStatistics = async () => {
        if (!budget.id) return;
        try {
            const stats = await GroceryService.getBudgetStatistics(budget.id);
            setStatistics(stats);
        } catch (err) {
            console.error('Failed to load statistics');
        }
    };

    const loadInsights = async () => {
        if (!budget.id) return;
        try {
            const insights = await GroceryService.getSpendingInsights(budget.id, 'week');
            setInsights(insights);
        } catch (err) {
            console.error('Failed to load insights');
        }
    };

    const handleManualEntry = async (items: any[]) => {
        if (!budget.id) return;
        setLoading(true);
        try {
            await GroceryService.addManualPurchase(budget.id, items);
            setMode('view');
            loadStatistics();
            loadInsights();
        } catch (err) {
            console.error('Failed to add items');
        } finally {
            setLoading(false);
        }
    };

    const handleReceiptUpload = async (file: File) => {
        if (!budget.id) return;
        setLoading(true);
        try {
            await GroceryService.uploadReceipt(budget.id, file);
            setMode('view');
            loadStatistics();
            loadInsights();
        } catch (err) {
            console.error('Failed to upload receipt');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            {/* Header */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <IconButton onClick={onBack} sx={{ mb: 2 }}>
                        <ArrowBackIcon />
                    </IconButton>

                    <Grid container justifyContent="space-between" alignItems="start">
                        <Grid item>
                            <Typography variant="h4" fontWeight="bold">
                                {budget.subBudgetId}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                {budget.startDate} - {budget.endDate}
                            </Typography>
                        </Grid>
                        <Grid item sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="text.secondary">
                                Budget Amount
                            </Typography>
                            <Typography variant="h3" fontWeight="bold" color="success.main">
                                ${budget.budgetAmount}
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Mode Selection */}
            {mode === 'view' && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Add Purchases
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Card
                                    sx={{
                                        p: 3,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        border: 2,
                                        borderColor: 'divider',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: 'primary.50'
                                        }
                                    }}
                                    onClick={() => setMode('manual')}
                                >
                                    <EditIcon sx={{ fontSize: 48, mb: 1, color: 'primary.main' }} />
                                    <Typography variant="h6" fontWeight="bold">
                                        Manual Entry
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Enter items manually
                                    </Typography>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Card
                                    sx={{
                                        p: 3,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        border: 2,
                                        borderColor: 'divider',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: 'primary.50'
                                        }
                                    }}
                                    onClick={() => setMode('receipt')}
                                >
                                    <ReceiptIcon sx={{ fontSize: 48, mb: 1, color: 'primary.main' }} />
                                    <Typography variant="h6" fontWeight="bold">
                                        Scan Receipt
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Upload receipt image
                                    </Typography>
                                </Card>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* Manual Entry Mode */}
            {mode === 'manual' && (
                <ManualItemEntry
                    onSubmit={handleManualEntry}
                    onCancel={() => setMode('view')}
                    loading={loading}
                />
            )}

            {/* Receipt Upload Mode */}
            {mode === 'receipt' && (
                <ReceiptUpload
                    onUpload={handleReceiptUpload}
                    onCancel={() => setMode('view')}
                    loading={loading}
                />
            )}

            {/* Statistics */}
            {mode === 'view' && statistics && (
                <Statistics
                    statistics={statistics}
                    insights={insights}
                    budget={budget}
                />
            )}
        </Box>
    );
};