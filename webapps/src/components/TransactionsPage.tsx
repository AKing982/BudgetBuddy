import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Button,
    IconButton,
    Typography,
    Box,
    Checkbox,
    Chip,
    InputAdornment,
    CircularProgress,
    Card,
    Stack,
    Menu,
    MenuItem,
    Divider,
    Avatar,
    Tooltip,
    alpha,
    Fab,
    LinearProgress,
    Grow,
    Container,
    Skeleton,
} from '@mui/material';
import {
    Search,
    ChevronDown,
    Trash2,
    SlidersHorizontal,
    CheckCircle2,
    PlusCircle,
    Calendar,
    XCircle,
    CreditCard,
    ArrowDown,
    ArrowUp,
    TrendingUp,
    TrendingDown,
    Wallet,
    PieChart,
    Plus,
    Tag,
    Filter,
} from 'lucide-react';
import Sidebar from "./Sidebar";
import TransactionService from '../services/TransactionService';
import { Transaction, CSVTransaction } from "../utils/Items";
import CategoryDialog, {CategorySaveData} from "./CategoryDialog";
import CategoryService from "../services/CategoryService";
import UserCategoryService from "../services/UserCategoryService";
import TransactionCategoryService from "../services/TransactionCategoryService";
import transactionRuleService, {TransactionRule} from "../services/TransactionRuleService";
import TransactionRuleService from "../services/TransactionRuleService";
import MonthPickerDialog from "./MonthPickerDialog";
import TransactionRulesDialog from "./TransactionRulesDialog";
import {Sync} from "@mui/icons-material";
import UserService from "../services/UserService";

// ── Design tokens (matching BudgetPage) ───────────────────────────────────────
const MAROON      = '#6b1a1a';
const MAROON_DARK = '#4a1010';
const TEAL        = '#0d9488';

const gradients = {
    maroon: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 50%, #5a1515 100%)`,
    teal:   `linear-gradient(135deg, #0d9488 0%, #0f766e 100%)`,
    blue:   'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    purple: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
};

// ── Stat card themes ───────────────────────────────────────────────────────────
const STAT_THEMES = {
    income: {
        base: '#f0fdf4', border: '#16a34a', valueColor: '#14532d',
        barColor: '#16a34a', chipBg: 'rgba(22,163,74,0.12)', chipColor: '#15803d', labelColor: '#4a7060',
    },
    expense: {
        base: '#fff1f2', border: '#dc2626', valueColor: '#7f1d1d',
        barColor: '#dc2626', chipBg: 'rgba(220,38,38,0.12)', chipColor: '#991b1b', labelColor: '#7a3030',
    },
    balance_pos: {
        base: '#f0f9ff', border: '#0284c7', valueColor: '#0c4a6e',
        barColor: '#0284c7', chipBg: 'rgba(2,132,199,0.12)', chipColor: '#075985', labelColor: '#3a6070',
    },
    balance_neg: {
        base: '#fff1f2', border: '#dc2626', valueColor: '#7f1d1d',
        barColor: '#dc2626', chipBg: 'rgba(220,38,38,0.12)', chipColor: '#991b1b', labelColor: '#7a3030',
    },
    top: {
        base: '#f0f4ff', border: MAROON, valueColor: '#1e1e2e',
        barColor: MAROON, chipBg: 'rgba(107,26,26,0.10)', chipColor: MAROON, labelColor: '#5a5a7a',
    },
};

const categoryBaseColors = [
    MAROON, TEAL, '#3b82f6', '#8b5cf6',
    '#ec4899', '#f97316', '#f59e0b', '#6366f1',
];

// ── Helper: section header (matching BudgetPage maroon header style) ──────────
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
    <Box sx={{
        background: gradients.maroon,
        px: 3, py: 2, position: 'relative', overflow: 'hidden',
    }}>
        <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ position: 'absolute', bottom: -20, right: 50, width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
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

