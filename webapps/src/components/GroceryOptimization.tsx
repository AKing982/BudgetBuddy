import React, { useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Card,
    CardContent,
    Grid,
    Stack,
    Chip,
    LinearProgress,
    alpha,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Alert,
    IconButton,
    Collapse
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import StoreIcon from '@mui/icons-material/Store';
import CategoryIcon from '@mui/icons-material/Category';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimelineIcon from '@mui/icons-material/Timeline';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SavingsIcon from '@mui/icons-material/Savings';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { GroceryBudgetWithTotals, GroceryItem } from '../config/Types';
import { WeekData } from './GroceryBudgetTable';

const maroonColor = '#800000';
const tealColor = '#0d9488';

interface OptimizationInsight {
    type: 'warning' | 'success' | 'info' | 'tip';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    potentialSavings?: number;
    actionItems?: string[];
    icon: React.ReactNode;
}

interface StoreComparison {
    storeName: string;
    totalSpent: number;
    avgItemCost: number;
    itemCount: number;
    tripCount: number;
    avgTripCost: number;
}

interface CategoryAnalysis {
    category: string;
    totalSpent: number;
    percentOfBudget: number;
    itemCount: number;
    avgItemCost: number;
    trend: 'increasing' | 'stable' | 'decreasing';
}

interface GroceryOptimizationProps {
    budget: GroceryBudgetWithTotals;
    weeklyData: WeekData[];
}

const GroceryOptimization: React.FC<GroceryOptimizationProps> = ({ budget, weeklyData }) => {
    const [expandedInsight, setExpandedInsight] = React.useState<number | null>(0);

    // Analyze store spending patterns
    const storeAnalysis = useMemo((): StoreComparison[] => {
        const storeMap = new Map<string, { items: GroceryItem[], trips: Set<string> }>();

        budget.stores.forEach(store => {
            if (!storeMap.has(store.storeName)) {
                storeMap.set(store.storeName, { items: [], trips: new Set() });
            }
            const storeData = storeMap.get(store.storeName)!;
            store.items.forEach(item => {
                storeData.items.push(item);
                storeData.trips.add(item.datePurchased);
            });
        });

        return Array.from(storeMap.entries()).map(([storeName, data]) => ({
            storeName,
            totalSpent: data.items.reduce((sum, item) => sum + item.itemCost, 0),
            avgItemCost: data.items.reduce((sum, item) => sum + item.itemCost, 0) / data.items.length,
            itemCount: data.items.length,
            tripCount: data.trips.size,
            avgTripCost: data.items.reduce((sum, item) => sum + item.itemCost, 0) / data.trips.size
        })).sort((a, b) => b.totalSpent - a.totalSpent);
    }, [budget]);

    // Analyze category spending
    const categoryAnalysis = useMemo((): CategoryAnalysis[] => {
        const categoryMap = new Map<string, GroceryItem[]>();

        budget.stores.forEach(store => {
            store.items.forEach(item => {
                const category = item.category || 'Uncategorized';
                if (!categoryMap.has(category)) {
                    categoryMap.set(category, []);
                }
                categoryMap.get(category)!.push(item);
            });
        });

        return Array.from(categoryMap.entries()).map(([category, items]) => {
            const totalSpent = items.reduce((sum, item) => sum + item.itemCost, 0);
            return {
                category,
                totalSpent,
                percentOfBudget: (totalSpent / budget.totalSpent) * 100,
                itemCount: items.length,
                avgItemCost: totalSpent / items.length,
                trend: 'stable' as const // Would need historical data for real trend
            };
        }).sort((a, b) => b.totalSpent - a.totalSpent);
    }, [budget]);

    // Generate optimization insights
    const insights = useMemo((): OptimizationInsight[] => {
        const insights: OptimizationInsight[] = [];

        // 1. High-cost store warning
        if (storeAnalysis.length > 1) {
            const mostExpensive = storeAnalysis[0];
            const leastExpensive = storeAnalysis[storeAnalysis.length - 1];
            const avgCostDiff = mostExpensive.avgItemCost - leastExpensive.avgItemCost;

            if (avgCostDiff > 2) {
                const potentialSavings = (mostExpensive.itemCount * avgCostDiff);
                insights.push({
                    type: 'warning',
                    title: 'High-Cost Store Detected',
                    description: `${mostExpensive.storeName} has an average item cost of $${mostExpensive.avgItemCost.toFixed(2)}, compared to $${leastExpensive.avgItemCost.toFixed(2)} at ${leastExpensive.storeName}.`,
                    impact: 'high',
                    potentialSavings,
                    actionItems: [
                        `Consider buying more items at ${leastExpensive.storeName}`,
                        'Compare prices before shopping',
                        'Use price-tracking apps for common items'
                    ],
                    icon: <StoreIcon />
                });
            }
        }

        // 2. Category overspending
        const topCategory = categoryAnalysis[0];
        if (topCategory && topCategory.percentOfBudget > 30) {
            insights.push({
                type: 'warning',
                title: `${topCategory.category} is ${topCategory.percentOfBudget.toFixed(0)}% of Your Budget`,
                description: `You're spending $${topCategory.totalSpent.toFixed(2)} on ${topCategory.category}, which is a significant portion of your grocery budget.`,
                impact: 'medium',
                potentialSavings: topCategory.totalSpent * 0.15, // Estimate 15% savings
                actionItems: [
                    'Look for store-brand alternatives',
                    'Buy in bulk for frequently used items',
                    'Check for sales and use coupons',
                    'Meal plan to reduce waste'
                ],
                icon: <CategoryIcon />
            });
        }

        // 3. Frequent small trips
        const frequentSmallTrips = storeAnalysis.filter(store =>
            store.tripCount > 3 && store.avgTripCost < 30
        );

        if (frequentSmallTrips.length > 0) {
            const store = frequentSmallTrips[0];
            insights.push({
                type: 'tip',
                title: 'Consolidate Shopping Trips',
                description: `You made ${store.tripCount} trips to ${store.storeName} averaging $${store.avgTripCost.toFixed(2)} per trip. Consolidating could save time and prevent impulse purchases.`,
                impact: 'medium',
                potentialSavings: store.tripCount * 5, // Estimate $5 savings per avoided trip
                actionItems: [
                    'Plan weekly shopping trips',
                    'Make a shopping list and stick to it',
                    'Batch purchases to reduce trips',
                    'Keep a running list throughout the week'
                ],
                icon: <TimelineIcon />
            });
        }

        // 4. Budget performance praise
        const weeksUnderBudget = weeklyData.filter(w => w.remaining > 0).length;
        const totalWeeks = weeklyData.length;

        if (weeksUnderBudget / totalWeeks >= 0.75) {
            insights.push({
                type: 'success',
                title: 'Excellent Budget Discipline!',
                description: `You stayed under budget ${weeksUnderBudget} out of ${totalWeeks} weeks. Keep up the great work!`,
                impact: 'low',
                actionItems: [
                    'Continue your current shopping habits',
                    'Consider lowering your budget slightly to save more',
                    'Share your strategies with friends'
                ],
                icon: <CheckCircleIcon />
            });
        }

        // 5. High-value item suggestions
        const expensiveItems = budget.stores
            .flatMap(store => store.items)
            .filter(item => item.itemCost > 20)
            .sort((a, b) => b.itemCost - a.itemCost)
            .slice(0, 3);

        if (expensiveItems.length > 0) {
            const totalExpensiveCost = expensiveItems.reduce((sum, item) => sum + item.itemCost, 0);
            insights.push({
                type: 'info',
                title: 'High-Value Items to Watch',
                description: `Your top ${expensiveItems.length} most expensive items total $${totalExpensiveCost.toFixed(2)}. These are worth price-comparing.`,
                impact: 'high',
                potentialSavings: totalExpensiveCost * 0.10,
                actionItems: [
                    `${expensiveItems[0].itemName} - $${expensiveItems[0].itemCost.toFixed(2)}`,
                    expensiveItems[1] ? `${expensiveItems[1].itemName} - $${expensiveItems[1].itemCost.toFixed(2)}` : '',
                    expensiveItems[2] ? `${expensiveItems[2].itemName} - $${expensiveItems[2].itemCost.toFixed(2)}` : '',
                    'Look for sales on these premium items',
                    'Consider generic alternatives for similar quality'
                ].filter(Boolean),
                icon: <LocalOfferIcon />
            });
        }

        // 6. Week-to-week consistency
        const weeklyVariance = weeklyData.reduce((sum, week) => {
            const avgWeekly = budget.totalSpent / weeklyData.length;
            return sum + Math.abs(week.actualSpent - avgWeekly);
        }, 0) / weeklyData.length;

        const avgWeekly = budget.totalSpent / weeklyData.length;
        if (weeklyVariance > avgWeekly * 0.5) {
            insights.push({
                type: 'tip',
                title: 'Inconsistent Weekly Spending',
                description: `Your weekly spending varies significantly (avg $${weeklyVariance.toFixed(2)} variance). More consistent spending helps budgeting.`,
                impact: 'low',
                actionItems: [
                    'Create a weekly meal plan',
                    'Stock up on staples when on sale',
                    'Set a weekly spending limit',
                    'Track spending throughout the week'
                ],
                icon: <CompareArrowsIcon />
            });
        }

        return insights;
    }, [storeAnalysis, categoryAnalysis, weeklyData, budget]);

    const totalPotentialSavings = insights.reduce((sum, insight) =>
        sum + (insight.potentialSavings || 0), 0
    );

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case 'high': return '#dc2626';
            case 'medium': return '#f59e0b';
            case 'low': return '#059669';
            default: return tealColor;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'warning': return '#f59e0b';
            case 'success': return '#059669';
            case 'info': return '#3b82f6';
            case 'tip': return tealColor;
            default: return maroonColor;
        }
    };

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{
                    fontWeight: 700,
                    color: maroonColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1
                }}>
                    <LightbulbIcon sx={{ fontSize: 32, color: '#f59e0b' }} />
                    Budget Optimization Insights
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Smart recommendations to help you save more on groceries
                </Typography>
            </Box>

            {/* Savings Potential Summary */}
            <Card sx={{
                mb: 4,
                background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                color: 'white',
                boxShadow: '0 8px 24px rgba(124, 58, 237, 0.35)'
            }}>
                <CardContent>
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                                }}>
                                    <SavingsIcon sx={{ fontSize: 40 }} />
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1 }}>
                                        Potential Monthly Savings
                                    </Typography>
                                    <Typography variant="h3" fontWeight="bold">
                                        ${totalPotentialSavings.toFixed(2)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                                        Based on {insights.length} optimization opportunities
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                {['high', 'medium', 'low'].map(impact => {
                                    const count = insights.filter(i => i.impact === impact).length;
                                    if (count === 0) return null;
                                    return (
                                        <Box key={impact} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                bgcolor: getImpactColor(impact)
                                            }} />
                                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                                {count} {impact} impact {count === 1 ? 'insight' : 'insights'}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Insights Cards */}
            <Stack spacing={2}>
                {insights.map((insight, index) => (
                    <Card
                        key={index}
                        sx={{
                            border: `2px solid ${alpha(getTypeColor(insight.type), 0.3)}`,
                            borderRadius: 3,
                            overflow: 'hidden',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                boxShadow: 4,
                                borderColor: getTypeColor(insight.type)
                            }
                        }}
                    >
                        <Box
                            onClick={() => setExpandedInsight(expandedInsight === index ? null : index)}
                            sx={{
                                p: 2.5,
                                cursor: 'pointer',
                                bgcolor: alpha(getTypeColor(insight.type), 0.05),
                                borderBottom: `1px solid ${alpha(getTypeColor(insight.type), 0.1)}`
                            }}
                        >
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={8}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                        <Box sx={{
                                            p: 1,
                                            borderRadius: 2,
                                            bgcolor: alpha(getTypeColor(insight.type), 0.15),
                                            color: getTypeColor(insight.type)
                                        }}>
                                            {insight.icon}
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Typography variant="h6" fontWeight={700} color={maroonColor}>
                                                    {insight.title}
                                                </Typography>
                                                <Chip
                                                    label={insight.impact}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: alpha(getImpactColor(insight.impact), 0.2),
                                                        color: getImpactColor(insight.impact),
                                                        fontWeight: 700,
                                                        fontSize: '0.7rem',
                                                        height: 20,
                                                        textTransform: 'uppercase'
                                                    }}
                                                />
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {insight.description}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {insight.potentialSavings && (
                                            <Paper sx={{
                                                px: 2,
                                                py: 1,
                                                bgcolor: alpha('#059669', 0.1),
                                                borderRadius: 2,
                                                flex: 1,
                                                mr: 2
                                            }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                                    POTENTIAL SAVINGS
                                                </Typography>
                                                <Typography variant="h6" fontWeight={700} color="#059669">
                                                    ${insight.potentialSavings.toFixed(2)}
                                                </Typography>
                                            </Paper>
                                        )}
                                        <IconButton size="small">
                                            {expandedInsight === index ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </IconButton>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>

                        <Collapse in={expandedInsight === index} timeout="auto">
                            <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: tealColor }}>
                                    💡 Action Steps:
                                </Typography>
                                <List dense>
                                    {insight.actionItems?.map((action, actionIndex) => (
                                        <ListItem key={actionIndex} sx={{ py: 0.5 }}>
                                            <ListItemIcon sx={{ minWidth: 32 }}>
                                                <CheckCircleIcon sx={{ fontSize: 18, color: tealColor }} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={action}
                                                primaryTypographyProps={{
                                                    variant: 'body2',
                                                    fontWeight: 500
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        </Collapse>
                    </Card>
                ))}
            </Stack>

            {/* Store & Category Comparison */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
                {/* Store Comparison */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StoreIcon sx={{ color: tealColor }} />
                            Store Performance
                        </Typography>
                        <Stack spacing={2}>
                            {storeAnalysis.map((store, index) => (
                                <Box key={index}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" fontWeight={600}>
                                            {store.storeName}
                                        </Typography>
                                        <Typography variant="body2" fontWeight={700} color={maroonColor}>
                                            ${store.totalSpent.toFixed(2)}
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(store.totalSpent / budget.totalSpent) * 100}
                                        sx={{
                                            height: 8,
                                            borderRadius: 4,
                                            bgcolor: alpha(tealColor, 0.1),
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: index === 0 ? maroonColor : tealColor,
                                                borderRadius: 4
                                            }
                                        }}
                                    />
                                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {store.tripCount} trips • Avg ${store.avgTripCost.toFixed(2)}/trip
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                    </Paper>
                </Grid>

                {/* Category Breakdown */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CategoryIcon sx={{ color: maroonColor }} />
                            Top Categories
                        </Typography>
                        <Stack spacing={2}>
                            {categoryAnalysis.slice(0, 5).map((category, index) => (
                                <Box key={index}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" fontWeight={600}>
                                            {category.category}
                                        </Typography>
                                        <Typography variant="body2" fontWeight={700} color={maroonColor}>
                                            {category.percentOfBudget.toFixed(0)}%
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={category.percentOfBudget}
                                        sx={{
                                            height: 8,
                                            borderRadius: 4,
                                            bgcolor: alpha(maroonColor, 0.1),
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: category.percentOfBudget > 30 ? '#f59e0b' : tealColor,
                                                borderRadius: 4
                                            }
                                        }}
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                        ${category.totalSpent.toFixed(2)} • {category.itemCount} items • Avg ${category.avgItemCost.toFixed(2)}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default GroceryOptimization;