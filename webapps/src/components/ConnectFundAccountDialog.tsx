import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    List, ListItemButton, ListItemText, Radio, Typography, Box, CircularProgress,
} from '@mui/material';
import { Landmark, TrendingUp, Link2 } from 'lucide-react';
import { MAROON } from '../config/Constants';
import type { PlaidAccount } from '../services/PlaidService';

interface ConnectFundAccountDialogProps {
    open:              boolean;
    loading:           boolean;
    accounts:          PlaidAccount[];
    envelopeName:      string;
    onSelect:          (account: PlaidAccount) => void;
    onLinkNewAccount:  () => void;
    onClose:           () => void;
}

const ConnectFundAccountDialog: React.FC<ConnectFundAccountDialogProps> = ({
                                                                               open, loading, accounts, envelopeName, onSelect, onLinkNewAccount, onClose,
                                                                           }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Reset the selection each time the dialog is opened fresh, so a stale pick from a
    // previous envelope's connect flow can't carry over.
    React.useEffect(() => {
        if (open) setSelectedId(null);
    }, [open]);

    const hasAccounts = !loading && accounts.length > 0;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle sx={{ fontSize: '1rem', fontWeight: 600, color: '#111' }}>
                Connect an account to {envelopeName}
            </DialogTitle>

            <DialogContent dividers sx={{ minHeight: 120 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={28} sx={{ color: MAROON }} />
                    </Box>
                ) : accounts.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Typography sx={{ fontSize: '0.82rem', color: '#666', mb: 2 }}>
                            No eligible savings or investment accounts found yet.
                        </Typography>
                        <Button variant="contained" disableElevation startIcon={<Link2 size={14} />}
                                onClick={onLinkNewAccount}
                                sx={{ textTransform: 'none', fontWeight: 500, borderRadius: '8px', bgcolor: MAROON, '&:hover': { bgcolor: '#6a1c26' } }}>
                            Link a new account
                        </Button>
                    </Box>
                ) : (
                    <>
                        <List disablePadding>
                            {accounts.map(acct => (
                                <ListItemButton key={acct.accountId} selected={selectedId === acct.accountId}
                                                onClick={() => setSelectedId(acct.accountId)}
                                                sx={{
                                                    borderRadius: '8px', mb: 0.5, px: 1,
                                                    '&.Mui-selected': { bgcolor: '#fbf1f1', '&:hover': { bgcolor: '#fbf1f1' } },
                                                }}>
                                    <Radio checked={selectedId === acct.accountId} size="small"
                                           sx={{ mr: 0.5, color: '#ccc', '&.Mui-checked': { color: MAROON } }} />
                                    {acct.type === 'investment'
                                        ? <TrendingUp size={16} color="#7a4a4a" style={{ marginRight: 8, flexShrink: 0 }} />
                                        : <Landmark size={16} color="#7a4a4a" style={{ marginRight: 8, flexShrink: 0 }} />}
                                    <ListItemText
                                        primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }}
                                        secondaryTypographyProps={{ fontSize: '0.72rem' }}
                                        primary={`${acct.name}${acct.mask ? ` ···${acct.mask}` : ''}`}
                                        secondary={`${acct.subtype}${acct.balance != null ? ` · $${acct.balance.toLocaleString()}` : ''}`}
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                        <Button size="small" startIcon={<Link2 size={13} />} onClick={onLinkNewAccount}
                                sx={{ mt: 1, textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', color: MAROON }}>
                            Link a different account instead
                        </Button>
                    </>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} sx={{ textTransform: 'none', color: '#888' }}>Cancel</Button>
                {hasAccounts && (
                    <Button variant="contained" disableElevation disabled={!selectedId}
                            onClick={() => {
                                const account = accounts.find(a => a.accountId === selectedId);
                                if (account) onSelect(account);
                            }}
                            sx={{ textTransform: 'none', fontWeight: 500, borderRadius: '8px', bgcolor: MAROON, '&:hover': { bgcolor: '#6a1c26' } }}>
                        Connect
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ConnectFundAccountDialog;