import React, {useState} from 'react';
import {Box, Typography, Paper, LinearProgress, CircularProgress, Grid, Select, MenuItem} from '@mui/material';
import { styled } from '@mui/material/styles';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import SavingsIcon from '@mui/icons-material/Savings';

// Dummy data - replace with real data in production
// const budgetData = {
//     totalBudget: 3000,
//     totalSpent: 2100,
//     savingsGoal: 500,
//     currentSavings: 350,
//     categories: [
//         { name: 'Housing', spent: 1200, budget: 1500 },
//         { name: 'Food', spent: 400, budget: 500 },
//         { name: 'Transportation', spent: 250, budget: 300 },
//         { name: 'Utilities', spent: 150, budget: 200 },
//         { name: 'Entertainment', spent: 100, budget: 150 },
//     ]
// };
// Dummy data - replace with real data in production

type Category = {
    name: string;
    spent: number;
    budget: number;
};

type BudgetData = {
    totalBudget: number;
    totalSpent: number;
    savingsGoal: number;
    currentSavings: number;
    previousWeekSavings: number;
    categories: Category[];
};

type BudgetsData = {
    [key: string]: BudgetData;
};

const budgetsData: BudgetsData = {
    'Monthly Budget': {
        totalBudget: 3000,
        totalSpent: 2100,
        savingsGoal: 500,
        currentSavings: 350,
        previousWeekSavings: 300,
        categories: [
            { name: 'Housing', spent: 1200, budget: 1500 },
            { name: 'Food', spent: 400, budget: 500 },
            { name: 'Transportation', spent: 250, budget: 300 },
            { name: 'Utilities', spent: 150, budget: 200 },
            { name: 'Entertainment', spent: 100, budget: 150 },
        ]
    },
    'Quarterly Budget': {
        totalBudget: 9000,
        totalSpent: 6300,
        savingsGoal: 1500,
        currentSavings: 1050,
        previousWeekSavings: 900,
        categories: [
            { name: 'Housing', spent: 3600, budget: 4500 },
            { name: 'Food', spent: 1200, budget: 1500 },
            { name: 'Transportation', spent: 750, budget: 900 },
            { name: 'Utilities', spent: 450, budget: 600 },
            { name: 'Entertainment', spent: 300, budget: 450 },
        ]
    }
};


const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[3],
    backgroundColor: theme.palette.background.paper,
}));


