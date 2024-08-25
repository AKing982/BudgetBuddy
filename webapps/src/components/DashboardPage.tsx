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

const DashboardPage: React.FC = () => {
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const navigate = useNavigate();

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
        <>
            <MainAppBar onMenuClick={handleDrawerToggle} />
            <DrawerMenu open={drawerOpen} onClose={handleDrawerToggle}/>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={3}>
                    {/* Main content */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h4" component="h1" gutterBottom>
                                Good afternoon, Alexander
                            </Typography>
                            <Typography variant="h6" gutterBottom>
                                Current spend this month
                            </Typography>
                            <Typography variant="h3" component="p" gutterBottom>
                                $1,634
                            </Typography>
                            {/* Placeholder for chart */}
                            <Box sx={{ height: 300, bgcolor: 'lightgrey', my: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Recent Transactions
                            </Typography>
                            <List>
                                {/* Sample transaction items */}
                                {[
                                    { date: '8/8', name: 'WinCo', amount: '$25.47' },
                                    { date: '8/7', name: 'WinCo', amount: '$6.26' },
                                    { date: '8/6', name: 'Questongas Questangas Questangas', amount: '$12.79' },
                                ].map((transaction, index) => (
                                    <ListItem key={index}>
                                        <ListItemText
                                            primary={transaction.name}
                                            secondary={transaction.date}
                                        />
                                        <Typography>{transaction.amount}</Typography>
                                    </ListItem>
                                ))}
                            </List>
                            <Button variant="outlined">See more transactions</Button>
                        </Paper>
                    </Grid>

                    {/* Right sidebar */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h6" gutterBottom>Accounts</Typography>
                            <List>
                                {[
                                    { name: 'Checking', amount: '$168' },
                                    { name: 'Credit Cards', amount: 'Add +' },
                                    { name: 'Net Cash', amount: '$168' },
                                    { name: 'Savings', amount: '$918' },
                                    { name: 'Investments', amount: 'Add +' },
                                ].map((account, index) => (
                                    <ListItem key={index}>
                                        <ListItemText primary={account.name} />
                                        <Typography>{account.amount}</Typography>
                                    </ListItem>
                                ))}
                            </List>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="h6" gutterBottom>Coming Up</Typography>
                            <Typography variant="body2" gutterBottom>
                                You have 3 recurring charges due within the next 7 days for $38.06.
                            </Typography>
                            {/* Calendar placeholder */}
                            <Box sx={{ height: 100, bgcolor: 'lightgrey', my: 2 }} />
                            <List>
                                {[
                                    { name: 'Hulu', amount: '$8.57', days: 2 },
                                    { name: 'JetBrains', amount: '$14.48', days: 5 },
                                    { name: 'YouTube Premium', amount: '$15.01', days: 6 },
                                ].map((bill, index) => (
                                    <ListItem key={index}>
                                        <ListItemText
                                            primary={bill.name}
                                            secondary={`in ${bill.days} days`}
                                        />
                                        <Typography>{bill.amount}</Typography>
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </>
    );
};

export default DashboardPage;