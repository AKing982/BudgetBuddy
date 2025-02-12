import React, {useEffect, useMemo, useState} from "react";
import {
    format,
    addDays,
    addWeeks,
    addMonths,
    startOfMonth,
    endOfMonth,
    isWithinInterval,
    isSameDay,
    parseISO, differenceInDays, isValid, isAfter, isBefore
} from 'date-fns';
import {
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    ButtonGroup,
    Box,
    TextField, Skeleton
} from '@mui/material';
import {styled} from "@mui/material/styles";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {BudgetRunnerResult} from "../services/BudgetRunnerService";
import {BudgetCategoryStats, BudgetScheduleRange} from "../utils/Items";



interface BudgetCategory {
    name: string;
    monthlyBudget: number;
    monthlyActual: number;
}



interface BudgetPeriodTableProps {
    isLoading: boolean;
    data: BudgetRunnerResult[];
}


type BudgetPeriod = 'Daily' | 'Weekly' | 'BiWeekly' | 'Monthly';

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

const CustomButton = styled(Button)(({ theme }) => ({
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: '8px',
    padding: '10px 16px',
    transition: 'all 0.3s ease',
    backgroundColor: theme.palette.error.main, // Maroon color
    color: theme.palette.common.white,
    '&:hover': {
        backgroundColor: theme.palette.error.dark,
    },
    '&.clicked': {
        backgroundColor: theme.palette.common.white,
        color: theme.palette.error.main,
        border: `1px solid ${theme.palette.error.main}`,
    },
}));

