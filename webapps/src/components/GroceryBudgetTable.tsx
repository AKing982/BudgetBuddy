import React, { useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    LinearProgress,
    Chip,
    Card,
    CardContent,
    Grid,
    Stack,
    Tooltip,
    alpha,
    Collapse,
    Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StoreIcon from '@mui/icons-material/Store';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SavingsIcon from '@mui/icons-material/Savings';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import { startOfWeek, endOfWeek, format, parseISO, isWithinInterval, addWeeks, differenceInWeeks } from 'date-fns';
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import {GroceryBudgetWithTotals, GroceryItem} from "../config/Types";
import {ViewMode} from "./GroceryTracker";

const maroonColor = '#800000';
const tealColor = '#0d9488';

interface GroceryBudgetTableProps {
    budget?: GroceryBudgetWithTotals;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    onReceiptSelect?: (receipt: ReceiptSummary) => void;
    onWeekSelect?: (week: WeekData) => void;
}

export interface ReceiptSummary {
    id: string;
    storeName: string;
    purchaseDate: string;
    itemCount: number;
    totalCost: number;
    items: GroceryItem[];
    weekNumber: number;
    weekLabel: string;
}

export interface WeekData {
    weekNumber: number;
    weekLabel: string;
    startDate: Date;
    endDate: Date;
    budgetAmount: number;
    actualSpent: number;
    remaining: number;
    percentUsed: number;
    receipts: ReceiptSummary[];
}

interface GroceryListAnalytics {
    plannedItemsCount: number;
    plannedTotal: number;
    purchasedFromList: number;
    purchasedFromListCount: number;
    unplannedPurchases: number;
    unplannedPurchasesCount: number;
    adherenceRate: number;
    savingsFromList: number;
}

const GroceryBudgetTable: React.FC<GroceryBudgetTableProps> = ({
                                                                   budget,
                                                                   viewMode,
                                                                   onReceiptSelect,
                                                                   onWeekSelect,
                                                                   onViewModeChange
                                                               }) => {
    const [expandedWeeks, setExpandedWeeks] = useState(new Set([1]));
    const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
    const [selectedWeekNumber, setSelectedWeekNumber] = useState<number | null>(null);

    // ALL HOOKS MUST COME BEFORE ANY CONDITIONAL RETURNS
    const weeklyData = useMemo((): WeekData[] => {
        if (!budget) return [];

        const startDate = parseISO(budget.startDate);
        const endDate = parseISO(budget.endDate);
        const totalWeeks = Math.ceil(differenceInWeeks(endDate, startDate)) + 1;
        const weeklyBudget = budget.budgetAmount / totalWeeks;

        const allItems: GroceryItem[] = [];
        budget.stores.forEach(store => {
            store.items.forEach(item => {
                allItems.push({ ...item, storeName: store.storeName });
            });
        });

        const weeks: WeekData[] = [];
        for (let i = 0; i < totalWeeks; i++) {
            const weekStart = addWeeks(startDate, i);
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
            const actualWeekEnd = weekEnd > endDate ? endDate : weekEnd;

            const weekItems = allItems.filter(item => {
                const itemDate = parseISO(item.datePurchased);
                return isWithinInterval(itemDate, { start: weekStart, end: actualWeekEnd });
            });

            const receiptMap = new Map<string, GroceryItem[]>();
            weekItems.forEach(item => {
                const receiptKey = `${item.storeName}-${item.datePurchased}`;
                if (!receiptMap.has(receiptKey)) {
                    receiptMap.set(receiptKey, []);
                }
                receiptMap.get(receiptKey)!.push(item);
            });

            const receipts: ReceiptSummary[] = Array.from(receiptMap.entries()).map(([key, items]) => {
                const [storeName, purchaseDate] = key.split('-');
                return {
                    id: `week${i + 1}-${key}`,
                    storeName,
                    purchaseDate,
                    itemCount: items.length,
                    totalCost: items.reduce((sum, item) => sum + item.itemCost, 0),
                    items: items.sort((a, b) => a.itemName.localeCompare(b.itemName)),
                    weekNumber: i + 1,
                    weekLabel: `Week ${i + 1}`
                };
            }).sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate));

            const actualSpent = weekItems.reduce((sum, item) => sum + item.itemCost, 0);
            const remaining = weeklyBudget - actualSpent;
            const percentUsed = (actualSpent / weeklyBudget) * 100;

            weeks.push({
                weekNumber: i + 1,
                weekLabel: `Week ${i + 1}`,
                startDate: weekStart,
                endDate: actualWeekEnd,
                budgetAmount: weeklyBudget,
                actualSpent,
                remaining,
                percentUsed,
                receipts
            });
        }

        return weeks;
    }, [budget]);

    // Calculate grocery list analytics for each week
    const weeklyGroceryListAnalytics = useMemo((): Map<number, GroceryListAnalytics> => {
        const analyticsMap = new Map<number, GroceryListAnalytics>();

        if (!budget || !budget.plannedItems) return analyticsMap;

        weeklyData.forEach(week => {
            const weekItems = week.receipts.flatMap(r => r.items);

            // Match purchased items to planned items (case-insensitive)
            const plannedItemNames = new Set(
                budget.plannedItems.map(pi => pi.itemName.toLowerCase())
            );

            const purchasedFromList = weekItems.filter(item =>
                plannedItemNames.has(item.itemName.toLowerCase())
            );

            const unplannedPurchases = weekItems.filter(item =>
                !plannedItemNames.has(item.itemName.toLowerCase())
            );

            const plannedTotal = budget.plannedItems.reduce(
                (sum, item) => sum + item.estimatedCost,
                0
            );

            const purchasedFromListTotal = purchasedFromList.reduce(
                (sum, item) => sum + item.itemCost,
                0
            );

            const unplannedTotal = unplannedPurchases.reduce(
                (sum, item) => sum + item.itemCost,
                0
            );

            const adherenceRate = weekItems.length > 0
                ? (purchasedFromList.length / weekItems.length) * 100
                : 0;

            // Calculate savings: difference between planned cost and actual cost for planned items
            let savingsFromList = 0;
            purchasedFromList.forEach(purchased => {
                const planned = budget.plannedItems.find(
                    pi => pi.itemName.toLowerCase() === purchased.itemName.toLowerCase()
                );
                if (planned) {
                    savingsFromList += (planned.estimatedCost - purchased.itemCost);
                }
            });

            analyticsMap.set(week.weekNumber, {
                plannedItemsCount: budget.plannedItems.length,
                plannedTotal,
                purchasedFromList: purchasedFromListTotal,
                purchasedFromListCount: purchasedFromList.length,
                unplannedPurchases: unplannedTotal,
                unplannedPurchasesCount: unplannedPurchases.length,
                adherenceRate,
                savingsFromList
            });
        });

        return analyticsMap;
    }, [budget, weeklyData]);

    // Calculate total savings across all weeks
    const totalWeeklySavings = useMemo(() => {
        return weeklyData.reduce((total, week) => {
            return total + (week.remaining > 0 ? week.remaining : 0);
        }, 0);
    }, [weeklyData]);

    const totalWeeksOver = useMemo(() => {
        return weeklyData.filter(week => week.remaining < 0).length;
    }, [weeklyData]);

    const totalWeeksUnder = useMemo(() => {
        return weeklyData.filter(week => week.remaining > 0).length;
    }, [weeklyData]);

    // Derived values that depend on budget
    const remaining = budget ? budget.budgetAmount - budget.totalSpent : 0;
    const percentSpent = budget ? (budget.totalSpent / budget.budgetAmount) * 100 : 0;
    const onTrackForSavings = budget ? remaining >= budget.savingsGoal : false;

    // NOW we can do conditional returns after all hooks are called
    if (!budget) {
        return null;
    }

    const toggleWeek = (weekNumber: number) => {
        setExpandedWeeks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(weekNumber)) {
                newSet.delete(weekNumber);
            } else {
                newSet.add(weekNumber);
            }
            return newSet;
        });
    };

    const handleReceiptClick = (receipt: ReceiptSummary) => {
        setSelectedReceiptId(receipt.id);
        onReceiptSelect?.(receipt);
    };

    const handleWeekClick = (week: WeekData) => {
        setSelectedWeekNumber(week.weekNumber);
        setSelectedReceiptId(null);
        onWeekSelect?.(week);
    };

    const gradients = {
        maroon: 'linear-gradient(135deg, #800000 0%, #a00000 100%)'
    };

    const getProgressColor = (percent: number) => {
        if (percent < 70) return tealColor;
        if (percent < 90) return '#f59e0b';
        return '#dc2626';
    };

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
            {/* Month Overview Section */}
            <Typography variant="h6" sx={{
                mb: 2,
                fontWeight: 700,
                color: maroonColor,
                display: 'flex',
                alignItems: 'center',
                gap: 1
            }}>
                <CalendarTodayIcon sx={{ fontSize: 24 }} />
                Month Overview
            </Typography>

            {/* Month Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                    <Card sx={{
                        background: `linear-gradient(135deg, ${tealColor} 0%, #14b8a6 100%)`,
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <ShoppingCartIcon sx={{ mr: 1 }} />
                                <Typography variant="caption" sx={{ opacity: 0.9 }}>Total Budget</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold">
                                ${budget.budgetAmount.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card sx={{
                        background: percentSpent > 90
                            ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
                            : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                        color: 'white',
                        boxShadow: percentSpent > 90
                            ? '0 4px 12px rgba(220, 38, 38, 0.25)'
                            : '0 4px 12px rgba(37, 99, 235, 0.25)'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <TrendingUpIcon sx={{ mr: 1 }} />
                                <Typography variant="caption" sx={{ opacity: 0.9 }}>Total Spent</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold">
                                ${budget.totalSpent.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                {percentSpent.toFixed(1)}% of budget
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card sx={{
                        background: remaining >= 0
                            ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                            : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                        color: 'white',
                        boxShadow: remaining >= 0
                            ? '0 4px 12px rgba(5, 150, 105, 0.25)'
                            : '0 4px 12px rgba(220, 38, 38, 0.25)'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                {remaining >= 0 ? <TrendingDownIcon sx={{ mr: 1 }} /> : <TrendingUpIcon sx={{ mr: 1 }} />}
                                <Typography variant="caption" sx={{ opacity: 0.9 }}>Remaining</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold">
                                ${Math.abs(remaining).toFixed(2)}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                {remaining >= 0 ? 'Under budget' : 'Over budget'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card sx={{
                        background: onTrackForSavings
                            ? 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)'
                            : 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                        color: 'white',
                        boxShadow: onTrackForSavings
                            ? '0 4px 12px rgba(124, 58, 237, 0.25)'
                            : '0 4px 12px rgba(245, 158, 11, 0.25)'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <SavingsIcon sx={{ mr: 1 }} />
                                <Typography variant="caption" sx={{ opacity: 0.9 }}>Savings Goal</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold">
                                ${budget.savingsGoal.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                {onTrackForSavings ? 'On track!' : 'Need to cut back'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Savings Overview Section */}
            <Typography variant="h6" sx={{
                mb: 2,
                fontWeight: 700,
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                gap: 1
            }}>
                <SavingsIcon sx={{ fontSize: 24 }} />
                Savings Overview
            </Typography>

            {/* Weekly Savings Banner */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                    <Card sx={{
                        background: totalWeeklySavings > 0
                            ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                            : 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
                        color: 'white',
                        boxShadow: totalWeeklySavings > 0
                            ? '0 8px 24px rgba(5, 150, 105, 0.35)'
                            : '0 4px 12px rgba(107, 114, 128, 0.25)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Decorative Background Pattern */}
                        <Box sx={{
                            position: 'absolute',
                            top: -50,
                            right: -50,
                            width: 200,
                            height: 200,
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.1)',
                        }} />
                        <Box sx={{
                            position: 'absolute',
                            bottom: -30,
                            left: -30,
                            width: 150,
                            height: 150,
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.05)',
                        }} />

                        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                            <Grid container spacing={3} alignItems="center">
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <SavingsIcon sx={{ fontSize: 40 }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                                                Total Weekly Savings
                                            </Typography>
                                            <Typography variant="h3" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                                                ${totalWeeklySavings.toFixed(2)}
                                            </Typography>
                                            {totalWeeklySavings > 0 && (
                                                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                                                    Great job staying under budget! 🎉
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Paper sx={{
                                                p: 2,
                                                textAlign: 'center',
                                                bgcolor: 'rgba(255, 255, 255, 0.95)',
                                                borderRadius: 2
                                            }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.7rem' }}>
                                                    Weeks Under Budget
                                                </Typography>
                                                <Typography variant="h4" fontWeight={700} color="#059669" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                    {totalWeeksUnder}
                                                    <TrendingDownIcon sx={{ fontSize: 28, color: '#059669' }} />
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Paper sx={{
                                                p: 2,
                                                textAlign: 'center',
                                                bgcolor: 'rgba(255, 255, 255, 0.95)',
                                                borderRadius: 2
                                            }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.7rem' }}>
                                                    Weeks Over Budget
                                                </Typography>
                                                <Typography variant="h4" fontWeight={700} color="#dc2626" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                    {totalWeeksOver}
                                                    <TrendingUpIcon sx={{ fontSize: 28, color: '#dc2626' }} />
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* View Mode Toggle */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                    icon={<CalendarTodayIcon />}
                    label="By Week"
                    onClick={() => onViewModeChange('week')}
                    color={viewMode === 'week' ? 'primary' : 'default'}
                    sx={{
                        fontWeight: 600,
                        cursor: 'pointer',
                        ...(viewMode === 'week' && {
                            background: gradients.maroon,
                            color: 'white',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #6b0000 0%, #900000 100%)',
                            }
                        })
                    }}
                />
                <Chip
                    icon={<ReceiptLongIcon />}
                    label="By Receipt Detail"
                    onClick={() => onViewModeChange('receiptDetail')}
                    color={viewMode === 'receiptDetail' ? 'primary' : 'default'}
                    sx={{
                        fontWeight: 600,
                        cursor: 'pointer',
                        ...(viewMode === 'receiptDetail' && {
                            background: gradients.maroon,
                            color: 'white',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #6b0000 0%, #900000 100%)',
                            }
                        })
                    }}
                />
                <Chip
                    icon={<PlaylistAddCheckIcon />}
                    label="By Grocery List"
                    onClick={() => onViewModeChange('groceryList')}
                    color={viewMode === 'groceryList' ? 'primary' : 'default'}
                    sx={{
                        fontWeight: 600,
                        cursor: 'pointer',
                        ...(viewMode === 'groceryList' && {
                            background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                            color: 'white',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
                            }
                        })
                    }}
                />
                <Chip
                    icon={<TrendingUpIcon />}
                    label="Analytics"
                    onClick={() => onViewModeChange('analytics')}
                    color={viewMode === 'analytics' ? 'primary' : 'default'}
                    sx={{
                        fontWeight: 600,
                        cursor: 'pointer',
                        ...(viewMode === 'analytics' && {
                            background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                            color: 'white',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                            }
                        })
                    }}
                />
            </Box>

            {/* Main Content - VISUAL CARD LAYOUT */}
            <Stack spacing={3}>
                {weeklyData.map((week, index) => {
                    const isExpanded = expandedWeeks.has(week.weekNumber);
                    const progressColor = getProgressColor(week.percentUsed);
                    const isWeekSelected = selectedWeekNumber === week.weekNumber;
                    const weekAnalytics = weeklyGroceryListAnalytics.get(week.weekNumber);

                    const handleRowClick = () => {
                        if (viewMode === 'receiptDetail') {
                            toggleWeek(week.weekNumber);
                        }
                    };

                    const isClickable = viewMode === 'receiptDetail';

                    return (
                        <Card
                            key={week.weekNumber}
                            sx={{
                                borderRadius: 4,
                                boxShadow: isWeekSelected ? 4 : 2,
                                border: `2px solid ${isWeekSelected ? maroonColor : 'transparent'}`,
                                overflow: 'visible',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: 6,
                                    transform: 'translateY(-2px)'
                                }
                            }}
                        >
                            {/* Week Card Header */}
                            <Box
                                onClick={handleRowClick}
                                sx={{
                                    cursor: isClickable ? 'pointer' : 'default',
                                    background: `linear-gradient(135deg, ${alpha(progressColor, 0.1)} 0%, ${alpha(progressColor, 0.05)} 100%)`,
                                    borderBottom: `3px solid ${progressColor}`,
                                    p: 3,
                                    position: 'relative'
                                }}
                            >
                                {/* Savings Badge - Prominent Corner Display */}
                                {week.remaining !== 0 && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 16,
                                            right: 16,
                                            zIndex: 1
                                        }}
                                    >
                                        <Tooltip title={week.remaining >= 0 ? 'Amount saved this week' : 'Amount over budget this week'}>
                                            <Paper
                                                elevation={4}
                                                sx={{
                                                    px: 2,
                                                    py: 1,
                                                    background: week.remaining >= 0
                                                        ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                                                        : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                                                    color: 'white',
                                                    borderRadius: 3,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    boxShadow: week.remaining >= 0
                                                        ? '0 4px 12px rgba(5, 150, 105, 0.4)'
                                                        : '0 4px 12px rgba(220, 38, 38, 0.4)',
                                                    animation: week.remaining >= 0 ? 'pulse 2s ease-in-out infinite' : 'none',
                                                    '@keyframes pulse': {
                                                        '0%, 100%': {
                                                            boxShadow: week.remaining >= 0
                                                                ? '0 4px 12px rgba(5, 150, 105, 0.4)'
                                                                : '0 4px 12px rgba(220, 38, 38, 0.4)',
                                                        },
                                                        '50%': {
                                                            boxShadow: week.remaining >= 0
                                                                ? '0 6px 20px rgba(5, 150, 105, 0.6)'
                                                                : '0 6px 20px rgba(220, 38, 38, 0.6)',
                                                        }
                                                    }
                                                }}
                                            >
                                                {week.remaining >= 0 ? (
                                                    <SavingsIcon sx={{ fontSize: 20 }} />
                                                ) : (
                                                    <TrendingUpIcon sx={{ fontSize: 20 }} />
                                                )}
                                                <Box sx={{ textAlign: 'left' }}>
                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.9, display: 'block', lineHeight: 1 }}>
                                                        {week.remaining >= 0 ? 'SAVED' : 'OVER'}
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                                                        ${Math.abs(week.remaining).toFixed(2)}
                                                    </Typography>
                                                </Box>
                                            </Paper>
                                        </Tooltip>
                                    </Box>
                                )}

                                <Grid container spacing={2} alignItems="center">
                                    {/* Week Info */}
                                    <Grid item xs={12} md={4}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            {viewMode === 'receiptDetail' && (
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleWeek(week.weekNumber);
                                                    }}
                                                    sx={{
                                                        bgcolor: alpha(progressColor, 0.2),
                                                        '&:hover': {
                                                            bgcolor: alpha(progressColor, 0.3)
                                                        }
                                                    }}
                                                >
                                                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                            )}
                                            <Box>
                                                <Typography variant="h6" fontWeight={700} color={maroonColor}>
                                                    {week.weekLabel}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {format(week.startDate, 'MMM d')} - {format(week.endDate, 'MMM d, yyyy')}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                    <Chip
                                                        icon={<ReceiptIcon />}
                                                        label={`${week.receipts.length} receipt${week.receipts.length !== 1 ? 's' : ''}`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: alpha(tealColor, 0.1),
                                                            color: tealColor,
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                    {budget.plannedItems && budget.plannedItems.length > 0 && (
                                                        <Chip
                                                            icon={<PlaylistAddCheckIcon />}
                                                            label="Has List"
                                                            size="small"
                                                            sx={{
                                                                bgcolor: alpha('#7c3aed', 0.1),
                                                                color: '#7c3aed',
                                                                fontWeight: 600
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    {/* Budget Stats */}
                                    <Grid item xs={12} md={8}>
                                        {/* BY WEEK VIEW */}
                                        {viewMode === 'week' && (
                                            <>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={3}>
                                                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(tealColor, 0.05) }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                                                                Budgeted
                                                            </Typography>
                                                            <Typography variant="h6" fontWeight={700} color={tealColor}>
                                                                ${week.budgetAmount.toFixed(2)}
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                    <Grid item xs={3}>
                                                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(maroonColor, 0.05) }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                                                                Spent
                                                            </Typography>
                                                            <Typography variant="h6" fontWeight={700} color={maroonColor}>
                                                                ${week.actualSpent.toFixed(2)}
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                    <Grid item xs={3}>
                                                        <Paper sx={{
                                                            p: 2,
                                                            textAlign: 'center',
                                                            bgcolor: week.remaining >= 0 ? alpha('#059669', 0.05) : alpha('#dc2626', 0.05)
                                                        }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                                                                Remaining
                                                            </Typography>
                                                            <Typography
                                                                variant="h6"
                                                                fontWeight={700}
                                                                color={week.remaining >= 0 ? '#059669' : '#dc2626'}
                                                            >
                                                                ${Math.abs(week.remaining).toFixed(2)}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {week.remaining >= 0 ? 'under' : 'over'}
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                    <Grid item xs={3}>
                                                        <Paper sx={{
                                                            p: 2,
                                                            textAlign: 'center',
                                                            background: week.remaining >= 0
                                                                ? 'linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
                                                                : 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
                                                            border: `2px solid ${week.remaining >= 0 ? '#059669' : '#dc2626'}`,
                                                            position: 'relative',
                                                            overflow: 'hidden'
                                                        }}>
                                                            {week.remaining >= 0 && (
                                                                <Box sx={{
                                                                    position: 'absolute',
                                                                    top: 4,
                                                                    right: 4,
                                                                }}>
                                                                    <SavingsIcon sx={{ fontSize: 16, color: '#059669', opacity: 0.3 }} />
                                                                </Box>
                                                            )}
                                                            <Typography variant="caption" sx={{
                                                                color: week.remaining >= 0 ? '#059669' : '#dc2626',
                                                                textTransform: 'uppercase',
                                                                fontWeight: 700,
                                                                fontSize: '0.65rem'
                                                            }}>
                                                                {week.remaining >= 0 ? '✓ SAVED' : '✗ OVERSPENT'}
                                                            </Typography>
                                                            <Typography
                                                                variant="h6"
                                                                fontWeight={800}
                                                                sx={{
                                                                    color: week.remaining >= 0 ? '#059669' : '#dc2626',
                                                                    fontSize: '1.1rem'
                                                                }}
                                                            >
                                                                ${Math.abs(week.remaining).toFixed(2)}
                                                            </Typography>
                                                            {week.remaining >= 0 ? (
                                                                <Chip
                                                                    label="🎯"
                                                                    size="small"
                                                                    sx={{
                                                                        height: 18,
                                                                        fontSize: '0.65rem',
                                                                        bgcolor: '#059669',
                                                                        color: 'white',
                                                                        fontWeight: 600,
                                                                        mt: 0.5
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Typography variant="caption" sx={{ color: '#dc2626', fontSize: '0.65rem' }}>
                                                                    ⚠️
                                                                </Typography>
                                                            )}
                                                        </Paper>
                                                    </Grid>
                                                </Grid>
                                            </>
                                        )}

                                        {/* BY RECEIPT DETAIL VIEW */}
                                        {viewMode === 'receiptDetail' && (
                                            <>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={4}>
                                                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(tealColor, 0.05) }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                                                                Receipts
                                                            </Typography>
                                                            <Typography variant="h6" fontWeight={700} color={tealColor}>
                                                                {week.receipts.length}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                trips
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(maroonColor, 0.05) }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                                                                Avg/Trip
                                                            </Typography>
                                                            <Typography variant="h6" fontWeight={700} color={maroonColor}>
                                                                ${week.receipts.length > 0 ? (week.actualSpent / week.receipts.length).toFixed(2) : '0.00'}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                per receipt
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <Paper sx={{
                                                            p: 2,
                                                            textAlign: 'center',
                                                            bgcolor: week.remaining >= 0 ? alpha('#059669', 0.05) : alpha('#dc2626', 0.05)
                                                        }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                                                                {week.remaining >= 0 ? 'Saved' : 'Over'}
                                                            </Typography>
                                                            <Typography
                                                                variant="h6"
                                                                fontWeight={700}
                                                                color={week.remaining >= 0 ? '#059669' : '#dc2626'}
                                                            >
                                                                ${Math.abs(week.remaining).toFixed(2)}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                this week
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                </Grid>
                                            </>
                                        )}

                                        {/* BY GROCERY LIST VIEW */}
                                        {viewMode === 'groceryList' && weekAnalytics && (
                                            <>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={3}>
                                                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha('#7c3aed', 0.05) }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>
                                                                List Budget
                                                            </Typography>
                                                            <Typography variant="h6" fontWeight={700} color="#7c3aed">
                                                                ${weekAnalytics.plannedTotal.toFixed(2)}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                planned
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                    <Grid item xs={3}>
                                                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(maroonColor, 0.05) }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>
                                                                Spent
                                                            </Typography>
                                                            <Typography variant="h6" fontWeight={700} color={maroonColor}>
                                                                ${weekAnalytics.purchasedFromList.toFixed(2)}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                from list
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                    <Grid item xs={3}>
                                                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha('#f59e0b', 0.05) }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>
                                                                Unplanned
                                                            </Typography>
                                                            <Typography variant="h6" fontWeight={700} color="#f59e0b">
                                                                ${weekAnalytics.unplannedPurchases.toFixed(2)}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                impulse
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                    <Grid item xs={3}>
                                                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(tealColor, 0.05) }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>
                                                                Adherence
                                                            </Typography>
                                                            <Typography variant="h6" fontWeight={700} color={tealColor}>
                                                                {weekAnalytics.adherenceRate.toFixed(0)}%
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                on list
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                </Grid>

                                                {/* Most Expensive List Item */}
                                                {(() => {
                                                    const weekItems = week.receipts.flatMap(r => r.items);
                                                    const plannedItemNames = new Set(
                                                        budget.plannedItems?.map(pi => pi.itemName.toLowerCase()) || []
                                                    );
                                                    const listItems = weekItems.filter(item =>
                                                        plannedItemNames.has(item.itemName.toLowerCase())
                                                    );
                                                    const mostExpensive = listItems.sort((a, b) => b.itemCost - a.itemCost)[0];

                                                    if (!mostExpensive) return null;

                                                    return (
                                                        <Box sx={{ mt: 2 }}>
                                                            <Paper sx={{
                                                                p: 1.5,
                                                                bgcolor: alpha('#7c3aed', 0.05),
                                                                border: `1px solid ${alpha('#7c3aed', 0.2)}`,
                                                                borderRadius: 2
                                                            }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                    <Box>
                                                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                                                            Most Expensive List Item
                                                                        </Typography>
                                                                        <Typography variant="body2" fontWeight={600}>
                                                                            {mostExpensive.itemName}
                                                                        </Typography>
                                                                    </Box>
                                                                    <Typography variant="h6" fontWeight={700} color="#7c3aed">
                                                                        ${mostExpensive.itemCost.toFixed(2)}
                                                                    </Typography>
                                                                </Box>
                                                            </Paper>
                                                        </Box>
                                                    );
                                                })()}
                                            </>
                                        )}

                                        {/* ANALYTICS VIEW */}
                                        {viewMode === 'analytics' && weekAnalytics && (
                                            <>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={3}>
                                                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha('#3b82f6', 0.05) }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>
                                                                Items
                                                            </Typography>
                                                            <Typography variant="h6" fontWeight={700} color="#3b82f6">
                                                                {week.receipts.reduce((sum, r) => sum + r.itemCount, 0)}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                purchased
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                    <Grid item xs={3}>
                                                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha('#8b5cf6', 0.05) }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>
                                                                Avg/Item
                                                            </Typography>
                                                            <Typography variant="h6" fontWeight={700} color="#8b5cf6">
                                                                ${week.receipts.reduce((sum, r) => sum + r.itemCount, 0) > 0
                                                                ? (week.actualSpent / week.receipts.reduce((sum, r) => sum + r.itemCount, 0)).toFixed(2)
                                                                : '0.00'}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                per item
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                    <Grid item xs={3}>
                                                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha('#f59e0b', 0.05) }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>
                                                                Stores
                                                            </Typography>
                                                            <Typography variant="h6" fontWeight={700} color="#f59e0b">
                                                                {new Set(week.receipts.map(r => r.storeName)).size}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                visited
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                    <Grid item xs={3}>
                                                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(tealColor, 0.05) }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>
                                                                Usage
                                                            </Typography>
                                                            <Typography variant="h6" fontWeight={700} color={tealColor}>
                                                                {week.percentUsed.toFixed(0)}%
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                of budget
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                </Grid>

                                                {/* Optimization Alert */}
                                                {(() => {
                                                    const isOverBudget = week.remaining < 0;
                                                    const isHighUsage = week.percentUsed > 90;
                                                    const avgWeeklySpend = weeklyData.reduce((sum, w) => sum + w.actualSpent, 0) / weeklyData.length;
                                                    const isIrregular = Math.abs(week.actualSpent - avgWeeklySpend) > (avgWeeklySpend * 0.4);
                                                    const hasManyTrips = week.receipts.length > 4;

                                                    const hasIssue = isOverBudget || isHighUsage || isIrregular || hasManyTrips;

                                                    if (!hasIssue) return null;

                                                    return (
                                                        <Box sx={{ mt: 2 }}>
                                                            <Paper sx={{
                                                                p: 2,
                                                                bgcolor: alpha('#f59e0b', 0.05),
                                                                border: `2px solid ${alpha('#f59e0b', 0.3)}`,
                                                                borderRadius: 2,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                gap: 2
                                                            }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                    <Box sx={{
                                                                        p: 1,
                                                                        borderRadius: 2,
                                                                        bgcolor: alpha('#f59e0b', 0.15)
                                                                    }}>
                                                                        <LightbulbIcon sx={{ fontSize: 24, color: '#f59e0b' }} />
                                                                    </Box>
                                                                    <Box>
                                                                        <Typography variant="subtitle2" fontWeight={700} color="#f59e0b">
                                                                            {isOverBudget && 'Over Budget Alert'}
                                                                            {!isOverBudget && isHighUsage && 'High Usage Alert'}
                                                                            {!isOverBudget && !isHighUsage && isIrregular && 'Irregular Spending Detected'}
                                                                            {!isOverBudget && !isHighUsage && !isIrregular && hasManyTrips && 'Many Shopping Trips'}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                                            {isOverBudget && `You're $${Math.abs(week.remaining).toFixed(2)} over budget this week`}
                                                                            {!isOverBudget && isHighUsage && `You've used ${week.percentUsed.toFixed(0)}% of your weekly budget`}
                                                                            {!isOverBudget && !isHighUsage && isIrregular && `This week's spending is ${((Math.abs(week.actualSpent - avgWeeklySpend) / avgWeeklySpend) * 100).toFixed(0)}% different from average`}
                                                                            {!isOverBudget && !isHighUsage && !isIrregular && hasManyTrips && `${week.receipts.length} shopping trips - consider consolidating`}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                                <Chip
                                                                    label="Optimize"
                                                                    icon={<LightbulbIcon />}
                                                                    onClick={() => {
                                                                        console.log('Optimize week:', week.weekNumber);
                                                                    }}
                                                                    sx={{
                                                                        background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                                                                        color: 'white',
                                                                        fontWeight: 700,
                                                                        cursor: 'pointer',
                                                                        '&:hover': {
                                                                            background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                                                                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
                                                                        }
                                                                    }}
                                                                />
                                                            </Paper>
                                                        </Box>
                                                    );
                                                })()}
                                            </>
                                        )}

                                        {/* Progress Bar */}
                                        <Box sx={{ mt: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                    Budget Usage
                                                </Typography>
                                                <Typography variant="caption" fontWeight={700} color={progressColor}>
                                                    {week.percentUsed.toFixed(1)}%
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.min(week.percentUsed, 100)}
                                                sx={{
                                                    height: 10,
                                                    borderRadius: 5,
                                                    backgroundColor: alpha(progressColor, 0.15),
                                                    '& .MuiLinearProgress-bar': {
                                                        backgroundColor: progressColor,
                                                        borderRadius: 5
                                                    }
                                                }}
                                            />
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Expanded Receipts */}
                            {viewMode === 'receiptDetail' && (
                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                    <Box sx={{ p: 3, bgcolor: alpha(tealColor, 0.02) }}>
                                        {week.receipts.length > 0 ? (
                                            <Grid container spacing={2}>
                                                {week.receipts.map((receipt) => (
                                                    <Grid item xs={12} sm={6} md={4} key={receipt.id}>
                                                        <Paper
                                                            onClick={() => handleReceiptClick(receipt)}
                                                            sx={{
                                                                p: 2,
                                                                cursor: 'pointer',
                                                                border: `2px solid ${selectedReceiptId === receipt.id ? tealColor : 'transparent'}`,
                                                                bgcolor: selectedReceiptId === receipt.id ? alpha(tealColor, 0.05) : 'white',
                                                                transition: 'all 0.2s',
                                                                '&:hover': {
                                                                    boxShadow: 3,
                                                                    borderColor: tealColor,
                                                                    transform: 'translateY(-2px)'
                                                                }
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                                                <Box sx={{
                                                                    p: 1,
                                                                    borderRadius: 2,
                                                                    bgcolor: alpha(tealColor, 0.1)
                                                                }}>
                                                                    <StoreIcon sx={{ color: tealColor, fontSize: 24 }} />
                                                                </Box>
                                                                <Box sx={{ flex: 1 }}>
                                                                    <Typography variant="subtitle2" fontWeight={700} color={maroonColor}>
                                                                        {receipt.storeName}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                                        {format(parseISO(receipt.purchaseDate), 'MMM d, yyyy')}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                                        {receipt.itemCount} item{receipt.itemCount !== 1 ? 's' : ''}
                                                                    </Typography>
                                                                    <Typography variant="h6" fontWeight={700} color={tealColor} sx={{ mt: 1 }}>
                                                                        ${receipt.totalCost.toFixed(2)}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </Paper>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        ) : (
                                            <Box sx={{
                                                textAlign: 'center',
                                                color: 'text.secondary',
                                                fontStyle: 'italic',
                                                py: 4
                                            }}>
                                                No receipts for this week
                                            </Box>
                                        )}
                                    </Box>
                                </Collapse>
                            )}
                        </Card>
                    );
                })}
            </Stack>
        </Box>
    );
};

