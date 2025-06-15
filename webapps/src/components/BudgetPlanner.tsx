import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Card,
    CardContent,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Grid,
    Skeleton,
    Container,
    useTheme,
    alpha,
    Grow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    ButtonGroup,
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    Dashboard,
    AccountBalance,
    TrendingUp,
    Category,
    CalendarToday,
    ExpandMore,
    ExpandLess,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import Sidebar from "./Sidebar";

// Type definitions
interface BudgetItem {
    planned: number;
    estimated: number;
    remaining: number;
}

interface WeekData {
    Housing: BudgetItem;
    Food: BudgetItem;
    Transportation: BudgetItem;
    Entertainment: BudgetItem;
}

interface BudgetData {
    week1: WeekData;
    week2: WeekData;
    week3: WeekData;
    week4: WeekData;
}

interface MonthlyTotals {
    budgetGoal: number;
    totalPlanned: number;
    totalSpent: number;
    percentageSaved: number;
    spentOverBudgetPercentage: number;
}

interface BPTemplate {
    id: string;
    name: string;
    type: 'Monthly' | 'Biweekly' | '2-Monthly' | '3-Monthly';
    budgetData: BudgetData;
    weekAccountBalances: { week1: number; week2: number; week3: number; week4: number };
    weekDateRanges: string[];
    monthlyTotals: MonthlyTotals;
}

type CategoryKey = keyof WeekData;
type Direction = 'prev' | 'next';
type ViewMode = 'template' | 'statistics';

// Colors to match TopExpenseCategory
const maroonColor = '#800000';
const primaryBlue = '#1976d2';
const lightGray = '#f9fafc';

// Styled components to match TopExpenseCategory
const StyledTableContainer = styled(TableContainer)({
    borderRadius: 4,
    overflow: 'hidden',
    transition: 'box-shadow 0.3s ease-in-out',
    '&:hover': {
        boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
    },
});

const StyledTableRow = styled(TableRow)({
    backgroundColor: 'white',
});

const StyledTableHeadRow = styled(TableRow)({
    backgroundColor: 'background.paper',
});

const StyledButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
    '& .MuiButtonBase-root': {
        border: `1px solid ${maroonColor}`,
        color: maroonColor,
        textTransform: 'none',
        fontWeight: 600,
        padding: '8px 16px',
        transition: 'all 0.3s ease',
        '&:hover': {
            backgroundColor: 'rgba(128, 0, 0, 0.04)',
        },
        '&.Mui-selected': {
            backgroundColor: primaryBlue,
            color: 'white',
            '&:hover': {
                backgroundColor: '#1565c0',
            },
        },
        '&:not(:last-of-type)': {
            borderRight: `1px solid ${maroonColor}`,
        },
    },
}));

const StyledButton = styled(Button)(({ theme }) => ({
    textTransform: 'none',
    fontWeight: 600,
    padding: '8px 16px',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    color: maroonColor,
    borderColor: maroonColor,
    '&:hover': {
        backgroundColor: 'rgba(128, 0, 0, 0.04)',
        borderColor: maroonColor,
    },
    '&.Mui-selected, &.MuiButton-contained': {
        backgroundColor: maroonColor,
        color: 'white',
        '&:hover': {
            backgroundColor: '#600000',
        },
    },
}));

