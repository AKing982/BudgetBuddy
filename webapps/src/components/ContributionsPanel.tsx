import { format } from 'date-fns';
import React, { useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Chip,
    Button,
    TextField,
    Select,
    MenuItem,
    InputAdornment,
    Stack,
    alpha,
} from '@mui/material';
import { Plus, Calendar, Receipt } from 'lucide-react';
import {
    MAROON,
    MAROON_DARK,
    InvestmentAccount,
    Portfolio,
    Contribution,
    ContributionFrequency,
    FREQUENCY_LABEL,
    contributionToMonthly,
    fmt,
} from './InvestmentUtils';

interface ContributionsPanelProps {
    contributions: Contribution[];
    accounts: InvestmentAccount[];
    portfolios: Portfolio[];
    onAddContribution: (c: Omit<Contribution, 'id'>) => void;
}

const FREQUENCY_COLORS: Record<ContributionFrequency, string> = {
    weekly: '#0284c7',
    biweekly: '#B8935A',
    monthly: MAROON,
    'one-time': '#6b7280',
};

const ContributionsPanel: React.FC<ContributionsPanelProps> = ({ contributions, accounts, portfolios, onAddContribution }) => {
    // Defaults to "All portfolios" ('') rather than portfolios[0] — imported
    // Plaid transactions span every linked account, and each auto-generated
    // portfolio only covers one account, so defaulting to a single portfolio
    // was hiding every other account's contributions on first load.
    const [portfolioId, setPortfolioId] = useState<number | ''>('');
    const [frequencyFilter, setFrequencyFilter] = useState<'all' | ContributionFrequency>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [formAccountId, setFormAccountId] = useState<number | ''>('');
    const [formAmount, setFormAmount] = useState('');
    const [formFrequency, setFormFrequency] = useState<ContributionFrequency>('monthly');
    const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const selectedPortfolio = portfolios.find(p => p.id === portfolioId) ?? null;
    const portfolioAccountIds = useMemo(() => new Set(selectedPortfolio?.accountIds ?? []), [selectedPortfolio]);
    const portfolioAccountsList = accounts.filter(a => portfolioAccountIds.has(a.id));

    const accountName = (id: number) => accounts.find(a => a.id === id)?.name ?? 'Unknown account';

    const initials = (name: string) =>
        name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

    // fmt() in InvestmentUtils renders negative amounts as "$-281" (sign after
    // the $) — fixed locally here without touching that shared helper, since
    // other call sites may rely on its current output.
    const formatSigned = (n: number) => {
        const abs = Math.abs(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
        return n < 0 ? `-${abs}` : n > 0 ? `+${abs}` : abs;
    };

    const filtered = useMemo(() => {
        return contributions
            .filter(c => !selectedPortfolio || portfolioAccountIds.has(c.accountId))
            .filter(c => frequencyFilter === 'all' || c.frequency === frequencyFilter)
            .filter(c => !dateFrom || c.date >= dateFrom)
            .filter(c => !dateTo || c.date <= dateTo)
            .slice()
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [contributions, selectedPortfolio, portfolioAccountIds, frequencyFilter, dateFrom, dateTo]);

    // Approx height of ~7 rows (each ~60px incl. padding/border) — fixed height
    // + overflow-y:auto rather than a "show more" toggle, per request.
    const ROW_HEIGHT = 60;
    const VISIBLE_ROWS = 7;

    const monthlyEquivalent = useMemo(
        () => filtered.reduce((sum, c) => sum + contributionToMonthly(c.amount, c.frequency), 0),
        [filtered]
    );

    const canSubmit = formAccountId !== '' && formAmount !== '' && formDate !== '';

    const submit = () => {
        if (!canSubmit) return;
        onAddContribution({ accountId: formAccountId as number, amount: Number(formAmount), frequency: formFrequency, date: formDate });
        setFormAmount('');
        setFormOpen(false);
    };

    return (
        <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}` }}>
            <Box sx={{ background: `linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)`, px: 3, py: 1.5, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Receipt size={15} color="white" />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>Contributions</Typography>
                            <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>
                                Pick a portfolio to see its contribution history
                            </Typography>
                        </Box>
                    </Box>
                    <Button
                        size="small" startIcon={<Plus size={13} />} onClick={() => setFormOpen(v => !v)}
                        sx={{ color: '#fff', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
                    >
                        Log contribution
                    </Button>
                </Box>
            </Box>

            <Box sx={{ bgcolor: '#fff', p: 3 }}>

                {/* ── Portfolio picker ──────────────────────────────────────── */}
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2.5 }}>
                    <Select
                        size="small" value={portfolioId} onChange={(e) => setPortfolioId(e.target.value as number)}
                        displayEmpty sx={{ minWidth: 200 }}
                    >
                        <MenuItem value="">All portfolios</MenuItem>
                        {portfolios.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                    </Select>
                    {selectedPortfolio && (
                        <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
                            {portfolioAccountsList.map(a => a.name).join(', ') || 'No accounts in this portfolio yet'}
                        </Typography>
                    )}
                </Stack>

                {formOpen && (
                    <Box sx={{ mb: 3, p: 2, borderRadius: '10px', bgcolor: '#f8f9fa' }}>
                        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap alignItems="flex-start">
                            <Select size="small" displayEmpty value={formAccountId} onChange={(e) => setFormAccountId(e.target.value as number)} sx={{ minWidth: 170 }}>
                                <MenuItem value="" disabled>Account</MenuItem>
                                {(selectedPortfolio ? portfolioAccountsList : accounts).map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                            </Select>
                            <TextField size="small" label="Amount" sx={{ width: 120 }} value={formAmount} onChange={e => setFormAmount(e.target.value)}
                                       InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                            <Select size="small" value={formFrequency} onChange={(e) => setFormFrequency(e.target.value as ContributionFrequency)} sx={{ minWidth: 130 }}>
                                <MenuItem value="weekly">Weekly</MenuItem>
                                <MenuItem value="biweekly">Biweekly</MenuItem>
                                <MenuItem value="monthly">Monthly</MenuItem>
                            </Select>
                            <TextField size="small" type="date" sx={{ width: 160 }} value={formDate} onChange={e => setFormDate(e.target.value)}
                                       InputProps={{ startAdornment: <InputAdornment position="start"><Calendar size={13} /></InputAdornment> }} />
                            <Button variant="contained" disabled={!canSubmit} onClick={submit}
                                    sx={{ textTransform: 'none', fontWeight: 700, bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK } }}>
                                Save
                            </Button>
                        </Stack>
                    </Box>
                )}

                {/* ── Filters: date range + frequency ──────────────────────────── */}
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                    <TextField size="small" type="date" label="From" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                               InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
                    <TextField size="small" type="date" label="To" value={dateTo} onChange={e => setDateTo(e.target.value)}
                               InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
                    {(dateFrom || dateTo) && (
                        <Button size="small" onClick={() => { setDateFrom(''); setDateTo(''); }} sx={{ textTransform: 'none', fontSize: '0.72rem', color: '#888' }}>
                            Clear dates
                        </Button>
                    )}
                    <Box sx={{ flex: 1 }} />
                    {/* 'one-time' added — imported Plaid transactions all carry this
                        frequency, and there was previously no way to filter to just them. */}
                    {(['all', 'weekly', 'biweekly', 'monthly', 'one-time'] as const).map(f => (
                        <Chip
                            key={f}
                            label={f === 'all' ? 'All' : FREQUENCY_LABEL[f]}
                            size="small"
                            onClick={() => setFrequencyFilter(f)}
                            sx={{
                                fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer',
                                bgcolor: frequencyFilter === f ? MAROON : '#f0f0f0',
                                color: frequencyFilter === f ? '#fff' : '#666',
                                '&:hover': { bgcolor: frequencyFilter === f ? MAROON_DARK : '#e5e5e5' },
                            }}
                        />
                    ))}
                </Stack>

                <Typography sx={{ fontSize: '0.72rem', color: '#888', mb: 1.5 }}>
                    {fmt(monthlyEquivalent)}/mo equivalent across {filtered.length} contribution{filtered.length === 1 ? '' : 's'} shown
                </Typography>

                {/* ── Transaction-style list ────────────────────────────────── */}
                {!selectedPortfolio && portfolios.length > 0 ? (
                    <Typography sx={{ fontSize: '0.82rem', color: '#aaa', py: 2, textAlign: 'center' }}>
                        Showing contributions across all portfolios — pick one above to narrow it down.
                    </Typography>
                ) : null}

                {filtered.length === 0 ? (
                    <Typography sx={{ fontSize: '0.82rem', color: '#aaa', py: 3, textAlign: 'center' }}>
                        No contributions match these filters.
                    </Typography>
                ) : (
                    <Box
                        sx={{
                            maxHeight: ROW_HEIGHT * VISIBLE_ROWS,
                            overflowY: 'auto',
                            pr: 0.5, // room for the scrollbar so it doesn't sit flush against row content
                        }}
                    >
                        <Stack spacing={0}>
                            {filtered.map((c, i) => {
                                const account = accounts.find(a => a.id === c.accountId);
                                const displayName = c.name || accountName(c.accountId);
                                return (
                                    <Box
                                        key={c.id}
                                        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderBottom: i < filtered.length - 1 ? '1px solid #f0f0f0' : 'none' }}
                                    >
                                        <Box sx={{
                                            width: 36, height: 36, borderRadius: '9px', bgcolor: MAROON, color: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 700, fontSize: '0.7rem', flexShrink: 0,
                                        }}>
                                            {initials(account?.name ?? displayName)}
                                        </Box>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {displayName}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.7rem', color: '#999', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {accountName(c.accountId)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                            <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: c.amount > 0 ? '#16a34a' : '#1e1e2e' }}>
                                                {formatSigned(c.amount)}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.68rem', color: '#999', mt: 0.25 }}>
                                                {format(new Date(c.date), 'MMM d')} · {FREQUENCY_LABEL[c.frequency]}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default ContributionsPanel;