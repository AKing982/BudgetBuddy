import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    IconButton,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Chip,
    Card,
    CardContent,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    alpha,
    LinearProgress,
    Stack,
    Divider,
    InputAdornment,
    Autocomplete
} from '@mui/material';
import {
    Close as CloseIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    ShoppingCart as ShoppingCartIcon,
    AutoAwesome as AutoAwesomeIcon,
    Edit as EditIcon,
    Check as CheckIcon,
    Lightbulb as LightbulbIcon
} from '@mui/icons-material';

export interface GroceryListItem {
    id: string;
    itemName: string;
    estimatedCost: number;
    category: string;
    quantity: number;
    notes?: string;
}

interface GroceryListDialogProps {
    open: boolean;
    onClose: () => void;
    budgets: Array<{ id: number; name: string; budgetAmount: number }>;
    onSave: (items: GroceryListItem[], budgetId: number) => void;
}

const CATEGORIES = [
    'Produce',
    'Meat & Seafood',
    'Dairy & Eggs',
    'Bakery',
    'Pantry & Canned',
    'Frozen Foods',
    'Beverages',
    'Snacks',
    'Household',
    'Other'
];

const COMMON_ITEMS = [
    { name: 'Apples', category: 'Produce', avgCost: 4.99 },
    { name: 'Bananas', category: 'Produce', avgCost: 2.99 },
    { name: 'Chicken Breast', category: 'Meat & Seafood', avgCost: 12.99 },
    { name: 'Ground Beef', category: 'Meat & Seafood', avgCost: 8.99 },
    { name: 'Milk', category: 'Dairy & Eggs', avgCost: 4.49 },
    { name: 'Eggs', category: 'Dairy & Eggs', avgCost: 5.99 },
    { name: 'Bread', category: 'Bakery', avgCost: 3.99 },
    { name: 'Pasta', category: 'Pantry & Canned', avgCost: 2.49 },
    { name: 'Rice', category: 'Pantry & Canned', avgCost: 7.99 },
    { name: 'Tomato Sauce', category: 'Pantry & Canned', avgCost: 2.99 },
];

const tealColor = '#0d9488';
const maroonColor = '#800000';

