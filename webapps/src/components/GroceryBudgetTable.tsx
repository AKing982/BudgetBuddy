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
    Divider,
    Skeleton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StoreIcon from '@mui/icons-material/Store';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SavingsIcon from '@mui/icons-material/Savings';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import { startOfWeek, endOfWeek, format, parseISO, isWithinInterval, addWeeks, differenceInWeeks } from 'date-fns';
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import {
    PieChart,
    TrendingUp,
    TrendingDown,
    Minus,
    PiggyBank,
    Calendar,
    Receipt,
    ShoppingCart,
    Store,
    ChevronDown,
    ChevronUp,
    Lightbulb,
    CheckSquare,
} from 'lucide-react';
import {GroceryBudgetWithTotals, GroceryItem} from "../config/Types";
import {ViewMode} from "./GroceryTracker";

// ── Design tokens — matching BudgetPage exactly ────────────────────────────────
const MAROON      = '#6b1a1a';
const MAROON_DARK = '#4a1010';
const TEAL        = '#0d9488';
const GREEN       = '#059669';
const SLATE       = '#64748b';
const NAVY        = '#1e293b';

// Card themes from BudgetPage
const CARD_THEMES = {
    budget: {
        base: '#f0f4ff', border: '#6b1a1a', valueColor: '#1e1e2e',
        barColor: '#6b1a1a', chipBg: 'rgba(107,26,26,0.10)', chipColor: '#6b1a1a', labelColor: '#5a5a7a',
    },
    spent_ok: {
        base: '#f0fdf4', border: '#16a34a', valueColor: '#14532d',
        barColor: '#16a34a', chipBg: 'rgba(22,163,74,0.12)', chipColor: '#15803d', labelColor: '#4a7060',
    },
    spent_warn: {
        base: '#fffbeb', border: '#d97706', valueColor: '#78350f',
        barColor: '#d97706', chipBg: 'rgba(217,119,6,0.12)', chipColor: '#92400e', labelColor: '#7a6030',
    },
    spent_over: {
        base: '#fff1f2', border: '#dc2626', valueColor: '#7f1d1d',
        barColor: '#dc2626', chipBg: 'rgba(220,38,38,0.12)', chipColor: '#991b1b', labelColor: '#7a3030',
    },
    remaining_good: {
        base: '#f0fdf4', border: '#16a34a', valueColor: '#14532d',
        barColor: '#16a34a', chipBg: 'rgba(22,163,74,0.12)', chipColor: '#15803d', labelColor: '#4a7060',
    },
    remaining_bad: {
        base: '#fff1f2', border: '#dc2626', valueColor: '#7f1d1d',
        barColor: '#dc2626', chipBg: 'rgba(220,38,38,0.12)', chipColor: '#991b1b', labelColor: '#7a3030',
    },
    saved_good: {
        base: '#f0f9ff', border: '#0284c7', valueColor: '#0c4a6e',
        barColor: '#0284c7', chipBg: 'rgba(2,132,199,0.12)', chipColor: '#075985', labelColor: '#3a6070',
    },
    teal: {
        base: '#f0fdfa', border: TEAL, valueColor: '#134e4a',
        barColor: TEAL, chipBg: 'rgba(13,148,136,0.12)', chipColor: '#0f766e', labelColor: '#3a6060',
    },
    purple: {
        base: '#faf5ff', border: '#7c3aed', valueColor: '#4c1d95',
        barColor: '#7c3aed', chipBg: 'rgba(124,58,237,0.12)', chipColor: '#6d28d9', labelColor: '#5a4070',
    },
    amber: {
        base: '#fffbeb', border: '#d97706', valueColor: '#78350f',
        barColor: '#d97706', chipBg: 'rgba(217,119,6,0.12)', chipColor: '#92400e', labelColor: '#7a6030',
    },
};

