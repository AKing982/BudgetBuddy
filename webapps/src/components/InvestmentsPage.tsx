import { format } from 'date-fns';
import {
    Box,
    Button,
    Grid,
    Typography,
    alpha,
    Container,
    Grow,
    Stack,
    LinearProgress,
    Alert,
} from '@mui/material';
import { Plus, Layers } from 'lucide-react';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import PortfolioDetailPanel from './PortfolioDetailPanel';
import PortfolioCard from './PortfolioCard';
import AddAccountButton from './AddAccountButton';
import NewPortfolioDialog from './NewPortfolioDialog';
import ContributionsPanel from './ContributionsPanel';
import MoneyFlowSummary from './MoneyFlowSummary';
import PlaidService from '../services/PlaidService';
import {
    MAROON,
    InvestmentAccount,
    Portfolio,
    Contribution,
    thresholdStatus,
    portfolioMonthlyDollarContribution,
    fmt, Loan,
} from './InvestmentUtils';

// ── Shape returned by GET /{userId}/investment-accounts — the user's real,
// persisted investment accounts. Only what AccountEntity actually exposes
// (user/plaidLink are @JsonIgnore'd to avoid the recursion + secret-leak
// issue flagged earlier — see conversation).
export interface AccountEntityDTO {
    id: string; // Plaid account_id
    accountName: string;
    officialName: string;
    type: string;
    subtype: string;
    mask: string;
    balance: number;
}

interface InvestmentTransactionEntityDTO {
    id: number;
    account: AccountEntityDTO;
    investmentTransactionId: string;
    name: string;
    price: number;
    quantity: number;
    date: string; // ISO date, e.g. "2026-09-05" — entity column is a String
    amount: number;
    type: string;
    subtype: string;
}

const plaidService = PlaidService.getInstance();

type Selection = number | null; // selected portfolio id, or null

