import React, { useState, useMemo } from 'react';
import {
    Dialog,
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
    Stack,
    Paper,
    Collapse,
    alpha,
    Tooltip,
    Menu,
    MenuItem,
    Badge,
    CircularProgress,
    Card
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TuneIcon from '@mui/icons-material/Tune';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LabelIcon from '@mui/icons-material/Label';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SearchIcon from '@mui/icons-material/Search';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DescriptionIcon from '@mui/icons-material/Description';
import { TransactionRule } from '../services/TransactionRuleService';

const maroonColor = '#800000';
const tealColor = '#0d9488';

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
                    <TuneIcon />
                    <Box>
                        <Typography variant="h6" fontWeight={600}>
                            Transaction Rules
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                            Manage auto-categorization rules
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ p: 3 }}>
                    {/* Stats Cards */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
                        <Card sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha(maroonColor, 0.05),
                            border: `1px solid ${alpha(maroonColor, 0.1)}`
                        }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                Total Rules
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: maroonColor }}>
                                {loading ? '...' : stats.total}
                            </Typography>
                        </Card>
                        <Card sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha(tealColor, 0.05),
                            border: `1px solid ${alpha(tealColor, 0.1)}`
                        }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                Active
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: tealColor }}>
                                {loading ? '...' : stats.active}
                            </Typography>
                        </Card>
                        <Card sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha('#ef4444', 0.05),
                            border: `1px solid ${alpha('#ef4444', 0.1)}`
                        }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                Inactive
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#ef4444' }}>
                                {loading ? '...' : stats.inactive}
                            </Typography>
                        </Card>
                        <Card sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha('#8b5cf6', 0.05),
                            border: `1px solid ${alpha('#8b5cf6', 0.1)}`
                        }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                Total Matches
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#8b5cf6' }}>
                                {loading ? '...' : stats.totalMatches}
                            </Typography>
                        </Card>
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
                                        <SearchIcon sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                )
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                }
                            }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant={filterActive === 'all' ? 'contained' : 'outlined'}
                                onClick={() => setFilterActive('all')}
                                size="small"
                                disabled={loading}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    minWidth: 80,
                                    fontWeight: 600,
                                    ...(filterActive === 'all' && {
                                        bgcolor: maroonColor,
                                        '&:hover': { bgcolor: '#a00000' }
                                    }),
                                    ...(filterActive !== 'all' && {
                                        borderColor: maroonColor,
                                        color: maroonColor,
                                        '&:hover': {
                                            bgcolor: alpha(maroonColor, 0.05),
                                            borderColor: maroonColor
                                        }
                                    })
                                }}
                            >
                                All
                            </Button>
                            <Button
                                variant={filterActive === 'active' ? 'contained' : 'outlined'}
                                onClick={() => setFilterActive('active')}
                                size="small"
                                disabled={loading}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    minWidth: 80,
                                    fontWeight: 600,
                                    ...(filterActive === 'active' && {
                                        bgcolor: tealColor,
                                        '&:hover': { bgcolor: '#0f766e' }
                                    }),
                                    ...(filterActive !== 'active' && {
                                        borderColor: tealColor,
                                        color: tealColor,
                                        '&:hover': {
                                            bgcolor: alpha(tealColor, 0.05),
                                            borderColor: tealColor
                                        }
                                    })
                                }}
                            >
                                Active
                            </Button>
                            <Button
                                variant={filterActive === 'inactive' ? 'contained' : 'outlined'}
                                onClick={() => setFilterActive('inactive')}
                                size="small"
                                disabled={loading}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    minWidth: 90,
                                    fontWeight: 600,
                                    ...(filterActive === 'inactive' && {
                                        bgcolor: '#ef4444',
                                        '&:hover': { bgcolor: '#dc2626' }
                                    }),
                                    ...(filterActive !== 'inactive' && {
                                        borderColor: '#ef4444',
                                        color: '#ef4444',
                                        '&:hover': {
                                            bgcolor: alpha('#ef4444', 0.05),
                                            borderColor: '#ef4444'
                                        }
                                    })
                                }}
                            >
                                Inactive
                            </Button>
                        </Box>
                    </Box>

                    {/* Sort Options */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            Sort by:
                        </Typography>
                        <Chip
                            label="Priority"
                            onClick={() => setSortBy('priority')}
                            variant={sortBy === 'priority' ? 'filled' : 'outlined'}
                            size="small"
                            disabled={loading}
                            sx={{
                                borderRadius: 2,
                                fontWeight: 600,
                                ...(sortBy === 'priority' && {
                                    bgcolor: maroonColor,
                                    color: 'white',
                                    '&:hover': { bgcolor: '#a00000' }
                                })
                            }}
                        />
                        <Chip
                            label="Matches"
                            onClick={() => setSortBy('matches')}
                            variant={sortBy === 'matches' ? 'filled' : 'outlined'}
                            size="small"
                            disabled={loading}
                            sx={{
                                borderRadius: 2,
                                fontWeight: 600,
                                ...(sortBy === 'matches' && {
                                    bgcolor: maroonColor,
                                    color: 'white',
                                    '&:hover': { bgcolor: '#a00000' }
                                })
                            }}
                        />
                        <Chip
                            label="Category"
                            onClick={() => setSortBy('category')}
                            variant={sortBy === 'category' ? 'filled' : 'outlined'}
                            size="small"
                            disabled={loading}
                            sx={{
                                borderRadius: 2,
                                fontWeight: 600,
                                ...(sortBy === 'category' && {
                                    bgcolor: maroonColor,
                                    color: 'white',
                                    '&:hover': { bgcolor: '#a00000' }
                                })
                            }}
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
                                sx={{ mb: 3, color: maroonColor }}
                            />
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Loading Transaction Rules
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Please wait while we fetch your rules...
                            </Typography>
                        </Box>
                    ) : filteredRules.length === 0 ? (
                        <Card
                            sx={{
                                p: 6,
                                textAlign: 'center',
                                borderRadius: 2,
                                bgcolor: alpha(maroonColor, 0.02),
                                border: `1px solid ${alpha(maroonColor, 0.1)}`
                            }}
                        >
                            <Box sx={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                bgcolor: alpha(maroonColor, 0.1),
                                color: maroonColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2
                            }}>
                                <TuneIcon sx={{ fontSize: 32 }} />
                            </Box>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                {searchTerm ? 'No rules found' : 'No transaction rules yet'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {searchTerm
                                    ? `No rules match "${searchTerm}"`
                                    : 'Create rules from the transactions page to auto-categorize future transactions'}
                            </Typography>
                        </Card>
                    ) : (
                        <List sx={{ p: 0 }}>
                            {filteredRules.map((rule, index) => {
                                const isExpanded = expandedRuleId === rule.id;
                                const priorityInfo = getPriorityLabel(rule.priority);

                                return (
                                    <Card
                                        key={rule.id || index}
                                        sx={{
                                            mb: 2,
                                            borderRadius: 2,
                                            border: `1px solid ${alpha(rule.isActive ? tealColor : '#ccc', 0.3)}`,
                                            bgcolor: alpha(rule.isActive ? tealColor : '#ccc', 0.02),
                                            overflow: 'hidden',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                borderColor: rule.isActive ? tealColor : maroonColor,
                                                boxShadow: `0 4px 12px ${alpha(rule.isActive ? tealColor : maroonColor, 0.15)}`
                                            }
                                        }}
                                    >
                                        <ListItem
                                            sx={{
                                                p: 2.5,
                                                display: 'block'
                                            }}
                                        >
                                            {/* Header Row */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                                <Chip
                                                    label={rule.categoryName || 'Unknown'}
                                                    icon={<LabelIcon sx={{ fontSize: 14 }} />}
                                                    sx={{
                                                        fontWeight: 600,
                                                        bgcolor: alpha(maroonColor, 0.1),
                                                        color: maroonColor,
                                                        borderRadius: 2,
                                                        '& .MuiChip-icon': { color: maroonColor }
                                                    }}
                                                />
                                                <Chip
                                                    label={priorityInfo.label}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: alpha(priorityInfo.color, 0.15),
                                                        color: priorityInfo.color,
                                                        fontSize: '0.7rem',
                                                        height: 22,
                                                        fontWeight: 600
                                                    }}
                                                />
                                                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Badge
                                                        badgeContent={rule.matchCount ?? 0}
                                                        sx={{
                                                            '& .MuiBadge-badge': {
                                                                bgcolor: maroonColor,
                                                                color: 'white',
                                                                fontWeight: 600
                                                            }
                                                        }}
                                                    >
                                                        <Chip
                                                            icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
                                                            label="Matches"
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{
                                                                borderRadius: 2,
                                                                borderColor: alpha(maroonColor, 0.3),
                                                                color: maroonColor,
                                                                '& .MuiChip-icon': { color: maroonColor }
                                                            }}
                                                        />
                                                    </Badge>
                                                    <Chip
                                                        icon={rule.isActive ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <CancelIcon sx={{ fontSize: 14 }} />}
                                                        label={rule.isActive ? 'Active' : 'Inactive'}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: alpha(rule.isActive ? tealColor : '#ef4444', 0.15),
                                                            color: rule.isActive ? tealColor : '#ef4444',
                                                            fontWeight: 600,
                                                            '& .MuiChip-icon': {
                                                                color: rule.isActive ? tealColor : '#ef4444'
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                            </Box>

                                            {/* Conditions Preview */}
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                                {rule.merchantRule && (
                                                    <Chip
                                                        icon={<StorefrontIcon sx={{ fontSize: 12 }} />}
                                                        label={`Merchant: ${rule.merchantRule}`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{
                                                            fontSize: '0.75rem',
                                                            borderRadius: 2,
                                                            borderColor: alpha(tealColor, 0.3),
                                                            '& .MuiChip-icon': { color: tealColor }
                                                        }}
                                                    />
                                                )}
                                                {rule.descriptionRule && (
                                                    <Chip
                                                        icon={<DescriptionIcon sx={{ fontSize: 12 }} />}
                                                        label={`Description: ${rule.descriptionRule}`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{
                                                            fontSize: '0.75rem',
                                                            borderRadius: 2,
                                                            borderColor: alpha(tealColor, 0.3),
                                                            '& .MuiChip-icon': { color: tealColor }
                                                        }}
                                                    />
                                                )}
                                                {((rule.amountMin ?? 0) > 0 || (rule.amountMax ?? 0) > 0) && (
                                                    <Chip
                                                        label={`$${(rule.amountMin ?? 0).toFixed(2)} - $${(rule.amountMax ?? 0).toFixed(2)}`}
                                                        size="small"
                                                        variant="outlined"
                                                        icon={<AttachMoneyIcon sx={{ fontSize: 12 }} />}
                                                        sx={{
                                                            fontSize: '0.75rem',
                                                            borderRadius: 2,
                                                            borderColor: alpha(tealColor, 0.3),
                                                            '& .MuiChip-icon': { color: tealColor }
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            {/* Actions */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={rule.isActive ?? false}
                                                            onChange={() => handleToggleRuleActive(rule.id!, rule.isActive)}
                                                            size="small"
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
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {rule.isActive ? 'Active' : 'Inactive'}
                                                        </Typography>
                                                    }
                                                />

                                                <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                                                    <Tooltip title={isExpanded ? 'Hide details' : 'Show details'} arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleToggleExpand(rule.id!)}
                                                            sx={{
                                                                color: maroonColor,
                                                                '&:hover': { bgcolor: alpha(maroonColor, 0.1) }
                                                            }}
                                                        >
                                                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                        </IconButton>
                                                    </Tooltip>

                                                    {onEditRule && (
                                                        <Tooltip title="Edit rule" arrow>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => onEditRule(rule)}
                                                                sx={{
                                                                    color: tealColor,
                                                                    '&:hover': { bgcolor: alpha(tealColor, 0.1) }
                                                                }}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    <Tooltip title="More options" arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => handleOpenMenu(e, rule)}
                                                            sx={{
                                                                color: 'text.secondary',
                                                                '&:hover': { bgcolor: 'action.hover' }
                                                            }}
                                                        >
                                                            <MoreVertIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>
                                        </ListItem>

                                        {/* Expanded Details */}
                                        <Collapse in={isExpanded}>
                                            <Divider />
                                            <Box sx={{ p: 2.5, bgcolor: alpha(maroonColor, 0.02) }}>
                                                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                                                    Rule Details
                                                </Typography>
                                                <Stack spacing={1.5}>
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                                            Priority Level
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {rule.priority ?? 'Not Set'} - {priorityInfo.label}
                                                        </Typography>
                                                    </Box>

                                                    {rule.merchantRule && (
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                                                Merchant Rule
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                {rule.merchantRule}
                                                            </Typography>
                                                        </Box>
                                                    )}

                                                    {rule.descriptionRule && (
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                                                Description Rule
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                {rule.descriptionRule}
                                                            </Typography>
                                                        </Box>
                                                    )}

                                                    {rule.extendedDescriptionRule && (
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                                                Extended Description Rule
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                {rule.extendedDescriptionRule}
                                                            </Typography>
                                                        </Box>
                                                    )}

                                                    {((rule.amountMin ?? 0) > 0 || (rule.amountMax ?? 0) > 0) && (
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                                                Amount Range
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                ${(rule.amountMin ?? 0).toFixed(2)} - ${(rule.amountMax ?? 0).toFixed(2)}
                                                            </Typography>
                                                        </Box>
                                                    )}

                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                                            Times Matched
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {rule.matchCount ?? 0} transactions
                                                        </Typography>
                                                    </Box>

                                                    {rule.dateCreated && (
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
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
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
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
                                    </Card>
                                );
                            })}
                        </List>
                    )}
                </Box>
            </DialogContent>

            {/* Footer */}
            <DialogActions sx={{ p: 3, pt: 2 }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 4,
                        bgcolor: maroonColor,
                        '&:hover': {
                            bgcolor: '#a00000'
                        }
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
                        borderRadius: 2,
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
                                {selectedRule.isActive ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
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
                                    <EditIcon fontSize="small" />
                                    <Typography variant="body2">Edit</Typography>
                                </Box>
                            </MenuItem>
                        )}

                        <Divider />

                        <MenuItem
                            onClick={() => handleDeleteRule(selectedRule.id!)}
                            disabled={deletingRuleId === selectedRule.id}
                            sx={{ color: '#dc2626' }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <DeleteIcon fontSize="small" />
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