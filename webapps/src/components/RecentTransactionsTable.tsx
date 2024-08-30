import React from 'react';
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
    Box
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

interface Transaction {
    date: string;
    name: string;
    amount: string;
    icon: React.ReactNode;
}

const transactions: Transaction[] = [
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
                            {transactions.map((transaction, index) => (
                                <TableRow
                                    key={index}
                                    sx={{
                                        '&:hover': { backgroundColor: '#F3F4F6' },
                                        '&:last-child td, &:last-child th': { border: 0 }
                                    }}
                                >
                                    <TableCell sx={{ color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>{transaction.date}</TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #E5E7EB' }}>
                                        <Box display="flex" alignItems="center">
                                            {transaction.icon}
                                            <Typography variant="body2" sx={{ ml: 1, color: '#111827' }}>{transaction.name}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'medium', color: '#111827', borderBottom: '1px solid #E5E7EB' }}>{transaction.amount}</TableCell>
                                    <TableCell align="right" sx={{ borderBottom: '1px solid #E5E7EB' }}>
                                        <IconButton size="small" sx={{ color: '#6B7280' }}><Edit /></IconButton>
                                        <IconButton size="small" sx={{ color: '#6B7280' }}><Block /></IconButton>
                                        <IconButton size="small" sx={{ color: '#6B7280' }}><ChevronRight /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
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