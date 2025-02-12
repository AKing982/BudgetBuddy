import React, {useMemo, useState} from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { Box, Typography, Button, Grid } from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BudgetOverview from './BudgetOverview';
import BudgetPeriodTable from './BudgetPeriodTable';
import BudgetSummary from "./BudgetSummary";
import SpendingOverview from './SpendingOverview';
import SpendingControlProgress from './SpendingControlProgress';
import Sidebar from "./Sidebar";
import {BudgetRunnerResult} from "../services/BudgetRunnerService";
import {Budget} from '../utils/Items';

const BudgetControlPage: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [budgetData, setBudgetData] = useState<BudgetRunnerResult[]>([]);


    const handlePreviousMonth = () => {
        setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
    };

    // Dummy data for testing
    // Dummy data for testing
    const budgetStats = useMemo(() => {
        if (!budgetData.length) {
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
        const totalSpent = budgetData.reduce((sum, budget) => sum + budget.budget.actual, 0);
        const totalSaved = budgetData.reduce((sum, budget) => {
            // Since budgetCategoryStats is now an object, we directly access savingsCategories
            const savingsTotal = budget.budgetCategoryStats?.savingsCategories?.reduce(
                (acc: number, cat: any) => acc + (cat.actualAmount || 0),
                0
            ) || 0;

            return sum + savingsTotal;
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

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: 'auto' }}>
            <Sidebar />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    {format(currentMonth, 'MMMM yyyy')} Budget Control
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        startIcon={<ChevronLeft />}
                        onClick={handlePreviousMonth}
                        sx={{ mr: 1 }}
                    >
                        {format(subMonths(currentMonth, 1), 'MMM. yyyy')}
                    </Button>
                    <Button
                        endIcon={<ChevronRight />}
                        onClick={handleNextMonth}
                    >
                        {format(addMonths(currentMonth, 1), 'MMM. yyyy')}
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={4}>
                <Grid item xs={12} md={8}>
                    <Box sx={{ mb: 4 }}>
                        <BudgetOverview isLoading={isLoading} data={budgetData} />
                    </Box>

                    <Box sx={{ mb: 4 }}>
                        <SpendingOverview />
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
                        <SpendingControlProgress />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default BudgetControlPage;