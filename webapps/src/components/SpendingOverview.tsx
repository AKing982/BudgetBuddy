import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface SpendingCategory {
    name: string;
    spent: number;
    limit: number;
}

const COLORS: string[] = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const SpendingOverview: React.FC = () => {
    // Dummy data
    const categories: SpendingCategory[] = [
        { name: 'Housing', spent: 1200, limit: 1500 },
        { name: 'Food', spent: 450, limit: 500 },
        { name: 'Transportation', spent: 200, limit: 300 },
        { name: 'Entertainment', spent: 180, limit: 150 },
        { name: 'Utilities', spent: 220, limit: 250 },
    ];

    const totalSpent = categories.reduce((sum, category) => sum + category.spent, 0);
    const totalLimit = categories.reduce((sum, category) => sum + category.limit, 0);

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: '0.875rem', color: 'text.secondary' }}>
                Spending Overview
            </Typography>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            ${totalSpent.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Spent of ${totalLimit.toLocaleString()} Limit
                        </Typography>
                    </Box>
                    <ResponsiveContainer width="50%" height={200}>
                        <PieChart>
                            <Pie
                                data={categories}
                                dataKey="spent"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                label
                            >
                                {categories.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Category</TableCell>
                                <TableCell align="right">Spent</TableCell>
                                <TableCell align="right">Limit</TableCell>
                                <TableCell align="right">Remaining</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {categories.map((category) => (
                                <TableRow key={category.name}>
                                    <TableCell component="th" scope="row">
                                        {category.name}
                                    </TableCell>
                                    <TableCell align="right">${category.spent.toLocaleString()}</TableCell>
                                    <TableCell align="right">${category.limit.toLocaleString()}</TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            color: category.spent <= category.limit ? 'green' : 'red',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        ${Math.abs(category.limit - category.spent).toLocaleString()}
                                        {category.spent <= category.limit ? ' left' : ' over'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default SpendingOverview;