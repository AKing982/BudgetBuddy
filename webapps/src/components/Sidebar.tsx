import React, {useEffect, useState} from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    useTheme,
    Avatar,
    IconButton,
    ListItemButton,
    alpha,
    Button,
    Menu,
    MenuItem,
    Fade
} from '@mui/material';
import {
    Dashboard,
    EventRepeat,
    AttachMoney,
    AccountBalance,
    TrendingUp,
    Search,
    CreditScore
} from '@mui/icons-material';
import {
    Bell,
    Settings,
    MessageSquare, Sparkles, HelpCircle, BellIcon, User, CreditCard, Shield, LogOut,
} from 'lucide-react';
import {useLocation, useNavigate} from "react-router-dom";
import SidebarMenu from "./SidebarMenu";
import BudgetService, {Budget} from "../services/BudgetService";
import UserService from '../services/UserService';
import {BudgetType} from "../domain/BudgetType";
import Tooltip from '@mui/material/Tooltip';
import UserLogService from "../services/UserLogService";
import {UserLog} from "../utils/Items";
import SessionService from "../services/SessionService";

interface MenuItem {
    text: string;
    icon: React.ReactNode;
    path: string;
}


const Sidebar: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedItem, setSelectedItem] = useState<string>('');
    const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [username, setUserName] = useState<string>('');
    const [budgetType, setBudgetType] = useState<BudgetType>();
    const budgetService = BudgetService.getInstance();
    const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
    const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
    const userService = UserService.getInstance();
    const userFullName = sessionStorage.getItem('fullName');
    const userEmail = sessionStorage.getItem('email');
    const userLogService = UserLogService.getInstance();

    const fetchBudgetTypeFromBudget = (budget: Budget[]): BudgetType => {
        if(budget.length === 0){
            return BudgetType.SAVINGS;
        }
        // Assume the user only has a single budget
        const singleBudget: Budget = budget[0];
        let budgetName = singleBudget?.budgetName;
        switch(budgetName){
            case 'Savings Budget':
                return BudgetType.SAVINGS;
            case 'Spending Control Budget':
                return BudgetType.CONTROL_SPENDING;
            case 'Debt Payoff Budget':
                return BudgetType.PAY_DEBT;
            default:
                throw new Error('Unknown Budget Name');
        }

    }

    useEffect(() => {
        const fetchBudgetType = async () => {
            try
            {
                const userId = Number(sessionStorage.getItem('userId'));
                const response = await budgetService.getBudgetTypeByUserId(userId);
                if(!response) throw new Error('Budget Response is empty or null');
                const fetchBudgetType = fetchBudgetTypeFromBudget(response);
                setBudgetType(fetchBudgetType);

            }catch(error){
                console.error('Error fetching budget: ', error);
            }
        };
        fetchBudgetType();
    })

    const getBudgetPath = () => {
        switch (budgetType) {
            case BudgetType.SAVINGS:
                return '/budgets';
            case BudgetType.CONTROL_SPENDING:
                return '/budget-spending';
            case BudgetType.PAY_DEBT:
                return '/budget-debt';
            case BudgetType.EMERGENCY_FUND:
                return '/budget-emergency';
            default:
                return '/budgets';
        }
    };

    const menuItems = [
        { text: 'Dashboard', icon: <Dashboard /> , path: '/dashboard'},
        // { text: 'Recurring', icon: <EventRepeat />, path: '/recurring' },
        // { text: 'Spending', icon: <AttachMoney /> , path: '/spending'},
        { text: 'Budgets', icon: <AccountBalance /> , path: getBudgetPath()},
        // { text: 'Net Worth', icon: <TrendingUp />, path: '/net-worth' },
        { text: 'Transactions', icon: <Search /> , path: '/transactions'},
        // { text: 'Credit Score', icon: <CreditScore />, path: '/score' },
    ];

    useEffect(() => {
        const currentPath = location.pathname;
        const currentItem = menuItems.find(item => item.path === currentPath);
        if(currentItem){
            setSelectedItem(currentItem.text);
        }
    }, [location]);

    const handleMenuToggle = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleMenuClose = () => {
        setIsMenuOpen(false);
    };

    const handleItemClick = (path: string, text: string): void => {
        navigate(path);
        setSelectedItem(text);
    }

    const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
        setSettingsAnchorEl(event.currentTarget);
    };

    const handleSettingsClose = () => {
        setSettingsAnchorEl(null);
    };

    const handleNotificationsClick = (event: React.MouseEvent<HTMLElement>) => {
        setNotificationsAnchorEl(event.currentTarget);
    };

    const handleNotificationsClose = () => {
        setNotificationsAnchorEl(null);
    };

    const handleLogout = async () => {
        try {
            const sessionService = SessionService.getInstance();

            // 1. Invalidate session on backend (this will also handle session logging)
            await sessionService.invalidateSession();

            // 2. Clear all client-side storage
            sessionStorage.clear();
            localStorage.clear();

            // 3. Close any open menus
            handleSettingsClose();
            handleNotificationsClose();

            // 4. Navigate to login page
            navigate('/');

            console.log('Logout completed successfully');
        } catch (error) {
            console.error('Error during logout:', error);

            // Even if backend logout fails, clear local data and redirect
            sessionStorage.clear();
            localStorage.clear();
            handleSettingsClose();
            handleNotificationsClose();
            navigate('/');
        }
    };

    return (
        <Box
            sx={{
                width: 250,
                height: '100vh',
                bgcolor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                borderRight: '1px solid',
                borderColor: theme.palette.divider,
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                left: 0,
                top: 0,
                overflowY: 'auto',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.05)',
                zIndex: 1200,
                '&::-webkit-scrollbar': {
                    width: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '4px',
                },
            }}
        >
            {/* Logo and App Name */}
            <Box sx={{
                p: 3,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
            }}>
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 800,
                        color: theme.palette.primary.main,
                        letterSpacing: '-0.5px',
                        fontFamily: '"Poppins", sans-serif',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                >
                    BudgetBuddy
                </Typography>
            </Box>

            {/* User Profile Section */}
            <Box
                sx={{
                    p: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    background: alpha(theme.palette.background.default, 0.5),
                }}
            >
                <Avatar
                    sx={{
                        bgcolor: theme.palette.primary.main,
                        width: 40,
                        height: 40,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    A
                </Avatar>
                <Box sx={{ ml: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {userFullName}
                    </Typography>
                    <Typography variant="caption" sx={{
                        color: 'text.secondary',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <Box
                            component="span"
                            sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: '#10b981',
                                display: 'inline-block',
                                mr: 0.5
                            }}
                        />
                        Premium Plan
                    </Typography>
                </Box>
                <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Notifications">
                        <IconButton
                            size="small"
                            onClick={handleNotificationsClick}
                            sx={{
                                color: theme.palette.text.secondary,
                                '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main
                                }
                            }}
                        >
                            <BellIcon size={18} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Settings">
                        <IconButton
                            size="small"
                            onClick={handleSettingsClick}
                            sx={{
                                color: theme.palette.text.secondary,
                                '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main
                                }
                            }}
                        >
                            <Settings size={18} />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Settings Menu */}
                <Menu
                    anchorEl={settingsAnchorEl}
                    open={Boolean(settingsAnchorEl)}
                    onClose={handleSettingsClose}
                    TransitionComponent={Fade}
                    PaperProps={{
                        elevation: 3,
                        sx: {
                            minWidth: 200,
                            mt: 1.5,
                            borderRadius: 2,
                            overflow: 'hidden',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                        }
                    }}
                >
                    <Box sx={{
                        pt: 2,
                        pb: 1,
                        px: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                    }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {userFullName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {userEmail}
                        </Typography>
                    </Box>
                    <MenuItem onClick={handleSettingsClose} sx={{ py: 1.5 }}>
                        <ListItemIcon>
                            <User size={18} />
                        </ListItemIcon>
                        <ListItemText primary="Profile" />
                    </MenuItem>
                    <MenuItem onClick={handleSettingsClose} sx={{ py: 1.5 }}>
                        <ListItemIcon>
                            <CreditCard size={18} />
                        </ListItemIcon>
                        <ListItemText primary="Billing" />
                    </MenuItem>
                    <MenuItem onClick={handleSettingsClose} sx={{ py: 1.5 }}>
                        <ListItemIcon>
                            <Shield size={18} />
                        </ListItemIcon>
                        <ListItemText primary="Security" />
                    </MenuItem>
                    <Divider />
                    <MenuItem
                        onClick={handleLogout}
                        sx={{
                            py: 1.5,
                            color: theme.palette.error.main,
                            '&:hover': {
                                bgcolor: alpha(theme.palette.error.main, 0.05)
                            }
                        }}
                    >
                        <ListItemIcon sx={{ color: 'inherit' }}>
                            <LogOut size={18} />
                        </ListItemIcon>
                        <ListItemText primary="Logout" />
                    </MenuItem>
                </Menu>

                {/* Notifications Menu */}
                <Menu
                    anchorEl={notificationsAnchorEl}
                    open={Boolean(notificationsAnchorEl)}
                    onClose={handleNotificationsClose}
                    TransitionComponent={Fade}
                    PaperProps={{
                        elevation: 3,
                        sx: {
                            minWidth: 280,
                            maxWidth: 320,
                            mt: 1.5,
                            borderRadius: 2,
                            overflow: 'hidden',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                        }
                    }}
                >
                    <Box sx={{
                        py: 1.5,
                        px: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                    }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Notifications
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                color: theme.palette.primary.main,
                                cursor: 'pointer',
                                fontWeight: 600,
                                '&:hover': { textDecoration: 'underline' }
                            }}
                        >
                            Mark all as read
                        </Typography>
                    </Box>
                    <MenuItem onClick={handleNotificationsClose} sx={{ py: 1.5, px: 2 }}>
                        <ListItemIcon>
                            <Box
                                sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: theme.palette.primary.main,
                                    mt: 1
                                }}
                            />
                        </ListItemIcon>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Budget update available
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Your May budget is ready for review
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', mt: 0.5 }}>
                                2 minutes ago
                            </Typography>
                        </Box>
                    </MenuItem>
                    <MenuItem onClick={handleNotificationsClose} sx={{ py: 1.5, px: 2 }}>
                        <ListItemIcon>
                            <Box
                                sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: theme.palette.primary.main,
                                    mt: 1
                                }}
                            />
                        </ListItemIcon>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Spending alert
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                You've reached 80% of your dining budget
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', mt: 0.5 }}>
                                1 hour ago
                            </Typography>
                        </Box>
                    </MenuItem>
                    <Box sx={{
                        p: 1.5,
                        textAlign: 'center',
                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                    }}>
                        <Button
                            size="small"
                            fullWidth
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600
                            }}
                        >
                            View all notifications
                        </Button>
                    </Box>
                </Menu>
            </Box>

            {/* Navigation Menu */}
            <List sx={{ flexGrow: 1, py: 2 }}>
                {menuItems.map((item) => (
                    <ListItem
                        disablePadding
                        key={item.text}
                        sx={{ mb: 0.5 }}
                    >
                        <ListItemButton
                            onClick={() => handleItemClick(item.path, item.text)}
                            selected={selectedItem === item.text}
                            sx={{
                                py: 1.2,
                                px: 2.5,
                                mx: 1,
                                borderRadius: 2,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                    transform: 'translateX(4px)'
                                },
                                '&.Mui-selected': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.18),
                                    },
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        left: 0,
                                        top: '20%',
                                        bottom: '20%',
                                        width: 4,
                                        borderRadius: '0 4px 4px 0',
                                        backgroundColor: theme.palette.primary.main,
                                    }
                                },
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    color: selectedItem === item.text
                                        ? theme.palette.primary.main
                                        : theme.palette.text.secondary,
                                    minWidth: 36
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.text}
                                primaryTypographyProps={{
                                    fontSize: '0.95rem',
                                    fontWeight: selectedItem === item.text ? 600 : 500,
                                    color: selectedItem === item.text
                                        ? theme.palette.primary.main
                                        : theme.palette.text.primary,
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            {/* Pro Features Banner */}
            <Box
                sx={{
                    mx: 2,
                    mb: 2,
                    p: 2.5,
                    borderRadius: 3,
                    backgroundImage: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                    color: 'white',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
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
                }}
            >
                <Sparkles size={28} color="white" style={{ marginBottom: 12, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    Upgrade to Premium
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                    Get advanced insights and unlimited budget tracking
                </Typography>
                <Button
                    variant="contained"
                    fullWidth
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        bgcolor: 'white',
                        color: '#4f46e5',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                        '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.9)',
                        }
                    }}
                >
                    Upgrade Now
                </Button>
            </Box>

            {/* Support Button */}
            <Box sx={{ p: 2, pt: 0 }}>
                <Button
                    variant="outlined"
                    startIcon={<HelpCircle size={16} />}
                    fullWidth
                    sx={{
                        py: 1.2,
                        borderRadius: 2,
                        justifyContent: 'flex-start',
                        color: theme.palette.text.secondary,
                        borderColor: alpha(theme.palette.divider, 0.8),
                        bgcolor: alpha(theme.palette.background.default, 0.8),
                        '&:hover': {
                            borderColor: theme.palette.primary.main,
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                        },
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    Support Center
                </Button>
            </Box>
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
    //             top: 0,
    //             overflowY: 'auto',
    //             boxShadow: '2px 0 5px rgba(0, 0, 0, 0.05)',
    //             '&::-webkit-scrollbar': {
    //                 width: '8px',
    //             },
    //             '&::-webkit-scrollbar-thumb': {
    //                 backgroundColor: 'rgba(0, 0, 0, 0.1)',
    //                 borderRadius: '4px',
    //             },
    //         }}
    //     >
    //         <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
    //             <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.primary.main, letterSpacing: '0.5px' }}>
    //                 BudgetBuddy
    //             </Typography>
    //         </Box>
    //         <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    //             <Typography variant="body2" sx={{ fontWeight: 500 }}>
    //                 Hi, Alexander
    //             </Typography>
    //             <Box>
    //                 <Bell size={18} style={{ marginRight: 12, cursor: 'pointer' }} />
    //                 <Settings
    //                     size={18}
    //                     style={{ cursor: 'pointer' }}
    //                     onClick={handleMenuToggle}/>
    //             </Box>
    //         </Box>
    //         <List sx={{ flexGrow: 1, pt: 1 }}>
    //             {menuItems.map((item) => (
    //                 <ListItem
    //                     button
    //                     key={item.text}
    //                     onClick={() => handleItemClick(item.path, item.text)}
    //                     selected={selectedItem === item.text}
    //                     sx={{
    //                         py: 1.5,
    //                         px: 2,
    //                         '&:hover': {
    //                             bgcolor: 'action.hover',
    //                             '& .MuiListItemIcon-root': {
    //                                 color: theme.palette.primary.main,
    //                             },
    //                         },
    //                         '&.Mui-selected': {
    //                             bgcolor: theme.palette.primary.light,
    //                             '& .MuiListItemIcon-root': {
    //                                 color: theme.palette.primary.main,
    //                             },
    //                         },
    //                     }}
    //                 >
    //                     <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}>{item.icon}</ListItemIcon>
    //                     <ListItemText
    //                         primary={item.text}
    //                         primaryTypographyProps={{
    //                             fontSize: '0.9rem',
    //                             fontWeight: 500
    //                         }}
    //                     />
    //                 </ListItem>
    //             ))}
    //         </List>
    //         <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
    //             <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', mb: 0.5 }}>
    //                 "Creativity is intelligence having fun."
    //             </Typography>
    //             <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
    //                 Albert Einstein
    //             </Typography>
    //         </Box>
    //         <ListItem
    //             button
    //             sx={{
    //                 bgcolor: theme.palette.primary.light,
    //                 color: theme.palette.primary.main,
    //                 '&:hover': {
    //                     bgcolor: theme.palette.primary.main,
    //                     color: theme.palette.primary.contrastText,
    //                 },
    //                 borderRadius: 2,
    //                 m: 2,
    //                 transition: 'all 0.3s',
    //             }}
    //         >
    //             <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><MessageSquare size={20} /></ListItemIcon>
    //             <ListItemText primary="Chat with us" primaryTypographyProps={{ fontWeight: 600 }} />
    //         </ListItem>
    //         <SidebarMenu isOpen={isMenuOpen} onClose={handleMenuClose} />
    //     </Box>
    // );

};

export default Sidebar;