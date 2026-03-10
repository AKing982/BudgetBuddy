import React, { useEffect, useState } from 'react';
import {
    Box, Typography, List, ListItem, ListItemIcon, ListItemText,
    Divider, Avatar, IconButton, ListItemButton, Button, Menu, MenuItem, Fade,
} from '@mui/material';
import { Dashboard, AccountBalance, Search, ShoppingCart } from '@mui/icons-material';
import {
    Settings, HelpCircle, BellIcon, User, CreditCard,
    Shield, LogOut, Calculator, Sparkles, BarChartIcon, BarChart2,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import SidebarMenu from './SidebarMenu';
import BudgetService, { Budget } from '../services/BudgetService';
import UserService from '../services/UserService';
import { BudgetType } from '../domain/BudgetType';
import Tooltip from '@mui/material/Tooltip';
import UserLogService from '../services/UserLogService';
import SessionService from '../services/SessionService';
import {BarChart} from "recharts";

interface MenuItemType {
    text: string;
    icon: React.ReactNode;
    path: string;
}

// ─── Tokens ──────────────────────────────────────────────────────────────────
const MAROON      = '#800000';
const MAROON_DARK = '#5c0000';
const MAROON_BG   = 'rgba(128,0,0,0.06)';
const MAROON_BDR  = 'rgba(128,0,0,0.16)';

const SIDEBAR_BG  = '#ffffff';          // white — pops against the #f5f4f2 page bg
const BORDER      = 'rgba(0,0,0,0.08)'; // right border shadow line
const CARD_BG     = '#f8f9fa';          // very slight grey for inner cards
const TEXT_1      = '#111827';
const TEXT_2      = '#6b7280';
const HOVER_BG    = 'rgba(0,0,0,0.035)';

const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [selectedItem, setSelectedItem]                   = useState<string>('');
    const [isMenuOpen, setIsMenuOpen]                       = useState<boolean>(false);
    const [budgetType, setBudgetType]                       = useState<BudgetType>();
    const [settingsAnchorEl, setSettingsAnchorEl]           = useState<null | HTMLElement>(null);
    const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);

    const budgetService  = BudgetService.getInstance();
    const userService    = UserService.getInstance();
    const userLogService = UserLogService.getInstance();
    const userFullName   = sessionStorage.getItem('fullName');
    const userEmail      = sessionStorage.getItem('email');

    // ── All original service logic (unchanged) ───────────────────────────────
    const fetchBudgetTypeFromBudget = (budget: Budget[]): BudgetType => {
        if (budget.length === 0) return BudgetType.SAVINGS;
        switch (budget[0]?.budgetName) {
            case 'Savings Budget':          return BudgetType.SAVINGS;
            case 'Spending Control Budget': return BudgetType.CONTROL_SPENDING;
            case 'Debt Payoff Budget':      return BudgetType.PAY_DEBT;
            default: throw new Error('Unknown Budget Name');
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                const userId = Number(sessionStorage.getItem('userId'));
                const res = await budgetService.getBudgetTypeByUserId(userId);
                if (!res) throw new Error('Budget Response is empty or null');
                setBudgetType(fetchBudgetTypeFromBudget(res));
            } catch (e) { console.error('Error fetching budget:', e); }
        };
        load();
    }, []);

    const getBudgetPath = () => {
        switch (budgetType) {
            case BudgetType.SAVINGS:          return '/budgets';
            case BudgetType.CONTROL_SPENDING: return '/budget-spending';
            case BudgetType.PAY_DEBT:         return '/budget-debt';
            case BudgetType.EMERGENCY_FUND:   return '/budget-emergency';
            default:                          return '/budgets';
        }
    };

    const menuItems: MenuItemType[] = [
        { text: 'Dashboard',       icon: <Dashboard sx={{ fontSize: 20 }} />,     path: '/dashboard' },
        { text: 'Budgets',         icon: <AccountBalance sx={{ fontSize: 20 }} />, path: getBudgetPath() },
        { text: 'Spending Tracker', icon: <BarChart2 size={20} />, path: '/spending-tracker' },
        // { text: 'Grocery Tracker', icon: <ShoppingCart sx={{ fontSize: 20 }} />,  path: '/grocery-tracker' },
        { text: 'Transactions',    icon: <Search sx={{ fontSize: 20 }} />,         path: '/transactions' },
        { text: 'BudgetPlanner',   icon: <Calculator size={19} />,                path: '/budget-planner' },
    ];

    useEffect(() => {
        const cur = menuItems.find(i => i.path === location.pathname);
        if (cur) setSelectedItem(cur.text);
    }, [location]);

    const handleItemClick          = (path: string, text: string) => { navigate(path); setSelectedItem(text); };
    const handleSettingsClick      = (e: React.MouseEvent<HTMLElement>) => setSettingsAnchorEl(e.currentTarget);
    const handleSettingsClose      = () => setSettingsAnchorEl(null);
    const handleNotificationsClick = (e: React.MouseEvent<HTMLElement>) => setNotificationsAnchorEl(e.currentTarget);
    const handleNotificationsClose = () => setNotificationsAnchorEl(null);

    const handleLogout = async () => {
        try {
            const userId = Number(sessionStorage.getItem('userId'));
            const userLog = await userLogService.fetchActiveUserLogByUserId(userId);
            if (userLog?.id && userLog?.lastLogin) {
                const sessionDuration = userLogService.calculateSessionDuration(userLog.lastLogin);
                await userLogService.updateUserLog(userLog.id, {
                    userId, lastLogin: userLog.lastLogin, sessionDuration,
                    lastLogout: new Date().toISOString(), isActive: false,
                });
            }
            sessionStorage.clear(); localStorage.clear();
            handleSettingsClose(); handleNotificationsClose();
            navigate('/');
        } catch (error) {
            console.error('Error during logout:', error);
            sessionStorage.clear(); localStorage.clear();
            handleSettingsClose(); handleNotificationsClose();
            navigate('/');
        }
    };

    const initials = (userFullName ?? 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    const dropdownPaper = {
        elevation: 0,
        sx: {
            minWidth: 220, mt: 1, borderRadius: '12px', overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.09)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.10)',
        },
    };

    return (
        <Box sx={{
            width: 250,
            height: '100vh',
            bgcolor: SIDEBAR_BG,
            borderRight: `1px solid ${BORDER}`,
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            left: 0, top: 0,
            overflowY: 'auto',
            zIndex: 1200,
            // Shadow does the work of separating from the warm page bg
            boxShadow: '4px 0 16px rgba(0,0,0,0.07)',
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 4 },
        }}>

            {/* ── LOGO ────────────────────────────────────────────────────── */}
            <Box sx={{
                px: 2.5, pt: 2.5, pb: 2,
                borderBottom: `1px solid ${BORDER}`,
                display: 'flex', justifyContent: 'center',
            }}>
                <Box
                    component="img"
                    src="/budget_buddy_logo_clean.png"
                    alt="Budget Buddy"
                    sx={{
                        width: '85%',
                        maxWidth: 175,
                        height: 'auto',
                        objectFit: 'contain',
                        display: 'block',
                    }}
                />
            </Box>

            {/* ── USER CARD ───────────────────────────────────────────────── */}
            <Box sx={{
                mx: 1.5, mt: 2, mb: 0.5,
                p: '10px 12px',
                borderRadius: '10px',
                bgcolor: CARD_BG,
                border: `1px solid rgba(0,0,0,0.07)`,
                display: 'flex', alignItems: 'center', gap: 1.25,
            }}>
                <Avatar sx={{
                    width: 34, height: 34, fontSize: '0.75rem', fontWeight: 800,
                    bgcolor: MAROON, color: '#fff', flexShrink: 0,
                }}>
                    {initials}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{
                        fontSize: '0.8rem', fontWeight: 700, color: TEXT_1,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        lineHeight: 1.25,
                    }}>
                        {userFullName ?? 'User'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e' }} />
                        <Typography sx={{ fontSize: '0.63rem', color: TEXT_2, fontWeight: 500 }}>
                            Premium
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.15 }}>
                    <Tooltip title="Notifications" placement="right">
                        <IconButton size="small" onClick={handleNotificationsClick} sx={{
                            color: TEXT_2, p: 0.65,
                            '&:hover': { color: MAROON, bgcolor: MAROON_BG },
                        }}>
                            <BellIcon size={14} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Settings" placement="right">
                        <IconButton size="small" onClick={handleSettingsClick} sx={{
                            color: TEXT_2, p: 0.65,
                            '&:hover': { color: MAROON, bgcolor: MAROON_BG },
                        }}>
                            <Settings size={14} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* ── NAV LABEL ───────────────────────────────────────────────── */}
            <Typography sx={{
                px: 3, pt: 2.25, pb: 0.75,
                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em',
                color: TEXT_2, textTransform: 'uppercase',
            }}>
                Navigation
            </Typography>

            {/* ── NAV ITEMS ───────────────────────────────────────────────── */}
            <List sx={{ flex: 1, py: 0, px: 1.25 }}>
                {menuItems.map((item) => {
                    const active = selectedItem === item.text;
                    return (
                        <ListItem disablePadding key={item.text} sx={{ mb: 0.35 }}>
                            <ListItemButton
                                onClick={() => handleItemClick(item.path, item.text)}
                                sx={{
                                    py: 1, px: 1.5,
                                    borderRadius: '9px',
                                    position: 'relative',
                                    transition: 'background 0.14s',
                                    bgcolor: active ? MAROON_BG : 'transparent',
                                    border: `1px solid ${active ? MAROON_BDR : 'transparent'}`,
                                    '&:hover': { bgcolor: active ? MAROON_BG : HOVER_BG },
                                    '&::before': active ? {
                                        content: '""',
                                        position: 'absolute',
                                        left: 0, top: '22%', bottom: '22%',
                                        width: 3, borderRadius: '0 3px 3px 0',
                                        bgcolor: MAROON,
                                    } : {},
                                }}
                            >
                                <ListItemIcon sx={{
                                    minWidth: 32,
                                    color: active ? MAROON : TEXT_2,
                                    '& svg': { display: 'block' },
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        sx: {
                                            fontSize: '0.875rem',
                                            fontWeight: active ? 700 : 500,
                                            color: active ? MAROON : TEXT_1,
                                        },
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            {/* ── DIVIDER ─────────────────────────────────────────────────── */}
            <Box sx={{ mx: 2.5, borderTop: `1px solid ${BORDER}`, my: 1.5 }} />

            {/* ── UPGRADE CARD ────────────────────────────────────────────── */}
            <Box sx={{
                mx: 1.5, mb: 1.5,
                p: '14px 16px',
                borderRadius: '12px',
                bgcolor: CARD_BG,
                border: '1px solid rgba(0,0,0,0.07)',
                position: 'relative', overflow: 'hidden',
            }}>
                <Box sx={{
                    position: 'absolute', bottom: -16, right: -16,
                    width: 56, height: 56, borderRadius: '50%',
                    bgcolor: MAROON_BG, pointerEvents: 'none',
                }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                    <Sparkles size={13} color={MAROON} />
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: TEXT_1 }}>
                        Upgrade to Premium
                    </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.68rem', color: TEXT_2, lineHeight: 1.55, mb: 1.5 }}>
                    Unlock advanced insights and unlimited tracking
                </Typography>
                <Button fullWidth variant="contained" sx={{
                    bgcolor: MAROON, color: '#fff',
                    fontWeight: 700, fontSize: '0.75rem', textTransform: 'none',
                    borderRadius: '7px', py: 0.75,
                    boxShadow: '0 2px 8px rgba(128,0,0,0.22)',
                    '&:hover': { bgcolor: MAROON_DARK, boxShadow: '0 4px 12px rgba(128,0,0,0.32)' },
                }}>
                    Upgrade Now
                </Button>
            </Box>

            {/* ── SUPPORT ─────────────────────────────────────────────────── */}
            <Box sx={{ px: 1.5, pb: 2.5 }}>
                <Button variant="outlined" startIcon={<HelpCircle size={13} />} fullWidth sx={{
                    py: 0.85, borderRadius: '8px', justifyContent: 'flex-start', pl: 1.5,
                    color: TEXT_2, textTransform: 'none', fontWeight: 500,
                    fontSize: '0.78rem', borderColor: 'rgba(0,0,0,0.12)',
                    '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: MAROON_BG },
                }}>
                    Support Center
                </Button>
            </Box>

            {/* ── SETTINGS DROPDOWN ───────────────────────────────────────── */}
            <Menu anchorEl={settingsAnchorEl} open={Boolean(settingsAnchorEl)} onClose={handleSettingsClose}
                  TransitionComponent={Fade} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }} PaperProps={dropdownPaper}>
                <Box sx={{ pt: 1.75, pb: 1.25, px: 2, bgcolor: CARD_BG, borderBottom: `1px solid ${BORDER}` }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: TEXT_1, mb: 0.2 }}>{userFullName}</Typography>
                    <Typography variant="caption" sx={{ color: TEXT_2 }}>{userEmail}</Typography>
                </Box>
                {[
                    { icon: <User size={15} />,       label: 'Profile',  action: () => { handleSettingsClose(); navigate('/profile'); } },
                    { icon: <CreditCard size={15} />, label: 'Billing',  action: handleSettingsClose },
                    { icon: <Shield size={15} />,     label: 'Security', action: handleSettingsClose },
                ].map(r => (
                    <MenuItem key={r.label} onClick={r.action} sx={{ py: 1.35, px: 2, gap: 1.5, '&:hover': { bgcolor: MAROON_BG } }}>
                        <Box sx={{ color: TEXT_2 }}>{r.icon}</Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{r.label}</Typography>
                    </MenuItem>
                ))}
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ py: 1.35, px: 2, gap: 1.5, color: '#c0392b', '&:hover': { bgcolor: 'rgba(192,57,43,0.05)' } }}>
                    <LogOut size={15} />
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>Logout</Typography>
                </MenuItem>
            </Menu>

            {/* ── NOTIFICATIONS DROPDOWN ──────────────────────────────────── */}
            <Menu anchorEl={notificationsAnchorEl} open={Boolean(notificationsAnchorEl)} onClose={handleNotificationsClose}
                  TransitionComponent={Fade} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{ ...dropdownPaper, sx: { ...dropdownPaper.sx, minWidth: 290 } }}>
                <Box sx={{ py: 1.5, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${BORDER}` }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: TEXT_1 }}>Notifications</Typography>
                    <Typography sx={{ fontSize: '0.73rem', color: MAROON, fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                        Mark all read
                    </Typography>
                </Box>
                {[
                    { title: 'Budget update available', body: 'Your May budget is ready for review',      time: '2 minutes ago' },
                    { title: 'Spending alert',          body: "You've reached 80% of your dining budget", time: '1 hour ago' },
                ].map((n, i) => (
                    <MenuItem key={i} onClick={handleNotificationsClose} sx={{ py: 1.5, px: 2, alignItems: 'flex-start', gap: 1.5, '&:hover': { bgcolor: MAROON_BG } }}>
                        <Box sx={{ mt: 0.6, width: 7, height: 7, borderRadius: '50%', bgcolor: MAROON, flexShrink: 0 }} />
                        <Box>
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: TEXT_1, mb: 0.25 }}>{n.title}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: TEXT_2, lineHeight: 1.4 }}>{n.body}</Typography>
                            <Typography sx={{ fontSize: '0.68rem', color: '#9ca3af', mt: 0.4 }}>{n.time}</Typography>
                        </Box>
                    </MenuItem>
                ))}
                <Box sx={{ p: 1.5, borderTop: `1px solid ${BORDER}`, textAlign: 'center' }}>
                    <Button size="small" fullWidth sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', color: MAROON, '&:hover': { bgcolor: MAROON_BG } }}>
                        View all notifications
                    </Button>
                </Box>
            </Menu>

            <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </Box>
    );
};

export default Sidebar;

// import React, {useEffect, useState} from 'react';
// import {
//     Box,
//     Typography,
//     List,
//     ListItem,
//     ListItemIcon,
//     ListItemText,
//     Divider,
//     useTheme,
//     Avatar,
//     IconButton,
//     ListItemButton,
//     alpha,
//     Button,
//     Menu,
//     MenuItem,
//     Fade
// } from '@mui/material';
// import {
//     Dashboard,
//     EventRepeat,
//     AttachMoney,
//     AccountBalance,
//     TrendingUp,
//     Search,
//     CreditScore, ShoppingCart
// } from '@mui/icons-material';
// import {
//     Bell,
//     Settings,
//     MessageSquare, Sparkles, HelpCircle, BellIcon, User, CreditCard, Shield, LogOut, Calculator,
// } from 'lucide-react';
// import {useLocation, useNavigate} from "react-router-dom";
// import SidebarMenu from "./SidebarMenu";
// import BudgetService, {Budget} from "../services/BudgetService";
// import UserService from '../services/UserService';
// import {BudgetType} from "../domain/BudgetType";
// import Tooltip from '@mui/material/Tooltip';
// import UserLogService from "../services/UserLogService";
// import {UserLog} from "../utils/Items";
// import SessionService from "../services/SessionService";
//
// interface MenuItem {
//     text: string;
//     icon: React.ReactNode;
//     path: string;
// }
//
//
// const Sidebar: React.FC = () => {
//     const theme = useTheme();
//     const navigate = useNavigate();
//     const location = useLocation();
//     const [selectedItem, setSelectedItem] = useState<string>('');
//     const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
//     const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
//     const [username, setUserName] = useState<string>('');
//     const [budgetType, setBudgetType] = useState<BudgetType>();
//     const budgetService = BudgetService.getInstance();
//     const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
//     const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
//     const userService = UserService.getInstance();
//     const userFullName = sessionStorage.getItem('fullName');
//     const userEmail = sessionStorage.getItem('email');
//     const userLogService = UserLogService.getInstance();
//
//     const fetchBudgetTypeFromBudget = (budget: Budget[]): BudgetType => {
//         if(budget.length === 0){
//             return BudgetType.SAVINGS;
//         }
//         // Assume the user only has a single budget
//         const singleBudget: Budget = budget[0];
//         let budgetName = singleBudget?.budgetName;
//         switch(budgetName){
//             case 'Savings Budget':
//                 return BudgetType.SAVINGS;
//             case 'Spending Control Budget':
//                 return BudgetType.CONTROL_SPENDING;
//             case 'Debt Payoff Budget':
//                 return BudgetType.PAY_DEBT;
//             default:
//                 throw new Error('Unknown Budget Name');
//         }
//
//     }
//
//     useEffect(() => {
//         const fetchBudgetType = async () => {
//             try
//             {
//                 const userId = Number(sessionStorage.getItem('userId'));
//                 const response = await budgetService.getBudgetTypeByUserId(userId);
//                 if(!response) throw new Error('Budget Response is empty or null');
//                 const fetchBudgetType = fetchBudgetTypeFromBudget(response);
//                 setBudgetType(fetchBudgetType);
//
//             }catch(error){
//                 console.error('Error fetching budget: ', error);
//             }
//         };
//         fetchBudgetType();
//     })
//
//     const getBudgetPath = () => {
//         switch (budgetType) {
//             case BudgetType.SAVINGS:
//                 return '/budgets';
//             case BudgetType.CONTROL_SPENDING:
//                 return '/budget-spending';
//             case BudgetType.PAY_DEBT:
//                 return '/budget-debt';
//             case BudgetType.EMERGENCY_FUND:
//                 return '/budget-emergency';
//             default:
//                 return '/budgets';
//         }
//     };
//
//     const menuItems = [
//         { text: 'Dashboard', icon: <Dashboard /> , path: '/dashboard'},
//         // { text: 'Recurring', icon: <EventRepeat />, path: '/recurring' },
//         // { text: 'Spending', icon: <AttachMoney /> , path: '/spending'},
//         { text: 'Budgets', icon: <AccountBalance /> , path: getBudgetPath()},
//         {text: 'Grocery Tracker', icon: <ShoppingCart />, path: '/grocery-tracker'},
//         // { text: 'Net Worth', icon: <TrendingUp />, path: '/net-worth' },
//         { text: 'Transactions', icon: <Search /> , path: '/transactions'},
//         // { text: 'Credit Score', icon: <CreditScore />, path: '/score' },
//         {text: 'BudgetPlanner', icon: <Calculator />, path: '/budget-planner'}
//     ];
//
//     useEffect(() => {
//         const currentPath = location.pathname;
//         const currentItem = menuItems.find(item => item.path === currentPath);
//         if(currentItem){
//             setSelectedItem(currentItem.text);
//         }
//     }, [location]);
//
//     const handleMenuToggle = () => {
//         setIsMenuOpen(!isMenuOpen);
//     };
//
//     const handleMenuClose = () => {
//         setIsMenuOpen(false);
//     };
//
//     const handleItemClick = (path: string, text: string): void => {
//         navigate(path);
//         setSelectedItem(text);
//     }
//
//     const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
//         setSettingsAnchorEl(event.currentTarget);
//     };
//
//     const handleSettingsClose = () => {
//         setSettingsAnchorEl(null);
//     };
//
//     const handleNotificationsClick = (event: React.MouseEvent<HTMLElement>) => {
//         setNotificationsAnchorEl(event.currentTarget);
//     };
//
//     const handleNotificationsClose = () => {
//         setNotificationsAnchorEl(null);
//     };
//
//     const handleLogout = async () => {
//         try {
//
//             let userId = Number(sessionStorage.getItem("userId"));
//             const userLog = await userLogService.fetchActiveUserLogByUserId(userId);
//             console.log('Active User Log: ', userLog);
//             if(userLog?.id && userLog?.lastLogin){
//                 const sessionDuration = userLogService.calculateSessionDuration(userLog.lastLogin);
//                 console.log('session duration: ', sessionDuration);
//                 console.log('Updating user Log');
//                 await userLogService.updateUserLog(userLog.id, {
//                     userId: userId,
//                     lastLogin: userLog.lastLogin,
//                     sessionDuration: sessionDuration,
//                     lastLogout: new Date().toISOString(),
//                     isActive: false
//                 });
//             }
//             // 2. Clear all client-side storage
//             sessionStorage.clear();
//             localStorage.clear();
//
//             // 3. Close any open menus
//             handleSettingsClose();
//             handleNotificationsClose();
//
//             // 4. Navigate to login page
//             navigate('/');
//
//             console.log('Logout completed successfully');
//         } catch (error) {
//             console.error('Error during logout:', error);
//
//             // Even if backend logout fails, clear local data and redirect
//             sessionStorage.clear();
//             localStorage.clear();
//             handleSettingsClose();
//             handleNotificationsClose();
//             navigate('/');
//         }
//     };
//
//     return (
//         <Box
//             sx={{
//                 width: 250,
//                 height: '100vh',
//                 bgcolor: theme.palette.background.paper,
//                 color: theme.palette.text.primary,
//                 borderRight: '1px solid',
//                 borderColor: theme.palette.divider,
//                 display: 'flex',
//                 flexDirection: 'column',
//                 position: 'fixed',
//                 left: 0,
//                 top: 0,
//                 overflowY: 'auto',
//                 boxShadow: '0 0 20px rgba(0, 0, 0, 0.05)',
//                 zIndex: 1200,
//                 '&::-webkit-scrollbar': {
//                     width: '6px',
//                 },
//                 '&::-webkit-scrollbar-thumb': {
//                     backgroundColor: 'rgba(0, 0, 0, 0.1)',
//                     borderRadius: '4px',
//                 },
//             }}
//         >
//             {/* Logo and App Name */}
//             <Box sx={{
//                 p: 3,
//                 borderBottom: '1px solid',
//                 borderColor: 'divider',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
//             }}>
//                 <Typography
//                     variant="h5"
//                     sx={{
//                         fontWeight: 800,
//                         color: theme.palette.primary.main,
//                         letterSpacing: '-0.5px',
//                         fontFamily: '"Poppins", sans-serif',
//                         textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
//                     }}
//                 >
//                     BudgetBuddy
//                 </Typography>
//             </Box>
//
//             {/* User Profile Section */}
//             <Box
//                 sx={{
//                     p: 2.5,
//                     display: 'flex',
//                     alignItems: 'center',
//                     borderBottom: '1px solid',
//                     borderColor: 'divider',
//                     background: alpha(theme.palette.background.default, 0.5),
//                 }}
//             >
//                 <Avatar
//                     sx={{
//                         bgcolor: theme.palette.primary.main,
//                         width: 40,
//                         height: 40,
//                         boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
//                     }}
//                 >
//                     A
//                 </Avatar>
//                 <Box sx={{ ml: 1.5 }}>
//                     <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
//                         {userFullName}
//                     </Typography>
//                     <Typography variant="caption" sx={{
//                         color: 'text.secondary',
//                         display: 'flex',
//                         alignItems: 'center'
//                     }}>
//                         <Box
//                             component="span"
//                             sx={{
//                                 width: 8,
//                                 height: 8,
//                                 borderRadius: '50%',
//                                 bgcolor: '#10b981',
//                                 display: 'inline-block',
//                                 mr: 0.5
//                             }}
//                         />
//                         Premium Plan
//                     </Typography>
//                 </Box>
//                 <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
//                     <Tooltip title="Notifications">
//                         <IconButton
//                             size="small"
//                             onClick={handleNotificationsClick}
//                             sx={{
//                                 color: theme.palette.text.secondary,
//                                 '&:hover': {
//                                     bgcolor: alpha(theme.palette.primary.main, 0.1),
//                                     color: theme.palette.primary.main
//                                 }
//                             }}
//                         >
//                             <BellIcon size={18} />
//                         </IconButton>
//                     </Tooltip>
//                     <Tooltip title="Settings">
//                         <IconButton
//                             size="small"
//                             onClick={handleSettingsClick}
//                             sx={{
//                                 color: theme.palette.text.secondary,
//                                 '&:hover': {
//                                     bgcolor: alpha(theme.palette.primary.main, 0.1),
//                                     color: theme.palette.primary.main
//                                 }
//                             }}
//                         >
//                             <Settings size={18} />
//                         </IconButton>
//                     </Tooltip>
//                 </Box>
//
//                 {/* Settings Menu */}
//                 <Menu
//                     anchorEl={settingsAnchorEl}
//                     open={Boolean(settingsAnchorEl)}
//                     onClose={handleSettingsClose}
//                     TransitionComponent={Fade}
//                     PaperProps={{
//                         elevation: 3,
//                         sx: {
//                             minWidth: 200,
//                             mt: 1.5,
//                             borderRadius: 2,
//                             overflow: 'hidden',
//                             boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
//                         }
//                     }}
//                 >
//                     <Box sx={{
//                         pt: 2,
//                         pb: 1,
//                         px: 2,
//                         bgcolor: alpha(theme.palette.primary.main, 0.05),
//                         borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
//                     }}>
//                         <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
//                             {userFullName}
//                         </Typography>
//                         <Typography variant="caption" sx={{ color: 'text.secondary' }}>
//                             {userEmail}
//                         </Typography>
//                     </Box>
//                     <MenuItem onClick={() => {
//                         handleSettingsClose();
//                         navigate('/profile');
//                     }} sx={{ py: 1.5 }}>
//                         <ListItemIcon>
//                             <User size={18} />
//                         </ListItemIcon>
//                         <ListItemText primary="Profile" />
//                     </MenuItem>
//                     <MenuItem onClick={handleSettingsClose} sx={{ py: 1.5 }}>
//                         <ListItemIcon>
//                             <CreditCard size={18} />
//                         </ListItemIcon>
//                         <ListItemText primary="Billing" />
//                     </MenuItem>
//                     <MenuItem onClick={handleSettingsClose} sx={{ py: 1.5 }}>
//                         <ListItemIcon>
//                             <Shield size={18} />
//                         </ListItemIcon>
//                         <ListItemText primary="Security" />
//                     </MenuItem>
//                     <Divider />
//                     <MenuItem
//                         onClick={handleLogout}
//                         sx={{
//                             py: 1.5,
//                             color: theme.palette.error.main,
//                             '&:hover': {
//                                 bgcolor: alpha(theme.palette.error.main, 0.05)
//                             }
//                         }}
//                     >
//                         <ListItemIcon sx={{ color: 'inherit' }}>
//                             <LogOut size={18} />
//                         </ListItemIcon>
//                         <ListItemText primary="Logout" />
//                     </MenuItem>
//                 </Menu>
//
//                 {/* Notifications Menu */}
//                 <Menu
//                     anchorEl={notificationsAnchorEl}
//                     open={Boolean(notificationsAnchorEl)}
//                     onClose={handleNotificationsClose}
//                     TransitionComponent={Fade}
//                     PaperProps={{
//                         elevation: 3,
//                         sx: {
//                             minWidth: 280,
//                             maxWidth: 320,
//                             mt: 1.5,
//                             borderRadius: 2,
//                             overflow: 'hidden',
//                             boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
//                         }
//                     }}
//                 >
//                     <Box sx={{
//                         py: 1.5,
//                         px: 2,
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'space-between',
//                         borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
//                     }}>
//                         <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
//                             Notifications
//                         </Typography>
//                         <Typography
//                             variant="caption"
//                             sx={{
//                                 color: theme.palette.primary.main,
//                                 cursor: 'pointer',
//                                 fontWeight: 600,
//                                 '&:hover': { textDecoration: 'underline' }
//                             }}
//                         >
//                             Mark all as read
//                         </Typography>
//                     </Box>
//                     <MenuItem onClick={handleNotificationsClose} sx={{ py: 1.5, px: 2 }}>
//                         <ListItemIcon>
//                             <Box
//                                 sx={{
//                                     width: 8,
//                                     height: 8,
//                                     borderRadius: '50%',
//                                     bgcolor: theme.palette.primary.main,
//                                     mt: 1
//                                 }}
//                             />
//                         </ListItemIcon>
//                         <Box>
//                             <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                                 Budget update available
//                             </Typography>
//                             <Typography variant="caption" sx={{ color: 'text.secondary' }}>
//                                 Your May budget is ready for review
//                             </Typography>
//                             <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', mt: 0.5 }}>
//                                 2 minutes ago
//                             </Typography>
//                         </Box>
//                     </MenuItem>
//                     <MenuItem onClick={handleNotificationsClose} sx={{ py: 1.5, px: 2 }}>
//                         <ListItemIcon>
//                             <Box
//                                 sx={{
//                                     width: 8,
//                                     height: 8,
//                                     borderRadius: '50%',
//                                     bgcolor: theme.palette.primary.main,
//                                     mt: 1
//                                 }}
//                             />
//                         </ListItemIcon>
//                         <Box>
//                             <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                                 Spending alert
//                             </Typography>
//                             <Typography variant="caption" sx={{ color: 'text.secondary' }}>
//                                 You've reached 80% of your dining budget
//                             </Typography>
//                             <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', mt: 0.5 }}>
//                                 1 hour ago
//                             </Typography>
//                         </Box>
//                     </MenuItem>
//                     <Box sx={{
//                         p: 1.5,
//                         textAlign: 'center',
//                         borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`
//                     }}>
//                         <Button
//                             size="small"
//                             fullWidth
//                             sx={{
//                                 textTransform: 'none',
//                                 fontWeight: 600
//                             }}
//                         >
//                             View all notifications
//                         </Button>
//                     </Box>
//                 </Menu>
//             </Box>
//
//             {/* Navigation Menu */}
//             <List sx={{ flexGrow: 1, py: 2 }}>
//                 {menuItems.map((item) => (
//                     <ListItem
//                         disablePadding
//                         key={item.text}
//                         sx={{ mb: 0.5 }}
//                     >
//                         <ListItemButton
//                             onClick={() => handleItemClick(item.path, item.text)}
//                             selected={selectedItem === item.text}
//                             sx={{
//                                 py: 1.2,
//                                 px: 2.5,
//                                 mx: 1,
//                                 borderRadius: 2,
//                                 transition: 'all 0.2s ease',
//                                 '&:hover': {
//                                     bgcolor: alpha(theme.palette.primary.main, 0.08),
//                                     transform: 'translateX(4px)'
//                                 },
//                                 '&.Mui-selected': {
//                                     bgcolor: alpha(theme.palette.primary.main, 0.12),
//                                     '&:hover': {
//                                         bgcolor: alpha(theme.palette.primary.main, 0.18),
//                                     },
//                                     '&::before': {
//                                         content: '""',
//                                         position: 'absolute',
//                                         left: 0,
//                                         top: '20%',
//                                         bottom: '20%',
//                                         width: 4,
//                                         borderRadius: '0 4px 4px 0',
//                                         backgroundColor: theme.palette.primary.main,
//                                     }
//                                 },
//                             }}
//                         >
//                             <ListItemIcon
//                                 sx={{
//                                     color: selectedItem === item.text
//                                         ? theme.palette.primary.main
//                                         : theme.palette.text.secondary,
//                                     minWidth: 36
//                                 }}
//                             >
//                                 {item.icon}
//                             </ListItemIcon>
//                             <ListItemText
//                                 primary={item.text}
//                                 primaryTypographyProps={{
//                                     fontSize: '0.95rem',
//                                     fontWeight: selectedItem === item.text ? 600 : 500,
//                                     color: selectedItem === item.text
//                                         ? theme.palette.primary.main
//                                         : theme.palette.text.primary,
//                                 }}
//                             />
//                         </ListItemButton>
//                     </ListItem>
//                 ))}
//             </List>
//
//             {/* Pro Features Banner */}
//             <Box
//                 sx={{
//                     mx: 2,
//                     mb: 2,
//                     p: 2.5,
//                     borderRadius: 3,
//                     backgroundImage: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
//                     color: 'white',
//                     textAlign: 'center',
//                     boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
//                     position: 'relative',
//                     overflow: 'hidden',
//                     '&::after': {
//                         content: '""',
//                         position: 'absolute',
//                         top: 0,
//                         right: 0,
//                         width: '50%',
//                         height: '100%',
//                         backgroundImage: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1))',
//                         transform: 'skewX(-20deg) translateX(10%)',
//                     }
//                 }}
//             >
//                 <Sparkles size={28} color="white" style={{ marginBottom: 12, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
//                 <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
//                     Upgrade to Premium
//                 </Typography>
//                 <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
//                     Get advanced insights and unlimited budget tracking
//                 </Typography>
//                 <Button
//                     variant="contained"
//                     fullWidth
//                     sx={{
//                         textTransform: 'none',
//                         fontWeight: 600,
//                         bgcolor: 'white',
//                         color: '#4f46e5',
//                         boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
//                         '&:hover': {
//                             bgcolor: 'rgba(255,255,255,0.9)',
//                         }
//                     }}
//                 >
//                     Upgrade Now
//                 </Button>
//             </Box>
//
//             {/* Support Button */}
//             <Box sx={{ p: 2, pt: 0 }}>
//                 <Button
//                     variant="outlined"
//                     startIcon={<HelpCircle size={16} />}
//                     fullWidth
//                     sx={{
//                         py: 1.2,
//                         borderRadius: 2,
//                         justifyContent: 'flex-start',
//                         color: theme.palette.text.secondary,
//                         borderColor: alpha(theme.palette.divider, 0.8),
//                         bgcolor: alpha(theme.palette.background.default, 0.8),
//                         '&:hover': {
//                             borderColor: theme.palette.primary.main,
//                             bgcolor: alpha(theme.palette.primary.main, 0.05),
//                         },
//                         textTransform: 'none',
//                         fontWeight: 600,
//                     }}
//                 >
//                     Support Center
//                 </Button>
//             </Box>
//         </Box>
//     );
//
//
//     // return (
//     //     <Box
//     //         sx={{
//     //             width: 240,
//     //             height: '100vh',
//     //             bgcolor: 'white',
//     //             color: 'text.primary',
//     //             borderRight: '1px solid',
//     //             borderColor: 'divider',
//     //             display: 'flex',
//     //             flexDirection: 'column',
//     //             position: 'fixed',
//     //             left: 0,
//     //             top: 0,
//     //             overflowY: 'auto',
//     //             boxShadow: '2px 0 5px rgba(0, 0, 0, 0.05)',
//     //             '&::-webkit-scrollbar': {
//     //                 width: '8px',
//     //             },
//     //             '&::-webkit-scrollbar-thumb': {
//     //                 backgroundColor: 'rgba(0, 0, 0, 0.1)',
//     //                 borderRadius: '4px',
//     //             },
//     //         }}
//     //     >
//     //         <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
//     //             <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.primary.main, letterSpacing: '0.5px' }}>
//     //                 BudgetBuddy
//     //             </Typography>
//     //         </Box>
//     //         <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//     //             <Typography variant="body2" sx={{ fontWeight: 500 }}>
//     //                 Hi, Alexander
//     //             </Typography>
//     //             <Box>
//     //                 <Bell size={18} style={{ marginRight: 12, cursor: 'pointer' }} />
//     //                 <Settings
//     //                     size={18}
//     //                     style={{ cursor: 'pointer' }}
//     //                     onClick={handleMenuToggle}/>
//     //             </Box>
//     //         </Box>
//     //         <List sx={{ flexGrow: 1, pt: 1 }}>
//     //             {menuItems.map((item) => (
//     //                 <ListItem
//     //                     button
//     //                     key={item.text}
//     //                     onClick={() => handleItemClick(item.path, item.text)}
//     //                     selected={selectedItem === item.text}
//     //                     sx={{
//     //                         py: 1.5,
//     //                         px: 2,
//     //                         '&:hover': {
//     //                             bgcolor: 'action.hover',
//     //                             '& .MuiListItemIcon-root': {
//     //                                 color: theme.palette.primary.main,
//     //                             },
//     //                         },
//     //                         '&.Mui-selected': {
//     //                             bgcolor: theme.palette.primary.light,
//     //                             '& .MuiListItemIcon-root': {
//     //                                 color: theme.palette.primary.main,
//     //                             },
//     //                         },
//     //                     }}
//     //                 >
//     //                     <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}>{item.icon}</ListItemIcon>
//     //                     <ListItemText
//     //                         primary={item.text}
//     //                         primaryTypographyProps={{
//     //                             fontSize: '0.9rem',
//     //                             fontWeight: 500
//     //                         }}
//     //                     />
//     //                 </ListItem>
//     //             ))}
//     //         </List>
//     //         <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
//     //             <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', mb: 0.5 }}>
//     //                 "Creativity is intelligence having fun."
//     //             </Typography>
//     //             <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
//     //                 Albert Einstein
//     //             </Typography>
//     //         </Box>
//     //         <ListItem
//     //             button
//     //             sx={{
//     //                 bgcolor: theme.palette.primary.light,
//     //                 color: theme.palette.primary.main,
//     //                 '&:hover': {
//     //                     bgcolor: theme.palette.primary.main,
//     //                     color: theme.palette.primary.contrastText,
//     //                 },
//     //                 borderRadius: 2,
//     //                 m: 2,
//     //                 transition: 'all 0.3s',
//     //             }}
//     //         >
//     //             <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><MessageSquare size={20} /></ListItemIcon>
//     //             <ListItemText primary="Chat with us" primaryTypographyProps={{ fontWeight: 600 }} />
//     //         </ListItem>
//     //         <SidebarMenu isOpen={isMenuOpen} onClose={handleMenuClose} />
//     //     </Box>
//     // );
//
// };
//
// export default Sidebar;