import React from 'react';
import {
    Box,
    Typography,
    Stack,
    alpha,
    Card,
    LinearProgress,
    Chip,
    Divider,
} from '@mui/material';
import { TrendingUp, TrendingDown, PiggyBank, ShoppingCart } from 'lucide-react';
import { GroceryBudgetWithTotals } from '../config/Types';
import { parseISO, differenceInWeeks, addWeeks, endOfWeek, isWithinInterval, format } from 'date-fns';

// ── Design tokens (exact match with GroceryTracker / BudgetPage) ──────────────
const MAROON      = '#6b1a1a';
const MAROON_DARK = '#4a1010';
const TEAL        = '#0d9488';
const GREEN       = '#059669';
const AMBER       = '#d97706';
const RED         = '#dc2626';
const NAVY        = '#1e293b';
const SLATE       = '#64748b';

interface GroceryBudgetStatsPanelProps {
    budget: GroceryBudgetWithTotals | null;
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Typography sx={{
        fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: SLATE, mb: 1.5,
    }}>
        {children}
    </Typography>
);

const InsightRow: React.FC<{
    color: string; icon: string; title: string; subtitle: string;
}> = ({ color, icon, title, subtitle }) => (
    <Box sx={{
        p: 2, borderRadius: '10px',
        bgcolor: alpha(color, 0.06),
        borderLeft: `3px solid ${color}`,
        border: `1px solid ${alpha(color, 0.18)}`,
        borderLeftWidth: 3,
    }}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color, mb: 0.25 }}>
            {icon} {title}
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', color: SLATE }}>
            {subtitle}
        </Typography>
    </Box>
);

