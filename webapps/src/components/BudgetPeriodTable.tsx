import React, {useEffect, useMemo, useState} from "react";
import {
    addDays,
    differenceInDays,
    endOfMonth,
    format,
    isSameDay,
    isValid,
    isWithinInterval,
    startOfMonth
} from 'date-fns';
import {
    Box,
    Button,
    ButtonGroup,
    IconButton,
    Paper,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    ToggleButtonGroup,
    ToggleButton,
    alpha,
    useTheme,
    Card,
    Grid,
    LinearProgress,
    Chip
} from '@mui/material';
import {styled} from "@mui/material/styles";
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import {BudgetRunnerResult} from "../services/BudgetRunnerService";
import {BudgetPeriodCategory, SubBudget} from "../utils/Items";
import BudgetPeriodService from "../services/BudgetPeriodService";
import {Period} from '../config/Types';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Table as TableIcon, BarChart3 } from 'lucide-react';
import BudgetCategoryCard from './BudgetCategoryCard';


interface BudgetCategory {
    name: string;
    monthlyBudget: number;
    monthlyActual: number;
}

interface Category {
    dateRange: {
        startDate: Array<number>;
        endDate: Array<number>;
    };
}

interface BudgetPeriodTableProps {
    isLoading: boolean;
    data: BudgetRunnerResult[];
}

type BudgetPeriod = 'Daily' | 'Weekly' | 'BiWeekly' | 'Monthly' | 'Custom';
type CustomFilterType = 'dates' | 'income';

interface ProcessedRow {
    name: string;
    budgeted: number;
    actual: number;
    remaining: number;
    startRange: Date;
    endRange: Date;
}

const dummyData: BudgetCategory[] = [
    { name: 'Housing', monthlyBudget: 1500, monthlyActual: 1450 },
    { name: 'Food', monthlyBudget: 500, monthlyActual: 480 },
    { name: 'Transportation', monthlyBudget: 300, monthlyActual: 310 },
    { name: 'Utilities', monthlyBudget: 200, monthlyActual: 190 },
    { name: 'Entertainment', monthlyBudget: 150, monthlyActual: 200 },
];

const PERIOD_MAPPING: Record<Exclude<BudgetPeriod, 'Custom'>, Period> = {
    'Daily': Period.DAILY,
    'Weekly': Period.WEEKLY,
    'BiWeekly': Period.BIWEEKLY,
    'Monthly': Period.MONTHLY
};

const maroonColor = '#800000';
const tealColor = '#0d9488';

