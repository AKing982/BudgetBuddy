import React from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider
} from '@mui/material';
import {
    Dashboard,
    EventRepeat,
    AttachMoney,
    AccountBalance,
    TrendingUp,
    Search,
    CreditScore,
    Chat
} from '@mui/icons-material';

const Sidebar = () => {
    const menuItems = [
        { text: 'Dashboard', icon: <Dashboard /> },
        { text: 'Recurring', icon: <EventRepeat /> },
        { text: 'Spending', icon: <AttachMoney /> },
        { text: 'Budgets', icon: <AccountBalance /> },
        { text: 'Net Worth', icon: <TrendingUp /> },
        { text: 'Transactions', icon: <Search /> },
        { text: 'Credit Score', icon: <CreditScore /> },
    ];

    return (
        <Box sx={{ width: 240, height: '120vh', bgcolor: 'background.paper', boxShadow: 1 }}>
            <Typography variant="h6" sx={{ p: 2, fontWeight: 'bold' }}>
                BudgetBuddy
            </Typography>
            <Typography variant="subtitle1" sx={{ px: 2, pb: 2 }}>
                Hi, Alexander
            </Typography>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem button key={item.text}>
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
            <Box sx={{ position: 'absolute', bottom: 80, px: 2 }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>

                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                </Typography>
            </Box>
            <ListItem button sx={{ position: 'absolute', bottom: -230, width: '100%' }}>
                <ListItemIcon><Chat /></ListItemIcon>
                <ListItemText primary="Chat with us" />
            </ListItem>
        </Box>
    );
};

export default Sidebar;