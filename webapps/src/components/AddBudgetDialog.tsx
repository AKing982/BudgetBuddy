import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    Button,
    Box,
    Typography,
    IconButton
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';

interface AddBudgetDialogProps {
    open: boolean;
    onClose: () => void;
    onAddBudget: (budget: any) => void;
}


const AddBudgetDialog: React.FC<AddBudgetDialogProps> = ({open, onClose, onAddBudget}) => {
    const [budgetName, setBudgetName] = useState('');
    const [budgetType, setBudgetType] = useState('');
    const [timePeriod, setTimePeriod] = useState('');
    const [totalIncome, setTotalIncome] = useState('');
    const [startingBalance, setStartingBalance] = useState('');
    const [savingsGoal, setSavingsGoal] = useState('');
    const [expenseCategories, setExpenseCategories] = useState([{ name: '', amount: '' }]);

    const handleAddCategory = () => {
        setExpenseCategories([...expenseCategories, { name: '', amount: '' }]);
    };

    const handleRemoveCategory = (index: number) => {
        const newCategories = expenseCategories.filter((_, i) => i !== index);
        setExpenseCategories(newCategories);
    };

    const handleCategoryChange = (index: number, field: 'name' | 'amount', value: string) => {
        const newCategories = expenseCategories.map((category, i) => {
            if (i === index) {
                return { ...category, [field]: value };
            }
            return category;
        });
        setExpenseCategories(newCategories);
    };

    const handleSubmit = () => {
        const newBudget = {
            name: budgetName,
            type: budgetType,
            timePeriod,
            totalIncome: parseFloat(totalIncome),
            startingBalance: parseFloat(startingBalance),
            savingsGoal: parseFloat(savingsGoal),
            expenseCategories: expenseCategories.map(cat => ({
                name: cat.name,
                amount: parseFloat(cat.amount)
            }))
        };
        onAddBudget(newBudget);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Create New Budget</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    <TextField
                        label="Budget Name"
                        value={budgetName}
                        onChange={(e) => setBudgetName(e.target.value)}
                        fullWidth
                    />
                    <Select
                        value={budgetType}
                        onChange={(e) => setBudgetType(e.target.value)}
                        displayEmpty
                        fullWidth
                    >
                        <MenuItem value="" disabled>Select Budget Type</MenuItem>
                        <MenuItem value="50/30/20">50/30/20 Budget</MenuItem>
                        <MenuItem value="zero-based">Zero-Based Budget</MenuItem>
                        <MenuItem value="envelope">Envelope System</MenuItem>
                        <MenuItem value="simple">Simple Income vs. Expenses</MenuItem>
                        <MenuItem value="pay-yourself-first">Pay-Yourself-First</MenuItem>
                    </Select>
                    <Select
                        value={timePeriod}
                        onChange={(e) => setTimePeriod(e.target.value)}
                        displayEmpty
                        fullWidth
                    >
                        <MenuItem value="" disabled>Select Time Period</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                        <MenuItem value="quarterly">Quarterly</MenuItem>
                        <MenuItem value="annual">Annual</MenuItem>
                    </Select>
                    <TextField
                        label="Total Income"
                        type="number"
                        value={totalIncome}
                        onChange={(e) => setTotalIncome(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Starting Balance"
                        type="number"
                        value={startingBalance}
                        onChange={(e) => setStartingBalance(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Savings Goal"
                        type="number"
                        value={savingsGoal}
                        onChange={(e) => setSavingsGoal(e.target.value)}
                        fullWidth
                    />
                    <Typography variant="h6">Expense Categories</Typography>
                    {expenseCategories.map((category, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                                label="Category Name"
                                value={category.name}
                                onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                                fullWidth
                            />
                            <TextField
                                label="Amount"
                                type="number"
                                value={category.amount}
                                onChange={(e) => handleCategoryChange(index, 'amount', e.target.value)}
                                fullWidth
                            />
                            <IconButton onClick={() => handleRemoveCategory(index)} color="error">
                                <RemoveIcon />
                            </IconButton>
                        </Box>
                    ))}
                    <Button startIcon={<AddIcon />} onClick={handleAddCategory}>
                        Add Category
                    </Button>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    Create Budget
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AddBudgetDialog;