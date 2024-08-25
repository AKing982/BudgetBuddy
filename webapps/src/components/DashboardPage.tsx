import React, { useState } from 'react';
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


const useDynamicSpacing = () => {
    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.only('xs'));
    const isSm = useMediaQuery(theme.breakpoints.only('sm'));
    const isMd = useMediaQuery(theme.breakpoints.only('md'));
    const isLg = useMediaQuery(theme.breakpoints.only('lg'));
    const isXl = useMediaQuery(theme.breakpoints.only('xl'));

    if (isXs) return 1;
    if (isSm) return 1.5;
    if (isMd) return 2;
    if (isLg) return 1;
    if (isXl) return 1;
    return 2; // Default spacing
};

const DashboardPage: React.FC = () => {
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const navigate = useNavigate();
    const spacing = useDynamicSpacing();
    const theme = useTheme();
    const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
    const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));
    // const spacing = 2; // You can adjust this or use your dynamic spacing logic
    // const tightSpacing = 1; // Adjust as needed
    // const responsiveSpacing = isMdUp ? -120 : 0; // Adjust as needed
    //


    const tightSpacing = Math.max(-220, spacing - 200);

    const getResponsiveSpacing = () => {
        if(isLgUp){
            return 20;
        }
        if(isMdUp){
            return -80;
        }
        return 0;
    }

    const responsiveSpacing = getResponsiveSpacing();


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
            <Sidebar />
            <Box sx={{ flexGrow: 1, p: spacing, ml: { md: responsiveSpacing } }}>
                <Grid container spacing={2}>
                    {/* Header */}
                    <Grid item xs={2}>
                        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#111827', mb: spacing }}>
                            Good morning, Alexander
                        </Typography>
                    </Grid>

                    {/* Main Content Area and Right Sidebar Container */}
                    <Grid item xs={12}>
                        <Grid container spacing={tightSpacing}>
                            {/* Main Content Area */}
                            <Grid item xs={12} md={8}>
                                <Grid container spacing={spacing}>
                                    {/* Expense Spending Tracker */}
                                    <Grid item xs={12}>
                                        <SpendingTracker />
                                    </Grid>

                                    {/* Transactions Table */}
                                    <Grid item xs={12}>
                                        <RecentTransactionsTable />
                                    </Grid>
                                </Grid>
                            </Grid>

                            {/* Right Sidebar */}
                            <Grid item xs={12} md={4}>
                                <Grid container spacing={spacing}>
                                    <Grid item xs={12} md={isMdUp ? 12 : 6}>
                                        <AccountSummary />
                                    </Grid>
                                    <Grid item xs={12} md={isMdUp ? 12 : 6}>
                                        <PaymentCharges />
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );

    //
    // return (
    //     <Box sx={{bgcolor: '#F3F4F6', minHeight: '100vh', p: spacing }}>
    //         <Grid container spacing={2} sx={{ ml: { md: responsiveSpacing } }}>
    //             {/* Header */}
    //             <Grid item xs={2}>
    //                 <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#111827', mb: spacing }}>
    //                     Good morning, Alexander
    //                 </Typography>
    //             </Grid>
    //
    //             {/* Main Content Area and Sidebar Container */}
    //             <Grid item xs={12}>
    //                 <Grid container spacing={tightSpacing}>
    //                     {/* Main Content Area */}
    //                     <Grid item xs={12} md={8}>
    //                         <Grid container spacing={spacing}>
    //                             {/* Expense Spending Tracker */}
    //                             <Grid item xs={12}>
    //                                 <SpendingTracker />
    //                             </Grid>
    //
    //                             {/* Transactions Table */}
    //                             <Grid item xs={12}>
    //                                 <RecentTransactionsTable />
    //                             </Grid>
    //                         </Grid>
    //                     </Grid>
    //
    //                     {/* Sidebar */}
    //                     <Grid item xs={12} md={4}>
    //                         <Grid container spacing={spacing}>
    //                             <Grid item xs={12} md={isMdUp ? 12 : 6}>
    //                                 <AccountSummary />
    //                             </Grid>
    //                             <Grid item xs={12} md={isMdUp ? 12 : 6}>
    //                                 <PaymentCharges />
    //                             </Grid>
    //                         </Grid>
    //                     </Grid>
    //                 </Grid>
    //             </Grid>
    //         </Grid>
    //     </Box>
    // );

};

export default DashboardPage;