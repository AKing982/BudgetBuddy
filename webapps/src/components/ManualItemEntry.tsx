import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Divider,
    Alert
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import {GroceryItem} from "../config/Types";

interface Props {
    onSubmit: (items: GroceryItem[]) => void;
    onCancel: () => void;
    loading: boolean;
}

export const ManualItemEntry: React.FC<Props> = ({ onSubmit, onCancel, loading }) => {
    const [items, setItems] = useState<GroceryItem[]>([]);
    const [currentItem, setCurrentItem] = useState<GroceryItem>({
        itemName: '',
        itemCost: 0,
        itemDescription: '',
        storeName: '',
        datePurchased: new Date().toISOString().split('T')[0],
        quantity: 1
    });

    const addItem = () => {
        if (!currentItem.itemName || !currentItem.storeName || currentItem.itemCost <= 0) {
            return;
        }

        setItems([...items, { ...currentItem }]);
        setCurrentItem({
            itemName: '',
            itemCost: 0,
            itemDescription: '',
            storeName: '',
            datePurchased: new Date().toISOString().split('T')[0],
            quantity: 1
        });
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (items.length === 0) return;
        onSubmit(items);
    };

    const totalCost = items.reduce((sum, item) => sum + item.itemCost, 0);

    return (
        <Card>
            <CardContent>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Manual Item Entry
                </Typography>

                {/* Item Form */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            required
                            label="Item Name"
                            value={currentItem.itemName}
                            onChange={(e) => setCurrentItem({ ...currentItem, itemName: e.target.value })}
                            placeholder="e.g., Milk"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            required
                            label="Cost"
                            type="number"
                            value={currentItem.itemCost || ''}
                            onChange={(e) => setCurrentItem({ ...currentItem, itemCost: parseFloat(e.target.value) })}
                            InputProps={{ startAdornment: '$' }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            required
                            label="Store Name"
                            value={currentItem.storeName}
                            onChange={(e) => setCurrentItem({ ...currentItem, storeName: e.target.value })}
                            placeholder="e.g., Walmart"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Date Purchased"
                                value={new Date(currentItem.datePurchased)}
                                onChange={(date) => setCurrentItem({
                                    ...currentItem,
                                    datePurchased: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                                })}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Quantity"
                            type="number"
                            value={currentItem.quantity || ''}
                            onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Description"
                            value={currentItem.itemDescription}
                            onChange={(e) => setCurrentItem({ ...currentItem, itemDescription: e.target.value })}
                            placeholder="Optional"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            startIcon={<AddIcon />}
                            onClick={addItem}
                            size="large"
                        >
                            Add Item to List
                        </Button>
                    </Grid>
                </Grid>

                {/* Items List */}
                {items.length > 0 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Items Added ({items.length})
                        </Typography>
                        <List sx={{ maxHeight: 400, overflow: 'auto', mb: 2 }}>
                            {items.map((item, idx) => (
                                <ListItem
                                    key={idx}
                                    secondaryAction={
                                        <IconButton edge="end" onClick={() => removeItem(idx)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    }
                                    sx={{ bgcolor: 'grey.50', mb: 1, borderRadius: 1 }}
                                >
                                    <ListItemText
                                        primary={
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography fontWeight="bold">{item.itemName}</Typography>
                                                <Typography color="success.main" fontWeight="bold">
                                                    ${item.itemCost}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={`${item.storeName} • ${item.datePurchased} • Qty: ${item.quantity}`}
                                    />
                                </ListItem>
                            ))}
                        </List>

                        <Divider sx={{ my: 2 }} />

                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                            <Typography variant="h6">Total:</Typography>
                            <Typography variant="h4" color="success.main" fontWeight="bold">
                                ${totalCost}
                            </Typography>
                        </Box>
                    </Box>
                )}

                {items.length === 0 && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Add items to your list using the form above
                    </Alert>
                )}

                {/* Action Buttons */}
                <Box display="flex" justifyContent="flex-end" gap={2}>
                    <Button onClick={onCancel} size="large">
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSubmit}
                        disabled={items.length === 0 || loading}
                        size="large"
                    >
                        {loading ? 'Saving...' : `Save ${items.length} Items`}
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};