import React, { useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { Box, Typography, Button, Grid } from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BudgetOverview from './BudgetOverview';
import BudgetPeriodTable from './BudgetPeriodTable';
import BudgetSummary from "./BudgetSummary";
import DebtOverview from './DebtOverview';
import DebtPaymentProgress from './DebtPaymentProgress';
import Sidebar from "./Sidebar";
import {BudgetRunnerResult} from "../services/BudgetRunnerService";

const BudgetDebtPage: React.FC = () => {
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
    const summaryData = {
        totalBudget: 2260.60,
        leftToSpend: 1278.47,
        currentSpend: 982.13,
        daysLeft: 5
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: 'auto' }}>
            <Sidebar />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    {format(currentMonth, 'MMMM yyyy')} - Budget & Debt Overview
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
                        <BudgetOverview isLoading={isLoading} data={budgetData}/>
                    </Box>

                    <Box sx={{ mb: 4 }}>
                        <DebtOverview />
                    </Box>

                    <Box>
                        <BudgetPeriodTable isLoading={isLoading} data={budgetData}/>
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
                        <DebtPaymentProgress />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default BudgetDebtPage;
