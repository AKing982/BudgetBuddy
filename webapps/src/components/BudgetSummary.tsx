import {Box, Typography, CircularProgress, List, ListItem, ListItemText, ListItemIcon, Skeleton} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import React, {useMemo} from "react";
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import {BudgetRunnerResult} from "../services/BudgetRunnerService";
import DateRange from "../domain/DateRange";

ChartJS.register(ArcElement, Tooltip, Legend);


interface BudgetStats {
    averageSpendingPerDay: number;
    budgetId: number;
    dateRange: DateRange;
    remaining: number;
    totalBudget: number;
    totalSaved: number;
    totalSpent: number;
}

interface BudgetSummaryProps {
    isLoading: boolean;
    budgetStats:BudgetStats;
}



const BudgetSummary: React.FC<BudgetSummaryProps> = ({isLoading, budgetStats}) => {

    console.log('Budget Stats: ', budgetStats);
    const chartData = useMemo(() => ({
        labels: ['Spent', 'Saved', 'Remaining'],
        datasets: [
            {
                data: [
                    budgetStats.totalSpent,
                    budgetStats.totalSaved,
                    budgetStats.remaining
                ],
                backgroundColor: ['#FF6384', '#4BC0C0', '#36A2EB'],
                hoverBackgroundColor: ['#FF6384', '#4BC0C0', '#36A2EB'],
            },
        ],
    }), [budgetStats]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            label += new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD'
                            }).format(context.parsed);
                        }
                        return label;
                    }
                }
            }
        },
    };

    if (isLoading) {
        return (
            <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Budget Statistics
                </Typography>
                <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, p: 3 }}>
                    <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', mb: 2 }} />
                    <Skeleton variant="text" width="60%" sx={{ mx: 'auto' }} />
                    <Skeleton variant="rectangular" height={60} sx={{ mx: 'auto', mt: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                        <Skeleton variant="rectangular" width={80} height={40} />
                        <Skeleton variant="rectangular" width={80} height={40} />
                        <Skeleton variant="rectangular" width={80} height={40} />
                    </Box>
                </Box>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h6" sx={{
                mb: 2,
                fontWeight: 'bold',
                fontSize: '0.875rem',
                textAlign: 'left',
                color: 'text.secondary' }}>
                Budget Statistics
            </Typography>
            <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, p: 3 }}>
                <Box sx={{ height: 200, mb: 2 }}>
                    <Pie data={chartData} options={options} />
                </Box>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                    Available to Spend
                </Typography>
                <Typography variant="h4" fontWeight="bold" textAlign="center">
                    {budgetStats.remaining < 0 ? `$${0}` : `$${budgetStats.remaining.toFixed(2)}`}
                </Typography>
                <Typography variant="body2" textAlign="center" sx={{ mt: 1 }}>
                    Daily average spending: ${budgetStats.averageSpendingPerDay.toFixed(2)}
                    {budgetStats.dateRange.getDaysInRange() > 0 &&
                        ` over ${budgetStats.dateRange.getDaysInRange()} days`}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Total Budget
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                            ${budgetStats.totalBudget}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Total Spent
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                            ${budgetStats.totalSpent}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Total Saved
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" color="success.main">
                            {/*${Math.abs(Math.round(budgetStats.totalBudget - budgetStats.totalSpent))}*/}
                            {Math.round(budgetStats.totalBudget - budgetStats.totalSpent) < 0 ? `$${0}` : Math.round(budgetStats.totalBudget - budgetStats.totalSpent).toFixed(2)}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
    // const summaryData = useMemo(() => {
    //     if (!data?.length) {
    //         return {
    //             totalBudget: 0,
    //             currentSpend: 0,
    //             leftToSpend: 0,
    //             daysLeft: 0,
    //             spendPercentage: 0
    //         };
    //     }
    //
    //     const totalBudget = data.reduce((sum, budget) => sum + budget.budgetAmount, 0);
    //     const currentSpend = data.reduce((sum, budget) => sum + budget.actualAmount, 0);
    //     const leftToSpend = totalBudget - currentSpend;
    //
    //     // Calculate days left in the current month
    //     const today = new Date();
    //     const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    //     const daysLeft = Math.max(0, lastDayOfMonth.getDate() - today.getDate());
    //
    //     return {
    //         totalBudget,
    //         currentSpend,
    //         leftToSpend,
    //         daysLeft,
    //         spendPercentage: (currentSpend / totalBudget) * 100
    //     };
    // }, [data]);
    //
    // const chartData = {
    //     labels: ['Spent', 'Remaining'],
    //     datasets: [
    //         {
    //             data: [summaryData.currentSpend, summaryData.leftToSpend],
    //             backgroundColor: ['#FF6384', '#36A2EB'],
    //             hoverBackgroundColor: ['#FF6384', '#36A2EB'],
    //         },
    //     ],
    // };
    //
    // const options = {
    //     responsive: true,
    //     maintainAspectRatio: false,
    //     plugins: {
    //         legend: {
    //             position: 'bottom' as const,
    //         },
    //         tooltip: {
    //             callbacks: {
    //                 label: function(context: any) {
    //                     let label = context.label || '';
    //                     if (label) {
    //                         label += ': ';
    //                     }
    //                     if (context.parsed !== null) {
    //                         label += new Intl.NumberFormat('en-US', {
    //                             style: 'currency',
    //                             currency: 'USD'
    //                         }).format(context.parsed);
    //                     }
    //                     return label;
    //                 }
    //             }
    //         }
    //     },
    // };
    //
    // if (isLoading) {
    //     return (
    //         <Box>
    //             <Typography variant="h6" sx={{ mb: 2 }}>
    //                 Budget Statistics
    //             </Typography>
    //             <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, p: 3 }}>
    //                 <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', mb: 2 }} />
    //                 <Skeleton variant="text" width="60%" sx={{ mx: 'auto' }} />
    //                 <Skeleton variant="rectangular" height={60} sx={{ mx: 'auto', mt: 2 }} />
    //                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
    //                     <Skeleton variant="rectangular" width={80} height={40} />
    //                     <Skeleton variant="rectangular" width={80} height={40} />
    //                     <Skeleton variant="rectangular" width={80} height={40} />
    //                 </Box>
    //             </Box>
    //         </Box>
    //     );
    // }
    //
    // if (!summaryData.totalBudget) {
    //     return (
    //         <Box>
    //             <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: '0.875rem' }}>
    //                 Budget Statistics
    //             </Typography>
    //             <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, p: 3 }}>
    //                 <Typography variant="body1" textAlign="center">
    //                     No budget data available
    //                 </Typography>
    //             </Box>
    //         </Box>
    //     );
    // }
    //
    //
    // return (
    //     <Box>
    //         <Typography variant="h6" sx={{
    //             mb: 2,
    //             fontWeight: 'bold',
    //             fontSize: '0.875rem',
    //             textAlign: 'left',
    //             color: 'text.secondary' }}>
    //             Budget Statistics
    //         </Typography>
    //         <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, p: 3 }}>
    //             <Box sx={{ height: 200, mb: 2 }}>
    //                 <Pie data={chartData} options={options} />
    //             </Box>
    //             <Typography variant="body2" color="text.secondary" textAlign="center">
    //                 Left to Spend
    //             </Typography>
    //             <Typography variant="h4" fontWeight="bold" textAlign="center">
    //                 ${summaryData.leftToSpend.toFixed(2)}
    //             </Typography>
    //             <Typography variant="body2" textAlign="center" sx={{ mt: 1 }}>
    //                 That's ${(summaryData.leftToSpend / summaryData.daysLeft).toFixed(2)}/day
    //                 for the next {summaryData.daysLeft} days.
    //             </Typography>
    //             <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
    //                 <Box>
    //                     <Typography variant="body2" color="text.secondary">
    //                         Total Budget
    //                     </Typography>
    //                     <Typography variant="body1" fontWeight="bold">
    //                         ${summaryData.totalBudget.toFixed(2)}
    //                     </Typography>
    //                 </Box>
    //                 <Box>
    //                     <Typography variant="body2" color="text.secondary">
    //                         Spent
    //                     </Typography>
    //                     <Typography variant="body1" fontWeight="bold">
    //                         ${summaryData.currentSpend.toFixed(2)}
    //                     </Typography>
    //                 </Box>
    //                 <Box>
    //                     <Typography variant="body2" color="text.secondary">
    //                         Remaining
    //                     </Typography>
    //                     <Typography variant="body1" fontWeight="bold" color="primary">
    //                         ${summaryData.leftToSpend.toFixed(2)}
    //                     </Typography>
    //                 </Box>
    //             </Box>
    //         </Box>
    //     </Box>
    // );
    //
}

export default BudgetSummary;