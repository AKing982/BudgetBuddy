import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Stepper,
    Step,
    StepLabel,
    Grid,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Alert,
    Divider
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import {GroceryBudget} from "../config/Types";
import GroceryService from "../services/GroceryService";


interface Props {
    onSuccess: () => void;
    onCancel: () => void;
}

const steps = ['Basic Information', 'Add Stores', 'Budget Sections', 'Review'];

export const GroceryBudgetCreate: React.FC<Props> = ({ onSuccess, onCancel }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [budget, setBudget] = useState<Partial<GroceryBudget>>({
        budgetAmount: 0,
        startDate: '',
        endDate: '',
        subBudgetId: 1,
        savingsGoal: 0,
        stores: [],
        sections: [],
        plannedItems: []
    });

    // Store state
    const [newStoreName, setNewStoreName] = useState('');

    // Section state
    const [newSectionName, setNewSectionName] = useState('');
    const [sectionBudget, setSectionBudget] = useState<number>(0);

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const addStore = () => {
        if (!newStoreName.trim()) return;

        setBudget(prev => ({
            ...prev,
            stores: [
                ...(prev.stores || []),
                { storeName: newStoreName, items: [] }
            ]
        }));

        setNewStoreName('');
    };

    const removeStore = (index: number) => {
        setBudget(prev => ({
            ...prev,
            stores: prev.stores?.filter((_, i) => i !== index)
        }));
    };

    const addSection = () => {
        if (!newSectionName.trim() || sectionBudget <= 0) return;

        setBudget(prev => ({
            ...prev,
            sections: [
                ...(prev.sections || []),
                {
                    name: newSectionName,
                    budgetAmount: sectionBudget,
                    items: []
                }
            ]
        }));

        setNewSectionName('');
        setSectionBudget(0);
    };

    const removeSection = (index: number) => {
        setBudget(prev => ({
            ...prev,
            sections: prev.sections?.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            await GroceryService.createBudget(budget as GroceryBudget);
            onSuccess();
        } catch (err) {
            setError('Failed to create budget');
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Budget Amount"
                                type="number"
                                value={budget.budgetAmount || ''}
                                onChange={(e) => setBudget({ ...budget, budgetAmount: parseFloat(e.target.value) })}
                                InputProps={{ startAdornment: '$' }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Start Date"
                                    value={budget.startDate ? new Date(budget.startDate) : null}
                                    onChange={(date) => setBudget({
                                        ...budget,
                                        startDate: date ? date.toISOString().split('T')[0] : ''
                                    })}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="End Date"
                                    value={budget.endDate ? new Date(budget.endDate) : null}
                                    onChange={(date) => setBudget({
                                        ...budget,
                                        endDate: date ? date.toISOString().split('T')[0] : ''
                                    })}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Month"
                                value={budget.subBudgetId || 0}
                                onChange={(e) => setBudget({ ...budget, subBudgetId: Number(e.target.value) })}
                                placeholder="e.g., January 2025"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Savings Goal"
                                type="number"
                                value={budget.savingsGoal || ''}
                                onChange={(e) => setBudget({ ...budget, savingsGoal: parseFloat(e.target.value) })}
                                InputProps={{ startAdornment: '$' }}
                            />
                        </Grid>
                    </Grid>
                );

            case 1:
                return (
                    <Box>
                        <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs>
                                    <TextField
                                        fullWidth
                                        label="Store Name"
                                        value={newStoreName}
                                        onChange={(e) => setNewStoreName(e.target.value)}
                                        placeholder="e.g., Walmart"
                                    />
                                </Grid>
                                <Grid item>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={addStore}
                                    >
                                        Add Store
                                    </Button>
                                </Grid>
                            </Grid>
                        </Card>

                        <Typography variant="h6" gutterBottom>
                            Added Stores ({budget.stores?.length || 0})
                        </Typography>
                        {budget.stores && budget.stores.length > 0 ? (
                            <List>
                                {budget.stores.map((store, idx) => (
                                    <ListItem
                                        key={idx}
                                        secondaryAction={
                                            <IconButton edge="end" onClick={() => removeStore(idx)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        }
                                        sx={{ bgcolor: 'grey.50', mb: 1, borderRadius: 1 }}
                                    >
                                        <ListItemText
                                            primary={store.storeName}
                                            secondary={`${store.items.length} items`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Alert severity="info">No stores added yet</Alert>
                        )}
                    </Box>
                );

            case 2:
                return (
                    <Box>
                        <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Section Name"
                                        value={newSectionName}
                                        onChange={(e) => setNewSectionName(e.target.value)}
                                        placeholder="e.g., Produce"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Section Budget"
                                        type="number"
                                        value={sectionBudget || ''}
                                        onChange={(e) => setSectionBudget(parseFloat(e.target.value))}
                                        InputProps={{ startAdornment: '$' }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={addSection}
                                    >
                                        Add Section
                                    </Button>
                                </Grid>
                            </Grid>
                        </Card>

                        <Typography variant="h6" gutterBottom>
                            Added Sections ({budget.sections?.length || 0})
                        </Typography>
                        {budget.sections && budget.sections.length > 0 ? (
                            <List>
                                {budget.sections.map((section, idx) => (
                                    <ListItem
                                        key={idx}
                                        secondaryAction={
                                            <IconButton edge="end" onClick={() => removeSection(idx)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        }
                                        sx={{ bgcolor: 'grey.50', mb: 1, borderRadius: 1 }}
                                    >
                                        <ListItemText
                                            primary={section.name}
                                            secondary={`$${section.budgetAmount}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Alert severity="info">No sections added yet</Alert>
                        )}
                    </Box>
                );

            case 3:
                return (
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Budget Summary
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography color="text.secondary">Budget Amount:</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography fontWeight="bold">${budget.budgetAmount}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography color="text.secondary">Period:</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography>{budget.startDate} to {budget.endDate}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography color="text.secondary">Month:</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography>{budget.subBudgetId}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography color="text.secondary">Savings Goal:</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography>${budget.savingsGoal}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography color="text.secondary">Stores:</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography>{budget.stores?.length || 0}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography color="text.secondary">Sections:</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography>{budget.sections?.length || 0}</Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                );

            default:
                return null;
        }
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Create Grocery Budget
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                <Stepper activeStep={activeStep} sx={{ my: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Box sx={{ minHeight: 400 }}>
                    {renderStepContent(activeStep)}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                    <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                    >
                        Back
                    </Button>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button onClick={onCancel}>
                            Cancel
                        </Button>
                        {activeStep === steps.length - 1 ? (
                            <Button
                                variant="contained"
                                color="success"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Create Budget'}
                            </Button>
                        ) : (
                            <Button variant="contained" onClick={handleNext}>
                                Next
                            </Button>
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};