import { useEffect, useState, useMemo } from 'react';
import { GroceryBudget, GroceryBudgetWithTotals } from '../config/Types';
import {
    Alert, alpha, Box, Button, Chip, CircularProgress,
    Container, Grid, Grow, IconButton, Paper, Typography, Divider,
    LinearProgress, Card,
} from '@mui/material';
import { GroceryBudgetCreate } from './GroceryBudgetCreate';
import {
    Plus, Calendar, ChevronRight, ChevronLeft, List, Camera, ShoppingCart,
    TrendingUp, TrendingDown, PiggyBank,
} from 'lucide-react';
import Sidebar from './Sidebar';
import GroceryBudgetTable, { ReceiptSummary, WeekData } from './GroceryBudgetTable';
import {
    addMonths, format, subMonths, parseISO, endOfWeek,
    isWithinInterval, addWeeks, differenceInWeeks,
} from 'date-fns';
import ReceiptDetailPanel from './ReceiptDetailPanel';
import GroceryBudgetStatsPanel from './GroceryBudgetStatsPanel';
import GroceryAnalyticsPanel from './GroceryAnalyticsPanel';
import GroceryListStatsPanel from './GroceryListStatsPanel';
import GroceryListDialog, { GroceryListItem } from './GroceryListDialog';
import ReceiptScanDialog from './ReceiptScanDialog';

// ── Design tokens (exact match with BudgetPage) ───────────────────────────────
const MAROON      = '#6b1a1a';
const MAROON_DARK = '#4a1010';
const TEAL        = '#0d9488';
const GREEN       = '#059669';
const SLATE       = '#64748b';
const NAVY        = '#1e293b';

type GroceryTrackerView = 'table' | 'create' | 'compare';
export type ViewMode = 'week' | 'receiptDetail' | 'analytics' | 'groceryList';

// ── Reusable action button — identical style to BudgetPage ────────────────────
const ActionBtn: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    badge?: number;
    accent?: string;
    ml?: number;
}> = ({ icon, label, onClick, disabled, badge, accent, ml = 0 }) => (
    <Button
        variant="outlined"
        size="small"
        startIcon={icon}
        onClick={onClick}
        disabled={disabled}
        endIcon={badge && badge > 0 ? (
            <Chip label={badge} size="small" sx={{
                height: 16, fontSize: '0.62rem', fontWeight: 800,
                bgcolor: alpha(TEAL, 0.15), color: TEAL, ml: 0.25,
            }} />
        ) : undefined}
        sx={{
            ml,
            borderRadius: '6px', textTransform: 'none', fontWeight: 600,
            fontSize: '0.78rem', letterSpacing: '0.02em', px: 1.5, py: 0.65,
            borderColor: '#d5d5d5', color: '#333', bgcolor: '#fff',
            '&:hover': {
                borderColor: accent || MAROON,
                color: accent || MAROON,
                bgcolor: alpha(accent || MAROON, 0.04),
            },
            '&.Mui-disabled': { borderColor: '#e8e8e8', color: '#bbb' },
        }}
    >
        {label}
    </Button>
);

