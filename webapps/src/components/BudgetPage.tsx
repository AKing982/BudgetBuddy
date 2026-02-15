import {addMonths, endOfMonth, format, startOfMonth, subMonths} from 'date-fns';
import {
    Box,
    Button,
    Grid,
    Typography,
    Card,
    IconButton,
    useTheme,
    alpha,
    Container,
    Paper,
    Grow,
    Chip,
    Skeleton,
    Stack,
    LinearProgress, Snackbar, Alert, Dialog, CircularProgress, Backdrop
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    Share2,
    PieChart,
    Award,
    ImportIcon, Delete, Clock
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from './Sidebar';
import BudgetPeriodTable from './BudgetPeriodTable';
import DynamicBudgetPanel from "./DynamicBudgetPanel";
import BudgetRunnerService, { BudgetRunnerResult } from "../services/BudgetRunnerService";
import CsvUploadService  from "../services/CsvUploadService";
import {
    BudgetCategoryStats,
    BudgetStats
} from "../utils/Items";
import DateRange from "../domain/DateRange";
import CSVImportDialog from "./CSVImportDialog";
import BudgetService from "../services/BudgetService";
import {BudgetQuestions} from "../utils/BudgetUtils";
import BudgetQuestionnaireForm from "./BudgetQuestionnaireForm";
import ManageBudgetsDialog from "./ManageBudgetsDialog";
import BudgetCategoriesService from "../services/BudgetCategoriesService";
import UserService from "../services/UserService";
import TransactionCategoryService from "../services/TransactionCategoryService";
import BudgetOverview from "./BudgetOverview";
import TopExpenseCategory from "./TopExpenseCategory";


interface DateArrays {
    startDate: [number, number, number];
    endDate: [number, number, number];
}

// Define gradients for modern UI elements
const gradients = {
    blue: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    green: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    purple: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
    orange: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
    indigo: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
    teal: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)'
};


