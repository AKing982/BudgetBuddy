import React, {useMemo, useState} from "react";
import {format, addDays, addWeeks, addMonths, startOfMonth, endOfMonth} from 'date-fns';
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


    const processedData = useMemo(() => {
        if (!data?.length) return [];

        const allCategories = data.flatMap(budget =>
            budget.budgetPeriodCategories?.map(category => ({
                name: category.category,
                budgetedAmount: category.budgeted || 0,
                actualAmount: category.actual || 0,
                remaining: category.remaining
            })) || []
        );

        console.log('All Categories: ', allCategories);

        // Group by category name and sum amounts
        return Object.values(
            allCategories.reduce((acc, curr) => {
                if (!acc[curr.name]) {
                    acc[curr.name] = { ...curr };
                } else {
                    acc[curr.name].budgetedAmount += curr.budgetedAmount;
                    acc[curr.name].actualAmount += curr.actualAmount;
                    acc[curr.name].remaining += curr.remaining;
                }
                return acc;
            }, {} as Record<string, any>)
        );
    }, [data]);

    const calculatePeriodData = (start: Date, end: Date) => {
        const days = (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1;
        const multiplier = days / 30;

        return processedData.map(category => ({
            name: category.name,
            budgeted: category.budgetedAmount * multiplier,
            actual: category.actualAmount * multiplier,
            remaining: category.remaining * multiplier
        }));
    };

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
        if (!selectedDate) return [];
        const monthStart = startOfMonth(selectedDate);
        const monthEnd = endOfMonth(selectedDate);

        switch(budgetPeriod) {
            case 'Daily':
                return [[selectedDate, selectedDate]];
            case 'Weekly':
                return [
                    [monthStart, addDays(monthStart, 6)],
                    [addWeeks(monthStart, 1), addDays(addWeeks(monthStart, 1), 6)],
                    [addWeeks(monthStart, 2), addDays(addWeeks(monthStart, 2), 6)],
                    [addWeeks(monthStart, 3), monthEnd]
                ];
            case 'BiWeekly':
                return [
                    [monthStart, addDays(monthStart, 13)],
                    [addDays(monthStart, 14), monthEnd]
                ];
            case 'Monthly':
            default:
                return [[monthStart, monthEnd]];
        }
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
                        <TableBody>
                            {getDateRanges().map(([start, end], index) => {
                                const periodData = calculatePeriodData(start, end);
                                return (
                                    <React.Fragment key={index}>
                                        <TableRow>
                                            <TableCell colSpan={4} sx={{
                                                fontWeight: 'bold',
                                                color: maroonColor,
                                                fontSize: '1rem',
                                                backgroundColor: 'rgba(128, 0, 0, 0.1)'
                                            }}>
                                                {budgetPeriod === 'Daily'
                                                    ? format(start, 'MMMM d, yyyy')
                                                    : `${format(start, 'MM/dd/yy')} - ${format(end, 'MM/dd/yy')}`}
                                            </TableCell>
                                        </TableRow>
                                        {periodData.map((row) => (
                                            <TableRow key={`${index}-${row.name}`}>
                                                <TableCell component="th" scope="row">
                                                    {row.name}
                                                </TableCell>
                                                <TableCell align="right">
                                                    ${row.budgeted.toFixed(2)}
                                                </TableCell>
                                                <TableCell align="right">
                                                    ${row.actual.toFixed(2)}
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        color: row.remaining >= 0 ? 'green' : 'red',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    ${Math.abs(row.remaining).toFixed(2)}
                                                    {row.remaining >= 0 ? ' under' : ' over'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </LocalizationProvider>
    );

}

export default BudgetPeriodTable;