import React, { useMemo, useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Divider,
    Chip,
    Stack,
    alpha,
    useTheme,
    Card,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    List,
    ListItemButton,
    ListItemText
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import StoreIcon from '@mui/icons-material/Store';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ViewListIcon from '@mui/icons-material/ViewList';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ReceiptSummary } from './GroceryBudgetTable';

interface ReceiptDetailPanelProps {
    receipt: ReceiptSummary | null;
    weekReceipts?: ReceiptSummary[]; // All receipts from the same week
}

type ViewMode = 'single' | 'week';

const maroonColor = '#800000';
const tealColor = '#0d9488';

const ReceiptDetailPanel: React.FC<ReceiptDetailPanelProps> = ({ receipt, weekReceipts }) => {
    const theme = useTheme();
    const [viewMode, setViewMode] = useState<ViewMode>('single');
    const [selectedReceipt, setSelectedReceipt] = useState<ReceiptSummary | null>(receipt);

    // Update selected receipt when prop changes
    React.useEffect(() => {
        setSelectedReceipt(receipt);
        setViewMode('single');
    }, [receipt]);

    // Calculate receipt summary for the currently selected receipt
    const receiptSummary = useMemo(() => {
        if (!selectedReceipt) return null;

        // Group items by category
        const categoryMap = new Map<string, { items: any[], total: number }>();

        selectedReceipt.items.forEach(item => {
            const category = item.category || 'Uncategorized';
            if (!categoryMap.has(category)) {
                categoryMap.set(category, { items: [], total: 0 });
            }
            const categoryData = categoryMap.get(category)!;
            categoryData.items.push(item);
            categoryData.total += item.itemCost;
        });

        const categories = Array.from(categoryMap.entries())
            .map(([name, data]) => ({
                name,
                items: data.items.sort((a, b) => b.itemCost - a.itemCost),
                total: data.total,
                itemCount: data.items.length,
                percentage: (data.total / selectedReceipt.totalCost) * 100
            }))
            .sort((a, b) => b.total - a.total);

        const sortedItems = [...selectedReceipt.items].sort((a, b) => b.itemCost - a.itemCost);
        const mostExpensive = sortedItems[0];
        const leastExpensive = sortedItems[sortedItems.length - 1];
        const avgItemCost = selectedReceipt.totalCost / selectedReceipt.itemCount;

        return {
            categories,
            mostExpensive,
            leastExpensive,
            avgItemCost
        };
    }, [selectedReceipt]);

    if (!receipt) {
        return (
            <Paper sx={{
                height: '100%',
                borderRadius: 4,
                boxShadow: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                p: 4,
                background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
            }}>
                <ReceiptLongIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
                <Typography variant="h6" color="text.secondary" fontWeight={500}>
                    Select a receipt
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mt: 1, textAlign: 'center' }}>
                    Click on a receipt to view details
                </Typography>
            </Paper>
        );
    }

    const subtotal = selectedReceipt?.totalCost || 0;
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    return (
        <Paper sx={{
            height: '100%',
            borderRadius: 4,
            boxShadow: 3,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <Box sx={{
                background: `linear-gradient(135deg, ${maroonColor} 0%, #a00000 100%)`,
                color: 'white',
                p: 3
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReceiptLongIcon />
                        <Typography variant="h6" fontWeight={600}>
                            {viewMode === 'week' ? 'Week Receipts' : 'Receipt Details'}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {viewMode === 'week' && (
                            <IconButton
                                size="small"
                                onClick={() => setViewMode('single')}
                                sx={{
                                    color: 'white',
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                                }}
                            >
                                <ArrowBackIcon />
                            </IconButton>
                        )}

                        {weekReceipts && weekReceipts.length > 1 && viewMode === 'single' && (
                            <IconButton
                                size="small"
                                onClick={() => setViewMode('week')}
                                sx={{
                                    color: 'white',
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                                }}
                                title="View all receipts from this week"
                            >
                                <ViewListIcon />
                            </IconButton>
                        )}
                    </Box>
                </Box>

                {viewMode === 'single' ? (
                    <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StoreIcon sx={{ fontSize: 18 }} />
                            <Typography variant="body1" fontWeight={500}>
                                {selectedReceipt?.storeName}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarTodayIcon sx={{ fontSize: 18 }} />
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                {selectedReceipt && format(parseISO(selectedReceipt.purchaseDate), 'EEEE, MMMM d, yyyy')}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocalOfferIcon sx={{ fontSize: 18 }} />
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                {selectedReceipt?.weekLabel}
                            </Typography>
                        </Box>
                    </Stack>
                ) : (
                    <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            {receipt.weekLabel} • {weekReceipts?.length} receipts
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Scrollable Content */}
            <Box sx={{
                flex: 1,
                overflowY: 'auto',
                p: 3,
                '&::-webkit-scrollbar': {
                    width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                    backgroundColor: 'rgba(0,0,0,0.05)',
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: tealColor,
                    borderRadius: '4px',
                    '&:hover': {
                        backgroundColor: '#0f766e',
                    },
                },
            }}>
                {/* SINGLE RECEIPT VIEW */}
                {viewMode === 'single' && receiptSummary && selectedReceipt && (
                    <>
                        {/* Quick Stats */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={4}>
                                <Card sx={{ bgcolor: alpha(tealColor, 0.05), borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                                    <ShoppingCartIcon sx={{ fontSize: 20, color: tealColor, mb: 0.5 }} />
                                    <Typography variant="h6" fontWeight={700}>
                                        {selectedReceipt.itemCount}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Items
                                    </Typography>
                                </Card>
                            </Grid>
                            <Grid item xs={4}>
                                <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                                    <AttachMoneyIcon sx={{ fontSize: 20, color: theme.palette.info.main, mb: 0.5 }} />
                                    <Typography variant="h6" fontWeight={700}>
                                        ${receiptSummary.avgItemCost.toFixed(2)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Avg
                                    </Typography>
                                </Card>
                            </Grid>
                            <Grid item xs={4}>
                                <Card sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.05), borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                                    <CategoryIcon sx={{ fontSize: 20, color: theme.palette.secondary.main, mb: 0.5 }} />
                                    <Typography variant="h6" fontWeight={700}>
                                        {receiptSummary.categories.length}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Categories
                                    </Typography>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Price Range */}
                        <Card sx={{
                            mb: 3,
                            bgcolor: alpha(tealColor, 0.03),
                            border: `1px solid ${alpha(tealColor, 0.2)}`,
                            borderRadius: 2,
                            p: 2
                        }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1.5 }}>
                                Price Range
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Most Expensive
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                                            {receiptSummary.mostExpensive.itemName}
                                        </Typography>
                                        <Typography variant="h6" fontWeight={700} color={maroonColor}>
                                            ${receiptSummary.mostExpensive.itemCost.toFixed(2)}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Least Expensive
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                                            {receiptSummary.leastExpensive.itemName}
                                        </Typography>
                                        <Typography variant="h6" fontWeight={700} color={tealColor}>
                                            ${receiptSummary.leastExpensive.itemCost.toFixed(2)}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Card>

                        {/* Items by Category */}
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Items by Category ({selectedReceipt.itemCount})
                        </Typography>

                        {receiptSummary.categories.map((category, index) => (
                            <Accordion
                                key={index}
                                defaultExpanded={index === 0}
                                sx={{
                                    mb: 1,
                                    borderRadius: 2,
                                    '&:before': { display: 'none' },
                                    boxShadow: 'none',
                                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{
                                        bgcolor: alpha(tealColor, 0.03),
                                        borderRadius: 2
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CategoryIcon sx={{ fontSize: 18, color: tealColor }} />
                                            <Typography variant="body2" fontWeight={600}>
                                                {category.name}
                                            </Typography>
                                            <Chip
                                                label={`${category.itemCount} items`}
                                                size="small"
                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                            />
                                        </Box>
                                        <Typography variant="body2" fontWeight={700} color={maroonColor}>
                                            ${category.total.toFixed(2)}
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 2 }}>
                                    <Table>
                                        <TableBody>
                                            {category.items.map((item, itemIndex) => (
                                                <TableRow
                                                    key={itemIndex}
                                                    sx={{
                                                        '&:last-child td': {
                                                            borderBottom: 0
                                                        }
                                                    }}
                                                >
                                                    <TableCell sx={{ py: 1.5, px: 0, border: 0 }}>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {item.itemName}
                                                        </Typography>
                                                        {item.itemDescription && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {item.itemDescription}
                                                            </Typography>
                                                        )}
                                                        {item.quantity && item.quantity > 1 && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                                Qty: {item.quantity}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ py: 1.5, px: 0, border: 0 }}>
                                                        <Typography variant="body2" fontWeight={600} color={maroonColor}>
                                                            ${item.itemCost.toFixed(2)}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </>
                )}

                {/* WEEK RECEIPTS VIEW */}
                {viewMode === 'week' && weekReceipts && (
                    <>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            All Receipts from {receipt.weekLabel} ({weekReceipts.length})
                        </Typography>

                        <Stack spacing={1.5}>
                            {weekReceipts.map((r) => (
                                <Card
                                    key={r.id}
                                    onClick={() => {
                                        setSelectedReceipt(r);
                                        setViewMode('single');
                                    }}
                                    sx={{
                                        p: 2,
                                        cursor: 'pointer',
                                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                        borderRadius: 2,
                                        bgcolor: selectedReceipt?.id === r.id ? alpha(tealColor, 0.05) : 'background.paper',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            boxShadow: 2,
                                            borderColor: alpha(tealColor, 0.3),
                                            bgcolor: alpha(tealColor, 0.08)
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <StoreIcon sx={{ fontSize: 18, color: tealColor }} />
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {r.storeName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {format(parseISO(r.purchaseDate), 'MMM d, yyyy')} • {r.itemCount} items
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Typography variant="body1" fontWeight={700} color={maroonColor}>
                                            ${r.totalCost.toFixed(2)}
                                        </Typography>
                                    </Box>
                                </Card>
                            ))}
                        </Stack>
                    </>
                )}
            </Box>

            {/* Receipt Total Section */}
            {viewMode === 'single' && (
                <Box sx={{
                    borderTop: `2px solid ${theme.palette.divider}`,
                    p: 3,
                    backgroundColor: alpha(tealColor, 0.02)
                }}>
                    <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Subtotal
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                                ${subtotal.toFixed(2)}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Tax (8%)
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                                ${tax.toFixed(2)}
                            </Typography>
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight={600} color={maroonColor}>
                                Total
                            </Typography>
                            <Typography variant="h6" fontWeight={700} color={maroonColor}>
                                ${total.toFixed(2)}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
            )}
        </Paper>
    );
};

export default ReceiptDetailPanel;


//
// import React from 'react';
// import {
//     Box,
//     Paper,
//     Typography,
//     Divider,
//     Table,
//     TableBody,
//     TableCell,
//     TableRow,
//     Chip,
//     Stack,
//     alpha,
//     useTheme
// } from '@mui/material';
// import { format, parseISO } from 'date-fns';
// import StoreIcon from '@mui/icons-material/Store';
// import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
// import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
// import LocalOfferIcon from '@mui/icons-material/LocalOffer';
// import { ReceiptSummary } from './GroceryBudgetTable';
//
// interface ReceiptDetailPanelProps {
//     receipt: ReceiptSummary | null;
// }
//
// const maroonColor = '#800000';
// const tealColor = '#0d9488';
//
// const ReceiptDetailPanel: React.FC<ReceiptDetailPanelProps> = ({ receipt }) => {
//     const theme = useTheme();
//
//     if (!receipt) {
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
//                 <ReceiptLongIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
//                 <Typography variant="h6" color="text.secondary" fontWeight={500}>
//                     Select a receipt
//                 </Typography>
//                 <Typography variant="body2" color="text.disabled" sx={{ mt: 1, textAlign: 'center' }}>
//                     Click on a receipt from the list to view detailed items
//                 </Typography>
//             </Paper>
//         );
//     }
//
//     const subtotal = receipt.totalCost;
//     const tax = subtotal * 0.08; // Assuming 8% tax (adjust as needed)
//     const total = subtotal + tax;
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
//                     <ReceiptLongIcon />
//                     <Typography variant="h6" fontWeight={600}>
//                         Receipt Details
//                     </Typography>
//                 </Box>
//
//                 <Stack spacing={1.5}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                         <StoreIcon sx={{ fontSize: 18 }} />
//                         <Typography variant="body1" fontWeight={500}>
//                             {receipt.storeName}
//                         </Typography>
//                     </Box>
//
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                         <CalendarTodayIcon sx={{ fontSize: 18 }} />
//                         <Typography variant="body2" sx={{ opacity: 0.9 }}>
//                             {format(parseISO(receipt.purchaseDate), 'EEEE, MMMM d, yyyy')}
//                         </Typography>
//                     </Box>
//
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                         <LocalOfferIcon sx={{ fontSize: 18 }} />
//                         <Typography variant="body2" sx={{ opacity: 0.9 }}>
//                             {receipt.weekLabel}
//                         </Typography>
//                     </Box>
//                 </Stack>
//             </Box>
//
//             {/* Items List */}
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
//                 <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                     Items ({receipt.itemCount})
//                 </Typography>
//
//                 <Table>
//                     <TableBody>
//                         {receipt.items.map((item, index) => (
//                             <TableRow
//                                 key={index}
//                                 sx={{
//                                     '&:hover': {
//                                         backgroundColor: alpha(tealColor, 0.04)
//                                     },
//                                     '&:last-child td': {
//                                         borderBottom: 0
//                                     }
//                                 }}
//                             >
//                                 <TableCell sx={{ py: 2, px: 0, border: 0 }}>
//                                     <Typography variant="body2" fontWeight={500}>
//                                         {item.itemName}
//                                     </Typography>
//                                     {item.category && (
//                                         <Chip
//                                             label={item.category}
//                                             size="small"
//                                             sx={{
//                                                 mt: 0.5,
//                                                 height: 20,
//                                                 fontSize: '0.7rem',
//                                                 backgroundColor: alpha(tealColor, 0.1),
//                                                 color: tealColor,
//                                                 fontWeight: 500
//                                             }}
//                                         />
//                                     )}
//                                     {item.itemDescription && (
//                                         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
//                                             {item.itemDescription}
//                                         </Typography>
//                                     )}
//                                     {item.quantity && item.quantity > 1 && (
//                                         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
//                                             Quantity: {item.quantity}
//                                         </Typography>
//                                     )}
//                                 </TableCell>
//                                 <TableCell align="right" sx={{ py: 2, px: 0, border: 0 }}>
//                                     <Typography variant="body2" fontWeight={600} color={maroonColor}>
//                                         ${item.itemCost.toFixed(2)}
//                                     </Typography>
//                                 </TableCell>
//                             </TableRow>
//                         ))}
//                     </TableBody>
//                 </Table>
//             </Box>
//
//             {/* Receipt Total Section */}
//             <Box sx={{
//                 borderTop: `2px solid ${theme.palette.divider}`,
//                 p: 3,
//                 backgroundColor: alpha(tealColor, 0.02)
//             }}>
//                 <Stack spacing={1.5}>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                         <Typography variant="body2" color="text.secondary">
//                             Subtotal
//                         </Typography>
//                         <Typography variant="body2" fontWeight={500}>
//                             ${subtotal.toFixed(2)}
//                         </Typography>
//                     </Box>
//
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                         <Typography variant="body2" color="text.secondary">
//                             Tax (8%)
//                         </Typography>
//                         <Typography variant="body2" fontWeight={500}>
//                             ${tax.toFixed(2)}
//                         </Typography>
//                     </Box>
//
//                     <Divider sx={{ my: 1 }} />
//
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                         <Typography variant="h6" fontWeight={600} color={maroonColor}>
//                             Total
//                         </Typography>
//                         <Typography variant="h6" fontWeight={700} color={maroonColor}>
//                             ${total.toFixed(2)}
//                         </Typography>
//                     </Box>
//                 </Stack>
//             </Box>
//         </Paper>
//     );
// };
//
// export default ReceiptDetailPanel;