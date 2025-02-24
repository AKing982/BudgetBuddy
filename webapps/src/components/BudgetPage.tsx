import {addMonths, format, subMonths} from 'date-fns';
import {Box, Button, Grid, Typography} from '@mui/material';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import React, {useEffect, useMemo, useState} from "react";
import Sidebar from './Sidebar';
import BudgetOverview from './BudgetOverview';
import TopExpenseCategory from './TopExpenseCategory';
import BudgetPeriodTable from './BudgetPeriodTable';
import BudgetSummary from "./BudgetSummary";
import BudgetProgressSummary from "./BudgetProgressSummary";
import BudgetRunnerService, {BudgetRunnerResult} from "../services/BudgetRunnerService";
import {
    BudgetCategoryStats,
    BudgetPeriodCategory,
    BudgetStats,
    DateRangeInput,
    InputStats,
    ProcessedStats
} from "../utils/Items";
import DateRange from "../domain/DateRange";

interface DateArrays {
    startDate: [number, number, number];
    endDate: [number, number, number];
}


const BudgetPage: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [budgetType, setBudgetType] = useState('50/30/20');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const budgetRunnerService = BudgetRunnerService.getInstance();
    const [budgetData, setBudgetData] = useState<BudgetRunnerResult[]>([]);
    const userId = Number(sessionStorage.getItem('userId'));

    const handlePreviousMonth = () => {
        setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
    };

    const fetchBudgetData = async (date: Date) => {
        try {
            setIsLoading(true);
            setError(null);

            // Get first and last day of the month
            const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
            const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const results = await budgetRunnerService.getBudgetsByDateRange(
                userId,
                startDate,
                endDate
            );

            setBudgetData(results);
            console.log('Budget Data: ', results);
        } catch (err) {
            setError('Failed to fetch budget data. Please try again later.');
            console.error('Error fetching budget data:', err);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        fetchBudgetData(currentMonth);
    }, [currentMonth, userId]);


    const defaultBudgetStats: BudgetStats = {
        averageSpendingPerDay: 0,
        budgetId: 0,
        dateRange: new DateRange(new Date(), new Date()),
        healthScore: 0,
        monthlyProjection: null,
        remaining: 0,
        totalBudget: 0,
        totalSaved: 0,
        totalSpent: 0
    };


    // Then update the implementation with proper default values
    // const budgetStats = useMemo(() => {
    //     if (!budgetData?.length) {
    //         return defaultBudgetStats;
    //     }
    //
    //     const stats = budgetData[0]?.budgetStats[0];
    //     if(!stats) return defaultBudgetStats;
    //
    //     // Calculate missing properties for dateRange
    //     const daysInRange = stats.dateRange.daysInRange;
    //     const weeksInRange = Math.ceil(daysInRange / 7);
    //     const biWeeksInRange = Math.ceil(daysInRange / 14);
    //
    //     return {
    //         averageSpendingPerDay: stats.averageSpendingPerDay ?? 0,
    //         budgetId: stats.budgetId,
    //         dateRange: {
    //             ...stats.dateRange,
    //             weeksInRange,      // Add calculated property
    //             biWeeksInRange     // Add calculated property
    //         },
    //         healthScore: stats.healthScore ?? 0,
    //         monthlyProjection: stats.monthlyProjection,
    //         remaining: stats.remaining,
    //         totalBudget: stats.totalBudget,
    //         totalSaved: stats.totalSaved,
    //         totalSpent: stats.totalSpent
    //     } as BudgetStats;
    // }, [budgetData]);

    const budgetStats = useMemo(() => {
        if (!budgetData?.length) {
            return {
                averageSpendingPerDay: 0,
                budgetId: 0,
                dateRange: new DateRange(new Date(), new Date()),
                healthScore: 0,
                monthlyProjection: null,
                remaining: 0,
                totalBudget: 0,
                totalSaved: 0,
                totalSpent: 0
            };
        }

        const stats = budgetData[0]?.budgetStats[0];
        if (!stats) return defaultBudgetStats;

        // Just tell TypeScript these are number arrays
        const startDate = (stats.dateRange.startDate as unknown) as number[];
        const endDate = (stats.dateRange.endDate as unknown) as number[];


        return {
            averageSpendingPerDay: stats.averageSpendingPerDay ?? 0,
            budgetId: stats.budgetId,
            dateRange: new DateRange(
                new Date(startDate[0], startDate[1] - 1, startDate[2]),
                new Date(endDate[0], endDate[1] - 1, endDate[2])
            ),
            healthScore: stats.healthScore ?? 0,
            monthlyProjection: stats.monthlyProjection,
            remaining: stats.remaining,
            totalBudget: stats.totalBudget,
            totalSaved: stats.totalSaved,
            totalSpent: stats.totalSpent
        };
    }, [budgetData]);

    const handleBudgetTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setBudgetType(event.target.value as string);
    };

    const handleAddBudget = (newBudget: any) => {
        // Implement the logic to add a new budget
        console.log('Add new budget');
    };

    const topExpenseCategories = useMemo(() => {
        if (!budgetData?.length) return [];

        // Flatten topExpenseCategories from all budget results
        return budgetData.reduce<any[]>((acc, budget) => {
            const stats = budget.budgetCategoryStats;
            if (!stats || !stats.topExpenseCategories) {
                return acc;
            }

            // Map the top expenses to match the component's expected structure
            const mappedExpenses = stats.topExpenseCategories.map(expense => ({
                categoryName: expense.category,
                budgetedAmount: expense.budgetedExpenses,
                actualAmount: expense.actualExpenses,
                remainingAmount: expense.remainingExpenses,
                startDate: expense.startDate,
                endDate: expense.endDate,
                isActive: expense.active
            }));

            return [...acc, ...mappedExpenses];
        }, []);
    }, [budgetData]);

    return (
        <Box sx={{ p: 3, maxWidth: 937, margin: 'auto' }}>
            <Sidebar />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    {format(currentMonth, 'MMMM yyyy')} Budget
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        startIcon={<ChevronLeft />}
                        onClick={handlePreviousMonth}
                        sx={{ mr: 1 }}
                        disabled={isLoading}
                    >
                        {format(subMonths(currentMonth, 1), 'MMM. yyyy')}
                    </Button>
                    <Button
                        endIcon={<ChevronRight />}
                        onClick={handleNextMonth}
                        disabled={isLoading}
                    >
                        {format(addMonths(currentMonth, 1), 'MMM. yyyy')}
                    </Button>
                </Box>
            </Box>
            {error && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
                    {error}
                </Box>
            )}

            <Grid container spacing={4}>
                <Grid item xs={12} md={8}>
                    <Box sx={{ mb: 4 }}>
                        <BudgetOverview isLoading={isLoading} data={budgetData}/>
                    </Box>

                    <Box sx={{ mb: 4 }}>
                        <TopExpenseCategory isLoading={isLoading} categories={topExpenseCategories}/>
                    </Box>

                    <Box>
                        <BudgetPeriodTable isLoading={isLoading} data={budgetData} />
                    </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Box sx={{mb: 4}}>
                        <BudgetSummary
                           isLoading={isLoading}
                           budgetStats={budgetStats}
                        />
                    </Box>
                   <Box>
                       <BudgetProgressSummary />
                   </Box>
                </Grid>
            </Grid>
        </Box>
    );

    // return (
    //     <Box sx={{ display: 'flex' }}>
    //         <Sidebar />
    //         <Box sx={{ flexGrow: 1, p: 3, ml: '240px' }}>
    //             <Paper sx={{ p: 3, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    //                 <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
    //                     {format(currentMonth, 'MMMM yyyy')} Budget
    //                 </Typography>
    //                 <Box>
    //                     <IconButton onClick={handlePreviousMonth}>
    //                         <ChevronLeft />
    //                     </IconButton>
    //                     <IconButton onClick={handleNextMonth}>
    //                         <ChevronRight />
    //                     </IconButton>
    //                 </Box>
    //             </Paper>
    //
    //             <Grid container spacing={3}>
    //                 <Grid item xs={12} md={8}>
    //                     <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    //                         <BudgetOverview />
    //                         <TopExpenseCategory />
    //                         <BudgetPeriodTable />
    //                     </Box>
    //                 </Grid>
    //                 <Grid item xs={12} md={4}>
    //                     <Box sx={{ position: 'sticky', top: 20 }}>
    //                         <BudgetSummary
    //                             totalBudget={summaryData.totalBudget}
    //                             leftToSpend={summaryData.leftToSpend}
    //                             currentSpend={summaryData.currentSpend}
    //                             daysLeft={summaryData.daysLeft}
    //                         />
    //                     </Box>
    //                 </Grid>
    //             </Grid>
    //         </Box>
    //     </Box>
    // );

    // return (
    //     <Box sx={{ display: 'flex' }}>
    //         <Sidebar />
    //         <Box sx={{ flexGrow: 1, p: 3, ml: '240px' }}>
    //             <Paper sx={{ p: 3, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    //                 <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
    //                     {format(currentMonth, 'MMMM yyyy')} Budget
    //                 </Typography>
    //                 <Box>
    //                     <IconButton onClick={handlePreviousMonth}>
    //                         <ChevronLeft />
    //                     </IconButton>
    //                     <IconButton onClick={handleNextMonth}>
    //                         <ChevronRight />
    //                     </IconButton>
    //                 </Box>
    //             </Paper>
    //
    //             <BudgetOverview />
    //             <TopExpenseCategory />
    //             <BudgetPeriodTable />
    //         </Box>
    //     </Box>
    // );
}

export default BudgetPage;