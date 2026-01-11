import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
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
    FormControl,
    FormLabel,
    Checkbox,
    Stack,
    IconButton, Chip,
    Tooltip as MuiTooltip, Paper
} from '@mui/material';
import {Eye, EyeOff, Plus, Settings, Trash2} from "lucide-react";
import CategoryService from "../services/CategoryService";


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
    onDeleteCustomCategory?: (category: string) => void | Promise<void>; // Add this line
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
        matchByAmountRange: boolean
        amountRangeMin?: number;
        amountRangeMax?: number;
    };
}

const DEFAULT_SYSTEM_CATEGORIES = [
    'Groceries',
    'Order Out',
    'Subscription',
    'Rent',
    'Mortgage',
    'Gas',
    'Utilities',
    'Gas (Utilities)',
    'Haircut',
    'Other',
    'Coffee',
    'Trip',
    'Electric',
    'Insurance',
    'Payment',
    'Withdrawal',
    'Transfer',
    'Pet',
    'Income',
    'Deposit',
    'Refund'
];



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
    const [useCustomCategory, setUseCustomCategory] = useState(false);
    const [localDisabledCategories, setLocalDisabledCategories] = useState<string[]>(disabledCategories);
    const [localCustomCategories, setLocalCustomCategories] = useState<string[]>(customCategories);
    const [overrideSystemCategory, setOverrideSystemCategory] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [selectedCategoriesToReplace, setSelectedCategoriesToReplace] = useState<string[]>([]); // Add this

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

    const [saving, setSaving] = useState(false);


    const handleCategorySelect = (category: string) => {
        if(isCategoryEnabled(category)){
            setSelectedCategory(category);
        }
    };

    React.useEffect(() => {
        if (open) {
            setLocalDisabledCategories(disabledCategories);
            setLocalCustomCategories([]);
        }
    }, [open]);

    const allCategories = React.useMemo(() => {
        const categorySet = new Set([...DEFAULT_SYSTEM_CATEGORIES]);

        if (availableCategories) {
            availableCategories.forEach(cat => categorySet.add(cat));
        }

        if (customCategories) {
            customCategories.forEach(cat => categorySet.add(cat));
        }

        // Add locally added custom categories
        localCustomCategories.forEach(cat => categorySet.add(cat));

        return Array.from(categorySet).sort();
    }, [availableCategories, customCategories, localCustomCategories]);

    const handleCustomCategoryChange = (value: string) => {
        setCustomCategory(value);
        if (value) {
            setUseCustomCategory(true);
        }
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
            console.log('Category before toggle:', category, 'isEnabled:', isCurrentlyEnabled);
            console.log('Currently Enabled: ', isCurrentlyEnabled);
            console.log('Will be enabled: ', !isCurrentlyEnabled);
            console.log('Current disabled list: ', disabledCategories);
            await onToggleCategory(category, !isCurrentlyEnabled);

            // If we're disabling the currently selected category, clear the selection
            if (isCurrentlyEnabled && selectedCategory === category) {
                setSelectedCategory('');
            }
        }
    };

    // Add the delete handler
    const handleDeleteCustomCategory = async (category: string, event: React.MouseEvent) => {
        event.stopPropagation();

        // Remove from local state
        setLocalCustomCategories(prev => prev.filter(cat => cat !== category));

        // If this is the selected category, clear the selection
        if (selectedCategory === category) {
            setSelectedCategory('');
        }

        // Call parent handler
        if (onDeleteCustomCategory) {
            await onDeleteCustomCategory(category);
        }
    };

    const isSystemCategory = (category: string) => {
        return DEFAULT_SYSTEM_CATEGORIES.includes(category);
    };

    const isCustomCategoryLocal = (category: string) => {
        return localCustomCategories.includes(category) ||
            (customCategories.includes(category) && !DEFAULT_SYSTEM_CATEGORIES.includes(category));
    };


    const disabledSystemCategories = React.useMemo(() => {
        return localDisabledCategories.filter(cat => isSystemCategory(cat));
    }, [localDisabledCategories]);


    const isCategoryEnabled = (category: string) => {
        return !localDisabledCategories.includes(category);
    };

    const handleAddCustomCategory = async () => {
        if (customCategory.trim() && onAddCustomCategory) {

            const newCategory = customCategory.trim();
            setLocalCustomCategories(prev => {
                if (prev.includes(newCategory)) {
                    return prev; // Already exists
                }
                return [...prev, newCategory];
            });
            if(onAddCustomCategory){
                await onAddCustomCategory(newCategory);
            }
            setSelectedCategory(newCategory);
            // setUseCustomCategory(true);
            setCustomCategory('');
            setSelectedCategoriesToReplace([]);
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

            // Check if it's a custom category by seeing if it's NOT in DEFAULT_CATEGORIES
            const isCustom = !DEFAULT_SYSTEM_CATEGORIES.includes(selectedCategory);

            const saveData: CategorySaveData = {
                transactionId,
                category: categoryToSave,
                isCustomCategory: isCustom,
                overrideSystemCategory,
                ...(overrideSystemCategory && selectedCategoriesToReplace.length > 0 && {
                    replacedCategories: selectedCategoriesToReplace
                }),
            };

            // Include advanced matching if any option is selected
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
            console.log('Save Data: ', saveData);

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
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
                        Categorize Transaction
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                            icon={<Settings size={14} />}
                            label="System"
                            size="small"
                            sx={{
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText',
                                fontSize: '0.75rem',
                                fontWeight: 500
                            }}
                        />
                        <Chip
                            icon={<Settings size={14} />}
                            label="Custom"
                            size="small"
                            sx={{
                                bgcolor: 'secondary.light',
                                color: 'secondary.contrastText',
                                fontSize: '0.75rem',
                                fontWeight: 500
                            }}
                        />
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {/* Category List */}
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 1.5 }}>
                    Select Category
                </Typography>
                {localDisabledCategories.length > 0 && (
                    <MuiTooltip title="Re-enable all disabled categories">
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={handleResetDisabledCategories}
                            sx={{
                                textTransform: 'none',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                borderRadius: 2,
                                px: 1.5,
                                py: 0.5,
                                borderColor: 'primary.main',
                                color: 'primary.main',
                                '&:hover': {
                                    bgcolor: 'primary.light',
                                    borderColor: 'primary.dark',
                                }
                            }}
                        >
                            Reset All ({localDisabledCategories.length})
                        </Button>
                    </MuiTooltip>
                )}
                <List sx={{
                    maxHeight: 300,
                    overflow: 'auto',
                    mb: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2
                }}>
                    {allCategories.map((category) => {
                        const isSystem = isSystemCategory(category);
                        const isEnabled = isCategoryEnabled(category);
                        const isCustom = isCustomCategoryLocal(category) || (!isSystem && customCategories.includes(category));


                        return (
                            <ListItem
                                key={category}
                                disablePadding
                                secondaryAction={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip
                                            label={isSystem ? 'System' : 'Custom'}
                                            size="small"
                                            sx={{
                                                fontSize: '0.7rem',
                                                height: 20,
                                                bgcolor: isSystem ? 'primary.light' : 'secondary.light',
                                                color: isSystem ? 'primary.contrastText' : 'secondary.contrastText',
                                            }}
                                        />
                                        {!isSystem && (
                                            <MuiTooltip title="Delete custom category">
                                                <IconButton
                                                    edge="end"
                                                    size="small"
                                                    onClick={(e) => handleDeleteCustomCategory(category, e)}
                                                    sx={{
                                                        color: 'error.main',
                                                        '&:hover': {
                                                            bgcolor: 'error.light',
                                                        }
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </IconButton>
                                            </MuiTooltip>
                                        )}
                                        <MuiTooltip title={isEnabled ? 'Disable category' : 'Enable category'}>
                                            <IconButton
                                                edge="end"
                                                size="small"
                                                onClick={(e) => handleToggleCategoryEnabled(category, e)}
                                                sx={{
                                                    color: isEnabled ? 'success.main' : 'text.disabled',
                                                }}
                                            >
                                                {isEnabled ? <Eye size={18} /> : <EyeOff size={18} />}
                                            </IconButton>
                                        </MuiTooltip>
                                    </Box>
                                }
                            >
                                <ListItemButton
                                    selected={selectedCategory === category}
                                    onClick={() => handleCategorySelect(category)}
                                    disabled={!isEnabled}
                                    sx={{
                                        opacity: isEnabled ? 1 : 0.5,
                                        '&.Mui-selected': {
                                            backgroundColor: 'primary.light',
                                            color: 'primary.contrastText',
                                            '&:hover': {
                                                backgroundColor: 'primary.main',
                                            }
                                        },
                                        '&.Mui-disabled': {
                                            opacity: 0.5,
                                        }
                                    }}
                                >
                                    <ListItemText
                                        primary={category}
                                        primaryTypographyProps={{
                                            sx: {
                                                textDecoration: isEnabled ? 'none' : 'line-through',
                                                fontWeight: 500
                                            }
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>

                <Divider sx={{ my: 3 }} />

                {/* Custom Category */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 1.5 }}>
                        Add Custom Category
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                        <TextField
                            fullWidth
                            size="medium"
                            label="Custom Category Name"
                            value={customCategory}
                            onChange={(e) => handleCustomCategoryChange(e.target.value)}
                            placeholder="Enter custom category name"
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
                            startIcon={<Plus size={18} />}
                            sx={{
                                minWidth: 120,
                                textTransform: 'none',
                                fontWeight: 600
                            }}
                        >
                            Add
                        </Button>
                    </Box>

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
                            <Typography variant="body2" color="text.secondary">
                                Override system categories with custom category
                                {disabledSystemCategories.length === 0 && ' (no disabled system categories)'}
                            </Typography>
                        }
                    />

                    {/* Show category selection when override is enabled */}
                    {overrideSystemCategory && disabledSystemCategories.length > 0 && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1.5 }}>
                                Select System Categories to Replace
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Choose which disabled system categories should be replaced by "{customCategory || 'your custom category'}"
                            </Typography>

                            <Box sx={{
                                maxHeight: 200,
                                overflow: 'auto',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                bgcolor: 'background.paper'
                            }}>
                                {disabledSystemCategories.map((category) => (
                                    <Box
                                        key={category}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            px: 2,
                                            py: 1,
                                            borderBottom: '1px solid',
                                            borderColor: 'divider',
                                            '&:last-child': {
                                                borderBottom: 'none'
                                            },
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
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
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
                                ))}
                            </Box>

                            {selectedCategoriesToReplace.length > 0 && (
                                <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ width: '100%' }}>
                                        Selected to replace:
                                    </Typography>
                                    {selectedCategoriesToReplace.map((cat) => (
                                        <Chip
                                            key={cat}
                                            label={cat}
                                            size="small"
                                            onDelete={() => {
                                                setSelectedCategoriesToReplace(prev => prev.filter(c => c !== cat));
                                            }}
                                            sx={{
                                                bgcolor: 'primary.light',
                                                color: 'primary.contrastText',
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>

                {/*<Box sx={{ mb: 3 }}>*/}
                {/*    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 1.5 }}>*/}
                {/*        Add Custom Category*/}
                {/*    </Typography>*/}
                {/*    <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>*/}
                {/*        <TextField*/}
                {/*            fullWidth*/}
                {/*            size="medium"*/}
                {/*            label="Custom Category Name"*/}
                {/*            value={customCategory}*/}
                {/*            onChange={(e) => handleCustomCategoryChange(e.target.value)}*/}
                {/*            placeholder="Enter custom category name"*/}
                {/*            onKeyPress={(e) => {*/}
                {/*                if (e.key === 'Enter' && customCategory.trim()) {*/}
                {/*                    handleAddCustomCategory();*/}
                {/*                }*/}
                {/*            }}*/}
                {/*        />*/}
                {/*        <Button*/}
                {/*            variant="contained"*/}
                {/*            onClick={handleAddCustomCategory}*/}
                {/*            disabled={!customCategory.trim()}*/}
                {/*            startIcon={<Plus size={18} />}*/}
                {/*            sx={{*/}
                {/*                minWidth: 120,*/}
                {/*                textTransform: 'none',*/}
                {/*                fontWeight: 600*/}
                {/*            }}*/}
                {/*        >*/}
                {/*            Add*/}
                {/*        </Button>*/}
                {/*    </Box>*/}
                {/*    <FormControlLabel*/}
                {/*        control={*/}
                {/*            <Checkbox*/}
                {/*                checked={overrideSystemCategory}*/}
                {/*                onChange={(e) => {*/}
                {/*                    setOverrideSystemCategory(e.target.checked);*/}
                {/*                    if (!e.target.checked) {*/}
                {/*                        setSelectedCategoriesToReplace([]);*/}
                {/*                    }*/}
                {/*                }}*/}
                {/*                disabled={disabledSystemCategories.length === 0}*/}
                {/*            />*/}
                {/*        }*/}
                {/*        label={*/}
                {/*            <Typography variant="body2" color="text.secondary">*/}
                {/*                Override system categories with custom category*/}
                {/*                {disabledSystemCategories.length === 0 && ' (no disabled system categories)'}*/}
                {/*            </Typography>*/}
                {/*        }*/}
                {/*    />*/}
                {/*    */}
                {/*</Box>*/}

                <Divider sx={{ my: 3 }} />

                {/* Advanced Options */}
                <Box>
                    <Button
                        variant="outlined"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        fullWidth
                        sx={{
                            mb: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            py: 1.2
                        }}
                    >
                        {showAdvanced ? 'Hide Advanced Matching' : 'Show Advanced Matching'}
                    </Button>

                    <Collapse in={showAdvanced}>
                        <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                                Auto-Categorize Future Transactions
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Apply this category automatically to future transactions that match the following criteria:
                            </Typography>

                            <Stack spacing={3}>
                                {/* Merchant Match */}
                                <Box>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={matchByMerchant}
                                                onChange={(e) => handleMerchantCheckboxChange(e.target.checked)}
                                            />
                                        }
                                        label={
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                Match by Merchant Name
                                            </Typography>
                                        }
                                    />

                                    {matchByMerchant && (
                                        <Box sx={{ ml: 4, mt: 1.5 }}>
                                            <RadioGroup
                                                value={merchantMatchType}
                                                onChange={(e) => setMerchantMatchType(e.target.value as 'current' | 'manual')}
                                            >
                                                <FormControlLabel
                                                    value="current"
                                                    control={<Radio size="small" />}
                                                    label={
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                Use current merchant
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {merchantName || 'N/A'}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                                <FormControlLabel
                                                    value="manual"
                                                    control={<Radio size="small" />}
                                                    label={
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            Enter manually
                                                        </Typography>
                                                    }
                                                />
                                            </RadioGroup>

                                            {merchantMatchType === 'manual' && (
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    label="Merchant Name"
                                                    value={merchantNameMatch}
                                                    onChange={(e) => setMerchantNameMatch(e.target.value)}
                                                    placeholder="Enter merchant name to match"
                                                    sx={{ mt: 1.5 }}
                                                />
                                            )}
                                        </Box>
                                    )}
                                </Box>

                                <Divider />

                                {/* Description Match */}
                                <Box>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={matchByDescription}
                                                onChange={(e) => handleDescriptionCheckboxChange(e.target.checked)}
                                            />
                                        }
                                        label={
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                Match by Description
                                            </Typography>
                                        }
                                    />

                                    {matchByDescription && (
                                        <Box sx={{ ml: 4, mt: 1.5 }}>
                                            <RadioGroup
                                                value={descriptionMatchType}
                                                onChange={(e) => setDescriptionMatchType(e.target.value as 'current' | 'manual')}
                                            >
                                                <FormControlLabel
                                                    value="current"
                                                    control={<Radio size="small" />}
                                                    label={
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                Use current description
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {description || 'N/A'}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                                <FormControlLabel
                                                    value="manual"
                                                    control={<Radio size="small" />}
                                                    label={
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            Enter manually
                                                        </Typography>
                                                    }
                                                />
                                            </RadioGroup>

                                            {descriptionMatchType === 'manual' && (
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    label="Description"
                                                    value={descriptionMatch}
                                                    onChange={(e) => setDescriptionMatch(e.target.value)}
                                                    placeholder="Enter description to match"
                                                    sx={{ mt: 1.5 }}
                                                />
                                            )}
                                        </Box>
                                    )}
                                </Box>

                                <Divider />

                                {/* Extended Description Match */}
                                <Box>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={matchByExtendedDescription}
                                                onChange={(e) => handleExtendedDescriptionCheckboxChange(e.target.checked)}
                                            />
                                        }
                                        label={
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                Match by Extended Description
                                            </Typography>
                                        }
                                    />

                                    {matchByExtendedDescription && (
                                        <Box sx={{ ml: 4, mt: 1.5 }}>
                                            <RadioGroup
                                                value={extendedDescriptionMatchType}
                                                onChange={(e) => setExtendedDescriptionMatchType(e.target.value as 'current' | 'manual')}
                                            >
                                                <FormControlLabel
                                                    value="current"
                                                    control={<Radio size="small" />}
                                                    label={
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                Use current extended description
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {extendedDescription || 'N/A'}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                                <FormControlLabel
                                                    value="manual"
                                                    control={<Radio size="small" />}
                                                    label={
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            Enter manually
                                                        </Typography>
                                                    }
                                                />
                                            </RadioGroup>

                                            {extendedDescriptionMatchType === 'manual' && (
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    label="Extended Description"
                                                    value={extendedDescriptionMatch}
                                                    onChange={(e) => setExtendedDescriptionMatch(e.target.value)}
                                                    placeholder="Enter extended description to match"
                                                    sx={{ mt: 1.5 }}
                                                />
                                            )}
                                        </Box>
                                    )}
                                </Box>

                                <Divider />

                                {/* Amount Range Match */}
                                <Box>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={matchByAmountRange}
                                                onChange={(e) => handleAmountRangeCheckboxChange(e.target.checked)}
                                            />
                                        }
                                        label={
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                Match by Amount Range
                                            </Typography>
                                        }
                                    />

                                    {matchByAmountRange && (
                                        <Box sx={{ ml: 4, mt: 1.5 }}>
                                            <RadioGroup
                                                value={amountMatchType}
                                                onChange={(e) => setAmountMatchType(e.target.value as 'current' | 'manual')}
                                            >
                                                <FormControlLabel
                                                    value="current"
                                                    control={<Radio size="small" />}
                                                    label={
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                Use current amount range
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                ${(amount * 0.9).toFixed(2)} - ${(amount * 1.1).toFixed(2)} (±10%)
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                                <FormControlLabel
                                                    value="manual"
                                                    control={<Radio size="small" />}
                                                    label={
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            Enter manually
                                                        </Typography>
                                                    }
                                                />
                                            </RadioGroup>

                                            {amountMatchType === 'manual' && (
                                                <Box sx={{ display: 'flex', gap: 2, mt: 1.5 }}>
                                                    <TextField
                                                        type="number"
                                                        label="Min Amount"
                                                        value={amountRangeMin}
                                                        onChange={(e) => setAmountRangeMin(Number(e.target.value))}
                                                        size="small"
                                                        fullWidth
                                                        inputProps={{ step: 0.01 }}
                                                    />
                                                    <TextField
                                                        type="number"
                                                        label="Max Amount"
                                                        value={amountRangeMax}
                                                        onChange={(e) => setAmountRangeMax(Number(e.target.value))}
                                                        size="small"
                                                        fullWidth
                                                        inputProps={{ step: 0.01 }}
                                                    />
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            </Stack>
                        </Paper>
                    </Collapse>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none', fontWeight: 600 }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={isSaveDisabled || saving}
                    sx={{ textTransform: 'none', fontWeight: 600, minWidth: 100 }}
                >
                    {saving ? 'Saving...' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );



    // return (
    //     <Dialog
    //         open={open}
    //         onClose={onClose}
    //         maxWidth="sm"
    //         fullWidth
    //     >
    //         <DialogTitle>Categorize Transaction</DialogTitle>
    //
    //         <DialogContent dividers>
    //             {/* Category List */}
    //             <Typography variant="subtitle2" gutterBottom>
    //                 Select Category
    //             </Typography>
    //             <List sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
    //                 {/*{allCategories.map((category) => (*/}
    //                 {/*    <ListItem key={category} disablePadding>*/}
    //                 {/*        <ListItemButton*/}
    //                 {/*            selected={selectedCategory === category && !useCustomCategory}*/}
    //                 {/*            onClick={() => handleCategorySelect(category)}*/}
    //                 {/*        >*/}
    //                 {/*            <ListItemText primary={category} />*/}
    //                 {/*        </ListItemButton>*/}
    //                 {/*    </ListItem>*/}
    //                 {/*))}*/}
    //                 {allCategories.map((category) => {
    //                     const isSystem = isSystemCategory(category);
    //                     const isEnabled = isCategoryEnabled(category);
    //
    //                     return (
    //                         <ListItem
    //                             key={category}
    //                             disablePadding
    //                             secondaryAction={
    //                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    //                                     <Chip
    //                                         label={isSystem ? 'System' : 'Custom'}
    //                                         size="small"
    //                                         sx={{
    //                                             fontSize: '0.7rem',
    //                                             height: 20,
    //                                             bgcolor: isSystem ? 'primary.light' : 'secondary.light',
    //                                             color: isSystem ? 'primary.contrastText' : 'secondary.contrastText',
    //                                         }}
    //                                     />
    //                                     <MuiTooltip title={isEnabled ? 'Disable category' : 'Enable category'}>
    //                                         <IconButton
    //                                             edge="end"
    //                                             size="small"
    //                                             onClick={(e) => handleToggleCategoryEnabled(category, e)}
    //                                             sx={{
    //                                                 color: isEnabled ? 'success.main' : 'text.disabled',
    //                                             }}
    //                                         >
    //                                             {isEnabled ? <Eye size={18} /> : <EyeOff size={18} />}
    //                                         </IconButton>
    //                                     </MuiTooltip>
    //                                 </Box>
    //                             }
    //                         >
    //                             <ListItemButton
    //                                 selected={selectedCategory === category && !useCustomCategory}
    //                                 onClick={() => handleCategorySelect(category)}
    //                                 disabled={!isEnabled}
    //                                 sx={{
    //                                     opacity: isEnabled ? 1 : 0.5,
    //                                     '&.Mui-selected': {
    //                                         backgroundColor: 'primary.light',
    //                                         color: 'primary.contrastText',
    //                                         '&:hover': {
    //                                             backgroundColor: 'primary.main',
    //                                         }
    //                                     },
    //                                     '&.Mui-disabled': {
    //                                         opacity: 0.5,
    //                                     }
    //                                 }}
    //                             >
    //                                 <ListItemText
    //                                     primary={category}
    //                                     primaryTypographyProps={{
    //                                         sx: {
    //                                             textDecoration: isEnabled ? 'none' : 'line-through',
    //                                         }
    //                                     }}
    //                                 />
    //                             </ListItemButton>
    //                         </ListItem>
    //                     );
    //                 })}
    //             </List>
    //
    //             <Divider sx={{ my: 2 }} />
    //
    //             {/* Custom Category */}
    //             <Box sx={{ mb: 3 }}>
    //                 <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 1.5 }}>
    //                     Add Custom Category
    //                 </Typography>
    //                 <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
    //                     <TextField
    //                         fullWidth
    //                         size="medium"
    //                         label="Custom Category Name"
    //                         value={customCategory}
    //                         onChange={(e) => handleCustomCategoryChange(e.target.value)}
    //                         placeholder="Enter custom category name"
    //                         onKeyPress={(e) => {
    //                             if (e.key === 'Enter' && customCategory.trim()) {
    //                                 handleAddCustomCategory();
    //                             }
    //                         }}
    //                     />
    //                     <Button
    //                         variant="contained"
    //                         onClick={handleAddCustomCategory}
    //                         disabled={!customCategory.trim()}
    //                         startIcon={<Plus size={18} />}
    //                         sx={{
    //                             minWidth: 120,
    //                             textTransform: 'none',
    //                             fontWeight: 600
    //                         }}
    //                     >
    //                         Add
    //                     </Button>
    //                 </Box>
    //
    //                 {/*{customCategory && (*/}
    //                 {/*    <FormControlLabel*/}
    //                 {/*        control={*/}
    //                 {/*            <Checkbox*/}
    //                 {/*                checked={overrideSystemCategory}*/}
    //                 {/*                onChange={(e) => setOverrideSystemCategory(e.target.checked)}*/}
    //                 {/*            />*/}
    //                 {/*        }*/}
    //                 {/*        label="Override system categories with this custom category"*/}
    //                 {/*        sx={{ mt: 1 }}*/}
    //                 {/*    />*/}
    //                 {/*)}*/}
    //                 <FormControlLabel
    //                     control={
    //                         <Checkbox
    //                             checked={overrideSystemCategory}
    //                             onChange={(e) => setOverrideSystemCategory(e.target.checked)}
    //                         />
    //                     }
    //                     label={
    //                         <Typography variant="body2" color="text.secondary">
    //                             Override system categories with custom category
    //                         </Typography>
    //                     }
    //                 />
    //             </Box>
    //
    //             <Divider sx={{ my: 2 }} />
    //
    //             {/* Advanced Options */}
    //             <Box>
    //                 <Button
    //                     variant="outlined"
    //                     onClick={() => setShowAdvanced(!showAdvanced)}
    //                     fullWidth
    //                     sx={{ mb: 2 }}
    //                 >
    //                     {showAdvanced ? 'Hide Advanced Options' : 'Advanced Matching Options'}
    //                 </Button>
    //
    //                 <Collapse in={showAdvanced}>
    //                     <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
    //                         <Typography variant="subtitle2" gutterBottom>
    //                             Apply this category to future transactions matching:
    //                         </Typography>
    //
    //                         <Stack spacing={1} sx={{ mt: 2 }}>
    //                             <FormControlLabel
    //                                 control={
    //                                     <Checkbox
    //                                         checked={matchByMerchant}
    //                                         onChange={(e) => setMatchByMerchant(e.target.checked)}
    //                                     />
    //                                 }
    //                                 label={`Merchant: "${merchantName || 'N/A'}"`}
    //                             />
    //                             <TextField
    //                                 fullWidth
    //                                 size="small"
    //                                 label="Merchant"
    //                                 value={merchantNameMatch}
    //                                 onChange={(e) => setMerchantNameMatch(e.target.value)}
    //                                 disabled={!matchByMerchant}
    //                                 placeholder="Enter merchant name to match"
    //                                 sx={{mt: 1}}
    //                                 helperText="Match transactions with this merchant name"
    //                                 />
    //                             <FormControlLabel
    //                                 control={
    //                                     <Checkbox
    //                                         checked={matchByDescription}
    //                                         onChange={(e) => setMatchByDescription(e.target.checked)}
    //                                     />
    //                                 }
    //                                 label={`Description: "${description || 'N/A'}"`}
    //                             />
    //                             <TextField
    //                                 fullWidth
    //                                 size="small"
    //                                 label="Description"
    //                                 value={descriptionMatch}
    //                                 onChange={(e) => setDescriptionMatch(e.target.value)}
    //                                 disabled={!matchByDescription}
    //                                 placeholder="Enter description to match"
    //                                 sx={{mt: 1}}
    //                                 helperText="Match transactions with this description"
    //                             />
    //
    //                             <FormControlLabel
    //                                 control={
    //                                     <Checkbox
    //                                         checked={matchByExtendedDescription}
    //                                         onChange={(e) => setMatchByExtendedDescription(e.target.checked)}
    //                                     />
    //                                 }
    //                                 label={`Extended Description: "${extendedDescription || 'N/A'}"`}
    //                             />
    //                             <TextField
    //                                 fullWidth
    //                                 size="small"
    //                                 label="Extended Description"
    //                                 value={extendedDescriptionMatch}
    //                                 onChange={(e) => setExtendedDescriptionMatch(e.target.value)}
    //                                 disabled={!matchByExtendedDescription}
    //                                 placeholder="Enter extended description to match"
    //                                 sx={{mt: 1}}
    //                                 helperText="Match transactions with this extended description"
    //                                 />
    //
    //                             <FormControlLabel
    //                                 control={
    //                                     <Checkbox
    //                                         checked={matchByAmountRange}
    //                                         onChange={(e) => setMatchByAmountRange(e.target.checked)}
    //                                     />
    //                                 }
    //                                 label="Amount Range"
    //                             />
    //
    //                             {matchByAmountRange && (
    //                                 <Box sx={{ pl: 4, display: 'flex', gap: 2, mt: 1 }}>
    //                                     <TextField
    //                                         type="number"
    //                                         label="Min Amount"
    //                                         value={amountRangeMin}
    //                                         onChange={(e) => setAmountRangeMin(Number(e.target.value))}
    //                                         size="small"
    //                                         inputProps={{ step: 0.01 }}
    //                                     />
    //                                     <TextField
    //                                         type="number"
    //                                         label="Max Amount"
    //                                         value={amountRangeMax}
    //                                         onChange={(e) => setAmountRangeMax(Number(e.target.value))}
    //                                         size="small"
    //                                         inputProps={{ step: 0.01 }}
    //                                     />
    //                                 </Box>
    //                             )}
    //                         </Stack>
    //                     </Box>
    //                 </Collapse>
    //             </Box>
    //         </DialogContent>
    //
    //         <DialogActions>
    //             <Button onClick={onClose} disabled={saving}>
    //                 Cancel
    //             </Button>
    //             <Button
    //                 onClick={handleSave}
    //                 variant="contained"
    //                 disabled={isSaveDisabled || saving}
    //             >
    //                 {saving ? 'Saving...' : 'Save'}
    //             </Button>
    //         </DialogActions>
    //     </Dialog>
    // );
};

export default CategoryDialog;