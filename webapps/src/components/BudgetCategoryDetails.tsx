import React, { useState } from 'react';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    LinearProgress,
    Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
}

interface CategoryProps {
    name: string;
    budget: number;
    spent: number;
    transactions: Transaction[];
}

const BudgetCategoryDetails: React.FC<CategoryProps> = ({ name, budget, spent, transactions }) => {
    const [expanded, setExpanded] = useState(false);
    const percentageSpent = (spent / budget) * 100;

    const handleChange = () => {
        setExpanded(!expanded);
    };

    return (
        <Accordion expanded={expanded} onChange={handleChange}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`${name}-content`}
                id={`${name}-header`}
            >
                <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1">{name}</Typography>
                        <Typography variant="body2">${spent.toFixed(2)} / ${budget.toFixed(2)}</Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={percentageSpent}
                        color={percentageSpent > 90 ? 'error' : 'primary'}
                    />
                    <Typography variant="body2" align="right" sx={{ mt: 0.5 }}>
                        {percentageSpent.toFixed(1)}% Spent
                    </Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell align="right">Amount</TableCell>
                                <TableCell align="right">Running Total</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.map((transaction, index) => {
                                const runningTotal = transactions
                                    .slice(0, index + 1)
                                    .reduce((sum, t) => sum + t.amount, 0);
                                return (
                                    <TableRow key={transaction.id}>
                                        <TableCell component="th" scope="row">
                                            {transaction.date}
                                        </TableCell>
                                        <TableCell>{transaction.description}</TableCell>
                                        <TableCell align="right">${transaction.amount.toFixed(2)}</TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                color: runningTotal > budget ? 'error.main' : 'inherit',
                                                fontWeight: runningTotal > budget ? 'bold' : 'normal'
                                            }}
                                        >
                                            ${runningTotal.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </AccordionDetails>
        </Accordion>
    );
};

// Example usage
const ExampleCategoryList: React.FC = () => {
    const categories = [
        {
            name: "Groceries",
            budget: 500,
            spent: 450,
            transactions: [
                { id: "1", date: "2023-09-01", description: "Supermarket", amount: 120 },
                { id: "2", date: "2023-09-08", description: "Local market", amount: 80 },
                { id: "3", date: "2023-09-15", description: "Organic store", amount: 150 },
                { id: "4", date: "2023-09-22", description: "Supermarket", amount: 100 },
            ]
        },
        // Add more categories here...
    ];

    return (
        <Box>
            {categories.map((category) => (
                <BudgetCategoryDetails key={category.name} {...category} />
            ))}
        </Box>
    );
};


export default ExampleCategoryList;