import React, { useCallback, useState, useRef } from 'react';
import {
    Box,
    Button,
    Dialog,
    Typography,
    Stack,
    TextField,
    Checkbox,
    InputAdornment,
    CircularProgress,
    Select,
    MenuItem,
    Alert,
    Divider,
} from '@mui/material';
import { Landmark, Calendar, TrendingUp, X } from 'lucide-react';
import PlaidLink, { PlaidLinkRef } from './PlaidLink';
import PlaidService, { PlaidAccount } from '../services/PlaidService';
import { InvestmentAccount, MAROON, MAROON_DARK, mapPlaidSubtypeToAccountType } from './InvestmentUtils';

interface AddAccountButtonProps {
    userId: number;
    onAccountsAdded: (accounts: InvestmentAccount[]) => void;
    existingPlaidAccountIds?: string[]; // used to filter out accounts already being tracked
    /**
     * Used to convert the "current contribution %" the user enters into a dollar
     * figure (percentage of monthly income), mirroring how Portfolio.contributionPercentage
     * is already applied in portfolioMonthlyDollarContribution. Optional — if omitted,
     * the dollar figure is left at 0 and only the percentage is stored.
     */
    monthlyIncome?: number;
}

// Local editable draft for each account returned from Plaid, before the user confirms.
// Deliberately narrow: once an account is selected via Plaid, the only inputs we ask
// for are goal-related info and the contribution % they're currently saving. Everything
// else (name, institution, balance, mask, subtype) comes straight from Plaid.
interface AccountDraft {
    plaidAccountId: string;
    name: string;
    institutionName: string;
    subtype: string;
    mask: string;
    balance: number;
    include: boolean;
    contributionPercentage: string;
    goalAmount: string;
    goalDate: string;
}

const plaidService = PlaidService.getInstance();

const fmtBalance = (n: number) => `$${n.toLocaleString()}`;

