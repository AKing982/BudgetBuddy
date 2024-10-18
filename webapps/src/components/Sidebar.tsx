import React, {useEffect, useState} from 'react';
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
import {useLocation, useNavigate} from "react-router-dom";
import SidebarMenu from "./SidebarMenu";
import BudgetService, {Budget} from "../services/BudgetService";
import {BudgetType} from "../domain/BudgetType";


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
    const [budgetType, setBudgetType] = useState<BudgetType>();
    const budgetService = BudgetService.getInstance();

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
                return '/budgets-debt';
            case BudgetType.EMERGENCY_FUND:
                return '/budget-emergency';
            default:
                return '/budgets';
        }
    };

    const menuItems = [
        { text: 'Dashboard', icon: <Dashboard /> , path: '/dashboard'},
        { text: 'Recurring', icon: <EventRepeat />, path: '/recurring' },
        { text: 'Spending', icon: <AttachMoney /> , path: '/spending'},
        { text: 'Budgets', icon: <AccountBalance /> , path: getBudgetPath()},
        { text: 'Net Worth', icon: <TrendingUp />, path: '/net-worth' },
        { text: 'Transactions', icon: <Search /> , path: '/transactions'},
        { text: 'Credit Score', icon: <CreditScore />, path: '/score' },
    ];

    useEffect(() => {
        const currentPath = location.pathname;
        const currentItem = menuItems.find(item => item.path === currentPath);
        if(currentItem){
            setSelectedItem(currentItem.text);
        }
    }, [location]);

    const handleItemClick = (path: string, text: string): void => {
        navigate(path);
        setSelectedItem(text);
    }

    const handleMenuToggle = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleMenuClose = () => {
        setIsMenuOpen(false);
    };

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
                    <Settings
                        size={18}
                        style={{ cursor: 'pointer' }}
                        onClick={handleMenuToggle}/>
                </Box>
            </Box>
            <List sx={{ flexGrow: 1, pt: 1 }}>
                {menuItems.map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        onClick={() => handleItemClick(item.path, item.text)}
                        selected={selectedItem === item.text}
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
            <SidebarMenu isOpen={isMenuOpen} onClose={handleMenuClose} />
        </Box>
    );

};

export default Sidebar;