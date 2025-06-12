import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';

interface BudgetItem {
    planned: number;
    actual: number;
    remaining: number;
}

interface WeekData {
    [category: string]: BudgetItem;
}

interface WeeklyBudget {
    week: number;
    data: WeekData;
    savingsPotential: number;
    accountBalance: number;
}

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
    borderRadius: '8px',
    overflow: 'hidden',
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
    backgroundColor: '#f5f5f5',
}));

const WeekHeaderCell = styled(TableCell)(({ theme }) => ({
    backgroundColor: '#800000',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1rem',
}));

const CategoryCell = styled(TableCell)(({ theme }) => ({
    fontWeight: '500',
}));

const PBTemplate: React.FC = () => {
    const [budgetData] = useState<WeeklyBudget[]>([
        {
            week: 1,
            data: {
                'Housing': { planned: 500, actual: 480, remaining: 20 },
                'Food': { planned: 200, actual: 185, remaining: 15 },
                'Transportation': { planned: 150, actual: 145, remaining: 5 },
                'Entertainment': { planned: 100, actual: 120, remaining: -20 },
            },
            savingsPotential: 25,
            accountBalance: 1850,
        },
        {
            week: 2,
            data: {
                'Housing': { planned: 500, actual: 500, remaining: 0 },
                'Food': { planned: 200, actual: 195, remaining: 5 },
                'Transportation': { planned: 150, actual: 140, remaining: 10 },
                'Entertainment': { planned: 100, actual: 85, remaining: 15 },
            },
            savingsPotential: 30,
            accountBalance: 1680,
        },
        {
            week: 3,
            data: {
                'Housing': { planned: 500, actual: 485, remaining: 15 },
                'Food': { planned: 200, actual: 210, remaining: -10 },
                'Transportation': { planned: 150, actual: 155, remaining: -5 },
                'Entertainment': { planned: 100, actual: 95, remaining: 5 },
            },
            savingsPotential: 5,
            accountBalance: 1485,
        },
        {
            week: 4,
            data: {
                'Housing': { planned: 500, actual: 475, remaining: 25 },
                'Food': { planned: 200, actual: 190, remaining: 10 },
                'Transportation': { planned: 150, actual: 148, remaining: 2 },
                'Entertainment': { planned: 100, actual: 110, remaining: -10 },
            },
            savingsPotential: 27,
            accountBalance: 1258,
        },
    ]);

    const getStatusColor = (remaining: number): 'success' | 'error' | 'warning' => {
        if (remaining > 0) return 'success';
        if (remaining < 0) return 'error';
        return 'warning';
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#800000' }}>
                Budget Planning Template
            </Typography>

            <TableContainer component={Paper} sx={{ boxShadow: '0 3px 10px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                <Table>
                    <StyledTableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Week</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Planned/Budgeted ($)</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actual Spending ($)</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Remaining ($)</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        </TableRow>
                    </StyledTableHead>
                    <TableBody>
                        {budgetData.map((weekData) => {
                            const categories = Object.entries(weekData.data);
                            return (
                                <React.Fragment key={weekData.week}>
                                    {categories.map(([category, data], index) => (
                                        <TableRow key={`week${weekData.week}-${category}`}>
                                            {index === 0 && (
                                                <WeekHeaderCell rowSpan={categories.length + 2}>
                                                    Week {weekData.week}
                                                </WeekHeaderCell>
                                            )}
                                            <CategoryCell>{category}</CategoryCell>
                                            <TableCell align="right">${data.planned.toFixed(2)}</TableCell>
                                            <TableCell align="right">${data.actual.toFixed(2)}</TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    color: data.remaining >= 0 ? 'green' : 'red',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                ${Math.abs(data.remaining).toFixed(2)}
                                                {data.remaining >= 0 ? ' under' : ' over'}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={data.remaining >= 0 ? 'On Track' : 'Over Budget'}
                                                    color={getStatusColor(data.remaining)}
                                                    size="small"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {/* Savings Potential Row */}
                                    <TableRow sx={{ backgroundColor: '#f0f8ff' }}>
                                        <TableCell colSpan={4} sx={{ fontWeight: 'bold', pl: 3 }}>
                                            Savings Potential
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                                            ${weekData.savingsPotential.toFixed(2)}
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>

                                    {/* Account Balance Row */}
                                    <TableRow sx={{ backgroundColor: '#fff8e1' }}>
                                        <TableCell colSpan={4} sx={{ fontWeight: 'bold', pl: 3 }}>
                                            Account Balance
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', color: '#800000' }}>
                                            ${weekData.accountBalance.toFixed(2)}
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>
                                </React.Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default PBTemplate;