const TransactionsPage: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [csvTransactions, setCsvTransactions] = useState<CSVTransaction[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
    const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
    const [dateRangeAnchorEl, setDateRangeAnchorEl] = useState<null | HTMLElement>(null);
    const [activeFilters, setActiveFilters] = useState<{ categories: string[]; dateRange: string; type: string | null }>({
        categories: [], dateRange: 'Last 30 days', type: null
    });
    const [categoryDialogOpen, setCategoryDialogOpen] = useState<boolean>(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [animateIn, setAnimateIn] = useState(false);
    const [disabledCategories, setDisabledCategories] = useState<string[]>([]);
    const [customMonthDialogOpen, setCustomMonthDialogOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
    const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
    const [transactionRules, setTransactionRules] = useState<TransactionRule[]>([]);
    const [customCategories, setCustomCategories] = useState<string[]>([]);
    const [loadingRules, setLoadingRules] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const categoryService = CategoryService.getInstance();
    const transactionService = TransactionService.getInstance();
    const transactionCategoryService = TransactionCategoryService.getInstance();
    const transactionRuleServiceInst = TransactionRuleService.getInstance();
    const userCategoryService = UserCategoryService.getInstance();
    const userService = UserService.getInstance();

    useEffect(() => {
        document.title = 'Transactions';
        setTimeout(() => setAnimateIn(true), 50);
        return () => { document.title = 'BudgetBuddy'; };
    }, []);

    useEffect(() => {
        const rawUserId = sessionStorage.getItem('userId');
        const userId = Number(rawUserId);
        if (!rawUserId || isNaN(userId) || userId <= 0) {
            alert(`Session Error: Invalid User ID found (${rawUserId}). Please log in again.`);
        }
    }, []);

    const handleSyncTransactions = async () =>
    {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
            const userId = Number(sessionStorage.getItem('userId'));
            const startDateStr = dateRange.startDate.toISOString().split('T')[0];
            const endDateStr   = dateRange.endDate.toISOString().split('T')[0];

            const updated = await transactionCategoryService.reCategorizeCsvTransactions(
                userId, startDateStr, endDateStr
            );

            if (updated.length > 0) {
                // Merge updated categories back into existing csvTransactions state
                setCsvTransactions(prev =>
                    prev.map(csv => {
                        const match = updated.find(u => u.id === csv.id);
                        return match ? { ...csv, category: match.category } : csv;
                    })
                );
            }
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleOpenRulesDialog = async () => {
        setRulesDialogOpen(true);
        setLoadingRules(true);
        try {
            const userId = Number(sessionStorage.getItem('userId'));
            const rules = await transactionRuleServiceInst.getTransactionRulesByUser(userId);
            setTransactionRules(rules);
        } catch (error) {
            console.error('Error fetching transaction rules:', error);
        } finally {
            setLoadingRules(false);
        }
    };

    const handleDeleteRule = async (ruleId: number) => {
        try {} catch (error) { console.error('Error deleting rule:', error); throw error; }
    };

    const handleToggleRule = async (ruleId: number, isActive: boolean) => {
        try {
            const userId = Number(sessionStorage.getItem('userId'));
            await transactionRuleServiceInst.updateTransactionRuleActiveState(ruleId, userId, isActive);
            setTransactionRules(prev => prev.map(rule => rule.id === ruleId ? { ...rule, isActive } : rule));
        } catch (error) {
            console.error('Error toggling rule:', error);
            try {
                const userId = Number(sessionStorage.getItem('userId'));
                const rules = await transactionRuleServiceInst.getTransactionRulesByUser(userId);
                setTransactionRules(rules);
            } catch (refreshError) { console.error('Error refreshing rules:', refreshError); }
            throw error;
        }
    };

    const getDateRangeFilter = (range: string, customMonth?: Date | null): { startDate: Date; endDate: Date } => {
        if (range === 'Custom Month' && customMonth) {
            const year = customMonth.getFullYear();
            const month = customMonth.getMonth();
            return {
                startDate: new Date(year, month, 1, 0, 0, 0, 0),
                endDate: new Date(year, month, new Date(year, month + 1, 0).getDate(), 23, 59, 59, 999),
            };
        }
        const today = new Date();
        let startDate: Date, endDate: Date;
        switch (range) {
            case 'Today':
                startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
                endDate   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
                break;
            case 'Yesterday':
                startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 0, 0, 0, 0);
                endDate   = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 23, 59, 59, 999);
                break;
            case 'Last 7 days':
                startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7, 0, 0, 0, 0);
                endDate   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
                break;
            case 'This month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
                endDate   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
                break;
            case 'Last month': {
                const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                startDate = new Date(lm.getFullYear(), lm.getMonth(), 1, 0, 0, 0, 0);
                endDate   = new Date(lm.getFullYear(), lm.getMonth(), new Date(today.getFullYear(), today.getMonth(), 0).getDate(), 23, 59, 59, 999);
                break;
            }
            case 'This year':
                startDate = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0);
                endDate   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
                break;
            default:
                startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 31, 0, 0, 0, 0);
                endDate   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        }
        return { startDate, endDate };
    };

    const dateRange = useMemo(() => getDateRangeFilter(activeFilters.dateRange, selectedMonth), [activeFilters.dateRange, selectedMonth]);

    useEffect(() => {
        setIsLoading(true);
        const fetchTransactions = async () => {
            try {
                let userId = Number(sessionStorage.getItem('userId'));
                const startDateStr = dateRange.startDate.toISOString().split('T')[0];
                const endDateStr   = dateRange.endDate.toISOString().split('T')[0];
                const hasPlaidCSVSync = await userService.checkUserHasPlaidCSVSyncEnabled(userId);
                const transactionResponse: Transaction[] = await transactionService.fetchTransactionsByUserAndDateRange(userId, startDateStr, endDateStr);
                const csvTransactionResponse = await transactionCategoryService.fetchTransactionCSVByCategoryList(userId, startDateStr, endDateStr);
                const safeT = Array.isArray(transactionResponse) ? transactionResponse : [];
                const safeC = Array.isArray(csvTransactionResponse) ? csvTransactionResponse : [];
                if (hasPlaidCSVSync) {
                    const plaidDates = new Set(safeT.map(t => t.posted || t.date).filter(Boolean));
                    const filtered = safeC.filter(c => c.transactionDate && !plaidDates.has(c.transactionDate));
                    setTransactions(safeT);
                    setCsvTransactions(filtered);
                } else {
                    setTransactions(safeT);
                }
            } catch (error: any) {
                console.error('Error fetching transactions:', error);
                setTransactions([]);
                setCsvTransactions([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTransactions();
    }, [activeFilters]);

    const formatDate = (postedDate: string | null, transactionDate: string) => {
        try {
            const date = new Date(postedDate || transactionDate);
            const today = new Date();
            if (date.toDateString() === today.toDateString()) return 'Today';
            const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
        } catch { return 'N/A'; }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(Math.abs(amount));

    const handleOpenCategoryDialog  = (transaction: Transaction) => { setSelectedTransaction(transaction); setCategoryDialogOpen(true); };
    const handleCloseCategoryDialog = () => { setCategoryDialogOpen(false); setSelectedTransaction(null); };

    const handleSaveCategory = async (data: CategorySaveData) => {
        try {
            const userId = Number(sessionStorage.getItem('userId'));
            const hasAdv = data.advancedMatching && (
                data.advancedMatching.matchByMerchant || data.advancedMatching.matchByDescription ||
                data.advancedMatching.matchByExtendedDescription || data.advancedMatching.matchByAmountRange
            );
            if (hasAdv) {
                const rule: TransactionRule = {
                    userId, categoryName: data.category, priority: 6,
                    isActive: true, amountMin: 0, amountMax: 0, matchCount: 0,
                };
                if (data.advancedMatching?.matchByMerchant && data.advancedMatching.merchantNameMatch)
                    rule.merchantRule = data.advancedMatching.merchantNameMatch;
                if (data.advancedMatching?.matchByDescription && data.advancedMatching.descriptionMatch)
                    rule.descriptionRule = data.advancedMatching.descriptionMatch;
                if (data.advancedMatching?.matchByAmountRange) {
                    if (data.advancedMatching.amountRangeMin !== undefined) rule.amountMin = data.advancedMatching.amountRangeMin;
                    if (data.advancedMatching.amountRangeMax !== undefined) rule.amountMax = data.advancedMatching.amountRangeMax;
                }
                await transactionRuleServiceInst.addTransactionRule(userId, rule);
                await transactionCategoryService.updateTransactionCSVWithCategory(userId, data);
            } else {
                await transactionCategoryService.updateTransactionCSVWithCategory(userId, data);
            }
            setTransactions(prev => prev.map(t => t.transactionId === data.transactionId ? { ...t, categories: [data.category] } : t));
            // @ts-ignore
            if (data.transactionId.startsWith('csv-')) {
                // @ts-ignore
                const csvId = data.transactionId.split('-')[1];
                setCsvTransactions(prev => prev.map(c => c.id?.toString() === csvId ? { ...c, category: data.category } : c));
            }
        } catch (error) { console.error('Error saving category:', error); }
    };

    const combinedTransactions = useMemo(() => {
        const converted: Transaction[] = csvTransactions.filter(c => c.transactionDate).map((c, i) => ({
            transactionId: c.id ? `csv-${c.id}-${i}` : `csv-generated-${i}-${c.transactionDate}-${c.transactionAmount}`,
            amount: c.transactionAmount, date: c.transactionDate!, posted: c.transactionDate,
            name: c.merchantName || c.description || 'Unknown', description: c.description || '',
            authorizedDate: c.transactionDate || null, categoryId: '', extendedDescription: c.extendedDescription || '',
            merchantName: c.merchantName, categories: c.category ? [c.category] : ['Uncategorized'],
            pending: false, logoUrl: null, isoCurrencyCode: '', accountId: '', balance: c.balance,
        }));
        const all = [...transactions, ...converted];
        const seen = new Set<string>();
        return all.filter(t => {
            const key = `${t.date}|${t.amount}|${(t.merchantName || t.name || '').toLowerCase().trim()}`;
            if (seen.has(key)) return false;
            seen.add(key); return true;
        });
    }, [transactions, csvTransactions]);

    const sortedTransactions = useMemo(() => {
        const s = [...combinedTransactions];
        if (sortConfig.key) {
            s.sort((a, b) => {
                if (sortConfig.key === 'date') {
                    const d = new Date(sortConfig.direction === 'asc' ? a.posted || a.date : b.posted || b.date).getTime()
                        - new Date(sortConfig.direction === 'asc' ? b.posted || b.date : a.posted || a.date).getTime();
                    return d;
                }
                if (sortConfig.key === 'amount') return sortConfig.direction === 'asc' ? a.amount - b.amount : b.amount - a.amount;
                if (sortConfig.key === 'name') {
                    const an = a.name || '', bn = b.name || '';
                    return sortConfig.direction === 'asc' ? an.localeCompare(bn) : bn.localeCompare(an);
                }
                if (sortConfig.key === 'category') {
                    const ac = a.categories[0] || '', bc = b.categories[0] || '';
                    return sortConfig.direction === 'asc' ? ac.localeCompare(bc) : bc.localeCompare(ac);
                }
                return 0;
            });
        }
        return s;
    }, [combinedTransactions, sortConfig]);

    const filteredTransactions = useMemo(() => {
        const { startDate, endDate } = getDateRangeFilter(activeFilters.dateRange, selectedMonth);
        const pad = (n: number) => String(n).padStart(2, '0');
        const toDateStr = (val: any): string | null => {
            if (!val) return null;
            if (typeof val === 'string') return val.split('T')[0];
            if (Array.isArray(val)) { const [y, m, d] = val; return `${y}-${pad(m)}-${pad(d)}`; }
            return null;
        };
        const startStr = `${startDate.getFullYear()}-${pad(startDate.getMonth()+1)}-${pad(startDate.getDate())}`;
        const endStr   = `${endDate.getFullYear()}-${pad(endDate.getMonth()+1)}-${pad(endDate.getDate())}`;

        let filtered = sortedTransactions.filter(t => {
            const ds = toDateStr(t.posted) || toDateStr(t.date);
            return ds && ds >= startStr && ds <= endStr;
        });
        if (searchTerm.trim()) {
            const s = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(t =>
                (t.name?.toLowerCase() ?? '').includes(s) ||
                (t.categories[0]?.toLowerCase() ?? '').includes(s) ||
                (t.merchantName?.toLowerCase() ?? '').includes(s) ||
                (t.amount?.toString() ?? '').includes(s) ||
                formatDate(t.posted, t.date).toLowerCase().includes(s)
            );
        }
        if (activeFilters.categories.length > 0)
            filtered = filtered.filter(t => t.categories.some(c => activeFilters.categories.includes(c)));
        if (activeFilters.type) {
            filtered = filtered.filter(t => activeFilters.type === 'income' ? t.amount < 0 : t.amount > 0);
        }
        return filtered;
    }, [sortedTransactions, searchTerm, activeFilters, selectedMonth]);

    const handleSort = (key: string) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };
    const handleRowSelection = (id: string) =>
        setSelectedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const handleSelectAll = () =>
        setSelectedRows(prev => prev.length === filteredTransactions.length ? [] : filteredTransactions.map(t => t.transactionId));

    const handleAddCustomCategory = async (category: string) => {
        setCustomCategories(prev => prev.includes(category) ? prev : [...prev, category]);
        try {
            const userId = Number(localStorage.getItem('userId'));
            await userCategoryService.addCustomUserCategory(userId, category);
        } catch (error) { console.error('Error adding custom category:', error); }
    };

    const handleCategoryFilter = useCallback((category: string) => {
        setActiveFilters(prev => ({
            ...prev,
            categories: prev.categories.includes(category) ? prev.categories.filter(c => c !== category) : [...prev.categories, category],
        }));
    }, []);

    const handleDateRangeChange = (range: string) => {
        setActiveFilters(prev => ({ ...prev, dateRange: range }));
        setDateRangeAnchorEl(null);
    };

    const uniqueCategories = useMemo(() => {
        const s = new Set<string>();
        transactions.forEach(t => t.categories.forEach(c => { if (c) s.add(c); }));
        return Array.from(s);
    }, [transactions]);

    const categoryColors = useMemo(() => {
        const m: Record<string, string> = {};
        uniqueCategories.forEach((c, i) => { m[c] = categoryBaseColors[i % categoryBaseColors.length]; });
        return m;
    }, [uniqueCategories]);

    const transactionStats = useMemo(() => {
        let income = 0, expense = 0, pending = 0, lastPeriodExpense = 0;
        filteredTransactions.forEach(t => {
            if (t.pending) { pending++; return; }
            if (t.amount > 0 && t.categories.includes('Income')) {
                income += Math.abs(t.amount);
            } else {
                expense += t.amount;
            }
        });
        const { startDate, endDate } = getDateRangeFilter(activeFilters.dateRange, selectedMonth);
        const len = endDate.getTime() - startDate.getTime();
        const prevEnd   = new Date(startDate.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - len);
        combinedTransactions.forEach(t => {
            const d = new Date(t.posted || t.date);
            if (d >= prevStart && d <= prevEnd && t.amount > 0) lastPeriodExpense += t.amount;
        });
        const expenseTrend = lastPeriodExpense > 0 ? ((expense - lastPeriodExpense) / lastPeriodExpense) * 100 : (expense > 0 ? 100 : 0);
        return { income, expense, pending, total: filteredTransactions.length, expenseTrend, lastPeriodExpense };
    }, [filteredTransactions, activeFilters.dateRange, selectedMonth, combinedTransactions]);

    const categoryBreakdown = useMemo(() => {
        const b: Record<string, number> = {};
        combinedTransactions.forEach(t => {
            if (t.amount > 0 && t.categories.length > 0) {
                const c = t.categories[0];
                b[c] = (b[c] || 0) + t.amount;
            }
        });
        return Object.entries(b).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount).slice(0, 5);
    }, [combinedTransactions]);

    const balance = transactionStats.income - transactionStats.expense;
    const balanceTheme = balance >= 0 ? STAT_THEMES.balance_pos : STAT_THEMES.balance_neg;

    // Sort icon helper
    const SortIcon = ({ col }: { col: string }) => sortConfig.key !== col ? null : (
        sortConfig.direction === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
    );

    return (
        <Box sx={{
            maxWidth: 'calc(100% - 240px)',
            ml: '240px',
            minHeight: '100vh',
            background: '#f0f2f5',
        }}>
            <Sidebar />

            {/* FAB */}
            <Fab
                sx={{
                    position: 'fixed', bottom: 32, right: 32, width: 56, height: 56,
                    background: gradients.maroon, color: 'white', zIndex: 100,
                    boxShadow: `0 8px 24px ${alpha(MAROON, 0.35)}`,
                    '&:hover': { background: `linear-gradient(135deg, ${MAROON} 0%, ${MAROON_DARK} 100%)`, transform: 'scale(1.05)' },
                    transition: 'all 0.2s ease-in-out',
                }}
            >
                <Plus size={24} />
            </Fab>

            <Box sx={{ p: { xs: 2, md: 3 } }}>

                {/* ── Header ── */}
                <Grow in={animateIn} timeout={400}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                        <Box sx={{ ml: 1 }}>
                            <Box sx={{ width: 28, height: 3, background: MAROON, borderRadius: '2px', mb: 0.75 }} />
                            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#111', letterSpacing: '-0.025em' }}>
                                Transactions
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: '#888', mt: 0.5 }}>
                                Track and manage your financial activity
                            </Typography>
                        </Box>
                    </Box>
                </Grow>

                {/* ── Stat Cards ── */}
                <Grow in={animateIn} timeout={600}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 4 }}>

                        {/* Income */}
                        {(() => {
                            const t = STAT_THEMES.income;
                            const pct = transactionStats.income > 0 ? 100 : 0;
                            return (
                                <Box sx={{ background: t.base, borderRadius: '10px', borderTop: `3px solid ${t.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', p: 2.5, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' } }}>
                                    <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.labelColor, fontWeight: 700, mb: 1 }}>Income</Typography>
                                    {isLoading ? <Skeleton variant="text" width="70%" height={56} /> :
                                        <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: t.valueColor, mb: 0.5 }}>{formatCurrency(transactionStats.income)}</Typography>}
                                    <LinearProgress variant="determinate" value={pct} sx={{ my: 1, height: 6, borderRadius: 4, bgcolor: alpha(t.barColor, 0.15), '& .MuiLinearProgress-bar': { bgcolor: t.barColor, borderRadius: 4 } }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                                        <Typography variant="body2" sx={{ color: t.labelColor }}>{filteredTransactions.filter(t => t.amount > 0 && t.categories.includes('Income')).length} transactions</Typography>
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: t.chipBg, color: t.chipColor, fontSize: '0.7rem', fontWeight: 700 }}>
                                            <TrendingUp size={12} /> Money in
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        })()}

                        {/* Expenses */}
                        {(() => {
                            const t = STAT_THEMES.expense;
                            const pct = transactionStats.income > 0 ? Math.min((transactionStats.expense / transactionStats.income) * 100, 100) : 0;
                            return (
                                <Box sx={{ background: t.base, borderRadius: '10px', borderTop: `3px solid ${t.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', p: 2.5, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' } }}>
                                    <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.labelColor, fontWeight: 700, mb: 1 }}>Expenses</Typography>
                                    {isLoading ? <Skeleton variant="text" width="70%" height={56} /> :
                                        <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: t.valueColor, mb: 0.5 }}>{formatCurrency(transactionStats.expense)}</Typography>}
                                    <LinearProgress variant="determinate" value={pct} sx={{ my: 1, height: 6, borderRadius: 4, bgcolor: alpha(t.barColor, 0.15), '& .MuiLinearProgress-bar': { bgcolor: t.barColor, borderRadius: 4 } }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                                        <Typography variant="body2" sx={{ color: t.labelColor }}>{filteredTransactions.filter(t => !(t.amount > 0 && t.categories.includes('Income'))).length} transactions</Typography>
                                        {!isLoading && (
                                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: t.chipBg, color: t.chipColor, fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                {transactionStats.expenseTrend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                {transactionStats.expenseTrend > 0 ? '+' : ''}{transactionStats.expenseTrend.toFixed(1)}% vs prior
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            );
                        })()}

                        {/* Balance */}
                        {(() => {
                            const t = balanceTheme;
                            const pct = transactionStats.income > 0 ? Math.max((balance / transactionStats.income) * 100, 0) : 0;
                            return (
                                <Box sx={{ background: t.base, borderRadius: '10px', borderTop: `3px solid ${t.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', p: 2.5, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' } }}>
                                    <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.labelColor, fontWeight: 700, mb: 1 }}>Net Balance</Typography>
                                    {isLoading ? <Skeleton variant="text" width="70%" height={56} /> :
                                        <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: t.valueColor, mb: 0.5 }}>{formatCurrency(Math.abs(balance))}</Typography>}
                                    <LinearProgress variant="determinate" value={Math.min(pct, 100)} sx={{ my: 1, height: 6, borderRadius: 4, bgcolor: alpha(t.barColor, 0.15), '& .MuiLinearProgress-bar': { bgcolor: t.barColor, borderRadius: 4 } }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                                        <Typography variant="body2" sx={{ color: t.labelColor }}>Period net flow</Typography>
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: t.chipBg, color: t.chipColor, fontSize: '0.7rem', fontWeight: 700 }}>
                                            <Wallet size={12} /> {balance >= 0 ? 'Positive' : 'Negative'}
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        })()}

                        {/* Top Category */}
                        {(() => {
                            const t = STAT_THEMES.top;
                            return (
                                <Box sx={{ background: t.base, borderRadius: '10px', borderTop: `3px solid ${t.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', p: 2.5, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' } }}>
                                    <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.labelColor, fontWeight: 700, mb: 1 }}>Top Category</Typography>
                                    {isLoading ? <Skeleton variant="text" width="70%" height={56} /> :
                                        <Typography variant="h5" component="div" sx={{ fontWeight: 700, color: t.valueColor, mb: 0.5 }}>{categoryBreakdown[0]?.category || 'N/A'}</Typography>}
                                    <LinearProgress variant="determinate" value={categoryBreakdown[0] ? 100 : 0} sx={{ my: 1, height: 6, borderRadius: 4, bgcolor: alpha(t.barColor, 0.15), '& .MuiLinearProgress-bar': { bgcolor: t.barColor, borderRadius: 4 } }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                                        <Typography variant="body2" sx={{ color: t.labelColor }}>Highest spend</Typography>
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: t.chipBg, color: t.chipColor, fontSize: '0.7rem', fontWeight: 700 }}>
                                            <PieChart size={12} /> {categoryBreakdown[0] ? formatCurrency(categoryBreakdown[0].amount) : '$0.00'}
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        })()}

                    </Box>
                </Grow>

                {/* ── Category Breakdown Section ── */}
                {categoryBreakdown.length > 0 && (
                    <Grow in={animateIn} timeout={700}>
                        <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}`, mb: 3 }}>
                            <SectionHeader icon={<PieChart size={15} color="white" />} title="Top Spending Categories" subtitle="Where your money is going this period" />
                            <Box sx={{ bgcolor: '#fff', p: 3 }}>
                                {categoryBreakdown.map((item, index) => {
                                    const color = categoryColors[item.category] || categoryBaseColors[index % categoryBaseColors.length];
                                    const pct = (item.amount / (categoryBreakdown[0]?.amount || 1)) * 100;
                                    return (
                                        <Box key={item.category} sx={{ mb: index < categoryBreakdown.length - 1 ? 2 : 0 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="body2" fontWeight={600}>{item.category}</Typography>
                                                <Typography variant="body2" fontWeight={700} color="text.primary">{formatCurrency(item.amount)}</Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={pct}
                                                sx={{
                                                    height: 8, borderRadius: 4,
                                                    bgcolor: alpha(color, 0.15),
                                                    '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
                                                }}
                                            />
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                    </Grow>
                )}

                {/* ── Search & Filters ── */}
                <Grow in={animateIn} timeout={800}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
                        <Paper elevation={0} sx={{
                            display: 'flex', alignItems: 'center', borderRadius: 3,
                            p: '4px 16px', flex: 1,
                            border: `1px solid ${alpha('#e0e0e0', 0.8)}`,
                            transition: 'all 0.2s ease-in-out',
                            '&:focus-within': { borderColor: MAROON, boxShadow: `0 0 0 3px ${alpha(MAROON, 0.1)}` },
                        }}>
                            <Search size={20} color="#757575" />
                            <TextField
                                variant="standard"
                                placeholder="Search transactions..."
                                fullWidth
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                InputProps={{
                                    disableUnderline: true,
                                    startAdornment: <InputAdornment position="start"><Box sx={{ width: 8 }} /></InputAdornment>,
                                    endAdornment: searchTerm && (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ mr: -1 }}>
                                                <XCircle size={16} />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiInputBase-input': {
                                        pl: 1, fontSize: '0.95rem',
                                        '&::placeholder': { color: 'text.secondary', opacity: 0.7 },
                                    },
                                }}
                            />
                        </Paper>

                        <Stack direction="row" spacing={1}>
                            <Button
                                variant="outlined"
                                startIcon={<Calendar size={18} />}
                                endIcon={<ChevronDown size={16} />}
                                onClick={e => setDateRangeAnchorEl(e.currentTarget)}
                                sx={{
                                    borderRadius: 2, textTransform: 'none', whiteSpace: 'nowrap',
                                    fontWeight: 600, px: 2.5, py: 1.2, fontSize: '0.95rem',
                                    color: 'text.primary', borderColor: alpha('#e0e0e0', 0.8), bgcolor: 'white',
                                    '&:hover': { borderColor: MAROON, bgcolor: alpha(MAROON, 0.05), color: MAROON },
                                }}
                            >
                                {activeFilters.dateRange === 'Custom Month' && selectedMonth
                                    ? selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                    : activeFilters.dateRange}
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={<SlidersHorizontal size={18} />}
                                onClick={handleOpenRulesDialog}
                                sx={{
                                    borderRadius: 2, textTransform: 'none',
                                    fontWeight: 600, px: 2.5, py: 1.2, fontSize: '0.95rem',
                                    color: 'text.primary', borderColor: alpha('#e0e0e0', 0.8), bgcolor: 'white',
                                    '&:hover': { borderColor: '#8b5cf6', bgcolor: alpha('#8b5cf6', 0.05), color: '#8b5cf6' },
                                }}
                            >
                                Rules
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={<Sync />}
                                onClick={handleSyncTransactions}
                                disabled={isSyncing}
                                sx={{
                                    borderRadius: 2, textTransform: 'none', whiteSpace: 'nowrap',
                                    fontWeight: 600, px: 2.5, py: 1.2, fontSize: '0.95rem',
                                    color: 'text.primary', borderColor: alpha('#e0e0e0', 0.8), bgcolor: 'white',
                                    '&:hover': { borderColor: '#10b981', bgcolor: alpha('#10b981', 0.05), color: '#10b981' },
                                }}
                            >
                                {isSyncing ? 'Syncing...' : 'Sync'}
                            </Button>
                        </Stack>
                    </Box>
                </Grow>

                {/* Active filter chips */}
                {activeFilters.categories.length > 0 && (
                    <Grow in timeout={200}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {activeFilters.categories.map(cat => (
                                <Chip key={cat} label={cat} size="medium" onDelete={() => handleCategoryFilter(cat)}
                                      sx={{
                                          borderRadius: 2, py: 0.5, px: 0.5, fontWeight: 600,
                                          bgcolor: alpha(categoryColors[cat] || MAROON, 0.1),
                                          color: categoryColors[cat] || MAROON,
                                          border: `1px solid ${alpha(categoryColors[cat] || MAROON, 0.2)}`,
                                          '& .MuiChip-deleteIcon': { color: categoryColors[cat] || MAROON },
                                      }} />
                            ))}
                            <Button onClick={() => setActiveFilters(prev => ({ ...prev, categories: [] }))}
                                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', color: 'text.secondary', '&:hover': { bgcolor: alpha('#757575', 0.05) } }}>
                                Clear all
                            </Button>
                        </Box>
                    </Grow>
                )}

                {/* ── Transactions Table Section ── */}
                <Grow in={animateIn} timeout={900}>
                    <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}` }}>
                        <SectionHeader
                            icon={<CreditCard size={15} color="white" />}
                            title={`All Transactions${!isLoading ? ` (${filteredTransactions.length})` : ''}`}
                            subtitle="Sorted by date — click any header to re-sort"
                        />

                        <Box sx={{ bgcolor: '#fff' }}>
                            <TableContainer sx={{
                                borderRadius: 3,
                                overflow: 'auto',
                                maxHeight: 'calc(100vh - 520px)',
                                minHeight: 400,
                                '&::-webkit-scrollbar': { width: '10px', height: '10px' },
                                '&::-webkit-scrollbar-track': { background: alpha('#ccc', 0.1), borderRadius: 2 },
                                '&::-webkit-scrollbar-thumb': { background: alpha(MAROON, 0.3), borderRadius: 2, '&:hover': { background: alpha(MAROON, 0.5) } },
                            }}>
                                <Table stickyHeader sx={{ minWidth: 800 }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox" sx={{ bgcolor: '#ffffff', borderBottom: `2px solid ${alpha('#e0e0e0', 0.8)}`, position: 'sticky', top: 0, zIndex: 10 }}>
                                                <Checkbox
                                                    indeterminate={selectedRows.length > 0 && selectedRows.length < filteredTransactions.length}
                                                    checked={selectedRows.length > 0 && selectedRows.length === filteredTransactions.length}
                                                    onChange={handleSelectAll}
                                                    sx={{ color: alpha('#757575', 0.6), '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: MAROON } }}
                                                />
                                            </TableCell>
                                            {[
                                                { key: 'date',     label: 'Date' },
                                                { key: 'name',     label: 'Merchant' },
                                                { key: 'category', label: 'Category' },
                                                { key: 'amount',   label: 'Amount', align: 'right' as const },
                                                { key: 'balance',  label: 'Balance', align: 'right' as const, noSort: true },
                                            ].map(col => (
                                                <TableCell key={col.key} align={col.align}
                                                           onClick={() => !col.noSort && handleSort(col.key)}
                                                           sx={{
                                                               bgcolor: '#ffffff', fontWeight: 700,
                                                               fontSize: '0.875rem',
                                                               letterSpacing: '0.5px', textTransform: 'uppercase',
                                                               color: sortConfig.key === col.key ? MAROON : 'text.primary',
                                                               borderBottom: `2px solid ${alpha('#e0e0e0', 0.8)}`,
                                                               cursor: col.noSort ? 'default' : 'pointer',
                                                               userSelect: 'none',
                                                               py: 2,
                                                               position: 'sticky', top: 0, zIndex: 10,
                                                               '&:hover': col.noSort ? {} : { color: MAROON, bgcolor: alpha(MAROON, 0.03) },
                                                           }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start' }}>
                                                        {col.label}
                                                        {!col.noSort && <SortIcon col={col.key} />}
                                                    </Box>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                                    <CircularProgress size={42} sx={{ color: MAROON }} />
                                                    <Typography variant="body2" sx={{ mt: 2, color: '#888', fontWeight: 600 }}>
                                                        Loading transactions…
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredTransactions.length > 0 ? (
                                            filteredTransactions.map((t, index) => {
                                                const isIncome = t.amount < 0;
                                                const amountColor = isIncome ? '#16a34a' : MAROON;
                                                const catColor = categoryColors[t.categories[0]] || '#94a3b8';

                                                return (
                                                    <TableRow key={t.transactionId}
                                                              sx={{
                                                                  '&:last-child td, &:last-child th': { border: 0 },
                                                                  '&:hover': { bgcolor: alpha('#f5f5f5', 0.5) },
                                                                  bgcolor: selectedRows.includes(t.transactionId) ? alpha(MAROON, 0.04) : 'background.paper',
                                                                  borderBottom: `1px solid ${alpha('#e0e0e0', 0.5)}`,
                                                                  transition: 'all 0.15s ease-in-out',
                                                              }}
                                                    >
                                                        <TableCell padding="checkbox">
                                                            <Checkbox checked={selectedRows.includes(t.transactionId)} onChange={() => handleRowSelection(t.transactionId)}
                                                                      sx={{ color: alpha('#757575', 0.4), '&.Mui-checked': { color: MAROON } }} />
                                                        </TableCell>

                                                        {/* Date */}
                                                        <TableCell sx={{ py: 2.5 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                <Box sx={{
                                                                    width: 48, height: 48, borderRadius: 2,
                                                                    display: 'flex', flexDirection: 'column',
                                                                    alignItems: 'center', justifyContent: 'center',
                                                                    bgcolor: alpha(MAROON, 0.06),
                                                                    border: `1px solid ${alpha(MAROON, 0.15)}`,
                                                                }}>
                                                                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1, color: MAROON }}>
                                                                        {new Date(t.posted || t.date).getDate()}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: alpha(MAROON, 0.7), fontWeight: 600 }}>
                                                                        {new Date(t.posted || t.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                                                                    </Typography>
                                                                </Box>
                                                                <Box>
                                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                                                        {formatDate(t.posted, t.date)}
                                                                    </Typography>
                                                                    {t.pending && (
                                                                        <Chip label="Pending" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b', mt: 0.5 }} />
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        </TableCell>

                                                        {/* Merchant */}
                                                        <TableCell sx={{ py: 2.5 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                {t.logoUrl ? (
                                                                    <Box sx={{ width: 40, height: 40, borderRadius: 2, overflow: 'hidden', border: `1px solid ${alpha('#e0e0e0', 1)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'white', flexShrink: 0 }}>
                                                                        <img src={t.logoUrl} alt={t.merchantName || 'Logo'} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                                    </Box>
                                                                ) : (
                                                                    <Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(catColor, 0.1), border: `1px solid ${alpha(catColor, 0.2)}`, fontWeight: 700, fontSize: '1rem', color: catColor, flexShrink: 0 }}>
                                                                        {(t.merchantName || t.name || 'T').charAt(0).toUpperCase()}
                                                                    </Box>
                                                                )}
                                                                <Box>
                                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.25 }}>{t.name}</Typography>
                                                                    {t.merchantName && t.merchantName !== t.name && (
                                                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{t.merchantName}</Typography>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        </TableCell>

                                                        {/* Category */}
                                                        <TableCell sx={{ py: 2.5 }}>
                                                            <Chip
                                                                label={t.categories[0] || 'Uncategorized'}
                                                                size="small"
                                                                onClick={() => handleOpenCategoryDialog(t)}
                                                                sx={{
                                                                    borderRadius: 2, fontWeight: 600, fontSize: '0.75rem', height: 28,
                                                                    bgcolor: alpha(catColor, 0.1),
                                                                    color: catColor,
                                                                    border: `1px solid ${alpha(catColor, 0.3)}`,
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease-in-out',
                                                                    '&:hover': { bgcolor: alpha(catColor, 0.2), transform: 'translateY(-1px)', boxShadow: `0 2px 8px ${alpha(catColor, 0.25)}` },
                                                                }}
                                                            />
                                                        </TableCell>

                                                        {/* Amount */}
                                                        <TableCell align="right" sx={{ py: 2.5 }}>
                                                            <Box sx={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 0.75,
                                                                px: 1.5, py: 0.75, borderRadius: 2,
                                                                bgcolor: isIncome ? alpha('#0d9488', 0.08) : alpha(MAROON, 0.08),
                                                                border: `1px solid ${isIncome ? alpha('#0d9488', 0.2) : alpha(MAROON, 0.2)}`,
                                                            }}>
                                                                {isIncome
                                                                    ? <ArrowDown size={14} color="#0d9488" />
                                                                    : <ArrowUp   size={14} color={MAROON} />}
                                                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem', color: amountColor }}>
                                                                    {formatCurrency(Math.abs(t.amount))}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>

                                                        {/* Balance */}
                                                        <TableCell align="right" sx={{ py: 2.5 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem', color: (t.balance ?? 0) >= 0 ? '#0d9488' : MAROON }}>
                                                                {formatCurrency(Math.abs(t.balance ?? 0))}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                                    <Box sx={{ maxWidth: 360, mx: 'auto', textAlign: 'center' }}>
                                                        <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: alpha(MAROON, 0.07), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5, border: `2px solid ${alpha(MAROON, 0.15)}` }}>
                                                            <Search size={32} color={MAROON} />
                                                        </Box>
                                                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#111', mb: 0.75 }}>No transactions found</Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                                                            {searchTerm ? `No results for "${searchTerm}"` : 'Try adjusting your filters or add a new transaction'}
                                                        </Typography>
                                                        {searchTerm ? (
                                                            <Button variant="outlined" size="small" startIcon={<XCircle size={14} />} onClick={() => setSearchTerm('')}
                                                                    sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, borderColor: MAROON, color: MAROON, '&:hover': { bgcolor: alpha(MAROON, 0.05) } }}>
                                                                Clear search
                                                            </Button>
                                                        ) : (
                                                            <Button variant="contained" size="small" startIcon={<PlusCircle size={14} />}
                                                                    sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, background: gradients.maroon, boxShadow: `0 4px 14px ${alpha(MAROON, 0.3)}` }}>
                                                                Add transaction
                                                            </Button>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Box>
                </Grow>

            </Box>

            {/* ── Bulk action bar ── */}
            {selectedRows.length > 0 && (
                <Grow in timeout={300}>
                    <Paper elevation={6} sx={{
                        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                        py: 1.25, px: 2.5, borderRadius: '10px', display: 'flex', alignItems: 'center',
                        zIndex: 1100, background: gradients.maroon, color: 'white',
                        boxShadow: `0 8px 32px ${alpha(MAROON, 0.35)}`,
                        border: `1px solid ${alpha(MAROON, 0.2)}`, gap: 2,
                    }}>
                        <Typography sx={{ fontWeight: 700, mr: 3 }}>
                            {selectedRows.length} {selectedRows.length === 1 ? 'item' : 'items'} selected
                        </Typography>
                        <Button variant="contained" size="small" startIcon={<Trash2 size={16} />}
                                sx={{ mr: 1.5, textTransform: 'none', borderRadius: 2, px: 2, fontWeight: 600, bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}>
                            Delete
                        </Button>
                        <Button variant="contained" size="small" startIcon={<SlidersHorizontal size={16} />}
                                sx={{ mr: 1.5, textTransform: 'none', borderRadius: 2, px: 2, fontWeight: 600, bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                            Categorize
                        </Button>
                        <Button size="small" onClick={() => setSelectedRows([])}
                                sx={{ textTransform: 'none', fontWeight: 600, color: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: 'white' } }}>
                            Cancel
                        </Button>
                    </Paper>
                </Grow>
            )}

            {/* ── Date range menu ── */}
            <Menu anchorEl={dateRangeAnchorEl} open={Boolean(dateRangeAnchorEl)} onClose={() => setDateRangeAnchorEl(null)}
                  PaperProps={{ elevation: 3, sx: { width: 210, mt: 1.5, borderRadius: '10px', py: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' } }}>
                {['Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'This month', 'Last month', 'This year'].map(range => (
                    <MenuItem key={range} onClick={() => handleDateRangeChange(range)} selected={activeFilters.dateRange === range}
                              sx={{ py: 1.1, mx: 1, borderRadius: '6px', fontWeight: 600, fontSize: '0.825rem', '&.Mui-selected': { bgcolor: alpha(MAROON, 0.08), color: MAROON, '&:hover': { bgcolor: alpha(MAROON, 0.13) } } }}>
                        {range}
                    </MenuItem>
                ))}
                <Divider sx={{ my: 0.75 }} />
                <MenuItem onClick={() => { setCustomMonthDialogOpen(true); setDateRangeAnchorEl(null); }} selected={activeFilters.dateRange === 'Custom Month'}
                          sx={{ py: 1.1, mx: 1, borderRadius: '6px', fontWeight: 600, fontSize: '0.825rem', '&.Mui-selected': { bgcolor: alpha(MAROON, 0.08), color: MAROON } }}>
                    <Calendar size={14} style={{ marginRight: 8 }} /> Select Month
                </MenuItem>
            </Menu>

            <MonthPickerDialog
                open={customMonthDialogOpen}
                onClose={() => setCustomMonthDialogOpen(false)}
                onSelect={(month: Date) => {
                    setSelectedMonth(month);
                    setActiveFilters(prev => ({ ...prev, dateRange: 'Custom Month' }));
                    setCustomMonthDialogOpen(false);
                }}
                currentMonth={selectedMonth}
            />

            {selectedTransaction && (
                <CategoryDialog
                    open={categoryDialogOpen}
                    onClose={handleCloseCategoryDialog}
                    currentCategory={selectedTransaction.categories[0] || ''}
                    transactionId={selectedTransaction.transactionId}
                    merchantName={selectedTransaction.merchantName || selectedTransaction.name}
                    description={selectedTransaction.description}
                    extendedDescription={selectedTransaction.extendedDescription || ''}
                    amount={selectedTransaction.amount}
                    availableCategories={uniqueCategories}
                    onSave={handleSaveCategory}
                    onToggleCategory={async (cat, enabled) => {
                        if (enabled) setDisabledCategories(prev => prev.filter(c => c !== cat));
                        else setDisabledCategories(prev => [...prev, cat]);
                    }}
                    onAddCustomCategory={handleAddCustomCategory}
                    onDeleteCustomCategory={async (cat) => {
                        setCustomCategories(prev => prev.filter(c => c !== cat));
                        setDisabledCategories(prev => prev.filter(c => c !== cat));
                    }}
                    onResetDisabledCategories={async () => setDisabledCategories([])}
                />
            )}

            <TransactionRulesDialog
                open={rulesDialogOpen}
                onClose={() => setRulesDialogOpen(false)}
                rules={transactionRules}
                loading={loadingRules}
                onDeleteRule={handleDeleteRule}
                onToggleRule={handleToggleRule}
            />
        </Box>
    );
};

export default TransactionsPage;
// import React, {useCallback, useEffect, useMemo, useState} from 'react';
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableContainer,
//     TableHead,
//     TableRow,
//     Paper,
//     TextField,
//     Button,
//     IconButton,
//     Typography,
//     Box,
//     Checkbox,
//     Chip,
//     InputAdornment,
//     CircularProgress,
//     Card,
//     Stack,
//     Menu,
//     MenuItem,
//     Divider,
//     Avatar,
//     Badge as MuiBadge,
//     Tooltip,
//     alpha,
//     Fab,
//     LinearProgress,
//     Grow
// } from '@mui/material';
// import {
//     Search,
//     ArrowDownToLine,
//     ChevronDown,
//     Edit,
//     Trash2,
//     Filter,
//     SlidersHorizontal,
//     Download,
//     CheckCircle2,
//     PlusCircle,
//     Calendar,
//     XCircle,
//     CreditCard,
//     DollarSign,
//     Clock,
//     ArrowDown,
//     ArrowUp,
//     TrendingUp,
//     TrendingDown,
//     Wallet,
//     PieChart,
//     Plus
// } from 'lucide-react';
// import Sidebar from "./Sidebar";
// import TransactionService from '../services/TransactionService';
// import { Transaction, CSVTransaction } from "../utils/Items";
// import CategoryDialog, {CategorySaveData} from "./CategoryDialog";
// import CategoryService from "../services/CategoryService";
// import UserCategoryService from "../services/UserCategoryService";
// import TransactionCategoryService from "../services/TransactionCategoryService";
// import transactionRuleService, {TransactionRule} from "../services/TransactionRuleService";
// import TransactionRuleService from "../services/TransactionRuleService";
// import MonthPickerDialog from "./MonthPickerDialog";
// import TransactionRulesDialog from "./TransactionRulesDialog";
// import {Sync} from "@mui/icons-material";
// import UserService from "../services/UserService";
//
// const maroonColor = '#800000';
// const tealColor = '#0d9488';
//
// // Custom gradient backgrounds
// const gradients = {
//     maroon: `linear-gradient(135deg, ${maroonColor} 0%, #a00000 100%)`,
//     teal: `linear-gradient(135deg, ${tealColor} 0%, #0f766e 100%)`,
//     blue: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
//     purple: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
// };
//
// const TransactionsPage: React.FC = () => {
//     const [transactions, setTransactions] = useState<Transaction[]>([]);
//     const [csvTransactions, setCsvTransactions] = useState<CSVTransaction[]>([]);
//     const [isLoading, setIsLoading] = useState<boolean>(false);
//     const [searchTerm, setSearchTerm] = useState<string>('');
//     const [selectedRows, setSelectedRows] = useState<string[]>([]);
//     const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({
//         key: 'date',
//         direction: 'desc'
//     });
//     const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
//     const [dateRangeAnchorEl, setDateRangeAnchorEl] = useState<null | HTMLElement>(null);
//     const [activeFilters, setActiveFilters] = useState<{
//         categories: string[];
//         dateRange: string;
//         type: string | null;
//     }>({
//         categories: [],
//         dateRange: 'Last 30 days',
//         type: null
//     });
//     const [categoryDialogOpen, setCategoryDialogOpen] = useState<boolean>(false);
//     const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
//     const [animateIn, setAnimateIn] = useState(false);
//     const [disabledCategories, setDisabledCategories] = useState<string[]>([]);
//     const [customMonthDialogOpen, setCustomMonthDialogOpen] = useState(false);
//     const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
//     const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
//     const [transactionRules, setTransactionRules] = useState<TransactionRule[]>([]);
//     const [customCategories, setCustomCategories] = useState<string[]>([]);
//     const [loadingRules, setLoadingRules] = useState(false);
//     const [isSyncing, setIsSyncing] = useState(false);
//
//     const categoryService = CategoryService.getInstance();
//     const transactionService = TransactionService.getInstance();
//     const transactionCategoryService = TransactionCategoryService.getInstance();
//     const transactionRuleService = TransactionRuleService.getInstance();
//     const userCategoryService = UserCategoryService.getInstance();
//     const userService = UserService.getInstance();
//
//     useEffect(() => {
//         document.title = 'Transactions';
//         setTimeout(() => setAnimateIn(true), 50);
//         return () => {
//             document.title = 'BudgetBuddy';
//         }
//     }, []);
//
//     useEffect(() => {
//         const rawUserId = sessionStorage.getItem('userId');
//         const userId = Number(rawUserId);
//
//         if (!rawUserId || isNaN(userId) || userId <= 0) {
//             alert(`Session Error: Invalid User ID found (${rawUserId}).
//                Please log in again.
//                Browser: ${navigator.userAgent}`);
//         }
//     }, []);
//
//     const handleSyncTransactions = () => {
//
//     }
//
//     const handleOpenRulesDialog = async () => {
//         setRulesDialogOpen(true);
//         setLoadingRules(true);
//
//         try {
//             const userId = Number(sessionStorage.getItem('userId'));
//             const rules = await transactionRuleService.getTransactionRulesByUser(userId);
//             setTransactionRules(rules);
//         } catch (error) {
//             console.error('Error fetching transaction rules:', error);
//         } finally {
//             setLoadingRules(false);
//         }
//     };
//
//     const handleDeleteRule = async (ruleId: number) => {
//         try {
//             // await transactionRuleService.deleteTransactionRule(userId, ruleId);
//             // const rules = await transactionRuleService.getTransactionRulesByUserId(userId);
//             // setTransactionRules(rules);
//         } catch (error) {
//             console.error('Error deleting rule:', error);
//             throw error;
//         }
//     };
//
//     const handleToggleRule = async (ruleId: number, isActive: boolean) => {
//         try {
//             const userId = Number(sessionStorage.getItem('userId'));
//             await transactionRuleService.updateTransactionRuleActiveState(ruleId, userId, isActive);
//
//             setTransactionRules(prev =>
//                 prev.map(rule =>
//                     rule.id === ruleId
//                         ? { ...rule, isActive }
//                         : rule
//                 )
//             );
//         } catch (error) {
//             console.error('Error toggling rule:', error);
//
//             try {
//                 const userId = Number(sessionStorage.getItem('userId'));
//                 const rules = await transactionRuleService.getTransactionRulesByUser(userId);
//                 setTransactionRules(rules);
//             } catch (refreshError) {
//                 console.error('Error refreshing rules:', refreshError);
//             }
//
//             throw error;
//         }
//     };
//
//     const handleCloseRulesDialog = () => {
//         setRulesDialogOpen(false);
//     };
//
//     const getDateRangeFilter = (range: string, customMonth?: Date | null) : {startDate: Date; endDate: Date} => {
//         if (range === 'Custom Month' && customMonth) {
//             const year = customMonth.getFullYear();
//             const month = customMonth.getMonth();
//             const startDate = new Date(year, month, 1, 0, 0, 0, 0);
//             const lastDay = new Date(year, month + 1, 0).getDate();
//             const endDate = new Date(year, month, lastDay, 23, 59, 59, 999);
//
//             return { startDate, endDate };
//         }
//
//         const today = new Date();
//         let startDate: Date;
//         let endDate: Date;
//
//         switch (range) {
//             case 'Today':
//                 startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
//                 endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
//                 break;
//             case 'Yesterday':
//                 startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 0, 0, 0, 0);
//                 endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 23, 59, 59, 999);
//                 break;
//             case 'Last 7 days':
//                 startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7, 0, 0, 0, 0);
//                 endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
//                 break;
//             case 'Last 30 days':
//                 startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 31, 0, 0, 0, 0);
//                 endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
//                 break;
//             case 'This month':
//                 startDate = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
//                 endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
//                 break;
//             case 'Last month':
//                 const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
//                 startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1, 0, 0, 0, 0);
//                 const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
//                 endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastDayOfLastMonth, 23, 59, 59, 999);
//                 break;
//             case 'This year':
//                 startDate = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0);
//                 endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
//                 break;
//             default:
//                 startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30, 0, 0, 0, 0);
//                 endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
//         }
//
//         return { startDate, endDate };
//     };
//
//     const dateRange = useMemo(() => {
//         return getDateRangeFilter(activeFilters.dateRange, selectedMonth);
//     }, [activeFilters.dateRange, selectedMonth]);
//
//     useEffect(() => {
//         setIsLoading(true);
//         const fetchTransactions = async() => {
//             try {
//                 const transactionService = TransactionService.getInstance();
//                 let userId = Number(sessionStorage.getItem('userId'));
//
//                 const startDateStr = dateRange.startDate.toISOString().split('T')[0];
//                 console.log('Start Date:', startDateStr);
//                 const endDateStr = dateRange.endDate.toISOString().split('T')[0];
//                 console.log('End Date:', endDateStr);
//
//                 const hasPlaidCSVSync = await userService.checkUserHasPlaidCSVSyncEnabled(userId);
//                 const transactionResponse: Transaction[] = await transactionService.fetchTransactionsByUserAndDateRange(userId, startDateStr, endDateStr);
//                 const csvTransactionResponse = await transactionCategoryService.fetchTransactionCSVByCategoryList(userId, startDateStr, endDateStr);
//                 console.log('CSV Response:', csvTransactionResponse);
//                 const safeTransactionResponse = Array.isArray(transactionResponse) ? transactionResponse : [];
//                 const safeCsvTransactionResponse = Array.isArray(csvTransactionResponse) ? csvTransactionResponse : [];
//                 if(hasPlaidCSVSync) {
//                     const plaidTransactionDates = new Set(
//                         safeTransactionResponse.map(transaction =>
//                             transaction.posted || transaction.date
//                         ).filter(date => date)
//                     );
//
//                     const filteredCSVTransactions = safeCsvTransactionResponse.filter(csvTransaction => {
//                         const csvDate = csvTransaction.transactionDate;
//                         return csvDate && !plaidTransactionDates.has(csvDate);
//                     });
//                     console.log('Filtered CSV Transactions:', filteredCSVTransactions);
//                     console.log('Filtered CSV Transactions Count:', filteredCSVTransactions.length);
//
//                     setTransactions(safeTransactionResponse);
//                     setCsvTransactions(filteredCSVTransactions);
//                     console.log('CSV Transactions:', csvTransactions);
//                 } else {
//                     setTransactions(safeTransactionResponse);
//                 }
//             } catch(error: any) {
//                 console.error('Error fetching transactions:', error);
//                 setTransactions([]);
//                 setCsvTransactions([]);
//                 if (window.navigator.userAgent.includes('iPad')) {
//                     alert("API Error: " + error.message);
//                 }
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//
//         fetchTransactions();
//     }, [activeFilters]);
//
//     const handleSearchTermChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//         setSearchTerm(event.target.value);
//     };
//
//     const formatDate = (postedDate: string | null, transactionDate: string) => {
//         try {
//             const dateToFormat = postedDate || transactionDate;
//             const date = new Date(dateToFormat);
//             const today = new Date();
//
//             if (date.toDateString() === today.toDateString()) {
//                 return 'Today';
//             }
//
//             const yesterday = new Date();
//             yesterday.setDate(yesterday.getDate() - 1);
//             if (date.toDateString() === yesterday.toDateString()) {
//                 return 'Yesterday';
//             }
//
//             return date.toLocaleDateString('en-US', {
//                 month: 'short',
//                 day: 'numeric',
//                 year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
//             });
//         } catch (error) {
//             return 'N/A';
//         }
//     };
//
//     const formatCurrency = (amount: number) => {
//         return new Intl.NumberFormat('en-US', {
//             style: 'currency',
//             currency: 'USD',
//             minimumFractionDigits: 2
//         }).format(Math.abs(amount));
//     };
//
//     const handleOpenCategoryDialog = (transaction: Transaction) => {
//         setSelectedTransaction(transaction);
//         setCategoryDialogOpen(true);
//     };
//
//     const handleCloseCategoryDialog = () => {
//         setCategoryDialogOpen(false);
//         setSelectedTransaction(null);
//     };
//
//     const handleSaveCategory = async (data: CategorySaveData) => {
//         try {
//             const userId = Number(sessionStorage.getItem('userId'));
//
//             const hasAdvancedMatching = data.advancedMatching && (
//                 data.advancedMatching.matchByMerchant ||
//                 data.advancedMatching.matchByDescription ||
//                 data.advancedMatching.matchByExtendedDescription ||
//                 data.advancedMatching.matchByAmountRange
//             );
//
//             if (hasAdvancedMatching) {
//                 const matchByMerchant = data.advancedMatching?.matchByMerchant || false;
//                 const matchByDescription = data.advancedMatching?.matchByDescription || false;
//                 const matchByExtendedDescription = data.advancedMatching?.matchByExtendedDescription || false;
//                 const matchByAmountRange = data.advancedMatching?.matchByAmountRange || false;
//                 let priority = 6;
//
//                 if(matchByMerchant && matchByDescription && matchByExtendedDescription && matchByAmountRange) {
//                     priority = 1;
//                 } else if(matchByMerchant && matchByAmountRange){
//                     priority = 2;
//                 }else if(matchByMerchant && matchByAmountRange && data.advancedMatching?.amountRangeMin !== undefined){
//                     priority = 3;
//                 }else if(matchByMerchant && matchByAmountRange && data.advancedMatching?.amountRangeMax !== undefined){
//                     priority = 4;
//                 }else if(matchByDescription && matchByMerchant){
//                     priority = 5;
//                 }else if(matchByMerchant){
//                     priority = 6;
//                 }
//
//                 const transactionRule: TransactionRule = {
//                     userId: userId,
//                     categoryName: data.category,
//                     priority: priority,
//                     isActive: true,
//                     amountMin: 0,
//                     amountMax: 0,
//                     matchCount: 0
//                 };
//
//                 if (data.advancedMatching?.matchByMerchant && data.advancedMatching.merchantNameMatch) {
//                     transactionRule.merchantRule = data.advancedMatching.merchantNameMatch;
//                 }
//
//                 if (data.advancedMatching?.matchByDescription && data.advancedMatching.descriptionMatch) {
//                     transactionRule.descriptionRule = data.advancedMatching.descriptionMatch;
//                 }
//
//                 if (data.advancedMatching?.matchByExtendedDescription && data.advancedMatching.extendedDescriptionMatch) {
//                     transactionRule.extendedDescriptionRule = data.advancedMatching.extendedDescriptionMatch;
//                 }
//
//                 if (data.advancedMatching?.matchByAmountRange) {
//                     if (data.advancedMatching.amountRangeMin !== undefined) {
//                         transactionRule.amountMin = data.advancedMatching.amountRangeMin;
//                     }
//                     if (data.advancedMatching.amountRangeMax !== undefined) {
//                         transactionRule.amountMax = data.advancedMatching.amountRangeMax;
//                     }
//                 }
//
//                 const createdRule = await transactionRuleService.addTransactionRule(userId, transactionRule);
//                 const transactionResponse = await transactionCategoryService.updateTransactionCSVWithCategory(userId, data);
//             } else {
//                 const transactionResponse = await transactionCategoryService.updateTransactionCSVWithCategory(userId, data);
//             }
//
//             setTransactions(prevTransactions =>
//                 prevTransactions.map(transaction =>
//                     transaction.transactionId === data.transactionId
//                         ? { ...transaction, categories: [data.category] }
//                         : transaction
//                 )
//             );
//
//             // @ts-ignore
//             if (data.transactionId.startsWith('csv-')) {
//                 // @ts-ignore
//                 const csvId = data.transactionId.split('-')[1];
//
//                 setCsvTransactions(prevCsvTransactions =>
//                     prevCsvTransactions.map(csvTx =>
//                         csvTx.id?.toString() === csvId
//                             ? { ...csvTx, category: data.category }
//                             : csvTx
//                     )
//                 );
//             }
//         } catch (error) {
//             console.error('Error saving category:', error);
//         }
//     };
//
//     const combinedTransactions = useMemo(() => {
//         const convertedCsvTransactions: Transaction[] = csvTransactions
//             .filter(csv => csv.transactionDate)
//             .map((csv, index) => ({
//                 transactionId: csv.id
//                     ? `csv-${csv.id}-${index}`
//                     : `csv-generated-${index}-${csv.transactionDate}-${csv.transactionAmount}`,
//                 amount: csv.transactionAmount,
//                 date: csv.transactionDate!,
//                 posted: csv.transactionDate,
//                 name: csv.merchantName || csv.description || 'Unknown',
//                 description: csv.description || '',
//                 authorizedDate: csv.transactionDate || null,
//                 categoryId: '',
//                 extendedDescription: csv.extendedDescription || '',
//                 merchantName: csv.merchantName,
//                 categories: csv.category ? [csv.category] : ['Uncategorized'],
//                 pending: false,
//                 logoUrl: null,
//                 isoCurrencyCode: '',
//                 accountId: '',
//                 balance: csv.balance
//             }));
//
//         const allTransactions = [...transactions, ...convertedCsvTransactions];
//         const seen = new Set<string>();
//         return allTransactions.filter(transaction => {
//             const key = `${transaction.date}|${transaction.amount}|${(transaction.merchantName || transaction.name || '').toLowerCase().trim()}`;
//
//             if (seen.has(key)) {
//                 return false;
//             }
//
//             seen.add(key);
//             return true;
//         });
//     }, [transactions, csvTransactions]);
//
//     const sortedTransactions = useMemo(() => {
//         const sortableTransactions = [...combinedTransactions];
//         if (sortConfig.key !== null) {
//             sortableTransactions.sort((a, b) => {
//                 if (sortConfig.key === 'date') {
//                     const aDate = a.posted || a.date;
//                     const bDate = b.posted || b.date;
//                     if (sortConfig.direction === 'asc') {
//                         return new Date(aDate).getTime() - new Date(bDate).getTime();
//                     } else {
//                         return new Date(bDate).getTime() - new Date(aDate).getTime();
//                     }
//                 } else if (sortConfig.key === 'amount') {
//                     if (sortConfig.direction === 'asc') {
//                         return a.amount - b.amount;
//                     } else {
//                         return b.amount - a.amount;
//                     }
//                 } else if (sortConfig.key === 'name') {
//                     const aName = a.name || '';
//                     const bName = b.name || '';
//                     if (sortConfig.direction === 'asc') {
//                         return aName.localeCompare(bName);
//                     } else {
//                         return bName.localeCompare(aName);
//                     }
//                 } else if (sortConfig.key === 'category') {
//                     const aCategory = a.categories[0] || '';
//                     const bCategory = b.categories[0] || '';
//                     if (sortConfig.direction === 'asc') {
//                         return aCategory.localeCompare(bCategory);
//                     } else {
//                         return bCategory.localeCompare(aCategory);
//                     }
//                 }
//                 return 0;
//             });
//         }
//         return sortableTransactions;
//     }, [combinedTransactions, sortConfig]);
//
//     const handleToggleCategory = async (category: string, enabled: boolean) => {
//         try {
//             if(enabled){
//                 const updated = disabledCategories.filter(cat => cat !== category);
//                 setDisabledCategories(updated);
//             }else{
//                 const updated = [...disabledCategories, category];
//                 setDisabledCategories(updated);
//             }
//         }catch(error){
//             console.error('Error toggling category:', error);
//         }
//     }
//
//     const handleDeleteCustomCategory = async (category: string) => {
//         try {
//             setCustomCategories(prev => prev.filter(cat => cat !== category));
//             setDisabledCategories(prev => prev.filter(cat => cat !== category));
//         } catch (error) {
//             console.error('Error deleting custom category:', error);
//         }
//     };
//
//     const filteredTransactions = useMemo(() => {
//         let filtered = sortedTransactions;
//         console.log('raw sample:', JSON.stringify(sortedTransactions[0]?.posted), JSON.stringify(sortedTransactions[0]?.date));
//
//         console.log('Filtered Transactions:', filtered);
//         console.log('Filtered Transactions Count:', filtered.length);
//
//         const {startDate, endDate} = getDateRangeFilter(activeFilters.dateRange, selectedMonth);
//         console.log('Filter startDate:', startDate.toISOString(), 'endDate:', endDate.toISOString());
//
//         console.log('after date filter:', filtered.length);
//         const pad = (n: number) => String(n).padStart(2, '0');
//         const toDateStr = (val: any): string | null => {
//             if (!val) return null;
//             if (typeof val === 'string') return val.split('T')[0];
//             if (Array.isArray(val)) {
//                 const [y, m, d] = val;
//                 return `${y}-${pad(m)}-${pad(d)}`;
//             }
//             return null;
//         };
//
//         const startStr = `${startDate.getFullYear()}-${pad(startDate.getMonth()+1)}-${pad(startDate.getDate())}`;
//         const endStr = `${endDate.getFullYear()}-${pad(endDate.getMonth()+1)}-${pad(endDate.getDate())}`;
//
//         filtered = filtered.filter(transaction => {
//             const dateStr = toDateStr(transaction.posted) || toDateStr(transaction.date);
//             if (!dateStr) return false;
//             return dateStr >= startStr && dateStr <= endStr;
//         });
//         if (searchTerm.trim()) {
//             const searchTermLowerCase = searchTerm.toLowerCase().trim();
//             filtered = filtered.filter((transaction) => {
//                 const name = transaction.name?.toLowerCase() ?? '';
//                 const category = transaction.categories[0]?.toLowerCase() ?? '';
//                 const merchantName = transaction.merchantName?.toLowerCase() ?? '';
//                 const amount = transaction.amount?.toString() ?? '';
//                 const date = formatDate(transaction.posted, transaction.date).toLowerCase();
//
//                 return name.includes(searchTermLowerCase) ||
//                     category.includes(searchTermLowerCase) ||
//                     merchantName.includes(searchTermLowerCase) ||
//                     amount.includes(searchTermLowerCase) ||
//                     date.includes(searchTermLowerCase);
//             });
//         }
//
//         if (activeFilters.categories.length > 0) {
//             filtered = filtered.filter(transaction =>
//                 transaction.categories.some(category =>
//                     activeFilters.categories.includes(category)
//                 )
//             );
//         }
//
//         if (activeFilters.type) {
//             filtered = filtered.filter(transaction => {
//                 if (activeFilters.type === 'income') {
//                     return transaction.amount < 0;
//                 } else if (activeFilters.type === 'expense') {
//                     return transaction.amount > 0;
//                 }
//                 return true;
//             });
//         }
//
//         return filtered;
//     }, [sortedTransactions, searchTerm, activeFilters]);
//
//     const handleSort = (key: string) => {
//         let direction: 'asc' | 'desc' = 'asc';
//         if (sortConfig.key === key && sortConfig.direction === 'asc') {
//             direction = 'desc';
//         }
//         setSortConfig({ key, direction });
//     };
//
//     const handleRowSelection = (transactionId: string) => {
//         if (selectedRows.includes(transactionId)) {
//             setSelectedRows(selectedRows.filter(id => id !== transactionId));
//         } else {
//             setSelectedRows([...selectedRows, transactionId]);
//         }
//     };
//
//     const handleSelectAll = () => {
//         if (selectedRows.length === filteredTransactions.length) {
//             setSelectedRows([]);
//         } else {
//             setSelectedRows(filteredTransactions.map(transaction => transaction.transactionId));
//         }
//     };
//
//     const handleAddCustomCategory = async (category: string) => {
//         try {
//             setCustomCategories(prev => {
//                 if (prev.includes(category)) {
//                     return prev;
//                 }
//                 return [...prev, category];
//             });
//
//             const userId = Number(localStorage.getItem('userId'));
//             const addedUserCustomCategory = await userCategoryService.addCustomUserCategory(userId, category);
//         } catch (error) {
//             console.error('Error adding custom category:', error);
//         }
//     };
//
//     const handleOpenFilterMenu = (event: React.MouseEvent<HTMLElement>) => {
//         setFilterAnchorEl(event.currentTarget);
//     };
//
//     const handleCloseFilterMenu = () => {
//         setFilterAnchorEl(null);
//     };
//
//     const handleOpenDateRangeMenu = (event: React.MouseEvent<HTMLElement>) => {
//         setDateRangeAnchorEl(event.currentTarget);
//     };
//
//     const handleCloseDateRangeMenu = () => {
//         setDateRangeAnchorEl(null);
//     };
//
//     const handleDateRangeChange = (range: string) => {
//         setActiveFilters({
//             ...activeFilters,
//             dateRange: range
//         });
//         handleCloseDateRangeMenu();
//     };
//
//     const handleCategoryFilter = useCallback((category: string) => {
//         setActiveFilters(prev => {
//             const newCategories = prev.categories.includes(category)
//                 ? prev.categories.filter(c => c !== category)
//                 : [...prev.categories, category];
//
//             return {
//                 ...prev,
//                 categories: newCategories
//             };
//         });
//     }, []);
//
//     const handleTypeFilter = (type: string | null) => {
//         setActiveFilters({
//             ...activeFilters,
//             type
//         });
//         handleCloseFilterMenu();
//     };
//
//     const uniqueCategories = useMemo(() => {
//         const categories = new Set<string>();
//         transactions.forEach(transaction => {
//             transaction.categories.forEach(category => {
//                 if (category) categories.add(category);
//             });
//         });
//         return Array.from(categories);
//     }, [transactions]);
//
//     const categoryColors = useMemo(() => {
//         const colors: Record<string, string> = {};
//         const baseColors = [
//             maroonColor, tealColor, '#3b82f6', '#8b5cf6',
//             '#ec4899', '#f97316', '#f59e0b', '#6366f1'
//         ];
//
//         uniqueCategories.forEach((category, index) => {
//             colors[category] = baseColors[index % baseColors.length];
//         });
//
//         return colors;
//     }, [uniqueCategories]);
//
//     const handleResetDisabledCategories = async () => {
//         try {
//             setDisabledCategories([]);
//         } catch (error) {
//             console.error('Error resetting disabled categories:', error);
//         }
//     };
//
//     const handleCustomMonthSelect = (month: Date) => {
//         setSelectedMonth(month);
//         setActiveFilters({
//             ...activeFilters,
//             dateRange: 'Custom Month'
//         });
//         setCustomMonthDialogOpen(false);
//         handleCloseDateRangeMenu();
//     }
//
//     const transactionStats = useMemo(() => {
//         let income = 0;
//         let expense = 0;
//         let pending = 0;
//         let lastMonthExpense = 0;
//
//         filteredTransactions.forEach(transaction => {
//             if (transaction.pending) {
//                 pending += 1;
//                 return;
//             }
//             const category = transaction.categories;
//
//             if (transaction.amount > 0 && category.includes('Income')) {
//                 income += Math.abs(transaction.amount);
//             } else {
//                 expense += transaction.amount;
//             }
//         });
//
//         const { startDate, endDate } = getDateRangeFilter(activeFilters.dateRange, selectedMonth);
//         const periodLength = endDate.getTime() - startDate.getTime();
//         const previousPeriodEnd = new Date(startDate.getTime() - 1);
//         const previousPeriodStart = new Date(previousPeriodEnd.getTime() - periodLength);
//
//         combinedTransactions.forEach(transaction => {
//             const transactionDate = new Date(transaction.posted || transaction.date);
//
//             if (transactionDate >= previousPeriodStart &&
//                 transactionDate <= previousPeriodEnd &&
//                 transaction.amount > 0) {
//                 lastMonthExpense += transaction.amount;
//             }
//         });
//
//         const expenseTrend = lastMonthExpense > 0
//             ? ((expense - lastMonthExpense) / lastMonthExpense) * 100
//             : expense > 0 ? 100 : 0;
//
//         return {
//             income,
//             expense,
//             pending,
//             total: filteredTransactions.length,
//             expenseTrend,
//             lastMonthExpense
//         };
//     }, [filteredTransactions, activeFilters.dateRange, selectedMonth, combinedTransactions]);
//
//     const categoryBreakdown = useMemo(() => {
//         const breakdowns: Record<string, number> = {};
//
//         combinedTransactions.forEach(transaction => {
//             if (transaction.amount > 0 && transaction.categories.length > 0) {
//                 const category = transaction.categories[0];
//                 if (breakdowns[category]) {
//                     breakdowns[category] += transaction.amount;
//                 } else {
//                     breakdowns[category] = transaction.amount;
//                 }
//             }
//         });
//
//         return Object.entries(breakdowns)
//             .map(([category, amount]) => ({ category, amount }))
//             .sort((a, b) => b.amount - a.amount)
//             .slice(0, 5);
//     }, [combinedTransactions]);
//
//     return (
//         <Box sx={{
//             p: { xs: 2, md: 3 },
//             maxWidth: 'calc(100% - 240px)',
//             ml: '240px',
//             backgroundColor: '#f9fafc',
//             minHeight: '100vh',
//             backgroundImage: 'radial-gradient(rgba(128, 0, 0, 0.03) 2px, transparent 2px), radial-gradient(rgba(128, 0, 0, 0.03) 2px, transparent 2px)',
//             backgroundSize: '40px 40px',
//             backgroundPosition: '0 0, 20px 20px'
//         }}>
//             <Sidebar />
//
//             {/* Floating Action Button */}
//             <Fab
//                 color="primary"
//                 aria-label="add transaction"
//                 sx={{
//                     position: 'fixed',
//                     bottom: 32,
//                     right: 32,
//                     width: 64,
//                     height: 64,
//                     boxShadow: `0 8px 24px ${alpha(maroonColor, 0.3)}`,
//                     background: gradients.maroon,
//                     '&:hover': {
//                         background: `linear-gradient(135deg, #a00000 0%, ${maroonColor} 100%)`,
//                         transform: 'scale(1.05)',
//                         boxShadow: `0 12px 32px ${alpha(maroonColor, 0.4)}`
//                     },
//                     transition: 'all 0.2s ease-in-out'
//                 }}
//             >
//                 <Plus size={28} />
//             </Fab>
//
//             {/* Header Section */}
//             <Grow in={animateIn} timeout={600}>
//                 <Box sx={{
//                     display: 'flex',
//                     flexDirection: { xs: 'column', md: 'row' },
//                     justifyContent: 'center',
//                     alignItems: 'center',
//                     textAlign: 'center',
//                     mb: 4,
//                     mt: 1
//                 }}>
//                     <Box sx={{ mb: { xs: 2, md: 0 } }}>
//                         <Typography variant="h4" sx={{
//                             fontWeight: 800,
//                             color: '#000000',
//                             letterSpacing: '-0.025em'
//                         }}>
//                             Transactions
//                         </Typography>
//                         <Typography variant="subtitle1" sx={{ color: 'text.secondary', mt: 0.5 }}>
//                             Track and manage your financial activity
//                         </Typography>
//                     </Box>
//                 </Box>
//             </Grow>
//
//             {/* Stats Cards */}
//             <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
//                 <Grow in={animateIn} timeout={800}>
//                     <Card sx={{
//                         flex: 1,
//                         minWidth: 240,
//                         py: 2.5,
//                         px: 3,
//                         borderRadius: 3,
//                         boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
//                         background: gradients.teal,
//                         color: 'white',
//                         border: `1px solid ${alpha(tealColor, 0.2)}`,
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'space-between',
//                         position: 'relative',
//                         overflow: 'hidden',
//                         '&::after': {
//                             content: '""',
//                             position: 'absolute',
//                             top: 0,
//                             right: 0,
//                             width: '50%',
//                             height: '100%',
//                             backgroundImage: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1))',
//                             transform: 'skewX(-20deg) translateX(10%)',
//                         }
//                     }}>
//                         <Box>
//                             <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1, fontWeight: 600 }}>
//                                 Income
//                             </Typography>
//                             <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
//                                 {formatCurrency(transactionStats.income)}
//                             </Typography>
//                             <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                                 <ArrowDown size={16} style={{ marginRight: 4 }} />
//                                 <Typography variant="body2" sx={{ opacity: 0.9 }}>
//                                     +{(transactionStats.income * 0.08).toFixed(1)}% from last period
//                                 </Typography>
//                             </Box>
//                         </Box>
//                         <Avatar sx={{
//                             bgcolor: 'rgba(255, 255, 255, 0.2)',
//                             width: 56,
//                             height: 56,
//                             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
//                         }}>
//                             <TrendingUp size={28} color="white" />
//                         </Avatar>
//                     </Card>
//                 </Grow>
//
//                 <Grow in={animateIn} timeout={900}>
//                     <Card sx={{
//                         flex: 1,
//                         minWidth: 240,
//                         py: 2.5,
//                         px: 3,
//                         borderRadius: 3,
//                         boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
//                         background: gradients.maroon,
//                         color: 'white',
//                         border: `1px solid ${alpha(maroonColor, 0.2)}`,
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'space-between',
//                         position: 'relative',
//                         overflow: 'hidden',
//                         '&::after': {
//                             content: '""',
//                             position: 'absolute',
//                             top: 0,
//                             right: 0,
//                             width: '50%',
//                             height: '100%',
//                             backgroundImage: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1))',
//                             transform: 'skewX(-20deg) translateX(10%)',
//                         }
//                     }}>
//                         <Box>
//                             <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1, fontWeight: 600 }}>
//                                 Expenses
//                             </Typography>
//                             <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
//                                 {formatCurrency(transactionStats.expense)}
//                             </Typography>
//                             <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                                 {transactionStats.expenseTrend > 0 ? (
//                                     <>
//                                         <ArrowUp size={16} style={{ marginRight: 4 }} />
//                                         <Typography variant="body2" sx={{ opacity: 0.9 }}>
//                                             +{transactionStats.expenseTrend.toFixed(1)}% from last period
//                                         </Typography>
//                                     </>
//                                 ) : (
//                                     <>
//                                         <ArrowDown size={16} style={{ marginRight: 4 }} />
//                                         <Typography variant="body2" sx={{ opacity: 0.9 }}>
//                                             {Math.abs(transactionStats.expenseTrend).toFixed(1)}% from last period
//                                         </Typography>
//                                     </>
//                                 )}
//                             </Box>
//                         </Box>
//                         <Avatar sx={{
//                             bgcolor: 'rgba(255, 255, 255, 0.2)',
//                             width: 56,
//                             height: 56,
//                             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
//                         }}>
//                             <TrendingDown size={28} color="white" />
//                         </Avatar>
//                     </Card>
//                 </Grow>
//
//                 <Grow in={animateIn} timeout={1000}>
//                     <Card sx={{
//                         flex: 1,
//                         minWidth: 240,
//                         py: 2.5,
//                         px: 3,
//                         borderRadius: 3,
//                         boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
//                         background: gradients.purple,
//                         color: 'white',
//                         border: `1px solid ${alpha('#7c3aed', 0.2)}`,
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'space-between',
//                         position: 'relative',
//                         overflow: 'hidden',
//                         '&::after': {
//                             content: '""',
//                             position: 'absolute',
//                             top: 0,
//                             right: 0,
//                             width: '50%',
//                             height: '100%',
//                             backgroundImage: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1))',
//                             transform: 'skewX(-20deg) translateX(10%)',
//                         }
//                     }}>
//                         <Box>
//                             <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1, fontWeight: 600 }}>
//                                 Balance
//                             </Typography>
//                             <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
//                                 {formatCurrency(transactionStats.income - transactionStats.expense)}
//                             </Typography>
//                             <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                                 <Typography variant="body2" sx={{ opacity: 0.9 }}>
//                                     Current period net flow
//                                 </Typography>
//                             </Box>
//                         </Box>
//                         <Avatar sx={{
//                             bgcolor: 'rgba(255, 255, 255, 0.2)',
//                             width: 56,
//                             height: 56,
//                             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
//                         }}>
//                             <Wallet size={28} color="white" />
//                         </Avatar>
//                     </Card>
//                 </Grow>
//
//                 <Grow in={animateIn} timeout={1100}>
//                     <Card sx={{
//                         flex: 1,
//                         minWidth: 240,
//                         py: 2.5,
//                         px: 3,
//                         borderRadius: 3,
//                         boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
//                         background: gradients.blue,
//                         color: 'white',
//                         border: `1px solid ${alpha('#2563eb', 0.2)}`,
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'space-between',
//                         position: 'relative',
//                         overflow: 'hidden',
//                         '&::after': {
//                             content: '""',
//                             position: 'absolute',
//                             top: 0,
//                             right: 0,
//                             width: '50%',
//                             height: '100%',
//                             backgroundImage: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1))',
//                             transform: 'skewX(-20deg) translateX(10%)',
//                         }
//                     }}>
//                         <Box>
//                             <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1, fontWeight: 600 }}>
//                                 Top Category
//                             </Typography>
//                             <Typography variant="h5" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
//                                 {categoryBreakdown[0]?.category || 'N/A'}
//                             </Typography>
//                             <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                                 <Typography variant="body2" sx={{ opacity: 0.9 }}>
//                                     {categoryBreakdown[0]
//                                         ? formatCurrency(categoryBreakdown[0].amount)
//                                         : '$0.00'}
//                                 </Typography>
//                             </Box>
//                         </Box>
//                         <Avatar sx={{
//                             bgcolor: 'rgba(255, 255, 255, 0.2)',
//                             width: 56,
//                             height: 56,
//                             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
//                         }}>
//                             <PieChart size={28} color="white" />
//                         </Avatar>
//                     </Card>
//                 </Grow>
//             </Box>
//
//             {/* Category Breakdown */}
//             <Grow in={animateIn} timeout={1200}>
//                 <Card sx={{ mb: 4, p: 2.5, borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', border: `1px solid ${alpha('#e0e0e0', 0.5)}` }}>
//                     <Typography variant="h6" sx={{ px: 1, mb: 2, fontWeight: 700, color: '#000000' }}>
//                         Top Spending Categories
//                     </Typography>
//
//                     <Box sx={{ px: 1 }}>
//                         {categoryBreakdown.map((item, index) => (
//                             <Box key={item.category} sx={{ mb: index < categoryBreakdown.length - 1 ? 2 : 0 }}>
//                                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
//                                     <Typography variant="body2" fontWeight={600}>{item.category}</Typography>
//                                     <Typography variant="body2" fontWeight={700} color="text.primary">
//                                         {formatCurrency(item.amount)}
//                                     </Typography>
//                                 </Box>
//                                 <LinearProgress
//                                     variant="determinate"
//                                     value={item.amount / (categoryBreakdown[0]?.amount || 1) * 100}
//                                     sx={{
//                                         height: 8,
//                                         borderRadius: 4,
//                                         bgcolor: alpha(categoryColors[item.category] || '#3b82f6', 0.15),
//                                         '& .MuiLinearProgress-bar': {
//                                             bgcolor: categoryColors[item.category] || '#3b82f6',
//                                             borderRadius: 4
//                                         }
//                                     }}
//                                 />
//                             </Box>
//                         ))}
//                     </Box>
//                 </Card>
//             </Grow>
//
//             {/* Search and Filters */}
//             <Grow in={animateIn} timeout={1300}>
//                 <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
//                     <Paper
//                         elevation={0}
//                         sx={{
//                             display: 'flex',
//                             alignItems: 'center',
//                             borderRadius: 3,
//                             p: '4px 16px',
//                             flex: 1,
//                             border: `1px solid ${alpha('#e0e0e0', 0.8)}`,
//                             transition: 'all 0.2s ease-in-out',
//                             '&:focus-within': {
//                                 borderColor: '#3b82f6',
//                                 boxShadow: `0 0 0 3px ${alpha('#3b82f6', 0.1)}`
//                             }
//                         }}
//                     >
//                         <Search size={20} color="#757575" />
//                         <TextField
//                             variant="standard"
//                             placeholder="Search transactions..."
//                             fullWidth
//                             value={searchTerm}
//                             onChange={handleSearchTermChange}
//                             InputProps={{
//                                 disableUnderline: true,
//                                 startAdornment: (
//                                     <InputAdornment position="start">
//                                         <Box sx={{ width: 8 }} />
//                                     </InputAdornment>
//                                 ),
//                                 endAdornment: searchTerm && (
//                                     <InputAdornment position="end">
//                                         <IconButton
//                                             size="small"
//                                             onClick={() => setSearchTerm('')}
//                                             sx={{ mr: -1 }}
//                                         >
//                                             <XCircle size={16} />
//                                         </IconButton>
//                                     </InputAdornment>
//                                 ),
//                             }}
//                             sx={{
//                                 '& .MuiInputBase-input': {
//                                     pl: 1,
//                                     fontSize: '0.95rem',
//                                     '&::placeholder': {
//                                         color: 'text.secondary',
//                                         opacity: 0.7,
//                                     },
//                                 },
//                             }}
//                         />
//                     </Paper>
//
//                     <Stack direction="row" spacing={1}>
//                         <Button
//                             variant="outlined"
//                             startIcon={<Calendar size={18} />}
//                             endIcon={<ChevronDown size={16} />}
//                             onClick={handleOpenDateRangeMenu}
//                             sx={{
//                                 borderRadius: 2,
//                                 textTransform: 'none',
//                                 whiteSpace: 'nowrap',
//                                 fontWeight: 600,
//                                 px: 2.5,
//                                 py: 1.2,
//                                 fontSize: '0.95rem',
//                                 color: 'text.primary',
//                                 borderColor: alpha('#e0e0e0', 0.8),
//                                 bgcolor: 'white',
//                                 '&:hover': {
//                                     borderColor: '#3b82f6',
//                                     bgcolor: alpha('#3b82f6', 0.05),
//                                     color: '#3b82f6'
//                                 }
//                             }}
//                         >
//                             {activeFilters.dateRange === 'Custom Month' && selectedMonth
//                                 ? selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
//                                 : activeFilters.dateRange}
//                         </Button>
//
//                         <Button
//                             variant="outlined"
//                             startIcon={<SlidersHorizontal size={18} />}
//                             onClick={handleOpenRulesDialog}
//                             sx={{
//                                 borderRadius: 2,
//                                 textTransform: 'none',
//                                 fontWeight: 600,
//                                 px: 2.5,
//                                 py: 1.2,
//                                 fontSize: '0.95rem',
//                                 color: 'text.primary',
//                                 borderColor: alpha('#e0e0e0', 0.8),
//                                 bgcolor: 'white',
//                                 '&:hover': {
//                                     borderColor: '#8b5cf6',
//                                     bgcolor: alpha('#8b5cf6', 0.05),
//                                     color: '#8b5cf6'
//                                 }
//                             }}
//                         >
//                             Rules
//                         </Button>
//
//                         <Button
//                             variant="outlined"
//                             startIcon={<Sync />}
//                             onClick={handleSyncTransactions}
//                             disabled={isSyncing}
//                             sx={{
//                                 borderRadius: 2,
//                                 textTransform: 'none',
//                                 whiteSpace: 'nowrap',
//                                 fontWeight: 600,
//                                 px: 2.5,
//                                 py: 1.2,
//                                 fontSize: '0.95rem',
//                                 color: 'text.primary',
//                                 borderColor: alpha('#e0e0e0', 0.8),
//                                 bgcolor: 'white',
//                                 '&:hover': {
//                                     borderColor: '#10b981',
//                                     bgcolor: alpha('#10b981', 0.05),
//                                     color: '#10b981'
//                                 }
//                             }}
//                         >
//                             {isSyncing ? 'Syncing...' : 'Sync'}
//                         </Button>
//                     </Stack>
//                 </Box>
//             </Grow>
//
//             {/* Active Filters */}
//             {(activeFilters.categories.length > 0 || activeFilters.type) && (
//                 <Grow in={animateIn} timeout={1400}>
//                     <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
//                         {activeFilters.categories.map(category => (
//                             <Chip
//                                 key={category}
//                                 label={category}
//                                 onDelete={() => handleCategoryFilter(category)}
//                                 size="medium"
//                                 sx={{
//                                     borderRadius: 2,
//                                     py: 0.5,
//                                     px: 0.5,
//                                     fontWeight: 600,
//                                     bgcolor: alpha(categoryColors[category] || maroonColor, 0.1),
//                                     color: categoryColors[category] || maroonColor,
//                                     border: `1px solid ${alpha(categoryColors[category] || maroonColor, 0.2)}`,
//                                     '& .MuiChip-deleteIcon': {
//                                         color: categoryColors[category] || maroonColor,
//                                         '&:hover': {
//                                             color: alpha(categoryColors[category] || maroonColor, 0.7),
//                                         }
//                                     }
//                                 }}
//                             />
//                         ))}
//
//                         {activeFilters.type && (
//                             <Chip
//                                 label={activeFilters.type === 'income' ? 'Income' : 'Expense'}
//                                 onDelete={() => handleTypeFilter(null)}
//                                 size="medium"
//                                 sx={{
//                                     borderRadius: 2,
//                                     py: 0.5,
//                                     px: 0.5,
//                                     fontWeight: 600,
//                                     bgcolor: activeFilters.type === 'income'
//                                         ? alpha(tealColor, 0.1)
//                                         : alpha(maroonColor, 0.1),
//                                     color: activeFilters.type === 'income' ? tealColor : maroonColor,
//                                     border: `1px solid ${activeFilters.type === 'income' ? alpha(tealColor, 0.2) : alpha(maroonColor, 0.2)}`,
//                                     '& .MuiChip-deleteIcon': {
//                                         color: activeFilters.type === 'income' ? tealColor : maroonColor,
//                                         '&:hover': {
//                                             color: activeFilters.type === 'income' ? alpha(tealColor, 0.7) : alpha(maroonColor, 0.7)
//                                         }
//                                     }
//                                 }}
//                             />
//                         )}
//
//                         <Button
//                             size="small"
//                             onClick={() => {
//                                 setActiveFilters({
//                                     categories: [],
//                                     dateRange: 'Last 30 days',
//                                     type: null
//                                 });
//                             }}
//                             sx={{
//                                 textTransform: 'none',
//                                 fontWeight: 600,
//                                 fontSize: '0.85rem',
//                                 color: 'text.secondary',
//                                 '&:hover': {
//                                     bgcolor: alpha('#757575', 0.05)
//                                 }
//                             }}
//                         >
//                             Clear all
//                         </Button>
//                     </Box>
//                 </Grow>
//             )}
//
//             {/* Transactions Table */}
//             <Grow in={animateIn} timeout={1500}>
//                 <TableContainer
//                     component={Paper}
//                     sx={{
//                         borderRadius: 3,
//                         overflow: 'auto',
//                         boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
//                         maxHeight: 'calc(100vh - 520px)',
//                         minHeight: 400,
//                         mb: 2,
//                         border: `1px solid ${alpha('#e0e0e0', 0.5)}`,
//                         '&::-webkit-scrollbar': {
//                             width: '10px',
//                             height: '10px',
//                         },
//                         '&::-webkit-scrollbar-track': {
//                             background: alpha('#ccc', 0.1),
//                             borderRadius: 2,
//                         },
//                         '&::-webkit-scrollbar-thumb': {
//                             background: alpha('#3b82f6', 0.3),
//                             borderRadius: 2,
//                             '&:hover': {
//                                 background: alpha('#3b82f6', 0.5),
//                             }
//                         }
//                     }}
//                 >
//                     <Table stickyHeader sx={{ minWidth: 800 }}>
//                         <TableHead>
//                             <TableRow>
//                                 <TableCell
//                                     padding="checkbox"
//                                     sx={{
//                                         bgcolor: '#ffffff',
//                                         borderBottom: `2px solid ${alpha('#e0e0e0', 0.8)}`,
//                                         backdropFilter: 'blur(10px)',
//                                         position: 'sticky',
//                                         top: 0,
//                                         zIndex: 10
//                                     }}
//                                 >
//                                     <Checkbox
//                                         indeterminate={selectedRows.length > 0 && selectedRows.length < filteredTransactions.length}
//                                         checked={selectedRows.length > 0 && selectedRows.length === filteredTransactions.length}
//                                         onChange={handleSelectAll}
//                                         sx={{
//                                             color: alpha('#757575', 0.6),
//                                             '&.Mui-checked': {
//                                                 color: '#3b82f6'
//                                             },
//                                             '&.MuiCheckbox-indeterminate': {
//                                                 color: '#3b82f6'
//                                             }
//                                         }}
//                                     />
//                                 </TableCell>
//
//                                 <TableCell
//                                     onClick={() => handleSort('date')}
//                                     sx={{
//                                         fontWeight: 700,
//                                         cursor: 'pointer',
//                                         color: sortConfig.key === 'date' ? '#3b82f6' : 'text.primary',
//                                         bgcolor: '#ffffff',
//                                         borderBottom: `2px solid ${alpha('#e0e0e0', 0.8)}`,
//                                         py: 2,
//                                         fontSize: '0.875rem',
//                                         letterSpacing: '0.5px',
//                                         textTransform: 'uppercase',
//                                         position: 'sticky',
//                                         top: 0,
//                                         zIndex: 10,
//                                         '&:hover': {
//                                             color: '#3b82f6',
//                                             bgcolor: alpha('#3b82f6', 0.03)
//                                         }
//                                     }}
//                                 >
//                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                                         Date
//                                         {sortConfig.key === 'date' && (
//                                             sortConfig.direction === 'asc' ?
//                                                 <ArrowUp size={14} /> :
//                                                 <ArrowDown size={14} />
//                                         )}
//                                     </Box>
//                                 </TableCell>
//
//                                 <TableCell
//                                     onClick={() => handleSort('name')}
//                                     sx={{
//                                         fontWeight: 700,
//                                         cursor: 'pointer',
//                                         color: sortConfig.key === 'name' ? '#3b82f6' : 'text.primary',
//                                         bgcolor: '#ffffff',
//                                         borderBottom: `2px solid ${alpha('#e0e0e0', 0.8)}`,
//                                         py: 2,
//                                         fontSize: '0.875rem',
//                                         letterSpacing: '0.5px',
//                                         textTransform: 'uppercase',
//                                         position: 'sticky',
//                                         top: 0,
//                                         zIndex: 10,
//                                         '&:hover': {
//                                             color: '#3b82f6',
//                                             bgcolor: alpha('#3b82f6', 0.03)
//                                         }
//                                     }}
//                                 >
//                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                                         Merchant
//                                         {sortConfig.key === 'name' && (
//                                             sortConfig.direction === 'asc' ?
//                                                 <ArrowUp size={14} /> :
//                                                 <ArrowDown size={14} />
//                                         )}
//                                     </Box>
//                                 </TableCell>
//
//                                 <TableCell
//                                     onClick={() => handleSort('category')}
//                                     sx={{
//                                         fontWeight: 700,
//                                         cursor: 'pointer',
//                                         color: sortConfig.key === 'category' ? '#3b82f6' : 'text.primary',
//                                         bgcolor: '#ffffff',
//                                         borderBottom: `2px solid ${alpha('#e0e0e0', 0.8)}`,
//                                         py: 2,
//                                         fontSize: '0.875rem',
//                                         letterSpacing: '0.5px',
//                                         textTransform: 'uppercase',
//                                         position: 'sticky',
//                                         top: 0,
//                                         zIndex: 10,
//                                         '&:hover': {
//                                             color: '#3b82f6',
//                                             bgcolor: alpha('#3b82f6', 0.03)
//                                         }
//                                     }}
//                                 >
//                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                                         Category
//                                         {sortConfig.key === 'category' && (
//                                             sortConfig.direction === 'asc' ?
//                                                 <ArrowUp size={14} /> :
//                                                 <ArrowDown size={14} />
//                                         )}
//                                     </Box>
//                                 </TableCell>
//
//                                 <TableCell
//                                     onClick={() => handleSort('amount')}
//                                     align="right"
//                                     sx={{
//                                         fontWeight: 700,
//                                         cursor: 'pointer',
//                                         color: sortConfig.key === 'amount' ? '#3b82f6' : 'text.primary',
//                                         bgcolor: '#ffffff',
//                                         borderBottom: `2px solid ${alpha('#e0e0e0', 0.8)}`,
//                                         py: 2,
//                                         fontSize: '0.875rem',
//                                         letterSpacing: '0.5px',
//                                         textTransform: 'uppercase',
//                                         position: 'sticky',
//                                         top: 0,
//                                         zIndex: 10,
//                                         '&:hover': {
//                                             color: '#3b82f6',
//                                             bgcolor: alpha('#3b82f6', 0.03)
//                                         }
//                                     }}
//                                 >
//                                     <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
//                                         Amount
//                                         {sortConfig.key === 'amount' && (
//                                             sortConfig.direction === 'asc' ?
//                                                 <ArrowUp size={14} /> :
//                                                 <ArrowDown size={14} />
//                                         )}
//                                     </Box>
//                                 </TableCell>
//
//                                 <TableCell
//                                     align="right"
//                                     sx={{
//                                         fontWeight: 700,
//                                         bgcolor: '#ffffff',
//                                         borderBottom: `2px solid ${alpha('#e0e0e0', 0.8)}`,
//                                         py: 2,
//                                         fontSize: '0.875rem',
//                                         letterSpacing: '0.5px',
//                                         textTransform: 'uppercase',
//                                         position: 'sticky',
//                                         top: 0,
//                                         zIndex: 10
//                                     }}
//                                 >
//                                     Balance
//                                 </TableCell>
//                             </TableRow>
//                         </TableHead>
//
//                         <TableBody>
//                             {isLoading ? (
//                                 <TableRow>
//                                     <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
//                                         <CircularProgress size={48} sx={{ color: '#3b82f6' }} />
//                                         <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary', fontWeight: 600 }}>
//                                             Loading transactions...
//                                         </Typography>
//                                     </TableCell>
//                                 </TableRow>
//                             ) : filteredTransactions.length > 0 ? (
//                                 (() => {
//                                     // Calculate running balance
//                                     let runningBalance = 0;
//
//                                     return filteredTransactions.map((transaction, index) => {
//                                         // Update running balance (income is negative in amount, expense is positive)
//                                         runningBalance += transaction.amount < 0
//                                             ? Math.abs(transaction.amount) // Income adds to balance
//                                             : -transaction.amount; // Expense subtracts from balance
//
//                                         return (
//                                             <TableRow
//                                                 key={transaction.transactionId}
//                                                 sx={{
//                                                     '&:last-child td, &:last-child th': { border: 0 },
//                                                     '&:hover': {
//                                                         bgcolor: alpha('#f5f5f5', 0.5)
//                                                     },
//                                                     bgcolor: selectedRows.includes(transaction.transactionId)
//                                                         ? alpha('#3b82f6', 0.05)
//                                                         : 'background.paper',
//                                                     borderBottom: `1px solid ${alpha('#e0e0e0', 0.5)}`,
//                                                     transition: 'all 0.15s ease-in-out'
//                                                 }}
//                                             >
//                                                 <TableCell padding="checkbox">
//                                                     <Checkbox
//                                                         checked={selectedRows.includes(transaction.transactionId)}
//                                                         onChange={() => handleRowSelection(transaction.transactionId)}
//                                                         sx={{
//                                                             color: alpha('#757575', 0.4),
//                                                             '&.Mui-checked': {
//                                                                 color: '#3b82f6'
//                                                             }
//                                                         }}
//                                                     />
//                                                 </TableCell>
//
//                                                 <TableCell sx={{ py: 2.5 }}>
//                                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                                                         <Box sx={{
//                                                             width: 48,
//                                                             height: 48,
//                                                             borderRadius: 2,
//                                                             display: 'flex',
//                                                             flexDirection: 'column',
//                                                             alignItems: 'center',
//                                                             justifyContent: 'center',
//                                                             bgcolor: alpha('#f5f5f5', 1),
//                                                             border: `1px solid ${alpha('#e0e0e0', 1)}`
//                                                         }}>
//                                                             <Typography variant="h6" sx={{
//                                                                 fontWeight: 700,
//                                                                 lineHeight: 1,
//                                                                 color: 'text.primary'
//                                                             }}>
//                                                                 {new Date(transaction.posted || transaction.date).getDate()}
//                                                             </Typography>
//                                                             <Typography variant="caption" sx={{
//                                                                 fontSize: '0.65rem',
//                                                                 color: 'text.secondary',
//                                                                 fontWeight: 600
//                                                             }}>
//                                                                 {new Date(transaction.posted || transaction.date)
//                                                                     .toLocaleDateString('en-US', { month: 'short' })
//                                                                     .toUpperCase()}
//                                                             </Typography>
//                                                         </Box>
//                                                         <Box>
//                                                             <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
//                                                                 {formatDate(transaction.posted, transaction.date)}
//                                                             </Typography>
//                                                             {transaction.pending && (
//                                                                 <Chip
//                                                                     label="Pending"
//                                                                     size="small"
//                                                                     sx={{
//                                                                         height: 18,
//                                                                         fontSize: '0.65rem',
//                                                                         fontWeight: 600,
//                                                                         bgcolor: alpha('#f59e0b', 0.1),
//                                                                         color: '#f59e0b',
//                                                                         mt: 0.5
//                                                                     }}
//                                                                 />
//                                                             )}
//                                                         </Box>
//                                                     </Box>
//                                                 </TableCell>
//
//                                                 <TableCell sx={{ py: 2.5 }}>
//                                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                                                         {transaction.logoUrl ? (
//                                                             <Box sx={{
//                                                                 width: 40,
//                                                                 height: 40,
//                                                                 borderRadius: 2,
//                                                                 overflow: 'hidden',
//                                                                 border: `1px solid ${alpha('#e0e0e0', 1)}`,
//                                                                 display: 'flex',
//                                                                 alignItems: 'center',
//                                                                 justifyContent: 'center',
//                                                                 bgcolor: 'white'
//                                                             }}>
//                                                                 <img
//                                                                     src={transaction.logoUrl}
//                                                                     alt={transaction.merchantName || 'Logo'}
//                                                                     style={{
//                                                                         width: '100%',
//                                                                         height: '100%',
//                                                                         objectFit: 'contain'
//                                                                     }}
//                                                                 />
//                                                             </Box>
//                                                         ) : (
//                                                             <Box sx={{
//                                                                 width: 40,
//                                                                 height: 40,
//                                                                 borderRadius: 2,
//                                                                 display: 'flex',
//                                                                 alignItems: 'center',
//                                                                 justifyContent: 'center',
//                                                                 bgcolor: alpha('#f5f5f5', 1),
//                                                                 border: `1px solid ${alpha('#e0e0e0', 1)}`,
//                                                                 fontSize: '1rem',
//                                                                 fontWeight: 700,
//                                                                 color: 'text.secondary'
//                                                             }}>
//                                                                 {(transaction.merchantName || transaction.name || 'T').charAt(0).toUpperCase()}
//                                                             </Box>
//                                                         )}
//                                                         <Box>
//                                                             <Typography variant="body2" sx={{
//                                                                 fontWeight: 600,
//                                                                 color: 'text.primary',
//                                                                 mb: 0.25
//                                                             }}>
//                                                                 {transaction.name}
//                                                             </Typography>
//                                                             {transaction.merchantName && transaction.merchantName !== transaction.name && (
//                                                                 <Typography variant="caption" sx={{
//                                                                     color: 'text.secondary',
//                                                                     display: 'block'
//                                                                 }}>
//                                                                     {transaction.merchantName}
//                                                                 </Typography>
//                                                             )}
//                                                         </Box>
//                                                     </Box>
//                                                 </TableCell>
//
//                                                 <TableCell sx={{ py: 2.5 }}>
//                                                     <Chip
//                                                         label={transaction.categories[0] || 'Uncategorized'}
//                                                         size="small"
//                                                         onClick={() => handleOpenCategoryDialog(transaction)}
//                                                         sx={{
//                                                             borderRadius: 2,
//                                                             fontWeight: 600,
//                                                             fontSize: '0.75rem',
//                                                             height: 28,
//                                                             bgcolor: alpha(
//                                                                 categoryColors[transaction.categories[0]] || '#9e9e9e',
//                                                                 0.1
//                                                             ),
//                                                             color: categoryColors[transaction.categories[0]] || '#757575',
//                                                             border: `1px solid ${alpha(
//                                                                 categoryColors[transaction.categories[0]] || '#9e9e9e',
//                                                                 0.3
//                                                             )}`,
//                                                             cursor: 'pointer',
//                                                             transition: 'all 0.2s ease-in-out',
//                                                             '&:hover': {
//                                                                 bgcolor: alpha(
//                                                                     categoryColors[transaction.categories[0]] || '#9e9e9e',
//                                                                     0.2
//                                                                 ),
//                                                                 transform: 'translateY(-1px)',
//                                                                 boxShadow: `0 2px 8px ${alpha(
//                                                                     categoryColors[transaction.categories[0]] || '#9e9e9e',
//                                                                     0.25
//                                                                 )}`
//                                                             }
//                                                         }}
//                                                     />
//                                                 </TableCell>
//
//                                                 <TableCell align="right" sx={{ py: 2.5 }}>
//                                                     <Box sx={{
//                                                         display: 'inline-flex',
//                                                         alignItems: 'center',
//                                                         gap: 0.75,
//                                                         px: 1.5,
//                                                         py: 0.75,
//                                                         borderRadius: 2,
//                                                         bgcolor: transaction.amount < 0
//                                                             ? alpha(tealColor, 0.08)
//                                                             : alpha(maroonColor, 0.08),
//                                                         border: `1px solid ${transaction.amount < 0
//                                                             ? alpha(tealColor, 0.2)
//                                                             : alpha(maroonColor, 0.2)}`
//                                                     }}>
//                                                         {transaction.amount < 0 ? (
//                                                             <ArrowDown size={14} color={tealColor} />
//                                                         ) : (
//                                                             <ArrowUp size={14} color={maroonColor} />
//                                                         )}
//                                                         <Typography
//                                                             variant="body2"
//                                                             sx={{
//                                                                 fontWeight: 700,
//                                                                 fontSize: '0.875rem',
//                                                                 color: transaction.amount < 0 ? tealColor : maroonColor
//                                                             }}
//                                                         >
//                                                             {formatCurrency(Math.abs(transaction.amount))}
//                                                         </Typography>
//                                                     </Box>
//                                                 </TableCell>
//
//                                                 <TableCell align="right" sx={{ py: 2.5 }}>
//                                                     <Typography
//                                                         variant="body2"
//                                                         sx={{
//                                                             fontWeight: 700,
//                                                             fontSize: '0.875rem',
//                                                             color: runningBalance >= 0 ? tealColor : maroonColor
//                                                         }}
//                                                     >
//                                                         {formatCurrency(Math.abs(transaction.balance ?? 0))}
//                                                     </Typography>
//                                                 </TableCell>
//                                             </TableRow>
//                                         );
//                                     });
//                                 })()
//                             ) : (
//                                 <TableRow>
//                                     <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
//                                         <Box sx={{ maxWidth: 400, mx: 'auto', textAlign: 'center' }}>
//                                             <Box
//                                                 sx={{
//                                                     width: 96,
//                                                     height: 96,
//                                                     borderRadius: '50%',
//                                                     background: `linear-gradient(135deg, ${alpha('#3b82f6', 0.1)} 0%, ${alpha('#8b5cf6', 0.1)} 100%)`,
//                                                     display: 'flex',
//                                                     alignItems: 'center',
//                                                     justifyContent: 'center',
//                                                     mx: 'auto',
//                                                     mb: 3,
//                                                     border: `2px solid ${alpha('#3b82f6', 0.2)}`,
//                                                     boxShadow: `0 8px 24px ${alpha('#3b82f6', 0.1)}`
//                                                 }}
//                                             >
//                                                 <Search size={40} color="#3b82f6" />
//                                             </Box>
//                                             <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
//                                                 No transactions found
//                                             </Typography>
//                                             <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
//                                                 {searchTerm ?
//                                                     `No transactions match "${searchTerm}"` :
//                                                     'Try adjusting your filters or add a new transaction to get started'}
//                                             </Typography>
//                                             {searchTerm ? (
//                                                 <Button
//                                                     variant="outlined"
//                                                     size="large"
//                                                     onClick={() => setSearchTerm('')}
//                                                     startIcon={<XCircle size={18} />}
//                                                     sx={{
//                                                         textTransform: 'none',
//                                                         borderRadius: 2,
//                                                         px: 3,
//                                                         py: 1.2,
//                                                         fontWeight: 600,
//                                                         borderColor: '#3b82f6',
//                                                         color: '#3b82f6',
//                                                         '&:hover': {
//                                                             borderColor: '#3b82f6',
//                                                             bgcolor: alpha('#3b82f6', 0.05)
//                                                         }
//                                                     }}
//                                                 >
//                                                     Clear search
//                                                 </Button>
//                                             ) : (
//                                                 <Button
//                                                     variant="contained"
//                                                     size="large"
//                                                     startIcon={<PlusCircle size={18} />}
//                                                     sx={{
//                                                         textTransform: 'none',
//                                                         borderRadius: 2,
//                                                         px: 3,
//                                                         py: 1.2,
//                                                         fontWeight: 600,
//                                                         boxShadow: `0 4px 14px ${alpha('#3b82f6', 0.25)}`,
//                                                         background: gradients.blue,
//                                                         '&:hover': {
//                                                             background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
//                                                         }
//                                                     }}
//                                                 >
//                                                     Add a transaction
//                                                 </Button>
//                                             )}
//                                         </Box>
//                                     </TableCell>
//                                 </TableRow>
//                             )}
//                         </TableBody>
//                     </Table>
//                 </TableContainer>
//             </Grow>
//
//             {/* Selected Actions */}
//             {selectedRows.length > 0 && (
//                 <Grow in={true} timeout={400}>
//                     <Paper
//                         elevation={4}
//                         sx={{
//                             position: 'fixed',
//                             bottom: 24,
//                             left: '50%',
//                             transform: 'translateX(-50%)',
//                             py: 1.5,
//                             px: 3,
//                             borderRadius: 3,
//                             display: 'flex',
//                             alignItems: 'center',
//                             zIndex: 1000,
//                             background: gradients.maroon,
//                             color: 'white',
//                             boxShadow: `0 8px 32px ${alpha(maroonColor, 0.3)}`,
//                             border: `1px solid ${alpha(maroonColor, 0.2)}`
//                         }}
//                     >
//                         <Typography variant="body1" sx={{ fontWeight: 700, mr: 3 }}>
//                             {selectedRows.length} {selectedRows.length === 1 ? 'item' : 'items'} selected
//                         </Typography>
//
//                         <Button
//                             variant="contained"
//                             size="small"
//                             startIcon={<Trash2 size={16} />}
//                             sx={{
//                                 mr: 1.5,
//                                 textTransform: 'none',
//                                 borderRadius: 2,
//                                 px: 2,
//                                 fontWeight: 600,
//                                 bgcolor: '#dc2626',
//                                 '&:hover': {
//                                     bgcolor: '#b91c1c'
//                                 }
//                             }}
//                         >
//                             Delete
//                         </Button>
//
//                         <Button
//                             variant="contained"
//                             size="small"
//                             startIcon={<SlidersHorizontal size={16} />}
//                             sx={{
//                                 mr: 1.5,
//                                 textTransform: 'none',
//                                 borderRadius: 2,
//                                 px: 2,
//                                 fontWeight: 600,
//                                 bgcolor: 'rgba(255, 255, 255, 0.2)',
//                                 '&:hover': {
//                                     bgcolor: 'rgba(255, 255, 255, 0.3)',
//                                 }
//                             }}
//                         >
//                             Categorize
//                         </Button>
//
//                         <Button
//                             size="small"
//                             onClick={() => setSelectedRows([])}
//                             sx={{
//                                 textTransform: 'none',
//                                 fontWeight: 600,
//                                 color: 'rgba(255, 255, 255, 0.9)',
//                                 '&:hover': {
//                                     bgcolor: 'rgba(255, 255, 255, 0.1)',
//                                     color: 'white'
//                                 }
//                             }}
//                         >
//                             Cancel
//                         </Button>
//                     </Paper>
//                 </Grow>
//             )}
//
//             {/* Date Range Menu */}
//             <Menu
//                 anchorEl={dateRangeAnchorEl}
//                 open={Boolean(dateRangeAnchorEl)}
//                 onClose={handleCloseDateRangeMenu}
//                 PaperProps={{
//                     elevation: 3,
//                     sx: {
//                         width: 220,
//                         mt: 1.5,
//                         borderRadius: 2,
//                         py: 1,
//                         boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
//                     }
//                 }}
//             >
//                 {['Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'This month', 'Last month', 'This year'].map((range) => (
//                     <MenuItem
//                         key={range}
//                         onClick={() => handleDateRangeChange(range)}
//                         selected={activeFilters.dateRange === range}
//                         sx={{
//                             py: 1.2,
//                             mx: 1,
//                             borderRadius: 1.5,
//                             fontWeight: 600,
//                             '&.Mui-selected': {
//                                 bgcolor: alpha(maroonColor, 0.1),
//                                 color: maroonColor,
//                                 '&:hover': {
//                                     bgcolor: alpha(maroonColor, 0.15),
//                                 }
//                             }
//                         }}
//                     >
//                         {range}
//                     </MenuItem>
//                 ))}
//                 <Divider sx={{my: 1}}/>
//
//                 <MenuItem
//                     onClick={() => {
//                         setCustomMonthDialogOpen(true);
//                         handleCloseDateRangeMenu();
//                     }}
//                     selected={activeFilters.dateRange === 'Custom Month'}
//                     sx={{
//                         py: 1.2,
//                         mx: 1,
//                         borderRadius: 1.5,
//                         fontWeight: 600,
//                         '&.Mui-selected': {
//                             bgcolor: alpha(maroonColor, 0.1),
//                             color: maroonColor,
//                             '&:hover': {
//                                 bgcolor: alpha(maroonColor, 0.15),
//                             }
//                         }
//                     }}
//                 >
//                     <Calendar size={16} style={{ marginRight: 8 }} />
//                     Select Month
//                 </MenuItem>
//             </Menu>
//
//             <MonthPickerDialog
//                 open={customMonthDialogOpen}
//                 onClose={() => setCustomMonthDialogOpen(false)}
//                 onSelect={handleCustomMonthSelect}
//                 currentMonth={selectedMonth}
//             />
//
//             {selectedTransaction && (
//                 <CategoryDialog
//                     open={categoryDialogOpen}
//                     onClose={handleCloseCategoryDialog}
//                     currentCategory={selectedTransaction.categories[0] || ''}
//                     transactionId={selectedTransaction.transactionId}
//                     merchantName={selectedTransaction.merchantName || selectedTransaction.name}
//                     description={selectedTransaction.description}
//                     extendedDescription={selectedTransaction.extendedDescription || ''}
//                     amount={selectedTransaction.amount}
//                     availableCategories={uniqueCategories}
//                     onSave={handleSaveCategory}
//                     onToggleCategory={handleToggleCategory}
//                     onAddCustomCategory={handleAddCustomCategory}
//                     onDeleteCustomCategory={handleDeleteCustomCategory}
//                     onResetDisabledCategories={handleResetDisabledCategories}
//                 />
//             )}
//
//             <TransactionRulesDialog
//                 open={rulesDialogOpen}
//                 onClose={handleCloseRulesDialog}
//                 rules={transactionRules}
//                 loading={loadingRules}
//                 onDeleteRule={handleDeleteRule}
//                 onToggleRule={handleToggleRule}
//             />
//         </Box>
//     );
// };
//
// export default TransactionsPage;