const BudgetProgressSummary: React.FC = () => {
    const [selectedBudget, setSelectedBudget] = useState('Monthly Budget');
    const budgetData = budgetsData[selectedBudget] || [];
    const remainingBudget = budgetData.totalBudget - budgetData.totalSpent;
    const percentageSpent = (budgetData.totalSpent / budgetData.totalBudget) * 100;
    const savingsProgress = (budgetData.currentSavings / budgetData.savingsGoal) * 100;

    const remainingToSave = budgetData.savingsGoal - budgetData.currentSavings;
    const savingsComparison = budgetData.currentSavings - budgetData.previousWeekSavings;

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" component="h2" sx={{
                    fontWeight: 'bold',
                    textAlign: 'left',
                    mb: 2,
                    fontSize: '0.875rem',
                    color: 'text.secondary'
                }}>
                    Savings & Budget Progress
                </Typography>
                <Select
                    value={selectedBudget}
                    onChange={(e) => setSelectedBudget(e.target.value)}
                    size="small"
                >
                    {Object.keys(budgetsData).map((budget) => (
                        <MenuItem key={budget} value={budget}>{budget}</MenuItem>
                    ))}
                </Select>
            </Box>
            <StyledPaper>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Box display="flex" alignItems="center" mb={2}>
                            <SavingsIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                            <Box flexGrow={1}>
                                <Typography variant="subtitle1">Savings Goal: ${budgetData.savingsGoal}</Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={savingsProgress}
                                    color="primary"
                                    sx={{ height: 10, borderRadius: 5 }}
                                />
                            </Box>
                            <Box ml={2} position="relative" display="inline-flex">
                                <CircularProgress variant="determinate" value={savingsProgress} size={60} />
                                <Box
                                    top={0}
                                    left={0}
                                    bottom={0}
                                    right={0}
                                    position="absolute"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <Typography variant="caption" component="div" color="text.secondary">
                                        {`${Math.round(savingsProgress)}%`}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Current Savings: ${budgetData.currentSavings} / ${budgetData.savingsGoal}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Remaining to Save: ${remainingToSave}
                        </Typography>
                        <Typography variant="body2" color={savingsComparison >= 0 ? 'success.main' : 'error.main'}>
                            Savings vs Last Week: {savingsComparison >= 0 ? '+' : ''}{savingsComparison}
                        </Typography>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                            Overall Budget Status
                        </Typography>
                        <Box mb={2}>
                            <Typography variant="body2">Total Budget: ${budgetData.totalBudget}</Typography>
                            <Typography variant="body2">Total Spent: ${budgetData.totalSpent}</Typography>
                            <Typography variant="body2" color={remainingBudget >= 0 ? 'success.main' : 'error.main'}>
                                Remaining: ${remainingBudget}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </StyledPaper>
        </Box>
    );
    //
    // return (
    //     <Box>
    //         <Typography variant="h5" component="h2" gutterBottom sx={{
    //             mb: 2,
    //             fontWeight: 'bold',
    //             textAlign: 'left',
    //             fontSize: '0.875rem',
    //             color: 'text.secondary'
    //         }}>
    //             Savings & Budget Progress
    //         </Typography>
    //         <StyledPaper>
    //
    //         <Grid container spacing={3}>
    //             <Grid item xs={12}>
    //                 <Box display="flex" alignItems="center" mb={2}>
    //                     <SavingsIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
    //                     <Box flexGrow={1}>
    //                         <Typography variant="subtitle1">Savings Goal: ${budgetData.savingsGoal}</Typography>
    //                         <LinearProgress
    //                             variant="determinate"
    //                             value={savingsProgress}
    //                             color="primary"
    //                             sx={{ height: 10, borderRadius: 5 }}
    //                         />
    //                     </Box>
    //                     <Box ml={2} position="relative" display="inline-flex">
    //                         <CircularProgress variant="determinate" value={savingsProgress} size={60} />
    //                         <Box
    //                             top={0}
    //                             left={0}
    //                             bottom={0}
    //                             right={0}
    //                             position="absolute"
    //                             display="flex"
    //                             alignItems="center"
    //                             justifyContent="center"
    //                         >
    //                             <Typography variant="caption" component="div" color="text.secondary">
    //                                 {`${Math.round(savingsProgress)}%`}
    //                             </Typography>
    //                         </Box>
    //                     </Box>
    //                 </Box>
    //                 <Typography variant="body2" color="text.secondary">
    //                     Current Savings: ${budgetData.currentSavings} / ${budgetData.savingsGoal}
    //                 </Typography>
    //                 <Typography variant="body2" color="text.secondary">
    //                     Remaining to Save: ${budgetData.savingsGoal - budgetData.currentSavings}
    //                 </Typography>
    //             </Grid>
    //
    //             <Grid item xs={12}>
    //                 <Typography variant="subtitle1" gutterBottom>
    //                     Overall Budget Status
    //                 </Typography>
    //                 <Box mb={2}>
    //                     <Typography variant="body2">Total Budget: ${budgetData.totalBudget}</Typography>
    //                     <Typography variant="body2">Total Spent: ${budgetData.totalSpent}</Typography>
    //                     <Typography variant="body2" color={remainingBudget >= 0 ? 'success.main' : 'error.main'}>
    //                         Remaining: ${remainingBudget}
    //                     </Typography>
    //                 </Box>
    //                 <LinearProgress
    //                     variant="determinate"
    //                     value={percentageSpent}
    //                     color={percentageSpent > 90 ? 'error' : 'primary'}
    //                 />
    //                 <Typography variant="body2" align="right">
    //                     {percentageSpent.toFixed(1)}% Spent
    //                 </Typography>
    //             </Grid>
    //
    //             <Grid item xs={12}>
    //                 <Typography variant="subtitle1" gutterBottom>
    //                     Top Expense Categories
    //                 </Typography>
    //                 {budgetData.categories.slice(0, 3).map((category, index) => (
    //                     <Box key={index} mb={1}>
    //                         <Typography variant="body2">
    //                             {category.name}: ${category.spent} / ${category.budget}
    //                         </Typography>
    //                         <LinearProgress
    //                             variant="determinate"
    //                             value={(category.spent / category.budget) * 100}
    //                             color={(category.spent / category.budget) > 0.9 ? 'error' : 'primary'}
    //                         />
    //                     </Box>
    //                 ))}
    //             </Grid>
    //         </Grid>
    //     </StyledPaper>
    //     </Box>
    // );

}

export default BudgetProgressSummary;