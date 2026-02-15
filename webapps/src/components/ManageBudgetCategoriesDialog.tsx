import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    IconButton,
    Stack,
    Chip,
    Card,
    alpha,
    Switch,
    FormControlLabel,
    Divider,
    Tab,
    Tabs,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Tooltip,
    InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import CategoryIcon from '@mui/icons-material/Category';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const maroonColor = '#800000';
const tealColor = '#0d9488';

interface BudgetCategory {
    id?: number;
    name: string;
    budgetedAmount: number;
    savingsGoal?: number;
    isDefault: boolean;
    isActive: boolean;
    isCustom: boolean;
}

interface ManageBudgetCategoriesDialogProps {
    open: boolean;
    onClose: () => void;
    defaultCategories: BudgetCategory[];
    customCategories: BudgetCategory[];
    onSaveCategories: (categories: BudgetCategory[], useCustomOnly: boolean) => Promise<void>;
}

const ManageBudgetCategoriesDialog: React.FC<ManageBudgetCategoriesDialogProps> = ({
                                                                                       open,
                                                                                       onClose,
                                                                                       defaultCategories,
                                                                                       customCategories,
                                                                                       onSaveCategories
                                                                                   }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [useCustomOnly, setUseCustomOnly] = useState(false);
    const [localDefaultCategories, setLocalDefaultCategories] = useState<BudgetCategory[]>(defaultCategories);
    const [localCustomCategories, setLocalCustomCategories] = useState<BudgetCategory[]>(customCategories);
    const [editingCategory, setEditingCategory] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Sync local state with props when they change
    useEffect(() => {
        setLocalDefaultCategories(defaultCategories);
    }, [defaultCategories]);

    useEffect(() => {
        setLocalCustomCategories(customCategories);
    }, [customCategories]);

    // New category form
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryBudget, setNewCategoryBudget] = useState('');
    const [newCategorySavings, setNewCategorySavings] = useState('');
    const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);

    const handleAddCustomCategory = () => {
        if (newCategoryName.trim() === '') {
            alert('Please enter a category name');
            return;
        }

        const budgetAmount = parseFloat(newCategoryBudget) || 0;
        const savingsGoal = parseFloat(newCategorySavings) || 0;

        const newCategory: BudgetCategory = {
            id: Date.now(), // temporary ID, backend will assign real ID
            name: newCategoryName.trim(),
            budgetedAmount: budgetAmount,
            savingsGoal: savingsGoal > 0 ? savingsGoal : undefined,
            isDefault: false,
            isActive: true,
            isCustom: true
        };

        setLocalCustomCategories([...localCustomCategories, newCategory]);

        // Reset form
        setNewCategoryName('');
        setNewCategoryBudget('');
        setNewCategorySavings('');
        setShowNewCategoryForm(false);
    };

    const handleDeleteCustomCategory = (id: number) => {
        setLocalCustomCategories(localCustomCategories.filter(cat => cat.id !== id));
    };

    const handleToggleDefaultCategory = (id: number) => {
        setLocalDefaultCategories(localDefaultCategories.map(cat =>
            cat.id === id ? { ...cat, isActive: !cat.isActive } : cat
        ));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const allCategories = useCustomOnly
                ? localCustomCategories
                : [...localDefaultCategories.filter(cat => cat.isActive), ...localCustomCategories];

            await onSaveCategories(allCategories, useCustomOnly);
            onClose();
        } catch (error) {
            console.error('Error saving categories:', error);
            alert('Failed to save categories. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateCustomCategory = (id: number, field: 'budgetedAmount' | 'savingsGoal', value: number) => {
        setLocalCustomCategories(localCustomCategories.map(cat =>
            cat.id === id ? { ...cat, [field]: value } : cat
        ));
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    maxHeight: '90vh'
                }
            }}
        >
            {/* Header */}
            <Box sx={{
                background: `linear-gradient(135deg, ${maroonColor} 0%, #a00000 100%)`,
                color: 'white',
                p: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryIcon />
                    <Typography variant="h6" fontWeight={600}>
                        Manage Budget Categories
                    </Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Mode Toggle */}
            <Box sx={{ px: 3, pt: 3, pb: 2 }}>
                <Card sx={{
                    p: 2,
                    bgcolor: alpha(useCustomOnly ? tealColor : maroonColor, 0.05),
                    border: `1px solid ${alpha(useCustomOnly ? tealColor : maroonColor, 0.2)}`
                }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={useCustomOnly}
                                onChange={(e) => setUseCustomOnly(e.target.checked)}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: tealColor,
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: tealColor,
                                    }
                                }}
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body2" fontWeight={600}>
                                    {useCustomOnly ? 'Using Custom Categories Only' : 'Using Default + Custom Categories'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {useCustomOnly
                                        ? 'Only your custom categories will be used'
                                        : 'Enabled default categories plus your custom categories will be used'
                                    }
                                </Typography>
                            </Box>
                        }
                    />
                </Card>
            </Box>

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                    px: 3,
                    '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 600
                    },
                    '& .MuiTabs-indicator': {
                        backgroundColor: maroonColor
                    }
                }}
            >
                <Tab label={`Default Categories (${localDefaultCategories.filter(c => c.isActive).length})`} />
                <Tab label={`Custom Categories (${localCustomCategories.length})`} />
            </Tabs>

            <Divider />

            <DialogContent sx={{ p: 0 }}>
                {/* Default Categories Tab */}
                {activeTab === 0 && (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            These are the categories currently in your budget. Toggle them on/off to show or hide them from your budget view.
                        </Typography>
                        <List>
                            {localDefaultCategories.map((category) => (
                                <ListItem
                                    key={category.id}
                                    sx={{
                                        border: `1px solid ${alpha(category.isActive ? tealColor : '#ccc', 0.3)}`,
                                        borderRadius: 2,
                                        mb: 1,
                                        bgcolor: alpha(category.isActive ? tealColor : '#ccc', 0.05)
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body1" fontWeight={600}>
                                                    {category.name}
                                                </Typography>
                                                <Chip
                                                    label="Default"
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: '0.65rem',
                                                        bgcolor: alpha(maroonColor, 0.1),
                                                        color: maroonColor
                                                    }}
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            category.budgetedAmount > 0
                                                ? `Budgeted: $${category.budgetedAmount.toFixed(2)}`
                                                : 'No budget set'
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Tooltip title={category.isActive ? 'Disable category' : 'Enable category'}>
                                            <IconButton
                                                edge="end"
                                                onClick={() => handleToggleDefaultCategory(category.id!)}
                                                sx={{
                                                    color: category.isActive ? tealColor : '#999'
                                                }}
                                            >
                                                {category.isActive ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                            </IconButton>
                                        </Tooltip>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}

                {/* Custom Categories Tab */}
                {activeTab === 1 && (
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Create custom budget categories with optional budgeted amounts and savings goals.
                            </Typography>
                            {!showNewCategoryForm && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => setShowNewCategoryForm(true)}
                                    sx={{
                                        borderColor: maroonColor,
                                        color: maroonColor,
                                        '&:hover': {
                                            borderColor: maroonColor,
                                            bgcolor: alpha(maroonColor, 0.05)
                                        }
                                    }}
                                >
                                    Add Category
                                </Button>
                            )}
                        </Box>

                        {/* New Category Form */}
                        {showNewCategoryForm && (
                            <Card sx={{
                                p: 2,
                                mb: 3,
                                bgcolor: alpha(tealColor, 0.05),
                                border: `1px solid ${alpha(tealColor, 0.2)}`
                            }}>
                                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                                    New Custom Category
                                </Typography>
                                <Stack spacing={2}>
                                    <TextField
                                        label="Category Name"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        size="small"
                                        fullWidth
                                        required
                                        placeholder="e.g., Entertainment, Hobbies, Pet Care"
                                    />
                                    <TextField
                                        label="Budgeted Amount (Optional)"
                                        value={newCategoryBudget}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                                                setNewCategoryBudget(value);
                                            }
                                        }}
                                        size="small"
                                        fullWidth
                                        placeholder="0.00"
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">$</InputAdornment>
                                        }}
                                    />
                                    <TextField
                                        label="Savings Goal (Optional)"
                                        value={newCategorySavings}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                                                setNewCategorySavings(value);
                                            }
                                        }}
                                        size="small"
                                        fullWidth
                                        placeholder="0.00"
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">$</InputAdornment>
                                        }}
                                        helperText="Amount you want to save in this category"
                                    />
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => {
                                                setShowNewCategoryForm(false);
                                                setNewCategoryName('');
                                                setNewCategoryBudget('');
                                                setNewCategorySavings('');
                                            }}
                                            startIcon={<CancelIcon />}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={handleAddCustomCategory}
                                            startIcon={<AddIcon />}
                                            sx={{
                                                bgcolor: tealColor,
                                                '&:hover': {
                                                    bgcolor: '#0f766e'
                                                }
                                            }}
                                        >
                                            Add Category
                                        </Button>
                                    </Box>
                                </Stack>
                            </Card>
                        )}

                        {/* Custom Categories List */}
                        {localCustomCategories.length > 0 ? (
                            <List>
                                {localCustomCategories.map((category) => (
                                    <ListItem
                                        key={category.id}
                                        sx={{
                                            border: `1px solid ${alpha(tealColor, 0.3)}`,
                                            borderRadius: 2,
                                            mb: 1,
                                            bgcolor: alpha(tealColor, 0.05),
                                            display: 'block',
                                            p: 2
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Typography variant="body1" fontWeight={600}>
                                                        {category.name}
                                                    </Typography>
                                                    <Chip
                                                        label="Custom"
                                                        size="small"
                                                        sx={{
                                                            height: 20,
                                                            fontSize: '0.65rem',
                                                            bgcolor: alpha(tealColor, 0.2),
                                                            color: tealColor
                                                        }}
                                                    />
                                                </Box>
                                                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Budgeted
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            ${category.budgetedAmount.toFixed(2)}
                                                        </Typography>
                                                    </Box>
                                                    {category.savingsGoal && category.savingsGoal > 0 && (
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Savings Goal
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight={600} color={tealColor}>
                                                                ${category.savingsGoal.toFixed(2)}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Stack>
                                            </Box>
                                            <Tooltip title="Delete category">
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => handleDeleteCustomCategory(category.id!)}
                                                    sx={{
                                                        color: '#dc2626',
                                                        '&:hover': {
                                                            bgcolor: alpha('#dc2626', 0.1)
                                                        }
                                                    }}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Box sx={{
                                p: 4,
                                textAlign: 'center',
                                color: 'text.secondary',
                                bgcolor: alpha('#ccc', 0.05),
                                borderRadius: 2
                            }}>
                                <CategoryIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
                                <Typography variant="body2">
                                    No custom categories yet. Click "Add Category" to create one.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            {/* Footer */}
            <DialogActions sx={{ p: 3, pt: 2 }}>
                <Button onClick={onClose} variant="outlined">
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={isSaving}
                    startIcon={isSaving ? <SaveIcon /> : <SaveIcon />}
                    sx={{
                        bgcolor: maroonColor,
                        '&:hover': {
                            bgcolor: '#a00000'
                        }
                    }}
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ManageBudgetCategoriesDialog;