import React, { useState } from 'react';
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
    Divider,
    ToggleButtonGroup,
    ToggleButton,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    Repeat,
    Star,
    PieChart as PieChartIcon,
    BarChart3,
    List,
    DollarSign,
    Activity
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface BudgetCategory {
    categoryName: string;
    budgetedAmount: number;
    actualAmount: number;
    remainingAmount: number;
    isRecurring?: boolean;
    isCustom?: boolean;
}

interface BudgetOverviewCategory {
    category: string;
    budgetedExpenses: number;
    actualExpenses: number;
    remainingExpenses: number;
}

interface BudgetStats {
    totalBudget: number;
    totalSpent: number;
    totalSaved: number;
    remaining: number;
    healthScore: number;
}

interface DynamicBudgetPanelProps {
    isLoading: boolean;
    topSpendingCategories: BudgetCategory[];
    overviewCategories: BudgetOverviewCategory[];
    recurringCategories: BudgetCategory[];
    budgetStats: BudgetStats;
    allCategories: BudgetCategory[];
}

type ViewMode = 'recurring' | 'stats' | 'individual';

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#ea580c', '#0d9488', '#f97316', '#8b5cf6', '#10b981'];
const maroonColor = '#800000';
const tealColor = '#0d9488';

const DynamicBudgetPanel: React.FC<DynamicBudgetPanelProps> = ({
                                                                   isLoading,
                                                                   topSpendingCategories,
                                                                   overviewCategories,
                                                                   recurringCategories,
                                                                   budgetStats,
                                                                   allCategories
                                                               }) => {
    const theme = useTheme();
    const [viewMode, setViewMode] = useState<ViewMode>('recurring');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [individualViewType, setIndividualViewType] = useState<'pie' | 'line' | 'numeric'>('pie');

    const formatCurrency = (amount: number): string => {
        const absAmount = Math.abs(amount);
        const formatted = absAmount.toFixed(2);
        return amount < 0 ? `-$${formatted}` : `$${formatted}`;
    };

    const calculatePercentage = (actual: number, budgeted: number): number => {
        if (budgeted === 0) return 0;
        return Math.min((actual / budgeted) * 100, 100);
    };

    const getProgressColor = (percent: number) => {
        if (percent < 70) return tealColor;
        if (percent < 90) return '#f59e0b';
        return '#dc2626';
    };

    const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
        if (newMode !== null) {
            setViewMode(newMode);
            if (newMode === 'individual' && allCategories.length > 0) {
                setSelectedCategory(allCategories[0].categoryName);
            }
        }
    };

    const renderCategoryCard = (category: BudgetCategory | BudgetOverviewCategory) => {
        const categoryName = 'categoryName' in category ? category.categoryName : category.category;
        const budgeted = 'budgetedAmount' in category ? category.budgetedAmount : category.budgetedExpenses;
        const actual = 'actualAmount' in category ? category.actualAmount : category.actualExpenses;
        const remaining = 'remainingAmount' in category ? category.remainingAmount : category.remainingExpenses;
        const isRecurring = 'isRecurring' in category ? category.isRecurring : false;
        const isCustom = 'isCustom' in category ? category.isCustom : false;

        const percentage = calculatePercentage(actual, budgeted);
        const isOverBudget = actual > budgeted;
        const isNearLimit = percentage >= 80 && !isOverBudget;

        return (
            <Card
                key={categoryName}
                sx={{
                    p: 2.5,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${getProgressColor(percentage)}05 0%, ${getProgressColor(percentage)}02 100%)`,
                    border: `1px solid ${alpha(getProgressColor(percentage), 0.2)}`,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        transform: 'translateY(-2px)',
                        borderColor: alpha(getProgressColor(percentage), 0.4)
                    }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                                {categoryName}
                            </Typography>
                            {isRecurring && (
                                <Chip
                                    icon={<Repeat size={10} />}
                                    label="Recurring"
                                    size="small"
                                    sx={{
                                        height: 18,
                                        fontSize: '0.6rem',
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main,
                                        fontWeight: 600,
                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                        '& .MuiChip-icon': {
                                            color: theme.palette.primary.main,
                                            fontSize: 10
                                        }
                                    }}
                                />
                            )}
                            {isCustom && (
                                <Chip
                                    icon={<Star size={10} />}
                                    label="Custom"
                                    size="small"
                                    sx={{
                                        height: 18,
                                        fontSize: '0.6rem',
                                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                                        color: theme.palette.warning.main,
                                        fontWeight: 600,
                                        border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                                        '& .MuiChip-icon': {
                                            color: theme.palette.warning.main,
                                            fontSize: 10
                                        }
                                    }}
                                />
                            )}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Budget: {formatCurrency(budgeted)}
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            color={isOverBudget ? '#dc2626' : maroonColor}
                            sx={{ fontSize: '1.1rem' }}
                        >
                            {formatCurrency(actual)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            spent
                        </Typography>
                    </Box>
                </Box>

                <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: `${getProgressColor(percentage)}20`,
                        mb: 1.5,
                        '& .MuiLinearProgress-bar': {
                            bgcolor: getProgressColor(percentage),
                            borderRadius: 4
                        }
                    }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {remaining >= 0 ? 'Remaining' : 'Over budget'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {isOverBudget ? (
                            <TrendingUp size={14} color="#dc2626" style={{ transform: 'rotate(180deg)' }} />
                        ) : (
                            <TrendingUp size={14} color="#059669" />
                        )}
                        <Typography
                            variant="caption"
                            fontWeight={600}
                            color={isOverBudget ? '#dc2626' : '#059669'}
                            sx={{ fontSize: '0.75rem' }}
                        >
                            {formatCurrency(Math.abs(remaining))}
                        </Typography>
                    </Box>
                </Box>
            </Card>
        );
    };

    const renderTopSpending = () => {
        if (topSpendingCategories.length === 0) {
            return (
                <Box sx={{
                    textAlign: 'center',
                    py: 6,
                    px: 3,
                    background: alpha(theme.palette.divider, 0.02),
                    borderRadius: 2,
                    border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`
                }}>
                    <BarChart3 size={48} color={theme.palette.text.disabled} style={{ marginBottom: 16 }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        No top spending categories available
                    </Typography>
                </Box>
            );
        }

        return (
            <Stack spacing={2}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Top {topSpendingCategories.length} Categories
                </Typography>
                {topSpendingCategories.map(category => renderCategoryCard(category))}
            </Stack>
        );
    };

    const renderOverview = () => {
        if (overviewCategories.length === 0) {
            return (
                <Box sx={{
                    textAlign: 'center',
                    py: 6,
                    px: 3,
                    background: alpha(theme.palette.divider, 0.02),
                    borderRadius: 2,
                    border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`
                }}>
                    <Activity size={48} color={theme.palette.text.disabled} style={{ marginBottom: 16 }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        No overview categories available
                    </Typography>
                </Box>
            );
        }

        return (
            <Stack spacing={2}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Budget Overview
                </Typography>
                {overviewCategories.map(category => renderCategoryCard(category))}
            </Stack>
        );
    };

    const renderRecurring = () => {
        if (recurringCategories.length === 0) {
            return (
                <Box sx={{
                    textAlign: 'center',
                    py: 6,
                    px: 3,
                    background: alpha(theme.palette.divider, 0.02),
                    borderRadius: 2,
                    border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`
                }}>
                    <Repeat size={48} color={theme.palette.text.disabled} style={{ marginBottom: 16 }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        No recurring categories found
                    </Typography>
                </Box>
            );
        }

        return (
            <Stack spacing={2}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {recurringCategories.length} Recurring Categories
                </Typography>
                {recurringCategories.map(category => renderCategoryCard(category))}
            </Stack>
        );
    };

    const renderStats = () => {
        const pieData = [
            { name: 'Spent', value: budgetStats.totalSpent, color: '#7c3aed' },
            { name: 'Saved', value: budgetStats.totalSaved, color: '#0d9488' },
            { name: 'Remaining', value: budgetStats.remaining > 0 ? budgetStats.remaining : 0, color: '#059669' }
        ].filter(item => item.value > 0);

        const percentSpent = (budgetStats.totalSpent / budgetStats.totalBudget) * 100;

        return (
            <Stack spacing={3}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Budget Statistics
                </Typography>

                {/* Overall Progress */}
                <Card sx={{
                    p: 2.5,
                    background: `linear-gradient(135deg, ${getProgressColor(percentSpent)}10 0%, ${getProgressColor(percentSpent)}05 100%)`,
                    border: `1px solid ${alpha(getProgressColor(percentSpent), 0.2)}`
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            Total Spending
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color={maroonColor}>
                            {percentSpent.toFixed(0)}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(percentSpent, 100)}
                        sx={{
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: `${getProgressColor(percentSpent)}20`,
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: getProgressColor(percentSpent),
                                borderRadius: 5
                            }
                        }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            ${budgetStats.totalSpent.toFixed(2)} spent
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            ${budgetStats.totalBudget.toFixed(2)} total
                        </Typography>
                    </Box>
                </Card>

                <Divider sx={{ my: 2 }} />

                {/* Pie Chart */}
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, mb: 2, display: 'block' }}>
                        Budget Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={75}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                        </PieChart>
                    </ResponsiveContainer>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Stats Grid - Moved Below Pie Chart */}
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, mb: 2, display: 'block' }}>
                    Budget Stats
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Box sx={{
                            p: 2,
                            borderRadius: 2,
                            background: alpha('#2563eb', 0.05),
                            border: `1px solid ${alpha('#2563eb', 0.2)}`
                        }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                                Total Budget
                            </Typography>
                            <Typography variant="h6" fontWeight={700} color="#2563eb">
                                ${budgetStats.totalBudget.toLocaleString()}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box sx={{
                            p: 2,
                            borderRadius: 2,
                            background: alpha('#dc2626', 0.05),
                            border: `1px solid ${alpha('#dc2626', 0.2)}`
                        }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                                Total Spent
                            </Typography>
                            <Typography variant="h6" fontWeight={700} color="#dc2626">
                                ${budgetStats.totalSpent.toLocaleString()}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box sx={{
                            p: 2,
                            borderRadius: 2,
                            background: alpha(tealColor, 0.05),
                            border: `1px solid ${alpha(tealColor, 0.2)}`
                        }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                                Total Saved
                            </Typography>
                            <Typography variant="h6" fontWeight={700} color={tealColor}>
                                ${budgetStats.totalSaved.toLocaleString()}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box sx={{
                            p: 2,
                            borderRadius: 2,
                            background: alpha('#059669', 0.05),
                            border: `1px solid ${alpha('#059669', 0.2)}`
                        }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                                Remaining
                            </Typography>
                            <Typography variant="h6" fontWeight={700} color="#059669">
                                ${budgetStats.remaining.toLocaleString()}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Stack>
        );
    };

    const renderIndividual = () => {
        if (allCategories.length === 0) {
            return (
                <Box sx={{
                    textAlign: 'center',
                    py: 6,
                    px: 3,
                    background: alpha(theme.palette.divider, 0.02),
                    borderRadius: 2,
                    border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`
                }}>
                    <DollarSign size={48} color={theme.palette.text.disabled} style={{ marginBottom: 16 }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        No categories available
                    </Typography>
                </Box>
            );
        }

        const category = allCategories.find(cat => cat.categoryName === selectedCategory) || allCategories[0];
        const percentage = calculatePercentage(category.actualAmount, category.budgetedAmount);

        const pieData = [
            { name: 'Spent', value: category.actualAmount, color: '#7c3aed' },
            { name: 'Remaining', value: category.remainingAmount > 0 ? category.remainingAmount : 0, color: '#059669' }
        ].filter(item => item.value > 0);

        return (
            <Stack spacing={3}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Category Details
                </Typography>

                {/* Category Selector */}
                <FormControl fullWidth size="small">
                    <InputLabel>Select Category</InputLabel>
                    <Select
                        value={selectedCategory || (allCategories[0]?.categoryName || '')}
                        label="Select Category"
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        {allCategories.map(cat => (
                            <MenuItem key={cat.categoryName} value={cat.categoryName}>
                                {cat.categoryName}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* View Type Toggle */}
                <ToggleButtonGroup
                    value={individualViewType}
                    exclusive
                    onChange={(e, newType) => newType && setIndividualViewType(newType)}
                    size="small"
                    fullWidth
                    sx={{
                        '& .MuiToggleButton-root': {
                            py: 1,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'none'
                        }
                    }}
                >
                    <ToggleButton value="pie">
                        <PieChartIcon size={14} style={{ marginRight: 6 }} /> Pie Chart
                    </ToggleButton>
                    <ToggleButton value="line">
                        <BarChart3 size={14} style={{ marginRight: 6 }} /> Bar Chart
                    </ToggleButton>
                    <ToggleButton value="numeric">
                        <DollarSign size={14} style={{ marginRight: 6 }} /> Numbers
                    </ToggleButton>
                </ToggleButtonGroup>

                <Divider />

                {/* Individual View Content */}
                {individualViewType === 'pie' && (
                    <Box>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={75}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>
                )}

                {individualViewType === 'line' && (
                    <Box>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={[
                                { name: 'Budgeted', amount: category.budgetedAmount },
                                { name: 'Actual', amount: category.actualAmount },
                                { name: 'Remaining', amount: category.remainingAmount > 0 ? category.remainingAmount : 0 }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                                <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb', r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                )}

                {individualViewType === 'numeric' && (
                    <Stack spacing={2}>
                        <Box sx={{
                            p: 2.5,
                            borderRadius: 2,
                            background: alpha('#2563eb', 0.05),
                            border: `1px solid ${alpha('#2563eb', 0.2)}`
                        }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Budgeted Amount
                            </Typography>
                            <Typography variant="h4" fontWeight={700} color="#2563eb">
                                {formatCurrency(category.budgetedAmount)}
                            </Typography>
                        </Box>
                        <Box sx={{
                            p: 2.5,
                            borderRadius: 2,
                            background: alpha('#dc2626', 0.05),
                            border: `1px solid ${alpha('#dc2626', 0.2)}`
                        }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Actual Spent
                            </Typography>
                            <Typography variant="h4" fontWeight={700} color="#dc2626">
                                {formatCurrency(category.actualAmount)}
                            </Typography>
                        </Box>
                        <Box sx={{
                            p: 2.5,
                            borderRadius: 2,
                            background: alpha(category.remainingAmount >= 0 ? '#059669' : '#dc2626', 0.05),
                            border: `1px solid ${alpha(category.remainingAmount >= 0 ? '#059669' : '#dc2626', 0.2)}`
                        }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                {category.remainingAmount >= 0 ? 'Remaining' : 'Over Budget'}
                            </Typography>
                            <Typography variant="h4" fontWeight={700} color={category.remainingAmount >= 0 ? '#059669' : '#dc2626'}>
                                {formatCurrency(Math.abs(category.remainingAmount))}
                            </Typography>
                        </Box>
                    </Stack>
                )}

                <Divider />

                {/* Category Progress */}
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, mb: 2, display: 'block' }}>
                        Progress Tracking
                    </Typography>
                    <Card sx={{
                        p: 2.5,
                        background: `linear-gradient(135deg, ${getProgressColor(percentage)}10 0%, ${getProgressColor(percentage)}05 100%)`,
                        border: `1px solid ${alpha(getProgressColor(percentage), 0.2)}`
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                Budget Usage
                            </Typography>
                            <Typography variant="h6" fontWeight={700} color={getProgressColor(percentage)}>
                                {percentage.toFixed(0)}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{
                                height: 10,
                                borderRadius: 5,
                                bgcolor: `${getProgressColor(percentage)}20`,
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: getProgressColor(percentage),
                                    borderRadius: 5
                                }
                            }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {category.actualAmount > category.budgetedAmount
                                ? `Over budget by ${formatCurrency(category.actualAmount - category.budgetedAmount)}`
                                : percentage >= 90
                                    ? 'Near budget limit - monitor spending'
                                    : percentage >= 70
                                        ? 'On track with spending'
                                        : 'Well within budget'}
                        </Typography>
                    </Card>
                </Box>
            </Stack>
        );
    };

    if (isLoading) {
        return (
            <Stack spacing={2}>
                {[1, 2, 3].map((i) => (
                    <Card key={i} sx={{ p: 2.5, borderRadius: 2 }}>
                        <Skeleton variant="text" width="60%" height={24} />
                        <Skeleton variant="text" width="40%" height={18} sx={{ mt: 1 }} />
                        <Skeleton variant="rectangular" height={8} sx={{ mt: 2, mb: 1, borderRadius: 4 }} />
                        <Skeleton variant="text" width="30%" height={16} />
                    </Card>
                ))}
            </Stack>
        );
    }

    return (
        <Stack spacing={3}>
            {/* View Mode Toggle */}
            <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
                fullWidth
                sx={{
                    '& .MuiToggleButton-root': {
                        fontSize: '0.75rem',
                        py: 0.75,
                        px: 1.5,
                        fontWeight: 600,
                        textTransform: 'none',
                        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                        '&.Mui-selected': {
                            bgcolor: alpha(maroonColor, 0.1),
                            color: maroonColor,
                            borderColor: alpha(maroonColor, 0.4),
                            '&:hover': {
                                bgcolor: alpha(maroonColor, 0.15)
                            }
                        }
                    }
                }}
            >
                <ToggleButton value="recurring">
                    <Repeat size={14} style={{ marginRight: 6 }} /> Recurring
                </ToggleButton>
                <ToggleButton value="stats">
                    <PieChartIcon size={14} style={{ marginRight: 6 }} /> Stats
                </ToggleButton>
                <ToggleButton value="individual">
                    <DollarSign size={14} style={{ marginRight: 6 }} /> Category
                </ToggleButton>
            </ToggleButtonGroup>

            {/* Content Area */}
            <Box>
                {viewMode === 'recurring' && renderRecurring()}
                {viewMode === 'stats' && renderStats()}
                {viewMode === 'individual' && renderIndividual()}
            </Box>
        </Stack>
    );
};

export default DynamicBudgetPanel;