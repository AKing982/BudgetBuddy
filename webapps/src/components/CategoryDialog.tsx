import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    TextField,
    FormControlLabel,
    Radio,
    RadioGroup,
    Box,
    Typography,
    Collapse,
    Divider,
    Checkbox,
    Stack,
    IconButton,
    Chip,
    Tooltip,
    Paper,
    CircularProgress,
    Alert,
    Fade,
    InputAdornment,
    Card,
    alpha,
    Tab,
    Tabs,
    ListItemSecondaryAction,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CategoryIcon from '@mui/icons-material/Category';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import LabelIcon from '@mui/icons-material/Label';
import CategoryService from "../services/CategoryService";
import UserCategoryService, {UserCategory} from "../services/UserCategoryService";

const maroonColor = '#800000';
const tealColor = '#0d9488';


interface CategoryDialogProps {
    open: boolean;
    onClose: () => void;
    currentCategory?: string;
    transactionId?: string | number;
    merchantName: string;
    description?: string;
    extendedDescription?: string;
    amount: number;
    availableCategories: string[];
    customCategories?: string[];
    disabledCategories?: string[];
    onSave: (data: CategorySaveData) => void | Promise<void>;
    onToggleCategory?: (category: string, enabled: boolean) => void | Promise<void>;
    onAddCustomCategory?: (category: string) => void | Promise<void>;
    onDeleteCustomCategory?: (category: string) => void | Promise<void>;
    onResetDisabledCategories?: () => void | Promise<void>;
}

export interface CategorySaveData {
    transactionId?: string | number;
    category: string;
    isCustomCategory: boolean;
    overrideSystemCategory: boolean;
    replacedCategories?: string[];
    advancedMatching?: {
        matchByMerchant: boolean;
        matchByDescription: boolean;
        matchByExtendedDescription: boolean;
        matchByAmountRange: boolean;
        merchantNameMatch?: string;
        descriptionMatch?: string;
        extendedDescriptionMatch?: string;
        amountRangeMin?: number;
        amountRangeMax?: number;
    };
}

