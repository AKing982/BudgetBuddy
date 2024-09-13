import {useState} from "react";
import {
    Box, Typography, TextField, InputAdornment, Paper, Button,
    TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
    Checkbox, IconButton, Popover, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import {
    Search, ArrowDownToLine, ChevronDown, Edit, XCircle, RefreshCcw
} from 'lucide-react';

interface Transaction {
    transactionId: string;
    accountId: string;
    amount: number;
    category: string;
    categoryId: string;
    date: string;
    name: string;
    merchantName: string;
    pending: boolean;
    logoURL: string;
    authorizedDate: string;
    transactionType: string;
}

interface Category {
    name: string;
    icon: React.ReactNode;
}

interface CategoryDropdownProps {
    category: string;
    onCategoryChange: (newCategory: string) => void;
}

const categories: Category[] = [
    { name: 'Internal Transfers', icon: <RefreshCcw size={16} color="#757575" /> },
    { name: 'Charitable Donations', icon: '💚' },
    { name: 'Credit Card Payment', icon: '💳' },
    { name: 'Dining & Drinks', icon: '🍽️' },
    { name: 'Education', icon: '🏫' },
    // Add more categories as needed
];


const CategoryDropdown: React.FC<CategoryDropdownProps> = ({category, onCategoryChange}) => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    }

    const handleCategorySelect = (selectedCategory: string) => {
        onCategoryChange(selectedCategory);
        handleClose();
    }

    const open = Boolean(anchorEl);
    const id = open ? 'category-approve' : undefined;

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return (
        <>
            <Button
                onClick={handleClick}
                endIcon={<ChevronDown size={16} />}
                sx={{ textTransform: 'none', color: 'text.primary' }}
            >
                {category}
            </Button>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
            >
                <Box sx={{ p: 2, width: 250 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={20} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 2 }}
                    />
                    <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                        {filteredCategories.map((cat, index) => (
                            <ListItem button key={index} onClick={() => handleCategorySelect(cat.name)}>
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {typeof cat.icon === 'string' ? cat.icon : cat.icon}
                                </ListItemIcon>
                                <ListItemText primary={cat.name} />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Popover>
        </>
    );
}
export default CategoryDropdown;