
import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Button,
    IconButton,
    Typography,
    Box,
    Checkbox, Chip,
} from '@mui/material';
import { Search, ArrowDownToLine, ChevronDown, Edit, XCircle } from 'lucide-react';
import Sidebar from "./Sidebar";


const TransactionsPage: React.FC = () => {
    const [transactions] = useState<Transaction[]>([
        {
            transactionId: '1',
            accountId: 'acc1',
            amount: 22.16,
            categories: ['Groceries'],
            categoryId: 'cat1',
            date: '2023-09-11',
            name: 'WinCo',
            merchantName: 'WinCo Foods',
            pending: false,
            logoURL: 'https://example.com/winco-logo.png',
            authorizedDate: '2023-09-11',
            transactionType: 'purchase',
        },
        {
            transactionId: '2',
            accountId: 'acc2',
            amount: 19.54,
            categories: ['Loan Payment'],
            categoryId: 'cat2',
            date: '2023-09-11',
            name: 'Affirm',
            merchantName: 'Affirm',
            pending: false,
            logoURL: 'https://example.com/affirm-logo.png',
            authorizedDate: '2023-09-11',
            transactionType: 'payment',
        },
        // Add more mock transactions as needed
    ]);

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <Sidebar />
            <Box sx={{ flexGrow: 1, p: 3, maxWidth: 'calc(100% - 240px)', ml: '240px' }}>
                <Typography variant="h4" gutterBottom>
                    Transactions
                </Typography>

                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="Search your transactions..."
                        InputProps={{
                            startAdornment: <Search size={20} style={{ marginRight: 8 }} />,
                        }}
                        sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                            <Button variant="outlined" sx={{ mr: 1 }}>Date</Button>
                            <Button variant="outlined" sx={{ mr: 1 }}>Category</Button>
                            <Button variant="outlined" sx={{ mr: 1 }}>Account</Button>
                            <Button variant="outlined">Amount</Button>
                        </Box>
                        <Box>
                            <Button
                                variant="outlined"
                                startIcon={<ArrowDownToLine size={20} />}
                                sx={{ mr: 2 }}
                            >
                                Export
                            </Button>
                            <Button
                                variant="outlined"
                                endIcon={<ChevronDown size={20} />}
                            >
                                Sort by date
                            </Button>
                        </Box>
                    </Box>
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox />
                                </TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Actions</TableCell>
                                <TableCell align="right">Amount</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.map((transaction) => (
                                <TableRow key={transaction.transactionId}>
                                    <TableCell padding="checkbox">
                                        <Checkbox />
                                    </TableCell>
                                    <TableCell>{formatDate(transaction.date)}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            {transaction.logoURL && (
                                                <img
                                                    src={transaction.logoURL}
                                                    alt={`${transaction.merchantName} logo`}
                                                    style={{ width: 24, height: 24, marginRight: 8, borderRadius: '50%' }}
                                                />
                                            )}
                                            {transaction.name}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {transaction.categories.map((category, index) => (
                                            <Chip key={index} label={category} size="small" sx={{ mr: 0.5 }} />
                                        ))}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="small">
                                            <Edit size={16} />
                                        </IconButton>
                                        <IconButton size="small">
                                            <XCircle size={16} />
                                        </IconButton>
                                    </TableCell>
                                    <TableCell align="right">
                                        ${transaction.amount.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
}

export default TransactionsPage;