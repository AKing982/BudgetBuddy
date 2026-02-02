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
    Divider,
    Dialog,
    DialogContent,
    DialogTitle,
    alpha,
    useTheme,
    Fade,
    Paper
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import ScannerIcon from '@mui/icons-material/QrCodeScanner';
import { GroceryBudget } from "../config/Types";
import GroceryService from "../services/GroceryService";

interface Props {
    open: boolean;
    onSuccess: () => void;
    onClose: () => void;
}

type EntryMode = 'choice' | 'manual' | 'scan';

const steps = ['Basic Information', 'Add Stores', 'Budget Sections', 'Review'];

const gradients = {
    blue: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    green: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    purple: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
    orange: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
};

export const GroceryBudgetCreate: React.FC<Props> = ({ open, onSuccess, onClose }) => {
    const theme = useTheme();
    const [entryMode, setEntryMode] = useState<EntryMode>('choice');
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

    const [newStoreName, setNewStoreName] = useState('');
    const [newSectionName, setNewSectionName] = useState('');
    const [sectionBudget, setSectionBudget] = useState<number>(0);

    const handleClose = () => {
        setEntryMode('choice');
        setActiveStep(0);
        setError('');
        onClose();
    };

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        if (activeStep === 0) {
            setEntryMode('choice');
        } else {
            setActiveStep((prevActiveStep) => prevActiveStep - 1);
        }
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
            handleClose();
        } catch (err) {
            setError('Failed to create budget');
        } finally {
            setLoading(false);
        }
    };

    const renderChoiceScreen = () => (
        <Fade in timeout={500}>
            <Box sx={{ py: 4 }}>
                <Typography
                    variant="h5"
                    align="center"
                    gutterBottom
                    sx={{
                        fontWeight: 700,
                        mb: 1
                    }}
                >
                    How would you like to create your budget?
                </Typography>
                <Typography
                    variant="body2"
                    align="center"
                    color="text.secondary"
                    sx={{ mb: 4 }}
                >
                    Choose your preferred method to get started
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                textAlign: 'center',
                                cursor: 'pointer',
                                border: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                background: alpha(theme.palette.background.paper, 0.8),
                                '&:hover': {
                                    borderColor: theme.palette.primary.main,
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                                    background: alpha(theme.palette.primary.main, 0.02)
                                }
                            }}
                            onClick={() => {
                                setEntryMode('manual');
                                setActiveStep(0);
                            }}
                        >
                            <Box
                                sx={{
                                    width: 72,
                                    height: 72,
                                    borderRadius: '50%',
                                    background: gradients.blue,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px',
                                    boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`
                                }}
                            >
                                <EditIcon sx={{ fontSize: 32, color: 'white' }} />
                            </Box>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Manual Entry
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Enter your grocery items and budget details manually
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                textAlign: 'center',
                                cursor: 'pointer',
                                border: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                background: alpha(theme.palette.background.paper, 0.8),
                                '&:hover': {
                                    borderColor: theme.palette.success.main,
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.15)}`,
                                    background: alpha(theme.palette.success.main, 0.02)
                                }
                            }}
                            onClick={() => {
                                setEntryMode('scan');
                                // Handle scan mode initialization
                            }}
                        >
                            <Box
                                sx={{
                                    width: 72,
                                    height: 72,
                                    borderRadius: '50%',
                                    background: gradients.green,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px',
                                    boxShadow: `0 4px 14px ${alpha(theme.palette.success.main, 0.3)}`
                                }}
                            >
                                <ScannerIcon sx={{ fontSize: 32, color: 'white' }} />
                            </Box>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Scan Receipts
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Upload and scan your grocery receipts automatically
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Fade>
    );

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
                                label="Budget Name"
                                value={budget.name || ''}
                                onChange={(e) => setBudget({ ...budget, name: e.target.value })}
                                placeholder="e.g., January 2026 Groceries"
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
                        <Card
                            variant="outlined"
                            sx={{
                                p: 2,
                                mb: 3,
                                borderRadius: 2,
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                background: alpha(theme.palette.primary.main, 0.02)
                            }}
                        >
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
                                        sx={{
                                            background: gradients.green,
                                            boxShadow: `0 4px 14px ${alpha(theme.palette.success.main, 0.25)}`,
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
                                            }
                                        }}
                                    >
                                        Add Store
                                    </Button>
                                </Grid>
                            </Grid>
                        </Card>

                        <Typography variant="h6" gutterBottom fontWeight={600}>
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
                                        sx={{
                                            bgcolor: alpha(theme.palette.background.paper, 0.6),
                                            mb: 1,
                                            borderRadius: 2,
                                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                                        }}
                                    >
                                        <ListItemText
                                            primary={store.storeName}
                                            secondary={`${store.items.length} items`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Alert severity="info" sx={{ borderRadius: 2 }}>No stores added yet</Alert>
                        )}
                    </Box>
                );

            case 2:
                return (
                    <Box>
                        <Card
                            variant="outlined"
                            sx={{
                                p: 2,
                                mb: 3,
                                borderRadius: 2,
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                background: alpha(theme.palette.primary.main, 0.02)
                            }}
                        >
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
                                        sx={{
                                            background: gradients.green,
                                            boxShadow: `0 4px 14px ${alpha(theme.palette.success.main, 0.25)}`,
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
                                            }
                                        }}
                                    >
                                        Add Section
                                    </Button>
                                </Grid>
                            </Grid>
                        </Card>

                        <Typography variant="h6" gutterBottom fontWeight={600}>
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
                                        sx={{
                                            bgcolor: alpha(theme.palette.background.paper, 0.6),
                                            mb: 1,
                                            borderRadius: 2,
                                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                                        }}
                                    >
                                        <ListItemText
                                            primary={section.name}
                                            secondary={`$${section.budgetAmount}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Alert severity="info" sx={{ borderRadius: 2 }}>No sections added yet</Alert>
                        )}
                    </Box>
                );

            case 3:
                return (
                    <Card
                        variant="outlined"
                        sx={{
                            borderRadius: 3,
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                        }}
                    >
                        <CardContent>
                            <Typography variant="h6" gutterBottom fontWeight={600}>
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
                                    <Typography color="text.secondary">Budget Name:</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography>{budget.name || 'N/A'}</Typography>
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

    const renderScanMode = () => (
        <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
                Receipt Scanning
            </Typography>
            <Typography color="text.secondary">
                Scan mode coming soon...
            </Typography>
        </Box>
    );

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pb: 2
            }}>
                <Typography variant="h5" fontWeight={700}>
                    {entryMode === 'choice' ? 'Create Grocery Budget' :
                        entryMode === 'manual' ? 'Manual Budget Entry' :
                            'Scan Receipts'}
                </Typography>
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {entryMode === 'choice' && renderChoiceScreen()}

                {entryMode === 'manual' && (
                    <>
                        <Stepper activeStep={activeStep} sx={{ my: 3 }}>
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>

                        <Box sx={{ minHeight: 400, py: 2 }}>
                            {renderStepContent(activeStep)}
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                            <Button
                                onClick={handleBack}
                                sx={{ textTransform: 'none' }}
                            >
                                Back
                            </Button>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    onClick={handleClose}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Cancel
                                </Button>
                                {activeStep === steps.length - 1 ? (
                                    <Button
                                        variant="contained"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        sx={{
                                            textTransform: 'none',
                                            background: gradients.green,
                                            boxShadow: `0 4px 14px ${alpha(theme.palette.success.main, 0.25)}`,
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
                                            }
                                        }}
                                    >
                                        {loading ? 'Creating...' : 'Create Budget'}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        onClick={handleNext}
                                        sx={{
                                            textTransform: 'none',
                                            background: gradients.blue,
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                            }
                                        }}
                                    >
                                        Next
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </>
                )}

                {entryMode === 'scan' && renderScanMode()}
            </DialogContent>
        </Dialog>
    );
};