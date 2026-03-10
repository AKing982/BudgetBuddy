import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
    Box, Button, Grid, Typography, Card, IconButton, alpha, Container,
    Grow, Stack, Snackbar, Alert, LinearProgress, Divider, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Tabs, Tab, CircularProgress, Chip, Slider, TextField, Select, MenuItem, InputAdornment,
} from '@mui/material';
import {
    Calendar, Upload, Receipt, TrendingUp, TrendingDown, ShoppingCart,
    Coffee, Utensils, Car, Home, Zap, ShoppingBag, Minus, BarChart2,
    FileText, X, PiggyBank, ChevronLeft, ChevronRight, Plus, Camera,
    List, Wallet, Brain, Target, Activity, DollarSign, Layers, ArrowRight,
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
    addMonths, format, subMonths, parseISO, endOfWeek,
    isWithinInterval, addWeeks, differenceInWeeks,
} from 'date-fns';
import Sidebar from './Sidebar';
import { GroceryBudget, GroceryBudgetWithTotals } from '../config/Types';
import GroceryBudgetTable, { ReceiptSummary, WeekData } from './GroceryBudgetTable';
import ReceiptDetailPanel from './ReceiptDetailPanel';
import GroceryBudgetStatsPanel from './GroceryBudgetStatsPanel';
import GroceryAnalyticsPanel from './GroceryAnalyticsPanel';
import GroceryListStatsPanel from './GroceryListStatsPanel';
import GroceryListDialog, { GroceryListItem } from './GroceryListDialog';
import ReceiptScanDialog from './ReceiptScanDialog';
import { GroceryBudgetCreate } from './GroceryBudgetCreate';

// ── Design tokens ─────────────────────────────────────────────────────────────
const MAROON      = '#6b1a1a';
const MAROON_DARK = '#4a1010';
const TEAL        = '#0d9488';
const GREEN       = '#059669';
const SLATE       = '#64748b';
const NAVY        = '#1e293b';

// ── Card themes ───────────────────────────────────────────────────────────────
const CARD_THEMES = {
    budget: {
        base: '#f0f4ff', border: '#6b1a1a', valueColor: '#1e1e2e',
        barColor: '#6b1a1a', chipBg: 'rgba(128,0,0,0.10)', chipColor: '#6b1a1a', labelColor: '#5a5a7a',
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
    saved_good: {
        base: '#f0f9ff', border: '#0284c7', valueColor: '#0c4a6e',
        barColor: '#0284c7', chipBg: 'rgba(2,132,199,0.12)', chipColor: '#075985', labelColor: '#3a6070',
    },
    saved_low: {
        base: '#fafafa', border: '#94a3b8', valueColor: '#334155',
        barColor: '#94a3b8', chipBg: 'rgba(148,163,184,0.15)', chipColor: '#475569', labelColor: '#64748b',
    },
};

// ── Spending category config ──────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
    Groceries: '#16a34a', Dining: '#d97706', Transport: '#0284c7',
    Housing: '#7c3aed', Utilities: '#db2777', Shopping: '#ea580c',
    Entertainment: '#0891b2', Coffee: '#92400e', Other: '#64748b',
};
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    Groceries: <ShoppingCart size={14} />, Dining: <Utensils size={14} />,
    Transport: <Car size={14} />, Housing: <Home size={14} />,
    Utilities: <Zap size={14} />, Shopping: <ShoppingBag size={14} />,
    Entertainment: <BarChart2 size={14} />, Coffee: <Coffee size={14} />,
    Other: <Minus size={14} />,
};

// ── Types ─────────────────────────────────────────────────────────────────────
type PeriodKey = 'daily' | 'weekly' | 'biweekly' | 'monthly';
type GroceryViewMode = 'week' | 'receiptDetail' | 'analytics' | 'groceryList';

interface SpendingRow {
    date: string; label: string; total: number;
    Groceries: number; Dining: number; Transport: number; Housing: number;
    Utilities: number; Shopping: number; Entertainment: number; Coffee: number; Other: number;
}
interface ReceiptItem {
    id: string; name: string; amount: number; category: string; date: string; merchant: string;
}

// ── Mock spending data ────────────────────────────────────────────────────────
function makeDailyData(days: number): SpendingRow[] {
    const arr: SpendingRow[] = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        arr.push({
            date: d.toISOString().split('T')[0],
            label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            total: Math.round((isWeekend ? 80 : 45) + Math.random() * 60),
            Groceries: Math.round(Math.random() * 35),
            Dining: Math.round((isWeekend ? 20 : 5) + Math.random() * 30),
            Transport: Math.round(Math.random() * 20),
            Housing: i === days - 1 ? 1200 : 0,
            Utilities: i === 3 ? 120 : 0,
            Shopping: Math.round(Math.random() * 40),
            Entertainment: Math.round((isWeekend ? 10 : 0) + Math.random() * 25),
            Coffee: Math.round(Math.random() * 12),
            Other: Math.round(Math.random() * 15),
        });
    }
    return arr;
}
const ALL_DAILY = makeDailyData(90);

const PERIODS: { key: PeriodKey; label: string }[] = [
    { key: 'daily', label: 'Daily' }, { key: 'weekly', label: 'Weekly' },
    { key: 'biweekly', label: 'Bi-Weekly' }, { key: 'monthly', label: 'Monthly' },
];

function aggregateByPeriod(data: SpendingRow[], period: PeriodKey): SpendingRow[] {
    if (period === 'daily') return data.slice(-30);
    const size = period === 'weekly' ? 7 : period === 'biweekly' ? 14 : 30;
    const out: SpendingRow[] = [];
    for (let i = 0; i < data.length; i += size) {
        const slice = data.slice(i, i + size);
        if (!slice.length) break;
        out.push({
            date: slice[0].date,
            label: slice.length === 1 ? slice[0].label : `${slice[0].label} – ${slice[slice.length - 1].label}`,
            total: slice.reduce((s, r) => s + r.total, 0),
            Groceries: slice.reduce((s, r) => s + r.Groceries, 0),
            Dining: slice.reduce((s, r) => s + r.Dining, 0),
            Transport: slice.reduce((s, r) => s + r.Transport, 0),
            Housing: slice.reduce((s, r) => s + r.Housing, 0),
            Utilities: slice.reduce((s, r) => s + r.Utilities, 0),
            Shopping: slice.reduce((s, r) => s + r.Shopping, 0),
            Entertainment: slice.reduce((s, r) => s + r.Entertainment, 0),
            Coffee: slice.reduce((s, r) => s + r.Coffee, 0),
            Other: slice.reduce((s, r) => s + r.Other, 0),
        });
    }
    return out;
}

// ── Receipt helpers ───────────────────────────────────────────────────────────
function guessCategory(name: string): string {
    if (/coffee|latte|espresso|starbucks|dunkin/i.test(name)) return 'Coffee';
    if (/restaurant|dining|burger|pizza|sushi|taco|café|cafe|eat|food|meal/i.test(name)) return 'Dining';
    if (/grocery|supermarket|walmart|costco|kroger|whole foods|trader/i.test(name)) return 'Groceries';
    if (/uber|lyft|gas|fuel|parking|transit|metro|bus/i.test(name)) return 'Transport';
    if (/amazon|target|shop|store|mall|clothing|apparel/i.test(name)) return 'Shopping';
    if (/netflix|spotify|movie|cinema|game|entertainment/i.test(name)) return 'Entertainment';
    if (/electric|water|internet|phone|utility|bill/i.test(name)) return 'Utilities';
    if (/rent|mortgage|hoa|lease/i.test(name)) return 'Housing';
    return 'Other';
}
function parseReceiptText(text: string, filename: string): ReceiptItem[] {
    const items: ReceiptItem[] = [];
    const merchant = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})|(\d{2}-\d{2}-\d{4})/);
    const date = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];
    text.split('\n').map(l => l.trim()).filter(Boolean).forEach((line, idx) => {
        const m = line.match(/\$?([\d,]+\.?\d{0,2})/);
        if (!m) return;
        const amount = parseFloat(m[1].replace(',', ''));
        if (amount <= 0 || amount > 5000) return;
        const name = line.replace(/\$?([\d,]+\.?\d{0,2})/, '').replace(/[\t|,]+/g, ' ').trim() || `Item ${idx + 1}`;
        items.push({ id: `${filename}-${idx}`, name, amount, category: guessCategory(name), date, merchant });
    });
    return items;
}

// ── Recharts tooltip ──────────────────────────────────────────────────────────
const ChartTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string }> = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{ bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', p: 1.5, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 150 }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#333', mb: 0.75 }}>{label}</Typography>
            {payload.map((p: any) => (
                <Box key={p.dataKey} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 0.2 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: p.fill || p.color }}>{p.dataKey}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#222' }}>
                        ${(p.value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
};

// ── Maroon gradient panel header ──────────────────────────────────────────────
const PanelHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; right?: React.ReactNode }> = ({ icon, title, subtitle, right }) => (
    <Box sx={{ background: 'linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)', px: 3, py: 2, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ position: 'absolute', bottom: -20, right: 50, width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {icon}
                </Box>
                <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>{title}</Typography>
                    <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>{subtitle}</Typography>
                </Box>
            </Box>
            {right}
        </Box>
    </Box>
);

const Panel: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; right?: React.ReactNode; animateIn: boolean; timeout: number; children: React.ReactNode }> = ({ icon, title, subtitle, right, animateIn, timeout, children }) => (
    <Grow in={animateIn} timeout={timeout}>
        <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}` }}>
            <PanelHeader icon={icon} title={title} subtitle={subtitle} right={right} />
            <Box sx={{ bgcolor: '#fff', p: 3 }}>{children}</Box>
        </Box>
    </Grow>
);

// ── Summary card ──────────────────────────────────────────────────────────────
interface SummaryCardProps {
    themeKey: keyof typeof CARD_THEMES;
    label: string; value: string; sub: string;
    barValue: number; chipLabel: string; chipIcon: React.ReactNode;
}
const SummaryCard: React.FC<SummaryCardProps> = ({ themeKey, label, value, sub, barValue, chipLabel, chipIcon }) => {
    const t = CARD_THEMES[themeKey];
    return (
        <Box sx={{ background: t.base, borderRadius: '10px', borderTop: `3px solid ${t.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', p: 2.5, height: '100%', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' } }}>
            <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.labelColor, fontWeight: 700, mb: 1 }}>{label}</Typography>
            <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: t.valueColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1, mb: 0.5 }}>{value}</Typography>
            <LinearProgress variant="determinate" value={Math.min(Math.max(barValue, 0), 100)} sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(t.barColor, 0.15), '& .MuiLinearProgress-bar': { bgcolor: t.barColor, borderRadius: 2 } }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography sx={{ fontSize: '0.72rem', color: t.labelColor }}>{sub}</Typography>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: t.chipBg, color: t.chipColor, fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {chipIcon} {chipLabel}
                </Box>
            </Box>
        </Box>
    );
};