export default GroceryBudgetTable;
// import React, { useState, useMemo } from 'react';
// import {
//     Box,
//     Paper,
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableRow,
//     Typography,
//     IconButton,
//     LinearProgress,
//     Chip,
//     Card,
//     CardContent,
//     Grid,
//     Divider,
//     Stack,
//     Tooltip
// } from '@mui/material';
// import { styled } from '@mui/material/styles';
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import ExpandLessIcon from '@mui/icons-material/ExpandLess';
// import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
// import StoreIcon from '@mui/icons-material/Store';
// import CategoryIcon from '@mui/icons-material/Category';
// import TrendingUpIcon from '@mui/icons-material/TrendingUp';
// import TrendingDownIcon from '@mui/icons-material/TrendingDown';
// import SavingsIcon from '@mui/icons-material/Savings';
// import {GroceryBudget, GroceryBudgetWithTotals, GroceryItem, SectionWithDetails} from "../config/Types";
// import { startOfWeek, endOfWeek, format, parseISO, isWithinInterval, addWeeks, differenceInWeeks } from 'date-fns';
// import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
// import ReceiptIcon from "@mui/icons-material/Receipt";
// import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
// import {ViewMode} from "./GroceryTracker";
// import AssignmentIcon from "@mui/icons-material/Assignment";
//
// const maroonColor = '#800000';
// const tealColor = '#0d9488';
//
// interface GroceryBudgetTableProps {
//     budget?: GroceryBudgetWithTotals;
//     viewMode: ViewMode;
//     onViewModeChange: (mode: ViewMode) => void;  // ← THIS IS NEW!
//     onReceiptSelect?: (receipt: ReceiptSummary) => void;
//     onWeekSelect?: (week: WeekData) => void;
// }
//
// export interface ReceiptSummary {
//     id: string;
//     storeName: string;
//     purchaseDate: string;
//     itemCount: number;
//     totalCost: number;
//     items: GroceryItem[];
//     weekNumber: number;
//     weekLabel: string;
// }
//
// export interface WeekData {
//     weekNumber: number;
//     weekLabel: string;
//     startDate: Date;
//     endDate: Date;
//     budgetAmount: number;
//     actualSpent: number;
//     remaining: number;
//     percentUsed: number;
//     receipts: ReceiptSummary[];
// }
//
//
// // Sample grocery budget data
// const sampleGroceryBudget = {
//     id: 1,
//     name: 'January 2026 Groceries',
//     budgetAmount: 600,
//     totalSpent: 342.49,
//     startDate: '2026-01-01',
//     endDate: '2026-01-31',
//     savingsGoal: 100,
//     stores: [
//         {
//             storeName: 'Whole Foods',
//             totalSpent: 187.50,
//             items: [
//                 { itemName: 'Organic Apples', itemCost: 12.50, category: 'Produce', datePurchased: '2026-01-05' },
//                 { itemName: 'Chicken Breast', itemCost: 25.00, category: 'Meat', datePurchased: '2026-01-05' },
//                 { itemName: 'Greek Yogurt', itemCost: 8.99, category: 'Dairy', datePurchased: '2026-01-08' },
//                 { itemName: 'Organic Spinach', itemCost: 6.50, category: 'Produce', datePurchased: '2026-01-10' },
//                 { itemName: 'Salmon Fillet', itemCost: 34.00, category: 'Seafood', datePurchased: '2026-01-12' },
//                 { itemName: 'Whole Grain Bread', itemCost: 5.99, category: 'Bakery', datePurchased: '2026-01-15' },
//                 { itemName: 'Avocados', itemCost: 9.50, category: 'Produce', datePurchased: '2026-01-18' },
//                 { itemName: 'Almond Butter', itemCost: 12.99, category: 'Pantry', datePurchased: '2026-01-20' },
//                 { itemName: 'Free Range Eggs', itemCost: 7.50, category: 'Dairy', datePurchased: '2026-01-22' },
//                 { itemName: 'Mixed Berries', itemCost: 14.50, category: 'Produce', datePurchased: '2026-01-25' },
//                 { itemName: 'Quinoa', itemCost: 8.99, category: 'Pantry', datePurchased: '2026-01-27' },
//                 { itemName: 'Kale', itemCost: 4.50, category: 'Produce', datePurchased: '2026-01-28' },
//                 { itemName: 'Grass-Fed Beef', itemCost: 36.54, category: 'Meat', datePurchased: '2026-01-30' }
//             ]
//         },
//         {
//             storeName: 'Trader Joes',
//             totalSpent: 89.99,
//             items: [
//                 { itemName: 'Almond Milk', itemCost: 3.99, category: 'Dairy', datePurchased: '2026-01-08' },
//                 { itemName: 'Everything Bagels', itemCost: 4.50, category: 'Bakery', datePurchased: '2026-01-08' },
//                 { itemName: 'Frozen Vegetables', itemCost: 6.99, category: 'Frozen', datePurchased: '2026-01-11' },
//                 { itemName: 'Trail Mix', itemCost: 7.50, category: 'Snacks', datePurchased: '2026-01-14' },
//                 { itemName: 'Pasta', itemCost: 2.99, category: 'Pantry', datePurchased: '2026-01-17' },
//                 { itemName: 'Marinara Sauce', itemCost: 3.99, category: 'Pantry', datePurchased: '2026-01-17' },
//                 { itemName: 'Cashew Cheese', itemCost: 5.99, category: 'Dairy', datePurchased: '2026-01-19' },
//                 { itemName: 'Dark Chocolate', itemCost: 3.99, category: 'Snacks', datePurchased: '2026-01-21' },
//                 { itemName: 'Hummus', itemCost: 4.50, category: 'Deli', datePurchased: '2026-01-23' },
//                 { itemName: 'Cauliflower Rice', itemCost: 3.99, category: 'Frozen', datePurchased: '2026-01-26' },
//                 { itemName: 'Coffee Beans', itemCost: 9.99, category: 'Beverages', datePurchased: '2026-01-28' },
//                 { itemName: 'Frozen Pizza', itemCost: 5.99, category: 'Frozen', datePurchased: '2026-01-29' },
//                 { itemName: 'Pita Bread', itemCost: 3.50, category: 'Bakery', datePurchased: '2026-01-30' },
//                 { itemName: 'Coconut Water', itemCost: 7.99, category: 'Beverages', datePurchased: '2026-01-30' },
//                 { itemName: 'Protein Bars', itemCost: 9.99, category: 'Snacks', datePurchased: '2026-01-31' }
//             ]
//         },
//         {
//             storeName: 'Costco',
//             totalSpent: 65.00,
//             items: [
//                 { itemName: 'Bananas', itemCost: 8.50, category: 'Produce', datePurchased: '2026-01-03' },
//                 { itemName: 'Paper Towels', itemCost: 24.99, category: 'Household', datePurchased: '2026-01-03' },
//                 { itemName: 'Chicken Thighs', itemCost: 19.99, category: 'Meat', datePurchased: '2026-01-16' },
//                 { itemName: 'Olive Oil', itemCost: 11.52, category: 'Pantry', datePurchased: '2026-01-16' }
//             ]
//         }
//     ],
//     sections: [
//         { name: 'Produce', budgetAmount: 150, totalSpent: 56.00 },
//         { name: 'Meat & Seafood', budgetAmount: 200, totalSpent: 115.53 },
//         { name: 'Dairy', budgetAmount: 100, totalSpent: 30.97 },
//         { name: 'Bakery', budgetAmount: 50, totalSpent: 14.99 },
//         { name: 'Pantry', budgetAmount: 80, totalSpent: 36.48 },
//         { name: 'Frozen', budgetAmount: 40, totalSpent: 17.97 },
//         { name: 'Snacks', budgetAmount: 30, totalSpent: 21.48 },
//         { name: 'Beverages', budgetAmount: 25, totalSpent: 17.98 },
//         { name: 'Household', budgetAmount: 25, totalSpent: 24.99 },
//         { name: 'Seafood', budgetAmount: 60, totalSpent: 0 },
//         { name: 'Deli', budgetAmount: 15, totalSpent: 4.50 }
//     ]
// };
//
// const GroceryBudgetTable: React.FC<GroceryBudgetTableProps> = ({ budget, viewMode, onReceiptSelect, onWeekSelect, onViewModeChange }) => {
//     const [expandedWeeks, setExpandedWeeks] = useState(new Set([1]));
//     const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
//     const [selectedWeekNumber, setSelectedWeekNumber] = useState<number | null>(null);
//
//     const weeklyData = useMemo((): WeekData[] => {
//         if (!budget) return [];
//
//         const startDate = parseISO(budget.startDate);
//         const endDate = parseISO(budget.endDate);
//
//         // Calculate number of weeks in the budget period
//         const totalWeeks = Math.ceil(differenceInWeeks(endDate, startDate)) + 1;
//         const weeklyBudget = budget.budgetAmount / totalWeeks;
//
//         // Collect all items from all stores
//         const allItems: GroceryItem[] = [];
//         budget.stores.forEach(store => {
//             store.items.forEach(item => {
//                 allItems.push({ ...item, storeName: store.storeName });
//             });
//         });
//
//         // Group items by week
//         const weeks: WeekData[] = [];
//         for (let i = 0; i < totalWeeks; i++) {
//             const weekStart = addWeeks(startDate, i);
//             const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 }); // Week starts on Sunday
//
//             // Ensure weekEnd doesn't exceed budget end date
//             const actualWeekEnd = weekEnd > endDate ? endDate : weekEnd;
//
//             const weekItems = allItems.filter(item => {
//                 const itemDate = parseISO(item.datePurchased);
//                 return isWithinInterval(itemDate, { start: weekStart, end: actualWeekEnd });
//             });
//
//             // Group items into receipts (by store and date)
//             const receiptMap = new Map<string, GroceryItem[]>();
//             weekItems.forEach(item => {
//                 const receiptKey = `${item.storeName}-${item.datePurchased}`;
//                 if (!receiptMap.has(receiptKey)) {
//                     receiptMap.set(receiptKey, []);
//                 }
//                 receiptMap.get(receiptKey)!.push(item);
//             });
//
//             // Convert to receipt summaries
//             const receipts: ReceiptSummary[] = Array.from(receiptMap.entries()).map(([key, items]) => {
//                 const [storeName, purchaseDate] = key.split('-');
//                 return {
//                     id: `week${i + 1}-${key}`,
//                     storeName,
//                     purchaseDate,
//                     itemCount: items.length,
//                     totalCost: items.reduce((sum, item) => sum + item.itemCost, 0),
//                     items: items.sort((a, b) => a.itemName.localeCompare(b.itemName)),
//                     weekNumber: i + 1,
//                     weekLabel: `Week ${i + 1}`
//                 };
//             }).sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate));
//
//             const actualSpent = weekItems.reduce((sum, item) => sum + item.itemCost, 0);
//             const remaining = weeklyBudget - actualSpent;
//             const percentUsed = (actualSpent / weeklyBudget) * 100;
//
//             weeks.push({
//                 weekNumber: i + 1,
//                 weekLabel: `Week ${i + 1}`,
//                 startDate: weekStart,
//                 endDate: actualWeekEnd,
//                 budgetAmount: weeklyBudget,
//                 actualSpent,
//                 remaining,
//                 percentUsed,
//                 receipts
//             });
//         }
//
//         return weeks;
//     }, [budget]);
//
//     if(!budget){
//         return null;
//     }
//
//     // Calculate section data with items from stores
//
//     const toggleWeek = (weekNumber: number) => {
//         setExpandedWeeks(prev => {
//             const newSet = new Set(prev);
//             if (newSet.has(weekNumber)) {
//                 newSet.delete(weekNumber);
//             } else {
//                 newSet.add(weekNumber);
//             }
//             return newSet;
//         });
//     };
//
//     const handleReceiptClick = (receipt: ReceiptSummary) => {
//         setSelectedReceiptId(receipt.id);
//         onReceiptSelect?.(receipt);
//     };
//
//     const gradients = {
//         maroon: 'linear-gradient(135deg, #800000 0%, #a00000 100%)'
//     };
//
//     const handleWeekClick = (week: WeekData) => {
//         setSelectedWeekNumber(week.weekNumber);
//         setSelectedReceiptId(null);
//         onWeekSelect?.(week);
//     };
//
//     const remaining = budget.budgetAmount - budget.totalSpent;
//     const percentSpent = (budget.totalSpent / budget.budgetAmount) * 100;
//     const onTrackForSavings = remaining >= budget.savingsGoal;
//
//     const getProgressColor = (percent: number) => {
//         if (percent < 70) return tealColor;
//         if (percent < 90) return '#f59e0b';
//         return '#dc2626';
//     };
//
//
//     return (
//         <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
//             {/* Header Summary Cards */}
//             <Grid container spacing={3} sx={{ mb: 4 }}>
//                 <Grid item xs={12} md={3}>
//                     <Card sx={{
//                         background: `linear-gradient(135deg, ${tealColor} 0%, #14b8a6 100%)`,
//                         color: 'white',
//                         boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
//                     }}>
//                         <CardContent>
//                             <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                                 <ShoppingCartIcon sx={{ mr: 1 }} />
//                                 <Typography variant="caption" sx={{ opacity: 0.9 }}>Total Budget</Typography>
//                             </Box>
//                             <Typography variant="h4" fontWeight="bold">
//                                 ${budget.budgetAmount.toFixed(2)}
//                             </Typography>
//                         </CardContent>
//                     </Card>
//                 </Grid>
//
//                 <Grid item xs={12} md={3}>
//                     <Card sx={{
//                         background: percentSpent > 90
//                             ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
//                             : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
//                         color: 'white',
//                         boxShadow: percentSpent > 90
//                             ? '0 4px 12px rgba(220, 38, 38, 0.25)'
//                             : '0 4px 12px rgba(37, 99, 235, 0.25)'
//                     }}>
//                         <CardContent>
//                             <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                                 <TrendingUpIcon sx={{ mr: 1 }} />
//                                 <Typography variant="caption" sx={{ opacity: 0.9 }}>Total Spent</Typography>
//                             </Box>
//                             <Typography variant="h4" fontWeight="bold">
//                                 ${budget.totalSpent.toFixed(2)}
//                             </Typography>
//                             <Typography variant="caption" sx={{ opacity: 0.8 }}>
//                                 {percentSpent.toFixed(1)}% of budget
//                             </Typography>
//                         </CardContent>
//                     </Card>
//                 </Grid>
//
//                 <Grid item xs={12} md={3}>
//                     <Card sx={{
//                         background: remaining >= 0
//                             ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
//                             : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
//                         color: 'white',
//                         boxShadow: remaining >= 0
//                             ? '0 4px 12px rgba(5, 150, 105, 0.25)'
//                             : '0 4px 12px rgba(220, 38, 38, 0.25)'
//                     }}>
//                         <CardContent>
//                             <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                                 {remaining >= 0 ? <TrendingDownIcon sx={{ mr: 1 }} /> : <TrendingUpIcon sx={{ mr: 1 }} />}
//                                 <Typography variant="caption" sx={{ opacity: 0.9 }}>Remaining</Typography>
//                             </Box>
//                             <Typography variant="h4" fontWeight="bold">
//                                 ${Math.abs(remaining).toFixed(2)}
//                             </Typography>
//                             <Typography variant="caption" sx={{ opacity: 0.8 }}>
//                                 {remaining >= 0 ? 'Under budget' : 'Over budget'}
//                             </Typography>
//                         </CardContent>
//                     </Card>
//                 </Grid>
//
//                 <Grid item xs={12} md={3}>
//                     <Card sx={{
//                         background: onTrackForSavings
//                             ? 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)'
//                             : 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
//                         color: 'white',
//                         boxShadow: onTrackForSavings
//                             ? '0 4px 12px rgba(124, 58, 237, 0.25)'
//                             : '0 4px 12px rgba(245, 158, 11, 0.25)'
//                     }}>
//                         <CardContent>
//                             <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                                 <SavingsIcon sx={{ mr: 1 }} />
//                                 <Typography variant="caption" sx={{ opacity: 0.9 }}>Savings Goal</Typography>
//                             </Box>
//                             <Typography variant="h4" fontWeight="bold">
//                                 ${budget.savingsGoal.toFixed(2)}
//                             </Typography>
//                             <Typography variant="caption" sx={{ opacity: 0.8 }}>
//                                 {onTrackForSavings ? 'On track!' : 'Need to cut back'}
//                             </Typography>
//                         </CardContent>
//                     </Card>
//                 </Grid>
//             </Grid>
//
//             {/* View Mode Toggle */}
//             <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
//                 <Chip
//                     icon={<CalendarTodayIcon />}
//                     label="By Week"
//                     onClick={() => onViewModeChange('week')}
//                     color={viewMode === 'week' ? 'primary' : 'default'}
//                     sx={{
//                         fontWeight: 600,
//                         cursor: 'pointer',
//                         ...(viewMode === 'week' && {
//                             background: gradients.maroon,
//                             color: 'white',
//                             '&:hover': {
//                                 background: 'linear-gradient(135deg, #6b0000 0%, #900000 100%)',
//                             }
//                         })
//                     }}
//                 />
//                 <Chip
//                     icon={<ReceiptLongIcon />}
//                     label="By Receipt Detail"
//                     onClick={() => onViewModeChange('receiptDetail')}
//                     color={viewMode === 'receiptDetail' ? 'primary' : 'default'}
//                     sx={{
//                         fontWeight: 600,
//                         cursor: 'pointer',
//                         ...(viewMode === 'receiptDetail' && {
//                             background: gradients.maroon,
//                             color: 'white',
//                             '&:hover': {
//                                 background: 'linear-gradient(135deg, #6b0000 0%, #900000 100%)',
//                             }
//                         })
//                     }}
//                 />
//                 {/*<Chip*/}
//                 {/*    icon={<AssignmentIcon />}*/}
//                 {/*    label="By Grocery Budget"*/}
//                 {/*    onClick={() => onViewModeChange('budgetDetail')}*/}
//                 {/*    color={viewMode === 'budgetDetail' ? 'primary' : 'default'}*/}
//                 {/*    sx={{*/}
//                 {/*        fontWeight: 600,*/}
//                 {/*        cursor: 'pointer',*/}
//                 {/*        ...(viewMode === 'budgetDetail' && {*/}
//                 {/*            background: gradients.maroon,*/}
//                 {/*            color: 'white',*/}
//                 {/*            '&:hover': {*/}
//                 {/*                background: 'linear-gradient(135deg, #6b0000 0%, #900000 100%)',*/}
//                 {/*            }*/}
//                 {/*        })*/}
//                 {/*    }}*/}
//                 {/*/>*/}
//                 <Chip
//                     icon={<TrendingUpIcon />}
//                     label="Analytics"
//                     onClick={() => onViewModeChange('analytics')}
//                     color={viewMode === 'analytics' ? 'primary' : 'default'}
//                     sx={{
//                         fontWeight: 600,
//                         cursor: 'pointer',
//                         ...(viewMode === 'analytics' && {
//                             background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
//                             color: 'white',
//                             '&:hover': {
//                                 background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
//                             }
//                         })
//                     }}
//                 />
//             </Box>
//
//             {/* Main Table */}
//             <Paper sx={{
//                 boxShadow: 3,
//                 borderRadius: 4,
//                 overflow: 'hidden',
//                 transition: 'box-shadow 0.3s ease-in-out',
//                 '&:hover': {
//                     boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
//                 }
//             }}>
//                 <Table sx={{ tableLayout: 'fixed' }}>
//                     <TableHead>
//                         <TableRow sx={{ backgroundColor: 'background.paper' }}>
//                             <TableCell sx={{
//                                 fontWeight: 'bold',
//                                 color: maroonColor,
//                                 fontSize: '0.95rem',
//                                 width: '35%'
//                             }}>
//                                 Week
//                             </TableCell>
//                             <TableCell align="right" sx={{
//                                 fontWeight: 'bold',
//                                 color: maroonColor,
//                                 fontSize: '0.95rem',
//                                 width: '18%'
//                             }}>
//                                 Budgeted
//                             </TableCell>
//                             <TableCell align="right" sx={{
//                                 fontWeight: 'bold',
//                                 color: maroonColor,
//                                 fontSize: '0.95rem',
//                                 width: '18%'
//                             }}>
//                                 Actual
//                             </TableCell>
//                             <TableCell align="right" sx={{
//                                 fontWeight: 'bold',
//                                 color: maroonColor,
//                                 fontSize: '0.95rem',
//                                 width: '18%'
//                             }}>
//                                 Remaining
//                             </TableCell>
//                             <TableCell sx={{
//                                 fontWeight: 'bold',
//                                 color: maroonColor,
//                                 fontSize: '0.95rem',
//                                 width: '11%'
//                             }}>
//                                 Progress
//                             </TableCell>
//                         </TableRow>
//                     </TableHead>
//                 </Table>
//
//                 <Box>
//                     {weeklyData.map((week, index) => {
//                         const isExpanded = expandedWeeks.has(week.weekNumber);
//                         const isLast = index === weeklyData.length - 1;
//                         const progressColor = getProgressColor(week.percentUsed);
//                         const isWeekSelected = selectedWeekNumber === week.weekNumber;
//
//                         // Determine click behavior based on view mode
//                         const handleRowClick = () => {
//                             if (viewMode === 'receiptDetail') {
//                                 toggleWeek(week.weekNumber);
//                             } else if (viewMode === 'budgetDetail') {
//                                 handleWeekClick(week);
//                             }
//                         };
//
//                         const isClickable = viewMode === 'receiptDetail' || viewMode === 'budgetDetail';
//
//                         return (
//                             <Box key={week.weekNumber} sx={{ mb: 0.5 }}>
//                                 {/* Week Header Row */}
//                                 <Box
//                                     onClick={handleRowClick}
//                                     sx={{
//                                         cursor: isClickable ? 'pointer' : 'default',
//                                         backgroundColor: isWeekSelected ? 'rgba(128, 0, 0, 0.08)' : 'white',
//                                         boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
//                                         p: 2,
//                                         borderLeft: `4px solid ${progressColor}`,
//                                         ...(isLast && (!isExpanded || viewMode !== 'receiptDetail') && {
//                                             borderBottomLeftRadius: '16px',
//                                             borderBottomRightRadius: '16px',
//                                         }),
//                                         '&:hover': isClickable ? {
//                                             boxShadow: '0 2px 6px rgba(128, 0, 0, 0.15)',
//                                             backgroundColor: isWeekSelected
//                                                 ? 'rgba(128, 0, 0, 0.12)'
//                                                 : 'rgba(128, 0, 0, 0.04)',
//                                         } : {}
//                                     }}
//                                 >
//                                     <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                                         {viewMode === 'receiptDetail' && (
//                                             <IconButton
//                                                 size="small"
//                                                 onClick={(e) => {
//                                                     e.stopPropagation();
//                                                     toggleWeek(week.weekNumber);
//                                                 }}
//                                                 sx={{
//                                                     color: progressColor,
//                                                     backgroundColor: `${progressColor}15`,
//                                                     mr: 2,
//                                                     '&:hover': {
//                                                         backgroundColor: `${progressColor}25`,
//                                                     }
//                                                 }}
//                                             >
//                                                 {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
//                                             </IconButton>
//                                         )}
//
//                                         <Box sx={{ flex: '0 0 31%', ml: viewMode === 'week' ? 6 : 0 }}>
//                                             <Typography sx={{
//                                                 color: maroonColor,
//                                                 fontWeight: 600,
//                                                 fontSize: '0.9rem'
//                                             }}>
//                                                 {week.weekLabel}
//                                             </Typography>
//                                             <Typography variant="caption" sx={{ color: 'text.secondary' }}>
//                                                 {format(week.startDate, 'MMM d')} - {format(week.endDate, 'MMM d, yyyy')} • {week.receipts.length} receipt{week.receipts.length !== 1 ? 's' : ''}
//                                             </Typography>
//                                         </Box>
//
//                                         <Typography sx={{ flex: '0 0 18%', textAlign: 'right', fontWeight: 500 }}>
//                                             ${week.budgetAmount.toFixed(2)}
//                                         </Typography>
//
//                                         <Typography sx={{ flex: '0 0 18%', textAlign: 'right', fontWeight: 500 }}>
//                                             ${week.actualSpent.toFixed(2)}
//                                         </Typography>
//
//                                         <Typography sx={{
//                                             flex: '0 0 18%',
//                                             textAlign: 'right',
//                                             fontWeight: 600,
//                                             color: week.remaining >= 0 ? '#059669' : '#dc2626'
//                                         }}>
//                                             ${Math.abs(week.remaining).toFixed(2)}
//                                             <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
//                                                 {week.remaining >= 0 ? 'under' : 'over'}
//                                             </Typography>
//                                         </Typography>
//
//                                         <Box sx={{ flex: '0 0 11%', pl: 2 }}>
//                                             <Tooltip title={`${week.percentUsed.toFixed(1)}% used`}>
//                                                 <Box>
//                                                     <LinearProgress
//                                                         variant="determinate"
//                                                         value={Math.min(week.percentUsed, 100)}
//                                                         sx={{
//                                                             height: 8,
//                                                             borderRadius: 4,
//                                                             backgroundColor: `${progressColor}20`,
//                                                             '& .MuiLinearProgress-bar': {
//                                                                 backgroundColor: progressColor,
//                                                                 borderRadius: 4
//                                                             }
//                                                         }}
//                                                     />
//                                                 </Box>
//                                             </Tooltip>
//                                         </Box>
//                                     </Box>
//                                 </Box>
//
//                                 {/* Expanded Receipts - Only in receiptDetail mode */}
//                                 {viewMode === 'receiptDetail' && isExpanded && week.receipts.length > 0 && (
//                                     <Box sx={{
//                                         maxHeight: '330px',
//                                         overflowY: 'auto',
//                                         backgroundColor: '#fafafa',
//                                         ...(isLast && {
//                                             borderBottomLeftRadius: '16px',
//                                             borderBottomRightRadius: '16px',
//                                         }),
//                                         '&::-webkit-scrollbar': {
//                                             width: '8px',
//                                         },
//                                         '&::-webkit-scrollbar-track': {
//                                             backgroundColor: 'rgba(0,0,0,0.05)',
//                                         },
//                                         '&::-webkit-scrollbar-thumb': {
//                                             backgroundColor: progressColor,
//                                             borderRadius: '4px',
//                                             '&:hover': {
//                                                 backgroundColor: `${progressColor}dd`,
//                                             },
//                                         },
//                                     }}>
//                                         <Table sx={{ tableLayout: 'fixed' }}>
//                                             <TableBody>
//                                                 {week.receipts.map((receipt) => (
//                                                     <TableRow
//                                                         key={receipt.id}
//                                                         onClick={() => handleReceiptClick(receipt)}
//                                                         sx={{
//                                                             cursor: 'pointer',
//                                                             backgroundColor: selectedReceiptId === receipt.id ? 'rgba(128, 0, 0, 0.08)' : 'transparent',
//                                                             '&:hover': {
//                                                                 backgroundColor: selectedReceiptId === receipt.id
//                                                                     ? 'rgba(128, 0, 0, 0.12)'
//                                                                     : 'rgba(128, 0, 0, 0.04)',
//                                                             }
//                                                         }}
//                                                     >
//                                                         <TableCell sx={{ width: '35%', pl: 8 }}>
//                                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                                                 <ReceiptIcon sx={{ fontSize: 18, color: tealColor }} />
//                                                                 <Box>
//                                                                     <Typography variant="body2" fontWeight={500}>
//                                                                         {receipt.storeName}
//                                                                     </Typography>
//                                                                     <Typography variant="caption" color="text.secondary">
//                                                                         {format(parseISO(receipt.purchaseDate), 'MMM d, yyyy')} • {receipt.itemCount} item{receipt.itemCount !== 1 ? 's' : ''}
//                                                                     </Typography>
//                                                                 </Box>
//                                                             </Box>
//                                                         </TableCell>
//                                                         <TableCell align="right" sx={{ width: '18%' }}>
//                                                             <Typography variant="body2" color="text.secondary">—</Typography>
//                                                         </TableCell>
//                                                         <TableCell align="right" sx={{ width: '18%' }}>
//                                                             <Typography variant="body2" fontWeight={600}>
//                                                                 ${receipt.totalCost.toFixed(2)}
//                                                             </Typography>
//                                                         </TableCell>
//                                                         <TableCell align="right" sx={{ width: '18%' }}>
//                                                             <Typography variant="body2" color="text.secondary">—</Typography>
//                                                         </TableCell>
//                                                         <TableCell sx={{ width: '11%' }}></TableCell>
//                                                     </TableRow>
//                                                 ))}
//                                             </TableBody>
//                                         </Table>
//                                     </Box>
//                                 )}
//
//                                 {viewMode === 'receiptDetail' && isExpanded && week.receipts.length === 0 && (
//                                     <Box sx={{
//                                         p: 3,
//                                         textAlign: 'center',
//                                         color: 'text.secondary',
//                                         fontStyle: 'italic',
//                                         backgroundColor: '#fafafa',
//                                         ...(isLast && {
//                                             borderBottomLeftRadius: '16px',
//                                             borderBottomRightRadius: '16px',
//                                         })
//                                     }}>
//                                         No receipts for this week
//                                     </Box>
//                                 )}
//                             </Box>
//                         );
//                     })}
//                 </Box>
//             </Paper>
//         </Box>
//     );
//     // return (
//     //     <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
//     //         {/* Header Summary Cards */}
//     //         <Grid container spacing={3} sx={{ mb: 4 }}>
//     //             <Grid item xs={12} md={3}>
//     //                 <Card sx={{
//     //                     background: `linear-gradient(135deg, ${tealColor} 0%, #14b8a6 100%)`,
//     //                     color: 'white',
//     //                     boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
//     //                 }}>
//     //                     <CardContent>
//     //                         <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//     //                             <ShoppingCartIcon sx={{ mr: 1 }} />
//     //                             <Typography variant="caption" sx={{ opacity: 0.9 }}>Total Budget</Typography>
//     //                         </Box>
//     //                         <Typography variant="h4" fontWeight="bold">
//     //                             ${budget.budgetAmount.toFixed(2)}
//     //                         </Typography>
//     //                     </CardContent>
//     //                 </Card>
//     //             </Grid>
//     //
//     //             <Grid item xs={12} md={3}>
//     //                 <Card sx={{
//     //                     background: percentSpent > 90
//     //                         ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
//     //                         : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
//     //                     color: 'white',
//     //                     boxShadow: percentSpent > 90
//     //                         ? '0 4px 12px rgba(220, 38, 38, 0.25)'
//     //                         : '0 4px 12px rgba(37, 99, 235, 0.25)'
//     //                 }}>
//     //                     <CardContent>
//     //                         <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//     //                             <TrendingUpIcon sx={{ mr: 1 }} />
//     //                             <Typography variant="caption" sx={{ opacity: 0.9 }}>Total Spent</Typography>
//     //                         </Box>
//     //                         <Typography variant="h4" fontWeight="bold">
//     //                             ${budget.totalSpent.toFixed(2)}
//     //                         </Typography>
//     //                         <Typography variant="caption" sx={{ opacity: 0.8 }}>
//     //                             {percentSpent.toFixed(1)}% of budget
//     //                         </Typography>
//     //                     </CardContent>
//     //                 </Card>
//     //             </Grid>
//     //
//     //             <Grid item xs={12} md={3}>
//     //                 <Card sx={{
//     //                     background: remaining >= 0
//     //                         ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
//     //                         : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
//     //                     color: 'white',
//     //                     boxShadow: remaining >= 0
//     //                         ? '0 4px 12px rgba(5, 150, 105, 0.25)'
//     //                         : '0 4px 12px rgba(220, 38, 38, 0.25)'
//     //                 }}>
//     //                     <CardContent>
//     //                         <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//     //                             {remaining >= 0 ? <TrendingDownIcon sx={{ mr: 1 }} /> : <TrendingUpIcon sx={{ mr: 1 }} />}
//     //                             <Typography variant="caption" sx={{ opacity: 0.9 }}>Remaining</Typography>
//     //                         </Box>
//     //                         <Typography variant="h4" fontWeight="bold">
//     //                             ${Math.abs(remaining).toFixed(2)}
//     //                         </Typography>
//     //                         <Typography variant="caption" sx={{ opacity: 0.8 }}>
//     //                             {remaining >= 0 ? 'Under budget' : 'Over budget'}
//     //                         </Typography>
//     //                     </CardContent>
//     //                 </Card>
//     //             </Grid>
//     //
//     //             <Grid item xs={12} md={3}>
//     //                 <Card sx={{
//     //                     background: onTrackForSavings
//     //                         ? 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)'
//     //                         : 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
//     //                     color: 'white',
//     //                     boxShadow: onTrackForSavings
//     //                         ? '0 4px 12px rgba(124, 58, 237, 0.25)'
//     //                         : '0 4px 12px rgba(245, 158, 11, 0.25)'
//     //                 }}>
//     //                     <CardContent>
//     //                         <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//     //                             <SavingsIcon sx={{ mr: 1 }} />
//     //                             <Typography variant="caption" sx={{ opacity: 0.9 }}>Savings Goal</Typography>
//     //                         </Box>
//     //                         <Typography variant="h4" fontWeight="bold">
//     //                             ${budget.savingsGoal.toFixed(2)}
//     //                         </Typography>
//     //                         <Typography variant="caption" sx={{ opacity: 0.8 }}>
//     //                             {onTrackForSavings ? 'On track!' : 'Need to cut back'}
//     //                         </Typography>
//     //                     </CardContent>
//     //                 </Card>
//     //             </Grid>
//     //         </Grid>
//     //
//     //         {/* View Mode Toggle */}
//     //         <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
//     //             <Chip
//     //                 icon={<CalendarTodayIcon />}
//     //                 label="By Week"
//     //                 onClick={() => onViewModeChange('week')}
//     //                 color={viewMode === 'week' ? 'primary' : 'default'}
//     //                 sx={{
//     //                     fontWeight: 600,
//     //                     cursor: 'pointer',
//     //                     ...(viewMode === 'week' && {
//     //                         background: gradients.maroon,
//     //                         color: 'white',
//     //                         '&:hover': {
//     //                             background: 'linear-gradient(135deg, #6b0000 0%, #900000 100%)',
//     //                         }
//     //                     })
//     //                 }}
//     //             />
//     //             <Chip
//     //                 icon={<ReceiptLongIcon />}
//     //                 label="By Receipt Detail"
//     //                 onClick={() => onViewModeChange('receiptDetail')}
//     //                 color={viewMode === 'receiptDetail' ? 'primary' : 'default'}
//     //                 sx={{
//     //                     fontWeight: 600,
//     //                     cursor: 'pointer',
//     //                     ...(viewMode === 'receiptDetail' && {
//     //                         background: gradients.maroon,
//     //                         color: 'white',
//     //                         '&:hover': {
//     //                             background: 'linear-gradient(135deg, #6b0000 0%, #900000 100%)',
//     //                         }
//     //                     })
//     //                 }}
//     //             />
//     //             <Chip
//     //                 icon={<AssignmentIcon />}
//     //                 label="By Grocery Budget"
//     //                 onClick={() => onViewModeChange('budgetDetail')}
//     //                 color={viewMode === 'budgetDetail' ? 'primary' : 'default'}
//     //                 sx={{
//     //                     fontWeight: 600,
//     //                     cursor: 'pointer',
//     //                     ...(viewMode === 'budgetDetail' && {
//     //                         background: gradients.maroon,
//     //                         color: 'white',
//     //                         '&:hover': {
//     //                             background: 'linear-gradient(135deg, #6b0000 0%, #900000 100%)',
//     //                         }
//     //                     })
//     //                 }}
//     //             />
//     //         </Box>
//     //
//     //         {/* Main Table */}
//     //         <Paper sx={{
//     //             boxShadow: 3,
//     //             borderRadius: 4,
//     //             overflow: 'hidden',
//     //             transition: 'box-shadow 0.3s ease-in-out',
//     //             '&:hover': {
//     //                 boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
//     //             }
//     //         }}>
//     //             <Table sx={{ tableLayout: 'fixed' }}>
//     //                 <TableHead>
//     //                     <TableRow sx={{ backgroundColor: 'background.paper' }}>
//     //                         <TableCell sx={{
//     //                             fontWeight: 'bold',
//     //                             color: maroonColor,
//     //                             fontSize: '0.95rem',
//     //                             width: '35%'
//     //                         }}>
//     //                             Week
//     //                         </TableCell>
//     //                         <TableCell align="right" sx={{
//     //                             fontWeight: 'bold',
//     //                             color: maroonColor,
//     //                             fontSize: '0.95rem',
//     //                             width: '18%'
//     //                         }}>
//     //                             Budgeted
//     //                         </TableCell>
//     //                         <TableCell align="right" sx={{
//     //                             fontWeight: 'bold',
//     //                             color: maroonColor,
//     //                             fontSize: '0.95rem',
//     //                             width: '18%'
//     //                         }}>
//     //                             Actual
//     //                         </TableCell>
//     //                         <TableCell align="right" sx={{
//     //                             fontWeight: 'bold',
//     //                             color: maroonColor,
//     //                             fontSize: '0.95rem',
//     //                             width: '18%'
//     //                         }}>
//     //                             Remaining
//     //                         </TableCell>
//     //                         <TableCell sx={{
//     //                             fontWeight: 'bold',
//     //                             color: maroonColor,
//     //                             fontSize: '0.95rem',
//     //                             width: '11%'
//     //                         }}>
//     //                             Progress
//     //                         </TableCell>
//     //                     </TableRow>
//     //                 </TableHead>
//     //             </Table>
//     //
//     //             <Box>
//     //                 {weeklyData.map((week, index) => {
//     //                     const isExpanded = expandedWeeks.has(week.weekNumber);
//     //                     const isLast = index === weeklyData.length - 1;
//     //                     const progressColor = getProgressColor(week.percentUsed);
//     //                     const isWeekSelected = selectedWeekNumber === week.weekNumber;
//     //
//     //                     const isClickable = viewMode === 'receiptDetail' || viewMode === 'budgetDetail';
//     //                     const handleRowClick = () => {
//     //                         if (viewMode === 'receiptDetail') {
//     //                             toggleWeek(week.weekNumber);
//     //                         } else if (viewMode === 'budgetDetail') {
//     //                             handleWeekClick(week);
//     //                         }
//     //                     };
//     //
//     //                     return (
//     //                         <Box key={week.weekNumber} sx={{ mb: 0.5 }}>
//     //                             <Box
//     //                                 onClick={handleRowClick}
//     //                                 sx={{
//     //                                     cursor: isClickable ? 'pointer' : 'default',
//     //                                     backgroundColor: isWeekSelected ? 'rgba(128, 0, 0, 0.08)' : 'white',
//     //                                     boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
//     //                                     p: 2,
//     //                                     borderLeft: `4px solid ${progressColor}`,
//     //                                     ...(isLast && (!isExpanded || viewMode !== 'receiptDetail') && {
//     //                                         borderBottomLeftRadius: '16px',
//     //                                         borderBottomRightRadius: '16px',
//     //                                     }),
//     //                                     '&:hover': isClickable ? {
//     //                                         boxShadow: '0 2px 6px rgba(128, 0, 0, 0.15)',
//     //                                         backgroundColor: isWeekSelected
//     //                                             ? 'rgba(128, 0, 0, 0.12)'
//     //                                             : 'rgba(128, 0, 0, 0.04)',
//     //                                     } : {}
//     //                                 }}
//     //                             >
//     //                                 <Box sx={{ display: 'flex', alignItems: 'center' }}>
//     //                                     {viewMode === 'receiptDetail' && (
//     //                                         <IconButton
//     //                                             size="small"
//     //                                             sx={{
//     //                                                 color: progressColor,
//     //                                                 backgroundColor: `${progressColor}15`,
//     //                                                 mr: 2,
//     //                                                 '&:hover': {
//     //                                                     backgroundColor: `${progressColor}25`,
//     //                                                 }
//     //                                             }}
//     //                                         >
//     //                                             {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
//     //                                         </IconButton>
//     //                                     )}
//     //
//     //                                     <Box sx={{ flex: '0 0 31%', ml: viewMode === 'week' ? 6 : 0 }}>
//     //                                         <Typography sx={{
//     //                                             color: maroonColor,
//     //                                             fontWeight: 600,
//     //                                             fontSize: '0.9rem'
//     //                                         }}>
//     //                                             {week.weekLabel}
//     //                                         </Typography>
//     //                                         <Typography variant="caption" sx={{ color: 'text.secondary' }}>
//     //                                             {format(week.startDate, 'MMM d')} - {format(week.endDate, 'MMM d, yyyy')} • {week.receipts.length} receipt{week.receipts.length !== 1 ? 's' : ''}
//     //                                         </Typography>
//     //                                     </Box>
//     //
//     //                                     <Typography sx={{ flex: '0 0 18%', textAlign: 'right', fontWeight: 500 }}>
//     //                                         ${week.budgetAmount.toFixed(2)}
//     //                                     </Typography>
//     //
//     //                                     <Typography sx={{ flex: '0 0 18%', textAlign: 'right', fontWeight: 500 }}>
//     //                                         ${week.actualSpent.toFixed(2)}
//     //                                     </Typography>
//     //
//     //                                     <Typography sx={{
//     //                                         flex: '0 0 18%',
//     //                                         textAlign: 'right',
//     //                                         fontWeight: 600,
//     //                                         color: week.remaining >= 0 ? '#059669' : '#dc2626'
//     //                                     }}>
//     //                                         ${Math.abs(week.remaining).toFixed(2)}
//     //                                         <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
//     //                                             {week.remaining >= 0 ? 'under' : 'over'}
//     //                                         </Typography>
//     //                                     </Typography>
//     //
//     //                                     <Box sx={{ flex: '0 0 11%', pl: 2 }}>
//     //                                         <Tooltip title={`${week.percentUsed.toFixed(1)}% used`}>
//     //                                             <Box>
//     //                                                 <LinearProgress
//     //                                                     variant="determinate"
//     //                                                     value={Math.min(week.percentUsed, 100)}
//     //                                                     sx={{
//     //                                                         height: 8,
//     //                                                         borderRadius: 4,
//     //                                                         backgroundColor: `${progressColor}20`,
//     //                                                         '& .MuiLinearProgress-bar': {
//     //                                                             backgroundColor: progressColor,
//     //                                                             borderRadius: 4
//     //                                                         }
//     //                                                     }}
//     //                                                 />
//     //                                             </Box>
//     //                                         </Tooltip>
//     //                                     </Box>
//     //                                 </Box>
//     //                             </Box>
//     //
//     //                             {viewMode === 'receiptDetail' && isExpanded && week.receipts.length > 0 && (
//     //                                 <Box sx={{
//     //                                     maxHeight: '330px',
//     //                                     overflowY: 'auto',
//     //                                     backgroundColor: '#fafafa',
//     //                                     ...(isLast && {
//     //                                         borderBottomLeftRadius: '16px',
//     //                                         borderBottomRightRadius: '16px',
//     //                                     }),
//     //                                     '&::-webkit-scrollbar': {
//     //                                         width: '8px',
//     //                                     },
//     //                                     '&::-webkit-scrollbar-track': {
//     //                                         backgroundColor: 'rgba(0,0,0,0.05)',
//     //                                     },
//     //                                     '&::-webkit-scrollbar-thumb': {
//     //                                         backgroundColor: progressColor,
//     //                                         borderRadius: '4px',
//     //                                         '&:hover': {
//     //                                             backgroundColor: `${progressColor}dd`,
//     //                                         },
//     //                                     },
//     //                                 }}>
//     //                                     <Table sx={{ tableLayout: 'fixed' }}>
//     //                                         <TableBody>
//     //                                             {week.receipts.map((receipt) => (
//     //                                                 <TableRow
//     //                                                     key={receipt.id}
//     //                                                     onClick={() => handleReceiptClick(receipt)}
//     //                                                     sx={{
//     //                                                         cursor: 'pointer',
//     //                                                         backgroundColor: selectedReceiptId === receipt.id ? 'rgba(128, 0, 0, 0.08)' : 'transparent',
//     //                                                         '&:hover': {
//     //                                                             backgroundColor: selectedReceiptId === receipt.id
//     //                                                                 ? 'rgba(128, 0, 0, 0.12)'
//     //                                                                 : 'rgba(128, 0, 0, 0.04)',
//     //                                                         }
//     //                                                     }}
//     //                                                 >
//     //                                                     <TableCell sx={{ width: '35%', pl: 8 }}>
//     //                                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//     //                                                             <ReceiptIcon sx={{ fontSize: 18, color: tealColor }} />
//     //                                                             <Box>
//     //                                                                 <Typography variant="body2" fontWeight={500}>
//     //                                                                     {receipt.storeName}
//     //                                                                 </Typography>
//     //                                                                 <Typography variant="caption" color="text.secondary">
//     //                                                                     {format(parseISO(receipt.purchaseDate), 'MMM d, yyyy')} • {receipt.itemCount} item{receipt.itemCount !== 1 ? 's' : ''}
//     //                                                                 </Typography>
//     //                                                             </Box>
//     //                                                         </Box>
//     //                                                     </TableCell>
//     //                                                     <TableCell align="right" sx={{ width: '18%' }}>
//     //                                                         <Typography variant="body2" color="text.secondary">—</Typography>
//     //                                                     </TableCell>
//     //                                                     <TableCell align="right" sx={{ width: '18%' }}>
//     //                                                         <Typography variant="body2" fontWeight={600}>
//     //                                                             ${receipt.totalCost.toFixed(2)}
//     //                                                         </Typography>
//     //                                                     </TableCell>
//     //                                                     <TableCell align="right" sx={{ width: '18%' }}>
//     //                                                         <Typography variant="body2" color="text.secondary">—</Typography>
//     //                                                     </TableCell>
//     //                                                     <TableCell sx={{ width: '11%' }}></TableCell>
//     //                                                 </TableRow>
//     //                                             ))}
//     //                                         </TableBody>
//     //                                     </Table>
//     //                                 </Box>
//     //                             )}
//     //
//     //                             {viewMode === 'receiptDetail' && isExpanded && week.receipts.length === 0 && (
//     //                                 <Box sx={{
//     //                                     p: 3,
//     //                                     textAlign: 'center',
//     //                                     color: 'text.secondary',
//     //                                     fontStyle: 'italic',
//     //                                     backgroundColor: '#fafafa',
//     //                                     ...(isLast && {
//     //                                         borderBottomLeftRadius: '16px',
//     //                                         borderBottomRightRadius: '16px',
//     //                                     })
//     //                                 }}>
//     //                                     No receipts for this week
//     //                                 </Box>
//     //                             )}
//     //                         </Box>
//     //                     );
//     //                 })}
//     //             </Box>
//     //         </Paper>
//     //     </Box>
//     // );
//     //
//     //
//
// };
//
// export default GroceryBudgetTable;