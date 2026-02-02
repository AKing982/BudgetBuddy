import React, { useState } from 'react';
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
    TableRow
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
    ViewList as ViewListIcon
} from '@mui/icons-material';
import Sidebar from './Sidebar';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

interface TransactionRule {
    id: number;
    name: string;
    condition: string;
    action: string;
    category?: string;
    enabled: boolean;
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
    const [tabValue, setTabValue] = useState(0);

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
        enabledFeatures: {
            budgets: true,
            analytics: true,
            groceryTracker: true,
            billTracker: false,
            investments: false
        }
    });

    // Connected accounts
    const [accounts, setAccounts] = useState<ConnectedAccount[]>([
        { id: 1, name: 'Chase Checking', type: 'Bank', lastSync: '2 hours ago', status: 'connected' },
        { id: 2, name: 'Wells Fargo Savings', type: 'Bank', lastSync: '1 day ago', status: 'connected' },
        { id: 3, name: 'Capital One Credit Card', type: 'Credit', lastSync: 'Never', status: 'disconnected' }
    ]);

    // Transaction rules
    const [rules, setRules] = useState<TransactionRule[]>([
        { id: 1, name: 'Groceries Auto-categorize', condition: 'Contains "Whole Foods"', action: 'Set category', category: 'Groceries', enabled: true },
        { id: 2, name: 'Rent Payment', condition: 'Amount equals $1500', action: 'Set category', category: 'Rent', enabled: true },
        { id: 3, name: 'Amazon Purchases', condition: 'Contains "AMAZON"', action: 'Set category', category: 'Shopping', enabled: false }
    ]);

    // Rule dialog
    const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<TransactionRule | null>(null);
    const [newRule, setNewRule] = useState({
        name: '',
        condition: '',
        action: 'Set category',
        category: '',
        enabled: true
    });

    // Success/error alerts
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
                name: rule.name,
                condition: rule.condition,
                action: rule.action,
                category: rule.category || '',
                enabled: rule.enabled
            });
        } else {
            setEditingRule(null);
            setNewRule({
                name: '',
                condition: '',
                action: 'Set category',
                category: '',
                enabled: true
            });
        }
        setRuleDialogOpen(true);
    };

    const handleSaveRule = () => {
        if (editingRule) {
            setRules(rules.map(r => r.id === editingRule.id ? { ...editingRule, ...newRule } : r));
            setAlert({ type: 'success', message: 'Rule updated successfully!' });
        } else {
            const newRuleObj: TransactionRule = {
                id: rules.length + 1,
                ...newRule
            };
            setRules([...rules, newRuleObj]);
            setAlert({ type: 'success', message: 'Rule created successfully!' });
        }
        setRuleDialogOpen(false);
    };

    const handleDeleteRule = (ruleId: number) => {
        setRules(rules.filter(r => r.id !== ruleId));
        setAlert({ type: 'success', message: 'Rule deleted!' });
    };

    const handleToggleRule = (ruleId: number) => {
        setRules(rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
    };

    return (
        <Box sx={{
            ml: '240px',
            minHeight: '100vh',
            background: '#f9fafc',
            backgroundImage: 'radial-gradient(rgba(0, 0, 120, 0.01) 2px, transparent 2px)',
            backgroundSize: '40px 40px'
        }}>
            <Sidebar />

            <Box sx={{ py: 4, px: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
                        Profile Settings
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage your account settings and preferences
                    </Typography>
                </Box>

                {/* Alert */}
                {alert && (
                    <Alert
                        severity={alert.type}
                        sx={{ mb: 3 }}
                        onClose={() => setAlert(null)}
                    >
                        {alert.message}
                    </Alert>
                )}

                {/* Profile Information Card */}
                <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                            Profile Information
                        </Typography>

                        <Grid container spacing={3}>
                            {/* Avatar Section */}
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Avatar
                                        src={profileData.avatar || undefined}
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            bgcolor: maroonColor,
                                            fontSize: '2rem'
                                        }}
                                    >
                                        {profileData.firstName[0]}{profileData.lastName[0]}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            Profile Photo
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
                                                size="small"
                                                startIcon={<PhotoCameraIcon />}
                                                sx={{ textTransform: 'none' }}
                                            >
                                                Change Photo
                                            </Button>
                                        </label>
                                    </Box>
                                </Box>
                            </Grid>

                            {/* Username */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Username"
                                    value={profileData.username}
                                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                                />
                            </Grid>

                            {/* Email */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    type="email"
                                    value={profileData.email}
                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                />
                            </Grid>

                            {/* First Name */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    value={profileData.firstName}
                                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                                />
                            </Grid>

                            {/* Last Name */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    value={profileData.lastName}
                                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                                />
                            </Grid>

                            {/* Save Button */}
                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    onClick={handleProfileSave}
                                    sx={{
                                        background: `linear-gradient(135deg, ${tealColor} 0%, #14b8a6 100%)`,
                                        '&:hover': {
                                            background: `linear-gradient(135deg, #0f766e 0%, ${tealColor} 100%)`
                                        }
                                    }}
                                >
                                    Save Changes
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Tabs Card */}
                <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={tabValue} onChange={handleTabChange}>
                            <Tab icon={<SecurityIcon />} label="Security" iconPosition="start" />
                            <Tab icon={<LinkIcon />} label="Connected Accounts" iconPosition="start" />
                            <Tab icon={<SettingsIcon />} label="Preferences" iconPosition="start" />
                            <Tab icon={<ViewListIcon />} label="Transaction Rules" iconPosition="start" />
                        </Tabs>
                    </Box>

                    {/* Security Tab */}
                    <TabPanel value={tabValue} index={0}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                                Change Password
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        type="password"
                                        label="Current Password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
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
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="password"
                                        label="Confirm New Password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        variant="contained"
                                        startIcon={<LockIcon />}
                                        onClick={handlePasswordChange}
                                        disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                                        sx={{
                                            background: `linear-gradient(135deg, ${maroonColor} 0%, #a00000 100%)`,
                                            '&:hover': {
                                                background: `linear-gradient(135deg, #600000 0%, ${maroonColor} 100%)`
                                            }
                                        }}
                                    >
                                        Update Password
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </TabPanel>

                    {/* Connected Accounts Tab */}
                    <TabPanel value={tabValue} index={1}>
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" fontWeight={600}>
                                    Connected Accounts
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    sx={{
                                        background: `linear-gradient(135deg, ${tealColor} 0%, #14b8a6 100%)`,
                                        textTransform: 'none'
                                    }}
                                >
                                    Add Account
                                </Button>
                            </Box>

                            <Stack spacing={2}>
                                {accounts.map((account) => (
                                    <Paper key={account.id} sx={{ p: 2.5 }} variant="outlined">
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <BankIcon sx={{ fontSize: 40, color: tealColor }} />
                                                <Box>
                                                    <Typography variant="body1" fontWeight={600}>
                                                        {account.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {account.type} • Last sync: {account.lastSync}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                <Chip
                                                    label={account.status === 'connected' ? 'Connected' : 'Disconnected'}
                                                    color={account.status === 'connected' ? 'success' : 'error'}
                                                    size="small"
                                                />
                                                {account.status === 'disconnected' ? (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => handleReconnectAccount(account.id)}
                                                        sx={{ textTransform: 'none' }}
                                                    >
                                                        Reconnect
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="error"
                                                        onClick={() => handleDisconnectAccount(account.id)}
                                                        sx={{ textTransform: 'none' }}
                                                    >
                                                        Disconnect
                                                    </Button>
                                                )}
                                            </Box>
                                        </Box>
                                    </Paper>
                                ))}
                            </Stack>
                        </CardContent>
                    </TabPanel>

                    {/* Preferences Tab */}
                    <TabPanel value={tabValue} index={2}>
                        <CardContent sx={{ p: 4 }}>
                            {/* CSV Upload */}
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                    Data Management
                                </Typography>
                                <Paper sx={{ p: 2.5, bgcolor: alpha(tealColor, 0.05) }} variant="outlined">
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
                                                <Typography variant="body1" fontWeight={500}>
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

                            {/* Feature Selection */}
                            <Box>
                                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                    Sidebar Features
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Choose which features to display in your sidebar
                                </Typography>

                                <Stack spacing={2}>
                                    <Paper sx={{ p: 2.5 }} variant="outlined">
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={settings.enabledFeatures.budgets}
                                                    onChange={() => handleFeatureToggle('budgets')}
                                                    sx={{
                                                        '& .Mui-checked': { color: tealColor },
                                                        '& .Mui-checked + .MuiSwitch-track': { backgroundColor: tealColor }
                                                    }}
                                                />
                                            }
                                            label="Budgets"
                                        />
                                    </Paper>
                                    <Paper sx={{ p: 2.5 }} variant="outlined">
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={settings.enabledFeatures.analytics}
                                                    onChange={() => handleFeatureToggle('analytics')}
                                                    sx={{
                                                        '& .Mui-checked': { color: tealColor },
                                                        '& .Mui-checked + .MuiSwitch-track': { backgroundColor: tealColor }
                                                    }}
                                                />
                                            }
                                            label="Analytics"
                                        />
                                    </Paper>
                                    <Paper sx={{ p: 2.5 }} variant="outlined">
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={settings.enabledFeatures.groceryTracker}
                                                    onChange={() => handleFeatureToggle('groceryTracker')}
                                                    sx={{
                                                        '& .Mui-checked': { color: tealColor },
                                                        '& .Mui-checked + .MuiSwitch-track': { backgroundColor: tealColor }
                                                    }}
                                                />
                                            }
                                            label="Grocery Tracker"
                                        />
                                    </Paper>
                                    <Paper sx={{ p: 2.5 }} variant="outlined">
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={settings.enabledFeatures.billTracker}
                                                    onChange={() => handleFeatureToggle('billTracker')}
                                                    sx={{
                                                        '& .Mui-checked': { color: tealColor },
                                                        '& .Mui-checked + .MuiSwitch-track': { backgroundColor: tealColor }
                                                    }}
                                                />
                                            }
                                            label="Bill Tracker"
                                        />
                                    </Paper>
                                    <Paper sx={{ p: 2.5 }} variant="outlined">
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={settings.enabledFeatures.investments}
                                                    onChange={() => handleFeatureToggle('investments')}
                                                    sx={{
                                                        '& .Mui-checked': { color: tealColor },
                                                        '& .Mui-checked + .MuiSwitch-track': { backgroundColor: tealColor }
                                                    }}
                                                />
                                            }
                                            label="Investments"
                                        />
                                    </Paper>
                                </Stack>
                            </Box>
                        </CardContent>
                    </TabPanel>

                    {/* Transaction Rules Tab */}
                    <TabPanel value={tabValue} index={3}>
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" fontWeight={600}>
                                    Transaction Rules
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => handleOpenRuleDialog()}
                                    sx={{
                                        background: `linear-gradient(135deg, ${tealColor} 0%, #14b8a6 100%)`,
                                        textTransform: 'none'
                                    }}
                                >
                                    Add Rule
                                </Button>
                            </Box>

                            <TableContainer component={Paper} variant="outlined">
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: alpha(tealColor, 0.05) }}>
                                            <TableCell sx={{ fontWeight: 600 }}>Rule Name</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Condition</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {rules.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                                    <ViewListIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        No transaction rules yet. Click "Add Rule" to create one.
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            rules.map((rule) => (
                                                <TableRow key={rule.id} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {rule.name}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {rule.condition}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {rule.action}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {rule.category && (
                                                            <Chip
                                                                label={rule.category}
                                                                size="small"
                                                                sx={{ bgcolor: alpha(tealColor, 0.1), color: tealColor }}
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Switch
                                                            size="small"
                                                            checked={rule.enabled}
                                                            onChange={() => handleToggleRule(rule.id)}
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
                                                            sx={{ color: tealColor, mr: 1 }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteRule(rule.id)}
                                                            sx={{ color: '#dc2626' }}
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
                        </CardContent>
                    </TabPanel>
                </Card>
            </Box>

            {/* Rule Dialog */}
            <Dialog open={ruleDialogOpen} onClose={() => setRuleDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingRule ? 'Edit Transaction Rule' : 'Create Transaction Rule'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Rule Name"
                            value={newRule.name}
                            onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                            placeholder="e.g., Groceries Auto-categorize"
                        />
                        <TextField
                            fullWidth
                            label="Condition"
                            value={newRule.condition}
                            onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                            placeholder='e.g., Contains "Whole Foods"'
                            helperText="Describe when this rule should trigger"
                        />
                        <FormControl fullWidth>
                            <InputLabel>Action</InputLabel>
                            <Select
                                value={newRule.action}
                                label="Action"
                                onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                            >
                                <MenuItem value="Set category">Set category</MenuItem>
                                <MenuItem value="Add tag">Add tag</MenuItem>
                                <MenuItem value="Mark as reviewed">Mark as reviewed</MenuItem>
                            </Select>
                        </FormControl>
                        {newRule.action === 'Set category' && (
                            <TextField
                                fullWidth
                                label="Category"
                                value={newRule.category}
                                onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                                placeholder="e.g., Groceries"
                            />
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveRule}
                        disabled={!newRule.name || !newRule.condition}
                        sx={{
                            background: `linear-gradient(135deg, ${tealColor} 0%, #14b8a6 100%)`
                        }}
                    >
                        {editingRule ? 'Update' : 'Create'} Rule
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProfilePage;
