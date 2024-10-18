import React, { useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { Box, Typography, Button, Grid } from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BudgetOverview from './BudgetOverview';
import BudgetPeriodTable from './BudgetPeriodTable';
import BudgetSummary from "./BudgetSummary";
import SpendingOverview from './SpendingOverview';
import SpendingControlProgress from './SpendingControlProgress';
import Sidebar from "./Sidebar";

const BudgetControlPage: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const handlePreviousMonth = () => {
        setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
    };

    // Dummy data for testing
    const summaryData = {
        totalBudget: 2700,
        leftToSpend: 1050,
        currentSpend: 1650,
        daysLeft: 10
    };

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
                        <BudgetOverview />
                    </Box>

                    <Box sx={{ mb: 4 }}>
                        <SpendingOverview />
                    </Box>

                    <Box>
                        <BudgetPeriodTable />
                    </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Box sx={{mb: 4}}>
                        <BudgetSummary
                            totalBudget={summaryData.totalBudget}
                            leftToSpend={summaryData.leftToSpend}
                            currentSpend={summaryData.currentSpend}
                            daysLeft={summaryData.daysLeft}
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