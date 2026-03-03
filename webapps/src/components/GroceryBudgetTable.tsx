import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    LinearProgress,
    Grid,
    Stack,
    alpha,
    Collapse,
} from '@mui/material';
import {
    startOfWeek, endOfWeek, format, parseISO,
    isWithinInterval, addWeeks, differenceInWeeks,
} from 'date-fns';
import {
    PieChart as PieChartIcon,
    TrendingUp, TrendingDown, PiggyBank,
    Calendar, Receipt, Store,
    ChevronDown, ChevronUp, Lightbulb,
    CheckSquare, ShoppingCart, Target,
    Zap, BarChart2, LayoutGrid,
} from 'lucide-react';
import { PieChart, Pie, Cell, Sector, ResponsiveContainer } from 'recharts';
import { GroceryBudgetWithTotals, GroceryItem } from '../config/Types';
import { ViewMode } from './GroceryTracker';

// ── Tokens ─────────────────────────────────────────────────────────────────────
const MAROON      = '#6b1a1a';
const MAROON_DARK = '#4a1010';
const TEAL        = '#0d9488';
const GREEN       = '#059669';
const SLATE       = '#64748b';
const NAVY        = '#1e293b';
const AMBER       = '#d97706';
const RED         = '#dc2626';
const BLUE        = '#2563eb';
const PURPLE      = '#7c3aed';
const PALETTE     = [TEAL, BLUE, PURPLE, AMBER, GREEN, '#e11d48', '#0891b2', '#65a30d'];

// ── Active donut slice ─────────────────────────────────────────────────────────
const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    return (
        <g>
            <text x={cx} y={cy - 12} textAnchor="middle" fill={NAVY} style={{ fontSize: 11, fontWeight: 800 }}>
                {payload.name.length > 14 ? payload.name.slice(0, 13) + '…' : payload.name}
            </text>
            <text x={cx} y={cy + 6} textAnchor="middle" fill={fill} style={{ fontSize: 14, fontWeight: 900 }}>
                ${typeof value === 'number' ? value.toFixed(2) : value}
            </text>
            <text x={cx} y={cy + 23} textAnchor="middle" fill={SLATE} style={{ fontSize: 9, fontWeight: 600 }}>
                {(percent * 100).toFixed(1)}%
            </text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6}
                    startAngle={startAngle} endAngle={endAngle} fill={fill} />
            <Sector cx={cx} cy={cy} innerRadius={outerRadius + 9} outerRadius={outerRadius + 12}
                    startAngle={startAngle} endAngle={endAngle} fill={fill} />
        </g>
    );
};

// ── Donut center label ─────────────────────────────────────────────────────────
const DonutCenter = ({ cx, cy, primary, secondary }: {
    cx: number; cy: number; primary: string; secondary: string;
}) => (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
        <tspan x={cx} dy="-8"  fontSize="13" fontWeight="800" fill={NAVY}>{primary}</tspan>
        <tspan x={cx} dy="18"  fontSize="9"  fontWeight="600" fill={SLATE}>{secondary}</tspan>
    </text>
);

// ── Mini progress donut (left column) ─────────────────────────────────────────
const MiniDonut: React.FC<{ spent: number; budget: number; size?: number }> = ({
                                                                                   spent, budget, size = 72,
                                                                               }) => {
    const pct   = Math.min((spent / budget) * 100, 100);
    const color = pct > 100 ? RED : pct > 80 ? AMBER : GREEN;
    const c     = size / 2 - 1;
    const data  = [
        { value: spent,                    color },
        { value: Math.max(budget - spent, 0), color: alpha('#000', 0.07) },
    ];
    return (
        <ResponsiveContainer width={size} height={size}>
            <PieChart>
                <Pie data={data} cx={c} cy={c}
                     innerRadius={size * 0.29} outerRadius={size * 0.41}
                     startAngle={90} endAngle={-270} paddingAngle={2}
                     dataKey="value" strokeWidth={0}>
                    {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <DonutCenter cx={c} cy={c} primary={`${pct.toFixed(0)}%`} secondary="used" />
            </PieChart>
        </ResponsiveContainer>
    );
};

// ── Stat tile ──────────────────────────────────────────────────────────────────
const StatTile: React.FC<{
    label: string; value: string; sub?: string;
    color: string; icon?: React.ReactNode;
}> = ({ label, value, sub, color, icon }) => (
    <Box sx={{
        p: 1.5, textAlign: 'center', borderRadius: '10px',
        background: alpha(color, 0.06), border: `1px solid ${alpha(color, 0.18)}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2,
    }}>
        {icon && <Box sx={{ color, mb: 0.2 }}>{icon}</Box>}
        <Typography sx={{
            fontSize: '0.57rem', textTransform: 'uppercase',
            letterSpacing: '0.08em', color: alpha(color, 0.7), fontWeight: 700,
        }}>{label}</Typography>
        <Typography sx={{
            fontSize: '1rem', fontWeight: 900, color,
            fontVariantNumeric: 'tabular-nums', lineHeight: 1,
        }}>{value}</Typography>
        {sub && <Typography sx={{ fontSize: '0.57rem', color: SLATE }}>{sub}</Typography>}
    </Box>
);

// ── Section header ─────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({
                                                                                                 icon, title, subtitle,
                                                                                             }) => (
    <Box sx={{
        background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 50%, #5a1515 100%)`,
        px: 3, py: 2, position: 'relative', overflow: 'hidden',
    }}>
        <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80,
            borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative' }}>
            <Box sx={{
                width: 30, height: 30, borderRadius: '8px',
                bgcolor: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>{icon}</Box>
            <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>
                    {title}
                </Typography>
                <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>
                    {subtitle}
                </Typography>
            </Box>
        </Box>
    </Box>
);

// ── Chart ↔ Stats toggle pill ──────────────────────────────────────────────────
const ViewToggle: React.FC<{ showChart: boolean; onToggle: (e: React.MouseEvent) => void }> = ({
                                                                                                   showChart, onToggle,
                                                                                               }) => (
    <Box onClick={onToggle} sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.6,
        px: 1.1, py: 0.45, borderRadius: '6px', cursor: 'pointer',
        border: `1px solid ${alpha(NAVY, 0.12)}`, bgcolor: '#fff',
        transition: 'all 0.15s',
        '&:hover': { bgcolor: alpha(NAVY, 0.04), borderColor: alpha(NAVY, 0.22) },
    }}>
        {showChart
            ? <LayoutGrid size={11} color={SLATE} />
            : <PieChartIcon size={11} color={SLATE} />
        }
        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: SLATE, letterSpacing: '0.04em' }}>
            {showChart ? 'Stats' : 'Chart'}
        </Typography>
    </Box>
);

// ── Types ──────────────────────────────────────────────────────────────────────
interface GroceryBudgetTableProps {
    budget?: GroceryBudgetWithTotals;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    onReceiptSelect?: (receipt: ReceiptSummary) => void;
    onWeekSelect?: (week: WeekData) => void;
}

export interface ReceiptSummary {
    id: string; storeName: string; purchaseDate: string;
    itemCount: number; totalCost: number; items: GroceryItem[];
    weekNumber: number; weekLabel: string;
}

export interface WeekData {
    weekNumber: number; weekLabel: string;
    startDate: Date; endDate: Date;
    budgetAmount: number; actualSpent: number;
    remaining: number; percentUsed: number;
    receipts: ReceiptSummary[];
}

interface GroceryListAnalytics {
    plannedItemsCount: number; plannedTotal: number;
    purchasedFromList: number; purchasedFromListCount: number;
    unplannedPurchases: number; unplannedPurchasesCount: number;
    adherenceRate: number; savingsFromList: number;
}

