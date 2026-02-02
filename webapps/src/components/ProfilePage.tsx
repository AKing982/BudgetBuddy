import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Grid,
    TextField,
    Button,
    Avatar,
    IconButton,
    Divider,
    Switch,
    FormControlLabel,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Tabs,
    Tab,
    alpha,
    Stack,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Backdrop,
    useTheme
} from '@mui/material';
import {
    Edit as EditIcon,
    PhotoCamera as PhotoCameraIcon,
    Lock as LockIcon,
    AccountBalance as BankIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Security as SecurityIcon,
    Link as LinkIcon,
    Settings as SettingsIcon,
    ViewList as ViewListIcon,
    Save as SaveIcon,
    Schedule as ScheduleIcon,
    CheckCircle,
    Warning
} from '@mui/icons-material';
import Sidebar from './Sidebar';
import TransactionRuleService, { TransactionRule } from '../services/TransactionRuleService';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

interface ConnectedAccount {
    id: number;
    name: string;
    type: string;
    lastSync: string;
    status: 'connected' | 'disconnected';
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
};

const maroonColor = '#800000';
const tealColor = '#0d9488';

const ProfilePage: React.FC = () => {
    const theme = useTheme();
    const [tabValue, setTabValue] = useState(0);
    const userId = Number(sessionStorage.getItem('userId'));

    // Profile info
    const [profileData, setProfileData] = useState({
        username: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        avatar: null as string | null
    });

    // Password change
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Settings
    const [settings, setSettings] = useState({
        manualCsvUpload: false,
        autoCategorizationEnabled: false,
        autoCategorizationSchedule: 1, // in hours
        enabledFeatures: {
            budgets: true,
            dashboard: true,
            groceryTracker: true,
            budgetPlanner: false,
            transactions: true,
            budgetOptimizer: false
        }
    });

    // Connected accounts
    const [accounts, setAccounts] = useState<ConnectedAccount[]>([
        { id: 1, name: 'Chase Checking', type: 'Bank', lastSync: '2 hours ago', status: 'connected' },
        { id: 2, name: 'Wells Fargo Savings', type: 'Bank', lastSync: '1 day ago', status: 'connected' },
        { id: 3, name: 'Capital One Credit Card', type: 'Credit', lastSync: 'Never', status: 'disconnected' }
    ]);

    // Transaction rules
    const [rules, setRules] = useState<TransactionRule[]>([]);
    const [isLoadingRules, setIsLoadingRules] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Rule dialog
    const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<TransactionRule | null>(null);
    const [newRule, setNewRule] = useState<Partial<TransactionRule>>({
        categoryName: '',
        descriptionRule: '',
        merchantRule: '',
        extendedDescriptionRule: '',
        amountMin: undefined,
        amountMax: undefined,
        priority: 1,
        isActive: true
    });

    // Success/error alerts
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const transactionRuleService = TransactionRuleService.getInstance();

    // Load transaction rules on component mount
    useEffect(() => {
        if (userId) {
            loadTransactionRules();
        }
    }, [userId]);

    const loadTransactionRules = async () => {
        try {
            setIsLoadingRules(true);
            const fetchedRules = await transactionRuleService.getTransactionRulesByUser(userId);
            setRules(fetchedRules);
        } catch (error) {
            console.error('Error loading transaction rules:', error);
            setAlert({ type: 'error', message: 'Failed to load transaction rules' });
        } finally {
            setIsLoadingRules(false);
        }
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileData({ ...profileData, avatar: reader.result as string });
                setAlert({ type: 'success', message: 'Avatar updated successfully!' });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileSave = () => {
        setAlert({ type: 'success', message: 'Profile updated successfully!' });
    };

    const handlePasswordChange = () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setAlert({ type: 'error', message: 'Passwords do not match!' });
            return;
        }
        if (passwordData.newPassword.length < 8) {
            setAlert({ type: 'error', message: 'Password must be at least 8 characters!' });
            return;
        }
        setAlert({ type: 'success', message: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    const handleReconnectAccount = (accountId: number) => {
        setAccounts(accounts.map(acc =>
            acc.id === accountId ? { ...acc, status: 'connected', lastSync: 'Just now' } : acc
        ));
        setAlert({ type: 'success', message: 'Account reconnected successfully!' });
    };

    const handleDisconnectAccount = (accountId: number) => {
        setAccounts(accounts.map(acc =>
            acc.id === accountId ? { ...acc, status: 'disconnected' } : acc
        ));
        setAlert({ type: 'success', message: 'Account disconnected!' });
    };

    const handleFeatureToggle = (feature: keyof typeof settings.enabledFeatures) => {
        setSettings({
            ...settings,
            enabledFeatures: {
                ...settings.enabledFeatures,
                [feature]: !settings.enabledFeatures[feature]
            }
        });
    };

    const handleOpenRuleDialog = (rule?: TransactionRule) => {
        if (rule) {
            setEditingRule(rule);
            setNewRule({
                categoryName: rule.categoryName || '',
                descriptionRule: rule.descriptionRule || '',
                merchantRule: rule.merchantRule || '',
                extendedDescriptionRule: rule.extendedDescriptionRule || '',
                amountMin: rule.amountMin,
                amountMax: rule.amountMax,
                priority: rule.priority || 1,
                isActive: rule.isActive !== undefined ? rule.isActive : true
            });
        } else {
            setEditingRule(null);
            setNewRule({
                categoryName: '',
                descriptionRule: '',
                merchantRule: '',
                extendedDescriptionRule: '',
                amountMin: undefined,
                amountMax: undefined,
                priority: 1,
                isActive: true
            });
        }
        setRuleDialogOpen(true);
    };

    const handleSaveRule = async () => {
        if (!newRule.categoryName) {
            setAlert({ type: 'error', message: 'Category is required!' });
            return;
        }

        if (!newRule.descriptionRule && !newRule.merchantRule && !newRule.extendedDescriptionRule && !newRule.amountMin && !newRule.amountMax) {
            setAlert({ type: 'error', message: 'At least one rule condition is required!' });
            return;
        }

        try {
            setIsProcessing(true);

            if (editingRule && editingRule.id) {
                // Update existing rule
                const updatedRule: TransactionRule = {
                    ...editingRule,
                    ...newRule,
                    userId: userId,
                    matchCount: editingRule.matchCount
                };

                await transactionRuleService.updateTransactionRule(userId, editingRule.id, updatedRule);
                setAlert({ type: 'success', message: 'Rule updated successfully!' });
            } else {
                // Create new rule
                const ruleToAdd: TransactionRule = {
                    userId: userId,
                    categoryName: newRule.categoryName,
                    descriptionRule: newRule.descriptionRule,
                    merchantRule: newRule.merchantRule,
                    extendedDescriptionRule: newRule.extendedDescriptionRule,
                    amountMin: newRule.amountMin,
                    amountMax: newRule.amountMax,
                    priority: newRule.priority || 1,
                    isActive: newRule.isActive !== undefined ? newRule.isActive : true,
                    matchCount: 0
                };

                await transactionRuleService.addTransactionRule(userId, ruleToAdd);
                setAlert({ type: 'success', message: 'Rule created successfully!' });
            }

            // Reload rules
            await loadTransactionRules();
            setRuleDialogOpen(false);
        } catch (error) {
            console.error('Error saving rule:', error);
            setAlert({ type: 'error', message: 'Failed to save rule. Please try again.' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteRule = async (ruleId: number) => {
        if (!window.confirm('Are you sure you want to delete this rule?')) {
            return;
        }

        try {
            setIsProcessing(true);
            await transactionRuleService.deleteTransactionRule(userId, ruleId);
            setAlert({ type: 'success', message: 'Rule deleted successfully!' });
            await loadTransactionRules();
        } catch (error) {
            console.error('Error deleting rule:', error);
            setAlert({ type: 'error', message: 'Failed to delete rule. Please try again.' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleToggleRule = async (ruleId: number, currentState: boolean) => {
        try {
            await transactionRuleService.updateTransactionRuleActiveState(userId, ruleId, !currentState);
            setRules(rules.map(r => r.id === ruleId ? { ...r, isActive: !currentState } : r));
            setAlert({ type: 'success', message: `Rule ${!currentState ? 'enabled' : 'disabled'} successfully!` });
        } catch (error) {
            console.error('Error toggling rule:', error);
            setAlert({ type: 'error', message: 'Failed to update rule status. Please try again.' });
        }
    };

    const scheduleOptions = [
        { value: 1, label: 'Every 1 hour' },
        { value: 2, label: 'Every 2 hours' },
        { value: 4, label: 'Every 4 hours' },
        { value: 6, label: 'Every 6 hours' },
        { value: 12, label: 'Every 12 hours' },
        { value: 24, label: 'Once daily' }
    ];

    // Helper function to get merchant name from rule
    const getMerchantName = (rule: TransactionRule): string => {
        if (rule.merchantRule) return rule.merchantRule;
        if (rule.descriptionRule) return rule.descriptionRule;
        if (rule.extendedDescriptionRule) return rule.extendedDescriptionRule;
        return 'N/A';
    };

    // Helper function to generate condition display
    const getRuleCondition = (rule: TransactionRule): string => {
        const conditions: string[] = [];

        if (rule.descriptionRule) conditions.push(`Description contains "${rule.descriptionRule}"`);
        if (rule.merchantRule) conditions.push(`Merchant contains "${rule.merchantRule}"`);
        if (rule.extendedDescriptionRule) conditions.push(`Extended contains "${rule.extendedDescriptionRule}"`);
        if (rule.amountMin !== undefined) conditions.push(`Amount ≥ $${rule.amountMin}`);
        if (rule.amountMax !== undefined) conditions.push(`Amount ≤ $${rule.amountMax}`);

        return conditions.join(' AND ') || 'No conditions';
    };

    // Feature labels mapping
    const featureLabels = {
        budgets: 'Budgets',
        dashboard: 'Dashboard',
        groceryTracker: 'Grocery Tracker',
        budgetPlanner: 'Budget Planner',
        transactions: 'Transactions',
        budgetOptimizer: 'Budget Optimizer'
    };

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Grid container>
                {/* Sidebar */}
                <Grid item xs={12} md={3} lg={2}>
                    <Sidebar />
                </Grid>

                {/* Main Content */}
                <Grid item xs={12} md={9} lg={10}>
                    <Box component="main" sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                        {/* Header */}
                        <Box sx={{ mb: 4 }}>
                            <Typography
                                variant="h4"
                                component="h1"
                                sx={{
                                    fontWeight: 800,
                                    color: theme.palette.text.primary,
                                    letterSpacing: '-0.025em'
                                }}
                            >
                                Profile Settings
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#64748b' }}>
                                Manage your account settings and preferences
                            </Typography>
                        </Box>

                        {/* Alert */}
                        {alert && (
                            <Alert
                                severity={alert.type}
                                sx={{
                                    mb: 3,
                                    borderRadius: 3,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                }}
                                onClose={() => setAlert(null)}
                            >
                                {alert.message}
                            </Alert>
                        )}

                        {/* Profile Information Card */}
                        <Paper sx={{
                            boxShadow: 3,
                            borderRadius: 4,
                            overflow: 'hidden',
                            transition: 'box-shadow 0.3s ease-in-out',
                            '&:hover': {
                                boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
                            },
                            mb: 3
                        }}>
                            <Box
                                sx={{
                                    p: 3,
                                    background: `linear-gradient(135deg, ${maroonColor} 0%, #a00000 100%)`,
                                    color: 'white'
                                }}
                            >
                                <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <EditIcon />
                                    Profile Information
                                </Typography>
                            </Box>

                            <CardContent sx={{ p: 4 }}>
                                <Grid container spacing={4}>
                                    {/* Avatar Section */}
                                    <Grid item xs={12}>
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 3,
                                            p: 3,
                                            borderRadius: 3,
                                            bgcolor: alpha(maroonColor, 0.05),
                                            border: `1px solid ${alpha(maroonColor, 0.1)}`
                                        }}>
                                            <Avatar
                                                src={profileData.avatar || undefined}
                                                sx={{
                                                    width: 100,
                                                    height: 100,
                                                    bgcolor: maroonColor,
                                                    fontSize: '2.5rem',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                                }}
                                            >
                                                {profileData.firstName[0]}{profileData.lastName[0]}
                                            </Avatar>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                                                    {profileData.firstName} {profileData.lastName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    Profile Photo - JPG, PNG or GIF (Max 5MB)
                                                </Typography>
                                                <input
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    id="avatar-upload"
                                                    type="file"
                                                    onChange={handleAvatarChange}
                                                />
                                                <label htmlFor="avatar-upload">
                                                    <Button
                                                        variant="outlined"
                                                        component="span"
                                                        size="medium"
                                                        startIcon={<PhotoCameraIcon />}
                                                        sx={{
                                                            borderRadius: 2,
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            borderColor: alpha(theme.palette.divider, 0.8),
                                                            color: theme.palette.text.primary,
                                                            '&:hover': {
                                                                borderColor: theme.palette.primary.main,
                                                                backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                                            }
                                                        }}
                                                    >
                                                        Change Photo
                                                    </Button>
                                                </label>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Divider />
                                    </Grid>

                                    {/* Basic Information */}
                                    <Grid item xs={12}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: maroonColor, mb: 2 }}>
                                            Basic Information
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="First Name"
                                            value={profileData.firstName}
                                            onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 3
                                                }
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Last Name"
                                            value={profileData.lastName}
                                            onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 3
                                                }
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Username"
                                            value={profileData.username}
                                            onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 3
                                                }
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Email"
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 3
                                                }
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 2 }} />
                                    </Grid>

                                    {/* Password Section */}
                                    <Grid item xs={12}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: maroonColor, mb: 2 }}>
                                            Change Password
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            type="password"
                                            label="Current Password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 3
                                                }
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            type="password"
                                            label="New Password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            helperText="At least 8 characters"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 3
                                                }
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            type="password"
                                            label="Confirm New Password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 3
                                                }
                                            }}
                                        />
                                    </Grid>

                                    {/* Action Buttons */}
                                    <Grid item xs={12}>
                                        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                                            <Button
                                                variant="outlined"
                                                startIcon={<SaveIcon />}
                                                onClick={handleProfileSave}
                                                sx={{
                                                    borderRadius: 2,
                                                    textTransform: 'none',
                                                    px: 4,
                                                    fontWeight: 600,
                                                    borderColor: alpha(theme.palette.divider, 0.8),
                                                    color: theme.palette.text.primary,
                                                    '&:hover': {
                                                        borderColor: theme.palette.primary.main,
                                                        backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                                    }
                                                }}
                                            >
                                                Save Profile Changes
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                startIcon={<LockIcon />}
                                                onClick={handlePasswordChange}
                                                disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                                                sx={{
                                                    borderRadius: 2,
                                                    textTransform: 'none',
                                                    px: 4,
                                                    fontWeight: 600,
                                                    borderColor: alpha(theme.palette.divider, 0.8),
                                                    color: theme.palette.text.primary,
                                                    '&:hover': {
                                                        borderColor: theme.palette.primary.main,
                                                        backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                                    }
                                                }}
                                            >
                                                Update Password
                                            </Button>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Paper>

                        {/* Tabs Card */}
                        <Paper sx={{
                            boxShadow: 3,
                            borderRadius: 4,
                            overflow: 'hidden',
                            transition: 'box-shadow 0.3s ease-in-out',
                            '&:hover': {
                                boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
                            }
                        }}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc' }}>
                                <Tabs
                                    value={tabValue}
                                    onChange={handleTabChange}
                                    sx={{
                                        px: 2,
                                        '& .MuiTab-root': {
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            fontSize: '0.95rem',
                                            minHeight: 64
                                        }
                                    }}
                                >
                                    <Tab icon={<LinkIcon />} label="Connected Accounts" iconPosition="start" />
                                    <Tab icon={<SettingsIcon />} label="Preferences" iconPosition="start" />
                                    <Tab icon={<ViewListIcon />} label="Transaction Rules" iconPosition="start" />
                                    <Tab icon={<SecurityIcon />} label="Security & Privacy" iconPosition="start" />
                                </Tabs>
                            </Box>

                            {/* Connected Accounts Tab */}
                            <TabPanel value={tabValue} index={0}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                        <Box>
                                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                                                Connected Accounts
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Manage your linked bank accounts and financial institutions
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="outlined"
                                            startIcon={<AddIcon />}
                                            sx={{
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                borderColor: alpha(theme.palette.divider, 0.8),
                                                color: theme.palette.text.primary,
                                                '&:hover': {
                                                    borderColor: theme.palette.primary.main,
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                                }
                                            }}
                                        >
                                            Add Account
                                        </Button>
                                    </Box>

                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: alpha(tealColor, 0.05) }}>
                                                    <TableCell sx={{ fontWeight: 700, color: maroonColor, fontSize: '0.95rem' }}>
                                                        Account
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 700, color: maroonColor, fontSize: '0.95rem' }}>
                                                        Type
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 700, color: maroonColor, fontSize: '0.95rem' }}>
                                                        Last Sync
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 700, color: maroonColor, fontSize: '0.95rem' }}>
                                                        Status
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 700, color: maroonColor, fontSize: '0.95rem' }}>
                                                        Actions
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {accounts.map((account) => (
                                                    <TableRow
                                                        key={account.id}
                                                        sx={{
                                                            '&:hover': {
                                                                bgcolor: 'rgba(128, 0, 0, 0.04)',
                                                                cursor: 'pointer'
                                                            },
                                                            borderLeft: `4px solid ${account.status === 'connected' ? '#10b981' : '#ef4444'}`,
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                <Avatar
                                                                    sx={{
                                                                        bgcolor: alpha(tealColor, 0.1),
                                                                        color: tealColor,
                                                                        width: 40,
                                                                        height: 40
                                                                    }}
                                                                >
                                                                    <BankIcon />
                                                                </Avatar>
                                                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                                                    {account.name}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {account.type}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {account.lastSync}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={account.status === 'connected' ? 'Connected' : 'Disconnected'}
                                                                icon={account.status === 'connected' ? <CheckCircle sx={{ fontSize: 16 }} /> : <Warning sx={{ fontSize: 16 }} />}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: account.status === 'connected' ? '#d1fae5' : '#fee2e2',
                                                                    color: account.status === 'connected' ? '#065f46' : '#991b1b',
                                                                    fontWeight: 600
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {account.status === 'disconnected' ? (
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    onClick={() => handleReconnectAccount(account.id)}
                                                                    sx={{
                                                                        borderRadius: 2,
                                                                        textTransform: 'none',
                                                                        fontWeight: 600,
                                                                        borderColor: alpha(theme.palette.divider, 0.8),
                                                                        color: theme.palette.text.primary,
                                                                        '&:hover': {
                                                                            borderColor: theme.palette.primary.main,
                                                                            backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                                                        }
                                                                    }}
                                                                >
                                                                    Reconnect
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    onClick={() => handleDisconnectAccount(account.id)}
                                                                    sx={{
                                                                        borderRadius: 2,
                                                                        textTransform: 'none',
                                                                        fontWeight: 600,
                                                                        borderColor: alpha(theme.palette.divider, 0.8),
                                                                        color: theme.palette.text.primary,
                                                                        '&:hover': {
                                                                            borderColor: theme.palette.primary.main,
                                                                            backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                                                        }
                                                                    }}
                                                                >
                                                                    Disconnect
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </TabPanel>

                            {/* Preferences Tab */}
                            <TabPanel value={tabValue} index={1}>
                                <CardContent sx={{ p: 4 }}>
                                    {/* Data Management */}
                                    <Box sx={{ mb: 4 }}>
                                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                                            Data Management
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                            Control how your financial data is managed
                                        </Typography>
                                        <Paper
                                            sx={{
                                                p: 3,
                                                bgcolor: alpha(tealColor, 0.05),
                                                border: `1px solid ${alpha(tealColor, 0.2)}`,
                                                borderRadius: 3
                                            }}
                                        >
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={settings.manualCsvUpload}
                                                        onChange={(e) => setSettings({ ...settings, manualCsvUpload: e.target.checked })}
                                                        sx={{
                                                            '& .Mui-checked': { color: tealColor },
                                                            '& .Mui-checked + .MuiSwitch-track': { backgroundColor: tealColor }
                                                        }}
                                                    />
                                                }
                                                label={
                                                    <Box>
                                                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                                            Enable Manual CSV Upload
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Allow uploading transaction CSV files manually
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </Paper>
                                    </Box>

                                    <Divider sx={{ my: 4 }} />

                                    {/* Feature Selection */}
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                                            Sidebar Features
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                            Choose which features to display in your sidebar navigation
                                        </Typography>

                                        <Grid container spacing={2}>
                                            {Object.entries(settings.enabledFeatures).map(([key, value]) => (
                                                <Grid item xs={12} sm={6} key={key}>
                                                    <Paper
                                                        sx={{
                                                            p: 2.5,
                                                            border: `2px solid ${value ? alpha(tealColor, 0.3) : '#e2e8f0'}`,
                                                            borderRadius: 3,
                                                            bgcolor: value ? alpha(tealColor, 0.05) : 'transparent',
                                                            transition: 'all 0.2s',
                                                            '&:hover': {
                                                                borderColor: tealColor,
                                                                bgcolor: alpha(tealColor, 0.05)
                                                            }
                                                        }}
                                                    >
                                                        <FormControlLabel
                                                            control={
                                                                <Switch
                                                                    checked={value}
                                                                    onChange={() => handleFeatureToggle(key as keyof typeof settings.enabledFeatures)}
                                                                    sx={{
                                                                        '& .Mui-checked': { color: tealColor },
                                                                        '& .Mui-checked + .MuiSwitch-track': { backgroundColor: tealColor }
                                                                    }}
                                                                />
                                                            }
                                                            label={
                                                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                                                    {featureLabels[key as keyof typeof featureLabels]}
                                                                </Typography>
                                                            }
                                                        />
                                                    </Paper>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>
                                </CardContent>
                            </TabPanel>

                            {/* Transaction Rules Tab */}
                            <TabPanel value={tabValue} index={2}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                        <Box>
                                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5, textAlign: 'center' }}>
                                                Transaction Rules
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Automate transaction categorization with custom rules
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="outlined"
                                            startIcon={<AddIcon />}
                                            onClick={() => handleOpenRuleDialog()}
                                            disabled={isProcessing}
                                            sx={{
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                borderColor: alpha(theme.palette.divider, 0.8),
                                                color: theme.palette.text.primary,
                                                '&:hover': {
                                                    borderColor: theme.palette.primary.main,
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                                }
                                            }}
                                        >
                                            Add Rule
                                        </Button>
                                    </Box>

                                    {/* Auto-Categorization Schedule */}
                                    <Paper
                                        sx={{
                                            p: 3,
                                            mb: 3,
                                            bgcolor: alpha('#3b82f6', 0.05),
                                            border: `2px solid ${alpha('#3b82f6', 0.2)}`,
                                            borderRadius: 3
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                            <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.2), color: '#3b82f6' }}>
                                                <ScheduleIcon />
                                            </Avatar>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                                    Auto-Categorization Schedule
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Automatically apply your rules at regular intervals
                                                </Typography>
                                            </Box>
                                            <Switch
                                                checked={settings.autoCategorizationEnabled}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    autoCategorizationEnabled: e.target.checked
                                                })}
                                                sx={{
                                                    '& .Mui-checked': { color: '#3b82f6' },
                                                    '& .Mui-checked + .MuiSwitch-track': { backgroundColor: '#3b82f6' }
                                                }}
                                            />
                                        </Box>

                                        {settings.autoCategorizationEnabled && (
                                            <Box sx={{ mt: 2 }}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Schedule Interval</InputLabel>
                                                    <Select
                                                        value={settings.autoCategorizationSchedule}
                                                        label="Schedule Interval"
                                                        onChange={(e) => setSettings({
                                                            ...settings,
                                                            autoCategorizationSchedule: e.target.value as number
                                                        })}
                                                        sx={{
                                                            borderRadius: 3,
                                                            '& .MuiOutlinedInput-notchedOutline': {
                                                                borderColor: alpha('#3b82f6', 0.3)
                                                            }
                                                        }}
                                                    >
                                                        {scheduleOptions.map((option) => (
                                                            <MenuItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#64748b' }}>
                                                    Rules will be applied every {scheduleOptions.find(o => o.value === settings.autoCategorizationSchedule)?.label.toLowerCase()}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Paper>

                                    {/* Loading State */}
                                    {isLoadingRules ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                                            <CircularProgress sx={{ color: tealColor }} />
                                        </Box>
                                    ) : (
                                        <TableContainer sx={{ maxHeight: 500, overflow: 'auto' }}>
                                            <Table stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{
                                                            fontWeight: 700,
                                                            color: maroonColor,
                                                            fontSize: '0.95rem',
                                                            bgcolor: '#ffffff',
                                                            borderBottom: `2px solid ${alpha(tealColor, 0.2)}`,
                                                            zIndex: 10
                                                        }}>
                                                            Merchant
                                                        </TableCell>
                                                        <TableCell sx={{
                                                            fontWeight: 700,
                                                            color: maroonColor,
                                                            fontSize: '0.95rem',
                                                            bgcolor: '#ffffff',
                                                            borderBottom: `2px solid ${alpha(tealColor, 0.2)}`,
                                                            zIndex: 10
                                                        }}>
                                                            Conditions
                                                        </TableCell>
                                                        <TableCell sx={{
                                                            fontWeight: 700,
                                                            color: maroonColor,
                                                            fontSize: '0.95rem',
                                                            bgcolor: '#ffffff',
                                                            borderBottom: `2px solid ${alpha(tealColor, 0.2)}`,
                                                            zIndex: 10
                                                        }}>
                                                            Category
                                                        </TableCell>
                                                        <TableCell align="center" sx={{
                                                            fontWeight: 700,
                                                            color: maroonColor,
                                                            fontSize: '0.95rem',
                                                            bgcolor: '#ffffff',
                                                            borderBottom: `2px solid ${alpha(tealColor, 0.2)}`,
                                                            zIndex: 10
                                                        }}>
                                                            Priority
                                                        </TableCell>
                                                        <TableCell align="center" sx={{
                                                            fontWeight: 700,
                                                            color: maroonColor,
                                                            fontSize: '0.95rem',
                                                            bgcolor: '#ffffff',
                                                            borderBottom: `2px solid ${alpha(tealColor, 0.2)}`,
                                                            zIndex: 10
                                                        }}>
                                                            Matches
                                                        </TableCell>
                                                        <TableCell sx={{
                                                            fontWeight: 700,
                                                            color: maroonColor,
                                                            fontSize: '0.95rem',
                                                            bgcolor: '#ffffff',
                                                            borderBottom: `2px solid ${alpha(tealColor, 0.2)}`,
                                                            zIndex: 10
                                                        }}>
                                                            Status
                                                        </TableCell>
                                                        <TableCell align="right" sx={{
                                                            fontWeight: 700,
                                                            color: maroonColor,
                                                            fontSize: '0.95rem',
                                                            bgcolor: '#ffffff',
                                                            borderBottom: `2px solid ${alpha(tealColor, 0.2)}`,
                                                            zIndex: 10
                                                        }}>
                                                            Actions
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {rules.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                                                <ViewListIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                                                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                                    No transaction rules yet
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Click "Add Rule" to create your first automation rule
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        rules.map((rule) => (
                                                            <TableRow
                                                                key={rule.id}
                                                                sx={{
                                                                    '&:hover': {
                                                                        bgcolor: 'rgba(128, 0, 0, 0.04)',
                                                                        cursor: 'pointer'
                                                                    },
                                                                    borderLeft: `4px solid ${rule.isActive ? '#10b981' : '#94a3b8'}`,
                                                                }}
                                                            >
                                                                <TableCell>
                                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                                                        {getMerchantName(rule)}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                                                        {getRuleCondition(rule)}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {rule.categoryName && (
                                                                        <Chip
                                                                            label={rule.categoryName}
                                                                            size="small"
                                                                            sx={{
                                                                                bgcolor: alpha(tealColor, 0.1),
                                                                                color: tealColor,
                                                                                fontWeight: 600
                                                                            }}
                                                                        />
                                                                    )}
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    <Chip
                                                                        label={rule.priority || 1}
                                                                        size="small"
                                                                        sx={{
                                                                            bgcolor: alpha('#f59e0b', 0.1),
                                                                            color: '#f59e0b',
                                                                            fontWeight: 600,
                                                                            minWidth: 40
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    <Chip
                                                                        label={rule.matchCount || 0}
                                                                        size="small"
                                                                        sx={{
                                                                            bgcolor: alpha('#3b82f6', 0.1),
                                                                            color: '#3b82f6',
                                                                            fontWeight: 600,
                                                                            minWidth: 40
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Switch
                                                                        size="small"
                                                                        checked={rule.isActive || false}
                                                                        onChange={() => rule.id && handleToggleRule(rule.id, rule.isActive || false)}
                                                                        disabled={isProcessing}
                                                                        sx={{
                                                                            '& .Mui-checked': { color: tealColor },
                                                                            '& .Mui-checked + .MuiSwitch-track': { backgroundColor: tealColor }
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleOpenRuleDialog(rule)}
                                                                        disabled={isProcessing}
                                                                        sx={{
                                                                            color: tealColor,
                                                                            mr: 1,
                                                                            '&:hover': {
                                                                                bgcolor: alpha(tealColor, 0.1)
                                                                            }
                                                                        }}
                                                                    >
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => rule.id && handleDeleteRule(rule.id)}
                                                                        disabled={isProcessing}
                                                                        sx={{
                                                                            color: '#dc2626',
                                                                            '&:hover': {
                                                                                bgcolor: alpha('#dc2626', 0.1)
                                                                            }
                                                                        }}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                </CardContent>
                            </TabPanel>

                            {/* Security & Privacy Tab */}
                            <TabPanel value={tabValue} index={3}>
                                <CardContent sx={{ p: 4 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                                        Security & Privacy
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                                        Manage your account security settings
                                    </Typography>

                                    <Grid container spacing={3}>
                                        {/* Two-Factor Authentication */}
                                        <Grid item xs={12}>
                                            <Paper
                                                sx={{
                                                    p: 3,
                                                    border: `2px solid ${alpha(maroonColor, 0.2)}`,
                                                    borderRadius: 3,
                                                    bgcolor: alpha(maroonColor, 0.02)
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Avatar sx={{ bgcolor: alpha(maroonColor, 0.1), color: maroonColor }}>
                                                            <SecurityIcon />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                                                Two-Factor Authentication
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Add an extra layer of security to your account
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <Button
                                                        variant="outlined"
                                                        sx={{
                                                            borderRadius: 2,
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            borderColor: alpha(theme.palette.divider, 0.8),
                                                            color: theme.palette.text.primary,
                                                            '&:hover': {
                                                                borderColor: theme.palette.primary.main,
                                                                backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                                            }
                                                        }}
                                                    >
                                                        Enable 2FA
                                                    </Button>
                                                </Box>
                                            </Paper>
                                        </Grid>

                                        {/* Login History */}
                                        <Grid item xs={12}>
                                            <Paper
                                                sx={{
                                                    p: 3,
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: 3
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Box>
                                                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                                                            Login History
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            View your recent account activity
                                                        </Typography>
                                                    </Box>
                                                    <Button
                                                        variant="outlined"
                                                        sx={{
                                                            borderRadius: 2,
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            borderColor: alpha(theme.palette.divider, 0.8),
                                                            color: theme.palette.text.primary,
                                                            '&:hover': {
                                                                borderColor: theme.palette.primary.main,
                                                                backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                                            }
                                                        }}
                                                    >
                                                        View History
                                                    </Button>
                                                </Box>
                                            </Paper>
                                        </Grid>

                                        {/* Active Sessions */}
                                        <Grid item xs={12}>
                                            <Paper
                                                sx={{
                                                    p: 3,
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: 3
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Box>
                                                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                                                            Active Sessions
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Manage devices where you're currently logged in
                                                        </Typography>
                                                    </Box>
                                                    <Button
                                                        variant="outlined"
                                                        sx={{
                                                            borderRadius: 2,
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            borderColor: alpha(theme.palette.divider, 0.8),
                                                            color: theme.palette.text.primary,
                                                            '&:hover': {
                                                                borderColor: theme.palette.primary.main,
                                                                backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                                            }
                                                        }}
                                                    >
                                                        Manage Sessions
                                                    </Button>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </TabPanel>
                        </Paper>
                    </Box>
                </Grid>
            </Grid>

            {/* Loading Backdrop */}
            <Backdrop
                sx={{
                    color: '#fff',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)'
                }}
                open={isProcessing}
            >
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress color="inherit" size={60} />
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Processing...
                    </Typography>
                </Box>
            </Backdrop>

            {/* Rule Dialog */}
            <Dialog
                open={ruleDialogOpen}
                onClose={() => !isProcessing && setRuleDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                    }
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {editingRule ? 'Edit Transaction Rule' : 'Create Transaction Rule'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Define conditions to automatically categorize transactions
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        {/* Category - Required */}
                        <TextField
                            fullWidth
                            label="Category *"
                            value={newRule.categoryName || ''}
                            onChange={(e) => setNewRule({ ...newRule, categoryName: e.target.value })}
                            placeholder="e.g., Groceries, Dining, Transportation"
                            helperText="Required - The category to assign when this rule matches"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3
                                }
                            }}
                        />

                        <Divider>
                            <Chip label="Rule Conditions" size="small" sx={{ bgcolor: alpha(tealColor, 0.1), color: tealColor }} />
                        </Divider>

                        {/* Description Rule */}
                        <TextField
                            fullWidth
                            label="Description Contains"
                            value={newRule.descriptionRule || ''}
                            onChange={(e) => setNewRule({ ...newRule, descriptionRule: e.target.value })}
                            placeholder='e.g., "WALMART" or "GROCERY"'
                            helperText="Match transactions where description contains this text"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3
                                }
                            }}
                        />

                        {/* Merchant Rule */}
                        <TextField
                            fullWidth
                            label="Merchant Contains"
                            value={newRule.merchantRule || ''}
                            onChange={(e) => setNewRule({ ...newRule, merchantRule: e.target.value })}
                            placeholder='e.g., "Whole Foods" or "Target"'
                            helperText="Match transactions where merchant name contains this text"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3
                                }
                            }}
                        />

                        {/* Extended Description Rule */}
                        <TextField
                            fullWidth
                            label="Extended Description Contains"
                            value={newRule.extendedDescriptionRule || ''}
                            onChange={(e) => setNewRule({ ...newRule, extendedDescriptionRule: e.target.value })}
                            placeholder="e.g., Additional descriptive text"
                            helperText="Match transactions where extended description contains this text"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3
                                }
                            }}
                        />

                        {/* Amount Range */}
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Minimum Amount"
                                    value={newRule.amountMin || ''}
                                    onChange={(e) => setNewRule({ ...newRule, amountMin: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    placeholder="0.00"
                                    helperText="Minimum transaction amount"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>$</Typography>
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Maximum Amount"
                                    value={newRule.amountMax || ''}
                                    onChange={(e) => setNewRule({ ...newRule, amountMax: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    placeholder="999.99"
                                    helperText="Maximum transaction amount"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>$</Typography>
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3
                                        }
                                    }}
                                />
                            </Grid>
                        </Grid>

                        {/* Priority */}
                        <TextField
                            fullWidth
                            type="number"
                            label="Priority"
                            value={newRule.priority || 1}
                            onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 1 })}
                            helperText="Higher priority rules are applied first (1 = highest priority)"
                            InputProps={{
                                inputProps: { min: 1 }
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3
                                }
                            }}
                        />

                        {/* Active Status */}
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={newRule.isActive !== undefined ? newRule.isActive : true}
                                    onChange={(e) => setNewRule({ ...newRule, isActive: e.target.checked })}
                                    sx={{
                                        '& .Mui-checked': { color: tealColor },
                                        '& .Mui-checked + .MuiSwitch-track': { backgroundColor: tealColor }
                                    }}
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        Active
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Enable this rule to start categorizing transactions
                                    </Typography>
                                </Box>
                            }
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button
                        onClick={() => setRuleDialogOpen(false)}
                        disabled={isProcessing}
                        variant="outlined"
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            px: 3,
                            fontWeight: 600,
                            borderColor: alpha(theme.palette.divider, 0.8),
                            color: theme.palette.text.primary,
                            '&:hover': {
                                borderColor: theme.palette.primary.main,
                                backgroundColor: alpha(theme.palette.primary.main, 0.05)
                            }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={handleSaveRule}
                        disabled={!newRule.categoryName || isProcessing}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            px: 3,
                            fontWeight: 600,
                            borderColor: alpha(theme.palette.divider, 0.8),
                            color: theme.palette.text.primary,
                            '&:hover': {
                                borderColor: theme.palette.primary.main,
                                backgroundColor: alpha(theme.palette.primary.main, 0.05)
                            }
                        }}
                    >
                        {isProcessing ? 'Saving...' : (editingRule ? 'Update Rule' : 'Create Rule')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProfilePage;