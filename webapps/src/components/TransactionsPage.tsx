
import React, {useEffect, useState} from 'react';
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
    Checkbox, Chip, InputAdornment,
} from '@mui/material';
import { Search, ArrowDownToLine, ChevronDown, Edit, XCircle } from 'lucide-react';
import Sidebar from "./Sidebar";
import CategoryDropdown from "./CategoryDropdown";
import TransactionService from '../services/TransactionService';


const TransactionsPage: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([
        // {
        //     transactionId: '1',
        //     accountId: 'acc1',
        //     amount: 22.16,
        //     categories: ['Groceries'],
        //     date: '2023-09-11',
        //     name: 'WinCo',
        //     merchantName: 'WinCo Foods',
        //     pending: false,
        //     logoURL: 'https://example.com/winco-logo.png',
        //     authorizedDate: '2023-09-11',
        //     transactionType: 'purchase',
        // },
        // {
        //     transactionId: '2',
        //     accountId: 'acc2',
        //     amount: 19.54,
        //     categories: ['Loan Payment'],
        //     // categoryId: 'cat2',
        //     date: '2023-09-11',
        //     name: 'Affirm',
        //     merchantName: 'Affirm',
        //     pending: false,
        //     logoURL: 'https://example.com/affirm-logo.png',
        //     authorizedDate: '2023-09-11',
        //     transactionType: 'payment',
        // },
        // Add more mock transactions as needed
    ]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchTransactions = async() => {
            setIsLoading(true);
            try
            {
                const transactionService = TransactionService.getInstance();
                let userId = Number(sessionStorage.getItem('userId'));
                let startDate = transactionService.getStartDate();
                let endDate = new Date().toISOString().split('T')[0];
                console.log('EndDate: ', endDate);
                const response: Transaction[] = await transactionService.fetchTransactionsByUserAndDateRange(userId, startDate, endDate);
                console.log('Transaction Response: ', response);
                setTransactions(response || []);
            }catch(error){
                console.error('There was an error fetching the transactions from the server: ', error);
                throw error;
            }finally {
                setIsLoading(false);
            }
        };
        fetchTransactions();
    }, [])


    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    };

    const handleCategoryChange = (transactionId: string, newCategory: string) => {
        setTransactions(prevTransactions =>
            prevTransactions.map(transaction =>
                transaction.transactionId === transactionId
                    ? { ...transaction, categories: [newCategory] }
                    : transaction
            )
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 'calc(100% - 240px)', ml: '240px' }}>
            <Sidebar />
            <Typography variant="h4" sx={{
                fontWeight: 'bold',
                color: '#3E2723', // Dark brown color for "Transactions"
                mb: 2
            }}>
                Transactions
            </Typography>

            <Paper
                elevation={0}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#F5F5F5', // Light grey background
                    borderRadius: '8px',
                    p: '4px 16px',
                    mb: 3
                }}
            >
                <Search size={20} color="#9E9E9E" />
                <TextField
                    variant="standard"
                    placeholder="Search your transactions..."
                    fullWidth
                    InputProps={{
                        disableUnderline: true,
                        startAdornment: (
                            <InputAdornment position="start">
                                <Box sx={{ width: 8 }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiInputBase-input': {
                            pl: 1,
                            fontSize: '0.875rem',
                            '&::placeholder': {
                                color: '#9E9E9E',
                                opacity: 1,
                            },
                        },
                    }}
                />
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                    <Button variant="outlined" sx={{ mr: 1, borderRadius: 2 }}>Date</Button>
                    <Button variant="outlined" sx={{ mr: 1, borderRadius: 2 }}>Category</Button>
                    <Button variant="outlined" sx={{ mr: 1, borderRadius: 2 }}>Account</Button>
                    <Button variant="outlined" sx={{ borderRadius: 2 }}>Amount</Button>
                </Box>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowDownToLine size={20} />}
                        sx={{ mr: 2, borderRadius: 2 }}
                    >
                        Export
                    </Button>
                    <Button
                        variant="outlined"
                        endIcon={<ChevronDown size={20} />}
                        sx={{ borderRadius: 2 }}
                    >
                        Sort by date
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 4, overflow: 'hidden' }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: 'background.paper' }}>
                            <TableCell padding="checkbox">
                                <Checkbox />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactions.map((transaction) => (
                            <TableRow
                                key={transaction.transactionId}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
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
                                  <CategoryDropdown
                                      category={transaction.categories[0]}
                                      onCategoryChange={(newCategory) => handleCategoryChange(transaction.transactionId, newCategory)}/>
                                </TableCell>
                                <TableCell>
                                    <IconButton size="small" sx={{ borderRadius: 2 }}>
                                        <Edit size={16} />
                                    </IconButton>
                                    <IconButton size="small" sx={{ borderRadius: 2 }}>
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
    );

}

export default TransactionsPage;