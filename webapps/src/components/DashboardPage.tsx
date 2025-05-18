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
    useTheme
} from '@mui/material';
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


const DashboardPage: React.FC = () => {
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const navigate = useNavigate();
    const theme = useTheme();
    const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
    const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));
    const plaidService = PlaidService.getInstance();

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


    const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
        if (
            event.type === 'keydown' &&
            ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')
        ) {
            return;
        }
        setDrawerOpen(open);
    };

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
                                    Good morning, Alexander
                                </Typography>
                                <Grid container spacing={spacing}>
                                    {/* Expense Spending Tracker */}
                                    <Grid item xs={12}>
                                        <SpendingTracker />
                                    </Grid>

                                    {/*/!* Transactions Table *!/*/}
                                    {/*<Grid item xs={12}>*/}
                                    {/*    <RecentTransactionsTable />*/}
                                    {/*</Grid>*/}
                                </Grid>
                            </Grid>

                            {/* Right Sidebar */}
                            {/*<Grid item xs={12} lg={3}>*/}
                            {/*    <Grid container spacing={spacing}>*/}
                            {/*        <Grid item xs={12}>*/}
                            {/*            <AccountSummary />*/}
                            {/*        </Grid>*/}
                            {/*        <Grid item xs={12} lg={12}>*/}
                            {/*            <PaymentCharges />*/}
                            {/*        </Grid>*/}
                            {/*    </Grid>*/}
                            {/*</Grid>*/}
                        </Grid>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );

};

export default DashboardPage;