// ── Summary card component (matches BudgetPage card style) ─────────────────────
const SummaryCard: React.FC<{
    label: string;
    value: string;
    subLabel: string;
    chipLabel: string;
    chipIcon: React.ReactNode;
    theme: keyof typeof CARD_THEMES;
    barValue: number;
}> = ({ label, value, subLabel, chipLabel: chipLbl, chipIcon, theme: themeKey, barValue }) => {
    const t = CARD_THEMES[themeKey];
    return (
        <Box sx={{
            background: t.base, borderRadius: '10px',
            borderTop: `3px solid ${t.border}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
            p: 2.5, height: '100%',
            transition: 'box-shadow 0.2s',
            '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' },
        }}>
            <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.labelColor, fontWeight: 700, mb: 1 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: t.valueColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1, mb: 0.5 }}>
                {value}
            </Typography>
            <LinearProgress
                variant="determinate"
                value={Math.min(barValue, 100)}
                sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(t.barColor, 0.15), '& .MuiLinearProgress-bar': { bgcolor: t.barColor, borderRadius: 2 } }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography sx={{ fontSize: '0.72rem', color: t.labelColor }}>{subLabel}</Typography>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: t.chipBg, color: t.chipColor, fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {chipIcon}
                    {chipLbl}
                </Box>
            </Box>
        </Box>
    );
};

// ── Mini stat tile used inside week cards ──────────────────────────────────────
const StatTile: React.FC<{
    label: string;
    value: string;
    sub?: string;
    themeKey: keyof typeof CARD_THEMES;
}> = ({ label, value, sub, themeKey }) => {
    const t = CARD_THEMES[themeKey];
    return (
        <Box sx={{
            p: 1.75, textAlign: 'center', borderRadius: '8px',
            background: t.base,
            border: `1px solid ${alpha(t.border, 0.2)}`,
        }}>
            <Typography sx={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: t.labelColor, fontWeight: 700, mb: 0.5 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: t.valueColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {value}
            </Typography>
            {sub && (
                <Typography sx={{ fontSize: '0.6rem', color: t.labelColor, mt: 0.25 }}>{sub}</Typography>
            )}
        </Box>
    );
};

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
                if (!receiptMap.has(receiptKey)) receiptMap.set(receiptKey, []);
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

    const weeklyGroceryListAnalytics = useMemo((): Map<number, GroceryListAnalytics> => {
        const analyticsMap = new Map<number, GroceryListAnalytics>();
        if (!budget || !budget.plannedItems) return analyticsMap;

        weeklyData.forEach(week => {
            const weekItems = week.receipts.flatMap(r => r.items);
            const plannedItemNames = new Set(budget.plannedItems.map(pi => pi.itemName.toLowerCase()));
            const purchasedFromList = weekItems.filter(item => plannedItemNames.has(item.itemName.toLowerCase()));
            const unplannedPurchases = weekItems.filter(item => !plannedItemNames.has(item.itemName.toLowerCase()));
            const plannedTotal = budget.plannedItems.reduce((sum, item) => sum + item.estimatedCost, 0);
            const purchasedFromListTotal = purchasedFromList.reduce((sum, item) => sum + item.itemCost, 0);
            const unplannedTotal = unplannedPurchases.reduce((sum, item) => sum + item.itemCost, 0);
            const adherenceRate = weekItems.length > 0 ? (purchasedFromList.length / weekItems.length) * 100 : 0;

            let savingsFromList = 0;
            purchasedFromList.forEach(purchased => {
                const planned = budget.plannedItems.find(pi => pi.itemName.toLowerCase() === purchased.itemName.toLowerCase());
                if (planned) savingsFromList += (planned.estimatedCost - purchased.itemCost);
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

    const totalWeeklySavings = useMemo(() => weeklyData.reduce((total, week) => total + (week.remaining > 0 ? week.remaining : 0), 0), [weeklyData]);
    const totalWeeksOver = useMemo(() => weeklyData.filter(week => week.remaining < 0).length, [weeklyData]);
    const totalWeeksUnder = useMemo(() => weeklyData.filter(week => week.remaining > 0).length, [weeklyData]);

    const remaining = budget ? budget.budgetAmount - budget.totalSpent : 0;
    const percentSpent = budget ? (budget.totalSpent / budget.budgetAmount) * 100 : 0;
    const onTrackForSavings = budget ? remaining >= budget.savingsGoal : false;

    if (!budget) return null;

    const fmt = (n: number) => `$${Math.abs(n).toFixed(2)}`;

    const toggleWeek = (weekNumber: number) => {
        setExpandedWeeks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(weekNumber)) newSet.delete(weekNumber);
            else newSet.add(weekNumber);
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

    const getProgressColor = (percent: number) => {
        if (percent < 70) return GREEN;
        if (percent < 90) return '#d97706';
        return '#dc2626';
    };

    const spentThemeKey = (): keyof typeof CARD_THEMES => {
        if (percentSpent > 100) return 'spent_over';
        if (percentSpent > 80) return 'spent_warn';
        return 'spent_ok';
    };

    // ── Section header (maroon gradient — matches BudgetPage section headers) ──
    const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
        <Box sx={{
            background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 50%, #5a1515 100%)`,
            px: 3, py: 2, position: 'relative', overflow: 'hidden',
        }}>
            <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
            <Box sx={{ position: 'absolute', bottom: -20, right: 50, width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative' }}>
                <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {icon}
                </Box>
                <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>{title}</Typography>
                    <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>{subtitle}</Typography>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>

            {/* ── Savings Overview Section ───────────────────────────────────── */}
            <Box sx={{
                borderRadius: '16px', overflow: 'hidden', mb: 3,
                border: `1px solid ${alpha(MAROON, 0.15)}`,
                boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}`,
            }}>
                <SectionHeader
                    icon={<PiggyBank size={15} color="white" />}
                    title="Savings Overview"
                    subtitle="Weekly savings performance breakdown"
                />
                <Box sx={{ bgcolor: '#fff', p: 3 }}>
                    <Grid container spacing={2.5} alignItems="center">
                        {/* Total weekly savings banner */}
                        <Grid item xs={12} md={7}>
                            <Box sx={{
                                p: 2.5, borderRadius: '10px',
                                background: totalWeeklySavings > 0
                                    ? `linear-gradient(135deg, ${GREEN} 0%, #10b981 100%)`
                                    : `linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)`,
                                color: '#fff', position: 'relative', overflow: 'hidden',
                            }}>
                                <Box sx={{ position: 'absolute', top: -24, right: -24, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
                                    <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <PiggyBank size={28} />
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.85, fontWeight: 700 }}>
                                            Total Weekly Savings
                                        </Typography>
                                        <Typography sx={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                                            {fmt(totalWeeklySavings)}
                                        </Typography>
                                        {totalWeeklySavings > 0 && (
                                            <Typography sx={{ fontSize: '0.75rem', opacity: 0.85, mt: 0.3 }}>
                                                Great job staying under budget! 🎉
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>

                        {/* Weeks under / over */}
                        <Grid item xs={6} md={2.5}>
                            <Box sx={{
                                p: 2, textAlign: 'center', borderRadius: '10px',
                                background: CARD_THEMES.remaining_good.base,
                                border: `1px solid ${alpha(CARD_THEMES.remaining_good.border, 0.25)}`,
                            }}>
                                <Typography sx={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: CARD_THEMES.remaining_good.labelColor, fontWeight: 700, mb: 0.5 }}>
                                    Weeks Under
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                    <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: CARD_THEMES.remaining_good.valueColor, lineHeight: 1 }}>
                                        {totalWeeksUnder}
                                    </Typography>
                                    <TrendingDown size={20} color={CARD_THEMES.remaining_good.valueColor} />
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={6} md={2.5}>
                            <Box sx={{
                                p: 2, textAlign: 'center', borderRadius: '10px',
                                background: CARD_THEMES.remaining_bad.base,
                                border: `1px solid ${alpha(CARD_THEMES.remaining_bad.border, 0.25)}`,
                            }}>
                                <Typography sx={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: CARD_THEMES.remaining_bad.labelColor, fontWeight: 700, mb: 0.5 }}>
                                    Weeks Over
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                    <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: CARD_THEMES.remaining_bad.valueColor, lineHeight: 1 }}>
                                        {totalWeeksOver}
                                    </Typography>
                                    <TrendingUp size={20} color={CARD_THEMES.remaining_bad.valueColor} />
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            {/* ── View Mode Toggle ────────────────────────────────────────────── */}
            <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {([
                    { mode: 'week' as ViewMode,          label: 'By Week',          icon: <Calendar size={13} /> },
                    { mode: 'receiptDetail' as ViewMode, label: 'By Receipt',        icon: <Receipt size={13} /> },
                    { mode: 'groceryList' as ViewMode,   label: 'Grocery List',      icon: <CheckSquare size={13} /> },
                    { mode: 'analytics' as ViewMode,     label: 'Analytics',         icon: <PieChart size={13} /> },
                ] as Array<{ mode: ViewMode; label: string; icon: React.ReactNode }>).map(({ mode, label, icon }) => {
                    const isActive = viewMode === mode;
                    return (
                        <Box
                            key={mode}
                            onClick={() => onViewModeChange(mode)}
                            sx={{
                                display: 'inline-flex', alignItems: 'center', gap: 0.75,
                                px: 1.75, py: 0.7, borderRadius: '8px', cursor: 'pointer',
                                fontWeight: 600, fontSize: '0.8rem',
                                border: `1px solid ${isActive ? alpha(MAROON, 0.6) : alpha('#000', 0.1)}`,
                                background: isActive
                                    ? `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 100%)`
                                    : '#fff',
                                color: isActive ? '#fff' : SLATE,
                                transition: 'all 0.18s ease',
                                boxShadow: isActive ? `0 2px 8px ${alpha(MAROON, 0.25)}` : '0 1px 3px rgba(0,0,0,0.06)',
                                '&:hover': {
                                    background: isActive
                                        ? `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 100%)`
                                        : alpha(MAROON, 0.06),
                                    borderColor: alpha(MAROON, 0.35),
                                    color: isActive ? '#fff' : MAROON,
                                },
                            }}
                        >
                            {icon}
                            <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.01em', lineHeight: 1 }}>
                                {label}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>

            {/* ── Weekly Cards Section ────────────────────────────────────────── */}
            <Box sx={{
                borderRadius: '16px', overflow: 'hidden',
                border: `1px solid ${alpha(MAROON, 0.15)}`,
                boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}`,
            }}>
                <SectionHeader
                    icon={
                        viewMode === 'week'          ? <Calendar size={15} color="white" /> :
                            viewMode === 'receiptDetail' ? <Receipt size={15} color="white" /> :
                                viewMode === 'groceryList'   ? <CheckSquare size={15} color="white" /> :
                                    <PieChart size={15} color="white" />
                    }
                    title={
                        viewMode === 'week'          ? 'Weekly Budget Breakdown' :
                            viewMode === 'receiptDetail' ? 'Receipt Detail View' :
                                viewMode === 'groceryList'   ? 'Grocery List Adherence' :
                                    'Spending Analytics'
                    }
                    subtitle="Click a week to expand receipts in receipt detail mode"
                />
                <Box sx={{ bgcolor: '#f0f2f5', p: 2.5 }}>
                    <Stack spacing={2}>
                        {weeklyData.map((week) => {
                            const isExpanded = expandedWeeks.has(week.weekNumber);
                            const progressColor = getProgressColor(week.percentUsed);
                            const isWeekSelected = selectedWeekNumber === week.weekNumber;
                            const weekAnalytics = weeklyGroceryListAnalytics.get(week.weekNumber);
                            const isClickable = viewMode === 'receiptDetail';

                            return (
                                <Box
                                    key={week.weekNumber}
                                    sx={{
                                        borderRadius: '12px', overflow: 'hidden',
                                        border: `1px solid ${isWeekSelected ? alpha(MAROON, 0.5) : alpha('#000', 0.08)}`,
                                        boxShadow: isWeekSelected
                                            ? `0 4px 16px ${alpha(MAROON, 0.2)}`
                                            : '0 2px 8px rgba(0,0,0,0.07)',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                            transform: 'translateY(-1px)',
                                        },
                                    }}
                                >
                                    {/* ── Week card header ── */}
                                    <Box
                                        onClick={() => isClickable && toggleWeek(week.weekNumber)}
                                        sx={{
                                            cursor: isClickable ? 'pointer' : 'default',
                                            bgcolor: '#fff',
                                            borderBottom: `2px solid ${alpha(progressColor, 0.3)}`,
                                            p: 2.5,
                                            position: 'relative',
                                        }}
                                    >
                                        {/* Savings / over badge */}
                                        {week.remaining !== 0 && (
                                            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                                                <Box sx={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                                    px: 1.25, py: 0.6, borderRadius: '20px',
                                                    background: week.remaining >= 0
                                                        ? `linear-gradient(135deg, ${GREEN} 0%, #10b981 100%)`
                                                        : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                                                    color: '#fff',
                                                    boxShadow: week.remaining >= 0
                                                        ? `0 3px 10px ${alpha(GREEN, 0.35)}`
                                                        : '0 3px 10px rgba(220,38,38,0.35)',
                                                }}>
                                                    {week.remaining >= 0
                                                        ? <PiggyBank size={13} />
                                                        : <TrendingUp size={13} />
                                                    }
                                                    <Box>
                                                        <Typography sx={{ fontSize: '0.55rem', opacity: 0.85, display: 'block', lineHeight: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            {week.remaining >= 0 ? 'SAVED' : 'OVER'}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                                                            {fmt(week.remaining)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        )}

                                        <Grid container spacing={2} alignItems="center">
                                            {/* Week title */}
                                            <Grid item xs={12} md={3.5}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    {viewMode === 'receiptDetail' && (
                                                        <Box
                                                            onClick={(e) => { e.stopPropagation(); toggleWeek(week.weekNumber); }}
                                                            sx={{
                                                                width: 28, height: 28, borderRadius: '6px', flexShrink: 0,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                cursor: 'pointer',
                                                                bgcolor: alpha(progressColor, 0.12),
                                                                color: progressColor,
                                                                border: `1px solid ${alpha(progressColor, 0.25)}`,
                                                                transition: 'all 0.15s',
                                                                '&:hover': { bgcolor: alpha(progressColor, 0.2) },
                                                            }}
                                                        >
                                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                        </Box>
                                                    )}
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: NAVY, letterSpacing: '-0.01em' }}>
                                                            {week.weekLabel}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.7rem', color: SLATE, mt: 0.15 }}>
                                                            {format(week.startDate, 'MMM d')} – {format(week.endDate, 'MMM d, yyyy')}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
                                                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.75, py: 0.25, borderRadius: '6px', bgcolor: alpha(TEAL, 0.1), color: TEAL }}>
                                                                <Receipt size={10} />
                                                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>
                                                                    {week.receipts.length} receipt{week.receipts.length !== 1 ? 's' : ''}
                                                                </Typography>
                                                            </Box>
                                                            {budget.plannedItems && budget.plannedItems.length > 0 && (
                                                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.75, py: 0.25, borderRadius: '6px', bgcolor: alpha('#7c3aed', 0.1), color: '#7c3aed' }}>
                                                                    <CheckSquare size={10} />
                                                                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>Has List</Typography>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Grid>

                                            {/* Stats tiles */}
                                            <Grid item xs={12} md={8.5}>
                                                <Grid container spacing={1.5} sx={{ pr: week.remaining !== 0 ? 12 : 0 }}>
                                                    {viewMode === 'week' && (
                                                        <>
                                                            <Grid item xs={3}>
                                                                <StatTile label="Budgeted" value={`$${week.budgetAmount.toFixed(2)}`} themeKey="teal" />
                                                            </Grid>
                                                            <Grid item xs={3}>
                                                                <StatTile label="Spent" value={`$${week.actualSpent.toFixed(2)}`} themeKey={week.percentUsed > 100 ? 'spent_over' : week.percentUsed > 80 ? 'spent_warn' : 'budget'} />
                                                            </Grid>
                                                            <Grid item xs={3}>
                                                                <StatTile label="Remaining" value={`$${Math.abs(week.remaining).toFixed(2)}`} sub={week.remaining >= 0 ? 'under' : 'over'} themeKey={week.remaining >= 0 ? 'remaining_good' : 'remaining_bad'} />
                                                            </Grid>
                                                            <Grid item xs={3}>
                                                                <StatTile label={week.remaining >= 0 ? '✓ SAVED' : '✗ OVER'} value={`$${Math.abs(week.remaining).toFixed(2)}`} themeKey={week.remaining >= 0 ? 'saved_good' : 'spent_over'} />
                                                            </Grid>
                                                        </>
                                                    )}

                                                    {viewMode === 'receiptDetail' && (
                                                        <>
                                                            <Grid item xs={4}>
                                                                <StatTile label="Receipts" value={String(week.receipts.length)} sub="trips" themeKey="teal" />
                                                            </Grid>
                                                            <Grid item xs={4}>
                                                                <StatTile
                                                                    label="Avg / Trip"
                                                                    value={`$${week.receipts.length > 0 ? (week.actualSpent / week.receipts.length).toFixed(2) : '0.00'}`}
                                                                    sub="per receipt"
                                                                    themeKey="budget"
                                                                />
                                                            </Grid>
                                                            <Grid item xs={4}>
                                                                <StatTile
                                                                    label={week.remaining >= 0 ? 'Saved' : 'Over'}
                                                                    value={`$${Math.abs(week.remaining).toFixed(2)}`}
                                                                    sub="this week"
                                                                    themeKey={week.remaining >= 0 ? 'remaining_good' : 'remaining_bad'}
                                                                />
                                                            </Grid>
                                                        </>
                                                    )}

                                                    {viewMode === 'groceryList' && weekAnalytics && (
                                                        <>
                                                            <Grid item xs={3}>
                                                                <StatTile label="List Budget" value={`$${weekAnalytics.plannedTotal.toFixed(2)}`} sub="planned" themeKey="purple" />
                                                            </Grid>
                                                            <Grid item xs={3}>
                                                                <StatTile label="From List" value={`$${weekAnalytics.purchasedFromList.toFixed(2)}`} sub="spent" themeKey="budget" />
                                                            </Grid>
                                                            <Grid item xs={3}>
                                                                <StatTile label="Unplanned" value={`$${weekAnalytics.unplannedPurchases.toFixed(2)}`} sub="impulse" themeKey="amber" />
                                                            </Grid>
                                                            <Grid item xs={3}>
                                                                <StatTile label="Adherence" value={`${weekAnalytics.adherenceRate.toFixed(0)}%`} sub="on list" themeKey="teal" />
                                                            </Grid>
                                                        </>
                                                    )}

                                                    {viewMode === 'analytics' && weekAnalytics && (
                                                        <>
                                                            <Grid item xs={3}>
                                                                <StatTile label="Items" value={String(week.receipts.reduce((s, r) => s + r.itemCount, 0))} sub="purchased" themeKey="teal" />
                                                            </Grid>
                                                            <Grid item xs={3}>
                                                                <StatTile
                                                                    label="Avg / Item"
                                                                    value={`$${week.receipts.reduce((s, r) => s + r.itemCount, 0) > 0 ? (week.actualSpent / week.receipts.reduce((s, r) => s + r.itemCount, 0)).toFixed(2) : '0.00'}`}
                                                                    sub="per item"
                                                                    themeKey="purple"
                                                                />
                                                            </Grid>
                                                            <Grid item xs={3}>
                                                                <StatTile label="Stores" value={String(new Set(week.receipts.map(r => r.storeName)).size)} sub="visited" themeKey="amber" />
                                                            </Grid>
                                                            <Grid item xs={3}>
                                                                <StatTile label="Usage" value={`${week.percentUsed.toFixed(0)}%`} sub="of budget" themeKey={week.percentUsed > 100 ? 'spent_over' : week.percentUsed > 80 ? 'spent_warn' : 'remaining_good'} />
                                                            </Grid>
                                                        </>
                                                    )}
                                                </Grid>

                                                {/* Analytics alert */}
                                                {viewMode === 'analytics' && (() => {
                                                    const avgWeeklySpend = weeklyData.reduce((s, w) => s + w.actualSpent, 0) / weeklyData.length;
                                                    const isOver = week.remaining < 0;
                                                    const isHigh = week.percentUsed > 90;
                                                    const isIrregular = Math.abs(week.actualSpent - avgWeeklySpend) > avgWeeklySpend * 0.4;
                                                    const manyTrips = week.receipts.length > 4;
                                                    if (!isOver && !isHigh && !isIrregular && !manyTrips) return null;
                                                    const alertColor = '#d97706';
                                                    return (
                                                        <Box sx={{
                                                            mt: 1.5, p: 1.5, borderRadius: '8px',
                                                            bgcolor: alpha(alertColor, 0.06),
                                                            border: `1px solid ${alpha(alertColor, 0.25)}`,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5,
                                                        }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Box sx={{ p: 0.75, borderRadius: '6px', bgcolor: alpha(alertColor, 0.12), flexShrink: 0 }}>
                                                                    <Lightbulb size={14} color={alertColor} />
                                                                </Box>
                                                                <Box>
                                                                    <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', color: alertColor }}>
                                                                        {isOver ? 'Over Budget' : isHigh ? 'High Usage' : isIrregular ? 'Irregular Spending' : 'Many Shopping Trips'}
                                                                    </Typography>
                                                                    <Typography sx={{ fontSize: '0.65rem', color: SLATE }}>
                                                                        {isOver ? `$${Math.abs(week.remaining).toFixed(2)} over budget` : isHigh ? `${week.percentUsed.toFixed(0)}% of weekly budget used` : isIrregular ? `${((Math.abs(week.actualSpent - avgWeeklySpend) / avgWeeklySpend) * 100).toFixed(0)}% from average` : `${week.receipts.length} trips — consider consolidating`}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                    );
                                                })()}
                                            </Grid>
                                        </Grid>

                                        {/* Progress bar */}
                                        <Box sx={{ mt: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography sx={{ fontSize: '0.65rem', color: SLATE, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                    Budget Usage
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: progressColor }}>
                                                    {week.percentUsed.toFixed(1)}%
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.min(week.percentUsed, 100)}
                                                sx={{
                                                    height: 5, borderRadius: 3,
                                                    bgcolor: alpha(progressColor, 0.12),
                                                    '& .MuiLinearProgress-bar': { bgcolor: progressColor, borderRadius: 3 },
                                                }}
                                            />
                                        </Box>
                                    </Box>

                                    {/* ── Expanded receipts (receipt detail mode) ── */}
                                    {viewMode === 'receiptDetail' && (
                                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: `1px solid ${alpha('#000', 0.06)}` }}>
                                                {week.receipts.length > 0 ? (
                                                    <Grid container spacing={1.5}>
                                                        {week.receipts.map((receipt) => (
                                                            <Grid item xs={12} sm={6} md={4} key={receipt.id}>
                                                                <Box
                                                                    onClick={() => handleReceiptClick(receipt)}
                                                                    sx={{
                                                                        p: 2, borderRadius: '10px', cursor: 'pointer',
                                                                        bgcolor: '#fff',
                                                                        border: `1px solid ${selectedReceiptId === receipt.id ? TEAL : alpha('#000', 0.08)}`,
                                                                        boxShadow: selectedReceiptId === receipt.id ? `0 0 0 2px ${alpha(TEAL, 0.2)}` : 'none',
                                                                        transition: 'all 0.18s ease',
                                                                        '&:hover': {
                                                                            borderColor: TEAL,
                                                                            boxShadow: `0 4px 12px ${alpha(TEAL, 0.15)}`,
                                                                            transform: 'translateY(-1px)',
                                                                        },
                                                                    }}
                                                                >
                                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                                                                        <Box sx={{
                                                                            p: 1, borderRadius: '7px', bgcolor: alpha(TEAL, 0.1), flexShrink: 0,
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        }}>
                                                                            <Store size={18} color={TEAL} />
                                                                        </Box>
                                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: NAVY, letterSpacing: '-0.01em' }}>
                                                                                {receipt.storeName}
                                                                            </Typography>
                                                                            <Typography sx={{ fontSize: '0.65rem', color: SLATE, display: 'block', mt: 0.15 }}>
                                                                                {format(parseISO(receipt.purchaseDate), 'MMM d, yyyy')}
                                                                            </Typography>
                                                                            <Typography sx={{ fontSize: '0.65rem', color: SLATE, display: 'block' }}>
                                                                                {receipt.itemCount} item{receipt.itemCount !== 1 ? 's' : ''}
                                                                            </Typography>
                                                                            <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: TEAL, mt: 0.75, fontVariantNumeric: 'tabular-nums' }}>
                                                                                ${receipt.totalCost.toFixed(2)}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>
                                                                </Box>
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                ) : (
                                                    <Typography sx={{ textAlign: 'center', color: SLATE, fontStyle: 'italic', fontSize: '0.85rem', py: 3 }}>
                                                        No receipts for this week
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Collapse>
                                    )}
                                </Box>
                            );
                        })}
                    </Stack>
                </Box>
            </Box>
        </Box>
    );
};

export default GroceryBudgetTable;

