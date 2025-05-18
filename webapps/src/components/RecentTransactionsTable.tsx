import React, {useEffect, useState} from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    IconButton,
    Typography,
    Box, CircularProgress, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent
} from '@mui/material';
import {
    ShoppingCart,
    Edit,
    Block,
    Receipt,
    CreditCard,
    ShoppingBag,
    ContentCut,
    LocalBar,
    Code,
    ChevronRight
} from '@mui/icons-material';
import PlaidService from "../services/PlaidService";
import TransactionRow from "./TransactionRow";
import TransactionService from "../services/TransactionService";
import {Transaction} from '../utils/Items';
// interface Transaction {
//     transactionId: string;
//     accountId: string;
//     amount: number;
//     categories: string[];
//     categoryId: string;
//     posted: Date | string;
//     name: string;
//     merchantName: string;
//     pending: boolean;
//     logoURL: string;
//     authorizedDate: Date | string;
//     transactionType: string;
// }

const transactions = [
    { date: '8/8', name: 'WinCo', amount: '$25.47', icon: <ShoppingCart sx={{ color: '#EF4444' }} /> },
    { date: '8/7', name: 'WinCo', amount: '$6.26', icon: <ShoppingCart sx={{ color: '#EF4444' }} /> },
    { date: '8/6', name: 'Questargas Questargas Questargas Questargas, 08-06-2024 @ 0:00 Tr...', amount: '$12.79', icon: <Receipt sx={{ color: '#3B82F6' }} /> },
    { date: '8/6', name: 'American Express Card Payment', amount: '$98.55', icon: <CreditCard sx={{ color: '#3B82F6' }} /> },
    { date: '8/6', name: 'Famous Footwear', amount: '$13.60', icon: <ShoppingBag sx={{ color: '#F59E0B' }} /> },
    { date: '8/6', name: 'WinCo', amount: '$15.05', icon: <ShoppingCart sx={{ color: '#EF4444' }} /> },
    { date: '8/6', name: 'Great Clips', amount: '$26.00', icon: <ContentCut sx={{ color: '#10B981' }} /> },
    { date: '8/6', name: 'Olive Garden', amount: '$17.30', icon: <LocalBar sx={{ color: '#6366F1' }} /> },
    { date: '8/6', name: 'JetBrains', amount: '$10.73', icon: <Code sx={{ color: '#3B82F6' }} /> },
    { date: '8/4', name: 'Pin Purchase Harmons - Dist 11453 S. Parkway P South J, 08-04-2024 ...', amount: '$3.90', icon: <ShoppingCart sx={{ color: '#EF4444' }} /> },
];

const getActionIcons = () => {

}

