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
import {BudgetCategoryStats, BudgetPeriodCategory} from "../utils/Items";


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

    // Calculate summary data from budgetData
    // const budgetStats = useMemo(() => {
    //     if (!budgetData.length) {
    //         return {
    //             averageSpendingPerDay: 0,
    //             budgetId: 0,
    //             dateRange: {
    //                 startDate: [],
    //                 endDate: [],
    //                 weeksInRange: 0,
    //                 biWeeksInRange: 0,
    //                 daysInRange: 0
    //             },
    //             remaining: 0,
    //             totalBudget: 0,
    //             totalSaved: 0,
    //             totalSpent: 0
    //         };
    //     }
    //
    //     // Aggregate data from all budgets
    //     const totalBudget = budgetData.reduce((sum, budget) => sum + budget.budget.budgetAmount, 0);
    //     console.log('Total Budget: ', totalBudget);
    //     const totalSpent = budgetData.reduce((sum, result) => {
    //         // result.budgetCategoryStats is an array of BudgetCategoryStats.
    //         const periodSpent = result.budgetCategoryStats.reduce((statSum, stats) => {
    //             // Sum all the 'actual' values from each BudgetPeriodCategory inside this BudgetCategoryStats.
    //             return statSum + stats.budgetPeriodCategories.reduce((catSum, cat) =>
    //                 catSum + (cat.actual || 0), 0);
    //         }, 0);
    //         console.log('Period spent for budget:', periodSpent);
    //         return sum + periodSpent;
    //     }, 0);
    //     console.log('Total Spent: ', totalSpent);
    //
    //     console.log('Total Spent: ', totalSpent);
    //     const totalSaved = budgetData.reduce((sum, result) => {
    //         const savingsAmount = result.budgetCategoryStats.reduce((statSum, stats) => {
    //             return statSum + stats.budgetPeriodCategories.reduce((catSum, cat) => {
    //                 // Only count the 'actual' amount if the category name contains "saving"
    //                 const amount = cat.category.toLowerCase().includes('saving')
    //                     ? (cat.actual || 0)
    //                     : 0;
    //                 return catSum + amount;
    //             }, 0);
    //         }, 0);
    //         console.log('Savings amount for budget:', savingsAmount);
    //         return sum + savingsAmount;
    //     }, 0);
    //
    //     const remaining = totalBudget - totalSpent - totalSaved;
    //     console.log('Total remaining: ', remaining);
    //
    //     // Calculate date range from the first budget
    //     const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    //     const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    //     const daysInRange = endDate.getDate();
    //     const weeksInRange = Math.ceil(daysInRange / 7);
    //     const biWeeksInRange = Math.ceil(daysInRange / 14);
    //
    //     return {
    //         averageSpendingPerDay: totalSpent / daysInRange,
    //         budgetId: budgetData[0]?.budget.id || 0,
    //         dateRange: {
    //             startDate: [startDate.getFullYear(), startDate.getMonth(), startDate.getDate()],
    //             endDate: [endDate.getFullYear(), endDate.getMonth(), endDate.getDate()],
    //             weeksInRange,
    //             biWeeksInRange,
    //             daysInRange
    //         },
    //         remaining,
    //         totalBudget,
    //         totalSaved,
    //         totalSpent
    //     };
    // }, [budgetData, currentMonth]);


    // const categoriesData = React.useMemo(() => {
    //     if (!budgetData.length) return [];
    //     return budgetData.flatMap(budget => budget.topExpenseCategories);
    // }, [budgetData]);
    //
    // const periodData = React.useMemo(() => {
    //     if (!budgetData.length) return [];
    //     return budgetData.flatMap(budget => budget.budgetPeriodCategories);
    // }, [budgetData]);

    const budgetStats = useMemo(() => {
        if (!budgetData?.length) {
            return {
                averageSpendingPerDay: 0,
                budgetId: 0,
                dateRange: {
                    startDate: [],
                    endDate: [],
                    weeksInRange: 0,
                    biWeeksInRange: 0,
                    daysInRange: 0
                },
                remaining: 0,
                totalBudget: 0,
                totalSaved: 0,
                totalSpent: 0
            };
        }

        // Aggregate data from all budgets
        const totalBudget = budgetData.reduce((sum, budget) => sum + budget.budget.budgetAmount, 0);

        const totalSpent: number = budgetData.reduce((sum: number, result: BudgetRunnerResult) => {
            if (!Array.isArray(result.budgetCategoryStats)) {
                return sum;
            }

            const periodSpent = result.budgetCategoryStats.reduce((statSum: number, stats: BudgetCategoryStats) => {
                if (!Array.isArray(stats.budgetPeriodCategories)) {
                    return statSum;
                }

                return statSum + stats.budgetPeriodCategories.reduce((catSum: number, cat: BudgetPeriodCategory) =>
                        catSum + (cat?.actual || 0),
                    0
                );
            }, 0);

            return sum + periodSpent;
        }, 0);

        const totalSaved: number = budgetData.reduce((sum: number, result: BudgetRunnerResult) => {
            if (!Array.isArray(result.budgetCategoryStats)) {
                return sum;
            }

            const savingsAmount = result.budgetCategoryStats.reduce((statSum: number, stats: BudgetCategoryStats) => {
                if (!Array.isArray(stats.budgetPeriodCategories)) {
                    return statSum;
                }

                return statSum + stats.budgetPeriodCategories.reduce((catSum: number, cat: BudgetPeriodCategory) => {
                    const amount = cat?.category?.toLowerCase().includes('saving')
                        ? (cat.actual || 0)
                        : 0;
                    return catSum + amount;
                }, 0);
            }, 0);

            return sum + savingsAmount;
        }, 0);

        const remaining = totalBudget - totalSpent - totalSaved;

        // Calculate date range from the first budget
        const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const daysInRange = endDate.getDate();
        const weeksInRange = Math.ceil(daysInRange / 7);
        const biWeeksInRange = Math.ceil(daysInRange / 14);

        return {
            averageSpendingPerDay: totalSpent / daysInRange,
            budgetId: budgetData[0]?.budget.id || 0,
            dateRange: {
                startDate: [startDate.getFullYear(), startDate.getMonth(), startDate.getDate()],
                endDate: [endDate.getFullYear(), endDate.getMonth(), endDate.getDate()],
                weeksInRange,
                biWeeksInRange,
                daysInRange
            },
            remaining,
            totalBudget,
            totalSaved,
            totalSpent
        };
    }, [budgetData, currentMonth]);


    const handleBudgetTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setBudgetType(event.target.value as string);
    };

    const handleAddBudget = (newBudget: any) => {
        // Implement the logic to add a new budget
        console.log('Add new budget');
    };

    const topExpenseCategories = useMemo(() => {
        if (!budgetData?.length) return [];

        return budgetData.reduce<any[]>((acc, budget) => {
            if (!Array.isArray(budget.budgetCategoryStats)) {
                return acc;
            }

            const categoryStats = budget.budgetCategoryStats.reduce<any[]>((statAcc, stats) => {
                if (!Array.isArray(stats.topExpenseCategories)) {
                    return statAcc;
                }
                return [...statAcc, ...stats.topExpenseCategories];
            }, []);

            return [...acc, ...categoryStats];
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