import React, {useEffect, useRef, useState} from 'react';
import {
    Box, Grid, Typography, Paper, Button, LinearProgress, Chip,
    Divider, Dialog, Alert, AlertTitle, DialogActions,
    Backdrop, CircularProgress, Snackbar, Table, TableBody, TableCell,
    TableHead, TableRow, alpha, Stack,
} from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { ShoppingCart, Restaurant, LocalGasStation, Home, CheckCircle, Replay } from '@mui/icons-material';
import { AlertCircle, Upload, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
    PieChart, Pie, Cell, Sector, ResponsiveContainer,
} from 'recharts';
import Sidebar from './Sidebar';
import PlaidService from '../services/PlaidService';
import UserService from '../services/UserService';
import CsvUploadService from '../services/CsvUploadService';
import CSVImportDialog from './CSVImportDialog';
import PlaidImportService from "../services/PlaidImportService";
import TransactionService from "../services/TransactionService";

// ── Design tokens ─────────────────────────────────────────────────────────────
const MAROON      = '#6b1a1a';
const MAROON2     = '#4a1010';
const TEAL        = '#0d9488';
const GREEN       = '#059669';
const RED         = '#dc2626';
const AMBER       = '#d97706';
const BLUE        = '#2563eb';
const PURPLE      = '#7c3aed';
const SLATE       = '#64748b';
const NAVY        = '#1e293b';
const MAROON_GRAD = `linear-gradient(135deg, ${MAROON2} 0%, ${MAROON} 50%, #5a1515 100%)`;

// ── Types ─────────────────────────────────────────────────────────────────────
interface Receipt       { id: number; store: string; date: string; time: string; amount: number; items: number; tags: string[]; color: string; }
interface RecurringTx   { id: number; name: string; category: string; amount: number; frequency: string; nextDue: string; daysUntilDue: number; status: 'upcoming'|'due-soon'|'overdue'; icon: React.ReactNode; color: string; }
interface Transaction   { id: number; date: string; description: string; category: string; amount: number; balance: number; type: 'income'|'expense'; }
interface BudgetGoal    { id: number; name: string; current: number; target: number; percentage: number; status: 'on-track'|'warning'|'exceeded'; }
interface CategorySpend { category: string; amount: number; percentage: number; icon: React.ReactNode; color: string; }

// ── Snackbar ──────────────────────────────────────────────────────────────────
const SnackbarAlert = React.forwardRef<HTMLDivElement, AlertProps>(
    function SnackbarAlert(props, ref) {
        return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
    }
);

