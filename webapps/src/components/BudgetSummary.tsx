import {Box, Typography, CircularProgress, List, ListItem, ListItemText, ListItemIcon, Skeleton} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import React, {useMemo} from "react";
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import {BudgetRunnerResult} from "../services/BudgetRunnerService";

ChartJS.register(ArcElement, Tooltip, Legend);

interface BudgetSummaryProps {
    isLoading: boolean;
    data: BudgetRunnerResult[];
}

const BudgetSummary: React.FC<BudgetSummaryProps> = ({isLoading, data}) => {
    const summaryData = useMemo(() => {
        if (!data?.length) {
            return {
                totalBudget: 0,
                currentSpend: 0,
                leftToSpend: 0,
                daysLeft: 0,
                spendPercentage: 0
            };
        }

        const totalBudget = data.reduce((sum, budget) => sum + budget.budgetAmount, 0);
        const currentSpend = data.reduce((sum, budget) => sum + budget.actualAmount, 0);
        const leftToSpend = totalBudget - currentSpend;

        // Calculate days left in the current month
        const today = new Date();
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const daysLeft = Math.max(0, lastDayOfMonth.getDate() - today.getDate());

        return {
            totalBudget,
            currentSpend,
            leftToSpend,
            daysLeft,
            spendPercentage: (currentSpend / totalBudget) * 100
        };
    }, [data]);

    const chartData = {
        labels: ['Spent', 'Remaining'],
        datasets: [
            {
                data: [summaryData.currentSpend, summaryData.leftToSpend],
                backgroundColor: ['#FF6384', '#36A2EB'],
                hoverBackgroundColor: ['#FF6384', '#36A2EB'],
            },
        ],
    };

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

    if (!summaryData.totalBudget) {
        return (
            <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: '0.875rem' }}>
                    Budget Statistics
                </Typography>
                <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, p: 3 }}>
                    <Typography variant="body1" textAlign="center">
                        No budget data available
                    </Typography>
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
                    Left to Spend
                </Typography>
                <Typography variant="h4" fontWeight="bold" textAlign="center">
                    ${summaryData.leftToSpend.toFixed(2)}
                </Typography>
                <Typography variant="body2" textAlign="center" sx={{ mt: 1 }}>
                    That's ${(summaryData.leftToSpend / summaryData.daysLeft).toFixed(2)}/day
                    for the next {summaryData.daysLeft} days.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Total Budget
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                            ${summaryData.totalBudget.toFixed(2)}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Spent
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                            ${summaryData.currentSpend.toFixed(2)}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Remaining
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" color="primary">
                            ${summaryData.leftToSpend.toFixed(2)}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
    // return (
    //     <Box>
    //         <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: '0.875rem', color: 'text.secondary' }}>
    //             Budget Statistics
    //         </Typography>
    //         <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, overflow: 'hidden' }}>
    //             <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
    //                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
    //                     <Box>
    //                         <Typography variant="h4" fontWeight="bold">
    //                             ${leftToSpend.toFixed(2)}
    //                         </Typography>
    //                         <Typography variant="body2" color="text.secondary">
    //                             Left to Spend
    //                         </Typography>
    //                     </Box>
    //                     <Box sx={{ position: 'relative', width: 60, height: 60 }}>
    //                         <Wallet />
    //                         <Box
    //                             sx={{
    //                                 position: 'absolute',
    //                                 bottom: 0,
    //                                 left: 0,
    //                                 right: 0,
    //                                 height: `${100 - spendPercentage}%`,
    //                                 backgroundColor: 'rgba(255,255,255,0.7)',
    //                                 transition: 'height 0.5s'
    //                             }}
    //                         />
    //                     </Box>
    //                 </Box>
    //                 <Typography variant="caption" display="block" sx={{ mt: 1 }}>
    //                     of ${totalBudget.toFixed(2)}
    //                 </Typography>
    //                 <Typography variant="body2" sx={{ mt: 1 }}>
    //                     That's ${(leftToSpend / daysLeft).toFixed(2)}/day for the next {daysLeft} days of the month.
    //                 </Typography>
    //             </Box>
    //             <List disablePadding>
    //                 {[
    //                     { icon: <Add />, label: 'Spending Budget', value: totalBudget },
    //                     { icon: <Remove />, label: 'Current Spend', value: currentSpend },
    //                     { icon: <Remove />, label: 'Remaining', value: leftToSpend, color: 'success.main' }
    //                 ].map((item, index) => (
    //                     <ListItem key={index} sx={{ py: 1.5, px: 2, borderBottom: index !== 2 ? '1px solid' : 'none', borderColor: 'divider' }}>
    //                         <ListItemIcon sx={{ minWidth: 40 }}>
    //                             <Box sx={{ bgcolor: 'primary.light', borderRadius: '50%', p: 1, display: 'flex' }}>
    //                                 {item.icon}
    //                             </Box>
    //                         </ListItemIcon>
    //                         <ListItemText
    //                             primary={item.label}
    //                             secondary={
    //                                 <Typography variant="body1" fontWeight="bold" color={item.color || 'text.primary'}>
    //                                     ${item.value.toFixed(2)}
    //                                 </Typography>
    //                             }
    //                             primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
    //                         />
    //                     </ListItem>
    //                 ))}
    //             </List>
    //         </Box>
    //     </Box>
    // );
    // return (
    //     <Box>
    //         <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: '0.875rem', color: 'text.secondary' }}>
    //             Budget Statistics
    //         </Typography>
    //         <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, overflow: 'hidden' }}>
    //             <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
    //                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
    //                     <Box>
    //                         <Typography variant="h4" fontWeight="bold">
    //                             ${leftToSpend.toFixed(2)}
    //                         </Typography>
    //                         <Typography variant="body2" color="text.secondary">
    //                             Left to Spend
    //                         </Typography>
    //                     </Box>
    //                     <CircularProgress
    //                         variant="determinate"
    //                         value={progress}
    //                         size={60}
    //                         thickness={5}
    //                         sx={{ color: 'primary.main' }}
    //                     />
    //                 </Box>
    //                 <Typography variant="caption" display="block" sx={{ mt: 1 }}>
    //                     of ${totalBudget.toFixed(2)}
    //                 </Typography>
    //                 <Typography variant="body2" sx={{ mt: 1 }}>
    //                     That's ${(leftToSpend / daysLeft).toFixed(2)}/day for the next {daysLeft} days of the month.
    //                 </Typography>
    //             </Box>
    //             <List disablePadding>
    //                 {[
    //                     { icon: <Add />, label: 'Spending Budget', value: totalBudget },
    //                     { icon: <Remove />, label: 'Current Spend', value: currentSpend },
    //                     { icon: <Remove />, label: 'Remaining', value: leftToSpend, color: 'success.main' }
    //                 ].map((item, index) => (
    //                     <ListItem key={index} sx={{ py: 1.5, px: 2, borderBottom: index !== 2 ? '1px solid' : 'none', borderColor: 'divider' }}>
    //                         <ListItemIcon sx={{ minWidth: 40 }}>
    //                             <Box sx={{ bgcolor: 'primary.light', borderRadius: '50%', p: 1, display: 'flex' }}>
    //                                 {item.icon}
    //                             </Box>
    //                         </ListItemIcon>
    //                         <ListItemText
    //                             primary={item.label}
    //                             secondary={
    //                                 <Typography variant="body1" fontWeight="bold" color={item.color || 'text.primary'}>
    //                                     ${item.value.toFixed(2)}
    //                                 </Typography>
    //                             }
    //                             primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
    //                         />
    //                     </ListItem>
    //                 ))}
    //             </List>
    //         </Box>
    //     </Box>
    // );
    // return (
    //     <Box sx={{ maxWidth: 300, p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
    //         <Typography variant="h6" gutterBottom>Budget Statistics</Typography>
    //         <Box sx={{ position: 'relative', display: 'inline-flex', my: 2 }}>
    //             <CircularProgress
    //                 variant="determinate"
    //                 value={progress}
    //                 size={150}
    //                 thickness={4}
    //                 sx={{ color: 'primary.main' }}
    //             />
    //             <Box
    //                 sx={{
    //                     top: 0,
    //                     left: 0,
    //                     bottom: 0,
    //                     right: 0,
    //                     position: 'absolute',
    //                     display: 'flex',
    //                     alignItems: 'center',
    //                     justifyContent: 'center',
    //                     flexDirection: 'column',
    //                 }}
    //             >
    //                 <Typography variant="h5" component="div" fontWeight="bold">
    //                     ${leftToSpend.toFixed(2)}
    //                 </Typography>
    //                 <Typography variant="caption" component="div" color="text.secondary">
    //                     of ${totalBudget.toFixed(2)}
    //                 </Typography>
    //                 <Typography variant="body2">Left to Spend</Typography>
    //             </Box>
    //         </Box>
    //         <Typography variant="body2" align="center" sx={{ mt: 1, mb: 2 }}>
    //             That's ${(leftToSpend / daysLeft).toFixed(2)}/day for the next {daysLeft} days of the month.
    //         </Typography>
    //         <List disablePadding>
    //             <ListItem disablePadding>
    //                 <ListItemIcon>
    //                     <Add color="primary" />
    //                 </ListItemIcon>
    //                 <ListItemText primary="Spending Budget" secondary={`$${totalBudget.toFixed(2)}`} />
    //             </ListItem>
    //             <ListItem disablePadding>
    //                 <ListItemIcon>
    //                     <Remove color="primary" />
    //                 </ListItemIcon>
    //                 <ListItemText primary="Current Spend" secondary={`$${currentSpend.toFixed(2)}`} />
    //             </ListItem>
    //             <ListItem disablePadding>
    //                 <ListItemIcon>
    //                     <Remove color="primary" />
    //                 </ListItemIcon>
    //                 <ListItemText
    //                     primary="Remaining"
    //                     secondary={<Typography color="success.main">${leftToSpend.toFixed(2)}</Typography>}
    //                 />
    //             </ListItem>
    //         </List>
    //     </Box>
    // );
}

export default BudgetSummary;