// Simple UUID generator
const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const BudgetPlanner: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState<string>('June 2025');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<ViewMode>('template');
    const [collapsedWeeks, setCollapsedWeeks] = useState<Set<number>>(new Set());
    const [animateIn, setAnimateIn] = useState(false);
    const [bpTemplates, setBPTemplates] = useState<BPTemplate[]>([]);
    const [selectedTemplateType, setSelectedTemplateType] = useState<
        'Monthly' | 'Biweekly' | '2-Monthly' | '3-Monthly'
    >('Monthly');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateType, setNewTemplateType] = useState<
        'Monthly' | 'Biweekly' | '2-Monthly' | '3-Monthly'
    >('Monthly');
    const theme = useTheme();

    // Trigger animation after component mounts
    useEffect(() => {
        setTimeout(() => setAnimateIn(true), 100);
    }, []);

    // Initial budget data
    const initialBudgetData: BudgetData = {
        week1: {
            Housing: { planned: 500, estimated: 480, remaining: 20 },
            Food: { planned: 200, estimated: 185, remaining: 15 },
            Transportation: { planned: 150, estimated: 145, remaining: 5 },
            Entertainment: { planned: 100, estimated: 120, remaining: -20 },
        },
        week2: {
            Housing: { planned: 500, estimated: 500, remaining: 0 },
            Food: { planned: 200, estimated: 195, remaining: 5 },
            Transportation: { planned: 150, estimated: 140, remaining: 10 },
            Entertainment: { planned: 100, estimated: 85, remaining: 15 },
        },
        week3: {
            Housing: { planned: 500, estimated: 485, remaining: 15 },
            Food: { planned: 200, estimated: 210, remaining: -10 },
            Transportation: { planned: 150, estimated: 155, remaining: -5 },
            Entertainment: { planned: 100, estimated: 95, remaining: 5 },
        },
        week4: {
            Housing: { planned: 500, estimated: 475, remaining: 25 },
            Food: { planned: 200, estimated: 190, remaining: 10 },
            Transportation: { planned: 150, estimated: 148, remaining: 2 },
            Entertainment: { planned: 100, estimated: 110, remaining: -10 },
        },
    };

    const initialWeekAccountBalances = {
        week1: 5020,
        week2: 5050,
        week3: 5055,
        week4: 5082,
    };

    const initialWeekDateRanges = [
        '06/01/25 - 06/07/25',
        '06/08/25 - 06/14/25',
        '06/15/25 - 06/21/25',
        '06/22/25 - 06/28/25',
    ];

    // Initialize with default template
    useEffect(() => {
        const initialTotals = calculateMonthlyTotals(initialBudgetData);
        const defaultTemplate: BPTemplate = {
            id: generateUUID(),
            name: 'Default June 2025',
            type: 'Monthly',
            budgetData: initialBudgetData,
            weekAccountBalances: initialWeekAccountBalances,
            weekDateRanges: initialWeekDateRanges,
            monthlyTotals: initialTotals,
        };
        setBPTemplates([defaultTemplate]);
        setSelectedTemplateId(defaultTemplate.id);
    }, []);

    // Helper functions for calculations
    const calculatePercentageSaved = (planned: number, estimated: number): number => {
        if (planned === 0) return 0;
        const savings = planned - estimated;
        return (savings / planned) * 100;
    };

    const calculateSpentOverBudgetPercentage = (planned: number, spent: number): number => {
        if (planned === 0) return 0;
        const difference = spent - planned;
        return (difference / planned) * 100;
    };

    const calculateActualOverPlannedPercentage = (planned: number, estimated: number): number => {
        if (planned === 0) return 0;
        return (estimated / planned) * 100;
    };

    const calculateSavingsContributed = (remaining: number): number => {
        return Math.max(0, remaining);
    };

    // Calculate monthly totals
    const calculateMonthlyTotals = (data: BudgetData): MonthlyTotals => {
        let totalPlanned = 0;
        let totalSpent = 0;
        const categories: CategoryKey[] = ['Housing', 'Food', 'Transportation', 'Entertainment'];
        const weeks = ['week1', 'week2', 'week3', 'week4'] as const;

        weeks.forEach((weekKey) => {
            const weekData = data[weekKey];
            categories.forEach((category) => {
                totalPlanned += weekData[category].planned;
                totalSpent += weekData[category].estimated;
            });
        });

        const percentageSaved = calculatePercentageSaved(totalPlanned, totalSpent);
        const spentOverBudgetPercentage = calculateSpentOverBudgetPercentage(totalPlanned, totalSpent);
        const budgetGoal = totalPlanned;

        return {
            budgetGoal,
            totalPlanned,
            totalSpent,
            percentageSaved,
            spentOverBudgetPercentage,
        };
    };

    // Get current template data
    const currentTemplate = bpTemplates.find((t) => t.id === selectedTemplateId) || {
        budgetData: initialBudgetData,
        weekAccountBalances: initialWeekAccountBalances,
        weekDateRanges: initialWeekDateRanges,
        monthlyTotals: calculateMonthlyTotals(initialBudgetData),
    };

    const { budgetData, weekAccountBalances, weekDateRanges } = currentTemplate;
    const { budgetGoal, totalPlanned, totalSpent, percentageSaved, spentOverBudgetPercentage } =
    currentTemplate.monthlyTotals || calculateMonthlyTotals(budgetData);

    const handleMonthChange = (direction: Direction): void => {
        setIsLoading(true);
        setTimeout(() => {
            console.log(`Changing month ${direction}`);
            setIsLoading(false);
        }, 500);
    };

    const toggleWeekCollapse = (weekIndex: number): void => {
        setCollapsedWeeks((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(weekIndex)) {
                newSet.delete(weekIndex);
            } else {
                newSet.add(weekIndex);
            }
            return newSet;
        });
    };

    const handleSaveTemplate = () => {
        if (!newTemplateName) return;
        const newTemplate: BPTemplate = {
            id: generateUUID(),
            name: newTemplateName,
            type: newTemplateType,
            budgetData,
            weekAccountBalances,
            weekDateRanges,
            monthlyTotals: calculateMonthlyTotals(budgetData),
        };
        setBPTemplates((prev) => [...prev, newTemplate]);
        setOpenDialog(false);
        setNewTemplateName('');
        setNewTemplateType('Monthly');
    };

    const handleTemplateTypeChange = (
        event: React.MouseEvent<HTMLElement>,
        newType: 'Monthly' | 'Biweekly' | '2-Monthly' | '3-Monthly' | null
    ) => {
        if (newType) {
            setSelectedTemplateType(newType);
            const availableTemplates = bpTemplates.filter((t) => t.type === newType);
            setSelectedTemplateId(availableTemplates[0]?.id || null);
        }
    };

    const handleTemplateSelect = (event: any) => {
        setSelectedTemplateId(event.target.value as string);
    };

    const handleViewModeChange = (
        event: React.MouseEvent<HTMLElement>,
        newViewMode: ViewMode | null
    ) => {
        if (newViewMode) {
            setViewMode(newViewMode);
        }
    };

    // Prepare data for Pie Charts in Statistics View
    const categories: CategoryKey[] = ['Housing', 'Food', 'Transportation', 'Entertainment'];
    const pieChartData = categories.map((category, index) => {
        const totalPlanned = ['week1', 'week2', 'week3', 'week4'].reduce(
            (sum, weekKey) => sum + budgetData[weekKey as keyof BudgetData][category].planned,
            0
        );
        const totalEstimated = ['week1', 'week2', 'week3', 'week4'].reduce(
            (sum, weekKey) => sum + budgetData[weekKey as keyof BudgetData][category].estimated,
            0
        );
        return {
            id: index,
            label: category,
            planned: totalPlanned,
            estimated: totalEstimated,
        };
    });

    const renderTemplateView = () => (
        <>
            <StyledTableContainer>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                        <StyledTableHeadRow>
                            <TableCell
                                sx={{
                                    fontWeight: 'bold',
                                    color: maroonColor,
                                    fontSize: '0.95rem',
                                    padding: '20px 16px',
                                    width: '200px',
                                }}
                            >
                                Week Period
                            </TableCell>
                            <TableCell
                                sx={{
                                    fontWeight: 'bold',
                                    color: maroonColor,
                                    fontSize: '0.95rem',
                                    padding: '20px 16px',
                                }}
                            >
                                Category
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: 'bold',
                                    color: maroonColor,
                                    fontSize: '0.95rem',
                                    padding: '20px 16px',
                                }}
                            >
                                Planned
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: 'bold',
                                    color: maroonColor,
                                    fontSize: '0.95rem',
                                    padding: '20px 16px',
                                }}
                            >
                                Actual
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: 'bold',
                                    color: maroonColor,
                                    fontSize: '0.95rem',
                                    padding: '20px 16px',
                                }}
                            >
                                Spending %
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: 'bold',
                                    color: maroonColor,
                                    fontSize: '0.95rem',
                                    padding: '20px 16px',
                                }}
                            >
                                Savings %
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: 'bold',
                                    color: maroonColor,
                                    fontSize: '0.95rem',
                                    padding: '20px 16px',
                                }}
                            >
                                Savings Contribution
                            </TableCell>
                        </StyledTableHeadRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <StyledTableRow>
                                <TableCell colSpan={7}>
                                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                                </TableCell>
                            </StyledTableRow>
                        ) : (
                            ((): JSX.Element[] => {
                                const rows: JSX.Element[] = [];

                                weekDateRanges.forEach((weekRange, weekIndex) => {
                                    const weekKey = `week${weekIndex + 1}` as keyof BudgetData;
                                    const weekData = budgetData[weekKey];
                                    const isCollapsed = collapsedWeeks.has(weekIndex);
                                    const accountBalance = weekAccountBalances[weekKey];

                                    // Calculate week totals
                                    const weekTotalPlanned = categories.reduce(
                                        (sum, category) => sum + weekData[category].planned,
                                        0
                                    );
                                    const weekTotalEstimated = categories.reduce(
                                        (sum, category) => sum + weekData[category].estimated,
                                        0
                                    );
                                    const weekTotalSavingsContributed = categories.reduce(
                                        (sum, category) => sum + calculateSavingsContributed(weekData[category].remaining),
                                        0
                                    );
                                    const weekPercentageSaved = calculatePercentageSaved(
                                        weekTotalPlanned,
                                        weekTotalEstimated
                                    );
                                    const weekActualOverPlanned = calculateActualOverPlannedPercentage(
                                        weekTotalPlanned,
                                        weekTotalEstimated
                                    );

                                    // Week header row with collapse/expand functionality
                                    rows.push(
                                        <StyledTableRow
                                            key={`${weekRange}-header`}
                                            onClick={() => toggleWeekCollapse(weekIndex)}
                                        >
                                            <TableCell
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: maroonColor,
                                                    fontSize: '0.95rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1.5,
                                                    padding: '20px 16px',
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        p: 0.5,
                                                        borderRadius: '50%',
                                                        backgroundColor: primaryBlue,
                                                        color: 'white',
                                                    }}
                                                >
                                                    {isCollapsed ? (
                                                        <ExpandMore sx={{ fontSize: '1.2rem' }} />
                                                    ) : (
                                                        <ExpandLess sx={{ fontSize: '1.2rem' }} />
                                                    )}
                                                </Box>
                                                {weekRange}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    fontWeight: 500,
                                                    color: 'text.secondary',
                                                    fontSize: '0.875rem',
                                                    fontStyle: 'italic',
                                                    padding: '20px 16px',
                                                }}
                                            >
                                                {isCollapsed ? 'Click to expand' : 'Click to collapse'}
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    fontSize: '0.95rem',
                                                    padding: '20px 16px',
                                                }}
                                            >
                                                ${weekTotalPlanned.toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    fontSize: '0.95rem',
                                                    padding: '20px 16px',
                                                }}
                                            >
                                                ${weekTotalEstimated.toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    fontSize: '0.95rem',
                                                    padding: '20px 16px',
                                                }}
                                            >
                                                {weekActualOverPlanned.toFixed(1)}%
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    color: weekPercentageSaved >= 0 ? 'green' : 'red',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.95rem',
                                                    padding: '20px 16px',
                                                }}
                                            >
                                                {weekPercentageSaved >= 0 ? '+' : ''}{weekPercentageSaved.toFixed(1)}%
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    color: weekTotalSavingsContributed >= 0 ? 'green' : 'red',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.95rem',
                                                    padding: '20px 16px',
                                                }}
                                            >
                                                ${Math.abs(weekTotalSavingsContributed).toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                                {weekTotalSavingsContributed >= 0 ? ' under' : ' over'}
                                            </TableCell>
                                        </StyledTableRow>
                                    );

                                    // Category rows (only show if not collapsed)
                                    if (!isCollapsed) {
                                        categories.forEach((category) => {
                                            const data = weekData[category];
                                            const percentageSaved = calculatePercentageSaved(data.planned, data.estimated);
                                            const savingsContributed = calculateSavingsContributed(data.remaining);
                                            const actualOverPlanned = calculateActualOverPlannedPercentage(
                                                data.planned,
                                                data.estimated
                                            );

                                            rows.push(
                                                <StyledTableRow key={`${weekRange}-${category}`}>
                                                    <TableCell sx={{ pl: 6, padding: '20px 16px' }} />
                                                    <TableCell
                                                        component="th"
                                                        scope="row"
                                                        sx={{
                                                            fontWeight: 500,
                                                            fontSize: '0.95rem',
                                                            padding: '20px 16px',
                                                        }}
                                                    >
                                                        {category}
                                                    </TableCell>
                                                    <TableCell
                                                        align="right"
                                                        sx={{
                                                            fontSize: '0.95rem',
                                                            padding: '20px 16px',
                                                        }}
                                                    >
                                                        ${data.planned.toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                    </TableCell>
                                                    <TableCell
                                                        align="right"
                                                        sx={{
                                                            fontSize: '0.95rem',
                                                            padding: '20px 16px',
                                                        }}
                                                    >
                                                        ${data.estimated.toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                    </TableCell>
                                                    <TableCell
                                                        align="right"
                                                        sx={{
                                                            fontSize: '0.95rem',
                                                            padding: '20px 16px',
                                                        }}
                                                    >
                                                        {actualOverPlanned.toFixed(1)}%
                                                    </TableCell>
                                                    <TableCell
                                                        align="right"
                                                        sx={{
                                                            color: percentageSaved >= 0 ? 'green' : 'red',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.95rem',
                                                            padding: '20px 16px',
                                                        }}
                                                    >
                                                        {percentageSaved >= 0 ? '+' : ''}{percentageSaved.toFixed(1)}%
                                                    </TableCell>
                                                    <TableCell
                                                        align="right"
                                                        sx={{
                                                            color: savingsContributed >= 0 ? 'green' : 'red',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.95rem',
                                                            padding: '20px 16px',
                                                        }}
                                                    >
                                                        ${Math.abs(savingsContributed).toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                        {savingsContributed >= 0 ? ' under' : ' over'}
                                                    </TableCell>
                                                </StyledTableRow>
                                            );
                                        });

                                        // Account balance row
                                        rows.push(
                                            <StyledTableRow key={`${weekRange}-balance`}>
                                                <TableCell sx={{ pl: 6, padding: '20px 16px' }} />
                                                <TableCell
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: maroonColor,
                                                        fontSize: '0.95rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        padding: '20px 16px',
                                                    }}
                                                >
                                                    <AccountBalance sx={{ fontSize: '1.1rem' }} />
                                                    Account Balance
                                                </TableCell>
                                                <TableCell
                                                    colSpan={5}
                                                    align="right"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        fontSize: '0.95rem',
                                                        padding: '20px 16px',
                                                    }}
                                                >
                                                    ${accountBalance.toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                                </TableCell>
                                            </StyledTableRow>
                                        );
                                    }
                                });

                                return rows;
                            })()
                        )}
                    </TableBody>
                </Table>
            </StyledTableContainer>
        </>
    );

    // Transform pieChartData for Recharts
    const plannedPieData = pieChartData.map((item) => ({
        name: item.label,
        value: item.planned,
    }));
    const estimatedPieData = pieChartData.map((item) => ({
        name: item.label,
        value: item.estimated,
    }));

