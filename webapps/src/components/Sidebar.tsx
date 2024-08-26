import React from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider, useTheme
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
    const theme = useTheme();

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
        <Box
            sx={{
                width: 280,
                height: '120vh',
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                boxShadow: 3,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                    BudgetBuddy
                </Typography>
                <Typography variant="subtitle1">
                    Hi, Alexander
                </Typography>
            </Box>
            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
            <List sx={{ flexGrow: 1 }}>
                {menuItems.map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        sx={{
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.1)',
                            },
                            borderRadius: 1,
                            my: 0.5,
                            mx: 1,
                        }}
                    >
                        <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
            <Box sx={{ p: 2, mt: 'auto' }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.8 }}>
                    "Budget for your future self."
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                    © 2024 BudgetBuddy
                </Typography>
            </Box>
            <ListItem
                button
                sx={{
                    bgcolor: theme.palette.secondary.main,
                    color: theme.palette.secondary.contrastText,
                    '&:hover': {
                        bgcolor: theme.palette.secondary.dark,
                    },
                    borderRadius: 1,
                    m: 1,
                }}
            >
                <ListItemIcon sx={{ color: 'inherit' }}><Chat /></ListItemIcon>
                <ListItemText primary="Chat with us" />
            </ListItem>
        </Box>
    );

    // return (
    //     <Box sx={{ width: 240, height: '120vh', bgcolor: 'background.paper', boxShadow: 1 }}>
    //         <Typography variant="h6" sx={{ p: 2, fontWeight: 'bold' }}>
    //             BudgetBuddy
    //         </Typography>
    //         <Typography variant="subtitle1" sx={{ px: 2, pb: 2 }}>
    //             Hi, Alexander
    //         </Typography>
    //         <Divider />
    //         <List>
    //             {menuItems.map((item) => (
    //                 <ListItem button key={item.text}>
    //                     <ListItemIcon>{item.icon}</ListItemIcon>
    //                     <ListItemText primary={item.text} />
    //                 </ListItem>
    //             ))}
    //         </List>
    //         <Box sx={{ position: 'absolute', bottom: 80, px: 2 }}>
    //             <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
    //
    //             </Typography>
    //             <Typography variant="body2" sx={{ mt: 1 }}>
    //             </Typography>
    //         </Box>
    //         <ListItem button sx={{ position: 'absolute', bottom: -230, width: '100%' }}>
    //             <ListItemIcon><Chat /></ListItemIcon>
    //             <ListItemText primary="Chat with us" />
    //         </ListItem>
    //     </Box>
    // );
};

export default Sidebar;