const GroceryBudgetStatsPanel: React.FC<GroceryBudgetStatsPanelProps> = ({ budget }) => {
    if (!budget) {
        return (
            <Box sx={{
                height: '100%', borderRadius: '16px', overflow: 'hidden',
                border: `1px solid ${alpha(MAROON, 0.12)}`,
                boxShadow: `0 4px 20px ${alpha(MAROON, 0.08)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', p: 4, bgcolor: '#fafafa',
            }}>
                <Box sx={{
                    width: 56, height: 56, borderRadius: '14px',
                    bgcolor: alpha(SLATE, 0.08), display: 'flex',
                    alignItems: 'center', justifyContent: 'center', mb: 2,
                }}>
                    <PiggyBank size={26} color={SLATE} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: NAVY, mb: 0.5 }}>
                    Budget Insights
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: SLATE, textAlign: 'center' }}>
                    Statistics will appear here
                </Typography>
            </Box>
        );
    }

    const startDate  = parseISO(budget.startDate);
    const endDate    = parseISO(budget.endDate);
    const totalWeeks = Math.ceil(differenceInWeeks(endDate, startDate)) + 1;
    const weeklyBudget = budget.budgetAmount / totalWeeks;

    const allItems = budget.stores.flatMap(store =>
        store.items.map(item => ({ ...item, storeName: store.storeName }))
    );

    const weeklySpending = Array.from({ length: totalWeeks }, (_, i) => {
        const weekStart    = addWeeks(startDate, i);
        const weekEnd      = endOfWeek(weekStart, { weekStartsOn: 0 });
        const actualWeekEnd = weekEnd > endDate ? endDate : weekEnd;
        const weekItems    = allItems.filter(item =>
            isWithinInterval(parseISO(item.datePurchased), { start: weekStart, end: actualWeekEnd })
        );
        const spent = weekItems.reduce((s, item) => s + item.itemCost, 0);
        return { week: i + 1, spent, budget: weeklyBudget, percentUsed: (spent / weeklyBudget) * 100 };
    });

    const avgWeeklySpending  = weeklySpending.reduce((s, w) => s + w.spent, 0) / totalWeeks;
    const maxWeekSpending    = Math.max(...weeklySpending.map(w => w.spent));
    const minWeekSpending    = Math.min(...weeklySpending.filter(w => w.spent > 0).map(w => w.spent));
    const weeksOverBudget    = weeklySpending.filter(w => w.spent > w.budget).length;
    const weeksUnderBudget   = weeklySpending.filter(w => w.spent < w.budget).length;

    const firstHalf     = weeklySpending.slice(0, Math.floor(totalWeeks / 2));
    const secondHalf    = weeklySpending.slice(Math.floor(totalWeeks / 2));
    const firstHalfAvg  = firstHalf.reduce((s, w) => s + w.spent, 0) / (firstHalf.length || 1);
    const secondHalfAvg = secondHalf.reduce((s, w) => s + w.spent, 0) / (secondHalf.length || 1);
    const trendUp       = secondHalfAvg > firstHalfAvg;
    const trendPercent  = Math.abs(((secondHalfAvg - firstHalfAvg) / (firstHalfAvg || 1)) * 100);

    const remaining    = budget.budgetAmount - budget.totalSpent;
    const percentSpent = (budget.totalSpent / budget.budgetAmount) * 100;
    const onTrack      = remaining >= (budget.savingsGoal ?? 0);

    const progressColor = percentSpent < 70 ? TEAL : percentSpent < 90 ? AMBER : RED;

    return (
        <Box sx={{
            height: '100%', borderRadius: '16px', overflow: 'hidden',
            border: `1px solid ${alpha(MAROON, 0.12)}`,
            boxShadow: `0 4px 20px ${alpha(MAROON, 0.1)}`,
            display: 'flex', flexDirection: 'column', bgcolor: '#fff',
        }}>
            {/* ── Maroon header — matches GroceryTracker banner ── */}
            <Box sx={{
                px: 3, py: 2.5,
                background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 55%, #5a1515 100%)`,
                position: 'relative', overflow: 'hidden',
            }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative' }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: '9px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <PiggyBank size={17} color="#fff" />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', letterSpacing: '-0.01em' }}>
                            Budget Insights
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)' }}>
                            {format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* ── Scrollable body ── */}
            <Box sx={{
                flex: 1, overflowY: 'auto', p: 2.5,
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                '&::-webkit-scrollbar-thumb': { bgcolor: alpha(TEAL, 0.35), borderRadius: 3 },
            }}>

                {/* Overall progress card */}
                <SectionLabel>Overall Progress</SectionLabel>
                <Card sx={{
                    p: 2.5, mb: 3, borderRadius: '12px',
                    border: `1px solid ${alpha(progressColor, 0.2)}`,
                    bgcolor: alpha(progressColor, 0.04),
                    boxShadow: 'none',
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Box>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: SLATE, mb: 0.25 }}>
                                Total Spending
                            </Typography>
                            <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: NAVY, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                                ${budget.totalSpent.toFixed(2)}
                            </Typography>
                        </Box>
                        <Box sx={{
                            px: 1.25, py: 0.5, borderRadius: '20px',
                            bgcolor: alpha(progressColor, 0.12), color: progressColor,
                            fontSize: '0.78rem', fontWeight: 800,
                        }}>
                            {percentSpent.toFixed(0)}%
                        </Box>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(percentSpent, 100)}
                        sx={{
                            height: 8, borderRadius: 4,
                            bgcolor: alpha(progressColor, 0.12),
                            '& .MuiLinearProgress-bar': { bgcolor: progressColor, borderRadius: 4 },
                        }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography sx={{ fontSize: '0.68rem', color: SLATE }}>spent</Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: SLATE }}>${budget.budgetAmount.toFixed(2)} budget</Typography>
                    </Box>
                </Card>

                {/* Weekly analysis */}
                <SectionLabel>Weekly Analysis</SectionLabel>
                <Stack spacing={1.5} sx={{ mb: 3 }}>
                    {/* Avg vs budget */}
                    <Box sx={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        p: 2, borderRadius: '10px',
                        bgcolor: alpha(TEAL, 0.05),
                        border: `1px solid ${alpha(TEAL, 0.18)}`,
                    }}>
                        <Box>
                            <Typography sx={{ fontSize: '0.68rem', color: SLATE, mb: 0.25 }}>Average / Week</Typography>
                            <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: MAROON, fontVariantNumeric: 'tabular-nums' }}>
                                ${avgWeeklySpending.toFixed(2)}
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography sx={{ fontSize: '0.68rem', color: SLATE, mb: 0.25 }}>Budget / Week</Typography>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>
                                ${weeklyBudget.toFixed(2)}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Min / Max */}
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        {[
                            { label: 'Lowest Week', value: minWeekSpending, color: GREEN },
                            { label: 'Highest Week', value: maxWeekSpending, color: RED },
                        ].map(({ label, value, color }) => (
                            <Box key={label} sx={{
                                flex: 1, p: 2, borderRadius: '10px',
                                bgcolor: alpha(color, 0.05),
                                border: `1px solid ${alpha(color, 0.18)}`,
                            }}>
                                <Typography sx={{ fontSize: '0.68rem', color: SLATE, mb: 0.25 }}>{label}</Typography>
                                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
                                    ${value.toFixed(2)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Stack>

                {/* Spending trend */}
                <SectionLabel>Spending Trend</SectionLabel>
                <Card sx={{
                    p: 2, mb: 3, borderRadius: '10px', boxShadow: 'none',
                    bgcolor: alpha(trendUp ? RED : GREEN, 0.05),
                    border: `1px solid ${alpha(trendUp ? RED : GREEN, 0.2)}`,
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        {trendUp
                            ? <TrendingUp size={16} color={RED} />
                            : <TrendingDown size={16} color={GREEN} />
                        }
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: trendUp ? RED : GREEN }}>
                            {trendUp ? 'Increasing' : 'Decreasing'} Trend
                        </Typography>
                        <Box sx={{
                            ml: 'auto', px: 0.9, py: 0.25, borderRadius: '20px',
                            bgcolor: alpha(trendUp ? RED : GREEN, 0.12),
                            color: trendUp ? RED : GREEN,
                            fontSize: '0.68rem', fontWeight: 800,
                        }}>
                            {trendPercent.toFixed(1)}%
                        </Box>
                    </Box>
                    <Typography sx={{ fontSize: '0.75rem', color: SLATE }}>
                        Spending is {trendUp ? 'up' : 'down'} compared to earlier weeks
                    </Typography>
                </Card>

                {/* Week performance chips */}
                <SectionLabel>Week Performance</SectionLabel>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                    <Chip
                        icon={<TrendingDown size={13} />}
                        label={`${weeksUnderBudget} Under Budget`}
                        size="small"
                        sx={{
                            fontWeight: 700, fontSize: '0.72rem',
                            bgcolor: alpha(GREEN, 0.1), color: GREEN,
                            border: `1px solid ${alpha(GREEN, 0.25)}`,
                            '& .MuiChip-icon': { color: GREEN },
                        }}
                    />
                    <Chip
                        icon={<TrendingUp size={13} />}
                        label={`${weeksOverBudget} Over Budget`}
                        size="small"
                        sx={{
                            fontWeight: 700, fontSize: '0.72rem',
                            bgcolor: alpha(RED, 0.1), color: RED,
                            border: `1px solid ${alpha(RED, 0.25)}`,
                            '& .MuiChip-icon': { color: RED },
                        }}
                    />
                </Box>

                <Divider sx={{ mb: 2.5, borderColor: alpha(MAROON, 0.08) }} />

                {/* Key insights */}
                <SectionLabel>Key Insights</SectionLabel>
                <Stack spacing={1.25}>
                    <InsightRow
                        color={onTrack ? GREEN : AMBER}
                        icon={onTrack ? '✓' : '⚠'}
                        title={onTrack ? 'On track for savings goal' : 'May miss savings goal'}
                        subtitle={
                            onTrack
                                ? `$${Math.abs(remaining).toFixed(2)} remaining covers your $${(budget.savingsGoal ?? 0).toFixed(2)} target`
                                : `Need $${((budget.savingsGoal ?? 0) - remaining).toFixed(2)} more to hit your $${(budget.savingsGoal ?? 0).toFixed(2)} target`
                        }
                    />
                    <InsightRow
                        color={avgWeeklySpending > weeklyBudget ? RED : GREEN}
                        icon={avgWeeklySpending > weeklyBudget ? '↑' : '↓'}
                        title={avgWeeklySpending > weeklyBudget ? 'Weekly average exceeds budget' : 'Staying within weekly budget'}
                        subtitle={
                            avgWeeklySpending > weeklyBudget
                                ? `Averaging $${(avgWeeklySpending - weeklyBudget).toFixed(2)} over budget per week`
                                : `Averaging $${(weeklyBudget - avgWeeklySpending).toFixed(2)} under budget per week`
                        }
                    />
                    {trendUp && trendPercent > 10 && (
                        <InsightRow
                            color={AMBER}
                            icon="⚡"
                            title="Spending rising quickly"
                            subtitle="Consider reviewing recent purchases to cut back"
                        />
                    )}
                </Stack>
            </Box>
        </Box>
    );
};

export default GroceryBudgetStatsPanel;


// import React from 'react';
// import {
//     Box,
//     Paper,
//     Typography,
//     Divider,
//     Stack,
//     alpha,
//     useTheme,
//     Card,
//     LinearProgress,
//     Chip
// } from '@mui/material';
// import TrendingUpIcon from '@mui/icons-material/TrendingUp';
// import TrendingDownIcon from '@mui/icons-material/TrendingDown';
// import ShowChartIcon from '@mui/icons-material/ShowChart';
// import InsightsIcon from '@mui/icons-material/Insights';
// import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
// import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
// import { GroceryBudgetWithTotals } from "../config/Types";
//
// const maroonColor = '#800000';
// const tealColor = '#0d9488';
//
// interface GroceryBudgetStatsPanelProps {
//     budget: GroceryBudgetWithTotals | null;
// }
//
// const GroceryBudgetStatsPanel: React.FC<GroceryBudgetStatsPanelProps> = ({ budget }) => {
//     const theme = useTheme();
//
//     if (!budget) {
//         return (
//             <Paper sx={{
//                 height: '100%',
//                 borderRadius: 4,
//                 boxShadow: 3,
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 flexDirection: 'column',
//                 p: 4,
//                 background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
//             }}>
//                 <InsightsIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
//                 <Typography variant="h6" color="text.secondary" fontWeight={500}>
//                     Budget Insights
//                 </Typography>
//                 <Typography variant="body2" color="text.disabled" sx={{ mt: 1, textAlign: 'center' }}>
//                     Statistics and comparisons will appear here
//                 </Typography>
//             </Paper>
//         );
//     }
//
//     // Calculate weekly data for comparisons
//     const startDate = parseISO(budget.startDate);
//     const endDate = parseISO(budget.endDate);
//     const totalWeeks = Math.ceil(differenceInWeeks(endDate, startDate)) + 1;
//     const weeklyBudget = budget.budgetAmount / totalWeeks;
//
//     // Collect all items
//     const allItems = budget.stores.flatMap(store =>
//         store.items.map(item => ({ ...item, storeName: store.storeName }))
//     );
//
//     // Calculate spending per week
//     const weeklySpending = [];
//     for (let i = 0; i < totalWeeks; i++) {
//         const weekStart = addWeeks(startDate, i);
//         const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
//         const actualWeekEnd = weekEnd > endDate ? endDate : weekEnd;
//
//         const weekItems = allItems.filter(item => {
//             const itemDate = parseISO(item.datePurchased);
//             return isWithinInterval(itemDate, { start: weekStart, end: actualWeekEnd });
//         });
//
//         const spent = weekItems.reduce((sum, item) => sum + item.itemCost, 0);
//         weeklySpending.push({
//             week: i + 1,
//             spent,
//             budget: weeklyBudget,
//             variance: weeklyBudget - spent,
//             percentUsed: (spent / weeklyBudget) * 100
//         });
//     }
//
//     // Calculate stats
//     const avgWeeklySpending = weeklySpending.reduce((sum, w) => sum + w.spent, 0) / totalWeeks;
//     const maxWeekSpending = Math.max(...weeklySpending.map(w => w.spent));
//     const minWeekSpending = Math.min(...weeklySpending.filter(w => w.spent > 0).map(w => w.spent));
//     const weeksOverBudget = weeklySpending.filter(w => w.spent > w.budget).length;
//     const weeksUnderBudget = weeklySpending.filter(w => w.spent < w.budget).length;
//
//     // Trend analysis
//     const firstHalf = weeklySpending.slice(0, Math.floor(totalWeeks / 2));
//     const secondHalf = weeklySpending.slice(Math.floor(totalWeeks / 2));
//     const firstHalfAvg = firstHalf.reduce((sum, w) => sum + w.spent, 0) / firstHalf.length;
//     const secondHalfAvg = secondHalf.reduce((sum, w) => sum + w.spent, 0) / secondHalf.length;
//     const trendDirection = secondHalfAvg > firstHalfAvg ? 'up' : 'down';
//     const trendPercent = Math.abs(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100);
//
//     const remaining = budget.budgetAmount - budget.totalSpent;
//     const percentSpent = (budget.totalSpent / budget.budgetAmount) * 100;
//     const onTrack = remaining >= budget.savingsGoal;
//
//     const getProgressColor = (percent: number) => {
//         if (percent < 70) return tealColor;
//         if (percent < 90) return '#f59e0b';
//         return '#dc2626';
//     };
//
//     return (
//         <Paper sx={{
//             height: '100%',
//             borderRadius: 4,
//             boxShadow: 3,
//             overflow: 'hidden',
//             display: 'flex',
//             flexDirection: 'column'
//         }}>
//             {/* Header */}
//             <Box sx={{
//                 background: `linear-gradient(135deg, ${maroonColor} 0%, #a00000 100%)`,
//                 color: 'white',
//                 p: 3
//             }}>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
//                     <InsightsIcon />
//                     <Typography variant="h6" fontWeight={600}>
//                         Grocery Budget Insights
//                     </Typography>
//                 </Box>
//                 <Typography variant="caption" sx={{ opacity: 0.9 }}>
//                     {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
//                 </Typography>
//             </Box>
//
//             {/* Content */}
//             <Box sx={{
//                 flex: 1,
//                 overflowY: 'auto',
//                 p: 3,
//                 '&::-webkit-scrollbar': {
//                     width: '8px',
//                 },
//                 '&::-webkit-scrollbar-track': {
//                     backgroundColor: 'rgba(0,0,0,0.05)',
//                 },
//                 '&::-webkit-scrollbar-thumb': {
//                     backgroundColor: tealColor,
//                     borderRadius: '4px',
//                     '&:hover': {
//                         backgroundColor: '#0f766e',
//                     },
//                 },
//             }}>
//                 {/* Overall Progress */}
//                 <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                     Overall Progress
//                 </Typography>
//
//                 <Card sx={{
//                     p: 2.5,
//                     mb: 3,
//                     background: `linear-gradient(135deg, ${getProgressColor(percentSpent)}10 0%, ${getProgressColor(percentSpent)}05 100%)`,
//                     border: `1px solid ${alpha(getProgressColor(percentSpent), 0.2)}`
//                 }}>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
//                         <Typography variant="body2" color="text.secondary">
//                             Total Spending
//                         </Typography>
//                         <Typography variant="h5" fontWeight={700} color={maroonColor}>
//                             {percentSpent.toFixed(0)}%
//                         </Typography>
//                     </Box>
//                     <LinearProgress
//                         variant="determinate"
//                         value={Math.min(percentSpent, 100)}
//                         sx={{
//                             height: 10,
//                             borderRadius: 5,
//                             backgroundColor: `${getProgressColor(percentSpent)}20`,
//                             '& .MuiLinearProgress-bar': {
//                                 backgroundColor: getProgressColor(percentSpent),
//                                 borderRadius: 5
//                             }
//                         }}
//                     />
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
//                         <Typography variant="caption" color="text.secondary">
//                             ${budget.totalSpent.toFixed(2)} spent
//                         </Typography>
//                         <Typography variant="caption" color="text.secondary">
//                             ${budget.budgetAmount.toFixed(2)} total
//                         </Typography>
//                     </Box>
//                 </Card>
//
//                 {/* Weekly Averages */}
//                 <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                     Weekly Analysis
//                 </Typography>
//
//                 <Stack spacing={2} sx={{ mb: 3 }}>
//                     <Box sx={{
//                         display: 'flex',
//                         justifyContent: 'space-between',
//                         alignItems: 'center',
//                         p: 2,
//                         backgroundColor: alpha(tealColor, 0.05),
//                         borderRadius: 2,
//                         border: `1px solid ${alpha(tealColor, 0.2)}`
//                     }}>
//                         <Box>
//                             <Typography variant="caption" color="text.secondary">
//                                 Average per Week
//                             </Typography>
//                             <Typography variant="h6" fontWeight={600} color={maroonColor}>
//                                 ${avgWeeklySpending.toFixed(2)}
//                             </Typography>
//                         </Box>
//                         <Box sx={{ textAlign: 'right' }}>
//                             <Typography variant="caption" color="text.secondary">
//                                 Budget per Week
//                             </Typography>
//                             <Typography variant="body2" fontWeight={500}>
//                                 ${weeklyBudget.toFixed(2)}
//                             </Typography>
//                         </Box>
//                     </Box>
//
//                     <Box sx={{
//                         display: 'flex',
//                         gap: 2
//                     }}>
//                         <Box sx={{
//                             flex: 1,
//                             p: 2,
//                             backgroundColor: alpha('#059669', 0.05),
//                             borderRadius: 2,
//                             border: `1px solid ${alpha('#059669', 0.2)}`
//                         }}>
//                             <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
//                                 Lowest Week
//                             </Typography>
//                             <Typography variant="h6" fontWeight={600} color="#059669">
//                                 ${minWeekSpending.toFixed(2)}
//                             </Typography>
//                         </Box>
//                         <Box sx={{
//                             flex: 1,
//                             p: 2,
//                             backgroundColor: alpha('#dc2626', 0.05),
//                             borderRadius: 2,
//                             border: `1px solid ${alpha('#dc2626', 0.2)}`
//                         }}>
//                             <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
//                                 Highest Week
//                             </Typography>
//                             <Typography variant="h6" fontWeight={600} color="#dc2626">
//                                 ${maxWeekSpending.toFixed(2)}
//                             </Typography>
//                         </Box>
//                     </Box>
//                 </Stack>
//
//                 {/* Spending Trend */}
//                 <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                     Spending Trend
//                 </Typography>
//
//                 <Card sx={{
//                     p: 2.5,
//                     mb: 3,
//                     background: trendDirection === 'up'
//                         ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, rgba(220, 38, 38, 0.02) 100%)'
//                         : 'linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)',
//                     border: `1px solid ${alpha(trendDirection === 'up' ? '#dc2626' : '#059669', 0.2)}`
//                 }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
//                         {trendDirection === 'up' ? (
//                             <TrendingUpIcon sx={{ color: '#dc2626' }} />
//                         ) : (
//                             <TrendingDownIcon sx={{ color: '#059669' }} />
//                         )}
//                         <Typography variant="body1" fontWeight={600}>
//                             {trendDirection === 'up' ? 'Increasing' : 'Decreasing'} Trend
//                         </Typography>
//                     </Box>
//                     <Typography variant="body2" color="text.secondary">
//                         Spending is {trendDirection === 'up' ? 'up' : 'down'} by{' '}
//                         <Typography component="span" fontWeight={600} color={trendDirection === 'up' ? '#dc2626' : '#059669'}>
//                             {trendPercent.toFixed(1)}%
//                         </Typography>
//                         {' '}in recent weeks compared to earlier weeks
//                     </Typography>
//                 </Card>
//
//                 {/* Week Performance */}
//                 <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                     Week Performance
//                 </Typography>
//
//                 <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
//                     <Chip
//                         icon={<TrendingDownIcon />}
//                         label={`${weeksUnderBudget} Under Budget`}
//                         sx={{
//                             backgroundColor: alpha('#059669', 0.1),
//                             color: '#059669',
//                             fontWeight: 600,
//                             border: `1px solid ${alpha('#059669', 0.3)}`
//                         }}
//                     />
//                     <Chip
//                         icon={<TrendingUpIcon />}
//                         label={`${weeksOverBudget} Over Budget`}
//                         sx={{
//                             backgroundColor: alpha('#dc2626', 0.1),
//                             color: '#dc2626',
//                             fontWeight: 600,
//                             border: `1px solid ${alpha('#dc2626', 0.3)}`
//                         }}
//                     />
//                 </Stack>
//
//                 <Divider sx={{ my: 3 }} />
//
//                 {/* Insights */}
//                 <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                     Key Insights
//                 </Typography>
//
//                 <Stack spacing={1.5}>
//                     {onTrack && (
//                         <Box sx={{
//                             p: 2,
//                             backgroundColor: alpha('#059669', 0.05),
//                             borderRadius: 2,
//                             borderLeft: `4px solid #059669`
//                         }}>
//                             <Typography variant="body2" fontWeight={500} color="#059669">
//                                 ✓ On track to meet savings goal
//                             </Typography>
//                             <Typography variant="caption" color="text.secondary">
//                                 ${Math.abs(remaining).toFixed(2)} remaining should cover your ${budget.savingsGoal.toFixed(2)} savings target
//                             </Typography>
//                         </Box>
//                     )}
//
//                     {!onTrack && (
//                         <Box sx={{
//                             p: 2,
//                             backgroundColor: alpha('#f59e0b', 0.05),
//                             borderRadius: 2,
//                             borderLeft: `4px solid #f59e0b`
//                         }}>
//                             <Typography variant="body2" fontWeight={500} color="#f59e0b">
//                                 ⚠ May not meet savings goal
//                             </Typography>
//                             <Typography variant="caption" color="text.secondary">
//                                 Need ${(budget.savingsGoal - remaining).toFixed(2)} more to reach your ${budget.savingsGoal.toFixed(2)} savings target
//                             </Typography>
//                         </Box>
//                     )}
//
//                     {avgWeeklySpending > weeklyBudget && (
//                         <Box sx={{
//                             p: 2,
//                             backgroundColor: alpha('#dc2626', 0.05),
//                             borderRadius: 2,
//                             borderLeft: `4px solid #dc2626`
//                         }}>
//                             <Typography variant="body2" fontWeight={500} color="#dc2626">
//                                 Average exceeds weekly budget
//                             </Typography>
//                             <Typography variant="caption" color="text.secondary">
//                                 Averaging ${(avgWeeklySpending - weeklyBudget).toFixed(2)} over budget per week
//                             </Typography>
//                         </Box>
//                     )}
//
//                     {avgWeeklySpending <= weeklyBudget && (
//                         <Box sx={{
//                             p: 2,
//                             backgroundColor: alpha('#059669', 0.05),
//                             borderRadius: 2,
//                             borderLeft: `4px solid #059669`
//                         }}>
//                             <Typography variant="body2" fontWeight={500} color="#059669">
//                                 Staying within weekly budget
//                             </Typography>
//                             <Typography variant="caption" color="text.secondary">
//                                 Averaging ${(weeklyBudget - avgWeeklySpending).toFixed(2)} under budget per week
//                             </Typography>
//                         </Box>
//                     )}
//
//                     {trendDirection === 'up' && trendPercent > 10 && (
//                         <Box sx={{
//                             p: 2,
//                             backgroundColor: alpha('#f59e0b', 0.05),
//                             borderRadius: 2,
//                             borderLeft: `4px solid #f59e0b`
//                         }}>
//                             <Typography variant="body2" fontWeight={500} color="#f59e0b">
//                                 Spending increasing significantly
//                             </Typography>
//                             <Typography variant="caption" color="text.secondary">
//                                 Consider reviewing recent purchases to identify areas to cut back
//                             </Typography>
//                         </Box>
//                     )}
//                 </Stack>
//             </Box>
//         </Paper>
//     );
// };
//
// export default GroceryBudgetStatsPanel;