// Define colors for pie slices
    const COLORS = [primaryBlue, '#1565c0', maroonColor, '#600000'];

    const renderStatisticsView = () => (
        <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: maroonColor }}>
                        Planned Spending by Category
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={plannedPieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={80}
                                paddingAngle={2}
                            >
                                {plannedPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: `1px solid ${maroonColor}`,
                                    borderRadius: '4px',
                                }}
                            />
                            <Legend
                                layout="horizontal"
                                verticalAlign="bottom"
                                align="center"
                                wrapperStyle={{ paddingTop: '10px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </Grid>
            <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: maroonColor }}>
                        Actual Spending by Category
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={estimatedPieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={80}
                            paddingAngle={2}
                        >
                            {estimatedPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: `1px solid ${maroonColor}`,
                                borderRadius: '4px',
                            }}
                        />
                        <Legend
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{ paddingTop: '10px' }}
                        />
                    </PieChart>
                    </ResponsiveContainer>
                </Card>
            </Grid>
            <Grid item xs={12}>
                <Card sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: maroonColor }}>
                        Monthly Summary
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography>
                            <strong>Budget Goal:</strong> ${budgetGoal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Typography>
                        <Typography>
                            <strong>Total Planned:</strong> ${totalPlanned.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Typography>
                        <Typography>
                            <strong>Total Spent:</strong> ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Typography>
                        <Typography sx={{ color: percentageSaved >= 0 ? 'green' : 'red' }}>
                            <strong>Savings %:</strong> {percentageSaved >= 0 ? '+' : ''}{percentageSaved.toFixed(1)}%
                        </Typography>
                        <Typography sx={{ color: spentOverBudgetPercentage > 0 ? 'red' : 'green' }}>
                            <strong>Spent Over Budget %:</strong> {spentOverBudgetPercentage > 0 ? '+' : ''}{spentOverBudgetPercentage.toFixed(1)}%
                        </Typography>
                    </Box>
                </Card>
            </Grid>
        </Grid>
    );

    return (
        <Box
            sx={{
                maxWidth: 'calc(100% - 240px)',
                ml: '240px',
                minHeight: '100vh',
                background: lightGray,
                backgroundImage: 'radial-gradient(rgba(0, 0, 120, 0.01) 2px, transparent 2px)',
                backgroundSize: '40px 40px',
            }}
        >
            <Sidebar />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Grow in={animateIn} timeout={600}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 4,
                            flexDirection: { xs: 'column', sm: 'row' },
                            textAlign: { xs: 'center', sm: 'left' },
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Typography
                                variant="h4"
                                component="h1"
                                sx={{
                                    fontWeight: 800,
                                    color: theme.palette.text.primary,
                                    letterSpacing: '-0.025em',
                                }}
                            >
                                John Smith's Budget Planner
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                                Track your weekly spending and savings progress
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <IconButton
                                sx={{
                                    backgroundColor: 'white',
                                    border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                                    borderRadius: '8px',
                                    width: '48px',
                                    height: '48px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    '&:hover': {
                                        backgroundColor: primaryBlue,
                                        color: 'white',
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        borderColor: primaryBlue,
                                    },
                                }}
                                onClick={() => handleMonthChange('prev')}
                            >
                                <ChevronLeft />
                            </IconButton>
                            <Card
                                sx={{
                                    px: 2.5,
                                    py: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRadius: 2,
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                                }}
                            >
                                <CalendarToday style={{ marginRight: 8, color: theme.palette.text.secondary, fontSize: 18 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {currentMonth}
                                </Typography>
                            </Card>
                            <IconButton
                                sx={{
                                    backgroundColor: 'white',
                                    border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                                    borderRadius: '8px',
                                    width: '48px',
                                    height: '48px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    '&:hover': {
                                        backgroundColor: primaryBlue,
                                        color: 'white',
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        borderColor: primaryBlue,
                                    },
                                }}
                                onClick={() => handleMonthChange('next')}
                            >
                                <ChevronRight />
                            </IconButton>
                        </Box>
                    </Box>
                </Grow>

                <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <StyledButtonGroup
                        value={selectedTemplateType}
                        exclusive
                        onChange={handleTemplateTypeChange}
                        sx={{ backgroundColor: 'white', borderRadius: '8px' }}
                    >
                        <StyledButton
                            value="Monthly"
                            sx={{ color: maroonColor, '&.Mui-selected': { backgroundColor: primaryBlue, color: 'white' } }}
                        >
                            Monthly
                        </StyledButton>
                        <StyledButton
                            value="Biweekly"
                            sx={{ color: maroonColor, '&.Mui-selected': { backgroundColor: primaryBlue, color: 'white' } }}
                        >
                            Biweekly
                        </StyledButton>
                        <StyledButton
                            value="2-Monthly"
                            sx={{ color: maroonColor, '&.Mui-selected': { backgroundColor: primaryBlue, color: 'white' } }}
                        >
                            2-Monthly
                        </StyledButton>
                        <StyledButton
                            value="3-Monthly"
                            sx={{ color: maroonColor, '&.Mui-selected': { backgroundColor: primaryBlue, color: 'white' } }}
                        >
                            3-Monthly
                        </StyledButton>
                    </StyledButtonGroup>
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel sx={{ color: maroonColor }}>Select Template</InputLabel>
                        <Select
                            value={selectedTemplateId || ''}
                            label="Select Template"
                            onChange={handleTemplateSelect}
                            sx={{ backgroundColor: 'white', borderRadius: '8px' }}
                        >
                            {bpTemplates
                                .filter((t) => t.type === selectedTemplateType)
                                .map((t) => (
                                    <MenuItem key={t.id} value={t.id}>
                                        {t.name}
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        sx={{
                            backgroundColor: primaryBlue,
                            color: 'white',
                            borderRadius: '8px',
                            '&:hover': { backgroundColor: '#1565c0' },
                        }}
                        onClick={() => setOpenDialog(true)}
                    >
                        Save as Template
                    </Button>
                </Box>

                <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                    <DialogTitle sx={{ color: maroonColor }}>Save Budget Plan Template</DialogTitle>
                    <DialogContent>
                        <TextField
                            label="Template Name"
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            fullWidth
                            margin="normal"
                            sx={{ backgroundColor: 'white' }}
                        />
                        <FormControl sx={{ minWidth: '100%' }} variant="outlined" margin="normal">
                            <InputLabel sx={{ color: maroonColor }}>Template Type</InputLabel>
                            <Select
                                value={newTemplateType}
                                onChange={(e) =>
                                    setNewTemplateType(e.target.value as 'Monthly' | 'Biweekly' | '2-Monthly' | '3-Monthly')
                                }
                                label="Template Type"
                                sx={{ backgroundColor: 'white' }}
                            >
                                <MenuItem value="Monthly">Monthly</MenuItem>
                                <MenuItem value="Biweekly">Biweekly</MenuItem>
                                <MenuItem value="2-Monthly">2-Monthly</MenuItem>
                                <MenuItem value="3-Monthly">3-Monthly</MenuItem>
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)} sx={{ color: maroonColor }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveTemplate}
                            variant="contained"
                            sx={{ backgroundColor: primaryBlue, color: 'white' }}
                            disabled={!newTemplateName}
                        >
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>

                <Grid container spacing={4}>
                    <Grid item xs={12}>
                        <Grow in={animateIn} timeout={800}>
                            <Card sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <StyledButtonGroup
                                        value={viewMode}
                                        exclusive
                                        onChange={handleViewModeChange}
                                        sx={{ backgroundColor: 'white', borderRadius: '8px' }}
                                    >
                                        <ToggleButton value="template">Template View</ToggleButton>
                                        <ToggleButton value="statistics">Statistics View</ToggleButton>
                                    </StyledButtonGroup>
                                </Box>
                                <Typography
                                    variant="h5"
                                    component="h2"
                                    sx={{
                                        fontWeight: 'bold',
                                        mb: 2,
                                        textAlign: 'left',
                                        color: 'text.primary',
                                    }}
                                >
                                    Monthly Breakdown by Week & Category
                                </Typography>
                                {viewMode === 'template' ? renderTemplateView() : renderStatisticsView()}
                                <Box sx={{ mt: 4 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography
                                            variant="h5"
                                            component="h2"
                                            sx={{
                                                fontWeight: 'bold',
                                                textAlign: 'left',
                                                color: 'text.primary',
                                            }}
                                        >
                                            Monthly Totals
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            sx={{
                                                backgroundColor: primaryBlue,
                                                color: 'white',
                                                borderRadius: '8px',
                                                '&:hover': { backgroundColor: '#1565c0' },
                                            }}
                                            onClick={() => setOpenDialog(true)}
                                        >
                                            Save as Template
                                        </Button>
                                    </Box>
                                    <StyledTableContainer>
                                        <Table sx={{ minWidth: 650 }}>
                                            <TableHead>
                                                <StyledTableHeadRow>
                                                    <TableCell
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            color: maroonColor,
                                                            fontSize: '0.95rem',
                                                            padding: '20px 16px',
                                                        }}
                                                    >
                                                        Budget Goal
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            color: maroonColor,
                                                            fontSize: '0.95rem',
                                                            padding: '20px 16px',
                                                        }}
                                                    >
                                                        Total Planned
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            color: maroonColor,
                                                            fontSize: '0.95rem',
                                                            padding: '20px 16px',
                                                        }}
                                                    >
                                                        Total Spent
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            color: maroonColor,
                                                            fontSize: '0.95rem',
                                                            padding: '20px 16px',
                                                        }}
                                                    >
                                                        Savings %
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            color: maroonColor,
                                                            fontSize: '0.95rem',
                                                            padding: '20px 16px',
                                                        }}
                                                    >
                                                        Spent Over Budget %
                                                    </TableCell>
                                                </StyledTableHeadRow>
                                            </TableHead>
                                            <TableBody>
                                                {isLoading ? (
                                                    <StyledTableRow>
                                                        <TableCell colSpan={5}>
                                                            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
                                                        </TableCell>
                                                    </StyledTableRow>
                                                ) : (
                                                    <StyledTableRow>
                                                        <TableCell
                                                            sx={{
                                                                fontWeight: 500,
                                                                fontSize: '0.95rem',
                                                                padding: '20px 16px',
                                                            }}
                                                        >
                                                            ${budgetGoal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell
                                                            sx={{
                                                                fontWeight: 500,
                                                                fontSize: '0.95rem',
                                                                padding: '20px 16px',
                                                            }}
                                                        >
                                                            ${totalPlanned.toLocaleString('en-US', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                        </TableCell>
                                                        <TableCell
                                                            sx={{
                                                                fontWeight: 500,
                                                                fontSize: '0.95rem',
                                                                padding: '20px 16px',
                                                            }}
                                                        >
                                                            ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell
                                                            sx={{
                                                                color: percentageSaved >= 0 ? 'green' : 'red',
                                                                fontWeight: 'bold',
                                                                fontSize: '0.95rem',
                                                                padding: '20px 16px',
                                                            }}
                                                        >
                                                            {percentageSaved >= 0 ? '+' : ''}{percentageSaved.toFixed(1)}%
                                                        </TableCell>
                                                        <TableCell
                                                            sx={{
                                                                color: spentOverBudgetPercentage > 0 ? 'red' : 'green',
                                                                fontWeight: 'bold',
                                                                fontSize: '0.95rem',
                                                                padding: '20px 16px',
                                                            }}
                                                        >
                                                            {spentOverBudgetPercentage > 0 ? '+' : ''}{spentOverBudgetPercentage.toFixed(1)}%
                                                        </TableCell>
                                                    </StyledTableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </StyledTableContainer>
                                </Box>
                            </Card>
                        </Grow>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default BudgetPlanner;

// import React, { useState, useEffect } from 'react';
// import {
//     Box,
//     Typography,
//     IconButton,
//     Table,
//     TableBody,
//     TableCell,
//     TableContainer,
//     TableHead,
//     TableRow,
//     Paper,
//     Card,
//     CardContent,
//     Drawer,
//     List,
//     ListItem,
//     ListItemIcon,
//     ListItemText,
//     Grid,
//     Skeleton,
//     Container,
//     useTheme,
//     alpha,
//     Grow,
//     Button,
//     Dialog,
//     DialogTitle,
//     DialogContent,
//     DialogActions,
//     TextField,
//     ToggleButton,
//     ToggleButtonGroup,
//     Select,
//     MenuItem,
//     FormControl,
//     InputLabel,
//     ButtonGroup,
// } from '@mui/material';
// import {
//     ChevronLeft,
//     ChevronRight,
//     Dashboard,
//     AccountBalance,
//     TrendingUp,
//     Category,
//     CalendarToday,
//     ExpandMore,
//     ExpandLess,
// } from '@mui/icons-material';
// import { styled } from '@mui/material/styles';
// import Sidebar from "./Sidebar";
//
// // Type definitions
// interface BudgetItem {
//     planned: number;
//     estimated: number;
//     remaining: number;
// }
//
// interface WeekData {
//     Housing: BudgetItem;
//     Food: BudgetItem;
//     Transportation: BudgetItem;
//     Entertainment: BudgetItem;
// }
//
// interface BudgetData {
//     week1: WeekData;
//     week2: WeekData;
//     week3: WeekData;
//     week4: WeekData;
// }
//
// interface MonthlyTotals {
//     budgetGoal: number;
//     totalPlanned: number;
//     totalSpent: number;
//     percentageSaved: number;
//     spentOverBudgetPercentage: number;
// }
//
// interface BPTemplate {
//     id: string;
//     name: string;
//     type: 'Monthly' | 'Biweekly' | '2-Monthly' | '3-Monthly';
//     budgetData: BudgetData;
//     weekAccountBalances: { week1: number; week2: number; week3: number; week4: number };
//     weekDateRanges: string[];
//     monthlyTotals: MonthlyTotals;
// }
//
// type CategoryKey = keyof WeekData;
// type Direction = 'prev' | 'next';
// type ViewMode = 'table' | 'statistics';
//
// // Colors to match TopExpenseCategory
// const maroonColor = '#800000';
// const primaryBlue = '#1976d2';
// const lightGray = '#f9fafc';
//
// // Styled components to match TopExpenseCategory
// const StyledTableContainer = styled(TableContainer)({
//     borderRadius: 4,
//     overflow: 'hidden',
//     transition: 'box-shadow 0.3s ease-in-out',
//     '&:hover': {
//         boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
//     },
// });
//
// const StyledTableRow = styled(TableRow)({
//     backgroundColor: 'white',
// });
//
// const StyledTableHeadRow = styled(TableRow)({
//     backgroundColor: 'background.paper',
// });
//
// const StyledButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
//     '& .MuiToggleButtonGroup-grouped': {
//         border: `1px solid ${maroonColor}`,
//         '&:not(:last-of-type)': {
//             borderRight: `1px solid ${maroonColor}`,
//         },
//     },
// }));
//
// const StyledButton = styled(Button)(({ theme }) => ({
//     textTransform: 'none',
//     fontWeight: 600,
//     padding: '8px 16px',
//     borderRadius: '8px',
//     transition: 'all 0.3s ease',
//     color: maroonColor,
//     borderColor: maroonColor,
//     '&:hover': {
//         backgroundColor: 'rgba(128, 0, 0, 0.04)', // Light maroon background on hover
//         borderColor: maroonColor,
//     },
//     '&.Mui-selected, &.MuiButton-contained': {
//         backgroundColor: maroonColor,
//         color: 'white',
//         '&:hover': {
//             backgroundColor: '#600000', // Darker maroon on hover for selected state
//         },
//     },
// }));
//
//
// // Simple UUID generator
// const generateUUID = (): string => {
//     return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
//         const r = Math.random() * 16 | 0;
//         const v = c === 'x' ? r : (r & 0x3 | 0x8);
//         return v.toString(16);
//     });
// };
//
// const BudgetPlanner: React.FC = () => {
//     const [currentMonth, setCurrentMonth] = useState<string>('June 2025');
//     const [isLoading, setIsLoading] = useState<boolean>(false);
//     const [viewMode, setViewMode] = useState<ViewMode>('table');
//     const [collapsedWeeks, setCollapsedWeeks] = useState<Set<number>>(new Set());
//     const [animateIn, setAnimateIn] = useState(false);
//     const [bpTemplates, setBPTemplates] = useState<BPTemplate[]>([]);
//     const [selectedTemplateType, setSelectedTemplateType] = useState<
//         'Monthly' | 'Biweekly' | '2-Monthly' | '3-Monthly'
//     >('Monthly');
//     const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
//     const [openDialog, setOpenDialog] = useState(false);
//     const [newTemplateName, setNewTemplateName] = useState('');
//     const [newTemplateType, setNewTemplateType] = useState<
//         'Monthly' | 'Biweekly' | '2-Monthly' | '3-Monthly'
//     >('Monthly');
//     const theme = useTheme();
//
//     // Trigger animation after component mounts
//     useEffect(() => {
//         setTimeout(() => setAnimateIn(true), 100);
//     }, []);
//
//     // Initial budget data
//     const initialBudgetData: BudgetData = {
//         week1: {
//             Housing: { planned: 500, estimated: 480, remaining: 20 },
//             Food: { planned: 200, estimated: 185, remaining: 15 },
//             Transportation: { planned: 150, estimated: 145, remaining: 5 },
//             Entertainment: { planned: 100, estimated: 120, remaining: -20 },
//         },
//         week2: {
//             Housing: { planned: 500, estimated: 500, remaining: 0 },
//             Food: { planned: 200, estimated: 195, remaining: 5 },
//             Transportation: { planned: 150, estimated: 140, remaining: 10 },
//             Entertainment: { planned: 100, estimated: 85, remaining: 15 },
//         },
//         week3: {
//             Housing: { planned: 500, estimated: 485, remaining: 15 },
//             Food: { planned: 200, estimated: 210, remaining: -10 },
//             Transportation: { planned: 150, estimated: 155, remaining: -5 },
//             Entertainment: { planned: 100, estimated: 95, remaining: 5 },
//         },
//         week4: {
//             Housing: { planned: 500, estimated: 475, remaining: 25 },
//             Food: { planned: 200, estimated: 190, remaining: 10 },
//             Transportation: { planned: 150, estimated: 148, remaining: 2 },
//             Entertainment: { planned: 100, estimated: 110, remaining: -10 },
//         },
//     };
//
//     const initialWeekAccountBalances = {
//         week1: 5020,
//         week2: 5050,
//         week3: 5055,
//         week4: 5082,
//     };
//
//     const initialWeekDateRanges = [
//         '06/01/25 - 06/07/25',
//         '06/08/25 - 06/14/25',
//         '06/15/25 - 06/21/25',
//         '06/22/25 - 06/28/25',
//     ];
//
//     // Initialize with default template
//     useEffect(() => {
//         const initialTotals = calculateMonthlyTotals(initialBudgetData);
//         const defaultTemplate: BPTemplate = {
//             id: generateUUID(),
//             name: 'Default June 2025',
//             type: 'Monthly',
//             budgetData: initialBudgetData,
//             weekAccountBalances: initialWeekAccountBalances,
//             weekDateRanges: initialWeekDateRanges,
//             monthlyTotals: initialTotals,
//         };
//         setBPTemplates([defaultTemplate]);
//         setSelectedTemplateId(defaultTemplate.id);
//     }, []);
//
//     // Helper functions for calculations
//     const calculatePercentageSaved = (planned: number, estimated: number): number => {
//         if (planned === 0) return 0;
//         const savings = planned - estimated;
//         return (savings / planned) * 100;
//     };
//
//     const calculateSpentOverBudgetPercentage = (planned: number, spent: number): number => {
//         if (planned === 0) return 0;
//         const difference = spent - planned;
//         return (difference / planned) * 100;
//     };
//
//     const calculateActualOverPlannedPercentage = (planned: number, estimated: number): number => {
//         if (planned === 0) return 0;
//         return (estimated / planned) * 100;
//     };
//
//     const calculateSavingsContributed = (remaining: number): number => {
//         return Math.max(0, remaining);
//     };
//
//     // Calculate monthly totals
//     const calculateMonthlyTotals = (data: BudgetData): MonthlyTotals => {
//         let totalPlanned = 0;
//         let totalSpent = 0;
//         const categories: CategoryKey[] = ['Housing', 'Food', 'Transportation', 'Entertainment'];
//         const weeks = ['week1', 'week2', 'week3', 'week4'] as const;
//
//         weeks.forEach((weekKey) => {
//             const weekData = data[weekKey];
//             categories.forEach((category) => {
//                 totalPlanned += weekData[category].planned;
//                 totalSpent += weekData[category].estimated;
//             });
//         });
//
//         const percentageSaved = calculatePercentageSaved(totalPlanned, totalSpent);
//         const spentOverBudgetPercentage = calculateSpentOverBudgetPercentage(totalPlanned, totalSpent);
//         const budgetGoal = totalPlanned; // Assuming budget goal is the total planned amount
//
//         return {
//             budgetGoal,
//             totalPlanned,
//             totalSpent,
//             percentageSaved,
//             spentOverBudgetPercentage,
//         };
//     };
//
//     // Get current template data
//     const currentTemplate = bpTemplates.find((t) => t.id === selectedTemplateId) || {
//         budgetData: initialBudgetData,
//         weekAccountBalances: initialWeekAccountBalances,
//         weekDateRanges: initialWeekDateRanges,
//         monthlyTotals: calculateMonthlyTotals(initialBudgetData),
//     };
//
//     const { budgetData, weekAccountBalances, weekDateRanges } = currentTemplate;
//     const { budgetGoal, totalPlanned, totalSpent, percentageSaved, spentOverBudgetPercentage } =
//     currentTemplate.monthlyTotals || calculateMonthlyTotals(budgetData);
//
//     const sidebarItems = [
//         { text: 'Dashboard', icon: <Dashboard /> },
//         { text: 'Budget Overview', icon: <AccountBalance /> },
//         { text: 'Categories', icon: <Category /> },
//         { text: 'Analytics', icon: <TrendingUp /> },
//         { text: 'Calendar View', icon: <CalendarToday /> },
//     ];
//
//     const handleMonthChange = (direction: Direction): void => {
//         setIsLoading(true);
//         setTimeout(() => {
//             console.log(`Changing month ${direction}`);
//             setIsLoading(false);
//         }, 500);
//     };
//
//     const toggleWeekCollapse = (weekIndex: number): void => {
//         setCollapsedWeeks((prev) => {
//             const newSet = new Set(prev);
//             if (newSet.has(weekIndex)) {
//                 newSet.delete(weekIndex);
//             } else {
//                 newSet.add(weekIndex);
//             }
//             return newSet;
//         });
//     };
//
//     const handleSaveTemplate = () => {
//         if (!newTemplateName) return;
//         const newTemplate: BPTemplate = {
//             id: generateUUID(),
//             name: newTemplateName,
//             type: newTemplateType,
//             budgetData,
//             weekAccountBalances,
//             weekDateRanges,
//             monthlyTotals: calculateMonthlyTotals(budgetData),
//         };
//         setBPTemplates((prev) => [...prev, newTemplate]);
//         setOpenDialog(false);
//         setNewTemplateName('');
//         setNewTemplateType('Monthly');
//     };
//
//     const handleTemplateTypeChange = (
//         event: React.MouseEvent<HTMLElement>,
//         newType: 'Monthly' | 'Biweekly' | '2-Monthly' | '3-Monthly' | null
//     ) => {
//         if (newType) {
//             setSelectedTemplateType(newType);
//             const availableTemplates = bpTemplates.filter((t) => t.type === newType);
//             setSelectedTemplateId(availableTemplates[0]?.id || null);
//         }
//     };
//
//     const handleTemplateSelect = (event: any) => {
//         setSelectedTemplateId(event.target.value as string);
//     };
//
//     return (
//         <Box
//             sx={{
//                 maxWidth: 'calc(100% - 240px)',
//                 ml: '240px',
//                 minHeight: '100vh',
//                 background: lightGray,
//                 backgroundImage: 'radial-gradient(rgba(0, 0, 120, 0.01) 2px, transparent 2px)',
//                 backgroundSize: '40px 40px',
//             }}
//         >
//             {/* Sidebar */}
//            <Sidebar />
//             <Container maxWidth="lg" sx={{ py: 4 }}>
//                 {/* Header with title and month navigation */}
//                 <Grow in={animateIn} timeout={600}>
//                     <Box
//                         sx={{
//                             display: 'flex',
//                             justifyContent: 'space-between',
//                             alignItems: 'center',
//                             mb: 4,
//                             flexDirection: { xs: 'column', sm: 'row' },
//                             textAlign: { xs: 'center', sm: 'left' },
//                             gap: 2,
//                         }}
//                     >
//                         <Box>
//                             <Typography
//                                 variant="h4"
//                                 component="h1"
//                                 sx={{
//                                     fontWeight: 800,
//                                     color: theme.palette.text.primary,
//                                     letterSpacing: '-0.025em',
//                                 }}
//                             >
//                                 John Smith's Budget Planner
//                             </Typography>
//                             <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
//                                 Track your weekly spending and savings progress
//                             </Typography>
//                         </Box>
//                         <Box
//                             sx={{
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 gap: 1,
//                             }}
//                         >
//                             <IconButton
//                                 sx={{
//                                     backgroundColor: 'white',
//                                     border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
//                                     borderRadius: '8px',
//                                     width: '48px',
//                                     height: '48px',
//                                     transition: 'all 0.3s ease',
//                                     boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
//                                     '&:hover': {
//                                         backgroundColor: primaryBlue,
//                                         color: 'white',
//                                         transform: 'translateY(-1px)',
//                                         boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
//                                         borderColor: primaryBlue,
//                                     },
//                                 }}
//                                 onClick={() => handleMonthChange('prev')}
//                             >
//                                 <ChevronLeft />
//                             </IconButton>
//                             <Card
//                                 sx={{
//                                     px: 2.5,
//                                     py: 1,
//                                     display: 'flex',
//                                     alignItems: 'center',
//                                     borderRadius: 2,
//                                     boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
//                                 }}
//                             >
//                                 <CalendarToday style={{ marginRight: 8, color: theme.palette.text.secondary, fontSize: 18 }} />
//                                 <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
//                                     {currentMonth}
//                                 </Typography>
//                             </Card>
//                             <IconButton
//                                 sx={{
//                                     backgroundColor: 'white',
//                                     border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
//                                     borderRadius: '8px',
//                                     width: '48px',
//                                     height: '48px',
//                                     transition: 'all 0.3s ease',
//                                     boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
//                                     '&:hover': {
//                                         backgroundColor: primaryBlue,
//                                         color: 'white',
//                                         transform: 'translateY(-1px)',
//                                         boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
//                                         borderColor: primaryBlue,
//                                     },
//                                 }}
//                                 onClick={() => handleMonthChange('next')}
//                             >
//                                 <ChevronRight />
//                             </IconButton>
//                         </Box>
//                     </Box>
//                 </Grow>
//
//                 {/* Template Controls */}
//                 <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
//                     <StyledButtonGroup
//                         value={selectedTemplateType}
//                         exclusive
//                         onChange={handleTemplateTypeChange}
//                         sx={{ backgroundColor: 'white', borderRadius: '8px' }}
//                     >
//                         <StyledButton
//                             value="Monthly"
//                             sx={{ color: maroonColor, '&.Mui-selected': { backgroundColor: primaryBlue, color: 'white' } }}
//                         >
//                             Monthly
//                         </StyledButton>
//                         <StyledButton
//                             value="Biweekly"
//                             sx={{ color: maroonColor, '&.Mui-selected': { backgroundColor: primaryBlue, color: 'white' } }}
//                         >
//                             Biweekly
//                         </StyledButton>
//                         <StyledButton
//                             value="2-Monthly"
//                             sx={{ color: maroonColor, '&.Mui-selected': { backgroundColor: primaryBlue, color: 'white' } }}
//                         >
//                             2-Monthly
//                         </StyledButton>
//                         <StyledButton
//                             value="3-Monthly"
//                             sx={{ color: maroonColor, '&.Mui-selected': { backgroundColor: primaryBlue, color: 'white' } }}
//                         >
//                             3-Monthly
//                         </StyledButton>
//                     </StyledButtonGroup>
//                     <FormControl sx={{ minWidth: 200 }}>
//                         <InputLabel sx={{ color: maroonColor }}>Select Template</InputLabel>
//                         <Select
//                             value={selectedTemplateId || ''}
//                             label="Select Template"
//                             onChange={handleTemplateSelect}
//                             sx={{ backgroundColor: 'white', borderRadius: '8px' }}
//                         >
//                             {bpTemplates
//                                 .filter((t) => t.type === selectedTemplateType)
//                                 .map((t) => (
//                                     <MenuItem key={t.id} value={t.id}>
//                                         {t.name}
//                                     </MenuItem>
//                                 ))}
//                         </Select>
//                     </FormControl>
//                     <Button
//                         variant="contained"
//                         sx={{
//                             backgroundColor: primaryBlue,
//                             color: 'white',
//                             borderRadius: '8px',
//                             '&:hover': { backgroundColor: '#1565c0' },
//                         }}
//                         onClick={() => setOpenDialog(true)}
//                     >
//                         Save as Template
//                     </Button>
//                 </Box>
//
//                 {/* Save Template Dialog */}
//                 <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
//                     <DialogTitle sx={{ color: maroonColor }}>Save Budget Plan Template</DialogTitle>
//                     <DialogContent>
//                         <TextField
//                             label="Template Name"
//                             value={newTemplateName}
//                             onChange={(e) => setNewTemplateName(e.target.value)}
//                             fullWidth
//                             margin="normal"
//                             sx={{ backgroundColor: 'white' }}
//                         />
//                         <FormControl sx={{ minWidth: '100%' }} variant="outlined" margin="normal">
//                             <InputLabel sx={{ color: maroonColor }}>Template Type</InputLabel>
//                             <Select
//                                 value={newTemplateType}
//                                 onChange={(e) =>
//                                     setNewTemplateType(e.target.value as 'Monthly' | 'Biweekly' | '2-Monthly' | '3-Monthly')
//                                 }
//                                 label="Template Type"
//                                 sx={{ backgroundColor: 'white' }}
//                             >
//                                 <MenuItem value="Monthly">Monthly</MenuItem>
//                                 <MenuItem value="Biweekly">Biweekly</MenuItem>
//                                 <MenuItem value="2-Monthly">2-Monthly</MenuItem>
//                                 <MenuItem value="3-Monthly">3-Monthly</MenuItem>
//                             </Select>
//                         </FormControl>
//                     </DialogContent>
//                     <DialogActions>
//                         <Button onClick={() => setOpenDialog(false)} sx={{ color: maroonColor }}>
//                             Cancel
//                         </Button>
//                         <Button
//                             onClick={handleSaveTemplate}
//                             variant="contained"
//                             sx={{ backgroundColor: primaryBlue, color: 'white' }}
//                             disabled={!newTemplateName}
//                         >
//                             Save
//                         </Button>
//                     </DialogActions>
//                 </Dialog>
//
//                 <Grid container spacing={4}>
//                     <Grid item xs={12}>
//                         <Grow in={animateIn} timeout={800}>
//                             <Card sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
//                                 <Typography
//                                     variant="h5"
//                                     component="h2"
//                                     sx={{
//                                         fontWeight: 'bold',
//                                         mb: 2,
//                                         textAlign: 'left',
//                                         color: 'text.primary',
//                                     }}
//                                 >
//                                     Monthly Breakdown by Week & Category
//                                 </Typography>
//                                 <StyledTableContainer>
//                                     <Table sx={{ minWidth: 650 }}>
//                                         <TableHead>
//                                             <StyledTableHeadRow>
//                                                 <TableCell
//                                                     sx={{
//                                                         fontWeight: 'bold',
//                                                         color: maroonColor,
//                                                         fontSize: '0.95rem',
//                                                         padding: '20px 16px',
//                                                         width: '200px',
//                                                     }}
//                                                 >
//                                                     Week Period
//                                                 </TableCell>
//                                                 <TableCell
//                                                     sx={{
//                                                         fontWeight: 'bold',
//                                                         color: maroonColor,
//                                                         fontSize: '0.95rem',
//                                                         padding: '20px 16px',
//                                                     }}
//                                                 >
//                                                     Category
//                                                 </TableCell>
//                                                 <TableCell
//                                                     align="right"
//                                                     sx={{
//                                                         fontWeight: 'bold',
//                                                         color: maroonColor,
//                                                         fontSize: '0.95rem',
//                                                         padding: '20px 16px',
//                                                     }}
//                                                 >
//                                                     Planned
//                                                 </TableCell>
//                                                 <TableCell
//                                                     align="right"
//                                                     sx={{
//                                                         fontWeight: 'bold',
//                                                         color: maroonColor,
//                                                         fontSize: '0.95rem',
//                                                         padding: '20px 16px',
//                                                     }}
//                                                 >
//                                                     Actual
//                                                 </TableCell>
//                                                 <TableCell
//                                                     align="right"
//                                                     sx={{
//                                                         fontWeight: 'bold',
//                                                         color: maroonColor,
//                                                         fontSize: '0.95rem',
//                                                         padding: '20px 16px',
//                                                     }}
//                                                 >
//                                                     Spending %
//                                                 </TableCell>
//                                                 <TableCell
//                                                     align="right"
//                                                     sx={{
//                                                         fontWeight: 'bold',
//                                                         color: maroonColor,
//                                                         fontSize: '0.95rem',
//                                                         padding: '20px 16px',
//                                                     }}
//                                                 >
//                                                     Savings %
//                                                 </TableCell>
//                                                 <TableCell
//                                                     align="right"
//                                                     sx={{
//                                                         fontWeight: 'bold',
//                                                         color: maroonColor,
//                                                         fontSize: '0.95rem',
//                                                         padding: '20px 16px',
//                                                     }}
//                                                 >
//                                                     Savings Contribution
//                                                 </TableCell>
//                                             </StyledTableHeadRow>
//                                         </TableHead>
//                                         <TableBody>
//                                             {isLoading ? (
//                                                 <StyledTableRow>
//                                                     <TableCell colSpan={7}>
//                                                         <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
//                                                     </TableCell>
//                                                 </StyledTableRow>
//                                             ) : (
//                                                 ((): JSX.Element[] => {
//                                                     const categories: CategoryKey[] = ['Housing', 'Food', 'Transportation', 'Entertainment'];
//                                                     const rows: JSX.Element[] = [];
//
//                                                     weekDateRanges.forEach((weekRange, weekIndex) => {
//                                                         const weekKey = `week${weekIndex + 1}` as keyof BudgetData;
//                                                         const weekData = budgetData[weekKey];
//                                                         const isCollapsed = collapsedWeeks.has(weekIndex);
//                                                         const accountBalance = weekAccountBalances[weekKey];
//
//                                                         // Calculate week totals
//                                                         const weekTotalPlanned = categories.reduce(
//                                                             (sum, category) => sum + weekData[category].planned,
//                                                             0
//                                                         );
//                                                         const weekTotalEstimated = categories.reduce(
//                                                             (sum, category) => sum + weekData[category].estimated,
//                                                             0
//                                                         );
//                                                         const weekTotalSavingsContributed = categories.reduce(
//                                                             (sum, category) => sum + calculateSavingsContributed(weekData[category].remaining),
//                                                             0
//                                                         );
//                                                         const weekPercentageSaved = calculatePercentageSaved(
//                                                             weekTotalPlanned,
//                                                             weekTotalEstimated
//                                                         );
//                                                         const weekActualOverPlanned = calculateActualOverPlannedPercentage(
//                                                             weekTotalPlanned,
//                                                             weekTotalEstimated
//                                                         );
//
//                                                         // Week header row with collapse/expand functionality
//                                                         rows.push(
//                                                             <StyledTableRow
//                                                                 key={`${weekRange}-header`}
//                                                                 onClick={() => toggleWeekCollapse(weekIndex)}
//                                                             >
//                                                                 <TableCell
//                                                                     sx={{
//                                                                         fontWeight: 'bold',
//                                                                         color: maroonColor,
//                                                                         fontSize: '0.95rem',
//                                                                         display: 'flex',
//                                                                         alignItems: 'center',
//                                                                         gap: 1.5,
//                                                                         padding: '20px 16px',
//                                                                     }}
//                                                                 >
//                                                                     <Box
//                                                                         sx={{
//                                                                             display: 'flex',
//                                                                             alignItems: 'center',
//                                                                             p: 0.5,
//                                                                             borderRadius: '50%',
//                                                                             backgroundColor: primaryBlue,
//                                                                             color: 'white',
//                                                                         }}
//                                                                     >
//                                                                         {isCollapsed ? (
//                                                                             <ExpandMore sx={{ fontSize: '1.2rem' }} />
//                                                                         ) : (
//                                                                             <ExpandLess sx={{ fontSize: '1.2rem' }} />
//                                                                         )}
//                                                                     </Box>
//                                                                     {weekRange}
//                                                                 </TableCell>
//                                                                 <TableCell
//                                                                     sx={{
//                                                                         fontWeight: 500,
//                                                                         color: 'text.secondary',
//                                                                         fontSize: '0.875rem',
//                                                                         fontStyle: 'italic',
//                                                                         padding: '20px 16px',
//                                                                     }}
//                                                                 >
//                                                                     {isCollapsed ? 'Click to expand' : 'Click to collapse'}
//                                                                 </TableCell>
//                                                                 <TableCell
//                                                                     align="right"
//                                                                     sx={{
//                                                                         fontWeight: 'bold',
//                                                                         fontSize: '0.95rem',
//                                                                         padding: '20px 16px',
//                                                                     }}
//                                                                 >
//                                                                     ${weekTotalPlanned.toLocaleString('en-US', {
//                                                                     minimumFractionDigits: 2,
//                                                                     maximumFractionDigits: 2,
//                                                                 })}
//                                                                 </TableCell>
//                                                                 <TableCell
//                                                                     align="right"
//                                                                     sx={{
//                                                                         fontWeight: 'bold',
//                                                                         fontSize: '0.95rem',
//                                                                         padding: '20px 16px',
//                                                                     }}
//                                                                 >
//                                                                     ${weekTotalEstimated.toLocaleString('en-US', {
//                                                                     minimumFractionDigits: 2,
//                                                                     maximumFractionDigits: 2,
//                                                                 })}
//                                                                 </TableCell>
//                                                                 <TableCell
//                                                                     align="right"
//                                                                     sx={{
//                                                                         fontWeight: 'bold',
//                                                                         fontSize: '0.95rem',
//                                                                         padding: '20px 16px',
//                                                                     }}
//                                                                 >
//                                                                     {weekActualOverPlanned.toFixed(1)}%
//                                                                 </TableCell>
//                                                                 <TableCell
//                                                                     align="right"
//                                                                     sx={{
//                                                                         color: weekPercentageSaved >= 0 ? 'green' : 'red',
//                                                                         fontWeight: 'bold',
//                                                                         fontSize: '0.95rem',
//                                                                         padding: '20px 16px',
//                                                                     }}
//                                                                 >
//                                                                     {weekPercentageSaved >= 0 ? '+' : ''}{weekPercentageSaved.toFixed(1)}%
//                                                                 </TableCell>
//                                                                 <TableCell
//                                                                     align="right"
//                                                                     sx={{
//                                                                         color: weekTotalSavingsContributed >= 0 ? 'green' : 'red',
//                                                                         fontWeight: 'bold',
//                                                                         fontSize: '0.95rem',
//                                                                         padding: '20px 16px',
//                                                                     }}
//                                                                 >
//                                                                     ${Math.abs(weekTotalSavingsContributed).toLocaleString('en-US', {
//                                                                     minimumFractionDigits: 2,
//                                                                     maximumFractionDigits: 2,
//                                                                 })}
//                                                                     {weekTotalSavingsContributed >= 0 ? ' under' : ' over'}
//                                                                 </TableCell>
//                                                             </StyledTableRow>
//                                                         );
//
//                                                         // Category rows (only show if not collapsed)
//                                                         if (!isCollapsed) {
//                                                             categories.forEach((category) => {
//                                                                 const data = weekData[category];
//                                                                 const percentageSaved = calculatePercentageSaved(data.planned, data.estimated);
//                                                                 const savingsContributed = calculateSavingsContributed(data.remaining);
//                                                                 const actualOverPlanned = calculateActualOverPlannedPercentage(
//                                                                     data.planned,
//                                                                     data.estimated
//                                                                 );
//
//                                                                 rows.push(
//                                                                     <StyledTableRow key={`${weekRange}-${category}`}>
//                                                                         <TableCell sx={{ pl: 6, padding: '20px 16px' }} />
//                                                                         <TableCell
//                                                                             component="th"
//                                                                             scope="row"
//                                                                             sx={{
//                                                                                 fontWeight: 500,
//                                                                                 fontSize: '0.95rem',
//                                                                                 padding: '20px 16px',
//                                                                             }}
//                                                                         >
//                                                                             {category}
//                                                                         </TableCell>
//                                                                         <TableCell
//                                                                             align="right"
//                                                                             sx={{
//                                                                                 fontSize: '0.95rem',
//                                                                                 padding: '20px 16px',
//                                                                             }}
//                                                                         >
//                                                                             ${data.planned.toLocaleString('en-US', {
//                                                                             minimumFractionDigits: 2,
//                                                                             maximumFractionDigits: 2,
//                                                                         })}
//                                                                         </TableCell>
//                                                                         <TableCell
//                                                                             align="right"
//                                                                             sx={{
//                                                                                 fontSize: '0.95rem',
//                                                                                 padding: '20px 16px',
//                                                                             }}
//                                                                         >
//                                                                             ${data.estimated.toLocaleString('en-US', {
//                                                                             minimumFractionDigits: 2,
//                                                                             maximumFractionDigits: 2,
//                                                                         })}
//                                                                         </TableCell>
//                                                                         <TableCell
//                                                                             align="right"
//                                                                             sx={{
//                                                                                 fontSize: '0.95rem',
//                                                                                 padding: '20px 16px',
//                                                                             }}
//                                                                         >
//                                                                             {actualOverPlanned.toFixed(1)}%
//                                                                         </TableCell>
//                                                                         <TableCell
//                                                                             align="right"
//                                                                             sx={{
//                                                                                 color: percentageSaved >= 0 ? 'green' : 'red',
//                                                                                 fontWeight: 'bold',
//                                                                                 fontSize: '0.95rem',
//                                                                                 padding: '20px 16px',
//                                                                             }}
//                                                                         >
//                                                                             {percentageSaved >= 0 ? '+' : ''}{percentageSaved.toFixed(1)}%
//                                                                         </TableCell>
//                                                                         <TableCell
//                                                                             align="right"
//                                                                             sx={{
//                                                                                 color: savingsContributed >= 0 ? 'green' : 'red',
//                                                                                 fontWeight: 'bold',
//                                                                                 fontSize: '0.95rem',
//                                                                                 padding: '20px 16px',
//                                                                             }}
//                                                                         >
//                                                                             ${Math.abs(savingsContributed).toLocaleString('en-US', {
//                                                                             minimumFractionDigits: 2,
//                                                                             maximumFractionDigits: 2,
//                                                                         })}
//                                                                             {savingsContributed >= 0 ? ' under' : ' over'}
//                                                                         </TableCell>
//                                                                     </StyledTableRow>
//                                                                 );
//                                                             });
//
//                                                             // Account balance row
//                                                             rows.push(
//                                                                 <StyledTableRow key={`${weekRange}-balance`}>
//                                                                     <TableCell sx={{ pl: 6, padding: '20px 16px' }} />
//                                                                     <TableCell
//                                                                         sx={{
//                                                                             fontWeight: 'bold',
//                                                                             color: maroonColor,
//                                                                             fontSize: '0.95rem',
//                                                                             display: 'flex',
//                                                                             alignItems: 'center',
//                                                                             gap: 1,
//                                                                             padding: '20px 16px',
//                                                                         }}
//                                                                     >
//                                                                         <AccountBalance sx={{ fontSize: '1.1rem' }} />
//                                                                         Account Balance
//                                                                     </TableCell>
//                                                                     <TableCell
//                                                                         colSpan={5}
//                                                                         align="right"
//                                                                         sx={{
//                                                                             fontWeight: 'bold',
//                                                                             fontSize: '0.95rem',
//                                                                             padding: '20px 16px',
//                                                                         }}
//                                                                     >
//                                                                         ${accountBalance.toLocaleString('en-US', {
//                                                                         minimumFractionDigits: 2,
//                                                                         maximumFractionDigits: 2,
//                                                                     })}
//                                                                     </TableCell>
//                                                                 </StyledTableRow>
//                                                             );
//                                                         }
//                                                     });
//
//                                                     return rows;
//                                                 })()
//                                             )}
//                                         </TableBody>
//                                     </Table>
//                                 </StyledTableContainer>
//
//                                 {/* Monthly Totals Section */}
//                                 <Box sx={{ mt: 4 }}>
//                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//                                         <Typography
//                                             variant="h5"
//                                             component="h2"
//                                             sx={{
//                                                 fontWeight: 'bold',
//                                                 textAlign: 'left',
//                                                 color: 'text.primary',
//                                             }}
//                                         >
//                                             Monthly Totals
//                                         </Typography>
//                                         <Button
//                                             variant="contained"
//                                             sx={{
//                                                 backgroundColor: primaryBlue,
//                                                 color: 'white',
//                                                 borderRadius: '8px',
//                                                 '&:hover': { backgroundColor: '#1565c0' },
//                                             }}
//                                             onClick={() => setOpenDialog(true)}
//                                         >
//                                             Save as Template
//                                         </Button>
//                                     </Box>
//                                     <StyledTableContainer>
//                                         <Table sx={{ minWidth: 650 }}>
//                                             <TableHead>
//                                                 <StyledTableHeadRow>
//                                                     <TableCell
//                                                         sx={{
//                                                             fontWeight: 'bold',
//                                                             color: maroonColor,
//                                                             fontSize: '0.95rem',
//                                                             padding: '20px 16px',
//                                                         }}
//                                                     >
//                                                         Budget Goal
//                                                     </TableCell>
//                                                     <TableCell
//                                                         sx={{
//                                                             fontWeight: 'bold',
//                                                             color: maroonColor,
//                                                             fontSize: '0.95rem',
//                                                             padding: '20px 16px',
//                                                         }}
//                                                     >
//                                                         Total Planned
//                                                     </TableCell>
//                                                     <TableCell
//                                                         sx={{
//                                                             fontWeight: 'bold',
//                                                             color: maroonColor,
//                                                             fontSize: '0.95rem',
//                                                             padding: '20px 16px',
//                                                         }}
//                                                     >
//                                                         Total Spent
//                                                     </TableCell>
//                                                     <TableCell
//                                                         sx={{
//                                                             fontWeight: 'bold',
//                                                             color: maroonColor,
//                                                             fontSize: '0.95rem',
//                                                             padding: '20px 16px',
//                                                         }}
//                                                     >
//                                                         Savings %
//                                                     </TableCell>
//                                                     <TableCell
//                                                         sx={{
//                                                             fontWeight: 'bold',
//                                                             color: maroonColor,
//                                                             fontSize: '0.95rem',
//                                                             padding: '20px 16px',
//                                                         }}
//                                                     >
//                                                         Spent Over Budget %
//                                                     </TableCell>
//                                                 </StyledTableHeadRow>
//                                             </TableHead>
//                                             <TableBody>
//                                                 {isLoading ? (
//                                                     <StyledTableRow>
//                                                         <TableCell colSpan={5}>
//                                                             <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
//                                                         </TableCell>
//                                                     </StyledTableRow>
//                                                 ) : (
//                                                     <StyledTableRow>
//                                                         <TableCell
//                                                             sx={{
//                                                                 fontWeight: 500,
//                                                                 fontSize: '0.95rem',
//                                                                 padding: '20px 16px',
//                                                             }}
//                                                         >
//                                                             ${budgetGoal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                                                         </TableCell>
//                                                         <TableCell
//                                                             sx={{
//                                                                 fontWeight: 500,
//                                                                 fontSize: '0.95rem',
//                                                                 padding: '20px 16px',
//                                                             }}
//                                                         >
//                                                             ${totalPlanned.toLocaleString('en-US', {
//                                                             minimumFractionDigits: 2,
//                                                             maximumFractionDigits: 2,
//                                                         })}
//                                                         </TableCell>
//                                                         <TableCell
//                                                             sx={{
//                                                                 fontWeight: 500,
//                                                                 fontSize: '0.95rem',
//                                                                 padding: '20px 16px',
//                                                             }}
//                                                         >
//                                                             ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                                                         </TableCell>
//                                                         <TableCell
//                                                             sx={{
//                                                                 color: percentageSaved >= 0 ? 'green' : 'red',
//                                                                 fontWeight: 'bold',
//                                                                 fontSize: '0.95rem',
//                                                                 padding: '20px 16px',
//                                                             }}
//                                                         >
//                                                             {percentageSaved >= 0 ? '+' : ''}{percentageSaved.toFixed(1)}%
//                                                         </TableCell>
//                                                         <TableCell
//                                                             sx={{
//                                                                 color: spentOverBudgetPercentage > 0 ? 'red' : 'green',
//                                                                 fontWeight: 'bold',
//                                                                 fontSize: '0.95rem',
//                                                                 padding: '20px 16px',
//                                                             }}
//                                                         >
//                                                             {spentOverBudgetPercentage > 0 ? '+' : ''}{spentOverBudgetPercentage.toFixed(1)}%
//                                                         </TableCell>
//                                                     </StyledTableRow>
//                                                 )}
//                                             </TableBody>
//                                         </Table>
//                                     </StyledTableContainer>
//                                 </Box>
//                             </Card>
//                         </Grow>
//                     </Grid>
//                 </Grid>
//             </Container>
//         </Box>
//     );
// };
//
// export default BudgetPlanner;