const RecentTransactionsTable: React.FC = () => {
    const [plaidTransactions, setPlaidTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState<number>(10);
    const [selectedMonth, setSelectedMonth] = useState<string>(''); // Format: "YYYY-MM"
    const transactionService = TransactionService.getInstance();

    const getCurrentMonth = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    };

    const getMonthOptions = () => {
        const options = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            options.push({ value, label });
        }
        return options;
    };

    const getMonthRange = (month: string) => {
        const [year, monthNum] = month.split('-').map(Number);
        const start = new Date(year, monthNum - 1, 1).toISOString().split('T')[0];
        const end = new Date(year, monthNum, 0).toISOString().split('T')[0];
        return { start, end };
    };

    // useEffect(() => {
    //     if (!selectedMonth) {
    //         setSelectedMonth(getCurrentMonth());
    //         return;
    //     }
    //
    //     const fetchData = async () => {
    //         setIsLoading(true);
    //         setError(null);
    //         try {
    //             const userId = Number(sessionStorage.getItem('userId'));
    //             if (isNaN(userId)) {
    //                 throw new Error('Invalid user ID');
    //             }
    //             const { start, end } = getMonthRange(selectedMonth);
    //             const fetchTransactions = await transactionService.fetchTransactionsByUserAndDateRange(userId, start, end);
    //             setPlaidTransactions(fetchTransactions);
    //             console.log('Transactions for', selectedMonth, ':', fetchTransactions);
    //         } catch (error) {
    //             console.error('Error fetching transactions:', error);
    //             setError('Failed to load transactions. Please try again later.');
    //         } finally {
    //             setIsLoading(false);
    //         }
    //     };
    //
    //     const timer = setTimeout(() => {
    //         fetchData();
    //     }, 1000);
    //
    //     return () => clearTimeout(timer);
    // }, [selectedMonth]);

    const handleSeeMore = () => {
        setVisibleCount(prev => prev + 10);
    };

    // Updated handler with SelectChangeEvent<string>
    const handleMonthChange = (event: SelectChangeEvent<string>) => {
        setVisibleCount(10); // Reset visible count when changing months
        setSelectedMonth(event.target.value);
    };

    const visibleTransactions = plaidTransactions.slice(0, visibleCount);
    const hasMore = plaidTransactions.length > visibleCount;
    const monthOptions = getMonthOptions();

    return (
        <Paper elevation={3} sx={{ maxWidth: 1050, margin: 'auto', mt: 4, borderRadius: '12px', overflow: 'hidden' }}>
            <Box p={3} sx={{ backgroundColor: '#F9FAFB' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#111827' }}>
                        Recent Transactions
                    </Typography>
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel id="month-select-label">Select Month</InputLabel>
                        <Select
                            labelId="month-select-label"
                            value={selectedMonth}
                            label="Select Month"
                            onChange={handleMonthChange}
                            sx={{ borderRadius: '8px' }}
                        >
                            {monthOptions.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
                    You've had {plaidTransactions.length} transactions in{' '}
                    {monthOptions.find(opt => opt.value === selectedMonth)?.label || 'this month'}
                </Typography>
                <TableContainer component={Box}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#4B5563', borderBottom: '2px solid #E5E7EB' }}>
                                    Date
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#4B5563', borderBottom: '2px solid #E5E7EB' }}>
                                    Name
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{ fontWeight: 'bold', color: '#4B5563', borderBottom: '2px solid #E5E7EB' }}
                                >
                                    Amount
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{ fontWeight: 'bold', color: '#4B5563', borderBottom: '2px solid #E5E7EB' }}
                                >
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4}>
                                        <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                                            <CircularProgress />
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={4}>
                                        <Typography color="error" align="center">
                                            {error}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : visibleTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4}>
                                        <Typography align="center" sx={{ color: '#6B7280' }}>
                                            No transactions found for this period.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                visibleTransactions.map(transaction => (
                                    <TransactionRow key={transaction.transactionId} transaction={transaction} />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {hasMore && (
                    <Box mt={2} display="flex" justifyContent="center">
                        <Button
                            variant="outlined"
                            onClick={handleSeeMore}
                            sx={{
                                textTransform: 'none',
                                borderColor: '#D1D5DB',
                                color: '#374151',
                                '&:hover': {
                                    borderColor: '#9CA3AF',
                                    backgroundColor: '#F3F4F6',
                                },
                            }}
                        >
                            See more transactions
                        </Button>
                    </Box>
                )}
            </Box>
        </Paper>
    );
};