const BudgetPage: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [budgetType, setBudgetType] = useState('50/30/20');
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
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>()
    const [newBudgetDialogOpen, setNewBudgetDialogOpen] = useState<boolean>(false);
    const [manageBudgetsDialogOpen, setManageBudgetsDialogOpen] = useState<boolean>(false);
    const [isBudgetCategoryLoading, setIsBudgetCategoryLoading] = useState<boolean>(false);
    const [budgetCategoryLoadingMessage, setBudgetCategoryLoadingMessage] = useState<string>('');
    const userService = UserService.getInstance();

    const uploadService = new CsvUploadService();
    const budgetService = BudgetService.getInstance();

    const theme = useTheme();

    const handlePreviousMonth = () => {
        setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
    };

    const handleImportClick = () => {
        setImportDialogOpen(true);
    }

    const handleImportClose = () => {
        setImportDialogOpen(false);
    }


    useEffect(() => {
        let userId = Number(sessionStorage.getItem('userId'));
        let now = new Date();
        const budgetStartDate = startOfMonth(currentMonth);
        const budgetEndDate = endOfMonth(currentMonth);
        console.log('Budget End Date {}', budgetEndDate);
        const fetchNewBudgetCategories = async () => {
            try {
                console.log('Creating new Budget Categories');
                const budgetCategories = await budgetCategoryService.createBudgetCategoriesForDateRange(
                    userId,
                    budgetStartDate,
                    budgetEndDate
                );
                console.log('Successfully created new budget categories: ', budgetCategories);
            } catch(error) {
                console.error(`There was an error fetching new budget categories for userId ${userId}:`, error);
            }
        };

        const checkAndFetchBudgetCategories = async () => {
            try {
                const anyNewTransactionCategories = await transactionCategoryService.checkNewTransactionCategoriesByDateRange(
                    userId,
                    budgetStartDate,
                    budgetEndDate
                );

                if (anyNewTransactionCategories) {
                    setIsBudgetCategoryLoading(true);
                    await fetchNewBudgetCategories();

                    fetchBudgetData(currentMonth, true);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    setIsBudgetCategoryLoading(false);
                }
            } catch(error) {
                console.error('Error checking for new transaction categories:', error);
                setSnackbarMessage('Failed to create budget categories');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
                setIsBudgetCategoryLoading(false);
            }
        };

        checkAndFetchBudgetCategories();
    }, [userId, currentMonth]);

    useEffect(() => {
        let userId = Number(sessionStorage.getItem('userId'));
        const now = new Date();
        const budgetStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const budgetEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const fetchUpdatedBudgetCategories = async () => {
            try {
                const anyUpdatedTransactionCategories = await transactionCategoryService.checkUpdatedTransactionCategoriesByDateRange(
                    userId,
                    budgetStartDate,
                    budgetEndDate
                );

                if (anyUpdatedTransactionCategories) {
                    setIsBudgetCategoryLoading(true);
                    console.log('Updating budget categories...');
                    await budgetCategoryService.updateBudgetCategoriesByMonth(
                        userId,
                        budgetStartDate,
                        budgetEndDate
                    );

                    await fetchBudgetData(currentMonth);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    setIsBudgetCategoryLoading(false);

                    console.log('Successfully updated budget categories');
                } else {
                    console.log('No updated transaction categories found');
                }
            } catch(error) {
                console.error(`There was an error fetching updated budget categories for userId ${userId}:`, error);
                setSnackbarMessage('Failed to update budget categories');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
                setIsBudgetCategoryLoading(false);
            }
        };

        fetchUpdatedBudgetCategories();
    }, [currentMonth]);

    useEffect(() => {
        const fetchUserHasUploadAccess = async() => {
            try {
                const userId = Number(sessionStorage.getItem('userId'));
                const hasUploadAccess = await userService.fetchUserOverrideEnabled(userId);
                setUploadAccess(hasUploadAccess);
            } catch (error) {
                console.error("There was an error fetching user upload access: ", error);
            }
        };
        fetchUserHasUploadAccess();
    });

    const doesBudgetExistForBeginningYear = async (retryCount = 0) =>
    {
        try
        {
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            console.log('Current Year: ', currentYear);
            console.log('UserID: ', userId);

            console.log('Year Type: ', typeof(currentYear));
            console.log('UserID type: ', typeof(userId));

            if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const exists = await budgetService.checkIfBudgetExistsForYear(userId, currentYear);
            if (!exists && retryCount === 0) {
                console.log('Budget not found, retrying...');
                return await doesBudgetExistForBeginningYear(1);
            }

            console.log('Checking if budget exists for beginning year:', exists);
            if(!exists){
                setNewBudgetDialogOpen(true);
            }
            return exists;
        }catch(error){
            console.error('Error checking if budget exists for beginning year:', error);
            setSnackbarMessage('Failed to check if budget exists for beginning year');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return false;
        }
    }

    useEffect(() => {
        doesBudgetExistForBeginningYear();
    }, [userId]);

    const handleNewBudgetDialogClose = () => {
        setNewBudgetDialogOpen(false);
    }

    const handleNewBudgetSubmit = async (budgetData: BudgetQuestions) => {
        setNewBudgetDialogOpen(false);
        setSnackbarMessage('Budget created Successfully! Refreshing');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        await fetchBudgetData(currentMonth);
    }

    const handleImportComplete = async (data: {file: File; startDate: string, endDate: string, institution: string}) => {
        try
        {
            console.log('Starting CSV import...');

            setIsLoading(true);
            setError(null);

            const result = await uploadService.uploadCsv({
                userId: userId,
                file: data.file,
                startDate: data.startDate,
                endDate: data.endDate,
                institution: data.institution
            });
            console.log('CSV Result: ', result);

            if (result.success) {
                console.log('CSV import successful:', result.message);
                setImportDialogOpen(false);
            } else {
                setError(result.message || 'Import failed');
            }
        }catch(error){
            console.error('Error importing CSV:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to import CSV file';

            setSnackbarMessage(errorMessage);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);

            setError(errorMessage);
        }finally{
            setIsLoading(false);
        }

        console.log('Import completed');
        setImportDialogOpen(false);
    }

    useEffect(() => {
        document.title = 'Budgets';
        setTimeout(() => setAnimateIn(true), 100);

        return () => {
            document.title = "BudgetBuddy";
        };
    }, []);


    const fetchBudgetData = async (date: Date, useBudgetCategoryLoading: boolean = false) => {
        try {
            if(useBudgetCategoryLoading){
                setIsBudgetCategoryLoading(true);
            }else{
                setIsLoading(true);
            }
            setError(null);

            const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
            const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const results = await budgetRunnerService.getBudgetsByDateRange(
                userId,
                startDate,
                endDate
            );
            console.log('Budget results: ', results);
            const budgetCategoryStats = results[0]?.budgetCategoryStats;
            if(areAllBudgetCategoriesEmpty(budgetCategoryStats))
            {
                console.log('All budget categories are empty, fetching from budget category service');
                try
                {
                    const budgetCategories = await budgetCategoryService.createBudgetCategoriesForDateRange(userId, startDate, endDate);
                    console.log('Created budget categories: ', budgetCategories);

                    const newBudgetResults = await budgetRunnerService.getBudgetsByDateRange(userId, startDate, endDate);
                    console.log('New budget results: ', newBudgetResults);
                    setBudgetData(newBudgetResults);
                }catch(error){
                    console.error('Error creating budget categories: ', error);
                    if (error instanceof Error) {
                        if (error.message.includes('No budget found')) {
                            setError('No budget exists for this period. Please create a budget first.');
                        } else {
                            setError('Failed to create budget categories. Please try again.');
                        }
                    } else {
                        setError('An unexpected error occurred.');
                    }
                    setBudgetData([]);
                }
            }
            else{
                setBudgetData(results);
            }
        } catch (err) {
            setError('Failed to fetch budget data. Please try again later.');
            console.error('Error fetching budget data:', err);
        } finally {
            if (useBudgetCategoryLoading) {
                setIsBudgetCategoryLoading(false);
                setBudgetCategoryLoadingMessage('');
            } else {
                setIsLoading(false);
            }
        }
    };

    const isEmpty = <T,>(array: T[] | null | undefined): boolean => {
        return !array || array.length === 0;
    };

    const areAllBudgetCategoriesEmpty = (stats: BudgetCategoryStats | undefined) : boolean =>
    {
        if(!stats){
            return true;
        }
        return (
            (stats.expenseCategories === null) &&
            (stats.incomeCategories === null) &&
            isEmpty(stats.topExpenseCategories) &&
            (stats.savingsCategories === null) &&
            isEmpty(stats.budgetPeriodCategories)
        );
    };

    const defaultBudgetStats: BudgetStats = {
        averageSpendingPerDay: 0,
        budgetId: 0,
        dateRange: new DateRange(new Date(), new Date()),
        healthScore: 0,
        monthlyProjection: null,
        remaining: 0,
        totalBudget: 0,
        totalSaved: 0,
        totalSpent: 0
    };

    const handleManageBudgetsDialogOnClose = () => {
        setManageBudgetsDialogOpen(false);
    }

    const handleManageBudgetsDialogOpen = () => {
        setManageBudgetsDialogOpen(true);
    };

    const budgetStats = useMemo(() => {
        if (!budgetData?.length) {
            return defaultBudgetStats;
        }
        const item = budgetData[0];
        const stats = item?.budgetStats[0];
        const categoryStats = item?.budgetCategoryStats;
        if(!stats || !categoryStats){
            return defaultBudgetStats;
        }

        const expenseCategories = categoryStats.expenseCategories;
        const incomeCategories = categoryStats.incomeCategories;
        const savingsCategories = categoryStats.savingsCategories;

        const totalSpent = expenseCategories?.actualExpenses ?? 0;
        const totalSaved = savingsCategories?.actualSavedAmount ?? 0;
        const totalBudget = item.budget?.budgetAmount ?? 0;
        const totalIncome = incomeCategories?.actualBudgetedIncome ?? 0;
        const remaining = stats.totalBudget - totalSpent - totalSaved;

        const startDate = (stats.dateRange.startDate as unknown) as number[];
        const endDate = (stats.dateRange.endDate as unknown) as number[];

        return {
            averageSpendingPerDay: stats.averageSpendingPerDay ?? 0,
            budgetId: stats.budgetId,
            dateRange: new DateRange(
                new Date(startDate[0], startDate[1] - 1, startDate[2]),
                new Date(endDate[0], endDate[1] - 1, endDate[2])
            ),
            healthScore: stats.healthScore ?? 0,
            monthlyProjection: stats.monthlyProjection,
            remaining: remaining,
            totalBudget: stats.totalBudget,
            totalSaved: totalSaved,
            totalSpent: totalSpent
        };
    }, [budgetData]);

    const metrics = useMemo(() => {
        const today = new Date();
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const currentDate = today.getDate();

        let daysElapsed = currentDate;
        let daysRemaining = daysInMonth - currentDate;

        if (currentMonth.getMonth() < today.getMonth() || currentMonth.getFullYear() < today.getFullYear()) {
            daysElapsed = daysInMonth;
            daysRemaining = 0;
        }
        else if (currentMonth.getMonth() > today.getMonth() || currentMonth.getFullYear() > today.getFullYear()) {
            daysElapsed = 0;
            daysRemaining = daysInMonth;
        }

        const percentElapsed = (daysElapsed / daysInMonth) * 100;
        const idealSpendRate = budgetStats.totalBudget / daysInMonth;
        const actualSpendRate = budgetStats.totalSpent / (daysElapsed || 1);
        const dailyBudget = budgetStats.remaining / (daysRemaining || 1);

        const idealSpentSoFar = budgetStats.totalBudget * (percentElapsed / 100);
        const spendingDifference = idealSpentSoFar - budgetStats.totalSpent;
        const isUnderBudget = spendingDifference > 0;

        return {
            daysElapsed,
            daysRemaining,
            percentElapsed,
            idealSpendRate,
            actualSpendRate,
            dailyBudget,
            isUnderBudget,
            spendingDifference: Math.abs(spendingDifference)
        };
    }, [currentMonth, budgetStats]);

    const formatCurrency = (amount: number) : string => {
        const absAmount = Math.abs(amount);
        const formatted = absAmount.toFixed(2);
        return amount < 0 ? `$0` : `$${formatted}`;
    }

    const handleBudgetUpdated = async () => {
        setManageBudgetsDialogOpen(false);
        setSnackbarMessage('Budget updated successfully! Refreshing data...');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        await fetchBudgetData(currentMonth);
    };

    const topExpenseCategories = useMemo(() => {
        if (!budgetData?.length) return [];

        return budgetData.reduce<any[]>((acc, budget) => {
            const stats = budget.budgetCategoryStats;
            if (!stats || !stats.topExpenseCategories) {
                return acc;
            }

            const mappedExpenses = stats.topExpenseCategories.map(expense => ({
                categoryName: expense.category,
                budgetedAmount: expense.budgetedExpenses,
                actualAmount: expense.actualExpenses,
                remainingAmount: expense.remainingExpenses,
                startDate: expense.startDate,
                endDate: expense.endDate,
                isActive: expense.active,
                isRecurring: false,
                isCustom: false
            }));

            return [...acc, ...mappedExpenses];
        }, []);
    }, [budgetData]);

    const overviewCategories = useMemo(() => {
        if (!budgetData?.length) return [];

        const result = budgetData[0];
        const categoryStats = result?.budgetCategoryStats;

        const categories = [];

        if (categoryStats?.expenseCategories) {
            categories.push({
                category: 'Expenses',
                budgetedExpenses: categoryStats.expenseCategories.budgetedExpenses,
                actualExpenses: categoryStats.expenseCategories.actualExpenses,
                remainingExpenses: categoryStats.expenseCategories.remainingExpenses
            });
        }

        if (categoryStats?.incomeCategories) {
            categories.push({
                category: 'Income',
                budgetedExpenses: categoryStats.incomeCategories.budgetedIncome,
                actualExpenses: categoryStats.incomeCategories.actualBudgetedIncome,
                remainingExpenses: categoryStats.incomeCategories.remainingIncome
            });
        }

        if (categoryStats?.savingsCategories) {
            categories.push({
                category: 'Savings',
                budgetedExpenses: categoryStats.savingsCategories.budgetedSavingsTarget,
                actualExpenses: categoryStats.savingsCategories.actualSavedAmount,
                remainingExpenses: categoryStats.savingsCategories.remainingToSave
            });
        }

        return categories;
    }, [budgetData]);

    const budgetCategories = useMemo(() => {
        if (!budgetData?.length) return [];

        const result = budgetData[0];
        const periodCategories = result?.budgetCategoryStats?.budgetPeriodCategories || [];

        return periodCategories.map(category => ({
            categoryName: category.category,
            budgetedAmount: category.budgeted,
            actualAmount: category.actual,
            remainingAmount: category.remaining,
            isRecurring: category.isRecurring || false,
            isCustom: category.isCustom || false
        }));
    }, [budgetData]);

    const recurringCategories = useMemo(() => {
        return budgetCategories.filter(cat => cat.isRecurring);
    }, [budgetCategories]);

    return (
        <Box sx={{
            maxWidth: 'calc(100% - 240px)',
            ml: '240px',
            minHeight: '100vh',
            background: '#f9fafc',
            backgroundImage: 'radial-gradient(rgba(0, 0, 120, 0.01) 2px, transparent 2px)',
            backgroundSize: '40px 40px'
        }}>
            <Sidebar />
            {isBudgetCategoryLoading && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                    }}
                >
                    <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {budgetCategoryLoadingMessage}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Building Budget Categories, Please Wait....
                    </Typography>
                </Box>
            )}
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Header with title and month navigation */}
                <Grow in={animateIn} timeout={600}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 4,
                        flexDirection: { xs: 'column', sm: 'row' },
                        textAlign: { xs: 'center', sm: 'left' },
                        gap: 2
                    }}>
                        <Box>
                            <Typography variant="h4" component="h1" sx={{
                                fontWeight: 800,
                                color: theme.palette.text.primary,
                                letterSpacing: '-0.025em'
                            }}>
                                {format(currentMonth, 'MMMM yyyy')} Budget
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                                Track your progress and stay within your spending limits
                            </Typography>
                        </Box>

                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <IconButton
                                onClick={handlePreviousMonth}
                                disabled={isLoading}
                                sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                                    }
                                }}
                            >
                                <ChevronLeft />
                            </IconButton>

                            <Card sx={{
                                px: 2.5,
                                py: 1,
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: 2,
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                            }}>
                                <Calendar size={18} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {format(currentMonth, 'MMMM yyyy')}
                                </Typography>
                            </Card>

                            <IconButton
                                onClick={handleNextMonth}
                                disabled={isLoading}
                                sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                                    }
                                }}
                            >
                                <ChevronRight />
                            </IconButton>
                            <Button
                                variant="outlined"
                                startIcon={<ImportIcon size={18} />}
                                onClick={handleImportClick}
                                disabled={!uploadAccess}
                                sx={{
                                    ml: 1,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderColor: alpha(theme.palette.divider, 0.8),
                                    color: theme.palette.text.primary,
                                    '&:hover': {
                                        borderColor: theme.palette.primary.main,
                                        backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                    }
                                }}>
                                Import
                            </Button>
                            <CSVImportDialog
                                open={importDialogOpen}
                                onClose={handleImportClose}
                                onImport={handleImportComplete}
                            />
                            <Button
                                variant="outlined"
                                startIcon={<Clock size={18}/>}
                                onClick={handleManageBudgetsDialogOpen}
                                sx={{
                                    ml: 1,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderColor: alpha(theme.palette.divider, 0.8),
                                    color: theme.palette.text.primary,
                                    '&:hover': {
                                        borderColor: theme.palette.primary.main,
                                        backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                    }
                                }}>
                                Manage
                            </Button>
                            <ManageBudgetsDialog
                                open={manageBudgetsDialogOpen}
                                onClose={handleManageBudgetsDialogOnClose}
                                onBudgetUpdated={handleBudgetUpdated}/>
                        </Box>
                    </Box>
                </Grow>

                {/* Error Message */}
                {error && (
                    <Grow in={true} timeout={800}>
                        <Paper sx={{
                            mb: 4,
                            p: 3,
                            bgcolor: alpha(theme.palette.error.main, 0.1),
                            color: theme.palette.error.main,
                            borderRadius: 3,
                            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    bgcolor: alpha(theme.palette.error.main, 0.2),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 2
                                }}
                            >
                                <Award size={24} color={theme.palette.error.main} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Error Loading Budget Data
                                </Typography>
                                <Typography variant="body2">
                                    {error}
                                </Typography>
                            </Box>
                        </Paper>
                    </Grow>
                )}

                {/* Budget Summary Stats - 4 Cards */}
                <Grow in={animateIn} timeout={800}>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {/* Total Budget */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{
                                p: 3,
                                borderRadius: 4,
                                height: '100%',
                                background: gradients.blue,
                                color: 'white',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
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
                                <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>
                                    Total Budget
                                </Typography>
                                {isLoading ? (
                                    <Skeleton variant="text" width="80%" height={48} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
                                ) : (
                                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        ${budgetStats.totalBudget.toLocaleString()}
                                    </Typography>
                                )}
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                    for {format(currentMonth, 'MMMM yyyy')}
                                </Typography>
                            </Card>
                        </Grid>

                        {/* Remaining Budget */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{
                                p: 3,
                                borderRadius: 4,
                                height: '100%',
                                background: gradients.green,
                                color: 'white',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
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
                                <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>
                                    Remaining
                                </Typography>
                                {isLoading ? (
                                    <Skeleton variant="text" width="80%" height={48} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
                                ) : (
                                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        {formatCurrency(budgetStats.remaining)}
                                    </Typography>
                                )}
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                        {metrics.daysRemaining} days left
                                    </Typography>
                                    <Chip
                                        label={`$${Math.round(metrics.dailyBudget)}/day`}
                                        size="small"
                                        sx={{
                                            ml: 1,
                                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                                            color: 'white',
                                            fontWeight: 600,
                                            height: 20,
                                            fontSize: '0.7rem'
                                        }}
                                    />
                                </Box>
                            </Card>
                        </Grid>

                        {/* Total Spent */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{
                                p: 3,
                                borderRadius: 4,
                                height: '100%',
                                background: gradients.purple,
                                color: 'white',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
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
                                <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>
                                    Total Spent
                                </Typography>
                                {isLoading ? (
                                    <Skeleton variant="text" width="80%" height={48} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
                                ) : (
                                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        ${budgetStats.totalSpent.toLocaleString()}
                                    </Typography>
                                )}
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                        Avg. ${Math.round(metrics.actualSpendRate)}/day
                                    </Typography>
                                    {metrics.isUnderBudget ? (
                                        <Chip
                                            label="Under budget"
                                            size="small"
                                            sx={{
                                                ml: 1,
                                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                fontWeight: 600,
                                                height: 20,
                                                fontSize: '0.7rem'
                                            }}
                                        />
                                    ) : (
                                        <Chip
                                            label="Over budget"
                                            size="small"
                                            sx={{
                                                ml: 1,
                                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                fontWeight: 600,
                                                height: 20,
                                                fontSize: '0.7rem'
                                            }}
                                        />
                                    )}
                                </Box>
                            </Card>
                        </Grid>

                        {/* Total Saved */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{
                                p: 3,
                                borderRadius: 4,
                                height: '100%',
                                background: gradients.teal,
                                color: 'white',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
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
                                <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>
                                    Total Saved
                                </Typography>
                                {isLoading ? (
                                    <Skeleton variant="text" width="80%" height={48} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
                                ) : (
                                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        ${budgetStats.totalSaved.toLocaleString()}
                                    </Typography>
                                )}
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                    across all categories
                                </Typography>
                            </Card>
                        </Grid>
                    </Grid>
                </Grow>

                {/* Main Content */}
                <Grid container spacing={4}>
                    {/* Left Column - Budget Period Table Only */}
                    <Grid item xs={12} lg={8}>
                        <Stack spacing={4}>
                            {/* Budget Overview with Toggle */}
                            <Grow in={animateIn} timeout={900}>
                                <Card sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                                }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                                        Budget Overview
                                    </Typography>
                                    <BudgetOverview isLoading={isLoading} data={budgetData} />
                                </Card>
                            </Grow>

                            {/* Top Expense Categories */}
                            <Grow in={animateIn} timeout={1000}>
                                <Card sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                                }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                                        Top Spending Categories
                                    </Typography>
                                    <TopExpenseCategory isLoading={isLoading} categories={topExpenseCategories} />
                                </Card>
                            </Grow>

                            {/* Budget Period Table */}
                            <Grow in={animateIn} timeout={1100}>
                                <Card sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                                }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                                        Budget Breakdown
                                    </Typography>
                                    <BudgetPeriodTable isLoading={isLoading} data={budgetData} />
                                </Card>
                            </Grow>
                        </Stack>
                    </Grid>

                    {/* Right Column - Dynamic Panel */}
                    <Grid item xs={12} lg={4}>
                        <Grow in={animateIn} timeout={1000}>
                            <Card sx={{
                                p: 3,
                                borderRadius: 3,
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                                position: 'sticky',
                                top: 24
                            }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                                    Budget Analytics
                                </Typography>
                                <DynamicBudgetPanel
                                    isLoading={isLoading}
                                    topSpendingCategories={topExpenseCategories}
                                    overviewCategories={overviewCategories}
                                    recurringCategories={recurringCategories}
                                    budgetStats={budgetStats}
                                    allCategories={budgetCategories}
                                />
                            </Card>
                        </Grow>
                    </Grid>
                </Grid>
            </Container>

            <Dialog
                open={newBudgetDialogOpen}
                onClose={handleNewBudgetDialogClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx:{
                        borderRadius: 2,
                        maxHeight: '90vh'
                    }
                }}>
                <Box sx={{p: 2}}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2
                    }}>
                        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                            Create Budget for {new Date().getFullYear()}
                        </Typography>
                        <IconButton onClick={handleNewBudgetDialogClose}>
                            <Delete />
                        </IconButton>
                    </Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        No budget found for {new Date().getFullYear()}. Let's create one!
                    </Alert>
                    <BudgetQuestionnaireForm
                        onSubmit={handleNewBudgetSubmit}
                        skipHistoricalData={true}
                    />
                </Box>
            </Dialog>

            <Snackbar
                open={!!successMessage}
                autoHideDuration={6000}
                onClose={() => setSuccessMessage(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>

            <Backdrop
                sx={{
                    color: '#fff',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)'
                }}
                open={isLoading && !isBudgetCategoryLoading}
            >
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress color="inherit" size={60} />
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Importing CSV data...
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                        Please wait while we process your transactions
                    </Typography>
                </Box>
            </Backdrop>

            <Snackbar
                open={snackBarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default BudgetPage;