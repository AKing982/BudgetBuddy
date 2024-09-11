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
    Box, CircularProgress
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

interface Transaction {
    transactionId: string;
    accountId: string;
    amount: number;
    categories: string[];
    categoryId: string;
    date: Date | string;
    name: string;
    merchantName: string;
    pending: boolean;
    logoUrl: string;
    authorizedDate: Date | string;
    transactionType: string;
}

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



const RecentTransactionsTable: React.FC = () => {

    const [plaidTransactions, setPlaidTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const plaidService = new PlaidService();

    const fetchMonthBeginning = (year: number, month: number) : string => {
        return new Date(year, month - 1, 1).toISOString().split('T')[0];
    }

    const fetchMonthEnding = (year: number, month: number) : string => {
        return new Date(year, month, 0).toISOString().split('T')[0];
    }

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const userId = Number(sessionStorage.getItem('userId'));
                const fetchTransactions = await plaidService.getTransactions(
                    fetchMonthBeginning(2024, 1),
                    fetchMonthEnding(2024, 9),
                    userId
                );
                setPlaidTransactions(fetchTransactions);
                console.log('Transactions: ', fetchTransactions);
            } catch (error) {
                console.error("Error fetching transactions:", error);
            }
        };

        const timer = setTimeout(() => {
            fetchData().finally(() => {
                setIsLoading(false);
            })
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <Paper elevation={3} sx={{ maxWidth: 1050, margin: 'auto', mt: 4, borderRadius: '12px', overflow: 'hidden' }}>
            <Box p={3} sx={{ backgroundColor: '#F9FAFB' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#111827' }}>Recent Transactions</Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>You've had 26 transactions so far this month</Typography>
                </Box>
                <TableContainer component={Box}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#4B5563', borderBottom: '2px solid #E5E7EB' }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#4B5563', borderBottom: '2px solid #E5E7EB' }}>Name</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#4B5563', borderBottom: '2px solid #E5E7EB' }}>Amount</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#4B5563', borderBottom: '2px solid #E5E7EB' }}>Actions</TableCell>
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
                            ) : (
                                plaidTransactions.slice(0, 10).map((transaction) => (
                                    <TransactionRow key={transaction.transactionId} transaction={transaction} />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box mt={2} display="flex" justifyContent="center">
                    <Button
                        variant="outlined"
                        sx={{
                            textTransform: 'none',
                            borderColor: '#D1D5DB',
                            color: '#374151',
                            '&:hover': {
                                borderColor: '#9CA3AF',
                                backgroundColor: '#F3F4F6'
                            }
                        }}
                    >
                        See more transactions
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default RecentTransactionsTable;