// import React, { useState, useMemo } from 'react';
// import {
//     Box,
//     Paper,
//     Typography,
//     IconButton,
//     LinearProgress,
//     Chip,
//     Card,
//     CardContent,
//     Grid,
//     Stack,
//     Tooltip,
//     alpha,
//     Collapse,
//     Divider
// } from '@mui/material';
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import ExpandLessIcon from '@mui/icons-material/ExpandLess';
// import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
// import StoreIcon from '@mui/icons-material/Store';
// import TrendingUpIcon from '@mui/icons-material/TrendingUp';
// import TrendingDownIcon from '@mui/icons-material/TrendingDown';
// import SavingsIcon from '@mui/icons-material/Savings';
// import LightbulbIcon from '@mui/icons-material/Lightbulb';
// import CheckCircleIcon from '@mui/icons-material/CheckCircle';
// import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
// import { startOfWeek, endOfWeek, format, parseISO, isWithinInterval, addWeeks, differenceInWeeks } from 'date-fns';
// import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
// import ReceiptIcon from "@mui/icons-material/Receipt";
// import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
// import {GroceryBudgetWithTotals, GroceryItem} from "../config/Types";
// import {ViewMode} from "./GroceryTracker";
//
// const maroonColor = '#800000';
// const tealColor = '#0d9488';
//
// interface GroceryBudgetTableProps {
//     budget?: GroceryBudgetWithTotals;
//     viewMode: ViewMode;
//     onViewModeChange: (mode: ViewMode) => void;
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
// interface GroceryListAnalytics {
//     plannedItemsCount: number;
//     plannedTotal: number;
//     purchasedFromList: number;
//     purchasedFromListCount: number;
//     unplannedPurchases: number;
//     unplannedPurchasesCount: number;
//     adherenceRate: number;
//     savingsFromList: number;
// }
//
// const GroceryBudgetTable: React.FC<GroceryBudgetTableProps> = ({
//                                                                    budget,
//                                                                    viewMode,
//                                                                    onReceiptSelect,
//                                                                    onWeekSelect,
//                                                                    onViewModeChange
//                                                                }) => {
//     const [expandedWeeks, setExpandedWeeks] = useState(new Set([1]));
//     const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
//     const [selectedWeekNumber, setSelectedWeekNumber] = useState<number | null>(null);
//
//     // ALL HOOKS MUST COME BEFORE ANY CONDITIONAL RETURNS
//     const weeklyData = useMemo((): WeekData[] => {
//         if (!budget) return [];
//
//         const startDate = parseISO(budget.startDate);
//         const endDate = parseISO(budget.endDate);
//         const totalWeeks = Math.ceil(differenceInWeeks(endDate, startDate)) + 1;
//         const weeklyBudget = budget.budgetAmount / totalWeeks;
//
//         const allItems: GroceryItem[] = [];
//         budget.stores.forEach(store => {
//             store.items.forEach(item => {
//                 allItems.push({ ...item, storeName: store.storeName });
//             });
//         });
//
//         const weeks: WeekData[] = [];
//         for (let i = 0; i < totalWeeks; i++) {
//             const weekStart = addWeeks(startDate, i);
//             const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
//             const actualWeekEnd = weekEnd > endDate ? endDate : weekEnd;
//
//             const weekItems = allItems.filter(item => {
//                 const itemDate = parseISO(item.datePurchased);
//                 return isWithinInterval(itemDate, { start: weekStart, end: actualWeekEnd });
//             });
//
//             const receiptMap = new Map<string, GroceryItem[]>();
//             weekItems.forEach(item => {
//                 const receiptKey = `${item.storeName}-${item.datePurchased}`;
//                 if (!receiptMap.has(receiptKey)) {
//                     receiptMap.set(receiptKey, []);
//                 }
//                 receiptMap.get(receiptKey)!.push(item);
//             });
//
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
//     // Calculate grocery list analytics for each week
//     const weeklyGroceryListAnalytics = useMemo((): Map<number, GroceryListAnalytics> => {
//         const analyticsMap = new Map<number, GroceryListAnalytics>();
//
//         if (!budget || !budget.plannedItems) return analyticsMap;
//
//         weeklyData.forEach(week => {
//             const weekItems = week.receipts.flatMap(r => r.items);
//
//             // Match purchased items to planned items (case-insensitive)
//             const plannedItemNames = new Set(
//                 budget.plannedItems.map(pi => pi.itemName.toLowerCase())
//             );
//
//             const purchasedFromList = weekItems.filter(item =>
//                 plannedItemNames.has(item.itemName.toLowerCase())
//             );
//
//             const unplannedPurchases = weekItems.filter(item =>
//                 !plannedItemNames.has(item.itemName.toLowerCase())
//             );
//
//             const plannedTotal = budget.plannedItems.reduce(
//                 (sum, item) => sum + item.estimatedCost,
//                 0
//             );
//
//             const purchasedFromListTotal = purchasedFromList.reduce(
//                 (sum, item) => sum + item.itemCost,
//                 0
//             );
//
//             const unplannedTotal = unplannedPurchases.reduce(
//                 (sum, item) => sum + item.itemCost,
//                 0
//             );
//
//             const adherenceRate = weekItems.length > 0
//                 ? (purchasedFromList.length / weekItems.length) * 100
//                 : 0;
//
//             // Calculate savings: difference between planned cost and actual cost for planned items
//             let savingsFromList = 0;
//             purchasedFromList.forEach(purchased => {
//                 const planned = budget.plannedItems.find(
//                     pi => pi.itemName.toLowerCase() === purchased.itemName.toLowerCase()
//                 );
//                 if (planned) {
//                     savingsFromList += (planned.estimatedCost - purchased.itemCost);
//                 }
//             });
//
//             analyticsMap.set(week.weekNumber, {
//                 plannedItemsCount: budget.plannedItems.length,
//                 plannedTotal,
//                 purchasedFromList: purchasedFromListTotal,
//                 purchasedFromListCount: purchasedFromList.length,
//                 unplannedPurchases: unplannedTotal,
//                 unplannedPurchasesCount: unplannedPurchases.length,
//                 adherenceRate,
//                 savingsFromList
//             });
//         });
//
//         return analyticsMap;
//     }, [budget, weeklyData]);
//
//     // Calculate total savings across all weeks
//     const totalWeeklySavings = useMemo(() => {
//         return weeklyData.reduce((total, week) => {
//             return total + (week.remaining > 0 ? week.remaining : 0);
//         }, 0);
//     }, [weeklyData]);
//
//     const totalWeeksOver = useMemo(() => {
//         return weeklyData.filter(week => week.remaining < 0).length;
//     }, [weeklyData]);
//
//     const totalWeeksUnder = useMemo(() => {
//         return weeklyData.filter(week => week.remaining > 0).length;
//     }, [weeklyData]);
//
//     // Derived values that depend on budget
//     const remaining = budget ? budget.budgetAmount - budget.totalSpent : 0;
//     const percentSpent = budget ? (budget.totalSpent / budget.budgetAmount) * 100 : 0;
//     const onTrackForSavings = budget ? remaining >= budget.savingsGoal : false;
//
//     // NOW we can do conditional returns after all hooks are called
//     if (!budget) {
//         return null;
//     }
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
//     const handleWeekClick = (week: WeekData) => {
//         setSelectedWeekNumber(week.weekNumber);
//         setSelectedReceiptId(null);
//         onWeekSelect?.(week);
//     };
//
//     const gradients = {
//         maroon: 'linear-gradient(135deg, #800000 0%, #a00000 100%)'
//     };
//
//     const getProgressColor = (percent: number) => {
//         if (percent < 70) return tealColor;
//         if (percent < 90) return '#f59e0b';
//         return '#dc2626';
//     };
//
//     return (
//         <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
//             {/* Month Overview Section */}
//             <Typography variant="h6" sx={{
//                 mb: 2,
//                 fontWeight: 700,
//                 color: maroonColor,
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: 1
//             }}>
//                 <CalendarTodayIcon sx={{ fontSize: 24 }} />
//                 Month Overview
//             </Typography>
//
//             {/* Month Summary Cards */}
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
//             {/* Savings Overview Section */}
//             <Typography variant="h6" sx={{
//                 mb: 2,
//                 fontWeight: 700,
//                 color: '#059669',
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: 1
//             }}>
//                 <SavingsIcon sx={{ fontSize: 24 }} />
//                 Savings Overview
//             </Typography>
//
//             {/* Weekly Savings Banner */}
//             <Grid container spacing={3} sx={{ mb: 4 }}>
//                 <Grid item xs={12}>
//                     <Card sx={{
//                         background: totalWeeklySavings > 0
//                             ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
//                             : 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
//                         color: 'white',
//                         boxShadow: totalWeeklySavings > 0
//                             ? '0 8px 24px rgba(5, 150, 105, 0.35)'
//                             : '0 4px 12px rgba(107, 114, 128, 0.25)',
//                         position: 'relative',
//                         overflow: 'hidden'
//                     }}>
//                         {/* Decorative Background Pattern */}
//                         <Box sx={{
//                             position: 'absolute',
//                             top: -50,
//                             right: -50,
//                             width: 200,
//                             height: 200,
//                             borderRadius: '50%',
//                             background: 'rgba(255, 255, 255, 0.1)',
//                         }} />
//                         <Box sx={{
//                             position: 'absolute',
//                             bottom: -30,
//                             left: -30,
//                             width: 150,
//                             height: 150,
//                             borderRadius: '50%',
//                             background: 'rgba(255, 255, 255, 0.05)',
//                         }} />
//
//                         <CardContent sx={{ position: 'relative', zIndex: 1 }}>
//                             <Grid container spacing={3} alignItems="center">
//                                 <Grid item xs={12} md={6}>
//                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                                         <Box sx={{
//                                             p: 2,
//                                             borderRadius: 3,
//                                             bgcolor: 'rgba(255, 255, 255, 0.2)',
//                                             display: 'flex',
//                                             alignItems: 'center',
//                                             justifyContent: 'center'
//                                         }}>
//                                             <SavingsIcon sx={{ fontSize: 40 }} />
//                                         </Box>
//                                         <Box>
//                                             <Typography variant="caption" sx={{ opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
//                                                 Total Weekly Savings
//                                             </Typography>
//                                             <Typography variant="h3" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
//                                                 ${totalWeeklySavings.toFixed(2)}
//                                             </Typography>
//                                             {totalWeeklySavings > 0 && (
//                                                 <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
//                                                     Great job staying under budget! 🎉
//                                                 </Typography>
//                                             )}
//                                         </Box>
//                                     </Box>
//                                 </Grid>
//                                 <Grid item xs={12} md={6}>
//                                     <Grid container spacing={2}>
//                                         <Grid item xs={6}>
//                                             <Paper sx={{
//                                                 p: 2,
//                                                 textAlign: 'center',
//                                                 bgcolor: 'rgba(255, 255, 255, 0.95)',
//                                                 borderRadius: 2
//                                             }}>
//                                                 <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.7rem' }}>
//                                                     Weeks Under Budget
//                                                 </Typography>
//                                                 <Typography variant="h4" fontWeight={700} color="#059669" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
//                                                     {totalWeeksUnder}
//                                                     <TrendingDownIcon sx={{ fontSize: 28, color: '#059669' }} />
//                                                 </Typography>
//                                             </Paper>
//                                         </Grid>
//                                         <Grid item xs={6}>
//                                             <Paper sx={{
//                                                 p: 2,
//                                                 textAlign: 'center',
//                                                 bgcolor: 'rgba(255, 255, 255, 0.95)',
//                                                 borderRadius: 2
//                                             }}>
//                                                 <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.7rem' }}>
//                                                     Weeks Over Budget
//                                                 </Typography>
//                                                 <Typography variant="h4" fontWeight={700} color="#dc2626" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
//                                                     {totalWeeksOver}
//                                                     <TrendingUpIcon sx={{ fontSize: 28, color: '#dc2626' }} />
//                                                 </Typography>
//                                             </Paper>
//                                         </Grid>
//                                     </Grid>
//                                 </Grid>
//                             </Grid>
//                         </CardContent>
//                     </Card>
//                 </Grid>
//             </Grid>
//
//             {/* View Mode Toggle */}
//             <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
//                 <Chip
//                     icon={<PlaylistAddCheckIcon />}
//                     label="By Grocery List"
//                     onClick={() => onViewModeChange('groceryList')}
//                     color={viewMode === 'groceryList' ? 'primary' : 'default'}
//                     sx={{
//                         fontWeight: 600,
//                         cursor: 'pointer',
//                         ...(viewMode === 'groceryList' && {
//                             background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
//                             color: 'white',
//                             '&:hover': {
//                                 background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
//                             }
//                         })
//                     }}
//                 />
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
//             {/* Main Content - VISUAL CARD LAYOUT */}
//             <Stack spacing={3}>
//                 {weeklyData.map((week, index) => {
//                     const isExpanded = expandedWeeks.has(week.weekNumber);
//                     const progressColor = getProgressColor(week.percentUsed);
//                     const isWeekSelected = selectedWeekNumber === week.weekNumber;
//                     const weekAnalytics = weeklyGroceryListAnalytics.get(week.weekNumber);
//
//                     const handleRowClick = () => {
//                         if (viewMode === 'receiptDetail') {
//                             toggleWeek(week.weekNumber);
//                         }
//                     };
//
//                     const isClickable = viewMode === 'receiptDetail';
//
//                     return (
//                         <Card
//                             key={week.weekNumber}
//                             sx={{
//                                 borderRadius: 4,
//                                 boxShadow: isWeekSelected ? 4 : 2,
//                                 border: `2px solid ${isWeekSelected ? maroonColor : 'transparent'}`,
//                                 overflow: 'visible',
//                                 transition: 'all 0.3s ease',
//                                 '&:hover': {
//                                     boxShadow: 6,
//                                     transform: 'translateY(-2px)'
//                                 }
//                             }}
//                         >
//                             {/* Week Card Header */}
//                             <Box
//                                 onClick={handleRowClick}
//                                 sx={{
//                                     cursor: isClickable ? 'pointer' : 'default',
//                                     background: `linear-gradient(135deg, ${alpha(progressColor, 0.1)} 0%, ${alpha(progressColor, 0.05)} 100%)`,
//                                     borderBottom: `3px solid ${progressColor}`,
//                                     p: 3,
//                                     position: 'relative'
//                                 }}
//                             >
//                                 {/* Savings Badge - Prominent Corner Display */}
//                                 {week.remaining !== 0 && (
//                                     <Box
//                                         sx={{
//                                             position: 'absolute',
//                                             top: 16,
//                                             right: 16,
//                                             zIndex: 1
//                                         }}
//                                     >
//                                         <Tooltip title={week.remaining >= 0 ? 'Amount saved this week' : 'Amount over budget this week'}>
//                                             <Paper
//                                                 elevation={4}
//                                                 sx={{
//                                                     px: 2,
//                                                     py: 1,
//                                                     background: week.remaining >= 0
//                                                         ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
//                                                         : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
//                                                     color: 'white',
//                                                     borderRadius: 3,
//                                                     display: 'flex',
//                                                     alignItems: 'center',
//                                                     gap: 0.5,
//                                                     boxShadow: week.remaining >= 0
//                                                         ? '0 4px 12px rgba(5, 150, 105, 0.4)'
//                                                         : '0 4px 12px rgba(220, 38, 38, 0.4)',
//                                                     animation: week.remaining >= 0 ? 'pulse 2s ease-in-out infinite' : 'none',
//                                                     '@keyframes pulse': {
//                                                         '0%, 100%': {
//                                                             boxShadow: week.remaining >= 0
//                                                                 ? '0 4px 12px rgba(5, 150, 105, 0.4)'
//                                                                 : '0 4px 12px rgba(220, 38, 38, 0.4)',
//                                                         },
//                                                         '50%': {
//                                                             boxShadow: week.remaining >= 0
//                                                                 ? '0 6px 20px rgba(5, 150, 105, 0.6)'
//                                                                 : '0 6px 20px rgba(220, 38, 38, 0.6)',
//                                                         }
//                                                     }
//                                                 }}
//                                             >
//                                                 {week.remaining >= 0 ? (
//                                                     <SavingsIcon sx={{ fontSize: 20 }} />
//                                                 ) : (
//                                                     <TrendingUpIcon sx={{ fontSize: 20 }} />
//                                                 )}
//                                                 <Box sx={{ textAlign: 'left' }}>
//                                                     <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.9, display: 'block', lineHeight: 1 }}>
//                                                         {week.remaining >= 0 ? 'SAVED' : 'OVER'}
//                                                     </Typography>
//                                                     <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
//                                                         ${Math.abs(week.remaining).toFixed(2)}
//                                                     </Typography>
//                                                 </Box>
//                                             </Paper>
//                                         </Tooltip>
//                                     </Box>
//                                 )}
//
//                                 <Grid container spacing={2} alignItems="center">
//                                     {/* Week Info */}
//                                     <Grid item xs={12} md={4}>
//                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                                             {viewMode === 'receiptDetail' && (
//                                                 <IconButton
//                                                     size="small"
//                                                     onClick={(e) => {
//                                                         e.stopPropagation();
//                                                         toggleWeek(week.weekNumber);
//                                                     }}
//                                                     sx={{
//                                                         bgcolor: alpha(progressColor, 0.2),
//                                                         '&:hover': {
//                                                             bgcolor: alpha(progressColor, 0.3)
//                                                         }
//                                                     }}
//                                                 >
//                                                     {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
//                                                 </IconButton>
//                                             )}
//                                             <Box>
//                                                 <Typography variant="h6" fontWeight={700} color={maroonColor}>
//                                                     {week.weekLabel}
//                                                 </Typography>
//                                                 <Typography variant="body2" color="text.secondary">
//                                                     {format(week.startDate, 'MMM d')} - {format(week.endDate, 'MMM d, yyyy')}
//                                                 </Typography>
//                                                 <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
//                                                     <Chip
//                                                         icon={<ReceiptIcon />}
//                                                         label={`${week.receipts.length} receipt${week.receipts.length !== 1 ? 's' : ''}`}
//                                                         size="small"
//                                                         sx={{
//                                                             bgcolor: alpha(tealColor, 0.1),
//                                                             color: tealColor,
//                                                             fontWeight: 600
//                                                         }}
//                                                     />
//                                                     {budget.plannedItems && budget.plannedItems.length > 0 && (
//                                                         <Chip
//                                                             icon={<PlaylistAddCheckIcon />}
//                                                             label="Has List"
//                                                             size="small"
//                                                             sx={{
//                                                                 bgcolor: alpha('#7c3aed', 0.1),
//                                                                 color: '#7c3aed',
//                                                                 fontWeight: 600
//                                                             }}
//                                                         />
//                                                     )}
//                                                 </Box>
//                                             </Box>
//                                         </Box>
//                                     </Grid>
//
//                                     {/* Budget Stats */}
//                                     <Grid item xs={12} md={8}>
//                                         {/* BY WEEK VIEW */}
//                                         {viewMode === 'week' && (
//                                             <>
//                                                 <Grid container spacing={2}>
//                                                     <Grid item xs={3}>
//                                                         <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(tealColor, 0.05) }}>
//                                                             <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
//                                                                 Budgeted
//                                                             </Typography>
//                                                             <Typography variant="h6" fontWeight={700} color={tealColor}>
//                                                                 ${week.budgetAmount.toFixed(2)}
//                                                             </Typography>
//                                                         </Paper>
//                                                     </Grid>
//                                                     <Grid item xs={3}>
//                                                         <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(maroonColor, 0.05) }}>
//                                                             <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
//                                                                 Spent
//                                                             </Typography>
//                                                             <Typography variant="h6" fontWeight={700} color={maroonColor}>
//                                                                 ${week.actualSpent.toFixed(2)}
//                                                             </Typography>
//                                                         </Paper>
//                                                     </Grid>
//                                                     <Grid item xs={3}>
//                                                         <Paper sx={{
//                                                             p: 2,
//                                                             textAlign: 'center',
//                                                             bgcolor: week.remaining >= 0 ? alpha('#059669', 0.05) : alpha('#dc2626', 0.05)
//                                                         }}>
//                                                             <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
//                                                                 Remaining
//                                                             </Typography>
//                                                             <Typography
//                                                                 variant="h6"
//                                                                 fontWeight={700}
//                                                                 color={week.remaining >= 0 ? '#059669' : '#dc2626'}
//                                                             >
//                                                                 ${Math.abs(week.remaining).toFixed(2)}
//                                                             </Typography>
//                                                             <Typography variant="caption" color="text.secondary">
//                                                                 {week.remaining >= 0 ? 'under' : 'over'}
//                                                             </Typography>
//                                                         </Paper>
//                                                     </Grid>
//                                                     <Grid item xs={3}>
//                                                         <Paper sx={{
//                                                             p: 2,
//                                                             textAlign: 'center',
//                                                             background: week.remaining >= 0
//                                                                 ? 'linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
//                                                                 : 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
//                                                             border: `2px solid ${week.remaining >= 0 ? '#059669' : '#dc2626'}`,
//                                                             position: 'relative',
//                                                             overflow: 'hidden'
//                                                         }}>
//                                                             {week.remaining >= 0 && (
//                                                                 <Box sx={{
//                                                                     position: 'absolute',
//                                                                     top: 4,
//                                                                     right: 4,
//                                                                 }}>
//                                                                     <SavingsIcon sx={{ fontSize: 16, color: '#059669', opacity: 0.3 }} />
//                                                                 </Box>
//                                                             )}
//                                                             <Typography variant="caption" sx={{
//                                                                 color: week.remaining >= 0 ? '#059669' : '#dc2626',
//                                                                 textTransform: 'uppercase',
//                                                                 fontWeight: 700,
//                                                                 fontSize: '0.65rem'
//                                                             }}>
//                                                                 {week.remaining >= 0 ? '✓ SAVED' : '✗ OVERSPENT'}
//                                                             </Typography>
//                                                             <Typography
//                                                                 variant="h6"
//                                                                 fontWeight={800}
//                                                                 sx={{
//                                                                     color: week.remaining >= 0 ? '#059669' : '#dc2626',
//                                                                     fontSize: '1.1rem'
//                                                                 }}
//                                                             >
//                                                                 ${Math.abs(week.remaining).toFixed(2)}
//                                                             </Typography>
//                                                             {week.remaining >= 0 ? (
//                                                                 <Chip
//                                                                     label="🎯"
//                                                                     size="small"
//                                                                     sx={{
//                                                                         height: 18,
//                                                                         fontSize: '0.65rem',
//                                                                         bgcolor: '#059669',
//                                                                         color: 'white',
//                                                                         fontWeight: 600,
//                                                                         mt: 0.5
//                                                                     }}
//                                                                 />
//                                                             ) : (
//                                                                 <Typography variant="caption" sx={{ color: '#dc2626', fontSize: '0.65rem' }}>
//                                                                     ⚠️
//                                                                 </Typography>
//                                                             )}
//                                                         </Paper>
//                                                     </Grid>
//                                                 </Grid>
//                                             </>
//                                         )}
//
//                                         {/* BY RECEIPT DETAIL VIEW */}
//                                         {viewMode === 'receiptDetail' && (
//                                             <>
//                                                 <Grid container spacing={2}>
//                                                     <Grid item xs={4}>
//                                                         <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(tealColor, 0.05) }}>
//                                                             <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
//                                                                 Receipts
//                                                             </Typography>
//                                                             <Typography variant="h6" fontWeight={700} color={tealColor}>
//                                                                 {week.receipts.length}
//                                                             </Typography>
//                                                             <Typography variant="caption" color="text.secondary">
//                                                                 trips
//                                                             </Typography>
//                                                         </Paper>
//                                                     </Grid>
//                                                     <Grid item xs={4}>
//                                                         <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(maroonColor, 0.05) }}>
//                                                             <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
//                                                                 Avg/Trip
//                                                             </Typography>
//                                                             <Typography variant="h6" fontWeight={700} color={maroonColor}>
//                                                                 ${week.receipts.length > 0 ? (week.actualSpent / week.receipts.length).toFixed(2) : '0.00'}
//                                                             </Typography>
//                                                             <Typography variant="caption" color="text.secondary">
//                                                                 per receipt
//                                                             </Typography>
//                                                         </Paper>
//                                                     </Grid>
//                                                     <Grid item xs={4}>
//                                                         <Paper sx={{
//                                                             p: 2,
//                                                             textAlign: 'center',
//                                                             bgcolor: week.remaining >= 0 ? alpha('#059669', 0.05) : alpha('#dc2626', 0.05)
//                                                         }}>
//                                                             <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
//                                                                 {week.remaining >= 0 ? 'Saved' : 'Over'}
//                                                             </Typography>
//                                                             <Typography
//                                                                 variant="h6"
//                                                                 fontWeight={700}
//                                                                 color={week.remaining >= 0 ? '#059669' : '#dc2626'}
//                                                             >
//                                                                 ${Math.abs(week.remaining).toFixed(2)}
//                                                             </Typography>
//                                                             <Typography variant="caption" color="text.secondary">
//                                                                 this week
//                                                             </Typography>
//                                                         </Paper>
//                                                     </Grid>
//                                                 </Grid>
//                                             </>
//                                         )}
//
//                                         {/* BY GROCERY LIST VIEW */}
//                                         {viewMode === 'groceryList' && weekAnalytics && (
//                                             <>
//                                                 <Grid container spacing={2}>
//                                                     <Grid item xs={3}>
//                                                         <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha('#7c3aed', 0.05) }}>
//                                                             <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>
//                                                                 List Budget
//                                                             </Typography>
//                                                             <Typography variant="h6" fontWeight={700} color="#7c3aed">
//                                                                 ${weekAnalytics.plannedTotal.toFixed(2)}
//                                                             </Typography>
//                                                             <Typography variant="caption" color="text.secondary">
//                                                                 planned
//                                                             </Typography>
//                                                         </Paper>
//                                                     </Grid>
//                                                     <Grid item xs={3}>
//                                                         <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(maroonColor, 0.05) }}>
//                                                             <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>
//                                                                 Spent
//                                                             </Typography>
//                                                             <Typography variant="h6" fontWeight={700} color={maroonColor}>
//                                                                 ${weekAnalytics.purchasedFromList.toFixed(2)}
//                                                             </Typography>
//                                                             <Typography variant="caption" color="text.secondary">
//                                                                 from list
//                                                             </Typography>
//                                                         </Paper>
//                                                     </Grid>
//                                                     <Grid item xs={3}>
//                                                         <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha('#f59e0b', 0.05) }}>
//                                                             <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>
//                                                                 Unplanned
//                                                             </Typography>
//                                                             <Typography variant="h6" fontWeight={700} color="#f59e0b">
//                                                                 ${weekAnalytics.unplannedPurchases.toFixed(2)}
//                                                             </Typography>
//                                                             <Typography variant="caption" color="text.secondary">
//                                                                 impulse
//                                                             </Typography>
//                                                         </Paper>
//                                                     </Grid>
//                                                     <Grid item xs={3}>
//                                                         <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(tealColor, 0.05) }}>
//                                                             <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>
//                                                                 Adherence
//                                                             </Typography>
//                                                             <Typography variant="h6" fontWeight={700} color={tealColor}>
//                                                                 {weekAnalytics.adherenceRate.toFixed(0)}%
//                                                             </Typography>
//                                                             <Typography variant="caption" color="text.secondary">
//                                                                 on list
//                                                             </Typography>
//                                                         </Paper>
//                                                     </Grid>
//                                                 </Grid>
//
//                                                 {/* Most Expensive List Item */}
//                                                 {(() => {
//                                                     const weekItems = week.receipts.flatMap(r => r.items);
//                                                     const plannedItemNames = new Set(
//                                                         budget.plannedItems?.map(pi => pi.itemName.toLowerCase()) || []
//                                                     );
//                                                     const listItems = weekItems.filter(item =>
//                                                         plannedItemNames.has(item.itemName.toLowerCase())
//                                                     );
//                                                     const mostExpensive = listItems.sort((a, b) => b.itemCost - a.itemCost)[0];
//
//                                                     if (!mostExpensive) return null;
//
//                                                     return (
//                                                         <Box sx={{ mt: 2 }}>
//                                                             <Paper sx={{
//                                                                 p: 1.5,
//                                                                 bgcolor: alpha('#7c3aed', 0.05),
//                                                                 border: `1px solid ${alpha('#7c3aed', 0.2)}`,
//                                                                 borderRadius: 2
//                                                             }}>
//                                                                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                                                                     <Box>
//                                                                         <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
//                                                                             Most Expensive List Item
//                                                                         </Typography>
//                                                                         <Typography variant="body2" fontWeight={600}>
//                                                                             {mostExpensive.itemName}
//                                                                         </Typography>
//                                                                     </Box>
//                                                                     <Typography variant="h6" fontWeight={700} color="#7c3aed">
//                                                                         ${mostExpensive.itemCost.toFixed(2)}
//                                                                     </Typography>
//                                                                 </Box>
//                                                             </Paper>
//                                                         </Box>
//                                                     );
//                                                 })()}
//                                             </>
//                                         )}
//
//                                         {/* ANALYTICS VIEW */}
//                                         {viewMode === 'analytics' && weekAnalytics && (
//                                             <>
//                                                 <Grid container spacing={2}>
//                                                     <Grid item xs={3}>
//                                                         <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha('#3b82f6', 0.05) }}>
//                                                             <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>
//                                                                 Items
//                                                             </Typography>
//                                                             <Typography variant="h6" fontWeight={700} color="#3b82f6">
//                                                                 {week.receipts.reduce((sum, r) => sum + r.itemCount, 0)}
//                                                             </Typography>
//                                                             <Typography variant="caption" color="text.secondary">
//                                                                 purchased
//                                                             </Typography>
//                                                         </Paper>
//                                                     </Grid>
//                                                     <Grid item xs={3}>
//                                                         <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha('#8b5cf6', 0.05) }}>
//                                                             <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>
//                                                                 Avg/Item
//                                                             </Typography>
//                                                             <Typography variant="h6" fontWeight={700} color="#8b5cf6">
//                                                                 ${week.receipts.reduce((sum, r) => sum + r.itemCount, 0) > 0
//                                                                 ? (week.actualSpent / week.receipts.reduce((sum, r) => sum + r.itemCount, 0)).toFixed(2)
//                                                                 : '0.00'}
//                                                             </Typography>
//                                                             <Typography variant="caption" color="text.secondary">
//                                                                 per item
//                                                             </Typography>
//                                                         </Paper>
//                                                     </Grid>
//                                                     <Grid item xs={3}>
//                                                         <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha('#f59e0b', 0.05) }}>
//                                                             <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>
//                                                                 Stores
//                                                             </Typography>
//                                                             <Typography variant="h6" fontWeight={700} color="#f59e0b">
//                                                                 {new Set(week.receipts.map(r => r.storeName)).size}
//                                                             </Typography>
//                                                             <Typography variant="caption" color="text.secondary">
//                                                                 visited
//                                                             </Typography>
//                                                         </Paper>
//                                                     </Grid>
//                                                     <Grid item xs={3}>
//                                                         <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(tealColor, 0.05) }}>
//                                                             <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>
//                                                                 Usage
//                                                             </Typography>
//                                                             <Typography variant="h6" fontWeight={700} color={tealColor}>
//                                                                 {week.percentUsed.toFixed(0)}%
//                                                             </Typography>
//                                                             <Typography variant="caption" color="text.secondary">
//                                                                 of budget
//                                                             </Typography>
//                                                         </Paper>
//                                                     </Grid>
//                                                 </Grid>
//
//                                                 {/* Optimization Alert */}
//                                                 {(() => {
//                                                     const isOverBudget = week.remaining < 0;
//                                                     const isHighUsage = week.percentUsed > 90;
//                                                     const avgWeeklySpend = weeklyData.reduce((sum, w) => sum + w.actualSpent, 0) / weeklyData.length;
//                                                     const isIrregular = Math.abs(week.actualSpent - avgWeeklySpend) > (avgWeeklySpend * 0.4);
//                                                     const hasManyTrips = week.receipts.length > 4;
//
//                                                     const hasIssue = isOverBudget || isHighUsage || isIrregular || hasManyTrips;
//
//                                                     if (!hasIssue) return null;
//
//                                                     return (
//                                                         <Box sx={{ mt: 2 }}>
//                                                             <Paper sx={{
//                                                                 p: 2,
//                                                                 bgcolor: alpha('#f59e0b', 0.05),
//                                                                 border: `2px solid ${alpha('#f59e0b', 0.3)}`,
//                                                                 borderRadius: 2,
//                                                                 display: 'flex',
//                                                                 alignItems: 'center',
//                                                                 justifyContent: 'space-between',
//                                                                 gap: 2
//                                                             }}>
//                                                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                                                                     <Box sx={{
//                                                                         p: 1,
//                                                                         borderRadius: 2,
//                                                                         bgcolor: alpha('#f59e0b', 0.15)
//                                                                     }}>
//                                                                         <LightbulbIcon sx={{ fontSize: 24, color: '#f59e0b' }} />
//                                                                     </Box>
//                                                                     <Box>
//                                                                         <Typography variant="subtitle2" fontWeight={700} color="#f59e0b">
//                                                                             {isOverBudget && 'Over Budget Alert'}
//                                                                             {!isOverBudget && isHighUsage && 'High Usage Alert'}
//                                                                             {!isOverBudget && !isHighUsage && isIrregular && 'Irregular Spending Detected'}
//                                                                             {!isOverBudget && !isHighUsage && !isIrregular && hasManyTrips && 'Many Shopping Trips'}
//                                                                         </Typography>
//                                                                         <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
//                                                                             {isOverBudget && `You're $${Math.abs(week.remaining).toFixed(2)} over budget this week`}
//                                                                             {!isOverBudget && isHighUsage && `You've used ${week.percentUsed.toFixed(0)}% of your weekly budget`}
//                                                                             {!isOverBudget && !isHighUsage && isIrregular && `This week's spending is ${((Math.abs(week.actualSpent - avgWeeklySpend) / avgWeeklySpend) * 100).toFixed(0)}% different from average`}
//                                                                             {!isOverBudget && !isHighUsage && !isIrregular && hasManyTrips && `${week.receipts.length} shopping trips - consider consolidating`}
//                                                                         </Typography>
//                                                                     </Box>
//                                                                 </Box>
//                                                                 <Chip
//                                                                     label="Optimize"
//                                                                     icon={<LightbulbIcon />}
//                                                                     onClick={() => {
//                                                                         console.log('Optimize week:', week.weekNumber);
//                                                                     }}
//                                                                     sx={{
//                                                                         background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
//                                                                         color: 'white',
//                                                                         fontWeight: 700,
//                                                                         cursor: 'pointer',
//                                                                         '&:hover': {
//                                                                             background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
//                                                                             boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
//                                                                         }
//                                                                     }}
//                                                                 />
//                                                             </Paper>
//                                                         </Box>
//                                                     );
//                                                 })()}
//                                             </>
//                                         )}
//
//                                         {/* Progress Bar */}
//                                         <Box sx={{ mt: 2 }}>
//                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
//                                                 <Typography variant="caption" color="text.secondary" fontWeight={600}>
//                                                     Budget Usage
//                                                 </Typography>
//                                                 <Typography variant="caption" fontWeight={700} color={progressColor}>
//                                                     {week.percentUsed.toFixed(1)}%
//                                                 </Typography>
//                                             </Box>
//                                             <LinearProgress
//                                                 variant="determinate"
//                                                 value={Math.min(week.percentUsed, 100)}
//                                                 sx={{
//                                                     height: 10,
//                                                     borderRadius: 5,
//                                                     backgroundColor: alpha(progressColor, 0.15),
//                                                     '& .MuiLinearProgress-bar': {
//                                                         backgroundColor: progressColor,
//                                                         borderRadius: 5
//                                                     }
//                                                 }}
//                                             />
//                                         </Box>
//                                     </Grid>
//                                 </Grid>
//                             </Box>
//
//                             {/* Expanded Receipts */}
//                             {viewMode === 'receiptDetail' && (
//                                 <Collapse in={isExpanded} timeout="auto" unmountOnExit>
//                                     <Box sx={{ p: 3, bgcolor: alpha(tealColor, 0.02) }}>
//                                         {week.receipts.length > 0 ? (
//                                             <Grid container spacing={2}>
//                                                 {week.receipts.map((receipt) => (
//                                                     <Grid item xs={12} sm={6} md={4} key={receipt.id}>
//                                                         <Paper
//                                                             onClick={() => handleReceiptClick(receipt)}
//                                                             sx={{
//                                                                 p: 2,
//                                                                 cursor: 'pointer',
//                                                                 border: `2px solid ${selectedReceiptId === receipt.id ? tealColor : 'transparent'}`,
//                                                                 bgcolor: selectedReceiptId === receipt.id ? alpha(tealColor, 0.05) : 'white',
//                                                                 transition: 'all 0.2s',
//                                                                 '&:hover': {
//                                                                     boxShadow: 3,
//                                                                     borderColor: tealColor,
//                                                                     transform: 'translateY(-2px)'
//                                                                 }
//                                                             }}
//                                                         >
//                                                             <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
//                                                                 <Box sx={{
//                                                                     p: 1,
//                                                                     borderRadius: 2,
//                                                                     bgcolor: alpha(tealColor, 0.1)
//                                                                 }}>
//                                                                     <StoreIcon sx={{ color: tealColor, fontSize: 24 }} />
//                                                                 </Box>
//                                                                 <Box sx={{ flex: 1 }}>
//                                                                     <Typography variant="subtitle2" fontWeight={700} color={maroonColor}>
//                                                                         {receipt.storeName}
//                                                                     </Typography>
//                                                                     <Typography variant="caption" color="text.secondary" display="block">
//                                                                         {format(parseISO(receipt.purchaseDate), 'MMM d, yyyy')}
//                                                                     </Typography>
//                                                                     <Typography variant="caption" color="text.secondary" display="block">
//                                                                         {receipt.itemCount} item{receipt.itemCount !== 1 ? 's' : ''}
//                                                                     </Typography>
//                                                                     <Typography variant="h6" fontWeight={700} color={tealColor} sx={{ mt: 1 }}>
//                                                                         ${receipt.totalCost.toFixed(2)}
//                                                                     </Typography>
//                                                                 </Box>
//                                                             </Box>
//                                                         </Paper>
//                                                     </Grid>
//                                                 ))}
//                                             </Grid>
//                                         ) : (
//                                             <Box sx={{
//                                                 textAlign: 'center',
//                                                 color: 'text.secondary',
//                                                 fontStyle: 'italic',
//                                                 py: 4
//                                             }}>
//                                                 No receipts for this week
//                                             </Box>
//                                         )}
//                                     </Box>
//                                 </Collapse>
//                             )}
//                         </Card>
//                     );
//                 })}
//             </Stack>
//         </Box>
//     );
// };
//
// export default GroceryBudgetTable;
// // import React, { useState, useMemo } from 'react';
// // import {
// //     Box,
// //     Paper,
// //     Table,
// //     TableBody,
// //     TableCell,
// //     TableHead,
// //     TableRow,
// //     Typography,
// //     IconButton,
// //     LinearProgress,
// //     Chip,
// //     Card,
// //     CardContent,
// //     Grid,
// //     Divider,
// //     Stack,
// //     Tooltip
// // } from '@mui/material';
// // import { styled } from '@mui/material/styles';
// // import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// // import ExpandLessIcon from '@mui/icons-material/ExpandLess';
// // import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
// // import StoreIcon from '@mui/icons-material/Store';
// // import CategoryIcon from '@mui/icons-material/Category';
// // import TrendingUpIcon from '@mui/icons-material/TrendingUp';
// // import TrendingDownIcon from '@mui/icons-material/TrendingDown';
// // import SavingsIcon from '@mui/icons-material/Savings';
// // import {GroceryBudget, GroceryBudgetWithTotals, GroceryItem, SectionWithDetails} from "../config/Types";
// // import { startOfWeek, endOfWeek, format, parseISO, isWithinInterval, addWeeks, differenceInWeeks } from 'date-fns';
// // import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
// // import ReceiptIcon from "@mui/icons-material/Receipt";
// // import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
// // import {ViewMode} from "./GroceryTracker";
// // import AssignmentIcon from "@mui/icons-material/Assignment";
// //
// // const maroonColor = '#800000';
// // const tealColor = '#0d9488';
// //
// // interface GroceryBudgetTableProps {
// //     budget?: GroceryBudgetWithTotals;
// //     viewMode: ViewMode;
// //     onViewModeChange: (mode: ViewMode) => void;  // ← THIS IS NEW!
// //     onReceiptSelect?: (receipt: ReceiptSummary) => void;
// //     onWeekSelect?: (week: WeekData) => void;
// // }
// //
// // export interface ReceiptSummary {
// //     id: string;
// //     storeName: string;
// //     purchaseDate: string;
// //     itemCount: number;
// //     totalCost: number;
// //     items: GroceryItem[];
// //     weekNumber: number;
// //     weekLabel: string;
// // }
// //
// // export interface WeekData {
// //     weekNumber: number;
// //     weekLabel: string;
// //     startDate: Date;
// //     endDate: Date;
// //     budgetAmount: number;
// //     actualSpent: number;
// //     remaining: number;
// //     percentUsed: number;
// //     receipts: ReceiptSummary[];
// // }
// //
// //
// // // Sample grocery budget data
// // const sampleGroceryBudget = {
// //     id: 1,
// //     name: 'January 2026 Groceries',
// //     budgetAmount: 600,
// //     totalSpent: 342.49,
// //     startDate: '2026-01-01',
// //     endDate: '2026-01-31',
// //     savingsGoal: 100,
// //     stores: [
// //         {
// //             storeName: 'Whole Foods',
// //             totalSpent: 187.50,
// //             items: [
// //                 { itemName: 'Organic Apples', itemCost: 12.50, category: 'Produce', datePurchased: '2026-01-05' },
// //                 { itemName: 'Chicken Breast', itemCost: 25.00, category: 'Meat', datePurchased: '2026-01-05' },
// //                 { itemName: 'Greek Yogurt', itemCost: 8.99, category: 'Dairy', datePurchased: '2026-01-08' },
// //                 { itemName: 'Organic Spinach', itemCost: 6.50, category: 'Produce', datePurchased: '2026-01-10' },
// //                 { itemName: 'Salmon Fillet', itemCost: 34.00, category: 'Seafood', datePurchased: '2026-01-12' },
// //                 { itemName: 'Whole Grain Bread', itemCost: 5.99, category: 'Bakery', datePurchased: '2026-01-15' },
// //                 { itemName: 'Avocados', itemCost: 9.50, category: 'Produce', datePurchased: '2026-01-18' },
// //                 { itemName: 'Almond Butter', itemCost: 12.99, category: 'Pantry', datePurchased: '2026-01-20' },
// //                 { itemName: 'Free Range Eggs', itemCost: 7.50, category: 'Dairy', datePurchased: '2026-01-22' },
// //                 { itemName: 'Mixed Berries', itemCost: 14.50, category: 'Produce', datePurchased: '2026-01-25' },
// //                 { itemName: 'Quinoa', itemCost: 8.99, category: 'Pantry', datePurchased: '2026-01-27' },
// //                 { itemName: 'Kale', itemCost: 4.50, category: 'Produce', datePurchased: '2026-01-28' },
// //                 { itemName: 'Grass-Fed Beef', itemCost: 36.54, category: 'Meat', datePurchased: '2026-01-30' }
// //             ]
// //         },
// //         {
// //             storeName: 'Trader Joes',
// //             totalSpent: 89.99,
// //             items: [
// //                 { itemName: 'Almond Milk', itemCost: 3.99, category: 'Dairy', datePurchased: '2026-01-08' },
// //                 { itemName: 'Everything Bagels', itemCost: 4.50, category: 'Bakery', datePurchased: '2026-01-08' },
// //                 { itemName: 'Frozen Vegetables', itemCost: 6.99, category: 'Frozen', datePurchased: '2026-01-11' },
// //                 { itemName: 'Trail Mix', itemCost: 7.50, category: 'Snacks', datePurchased: '2026-01-14' },
// //                 { itemName: 'Pasta', itemCost: 2.99, category: 'Pantry', datePurchased: '2026-01-17' },
// //                 { itemName: 'Marinara Sauce', itemCost: 3.99, category: 'Pantry', datePurchased: '2026-01-17' },
// //                 { itemName: 'Cashew Cheese', itemCost: 5.99, category: 'Dairy', datePurchased: '2026-01-19' },
// //                 { itemName: 'Dark Chocolate', itemCost: 3.99, category: 'Snacks', datePurchased: '2026-01-21' },
// //                 { itemName: 'Hummus', itemCost: 4.50, category: 'Deli', datePurchased: '2026-01-23' },
// //                 { itemName: 'Cauliflower Rice', itemCost: 3.99, category: 'Frozen', datePurchased: '2026-01-26' },
// //                 { itemName: 'Coffee Beans', itemCost: 9.99, category: 'Beverages', datePurchased: '2026-01-28' },
// //                 { itemName: 'Frozen Pizza', itemCost: 5.99, category: 'Frozen', datePurchased: '2026-01-29' },
// //                 { itemName: 'Pita Bread', itemCost: 3.50, category: 'Bakery', datePurchased: '2026-01-30' },
// //                 { itemName: 'Coconut Water', itemCost: 7.99, category: 'Beverages', datePurchased: '2026-01-30' },
// //                 { itemName: 'Protein Bars', itemCost: 9.99, category: 'Snacks', datePurchased: '2026-01-31' }
// //             ]
// //         },
// //         {
// //             storeName: 'Costco',
// //             totalSpent: 65.00,
// //             items: [
// //                 { itemName: 'Bananas', itemCost: 8.50, category: 'Produce', datePurchased: '2026-01-03' },
// //                 { itemName: 'Paper Towels', itemCost: 24.99, category: 'Household', datePurchased: '2026-01-03' },
// //                 { itemName: 'Chicken Thighs', itemCost: 19.99, category: 'Meat', datePurchased: '2026-01-16' },
// //                 { itemName: 'Olive Oil', itemCost: 11.52, category: 'Pantry', datePurchased: '2026-01-16' }
// //             ]
// //         }
// //     ],
// //     sections: [
// //         { name: 'Produce', budgetAmount: 150, totalSpent: 56.00 },
// //         { name: 'Meat & Seafood', budgetAmount: 200, totalSpent: 115.53 },
// //         { name: 'Dairy', budgetAmount: 100, totalSpent: 30.97 },
// //         { name: 'Bakery', budgetAmount: 50, totalSpent: 14.99 },
// //         { name: 'Pantry', budgetAmount: 80, totalSpent: 36.48 },
// //         { name: 'Frozen', budgetAmount: 40, totalSpent: 17.97 },
// //         { name: 'Snacks', budgetAmount: 30, totalSpent: 21.48 },
// //         { name: 'Beverages', budgetAmount: 25, totalSpent: 17.98 },
// //         { name: 'Household', budgetAmount: 25, totalSpent: 24.99 },
// //         { name: 'Seafood', budgetAmount: 60, totalSpent: 0 },
// //         { name: 'Deli', budgetAmount: 15, totalSpent: 4.50 }
// //     ]
// // };
// //
// // const GroceryBudgetTable: React.FC<GroceryBudgetTableProps> = ({ budget, viewMode, onReceiptSelect, onWeekSelect, onViewModeChange }) => {
// //     const [expandedWeeks, setExpandedWeeks] = useState(new Set([1]));
// //     const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
// //     const [selectedWeekNumber, setSelectedWeekNumber] = useState<number | null>(null);
// //
// //     const weeklyData = useMemo((): WeekData[] => {
// //         if (!budget) return [];
// //
// //         const startDate = parseISO(budget.startDate);
// //         const endDate = parseISO(budget.endDate);
// //
// //         // Calculate number of weeks in the budget period
// //         const totalWeeks = Math.ceil(differenceInWeeks(endDate, startDate)) + 1;
// //         const weeklyBudget = budget.budgetAmount / totalWeeks;
// //
// //         // Collect all items from all stores
// //         const allItems: GroceryItem[] = [];
// //         budget.stores.forEach(store => {
// //             store.items.forEach(item => {
// //                 allItems.push({ ...item, storeName: store.storeName });
// //             });
// //         });
// //
// //         // Group items by week
// //         const weeks: WeekData[] = [];
// //         for (let i = 0; i < totalWeeks; i++) {
// //             const weekStart = addWeeks(startDate, i);
// //             const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 }); // Week starts on Sunday
// //
// //             // Ensure weekEnd doesn't exceed budget end date
// //             const actualWeekEnd = weekEnd > endDate ? endDate : weekEnd;
// //
// //             const weekItems = allItems.filter(item => {
// //                 const itemDate = parseISO(item.datePurchased);
// //                 return isWithinInterval(itemDate, { start: weekStart, end: actualWeekEnd });
// //             });
// //
// //             // Group items into receipts (by store and date)
// //             const receiptMap = new Map<string, GroceryItem[]>();
// //             weekItems.forEach(item => {
// //                 const receiptKey = `${item.storeName}-${item.datePurchased}`;
// //                 if (!receiptMap.has(receiptKey)) {
// //                     receiptMap.set(receiptKey, []);
// //                 }
// //                 receiptMap.get(receiptKey)!.push(item);
// //             });
// //
// //             // Convert to receipt summaries
// //             const receipts: ReceiptSummary[] = Array.from(receiptMap.entries()).map(([key, items]) => {
// //                 const [storeName, purchaseDate] = key.split('-');
// //                 return {
// //                     id: `week${i + 1}-${key}`,
// //                     storeName,
// //                     purchaseDate,
// //                     itemCount: items.length,
// //                     totalCost: items.reduce((sum, item) => sum + item.itemCost, 0),
// //                     items: items.sort((a, b) => a.itemName.localeCompare(b.itemName)),
// //                     weekNumber: i + 1,
// //                     weekLabel: `Week ${i + 1}`
// //                 };
// //             }).sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate));
// //
// //             const actualSpent = weekItems.reduce((sum, item) => sum + item.itemCost, 0);
// //             const remaining = weeklyBudget - actualSpent;
// //             const percentUsed = (actualSpent / weeklyBudget) * 100;
// //
// //             weeks.push({
// //                 weekNumber: i + 1,
// //                 weekLabel: `Week ${i + 1}`,
// //                 startDate: weekStart,
// //                 endDate: actualWeekEnd,
// //                 budgetAmount: weeklyBudget,
// //                 actualSpent,
// //                 remaining,
// //                 percentUsed,
// //                 receipts
// //             });
// //         }
// //
// //         return weeks;
// //     }, [budget]);
// //
// //     if(!budget){
// //         return null;
// //     }
// //
// //     // Calculate section data with items from stores
// //
// //     const toggleWeek = (weekNumber: number) => {
// //         setExpandedWeeks(prev => {
// //             const newSet = new Set(prev);
// //             if (newSet.has(weekNumber)) {
// //                 newSet.delete(weekNumber);
// //             } else {
// //                 newSet.add(weekNumber);
// //             }
// //             return newSet;
// //         });
// //     };
// //
// //     const handleReceiptClick = (receipt: ReceiptSummary) => {
// //         setSelectedReceiptId(receipt.id);
// //         onReceiptSelect?.(receipt);
// //     };
// //
// //     const gradients = {
// //         maroon: 'linear-gradient(135deg, #800000 0%, #a00000 100%)'
// //     };
// //
// //     const handleWeekClick = (week: WeekData) => {
// //         setSelectedWeekNumber(week.weekNumber);
// //         setSelectedReceiptId(null);
// //         onWeekSelect?.(week);
// //     };
// //
// //     const remaining = budget.budgetAmount - budget.totalSpent;
// //     const percentSpent = (budget.totalSpent / budget.budgetAmount) * 100;
// //     const onTrackForSavings = remaining >= budget.savingsGoal;
// //
// //     const getProgressColor = (percent: number) => {
// //         if (percent < 70) return tealColor;
// //         if (percent < 90) return '#f59e0b';
// //         return '#dc2626';
// //     };
// //
// //
// //     return (
// //         <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
// //             {/* Header Summary Cards */}
// //             <Grid container spacing={3} sx={{ mb: 4 }}>
// //                 <Grid item xs={12} md={3}>
// //                     <Card sx={{
// //                         background: `linear-gradient(135deg, ${tealColor} 0%, #14b8a6 100%)`,
// //                         color: 'white',
// //                         boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
// //                     }}>
// //                         <CardContent>
// //                             <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
// //                                 <ShoppingCartIcon sx={{ mr: 1 }} />
// //                                 <Typography variant="caption" sx={{ opacity: 0.9 }}>Total Budget</Typography>
// //                             </Box>
// //                             <Typography variant="h4" fontWeight="bold">
// //                                 ${budget.budgetAmount.toFixed(2)}
// //                             </Typography>
// //                         </CardContent>
// //                     </Card>
// //                 </Grid>
// //
// //                 <Grid item xs={12} md={3}>
// //                     <Card sx={{
// //                         background: percentSpent > 90
// //                             ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
// //                             : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
// //                         color: 'white',
// //                         boxShadow: percentSpent > 90
// //                             ? '0 4px 12px rgba(220, 38, 38, 0.25)'
// //                             : '0 4px 12px rgba(37, 99, 235, 0.25)'
// //                     }}>
// //                         <CardContent>
// //                             <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
// //                                 <TrendingUpIcon sx={{ mr: 1 }} />
// //                                 <Typography variant="caption" sx={{ opacity: 0.9 }}>Total Spent</Typography>
// //                             </Box>
// //                             <Typography variant="h4" fontWeight="bold">
// //                                 ${budget.totalSpent.toFixed(2)}
// //                             </Typography>
// //                             <Typography variant="caption" sx={{ opacity: 0.8 }}>
// //                                 {percentSpent.toFixed(1)}% of budget
// //                             </Typography>
// //                         </CardContent>
// //                     </Card>
// //                 </Grid>
// //
// //                 <Grid item xs={12} md={3}>
// //                     <Card sx={{
// //                         background: remaining >= 0
// //                             ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
// //                             : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
// //                         color: 'white',
// //                         boxShadow: remaining >= 0
// //                             ? '0 4px 12px rgba(5, 150, 105, 0.25)'
// //                             : '0 4px 12px rgba(220, 38, 38, 0.25)'
// //                     }}>
// //                         <CardContent>
// //                             <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
// //                                 {remaining >= 0 ? <TrendingDownIcon sx={{ mr: 1 }} /> : <TrendingUpIcon sx={{ mr: 1 }} />}
// //                                 <Typography variant="caption" sx={{ opacity: 0.9 }}>Remaining</Typography>
// //                             </Box>
// //                             <Typography variant="h4" fontWeight="bold">
// //                                 ${Math.abs(remaining).toFixed(2)}
// //                             </Typography>
// //                             <Typography variant="caption" sx={{ opacity: 0.8 }}>
// //                                 {remaining >= 0 ? 'Under budget' : 'Over budget'}
// //                             </Typography>
// //                         </CardContent>
// //                     </Card>
// //                 </Grid>
// //
// //                 <Grid item xs={12} md={3}>
// //                     <Card sx={{
// //                         background: onTrackForSavings
// //                             ? 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)'
// //                             : 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
// //                         color: 'white',
// //                         boxShadow: onTrackForSavings
// //                             ? '0 4px 12px rgba(124, 58, 237, 0.25)'
// //                             : '0 4px 12px rgba(245, 158, 11, 0.25)'
// //                     }}>
// //                         <CardContent>
// //                             <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
// //                                 <SavingsIcon sx={{ mr: 1 }} />
// //                                 <Typography variant="caption" sx={{ opacity: 0.9 }}>Savings Goal</Typography>
// //                             </Box>
// //                             <Typography variant="h4" fontWeight="bold">
// //                                 ${budget.savingsGoal.toFixed(2)}
// //                             </Typography>
// //                             <Typography variant="caption" sx={{ opacity: 0.8 }}>
// //                                 {onTrackForSavings ? 'On track!' : 'Need to cut back'}
// //                             </Typography>
// //                         </CardContent>
// //                     </Card>
// //                 </Grid>
// //             </Grid>
// //
// //             {/* View Mode Toggle */}
// //             <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
// //                 <Chip
// //                     icon={<CalendarTodayIcon />}
// //                     label="By Week"
// //                     onClick={() => onViewModeChange('week')}
// //                     color={viewMode === 'week' ? 'primary' : 'default'}
// //                     sx={{
// //                         fontWeight: 600,
// //                         cursor: 'pointer',
// //                         ...(viewMode === 'week' && {
// //                             background: gradients.maroon,
// //                             color: 'white',
// //                             '&:hover': {
// //                                 background: 'linear-gradient(135deg, #6b0000 0%, #900000 100%)',
// //                             }
// //                         })
// //                     }}
// //                 />
// //                 <Chip
// //                     icon={<ReceiptLongIcon />}
// //                     label="By Receipt Detail"
// //                     onClick={() => onViewModeChange('receiptDetail')}
// //                     color={viewMode === 'receiptDetail' ? 'primary' : 'default'}
// //                     sx={{
// //                         fontWeight: 600,
// //                         cursor: 'pointer',
// //                         ...(viewMode === 'receiptDetail' && {
// //                             background: gradients.maroon,
// //                             color: 'white',
// //                             '&:hover': {
// //                                 background: 'linear-gradient(135deg, #6b0000 0%, #900000 100%)',
// //                             }
// //                         })
// //                     }}
// //                 />
// //                 {/*<Chip*/}
// //                 {/*    icon={<AssignmentIcon />}*/}
// //                 {/*    label="By Grocery Budget"*/}
// //                 {/*    onClick={() => onViewModeChange('budgetDetail')}*/}
// //                 {/*    color={viewMode === 'budgetDetail' ? 'primary' : 'default'}*/}
// //                 {/*    sx={{*/}
// //                 {/*        fontWeight: 600,*/}
// //                 {/*        cursor: 'pointer',*/}
// //                 {/*        ...(viewMode === 'budgetDetail' && {*/}
// //                 {/*            background: gradients.maroon,*/}
// //                 {/*            color: 'white',*/}
// //                 {/*            '&:hover': {*/}
// //                 {/*                background: 'linear-gradient(135deg, #6b0000 0%, #900000 100%)',*/}
// //                 {/*            }*/}
// //                 {/*        })*/}
// //                 {/*    }}*/}
// //                 {/*/>*/}
// //                 <Chip
// //                     icon={<TrendingUpIcon />}
// //                     label="Analytics"
// //                     onClick={() => onViewModeChange('analytics')}
// //                     color={viewMode === 'analytics' ? 'primary' : 'default'}
// //                     sx={{
// //                         fontWeight: 600,
// //                         cursor: 'pointer',
// //                         ...(viewMode === 'analytics' && {
// //                             background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
// //                             color: 'white',
// //                             '&:hover': {
// //                                 background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
// //                             }
// //                         })
// //                     }}
// //                 />
// //             </Box>
// //
// //             {/* Main Table */}
// //             <Paper sx={{
// //                 boxShadow: 3,
// //                 borderRadius: 4,
// //                 overflow: 'hidden',
// //                 transition: 'box-shadow 0.3s ease-in-out',
// //                 '&:hover': {
// //                     boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
// //                 }
// //             }}>
// //                 <Table sx={{ tableLayout: 'fixed' }}>
// //                     <TableHead>
// //                         <TableRow sx={{ backgroundColor: 'background.paper' }}>
// //                             <TableCell sx={{
// //                                 fontWeight: 'bold',
// //                                 color: maroonColor,
// //                                 fontSize: '0.95rem',
// //                                 width: '35%'
// //                             }}>
// //                                 Week
// //                             </TableCell>
// //                             <TableCell align="right" sx={{
// //                                 fontWeight: 'bold',
// //                                 color: maroonColor,
// //                                 fontSize: '0.95rem',
// //                                 width: '18%'
// //                             }}>
// //                                 Budgeted
// //                             </TableCell>
// //                             <TableCell align="right" sx={{
// //                                 fontWeight: 'bold',
// //                                 color: maroonColor,
// //                                 fontSize: '0.95rem',
// //                                 width: '18%'
// //                             }}>
// //                                 Actual
// //                             </TableCell>
// //                             <TableCell align="right" sx={{
// //                                 fontWeight: 'bold',
// //                                 color: maroonColor,
// //                                 fontSize: '0.95rem',
// //                                 width: '18%'
// //                             }}>
// //                                 Remaining
// //                             </TableCell>
// //                             <TableCell sx={{
// //                                 fontWeight: 'bold',
// //                                 color: maroonColor,
// //                                 fontSize: '0.95rem',
// //                                 width: '11%'
// //                             }}>
// //                                 Progress
// //                             </TableCell>
// //                         </TableRow>
// //                     </TableHead>
// //                 </Table>
// //
// //                 <Box>
// //                     {weeklyData.map((week, index) => {
// //                         const isExpanded = expandedWeeks.has(week.weekNumber);
// //                         const isLast = index === weeklyData.length - 1;
// //                         const progressColor = getProgressColor(week.percentUsed);
// //                         const isWeekSelected = selectedWeekNumber === week.weekNumber;
// //
// //                         // Determine click behavior based on view mode
// //                         const handleRowClick = () => {
// //                             if (viewMode === 'receiptDetail') {
// //                                 toggleWeek(week.weekNumber);
// //                             } else if (viewMode === 'budgetDetail') {
// //                                 handleWeekClick(week);
// //                             }
// //                         };
// //
// //                         const isClickable = viewMode === 'receiptDetail' || viewMode === 'budgetDetail';
// //
// //                         return (
// //                             <Box key={week.weekNumber} sx={{ mb: 0.5 }}>
// //                                 {/* Week Header Row */}
// //                                 <Box
// //                                     onClick={handleRowClick}
// //                                     sx={{
// //                                         cursor: isClickable ? 'pointer' : 'default',
// //                                         backgroundColor: isWeekSelected ? 'rgba(128, 0, 0, 0.08)' : 'white',
// //                                         boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
// //                                         p: 2,
// //                                         borderLeft: `4px solid ${progressColor}`,
// //                                         ...(isLast && (!isExpanded || viewMode !== 'receiptDetail') && {
// //                                             borderBottomLeftRadius: '16px',
// //                                             borderBottomRightRadius: '16px',
// //                                         }),
// //                                         '&:hover': isClickable ? {
// //                                             boxShadow: '0 2px 6px rgba(128, 0, 0, 0.15)',
// //                                             backgroundColor: isWeekSelected
// //                                                 ? 'rgba(128, 0, 0, 0.12)'
// //                                                 : 'rgba(128, 0, 0, 0.04)',
// //                                         } : {}
// //                                     }}
// //                                 >
// //                                     <Box sx={{ display: 'flex', alignItems: 'center' }}>
// //                                         {viewMode === 'receiptDetail' && (
// //                                             <IconButton
// //                                                 size="small"
// //                                                 onClick={(e) => {
// //                                                     e.stopPropagation();
// //                                                     toggleWeek(week.weekNumber);
// //                                                 }}
// //                                                 sx={{
// //                                                     color: progressColor,
// //                                                     backgroundColor: `${progressColor}15`,
// //                                                     mr: 2,
// //                                                     '&:hover': {
// //                                                         backgroundColor: `${progressColor}25`,
// //                                                     }
// //                                                 }}
// //                                             >
// //                                                 {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
// //                                             </IconButton>
// //                                         )}
// //
// //                                         <Box sx={{ flex: '0 0 31%', ml: viewMode === 'week' ? 6 : 0 }}>
// //                                             <Typography sx={{
// //                                                 color: maroonColor,
// //                                                 fontWeight: 600,
// //                                                 fontSize: '0.9rem'
// //                                             }}>
// //                                                 {week.weekLabel}
// //                                             </Typography>
// //                                             <Typography variant="caption" sx={{ color: 'text.secondary' }}>
// //                                                 {format(week.startDate, 'MMM d')} - {format(week.endDate, 'MMM d, yyyy')} • {week.receipts.length} receipt{week.receipts.length !== 1 ? 's' : ''}
// //                                             </Typography>
// //                                         </Box>
// //
// //                                         <Typography sx={{ flex: '0 0 18%', textAlign: 'right', fontWeight: 500 }}>
// //                                             ${week.budgetAmount.toFixed(2)}
// //                                         </Typography>
// //
// //                                         <Typography sx={{ flex: '0 0 18%', textAlign: 'right', fontWeight: 500 }}>
// //                                             ${week.actualSpent.toFixed(2)}
// //                                         </Typography>
// //
// //                                         <Typography sx={{
// //                                             flex: '0 0 18%',
// //                                             textAlign: 'right',
// //                                             fontWeight: 600,
// //                                             color: week.remaining >= 0 ? '#059669' : '#dc2626'
// //                                         }}>
// //                                             ${Math.abs(week.remaining).toFixed(2)}
// //                                             <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
// //                                                 {week.remaining >= 0 ? 'under' : 'over'}
// //                                             </Typography>
// //                                         </Typography>
// //
// //                                         <Box sx={{ flex: '0 0 11%', pl: 2 }}>
// //                                             <Tooltip title={`${week.percentUsed.toFixed(1)}% used`}>
// //                                                 <Box>
// //                                                     <LinearProgress
// //                                                         variant="determinate"
// //                                                         value={Math.min(week.percentUsed, 100)}
// //                                                         sx={{
// //                                                             height: 8,
// //                                                             borderRadius: 4,
// //                                                             backgroundColor: `${progressColor}20`,
// //                                                             '& .MuiLinearProgress-bar': {
// //                                                                 backgroundColor: progressColor,
// //                                                                 borderRadius: 4
// //                                                             }
// //                                                         }}
// //                                                     />
// //                                                 </Box>
// //                                             </Tooltip>
// //                                         </Box>
// //                                     </Box>
// //                                 </Box>
// //
// //                                 {/* Expanded Receipts - Only in receiptDetail mode */}
// //                                 {viewMode === 'receiptDetail' && isExpanded && week.receipts.length > 0 && (
// //                                     <Box sx={{
// //                                         maxHeight: '330px',
// //                                         overflowY: 'auto',
// //                                         backgroundColor: '#fafafa',
// //                                         ...(isLast && {
// //                                             borderBottomLeftRadius: '16px',
// //                                             borderBottomRightRadius: '16px',
// //                                         }),
// //                                         '&::-webkit-scrollbar': {
// //                                             width: '8px',
// //                                         },
// //                                         '&::-webkit-scrollbar-track': {
// //                                             backgroundColor: 'rgba(0,0,0,0.05)',
// //                                         },
// //                                         '&::-webkit-scrollbar-thumb': {
// //                                             backgroundColor: progressColor,
// //                                             borderRadius: '4px',
// //                                             '&:hover': {
// //                                                 backgroundColor: `${progressColor}dd`,
// //                                             },
// //                                         },
// //                                     }}>
// //                                         <Table sx={{ tableLayout: 'fixed' }}>
// //                                             <TableBody>
// //                                                 {week.receipts.map((receipt) => (
// //                                                     <TableRow
// //                                                         key={receipt.id}
// //                                                         onClick={() => handleReceiptClick(receipt)}
// //                                                         sx={{
// //                                                             cursor: 'pointer',
// //                                                             backgroundColor: selectedReceiptId === receipt.id ? 'rgba(128, 0, 0, 0.08)' : 'transparent',
// //                                                             '&:hover': {
// //                                                                 backgroundColor: selectedReceiptId === receipt.id
// //                                                                     ? 'rgba(128, 0, 0, 0.12)'
// //                                                                     : 'rgba(128, 0, 0, 0.04)',
// //                                                             }
// //                                                         }}
// //                                                     >
// //                                                         <TableCell sx={{ width: '35%', pl: 8 }}>
// //                                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
// //                                                                 <ReceiptIcon sx={{ fontSize: 18, color: tealColor }} />
// //                                                                 <Box>
// //                                                                     <Typography variant="body2" fontWeight={500}>
// //                                                                         {receipt.storeName}
// //                                                                     </Typography>
// //                                                                     <Typography variant="caption" color="text.secondary">
// //                                                                         {format(parseISO(receipt.purchaseDate), 'MMM d, yyyy')} • {receipt.itemCount} item{receipt.itemCount !== 1 ? 's' : ''}
// //                                                                     </Typography>
// //                                                                 </Box>
// //                                                             </Box>
// //                                                         </TableCell>
// //                                                         <TableCell align="right" sx={{ width: '18%' }}>
// //                                                             <Typography variant="body2" color="text.secondary">—</Typography>
// //                                                         </TableCell>
// //                                                         <TableCell align="right" sx={{ width: '18%' }}>
// //                                                             <Typography variant="body2" fontWeight={600}>
// //                                                                 ${receipt.totalCost.toFixed(2)}
// //                                                             </Typography>
// //                                                         </TableCell>
// //                                                         <TableCell align="right" sx={{ width: '18%' }}>
// //                                                             <Typography variant="body2" color="text.secondary">—</Typography>
// //                                                         </TableCell>
// //                                                         <TableCell sx={{ width: '11%' }}></TableCell>
// //                                                     </TableRow>
// //                                                 ))}
// //                                             </TableBody>
// //                                         </Table>
// //                                     </Box>
// //                                 )}
// //
// //                                 {viewMode === 'receiptDetail' && isExpanded && week.receipts.length === 0 && (
// //                                     <Box sx={{
// //                                         p: 3,
// //                                         textAlign: 'center',
// //                                         color: 'text.secondary',
// //                                         fontStyle: 'italic',
// //                                         backgroundColor: '#fafafa',
// //                                         ...(isLast && {
// //                                             borderBottomLeftRadius: '16px',
// //                                             borderBottomRightRadius: '16px',
// //                                         })
// //                                     }}>
// //                                         No receipts for this week
// //                                     </Box>
// //                                 )}
// //                             </Box>
// //                         );
// //                     })}
// //                 </Box>
// //             </Paper>
// //         </Box>
// //     );
// //     // return (
// //     //     <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
// //     //         {/* Header Summary Cards */}
// //     //         <Grid container spacing={3} sx={{ mb: 4 }}>
// //     //             <Grid item xs={12} md={3}>
// //     //                 <Card sx={{
// //     //                     background: `linear-gradient(135deg, ${tealColor} 0%, #14b8a6 100%)`,
// //     //                     color: 'white',
// //     //                     boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
// //     //                 }}>
// //     //                     <CardContent>
// //     //                         <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
// //     //                             <ShoppingCartIcon sx={{ mr: 1 }} />
// //     //                             <Typography variant="caption" sx={{ opacity: 0.9 }}>Total Budget</Typography>
// //     //                         </Box>
// //     //                         <Typography variant="h4" fontWeight="bold">
// //     //                             ${budget.budgetAmount.toFixed(2)}
// //     //                         </Typography>
// //     //                     </CardContent>
// //     //                 </Card>
// //     //             </Grid>
// //     //
// //     //             <Grid item xs={12} md={3}>
// //     //                 <Card sx={{
// //     //                     background: percentSpent > 90
// //     //                         ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
// //     //                         : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
// //     //                     color: 'white',
// //     //                     boxShadow: percentSpent > 90
// //     //                         ? '0 4px 12px rgba(220, 38, 38, 0.25)'
// //     //                         : '0 4px 12px rgba(37, 99, 235, 0.25)'
// //     //                 }}>
// //     //                     <CardContent>
// //     //                         <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
// //     //                             <TrendingUpIcon sx={{ mr: 1 }} />
// //     //                             <Typography variant="caption" sx={{ opacity: 0.9 }}>Total Spent</Typography>
// //     //                         </Box>
// //     //                         <Typography variant="h4" fontWeight="bold">
// //     //                             ${budget.totalSpent.toFixed(2)}
// //     //                         </Typography>
// //     //                         <Typography variant="caption" sx={{ opacity: 0.8 }}>
// //     //                             {percentSpent.toFixed(1)}% of budget
// //     //                         </Typography>
// //     //                     </CardContent>
// //     //                 </Card>
// //     //             </Grid>
// //     //
// //     //             <Grid item xs={12} md={3}>
// //     //                 <Card sx={{
// //     //                     background: remaining >= 0
// //     //                         ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
// //     //                         : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
// //     //                     color: 'white',
// //     //                     boxShadow: remaining >= 0
// //     //                         ? '0 4px 12px rgba(5, 150, 105, 0.25)'
// //     //                         : '0 4px 12px rgba(220, 38, 38, 0.25)'
// //     //                 }}>
// //     //                     <CardContent>
// //     //                         <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
// //     //                             {remaining >= 0 ? <TrendingDownIcon sx={{ mr: 1 }} /> : <TrendingUpIcon sx={{ mr: 1 }} />}
// //     //                             <Typography variant="caption" sx={{ opacity: 0.9 }}>Remaining</Typography>
// //     //                         </Box>
// //     //                         <Typography variant="h4" fontWeight="bold">
// //     //                             ${Math.abs(remaining).toFixed(2)}
// //     //                         </Typography>
// //     //                         <Typography variant="caption" sx={{ opacity: 0.8 }}>
// //     //                             {remaining >= 0 ? 'Under budget' : 'Over budget'}
// //     //                         </Typography>
// //     //                     </CardContent>
// //     //                 </Card>
// //     //             </Grid>
// //     //
// //     //             <Grid item xs={12} md={3}>
// //     //                 <Card sx={{
// //     //                     background: onTrackForSavings
// //     //                         ? 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)'
// //     //                         : 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
// //     //                     color: 'white',
// //     //                     boxShadow: onTrackForSavings
// //     //                         ? '0 4px 12px rgba(124, 58, 237, 0.25)'
// //     //                         : '0 4px 12px rgba(245, 158, 11, 0.25)'
// //     //                 }}>
// //     //                     <CardContent>
// //     //                         <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
// //     //                             <SavingsIcon sx={{ mr: 1 }} />
// //     //                             <Typography variant="caption" sx={{ opacity: 0.9 }}>Savings Goal</Typography>
// //     //                         </Box>
// //     //                         <Typography variant="h4" fontWeight="bold">
// //     //                             ${budget.savingsGoal.toFixed(2)}
// //     //                         </Typography>
// //     //                         <Typography variant="caption" sx={{ opacity: 0.8 }}>
// //     //                             {onTrackForSavings ? 'On track!' : 'Need to cut back'}
// //     //                         </Typography>
// //     //                     </CardContent>
// //     //                 </Card>
// //     //             </Grid>
// //     //         </Grid>
// //     //
// //     //         {/* View Mode Toggle */}
// //     //         <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
// //     //             <Chip
// //     //                 icon={<CalendarTodayIcon />}
// //     //                 label="By Week"
// //     //                 onClick={() => onViewModeChange('week')}
// //     //                 color={viewMode === 'week' ? 'primary' : 'default'}
// //     //                 sx={{
// //     //                     fontWeight: 600,
// //     //                     cursor: 'pointer',
// //     //                     ...(viewMode === 'week' && {
// //     //                         background: gradients.maroon,
// //     //                         color: 'white',
// //     //                         '&:hover': {
// //     //                             background: 'linear-gradient(135deg, #6b0000 0%, #900000 100%)',
// //     //                         }
// //     //                     })
// //     //                 }}
// //     //             />
// //     //             <Chip
// //     //                 icon={<ReceiptLongIcon />}
// //     //                 label="By Receipt Detail"
// //     //                 onClick={() => onViewModeChange('receiptDetail')}
// //     //                 color={viewMode === 'receiptDetail' ? 'primary' : 'default'}
// //     //                 sx={{
// //     //                     fontWeight: 600,
// //     //                     cursor: 'pointer',
// //     //                     ...(viewMode === 'receiptDetail' && {
// //     //                         background: gradients.maroon,
// //     //                         color: 'white',
// //     //                         '&:hover': {
// //     //                             background: 'linear-gradient(135deg, #6b0000 0%, #900000 100%)',
// //     //                         }
// //     //                     })
// //     //                 }}
// //     //             />
// //     //             <Chip
// //     //                 icon={<AssignmentIcon />}
// //     //                 label="By Grocery Budget"
// //     //                 onClick={() => onViewModeChange('budgetDetail')}
// //     //                 color={viewMode === 'budgetDetail' ? 'primary' : 'default'}
// //     //                 sx={{
// //     //                     fontWeight: 600,
// //     //                     cursor: 'pointer',
// //     //                     ...(viewMode === 'budgetDetail' && {
// //     //                         background: gradients.maroon,
// //     //                         color: 'white',
// //     //                         '&:hover': {
// //     //                             background: 'linear-gradient(135deg, #6b0000 0%, #900000 100%)',
// //     //                         }
// //     //                     })
// //     //                 }}
// //     //             />
// //     //         </Box>
// //     //
// //     //         {/* Main Table */}
// //     //         <Paper sx={{
// //     //             boxShadow: 3,
// //     //             borderRadius: 4,
// //     //             overflow: 'hidden',
// //     //             transition: 'box-shadow 0.3s ease-in-out',
// //     //             '&:hover': {
// //     //                 boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
// //     //             }
// //     //         }}>
// //     //             <Table sx={{ tableLayout: 'fixed' }}>
// //     //                 <TableHead>
// //     //                     <TableRow sx={{ backgroundColor: 'background.paper' }}>
// //     //                         <TableCell sx={{
// //     //                             fontWeight: 'bold',
// //     //                             color: maroonColor,
// //     //                             fontSize: '0.95rem',
// //     //                             width: '35%'
// //     //                         }}>
// //     //                             Week
// //     //                         </TableCell>
// //     //                         <TableCell align="right" sx={{
// //     //                             fontWeight: 'bold',
// //     //                             color: maroonColor,
// //     //                             fontSize: '0.95rem',
// //     //                             width: '18%'
// //     //                         }}>
// //     //                             Budgeted
// //     //                         </TableCell>
// //     //                         <TableCell align="right" sx={{
// //     //                             fontWeight: 'bold',
// //     //                             color: maroonColor,
// //     //                             fontSize: '0.95rem',
// //     //                             width: '18%'
// //     //                         }}>
// //     //                             Actual
// //     //                         </TableCell>
// //     //                         <TableCell align="right" sx={{
// //     //                             fontWeight: 'bold',
// //     //                             color: maroonColor,
// //     //                             fontSize: '0.95rem',
// //     //                             width: '18%'
// //     //                         }}>
// //     //                             Remaining
// //     //                         </TableCell>
// //     //                         <TableCell sx={{
// //     //                             fontWeight: 'bold',
// //     //                             color: maroonColor,
// //     //                             fontSize: '0.95rem',
// //     //                             width: '11%'
// //     //                         }}>
// //     //                             Progress
// //     //                         </TableCell>
// //     //                     </TableRow>
// //     //                 </TableHead>
// //     //             </Table>
// //     //
// //     //             <Box>
// //     //                 {weeklyData.map((week, index) => {
// //     //                     const isExpanded = expandedWeeks.has(week.weekNumber);
// //     //                     const isLast = index === weeklyData.length - 1;
// //     //                     const progressColor = getProgressColor(week.percentUsed);
// //     //                     const isWeekSelected = selectedWeekNumber === week.weekNumber;
// //     //
// //     //                     const isClickable = viewMode === 'receiptDetail' || viewMode === 'budgetDetail';
// //     //                     const handleRowClick = () => {
// //     //                         if (viewMode === 'receiptDetail') {
// //     //                             toggleWeek(week.weekNumber);
// //     //                         } else if (viewMode === 'budgetDetail') {
// //     //                             handleWeekClick(week);
// //     //                         }
// //     //                     };
// //     //
// //     //                     return (
// //     //                         <Box key={week.weekNumber} sx={{ mb: 0.5 }}>
// //     //                             <Box
// //     //                                 onClick={handleRowClick}
// //     //                                 sx={{
// //     //                                     cursor: isClickable ? 'pointer' : 'default',
// //     //                                     backgroundColor: isWeekSelected ? 'rgba(128, 0, 0, 0.08)' : 'white',
// //     //                                     boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
// //     //                                     p: 2,
// //     //                                     borderLeft: `4px solid ${progressColor}`,
// //     //                                     ...(isLast && (!isExpanded || viewMode !== 'receiptDetail') && {
// //     //                                         borderBottomLeftRadius: '16px',
// //     //                                         borderBottomRightRadius: '16px',
// //     //                                     }),
// //     //                                     '&:hover': isClickable ? {
// //     //                                         boxShadow: '0 2px 6px rgba(128, 0, 0, 0.15)',
// //     //                                         backgroundColor: isWeekSelected
// //     //                                             ? 'rgba(128, 0, 0, 0.12)'
// //     //                                             : 'rgba(128, 0, 0, 0.04)',
// //     //                                     } : {}
// //     //                                 }}
// //     //                             >
// //     //                                 <Box sx={{ display: 'flex', alignItems: 'center' }}>
// //     //                                     {viewMode === 'receiptDetail' && (
// //     //                                         <IconButton
// //     //                                             size="small"
// //     //                                             sx={{
// //     //                                                 color: progressColor,
// //     //                                                 backgroundColor: `${progressColor}15`,
// //     //                                                 mr: 2,
// //     //                                                 '&:hover': {
// //     //                                                     backgroundColor: `${progressColor}25`,
// //     //                                                 }
// //     //                                             }}
// //     //                                         >
// //     //                                             {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
// //     //                                         </IconButton>
// //     //                                     )}
// //     //
// //     //                                     <Box sx={{ flex: '0 0 31%', ml: viewMode === 'week' ? 6 : 0 }}>
// //     //                                         <Typography sx={{
// //     //                                             color: maroonColor,
// //     //                                             fontWeight: 600,
// //     //                                             fontSize: '0.9rem'
// //     //                                         }}>
// //     //                                             {week.weekLabel}
// //     //                                         </Typography>
// //     //                                         <Typography variant="caption" sx={{ color: 'text.secondary' }}>
// //     //                                             {format(week.startDate, 'MMM d')} - {format(week.endDate, 'MMM d, yyyy')} • {week.receipts.length} receipt{week.receipts.length !== 1 ? 's' : ''}
// //     //                                         </Typography>
// //     //                                     </Box>
// //     //
// //     //                                     <Typography sx={{ flex: '0 0 18%', textAlign: 'right', fontWeight: 500 }}>
// //     //                                         ${week.budgetAmount.toFixed(2)}
// //     //                                     </Typography>
// //     //
// //     //                                     <Typography sx={{ flex: '0 0 18%', textAlign: 'right', fontWeight: 500 }}>
// //     //                                         ${week.actualSpent.toFixed(2)}
// //     //                                     </Typography>
// //     //
// //     //                                     <Typography sx={{
// //     //                                         flex: '0 0 18%',
// //     //                                         textAlign: 'right',
// //     //                                         fontWeight: 600,
// //     //                                         color: week.remaining >= 0 ? '#059669' : '#dc2626'
// //     //                                     }}>
// //     //                                         ${Math.abs(week.remaining).toFixed(2)}
// //     //                                         <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
// //     //                                             {week.remaining >= 0 ? 'under' : 'over'}
// //     //                                         </Typography>
// //     //                                     </Typography>
// //     //
// //     //                                     <Box sx={{ flex: '0 0 11%', pl: 2 }}>
// //     //                                         <Tooltip title={`${week.percentUsed.toFixed(1)}% used`}>
// //     //                                             <Box>
// //     //                                                 <LinearProgress
// //     //                                                     variant="determinate"
// //     //                                                     value={Math.min(week.percentUsed, 100)}
// //     //                                                     sx={{
// //     //                                                         height: 8,
// //     //                                                         borderRadius: 4,
// //     //                                                         backgroundColor: `${progressColor}20`,
// //     //                                                         '& .MuiLinearProgress-bar': {
// //     //                                                             backgroundColor: progressColor,
// //     //                                                             borderRadius: 4
// //     //                                                         }
// //     //                                                     }}
// //     //                                                 />
// //     //                                             </Box>
// //     //                                         </Tooltip>
// //     //                                     </Box>
// //     //                                 </Box>
// //     //                             </Box>
// //     //
// //     //                             {viewMode === 'receiptDetail' && isExpanded && week.receipts.length > 0 && (
// //     //                                 <Box sx={{
// //     //                                     maxHeight: '330px',
// //     //                                     overflowY: 'auto',
// //     //                                     backgroundColor: '#fafafa',
// //     //                                     ...(isLast && {
// //     //                                         borderBottomLeftRadius: '16px',
// //     //                                         borderBottomRightRadius: '16px',
// //     //                                     }),
// //     //                                     '&::-webkit-scrollbar': {
// //     //                                         width: '8px',
// //     //                                     },
// //     //                                     '&::-webkit-scrollbar-track': {
// //     //                                         backgroundColor: 'rgba(0,0,0,0.05)',
// //     //                                     },
// //     //                                     '&::-webkit-scrollbar-thumb': {
// //     //                                         backgroundColor: progressColor,
// //     //                                         borderRadius: '4px',
// //     //                                         '&:hover': {
// //     //                                             backgroundColor: `${progressColor}dd`,
// //     //                                         },
// //     //                                     },
// //     //                                 }}>
// //     //                                     <Table sx={{ tableLayout: 'fixed' }}>
// //     //                                         <TableBody>
// //     //                                             {week.receipts.map((receipt) => (
// //     //                                                 <TableRow
// //     //                                                     key={receipt.id}
// //     //                                                     onClick={() => handleReceiptClick(receipt)}
// //     //                                                     sx={{
// //     //                                                         cursor: 'pointer',
// //     //                                                         backgroundColor: selectedReceiptId === receipt.id ? 'rgba(128, 0, 0, 0.08)' : 'transparent',
// //     //                                                         '&:hover': {
// //     //                                                             backgroundColor: selectedReceiptId === receipt.id
// //     //                                                                 ? 'rgba(128, 0, 0, 0.12)'
// //     //                                                                 : 'rgba(128, 0, 0, 0.04)',
// //     //                                                         }
// //     //                                                     }}
// //     //                                                 >
// //     //                                                     <TableCell sx={{ width: '35%', pl: 8 }}>
// //     //                                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
// //     //                                                             <ReceiptIcon sx={{ fontSize: 18, color: tealColor }} />
// //     //                                                             <Box>
// //     //                                                                 <Typography variant="body2" fontWeight={500}>
// //     //                                                                     {receipt.storeName}
// //     //                                                                 </Typography>
// //     //                                                                 <Typography variant="caption" color="text.secondary">
// //     //                                                                     {format(parseISO(receipt.purchaseDate), 'MMM d, yyyy')} • {receipt.itemCount} item{receipt.itemCount !== 1 ? 's' : ''}
// //     //                                                                 </Typography>
// //     //                                                             </Box>
// //     //                                                         </Box>
// //     //                                                     </TableCell>
// //     //                                                     <TableCell align="right" sx={{ width: '18%' }}>
// //     //                                                         <Typography variant="body2" color="text.secondary">—</Typography>
// //     //                                                     </TableCell>
// //     //                                                     <TableCell align="right" sx={{ width: '18%' }}>
// //     //                                                         <Typography variant="body2" fontWeight={600}>
// //     //                                                             ${receipt.totalCost.toFixed(2)}
// //     //                                                         </Typography>
// //     //                                                     </TableCell>
// //     //                                                     <TableCell align="right" sx={{ width: '18%' }}>
// //     //                                                         <Typography variant="body2" color="text.secondary">—</Typography>
// //     //                                                     </TableCell>
// //     //                                                     <TableCell sx={{ width: '11%' }}></TableCell>
// //     //                                                 </TableRow>
// //     //                                             ))}
// //     //                                         </TableBody>
// //     //                                     </Table>
// //     //                                 </Box>
// //     //                             )}
// //     //
// //     //                             {viewMode === 'receiptDetail' && isExpanded && week.receipts.length === 0 && (
// //     //                                 <Box sx={{
// //     //                                     p: 3,
// //     //                                     textAlign: 'center',
// //     //                                     color: 'text.secondary',
// //     //                                     fontStyle: 'italic',
// //     //                                     backgroundColor: '#fafafa',
// //     //                                     ...(isLast && {
// //     //                                         borderBottomLeftRadius: '16px',
// //     //                                         borderBottomRightRadius: '16px',
// //     //                                     })
// //     //                                 }}>
// //     //                                     No receipts for this week
// //     //                                 </Box>
// //     //                             )}
// //     //                         </Box>
// //     //                     );
// //     //                 })}
// //     //             </Box>
// //     //         </Paper>
// //     //     </Box>
// //     // );
// //     //
// //     //
// //
// // };
// //
// // export default GroceryBudgetTable;