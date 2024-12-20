import { format, addMonths, subMonths } from 'date-fns';
import {Box, Typography, Paper, IconButton, Grid, Button, Select, MenuItem} from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, {useEffect, useMemo, useState} from "react";
import Sidebar from './Sidebar';
import BudgetOverview from './BudgetOverview';
import TopExpenseCategory from './TopExpenseCategory';
import BudgetPeriodTable from './BudgetPeriodTable';
import BudgetSummary from "./BudgetSummary";
import BudgetProgressSummary from "./BudgetProgressSummary";
import {Add} from "@mui/icons-material";
import AddBudgetDialog from "./AddBudgetDialog";
import BudgetRunnerService, {BudgetRunnerResult} from "../services/BudgetRunnerService";

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
    const summaryData = React.useMemo(() => {
        if (!budgetData.length) return {
            totalBudget: 0,
            leftToSpend: 0,
            currentSpend: 0,
            daysLeft: 0
        };

        const totalBudget = budgetData.reduce((sum, budget) => sum + budget.budgetAmount, 0);
        const currentSpend = budgetData.reduce((sum, budget) => sum + budget.actualAmount, 0);
        const leftToSpend = totalBudget - currentSpend;

        // Calculate days left in the month
        const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const daysLeft = Math.max(0, lastDayOfMonth.getDate() - new Date().getDate());

        return {
            totalBudget,
            leftToSpend,
            currentSpend,
            daysLeft
        };
    }, [budgetData, currentMonth]);

    const categoriesData = React.useMemo(() => {
        if (!budgetData.length) return [];
        return budgetData.flatMap(budget => budget.topExpenseCategories);
    }, [budgetData]);

    const periodData = React.useMemo(() => {
        if (!budgetData.length) return [];
        return budgetData.flatMap(budget => budget.periodCategories);
    }, [budgetData]);


    const handleBudgetTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setBudgetType(event.target.value as string);
    };

    const handleAddBudget = (newBudget: any) => {
        // Implement the logic to add a new budget
        console.log('Add new budget');
    };

    const topExpenseCategories = useMemo(() => {
        if (!budgetData.length) return [];

        // Flatten all expense categories from all budgets
        return budgetData.flatMap(budget => budget.topExpenseCategories || []);
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
                           data={budgetData}
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