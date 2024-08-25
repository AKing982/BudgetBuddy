import React from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Button,
    Paper
} from '@mui/material';
import {
    AccountBalance,
    CreditCard,
    MonetizationOn,
    Savings,
    ShowChart,
    Settings,
    Refresh,
    Add,
    Info
} from '@mui/icons-material';

interface Account {
    name: string;
    balance: string;
    icon: React.ReactNode;
    action: 'gear' | 'add';
    color?: string;
}

const accounts: Account[] = [
    { name: 'Checking', balance: '$168', icon: <AccountBalance />, action: 'gear', color: '#7C3AED' },
    { name: 'Credit Cards', balance: 'Add', icon: <CreditCard />, action: 'add', color: '#6B7280' },
    { name: 'Net Cash', balance: '$168', icon: <MonetizationOn />, action: 'gear', color: '#10B981' },
    { name: 'Savings', balance: '$918', icon: <Savings />, action: 'gear', color: '#7C3AED' },
    { name: 'Investments', balance: 'Add', icon: <ShowChart />, action: 'add', color: '#6B7280' },
];

const AccountSummary: React.FC = () => {
    return (
        <Paper elevation={3} sx={{
            maxWidth: 400,
            margin: 'auto',
            mt: 2,
            borderRadius: '12px',
            overflow: 'hidden'
        }}>
            <Box sx={{ p: 2, backgroundColor: '#F9FAFB' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#111827' }}>ACCOUNTS</Typography>
                    <Box display="flex" alignItems="center">
                        <Refresh fontSize="small" sx={{ color: '#6B7280', mr: 0.5 }} />
                        <Typography variant="body2" sx={{ color: '#6B7280', mr: 1 }}>2 hours ago</Typography>
                        <Button
                            size="small"
                            sx={{
                                color: '#DC2626',
                                textTransform: 'none',
                                fontWeight: 'bold',
                                '&:hover': { backgroundColor: 'transparent' }
                            }}
                        >
                            Sync now
                        </Button>
                    </Box>
                </Box>
                <List disablePadding>
                    {accounts.map((account, index) => (
                        <ListItem
                            key={index}
                            divider={index !== accounts.length - 1}
                            sx={{
                                py: 1.5,
                                '&:hover': { backgroundColor: '#F3F4F6' }
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                {React.cloneElement(account.icon as React.ReactElement, { sx: { color: account.color } })}
                            </ListItemIcon>
                            <ListItemText
                                primary={account.name}
                                primaryTypographyProps={{
                                    sx: { fontWeight: 'medium', color: '#111827' }
                                }}
                            />
                            <ListItemSecondaryAction>
                                {account.balance !== 'Add' ? (
                                    <Box display="flex" alignItems="center">
                                        <Typography
                                            variant="body1"
                                            component="span"
                                            sx={{
                                                mr: 1,
                                                fontWeight: 'bold',
                                                color: account.name === 'Net Cash' ? '#10B981' : '#111827'
                                            }}
                                        >
                                            {account.balance}
                                        </Typography>
                                        {account.action === 'gear' ? (
                                            <IconButton edge="end" aria-label="settings" size="small">
                                                <Settings sx={{ color: '#6B7280' }} />
                                            </IconButton>
                                        ) : (
                                            <IconButton edge="end" aria-label="add" size="small">
                                                <Add sx={{ color: '#DC2626' }} />
                                            </IconButton>
                                        )}
                                        {account.name === 'Net Cash' && (
                                            <IconButton edge="end" aria-label="info" size="small" sx={{ ml: 0.5 }}>
                                                <Info sx={{ color: '#6B7280' }} />
                                            </IconButton>
                                        )}
                                    </Box>
                                ) : (
                                    <Button
                                        startIcon={<Add />}
                                        sx={{
                                            color: '#DC2626',
                                            fontWeight: 'bold',
                                            '&:hover': { backgroundColor: 'transparent' }
                                        }}
                                    >
                                        Add
                                    </Button>
                                )}
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Paper>
    );
};

export default AccountSummary;