import React, {useEffect, useState} from 'react';
import {
    Box,
    Grid,
    Typography,
    Paper,
    Button,
    LinearProgress,
    Chip,
    Card,
    CardContent,
    Avatar,
    Divider,
    useMediaQuery,
    useTheme,
    Dialog,
    DialogTitle,
    AlertTitle,
    Alert,
    DialogContent,
    DialogActions,
    Backdrop,
    CircularProgress,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
} from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import {
    TrendingUp,
    TrendingDown,
    AccountBalance,
    Savings,
    CreditCard,
    ShoppingCart,
    Restaurant,
    LocalGasStation,
    Home,
    MoreVert,
    CheckCircle,
    Warning,
    ArrowUpward,
    ArrowDownward,
    CalendarToday,
    Replay,
    Schedule,
} from '@mui/icons-material';
import {AlertCircle, Upload} from "lucide-react";
import Sidebar from "./Sidebar";
import PlaidService from "../services/PlaidService";
import UserService from '../services/UserService';
import CsvUploadService from "../services/CsvUploadService";
import CSVImportDialog from "./CSVImportDialog";

const SnackbarAlert = React.forwardRef<HTMLDivElement, AlertProps>(
    function SnackbarAlert(props, ref) {
        return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
    }
);

interface Receipt {
    id: number;
    store: string;
    date: string;
    time: string;
    amount: number;
    items: number;
    tags: string[];
    color: string;
}

interface RecurringTransaction {
    id: number;
    name: string;
    category: string;
    amount: number;
    frequency: 'monthly' | 'weekly' | 'yearly';
    nextDue: string;
    daysUntilDue: number;
    status: 'upcoming' | 'due-soon' | 'overdue';
    icon: React.ReactNode;
    color: string;
}

interface Transaction {
    id: number;
    date: string;
    description: string;
    category: string;
    amount: number;
    balance: number;
    type: 'income' | 'expense';
}

interface BudgetGoal {
    id: number;
    name: string;
    current: number;
    target: number;
    percentage: number;
    status: 'on-track' | 'warning' | 'exceeded';
}

interface CategorySpending {
    category: string;
    amount: number;
    percentage: number;
    icon: React.ReactNode;
    color: string;
}

