import React, { useMemo, useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Divider,
    Stack,
    Chip,
    LinearProgress,
    alpha,
    useTheme,
    Card,
    Grid,
    Tooltip,
    Collapse,
    IconButton
} from '@mui/material';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { GroceryBudgetWithTotals } from '../config/Types';
import { parseISO, isWithinInterval, endOfWeek, addWeeks, differenceInWeeks } from 'date-fns';

interface GroceryListItem {
    itemName: string;
    estimatedCost: number;
}

interface GroceryListStatsProps {
    budget: GroceryBudgetWithTotals;
    selectedWeek?: number; // If provided, show stats for that week only
}

interface ListItemAnalysis {
    itemName: string;
    planned: boolean;
    estimatedCost?: number;
    actualCost: number;
    savings: number;
    purchaseCount: number;
}

const maroonColor = '#800000';
const tealColor = '#0d9488';
const purpleColor = '#7c3aed';
const warningColor = '#ea580c';
const successColor = '#059669';

const GroceryListStatsPanel: React.FC<GroceryListStatsProps> = ({
                                                                    budget,
                                                                    selectedWeek
                                                                }) => {
    const theme = useTheme();
    const [expandedSections, setExpandedSections] = useState({
        plannedItems: true,
        unplannedItems: true,
        topSavings: false
    });

    // Calculate grocery list analytics
    const listAnalytics = useMemo(() => {
        if (!budget.plannedItems || budget.plannedItems.length === 0) {
            return null;
        }

        // Get all purchased items
        const allItems = budget.stores.flatMap(store =>
            store.items.map(item => ({
                ...item,
                storeName: store.storeName
            }))
        );

        // Filter by week if specified
        const filteredItems = selectedWeek ? allItems.filter(item => {
            const startDate = parseISO(budget.startDate);
            const endDate = parseISO(budget.endDate);
            const totalWeeks = Math.ceil(differenceInWeeks(endDate, startDate)) + 1;

            const weekStart = addWeeks(startDate, selectedWeek - 1);
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
            const actualWeekEnd = weekEnd > endDate ? endDate : weekEnd;

            const itemDate = parseISO(item.datePurchased);
            return isWithinInterval(itemDate, { start: weekStart, end: actualWeekEnd });
        }) : allItems;

        // Create a map of planned items
        const plannedItemsMap = new Map(
            budget.plannedItems.map(item => [item.itemName.toLowerCase(), item])
        );

        // Analyze each purchased item
        const itemAnalysis: ListItemAnalysis[] = [];
        const purchasedFromList: ListItemAnalysis[] = [];
        const unplannedPurchases: ListItemAnalysis[] = [];

        // Group purchased items
        const purchasedItemsMap = new Map<string, { actualCost: number; count: number }>();
        filteredItems.forEach(item => {
            const key = item.itemName.toLowerCase();
            if (!purchasedItemsMap.has(key)) {
                purchasedItemsMap.set(key, { actualCost: 0, count: 0 });
            }
            const data = purchasedItemsMap.get(key)!;
            data.actualCost += item.itemCost;
            data.count += 1;
        });

        // Analyze each purchased item
        purchasedItemsMap.forEach((data, itemKey) => {
            const plannedItem = plannedItemsMap.get(itemKey);
            const analysis: ListItemAnalysis = {
                itemName: filteredItems.find(i => i.itemName.toLowerCase() === itemKey)?.itemName || itemKey,
                planned: !!plannedItem,
                estimatedCost: plannedItem?.estimatedCost,
                actualCost: data.actualCost,
                savings: plannedItem ? plannedItem.estimatedCost - data.actualCost : 0,
                purchaseCount: data.count
            };

            itemAnalysis.push(analysis);
            if (plannedItem) {
                purchasedFromList.push(analysis);
            } else {
                unplannedPurchases.push(analysis);
            }
        });

        // Calculate totals
        const totalPlannedCost = budget.plannedItems.reduce((sum, item) => sum + item.estimatedCost, 0);
        const totalActualCost = filteredItems.reduce((sum, item) => sum + item.itemCost, 0);
        const plannedItemsActualCost = purchasedFromList.reduce((sum, item) => sum + item.actualCost, 0);
        const unplannedCost = unplannedPurchases.reduce((sum, item) => sum + item.actualCost, 0);
        const totalSavings = purchasedFromList.reduce((sum, item) => sum + item.savings, 0);

        // Adherence rate
        const adherenceRate = filteredItems.length > 0
            ? (purchasedFromList.length / filteredItems.length) * 100
            : 0;

        // Items on list but not purchased
        const missedItems = budget.plannedItems.filter(planned =>
            !purchasedItemsMap.has(planned.itemName.toLowerCase())
        );

        // Sort for display
        purchasedFromList.sort((a, b) => b.actualCost - a.actualCost);
        unplannedPurchases.sort((a, b) => b.actualCost - a.actualCost);

        // Top savings
        const topSavings = [...purchasedFromList]
            .filter(item => item.savings > 0)
            .sort((a, b) => b.savings - a.savings);

        return {
            totalPlannedCost,
            totalActualCost,
            plannedItemsActualCost,
            unplannedCost,
            totalSavings,
            adherenceRate,
            plannedItemsCount: budget.plannedItems.length,
            purchasedFromListCount: purchasedFromList.length,
            unplannedCount: unplannedPurchases.length,
            missedItemsCount: missedItems.length,
            purchasedFromList,
            unplannedPurchases,
            missedItems,
            topSavings
        };
    }, [budget, selectedWeek]);

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    if (!listAnalytics) {
        return (
            <Paper sx={{
                height: '100%',
                borderRadius: 4,
                boxShadow: 3,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                p: 3
            }}>
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <PlaylistAddCheckIcon sx={{ fontSize: 64, color: theme.palette.divider, mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        No Grocery List
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Create a grocery list to see detailed analytics
                    </Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper sx={{
            height: '100%',
            borderRadius: 4,
            boxShadow: 3,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <Box sx={{
                background: `linear-gradient(135deg, ${purpleColor} 0%, #8b5cf6 100%)`,
                color: 'white',
                p: 3
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PlaylistAddCheckIcon />
                    <Typography variant="h6" fontWeight={600}>
                        Grocery List Stats
                    </Typography>
                </Box>

                {/* Adherence Badge */}
                <Chip
                    icon={<CheckCircleIcon />}
                    label={`${listAnalytics.adherenceRate.toFixed(0)}% List Adherence`}
                    sx={{
                        background: listAnalytics.adherenceRate >= 70
                            ? 'rgba(5, 150, 105, 0.9)'
                            : listAnalytics.adherenceRate >= 50
                                ? 'rgba(245, 158, 11, 0.9)'
                                : 'rgba(220, 38, 38, 0.9)',
                        color: 'white',
                        fontWeight: 700
                    }}
                />
            </Box>

            {/* Content */}
            <Box sx={{
                flex: 1,
                overflowY: 'auto',
                p: 3,
                '&::-webkit-scrollbar': {
                    width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                    backgroundColor: 'rgba(0,0,0,0.05)',
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: purpleColor,
                    borderRadius: '4px',
                    '&:hover': {
                        backgroundColor: '#6d28d9',
                    },
                },
            }}>
                {/* Overview Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                        <Card sx={{ p: 2, bgcolor: alpha(purpleColor, 0.05), borderRadius: 3 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Planned Budget
                            </Typography>
                            <Typography variant="h5" fontWeight={700} color={purpleColor}>
                                ${listAnalytics.totalPlannedCost.toFixed(2)}
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={6}>
                        <Card sx={{ p: 2, bgcolor: alpha(maroonColor, 0.05), borderRadius: 3 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Actual Spent
                            </Typography>
                            <Typography variant="h5" fontWeight={700} color={maroonColor}>
                                ${listAnalytics.totalActualCost.toFixed(2)}
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={6}>
                        <Card sx={{ p: 2, bgcolor: alpha(tealColor, 0.05), borderRadius: 3 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                From List
                            </Typography>
                            <Typography variant="h5" fontWeight={700} color={tealColor}>
                                ${listAnalytics.plannedItemsActualCost.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {listAnalytics.purchasedFromListCount} items
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={6}>
                        <Card sx={{ p: 2, bgcolor: alpha(warningColor, 0.05), borderRadius: 3 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Unplanned
                            </Typography>
                            <Typography variant="h5" fontWeight={700} color={warningColor}>
                                ${listAnalytics.unplannedCost.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {listAnalytics.unplannedCount} items
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>

                {/* Savings Summary */}
                <Card sx={{
                    p: 2.5,
                    mb: 3,
                    bgcolor: listAnalytics.totalSavings >= 0 ? alpha(successColor, 0.05) : alpha(warningColor, 0.05),
                    borderRadius: 3,
                    border: `1px solid ${listAnalytics.totalSavings >= 0 ? alpha(successColor, 0.2) : alpha(warningColor, 0.2)}`
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                            {listAnalytics.totalSavings >= 0 ? 'Total Savings' : 'Overspent'}
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color={listAnalytics.totalSavings >= 0 ? successColor : warningColor}>
                            {listAnalytics.totalSavings >= 0 ? '+' : ''}${listAnalytics.totalSavings.toFixed(2)}
                        </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                        Compared to planned list budget
                    </Typography>
                </Card>

                {/* Quick Stats */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                        <Card sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 3 }}>
                            <ShoppingCartIcon sx={{ fontSize: 20, color: theme.palette.info.main, mb: 1 }} />
                            <Typography variant="h6" fontWeight={700}>
                                {listAnalytics.plannedItemsCount}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Items on List
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={6}>
                        <Card sx={{ p: 2, bgcolor: alpha(warningColor, 0.05), borderRadius: 3 }}>
                            <WarningAmberIcon sx={{ fontSize: 20, color: warningColor, mb: 1 }} />
                            <Typography variant="h6" fontWeight={700}>
                                {listAnalytics.missedItemsCount}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Not Purchased
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>

                {/* Purchased from List */}
                <Box sx={{ mb: 3 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 2,
                            cursor: 'pointer',
                            p: 1,
                            borderRadius: 2,
                            '&:hover': {
                                bgcolor: alpha(theme.palette.action.hover, 0.05)
                            }
                        }}
                        onClick={() => toggleSection('plannedItems')}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleIcon sx={{ fontSize: 20, color: tealColor }} />
                            <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                                Purchased from List
                            </Typography>
                            <Chip
                                label={listAnalytics.purchasedFromListCount}
                                size="small"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                        </Box>
                        <IconButton size="small">
                            {expandedSections.plannedItems ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>

                    <Collapse in={expandedSections.plannedItems}>
                        <Stack spacing={1.5}>
                            {listAnalytics.purchasedFromList.slice(0, 5).map((item, index) => (
                                <Card
                                    key={index}
                                    sx={{
                                        p: 2,
                                        bgcolor: alpha(tealColor, 0.02),
                                        borderRadius: 2,
                                        border: `1px solid ${alpha(tealColor, 0.1)}`
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Typography variant="body2" fontWeight={600}>
                                            {item.itemName}
                                        </Typography>
                                        <Typography variant="body1" fontWeight={700} color={tealColor}>
                                            ${item.actualCost.toFixed(2)}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Planned: ${item.estimatedCost?.toFixed(2)} • Bought {item.purchaseCount}x
                                        </Typography>
                                        {item.savings !== 0 && (
                                            <Chip
                                                label={`${item.savings > 0 ? 'Saved' : 'Over'} $${Math.abs(item.savings).toFixed(2)}`}
                                                size="small"
                                                sx={{
                                                    height: 18,
                                                    fontSize: '0.65rem',
                                                    bgcolor: item.savings > 0 ? alpha(successColor, 0.1) : alpha(warningColor, 0.1),
                                                    color: item.savings > 0 ? successColor : warningColor
                                                }}
                                            />
                                        )}
                                    </Box>
                                </Card>
                            ))}
                            {listAnalytics.purchasedFromList.length > 5 && (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ textAlign: 'center', fontStyle: 'italic', pt: 1 }}
                                >
                                    +{listAnalytics.purchasedFromList.length - 5} more items
                                </Typography>
                            )}
                        </Stack>
                    </Collapse>
                </Box>

                {/* Unplanned Purchases */}
                {listAnalytics.unplannedCount > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mb: 2,
                                p: 2,
                                bgcolor: alpha(warningColor, 0.05),
                                borderRadius: 2,
                                border: `1px solid ${alpha(warningColor, 0.2)}`,
                                cursor: 'pointer',
                                '&:hover': {
                                    bgcolor: alpha(warningColor, 0.08)
                                }
                            }}
                            onClick={() => toggleSection('unplannedItems')}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                <WarningAmberIcon sx={{ fontSize: 20, color: warningColor }} />
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="subtitle2" fontWeight={600} color={warningColor}>
                                            Unplanned Purchases
                                        </Typography>
                                        <Chip
                                            label={listAnalytics.unplannedCount}
                                            size="small"
                                            sx={{
                                                height: 20,
                                                fontSize: '0.7rem',
                                                bgcolor: alpha(warningColor, 0.15),
                                                color: warningColor
                                            }}
                                        />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Total: ${listAnalytics.unplannedCost.toFixed(2)}
                                    </Typography>
                                </Box>
                            </Box>
                            <IconButton size="small" sx={{ color: warningColor }}>
                                {expandedSections.unplannedItems ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        </Box>

                        <Collapse in={expandedSections.unplannedItems}>
                            <Stack spacing={1.5}>
                                {listAnalytics.unplannedPurchases.slice(0, 5).map((item, index) => (
                                    <Card
                                        key={index}
                                        sx={{
                                            p: 2,
                                            bgcolor: alpha(warningColor, 0.02),
                                            borderRadius: 2,
                                            border: `1px solid ${alpha(warningColor, 0.15)}`
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Typography variant="body2" fontWeight={600}>
                                                {item.itemName}
                                            </Typography>
                                            <Typography variant="body1" fontWeight={700} color={warningColor}>
                                                ${item.actualCost.toFixed(2)}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip
                                                label="Impulse Buy"
                                                size="small"
                                                sx={{
                                                    height: 18,
                                                    fontSize: '0.65rem',
                                                    bgcolor: alpha(warningColor, 0.15),
                                                    color: warningColor
                                                }}
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                Bought {item.purchaseCount}x
                                            </Typography>
                                        </Box>
                                    </Card>
                                ))}
                                {listAnalytics.unplannedPurchases.length > 5 && (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ textAlign: 'center', fontStyle: 'italic', pt: 1 }}
                                    >
                                        +{listAnalytics.unplannedPurchases.length - 5} more items
                                    </Typography>
                                )}
                            </Stack>
                        </Collapse>
                    </Box>
                )}

                {/* Top Savings */}
                {listAnalytics.topSavings.length > 0 && (
                    <Box>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mb: 2,
                                cursor: 'pointer',
                                p: 1,
                                borderRadius: 2,
                                '&:hover': {
                                    bgcolor: alpha(theme.palette.action.hover, 0.05)
                                }
                            }}
                            onClick={() => toggleSection('topSavings')}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TrendingDownIcon sx={{ fontSize: 20, color: successColor }} />
                                <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                                    Top Savings
                                </Typography>
                                <Chip
                                    label={listAnalytics.topSavings.length}
                                    size="small"
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                            </Box>
                            <IconButton size="small">
                                {expandedSections.topSavings ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        </Box>

                        <Collapse in={expandedSections.topSavings}>
                            <Stack spacing={1.5}>
                                {listAnalytics.topSavings.slice(0, 3).map((item, index) => (
                                    <Card
                                        key={index}
                                        sx={{
                                            p: 2,
                                            bgcolor: alpha(successColor, 0.05),
                                            borderRadius: 2,
                                            border: `1px solid ${alpha(successColor, 0.2)}`
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Typography variant="body2" fontWeight={600}>
                                                {item.itemName}
                                            </Typography>
                                            <Chip
                                                icon={<TrendingDownIcon sx={{ fontSize: 14 }} />}
                                                label={`-$${item.savings.toFixed(2)}`}
                                                size="small"
                                                sx={{
                                                    bgcolor: successColor,
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    height: 22
                                                }}
                                            />
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Planned: ${item.estimatedCost?.toFixed(2)} • Actual: ${item.actualCost.toFixed(2)}
                                        </Typography>
                                    </Card>
                                ))}
                            </Stack>
                        </Collapse>
                    </Box>
                )}
            </Box>
        </Paper>
    );
};

export default GroceryListStatsPanel;