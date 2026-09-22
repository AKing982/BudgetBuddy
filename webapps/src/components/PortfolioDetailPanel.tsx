import { addMonths, format, startOfMonth, subMonths } from 'date-fns';
import {
    Box,
    Typography,
    Chip,
    Divider,
    Button,
    LinearProgress,
    IconButton,
    Stack,
    Tabs,
    Tab,
    TextField,
    InputAdornment,
    MenuItem,
} from '@mui/material';
import { X, Target, Sparkles, SlidersHorizontal } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
    MAROON,
    MAROON_DARK,
    InvestmentAccount,
    Portfolio,
    Contribution,
    Loan,
    portfolioAccounts,
    portfolioBalance,
    portfolioGrowthRate,
    portfolioMonthlyDollarContribution,
    monthsUntil,
    monthsToReachAmount,
    requiredMonthlyContribution,
    fmt,
} from './InvestmentUtils';
import AdjustContributionDialog from './AdjustContributionDialog';
import ReconciliationTab from './ReconciliationTab';
import LoanFormDialog from './LoanFormDialog';
import ContributionsAreaChart from './ContributionsAreaChart';

interface PortfolioDetailPanelProps {
    portfolio: Portfolio | null;
    accounts: InvestmentAccount[];
    contributions: Contribution[];
    monthlyIncome: number;
    availableBudget: number; // unallocated monthly budget, across all portfolios
    onClose: () => void;
    onUpdatePortfolio: (id: number, patch: Partial<Portfolio>) => void;
    // TODO: persist via InvestmentAccountService.updateLoan(accountId, loan) — no
    // backend endpoint for this yet, since Plaid doesn't report loan data at all.
    onUpdateAccountLoan: (accountId: number, loan: Loan | undefined) => void;
}

const EMPTY_PORTFOLIO: Portfolio = { id: 0, name: '', goal: '', accountIds: [], targetAmount: 0, targetDate: new Date().toISOString(), contributionPercentage: 0 };