const AddAccountButton: React.FC<AddAccountButtonProps> = ({
                                                               userId,
                                                               onAccountsAdded,
                                                               existingPlaidAccountIds = [],
                                                               monthlyIncome,
                                                           }) => {
    const [linkToken, setLinkToken] = useState<string>('');
    const [institutionName, setInstitutionName] = useState<string>('Linked institution');
    const [status, setStatus] = useState<'idle' | 'requesting-token' | 'exchanging' | 'reviewing' | 'importing' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [drafts, setDrafts] = useState<AccountDraft[]>([]);
    const [manualOpen, setManualOpen] = useState(false);
    const plaidLinkRef = useRef<PlaidLinkRef>(null);

    const onSuccess = useCallback(async (publicToken: string, metadata: any) => {
        try {
            setStatus('exchanging');
            setInstitutionName(metadata?.institution?.name ?? 'Linked institution');

            // 1. Exchange the public token server-side for an access token + item id
            const exchangeResult = await plaidService.exchangePublicToken(publicToken, userId);

            // 2. Persist the link (existing app behavior)
            await plaidService.savePlaidLinkToDatabase(
                exchangeResult.accessToken,
                exchangeResult.itemID,
                exchangeResult.userID
            );

            // 3. Fetch this user's accounts back, filtered to investment-type only
            const investmentAccounts: PlaidAccount[] = await plaidService.fetchLinkedInvestmentAccounts(userId);
            const uniqueByAccountId = Array.from(new Map(investmentAccounts.map(a => [a.accountId, a])).values());
            const newOnes = uniqueByAccountId.filter(a => !existingPlaidAccountIds.includes(a.accountId));
            if (newOnes.length === 0) {
                setErrorMessage('No new investment accounts were found for that institution.');
                setStatus('error');
                return;
            }
            setDrafts(newOnes.map(a => ({
                plaidAccountId: a.accountId,
                name: a.name || a.officialName || 'Account',
                institutionName: metadata?.institution?.name ?? 'Linked institution',
                subtype: a.subtype,
                mask: a.mask,
                balance: a.balance,
                include: true,
                contributionPercentage: '',
                goalAmount: '',
                goalDate: '',
            })));
            setStatus('reviewing');
        } catch (err) {
            console.error('Error completing Plaid Link flow:', err);
            setErrorMessage('We linked your account but could not load its balances. Please try again.');
            setStatus('error');
        }
    }, [userId]);

    const onExit = useCallback((err: any, metadata: any) => {
        if (err) console.error('Plaid Link exited with error:', err, metadata);
        setLinkToken('');
        if (status !== 'reviewing' && status !== 'exchanging') setStatus('idle');
    }, [status]);

    // Fired by PlaidLink once usePlaidLink reports `ready` — this is our cue to
    // actually open the modal, since Link needs a mount + ready tick first.
    const handleLinkReady = useCallback(() => {
        plaidLinkRef.current?.open();
    }, []);

    // If the token goes stale mid-flow (e.g. user sat on an OAuth redirect too
    // long), fetch a fresh one and PlaidLink will re-open with it automatically.
    const handleTokenExpired = useCallback(async () => {
        try {
            const tokenResponse = await plaidService.createInvestmentLinkToken();
            setLinkToken(tokenResponse.linkToken);
        } catch (err) {
            console.error('Error refreshing expired link token:', err);
            setErrorMessage('Your session expired and we could not reconnect. Please try again.');
            setStatus('error');
        }
    }, []);

    const handleAddAccountClick = async () => {
        try {
            setErrorMessage('');
            setStatus('requesting-token');
            const tokenResponse = await plaidService.createInvestmentLinkToken();
            setLinkToken(tokenResponse.linkToken);
        } catch (err) {
            console.error('Error creating Plaid link token:', err);
            setErrorMessage('Could not connect to Plaid right now. You can add the account manually instead.');
            setStatus('error');
        }
    };

    const updateDraft = (plaidAccountId: string, patch: Partial<AccountDraft>) => {
        setDrafts(prev => prev.map(d => (d.plaidAccountId === plaidAccountId ? { ...d, ...patch } : d)));
    };

    const closeReview = () => {
        setStatus('idle');
        setDrafts([]);
        setLinkToken('');
    };

    const confirmAdd = async () => {
        const toAdd: InvestmentAccount[] = drafts
            .filter(d => d.include)
            .map((d, i) => {
                const contributionPercentage = d.contributionPercentage ? Number(d.contributionPercentage) : 0;
                // Mirrors Portfolio.contributionPercentage → portfolioMonthlyDollarContribution:
                // the % the user enters is a share of monthly income, not of the account balance.
                const monthlyContribution = monthlyIncome ? (contributionPercentage / 100) * monthlyIncome : 0;
                return {
                    id: Date.now() + i,
                    name: d.name,
                    institution: d.institutionName,
                    type: mapPlaidSubtypeToAccountType(d.subtype),
                    balance: d.balance,
                    monthlyContribution,
                    contributionPercentage,
                    floorThreshold: null,
                    goalAmount: d.goalAmount ? Number(d.goalAmount) : null,
                    goalDate: d.goalDate || null,
                    plaidAccountId: d.plaidAccountId,
                } as InvestmentAccount;
            });

        // Import holdings + transactions from Plaid into the DB now, once the user
        // has actually confirmed they want to track these accounts (not on link
        // success — they could still cancel out of the review dialog at that point).
        // InvestmentsPage only ever reads from the DB via its own useEffect, so this
        // import has to finish before onAccountsAdded fires and triggers that re-fetch.
        setStatus('importing');
        try {
            const now = new Date();
            const startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
            const endDate = now.toISOString().split('T')[0];
            await Promise.all([
                plaidService.importPlaidInvestmentTransactions(userId, startDate, endDate),
            ]);
        } catch (err) {
            // Non-fatal — the accounts themselves are still added; holdings/transactions
            // just won't be populated yet. InvestmentsPage's read-only fetch will simply
            // come back empty for them until a later successful import.
            console.error('Error importing Plaid investment holdings/transactions:', err);
        }

        onAccountsAdded(toAdd);
        closeReview();
    };

    const busy = status === 'requesting-token' || status === 'exchanging' || status === 'importing';
    const includedCount = drafts.filter(d => d.include).length;

    return (
        <>
            <Button
                variant="contained"
                startIcon={busy ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <Landmark size={16} />}
                onClick={handleAddAccountClick}
                disabled={busy}
                sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 2.5,
                    py: 1,
                    bgcolor: MAROON,
                    boxShadow: '0 2px 10px rgba(107,26,26,0.25)',
                    '&:hover': { bgcolor: MAROON_DARK, boxShadow: '0 4px 14px rgba(107,26,26,0.32)' },
                }}
            >
                {status === 'requesting-token' ? 'Connecting…' : status === 'exchanging' ? 'Loading accounts…' : 'Add account'}
            </Button>

            {/* Headless — renders no UI of its own (renderStatus=false); it just
                drives Plaid's hosted Link modal via the ref once linkToken is set. */}
            {linkToken && (
                <PlaidLink
                    ref={plaidLinkRef}
                    linkToken={linkToken}
                    onSuccess={onSuccess}
                    onExit={onExit}
                    onConnect={handleLinkReady}
                    onTokenExpired={handleTokenExpired}
                    renderStatus={false}
                />
            )}

            {status === 'error' && errorMessage && (
                <Alert
                    severity="warning"
                    sx={{ mt: 1.5, borderRadius: '10px', fontSize: '0.8rem' }}
                    action={
                        <Button
                            size="small"
                            onClick={() => { setManualOpen(true); setStatus('idle'); }}
                            sx={{ textTransform: 'none', fontWeight: 700, color: MAROON }}
                        >
                            Enter manually
                        </Button>
                    }
                >
                    {errorMessage}
                </Alert>
            )}

            {/* ── Review step: pick which linked accounts to start tracking ── */}
            <Dialog
                open={status === 'reviewing'}
                onClose={closeReview}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
            >
                {/* Header — same maroon gradient treatment as the Portfolios panel on
                    the Investments page, so this dialog reads as part of the same product. */}
                <Box
                    sx={{
                        background: 'linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)',
                        px: 3,
                        py: 2.5,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <Box sx={{ position: 'absolute', top: -18, right: -18, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <Box sx={{ width: 32, height: 32, borderRadius: '9px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <TrendingUp size={16} color="white" />
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#fff', letterSpacing: '-0.01em' }}>
                                    Accounts at {institutionName}
                                </Typography>
                                <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', mt: 0.2 }}>
                                    Choose which to track, then set a goal and current contribution
                                </Typography>
                            </Box>
                        </Box>
                        <Box
                            onClick={closeReview}
                            sx={{
                                cursor: 'pointer',
                                color: 'rgba(255,255,255,0.75)',
                                display: 'flex',
                                p: 0.5,
                                borderRadius: '6px',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' },
                            }}
                        >
                            <X size={18} />
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ p: 3 }}>
                    <Stack spacing={2} sx={{ maxHeight: 420, overflowY: 'auto', pr: 0.5 }}>
                        {drafts.map(d => (
                            <Box
                                key={d.plaidAccountId}
                                sx={{
                                    border: d.include ? `1.5px solid ${MAROON}` : '1.5px solid #ececec',
                                    borderRadius: '12px',
                                    p: 2,
                                    transition: 'border-color 0.15s',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                    <Checkbox
                                        checked={d.include}
                                        onChange={(e) => updateDraft(d.plaidAccountId, { include: e.target.checked })}
                                        sx={{ p: 0.5, mt: -0.5, color: MAROON, '&.Mui-checked': { color: MAROON } }}
                                    />
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                                            <Box>
                                                <Typography sx={{ fontWeight: 700, fontSize: '0.92rem' }}>{d.name}</Typography>
                                                <Typography sx={{ fontSize: '0.72rem', color: '#888', mt: 0.1 }}>
                                                    {mapPlaidSubtypeToAccountType(d.subtype)}{d.mask ? ` ···${d.mask}` : ''}
                                                </Typography>
                                            </Box>
                                            <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: MAROON }}>
                                                {fmtBalance(d.balance)}
                                            </Typography>
                                        </Box>

                                        {d.include && (
                                            <>
                                                <Divider sx={{ my: 1.5 }} />
                                                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                                                    <TextField
                                                        size="small"
                                                        label="Current contribution"
                                                        sx={{ width: 170, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: MAROON } }}
                                                        value={d.contributionPercentage}
                                                        onChange={(e) => updateDraft(d.plaidAccountId, { contributionPercentage: e.target.value })}
                                                        InputProps={{ endAdornment: <InputAdornment position="end">% / mo</InputAdornment> }}
                                                    />
                                                    <TextField
                                                        size="small"
                                                        label="Goal amount"
                                                        sx={{ width: 150, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: MAROON } }}
                                                        value={d.goalAmount}
                                                        onChange={(e) => updateDraft(d.plaidAccountId, { goalAmount: e.target.value })}
                                                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                                                    />
                                                    <TextField
                                                        size="small"
                                                        label="Target date"
                                                        type="date"
                                                        sx={{ width: 165, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: MAROON } }}
                                                        value={d.goalDate}
                                                        onChange={(e) => updateDraft(d.plaidAccountId, { goalDate: e.target.value })}
                                                        InputLabelProps={{ shrink: true }}
                                                        InputProps={{ startAdornment: <InputAdornment position="start"><Calendar size={13} /></InputAdornment> }}
                                                    />
                                                </Stack>
                                            </>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                    </Stack>

                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
                        <Button
                            variant="outlined"
                            onClick={closeReview}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#ddd', color: '#555' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={confirmAdd}
                            disabled={includedCount === 0 || status === 'importing'}
                            startIcon={status === 'importing' ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : undefined}
                            sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 2.5,
                                bgcolor: MAROON,
                                boxShadow: '0 2px 10px rgba(107,26,26,0.25)',
                                '&:hover': { bgcolor: MAROON_DARK },
                            }}
                        >
                            {status === 'importing'
                                ? 'Importing…'
                                : `Add ${includedCount || ''} account${includedCount === 1 ? '' : 's'}`}
                        </Button>
                    </Box>
                </Box>
            </Dialog>

            {/* ── Manual fallback — only surfaced if Plaid can't be reached ── */}
            <ManualAddAccountDialog
                open={manualOpen}
                onClose={() => setManualOpen(false)}
                onAdd={(account) => { onAccountsAdded([account]); setManualOpen(false); }}
            />
        </>
    );
};

// ── Manual entry — same fields as the review step, for the rare account Plaid can't reach ──
const ManualAddAccountDialog: React.FC<{ open: boolean; onClose: () => void; onAdd: (a: InvestmentAccount) => void }> = ({ open, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [institution, setInstitution] = useState('');
    const [type, setType] = useState<InvestmentAccount['type']>('brokerage');
    const [balance, setBalance] = useState('');
    const [contributionPercentage, setContributionPercentage] = useState('');
    const [goalAmount, setGoalAmount] = useState('');
    const [goalDate, setGoalDate] = useState('');

    const focusRing = { '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: MAROON } };

    const submit = () => {
        onAdd({
            id: Date.now(),
            name: name || 'Untitled account',
            institution: institution || 'Manual entry',
            type,
            balance: balance ? Number(balance) : 0,
            monthlyContribution: 0,
            contributionPercentage: contributionPercentage ? Number(contributionPercentage) : 0,
            floorThreshold: null,
            goalAmount: goalAmount ? Number(goalAmount) : null,
            goalDate: goalDate || null,
            plaidAccountId: null,
        } as InvestmentAccount);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
            <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2, letterSpacing: '-0.01em' }}>Add an account manually</Typography>
                <Stack spacing={2}>
                    <TextField label="Account name" size="small" fullWidth sx={focusRing} value={name} onChange={e => setName(e.target.value)} />
                    <TextField label="Institution" size="small" fullWidth sx={focusRing} value={institution} onChange={e => setInstitution(e.target.value)} />
                    <Select size="small" value={type} onChange={e => setType(e.target.value as InvestmentAccount['type'])} fullWidth sx={focusRing}>
                        <MenuItem value="401k">401(k)</MenuItem>
                        <MenuItem value="ira">IRA</MenuItem>
                        <MenuItem value="brokerage">Brokerage</MenuItem>
                        <MenuItem value="savings">Savings goal</MenuItem>
                        <MenuItem value="emergency">Emergency fund</MenuItem>
                    </Select>
                    <TextField label="Current balance" size="small" fullWidth sx={focusRing} value={balance} onChange={e => setBalance(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                    <TextField label="Current contribution" size="small" fullWidth sx={focusRing} value={contributionPercentage} onChange={e => setContributionPercentage(e.target.value)} InputProps={{ endAdornment: <InputAdornment position="end">% / mo</InputAdornment> }} />
                    <TextField label="Goal amount (optional)" size="small" fullWidth sx={focusRing} value={goalAmount} onChange={e => setGoalAmount(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                    <TextField label="Target date (optional)" type="date" size="small" fullWidth sx={focusRing} value={goalDate} onChange={e => setGoalDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Stack>
                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
                    <Button variant="outlined" onClick={onClose} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#ddd', color: '#555' }}>Cancel</Button>
                    <Button variant="contained" onClick={submit} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK } }}>
                        Add account
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
};

export default AddAccountButton;

// import React, { useCallback, useState, useRef } from 'react';
// import {
//     Box,
//     Button,
//     Dialog,
//     Typography,
//     Stack,
//     TextField,
//     Checkbox,
//     InputAdornment,
//     CircularProgress,
//     Select,
//     MenuItem,
//     Alert,
//     Divider,
// } from '@mui/material';
// import { Landmark, Calendar, TrendingUp, X } from 'lucide-react';
// import PlaidLink, { PlaidLinkRef } from './PlaidLink';
// import PlaidService, { PlaidAccount } from '../services/PlaidService';
// import { InvestmentAccount, MAROON, MAROON_DARK, mapPlaidSubtypeToAccountType } from './InvestmentUtils';
//
// interface AddAccountButtonProps {
//     userId: number;
//     onAccountsAdded: (accounts: InvestmentAccount[]) => void;
//     existingPlaidAccountIds?: string[]; // used to filter out accounts already being tracked
//     /**
//      * Used to convert the "current contribution %" the user enters into a dollar
//      * figure (percentage of monthly income), mirroring how Portfolio.contributionPercentage
//      * is already applied in portfolioMonthlyDollarContribution. Optional — if omitted,
//      * the dollar figure is left at 0 and only the percentage is stored.
//      */
//     monthlyIncome?: number;
// }
//
// // Local editable draft for each account returned from Plaid, before the user confirms.
// // Deliberately narrow: once an account is selected via Plaid, the only inputs we ask
// // for are goal-related info and the contribution % they're currently saving. Everything
// // else (name, institution, balance, mask, subtype) comes straight from Plaid.
// interface AccountDraft {
//     plaidAccountId: string;
//     name: string;
//     institutionName: string;
//     subtype: string;
//     mask: string;
//     balance: number;
//     include: boolean;
//     contributionPercentage: string;
//     goalAmount: string;
//     goalDate: string;
// }
//
// const plaidService = PlaidService.getInstance();
//
// const fmtBalance = (n: number) => `$${n.toLocaleString()}`;
//
// const AddAccountButton: React.FC<AddAccountButtonProps> = ({
//                                                                userId,
//                                                                onAccountsAdded,
//                                                                existingPlaidAccountIds = [],
//                                                                monthlyIncome,
//                                                            }) => {
//     const [linkToken, setLinkToken] = useState<string>('');
//     const [institutionName, setInstitutionName] = useState<string>('Linked institution');
//     const [status, setStatus] = useState<'idle' | 'requesting-token' | 'exchanging' | 'reviewing' | 'error'>('idle');
//     const [errorMessage, setErrorMessage] = useState<string>('');
//     const [drafts, setDrafts] = useState<AccountDraft[]>([]);
//     const [manualOpen, setManualOpen] = useState(false);
//     const plaidLinkRef = useRef<PlaidLinkRef>(null);
//
//     const onSuccess = useCallback(async (publicToken: string, metadata: any) => {
//         try {
//             setStatus('exchanging');
//             setInstitutionName(metadata?.institution?.name ?? 'Linked institution');
//
//             // 1. Exchange the public token server-side for an access token + item id
//             const exchangeResult = await plaidService.exchangePublicToken(publicToken, userId);
//
//             // 2. Persist the link (existing app behavior)
//             await plaidService.savePlaidLinkToDatabase(
//                 exchangeResult.accessToken,
//                 exchangeResult.itemID,
//                 exchangeResult.userID
//             );
//
//             // 3. Fetch this user's accounts back, filtered to investment-type only
//             const investmentAccounts: PlaidAccount[] = await plaidService.fetchLinkedInvestmentAccounts(userId);
//             const newOnes = investmentAccounts.filter(a => !existingPlaidAccountIds.includes(a.accountId));
//
//             if (newOnes.length === 0) {
//                 setErrorMessage('No new investment accounts were found for that institution.');
//                 setStatus('error');
//                 return;
//             }
//
//             setDrafts(newOnes.map(a => ({
//                 plaidAccountId: a.accountId,
//                 name: a.name || a.officialName || 'Account',
//                 institutionName: metadata?.institution?.name ?? 'Linked institution',
//                 subtype: a.subtype,
//                 mask: a.mask,
//                 balance: a.balance,
//                 include: true,
//                 contributionPercentage: '',
//                 goalAmount: '',
//                 goalDate: '',
//             })));
//             setStatus('reviewing');
//         } catch (err) {
//             console.error('Error completing Plaid Link flow:', err);
//             setErrorMessage('We linked your account but could not load its balances. Please try again.');
//             setStatus('error');
//         }
//     }, [userId, existingPlaidAccountIds]);
//
//     const onExit = useCallback((err: any, metadata: any) => {
//         if (err) console.error('Plaid Link exited with error:', err, metadata);
//         setLinkToken('');
//         if (status !== 'reviewing' && status !== 'exchanging') setStatus('idle');
//     }, [status]);
//
//     // Fired by PlaidLink once usePlaidLink reports `ready` — this is our cue to
//     // actually open the modal, since Link needs a mount + ready tick first.
//     const handleLinkReady = useCallback(() => {
//         plaidLinkRef.current?.open();
//     }, []);
//
//     // If the token goes stale mid-flow (e.g. user sat on an OAuth redirect too
//     // long), fetch a fresh one and PlaidLink will re-open with it automatically.
//     const handleTokenExpired = useCallback(async () => {
//         try {
//             const tokenResponse = await plaidService.createInvestmentLinkToken();
//             setLinkToken(tokenResponse.linkToken);
//         } catch (err) {
//             console.error('Error refreshing expired link token:', err);
//             setErrorMessage('Your session expired and we could not reconnect. Please try again.');
//             setStatus('error');
//         }
//     }, []);
//
//     const handleAddAccountClick = async () => {
//         try {
//             setErrorMessage('');
//             setStatus('requesting-token');
//             const tokenResponse = await plaidService.createInvestmentLinkToken();
//             setLinkToken(tokenResponse.linkToken);
//         } catch (err) {
//             console.error('Error creating Plaid link token:', err);
//             setErrorMessage('Could not connect to Plaid right now. You can add the account manually instead.');
//             setStatus('error');
//         }
//     };
//
//     const updateDraft = (plaidAccountId: string, patch: Partial<AccountDraft>) => {
//         setDrafts(prev => prev.map(d => (d.plaidAccountId === plaidAccountId ? { ...d, ...patch } : d)));
//     };
//
//     const closeReview = () => {
//         setStatus('idle');
//         setDrafts([]);
//         setLinkToken('');
//     };
//
//     const confirmAdd = () => {
//         const toAdd: InvestmentAccount[] = drafts
//             .filter(d => d.include)
//             .map((d, i) => {
//                 const contributionPercentage = d.contributionPercentage ? Number(d.contributionPercentage) : 0;
//                 // Mirrors Portfolio.contributionPercentage → portfolioMonthlyDollarContribution:
//                 // the % the user enters is a share of monthly income, not of the account balance.
//                 const monthlyContribution = monthlyIncome ? (contributionPercentage / 100) * monthlyIncome : 0;
//                 return {
//                     id: Date.now() + i,
//                     name: d.name,
//                     institution: d.institutionName,
//                     type: mapPlaidSubtypeToAccountType(d.subtype),
//                     balance: d.balance,
//                     monthlyContribution,
//                     contributionPercentage,
//                     floorThreshold: null,
//                     goalAmount: d.goalAmount ? Number(d.goalAmount) : null,
//                     goalDate: d.goalDate || null,
//                     plaidAccountId: d.plaidAccountId,
//                 } as InvestmentAccount;
//             });
//         onAccountsAdded(toAdd);
//         closeReview();
//     };
//
//     const busy = status === 'requesting-token' || status === 'exchanging';
//     const includedCount = drafts.filter(d => d.include).length;
//
//     return (
//         <>
//             <Button
//                 variant="contained"
//                 startIcon={busy ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <Landmark size={16} />}
//                 onClick={handleAddAccountClick}
//                 disabled={busy}
//                 sx={{
//                     borderRadius: '8px',
//                     textTransform: 'none',
//                     fontWeight: 700,
//                     px: 2.5,
//                     py: 1,
//                     bgcolor: MAROON,
//                     boxShadow: '0 2px 10px rgba(107,26,26,0.25)',
//                     '&:hover': { bgcolor: MAROON_DARK, boxShadow: '0 4px 14px rgba(107,26,26,0.32)' },
//                 }}
//             >
//                 {status === 'requesting-token' ? 'Connecting…' : status === 'exchanging' ? 'Loading accounts…' : 'Add account'}
//             </Button>
//
//             {/* Headless — renders no UI of its own (renderStatus=false); it just
//                 drives Plaid's hosted Link modal via the ref once linkToken is set. */}
//             {linkToken && (
//                 <PlaidLink
//                     ref={plaidLinkRef}
//                     linkToken={linkToken}
//                     onSuccess={onSuccess}
//                     onExit={onExit}
//                     onConnect={handleLinkReady}
//                     onTokenExpired={handleTokenExpired}
//                     renderStatus={false}
//                 />
//             )}
//
//             {status === 'error' && errorMessage && (
//                 <Alert
//                     severity="warning"
//                     sx={{ mt: 1.5, borderRadius: '10px', fontSize: '0.8rem' }}
//                     action={
//                         <Button
//                             size="small"
//                             onClick={() => { setManualOpen(true); setStatus('idle'); }}
//                             sx={{ textTransform: 'none', fontWeight: 700, color: MAROON }}
//                         >
//                             Enter manually
//                         </Button>
//                     }
//                 >
//                     {errorMessage}
//                 </Alert>
//             )}
//
//             {/* ── Review step: pick which linked accounts to start tracking ── */}
//             <Dialog
//                 open={status === 'reviewing'}
//                 onClose={closeReview}
//                 maxWidth="sm"
//                 fullWidth
//                 PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
//             >
//                 {/* Header — same maroon gradient treatment as the Portfolios panel on
//                     the Investments page, so this dialog reads as part of the same product. */}
//                 <Box
//                     sx={{
//                         background: 'linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)',
//                         px: 3,
//                         py: 2.5,
//                         position: 'relative',
//                         overflow: 'hidden',
//                     }}
//                 >
//                     <Box sx={{ position: 'absolute', top: -18, right: -18, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
//                     <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
//                             <Box sx={{ width: 32, height: 32, borderRadius: '9px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                                 <TrendingUp size={16} color="white" />
//                             </Box>
//                             <Box>
//                                 <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#fff', letterSpacing: '-0.01em' }}>
//                                     Accounts at {institutionName}
//                                 </Typography>
//                                 <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', mt: 0.2 }}>
//                                     Choose which to track, then set a goal and current contribution
//                                 </Typography>
//                             </Box>
//                         </Box>
//                         <Box
//                             onClick={closeReview}
//                             sx={{
//                                 cursor: 'pointer',
//                                 color: 'rgba(255,255,255,0.75)',
//                                 display: 'flex',
//                                 p: 0.5,
//                                 borderRadius: '6px',
//                                 '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' },
//                             }}
//                         >
//                             <X size={18} />
//                         </Box>
//                     </Box>
//                 </Box>
//
//                 <Box sx={{ p: 3 }}>
//                     <Stack spacing={2} sx={{ maxHeight: 420, overflowY: 'auto', pr: 0.5 }}>
//                         {drafts.map(d => (
//                             <Box
//                                 key={d.plaidAccountId}
//                                 sx={{
//                                     border: d.include ? `1.5px solid ${MAROON}` : '1.5px solid #ececec',
//                                     borderRadius: '12px',
//                                     p: 2,
//                                     transition: 'border-color 0.15s',
//                                 }}
//                             >
//                                 <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
//                                     <Checkbox
//                                         checked={d.include}
//                                         onChange={(e) => updateDraft(d.plaidAccountId, { include: e.target.checked })}
//                                         sx={{ p: 0.5, mt: -0.5, color: MAROON, '&.Mui-checked': { color: MAROON } }}
//                                     />
//                                     <Box sx={{ flex: 1 }}>
//                                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
//                                             <Box>
//                                                 <Typography sx={{ fontWeight: 700, fontSize: '0.92rem' }}>{d.name}</Typography>
//                                                 <Typography sx={{ fontSize: '0.72rem', color: '#888', mt: 0.1 }}>
//                                                     {mapPlaidSubtypeToAccountType(d.subtype)}{d.mask ? ` ···${d.mask}` : ''}
//                                                 </Typography>
//                                             </Box>
//                                             <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: MAROON }}>
//                                                 {fmtBalance(d.balance)}
//                                             </Typography>
//                                         </Box>
//
//                                         {d.include && (
//                                             <>
//                                                 <Divider sx={{ my: 1.5 }} />
//                                                 <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
//                                                     <TextField
//                                                         size="small"
//                                                         label="Current contribution"
//                                                         sx={{ width: 170, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: MAROON } }}
//                                                         value={d.contributionPercentage}
//                                                         onChange={(e) => updateDraft(d.plaidAccountId, { contributionPercentage: e.target.value })}
//                                                         InputProps={{ endAdornment: <InputAdornment position="end">% / mo</InputAdornment> }}
//                                                     />
//                                                     <TextField
//                                                         size="small"
//                                                         label="Goal amount"
//                                                         sx={{ width: 150, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: MAROON } }}
//                                                         value={d.goalAmount}
//                                                         onChange={(e) => updateDraft(d.plaidAccountId, { goalAmount: e.target.value })}
//                                                         InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
//                                                     />
//                                                     <TextField
//                                                         size="small"
//                                                         label="Target date"
//                                                         type="date"
//                                                         sx={{ width: 165, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: MAROON } }}
//                                                         value={d.goalDate}
//                                                         onChange={(e) => updateDraft(d.plaidAccountId, { goalDate: e.target.value })}
//                                                         InputLabelProps={{ shrink: true }}
//                                                         InputProps={{ startAdornment: <InputAdornment position="start"><Calendar size={13} /></InputAdornment> }}
//                                                     />
//                                                 </Stack>
//                                             </>
//                                         )}
//                                     </Box>
//                                 </Box>
//                             </Box>
//                         ))}
//                     </Stack>
//
//                     <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
//                         <Button
//                             variant="outlined"
//                             onClick={closeReview}
//                             sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#ddd', color: '#555' }}
//                         >
//                             Cancel
//                         </Button>
//                         <Button
//                             variant="contained"
//                             onClick={confirmAdd}
//                             disabled={includedCount === 0}
//                             sx={{
//                                 borderRadius: '8px',
//                                 textTransform: 'none',
//                                 fontWeight: 700,
//                                 px: 2.5,
//                                 bgcolor: MAROON,
//                                 boxShadow: '0 2px 10px rgba(107,26,26,0.25)',
//                                 '&:hover': { bgcolor: MAROON_DARK },
//                             }}
//                         >
//                             Add {includedCount || ''} account{includedCount === 1 ? '' : 's'}
//                         </Button>
//                     </Box>
//                 </Box>
//             </Dialog>
//
//             {/* ── Manual fallback — only surfaced if Plaid can't be reached ── */}
//             <ManualAddAccountDialog
//                 open={manualOpen}
//                 onClose={() => setManualOpen(false)}
//                 onAdd={(account) => { onAccountsAdded([account]); setManualOpen(false); }}
//             />
//         </>
//     );
// };
//
// // ── Manual entry — same fields as the review step, for the rare account Plaid can't reach ──
// const ManualAddAccountDialog: React.FC<{ open: boolean; onClose: () => void; onAdd: (a: InvestmentAccount) => void }> = ({ open, onClose, onAdd }) => {
//     const [name, setName] = useState('');
//     const [institution, setInstitution] = useState('');
//     const [type, setType] = useState<InvestmentAccount['type']>('brokerage');
//     const [balance, setBalance] = useState('');
//     const [contributionPercentage, setContributionPercentage] = useState('');
//     const [goalAmount, setGoalAmount] = useState('');
//     const [goalDate, setGoalDate] = useState('');
//
//     const focusRing = { '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: MAROON } };
//
//     const submit = () => {
//         onAdd({
//             id: Date.now(),
//             name: name || 'Untitled account',
//             institution: institution || 'Manual entry',
//             type,
//             balance: balance ? Number(balance) : 0,
//             monthlyContribution: 0,
//             contributionPercentage: contributionPercentage ? Number(contributionPercentage) : 0,
//             floorThreshold: null,
//             goalAmount: goalAmount ? Number(goalAmount) : null,
//             goalDate: goalDate || null,
//             plaidAccountId: null,
//         } as InvestmentAccount);
//     };
//
//     return (
//         <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
//             <Box sx={{ p: 3 }}>
//                 <Typography variant="h6" fontWeight={800} sx={{ mb: 2, letterSpacing: '-0.01em' }}>Add an account manually</Typography>
//                 <Stack spacing={2}>
//                     <TextField label="Account name" size="small" fullWidth sx={focusRing} value={name} onChange={e => setName(e.target.value)} />
//                     <TextField label="Institution" size="small" fullWidth sx={focusRing} value={institution} onChange={e => setInstitution(e.target.value)} />
//                     <Select size="small" value={type} onChange={e => setType(e.target.value as InvestmentAccount['type'])} fullWidth sx={focusRing}>
//                         <MenuItem value="401k">401(k)</MenuItem>
//                         <MenuItem value="ira">IRA</MenuItem>
//                         <MenuItem value="brokerage">Brokerage</MenuItem>
//                         <MenuItem value="savings">Savings goal</MenuItem>
//                         <MenuItem value="emergency">Emergency fund</MenuItem>
//                     </Select>
//                     <TextField label="Current balance" size="small" fullWidth sx={focusRing} value={balance} onChange={e => setBalance(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
//                     <TextField label="Current contribution" size="small" fullWidth sx={focusRing} value={contributionPercentage} onChange={e => setContributionPercentage(e.target.value)} InputProps={{ endAdornment: <InputAdornment position="end">% / mo</InputAdornment> }} />
//                     <TextField label="Goal amount (optional)" size="small" fullWidth sx={focusRing} value={goalAmount} onChange={e => setGoalAmount(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
//                     <TextField label="Target date (optional)" type="date" size="small" fullWidth sx={focusRing} value={goalDate} onChange={e => setGoalDate(e.target.value)} InputLabelProps={{ shrink: true }} />
//                 </Stack>
//                 <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
//                     <Button variant="outlined" onClick={onClose} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#ddd', color: '#555' }}>Cancel</Button>
//                     <Button variant="contained" onClick={submit} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK } }}>
//                         Add account
//                     </Button>
//                 </Box>
//             </Box>
//         </Dialog>
//     );
// };
//
// export default AddAccountButton;