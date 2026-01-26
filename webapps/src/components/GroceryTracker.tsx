import {useEffect, useState} from "react";
import {GroceryBudget} from "../config/Types";
import {
    Alert, alpha,
    AppBar,
    Box,
    Button, Card,
    Container,
    Grow,
    Stack,
    Tab,
    Tabs,
    Toolbar,
    Typography,
    useTheme
} from "@mui/material";
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ListIcon from '@mui/icons-material/List';
import {GroceryBudgetCreate} from "./GroceryBudgetCreate";
import {GroceryBudgetDetail} from "./GroceryBudgetDetail";
import {GroceryBudgetList} from "./GroceryBudgetList";
import {BudgetComparisonView} from "./BudgetComparisonView";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import AddIcon from "@mui/icons-material/Add";
import {
    ShoppingCart,
    List,
    Plus,
    TrendingUp,
    ArrowLeft
} from 'lucide-react';
import Sidebar from "./Sidebar";

type View = 'list' | 'create' | 'detail' | 'compare';

const gradients = {
    blue: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    green: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    purple: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
    orange: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
    indigo: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
    teal: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)'
};

const GroceryTracker: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('list');
    const [selectedBudget, setSelectedBudget] = useState<GroceryBudget | null>(null);
    const [budgets, setBudgets] = useState<GroceryBudget[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [tabValue, setTabValue] = useState(0);
    const [animateIn, setAnimateIn] = useState(false);

    const handleViewBudget = (budget: GroceryBudget) => {
        setSelectedBudget(budget);
        setCurrentView('detail');
    };

    useEffect(() => {
        document.title = 'Grocery Tracker - BudgetBuddy';
        setTimeout(() => setAnimateIn(true), 100);
        loadBudgets();

        return () => {
            document.title = "BudgetBuddy";
        };
    }, []);


    const loadBudgets = async () => {
        try {
            setLoading(true);
            // Dummy data matching the actual GroceryBudget interface
            const dummyBudgets: GroceryBudget[] = [
                {
                    id: 1,
                    name: 'January 2026 Groceries',
                    budgetAmount: 600,
                    startDate: '2026-01-01',
                    endDate: '2026-01-31',
                    subBudgetId: 1,
                    savingsGoal: 100,
                    stores: [
                        {
                            storeName: 'Whole Foods',
                            items: [
                                {
                                    id: 1,
                                    itemName: 'Organic Apples',
                                    itemCost: 12.50,
                                    itemDescription: '2 lb bag of organic apples',
                                    storeName: 'Whole Foods',
                                    datePurchased: '2026-01-05',
                                    category: 'Produce',
                                    quantity: 1
                                },
                                {
                                    id: 2,
                                    itemName: 'Chicken Breast',
                                    itemCost: 25.00,
                                    itemDescription: 'Organic free-range chicken breast',
                                    storeName: 'Whole Foods',
                                    datePurchased: '2026-01-05',
                                    category: 'Meat',
                                    quantity: 2
                                }
                            ]
                        },
                        {
                            storeName: 'Trader Joes',
                            items: [
                                {
                                    id: 3,
                                    itemName: 'Almond Milk',
                                    itemCost: 3.99,
                                    itemDescription: 'Unsweetened almond milk',
                                    storeName: 'Trader Joes',
                                    datePurchased: '2026-01-08',
                                    category: 'Dairy',
                                    quantity: 1
                                },
                                {
                                    id: 4,
                                    itemName: 'Everything Bagels',
                                    itemCost: 4.50,
                                    storeName: 'Trader Joes',
                                    datePurchased: '2026-01-08',
                                    category: 'Bakery',
                                    quantity: 1
                                }
                            ]
                        }
                    ],
                    sections: [
                        {
                            id: 1,
                            name: 'Produce',
                            budgetAmount: 150,
                            items: [
                                {
                                    id: 1,
                                    itemName: 'Organic Apples',
                                    itemCost: 12.50,
                                    storeName: 'Whole Foods',
                                    datePurchased: '2026-01-05',
                                    category: 'Produce',
                                    quantity: 1
                                }
                            ]
                        },
                        {
                            id: 2,
                            name: 'Meat & Seafood',
                            budgetAmount: 200,
                            items: [
                                {
                                    id: 2,
                                    itemName: 'Chicken Breast',
                                    itemCost: 25.00,
                                    storeName: 'Whole Foods',
                                    datePurchased: '2026-01-05',
                                    category: 'Meat',
                                    quantity: 2
                                }
                            ]
                        },
                        {
                            id: 3,
                            name: 'Dairy',
                            budgetAmount: 100,
                            items: [
                                {
                                    id: 3,
                                    itemName: 'Almond Milk',
                                    itemCost: 3.99,
                                    storeName: 'Trader Joes',
                                    datePurchased: '2026-01-08',
                                    category: 'Dairy',
                                    quantity: 1
                                }
                            ]
                        }
                    ],
                    plannedItems: [
                        { itemName: 'Organic Apples', estimatedCost: 12.50 },
                        { itemName: 'Chicken Breast', estimatedCost: 25.00 },
                        { itemName: 'Almond Milk', estimatedCost: 3.99 },
                        { itemName: 'Whole Grain Bread', estimatedCost: 5.00 }
                    ]
                },
                {
                    id: 2,
                    name: 'December 2025 Groceries',
                    budgetAmount: 700,
                    startDate: '2025-12-01',
                    endDate: '2025-12-31',
                    subBudgetId: 2,
                    savingsGoal: 150,
                    stores: [
                        {
                            storeName: 'Costco',
                            items: [
                                {
                                    id: 5,
                                    itemName: 'Bananas',
                                    itemCost: 8.50,
                                    itemDescription: 'Bunch of organic bananas',
                                    storeName: 'Costco',
                                    datePurchased: '2025-12-03',
                                    category: 'Produce',
                                    quantity: 3
                                },
                                {
                                    id: 6,
                                    itemName: 'Salmon Fillet',
                                    itemCost: 35.00,
                                    itemDescription: 'Wild-caught salmon',
                                    storeName: 'Costco',
                                    datePurchased: '2025-12-10',
                                    category: 'Seafood',
                                    quantity: 1
                                }
                            ]
                        }
                    ],
                    sections: [
                        {
                            id: 4,
                            name: 'Produce',
                            budgetAmount: 150,
                            items: [
                                {
                                    id: 5,
                                    itemName: 'Bananas',
                                    itemCost: 8.50,
                                    storeName: 'Costco',
                                    datePurchased: '2025-12-03',
                                    category: 'Produce',
                                    quantity: 3
                                }
                            ]
                        },
                        {
                            id: 5,
                            name: 'Meat & Seafood',
                            budgetAmount: 250,
                            items: [
                                {
                                    id: 6,
                                    itemName: 'Salmon Fillet',
                                    itemCost: 35.00,
                                    storeName: 'Costco',
                                    datePurchased: '2025-12-10',
                                    category: 'Seafood',
                                    quantity: 1
                                }
                            ]
                        }
                    ],
                    plannedItems: [
                        { itemName: 'Bananas', estimatedCost: 8.50 },
                        { itemName: 'Salmon Fillet', estimatedCost: 35.00 },
                        { itemName: 'Greek Yogurt', estimatedCost: 7.99 }
                    ]
                },
                {
                    id: 3,
                    name: 'Weekly Budget - Week 4',
                    budgetAmount: 150,
                    startDate: '2026-01-20',
                    endDate: '2026-01-26',
                    subBudgetId: 3,
                    savingsGoal: 25,
                    stores: [
                        {
                            storeName: 'Local Market',
                            items: [
                                {
                                    id: 7,
                                    itemName: 'Carrots',
                                    itemCost: 6.50,
                                    storeName: 'Local Market',
                                    datePurchased: '2026-01-21',
                                    category: 'Produce',
                                    quantity: 2
                                },
                                {
                                    id: 8,
                                    itemName: 'Pork Chops',
                                    itemCost: 18.00,
                                    itemDescription: 'Bone-in pork chops',
                                    storeName: 'Local Market',
                                    datePurchased: '2026-01-22',
                                    category: 'Meat',
                                    quantity: 1
                                }
                            ]
                        }
                    ],
                    sections: [
                        {
                            id: 6,
                            name: 'Produce',
                            budgetAmount: 40,
                            items: [
                                {
                                    id: 7,
                                    itemName: 'Carrots',
                                    itemCost: 6.50,
                                    storeName: 'Local Market',
                                    datePurchased: '2026-01-21',
                                    category: 'Produce',
                                    quantity: 2
                                }
                            ]
                        },
                        {
                            id: 7,
                            name: 'Meat',
                            budgetAmount: 50,
                            items: [
                                {
                                    id: 8,
                                    itemName: 'Pork Chops',
                                    itemCost: 18.00,
                                    storeName: 'Local Market',
                                    datePurchased: '2026-01-22',
                                    category: 'Meat',
                                    quantity: 1
                                }
                            ]
                        }
                    ],
                    plannedItems: [
                        { itemName: 'Carrots', estimatedCost: 6.50 },
                        { itemName: 'Pork Chops', estimatedCost: 18.00 },
                        { itemName: 'Lettuce', estimatedCost: 4.00 }
                    ]
                }
            ];

            // Simulate API delay
            setTimeout(() => {
                setBudgets(dummyBudgets);
                setLoading(false);
            }, 500);

        } catch (err) {
            console.error('Error loading budgets:', err);
            setError('Failed to load budgets. Please try again.');
            setLoading(false);
        }
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setSelectedBudget(null);
        loadBudgets();
    };



    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        const views: View[] = ['list', 'create', 'compare'];
        setCurrentView(views[newValue]);
    };


    const handleCreateNew = () => {
        setCurrentView('create');
    };

    const handleCompare = () => {
        setCurrentView('compare');
    };

    const theme = useTheme();

    return (
        <Box sx={{
            maxWidth: 'calc(100% - 240px)',
            ml: '240px',
            minHeight: '100vh',
            background: '#f9fafc',
            backgroundImage: 'radial-gradient(rgba(0, 0, 120, 0.01) 2px, transparent 2px)',
            backgroundSize: '40px 40px'
        }}>
            <Sidebar />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Header Section */}
                <Grow in={animateIn} timeout={600}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 4,
                        flexDirection: { xs: 'column', sm: 'row' },
                        textAlign: { xs: 'center', sm: 'left' },
                        gap: 2
                    }}>
                        <Box>
                            {currentView === 'detail' ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Button
                                        onClick={handleBackToList}
                                        startIcon={<ArrowLeft size={18} />}
                                        sx={{
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            color: theme.palette.text.primary,
                                            '&:hover': {
                                                backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                            }
                                        }}
                                    >
                                        Back
                                    </Button>
                                    <Typography variant="h4" component="h1" sx={{
                                        fontWeight: 800,
                                        color: theme.palette.text.primary,
                                        letterSpacing: '-0.025em'
                                    }}>
                                        Budget Details
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    <Typography variant="h4" component="h1" sx={{
                                        fontWeight: 800,
                                        color: theme.palette.text.primary,
                                        letterSpacing: '-0.025em',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2
                                    }}>
                                        <Box sx={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: '12px',
                                            background: gradients.teal,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
                                        }}>
                                            <ShoppingCart size={24} color="white" />
                                        </Box>
                                        Grocery Tracker
                                    </Typography>
                                    <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                                        {currentView === 'create' && 'Create a new grocery budget'}
                                        {currentView === 'list' && 'Manage and track your grocery budgets'}
                                        {currentView === 'compare' && 'Compare your grocery budgets'}
                                    </Typography>
                                </>
                            )}
                        </Box>

                        {/* Action Buttons */}
                        {currentView !== 'detail' && (
                            <Stack direction="row" spacing={2}>
                                <Button
                                    variant={currentView === 'list' ? 'contained' : 'outlined'}
                                    startIcon={<List size={18} />}
                                    onClick={() => setCurrentView('list')}
                                    sx={{
                                        borderRadius: 3,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        px: 3,
                                        ...(currentView === 'list' ? {
                                            background: gradients.blue,
                                            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                            }
                                        } : {
                                            borderColor: alpha(theme.palette.divider, 0.8),
                                            color: theme.palette.text.primary,
                                            '&:hover': {
                                                borderColor: theme.palette.primary.main,
                                                backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                            }
                                        })
                                    }}
                                >
                                    View Budgets
                                </Button>

                                <Button
                                    variant={currentView === 'create' ? 'contained' : 'outlined'}
                                    startIcon={<Plus size={18} />}
                                    onClick={handleCreateNew}
                                    sx={{
                                        borderRadius: 3,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        px: 3,
                                        ...(currentView === 'create' ? {
                                            background: gradients.green,
                                            boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
                                            }
                                        } : {
                                            borderColor: alpha(theme.palette.divider, 0.8),
                                            color: theme.palette.text.primary,
                                            '&:hover': {
                                                borderColor: theme.palette.primary.main,
                                                backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                            }
                                        })
                                    }}
                                >
                                    Create Budget
                                </Button>

                                <Button
                                    variant={currentView === 'compare' ? 'contained' : 'outlined'}
                                    startIcon={<TrendingUp size={18} />}
                                    onClick={handleCompare}
                                    sx={{
                                        borderRadius: 3,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        px: 3,
                                        ...(currentView === 'compare' ? {
                                            background: gradients.purple,
                                            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)',
                                            }
                                        } : {
                                            borderColor: alpha(theme.palette.divider, 0.8),
                                            color: theme.palette.text.primary,
                                            '&:hover': {
                                                borderColor: theme.palette.primary.main,
                                                backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                            }
                                        })
                                    }}
                                >
                                    Compare
                                </Button>
                            </Stack>
                        )}
                    </Box>
                </Grow>

                {/* Error Alert */}
                {error && (
                    <Grow in={true} timeout={800}>
                        <Alert
                            severity="error"
                            sx={{
                                mb: 3,
                                borderRadius: 3,
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                            }}
                            onClose={() => setError('')}
                        >
                            {error}
                        </Alert>
                    </Grow>
                )}

                {/* Main Content */}
                <Grow in={animateIn} timeout={900}>
                    <Box>
                        {currentView === 'list' && (
                            <GroceryBudgetList
                                budgets={budgets}
                                onViewBudget={handleViewBudget}
                            />
                        )}

                        {currentView === 'create' && (
                            <Card sx={{
                                p: 4,
                                borderRadius: 4,
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                            }}>
                                <GroceryBudgetCreate
                                    onSuccess={handleBackToList}
                                    onCancel={handleBackToList}
                                />
                            </Card>
                        )}

                        {currentView === 'detail' && selectedBudget && (
                            <GroceryBudgetDetail
                                budget={selectedBudget}
                                onBack={handleBackToList}
                            />
                        )}

                        {currentView === 'compare' && (
                            <BudgetComparisonView budgets={budgets} />
                        )}
                    </Box>
                </Grow>
            </Container>
        </Box>
    );
};

export default GroceryTracker;