export const GroceryListDialog: React.FC<GroceryListDialogProps> = ({
                                                                        open,
                                                                        onClose,
                                                                        budgets,
                                                                        onSave
                                                                    }) => {
    const [mode, setMode] = useState<'manual' | 'ai'>('manual');
    const [items, setItems] = useState<GroceryListItem[]>([]);
    const [selectedBudgetId, setSelectedBudgetId] = useState<number>(budgets[0]?.id || 1);
    const [newItem, setNewItem] = useState({
        itemName: '',
        estimatedCost: '',
        category: 'Produce',
        quantity: 1,
        notes: ''
    });
    const [isGenerating, setIsGenerating] = useState(false);

    const selectedBudget = budgets.find(b => b.id === selectedBudgetId);
    const budgetAmount = selectedBudget?.budgetAmount || 0;
    const totalCost = items.reduce((sum, item) => sum + (item.estimatedCost * item.quantity), 0);
    const percentUsed = (totalCost / budgetAmount) * 100;

    const handleModeChange = (_event: React.SyntheticEvent, newMode: 'manual' | 'ai') => {
        setMode(newMode);
    };

    const handleAddItem = () => {
        if (!newItem.itemName || !newItem.estimatedCost) return;

        const item: GroceryListItem = {
            id: Date.now().toString(),
            itemName: newItem.itemName,
            estimatedCost: parseFloat(newItem.estimatedCost),
            category: newItem.category,
            quantity: newItem.quantity,
            notes: newItem.notes
        };

        setItems([...items, item]);
        setNewItem({
            itemName: '',
            estimatedCost: '',
            category: 'Produce',
            quantity: 1,
            notes: ''
        });
    };

    const handleDeleteItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleGenerateOptimizedList = () => {
        setIsGenerating(true);

        setTimeout(() => {
            const optimizedItems: GroceryListItem[] = [
                { id: '1', itemName: 'Chicken Breast', estimatedCost: 12.99, category: 'Meat & Seafood', quantity: 2, notes: 'High protein, versatile' },
                { id: '2', itemName: 'Brown Rice', estimatedCost: 7.99, category: 'Pantry & Canned', quantity: 1, notes: 'Whole grain staple' },
                { id: '3', itemName: 'Mixed Vegetables', estimatedCost: 8.50, category: 'Frozen Foods', quantity: 2, notes: 'Convenient and nutritious' },
                { id: '4', itemName: 'Apples', estimatedCost: 4.99, category: 'Produce', quantity: 1, notes: 'Fresh fruit snack' },
                { id: '5', itemName: 'Eggs', estimatedCost: 5.99, category: 'Dairy & Eggs', quantity: 1, notes: 'Protein-rich breakfast' },
                { id: '6', itemName: 'Whole Wheat Bread', estimatedCost: 3.99, category: 'Bakery', quantity: 1, notes: 'Daily staple' },
                { id: '7', itemName: 'Pasta', estimatedCost: 2.49, category: 'Pantry & Canned', quantity: 2, notes: 'Quick meal base' },
                { id: '8', itemName: 'Tomato Sauce', estimatedCost: 2.99, category: 'Pantry & Canned', quantity: 2, notes: 'Pasta accompaniment' },
                { id: '9', itemName: 'Milk', estimatedCost: 4.49, category: 'Dairy & Eggs', quantity: 1, notes: 'Calcium source' },
                { id: '10', itemName: 'Bananas', estimatedCost: 2.99, category: 'Produce', quantity: 1, notes: 'Quick energy snack' },
                { id: '11', itemName: 'Canned Beans', estimatedCost: 1.99, category: 'Pantry & Canned', quantity: 3, notes: 'Protein and fiber' },
                { id: '12', itemName: 'Greek Yogurt', estimatedCost: 6.99, category: 'Dairy & Eggs', quantity: 1, notes: 'Probiotic snack' }
            ];

            let total = optimizedItems.reduce((sum, item) => sum + (item.estimatedCost * item.quantity), 0);

            while (total > budgetAmount && optimizedItems.length > 0) {
                const removedItem = optimizedItems.pop();
                if (removedItem) {
                    total -= removedItem.estimatedCost * removedItem.quantity;
                }
            }

            setItems(optimizedItems);
            setIsGenerating(false);
        }, 2000);
    };

    const handleSave = () => {
        onSave(items, selectedBudgetId);
        onClose();
    };

    const handleQuickAdd = (commonItem: typeof COMMON_ITEMS[0]) => {
        const item: GroceryListItem = {
            id: Date.now().toString(),
            itemName: commonItem.name,
            estimatedCost: commonItem.avgCost,
            category: commonItem.category,
            quantity: 1
        };
        setItems([...items, item]);
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
            <DialogTitle sx={{
                pb: 2,
                background: `linear-gradient(135deg, ${maroonColor} 0%, #a00000 100%)`,
                color: 'white'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShoppingCartIcon />
                        <Typography variant="h6" fontWeight={600}>
                            Create Grocery List
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Budget Selector */}
                <Box sx={{ mt: 2 }}>
                    <FormControl
                        fullWidth
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                color: 'white',
                                '& fieldset': {
                                    borderColor: 'rgba(255,255,255,0.3)'
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(255,255,255,0.5)'
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: 'rgba(255,255,255,0.7)'
                                }
                            },
                            '& .MuiInputLabel-root': {
                                color: 'rgba(255,255,255,0.7)'
                            },
                            '& .MuiSelect-icon': {
                                color: 'white'
                            }
                        }}
                    >
                        <InputLabel sx={{ color: 'rgba(255,255,255,0.9)' }}>
                            Select Grocery Budget
                        </InputLabel>
                        <Select
                            value={selectedBudgetId}
                            label="Select Grocery Budget"
                            onChange={(e) => setSelectedBudgetId(e.target.value as number)}
                            sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                        >
                            {budgets.map((budget) => (
                                <MenuItem key={budget.id} value={budget.id}>
                                    {budget.name} (${budget.budgetAmount.toFixed(2)})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </DialogTitle>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={mode} onChange={handleModeChange} centered>
                    <Tab
                        value="manual"
                        icon={<EditIcon />}
                        label="Manual Entry"
                        iconPosition="start"
                    />
                    <Tab
                        value="ai"
                        icon={<AutoAwesomeIcon />}
                        label="AI-Assisted"
                        iconPosition="start"
                    />
                </Tabs>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                {/* Budget Progress */}
                <Card sx={{
                    mb: 3,
                    bgcolor: alpha(tealColor, 0.05),
                    border: `1px solid ${alpha(tealColor, 0.2)}`
                }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Estimated Total
                            </Typography>
                            <Typography variant="h6" fontWeight={700} color={maroonColor}>
                                ${totalCost.toFixed(2)} / ${budgetAmount.toFixed(2)}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(percentUsed, 100)}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: alpha(tealColor, 0.2),
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: percentUsed > 100 ? '#dc2626' : tealColor,
                                    borderRadius: 4
                                }
                            }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {percentUsed > 100
                                ? `Over budget by $${(totalCost - budgetAmount).toFixed(2)}`
                                : `$${(budgetAmount - totalCost).toFixed(2)} remaining`
                            }
                        </Typography>
                    </CardContent>
                </Card>

                {/* MANUAL MODE */}
                {mode === 'manual' && (
                    <Box>
                        {/* Quick Add */}
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                <LightbulbIcon sx={{ fontSize: 18, color: tealColor }} />
                                <Typography variant="subtitle2" fontWeight={600}>
                                    Quick Add Common Items
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {COMMON_ITEMS.slice(0, 6).map((item, index) => (
                                    <Chip
                                        key={index}
                                        label={`${item.name} ($${item.avgCost})`}
                                        onClick={() => handleQuickAdd(item)}
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': {
                                                bgcolor: alpha(tealColor, 0.1)
                                            }
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* Add Item Form */}
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                            Add New Item
                        </Typography>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={6}>
                                <Autocomplete
                                    freeSolo
                                    options={COMMON_ITEMS.map(item => item.name)}
                                    value={newItem.itemName}
                                    onChange={(_, value) => {
                                        const commonItem = COMMON_ITEMS.find(i => i.name === value);
                                        setNewItem({
                                            ...newItem,
                                            itemName: value || '',
                                            estimatedCost: commonItem ? commonItem.avgCost.toString() : newItem.estimatedCost,
                                            category: commonItem ? commonItem.category : newItem.category
                                        });
                                    }}
                                    onInputChange={(_, value) => {
                                        setNewItem({ ...newItem, itemName: value });
                                    }}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Item Name" fullWidth />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={newItem.category}
                                        label="Category"
                                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                    >
                                        {CATEGORIES.map((cat) => (
                                            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6} sm={4}>
                                <TextField
                                    label="Estimated Cost"
                                    fullWidth
                                    type="number"
                                    value={newItem.estimatedCost}
                                    onChange={(e) => setNewItem({ ...newItem, estimatedCost: e.target.value })}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6} sm={4}>
                                <TextField
                                    label="Quantity"
                                    fullWidth
                                    type="number"
                                    value={newItem.quantity}
                                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                                    inputProps={{ min: 1 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<AddIcon />}
                                    onClick={handleAddItem}
                                    disabled={!newItem.itemName || !newItem.estimatedCost}
                                    sx={{
                                        height: '56px',
                                        background: `linear-gradient(135deg, ${tealColor} 0%, #14b8a6 100%)`,
                                        '&:hover': {
                                            background: `linear-gradient(135deg, #0f766e 0%, ${tealColor} 100%)`
                                        }
                                    }}
                                >
                                    Add Item
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {/* AI MODE */}
                {mode === 'ai' && (
                    <Box>
                        <Card sx={{
                            mb: 3,
                            bgcolor: alpha('#8b5cf6', 0.05),
                            border: `1px solid ${alpha('#8b5cf6', 0.2)}`
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                    <AutoAwesomeIcon sx={{ color: '#8b5cf6', mt: 0.5 }} />
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                                            AI-Powered Grocery Optimization
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" paragraph>
                                            Our AI will create an optimized shopping list that:
                                        </Typography>
                                        <Stack spacing={0.5}>
                                            <Typography variant="body2" color="text.secondary">
                                                • Maximizes nutritional value within your budget
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                • Balances variety across food categories
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                • Suggests versatile ingredients for multiple meals
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                • Stays within your ${budgetAmount.toFixed(2)} budget
                                            </Typography>
                                        </Stack>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>

                        {items.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={isGenerating ? null : <AutoAwesomeIcon />}
                                    onClick={handleGenerateOptimizedList}
                                    disabled={isGenerating}
                                    sx={{
                                        background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                                        px: 4,
                                        py: 1.5,
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)'
                                        }
                                    }}
                                >
                                    {isGenerating ? 'Generating...' : 'Generate Optimized List'}
                                </Button>
                                {isGenerating && <LinearProgress sx={{ mt: 2, maxWidth: 400, mx: 'auto' }} />}
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', mb: 2 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<AutoAwesomeIcon />}
                                    onClick={handleGenerateOptimizedList}
                                    disabled={isGenerating}
                                >
                                    Regenerate List
                                </Button>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Items List */}
                {items.length > 0 && (
                    <Box>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                            Shopping List ({items.length} items)
                        </Typography>
                        <List>
                            {items.map((item) => (
                                <ListItem
                                    key={item.id}
                                    sx={{
                                        mb: 1,
                                        border: `1px solid ${alpha('#000', 0.1)}`,
                                        borderRadius: 2,
                                        '&:hover': {
                                            bgcolor: alpha(tealColor, 0.03)
                                        }
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body1" fontWeight={600}>
                                                    {item.itemName}
                                                </Typography>
                                                <Chip
                                                    label={item.category}
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: '0.7rem',
                                                        bgcolor: alpha(tealColor, 0.1),
                                                        color: tealColor
                                                    }}
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    ${item.estimatedCost.toFixed(2)} × {item.quantity} = ${(item.estimatedCost * item.quantity).toFixed(2)}
                                                </Typography>
                                                {item.notes && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                        {item.notes}
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleDeleteItem(item.id)}
                                            sx={{ color: '#dc2626' }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}

                {items.length === 0 && mode === 'manual' && (
                    <Box sx={{
                        textAlign: 'center',
                        py: 4,
                        border: `2px dashed ${alpha('#000', 0.1)}`,
                        borderRadius: 2,
                        bgcolor: alpha('#000', 0.02)
                    }}>
                        <ShoppingCartIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body1" color="text.secondary">
                            No items added yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Add items above or try AI-assisted mode
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={items.length === 0}
                    startIcon={<CheckIcon />}
                    sx={{
                        background: `linear-gradient(135deg, ${maroonColor} 0%, #a00000 100%)`,
                        '&:hover': {
                            background: `linear-gradient(135deg, #600000 0%, ${maroonColor} 100%)`
                        }
                    }}
                >
                    Save to {selectedBudget?.name} ({items.length} items)
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GroceryListDialog;

// import React, { useState } from 'react';
// import {
//     Dialog,
//     DialogTitle,
//     DialogContent,
//     DialogActions,
//     Button,
//     Box,
//     Typography,
//     TextField,
//     IconButton,
//     Tabs,
//     Tab,
//     List,
//     ListItem,
//     ListItemText,
//     ListItemSecondaryAction,
//     Chip,
//     Card,
//     CardContent,
//     Grid,
//     FormControl,
//     InputLabel,
//     Select,
//     MenuItem,
//     alpha,
//     LinearProgress,
//     Stack,
//     Divider,
//     InputAdornment,
//     Autocomplete
// } from '@mui/material';
// import {
//     Close as CloseIcon,
//     Add as AddIcon,
//     Delete as DeleteIcon,
//     ShoppingCart as ShoppingCartIcon,
//     AutoAwesome as AutoAwesomeIcon,
//     Edit as EditIcon,
//     Check as CheckIcon,
//     Lightbulb as LightbulbIcon
// } from '@mui/icons-material';
//
// export interface GroceryListItem {
//     id: string;
//     itemName: string;
//     estimatedCost: number;
//     category: string;
//     quantity: number;
//     notes?: string;
// }
//
// interface GroceryListDialogProps {
//     open: boolean;
//     onClose: () => void;
//     budgetAmount: number;
//     budgetName: string;
//     onSave: (items: GroceryListItem[]) => void;
// }
//
// const CATEGORIES = [
//     'Produce',
//     'Meat & Seafood',
//     'Dairy & Eggs',
//     'Bakery',
//     'Pantry & Canned',
//     'Frozen Foods',
//     'Beverages',
//     'Snacks',
//     'Household',
//     'Other'
// ];
//
// const COMMON_ITEMS = [
//     { name: 'Apples', category: 'Produce', avgCost: 4.99 },
//     { name: 'Bananas', category: 'Produce', avgCost: 2.99 },
//     { name: 'Chicken Breast', category: 'Meat & Seafood', avgCost: 12.99 },
//     { name: 'Ground Beef', category: 'Meat & Seafood', avgCost: 8.99 },
//     { name: 'Milk', category: 'Dairy & Eggs', avgCost: 4.49 },
//     { name: 'Eggs', category: 'Dairy & Eggs', avgCost: 5.99 },
//     { name: 'Bread', category: 'Bakery', avgCost: 3.99 },
//     { name: 'Pasta', category: 'Pantry & Canned', avgCost: 2.49 },
//     { name: 'Rice', category: 'Pantry & Canned', avgCost: 7.99 },
//     { name: 'Tomato Sauce', category: 'Pantry & Canned', avgCost: 2.99 },
// ];
//
// const tealColor = '#0d9488';
// const maroonColor = '#800000';
//
// export const GroceryListDialog: React.FC<GroceryListDialogProps> = ({
//                                                                         open,
//                                                                         onClose,
//                                                                         budgetAmount,
//                                                                         budgetName,
//                                                                         onSave
//                                                                     }) => {
//     const [mode, setMode] = useState<'manual' | 'ai'>('manual');
//     const [items, setItems] = useState<GroceryListItem[]>([]);
//     const [newItem, setNewItem] = useState({
//         itemName: '',
//         estimatedCost: '',
//         category: 'Produce',
//         quantity: 1,
//         notes: ''
//     });
//     const [isGenerating, setIsGenerating] = useState(false);
//
//     const totalCost = items.reduce((sum, item) => sum + (item.estimatedCost * item.quantity), 0);
//     const percentUsed = (totalCost / budgetAmount) * 100;
//
//     const handleModeChange = (_event: React.SyntheticEvent, newMode: 'manual' | 'ai') => {
//         setMode(newMode);
//     };
//
//     const handleAddItem = () => {
//         if (!newItem.itemName || !newItem.estimatedCost) return;
//
//         const item: GroceryListItem = {
//             id: Date.now().toString(),
//             itemName: newItem.itemName,
//             estimatedCost: parseFloat(newItem.estimatedCost),
//             category: newItem.category,
//             quantity: newItem.quantity,
//             notes: newItem.notes
//         };
//
//         setItems([...items, item]);
//         setNewItem({
//             itemName: '',
//             estimatedCost: '',
//             category: 'Produce',
//             quantity: 1,
//             notes: ''
//         });
//     };
//
//     const handleDeleteItem = (id: string) => {
//         setItems(items.filter(item => item.id !== id));
//     };
//
//     const handleGenerateOptimizedList = () => {
//         setIsGenerating(true);
//
//         // Simulate AI generation
//         setTimeout(() => {
//             const optimizedItems: GroceryListItem[] = [
//                 { id: '1', itemName: 'Chicken Breast', estimatedCost: 12.99, category: 'Meat & Seafood', quantity: 2, notes: 'High protein, versatile' },
//                 { id: '2', itemName: 'Brown Rice', estimatedCost: 7.99, category: 'Pantry & Canned', quantity: 1, notes: 'Whole grain staple' },
//                 { id: '3', itemName: 'Mixed Vegetables', estimatedCost: 8.50, category: 'Frozen Foods', quantity: 2, notes: 'Convenient and nutritious' },
//                 { id: '4', itemName: 'Apples', estimatedCost: 4.99, category: 'Produce', quantity: 1, notes: 'Fresh fruit snack' },
//                 { id: '5', itemName: 'Eggs', estimatedCost: 5.99, category: 'Dairy & Eggs', quantity: 1, notes: 'Protein-rich breakfast' },
//                 { id: '6', itemName: 'Whole Wheat Bread', estimatedCost: 3.99, category: 'Bakery', quantity: 1, notes: 'Daily staple' },
//                 { id: '7', itemName: 'Pasta', estimatedCost: 2.49, category: 'Pantry & Canned', quantity: 2, notes: 'Quick meal base' },
//                 { id: '8', itemName: 'Tomato Sauce', estimatedCost: 2.99, category: 'Pantry & Canned', quantity: 2, notes: 'Pasta accompaniment' },
//                 { id: '9', itemName: 'Milk', estimatedCost: 4.49, category: 'Dairy & Eggs', quantity: 1, notes: 'Calcium source' },
//                 { id: '10', itemName: 'Bananas', estimatedCost: 2.99, category: 'Produce', quantity: 1, notes: 'Quick energy snack' },
//                 { id: '11', itemName: 'Canned Beans', estimatedCost: 1.99, category: 'Pantry & Canned', quantity: 3, notes: 'Protein and fiber' },
//                 { id: '12', itemName: 'Greek Yogurt', estimatedCost: 6.99, category: 'Dairy & Eggs', quantity: 1, notes: 'Probiotic snack' }
//             ];
//
//             // Adjust to fit budget
//             let total = optimizedItems.reduce((sum, item) => sum + (item.estimatedCost * item.quantity), 0);
//
//             while (total > budgetAmount && optimizedItems.length > 0) {
//                 const removedItem = optimizedItems.pop();
//                 if (removedItem) {
//                     total -= removedItem.estimatedCost * removedItem.quantity;
//                 }
//             }
//
//             setItems(optimizedItems);
//             setIsGenerating(false);
//         }, 2000);
//     };
//
//     const handleSave = () => {
//         onSave(items);
//         onClose();
//     };
//
//     const handleQuickAdd = (commonItem: typeof COMMON_ITEMS[0]) => {
//         const item: GroceryListItem = {
//             id: Date.now().toString(),
//             itemName: commonItem.name,
//             estimatedCost: commonItem.avgCost,
//             category: commonItem.category,
//             quantity: 1
//         };
//         setItems([...items, item]);
//     };
//
//     return (
//         <Dialog
//             open={open}
//             onClose={onClose}
//             maxWidth="md"
//             fullWidth
//             PaperProps={{
//                 sx: {
//                     borderRadius: 3,
//                     maxHeight: '90vh'
//                 }
//             }}
//         >
//             <DialogTitle sx={{
//                 pb: 2,
//                 background: `linear-gradient(135deg, ${maroonColor} 0%, #a00000 100%)`,
//                 color: 'white'
//             }}>
//                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                         <ShoppingCartIcon />
//                         <Typography variant="h6" fontWeight={600}>
//                             Create Grocery List
//                         </Typography>
//                     </Box>
//                     <IconButton
//                         onClick={onClose}
//                         sx={{
//                             color: 'white',
//                             '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
//                         }}
//                     >
//                         <CloseIcon />
//                     </IconButton>
//                 </Box>
//                 <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
//                     {budgetName} • ${budgetAmount.toFixed(2)} budget
//                 </Typography>
//             </DialogTitle>
//
//             <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
//                 <Tabs value={mode} onChange={handleModeChange} centered>
//                     <Tab
//                         value="manual"
//                         icon={<EditIcon />}
//                         label="Manual Entry"
//                         iconPosition="start"
//                     />
//                     <Tab
//                         value="ai"
//                         icon={<AutoAwesomeIcon />}
//                         label="AI-Assisted"
//                         iconPosition="start"
//                     />
//                 </Tabs>
//             </Box>
//
//             <DialogContent sx={{ p: 3 }}>
//                 {/* Budget Progress */}
//                 <Card sx={{
//                     mb: 3,
//                     bgcolor: alpha(tealColor, 0.05),
//                     border: `1px solid ${alpha(tealColor, 0.2)}`
//                 }}>
//                     <CardContent>
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
//                             <Typography variant="body2" color="text.secondary">
//                                 Estimated Total
//                             </Typography>
//                             <Typography variant="h6" fontWeight={700} color={maroonColor}>
//                                 ${totalCost.toFixed(2)} / ${budgetAmount.toFixed(2)}
//                             </Typography>
//                         </Box>
//                         <LinearProgress
//                             variant="determinate"
//                             value={Math.min(percentUsed, 100)}
//                             sx={{
//                                 height: 8,
//                                 borderRadius: 4,
//                                 bgcolor: alpha(tealColor, 0.2),
//                                 '& .MuiLinearProgress-bar': {
//                                     bgcolor: percentUsed > 100 ? '#dc2626' : tealColor,
//                                     borderRadius: 4
//                                 }
//                             }}
//                         />
//                         <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
//                             {percentUsed > 100
//                                 ? `Over budget by $${(totalCost - budgetAmount).toFixed(2)}`
//                                 : `$${(budgetAmount - totalCost).toFixed(2)} remaining`
//                             }
//                         </Typography>
//                     </CardContent>
//                 </Card>
//
//                 {/* MANUAL MODE */}
//                 {mode === 'manual' && (
//                     <Box>
//                         {/* Quick Add */}
//                         <Box sx={{ mb: 3 }}>
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
//                                 <LightbulbIcon sx={{ fontSize: 18, color: tealColor }} />
//                                 <Typography variant="subtitle2" fontWeight={600}>
//                                     Quick Add Common Items
//                                 </Typography>
//                             </Box>
//                             <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
//                                 {COMMON_ITEMS.slice(0, 6).map((item, index) => (
//                                     <Chip
//                                         key={index}
//                                         label={`${item.name} ($${item.avgCost})`}
//                                         onClick={() => handleQuickAdd(item)}
//                                         sx={{
//                                             cursor: 'pointer',
//                                             '&:hover': {
//                                                 bgcolor: alpha(tealColor, 0.1)
//                                             }
//                                         }}
//                                     />
//                                 ))}
//                             </Box>
//                         </Box>
//
//                         <Divider sx={{ my: 2 }} />
//
//                         {/* Add Item Form */}
//                         <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
//                             Add New Item
//                         </Typography>
//                         <Grid container spacing={2} sx={{ mb: 3 }}>
//                             <Grid item xs={12} sm={6}>
//                                 <Autocomplete
//                                     freeSolo
//                                     options={COMMON_ITEMS.map(item => item.name)}
//                                     value={newItem.itemName}
//                                     onChange={(_, value) => {
//                                         const commonItem = COMMON_ITEMS.find(i => i.name === value);
//                                         setNewItem({
//                                             ...newItem,
//                                             itemName: value || '',
//                                             estimatedCost: commonItem ? commonItem.avgCost.toString() : newItem.estimatedCost,
//                                             category: commonItem ? commonItem.category : newItem.category
//                                         });
//                                     }}
//                                     onInputChange={(_, value) => {
//                                         setNewItem({ ...newItem, itemName: value });
//                                     }}
//                                     renderInput={(params) => (
//                                         <TextField {...params} label="Item Name" fullWidth />
//                                     )}
//                                 />
//                             </Grid>
//                             <Grid item xs={12} sm={6}>
//                                 <FormControl fullWidth>
//                                     <InputLabel>Category</InputLabel>
//                                     <Select
//                                         value={newItem.category}
//                                         label="Category"
//                                         onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
//                                     >
//                                         {CATEGORIES.map((cat) => (
//                                             <MenuItem key={cat} value={cat}>{cat}</MenuItem>
//                                         ))}
//                                     </Select>
//                                 </FormControl>
//                             </Grid>
//                             <Grid item xs={6} sm={4}>
//                                 <TextField
//                                     label="Estimated Cost"
//                                     fullWidth
//                                     type="number"
//                                     value={newItem.estimatedCost}
//                                     onChange={(e) => setNewItem({ ...newItem, estimatedCost: e.target.value })}
//                                     InputProps={{
//                                         startAdornment: <InputAdornment position="start">$</InputAdornment>
//                                     }}
//                                 />
//                             </Grid>
//                             <Grid item xs={6} sm={4}>
//                                 <TextField
//                                     label="Quantity"
//                                     fullWidth
//                                     type="number"
//                                     value={newItem.quantity}
//                                     onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
//                                     inputProps={{ min: 1 }}
//                                 />
//                             </Grid>
//                             <Grid item xs={12} sm={4}>
//                                 <Button
//                                     variant="contained"
//                                     fullWidth
//                                     startIcon={<AddIcon />}
//                                     onClick={handleAddItem}
//                                     disabled={!newItem.itemName || !newItem.estimatedCost}
//                                     sx={{
//                                         height: '56px',
//                                         background: `linear-gradient(135deg, ${tealColor} 0%, #14b8a6 100%)`,
//                                         '&:hover': {
//                                             background: `linear-gradient(135deg, #0f766e 0%, ${tealColor} 100%)`
//                                         }
//                                     }}
//                                 >
//                                     Add Item
//                                 </Button>
//                             </Grid>
//                         </Grid>
//                     </Box>
//                 )}
//
//                 {/* AI MODE */}
//                 {mode === 'ai' && (
//                     <Box>
//                         <Card sx={{
//                             mb: 3,
//                             bgcolor: alpha('#8b5cf6', 0.05),
//                             border: `1px solid ${alpha('#8b5cf6', 0.2)}`
//                         }}>
//                             <CardContent>
//                                 <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
//                                     <AutoAwesomeIcon sx={{ color: '#8b5cf6', mt: 0.5 }} />
//                                     <Box>
//                                         <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
//                                             AI-Powered Grocery Optimization
//                                         </Typography>
//                                         <Typography variant="body2" color="text.secondary" paragraph>
//                                             Our AI will create an optimized shopping list that:
//                                         </Typography>
//                                         <Stack spacing={0.5}>
//                                             <Typography variant="body2" color="text.secondary">
//                                                 • Maximizes nutritional value within your budget
//                                             </Typography>
//                                             <Typography variant="body2" color="text.secondary">
//                                                 • Balances variety across food categories
//                                             </Typography>
//                                             <Typography variant="body2" color="text.secondary">
//                                                 • Suggests versatile ingredients for multiple meals
//                                             </Typography>
//                                             <Typography variant="body2" color="text.secondary">
//                                                 • Stays within your ${budgetAmount.toFixed(2)} budget
//                                             </Typography>
//                                         </Stack>
//                                     </Box>
//                                 </Box>
//                             </CardContent>
//                         </Card>
//
//                         {items.length === 0 ? (
//                             <Box sx={{ textAlign: 'center', py: 4 }}>
//                                 <Button
//                                     variant="contained"
//                                     size="large"
//                                     startIcon={isGenerating ? null : <AutoAwesomeIcon />}
//                                     onClick={handleGenerateOptimizedList}
//                                     disabled={isGenerating}
//                                     sx={{
//                                         background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
//                                         px: 4,
//                                         py: 1.5,
//                                         '&:hover': {
//                                             background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)'
//                                         }
//                                     }}
//                                 >
//                                     {isGenerating ? 'Generating...' : 'Generate Optimized List'}
//                                 </Button>
//                                 {isGenerating && <LinearProgress sx={{ mt: 2, maxWidth: 400, mx: 'auto' }} />}
//                             </Box>
//                         ) : (
//                             <Box sx={{ textAlign: 'center', mb: 2 }}>
//                                 <Button
//                                     variant="outlined"
//                                     startIcon={<AutoAwesomeIcon />}
//                                     onClick={handleGenerateOptimizedList}
//                                     disabled={isGenerating}
//                                 >
//                                     Regenerate List
//                                 </Button>
//                             </Box>
//                         )}
//                     </Box>
//                 )}
//
//                 {/* Items List */}
//                 {items.length > 0 && (
//                     <Box>
//                         <Divider sx={{ my: 2 }} />
//                         <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
//                             Shopping List ({items.length} items)
//                         </Typography>
//                         <List>
//                             {items.map((item) => (
//                                 <ListItem
//                                     key={item.id}
//                                     sx={{
//                                         mb: 1,
//                                         border: `1px solid ${alpha('#000', 0.1)}`,
//                                         borderRadius: 2,
//                                         '&:hover': {
//                                             bgcolor: alpha(tealColor, 0.03)
//                                         }
//                                     }}
//                                 >
//                                     <ListItemText
//                                         primary={
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                                 <Typography variant="body1" fontWeight={600}>
//                                                     {item.itemName}
//                                                 </Typography>
//                                                 <Chip
//                                                     label={item.category}
//                                                     size="small"
//                                                     sx={{
//                                                         height: 20,
//                                                         fontSize: '0.7rem',
//                                                         bgcolor: alpha(tealColor, 0.1),
//                                                         color: tealColor
//                                                     }}
//                                                 />
//                                             </Box>
//                                         }
//                                         secondary={
//                                             <Box>
//                                                 <Typography variant="body2" color="text.secondary">
//                                                     ${item.estimatedCost.toFixed(2)} × {item.quantity} = ${(item.estimatedCost * item.quantity).toFixed(2)}
//                                                 </Typography>
//                                                 {item.notes && (
//                                                     <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
//                                                         {item.notes}
//                                                     </Typography>
//                                                 )}
//                                             </Box>
//                                         }
//                                     />
//                                     <ListItemSecondaryAction>
//                                         <IconButton
//                                             edge="end"
//                                             onClick={() => handleDeleteItem(item.id)}
//                                             sx={{ color: '#dc2626' }}
//                                         >
//                                             <DeleteIcon />
//                                         </IconButton>
//                                     </ListItemSecondaryAction>
//                                 </ListItem>
//                             ))}
//                         </List>
//                     </Box>
//                 )}
//
//                 {items.length === 0 && mode === 'manual' && (
//                     <Box sx={{
//                         textAlign: 'center',
//                         py: 4,
//                         border: `2px dashed ${alpha('#000', 0.1)}`,
//                         borderRadius: 2,
//                         bgcolor: alpha('#000', 0.02)
//                     }}>
//                         <ShoppingCartIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
//                         <Typography variant="body1" color="text.secondary">
//                             No items added yet
//                         </Typography>
//                         <Typography variant="body2" color="text.secondary">
//                             Add items above or try AI-assisted mode
//                         </Typography>
//                     </Box>
//                 )}
//             </DialogContent>
//
//             <DialogActions sx={{ p: 3, pt: 0 }}>
//                 <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
//                     Cancel
//                 </Button>
//                 <Button
//                     onClick={handleSave}
//                     variant="contained"
//                     disabled={items.length === 0}
//                     startIcon={<CheckIcon />}
//                     sx={{
//                         background: `linear-gradient(135deg, ${maroonColor} 0%, #a00000 100%)`,
//                         '&:hover': {
//                             background: `linear-gradient(135deg, #600000 0%, ${maroonColor} 100%)`
//                         }
//                     }}
//                 >
//                     Save Grocery List ({items.length} items)
//                 </Button>
//             </DialogActions>
//         </Dialog>
//     );
// };
//
// export default GroceryListDialog;