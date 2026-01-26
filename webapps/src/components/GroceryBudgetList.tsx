import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    CardActions,
    Grid,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Chip,
    Divider
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StoreIcon from '@mui/icons-material/Store';
import CategoryIcon from '@mui/icons-material/Category';
import SavingsIcon from '@mui/icons-material/Savings';
import {GroceryBudget} from "../config/Types";

interface Props {
    budgets: GroceryBudget[];
    onViewBudget: (budget: GroceryBudget) => void;
}

export const GroceryBudgetList: React.FC<Props> = ({ budgets, onViewBudget }) => {
    const [selectedMonth, setSelectedMonth] = useState<number>(1);

    const filteredBudgets = selectedMonth === 1
        ? budgets
        : budgets.filter(b => b.subBudgetId === selectedMonth);

    const months = Array.from(new Set(budgets.map(b => b.subBudgetId)));

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="bold">
                    Your Grocery Budgets
                </Typography>
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Filter by Month</InputLabel>
                    <Select
                        value={selectedMonth}
                        label="Filter by Month"
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    >
                        <MenuItem value="all">All Months</MenuItem>
                        {months.map(month => (
                            <MenuItem key={month} value={month}>{month}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {filteredBudgets.length === 0 ? (
                <Card sx={{ textAlign: 'center', py: 8 }}>
                    <CardContent>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No budgets found
                        </Typography>
                        <Typography color="text.secondary">
                            Create your first grocery budget to get started
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    {filteredBudgets.map(budget => (
                        <Grid item xs={12} sm={6} md={4} key={budget.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 6
                                    }
                                }}
                            >
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold">
                                                {budget.subBudgetId}
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                                <CalendarTodayIcon fontSize="small" color="action" />
                                                <Typography variant="body2" color="text.secondary">
                                                    {budget.startDate} - {budget.endDate}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Chip
                                            label={`$${budget.budgetAmount}`}
                                            color="primary"
                                            size="small"
                                        />
                                    </Box>

                                    <Divider sx={{ my: 2 }} />

                                    <Box display="flex" flexDirection="column" gap={1}>
                                        <Box display="flex" justifyContent="space-between">
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <SavingsIcon fontSize="small" color="action" />
                                                <Typography variant="body2" color="text.secondary">
                                                    Savings Goal:
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" fontWeight="medium">
                                                ${budget.savingsGoal}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" justifyContent="space-between">
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <StoreIcon fontSize="small" color="action" />
                                                <Typography variant="body2" color="text.secondary">
                                                    Stores:
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" fontWeight="medium">
                                                {budget.stores.length}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" justifyContent="space-between">
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <CategoryIcon fontSize="small" color="action" />
                                                <Typography variant="body2" color="text.secondary">
                                                    Sections:
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" fontWeight="medium">
                                                {budget.sections.length}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                                <CardActions>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={() => onViewBudget(budget)}
                                    >
                                        View Details
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};