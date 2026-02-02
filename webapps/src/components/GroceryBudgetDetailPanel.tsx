// import React, { useMemo } from 'react';
// import {
//     Box,
//     Paper,
//     Typography,
//     Divider,
//     LinearProgress,
//     Stack,
//     alpha,
//     useTheme,
//     Card,
//     CardContent,
//     Chip,
//     Grid
// } from '@mui/material';
// import { format, parseISO } from 'date-fns';
// import AssignmentIcon from '@mui/icons-material/Assignment';
// import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
// import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
// import TrendingUpIcon from '@mui/icons-material/TrendingUp';
// import TrendingDownIcon from '@mui/icons-material/TrendingDown';
// import ReceiptIcon from '@mui/icons-material/Receipt';
// import CheckCircleIcon from '@mui/icons-material/CheckCircle';
// import WarningIcon from '@mui/icons-material/Warning';
// import ErrorIcon from '@mui/icons-material/Error';
// import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
// import LocalOfferIcon from '@mui/icons-material/LocalOffer';
// import StoreIcon from '@mui/icons-material/Store';
// import CategoryIcon from '@mui/icons-material/Category';
// import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
// import { WeekData } from './GroceryBudgetTable';
//
// interface GroceryBudgetDetailPanelProps {
//     week: WeekData | null;
//     allWeeks?: WeekData[]; // Optional: for comparison analytics
// }
//
// const maroonColor = '#800000';
// const tealColor = '#0d9488';
//
// const GroceryBudgetDetailPanel: React.FC<GroceryBudgetDetailPanelProps> = ({ week, allWeeks }) => {
//     const theme = useTheme();
//
//     // Calculate detailed analytics
//     const analytics = useMemo(() => {
//         if (!week) return null;
//
//         // Collect all items from all receipts for this week
//         const allItems = week.receipts.flatMap(receipt => receipt.items);
//
//         // Top 5 most expensive items
//         const topItems = [...allItems]
//             .sort((a, b) => b.itemCost - a.itemCost)
//             .slice(0, 5);
//
//         // Category breakdown
//         const categoryMap = new Map<string, number>();
//         allItems.forEach(item => {
//             const category = item.category || 'Uncategorized';
//             categoryMap.set(category, (categoryMap.get(category) || 0) + item.itemCost);
//         });
//         const categories = Array.from(categoryMap.entries())
//             .map(([name, total]) => ({ name, total }))
//             .sort((a, b) => b.total - a.total);
//
//         // Store breakdown
//         const storeMap = new Map<string, { total: number; itemCount: number }>();
//         week.receipts.forEach(receipt => {
//             const existing = storeMap.get(receipt.storeName) || { total: 0, itemCount: 0 };
//             storeMap.set(receipt.storeName, {
//                 total: existing.total + receipt.totalCost,
//                 itemCount: existing.itemCount + receipt.itemCount
//             });
//         });
//         const stores = Array.from(storeMap.entries())
//             .map(([name, data]) => ({
//                 name,
//                 total: data.total,
//                 itemCount: data.itemCount,
//                 avgPerItem: data.total / data.itemCount
//             }))
//             .sort((a, b) => b.total - a.total);
//
//         // Daily spending pattern
//         const dailyMap = new Map<string, number>();
//         week.receipts.forEach(receipt => {
//             const date = receipt.purchaseDate;
//             dailyMap.set(date, (dailyMap.get(date) || 0) + receipt.totalCost);
//         });
//         const dailySpending = Array.from(dailyMap.entries())
//             .map(([date, total]) => ({ date, total }))
//             .sort((a, b) => a.date.localeCompare(b.date));
//
//         // Comparison to other weeks (if available)
//         let weekComparison = null;
//         if (allWeeks && allWeeks.length > 1) {
//             const otherWeeks = allWeeks.filter(w => w.weekNumber !== week.weekNumber);
//             const avgSpending = otherWeeks.reduce((sum, w) => sum + w.actualSpent, 0) / otherWeeks.length;
//             const difference = week.actualSpent - avgSpending;
//             const percentDiff = (difference / avgSpending) * 100;
//
//             weekComparison = {
//                 avgSpending,
//                 difference,
//                 percentDiff,
//                 isAboveAvg: difference > 0
//             };
//         }
//
//         return {
//             topItems,
//             categories,
//             stores,
//             dailySpending,
//             weekComparison,
//             totalItems: allItems.length,
//             avgItemCost: allItems.length > 0 ? week.actualSpent / allItems.length : 0,
//             totalTrips: week.receipts.length
//         };
//     }, [week, allWeeks]);
//
//     if (!week) {
//         return (
//             <Paper sx={{
//                 height: '100%',
//                 borderRadius: 4,
//                 boxShadow: 3,
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 flexDirection: 'column',
//                 p: 4,
//                 background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
//             }}>
//                 <AssignmentIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
//                 <Typography variant="h6" color="text.secondary" fontWeight={500}>
//                     Select a week
//                 </Typography>
//                 <Typography variant="body2" color="text.disabled" sx={{ mt: 1, textAlign: 'center' }}>
//                     Click on a week to view detailed analytics
//                 </Typography>
//             </Paper>
//         );
//     }
//
//     const percentUsed = week.percentUsed;
//     const isOverBudget = week.remaining < 0;
//     const isWarning = percentUsed >= 70 && percentUsed < 90;
//     const isDanger = percentUsed >= 90;
//
//     const getStatusIcon = () => {
//         if (isDanger) return <ErrorIcon sx={{ color: '#dc2626' }} />;
//         if (isWarning) return <WarningIcon sx={{ color: '#f59e0b' }} />;
//         return <CheckCircleIcon sx={{ color: '#059669' }} />;
//     };
//
//     const getStatusText = () => {
//         if (isOverBudget) return 'Over Budget';
//         if (isDanger) return 'Approaching Limit';
//         if (isWarning) return 'Monitor Spending';
//         return 'On Track';
//     };
//
//     const getStatusColor = () => {
//         if (isDanger) return '#dc2626';
//         if (isWarning) return '#f59e0b';
//         return '#059669';
//     };
//
//     return (
//         <Paper sx={{
//             height: '100%',
//             borderRadius: 4,
//             boxShadow: 3,
//             overflow: 'hidden',
//             display: 'flex',
//             flexDirection: 'column'
//         }}>
//             {/* Header */}
//             <Box sx={{
//                 background: `linear-gradient(135deg, ${maroonColor} 0%, #a00000 100%)`,
//                 color: 'white',
//                 p: 3
//             }}>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
//                     <AssignmentIcon />
//                     <Typography variant="h6" fontWeight={600}>
//                         {week.weekLabel} Analytics
//                     </Typography>
//                 </Box>
//
//                 <Typography variant="body2" sx={{ opacity: 0.9 }}>
//                     {format(week.startDate, 'MMM d')} - {format(week.endDate, 'MMM d, yyyy')}
//                 </Typography>
//             </Box>
//
//             {/* Scrollable Content */}
//             <Box sx={{
//                 flex: 1,
//                 overflowY: 'auto',
//                 p: 3,
//                 '&::-webkit-scrollbar': {
//                     width: '8px',
//                 },
//                 '&::-webkit-scrollbar-track': {
//                     backgroundColor: 'rgba(0,0,0,0.05)',
//                 },
//                 '&::-webkit-scrollbar-thumb': {
//                     backgroundColor: tealColor,
//                     borderRadius: '4px',
//                     '&:hover': {
//                         backgroundColor: '#0f766e',
//                     },
//                 },
//             }}>
//                 {/* Status Card */}
//                 <Card sx={{
//                     background: `linear-gradient(135deg, ${getStatusColor()}15 0%, ${getStatusColor()}05 100%)`,
//                     border: `2px solid ${getStatusColor()}`,
//                     borderRadius: 3,
//                     mb: 3
//                 }}>
//                     <CardContent>
//                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                                 {getStatusIcon()}
//                                 <Box>
//                                     <Typography variant="caption" color="text.secondary">
//                                         Status
//                                     </Typography>
//                                     <Typography variant="h6" fontWeight={600} sx={{ color: getStatusColor() }}>
//                                         {getStatusText()}
//                                     </Typography>
//                                 </Box>
//                             </Box>
//                             <Typography variant="h5" fontWeight={700} sx={{ color: getStatusColor() }}>
//                                 {percentUsed.toFixed(0)}%
//                             </Typography>
//                         </Box>
//                     </CardContent>
//                 </Card>
//
//                 {/* Quick Stats Grid */}
//                 <Grid container spacing={2} sx={{ mb: 3 }}>
//                     <Grid item xs={6}>
//                         <Card sx={{ bgcolor: alpha(tealColor, 0.05), borderRadius: 2 }}>
//                             <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
//                                 <ShoppingCartIcon sx={{ fontSize: 20, color: tealColor, mb: 0.5 }} />
//                                 <Typography variant="h6" fontWeight={700}>
//                                     {analytics?.totalItems || 0}
//                                 </Typography>
//                                 <Typography variant="caption" color="text.secondary">
//                                     Items Purchased
//                                 </Typography>
//                             </CardContent>
//                         </Card>
//                     </Grid>
//                     <Grid item xs={6}>
//                         <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
//                             <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
//                                 <LocalOfferIcon sx={{ fontSize: 20, color: theme.palette.info.main, mb: 0.5 }} />
//                                 <Typography variant="h6" fontWeight={700}>
//                                     ${analytics?.avgItemCost.toFixed(2) || '0.00'}
//                                 </Typography>
//                                 <Typography variant="caption" color="text.secondary">
//                                     Avg per Item
//                                 </Typography>
//                             </CardContent>
//                         </Card>
//                     </Grid>
//                 </Grid>
//
//                 {/* Week Comparison (if available) */}
//                 {analytics?.weekComparison && (
//                     <Card sx={{
//                         mb: 3,
//                         bgcolor: analytics.weekComparison.isAboveAvg
//                             ? alpha('#f59e0b', 0.05)
//                             : alpha('#059669', 0.05),
//                         border: `1px solid ${analytics.weekComparison.isAboveAvg ? alpha('#f59e0b', 0.3) : alpha('#059669', 0.3)}`,
//                         borderRadius: 2
//                     }}>
//                         <CardContent>
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
//                                 <CompareArrowsIcon sx={{
//                                     fontSize: 18,
//                                     color: analytics.weekComparison.isAboveAvg ? '#f59e0b' : '#059669'
//                                 }} />
//                                 <Typography variant="subtitle2" fontWeight={600}>
//                                     vs Other Weeks
//                                 </Typography>
//                             </Box>
//                             <Typography variant="body2" color="text.secondary">
//                                 {analytics.weekComparison.isAboveAvg ? 'Spent ' : 'Saved '}
//                                 <strong style={{ color: analytics.weekComparison.isAboveAvg ? '#f59e0b' : '#059669' }}>
//                                     ${Math.abs(analytics.weekComparison.difference).toFixed(2)}
//                                 </strong>
//                                 {' '}({Math.abs(analytics.weekComparison.percentDiff).toFixed(1)}%)
//                                 {analytics.weekComparison.isAboveAvg ? ' more' : ' less'} than your {allWeeks!.length - 1}-week average
//                             </Typography>
//                         </CardContent>
//                     </Card>
//                 )}
//
//                 {/* Top Items This Week */}
//                 {analytics && analytics.topItems.length > 0 && (
//                     <Box sx={{ mb: 3 }}>
//                         <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                             Most Expensive Items
//                         </Typography>
//                         <Stack spacing={1.5}>
//                             {analytics.topItems.map((item, index) => (
//                                 <Card
//                                     key={index}
//                                     sx={{
//                                         p: 2,
//                                         bgcolor: 'background.paper',
//                                         border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
//                                         borderRadius: 2,
//                                         '&:hover': {
//                                             boxShadow: 2,
//                                             borderColor: alpha(maroonColor, 0.3)
//                                         }
//                                     }}
//                                 >
//                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//                                         <Box sx={{ flex: 1 }}>
//                                             <Typography variant="body2" fontWeight={600}>
//                                                 {item.itemName}
//                                             </Typography>
//                                             {item.category && (
//                                                 <Chip
//                                                     label={item.category}
//                                                     size="small"
//                                                     sx={{
//                                                         mt: 0.5,
//                                                         height: 18,
//                                                         fontSize: '0.65rem',
//                                                         bgcolor: alpha(tealColor, 0.1),
//                                                         color: tealColor
//                                                     }}
//                                                 />
//                                             )}
//                                             {item.itemDescription && (
//                                                 <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
//                                                     {item.itemDescription}
//                                                 </Typography>
//                                             )}
//                                         </Box>
//                                         <Typography variant="body1" fontWeight={700} color={maroonColor} sx={{ ml: 2 }}>
//                                             ${item.itemCost.toFixed(2)}
//                                         </Typography>
//                                     </Box>
//                                 </Card>
//                             ))}
//                         </Stack>
//                     </Box>
//                 )}
//
//                 {/* Category Breakdown */}
//                 {analytics && analytics.categories.length > 0 && (
//                     <Box sx={{ mb: 3 }}>
//                         <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                             Spending by Category
//                         </Typography>
//                         <Stack spacing={1.5}>
//                             {analytics.categories.map((category, index) => {
//                                 const percentage = (category.total / week.actualSpent) * 100;
//                                 return (
//                                     <Box key={index}>
//                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                                 <CategoryIcon sx={{ fontSize: 16, color: theme.palette.info.main }} />
//                                                 <Typography variant="body2" fontWeight={500}>
//                                                     {category.name}
//                                                 </Typography>
//                                             </Box>
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                                 <Typography variant="caption" color="text.secondary">
//                                                     {percentage.toFixed(1)}%
//                                                 </Typography>
//                                                 <Typography variant="body2" fontWeight={600} color={theme.palette.info.main}>
//                                                     ${category.total.toFixed(2)}
//                                                 </Typography>
//                                             </Box>
//                                         </Box>
//                                         <LinearProgress
//                                             variant="determinate"
//                                             value={percentage}
//                                             sx={{
//                                                 height: 6,
//                                                 borderRadius: 3,
//                                                 bgcolor: alpha(theme.palette.divider, 0.2),
//                                                 '& .MuiLinearProgress-bar': {
//                                                     borderRadius: 3,
//                                                     bgcolor: theme.palette.info.main
//                                                 }
//                                             }}
//                                         />
//                                     </Box>
//                                 );
//                             })}
//                         </Stack>
//                     </Box>
//                 )}
//
//                 {/* Store Breakdown */}
//                 {analytics && analytics.stores.length > 0 && (
//                     <Box sx={{ mb: 3 }}>
//                         <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                             Store Analysis
//                         </Typography>
//                         <Stack spacing={1.5}>
//                             {analytics.stores.map((store, index) => {
//                                 const mostExpensive = index === 0;
//                                 return (
//                                     <Card
//                                         key={index}
//                                         sx={{
//                                             p: 2,
//                                             bgcolor: mostExpensive ? alpha(maroonColor, 0.03) : 'background.paper',
//                                             border: `1px solid ${mostExpensive ? alpha(maroonColor, 0.2) : alpha(theme.palette.divider, 0.1)}`,
//                                             borderRadius: 2
//                                         }}
//                                     >
//                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                                 <StoreIcon sx={{ fontSize: 18, color: tealColor }} />
//                                                 <Typography variant="body2" fontWeight={600}>
//                                                     {store.name}
//                                                 </Typography>
//                                                 {mostExpensive && (
//                                                     <Chip
//                                                         label="Highest"
//                                                         size="small"
//                                                         sx={{
//                                                             height: 18,
//                                                             fontSize: '0.65rem',
//                                                             bgcolor: alpha(maroonColor, 0.1),
//                                                             color: maroonColor
//                                                         }}
//                                                     />
//                                                 )}
//                                             </Box>
//                                             <Typography variant="body1" fontWeight={700} color={maroonColor}>
//                                                 ${store.total.toFixed(2)}
//                                             </Typography>
//                                         </Box>
//                                         <Box sx={{ display: 'flex', gap: 2 }}>
//                                             <Typography variant="caption" color="text.secondary">
//                                                 {store.itemCount} items
//                                             </Typography>
//                                             <Typography variant="caption" color="text.secondary">
//                                                 Avg: ${store.avgPerItem.toFixed(2)}/item
//                                             </Typography>
//                                         </Box>
//                                     </Card>
//                                 );
//                             })}
//                         </Stack>
//                     </Box>
//                 )}
//
//                 {/* Daily Spending Pattern */}
//                 {analytics && analytics.dailySpending.length > 0 && (
//                     <Box>
//                         <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                             Daily Spending
//                         </Typography>
//                         <Stack spacing={1}>
//                             {analytics.dailySpending.map((day, index) => {
//                                 const percentage = (day.total / week.actualSpent) * 100;
//                                 return (
//                                     <Box key={index}>
//                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
//                                             <Typography variant="body2" fontWeight={500}>
//                                                 {format(parseISO(day.date), 'EEEE, MMM d')}
//                                             </Typography>
//                                             <Typography variant="body2" fontWeight={600} color={tealColor}>
//                                                 ${day.total.toFixed(2)}
//                                             </Typography>
//                                         </Box>
//                                         <LinearProgress
//                                             variant="determinate"
//                                             value={percentage}
//                                             sx={{
//                                                 height: 4,
//                                                 borderRadius: 2,
//                                                 bgcolor: alpha(theme.palette.divider, 0.2),
//                                                 '& .MuiLinearProgress-bar': {
//                                                     borderRadius: 2,
//                                                     bgcolor: tealColor
//                                                 }
//                                             }}
//                                         />
//                                     </Box>
//                                 );
//                             })}
//                         </Stack>
//                     </Box>
//                 )}
//             </Box>
//         </Paper>
//     );
// };
//
// export default GroceryBudgetDetailPanel;