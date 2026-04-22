import {addMonths, endOfMonth, format, startOfMonth, subMonths} from 'date-fns';
import {
    Box,
    Button,
    Grid,
    Typography,
    Card,
    IconButton,
    alpha,
    Container,
    Grow,
    Skeleton,
    Stack,
    Snackbar,
    Alert,
    Dialog,
    CircularProgress,
    LinearProgress,
    Divider,
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    PieChart,
    Award,
    ImportIcon,
    Delete,
    Clock,
    TrendingUp,
    TrendingDown,
    Minus,
    PiggyBank,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import BudgetPeriodTable from './BudgetPeriodTable';
import DynamicBudgetPanel, { CSVTransactionsByDateCategory } from './DynamicBudgetPanel';
import BudgetRunnerService, { BudgetRunnerResult } from '../services/BudgetRunnerService';
import CsvUploadService from '../services/CsvUploadService';
import { BudgetCategoryStats, BudgetStats } from '../utils/Items';
import DateRange from '../domain/DateRange';
import CSVImportDialog from './CSVImportDialog';
import BudgetService from '../services/BudgetService';
import { BudgetQuestions } from '../utils/BudgetUtils';
import BudgetQuestionnaireForm from './BudgetQuestionnaireForm';
import ManageBudgetsDialog from './ManageBudgetsDialog';
import ManageBudgetCategoriesDialog from './ManageBudgetCategoriesDialog';
import BudgetCategoriesService from '../services/BudgetCategoriesService';
import UserService from '../services/UserService';
import TransactionCategoryService from '../services/TransactionCategoryService';
import BudgetOverview from './BudgetOverview';
import TopExpenseCategory from './TopExpenseCategory';

// ── Design tokens ──────────────────────────────────────────────────────────────
const MAROON      = '#6b1a1a';   // deep wine — warm, not bright
const MAROON_DARK = '#4a1010';   // darker for hover states

// Card palette — each card gets its own non-white base colour
// These are intentionally muted so numbers/chips still pop
const CARD_THEMES = {
    budget: {
        base:        '#f0f4ff',   // cool blue-grey
        border:      '#6b1a1a',
        valueColor:  '#1e1e2e',
        barColor:    '#6b1a1a',
        chipBg:      'rgba(128,0,0,0.10)',
        chipColor:   '#6b1a1a',
        labelColor:  '#5a5a7a',
    },
    spent_ok: {
        base:        '#f0fdf4',   // soft green
        border:      '#16a34a',
        valueColor:  '#14532d',
        barColor:    '#16a34a',
        chipBg:      'rgba(22,163,74,0.12)',
        chipColor:   '#15803d',
        labelColor:  '#4a7060',
    },
    spent_warn: {
        base:        '#fffbeb',   // warm amber
        border:      '#d97706',
        valueColor:  '#78350f',
        barColor:    '#d97706',
        chipBg:      'rgba(217,119,6,0.12)',
        chipColor:   '#92400e',
        labelColor:  '#7a6030',
    },
    spent_over: {
        base:        '#fff1f2',   // soft red
        border:      '#dc2626',
        valueColor:  '#7f1d1d',
        barColor:    '#dc2626',
        chipBg:      'rgba(220,38,38,0.12)',
        chipColor:   '#991b1b',
        labelColor:  '#7a3030',
    },
    remaining_good: {
        base:        '#f0fdf4',
        border:      '#16a34a',
        valueColor:  '#14532d',
        barColor:    '#16a34a',
        chipBg:      'rgba(22,163,74,0.12)',
        chipColor:   '#15803d',
        labelColor:  '#4a7060',
    },
    remaining_warn: {
        base:        '#fffbeb',
        border:      '#d97706',
        valueColor:  '#78350f',
        barColor:    '#d97706',
        chipBg:      'rgba(217,119,6,0.12)',
        chipColor:   '#92400e',
        labelColor:  '#7a6030',
    },
    remaining_bad: {
        base:        '#fff1f2',
        border:      '#dc2626',
        valueColor:  '#7f1d1d',
        barColor:    '#dc2626',
        chipBg:      'rgba(220,38,38,0.12)',
        chipColor:   '#991b1b',
        labelColor:  '#7a3030',
    },
    saved_good: {
        base:        '#f0f9ff',   // sky teal
        border:      '#0284c7',
        valueColor:  '#0c4a6e',
        barColor:    '#0284c7',
        chipBg:      'rgba(2,132,199,0.12)',
        chipColor:   '#075985',
        labelColor:  '#3a6070',
    },
    saved_low: {
        base:        '#fafafa',   // near-white neutral
        border:      '#94a3b8',
        valueColor:  '#334155',
        barColor:    '#94a3b8',
        chipBg:      'rgba(148,163,184,0.15)',
        chipColor:   '#475569',
        labelColor:  '#64748b',
    },
};

type CardThemeKey = keyof typeof CARD_THEMES;

function resolveCardTheme(title: string, amount: number, totalBudget: number): CardThemeKey {
    if (title === 'Total Budget') return 'budget';
    if (title === 'Total Spent') {
        const pct = totalBudget > 0 ? amount / totalBudget : 0;
        if (pct > 1)    return 'spent_over';
        if (pct > 0.8)  return 'spent_warn';
        return 'spent_ok';
    }
    if (title === 'Remaining') {
        if (amount < 0) return 'remaining_bad';
        const pct = totalBudget > 0 ? amount / totalBudget : 1;
        if (pct < 0.1)  return 'remaining_warn';
        return 'remaining_good';
    }
    // Total Saved
    const pct = totalBudget > 0 ? amount / totalBudget : 0;
    return pct >= 0.05 ? 'saved_good' : 'saved_low';
}

function chipLabel(title: string, amount: number, totalBudget: number, daysRemaining: number): string {
    if (title === 'Total Budget') return 'Monthly limit';
    if (title === 'Total Spent') {
        const pct = totalBudget > 0 ? (amount / totalBudget) * 100 : 0;
        if (pct > 100)  return `${(pct - 100).toFixed(0)}% over budget`;
        if (pct > 80)   return `${pct.toFixed(0)}% — watch out`;
        return `${pct.toFixed(0)}% of budget`;
    }
    if (title === 'Remaining') {
        if (amount < 0) return 'Over budget';
        return `${daysRemaining}d remaining`;
    }
    const pct = totalBudget > 0 ? (amount / totalBudget) * 100 : 0;
    return `${pct.toFixed(1)}% of budget`;
}

function chipIcon(title: string, amount: number, totalBudget: number) {
    if (title === 'Total Budget') return <Minus size={11} />;
    if (title === 'Total Spent') {
        const pct = totalBudget > 0 ? amount / totalBudget : 0;
        return pct > 0.8 ? <TrendingUp size={11} /> : <TrendingDown size={11} />;
    }
    if (title === 'Remaining') return amount < 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />;
    return <PiggyBank size={11} />;
}
// ──────────────────────────────────────────────────────────────────────────────

const BudgetPage: React.FC = () => {
                    const [currentMonth, setCurrentMonth] = useState(new Date());
                    const [isLoading, setIsLoading] = useState(false);
                    const [error, setError] = useState<string | null>(null);
                    const [animateIn, setAnimateIn] = useState(false);
                    const [importDialogOpen, setImportDialogOpen] = useState(false);
                    const [uploadAccess, setUploadAccess] = useState<boolean>(false);
                    const budgetRunnerService = BudgetRunnerService.getInstance();
                    const budgetCategoryService = BudgetCategoriesService.getInstance();
                    const transactionCategoryService = TransactionCategoryService.getInstance();
                    const [budgetData, setBudgetData] = useState<BudgetRunnerResult[]>([]);
                    const userId = Number(sessionStorage.getItem('userId'));
                    const [successMessage, setSuccessMessage] = useState<string | null>(null);
                    const [snackBarOpen, setSnackbarOpen] = useState(false);
                    const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
                    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>();
                    const [newBudgetDialogOpen, setNewBudgetDialogOpen] = useState<boolean>(false);
                    const [manageBudgetsDialogOpen, setManageBudgetsDialogOpen] = useState<boolean>(false);
                    const [manageCategoriesDialogOpen, setManageCategoriesDialogOpen] = useState<boolean>(false);
                    const [isBudgetCategoryLoading, setIsBudgetCategoryLoading] = useState<boolean>(false);
                    const [budgetCategoryLoadingMessage, setBudgetCategoryLoadingMessage] = useState<string>('');
                    const [categoryTransactionsByDate, setCategoryTransactionsByDate] = useState<CSVTransactionsByDateCategory[]>([]);
                    const userService = UserService.getInstance();
                    const startDate = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
                    const endDate   = useMemo(() => endOfMonth(currentMonth),   [currentMonth]);
                    const [budgetUpdateConfirmOpen, setBudgetUpdateConfirmOpen] = useState(false);
                    const [pendingBudgetUpdate, setPendingBudgetUpdate] = useState<{ categoryName: string; newAmount: number } | null>(null);

                    const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
                    const uploadService = new CsvUploadService();
                    const budgetService = BudgetService.getInstance();

                    const handlePreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
                    const handleNextMonth     = () => setCurrentMonth(prev => addMonths(prev, 1));

    //                 useEffect(() => {
    //                     if (!userId) return;
    //                     const s = startOfMonth(currentMonth);
    //                     const e = endOfMonth(currentMonth);
    //
    //                     const run = async () => {
    //                         try {
    //                             const hasPlaidCSVSync = await userService.checkUserHasPlaidCSVSyncEnabled(userId);
    //
    //                             const [plaidHasNew, plaidHasUpdated] = await Promise.all([
    //                                 transactionCategoryService.checkNewTransactionCategoriesByDateRange(userId, s, e),
    //                                 transactionCategoryService.checkUpdatedTransactionCategoriesByDateRange(userId, s, e),
    //             ]);
    //             const [csvHasNew, csvHasUpdated] = hasPlaidCSVSync
    //                 ? await Promise.all([
    //                     transactionCategoryService.checkNewCSVTransactionCategoriesByDateRange(userId, s, e),
    //                     transactionCategoryService.checkUpdatedCSVTransactionCategoriesByDateRange(userId, s, e),
    //                 ])
    //                 : [false, false];
    //
    //             if (plaidHasNew || csvHasNew) {
    //                 setIsBudgetCategoryLoading(true);
    //                 await budgetCategoryService.createBudgetCategoriesForDateRange(userId, s, e);
    //             }
    //
    //             if (plaidHasUpdated || csvHasUpdated) {
    //                 setIsBudgetCategoryLoading(true);
    //                 await budgetCategoryService.updateBudgetCategoriesByMonth(userId, s, e);
    //             }
    //
    //             const data = await fetchBudgetData(currentMonth);
    //
    //             // Only fall back to update if nothing was built and no transactions triggered above
    //             if ((!data || data.length === 0) && !plaidHasNew && !csvHasNew && !plaidHasUpdated && !csvHasUpdated) {
    //                 setIsBudgetCategoryLoading(true);
    //                 await budgetCategoryService.updateBudgetCategoriesByMonth(userId, s, e);
    //                 await fetchBudgetData(currentMonth);
    //             }
    //         } catch (ex) {
    //             console.error(ex);
    //             setSnackbarMessage('Failed to sync budget categories');
    //             setSnackbarSeverity('error');
    //             setSnackbarOpen(true);
    //         } finally {
    //             setIsBudgetCategoryLoading(false);
    //         }
    //     };
    //
    //     run();
    // }, [userId, currentMonth]); // single effect, single dependency array

    useEffect(() => {
        const s = startOfMonth(currentMonth);
        const e = endOfMonth(currentMonth);
        const run = async () => {
            try {
                const hasPlaidCSVSync = await userService.checkUserHasPlaidCSVSyncEnabled(userId);
                const plaidHasNew = await transactionCategoryService.checkNewTransactionCategoriesByDateRange(userId, s, e);
                const csvHasNew = hasPlaidCSVSync
                    ? await transactionCategoryService.checkNewCSVTransactionCategoriesByDateRange(userId, s, e)
                    : false;
                if (plaidHasNew || csvHasNew) {
                    setIsBudgetCategoryLoading(true);
                    await budgetCategoryService.createBudgetCategoriesForDateRange(userId, s, e);
                    fetchBudgetData(currentMonth, true);
                    await new Promise(r => setTimeout(r, 2000));
                    setIsBudgetCategoryLoading(false);
                }
            } catch (ex) {
                console.error(ex);
                setSnackbarMessage('Failed to create budget categories');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
                setIsBudgetCategoryLoading(false);
            }
        };
        run();
    }, [userId, currentMonth]);

    useEffect(() => {
        const s = startOfMonth(currentMonth);
        const e = endOfMonth(currentMonth);
        const run = async () => {
            try {
                const hasPlaidCSVSync = await userService.checkUserHasPlaidCSVSyncEnabled(userId);
                const plaidHasUpdated = await transactionCategoryService.checkUpdatedTransactionCategoriesByDateRange(userId, s, e);
                const csvHasUpdated = hasPlaidCSVSync
                    ? await transactionCategoryService.checkUpdatedCSVTransactionCategoriesByDateRange(userId, s, e)
                    : false;

                if (plaidHasUpdated || csvHasUpdated) {
                    setIsBudgetCategoryLoading(true);
                    await budgetCategoryService.updateBudgetCategoriesByMonth(userId, s, e);
                    await fetchBudgetData(currentMonth);
                    await new Promise(r => setTimeout(r, 2000));
                    setIsBudgetCategoryLoading(false);
                } else {
                    const data = await fetchBudgetData(currentMonth);
                    if (!data || data.length === 0) {
                        setIsBudgetCategoryLoading(true);
                        await budgetCategoryService.updateBudgetCategoriesByMonth(userId, s, e);
                        await fetchBudgetData(currentMonth);
                        await new Promise(r => setTimeout(r, 2000));
                        setIsBudgetCategoryLoading(false);
                    }
                }
            } catch (ex) {
                console.error(ex);
                setSnackbarMessage('Failed to update budget categories');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
                setIsBudgetCategoryLoading(false);
            }
        };
        run();
    }, [currentMonth]);

    useEffect(() => {
        const run = async () => {
            try {
                const uid = Number(sessionStorage.getItem('userId'));
                setUploadAccess(await userService.fetchUserOverrideEnabled(uid));
            } catch (ex) { console.error(ex); }
        };
        run();
    });

    useEffect(() => {
        if (!userId) return;
        const run = async () => {
            try {
                const data = await transactionCategoryService.fetchCSVTransactionsByCategoryWithDate(
                    userId, formatDate(startDate), formatDate(endDate)
                );
                setCategoryTransactionsByDate(data);
            } catch (ex) { console.error(ex); }
        };
        run();
    }, [userId, startDate, endDate]);

    const doesBudgetExistForBeginningYear = async (retryCount = 0): Promise<boolean> => {
        try {
            if (retryCount > 0) await new Promise(r => setTimeout(r, 500));
            const exists = await budgetService.checkIfBudgetExistsForYear(userId, new Date().getFullYear());
            if (!exists && retryCount === 0) return await doesBudgetExistForBeginningYear(1);
            if (!exists) setNewBudgetDialogOpen(true);
            return exists;
        } catch (ex) {
            console.error(ex);
            setSnackbarMessage('Failed to check if budget exists');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return false;
        }
    };

    useEffect(() => { doesBudgetExistForBeginningYear(); }, [userId]);

    useEffect(() => {
        document.title = 'Budgets';
        setTimeout(() => setAnimateIn(true), 100);
        return () => { document.title = 'BudgetBuddy'; };
    }, []);

    const fetchBudgetData = async (date: Date, useCategoryLoader = false): Promise<BudgetRunnerResult[]> => {
        try {
            if (useCategoryLoader) { setIsBudgetCategoryLoading(true); } else { setIsLoading(true); }
            setError(null);
            const s = new Date(date.getFullYear(), date.getMonth(), 1);
            const e = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            const results = await budgetRunnerService.getBudgetsByDateRange(userId, s, e);
            if (areAllBudgetCategoriesEmpty(results[0]?.budgetCategoryStats)) {
                try {
                    await budgetCategoryService.createBudgetCategoriesForDateRange(userId, s, e);
                    const fresh = await budgetRunnerService.getBudgetsByDateRange(userId, s, e);
                    setBudgetData(fresh);
                    return fresh;
                } catch {
                    setError('Failed to create budget categories. Please try again.');
                    setBudgetData([]);
                    return [];
                }
            }
            setBudgetData(results);
            return results;
        } catch {
            setError('Failed to fetch budget data. Please try again later.');
            return [];
        } finally {
            if (useCategoryLoader) {
                setIsBudgetCategoryLoading(false);
                setBudgetCategoryLoadingMessage('');
            } else {
                setIsLoading(false);
            }
        }
    };

    const isEmpty = <T,>(arr: T[] | null | undefined) => !arr || arr.length === 0;

    const areAllBudgetCategoriesEmpty = (stats: BudgetCategoryStats | undefined): boolean => {
        if (!stats) return true;
        return (
            stats.expenseCategories === null &&
            stats.incomeCategories  === null &&
            isEmpty(stats.topExpenseCategories) &&
            stats.savingsCategories === null &&
            isEmpty(stats.budgetPeriodCategories)
        );
    };

    const defaultBudgetStats: BudgetStats = {
        averageSpendingPerDay: 0, budgetId: 0,
        dateRange: new DateRange(new Date(), new Date()),
        healthScore: 0, monthlyProjection: null,
        remaining: 0, totalBudget: 0, totalSaved: 0, totalSpent: 0,
    };

    const budgetStats = useMemo(() => {
        if (!budgetData?.length) return defaultBudgetStats;
        const item  = budgetData[0];
        const stats = item?.budgetStats[0];
        const cat   = item?.budgetCategoryStats;
        if (!stats || !cat) return defaultBudgetStats;
        const totalSpent = cat.expenseCategories?.actualExpenses    ?? 0;
        const totalSaved = cat.savingsCategories?.actualSavedAmount ?? 0;
        const sa = (stats.dateRange.startDate as unknown) as number[];
        const ea = (stats.dateRange.endDate   as unknown) as number[];
        return {
            averageSpendingPerDay: stats.averageSpendingPerDay ?? 0,
            budgetId: stats.budgetId,
            dateRange: new DateRange(
                new Date(sa[0], sa[1] - 1, sa[2]),
                new Date(ea[0], ea[1] - 1, ea[2])
            ),
            healthScore:       stats.healthScore ?? 0,
            monthlyProjection: stats.monthlyProjection,
            remaining:   stats.totalBudget - totalSpent,
            totalBudget: stats.totalBudget,
            totalSaved, totalSpent,
        };
    }, [budgetData]);

    // cumulative all-time saved (sum across all loaded budget periods)
    const cumulativeSaved = useMemo(() => {
        return budgetData.reduce((acc, b) => {
            return acc + (b.budgetCategoryStats?.savingsCategories?.actualSavedAmount ?? 0);
        }, 0);
    }, [budgetData]);

    const metrics = useMemo(() => {
        const today       = new Date();
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        let daysElapsed   = today.getDate();
        let daysRemaining = daysInMonth - daysElapsed;
        if (currentMonth.getMonth() < today.getMonth() || currentMonth.getFullYear() < today.getFullYear()) { daysElapsed = daysInMonth; daysRemaining = 0; }
        else if (currentMonth.getMonth() > today.getMonth() || currentMonth.getFullYear() > today.getFullYear()) { daysElapsed = 0; daysRemaining = daysInMonth; }
        const percentElapsed     = (daysElapsed / daysInMonth) * 100;
        const idealSpentSoFar    = budgetStats.totalBudget * (percentElapsed / 100);
        const spendingDifference = idealSpentSoFar - budgetStats.totalSpent;
        return {
            daysElapsed, daysRemaining, percentElapsed,
            idealSpendRate:     budgetStats.totalBudget / daysInMonth,
            actualSpendRate:    budgetStats.totalSpent  / (daysElapsed || 1),
            dailyBudget:        budgetStats.remaining   / (daysRemaining || 1),
            isUnderBudget:      spendingDifference > 0,
            spendingDifference: Math.abs(spendingDifference),
        };
    }, [currentMonth, budgetStats]);

    const topExpenseCategories = useMemo(() => {
        if (!budgetData?.length) return [];
        return budgetData.reduce<any[]>((acc, budget) => {
            const s = budget.budgetCategoryStats;
            if (!s?.topExpenseCategories) return acc;
            return [...acc, ...s.topExpenseCategories.map(e => ({
                categoryName: e.category, budgetedAmount: e.budgetedExpenses,
                actualAmount: e.actualExpenses, remainingAmount: e.remainingExpenses,
                startDate: e.startDate, endDate: e.endDate, isActive: e.active,
                isRecurring: false, isCustom: false,
            }))];
        }, []);
    }, [budgetData]);

    const overviewCategories = useMemo(() => {
        if (!budgetData?.length) return [];
        const cat = budgetData[0]?.budgetCategoryStats;
        const out: any[] = [];
        if (cat?.expenseCategories) out.push({ category: 'Expenses', budgetedExpenses: cat.expenseCategories.budgetedExpenses, actualExpenses: cat.expenseCategories.actualExpenses, remainingExpenses: cat.expenseCategories.remainingExpenses });
        if (cat?.incomeCategories)  out.push({ category: 'Income',   budgetedExpenses: cat.incomeCategories.budgetedIncome,    actualExpenses: cat.incomeCategories.actualBudgetedIncome, remainingExpenses: cat.incomeCategories.remainingIncome });
        if (cat?.savingsCategories) out.push({ category: 'Savings',  budgetedExpenses: cat.savingsCategories.budgetedSavingsTarget, actualExpenses: cat.savingsCategories.actualSavedAmount, remainingExpenses: cat.savingsCategories.remainingToSave });
        return out;
    }, [budgetData]);

    const budgetCategories = useMemo(() => {
        if (!budgetData?.length) return [];
        return (budgetData[0]?.budgetCategoryStats?.budgetPeriodCategories || []).map(c => ({
            categoryName: c.category, budgetedAmount: c.budgeted, actualAmount: c.actual,
            remainingAmount: c.remaining, isRecurring: c.isRecurring || false, isCustom: c.isCustom || false,
        }));
    }, [budgetData]);

    const recurringCategories = useMemo(() => budgetCategories.filter(c => c.isRecurring), [budgetCategories]);

    const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <Box sx={{ maxWidth: 'calc(100% - 240px)', ml: '240px', minHeight: '100vh', background: '#f0f2f5' }}>
            <Sidebar />

            {isBudgetCategoryLoading && (
                <Box sx={{
                    position: 'fixed', inset: 0, bgcolor: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', zIndex: 9999,
                }}>
                    <CircularProgress size={52} thickness={4} sx={{ color: MAROON, mb: 2.5 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#111', mb: 0.5 }}>
                        {budgetCategoryLoadingMessage || 'Syncing Budget Categories'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Please wait a moment…</Typography>
                </Box>
            )}

            <Container maxWidth="xl" sx={{ py: 4 }}>

                {/* ── Header ────────────────────────────────────────────────── */}
                <Grow in={animateIn} timeout={400}>
                    <Box sx={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        mb: 4, flexDirection: { xs: 'column', sm: 'row' },
                        textAlign: { xs: 'center', sm: 'left' }, gap: 2,
                    }}>
                        <Box>
                            <Box sx={{ width: 28, height: 3, background: MAROON, borderRadius: '2px', mb: 0.75 }} />
                            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#111', letterSpacing: '-0.025em' }}>
                                {format(currentMonth, 'MMMM yyyy')} Budget
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: '#888', mt: 0.5 }}>
                                Track your progress and stay within your spending limits
                            </Typography>
                        </Box>

                        {/* ── Nav + action buttons (matching Option A preview style) ── */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <IconButton onClick={handlePreviousMonth} disabled={isLoading} sx={{
                                width: 32, height: 32, borderRadius: '6px',
                                background: MAROON, color: '#fff',
                                '&:hover': { background: MAROON_DARK },
                                '&.Mui-disabled': { background: '#ddd', color: '#aaa' },
                            }}>
                                <ChevronLeft size={16} />
                            </IconButton>

                            <Card elevation={0} sx={{
                                px: 2, py: 0.75, display: 'flex', alignItems: 'center', gap: 1,
                                borderRadius: '8px', border: '1px solid #e0e0e0', background: '#f9f9f9',
                            }}>
                                <Calendar size={14} color="#888" />
                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#222' }}>
                                    {format(currentMonth, 'MMMM yyyy')}
                                </Typography>
                            </Card>

                            <IconButton onClick={handleNextMonth} disabled={isLoading} sx={{
                                width: 32, height: 32, borderRadius: '6px',
                                background: MAROON, color: '#fff',
                                '&:hover': { background: MAROON_DARK },
                                '&.Mui-disabled': { background: '#ddd', color: '#aaa' },
                            }}>
                                <ChevronRight size={16} />
                            </IconButton>

                            {/* Option A bank-style: grey border, dark text, maroon only on hover */}
                            {([
                                { label: 'Import',     icon: <ImportIcon size={14} />, onClick: () => setImportDialogOpen(true),          disabled: !uploadAccess, ml: 1 },
                                { label: 'Manage',     icon: <Clock size={14} />,      onClick: () => setManageBudgetsDialogOpen(true),    disabled: false,         ml: 0 },
                                { label: 'Categories', icon: <PieChart size={14} />,   onClick: () => setManageCategoriesDialogOpen(true), disabled: false,         ml: 0 },
                            ] as Array<{ label: string; icon: React.ReactNode; onClick: () => void; disabled: boolean; ml: number }>).map(({ label, icon, onClick, disabled, ml }) => (
                                <Button
                                    key={label}
                                    variant="outlined"
                                    size="small"
                                    startIcon={icon}
                                    onClick={onClick}
                                    disabled={disabled}
                                    sx={{
                                        ml, borderRadius: '6px', textTransform: 'none',
                                        fontWeight: 600, fontSize: '0.78rem', letterSpacing: '0.02em',
                                        borderColor: '#d5d5d5', color: '#333', bgcolor: '#fff',
                                        '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: alpha(MAROON, 0.04) },
                                        '&.Mui-disabled': { borderColor: '#e8e8e8', color: '#bbb' },
                                    }}>
                                    {label}
                                </Button>
                            ))}
                        </Box>
                    </Box>
                </Grow>

                {/* ── Error banner ───────────────────────────────────────────── */}
                {error && (
                    <Grow in timeout={400}>
                        <Box sx={{
                            mb: 3, p: 2.5, background: alpha(MAROON, 0.06), color: MAROON,
                            borderRadius: '10px', border: `1px solid ${alpha(MAROON, 0.18)}`,
                            display: 'flex', alignItems: 'center', gap: 2,
                        }}>
                            <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: alpha(MAROON, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Award size={18} color={MAROON} />
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.25 }}>Error Loading Budget Data</Typography>
                                <Typography variant="body2" sx={{ color: '#666' }}>{error}</Typography>
                            </Box>
                        </Box>
                    </Grow>
                )}

                {/* ── Summary cards ──────────────────────────────────────────── */}
                <Grow in={animateIn} timeout={600}>
                    <Grid container spacing={2.5} sx={{ mb: 4 }}>

                        {/* ── 1. Total Budget ── */}
                        {(() => {
                            const t = CARD_THEMES.budget;
                            return (
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{
                                        background: t.base, borderRadius: '10px',
                                        borderTop: `3px solid ${t.border}`,
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
                                        p: 2.5, height: '100%',
                                        transition: 'box-shadow 0.2s',
                                        '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' },
                                    }}>
                                        <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.labelColor, fontWeight: 700, mb: 1 }}>
                                            Total Budget
                                        </Typography>
                                        {isLoading
                                            ? <Skeleton variant="text" width="70%" height={42} />
                                            : <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: t.valueColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1, mb: 0.5 }}>
                                                {fmt(budgetStats.totalBudget)}
                                            </Typography>
                                        }
                                        <LinearProgress variant="determinate" value={100} sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(t.barColor, 0.15), '& .MuiLinearProgress-bar': { bgcolor: t.barColor, borderRadius: 2 } }} />
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                                            <Typography sx={{ fontSize: '0.72rem', color: t.labelColor }}>{format(currentMonth, 'MMMM yyyy')}</Typography>
                                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: t.chipBg, color: t.chipColor, fontSize: '0.65rem', fontWeight: 700 }}>
                                                <Minus size={11} /> Monthly limit
                                            </Box>
                                        </Box>
                                    </Box>
                                </Grid>
                            );
                        })()}

                        {/* ── 2. Total Spent ── */}
                        {(() => {
                            const key = resolveCardTheme('Total Spent', budgetStats.totalSpent, budgetStats.totalBudget);
                            const t   = CARD_THEMES[key];
                            const pct = budgetStats.totalBudget > 0 ? Math.min((budgetStats.totalSpent / budgetStats.totalBudget) * 100, 100) : 0;
                            return (
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{
                                        background: t.base, borderRadius: '10px',
                                        borderTop: `3px solid ${t.border}`,
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
                                        p: 2.5, height: '100%',
                                        transition: 'box-shadow 0.2s',
                                        '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' },
                                    }}>
                                        <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.labelColor, fontWeight: 700, mb: 1 }}>
                                            Total Spent
                                        </Typography>
                                        {isLoading
                                            ? <Skeleton variant="text" width="70%" height={42} />
                                            : <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: t.valueColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1, mb: 0.5 }}>
                                                {fmt(budgetStats.totalSpent)}
                                            </Typography>
                                        }
                                        <LinearProgress variant="determinate" value={pct} sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(t.barColor, 0.15), '& .MuiLinearProgress-bar': { bgcolor: t.barColor, borderRadius: 2 } }} />
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                                            <Typography sx={{ fontSize: '0.72rem', color: t.labelColor }}>Avg. ${Math.round(metrics.actualSpendRate)}/day</Typography>
                                            {!isLoading && (
                                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: t.chipBg, color: t.chipColor, fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                    {chipIcon('Total Spent', budgetStats.totalSpent, budgetStats.totalBudget)}
                                                    {chipLabel('Total Spent', budgetStats.totalSpent, budgetStats.totalBudget, metrics.daysRemaining)}
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                </Grid>
                            );
                        })()}

                        {/* ── 3. Remaining ── */}
                        {(() => {
                            const key = resolveCardTheme('Remaining', budgetStats.remaining, budgetStats.totalBudget);
                            const t   = CARD_THEMES[key];
                            const pct = budgetStats.totalBudget > 0 ? Math.max((budgetStats.remaining / budgetStats.totalBudget) * 100, 0) : 0;
                            return (
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{
                                        background: t.base, borderRadius: '10px',
                                        borderTop: `3px solid ${t.border}`,
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
                                        p: 2.5, height: '100%',
                                        transition: 'box-shadow 0.2s',
                                        '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' },
                                    }}>
                                        <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.labelColor, fontWeight: 700, mb: 1 }}>
                                            Remaining
                                        </Typography>
                                        {isLoading
                                            ? <Skeleton variant="text" width="70%" height={42} />
                                            : <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: t.valueColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1, mb: 0.5 }}>
                                                {fmt(Math.max(budgetStats.remaining, 0))}
                                            </Typography>
                                        }
                                        <LinearProgress variant="determinate" value={pct} sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(t.barColor, 0.15), '& .MuiLinearProgress-bar': { bgcolor: t.barColor, borderRadius: 2 } }} />
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                                            <Typography sx={{ fontSize: '0.72rem', color: t.labelColor }}>{metrics.daysRemaining} days left</Typography>
                                            {!isLoading && (
                                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: t.chipBg, color: t.chipColor, fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                    {chipIcon('Remaining', budgetStats.remaining, budgetStats.totalBudget)}
                                                    {chipLabel('Remaining', budgetStats.remaining, budgetStats.totalBudget, metrics.daysRemaining)}
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                </Grid>
                            );
                        })()}

                        {/* ── 4. Total Saved — monthly + cumulative ── */}
                        {(() => {
                            const key = resolveCardTheme('Total Saved', budgetStats.totalSaved, budgetStats.totalBudget);
                            const t   = CARD_THEMES[key];
                            const pct = budgetStats.totalBudget > 0 ? Math.min((budgetStats.totalSaved / budgetStats.totalBudget) * 100, 100) : 0;
                            return (
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{
                                        background: t.base, borderRadius: '10px',
                                        borderTop: `3px solid ${t.border}`,
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
                                        p: 2.5, height: '100%',
                                        transition: 'box-shadow 0.2s',
                                        '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' },
                                    }}>
                                        <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.labelColor, fontWeight: 700, mb: 1 }}>
                                            Saved This Month
                                        </Typography>
                                        {isLoading
                                            ? <Skeleton variant="text" width="70%" height={42} />
                                            : <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: t.valueColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1, mb: 0.5 }}>
                                                {fmt(budgetStats.totalSaved)}
                                            </Typography>
                                        }
                                        <LinearProgress variant="determinate" value={pct} sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(t.barColor, 0.15), '& .MuiLinearProgress-bar': { bgcolor: t.barColor, borderRadius: 2 } }} />

                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                                            <Typography sx={{ fontSize: '0.72rem', color: t.labelColor }}>this month</Typography>
                                            {!isLoading && (
                                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: t.chipBg, color: t.chipColor, fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                    <PiggyBank size={11} />
                                                    {chipLabel('Total Saved', budgetStats.totalSaved, budgetStats.totalBudget, metrics.daysRemaining)}
                                                </Box>
                                            )}
                                        </Box>

                                        {/* Divider + cumulative total */}
                                        <Divider sx={{ my: 1.25, borderColor: alpha(t.barColor, 0.2) }} />
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: t.labelColor, fontWeight: 700 }}>
                                                All-Time Saved
                                            </Typography>
                                            {isLoading
                                                ? <Skeleton variant="text" width={60} height={20} />
                                                : <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: t.valueColor, fontVariantNumeric: 'tabular-nums' }}>
                                                    {fmt(cumulativeSaved)}
                                                </Typography>
                                            }
                                        </Box>
                                    </Box>
                                </Grid>
                            );
                        })()}

                    </Grid>
                </Grow>

                {/* ── Main content ───────────────────────────────────────────── */}
                <Grid container spacing={3}>
                    <Grid item xs={12} lg={8}>
                        <Stack spacing={3}>

                            {/* ── Budget Overview ───────────────────────────────── */}
                            <Grow in={animateIn} timeout={700}>
                                <Box sx={{
                                    borderRadius: '16px', overflow: 'hidden',
                                    border: `1px solid ${alpha(MAROON, 0.15)}`,
                                    boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}`,
                                }}>
                                    {/* Maroon header */}
                                    <Box sx={{
                                        background: `linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)`,
                                        px: 3, py: 2, position: 'relative', overflow: 'hidden',
                                    }}>
                                        <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
                                        <Box sx={{ position: 'absolute', bottom: -20, right: 50, width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative' }}>
                                            <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <PieChart size={15} color="white" />
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>
                                                    Budget Overview
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>
                                                    Income, expenses &amp; savings at a glance
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                    {/* White body */}
                                    <Box sx={{ bgcolor: '#fff', p: 3 }}>
                                        <BudgetOverview isLoading={isLoading} data={budgetData} />
                                    </Box>
                                </Box>
                            </Grow>

                            {/* ── Top Spending Categories ───────────────────────── */}
                            <Grow in={animateIn} timeout={800}>
                                <Box sx={{
                                    borderRadius: '16px', overflow: 'hidden',
                                    border: `1px solid ${alpha(MAROON, 0.15)}`,
                                    boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}`,
                                }}>
                                    <Box sx={{
                                        background: `linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)`,
                                        px: 3, py: 2, position: 'relative', overflow: 'hidden',
                                    }}>
                                        <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
                                        <Box sx={{ position: 'absolute', bottom: -20, right: 50, width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative' }}>
                                            <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <TrendingUp size={15} color="white" />
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>
                                                    Top Spending Categories
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>
                                                    Where your money is going this month
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box sx={{ bgcolor: '#fff', p: 3 }}>
                                        <TopExpenseCategory isLoading={isLoading} categories={topExpenseCategories} />
                                    </Box>
                                </Box>
                            </Grow>

                            {/* ── Budget Breakdown ──────────────────────────────── */}
                            <Grow in={animateIn} timeout={900}>
                                <Box sx={{
                                    borderRadius: '16px', overflow: 'hidden',
                                    border: `1px solid ${alpha(MAROON, 0.15)}`,
                                    boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}`,
                                }}>
                                    <Box sx={{
                                        background: `linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)`,
                                        px: 3, py: 2, position: 'relative', overflow: 'hidden',
                                    }}>
                                        <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
                                        <Box sx={{ position: 'absolute', bottom: -20, right: 50, width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative' }}>
                                            <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Award size={15} color="white" />
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>
                                                    Budget Breakdown
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>
                                                    All categories &amp; their spending progress
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box sx={{ bgcolor: '#fff', p: 3 }}>
                                        <BudgetPeriodTable isLoading={isLoading} data={budgetData} />
                                    </Box>
                                </Box>
                            </Grow>

                        </Stack>
                    </Grid>

                    <Grid item xs={12} lg={4}>
                        <Grow in={animateIn} timeout={800}>
                            <Box sx={{ position: 'sticky', top: 24 }}>
                                <DynamicBudgetPanel
                                    isLoading={isLoading}
                                    topSpendingCategories={topExpenseCategories}
                                    overviewCategories={overviewCategories}
                                    recurringCategories={recurringCategories}
                                    budgetStats={budgetStats}
                                    allCategories={budgetCategories}
                                    categoryTransactionsByDate={categoryTransactionsByDate}
                                    onUpdateBudgetAmount={async (categoryName, newAmount) => {
                                        setPendingBudgetUpdate({ categoryName, newAmount });
                                        setBudgetUpdateConfirmOpen(true);
                                    }}
                                    onOptimizeBudget={async (categoryName) => {
                                        const cat = budgetCategories.find(c => c.categoryName === categoryName);
                                        const optimized = cat ? Math.max(cat.actualAmount * 1.1, 100) : 100;
                                        setSnackbarMessage(`Suggested budget for ${categoryName}: $${optimized.toFixed(2)}`);
                                        setSnackbarSeverity('info');
                                        setSnackbarOpen(true);
                                        return optimized;
                                    }}
                                />
                            </Box>
                        </Grow>
                    </Grid>
                </Grid>
            </Container>

            {/* ── Dialogs ────────────────────────────────────────────────────── */}

            <Dialog open={newBudgetDialogOpen} onClose={() => setNewBudgetDialogOpen(false)}
                    maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2, maxHeight: '90vh' } }}>
                <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>Create Budget for {new Date().getFullYear()}</Typography>
                        <IconButton onClick={() => setNewBudgetDialogOpen(false)}><Delete /></IconButton>
                    </Box>
                    <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                        No budget found for {new Date().getFullYear()}. Let's create one!
                    </Alert>
                    <BudgetQuestionnaireForm
                        onSubmit={async (_data: BudgetQuestions) => {
                            setNewBudgetDialogOpen(false);
                            setSnackbarMessage('Budget created successfully! Refreshing…');
                            setSnackbarSeverity('success');
                            setSnackbarOpen(true);
                            await fetchBudgetData(currentMonth);
                        }}
                        skipHistoricalData
                    />
                </Box>
            </Dialog>

            <ManageBudgetsDialog
                open={manageBudgetsDialogOpen}
                onClose={() => setManageBudgetsDialogOpen(false)}
                onBudgetUpdated={async () => {
                    setManageBudgetsDialogOpen(false);
                    setSnackbarMessage('Budget updated successfully!');
                    setSnackbarSeverity('success');
                    setSnackbarOpen(true);
                    await fetchBudgetData(currentMonth);
                }}
            />

            <CSVImportDialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}
                             onImport={async (data) => {
                                 try {
                                     setIsLoading(true);
                                     const result = await uploadService.uploadCsv({ userId, ...data });
                                     if (!result.success) setError(result.message || 'Import failed');
                                 } catch (ex) {
                                     const msg = ex instanceof Error ? ex.message : 'Failed to import CSV file';
                                     setSnackbarMessage(msg); setSnackbarSeverity('error'); setSnackbarOpen(true);
                                 } finally {
                                     setIsLoading(false);
                                     setImportDialogOpen(false);
                                 }
                             }}
            />

            <Dialog open={budgetUpdateConfirmOpen} onClose={() => setBudgetUpdateConfirmOpen(false)}
                    maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2, p: 1 } }}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Update Budget Amount</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Change the budget for <strong>{pendingBudgetUpdate?.categoryName}</strong> to{' '}
                        <strong>${pendingBudgetUpdate?.newAmount.toFixed(2)}</strong> for {format(currentMonth, 'MMMM yyyy')}?
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button variant="outlined" onClick={() => { setBudgetUpdateConfirmOpen(false); setPendingBudgetUpdate(null); }}
                                sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600 }}>
                            Cancel
                        </Button>
                        <Button variant="contained"
                                sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK } }}
                                onClick={async () => {
                                    if (!pendingBudgetUpdate) return;
                                    try {
                                        await budgetCategoryService.updateBudgetCategoryAmount(userId, pendingBudgetUpdate.categoryName, pendingBudgetUpdate.newAmount, startDate, endDate);
                                        await fetchBudgetData(currentMonth);
                                        setSnackbarMessage(`Budget for ${pendingBudgetUpdate.categoryName} updated to $${pendingBudgetUpdate.newAmount.toFixed(2)}`);
                                        setSnackbarSeverity('success');
                                    } catch {
                                        setSnackbarMessage('Failed to update budget amount.');
                                        setSnackbarSeverity('error');
                                    } finally {
                                        setSnackbarOpen(true);
                                        setBudgetUpdateConfirmOpen(false);
                                        setPendingBudgetUpdate(null);
                                    }
                                }}>
                            Confirm Update
                        </Button>
                    </Box>
                </Box>
            </Dialog>

            <ManageBudgetCategoriesDialog
                open={manageCategoriesDialogOpen}
                onClose={() => setManageCategoriesDialogOpen(false)}
                defaultCategories={budgetCategories.map((c, i) => ({
                    id: i, name: c.categoryName, budgetedAmount: c.budgetedAmount,
                    savingsGoal: 0, isDefault: true, isActive: true, isCustom: false,
                }))}
                customCategories={[]}
                onSaveCategories={async (cats, useCustomOnly) => {
                    try {
                        await fetchBudgetData(currentMonth);
                        const dc = cats.filter(c => c.isDefault && c.isActive).length;
                        const cc = cats.filter(c => c.isCustom).length;
                        setSnackbarMessage(useCustomOnly ? `Using ${cc} custom categories only` : `Using ${dc} default + ${cc} custom categories`);
                        setSnackbarSeverity('success');
                    } catch {
                        setSnackbarMessage('Failed to save category configuration');
                        setSnackbarSeverity('error');
                        throw new Error('Save failed');
                    } finally { setSnackbarOpen(true); }
                }}
            />

            {/* CSV loading backdrop */}
            <Box sx={{
                display: isLoading && !isBudgetCategoryLoading ? 'flex' : 'none',
                position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.65)',
                zIndex: 1400, alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
            }}>
                <CircularProgress color="inherit" size={52} sx={{ color: '#fff', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>Importing CSV data…</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>Processing your transactions</Typography>
            </Box>

            <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={() => setSuccessMessage(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%', borderRadius: 2 }}>{successMessage}</Alert>
            </Snackbar>
            <Snackbar open={snackBarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%', borderRadius: 2 }}>{snackbarMessage}</Alert>
            </Snackbar>
        </Box>
    );
};

export default BudgetPage;
// import {addMonths, endOfMonth, format, startOfMonth, subMonths} from 'date-fns';
// import {
//     Box,
//     Button,
//     Grid,
//     Typography,
//     Card,
//     IconButton,
//     useTheme,
//     alpha,
//     Container,
//     Paper,
//     Grow,
//     Chip,
//     Skeleton,
//     Stack,
//     LinearProgress, Snackbar, Alert, Dialog, CircularProgress, Backdrop
// } from '@mui/material';
// import {
//     ChevronLeft,
//     ChevronRight,
//     Calendar,
//     Share2,
//     PieChart,
//     Award,
//     ImportIcon, Delete, Clock
// } from 'lucide-react';
// import React, { useEffect, useMemo, useState } from "react";
// import Sidebar from './Sidebar';
// import BudgetPeriodTable from './BudgetPeriodTable';
// import DynamicBudgetPanel, {CSVTransactionsByDateCategory} from "./DynamicBudgetPanel";
// import BudgetRunnerService, { BudgetRunnerResult } from "../services/BudgetRunnerService";
// import CsvUploadService  from "../services/CsvUploadService";
// import {
//     BudgetCategoryStats,
//     BudgetStats
// } from "../utils/Items";
// import DateRange from "../domain/DateRange";
// import CSVImportDialog from "./CSVImportDialog";
// import BudgetService from "../services/BudgetService";
// import {BudgetQuestions} from "../utils/BudgetUtils";
// import BudgetQuestionnaireForm from "./BudgetQuestionnaireForm";
// import ManageBudgetsDialog from "./ManageBudgetsDialog";
// import ManageBudgetCategoriesDialog from "./ManageBudgetCategoriesDialog";
// import BudgetCategoriesService from "../services/BudgetCategoriesService";
// import UserService from "../services/UserService";
// import TransactionCategoryService from "../services/TransactionCategoryService";
// import BudgetOverview from "./BudgetOverview";
// import TopExpenseCategory from "./TopExpenseCategory";
// import BudgetSummaryCard from "./BudgetSummaryCard";
//
// interface DateArrays {
//     startDate: [number, number, number];
//     endDate: [number, number, number];
// }
//
// // Define gradients for modern UI elements
// const gradients = {
//     blue: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
//     green: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
//     purple: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
//     orange: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
//     indigo: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
//     teal: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)'
// };
//
//
// const BudgetPage: React.FC = () => {
//     const [currentMonth, setCurrentMonth] = useState(new Date());
//     const [budgetType, setBudgetType] = useState('50/30/20');
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const [animateIn, setAnimateIn] = useState(false);
//     const [importDialogOpen, setImportDialogOpen] = useState(false);
//     const [uploadAccess, setUploadAccess] = useState<boolean>(false);
//     const budgetRunnerService = BudgetRunnerService.getInstance();
//     const budgetCategoryService = BudgetCategoriesService.getInstance();
//     const transactionCategoryService = TransactionCategoryService.getInstance();
//     const [budgetData, setBudgetData] = useState<BudgetRunnerResult[]>([]);
//     const userId = Number(sessionStorage.getItem('userId'));
//     const [successMessage, setSuccessMessage] = useState<string | null>(null);
//     const [snackBarOpen, setSnackbarOpen] = useState(false);
//     const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
//     const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>()
//     const [newBudgetDialogOpen, setNewBudgetDialogOpen] = useState<boolean>(false);
//     const [manageBudgetsDialogOpen, setManageBudgetsDialogOpen] = useState<boolean>(false);
//     const [manageCategoriesDialogOpen, setManageCategoriesDialogOpen] = useState<boolean>(false);
//     const [isBudgetCategoryLoading, setIsBudgetCategoryLoading] = useState<boolean>(false);
//     const [budgetCategoryLoadingMessage, setBudgetCategoryLoadingMessage] = useState<string>('');
//     const [categoryTransactionsByDate, setCategoryTransactionsByDate] = useState<CSVTransactionsByDateCategory[]>([]);
//     const userService = UserService.getInstance();
//     const startDate = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
//     const endDate = useMemo(() => endOfMonth(currentMonth), [currentMonth]);
//     const [budgetUpdateConfirmOpen, setBudgetUpdateConfirmOpen] = useState(false);
//     const [pendingBudgetUpdate, setPendingBudgetUpdate] = useState<{ categoryName: string; newAmount: number } | null>(null);
//
//     const formatDate = (date: Date): string => {
//         return format(date, 'yyyy-MM-dd');
//     };
//
//     const uploadService = new CsvUploadService();
//     const budgetService = BudgetService.getInstance();
//
//     const theme = useTheme();
//
//     const handlePreviousMonth = () => {
//         setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
//     };
//
//     const handleNextMonth = () => {
//         setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
//     };
//
//     const handleImportClick = () => {
//         setImportDialogOpen(true);
//     }
//
//     const handleImportClose = () => {
//         setImportDialogOpen(false);
//     }
//
//     // useEffect(() => {
//     //     const userId = Number(sessionStorage.getItem('userId'));
//     //     const budgetStartDate = startOfMonth(currentMonth);
//     //     const budgetEndDate = endOfMonth(currentMonth);
//     //
//     //     const checkAndSync = async () => {
//     //         try {
//     //             const [hasNew, hasUpdated] = await Promise.all([
//     //                 transactionCategoryService.checkNewTransactionCategoriesByDateRange(userId, budgetStartDate, budgetEndDate),
//     //                 transactionCategoryService.checkUpdatedTransactionCategoriesByDateRange(userId, budgetStartDate, budgetEndDate)
//     //             ]);
//     //
//     //             if (hasNew || hasUpdated) {
//     //                 setIsBudgetCategoryLoading(true);
//     //                 if (hasNew) {
//     //                     await budgetCategoryService.createBudgetCategoriesForDateRange(userId, budgetStartDate, budgetEndDate);
//     //                 }
//     //                 if (hasUpdated) {
//     //                     await budgetCategoryService.updateBudgetCategoriesByMonth(userId, budgetStartDate, budgetEndDate);
//     //                 }
//     //             }
//     //
//     //             await fetchBudgetData(currentMonth);
//     //         } catch (error) {
//     //             console.error('Error syncing budget categories:', error);
//     //             setSnackbarMessage('Failed to sync budget categories');
//     //             setSnackbarSeverity('error');
//     //             setSnackbarOpen(true);
//     //         } finally {
//     //             setIsBudgetCategoryLoading(false);
//     //         }
//     //     };
//     //
//     //     checkAndSync();
//     // }, [currentMonth]);
//
//
//     useEffect(() => {
//         let userId = Number(sessionStorage.getItem('userId'));
//         let now = new Date();
//         const budgetStartDate = startOfMonth(currentMonth);
//         const budgetEndDate = endOfMonth(currentMonth);
//         console.log('Budget End Date {}', budgetEndDate);
//         const fetchNewBudgetCategories = async () => {
//             try {
//                 console.log('Creating new Budget Categories');
//                 const budgetCategories = await budgetCategoryService.createBudgetCategoriesForDateRange(
//                     userId,
//                     budgetStartDate,
//                     budgetEndDate
//                 );
//                 console.log('Successfully created new budget categories: ', budgetCategories);
//             } catch(error) {
//                 console.error(`There was an error fetching new budget categories for userId ${userId}:`, error);
//             }
//         };
//
//         const checkAndFetchBudgetCategories = async () => {
//             try {
//                 const anyNewTransactionCategories = await transactionCategoryService.checkNewTransactionCategoriesByDateRange(
//                     userId,
//                     budgetStartDate,
//                     budgetEndDate
//                 );
//
//                 if (anyNewTransactionCategories) {
//                     setIsBudgetCategoryLoading(true);
//                     await fetchNewBudgetCategories();
//
//                     fetchBudgetData(currentMonth, true);
//                     await new Promise(resolve => setTimeout(resolve, 2000));
//                     setIsBudgetCategoryLoading(false);
//                 }
//             } catch(error) {
//                 console.error('Error checking for new transaction categories:', error);
//                 setSnackbarMessage('Failed to create budget categories');
//                 setSnackbarSeverity('error');
//                 setSnackbarOpen(true);
//                 setIsBudgetCategoryLoading(false);
//             }
//         };
//
//         checkAndFetchBudgetCategories();
//     }, [userId, currentMonth]);
//
//     useEffect(() => {
//         let userId = Number(sessionStorage.getItem('userId'));
//         const budgetStartDate = startOfMonth(currentMonth);
//         const budgetEndDate = endOfMonth(currentMonth);
//         const fetchUpdatedBudgetCategories = async () => {
//             try {
//                 const anyUpdatedTransactionCategories = await transactionCategoryService.checkUpdatedTransactionCategoriesByDateRange(
//                     userId,
//                     budgetStartDate,
//                     budgetEndDate
//                 );
//
//                 if (anyUpdatedTransactionCategories) {
//                     setIsBudgetCategoryLoading(true);
//                     console.log('Updating budget categories...');
//                     await budgetCategoryService.updateBudgetCategoriesByMonth(
//                         userId,
//                         budgetStartDate,
//                         budgetEndDate
//                     );
//
//                     await fetchBudgetData(currentMonth);
//                     await new Promise(resolve => setTimeout(resolve, 2000));
//                     setIsBudgetCategoryLoading(false);
//
//                     console.log('Successfully updated budget categories');
//                 } else {
//                     // No updated transactions — check if budget categories exist at all
//                     // If not, backend will fall back to processed transactions to build them
//                     const budgetData = await fetchBudgetData(currentMonth);
//                     const hasNoBudgetCategories = !budgetData || budgetData.length === 0;
//                     if (hasNoBudgetCategories) {
//                         console.log('No budget categories found, attempting to build from processed transactions...');
//                         setIsBudgetCategoryLoading(true);
//                         await budgetCategoryService.updateBudgetCategoriesByMonth(
//                             userId,
//                             budgetStartDate,
//                             budgetEndDate
//                         );
//                         await fetchBudgetData(currentMonth);
//                         await new Promise(resolve => setTimeout(resolve, 2000));
//                         setIsBudgetCategoryLoading(false);
//                     }
//                 }
//             } catch(error) {
//                 console.error(`There was an error fetching updated budget categories for userId ${userId}:`, error);
//                 setSnackbarMessage('Failed to update budget categories');
//                 setSnackbarSeverity('error');
//                 setSnackbarOpen(true);
//                 setIsBudgetCategoryLoading(false);
//             }
//         };
//
//         fetchUpdatedBudgetCategories();
//     }, [currentMonth]);
//
//     useEffect(() => {
//         const fetchUserHasUploadAccess = async() => {
//             try {
//                 const userId = Number(sessionStorage.getItem('userId'));
//                 const hasUploadAccess = await userService.fetchUserOverrideEnabled(userId);
//                 setUploadAccess(hasUploadAccess);
//             } catch (error) {
//                 console.error("There was an error fetching user upload access: ", error);
//             }
//         };
//         fetchUserHasUploadAccess();
//     });
//
//     useEffect(() => {
//         if (!userId) return;
//
//         const fetchCategoryTransactionsByDate = async () => {
//             try {
//                 const data = await transactionCategoryService.fetchCSVTransactionsByCategoryWithDate(
//                     userId,
//                     formatDate(startDate),
//                     formatDate(endDate)
//                 );
//                 setCategoryTransactionsByDate(data);
//             } catch (error) {
//                 console.error('Error fetching category transactions by date:', error);
//             }
//         };
//
//         fetchCategoryTransactionsByDate();
//     }, [userId, startDate, endDate]);
//
//     const doesBudgetExistForBeginningYear = async (retryCount = 0) =>
//     {
//         try
//         {
//             const currentDate = new Date();
//             const currentYear = currentDate.getFullYear();
//             console.log('Current Year: ', currentYear);
//             console.log('UserID: ', userId);
//
//             console.log('Year Type: ', typeof(currentYear));
//             console.log('UserID type: ', typeof(userId));
//
//             if (retryCount > 0) {
//                 await new Promise(resolve => setTimeout(resolve, 500));
//             }
//
//             const exists = await budgetService.checkIfBudgetExistsForYear(userId, currentYear);
//             if (!exists && retryCount === 0) {
//                 console.log('Budget not found, retrying...');
//                 return await doesBudgetExistForBeginningYear(1);
//             }
//
//             console.log('Checking if budget exists for beginning year:', exists);
//             if(!exists){
//                 setNewBudgetDialogOpen(true);
//             }
//             return exists;
//         }catch(error){
//             console.error('Error checking if budget exists for beginning year:', error);
//             setSnackbarMessage('Failed to check if budget exists for beginning year');
//             setSnackbarSeverity('error');
//             setSnackbarOpen(true);
//             return false;
//         }
//     }
//
//     useEffect(() => {
//         doesBudgetExistForBeginningYear();
//     }, [userId]);
//
//     const handleNewBudgetDialogClose = () => {
//         setNewBudgetDialogOpen(false);
//     }
//
//     const handleNewBudgetSubmit = async (budgetData: BudgetQuestions) => {
//         setNewBudgetDialogOpen(false);
//         setSnackbarMessage('Budget created Successfully! Refreshing');
//         setSnackbarSeverity('success');
//         setSnackbarOpen(true);
//
//         await fetchBudgetData(currentMonth);
//     }
//
//     const handleImportComplete = async (data: {file: File; startDate: string, endDate: string, institution: string}) => {
//         try
//         {
//             console.log('Starting CSV import...');
//
//             setIsLoading(true);
//             setError(null);
//
//             const result = await uploadService.uploadCsv({
//                 userId: userId,
//                 file: data.file,
//                 startDate: data.startDate,
//                 endDate: data.endDate,
//                 institution: data.institution
//             });
//             console.log('CSV Result: ', result);
//
//             if (result.success) {
//                 console.log('CSV import successful:', result.message);
//                 setImportDialogOpen(false);
//             } else {
//                 setError(result.message || 'Import failed');
//             }
//         }catch(error){
//             console.error('Error importing CSV:', error);
//             const errorMessage = error instanceof Error ? error.message : 'Failed to import CSV file';
//
//             setSnackbarMessage(errorMessage);
//             setSnackbarSeverity('error');
//             setSnackbarOpen(true);
//
//             setError(errorMessage);
//         }finally{
//             setIsLoading(false);
//         }
//
//         console.log('Import completed');
//         setImportDialogOpen(false);
//     }
//
//     useEffect(() => {
//         document.title = 'Budgets';
//         setTimeout(() => setAnimateIn(true), 100);
//
//         return () => {
//             document.title = "BudgetBuddy";
//         };
//     }, []);
//
//
//     const fetchBudgetData = async (date: Date, useBudgetCategoryLoading: boolean = false): Promise<BudgetRunnerResult[]> => {
//         try {
//             if(useBudgetCategoryLoading){
//                 setIsBudgetCategoryLoading(true);
//             }else{
//                 setIsLoading(true);
//             }
//             setError(null);
//
//             const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
//             const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
//
//             const results = await budgetRunnerService.getBudgetsByDateRange(
//                 userId,
//                 startDate,
//                 endDate
//             );
//             console.log('Budget results: ', results);
//             const budgetCategoryStats = results[0]?.budgetCategoryStats;
//             if(areAllBudgetCategoriesEmpty(budgetCategoryStats))
//             {
//                 console.log('All budget categories are empty, fetching from budget category service');
//                 try
//                 {
//                     const budgetCategories = await budgetCategoryService.createBudgetCategoriesForDateRange(userId, startDate, endDate);
//                     console.log('Created budget categories: ', budgetCategories);
//
//                     const newBudgetResults = await budgetRunnerService.getBudgetsByDateRange(userId, startDate, endDate);
//                     console.log('New budget results: ', newBudgetResults);
//                     setBudgetData(newBudgetResults);
//                     return newBudgetResults;
//                 }catch(error){
//                     console.error('Error creating budget categories: ', error);
//                     if (error instanceof Error) {
//                         if (error.message.includes('No budget found')) {
//                             setError('No budget exists for this period. Please create a budget first.');
//                         } else {
//                             setError('Failed to create budget categories. Please try again.');
//                         }
//                     } else {
//                         setError('An unexpected error occurred.');
//                     }
//                     setBudgetData([]);
//                     return [];
//                 }
//             }
//             else{
//                 setBudgetData(results);
//                 return results;
//             }
//         } catch (err) {
//             setError('Failed to fetch budget data. Please try again later.');
//             console.error('Error fetching budget data:', err);
//             return [];
//         } finally {
//             if (useBudgetCategoryLoading) {
//                 setIsBudgetCategoryLoading(false);
//                 setBudgetCategoryLoadingMessage('');
//             } else {
//                 setIsLoading(false);
//             }
//         }
//     };
//
//     const isEmpty = <T,>(array: T[] | null | undefined): boolean => {
//         return !array || array.length === 0;
//     };
//
//     const areAllBudgetCategoriesEmpty = (stats: BudgetCategoryStats | undefined) : boolean =>
//     {
//         if(!stats){
//             return true;
//         }
//         return (
//             (stats.expenseCategories === null) &&
//             (stats.incomeCategories === null) &&
//             isEmpty(stats.topExpenseCategories) &&
//             (stats.savingsCategories === null) &&
//             isEmpty(stats.budgetPeriodCategories)
//         );
//     };
//
//     const defaultBudgetStats: BudgetStats = {
//         averageSpendingPerDay: 0,
//         budgetId: 0,
//         dateRange: new DateRange(new Date(), new Date()),
//         healthScore: 0,
//         monthlyProjection: null,
//         remaining: 0,
//         totalBudget: 0,
//         totalSaved: 0,
//         totalSpent: 0
//     };
//
//     const handleManageBudgetsDialogOnClose = () => {
//         setManageBudgetsDialogOpen(false);
//     }
//
//     const handleManageBudgetsDialogOpen = () => {
//         setManageBudgetsDialogOpen(true);
//     };
//
//     const budgetStats = useMemo(() => {
//         if (!budgetData?.length) {
//             return defaultBudgetStats;
//         }
//         const item = budgetData[0];
//         const stats = item?.budgetStats[0];
//         const categoryStats = item?.budgetCategoryStats;
//         if(!stats || !categoryStats){
//             return defaultBudgetStats;
//         }
//
//         const expenseCategories = categoryStats.expenseCategories;
//         const incomeCategories = categoryStats.incomeCategories;
//         const savingsCategories = categoryStats.savingsCategories;
//
//         const totalSpent = expenseCategories?.actualExpenses ?? 0;
//         const totalSaved = savingsCategories?.actualSavedAmount ?? 0;
//         const totalBudget = item.budget?.budgetAmount ?? 0;
//         const totalIncome = incomeCategories?.actualBudgetedIncome ?? 0;
//         const remaining = stats.totalBudget - totalSpent;
//
//         const startDate = (stats.dateRange.startDate as unknown) as number[];
//         const endDate = (stats.dateRange.endDate as unknown) as number[];
//
//         return {
//             averageSpendingPerDay: stats.averageSpendingPerDay ?? 0,
//             budgetId: stats.budgetId,
//             dateRange: new DateRange(
//                 new Date(startDate[0], startDate[1] - 1, startDate[2]),
//                 new Date(endDate[0], endDate[1] - 1, endDate[2])
//             ),
//             healthScore: stats.healthScore ?? 0,
//             monthlyProjection: stats.monthlyProjection,
//             remaining: remaining,
//             totalBudget: stats.totalBudget,
//             totalSaved: totalSaved,
//             totalSpent: totalSpent
//         };
//     }, [budgetData]);
//
//     const metrics = useMemo(() => {
//         const today = new Date();
//         const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
//         const currentDate = today.getDate();
//
//         let daysElapsed = currentDate;
//         let daysRemaining = daysInMonth - currentDate;
//
//         if (currentMonth.getMonth() < today.getMonth() || currentMonth.getFullYear() < today.getFullYear()) {
//             daysElapsed = daysInMonth;
//             daysRemaining = 0;
//         }
//         else if (currentMonth.getMonth() > today.getMonth() || currentMonth.getFullYear() > today.getFullYear()) {
//             daysElapsed = 0;
//             daysRemaining = daysInMonth;
//         }
//
//         const percentElapsed = (daysElapsed / daysInMonth) * 100;
//         const idealSpendRate = budgetStats.totalBudget / daysInMonth;
//         const actualSpendRate = budgetStats.totalSpent / (daysElapsed || 1);
//         const dailyBudget = budgetStats.remaining / (daysRemaining || 1);
//
//         const idealSpentSoFar = budgetStats.totalBudget * (percentElapsed / 100);
//         const spendingDifference = idealSpentSoFar - budgetStats.totalSpent;
//         const isUnderBudget = spendingDifference > 0;
//
//         return {
//             daysElapsed,
//             daysRemaining,
//             percentElapsed,
//             idealSpendRate,
//             actualSpendRate,
//             dailyBudget,
//             isUnderBudget,
//             spendingDifference: Math.abs(spendingDifference)
//         };
//     }, [currentMonth, budgetStats]);
//
//     const formatCurrency = (amount: number) : string => {
//         const absAmount = Math.abs(amount);
//         const formatted = absAmount.toFixed(2);
//         return amount < 0 ? `$0` : `$${formatted}`;
//     }
//
//     const handleBudgetUpdated = async () => {
//         setManageBudgetsDialogOpen(false);
//         setSnackbarMessage('Budget updated successfully! Refreshing data...');
//         setSnackbarSeverity('success');
//         setSnackbarOpen(true);
//
//         await fetchBudgetData(currentMonth);
//     };
//
//     const topExpenseCategories = useMemo(() => {
//         if (!budgetData?.length) return [];
//
//         return budgetData.reduce<any[]>((acc, budget) => {
//             const stats = budget.budgetCategoryStats;
//             if (!stats || !stats.topExpenseCategories) {
//                 return acc;
//             }
//
//             const mappedExpenses = stats.topExpenseCategories.map(expense => ({
//                 categoryName: expense.category,
//                 budgetedAmount: expense.budgetedExpenses,
//                 actualAmount: expense.actualExpenses,
//                 remainingAmount: expense.remainingExpenses,
//                 startDate: expense.startDate,
//                 endDate: expense.endDate,
//                 isActive: expense.active,
//                 isRecurring: false,
//                 isCustom: false
//             }));
//
//             return [...acc, ...mappedExpenses];
//         }, []);
//     }, [budgetData]);
//
//     const overviewCategories = useMemo(() => {
//         if (!budgetData?.length) return [];
//
//         const result = budgetData[0];
//         const categoryStats = result?.budgetCategoryStats;
//
//         const categories = [];
//
//         if (categoryStats?.expenseCategories) {
//             categories.push({
//                 category: 'Expenses',
//                 budgetedExpenses: categoryStats.expenseCategories.budgetedExpenses,
//                 actualExpenses: categoryStats.expenseCategories.actualExpenses,
//                 remainingExpenses: categoryStats.expenseCategories.remainingExpenses
//             });
//         }
//
//         if (categoryStats?.incomeCategories) {
//             categories.push({
//                 category: 'Income',
//                 budgetedExpenses: categoryStats.incomeCategories.budgetedIncome,
//                 actualExpenses: categoryStats.incomeCategories.actualBudgetedIncome,
//                 remainingExpenses: categoryStats.incomeCategories.remainingIncome
//             });
//         }
//
//         if (categoryStats?.savingsCategories) {
//             categories.push({
//                 category: 'Savings',
//                 budgetedExpenses: categoryStats.savingsCategories.budgetedSavingsTarget,
//                 actualExpenses: categoryStats.savingsCategories.actualSavedAmount,
//                 remainingExpenses: categoryStats.savingsCategories.remainingToSave
//             });
//         }
//
//         return categories;
//     }, [budgetData]);
//
//     const budgetCategories = useMemo(() => {
//         if (!budgetData?.length) return [];
//
//         const result = budgetData[0];
//         const periodCategories = result?.budgetCategoryStats?.budgetPeriodCategories || [];
//
//         console.log('BudgetCategories: ', periodCategories);
//         return periodCategories.map(category => ({
//             categoryName: category.category,
//             budgetedAmount: category.budgeted, // Fixed: was budgetedExpenses
//             actualAmount: category.actual, // Fixed: was actualExpenses
//             remainingAmount: category.remaining, // Fixed: was remainingExpenses
//             isRecurring: category.isRecurring || false,
//             isCustom: category.isCustom || false
//         }));
//
//     }, [budgetData]);
//
//     const recurringCategories = useMemo(() => {
//         return budgetCategories.filter(cat => cat.isRecurring);
//     }, [budgetCategories]);
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
//             {isBudgetCategoryLoading && (
//                 <Box
//                     sx={{
//                         position: 'fixed',
//                         top: 0,
//                         left: 0,
//                         right: 0,
//                         bottom: 0,
//                         bgcolor: 'rgba(255, 255, 255, 0.9)',
//                         backdropFilter: 'blur(8px)',
//                         display: 'flex',
//                         flexDirection: 'column',
//                         alignItems: 'center',
//                         justifyContent: 'center',
//                         zIndex: 9999,
//                     }}
//                 >
//                     <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
//                     <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
//                         {budgetCategoryLoadingMessage}
//                     </Typography>
//                     <Typography variant="body2" color="text.secondary">
//                         Building Budget Categories, Please Wait....
//                     </Typography>
//                 </Box>
//             )}
//             <Container maxWidth="xl" sx={{ py: 4 }}>
//                 {/* Header with title and month navigation */}
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
//                                 {format(currentMonth, 'MMMM yyyy')} Budget
//                             </Typography>
//                             <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
//                                 Track your progress and stay within your spending limits
//                             </Typography>
//                         </Box>
//
//                         <Box sx={{
//                             display: 'flex',
//                             alignItems: 'center',
//                             gap: 1
//                         }}>
//                             <IconButton
//                                 onClick={handlePreviousMonth}
//                                 disabled={isLoading}
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
//                                 disabled={isLoading}
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
//                             <Button
//                                 variant="outlined"
//                                 startIcon={<ImportIcon size={18} />}
//                                 onClick={handleImportClick}
//                                 disabled={!uploadAccess}
//                                 sx={{
//                                     ml: 1,
//                                     borderRadius: 2,
//                                     textTransform: 'none',
//                                     fontWeight: 600,
//                                     borderColor: alpha(theme.palette.divider, 0.8),
//                                     color: theme.palette.text.primary,
//                                     '&:hover': {
//                                         borderColor: theme.palette.primary.main,
//                                         backgroundColor: alpha(theme.palette.primary.main, 0.05)
//                                     }
//                                 }}>
//                                 Import
//                             </Button>
//                             <CSVImportDialog
//                                 open={importDialogOpen}
//                                 onClose={handleImportClose}
//                                 onImport={handleImportComplete}
//                             />
//                             <Button
//                                 variant="outlined"
//                                 startIcon={<Clock size={18}/>}
//                                 onClick={handleManageBudgetsDialogOpen}
//                                 sx={{
//                                     ml: 1,
//                                     borderRadius: 2,
//                                     textTransform: 'none',
//                                     fontWeight: 600,
//                                     borderColor: alpha(theme.palette.divider, 0.8),
//                                     color: theme.palette.text.primary,
//                                     '&:hover': {
//                                         borderColor: theme.palette.primary.main,
//                                         backgroundColor: alpha(theme.palette.primary.main, 0.05)
//                                     }
//                                 }}>
//                                 Manage
//                             </Button>
//                             <ManageBudgetsDialog
//                                 open={manageBudgetsDialogOpen}
//                                 onClose={handleManageBudgetsDialogOnClose}
//                                 onBudgetUpdated={handleBudgetUpdated}/>
//                             <Button
//                                 variant="outlined"
//                                 startIcon={<PieChart size={18}/>}
//                                 onClick={() => setManageCategoriesDialogOpen(true)}
//                                 sx={{
//                                     ml: 1,
//                                     borderRadius: 2,
//                                     textTransform: 'none',
//                                     fontWeight: 600,
//                                     borderColor: alpha(theme.palette.divider, 0.8),
//                                     color: theme.palette.text.primary,
//                                     '&:hover': {
//                                         borderColor: theme.palette.primary.main,
//                                         backgroundColor: alpha(theme.palette.primary.main, 0.05)
//                                     }
//                                 }}>
//                                 Categories
//                             </Button>
//                         </Box>
//                     </Box>
//                 </Grow>
//
//                 {/* Error Message */}
//                 {error && (
//                     <Grow in={true} timeout={800}>
//                         <Paper sx={{
//                             mb: 4,
//                             p: 3,
//                             bgcolor: alpha(theme.palette.error.main, 0.1),
//                             color: theme.palette.error.main,
//                             borderRadius: 3,
//                             border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
//                             display: 'flex',
//                             alignItems: 'center'
//                         }}>
//                             <Box
//                                 sx={{
//                                     width: 40,
//                                     height: 40,
//                                     borderRadius: '50%',
//                                     bgcolor: alpha(theme.palette.error.main, 0.2),
//                                     display: 'flex',
//                                     alignItems: 'center',
//                                     justifyContent: 'center',
//                                     mr: 2
//                                 }}
//                             >
//                                 <Award size={24} color={theme.palette.error.main} />
//                             </Box>
//                             <Box>
//                                 <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
//                                     Error Loading Budget Data
//                                 </Typography>
//                                 <Typography variant="body2">
//                                     {error}
//                                 </Typography>
//                             </Box>
//                         </Paper>
//                     </Grow>
//                 )}
//
//                 {/* Budget Summary Stats - 4 Cards */}
//                 <Grow in={animateIn} timeout={800}>
//                     <Grid container spacing={3} sx={{ mb: 4 }}>
//                         {/* Total Budget */}
//                         <Grid item xs={12} sm={6} md={3}>
//                             <BudgetSummaryCard
//                                 title="Total Budget"
//                                 amount={budgetStats.totalBudget}
//                                 budgeted={budgetStats.totalBudget}
//                                 currentMonth={currentMonth}
//                                 isLoading={isLoading}
//                             />
//                         </Grid>
//
//                         {/* Remaining Budget */}
//                         <Grid item xs={12} sm={6} md={3}>
//                             <BudgetSummaryCard
//                                 title="Total Spent"
//                                 amount={budgetStats.totalSpent}
//                                 budgeted={budgetStats.totalBudget}
//                                 currentMonth={currentMonth}
//                                 isLoading={isLoading}
//                                 show_alert={!metrics.isUnderBudget}
//                                 onAlertClick={() => {/* handle over-budget alert */ }}
//                             />
//                         </Grid>
//
//                         {/* Total Spent */}
//                         <Grid item xs={12} sm={6} md={3}>
//                             <BudgetSummaryCard
//                                 title="Remaining"
//                                 amount={budgetStats.remaining}
//                                 budgeted={budgetStats.totalBudget}
//                                 currentMonth={currentMonth}
//                                 isLoading={isLoading}
//                             />
//                         </Grid>
//
//                         {/* Total Saved */}
//                         <Grid item xs={12} sm={6} md={3}>
//                             <BudgetSummaryCard
//                                 title="Total Saved"
//                                 amount={budgetStats.totalSaved}
//                                 budgeted={budgetStats.totalBudget}
//                                 currentMonth={currentMonth}
//                                 isLoading={isLoading}
//                             />
//                         </Grid>
//                     </Grid>
//                 </Grow>
//                 {/*<Grow in={animateIn} timeout={800}>*/}
//                 {/*    <Grid container spacing={3} sx={{ mb: 4 }}>*/}
//                 {/*        /!* Total Budget *!/*/}
//                 {/*        <Grid item xs={12} sm={6} md={3}>*/}
//                 {/*            <Card sx={{*/}
//                 {/*                p: 3,*/}
//                 {/*                borderRadius: 4,*/}
//                 {/*                height: '100%',*/}
//                 {/*                background: gradients.blue,*/}
//                 {/*                color: 'white',*/}
//                 {/*                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',*/}
//                 {/*                position: 'relative',*/}
//                 {/*                overflow: 'hidden',*/}
//                 {/*                '&::after': {*/}
//                 {/*                    content: '""',*/}
//                 {/*                    position: 'absolute',*/}
//                 {/*                    top: 0,*/}
//                 {/*                    right: 0,*/}
//                 {/*                    width: '50%',*/}
//                 {/*                    height: '100%',*/}
//                 {/*                    backgroundImage: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1))',*/}
//                 {/*                    transform: 'skewX(-20deg) translateX(10%)',*/}
//                 {/*                }*/}
//                 {/*            }}>*/}
//                 {/*                <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>*/}
//                 {/*                    Total Budget*/}
//                 {/*                </Typography>*/}
//                 {/*                {isLoading ? (*/}
//                 {/*                    <Skeleton variant="text" width="80%" height={48} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />*/}
//                 {/*                ) : (*/}
//                 {/*                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>*/}
//                 {/*                        ${budgetStats.totalBudget.toLocaleString()}*/}
//                 {/*                    </Typography>*/}
//                 {/*                )}*/}
//                 {/*                <Typography variant="body2" sx={{ opacity: 0.8 }}>*/}
//                 {/*                    for {format(currentMonth, 'MMMM yyyy')}*/}
//                 {/*                </Typography>*/}
//                 {/*            </Card>*/}
//                 {/*        </Grid>*/}
//
//                 {/*        /!* Remaining Budget *!/*/}
//                 {/*        <Grid item xs={12} sm={6} md={3}>*/}
//                 {/*            <Card sx={{*/}
//                 {/*                p: 3,*/}
//                 {/*                borderRadius: 4,*/}
//                 {/*                height: '100%',*/}
//                 {/*                background: gradients.green,*/}
//                 {/*                color: 'white',*/}
//                 {/*                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',*/}
//                 {/*                position: 'relative',*/}
//                 {/*                overflow: 'hidden',*/}
//                 {/*                '&::after': {*/}
//                 {/*                    content: '""',*/}
//                 {/*                    position: 'absolute',*/}
//                 {/*                    top: 0,*/}
//                 {/*                    right: 0,*/}
//                 {/*                    width: '50%',*/}
//                 {/*                    height: '100%',*/}
//                 {/*                    backgroundImage: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1))',*/}
//                 {/*                    transform: 'skewX(-20deg) translateX(10%)',*/}
//                 {/*                }*/}
//                 {/*            }}>*/}
//                 {/*                <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>*/}
//                 {/*                    Remaining*/}
//                 {/*                </Typography>*/}
//                 {/*                {isLoading ? (*/}
//                 {/*                    <Skeleton variant="text" width="80%" height={48} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />*/}
//                 {/*                ) : (*/}
//                 {/*                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>*/}
//                 {/*                        {formatCurrency(budgetStats.remaining)}*/}
//                 {/*                    </Typography>*/}
//                 {/*                )}*/}
//                 {/*                <Box sx={{ display: 'flex', alignItems: 'center' }}>*/}
//                 {/*                    <Typography variant="body2" sx={{ opacity: 0.8 }}>*/}
//                 {/*                        {metrics.daysRemaining} days left*/}
//                 {/*                    </Typography>*/}
//                 {/*                    <Chip*/}
//                 {/*                        label={`$${Math.round(metrics.dailyBudget)}/day`}*/}
//                 {/*                        size="small"*/}
//                 {/*                        sx={{*/}
//                 {/*                            ml: 1,*/}
//                 {/*                            bgcolor: 'rgba(255, 255, 255, 0.2)',*/}
//                 {/*                            color: 'white',*/}
//                 {/*                            fontWeight: 600,*/}
//                 {/*                            height: 20,*/}
//                 {/*                            fontSize: '0.7rem'*/}
//                 {/*                        }}*/}
//                 {/*                    />*/}
//                 {/*                </Box>*/}
//                 {/*            </Card>*/}
//                 {/*        </Grid>*/}
//
//                 {/*        /!* Total Spent *!/*/}
//                 {/*        <Grid item xs={12} sm={6} md={3}>*/}
//                 {/*            <Card sx={{*/}
//                 {/*                p: 3,*/}
//                 {/*                borderRadius: 4,*/}
//                 {/*                height: '100%',*/}
//                 {/*                background: gradients.purple,*/}
//                 {/*                color: 'white',*/}
//                 {/*                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',*/}
//                 {/*                position: 'relative',*/}
//                 {/*                overflow: 'hidden',*/}
//                 {/*                '&::after': {*/}
//                 {/*                    content: '""',*/}
//                 {/*                    position: 'absolute',*/}
//                 {/*                    top: 0,*/}
//                 {/*                    right: 0,*/}
//                 {/*                    width: '50%',*/}
//                 {/*                    height: '100%',*/}
//                 {/*                    backgroundImage: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1))',*/}
//                 {/*                    transform: 'skewX(-20deg) translateX(10%)',*/}
//                 {/*                }*/}
//                 {/*            }}>*/}
//                 {/*                <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>*/}
//                 {/*                    Total Spent*/}
//                 {/*                </Typography>*/}
//                 {/*                {isLoading ? (*/}
//                 {/*                    <Skeleton variant="text" width="80%" height={48} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />*/}
//                 {/*                ) : (*/}
//                 {/*                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>*/}
//                 {/*                        ${budgetStats.totalSpent.toLocaleString()}*/}
//                 {/*                    </Typography>*/}
//                 {/*                )}*/}
//                 {/*                <Box sx={{ display: 'flex', alignItems: 'center' }}>*/}
//                 {/*                    <Typography variant="body2" sx={{ opacity: 0.8 }}>*/}
//                 {/*                        Avg. ${Math.round(metrics.actualSpendRate)}/day*/}
//                 {/*                    </Typography>*/}
//                 {/*                    {metrics.isUnderBudget ? (*/}
//                 {/*                        <Chip*/}
//                 {/*                            label="Under budget"*/}
//                 {/*                            size="small"*/}
//                 {/*                            sx={{*/}
//                 {/*                                ml: 1,*/}
//                 {/*                                bgcolor: 'rgba(255, 255, 255, 0.2)',*/}
//                 {/*                                color: 'white',*/}
//                 {/*                                fontWeight: 600,*/}
//                 {/*                                height: 20,*/}
//                 {/*                                fontSize: '0.7rem'*/}
//                 {/*                            }}*/}
//                 {/*                        />*/}
//                 {/*                    ) : (*/}
//                 {/*                        <Chip*/}
//                 {/*                            label="Over budget"*/}
//                 {/*                            size="small"*/}
//                 {/*                            sx={{*/}
//                 {/*                                ml: 1,*/}
//                 {/*                                bgcolor: 'rgba(255, 255, 255, 0.2)',*/}
//                 {/*                                color: 'white',*/}
//                 {/*                                fontWeight: 600,*/}
//                 {/*                                height: 20,*/}
//                 {/*                                fontSize: '0.7rem'*/}
//                 {/*                            }}*/}
//                 {/*                        />*/}
//                 {/*                    )}*/}
//                 {/*                </Box>*/}
//                 {/*            </Card>*/}
//                 {/*        </Grid>*/}
//
//                 {/*        /!* Total Saved *!/*/}
//                 {/*        <Grid item xs={12} sm={6} md={3}>*/}
//                 {/*            <Card sx={{*/}
//                 {/*                p: 3,*/}
//                 {/*                borderRadius: 4,*/}
//                 {/*                height: '100%',*/}
//                 {/*                background: gradients.teal,*/}
//                 {/*                color: 'white',*/}
//                 {/*                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',*/}
//                 {/*                position: 'relative',*/}
//                 {/*                overflow: 'hidden',*/}
//                 {/*                '&::after': {*/}
//                 {/*                    content: '""',*/}
//                 {/*                    position: 'absolute',*/}
//                 {/*                    top: 0,*/}
//                 {/*                    right: 0,*/}
//                 {/*                    width: '50%',*/}
//                 {/*                    height: '100%',*/}
//                 {/*                    backgroundImage: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1))',*/}
//                 {/*                    transform: 'skewX(-20deg) translateX(10%)',*/}
//                 {/*                }*/}
//                 {/*            }}>*/}
//                 {/*                <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>*/}
//                 {/*                    Total Saved*/}
//                 {/*                </Typography>*/}
//                 {/*                {isLoading ? (*/}
//                 {/*                    <Skeleton variant="text" width="80%" height={48} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />*/}
//                 {/*                ) : (*/}
//                 {/*                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>*/}
//                 {/*                        ${budgetStats.totalSaved.toLocaleString()}*/}
//                 {/*                    </Typography>*/}
//                 {/*                )}*/}
//                 {/*                <Typography variant="body2" sx={{ opacity: 0.8 }}>*/}
//                 {/*                    across all categories*/}
//                 {/*                </Typography>*/}
//                 {/*            </Card>*/}
//                 {/*        </Grid>*/}
//                 {/*    </Grid>*/}
//                 {/*</Grow>*/}
//
//
//                 {/* Main Content */}
//                 <Grid container spacing={4}>
//                     {/* Left Column - Budget Period Table Only */}
//                     <Grid item xs={12} lg={8}>
//                         <Stack spacing={4}>
//                             {/* Budget Overview with Toggle */}
//                             <Grow in={animateIn} timeout={900}>
//                                 <Card sx={{
//                                     p: 3,
//                                     borderRadius: 3,
//                                     boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
//                                 }}>
//                                     <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
//                                         Budget Overview
//                                     </Typography>
//                                     <BudgetOverview isLoading={isLoading} data={budgetData} />
//                                 </Card>
//                             </Grow>
//
//                             {/* Top Expense Categories */}
//                             <Grow in={animateIn} timeout={1000}>
//                                 <Card sx={{
//                                     p: 3,
//                                     borderRadius: 3,
//                                     boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
//                                 }}>
//                                     <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
//                                         Top Spending Categories
//                                     </Typography>
//                                     <TopExpenseCategory isLoading={isLoading} categories={topExpenseCategories} />
//                                 </Card>
//                             </Grow>
//
//                             {/* Budget Period Table */}
//                             <Grow in={animateIn} timeout={1100}>
//                                 <Card sx={{
//                                     p: 3,
//                                     borderRadius: 3,
//                                     boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
//                                 }}>
//                                     <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
//                                         Budget Breakdown
//                                     </Typography>
//                                     <BudgetPeriodTable isLoading={isLoading} data={budgetData} />
//                                 </Card>
//                             </Grow>
//                         </Stack>
//                     </Grid>
//
//                     {/* Right Column - Dynamic Panel with Goals Tab */}
//                     <Grid item xs={12} lg={4}>
//                         <Grow in={animateIn} timeout={1000}>
//                             <Box sx={{ position: 'sticky', top: 24 }}>
//                                 <DynamicBudgetPanel
//                                     isLoading={isLoading}
//                                     topSpendingCategories={topExpenseCategories}
//                                     overviewCategories={overviewCategories}
//                                     recurringCategories={recurringCategories}
//                                     budgetStats={budgetStats}
//                                     allCategories={budgetCategories}
//                                     categoryTransactionsByDate={categoryTransactionsByDate}
//                                     onUpdateBudgetAmount={async (categoryName: string, newAmount: number) => {
//                                         setPendingBudgetUpdate({ categoryName, newAmount });
//                                         setBudgetUpdateConfirmOpen(true);
//                                     }}
//                                     onOptimizeBudget={async (categoryName: string) => {
//                                         try {
//                                             console.log(`Optimizing budget for ${categoryName}`);
//
//                                             // TODO: Call your backend API to get optimized budget amount
//                                             // const optimized = await budgetCategoryService.optimizeBudget(
//                                             //     userId,
//                                             //     categoryName,
//                                             //     budgetStats.dateRange.startDate,
//                                             //     budgetStats.dateRange.endDate
//                                             // );
//                                             // return optimized.suggestedAmount;
//
//                                             // Mock optimization: return 10% more than current spending
//                                             const category = budgetCategories.find(c => c.categoryName === categoryName);
//                                             const optimizedAmount = category ? Math.max(category.actualAmount * 1.1, 100) : 100;
//
//                                             setSnackbarMessage(`Optimized budget suggestion for ${categoryName}: $${optimizedAmount.toFixed(2)}`);
//                                             setSnackbarSeverity('info');
//                                             setSnackbarOpen(true);
//
//                                             return optimizedAmount;
//                                         } catch (error) {
//                                             console.error('Error optimizing budget:', error);
//                                             throw error;
//                                         }
//                                     }}
//                                 />
//                             </Box>
//                         </Grow>
//                     </Grid>
//                 </Grid>
//             </Container>
//
//             <Dialog
//                 open={newBudgetDialogOpen}
//                 onClose={handleNewBudgetDialogClose}
//                 maxWidth="md"
//                 fullWidth
//                 PaperProps={{
//                     sx:{
//                         borderRadius: 2,
//                         maxHeight: '90vh'
//                     }
//                 }}>
//                 <Box sx={{p: 2}}>
//                     <Box sx={{
//                         display: 'flex',
//                         justifyContent: 'space-between',
//                         alignItems: 'center',
//                         mb: 2
//                     }}>
//                         <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
//                             Create Budget for {new Date().getFullYear()}
//                         </Typography>
//                         <IconButton onClick={handleNewBudgetDialogClose}>
//                             <Delete />
//                         </IconButton>
//                     </Box>
//                     <Alert severity="info" sx={{ mb: 2 }}>
//                         No budget found for {new Date().getFullYear()}. Let's create one!
//                     </Alert>
//                     <BudgetQuestionnaireForm
//                         onSubmit={handleNewBudgetSubmit}
//                         skipHistoricalData={true}
//                     />
//                 </Box>
//             </Dialog>
//
//             <Snackbar
//                 open={!!successMessage}
//                 autoHideDuration={6000}
//                 onClose={() => setSuccessMessage(null)}
//                 anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
//             >
//                 <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
//                     {successMessage}
//                 </Alert>
//             </Snackbar>
//
//             <Backdrop
//                 sx={{
//                     color: '#fff',
//                     zIndex: (theme) => theme.zIndex.drawer + 1,
//                     backgroundColor: 'rgba(0, 0, 0, 0.7)'
//                 }}
//                 open={isLoading && !isBudgetCategoryLoading}
//             >
//                 <Box sx={{ textAlign: 'center' }}>
//                     <CircularProgress color="inherit" size={60} />
//                     <Typography variant="h6" sx={{ mt: 2 }}>
//                         Importing CSV data...
//                     </Typography>
//                     <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
//                         Please wait while we process your transactions
//                     </Typography>
//                 </Box>
//             </Backdrop>
//
//             <Snackbar
//                 open={snackBarOpen}
//                 autoHideDuration={6000}
//                 onClose={() => setSnackbarOpen(false)}
//                 anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
//             >
//                 <Alert
//                     onClose={() => setSnackbarOpen(false)}
//                     severity={snackbarSeverity}
//                     sx={{ width: '100%' }}
//                 >
//                     {snackbarMessage}
//                 </Alert>
//             </Snackbar>
//             <Dialog
//                 open={budgetUpdateConfirmOpen}
//                 onClose={() => setBudgetUpdateConfirmOpen(false)}
//                 maxWidth="xs"
//                 fullWidth
//                 PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
//             >
//                 <Box sx={{ p: 3 }}>
//                     <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
//                         Update Budget Amount
//                     </Typography>
//                     <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//                         Are you sure you want to change the budget for{' '}
//                         <strong>{pendingBudgetUpdate?.categoryName}</strong> to{' '}
//                         <strong>${pendingBudgetUpdate?.newAmount.toFixed(2)}</strong>?
//                         This will update the budgeted amount for this category for{' '}
//                         {format(currentMonth, 'MMMM yyyy')}.
//                     </Typography>
//                     <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
//                         <Button
//                             variant="outlined"
//                             onClick={() => {
//                                 setBudgetUpdateConfirmOpen(false);
//                                 setPendingBudgetUpdate(null);
//                             }}
//                             sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
//                         >
//                             Cancel
//                         </Button>
//                         <Button
//                             variant="contained"
//                             onClick={async () => {
//                                 if (!pendingBudgetUpdate) return;
//                                 try
//                                 {
//                                     await budgetCategoryService.updateBudgetCategoryAmount(
//                                         userId,
//                                         pendingBudgetUpdate.categoryName,
//                                         pendingBudgetUpdate.newAmount,
//                                         startDate,
//                                         endDate
//                                     );
//
//                                     await fetchBudgetData(currentMonth);
//
//                                     setSnackbarMessage(`Budget for ${pendingBudgetUpdate.categoryName} updated to $${pendingBudgetUpdate.newAmount.toFixed(2)}`);
//                                     setSnackbarSeverity('success');
//                                     setSnackbarOpen(true);
//                                 }
//                                 catch(error)
//                                 {
//                                     console.error('Error updating budget amount:', error);
//                                     setSnackbarMessage('Failed to update budget amount. Please try again.');
//                                     setSnackbarSeverity('error');
//                                     setSnackbarOpen(true);
//                                 }
//                                 finally
//                                 {
//                                     setBudgetUpdateConfirmOpen(false);
//                                     setPendingBudgetUpdate(null);
//                                 }
//                             }}
//                             sx={{
//                                 borderRadius: 2,
//                                 textTransform: 'none',
//                                 fontWeight: 600,
//                                 bgcolor: '#800000',
//                                 '&:hover': { bgcolor: '#a00000' }
//                             }}
//                         >
//                             Confirm Update
//                         </Button>
//                     </Box>
//                 </Box>
//             </Dialog>
//
//             <ManageBudgetCategoriesDialog
//                 open={manageCategoriesDialogOpen}
//                 onClose={() => setManageCategoriesDialogOpen(false)}
//                 defaultCategories={budgetCategories.map((cat, index) => ({
//                     id: index,
//                     name: cat.categoryName,
//                     budgetedAmount: cat.budgetedAmount,
//                     savingsGoal: 0,
//                     isDefault: true,
//                     isActive: true,
//                     isCustom: false
//                 }))}
//                 customCategories={[]} // Will be populated when user creates custom categories
//                 onSaveCategories={async (categories, useCustomOnly) => {
//                     try {
//                         console.log('Saving categories:', categories);
//                         console.log('Use custom only:', useCustomOnly);
//
//                         // TODO: Call backend API to save category configuration
//                         // This should save:
//                         // 1. Which default categories are enabled/disabled
//                         // 2. All custom categories with their budgets and savings goals
//                         // 3. The useCustomOnly preference
//                         //
//                         // await budgetCategoryService.updateCategoryConfiguration(
//                         //     userId,
//                         //     {
//                         //         defaultCategoriesEnabled: categories.filter(c => c.isDefault && c.isActive).map(c => c.name),
//                         //         customCategories: categories.filter(c => c.isCustom),
//                         //         useCustomOnly: useCustomOnly
//                         //     },
//                         //     budgetStats.dateRange.startDate,
//                         //     budgetStats.dateRange.endDate
//                         // );
//
//                         // Refresh budget data to show updated categories
//                         await fetchBudgetData(currentMonth);
//
//                         const defaultCount = categories.filter(c => c.isDefault && c.isActive).length;
//                         const customCount = categories.filter(c => c.isCustom).length;
//
//                         setSnackbarMessage(
//                             useCustomOnly
//                                 ? `Now using ${customCount} custom categories only`
//                                 : `Now using ${defaultCount} default + ${customCount} custom categories`
//                         );
//                         setSnackbarSeverity('success');
//                         setSnackbarOpen(true);
//                     } catch (error) {
//                         console.error('Error saving categories:', error);
//                         setSnackbarMessage('Failed to save category configuration');
//                         setSnackbarSeverity('error');
//                         setSnackbarOpen(true);
//                         throw error;
//                     }
//                 }}
//             />
//         </Box>
//     );
// };
//
// export default BudgetPage;