const BudgetPeriodTable: React.FC<BudgetPeriodTableProps> = ({isLoading, data}) => {
    const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriod>('Monthly');
    const [startDate, setStartDate] = useState(new Date());
    const [isClicked, setIsClicked] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    const handleClick = () => {
        setIsClicked(true);
        // Add your logic here for what should happen when the button is clicked
        setTimeout(() => setIsClicked(false), 300); // Reset after 300ms for visual feedback
    };


    const getEndDate = () => {
        switch(budgetPeriod){
            case 'Daily':
                return startDate;
            case 'Weekly':
                return addDays(startDate, 6);
            case 'BiWeekly':
                return addDays(startDate, 13);
            case 'Monthly':
                return addMonths(startDate, 1);
            default:
                return startDate;
        }
    }

    const formatDateRange = (start: Date, end: Date) => {
        return `${format(start, 'MM/dd/yy')} - ${format(end, 'MM/dd/yy')}`;
    };


    // const processedData = useMemo(() => {
    //     if (!data?.length) return [];
    //
    //     const allCategories = data.flatMap(budget =>
    //         budget.budgetPeriodCategories?.map(category => ({
    //             name: category.category,
    //             budgeted: category.budgeted || 0,
    //             actual: category.actual || 0,
    //             remaining: category.remaining
    //         })) || []
    //     );
    //
    //
    //     console.log('All Categories: ', allCategories);
    //
    //     // Group by category name and sum amounts
    //     // return Object.values(
    //     //     allCategories.reduce((acc, curr) => {
    //     //         if (!acc[curr.name]) {
    //     //             acc[curr.name] = { ...curr };
    //     //         } else {
    //     //             acc[curr.name].budgetedAmount += curr.budgetedAmount;
    //     //             acc[curr.name].actualAmount += curr.actualAmount;
    //     //             acc[curr.name].remaining += curr.remaining;
    //     //         }
    //     //         return acc;
    //     //     }, {} as Record<string, any>)
    //     // );
    //     // return data.flatMap((budget) =>
    //     //     budget.budgetSchedule?.budgetScheduleRanges?.flatMap((range) => {
    //     //         const categories = [
    //     //             ...(budget.expenseCategories|| []),
    //     //             ...(budget.savingsCategories|| []),
    //     //             ...(budget.incomeCategories|| [])
    //     //         ];
    //     //
    //     //         return categories.map(category => ({
    //     //             name: category.categoryName || category.name,
    //     //             budgetedAmount: category.budgetedAmount || 0,
    //     //             actualAmount: category.actualAmount || 0,
    //     //             remaining: category.remaining || 0,
    //     //             startRange: range.startRange,
    //     //             endRange: range.endRange
    //     //         }));
    //     //     }) || []
    //
    //     return data.flatMap(budget => {
    //         const categories = [
    //             ...(budget.budgetPeriodCategories || []),
    //             ...(budget.expenseCategories || []),
    //             ...(budget.savingsCategories || []),
    //             ...(budget.incomeCategories || [])
    //         ];
    //
    //         // Extract budgetScheduleRanges
    //         const scheduleRanges = budget.budgetSchedule?.budgetScheduleRanges || [];
    //
    //         return scheduleRanges.flatMap(range => {
    //             const startRange = range.startRange
    //                 ? new Date(Number(range.startRange[0]), Number(range.startRange[1]) - 1, Number(range.startRange[2]))
    //                 : null;
    //
    //             const endRange = range.endRange
    //                 ? new Date(Number(range.endRange[0]), Number(range.endRange[1]) - 1, Number(range.endRange[2]))
    //                 : null;
    //
    //             return categories.map(category => ({
    //                 name: category.category || "Uncategorized",
    //                 budgetedAmount: category.budgeted || 0,
    //                 actualAmount: category.actual || 0,
    //                 remaining: category.remaining || 0,
    //                 startRange,
    //                 endRange
    //             }));
    //         });
    //     });
    // }, [data]);

    // const processedData = useMemo(() => {
    //     if (!data?.length) return [];
    //
    //     return data.flatMap(budget => {
    //         console.log('BudgetPeriodCategories: ', budget.budgetPeriodCategories);
    //         const categories = [
    //             ...(budget.budgetPeriodCategories || []),
    //             ...(budget.expenseCategories || []),
    //             ...(budget.savingsCategories || []),
    //             ...(budget.incomeCategories || [])
    //         ];
    //         console.log('Categories: ', categories);
    //
    //         // Extract budgetScheduleRanges
    //         const scheduleRanges = budget.budgetSchedule?.budgetScheduleRanges || [];
    //
    //         return categories.flatMap(category => {
    //             const categoryStartRange = category.dateRange?.startDate
    //                 ? new Date(category.dateRange.startDate[0], category.dateRange.startDate[1] - 1, category.dateRange.startDate[2])
    //                 : null;
    //             console.log('Category Start Range: ', categoryStartRange);
    //
    //             const categoryEndRange = category.dateRange?.endDate
    //                 ? new Date(category.dateRange.endDate[0], category.dateRange.endDate[1] - 1, category.dateRange.endDate[2])
    //                 : null;
    //             console.log('Category End Range: ', categoryEndRange);
    //
    //             return scheduleRanges.map(range => {
    //                 const startRange = range.startRange
    //                     ? new Date(range.startRange)
    //                     : categoryStartRange; // Fallback to category's date range
    //
    //                 const endRange = range.endRange
    //                     ? new Date(range.endRange)
    //                     : categoryEndRange; // Fallback to category's date range
    //
    //                 return {
    //                     name: category.category || "Uncategorized",
    //                     budgeted: category.budgeted || 0,
    //                     actual: category.actual || 0,
    //                     remaining: category.remaining || 0,
    //                     startRange,
    //                     endRange
    //                 };
    //             });
    //         });
    //     });
    // }, [data]);

    // const processedData = useMemo(() => {
    //     if (!data?.length) return [];
    //
    //     return data.flatMap((budgetResult) => {
    //         // Add type checking for budgetCategoryStats
    //         if (!Array.isArray(budgetResult.budgetCategoryStats)) {
    //             return [];
    //         }
    //
    //         const categories = budgetResult.budgetCategoryStats.flatMap(
    //             (stat) => Array.isArray(stat.budgetPeriodCategories)
    //                 ? stat.budgetPeriodCategories
    //                 : []
    //         );
    //         console.log('Budget Period Categories:', categories);
    //
    //         // Extract schedule ranges from the budgetSchedule
    //         const scheduleRanges = budgetResult.budgetSchedule?.budgetScheduleRanges || [];
    //         console.log('Schedule Ranges:', scheduleRanges);
    //
    //         if (!scheduleRanges.length) {
    //             return [];
    //         }
    //
    //         return categories.flatMap((category) => {
    //             // Convert the category dateRange from an array [year, month, day] to Date objects
    //             const catDR = category.dateRange;
    //             const categoryStartRange =
    //                 catDR && Array.isArray(catDR.startDate)
    //                     ? new Date(
    //                         Number(catDR.startDate[0]),
    //                         Number(catDR.startDate[1]) - 1,
    //                         Number(catDR.startDate[2])
    //                     )
    //                     : null;
    //             console.log('Category Start Range:', categoryStartRange);
    //
    //             const categoryEndRange =
    //                 catDR && Array.isArray(catDR.endDate)
    //                     ? new Date(
    //                         Number(catDR.endDate[0]),
    //                         Number(catDR.endDate[1]) - 1,
    //                         Number(catDR.endDate[2])
    //                     )
    //                     : null;
    //             console.log('Category End Range:', categoryEndRange);
    //
    //             // For each schedule range, create an object combining the category data with the schedule range
    //             return scheduleRanges.map((range) => {
    //                 // Ensure range.startRange and range.endRange are valid dates
    //                 const startRange = range.startRange
    //                     ? new Date(range.startRange)
    //                     : categoryStartRange; // Fallback to category's date range
    //                 const endRange = range.endRange
    //                     ? new Date(range.endRange)
    //                     : categoryEndRange; // Fallback to category's date range
    //
    //                 if (!startRange || !endRange || !isValid(startRange) || !isValid(endRange)) {
    //                     return null;
    //                 }
    //
    //                 console.log('Mapping category:', category, 'with range:', {
    //                     startRange,
    //                     endRange
    //                 });
    //
    //                 return {
    //                     name: category.category || "Uncategorized",
    //                     budgeted: category.budgeted || 0,
    //                     actual: category.actual || 0,
    //                     remaining: category.remaining || 0,
    //                     startRange,
    //                     endRange
    //                 };
    //             }).filter(Boolean); // Remove any null entries
    //         });
    //     });
    // }, [data]);
    //
    //
    // useEffect(() => {
    //     console.log("Processed Data:", processedData);
    // }, [processedData]);

    // const processedData = useMemo(() => {
    //     if (!data?.length) return [];
    //
    //     console.log("Initial data:", data);
    //
    //     return data.flatMap((budgetResult) => {
    //         console.log("Processing budget result:", budgetResult);
    //
    //         // Since budgetCategoryStats is an array, get the first item if it exists
    //         const categoryStats = budgetResult.budgetCategoryStats[0] as BudgetCategoryStats;
    //         if (!categoryStats) {
    //             console.log("No category stats found");
    //             return [];
    //         }
    //
    //         const allCategories = categoryStats.budgetPeriodCategories;
    //         console.log("All Categories:", allCategories);
    //
    //         // Get schedule ranges for reference
    //         const scheduleRanges = budgetResult.budgetSchedule?.budgetScheduleRanges || [];
    //         console.log("Schedule Ranges:", scheduleRanges);
    //
    //         // Map categories to schedule ranges where they overlap
    //         return scheduleRanges.flatMap((range: BudgetScheduleRange) => {
    //             const scheduleStart = new Date(Number(range.startRange[0]), Number(range.startRange[1]) - 1, Number(range.startRange[2]));
    //             const scheduleEnd = new Date(Number(range.endRange[0]), Number(range.endRange[1]) - 1, Number(range.endRange[2]));
    //
    //             console.log("Processing range:", {
    //                 scheduleStart: format(scheduleStart, 'yyyy-MM-dd'),
    //                 scheduleEnd: format(scheduleEnd, 'yyyy-MM-dd')
    //             });
    //
    //             // Filter categories that overlap with this schedule range
    //             const overlappingCategories = allCategories.filter(category => {
    //                 if (!category.dateRange?.startDate || !category.dateRange?.endDate) {
    //                     console.log("Category missing date range:", category);
    //                     return false;
    //                 }
    //
    //                 const catStart = new Date(
    //                     Number(category.dateRange.startDate[0]),
    //                     Number(category.dateRange.startDate[1]) - 1,
    //                     Number(category.dateRange.startDate[2])
    //                 );
    //                 const catEnd = new Date(
    //                     Number(category.dateRange.endDate[0]),
    //                     Number(category.dateRange.endDate[1]) - 1,
    //                     Number(category.dateRange.endDate[2])
    //                 );
    //
    //                 console.log("Comparing dates:", {
    //                     categoryName: category.category,
    //                     catStart: format(catStart, 'yyyy-MM-dd'),
    //                     catEnd: format(catEnd, 'yyyy-MM-dd'),
    //                     scheduleStart: format(scheduleStart, 'yyyy-MM-dd'),
    //                     scheduleEnd: format(scheduleEnd, 'yyyy-MM-dd')
    //                 });
    //
    //                 // Check if the dates overlap
    //                 const isOverlapping = isSameDay(catStart, scheduleStart) && isSameDay(catEnd, scheduleEnd);
    //                 if (isOverlapping) {
    //                     console.log("Found overlapping category:", category.category);
    //                 }
    //                 return isOverlapping;
    //             });
    //
    //             console.log("Overlapping categories for range:", overlappingCategories);
    //
    //             return overlappingCategories.map(category => ({
    //                 name: category.category,
    //                 budgeted: category.budgeted || 0,
    //                 actual: category.actual || 0,
    //                 remaining: category.remaining || 0,
    //                 startRange: scheduleStart,
    //                 endRange: scheduleEnd
    //             }));
    //         });
    //     });
    // }, [data]);
    //


    const processedData = useMemo(() => {
        if (!data?.length) return [];

        return data.flatMap((budgetResult) => {
            // Get categories from budgetCategoryStats
            const categories = budgetResult.budgetCategoryStats?.budgetPeriodCategories || [];
            console.log("Categories: ", categories);

            // No need to do additional filtering - each category already has its date range
            return categories.map(category => {
                const startDate = new Date(
                    Number(category.dateRange.startDate[0]),
                    Number(category.dateRange.startDate[1]) - 1,
                    Number(category.dateRange.startDate[2])
                );
                console.log('Start Date: ', startDate);

                const endDate = new Date(
                    Number(category.dateRange.endDate[0]),
                    Number(category.dateRange.endDate[1]) - 1,
                    Number(category.dateRange.endDate[2])
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


    const maroonColor = '#800000'; // You can adjust this to match your exact maroon shade

    const StyledButton = styled(Button)(({ theme }) => ({
        textTransform: 'none',
        fontWeight: 600,
        padding: '8px 16px',
        borderRadius: '8px',
        transition: 'all 0.3s ease',
        color: maroonColor,
        borderColor: maroonColor,
        '&:hover': {
            backgroundColor: 'rgba(128, 0, 0, 0.04)', // Light maroon background on hover
            borderColor: maroonColor,
        },
        '&.Mui-selected, &.MuiButton-contained': {
            backgroundColor: maroonColor,
            color: 'white',
            '&:hover': {
                backgroundColor: '#600000', // Darker maroon on hover for selected state
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

    const getDateRanges = () => {
        if (!selectedDate || !data?.length) return [];

        const budget = data[0];
        if (!budget?.budgetSchedule?.budgetScheduleRanges) {
            console.log("No budget schedule ranges found");
            return [];
        }

        const ranges = budget.budgetSchedule.budgetScheduleRanges.map(range => {
            const startRange = new Date(
                Number(range.startRange[0]),
                Number(range.startRange[1]) - 1,  // Convert to 0-based month
                Number(range.startRange[2])
            );
            const endRange = new Date(
                Number(range.endRange[0]),
                Number(range.endRange[1]) - 1,  // Convert to 0-based month
                Number(range.endRange[2])
            );

            return [startRange, endRange];
        });

        // Filter ranges based on budgetPeriod
        return ranges.filter(([start, end]) => {
            const daysDiff = differenceInDays(end, start);
            switch (budgetPeriod) {
                case 'Daily':
                    return isSameDay(start, selectedDate);
                case 'Weekly':
                    return daysDiff === 6;
                case 'BiWeekly':
                    return daysDiff === 13;
                case 'Monthly':
                    return true; // Show all ranges for monthly view
                default:
                    return true;
            }
        });
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
                <Typography variant="h5" component="h2" gutterBottom sx={{
                    fontWeight: 'bold',
                    mb: 2,
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    color: 'text.secondary'
                }}>
                    Budget Period Overview
                </Typography>

                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <StyledButtonGroup variant="outlined" aria-label="budget period toggle">
                        {['Daily', 'Weekly', 'BiWeekly', 'Monthly'].map((period) => (
                            <StyledButton
                                key={period}
                                onClick={() => setBudgetPeriod(period as BudgetPeriod)}
                                variant={budgetPeriod === period ? 'contained' : 'outlined'}
                            >
                                {period}
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

                <TableContainer component={Paper} sx={{
                    boxShadow: 3,
                    borderRadius: 4,
                    overflow: 'hidden',
                    transition: 'box-shadow 0.3s ease-in-out',
                    '&:hover': {
                        boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
                    }
                }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{backgroundColor: 'background.paper'}}>
                                <TableCell sx={{
                                    fontWeight: 'bold',
                                    color: maroonColor,
                                    fontSize: '0.95rem'
                                }}>Category</TableCell>
                                <TableCell align="right" sx={{
                                    fontWeight: 'bold',
                                    color: maroonColor,
                                    fontSize: '0.95rem'
                                }}>Budgeted</TableCell>
                                <TableCell align="right" sx={{
                                    fontWeight: 'bold',
                                    color: maroonColor,
                                    fontSize: '0.95rem'
                                }}>Actual</TableCell>
                                <TableCell align="right" sx={{
                                    fontWeight: 'bold',
                                    color: maroonColor,
                                    fontSize: '0.95rem'
                                }}>Remaining</TableCell>
                            </TableRow>
                        </TableHead>

                        {/*<TableBody>*/}
                        {/*    {getDateRanges().map(([start, end], index) => {*/}
                        {/*        const periodData = processedData.filter(*/}
                        {/*            (row) =>*/}
                        {/*                row.startRange &&*/}
                        {/*                row.endRange &&*/}
                        {/*                row.startRange.getTime() === start.getTime() &&*/}
                        {/*                row.endRange.getTime() === end.getTime()*/}
                        {/*        );*/}

                        {/*        return (*/}
                        {/*            <React.Fragment key={index}>*/}
                        {/*                <TableRow>*/}
                        {/*                    <TableCell colSpan={4} sx={{*/}
                        {/*                        fontWeight: 'bold',*/}
                        {/*                        color: maroonColor,*/}
                        {/*                        fontSize: '1rem',*/}
                        {/*                        backgroundColor: 'rgba(128, 0, 0, 0.1)'*/}
                        {/*                    }}>*/}
                        {/*                        {format(start, 'MM/dd/yy')} - {format(end, 'MM/dd/yy')}*/}
                        {/*                    </TableCell>*/}
                        {/*                </TableRow>*/}

                        {/*                {periodData.length ? (*/}
                        {/*                    periodData.map((row) => (*/}
                        {/*                        <TableRow key={`${index}-${row.name}`}>*/}
                        {/*                            <TableCell component="th" scope="row">{row.name}</TableCell>*/}
                        {/*                            <TableCell align="right">${row.budgeted}</TableCell>*/}
                        {/*                            <TableCell align="right">${row.actual.toFixed(2)}</TableCell>*/}
                        {/*                            <TableCell align="right" sx={{ color: row.remaining >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>*/}
                        {/*                                ${Math.abs(row.remaining).toFixed(2)}*/}
                        {/*                                {row.remaining >= 0 ? ' under' : ' over'}*/}
                        {/*                            </TableCell>*/}
                        {/*                        </TableRow>*/}
                        {/*                    ))*/}
                        {/*                ) : (*/}
                        {/*                    <TableRow>*/}
                        {/*                        <TableCell colSpan={4} align="center" sx={{ color: 'gray', fontStyle: 'italic' }}>*/}
                        {/*                            No categories available for this range.*/}
                        {/*                        </TableCell>*/}
                        {/*                    </TableRow>*/}
                        {/*                )}*/}
                        {/*            </React.Fragment>*/}
                        {/*        );*/}
                        {/*    })}*/}

                        {/*</TableBody>*/}
                        <TableBody>
                            {getDateRanges().map(([start, end], index) => {
                                console.log("🛠️ Checking data for range:", format(start, "MM/dd/yy"), "-", format(end, "MM/dd/yy"));

                                if (!start || !end || !isValid(start) || !isValid(end)) {
                                    console.warn("Invalid date range received:", { start, end });
                                    return null;
                                }

                                console.log("🛠️ Checking data for range:", format(start, "MM/dd/yy"), "-", format(end, "MM/dd/yy"));

                                const periodData = processedData.filter((row): row is ProcessedRow => {
                                    if (!isProcessedRow(row)) return false;
                                    return isSameDay(row.startRange, start) && isSameDay(row.endRange, end);
                                });

                                console.log("🔍 Matching Categories for this range:", periodData);

                                return (
                                    <React.Fragment key={index}>
                                        <TableRow>
                                            <TableCell colSpan={4} sx={{
                                                fontWeight: 'bold',
                                                color: maroonColor,
                                                fontSize: '1rem',
                                                backgroundColor: 'rgba(128, 0, 0, 0.1)'
                                            }}>
                                                {format(start, 'MM/dd/yy')} - {format(end, 'MM/dd/yy')}
                                            </TableCell>
                                        </TableRow>
                                        {periodData.length > 0 ? (
                                            periodData.map((row, rowIndex) => (
                                                <TableRow key={`${format(start, 'yyyy-MM-dd')}-${row.name}-${rowIndex}`}>
                                                    <TableCell component="th" scope="row">
                                                        {row.name || 'Unnamed Category'}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        ${(row.budgeted || 0).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        ${(row.actual || 0).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell
                                                        align="right"
                                                        sx={{
                                                            color: (row.remaining || 0) >= 0 ? 'green' : 'red',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        ${Math.abs(row.remaining || 0).toFixed(2)}
                                                        {(row.remaining || 0) >= 0 ? ' under' : ' over'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    align="center"
                                                    sx={{ color: 'gray', fontStyle: 'italic' }}
                                                >
                                                    No categories available for this range.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                );
                            }).filter(Boolean)}
                        </TableBody>

                    </Table>
                </TableContainer>
            </Box>
        </LocalizationProvider>
    );

}

export default BudgetPeriodTable;