// ── Active donut shape ────────────────────────────────────────────────────────
// Shows: name, $value, % of total — with outer ring pop and accent arc
// Only shows spending amount (not vs budget)
const makeActiveShape = (opts: {
    totalLabel?: string;
}) => (props: any) => {
    const {
        cx, cy, innerRadius, outerRadius,
        startAngle, endAngle,
        fill, payload, percent, value,
    } = props;
    const { totalLabel } = opts;

    const line2 = `$${value.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
    const line3 = `${(percent * 100).toFixed(1)}% ${totalLabel || 'of total'}`;

    return (
        <g>
            {/* Category name */}
            <text x={cx} y={cy - 18} textAnchor="middle" fill={NAVY}
                  style={{ fontSize: 12, fontWeight: 800 }}>
                {payload.name.length > 18 ? payload.name.slice(0,17) + '…' : payload.name}
            </text>
            {/* Dollar value — spending only */}
            <text x={cx} y={cy + 6} textAnchor="middle" fill={fill}
                  style={{ fontSize: 16, fontWeight: 900 }}>
                {line2}
            </text>
            {/* Pct line */}
            <text x={cx} y={cy + 24} textAnchor="middle" fill={SLATE}
                  style={{ fontSize: 10, fontWeight: 600 }}>
                {line3}
            </text>
            {/* Expanded outer arc */}
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}
                    startAngle={startAngle} endAngle={endAngle} fill={fill} />
            {/* Thin accent ring */}
            <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 15}
                    startAngle={startAngle} endAngle={endAngle} fill={fill} />
        </g>
    );
};

// ── Idle donut center label ───────────────────────────────────────────────────
const IdleCenter = ({ cx, cy, primary, secondary }: { cx: number; cy: number; primary: string; secondary: string }) => (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
        <tspan x={cx} dy="-8"  fontSize="15" fontWeight="800" fill={NAVY}>{primary}</tspan>
        <tspan x={cx} dy="20"  fontSize="10" fontWeight="600" fill={SLATE}>{secondary}</tspan>
    </text>
);

// ── Panel header ──────────────────────────────────────────────────────────────
const PanelHeader: React.FC<{ title: string; badge?: React.ReactNode; action?: React.ReactNode }> = ({ title, badge, action }) => (
    <Box sx={{
        px: 2.5, py: 1.75,
        background: MAROON_GRAD,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden', flexShrink: 0,
    }}>
        <Box sx={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', letterSpacing: '-0.01em' }}>{title}</Typography>
            {badge}
        </Box>
        {action}
    </Box>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: alpha(MAROON, 0.55), mb: 1.75 }}>
        {children}
    </Typography>
);

// ── Recurring bill row ────────────────────────────────────────────────────────
const BillRow: React.FC<{ bill: RecurringTx }> = ({ bill }) => {
    const sc = bill.status === 'overdue' ? RED : bill.status === 'due-soon' ? AMBER : GREEN;
    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25,
            borderLeft: `3px solid ${sc}`, pl: 1.5,
            borderBottom: `1px solid ${alpha('#000', 0.05)}`,
            '&:last-child': { borderBottom: 'none' },
            '&:hover': { bgcolor: alpha(MAROON, 0.02) }, transition: 'background 0.12s',
        }}>
            <Box sx={{ width: 34, height: 34, borderRadius: '8px', bgcolor: alpha(bill.color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: bill.color }}>
                {bill.icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bill.name}</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: SLATE }}>{bill.frequency.charAt(0).toUpperCase() + bill.frequency.slice(1)}</Typography>
            </Box>
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: NAVY, fontVariantNumeric: 'tabular-nums' }}>${bill.amount.toFixed(2)}</Typography>
                <Chip size="small" label={bill.status === 'overdue' ? 'Overdue' : `${bill.daysUntilDue}d`}
                      sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: alpha(sc, 0.1), color: sc, border: `1px solid ${alpha(sc, 0.25)}` }} />
            </Box>
        </Box>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// ── Main DashboardPage ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const DashboardPage: React.FC = () => {
    const [uploadReminderOpen,   setUploadReminderOpen]   = useState(false);
    const [checkingTransactions, setCheckingTransactions] = useState(false);
    const [isLoading,            setIsLoading]            = useState(false);
    const [snackbarOpen,         setSnackbarOpen]         = useState(false);
    const [snackbarMessage,      setSnackbarMessage]      = useState('');
    const [snackbarSeverity,     setSnackbarSeverity]     = useState<'success'|'error'|'info'|'warning'>('success');
    const [importDialogOpen,     setImportDialogOpen]     = useState(false);

    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTx[]>([]);
    const [recentTransactions,    setRecentTransactions]    = useState<Transaction[]>([]);
    const [budgetGoals,           setBudgetGoals]           = useState<BudgetGoal[]>([]);
    const [groceryBudget,         setGroceryBudget]         = useState<BudgetGoal | null>(null);
    const [topCategories,         setTopCategories]         = useState<CategorySpend[]>([]);
    const [totalBudget,           setTotalBudget]           = useState({ current: 0, target: 0, percentage: 0 });
    const [recentReceipts,        setRecentReceipts]        = useState<Receipt[]>([]);

    // ── Per-donut active index state ──────────────────────────────────────────
    const [budgetActiveIdx,   setBudgetActiveIdx]   = useState<number | undefined>(undefined);
    const [spendingActiveIdx, setSpendingActiveIdx] = useState<number | undefined>(undefined);
    const [receiptsActiveIdx, setReceiptsActiveIdx] = useState<number | undefined>(undefined);
    const [savingsActiveIdx,  setSavingsActiveIdx]  = useState<number | undefined>(undefined);

    const userFullName     = sessionStorage.getItem('fullName');
    const userId           = Number(sessionStorage.getItem('userId'));
    const transactionService = TransactionService.getInstance();
    const plaidTransactionImportService = PlaidImportService.getInstance();
    const userService      = UserService.getInstance();
    const csvUploadService = new CsvUploadService();

    useEffect(() => { document.title = 'Dashboard'; }, []);

    const hasFetchedRef = useRef(false);

    useEffect(() => {
        if (!userId || hasFetchedRef.current) return;

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        startDate.setDate(1);
        const startDateStr = startDate.toISOString().split('T')[0];
        const syncPlaidTransactions = async () => {
            hasFetchedRef.current = true;

            const today = new Date().toISOString().split('T')[0];
            const latestPostedDate = await transactionService.fetchLatestPostedDateByUserId(userId);
            const isValidDate = !isNaN(latestPostedDate.getTime());
            const latestPostedDateStr = isValidDate
                ? latestPostedDate.toISOString().split('T')[0]
                : startDateStr;

            try {
                const transactions = await transactionService
                    .fetchTransactionsByUserAndDateRange(userId, startDateStr, today);

                const hasNoTransactions = !transactions || transactions.length === 0;
                const missingSinceLastPost = !transactions?.some(t => t.date === latestPostedDateStr);
                const twoDaysAgo = new Date();
                twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
                const missingLastDay = !transactions?.some(t => t.date === twoDaysAgoStr);
                if (hasNoTransactions) {
                    // No data at all — import full 3-month range
                    await plaidTransactionImportService
                        .importPlaidTransactions(userId, startDateStr, today);
                }else if(missingSinceLastPost){
                    await plaidTransactionImportService.importPlaidTransactions(userId, latestPostedDateStr, today);
                }else if (missingLastDay) {
                    // Have historical data but today is missing — import today only
                    await plaidTransactionImportService
                        .importPlaidTransactions(userId, twoDaysAgoStr, today);  // start === end
                }
                // else: data is up to date, do nothing

            } catch (e) {
                hasFetchedRef.current = false; // allow retry on failure
                console.error('Failed to sync Plaid transactions:', e);
            }
        };

        syncPlaidTransactions();
    }, [userId]);

    // useEffect(() => {
    //     const syncPlaidTransactions = async () => {
    //         try {
    //             const today = new Date().toISOString().split('T')[0];
    //             const endDate = new Date().toISOString().split('T')[0];
    //             const startDate = new Date(
    //                 new Date().getFullYear(),
    //                 new Date().getMonth() - 3,
    //                 1).toISOString().split('T')[0];
    //             const transactions = await transactionService
    //                 .fetchTransactionsByUserAndDateRange(userId, startDate, endDate);
    //             const hasNoTransactions = !transactions || transactions.length === 0;
    //             const missingToday = !transactions?.some(t => t.date === today);
    //             if(!transactions || transactions.length === 0)
    //             {
    //                 await plaidTransactionImportService.importPlaidTransactions(userId, startDate, endDate);
    //             }
    //             // any transactions for the current date?
    //             else if(transactionsForToday.length == 0)
    //             {
    //                 await plaidTransactionImportService.importPlaidTransactions(userId, today, endDate);
    //             }
    //
    //         } catch(e) {
    //             console.error(e);
    //         }
    //     };
    //
    //     if (userId) syncPlaidTransactions();
    // }, [userId]);

    useEffect(() => {
        const load = async () => {
            try {
                setRecurringTransactions([
                    { id:1, name:'Netflix',       category:'Entertainment', amount:15.99,   frequency:'monthly', nextDue:'2026-02-20', daysUntilDue:5,  status:'due-soon', icon:<Replay sx={{fontSize:16}}/>,  color:'#e50914' },
                    { id:2, name:'Electric Bill', category:'Utilities',     amount:120.00,  frequency:'monthly', nextDue:'2026-02-25', daysUntilDue:10, status:'upcoming', icon:<Home sx={{fontSize:16}}/>,    color:AMBER },
                    { id:3, name:'Rent',          category:'Housing',       amount:1500.00, frequency:'monthly', nextDue:'2026-03-01', daysUntilDue:14, status:'upcoming', icon:<Home sx={{fontSize:16}}/>,    color:BLUE },
                    { id:4, name:'Gym',           category:'Health',        amount:45.00,   frequency:'monthly', nextDue:'2026-02-18', daysUntilDue:3,  status:'due-soon', icon:<Replay sx={{fontSize:16}}/>,  color:GREEN },
                ]);
                setRecentTransactions([
                    { id:1, date:'2026-01-30', description:'Grocery Store',   category:'Groceries',      amount:-125.50, balance:5240.50, type:'expense' },
                    { id:2, date:'2026-01-29', description:'Salary Deposit',  category:'Income',         amount:3500.00, balance:5366.00, type:'income'  },
                    { id:3, date:'2026-01-28', description:'Gas Station',     category:'Transportation', amount:-45.00,  balance:1866.00, type:'expense' },
                    { id:4, date:'2026-01-27', description:'Restaurant',      category:'Dining',         amount:-67.25,  balance:1911.00, type:'expense' },
                    { id:5, date:'2026-01-26', description:'Electric Bill',   category:'Utilities',      amount:-120.00, balance:1978.25, type:'expense' },
                ]);
                setBudgetGoals([
                    { id:1, name:'Dining Out',     current:245.50, target:300.00, percentage:81.8,  status:'on-track' },
                    { id:2, name:'Transportation', current:180.00, target:200.00, percentage:90.0,  status:'warning'  },
                    { id:3, name:'Entertainment',  current:95.00,  target:150.00, percentage:63.3,  status:'on-track' },
                    { id:4, name:'Shopping',       current:420.00, target:400.00, percentage:105.0, status:'exceeded' },
                ]);
                setGroceryBudget({ id:5, name:'Groceries', current:385.75, target:500.00, percentage:77.2, status:'on-track' });
                setTopCategories([
                    { category:'Groceries',      amount:385.75, percentage:28.5, icon:<ShoppingCart sx={{fontSize:15}}/>, color:GREEN  },
                    { category:'Dining',         amount:245.50, percentage:18.2, icon:<Restaurant sx={{fontSize:15}}/>,   color:AMBER  },
                    { category:'Transportation', amount:180.00, percentage:13.3, icon:<LocalGasStation sx={{fontSize:15}}/>, color:BLUE },
                    { category:'Utilities',      amount:165.00, percentage:12.2, icon:<Home sx={{fontSize:15}}/>,         color:PURPLE },
                ]);
                setTotalBudget({ current:1876.25, target:2500.00, percentage:75.1 });
                setRecentReceipts([
                    { id:1, store:'Whole Foods',  date:'Jan 29', time:'3:45 PM',  amount:87.43,  items:15, tags:['Organic'],     color:BLUE    },
                    { id:2, store:"Trader Joe's", date:'Jan 26', time:'6:15 PM',  amount:54.21,  items:9,  tags:['Saved $8.50'], color:'#92400e' },
                    { id:3, store:'Target',       date:'Jan 23', time:'11:30 AM', amount:123.85, items:23, tags:['RedCard 5%'],  color:RED     },
                    { id:4, store:'Costco',       date:'Jan 20', time:'2:00 PM',  amount:120.26, items:12, tags:['Bulk'],        color:GREEN   },
                ]);
            } catch (e) { console.error(e); }
        };
        if (userId) load();
    }, [userId]);

    useEffect(() => {
        const check = async () => {
            try {
                setCheckingTransactions(true);
                const last = localStorage.getItem('uploadReminderDismissed');
                if (last && (Date.now() - new Date(last).getTime()) / 3600000 < 24) { setCheckingTransactions(false); return; }
                const hasAccess = await userService.fetchUserOverrideEnabled(userId);
                if (!hasAccess) { setCheckingTransactions(false); return; }
                const now = new Date(); const prior = new Date(); prior.setDate(prior.getDate() - 14);
                const has = await csvUploadService.checkIfTransactionsExistForDateRange(userId, prior.toISOString().split('T')[0], now.toISOString().split('T')[0]);
                if (!has) setUploadReminderOpen(true);
            } catch (e) { console.error(e); }
            finally { setCheckingTransactions(false); }
        };
        if (userId) check();
    }, [userId]);

    const handleImportComplete = async (data: { file: File; startDate: string; endDate: string; institution: string }) => {
        setImportDialogOpen(false);
        setIsLoading(true);
        try {
            const r = await csvUploadService.uploadCsv({ userId, ...data });
            setSnackbarMessage(r.success ? 'CSV imported successfully!' : r.message || 'Import failed');
            setSnackbarSeverity(r.success ? 'success' : 'error');
            setSnackbarOpen(true);
        } catch { setSnackbarMessage('Failed to import CSV'); setSnackbarSeverity('error'); setSnackbarOpen(true); }
        finally { setIsLoading(false); }
    };

    const totalRecurringMonthly = recurringTransactions.filter(b => b.frequency === 'monthly').reduce((s, b) => s + b.amount, 0);
    const greetingHour = new Date().getHours();
    const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

    // ── Chart data ────────────────────────────────────────────────────────────
    const budgetStatusColor = (s: string) => s === 'exceeded' ? RED : s === 'warning' ? AMBER : TEAL;

    // Budget overview donut
    const budgetOverviewData = [
        { name: 'Spent',     value: totalBudget.current,                                color: totalBudget.percentage > 90 ? RED : MAROON },
        { name: 'Remaining', value: Math.max(totalBudget.target - totalBudget.current, 0), color: alpha('#000', 0.07) },
    ];

    // Per-category budget donut
    const categoryBudgetDonutData = budgetGoals.map(g => ({
        name:      g.name,
        value:     g.current,
        color:     budgetStatusColor(g.status),
        pct:       g.percentage,
        target:    g.target,
        status:    g.status,
    }));

    // Top spending donut
    const spendingDonutData = topCategories.map(c => ({ name: c.category, value: c.amount, color: c.color }));
    const totalSpending = topCategories.reduce((s, c) => s + c.amount, 0);

    // Receipts donut
    const receiptsDonutData = recentReceipts.map(r => ({ name: r.store, value: r.amount, color: r.color }));
    const totalReceiptsSpend = recentReceipts.reduce((s, r) => s + r.amount, 0);

    // Savings donut
    const savingsDonutData = [
        { name: 'Saved',     value: 8500, color: GREEN },
        { name: 'Remaining', value: 1500, color: alpha(GREEN, 0.1) },
    ];

    // ── Active shape factories — spending only, no budget comparison ──────────
    const ActiveBudget   = makeActiveShape({ totalLabel: 'of spending' });
    const ActiveSpending = makeActiveShape({ totalLabel: 'of spending' });
    const ActiveReceipts = makeActiveShape({ totalLabel: 'of grocery spend' });
    const ActiveSavings  = makeActiveShape({ totalLabel: 'of goal' });

    // ── Default (idle) center values per donut ────────────────────────────────
    // Show the top/first category's spending as the default highlighted slice
    const defaultBudgetIdx   = 0; // show first category by default
    const defaultSpendingIdx = 0; // show first category by default

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f5f5f7', minHeight: '100vh' }}>
            <Grid container>
                <Grid item xs={12} md={3} lg={2}><Sidebar /></Grid>

                <Grid item xs={12} md={9} lg={10}>
                    <Box component="main" sx={{ p: { xs: 2, sm: 3 } }}>

                        {/* ── Page header ── */}
                        <Box sx={{ mb: 3 }}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: alpha(MAROON, 0.55), mb: 0.4 }}>Overview</Typography>
                            <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: NAVY, letterSpacing: '-0.025em', lineHeight: 1.1, mb: 0.4 }}>
                                {greeting}, {userFullName?.split(' ')[0]} 👋
                            </Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: SLATE }}>Here's your financial overview for today</Typography>
                        </Box>

                        <Grid container spacing={2}>

                            {/* ══════════════════════════════════════════════
                                ROW 1 LEFT: Budget Overview
                            ══════════════════════════════════════════════ */}
                            <Grid item xs={12} lg={8}>
                                <Paper sx={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${alpha('#000', 0.07)}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}>
                                    <PanelHeader
                                        title="Budget Overview"
                                        badge={<Chip size="small" label={`${totalBudget.percentage.toFixed(0)}% used`} sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} />}
                                    />
                                    <Box sx={{ p: 2.5 }}>

                                        {/* ── Total budget donut + summary ── */}
                                        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 2.5 }}>
                                            <Box sx={{ flexShrink: 0 }}>
                                                <ResponsiveContainer width={130} height={130}>
                                                    <PieChart>
                                                        <Pie data={budgetOverviewData} cx={62} cy={62}
                                                             innerRadius={42} outerRadius={60}
                                                             paddingAngle={2} dataKey="value" strokeWidth={0}
                                                             startAngle={90} endAngle={-270}>
                                                            {budgetOverviewData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                                        </Pie>
                                                        <IdleCenter cx={62} cy={62}
                                                                    primary={`${totalBudget.percentage.toFixed(0)}%`}
                                                                    secondary="used" />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', color: NAVY, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                                                    ${totalBudget.current.toLocaleString()}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.72rem', color: SLATE, mb: 1.25 }}>
                                                    of ${totalBudget.target.toLocaleString()} monthly budget
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 2 }}>
                                                    <Box>
                                                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: SLATE }}>Remaining</Typography>
                                                        <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: GREEN, fontVariantNumeric: 'tabular-nums' }}>
                                                            ${(totalBudget.target - totalBudget.current).toLocaleString()}
                                                        </Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: SLATE }}>Categories</Typography>
                                                        <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: NAVY }}>{budgetGoals.length}</Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Box>

                                        <Divider sx={{ mb: 2.5 }} />

                                        {/* ══ SECTION: Category Budgets — interactive donut ══ */}
                                        <SectionLabel>Category Budgets</SectionLabel>

                                        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                            {/* Interactive donut — default shows first category */}
                                            <Box sx={{ flexShrink: 0 }}>
                                                <ResponsiveContainer width={200} height={200}>
                                                    <PieChart>
                                                        {/* Outer ring: spent per category */}
                                                        <Pie
                                                            activeIndex={budgetActiveIdx !== undefined ? budgetActiveIdx : defaultBudgetIdx}
                                                            activeShape={ActiveBudget}
                                                            data={categoryBudgetDonutData}
                                                            cx={97} cy={97}
                                                            innerRadius={58} outerRadius={82}
                                                            paddingAngle={3} dataKey="value" strokeWidth={0}
                                                            onMouseEnter={(_, i) => setBudgetActiveIdx(i)}
                                                            onMouseLeave={() => setBudgetActiveIdx(undefined)}
                                                        >
                                                            {categoryBudgetDonutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                                        </Pie>
                                                        {/* Inner ghost ring: target scale */}
                                                        <Pie
                                                            data={categoryBudgetDonutData}
                                                            cx={97} cy={97}
                                                            innerRadius={50} outerRadius={56}
                                                            paddingAngle={3} dataKey="target" strokeWidth={0}
                                                        >
                                                            {categoryBudgetDonutData.map((d, i) => <Cell key={i} fill={alpha(d.color, 0.18)} />)}
                                                        </Pie>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <Typography sx={{ fontSize: '0.6rem', color: alpha(SLATE, 0.6), textAlign: 'center', mt: -1 }}>
                                                    Hover a slice or row
                                                </Typography>
                                            </Box>

                                            {/* Category rows — hover syncs with donut */}
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                {budgetGoals.map((g, i) => {
                                                    const sc        = budgetStatusColor(g.status);
                                                    const isActive  = (budgetActiveIdx !== undefined ? budgetActiveIdx : defaultBudgetIdx) === i;
                                                    return (
                                                        <Box key={g.id}
                                                             onMouseEnter={() => setBudgetActiveIdx(i)}
                                                             onMouseLeave={() => setBudgetActiveIdx(undefined)}
                                                             sx={{
                                                                 mb: i < budgetGoals.length - 1 ? 1.5 : 0,
                                                                 p: 1, borderRadius: '8px', cursor: 'default',
                                                                 border: `1px solid ${isActive ? alpha(sc, 0.35) : 'transparent'}`,
                                                                 bgcolor: isActive ? alpha(sc, 0.06) : 'transparent',
                                                                 transition: 'all 0.15s ease',
                                                             }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                    <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: sc, flexShrink: 0 }} />
                                                                    <Typography sx={{ fontWeight: isActive ? 800 : 700, fontSize: '0.78rem', color: NAVY }}>{g.name}</Typography>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
                                                                    <Typography sx={{ fontSize: '0.68rem', color: SLATE, fontVariantNumeric: 'tabular-nums' }}>
                                                                        ${g.current.toFixed(0)} / ${g.target.toFixed(0)}
                                                                    </Typography>
                                                                    <Box sx={{ px: 0.7, py: 0.1, borderRadius: '4px', bgcolor: alpha(sc, 0.12), minWidth: 36, textAlign: 'center' }}>
                                                                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: sc }}>{g.percentage.toFixed(0)}%</Typography>
                                                                    </Box>
                                                                </Box>
                                                            </Box>
                                                            <LinearProgress variant="determinate" value={Math.min(g.percentage, 100)}
                                                                            sx={{ height: 5, borderRadius: 3, bgcolor: alpha(sc, 0.12), '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: sc } }} />
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        </Box>

                                        <Divider sx={{ my: 2.5 }} />

                                        {/* ══ SECTION: Top Spending — interactive donut ══ */}
                                        <SectionLabel>Top Spending — Last Week</SectionLabel>

                                        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                            {/* Interactive donut — default shows first category */}
                                            <Box sx={{ flexShrink: 0 }}>
                                                <ResponsiveContainer width={200} height={200}>
                                                    <PieChart>
                                                        <Pie
                                                            activeIndex={spendingActiveIdx !== undefined ? spendingActiveIdx : defaultSpendingIdx}
                                                            activeShape={ActiveSpending}
                                                            data={spendingDonutData}
                                                            cx={97} cy={97}
                                                            innerRadius={58} outerRadius={82}
                                                            paddingAngle={3} dataKey="value" strokeWidth={0}
                                                            onMouseEnter={(_, i) => setSpendingActiveIdx(i)}
                                                            onMouseLeave={() => setSpendingActiveIdx(undefined)}
                                                        >
                                                            {spendingDonutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                                        </Pie>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <Typography sx={{ fontSize: '0.6rem', color: alpha(SLATE, 0.6), textAlign: 'center', mt: -1 }}>
                                                    Hover a slice or row
                                                </Typography>
                                            </Box>

                                            {/* Category breakdown — hover syncs */}
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                {topCategories.map((cat, i) => {
                                                    const isActive = (spendingActiveIdx !== undefined ? spendingActiveIdx : defaultSpendingIdx) === i;
                                                    return (
                                                        <Box key={i}
                                                             onMouseEnter={() => setSpendingActiveIdx(i)}
                                                             onMouseLeave={() => setSpendingActiveIdx(undefined)}
                                                             sx={{
                                                                 mb: i < topCategories.length - 1 ? 1.5 : 0,
                                                                 p: 1, borderRadius: '8px', cursor: 'default',
                                                                 border: `1px solid ${isActive ? alpha(cat.color, 0.35) : 'transparent'}`,
                                                                 bgcolor: isActive ? alpha(cat.color, 0.06) : 'transparent',
                                                                 transition: 'all 0.15s ease',
                                                             }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                    <Box sx={{ width: 24, height: 24, borderRadius: '6px', bgcolor: alpha(cat.color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: cat.color, flexShrink: 0 }}>
                                                                        {cat.icon}
                                                                    </Box>
                                                                    <Typography sx={{ fontWeight: isActive ? 800 : 700, fontSize: '0.8rem', color: NAVY }}>{cat.category}</Typography>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Typography sx={{ fontSize: '0.68rem', color: SLATE }}>{cat.percentage.toFixed(1)}%</Typography>
                                                                    <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: isActive ? cat.color : NAVY, fontVariantNumeric: 'tabular-nums', minWidth: 56, textAlign: 'right', transition: 'color 0.15s' }}>
                                                                        ${cat.amount.toFixed(2)}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                            <LinearProgress variant="determinate" value={cat.percentage}
                                                                            sx={{ height: 4, borderRadius: 2, bgcolor: alpha(cat.color, 0.12), '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: cat.color } }} />
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        </Box>

                                    </Box>
                                </Paper>
                            </Grid>

                            {/* ══════════════════════════════════════════════
                                ROW 1 RIGHT: Recurring Bills
                            ══════════════════════════════════════════════ */}
                            <Grid item xs={12} lg={4}>
                                <Paper sx={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${alpha('#000', 0.07)}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}>
                                    <PanelHeader
                                        title="Recurring Bills"
                                        badge={<Chip size="small" label={`${recurringTransactions.length} active`} sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} />}
                                    />
                                    <Box sx={{ p: 2.5 }}>
                                        <Stack spacing={0}>
                                            {[...recurringTransactions].sort((a, b) => a.daysUntilDue - b.daysUntilDue).map(bill => (
                                                <BillRow key={bill.id} bill={bill} />
                                            ))}
                                        </Stack>
                                        <Box sx={{ mt: 2.5, p: 1.75, borderRadius: '10px', bgcolor: alpha(MAROON, 0.04), border: `1px solid ${alpha(MAROON, 0.12)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: NAVY }}>Monthly Total</Typography>
                                            <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', color: MAROON, fontVariantNumeric: 'tabular-nums' }}>
                                                ${totalRecurringMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* ══════════════════════════════════════════════
                                ROW 2 LEFT: Grocery Tracker — Receipts Donut
                            ══════════════════════════════════════════════ */}
                            {groceryBudget && (
                                <Grid item xs={12} lg={8}>
                                    <Paper sx={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${alpha('#000', 0.07)}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                                        <PanelHeader title="Grocery Tracker" />
                                        <Box sx={{ p: 2.5 }}>

                                            {/* Grocery budget bar */}
                                            <Box sx={{ p: 2, mb: 2.5, borderRadius: '12px', border: `1px solid ${alpha(TEAL, 0.2)}`, bgcolor: alpha(TEAL, 0.04), display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: alpha(TEAL, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <ShoppingCart sx={{ color: TEAL, fontSize: 22 }} />
                                                </Box>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                        <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: NAVY }}>Grocery Budget</Typography>
                                                        <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: TEAL }}>{groceryBudget.percentage.toFixed(0)}%</Typography>
                                                    </Box>
                                                    <LinearProgress variant="determinate" value={Math.min(groceryBudget.percentage, 100)} sx={{ height: 5, borderRadius: 3, mb: 0.5, bgcolor: alpha(TEAL, 0.12), '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: TEAL } }} />
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography sx={{ fontSize: '0.65rem', color: SLATE, fontVariantNumeric: 'tabular-nums' }}>${groceryBudget.current.toFixed(2)} spent</Typography>
                                                        <Typography sx={{ fontSize: '0.65rem', color: GREEN, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>${(groceryBudget.target - groceryBudget.current).toFixed(2)} left</Typography>
                                                    </Box>
                                                </Box>
                                            </Box>

                                            {/* ══ Receipts: interactive donut + list ══ */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.75 }}>
                                                <SectionLabel>Recent Receipts</SectionLabel>
                                                <Button size="small" sx={{ textTransform: 'none', color: MAROON, fontWeight: 700, fontSize: '0.72rem', p: 0.5, mb: 1.25, '&:hover': { bgcolor: alpha(MAROON, 0.05) } }}>View All</Button>
                                            </Box>

                                            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                                                {/* Receipts donut — default shows first receipt */}
                                                <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <ResponsiveContainer width={180} height={180}>
                                                        <PieChart>
                                                            <Pie
                                                                activeIndex={receiptsActiveIdx !== undefined ? receiptsActiveIdx : 0}
                                                                activeShape={ActiveReceipts}
                                                                data={receiptsDonutData}
                                                                cx={87} cy={87}
                                                                innerRadius={52} outerRadius={76}
                                                                paddingAngle={3} dataKey="value" strokeWidth={0}
                                                                onMouseEnter={(_, i) => setReceiptsActiveIdx(i)}
                                                                onMouseLeave={() => setReceiptsActiveIdx(undefined)}
                                                            >
                                                                {receiptsDonutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                                            </Pie>
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    {/* Legend */}
                                                    <Box sx={{ mt: 0.5, width: '100%' }}>
                                                        {recentReceipts.map((r, i) => (
                                                            <Box key={r.id}
                                                                 onMouseEnter={() => setReceiptsActiveIdx(i)}
                                                                 onMouseLeave={() => setReceiptsActiveIdx(undefined)}
                                                                 sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.4, cursor: 'default', px: 0.5, py: 0.25, borderRadius: '5px',
                                                                     bgcolor: (receiptsActiveIdx !== undefined ? receiptsActiveIdx : 0) === i ? alpha(r.color, 0.08) : 'transparent',
                                                                     transition: 'background 0.15s' }}>
                                                                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: r.color, flexShrink: 0 }} />
                                                                <Typography sx={{ fontSize: '0.68rem', color: (receiptsActiveIdx !== undefined ? receiptsActiveIdx : 0) === i ? NAVY : SLATE, fontWeight: (receiptsActiveIdx !== undefined ? receiptsActiveIdx : 0) === i ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                                                                    {r.store}
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                    <Typography sx={{ fontSize: '0.6rem', color: alpha(SLATE, 0.6), textAlign: 'center', mt: 0.75 }}>
                                                        Hover a slice or row
                                                    </Typography>
                                                </Box>

                                                {/* Receipts detail list — hover syncs */}
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    {recentReceipts.map((r, i) => {
                                                        const isActive = (receiptsActiveIdx !== undefined ? receiptsActiveIdx : 0) === i;
                                                        return (
                                                            <Box key={r.id}
                                                                 onMouseEnter={() => setReceiptsActiveIdx(i)}
                                                                 onMouseLeave={() => setReceiptsActiveIdx(undefined)}
                                                                 sx={{
                                                                     display: 'flex', alignItems: 'center', gap: 1.25, py: 1.1,
                                                                     borderLeft: `3px solid ${r.color}`, pl: 1.25,
                                                                     borderBottom: i < recentReceipts.length - 1 ? `1px solid ${alpha('#000', 0.05)}` : 'none',
                                                                     borderRadius: isActive ? '0 8px 8px 0' : '0',
                                                                     bgcolor: isActive ? alpha(r.color, 0.05) : 'transparent',
                                                                     cursor: 'default', transition: 'background 0.15s',
                                                                 }}>
                                                                <Box sx={{ width: 30, height: 30, borderRadius: '7px', bgcolor: alpha(r.color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.color, flexShrink: 0 }}>
                                                                    <ShoppingCart sx={{ fontSize: 14 }} />
                                                                </Box>
                                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                    <Typography sx={{ fontWeight: isActive ? 800 : 700, fontSize: '0.8rem', color: NAVY, transition: 'font-weight 0.15s' }}>{r.store}</Typography>
                                                                    <Box sx={{ display: 'flex', gap: 0.4, mt: 0.2, flexWrap: 'wrap' }}>
                                                                        <Chip size="small" label={`${r.items} items`} sx={{ height: 14, fontSize: '0.56rem', fontWeight: 700, bgcolor: alpha(BLUE, 0.08), color: BLUE }} />
                                                                        {r.tags.map((tag, ti) => (
                                                                            <Chip key={ti} size="small" label={tag} sx={{ height: 14, fontSize: '0.56rem', fontWeight: 700, bgcolor: tag.includes('Saved') ? alpha(GREEN, 0.08) : alpha(r.color, 0.08), color: tag.includes('Saved') ? GREEN : r.color }} />
                                                                        ))}
                                                                    </Box>
                                                                </Box>
                                                                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                                                    <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: isActive ? r.color : NAVY, fontVariantNumeric: 'tabular-nums', transition: 'color 0.15s' }}>${r.amount.toFixed(2)}</Typography>
                                                                    <Typography sx={{ fontSize: '0.62rem', color: SLATE }}>{r.date}</Typography>
                                                                </Box>
                                                            </Box>
                                                        );
                                                    })}

                                                    {/* Summary strip */}
                                                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                                        {[
                                                            { label: 'Avg per trip', value: `$${(totalReceiptsSpend / recentReceipts.length).toFixed(2)}`, color: MAROON },
                                                            { label: 'Total trips',  value: String(recentReceipts.length), color: BLUE },
                                                            { label: 'Total saved',  value: '$8.50', color: GREEN },
                                                        ].map(({ label, value, color }) => (
                                                            <Box key={label} sx={{ flex: 1, p: 1.25, borderRadius: '8px', bgcolor: alpha(color, 0.06), border: `1px solid ${alpha(color, 0.15)}`, textAlign: 'center' }}>
                                                                <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</Typography>
                                                                <Typography sx={{ fontSize: '0.92rem', fontWeight: 900, color, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Grid>
                            )}

                            {/* ══════════════════════════════════════════════
                                ROW 2 RIGHT: Savings Goal — interactive donut
                            ══════════════════════════════════════════════ */}
                            <Grid item xs={12} lg={4}>
                                <Paper sx={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${alpha('#000', 0.07)}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}>
                                    <PanelHeader
                                        title="Savings Goal"
                                        action={<Button size="small" sx={{ textTransform: 'none', color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '0.72rem', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>Manage</Button>}
                                    />
                                    <Box sx={{ p: 2.5 }}>
                                        {/* Interactive savings donut — default shows "Saved" slice */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                                            <ResponsiveContainer width={200} height={200}>
                                                <PieChart>
                                                    <Pie
                                                        activeIndex={savingsActiveIdx !== undefined ? savingsActiveIdx : 0}
                                                        activeShape={ActiveSavings}
                                                        data={savingsDonutData}
                                                        cx={97} cy={97}
                                                        innerRadius={60} outerRadius={86}
                                                        paddingAngle={3} dataKey="value" strokeWidth={0}
                                                        startAngle={90} endAngle={-270}
                                                        onMouseEnter={(_, i) => setSavingsActiveIdx(i)}
                                                        onMouseLeave={() => setSavingsActiveIdx(undefined)}
                                                    >
                                                        {savingsDonutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <Typography sx={{ fontSize: '0.6rem', color: alpha(SLATE, 0.6), mt: -1 }}>Hover to explore</Typography>

                                            <Box sx={{ textAlign: 'center', mt: 1 }}>
                                                <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: alpha(GREEN, 0.8), mb: 0.3 }}>Emergency Fund</Typography>
                                                <Typography sx={{ fontSize: '1.75rem', fontWeight: 900, color: '#15803d', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>$8,500</Typography>
                                                <Typography sx={{ fontSize: '0.7rem', color: SLATE, mt: 0.25 }}>Goal: $10,000</Typography>
                                                <Chip size="small" icon={<CheckCircle sx={{ fontSize: 12 }} />} label="On Track"
                                                      sx={{ mt: 1, bgcolor: alpha(GREEN, 0.12), color: '#15803d', fontWeight: 800, fontSize: '0.65rem', border: `1px solid ${alpha(GREEN, 0.25)}` }} />
                                            </Box>
                                        </Box>

                                        <Box sx={{ p: 1.75, borderRadius: '10px', border: `1px solid ${alpha('#000', 0.07)}`, bgcolor: '#fafafa' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: NAVY }}>Monthly Target</Typography>
                                                <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: NAVY, fontVariantNumeric: 'tabular-nums' }}>$500</Typography>
                                            </Box>
                                            <Divider sx={{ my: 1 }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: NAVY }}>Saved This Month</Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: GREEN, fontVariantNumeric: 'tabular-nums' }}>$500</Typography>
                                                    <CheckCircle sx={{ fontSize: 16, color: GREEN }} />
                                                </Box>
                                            </Box>
                                        </Box>

                                        <Typography sx={{ fontSize: '0.65rem', color: SLATE, textAlign: 'center', mt: 1.75 }}>$1,500 remaining to reach your goal</Typography>
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* ══════════════════════════════════════════════
                                ROW 3: Recent Transactions
                            ══════════════════════════════════════════════ */}
                            <Grid item xs={12}>
                                <Paper sx={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${alpha('#000', 0.07)}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                                    <PanelHeader
                                        title="Recent Transactions"
                                        action={<Button size="small" sx={{ textTransform: 'none', color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '0.72rem', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>View All</Button>}
                                    />
                                    <Box sx={{ p: 2 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    {['Date', 'Description', 'Category', 'Amount', 'Balance'].map((h, i) => (
                                                        <TableCell key={h} align={i >= 3 ? 'right' : 'left'}
                                                                   sx={{ fontWeight: 800, fontSize: '0.62rem', color: alpha(MAROON, 0.65), textTransform: 'uppercase', letterSpacing: '0.07em', pb: 0.75, borderBottom: `1px solid ${alpha(MAROON, 0.12)}` }}>
                                                            {h}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {recentTransactions.map(tx => (
                                                    <TableRow key={tx.id} sx={{
                                                        borderLeft: `3px solid ${tx.type === 'income' ? GREEN : RED}`,
                                                        '&:hover': { bgcolor: alpha(MAROON, 0.02), cursor: 'pointer' },
                                                        '&:last-child td': { border: 0 },
                                                    }}>
                                                        <TableCell sx={{ py: 1.2, color: SLATE, fontWeight: 600, fontSize: '0.75rem' }}>
                                                            {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </TableCell>
                                                        <TableCell sx={{ py: 1.2 }}>
                                                            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: NAVY }}>{tx.description}</Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ py: 1.2 }}>
                                                            <Chip size="small" label={tx.category} sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: alpha('#000', 0.05), color: SLATE }} />
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ py: 1.2, fontWeight: 800, fontSize: '0.82rem', color: tx.type === 'income' ? GREEN : RED, fontVariantNumeric: 'tabular-nums' }}>
                                                            {tx.type === 'income' ? '+' : '−'}${Math.abs(tx.amount).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ py: 1.2, fontWeight: 700, fontSize: '0.78rem', color: NAVY, fontVariantNumeric: 'tabular-nums' }}>
                                                            ${tx.balance.toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </Box>
                                </Paper>
                            </Grid>

                        </Grid>
                    </Box>
                </Grid>
            </Grid>

            {/* ── Loading backdrop ── */}
            <Backdrop open={isLoading} sx={{ color: '#fff', zIndex: t => t.zIndex.drawer + 1, bgcolor: 'rgba(0,0,0,0.7)' }}>
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress color="inherit" size={50} />
                    <Typography sx={{ mt: 2, fontWeight: 600 }}>Importing CSV data…</Typography>
                </Box>
            </Backdrop>

            {/* ── Upload reminder dialog ── */}
            <Dialog open={uploadReminderOpen} onClose={() => setUploadReminderOpen(false)} maxWidth="sm" fullWidth
                    PaperProps={{ sx: { borderRadius: '14px', border: `1px solid ${alpha(AMBER, 0.2)}` } }}>
                <Box sx={{ px: 3, pt: 3, pb: 0 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ width: 42, height: 42, borderRadius: '10px', bgcolor: alpha(AMBER, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <AlertCircle size={20} color={AMBER} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: NAVY }}>Upload Reminder</Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: SLATE }}>No recent transactions detected</Typography>
                        </Box>
                    </Box>
                    <Alert severity="warning" sx={{ borderRadius: '8px', fontSize: '0.75rem', mb: 2 }}>
                        <AlertTitle sx={{ fontWeight: 700 }}>No Transactions Found</AlertTitle>
                        We haven't detected any transactions in the last 2 weeks. Upload your recent data to keep your budget accurate.
                    </Alert>
                    <Box component="ul" sx={{ mt: 0.5, pl: 2.5, mb: 2.5, '& li': { fontSize: '0.75rem', color: SLATE, mb: 0.5 } }}>
                        <li>Track spending habits accurately</li><li>Stay on top of your budget</li><li>Identify trends and patterns</li>
                    </Box>
                </Box>
                <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                    <Button variant="outlined" onClick={() => { setUploadReminderOpen(false); localStorage.setItem('uploadReminderDismissed', new Date().toISOString()); }}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: alpha('#000', 0.2), color: SLATE }}>
                        Remind Me Later
                    </Button>
                    <Button variant="contained" startIcon={<Upload size={14} />}
                            onClick={() => { setUploadReminderOpen(false); setImportDialogOpen(true); }}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, background: MAROON_GRAD, '&:hover': { background: `linear-gradient(135deg, ${MAROON} 0%, ${MAROON2} 100%)` } }}>
                        Upload Now
                    </Button>
                </DialogActions>
            </Dialog>

            <CSVImportDialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} onImport={handleImportComplete} />

            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <SnackbarAlert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ borderRadius: '10px', fontWeight: 500 }}>
                    {snackbarMessage}
                </SnackbarAlert>
            </Snackbar>
        </Box>
    );
};

export default DashboardPage;
// import React, {useEffect, useState} from 'react';
// import {
//     Box,
//     Grid,
//     Typography,
//     Paper,
//     Button,
//     LinearProgress,
//     Chip,
//     Card,
//     CardContent,
//     Avatar,
//     Divider,
//     useMediaQuery,
//     useTheme,
//     Dialog,
//     DialogTitle,
//     AlertTitle,
//     Alert,
//     DialogContent,
//     DialogActions,
//     Backdrop,
//     CircularProgress,
//     Snackbar,
//     Table,
//     TableBody,
//     TableCell,
//     TableContainer,
//     TableHead,
//     TableRow,
//     IconButton,
// } from '@mui/material';
// import MuiAlert, { AlertProps } from '@mui/material/Alert';
// import {
//     TrendingUp,
//     TrendingDown,
//     AccountBalance,
//     Savings,
//     CreditCard,
//     ShoppingCart,
//     Restaurant,
//     LocalGasStation,
//     Home,
//     MoreVert,
//     CheckCircle,
//     Warning,
//     ArrowUpward,
//     ArrowDownward,
//     CalendarToday,
//     Replay,
//     Schedule,
// } from '@mui/icons-material';
// import {AlertCircle, Upload} from "lucide-react";
// import Sidebar from "./Sidebar";
// import PlaidService from "../services/PlaidService";
// import UserService from '../services/UserService';
// import CsvUploadService from "../services/CsvUploadService";
// import CSVImportDialog from "./CSVImportDialog";
//
// const SnackbarAlert = React.forwardRef<HTMLDivElement, AlertProps>(
//     function SnackbarAlert(props, ref) {
//         return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
//     }
// );
//
// interface Receipt {
//     id: number;
//     store: string;
//     date: string;
//     time: string;
//     amount: number;
//     items: number;
//     tags: string[];
//     color: string;
// }
//
// interface RecurringTransaction {
//     id: number;
//     name: string;
//     category: string;
//     amount: number;
//     frequency: 'monthly' | 'weekly' | 'yearly';
//     nextDue: string;
//     daysUntilDue: number;
//     status: 'upcoming' | 'due-soon' | 'overdue';
//     icon: React.ReactNode;
//     color: string;
// }
//
// interface Transaction {
//     id: number;
//     date: string;
//     description: string;
//     category: string;
//     amount: number;
//     balance: number;
//     type: 'income' | 'expense';
// }
//
// interface BudgetGoal {
//     id: number;
//     name: string;
//     current: number;
//     target: number;
//     percentage: number;
//     status: 'on-track' | 'warning' | 'exceeded';
// }
//
// interface CategorySpending {
//     category: string;
//     amount: number;
//     percentage: number;
//     icon: React.ReactNode;
//     color: string;
// }
//
// const DashboardPage: React.FC = () => {
//     const [uploadReminderOpen, setUploadReminderOpen] = useState<boolean>(false);
//     const [checkingTransactions, setCheckingTransactions] = useState<boolean>(false);
//     const [isLoading, setIsLoading] = useState<boolean>(false);
//     const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
//     const [snackbarMessage, setSnackbarMessage] = useState<string>('');
//     const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
//     const [error, setError] = useState<string | null>(null);
//     const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);
//
//     // Data states
//     const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
//     const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
//     const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
//     const [groceryBudget, setGroceryBudget] = useState<BudgetGoal | null>(null);
//     const [topCategories, setTopCategories] = useState<CategorySpending[]>([]);
//     const [totalBudget, setTotalBudget] = useState({ current: 0, target: 0, percentage: 0 });
//     const [recentReceipts, setRecentReceipts] = useState<Receipt[]>([]);
//
//
//     const userFullName = sessionStorage.getItem('fullName');
//     const userId = Number(sessionStorage.getItem('userId'));
//     const theme = useTheme();
//     const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
//     const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));
//     const plaidService = PlaidService.getInstance();
//     const userService = UserService.getInstance();
//     const csvUploadService = new CsvUploadService();
//
//     useEffect(() => {
//         document.title = "Dashboard";
//         return () => {
//             document.title = "Dashboard";
//         };
//     }, []);
//
//     // Load dashboard data
//     useEffect(() => {
//         const loadDashboardData = async () => {
//             try {
//                 // TODO: Replace with actual API calls
//                 // Mock data for demonstration
//                 setRecurringTransactions([
//                     {
//                         id: 1,
//                         name: 'Netflix Subscription',
//                         category: 'Entertainment',
//                         amount: 15.99,
//                         frequency: 'monthly',
//                         nextDue: '2026-02-20',
//                         daysUntilDue: 5,
//                         status: 'due-soon',
//                         icon: <Replay />,
//                         color: '#e50914'
//                     },
//                     {
//                         id: 2,
//                         name: 'Electric Bill',
//                         category: 'Utilities',
//                         amount: 120.00,
//                         frequency: 'monthly',
//                         nextDue: '2026-02-25',
//                         daysUntilDue: 10,
//                         status: 'upcoming',
//                         icon: <Home />,
//                         color: '#f59e0b'
//                     },
//                     {
//                         id: 3,
//                         name: 'Rent Payment',
//                         category: 'Housing',
//                         amount: 1500.00,
//                         frequency: 'monthly',
//                         nextDue: '2026-03-01',
//                         daysUntilDue: 14,
//                         status: 'upcoming',
//                         icon: <Home />,
//                         color: '#3b82f6'
//                     },
//                     {
//                         id: 4,
//                         name: 'Gym Membership',
//                         category: 'Health',
//                         amount: 45.00,
//                         frequency: 'monthly',
//                         nextDue: '2026-02-18',
//                         daysUntilDue: 3,
//                         status: 'due-soon',
//                         icon: <Replay />,
//                         color: '#10b981'
//                     }
//                 ]);
//
//                 setRecentTransactions([
//                     { id: 1, date: '2026-01-30', description: 'Grocery Store', category: 'Groceries', amount: -125.50, balance: 5240.50, type: 'expense' },
//                     { id: 2, date: '2026-01-29', description: 'Salary Deposit', category: 'Income', amount: 3500.00, balance: 5366.00, type: 'income' },
//                     { id: 3, date: '2026-01-28', description: 'Gas Station', category: 'Transportation', amount: -45.00, balance: 1866.00, type: 'expense' },
//                     { id: 4, date: '2026-01-27', description: 'Restaurant', category: 'Dining', amount: -67.25, balance: 1911.00, type: 'expense' },
//                     { id: 5, date: '2026-01-26', description: 'Electric Bill', category: 'Utilities', amount: -120.00, balance: 1978.25, type: 'expense' },
//                 ]);
//
//                 setBudgetGoals([
//                     { id: 1, name: 'Dining Out', current: 245.50, target: 300.00, percentage: 81.8, status: 'on-track' },
//                     { id: 2, name: 'Transportation', current: 180.00, target: 200.00, percentage: 90.0, status: 'warning' },
//                     { id: 3, name: 'Entertainment', current: 95.00, target: 150.00, percentage: 63.3, status: 'on-track' },
//                     { id: 4, name: 'Shopping', current: 420.00, target: 400.00, percentage: 105.0, status: 'exceeded' },
//                 ]);
//
//                 setGroceryBudget({ id: 5, name: 'Groceries', current: 385.75, target: 500.00, percentage: 77.2, status: 'on-track' });
//
//                 setTopCategories([
//                     { category: 'Groceries', amount: 385.75, percentage: 28.5, icon: <ShoppingCart />, color: '#10b981' },
//                     { category: 'Dining', amount: 245.50, percentage: 18.2, icon: <Restaurant />, color: '#f59e0b' },
//                     { category: 'Transportation', amount: 180.00, percentage: 13.3, icon: <LocalGasStation />, color: '#3b82f6' },
//                     { category: 'Utilities', amount: 165.00, percentage: 12.2, icon: <Home />, color: '#8b5cf6' },
//                 ]);
//
//                 setTotalBudget({ current: 1876.25, target: 2500.00, percentage: 75.1 });
//
//                 setRecentReceipts([
//                     {
//                         id: 1,
//                         store: 'Whole Foods',
//                         date: 'Jan 29, 2026',
//                         time: '3:45 PM',
//                         amount: 87.43,
//                         items: 15,
//                         tags: ['Organic'],
//                         color: '#2563eb'
//                     },
//                     {
//                         id: 2,
//                         store: "Trader Joe's",
//                         date: 'Jan 26, 2026',
//                         time: '6:15 PM',
//                         amount: 54.21,
//                         items: 9,
//                         tags: ['Saved $8.50'],
//                         color: '#92400e'
//                     },
//                     {
//                         id: 3,
//                         store: 'Target',
//                         date: 'Jan 23, 2026',
//                         time: '11:30 AM',
//                         amount: 123.85,
//                         items: 23,
//                         tags: ['RedCard 5%'],
//                         color: '#991b1b'
//                     },
//                     {
//                         id: 4,
//                         store: 'Costco',
//                         date: 'Jan 20, 2026',
//                         time: '2:00 PM',
//                         amount: 120.26,
//                         items: 12,
//                         tags: ['Bulk'],
//                         color: '#15803d'
//                     }
//                 ]);
//
//             } catch (error) {
//                 console.error('Error loading dashboard data:', error);
//             }
//         };
//
//         if (userId) {
//             loadDashboardData();
//         }
//     }, [userId]);
//
//     const handleUploadNow = () => {
//         setUploadReminderOpen(false);
//         setImportDialogOpen(true);
//     };
//
//     const handleRemindLater = () => {
//         setUploadReminderOpen(false);
//         localStorage.setItem('uploadReminderDismissed', new Date().toISOString());
//     };
//
//     const handleImportClose = () => {
//         setImportDialogOpen(false);
//     };
//
//     useEffect(() => {
//         const checkRecentTransactions = async () => {
//             try {
//                 setCheckingTransactions(true);
//
//                 // Check if user dismissed the reminder recently
//                 const lastDismissed = localStorage.getItem('uploadReminderDismissed');
//                 if (lastDismissed) {
//                     const dismissedDate = new Date(lastDismissed);
//                     const now = new Date();
//                     const hoursSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60);
//
//                     // Don't show if dismissed within the last 24 hours
//                     if (hoursSinceDismissed < 24) {
//                         setCheckingTransactions(false);
//                         return;
//                     }
//                 }
//
//                 // First, check if user has override_upload_enabled
//                 const userHasOverrideUploadAccess = await userService.fetchUserOverrideEnabled(userId);
//
//                 if (!userHasOverrideUploadAccess) {
//                     // Don't show dialog if override is not enabled
//                     setCheckingTransactions(false);
//                     return;
//                 }
//
//                 // Calculate date range (current date to 2 weeks prior)
//                 const currentDate = new Date();
//                 const twoWeeksAgo = new Date();
//                 twoWeeksAgo.setDate(currentDate.getDate() - 14);
//
//                 const endDate = currentDate.toISOString().split('T')[0];
//                 const startDate = twoWeeksAgo.toISOString().split('T')[0];
//
//                 // Fetch CSV transactions for the last 2 weeks
//                 const hasRecentTransactions = await csvUploadService.checkIfTransactionsExistForDateRange(
//                     userId,
//                     startDate,
//                     endDate
//                 );
//                 console.log('hasRecentTransactions:', hasRecentTransactions);
//
//                 // Show dialog if no transactions found
//                 if (!hasRecentTransactions) {
//                     setUploadReminderOpen(true);
//                 }
//
//             } catch (error) {
//                 console.error('Error checking recent transactions:', error);
//             } finally {
//                 setCheckingTransactions(false);
//             }
//         };
//
//         if (userId) {
//             checkRecentTransactions();
//         }
//     }, [userId]); // Only depend on userId to avoid re-running unnecessarily
//
//     const handleImportComplete = async (data: {file: File, startDate: string, endDate: string, institution: string}) => {
//         setImportDialogOpen(false);
//         try {
//             setIsLoading(true);
//             const result = await csvUploadService.uploadCsv({
//                 userId: userId,
//                 file: data.file,
//                 startDate: data.startDate,
//                 endDate: data.endDate,
//                 institution: data.institution
//             });
//
//             if(result.success) {
//                 setSnackbarMessage('CSV file imported successfully!');
//                 setSnackbarSeverity('success');
//                 setSnackbarOpen(true);
//                 // Reload dashboard data
//             } else {
//                 setSnackbarMessage(result.message || 'Import failed');
//                 setSnackbarSeverity('error');
//                 setSnackbarOpen(true);
//             }
//         } catch (error) {
//             console.error('Error importing CSV:', error);
//             setSnackbarMessage('Failed to import CSV file');
//             setSnackbarSeverity('error');
//             setSnackbarOpen(true);
//         } finally {
//             setIsLoading(false);
//         }
//     };
//
//     const handleSnackbarClose = () => {
//         setSnackbarOpen(false);
//     };
//
//     const getStatusColor = (status: string) => {
//         switch (status) {
//             case 'on-track':
//                 return '#10b981';
//             case 'warning':
//                 return '#f59e0b';
//             case 'exceeded':
//                 return '#ef4444';
//             default:
//                 return '#6b7280';
//         }
//     };
//
//     const getStatusIcon = (status: string) => {
//         switch (status) {
//             case 'on-track':
//                 return <CheckCircle sx={{ fontSize: 20, color: '#10b981' }} />;
//             case 'warning':
//                 return <Warning sx={{ fontSize: 20, color: '#f59e0b' }} />;
//             case 'exceeded':
//                 return <Warning sx={{ fontSize: 20, color: '#ef4444' }} />;
//             default:
//                 return null;
//         }
//     };
//
//     const getRecurringStatusColor = (status: string) => {
//         switch (status) {
//             case 'upcoming':
//                 return '#10b981';
//             case 'due-soon':
//                 return '#f59e0b';
//             case 'overdue':
//                 return '#ef4444';
//             default:
//                 return '#6b7280';
//         }
//     };
//
//     const getRecurringStatusLabel = (status: string, daysUntilDue: number) => {
//         if (status === 'overdue') return 'Overdue';
//         if (status === 'due-soon') return `Due in ${daysUntilDue} days`;
//         return `${daysUntilDue} days`;
//     };
//
//     const formatFrequency = (frequency: string) => {
//         return frequency.charAt(0).toUpperCase() + frequency.slice(1);
//     };
//
//     return (
//         <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
//             <Grid container>
//                 {/* Sidebar */}
//                 <Grid item xs={12} md={3} lg={2}>
//                     <Sidebar />
//                 </Grid>
//
//                 {/* Main Content */}
//                 <Grid item xs={12} md={9} lg={10}>
//                     <Box component="main" sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
//                         {/* Header */}
//                         <Box sx={{ mb: 4 }}>
//                             <Typography
//                                 variant="h4"
//                                 component="h1"
//                                 sx={{
//                                     fontWeight: 700,
//                                     color: '#1e293b',
//                                     mb: 1
//                                 }}
//                             >
//                                 Good morning, {userFullName}
//                             </Typography>
//                             <Typography variant="body1" sx={{ color: '#64748b' }}>
//                                 Here's your financial overview for today
//                             </Typography>
//                         </Box>
//
//                         <Grid container spacing={3}>
//                             {/* Row 1: Budget Overview (Left) + Recurring Transactions (Right) */}
//                             <Grid item xs={12} lg={8}>
//                                 <Paper sx={{
//                                     boxShadow: 3,
//                                     borderRadius: 4,
//                                     overflow: 'hidden',
//                                     transition: 'box-shadow 0.3s ease-in-out',
//                                     '&:hover': {
//                                         boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
//                                     },
//                                     height: '100%'
//                                 }}>
//                                     <Box sx={{ p: 3, pb: 0 }}>
//                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//                                             <Typography variant="h6" sx={{ fontWeight: 600, color: '#800000' }}>
//                                                 Budget Overview
//                                             </Typography>
//                                             <Chip
//                                                 label={`${totalBudget.percentage.toFixed(1)}% Used`}
//                                                 size="small"
//                                                 sx={{
//                                                     bgcolor: '#fef2f2',
//                                                     color: '#800000',
//                                                     fontWeight: 600
//                                                 }}
//                                             />
//                                         </Box>
//
//                                         {/* Total Budget Progress */}
//                                         <Box sx={{ mb: 4 }}>
//                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
//                                                 <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
//                                                     Total Monthly Budget
//                                                 </Typography>
//                                                 <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
//                                                     ${totalBudget.current.toLocaleString()} / ${totalBudget.target.toLocaleString()}
//                                                 </Typography>
//                                             </Box>
//                                             <LinearProgress
//                                                 variant="determinate"
//                                                 value={Math.min(totalBudget.percentage, 100)}
//                                                 sx={{
//                                                     height: 10,
//                                                     borderRadius: 5,
//                                                     bgcolor: '#e2e8f0',
//                                                     '& .MuiLinearProgress-bar': {
//                                                         borderRadius: 5,
//                                                         bgcolor: totalBudget.percentage > 90 ? '#ef4444' : '#0d9488'
//                                                     }
//                                                 }}
//                                             />
//                                         </Box>
//
//                                         <Divider sx={{ mb: 3 }} />
//
//                                         {/* Top Spending Categories - Table Style */}
//                                         <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#800000', mb: 2 }}>
//                                             Top Spending Categories (Last Week)
//                                         </Typography>
//                                     </Box>
//                                     <TableContainer>
//                                         <Table>
//                                             <TableHead>
//                                                 <TableRow sx={{ backgroundColor: 'background.paper' }}>
//                                                     <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '50%' }}>
//                                                         Category
//                                                     </TableCell>
//                                                     <TableCell align="right" sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '25%' }}>
//                                                         % of Total
//                                                     </TableCell>
//                                                     <TableCell align="right" sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '25%' }}>
//                                                         Amount
//                                                     </TableCell>
//                                                 </TableRow>
//                                             </TableHead>
//                                             <TableBody>
//                                                 {topCategories.map((category, index) => (
//                                                     <TableRow
//                                                         key={index}
//                                                         sx={{
//                                                             '&:last-child td': { border: 0 },
//                                                             '&:hover': {
//                                                                 bgcolor: 'rgba(128, 0, 0, 0.04)',
//                                                                 cursor: 'pointer'
//                                                             },
//                                                             borderLeft: `4px solid ${category.color}`,
//                                                         }}
//                                                     >
//                                                         <TableCell>
//                                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                                                                 <Avatar
//                                                                     sx={{
//                                                                         bgcolor: `${category.color}15`,
//                                                                         color: category.color,
//                                                                         width: 36,
//                                                                         height: 36
//                                                                     }}
//                                                                 >
//                                                                     {category.icon}
//                                                                 </Avatar>
//                                                                 <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
//                                                                     {category.category}
//                                                                 </Typography>
//                                                             </Box>
//                                                         </TableCell>
//                                                         <TableCell align="right">
//                                                             <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
//                                                                 {category.percentage.toFixed(1)}%
//                                                             </Typography>
//                                                         </TableCell>
//                                                         <TableCell align="right">
//                                                             <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
//                                                                 ${category.amount.toFixed(2)}
//                                                             </Typography>
//                                                         </TableCell>
//                                                     </TableRow>
//                                                 ))}
//                                             </TableBody>
//                                         </Table>
//                                     </TableContainer>
//                                 </Paper>
//                             </Grid>
//
//                             {/* Recurring Transactions/Bills - Top Right */}
//                             {recurringTransactions.length > 0 && (
//                                 <Grid item xs={12} lg={4}>
//                                     <Paper sx={{
//                                         boxShadow: 3,
//                                         borderRadius: 4,
//                                         overflow: 'hidden',
//                                         transition: 'box-shadow 0.3s ease-in-out',
//                                         '&:hover': {
//                                             boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
//                                         },
//                                         height: '100%'
//                                     }}>
//                                         <Box sx={{ p: 3, pb: 0 }}>
//                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//                                                 <Typography variant="h6" sx={{ fontWeight: 600, color: '#800000' }}>
//                                                     Recurring Bills
//                                                 </Typography>
//                                                 <Chip
//                                                     label={`${recurringTransactions.length} Active`}
//                                                     size="small"
//                                                     sx={{
//                                                         bgcolor: '#fef2f2',
//                                                         color: '#800000',
//                                                         fontWeight: 600
//                                                     }}
//                                                 />
//                                             </Box>
//                                         </Box>
//
//                                         <TableContainer>
//                                             <Table>
//                                                 <TableHead>
//                                                     <TableRow sx={{ backgroundColor: 'background.paper' }}>
//                                                         <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '55%' }}>
//                                                             Bill
//                                                         </TableCell>
//                                                         <TableCell align="right" sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '45%' }}>
//                                                             Amount
//                                                         </TableCell>
//                                                     </TableRow>
//                                                 </TableHead>
//                                                 <TableBody>
//                                                     {recurringTransactions
//                                                         .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
//                                                         .map((bill) => (
//                                                             <TableRow
//                                                                 key={bill.id}
//                                                                 sx={{
//                                                                     '&:hover': {
//                                                                         bgcolor: 'rgba(128, 0, 0, 0.04)',
//                                                                         cursor: 'pointer'
//                                                                     },
//                                                                     borderLeft: `4px solid ${getRecurringStatusColor(bill.status)}`,
//                                                                 }}
//                                                             >
//                                                                 <TableCell>
//                                                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                                                                         <Avatar
//                                                                             sx={{
//                                                                                 bgcolor: `${bill.color}15`,
//                                                                                 color: bill.color,
//                                                                                 width: 36,
//                                                                                 height: 36
//                                                                             }}
//                                                                         >
//                                                                             {bill.icon}
//                                                                         </Avatar>
//                                                                         <Box>
//                                                                             <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
//                                                                                 {bill.name}
//                                                                             </Typography>
//                                                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                                                                                 <Schedule sx={{ fontSize: 12, color: '#94a3b8' }} />
//                                                                                 <Typography variant="caption" sx={{ color: '#64748b' }}>
//                                                                                     {formatFrequency(bill.frequency)}
//                                                                                 </Typography>
//                                                                             </Box>
//                                                                         </Box>
//                                                                     </Box>
//                                                                 </TableCell>
//                                                                 <TableCell align="right">
//                                                                     <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
//                                                                         ${bill.amount.toFixed(2)}
//                                                                     </Typography>
//                                                                     <Chip
//                                                                         size="small"
//                                                                         icon={<CalendarToday sx={{ fontSize: 12 }} />}
//                                                                         label={getRecurringStatusLabel(bill.status, bill.daysUntilDue)}
//                                                                         sx={{
//                                                                             bgcolor: bill.status === 'overdue' ? '#fee2e2' : bill.status === 'due-soon' ? '#fef3c7' : '#d1fae5',
//                                                                             color: bill.status === 'overdue' ? '#991b1b' : bill.status === 'due-soon' ? '#92400e' : '#065f46',
//                                                                             fontWeight: 600,
//                                                                             fontSize: '0.7rem',
//                                                                             height: 20
//                                                                         }}
//                                                                     />
//                                                                 </TableCell>
//                                                             </TableRow>
//                                                         ))}
//                                                     {/* Total Monthly Recurring Row */}
//                                                     <TableRow sx={{ bgcolor: '#f0f9ff' }}>
//                                                         <TableCell>
//                                                             <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
//                                                                 Total Monthly
//                                                             </Typography>
//                                                         </TableCell>
//                                                         <TableCell align="right">
//                                                             <Typography variant="h6" sx={{ fontWeight: 700, color: '#0369a1' }}>
//                                                                 ${recurringTransactions
//                                                                 .filter(bill => bill.frequency === 'monthly')
//                                                                 .reduce((sum, bill) => sum + bill.amount, 0)
//                                                                 .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                                                             </Typography>
//                                                         </TableCell>
//                                                     </TableRow>
//                                                 </TableBody>
//                                             </Table>
//                                         </TableContainer>
//                                     </Paper>
//                                 </Grid>
//                             )}
//
//                             {/* No Recurring Bills State - Top Right */}
//                             {recurringTransactions.length === 0 && (
//                                 <Grid item xs={12} lg={4}>
//                                     <Card
//                                         elevation={0}
//                                         sx={{
//                                             borderRadius: 3,
//                                             border: '2px dashed #e2e8f0',
//                                             bgcolor: '#f8fafc',
//                                             height: '100%'
//                                         }}
//                                     >
//                                         <CardContent sx={{ py: 6, textAlign: 'center' }}>
//                                             <Avatar
//                                                 sx={{
//                                                     width: 72,
//                                                     height: 72,
//                                                     bgcolor: '#dbeafe',
//                                                     color: '#2563eb',
//                                                     margin: '0 auto',
//                                                     mb: 2
//                                                 }}
//                                             >
//                                                 <Replay sx={{ fontSize: 40 }} />
//                                             </Avatar>
//                                             <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
//                                                 No Recurring Bills
//                                             </Typography>
//                                             <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
//                                                 Set up recurring bills to track your monthly expenses
//                                             </Typography>
//                                             <Button
//                                                 variant="contained"
//                                                 startIcon={<CalendarToday />}
//                                                 sx={{
//                                                     textTransform: 'none',
//                                                     borderRadius: 3,
//                                                     px: 3,
//                                                     fontWeight: 600,
//                                                     background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
//                                                     '&:hover': {
//                                                         background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
//                                                     }
//                                                 }}
//                                                 onClick={() => {
//                                                     console.log('Add recurring bill clicked');
//                                                 }}
//                                             >
//                                                 Add Recurring Bill
//                                             </Button>
//                                         </CardContent>
//                                     </Card>
//                                 </Grid>
//                             )}
//
//                             {/* Row 2: Grocery Budget with Receipts (Left) + Savings Goal (Right) */}
//                             {/* Grocery Budget with Recent Receipts - Left */}
//                             {groceryBudget && (
//                                 <Grid item xs={12} lg={8}>
//                                     <Paper sx={{
//                                         boxShadow: 3,
//                                         borderRadius: 4,
//                                         overflow: 'hidden',
//                                         transition: 'box-shadow 0.3s ease-in-out',
//                                         '&:hover': {
//                                             boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
//                                         },
//                                         height: '100%'
//                                     }}>
//                                         <Box sx={{ p: 3 }}>
//                                             {/* Grocery Budget Header */}
//                                             <Box
//                                                 sx={{
//                                                     p: 3,
//                                                     borderRadius: 3,
//                                                     background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//                                                     color: 'white',
//                                                     mb: 3
//                                                 }}
//                                             >
//                                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
//                                                     <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
//                                                         <ShoppingCart sx={{ fontSize: 28 }} />
//                                                     </Avatar>
//                                                     <Box>
//                                                         <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
//                                                             Grocery Budget
//                                                         </Typography>
//                                                         <Typography variant="h4" sx={{ fontWeight: 700 }}>
//                                                             ${groceryBudget.current.toFixed(2)}
//                                                         </Typography>
//                                                     </Box>
//                                                 </Box>
//                                                 <Box sx={{ mb: 1 }}>
//                                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
//                                                         <Typography variant="caption" sx={{ opacity: 0.9 }}>
//                                                             ${groceryBudget.target.toFixed(2)} monthly budget
//                                                         </Typography>
//                                                         <Typography variant="caption" sx={{ fontWeight: 600 }}>
//                                                             {groceryBudget.percentage.toFixed(1)}%
//                                                         </Typography>
//                                                     </Box>
//                                                     <LinearProgress
//                                                         variant="determinate"
//                                                         value={Math.min(groceryBudget.percentage, 100)}
//                                                         sx={{
//                                                             height: 8,
//                                                             borderRadius: 4,
//                                                             bgcolor: 'rgba(255,255,255,0.3)',
//                                                             '& .MuiLinearProgress-bar': {
//                                                                 borderRadius: 4,
//                                                                 bgcolor: 'white'
//                                                             }
//                                                         }}
//                                                     />
//                                                 </Box>
//                                                 <Typography variant="caption" sx={{ opacity: 0.8 }}>
//                                                     ${(groceryBudget.target - groceryBudget.current).toFixed(2)} remaining
//                                                 </Typography>
//                                             </Box>
//
//                                             {/* Recent Receipts Section */}
//                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//                                                 <Typography variant="h6" sx={{ fontWeight: 600, color: '#800000' }}>
//                                                     Recent Receipts
//                                                 </Typography>
//                                                 <Button
//                                                     size="small"
//                                                     sx={{
//                                                         textTransform: 'none',
//                                                         color: '#800000',
//                                                         fontWeight: 600
//                                                     }}
//                                                 >
//                                                     View All
//                                                 </Button>
//                                             </Box>
//                                         </Box>
//
//                                         <TableContainer>
//                                             <Table>
//                                                 <TableHead>
//                                                     <TableRow sx={{ backgroundColor: 'background.paper' }}>
//                                                         <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '50%' }}>
//                                                             Store
//                                                         </TableCell>
//                                                         <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '25%' }}>
//                                                             Date
//                                                         </TableCell>
//                                                         <TableCell align="right" sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '25%' }}>
//                                                             Amount
//                                                         </TableCell>
//                                                     </TableRow>
//                                                 </TableHead>
//                                                 <TableBody>
//                                                     {recentReceipts.map((receipt, index) => (
//                                                         <TableRow
//                                                             key={receipt.id}
//                                                             sx={{
//                                                                 '&:hover': {
//                                                                     bgcolor: 'rgba(128, 0, 0, 0.04)',
//                                                                     cursor: 'pointer'
//                                                                 },
//                                                                 borderLeft: `4px solid ${receipt.color}`,
//                                                             }}
//                                                         >
//                                                             <TableCell>
//                                                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                                                                     <Avatar
//                                                                         sx={{
//                                                                             bgcolor: `${receipt.color}15`,
//                                                                             color: receipt.color,
//                                                                             width: 36,
//                                                                             height: 36
//                                                                         }}
//                                                                     >
//                                                                         <ShoppingCart sx={{ fontSize: 20 }} />
//                                                                     </Avatar>
//                                                                     <Box>
//                                                                         <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
//                                                                             {receipt.store}
//                                                                         </Typography>
//                                                                         <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
//                                                                             <Chip
//                                                                                 label={`${receipt.items} items`}
//                                                                                 size="small"
//                                                                                 sx={{
//                                                                                     bgcolor: '#e0e7ff',
//                                                                                     color: '#3730a3',
//                                                                                     fontSize: '0.65rem',
//                                                                                     height: 18,
//                                                                                     fontWeight: 500
//                                                                                 }}
//                                                                             />
//                                                                             {receipt.tags.map((tag, tagIndex) => (
//                                                                                 <Chip
//                                                                                     key={tagIndex}
//                                                                                     label={tag}
//                                                                                     size="small"
//                                                                                     sx={{
//                                                                                         bgcolor: tag.includes('Saved') ? '#d1fae5' : tag.includes('Organic') ? '#d1fae5' : tag.includes('RedCard') ? '#fee2e2' : '#e0e7ff',
//                                                                                         color: tag.includes('Saved') ? '#065f46' : tag.includes('Organic') ? '#065f46' : tag.includes('RedCard') ? '#991b1b' : '#3730a3',
//                                                                                         fontSize: '0.65rem',
//                                                                                         height: 18,
//                                                                                         fontWeight: 500
//                                                                                     }}
//                                                                                 />
//                                                                             ))}
//                                                                         </Box>
//                                                                     </Box>
//                                                                 </Box>
//                                                             </TableCell>
//                                                             <TableCell>
//                                                                 <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
//                                                                     {receipt.date}
//                                                                 </Typography>
//                                                                 <Typography variant="caption" sx={{ color: '#94a3b8' }}>
//                                                                     {receipt.time}
//                                                                 </Typography>
//                                                             </TableCell>
//                                                             <TableCell align="right">
//                                                                 <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
//                                                                     ${receipt.amount.toFixed(2)}
//                                                                 </Typography>
//                                                             </TableCell>
//                                                         </TableRow>
//                                                     ))}
//                                                     {/* Summary Stats Row */}
//                                                     <TableRow sx={{ bgcolor: '#f8fafc' }}>
//                                                         <TableCell colSpan={3} sx={{ py: 2 }}>
//                                                             <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
//                                                                 <Box sx={{ textAlign: 'center' }}>
//                                                                     <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
//                                                                         Avg per trip
//                                                                     </Typography>
//                                                                     <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
//                                                                         $96.44
//                                                                     </Typography>
//                                                                 </Box>
//                                                                 <Divider orientation="vertical" flexItem />
//                                                                 <Box sx={{ textAlign: 'center' }}>
//                                                                     <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
//                                                                         Total trips
//                                                                     </Typography>
//                                                                     <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
//                                                                         4
//                                                                     </Typography>
//                                                                 </Box>
//                                                                 <Divider orientation="vertical" flexItem />
//                                                                 <Box sx={{ textAlign: 'center' }}>
//                                                                     <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
//                                                                         Total saved
//                                                                     </Typography>
//                                                                     <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>
//                                                                         $8.50
//                                                                     </Typography>
//                                                                 </Box>
//                                                             </Box>
//                                                         </TableCell>
//                                                     </TableRow>
//                                                 </TableBody>
//                                             </Table>
//                                         </TableContainer>
//                                     </Paper>
//                                 </Grid>
//                             )}
//
//                             {/* Savings Goal - Right */}
//                             <Grid item xs={12} lg={4}>
//                                 <Card
//                                     elevation={0}
//                                     sx={{
//                                         borderRadius: 3,
//                                         border: '1px solid #e2e8f0',
//                                         height: '100%'
//                                     }}
//                                 >
//                                     <CardContent>
//                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//                                             <Typography variant="h6" sx={{ fontWeight: 600, color: '#800000' }}>
//                                                 Savings Goal
//                                             </Typography>
//                                             <Button
//                                                 size="small"
//                                                 sx={{
//                                                     textTransform: 'none',
//                                                     color: '#800000',
//                                                     fontWeight: 600
//                                                 }}
//                                             >
//                                                 Manage Goal
//                                             </Button>
//                                         </Box>
//
//                                         {/* Emergency Fund Goal */}
//                                         <Box
//                                             sx={{
//                                                 p: 3,
//                                                 bgcolor: '#f0fdf4',
//                                                 borderRadius: 3,
//                                                 border: '1px solid #bbf7d0'
//                                             }}
//                                         >
//                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
//                                                 <Box>
//                                                     <Typography variant="body2" sx={{ color: '#166534', fontWeight: 600, mb: 0.5 }}>
//                                                         Emergency Fund
//                                                     </Typography>
//                                                     <Typography variant="h4" sx={{ fontWeight: 700, color: '#15803d' }}>
//                                                         $8,500
//                                                     </Typography>
//                                                 </Box>
//                                                 <Chip
//                                                     icon={<CheckCircle sx={{ fontSize: 16 }} />}
//                                                     label="On Track"
//                                                     size="small"
//                                                     sx={{
//                                                         bgcolor: '#22c55e',
//                                                         color: 'white',
//                                                         fontWeight: 600
//                                                     }}
//                                                 />
//                                             </Box>
//                                             <Box sx={{ mb: 2 }}>
//                                                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
//                                                     <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>
//                                                         Goal: $10,000
//                                                     </Typography>
//                                                     <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>
//                                                         85%
//                                                     </Typography>
//                                                 </Box>
//                                                 <LinearProgress
//                                                     variant="determinate"
//                                                     value={85}
//                                                     sx={{
//                                                         height: 8,
//                                                         borderRadius: 4,
//                                                         bgcolor: '#dcfce7',
//                                                         '& .MuiLinearProgress-bar': {
//                                                             borderRadius: 4,
//                                                             bgcolor: '#22c55e'
//                                                         }
//                                                     }}
//                                                 />
//                                             </Box>
//                                             <Divider sx={{ my: 2, borderColor: '#bbf7d0' }} />
//                                             <Box>
//                                                 <Typography variant="caption" sx={{ color: '#166534', display: 'block', mb: 0.5 }}>
//                                                     Monthly Target: $500
//                                                 </Typography>
//                                                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                                     <Typography variant="body2" sx={{ color: '#15803d', fontWeight: 600 }}>
//                                                         Saved this month: $500
//                                                     </Typography>
//                                                     <CheckCircle sx={{ fontSize: 20, color: '#22c55e' }} />
//                                                 </Box>
//                                             </Box>
//                                         </Box>
//                                     </CardContent>
//                                 </Card>
//                             </Grid>
//
//                             {/* Row 3: Recent Transactions - Full Width */}
//                             <Grid item xs={12}>
//                                 <Paper sx={{
//                                     boxShadow: 3,
//                                     borderRadius: 4,
//                                     overflow: 'hidden',
//                                     transition: 'box-shadow 0.3s ease-in-out',
//                                     '&:hover': {
//                                         boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
//                                     }
//                                 }}>
//                                     <Box sx={{ p: 3, pb: 0 }}>
//                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//                                             <Typography variant="h6" sx={{ fontWeight: 600, color: '#800000' }}>
//                                                 Recent Transactions
//                                             </Typography>
//                                             <Button
//                                                 size="small"
//                                                 sx={{
//                                                     textTransform: 'none',
//                                                     color: '#800000',
//                                                     fontWeight: 600
//                                                 }}
//                                             >
//                                                 View All
//                                             </Button>
//                                         </Box>
//                                     </Box>
//                                     <TableContainer>
//                                         <Table sx={{ tableLayout: 'fixed' }}>
//                                             <TableHead>
//                                                 <TableRow sx={{ backgroundColor: 'background.paper' }}>
//                                                     <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '12%' }}>
//                                                         Date
//                                                     </TableCell>
//                                                     <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '30%' }}>
//                                                         Description
//                                                     </TableCell>
//                                                     <TableCell sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '18%' }}>
//                                                         Category
//                                                     </TableCell>
//                                                     <TableCell align="right" sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '20%' }}>
//                                                         Amount
//                                                     </TableCell>
//                                                     <TableCell align="right" sx={{ fontWeight: 'bold', color: '#800000', fontSize: '0.95rem', width: '20%' }}>
//                                                         Balance
//                                                     </TableCell>
//                                                 </TableRow>
//                                             </TableHead>
//                                             <TableBody>
//                                                 {recentTransactions.map((transaction, index) => (
//                                                     <TableRow
//                                                         key={transaction.id}
//                                                         sx={{
//                                                             '&:last-child td, &:last-child th': { border: 0 },
//                                                             '&:hover': {
//                                                                 bgcolor: 'rgba(128, 0, 0, 0.04)',
//                                                                 cursor: 'pointer'
//                                                             },
//                                                             borderLeft: `4px solid ${transaction.type === 'income' ? '#10b981' : '#ef4444'}`,
//                                                         }}
//                                                     >
//                                                         <TableCell sx={{ color: '#64748b', fontWeight: 500 }}>
//                                                             {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
//                                                         </TableCell>
//                                                         <TableCell>
//                                                             <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
//                                                                 {transaction.description}
//                                                             </Typography>
//                                                         </TableCell>
//                                                         <TableCell>
//                                                             <Chip
//                                                                 label={transaction.category}
//                                                                 size="small"
//                                                                 sx={{
//                                                                     bgcolor: '#f1f5f9',
//                                                                     color: '#475569',
//                                                                     fontSize: '0.75rem',
//                                                                     fontWeight: 600
//                                                                 }}
//                                                             />
//                                                         </TableCell>
//                                                         <TableCell
//                                                             align="right"
//                                                             sx={{
//                                                                 fontWeight: 700,
//                                                                 fontSize: '0.95rem',
//                                                                 color: transaction.type === 'income' ? '#10b981' : '#ef4444'
//                                                             }}
//                                                         >
//                                                             {transaction.type === 'income' ? '+' : '-'}$
//                                                             {Math.abs(transaction.amount).toFixed(2)}
//                                                         </TableCell>
//                                                         <TableCell align="right" sx={{ fontWeight: 600, color: '#1e293b' }}>
//                                                             ${transaction.balance.toFixed(2)}
//                                                         </TableCell>
//                                                     </TableRow>
//                                                 ))}
//                                             </TableBody>
//                                         </Table>
//                                     </TableContainer>
//                                 </Paper>
//                             </Grid>
//                         </Grid>
//                     </Box>
//                 </Grid>
//             </Grid>
//
//             {/* Loading Backdrop */}
//             <Backdrop
//                 sx={{
//                     color: '#fff',
//                     zIndex: (theme) => theme.zIndex.drawer + 1,
//                     backgroundColor: 'rgba(0, 0, 0, 0.7)'
//                 }}
//                 open={isLoading}
//             >
//                 <Box sx={{ textAlign: 'center' }}>
//                     <CircularProgress color="inherit" size={60} />
//                     <Typography variant="h6" sx={{ mt: 2 }}>
//                         Importing CSV data...
//                     </Typography>
//                 </Box>
//             </Backdrop>
//
//             {/* Upload Reminder Dialog */}
//             <Dialog
//                 open={uploadReminderOpen}
//                 onClose={handleRemindLater}
//                 maxWidth="sm"
//                 fullWidth
//                 PaperProps={{
//                     sx: {
//                         borderRadius: 4,
//                         boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
//                     }
//                 }}
//             >
//                 <DialogTitle sx={{ pb: 1 }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                         <Box
//                             sx={{
//                                 width: 48,
//                                 height: 48,
//                                 borderRadius: 3,
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 justifyContent: 'center',
//                                 background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
//                                 color: 'white'
//                             }}
//                         >
//                             <AlertCircle size={24} />
//                         </Box>
//                         <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
//                             Upload Reminder
//                         </Typography>
//                     </Box>
//                 </DialogTitle>
//                 <DialogContent sx={{ pt: 2 }}>
//                     <Alert
//                         severity="warning"
//                         icon={<Upload size={20} />}
//                         sx={{
//                             mb: 2,
//                             borderRadius: 3,
//                             '& .MuiAlert-icon': {
//                                 alignItems: 'center'
//                             }
//                         }}
//                     >
//                         <AlertTitle sx={{ fontWeight: 600 }}>
//                             No Recent Transactions Found
//                         </AlertTitle>
//                         We haven't detected any transactions in the last 2 weeks.
//                     </Alert>
//
//                     <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.secondary }}>
//                         To keep your financial tracking accurate and up-to-date, please upload your recent transaction data.
//                     </Typography>
//
//                     <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
//                         Regular uploads help you:
//                     </Typography>
//                     <Box component="ul" sx={{ mt: 1, pl: 2, color: theme.palette.text.secondary }}>
//                         <li>Track your spending habits accurately</li>
//                         <li>Stay on top of your budget</li>
//                         <li>Identify trends and patterns</li>
//                         <li>Make informed financial decisions</li>
//                     </Box>
//                 </DialogContent>
//                 <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
//                     <Button
//                         onClick={handleRemindLater}
//                         variant="outlined"
//                         sx={{
//                             textTransform: 'none',
//                             borderRadius: 3,
//                             px: 3,
//                             fontWeight: 600
//                         }}
//                     >
//                         Remind Me Later
//                     </Button>
//                     <Button
//                         onClick={handleUploadNow}
//                         variant="contained"
//                         startIcon={<Upload size={18} />}
//                         sx={{
//                             textTransform: 'none',
//                             borderRadius: 3,
//                             px: 3,
//                             fontWeight: 600,
//                             background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
//                             '&:hover': {
//                                 background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
//                             }
//                         }}
//                     >
//                         Upload Now
//                     </Button>
//                 </DialogActions>
//             </Dialog>
//
//             {/* CSV Import Dialog */}
//             <CSVImportDialog open={importDialogOpen} onClose={handleImportClose} onImport={handleImportComplete}/>
//
//             {/* Snackbar for notifications */}
//             <Snackbar
//                 open={snackbarOpen}
//                 autoHideDuration={6000}
//                 onClose={handleSnackbarClose}
//                 anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
//             >
//                 <SnackbarAlert
//                     onClose={handleSnackbarClose}
//                     severity={snackbarSeverity}
//                     sx={{
//                         width: '100%',
//                         borderRadius: 3,
//                         fontWeight: 500
//                     }}
//                 >
//                     {snackbarMessage}
//                 </SnackbarAlert>
//             </Snackbar>
//         </Box>
//     );
// };
//
// export default DashboardPage;
