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
    useTheme,
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

// Custom gradient backgrounds
const gradients = {
    blue: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    green: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    red: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
    purple: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
    orange: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
    teal: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
    indigo: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
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
    const [loadingRules, setLoadingRules] = useState(false); // ADD THIS
    const [isSyncing, setIsSyncing] = useState(false);
    const categoryService = CategoryService.getInstance();
    const transactionService = TransactionService.getInstance();
    const transactionCategoryService = TransactionCategoryService.getInstance();
    const transactionRuleService = TransactionRuleService.getInstance();
    const userCategoryService = UserCategoryService.getInstance();
    const userService = UserService.getInstance();

    const theme = useTheme();

    useEffect(() => {
        document.title = 'Transactions';
        // Trigger animation after component is mounted
        setTimeout(() => setAnimateIn(true), 50);
        return () => {
            document.title = 'BudgetBuddy';
        }
    }, []);

    useEffect(() => {
        const rawUserId = sessionStorage.getItem('userId');
        const userId = Number(rawUserId);

        if (!rawUserId || isNaN(userId) || userId <= 0) {
            // This will pop up on the iPad screen immediately
            alert(`Session Error: Invalid User ID found (${rawUserId}). 
               Please log in again. 
               Browser: ${navigator.userAgent}`);
        }
    }, []);

    const handleSyncTransactions = () => {

    }

    const handleOpenRulesDialog = async () => {
        setRulesDialogOpen(true);
        setLoadingRules(true); // Start loading

        try {
            const userId = Number(sessionStorage.getItem('userId'));
            const rules = await transactionRuleService.getTransactionRulesByUser(userId);
            setTransactionRules(rules);
        } catch (error) {
            console.error('Error fetching transaction rules:', error);
            // Optionally show an error message to the user
        } finally {
            setLoadingRules(false); // Stop loading
        }
    };

    const handleDeleteRule = async (ruleId: number) => {
        try {
            // await transactionRuleService.deleteTransactionRule(userId, ruleId);
            // // Refresh rules
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

            // Use the correct method with all required parameters
            await transactionRuleService.updateTransactionRuleActiveState(ruleId, userId, isActive);

            // Update local state immediately (optimistic update)
            setTransactionRules(prev =>
                prev.map(rule =>
                    rule.id === ruleId
                        ? { ...rule, isActive }
                        : rule
                )
            );
        } catch (error) {
            console.error('Error toggling rule:', error);

            // Revert on error - refresh from server
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

            // const startDate = new Date(year, month, 1, 0, 0, 0, 0);
            const today = new Date();
            const startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 31);
            startDate.setHours(0 ,0, 0, 0);

            const lastDay = new Date(year, month + 1, 0).getDate();
            const endDate = new Date(year, month, lastDay, 23, 59, 59, 999);

            console.log('Custom Month Range:', {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                month: customMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            });

            return { startDate, endDate };
        }

        // For all other ranges, use today as reference
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

                console.log('Start Date: {}', startDate);
                console.log('End Date: {}', endDate);
                break;

            case 'This year':
                startDate = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0);
                endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
                break;

            default:
                // Default to last 30 days
                startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30, 0, 0, 0, 0);
                endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        }

        // console.log(`${range} Range:`, {
        //     startDate: startDate.toISOString(),
        //     endDate: endDate.toISOString()
        // });

        return { startDate, endDate };
    };

    const dateRange = useMemo(() => {
        const dateRange = getDateRangeFilter(activeFilters.dateRange, selectedMonth);
        console.log('Date Range: {}', dateRange);
        return dateRange;
    }, [activeFilters.dateRange, selectedMonth]);


    useEffect(() => {
        setIsLoading(true);
        const fetchTransactions = async() => {
            try {
                const transactionService = TransactionService.getInstance();
                let userId = Number(sessionStorage.getItem('userId'));
                if(!userId)
                {
                    userId = 1;
                }
                // let startDate = transactionService.getStartDate();
                // let endDate = new Date().toISOString().split('T')[0];
                const toLocalISO = (date: Date) => {
                    const offset = date.getTimezoneOffset();
                    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                    return localDate.toISOString().split('T')[0];
                };
                const startDateStr = toLocalISO(dateRange.startDate);
                const endDateStr = toLocalISO(dateRange.endDate);

                // const startDateStr = dateRange.startDate.toISOString().split('T')[0];
                // const endDateStr = dateRange.endDate.toISOString().split('T')[0];

                const hasPlaidCSVSync = await userService.checkUserHasPlaidCSVSyncEnabled(userId);
                console.log('Has Plaid CSV Sync Enabled:', hasPlaidCSVSync);
                const transactionResponse: Transaction[] = await transactionService.fetchTransactionsByUserAndDateRange(userId, startDateStr, endDateStr);
                const csvTransactionResponse = await transactionCategoryService.fetchTransactionCSVByCategoryList(userId, startDateStr, endDateStr);
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

                    setTransactions(safeTransactionResponse);
                    setCsvTransactions(filteredCSVTransactions);
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

            // If today, show "Today"
            const today = new Date();
            if (date.toDateString() === today.toDateString()) {
                return 'Today';
            }

            // If yesterday, show "Yesterday"
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (date.toDateString() === yesterday.toDateString()) {
                return 'Yesterday';
            }

            // Otherwise show formatted date
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
                if(matchByMerchant && matchByDescription && matchByExtendedDescription && matchByAmountRange)
                {
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
                // Create a transaction rule instead of just updating the category
                const transactionRule: TransactionRule = {
                    userId: userId,
                    categoryName: data.category,
                    priority: priority,
                    isActive: true,
                    amountMin: 0,  // Default value for primitive
                    amountMax: 0,   // Default value for primitive
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


                console.log('Creating transaction rule:', transactionRule);

                // Create the transaction rule
                const createdRule = await transactionRuleService.addTransactionRule(userId, transactionRule);
                console.log('Transaction rule created:', createdRule);

                // Still update the current transaction's category
                const transactionResponse = await transactionCategoryService.updateTransactionCSVWithCategory(userId, data);
                console.log('Updated CSV Transaction response:', transactionResponse);
            } else {
                // No advanced matching - just update the transaction category as before
                const transactionResponse = await transactionCategoryService.updateTransactionCSVWithCategory(userId, data);
                console.log('Updated CSV Transaction response:', transactionResponse);
            }

            // Update local state immediately
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
            // Optionally show an error message to the user
        }
    };

    const sortedCSVTransactions = useMemo(() => {
        const sortableTransactions = [...csvTransactions];
        if (sortConfig.key !== null) {
            sortableTransactions.sort((a, b) => {
                if (sortConfig.key === 'date') {
                    const aDate = a.transactionDate || '';
                    const bDate = b.transactionDate || '';
                    if (sortConfig.direction === 'asc') {
                        return new Date(aDate).getTime() - new Date(bDate).getTime();
                    } else {
                        return new Date(bDate).getTime() - new Date(aDate).getTime();
                    }
                } else if (sortConfig.key === 'amount') {
                    if (sortConfig.direction === 'asc') {
                        return a.transactionAmount - b.transactionAmount;
                    } else {
                        return b.transactionAmount - a.transactionAmount;
                    }
                } else if (sortConfig.key === 'name') {
                    const aName = a.merchantName || '';
                    const bName = b.merchantName || '';
                    if (sortConfig.direction === 'asc') {
                        return aName.localeCompare(bName);
                    } else {
                        return bName.localeCompare(aName);
                    }
                } else if (sortConfig.key === 'category') {
                    const aCategory = a.category || '';
                    const bCategory = b.category || '';
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
    }, [csvTransactions, sortConfig]);

    const combinedTransactions = useMemo(() => {
        // Convert CSV transactions to match Transaction interface
        const convertedCsvTransactions: Transaction[] = csvTransactions
            .filter(csv => csv.transactionDate)
            .map((csv, index) => ({
                // Create unique ID - use csv.id if available, otherwise generate one
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
            // Create unique key
            const key = `${transaction.date}|${transaction.amount}|${(transaction.merchantName || transaction.name || '').toLowerCase().trim()}`;

            if (seen.has(key)) {
                return false; // Skip duplicate
            }

            seen.add(key);
            return true; // Keep unique
        });
    }, [transactions, csvTransactions]);


    // Sort transactions
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
        try
        {
            console.log('Toggling category:', category, enabled ? 'enable' : 'disable');
            if(enabled){
                const updated = disabledCategories.filter(cat => cat !== category);
                console.log('Enabling - new disabled list:', updated);
                setDisabledCategories(updated);
            }else{
                const updated = [...disabledCategories, category];
                console.log('Disabling - new disabled list:', updated);
                setDisabledCategories(updated);
            }
        }catch(error){
            console.error('Error toggling category:', error);
        }
    }

    const handleDeleteCustomCategory = async (category: string) => {
        try {
            console.log('Deleting custom category:', category);

            // Remove from custom categories list
            setCustomCategories(prev => prev.filter(cat => cat !== category));

            // Also remove from disabled categories if it's there
            setDisabledCategories(prev => prev.filter(cat => cat !== category));

            // TODO: Call API to delete from database
            // const transactionService = TransactionService.getInstance();
            // await transactionService.deleteCustomCategory(category);

            console.log('Custom category deleted:', category);
        } catch (error) {
            console.error('Error deleting custom category:', error);
        }
    };


    const filteredTransactions = useMemo(() => {
        let filtered = sortedTransactions;


        const {startDate, endDate} = getDateRangeFilter(activeFilters.dateRange, selectedMonth);
        filtered = filtered.filter(transaction => {
            const transactionDate = new Date(transaction.posted || transaction.date);
            return transactionDate >= startDate && transactionDate <= endDate;
        });
        // Apply search term filter
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

        // Apply category filter
        if (activeFilters.categories.length > 0) {
            filtered = filtered.filter(transaction =>
                transaction.categories.some(category =>
                    activeFilters.categories.includes(category)
                )
            );
        }

        // Apply transaction type filter
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

    const handleCategoryChange = (transactionId: string, newCategory: string) => {
        setTransactions(prevTransactions =>
            prevTransactions.map(transaction =>
                transaction.transactionId === transactionId
                    ? { ...transaction, categories: [newCategory] }
                    : transaction
            )
        );
    };

    // Add this handler
    const handleAddCustomCategory = async (category: string) => {
        try {
            // Add to custom categories list
            setCustomCategories(prev => {
                if (prev.includes(category)) {
                    return prev; // Already exists
                }
                return [...prev, category];
            });

            // TODO: Save to database
            const userId = Number(localStorage.getItem('userId'));
            const addedUserCustomCategory = await userCategoryService.addCustomUserCategory(userId, category);
            console.log('Custom category added:', addedUserCustomCategory);
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

    // Get colors for categories
    const categoryColors = useMemo(() => {
        const colors: Record<string, string> = {};
        const baseColors = [
            '#3b82f6', '#10b981', '#f97316', '#8b5cf6',
            '#ec4899', '#14b8a6', '#f59e0b', '#6366f1'
        ];

        uniqueCategories.forEach((category, index) => {
            colors[category] = baseColors[index % baseColors.length];
        });

        return colors;
    }, [uniqueCategories]);

    const handleResetDisabledCategories = async () => {
        try {
            console.log('Resetting all disabled categories');

            // Clear the disabled categories list
            setDisabledCategories([]);

            // TODO: Save to database
            // const transactionService = TransactionService.getInstance();
            // await transactionService.resetDisabledCategories();

            console.log('All categories re-enabled');
        } catch (error) {
            console.error('Error resetting disabled categories:', error);
        }
    };

    const handleCustomMonthSelect = (month: Date) => {
        console.log('Selected custom month: ', month);
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

        // Use filteredTransactions instead of combinedTransactions
        filteredTransactions.forEach(transaction => {
            if (transaction.pending) {
                pending += 1;
                return;
            }
            const category = transaction.categories;

            // Calculate current stats
            if (transaction.amount > 0 && category.includes('Income')) {
                income += Math.abs(transaction.amount);
            } else {
                expense += transaction.amount;
            }
        });

        // Calculate comparison period for trend
        // Get the date range for filtered period
        const { startDate, endDate } = getDateRangeFilter(activeFilters.dateRange, selectedMonth);
        // Calculate period length in milliseconds
        const periodLength = endDate.getTime() - startDate.getTime();

        // Calculate previous period by subtracting the period length
        const previousPeriodEnd = new Date(startDate.getTime() - 1); // 1ms before current period starts
        const previousPeriodStart = new Date(previousPeriodEnd.getTime() - periodLength);


        // Calculate expense from previous period for comparison
        combinedTransactions.forEach(transaction => {
            const transactionDate = new Date(transaction.posted || transaction.date);

            if (transactionDate >= previousPeriodStart &&
                transactionDate <= previousPeriodEnd &&
                transaction.amount > 0) {
                lastMonthExpense += transaction.amount;
            }
        });

        // Calculate percentage change for expense trend
        const expenseTrend = lastMonthExpense > 0
            ? ((expense - lastMonthExpense) / lastMonthExpense) * 100
            : expense > 0 ? 100 : 0; // If no previous data but current expense exists, show 100% increase

        return {
            income,
            expense,
            pending,
            total: filteredTransactions.length,
            expenseTrend,
            lastMonthExpense
        };
    }, [filteredTransactions, activeFilters.dateRange, selectedMonth, combinedTransactions]);

    // Get category breakdown for expense chart
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
            .slice(0, 5); // Top 5 categories
    }, [combinedTransactions]);



    return (
        <Box sx={{
            p: { xs: 2, md: 3 },
            maxWidth: 'calc(100% - 240px)',
            ml: '240px',
            backgroundColor: '#f9fafc',
            minHeight: '100vh',
            backgroundImage: 'radial-gradient(rgba(0, 0, 120, 0.01) 2px, transparent 2px), radial-gradient(rgba(0, 0, 120, 0.01) 2px, transparent 2px)',
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
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                    background: gradients.blue,
                    '&:hover': {
                        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                    }
                }}
            >
                <Plus />
            </Fab>

            {/* Header Section */}
            <Grow in={animateIn} timeout={600}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'center', // Center the content horizontally
                    alignItems: 'center', // Center items vertically
                    textAlign: 'center', // Center text
                    mb: 4,
                    mt: 1
                }}>
                    <Box sx={{ mb: { xs: 2, md: 0 } }}>
                        <Typography variant="h4" sx={{
                            fontWeight: 800,
                            color: theme.palette.text.primary,
                            letterSpacing: '-0.025em'
                        }}>
                            Transactions
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
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
                        borderRadius: 4,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        background: gradients.green,
                        color: 'white',
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
                            <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1, fontWeight: 500 }}>
                                Income
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
                                {formatCurrency(transactionStats.income)}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <ArrowDown size={16} style={{ marginRight: 4 }} />
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                    +{(transactionStats.income * 0.08).toFixed(1)}% from last month
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
                        borderRadius: 4,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        background: gradients.red,
                        color: 'white',
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
                            <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1, fontWeight: 500 }}>
                                Expenses
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
                                {formatCurrency(transactionStats.expense)}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {transactionStats.expenseTrend > 0 ? (
                                    <>
                                        <ArrowUp size={16} style={{ marginRight: 4 }} />
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                            +{transactionStats.expenseTrend.toFixed(1)}% from last month
                                        </Typography>
                                    </>
                                ) : (
                                    <>
                                        <ArrowDown size={16} style={{ marginRight: 4 }} />
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                            {Math.abs(transactionStats.expenseTrend).toFixed(1)}% from last month
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
                        borderRadius: 4,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        background: gradients.purple,
                        color: 'white',
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
                            <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1, fontWeight: 500 }}>
                                Balance
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
                                {formatCurrency(transactionStats.income - transactionStats.expense)}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                    Current month net flow
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
                        borderRadius: 4,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        background: gradients.indigo,
                        color: 'white',
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
                            <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1, fontWeight: 500 }}>
                                Top Category
                            </Typography>
                            <Typography variant="h5" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
                                {categoryBreakdown[0]?.category || 'N/A'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
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
                <Card sx={{ mb: 4, p: 2.5, borderRadius: 4, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                    <Typography variant="h6" sx={{ px: 1, mb: 2, fontWeight: 600 }}>
                        Top Spending Categories
                    </Typography>

                    <Box sx={{ px: 1 }}>
                        {categoryBreakdown.map((item, index) => (
                            <Box key={item.category} sx={{ mb: index < categoryBreakdown.length - 1 ? 2 : 0 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2" fontWeight={500}>{item.category}</Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {formatCurrency(item.amount)}
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={item.amount / (categoryBreakdown[0]?.amount || 1) * 100}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: alpha(categoryColors[item.category] || '#3b82f6', 0.2),
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: categoryColors[item.category] || '#3b82f6',
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
                            borderRadius: '14px',
                            p: '4px 16px',
                            flex: 1,
                            border: '1px solid',
                            borderColor: alpha(theme.palette.divider, 0.8),
                            transition: 'all 0.2s ease-in-out',
                            '&:focus-within': {
                                borderColor: theme.palette.primary.main,
                                boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`
                            }
                        }}
                    >
                        <Search size={20} color={theme.palette.text.secondary} />
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
                                        color: theme.palette.text.secondary,
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
                                borderRadius: 3,
                                textTransform: 'none',
                                whiteSpace: 'nowrap',
                                fontWeight: 600,
                                px: 2.5,
                                py: 1.2,
                                fontSize: '0.95rem',
                                color: theme.palette.text.primary,
                                borderColor: alpha(theme.palette.divider, 0.8),
                                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                                '&:hover': {
                                    borderColor: theme.palette.primary.main,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                }
                            }}
                        >
                            {/*{activeFilters.dateRange}*/}
                            {activeFilters.dateRange === 'Custom Month' && selectedMonth
                                ? selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                : activeFilters.dateRange}
                        </Button>

                        {/*<Button*/}
                        {/*    variant="outlined"*/}
                        {/*    startIcon={<Filter size={18} />}*/}
                        {/*    endIcon={activeFilters.categories.length > 0 || activeFilters.type ? (*/}
                        {/*        <MuiBadge color="primary" variant="dot">*/}
                        {/*            <ChevronDown size={16} />*/}
                        {/*        </MuiBadge>*/}
                        {/*    ) : (*/}
                        {/*        <ChevronDown size={16} />*/}
                        {/*    )}*/}
                        {/*    onClick={handleOpenFilterMenu}*/}
                        {/*    sx={{*/}
                        {/*        borderRadius: 3,*/}
                        {/*        textTransform: 'none',*/}
                        {/*        fontWeight: 600,*/}
                        {/*        px: 2.5,*/}
                        {/*        py: 1.2,*/}
                        {/*        fontSize: '0.95rem',*/}
                        {/*        color: theme.palette.text.primary,*/}
                        {/*        borderColor: alpha(theme.palette.divider, 0.8),*/}
                        {/*        backgroundColor: alpha(theme.palette.background.paper, 0.8),*/}
                        {/*        '&:hover': {*/}
                        {/*            borderColor: theme.palette.primary.main,*/}
                        {/*            backgroundColor: alpha(theme.palette.primary.main, 0.05)*/}
                        {/*        }*/}
                        {/*    }}*/}
                        {/*>*/}
                        {/*    Filters*/}
                        {/*</Button>*/}

                        {/*<Button*/}
                        {/*    variant="outlined"*/}
                        {/*    startIcon={<Download size={18} />}*/}
                        {/*    sx={{*/}
                        {/*        borderRadius: 3,*/}
                        {/*        textTransform: 'none',*/}
                        {/*        fontWeight: 600,*/}
                        {/*        px: 2.5,*/}
                        {/*        py: 1.2,*/}
                        {/*        fontSize: '0.95rem',*/}
                        {/*        color: theme.palette.text.primary,*/}
                        {/*        borderColor: alpha(theme.palette.divider, 0.8),*/}
                        {/*        backgroundColor: alpha(theme.palette.background.paper, 0.8),*/}
                        {/*        '&:hover': {*/}
                        {/*            borderColor: theme.palette.primary.main,*/}
                        {/*            backgroundColor: alpha(theme.palette.primary.main, 0.05)*/}
                        {/*        }*/}
                        {/*    }}*/}
                        {/*>*/}
                        {/*    Export*/}
                        {/*</Button>*/}
                        <Button
                            variant="outlined"
                            startIcon={<SlidersHorizontal size={18} />}
                            onClick={handleOpenRulesDialog}
                            sx={{
                                borderRadius: 3,
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 2.5,
                                py: 1.2,
                                fontSize: '0.95rem',
                                color: theme.palette.text.primary,
                                borderColor: alpha(theme.palette.divider, 0.8),
                                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                                '&:hover': {
                                    borderColor: theme.palette.primary.main,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
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
                                borderRadius: 3,
                                textTransform: 'none',
                                whiteSpace: 'nowrap',
                                fontWeight: 600,
                                px: 2.5,
                                py: 1.2,
                                fontSize: '0.95rem',
                                color: theme.palette.text.primary,
                                borderColor: alpha(theme.palette.divider, 0.8),
                                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                                '&:hover': {
                                    borderColor: theme.palette.primary.main,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
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
                                    borderRadius: 3,
                                    py: 0.5,
                                    px: 0.5,
                                    fontWeight: 500,
                                    backgroundColor: alpha(categoryColors[category] || theme.palette.primary.main, 0.1),
                                    color: categoryColors[category] || theme.palette.primary.main,
                                    border: `1px solid ${alpha(categoryColors[category] || theme.palette.primary.main, 0.2)}`,
                                    '& .MuiChip-deleteIcon': {
                                        color: categoryColors[category] || theme.palette.primary.main,
                                        '&:hover': {
                                            color: alpha(categoryColors[category] || theme.palette.primary.main, 0.7),
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
                                    borderRadius: 3,
                                    py: 0.5,
                                    px: 0.5,
                                    fontWeight: 500,
                                    backgroundColor: activeFilters.type === 'income'
                                        ? alpha('#10b981', 0.1)
                                        : alpha('#ef4444', 0.1),
                                    color: activeFilters.type === 'income' ? '#10b981' : '#ef4444',
                                    border: `1px solid ${activeFilters.type === 'income' ? alpha('#10b981', 0.2) : alpha('#ef4444', 0.2)}`,
                                    '& .MuiChip-deleteIcon': {
                                        color: activeFilters.type === 'income' ? '#10b981' : '#ef4444',
                                        '&:hover': {
                                            color: activeFilters.type === 'income' ? alpha('#10b981', 0.7) : alpha('#ef4444', 0.7)
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
                                fontWeight: 500,
                                fontSize: '0.85rem',
                                color: theme.palette.text.secondary,
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.divider, 0.1)
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
                        borderRadius: 4,
                        overflow: 'auto',
                        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.05)',
                        maxHeight: 'calc(100vh - 520px)',
                        minHeight: 400,
                        mb: 2,
                        '&::-webkit-scrollbar': {
                            width: '10px',
                            height: '10px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: alpha(theme.palette.divider, 0.1),
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: alpha(theme.palette.primary.main, 0.2),
                            borderRadius: '10px',
                            '&:hover': {
                                background: alpha(theme.palette.primary.main, 0.3),
                            }
                        }
                    }}
                >
                    <Table stickyHeader sx={{ minWidth: 800 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox" sx={{
                                    backgroundColor: alpha(theme.palette.background.paper, 0.95)
                                }}>
                                    <Checkbox
                                        indeterminate={selectedRows.length > 0 && selectedRows.length < filteredTransactions.length}
                                        checked={selectedRows.length > 0 && selectedRows.length === filteredTransactions.length}
                                        onChange={handleSelectAll}
                                        sx={{
                                            '&.Mui-checked': {
                                                color: theme.palette.primary.main
                                            },
                                            '&.MuiCheckbox-indeterminate': {
                                                color: theme.palette.primary.main
                                            }
                                        }}
                                    />
                                </TableCell>

                                <TableCell
                                    onClick={() => handleSort('date')}
                                    sx={{
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        color: sortConfig.key === 'date' ? theme.palette.primary.main : theme.palette.text.primary,
                                        backgroundColor: alpha(theme.palette.background.paper, 0.95),
                                        py: 2.5,
                                        '&:hover': { color: theme.palette.primary.main }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        Date
                                        {sortConfig.key === 'date' && (
                                            sortConfig.direction === 'asc' ?
                                                <ArrowUp size={16} style={{ marginLeft: 4 }} /> :
                                                <ArrowDown size={16} style={{ marginLeft: 4 }} />
                                        )}
                                    </Box>
                                </TableCell>

                                <TableCell
                                    onClick={() => handleSort('name')}
                                    sx={{
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        color: sortConfig.key === 'name' ? theme.palette.primary.main : theme.palette.text.primary,
                                        backgroundColor: alpha(theme.palette.background.paper, 0.95),
                                        py: 2.5,
                                        '&:hover': { color: theme.palette.primary.main }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        Merchant
                                        {sortConfig.key === 'name' && (
                                            sortConfig.direction === 'asc' ?
                                                <ArrowUp size={16} style={{ marginLeft: 4 }} /> :
                                                <ArrowDown size={16} style={{ marginLeft: 4 }} />
                                        )}
                                    </Box>
                                </TableCell>

                                <TableCell
                                    onClick={() => handleSort('category')}
                                    sx={{
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        color: sortConfig.key === 'category' ? theme.palette.primary.main : theme.palette.text.primary,
                                        backgroundColor: alpha(theme.palette.background.paper, 0.95),
                                        py: 2.5,
                                        '&:hover': { color: theme.palette.primary.main }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        Category
                                        {sortConfig.key === 'category' && (
                                            sortConfig.direction === 'asc' ?
                                                <ArrowUp size={16} style={{ marginLeft: 4 }} /> :
                                                <ArrowDown size={16} style={{ marginLeft: 4 }} />
                                        )}
                                    </Box>
                                </TableCell>

                                <TableCell sx={{
                                    fontWeight: 600,
                                    backgroundColor: alpha(theme.palette.background.paper, 0.95),
                                    py: 2.5
                                }}>
                                    Actions
                                </TableCell>

                                <TableCell
                                    onClick={() => handleSort('amount')}
                                    align="right"
                                    sx={{
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        color: sortConfig.key === 'amount' ? theme.palette.primary.main : theme.palette.text.primary,
                                        backgroundColor: alpha(theme.palette.background.paper, 0.95),
                                        py: 2.5,
                                        '&:hover': { color: theme.palette.primary.main }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        Amount
                                        {sortConfig.key === 'amount' && (
                                            sortConfig.direction === 'asc' ?
                                                <ArrowUp size={16} style={{ marginLeft: 4 }} /> :
                                                <ArrowDown size={16} style={{ marginLeft: 4 }} />
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                        <CircularProgress size={48} sx={{ color: theme.palette.primary.main }} />
                                        <Typography variant="body1" sx={{ mt: 2, color: theme.palette.text.secondary, fontWeight: 500 }}>
                                            Loading transactions...
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : filteredTransactions.length > 0 ? (
                                filteredTransactions.map((transaction) => (
                                    <TableRow
                                        key={transaction.transactionId}
                                        sx={{
                                            '&:last-child td, &:last-child th': { border: 0 },
                                            '&:hover': {
                                                backgroundColor: alpha(theme.palette.primary.light, 0.07)
                                            },
                                            backgroundColor: selectedRows.includes(transaction.transactionId)
                                                ? alpha(theme.palette.primary.light, 0.12)
                                                : 'inherit',
                                            transition: 'background-color 0.2s ease-in-out'
                                        }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedRows.includes(transaction.transactionId)}
                                                onChange={() => handleRowSelection(transaction.transactionId)}
                                                sx={{
                                                    '&.Mui-checked': {
                                                        color: theme.palette.primary.main
                                                    }
                                                }}
                                            />
                                        </TableCell>

                                        <TableCell sx={{ py: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {transaction.pending ? (
                                                    <Avatar
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            mr: 1.5,
                                                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                                                            color: theme.palette.warning.main,
                                                            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                                                        }}
                                                    >
                                                        <Clock size={16} />
                                                    </Avatar>
                                                ) : (
                                                    <Avatar
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            mr: 1.5,
                                                            bgcolor: alpha(theme.palette.success.main, 0.1),
                                                            color: theme.palette.success.main,
                                                            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                                                        }}
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </Avatar>
                                                )}
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {formatDate(transaction.posted, transaction.date)}
                                                    </Typography>
                                                    {transaction.pending && (
                                                        <Typography variant="caption" sx={{ color: theme.palette.warning.main }}>
                                                            Pending
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        <TableCell sx={{ py: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {transaction.logoUrl ? (
                                                    <Avatar
                                                        src={transaction.logoUrl}
                                                        alt={transaction.merchantName || 'Logo'}
                                                        sx={{ width: 36, height: 36, mr: 1.5 }}
                                                        variant="rounded"
                                                    />
                                                ) : (
                                                    <Avatar
                                                        sx={{
                                                            width: 36,
                                                            height: 36,
                                                            mr: 1.5,
                                                            fontSize: '1rem',
                                                            fontWeight: 600,
                                                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                            color: theme.palette.primary.main,
                                                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                                                        }}
                                                        variant="rounded"
                                                    >
                                                        {(transaction.merchantName || transaction.name || 'T').charAt(0)}
                                                    </Avatar>
                                                )}
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {transaction.name}
                                                    </Typography>
                                                    {transaction.merchantName && transaction.merchantName !== transaction.name && (
                                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                                            {transaction.merchantName}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        <TableCell sx={{ py: 2 }}>
                                            <Chip
                                                label={transaction.categories[0] || 'Uncategorized'}
                                                size="small"
                                                onClick={() => handleOpenCategoryDialog(transaction)}
                                                sx={{
                                                    borderRadius: 3,
                                                    fontWeight: 600,
                                                    backgroundColor: alpha(categoryColors[transaction.categories[0]] || theme.palette.grey[500], 0.1),
                                                    color: categoryColors[transaction.categories[0]] || theme.palette.grey[700],
                                                    border: `1px solid ${alpha(categoryColors[transaction.categories[0]] || theme.palette.grey[500], 0.2)}`,
                                                    py: 0.6,
                                                    px: 0.2,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease-in-out',
                                                    '&:hover': {
                                                        backgroundColor: alpha(categoryColors[transaction.categories[0]] || theme.palette.grey[500], 0.2),
                                                        transform: 'scale(1.05)',
                                                        boxShadow: `0 2px 8px ${alpha(categoryColors[transaction.categories[0]] || theme.palette.grey[500], 0.3)}`
                                                    }
                                                }}
                                            />
                                        </TableCell>

                                        <TableCell sx={{ py: 2 }}>
                                            <Stack direction="row" spacing={1}>
                                                <Tooltip title="Edit transaction">
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            color: theme.palette.primary.main,
                                                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                            borderRadius: 2,
                                                            '&:hover': {
                                                                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                                            }
                                                        }}
                                                    >
                                                        <Edit size={16} />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Delete transaction">
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            color: theme.palette.error.main,
                                                            backgroundColor: alpha(theme.palette.error.main, 0.1),
                                                            borderRadius: 2,
                                                            '&:hover': {
                                                                backgroundColor: alpha(theme.palette.error.main, 0.2),
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>

                                        <TableCell align="right" sx={{ py: 2 }}>
                                            <Box sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                px: 2,
                                                py: 0.75,
                                                borderRadius: 2,
                                                backgroundColor: transaction.amount < 0
                                                    ? alpha('#10b981', 0.1)
                                                    : transaction.amount > 0
                                                        ? alpha('#ef4444', 0.1)
                                                        : 'transparent'
                                            }}>
                                                {transaction.amount < 0 && (
                                                    <ArrowDown
                                                        size={16}
                                                        color="#10b981"
                                                        style={{ marginRight: 6 }}
                                                    />
                                                )}
                                                {transaction.amount > 0 && (
                                                    <ArrowUp
                                                        size={16}
                                                        color="#ef4444"
                                                        style={{ marginRight: 6 }}
                                                    />
                                                )}
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: transaction.amount < 0
                                                            ? '#10b981'
                                                            : transaction.amount > 0
                                                                ? '#ef4444'
                                                                : theme.palette.text.primary
                                                    }}
                                                >
                                                    {formatCurrency(Math.abs(transaction.amount))}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                        <Box sx={{ maxWidth: 400, mx: 'auto', textAlign: 'center' }}>
                                            <Box
                                                sx={{
                                                    width: 96,
                                                    height: 96,
                                                    borderRadius: '50%',
                                                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.3)} 100%)`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mx: 'auto',
                                                    mb: 3,
                                                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                                                }}
                                            >
                                                <Search size={40} color={theme.palette.primary.main} />
                                            </Box>
                                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
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
                                                        borderRadius: 3,
                                                        px: 3,
                                                        py: 1.2,
                                                        fontWeight: 600
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
                                                        borderRadius: 3,
                                                        px: 3,
                                                        py: 1.2,
                                                        fontWeight: 600,
                                                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
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
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            zIndex: 1000,
                            background: gradients.indigo,
                            color: 'white',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
                        }}
                    >
                        <Typography variant="body1" sx={{ fontWeight: 600, mr: 3 }}>
                            {selectedRows.length} {selectedRows.length === 1 ? 'item' : 'items'} selected
                        </Typography>

                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<Trash2 size={16} />}
                            color="error"
                            sx={{
                                mr: 1.5,
                                textTransform: 'none',
                                borderRadius: 3,
                                px: 2,
                                fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)'
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
                                borderRadius: 3,
                                px: 2,
                                fontWeight: 600,
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
                                color: 'rgba(255, 255, 255, 0.8)',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white'
                                }
                            }}
                        >
                            Cancel
                        </Button>
                    </Paper>
                </Grow>
            )}

            {/* Filter Menu */}
            <Menu
                anchorEl={filterAnchorEl}
                open={Boolean(filterAnchorEl)}
                onClose={handleCloseFilterMenu}
                PaperProps={{
                    elevation: 3,
                    sx: {
                        minWidth: 280,
                        maxHeight: 480,
                        mt: 1.5,
                        borderRadius: 3,
                        overflow: 'auto',
                        padding: 2,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
                    }
                }}
            >
                <Typography variant="subtitle1" sx={{ px: 1, pb: 1.5, fontWeight: 700 }}>
                    Transaction Type
                </Typography>

                <Box sx={{ mb: 2 }}>
                    <MenuItem
                        onClick={() => handleTypeFilter('income')}
                        selected={activeFilters.type === 'income'}
                        sx={{
                            py: 1.5,
                            borderRadius: 2,
                            mb: 1,
                            '&.Mui-selected': {
                                backgroundColor: alpha('#10b981', 0.1),
                                '&:hover': {
                                    backgroundColor: alpha('#10b981', 0.2),
                                }
                            }
                        }}
                    >
                        <Avatar
                            sx={{
                                width: 36,
                                height: 36,
                                mr: 2,
                                bgcolor: alpha('#10b981', 0.2),
                                color: '#10b981'
                            }}
                        >
                            <ArrowDown size={18} />
                        </Avatar>
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>Income</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Money received</Typography>
                        </Box>
                    </MenuItem>

                    <MenuItem
                        onClick={() => handleTypeFilter('expense')}
                        selected={activeFilters.type === 'expense'}
                        sx={{
                            py: 1.5,
                            borderRadius: 2,
                            '&.Mui-selected': {
                                backgroundColor: alpha('#ef4444', 0.1),
                                '&:hover': {
                                    backgroundColor: alpha('#ef4444', 0.2),
                                }
                            }
                        }}
                    >
                        <Avatar
                            sx={{
                                width: 36,
                                height: 36,
                                mr: 2,
                                bgcolor: alpha('#ef4444', 0.2),
                                color: '#ef4444'
                            }}
                        >
                            <ArrowUp size={18} />
                        </Avatar>
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>Expense</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Money spent</Typography>
                        </Box>
                    </MenuItem>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle1" sx={{ px: 1, pb: 1.5, fontWeight: 700 }}>
                    Categories
                </Typography>

                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {uniqueCategories.map(category => (
                        <MenuItem
                            key={category}
                            onClick={() => handleCategoryFilter(category)}
                            selected={activeFilters.categories.includes(category)}
                            sx={{
                                py: 1.2,
                                borderRadius: 2,
                                mb: 0.5,
                                '&.Mui-selected': {
                                    backgroundColor: alpha(categoryColors[category] || theme.palette.primary.main, 0.1),
                                    '&:hover': {
                                        backgroundColor: alpha(categoryColors[category] || theme.palette.primary.main, 0.2),
                                    }
                                }
                            }}
                        >
                            <Checkbox
                                checked={activeFilters.categories.includes(category)}
                                sx={{
                                    p: 0.5,
                                    mr: 1.5,
                                    color: alpha(categoryColors[category] || theme.palette.primary.main, 0.5),
                                    '&.Mui-checked': {
                                        color: categoryColors[category] || theme.palette.primary.main
                                    }
                                }}
                            />
                            <Box
                                sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '3px',
                                    bgcolor: categoryColors[category] || theme.palette.primary.main,
                                    mr: 1.5
                                }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {category}
                            </Typography>
                        </MenuItem>
                    ))}
                </Box>
            </Menu>

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
                        borderRadius: 3,
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
                            borderRadius: 2,
                            '&.Mui-selected': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                fontWeight: 600,
                                color: theme.palette.primary.main,
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                }
                            }
                        }}
                    >
                        {range}
                    </MenuItem>
                ))}
                <Divider sx={{my: 1}}/>

                {/* Custom Month Option */}
                <MenuItem
                    onClick={() => {
                        setCustomMonthDialogOpen(true);
                        handleCloseDateRangeMenu();
                    }}
                    selected={activeFilters.dateRange === 'Custom Month'}
                    sx={{
                        py: 1.2,
                        mx: 1,
                        borderRadius: 2,
                        '&.Mui-selected': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            fontWeight: 600,
                            color: theme.palette.primary.main,
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.2),
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

//
//
// const TransactionsPage: React.FC = () => {
//     const [transactions, setTransactions] = useState<Transaction[]>([]);
//     const [isLoading, setIsLoading] = useState<boolean>(false);
//     const [searchTerm, setSearchTerm] = useState<string>('');
//
//     useEffect(() => {
//         document.title = 'Transactions';
//         return () => {
//             document.title = 'Transactions';
//         }
//     }, [])
//
//     useEffect(() => {
//         setIsLoading(true);
//         const fetchTransactions = async() => {
//             try
//             {
//                 const transactionService = TransactionService.getInstance();
//                 let userId = Number(sessionStorage.getItem('userId'));
//                 let startDate = transactionService.getStartDate();
//                 let endDate = new Date().toISOString().split('T')[0];
//                 console.log('EndDate: ', endDate);
//                 const response: Transaction[] = await transactionService.fetchTransactionsByUserAndDateRange(userId, startDate, endDate);
//                 console.log('Transaction Response: ', response);
//                 setTransactions(response || []);
//             }catch(error){
//                 console.error('There was an error fetching the transactions from the server: ', error);
//                 throw error;
//             }finally {
//                 setIsLoading(false);
//             }
//         };
//
//         const timeoutId = setTimeout(() => {
//             fetchTransactions()
//         }, 2000);
//         return () => clearTimeout(timeoutId);
//     }, []);
//
//
//
//     const handleSearchTermChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//         const newSearchTerm = event.target.value;
//         setSearchTerm(newSearchTerm);
//     };
//
//     const formatDate = (postedDate: string | null, transactionDate: string) => {
//         try {
//             // Use posted date if available, otherwise fall back to transaction date
//             const dateToFormat = postedDate || transactionDate;
//             return new Date(dateToFormat).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
//         } catch (error) {
//             console.error('Error formatting date:', error);
//             return 'N/A'; // Fallback if date parsing fails
//         }
//     };
//
//     const filteredTransactions = useMemo(() => {
//         let searchTermLowerCase = searchTerm.toLowerCase().trim();
//         return transactions.filter((transaction) => {
//             const name = transaction.name ?? '';
//             const category = transaction.categories[0]?.toLowerCase() ?? '';
//             const merchantName = transaction.merchantName?.toLowerCase() ?? '';
//             const amount = transaction.amount?.toString() ?? '';
//             const date = formatDate(transaction.posted, transaction.date);
//             return name.includes(searchTermLowerCase) ||
//                 category.includes(searchTermLowerCase) ||
//                 merchantName.includes(searchTermLowerCase) ||
//                 amount.includes(searchTermLowerCase) ||
//                 date.includes(searchTermLowerCase);
//         });
//     }, [transactions, searchTerm]);
//
//
//     const headerConfig = [
//         { label: 'Date', key: 'posted' },
//         { label: 'Name', key: 'name' },
//         { label: 'Category', key: 'categories' },
//         { label: 'Actions', key: null },
//         { label: 'Amount', key: 'amount' }
//     ];
//
//
//     const handleCategoryChange = (transactionId: string, newCategory: string) => {
//         setTransactions(prevTransactions =>
//             prevTransactions.map(transaction =>
//                 transaction.transactionId === transactionId
//                     ? { ...transaction, categories: [newCategory] }
//                     : transaction
//             )
//         );
//     }
//
//     return (
//         <Box sx={{ p: 3,
//             maxWidth: 'calc(100% - 240px)',
//             ml: '240px',
//             backgroundColor: '#F3F4F6'}}>
//             <Sidebar />
//             <Typography variant="h4" sx={{
//                 fontWeight: 'bold',
//                 color: '#3E2723', // Dark brown color for "Transactions"
//                 mb: 2,
//                 textShadow: '1px 1px 2px rgba (0,0,0,0.1)'
//             }}>
//                 Transactions
//             </Typography>
//
//             <Paper
//                 elevation={0}
//                 sx={{
//                     display: 'flex',
//                     alignItems: 'center', // Light grey background
//                     borderRadius: '8px',
//                     p: '4px 16px',
//                     mb: 3,
//                     transition: 'box-shadow 0.3s ease-in-out',
//                     '&:hover': {
//                         boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
//                     }
//                 }}
//             >
//                 <Search size={20} />
//                 <TextField
//                     variant="standard"
//                     placeholder="Search your transactions..."
//                     fullWidth
//                     onChange={handleSearchTermChange}
//                     InputProps={{
//                         disableUnderline: true,
//                         startAdornment: (
//                             <InputAdornment position="start">
//                                 <Box sx={{ width: 8 }} />
//                             </InputAdornment>
//                         ),
//                     }}
//                     sx={{
//                         '& .MuiInputBase-input': {
//                             pl: 1,
//                             fontSize: '0.875rem',
//                             '&::placeholder': {
//                                 color: '#9E9E9E',
//                                 opacity: 1,
//                             },
//                         },
//                     }}
//                 />
//             </Paper>
//
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
//                 <Box>
//                     {['Date', 'Category', 'Account', 'Amount'].map((label) => (
//                         <Button
//                             key={label}
//                             variant="outlined"
//                             sx={{
//                                 mr: 1,
//                                 borderRadius: 2,
//                                 color: '#3F51B5',
//                                 borderColor: '#3F51B5',
//                                 '&:hover': {
//                                     backgroundColor: '#E8EAF6'
//                                 }
//                             }}
//                         >
//                             {label}
//                         </Button>
//                     ))}
//                 </Box>
//                 <Box>
//                     <Button
//                         variant="outlined"
//                         startIcon={<ArrowDownToLine size={20} />}
//                         sx={{
//                             mr: 2,
//                             borderRadius: 2,
//                             color: '#3F51B5',
//                             borderColor: '#3F51B5',
//                             '&:hover': {
//                                 backgroundColor: '#E8EAF6'
//                             }
//                         }}
//                     >
//                         Export
//                     </Button>
//                     <Button
//                         variant="outlined"
//                         endIcon={<ChevronDown size={20} />}
//                         sx={{
//                             borderRadius: 2,
//                             color: '#3F51B5',
//                             borderColor: '#3F51B5',
//                             '&:hover': {
//                                 backgroundColor: '#E8EAF6'
//                             }
//                         }}
//                     >
//                         Sort by date
//                     </Button>
//                 </Box>
//             </Box>
//
//             <TableContainer component={Paper} sx={{ boxShadow: 3,
//                                                     borderRadius: 4,
//                                                     overflow: 'hidden',
//                                                     transition: 'box-shadow 0.3s ease-in-out',
//                                                     '&:hover': {
//                                                     boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
//                                                     }}}>
//                 <Table sx={{ minWidth: 650 }}>
//                     <TableHead>
//                         <TableRow sx={{ backgroundColor: 'background.paper' }}>
//                             <TableCell padding="checkbox">
//                                 <Checkbox />
//                             </TableCell>
//                             {['Date', 'Name', 'Category', 'Actions', 'Amount'].map((header) => (
//                                 <TableCell
//                                     key={header}
//                                     sx={{
//                                         fontWeight: 'bold',
//                                         color: '#1A237E',
//                                         fontSize: '0.95rem'
//                                     }}
//                                     align={header === 'Amount' ? 'right' : 'left'}
//                                 >
//                                     {header}
//                                 </TableCell>
//                             ))}
//                         </TableRow>
//                     </TableHead>
//                     <TableBody>
//                         {isLoading ? (
//                             <TableRow>
//                                 <TableCell colSpan={6} align="center">
//                                     <CircularProgress />
//                                 </TableCell>
//                             </TableRow>
//                         ) : (
//                             filteredTransactions.map((transaction) => (
//                                 <TableRow
//                                     key={transaction.transactionId}
//                                     sx={{
//                                         '&:last-child td, &:last-child th': { border: 0 },
//                                         '&:hover': {
//                                             backgroundColor: '#F5F5F5'
//                                         },
//                                         transition: 'background-color 0.2s ease-in-out'
//                                     }}
//                                 >
//                                     <TableCell padding="checkbox">
//                                         <Checkbox />
//                                     </TableCell>
//                                     <TableCell sx={{fontWeight: 'bold'}}> {formatDate(transaction.posted, transaction.date)}</TableCell>
//                                     <TableCell sx={{fontWeight: 'bold'}}>
//                                         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                                             {transaction.logoUrl && (
//                                                 <img
//                                                     src={transaction.logoUrl}
//                                                     alt={`${transaction.merchantName} logo`}
//                                                     style={{ width: 24, height: 24, marginRight: 8, borderRadius: '50%' }}
//                                                 />
//                                             )}
//                                             {transaction.name}
//                                         </Box>
//                                     </TableCell>
//                                     <TableCell>
//                                         <CategoryDropdown
//                                             category={transaction.categories[0]}
//                                             onCategoryChange={(newCategory) => handleCategoryChange(transaction.transactionId, newCategory)}
//                                         />
//                                     </TableCell>
//                                     <TableCell>
//                                         <IconButton size="small" sx={{ borderRadius: 2 }}>
//                                             <Edit size={16} />
//                                         </IconButton>
//                                         <IconButton size="small" sx={{ borderRadius: 2 }}>
//                                             <XCircle size={16} />
//                                         </IconButton>
//                                     </TableCell>
//                                     <TableCell align="right" sx={{fontWeight: 'bold'}}>
//                                         ${transaction.amount.toFixed(2)}
//                                     </TableCell>
//                                 </TableRow>
//                             ))
//                         )}
//                     </TableBody>
//                 </Table>
//             </TableContainer>
//         </Box>
//     );
//
// }

export default TransactionsPage;