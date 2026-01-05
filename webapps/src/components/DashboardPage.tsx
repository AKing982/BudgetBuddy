import React, {useEffect, useState} from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Container,
    Grid,
    Paper,
    Button,
    Box,
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
} from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import RecurringIcon from '@mui/icons-material/Repeat';
import SpendingIcon from '@mui/icons-material/MoneyOff';
import BudgetsIcon from '@mui/icons-material/AccountBalance';
import NetWorthIcon from '@mui/icons-material/TrendingUp';
import TransactionsIcon from '@mui/icons-material/Receipt';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import MainAppBar from "./MainAppBar";
import DrawerMenu from "./DrawerMenu";
import {useNavigate} from "react-router-dom";
import RecentTransactionsTable from "./RecentTransactionsTable";
import SpendingTracker from "./SpendingTracker";
import AccountSummary from "./AccountSummary";
import PaymentCharges from "./PaymentCharges";
import Sidebar from "./Sidebar";
import PlaidService from "../services/PlaidService";
import UserService from '../services/UserService';
import CsvUploadService from "../services/CsvUploadService";
import {AlertCircle, Upload} from "lucide-react";
import CSVImportDialog from "./CSVImportDialog";

const SnackbarAlert = React.forwardRef<HTMLDivElement, AlertProps>(
    function SnackbarAlert(props, ref) {
        return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
    }
);

const DashboardPage: React.FC = () => {
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [uploadReminderOpen, setUploadReminderOpen] = useState<boolean>(false);
    const [checkingTransactions, setCheckingTransactions] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
    const [error, setError] = useState<string | null>(null);
    const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);
    const userFullName = sessionStorage.getItem('fullName');
    const userId = Number(sessionStorage.getItem('userId'));
    const navigate = useNavigate();
    const theme = useTheme();
    const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
    const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));
    const plaidService = PlaidService.getInstance();
    const userService = UserService.getInstance();
    const csvUploadService = new CsvUploadService();

    // Add this useEffect hook to set the document title
    useEffect(() => {
        document.title = "Dashboard";

        // Optional: Return a cleanup function to reset the title when component unmounts
        return () => {
            document.title = "Dashboard";
        };
    }, []); // Empty dependency array means this runs once when component mounts


    const getResponsiveSpacing = () => {
        return isMdUp ? 1 : 1;
    }


    const spacing = getResponsiveSpacing();


    const handleDrawerToggle = () => {
        setDrawerOpen(!drawerOpen);
    };

    const handleLogout = () => {
        navigate('/');
    }

    const handleCloseDialog = () => {
        setUploadReminderOpen(false);
    }

    const handleUploadNow = () => {
        setUploadReminderOpen(false);
        setImportDialogOpen(true); // Open the CSV import dialog
    }

    const handleRemindLater = () => {
        setUploadReminderOpen(false);
        // Optionally set a flag in localStorage to remind later
        localStorage.setItem('uploadReminderDismissed', new Date().toISOString());
    };

    const handleImportClose = () => {
        setImportDialogOpen(false);
    };


    const handleImportComplete = async (data: {file: File, startDate: string, endDate: string}) => {
        setImportDialogOpen(false);

        // Optionally: Recheck for transactions after import
        try {
            console.log('Starting CSV Import....');
            setIsLoading(true);

            const result = await csvUploadService.uploadCsv({
                userId: userId,
                file: data.file,
                startDate: data.startDate,
                endDate: data.endDate
            });
            if(result.success)
            {
                console.log(`CSV Import successful:`, result.message);
                setSnackbarMessage('CSV file imported successfully!');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);

                const currentDate = new Date();
                const twoWeeksAgo = new Date();
                twoWeeksAgo.setDate(currentDate.getDate() - 14);

                const endDate = currentDate.toISOString().split('T')[0];
                const startDate = twoWeeksAgo.toISOString().split('T')[0];

                const transactionsExist = await csvUploadService.checkIfTransactionsExistForDateRange(
                    userId,
                    startDate,
                    endDate
                );
                if (transactionsExist) {
                    // Clear the dismissed flag since user has uploaded
                    localStorage.removeItem('uploadReminderDismissed');
                }
            }
            else
            {
                setError(result.message || 'Import failed');
                setSnackbarMessage(result.message || 'Import failed');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
            }
        } catch (error) {
            console.error('Error importing CSV:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to import CSV file';

            setSnackbarMessage(errorMessage);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);

            setError(errorMessage);
        }finally {
            setIsLoading(false);
        }
        console.log('Import completed');
    };

    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
        if (
            event.type === 'keydown' &&
            ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')
        ) {
            return;
        }
        setDrawerOpen(open);
    };

    // Check for recent transactions
    useEffect(() => {
        const checkRecentTransactions = async () => {
            try {
                setCheckingTransactions(true);

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
    }, [userId]);


    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon /> },
        { text: 'Recurring', icon: <RecurringIcon /> },
        { text: 'Spending', icon: <SpendingIcon /> },
        { text: 'Budgets', icon: <BudgetsIcon /> },
        { text: 'Net Worth', icon: <NetWorthIcon /> },
        { text: 'Transactions', icon: <TransactionsIcon /> },
        { text: 'Credit Score', icon: <CreditScoreIcon /> },
    ];

    const drawerContent = (
        <Box
            sx={{ width: 250 }}
            role="presentation"
            onClick={toggleDrawer(false)}
            onKeyDown={toggleDrawer(false)}
        >
            <List>
                {menuItems.map((item, index) => (
                    <ListItem button key={item.text}>
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
    return (
        <Box sx={{ display: 'flex', bgcolor: '#F3F4F6', minHeight: '100vh' }}>
            <Grid container>
                {/* Sidebar */}
                <Grid item xs={12} md={3} lg={2}>
                    <Sidebar />
                </Grid>

                {/* Main Content */}
                <Grid item xs={12} md={9} lg={10}>
                    <Box component="main" sx={{ p: { xs: 1, sm: 2, md: 3 }, height: '100%' }}>
                        <Grid container spacing={spacing}>
                            {/* Main Content Area */}
                            <Grid item xs={12} lg={5}>
                                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#111827', mb: 2 }}>
                                    Good morning, {userFullName}
                                </Typography>
                                <Grid container spacing={spacing}>
                                    {/* Expense Spending Tracker */}
                                    <Grid item xs={12}>
                                        <SpendingTracker />
                                    </Grid>
                                </Grid>
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
            <Dialog
                open={uploadReminderOpen}
                onClose={handleRemindLater}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadis: 4,
                        boxShadow: '0 8px 32px rgba(0, 0, 0.12)'
                    }
                }}>
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