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
import {
    LayoutDashboard,
    CalendarClock,
    PiggyBank,
    BarChart3,
    PieChart,
    Bell,
    Settings,
    MessageSquare,
} from 'lucide-react';

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
                width: 240,
                height: '100vh',
                bgcolor: 'white',
                color: 'text.primary',
                borderRight: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                left: 0,
                top: 0,
                overflowY: 'auto',
                boxShadow: '2px 0 5px rgba(0, 0, 0, 0.05)',
                '&::-webkit-scrollbar': {
                    width: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '4px',
                },
            }}
        >
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.primary.main, letterSpacing: '0.5px' }}>
                    BudgetBuddy
                </Typography>
            </Box>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Hi, Alexander
                </Typography>
                <Box>
                    <Bell size={18} style={{ marginRight: 12, cursor: 'pointer' }} />
                    <Settings size={18} style={{ cursor: 'pointer' }} />
                </Box>
            </Box>
            <List sx={{ flexGrow: 1, pt: 1 }}>
                {menuItems.map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        sx={{
                            py: 1.5,
                            px: 2,
                            '&:hover': {
                                bgcolor: 'action.hover',
                                '& .MuiListItemIcon-root': {
                                    color: theme.palette.primary.main,
                                },
                            },
                            '&.Mui-selected': {
                                bgcolor: theme.palette.primary.light,
                                '& .MuiListItemIcon-root': {
                                    color: theme.palette.primary.main,
                                },
                            },
                        }}
                    >
                        <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}>{item.icon}</ListItemIcon>
                        <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                                fontSize: '0.9rem',
                                fontWeight: 500
                            }}
                        />
                    </ListItem>
                ))}
            </List>
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', mb: 0.5 }}>
                    "Creativity is intelligence having fun."
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                    Albert Einstein
                </Typography>
            </Box>
            <ListItem
                button
                sx={{
                    bgcolor: theme.palette.primary.light,
                    color: theme.palette.primary.main,
                    '&:hover': {
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                    },
                    borderRadius: 2,
                    m: 2,
                    transition: 'all 0.3s',
                }}
            >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><MessageSquare size={20} /></ListItemIcon>
                <ListItemText primary="Chat with us" primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItem>
        </Box>
    );

    // return (
    //     <Box
    //         sx={{
    //             width: 240,
    //             height: '100vh',
    //             bgcolor: 'white',
    //             color: 'text.primary',
    //             borderRight: '1px solid',
    //             borderColor: 'divider',
    //             display: 'flex',
    //             flexDirection: 'column',
    //             position: 'fixed',
    //             left: 0,
    //             right: 0,
    //             overflowY: 'auto'
    //         }}
    //     >
    //         <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
    //             <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
    //                 BudgetBuddy
    //             </Typography>
    //         </Box>
    //         <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    //             <Typography variant="body2">
    //                 Hi, Alexander
    //             </Typography>
    //             <Box>
    //                 <Bell size={20} style={{ marginRight: 8 }} />
    //                 <Settings size={20} />
    //             </Box>
    //         </Box>
    //         <Typography variant="body2" sx={{ px: 2, py: 1, color: theme.palette.primary.main }}>
    //             Go Premium &gt;
    //         </Typography>
    //         <List sx={{ flexGrow: 1, pt: 0 }}>
    //             {menuItems.map((item) => (
    //                 <ListItem
    //                     button
    //                     key={item.text}
    //                     sx={{
    //                         '&:hover': {
    //                             bgcolor: 'action.hover',
    //                         },
    //                         py: 1,
    //                     }}
    //                 >
    //                     <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
    //                     <ListItemText primary={item.text} />
    //                 </ListItem>
    //             ))}
    //         </List>
    //         <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
    //             <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
    //                 "Creativity is intelligence having fun."
    //             </Typography>
    //             <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
    //                 Albert Einstein
    //             </Typography>
    //         </Box>
    //         <ListItem
    //             button
    //             sx={{
    //                 bgcolor: theme.palette.grey[100],
    //                 '&:hover': {
    //                     bgcolor: theme.palette.grey[200],
    //                 },
    //                 borderRadius: 1,
    //                 m: 1,
    //             }}
    //         >
    //             <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><MessageSquare size={20} /></ListItemIcon>
    //             <ListItemText primary="Chat with us" />
    //         </ListItem>
    //     </Box>
    // );
    //
    // return (
    //     <Box
    //         sx={{
    //             width: 280,
    //             height: '120vh',
    //             bgcolor: theme.palette.primary.main,
    //             color: theme.palette.primary.contrastText,
    //             boxShadow: 3,
    //             display: 'flex',
    //             flexDirection: 'column',
    //         }}
    //     >
    //         <Box sx={{ p: 3, textAlign: 'center' }}>
    //             <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
    //                 BudgetBuddy
    //             </Typography>
    //             <Typography variant="subtitle1">
    //                 Hi, Alexander
    //             </Typography>
    //         </Box>
    //         <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
    //         <List sx={{ flexGrow: 1 }}>
    //             {menuItems.map((item) => (
    //                 <ListItem
    //                     button
    //                     key={item.text}
    //                     sx={{
    //                         '&:hover': {
    //                             bgcolor: 'rgba(255,255,255,0.1)',
    //                         },
    //                         borderRadius: 1,
    //                         my: 0.5,
    //                         mx: 1,
    //                     }}
    //                 >
    //                     <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
    //                     <ListItemText primary={item.text} />
    //                 </ListItem>
    //             ))}
    //         </List>
    //         <Box sx={{ p: 2, mt: 'auto' }}>
    //             <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.8 }}>
    //                 "Budget for your future self."
    //             </Typography>
    //             <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
    //                 © 2024 BudgetBuddy
    //             </Typography>
    //         </Box>
    //         <ListItem
    //             button
    //             sx={{
    //                 bgcolor: theme.palette.secondary.main,
    //                 color: theme.palette.secondary.contrastText,
    //                 '&:hover': {
    //                     bgcolor: theme.palette.secondary.dark,
    //                 },
    //                 borderRadius: 1,
    //                 m: 1,
    //             }}
    //         >
    //             <ListItemIcon sx={{ color: 'inherit' }}><Chat /></ListItemIcon>
    //             <ListItemText primary="Chat with us" />
    //         </ListItem>
    //     </Box>
    // );

};

export default Sidebar;