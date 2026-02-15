import React from 'react';
import {
    Box,
    Typography,
    Card,
    Stack,
    Skeleton,
    LinearProgress,
    Chip,
    alpha,
    useTheme,
    Divider
} from '@mui/material';
import { TrendingUp, TrendingDown, Repeat, Star } from 'lucide-react';

interface BudgetCategory {
    categoryName: string;
    budgetedAmount: number;
    actualAmount: number;
    remainingAmount: number;
    isRecurring: boolean;
    isCustom: boolean;
}

interface BudgetCategoriesPanelProps {
    isLoading: boolean;
    categories: BudgetCategory[];
}

const BudgetCategoriesPanel: React.FC<BudgetCategoriesPanelProps> = ({ isLoading, categories }) => {
    const theme = useTheme();

    const formatCurrency = (amount: number): string => {
        const absAmount = Math.abs(amount);
        const formatted = absAmount.toFixed(2);
        return amount < 0 ? `-$${formatted}` : `$${formatted}`;
    };

    const calculatePercentage = (actual: number, budgeted: number): number => {
        if (budgeted === 0) return 0;
        return Math.min((actual / budgeted) * 100, 100);
    };

    const recurringCategories = categories.filter(cat => cat.isRecurring);
    const customCategories = categories.filter(cat => cat.isCustom);

    const renderCategoryCard = (category: BudgetCategory) => {
        const percentage = calculatePercentage(category.actualAmount, category.budgetedAmount);
        const isOverBudget = category.actualAmount > category.budgetedAmount;
        const isNearLimit = percentage >= 80 && !isOverBudget;

        return (
            <Card
                key={category.categoryName}
                sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s ease-in-out'
                    }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                                {category.categoryName}
                            </Typography>
                            {category.isRecurring && (
                                <Chip
                                    icon={<Repeat size={12} />}
                                    label="Recurring"
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.65rem',
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main,
                                        '& .MuiChip-icon': {
                                            color: theme.palette.primary.main,
                                            fontSize: 12
                                        }
                                    }}
                                />
                            )}
                            {category.isCustom && (
                                <Chip
                                    icon={<Star size={12} />}
                                    label="Custom"
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.65rem',
                                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                                        color: theme.palette.warning.main,
                                        '& .MuiChip-icon': {
                                            color: theme.palette.warning.main,
                                            fontSize: 12
                                        }
                                    }}
                                />
                            )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            Budget: {formatCurrency(category.budgetedAmount)}
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight={600} color={isOverBudget ? 'error.main' : 'text.primary'}>
                            {formatCurrency(category.actualAmount)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            spent
                        </Typography>
                    </Box>
                </Box>

                <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.divider, 0.2),
                        mb: 1,
                        '& .MuiLinearProgress-bar': {
                            bgcolor: isOverBudget
                                ? theme.palette.error.main
                                : isNearLimit
                                    ? theme.palette.warning.main
                                    : theme.palette.success.main,
                            borderRadius: 3
                        }
                    }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        {category.remainingAmount >= 0 ? 'Remaining' : 'Over budget'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {isOverBudget ? (
                            <TrendingUp size={14} color={theme.palette.error.main} style={{ transform: 'rotate(180deg)' }} />
                        ) : (
                            <TrendingUp size={14} color={theme.palette.success.main} />
                        )}
                        <Typography
                            variant="caption"
                            fontWeight={600}
                            color={isOverBudget ? 'error.main' : 'success.main'}
                        >
                            {formatCurrency(Math.abs(category.remainingAmount))}
                        </Typography>
                    </Box>
                </Box>
            </Card>
        );
    };

    if (isLoading) {
        return (
            <Stack spacing={2}>
                {[1, 2, 3].map((i) => (
                    <Card key={i} sx={{ p: 2, borderRadius: 2 }}>
                        <Skeleton variant="text" width="60%" height={20} />
                        <Skeleton variant="text" width="40%" height={16} sx={{ mt: 1 }} />
                        <Skeleton variant="rectangular" height={6} sx={{ mt: 2, mb: 1, borderRadius: 3 }} />
                        <Skeleton variant="text" width="30%" height={14} />
                    </Card>
                ))}
            </Stack>
        );
    }

    if (!categories || categories.length === 0) {
        return (
            <Box
                sx={{
                    p: 4,
                    textAlign: 'center',
                    bgcolor: alpha(theme.palette.divider, 0.05),
                    borderRadius: 2,
                    border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    No budget categories found for this period
                </Typography>
            </Box>
        );
    }

    return (
        <Stack spacing={3}>
            {recurringCategories.length > 0 && (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Repeat size={18} color={theme.palette.primary.main} />
                        <Typography variant="subtitle1" fontWeight={600}>
                            Recurring Categories
                        </Typography>
                        <Chip
                            label={recurringCategories.length}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main
                            }}
                        />
                    </Box>
                    <Stack spacing={2}>
                        {recurringCategories.map(renderCategoryCard)}
                    </Stack>
                </Box>
            )}

            {customCategories.length > 0 && (
                <Box>
                    {recurringCategories.length > 0 && <Divider sx={{ my: 2 }} />}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Star size={18} color={theme.palette.warning.main} />
                        <Typography variant="subtitle1" fontWeight={600}>
                            Custom Categories
                        </Typography>
                        <Chip
                            label={customCategories.length}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                color: theme.palette.warning.main
                            }}
                        />
                    </Box>
                    <Stack spacing={2}>
                        {customCategories.map(renderCategoryCard)}
                    </Stack>
                </Box>
            )}
        </Stack>
    );
};

export default BudgetCategoriesPanel;