// const RecentTransactionsTable: React.FC = () => {
//     const [plaidTransactions, setPlaidTransactions] = useState<Transaction[]>([]);
//     const [isLoading, setIsLoading] = useState<boolean>(false);
//     const [error, setError] = useState<string | null>(null);
//     const [visibleCount, setVisibleCount] = useState<number>(10); // For "See more"
//     const transactionService = TransactionService.getInstance();
//
//     // Get the current month's start and end dates
//     const getCurrentMonthRange = () => {
//         const now = new Date();
//         const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
//         const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
//         return { start, end };
//     };
//
//     useEffect(() => {
//         const fetchData = async () => {
//             setIsLoading(true);
//             setError(null);
//             try {
//                 const userId = Number(sessionStorage.getItem('userId'));
//                 if (isNaN(userId)) {
//                     throw new Error('Invalid user ID');
//                 }
//                 const { start, end } = getCurrentMonthRange();
//                 const fetchTransactions = await transactionService.fetchTransactionsByUserAndDateRange(userId, start, end);
//                 setPlaidTransactions(fetchTransactions);
//                 console.log('Transactions: ', fetchTransactions);
//             } catch (error) {
//                 console.error('Error fetching transactions:', error);
//                 setError('Failed to load transactions. Please try again later.');
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//
//         // Delay for demo purposes (remove in production if not needed)
//         const timer = setTimeout(() => {
//             fetchData();
//         }, 1000);
//
//         return () => clearTimeout(timer);
//     }, []);
//
//     const handleSeeMore = () => {
//         setVisibleCount(prev => prev + 10); // Show 10 more transactions
//     };
//
//     const visibleTransactions = plaidTransactions.slice(0, visibleCount);
//     const hasMore = plaidTransactions.length > visibleCount;
//
//     return (
//         <Paper elevation={3} sx={{ maxWidth: 1050, margin: 'auto', mt: 4, borderRadius: '12px', overflow: 'hidden' }}>
//             <Box p={3} sx={{ backgroundColor: '#F9FAFB' }}>
//                 <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
//                     <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#111827' }}>
//                         Recent Transactions
//                     </Typography>
//                     <Typography variant="body2" sx={{ color: '#6B7280' }}>
//                         You've had {plaidTransactions.length} transactions so far this month
//                     </Typography>
//                 </Box>
//                 <TableContainer component={Box}>
//                     <Table>
//                         <TableHead>
//                             <TableRow>
//                                 <TableCell sx={{ fontWeight: 'bold', color: '#4B5563', borderBottom: '2px solid #E5E7EB' }}>
//                                     Date
//                                 </TableCell>
//                                 <TableCell sx={{ fontWeight: 'bold', color: '#4B5563', borderBottom: '2px solid #E5E7EB' }}>
//                                     Name
//                                 </TableCell>
//                                 <TableCell
//                                     align="right"
//                                     sx={{ fontWeight: 'bold', color: '#4B5563', borderBottom: '2px solid #E5E7EB' }}
//                                 >
//                                     Amount
//                                 </TableCell>
//                                 <TableCell
//                                     align="right"
//                                     sx={{ fontWeight: 'bold', color: '#4B5563', borderBottom: '2px solid #E5E7EB' }}
//                                 >
//                                     Actions
//                                 </TableCell>
//                             </TableRow>
//                         </TableHead>
//                         <TableBody>
//                             {isLoading ? (
//                                 <TableRow>
//                                     <TableCell colSpan={4}>
//                                         <Box display="flex" justifyContent="center" alignItems="center" height={200}>
//                                             <CircularProgress />
//                                         </Box>
//                                     </TableCell>
//                                 </TableRow>
//                             ) : error ? (
//                                 <TableRow>
//                                     <TableCell colSpan={4}>
//                                         <Typography color="error" align="center">
//                                             {error}
//                                         </Typography>
//                                     </TableCell>
//                                 </TableRow>
//                             ) : visibleTransactions.length === 0 ? (
//                                 <TableRow>
//                                     <TableCell colSpan={4}>
//                                         <Typography align="center" sx={{ color: '#6B7280' }}>
//                                             No transactions found for this period.
//                                         </Typography>
//                                     </TableCell>
//                                 </TableRow>
//                             ) : (
//                                 visibleTransactions.map(transaction => (
//                                     <TransactionRow key={transaction.transactionId} transaction={transaction} />
//                                 ))
//                             )}
//                         </TableBody>
//                     </Table>
//                 </TableContainer>
//                 {hasMore && (
//                     <Box mt={2} display="flex" justifyContent="center">
//                         <Button
//                             variant="outlined"
//                             onClick={handleSeeMore}
//                             sx={{
//                                 textTransform: 'none',
//                                 borderColor: '#D1D5DB',
//                                 color: '#374151',
//                                 '&:hover': {
//                                     borderColor: '#9CA3AF',
//                                     backgroundColor: '#F3F4F6',
//                                 },
//                             }}
//                         >
//                             See more transactions
//                         </Button>
//                     </Box>
//                 )}
//             </Box>
//         </Paper>
//     );
// };
//

export default RecentTransactionsTable;