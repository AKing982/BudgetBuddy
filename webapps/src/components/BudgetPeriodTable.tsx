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
    ButtonGroup, IconButton,
    Paper,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
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


interface BudgetCategory {
    name: string;
    monthlyBudget: number;
    monthlyActual: number;
}

interface Category {
    dateRange: {
        startDate: Array<number>;  // or [number, number, number] if you want to be more specific
        endDate: Array<number>;    // or [number, number, number]
    };
    // ... other category properties
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

const PERIOD_MAPPING: Record<BudgetPeriod, Period> = {
    'Daily': Period.DAILY,
    'Weekly': Period.WEEKLY,
    'BiWeekly': Period.BIWEEKLY,
    'Monthly': Period.MONTHLY
};


const BudgetPeriodTable: React.FC<BudgetPeriodTableProps> = ({isLoading, data}) => {
    const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriod>('Monthly');
    const [startDate, setStartDate] = useState(new Date());
    const [isClicked, setIsClicked] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [periodData, setPeriodData] = useState<BudgetPeriodCategory[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const budgetPeriodService = BudgetPeriodService.getInstance();
    const [expandedRanges, setExpandedRanges] = useState<Set<String>>(new Set());

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
        // Add your logic here for what should happen when the button is clicked
        setTimeout(() => setIsClicked(false), 300); // Reset after 300ms for visual feedback
    };


    const fetchBudgetPeriodData = async (period: BudgetPeriod, subBudget: SubBudget) => {
        if (!selectedDate || !subBudget) return;

        setIsLoadingData(true);
        try {
            const userId : number = Number(sessionStorage.getItem('userId'));
            const currentDate = selectedDate;
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


            // Format dates based on the selected period
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
            // Handle error appropriately (e.g., show error message to user)
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        if(data?.[0]?.subBudget){
            fetchBudgetPeriodData(budgetPeriod, data[0].subBudget);
        }
    }, [budgetPeriod, selectedDate, data?.[0]?.subBudget]);

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
            // Get categories from budgetCategoryStats
            const categories = budgetResult.budgetCategoryStats?.budgetPeriodCategories || [];
            console.log("Categories: ", categories);

            // No need to do additional filtering - each category already has its date range
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

    const getDateRanges = (subBudget: SubBudget) => {
        if (!periodData?.length || !selectedDate || !subBudget) return [];

        // Get unique date ranges from periodData
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

        periodData.forEach(category => {
            try {
                if (budgetPeriod === 'BiWeekly') {
                    if (!category?.biWeekRanges?.length) {
                        console.warn("No BiWeekly ranges found for category:", category);
                        return;
                    }

                    category.biWeekRanges.forEach(range => {
                        // Type assert the range arrays
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

                    // Type assert the date range arrays
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

        // Convert Map values to array and sort by start date
        const ranges = Array.from(uniqueRanges.values()).sort((a, b) => {
            return a[0].getTime() - b[0].getTime();
        });

        console.log('Ranges before filtering:', ranges.map(([start, end]) => ({
            start: format(start, 'yyyy-MM-dd'),
            end: format(end, 'yyyy-MM-dd'),
            daysDiff: differenceInDays(end, start)
        })));

        const monthStart = startOfMonth(selectedDate);
        const monthEnd = endOfMonth(selectedDate);

        // Filter ranges based on budgetPeriod
        const filteredRanges = ranges.filter(([start, end]) => {
            const daysDiff = differenceInDays(end, start);

            switch (budgetPeriod) {
                case 'Daily':
                    return isSameDay(start, selectedDate);
                case 'Weekly':
                    return daysDiff === 6;
                case 'BiWeekly':
                    return daysDiff === 13; // BiWeekly ranges should be exactly 13 days based on the data
                case 'Monthly':
                    // return isWithinInterval(start, {
                    //     start: monthStart,
                    //     end: monthEnd
                    // });
                    return isWithinInterval(start, { start: subBudgetStartDate, end: subBudgetEndDate });
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

    // return (
    //     <LocalizationProvider dateAdapter={AdapterDateFns}>
    //         <Box>
    //             <Typography variant="h5" component="h2" gutterBottom sx={{
    //                 fontWeight: 'bold',
    //                 mb: 2,
    //                 textAlign: 'left',
    //                 fontSize: '0.875rem',
    //                 color: 'text.secondary'
    //             }}>
    //                 Budget Period Overview
    //             </Typography>
    //
    //             <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    //                 <StyledButtonGroup variant="outlined" aria-label="budget period toggle">
    //                     {['Daily', 'Weekly', 'BiWeekly', 'Monthly'].map((period) => (
    //                         <StyledButton
    //                             key={period}
    //                             onClick={() => setBudgetPeriod(period as BudgetPeriod)}
    //                             variant={budgetPeriod === period ? 'contained' : 'outlined'}
    //                         >
    //                             {period}
    //                         </StyledButton>
    //                     ))}
    //                 </StyledButtonGroup>
    //
    //                 <DatePicker
    //                     label="Select Date"
    //                     value={selectedDate}
    //                     onChange={(newValue: Date | null) => setSelectedDate(newValue)}
    //                     disabled={budgetPeriod !== 'Daily'}
    //                 />
    //             </Box>
    //
    //             <TableContainer component={Paper} sx={{
    //                 boxShadow: 3,
    //                 borderRadius: 4,
    //                 maxHeight: '600px',
    //                 transition: 'box-shadow 0.3s ease-in-out',
    //                 '&:hover': {
    //                     boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
    //                 }
    //             }}>
    //                 <Table>
    //                     <TableHead>
    //                         <TableRow sx={{backgroundColor: 'background.paper'}}>
    //                             <TableCell sx={{
    //                                 fontWeight: 'bold',
    //                                 color: maroonColor,
    //                                 fontSize: '0.95rem'
    //                             }}>Category</TableCell>
    //                             <TableCell align="right" sx={{
    //                                 fontWeight: 'bold',
    //                                 color: maroonColor,
    //                                 fontSize: '0.95rem'
    //                             }}>Budgeted</TableCell>
    //                             <TableCell align="right" sx={{
    //                                 fontWeight: 'bold',
    //                                 color: maroonColor,
    //                                 fontSize: '0.95rem'
    //                             }}>Actual</TableCell>
    //                             <TableCell align="right" sx={{
    //                                 fontWeight: 'bold',
    //                                 color: maroonColor,
    //                                 fontSize: '0.95rem'
    //                             }}>Remaining</TableCell>
    //                         </TableRow>
    //                     </TableHead>
    //                     <TableBody>
    //                         {isLoadingData ? (
    //                             <TableRow>
    //                                 <TableCell colSpan={4}>
    //                                     <Skeleton variant="rectangular" height={100} />
    //                                 </TableCell>
    //                             </TableRow>
    //                         ) : !data?.[0]?.subBudget ? (
    //                             <TableRow>
    //                                 <TableCell
    //                                     colSpan={4}
    //                                     align="center"
    //                                     sx={{ color: 'gray', fontStyle: 'italic' }}
    //                                 >
    //                                     No budget data available.
    //                                 </TableCell>
    //                             </TableRow>
    //                         ) : (
    //                             (() => {
    //                                 const subBudget = data[0].subBudget;
    //                                 if (!subBudget) return null;
    //
    //                                 const dateRanges = getDateRanges(subBudget);
    //
    //                                 if (!dateRanges.length) {
    //                                     return (
    //                                         <TableRow>
    //                                             <TableCell
    //                                                 colSpan={4}
    //                                                 align="center"
    //                                                 sx={{ color: 'gray', fontStyle: 'italic' }}
    //                                             >
    //                                                 No date ranges available for this period.
    //                                             </TableCell>
    //                                         </TableRow>
    //                                     );
    //                                 }
    //
    //                                 return dateRanges.map(([start, end], rangeIndex) => (
    //                                     <React.Fragment key={`range-${rangeIndex}`}>
    //                                         <TableRow>
    //                                             <TableCell
    //                                                 colSpan={4}
    //                                                 sx={{
    //                                                     fontWeight: 'bold',
    //                                                     color: maroonColor,
    //                                                     fontSize: '1rem',
    //                                                     backgroundColor: 'rgba(128, 0, 0, 0.1)'
    //                                                 }}
    //                                             >
    //                                                 {format(start, 'MM/dd/yy')} - {format(end, 'MM/dd/yy')}
    //                                             </TableCell>
    //                                         </TableRow>
    //                                         {periodData.length > 0 ? (
    //                                             periodData.filter(category => {
    //                                                 if (budgetPeriod === 'BiWeekly' && category.biWeekRanges?.length) {
    //                                                     return category.biWeekRanges.some(range => {
    //                                                         const startArr = (range.startDate as unknown) as number[];
    //                                                         const endArr = (range.endDate as unknown) as number[];
    //
    //                                                         const categoryStart = new Date(
    //                                                             Number(startArr[0]),
    //                                                             Number(startArr[1]) - 1,
    //                                                             Number(startArr[2])
    //                                                         );
    //                                                         const categoryEnd = new Date(
    //                                                             Number(endArr[0]),
    //                                                             Number(endArr[1]) - 1,
    //                                                             Number(endArr[2])
    //                                                         );
    //                                                         return isSameDay(categoryStart, start) && isSameDay(categoryEnd, end);
    //                                                     });
    //                                                 } else if (category.dateRange?.startDate && category.dateRange?.endDate) {
    //                                                     const startArr = (category.dateRange.startDate as unknown) as number[];
    //                                                     const endArr = (category.dateRange.endDate as unknown) as number[];
    //
    //                                                     const categoryStart = new Date(
    //                                                         Number(startArr[0]),
    //                                                         Number(startArr[1]) - 1,
    //                                                         Number(startArr[2])
    //                                                     );
    //                                                     const categoryEnd = new Date(
    //                                                         Number(endArr[0]),
    //                                                         Number(endArr[1]) - 1,
    //                                                         Number(endArr[2])
    //                                                     );
    //                                                     return isSameDay(categoryStart, start) && isSameDay(categoryEnd, end);
    //                                                 }
    //                                                 return false;
    //                                             }).map((category, categoryIndex) => (
    //                                                 <TableRow
    //                                                     key={`${format(start, 'yyyy-MM-dd')}-${category.category}-${categoryIndex}`}
    //                                                     sx={{
    //                                                         '&:hover': {
    //                                                             backgroundColor: 'rgba(128, 0, 0, 0.04)',
    //                                                         }
    //                                                     }}
    //                                                 >
    //                                                     <TableCell component="th" scope="row">
    //                                                         {category.category}
    //                                                     </TableCell>
    //                                                     <TableCell align="right">
    //                                                         ${(category.budgeted || 0).toFixed(2)}
    //                                                     </TableCell>
    //                                                     <TableCell align="right">
    //                                                         ${(Math.abs(category.actual) || 0).toFixed(2)}
    //                                                     </TableCell>
    //                                                     <TableCell
    //                                                         align="right"
    //                                                         sx={{
    //                                                             color: (category.remaining || 0) >= 0 ? 'green' : 'red',
    //                                                             fontWeight: 'bold'
    //                                                         }}
    //                                                     >
    //                                                         ${Math.abs(category.remaining || 0).toFixed(2)}
    //                                                         {(category.remaining || 0) >= 0 ? ' under' : ' over'}
    //                                                     </TableCell>
    //                                                 </TableRow>
    //                                             ))
    //                                         ) : (
    //                                             <TableRow>
    //                                                 <TableCell
    //                                                     colSpan={4}
    //                                                     align="center"
    //                                                     sx={{ color: 'gray', fontStyle: 'italic' }}
    //                                                 >
    //                                                     No categories available for this range.
    //                                                 </TableCell>
    //                                             </TableRow>
    //                                         )}
    //                                         {/*{periodData.length > 0 ? (*/}
    //                                         {/*    <TableRow>*/}
    //                                         {/*        <TableCell colSpan={4} sx={{ p: 0 }}>*/}
    //                                         {/*            <Box*/}
    //                                         {/*                sx={{*/}
    //                                         {/*                    maxHeight: '200px',*/}
    //                                         {/*                    overflowY: 'auto',*/}
    //                                         {/*                    '&::-webkit-scrollbar': {*/}
    //                                         {/*                        width: '8px',*/}
    //                                         {/*                    },*/}
    //                                         {/*                    '&::-webkit-scrollbar-track': {*/}
    //                                         {/*                        backgroundColor: 'rgba(0,0,0,0.05)',*/}
    //                                         {/*                    },*/}
    //                                         {/*                    '&::-webkit-scrollbar-thumb': {*/}
    //                                         {/*                        backgroundColor: maroonColor,*/}
    //                                         {/*                        borderRadius: '4px',*/}
    //                                         {/*                        '&:hover': {*/}
    //                                         {/*                            backgroundColor: '#600000',*/}
    //                                         {/*                        },*/}
    //                                         {/*                    },*/}
    //                                         {/*                }}*/}
    //                                         {/*            >*/}
    //                                         {/*                <Table>*/}
    //                                         {/*                    <TableBody>*/}
    //                                         {/*                        {periodData.filter(category => {*/}
    //                                         {/*                            if (budgetPeriod === 'BiWeekly' && category.biWeekRanges?.length) {*/}
    //                                         {/*                                return category.biWeekRanges.some(range => {*/}
    //                                         {/*                                    const startArr = (range.startDate as unknown) as number[];*/}
    //                                         {/*                                    const endArr = (range.endDate as unknown) as number[];*/}
    //
    //                                         {/*                                    const categoryStart = new Date(*/}
    //                                         {/*                                        Number(startArr[0]),*/}
    //                                         {/*                                        Number(startArr[1]) - 1,*/}
    //                                         {/*                                        Number(startArr[2])*/}
    //                                         {/*                                    );*/}
    //                                         {/*                                    const categoryEnd = new Date(*/}
    //                                         {/*                                        Number(endArr[0]),*/}
    //                                         {/*                                        Number(endArr[1]) - 1,*/}
    //                                         {/*                                        Number(endArr[2])*/}
    //                                         {/*                                    );*/}
    //                                         {/*                                    return isSameDay(categoryStart, start) && isSameDay(categoryEnd, end);*/}
    //                                         {/*                                });*/}
    //                                         {/*                            } else if (category.dateRange?.startDate && category.dateRange?.endDate) {*/}
    //                                         {/*                                const startArr = (category.dateRange.startDate as unknown) as number[];*/}
    //                                         {/*                                const endArr = (category.dateRange.endDate as unknown) as number[];*/}
    //
    //                                         {/*                                const categoryStart = new Date(*/}
    //                                         {/*                                    Number(startArr[0]),*/}
    //                                         {/*                                    Number(startArr[1]) - 1,*/}
    //                                         {/*                                    Number(startArr[2])*/}
    //                                         {/*                                );*/}
    //                                         {/*                                const categoryEnd = new Date(*/}
    //                                         {/*                                    Number(endArr[0]),*/}
    //                                         {/*                                    Number(endArr[1]) - 1,*/}
    //                                         {/*                                    Number(endArr[2])*/}
    //                                         {/*                                );*/}
    //                                         {/*                                return isSameDay(categoryStart, start) && isSameDay(categoryEnd, end);*/}
    //                                         {/*                            }*/}
    //                                         {/*                            return false;*/}
    //                                         {/*                        }).map((category, categoryIndex) => (*/}
    //                                         {/*                            <TableRow*/}
    //                                         {/*                                key={`${format(start, 'yyyy-MM-dd')}-${category.category}-${categoryIndex}`}*/}
    //                                         {/*                                sx={{*/}
    //                                         {/*                                    '&:hover': {*/}
    //                                         {/*                                        backgroundColor: 'rgba(128, 0, 0, 0.04)',*/}
    //                                         {/*                                    }*/}
    //                                         {/*                                }}*/}
    //                                         {/*                            >*/}
    //                                         {/*                                <TableCell component="th" scope="row" sx={{ width: '40%' }}>*/}
    //                                         {/*                                    {category.category}*/}
    //                                         {/*                                </TableCell>*/}
    //                                         {/*                                <TableCell align="right" sx={{ width: '20%' }}>*/}
    //                                         {/*                                    ${(category.budgeted || 0).toFixed(2)}*/}
    //                                         {/*                                </TableCell>*/}
    //                                         {/*                                <TableCell align="right" sx={{ width: '20%' }}>*/}
    //                                         {/*                                    ${(Math.abs(category.actual) || 0).toFixed(2)}*/}
    //                                         {/*                                </TableCell>*/}
    //                                         {/*                                <TableCell*/}
    //                                         {/*                                    align="right"*/}
    //                                         {/*                                    sx={{*/}
    //                                         {/*                                        width: '20%',*/}
    //                                         {/*                                        color: (category.remaining || 0) >= 0 ? 'green' : 'red',*/}
    //                                         {/*                                        fontWeight: 'bold'*/}
    //                                         {/*                                    }}*/}
    //                                         {/*                                >*/}
    //                                         {/*                                    ${Math.abs(category.remaining || 0).toFixed(2)}*/}
    //                                         {/*                                    {(category.remaining || 0) >= 0 ? ' under' : ' over'}*/}
    //                                         {/*                                </TableCell>*/}
    //                                         {/*                            </TableRow>*/}
    //                                         {/*                        ))}*/}
    //                                         {/*                    </TableBody>*/}
    //                                         {/*                </Table>*/}
    //                                         {/*            </Box>*/}
    //                                         {/*        </TableCell>*/}
    //                                         {/*    </TableRow>*/}
    //                                         {/*) : (*/}
    //                                         {/*    <TableRow>*/}
    //                                         {/*        <TableCell*/}
    //                                         {/*            colSpan={4}*/}
    //                                         {/*            align="center"*/}
    //                                         {/*            sx={{ color: 'gray', fontStyle: 'italic' }}*/}
    //                                         {/*        >*/}
    //                                         {/*            No categories available for this range.*/}
    //                                         {/*        </TableCell>*/}
    //                                         {/*    </TableRow>*/}
    //                                         {/*)}*/}
    //                                     </React.Fragment>
    //                                 ));
    //                             })()
    //                         )}
    //                     </TableBody>
    //                 </Table>
    //
    //             </TableContainer>
    //         </Box>
    //     </LocalizationProvider>
    // );
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

                <Paper sx={{
                    boxShadow: 3,
                    borderRadius: 4,
                    overflow: 'hidden',
                    transition: 'box-shadow 0.3s ease-in-out',
                    '&:hover': {
                        boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
                    }
                }}>
                    {/* Fixed Header Table */}
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

                    {/* Content Area - NOT scrollable */}
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

                                    // Filter categories for this range
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
                                            {/* Date Range Header - Outside scrollable area */}
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

                                            {/* Scrollable Categories Section - Each date range has its own scroll */}
                                            {isExpanded && (
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