// ═════════════════════════════════════════════════════════════════════════════
//  SpendingPage — merged with GroceryTracker
// ═════════════════════════════════════════════════════════════════════════════
const SpendingPage: React.FC = () => {

    // ── Shared ────────────────────────────────────────────────────────────────
    const [animateIn, setAnimateIn] = useState(false);
    const [mainTab, setMainTab] = useState(0); // 0 = Spending, 1 = Groceries

    useEffect(() => {
        document.title = 'Spending Tracker';
        setTimeout(() => setAnimateIn(true), 100);
        return () => { document.title = 'BudgetBuddy'; };
    }, []);

    // ── Spending tab state ────────────────────────────────────────────────────
    const [spendingMonth, setSpendingMonth] = useState(new Date());
    const [period, setPeriod] = useState<PeriodKey>('weekly');
    const [selectedDate, setSelectedDate] = useState('');
    const [chartTab, setChartTab] = useState(0);
    const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const [receiptTab, setReceiptTab] = useState(0);
    const [rightPanel, setRightPanel] = useState<'overview' | 'category' | 'savings' | 'forecast'>('overview');
    const [forecastModel, setForecastModel] = useState<'linear' | 'moving' | 'seasonal'>('linear');
    const [savingsGoal, setSavingsGoal] = useState(500);
    const [monthlyIncome, setMonthlyIncome] = useState(4500);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [snackOpen, setSnackOpen] = useState(false);
    const [snackMsg, setSnackMsg] = useState('');
    const [snackSev, setSnackSev] = useState<'success' | 'error'>('success');
    const fileRef = useRef<HTMLInputElement>(null);

    // ── Grocery tab state ─────────────────────────────────────────────────────
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedBudget, setSelectedBudget] = useState<GroceryBudget | null>(null);
    const [groceryLoading, setGroceryLoading] = useState(true);
    const [groceryError, setGroceryError] = useState('');
    const [selectedReceipt, setSelectedReceipt] = useState<ReceiptSummary | null>(null);
    const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);
    const [groceryViewMode, setGroceryViewMode] = useState<GroceryViewMode>('week');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [groceryListDialogOpen, setGroceryListDialogOpen] = useState(false);
    const [receiptScanDialogOpen, setReceiptScanDialogOpen] = useState(false);
    const [savedGroceryList, setSavedGroceryList] = useState<GroceryListItem[]>([]);

    const dummyBudgetList = [
        { id: 1, name: 'Week 1', budgetAmount: 600 },
        { id: 2, name: 'Week 2', budgetAmount: 700 },
        { id: 3, name: 'Week 3', budgetAmount: 150 },
    ];

    // ── Grocery weekly data ────────────────────────────────────────────────────
    const weeklyData = useMemo((): WeekData[] => {
        if (!selectedBudget) return [];
        const start = parseISO(selectedBudget.startDate);
        const end   = parseISO(selectedBudget.endDate);
        const totalWeeks = Math.ceil(differenceInWeeks(end, start)) + 1;
        const weeklyBudget = selectedBudget.budgetAmount / totalWeeks;
        const allItems: any[] = [];
        selectedBudget.stores.forEach(store => store.items.forEach(item => allItems.push({ ...item, storeName: store.storeName })));
        return Array.from({ length: totalWeeks }, (_, i) => {
            const weekStart = addWeeks(start, i);
            const weekEndRaw = endOfWeek(weekStart, { weekStartsOn: 0 });
            const actualWeekEnd = weekEndRaw > end ? end : weekEndRaw;
            const weekItems = allItems.filter(item => isWithinInterval(parseISO(item.datePurchased), { start: weekStart, end: actualWeekEnd }));
            const receiptMap = new Map<string, any[]>();
            weekItems.forEach(item => {
                const key = `${item.storeName}-${item.datePurchased}`;
                if (!receiptMap.has(key)) receiptMap.set(key, []);
                receiptMap.get(key)!.push(item);
            });
            const rpts: ReceiptSummary[] = Array.from(receiptMap.entries()).map(([key, items]) => {
                const [storeName, purchaseDate] = key.split('-');
                return { id: `week${i + 1}-${key}`, storeName, purchaseDate, itemCount: items.length, totalCost: items.reduce((s: number, x: any) => s + x.itemCost, 0), items: items.sort((a: any, b: any) => a.itemName.localeCompare(b.itemName)), weekNumber: i + 1, weekLabel: `Week ${i + 1}` };
            }).sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate));
            const actualSpent = weekItems.reduce((s: number, x: any) => s + x.itemCost, 0);
            return { weekNumber: i + 1, weekLabel: `Week ${i + 1}`, startDate: weekStart, endDate: actualWeekEnd, budgetAmount: weeklyBudget, actualSpent, remaining: weeklyBudget - actualSpent, percentUsed: (actualSpent / weeklyBudget) * 100, receipts: rpts };
        });
    }, [selectedBudget]);

    useEffect(() => { loadBudgets(currentMonth); }, [currentMonth]);

    const loadBudgets = async (month: Date) => {
        try {
            setGroceryLoading(true);
            const yr = month.getFullYear(), mo = month.getMonth();
            const d  = (day: number) => format(new Date(yr, mo, day), 'yyyy-MM-dd');
            const lastDay = new Date(yr, mo + 1, 0).getDate();
            const dummyBudgets: GroceryBudget[] = [{
                id: 1, name: `${format(month, 'MMMM yyyy')} Groceries`, budgetAmount: 600,
                startDate: d(1), endDate: d(lastDay), subBudgetId: 1, savingsGoal: 100,
                stores: [
                    { storeName: 'Whole Foods', items: [
                            { id: 1, itemName: 'Organic Apples', itemCost: 12.50, itemDescription: '2 lb bag', storeName: 'Whole Foods', datePurchased: d(5), category: 'Produce', quantity: 1 },
                            { id: 2, itemName: 'Chicken Breast', itemCost: 25.00, storeName: 'Whole Foods', datePurchased: d(5), category: 'Meat', quantity: 2 },
                            { id: 3, itemName: 'Greek Yogurt', itemCost: 8.99, storeName: 'Whole Foods', datePurchased: d(8), category: 'Dairy', quantity: 1 },
                            { id: 5, itemName: 'Salmon Fillet', itemCost: 34.00, storeName: 'Whole Foods', datePurchased: d(12), category: 'Seafood', quantity: 1 },
                            { id: 8, itemName: 'Almond Butter', itemCost: 12.99, storeName: 'Whole Foods', datePurchased: d(20), category: 'Pantry', quantity: 1 },
                            { id: 10, itemName: 'Mixed Berries', itemCost: 14.50, storeName: 'Whole Foods', datePurchased: d(Math.min(25, lastDay)), category: 'Produce', quantity: 1 },
                            { id: 13, itemName: 'Grass-Fed Beef', itemCost: 36.54, storeName: 'Whole Foods', datePurchased: d(Math.min(lastDay - 1, lastDay)), category: 'Meat', quantity: 1 },
                        ]},
                    { storeName: 'Trader Joes', items: [
                            { id: 14, itemName: 'Almond Milk', itemCost: 3.99, storeName: 'Trader Joes', datePurchased: d(8), category: 'Dairy', quantity: 1 },
                            { id: 15, itemName: 'Everything Bagels', itemCost: 4.50, storeName: 'Trader Joes', datePurchased: d(8), category: 'Bakery', quantity: 1 },
                            { id: 17, itemName: 'Trail Mix', itemCost: 7.50, storeName: 'Trader Joes', datePurchased: d(14), category: 'Snacks', quantity: 1 },
                            { id: 18, itemName: 'Pasta', itemCost: 2.99, storeName: 'Trader Joes', datePurchased: d(17), category: 'Pantry', quantity: 1 },
                            { id: 24, itemName: 'Coffee Beans', itemCost: 9.99, storeName: 'Trader Joes', datePurchased: d(Math.min(28, lastDay)), category: 'Beverages', quantity: 1 },
                            { id: 28, itemName: 'Protein Bars', itemCost: 9.99, storeName: 'Trader Joes', datePurchased: d(lastDay), category: 'Snacks', quantity: 1 },
                        ]},
                    { storeName: 'Costco', items: [
                            { id: 29, itemName: 'Bananas', itemCost: 8.50, storeName: 'Costco', datePurchased: d(3), category: 'Produce', quantity: 1 },
                            { id: 30, itemName: 'Paper Towels', itemCost: 24.99, storeName: 'Costco', datePurchased: d(3), category: 'Household', quantity: 1 },
                            { id: 31, itemName: 'Chicken Thighs', itemCost: 19.99, storeName: 'Costco', datePurchased: d(16), category: 'Meat', quantity: 1 },
                            { id: 32, itemName: 'Olive Oil', itemCost: 11.52, storeName: 'Costco', datePurchased: d(16), category: 'Pantry', quantity: 1 },
                        ]},
                ],
                sections: [
                    { id: 1, name: 'Produce', budgetAmount: 150, items: [] },
                    { id: 2, name: 'Meat & Seafood', budgetAmount: 200, items: [] },
                    { id: 3, name: 'Dairy', budgetAmount: 100, items: [] },
                    { id: 4, name: 'Bakery', budgetAmount: 50, items: [] },
                    { id: 5, name: 'Pantry', budgetAmount: 80, items: [] },
                    { id: 6, name: 'Frozen', budgetAmount: 40, items: [] },
                    { id: 7, name: 'Snacks', budgetAmount: 30, items: [] },
                    { id: 8, name: 'Beverages', budgetAmount: 25, items: [] },
                    { id: 9, name: 'Household', budgetAmount: 25, items: [] },
                ],
                plannedItems: [
                    { itemName: 'Organic Apples', estimatedCost: 12.50 },
                    { itemName: 'Chicken Breast', estimatedCost: 25.00 },
                ],
            }];
            setTimeout(() => { setSelectedBudget(dummyBudgets[0]); setGroceryLoading(false); }, 500);
        } catch { setGroceryError('Failed to load budgets.'); setGroceryLoading(false); }
    };

    const transformBudgetData = (budget: GroceryBudget): GroceryBudgetWithTotals => {
        const totalSpent = budget.stores.reduce((s, store) => s + store.items.reduce((ss, i) => ss + i.itemCost, 0), 0);
        return { id: budget.id ?? 0, name: budget.name, budgetAmount: budget.budgetAmount, totalSpent, startDate: budget.startDate, endDate: budget.endDate, savingsGoal: budget.savingsGoal, subBudgetId: budget.subBudgetId, plannedItems: budget.plannedItems, stores: budget.stores.map(store => ({ storeName: store.storeName, totalSpent: store.items.reduce((s, i) => s + i.itemCost, 0), items: store.items })), sections: budget.sections };
    };

    // ── Spending derived data ─────────────────────────────────────────────────
    const chartData = useMemo(() => aggregateByPeriod(ALL_DAILY, period), [period]);
    const displayData = useMemo(() => {
        if (!selectedDate) return chartData;
        const exact = ALL_DAILY.filter(r => r.date === selectedDate);
        return exact.length ? exact : chartData;
    }, [chartData, selectedDate]);
    const totalSpent   = useMemo(() => displayData.reduce((s, r) => s + r.total, 0), [displayData]);
    const avgPerPeriod = Math.round(totalSpent / (displayData.length || 1));
    const maxRow = useMemo(() => displayData.reduce<SpendingRow | null>((m, r) => !m || r.total > m.total ? r : m, null), [displayData]);
    const minRow = useMemo(() => displayData.reduce<SpendingRow | null>((m, r) => !m || r.total < m.total ? r : m, null), [displayData]);
    const pieData = useMemo(() =>
            (Object.keys(CATEGORY_COLORS) as (keyof SpendingRow)[])
                .map(cat => ({ name: cat as string, value: displayData.reduce((s, r) => s + ((r[cat] as number) ?? 0), 0) }))
                .filter(d => d.value > 0).sort((a, b) => b.value - a.value),
        [displayData]
    );
    const receiptTotal = receipts.reduce((s, r) => s + r.amount, 0);
    const receiptByCategory = useMemo(() => {
        const map: Record<string, number> = {};
        receipts.forEach(r => { map[r.category] = (map[r.category] ?? 0) + r.amount; });
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }, [receipts]);

    // ── Grocery derived data ──────────────────────────────────────────────────
    const groceryTotal    = selectedBudget ? selectedBudget.stores.reduce((s, store) => s + store.items.reduce((ss, i) => ss + i.itemCost, 0), 0) : 0;
    const groceryBudget   = selectedBudget?.budgetAmount ?? 0;
    const groceryPct      = groceryBudget > 0 ? Math.min((groceryTotal / groceryBudget) * 100, 100) : 0;
    const groceryRemaining = groceryBudget - groceryTotal;
    const grocerySavings  = selectedBudget?.savingsGoal ?? 0;
    const showRightPanel  = ['week', 'receiptDetail', 'analytics', 'groceryList'].includes(groceryViewMode);

    // ── File upload ───────────────────────────────────────────────────────────
    const processFile = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = e => {
            const text = e.target?.result as string;
            const items = parseReceiptText(text, file.name);
            if (!items.length) { setSnackMsg(`No transactions found in "${file.name}".`); setSnackSev('error'); setSnackOpen(true); return; }
            setReceipts(prev => { const ids = new Set(prev.map(r => r.id)); return [...prev, ...items.filter(i => !ids.has(i.id))]; });
            setSnackMsg(`Added ${items.length} transaction${items.length > 1 ? 's' : ''} from "${file.name}"`);
            setSnackSev('success'); setSnackOpen(true);
        };
        reader.readAsText(file);
    }, []);
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragOver(false); Array.from(e.dataTransfer.files).forEach(processFile); }, [processFile]);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { Array.from(e.target.files ?? []).forEach(processFile); e.target.value = ''; };

    const fmt      = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtShort = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    const activePeriodLabel = PERIODS.find(p => p.key === period)?.label ?? '';

    // ──────────────────────────────────────────────────────────────────────────
    return (
        <Box sx={{ maxWidth: 'calc(100% - 240px)', ml: '240px', minHeight: '100vh', background: '#f0f2f5' }}>
            <Sidebar />

            <Container maxWidth="xl" sx={{ py: 4 }}>

                {/* ── Page header ───────────────────────────────────────────── */}
                <Grow in={animateIn} timeout={400}>
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ width: 28, height: 3, background: MAROON, borderRadius: '2px', mb: 0.75 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                                <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#111', letterSpacing: '-0.025em' }}>
                                    {mainTab === 0 ? `${format(spendingMonth, 'MMMM yyyy')} Spending` : `${format(currentMonth, 'MMMM yyyy')} Groceries`}
                                </Typography>
                                <Typography variant="subtitle1" sx={{ color: '#888', mt: 0.5 }}>
                                    {mainTab === 0
                                        ? 'Track your spending patterns and import receipt data'
                                        : 'Track your grocery spending by store, week, and category'}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                {mainTab === 0 ? (
                                    /* ── Spending controls — identical month nav to BudgetPage ── */
                                    <>
                                        {/* Filled maroon chevron — identical to BudgetPage */}
                                        <IconButton
                                            onClick={() => setSpendingMonth(m => subMonths(m, 1))}
                                            sx={{ width: 32, height: 32, borderRadius: '6px', background: MAROON, color: '#fff', '&:hover': { background: MAROON_DARK } }}
                                        >
                                            <ChevronLeft size={16} />
                                        </IconButton>

                                        {/* Month label card — identical to BudgetPage */}
                                        <Card elevation={0} sx={{ px: 2, py: 0.75, display: 'flex', alignItems: 'center', gap: 1, borderRadius: '8px', border: '1px solid #e0e0e0', background: '#f9f9f9' }}>
                                            <Calendar size={14} color="#888" />
                                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#222' }}>
                                                {format(spendingMonth, 'MMMM yyyy')}
                                            </Typography>
                                        </Card>

                                        {/* Filled maroon chevron — identical to BudgetPage */}
                                        <IconButton
                                            onClick={() => setSpendingMonth(m => addMonths(m, 1))}
                                            sx={{ width: 32, height: 32, borderRadius: '6px', background: MAROON, color: '#fff', '&:hover': { background: MAROON_DARK } }}
                                        >
                                            <ChevronRight size={16} />
                                        </IconButton>

                                        {/* Period switcher pill — original position */}
                                        <Card elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.75, py: 0.5, borderRadius: '8px', border: '1px solid #e0e0e0', background: '#f9f9f9', ml: 1 }}>
                                            {PERIODS.map(({ key, label }) => {
                                                const active = period === key;
                                                return (
                                                    <Box key={key} onClick={() => setPeriod(key)} sx={{ px: 1.5, py: 0.5, borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', bgcolor: active ? MAROON : 'transparent', color: active ? '#fff' : '#333', '&:hover': { bgcolor: active ? MAROON_DARK : alpha(MAROON, 0.07) } }}>
                                                        {label}
                                                    </Box>
                                                );
                                            })}
                                        </Card>

                                        {/* Import button — same outlined style as BudgetPage's Import/Manage/Categories */}
                                        <Button variant="outlined" size="small" startIcon={<Upload size={14} />} onClick={() => fileRef.current?.click()}
                                                sx={{ ml: 1, borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', letterSpacing: '0.02em', borderColor: '#d5d5d5', color: '#333', bgcolor: '#fff', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: alpha(MAROON, 0.04) } }}>
                                            Import Receipt
                                        </Button>
                                        <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" multiple hidden onChange={handleFileChange} />
                                    </>
                                ) : (
                                    /* ── Grocery controls — month nav + action buttons ── */
                                    <>
                                        <IconButton onClick={() => setCurrentMonth(m => subMonths(m, 1))} disabled={groceryLoading}
                                                    sx={{ width: 32, height: 32, borderRadius: '6px', background: MAROON, color: '#fff', '&:hover': { background: MAROON_DARK }, '&.Mui-disabled': { background: '#ddd', color: '#aaa' } }}>
                                            <ChevronLeft size={16} />
                                        </IconButton>
                                        <Card elevation={0} sx={{ px: 2, py: 0.75, display: 'flex', alignItems: 'center', gap: 1, borderRadius: '8px', border: '1px solid #e0e0e0', background: '#f9f9f9' }}>
                                            <Calendar size={14} color="#888" />
                                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#222' }}>{format(currentMonth, 'MMMM yyyy')}</Typography>
                                        </Card>
                                        <IconButton onClick={() => setCurrentMonth(m => addMonths(m, 1))} disabled={groceryLoading}
                                                    sx={{ width: 32, height: 32, borderRadius: '6px', background: MAROON, color: '#fff', '&:hover': { background: MAROON_DARK }, '&.Mui-disabled': { background: '#ddd', color: '#aaa' } }}>
                                            <ChevronRight size={16} />
                                        </IconButton>
                                        {[
                                            { label: 'Create Budget', icon: <Plus size={14} />, onClick: () => setCreateDialogOpen(true), disabled: false, ml: 1, badge: null },
                                            { label: 'Scan Receipt', icon: <Camera size={14} />, onClick: () => setReceiptScanDialogOpen(true), disabled: !selectedBudget, ml: 0, badge: null },
                                            { label: 'Grocery List', icon: <List size={14} />, onClick: () => setGroceryListDialogOpen(true), disabled: !selectedBudget, ml: 0, badge: savedGroceryList.length },
                                        ].map(({ label, icon, onClick, disabled, ml, badge }) => (
                                            <Button key={label} variant="outlined" size="small" startIcon={icon} onClick={onClick} disabled={disabled}
                                                    endIcon={badge && badge > 0 ? <Chip label={badge} size="small" sx={{ height: 16, fontSize: '0.62rem', fontWeight: 800, bgcolor: alpha(TEAL, 0.15), color: TEAL, ml: 0.25 }} /> : undefined}
                                                    sx={{ ml, borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', letterSpacing: '0.02em', borderColor: '#d5d5d5', color: '#333', bgcolor: '#fff', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: alpha(MAROON, 0.04) }, '&.Mui-disabled': { borderColor: '#e8e8e8', color: '#bbb' } }}>
                                                {label}
                                            </Button>
                                        ))}
                                    </>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Grow>

                {/* ── Main tab switcher ─────────────────────────────────────── */}
                <Grow in={animateIn} timeout={500}>
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'inline-flex', borderRadius: '10px', p: 0.5, bgcolor: '#e8e8e8', gap: 0.5 }}>
                            {[
                                { label: 'Spending', icon: <Wallet size={15} /> },
                                { label: 'Groceries', icon: <ShoppingCart size={15} /> },
                            ].map(({ label, icon }, idx) => (
                                <Box key={label} onClick={() => setMainTab(idx)} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 2.5, py: 1, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.18s', bgcolor: mainTab === idx ? '#fff' : 'transparent', color: mainTab === idx ? MAROON : '#666', fontWeight: mainTab === idx ? 700 : 500, fontSize: '0.85rem', boxShadow: mainTab === idx ? '0 2px 8px rgba(0,0,0,0.10)' : 'none', '&:hover': { bgcolor: mainTab === idx ? '#fff' : alpha('#000', 0.04) } }}>
                                    {icon} {label}
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Grow>

                {/* ══════════════════════════════════════════════════════════════
                    SPENDING TAB
                ══════════════════════════════════════════════════════════════ */}
                {mainTab === 0 && (
                    <>
                        {/* ── Summary cards ── */}
                        <Grow in={animateIn} timeout={600}>
                            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <SummaryCard themeKey="budget" label="Total Spent" value={fmt(totalSpent)}
                                                 sub={`${displayData.length} ${activePeriodLabel.toLowerCase()} period${displayData.length !== 1 ? 's' : ''}`}
                                                 barValue={100} chipLabel="This view" chipIcon={<BarChart2 size={11} />} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <SummaryCard themeKey="saved_good" label="Avg Per Period" value={fmtShort(avgPerPeriod)}
                                                 sub={`${activePeriodLabel} average`} barValue={100} chipLabel="average" chipIcon={<Minus size={11} />} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <SummaryCard themeKey="spent_over" label="Highest Period" value={fmtShort(maxRow?.total ?? 0)}
                                                 sub={maxRow?.label ?? '—'} barValue={100} chipLabel="peak spend" chipIcon={<TrendingUp size={11} />} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <SummaryCard themeKey="spent_ok" label="Lowest Period" value={fmtShort(minRow?.total ?? 0)}
                                                 sub={minRow?.label ?? '—'} barValue={maxRow && maxRow.total > 0 ? ((minRow?.total ?? 0) / maxRow.total) * 100 : 0}
                                                 chipLabel="min spend" chipIcon={<TrendingDown size={11} />} />
                                </Grid>
                            </Grid>
                        </Grow>

                        <Grid container spacing={3}>
                            <Grid item xs={12} lg={8}>
                                <Stack spacing={3}>
                                    {/* Spending Over Time */}
                                    <Panel icon={<TrendingUp size={15} color="white" />} title="Spending Over Time"
                                           subtitle={selectedDate ? `Single day — ${selectedDate}` : `${displayData.length} ${activePeriodLabel.toLowerCase()} period${displayData.length !== 1 ? 's' : ''} · last 90 days`}
                                           animateIn={animateIn} timeout={700}
                                           right={
                                               <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                   {['Area', 'Bar', 'Stacked'].map((lbl, idx) => (
                                                       <Box key={lbl} onClick={() => setChartTab(idx)} sx={{ px: 1.25, py: 0.35, borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', bgcolor: chartTab === idx ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.08)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}>
                                                           {lbl}
                                                       </Box>
                                                   ))}
                                               </Box>
                                           }
                                    >
                                        <ResponsiveContainer width="100%" height={290}>
                                            {chartTab === 0 ? (
                                                <AreaChart data={displayData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                                    <defs><linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={MAROON} stopOpacity={0.28} /><stop offset="95%" stopColor={MAROON} stopOpacity={0.02} /></linearGradient></defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888' }} tickLine={false} />
                                                    <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
                                                    <RechartsTooltip content={<ChartTooltip />} />
                                                    <Area type="monotone" dataKey="total" stroke={MAROON} strokeWidth={2.5} fill="url(#spendGrad)" name="Total" />
                                                </AreaChart>
                                            ) : chartTab === 1 ? (
                                                <BarChart data={displayData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888' }} tickLine={false} />
                                                    <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
                                                    <RechartsTooltip content={<ChartTooltip />} />
                                                    <Bar dataKey="total" fill={MAROON} radius={[4, 4, 0, 0]} name="Total" />
                                                </BarChart>
                                            ) : (
                                                <BarChart data={displayData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888' }} tickLine={false} />
                                                    <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
                                                    <RechartsTooltip content={<ChartTooltip />} />
                                                    {Object.entries(CATEGORY_COLORS).map(([cat, color]) => <Bar key={cat} dataKey={cat} stackId="a" fill={color} name={cat} />)}
                                                </BarChart>
                                            )}
                                        </ResponsiveContainer>
                                    </Panel>

                                    {/* Category Breakdown */}
                                    <Panel icon={<BarChart2 size={15} color="white" />} title="Category Breakdown" subtitle="Spending distribution by category for the selected period" animateIn={animateIn} timeout={800}>
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        {['Category', 'Total', 'Avg / Period', '% of Spend', 'Level'].map(h => (
                                                            <TableCell key={h} sx={{ fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', borderBottom: '2px solid #f0f0f0', py: 1 }}>{h}</TableCell>
                                                        ))}
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {pieData.map(({ name, value }) => {
                                                        const pct = totalSpent > 0 ? (value / totalSpent) * 100 : 0;
                                                        const avg = Math.round(value / (displayData.length || 1));
                                                        const color = CATEGORY_COLORS[name] ?? '#64748b';
                                                        return (
                                                            <TableRow key={name} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                                                                <TableCell sx={{ py: 1.25, borderBottom: '1px solid #f5f5f5' }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Box sx={{ width: 26, height: 26, borderRadius: '7px', bgcolor: alpha(color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{CATEGORY_ICONS[name]}</Box>
                                                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#222' }}>{name}</Typography>
                                                                    </Box>
                                                                </TableCell>
                                                                <TableCell sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#111', py: 1.25, borderBottom: '1px solid #f5f5f5' }}>{fmt(value)}</TableCell>
                                                                <TableCell sx={{ fontSize: '0.78rem', color: '#555', py: 1.25, borderBottom: '1px solid #f5f5f5' }}>{fmtShort(avg)}</TableCell>
                                                                <TableCell sx={{ py: 1.25, minWidth: 130, borderBottom: '1px solid #f5f5f5' }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Box sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: alpha(color, 0.15), overflow: 'hidden' }}><Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color, borderRadius: 3 }} /></Box>
                                                                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color, minWidth: 36, textAlign: 'right' }}>{pct.toFixed(1)}%</Typography>
                                                                    </Box>
                                                                </TableCell>
                                                                <TableCell sx={{ py: 1.25, borderBottom: '1px solid #f5f5f5' }}>
                                                                    {pct > 20 ? <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.25, borderRadius: '20px', bgcolor: alpha('#dc2626', 0.1), color: '#dc2626', fontSize: '0.65rem', fontWeight: 700 }}><TrendingUp size={10} /> High</Box>
                                                                        : pct > 10 ? <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.25, borderRadius: '20px', bgcolor: alpha('#d97706', 0.1), color: '#d97706', fontSize: '0.65rem', fontWeight: 700 }}><Minus size={10} /> Mid</Box>
                                                                            : <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.25, borderRadius: '20px', bgcolor: alpha('#16a34a', 0.1), color: '#16a34a', fontSize: '0.65rem', fontWeight: 700 }}><TrendingDown size={10} /> Low</Box>}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Panel>

                                    {/* Receipt Transactions */}
                                    {receipts.length > 0 && (
                                        <Panel icon={<Receipt size={15} color="white" />} title="Receipt Transactions" subtitle={`${receipts.length} item${receipts.length !== 1 ? 's' : ''} · ${fmt(receiptTotal)} total`} animateIn timeout={600}
                                               right={<Box sx={{ px: 1, py: 0.3, borderRadius: '20px', bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.68rem', fontWeight: 700 }}>{receipts.length} items</Box>}>
                                            <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                                                {[{ label: 'Total', value: fmt(receiptTotal), color: MAROON }, { label: 'Items', value: `${receipts.length}`, color: '#0284c7' }, { label: 'Categories', value: `${receiptByCategory.length}`, color: '#16a34a' }].map(({ label, value, color }) => (
                                                    <Box key={label} sx={{ flex: 1, bgcolor: alpha(color, 0.06), borderRadius: '8px', p: 1.5, textAlign: 'center', border: `1px solid ${alpha(color, 0.15)}` }}>
                                                        <Typography sx={{ fontSize: '0.65rem', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.25 }}>{label}</Typography>
                                                        <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color }}>{value}</Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                                                <Tabs value={receiptTab} onChange={(_e, v) => setReceiptTab(v)} sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }, '& .Mui-selected': { color: MAROON }, '& .MuiTabs-indicator': { bgcolor: MAROON } }}>
                                                    <Tab label="By Category" /><Tab label="All Items" />
                                                </Tabs>
                                            </Box>
                                            {receiptTab === 0 ? (
                                                <Stack spacing={1}>
                                                    {receiptByCategory.map(([cat, total]) => {
                                                        const color = CATEGORY_COLORS[cat] ?? '#64748b';
                                                        const pct = receiptTotal > 0 ? (total / receiptTotal) * 100 : 0;
                                                        return (
                                                            <Box key={cat}>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                        <Box sx={{ width: 22, height: 22, borderRadius: '6px', bgcolor: alpha(color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{CATEGORY_ICONS[cat]}</Box>
                                                                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#333' }}>{cat}</Typography>
                                                                    </Box>
                                                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#111' }}>{fmt(total)}</Typography>
                                                                </Box>
                                                                <Box sx={{ height: 5, borderRadius: 3, bgcolor: alpha(color, 0.12), overflow: 'hidden' }}><Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color, borderRadius: 3, transition: 'width 0.4s' }} /></Box>
                                                            </Box>
                                                        );
                                                    })}
                                                </Stack>
                                            ) : (
                                                <TableContainer>
                                                    <Table size="small">
                                                        <TableHead><TableRow>{['Item', 'Category', 'Date', 'Amount', ''].map(h => <TableCell key={h} sx={{ fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', borderBottom: '2px solid #f0f0f0', py: 1 }}>{h}</TableCell>)}</TableRow></TableHead>
                                                        <TableBody>
                                                            {receipts.map(item => {
                                                                const color = CATEGORY_COLORS[item.category] ?? '#64748b';
                                                                return (
                                                                    <TableRow key={item.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                                                                        <TableCell sx={{ py: 1, borderBottom: '1px solid #f5f5f5', maxWidth: 200 }}>
                                                                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</Typography>
                                                                            <Typography sx={{ fontSize: '0.65rem', color: '#999' }}>{item.merchant}</Typography>
                                                                        </TableCell>
                                                                        <TableCell sx={{ py: 1, borderBottom: '1px solid #f5f5f5' }}><Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.8, py: 0.2, borderRadius: '12px', bgcolor: alpha(color, 0.1), color, fontSize: '0.68rem', fontWeight: 700 }}>{item.category}</Box></TableCell>
                                                                        <TableCell sx={{ fontSize: '0.75rem', color: '#666', py: 1, borderBottom: '1px solid #f5f5f5' }}>{item.date}</TableCell>
                                                                        <TableCell sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#111', py: 1, borderBottom: '1px solid #f5f5f5' }}>{fmt(item.amount)}</TableCell>
                                                                        <TableCell sx={{ py: 1, borderBottom: '1px solid #f5f5f5', width: 32 }}>
                                                                            <IconButton size="small" onClick={() => setReceipts(prev => prev.filter(r => r.id !== item.id))} sx={{ width: 22, height: 22, color: '#ccc', '&:hover': { color: '#dc2626', bgcolor: alpha('#dc2626', 0.06) } }}><X size={12} /></IconButton>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            )}
                                            <Button size="small" variant="outlined" onClick={() => setReceipts([])} sx={{ mt: 2.5, borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderColor: '#e5e7eb', color: '#dc2626', '&:hover': { borderColor: '#dc2626', bgcolor: alpha('#dc2626', 0.04) } }}>Clear All Receipts</Button>
                                        </Panel>
                                    )}
                                </Stack>
                            </Grid>

                            {/* ── Dynamic Right Panel ── */}
                            <Grid item xs={12} lg={4}>
                                <Grow in={animateIn} timeout={800}>
                                    <Box sx={{ position: 'sticky', top: 24 }}>

                                        {/* Panel nav tabs */}
                                        <Box sx={{ display: 'flex', borderRadius: '12px', p: 0.5, bgcolor: '#e8e8e8', gap: 0.25, mb: 2 }}>
                                            {([
                                                { key: 'overview',  label: 'Overview',  icon: <Layers size={13} /> },
                                                { key: 'category',  label: 'Categories', icon: <BarChart2 size={13} /> },
                                                { key: 'savings',   label: 'Savings',   icon: <Target size={13} /> },
                                                { key: 'forecast',  label: 'Forecast',  icon: <Brain size={13} /> },
                                            ] as const).map(({ key, label, icon }) => {
                                                const active = rightPanel === key;
                                                return (
                                                    <Box key={key} onClick={() => setRightPanel(key)}
                                                         sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3, py: 0.75, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s', bgcolor: active ? '#fff' : 'transparent', color: active ? MAROON : '#777', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.10)' : 'none', '&:hover': { bgcolor: active ? '#fff' : alpha('#000', 0.04) } }}>
                                                        {icon}
                                                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.02em' }}>{label}</Typography>
                                                    </Box>
                                                );
                                            })}
                                        </Box>

                                        {/* ── OVERVIEW panel ── */}
                                        {rightPanel === 'overview' && (
                                            <Stack spacing={2.5}>
                                                <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}` }}>
                                                    <PanelHeader icon={<PiggyBank size={15} color="white" />} title="Spend Mix" subtitle="Category proportions this period" />
                                                    <Box sx={{ bgcolor: '#fff', p: 3 }}>
                                                        <ResponsiveContainer width="100%" height={190}>
                                                            <PieChart>
                                                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={82} paddingAngle={2} dataKey="value">
                                                                    {pieData.map(({ name }) => <Cell key={name} fill={CATEGORY_COLORS[name] ?? '#64748b'} />)}
                                                                </Pie>
                                                                <RechartsTooltip formatter={(v: number) => fmt(v)} />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                        <Divider sx={{ my: 1.5 }} />
                                                        <Stack spacing={0.75}>
                                                            {pieData.slice(0, 6).map(({ name, value }) => {
                                                                const pct = totalSpent > 0 ? (value / totalSpent) * 100 : 0;
                                                                const color = CATEGORY_COLORS[name] ?? '#64748b';
                                                                return (
                                                                    <Box key={name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                                                                            <Typography sx={{ fontSize: '0.75rem', color: '#555' }}>{name}</Typography>
                                                                        </Box>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                            <Typography sx={{ fontSize: '0.7rem', color: '#aaa' }}>{pct.toFixed(1)}%</Typography>
                                                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#222', minWidth: 52, textAlign: 'right' }}>{fmtShort(value)}</Typography>
                                                                        </Box>
                                                                    </Box>
                                                                );
                                                            })}
                                                        </Stack>
                                                    </Box>
                                                </Box>

                                                {/* Receipt upload widget */}
                                                <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}` }}>
                                                    <PanelHeader icon={<Receipt size={15} color="white" />} title="Receipt Data" subtitle="Upload CSV or text receipt files"
                                                                 right={receipts.length > 0 ? <Box sx={{ px: 1, py: 0.3, borderRadius: '20px', bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.68rem', fontWeight: 700 }}>{receipts.length} items</Box> : undefined} />
                                                    <Box sx={{ bgcolor: '#fff', p: 3 }}>
                                                        <Box onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileRef.current?.click()}
                                                             sx={{ border: `2px dashed ${dragOver ? MAROON : alpha(MAROON, 0.22)}`, borderRadius: '10px', p: 3, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', bgcolor: dragOver ? alpha(MAROON, 0.04) : '#fafafa', '&:hover': { borderColor: MAROON, bgcolor: alpha(MAROON, 0.03) } }}>
                                                            <Upload size={22} color={dragOver ? MAROON : '#bbb'} style={{ margin: '0 auto 8px', display: 'block' }} />
                                                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: dragOver ? MAROON : '#555', mb: 0.4 }}>Drop files or click to upload</Typography>
                                                            <Typography sx={{ fontSize: '0.7rem', color: '#aaa' }}>CSV or TXT with dollar amounts</Typography>
                                                        </Box>
                                                        {receipts.length === 0 && <Box sx={{ textAlign: 'center', pt: 2 }}><FileText size={26} color="#d5d5d5" style={{ margin: '0 auto 6px', display: 'block' }} /><Typography sx={{ fontSize: '0.75rem', color: '#bbb' }}>No receipts yet</Typography></Box>}
                                                        {receipts.length > 0 && (
                                                            <Box sx={{ mt: 2 }}>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: MAROON }}>Receipt Total: {fmt(receiptTotal)}</Typography>
                                                                    <Button size="small" variant="outlined" onClick={() => setReceipts([])} sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.7rem', borderColor: '#e5e7eb', color: '#dc2626', py: 0.3, '&:hover': { borderColor: '#dc2626', bgcolor: alpha('#dc2626', 0.04) } }}>Clear</Button>
                                                                </Box>
                                                                <Stack spacing={0.75}>
                                                                    {receiptByCategory.slice(0, 5).map(([cat, total]) => {
                                                                        const color = CATEGORY_COLORS[cat] ?? '#64748b';
                                                                        const pct = receiptTotal > 0 ? (total / receiptTotal) * 100 : 0;
                                                                        return (
                                                                            <Box key={cat}>
                                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.35 }}>
                                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                                                                        <Box sx={{ width: 18, height: 18, borderRadius: '5px', bgcolor: alpha(color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{CATEGORY_ICONS[cat]}</Box>
                                                                                        <Typography sx={{ fontSize: '0.73rem', fontWeight: 600, color: '#333' }}>{cat}</Typography>
                                                                                    </Box>
                                                                                    <Typography sx={{ fontSize: '0.73rem', fontWeight: 700, color: '#111' }}>{fmtShort(total)}</Typography>
                                                                                </Box>
                                                                                <Box sx={{ height: 4, borderRadius: 2, bgcolor: alpha(color, 0.12), overflow: 'hidden' }}><Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color, borderRadius: 2, transition: 'width 0.4s' }} /></Box>
                                                                            </Box>
                                                                        );
                                                                    })}
                                                                </Stack>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Stack>
                                        )}

                                        {/* ── CATEGORY DEEP DIVE panel ── */}
                                        {rightPanel === 'category' && (() => {
                                            const cats = Object.keys(CATEGORY_COLORS);
                                            const activeCat = selectedCategory ?? (pieData[0]?.name ?? cats[0]);
                                            const catTotal = pieData.find(d => d.name === activeCat)?.value ?? 0;
                                            const catPct = totalSpent > 0 ? (catTotal / totalSpent) * 100 : 0;
                                            const catColor = CATEGORY_COLORS[activeCat] ?? SLATE;
                                            // per-period breakdown for selected category
                                            const catPeriodData = displayData.map(row => ({
                                                label: row.label,
                                                value: (row as any)[activeCat] ?? (row.total * (catPct / 100)),
                                            }));
                                            const catAvg = catPeriodData.length > 0 ? catPeriodData.reduce((s, r) => s + r.value, 0) / catPeriodData.length : 0;
                                            // month-over-month simulated comparison
                                            const momChange = ((Math.random() * 0.3) - 0.1); // placeholder until real data
                                            return (
                                                <Stack spacing={2.5}>
                                                    <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}` }}>
                                                        <PanelHeader icon={<BarChart2 size={15} color="white" />} title="Category Deep Dive" subtitle="Drill into any spending category" />
                                                        <Box sx={{ bgcolor: '#fff', p: 3 }}>
                                                            {/* Category selector */}
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2.5 }}>
                                                                {pieData.map(({ name }) => {
                                                                    const c = CATEGORY_COLORS[name] ?? SLATE;
                                                                    const isActive = name === activeCat;
                                                                    return (
                                                                        <Box key={name} onClick={() => setSelectedCategory(name)}
                                                                             sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 1.25, py: 0.4, borderRadius: '20px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, transition: 'all 0.15s', bgcolor: isActive ? alpha(c, 0.15) : '#f5f5f5', color: isActive ? c : '#888', border: `1.5px solid ${isActive ? c : 'transparent'}`, '&:hover': { bgcolor: alpha(c, 0.1), color: c } }}>
                                                                            {CATEGORY_ICONS[name]}
                                                                            {name}
                                                                        </Box>
                                                                    );
                                                                })}
                                                            </Box>

                                                            {/* Stats row */}
                                                            <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
                                                                {[
                                                                    { label: 'Total', value: fmt(catTotal), color: catColor },
                                                                    { label: 'Of Spend', value: `${catPct.toFixed(1)}%`, color: NAVY },
                                                                    { label: 'Avg / Period', value: fmtShort(catAvg), color: TEAL },
                                                                ].map(({ label, value, color }) => (
                                                                    <Box key={label} sx={{ flex: 1, textAlign: 'center', p: 1.25, borderRadius: '8px', bgcolor: alpha(color, 0.06), border: `1px solid ${alpha(color, 0.12)}` }}>
                                                                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color, mb: 0.3 }}>{label}</Typography>
                                                                        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color }}>{value}</Typography>
                                                                    </Box>
                                                                ))}
                                                            </Box>

                                                            {/* Per-period bar chart for category */}
                                                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#aaa', mb: 1 }}>Spending Over Time</Typography>
                                                            <ResponsiveContainer width="100%" height={150}>
                                                                <BarChart data={catPeriodData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                                                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#aaa' }} tickLine={false} />
                                                                    <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 9, fill: '#aaa' }} tickLine={false} axisLine={false} />
                                                                    <RechartsTooltip formatter={(v: number) => [fmt(v), activeCat]} />
                                                                    <ReferenceLine y={catAvg} stroke={catColor} strokeDasharray="4 3" strokeWidth={1.5} />
                                                                    <Bar dataKey="value" fill={catColor} radius={[3, 3, 0, 0]} opacity={0.85} />
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                            <Typography sx={{ fontSize: '0.65rem', color: '#aaa', textAlign: 'center', mt: 0.5 }}>Dashed line = period average</Typography>

                                                            <Divider sx={{ my: 2 }} />

                                                            {/* Category insight chips */}
                                                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#aaa', mb: 1 }}>Insights</Typography>
                                                            <Stack spacing={0.75}>
                                                                {[
                                                                    { icon: <Activity size={11} />, text: `${catPct.toFixed(1)}% of total monthly spend`, color: catColor },
                                                                    { icon: <TrendingUp size={11} />, text: `Avg ${fmtShort(catAvg)} per ${activePeriodLabel.toLowerCase()} period`, color: TEAL },
                                                                    { icon: <DollarSign size={11} />, text: `At this rate: ~${fmt(catAvg * (period === 'daily' ? 30 : period === 'weekly' ? 4.33 : period === 'biweekly' ? 2.17 : 1))} / mo`, color: NAVY },
                                                                ].map(({ icon, text, color }, i) => (
                                                                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, p: 1, borderRadius: '7px', bgcolor: alpha(color, 0.05), border: `1px solid ${alpha(color, 0.1)}` }}>
                                                                        <Box sx={{ color, flexShrink: 0 }}>{icon}</Box>
                                                                        <Typography sx={{ fontSize: '0.72rem', color: '#444' }}>{text}</Typography>
                                                                    </Box>
                                                                ))}
                                                            </Stack>
                                                        </Box>
                                                    </Box>

                                                    {/* All categories comparison */}
                                                    <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}` }}>
                                                        <PanelHeader icon={<Layers size={15} color="white" />} title="All Categories" subtitle="Side-by-side comparison" />
                                                        <Box sx={{ bgcolor: '#fff', p: 2.5 }}>
                                                            <Stack spacing={1.25}>
                                                                {pieData.sort((a, b) => b.value - a.value).map(({ name, value }) => {
                                                                    const c = CATEGORY_COLORS[name] ?? SLATE;
                                                                    const pct = totalSpent > 0 ? (value / totalSpent) * 100 : 0;
                                                                    return (
                                                                        <Box key={name} onClick={() => { setSelectedCategory(name); }} sx={{ cursor: 'pointer' }}>
                                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                                                                    <Box sx={{ width: 20, height: 20, borderRadius: '5px', bgcolor: alpha(c, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: c, flexShrink: 0 }}>{CATEGORY_ICONS[name]}</Box>
                                                                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: name === activeCat ? c : '#333' }}>{name}</Typography>
                                                                                </Box>
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                                    <Typography sx={{ fontSize: '0.68rem', color: '#aaa' }}>{pct.toFixed(1)}%</Typography>
                                                                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#111', minWidth: 48, textAlign: 'right' }}>{fmtShort(value)}</Typography>
                                                                                </Box>
                                                                            </Box>
                                                                            <Box sx={{ height: 5, borderRadius: 3, bgcolor: alpha(c, 0.1), overflow: 'hidden' }}>
                                                                                <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: c, borderRadius: 3, transition: 'width 0.4s', opacity: name === activeCat ? 1 : 0.65 }} />
                                                                            </Box>
                                                                        </Box>
                                                                    );
                                                                })}
                                                            </Stack>
                                                        </Box>
                                                    </Box>
                                                </Stack>
                                            );
                                        })()}

                                        {/* ── SAVINGS IMPACT panel ── */}
                                        {rightPanel === 'savings' && (() => {
                                            const discretionary = (pieData.find(d => d.name === 'Dining')?.value ?? 0)
                                                + (pieData.find(d => d.name === 'Entertainment')?.value ?? 0)
                                                + (pieData.find(d => d.name === 'Coffee')?.value ?? 0)
                                                + (pieData.find(d => d.name === 'Shopping')?.value ?? 0);
                                            const essentials = totalSpent - discretionary;
                                            const netAfterSpend = monthlyIncome - totalSpent;
                                            const savingsRate = monthlyIncome > 0 ? (netAfterSpend / monthlyIncome) * 100 : 0;
                                            const goalPct = savingsGoal > 0 ? Math.min((netAfterSpend / savingsGoal) * 100, 100) : 0;
                                            const monthsToGoal = netAfterSpend > 0 ? Math.ceil(savingsGoal / netAfterSpend) : Infinity;
                                            const reduce10 = totalSpent * 0.9;
                                            const savingsIf10 = monthlyIncome - reduce10;
                                            const scenarioData = [
                                                { label: 'Current', savings: Math.max(netAfterSpend, 0), spend: totalSpent },
                                                { label: '−10%', savings: Math.max(monthlyIncome - reduce10, 0), spend: reduce10 },
                                                { label: '−20%', savings: Math.max(monthlyIncome - totalSpent * 0.8, 0), spend: totalSpent * 0.8 },
                                                { label: 'Essentials Only', savings: Math.max(monthlyIncome - essentials, 0), spend: essentials },
                                            ];
                                            const savingsRateColor = savingsRate >= 20 ? GREEN : savingsRate >= 10 ? '#d97706' : '#dc2626';
                                            return (
                                                <Stack spacing={2.5}>
                                                    <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}` }}>
                                                        <PanelHeader icon={<Target size={15} color="white" />} title="Savings Impact" subtitle="How spending affects your savings" />
                                                        <Box sx={{ bgcolor: '#fff', p: 3 }}>
                                                            {/* Income + goal inputs */}
                                                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.25 }}>Your Numbers</Typography>
                                                            <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                                                                <TextField size="small" label="Monthly Income" type="number" value={monthlyIncome}
                                                                           onChange={e => setMonthlyIncome(Number(e.target.value))}
                                                                           InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.82rem', color: '#888' }}>$</Typography></InputAdornment> }}
                                                                           sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.85rem' }, '& .MuiInputLabel-root': { fontSize: '0.78rem' } }} />
                                                                <TextField size="small" label="Monthly Savings Goal" type="number" value={savingsGoal}
                                                                           onChange={e => setSavingsGoal(Number(e.target.value))}
                                                                           InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.82rem', color: '#888' }}>$</Typography></InputAdornment> }}
                                                                           sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.85rem' }, '& .MuiInputLabel-root': { fontSize: '0.78rem' } }} />
                                                            </Stack>

                                                            {/* Key metrics */}
                                                            <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
                                                                {[
                                                                    { label: 'Net Saved', value: fmt(Math.max(netAfterSpend, 0)), color: netAfterSpend >= 0 ? GREEN : '#dc2626' },
                                                                    { label: 'Savings Rate', value: `${Math.max(savingsRate, 0).toFixed(1)}%`, color: savingsRateColor },
                                                                    { label: 'Discretionary', value: fmtShort(discretionary), color: '#d97706' },
                                                                ].map(({ label, value, color }) => (
                                                                    <Box key={label} sx={{ flex: 1, textAlign: 'center', p: 1.25, borderRadius: '8px', bgcolor: alpha(color, 0.06), border: `1px solid ${alpha(color, 0.12)}` }}>
                                                                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color, mb: 0.3 }}>{label}</Typography>
                                                                        <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color }}>{value}</Typography>
                                                                    </Box>
                                                                ))}
                                                            </Box>

                                                            {/* Goal progress */}
                                                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 0.75 }}>Goal Progress</Typography>
                                                            <Box sx={{ mb: 0.75 }}>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                                    <Typography sx={{ fontSize: '0.72rem', color: '#555' }}>{fmt(Math.max(netAfterSpend, 0))} saved of {fmt(savingsGoal)} goal</Typography>
                                                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: goalPct >= 100 ? GREEN : MAROON }}>{Math.round(goalPct)}%</Typography>
                                                                </Box>
                                                                <Box sx={{ height: 8, borderRadius: 4, bgcolor: '#f0f0f0', overflow: 'hidden' }}>
                                                                    <Box sx={{ width: `${goalPct}%`, height: '100%', borderRadius: 4, transition: 'width 0.5s', background: goalPct >= 100 ? `linear-gradient(90deg, ${GREEN}, #34d399)` : `linear-gradient(90deg, ${MAROON}, #b45454)` }} />
                                                                </Box>
                                                            </Box>
                                                            {monthsToGoal !== Infinity && (
                                                                <Typography sx={{ fontSize: '0.7rem', color: '#888', mb: 2 }}>
                                                                    At this rate, goal reached in <strong style={{ color: MAROON }}>{monthsToGoal} month{monthsToGoal !== 1 ? 's' : ''}</strong>
                                                                </Typography>
                                                            )}

                                                            <Divider sx={{ my: 2 }} />

                                                            {/* Scenario comparison chart */}
                                                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1 }}>Spending Scenarios</Typography>
                                                            <ResponsiveContainer width="100%" height={160}>
                                                                <BarChart data={scenarioData} margin={{ top: 4, right: 4, left: -16, bottom: 4 }}>
                                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                                                                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#aaa' }} tickLine={false} />
                                                                    <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 9, fill: '#aaa' }} tickLine={false} axisLine={false} />
                                                                    <RechartsTooltip formatter={(v: number, name: string) => [fmt(v), name]} />
                                                                    <Bar dataKey="spend" name="Spending" fill={alpha(MAROON, 0.7)} radius={[3, 3, 0, 0]} />
                                                                    <Bar dataKey="savings" name="Savings" fill={GREEN} radius={[3, 3, 0, 0]} />
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                            <Typography sx={{ fontSize: '0.65rem', color: '#aaa', textAlign: 'center', mt: 0.5 }}>Maroon = Spending · Green = Savings</Typography>

                                                            <Divider sx={{ my: 2 }} />

                                                            {/* Spend reduction tips */}
                                                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1 }}>Impact Tips</Typography>
                                                            <Stack spacing={0.75}>
                                                                {[
                                                                    { icon: <ArrowRight size={11} />, text: `Cut discretionary by 10% → save ${fmt(discretionary * 0.1)} extra / mo`, color: GREEN },
                                                                    { icon: <ArrowRight size={11} />, text: `Current spend = ${totalSpent > 0 && monthlyIncome > 0 ? ((totalSpent / monthlyIncome) * 100).toFixed(0) : '—'}% of income`, color: NAVY },
                                                                    { icon: <ArrowRight size={11} />, text: `Savings rate benchmark: 20% = ${fmt(monthlyIncome * 0.2)} / mo`, color: TEAL },
                                                                ].map(({ icon, text, color }, i) => (
                                                                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, p: 1, borderRadius: '7px', bgcolor: alpha(color, 0.05), border: `1px solid ${alpha(color, 0.1)}` }}>
                                                                        <Box sx={{ color, flexShrink: 0, mt: 0.1 }}>{icon}</Box>
                                                                        <Typography sx={{ fontSize: '0.72rem', color: '#444', lineHeight: 1.4 }}>{text}</Typography>
                                                                    </Box>
                                                                ))}
                                                            </Stack>
                                                        </Box>
                                                    </Box>
                                                </Stack>
                                            );
                                        })()}

                                        {/* ── FORECAST panel ── */}
                                        {rightPanel === 'forecast' && (() => {
                                            // Build forecast based on displayData
                                            const historical = displayData.slice(-8);
                                            const n = historical.length;

                                            // Linear regression
                                            const linearForecast = (() => {
                                                if (n < 2) return historical.map(d => ({ ...d, forecast: d.total }));
                                                const xMean = (n - 1) / 2;
                                                const yMean = historical.reduce((s, d) => s + d.total, 0) / n;
                                                const slope = historical.reduce((s, d, i) => s + (i - xMean) * (d.total - yMean), 0)
                                                    / historical.reduce((s, _, i) => s + (i - xMean) ** 2, 0);
                                                const intercept = yMean - slope * xMean;
                                                const future = Array.from({ length: 4 }, (_, i) => ({
                                                    label: `+${i + 1}`,
                                                    total: null as number | null,
                                                    forecast: Math.max(intercept + slope * (n + i), 0),
                                                }));
                                                return [...historical.map((d, i) => ({ ...d, forecast: Math.max(intercept + slope * i, 0) })), ...future];
                                            })();

                                            // 3-period moving average
                                            const movingAvgForecast = (() => {
                                                const window = 3;
                                                const base = historical.map((d, i) => {
                                                    if (i < window - 1) return { ...d, forecast: d.total };
                                                    const avg = historical.slice(i - window + 1, i + 1).reduce((s, r) => s + r.total, 0) / window;
                                                    return { ...d, forecast: avg };
                                                });
                                                const lastAvg = historical.slice(-window).reduce((s, d) => s + d.total, 0) / window;
                                                const future = Array.from({ length: 4 }, (_, i) => ({
                                                    label: `+${i + 1}`, total: null as number | null, forecast: lastAvg,
                                                }));
                                                return [...base, ...future];
                                            })();

                                            // Seasonal (simple: same-period-last-cycle * trend factor)
                                            const seasonalForecast = (() => {
                                                const avgTotal = historical.reduce((s, d) => s + d.total, 0) / (n || 1);
                                                const trendFactor = n > 1 ? (historical[n - 1].total / (historical[0].total || 1)) ** (1 / (n - 1)) : 1;
                                                const future = Array.from({ length: 4 }, (_, i) => ({
                                                    label: `+${i + 1}`, total: null as number | null,
                                                    forecast: Math.max(avgTotal * (trendFactor ** (i + 1)), 0),
                                                }));
                                                return [...historical.map(d => ({ ...d, forecast: d.total })), ...future];
                                            })();

                                            const activeData = forecastModel === 'linear' ? linearForecast : forecastModel === 'moving' ? movingAvgForecast : seasonalForecast;
                                            const futurePoints = activeData.filter(d => d.total === null);
                                            const projectedAvg = futurePoints.length > 0 ? futurePoints.reduce((s, d) => s + (d.forecast ?? 0), 0) / futurePoints.length : 0;
                                            const currentAvg = n > 0 ? historical.reduce((s, d) => s + d.total, 0) / n : 0;
                                            const trendDelta = projectedAvg - currentAvg;

                                            const modelDescriptions: Record<string, string> = {
                                                linear: 'Fits a straight trend line to your spending history.',
                                                moving: 'Uses the last 3 periods to smooth out volatility.',
                                                seasonal: 'Applies a compound growth trend from historical data.',
                                            };

                                            return (
                                                <Stack spacing={2.5}>
                                                    <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}` }}>
                                                        <PanelHeader icon={<Brain size={15} color="white" />} title="Spending Forecast" subtitle="Predict future patterns with math models" />
                                                        <Box sx={{ bgcolor: '#fff', p: 3 }}>
                                                            {/* Model selector */}
                                                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1 }}>Forecast Model</Typography>
                                                            <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5, flexWrap: 'wrap' }}>
                                                                {([
                                                                    { key: 'linear', label: 'Linear Regression' },
                                                                    { key: 'moving', label: '3-Period Moving Avg' },
                                                                    { key: 'seasonal', label: 'Trend Projection' },
                                                                ] as const).map(({ key, label }) => {
                                                                    const active = forecastModel === key;
                                                                    return (
                                                                        <Box key={key} onClick={() => setForecastModel(key)}
                                                                             sx={{ px: 1.5, py: 0.5, borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', bgcolor: active ? MAROON : '#f0f0f0', color: active ? '#fff' : '#555', '&:hover': { bgcolor: active ? MAROON_DARK : '#e5e5e5' } }}>
                                                                            {label}
                                                                        </Box>
                                                                    );
                                                                })}
                                                            </Box>
                                                            <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: alpha(NAVY, 0.04), border: `1px solid ${alpha(NAVY, 0.08)}`, mb: 2.5 }}>
                                                                <Typography sx={{ fontSize: '0.71rem', color: '#666', lineHeight: 1.5 }}>{modelDescriptions[forecastModel]}</Typography>
                                                            </Box>

                                                            {/* Forecast chart */}
                                                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1 }}>Historical + Forecast</Typography>
                                                            <ResponsiveContainer width="100%" height={200}>
                                                                <LineChart data={activeData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#aaa' }} tickLine={false} />
                                                                    <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 9, fill: '#aaa' }} tickLine={false} axisLine={false} />
                                                                    <RechartsTooltip formatter={(v: number, name: string) => [fmt(v), name === 'total' ? 'Actual' : 'Forecast']} />
                                                                    <Line type="monotone" dataKey="total" stroke={MAROON} strokeWidth={2.5} dot={{ r: 3, fill: MAROON }} connectNulls={false} name="Actual" />
                                                                    <Line type="monotone" dataKey="forecast" stroke={TEAL} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, fill: TEAL }} connectNulls name="Forecast" />
                                                                </LineChart>
                                                            </ResponsiveContainer>
                                                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 0.75, mb: 2.5 }}>
                                                                {[{ color: MAROON, label: 'Actual' }, { color: TEAL, label: 'Forecast', dash: true }].map(({ color, label, dash }) => (
                                                                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        <Box sx={{ width: 16, height: 2, bgcolor: color, borderRadius: 1, opacity: dash ? 0.7 : 1, borderTop: dash ? `2px dashed ${color}` : undefined, borderBottom: `2px ${dash ? 'dashed' : 'solid'} ${color}` }} />
                                                                        <Typography sx={{ fontSize: '0.65rem', color: '#888' }}>{label}</Typography>
                                                                    </Box>
                                                                ))}
                                                            </Box>

                                                            <Divider sx={{ my: 2 }} />

                                                            {/* Projected summary */}
                                                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.25 }}>Projection Summary</Typography>
                                                            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                                                                {[
                                                                    { label: 'Current Avg', value: fmtShort(currentAvg), color: MAROON },
                                                                    { label: 'Projected Avg', value: fmtShort(projectedAvg), color: TEAL },
                                                                    { label: 'Trend', value: `${trendDelta >= 0 ? '+' : ''}${fmtShort(Math.abs(trendDelta))}`, color: trendDelta > 0 ? '#dc2626' : GREEN },
                                                                ].map(({ label, value, color }) => (
                                                                    <Box key={label} sx={{ flex: 1, textAlign: 'center', p: 1.25, borderRadius: '8px', bgcolor: alpha(color, 0.06), border: `1px solid ${alpha(color, 0.12)}` }}>
                                                                        <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color, mb: 0.3 }}>{label}</Typography>
                                                                        <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color }}>{value}</Typography>
                                                                    </Box>
                                                                ))}
                                                            </Box>

                                                            {/* Forecast insight chips */}
                                                            <Stack spacing={0.75}>
                                                                {[
                                                                    {
                                                                        icon: trendDelta > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />,
                                                                        text: trendDelta > 0
                                                                            ? `Spending projected to increase by ${fmtShort(trendDelta)} / period`
                                                                            : `Spending projected to decrease by ${fmtShort(Math.abs(trendDelta))} / period`,
                                                                        color: trendDelta > 0 ? '#dc2626' : GREEN,
                                                                    },
                                                                    {
                                                                        icon: <DollarSign size={11} />,
                                                                        text: `Projected monthly total: ~${fmt(projectedAvg * (period === 'daily' ? 30 : period === 'weekly' ? 4.33 : period === 'biweekly' ? 2.17 : 1))}`,
                                                                        color: NAVY,
                                                                    },
                                                                    {
                                                                        icon: <Activity size={11} />,
                                                                        text: `Based on ${n} ${activePeriodLabel.toLowerCase()} period${n !== 1 ? 's' : ''} of data`,
                                                                        color: TEAL,
                                                                    },
                                                                ].map(({ icon, text, color }, i) => (
                                                                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, p: 1, borderRadius: '7px', bgcolor: alpha(color, 0.05), border: `1px solid ${alpha(color, 0.1)}` }}>
                                                                        <Box sx={{ color, flexShrink: 0, mt: 0.1 }}>{icon}</Box>
                                                                        <Typography sx={{ fontSize: '0.72rem', color: '#444', lineHeight: 1.4 }}>{text}</Typography>
                                                                    </Box>
                                                                ))}
                                                            </Stack>
                                                        </Box>
                                                    </Box>
                                                </Stack>
                                            );
                                        })()}

                                    </Box>
                                </Grow>
                            </Grid>
                        </Grid>
                    </>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    GROCERIES TAB
                ══════════════════════════════════════════════════════════════ */}
                {mainTab === 1 && (
                    <>
                        {/* Grocery summary banner */}
                        {selectedBudget && !groceryLoading && (
                            <Grow in={animateIn} timeout={600}>
                                <Paper sx={{ mb: 3, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.12)}`, boxShadow: `0 4px 20px ${alpha(MAROON, 0.1)}`, position: 'relative' }}>
                                    <Box sx={{ px: 3, py: 2, background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 50%, #5a1515 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
                                        <Box sx={{ position: 'absolute', top: -24, right: -24, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative' }}>
                                            <Box sx={{ width: 34, height: 34, borderRadius: '9px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ShoppingCart size={17} color="#fff" /></Box>
                                            <Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', letterSpacing: '-0.01em' }}>Month Overview</Typography>
                                                <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)' }}>
                                                    {format(parseISO(selectedBudget.startDate), 'MMM d')} – {format(parseISO(selectedBudget.endDate), 'MMM d, yyyy')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.4, borderRadius: '20px', bgcolor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
                                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff' }}>{groceryPct.toFixed(0)}% used</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', bgcolor: '#fff', position: 'relative' }}>
                                        {[
                                            { label: 'Budget', value: `$${groceryBudget.toFixed(2)}`, color: MAROON, sub: 'monthly limit', icon: <ShoppingCart size={12} color={alpha(MAROON, 0.6)} /> },
                                            { label: 'Spent', value: `$${groceryTotal.toFixed(2)}`, color: groceryTotal > groceryBudget ? '#dc2626' : NAVY, sub: `${groceryPct.toFixed(1)}% of budget`, icon: <TrendingUp size={12} color={alpha(groceryTotal > groceryBudget ? '#dc2626' : NAVY, 0.6)} /> },
                                            { label: 'Remaining', value: `$${Math.abs(groceryRemaining).toFixed(2)}${groceryRemaining < 0 ? ' over' : ''}`, color: groceryRemaining < 0 ? '#dc2626' : GREEN, sub: groceryRemaining < 0 ? 'over budget' : 'under budget', icon: <TrendingDown size={12} color={alpha(groceryRemaining < 0 ? '#dc2626' : GREEN, 0.6)} /> },
                                            { label: 'Stores', value: `${selectedBudget.stores.length}`, color: TEAL, sub: 'this period', icon: <ShoppingCart size={12} color={alpha(TEAL, 0.6)} /> },
                                            { label: 'Savings Goal', value: `$${grocerySavings.toFixed(2)}`, color: groceryRemaining >= grocerySavings ? GREEN : '#d97706', sub: groceryRemaining >= grocerySavings ? 'on track!' : 'need to cut back', icon: <PiggyBank size={12} color={alpha(groceryRemaining >= grocerySavings ? GREEN : '#d97706', 0.6)} /> },
                                        ].map(({ label, value, color, sub, icon }, i, arr) => (
                                            <Box key={label} sx={{ flex: 1, textAlign: 'center', px: 2, py: 2, borderRight: i < arr.length - 1 ? `1px solid ${alpha('#000', 0.07)}` : 'none' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4, mb: 0.4 }}>
                                                    {icon}<Typography sx={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: SLATE }}>{label}</Typography>
                                                </Box>
                                                <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</Typography>
                                                <Typography sx={{ fontSize: '0.62rem', color: SLATE, mt: 0.3 }}>{sub}</Typography>
                                            </Box>
                                        ))}
                                        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, bgcolor: alpha('#000', 0.04) }}>
                                            <Box sx={{ height: '100%', width: `${groceryPct}%`, bgcolor: groceryPct > 90 ? '#dc2626' : groceryPct > 70 ? '#d97706' : TEAL, transition: 'width 0.6s ease', borderRadius: '0 2px 2px 0' }} />
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grow>
                        )}

                        {/* Loading */}
                        {groceryLoading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <CircularProgress size={36} thickness={4} sx={{ color: MAROON, mb: 2 }} />
                                    <Typography sx={{ fontSize: '0.95rem', color: SLATE, fontWeight: 600 }}>Loading budgets…</Typography>
                                </Box>
                            </Box>
                        )}

                        {/* Error */}
                        {groceryError && !groceryLoading && (
                            <Grow in timeout={400}>
                                <Box sx={{ mb: 3, p: 2.5, background: alpha(MAROON, 0.06), color: MAROON, borderRadius: '10px', border: `1px solid ${alpha(MAROON, 0.18)}` }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Error Loading Grocery Data</Typography>
                                    <Typography variant="body2" sx={{ color: '#666', mt: 0.25 }}>{groceryError}</Typography>
                                </Box>
                            </Grow>
                        )}

                        {/* Main grocery content */}
                        {!groceryLoading && selectedBudget && (
                            <Grow in={animateIn} timeout={800}>
                                <Grid container spacing={2.5}>
                                    <Grid item xs={12} lg={8}>
                                        <GroceryBudgetTable
                                            budget={transformBudgetData(selectedBudget)}
                                            viewMode={groceryViewMode}
                                            onViewModeChange={(mode) => { setGroceryViewMode(mode); setSelectedReceipt(null); setSelectedWeek(null); }}
                                            onReceiptSelect={setSelectedReceipt}
                                            onWeekSelect={(week) => { setSelectedWeek(week); setSelectedReceipt(null); }}
                                        />
                                    </Grid>
                                    {showRightPanel && (
                                        <Grid item xs={12} lg={4}>
                                            <Box sx={{ position: 'sticky', top: 24 }}>
                                                {groceryViewMode === 'week' && <GroceryBudgetStatsPanel budget={transformBudgetData(selectedBudget)} />}
                                                {groceryViewMode === 'receiptDetail' && (
                                                    <ReceiptDetailPanel receipt={selectedReceipt} weekReceipts={selectedReceipt ? weeklyData.find(w => w.weekNumber === selectedReceipt.weekNumber)?.receipts || [] : []} />
                                                )}
                                                {groceryViewMode === 'analytics' && <GroceryAnalyticsPanel budget={transformBudgetData(selectedBudget)} />}
                                                {groceryViewMode === 'groceryList' && <GroceryListStatsPanel budget={transformBudgetData(selectedBudget)} />}
                                            </Box>
                                        </Grid>
                                    )}
                                </Grid>
                            </Grow>
                        )}

                        {/* Grocery dialogs */}
                        <GroceryBudgetCreate open={createDialogOpen} onSuccess={() => { setCreateDialogOpen(false); loadBudgets(currentMonth); }} onClose={() => setCreateDialogOpen(false)} />
                        <GroceryListDialog open={groceryListDialogOpen} onClose={() => setGroceryListDialogOpen(false)} budgets={dummyBudgetList} onSave={(items) => { setSavedGroceryList(items); setGroceryListDialogOpen(false); }} />
                        <ReceiptScanDialog open={receiptScanDialogOpen} onClose={() => setReceiptScanDialogOpen(false)} budgets={dummyBudgetList} onUpload={async (_f, _id) => { await new Promise<void>(r => setTimeout(r, 2000)); }} />
                    </>
                )}

            </Container>

            <Snackbar open={snackOpen} autoHideDuration={5000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackOpen(false)} severity={snackSev} sx={{ width: '100%', borderRadius: 2 }}>{snackMsg}</Alert>
            </Snackbar>
        </Box>
    );
};

export default SpendingPage;