// ── Component ──────────────────────────────────────────────────────────────
const InvestmentsPage: React.FC = () => {
    const [animateIn, setAnimateIn] = useState(false);
    const [accounts, setAccounts] = useState<InvestmentAccount[]>([]);
    // `portfolios` only ever holds manually-created, possibly multi-account
    // groupings from the "New portfolio" dialog. Single-account portfolios
    // driven straight off real holdings are derived on the fly below in
    // `displayPortfolios` — never seeded, never stored statically.
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [contributions, setContributions] = useState<Contribution[]>([]);
    const [selectedPortfolioId, setSelectedPortfolioId] = useState<Selection>(null);
    const [newPortfolioOpen, setNewPortfolioOpen] = useState(false);
    const [loadingPlaidData, setLoadingPlaidData] = useState(false);
    const [plaidLoadError, setPlaidLoadError] = useState<string | null>(null);
    const [hasLoadedRealData, setHasLoadedRealData] = useState(false);
    const userId = Number(sessionStorage.getItem('userId'));

    // Budget context — in the real app, pull this from BudgetRunnerService for the
    // currently selected month, same source BudgetPage.tsx already uses.
    const monthlyIncome = 6200;
    const monthlyFixedSpend = 3180;

    useEffect(() => { setTimeout(() => setAnimateIn(true), 100); }, []);

    // ── Read the user's real accounts + transactions back out of the DB. The
    // actual Plaid import (writing them into the DB in the first place) happens
    // exactly once, inside AddAccountButton's confirm step — this page never
    // calls Plaid directly, it only ever reads what's already persisted. ──
    const loadInvestmentDataFromDb = useCallback(async () => {
        if (!userId) return;
        setLoadingPlaidData(true);
        setPlaidLoadError(null);
        try {
            const now = new Date();
            const startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
            const endDate = now.toISOString().split('T')[0];

            // Safety net: AddAccountButton already imports holdings/transactions
            // right after linking, but that import can fail silently (its own
            // catch just logs and moves on — see conversation). Retry it here,
            // every time this page loads, before reading from the DB. Best-effort:
            // if this also fails, fall through to reading the DB anyway, since
            // there may still be data there from an earlier successful import.
            try {
                await plaidService.importPlaidInvestmentHoldings(userId);
                await plaidService.importPlaidInvestmentTransactions(userId, startDate, endDate);
            } catch (importErr) {
                console.error('Retry of Plaid investment import failed on page load:', importErr);
            }

            const [dbAccounts, transactions] = await Promise.all([
                plaidService.getInvestmentHoldings(userId),
                plaidService.getInvestmentTransactions(userId, startDate, endDate),
            ]);

            const mergedAccounts: InvestmentAccount[] = dbAccounts.map(acc => ({
                id: Date.now() + Math.floor(Math.random() * 100000),
                name: acc.accountName || acc.officialName || 'Investment account',
                institution: '',
                type: (acc.type as InvestmentAccount['type']) ?? 'brokerage',
                balance: acc.balance,
                monthlyContribution: 0,
                floorThreshold: null,
                goalAmount: null,
                goalDate: null,
                plaidAccountId: acc.id,
            } as InvestmentAccount));

            const accountIdByPlaidId = new Map<string, number>();
            mergedAccounts.forEach(a => { if (a.plaidAccountId) accountIdByPlaidId.set(a.plaidAccountId, a.id); });

            // "Total contributed" — only transactions whose subtype is literally
            // "contribution" count; everything else (sells, dividends, fees, etc.)
            // is ignored for this figure. Case-insensitive since we don't have a
            // confirmed exact casing for how the backend serializes the subtype.
            const contributedByAccountId = new Map<number, number>();
            const newContributions: Contribution[] = [];
            for (const txn of transactions) {
                const plaidAccountId = txn.account?.id;
                const matchedAccountId = plaidAccountId ? accountIdByPlaidId.get(plaidAccountId) : undefined;
                if (matchedAccountId === undefined) {
                    console.warn('Skipping investment transaction for unrecognized account:', plaidAccountId);
                    continue;
                }
                if (txn.subtype?.toLowerCase() === 'contribution') {
                    contributedByAccountId.set(matchedAccountId, (contributedByAccountId.get(matchedAccountId) ?? 0) + Math.abs(txn.amount ?? 0));
                }
                newContributions.push({
                    id: Date.now() + Math.floor(Math.random() * 100000),
                    accountId: matchedAccountId,
                    amount: txn.amount,
                    frequency: 'one-time',
                    date: txn.date,
                    name: txn.name,
                });
            }

            const accountsWithContributed = mergedAccounts.map(a => ({
                ...a,
                totalContributed: contributedByAccountId.get(a.id) ?? 0,
            } as InvestmentAccount));

            setAccounts(accountsWithContributed);
            setContributions(newContributions);
            setHasLoadedRealData(true);
        } catch (err) {
            console.error('Error loading investment data from the DB:', err);
            setPlaidLoadError('Could not load your latest investment data. Showing what we have so far.');
        } finally {
            setLoadingPlaidData(false);
        }
    }, [userId]);

    // Single fetch on mount — this page only ever reads from the DB.
    useEffect(() => {
        if (userId) {
            loadInvestmentDataFromDb();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const totalInvested = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts]);


    const updateAccountLoan = (accountId: number, loan: Loan | undefined) => {
        // TODO: persist via InvestmentAccountService.updateLoan(userId, accountId, loan)
        setAccounts(prev => prev.map(a => (a.id === accountId ? { ...a, loan } as InvestmentAccount : a)));
    };
    // Every real account becomes a single-account portfolio automatically,
    // driven entirely off live holdings data — no seeding, no static entries.
    // Accounts without goal info (not yet persisted server-side — see note in
    // loadInvestmentDataFromDb) still get a card, just with no target/progress
    // bar, rather than being silently excluded from Portfolios entirely.
    // A manually-created (possibly multi-account) portfolio from "New portfolio"
    // takes precedence for any account id it already covers.
    const displayPortfolios: Portfolio[] = useMemo(() => {
        const coveredAccountIds = new Set(portfolios.flatMap(p => p.accountIds));
        const autoPortfolios: Portfolio[] = accounts
            .filter(a => !coveredAccountIds.has(a.id))
            .map(a => ({
                id: -a.id, // negative range keeps these distinct from manually-created (Date.now()-based) ids
                name: a.name,
                goal: a.institution ? `${a.institution} · ${a.type}` : a.type,
                accountIds: [a.id],
                targetAmount: a.goalAmount ?? a.balance, // no goal set yet -> show as "fully funded" against its own balance rather than 0/0
                targetDate: a.goalDate ?? new Date().toISOString().split('T')[0],
                contributionPercentage: (a as any).contributionPercentage ?? 0,
            }));
        return [...portfolios, ...autoPortfolios];
    }, [accounts, portfolios]);

    const totalPortfolioMonthly = useMemo(
        () => displayPortfolios.reduce((s, p) => s + portfolioMonthlyDollarContribution(p, monthlyIncome), 0),
        [displayPortfolios, monthlyIncome]
    );
    const leftoverBudget = monthlyIncome - monthlyFixedSpend - totalPortfolioMonthly;

    const selectedPortfolio = displayPortfolios.find(p => p.id === selectedPortfolioId) ?? null;

    const handleAccountsAdded = () => {
        // TODO: persist via InvestmentAccountService.createAccounts(userId, newAccounts)
        // AddAccountButton already imported this user's holdings/transactions from
        // Plaid into the DB before calling this callback — we just re-read the DB.
        // NOTE: this is a full overwrite, not a merge — goalAmount/goalDate entered
        // in the Add Account dialog are NOT in the DB response and will be lost here.
        loadInvestmentDataFromDb();
    };

    const createPortfolio = (portfolio: Omit<Portfolio, 'id'>) => {
        // TODO: persist via PortfolioService.create(userId, portfolio)
        setPortfolios(prev => [{ ...portfolio, id: Date.now() }, ...prev]);
    };

    const updatePortfolio = (id: number, patch: Partial<Portfolio>) => {
        // TODO: persist via PortfolioService.update(userId, id, patch)
        setPortfolios(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
    };

    const addContribution = (c: Omit<Contribution, 'id'>) => {
        // TODO: persist via ContributionService.create(userId, c)
        setContributions(prev => [{ ...c, id: Date.now() }, ...prev]);
    };

    return (
        <Box sx={{ maxWidth: 'calc(100% - 240px)', ml: '240px', minHeight: '100vh', background: '#f0f2f5' }}>
            <Sidebar />

            <Container maxWidth="xl" sx={{ py: 4 }}>

                {/* ── Header ─────────────────────────────────────────────────── */}
                <Grow in={animateIn} timeout={400}>
                    <Box sx={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        mb: 4, flexDirection: { xs: 'column', sm: 'row' },
                        textAlign: { xs: 'center', sm: 'left' }, gap: 2,
                    }}>
                        <Box>
                            <Box sx={{ width: 28, height: 3, background: MAROON, borderRadius: '2px', mb: 0.75 }} />
                            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#111', letterSpacing: '-0.025em' }}>
                                Investments &amp; Savings
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: '#888', mt: 0.5 }}>
                                {hasLoadedRealData
                                    ? "Click a portfolio to see its details and where it's headed"
                                    : 'Connect an account to get started'}
                            </Typography>
                        </Box>

                        <AddAccountButton
                            userId={userId}
                            onAccountsAdded={handleAccountsAdded}
                            existingPlaidAccountIds={accounts.map(a => a.plaidAccountId).filter((id): id is string => Boolean(id))}
                            monthlyIncome={monthlyIncome}
                        />
                    </Box>
                </Grow>

                {loadingPlaidData && (
                    <Box sx={{ mb: 2.5 }}>
                        <LinearProgress sx={{ borderRadius: 3, height: 4, bgcolor: alpha(MAROON, 0.12), '& .MuiLinearProgress-bar': { bgcolor: MAROON } }} />
                        <Typography sx={{ fontSize: '0.72rem', color: '#888', mt: 0.75 }}>Syncing holdings and transactions from Plaid…</Typography>
                    </Box>
                )}

                {plaidLoadError && (
                    <Alert severity="warning" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '0.8rem' }} onClose={() => setPlaidLoadError(null)}>
                        {plaidLoadError}
                    </Alert>
                )}

                {/* ── Summary strip ──────────────────────────────────────────── */}
                <Grow in={animateIn} timeout={600}>
                    <Grid container spacing={2.5} sx={{ mb: 4 }}>
                        {[
                            { label: 'Total invested + saved', value: fmt(totalInvested), sub: `${accounts.length} accounts` },
                            { label: 'Going to portfolios / mo', value: fmt(totalPortfolioMonthly), sub: `${displayPortfolios.length} portfolios` },
                            { label: 'Left over after that', value: fmt(leftoverBudget), sub: leftoverBudget >= 0 ? 'unallocated' : 'over budget' },
                            { label: 'Accounts near their floor', value: String(accounts.filter(a => !thresholdStatus(a.balance, a.floorThreshold).ok).length), sub: 'need attention' },
                        ].map((c, i) => (
                            <Grid item xs={12} sm={6} md={3} key={i}>
                                <Box sx={{
                                    background: '#f0f4ff', borderRadius: '10px', borderTop: `3px solid ${MAROON}`,
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.10)', p: 2.5, height: '100%',
                                    transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' },
                                }}>
                                    <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5a5a7a', fontWeight: 700, mb: 1 }}>
                                        {c.label}
                                    </Typography>
                                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e1e2e', fontVariantNumeric: 'tabular-nums', lineHeight: 1, mb: 1 }}>
                                        {c.value}
                                    </Typography>
                                    <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: alpha(MAROON, 0.08), color: MAROON, fontSize: '0.65rem', fontWeight: 700 }}>
                                        {c.sub}
                                    </Box>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Grow>

                <MoneyFlowSummary
                    monthlyIncome={monthlyIncome}
                    monthlyFixedSpend={monthlyFixedSpend}
                    portfolios={displayPortfolios}
                    accounts={accounts}
                />

                <Grid container spacing={3}>
                    <Grid item xs={12} lg={8}>
                        <Stack spacing={3}>

                            {/* ── Portfolios ─────────────────────────────────── */}
                            <Grow in={animateIn} timeout={800}>
                                <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}` }}>
                                    <Box sx={{ background: `linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)`, px: 3, py: 2, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative' }}>
                                            <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Layers size={15} color="white" />
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>Portfolios</Typography>
                                                <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>Target amount, target date, and contribution % — single or multi-account</Typography>
                                            </Box>
                                        </Box>
                                        <Button
                                            size="small" startIcon={<Plus size={13} />} onClick={() => setNewPortfolioOpen(true)}
                                            sx={{ color: '#fff', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }, position: 'relative', flexShrink: 0 }}
                                        >
                                            New portfolio
                                        </Button>
                                    </Box>
                                    <Box sx={{ bgcolor: '#fff', p: 3 }}>
                                        {displayPortfolios.length === 0 ? (
                                            <Typography sx={{ fontSize: '0.85rem', color: '#aaa', textAlign: 'center', py: 3 }}>
                                                No portfolios yet — connect an investment account, or group one or more accounts together with "New portfolio".
                                            </Typography>
                                        ) : (
                                            <Grid container spacing={2}>
                                                {displayPortfolios.map(p => (
                                                    <Grid item xs={12} sm={6} key={p.id}>
                                                        <PortfolioCard
                                                            portfolio={p}
                                                            accounts={accounts}
                                                            isSelected={selectedPortfolioId === p.id}
                                                            onClick={() => setSelectedPortfolioId(p.id)}
                                                        />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        )}
                                    </Box>
                                </Box>
                            </Grow>

                            {/* ── Contributions ──────────────────────────────── */}
                            <Grow in={animateIn} timeout={900}>
                                <Box>
                                    <ContributionsPanel
                                        contributions={contributions}
                                        accounts={accounts}
                                        portfolios={displayPortfolios}
                                        onAddContribution={addContribution}
                                    />
                                </Box>
                            </Grow>

                        </Stack>
                    </Grid>

                    {/* ── Detail panel — right of the portfolios ───────────────── */}
                    <Grid item xs={12} lg={4}>
                        <Grow in={animateIn} timeout={700}>
                            <Box sx={{ position: 'sticky', top: 24 }}>
                                <PortfolioDetailPanel
                                    portfolio={selectedPortfolio}
                                    accounts={accounts}
                                    contributions={contributions}
                                    monthlyIncome={monthlyIncome}
                                    availableBudget={leftoverBudget}
                                    onClose={() => setSelectedPortfolioId(null)}
                                    onUpdatePortfolio={updatePortfolio}
                                    onUpdateAccountLoan={updateAccountLoan}
                                />
                            </Box>
                        </Grow>
                    </Grid>
                </Grid>
            </Container>

            <NewPortfolioDialog
                open={newPortfolioOpen}
                accounts={accounts}
                onClose={() => setNewPortfolioOpen(false)}
                onCreate={createPortfolio}
            />
        </Box>
    );
};

export default InvestmentsPage;
// import { format } from 'date-fns';
// import {
//     Box,
//     Button,
//     Grid,
//     Typography,
//     alpha,
//     Container,
//     Grow,
//     Stack,
//     LinearProgress,
//     Chip,
// } from '@mui/material';
// import { Plus, Layers } from 'lucide-react';
// import React, { useMemo, useState, useEffect } from 'react';
// import Sidebar from './Sidebar';
// import PortfolioDetailPanel from './PortfolioDetailPanel';
// import AddAccountButton from './AddAccountButton';
// import NewPortfolioDialog from './NewPortfolioDialog';
// import ContributionsPanel from './ContributionsPanel';
// import MoneyFlowSummary from './MoneyFlowSummary';
// import {
//     MAROON,
//     InvestmentAccount,
//     Portfolio,
//     Contribution,
//     thresholdStatus,
//     portfolioBalance,
//     portfolioMonthlyDollarContribution,
//     fmt,
// } from './InvestmentUtils';
//
// // ── Mock starting data — replace with real service calls ─────────────────────
// const seedAccounts: InvestmentAccount[] = [
//     { id: 1, name: 'Retirement', institution: 'Fidelity', type: '401k', balance: 84210, monthlyContribution: 650, floorThreshold: null, goalAmount: 1100000, goalDate: '2056-01-01' },
//     { id: 2, name: 'Main Investment', institution: 'Schwab', type: 'brokerage', balance: 22940, monthlyContribution: 400, floorThreshold: 15000, goalAmount: 50000, goalDate: '2030-01-01' },
//     { id: 3, name: 'Emergency Fund', institution: 'Ally', type: 'emergency', balance: 6150, monthlyContribution: 0, floorThreshold: 6000, goalAmount: 10000, goalDate: null },
//     { id: 4, name: 'House Down Payment', institution: 'Marcus', type: 'savings', balance: 18300, monthlyContribution: 500, floorThreshold: 15000, goalAmount: 40000, goalDate: '2028-03-01' },
// ] as InvestmentAccount[];
//
// const seedPortfolios: Portfolio[] = [
//     { id: 1, name: 'Retirement', goal: 'Long-term retirement savings', accountIds: [1], targetAmount: 1100000, targetDate: '2056-01-01', contributionPercentage: 10.5 },
//     { id: 2, name: 'Growth Portfolio', goal: 'Main brokerage + retirement growth, combined', accountIds: [2], targetAmount: 50000, targetDate: '2030-01-01', contributionPercentage: 6.5 },
//     { id: 3, name: 'House Down Payment', goal: 'Target home purchase', accountIds: [4], targetAmount: 40000, targetDate: '2028-03-01', contributionPercentage: 8 },
// ];
//
// const seedContributions: Contribution[] = [
//     { id: 1, accountId: 1, amount: 300, frequency: 'biweekly', date: '2026-09-05' },
//     { id: 2, accountId: 2, amount: 100, frequency: 'weekly', date: '2026-09-08' },
//     { id: 3, accountId: 4, amount: 500, frequency: 'monthly', date: '2026-09-01' },
//     { id: 4, accountId: 1, amount: 300, frequency: 'biweekly', date: '2026-08-22' },
// ];
//
// type Selection = number | null; // selected portfolio id, or null
//
// // ── Component ──────────────────────────────────────────────────────────────
// const InvestmentsPage: React.FC = () => {
//     const [animateIn, setAnimateIn] = useState(false);
//     const [accounts, setAccounts] = useState<InvestmentAccount[]>(seedAccounts);
//     const [portfolios, setPortfolios] = useState<Portfolio[]>(seedPortfolios);
//     const [contributions, setContributions] = useState<Contribution[]>(seedContributions);
//     const [selectedPortfolioId, setSelectedPortfolioId] = useState<Selection>(null);
//     const [newPortfolioOpen, setNewPortfolioOpen] = useState(false);
//     const userId = Number(sessionStorage.getItem('userId'));
//
//     // Budget context — in the real app, pull this from BudgetRunnerService for the
//     // currently selected month, same source BudgetPage.tsx already uses.
//     const monthlyIncome = 6200;
//     const monthlyFixedSpend = 3180;
//
//     useEffect(() => { setTimeout(() => setAnimateIn(true), 100); }, []);
//
//     const totalInvested = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts]);
//     const totalPortfolioMonthly = useMemo(
//         () => portfolios.reduce((s, p) => s + portfolioMonthlyDollarContribution(p, monthlyIncome), 0),
//         [portfolios, monthlyIncome]
//     );
//     const leftoverBudget = monthlyIncome - monthlyFixedSpend - totalPortfolioMonthly;
//
//     const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId) ?? null;
//
//     const handleAccountsAdded = (newAccounts: InvestmentAccount[]) => {
//         // TODO: persist via InvestmentAccountService.createAccounts(userId, newAccounts)
//         setAccounts(prev => [...newAccounts, ...prev]);
//     };
//
//     const createPortfolio = (portfolio: Omit<Portfolio, 'id'>) => {
//         // TODO: persist via PortfolioService.create(userId, portfolio)
//         setPortfolios(prev => [{ ...portfolio, id: Date.now() }, ...prev]);
//     };
//
//     const updatePortfolio = (id: number, patch: Partial<Portfolio>) => {
//         // TODO: persist via PortfolioService.update(userId, id, patch)
//         setPortfolios(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
//     };
//
//     const addContribution = (c: Omit<Contribution, 'id'>) => {
//         // TODO: persist via ContributionService.create(userId, c)
//         setContributions(prev => [{ ...c, id: Date.now() }, ...prev]);
//     };
//
//     return (
//         <Box sx={{ maxWidth: 'calc(100% - 240px)', ml: '240px', minHeight: '100vh', background: '#f0f2f5' }}>
//             <Sidebar />
//
//             <Container maxWidth="xl" sx={{ py: 4 }}>
//
//                 {/* ── Header ─────────────────────────────────────────────────── */}
//                 <Grow in={animateIn} timeout={400}>
//                     <Box sx={{
//                         display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//                         mb: 4, flexDirection: { xs: 'column', sm: 'row' },
//                         textAlign: { xs: 'center', sm: 'left' }, gap: 2,
//                     }}>
//                         <Box>
//                             <Box sx={{ width: 28, height: 3, background: MAROON, borderRadius: '2px', mb: 0.75 }} />
//                             <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#111', letterSpacing: '-0.025em' }}>
//                                 Investments &amp; Savings
//                             </Typography>
//                             <Typography variant="subtitle1" sx={{ color: '#888', mt: 0.5 }}>
//                                 Click a portfolio to see its details and where it's headed
//                             </Typography>
//                         </Box>
//
//                         <AddAccountButton
//                             userId={userId}
//                             onAccountsAdded={handleAccountsAdded}
//                             existingPlaidAccountIds={accounts.map(a => a.plaidAccountId).filter((id): id is string => Boolean(id))}
//                         />
//                     </Box>
//                 </Grow>
//
//                 {/* ── Summary strip ──────────────────────────────────────────── */}
//                 <Grow in={animateIn} timeout={600}>
//                     <Grid container spacing={2.5} sx={{ mb: 4 }}>
//                         {[
//                             { label: 'Total invested + saved', value: fmt(totalInvested), sub: `${accounts.length} accounts` },
//                             { label: 'Going to portfolios / mo', value: fmt(totalPortfolioMonthly), sub: `${portfolios.length} portfolios` },
//                             { label: 'Left over after that', value: fmt(leftoverBudget), sub: leftoverBudget >= 0 ? 'unallocated' : 'over budget' },
//                             { label: 'Accounts near their floor', value: String(accounts.filter(a => !thresholdStatus(a.balance, a.floorThreshold).ok).length), sub: 'need attention' },
//                         ].map((c, i) => (
//                             <Grid item xs={12} sm={6} md={3} key={i}>
//                                 <Box sx={{
//                                     background: '#f0f4ff', borderRadius: '10px', borderTop: `3px solid ${MAROON}`,
//                                     boxShadow: '0 2px 12px rgba(0,0,0,0.10)', p: 2.5, height: '100%',
//                                     transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' },
//                                 }}>
//                                     <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5a5a7a', fontWeight: 700, mb: 1 }}>
//                                         {c.label}
//                                     </Typography>
//                                     <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e1e2e', fontVariantNumeric: 'tabular-nums', lineHeight: 1, mb: 1 }}>
//                                         {c.value}
//                                     </Typography>
//                                     <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: alpha(MAROON, 0.08), color: MAROON, fontSize: '0.65rem', fontWeight: 700 }}>
//                                         {c.sub}
//                                     </Box>
//                                 </Box>
//                             </Grid>
//                         ))}
//                     </Grid>
//                 </Grow>
//
//                 <MoneyFlowSummary
//                     monthlyIncome={monthlyIncome}
//                     monthlyFixedSpend={monthlyFixedSpend}
//                     portfolios={portfolios}
//                     accounts={accounts}
//                 />
//
//                 <Grid container spacing={3}>
//                     <Grid item xs={12} lg={8}>
//                         <Stack spacing={3}>
//
//                             {/* ── Portfolios ─────────────────────────────────── */}
//                             <Grow in={animateIn} timeout={800}>
//                                 <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}` }}>
//                                     <Box sx={{ background: `linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)`, px: 3, py: 2, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                         <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
//                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative' }}>
//                                             <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                                                 <Layers size={15} color="white" />
//                                             </Box>
//                                             <Box>
//                                                 <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>Portfolios</Typography>
//                                                 <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>Target amount, target date, and contribution % — single or multi-account</Typography>
//                                             </Box>
//                                         </Box>
//                                         <Button
//                                             size="small" startIcon={<Plus size={13} />} onClick={() => setNewPortfolioOpen(true)}
//                                             sx={{ color: '#fff', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }, position: 'relative', flexShrink: 0 }}
//                                         >
//                                             New portfolio
//                                         </Button>
//                                     </Box>
//                                     <Box sx={{ bgcolor: '#fff', p: 3 }}>
//                                         {portfolios.length === 0 ? (
//                                             <Typography sx={{ fontSize: '0.85rem', color: '#aaa', textAlign: 'center', py: 3 }}>
//                                                 No portfolios yet — group one or more accounts together with "New portfolio".
//                                             </Typography>
//                                         ) : (
//                                             <Grid container spacing={2}>
//                                                 {portfolios.map(p => {
//                                                     const balance = portfolioBalance(p, accounts);
//                                                     const pct = p.targetAmount > 0 ? Math.min(100, (balance / p.targetAmount) * 100) : 0;
//                                                     const isSelected = selectedPortfolioId === p.id;
//                                                     return (
//                                                         <Grid item xs={12} sm={6} key={p.id}>
//                                                             <Box
//                                                                 onClick={() => setSelectedPortfolioId(p.id)}
//                                                                 sx={{
//                                                                     bgcolor: '#f8f9fa', borderRadius: '10px', p: 2.25, height: '100%', cursor: 'pointer',
//                                                                     border: isSelected ? `2px solid ${MAROON}` : '2px solid transparent',
//                                                                     boxShadow: isSelected ? `0 4px 18px ${alpha(MAROON, 0.25)}` : 'none',
//                                                                     transition: 'box-shadow 0.15s, border-color 0.15s',
//                                                                     '&:hover': { boxShadow: `0 4px 16px ${alpha(MAROON, 0.18)}` },
//                                                                 }}
//                                                             >
//                                                                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//                                                                     <Box>
//                                                                         <Typography sx={{ fontWeight: 700, fontSize: '0.92rem' }}>{p.name}</Typography>
//                                                                         <Typography sx={{ fontSize: '0.7rem', color: '#888' }}>{p.goal}</Typography>
//                                                                     </Box>
//                                                                     <Chip label={`${p.accountIds.length} acct${p.accountIds.length === 1 ? '' : 's'}`} size="small" sx={{ height: 20, fontSize: '0.63rem', bgcolor: '#eee' }} />
//                                                                 </Box>
//                                                                 <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.2rem', color: MAROON, mt: 1 }}>{fmt(balance)}</Typography>
//                                                                 <LinearProgress variant="determinate" value={pct}
//                                                                                 sx={{ height: 5, borderRadius: 3, my: 0.75, bgcolor: alpha(MAROON, 0.15), '& .MuiLinearProgress-bar': { bgcolor: MAROON, borderRadius: 3 } }} />
//                                                                 <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
//                                                                     <Typography sx={{ fontSize: '0.68rem', color: '#888' }}>
//                                                                         {pct.toFixed(0)}% of {fmt(p.targetAmount)} · {format(new Date(p.targetDate), 'MMM yyyy')}
//                                                                     </Typography>
//                                                                     <Typography sx={{ fontSize: '0.68rem', color: MAROON, fontWeight: 700 }}>
//                                                                         {p.contributionPercentage}%/mo
//                                                                     </Typography>
//                                                                 </Box>
//                                                             </Box>
//                                                         </Grid>
//                                                     );
//                                                 })}
//                                             </Grid>
//                                         )}
//                                     </Box>
//                                 </Box>
//                             </Grow>
//
//                             {/* ── Contributions ──────────────────────────────── */}
//                             <Grow in={animateIn} timeout={900}>
//                                 <Box>
//                                     <ContributionsPanel
//                                         contributions={contributions}
//                                         accounts={accounts}
//                                         portfolios={portfolios}
//                                         onAddContribution={addContribution}
//                                     />
//                                 </Box>
//                             </Grow>
//
//                         </Stack>
//                     </Grid>
//
//                     {/* ── Detail panel — right of the portfolios ───────────────── */}
//                     <Grid item xs={12} lg={4}>
//                         <Grow in={animateIn} timeout={700}>
//                             <Box sx={{ position: 'sticky', top: 24 }}>
//                                 <PortfolioDetailPanel
//                                     portfolio={selectedPortfolio}
//                                     accounts={accounts}
//                                     contributions={contributions}
//                                     monthlyIncome={monthlyIncome}
//                                     availableBudget={leftoverBudget}
//                                     onClose={() => setSelectedPortfolioId(null)}
//                                     onUpdatePortfolio={updatePortfolio}
//                                 />
//                             </Box>
//                         </Grow>
//                     </Grid>
//                 </Grid>
//             </Container>
//
//             <NewPortfolioDialog
//                 open={newPortfolioOpen}
//                 accounts={accounts}
//                 onClose={() => setNewPortfolioOpen(false)}
//                 onCreate={createPortfolio}
//             />
//         </Box>
//     );
// };
//
// export default InvestmentsPage;