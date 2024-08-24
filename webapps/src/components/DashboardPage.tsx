import React from 'react';
import {
    Container, Grid, Paper, Typography, List, ListItem, ListItemText,
    ListItemIcon, Button, Box, Divider
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Repeat as RecurringIcon,
    MoneyOff as SpendingIcon,
    AccountBalance as BudgetsIcon,
    TrendingUp as NetWorthIcon,
    Receipt as TransactionsIcon,
    CreditScore as CreditScoreIcon
} from '@mui/icons-material';

const DashboardPage = () => {
    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                {/* Sidebar */}
                <Grid item xs={12} md={3} lg={2}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" component="h2" gutterBottom>
                            Hi, Alexander
                        </Typography>
                        <List>
                            {[
                                { text: 'Dashboard', icon: <DashboardIcon /> },
                                { text: 'Recurring', icon: <RecurringIcon /> },
                                { text: 'Spending', icon: <SpendingIcon /> },
                                { text: 'Budgets', icon: <BudgetsIcon /> },
                                { text: 'Net Worth', icon: <NetWorthIcon /> },
                                { text: 'Transactions', icon: <TransactionsIcon /> },
                                { text: 'Credit Score', icon: <CreditScoreIcon /> },
                            ].map((item, index) => (
                                <ListItem button key={item.text}>
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                {/* Main content */}
                <Grid item xs={12} md={6} lg={7}>
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
                <Grid item xs={12} md={3}>
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
    );
};

export default DashboardPage;