const BudgetPeriodTable: React.FC<BudgetPeriodTableProps> = ({isLoading, data}) => {
    const theme = useTheme();
    const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriod>('Monthly');
    const [startDate, setStartDate] = useState(new Date());
    const [isClicked, setIsClicked] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [periodData, setPeriodData] = useState<BudgetPeriodCategory[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const budgetPeriodService = BudgetPeriodService.getInstance();
    const [expandedRanges, setExpandedRanges] = useState<Set<String>>(new Set());

    // NEW: Visual/Numeric toggle
    const [viewType, setViewType] = useState<'visual' | 'numeric'>('visual');

    // NEW: Custom date range
    const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
    const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

    // NEW: Custom filter type (dates or income)
    const [customFilterType, setCustomFilterType] = useState<CustomFilterType>('dates');

    const toggleRangeExpansion = (rangeKey: string) => {
        setExpandedRanges(prev => {
            const newSet = new Set(prev);
            if (newSet.has(rangeKey)) {
                newSet.delete(rangeKey);
            } else {
                newSet.add(rangeKey);
            }
            return newSet;
        });
    };

    const handleClick = () => {
        setIsClicked(true);
        setTimeout(() => setIsClicked(false), 300);
    };

    const fetchBudgetPeriodData = async (period: BudgetPeriod, subBudget: SubBudget) => {
        if (!selectedDate || !subBudget) return;

        setIsLoadingData(true);
        try {
            const userId : number = Number(sessionStorage.getItem('userId'));
            const currentDate = selectedDate;

            // Handle Custom period with different filter types
            if (period === 'Custom') {
                if (customFilterType === 'dates') {
                    if (!customStartDate || !customEndDate) {
                        setIsLoadingData(false);
                        return;
                    }
                    // TODO: Add custom range backend call when API is ready
                    setIsLoadingData(false);
                    return;
                } else if (customFilterType === 'income') {
                    // TODO: Add income period backend call when API is ready
                    setIsLoadingData(false);
                    return;
                }
            }

            // Type guard to ensure period is mappable
            if (period === 'Custom') {
                setIsLoadingData(false);
                return;
            }

            const mappedPeriod = PERIOD_MAPPING[period];

            const subBudgetStartDate = new Date(
                subBudget.startDate[0],
                subBudget.startDate[1] - 1,
                subBudget.startDate[2]
            );

            const subBudgetEndDate = new Date(
                subBudget.endDate[0],
                subBudget.endDate[1] - 1,
                subBudget.endDate[2]
            );

            const monthStartDate = format(subBudgetStartDate, 'yyyy-MM-dd');
            const monthEndDate = format(subBudgetEndDate, 'yyyy-MM-dd');

            switch (period) {
                case 'Daily':
                    const selectedDateFormatted = format(selectedDate, 'yyyy-MM-dd');
                    const dailyData = await getBudgetPeriodDataByPeriodSelection(
                        mappedPeriod,
                        userId,
                        monthStartDate,
                        monthEndDate,
                        selectedDateFormatted
                    );
                    setPeriodData(dailyData);
                    break;

                case 'Weekly':
                    const weeklyData = await getBudgetPeriodDataByPeriodSelection(
                        mappedPeriod,
                        userId,
                        monthStartDate,
                        monthEndDate,
                        ''
                    );
                    setPeriodData(weeklyData);
                    break;

                case 'BiWeekly':
                    const biWeeklyData = await getBudgetPeriodDataByPeriodSelection(
                        mappedPeriod,
                        userId,
                        monthStartDate,
                        monthEndDate,
                        ''
                    );
                    setPeriodData(biWeeklyData);
                    break;

                case 'Monthly':
                    const monthlyData = await getBudgetPeriodDataByPeriodSelection(
                        mappedPeriod,
                        userId,
                        monthStartDate,
                        monthEndDate,
                        ''
                    );
                    setPeriodData(monthlyData);
                    break;
            }
        } catch (error) {
            console.error('Error fetching budget period data:', error);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        if(data?.[0]?.subBudget){
            fetchBudgetPeriodData(budgetPeriod, data[0].subBudget);
        }
    }, [budgetPeriod, selectedDate, data?.[0]?.subBudget, customStartDate, customEndDate, customFilterType]);

    const handlePeriodChange = (newPeriod: BudgetPeriod) => {
        setBudgetPeriod(newPeriod);
    }

    const getBudgetPeriodDataByPeriodSelection = async (period: Period, userId: number, startDate: string, endDate: string, singleDate: string): Promise<BudgetPeriodCategory[]> => {
        switch (period) {
            case Period.WEEKLY:
                const weeklyBudgetPeriodCategories = await budgetPeriodService.getBudgetPeriodsByPeriod(userId, period, startDate, endDate);
                return weeklyBudgetPeriodCategories.budgetPeriodCategories;
            case Period.BIWEEKLY:
                console.log(`Getting BiWeekly budget period data for startdate: ${startDate} and endDate: ${endDate}`);
                const biWeeklyBudgetPeriodCategories = await budgetPeriodService.getBudgetPeriodsByPeriod(userId, period, startDate, endDate);
                console.log('BiWeekly Budget Period Categories: ', biWeeklyBudgetPeriodCategories.budgetPeriodCategories);
                return biWeeklyBudgetPeriodCategories.budgetPeriodCategories;
            case Period.MONTHLY:
                const monthlyBudgetPeriodCategories = await budgetPeriodService.getBudgetPeriodsByPeriod(userId, period, startDate, endDate);
                return monthlyBudgetPeriodCategories.budgetPeriodCategories;
            case Period.DAILY:
                const dateBudgetCategories = await budgetPeriodService.getDailyBudgetPeriodCategories(userId, singleDate);
                return dateBudgetCategories.budgetPeriodCategories;
            default:
                throw new Error('Invalid Period found');
        }
    }

    const processedData = useMemo(() => {
        if (!data?.length) return [];

        return data.flatMap((budgetResult) => {
            const categories = budgetResult.budgetCategoryStats?.budgetPeriodCategories || [];
            console.log("Categories: ", categories);

            return categories.map((category: BudgetPeriodCategory) => {
                const startDateArr = (category.dateRange.startDate as unknown) as number[];
                const endDateArr = (category.dateRange.endDate as unknown) as number[];
                const startDate = new Date(
                    Number(startDateArr[0]),
                    Number(startDateArr[1]) - 1,
                    Number(startDateArr[2])
                );
                console.log('Start Date: ', startDate);

                const endDate = new Date(
                    Number(endDateArr[0]),
                    Number(endDateArr[1]) - 1,
                    Number(endDateArr[2])
                );
                console.log('End Date: ', endDate);

                console.log("Processing category:", {
                    name: category.category,
                    startDate: format(startDate, 'yyyy-MM-dd'),
                    endDate: format(endDate, 'yyyy-MM-dd'),
                    budgeted: category.budgeted,
                    actual: category.actual,
                    remaining: category.remaining
                });

                return {
                    name: category.category,
                    budgeted: category.budgeted || 0,
                    actual: category.actual || 0,
                    remaining: category.remaining || 0,
                    startRange: startDate,
                    endRange: endDate
                };
            });
        });
    }, [data]);

    useEffect(() => {
        console.log("Final Processed Data:", processedData);
    }, [processedData]);

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

    const StyledButtonGroup = styled(ButtonGroup)(({ theme }) => ({
        '& .MuiButtonGroup-grouped': {
            border: `1px solid ${maroonColor}`,
            '&:not(:last-of-type)': {
                borderRight: `1px solid ${maroonColor}`,
            },
        },
    }));

    // NEW: Helper functions for visual view
    const getProgressColor = (actual: number, budgeted: number) => {
        if (budgeted === 0) return tealColor;
        const percentage = (actual / budgeted) * 100;
        if (percentage < 70) return tealColor;
        if (percentage < 90) return '#f59e0b';
        return '#dc2626';
    };

    const formatCurrency = (amount: number) => {
        return `$${Math.abs(amount).toFixed(2)}`;
    };

    // NEW: Render visual view with compact cards
    const renderVisualView = (categoriesForRange: BudgetPeriodCategory[], start?: Date, end?: Date) => {
        if (!categoriesForRange || categoriesForRange.length === 0) {
            return (
                <Box sx={{
                    textAlign: 'center',
                    py: 4,
                    px: 2,
                    background: alpha(theme.palette.divider, 0.02),
                    borderRadius: 2,
                    border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`
                }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        No budget categories found
                    </Typography>
                </Box>
            );
        }

        return (
            <Box sx={{ p: 1.5 }}>
                <Grid container spacing={1.5}>
                    {categoriesForRange.map((category, index) => (
                        <Grid item xs={12} sm={6} md={4} key={`${category.category}-${index}`}>
                            <BudgetCategoryCard
                                categoryName={category.category}
                                budgeted={category.budgeted || 0}
                                actual={category.actual || 0}
                                remaining={category.remaining || 0}
                                compact={true}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    };

    const getDateRanges = (subBudget: SubBudget) => {
        if (!periodData?.length || !selectedDate || !subBudget) return [];

        const uniqueRanges = new Map();

        const subBudgetStartDate = new Date(
            subBudget.startDate[0],
            subBudget.startDate[1] - 1,
            subBudget.startDate[2]
        );

        const subBudgetEndDate = new Date(
            subBudget.endDate[0],
            subBudget.endDate[1] - 1,
            subBudget.endDate[2]
        );

        console.log('periodData {}', periodData);
        periodData.forEach(category => {
            try {
                if (budgetPeriod === 'BiWeekly') {
                    if (!category?.biWeekRanges?.length) {
                        console.warn("No BiWeekly ranges found for category:", category);
                        return;
                    }

                    category.biWeekRanges.forEach(range => {
                        const startArr = (range.startDate as unknown) as number[];
                        const endArr = (range.endDate as unknown) as number[];

                        const startDate = new Date(
                            Number(startArr[0]),
                            Number(startArr[1]) - 1,
                            Number(startArr[2])
                        );

                        const endDate = new Date(
                            Number(endArr[0]),
                            Number(endArr[1]) - 1,
                            Number(endArr[2])
                        );

                        if (isWithinInterval(startDate, { start: subBudgetStartDate, end: subBudgetEndDate }) &&
                            isWithinInterval(endDate, { start: subBudgetStartDate, end: subBudgetEndDate })) {

                            const rangeKey = `${format(startDate, 'yyyy-MM-dd')}-${format(endDate, 'yyyy-MM-dd')}`;
                            if (!uniqueRanges.has(rangeKey)) {
                                uniqueRanges.set(rangeKey, [startDate, endDate]);
                            }
                        }
                    });
                } else {
                    if (!category?.dateRange?.startDate || !category?.dateRange?.endDate) {
                        console.warn("Invalid Date Range found: ", category);
                        return;
                    }

                    const startArr = (category.dateRange.startDate as unknown) as number[];
                    const endArr = (category.dateRange.endDate as unknown) as number[];

                    const startDate = new Date(
                        Number(startArr[0]),
                        Number(startArr[1]) - 1,
                        Number(startArr[2])
                    );

                    const endDate = new Date(
                        Number(endArr[0]),
                        Number(endArr[1]) - 1,
                        Number(endArr[2])
                    );

                    const rangeKey = `${format(startDate, 'yyyy-MM-dd')}-${format(endDate, 'yyyy-MM-dd')}`;
                    if (!uniqueRanges.has(rangeKey)) {
                        uniqueRanges.set(rangeKey, [startDate, endDate]);
                    }
                }
            } catch (error) {
                console.error('Error processing date range: ', error, category);
            }
        });

        const ranges = Array.from(uniqueRanges.values()).sort((a, b) => {
            return a[0].getTime() - b[0].getTime();
        });

        console.log('Ranges before filtering:', ranges.map(([start, end]) => ({
            start: format(start, 'yyyy-MM-dd'),
            end: format(end, 'yyyy-MM-dd'),
            daysDiff: differenceInDays(end, start)
        })));

        const filteredRanges = ranges.filter(([start, end]) => {
            switch (budgetPeriod) {
                case 'Daily':
                    return isSameDay(start, selectedDate);
                case 'Weekly':
                    return isWithinInterval(start, { start: subBudgetStartDate, end: subBudgetEndDate });
                case 'BiWeekly':
                    return isWithinInterval(start, { start: subBudgetStartDate, end: subBudgetEndDate });
                case 'Monthly':
                    return isWithinInterval(start, { start: subBudgetStartDate, end: subBudgetEndDate });
                case 'Custom':
                    return true;
                default:
                    return true;
            }
        });

        console.log('Filtered ranges for', budgetPeriod, ':', filteredRanges.map(([start, end]) => ({
            start: format(start, 'yyyy-MM-dd'),
            end: format(end, 'yyyy-MM-dd'),
            daysDiff: differenceInDays(end, start)
        })));

        return filteredRanges;
    };

    const isProcessedRow = (row: any): row is ProcessedRow => {
        return row
            && typeof row.name === 'string'
            && typeof row.budgeted === 'number'
            && typeof row.actual === 'number'
            && typeof row.remaining === 'number'
            && row.startRange instanceof Date
            && row.endRange instanceof Date;
    };

    if (isLoading) {
        return (
            <Box>
                <Typography variant="h5" component="h2" gutterBottom>
                    Budget Period Overview
                </Typography>
                <Box sx={{ mb: 2 }}>
                    <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
                </Box>
                <Skeleton variant="rectangular" height={400} />
            </Box>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box>
                {/* NEW: Header with Visual/Numeric Toggle */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" component="h2" sx={{
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        color: 'text.secondary'
                    }}>
                        Budget Period Overview
                    </Typography>

                    <ToggleButtonGroup
                        value={viewType}
                        exclusive
                        onChange={(e, newView) => newView && setViewType(newView)}
                        size="small"
                        sx={{
                            '& .MuiToggleButton-root': {
                                py: 0.5,
                                px: 2,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                                '&.Mui-selected': {
                                    bgcolor: alpha(maroonColor, 0.1),
                                    color: maroonColor,
                                    borderColor: alpha(maroonColor, 0.4),
                                    '&:hover': {
                                        bgcolor: alpha(maroonColor, 0.15)
                                    }
                                }
                            }
                        }}
                    >
                        <ToggleButton value="visual">
                            <BarChart3 size={14} style={{ marginRight: 6 }} /> Visual
                        </ToggleButton>
                        <ToggleButton value="numeric">
                            <TableIcon size={14} style={{ marginRight: 6 }} /> Numeric
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* Period Selection - Custom shows chip options below */}
                <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <StyledButtonGroup variant="outlined" aria-label="budget period toggle">
                            {['Daily', 'Weekly', 'BiWeekly', 'Monthly', 'Custom'].map((period) => (
                                <StyledButton
                                    key={period}
                                    onClick={() => setBudgetPeriod(period as BudgetPeriod)}
                                    variant={budgetPeriod === period ? 'contained' : 'outlined'}
                                >
                                    {period === 'BiWeekly' ? 'Bi-Weekly' : period}
                                </StyledButton>
                            ))}
                        </StyledButtonGroup>

                        <DatePicker
                            label="Select Date"
                            value={selectedDate}
                            onChange={(newValue: Date | null) => setSelectedDate(newValue)}
                            disabled={budgetPeriod !== 'Daily'}
                        />
                    </Box>

                    {/* NEW: Custom Filter Type Chips - Only show when Custom is selected */}
                    {budgetPeriod === 'Custom' && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mr: 1 }}>
                                Filter by:
                            </Typography>
                            <Chip
                                label="Custom Dates"
                                onClick={() => setCustomFilterType('dates')}
                                variant={customFilterType === 'dates' ? 'filled' : 'outlined'}
                                sx={{
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    ...(customFilterType === 'dates' && {
                                        bgcolor: alpha(maroonColor, 0.1),
                                        color: maroonColor,
                                        borderColor: alpha(maroonColor, 0.4),
                                        '&:hover': {
                                            bgcolor: alpha(maroonColor, 0.15)
                                        }
                                    })
                                }}
                            />
                            <Chip
                                label="By Income"
                                onClick={() => setCustomFilterType('income')}
                                variant={customFilterType === 'income' ? 'filled' : 'outlined'}
                                sx={{
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    ...(customFilterType === 'income' && {
                                        bgcolor: alpha(maroonColor, 0.1),
                                        color: maroonColor,
                                        borderColor: alpha(maroonColor, 0.4),
                                        '&:hover': {
                                            bgcolor: alpha(maroonColor, 0.15)
                                        }
                                    })
                                }}
                            />
                        </Box>
                    )}

                    {/* NEW: Custom Date Range Pickers - Only show when Custom + dates filter is selected */}
                    {budgetPeriod === 'Custom' && customFilterType === 'dates' && (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <DatePicker
                                label="Start Date"
                                value={customStartDate}
                                onChange={(newValue) => setCustomStartDate(newValue)}
                            />
                            <DatePicker
                                label="End Date"
                                value={customEndDate}
                                onChange={(newValue) => setCustomEndDate(newValue)}
                                minDate={customStartDate || undefined}
                            />
                        </Box>
                    )}
                </Box>

                <Paper sx={{
                    boxShadow: 3,
                    borderRadius: 4,
                    overflow: 'hidden',
                    transition: 'box-shadow 0.3s ease-in-out',
                    '&:hover': {
                        boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
                    }
                }}>
                    {/* Fixed Header Table - Only show in numeric view */}
                    {viewType === 'numeric' && (
                        <Table sx={{ tableLayout: 'fixed' }}>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: 'background.paper' }}>
                                    <TableCell sx={{
                                        fontWeight: 'bold',
                                        color: maroonColor,
                                        fontSize: '0.95rem',
                                        width: '40%'
                                    }}>
                                        Category
                                    </TableCell>
                                    <TableCell align="right" sx={{
                                        fontWeight: 'bold',
                                        color: maroonColor,
                                        fontSize: '0.95rem',
                                        width: '20%'
                                    }}>
                                        Budgeted
                                    </TableCell>
                                    <TableCell align="right" sx={{
                                        fontWeight: 'bold',
                                        color: maroonColor,
                                        fontSize: '0.95rem',
                                        width: '20%'
                                    }}>
                                        Actual
                                    </TableCell>
                                    <TableCell align="right" sx={{
                                        fontWeight: 'bold',
                                        color: maroonColor,
                                        fontSize: '0.95rem',
                                        width: '20%'
                                    }}>
                                        Remaining
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                        </Table>
                    )}

                    {/* Content Area */}
                    <Box>
                        {isLoadingData ? (
                            <Box sx={{ p: 2 }}>
                                <Skeleton variant="rectangular" height={100} />
                            </Box>
                        ) : !data?.[0]?.subBudget ? (
                            <Box sx={{ p: 4, textAlign: 'center', color: 'gray', fontStyle: 'italic' }}>
                                No budget data available.
                            </Box>
                        ) : (
                            (() => {
                                const subBudget = data[0].subBudget;
                                if (!subBudget) return null;

                                const dateRanges = getDateRanges(subBudget);

                                if (!dateRanges.length) {
                                    return (
                                        <Box sx={{ p: 4, textAlign: 'center', color: 'gray', fontStyle: 'italic' }}>
                                            No date ranges available for this period.
                                        </Box>
                                    );
                                }

                                return dateRanges.map(([start, end], rangeIndex) => {
                                    const rangeKey = `${format(start, 'yyyy-MM-dd')}-${format(end, 'yyyy-MM-dd')}`;
                                    const isExpanded = expandedRanges.has(rangeKey);
                                    const isLastRange = rangeIndex === dateRanges.length - 1;

                                    const categoriesForRange = periodData.filter(category => {
                                        if (budgetPeriod === 'BiWeekly' && category.biWeekRanges?.length) {
                                            return category.biWeekRanges.some(range => {
                                                const startArr = (range.startDate as unknown) as number[];
                                                const endArr = (range.endDate as unknown) as number[];

                                                const categoryStart = new Date(
                                                    Number(startArr[0]),
                                                    Number(startArr[1]) - 1,
                                                    Number(startArr[2])
                                                );
                                                const categoryEnd = new Date(
                                                    Number(endArr[0]),
                                                    Number(endArr[1]) - 1,
                                                    Number(endArr[2])
                                                );
                                                return isSameDay(categoryStart, start) && isSameDay(categoryEnd, end);
                                            });
                                        } else if (category.dateRange?.startDate && category.dateRange?.endDate) {
                                            const startArr = (category.dateRange.startDate as unknown) as number[];
                                            const endArr = (category.dateRange.endDate as unknown) as number[];

                                            const categoryStart = new Date(
                                                Number(startArr[0]),
                                                Number(startArr[1]) - 1,
                                                Number(startArr[2])
                                            );
                                            const categoryEnd = new Date(
                                                Number(endArr[0]),
                                                Number(endArr[1]) - 1,
                                                Number(endArr[2])
                                            );
                                            return isSameDay(categoryStart, start) && isSameDay(categoryEnd, end);
                                        }
                                        return false;
                                    });

                                    return (
                                        <Box key={`range-${rangeIndex}`} sx={{ mb: 0.5 }}>
                                            {/* Date Range Header */}
                                            <Box
                                                onClick={() => toggleRangeExpansion(rangeKey)}
                                                sx={{
                                                    cursor: 'pointer',
                                                    backgroundColor: 'white',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                    p: 2,
                                                    borderLeft: `4px solid ${maroonColor}`,
                                                    ...(isLastRange && !isExpanded && {
                                                        borderBottomLeftRadius: '16px',
                                                        borderBottomRightRadius: '16px',
                                                    }),
                                                    '&:hover': {
                                                        boxShadow: '0 2px 6px rgba(128, 0, 0, 0.15)',
                                                    }
                                                }}
                                            >
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <IconButton
                                                            size="small"
                                                            sx={{
                                                                color: maroonColor,
                                                                backgroundColor: 'rgba(128, 0, 0, 0.05)',
                                                                '&:hover': {
                                                                    backgroundColor: 'rgba(128, 0, 0, 0.1)',
                                                                }
                                                            }}
                                                        >
                                                            {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                                        </IconButton>
                                                        <Typography sx={{
                                                            color: maroonColor,
                                                            fontWeight: 600,
                                                            fontSize: '0.9rem'
                                                        }}>
                                                            {format(start, 'MMM dd')} - {format(end, 'MMM dd, yyyy')}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" sx={{
                                                        color: 'text.secondary',
                                                        backgroundColor: 'rgba(0,0,0,0.05)',
                                                        px: 1.5,
                                                        py: 0.5,
                                                        borderRadius: 1,
                                                        fontSize: '0.75rem'
                                                    }}>
                                                        {categoriesForRange.length}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Categories Section - Visual or Numeric based on toggle */}
                                            {isExpanded && (
                                                viewType === 'numeric' ? (
                                                    <Box sx={{
                                                        maxHeight: '330px',
                                                        overflowY: 'auto',
                                                        ...(isLastRange && {
                                                            borderBottomLeftRadius: '16px',
                                                            borderBottomRightRadius: '16px',
                                                        }),
                                                        '&::-webkit-scrollbar': {
                                                            width: '8px',
                                                        },
                                                        '&::-webkit-scrollbar-track': {
                                                            backgroundColor: 'rgba(0,0,0,0.05)',
                                                        },
                                                        '&::-webkit-scrollbar-thumb': {
                                                            backgroundColor: maroonColor,
                                                            borderRadius: '4px',
                                                            '&:hover': {
                                                                backgroundColor: '#600000',
                                                            },
                                                        },
                                                    }}>
                                                        <Table sx={{ tableLayout: 'fixed' }}>
                                                            <TableBody>
                                                                {categoriesForRange.length > 0 ? (
                                                                    categoriesForRange.map((category, categoryIndex) => (
                                                                        <TableRow
                                                                            key={`${rangeKey}-${category.category}-${categoryIndex}`}
                                                                            sx={{
                                                                                '&:hover': {
                                                                                    backgroundColor: 'rgba(128, 0, 0, 0.04)',
                                                                                }
                                                                            }}
                                                                        >
                                                                            <TableCell component="th" scope="row" sx={{ width: '40%' }}>
                                                                                {category.category}
                                                                            </TableCell>
                                                                            <TableCell align="right" sx={{ width: '20%' }}>
                                                                                ${(category.budgeted || 0).toFixed(2)}
                                                                            </TableCell>
                                                                            <TableCell align="right" sx={{ width: '20%' }}>
                                                                                ${(Math.abs(category.actual) || 0).toFixed(2)}
                                                                            </TableCell>
                                                                            <TableCell
                                                                                align="right"
                                                                                sx={{
                                                                                    width: '20%',
                                                                                    color: (category.remaining || 0) >= 0 ? 'green' : 'red',
                                                                                    fontWeight: 'bold'
                                                                                }}
                                                                            >
                                                                                ${Math.abs(category.remaining || 0).toFixed(2)}
                                                                                {(category.remaining || 0) >= 0 ? ' under' : ' over'}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))
                                                                ) : (
                                                                    <TableRow>
                                                                        <TableCell
                                                                            colSpan={4}
                                                                            align="center"
                                                                            sx={{ color: 'gray', fontStyle: 'italic', py: 2 }}
                                                                        >
                                                                            No categories available for this range.
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )}
                                                            </TableBody>
                                                        </Table>
                                                    </Box>
                                                ) : (
                                                    renderVisualView(categoriesForRange, start, end)
                                                )
                                            )}
                                        </Box>
                                    );
                                });
                            })()
                        )}
                    </Box>
                </Paper>
            </Box>
        </LocalizationProvider>
    );
}

export default BudgetPeriodTable;