// ── Main GroceryTracker ───────────────────────────────────────────────────────
const GroceryTracker: React.FC = () => {
    const [currentView,             setCurrentView]             = useState<GroceryTrackerView>('table');
    const [selectedBudget,          setSelectedBudget]          = useState<GroceryBudget | null>(null);
    const [budgets,                 setBudgets]                 = useState<GroceryBudget[]>([]);
    const [loading,                 setLoading]                 = useState(true);
    const [error,                   setError]                   = useState('');
    const [animateIn,               setAnimateIn]               = useState(false);
    const [currentMonth,            setCurrentMonth]            = useState(new Date());
    const [selectedReceipt,         setSelectedReceipt]         = useState<ReceiptSummary | null>(null);
    const [selectedWeek,            setSelectedWeek]            = useState<WeekData | null>(null);
    const [viewMode,                setViewMode]                = useState<ViewMode>('week');
    const [createDialogOpen,        setCreateDialogOpen]        = useState(false);
    const [groceryListDialogOpen,   setGroceryListDialogOpen]   = useState(false);
    const [receiptScanDialogOpen,   setReceiptScanDialogOpen]   = useState(false);
    const [savedGroceryList,        setSavedGroceryList]        = useState<GroceryListItem[]>([]);

    const dummyBudgets = [
        { id: 1, name: 'Week 1: 02/01/26 - 02/07/26', budgetAmount: 600 },
        { id: 2, name: 'Week 2: 02/08/26 - 02/15/26', budgetAmount: 700 },
        { id: 3, name: 'Week 3: 02/16/26 - 02/23/26', budgetAmount: 150 },
    ];

    const weeklyData = useMemo((): WeekData[] => {
        if (!selectedBudget) return [];
        const startDate  = parseISO(selectedBudget.startDate);
        const endDate    = parseISO(selectedBudget.endDate);
        const totalWeeks = Math.ceil(differenceInWeeks(endDate, startDate)) + 1;
        const weeklyBudget = selectedBudget.budgetAmount / totalWeeks;

        const allItems: any[] = [];
        selectedBudget.stores.forEach(store => {
            store.items.forEach(item => allItems.push({ ...item, storeName: store.storeName }));
        });

        const weeks: WeekData[] = [];
        for (let i = 0; i < totalWeeks; i++) {
            const weekStart     = addWeeks(startDate, i);
            const weekEndRaw    = endOfWeek(weekStart, { weekStartsOn: 0 });
            const actualWeekEnd = weekEndRaw > endDate ? endDate : weekEndRaw;
            const weekItems     = allItems.filter(item =>
                isWithinInterval(parseISO(item.datePurchased), { start: weekStart, end: actualWeekEnd })
            );

            const receiptMap = new Map<string, any[]>();
            weekItems.forEach(item => {
                const key = `${item.storeName}-${item.datePurchased}`;
                if (!receiptMap.has(key)) receiptMap.set(key, []);
                receiptMap.get(key)!.push(item);
            });

            const receipts: ReceiptSummary[] = Array.from(receiptMap.entries())
                .map(([key, items]) => {
                    const [storeName, purchaseDate] = key.split('-');
                    return {
                        id: `week${i + 1}-${key}`, storeName, purchaseDate,
                        itemCount: items.length,
                        totalCost: items.reduce((s: number, x: any) => s + x.itemCost, 0),
                        items: items.sort((a: any, b: any) => a.itemName.localeCompare(b.itemName)),
                        weekNumber: i + 1,
                        weekLabel: `Week ${i + 1}`,
                    };
                })
                .sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate));

            const actualSpent = weekItems.reduce((s: number, x: any) => s + x.itemCost, 0);
            weeks.push({
                weekNumber: i + 1, weekLabel: `Week ${i + 1}`,
                startDate: weekStart, endDate: actualWeekEnd,
                budgetAmount: weeklyBudget, actualSpent,
                remaining: weeklyBudget - actualSpent,
                percentUsed: (actualSpent / weeklyBudget) * 100, receipts,
            });
        }
        return weeks;
    }, [selectedBudget]);

    useEffect(() => {
        document.title = 'Grocery Tracker';
        setTimeout(() => setAnimateIn(true), 100);
        return () => { document.title = 'BudgetBuddy'; };
    }, []);

    // Re-load budget data whenever the selected month changes
    useEffect(() => {
        loadBudgets(currentMonth);
    }, [currentMonth]);

    const transformBudgetData = (budget: GroceryBudget): GroceryBudgetWithTotals => {
        const totalSpent = budget.stores.reduce((sum, store) =>
            sum + store.items.reduce((s, item) => s + item.itemCost, 0), 0);
        return {
            id: budget.id ?? 0, name: budget.name, budgetAmount: budget.budgetAmount, totalSpent,
            startDate: budget.startDate, endDate: budget.endDate,
            savingsGoal: budget.savingsGoal, subBudgetId: budget.subBudgetId,
            plannedItems: budget.plannedItems,
            stores: budget.stores.map(store => ({
                storeName: store.storeName,
                totalSpent: store.items.reduce((s, i) => s + i.itemCost, 0),
                items: store.items,
            })),
            sections: budget.sections,
        };
    };

    const loadBudgets = async (month: Date) => {
        try {
            setLoading(true);
            // Build dates dynamically from the selected month so the data always matches
            const yr  = month.getFullYear();
            const mo  = month.getMonth(); // 0-indexed
            const d   = (day: number) => format(new Date(yr, mo, day), 'yyyy-MM-dd');
            const lastDay = new Date(yr, mo + 1, 0).getDate();

            const dummyBudgets: GroceryBudget[] = [
                {
                    id: 1,
                    name: `${format(month, 'MMMM yyyy')} Groceries`,
                    budgetAmount: 600,
                    startDate: d(1),
                    endDate: d(lastDay),
                    subBudgetId: 1,
                    savingsGoal: 100,
                    stores: [
                        {
                            storeName: 'Whole Foods',
                            items: [
                                { id: 1,  itemName: 'Organic Apples', itemCost: 12.50, itemDescription: '2 lb bag', storeName: 'Whole Foods', datePurchased: d(5),              category: 'Produce',   quantity: 1 },
                                { id: 2,  itemName: 'Chicken Breast', itemCost: 25.00,                              storeName: 'Whole Foods', datePurchased: d(5),              category: 'Meat',      quantity: 2 },
                                { id: 3,  itemName: 'Greek Yogurt',   itemCost: 8.99,                               storeName: 'Whole Foods', datePurchased: d(8),              category: 'Dairy',     quantity: 1 },
                                { id: 5,  itemName: 'Salmon Fillet',  itemCost: 34.00,                              storeName: 'Whole Foods', datePurchased: d(12),             category: 'Seafood',   quantity: 1 },
                                { id: 8,  itemName: 'Almond Butter',  itemCost: 12.99,                              storeName: 'Whole Foods', datePurchased: d(20),             category: 'Pantry',    quantity: 1 },
                                { id: 10, itemName: 'Mixed Berries',  itemCost: 14.50,                              storeName: 'Whole Foods', datePurchased: d(Math.min(25, lastDay)), category: 'Produce', quantity: 1 },
                                { id: 13, itemName: 'Grass-Fed Beef', itemCost: 36.54,                              storeName: 'Whole Foods', datePurchased: d(Math.min(lastDay - 1, lastDay)), category: 'Meat', quantity: 1 },
                            ],
                        },
                        {
                            storeName: 'Trader Joes',
                            items: [
                                { id: 14, itemName: 'Almond Milk',       itemCost: 3.99,  storeName: 'Trader Joes', datePurchased: d(8),              category: 'Dairy',     quantity: 1 },
                                { id: 15, itemName: 'Everything Bagels', itemCost: 4.50,  storeName: 'Trader Joes', datePurchased: d(8),              category: 'Bakery',    quantity: 1 },
                                { id: 17, itemName: 'Trail Mix',         itemCost: 7.50,  storeName: 'Trader Joes', datePurchased: d(14),             category: 'Snacks',    quantity: 1 },
                                { id: 18, itemName: 'Pasta',             itemCost: 2.99,  storeName: 'Trader Joes', datePurchased: d(17),             category: 'Pantry',    quantity: 1 },
                                { id: 24, itemName: 'Coffee Beans',      itemCost: 9.99,  storeName: 'Trader Joes', datePurchased: d(Math.min(28, lastDay)), category: 'Beverages', quantity: 1 },
                                { id: 28, itemName: 'Protein Bars',      itemCost: 9.99,  storeName: 'Trader Joes', datePurchased: d(lastDay),        category: 'Snacks',    quantity: 1 },
                            ],
                        },
                        {
                            storeName: 'Costco',
                            items: [
                                { id: 29, itemName: 'Bananas',        itemCost: 8.50,  storeName: 'Costco', datePurchased: d(3),  category: 'Produce',   quantity: 1 },
                                { id: 30, itemName: 'Paper Towels',   itemCost: 24.99, storeName: 'Costco', datePurchased: d(3),  category: 'Household', quantity: 1 },
                                { id: 31, itemName: 'Chicken Thighs', itemCost: 19.99, storeName: 'Costco', datePurchased: d(16), category: 'Meat',      quantity: 1 },
                                { id: 32, itemName: 'Olive Oil',      itemCost: 11.52, storeName: 'Costco', datePurchased: d(16), category: 'Pantry',    quantity: 1 },
                            ],
                        },
                    ],
                    sections: [
                        { id: 1, name: 'Produce',        budgetAmount: 150, items: [] },
                        { id: 2, name: 'Meat & Seafood', budgetAmount: 200, items: [] },
                        { id: 3, name: 'Dairy',          budgetAmount: 100, items: [] },
                        { id: 4, name: 'Bakery',         budgetAmount: 50,  items: [] },
                        { id: 5, name: 'Pantry',         budgetAmount: 80,  items: [] },
                        { id: 6, name: 'Frozen',         budgetAmount: 40,  items: [] },
                        { id: 7, name: 'Snacks',         budgetAmount: 30,  items: [] },
                        { id: 8, name: 'Beverages',      budgetAmount: 25,  items: [] },
                        { id: 9, name: 'Household',      budgetAmount: 25,  items: [] },
                    ],
                    plannedItems: [
                        { itemName: 'Organic Apples', estimatedCost: 12.50 },
                        { itemName: 'Chicken Breast', estimatedCost: 25.00 },
                    ],
                },
            ];
            setTimeout(() => {
                setBudgets(dummyBudgets);
                setSelectedBudget(dummyBudgets[0]);
                setLoading(false);
            }, 500);
        } catch {
            setError('Failed to load budgets. Please try again.');
            setLoading(false);
        }
    };

    const handleBudgetCreateSuccess = () => { setCreateDialogOpen(false); loadBudgets(currentMonth); };
    const handleSaveGroceryList     = (items: GroceryListItem[], _budgetId: number) => {
        setSavedGroceryList(items);
        setGroceryListDialogOpen(false);
    };
    const handleReceiptUpload = async (_file: File, _budgetId: number) => {
        await new Promise<void>(resolve => setTimeout(resolve, 2000));
    };
    const handleReceiptSelect  = (receipt: ReceiptSummary) => setSelectedReceipt(receipt);
    const handleViewModeChange = (mode: ViewMode) => { setViewMode(mode); setSelectedReceipt(null); setSelectedWeek(null); };
    const handleWeekSelect     = (week: WeekData) => { setSelectedWeek(week); setSelectedReceipt(null); };
    const showRightPanel       = ['week', 'receiptDetail', 'analytics', 'groceryList'].includes(viewMode);

    // Budget summary stats
    const totalSpent   = selectedBudget ? selectedBudget.stores.reduce((s, store) => s + store.items.reduce((ss, i) => ss + i.itemCost, 0), 0) : 0;
    const budgetAmount = selectedBudget?.budgetAmount ?? 0;
    const pctUsed      = budgetAmount > 0 ? Math.min((totalSpent / budgetAmount) * 100, 100) : 0;
    const remaining    = budgetAmount - totalSpent;
    const savingsGoal  = selectedBudget?.savingsGoal ?? 0;

    return (
        <Box sx={{ maxWidth: 'calc(100% - 240px)', ml: '240px', minHeight: '100vh', background: '#f0f2f5' }}>
            <Sidebar />

            <Container maxWidth="xl" sx={{ py: 4 }}>

                {/* ── Page header — matches BudgetPage exactly ── */}
                <Grow in={animateIn} timeout={400}>
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ width: 28, height: 3, background: MAROON, borderRadius: '2px', mb: 0.75 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: alpha(MAROON, 0.55), mb: 0.4 }}>
                                    Grocery Tracker
                                </Typography>
                                <Typography sx={{ fontSize: '1.75rem', fontWeight: 900, color: NAVY, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                                    {format(currentMonth, 'MMMM yyyy')} Groceries
                                </Typography>
                                <Typography sx={{ fontSize: '0.95rem', color: SLATE, mt: 0.4 }}>
                                    Track your grocery spending and manage budgets
                                </Typography>
                            </Box>

                            {/* ── Action buttons — exact match with BudgetPage ── */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>

                                {/* Filled maroon chevron — identical to BudgetPage */}
                                <IconButton
                                    onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                                    disabled={loading}
                                    sx={{
                                        width: 32, height: 32, borderRadius: '6px',
                                        background: MAROON, color: '#fff',
                                        '&:hover': { background: MAROON_DARK },
                                        '&.Mui-disabled': { background: '#ddd', color: '#aaa' },
                                    }}
                                >
                                    <ChevronLeft size={16} />
                                </IconButton>

                                {/* Month label card — identical to BudgetPage */}
                                <Card elevation={0} sx={{
                                    px: 2, py: 0.75, display: 'flex', alignItems: 'center', gap: 1,
                                    borderRadius: '8px', border: '1px solid #e0e0e0', background: '#f9f9f9',
                                }}>
                                    <Calendar size={14} color="#888" />
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#222' }}>
                                        {format(currentMonth, 'MMMM yyyy')}
                                    </Typography>
                                </Card>

                                {/* Filled maroon chevron — identical to BudgetPage */}
                                <IconButton
                                    onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                                    disabled={loading}
                                    sx={{
                                        width: 32, height: 32, borderRadius: '6px',
                                        background: MAROON, color: '#fff',
                                        '&:hover': { background: MAROON_DARK },
                                        '&.Mui-disabled': { background: '#ddd', color: '#aaa' },
                                    }}
                                >
                                    <ChevronRight size={16} />
                                </IconButton>

                                {/* Outlined action buttons — identical style to BudgetPage's Import/Manage/Categories */}
                                {([
                                    {
                                        label: 'Create Budget',
                                        icon: <Plus size={14} />,
                                        onClick: () => setCreateDialogOpen(true),
                                        disabled: false,
                                        ml: 1,
                                        badge: null,
                                    },
                                    {
                                        label: 'Scan Receipt',
                                        icon: <Camera size={14} />,
                                        onClick: () => setReceiptScanDialogOpen(true),
                                        disabled: !selectedBudget,
                                        ml: 0,
                                        badge: null,
                                    },
                                    {
                                        label: 'Grocery List',
                                        icon: <List size={14} />,
                                        onClick: () => setGroceryListDialogOpen(true),
                                        disabled: !selectedBudget,
                                        ml: 0,
                                        badge: savedGroceryList.length,
                                    },
                                ] as Array<{ label: string; icon: React.ReactNode; onClick: () => void; disabled: boolean; ml: number; badge: number | null }>).map(({ label, icon, onClick, disabled, ml, badge }) => (
                                    <Button
                                        key={label}
                                        variant="outlined"
                                        size="small"
                                        startIcon={icon}
                                        onClick={onClick}
                                        disabled={disabled}
                                        endIcon={
                                            badge && badge > 0 ? (
                                                <Chip
                                                    label={badge}
                                                    size="small"
                                                    sx={{
                                                        height: 16, fontSize: '0.62rem', fontWeight: 800,
                                                        bgcolor: alpha(TEAL, 0.15), color: TEAL, ml: 0.25,
                                                    }}
                                                />
                                            ) : undefined
                                        }
                                        sx={{
                                            ml,
                                            borderRadius: '6px', textTransform: 'none', fontWeight: 600,
                                            fontSize: '0.78rem', letterSpacing: '0.02em', px: 1.5, py: 0.65,
                                            borderColor: '#d5d5d5', color: '#333', bgcolor: '#fff',
                                            '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: alpha(MAROON, 0.04) },
                                            '&.Mui-disabled': { borderColor: '#e8e8e8', color: '#bbb' },
                                        }}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                </Grow>
                {/*<Grow in={animateIn} timeout={400}>*/}
                {/*    <Box sx={{ mb: 4 }}>*/}
                {/*        <Box sx={{ width: 28, height: 3, background: MAROON, borderRadius: '2px', mb: 0.75 }} />*/}
                {/*        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>*/}
                {/*            <Box>*/}
                {/*                <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: alpha(MAROON, 0.55), mb: 0.4 }}>*/}
                {/*                    Grocery Tracker*/}
                {/*                </Typography>*/}
                {/*                <Typography sx={{ fontSize: '1.75rem', fontWeight: 900, color: NAVY, letterSpacing: '-0.02em', lineHeight: 1.15 }}>*/}
                {/*                    {format(currentMonth, 'MMMM yyyy')} Groceries*/}
                {/*                </Typography>*/}
                {/*                <Typography sx={{ fontSize: '0.95rem', color: SLATE, mt: 0.4 }}>*/}
                {/*                    Track your grocery spending and manage budgets*/}
                {/*                </Typography>*/}
                {/*            </Box>*/}

                {/*            /!* Action buttons — matching BudgetPage style *!/*/}
                {/*            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>*/}
                {/*                /!* Month nav pill *!/*/}
                {/*                <Box sx={{*/}
                {/*                    display: 'flex', alignItems: 'center', gap: 0.5,*/}
                {/*                    px: 1, py: 0.6, borderRadius: '8px', bgcolor: '#fff',*/}
                {/*                    border: '1px solid #e0e0e0',*/}
                {/*                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',*/}
                {/*                }}>*/}
                {/*                    <IconButton size="small" onClick={() => setCurrentMonth(m => subMonths(m, 1))} disabled={loading}*/}
                {/*                                sx={{ width: 28, height: 28, borderRadius: '6px', color: SLATE, '&:hover': { color: MAROON, bgcolor: alpha(MAROON, 0.06) } }}>*/}
                {/*                        <ChevronLeft size={15} />*/}
                {/*                    </IconButton>*/}
                {/*                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 0.75 }}>*/}
                {/*                        <Calendar size={13} color={SLATE} />*/}
                {/*                        <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: NAVY, whiteSpace: 'nowrap' }}>*/}
                {/*                            {format(currentMonth, 'MMMM yyyy')}*/}
                {/*                        </Typography>*/}
                {/*                    </Box>*/}
                {/*                    <IconButton size="small" onClick={() => setCurrentMonth(m => addMonths(m, 1))} disabled={loading}*/}
                {/*                                sx={{ width: 28, height: 28, borderRadius: '6px', color: SLATE, '&:hover': { color: MAROON, bgcolor: alpha(MAROON, 0.06) } }}>*/}
                {/*                        <ChevronRight size={15} />*/}
                {/*                    </IconButton>*/}
                {/*                </Box>*/}

                {/*                <ActionBtn icon={<Plus size={13} />}   label="Create Budget"  onClick={() => setCreateDialogOpen(true)}   accent={GREEN} ml={1} />*/}
                {/*                <ActionBtn icon={<Camera size={13} />} label="Scan Receipt"   onClick={() => setReceiptScanDialogOpen(true)} disabled={!selectedBudget} />*/}
                {/*                <ActionBtn*/}
                {/*                    icon={<List size={13} />}*/}
                {/*                    label="Grocery List"*/}
                {/*                    onClick={() => setGroceryListDialogOpen(true)}*/}
                {/*                    disabled={!selectedBudget}*/}
                {/*                    badge={savedGroceryList.length}*/}
                {/*                    accent={TEAL}*/}
                {/*                />*/}
                {/*            </Box>*/}
                {/*        </Box>*/}
                {/*    </Box>*/}
                {/*</Grow>*/}

                {/* ── Budget summary banner — matches BudgetPage's Paper banner ── */}
                {selectedBudget && !loading && (
                    <Grow in={animateIn} timeout={600}>
                        <Paper sx={{
                            mb: 3, borderRadius: '16px', overflow: 'hidden',
                            border: `1px solid ${alpha(MAROON, 0.12)}`,
                            boxShadow: `0 4px 20px ${alpha(MAROON, 0.1)}`,
                            position: 'relative',
                        }}>
                            {/* Maroon header strip — same gradient as BudgetPage */}
                            <Box sx={{
                                px: 3, py: 2,
                                background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 50%, #5a1515 100%)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                position: 'relative', overflow: 'hidden',
                            }}>
                                <Box sx={{ position: 'absolute', top: -24, right: -24, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative' }}>
                                    <Box sx={{ width: 34, height: 34, borderRadius: '9px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <ShoppingCart size={17} color="#fff" />
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', letterSpacing: '-0.01em' }}>
                                            Month Overview
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)' }}>
                                            {format(parseISO(selectedBudget.startDate), 'MMM d')} – {format(parseISO(selectedBudget.endDate), 'MMM d, yyyy')}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.4, borderRadius: '20px', bgcolor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff' }}>{pctUsed.toFixed(0)}% used</Typography>
                                </Box>
                            </Box>

                            {/* Stats row */}
                            <Box sx={{ display: 'flex', bgcolor: '#fff', position: 'relative' }}>
                                {[
                                    {
                                        label: 'Budget', value: `$${budgetAmount.toFixed(2)}`,
                                        color: MAROON, sub: 'monthly limit',
                                        icon: <ShoppingCart size={12} color={alpha(MAROON, 0.6)} />,
                                    },
                                    {
                                        label: 'Spent', value: `$${totalSpent.toFixed(2)}`,
                                        color: totalSpent > budgetAmount ? '#dc2626' : NAVY,
                                        sub: `${pctUsed.toFixed(1)}% of budget`,
                                        icon: <TrendingUp size={12} color={alpha(totalSpent > budgetAmount ? '#dc2626' : NAVY, 0.6)} />,
                                    },
                                    {
                                        label: 'Remaining',
                                        value: `$${Math.abs(remaining).toFixed(2)}${remaining < 0 ? ' over' : ''}`,
                                        color: remaining < 0 ? '#dc2626' : GREEN,
                                        sub: remaining < 0 ? 'over budget' : 'under budget',
                                        icon: <TrendingDown size={12} color={alpha(remaining < 0 ? '#dc2626' : GREEN, 0.6)} />,
                                    },
                                    {
                                        label: 'Stores', value: `${selectedBudget.stores.length}`,
                                        color: TEAL, sub: 'this period',
                                        icon: <ShoppingCart size={12} color={alpha(TEAL, 0.6)} />,
                                    },
                                    {
                                        label: 'Savings Goal', value: `$${savingsGoal.toFixed(2)}`,
                                        color: remaining >= savingsGoal ? GREEN : '#d97706',
                                        sub: remaining >= savingsGoal ? 'on track!' : 'need to cut back',
                                        icon: <PiggyBank size={12} color={alpha(remaining >= savingsGoal ? GREEN : '#d97706', 0.6)} />,
                                    },
                                ].map(({ label, value, color, sub, icon }, i, arr) => (
                                    <Box key={label} sx={{
                                        flex: 1, textAlign: 'center', px: 2, py: 2,
                                        borderRight: i < arr.length - 1 ? `1px solid ${alpha('#000', 0.07)}` : 'none',
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4, mb: 0.4 }}>
                                            {icon}
                                            <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: SLATE }}>
                                                {label}
                                            </Typography>
                                        </Box>
                                        <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                                            {value}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.62rem', color: SLATE, mt: 0.3 }}>{sub}</Typography>
                                    </Box>
                                ))}

                                {/* Progress bar at the bottom of stats row */}
                                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, bgcolor: alpha('#000', 0.04) }}>
                                    <Box sx={{
                                        height: '100%',
                                        width: `${pctUsed}%`,
                                        bgcolor: pctUsed > 90 ? '#dc2626' : pctUsed > 70 ? '#d97706' : TEAL,
                                        transition: 'width 0.6s ease',
                                        borderRadius: '0 2px 2px 0',
                                    }} />
                                </Box>
                            </Box>
                        </Paper>
                    </Grow>
                )}

                {/* ── Loading skeleton ── */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <CircularProgress size={36} thickness={4} sx={{ color: MAROON, mb: 2 }} />
                            <Typography sx={{ fontSize: '0.95rem', color: SLATE, fontWeight: 600 }}>
                                Loading budgets…
                            </Typography>
                        </Box>
                    </Box>
                )}

                {/* ── Error ── */}
                {error && (
                    <Grow in timeout={400}>
                        <Box sx={{
                            mb: 3, p: 2.5, background: alpha(MAROON, 0.06), color: MAROON,
                            borderRadius: '10px', border: `1px solid ${alpha(MAROON, 0.18)}`,
                        }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Error Loading Budget Data</Typography>
                            <Typography variant="body2" sx={{ color: '#666', mt: 0.25 }}>{error}</Typography>
                        </Box>
                    </Grow>
                )}

                {/* ── Main content ── */}
                {!loading && (
                    <Grow in={animateIn} timeout={800}>
                        <Box>
                            {currentView === 'table' && selectedBudget && (
                                <Grid container spacing={2.5}>
                                    <Grid item xs={12} lg={8}>
                                        <GroceryBudgetTable
                                            budget={transformBudgetData(selectedBudget)}
                                            viewMode={viewMode}
                                            onViewModeChange={handleViewModeChange}
                                            onReceiptSelect={handleReceiptSelect}
                                            onWeekSelect={handleWeekSelect}
                                        />
                                    </Grid>
                                    {showRightPanel && (
                                        <Grid item xs={12} lg={4}>
                                            <Box sx={{ position: 'sticky', top: 24 }}>
                                                {viewMode === 'week' && (
                                                    <GroceryBudgetStatsPanel budget={transformBudgetData(selectedBudget)} />
                                                )}
                                                {viewMode === 'receiptDetail' && (
                                                    <ReceiptDetailPanel
                                                        receipt={selectedReceipt}
                                                        weekReceipts={selectedReceipt
                                                            ? weeklyData.find(w => w.weekNumber === selectedReceipt.weekNumber)?.receipts || []
                                                            : []
                                                        }
                                                    />
                                                )}
                                                {viewMode === 'analytics' && (
                                                    <GroceryAnalyticsPanel budget={transformBudgetData(selectedBudget)} />
                                                )}
                                                {viewMode === 'groceryList' && (
                                                    <GroceryListStatsPanel budget={transformBudgetData(selectedBudget)} />
                                                )}
                                            </Box>
                                        </Grid>
                                    )}
                                </Grid>
                            )}

                            <GroceryBudgetCreate
                                open={createDialogOpen}
                                onSuccess={handleBudgetCreateSuccess}
                                onClose={() => setCreateDialogOpen(false)}
                            />
                            <GroceryListDialog
                                open={groceryListDialogOpen}
                                onClose={() => setGroceryListDialogOpen(false)}
                                budgets={dummyBudgets}
                                onSave={handleSaveGroceryList}
                            />
                            <ReceiptScanDialog
                                open={receiptScanDialogOpen}
                                onClose={() => setReceiptScanDialogOpen(false)}
                                budgets={dummyBudgets}
                                onUpload={handleReceiptUpload}
                            />
                        </Box>
                    </Grow>
                )}
            </Container>
        </Box>
    );
};

export default GroceryTracker;

// import {useEffect, useState, useMemo} from "react";
// import {GroceryBudget, GroceryBudgetWithTotals} from "../config/Types";
// import {
//     Alert, alpha,
//     Box,
//     Button, Card, Chip,
//     Container, Grid,
//     Grow,
//     IconButton,
//     Typography,
//     useTheme
// } from "@mui/material";
// import {GroceryBudgetCreate} from "./GroceryBudgetCreate";
// import {
//     Plus,
//     Calendar, ChevronRight, ChevronLeft, ListIcon, Camera
// } from 'lucide-react';
// import Sidebar from "./Sidebar";
// import GroceryBudgetTable, {ReceiptSummary, WeekData} from "./GroceryBudgetTable";
// import { addMonths, format, subMonths, parseISO, endOfWeek, isWithinInterval, addWeeks, differenceInWeeks } from 'date-fns';
// import ReceiptDetailPanel from "./ReceiptDetailPanel";
// import GroceryBudgetStatsPanel from "./GroceryBudgetStatsPanel";
// import GroceryAnalyticsPanel from "./GroceryAnalyticsPanel";
// import GroceryListStatsPanel from "./GroceryListStatsPanel";
// import GroceryListDialog, { GroceryListItem} from './GroceryListDialog';
// import GroceryOptimization from "./GroceryOptimization";
// import LightbulbIcon from '@mui/icons-material/Lightbulb';
// import ReceiptScanDialog from './ReceiptScanDialog';
//
// type GroceryTrackerView = 'table' | 'create' | 'compare';
// export type ViewMode = 'week' | 'receiptDetail' | 'analytics' | 'groceryList';
//
// const gradients = {
//     blue: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
//     green: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
//     purple: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
//     orange: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
//     indigo: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
//     teal: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
//     maroon: 'linear-gradient(135deg, #800000 0%, #a00000 100%)'
// };
//
// const GroceryTracker: React.FC = () => {
//     const [currentView, setCurrentView] = useState<GroceryTrackerView>('table');
//     const [selectedBudget, setSelectedBudget] = useState<GroceryBudget | null>(null);
//     const [budgets, setBudgets] = useState<GroceryBudget[]>([]);
//     const [loading, setLoading] = useState<boolean>(true);
//     const [error, setError] = useState<string>('');
//     const [animateIn, setAnimateIn] = useState(false);
//     const [currentMonth, setCurrentMonth] = useState(new Date());
//     const [selectedReceipt, setSelectedReceipt] = useState<ReceiptSummary | null>(null);
//     const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);
//     const [viewMode, setViewMode] = useState<ViewMode>('week');
//     const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
//     const [groceryListDialogOpen, setGroceryListDialogOpen] = useState(false);
//     const [receiptScanDialogOpen, setReceiptScanDialogOpen] = useState(false);
//     const [savedGroceryList, setSavedGroceryList] = useState<GroceryListItem[]>([]);
//
//     const dummyBudgets = [
//         { id: 1, name: 'Week 1: 02/01/26 - 02/07/26', budgetAmount: 600 },
//         { id: 2, name: 'Week 2: 02/08/26 - 02/15/26', budgetAmount: 700 },
//         { id: 3, name: 'Week 3: 02/16/26 - 02/23/26', budgetAmount: 150 }
//     ];
//
//     // Calculate weekly data from selected budget
//     const weeklyData = useMemo((): WeekData[] => {
//         if (!selectedBudget) return [];
//
//         const startDate = parseISO(selectedBudget.startDate);
//         const endDate = parseISO(selectedBudget.endDate);
//         const totalWeeks = Math.ceil(differenceInWeeks(endDate, startDate)) + 1;
//         const weeklyBudget = selectedBudget.budgetAmount / totalWeeks;
//
//         const allItems: any[] = [];
//         selectedBudget.stores.forEach(store => {
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
//             const receiptMap = new Map<string, any[]>();
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
//     }, [selectedBudget]);
//
//     const handleCreateNew = () => {
//         setCreateDialogOpen(true);
//     };
//
//     const handleBudgetCreateSuccess = () => {
//         setCreateDialogOpen(false);
//         loadBudgets();
//     };
//
//     const handleSaveGroceryList = (items: GroceryListItem[], budgetId: number) => {
//         console.log('Saved grocery list to budget:', budgetId);
//         console.log('Items:', items);
//         setGroceryListDialogOpen(false);
//         // TODO: Save to backend or state
//     };
//
//     const handleReceiptUpload = async (file: File, budgetId: number) => {
//         console.log('Uploading receipt:', file.name, 'to budget:', budgetId);
//
//         // TODO: Implement actual upload logic
//         // This would typically:
//         // 1. Upload the image to your backend
//         // 2. Process the receipt with OCR/AI
//         // 3. Extract items and prices
//         // 4. Associate with the selected budget
//
//         // Simulate API call
//         return new Promise<void>((resolve) => {
//             setTimeout(() => {
//                 console.log('Receipt uploaded successfully!');
//                 resolve();
//             }, 2000);
//         });
//     };
//
//     useEffect(() => {
//         document.title = 'Grocery Tracker';
//         setTimeout(() => setAnimateIn(true), 100);
//         loadBudgets();
//
//         return () => {
//             document.title = "BudgetBuddy";
//         };
//     }, []);
//
//     const transformBudgetData = (budget: GroceryBudget): GroceryBudgetWithTotals => {
//         const totalSpent = budget.stores.reduce((sum, store) => {
//             return sum + store.items.reduce((storeSum, item) => storeSum + item.itemCost, 0);
//         }, 0);
//
//         const id: number = budget.id ?? 0;
//
//         const result: GroceryBudgetWithTotals = {
//             id,
//             name: budget.name,
//             budgetAmount: budget.budgetAmount,
//             totalSpent,
//             startDate: budget.startDate,
//             endDate: budget.endDate,
//             savingsGoal: budget.savingsGoal,
//             subBudgetId: budget.subBudgetId,
//             plannedItems: budget.plannedItems,
//             stores: budget.stores.map(store => ({
//                 storeName: store.storeName,
//                 totalSpent: store.items.reduce((sum, item) => sum + item.itemCost, 0),
//                 items: store.items
//             })),
//             sections: budget.sections
//         };
//
//         return result;
//     };
//
//     const handlePreviousMonth = () => {
//         setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
//     };
//
//     const handleNextMonth = () => {
//         setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
//     };
//
//     const loadBudgets = async () => {
//         try {
//             setLoading(true);
//             // Dummy data matching the actual GroceryBudget interface
//             const dummyBudgets: GroceryBudget[] = [
//                 {
//                     id: 1,
//                     name: 'January 2026 Groceries',
//                     budgetAmount: 600,
//                     startDate: '2026-01-01',
//                     endDate: '2026-01-31',
//                     subBudgetId: 1,
//                     savingsGoal: 100,
//                     stores: [
//                         {
//                             storeName: 'Whole Foods',
//                             items: [
//                                 { id: 1, itemName: 'Organic Apples', itemCost: 12.50, itemDescription: '2 lb bag', storeName: 'Whole Foods', datePurchased: '2026-01-05', category: 'Produce', quantity: 1 },
//                                 { id: 2, itemName: 'Chicken Breast', itemCost: 25.00, storeName: 'Whole Foods', datePurchased: '2026-01-05', category: 'Meat', quantity: 2 },
//                                 { id: 3, itemName: 'Greek Yogurt', itemCost: 8.99, storeName: 'Whole Foods', datePurchased: '2026-01-08', category: 'Dairy', quantity: 1 },
//                                 { id: 4, itemName: 'Organic Spinach', itemCost: 6.50, storeName: 'Whole Foods', datePurchased: '2026-01-10', category: 'Produce', quantity: 1 },
//                                 { id: 5, itemName: 'Salmon Fillet', itemCost: 34.00, storeName: 'Whole Foods', datePurchased: '2026-01-12', category: 'Seafood', quantity: 1 },
//                                 { id: 6, itemName: 'Whole Grain Bread', itemCost: 5.99, storeName: 'Whole Foods', datePurchased: '2026-01-15', category: 'Bakery', quantity: 1 },
//                                 { id: 7, itemName: 'Avocados', itemCost: 9.50, storeName: 'Whole Foods', datePurchased: '2026-01-18', category: 'Produce', quantity: 1 },
//                                 { id: 8, itemName: 'Almond Butter', itemCost: 12.99, storeName: 'Whole Foods', datePurchased: '2026-01-20', category: 'Pantry', quantity: 1 },
//                                 { id: 9, itemName: 'Free Range Eggs', itemCost: 7.50, storeName: 'Whole Foods', datePurchased: '2026-01-22', category: 'Dairy', quantity: 1 },
//                                 { id: 10, itemName: 'Mixed Berries', itemCost: 14.50, storeName: 'Whole Foods', datePurchased: '2026-01-25', category: 'Produce', quantity: 1 },
//                                 { id: 11, itemName: 'Quinoa', itemCost: 8.99, storeName: 'Whole Foods', datePurchased: '2026-01-27', category: 'Pantry', quantity: 1 },
//                                 { id: 12, itemName: 'Kale', itemCost: 4.50, storeName: 'Whole Foods', datePurchased: '2026-01-28', category: 'Produce', quantity: 1 },
//                                 { id: 13, itemName: 'Grass-Fed Beef', itemCost: 36.54, storeName: 'Whole Foods', datePurchased: '2026-01-30', category: 'Meat', quantity: 1 }
//                             ]
//                         },
//                         {
//                             storeName: 'Trader Joes',
//                             items: [
//                                 { id: 14, itemName: 'Almond Milk', itemCost: 3.99, storeName: 'Trader Joes', datePurchased: '2026-01-08', category: 'Dairy', quantity: 1 },
//                                 { id: 15, itemName: 'Everything Bagels', itemCost: 4.50, storeName: 'Trader Joes', datePurchased: '2026-01-08', category: 'Bakery', quantity: 1 },
//                                 { id: 16, itemName: 'Frozen Vegetables', itemCost: 6.99, storeName: 'Trader Joes', datePurchased: '2026-01-11', category: 'Frozen', quantity: 1 },
//                                 { id: 17, itemName: 'Trail Mix', itemCost: 7.50, storeName: 'Trader Joes', datePurchased: '2026-01-14', category: 'Snacks', quantity: 1 },
//                                 { id: 18, itemName: 'Pasta', itemCost: 2.99, storeName: 'Trader Joes', datePurchased: '2026-01-17', category: 'Pantry', quantity: 1 },
//                                 { id: 19, itemName: 'Marinara Sauce', itemCost: 3.99, storeName: 'Trader Joes', datePurchased: '2026-01-17', category: 'Pantry', quantity: 1 },
//                                 { id: 20, itemName: 'Cashew Cheese', itemCost: 5.99, storeName: 'Trader Joes', datePurchased: '2026-01-19', category: 'Dairy', quantity: 1 },
//                                 { id: 21, itemName: 'Dark Chocolate', itemCost: 3.99, storeName: 'Trader Joes', datePurchased: '2026-01-21', category: 'Snacks', quantity: 1 },
//                                 { id: 22, itemName: 'Hummus', itemCost: 4.50, storeName: 'Trader Joes', datePurchased: '2026-01-23', category: 'Deli', quantity: 1 },
//                                 { id: 23, itemName: 'Cauliflower Rice', itemCost: 3.99, storeName: 'Trader Joes', datePurchased: '2026-01-26', category: 'Frozen', quantity: 1 },
//                                 { id: 24, itemName: 'Coffee Beans', itemCost: 9.99, storeName: 'Trader Joes', datePurchased: '2026-01-28', category: 'Beverages', quantity: 1 },
//                                 { id: 25, itemName: 'Frozen Pizza', itemCost: 5.99, storeName: 'Trader Joes', datePurchased: '2026-01-29', category: 'Frozen', quantity: 1 },
//                                 { id: 26, itemName: 'Pita Bread', itemCost: 3.50, storeName: 'Trader Joes', datePurchased: '2026-01-30', category: 'Bakery', quantity: 1 },
//                                 { id: 27, itemName: 'Coconut Water', itemCost: 7.99, storeName: 'Trader Joes', datePurchased: '2026-01-30', category: 'Beverages', quantity: 1 },
//                                 { id: 28, itemName: 'Protein Bars', itemCost: 9.99, storeName: 'Trader Joes', datePurchased: '2026-01-31', category: 'Snacks', quantity: 1 }
//                             ]
//                         },
//                         {
//                             storeName: 'Costco',
//                             items: [
//                                 { id: 29, itemName: 'Bananas', itemCost: 8.50, storeName: 'Costco', datePurchased: '2026-01-03', category: 'Produce', quantity: 1 },
//                                 { id: 30, itemName: 'Paper Towels', itemCost: 24.99, storeName: 'Costco', datePurchased: '2026-01-03', category: 'Household', quantity: 1 },
//                                 { id: 31, itemName: 'Chicken Thighs', itemCost: 19.99, storeName: 'Costco', datePurchased: '2026-01-16', category: 'Meat', quantity: 1 },
//                                 { id: 32, itemName: 'Olive Oil', itemCost: 11.52, storeName: 'Costco', datePurchased: '2026-01-16', category: 'Pantry', quantity: 1 }
//                             ]
//                         }
//                     ],
//                     sections: [
//                         { id: 1, name: 'Produce', budgetAmount: 150, items: [] },
//                         { id: 2, name: 'Meat & Seafood', budgetAmount: 200, items: [] },
//                         { id: 3, name: 'Dairy', budgetAmount: 100, items: [] },
//                         { id: 4, name: 'Bakery', budgetAmount: 50, items: [] },
//                         { id: 5, name: 'Pantry', budgetAmount: 80, items: [] },
//                         { id: 6, name: 'Frozen', budgetAmount: 40, items: [] },
//                         { id: 7, name: 'Snacks', budgetAmount: 30, items: [] },
//                         { id: 8, name: 'Beverages', budgetAmount: 25, items: [] },
//                         { id: 9, name: 'Household', budgetAmount: 25, items: [] }
//                     ],
//                     plannedItems: [
//                         { itemName: 'Organic Apples', estimatedCost: 12.50 },
//                         { itemName: 'Chicken Breast', estimatedCost: 25.00 }
//                     ]
//                 }
//             ];
//
//             // Simulate API delay
//             setTimeout(() => {
//                 setBudgets(dummyBudgets);
//                 setSelectedBudget(dummyBudgets[0]);
//                 setLoading(false);
//             }, 500);
//
//         } catch (err) {
//             console.error('Error loading budgets:', err);
//             setError('Failed to load budgets. Please try again.');
//             setLoading(false);
//         }
//     };
//
//     const showRightPanel = ['week', 'receiptDetail', 'analytics', 'groceryList'].includes(viewMode);
//
//     const handleReceiptSelect = (receipt: ReceiptSummary) => {
//         setSelectedReceipt(receipt);
//     };
//
//     const handleViewModeChange = (mode: ViewMode) => {
//         setViewMode(mode);
//         setSelectedReceipt(null);
//         setSelectedWeek(null);
//     };
//
//     const handleWeekSelect = (week: WeekData) => {
//         setSelectedWeek(week);
//         setSelectedReceipt(null);
//     };
//
//     const theme = useTheme();
//
//     return (
//         <Box sx={{
//             maxWidth: 'calc(100% - 240px)',
//             ml: '240px',
//             minHeight: '100vh',
//             background: '#f9fafc',
//             backgroundImage: 'radial-gradient(rgba(0, 0, 120, 0.01) 2px, transparent 2px)',
//             backgroundSize: '40px 40px'
//         }}>
//             <Sidebar />
//
//             <Container maxWidth="xl" sx={{ py: 4 }}>
//                 {/* Header Section */}
//                 <Grow in={animateIn} timeout={600}>
//                     <Box sx={{
//                         display: 'flex',
//                         justifyContent: 'space-between',
//                         alignItems: 'center',
//                         mb: 4,
//                         flexDirection: { xs: 'column', sm: 'row' },
//                         textAlign: { xs: 'center', sm: 'left' },
//                         gap: 2
//                     }}>
//                         <Box>
//                             <Typography variant="h4" component="h1" sx={{
//                                 fontWeight: 800,
//                                 color: theme.palette.text.primary,
//                                 letterSpacing: '-0.025em'
//                             }}>
//                                 {format(currentMonth, 'MMMM yyyy')} Groceries
//                             </Typography>
//                             <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
//                                 Track your grocery spending and manage budgets
//                             </Typography>
//                         </Box>
//
//                         {/* Month Navigation + Action Buttons */}
//                         <Box sx={{
//                             display: 'flex',
//                             alignItems: 'center',
//                             gap: 1
//                         }}>
//                             <IconButton
//                                 onClick={handlePreviousMonth}
//                                 disabled={loading}
//                                 sx={{
//                                     bgcolor: alpha(theme.palette.primary.main, 0.1),
//                                     color: theme.palette.primary.main,
//                                     '&:hover': {
//                                         bgcolor: alpha(theme.palette.primary.main, 0.2),
//                                     }
//                                 }}
//                             >
//                                 <ChevronLeft />
//                             </IconButton>
//
//                             <Card sx={{
//                                 px: 2.5,
//                                 py: 1,
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 borderRadius: 2,
//                                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
//                             }}>
//                                 <Calendar size={18} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
//                                 <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
//                                     {format(currentMonth, 'MMMM yyyy')}
//                                 </Typography>
//                             </Card>
//
//                             <IconButton
//                                 onClick={handleNextMonth}
//                                 disabled={loading}
//                                 sx={{
//                                     bgcolor: alpha(theme.palette.primary.main, 0.1),
//                                     color: theme.palette.primary.main,
//                                     '&:hover': {
//                                         bgcolor: alpha(theme.palette.primary.main, 0.2),
//                                     }
//                                 }}
//                             >
//                                 <ChevronRight />
//                             </IconButton>
//
//                             <Button
//                                 variant={currentView === 'create' ? 'contained' : 'outlined'}
//                                 startIcon={<Plus size={18} />}
//                                 onClick={handleCreateNew}
//                                 sx={{
//                                     ml: 1,
//                                     borderRadius: 2,
//                                     textTransform: 'none',
//                                     fontWeight: 600,
//                                     ...(currentView === 'create' ? {
//                                         background: gradients.green,
//                                         boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
//                                         '&:hover': {
//                                             background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
//                                         }
//                                     } : {
//                                         borderColor: alpha(theme.palette.divider, 0.8),
//                                         color: theme.palette.text.primary,
//                                         '&:hover': {
//                                             borderColor: theme.palette.primary.main,
//                                             backgroundColor: alpha(theme.palette.primary.main, 0.05)
//                                         }
//                                     })
//                                 }}
//                             >
//                                 Create Budget
//                             </Button>
//
//                             <Button
//                                 variant="outlined"
//                                 startIcon={<Camera size={18} />}
//                                 onClick={() => setReceiptScanDialogOpen(true)}
//                                 disabled={!selectedBudget}
//                                 sx={{
//                                     ml: 1,
//                                     borderRadius: 2,
//                                     textTransform: 'none',
//                                     fontWeight: 600,
//                                     borderColor: alpha(theme.palette.divider, 0.8),
//                                     color: theme.palette.text.primary,
//                                     '&:hover': {
//                                         borderColor: '#7c3aed',
//                                         backgroundColor: alpha('#7c3aed', 0.05)
//                                     },
//                                     '&.Mui-disabled': {
//                                         borderColor: alpha(theme.palette.divider, 0.3),
//                                         color: theme.palette.text.disabled
//                                     }
//                                 }}
//                             >
//                                 Scan Receipt
//                             </Button>
//
//                             <Button
//                                 variant="outlined"
//                                 startIcon={<ListIcon size={18} />}
//                                 onClick={() => setGroceryListDialogOpen(true)}
//                                 disabled={!selectedBudget}
//                                 endIcon={
//                                     savedGroceryList.length > 0 ? (
//                                         <Chip
//                                             label={savedGroceryList.length}
//                                             size="small"
//                                             sx={{
//                                                 height: 20,
//                                                 fontSize: '0.7rem',
//                                                 bgcolor: alpha('#0d9488', 0.2),
//                                                 color: '#0d9488'
//                                             }}
//                                         />
//                                     ) : null
//                                 }
//                                 sx={{
//                                     ml: 1,
//                                     borderRadius: 2,
//                                     textTransform: 'none',
//                                     fontWeight: 600,
//                                     borderColor: alpha(theme.palette.divider, 0.8),
//                                     color: theme.palette.text.primary,
//                                     '&:hover': {
//                                         borderColor: '#0d9488',
//                                         backgroundColor: alpha('#0d9488', 0.05)
//                                     },
//                                     '&.Mui-disabled': {
//                                         borderColor: alpha(theme.palette.divider, 0.3),
//                                         color: theme.palette.text.disabled
//                                     }
//                                 }}
//                             >
//                                 Grocery List
//                             </Button>
//                         </Box>
//                     </Box>
//                 </Grow>
//
//                 {/* Error Alert */}
//                 {error && (
//                     <Grow in={true} timeout={800}>
//                         <Alert
//                             severity="error"
//                             sx={{
//                                 mb: 3,
//                                 borderRadius: 3,
//                                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
//                             }}
//                             onClose={() => setError('')}
//                         >
//                             {error}
//                         </Alert>
//                     </Grow>
//                 )}
//
//                 {/* Main Content */}
//                 <Grow in={animateIn} timeout={900}>
//                     <Box>
//                         {currentView === 'table' && selectedBudget && (
//                             <Grid container spacing={3}>
//                                 <Grid item xs={12} lg={8}>
//                                     <GroceryBudgetTable
//                                         budget={transformBudgetData(selectedBudget)}
//                                         viewMode={viewMode}
//                                         onViewModeChange={handleViewModeChange}
//                                         onReceiptSelect={handleReceiptSelect}
//                                         onWeekSelect={handleWeekSelect}
//                                     />
//                                 </Grid>
//                                 {showRightPanel && (
//                                     <Grid item xs={12} lg={4}>
//                                         <Box sx={{ position: 'sticky', top: 24 }}>
//                                             {viewMode === 'week' && (
//                                                 <GroceryBudgetStatsPanel budget={transformBudgetData(selectedBudget)} />
//                                             )}
//                                             {viewMode === 'receiptDetail' && (
//                                                 <ReceiptDetailPanel
//                                                     receipt={selectedReceipt}
//                                                     weekReceipts={selectedReceipt ? weeklyData
//                                                         .find(w => w.weekNumber === selectedReceipt.weekNumber)
//                                                         ?.receipts || [] : []}
//                                                 />
//                                             )}
//                                             {viewMode === 'analytics' && (
//                                                 <GroceryAnalyticsPanel budget={transformBudgetData(selectedBudget)} />
//                                             )}
//                                             {viewMode === 'groceryList' && (
//                                                 <GroceryListStatsPanel budget={transformBudgetData(selectedBudget)} />
//                                             )}
//                                         </Box>
//                                     </Grid>
//                                 )}
//                             </Grid>
//                         )}
//                         <GroceryBudgetCreate
//                             open={createDialogOpen}
//                             onSuccess={handleBudgetCreateSuccess}
//                             onClose={() => setCreateDialogOpen(false)}
//                         />
//                         <GroceryListDialog
//                             open={groceryListDialogOpen}
//                             onClose={() => setGroceryListDialogOpen(false)}
//                             budgets={dummyBudgets}
//                             onSave={handleSaveGroceryList}
//                         />
//                         <ReceiptScanDialog
//                             open={receiptScanDialogOpen}
//                             onClose={() => setReceiptScanDialogOpen(false)}
//                             budgets={dummyBudgets}
//                             onUpload={handleReceiptUpload}
//                         />
//                     </Box>
//                 </Grow>
//             </Container>
//         </Box>
//     );
// };
//
// export default GroceryTracker;
// // import {useEffect, useState} from "react";
// // import {GroceryBudget, GroceryBudgetWithTotals} from "../config/Types";
// // import {
// //     Alert, alpha,
// //     AppBar,
// //     Box,
// //     Button, Card, Chip,
// //     Container, FormControl, Grid,
// //     Grow, IconButton, InputLabel, MenuItem, Select,
// //     Stack,
// //     Tab,
// //     Tabs,
// //     Toolbar,
// //     Typography,
// //     useTheme
// // } from "@mui/material";
// // import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
// // import {GroceryBudgetCreate} from "./GroceryBudgetCreate";
// // import {GroceryBudgetList} from "./GroceryBudgetList";
// // import {BudgetComparisonView} from "./BudgetComparisonView";
// // import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
// // import AddIcon from "@mui/icons-material/Add";
// // import {
// //     ShoppingCart,
// //     List,
// //     Plus,
// //     TrendingUp,
// //     ArrowLeft, Calendar, ChevronRight, ChevronLeft, ListIcon
// // } from 'lucide-react';
// // import Sidebar from "./Sidebar";
// // import GroceryBudgetTable, {ReceiptSummary, WeekData} from "./GroceryBudgetTable";
// // import { addMonths, format, subMonths } from 'date-fns';
// // import ReceiptDetailPanel from "./ReceiptDetailPanel";
// // // import GroceryBudgetDetailPanel from "./GroceryBudgetDetailPanel";
// // import AssignmentIcon from "@mui/icons-material/Assignment";
// // import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
// // import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
// // import GroceryBudgetStatsPanel from "./GroceryBudgetStatsPanel";
// // import GroceryAnalyticsPanel from "./GroceryAnalyticsPanel";
// // import GroceryListDialog, { GroceryListItem} from './GroceryListDialog';
// // import GroceryOptimization from "./GroceryOptimization";
// //
// // type GroceryTrackerView = 'table' | 'create' | 'compare';
// // export type ViewMode = 'week' | 'receiptDetail' | 'budgetDetail' | 'analytics';
// //
// // const gradients = {
// //     blue: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
// //     green: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
// //     purple: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
// //     orange: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
// //     indigo: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
// //     teal: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
// //     maroon: 'linear-gradient(135deg, #800000 0%, #a00000 100%)'
// // };
// //
// // const GroceryTracker: React.FC = () => {
// //     const [currentView, setCurrentView] = useState<GroceryTrackerView>('table');
// //     const [selectedBudget, setSelectedBudget] = useState<GroceryBudget | null>(null);
// //     const [budgets, setBudgets] = useState<GroceryBudget[]>([]);
// //     const [loading, setLoading] = useState<boolean>(true);
// //     const [error, setError] = useState<string>('');
// //     const [tabValue, setTabValue] = useState(0);
// //     const [animateIn, setAnimateIn] = useState(false);
// //     const [selectedBudgetId, setSelectedBudgetId] = useState<number>(1);
// //     const [currentMonth, setCurrentMonth] = useState(new Date());
// //     const [selectedReceipt, setSelectedReceipt] = useState<ReceiptSummary | null>(null);
// //     const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);
// //     const [viewMode, setViewMode] = useState<ViewMode>('week');
// //     const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
// //     const [weekReceipts, setWeekReceipts] = useState<ReceiptSummary[]>([]);
// //     const [groceryListDialogOpen, setGroceryListDialogOpen] = useState(false);
// //     const [savedGroceryList, setSavedGroceryList] = useState<GroceryListItem[]>([]);
// //     const [weeklyData, setWeeklyData] = useState<WeekData[]>([]); // For week options
// //
// //
// //     const handleViewBudget = (budget: GroceryBudget) => {
// //         setSelectedBudget(budget);
// //         setCurrentView('table');
// //     };
// //
// //     // Update your handleReceiptSelect function to also set weekReceipts
// //
// //     const handleCreateNew = () => {
// //         setCreateDialogOpen(true);
// //     };
// //
// // // Update the component props
// //     const handleBudgetCreateSuccess = () => {
// //         setCreateDialogOpen(false);
// //         loadBudgets();
// //     };
// //
// //     const handleSaveGroceryList = (items: GroceryListItem[], budgetId: number) => {
// //         console.log('Saved grocery list to budget:', budgetId);
// //         console.log('Items:', items);
// //         setGroceryListDialogOpen(false);
// //         // TODO: Save to backend or state
// //     };
// //
// //
// //     useEffect(() => {
// //         document.title = 'Grocery Tracker';
// //         setTimeout(() => setAnimateIn(true), 100);
// //         loadBudgets();
// //
// //         return () => {
// //             document.title = "BudgetBuddy";
// //         };
// //     }, []);
// //
// //     const transformBudgetData = (budget: GroceryBudget): GroceryBudgetWithTotals => {
// //         const totalSpent = budget.stores.reduce((sum, store) => {
// //             return sum + store.items.reduce((storeSum, item) => storeSum + item.itemCost, 0);
// //         }, 0);
// //
// //         // Force type narrowing for id
// //         const id: number = budget.id ?? 0;
// //
// //         // Explicitly type the result to satisfy Required<>
// //         const result: GroceryBudgetWithTotals = {
// //             id,
// //             name: budget.name,
// //             budgetAmount: budget.budgetAmount,
// //             totalSpent,
// //             startDate: budget.startDate,
// //             endDate: budget.endDate,
// //             savingsGoal: budget.savingsGoal,
// //             subBudgetId: budget.subBudgetId,
// //             plannedItems: budget.plannedItems,
// //             stores: budget.stores.map(store => ({
// //                 storeName: store.storeName,
// //                 totalSpent: store.items.reduce((sum, item) => sum + item.itemCost, 0),
// //                 items: store.items
// //             })),
// //             sections: budget.sections
// //         };
// //
// //         return result;
// //     };
// //
// //     const handlePreviousMonth = () => {
// //         setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
// //     };
// //
// //     const handleNextMonth = () => {
// //         setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
// //     };
// //
// //     const dummyBudgets = [
// //         { id: 1, name: 'Week 1: 02/01/26 - 02/07/26', budgetAmount: 600 },
// //         { id: 2, name: 'Week 2: 02/08/26 - 02/15/26', budgetAmount: 700 },
// //         { id: 3, name: 'Week 3: 02/16/26 - 02/23/26', budgetAmount: 150 }
// //     ];
// //
// //     const loadBudgets = async () => {
// //         try {
// //             setLoading(true);
// //             // Dummy data matching the actual GroceryBudget interface
// //             const dummyBudgets: GroceryBudget[] = [
// //                 {
// //                     id: 1,
// //                     name: 'January 2026 Groceries',
// //                     budgetAmount: 600,
// //                     startDate: '2026-01-01',
// //                     endDate: '2026-01-31',
// //                     subBudgetId: 1,
// //                     savingsGoal: 100,
// //                     stores: [
// //                         {
// //                             storeName: 'Whole Foods',
// //                             items: [
// //                                 {
// //                                     id: 1,
// //                                     itemName: 'Organic Apples',
// //                                     itemCost: 12.50,
// //                                     itemDescription: '2 lb bag of organic apples',
// //                                     storeName: 'Whole Foods',
// //                                     datePurchased: '2026-01-05',
// //                                     category: 'Produce',
// //                                     quantity: 1
// //                                 },
// //                                 {
// //                                     id: 2,
// //                                     itemName: 'Chicken Breast',
// //                                     itemCost: 25.00,
// //                                     itemDescription: 'Organic free-range chicken breast',
// //                                     storeName: 'Whole Foods',
// //                                     datePurchased: '2026-01-05',
// //                                     category: 'Meat',
// //                                     quantity: 2
// //                                 }
// //                             ]
// //                         },
// //                         {
// //                             storeName: 'Trader Joes',
// //                             items: [
// //                                 {
// //                                     id: 3,
// //                                     itemName: 'Almond Milk',
// //                                     itemCost: 3.99,
// //                                     itemDescription: 'Unsweetened almond milk',
// //                                     storeName: 'Trader Joes',
// //                                     datePurchased: '2026-01-08',
// //                                     category: 'Dairy',
// //                                     quantity: 1
// //                                 },
// //                                 {
// //                                     id: 4,
// //                                     itemName: 'Everything Bagels',
// //                                     itemCost: 4.50,
// //                                     storeName: 'Trader Joes',
// //                                     datePurchased: '2026-01-08',
// //                                     category: 'Bakery',
// //                                     quantity: 1
// //                                 }
// //                             ]
// //                         }
// //                     ],
// //                     sections: [
// //                         {
// //                             id: 1,
// //                             name: 'Produce',
// //                             budgetAmount: 150,
// //                             items: [
// //                                 {
// //                                     id: 1,
// //                                     itemName: 'Organic Apples',
// //                                     itemCost: 12.50,
// //                                     storeName: 'Whole Foods',
// //                                     datePurchased: '2026-01-05',
// //                                     category: 'Produce',
// //                                     quantity: 1
// //                                 }
// //                             ]
// //                         },
// //                         {
// //                             id: 2,
// //                             name: 'Meat & Seafood',
// //                             budgetAmount: 200,
// //                             items: [
// //                                 {
// //                                     id: 2,
// //                                     itemName: 'Chicken Breast',
// //                                     itemCost: 25.00,
// //                                     storeName: 'Whole Foods',
// //                                     datePurchased: '2026-01-05',
// //                                     category: 'Meat',
// //                                     quantity: 2
// //                                 }
// //                             ]
// //                         },
// //                         {
// //                             id: 3,
// //                             name: 'Dairy',
// //                             budgetAmount: 100,
// //                             items: [
// //                                 {
// //                                     id: 3,
// //                                     itemName: 'Almond Milk',
// //                                     itemCost: 3.99,
// //                                     storeName: 'Trader Joes',
// //                                     datePurchased: '2026-01-08',
// //                                     category: 'Dairy',
// //                                     quantity: 1
// //                                 }
// //                             ]
// //                         }
// //                     ],
// //                     plannedItems: [
// //                         { itemName: 'Organic Apples', estimatedCost: 12.50 },
// //                         { itemName: 'Chicken Breast', estimatedCost: 25.00 },
// //                         { itemName: 'Almond Milk', estimatedCost: 3.99 },
// //                         { itemName: 'Whole Grain Bread', estimatedCost: 5.00 }
// //                     ]
// //                 },
// //                 {
// //                     id: 2,
// //                     name: 'December 2025 Groceries',
// //                     budgetAmount: 700,
// //                     startDate: '2025-12-01',
// //                     endDate: '2025-12-31',
// //                     subBudgetId: 2,
// //                     savingsGoal: 150,
// //                     stores: [
// //                         {
// //                             storeName: 'Costco',
// //                             items: [
// //                                 {
// //                                     id: 5,
// //                                     itemName: 'Bananas',
// //                                     itemCost: 8.50,
// //                                     itemDescription: 'Bunch of organic bananas',
// //                                     storeName: 'Costco',
// //                                     datePurchased: '2025-12-03',
// //                                     category: 'Produce',
// //                                     quantity: 3
// //                                 },
// //                                 {
// //                                     id: 6,
// //                                     itemName: 'Salmon Fillet',
// //                                     itemCost: 35.00,
// //                                     itemDescription: 'Wild-caught salmon',
// //                                     storeName: 'Costco',
// //                                     datePurchased: '2025-12-10',
// //                                     category: 'Seafood',
// //                                     quantity: 1
// //                                 }
// //                             ]
// //                         }
// //                     ],
// //                     sections: [
// //                         {
// //                             id: 4,
// //                             name: 'Produce',
// //                             budgetAmount: 150,
// //                             items: [
// //                                 {
// //                                     id: 5,
// //                                     itemName: 'Bananas',
// //                                     itemCost: 8.50,
// //                                     storeName: 'Costco',
// //                                     datePurchased: '2025-12-03',
// //                                     category: 'Produce',
// //                                     quantity: 3
// //                                 }
// //                             ]
// //                         },
// //                         {
// //                             id: 5,
// //                             name: 'Meat & Seafood',
// //                             budgetAmount: 250,
// //                             items: [
// //                                 {
// //                                     id: 6,
// //                                     itemName: 'Salmon Fillet',
// //                                     itemCost: 35.00,
// //                                     storeName: 'Costco',
// //                                     datePurchased: '2025-12-10',
// //                                     category: 'Seafood',
// //                                     quantity: 1
// //                                 }
// //                             ]
// //                         }
// //                     ],
// //                     plannedItems: [
// //                         { itemName: 'Bananas', estimatedCost: 8.50 },
// //                         { itemName: 'Salmon Fillet', estimatedCost: 35.00 },
// //                         { itemName: 'Greek Yogurt', estimatedCost: 7.99 }
// //                     ]
// //                 },
// //                 {
// //                     id: 3,
// //                     name: 'Weekly Budget - Week 4',
// //                     budgetAmount: 150,
// //                     startDate: '2026-01-20',
// //                     endDate: '2026-01-26',
// //                     subBudgetId: 3,
// //                     savingsGoal: 25,
// //                     stores: [
// //                         {
// //                             storeName: 'Local Market',
// //                             items: [
// //                                 {
// //                                     id: 7,
// //                                     itemName: 'Carrots',
// //                                     itemCost: 6.50,
// //                                     storeName: 'Local Market',
// //                                     datePurchased: '2026-01-21',
// //                                     category: 'Produce',
// //                                     quantity: 2
// //                                 },
// //                                 {
// //                                     id: 8,
// //                                     itemName: 'Pork Chops',
// //                                     itemCost: 18.00,
// //                                     itemDescription: 'Bone-in pork chops',
// //                                     storeName: 'Local Market',
// //                                     datePurchased: '2026-01-22',
// //                                     category: 'Meat',
// //                                     quantity: 1
// //                                 }
// //                             ]
// //                         }
// //                     ],
// //                     sections: [
// //                         {
// //                             id: 6,
// //                             name: 'Produce',
// //                             budgetAmount: 40,
// //                             items: [
// //                                 {
// //                                     id: 7,
// //                                     itemName: 'Carrots',
// //                                     itemCost: 6.50,
// //                                     storeName: 'Local Market',
// //                                     datePurchased: '2026-01-21',
// //                                     category: 'Produce',
// //                                     quantity: 2
// //                                 }
// //                             ]
// //                         },
// //                         {
// //                             id: 7,
// //                             name: 'Meat',
// //                             budgetAmount: 50,
// //                             items: [
// //                                 {
// //                                     id: 8,
// //                                     itemName: 'Pork Chops',
// //                                     itemCost: 18.00,
// //                                     storeName: 'Local Market',
// //                                     datePurchased: '2026-01-22',
// //                                     category: 'Meat',
// //                                     quantity: 1
// //                                 }
// //                             ]
// //                         }
// //                     ],
// //                     plannedItems: [
// //                         { itemName: 'Carrots', estimatedCost: 6.50 },
// //                         { itemName: 'Pork Chops', estimatedCost: 18.00 },
// //                         { itemName: 'Lettuce', estimatedCost: 4.00 }
// //                     ]
// //                 }
// //             ];
// //
// //             // Simulate API delay
// //             setTimeout(() => {
// //                 setBudgets(dummyBudgets);
// //                 setSelectedBudget(dummyBudgets[0]); // <-- AUTO-SELECT FIRST BUDGET
// //                 setLoading(false);
// //             }, 500);
// //
// //         } catch (err) {
// //             console.error('Error loading budgets:', err);
// //             setError('Failed to load budgets. Please try again.');
// //             setLoading(false);
// //         }
// //     };
// //
// //     const showRightPanel = viewMode === 'week' || 'receiptDetail' || viewMode === 'budgetDetail' || viewMode === 'analytics';
// //
// //     const handleBackToList = () => {
// //         setCurrentView('table');
// //         setSelectedBudget(null);
// //         loadBudgets();
// //     };
// //
// //
// //     const handleCompare = () => {
// //         setCurrentView('compare');
// //     };
// //
// //     const handleReceiptSelect = (receipt: ReceiptSummary) => {
// //         setSelectedReceipt(receipt);
// //     };
// //
// //     const handleViewModeChange = (mode: ViewMode) => {
// //         setViewMode(mode);
// //         setSelectedReceipt(null);
// //         setSelectedWeek(null);
// //     };
// //
// //
// //     const handleWeekSelect = (week: WeekData) => {
// //         setSelectedWeek(week);
// //         setSelectedReceipt(null); // Clear receipt selection when selecting week
// //     };
// //
// //
// //     const theme = useTheme();
// //     return (
// //         <Box sx={{
// //             maxWidth: 'calc(100% - 240px)',
// //             ml: '240px',
// //             minHeight: '100vh',
// //             background: '#f9fafc',
// //             backgroundImage: 'radial-gradient(rgba(0, 0, 120, 0.01) 2px, transparent 2px)',
// //             backgroundSize: '40px 40px'
// //         }}>
// //             <Sidebar />
// //
// //             <Container maxWidth="xl" sx={{ py: 4 }}>
// //                 {/* Header Section */}
// //                 <Grow in={animateIn} timeout={600}>
// //                     <Box sx={{
// //                         display: 'flex',
// //                         justifyContent: 'space-between',
// //                         alignItems: 'center',
// //                         mb: 4,
// //                         flexDirection: { xs: 'column', sm: 'row' },
// //                         textAlign: { xs: 'center', sm: 'left' },
// //                         gap: 2
// //                     }}>
// //                         <Box>
// //                             <Typography variant="h4" component="h1" sx={{
// //                                 fontWeight: 800,
// //                                 color: theme.palette.text.primary,
// //                                 letterSpacing: '-0.025em'
// //                             }}>
// //                                 {format(currentMonth, 'MMMM yyyy')} Groceries
// //                             </Typography>
// //                             <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
// //                                 Track your grocery spending and manage budgets
// //                             </Typography>
// //                         </Box>
// //
// //                         {/* Month Navigation + Action Buttons */}
// //                         <Box sx={{
// //                             display: 'flex',
// //                             alignItems: 'center',
// //                             gap: 1
// //                         }}>
// //                             <IconButton
// //                                 onClick={handlePreviousMonth}
// //                                 disabled={loading}
// //                                 sx={{
// //                                     bgcolor: alpha(theme.palette.primary.main, 0.1),
// //                                     color: theme.palette.primary.main,
// //                                     '&:hover': {
// //                                         bgcolor: alpha(theme.palette.primary.main, 0.2),
// //                                     }
// //                                 }}
// //                             >
// //                                 <ChevronLeft />
// //                             </IconButton>
// //
// //                             <Card sx={{
// //                                 px: 2.5,
// //                                 py: 1,
// //                                 display: 'flex',
// //                                 alignItems: 'center',
// //                                 borderRadius: 2,
// //                                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
// //                             }}>
// //                                 <Calendar size={18} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
// //                                 <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
// //                                     {format(currentMonth, 'MMMM yyyy')}
// //                                 </Typography>
// //                             </Card>
// //
// //                             <IconButton
// //                                 onClick={handleNextMonth}
// //                                 disabled={loading}
// //                                 sx={{
// //                                     bgcolor: alpha(theme.palette.primary.main, 0.1),
// //                                     color: theme.palette.primary.main,
// //                                     '&:hover': {
// //                                         bgcolor: alpha(theme.palette.primary.main, 0.2),
// //                                     }
// //                                 }}
// //                             >
// //                                 <ChevronRight />
// //                             </IconButton>
// //
// //                             <Button
// //                                 variant={currentView === 'create' ? 'contained' : 'outlined'}
// //                                 startIcon={<Plus size={18} />}
// //                                 onClick={handleCreateNew}
// //                                 sx={{
// //                                     ml: 1,
// //                                     borderRadius: 2,
// //                                     textTransform: 'none',
// //                                     fontWeight: 600,
// //                                     ...(currentView === 'create' ? {
// //                                         background: gradients.green,
// //                                         boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
// //                                         '&:hover': {
// //                                             background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
// //                                         }
// //                                     } : {
// //                                         borderColor: alpha(theme.palette.divider, 0.8),
// //                                         color: theme.palette.text.primary,
// //                                         '&:hover': {
// //                                             borderColor: theme.palette.primary.main,
// //                                             backgroundColor: alpha(theme.palette.primary.main, 0.05)
// //                                         }
// //                                     })
// //                                 }}
// //                             >
// //                                 Create Budget
// //                             </Button>
// //                             <Button
// //                                 variant="outlined"
// //                                 startIcon={<ListIcon size={18} />}
// //                                 onClick={() => setGroceryListDialogOpen(true)}
// //                                 disabled={!selectedBudget}
// //                                 endIcon={
// //                                     savedGroceryList.length > 0 ? (
// //                                         <Chip
// //                                             label={savedGroceryList.length}
// //                                             size="small"
// //                                             sx={{
// //                                                 height: 20,
// //                                                 fontSize: '0.7rem',
// //                                                 bgcolor: alpha('#0d9488', 0.2),
// //                                                 color: '#0d9488'
// //                                             }}
// //                                         />
// //                                     ) : null
// //                                 }
// //                                 sx={{
// //                                     ml: 1,
// //                                     borderRadius: 2,
// //                                     textTransform: 'none',
// //                                     fontWeight: 600,
// //                                     borderColor: alpha(theme.palette.divider, 0.8),
// //                                     color: theme.palette.text.primary,
// //                                     '&:hover': {
// //                                         borderColor: '#0d9488',
// //                                         backgroundColor: alpha('#0d9488', 0.05)
// //                                     },
// //                                     '&.Mui-disabled': {
// //                                         borderColor: alpha(theme.palette.divider, 0.3),
// //                                         color: theme.palette.text.disabled
// //                                     }
// //                                 }}
// //                             >
// //                                 Grocery List
// //                             </Button>
// //                         </Box>
// //                     </Box>
// //                 </Grow>
// //
// //                 {/* Error Alert */}
// //                 {error && (
// //                     <Grow in={true} timeout={800}>
// //                         <Alert
// //                             severity="error"
// //                             sx={{
// //                                 mb: 3,
// //                                 borderRadius: 3,
// //                                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
// //                             }}
// //                             onClose={() => setError('')}
// //                         >
// //                             {error}
// //                         </Alert>
// //                     </Grow>
// //                 )}
// //
// //                 {/* Main Content */}
// //                 <Grow in={animateIn} timeout={900}>
// //                     <Box>
// //                         {currentView === 'table' && selectedBudget && (
// //                             <Grid container spacing={3}>
// //                                 <Grid item xs={12} lg={8}>
// //                                     <GroceryBudgetTable
// //                                         budget={transformBudgetData(selectedBudget)}
// //                                         viewMode={viewMode}
// //                                         onViewModeChange={handleViewModeChange}
// //                                         onReceiptSelect={handleReceiptSelect}
// //                                         onWeekSelect={handleWeekSelect}
// //                                     />
// //                                 </Grid>
// //                                 {showRightPanel && (
// //                                     <Grid item xs={12} lg={4}>
// //                                         <Box sx={{ position: 'sticky', top: 24 }}>
// //                                             {viewMode === 'week' && (
// //                                                 <GroceryBudgetStatsPanel budget={transformBudgetData(selectedBudget)} />
// //                                             )}
// //                                             {viewMode === 'receiptDetail' && (
// //                                                 <ReceiptDetailPanel receipt={selectedReceipt}
// //                                                                     weekReceipts={selectedReceipt ? [
// //                                                                         selectedReceipt,
// //                                                                         {
// //                                                                             ...selectedReceipt,
// //                                                                             id: 'dummy-1',
// //                                                                             storeName: 'Trader Joes',
// //                                                                             totalCost: 45.50,
// //                                                                             purchaseDate: '2026-01-10'
// //                                                                         },
// //                                                                         {
// //                                                                             ...selectedReceipt,
// //                                                                             id: 'dummy-2',
// //                                                                             storeName: 'Costco',
// //                                                                             totalCost: 89.99,
// //                                                                             purchaseDate: '2026-01-12'
// //                                                                         }
// //                                                                     ] : []}/>
// //                                             )}
// //                                             {/*{viewMode === 'budgetDetail' && (*/}
// //                                             {/*    <GroceryBudgetDetailPanel week={selectedWeek} />*/}
// //                                             {/*)}*/}
// //                                             {viewMode === 'analytics' && (
// //                                                 <GroceryAnalyticsPanel budget={transformBudgetData(selectedBudget)} />
// //                                             )}
// //                                             {viewMode === 'optimization' && (
// //                                                 <GroceryOptimization
// //                                                     budget={budget}
// //                                                     weeklyData={weeklyData}
// //                                                 />
// //                                             )}
// //                                         </Box>
// //                                     </Grid>
// //                                 )}
// //                             </Grid>
// //                         )}
// //                         <GroceryBudgetCreate
// //                             open={createDialogOpen}
// //                             onSuccess={handleBudgetCreateSuccess}
// //                             onClose={() => setCreateDialogOpen(false)}
// //                         />
// //                         <GroceryListDialog
// //                             open={groceryListDialogOpen}
// //                             onClose={() => setGroceryListDialogOpen(false)}
// //                             budgets={dummyBudgets}  // Pass your array of budgets
// //                             onSave={handleSaveGroceryList}
// //                         />
// //                         <GroceryBudgetCreate
// //                             open={createDialogOpen}
// //                             onSuccess={handleBudgetCreateSuccess}
// //                             onClose={() => setCreateDialogOpen(false)}
// //                         />
// //                     </Box>
// //                 </Grow>
// //             </Container>
// //         </Box>
// //     );
// //     // return (
// //     //     <Box sx={{
// //     //         maxWidth: 'calc(100% - 240px)',
// //     //         ml: '240px',
// //     //         minHeight: '100vh',
// //     //         background: '#f9fafc',
// //     //         backgroundImage: 'radial-gradient(rgba(0, 0, 120, 0.01) 2px, transparent 2px)',
// //     //         backgroundSize: '40px 40px'
// //     //     }}>
// //     //         <Sidebar />
// //     //
// //     //         <Container maxWidth="xl" sx={{ py: 4 }}>
// //     //             {/* Header Section */}
// //     //             <Grow in={animateIn} timeout={600}>
// //     //                 <Box sx={{
// //     //                     display: 'flex',
// //     //                     justifyContent: 'space-between',
// //     //                     alignItems: 'center',
// //     //                     mb: 4,
// //     //                     flexDirection: { xs: 'column', sm: 'row' },
// //     //                     textAlign: { xs: 'center', sm: 'left' },
// //     //                     gap: 2
// //     //                 }}>
// //     //                     <Box>
// //     //                         <Typography variant="h4" component="h1" sx={{
// //     //                             fontWeight: 800,
// //     //                             color: theme.palette.text.primary,
// //     //                             letterSpacing: '-0.025em'
// //     //                         }}>
// //     //                             {format(currentMonth, 'MMMM yyyy')} Groceries
// //     //                         </Typography>
// //     //                         <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
// //     //                             Track your grocery spending and manage budgets
// //     //                         </Typography>
// //     //                     </Box>
// //     //
// //     //                     {/* Month Navigation + Action Buttons */}
// //     //                     <Box sx={{
// //     //                         display: 'flex',
// //     //                         alignItems: 'center',
// //     //                         gap: 1
// //     //                     }}>
// //     //                         <IconButton
// //     //                             onClick={handlePreviousMonth}
// //     //                             disabled={loading}
// //     //                             sx={{
// //     //                                 bgcolor: alpha(theme.palette.primary.main, 0.1),
// //     //                                 color: theme.palette.primary.main,
// //     //                                 '&:hover': {
// //     //                                     bgcolor: alpha(theme.palette.primary.main, 0.2),
// //     //                                 }
// //     //                             }}
// //     //                         >
// //     //                             <ChevronLeft />
// //     //                         </IconButton>
// //     //
// //     //                         <Card sx={{
// //     //                             px: 2.5,
// //     //                             py: 1,
// //     //                             display: 'flex',
// //     //                             alignItems: 'center',
// //     //                             borderRadius: 2,
// //     //                             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
// //     //                         }}>
// //     //                             <Calendar size={18} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
// //     //                             <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
// //     //                                 {format(currentMonth, 'MMMM yyyy')}
// //     //                             </Typography>
// //     //                         </Card>
// //     //
// //     //                         <IconButton
// //     //                             onClick={handleNextMonth}
// //     //                             disabled={loading}
// //     //                             sx={{
// //     //                                 bgcolor: alpha(theme.palette.primary.main, 0.1),
// //     //                                 color: theme.palette.primary.main,
// //     //                                 '&:hover': {
// //     //                                     bgcolor: alpha(theme.palette.primary.main, 0.2),
// //     //                                 }
// //     //                             }}
// //     //                         >
// //     //                             <ChevronRight />
// //     //                         </IconButton>
// //     //
// //     //                         <Button
// //     //                             variant={currentView === 'create' ? 'contained' : 'outlined'}
// //     //                             startIcon={<Plus size={18} />}
// //     //                             onClick={handleCreateNew}
// //     //                             sx={{
// //     //                                 ml: 1,
// //     //                                 borderRadius: 2,
// //     //                                 textTransform: 'none',
// //     //                                 fontWeight: 600,
// //     //                                 ...(currentView === 'create' ? {
// //     //                                     background: gradients.green,
// //     //                                     boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
// //     //                                     '&:hover': {
// //     //                                         background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
// //     //                                     }
// //     //                                 } : {
// //     //                                     borderColor: alpha(theme.palette.divider, 0.8),
// //     //                                     color: theme.palette.text.primary,
// //     //                                     '&:hover': {
// //     //                                         borderColor: theme.palette.primary.main,
// //     //                                         backgroundColor: alpha(theme.palette.primary.main, 0.05)
// //     //                                     }
// //     //                                 })
// //     //                             }}
// //     //                         >
// //     //                             Create Budget
// //     //                         </Button>
// //     //                     </Box>
// //     //                 </Box>
// //     //             </Grow>
// //     //
// //     //             {/* Error Alert */}
// //     //             {error && (
// //     //                 <Grow in={true} timeout={800}>
// //     //                     <Alert
// //     //                         severity="error"
// //     //                         sx={{
// //     //                             mb: 3,
// //     //                             borderRadius: 3,
// //     //                             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
// //     //                         }}
// //     //                         onClose={() => setError('')}
// //     //                     >
// //     //                         {error}
// //     //                     </Alert>
// //     //                 </Grow>
// //     //             )}
// //     //
// //     //             {/* Main Content */}
// //     //             <Grow in={animateIn} timeout={900}>
// //     //                 <Box>
// //     //                     {currentView === 'table' && selectedBudget && (
// //     //                         <Grid container spacing={3}>
// //     //                             <Grid item xs={12} lg={8}>
// //     //                                 <GroceryBudgetTable
// //     //                                     budget={transformBudgetData(selectedBudget)}
// //     //                                     viewMode={viewMode}
// //     //                                     onViewModeChange={handleViewModeChange}
// //     //                                     onReceiptSelect={handleReceiptSelect}
// //     //                                     onWeekSelect={handleWeekSelect}
// //     //                                 />
// //     //                             </Grid>
// //     //                             {showRightPanel && (
// //     //                                 <Grid item xs={12} lg={4}>
// //     //                                     <Box sx={{ position: 'sticky', top: 24 }}>
// //     //                                         {viewMode === 'week' && (
// //     //                                             <GroceryBudgetStatsPanel budget={transformBudgetData(selectedBudget)} />
// //     //                                         )}
// //     //                                         {viewMode === 'receiptDetail' && (
// //     //                                             <ReceiptDetailPanel receipt={selectedReceipt} />
// //     //                                         )}
// //     //                                         {viewMode === 'budgetDetail' && (
// //     //                                             <GroceryBudgetDetailPanel week={selectedWeek} />
// //     //                                         )}
// //     //                                     </Box>
// //     //                                 </Grid>
// //     //                             )}
// //     //                         </Grid>
// //     //                     )}
// //     //                     <GroceryBudgetCreate
// //     //                         open={createDialogOpen}
// //     //                         onSuccess={handleBudgetCreateSuccess}
// //     //                         onClose={() => setCreateDialogOpen(false)}
// //     //                     />
// //     //                 </Box>
// //     //             </Grow>
// //     //         </Container>
// //     //     </Box>
// //     // );
// // };
// //
// // export default GroceryTracker;