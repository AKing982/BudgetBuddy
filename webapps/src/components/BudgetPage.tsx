// ── BudgetPage.tsx ────────────────────────────────────────────────────────────
// Layout C (maroon). The data layer below is the original BudgetPage code, unchanged:
// same services, same effects, same fetchBudgetData, same budgetStats / category memos.
// Only the render section is new.
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { Alert, Box, ButtonBase, CircularProgress, Dialog, IconButton, Snackbar, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import Sidebar from './Sidebar';
import BudgetRunnerService, { BudgetRunnerResult } from '../services/BudgetRunnerService';
import CsvUploadService from '../services/CsvUploadService';
import {BudgetCategoryStats, BudgetStats, Transaction} from '../utils/Items';
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

import BudgetOverviewBar, { MonthOverview, OverviewMode, PayPeriodOverview } from './BudgetOverviewBar';
import WeekCard, { KpiView, WeekFace } from './WeekCard';
import RecurringSection, { RecurringView } from './RecurringSection';
import SegmentedToggle from './SegmentedToggle';
import type { BucketItem, BucketItemPatch, BudgetScheduleRange, RecurringCategory, RecurringPayment, SpendingBucket } from '../utils/BudgetPageTypes';
import { T, FONT_SANS } from '../budgetTheme';
import {
    CategoryTransactionsByDate, WeekRange, daysInMonth, isIncomeCategory, isWithin, proratedWeekBudgets, spendingByCategory,
    splitMonthIntoWeeks, toIsoDate, toLocalDate, weekContainsToday, weeksFromScheduleRanges,
} from '../utils/BudgetWeeks';

const DEFAULT_BUCKET_LIMIT = 250;   // starting limit offered when a week has no bucket yet

const headerBtnSx = {
    height: 40, px: 1.75, border: `1px solid ${T.inputBorder}`, borderRadius: '8px', bgcolor: T.surface,
    fontFamily: 'inherit', fontSize: 14, fontWeight: 500, color: '#2B2322',
    '&:hover': { borderColor: T.accent, color: T.accent },
    '&.Mui-disabled': { color: T.mutedSoft, borderColor: T.borderSoft },
} as const;

const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

const BudgetPage: React.FC = () => {
    // ═════════════════════════════════════════════════════════════════════════
    // ORIGINAL DATA LAYER (from the original BudgetPage)
    // ═════════════════════════════════════════════════════════════════════════
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
    const userService = UserService.getInstance();
    const startDate = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
    const endDate   = useMemo(() => endOfMonth(currentMonth),   [currentMonth]);

    const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
    const uploadService = new CsvUploadService();
    const budgetService = BudgetService.getInstance();

    const handlePreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
    const handleNextMonth     = () => setCurrentMonth(prev => addMonths(prev, 1));

    useEffect(() => {
        if (!userId) return;
        const s = startOfMonth(currentMonth);
        const e = endOfMonth(currentMonth);

        const run = async () => {
            try {
                const hasPlaidCSVSync = await userService.checkUserHasPlaidCSVSyncEnabled(userId);

                const [plaidHasNew, plaidHasUpdated] = await Promise.all([
                    transactionCategoryService.checkNewTransactionCategoriesByDateRange(userId, s, e),
                    transactionCategoryService.checkUpdatedTransactionCategoriesByDateRange(userId, s, e),
                ]);
                const [csvHasNew, csvHasUpdated] = hasPlaidCSVSync
                    ? await Promise.all([
                        transactionCategoryService.checkNewCSVTransactionCategoriesByDateRange(userId, s, e),
                        transactionCategoryService.checkUpdatedCSVTransactionCategoriesByDateRange(userId, s, e),
                    ])
                    : [false, false];

                if (plaidHasNew || csvHasNew) {
                    setIsBudgetCategoryLoading(true);
                    await budgetCategoryService.createBudgetCategoriesForDateRange(userId, s, e);
                }

                if (plaidHasUpdated || csvHasUpdated) {
                    setIsBudgetCategoryLoading(true);
                    await budgetCategoryService.updateBudgetCategoriesByMonth(userId, s, e);
                }

                const data = await fetchBudgetData(currentMonth);

                // Only fall back to update if nothing was built and no transactions triggered above
                if ((!data || data.length === 0) && !plaidHasNew && !csvHasNew && !plaidHasUpdated && !csvHasUpdated) {
                    setIsBudgetCategoryLoading(true);
                    await budgetCategoryService.updateBudgetCategoriesByMonth(userId, s, e);
                    await fetchBudgetData(currentMonth);
                }
            } catch (ex) {
                console.error(ex);
                setSnackbarMessage('Failed to sync budget categories');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
            } finally {
                setIsBudgetCategoryLoading(false);
            }
        };

        run();
    }, [userId, currentMonth]); // single effect, single dependency array

    useEffect(() => {
        const run = async () => {
            try {
                const uid = Number(sessionStorage.getItem('userId'));
                setUploadAccess(await userService.fetchUserOverrideEnabled(uid));
            } catch (ex) { console.error(ex); }
        };
        run();
    });


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
        return () => { document.title = 'BudgetBuddy'; };
    }, []);

    const fetchBudgetData = async (date: Date, useCategoryLoader = false): Promise<BudgetRunnerResult[]> => {
        try {
            if (useCategoryLoader) { setIsBudgetCategoryLoading(true); } else { setIsLoading(true); }
            setError(null);
            const s = new Date(date.getFullYear(), date.getMonth(), 1);
            const e = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            const results = await budgetRunnerService.getBudgetsByDateRange(userId, s, e);
            console.log('Fetched budget data:', results);
            if (areAllBudgetCategoriesEmpty(results[0]?.budgetCategoryStats)) {
                console.log('All budgetCategories are empty, creating new budget categories...');
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
            console.log('Budget categories are not empty, continuing...');
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

    const isEmpty = <X,>(arr: X[] | null | undefined) => !arr || arr.length === 0;

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

    const metrics = useMemo(() => {
        const today       = new Date();
        const daysInMonthCount = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        let daysElapsed   = today.getDate();
        let daysRemaining = daysInMonthCount - daysElapsed;
        if (currentMonth.getMonth() < today.getMonth() || currentMonth.getFullYear() < today.getFullYear()) { daysElapsed = daysInMonthCount; daysRemaining = 0; }
        else if (currentMonth.getMonth() > today.getMonth() || currentMonth.getFullYear() > today.getFullYear()) { daysElapsed = 0; daysRemaining = daysInMonthCount; }
        return {
            daysElapsed, daysRemaining,
            actualSpendRate: budgetStats.totalSpent / (daysElapsed || 1),
        };
    }, [currentMonth, budgetStats]);

    const budgetCategories = useMemo(() => {
        if (!budgetData?.length) return [];
        return (budgetData[0]?.budgetCategoryStats?.budgetPeriodCategories || []).map(c => ({
            categoryName: c.category, budgetedAmount: c.budgeted, actualAmount: c.actual,
            remainingAmount: c.remaining, isRecurring: c.isRecurring || false, isCustom: c.isCustom || false,
        }));
    }, [budgetData]);

    const recurringCategories = useMemo(() => budgetCategories.filter(c => c.isRecurring), [budgetCategories]);

    // ═════════════════════════════════════════════════════════════════════════
    // LAYOUT C — page state and values derived from the original data above
    // ═════════════════════════════════════════════════════════════════════════
    const [overviewMode, setOverviewMode] = useState<OverviewMode>('month');
    const [kpiView, setKpiView]           = useState<KpiView>('chart');
    const [faces, setFaces]               = useState<Record<string, WeekFace>>({});
    const [recView, setRecView]           = useState<RecurringView>('table');
    const [buckets, setBuckets]           = useState<Record<string, SpendingBucket>>({});   // page state only, keyed by week start

    const notify = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
        setSnackbarMessage(message); setSnackbarSeverity(severity); setSnackbarOpen(true);
    };

    // Weeks come from the backend's own schedule (budgetSchedule.budgetScheduleRanges); that field isn't on the
    // BudgetRunnerResult type, hence the cast. Falls back to 7-day blocks if a month has no schedule ranges.
    const scheduleRanges: BudgetScheduleRange[] = useMemo(
        () => ((budgetData[0] as any)?.budgetSchedule?.budgetScheduleRanges ?? []) as BudgetScheduleRange[],
        [budgetData]);
    const weeks = useMemo(
        () => (scheduleRanges.length > 0 ? weeksFromScheduleRanges(scheduleRanges) : splitMonthIntoWeeks(currentMonth)),
        [scheduleRanges, currentMonth]);
    const rangeForWeek = (w: WeekRange) => scheduleRanges.find(r => r.startRange === toIsoDate(w.start));
    const weekKey = (w: WeekRange) => toIsoDate(w.start);

    // Weekly spending: Plaid transactions with their categories (TransactionCategoryService.fetchTransactionCategoryList).
    const [plaidTxns, setPlaidTxns] = useState<CategoryTransactionsByDate[]>([]);
    const [isWeeklyLoading, setIsWeeklyLoading] = useState(false);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        setIsWeeklyLoading(true);
        (async () => {
            const list = await transactionCategoryService.fetchTransactionCategoryList(userId, formatDate(startDate), formatDate(endDate));
            console.log('[weeks] transactions:', list.length, list.map(t => `${t.posted ?? t.date} | ${t.category ?? '-'} | ${t.primaryCategory ?? '-'} | ${t.amount}`));
            if (cancelled) return;
            // Field names below are from your Transaction type in utils/Items — adjust these three if they differ.
            setPlaidTxns((list ?? [])
                .map((t: Transaction): CategoryTransactionsByDate => ({
                    category: t.category ?? t.primaryCategory ?? '',
                    totalCategorySpending: -t.amount,
                    transactionDate: t.posted ?? t.date,
                }))
                .filter(t => t.category !== '' && t.totalCategorySpending > 0));
            setIsWeeklyLoading(false);
        })();
        return () => { cancelled = true; };
    }, [userId, startDate, endDate, budgetData]);

    const monthlyBudgets = useMemo(() => {
        const out: Record<string, number> = {};
        for (const c of budgetCategories) out[c.categoryName] = c.budgetedAmount ?? 0;
        return out;
    }, [budgetCategories]);

    const recurringRows: RecurringCategory[] = useMemo(() => recurringCategories.map(c => ({
        name: c.categoryName, budgeted: c.budgetedAmount ?? 0, actual: c.actualAmount ?? 0, remaining: c.remainingAmount ?? 0,
    })), [recurringCategories]);

    const recurringNames = useMemo(() => new Set(recurringRows.map(c => c.name)), [recurringRows]);

    const expenseTxns = useMemo(() => plaidTxns.filter(t => !isIncomeCategory(t.category)), [plaidTxns]);

    const spendingInWeek = (w: WeekRange) => spendingByCategory(expenseTxns, w.start, w.end);

    const budgetsInWeek = (w: WeekRange): Record<string, number> =>
        proratedWeekBudgets(monthlyBudgets, w, daysInMonth(currentMonth));

    const paymentsInWeek = (w: WeekRange): RecurringPayment[] =>
        expenseTxns
            .filter(t => recurringNames.has(t.category))
            .map(t => ({ category: t.category, amount: t.totalCategorySpending, date: toLocalDate(t.transactionDate) ?? undefined }))
            .filter(p => !!p.date && isWithin(p.date, w.start, w.end));

    const monthOverview: MonthOverview | null = budgetData.length === 0 ? null : {
        monthLabel: format(currentMonth, 'MMMM'),
        totalBudget: budgetStats.totalBudget,
        totalSpent: budgetStats.totalSpent,
        totalSaved: budgetStats.totalSaved,
        remaining: budgetStats.remaining,
        recurringBudgeted: recurringRows.reduce((t, c) => t + c.budgeted, 0),
        bucketPlans: weeks.map(w => buckets[weekKey(w)]).filter(Boolean).flatMap(b => (b as SpendingBucket).items).reduce((t, i) => t + i.amount, 0),
        avgSpendPerDay: metrics.actualSpendRate,
        daysRemaining: metrics.daysRemaining,
    };

    // Needs paydays and paycheck amounts, which nothing returns yet; the Pay period toggle stays disabled.
    const payOverview: PayPeriodOverview | null = null;

    // Week faces
    useEffect(() => { setFaces({}); }, [currentMonth]);
    const faceFor = (w: WeekRange): WeekFace => faces[weekKey(w)] ?? 'kpi';
    const setFace = (w: WeekRange, face: WeekFace) => setFaces(prev => ({ ...prev, [weekKey(w)]: face }));

    // Buckets (page state only)
    const updateBucket = (key: string, fn: (b: SpendingBucket) => SpendingBucket) =>
        setBuckets(prev => (prev[key] ? { ...prev, [key]: fn(prev[key]) } : prev));
    const keyOfItem = (item: BucketItem) => Object.keys(buckets).find(k => buckets[k].items.some(i => i.id === item.id));

    const handleCreateBucket = async (w: WeekRange, limit: number) => {
        const key = weekKey(w);
        setBuckets(prev => ({ ...prev, [key]: { weekKey: key, limitAmount: limit, items: [] } }));
    };
    const handleAddItem = async (bucket: SpendingBucket, name: string, amount: number) =>
        updateBucket(bucket.weekKey, b => ({ ...b, items: [...b.items, { id: newId(), name, amount, purchased: false }] }));
    const handleUpdateItem = async (item: BucketItem, patch: BucketItemPatch) => {
        const key = keyOfItem(item);
        if (key) updateBucket(key, b => ({ ...b, items: b.items.map(i => (i.id === item.id ? { ...i, ...patch } : i)) }));
    };
    const handleDeleteItem = async (item: BucketItem) => {
        const key = keyOfItem(item);
        if (key) updateBucket(key, b => ({ ...b, items: b.items.filter(i => i.id !== item.id) }));
    };
    const handleUpdateLimit = async (bucket: SpendingBucket, limit: number) =>
        updateBucket(bucket.weekKey, b => ({ ...b, limitAmount: limit }));
    const handleRollLeftover = async (bucket: SpendingBucket) => {
        const planned = bucket.items.reduce((t, i) => t + i.amount, 0);
        const leftover = bucket.limitAmount - planned;
        const idx = weeks.findIndex(w => weekKey(w) === bucket.weekKey);
        const next = weeks[idx + 1];
        if (leftover <= 0 || !next) { notify('Nothing to roll into a later week this month', 'info'); return; }
        const nextKey = weekKey(next);
        setBuckets(prev => ({
            ...prev,
            [bucket.weekKey]: { ...prev[bucket.weekKey], limitAmount: planned },
            [nextKey]: prev[nextKey]
                ? { ...prev[nextKey], limitAmount: prev[nextKey].limitAmount + leftover }
                : { weekKey: nextKey, limitAmount: DEFAULT_BUCKET_LIMIT + leftover, items: [] },
        }));
        notify(`Moved $${leftover.toFixed(0)} to ${next.title}`, 'success');
    };
    const handleNewBucket = () => setFace(weeks.find(weekContainsToday) ?? weeks[0], 'bucket');

    // ═════════════════════════════════════════════════════════════════════════
    // RENDER — Layout C
    // ═════════════════════════════════════════════════════════════════════════
    return (
        <Box sx={{ maxWidth: 'calc(100% - 240px)', ml: '240px', minHeight: '100vh', bgcolor: T.ground, fontFamily: FONT_SANS, color: T.text }}>
            <Sidebar />

            {isBudgetCategoryLoading && (
                <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(244,242,241,0.92)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, zIndex: 9999 }}>
                    <CircularProgress size={44} thickness={4} sx={{ color: T.accent }} />
                    <Typography sx={{ fontWeight: 700, fontSize: 18 }}>{budgetCategoryLoadingMessage || 'Syncing Budget Categories'}</Typography>
                    <Typography sx={{ fontSize: 14, color: T.muted }}>Please wait a moment…</Typography>
                </Box>
            )}

            <Box sx={{ maxWidth: 1400, mx: 'auto', px: 3, pt: 4, pb: 6, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                {/* Header */}
                <Box component="header" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                            <Box sx={{ width: 28, height: 3, borderRadius: '2px', bgcolor: T.accent }} />
                            <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.accent }}>Budget</Typography>
                            <Typography component="h1" sx={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.01em' }}>{format(currentMonth, 'MMMM yyyy')}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton aria-label="Previous month" disabled={isLoading} onClick={handlePreviousMonth}
                                        sx={{ width: 40, height: 40, border: `1px solid ${T.inputBorder}`, borderRadius: '8px', bgcolor: T.surface, color: T.ink2 }}>
                                <ChevronLeft size={16} />
                            </IconButton>
                            <IconButton aria-label="Next month" disabled={isLoading} onClick={handleNextMonth}
                                        sx={{ width: 40, height: 40, border: `1px solid ${T.inputBorder}`, borderRadius: '8px', bgcolor: T.surface, color: T.ink2 }}>
                                <ChevronRight size={16} />
                            </IconButton>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <ButtonBase disabled={!uploadAccess} onClick={() => setImportDialogOpen(true)} sx={headerBtnSx}>Import</ButtonBase>
                        <ButtonBase onClick={() => setManageBudgetsDialogOpen(true)} sx={headerBtnSx}>Manage</ButtonBase>
                        <ButtonBase onClick={() => setManageCategoriesDialogOpen(true)} sx={headerBtnSx}>Categories</ButtonBase>
                        <ButtonBase onClick={handleNewBucket}
                                    sx={{ height: 40, px: 2, borderRadius: '8px', bgcolor: T.accent, color: '#FFF', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, '&:hover': { bgcolor: T.accentDark } }}>
                            + New bucket
                        </ButtonBase>
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ borderRadius: '10px' }}>{error}</Alert>}

                {/* Overview */}
                <BudgetOverviewBar mode={overviewMode} onModeChange={setOverviewMode}
                                   month={monthOverview} payPeriod={payOverview} isLoading={isLoading} />

                {/* Weeks */}
                <Box component="section" aria-labelledby="weeks-h" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                        <Box>
                            <Typography id="weeks-h" component="h2" sx={{ fontSize: 16, fontWeight: 700 }}>Weeks</Typography>
                            <Typography sx={{ fontSize: 12, color: T.muted }}>Weekly budgets = monthly budget × days in week ÷ days in month</Typography>
                        </Box>
                        <SegmentedToggle<KpiView> label="KPI view" value={kpiView} onChange={setKpiView}
                                                  options={[{ value: 'list', label: 'List' }, { value: 'chart', label: 'Categories' }]} />
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 2, alignItems: 'stretch', opacity: isWeeklyLoading ? 0.6 : 1, transition: 'opacity .2s' }}>
                        {weeks.map(w => (
                            <WeekCard key={weekKey(w)}
                                      week={w}
                                      isCurrent={weekContainsToday(w)}
                                      face={faceFor(w)}
                                      onFaceChange={f => setFace(w, f)}
                                      kpiView={kpiView}
                                      payments={paymentsInWeek(w)}
                                      spending={spendingInWeek(w)}
                                      budgets={budgetsInWeek(w)}
                                      weekBudget={rangeForWeek(w)?.budgetedAmount}
                                      weekSpentOnRange={rangeForWeek(w)?.spentOnRange}
                                      bucket={buckets[weekKey(w)]}
                                      defaultBucketLimit={DEFAULT_BUCKET_LIMIT}
                                      onCreateBucket={handleCreateBucket}
                                      onAddItem={handleAddItem}
                                      onUpdateItem={handleUpdateItem}
                                      onDeleteItem={handleDeleteItem}
                                      onUpdateLimit={handleUpdateLimit}
                                      onRollLeftover={handleRollLeftover} />
                        ))}
                    </Box>
                </Box>

                {/* Recurring */}
                <RecurringSection categories={recurringRows} view={recView} onViewChange={setRecView} isLoading={isLoading} />
            </Box>

            {/* ── Dialogs (original) ──────────────────────────────────────────── */}
            <Dialog open={newBudgetDialogOpen} onClose={() => setNewBudgetDialogOpen(false)}
                    maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2, maxHeight: '90vh' } }}>
                <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>Create Budget for {new Date().getFullYear()}</Typography>
                        <IconButton aria-label="Close" onClick={() => setNewBudgetDialogOpen(false)}><X size={18} /></IconButton>
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
//     alpha,
//     Container,
//     Grow,
//     Skeleton,
//     Stack,
//     Snackbar,
//     Alert,
//     Dialog,
//     CircularProgress,
//     LinearProgress,
//     Divider,
// } from '@mui/material';
// import {
//     ChevronLeft,
//     ChevronRight,
//     Calendar,
//     PieChart,
//     Award,
//     ImportIcon,
//     Delete,
//     Clock,
//     TrendingUp,
//     TrendingDown,
//     Minus,
//     PiggyBank,
// } from 'lucide-react';
// import React, { useEffect, useMemo, useState } from 'react';
// import Sidebar from './Sidebar';
// import BudgetPeriodTable from './BudgetPeriodTable';
// import DynamicBudgetPanel, { CSVTransactionsByDateCategory } from './DynamicBudgetPanel';
// import BudgetRunnerService, { BudgetRunnerResult } from '../services/BudgetRunnerService';
// import CsvUploadService from '../services/CsvUploadService';
// import { BudgetCategoryStats, BudgetStats } from '../utils/Items';
// import DateRange from '../domain/DateRange';
// import CSVImportDialog from './CSVImportDialog';
// import BudgetService from '../services/BudgetService';
// import { BudgetQuestions } from '../utils/BudgetUtils';
// import BudgetQuestionnaireForm from './BudgetQuestionnaireForm';
// import ManageBudgetsDialog from './ManageBudgetsDialog';
// import ManageBudgetCategoriesDialog from './ManageBudgetCategoriesDialog';
// import BudgetCategoriesService from '../services/BudgetCategoriesService';
// import UserService from '../services/UserService';
// import TransactionCategoryService from '../services/TransactionCategoryService';
// import BudgetOverview from './BudgetOverview';
// import TopExpenseCategory from './TopExpenseCategory';
//
// // ── Design tokens ──────────────────────────────────────────────────────────────
// const MAROON      = '#6b1a1a';   // deep wine — warm, not bright
// const MAROON_DARK = '#4a1010';   // darker for hover states
//
// // Card palette — each card gets its own non-white base colour
// // These are intentionally muted so numbers/chips still pop
// const CARD_THEMES = {
//     budget: {
//         base:        '#f0f4ff',   // cool blue-grey
//         border:      '#6b1a1a',
//         valueColor:  '#1e1e2e',
//         barColor:    '#6b1a1a',
//         chipBg:      'rgba(128,0,0,0.10)',
//         chipColor:   '#6b1a1a',
//         labelColor:  '#5a5a7a',
//     },
//     spent_ok: {
//         base:        '#f0fdf4',   // soft green
//         border:      '#16a34a',
//         valueColor:  '#14532d',
//         barColor:    '#16a34a',
//         chipBg:      'rgba(22,163,74,0.12)',
//         chipColor:   '#15803d',
//         labelColor:  '#4a7060',
//     },
//     spent_warn: {
//         base:        '#fffbeb',   // warm amber
//         border:      '#d97706',
//         valueColor:  '#78350f',
//         barColor:    '#d97706',
//         chipBg:      'rgba(217,119,6,0.12)',
//         chipColor:   '#92400e',
//         labelColor:  '#7a6030',
//     },
//     spent_over: {
//         base:        '#fff1f2',   // soft red
//         border:      '#dc2626',
//         valueColor:  '#7f1d1d',
//         barColor:    '#dc2626',
//         chipBg:      'rgba(220,38,38,0.12)',
//         chipColor:   '#991b1b',
//         labelColor:  '#7a3030',
//     },
//     remaining_good: {
//         base:        '#f0fdf4',
//         border:      '#16a34a',
//         valueColor:  '#14532d',
//         barColor:    '#16a34a',
//         chipBg:      'rgba(22,163,74,0.12)',
//         chipColor:   '#15803d',
//         labelColor:  '#4a7060',
//     },
//     remaining_warn: {
//         base:        '#fffbeb',
//         border:      '#d97706',
//         valueColor:  '#78350f',
//         barColor:    '#d97706',
//         chipBg:      'rgba(217,119,6,0.12)',
//         chipColor:   '#92400e',
//         labelColor:  '#7a6030',
//     },
//     remaining_bad: {
//         base:        '#fff1f2',
//         border:      '#dc2626',
//         valueColor:  '#7f1d1d',
//         barColor:    '#dc2626',
//         chipBg:      'rgba(220,38,38,0.12)',
//         chipColor:   '#991b1b',
//         labelColor:  '#7a3030',
//     },
//     saved_good: {
//         base:        '#f0f9ff',   // sky teal
//         border:      '#0284c7',
//         valueColor:  '#0c4a6e',
//         barColor:    '#0284c7',
//         chipBg:      'rgba(2,132,199,0.12)',
//         chipColor:   '#075985',
//         labelColor:  '#3a6070',
//     },
//     saved_low: {
//         base:        '#fafafa',   // near-white neutral
//         border:      '#94a3b8',
//         valueColor:  '#334155',
//         barColor:    '#94a3b8',
//         chipBg:      'rgba(148,163,184,0.15)',
//         chipColor:   '#475569',
//         labelColor:  '#64748b',
//     },
// };
//
// type CardThemeKey = keyof typeof CARD_THEMES;
//
// function resolveCardTheme(title: string, amount: number, totalBudget: number): CardThemeKey {
//     if (title === 'Total Budget') return 'budget';
//     if (title === 'Total Spent') {
//         const pct = totalBudget > 0 ? amount / totalBudget : 0;
//         if (pct > 1)    return 'spent_over';
//         if (pct > 0.8)  return 'spent_warn';
//         return 'spent_ok';
//     }
//     if (title === 'Remaining') {
//         if (amount < 0) return 'remaining_bad';
//         const pct = totalBudget > 0 ? amount / totalBudget : 1;
//         if (pct < 0.1)  return 'remaining_warn';
//         return 'remaining_good';
//     }
//     // Total Saved
//     const pct = totalBudget > 0 ? amount / totalBudget : 0;
//     return pct >= 0.05 ? 'saved_good' : 'saved_low';
// }
//
// function chipLabel(title: string, amount: number, totalBudget: number, daysRemaining: number): string {
//     if (title === 'Total Budget') return 'Monthly limit';
//     if (title === 'Total Spent') {
//         const pct = totalBudget > 0 ? (amount / totalBudget) * 100 : 0;
//         if (pct > 100)  return `${(pct - 100).toFixed(0)}% over budget`;
//         if (pct > 80)   return `${pct.toFixed(0)}% — watch out`;
//         return `${pct.toFixed(0)}% of budget`;
//     }
//     if (title === 'Remaining') {
//         if (amount < 0) return 'Over budget';
//         return `${daysRemaining}d remaining`;
//     }
//     const pct = totalBudget > 0 ? (amount / totalBudget) * 100 : 0;
//     return `${pct.toFixed(1)}% of budget`;
// }
//
// function chipIcon(title: string, amount: number, totalBudget: number) {
//     if (title === 'Total Budget') return <Minus size={11} />;
//     if (title === 'Total Spent') {
//         const pct = totalBudget > 0 ? amount / totalBudget : 0;
//         return pct > 0.8 ? <TrendingUp size={11} /> : <TrendingDown size={11} />;
//     }
//     if (title === 'Remaining') return amount < 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />;
//     return <PiggyBank size={11} />;
// }
// // ──────────────────────────────────────────────────────────────────────────────
//
// const BudgetPage: React.FC = () => {
//                     const [currentMonth, setCurrentMonth] = useState(new Date());
//                     const [isLoading, setIsLoading] = useState(false);
//                     const [error, setError] = useState<string | null>(null);
//                     const [animateIn, setAnimateIn] = useState(false);
//                     const [importDialogOpen, setImportDialogOpen] = useState(false);
//                     const [uploadAccess, setUploadAccess] = useState<boolean>(false);
//                     const budgetRunnerService = BudgetRunnerService.getInstance();
//                     const budgetCategoryService = BudgetCategoriesService.getInstance();
//                     const transactionCategoryService = TransactionCategoryService.getInstance();
//                     const [budgetData, setBudgetData] = useState<BudgetRunnerResult[]>([]);
//                     const userId = Number(sessionStorage.getItem('userId'));
//                     const [successMessage, setSuccessMessage] = useState<string | null>(null);
//                     const [snackBarOpen, setSnackbarOpen] = useState(false);
//                     const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
//                     const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>();
//                     const [newBudgetDialogOpen, setNewBudgetDialogOpen] = useState<boolean>(false);
//                     const [manageBudgetsDialogOpen, setManageBudgetsDialogOpen] = useState<boolean>(false);
//                     const [manageCategoriesDialogOpen, setManageCategoriesDialogOpen] = useState<boolean>(false);
//                     const [isBudgetCategoryLoading, setIsBudgetCategoryLoading] = useState<boolean>(false);
//                     const [budgetCategoryLoadingMessage, setBudgetCategoryLoadingMessage] = useState<string>('');
//                     const [categoryTransactionsByDate, setCategoryTransactionsByDate] = useState<CSVTransactionsByDateCategory[]>([]);
//                     const userService = UserService.getInstance();
//                     const startDate = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
//                     const endDate   = useMemo(() => endOfMonth(currentMonth),   [currentMonth]);
//                     const [budgetUpdateConfirmOpen, setBudgetUpdateConfirmOpen] = useState(false);
//                     const [pendingBudgetUpdate, setPendingBudgetUpdate] = useState<{ categoryName: string; newAmount: number } | null>(null);
//
//                     const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
//                     const uploadService = new CsvUploadService();
//                     const budgetService = BudgetService.getInstance();
//
//                     const handlePreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
//                     const handleNextMonth     = () => setCurrentMonth(prev => addMonths(prev, 1));
//
//                     useEffect(() => {
//                         if (!userId) return;
//                         const s = startOfMonth(currentMonth);
//                         const e = endOfMonth(currentMonth);
//
//                         const run = async () => {
//                             try {
//                                 const hasPlaidCSVSync = await userService.checkUserHasPlaidCSVSyncEnabled(userId);
//
//                                 const [plaidHasNew, plaidHasUpdated] = await Promise.all([
//                                     transactionCategoryService.checkNewTransactionCategoriesByDateRange(userId, s, e),
//                                     transactionCategoryService.checkUpdatedTransactionCategoriesByDateRange(userId, s, e),
//                 ]);
//                 const [csvHasNew, csvHasUpdated] = hasPlaidCSVSync
//                     ? await Promise.all([
//                         transactionCategoryService.checkNewCSVTransactionCategoriesByDateRange(userId, s, e),
//                         transactionCategoryService.checkUpdatedCSVTransactionCategoriesByDateRange(userId, s, e),
//                     ])
//                     : [false, false];
//
//                 if (plaidHasNew || csvHasNew) {
//                     setIsBudgetCategoryLoading(true);
//                     await budgetCategoryService.createBudgetCategoriesForDateRange(userId, s, e);
//                 }
//
//                 if (plaidHasUpdated || csvHasUpdated) {
//                     setIsBudgetCategoryLoading(true);
//                     await budgetCategoryService.updateBudgetCategoriesByMonth(userId, s, e);
//                 }
//
//                 const data = await fetchBudgetData(currentMonth);
//
//                 // Only fall back to update if nothing was built and no transactions triggered above
//                 if ((!data || data.length === 0) && !plaidHasNew && !csvHasNew && !plaidHasUpdated && !csvHasUpdated) {
//                     setIsBudgetCategoryLoading(true);
//                     await budgetCategoryService.updateBudgetCategoriesByMonth(userId, s, e);
//                     await fetchBudgetData(currentMonth);
//                 }
//             } catch (ex) {
//                 console.error(ex);
//                 setSnackbarMessage('Failed to sync budget categories');
//                 setSnackbarSeverity('error');
//                 setSnackbarOpen(true);
//             } finally {
//                 setIsBudgetCategoryLoading(false);
//             }
//         };
//
//         run();
//     }, [userId, currentMonth]); // single effect, single dependency array
//
//     // useEffect(() => {
//     //     const s = startOfMonth(currentMonth);
//     //     const e = endOfMonth(currentMonth);
//     //     const run = async () => {
//     //         try {
//     //             const hasPlaidCSVSync = await userService.checkUserHasPlaidCSVSyncEnabled(userId);
//     //             const plaidHasNew = await transactionCategoryService.checkNewTransactionCategoriesByDateRange(userId, s, e);
//     //             const csvHasNew = hasPlaidCSVSync
//     //                 ? await transactionCategoryService.checkNewCSVTransactionCategoriesByDateRange(userId, s, e)
//     //                 : false;
//     //             if (plaidHasNew || csvHasNew) {
//     //                 setIsBudgetCategoryLoading(true);
//     //                 await budgetCategoryService.createBudgetCategoriesForDateRange(userId, s, e);
//     //                 console.log('Fetching budget data for month: ', currentMonth, ' with new categories...');
//     //                 fetchBudgetData(currentMonth, true);
//     //                 await new Promise(r => setTimeout(r, 2000));
//     //                 setIsBudgetCategoryLoading(false);
//     //             }
//     //         } catch (ex) {
//     //             console.error(ex);
//     //             setSnackbarMessage('Failed to create budget categories');
//     //             setSnackbarSeverity('error');
//     //             setSnackbarOpen(true);
//     //             setIsBudgetCategoryLoading(false);
//     //         }
//     //     };
//     //     run();
//     // }, [userId, currentMonth]);
//     //
//     // useEffect(() => {
//     //     const s = startOfMonth(currentMonth);
//     //     const e = endOfMonth(currentMonth);
//     //     const run = async () => {
//     //         try {
//     //             const hasPlaidCSVSync = await userService.checkUserHasPlaidCSVSyncEnabled(userId);
//     //             const plaidHasUpdated = await transactionCategoryService.checkUpdatedTransactionCategoriesByDateRange(userId, s, e);
//     //             const csvHasUpdated = hasPlaidCSVSync
//     //                 ? await transactionCategoryService.checkUpdatedCSVTransactionCategoriesByDateRange(userId, s, e)
//     //                 : false;
//     //
//     //             if (plaidHasUpdated || csvHasUpdated) {
//     //                 setIsBudgetCategoryLoading(true);
//     //                 await budgetCategoryService.updateBudgetCategoriesByMonth(userId, s, e);
//     //                 await fetchBudgetData(currentMonth);
//     //                 await new Promise(r => setTimeout(r, 2000));
//     //                 setIsBudgetCategoryLoading(false);
//     //             } else {
//     //                 const data = await fetchBudgetData(currentMonth);
//     //                 if (!data || data.length === 0) {
//     //                     setIsBudgetCategoryLoading(true);
//     //                     await budgetCategoryService.updateBudgetCategoriesByMonth(userId, s, e);
//     //                     await fetchBudgetData(currentMonth);
//     //                     await new Promise(r => setTimeout(r, 2000));
//     //                     setIsBudgetCategoryLoading(false);
//     //                 }
//     //             }
//     //         } catch (ex) {
//     //             console.error(ex);
//     //             setSnackbarMessage('Failed to update budget categories');
//     //             setSnackbarSeverity('error');
//     //             setSnackbarOpen(true);
//     //             setIsBudgetCategoryLoading(false);
//     //         }
//     //     };
//     //     run();
//     // }, [currentMonth]);
//
//     useEffect(() => {
//         const run = async () => {
//             try {
//                 const uid = Number(sessionStorage.getItem('userId'));
//                 setUploadAccess(await userService.fetchUserOverrideEnabled(uid));
//             } catch (ex) { console.error(ex); }
//         };
//         run();
//     });
//
//     useEffect(() => {
//         if (!userId) return;
//         const run = async () => {
//             try {
//                 const data = await transactionCategoryService.fetchCSVTransactionsByCategoryWithDate(
//                     userId, formatDate(startDate), formatDate(endDate)
//                 );
//                 setCategoryTransactionsByDate(data);
//             } catch (ex) { console.error(ex); }
//         };
//         run();
//     }, [userId, startDate, endDate]);
//
//     const doesBudgetExistForBeginningYear = async (retryCount = 0): Promise<boolean> => {
//         try {
//             if (retryCount > 0) await new Promise(r => setTimeout(r, 500));
//             const exists = await budgetService.checkIfBudgetExistsForYear(userId, new Date().getFullYear());
//             if (!exists && retryCount === 0) return await doesBudgetExistForBeginningYear(1);
//             if (!exists) setNewBudgetDialogOpen(true);
//             return exists;
//         } catch (ex) {
//             console.error(ex);
//             setSnackbarMessage('Failed to check if budget exists');
//             setSnackbarSeverity('error');
//             setSnackbarOpen(true);
//             return false;
//         }
//     };
//
//     useEffect(() => { doesBudgetExistForBeginningYear(); }, [userId]);
//
//     useEffect(() => {
//         document.title = 'Budgets';
//         setTimeout(() => setAnimateIn(true), 100);
//         return () => { document.title = 'BudgetBuddy'; };
//     }, []);
//
//     const fetchBudgetData = async (date: Date, useCategoryLoader = false): Promise<BudgetRunnerResult[]> => {
//         try {
//             if (useCategoryLoader) { setIsBudgetCategoryLoading(true); } else { setIsLoading(true); }
//             setError(null);
//             const s = new Date(date.getFullYear(), date.getMonth(), 1);
//             const e = new Date(date.getFullYear(), date.getMonth() + 1, 0);
//             const results = await budgetRunnerService.getBudgetsByDateRange(userId, s, e);
//             console.log('Fetched budget data:', results);
//             if (areAllBudgetCategoriesEmpty(results[0]?.budgetCategoryStats)) {
//                 console.log('All budgetCategories are empty, creating new budget categories...');
//                 try {
//                     await budgetCategoryService.createBudgetCategoriesForDateRange(userId, s, e);
//                     const fresh = await budgetRunnerService.getBudgetsByDateRange(userId, s, e);
//                     setBudgetData(fresh);
//                     return fresh;
//                 } catch {
//                     setError('Failed to create budget categories. Please try again.');
//                     setBudgetData([]);
//                     return [];
//                 }
//             }
//             console.log('Budget categories are not empty, continuing...');
//             setBudgetData(results);
//             return results;
//         } catch {
//             setError('Failed to fetch budget data. Please try again later.');
//             return [];
//         } finally {
//             if (useCategoryLoader) {
//                 setIsBudgetCategoryLoading(false);
//                 setBudgetCategoryLoadingMessage('');
//             } else {
//                 setIsLoading(false);
//             }
//         }
//     };
//
//     const isEmpty = <T,>(arr: T[] | null | undefined) => !arr || arr.length === 0;
//
//     const areAllBudgetCategoriesEmpty = (stats: BudgetCategoryStats | undefined): boolean => {
//         if (!stats) return true;
//         return (
//             stats.expenseCategories === null &&
//             stats.incomeCategories  === null &&
//             isEmpty(stats.topExpenseCategories) &&
//             stats.savingsCategories === null &&
//             isEmpty(stats.budgetPeriodCategories)
//         );
//     };
//
//     const defaultBudgetStats: BudgetStats = {
//         averageSpendingPerDay: 0, budgetId: 0,
//         dateRange: new DateRange(new Date(), new Date()),
//         healthScore: 0, monthlyProjection: null,
//         remaining: 0, totalBudget: 0, totalSaved: 0, totalSpent: 0,
//     };
//
//     const budgetStats = useMemo(() => {
//         if (!budgetData?.length) return defaultBudgetStats;
//         const item  = budgetData[0];
//         const stats = item?.budgetStats[0];
//         const cat   = item?.budgetCategoryStats;
//         if (!stats || !cat) return defaultBudgetStats;
//         const totalSpent = cat.expenseCategories?.actualExpenses    ?? 0;
//         const totalSaved = cat.savingsCategories?.actualSavedAmount ?? 0;
//         const sa = (stats.dateRange.startDate as unknown) as number[];
//         const ea = (stats.dateRange.endDate   as unknown) as number[];
//         return {
//             averageSpendingPerDay: stats.averageSpendingPerDay ?? 0,
//             budgetId: stats.budgetId,
//             dateRange: new DateRange(
//                 new Date(sa[0], sa[1] - 1, sa[2]),
//                 new Date(ea[0], ea[1] - 1, ea[2])
//             ),
//             healthScore:       stats.healthScore ?? 0,
//             monthlyProjection: stats.monthlyProjection,
//             remaining:   stats.totalBudget - totalSpent,
//             totalBudget: stats.totalBudget,
//             totalSaved, totalSpent,
//         };
//     }, [budgetData]);
//
//     // cumulative all-time saved (sum across all loaded budget periods)
//     const cumulativeSaved = useMemo(() => {
//         return budgetData.reduce((acc, b) => {
//             return acc + (b.budgetCategoryStats?.savingsCategories?.actualSavedAmount ?? 0);
//         }, 0);
//     }, [budgetData]);
//
//     const metrics = useMemo(() => {
//         const today       = new Date();
//         const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
//         let daysElapsed   = today.getDate();
//         let daysRemaining = daysInMonth - daysElapsed;
//         if (currentMonth.getMonth() < today.getMonth() || currentMonth.getFullYear() < today.getFullYear()) { daysElapsed = daysInMonth; daysRemaining = 0; }
//         else if (currentMonth.getMonth() > today.getMonth() || currentMonth.getFullYear() > today.getFullYear()) { daysElapsed = 0; daysRemaining = daysInMonth; }
//         const percentElapsed     = (daysElapsed / daysInMonth) * 100;
//         const idealSpentSoFar    = budgetStats.totalBudget * (percentElapsed / 100);
//         const spendingDifference = idealSpentSoFar - budgetStats.totalSpent;
//         return {
//             daysElapsed, daysRemaining, percentElapsed,
//             idealSpendRate:     budgetStats.totalBudget / daysInMonth,
//             actualSpendRate:    budgetStats.totalSpent  / (daysElapsed || 1),
//             dailyBudget:        budgetStats.remaining   / (daysRemaining || 1),
//             isUnderBudget:      spendingDifference > 0,
//             spendingDifference: Math.abs(spendingDifference),
//         };
//     }, [currentMonth, budgetStats]);
//
//     const topExpenseCategories = useMemo(() => {
//         if (!budgetData?.length) return [];
//         return budgetData.reduce<any[]>((acc, budget) => {
//             const s = budget.budgetCategoryStats;
//             if (!s?.topExpenseCategories) return acc;
//             return [...acc, ...s.topExpenseCategories.map(e => ({
//                 categoryName: e.category, budgetedAmount: e.budgetedExpenses,
//                 actualAmount: e.actualExpenses, remainingAmount: e.remainingExpenses,
//                 startDate: e.startDate, endDate: e.endDate, isActive: e.active,
//                 isRecurring: false, isCustom: false,
//             }))];
//         }, []);
//     }, [budgetData]);
//
//     const overviewCategories = useMemo(() => {
//         if (!budgetData?.length) return [];
//         const cat = budgetData[0]?.budgetCategoryStats;
//         const out: any[] = [];
//         if (cat?.expenseCategories) out.push({ category: 'Expenses', budgetedExpenses: cat.expenseCategories.budgetedExpenses, actualExpenses: cat.expenseCategories.actualExpenses, remainingExpenses: cat.expenseCategories.remainingExpenses });
//         if (cat?.incomeCategories)  out.push({ category: 'Income',   budgetedExpenses: cat.incomeCategories.budgetedIncome,    actualExpenses: cat.incomeCategories.actualBudgetedIncome, remainingExpenses: cat.incomeCategories.remainingIncome });
//         if (cat?.savingsCategories) out.push({ category: 'Savings',  budgetedExpenses: cat.savingsCategories.budgetedSavingsTarget, actualExpenses: cat.savingsCategories.actualSavedAmount, remainingExpenses: cat.savingsCategories.remainingToSave });
//         return out;
//     }, [budgetData]);
//
//     const budgetCategories = useMemo(() => {
//         if (!budgetData?.length) return [];
//         return (budgetData[0]?.budgetCategoryStats?.budgetPeriodCategories || []).map(c => ({
//             categoryName: c.category, budgetedAmount: c.budgeted, actualAmount: c.actual,
//             remainingAmount: c.remaining, isRecurring: c.isRecurring || false, isCustom: c.isCustom || false,
//         }));
//     }, [budgetData]);
//
//     const recurringCategories = useMemo(() => budgetCategories.filter(c => c.isRecurring), [budgetCategories]);
//
//     const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
//
//     // ── Render ───────────────────────────────────────────────────────────────
//     return (
//         <Box sx={{ maxWidth: 'calc(100% - 240px)', ml: '240px', minHeight: '100vh', background: '#f0f2f5' }}>
//             <Sidebar />
//
//             {isBudgetCategoryLoading && (
//                 <Box sx={{
//                     position: 'fixed', inset: 0, bgcolor: 'rgba(255,255,255,0.92)',
//                     backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column',
//                     alignItems: 'center', justifyContent: 'center', zIndex: 9999,
//                 }}>
//                     <CircularProgress size={52} thickness={4} sx={{ color: MAROON, mb: 2.5 }} />
//                     <Typography variant="h6" sx={{ fontWeight: 700, color: '#111', mb: 0.5 }}>
//                         {budgetCategoryLoadingMessage || 'Syncing Budget Categories'}
//                     </Typography>
//                     <Typography variant="body2" color="text.secondary">Please wait a moment…</Typography>
//                 </Box>
//             )}
//
//             <Container maxWidth="xl" sx={{ py: 4 }}>
//
//                 {/* ── Header ────────────────────────────────────────────────── */}
//                 <Grow in={animateIn} timeout={400}>
//                     <Box sx={{
//                         display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//                         mb: 4, flexDirection: { xs: 'column', sm: 'row' },
//                         textAlign: { xs: 'center', sm: 'left' }, gap: 2,
//                     }}>
//                         <Box>
//                             <Box sx={{ width: 28, height: 3, background: MAROON, borderRadius: '2px', mb: 0.75 }} />
//                             <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#111', letterSpacing: '-0.025em' }}>
//                                 {format(currentMonth, 'MMMM yyyy')} Budget
//                             </Typography>
//                             <Typography variant="subtitle1" sx={{ color: '#888', mt: 0.5 }}>
//                                 Track your progress and stay within your spending limits
//                             </Typography>
//                         </Box>
//
//                         {/* ── Nav + action buttons (matching Option A preview style) ── */}
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
//                             <IconButton onClick={handlePreviousMonth} disabled={isLoading} sx={{
//                                 width: 32, height: 32, borderRadius: '6px',
//                                 background: MAROON, color: '#fff',
//                                 '&:hover': { background: MAROON_DARK },
//                                 '&.Mui-disabled': { background: '#ddd', color: '#aaa' },
//                             }}>
//                                 <ChevronLeft size={16} />
//                             </IconButton>
//
//                             <Card elevation={0} sx={{
//                                 px: 2, py: 0.75, display: 'flex', alignItems: 'center', gap: 1,
//                                 borderRadius: '8px', border: '1px solid #e0e0e0', background: '#f9f9f9',
//                             }}>
//                                 <Calendar size={14} color="#888" />
//                                 <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#222' }}>
//                                     {format(currentMonth, 'MMMM yyyy')}
//                                 </Typography>
//                             </Card>
//
//                             <IconButton onClick={handleNextMonth} disabled={isLoading} sx={{
//                                 width: 32, height: 32, borderRadius: '6px',
//                                 background: MAROON, color: '#fff',
//                                 '&:hover': { background: MAROON_DARK },
//                                 '&.Mui-disabled': { background: '#ddd', color: '#aaa' },
//                             }}>
//                                 <ChevronRight size={16} />
//                             </IconButton>
//
//                             {/* Option A bank-style: grey border, dark text, maroon only on hover */}
//                             {([
//                                 { label: 'Import',     icon: <ImportIcon size={14} />, onClick: () => setImportDialogOpen(true),          disabled: !uploadAccess, ml: 1 },
//                                 { label: 'Manage',     icon: <Clock size={14} />,      onClick: () => setManageBudgetsDialogOpen(true),    disabled: false,         ml: 0 },
//                                 { label: 'Categories', icon: <PieChart size={14} />,   onClick: () => setManageCategoriesDialogOpen(true), disabled: false,         ml: 0 },
//                             ] as Array<{ label: string; icon: React.ReactNode; onClick: () => void; disabled: boolean; ml: number }>).map(({ label, icon, onClick, disabled, ml }) => (
//                                 <Button
//                                     key={label}
//                                     variant="outlined"
//                                     size="small"
//                                     startIcon={icon}
//                                     onClick={onClick}
//                                     disabled={disabled}
//                                     sx={{
//                                         ml, borderRadius: '6px', textTransform: 'none',
//                                         fontWeight: 600, fontSize: '0.78rem', letterSpacing: '0.02em',
//                                         borderColor: '#d5d5d5', color: '#333', bgcolor: '#fff',
//                                         '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: alpha(MAROON, 0.04) },
//                                         '&.Mui-disabled': { borderColor: '#e8e8e8', color: '#bbb' },
//                                     }}>
//                                     {label}
//                                 </Button>
//                             ))}
//                         </Box>
//                     </Box>
//                 </Grow>
//
//                 {/* ── Error banner ───────────────────────────────────────────── */}
//                 {error && (
//                     <Grow in timeout={400}>
//                         <Box sx={{
//                             mb: 3, p: 2.5, background: alpha(MAROON, 0.06), color: MAROON,
//                             borderRadius: '10px', border: `1px solid ${alpha(MAROON, 0.18)}`,
//                             display: 'flex', alignItems: 'center', gap: 2,
//                         }}>
//                             <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: alpha(MAROON, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                                 <Award size={18} color={MAROON} />
//                             </Box>
//                             <Box>
//                                 <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.25 }}>Error Loading Budget Data</Typography>
//                                 <Typography variant="body2" sx={{ color: '#666' }}>{error}</Typography>
//                             </Box>
//                         </Box>
//                     </Grow>
//                 )}
//
//                 {/* ── Summary cards ──────────────────────────────────────────── */}
//                 <Grow in={animateIn} timeout={600}>
//                     <Grid container spacing={2.5} sx={{ mb: 4 }}>
//
//                         {/* ── 1. Total Budget ── */}
//                         {(() => {
//                             const t = CARD_THEMES.budget;
//                             return (
//                                 <Grid item xs={12} sm={6} md={3}>
//                                     <Box sx={{
//                                         background: t.base, borderRadius: '10px',
//                                         borderTop: `3px solid ${t.border}`,
//                                         boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
//                                         p: 2.5, height: '100%',
//                                         transition: 'box-shadow 0.2s',
//                                         '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' },
//                                     }}>
//                                         <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.labelColor, fontWeight: 700, mb: 1 }}>
//                                             Total Budget
//                                         </Typography>
//                                         {isLoading
//                                             ? <Skeleton variant="text" width="70%" height={42} />
//                                             : <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: t.valueColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1, mb: 0.5 }}>
//                                                 {fmt(budgetStats.totalBudget)}
//                                             </Typography>
//                                         }
//                                         <LinearProgress variant="determinate" value={100} sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(t.barColor, 0.15), '& .MuiLinearProgress-bar': { bgcolor: t.barColor, borderRadius: 2 } }} />
//                                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
//                                             <Typography sx={{ fontSize: '0.72rem', color: t.labelColor }}>{format(currentMonth, 'MMMM yyyy')}</Typography>
//                                             <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: t.chipBg, color: t.chipColor, fontSize: '0.65rem', fontWeight: 700 }}>
//                                                 <Minus size={11} /> Monthly limit
//                                             </Box>
//                                         </Box>
//                                     </Box>
//                                 </Grid>
//                             );
//                         })()}
//
//                         {/* ── 2. Total Spent ── */}
//                         {(() => {
//                             const key = resolveCardTheme('Total Spent', budgetStats.totalSpent, budgetStats.totalBudget);
//                             const t   = CARD_THEMES[key];
//                             const pct = budgetStats.totalBudget > 0 ? Math.min((budgetStats.totalSpent / budgetStats.totalBudget) * 100, 100) : 0;
//                             return (
//                                 <Grid item xs={12} sm={6} md={3}>
//                                     <Box sx={{
//                                         background: t.base, borderRadius: '10px',
//                                         borderTop: `3px solid ${t.border}`,
//                                         boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
//                                         p: 2.5, height: '100%',
//                                         transition: 'box-shadow 0.2s',
//                                         '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' },
//                                     }}>
//                                         <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.labelColor, fontWeight: 700, mb: 1 }}>
//                                             Total Spent
//                                         </Typography>
//                                         {isLoading
//                                             ? <Skeleton variant="text" width="70%" height={42} />
//                                             : <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: t.valueColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1, mb: 0.5 }}>
//                                                 {fmt(budgetStats.totalSpent)}
//                                             </Typography>
//                                         }
//                                         <LinearProgress variant="determinate" value={pct} sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(t.barColor, 0.15), '& .MuiLinearProgress-bar': { bgcolor: t.barColor, borderRadius: 2 } }} />
//                                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
//                                             <Typography sx={{ fontSize: '0.72rem', color: t.labelColor }}>Avg. ${Math.round(metrics.actualSpendRate)}/day</Typography>
//                                             {!isLoading && (
//                                                 <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: t.chipBg, color: t.chipColor, fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
//                                                     {chipIcon('Total Spent', budgetStats.totalSpent, budgetStats.totalBudget)}
//                                                     {chipLabel('Total Spent', budgetStats.totalSpent, budgetStats.totalBudget, metrics.daysRemaining)}
//                                                 </Box>
//                                             )}
//                                         </Box>
//                                     </Box>
//                                 </Grid>
//                             );
//                         })()}
//
//                         {/* ── 3. Remaining ── */}
//                         {(() => {
//                             const key = resolveCardTheme('Remaining', budgetStats.remaining, budgetStats.totalBudget);
//                             const t   = CARD_THEMES[key];
//                             const pct = budgetStats.totalBudget > 0 ? Math.max((budgetStats.remaining / budgetStats.totalBudget) * 100, 0) : 0;
//                             return (
//                                 <Grid item xs={12} sm={6} md={3}>
//                                     <Box sx={{
//                                         background: t.base, borderRadius: '10px',
//                                         borderTop: `3px solid ${t.border}`,
//                                         boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
//                                         p: 2.5, height: '100%',
//                                         transition: 'box-shadow 0.2s',
//                                         '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' },
//                                     }}>
//                                         <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.labelColor, fontWeight: 700, mb: 1 }}>
//                                             Remaining
//                                         </Typography>
//                                         {isLoading
//                                             ? <Skeleton variant="text" width="70%" height={42} />
//                                             : <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: t.valueColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1, mb: 0.5 }}>
//                                                 {fmt(Math.max(budgetStats.remaining, 0))}
//                                             </Typography>
//                                         }
//                                         <LinearProgress variant="determinate" value={pct} sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(t.barColor, 0.15), '& .MuiLinearProgress-bar': { bgcolor: t.barColor, borderRadius: 2 } }} />
//                                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
//                                             <Typography sx={{ fontSize: '0.72rem', color: t.labelColor }}>{metrics.daysRemaining} days left</Typography>
//                                             {!isLoading && (
//                                                 <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: t.chipBg, color: t.chipColor, fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
//                                                     {chipIcon('Remaining', budgetStats.remaining, budgetStats.totalBudget)}
//                                                     {chipLabel('Remaining', budgetStats.remaining, budgetStats.totalBudget, metrics.daysRemaining)}
//                                                 </Box>
//                                             )}
//                                         </Box>
//                                     </Box>
//                                 </Grid>
//                             );
//                         })()}
//
//                         {/* ── 4. Total Saved — monthly + cumulative ── */}
//                         {(() => {
//                             const key = resolveCardTheme('Total Saved', budgetStats.totalSaved, budgetStats.totalBudget);
//                             const t   = CARD_THEMES[key];
//                             const pct = budgetStats.totalBudget > 0 ? Math.min((budgetStats.totalSaved / budgetStats.totalBudget) * 100, 100) : 0;
//                             return (
//                                 <Grid item xs={12} sm={6} md={3}>
//                                     <Box sx={{
//                                         background: t.base, borderRadius: '10px',
//                                         borderTop: `3px solid ${t.border}`,
//                                         boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
//                                         p: 2.5, height: '100%',
//                                         transition: 'box-shadow 0.2s',
//                                         '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' },
//                                     }}>
//                                         <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.labelColor, fontWeight: 700, mb: 1 }}>
//                                             Saved This Month
//                                         </Typography>
//                                         {isLoading
//                                             ? <Skeleton variant="text" width="70%" height={42} />
//                                             : <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: t.valueColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1, mb: 0.5 }}>
//                                                 {fmt(budgetStats.totalSaved)}
//                                             </Typography>
//                                         }
//                                         <LinearProgress variant="determinate" value={pct} sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(t.barColor, 0.15), '& .MuiLinearProgress-bar': { bgcolor: t.barColor, borderRadius: 2 } }} />
//
//                                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
//                                             <Typography sx={{ fontSize: '0.72rem', color: t.labelColor }}>this month</Typography>
//                                             {!isLoading && (
//                                                 <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: t.chipBg, color: t.chipColor, fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
//                                                     <PiggyBank size={11} />
//                                                     {chipLabel('Total Saved', budgetStats.totalSaved, budgetStats.totalBudget, metrics.daysRemaining)}
//                                                 </Box>
//                                             )}
//                                         </Box>
//
//                                         {/* Divider + cumulative total */}
//                                         <Divider sx={{ my: 1.25, borderColor: alpha(t.barColor, 0.2) }} />
//                                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                                             <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: t.labelColor, fontWeight: 700 }}>
//                                                 All-Time Saved
//                                             </Typography>
//                                             {isLoading
//                                                 ? <Skeleton variant="text" width={60} height={20} />
//                                                 : <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: t.valueColor, fontVariantNumeric: 'tabular-nums' }}>
//                                                     {fmt(cumulativeSaved)}
//                                                 </Typography>
//                                             }
//                                         </Box>
//                                     </Box>
//                                 </Grid>
//                             );
//                         })()}
//
//                     </Grid>
//                 </Grow>
//
//                 {/* ── Main content ───────────────────────────────────────────── */}
//                 <Grid container spacing={3}>
//                     <Grid item xs={12} lg={8}>
//                         <Stack spacing={3}>
//
//                             {/* ── Budget Overview ───────────────────────────────── */}
//                             <Grow in={animateIn} timeout={700}>
//                                 <Box sx={{
//                                     borderRadius: '16px', overflow: 'hidden',
//                                     border: `1px solid ${alpha(MAROON, 0.15)}`,
//                                     boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}`,
//                                 }}>
//                                     {/* Maroon header */}
//                                     <Box sx={{
//                                         background: `linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)`,
//                                         px: 3, py: 2, position: 'relative', overflow: 'hidden',
//                                     }}>
//                                         <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
//                                         <Box sx={{ position: 'absolute', bottom: -20, right: 50, width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
//                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative' }}>
//                                             <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                                                 <PieChart size={15} color="white" />
//                                             </Box>
//                                             <Box>
//                                                 <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>
//                                                     Budget Overview
//                                                 </Typography>
//                                                 <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>
//                                                     Income, expenses &amp; savings at a glance
//                                                 </Typography>
//                                             </Box>
//                                         </Box>
//                                     </Box>
//                                     {/* White body */}
//                                     <Box sx={{ bgcolor: '#fff', p: 3 }}>
//                                         <BudgetOverview isLoading={isLoading} data={budgetData} />
//                                     </Box>
//                                 </Box>
//                             </Grow>
//
//                             {/* ── Top Spending Categories ───────────────────────── */}
//                             <Grow in={animateIn} timeout={800}>
//                                 <Box sx={{
//                                     borderRadius: '16px', overflow: 'hidden',
//                                     border: `1px solid ${alpha(MAROON, 0.15)}`,
//                                     boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}`,
//                                 }}>
//                                     <Box sx={{
//                                         background: `linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)`,
//                                         px: 3, py: 2, position: 'relative', overflow: 'hidden',
//                                     }}>
//                                         <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
//                                         <Box sx={{ position: 'absolute', bottom: -20, right: 50, width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
//                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative' }}>
//                                             <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                                                 <TrendingUp size={15} color="white" />
//                                             </Box>
//                                             <Box>
//                                                 <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>
//                                                     Top Spending Categories
//                                                 </Typography>
//                                                 <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>
//                                                     Where your money is going this month
//                                                 </Typography>
//                                             </Box>
//                                         </Box>
//                                     </Box>
//                                     <Box sx={{ bgcolor: '#fff', p: 3 }}>
//                                         <TopExpenseCategory isLoading={isLoading} categories={topExpenseCategories} />
//                                     </Box>
//                                 </Box>
//                             </Grow>
//
//                             {/* ── Budget Breakdown ──────────────────────────────── */}
//                             <Grow in={animateIn} timeout={900}>
//                                 <Box sx={{
//                                     borderRadius: '16px', overflow: 'hidden',
//                                     border: `1px solid ${alpha(MAROON, 0.15)}`,
//                                     boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}`,
//                                 }}>
//                                     <Box sx={{
//                                         background: `linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)`,
//                                         px: 3, py: 2, position: 'relative', overflow: 'hidden',
//                                     }}>
//                                         <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
//                                         <Box sx={{ position: 'absolute', bottom: -20, right: 50, width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
//                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative' }}>
//                                             <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                                                 <Award size={15} color="white" />
//                                             </Box>
//                                             <Box>
//                                                 <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>
//                                                     Budget Breakdown
//                                                 </Typography>
//                                                 <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>
//                                                     All categories &amp; their spending progress
//                                                 </Typography>
//                                             </Box>
//                                         </Box>
//                                     </Box>
//                                     <Box sx={{ bgcolor: '#fff', p: 3 }}>
//                                         <BudgetPeriodTable isLoading={isLoading} data={budgetData} />
//                                     </Box>
//                                 </Box>
//                             </Grow>
//
//                         </Stack>
//                     </Grid>
//
//                     <Grid item xs={12} lg={4}>
//                         <Grow in={animateIn} timeout={800}>
//                             <Box sx={{ position: 'sticky', top: 24 }}>
//                                 <DynamicBudgetPanel
//                                     isLoading={isLoading}
//                                     topSpendingCategories={topExpenseCategories}
//                                     overviewCategories={overviewCategories}
//                                     recurringCategories={recurringCategories}
//                                     budgetStats={budgetStats}
//                                     allCategories={budgetCategories}
//                                     categoryTransactionsByDate={categoryTransactionsByDate}
//                                     onUpdateBudgetAmount={async (categoryName, newAmount) => {
//                                         setPendingBudgetUpdate({ categoryName, newAmount });
//                                         setBudgetUpdateConfirmOpen(true);
//                                     }}
//                                     onOptimizeBudget={async (categoryName) => {
//                                         const cat = budgetCategories.find(c => c.categoryName === categoryName);
//                                         const optimized = cat ? Math.max(cat.actualAmount * 1.1, 100) : 100;
//                                         setSnackbarMessage(`Suggested budget for ${categoryName}: $${optimized.toFixed(2)}`);
//                                         setSnackbarSeverity('info');
//                                         setSnackbarOpen(true);
//                                         return optimized;
//                                     }}
//                                 />
//                             </Box>
//                         </Grow>
//                     </Grid>
//                 </Grid>
//             </Container>
//
//             {/* ── Dialogs ────────────────────────────────────────────────────── */}
//
//             <Dialog open={newBudgetDialogOpen} onClose={() => setNewBudgetDialogOpen(false)}
//                     maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2, maxHeight: '90vh' } }}>
//                 <Box sx={{ p: 3 }}>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//                         <Typography variant="h5" sx={{ fontWeight: 700 }}>Create Budget for {new Date().getFullYear()}</Typography>
//                         <IconButton onClick={() => setNewBudgetDialogOpen(false)}><Delete /></IconButton>
//                     </Box>
//                     <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
//                         No budget found for {new Date().getFullYear()}. Let's create one!
//                     </Alert>
//                     <BudgetQuestionnaireForm
//                         onSubmit={async (_data: BudgetQuestions) => {
//                             setNewBudgetDialogOpen(false);
//                             setSnackbarMessage('Budget created successfully! Refreshing…');
//                             setSnackbarSeverity('success');
//                             setSnackbarOpen(true);
//                             await fetchBudgetData(currentMonth);
//                         }}
//                         skipHistoricalData
//                     />
//                 </Box>
//             </Dialog>
//
//             <ManageBudgetsDialog
//                 open={manageBudgetsDialogOpen}
//                 onClose={() => setManageBudgetsDialogOpen(false)}
//                 onBudgetUpdated={async () => {
//                     setManageBudgetsDialogOpen(false);
//                     setSnackbarMessage('Budget updated successfully!');
//                     setSnackbarSeverity('success');
//                     setSnackbarOpen(true);
//                     await fetchBudgetData(currentMonth);
//                 }}
//             />
//
//             <CSVImportDialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}
//                              onImport={async (data) => {
//                                  try {
//                                      setIsLoading(true);
//                                      const result = await uploadService.uploadCsv({ userId, ...data });
//                                      if (!result.success) setError(result.message || 'Import failed');
//                                  } catch (ex) {
//                                      const msg = ex instanceof Error ? ex.message : 'Failed to import CSV file';
//                                      setSnackbarMessage(msg); setSnackbarSeverity('error'); setSnackbarOpen(true);
//                                  } finally {
//                                      setIsLoading(false);
//                                      setImportDialogOpen(false);
//                                  }
//                              }}
//             />
//
//             <Dialog open={budgetUpdateConfirmOpen} onClose={() => setBudgetUpdateConfirmOpen(false)}
//                     maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2, p: 1 } }}>
//                 <Box sx={{ p: 3 }}>
//                     <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Update Budget Amount</Typography>
//                     <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//                         Change the budget for <strong>{pendingBudgetUpdate?.categoryName}</strong> to{' '}
//                         <strong>${pendingBudgetUpdate?.newAmount.toFixed(2)}</strong> for {format(currentMonth, 'MMMM yyyy')}?
//                     </Typography>
//                     <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
//                         <Button variant="outlined" onClick={() => { setBudgetUpdateConfirmOpen(false); setPendingBudgetUpdate(null); }}
//                                 sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600 }}>
//                             Cancel
//                         </Button>
//                         <Button variant="contained"
//                                 sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK } }}
//                                 onClick={async () => {
//                                     if (!pendingBudgetUpdate) return;
//                                     try {
//                                         await budgetCategoryService.updateBudgetCategoryAmount(userId, pendingBudgetUpdate.categoryName, pendingBudgetUpdate.newAmount, startDate, endDate);
//                                         await fetchBudgetData(currentMonth);
//                                         setSnackbarMessage(`Budget for ${pendingBudgetUpdate.categoryName} updated to $${pendingBudgetUpdate.newAmount.toFixed(2)}`);
//                                         setSnackbarSeverity('success');
//                                     } catch {
//                                         setSnackbarMessage('Failed to update budget amount.');
//                                         setSnackbarSeverity('error');
//                                     } finally {
//                                         setSnackbarOpen(true);
//                                         setBudgetUpdateConfirmOpen(false);
//                                         setPendingBudgetUpdate(null);
//                                     }
//                                 }}>
//                             Confirm Update
//                         </Button>
//                     </Box>
//                 </Box>
//             </Dialog>
//
//             <ManageBudgetCategoriesDialog
//                 open={manageCategoriesDialogOpen}
//                 onClose={() => setManageCategoriesDialogOpen(false)}
//                 defaultCategories={budgetCategories.map((c, i) => ({
//                     id: i, name: c.categoryName, budgetedAmount: c.budgetedAmount,
//                     savingsGoal: 0, isDefault: true, isActive: true, isCustom: false,
//                 }))}
//                 customCategories={[]}
//                 onSaveCategories={async (cats, useCustomOnly) => {
//                     try {
//                         await fetchBudgetData(currentMonth);
//                         const dc = cats.filter(c => c.isDefault && c.isActive).length;
//                         const cc = cats.filter(c => c.isCustom).length;
//                         setSnackbarMessage(useCustomOnly ? `Using ${cc} custom categories only` : `Using ${dc} default + ${cc} custom categories`);
//                         setSnackbarSeverity('success');
//                     } catch {
//                         setSnackbarMessage('Failed to save category configuration');
//                         setSnackbarSeverity('error');
//                         throw new Error('Save failed');
//                     } finally { setSnackbarOpen(true); }
//                 }}
//             />
//
//             {/* CSV loading backdrop */}
//             <Box sx={{
//                 display: isLoading && !isBudgetCategoryLoading ? 'flex' : 'none',
//                 position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.65)',
//                 zIndex: 1400, alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
//             }}>
//                 <CircularProgress color="inherit" size={52} sx={{ color: '#fff', mb: 2 }} />
//                 <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>Importing CSV data…</Typography>
//                 <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>Processing your transactions</Typography>
//             </Box>
//
//             <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={() => setSuccessMessage(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
//                 <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%', borderRadius: 2 }}>{successMessage}</Alert>
//             </Snackbar>
//             <Snackbar open={snackBarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
//                 <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%', borderRadius: 2 }}>{snackbarMessage}</Alert>
//             </Snackbar>
//         </Box>
//     );
// };
//
// export default BudgetPage;
