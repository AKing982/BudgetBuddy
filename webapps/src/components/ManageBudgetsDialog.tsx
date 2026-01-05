
import React, {useEffect, useState} from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Grid,
    Typography,
    Box,
    Alert,
    CircularProgress,
    IconButton,
    Divider,
    FormControl,
    InputLabel,
    Select,
    InputAdornment,
    Chip,
    Card, Tabs, Tab
} from '@mui/material';
import { X, Save, Edit, AlertCircle } from 'lucide-react';
import BudgetService from "../services/BudgetService";
import { ManageBudgetsData } from "../utils/Items";

interface ManageBudgetsDialogProps {
    open: boolean;
    onClose: () => void;
    onBudgetUpdated?: () => void;
}



interface BudgetListItem {
    id: number;
    name: string;
    year: number;
}


const ManageBudgetsDialog: React.FC<ManageBudgetsDialogProps> = ({open, onClose, onBudgetUpdated}) =>
{
    const [budgetList, setBudgetList] = useState<ManageBudgetsData[]>([]);
    const [budgetListItems, setBudgetListItems] = useState<BudgetListItem[]>([])
    const [selectedBudgetId, setSelectedBudgetId] = useState<number | ''>('');
    const [searchYear, setSearchYear] = useState<number>(new Date().getFullYear());
    const [manageBudgetData, setManageBudgetData] = useState<ManageBudgetsData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingBudgets, setIsLoadingBudgets] = useState<boolean>(false);
    const [error, setError] = useState<string | null>('');
    const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
    const [hasChanges, setHasChanges] = useState<boolean>(false);
    const [originalManageBudgetData, setOriginalManageBudgetData] = useState<ManageBudgetsData | null>(null);
    const budgetService = BudgetService.getInstance();
    const [activeTab, setActiveTab] = useState(0);

    const userId = Number(sessionStorage.getItem('userId'));
    const budgetTermOptions = [
        { value: 'MONTHLY', label: 'Monthly' },
        { value: 'WEEKLY', label: 'Weekly' },
        { value: 'BIWEEKLY', label: 'Bi-Weekly' },
        { value: 'BIMONTHLY', label: 'Bi-Monthly' },
        { value: 'YEARLY', label: 'Yearly' }
    ];

    const budgetPlanOptions = [
        { value: 'SAVINGS_PLAN', label: 'Savings Plan' },
        { value: 'EMERGENCY_FUND', label: 'Emergency Fund' },
        { value: 'DEBT_PAYOFF', label: 'Debt Payoff' }
    ];

    const loadBudgetList = async () => {
        setIsLoadingBudgets(true);
        setError(null);
        try {
            // Assuming you have an endpoint to get budgets by user and year
            const budgets = await budgetService.getBudgetsByUserIdAndYear(userId, searchYear);
            console.log('Budgets:', budgets);

            setBudgetList(budgets);

            const budgetItems: BudgetListItem[] = budgets.map((budget: any) => ({
                id: budget.id,
                name: budget.budgetName || `Budget ${budget.id}`,
                year: budget.budgetYear || searchYear
            }));

            setBudgetListItems(budgetItems);


            if (budgetItems.length === 0) {
                setError(`No budgets found for year ${searchYear}`);
            }
        } catch (err) {
            console.error('Error loading budget list:', err);
            setError('Failed to load budgets. Please try again.');
        } finally {
            setIsLoadingBudgets(false);
        }
    };

    useEffect(() => {
        if (open) {
            loadBudgetList();
        }
    }, [open, searchYear]);

    const handleClose = () => {
        if (hasChanges) {
            const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
            if (!confirmClose) return;
        }

        // Reset state
        setSelectedBudgetId('');
        setManageBudgetData(null);
        setOriginalManageBudgetData(null);
        setHasChanges(false);
        setError(null);

        onClose();
    };

    const handleFieldChange = (field: keyof ManageBudgetsData, value: any) => {
        if (!manageBudgetData) return;

        const updatedBudget = { ...manageBudgetData, [field]: value };

        // Auto-calculate yearly income if monthly income changes
        if (field === 'monthlyIncome') {
            updatedBudget.yearlyIncome = value * 12;
        }

        // Auto-calculate monthly income if yearly income changes
        if (field === 'yearlyIncome') {
            updatedBudget.monthlyIncome = value / 12;
        }

        setManageBudgetData(updatedBudget);
        setHasChanges(JSON.stringify(updatedBudget) !== JSON.stringify(originalManageBudgetData));
    };

    const handleSubmit = () => {
        if (!hasChanges) {
            setError('No changes detected to save.');
            return;
        }
        setConfirmDialogOpen(true);
    };

    const loadBudgetDetails = async (budgetId: number) => {
        setIsLoading(true);
        setError(null);
        try
        {
            console.log('Loading budget details for budget ID:', budgetId);

            const budget = budgetList.find((b) => b.id === budgetId);
            if(!budget) {
                throw new Error(`Budget with ID ${budgetId} not found.`);
            }
            const budgetDetails: ManageBudgetsData = {
                id: budget.id,
                budgetName: budget.budgetName || '',
                budgetDescription: budget.budgetDescription || '',
                userId: budget.userId || userId,
                userFirstName: budget.userFirstName || 'Unknown',
                userLastName: budget.userLastName || 'User',
                monthlyIncome: budget.monthlyIncome || 0,
                yearlyIncome: budget.yearlyIncome || (budget.monthlyIncome ? budget.monthlyIncome * 12 : 0),
                savingsAmount: budget.savingsAmount || 0,
                budgetPeriod: budget.budgetPeriod || 'MONTHLY',
                budgetMode: budget.budgetMode || 'SAVINGS_PLAN',
                budgetYear: budget.budgetYear || searchYear
            };
            setManageBudgetData(budgetDetails);
            setOriginalManageBudgetData(JSON.parse(JSON.stringify(budgetDetails))); // Deep copy
            setHasChanges(false);
        } catch (err) {
            console.error('Error loading budget details:', err);
            setError('Failed to load budget details. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };


    const handleConfirmSave = async () => {
        if (!manageBudgetData) return;

        setIsLoading(true);
        setError(null);
        setConfirmDialogOpen(false);

        try {
            // await budgetService.updateBudget(manageBudgetData);

            // Success - reset state and notify parent
            setHasChanges(false);
            setOriginalManageBudgetData(JSON.parse(JSON.stringify(manageBudgetData)));

            if (onBudgetUpdated) {
                onBudgetUpdated();
            }

            // Show success message (you could use a snackbar here)
            alert('Budget updated successfully!');

        } catch (err) {
            console.error('Error updating budget:', err);
            setError('Failed to update budget. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBudgetSelect = (budgetId: number) => {
        setSelectedBudgetId(budgetId);
        loadBudgetDetails(budgetId);
    };


    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        maxHeight: '90vh'
                    }
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Edit size={24} />
                            <Typography variant="h6" component="span">
                                Manage Budgets
                            </Typography>
                        </Box>
                        <IconButton onClick={handleClose} size="small">
                            <X />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <Divider />

                <DialogContent>
                    {/* Budget Selection Section */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                            Select Budget
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Budget Year"
                                    type="number"
                                    value={searchYear}
                                    onChange={(e) => setSearchYear(Number(e.target.value))}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <AlertCircle size={18} />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth disabled={isLoadingBudgets || budgetList.length === 0}>
                                    <InputLabel>Select Budget</InputLabel>
                                    <Select
                                        value={selectedBudgetId}
                                        onChange={(e) => handleBudgetSelect(e.target.value as number)}
                                        label="Select Budget"
                                    >
                                        <MenuItem value="">
                                            <em>Choose a budget</em>
                                        </MenuItem>
                                        {budgetList.map((budget) => (
                                            <MenuItem key={budget.id} value={budget.id}>
                                                {budget.budgetName} ({budget.budgetYear})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        {isLoadingBudgets && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <CircularProgress size={24} />
                            </Box>
                        )}
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {isLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : manageBudgetData ? (
                        <>
                            {hasChanges && (
                                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Chip
                                        label="Unsaved Changes"
                                        color="warning"
                                        size="small"
                                        icon={<AlertCircle size={16} />}
                                    />
                                </Box>
                            )}

                            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                                    <Tab label="Basic Info" />
                                    <Tab label="Financial" />
                                    <Tab label="Configuration" />
                                </Tabs>
                            </Box>

                            {activeTab === 0 && (
                                <Box sx={{ py: 2 }}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Budget Name"
                                                value={manageBudgetData.budgetName}
                                                onChange={(e) => handleFieldChange('budgetName', e.target.value)}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Budget Description"
                                                value={manageBudgetData.budgetDescription}
                                                onChange={(e) => handleFieldChange('budgetDescription', e.target.value)}
                                                multiline
                                                rows={4}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="User First Name"
                                                value={manageBudgetData.userFirstName}
                                                InputProps={{
                                                    readOnly: true,
                                                }}
                                                disabled
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="User Last Name"
                                                value={manageBudgetData.userLastName}
                                                InputProps={{
                                                    readOnly: true,
                                                }}
                                                disabled
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Budget Year"
                                                value={manageBudgetData.budgetYear}
                                                InputProps={{
                                                    readOnly: true,
                                                }}
                                                disabled
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}

                            {activeTab === 1 && (
                                <Box sx={{ py: 2 }}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Monthly Income"
                                                type="number"
                                                value={manageBudgetData.monthlyIncome}
                                                onChange={(e) => handleFieldChange('monthlyIncome', Number(e.target.value))}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Yearly Income"
                                                type="number"
                                                value={manageBudgetData.yearlyIncome}
                                                onChange={(e) => handleFieldChange('yearlyIncome', Number(e.target.value))}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Savings Goal"
                                                type="number"
                                                value={manageBudgetData.savingsAmount}
                                                onChange={(e) => handleFieldChange('savingsAmount', Number(e.target.value))}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Savings Allocation"
                                                type="number"
                                                value={manageBudgetData.savingsAllocation}
                                                onChange={(e) => handleFieldChange('savingsAllocation', Number(e.target.value))}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                                                }}
                                                />
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}

                            {activeTab === 2 && (
                                <Box sx={{ py: 2 }}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth>
                                                <InputLabel>Budget Period</InputLabel>
                                                <Select
                                                    value={manageBudgetData.budgetPeriod}
                                                    onChange={(e) => handleFieldChange('budgetPeriod', e.target.value)}
                                                    label="Budget Period"
                                                >
                                                    {budgetTermOptions.map((option) => (
                                                        <MenuItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth>
                                                <InputLabel>Budget Mode</InputLabel>
                                                <Select
                                                    value={manageBudgetData.budgetMode}
                                                    onChange={(e) => handleFieldChange('budgetMode', e.target.value)}
                                                    label="Budget Mode"
                                                >
                                                    {budgetPlanOptions.map((option) => (
                                                        <MenuItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}
                        </>
                    ) : (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <AlertCircle size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                                No Budget Selected
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Select a budget from the dropdown above to view and edit its details
                            </Typography>
                        </Box>
                    )}
                </DialogContent>

                <Divider />

                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={handleClose} variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        startIcon={<Save size={18} />}
                        disabled={!manageBudgetData || !hasChanges || isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AlertCircle size={24} color="#ff9800" />
                        <Typography variant="h6">Confirm Changes</Typography>
                    </Box>
                </DialogTitle>

                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        You are about to update the following budget:
                    </Alert>

                    {manageBudgetData && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Budget Name:</strong> {manageBudgetData.budgetName}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Budget Year:</strong> {manageBudgetData.budgetYear}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>User:</strong> {manageBudgetData.userFirstName} {manageBudgetData.userLastName}
                            </Typography>
                        </Box>
                    )}

                    <Typography variant="body1" sx={{ mt: 2 }}>
                        Are you sure you want to save these changes?
                    </Typography>
                </DialogContent>

                <DialogActions sx={{ p: 2.5 }}>
                    <Button
                        onClick={() => setConfirmDialogOpen(false)}
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmSave}
                        variant="contained"
                        color="primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Confirm & Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default ManageBudgetsDialog;