const DashboardPage: React.FC = () => {
    const [uploadReminderOpen, setUploadReminderOpen] = useState<boolean>(false);
    const [checkingTransactions, setCheckingTransactions] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
    const [error, setError] = useState<string | null>(null);
    const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);

    // Data states
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
    const [groceryBudget, setGroceryBudget] = useState<BudgetGoal | null>(null);
    const [topCategories, setTopCategories] = useState<CategorySpending[]>([]);
    const [totalBudget, setTotalBudget] = useState({ current: 0, target: 0, percentage: 0 });
    const [recentReceipts, setRecentReceipts] = useState<Receipt[]>([]);


    const userFullName = sessionStorage.getItem('fullName');
    const userId = Number(sessionStorage.getItem('userId'));
    const theme = useTheme();
    const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
    const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));
    const plaidService = PlaidService.getInstance();
    const userService = UserService.getInstance();
    const csvUploadService = new CsvUploadService();

    useEffect(() => {
        document.title = "Dashboard";
        return () => {
            document.title = "Dashboard";
        };
    }, []);

    // Load dashboard data
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                // TODO: Replace with actual API calls
                // Mock data for demonstration
                setRecurringTransactions([
                    {
                        id: 1,
                        name: 'Netflix Subscription',
                        category: 'Entertainment',
                        amount: 15.99,
                        frequency: 'monthly',
                        nextDue: '2026-02-20',
                        daysUntilDue: 5,
                        status: 'due-soon',
                        icon: <Replay />,
                        color: '#e50914'
                    },
                    {
                        id: 2,
                        name: 'Electric Bill',
                        category: 'Utilities',
                        amount: 120.00,
                        frequency: 'monthly',
                        nextDue: '2026-02-25',
                        daysUntilDue: 10,
                        status: 'upcoming',
                        icon: <Home />,
                        color: '#f59e0b'
                    },
                    {
                        id: 3,
                        name: 'Rent Payment',
                        category: 'Housing',
                        amount: 1500.00,
                        frequency: 'monthly',
                        nextDue: '2026-03-01',
                        daysUntilDue: 14,
                        status: 'upcoming',
                        icon: <Home />,
                        color: '#3b82f6'
                    },
                    {
                        id: 4,
                        name: 'Gym Membership',
                        category: 'Health',
                        amount: 45.00,
                        frequency: 'monthly',
                        nextDue: '2026-02-18',
                        daysUntilDue: 3,
                        status: 'due-soon',
                        icon: <Replay />,
                        color: '#10b981'
                    }
                ]);

                setRecentTransactions([
                    { id: 1, date: '2026-01-30', description: 'Grocery Store', category: 'Groceries', amount: -125.50, balance: 5240.50, type: 'expense' },
                    { id: 2, date: '2026-01-29', description: 'Salary Deposit', category: 'Income', amount: 3500.00, balance: 5366.00, type: 'income' },
                    { id: 3, date: '2026-01-28', description: 'Gas Station', category: 'Transportation', amount: -45.00, balance: 1866.00, type: 'expense' },
                    { id: 4, date: '2026-01-27', description: 'Restaurant', category: 'Dining', amount: -67.25, balance: 1911.00, type: 'expense' },
                    { id: 5, date: '2026-01-26', description: 'Electric Bill', category: 'Utilities', amount: -120.00, balance: 1978.25, type: 'expense' },
                ]);

                setBudgetGoals([
                    { id: 1, name: 'Dining Out', current: 245.50, target: 300.00, percentage: 81.8, status: 'on-track' },
                    { id: 2, name: 'Transportation', current: 180.00, target: 200.00, percentage: 90.0, status: 'warning' },
                    { id: 3, name: 'Entertainment', current: 95.00, target: 150.00, percentage: 63.3, status: 'on-track' },
                    { id: 4, name: 'Shopping', current: 420.00, target: 400.00, percentage: 105.0, status: 'exceeded' },
                ]);

                setGroceryBudget({ id: 5, name: 'Groceries', current: 385.75, target: 500.00, percentage: 77.2, status: 'on-track' });

                setTopCategories([
                    { category: 'Groceries', amount: 385.75, percentage: 28.5, icon: <ShoppingCart />, color: '#10b981' },
                    { category: 'Dining', amount: 245.50, percentage: 18.2, icon: <Restaurant />, color: '#f59e0b' },
                    { category: 'Transportation', amount: 180.00, percentage: 13.3, icon: <LocalGasStation />, color: '#3b82f6' },
                    { category: 'Utilities', amount: 165.00, percentage: 12.2, icon: <Home />, color: '#8b5cf6' },
                ]);

                setTotalBudget({ current: 1876.25, target: 2500.00, percentage: 75.1 });

                setRecentReceipts([
                    {
                        id: 1,
                        store: 'Whole Foods',
                        date: 'Jan 29, 2026',
                        time: '3:45 PM',
                        amount: 87.43,
                        items: 15,
                        tags: ['Organic'],
                        color: '#2563eb'
                    },
                    {
                        id: 2,
                        store: "Trader Joe's",
                        date: 'Jan 26, 2026',
                        time: '6:15 PM',
                        amount: 54.21,
                        items: 9,
                        tags: ['Saved $8.50'],
                        color: '#92400e'
                    },
                    {
                        id: 3,
                        store: 'Target',
                        date: 'Jan 23, 2026',
                        time: '11:30 AM',
                        amount: 123.85,
                        items: 23,
                        tags: ['RedCard 5%'],
                        color: '#991b1b'
                    },
                    {
                        id: 4,
                        store: 'Costco',
                        date: 'Jan 20, 2026',
                        time: '2:00 PM',
                        amount: 120.26,
                        items: 12,
                        tags: ['Bulk'],
                        color: '#15803d'
                    }
                ]);

            } catch (error) {
                console.error('Error loading dashboard data:', error);
            }
        };

        if (userId) {
            loadDashboardData();
        }
    }, [userId]);

    const handleUploadNow = () => {
        setUploadReminderOpen(false);
        setImportDialogOpen(true);
    };

    const handleRemindLater = () => {
        setUploadReminderOpen(false);
        localStorage.setItem('uploadReminderDismissed', new Date().toISOString());
    };

    const handleImportClose = () => {
        setImportDialogOpen(false);
    };

    useEffect(() => {
        const checkRecentTransactions = async () => {
            try {
                setCheckingTransactions(true);

                // Check if user dismissed the reminder recently
                const lastDismissed = localStorage.getItem('uploadReminderDismissed');
                if (lastDismissed) {
                    const dismissedDate = new Date(lastDismissed);
                    const now = new Date();
                    const hoursSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60);

                    // Don't show if dismissed within the last 24 hours
                    if (hoursSinceDismissed < 24) {
                        setCheckingTransactions(false);
                        return;
                    }
                }

                // First, check if user has override_upload_enabled
                const userHasOverrideUploadAccess = await userService.fetchUserOverrideEnabled(userId);

                if (!userHasOverrideUploadAccess) {
                    // Don't show dialog if override is not enabled
                    setCheckingTransactions(false);
                    return;
                }

                // Calculate date range (current date to 2 weeks prior)
                const currentDate = new Date();
                const twoWeeksAgo = new Date();
                twoWeeksAgo.setDate(currentDate.getDate() - 14);

                const endDate = currentDate.toISOString().split('T')[0];
                const startDate = twoWeeksAgo.toISOString().split('T')[0];

                // Fetch CSV transactions for the last 2 weeks
                const hasRecentTransactions = await csvUploadService.checkIfTransactionsExistForDateRange(
                    userId,
                    startDate,
                    endDate
                );
                console.log('hasRecentTransactions:', hasRecentTransactions);

                // Show dialog if no transactions found
                if (!hasRecentTransactions) {
                    setUploadReminderOpen(true);
                }

            } catch (error) {
                console.error('Error checking recent transactions:', error);
            } finally {
                setCheckingTransactions(false);
            }
        };

        if (userId) {
            checkRecentTransactions();
        }
    }, [userId]); // Only depend on userId to avoid re-running unnecessarily

    const handleImportComplete = async (data: {file: File, startDate: string, endDate: string, institution: string}) => {
        setImportDialogOpen(false);
        try {
            setIsLoading(true);
            const result = await csvUploadService.uploadCsv({
                userId: userId,
                file: data.file,
                startDate: data.startDate,
                endDate: data.endDate,
                institution: data.institution
            });

            if(result.success) {
                setSnackbarMessage('CSV file imported successfully!');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                // Reload dashboard data
            } else {
                setSnackbarMessage(result.message || 'Import failed');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
            }
        } catch (error) {
            console.error('Error importing CSV:', error);
            setSnackbarMessage('Failed to import CSV file');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'on-track':
                return '#10b981';
            case 'warning':
                return '#f59e0b';
            case 'exceeded':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'on-track':
                return <CheckCircle sx={{ fontSize: 20, color: '#10b981' }} />;
            case 'warning':
                return <Warning sx={{ fontSize: 20, color: '#f59e0b' }} />;
            case 'exceeded':
                return <Warning sx={{ fontSize: 20, color: '#ef4444' }} />;
            default:
                return null;
        }
    };

    const getRecurringStatusColor = (status: string) => {
        switch (status) {
            case 'upcoming':
                return '#10b981';
            case 'due-soon':
                return '#f59e0b';
            case 'overdue':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const getRecurringStatusLabel = (status: string, daysUntilDue: number) => {
        if (status === 'overdue') return 'Overdue';
        if (status === 'due-soon') return `Due in ${daysUntilDue} days`;
        return `${daysUntilDue} days`;
    };

    const formatFrequency = (frequency: string) => {
        return frequency.charAt(0).toUpperCase() + frequency.slice(1);
    };

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Grid container>
                {/* Sidebar */}
                <Grid item xs={12} md={3} lg={2}>
                    <Sidebar />
                </Grid>

                {/* Main Content */}
                <Grid item xs={12} md={9} lg={10}>
                    <Box component="main" sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                        {/* Header */}
                        <Box sx={{ mb: 4 }}>
                            <Typography
                                variant="h4"
                                component="h1"
                                sx={{
                                    fontWeight: 700,
                                    color: '#1e293b',
                                    mb: 1
                                }}
                            >
                                Good morning, {userFullName}
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#64748b' }}>
                                Here's your financial overview for today
                            </Typography>
                        </Box>

                        <Grid container spacing={3}>
                            {/* Row 1: Budget Overview (Left) + Recurring Transactions (Right) */}
                            <Grid item xs={12} lg={8}>
                                <Paper sx={{
                                    boxShadow: 3,
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                    transition: 'box-shadow 0.3s ease-in-out',
                                    '&:hover': {
                                        boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
                                    },
                                    height: '100%'
                                }}>
                                    <Box sx={{ p: 3, pb: 0 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#800000' }}>
                                                Budget Overview
                                            </Typography>
                                            <Chip
                                                label={`${totalBudget.percentage.toFixed(1)}% Used`}
                                                size="small"
                                                sx={{
                                                    bgcolor: '#fef2f2',
                                                    color: '#800000',
                                                    fontWeight: 600
                                                }}
                                            />
                                        </Box>

                                        {/* Total Budget Progress */}
                                        <Box sx={{ mb: 4 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                                                    Total Monthly Budget
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                                    ${totalBudget.current.toLocaleString()} / ${totalBudget.target.toLocaleString()}
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.min(totalBudget.percentage, 100)}
                                                sx={{
                                                    height: 10,
                                                    borderRadius: 5,
                                                    bgcolor: '#e2e8f0',
                                                    '& .MuiLinearProgress-bar': {
                                                        borderRadius: 5,
                                                        bgcolor: totalBudget.percentage > 90 ? '#ef4444' : '#0d9488'
                                                    }
                                                }}
                                            />
                                        </Box>

                                        <Divider sx={{ mb: 3 }} />

                                        {/* Top Spending Categories - Table Style */}
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#800000', mb: 2 }}>
                                            Top Spending Categories (Last Week)
                                        </Typography>
                                    </Box>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow sx={{ backgroundColor: 'background.paper' }}>
                                                    <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '50%' }}>
                                                        Category
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '25%' }}>
                                                        % of Total
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '25%' }}>
                                                        Amount
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {topCategories.map((category, index) => (
                                                    <TableRow
                                                        key={index}
                                                        sx={{
                                                            '&:last-child td': { border: 0 },
                                                            '&:hover': {
                                                                bgcolor: 'rgba(128, 0, 0, 0.04)',
                                                                cursor: 'pointer'
                                                            },
                                                            borderLeft: `4px solid ${category.color}`,
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                <Avatar
                                                                    sx={{
                                                                        bgcolor: `${category.color}15`,
                                                                        color: category.color,
                                                                        width: 36,
                                                                        height: 36
                                                                    }}
                                                                >
                                                                    {category.icon}
                                                                </Avatar>
                                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                                                    {category.category}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                                                                {category.percentage.toFixed(1)}%
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                                                ${category.amount.toFixed(2)}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Paper>
                            </Grid>

                            {/* Recurring Transactions/Bills - Top Right */}
                            {recurringTransactions.length > 0 && (
                                <Grid item xs={12} lg={4}>
                                    <Paper sx={{
                                        boxShadow: 3,
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        transition: 'box-shadow 0.3s ease-in-out',
                                        '&:hover': {
                                            boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
                                        },
                                        height: '100%'
                                    }}>
                                        <Box sx={{ p: 3, pb: 0 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#800000' }}>
                                                    Recurring Bills
                                                </Typography>
                                                <Chip
                                                    label={`${recurringTransactions.length} Active`}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: '#fef2f2',
                                                        color: '#800000',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </Box>
                                        </Box>

                                        <TableContainer>
                                            <Table>
                                                <TableHead>
                                                    <TableRow sx={{ backgroundColor: 'background.paper' }}>
                                                        <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '55%' }}>
                                                            Bill
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '45%' }}>
                                                            Amount
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {recurringTransactions
                                                        .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
                                                        .map((bill) => (
                                                            <TableRow
                                                                key={bill.id}
                                                                sx={{
                                                                    '&:hover': {
                                                                        bgcolor: 'rgba(128, 0, 0, 0.04)',
                                                                        cursor: 'pointer'
                                                                    },
                                                                    borderLeft: `4px solid ${getRecurringStatusColor(bill.status)}`,
                                                                }}
                                                            >
                                                                <TableCell>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                        <Avatar
                                                                            sx={{
                                                                                bgcolor: `${bill.color}15`,
                                                                                color: bill.color,
                                                                                width: 36,
                                                                                height: 36
                                                                            }}
                                                                        >
                                                                            {bill.icon}
                                                                        </Avatar>
                                                                        <Box>
                                                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                                                                                {bill.name}
                                                                            </Typography>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                                <Schedule sx={{ fontSize: 12, color: '#94a3b8' }} />
                                                                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                                                    {formatFrequency(bill.frequency)}
                                                                                </Typography>
                                                                            </Box>
                                                                        </Box>
                                                                    </Box>
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                                                                        ${bill.amount.toFixed(2)}
                                                                    </Typography>
                                                                    <Chip
                                                                        size="small"
                                                                        icon={<CalendarToday sx={{ fontSize: 12 }} />}
                                                                        label={getRecurringStatusLabel(bill.status, bill.daysUntilDue)}
                                                                        sx={{
                                                                            bgcolor: bill.status === 'overdue' ? '#fee2e2' : bill.status === 'due-soon' ? '#fef3c7' : '#d1fae5',
                                                                            color: bill.status === 'overdue' ? '#991b1b' : bill.status === 'due-soon' ? '#92400e' : '#065f46',
                                                                            fontWeight: 600,
                                                                            fontSize: '0.7rem',
                                                                            height: 20
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    {/* Total Monthly Recurring Row */}
                                                    <TableRow sx={{ bgcolor: '#f0f9ff' }}>
                                                        <TableCell>
                                                            <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                                                Total Monthly
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0369a1' }}>
                                                                ${recurringTransactions
                                                                .filter(bill => bill.frequency === 'monthly')
                                                                .reduce((sum, bill) => sum + bill.amount, 0)
                                                                .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Paper>
                                </Grid>
                            )}

                            {/* No Recurring Bills State - Top Right */}
                            {recurringTransactions.length === 0 && (
                                <Grid item xs={12} lg={4}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            borderRadius: 3,
                                            border: '2px dashed #e2e8f0',
                                            bgcolor: '#f8fafc',
                                            height: '100%'
                                        }}
                                    >
                                        <CardContent sx={{ py: 6, textAlign: 'center' }}>
                                            <Avatar
                                                sx={{
                                                    width: 72,
                                                    height: 72,
                                                    bgcolor: '#dbeafe',
                                                    color: '#2563eb',
                                                    margin: '0 auto',
                                                    mb: 2
                                                }}
                                            >
                                                <Replay sx={{ fontSize: 40 }} />
                                            </Avatar>
                                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                                                No Recurring Bills
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                                                Set up recurring bills to track your monthly expenses
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                startIcon={<CalendarToday />}
                                                sx={{
                                                    textTransform: 'none',
                                                    borderRadius: 3,
                                                    px: 3,
                                                    fontWeight: 600,
                                                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                                                    '&:hover': {
                                                        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                                    }
                                                }}
                                                onClick={() => {
                                                    console.log('Add recurring bill clicked');
                                                }}
                                            >
                                                Add Recurring Bill
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}

                            {/* Row 2: Grocery Budget with Receipts (Left) + Savings Goal (Right) */}
                            {/* Grocery Budget with Recent Receipts - Left */}
                            {groceryBudget && (
                                <Grid item xs={12} lg={8}>
                                    <Paper sx={{
                                        boxShadow: 3,
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        transition: 'box-shadow 0.3s ease-in-out',
                                        '&:hover': {
                                            boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
                                        },
                                        height: '100%'
                                    }}>
                                        <Box sx={{ p: 3 }}>
                                            {/* Grocery Budget Header */}
                                            <Box
                                                sx={{
                                                    p: 3,
                                                    borderRadius: 3,
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    color: 'white',
                                                    mb: 3
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                                                        <ShoppingCart sx={{ fontSize: 28 }} />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
                                                            Grocery Budget
                                                        </Typography>
                                                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                                            ${groceryBudget.current.toFixed(2)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box sx={{ mb: 1 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                                            ${groceryBudget.target.toFixed(2)} monthly budget
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                            {groceryBudget.percentage.toFixed(1)}%
                                                        </Typography>
                                                    </Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={Math.min(groceryBudget.percentage, 100)}
                                                        sx={{
                                                            height: 8,
                                                            borderRadius: 4,
                                                            bgcolor: 'rgba(255,255,255,0.3)',
                                                            '& .MuiLinearProgress-bar': {
                                                                borderRadius: 4,
                                                                bgcolor: 'white'
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                                    ${(groceryBudget.target - groceryBudget.current).toFixed(2)} remaining
                                                </Typography>
                                            </Box>

                                            {/* Recent Receipts Section */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#800000' }}>
                                                    Recent Receipts
                                                </Typography>
                                                <Button
                                                    size="small"
                                                    sx={{
                                                        textTransform: 'none',
                                                        color: '#800000',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    View All
                                                </Button>
                                            </Box>
                                        </Box>

                                        <TableContainer>
                                            <Table>
                                                <TableHead>
                                                    <TableRow sx={{ backgroundColor: 'background.paper' }}>
                                                        <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '50%' }}>
                                                            Store
                                                        </TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '25%' }}>
                                                            Date
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '25%' }}>
                                                            Amount
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {recentReceipts.map((receipt, index) => (
                                                        <TableRow
                                                            key={receipt.id}
                                                            sx={{
                                                                '&:hover': {
                                                                    bgcolor: 'rgba(128, 0, 0, 0.04)',
                                                                    cursor: 'pointer'
                                                                },
                                                                borderLeft: `4px solid ${receipt.color}`,
                                                            }}
                                                        >
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                    <Avatar
                                                                        sx={{
                                                                            bgcolor: `${receipt.color}15`,
                                                                            color: receipt.color,
                                                                            width: 36,
                                                                            height: 36
                                                                        }}
                                                                    >
                                                                        <ShoppingCart sx={{ fontSize: 20 }} />
                                                                    </Avatar>
                                                                    <Box>
                                                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                                                            {receipt.store}
                                                                        </Typography>
                                                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                                                            <Chip
                                                                                label={`${receipt.items} items`}
                                                                                size="small"
                                                                                sx={{
                                                                                    bgcolor: '#e0e7ff',
                                                                                    color: '#3730a3',
                                                                                    fontSize: '0.65rem',
                                                                                    height: 18,
                                                                                    fontWeight: 500
                                                                                }}
                                                                            />
                                                                            {receipt.tags.map((tag, tagIndex) => (
                                                                                <Chip
                                                                                    key={tagIndex}
                                                                                    label={tag}
                                                                                    size="small"
                                                                                    sx={{
                                                                                        bgcolor: tag.includes('Saved') ? '#d1fae5' : tag.includes('Organic') ? '#d1fae5' : tag.includes('RedCard') ? '#fee2e2' : '#e0e7ff',
                                                                                        color: tag.includes('Saved') ? '#065f46' : tag.includes('Organic') ? '#065f46' : tag.includes('RedCard') ? '#991b1b' : '#3730a3',
                                                                                        fontSize: '0.65rem',
                                                                                        height: 18,
                                                                                        fontWeight: 500
                                                                                    }}
                                                                                />
                                                                            ))}
                                                                        </Box>
                                                                    </Box>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                                                                    {receipt.date}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                                    {receipt.time}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                                                    ${receipt.amount.toFixed(2)}
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {/* Summary Stats Row */}
                                                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                        <TableCell colSpan={3} sx={{ py: 2 }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                                                <Box sx={{ textAlign: 'center' }}>
                                                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                                                        Avg per trip
                                                                    </Typography>
                                                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                                                        $96.44
                                                                    </Typography>
                                                                </Box>
                                                                <Divider orientation="vertical" flexItem />
                                                                <Box sx={{ textAlign: 'center' }}>
                                                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                                                        Total trips
                                                                    </Typography>
                                                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                                                        4
                                                                    </Typography>
                                                                </Box>
                                                                <Divider orientation="vertical" flexItem />
                                                                <Box sx={{ textAlign: 'center' }}>
                                                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                                                        Total saved
                                                                    </Typography>
                                                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>
                                                                        $8.50
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Paper>
                                </Grid>
                            )}

                            {/* Savings Goal - Right */}
                            <Grid item xs={12} lg={4}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        borderRadius: 3,
                                        border: '1px solid #e2e8f0',
                                        height: '100%'
                                    }}
                                >
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#800000' }}>
                                                Savings Goal
                                            </Typography>
                                            <Button
                                                size="small"
                                                sx={{
                                                    textTransform: 'none',
                                                    color: '#800000',
                                                    fontWeight: 600
                                                }}
                                            >
                                                Manage Goal
                                            </Button>
                                        </Box>

                                        {/* Emergency Fund Goal */}
                                        <Box
                                            sx={{
                                                p: 3,
                                                bgcolor: '#f0fdf4',
                                                borderRadius: 3,
                                                border: '1px solid #bbf7d0'
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                <Box>
                                                    <Typography variant="body2" sx={{ color: '#166534', fontWeight: 600, mb: 0.5 }}>
                                                        Emergency Fund
                                                    </Typography>
                                                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#15803d' }}>
                                                        $8,500
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    icon={<CheckCircle sx={{ fontSize: 16 }} />}
                                                    label="On Track"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: '#22c55e',
                                                        color: 'white',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </Box>
                                            <Box sx={{ mb: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>
                                                        Goal: $10,000
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>
                                                        85%
                                                    </Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={85}
                                                    sx={{
                                                        height: 8,
                                                        borderRadius: 4,
                                                        bgcolor: '#dcfce7',
                                                        '& .MuiLinearProgress-bar': {
                                                            borderRadius: 4,
                                                            bgcolor: '#22c55e'
                                                        }
                                                    }}
                                                />
                                            </Box>
                                            <Divider sx={{ my: 2, borderColor: '#bbf7d0' }} />
                                            <Box>
                                                <Typography variant="caption" sx={{ color: '#166534', display: 'block', mb: 0.5 }}>
                                                    Monthly Target: $500
                                                </Typography>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2" sx={{ color: '#15803d', fontWeight: 600 }}>
                                                        Saved this month: $500
                                                    </Typography>
                                                    <CheckCircle sx={{ fontSize: 20, color: '#22c55e' }} />
                                                </Box>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Row 3: Recent Transactions - Full Width */}
                            <Grid item xs={12}>
                                <Paper sx={{
                                    boxShadow: 3,
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                    transition: 'box-shadow 0.3s ease-in-out',
                                    '&:hover': {
                                        boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
                                    }
                                }}>
                                    <Box sx={{ p: 3, pb: 0 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#800000' }}>
                                                Recent Transactions
                                            </Typography>
                                            <Button
                                                size="small"
                                                sx={{
                                                    textTransform: 'none',
                                                    color: '#800000',
                                                    fontWeight: 600
                                                }}
                                            >
                                                View All
                                            </Button>
                                        </Box>
                                    </Box>
                                    <TableContainer>
                                        <Table sx={{ tableLayout: 'fixed' }}>
                                            <TableHead>
                                                <TableRow sx={{ backgroundColor: 'background.paper' }}>
                                                    <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '12%' }}>
                                                        Date
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '30%' }}>
                                                        Description
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '18%' }}>
                                                        Category
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '20%' }}>
                                                        Amount
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '20%' }}>
                                                        Balance
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {recentTransactions.map((transaction, index) => (
                                                    <TableRow
                                                        key={transaction.id}
                                                        sx={{
                                                            '&:last-child td, &:last-child th': { border: 0 },
                                                            '&:hover': {
                                                                bgcolor: 'rgba(128, 0, 0, 0.04)',
                                                                cursor: 'pointer'
                                                            },
                                                            borderLeft: `4px solid ${transaction.type === 'income' ? '#10b981' : '#ef4444'}`,
                                                        }}
                                                    >
                                                        <TableCell sx={{ color: '#64748b', fontWeight: 500 }}>
                                                            {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                                                {transaction.description}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={transaction.category}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: '#f1f5f9',
                                                                    color: '#475569',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 600
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell
                                                            align="right"
                                                            sx={{
                                                                fontWeight: 700,
                                                                fontSize: '0.95rem',
                                                                color: transaction.type === 'income' ? '#10b981' : '#ef4444'
                                                            }}
                                                        >
                                                            {transaction.type === 'income' ? '+' : '-'}$
                                                            {Math.abs(transaction.amount).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                                            ${transaction.balance.toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
            </Grid>

            {/* Loading Backdrop */}
            <Backdrop
                sx={{
                    color: '#fff',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)'
                }}
                open={isLoading}
            >
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress color="inherit" size={60} />
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Importing CSV data...
                    </Typography>
                </Box>
            </Backdrop>

            {/* Upload Reminder Dialog */}
            <Dialog
                open={uploadReminderOpen}
                onClose={handleRemindLater}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                    }
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                                color: 'white'
                            }}
                        >
                            <AlertCircle size={24} />
                        </Box>
                        <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
                            Upload Reminder
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Alert
                        severity="warning"
                        icon={<Upload size={20} />}
                        sx={{
                            mb: 2,
                            borderRadius: 3,
                            '& .MuiAlert-icon': {
                                alignItems: 'center'
                            }
                        }}
                    >
                        <AlertTitle sx={{ fontWeight: 600 }}>
                            No Recent Transactions Found
                        </AlertTitle>
                        We haven't detected any transactions in the last 2 weeks.
                    </Alert>

                    <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                        To keep your financial tracking accurate and up-to-date, please upload your recent transaction data.
                    </Typography>

                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Regular uploads help you:
                    </Typography>
                    <Box component="ul" sx={{ mt: 1, pl: 2, color: theme.palette.text.secondary }}>
                        <li>Track your spending habits accurately</li>
                        <li>Stay on top of your budget</li>
                        <li>Identify trends and patterns</li>
                        <li>Make informed financial decisions</li>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                    <Button
                        onClick={handleRemindLater}
                        variant="outlined"
                        sx={{
                            textTransform: 'none',
                            borderRadius: 3,
                            px: 3,
                            fontWeight: 600
                        }}
                    >
                        Remind Me Later
                    </Button>
                    <Button
                        onClick={handleUploadNow}
                        variant="contained"
                        startIcon={<Upload size={18} />}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 3,
                            px: 3,
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                            }
                        }}
                    >
                        Upload Now
                    </Button>
                </DialogActions>
            </Dialog>

            {/* CSV Import Dialog */}
            <CSVImportDialog open={importDialogOpen} onClose={handleImportClose} onImport={handleImportComplete}/>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <SnackbarAlert
                    onClose={handleSnackbarClose}
                    severity={snackbarSeverity}
                    sx={{
                        width: '100%',
                        borderRadius: 3,
                        fontWeight: 500
                    }}
                >
                    {snackbarMessage}
                </SnackbarAlert>
            </Snackbar>
        </Box>
    );
};

export default DashboardPage;


// import React, {useEffect, useState} from 'react';
// import {
//     Box,
//     Grid,
//     Typography,
//     Paper,
//     Button,
//     LinearProgress,
//     Chip,
//     Card,
//     CardContent,
//     Avatar,
//     Divider,
//     useMediaQuery,
//     useTheme,
//     Dialog,
//     DialogTitle,
//     AlertTitle,
//     Alert,
//     DialogContent,
//     DialogActions,
//     Backdrop,
//     CircularProgress,
//     Snackbar,
//     Table,
//     TableBody,
//     TableCell,
//     TableContainer,
//     TableHead,
//     TableRow,
//     IconButton,
// } from '@mui/material';
// import MuiAlert, { AlertProps } from '@mui/material/Alert';
// import {
//     TrendingUp,
//     TrendingDown,
//     AccountBalance,
//     Savings,
//     CreditCard,
//     ShoppingCart,
//     Restaurant,
//     LocalGasStation,
//     Home,
//     MoreVert,
//     CheckCircle,
//     Warning,
//     ArrowUpward,
//     ArrowDownward,
// } from '@mui/icons-material';
// import {AlertCircle, Upload} from "lucide-react";
// import Sidebar from "./Sidebar";
// import PlaidService from "../services/PlaidService";
// import UserService from '../services/UserService';
// import CsvUploadService from "../services/CsvUploadService";
// import CSVImportDialog from "./CSVImportDialog";
//
// const SnackbarAlert = React.forwardRef<HTMLDivElement, AlertProps>(
//     function SnackbarAlert(props, ref) {
//         return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
//     }
// );
//
// interface Receipt {
//     id: number;
//     store: string;
//     date: string;
//     time: string;
//     amount: number;
//     items: number;
//     tags: string[];
//     color: string;
// }
//
// interface Account {
//     id: number;
//     name: string;
//     type: string;
//     balance: number;
//     change: number;
//     icon: React.ReactNode;
// }
//
// interface Transaction {
//     id: number;
//     date: string;
//     description: string;
//     category: string;
//     amount: number;
//     balance: number;
//     type: 'income' | 'expense';
// }
//
// interface BudgetGoal {
//     id: number;
//     name: string;
//     current: number;
//     target: number;
//     percentage: number;
//     status: 'on-track' | 'warning' | 'exceeded';
// }
//
// interface CategorySpending {
//     category: string;
//     amount: number;
//     percentage: number;
//     icon: React.ReactNode;
//     color: string;
// }
//
// const DashboardPage: React.FC = () => {
//     const [uploadReminderOpen, setUploadReminderOpen] = useState<boolean>(false);
//     const [checkingTransactions, setCheckingTransactions] = useState<boolean>(false);
//     const [isLoading, setIsLoading] = useState<boolean>(false);
//     const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
//     const [snackbarMessage, setSnackbarMessage] = useState<string>('');
//     const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
//     const [error, setError] = useState<string | null>(null);
//     const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);
//
//     // Data states
//     const [accounts, setAccounts] = useState<Account[]>([]);
//     const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
//     const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
//     const [groceryBudget, setGroceryBudget] = useState<BudgetGoal | null>(null);
//     const [topCategories, setTopCategories] = useState<CategorySpending[]>([]);
//     const [totalBudget, setTotalBudget] = useState({ current: 0, target: 0, percentage: 0 });
//     const [recentReceipts, setRecentReceipts] = useState<Receipt[]>([]);
//
//
//     const userFullName = sessionStorage.getItem('fullName');
//     const userId = Number(sessionStorage.getItem('userId'));
//     const theme = useTheme();
//     const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
//     const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));
//     const plaidService = PlaidService.getInstance();
//     const userService = UserService.getInstance();
//     const csvUploadService = new CsvUploadService();
//
//     useEffect(() => {
//         document.title = "Dashboard";
//         return () => {
//             document.title = "Dashboard";
//         };
//     }, []);
//
//     // Load dashboard data
//     useEffect(() => {
//         const loadDashboardData = async () => {
//             try {
//                 // TODO: Replace with actual API calls
//                 // Mock data for demonstration
//                 setAccounts([
//                     {
//                         id: 1,
//                         name: 'Checking Account',
//                         type: 'checking',
//                         balance: 5240.50,
//                         change: 2.5,
//                         icon: <AccountBalance />
//                     }
//                 ]);
//
//                 setRecentTransactions([
//                     { id: 1, date: '2026-01-30', description: 'Grocery Store', category: 'Groceries', amount: -125.50, balance: 5240.50, type: 'expense' },
//                     { id: 2, date: '2026-01-29', description: 'Salary Deposit', category: 'Income', amount: 3500.00, balance: 5366.00, type: 'income' },
//                     { id: 3, date: '2026-01-28', description: 'Gas Station', category: 'Transportation', amount: -45.00, balance: 1866.00, type: 'expense' },
//                     { id: 4, date: '2026-01-27', description: 'Restaurant', category: 'Dining', amount: -67.25, balance: 1911.00, type: 'expense' },
//                     { id: 5, date: '2026-01-26', description: 'Electric Bill', category: 'Utilities', amount: -120.00, balance: 1978.25, type: 'expense' },
//                 ]);
//
//                 setBudgetGoals([
//                     { id: 1, name: 'Dining Out', current: 245.50, target: 300.00, percentage: 81.8, status: 'on-track' },
//                     { id: 2, name: 'Transportation', current: 180.00, target: 200.00, percentage: 90.0, status: 'warning' },
//                     { id: 3, name: 'Entertainment', current: 95.00, target: 150.00, percentage: 63.3, status: 'on-track' },
//                     { id: 4, name: 'Shopping', current: 420.00, target: 400.00, percentage: 105.0, status: 'exceeded' },
//                 ]);
//
//                 setGroceryBudget({ id: 5, name: 'Groceries', current: 385.75, target: 500.00, percentage: 77.2, status: 'on-track' });
//
//                 setTopCategories([
//                     { category: 'Groceries', amount: 385.75, percentage: 28.5, icon: <ShoppingCart />, color: '#10b981' },
//                     { category: 'Dining', amount: 245.50, percentage: 18.2, icon: <Restaurant />, color: '#f59e0b' },
//                     { category: 'Transportation', amount: 180.00, percentage: 13.3, icon: <LocalGasStation />, color: '#3b82f6' },
//                     { category: 'Utilities', amount: 165.00, percentage: 12.2, icon: <Home />, color: '#8b5cf6' },
//                 ]);
//
//                 setTotalBudget({ current: 1876.25, target: 2500.00, percentage: 75.1 });
//
//                 setRecentReceipts([
//                     {
//                         id: 1,
//                         store: 'Whole Foods',
//                         date: 'Jan 29, 2026',
//                         time: '3:45 PM',
//                         amount: 87.43,
//                         items: 15,
//                         tags: ['Organic'],
//                         color: '#2563eb'
//                     },
//                     {
//                         id: 2,
//                         store: "Trader Joe's",
//                         date: 'Jan 26, 2026',
//                         time: '6:15 PM',
//                         amount: 54.21,
//                         items: 9,
//                         tags: ['Saved $8.50'],
//                         color: '#92400e'
//                     },
//                     {
//                         id: 3,
//                         store: 'Target',
//                         date: 'Jan 23, 2026',
//                         time: '11:30 AM',
//                         amount: 123.85,
//                         items: 23,
//                         tags: ['RedCard 5%'],
//                         color: '#991b1b'
//                     },
//                     {
//                         id: 4,
//                         store: 'Costco',
//                         date: 'Jan 20, 2026',
//                         time: '2:00 PM',
//                         amount: 120.26,
//                         items: 12,
//                         tags: ['Bulk'],
//                         color: '#15803d'
//                     }
//                 ]);
//
//             } catch (error) {
//                 console.error('Error loading dashboard data:', error);
//             }
//         };
//
//         if (userId) {
//             loadDashboardData();
//         }
//     }, [userId]);
//
//     const handleUploadNow = () => {
//         setUploadReminderOpen(false);
//         setImportDialogOpen(true);
//     };
//
//     const handleRemindLater = () => {
//         setUploadReminderOpen(false);
//         localStorage.setItem('uploadReminderDismissed', new Date().toISOString());
//     };
//
//     const handleImportClose = () => {
//         setImportDialogOpen(false);
//     };
//
//     useEffect(() => {
//         const checkRecentTransactions = async () => {
//             try {
//                 setCheckingTransactions(true);
//
//                 // Check if user dismissed the reminder recently
//                 const lastDismissed = localStorage.getItem('uploadReminderDismissed');
//                 if (lastDismissed) {
//                     const dismissedDate = new Date(lastDismissed);
//                     const now = new Date();
//                     const hoursSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60);
//
//                     // Don't show if dismissed within the last 24 hours
//                     if (hoursSinceDismissed < 24) {
//                         setCheckingTransactions(false);
//                         return;
//                     }
//                 }
//
//                 // First, check if user has override_upload_enabled
//                 const userHasOverrideUploadAccess = await userService.fetchUserOverrideEnabled(userId);
//
//                 if (!userHasOverrideUploadAccess) {
//                     // Don't show dialog if override is not enabled
//                     setCheckingTransactions(false);
//                     return;
//                 }
//
//                 // Calculate date range (current date to 2 weeks prior)
//                 const currentDate = new Date();
//                 const twoWeeksAgo = new Date();
//                 twoWeeksAgo.setDate(currentDate.getDate() - 14);
//
//                 const endDate = currentDate.toISOString().split('T')[0];
//                 const startDate = twoWeeksAgo.toISOString().split('T')[0];
//
//                 // Fetch CSV transactions for the last 2 weeks
//                 const hasRecentTransactions = await csvUploadService.checkIfTransactionsExistForDateRange(
//                     userId,
//                     startDate,
//                     endDate
//                 );
//                 console.log('hasRecentTransactions:', hasRecentTransactions);
//
//                 // Show dialog if no transactions found
//                 if (!hasRecentTransactions) {
//                     setUploadReminderOpen(true);
//                 }
//
//             } catch (error) {
//                 console.error('Error checking recent transactions:', error);
//             } finally {
//                 setCheckingTransactions(false);
//             }
//         };
//
//         if (userId) {
//             checkRecentTransactions();
//         }
//     }, [userId]); // Only depend on userId to avoid re-running unnecessarily
//
//     const handleImportComplete = async (data: {file: File, startDate: string, endDate: string, institution: string}) => {
//         setImportDialogOpen(false);
//         try {
//             setIsLoading(true);
//             const result = await csvUploadService.uploadCsv({
//                 userId: userId,
//                 file: data.file,
//                 startDate: data.startDate,
//                 endDate: data.endDate,
//                 institution: data.institution
//             });
//
//             if(result.success) {
//                 setSnackbarMessage('CSV file imported successfully!');
//                 setSnackbarSeverity('success');
//                 setSnackbarOpen(true);
//                 // Reload dashboard data
//             } else {
//                 setSnackbarMessage(result.message || 'Import failed');
//                 setSnackbarSeverity('error');
//                 setSnackbarOpen(true);
//             }
//         } catch (error) {
//             console.error('Error importing CSV:', error);
//             setSnackbarMessage('Failed to import CSV file');
//             setSnackbarSeverity('error');
//             setSnackbarOpen(true);
//         } finally {
//             setIsLoading(false);
//         }
//     };
//
//     const handleSnackbarClose = () => {
//         setSnackbarOpen(false);
//     };
//
//     const getStatusColor = (status: string) => {
//         switch (status) {
//             case 'on-track':
//                 return '#10b981';
//             case 'warning':
//                 return '#f59e0b';
//             case 'exceeded':
//                 return '#ef4444';
//             default:
//                 return '#6b7280';
//         }
//     };
//
//     const getStatusIcon = (status: string) => {
//         switch (status) {
//             case 'on-track':
//                 return <CheckCircle sx={{ fontSize: 20, color: '#10b981' }} />;
//             case 'warning':
//                 return <Warning sx={{ fontSize: 20, color: '#f59e0b' }} />;
//             case 'exceeded':
//                 return <Warning sx={{ fontSize: 20, color: '#ef4444' }} />;
//             default:
//                 return null;
//         }
//     };
//
//     return (
//         <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
//             <Grid container>
//                 {/* Sidebar */}
//                 <Grid item xs={12} md={3} lg={2}>
//                     <Sidebar />
//                 </Grid>
//
//                 {/* Main Content */}
//                 <Grid item xs={12} md={9} lg={10}>
//                     <Box component="main" sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
//                         {/* Header */}
//                         <Box sx={{ mb: 4 }}>
//                             <Typography
//                                 variant="h4"
//                                 component="h1"
//                                 sx={{
//                                     fontWeight: 700,
//                                     color: '#1e293b',
//                                     mb: 1
//                                 }}
//                             >
//                                 Good morning, {userFullName}
//                             </Typography>
//                             <Typography variant="body1" sx={{ color: '#64748b' }}>
//                                 Here's your financial overview for today
//                             </Typography>
//                         </Box>
//
//                         <Grid container spacing={3}>
//                             {/* Row 1: Budget Overview (Left) + Accounts (Right) */}
//                             <Grid item xs={12} lg={8}>
//                                 <Paper sx={{
//                                     boxShadow: 3,
//                                     borderRadius: 4,
//                                     overflow: 'hidden',
//                                     transition: 'box-shadow 0.3s ease-in-out',
//                                     '&:hover': {
//                                         boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
//                                     },
//                                     height: '100%'
//                                 }}>
//                                     <Box sx={{ p: 3, pb: 0 }}>
//                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//                                             <Typography variant="h6" sx={{ fontWeight: 600, color: '#800000' }}>
//                                                 Budget Overview
//                                             </Typography>
//                                             <Chip
//                                                 label={`${totalBudget.percentage.toFixed(1)}% Used`}
//                                                 size="small"
//                                                 sx={{
//                                                     bgcolor: '#fef2f2',
//                                                     color: '#800000',
//                                                     fontWeight: 600
//                                                 }}
//                                             />
//                                         </Box>
//
//                                         {/* Total Budget Progress */}
//                                         <Box sx={{ mb: 4 }}>
//                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
//                                                 <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
//                                                     Total Monthly Budget
//                                                 </Typography>
//                                                 <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
//                                                     ${totalBudget.current.toLocaleString()} / ${totalBudget.target.toLocaleString()}
//                                                 </Typography>
//                                             </Box>
//                                             <LinearProgress
//                                                 variant="determinate"
//                                                 value={Math.min(totalBudget.percentage, 100)}
//                                                 sx={{
//                                                     height: 10,
//                                                     borderRadius: 5,
//                                                     bgcolor: '#e2e8f0',
//                                                     '& .MuiLinearProgress-bar': {
//                                                         borderRadius: 5,
//                                                         bgcolor: totalBudget.percentage > 90 ? '#ef4444' : '#0d9488'
//                                                     }
//                                                 }}
//                                             />
//                                         </Box>
//
//                                         <Divider sx={{ mb: 3 }} />
//
//                                         {/* Top Spending Categories - Table Style */}
//                                         <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#800000', mb: 2 }}>
//                                             Top Spending Categories (Last Week)
//                                         </Typography>
//                                     </Box>
//                                     <TableContainer>
//                                         <Table>
//                                             <TableHead>
//                                                 <TableRow sx={{ backgroundColor: 'background.paper' }}>
//                                                     <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '50%' }}>
//                                                         Category
//                                                     </TableCell>
//                                                     <TableCell align="right" sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '25%' }}>
//                                                         % of Total
//                                                     </TableCell>
//                                                     <TableCell align="right" sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '25%' }}>
//                                                         Amount
//                                                     </TableCell>
//                                                 </TableRow>
//                                             </TableHead>
//                                             <TableBody>
//                                                 {topCategories.map((category, index) => (
//                                                     <TableRow
//                                                         key={index}
//                                                         sx={{
//                                                             '&:last-child td': { border: 0 },
//                                                             '&:hover': {
//                                                                 bgcolor: 'rgba(128, 0, 0, 0.04)',
//                                                                 cursor: 'pointer'
//                                                             },
//                                                             borderLeft: `4px solid ${category.color}`,
//                                                         }}
//                                                     >
//                                                         <TableCell>
//                                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                                                                 <Avatar
//                                                                     sx={{
//                                                                         bgcolor: `${category.color}15`,
//                                                                         color: category.color,
//                                                                         width: 36,
//                                                                         height: 36
//                                                                     }}
//                                                                 >
//                                                                     {category.icon}
//                                                                 </Avatar>
//                                                                 <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
//                                                                     {category.category}
//                                                                 </Typography>
//                                                             </Box>
//                                                         </TableCell>
//                                                         <TableCell align="right">
//                                                             <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
//                                                                 {category.percentage.toFixed(1)}%
//                                                             </Typography>
//                                                         </TableCell>
//                                                         <TableCell align="right">
//                                                             <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
//                                                                 ${category.amount.toFixed(2)}
//                                                             </Typography>
//                                                         </TableCell>
//                                                     </TableRow>
//                                                 ))}
//                                             </TableBody>
//                                         </Table>
//                                     </TableContainer>
//                                 </Paper>
//                             </Grid>
//
//                             {/* Accounts Overview - Top Right */}
//                             {accounts.length > 0 && (
//                                 <Grid item xs={12} lg={4}>
//                                     <Paper sx={{
//                                         boxShadow: 3,
//                                         borderRadius: 4,
//                                         overflow: 'hidden',
//                                         transition: 'box-shadow 0.3s ease-in-out',
//                                         '&:hover': {
//                                             boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
//                                         },
//                                         height: '100%'
//                                     }}>
//                                         <Box sx={{ p: 3, pb: 0 }}>
//                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//                                                 <Typography variant="h6" sx={{ fontWeight: 600, color: '#800000' }}>
//                                                     Accounts
//                                                 </Typography>
//                                                 <Chip
//                                                     label={`${accounts.length} ${accounts.length === 1 ? 'Account' : 'Accounts'}`}
//                                                     size="small"
//                                                     sx={{
//                                                         bgcolor: '#fef2f2',
//                                                         color: '#800000',
//                                                         fontWeight: 600
//                                                     }}
//                                                 />
//                                             </Box>
//                                         </Box>
//
//                                         <TableContainer>
//                                             <Table>
//                                                 <TableHead>
//                                                     <TableRow sx={{ backgroundColor: 'background.paper' }}>
//                                                         <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '60%' }}>
//                                                             Account
//                                                         </TableCell>
//                                                         <TableCell align="right" sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '40%' }}>
//                                                             Balance
//                                                         </TableCell>
//                                                     </TableRow>
//                                                 </TableHead>
//                                                 <TableBody>
//                                                     {accounts.map((account, index) => (
//                                                         <TableRow
//                                                             key={account.id}
//                                                             sx={{
//                                                                 '&:hover': {
//                                                                     bgcolor: 'rgba(128, 0, 0, 0.04)',
//                                                                     cursor: 'pointer'
//                                                                 },
//                                                                 borderLeft: `4px solid ${account.type === 'credit' ? '#dc2626' : account.type === 'savings' ? '#16a34a' : '#2563eb'}`,
//                                                             }}
//                                                         >
//                                                             <TableCell>
//                                                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                                                                     <Avatar
//                                                                         sx={{
//                                                                             bgcolor: account.type === 'credit' ? '#fee2e2' : account.type === 'savings' ? '#dcfce7' : '#dbeafe',
//                                                                             color: account.type === 'credit' ? '#dc2626' : account.type === 'savings' ? '#16a34a' : '#2563eb',
//                                                                             width: 36,
//                                                                             height: 36
//                                                                         }}
//                                                                     >
//                                                                         {account.icon}
//                                                                     </Avatar>
//                                                                     <Box>
//                                                                         <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
//                                                                             {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
//                                                                         </Typography>
//                                                                         <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
//                                                                             {account.name}
//                                                                         </Typography>
//                                                                     </Box>
//                                                                 </Box>
//                                                             </TableCell>
//                                                             <TableCell align="right">
//                                                                 <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
//                                                                     ${Math.abs(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                                                                 </Typography>
//                                                                 <Chip
//                                                                     size="small"
//                                                                     icon={account.change > 0 ? <ArrowUpward sx={{ fontSize: 14 }} /> : <ArrowDownward sx={{ fontSize: 14 }} />}
//                                                                     label={`${account.change > 0 ? '+' : ''}${account.change}%`}
//                                                                     sx={{
//                                                                         bgcolor: account.change > 0 ? '#d1fae5' : '#fee2e2',
//                                                                         color: account.change > 0 ? '#065f46' : '#991b1b',
//                                                                         fontWeight: 600,
//                                                                         fontSize: '0.7rem',
//                                                                         height: 20
//                                                                     }}
//                                                                 />
//                                                             </TableCell>
//                                                         </TableRow>
//                                                     ))}
//                                                     {/* Total Balance Row - Only show if multiple accounts */}
//                                                     {accounts.length > 1 && (
//                                                         <TableRow sx={{ bgcolor: '#f0f9ff' }}>
//                                                             <TableCell>
//                                                                 <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
//                                                                     Total Net Worth
//                                                                 </Typography>
//                                                             </TableCell>
//                                                             <TableCell align="right">
//                                                                 <Typography variant="h6" sx={{ fontWeight: 700, color: '#0369a1' }}>
//                                                                     ${accounts.reduce((sum, acc) => sum + acc.balance, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                                                                 </Typography>
//                                                             </TableCell>
//                                                         </TableRow>
//                                                     )}
//                                                 </TableBody>
//                                             </Table>
//                                         </TableContainer>
//                                     </Paper>
//                                 </Grid>
//                             )}
//
//                             {/* No Accounts Connected State - Top Right */}
//                             {accounts.length === 0 && (
//                                 <Grid item xs={12} lg={4}>
//                                     <Card
//                                         elevation={0}
//                                         sx={{
//                                             borderRadius: 3,
//                                             border: '2px dashed #e2e8f0',
//                                             bgcolor: '#f8fafc',
//                                             height: '100%'
//                                         }}
//                                     >
//                                         <CardContent sx={{ py: 6, textAlign: 'center' }}>
//                                             <Avatar
//                                                 sx={{
//                                                     width: 72,
//                                                     height: 72,
//                                                     bgcolor: '#dbeafe',
//                                                     color: '#2563eb',
//                                                     margin: '0 auto',
//                                                     mb: 2
//                                                 }}
//                                             >
//                                                 <AccountBalance sx={{ fontSize: 40 }} />
//                                             </Avatar>
//                                             <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
//                                                 No Accounts Connected
//                                             </Typography>
//                                             <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
//                                                 Connect your bank accounts to start tracking your finances
//                                             </Typography>
//                                             <Button
//                                                 variant="contained"
//                                                 startIcon={<AccountBalance />}
//                                                 sx={{
//                                                     textTransform: 'none',
//                                                     borderRadius: 3,
//                                                     px: 3,
//                                                     fontWeight: 600,
//                                                     background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
//                                                     '&:hover': {
//                                                         background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
//                                                     }
//                                                 }}
//                                                 onClick={() => {
//                                                     console.log('Connect account clicked');
//                                                 }}
//                                             >
//                                                 Connect Account
//                                             </Button>
//                                         </CardContent>
//                                     </Card>
//                                 </Grid>
//                             )}
//
//                             {/* Row 2: Grocery Budget with Receipts (Left) + Savings Goal (Right) */}
//                             {/* Grocery Budget with Recent Receipts - Left */}
//                             {groceryBudget && (
//                                 <Grid item xs={12} lg={8}>
//                                     <Paper sx={{
//                                         boxShadow: 3,
//                                         borderRadius: 4,
//                                         overflow: 'hidden',
//                                         transition: 'box-shadow 0.3s ease-in-out',
//                                         '&:hover': {
//                                             boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
//                                         },
//                                         height: '100%'
//                                     }}>
//                                         <Box sx={{ p: 3 }}>
//                                             {/* Grocery Budget Header */}
//                                             <Box
//                                                 sx={{
//                                                     p: 3,
//                                                     borderRadius: 3,
//                                                     background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//                                                     color: 'white',
//                                                     mb: 3
//                                                 }}
//                                             >
//                                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
//                                                     <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
//                                                         <ShoppingCart sx={{ fontSize: 28 }} />
//                                                     </Avatar>
//                                                     <Box>
//                                                         <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
//                                                             Grocery Budget
//                                                         </Typography>
//                                                         <Typography variant="h4" sx={{ fontWeight: 700 }}>
//                                                             ${groceryBudget.current.toFixed(2)}
//                                                         </Typography>
//                                                     </Box>
//                                                 </Box>
//                                                 <Box sx={{ mb: 1 }}>
//                                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
//                                                         <Typography variant="caption" sx={{ opacity: 0.9 }}>
//                                                             ${groceryBudget.target.toFixed(2)} monthly budget
//                                                         </Typography>
//                                                         <Typography variant="caption" sx={{ fontWeight: 600 }}>
//                                                             {groceryBudget.percentage.toFixed(1)}%
//                                                         </Typography>
//                                                     </Box>
//                                                     <LinearProgress
//                                                         variant="determinate"
//                                                         value={Math.min(groceryBudget.percentage, 100)}
//                                                         sx={{
//                                                             height: 8,
//                                                             borderRadius: 4,
//                                                             bgcolor: 'rgba(255,255,255,0.3)',
//                                                             '& .MuiLinearProgress-bar': {
//                                                                 borderRadius: 4,
//                                                                 bgcolor: 'white'
//                                                             }
//                                                         }}
//                                                     />
//                                                 </Box>
//                                                 <Typography variant="caption" sx={{ opacity: 0.8 }}>
//                                                     ${(groceryBudget.target - groceryBudget.current).toFixed(2)} remaining
//                                                 </Typography>
//                                             </Box>
//
//                                             {/* Recent Receipts Section */}
//                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//                                                 <Typography variant="h6" sx={{ fontWeight: 600, color: '#800000' }}>
//                                                     Recent Receipts
//                                                 </Typography>
//                                                 <Button
//                                                     size="small"
//                                                     sx={{
//                                                         textTransform: 'none',
//                                                         color: '#800000',
//                                                         fontWeight: 600
//                                                     }}
//                                                 >
//                                                     View All
//                                                 </Button>
//                                             </Box>
//                                         </Box>
//
//                                         <TableContainer>
//                                             <Table>
//                                                 <TableHead>
//                                                     <TableRow sx={{ backgroundColor: 'background.paper' }}>
//                                                         <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '50%' }}>
//                                                             Store
//                                                         </TableCell>
//                                                         <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '25%' }}>
//                                                             Date
//                                                         </TableCell>
//                                                         <TableCell align="right" sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '25%' }}>
//                                                             Amount
//                                                         </TableCell>
//                                                     </TableRow>
//                                                 </TableHead>
//                                                 <TableBody>
//                                                     {recentReceipts.map((receipt, index) => (
//                                                         <TableRow
//                                                             key={receipt.id}
//                                                             sx={{
//                                                                 '&:hover': {
//                                                                     bgcolor: 'rgba(128, 0, 0, 0.04)',
//                                                                     cursor: 'pointer'
//                                                                 },
//                                                                 borderLeft: `4px solid ${receipt.color}`,
//                                                             }}
//                                                         >
//                                                             <TableCell>
//                                                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                                                                     <Avatar
//                                                                         sx={{
//                                                                             bgcolor: `${receipt.color}15`,
//                                                                             color: receipt.color,
//                                                                             width: 36,
//                                                                             height: 36
//                                                                         }}
//                                                                     >
//                                                                         <ShoppingCart sx={{ fontSize: 20 }} />
//                                                                     </Avatar>
//                                                                     <Box>
//                                                                         <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
//                                                                             {receipt.store}
//                                                                         </Typography>
//                                                                         <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
//                                                                             <Chip
//                                                                                 label={`${receipt.items} items`}
//                                                                                 size="small"
//                                                                                 sx={{
//                                                                                     bgcolor: '#e0e7ff',
//                                                                                     color: '#3730a3',
//                                                                                     fontSize: '0.65rem',
//                                                                                     height: 18,
//                                                                                     fontWeight: 500
//                                                                                 }}
//                                                                             />
//                                                                             {receipt.tags.map((tag, tagIndex) => (
//                                                                                 <Chip
//                                                                                     key={tagIndex}
//                                                                                     label={tag}
//                                                                                     size="small"
//                                                                                     sx={{
//                                                                                         bgcolor: tag.includes('Saved') ? '#d1fae5' : tag.includes('Organic') ? '#d1fae5' : tag.includes('RedCard') ? '#fee2e2' : '#e0e7ff',
//                                                                                         color: tag.includes('Saved') ? '#065f46' : tag.includes('Organic') ? '#065f46' : tag.includes('RedCard') ? '#991b1b' : '#3730a3',
//                                                                                         fontSize: '0.65rem',
//                                                                                         height: 18,
//                                                                                         fontWeight: 500
//                                                                                     }}
//                                                                                 />
//                                                                             ))}
//                                                                         </Box>
//                                                                     </Box>
//                                                                 </Box>
//                                                             </TableCell>
//                                                             <TableCell>
//                                                                 <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
//                                                                     {receipt.date}
//                                                                 </Typography>
//                                                                 <Typography variant="caption" sx={{ color: '#94a3b8' }}>
//                                                                     {receipt.time}
//                                                                 </Typography>
//                                                             </TableCell>
//                                                             <TableCell align="right">
//                                                                 <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
//                                                                     ${receipt.amount.toFixed(2)}
//                                                                 </Typography>
//                                                             </TableCell>
//                                                         </TableRow>
//                                                     ))}
//                                                     {/* Summary Stats Row */}
//                                                     <TableRow sx={{ bgcolor: '#f8fafc' }}>
//                                                         <TableCell colSpan={3} sx={{ py: 2 }}>
//                                                             <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
//                                                                 <Box sx={{ textAlign: 'center' }}>
//                                                                     <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
//                                                                         Avg per trip
//                                                                     </Typography>
//                                                                     <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
//                                                                         $96.44
//                                                                     </Typography>
//                                                                 </Box>
//                                                                 <Divider orientation="vertical" flexItem />
//                                                                 <Box sx={{ textAlign: 'center' }}>
//                                                                     <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
//                                                                         Total trips
//                                                                     </Typography>
//                                                                     <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
//                                                                         4
//                                                                     </Typography>
//                                                                 </Box>
//                                                                 <Divider orientation="vertical" flexItem />
//                                                                 <Box sx={{ textAlign: 'center' }}>
//                                                                     <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
//                                                                         Total saved
//                                                                     </Typography>
//                                                                     <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>
//                                                                         $8.50
//                                                                     </Typography>
//                                                                 </Box>
//                                                             </Box>
//                                                         </TableCell>
//                                                     </TableRow>
//                                                 </TableBody>
//                                             </Table>
//                                         </TableContainer>
//                                     </Paper>
//                                 </Grid>
//                             )}
//
//                             {/* Savings Goal - Right */}
//                             <Grid item xs={12} lg={4}>
//                                 <Card
//                                     elevation={0}
//                                     sx={{
//                                         borderRadius: 3,
//                                         border: '1px solid #e2e8f0',
//                                         height: '100%'
//                                     }}
//                                 >
//                                     <CardContent>
//                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//                                             <Typography variant="h6" sx={{ fontWeight: 600, color: '#800000' }}>
//                                                 Savings Goal
//                                             </Typography>
//                                             <Button
//                                                 size="small"
//                                                 sx={{
//                                                     textTransform: 'none',
//                                                     color: '#800000',
//                                                     fontWeight: 600
//                                                 }}
//                                             >
//                                                 Manage Goal
//                                             </Button>
//                                         </Box>
//
//                                         {/* Emergency Fund Goal */}
//                                         <Box
//                                             sx={{
//                                                 p: 3,
//                                                 bgcolor: '#f0fdf4',
//                                                 borderRadius: 3,
//                                                 border: '1px solid #bbf7d0'
//                                             }}
//                                         >
//                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
//                                                 <Box>
//                                                     <Typography variant="body2" sx={{ color: '#166534', fontWeight: 600, mb: 0.5 }}>
//                                                         Emergency Fund
//                                                     </Typography>
//                                                     <Typography variant="h4" sx={{ fontWeight: 700, color: '#15803d' }}>
//                                                         $8,500
//                                                     </Typography>
//                                                 </Box>
//                                                 <Chip
//                                                     icon={<CheckCircle sx={{ fontSize: 16 }} />}
//                                                     label="On Track"
//                                                     size="small"
//                                                     sx={{
//                                                         bgcolor: '#22c55e',
//                                                         color: 'white',
//                                                         fontWeight: 600
//                                                     }}
//                                                 />
//                                             </Box>
//                                             <Box sx={{ mb: 2 }}>
//                                                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
//                                                     <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>
//                                                         Goal: $10,000
//                                                     </Typography>
//                                                     <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>
//                                                         85%
//                                                     </Typography>
//                                                 </Box>
//                                                 <LinearProgress
//                                                     variant="determinate"
//                                                     value={85}
//                                                     sx={{
//                                                         height: 8,
//                                                         borderRadius: 4,
//                                                         bgcolor: '#dcfce7',
//                                                         '& .MuiLinearProgress-bar': {
//                                                             borderRadius: 4,
//                                                             bgcolor: '#22c55e'
//                                                         }
//                                                     }}
//                                                 />
//                                             </Box>
//                                             <Divider sx={{ my: 2, borderColor: '#bbf7d0' }} />
//                                             <Box>
//                                                 <Typography variant="caption" sx={{ color: '#166534', display: 'block', mb: 0.5 }}>
//                                                     Monthly Target: $500
//                                                 </Typography>
//                                                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                                     <Typography variant="body2" sx={{ color: '#15803d', fontWeight: 600 }}>
//                                                         Saved this month: $500
//                                                     </Typography>
//                                                     <CheckCircle sx={{ fontSize: 20, color: '#22c55e' }} />
//                                                 </Box>
//                                             </Box>
//                                         </Box>
//                                     </CardContent>
//                                 </Card>
//                             </Grid>
//
//                             {/* Row 3: Recent Transactions - Full Width */}
//                             <Grid item xs={12}>
//                                 <Paper sx={{
//                                     boxShadow: 3,
//                                     borderRadius: 4,
//                                     overflow: 'hidden',
//                                     transition: 'box-shadow 0.3s ease-in-out',
//                                     '&:hover': {
//                                         boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
//                                     }
//                                 }}>
//                                     <Box sx={{ p: 3, pb: 0 }}>
//                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//                                             <Typography variant="h6" sx={{ fontWeight: 600, color: '#800000' }}>
//                                                 Recent Transactions
//                                             </Typography>
//                                             <Button
//                                                 size="small"
//                                                 sx={{
//                                                     textTransform: 'none',
//                                                     color: '#800000',
//                                                     fontWeight: 600
//                                                 }}
//                                             >
//                                                 View All
//                                             </Button>
//                                         </Box>
//                                     </Box>
//                                     <TableContainer>
//                                         <Table sx={{ tableLayout: 'fixed' }}>
//                                             <TableHead>
//                                                 <TableRow sx={{ backgroundColor: 'background.paper' }}>
//                                                     <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '12%' }}>
//                                                         Date
//                                                     </TableCell>
//                                                     <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '30%' }}>
//                                                         Description
//                                                     </TableCell>
//                                                     <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '18%' }}>
//                                                         Category
//                                                     </TableCell>
//                                                     <TableCell align="right" sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '20%' }}>
//                                                         Amount
//                                                     </TableCell>
//                                                     <TableCell align="right" sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '20%' }}>
//                                                         Balance
//                                                     </TableCell>
//                                                 </TableRow>
//                                             </TableHead>
//                                             <TableBody>
//                                                 {recentTransactions.map((transaction, index) => (
//                                                     <TableRow
//                                                         key={transaction.id}
//                                                         sx={{
//                                                             '&:last-child td, &:last-child th': { border: 0 },
//                                                             '&:hover': {
//                                                                 bgcolor: 'rgba(128, 0, 0, 0.04)',
//                                                                 cursor: 'pointer'
//                                                             },
//                                                             borderLeft: `4px solid ${transaction.type === 'income' ? '#10b981' : '#ef4444'}`,
//                                                         }}
//                                                     >
//                                                         <TableCell sx={{ color: '#64748b', fontWeight: 500 }}>
//                                                             {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
//                                                         </TableCell>
//                                                         <TableCell>
//                                                             <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
//                                                                 {transaction.description}
//                                                             </Typography>
//                                                         </TableCell>
//                                                         <TableCell>
//                                                             <Chip
//                                                                 label={transaction.category}
//                                                                 size="small"
//                                                                 sx={{
//                                                                     bgcolor: '#f1f5f9',
//                                                                     color: '#475569',
//                                                                     fontSize: '0.75rem',
//                                                                     fontWeight: 600
//                                                                 }}
//                                                             />
//                                                         </TableCell>
//                                                         <TableCell
//                                                             align="right"
//                                                             sx={{
//                                                                 fontWeight: 700,
//                                                                 fontSize: '0.95rem',
//                                                                 color: transaction.type === 'income' ? '#10b981' : '#ef4444'
//                                                             }}
//                                                         >
//                                                             {transaction.type === 'income' ? '+' : '-'}$
//                                                             {Math.abs(transaction.amount).toFixed(2)}
//                                                         </TableCell>
//                                                         <TableCell align="right" sx={{ fontWeight: 600, color: '#1e293b' }}>
//                                                             ${transaction.balance.toFixed(2)}
//                                                         </TableCell>
//                                                     </TableRow>
//                                                 ))}
//                                             </TableBody>
//                                         </Table>
//                                     </TableContainer>
//                                 </Paper>
//                             </Grid>
//                         </Grid>
//                     </Box>
//                 </Grid>
//             </Grid>
//
//             {/* Loading Backdrop */}
//             <Backdrop
//                 sx={{
//                     color: '#fff',
//                     zIndex: (theme) => theme.zIndex.drawer + 1,
//                     backgroundColor: 'rgba(0, 0, 0, 0.7)'
//                 }}
//                 open={isLoading}
//             >
//                 <Box sx={{ textAlign: 'center' }}>
//                     <CircularProgress color="inherit" size={60} />
//                     <Typography variant="h6" sx={{ mt: 2 }}>
//                         Importing CSV data...
//                     </Typography>
//                 </Box>
//             </Backdrop>
//
//             {/* Upload Reminder Dialog */}
//             <Dialog
//                 open={uploadReminderOpen}
//                 onClose={handleRemindLater}
//                 maxWidth="sm"
//                 fullWidth
//                 PaperProps={{
//                     sx: {
//                         borderRadius: 4,
//                         boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
//                     }
//                 }}
//             >
//                 <DialogTitle sx={{ pb: 1 }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                         <Box
//                             sx={{
//                                 width: 48,
//                                 height: 48,
//                                 borderRadius: 3,
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 justifyContent: 'center',
//                                 background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
//                                 color: 'white'
//                             }}
//                         >
//                             <AlertCircle size={24} />
//                         </Box>
//                         <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
//                             Upload Reminder
//                         </Typography>
//                     </Box>
//                 </DialogTitle>
//                 <DialogContent sx={{ pt: 2 }}>
//                     <Alert
//                         severity="warning"
//                         icon={<Upload size={20} />}
//                         sx={{
//                             mb: 2,
//                             borderRadius: 3,
//                             '& .MuiAlert-icon': {
//                                 alignItems: 'center'
//                             }
//                         }}
//                     >
//                         <AlertTitle sx={{ fontWeight: 600 }}>
//                             No Recent Transactions Found
//                         </AlertTitle>
//                         We haven't detected any transactions in the last 2 weeks.
//                     </Alert>
//
//                     <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.secondary }}>
//                         To keep your financial tracking accurate and up-to-date, please upload your recent transaction data.
//                     </Typography>
//
//                     <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
//                         Regular uploads help you:
//                     </Typography>
//                     <Box component="ul" sx={{ mt: 1, pl: 2, color: theme.palette.text.secondary }}>
//                         <li>Track your spending habits accurately</li>
//                         <li>Stay on top of your budget</li>
//                         <li>Identify trends and patterns</li>
//                         <li>Make informed financial decisions</li>
//                     </Box>
//                 </DialogContent>
//                 <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
//                     <Button
//                         onClick={handleRemindLater}
//                         variant="outlined"
//                         sx={{
//                             textTransform: 'none',
//                             borderRadius: 3,
//                             px: 3,
//                             fontWeight: 600
//                         }}
//                     >
//                         Remind Me Later
//                     </Button>
//                     <Button
//                         onClick={handleUploadNow}
//                         variant="contained"
//                         startIcon={<Upload size={18} />}
//                         sx={{
//                             textTransform: 'none',
//                             borderRadius: 3,
//                             px: 3,
//                             fontWeight: 600,
//                             background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
//                             '&:hover': {
//                                 background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
//                             }
//                         }}
//                     >
//                         Upload Now
//                     </Button>
//                 </DialogActions>
//             </Dialog>
//
//             {/* CSV Import Dialog */}
//             <CSVImportDialog open={importDialogOpen} onClose={handleImportClose} onImport={handleImportComplete}/>
//
//             {/* Snackbar for notifications */}
//             <Snackbar
//                 open={snackbarOpen}
//                 autoHideDuration={6000}
//                 onClose={handleSnackbarClose}
//                 anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
//             >
//                 <SnackbarAlert
//                     onClose={handleSnackbarClose}
//                     severity={snackbarSeverity}
//                     sx={{
//                         width: '100%',
//                         borderRadius: 3,
//                         fontWeight: 500
//                     }}
//                 >
//                     {snackbarMessage}
//                 </SnackbarAlert>
//             </Snackbar>
//         </Box>
//     );
// };
//
// export default DashboardPage;