const PortfolioDetailPanel: React.FC<PortfolioDetailPanelProps> = ({
                                                                       portfolio, accounts, contributions, monthlyIncome, availableBudget, onClose, onUpdatePortfolio, onUpdateAccountLoan,
                                                                   }) => {
    const [adjustOpen, setAdjustOpen] = useState(false);
    const [loanFormOpen, setLoanFormOpen] = useState(false);
    const [tab, setTab] = useState<'overview' | 'reconciliation' | 'loan'>('overview');
    const [calcAmount, setCalcAmount] = useState('');
    const [calcTermMonths, setCalcTermMonths] = useState(60);
    const [calcResult, setCalcResult] = useState<{ monthlyPayment: number; maxLoan: number; withinMax: boolean } | null>(null);

    // Every hook below must run on every render regardless of selection, so we
    // compute against a safe fallback when nothing is selected and only bail
    // out to the empty state in the JSX return at the bottom of the function.
    const active = portfolio ?? EMPTY_PORTFOLIO;

    const linkedAccounts = portfolioAccounts(active, accounts);
    const balance = portfolioBalance(active, accounts);
    const growthRate = portfolioGrowthRate(active, accounts);
    const monthsRemaining = monthsUntil(active.targetDate);
    const progressPct = active.targetAmount > 0 ? Math.min(100, (balance / active.targetAmount) * 100) : 0;
    const currentMonthly = portfolioMonthlyDollarContribution(active, monthlyIncome);

    // Sum of the linked accounts' totalContributed (set in InvestmentsPage from
    // the sum of that account's investment transactions — see conversation).
    // "Growth" = current balance minus what was actually put in, i.e. market
    // gains. Can go negative if the balance dropped since contributing.
    const totalContributed = linkedAccounts.reduce((s, a) => s + ((a as any).totalContributed ?? 0), 0);
    const growth = balance - totalContributed;

    // Last 6 calendar months, oldest first, summing contributions per month
    // across every linked account — zero-filled so the chart always has a
    // continuous x-axis even for months with no activity.
    const monthlySeries = useMemo(() => {
        const linkedIds = new Set(active.accountIds);
        const months = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(new Date(), 5 - i)));
        return months.map(monthStart => {
            const monthEnd = addMonths(monthStart, 1);
            const total = contributions
                .filter(c => linkedIds.has(c.accountId))
                .filter(c => {
                    const d = new Date(c.date);
                    return d >= monthStart && d < monthEnd;
                })
                .reduce((s, c) => s + c.amount, 0);
            return { label: format(monthStart, 'MMM'), value: total };
        });
    }, [contributions, active.accountIds]);

    // A loan is tracked per-account, not per-portfolio. For a single-account
    // portfolio (the common case — every auto-generated portfolio covers just
    // one account) this is unambiguous. For a manually-grouped multi-account
    // portfolio, this shows/edits the first linked account's loan only — there's
    // no UI yet for picking which account within a multi-account portfolio.
    const primaryAccount = linkedAccounts[0];
    const loan = primaryAccount?.loan;
    const loanPct = loan && loan.originalAmount > 0
        ? Math.min(100, ((loan.originalAmount - loan.remainingBalance) / loan.originalAmount) * 100)
        : 0;
    const loanPayoffMonths = loan && loan.monthlyRepayment > 0
        ? Math.ceil(loan.remainingBalance / loan.monthlyRepayment)
        : null;
    const loanPayoffDate = loanPayoffMonths !== null ? addMonths(new Date(), loanPayoffMonths) : null;

    // PLACEHOLDER math — deliberately not the final formula (see conversation:
    // "don't worry about how it's calculating, just the layout"). Flat division,
    // no interest. The one real rule applied: max loan = lesser of $50,000 or
    // 50% of vested balance (the general IRS ceiling; some plans differ).
    const runCalculator = () => {
        const amount = Number(calcAmount);
        if (!amount || !primaryAccount) return;
        const maxLoan = Math.min(50000, primaryAccount.balance * 0.5);
        setCalcResult({
            monthlyPayment: amount / calcTermMonths,
            maxLoan,
            withinMax: amount <= maxLoan,
        });
    };

    // ── Optimize: how much would it take to land exactly on the target date? ──
    const requiredMonthly = requiredMonthlyContribution(balance, active.targetAmount, monthsRemaining, growthRate);
    const requiredPct = monthlyIncome > 0 ? (requiredMonthly / monthlyIncome) * 100 : 0;
    const additionalNeeded = Math.max(0, requiredMonthly - currentMonthly);
    const fitsInBudget = additionalNeeded <= availableBudget + 0.01;
    const maxFeasiblePct = active.contributionPercentage + (monthlyIncome > 0 ? (availableBudget / monthlyIncome) * 100 : 0);

    const optimizeMessage = useMemo(() => {
        if (requiredMonthly <= currentMonthly + 1) {
            return { tone: 'good' as const, text: `You're already contributing enough to hit ${format(new Date(active.targetDate), 'MMM yyyy')} — no change needed.` };
        }
        if (fitsInBudget) {
            return {
                tone: 'good' as const,
                text: `Increasing to ${requiredPct.toFixed(1)}% ($${Math.round(additionalNeeded)} more/mo) would hit your target date, and fits within your unallocated budget.`,
                applyPct: requiredPct,
            };
        }
        const maxSeries = monthsToReachAmount(balance, monthlyIncome * (maxFeasiblePct / 100), active.targetAmount, growthRate);
        const maxDateText = maxSeries !== null ? format(addMonths(new Date(), maxSeries), 'MMM yyyy') : 'beyond 50 years';
        return {
            tone: 'warn' as const,
            text: `Your budget only allows increasing to about ${Math.max(0, maxFeasiblePct).toFixed(1)}% — that lands closer to ${maxDateText} instead of ${format(new Date(active.targetDate), 'MMM yyyy')}.`,
            applyPct: Math.max(0, maxFeasiblePct),
        };
    }, [requiredMonthly, currentMonthly, fitsInBudget, requiredPct, additionalNeeded, maxFeasiblePct, balance, monthlyIncome, active.targetAmount, active.targetDate, growthRate]);

    if (!portfolio) {
        return (
            <Box sx={{ borderRadius: '16px', border: `1px dashed ${MAROON}55`, p: 4, textAlign: 'center', bgcolor: '#faf7f7' }}>
                <Target size={26} color={MAROON} style={{ opacity: 0.5, marginBottom: 10 }} />
                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 0.5 }}>Select a portfolio</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#888' }}>
                    Click any portfolio to preview a bigger contribution or optimize it against your budget.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${MAROON}26`, boxShadow: `0 4px 24px ${MAROON}1a`, bgcolor: '#fff' }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <Box sx={{ background: `linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)`, px: 3, py: 2.25, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                    <Box>
                        <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, mb: 0.25 }}>
                            {linkedAccounts.length > 1 ? `${linkedAccounts.length} accounts` : linkedAccounts[0]?.name ?? 'Portfolio'}
                        </Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>{portfolio.name}</Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', mt: 0.25 }}>{portfolio.goal}</Typography>
                    </Box>
                    <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.75)', mt: -0.5, mr: -1 }}><X size={16} /></IconButton>
                </Box>
            </Box>

            <Tabs
                value={tab} onChange={(_, v) => setTab(v)}
                variant="fullWidth"
                sx={{
                    minHeight: 36, borderBottom: '1px solid #eee',
                    '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', color: '#888' },
                    '& .Mui-selected': { color: `${MAROON} !important` },
                    '& .MuiTabs-indicator': { bgcolor: MAROON },
                }}
            >
                <Tab value="overview" label="Overview" />
                <Tab value="reconciliation" label="Reconciliation" />
                <Tab value="loan" label="Loan" />
            </Tabs>

            {tab === 'overview' && (
                <Box sx={{ p: 3 }}>

                    {/* ── Accounts in this portfolio ───────────────────────────── */}
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                        {linkedAccounts.map(a => (
                            <Chip key={a.id} label={a.name} size="small" sx={{ height: 22, fontSize: '0.68rem', bgcolor: '#f8f9fa' }} />
                        ))}
                    </Stack>

                    {/* ── Donut hero: balance centered inside the target-progress ring ── */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <svg width={180} height={180} viewBox="0 0 180 180">
                            <circle cx="90" cy="90" r="76" fill="none" stroke={`${MAROON}1f`} strokeWidth="16" />
                            <circle
                                cx="90" cy="90" r="76" fill="none" stroke={MAROON} strokeWidth="16" strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 76}
                                strokeDashoffset={2 * Math.PI * 76 * (1 - progressPct / 100)}
                                transform="rotate(-90 90 90)"
                            />
                            <text x="90" y="84" textAnchor="middle" fontSize="24" fontWeight="800" fill={MAROON} fontFamily="monospace">
                                {fmt(balance)}
                            </text>
                            <text x="90" y="106" textAnchor="middle" fontSize="11" fill="#999">
                                {progressPct.toFixed(0)}% of {fmt(portfolio.targetAmount)}
                            </text>
                        </svg>
                    </Box>
                    <Typography sx={{ fontSize: '0.75rem', color: '#888', textAlign: 'center', mb: 2 }}>
                        Currently {portfolio.contributionPercentage}% of income · ${Math.round(currentMonthly)}/mo · target {format(new Date(portfolio.targetDate), 'MMM yyyy')}
                    </Typography>

                    {/* ── Contributed / Growth stats ───────────────────────────── */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25, mb: 2.5 }}>
                        <Box sx={{ bgcolor: '#f8f9fa', borderRadius: '10px', p: 1.5 }}>
                            <Typography sx={{ fontSize: '0.6rem', color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Contributed
                            </Typography>
                            <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', mt: 0.25 }}>
                                {fmt(totalContributed)}
                            </Typography>
                        </Box>
                        <Box sx={{ bgcolor: growth >= 0 ? 'rgba(22,163,74,0.08)' : 'rgba(217,119,6,0.08)', borderRadius: '10px', p: 1.5 }}>
                            <Typography sx={{ fontSize: '0.6rem', color: growth >= 0 ? '#15803d' : '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Growth
                            </Typography>
                            <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', color: growth >= 0 ? '#15803d' : '#92400e', mt: 0.25 }}>
                                {growth >= 0 ? '+' : ''}{fmt(growth)}
                            </Typography>
                        </Box>
                    </Box>

                    {/* ── Contributions over time ──────────────────────────────── */}
                    <Box sx={{ border: '1px solid #eee', borderRadius: '10px', p: 1.75, mb: 2.5 }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, mb: 1 }}>Contributions over time</Typography>
                        <ContributionsAreaChart data={monthlySeries} width={330} height={80} />
                    </Box>

                    <Button
                        fullWidth variant="outlined" startIcon={<SlidersHorizontal size={15} />}
                        onClick={() => setAdjustOpen(true)}
                        sx={{ mb: 2.5, textTransform: 'none', fontWeight: 700, borderColor: MAROON, color: MAROON, '&:hover': { borderColor: MAROON_DARK, bgcolor: `${MAROON}0a` } }}
                    >
                        Adjust contribution
                    </Button>

                    <Divider sx={{ mb: 2.5 }} />

                    {/* ── Optimize against budget ──────────────────────────────── */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                        <Sparkles size={14} color={MAROON} />
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Optimize against your budget</Typography>
                    </Box>
                    <Box sx={{
                        p: 1.5, borderRadius: '8px',
                        bgcolor: optimizeMessage.tone === 'good' ? 'rgba(22,163,74,0.08)' : 'rgba(217,119,6,0.08)',
                        mb: optimizeMessage.applyPct !== undefined ? 1.5 : 0,
                    }}>
                        <Typography sx={{ fontSize: '0.78rem', color: optimizeMessage.tone === 'good' ? '#15803d' : '#92400e', lineHeight: 1.55 }}>
                            {optimizeMessage.text}
                        </Typography>
                    </Box>
                    {optimizeMessage.applyPct !== undefined && (
                        <Button
                            fullWidth variant="contained"
                            onClick={() => onUpdatePortfolio(portfolio.id, { contributionPercentage: Number(optimizeMessage.applyPct!.toFixed(1)) })}
                            sx={{ bgcolor: MAROON, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: MAROON_DARK } }}
                        >
                            Apply {optimizeMessage.applyPct!.toFixed(1)}%
                        </Button>
                    )}

                    <Typography sx={{ fontSize: '0.65rem', color: '#aaa', mt: 2, lineHeight: 1.5 }}>
                        Assumes a {growthRate.toFixed(1)}% blended annual return across this portfolio's accounts, compounded monthly. Estimate only.
                    </Typography>
                </Box>
            )}

            {tab === 'reconciliation' && (
                <Box sx={{ p: 3 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#666', mb: 2, lineHeight: 1.5 }}>
                        Budgeted vs. actually logged contributions for {linkedAccounts.length > 1 ? 'these accounts' : linkedAccounts[0]?.name ?? 'this portfolio'}.
                    </Typography>
                    <ReconciliationTab
                        contributions={contributions}
                        accountIds={active.accountIds}
                        budgetedMonthly={currentMonthly}
                    />
                </Box>
            )}

            {tab === 'loan' && (
                <Box sx={{ p: 3 }}>
                    {!primaryAccount ? (
                        <Typography sx={{ fontSize: '0.82rem', color: '#aaa', textAlign: 'center', py: 3 }}>
                            No account linked to this portfolio yet.
                        </Typography>
                    ) : loan ? (
                        <>
                            <Typography sx={{ fontSize: '0.78rem', color: '#888', mb: 2, lineHeight: 1.5 }}>
                                Optional — some 401(k) plans let you borrow against your own vested balance. Tracked manually here since Plaid doesn't report loan details.
                            </Typography>

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25, mb: 1.75 }}>
                                <Box sx={{ bgcolor: 'rgba(217,119,6,0.08)', borderRadius: '10px', p: 1.5 }}>
                                    <Typography sx={{ fontSize: '0.6rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Remaining balance
                                    </Typography>
                                    <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.05rem', color: '#92400e', mt: 0.25 }}>
                                        {fmt(loan.remainingBalance)}
                                    </Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#f8f9fa', borderRadius: '10px', p: 1.5 }}>
                                    <Typography sx={{ fontSize: '0.6rem', color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Original amount
                                    </Typography>
                                    <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.05rem', mt: 0.25 }}>
                                        {fmt(loan.originalAmount)}
                                    </Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#f8f9fa', borderRadius: '10px', p: 1.5 }}>
                                    <Typography sx={{ fontSize: '0.6rem', color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Interest rate
                                    </Typography>
                                    <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.05rem', mt: 0.25 }}>
                                        {loan.interestRate}%
                                    </Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#f8f9fa', borderRadius: '10px', p: 1.5 }}>
                                    <Typography sx={{ fontSize: '0.6rem', color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Repayment
                                    </Typography>
                                    <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.05rem', mt: 0.25 }}>
                                        {fmt(loan.monthlyRepayment)}/mo
                                    </Typography>
                                </Box>
                            </Box>

                            <LinearProgress
                                variant="determinate" value={loanPct}
                                sx={{ height: 6, borderRadius: 3, mb: 0.75, bgcolor: 'rgba(217,119,6,0.15)', '& .MuiLinearProgress-bar': { bgcolor: '#d97706', borderRadius: 3 } }}
                            />
                            <Typography sx={{ fontSize: '0.72rem', color: '#888', mb: 2.25 }}>
                                {loanPct.toFixed(0)}% paid off{loanPayoffDate ? ` · est. payoff ${format(loanPayoffDate, 'MMM yyyy')}` : ''}
                            </Typography>

                            <Button
                                fullWidth variant="outlined" onClick={() => setLoanFormOpen(true)}
                                sx={{ textTransform: 'none', fontWeight: 700, borderColor: MAROON, color: MAROON, '&:hover': { borderColor: MAROON_DARK, bgcolor: `${MAROON}0a` } }}
                            >
                                Edit loan
                            </Button>
                        </>
                    ) : (
                        <Box>
                            <Typography sx={{ fontSize: '0.78rem', color: '#999', mb: 2, lineHeight: 1.5 }}>
                                No loan on {primaryAccount.name} yet. See what you could borrow before deciding.
                            </Typography>

                            <Box sx={{ border: '1px solid #eee', borderRadius: '10px', p: 2, mb: 1.75 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', mb: 1.5 }}>Loan calculator</Typography>

                                <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.25 }}>Vested balance</Typography>
                                <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', mb: 1.5 }}>
                                    {fmt(primaryAccount.balance)}
                                </Typography>

                                <TextField
                                    label="Amount you'd like to borrow" size="small" fullWidth
                                    value={calcAmount} onChange={e => setCalcAmount(e.target.value)}
                                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                                    sx={{ mb: 1.5 }}
                                />
                                <TextField
                                    label="Repay by" size="small" fullWidth select
                                    value={calcTermMonths} onChange={e => setCalcTermMonths(Number(e.target.value))}
                                    sx={{ mb: 2 }}
                                >
                                    <MenuItem value={12}>1 year</MenuItem>
                                    <MenuItem value={24}>2 years</MenuItem>
                                    <MenuItem value={36}>3 years</MenuItem>
                                    <MenuItem value={48}>4 years</MenuItem>
                                    <MenuItem value={60}>5 years (standard max)</MenuItem>
                                </TextField>

                                {calcResult && (
                                    <Box sx={{ bgcolor: 'rgba(217,119,6,0.08)', borderRadius: '8px', p: 1.5, mb: 1.5 }}>
                                        <Typography sx={{ fontSize: '0.68rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>
                                            Result
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.76rem', color: '#92400e', lineHeight: 1.6 }}>
                                            {calcResult.withinMax
                                                ? `≈ ${fmt(calcResult.monthlyPayment)}/mo for ${calcTermMonths} months · within your ${fmt(calcResult.maxLoan)} max (50% of vested, capped at $50,000)`
                                                : `Exceeds your ${fmt(calcResult.maxLoan)} max — most plans cap loans at the lesser of $50,000 or 50% of vested balance.`}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.62rem', color: '#b45309', mt: 1, fontStyle: 'italic' }}>
                                            Rough estimate — assumes flat monthly repayment with no interest. Your plan's actual rate and terms will differ.
                                        </Typography>
                                    </Box>
                                )}

                                <Button
                                    fullWidth variant="contained" onClick={runCalculator}
                                    disabled={!calcAmount}
                                    sx={{ bgcolor: MAROON, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: MAROON_DARK } }}
                                >
                                    Calculate
                                </Button>
                            </Box>

                            <Button
                                fullWidth variant="outlined" onClick={() => setLoanFormOpen(true)}
                                sx={{ textTransform: 'none', fontWeight: 700, borderColor: MAROON, color: MAROON, '&:hover': { borderColor: MAROON_DARK, bgcolor: `${MAROON}0a` } }}
                            >
                                {calcResult ? 'Save this as my loan' : '+ Add loan manually'}
                            </Button>
                        </Box>
                    )}
                </Box>
            )}

            <AdjustContributionDialog
                open={adjustOpen}
                portfolio={portfolio}
                accounts={accounts}
                monthlyIncome={monthlyIncome}
                availableBudget={availableBudget}
                onClose={() => setAdjustOpen(false)}
                onApply={(id, pct) => onUpdatePortfolio(id, { contributionPercentage: pct })}
            />

            {primaryAccount && (
                <LoanFormDialog
                    open={loanFormOpen}
                    accountName={primaryAccount.name}
                    existingLoan={loan}
                    prefill={!loan && calcResult ? {
                        originalAmount: Number(calcAmount),
                        remainingBalance: Number(calcAmount),
                        interestRate: 0, // placeholder calc doesn't model interest — see runCalculator
                        monthlyRepayment: Math.round(calcResult.monthlyPayment),
                    } : undefined}
                    onClose={() => setLoanFormOpen(false)}
                    onSave={(newLoan) => onUpdateAccountLoan(primaryAccount.id, newLoan)}
                    onRemove={loan ? () => onUpdateAccountLoan(primaryAccount.id, undefined) : undefined}
                />
            )}
        </Box>
    );
};

export default PortfolioDetailPanel;