const CategoryDialog: React.FC<CategoryDialogProps> = ({
                                                           open,
                                                           onClose,
                                                           currentCategory = '',
                                                           transactionId,
                                                           merchantName = '',
                                                           description = '',
                                                           extendedDescription = '',
                                                           amount,
                                                           availableCategories,
                                                           customCategories = [],
                                                           disabledCategories = [],
                                                           onSave,
                                                           onToggleCategory,
                                                           onAddCustomCategory,
                                                           onDeleteCustomCategory,
                                                           onResetDisabledCategories
                                                       }) => {
    const [selectedCategory, setSelectedCategory] = useState(currentCategory);
    const [customCategory, setCustomCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [localDisabledCategories, setLocalDisabledCategories] = useState<string[]>(disabledCategories);
    const [localCustomCategories, setLocalCustomCategories] = useState<string[]>(customCategories);
    const [overrideSystemCategory, setOverrideSystemCategory] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [selectedCategoriesToReplace, setSelectedCategoriesToReplace] = useState<string[]>([]);

    const categoryService = CategoryService.getInstance();
    const userCategoryService = UserCategoryService.getInstance();
    const [systemCategories, setSystemCategories] = useState<string[]>([]);
    const [userCustomCategories, setUserCustomCategories] = useState<UserCategory[]>([]);
    const userId = Number(sessionStorage.getItem('userId'));

    const [loadingCategories, setLoadingCategories] = useState(false);
    const [saving, setSaving] = useState(false);

    // Advanced matching options
    const [matchByMerchant, setMatchByMerchant] = useState(false);
    const [merchantNameMatch, setMerchantNameMatch] = useState(merchantName);
    const [merchantMatchType, setMerchantMatchType] = useState<'current' | 'manual'>('current');
    const [matchByDescription, setMatchByDescription] = useState(false);
    const [descriptionMatchType, setDescriptionMatchType] = useState<'current' | 'manual'>('current');
    const [descriptionMatch, setDescriptionMatch] = useState(description);
    const [matchByExtendedDescription, setMatchByExtendedDescription] = useState(false);
    const [extendedDescriptionMatchType, setExtendedDescriptionMatchType] = useState<'current' | 'manual'>('current');
    const [extendedDescriptionMatch, setExtendedDescriptionMatch] = useState(extendedDescription);
    const [matchByAmountRange, setMatchByAmountRange] = useState(false);
    const [amountMatchType, setAmountMatchType] = useState<'current' | 'manual'>('current');
    const [amountRangeMin, setAmountRangeMin] = useState(amount * 0.9);
    const [amountRangeMax, setAmountRangeMax] = useState(amount * 1.1);

    const handleCategorySelect = (category: string) => {
        if(isCategoryEnabled(category)){
            setSelectedCategory(category);
        }
    };

    React.useEffect(() => {
        const fetchCategories = async () => {
            if (open && systemCategories.length === 0) {
                setLoadingCategories(true);
                try {
                    const minDelay = new Promise(resolve => setTimeout(resolve, 800));
                    const fetchPromise = (async () => {
                        const sysCategories = await categoryService.getAllSystemCategories();
                        const sysCategoryNames = sysCategories.map(cat => cat.category);
                        setSystemCategories(sysCategoryNames);

                        const userCategories = await userCategoryService.getCustomUserCategories(userId);
                        setUserCustomCategories(userCategories);
                    })();

                    await Promise.all([fetchPromise, minDelay]);
                } catch (error) {
                    console.error('Error fetching categories:', error);
                } finally {
                    setLoadingCategories(false);
                }
            }
        };
        fetchCategories();
    }, [open, userId]);

    React.useEffect(() => {
        if (open) {
            setLocalDisabledCategories(disabledCategories);
            setLocalCustomCategories([]);
            setSearchQuery('');
        }
    }, [open]);

    const allCategories = React.useMemo(() => {
        const categorySet = new Set<string>();
        systemCategories.forEach(cat => categorySet.add(cat));
        userCustomCategories.forEach(cat => {
            if (cat.category) categorySet.add(cat.category);
        });
        if (availableCategories) {
            availableCategories.forEach(cat => categorySet.add(cat));
        }
        if (customCategories) {
            customCategories.forEach(cat => categorySet.add(cat));
        }
        localCustomCategories.forEach(cat => categorySet.add(cat));
        return Array.from(categorySet).sort();
    }, [systemCategories, userCustomCategories, availableCategories, customCategories, localCustomCategories]);

    const filteredCategories = React.useMemo(() => {
        if (!searchQuery.trim()) return allCategories;
        return allCategories.filter(cat =>
            cat.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allCategories, searchQuery]);

    const handleCustomCategoryChange = (value: string) => {
        setCustomCategory(value);
    };

    const handleToggleCategoryEnabled = async (category: string, event: React.MouseEvent) => {
        event.stopPropagation();
        if (onToggleCategory) {
            const isCurrentlyEnabled = isCategoryEnabled(category);
            if(isCurrentlyEnabled){
                setLocalDisabledCategories(prev => [...prev, category]);
            }else{
                setLocalDisabledCategories(prev => prev.filter(cat => cat !== category));
            }
            await onToggleCategory(category, !isCurrentlyEnabled);
            if (isCurrentlyEnabled && selectedCategory === category) {
                setSelectedCategory('');
            }
        }
    };

    const handleDeleteCustomCategory = async (category: string, event: React.MouseEvent) => {
        event.stopPropagation();
        try {
            const userCategory = userCustomCategories.find(cat => cat.category === category);
            if (userCategory) {
                await userCategoryService.deleteCustomUserCategory(userId, userCategory.id);
                setUserCustomCategories(prev => prev.filter(cat => cat.id !== userCategory.id));
            } else {
                setLocalCustomCategories(prev => prev.filter(cat => cat !== category));
            }
            if (selectedCategory === category) {
                setSelectedCategory('');
            }
            if (onDeleteCustomCategory) {
                await onDeleteCustomCategory(category);
            }
        } catch (error) {
            console.error('Error deleting custom category:', error);
        }
    };

    const isSystemCategory = (category: string) => {
        return systemCategories.includes(category);
    };

    const isCustomCategoryLocal = (category: string) => {
        const isUserCategory = userCustomCategories.some(cat => cat.category === category);
        const isLocalCategory = localCustomCategories.includes(category);
        const isLegacyCustom = customCategories.includes(category) && !systemCategories.includes(category);
        return isUserCategory || isLocalCategory || isLegacyCustom;
    };

    const disabledSystemCategories = React.useMemo(() => {
        return localDisabledCategories.filter(cat => isSystemCategory(cat));
    }, [localDisabledCategories]);

    const isCategoryEnabled = (category: string) => {
        return !localDisabledCategories.includes(category);
    };

    const handleAddCustomCategory = async () => {
        if (!customCategory.trim()) return;

        const newCategory = customCategory.trim();
        if (allCategories.includes(newCategory)) {
            console.warn('Category already exists');
            return;
        }

        try {
            const savedCategory = await userCategoryService.addCustomUserCategory(userId, newCategory);
            setUserCustomCategories(prev => [...prev, savedCategory]);
            setSelectedCategory(newCategory);
            setCustomCategory('');
            setSelectedCategoriesToReplace([]);
            if (onAddCustomCategory) {
                await onAddCustomCategory(newCategory);
            }
        } catch (error) {
            console.error('Error adding custom category:', error);
            setLocalCustomCategories(prev => {
                if (prev.includes(newCategory)) return prev;
                return [...prev, newCategory];
            });
            setSelectedCategory(newCategory);
            setCustomCategory('');
        }
    };

    const handleMerchantCheckboxChange = (checked: boolean) => {
        setMatchByMerchant(checked);
        if (checked) {
            setMerchantMatchType('current');
            setMerchantNameMatch(merchantName);
        }
    };

    const handleDescriptionCheckboxChange = (checked: boolean) => {
        setMatchByDescription(checked);
        if (checked) {
            setDescriptionMatchType('current');
            setDescriptionMatch(description);
        }
    };

    const handleResetDisabledCategories = async () => {
        setLocalDisabledCategories([]);
        if (onResetDisabledCategories) {
            await onResetDisabledCategories();
        }
    };

    const handleExtendedDescriptionCheckboxChange = (checked: boolean) => {
        setMatchByExtendedDescription(checked);
        if (checked) {
            setExtendedDescriptionMatchType('current');
            setExtendedDescriptionMatch(extendedDescription);
        }
    };

    const handleAmountRangeCheckboxChange = (checked: boolean) => {
        setMatchByAmountRange(checked);
        if (checked) {
            setAmountMatchType('current');
            setAmountRangeMin(amount * 0.9);
            setAmountRangeMax(amount * 1.1);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const categoryToSave = selectedCategory;
            const isCustom = !systemCategories.includes(selectedCategory);
            const saveData: CategorySaveData = {
                transactionId,
                category: categoryToSave,
                isCustomCategory: isCustom,
                overrideSystemCategory,
                ...(overrideSystemCategory && selectedCategoriesToReplace.length > 0 && {
                    replacedCategories: selectedCategoriesToReplace
                }),
            };

            if (showAdvanced && (matchByMerchant || matchByDescription ||
                matchByExtendedDescription || matchByAmountRange)) {
                saveData.advancedMatching = {
                    matchByMerchant,
                    ...(matchByMerchant && merchantNameMatch && { merchantNameMatch }),
                    matchByDescription,
                    ...(matchByDescription && descriptionMatch && { descriptionMatch }),
                    matchByExtendedDescription,
                    ...(matchByExtendedDescription && extendedDescriptionMatch && { extendedDescriptionMatch }),
                    matchByAmountRange,
                    ...(matchByAmountRange && {
                        amountRangeMin,
                        amountRangeMax,
                    }),
                };
            }

            await onSave(saveData);
            onClose();
        } catch (error) {
            console.error('Error saving category:', error);
        } finally {
            setSaving(false);
        }
    };

    const isSaveDisabled = !selectedCategory && !customCategory;

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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CategoryIcon />
                    <Typography variant="h6" fontWeight={600}>
                        Categorize Transaction
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                            icon={<SettingsIcon sx={{ fontSize: 14 }} />}
                            label="System"
                            size="small"
                            sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                '& .MuiChip-icon': { color: 'white' }
                            }}
                        />
                        <Chip
                            icon={<LabelIcon sx={{ fontSize: 14 }} />}
                            label="Custom"
                            size="small"
                            sx={{
                                bgcolor: alpha(tealColor, 0.9),
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                '& .MuiChip-icon': { color: 'white' }
                            }}
                        />
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>

            <DialogContent sx={{ p: 0 }}>
                {loadingCategories ? (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 8,
                        gap: 2
                    }}>
                        <CircularProgress size={48} thickness={4} sx={{ color: maroonColor }} />
                        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Loading categories...
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        {/* Category Selection Section */}
                        <Box sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                    Select Category
                                </Typography>
                                {localDisabledCategories.length > 0 && (
                                    <Tooltip title="Re-enable all disabled categories" arrow>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={handleResetDisabledCategories}
                                            sx={{
                                                textTransform: 'none',
                                                fontSize: '0.813rem',
                                                fontWeight: 600,
                                                borderRadius: 2,
                                                px: 2,
                                                py: 0.75,
                                                borderColor: maroonColor,
                                                color: maroonColor,
                                                '&:hover': {
                                                    bgcolor: alpha(maroonColor, 0.05),
                                                    borderColor: maroonColor,
                                                }
                                            }}
                                        >
                                            Reset All ({localDisabledCategories.length})
                                        </Button>
                                    </Tooltip>
                                )}
                            </Box>

                            {/* Search Bar */}
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                    }
                                }}
                            />

                            {/* Category List */}
                            <Box sx={{
                                maxHeight: 320,
                                overflow: 'auto',
                                '&::-webkit-scrollbar': {
                                    width: '8px',
                                },
                                '&::-webkit-scrollbar-track': {
                                    bgcolor: 'grey.100',
                                    borderRadius: 2,
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    bgcolor: 'grey.400',
                                    borderRadius: 2,
                                    '&:hover': {
                                        bgcolor: 'grey.500',
                                    }
                                }
                            }}>
                                <List disablePadding>
                                    {filteredCategories.length === 0 ? (
                                        <Box sx={{
                                            p: 4,
                                            textAlign: 'center',
                                            color: 'text.secondary',
                                            bgcolor: alpha('#ccc', 0.05),
                                            borderRadius: 2
                                        }}>
                                            <CategoryIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
                                            <Typography variant="body2">
                                                No categories found
                                            </Typography>
                                        </Box>
                                    ) : (
                                        filteredCategories.map((category, index) => {
                                            const isSystem = isSystemCategory(category);
                                            const isEnabled = isCategoryEnabled(category);
                                            const isSelected = selectedCategory === category;

                                            return (
                                                <ListItem
                                                    key={category}
                                                    sx={{
                                                        border: `1px solid ${alpha(isSelected ? maroonColor : (isSystem ? '#ccc' : tealColor), 0.3)}`,
                                                        borderRadius: 2,
                                                        mb: 1,
                                                        bgcolor: alpha(isSelected ? maroonColor : (isSystem ? '#ccc' : tealColor), 0.05),
                                                        opacity: isEnabled ? 1 : 0.5,
                                                        p: 0
                                                    }}
                                                >
                                                    <ListItemButton
                                                        selected={isSelected}
                                                        onClick={() => handleCategorySelect(category)}
                                                        disabled={!isEnabled}
                                                        sx={{
                                                            py: 1.5,
                                                            transition: 'all 0.2s',
                                                            '&.Mui-selected': {
                                                                backgroundColor: alpha(maroonColor, 0.1),
                                                                '&:hover': {
                                                                    backgroundColor: alpha(maroonColor, 0.15),
                                                                }
                                                            },
                                                            '&:hover': {
                                                                backgroundColor: alpha(isSystem ? '#ccc' : tealColor, 0.1),
                                                            },
                                                            '&.Mui-disabled': {
                                                                opacity: 0.5,
                                                            }
                                                        }}
                                                    >
                                                        <ListItemText
                                                            primary={
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Typography
                                                                        variant="body1"
                                                                        fontWeight={isSelected ? 600 : 500}
                                                                        sx={{
                                                                            textDecoration: isEnabled ? 'none' : 'line-through',
                                                                            color: isSelected ? maroonColor : 'text.primary'
                                                                        }}
                                                                    >
                                                                        {category}
                                                                    </Typography>
                                                                    <Chip
                                                                        label={isSystem ? 'System' : 'Custom'}
                                                                        size="small"
                                                                        sx={{
                                                                            fontSize: '0.65rem',
                                                                            height: 20,
                                                                            fontWeight: 600,
                                                                            bgcolor: alpha(isSystem ? maroonColor : tealColor, 0.15),
                                                                            color: isSystem ? maroonColor : tealColor,
                                                                        }}
                                                                    />
                                                                </Box>
                                                            }
                                                        />
                                                    </ListItemButton>
                                                    <ListItemSecondaryAction>
                                                        {!isSystem && (
                                                            <Tooltip title="Delete custom category" arrow>
                                                                <IconButton
                                                                    edge="end"
                                                                    size="small"
                                                                    onClick={(e) => handleDeleteCustomCategory(category, e)}
                                                                    sx={{
                                                                        color: '#dc2626',
                                                                        mr: 1,
                                                                        '&:hover': {
                                                                            bgcolor: alpha('#dc2626', 0.1)
                                                                        }
                                                                    }}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                            );
                                        })
                                    )}
                                </List>
                            </Box>
                        </Box>

                        <Divider />

                        {/* Custom Category Section */}
                        <Box sx={{ p: 3 }}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                                Add Custom Category
                            </Typography>

                            <Card sx={{
                                p: 2,
                                bgcolor: alpha(tealColor, 0.05),
                                border: `1px solid ${alpha(tealColor, 0.2)}`,
                                borderRadius: 2
                            }}>
                                <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Custom Category Name"
                                        value={customCategory}
                                        onChange={(e) => handleCustomCategoryChange(e.target.value)}
                                        placeholder="e.g., Home Improvement, Pet Care"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && customCategory.trim()) {
                                                handleAddCustomCategory();
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={handleAddCustomCategory}
                                        disabled={!customCategory.trim()}
                                        startIcon={<AddIcon />}
                                        sx={{
                                            minWidth: 120,
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            bgcolor: tealColor,
                                            '&:hover': {
                                                bgcolor: '#0f766e'
                                            }
                                        }}
                                    >
                                        Add
                                    </Button>
                                </Box>

                                {/* Override System Categories */}
                                <Box>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={overrideSystemCategory}
                                                onChange={(e) => {
                                                    setOverrideSystemCategory(e.target.checked);
                                                    if (!e.target.checked) {
                                                        setSelectedCategoriesToReplace([]);
                                                    }
                                                }}
                                                disabled={disabledSystemCategories.length === 0}
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" fontWeight={500}>
                                                    Override system categories with custom category
                                                </Typography>
                                                <Tooltip
                                                    title="Replace disabled system categories with your custom category for better organization"
                                                    arrow
                                                >
                                                    <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                </Tooltip>
                                            </Box>
                                        }
                                    />

                                    <Collapse in={overrideSystemCategory && disabledSystemCategories.length > 0}>
                                        <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                                                Select System Categories to Replace
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                                                Choose which disabled system categories should be replaced by <strong>"{customCategory || 'your custom category'}"</strong>
                                            </Typography>

                                            <Box sx={{
                                                maxHeight: 200,
                                                overflow: 'auto',
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderRadius: 1.5,
                                                bgcolor: 'grey.50'
                                            }}>
                                                {disabledSystemCategories.map((category, index) => (
                                                    <React.Fragment key={category}>
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                px: 2,
                                                                py: 1.5,
                                                                '&:hover': {
                                                                    bgcolor: 'action.hover'
                                                                }
                                                            }}
                                                        >
                                                            <FormControlLabel
                                                                control={
                                                                    <Checkbox
                                                                        checked={selectedCategoriesToReplace.includes(category)}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                setSelectedCategoriesToReplace(prev => [...prev, category]);
                                                                            } else {
                                                                                setSelectedCategoriesToReplace(prev => prev.filter(cat => cat !== category));
                                                                            }
                                                                        }}
                                                                    />
                                                                }
                                                                label={
                                                                    <Box>
                                                                        <Typography variant="body2" fontWeight={600}>
                                                                            {category}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            System category (disabled)
                                                                        </Typography>
                                                                    </Box>
                                                                }
                                                                sx={{ flex: 1, m: 0 }}
                                                            />
                                                        </Box>
                                                        {index < disabledSystemCategories.length - 1 && <Divider />}
                                                    </React.Fragment>
                                                ))}
                                            </Box>

                                            {selectedCategoriesToReplace.length > 0 && (
                                                <Box sx={{ mt: 2 }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
                                                        Selected to replace ({selectedCategoriesToReplace.length}):
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                        {selectedCategoriesToReplace.map((cat) => (
                                                            <Chip
                                                                key={cat}
                                                                label={cat}
                                                                size="small"
                                                                onDelete={() => {
                                                                    setSelectedCategoriesToReplace(prev => prev.filter(c => c !== cat));
                                                                }}
                                                                sx={{
                                                                    bgcolor: alpha(maroonColor, 0.1),
                                                                    color: maroonColor,
                                                                    fontWeight: 500,
                                                                    '& .MuiChip-deleteIcon': {
                                                                        color: maroonColor,
                                                                        '&:hover': {
                                                                            color: '#a00000'
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    </Collapse>
                                </Box>
                            </Card>
                        </Box>

                        <Divider />

                        {/* Advanced Options */}
                        <Box sx={{ p: 3 }}>
                            <Button
                                variant="outlined"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                fullWidth
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    py: 1.5,
                                    borderRadius: 2,
                                    borderColor: maroonColor,
                                    color: maroonColor,
                                    '&:hover': {
                                        borderColor: maroonColor,
                                        bgcolor: alpha(maroonColor, 0.05)
                                    }
                                }}
                            >
                                {showAdvanced ? 'Hide Advanced Matching' : 'Show Advanced Matching'}
                            </Button>

                            <Collapse in={showAdvanced}>
                                <Card sx={{
                                    mt: 2,
                                    p: 3,
                                    bgcolor: alpha(maroonColor, 0.02),
                                    border: `1px solid ${alpha(maroonColor, 0.1)}`,
                                    borderRadius: 2
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <Typography variant="subtitle1" fontWeight={600}>
                                            Auto-Categorize Future Transactions
                                        </Typography>
                                        <Tooltip
                                            title="Automatically apply this category to future transactions matching your criteria"
                                            arrow
                                        >
                                            <InfoIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                        </Tooltip>
                                    </Box>
                                    <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                                        Apply this category automatically to future transactions that match the following criteria
                                    </Alert>

                                    <Stack spacing={3}>
                                        {/* Merchant Match */}
                                        <Card sx={{ p: 2.5, bgcolor: alpha(tealColor, 0.05), border: `1px solid ${alpha(tealColor, 0.2)}`, borderRadius: 2 }}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={matchByMerchant}
                                                        onChange={(e) => handleMerchantCheckboxChange(e.target.checked)}
                                                    />
                                                }
                                                label={
                                                    <Typography variant="body1" fontWeight={600}>
                                                        Match by Merchant Name
                                                    </Typography>
                                                }
                                            />

                                            <Collapse in={matchByMerchant}>
                                                <Box sx={{ ml: 4, mt: 2 }}>
                                                    <RadioGroup
                                                        value={merchantMatchType}
                                                        onChange={(e) => setMerchantMatchType(e.target.value as 'current' | 'manual')}
                                                    >
                                                        <FormControlLabel
                                                            value="current"
                                                            control={<Radio size="small" />}
                                                            label={
                                                                <Box>
                                                                    <Typography variant="body2" fontWeight={500}>
                                                                        Use current merchant
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                                        {merchantName || 'N/A'}
                                                                    </Typography>
                                                                </Box>
                                                            }
                                                        />
                                                        <FormControlLabel
                                                            value="manual"
                                                            control={<Radio size="small" />}
                                                            label={
                                                                <Typography variant="body2" fontWeight={500}>
                                                                    Enter manually
                                                                </Typography>
                                                            }
                                                        />
                                                    </RadioGroup>

                                                    <Collapse in={merchantMatchType === 'manual'}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            label="Merchant Name"
                                                            value={merchantNameMatch}
                                                            onChange={(e) => setMerchantNameMatch(e.target.value)}
                                                            placeholder="Enter merchant name to match"
                                                            sx={{ mt: 1.5 }}
                                                        />
                                                    </Collapse>
                                                </Box>
                                            </Collapse>
                                        </Card>

                                        {/* Description Match */}
                                        <Card sx={{ p: 2.5, bgcolor: alpha(tealColor, 0.05), border: `1px solid ${alpha(tealColor, 0.2)}`, borderRadius: 2 }}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={matchByDescription}
                                                        onChange={(e) => handleDescriptionCheckboxChange(e.target.checked)}
                                                    />
                                                }
                                                label={
                                                    <Typography variant="body1" fontWeight={600}>
                                                        Match by Description
                                                    </Typography>
                                                }
                                            />

                                            <Collapse in={matchByDescription}>
                                                <Box sx={{ ml: 4, mt: 2 }}>
                                                    <RadioGroup
                                                        value={descriptionMatchType}
                                                        onChange={(e) => setDescriptionMatchType(e.target.value as 'current' | 'manual')}
                                                    >
                                                        <FormControlLabel
                                                            value="current"
                                                            control={<Radio size="small" />}
                                                            label={
                                                                <Box>
                                                                    <Typography variant="body2" fontWeight={500}>
                                                                        Use current description
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                                        {description || 'N/A'}
                                                                    </Typography>
                                                                </Box>
                                                            }
                                                        />
                                                        <FormControlLabel
                                                            value="manual"
                                                            control={<Radio size="small" />}
                                                            label={
                                                                <Typography variant="body2" fontWeight={500}>
                                                                    Enter manually
                                                                </Typography>
                                                            }
                                                        />
                                                    </RadioGroup>

                                                    <Collapse in={descriptionMatchType === 'manual'}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            label="Description"
                                                            value={descriptionMatch}
                                                            onChange={(e) => setDescriptionMatch(e.target.value)}
                                                            placeholder="Enter description to match"
                                                            sx={{ mt: 1.5 }}
                                                        />
                                                    </Collapse>
                                                </Box>
                                            </Collapse>
                                        </Card>

                                        {/* Extended Description Match */}
                                        <Card sx={{ p: 2.5, bgcolor: alpha(tealColor, 0.05), border: `1px solid ${alpha(tealColor, 0.2)}`, borderRadius: 2 }}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={matchByExtendedDescription}
                                                        onChange={(e) => handleExtendedDescriptionCheckboxChange(e.target.checked)}
                                                    />
                                                }
                                                label={
                                                    <Typography variant="body1" fontWeight={600}>
                                                        Match by Extended Description
                                                    </Typography>
                                                }
                                            />

                                            <Collapse in={matchByExtendedDescription}>
                                                <Box sx={{ ml: 4, mt: 2 }}>
                                                    <RadioGroup
                                                        value={extendedDescriptionMatchType}
                                                        onChange={(e) => setExtendedDescriptionMatchType(e.target.value as 'current' | 'manual')}
                                                    >
                                                        <FormControlLabel
                                                            value="current"
                                                            control={<Radio size="small" />}
                                                            label={
                                                                <Box>
                                                                    <Typography variant="body2" fontWeight={500}>
                                                                        Use current extended description
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                                        {extendedDescription || 'N/A'}
                                                                    </Typography>
                                                                </Box>
                                                            }
                                                        />
                                                        <FormControlLabel
                                                            value="manual"
                                                            control={<Radio size="small" />}
                                                            label={
                                                                <Typography variant="body2" fontWeight={500}>
                                                                    Enter manually
                                                                </Typography>
                                                            }
                                                        />
                                                    </RadioGroup>

                                                    <Collapse in={extendedDescriptionMatchType === 'manual'}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            label="Extended Description"
                                                            value={extendedDescriptionMatch}
                                                            onChange={(e) => setExtendedDescriptionMatch(e.target.value)}
                                                            placeholder="Enter extended description to match"
                                                            sx={{ mt: 1.5 }}
                                                        />
                                                    </Collapse>
                                                </Box>
                                            </Collapse>
                                        </Card>

                                        {/* Amount Range Match */}
                                        <Card sx={{ p: 2.5, bgcolor: alpha(tealColor, 0.05), border: `1px solid ${alpha(tealColor, 0.2)}`, borderRadius: 2 }}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={matchByAmountRange}
                                                        onChange={(e) => handleAmountRangeCheckboxChange(e.target.checked)}
                                                    />
                                                }
                                                label={
                                                    <Typography variant="body1" fontWeight={600}>
                                                        Match by Amount Range
                                                    </Typography>
                                                }
                                            />

                                            <Collapse in={matchByAmountRange}>
                                                <Box sx={{ ml: 4, mt: 2 }}>
                                                    <RadioGroup
                                                        value={amountMatchType}
                                                        onChange={(e) => setAmountMatchType(e.target.value as 'current' | 'manual')}
                                                    >
                                                        <FormControlLabel
                                                            value="current"
                                                            control={<Radio size="small" />}
                                                            label={
                                                                <Box>
                                                                    <Typography variant="body2" fontWeight={500}>
                                                                        Use current amount range
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                                        ${(amount * 0.9).toFixed(2)} - ${(amount * 1.1).toFixed(2)} (±10%)
                                                                    </Typography>
                                                                </Box>
                                                            }
                                                        />
                                                        <FormControlLabel
                                                            value="manual"
                                                            control={<Radio size="small" />}
                                                            label={
                                                                <Typography variant="body2" fontWeight={500}>
                                                                    Enter manually
                                                                </Typography>
                                                            }
                                                        />
                                                    </RadioGroup>

                                                    <Collapse in={amountMatchType === 'manual'}>
                                                        <Box sx={{ display: 'flex', gap: 2, mt: 1.5 }}>
                                                            <TextField
                                                                type="number"
                                                                label="Min Amount"
                                                                value={amountRangeMin}
                                                                onChange={(e) => setAmountRangeMin(Number(e.target.value))}
                                                                size="small"
                                                                fullWidth
                                                                inputProps={{ step: 0.01 }}
                                                                InputProps={{
                                                                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                                                                }}
                                                            />
                                                            <TextField
                                                                type="number"
                                                                label="Max Amount"
                                                                value={amountRangeMax}
                                                                onChange={(e) => setAmountRangeMax(Number(e.target.value))}
                                                                size="small"
                                                                fullWidth
                                                                inputProps={{ step: 0.01 }}
                                                                InputProps={{
                                                                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                                                                }}
                                                            />
                                                        </Box>
                                                    </Collapse>
                                                </Box>
                                            </Collapse>
                                        </Card>
                                    </Stack>
                                </Card>
                            </Collapse>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            {/* Footer */}
            <DialogActions sx={{ p: 3, pt: 2 }}>
                <Button
                    onClick={onClose}
                    disabled={saving}
                    variant="outlined"
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={isSaveDisabled || saving}
                    startIcon={saving ? <SaveIcon /> : <SaveIcon />}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        minWidth: 120,
                        px: 4,
                        bgcolor: maroonColor,
                        '&:hover': {
                            bgcolor: '#a00000'
                        }
                    }}
                >
                    {saving ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={16} color="inherit" />
                            Saving...
                        </Box>
                    ) : (
                        'Save Category'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CategoryDialog;