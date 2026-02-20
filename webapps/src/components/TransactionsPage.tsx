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
    Badge as MuiBadge,
    Tooltip,
    alpha,
    Fab,
    LinearProgress,
    Grow
} from '@mui/material';
import {
    Search,
    ArrowDownToLine,
    ChevronDown,
    Edit,
    Trash2,
    Filter,
    SlidersHorizontal,
    Download,
    CheckCircle2,
    PlusCircle,
    Calendar,
    XCircle,
    CreditCard,
    DollarSign,
    Clock,
    ArrowDown,
    ArrowUp,
    TrendingUp,
    TrendingDown,
    Wallet,
    PieChart,
    Plus
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

const maroonColor = '#800000';
const tealColor = '#0d9488';

// Custom gradient backgrounds
const gradients = {
    maroon: `linear-gradient(135deg, ${maroonColor} 0%, #a00000 100%)`,
    teal: `linear-gradient(135deg, ${tealColor} 0%, #0f766e 100%)`,
    blue: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    purple: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
};

const TransactionsPage: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [csvTransactions, setCsvTransactions] = useState<CSVTransaction[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({
        key: 'date',
        direction: 'desc'
    });
    const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
    const [dateRangeAnchorEl, setDateRangeAnchorEl] = useState<null | HTMLElement>(null);
    const [activeFilters, setActiveFilters] = useState<{
        categories: string[];
        dateRange: string;
        type: string | null;
    }>({
        categories: [],
        dateRange: 'Last 30 days',
        type: null
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
    const transactionRuleService = TransactionRuleService.getInstance();
    const userCategoryService = UserCategoryService.getInstance();
    const userService = UserService.getInstance();

    useEffect(() => {
        document.title = 'Transactions';
        setTimeout(() => setAnimateIn(true), 50);
        return () => {
            document.title = 'BudgetBuddy';
        }
    }, []);

    useEffect(() => {
        const rawUserId = sessionStorage.getItem('userId');
        const userId = Number(rawUserId);

        if (!rawUserId || isNaN(userId) || userId <= 0) {
            alert(`Session Error: Invalid User ID found (${rawUserId}). 
               Please log in again. 
               Browser: ${navigator.userAgent}`);
        }
    }, []);

    const handleSyncTransactions = () => {

    }

    const handleOpenRulesDialog = async () => {
        setRulesDialogOpen(true);
        setLoadingRules(true);

        try {
            const userId = Number(sessionStorage.getItem('userId'));
            const rules = await transactionRuleService.getTransactionRulesByUser(userId);
            setTransactionRules(rules);
        } catch (error) {
            console.error('Error fetching transaction rules:', error);
        } finally {
            setLoadingRules(false);
        }
    };

    const handleDeleteRule = async (ruleId: number) => {
        try {
            // await transactionRuleService.deleteTransactionRule(userId, ruleId);
            // const rules = await transactionRuleService.getTransactionRulesByUserId(userId);
            // setTransactionRules(rules);
        } catch (error) {
            console.error('Error deleting rule:', error);
            throw error;
        }
    };

    const handleToggleRule = async (ruleId: number, isActive: boolean) => {
        try {
            const userId = Number(sessionStorage.getItem('userId'));
            await transactionRuleService.updateTransactionRuleActiveState(ruleId, userId, isActive);

            setTransactionRules(prev =>
                prev.map(rule =>
                    rule.id === ruleId
                        ? { ...rule, isActive }
                        : rule
                )
            );
        } catch (error) {
            console.error('Error toggling rule:', error);

            try {
                const userId = Number(sessionStorage.getItem('userId'));
                const rules = await transactionRuleService.getTransactionRulesByUser(userId);
                setTransactionRules(rules);
            } catch (refreshError) {
                console.error('Error refreshing rules:', refreshError);
            }

            throw error;
        }
    };

    const handleCloseRulesDialog = () => {
        setRulesDialogOpen(false);
    };

    const getDateRangeFilter = (range: string, customMonth?: Date | null) : {startDate: Date; endDate: Date} => {
        if (range === 'Custom Month' && customMonth) {
            const year = customMonth.getFullYear();
            const month = customMonth.getMonth();
            const startDate = new Date(year, month, 1, 0, 0, 0, 0);
            const lastDay = new Date(year, month + 1, 0).getDate();
            const endDate = new Date(year, month, lastDay, 23, 59, 59, 999);

            return { startDate, endDate };
        }

        const today = new Date();
        let startDate: Date;
        let endDate: Date;

        switch (range) {
            case 'Today':
                startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
                endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
                break;
            case 'Yesterday':
                startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 0, 0, 0, 0);
                endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 23, 59, 59, 999);
                break;
            case 'Last 7 days':
                startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7, 0, 0, 0, 0);
                endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
                break;
            case 'Last 30 days':
                startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 31, 0, 0, 0, 0);
                endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
                break;
            case 'This month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
                endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
                break;
            case 'Last month':
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1, 0, 0, 0, 0);
                const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
                endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastDayOfLastMonth, 23, 59, 59, 999);
                break;
            case 'This year':
                startDate = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0);
                endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
                break;
            default:
                startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30, 0, 0, 0, 0);
                endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        }

        return { startDate, endDate };
    };

    const dateRange = useMemo(() => {
        return getDateRangeFilter(activeFilters.dateRange, selectedMonth);
    }, [activeFilters.dateRange, selectedMonth]);

    useEffect(() => {
        setIsLoading(true);
        const fetchTransactions = async() => {
            try {
                const transactionService = TransactionService.getInstance();
                let userId = Number(sessionStorage.getItem('userId'));

                const startDateStr = dateRange.startDate.toISOString().split('T')[0];
                console.log('Start Date:', startDateStr);
                const endDateStr = dateRange.endDate.toISOString().split('T')[0];
                console.log('End Date:', endDateStr);

                const hasPlaidCSVSync = await userService.checkUserHasPlaidCSVSyncEnabled(userId);
                const transactionResponse: Transaction[] = await transactionService.fetchTransactionsByUserAndDateRange(userId, startDateStr, endDateStr);
                const csvTransactionResponse = await transactionCategoryService.fetchTransactionCSVByCategoryList(userId, startDateStr, endDateStr);
                console.log('CSV Response:', csvTransactionResponse);
                const safeTransactionResponse = Array.isArray(transactionResponse) ? transactionResponse : [];
                const safeCsvTransactionResponse = Array.isArray(csvTransactionResponse) ? csvTransactionResponse : [];
                if(hasPlaidCSVSync) {
                    const plaidTransactionDates = new Set(
                        safeTransactionResponse.map(transaction =>
                            transaction.posted || transaction.date
                        ).filter(date => date)
                    );

                    const filteredCSVTransactions = safeCsvTransactionResponse.filter(csvTransaction => {
                        const csvDate = csvTransaction.transactionDate;
                        return csvDate && !plaidTransactionDates.has(csvDate);
                    });
                    console.log('Filtered CSV Transactions:', filteredCSVTransactions);
                    console.log('Filtered CSV Transactions Count:', filteredCSVTransactions.length);

                    setTransactions(safeTransactionResponse);
                    setCsvTransactions(filteredCSVTransactions);
                    console.log('CSV Transactions:', csvTransactions);
                } else {
                    setTransactions(safeTransactionResponse);
                }
            } catch(error: any) {
                console.error('Error fetching transactions:', error);
                setTransactions([]);
                setCsvTransactions([]);
                if (window.navigator.userAgent.includes('iPad')) {
                    alert("API Error: " + error.message);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransactions();
    }, [activeFilters]);

    const handleSearchTermChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const formatDate = (postedDate: string | null, transactionDate: string) => {
        try {
            const dateToFormat = postedDate || transactionDate;
            const date = new Date(dateToFormat);
            const today = new Date();

            if (date.toDateString() === today.toDateString()) {
                return 'Today';
            }

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (date.toDateString() === yesterday.toDateString()) {
                return 'Yesterday';
            }

            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        } catch (error) {
            return 'N/A';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(Math.abs(amount));
    };

    const handleOpenCategoryDialog = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setCategoryDialogOpen(true);
    };

    const handleCloseCategoryDialog = () => {
        setCategoryDialogOpen(false);
        setSelectedTransaction(null);
    };

    const handleSaveCategory = async (data: CategorySaveData) => {
        try {
            const userId = Number(sessionStorage.getItem('userId'));

            const hasAdvancedMatching = data.advancedMatching && (
                data.advancedMatching.matchByMerchant ||
                data.advancedMatching.matchByDescription ||
                data.advancedMatching.matchByExtendedDescription ||
                data.advancedMatching.matchByAmountRange
            );

            if (hasAdvancedMatching) {
                const matchByMerchant = data.advancedMatching?.matchByMerchant || false;
                const matchByDescription = data.advancedMatching?.matchByDescription || false;
                const matchByExtendedDescription = data.advancedMatching?.matchByExtendedDescription || false;
                const matchByAmountRange = data.advancedMatching?.matchByAmountRange || false;
                let priority = 6;

                if(matchByMerchant && matchByDescription && matchByExtendedDescription && matchByAmountRange) {
                    priority = 1;
                } else if(matchByMerchant && matchByAmountRange){
                    priority = 2;
                }else if(matchByMerchant && matchByAmountRange && data.advancedMatching?.amountRangeMin !== undefined){
                    priority = 3;
                }else if(matchByMerchant && matchByAmountRange && data.advancedMatching?.amountRangeMax !== undefined){
                    priority = 4;
                }else if(matchByDescription && matchByMerchant){
                    priority = 5;
                }else if(matchByMerchant){
                    priority = 6;
                }

                const transactionRule: TransactionRule = {
                    userId: userId,
                    categoryName: data.category,
                    priority: priority,
                    isActive: true,
                    amountMin: 0,
                    amountMax: 0,
                    matchCount: 0
                };

                if (data.advancedMatching?.matchByMerchant && data.advancedMatching.merchantNameMatch) {
                    transactionRule.merchantRule = data.advancedMatching.merchantNameMatch;
                }

                if (data.advancedMatching?.matchByDescription && data.advancedMatching.descriptionMatch) {
                    transactionRule.descriptionRule = data.advancedMatching.descriptionMatch;
                }

                if (data.advancedMatching?.matchByExtendedDescription && data.advancedMatching.extendedDescriptionMatch) {
                    transactionRule.extendedDescriptionRule = data.advancedMatching.extendedDescriptionMatch;
                }

                if (data.advancedMatching?.matchByAmountRange) {
                    if (data.advancedMatching.amountRangeMin !== undefined) {
                        transactionRule.amountMin = data.advancedMatching.amountRangeMin;
                    }
                    if (data.advancedMatching.amountRangeMax !== undefined) {
                        transactionRule.amountMax = data.advancedMatching.amountRangeMax;
                    }
                }

                const createdRule = await transactionRuleService.addTransactionRule(userId, transactionRule);
                const transactionResponse = await transactionCategoryService.updateTransactionCSVWithCategory(userId, data);
            } else {
                const transactionResponse = await transactionCategoryService.updateTransactionCSVWithCategory(userId, data);
            }

            setTransactions(prevTransactions =>
                prevTransactions.map(transaction =>
                    transaction.transactionId === data.transactionId
                        ? { ...transaction, categories: [data.category] }
                        : transaction
                )
            );

            // @ts-ignore
            if (data.transactionId.startsWith('csv-')) {
                // @ts-ignore
                const csvId = data.transactionId.split('-')[1];

                setCsvTransactions(prevCsvTransactions =>
                    prevCsvTransactions.map(csvTx =>
                        csvTx.id?.toString() === csvId
                            ? { ...csvTx, category: data.category }
                            : csvTx
                    )
                );
            }
        } catch (error) {
            console.error('Error saving category:', error);
        }
    };

    const combinedTransactions = useMemo(() => {
        const convertedCsvTransactions: Transaction[] = csvTransactions
            .filter(csv => csv.transactionDate)
            .map((csv, index) => ({
                transactionId: csv.id
                    ? `csv-${csv.id}-${index}`
                    : `csv-generated-${index}-${csv.transactionDate}-${csv.transactionAmount}`,
                amount: csv.transactionAmount,
                date: csv.transactionDate!,
                posted: csv.transactionDate,
                name: csv.merchantName || csv.description || 'Unknown',
                description: csv.description || '',
                authorizedDate: csv.transactionDate || null,
                categoryId: '',
                extendedDescription: csv.extendedDescription || '',
                merchantName: csv.merchantName,
                categories: csv.category ? [csv.category] : ['Uncategorized'],
                pending: false,
                logoUrl: null,
                isoCurrencyCode: '',
                accountId: ''
            }));

        const allTransactions = [...transactions, ...convertedCsvTransactions];
        const seen = new Set<string>();
        return allTransactions.filter(transaction => {
            const key = `${transaction.date}|${transaction.amount}|${(transaction.merchantName || transaction.name || '').toLowerCase().trim()}`;

            if (seen.has(key)) {
                return false;
            }

            seen.add(key);
            return true;
        });
    }, [transactions, csvTransactions]);

    const sortedTransactions = useMemo(() => {
        const sortableTransactions = [...combinedTransactions];
        if (sortConfig.key !== null) {
            sortableTransactions.sort((a, b) => {
                if (sortConfig.key === 'date') {
                    const aDate = a.posted || a.date;
                    const bDate = b.posted || b.date;
                    if (sortConfig.direction === 'asc') {
                        return new Date(aDate).getTime() - new Date(bDate).getTime();
                    } else {
                        return new Date(bDate).getTime() - new Date(aDate).getTime();
                    }
                } else if (sortConfig.key === 'amount') {
                    if (sortConfig.direction === 'asc') {
                        return a.amount - b.amount;
                    } else {
                        return b.amount - a.amount;
                    }
                } else if (sortConfig.key === 'name') {
                    const aName = a.name || '';
                    const bName = b.name || '';
                    if (sortConfig.direction === 'asc') {
                        return aName.localeCompare(bName);
                    } else {
                        return bName.localeCompare(aName);
                    }
                } else if (sortConfig.key === 'category') {
                    const aCategory = a.categories[0] || '';
                    const bCategory = b.categories[0] || '';
                    if (sortConfig.direction === 'asc') {
                        return aCategory.localeCompare(bCategory);
                    } else {
                        return bCategory.localeCompare(aCategory);
                    }
                }
                return 0;
            });
        }
        return sortableTransactions;
    }, [combinedTransactions, sortConfig]);

    const handleToggleCategory = async (category: string, enabled: boolean) => {
        try {
            if(enabled){
                const updated = disabledCategories.filter(cat => cat !== category);
                setDisabledCategories(updated);
            }else{
                const updated = [...disabledCategories, category];
                setDisabledCategories(updated);
            }
        }catch(error){
            console.error('Error toggling category:', error);
        }
    }

    const handleDeleteCustomCategory = async (category: string) => {
        try {
            setCustomCategories(prev => prev.filter(cat => cat !== category));
            setDisabledCategories(prev => prev.filter(cat => cat !== category));
        } catch (error) {
            console.error('Error deleting custom category:', error);
        }
    };

    const filteredTransactions = useMemo(() => {
        let filtered = sortedTransactions;
        console.log('raw sample:', JSON.stringify(sortedTransactions[0]?.posted), JSON.stringify(sortedTransactions[0]?.date));

        console.log('Filtered Transactions:', filtered);
        console.log('Filtered Transactions Count:', filtered.length);

        const {startDate, endDate} = getDateRangeFilter(activeFilters.dateRange, selectedMonth);
        console.log('Filter startDate:', startDate.toISOString(), 'endDate:', endDate.toISOString());

        console.log('after date filter:', filtered.length);
        const pad = (n: number) => String(n).padStart(2, '0');
        const toDateStr = (val: any): string | null => {
            if (!val) return null;
            if (typeof val === 'string') return val.split('T')[0];
            if (Array.isArray(val)) {
                const [y, m, d] = val;
                return `${y}-${pad(m)}-${pad(d)}`;
            }
            return null;
        };

        const startStr = `${startDate.getFullYear()}-${pad(startDate.getMonth()+1)}-${pad(startDate.getDate())}`;
        const endStr = `${endDate.getFullYear()}-${pad(endDate.getMonth()+1)}-${pad(endDate.getDate())}`;

        filtered = filtered.filter(transaction => {
            const dateStr = toDateStr(transaction.posted) || toDateStr(transaction.date);
            if (!dateStr) return false;
            return dateStr >= startStr && dateStr <= endStr;
        });
        if (searchTerm.trim()) {
            const searchTermLowerCase = searchTerm.toLowerCase().trim();
            filtered = filtered.filter((transaction) => {
                const name = transaction.name?.toLowerCase() ?? '';
                const category = transaction.categories[0]?.toLowerCase() ?? '';
                const merchantName = transaction.merchantName?.toLowerCase() ?? '';
                const amount = transaction.amount?.toString() ?? '';
                const date = formatDate(transaction.posted, transaction.date).toLowerCase();

                return name.includes(searchTermLowerCase) ||
                    category.includes(searchTermLowerCase) ||
                    merchantName.includes(searchTermLowerCase) ||
                    amount.includes(searchTermLowerCase) ||
                    date.includes(searchTermLowerCase);
            });
        }

        if (activeFilters.categories.length > 0) {
            filtered = filtered.filter(transaction =>
                transaction.categories.some(category =>
                    activeFilters.categories.includes(category)
                )
            );
        }

        if (activeFilters.type) {
            filtered = filtered.filter(transaction => {
                if (activeFilters.type === 'income') {
                    return transaction.amount < 0;
                } else if (activeFilters.type === 'expense') {
                    return transaction.amount > 0;
                }
                return true;
            });
        }

        return filtered;
    }, [sortedTransactions, searchTerm, activeFilters]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleRowSelection = (transactionId: string) => {
        if (selectedRows.includes(transactionId)) {
            setSelectedRows(selectedRows.filter(id => id !== transactionId));
        } else {
            setSelectedRows([...selectedRows, transactionId]);
        }
    };

    const handleSelectAll = () => {
        if (selectedRows.length === filteredTransactions.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(filteredTransactions.map(transaction => transaction.transactionId));
        }
    };

    const handleAddCustomCategory = async (category: string) => {
        try {
            setCustomCategories(prev => {
                if (prev.includes(category)) {
                    return prev;
                }
                return [...prev, category];
            });

            const userId = Number(localStorage.getItem('userId'));
            const addedUserCustomCategory = await userCategoryService.addCustomUserCategory(userId, category);
        } catch (error) {
            console.error('Error adding custom category:', error);
        }
    };

    const handleOpenFilterMenu = (event: React.MouseEvent<HTMLElement>) => {
        setFilterAnchorEl(event.currentTarget);
    };

    const handleCloseFilterMenu = () => {
        setFilterAnchorEl(null);
    };

    const handleOpenDateRangeMenu = (event: React.MouseEvent<HTMLElement>) => {
        setDateRangeAnchorEl(event.currentTarget);
    };

    const handleCloseDateRangeMenu = () => {
        setDateRangeAnchorEl(null);
    };

    const handleDateRangeChange = (range: string) => {
        setActiveFilters({
            ...activeFilters,
            dateRange: range
        });
        handleCloseDateRangeMenu();
    };

    const handleCategoryFilter = useCallback((category: string) => {
        setActiveFilters(prev => {
            const newCategories = prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category];

            return {
                ...prev,
                categories: newCategories
            };
        });
    }, []);

    const handleTypeFilter = (type: string | null) => {
        setActiveFilters({
            ...activeFilters,
            type
        });
        handleCloseFilterMenu();
    };

    const uniqueCategories = useMemo(() => {
        const categories = new Set<string>();
        transactions.forEach(transaction => {
            transaction.categories.forEach(category => {
                if (category) categories.add(category);
            });
        });
        return Array.from(categories);
    }, [transactions]);

    const categoryColors = useMemo(() => {
        const colors: Record<string, string> = {};
        const baseColors = [
            maroonColor, tealColor, '#3b82f6', '#8b5cf6',
            '#ec4899', '#f97316', '#f59e0b', '#6366f1'
        ];

        uniqueCategories.forEach((category, index) => {
            colors[category] = baseColors[index % baseColors.length];
        });

        return colors;
    }, [uniqueCategories]);

    const handleResetDisabledCategories = async () => {
        try {
            setDisabledCategories([]);
        } catch (error) {
            console.error('Error resetting disabled categories:', error);
        }
    };

    const handleCustomMonthSelect = (month: Date) => {
        setSelectedMonth(month);
        setActiveFilters({
            ...activeFilters,
            dateRange: 'Custom Month'
        });
        setCustomMonthDialogOpen(false);
        handleCloseDateRangeMenu();
    }

    const transactionStats = useMemo(() => {
        let income = 0;
        let expense = 0;
        let pending = 0;
        let lastMonthExpense = 0;

        filteredTransactions.forEach(transaction => {
            if (transaction.pending) {
                pending += 1;
                return;
            }
            const category = transaction.categories;

            if (transaction.amount > 0 && category.includes('Income')) {
                income += Math.abs(transaction.amount);
            } else {
                expense += transaction.amount;
            }
        });

        const { startDate, endDate } = getDateRangeFilter(activeFilters.dateRange, selectedMonth);
        const periodLength = endDate.getTime() - startDate.getTime();
        const previousPeriodEnd = new Date(startDate.getTime() - 1);
        const previousPeriodStart = new Date(previousPeriodEnd.getTime() - periodLength);

        combinedTransactions.forEach(transaction => {
            const transactionDate = new Date(transaction.posted || transaction.date);

            if (transactionDate >= previousPeriodStart &&
                transactionDate <= previousPeriodEnd &&
                transaction.amount > 0) {
                lastMonthExpense += transaction.amount;
            }
        });

        const expenseTrend = lastMonthExpense > 0
            ? ((expense - lastMonthExpense) / lastMonthExpense) * 100
            : expense > 0 ? 100 : 0;

        return {
            income,
            expense,
            pending,
            total: filteredTransactions.length,
            expenseTrend,
            lastMonthExpense
        };
    }, [filteredTransactions, activeFilters.dateRange, selectedMonth, combinedTransactions]);

    const categoryBreakdown = useMemo(() => {
        const breakdowns: Record<string, number> = {};

        combinedTransactions.forEach(transaction => {
            if (transaction.amount > 0 && transaction.categories.length > 0) {
                const category = transaction.categories[0];
                if (breakdowns[category]) {
                    breakdowns[category] += transaction.amount;
                } else {
                    breakdowns[category] = transaction.amount;
                }
            }
        });

        return Object.entries(breakdowns)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
    }, [combinedTransactions]);

    return (
        <Box sx={{
            p: { xs: 2, md: 3 },
            maxWidth: 'calc(100% - 240px)',
            ml: '240px',
            backgroundColor: '#f9fafc',
            minHeight: '100vh',
            backgroundImage: 'radial-gradient(rgba(128, 0, 0, 0.03) 2px, transparent 2px), radial-gradient(rgba(128, 0, 0, 0.03) 2px, transparent 2px)',
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 20px 20px'
        }}>
            <Sidebar />

            {/* Floating Action Button */}
            <Fab
                color="primary"
                aria-label="add transaction"
                sx={{
                    position: 'fixed',
                    bottom: 32,
                    right: 32,
                    width: 64,
                    height: 64,
                    boxShadow: `0 8px 24px ${alpha(maroonColor, 0.3)}`,
                    background: gradients.maroon,
                    '&:hover': {
                        background: `linear-gradient(135deg, #a00000 0%, ${maroonColor} 100%)`,
                        transform: 'scale(1.05)',
                        boxShadow: `0 12px 32px ${alpha(maroonColor, 0.4)}`
                    },
                    transition: 'all 0.2s ease-in-out'
                }}
            >
                <Plus size={28} />
            </Fab>

            {/* Header Section */}
            <Grow in={animateIn} timeout={600}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    mb: 4,
                    mt: 1
                }}>
                    <Box sx={{ mb: { xs: 2, md: 0 } }}>
                        <Typography variant="h4" sx={{
                            fontWeight: 800,
                            color: '#000000',
                            letterSpacing: '-0.025em'
                        }}>
                            Transactions
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            Track and manage your financial activity
                        </Typography>
                    </Box>
                </Box>
            </Grow>

            {/* Stats Cards */}
            <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
                <Grow in={animateIn} timeout={800}>
                    <Card sx={{
                        flex: 1,
                        minWidth: 240,
                        py: 2.5,
                        px: 3,
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        background: gradients.teal,
                        color: 'white',
                        border: `1px solid ${alpha(tealColor, 0.2)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '50%',
                            height: '100%',
                            backgroundImage: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1))',
                            transform: 'skewX(-20deg) translateX(10%)',
                        }
                    }}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1, fontWeight: 600 }}>
                                Income
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
                                {formatCurrency(transactionStats.income)}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <ArrowDown size={16} style={{ marginRight: 4 }} />
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    +{(transactionStats.income * 0.08).toFixed(1)}% from last period
                                </Typography>
                            </Box>
                        </Box>
                        <Avatar sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            width: 56,
                            height: 56,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}>
                            <TrendingUp size={28} color="white" />
                        </Avatar>
                    </Card>
                </Grow>

                <Grow in={animateIn} timeout={900}>
                    <Card sx={{
                        flex: 1,
                        minWidth: 240,
                        py: 2.5,
                        px: 3,
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        background: gradients.maroon,
                        color: 'white',
                        border: `1px solid ${alpha(maroonColor, 0.2)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '50%',
                            height: '100%',
                            backgroundImage: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1))',
                            transform: 'skewX(-20deg) translateX(10%)',
                        }
                    }}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1, fontWeight: 600 }}>
                                Expenses
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
                                {formatCurrency(transactionStats.expense)}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {transactionStats.expenseTrend > 0 ? (
                                    <>
                                        <ArrowUp size={16} style={{ marginRight: 4 }} />
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                            +{transactionStats.expenseTrend.toFixed(1)}% from last period
                                        </Typography>
                                    </>
                                ) : (
                                    <>
                                        <ArrowDown size={16} style={{ marginRight: 4 }} />
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                            {Math.abs(transactionStats.expenseTrend).toFixed(1)}% from last period
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        </Box>
                        <Avatar sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            width: 56,
                            height: 56,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}>
                            <TrendingDown size={28} color="white" />
                        </Avatar>
                    </Card>
                </Grow>

                <Grow in={animateIn} timeout={1000}>
                    <Card sx={{
                        flex: 1,
                        minWidth: 240,
                        py: 2.5,
                        px: 3,
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        background: gradients.purple,
                        color: 'white',
                        border: `1px solid ${alpha('#7c3aed', 0.2)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '50%',
                            height: '100%',
                            backgroundImage: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1))',
                            transform: 'skewX(-20deg) translateX(10%)',
                        }
                    }}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1, fontWeight: 600 }}>
                                Balance
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
                                {formatCurrency(transactionStats.income - transactionStats.expense)}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    Current period net flow
                                </Typography>
                            </Box>
                        </Box>
                        <Avatar sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            width: 56,
                            height: 56,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}>
                            <Wallet size={28} color="white" />
                        </Avatar>
                    </Card>
                </Grow>

                <Grow in={animateIn} timeout={1100}>
                    <Card sx={{
                        flex: 1,
                        minWidth: 240,
                        py: 2.5,
                        px: 3,
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        background: gradients.blue,
                        color: 'white',
                        border: `1px solid ${alpha('#2563eb', 0.2)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '50%',
                            height: '100%',
                            backgroundImage: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1))',
                            transform: 'skewX(-20deg) translateX(10%)',
                        }
                    }}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1, fontWeight: 600 }}>
                                Top Category
                            </Typography>
                            <Typography variant="h5" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
                                {categoryBreakdown[0]?.category || 'N/A'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    {categoryBreakdown[0]
                                        ? formatCurrency(categoryBreakdown[0].amount)
                                        : '$0.00'}
                                </Typography>
                            </Box>
                        </Box>
                        <Avatar sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            width: 56,
                            height: 56,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}>
                            <PieChart size={28} color="white" />
                        </Avatar>
                    </Card>
                </Grow>
            </Box>

            {/* Category Breakdown */}
            <Grow in={animateIn} timeout={1200}>
                <Card sx={{ mb: 4, p: 2.5, borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', border: `1px solid ${alpha('#e0e0e0', 0.5)}` }}>
                    <Typography variant="h6" sx={{ px: 1, mb: 2, fontWeight: 700, color: '#000000' }}>
                        Top Spending Categories
                    </Typography>

                    <Box sx={{ px: 1 }}>
                        {categoryBreakdown.map((item, index) => (
                            <Box key={item.category} sx={{ mb: index < categoryBreakdown.length - 1 ? 2 : 0 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2" fontWeight={600}>{item.category}</Typography>
                                    <Typography variant="body2" fontWeight={700} color="text.primary">
                                        {formatCurrency(item.amount)}
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={item.amount / (categoryBreakdown[0]?.amount || 1) * 100}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: alpha(categoryColors[item.category] || '#3b82f6', 0.15),
                                        '& .MuiLinearProgress-bar': {
                                            bgcolor: categoryColors[item.category] || '#3b82f6',
                                            borderRadius: 4
                                        }
                                    }}
                                />
                            </Box>
                        ))}
                    </Box>
                </Card>
            </Grow>

            {/* Search and Filters */}
            <Grow in={animateIn} timeout={1300}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: 3,
                            p: '4px 16px',
                            flex: 1,
                            border: `1px solid ${alpha('#e0e0e0', 0.8)}`,
                            transition: 'all 0.2s ease-in-out',
                            '&:focus-within': {
                                borderColor: '#3b82f6',
                                boxShadow: `0 0 0 3px ${alpha('#3b82f6', 0.1)}`
                            }
                        }}
                    >
                        <Search size={20} color="#757575" />
                        <TextField
                            variant="standard"
                            placeholder="Search transactions..."
                            fullWidth
                            value={searchTerm}
                            onChange={handleSearchTermChange}
                            InputProps={{
                                disableUnderline: true,
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Box sx={{ width: 8 }} />
                                    </InputAdornment>
                                ),
                                endAdornment: searchTerm && (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => setSearchTerm('')}
                                            sx={{ mr: -1 }}
                                        >
                                            <XCircle size={16} />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiInputBase-input': {
                                    pl: 1,
                                    fontSize: '0.95rem',
                                    '&::placeholder': {
                                        color: 'text.secondary',
                                        opacity: 0.7,
                                    },
                                },
                            }}
                        />
                    </Paper>

                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<Calendar size={18} />}
                            endIcon={<ChevronDown size={16} />}
                            onClick={handleOpenDateRangeMenu}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                whiteSpace: 'nowrap',
                                fontWeight: 600,
                                px: 2.5,
                                py: 1.2,
                                fontSize: '0.95rem',
                                color: 'text.primary',
                                borderColor: alpha('#e0e0e0', 0.8),
                                bgcolor: 'white',
                                '&:hover': {
                                    borderColor: '#3b82f6',
                                    bgcolor: alpha('#3b82f6', 0.05),
                                    color: '#3b82f6'
                                }
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
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 2.5,
                                py: 1.2,
                                fontSize: '0.95rem',
                                color: 'text.primary',
                                borderColor: alpha('#e0e0e0', 0.8),
                                bgcolor: 'white',
                                '&:hover': {
                                    borderColor: '#8b5cf6',
                                    bgcolor: alpha('#8b5cf6', 0.05),
                                    color: '#8b5cf6'
                                }
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
                                borderRadius: 2,
                                textTransform: 'none',
                                whiteSpace: 'nowrap',
                                fontWeight: 600,
                                px: 2.5,
                                py: 1.2,
                                fontSize: '0.95rem',
                                color: 'text.primary',
                                borderColor: alpha('#e0e0e0', 0.8),
                                bgcolor: 'white',
                                '&:hover': {
                                    borderColor: '#10b981',
                                    bgcolor: alpha('#10b981', 0.05),
                                    color: '#10b981'
                                }
                            }}
                        >
                            {isSyncing ? 'Syncing...' : 'Sync'}
                        </Button>
                    </Stack>
                </Box>
            </Grow>

            {/* Active Filters */}
            {(activeFilters.categories.length > 0 || activeFilters.type) && (
                <Grow in={animateIn} timeout={1400}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {activeFilters.categories.map(category => (
                            <Chip
                                key={category}
                                label={category}
                                onDelete={() => handleCategoryFilter(category)}
                                size="medium"
                                sx={{
                                    borderRadius: 2,
                                    py: 0.5,
                                    px: 0.5,
                                    fontWeight: 600,
                                    bgcolor: alpha(categoryColors[category] || maroonColor, 0.1),
                                    color: categoryColors[category] || maroonColor,
                                    border: `1px solid ${alpha(categoryColors[category] || maroonColor, 0.2)}`,
                                    '& .MuiChip-deleteIcon': {
                                        color: categoryColors[category] || maroonColor,
                                        '&:hover': {
                                            color: alpha(categoryColors[category] || maroonColor, 0.7),
                                        }
                                    }
                                }}
                            />
                        ))}

                        {activeFilters.type && (
                            <Chip
                                label={activeFilters.type === 'income' ? 'Income' : 'Expense'}
                                onDelete={() => handleTypeFilter(null)}
                                size="medium"
                                sx={{
                                    borderRadius: 2,
                                    py: 0.5,
                                    px: 0.5,
                                    fontWeight: 600,
                                    bgcolor: activeFilters.type === 'income'
                                        ? alpha(tealColor, 0.1)
                                        : alpha(maroonColor, 0.1),
                                    color: activeFilters.type === 'income' ? tealColor : maroonColor,
                                    border: `1px solid ${activeFilters.type === 'income' ? alpha(tealColor, 0.2) : alpha(maroonColor, 0.2)}`,
                                    '& .MuiChip-deleteIcon': {
                                        color: activeFilters.type === 'income' ? tealColor : maroonColor,
                                        '&:hover': {
                                            color: activeFilters.type === 'income' ? alpha(tealColor, 0.7) : alpha(maroonColor, 0.7)
                                        }
                                    }
                                }}
                            />
                        )}

                        <Button
                            size="small"
                            onClick={() => {
                                setActiveFilters({
                                    categories: [],
                                    dateRange: 'Last 30 days',
                                    type: null
                                });
                            }}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                color: 'text.secondary',
                                '&:hover': {
                                    bgcolor: alpha('#757575', 0.05)
                                }
                            }}
                        >
                            Clear all
                        </Button>
                    </Box>
                </Grow>
            )}

            {/* Transactions Table */}
            <Grow in={animateIn} timeout={1500}>
                <TableContainer
                    component={Paper}
                    sx={{
                        borderRadius: 3,
                        overflow: 'auto',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        maxHeight: 'calc(100vh - 520px)',
                        minHeight: 400,
                        mb: 2,
                        border: `1px solid ${alpha('#e0e0e0', 0.5)}`,
                        '&::-webkit-scrollbar': {
                            width: '10px',
                            height: '10px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: alpha('#ccc', 0.1),
                            borderRadius: 2,
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: alpha('#3b82f6', 0.3),
                            borderRadius: 2,
                            '&:hover': {
                                background: alpha('#3b82f6', 0.5),
                            }
                        }
                    }}
                >
                    <Table stickyHeader sx={{ minWidth: 800 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    padding="checkbox"
                                    sx={{
                                        bgcolor: '#ffffff',
                                        borderBottom: `2px solid ${alpha('#e0e0e0', 0.8)}`,
                                        backdropFilter: 'blur(10px)',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 10
                                    }}
                                >
                                    <Checkbox
                                        indeterminate={selectedRows.length > 0 && selectedRows.length < filteredTransactions.length}
                                        checked={selectedRows.length > 0 && selectedRows.length === filteredTransactions.length}
                                        onChange={handleSelectAll}
                                        sx={{
                                            color: alpha('#757575', 0.6),
                                            '&.Mui-checked': {
                                                color: '#3b82f6'
                                            },
                                            '&.MuiCheckbox-indeterminate': {
                                                color: '#3b82f6'
                                            }
                                        }}
                                    />
                                </TableCell>

                                <TableCell
                                    onClick={() => handleSort('date')}
                                    sx={{
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        color: sortConfig.key === 'date' ? '#3b82f6' : 'text.primary',
                                        bgcolor: '#ffffff',
                                        borderBottom: `2px solid ${alpha('#e0e0e0', 0.8)}`,
                                        py: 2,
                                        fontSize: '0.875rem',
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 10,
                                        '&:hover': {
                                            color: '#3b82f6',
                                            bgcolor: alpha('#3b82f6', 0.03)
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        Date
                                        {sortConfig.key === 'date' && (
                                            sortConfig.direction === 'asc' ?
                                                <ArrowUp size={14} /> :
                                                <ArrowDown size={14} />
                                        )}
                                    </Box>
                                </TableCell>

                                <TableCell
                                    onClick={() => handleSort('name')}
                                    sx={{
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        color: sortConfig.key === 'name' ? '#3b82f6' : 'text.primary',
                                        bgcolor: '#ffffff',
                                        borderBottom: `2px solid ${alpha('#e0e0e0', 0.8)}`,
                                        py: 2,
                                        fontSize: '0.875rem',
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 10,
                                        '&:hover': {
                                            color: '#3b82f6',
                                            bgcolor: alpha('#3b82f6', 0.03)
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        Merchant
                                        {sortConfig.key === 'name' && (
                                            sortConfig.direction === 'asc' ?
                                                <ArrowUp size={14} /> :
                                                <ArrowDown size={14} />
                                        )}
                                    </Box>
                                </TableCell>

                                <TableCell
                                    onClick={() => handleSort('category')}
                                    sx={{
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        color: sortConfig.key === 'category' ? '#3b82f6' : 'text.primary',
                                        bgcolor: '#ffffff',
                                        borderBottom: `2px solid ${alpha('#e0e0e0', 0.8)}`,
                                        py: 2,
                                        fontSize: '0.875rem',
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 10,
                                        '&:hover': {
                                            color: '#3b82f6',
                                            bgcolor: alpha('#3b82f6', 0.03)
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        Category
                                        {sortConfig.key === 'category' && (
                                            sortConfig.direction === 'asc' ?
                                                <ArrowUp size={14} /> :
                                                <ArrowDown size={14} />
                                        )}
                                    </Box>
                                </TableCell>

                                <TableCell
                                    onClick={() => handleSort('amount')}
                                    align="right"
                                    sx={{
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        color: sortConfig.key === 'amount' ? '#3b82f6' : 'text.primary',
                                        bgcolor: '#ffffff',
                                        borderBottom: `2px solid ${alpha('#e0e0e0', 0.8)}`,
                                        py: 2,
                                        fontSize: '0.875rem',
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 10,
                                        '&:hover': {
                                            color: '#3b82f6',
                                            bgcolor: alpha('#3b82f6', 0.03)
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                        Amount
                                        {sortConfig.key === 'amount' && (
                                            sortConfig.direction === 'asc' ?
                                                <ArrowUp size={14} /> :
                                                <ArrowDown size={14} />
                                        )}
                                    </Box>
                                </TableCell>

                                <TableCell
                                    align="right"
                                    sx={{
                                        fontWeight: 700,
                                        bgcolor: '#ffffff',
                                        borderBottom: `2px solid ${alpha('#e0e0e0', 0.8)}`,
                                        py: 2,
                                        fontSize: '0.875rem',
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 10
                                    }}
                                >
                                    Balance
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                        <CircularProgress size={48} sx={{ color: '#3b82f6' }} />
                                        <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary', fontWeight: 600 }}>
                                            Loading transactions...
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : filteredTransactions.length > 0 ? (
                                (() => {
                                    // Calculate running balance
                                    let runningBalance = 0;

                                    return filteredTransactions.map((transaction, index) => {
                                        // Update running balance (income is negative in amount, expense is positive)
                                        runningBalance += transaction.amount < 0
                                            ? Math.abs(transaction.amount) // Income adds to balance
                                            : -transaction.amount; // Expense subtracts from balance

                                        return (
                                            <TableRow
                                                key={transaction.transactionId}
                                                sx={{
                                                    '&:last-child td, &:last-child th': { border: 0 },
                                                    '&:hover': {
                                                        bgcolor: alpha('#f5f5f5', 0.5)
                                                    },
                                                    bgcolor: selectedRows.includes(transaction.transactionId)
                                                        ? alpha('#3b82f6', 0.05)
                                                        : 'background.paper',
                                                    borderBottom: `1px solid ${alpha('#e0e0e0', 0.5)}`,
                                                    transition: 'all 0.15s ease-in-out'
                                                }}
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={selectedRows.includes(transaction.transactionId)}
                                                        onChange={() => handleRowSelection(transaction.transactionId)}
                                                        sx={{
                                                            color: alpha('#757575', 0.4),
                                                            '&.Mui-checked': {
                                                                color: '#3b82f6'
                                                            }
                                                        }}
                                                    />
                                                </TableCell>

                                                <TableCell sx={{ py: 2.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Box sx={{
                                                            width: 48,
                                                            height: 48,
                                                            borderRadius: 2,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            bgcolor: alpha('#f5f5f5', 1),
                                                            border: `1px solid ${alpha('#e0e0e0', 1)}`
                                                        }}>
                                                            <Typography variant="h6" sx={{
                                                                fontWeight: 700,
                                                                lineHeight: 1,
                                                                color: 'text.primary'
                                                            }}>
                                                                {new Date(transaction.posted || transaction.date).getDate()}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{
                                                                fontSize: '0.65rem',
                                                                color: 'text.secondary',
                                                                fontWeight: 600
                                                            }}>
                                                                {new Date(transaction.posted || transaction.date)
                                                                    .toLocaleDateString('en-US', { month: 'short' })
                                                                    .toUpperCase()}
                                                            </Typography>
                                                        </Box>
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                                                {formatDate(transaction.posted, transaction.date)}
                                                            </Typography>
                                                            {transaction.pending && (
                                                                <Chip
                                                                    label="Pending"
                                                                    size="small"
                                                                    sx={{
                                                                        height: 18,
                                                                        fontSize: '0.65rem',
                                                                        fontWeight: 600,
                                                                        bgcolor: alpha('#f59e0b', 0.1),
                                                                        color: '#f59e0b',
                                                                        mt: 0.5
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </TableCell>

                                                <TableCell sx={{ py: 2.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        {transaction.logoUrl ? (
                                                            <Box sx={{
                                                                width: 40,
                                                                height: 40,
                                                                borderRadius: 2,
                                                                overflow: 'hidden',
                                                                border: `1px solid ${alpha('#e0e0e0', 1)}`,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                bgcolor: 'white'
                                                            }}>
                                                                <img
                                                                    src={transaction.logoUrl}
                                                                    alt={transaction.merchantName || 'Logo'}
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        objectFit: 'contain'
                                                                    }}
                                                                />
                                                            </Box>
                                                        ) : (
                                                            <Box sx={{
                                                                width: 40,
                                                                height: 40,
                                                                borderRadius: 2,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                bgcolor: alpha('#f5f5f5', 1),
                                                                border: `1px solid ${alpha('#e0e0e0', 1)}`,
                                                                fontSize: '1rem',
                                                                fontWeight: 700,
                                                                color: 'text.secondary'
                                                            }}>
                                                                {(transaction.merchantName || transaction.name || 'T').charAt(0).toUpperCase()}
                                                            </Box>
                                                        )}
                                                        <Box>
                                                            <Typography variant="body2" sx={{
                                                                fontWeight: 600,
                                                                color: 'text.primary',
                                                                mb: 0.25
                                                            }}>
                                                                {transaction.name}
                                                            </Typography>
                                                            {transaction.merchantName && transaction.merchantName !== transaction.name && (
                                                                <Typography variant="caption" sx={{
                                                                    color: 'text.secondary',
                                                                    display: 'block'
                                                                }}>
                                                                    {transaction.merchantName}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </TableCell>

                                                <TableCell sx={{ py: 2.5 }}>
                                                    <Chip
                                                        label={transaction.categories[0] || 'Uncategorized'}
                                                        size="small"
                                                        onClick={() => handleOpenCategoryDialog(transaction)}
                                                        sx={{
                                                            borderRadius: 2,
                                                            fontWeight: 600,
                                                            fontSize: '0.75rem',
                                                            height: 28,
                                                            bgcolor: alpha(
                                                                categoryColors[transaction.categories[0]] || '#9e9e9e',
                                                                0.1
                                                            ),
                                                            color: categoryColors[transaction.categories[0]] || '#757575',
                                                            border: `1px solid ${alpha(
                                                                categoryColors[transaction.categories[0]] || '#9e9e9e',
                                                                0.3
                                                            )}`,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease-in-out',
                                                            '&:hover': {
                                                                bgcolor: alpha(
                                                                    categoryColors[transaction.categories[0]] || '#9e9e9e',
                                                                    0.2
                                                                ),
                                                                transform: 'translateY(-1px)',
                                                                boxShadow: `0 2px 8px ${alpha(
                                                                    categoryColors[transaction.categories[0]] || '#9e9e9e',
                                                                    0.25
                                                                )}`
                                                            }
                                                        }}
                                                    />
                                                </TableCell>

                                                <TableCell align="right" sx={{ py: 2.5 }}>
                                                    <Box sx={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 0.75,
                                                        px: 1.5,
                                                        py: 0.75,
                                                        borderRadius: 2,
                                                        bgcolor: transaction.amount < 0
                                                            ? alpha(tealColor, 0.08)
                                                            : alpha(maroonColor, 0.08),
                                                        border: `1px solid ${transaction.amount < 0
                                                            ? alpha(tealColor, 0.2)
                                                            : alpha(maroonColor, 0.2)}`
                                                    }}>
                                                        {transaction.amount < 0 ? (
                                                            <ArrowDown size={14} color={tealColor} />
                                                        ) : (
                                                            <ArrowUp size={14} color={maroonColor} />
                                                        )}
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                fontWeight: 700,
                                                                fontSize: '0.875rem',
                                                                color: transaction.amount < 0 ? tealColor : maroonColor
                                                            }}
                                                        >
                                                            {formatCurrency(Math.abs(transaction.amount))}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>

                                                <TableCell align="right" sx={{ py: 2.5 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 700,
                                                            fontSize: '0.875rem',
                                                            color: runningBalance >= 0 ? tealColor : maroonColor
                                                        }}
                                                    >
                                                        {formatCurrency(Math.abs(runningBalance))}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    });
                                })()
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                        <Box sx={{ maxWidth: 400, mx: 'auto', textAlign: 'center' }}>
                                            <Box
                                                sx={{
                                                    width: 96,
                                                    height: 96,
                                                    borderRadius: '50%',
                                                    background: `linear-gradient(135deg, ${alpha('#3b82f6', 0.1)} 0%, ${alpha('#8b5cf6', 0.1)} 100%)`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mx: 'auto',
                                                    mb: 3,
                                                    border: `2px solid ${alpha('#3b82f6', 0.2)}`,
                                                    boxShadow: `0 8px 24px ${alpha('#3b82f6', 0.1)}`
                                                }}
                                            >
                                                <Search size={40} color="#3b82f6" />
                                            </Box>
                                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                No transactions found
                                            </Typography>
                                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                                {searchTerm ?
                                                    `No transactions match "${searchTerm}"` :
                                                    'Try adjusting your filters or add a new transaction to get started'}
                                            </Typography>
                                            {searchTerm ? (
                                                <Button
                                                    variant="outlined"
                                                    size="large"
                                                    onClick={() => setSearchTerm('')}
                                                    startIcon={<XCircle size={18} />}
                                                    sx={{
                                                        textTransform: 'none',
                                                        borderRadius: 2,
                                                        px: 3,
                                                        py: 1.2,
                                                        fontWeight: 600,
                                                        borderColor: '#3b82f6',
                                                        color: '#3b82f6',
                                                        '&:hover': {
                                                            borderColor: '#3b82f6',
                                                            bgcolor: alpha('#3b82f6', 0.05)
                                                        }
                                                    }}
                                                >
                                                    Clear search
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="contained"
                                                    size="large"
                                                    startIcon={<PlusCircle size={18} />}
                                                    sx={{
                                                        textTransform: 'none',
                                                        borderRadius: 2,
                                                        px: 3,
                                                        py: 1.2,
                                                        fontWeight: 600,
                                                        boxShadow: `0 4px 14px ${alpha('#3b82f6', 0.25)}`,
                                                        background: gradients.blue,
                                                        '&:hover': {
                                                            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                                        }
                                                    }}
                                                >
                                                    Add a transaction
                                                </Button>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grow>

            {/* Selected Actions */}
            {selectedRows.length > 0 && (
                <Grow in={true} timeout={400}>
                    <Paper
                        elevation={4}
                        sx={{
                            position: 'fixed',
                            bottom: 24,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            py: 1.5,
                            px: 3,
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                            zIndex: 1000,
                            background: gradients.maroon,
                            color: 'white',
                            boxShadow: `0 8px 32px ${alpha(maroonColor, 0.3)}`,
                            border: `1px solid ${alpha(maroonColor, 0.2)}`
                        }}
                    >
                        <Typography variant="body1" sx={{ fontWeight: 700, mr: 3 }}>
                            {selectedRows.length} {selectedRows.length === 1 ? 'item' : 'items'} selected
                        </Typography>

                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<Trash2 size={16} />}
                            sx={{
                                mr: 1.5,
                                textTransform: 'none',
                                borderRadius: 2,
                                px: 2,
                                fontWeight: 600,
                                bgcolor: '#dc2626',
                                '&:hover': {
                                    bgcolor: '#b91c1c'
                                }
                            }}
                        >
                            Delete
                        </Button>

                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<SlidersHorizontal size={16} />}
                            sx={{
                                mr: 1.5,
                                textTransform: 'none',
                                borderRadius: 2,
                                px: 2,
                                fontWeight: 600,
                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                '&:hover': {
                                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                                }
                            }}
                        >
                            Categorize
                        </Button>

                        <Button
                            size="small"
                            onClick={() => setSelectedRows([])}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                color: 'rgba(255, 255, 255, 0.9)',
                                '&:hover': {
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white'
                                }
                            }}
                        >
                            Cancel
                        </Button>
                    </Paper>
                </Grow>
            )}

            {/* Date Range Menu */}
            <Menu
                anchorEl={dateRangeAnchorEl}
                open={Boolean(dateRangeAnchorEl)}
                onClose={handleCloseDateRangeMenu}
                PaperProps={{
                    elevation: 3,
                    sx: {
                        width: 220,
                        mt: 1.5,
                        borderRadius: 2,
                        py: 1,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
                    }
                }}
            >
                {['Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'This month', 'Last month', 'This year'].map((range) => (
                    <MenuItem
                        key={range}
                        onClick={() => handleDateRangeChange(range)}
                        selected={activeFilters.dateRange === range}
                        sx={{
                            py: 1.2,
                            mx: 1,
                            borderRadius: 1.5,
                            fontWeight: 600,
                            '&.Mui-selected': {
                                bgcolor: alpha(maroonColor, 0.1),
                                color: maroonColor,
                                '&:hover': {
                                    bgcolor: alpha(maroonColor, 0.15),
                                }
                            }
                        }}
                    >
                        {range}
                    </MenuItem>
                ))}
                <Divider sx={{my: 1}}/>

                <MenuItem
                    onClick={() => {
                        setCustomMonthDialogOpen(true);
                        handleCloseDateRangeMenu();
                    }}
                    selected={activeFilters.dateRange === 'Custom Month'}
                    sx={{
                        py: 1.2,
                        mx: 1,
                        borderRadius: 1.5,
                        fontWeight: 600,
                        '&.Mui-selected': {
                            bgcolor: alpha(maroonColor, 0.1),
                            color: maroonColor,
                            '&:hover': {
                                bgcolor: alpha(maroonColor, 0.15),
                            }
                        }
                    }}
                >
                    <Calendar size={16} style={{ marginRight: 8 }} />
                    Select Month
                </MenuItem>
            </Menu>

            <MonthPickerDialog
                open={customMonthDialogOpen}
                onClose={() => setCustomMonthDialogOpen(false)}
                onSelect={handleCustomMonthSelect}
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
                    onToggleCategory={handleToggleCategory}
                    onAddCustomCategory={handleAddCustomCategory}
                    onDeleteCustomCategory={handleDeleteCustomCategory}
                    onResetDisabledCategories={handleResetDisabledCategories}
                />
            )}

            <TransactionRulesDialog
                open={rulesDialogOpen}
                onClose={handleCloseRulesDialog}
                rules={transactionRules}
                loading={loadingRules}
                onDeleteRule={handleDeleteRule}
                onToggleRule={handleToggleRule}
            />
        </Box>
    );
};

export default TransactionsPage;