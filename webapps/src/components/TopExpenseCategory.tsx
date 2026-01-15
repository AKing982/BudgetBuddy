import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Box,
    Skeleton
} from "@mui/material";
import React, {useMemo} from "react";

const dummyData = [
    { name: 'Housing', budgeted: 1500, actual: 1450, remaining: 50 },
    { name: 'Food', budgeted: 500, actual: 480, remaining: 20 },
    { name: 'Transportation', budgeted: 300, actual: 310, remaining: -10 },
    { name: 'Utilities', budgeted: 200, actual: 190, remaining: 10 },
    { name: 'Entertainment', budgeted: 150, actual: 200, remaining: -50 },
];

interface TopExpenseCategoryProps {
    isLoading: boolean;
    categories: {
        categoryName: string;
        budgetedAmount: number;
        actualAmount: number;
        remainingAmount: number;
        startDate: number[];
        endDate: number[];
        isActive: boolean;
    }[];
}

const TopExpenseCategory: React.FC<TopExpenseCategoryProps> = ({isLoading, categories}) => {

    const maroonColor = '#800000';
    const processedCategories = useMemo(() => {
        if (!categories?.length) return [];

        return categories
            .map(category => ({
                name: category.categoryName,
                budgeted: category.budgetedAmount || 0,
                actual: category.actualAmount || 0,
                remaining: category.remainingAmount || 0
            }))
            .sort((a, b) => b.actual - a.actual)
            .slice(0, 5);
    }, [categories]);

    if (isLoading) {
        return (
            <Box>
                <Typography variant="h5" component="h2" gutterBottom>
                    Top Expense Categories
                </Typography>
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h5" component="h2" gutterBottom sx={{
                fontWeight: 'bold',
                mb: 2,
                textAlign: 'left',
                fontSize: '0.875rem',
                color: 'text.secondary'}}>
                Top Expense Categories
            </Typography>
            <TableContainer component={Paper} sx={{
                boxShadow: 3,
                borderRadius: 4,
                overflow: 'hidden',
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': {
                    boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
                }
            }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{backgroundColor: 'background.paper'}}>
                            <TableCell sx={{
                                fontWeight: 'bold',
                                color: maroonColor,
                                fontSize: '0.95rem'
                            }}>Name</TableCell>
                            <TableCell align="right" sx={{
                                fontWeight: 'bold',
                                color: maroonColor,
                                fontSize: '0.95rem'
                            }}>Budgeted</TableCell>
                            <TableCell align="right" sx={{
                                fontWeight: 'bold',
                                color: maroonColor,
                                fontSize: '0.95rem'
                            }}>Actual</TableCell>
                            <TableCell align="right" sx={{
                                fontWeight: 'bold',
                                color: maroonColor,
                                fontSize: '0.95rem'
                            }}>Remaining</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {processedCategories.length > 0 ? (
                            processedCategories.map((row) => (
                                <TableRow key={row.name}>
                                    <TableCell component="th" scope="row">
                                        {row.name}
                                    </TableCell>
                                    <TableCell align="right">
                                        ${row.budgeted.toFixed(2)}
                                    </TableCell>
                                    <TableCell align="right">
                                        ${Math.abs(row.actual).toFixed(2)}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            color: row.remaining >= 0 ? 'green' : 'red',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        ${Math.abs(row.remaining).toFixed(2)}
                                        {row.remaining >= 0 ? ' under' : ' over'}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    No expense categories found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default TopExpenseCategory;