// ══════════════════════════════════════════════════════════════════════════════
const GroceryBudgetTable: React.FC<GroceryBudgetTableProps> = ({
                                                                   budget, viewMode, onReceiptSelect, onWeekSelect, onViewModeChange,
                                                               }) => {
    const [expandedWeeks,     setExpandedWeeks]     = useState(new Set([1]));
    const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
    const [selectedWeekNumber,setSelectedWeekNumber]= useState<number | null>(null);
    // per-week donut hover
    const [activeDonutIdx,   setActiveDonutIdx]     = useState<Record<number, number | undefined>>({});
    // per-week chart(true) vs stats(false) — default chart
    const [showChartMap,     setShowChartMap]        = useState<Record<number, boolean>>({});

    // ── Data ───────────────────────────────────────────────────────────────────
    const weeklyData = useMemo((): WeekData[] => {
        if (!budget) return [];
        const startDate  = parseISO(budget.startDate);
        const endDate    = parseISO(budget.endDate);
        const totalWeeks = Math.ceil(differenceInWeeks(endDate, startDate)) + 1;
        const weeklyBudget = budget.budgetAmount / totalWeeks;

        const allItems: GroceryItem[] = [];
        budget.stores.forEach(s => s.items.forEach(it => allItems.push({ ...it, storeName: s.storeName })));

        return Array.from({ length: totalWeeks }, (_, i) => {
            const weekStart     = addWeeks(startDate, i);
            const weekEnd       = endOfWeek(weekStart, { weekStartsOn: 0 });
            const actualWeekEnd = weekEnd > endDate ? endDate : weekEnd;

            const weekItems = allItems.filter(it =>
                isWithinInterval(parseISO(it.datePurchased), { start: weekStart, end: actualWeekEnd })
            );

            const rmap = new Map<string, GroceryItem[]>();
            weekItems.forEach(it => {
                const k = `${it.storeName}|||${it.datePurchased}`;
                if (!rmap.has(k)) rmap.set(k, []);
                rmap.get(k)!.push(it);
            });

            const receipts: ReceiptSummary[] = Array.from(rmap.entries())
                .map(([k, items]) => {
                    const [storeName, purchaseDate] = k.split('|||');
                    return {
                        id: `w${i + 1}-${k}`, storeName, purchaseDate,
                        itemCount: items.length,
                        totalCost: items.reduce((s, x) => s + x.itemCost, 0),
                        items: [...items].sort((a, b) => a.itemName.localeCompare(b.itemName)),
                        weekNumber: i + 1, weekLabel: `Week ${i + 1}`,
                    };
                }).sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate));

            const actualSpent = weekItems.reduce((s, it) => s + it.itemCost, 0);
            return {
                weekNumber: i + 1, weekLabel: `Week ${i + 1}`,
                startDate: weekStart, endDate: actualWeekEnd,
                budgetAmount: weeklyBudget, actualSpent,
                remaining: weeklyBudget - actualSpent,
                percentUsed: (actualSpent / weeklyBudget) * 100,
                receipts,
            };
        });
    }, [budget]);

    const analyticsMap = useMemo((): Map<number, GroceryListAnalytics> => {
        const map = new Map<number, GroceryListAnalytics>();
        if (!budget?.plannedItems) return map;
        weeklyData.forEach(week => {
            const items       = week.receipts.flatMap(r => r.items);
            const pNames      = new Set(budget.plannedItems.map(p => p.itemName.toLowerCase()));
            const fromList    = items.filter(it => pNames.has(it.itemName.toLowerCase()));
            const unplanned   = items.filter(it => !pNames.has(it.itemName.toLowerCase()));
            let savings = 0;
            fromList.forEach(p => {
                const pl = budget.plannedItems.find(pi =>
                    pi.itemName.toLowerCase() === p.itemName.toLowerCase()
                );
                if (pl) savings += pl.estimatedCost - p.itemCost;
            });
            map.set(week.weekNumber, {
                plannedItemsCount:       budget.plannedItems.length,
                plannedTotal:            budget.plannedItems.reduce((s, p) => s + p.estimatedCost, 0),
                purchasedFromList:       fromList.reduce((s, it) => s + it.itemCost, 0),
                purchasedFromListCount:  fromList.length,
                unplannedPurchases:      unplanned.reduce((s, it) => s + it.itemCost, 0),
                unplannedPurchasesCount: unplanned.length,
                adherenceRate:           items.length > 0 ? (fromList.length / items.length) * 100 : 0,
                savingsFromList:         savings,
            });
        });
        return map;
    }, [budget, weeklyData]);

    const totalWeeklySavings = useMemo(
        () => weeklyData.reduce((t, w) => t + (w.remaining > 0 ? w.remaining : 0), 0),
        [weeklyData]
    );
    const totalWeeksOver  = useMemo(() => weeklyData.filter(w => w.remaining < 0).length, [weeklyData]);
    const totalWeeksUnder = useMemo(() => weeklyData.filter(w => w.remaining > 0).length, [weeklyData]);

    if (!budget) return null;

    const fmt              = (n: number) => `$${Math.abs(n).toFixed(2)}`;
    const getProgressColor = (pct: number) => pct > 100 ? RED : pct > 80 ? AMBER : GREEN;

    const toggleWeek = (n: number) => setExpandedWeeks(prev => {
        const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s;
    });

    const toggleChart = (weekNumber: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setShowChartMap(prev => ({ ...prev, [weekNumber]: !(prev[weekNumber] ?? true) }));
    };

    const handleReceiptClick = (r: ReceiptSummary) => {
        setSelectedReceiptId(r.id); onReceiptSelect?.(r);
    };

    // ════════════════════════════════════════════════════════════════════════
    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>

            {/* ─────────────────────────────────────────────────────────────
                SAVINGS OVERVIEW  — three clean stat cards, nothing else
            ───────────────────────────────────────────────────────────── */}
            <Box sx={{
                borderRadius: '16px', overflow: 'hidden', mb: 3,
                border: `1px solid ${alpha(MAROON, 0.14)}`,
                boxShadow: `0 4px 20px ${alpha(MAROON, 0.08)}`,
            }}>
                <SectionHeader
                    icon={<PiggyBank size={15} color="white" />}
                    title="Savings Overview"
                    subtitle="Budget period performance at a glance"
                />
                <Box sx={{ bgcolor: '#fff', p: 3 }}>
                    <Grid container spacing={2} alignItems="stretch">

                        {/* Total saved */}
                        <Grid item xs={12} md={4}>
                            <Box sx={{
                                p: 2.5, borderRadius: '12px', height: '100%',
                                border: `1px solid ${alpha(totalWeeklySavings > 0 ? GREEN : SLATE, 0.18)}`,
                                bgcolor: alpha(totalWeeklySavings > 0 ? GREEN : SLATE, 0.04),
                            }}>
                                <Typography sx={{
                                    fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase',
                                    letterSpacing: '0.1em', mb: 1,
                                    color: alpha(totalWeeklySavings > 0 ? GREEN : SLATE, 0.65),
                                }}>
                                    Total Weekly Savings
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.6 }}>
                                    <Box sx={{
                                        p: 1, borderRadius: '8px', flexShrink: 0,
                                        bgcolor: alpha(totalWeeklySavings > 0 ? GREEN : SLATE, 0.1),
                                    }}>
                                        <PiggyBank size={20} color={totalWeeklySavings > 0 ? GREEN : SLATE} />
                                    </Box>
                                    <Typography sx={{
                                        fontSize: '2rem', fontWeight: 900, lineHeight: 1,
                                        fontVariantNumeric: 'tabular-nums',
                                        color: totalWeeklySavings > 0 ? GREEN : SLATE,
                                    }}>
                                        {fmt(totalWeeklySavings)}
                                    </Typography>
                                </Box>
                                <Typography sx={{
                                    fontSize: '0.7rem', fontWeight: 600,
                                    color: alpha(totalWeeklySavings > 0 ? GREEN : SLATE, 0.65),
                                }}>
                                    {totalWeeklySavings > 0
                                        ? `Saved across ${totalWeeksUnder} week${totalWeeksUnder !== 1 ? 's' : ''}`
                                        : 'No savings accumulated yet'}
                                </Typography>
                            </Box>
                        </Grid>

                        {/* Weeks under */}
                        <Grid item xs={6} md={4}>
                            <Box sx={{
                                p: 2.5, borderRadius: '12px', height: '100%',
                                border: `1px solid ${alpha(GREEN, 0.18)}`,
                                bgcolor: alpha(GREEN, 0.04),
                            }}>
                                <Typography sx={{
                                    fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase',
                                    letterSpacing: '0.1em', color: alpha(GREEN, 0.65), mb: 1,
                                }}>
                                    Weeks Under Budget
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.6 }}>
                                    <Box sx={{ p: 1, borderRadius: '8px', bgcolor: alpha(GREEN, 0.1), flexShrink: 0 }}>
                                        <TrendingDown size={20} color={GREEN} />
                                    </Box>
                                    <Typography sx={{ fontSize: '2.4rem', fontWeight: 900, color: GREEN, lineHeight: 1 }}>
                                        {totalWeeksUnder}
                                    </Typography>
                                </Box>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: alpha(GREEN, 0.65) }}>
                                    of {weeklyData.length} total week{weeklyData.length !== 1 ? 's' : ''}
                                </Typography>
                            </Box>
                        </Grid>

                        {/* Weeks over */}
                        <Grid item xs={6} md={4}>
                            <Box sx={{
                                p: 2.5, borderRadius: '12px', height: '100%',
                                border: `1px solid ${alpha(totalWeeksOver > 0 ? RED : SLATE, 0.18)}`,
                                bgcolor: alpha(totalWeeksOver > 0 ? RED : SLATE, 0.04),
                            }}>
                                <Typography sx={{
                                    fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase',
                                    letterSpacing: '0.1em', mb: 1,
                                    color: alpha(totalWeeksOver > 0 ? RED : SLATE, 0.65),
                                }}>
                                    Weeks Over Budget
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.6 }}>
                                    <Box sx={{
                                        p: 1, borderRadius: '8px', flexShrink: 0,
                                        bgcolor: alpha(totalWeeksOver > 0 ? RED : SLATE, 0.1),
                                    }}>
                                        <TrendingUp size={20} color={totalWeeksOver > 0 ? RED : SLATE} />
                                    </Box>
                                    <Typography sx={{
                                        fontSize: '2.4rem', fontWeight: 900, lineHeight: 1,
                                        color: totalWeeksOver > 0 ? RED : SLATE,
                                    }}>
                                        {totalWeeksOver}
                                    </Typography>
                                </Box>
                                <Typography sx={{
                                    fontSize: '0.7rem', fontWeight: 600,
                                    color: alpha(totalWeeksOver > 0 ? RED : SLATE, 0.65),
                                }}>
                                    {totalWeeksOver === 0 ? 'Perfect streak! 🎉' : `of ${weeklyData.length} total weeks`}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            {/* ── View Mode Toggle ─────────────────────────────────────────────── */}
            <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {([
                    { mode: 'week'          as ViewMode, label: 'By Week',      icon: <Calendar size={13} /> },
                    { mode: 'receiptDetail' as ViewMode, label: 'By Receipt',   icon: <Receipt size={13} /> },
                    { mode: 'groceryList'   as ViewMode, label: 'Grocery List', icon: <CheckSquare size={13} /> },
                    { mode: 'analytics'     as ViewMode, label: 'Analytics',    icon: <PieChartIcon size={13} /> },
                ]).map(({ mode, label, icon }) => {
                    const active = viewMode === mode;
                    return (
                        <Box key={mode} onClick={() => onViewModeChange(mode)} sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.75,
                            px: 1.75, py: 0.7, borderRadius: '8px', cursor: 'pointer',
                            border: `1px solid ${active ? alpha(MAROON, 0.6) : alpha('#000', 0.1)}`,
                            background: active
                                ? `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 100%)`
                                : '#fff',
                            color: active ? '#fff' : SLATE,
                            transition: 'all 0.18s ease',
                            boxShadow: active
                                ? `0 2px 8px ${alpha(MAROON, 0.25)}`
                                : '0 1px 3px rgba(0,0,0,0.06)',
                            '&:hover': {
                                background: active
                                    ? `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 100%)`
                                    : alpha(MAROON, 0.05),
                                borderColor: alpha(MAROON, 0.35),
                                color: active ? '#fff' : MAROON,
                            },
                        }}>
                            {icon}
                            <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', lineHeight: 1 }}>
                                {label}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>

            {/* ─────────────────────────────────────────────────────────────
                WEEKLY CARDS
            ───────────────────────────────────────────────────────────── */}
            <Box sx={{
                borderRadius: '16px', overflow: 'hidden',
                border: `1px solid ${alpha(MAROON, 0.14)}`,
                boxShadow: `0 4px 20px ${alpha(MAROON, 0.08)}`,
            }}>
                <SectionHeader
                    icon={
                        viewMode === 'week'          ? <Calendar size={15} color="white" /> :
                            viewMode === 'receiptDetail' ? <Receipt size={15} color="white" /> :
                                viewMode === 'groceryList'   ? <CheckSquare size={15} color="white" /> :
                                    <PieChartIcon size={15} color="white" />
                    }
                    title={
                        viewMode === 'week'          ? 'Weekly Budget Breakdown' :
                            viewMode === 'receiptDetail' ? 'Receipt Detail View' :
                                viewMode === 'groceryList'   ? 'Grocery List Adherence' :
                                    'Spending Analytics'
                    }
                    subtitle='Use the "Chart / Stats" toggle on each card to switch views'
                />

                <Box sx={{ bgcolor: '#f0f2f5', p: 2.5 }}>
                    <Stack spacing={2}>
                        {weeklyData.map(week => {
                            const isExpanded     = expandedWeeks.has(week.weekNumber);
                            const progressColor  = getProgressColor(week.percentUsed);
                            const isWeekSelected = selectedWeekNumber === week.weekNumber;
                            const isClickable    = viewMode === 'receiptDetail';
                            const wa             = analyticsMap.get(week.weekNumber);
                            const activeIdx      = activeDonutIdx[week.weekNumber];
                            const showChart      = showChartMap[week.weekNumber] ?? true;

                            // ── Donut datasets ──────────────────────────────────────────
                            const budgetDonut = [
                                { name: 'Spent',     value: week.actualSpent,            color: progressColor },
                                { name: 'Remaining', value: Math.max(week.remaining, 0), color: alpha('#000', 0.07) },
                            ];

                            const storeDonut = week.receipts.map((r, i) => ({
                                name: r.storeName, value: r.totalCost, color: PALETTE[i % PALETTE.length],
                            }));

                            const listDonut = wa ? [
                                { name: 'On List',   value: wa.purchasedFromList,  color: GREEN },
                                { name: 'Unplanned', value: wa.unplannedPurchases, color: AMBER },
                            ] : [];

                            // pick the right donut per mode
                            const donutData =
                                viewMode === 'week'        ? budgetDonut :
                                    viewMode === 'groceryList' ? listDonut   :
                                        storeDonut;

                            const donutIdle = {
                                primary:
                                    viewMode === 'week'        ? `${week.percentUsed.toFixed(0)}%` :
                                        viewMode === 'groceryList' ? `${wa?.adherenceRate.toFixed(0) ?? 0}%` :
                                            String(storeDonut.length),
                                secondary:
                                    viewMode === 'week'        ? 'used'    :
                                        viewMode === 'groceryList' ? 'on list' :
                                            'stores',
                            };

                            // visible legend entries (skip the grey "remaining" slot)
                            const legendItems = donutData.filter(d => d.color !== alpha('#000', 0.07) && d.value > 0);

                            // ── Stats grid per mode ─────────────────────────────────────
                            const totalItems   = week.receipts.reduce((s, r) => s + r.itemCount, 0);
                            const avgPerItem   = totalItems > 0 ? week.actualSpent / totalItems : 0;
                            const storeCount   = new Set(week.receipts.map(r => r.storeName)).size;
                            const avgWeekSpend = weeklyData.reduce((s, w) => s + w.actualSpent, 0) / weeklyData.length;
                            const vsAvgPct     = avgWeekSpend > 0
                                ? ((week.actualSpent - avgWeekSpend) / avgWeekSpend) * 100
                                : 0;

                            const StatsGrid = () => {
                                if (viewMode === 'week') return (
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}><StatTile label="Budgeted" value={`$${week.budgetAmount.toFixed(2)}`} color={TEAL}  icon={<Target size={12} />} /></Grid>
                                        <Grid item xs={6}><StatTile label="Spent"    value={`$${week.actualSpent.toFixed(2)}`}  color={week.percentUsed > 100 ? RED : week.percentUsed > 80 ? AMBER : NAVY} icon={<ShoppingCart size={12} />} /></Grid>
                                        <Grid item xs={6}><StatTile label="Remaining" value={fmt(week.remaining)} sub={week.remaining >= 0 ? 'under' : 'over'} color={week.remaining >= 0 ? GREEN : RED} icon={week.remaining >= 0 ? <PiggyBank size={12} /> : <Zap size={12} />} /></Grid>
                                        <Grid item xs={6}><StatTile label="Usage"    value={`${week.percentUsed.toFixed(0)}%`}  color={progressColor} icon={<BarChart2 size={12} />} /></Grid>
                                    </Grid>
                                );
                                if (viewMode === 'receiptDetail') return (
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}><StatTile label="Receipts"  value={String(week.receipts.length)} sub="trips" color={TEAL}   icon={<Receipt size={12} />} /></Grid>
                                        <Grid item xs={6}><StatTile label="Avg / Trip" value={`$${week.receipts.length > 0 ? (week.actualSpent / week.receipts.length).toFixed(2) : '0.00'}`} color={BLUE} /></Grid>
                                        <Grid item xs={6}><StatTile label="Stores"    value={String(storeCount)}           color={PURPLE} icon={<Store size={12} />} /></Grid>
                                        <Grid item xs={6}><StatTile label={week.remaining >= 0 ? 'Saved' : 'Over'} value={fmt(week.remaining)} color={week.remaining >= 0 ? GREEN : RED} icon={week.remaining >= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />} /></Grid>
                                    </Grid>
                                );
                                if (viewMode === 'groceryList' && wa) return (
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}><StatTile label="List Budget" value={`$${wa.plannedTotal.toFixed(2)}`}        color={PURPLE} icon={<Target size={12} />} /></Grid>
                                        <Grid item xs={6}><StatTile label="From List"   value={`$${wa.purchasedFromList.toFixed(2)}`}   color={GREEN}  icon={<CheckSquare size={12} />} /></Grid>
                                        <Grid item xs={6}><StatTile label="Unplanned"   value={`$${wa.unplannedPurchases.toFixed(2)}`}  sub={`${wa.unplannedPurchasesCount} items`} color={AMBER} icon={<Zap size={12} />} /></Grid>
                                        <Grid item xs={6}><StatTile label="Adherence"   value={`${wa.adherenceRate.toFixed(0)}%`}       color={TEAL}   icon={<BarChart2 size={12} />} /></Grid>
                                    </Grid>
                                );
                                // analytics
                                return (
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}><StatTile label="Items"    value={String(totalItems)}          sub="purchased" color={TEAL}   icon={<ShoppingCart size={12} />} /></Grid>
                                        <Grid item xs={6}><StatTile label="Avg/Item" value={`$${avgPerItem.toFixed(2)}`}                 color={PURPLE} icon={<BarChart2 size={12} />} /></Grid>
                                        <Grid item xs={6}><StatTile label="Stores"   value={String(storeCount)}          sub="visited"   color={AMBER}  icon={<Store size={12} />} /></Grid>
                                        <Grid item xs={6}><StatTile label="vs Avg"   value={`${vsAvgPct >= 0 ? '+' : ''}${vsAvgPct.toFixed(0)}%`} color={vsAvgPct > 20 ? RED : vsAvgPct < -20 ? GREEN : BLUE} /></Grid>
                                    </Grid>
                                );
                            };

                            return (
                                <Box key={week.weekNumber} sx={{
                                    borderRadius: '12px', overflow: 'hidden',
                                    border: `1px solid ${isWeekSelected ? alpha(MAROON, 0.45) : alpha('#000', 0.08)}`,
                                    boxShadow: isWeekSelected
                                        ? `0 4px 16px ${alpha(MAROON, 0.18)}`
                                        : '0 2px 8px rgba(0,0,0,0.06)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.11)', transform: 'translateY(-1px)' },
                                }}>

                                    {/* ── Card body ── */}
                                    <Box
                                        onClick={() => isClickable && toggleWeek(week.weekNumber)}
                                        sx={{
                                            cursor: isClickable ? 'pointer' : 'default',
                                            bgcolor: '#fff',
                                            borderBottom: `2px solid ${alpha(progressColor, 0.22)}`,
                                            p: 2.5,
                                        }}
                                    >
                                        <Grid container spacing={2} alignItems="center">

                                            {/* Left column: title + mini donut */}
                                            <Grid item xs={12} md={3}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
                                                    {viewMode === 'receiptDetail' && (
                                                        <Box
                                                            onClick={e => { e.stopPropagation(); toggleWeek(week.weekNumber); }}
                                                            sx={{
                                                                width: 26, height: 26, borderRadius: '6px', flexShrink: 0,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                cursor: 'pointer',
                                                                bgcolor: alpha(progressColor, 0.1), color: progressColor,
                                                                border: `1px solid ${alpha(progressColor, 0.22)}`,
                                                                '&:hover': { bgcolor: alpha(progressColor, 0.2) },
                                                            }}
                                                        >
                                                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                        </Box>
                                                    )}
                                                    <MiniDonut spent={week.actualSpent} budget={week.budgetAmount} />
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: NAVY, letterSpacing: '-0.01em' }}>
                                                            {week.weekLabel}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.67rem', color: SLATE, mt: 0.1 }}>
                                                            {format(week.startDate, 'MMM d')} – {format(week.endDate, 'MMM d')}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 0.6, mt: 0.55, flexWrap: 'wrap' }}>
                                                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.35, px: 0.65, py: 0.2, borderRadius: '5px', bgcolor: alpha(TEAL, 0.09), color: TEAL }}>
                                                                <Receipt size={9} />
                                                                <Typography sx={{ fontSize: '0.57rem', fontWeight: 700 }}>
                                                                    {week.receipts.length} receipt{week.receipts.length !== 1 ? 's' : ''}
                                                                </Typography>
                                                            </Box>
                                                            {(budget.plannedItems?.length ?? 0) > 0 && (
                                                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.35, px: 0.65, py: 0.2, borderRadius: '5px', bgcolor: alpha(PURPLE, 0.09), color: PURPLE }}>
                                                                    <CheckSquare size={9} />
                                                                    <Typography sx={{ fontSize: '0.57rem', fontWeight: 700 }}>List</Typography>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Grid>

                                            {/* Center column: chart OR stats with toggle */}
                                            <Grid item xs={12} md={7.5}>
                                                {/* Toggle — stopPropagation so it doesn't fire week expand */}
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                                    <ViewToggle showChart={showChart} onToggle={e => toggleChart(week.weekNumber, e)} />
                                                </Box>

                                                {showChart ? (
                                                    /* Chart view */
                                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                        <Box sx={{ flexShrink: 0 }}>
                                                            <ResponsiveContainer width={150} height={150}>
                                                                <PieChart>
                                                                    <Pie
                                                                        activeIndex={activeIdx ?? 0}
                                                                        activeShape={renderActiveShape}
                                                                        data={donutData.length > 0 ? donutData : [{ name: 'No data', value: 1, color: alpha('#000', 0.08) }]}
                                                                        cx={72} cy={72}
                                                                        innerRadius={44} outerRadius={62}
                                                                        paddingAngle={3} dataKey="value" strokeWidth={0}
                                                                        onMouseEnter={(_, i) => setActiveDonutIdx(p => ({ ...p, [week.weekNumber]: i }))}
                                                                        onMouseLeave={() => setActiveDonutIdx(p => ({ ...p, [week.weekNumber]: undefined }))}
                                                                    >
                                                                        {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                                                    </Pie>
                                                                    {activeIdx === undefined && (
                                                                        <DonutCenter cx={72} cy={72}
                                                                                     primary={donutIdle.primary}
                                                                                     secondary={donutIdle.secondary}
                                                                        />
                                                                    )}
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        </Box>

                                                        {/* Hoverable legend */}
                                                        <Box sx={{ flex: 1 }}>
                                                            {legendItems.map((d, i) => (
                                                                <Box
                                                                    key={i}
                                                                    onMouseEnter={() => setActiveDonutIdx(p => ({ ...p, [week.weekNumber]: i }))}
                                                                    onMouseLeave={() => setActiveDonutIdx(p => ({ ...p, [week.weekNumber]: undefined }))}
                                                                    sx={{
                                                                        display: 'flex', alignItems: 'center',
                                                                        justifyContent: 'space-between',
                                                                        mb: 0.75, px: 0.85, py: 0.55,
                                                                        borderRadius: '7px', cursor: 'default',
                                                                        bgcolor: activeIdx === i ? alpha(d.color, 0.07) : 'transparent',
                                                                        border: `1px solid ${activeIdx === i ? alpha(d.color, 0.25) : 'transparent'}`,
                                                                        transition: 'all 0.12s ease',
                                                                    }}
                                                                >
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                                                        <Box sx={{ width: 9, height: 9, borderRadius: '2px', bgcolor: d.color, flexShrink: 0 }} />
                                                                        <Typography sx={{
                                                                            fontSize: '0.68rem', fontWeight: activeIdx === i ? 700 : 500,
                                                                            color: activeIdx === i ? NAVY : SLATE,
                                                                        }}>{d.name}</Typography>
                                                                    </Box>
                                                                    <Typography sx={{
                                                                        fontSize: '0.7rem', fontWeight: 800,
                                                                        fontVariantNumeric: 'tabular-nums',
                                                                        color: activeIdx === i ? d.color : NAVY,
                                                                    }}>${d.value.toFixed(2)}</Typography>
                                                                </Box>
                                                            ))}

                                                            {/* Adherence bar for grocery list mode */}
                                                            {viewMode === 'groceryList' && wa && (
                                                                <Box sx={{ mt: 1, px: 0.5 }}>
                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.35 }}>
                                                                        <Typography sx={{ fontSize: '0.58rem', color: SLATE, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                                            Adherence
                                                                        </Typography>
                                                                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: wa.adherenceRate > 70 ? GREEN : AMBER }}>
                                                                            {wa.adherenceRate.toFixed(0)}%
                                                                        </Typography>
                                                                    </Box>
                                                                    <LinearProgress
                                                                        variant="determinate"
                                                                        value={Math.min(wa.adherenceRate, 100)}
                                                                        sx={{
                                                                            height: 5, borderRadius: 3,
                                                                            bgcolor: alpha(TEAL, 0.1),
                                                                            '& .MuiLinearProgress-bar': {
                                                                                bgcolor: wa.adherenceRate > 70 ? GREEN : AMBER,
                                                                                borderRadius: 3,
                                                                            },
                                                                        }}
                                                                    />
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                ) : (
                                                    /* Stats view */
                                                    <StatsGrid />
                                                )}
                                            </Grid>

                                            {/* Right column: saved / over badge */}
                                            <Grid item xs={12} md={1.5}>
                                                {week.remaining !== 0 && (
                                                    <Box sx={{
                                                        display: 'flex', flexDirection: 'column',
                                                        alignItems: 'center', justifyContent: 'center',
                                                        p: 1.5, borderRadius: '10px', textAlign: 'center',
                                                        border: `1px solid ${alpha(week.remaining >= 0 ? GREEN : RED, 0.22)}`,
                                                        bgcolor: alpha(week.remaining >= 0 ? GREEN : RED, 0.04),
                                                    }}>
                                                        {week.remaining >= 0
                                                            ? <PiggyBank size={18} color={GREEN} />
                                                            : <TrendingUp size={18} color={RED} />
                                                        }
                                                        <Typography sx={{
                                                            fontSize: '0.5rem', textTransform: 'uppercase',
                                                            letterSpacing: '0.06em', fontWeight: 800, mt: 0.5,
                                                            color: week.remaining >= 0 ? GREEN : RED,
                                                        }}>
                                                            {week.remaining >= 0 ? 'SAVED' : 'OVER'}
                                                        </Typography>
                                                        <Typography sx={{
                                                            fontSize: '0.88rem', fontWeight: 900,
                                                            fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
                                                            color: week.remaining >= 0 ? GREEN : RED,
                                                        }}>
                                                            {fmt(week.remaining)}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Grid>
                                        </Grid>

                                        {/* Budget usage progress bar */}
                                        <Box sx={{ mt: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.35 }}>
                                                <Typography sx={{ fontSize: '0.58rem', color: SLATE, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                                    Budget Usage
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: progressColor }}>
                                                    {week.percentUsed.toFixed(1)}%
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.min(week.percentUsed, 100)}
                                                sx={{
                                                    height: 5, borderRadius: 3,
                                                    bgcolor: alpha(progressColor, 0.1),
                                                    '& .MuiLinearProgress-bar': { bgcolor: progressColor, borderRadius: 3 },
                                                }}
                                            />
                                        </Box>

                                        {/* Analytics insight strip */}
                                        {viewMode === 'analytics' && (() => {
                                            const isOver      = week.remaining < 0;
                                            const isHigh      = week.percentUsed > 90;
                                            const isIrregular = Math.abs(week.actualSpent - avgWeekSpend) > avgWeekSpend * 0.4;
                                            const manyTrips   = week.receipts.length > 4;
                                            if (!isOver && !isHigh && !isIrregular && !manyTrips) return null;
                                            const msg = isOver
                                                ? `${fmt(week.remaining)} over this week`
                                                : isHigh
                                                    ? `${week.percentUsed.toFixed(0)}% of weekly budget used`
                                                    : isIrregular
                                                        ? `${((Math.abs(week.actualSpent - avgWeekSpend) / avgWeekSpend) * 100).toFixed(0)}% from average spend`
                                                        : `${week.receipts.length} trips — consider consolidating`;
                                            return (
                                                <Box sx={{ mt: 1.5, p: 1.25, borderRadius: '8px', bgcolor: alpha(AMBER, 0.05), border: `1px solid ${alpha(AMBER, 0.2)}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{ p: 0.6, borderRadius: '6px', bgcolor: alpha(AMBER, 0.1), flexShrink: 0 }}>
                                                        <Lightbulb size={13} color={AMBER} />
                                                    </Box>
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 700, fontSize: '0.7rem', color: AMBER }}>
                                                            {isOver ? 'Over Budget' : isHigh ? 'High Usage' : isIrregular ? 'Irregular Spending' : 'Many Shopping Trips'}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.62rem', color: SLATE }}>{msg}</Typography>
                                                    </Box>
                                                </Box>
                                            );
                                        })()}
                                    </Box>

                                    {/* Expanded receipts (receipt detail mode only) */}
                                    {viewMode === 'receiptDetail' && (
                                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: `1px solid ${alpha('#000', 0.06)}` }}>
                                                {week.receipts.length > 0 ? (
                                                    <Grid container spacing={1.5}>
                                                        {week.receipts.map((receipt, ri) => (
                                                            <Grid item xs={12} sm={6} md={4} key={receipt.id}>
                                                                <Box
                                                                    onClick={() => handleReceiptClick(receipt)}
                                                                    sx={{
                                                                        p: 2, borderRadius: '10px', cursor: 'pointer', bgcolor: '#fff',
                                                                        border: `1px solid ${selectedReceiptId === receipt.id ? TEAL : alpha('#000', 0.08)}`,
                                                                        boxShadow: selectedReceiptId === receipt.id ? `0 0 0 2px ${alpha(TEAL, 0.18)}` : 'none',
                                                                        transition: 'all 0.18s ease',
                                                                        '&:hover': { borderColor: TEAL, boxShadow: `0 4px 12px ${alpha(TEAL, 0.14)}`, transform: 'translateY(-1px)' },
                                                                    }}
                                                                >
                                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mb: 1.5 }}>
                                                                        <Box sx={{ p: 0.9, borderRadius: '7px', bgcolor: alpha(PALETTE[ri % PALETTE.length], 0.1), flexShrink: 0 }}>
                                                                            <Store size={16} color={PALETTE[ri % PALETTE.length]} />
                                                                        </Box>
                                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                            <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: NAVY }}>{receipt.storeName}</Typography>
                                                                            <Typography sx={{ fontSize: '0.62rem', color: SLATE }}>{format(parseISO(receipt.purchaseDate), 'MMM d, yyyy')}</Typography>
                                                                        </Box>
                                                                        <Typography sx={{ fontSize: '1rem', fontWeight: 900, color: PALETTE[ri % PALETTE.length], fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                                                                            ${receipt.totalCost.toFixed(2)}
                                                                        </Typography>
                                                                    </Box>
                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                                                                        <Typography sx={{ fontSize: '0.58rem', color: SLATE, fontWeight: 600 }}>{receipt.itemCount} items</Typography>
                                                                        <Typography sx={{ fontSize: '0.58rem', color: SLATE }}>
                                                                            {week.actualSpent > 0 ? ((receipt.totalCost / week.actualSpent) * 100).toFixed(0) : 0}% of week
                                                                        </Typography>
                                                                    </Box>
                                                                    <LinearProgress
                                                                        variant="determinate"
                                                                        value={week.actualSpent > 0 ? (receipt.totalCost / week.actualSpent) * 100 : 0}
                                                                        sx={{
                                                                            height: 4, borderRadius: 2,
                                                                            bgcolor: alpha(PALETTE[ri % PALETTE.length], 0.1),
                                                                            '& .MuiLinearProgress-bar': { bgcolor: PALETTE[ri % PALETTE.length], borderRadius: 2 },
                                                                        }}
                                                                    />
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
//     Divider,
//     Skeleton,
// } from '@mui/material';
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import ExpandLessIcon from '@mui/icons-material/ExpandLess';
// import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
// import StoreIcon from '@mui/icons-material/Store';
// import TrendingUpIcon from '@mui/icons-material/TrendingUp';
// import TrendingDownIcon from '@mui/icons-material/TrendingDown';
// import SavingsIcon from '@mui/icons-material/Savings';
// import LightbulbIcon from '@mui/icons-material/Lightbulb';
// import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
// import { startOfWeek, endOfWeek, format, parseISO, isWithinInterval, addWeeks, differenceInWeeks } from 'date-fns';
// import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
// import ReceiptIcon from "@mui/icons-material/Receipt";
// import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
// import {
//     PieChart,
//     TrendingUp,
//     TrendingDown,
//     Minus,
//     PiggyBank,
//     Calendar,
//     Receipt,
//     ShoppingCart,
//     Store,
//     ChevronDown,
//     ChevronUp,
//     Lightbulb,
//     CheckSquare,
// } from 'lucide-react';
// import {GroceryBudgetWithTotals, GroceryItem} from "../config/Types";
// import {ViewMode} from "./GroceryTracker";
//
// // ── Design tokens — matching BudgetPage exactly ────────────────────────────────
// const MAROON      = '#6b1a1a';
// const MAROON_DARK = '#4a1010';
// const TEAL        = '#0d9488';
// const GREEN       = '#059669';
// const SLATE       = '#64748b';
// const NAVY        = '#1e293b';
//
// // Card themes from BudgetPage
// const CARD_THEMES = {
//     budget: {
//         base: '#f0f4ff', border: '#6b1a1a', valueColor: '#1e1e2e',
//         barColor: '#6b1a1a', chipBg: 'rgba(107,26,26,0.10)', chipColor: '#6b1a1a', labelColor: '#5a5a7a',
//     },
//     spent_ok: {
//         base: '#f0fdf4', border: '#16a34a', valueColor: '#14532d',
//         barColor: '#16a34a', chipBg: 'rgba(22,163,74,0.12)', chipColor: '#15803d', labelColor: '#4a7060',
//     },
//     spent_warn: {
//         base: '#fffbeb', border: '#d97706', valueColor: '#78350f',
//         barColor: '#d97706', chipBg: 'rgba(217,119,6,0.12)', chipColor: '#92400e', labelColor: '#7a6030',
//     },
//     spent_over: {
//         base: '#fff1f2', border: '#dc2626', valueColor: '#7f1d1d',
//         barColor: '#dc2626', chipBg: 'rgba(220,38,38,0.12)', chipColor: '#991b1b', labelColor: '#7a3030',
//     },
//     remaining_good: {
//         base: '#f0fdf4', border: '#16a34a', valueColor: '#14532d',
//         barColor: '#16a34a', chipBg: 'rgba(22,163,74,0.12)', chipColor: '#15803d', labelColor: '#4a7060',
//     },
//     remaining_bad: {
//         base: '#fff1f2', border: '#dc2626', valueColor: '#7f1d1d',
//         barColor: '#dc2626', chipBg: 'rgba(220,38,38,0.12)', chipColor: '#991b1b', labelColor: '#7a3030',
//     },
//     saved_good: {
//         base: '#f0f9ff', border: '#0284c7', valueColor: '#0c4a6e',
//         barColor: '#0284c7', chipBg: 'rgba(2,132,199,0.12)', chipColor: '#075985', labelColor: '#3a6070',
//     },
//     teal: {
//         base: '#f0fdfa', border: TEAL, valueColor: '#134e4a',
//         barColor: TEAL, chipBg: 'rgba(13,148,136,0.12)', chipColor: '#0f766e', labelColor: '#3a6060',
//     },
//     purple: {
//         base: '#faf5ff', border: '#7c3aed', valueColor: '#4c1d95',
//         barColor: '#7c3aed', chipBg: 'rgba(124,58,237,0.12)', chipColor: '#6d28d9', labelColor: '#5a4070',
//     },
//     amber: {
//         base: '#fffbeb', border: '#d97706', valueColor: '#78350f',
//         barColor: '#d97706', chipBg: 'rgba(217,119,6,0.12)', chipColor: '#92400e', labelColor: '#7a6030',
//     },
// };
//
// // ── Summary card component (matches BudgetPage card style) ─────────────────────
// const SummaryCard: React.FC<{
//     label: string;
//     value: string;
//     subLabel: string;
//     chipLabel: string;
//     chipIcon: React.ReactNode;
//     theme: keyof typeof CARD_THEMES;
//     barValue: number;
// }> = ({ label, value, subLabel, chipLabel: chipLbl, chipIcon, theme: themeKey, barValue }) => {
//     const t = CARD_THEMES[themeKey];
//     return (
//         <Box sx={{
//             background: t.base, borderRadius: '10px',
//             borderTop: `3px solid ${t.border}`,
//             boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
//             p: 2.5, height: '100%',
//             transition: 'box-shadow 0.2s',
//             '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' },
//         }}>
//             <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.labelColor, fontWeight: 700, mb: 1 }}>
//                 {label}
//             </Typography>
//             <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: t.valueColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1, mb: 0.5 }}>
//                 {value}
//             </Typography>
//             <LinearProgress
//                 variant="determinate"
//                 value={Math.min(barValue, 100)}
//                 sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(t.barColor, 0.15), '& .MuiLinearProgress-bar': { bgcolor: t.barColor, borderRadius: 2 } }}
//             />
//             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
//                 <Typography sx={{ fontSize: '0.72rem', color: t.labelColor }}>{subLabel}</Typography>
//                 <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: t.chipBg, color: t.chipColor, fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
//                     {chipIcon}
//                     {chipLbl}
//                 </Box>
//             </Box>
//         </Box>
//     );
// };
//
// // ── Mini stat tile used inside week cards ──────────────────────────────────────
// const StatTile: React.FC<{
//     label: string;
//     value: string;
//     sub?: string;
//     themeKey: keyof typeof CARD_THEMES;
// }> = ({ label, value, sub, themeKey }) => {
//     const t = CARD_THEMES[themeKey];
//     return (
//         <Box sx={{
//             p: 1.75, textAlign: 'center', borderRadius: '8px',
//             background: t.base,
//             border: `1px solid ${alpha(t.border, 0.2)}`,
//         }}>
//             <Typography sx={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: t.labelColor, fontWeight: 700, mb: 0.5 }}>
//                 {label}
//             </Typography>
//             <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: t.valueColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
//                 {value}
//             </Typography>
//             {sub && (
//                 <Typography sx={{ fontSize: '0.6rem', color: t.labelColor, mt: 0.25 }}>{sub}</Typography>
//             )}
//         </Box>
//     );
// };
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
//     const weeklyData = useMemo((): WeekData[] => {
//         if (!budget) return [];
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
//                 if (!receiptMap.has(receiptKey)) receiptMap.set(receiptKey, []);
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
//         return weeks;
//     }, [budget]);
//
//     const weeklyGroceryListAnalytics = useMemo((): Map<number, GroceryListAnalytics> => {
//         const analyticsMap = new Map<number, GroceryListAnalytics>();
//         if (!budget || !budget.plannedItems) return analyticsMap;
//
//         weeklyData.forEach(week => {
//             const weekItems = week.receipts.flatMap(r => r.items);
//             const plannedItemNames = new Set(budget.plannedItems.map(pi => pi.itemName.toLowerCase()));
//             const purchasedFromList = weekItems.filter(item => plannedItemNames.has(item.itemName.toLowerCase()));
//             const unplannedPurchases = weekItems.filter(item => !plannedItemNames.has(item.itemName.toLowerCase()));
//             const plannedTotal = budget.plannedItems.reduce((sum, item) => sum + item.estimatedCost, 0);
//             const purchasedFromListTotal = purchasedFromList.reduce((sum, item) => sum + item.itemCost, 0);
//             const unplannedTotal = unplannedPurchases.reduce((sum, item) => sum + item.itemCost, 0);
//             const adherenceRate = weekItems.length > 0 ? (purchasedFromList.length / weekItems.length) * 100 : 0;
//
//             let savingsFromList = 0;
//             purchasedFromList.forEach(purchased => {
//                 const planned = budget.plannedItems.find(pi => pi.itemName.toLowerCase() === purchased.itemName.toLowerCase());
//                 if (planned) savingsFromList += (planned.estimatedCost - purchased.itemCost);
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
//         return analyticsMap;
//     }, [budget, weeklyData]);
//
//     const totalWeeklySavings = useMemo(() => weeklyData.reduce((total, week) => total + (week.remaining > 0 ? week.remaining : 0), 0), [weeklyData]);
//     const totalWeeksOver = useMemo(() => weeklyData.filter(week => week.remaining < 0).length, [weeklyData]);
//     const totalWeeksUnder = useMemo(() => weeklyData.filter(week => week.remaining > 0).length, [weeklyData]);
//
//     const remaining = budget ? budget.budgetAmount - budget.totalSpent : 0;
//     const percentSpent = budget ? (budget.totalSpent / budget.budgetAmount) * 100 : 0;
//     const onTrackForSavings = budget ? remaining >= budget.savingsGoal : false;
//
//     if (!budget) return null;
//
//     const fmt = (n: number) => `$${Math.abs(n).toFixed(2)}`;
//
//     const toggleWeek = (weekNumber: number) => {
//         setExpandedWeeks(prev => {
//             const newSet = new Set(prev);
//             if (newSet.has(weekNumber)) newSet.delete(weekNumber);
//             else newSet.add(weekNumber);
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
//     const getProgressColor = (percent: number) => {
//         if (percent < 70) return GREEN;
//         if (percent < 90) return '#d97706';
//         return '#dc2626';
//     };
//
//     const spentThemeKey = (): keyof typeof CARD_THEMES => {
//         if (percentSpent > 100) return 'spent_over';
//         if (percentSpent > 80) return 'spent_warn';
//         return 'spent_ok';
//     };
//
//     // ── Section header (maroon gradient — matches BudgetPage section headers) ──
//     const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
//         <Box sx={{
//             background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 50%, #5a1515 100%)`,
//             px: 3, py: 2, position: 'relative', overflow: 'hidden',
//         }}>
//             <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
//             <Box sx={{ position: 'absolute', bottom: -20, right: 50, width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative' }}>
//                 <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                     {icon}
//                 </Box>
//                 <Box>
//                     <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>{title}</Typography>
//                     <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>{subtitle}</Typography>
//                 </Box>
//             </Box>
//         </Box>
//     );
//
//     return (
//         <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
//
//             {/* ── Savings Overview Section ───────────────────────────────────── */}
//             <Box sx={{
//                 borderRadius: '16px', overflow: 'hidden', mb: 3,
//                 border: `1px solid ${alpha(MAROON, 0.15)}`,
//                 boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}`,
//             }}>
//                 <SectionHeader
//                     icon={<PiggyBank size={15} color="white" />}
//                     title="Savings Overview"
//                     subtitle="Weekly savings performance breakdown"
//                 />
//                 <Box sx={{ bgcolor: '#fff', p: 3 }}>
//                     <Grid container spacing={2.5} alignItems="center">
//                         {/* Total weekly savings banner */}
//                         <Grid item xs={12} md={7}>
//                             <Box sx={{
//                                 p: 2.5, borderRadius: '10px',
//                                 background: totalWeeklySavings > 0
//                                     ? `linear-gradient(135deg, ${GREEN} 0%, #10b981 100%)`
//                                     : `linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)`,
//                                 color: '#fff', position: 'relative', overflow: 'hidden',
//                             }}>
//                                 <Box sx={{ position: 'absolute', top: -24, right: -24, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
//                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
//                                     <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                                         <PiggyBank size={28} />
//                                     </Box>
//                                     <Box>
//                                         <Typography sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.85, fontWeight: 700 }}>
//                                             Total Weekly Savings
//                                         </Typography>
//                                         <Typography sx={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
//                                             {fmt(totalWeeklySavings)}
//                                         </Typography>
//                                         {totalWeeklySavings > 0 && (
//                                             <Typography sx={{ fontSize: '0.75rem', opacity: 0.85, mt: 0.3 }}>
//                                                 Great job staying under budget! 🎉
//                                             </Typography>
//                                         )}
//                                     </Box>
//                                 </Box>
//                             </Box>
//                         </Grid>
//
//                         {/* Weeks under / over */}
//                         <Grid item xs={6} md={2.5}>
//                             <Box sx={{
//                                 p: 2, textAlign: 'center', borderRadius: '10px',
//                                 background: CARD_THEMES.remaining_good.base,
//                                 border: `1px solid ${alpha(CARD_THEMES.remaining_good.border, 0.25)}`,
//                             }}>
//                                 <Typography sx={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: CARD_THEMES.remaining_good.labelColor, fontWeight: 700, mb: 0.5 }}>
//                                     Weeks Under
//                                 </Typography>
//                                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
//                                     <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: CARD_THEMES.remaining_good.valueColor, lineHeight: 1 }}>
//                                         {totalWeeksUnder}
//                                     </Typography>
//                                     <TrendingDown size={20} color={CARD_THEMES.remaining_good.valueColor} />
//                                 </Box>
//                             </Box>
//                         </Grid>
//                         <Grid item xs={6} md={2.5}>
//                             <Box sx={{
//                                 p: 2, textAlign: 'center', borderRadius: '10px',
//                                 background: CARD_THEMES.remaining_bad.base,
//                                 border: `1px solid ${alpha(CARD_THEMES.remaining_bad.border, 0.25)}`,
//                             }}>
//                                 <Typography sx={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: CARD_THEMES.remaining_bad.labelColor, fontWeight: 700, mb: 0.5 }}>
//                                     Weeks Over
//                                 </Typography>
//                                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
//                                     <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: CARD_THEMES.remaining_bad.valueColor, lineHeight: 1 }}>
//                                         {totalWeeksOver}
//                                     </Typography>
//                                     <TrendingUp size={20} color={CARD_THEMES.remaining_bad.valueColor} />
//                                 </Box>
//                             </Box>
//                         </Grid>
//                     </Grid>
//                 </Box>
//             </Box>
//
//             {/* ── View Mode Toggle ────────────────────────────────────────────── */}
//             <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
//                 {([
//                     { mode: 'week' as ViewMode,          label: 'By Week',          icon: <Calendar size={13} /> },
//                     { mode: 'receiptDetail' as ViewMode, label: 'By Receipt',        icon: <Receipt size={13} /> },
//                     { mode: 'groceryList' as ViewMode,   label: 'Grocery List',      icon: <CheckSquare size={13} /> },
//                     { mode: 'analytics' as ViewMode,     label: 'Analytics',         icon: <PieChart size={13} /> },
//                 ] as Array<{ mode: ViewMode; label: string; icon: React.ReactNode }>).map(({ mode, label, icon }) => {
//                     const isActive = viewMode === mode;
//                     return (
//                         <Box
//                             key={mode}
//                             onClick={() => onViewModeChange(mode)}
//                             sx={{
//                                 display: 'inline-flex', alignItems: 'center', gap: 0.75,
//                                 px: 1.75, py: 0.7, borderRadius: '8px', cursor: 'pointer',
//                                 fontWeight: 600, fontSize: '0.8rem',
//                                 border: `1px solid ${isActive ? alpha(MAROON, 0.6) : alpha('#000', 0.1)}`,
//                                 background: isActive
//                                     ? `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 100%)`
//                                     : '#fff',
//                                 color: isActive ? '#fff' : SLATE,
//                                 transition: 'all 0.18s ease',
//                                 boxShadow: isActive ? `0 2px 8px ${alpha(MAROON, 0.25)}` : '0 1px 3px rgba(0,0,0,0.06)',
//                                 '&:hover': {
//                                     background: isActive
//                                         ? `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 100%)`
//                                         : alpha(MAROON, 0.06),
//                                     borderColor: alpha(MAROON, 0.35),
//                                     color: isActive ? '#fff' : MAROON,
//                                 },
//                             }}
//                         >
//                             {icon}
//                             <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.01em', lineHeight: 1 }}>
//                                 {label}
//                             </Typography>
//                         </Box>
//                     );
//                 })}
//             </Box>
//
//             {/* ── Weekly Cards Section ────────────────────────────────────────── */}
//             <Box sx={{
//                 borderRadius: '16px', overflow: 'hidden',
//                 border: `1px solid ${alpha(MAROON, 0.15)}`,
//                 boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}`,
//             }}>
//                 <SectionHeader
//                     icon={
//                         viewMode === 'week'          ? <Calendar size={15} color="white" /> :
//                             viewMode === 'receiptDetail' ? <Receipt size={15} color="white" /> :
//                                 viewMode === 'groceryList'   ? <CheckSquare size={15} color="white" /> :
//                                     <PieChart size={15} color="white" />
//                     }
//                     title={
//                         viewMode === 'week'          ? 'Weekly Budget Breakdown' :
//                             viewMode === 'receiptDetail' ? 'Receipt Detail View' :
//                                 viewMode === 'groceryList'   ? 'Grocery List Adherence' :
//                                     'Spending Analytics'
//                     }
//                     subtitle="Click a week to expand receipts in receipt detail mode"
//                 />
//                 <Box sx={{ bgcolor: '#f0f2f5', p: 2.5 }}>
//                     <Stack spacing={2}>
//                         {weeklyData.map((week) => {
//                             const isExpanded = expandedWeeks.has(week.weekNumber);
//                             const progressColor = getProgressColor(week.percentUsed);
//                             const isWeekSelected = selectedWeekNumber === week.weekNumber;
//                             const weekAnalytics = weeklyGroceryListAnalytics.get(week.weekNumber);
//                             const isClickable = viewMode === 'receiptDetail';
//
//                             return (
//                                 <Box
//                                     key={week.weekNumber}
//                                     sx={{
//                                         borderRadius: '12px', overflow: 'hidden',
//                                         border: `1px solid ${isWeekSelected ? alpha(MAROON, 0.5) : alpha('#000', 0.08)}`,
//                                         boxShadow: isWeekSelected
//                                             ? `0 4px 16px ${alpha(MAROON, 0.2)}`
//                                             : '0 2px 8px rgba(0,0,0,0.07)',
//                                         transition: 'all 0.2s ease',
//                                         '&:hover': {
//                                             boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
//                                             transform: 'translateY(-1px)',
//                                         },
//                                     }}
//                                 >
//                                     {/* ── Week card header ── */}
//                                     <Box
//                                         onClick={() => isClickable && toggleWeek(week.weekNumber)}
//                                         sx={{
//                                             cursor: isClickable ? 'pointer' : 'default',
//                                             bgcolor: '#fff',
//                                             borderBottom: `2px solid ${alpha(progressColor, 0.3)}`,
//                                             p: 2.5,
//                                             position: 'relative',
//                                         }}
//                                     >
//                                         {/* Savings / over badge */}
//                                         {week.remaining !== 0 && (
//                                             <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
//                                                 <Box sx={{
//                                                     display: 'inline-flex', alignItems: 'center', gap: 0.5,
//                                                     px: 1.25, py: 0.6, borderRadius: '20px',
//                                                     background: week.remaining >= 0
//                                                         ? `linear-gradient(135deg, ${GREEN} 0%, #10b981 100%)`
//                                                         : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
//                                                     color: '#fff',
//                                                     boxShadow: week.remaining >= 0
//                                                         ? `0 3px 10px ${alpha(GREEN, 0.35)}`
//                                                         : '0 3px 10px rgba(220,38,38,0.35)',
//                                                 }}>
//                                                     {week.remaining >= 0
//                                                         ? <PiggyBank size={13} />
//                                                         : <TrendingUp size={13} />
//                                                     }
//                                                     <Box>
//                                                         <Typography sx={{ fontSize: '0.55rem', opacity: 0.85, display: 'block', lineHeight: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
//                                                             {week.remaining >= 0 ? 'SAVED' : 'OVER'}
//                                                         </Typography>
//                                                         <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
//                                                             {fmt(week.remaining)}
//                                                         </Typography>
//                                                     </Box>
//                                                 </Box>
//                                             </Box>
//                                         )}
//
//                                         <Grid container spacing={2} alignItems="center">
//                                             {/* Week title */}
//                                             <Grid item xs={12} md={3.5}>
//                                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                                                     {viewMode === 'receiptDetail' && (
//                                                         <Box
//                                                             onClick={(e) => { e.stopPropagation(); toggleWeek(week.weekNumber); }}
//                                                             sx={{
//                                                                 width: 28, height: 28, borderRadius: '6px', flexShrink: 0,
//                                                                 display: 'flex', alignItems: 'center', justifyContent: 'center',
//                                                                 cursor: 'pointer',
//                                                                 bgcolor: alpha(progressColor, 0.12),
//                                                                 color: progressColor,
//                                                                 border: `1px solid ${alpha(progressColor, 0.25)}`,
//                                                                 transition: 'all 0.15s',
//                                                                 '&:hover': { bgcolor: alpha(progressColor, 0.2) },
//                                                             }}
//                                                         >
//                                                             {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
//                                                         </Box>
//                                                     )}
//                                                     <Box>
//                                                         <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: NAVY, letterSpacing: '-0.01em' }}>
//                                                             {week.weekLabel}
//                                                         </Typography>
//                                                         <Typography sx={{ fontSize: '0.7rem', color: SLATE, mt: 0.15 }}>
//                                                             {format(week.startDate, 'MMM d')} – {format(week.endDate, 'MMM d, yyyy')}
//                                                         </Typography>
//                                                         <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
//                                                             <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.75, py: 0.25, borderRadius: '6px', bgcolor: alpha(TEAL, 0.1), color: TEAL }}>
//                                                                 <Receipt size={10} />
//                                                                 <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>
//                                                                     {week.receipts.length} receipt{week.receipts.length !== 1 ? 's' : ''}
//                                                                 </Typography>
//                                                             </Box>
//                                                             {budget.plannedItems && budget.plannedItems.length > 0 && (
//                                                                 <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.75, py: 0.25, borderRadius: '6px', bgcolor: alpha('#7c3aed', 0.1), color: '#7c3aed' }}>
//                                                                     <CheckSquare size={10} />
//                                                                     <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>Has List</Typography>
//                                                                 </Box>
//                                                             )}
//                                                         </Box>
//                                                     </Box>
//                                                 </Box>
//                                             </Grid>
//
//                                             {/* Stats tiles */}
//                                             <Grid item xs={12} md={8.5}>
//                                                 <Grid container spacing={1.5} sx={{ pr: week.remaining !== 0 ? 12 : 0 }}>
//                                                     {viewMode === 'week' && (
//                                                         <>
//                                                             <Grid item xs={3}>
//                                                                 <StatTile label="Budgeted" value={`$${week.budgetAmount.toFixed(2)}`} themeKey="teal" />
//                                                             </Grid>
//                                                             <Grid item xs={3}>
//                                                                 <StatTile label="Spent" value={`$${week.actualSpent.toFixed(2)}`} themeKey={week.percentUsed > 100 ? 'spent_over' : week.percentUsed > 80 ? 'spent_warn' : 'budget'} />
//                                                             </Grid>
//                                                             <Grid item xs={3}>
//                                                                 <StatTile label="Remaining" value={`$${Math.abs(week.remaining).toFixed(2)}`} sub={week.remaining >= 0 ? 'under' : 'over'} themeKey={week.remaining >= 0 ? 'remaining_good' : 'remaining_bad'} />
//                                                             </Grid>
//                                                             <Grid item xs={3}>
//                                                                 <StatTile label={week.remaining >= 0 ? '✓ SAVED' : '✗ OVER'} value={`$${Math.abs(week.remaining).toFixed(2)}`} themeKey={week.remaining >= 0 ? 'saved_good' : 'spent_over'} />
//                                                             </Grid>
//                                                         </>
//                                                     )}
//
//                                                     {viewMode === 'receiptDetail' && (
//                                                         <>
//                                                             <Grid item xs={4}>
//                                                                 <StatTile label="Receipts" value={String(week.receipts.length)} sub="trips" themeKey="teal" />
//                                                             </Grid>
//                                                             <Grid item xs={4}>
//                                                                 <StatTile
//                                                                     label="Avg / Trip"
//                                                                     value={`$${week.receipts.length > 0 ? (week.actualSpent / week.receipts.length).toFixed(2) : '0.00'}`}
//                                                                     sub="per receipt"
//                                                                     themeKey="budget"
//                                                                 />
//                                                             </Grid>
//                                                             <Grid item xs={4}>
//                                                                 <StatTile
//                                                                     label={week.remaining >= 0 ? 'Saved' : 'Over'}
//                                                                     value={`$${Math.abs(week.remaining).toFixed(2)}`}
//                                                                     sub="this week"
//                                                                     themeKey={week.remaining >= 0 ? 'remaining_good' : 'remaining_bad'}
//                                                                 />
//                                                             </Grid>
//                                                         </>
//                                                     )}
//
//                                                     {viewMode === 'groceryList' && weekAnalytics && (
//                                                         <>
//                                                             <Grid item xs={3}>
//                                                                 <StatTile label="List Budget" value={`$${weekAnalytics.plannedTotal.toFixed(2)}`} sub="planned" themeKey="purple" />
//                                                             </Grid>
//                                                             <Grid item xs={3}>
//                                                                 <StatTile label="From List" value={`$${weekAnalytics.purchasedFromList.toFixed(2)}`} sub="spent" themeKey="budget" />
//                                                             </Grid>
//                                                             <Grid item xs={3}>
//                                                                 <StatTile label="Unplanned" value={`$${weekAnalytics.unplannedPurchases.toFixed(2)}`} sub="impulse" themeKey="amber" />
//                                                             </Grid>
//                                                             <Grid item xs={3}>
//                                                                 <StatTile label="Adherence" value={`${weekAnalytics.adherenceRate.toFixed(0)}%`} sub="on list" themeKey="teal" />
//                                                             </Grid>
//                                                         </>
//                                                     )}
//
//                                                     {viewMode === 'analytics' && weekAnalytics && (
//                                                         <>
//                                                             <Grid item xs={3}>
//                                                                 <StatTile label="Items" value={String(week.receipts.reduce((s, r) => s + r.itemCount, 0))} sub="purchased" themeKey="teal" />
//                                                             </Grid>
//                                                             <Grid item xs={3}>
//                                                                 <StatTile
//                                                                     label="Avg / Item"
//                                                                     value={`$${week.receipts.reduce((s, r) => s + r.itemCount, 0) > 0 ? (week.actualSpent / week.receipts.reduce((s, r) => s + r.itemCount, 0)).toFixed(2) : '0.00'}`}
//                                                                     sub="per item"
//                                                                     themeKey="purple"
//                                                                 />
//                                                             </Grid>
//                                                             <Grid item xs={3}>
//                                                                 <StatTile label="Stores" value={String(new Set(week.receipts.map(r => r.storeName)).size)} sub="visited" themeKey="amber" />
//                                                             </Grid>
//                                                             <Grid item xs={3}>
//                                                                 <StatTile label="Usage" value={`${week.percentUsed.toFixed(0)}%`} sub="of budget" themeKey={week.percentUsed > 100 ? 'spent_over' : week.percentUsed > 80 ? 'spent_warn' : 'remaining_good'} />
//                                                             </Grid>
//                                                         </>
//                                                     )}
//                                                 </Grid>
//
//                                                 {/* Analytics alert */}
//                                                 {viewMode === 'analytics' && (() => {
//                                                     const avgWeeklySpend = weeklyData.reduce((s, w) => s + w.actualSpent, 0) / weeklyData.length;
//                                                     const isOver = week.remaining < 0;
//                                                     const isHigh = week.percentUsed > 90;
//                                                     const isIrregular = Math.abs(week.actualSpent - avgWeeklySpend) > avgWeeklySpend * 0.4;
//                                                     const manyTrips = week.receipts.length > 4;
//                                                     if (!isOver && !isHigh && !isIrregular && !manyTrips) return null;
//                                                     const alertColor = '#d97706';
//                                                     return (
//                                                         <Box sx={{
//                                                             mt: 1.5, p: 1.5, borderRadius: '8px',
//                                                             bgcolor: alpha(alertColor, 0.06),
//                                                             border: `1px solid ${alpha(alertColor, 0.25)}`,
//                                                             display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5,
//                                                         }}>
//                                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                                                 <Box sx={{ p: 0.75, borderRadius: '6px', bgcolor: alpha(alertColor, 0.12), flexShrink: 0 }}>
//                                                                     <Lightbulb size={14} color={alertColor} />
//                                                                 </Box>
//                                                                 <Box>
//                                                                     <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', color: alertColor }}>
//                                                                         {isOver ? 'Over Budget' : isHigh ? 'High Usage' : isIrregular ? 'Irregular Spending' : 'Many Shopping Trips'}
//                                                                     </Typography>
//                                                                     <Typography sx={{ fontSize: '0.65rem', color: SLATE }}>
//                                                                         {isOver ? `$${Math.abs(week.remaining).toFixed(2)} over budget` : isHigh ? `${week.percentUsed.toFixed(0)}% of weekly budget used` : isIrregular ? `${((Math.abs(week.actualSpent - avgWeeklySpend) / avgWeeklySpend) * 100).toFixed(0)}% from average` : `${week.receipts.length} trips — consider consolidating`}
//                                                                     </Typography>
//                                                                 </Box>
//                                                             </Box>
//                                                         </Box>
//                                                     );
//                                                 })()}
//                                             </Grid>
//                                         </Grid>
//
//                                         {/* Progress bar */}
//                                         <Box sx={{ mt: 2 }}>
//                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
//                                                 <Typography sx={{ fontSize: '0.65rem', color: SLATE, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
//                                                     Budget Usage
//                                                 </Typography>
//                                                 <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: progressColor }}>
//                                                     {week.percentUsed.toFixed(1)}%
//                                                 </Typography>
//                                             </Box>
//                                             <LinearProgress
//                                                 variant="determinate"
//                                                 value={Math.min(week.percentUsed, 100)}
//                                                 sx={{
//                                                     height: 5, borderRadius: 3,
//                                                     bgcolor: alpha(progressColor, 0.12),
//                                                     '& .MuiLinearProgress-bar': { bgcolor: progressColor, borderRadius: 3 },
//                                                 }}
//                                             />
//                                         </Box>
//                                     </Box>
//
//                                     {/* ── Expanded receipts (receipt detail mode) ── */}
//                                     {viewMode === 'receiptDetail' && (
//                                         <Collapse in={isExpanded} timeout="auto" unmountOnExit>
//                                             <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: `1px solid ${alpha('#000', 0.06)}` }}>
//                                                 {week.receipts.length > 0 ? (
//                                                     <Grid container spacing={1.5}>
//                                                         {week.receipts.map((receipt) => (
//                                                             <Grid item xs={12} sm={6} md={4} key={receipt.id}>
//                                                                 <Box
//                                                                     onClick={() => handleReceiptClick(receipt)}
//                                                                     sx={{
//                                                                         p: 2, borderRadius: '10px', cursor: 'pointer',
//                                                                         bgcolor: '#fff',
//                                                                         border: `1px solid ${selectedReceiptId === receipt.id ? TEAL : alpha('#000', 0.08)}`,
//                                                                         boxShadow: selectedReceiptId === receipt.id ? `0 0 0 2px ${alpha(TEAL, 0.2)}` : 'none',
//                                                                         transition: 'all 0.18s ease',
//                                                                         '&:hover': {
//                                                                             borderColor: TEAL,
//                                                                             boxShadow: `0 4px 12px ${alpha(TEAL, 0.15)}`,
//                                                                             transform: 'translateY(-1px)',
//                                                                         },
//                                                                     }}
//                                                                 >
//                                                                     <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
//                                                                         <Box sx={{
//                                                                             p: 1, borderRadius: '7px', bgcolor: alpha(TEAL, 0.1), flexShrink: 0,
//                                                                             display: 'flex', alignItems: 'center', justifyContent: 'center',
//                                                                         }}>
//                                                                             <Store size={18} color={TEAL} />
//                                                                         </Box>
//                                                                         <Box sx={{ flex: 1, minWidth: 0 }}>
//                                                                             <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: NAVY, letterSpacing: '-0.01em' }}>
//                                                                                 {receipt.storeName}
//                                                                             </Typography>
//                                                                             <Typography sx={{ fontSize: '0.65rem', color: SLATE, display: 'block', mt: 0.15 }}>
//                                                                                 {format(parseISO(receipt.purchaseDate), 'MMM d, yyyy')}
//                                                                             </Typography>
//                                                                             <Typography sx={{ fontSize: '0.65rem', color: SLATE, display: 'block' }}>
//                                                                                 {receipt.itemCount} item{receipt.itemCount !== 1 ? 's' : ''}
//                                                                             </Typography>
//                                                                             <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: TEAL, mt: 0.75, fontVariantNumeric: 'tabular-nums' }}>
//                                                                                 ${receipt.totalCost.toFixed(2)}
//                                                                             </Typography>
//                                                                         </Box>
//                                                                     </Box>
//                                                                 </Box>
//                                                             </Grid>
//                                                         ))}
//                                                     </Grid>
//                                                 ) : (
//                                                     <Typography sx={{ textAlign: 'center', color: SLATE, fontStyle: 'italic', fontSize: '0.85rem', py: 3 }}>
//                                                         No receipts for this week
//                                                     </Typography>
//                                                 )}
//                                             </Box>
//                                         </Collapse>
//                                     )}
//                                 </Box>
//                             );
//                         })}
//                     </Stack>
//                 </Box>
//             </Box>
//         </Box>
//     );
// };
//
// export default GroceryBudgetTable;
