import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { usePlaidLink } from 'react-plaid-link';
import PlaidService from '../services/PlaidService';

const plaidService = PlaidService.getInstance();

interface Props {
    userId: number;
    plaidLinkId: number;
    onReconnected: () => void;
}

const ReconnectPlaidButton: React.FC<Props> = ({ userId, plaidLinkId, onReconnected }) => {
    const [linkToken, setLinkToken] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const { open, ready } = usePlaidLink({
        token: linkToken,
        onSuccess: async () => {
            // Update mode: no public token exchange, the existing access token works again
            await plaidService.markPlaidLinkReconnected(userId, plaidLinkId);
            setLinkToken(null);
            setBusy(false);
            onReconnected();
        },
        onExit: () => {
            setLinkToken(null);
            setBusy(false);
        },
    });

    useEffect(() => {
        if (linkToken && ready) open();
    }, [linkToken, ready, open]);

    const start = async () => {
        setBusy(true);
        try {
            setLinkToken(await plaidService.createUpdateLinkToken(userId, plaidLinkId));
        } catch (e) {
            console.error('Could not start Plaid reconnect:', e);
            setBusy(false);
        }
    };

    return (
        <Button color="inherit" size="small" onClick={start} disabled={busy}
                sx={{ textTransform: 'none', fontWeight: 700 }}>
            Reconnect
        </Button>
    );
};

export default ReconnectPlaidButton;