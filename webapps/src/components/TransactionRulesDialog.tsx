import React, { useState, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    List,
    ListItem,
    IconButton,
    Chip,
    TextField,
    InputAdornment,
    Switch,
    FormControlLabel,
    Divider,
    Avatar,
    Stack,
    Paper,
    Collapse,
    useTheme,
    alpha,
    Tooltip,
    Menu,
    MenuItem,
    Badge,
    CircularProgress
} from '@mui/material';
import {
    Search,
    Trash2,
    Edit,
    ChevronDown,
    ChevronUp,
    SlidersHorizontal,
    TrendingUp,
    DollarSign,
    Tag,
    CheckCircle2,
    XCircle,
    MoreVertical,
    Eye,
    EyeOff
} from 'lucide-react';
import { TransactionRule } from '../services/TransactionRuleService';

interface TransactionRulesDialogProps {
    open: boolean;
    onClose: () => void;
    rules: TransactionRule[];
    loading?: boolean;
    onDeleteRule: (ruleId: number) => Promise<void>;
    onToggleRule: (ruleId: number, isActive: boolean) => Promise<void>;
    onEditRule?: (rule: TransactionRule) => void;
}

const TransactionRulesDialog: React.FC<TransactionRulesDialogProps> = ({
                                                                           open,
                                                                           onClose,
                                                                           rules,
                                                                           loading = false,
                                                                           onDeleteRule,
                                                                           onToggleRule,
                                                                           onEditRule
                                                                       }) => {
    const theme = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRuleId, setExpandedRuleId] = useState<number | null>(null);
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
    const [sortBy, setSortBy] = useState<'priority' | 'matches' | 'category'>('priority');
    const [deletingRuleId, setDeletingRuleId] = useState<number | null>(null);
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRule, setSelectedRule] = useState<TransactionRule | null>(null);

    // Local state for optimistic updates
    const [localRules, setLocalRules] = useState<TransactionRule[]>(rules);

    // Sync local state when props change
    React.useEffect(() => {
        setLocalRules(rules);
    }, [rules]);

    // Filter and sort rules
    const filteredRules = useMemo(() => {
        let filtered = [...localRules];

        // Apply search filter
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(rule =>
                rule.categoryName?.toLowerCase().includes(search) ||
                rule.merchantRule?.toLowerCase().includes(search) ||
                rule.descriptionRule?.toLowerCase().includes(search)
            );
        }

        // Apply active filter
        if (filterActive !== 'all') {
            filtered = filtered.filter(rule =>
                filterActive === 'active' ? rule.isActive === true : rule.isActive === false
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'priority':
                    return (a.priority ?? 999) - (b.priority ?? 999);
                case 'matches':
                    return (b.matchCount ?? 0) - (a.matchCount ?? 0);
                case 'category':
                    return (a.categoryName ?? '').localeCompare(b.categoryName ?? '');
                default:
                    return 0;
            }
        });

        return filtered;
    }, [localRules, searchTerm, filterActive, sortBy]);

    const handleToggleExpand = (ruleId: number) => {
        setExpandedRuleId(expandedRuleId === ruleId ? null : ruleId);
    };

    const handleDeleteRule = async (ruleId: number) => {
        setDeletingRuleId(ruleId);

        // Optimistically remove from local state
        const originalRules = [...localRules];
        setLocalRules(prev => prev.filter(rule => rule.id !== ruleId));

        try {
            await onDeleteRule(ruleId);
            handleCloseMenu();
        } catch (error) {
            // Revert on error
            setLocalRules(originalRules);
            console.error('Error deleting rule:', error);
        } finally {
            setDeletingRuleId(null);
        }
    };

    const handleToggleRuleActive = async (ruleId: number, currentStatus?: boolean) => {
        // Optimistically update local state FIRST
        setLocalRules(prev =>
            prev.map(rule =>
                rule.id === ruleId
                    ? { ...rule, isActive: !currentStatus }
                    : rule
            )
        );

        try {
            // Then call the parent handler
            await onToggleRule(ruleId, !currentStatus);
        } catch (error) {
            // Revert on error
            setLocalRules(prev =>
                prev.map(rule =>
                    rule.id === ruleId
                        ? { ...rule, isActive: currentStatus }
                        : rule
                )
            );
            console.error('Error toggling rule:', error);
        }
    };

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, rule: TransactionRule) => {
        setMenuAnchorEl(event.currentTarget);
        setSelectedRule(rule);
    };

    const handleCloseMenu = () => {
        setMenuAnchorEl(null);
        setSelectedRule(null);
    };

    const getPriorityLabel = (priority?: number): { label: string; color: string } => {
        if (!priority) return { label: 'Not Set', color: '#9e9e9e' };
        if (priority === 1) return { label: 'Highest', color: '#dc2626' };
        if (priority <= 3) return { label: 'High', color: '#ea580c' };
        if (priority <= 5) return { label: 'Medium', color: '#f59e0b' };
        return { label: 'Low', color: '#10b981' };
    };

    const stats = useMemo(() => {
        if (loading) {
            return {
                total: 0,
                active: 0,
                inactive: 0,
                totalMatches: 0
            };
        }
        return {
            total: localRules.length,
            active: localRules.filter(r => r.isActive === true).length,
            inactive: localRules.filter(r => r.isActive === false).length,
            totalMatches: localRules.reduce((sum, r) => sum + (r.matchCount ?? 0), 0)
        };
    }, [localRules, loading]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                            sx={{
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                width: 48,
                                height: 48
                            }}
                        >
                            <SlidersHorizontal size={24} />
                        </Avatar>
                        <Box>
                            <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
                                Transaction Rules
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Manage auto-categorization rules
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {/* Stats Cards */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
                    <Paper sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Total Rules
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                            {loading ? '...' : stats.total}
                        </Typography>
                    </Paper>
                    <Paper sx={{ p: 2, borderRadius: 3, bgcolor: alpha('#10b981', 0.05) }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Active
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#10b981' }}>
                            {loading ? '...' : stats.active}
                        </Typography>
                    </Paper>
                    <Paper sx={{ p: 2, borderRadius: 3, bgcolor: alpha('#ef4444', 0.05) }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Inactive
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#ef4444' }}>
                            {loading ? '...' : stats.inactive}
                        </Typography>
                    </Paper>
                    <Paper sx={{ p: 2, borderRadius: 3, bgcolor: alpha('#8b5cf6', 0.05) }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Total Matches
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#8b5cf6' }}>
                            {loading ? '...' : stats.totalMatches}
                        </Typography>
                    </Paper>
                </Box>

                {/* Search and Filters */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search rules..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={loading}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={18} />
                                </InputAdornment>
                            )
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3
                            }
                        }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant={filterActive === 'all' ? 'contained' : 'outlined'}
                            onClick={() => setFilterActive('all')}
                            size="small"
                            disabled={loading}
                            sx={{ borderRadius: 3, textTransform: 'none', minWidth: 80 }}
                        >
                            All
                        </Button>
                        <Button
                            variant={filterActive === 'active' ? 'contained' : 'outlined'}
                            onClick={() => setFilterActive('active')}
                            size="small"
                            disabled={loading}
                            sx={{ borderRadius: 3, textTransform: 'none', minWidth: 80 }}
                        >
                            Active
                        </Button>
                        <Button
                            variant={filterActive === 'inactive' ? 'contained' : 'outlined'}
                            onClick={() => setFilterActive('inactive')}
                            size="small"
                            disabled={loading}
                            sx={{ borderRadius: 3, textTransform: 'none', minWidth: 80 }}
                        >
                            Inactive
                        </Button>
                    </Box>
                </Box>

                {/* Sort Options */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Sort by:
                    </Typography>
                    <Chip
                        label="Priority"
                        onClick={() => setSortBy('priority')}
                        variant={sortBy === 'priority' ? 'filled' : 'outlined'}
                        size="small"
                        disabled={loading}
                        sx={{ borderRadius: 2 }}
                    />
                    <Chip
                        label="Matches"
                        onClick={() => setSortBy('matches')}
                        variant={sortBy === 'matches' ? 'filled' : 'outlined'}
                        size="small"
                        disabled={loading}
                        sx={{ borderRadius: 2 }}
                    />
                    <Chip
                        label="Category"
                        onClick={() => setSortBy('category')}
                        variant={sortBy === 'category' ? 'filled' : 'outlined'}
                        size="small"
                        disabled={loading}
                        sx={{ borderRadius: 2 }}
                    />
                </Box>

                {/* Rules List */}
                {loading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: 8
                        }}
                    >
                        <CircularProgress
                            size={56}
                            thickness={4}
                            sx={{
                                mb: 3,
                                color: theme.palette.primary.main
                            }}
                        />
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Loading Transaction Rules
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Please wait while we fetch your rules...
                        </Typography>
                    </Box>
                ) : filteredRules.length === 0 ? (
                    <Paper
                        sx={{
                            p: 6,
                            textAlign: 'center',
                            borderRadius: 3,
                            bgcolor: alpha(theme.palette.primary.main, 0.02)
                        }}
                    >
                        <Avatar
                            sx={{
                                width: 64,
                                height: 64,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                mx: 'auto',
                                mb: 2
                            }}
                        >
                            <SlidersHorizontal size={32} />
                        </Avatar>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {searchTerm ? 'No rules found' : 'No transaction rules yet'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {searchTerm
                                ? `No rules match "${searchTerm}"`
                                : 'Create rules from the transactions page to auto-categorize future transactions'}
                        </Typography>
                    </Paper>
                ) : (
                    <List sx={{ p: 0 }}>
                        {filteredRules.map((rule, index) => {
                            const isExpanded = expandedRuleId === rule.id;
                            const priorityInfo = getPriorityLabel(rule.priority);

                            return (
                                <Paper
                                    key={rule.id || index}
                                    elevation={0}
                                    sx={{
                                        mb: 2,
                                        borderRadius: 3,
                                        border: '1px solid',
                                        borderColor: alpha(theme.palette.divider, 0.5),
                                        overflow: 'hidden',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: theme.palette.primary.main,
                                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`
                                        }
                                    }}
                                >
                                    <ListItem
                                        sx={{
                                            p: 2.5,
                                            cursor: 'pointer',
                                            bgcolor: rule.isActive ? 'background.paper' : alpha(theme.palette.action.disabled, 0.05)
                                        }}
                                    >
                                        <Box sx={{ flex: 1 }}>
                                            {/* Header Row */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                                                <Chip
                                                    label={rule.categoryName || 'Unknown'}
                                                    icon={<Tag size={14} />}
                                                    sx={{
                                                        fontWeight: 600,
                                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                        color: theme.palette.primary.main,
                                                        borderRadius: 2
                                                    }}
                                                />
                                                <Chip
                                                    label={priorityInfo.label}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: alpha(priorityInfo.color, 0.1),
                                                        color: priorityInfo.color,
                                                        fontSize: '0.7rem',
                                                        height: 22,
                                                        fontWeight: 600
                                                    }}
                                                />
                                                <Badge
                                                    badgeContent={rule.matchCount ?? 0}
                                                    color="primary"
                                                    sx={{ ml: 'auto' }}
                                                >
                                                    <Chip
                                                        icon={<TrendingUp size={14} />}
                                                        label="Matches"
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ borderRadius: 2 }}
                                                    />
                                                </Badge>
                                            </Box>

                                            {/* Conditions Preview */}
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                                                {rule.merchantRule && (
                                                    <Chip
                                                        label={`Merchant: ${rule.merchantRule}`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontSize: '0.75rem', borderRadius: 2 }}
                                                    />
                                                )}
                                                {rule.descriptionRule && (
                                                    <Chip
                                                        label={`Description: ${rule.descriptionRule}`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontSize: '0.75rem', borderRadius: 2 }}
                                                    />
                                                )}
                                                {((rule.amountMin ?? 0) > 0 || (rule.amountMax ?? 0) > 0) && (
                                                    <Chip
                                                        label={`$${(rule.amountMin ?? 0).toFixed(2)} - $${(rule.amountMax ?? 0).toFixed(2)}`}
                                                        size="small"
                                                        variant="outlined"
                                                        icon={<DollarSign size={12} />}
                                                        sx={{ fontSize: '0.75rem', borderRadius: 2 }}
                                                    />
                                                )}
                                            </Box>

                                            {/* Actions */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={rule.isActive ?? false}
                                                            onChange={() => handleToggleRuleActive(rule.id!, rule.isActive)}
                                                            size="small"
                                                        />
                                                    }
                                                    label={
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {rule.isActive ? 'Active' : 'Inactive'}
                                                        </Typography>
                                                    }
                                                />

                                                <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                                                    <Tooltip title={isExpanded ? 'Hide details' : 'Show details'}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleToggleExpand(rule.id!)}
                                                        >
                                                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                        </IconButton>
                                                    </Tooltip>

                                                    {onEditRule && (
                                                        <Tooltip title="Edit rule">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => onEditRule(rule)}
                                                                sx={{
                                                                    color: theme.palette.primary.main,
                                                                    '&:hover': {
                                                                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                                                                    }
                                                                }}
                                                            >
                                                                <Edit size={18} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    <Tooltip title="More options">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => handleOpenMenu(e, rule)}
                                                        >
                                                            <MoreVertical size={18} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </ListItem>

                                    {/* Expanded Details */}
                                    <Collapse in={isExpanded}>
                                        <Divider />
                                        <Box sx={{ p: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                                                Rule Details
                                            </Typography>
                                            <Stack spacing={1.5}>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                        Priority Level
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {rule.priority ?? 'Not Set'} - {priorityInfo.label}
                                                    </Typography>
                                                </Box>

                                                {rule.merchantRule && (
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                            Merchant Rule
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {rule.merchantRule}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                {rule.descriptionRule && (
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                            Description Rule
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {rule.descriptionRule}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                {rule.extendedDescriptionRule && (
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                            Extended Description Rule
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {rule.extendedDescriptionRule}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                {((rule.amountMin ?? 0) > 0 || (rule.amountMax ?? 0) > 0) && (
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                            Amount Range
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            ${(rule.amountMin ?? 0).toFixed(2)} - ${(rule.amountMax ?? 0).toFixed(2)}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                        Times Matched
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {rule.matchCount ?? 0} transactions
                                                    </Typography>
                                                </Box>

                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                        Status
                                                    </Typography>
                                                    <Chip
                                                        icon={rule.isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                                        label={rule.isActive ? 'Active' : 'Inactive'}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: rule.isActive
                                                                ? alpha('#10b981', 0.1)
                                                                : alpha('#ef4444', 0.1),
                                                            color: rule.isActive ? '#10b981' : '#ef4444',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                </Box>

                                                {rule.dateCreated && (
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                            Created
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {new Date(rule.dateCreated).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                {rule.dateModified && (
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                            Last Modified
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {new Date(rule.dateModified).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Stack>
                                        </Box>
                                    </Collapse>
                                </Paper>
                            );
                        })}
                    </List>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 3,
                        px: 4
                    }}
                >
                    Close
                </Button>
            </DialogActions>

            {/* Context Menu */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleCloseMenu}
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        minWidth: 180
                    }
                }}
            >
                {selectedRule && (
                    <>
                        <MenuItem
                            onClick={() => {
                                handleToggleRuleActive(selectedRule.id!, selectedRule.isActive);
                                handleCloseMenu();
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                {selectedRule.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
                                <Typography variant="body2">
                                    {selectedRule.isActive ? 'Deactivate' : 'Activate'}
                                </Typography>
                            </Box>
                        </MenuItem>

                        {onEditRule && (
                            <MenuItem
                                onClick={() => {
                                    onEditRule(selectedRule);
                                    handleCloseMenu();
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Edit size={18} />
                                    <Typography variant="body2">Edit</Typography>
                                </Box>
                            </MenuItem>
                        )}

                        <Divider />

                        <MenuItem
                            onClick={() => handleDeleteRule(selectedRule.id!)}
                            disabled={deletingRuleId === selectedRule.id}
                            sx={{ color: 'error.main' }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Trash2 size={18} />
                                <Typography variant="body2">
                                    {deletingRuleId === selectedRule.id ? 'Deleting...' : 'Delete'}
                                </Typography>
                            </Box>
                        </MenuItem>
                    </>
                )}
            </Menu>
        </Dialog>
    );
};

export default TransactionRulesDialog;