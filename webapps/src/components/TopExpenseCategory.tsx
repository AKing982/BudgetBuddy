import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box} from "@mui/material";
import React from "react";

const dummyData = [
    { name: 'Housing', budgeted: 1500, actual: 1450, remaining: 50 },
    { name: 'Food', budgeted: 500, actual: 480, remaining: 20 },
    { name: 'Transportation', budgeted: 300, actual: 310, remaining: -10 },
    { name: 'Utilities', budgeted: 200, actual: 190, remaining: 10 },
    { name: 'Entertainment', budgeted: 150, actual: 200, remaining: -50 },
];

const TopExpenseCategory: React.FC = () => {

    const maroonColor = '#800000';
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
                        {dummyData.map((row) => (
                            <TableRow key={row.name}>
                                <TableCell component="th" scope="row">
                                    {row.name}
                                </TableCell>
                                <TableCell align="right">${row.budgeted.toFixed(2)}</TableCell>
                                <TableCell align="right">${row.actual.toFixed(2)}</TableCell>
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
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default TopExpenseCategory;