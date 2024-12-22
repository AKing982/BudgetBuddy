
import React, {useEffect, useMemo, useState} from 'react';
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
    Checkbox, Chip, InputAdornment, CircularProgress,
} from '@mui/material';
import { Search, ArrowDownToLine, ChevronDown, Edit, XCircle } from 'lucide-react';
import Sidebar from "./Sidebar";
import CategoryDropdown from "./CategoryDropdown";
import TransactionService from '../services/TransactionService';
import {ArrowDownward, ArrowUpward} from "@mui/icons-material";



const TransactionsPage: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');


    useEffect(() => {
        setIsLoading(true);
        const fetchTransactions = async() => {
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

        const timeoutId = setTimeout(() => {
            fetchTransactions()
        }, 2000);
        return () => clearTimeout(timeoutId);
    }, []);



    const handleSearchTermChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newSearchTerm = event.target.value;
        setSearchTerm(newSearchTerm);
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    };

    const filteredTransactions = useMemo(() => {
        let searchTermLowerCase = searchTerm.toLowerCase().trim();
        return transactions.filter((transaction) => {
            const name = transaction.name ?? '';
            const category = transaction.categories[0]?.toLowerCase() ?? '';
            const merchantName = transaction.merchantName?.toLowerCase() ?? '';
            const amount = transaction.amount?.toString() ?? '';
            const date = formatDate(transaction.posted) ?? '';
            const authorizedDate = transaction.authorizedDate ? transaction.authorizedDate.toString() : '';
            return name.includes(searchTermLowerCase) ||
                category.includes(searchTermLowerCase) ||
                merchantName.includes(searchTermLowerCase) ||
                amount.includes(searchTermLowerCase) ||
                date.includes(searchTermLowerCase) ||
                authorizedDate.includes(searchTermLowerCase);
        });
    }, [transactions, searchTerm]);



    const headerConfig = [
        { label: 'Date', key: 'posted' },
        { label: 'Name', key: 'name' },
        { label: 'Category', key: 'categories' },
        { label: 'Actions', key: null },
        { label: 'Amount', key: 'amount' }
    ];


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
        <Box sx={{ p: 3,
            maxWidth: 'calc(100% - 240px)',
            ml: '240px',
            backgroundColor: '#F3F4F6'}}>
            <Sidebar />
            <Typography variant="h4" sx={{
                fontWeight: 'bold',
                color: '#3E2723', // Dark brown color for "Transactions"
                mb: 2,
                textShadow: '1px 1px 2px rgba (0,0,0,0.1)'
            }}>
                Transactions
            </Typography>

            <Paper
                elevation={0}
                sx={{
                    display: 'flex',
                    alignItems: 'center', // Light grey background
                    borderRadius: '8px',
                    p: '4px 16px',
                    mb: 3,
                    transition: 'box-shadow 0.3s ease-in-out',
                    '&:hover': {
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }
                }}
            >
                <Search size={20} />
                <TextField
                    variant="standard"
                    placeholder="Search your transactions..."
                    fullWidth
                    onChange={handleSearchTermChange}
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
                    {['Date', 'Category', 'Account', 'Amount'].map((label) => (
                        <Button
                            key={label}
                            variant="outlined"
                            sx={{
                                mr: 1,
                                borderRadius: 2,
                                color: '#3F51B5',
                                borderColor: '#3F51B5',
                                '&:hover': {
                                    backgroundColor: '#E8EAF6'
                                }
                            }}
                        >
                            {label}
                        </Button>
                    ))}
                </Box>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowDownToLine size={20} />}
                        sx={{
                            mr: 2,
                            borderRadius: 2,
                            color: '#3F51B5',
                            borderColor: '#3F51B5',
                            '&:hover': {
                                backgroundColor: '#E8EAF6'
                            }
                        }}
                    >
                        Export
                    </Button>
                    <Button
                        variant="outlined"
                        endIcon={<ChevronDown size={20} />}
                        sx={{
                            borderRadius: 2,
                            color: '#3F51B5',
                            borderColor: '#3F51B5',
                            '&:hover': {
                                backgroundColor: '#E8EAF6'
                            }
                        }}
                    >
                        Sort by date
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: 3,
                                                    borderRadius: 4,
                                                    overflow: 'hidden',
                                                    transition: 'box-shadow 0.3s ease-in-out',
                                                    '&:hover': {
                                                    boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
                                                    }}}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: 'background.paper' }}>
                            <TableCell padding="checkbox">
                                <Checkbox />
                            </TableCell>
                            {['Date', 'Name', 'Category', 'Actions', 'Amount'].map((header) => (
                                <TableCell
                                    key={header}
                                    sx={{
                                        fontWeight: 'bold',
                                        color: '#1A237E',
                                        fontSize: '0.95rem'
                                    }}
                                    align={header === 'Amount' ? 'right' : 'left'}
                                >
                                    {header}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    {/*<TableBody>*/}
                    {/*    {isLoading ? (*/}
                    {/*        <TableRow>*/}
                    {/*            <TableCell colSpan={6} align="center">*/}
                    {/*                <CircularProgress />*/}
                    {/*            </TableCell>*/}
                    {/*        </TableRow>*/}
                    {/*    ) : filteredTransactions.length > 0 ? (*/}
                    {/*        filteredTransactions.map((transaction) => (*/}
                    {/*            <TableRow*/}
                    {/*                key={transaction.transactionId}*/}
                    {/*                sx={{*/}
                    {/*                    '&:last-child td, &:last-child th': { border: 0 },*/}
                    {/*                    '&:hover': {*/}
                    {/*                        backgroundColor: '#F5F5F5'*/}
                    {/*                    },*/}
                    {/*                    transition: 'background-color 0.2s ease-in-out'*/}
                    {/*                }}*/}
                    {/*            >*/}
                    {/*                <TableCell padding="checkbox">*/}
                    {/*                    <Checkbox />*/}
                    {/*                </TableCell>*/}
                    {/*                <TableCell sx={{fontWeight: 'bold'}}>{formatDate(transaction.posted)}</TableCell>*/}
                    {/*                <TableCell sx={{fontWeight: 'bold'}}>*/}
                    {/*                    <Box sx={{ display: 'flex', alignItems: 'center' }}>*/}
                    {/*                        {transaction.logoURL && (*/}
                    {/*                            <img*/}
                    {/*                                src={transaction.logoURL}*/}
                    {/*                                alt={`${transaction.merchantName} logo`}*/}
                    {/*                                style={{ width: 24, height: 24, marginRight: 8, borderRadius: '50%' }}*/}
                    {/*                            />*/}
                    {/*                        )}*/}
                    {/*                        {transaction.name}*/}
                    {/*                    </Box>*/}
                    {/*                </TableCell>*/}
                    {/*                <TableCell>*/}
                    {/*                    <CategoryDropdown*/}
                    {/*                        category={transaction.categories[0]}*/}
                    {/*                        onCategoryChange={(newCategory) => handleCategoryChange(transaction.transactionId, newCategory)}*/}
                    {/*                    />*/}
                    {/*                </TableCell>*/}
                    {/*                <TableCell>*/}
                    {/*                    <IconButton size="small" sx={{ borderRadius: 2 }}>*/}
                    {/*                        <Edit size={16} />*/}
                    {/*                    </IconButton>*/}
                    {/*                    <IconButton size="small" sx={{ borderRadius: 2 }}>*/}
                    {/*                        <XCircle size={16} />*/}
                    {/*                    </IconButton>*/}
                    {/*                </TableCell>*/}
                    {/*                <TableCell align="right" sx={{fontWeight: 'bold'}}>*/}
                    {/*                    ${transaction.amount.toFixed(2)}*/}
                    {/*                </TableCell>*/}
                    {/*            </TableRow>*/}
                    {/*        ))*/}
                    {/*    ) : (*/}
                    {/*        <TableRow>*/}
                    {/*            <TableCell colSpan={6} align="center">*/}
                    {/*                No transactions found*/}
                    {/*            </TableCell>*/}
                    {/*        </TableRow>*/}
                    {/*    )}*/}
                    {/*</TableBody>*/}
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTransactions.map((transaction) => (
                                <TableRow
                                    key={transaction.transactionId}
                                    sx={{
                                        '&:last-child td, &:last-child th': { border: 0 },
                                        '&:hover': {
                                            backgroundColor: '#F5F5F5'
                                        },
                                        transition: 'background-color 0.2s ease-in-out'
                                    }}
                                >
                                    <TableCell padding="checkbox">
                                        <Checkbox />
                                    </TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>{formatDate(transaction.posted)}</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>
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
                                            onCategoryChange={(newCategory) => handleCategoryChange(transaction.transactionId, newCategory)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="small" sx={{ borderRadius: 2 }}>
                                            <Edit size={16} />
                                        </IconButton>
                                        <IconButton size="small" sx={{ borderRadius: 2 }}>
                                            <XCircle size={16} />
                                        </IconButton>
                                    </TableCell>
                                    <TableCell align="right" sx={{fontWeight: 'bold'}}>
                                        ${transaction.amount.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

}

export default TransactionsPage;