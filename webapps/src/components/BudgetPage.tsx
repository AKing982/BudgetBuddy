import { format, addMonths, subMonths } from 'date-fns';
import {Box, Typography, Paper, IconButton, Grid, Button} from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, {useState} from "react";
import Sidebar from './Sidebar';
import BudgetOverview from './BudgetOverview';
import TopExpenseCategory from './TopExpenseCategory';
import BudgetPeriodTable from './BudgetPeriodTable';
import BudgetSummary from "./BudgetSummary";

const BudgetPage: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const handlePreviousMonth = () => {
        setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
    };

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
                    {format(currentMonth, 'MMMM yyyy')} Budget
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
                        <TopExpenseCategory />
                    </Box>

                    <Box>
                        <BudgetPeriodTable />
                    </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                    <BudgetSummary
                        totalBudget={2260.60}
                        leftToSpend={1278.47}
                        currentSpend={982.13}
                        daysLeft={5}
                    />
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