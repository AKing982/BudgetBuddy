import React, { useEffect, useRef, useState } from 'react';
import {
    alpha, Box, Button, Chip, Collapse, Divider, IconButton,
    LinearProgress, ListItemIcon, ListItemText, Menu, MenuItem,
    Stack, Typography,
} from '@mui/material';
import {
    Plus, Target, MoreHorizontal, PauseCircle, CreditCard,
    Settings2, RefreshCcw, ChevronRight, ChevronDown, SlidersHorizontal,
    Pencil, ArrowRight, ShieldCheck, AlertTriangle, Gauge,
    Link2, CheckCircle2, Wallet, Repeat, Flame, Calendar,
    PieChart, BarChart2, LineChart,
} from 'lucide-react';
import { XCircle } from 'lucide-react';
import type { PlaidAccount } from '../services/PlaidService';
import PlaidService from '../services/PlaidService';
import PlaidLink, { PlaidLinkRef } from './PlaidLink';
import ConnectFundAccountDialog from './ConnectFundAccountDialog';
import { BudgetEnvelope, EnvelopeContribution, ScheduledContribution } from '../config/Types';
import { LinkedEnvelopeGroup } from '../services/BudgetEnvelopeService';
import BudgetEnvelopeService from '../services/BudgetEnvelopeService';
import { ENVELOPE_COLORS, MAROON, MAROON_DARK, FREQUENCY_OPTIONS } from '../config/Constants';
import { fmt, daysUntil, progressPct, velocityDays, requiredMonthly, monthlyContributed, isEnvelopeActiveInMonth } from '../config/Helpers';
import { VelocityChip, PanelHeader, ContributionRow } from './Shared';
import GoalUpdateDialog, { GoalUpdateValues } from './GoalUpdateDialog';
import NotificationSettingsDialog from './NotificationSettingsDialog';
import { NotificationEventSettings, NotificationPrefs } from './NotificationToggle';
import BulkScheduleUpdateDialog from './BulkScheduleUpdateDialog';

type LeftPanelView = 'envelopes' | 'analytics' | 'paymentplan' | 'planadjuster';

interface ScheduleUpdate {
    id:     number;
    amount: number;
}

// ─────────────────────────────────────────────────────────────────────────
// TODO: move these types + the FundConnectionStatus union into
// ../config/Types.ts, and add 'PAYOFF' | 'FUND' to BudgetEnvelope.envelopeType
// (plus a 'FUND' entry in ENVELOPE_COLORS) if they aren't there already.
// They're kept local here so this file is a drop-in preview of the feature;
// wiring them onto BudgetEnvelope itself is a one-line follow-up per project.
// ─────────────────────────────────────────────────────────────────────────

/** Payoff-specific plan info — merchant financing, BNPL, or a straight credit card. */
export interface PaymentPlanDetails {
    merchant: string;
    provider?: string | null;
    paymentType: string;
    apr: number;
    isDeferred: boolean;
    deferredInterest?: number;
    deferredEndsOn?: string | null;
    planUnitLabel: 'month' | 'installment';
    planUnitsTotal: number;
    planUnitsPaid: number;
    perUnitAmount: number;
    nextDueDate: string;
    totalPaid: number;
}

export type FundConnectionStatus = 'connected' | 'disconnected' | 'critical' | 'error';

/** Fund-specific info — a linked external account (savings, Roth IRA, brokerage, etc). */
export interface FundAccountDetails {
    connectionStatus: FundConnectionStatus;
    accountName?: string | null;
    accountMask?: string | null;
    institution?: string | null;
    accountType: string;
    apy?: number | null;
    lastSyncedAt?: string | null;
    contributionLimitYear?: number | null;
    contributionYTD?: number | null;
    liquidityNote?: string;
    taxAdvantaged?: boolean;
    autoSweep?: boolean;
    closureDeadline?: string | null;
    daysUntilClosure?: number | null;
    currentBalance?: number | null;
    currentBalanceAsOf?: string | null;
}

export type FundContributionProvenance = 'BANK_VERIFIED' | 'RECURRING_MATCHED' | 'BALANCE_INFERRED' | 'PENDING';

/** One entry in the "recent activity" feed for a FUND envelope's linked account. */
export interface FundContributionActivity {
    date: string;
    amount: number;
    provenance: FundContributionProvenance;
    note?: string;
}

/**
 * One point in a FUND envelope's linked-account balance history — a raw balance reading,
 * distinct from FundContributionActivity (which is attributed, confirmed contributions).
 * Typically sourced from a daily snapshot job that records AccountEntity.currentBalance,
 * since Plaid's balance endpoint only returns the current figure, not a history.
 */
export interface BalanceSnapshot {
    date: string;
    balance: number;
}

interface EnvelopeDetailPanelProps {
    selectedEnvelope:       BudgetEnvelope | null;
    envelopes:              BudgetEnvelope[];
    contributions:          EnvelopeContribution[];
    scheduledContributions: ScheduledContribution[];
    monthStart:             Date;
    monthEnd:               Date;
    monthLabel:             string;
    onClose:                () => void;
    onAddManual:            (id: number) => void;
    onToggleContribMode:    (id: number, mode: 'MANUAL' | 'AUTO') => void;
    onSetLeftPanel:         (view: LeftPanelView) => void;
    onSnack:                (msg: string, sev: 'success' | 'error' | 'info' | 'warning') => void;
    onSelectEnvelope:       (id: number) => void;
    totalEnvelopes?:        number;
    onUpdateSchedule?:      (envelopeId: number, updates: ScheduleUpdate[]) => Promise<void> | void;
    linkedGroup?:                    LinkedEnvelopeGroup | null;
    onOpenLinkedGoalUpdate?:         (group: LinkedEnvelopeGroup) => void;
    onOpenGroupNotificationSettings?:(group: LinkedEnvelopeGroup) => void;
    initialDetailView?:              'individual' | 'group';
    accountBalance?:                 number;
    paymentPlanDetails?:             PaymentPlanDetails;
    fundAccountDetails?:             FundAccountDetails;
    fundContributionActivity?:       FundContributionActivity[];
    /** FUND envelopes only — the linked account's balance over time, for the Account tab chart. */
    balanceHistory?:                 BalanceSnapshot[];
    onManageAccount?:                (envelopeId: number) => void;
    userId?:                         number;
    onAccountLinked?:                (envelopeId: number, account: PlaidAccount) => void;
}

// ── Shared style tokens — warm maroon-tinted surfaces, not stark white ─────
const SECTION_LABEL_SX = {
    fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.06em', color: '#a35c5c', mb: 1,
};
const BORDER    = '1px solid #ecd9d9';
const PANEL_BG  = '#fdf7f7';

const CONNECTION_META: Record<FundConnectionStatus, { color: string; label: string; icon: React.ElementType }> = {
    connected:    { color: '#16a34a', label: 'Connected',    icon: CheckCircle2 },
    disconnected: { color: '#8a8a8a', label: 'Not connected', icon: Link2 },
    critical:     { color: '#dc2626', label: 'Action needed', icon: AlertTriangle },
    error:        { color: '#dc2626', label: 'Sync error',   icon: AlertTriangle },
};

const PROVENANCE_META: Record<FundContributionProvenance, { color: string; label: string }> = {
    BANK_VERIFIED:     { color: '#16a34a', label: 'Bank-verified' },
    RECURRING_MATCHED: { color: '#16a34a', label: 'Recurring match' },
    BALANCE_INFERRED:  { color: '#d97706', label: 'Balance-inferred' },
    PENDING:           { color: '#8a8a8a', label: 'Pending' },
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtDateShort = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** Small inline sparkline for a FUND envelope's linked-account balance history — no charting
 * library needed for something this size. */
const BalanceSparkline: React.FC<{ history: BalanceSnapshot[]; color: string }> = ({ history, color }) => {
    const width = 280, height = 56, pad = 4;
    const values = history.map(h => h.balance);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const points = history.map((h, i) => {
        const x = pad + (i / (history.length - 1)) * (width - pad * 2);
        const y = height - pad - ((h.balance - min) / range) * (height - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const last = history[history.length - 1];
    const [lastX, lastY] = points[points.length - 1].split(',');

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 500, color: '#111' }}>{fmt(last.balance)}</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: '#999' }}>as of {fmtDate(last.date)}</Typography>
            </Box>
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ display: 'block' }}>
                <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth={2} />
                <circle cx={lastX} cy={lastY} r={3} fill={color} />
            </svg>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.25 }}>
                <Typography sx={{ fontSize: '0.6rem', color: '#bbb' }}>{fmtDateShort(history[0].date)}</Typography>
                <Typography sx={{ fontSize: '0.6rem', color: '#bbb' }}>{fmtDateShort(last.date)}</Typography>
            </Box>
        </Box>
    );
};

/** Last N months of contribution totals for one envelope, as a small bar chart — replaces a
 * flat "this month" number with an at-a-glance view of whether contributions are picking up
 * or tailing off. */
/**
 * Cumulative saved-to-date at each month's end, over the trailing N months — this is the actual
 * "progress" metric (running toward the goal), distinct from a monthly-contribution-delta chart.
 * Rendered as either bars or a line depending on `mode`.
 */
const ProgressTrend: React.FC<{ contributions: EnvelopeContribution[]; envelopeId: number; color: string; mode: 'bar' | 'line'; monthsBack?: number }> = ({ contributions, envelopeId, color, mode, monthsBack = 6 }) => {
    const now = new Date();
    const points = Array.from({ length: monthsBack }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - i), 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        const cumulative = contributions
            .filter(c => c.envelopeId === envelopeId && new Date(c.contributedAt) <= monthEnd)
            .reduce((s, c) => s + c.amount, 0);
        return { label: d.toLocaleDateString('en-US', { month: 'short' }), cumulative };
    });
    const max = Math.max(...points.map(p => p.cumulative), 1);

    if (mode === 'bar') {
        return (
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75, height: 56 }}>
                {points.map((p, i) => {
                    const isLast = i === points.length - 1;
                    const heightPct = p.cumulative > 0 ? Math.max((p.cumulative / max) * 100, 4) : 2;
                    return (
                        <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4 }}>
                            <Box sx={{ width: '100%', height: 44, display: 'flex', alignItems: 'flex-end' }}>
                                <Box sx={{ width: '100%', height: `${heightPct}%`, borderRadius: '3px', bgcolor: isLast ? color : alpha(color, 0.25) }} />
                            </Box>
                            <Typography sx={{ fontSize: '0.55rem', color: isLast ? color : '#bbb', fontWeight: isLast ? 500 : 400 }}>{p.label}</Typography>
                        </Box>
                    );
                })}
            </Box>
        );
    }

    // Line mode — same underlying data, plotted as a trajectory rather than discrete columns.
    const width = 280, height = 56, pad = 4;
    const coords = points.map((p, i) => {
        const x = pad + (i / (points.length - 1)) * (width - pad * 2);
        const y = height - pad - (p.cumulative / max) * (height - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const [lastX, lastY] = coords[coords.length - 1].split(',');

    return (
        <Box>
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ display: 'block' }}>
                <polyline points={coords.join(' ')} fill="none" stroke={color} strokeWidth={2} />
                <circle cx={lastX} cy={lastY} r={3} fill={color} />
            </svg>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.4 }}>
                {points.map((p, i) => (
                    <Typography key={i} sx={{ fontSize: '0.55rem', color: i === points.length - 1 ? color : '#bbb', fontWeight: i === points.length - 1 ? 500 : 400 }}>
                        {p.label}
                    </Typography>
                ))}
            </Box>
        </Box>
    );
};

/** Saved-vs-remaining donut — the "aggregate pie chart" option for viewing this envelope's
 * progress, alongside ProgressTrend's bar/line options. */
const ProgressDonut: React.FC<{ current: number; target: number; color: string }> = ({ current, target, color }) => {
    const size = 84, strokeWidth = 14;
    const r = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * r;
    const pct = target > 0 ? Math.min(current / target, 1) : 0;
    const dash = pct * circumference;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={alpha(color, 0.15)} strokeWidth={strokeWidth} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
                    strokeDasharray={`${dash} ${circumference - dash}`} strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`} />
            <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize="14" fontWeight={500} fill="#1a1a1a">
                {(pct * 100).toFixed(0)}%
            </text>
        </svg>
    );
};

const EnvelopeDetailPanel: React.FC<EnvelopeDetailPanelProps> = ({
                                                                     selectedEnvelope, envelopes, contributions, scheduledContributions,
                                                                     monthStart, monthEnd, monthLabel,
                                                                     onClose, onAddManual, onToggleContribMode,
                                                                     onSetLeftPanel, onSnack, onSelectEnvelope,
                                                                     totalEnvelopes, onUpdateSchedule,
                                                                     linkedGroup, onOpenLinkedGoalUpdate, onOpenGroupNotificationSettings,
                                                                     initialDetailView = 'individual',
                                                                     accountBalance,
                                                                     paymentPlanDetails, fundAccountDetails, fundContributionActivity,
                                                                     balanceHistory,
                                                                     onManageAccount, userId, onAccountLinked,
                                                                 }) => {
    type TabKey = 'history' | 'schedule' | 'budget' | 'plan';
    const [tab, setTab] = useState<TabKey>('history');

    // ── Individual envelope vs linked-group stats toggle ────────────────────────
    const [detailView, setDetailView] = useState<'individual' | 'group'>(initialDetailView);
    useEffect(() => {
        setDetailView(initialDetailView);
    }, [selectedEnvelope?.id, initialDetailView]);

    // Default to the type-specific tab (Payment plan) whenever the selection changes, so the
    // most relevant info is what the user sees first. Account no longer needs a branch here —
    // it moved to its own persistent, collapsible section above Overview instead of a tab.
    useEffect(() => {
        setTab(selectedEnvelope?.envelopeType === 'PAYOFF' ? 'plan' : 'history');
    }, [selectedEnvelope?.id]);

    /** Account section (FUND only) open/collapsed — defaults open so the connection state and
     * balance are visible immediately without an extra click. */
    const [accountExpanded, setAccountExpanded] = useState(true);

    /** Overview's momentum visualization — bar (contribution history over time) or pie (this
     * envelope's saved-vs-remaining split) — two different "shapes" of the same underlying data. */
    const [overviewChartMode, setOverviewChartMode] = useState<'pie' | 'bar' | 'line'>('bar');

    // ── Secondary-actions menu — everything that isn't "add a contribution" lives behind
    // this single kebab button instead of a permanent row of buttons on the panel. ──────
    const [actionsMenuAnchor, setActionsMenuAnchor] = useState<HTMLElement | null>(null);
    const closeActionsMenu = () => setActionsMenuAnchor(null);

    // ── Connect account (Plaid) ──────────────────────────────────────────────────
    // Plaid linking in this app is user-level, not per-envelope (see PlaidService —
    // checkPlaidLinkStatusByUserId / createLinkToken / exchangePublicToken / fetchAccounts all
    // take a userId, never an envelopeId). So "connect account" for a FUND envelope means:
    //   1. If the user already has a working Plaid connection, just list their existing
    //      accounts, filtered to savings/investment, and let them pick one.
    //   2. If they don't (or Plaid says the link needs updating), run Plaid Link first, then
    //      do step 1 with the freshly-synced accounts.
    // Either way, picking an account calls BudgetEnvelopeService.linkAccountToEnvelope to persist
    // the association — that's envelope domain logic, not Plaid logic, so it lives there rather
    // than on PlaidService.
    const plaidLinkRef = useRef<PlaidLinkRef>(null);
    const [pendingConnectEnvelopeId, setPendingConnectEnvelopeId] = useState<number | null>(null);
    const [plaidLinkToken, setPlaidLinkToken] = useState<string | null>(null);
    const [connectDialogOpen, setConnectDialogOpen] = useState(false);
    const [connectAccountsLoading, setConnectAccountsLoading] = useState(false);
    const [eligibleAccounts, setEligibleAccounts] = useState<PlaidAccount[]>([]);

    const ELIGIBLE_DEPOSITORY_SUBTYPES = ['savings', 'money market', 'cd'];
    const isEligibleFundAccount = (a: PlaidAccount) =>
        a.type === 'investment' || (a.type === 'depository' && ELIGIBLE_DEPOSITORY_SUBTYPES.includes((a.subtype ?? '').toLowerCase()));

    const loadEligibleAccounts = async (uid: number) => {
        setConnectAccountsLoading(true);
        try {
            const accounts: PlaidAccount[] = (await PlaidService.getInstance().fetchAccounts(uid)) ?? [];
            setEligibleAccounts(accounts.filter(isEligibleFundAccount));
        } catch {
            onSnack("Couldn't load your linked accounts", 'error');
            setEligibleAccounts([]);
        } finally {
            setConnectAccountsLoading(false);
        }
    };

    const handleLinkNewAccount = async () => {
        if (!userId) return;
        try {
            const tokenResponse = await PlaidService.getInstance().createLinkToken();
            setConnectDialogOpen(false);
            setPlaidLinkToken(tokenResponse.link_token);
        } catch {
            onSnack("Couldn't start account linking", 'error');
        }
    };

    const handleConnectAccount = async (envelopeId: number) => {
        if (!userId) {
            onSnack('Missing user — cannot connect an account right now', 'error');
            return;
        }
        setPendingConnectEnvelopeId(envelopeId);
        setConnectDialogOpen(true);
        setConnectAccountsLoading(true);
        try {
            const status = await PlaidService.getInstance().checkPlaidLinkStatusByUserId(userId);
            if (!status.isLinked || status.requiresLinkUpdate) {
                await handleLinkNewAccount();
            } else {
                await loadEligibleAccounts(userId);
            }
        } catch {
            onSnack("Couldn't check your account connection", 'error');
            setConnectDialogOpen(false);
        } finally {
            setConnectAccountsLoading(false);
        }
    };

    const handleAccountSelected = async (account: PlaidAccount) => {
        if (pendingConnectEnvelopeId == null) return;
        try {
            await BudgetEnvelopeService.getInstance().linkAccountToEnvelope(pendingConnectEnvelopeId, account.accountId);
            onSnack('Account connected!', 'success');
            onAccountLinked?.(pendingConnectEnvelopeId, account);
        } catch {
            onSnack('Could not connect that account', 'error');
        } finally {
            setConnectDialogOpen(false);
            setPendingConnectEnvelopeId(null);
        }
    };

    // ── Goal update dialog ─────────────────────────────────────────────────────
    const [goalDialogOpen, setGoalDialogOpen] = useState(false);
    const [notifSettingsOpen, setNotifSettingsOpen] = useState(false);
    const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({ system: true, email: false });
    const [eventSettings, setEventSettings] = useState<NotificationEventSettings>({
        contributionReceived: true,
        goalReached:          true,
        fallingBehind:        true,
        monthlyReminder:      false,
    });

    const handleTogglePref  = (channel: 'system' | 'email') =>
        setNotifPrefs(p => ({ ...p, [channel]: !p[channel] }));

    const handleToggleEvent = (key: keyof NotificationEventSettings) =>
        setEventSettings(p => ({ ...p, [key]: !p[key] }));

    const handleGoalUpdate = async (envelopeId: number, values: GoalUpdateValues) => {
        // TODO: wire to real API call, e.g.:
        // await BudgetEnvelopeService.getInstance().updateEnvelopeGoal(envelopeId, values);
        onSnack('Goal updated!', 'success');
    };

    // ── Scheduled contribution update dialog — handles both a single row and a bulk selection ──
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
    const [scheduleDialogTargetId, setScheduleDialogTargetId] = useState<number | null>(null);

    const openScheduleDialogForRow = (id: number) => {
        setScheduleDialogTargetId(id);
        setScheduleDialogOpen(true);
    };

    const openScheduleDialogForBulk = () => {
        setScheduleDialogTargetId(null);
        setScheduleDialogOpen(true);
    };

    const closeScheduleDialog = () => {
        setScheduleDialogOpen(false);
        setScheduleDialogTargetId(null);
    };

    const handleScheduleDialogSubmit = async (envelopeId: number, updates: ScheduleUpdate[]) => {
        try {
            await onUpdateSchedule?.(envelopeId, updates);
            onSnack(`Updated ${updates.length} scheduled contribution${updates.length > 1 ? 's' : ''}`, 'success');
        } catch {
            onSnack('Failed to update schedule', 'error');
        }
    };

    // ── Filtered contributions ─────────────────────────────────────────────────
    const selectedContributions = contributions.filter(c => {
        if (c.envelopeId !== selectedEnvelope?.id) return false;
        const d = new Date(c.contributedAt);
        return d >= monthStart && d <= monthEnd;
    });

    // ── Quick overview (nothing selected) ─────────────────────────────────────
    if (!selectedEnvelope) {
        return (
            <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: BORDER }}>
                <PanelHeader icon={<Target size={15} color="white" />} title="Quick overview" subtitle="Tap any envelope card for details" />
                <Box sx={{ bgcolor: PANEL_BG, p: 2.5 }}>
                    <Typography sx={SECTION_LABEL_SX}>By priority</Typography>
                    <Stack spacing={1.25}>
                        {envelopes
                            .filter(e => e.status === 'ACTIVE' && isEnvelopeActiveInMonth(e, monthStart, monthEnd))
                            .sort((a, b) => a.priority - b.priority)
                            .map(env => {
                                const c   = ENVELOPE_COLORS[env.envelopeType] ?? MAROON;
                                const pct = progressPct(env.currentAmount, env.targetAmount);
                                const vel = velocityDays(env);
                                return (
                                    <Box key={env.id} onClick={() => onSelectEnvelope(env.id)}
                                         sx={{ p: 1.5, borderRadius: '10px', cursor: 'pointer', border: BORDER, bgcolor: '#fff', '&:hover': { bgcolor: '#fbf1f1', borderColor: '#ddd' }, transition: 'all 0.15s' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: c, flexShrink: 0 }} />
                                                <Typography sx={{ fontWeight: 500, fontSize: '0.78rem', color: '#111' }}>{env.envelopeName}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                {env.contributionMode === 'AUTO' && <RefreshCcw size={9} color="#0284c7" />}
                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 500, color: c, fontVariantNumeric: 'tabular-nums' }}>{pct.toFixed(0)}%</Typography>
                                            </Box>
                                        </Box>
                                        <LinearProgress variant="determinate" value={pct}
                                                        sx={{ height: 4, borderRadius: 2, bgcolor: alpha(c, 0.12), '& .MuiLinearProgress-bar': { bgcolor: c, borderRadius: 2 } }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, alignItems: 'center' }}>
                                            <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>{fmt(env.currentAmount)} / {fmt(env.targetAmount)}</Typography>
                                            <VelocityChip days={vel} />
                                        </Box>
                                    </Box>
                                );
                            })}
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Typography sx={SECTION_LABEL_SX}>Upcoming deadlines</Typography>
                    <Stack spacing={1}>
                        {envelopes
                            .filter(e => e.status === 'ACTIVE' && e.targetDate && isEnvelopeActiveInMonth(e, monthStart, monthEnd))
                            .sort((a, b) => new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime())
                            .slice(0, 3)
                            .map(env => {
                                const days = daysUntil(env.targetDate)!;
                                const dc   = days <= 60 ? '#d97706' : '#16a34a';
                                return (
                                    <Box key={env.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75, borderBottom: BORDER, '&:last-child': { borderBottom: 'none' } }}>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#333' }}>{env.envelopeName}</Typography>
                                        <Chip size="small" label={`${days}d`} sx={{ height: 18, fontSize: '0.6rem', fontWeight: 500, bgcolor: alpha(dc, 0.1), color: dc }} />
                                    </Box>
                                );
                            })}
                    </Stack>
                </Box>
            </Box>
        );
    }

    // ── Selected envelope detail ───────────────────────────────────────────────
    const color = ENVELOPE_COLORS[selectedEnvelope.envelopeType] ?? MAROON;
    const vel   = velocityDays(selectedEnvelope);
    const req   = requiredMonthly(selectedEnvelope);
    const now   = new Date();

    const isPayoff = selectedEnvelope.envelopeType === 'PAYOFF';
    const isFund   = selectedEnvelope.envelopeType === 'FUND';
    const plan     = paymentPlanDetails;
    const fund     = fundAccountDetails;
    const connMeta = fund ? CONNECTION_META[fund.connectionStatus] : null;

    const paidCount     = scheduledContributions.filter(c => c.status === 'PAID').length;
    const missedCount   = scheduledContributions.filter(c => c.status === 'MISSED').length;
    const upcomingCount = scheduledContributions.filter(c => c.status === 'SCHEDULED').length;
    const hasEditableSchedule = scheduledContributions.some(c => c.status !== 'PAID' && c.status !== 'MISSED');

    // ── Overview tile values ────────────────────────────────────────────────────
    const daysLeft       = daysUntil(selectedEnvelope.targetDate);
    const targetDateLabel = selectedEnvelope.targetDate
        ? new Date(selectedEnvelope.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : null;
    const deadlineColor  = daysLeft === null ? '#999' : daysLeft <= 60 ? '#d97706' : '#16a34a';

    // ── Contribution / plan tabs — Payment plan is inserted ahead of the generic tabs for
    // PAYOFF envelopes; Account no longer lives here (see the persistent section above) ──
    const tabOptions: { key: TabKey; label: string }[] = [
        ...(isPayoff ? [{ key: 'plan' as TabKey, label: 'Payment plan' }] : []),
        { key: 'history', label: `History (${monthLabel})` },
        { key: 'schedule', label: `Schedule (${scheduledContributions.length})` },
        { key: 'budget', label: 'Budget impact' },
    ];

    // ── Linked-group aggregate stats (only computed when a group is present) ───
    const groupCurrentTotal  = linkedGroup?.envelopes.reduce((s, e) => s + e.currentAmount, 0) ?? 0;
    const groupTargetTotal   = linkedGroup?.envelopes.reduce((s, e) => s + e.targetAmount, 0) ?? 0;
    const groupRemainingTotal= linkedGroup?.envelopes.reduce((s, e) => s + e.remainingAmount, 0) ?? 0;
    const groupAllocatedTotal= linkedGroup?.envelopes.reduce((s, e) => s + e.allocatedAmount, 0) ?? 0;
    const groupThisMonthTotal= linkedGroup?.envelopes.reduce((s, e) => s + monthlyContributed(contributions, e.id, monthStart, monthEnd), 0) ?? 0;
    const groupProgressPct   = groupTargetTotal > 0 ? Math.min((groupCurrentTotal / groupTargetTotal) * 100, 100) : 0;
    const groupNearestTarget = linkedGroup?.envelopes
        .filter(e => e.targetDate)
        .sort((a, b) => new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime())[0]?.targetDate ?? null;
    const allocationHeadroom = linkedGroup ? Math.max(0, linkedGroup.sharedBudget - groupAllocatedTotal) : 0;
    const headroomPct        = linkedGroup && linkedGroup.sharedBudget > 0 ? (allocationHeadroom / linkedGroup.sharedBudget) * 100 : 0;

    // ── Budget impact — this envelope/group's share of total allocation, plus balance-threshold safety ──
    const totalActiveAllocated = envelopes.filter(e => e.status === 'ACTIVE').reduce((s, e) => s + e.allocatedAmount, 0);
    const thisAllocated = detailView === 'group' && linkedGroup
        ? linkedGroup.envelopes.reduce((s, e) => s + e.allocatedAmount, 0)
        : selectedEnvelope.allocatedAmount;
    const sharePct = totalActiveAllocated > 0 ? Math.min((thisAllocated / totalActiveAllocated) * 100, 100) : 0;
    const shareColor = sharePct >= 75 ? '#dc2626' : sharePct >= 50 ? '#d97706' : MAROON;

    const balanceThreshold = detailView === 'group' && linkedGroup
        ? linkedGroup.envelopes.map(e => e.balanceThreshold).filter((t): t is number => t != null).sort((a, b) => a - b)[0]
        : selectedEnvelope.balanceThreshold;
    const projectedBalance = accountBalance !== undefined ? accountBalance - totalActiveAllocated : undefined;
    const thresholdBuffer  = projectedBalance !== undefined && balanceThreshold !== undefined ? projectedBalance - balanceThreshold : undefined;
    const thresholdStatus: 'safe' | 'at-risk' | 'over' | null =
        thresholdBuffer === undefined ? null
            : thresholdBuffer <= 0 ? 'over'
                : thresholdBuffer < balanceThreshold! * 0.5 ? 'at-risk'
                    : 'safe';

    return (
        <>
            <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: BORDER, bgcolor: PANEL_BG, boxShadow: '0 2px 10px rgba(122,31,43,0.08)' }}>

                {/* ── Header — gradient hero unchanged; the only new thing is the kebab
                    button, which is where every secondary action now lives ───────── */}
                <Box sx={{ p: 2.5, background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 60%, #5a1515 100%)`, position: 'relative', overflow: 'hidden' }}>
                    <Box sx={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.75, position: 'relative' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                            <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Target size={18} color="#fff" />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 500, fontSize: '0.92rem', color: '#fff' }}>{selectedEnvelope.envelopeName}</Typography>
                                <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>{selectedEnvelope.description}</Typography>
                                {isPayoff && plan && (
                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.6 }}>
                                        <Box sx={{ px: 1, py: 0.15, borderRadius: '999px', bgcolor: 'rgba(255,255,255,0.16)' }}>
                                            <Typography sx={{ fontSize: '0.62rem', fontWeight: 500, color: '#fff' }}>{plan.merchant}</Typography>
                                        </Box>
                                        <Box sx={{ px: 1, py: 0.15, borderRadius: '999px', bgcolor: 'rgba(255,255,255,0.16)' }}>
                                            <Typography sx={{ fontSize: '0.62rem', fontWeight: 500, color: '#fff' }}>
                                                {plan.provider ? `${plan.provider} · ` : ''}{plan.paymentType}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                            <IconButton size="small" aria-label="More actions" onClick={(e) => setActionsMenuAnchor(e.currentTarget)}
                                        sx={{ color: 'rgba(255,255,255,0.75)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' } }}>
                                <MoreHorizontal size={16} />
                            </IconButton>
                            <IconButton size="small" aria-label="Close" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.75)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' } }}>
                                <XCircle size={16} />
                            </IconButton>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1, position: 'relative' }}>
                        <Typography sx={{ fontSize: '1.7rem', fontWeight: 500, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(selectedEnvelope.currentAmount)}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>of {fmt(selectedEnvelope.targetAmount)}</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={progressPct(selectedEnvelope.currentAmount, selectedEnvelope.targetAmount)}
                                    sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)', position: 'relative', '& .MuiLinearProgress-bar': { bgcolor: '#fff', borderRadius: 3 } }} />

                    {(vel !== null || req !== null) && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.25, position: 'relative' }}>
                            <VelocityChip days={vel} />
                            {req !== null && (
                                <Typography sx={{ fontSize: '0.72rem', color: '#fff', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                                    {fmt(req)}/mo needed
                                </Typography>
                            )}
                        </Box>
                    )}
                </Box>

                {/* ── Secondary actions menu — Add contribution stays out on the header as
                    its own icon since it's the frequent action; everything else lives here ── */}
                <Menu
                    anchorEl={actionsMenuAnchor}
                    open={Boolean(actionsMenuAnchor)}
                    onClose={closeActionsMenu}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{ sx: { borderRadius: '10px', border: BORDER, boxShadow: '0 8px 24px rgba(122,31,43,0.18)', minWidth: 210, mt: 0.5 } }}
                >
                    <MenuItem onClick={() => { closeActionsMenu(); onAddManual(selectedEnvelope.id); }}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                            {selectedEnvelope.contributionMode === 'MANUAL' ? <Plus size={15} color="#a35c5c" /> : <Settings2 size={15} color="#a35c5c" />}
                        </ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: '0.8rem' }}>
                            {selectedEnvelope.contributionMode === 'MANUAL' ? 'Add contribution' : 'Edit auto-track rule'}
                        </ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => { closeActionsMenu(); setGoalDialogOpen(true); }}>
                        <ListItemIcon sx={{ minWidth: 30 }}><SlidersHorizontal size={15} color="#a35c5c" /></ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: '0.8rem' }}>Update goal</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => { closeActionsMenu(); setNotifSettingsOpen(true); }}>
                        <ListItemIcon sx={{ minWidth: 30 }}><CreditCard size={15} color="#a35c5c" /></ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: '0.8rem' }}>Notification settings</ListItemText>
                    </MenuItem>
                    {selectedEnvelope.status === 'ACTIVE' && (
                        <MenuItem onClick={() => { closeActionsMenu(); onSnack('Pause — coming soon!', 'info'); }}>
                            <ListItemIcon sx={{ minWidth: 30 }}><PauseCircle size={15} color="#a35c5c" /></ListItemIcon>
                            <ListItemText primaryTypographyProps={{ fontSize: '0.8rem' }}>Pause envelope</ListItemText>
                        </MenuItem>
                    )}
                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem onClick={() => { closeActionsMenu(); onSnack('Edit — coming soon!', 'info'); }}>
                        <ListItemIcon sx={{ minWidth: 30 }}><MoreHorizontal size={15} color="#a35c5c" /></ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: '0.8rem' }}>More options</ListItemText>
                    </MenuItem>
                </Menu>

                {/* ── Individual / linked-group toggle ───────────────────── */}
                {selectedEnvelope.linked && linkedGroup && (
                    <Box sx={{ px: 2.5, py: 1.25, borderBottom: BORDER, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ display: 'flex', gap: 0.5, p: '3px', borderRadius: '8px', bgcolor: '#f5e5e5', flex: 1 }}>
                            {([
                                { key: 'individual' as const, label: 'This envelope' },
                                { key: 'group' as const, label: `Group (${linkedGroup.envelopes.length})` },
                            ]).map(({ key, label }) => (
                                <Button key={key} size="small" fullWidth onClick={() => setDetailView(key)}
                                        sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', py: 0.4,
                                            ...(detailView === key
                                                ? { bgcolor: '#fff', color: MAROON, boxShadow: '0 1px 2px rgba(0,0,0,0.08)', '&:hover': { bgcolor: '#fff' } }
                                                : { bgcolor: 'transparent', color: '#a35c5c', '&:hover': { bgcolor: alpha('#fff', 0.5) } }) }}>
                                    {label}
                                </Button>
                            ))}
                        </Box>
                    </Box>
                )}

                {detailView === 'individual' ? (
                    <>
                        {/* ── Fund: closure warning — the one contextual banner that stays visible
                            outside the menu, since it's urgent rather than routine ─────────── */}
                        {isFund && fund?.connectionStatus === 'critical' && (
                            <Box sx={{ px: 2.5, py: 1.5, borderBottom: BORDER, bgcolor: '#fdeaea', display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: '#dc2626' }}>
                                        Connect an account or this envelope closes in {fund.daysUntilClosure} day{fund.daysUntilClosure === 1 ? '' : 's'}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.68rem', color: '#7a4a4a' }}>
                                        Auto-closes {fund.closureDeadline ? fmtDate(fund.closureDeadline) : '—'} if no account is linked
                                    </Typography>
                                </Box>
                                <Button size="small" variant="contained" disableElevation startIcon={<Link2 size={12} />}
                                        onClick={() => handleConnectAccount(selectedEnvelope.id)}
                                        sx={{ bgcolor: '#dc2626', textTransform: 'none', fontWeight: 500, fontSize: '0.7rem', borderRadius: '8px', flexShrink: 0, '&:hover': { bgcolor: '#b91c1c' } }}>
                                    Connect
                                </Button>
                            </Box>
                        )}

                        {/* ── Payoff: deferred-interest risk — same treatment as the fund banner
                            above, since both are urgent state rather than routine actions ──── */}
                        {isPayoff && selectedEnvelope.paymentPlan && (
                            <Box sx={{ px: 2.5, py: 1.5, borderBottom: BORDER, bgcolor: alpha('#dc2626', 0.05), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                    <CreditCard size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                                    <Box>
                                        <Typography sx={{ fontWeight: 600, fontSize: '0.76rem', color: '#dc2626' }}>Payment plan available</Typography>
                                        <Typography sx={{ fontSize: '0.68rem', color: '#a34848', mt: 0.1 }}>
                                            {selectedEnvelope.paymentPlan.isDeferred
                                                ? `${fmt(selectedEnvelope.paymentPlan.deferredInterest)} interest at risk`
                                                : `${selectedEnvelope.paymentPlan.termMonths}-month plan`}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Button size="small" onClick={() => onSetLeftPanel('paymentplan')}
                                        endIcon={<ChevronRight size={12} />}
                                        sx={{ textTransform: 'none', fontWeight: 500, fontSize: '0.7rem', color: '#dc2626', minWidth: 0, flexShrink: 0 }}>
                                    View plan
                                </Button>
                            </Box>
                        )}

                        {/* ── Account — FUND only, and deliberately not a tab: connection state and
                            balance are account-level facts about this envelope, not one option among
                            History/Schedule/Budget. Lives here, above Overview, and collapses since
                            it's the least frequently needed section on a day-to-day basis. ──────── */}
                        {isFund && (
                            <Box sx={{ borderBottom: BORDER }}>
                                <Box onClick={() => setAccountExpanded(v => !v)}
                                     sx={{ px: 2.5, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, cursor: 'pointer', '&:hover': { bgcolor: '#fbf1f1' } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                        <Typography sx={SECTION_LABEL_SX} style={{ marginBottom: 0 }}>Account</Typography>
                                        {fund && connMeta && (
                                            <Chip size="small" icon={<connMeta.icon size={11} />} label={connMeta.label}
                                                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 500, flexShrink: 0,
                                                      bgcolor: alpha(connMeta.color, 0.1), color: connMeta.color,
                                                      '& .MuiChip-icon': { color: 'inherit', ml: '6px' } }} />
                                        )}
                                    </Box>
                                    <ChevronDown size={14} color="#999" style={{ flexShrink: 0, transform: accountExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                                </Box>

                                <Collapse in={accountExpanded}>
                                    <Box sx={{ px: 2.5, pb: 2 }}>
                                        {fund && connMeta ? (
                                            <Stack spacing={1.5}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                        {(fund.accountName || fund.institution) && (
                                                            <Typography sx={{ fontSize: '0.72rem', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {fund.accountName ?? fund.institution}{fund.accountMask ? ` ···${fund.accountMask}` : ''} · {fund.accountType}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    {fund.connectionStatus === 'connected' ? (
                                                        <Button size="small" startIcon={<Settings2 size={13} />}
                                                                onClick={() => onManageAccount?.(selectedEnvelope.id)}
                                                                sx={{ textTransform: 'none', fontWeight: 500, fontSize: '0.7rem', color: '#7a4a4a', minWidth: 0, flexShrink: 0 }}>
                                                            Manage
                                                        </Button>
                                                    ) : (
                                                        <Button size="small" variant="outlined" startIcon={<Link2 size={13} />}
                                                                onClick={() => handleConnectAccount(selectedEnvelope.id)}
                                                                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', borderColor: '#ecd9d9', color: MAROON, flexShrink: 0, '&:hover': { borderColor: MAROON, bgcolor: '#fbf1f1' } }}>
                                                            {fund.connectionStatus === 'error' ? 'Reconnect' : 'Connect account'}
                                                        </Button>
                                                    )}
                                                </Box>

                                                {fund.currentBalance != null && (
                                                    <Box sx={{ p: 1.25, borderRadius: '8px', border: BORDER, bgcolor: '#fbf1f1' }}>
                                                        <Typography sx={SECTION_LABEL_SX}>Linked account balance</Typography>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                            <Typography sx={{ fontSize: '1.15rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
                                                                {fmt(fund.currentBalance)}
                                                            </Typography>
                                                            {fund.currentBalanceAsOf && (
                                                                <Typography sx={{ fontSize: '0.65rem', color: '#999' }}>as of {fmtDate(fund.currentBalanceAsOf)}</Typography>
                                                            )}
                                                        </Box>
                                                        <Typography sx={{ fontSize: '0.65rem', color: '#999', mt: 0.25 }}>
                                                            The real balance in this account — may include money not tied to this envelope.
                                                        </Typography>
                                                    </Box>
                                                )}

                                                <Box>
                                                    <Typography sx={SECTION_LABEL_SX}>Balance history</Typography>
                                                    {balanceHistory && balanceHistory.length > 1 ? (
                                                        <Box sx={{ p: 1.25, borderRadius: '8px', border: BORDER }}>
                                                            <BalanceSparkline history={balanceHistory} color={color} />
                                                        </Box>
                                                    ) : (
                                                        <Typography sx={{ fontSize: '0.72rem', color: '#bbb', textAlign: 'center', py: 1.5 }}>
                                                            Balance history isn't available yet
                                                        </Typography>
                                                    )}
                                                </Box>

                                                <Box>
                                                    <Typography sx={SECTION_LABEL_SX}>Recent activity</Typography>
                                                    {!fundContributionActivity || fundContributionActivity.length === 0 ? (
                                                        <Typography sx={{ fontSize: '0.72rem', color: '#bbb', textAlign: 'center', py: 1.5 }}>
                                                            No confirmed activity for this envelope yet
                                                        </Typography>
                                                    ) : (
                                                        <Stack spacing={0.5}>
                                                            {fundContributionActivity.map((activity, i) => {
                                                                const meta = PROVENANCE_META[activity.provenance];
                                                                return (
                                                                    <Box key={`${activity.date}-${i}`} sx={{ p: 1, borderRadius: '8px', border: BORDER, bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                                        <Box sx={{ minWidth: 0 }}>
                                                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#111' }}>{fmtDate(activity.date)}</Typography>
                                                                            {activity.note && (
                                                                                <Typography sx={{ fontSize: '0.65rem', color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                    {activity.note}
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                                                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
                                                                                {fmt(activity.amount)}
                                                                            </Typography>
                                                                            <Chip size="small" label={meta.label}
                                                                                  sx={{ height: 15, fontSize: '0.55rem', fontWeight: 500, bgcolor: alpha(meta.color, 0.1), color: meta.color }} />
                                                                        </Box>
                                                                    </Box>
                                                                );
                                                            })}
                                                        </Stack>
                                                    )}
                                                </Box>
                                            </Stack>
                                        ) : (
                                            <Box sx={{ textAlign: 'center', py: 1.5 }}>
                                                <Typography sx={{ fontSize: '0.75rem', color: '#999', mb: 1.25 }}>No account connected yet</Typography>
                                                <Button size="small" variant="outlined" startIcon={<Link2 size={13} />}
                                                        onClick={() => handleConnectAccount(selectedEnvelope.id)}
                                                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', borderColor: '#ecd9d9', color: MAROON, '&:hover': { borderColor: MAROON, bgcolor: '#fbf1f1' } }}>
                                                    Connect account
                                                </Button>
                                            </Box>
                                        )}
                                    </Box>
                                </Collapse>
                            </Box>
                        )}

                        {/* ── Overview — icon stat tiles instead of a plain label/value grid,
                            plus a real momentum chart in place of the old static "this month" figure ── */}
                        <Box sx={{ p: 2.5, borderBottom: BORDER }}>
                            <Typography sx={SECTION_LABEL_SX}>Overview</Typography>

                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 1 }}>
                                {[
                                    { icon: Wallet, iconColor: color, label: 'Remaining', value: fmt(selectedEnvelope.remainingAmount) },
                                    { icon: Repeat, iconColor: color, label: 'Allocated', value: `${fmt(selectedEnvelope.allocatedAmount)}/mo` },
                                    { icon: Flame, iconColor: '#d97706', label: 'Streak', value: `${selectedEnvelope.streakMonths ?? 0}mo` },
                                ].map(({ icon: Icon, iconColor, label, value }) => (
                                    <Box key={label} sx={{ p: 1.25, borderRadius: '10px', border: BORDER, bgcolor: '#fff' }}>
                                        <Icon size={15} color={iconColor} />
                                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#111', mt: 0.6, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                                        <Typography sx={{ fontSize: '0.62rem', color: '#999', mt: 0.1 }}>{label}</Typography>
                                    </Box>
                                ))}
                            </Box>

                            {selectedEnvelope.targetDate && (
                                <Box sx={{ p: 1.1, borderRadius: '10px', border: BORDER, bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Calendar size={15} color="#a35c5c" />
                                        <Box>
                                            <Typography sx={{ fontSize: '0.75rem', color: '#111' }}>Target: {targetDateLabel}</Typography>
                                            <Typography sx={{ fontSize: '0.62rem', color: '#999' }}>Deadline</Typography>
                                        </Box>
                                    </Box>
                                    {daysLeft !== null && (
                                        <Chip size="small" label={`${daysLeft}d left`}
                                              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 500, bgcolor: alpha(deadlineColor, 0.1), color: deadlineColor }} />
                                    )}
                                </Box>
                            )}

                            <Divider sx={{ mb: 1.5 }} />

                            {/* Progress, plotted — pie (saved-vs-remaining split), bar (cumulative saved
                                by month), or line (same cumulative trend). All three chart the same
                                underlying progress-toward-goal data, not the separate monthly-contribution
                                figure shown elsewhere. */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography sx={SECTION_LABEL_SX} style={{ marginBottom: 0 }}>Progress</Typography>
                                <Box sx={{ display: 'flex', border: BORDER, borderRadius: '6px', overflow: 'hidden' }}>
                                    <IconButton size="small" aria-label="Pie chart" onClick={() => setOverviewChartMode('pie')}
                                                sx={{ borderRadius: 0, width: 24, height: 24,
                                                    bgcolor: overviewChartMode === 'pie' ? MAROON : '#fff',
                                                    color: overviewChartMode === 'pie' ? '#fff' : '#a35c5c',
                                                    '&:hover': { bgcolor: overviewChartMode === 'pie' ? MAROON : '#fbf1f1' } }}>
                                        <PieChart size={12} />
                                    </IconButton>
                                    <IconButton size="small" aria-label="Bar chart" onClick={() => setOverviewChartMode('bar')}
                                                sx={{ borderRadius: 0, width: 24, height: 24,
                                                    bgcolor: overviewChartMode === 'bar' ? MAROON : '#fff',
                                                    color: overviewChartMode === 'bar' ? '#fff' : '#a35c5c',
                                                    '&:hover': { bgcolor: overviewChartMode === 'bar' ? MAROON : '#fbf1f1' } }}>
                                        <BarChart2 size={12} />
                                    </IconButton>
                                    <IconButton size="small" aria-label="Line chart" onClick={() => setOverviewChartMode('line')}
                                                sx={{ borderRadius: 0, width: 24, height: 24,
                                                    bgcolor: overviewChartMode === 'line' ? MAROON : '#fff',
                                                    color: overviewChartMode === 'line' ? '#fff' : '#a35c5c',
                                                    '&:hover': { bgcolor: overviewChartMode === 'line' ? MAROON : '#fbf1f1' } }}>
                                        <LineChart size={12} />
                                    </IconButton>
                                </Box>
                            </Box>

                            {overviewChartMode === 'pie' ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <ProgressDonut current={selectedEnvelope.currentAmount} target={selectedEnvelope.targetAmount} color={color} />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.5 }}>
                                            <Box sx={{ width: 7, height: 7, borderRadius: '2px', bgcolor: color, flexShrink: 0 }} />
                                            <Typography sx={{ flex: 1, fontSize: '0.75rem', color: '#666' }}>Saved</Typography>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#111' }}>{fmt(selectedEnvelope.currentAmount)}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                            <Box sx={{ width: 7, height: 7, borderRadius: '2px', bgcolor: alpha(color, 0.15), flexShrink: 0 }} />
                                            <Typography sx={{ flex: 1, fontSize: '0.75rem', color: '#666' }}>Remaining</Typography>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#111' }}>{fmt(selectedEnvelope.remainingAmount)}</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            ) : (
                                <ProgressTrend contributions={contributions} envelopeId={selectedEnvelope.id} color={color} mode={overviewChartMode} />
                            )}

                            {selectedEnvelope.status === 'ACTIVE' && (
                                <>
                                    <Divider sx={{ my: 1.5 }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>Contribution mode</Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            {(['MANUAL', 'AUTO'] as const).map(mode => (
                                                <Button key={mode} size="small"
                                                        onClick={() => onToggleContribMode(selectedEnvelope.id, mode)}
                                                        sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 500, fontSize: '0.68rem', px: 1, py: 0.25, minWidth: 0,
                                                            ...(selectedEnvelope.contributionMode === mode
                                                                ? { bgcolor: alpha(color, 0.12), color, '&:hover': { bgcolor: alpha(color, 0.18) } }
                                                                : { color: '#999', '&:hover': { bgcolor: '#fbf1f1' } }) }}>
                                                    {mode === 'MANUAL' ? 'Manual' : 'Auto-track'}
                                                </Button>
                                            ))}
                                        </Box>
                                    </Box>
                                    {selectedEnvelope.contributionMode === 'AUTO' && selectedEnvelope.autoRule && (
                                        <Typography sx={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 500, mt: 0.5, textAlign: 'right' }}>
                                            {fmt(selectedEnvelope.autoRule.amount)} · {FREQUENCY_OPTIONS.find(o => o.value === selectedEnvelope.autoRule?.frequency)?.label ?? selectedEnvelope.autoRule?.frequency}
                                        </Typography>
                                    )}
                                </>
                            )}
                        </Box>

                        {/* ── Contributions / Plan / Account ─────────────────────────── */}
                        <Box sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography sx={SECTION_LABEL_SX}>Details</Typography>
                                {scheduledContributions.length > 0 && (
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        {paidCount > 0     && <Chip size="small" label={`${paidCount} paid`}      sx={{ height: 16, fontSize: '0.55rem', fontWeight: 500, bgcolor: alpha('#16a34a', 0.1), color: '#16a34a' }} />}
                                        {missedCount > 0   && <Chip size="small" label={`${missedCount} missed`}   sx={{ height: 16, fontSize: '0.55rem', fontWeight: 500, bgcolor: alpha('#dc2626', 0.1), color: '#dc2626' }} />}
                                        {upcomingCount > 0 && <Chip size="small" label={`${upcomingCount} ahead`}  sx={{ height: 16, fontSize: '0.55rem', fontWeight: 500, bgcolor: '#f0dede',    color: '#a35c5c'    }} />}
                                    </Box>
                                )}
                            </Box>

                            <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, p: '3px', borderRadius: '8px', bgcolor: '#f5e5e5', flexWrap: 'wrap' }}>
                                {tabOptions.map(({ key, label }) => (
                                    <Button key={key} size="small" onClick={() => setTab(key)}
                                            sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', py: 0.4, px: 1.25, flex: tabOptions.length > 3 ? '1 1 auto' : 1,
                                                ...(tab === key
                                                    ? { bgcolor: '#fff', color: '#111', boxShadow: '0 1px 2px rgba(0,0,0,0.08)', '&:hover': { bgcolor: '#fff' } }
                                                    : { bgcolor: 'transparent', color: '#999', '&:hover': { bgcolor: alpha('#fff', 0.6) } }) }}>
                                        {label}
                                    </Button>
                                ))}
                            </Box>

                            {/* Payment plan tab — PAYOFF only */}
                            {tab === 'plan' && isPayoff && (
                                plan ? (
                                    <Stack spacing={1.25}>
                                        <Box sx={{ p: 1.25, borderRadius: '8px', border: BORDER }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                                <Box>
                                                    <Typography sx={{ fontWeight: 500, fontSize: '0.8rem', color: '#111' }}>
                                                        {plan.paymentType}{plan.provider ? ` · ${plan.provider}` : ''}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.68rem', color: '#999' }}>{plan.merchant}</Typography>
                                                </Box>
                                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: MAROON }}>{fmt(plan.totalPaid)} paid</Typography>
                                            </Box>
                                            <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.5 }}>
                                                {plan.planUnitLabel.charAt(0).toUpperCase() + plan.planUnitLabel.slice(1)} {plan.planUnitsPaid} of {plan.planUnitsTotal}
                                            </Typography>
                                            <LinearProgress variant="determinate" value={Math.min((plan.planUnitsPaid / plan.planUnitsTotal) * 100, 100)}
                                                            sx={{ height: 5, borderRadius: 3, bgcolor: '#f0dede', '& .MuiLinearProgress-bar': { bgcolor: MAROON, borderRadius: 3 } }} />
                                        </Box>

                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 2, rowGap: 0.75 }}>
                                            {[
                                                ['APR', plan.apr ? `${plan.apr}%` : '0%'],
                                                [`Per ${plan.planUnitLabel}`, fmt(plan.perUnitAmount)],
                                                ['Next due', fmtDate(plan.nextDueDate)],
                                                ['Merchant', plan.merchant],
                                            ].map(([l, v]) => (
                                                <Box key={l} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>{l}</Typography>
                                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{v}</Typography>
                                                </Box>
                                            ))}
                                        </Box>

                                        {plan.isDeferred && (
                                            <Box sx={{ p: 1, borderRadius: '7px', bgcolor: '#fdf0e0', border: '1px solid #f5d9a8', display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                                                <AlertTriangle size={13} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.68rem', color: '#633806' }}>
                                                    {fmt(plan.deferredInterest ?? 0)} deferred interest applies if not paid off by {plan.deferredEndsOn ? fmtDate(plan.deferredEndsOn) : '—'}.
                                                </Typography>
                                            </Box>
                                        )}
                                    </Stack>
                                ) : (
                                    <Typography sx={{ fontSize: '0.75rem', color: '#bbb', textAlign: 'center', py: 2 }}>Payment plan details aren't available yet</Typography>
                                )
                            )}

                            {/* History tab */}
                            {tab === 'history' && (
                                <Box sx={{ maxHeight: 280, overflowY: 'auto', pr: 0.5 }}>
                                    {selectedContributions.length === 0
                                        ? <Typography sx={{ fontSize: '0.75rem', color: '#bbb', textAlign: 'center', py: 2 }}>No contributions in {monthLabel}</Typography>
                                        : <>
                                            {selectedContributions.map(c => <ContributionRow key={c.id} c={c} color={color} />)}
                                            <Box sx={{ mt: 1.5, p: 1.25, borderRadius: '8px', bgcolor: '#fbf1f1', border: BORDER, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography sx={{ fontWeight: 500, fontSize: '0.75rem', color: '#333' }}>Total this month</Typography>
                                                <Typography sx={{ fontWeight: 500, fontSize: '0.95rem', color, fontVariantNumeric: 'tabular-nums' }}>
                                                    {fmt(selectedContributions.reduce((s, c) => s + c.amount, 0))}
                                                </Typography>
                                            </Box>
                                        </>}
                                </Box>
                            )}

                            {/* Schedule tab */}
                            {tab === 'schedule' && (
                                <>
                                    {hasEditableSchedule && (
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                            <Button size="small" startIcon={<SlidersHorizontal size={13} />}
                                                    onClick={openScheduleDialogForBulk}
                                                    sx={{ textTransform: 'none', fontWeight: 500, fontSize: '0.7rem', color: MAROON, bgcolor: alpha(MAROON, 0.06), borderRadius: '8px', px: 1.25, py: 0.4, minWidth: 0, '&:hover': { bgcolor: alpha(MAROON, 0.12) } }}>
                                                Update multiple
                                            </Button>
                                        </Box>
                                    )}

                                    {scheduledContributions.length === 0 ? (
                                        <Typography sx={{ fontSize: '0.75rem', color: '#bbb', textAlign: 'center', py: 2 }}>No schedule generated</Typography>
                                    ) : (
                                        <>
                                            <Stack spacing={0.75} sx={{
                                                maxHeight: 280, overflowY: 'auto', pr: 0.5, mb: 0.75,
                                                '&::-webkit-scrollbar': { width: 5 },
                                                '&::-webkit-scrollbar-track': { background: 'transparent' },
                                                '&::-webkit-scrollbar-thumb': { background: alpha(MAROON, 0.22), borderRadius: 3 },
                                            }}>
                                                {scheduledContributions.map(sc => {
                                                    const isPaid      = sc.status === 'PAID';
                                                    const isMissed    = sc.status === 'MISSED';
                                                    const isDue       = new Date(sc.scheduledDate) <= now && !isPaid && !isMissed;
                                                    const isEditable  = !isPaid && !isMissed;

                                                    const statusColor = isPaid ? '#16a34a' : isMissed ? '#dc2626' : isDue ? '#d97706' : '#999';
                                                    const statusLabel = isPaid ? 'Paid' : isMissed ? 'Missed' : isDue ? 'Due' : 'Upcoming';

                                                    return (
                                                        <Box key={sc.id} sx={{
                                                            display: 'flex', alignItems: 'center', gap: 1,
                                                            p: 1, pl: 1.1, borderRadius: '8px',
                                                            border: '1px solid #ecd9d9', borderLeft: `3px solid ${statusColor}`,
                                                            bgcolor: isDue ? alpha('#d97706', 0.05) : '#fff',
                                                        }}>
                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, color: '#111' }}>
                                                                    {new Date(sc.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </Typography>
                                                                <Typography sx={{ fontSize: '0.62rem', color: '#999' }}>{sc.frequency}</Typography>
                                                            </Box>

                                                            <Chip size="small" label={statusLabel}
                                                                  sx={{ height: 18, fontSize: '0.6rem', fontWeight: 500, flexShrink: 0, bgcolor: alpha(statusColor, 0.12), color: statusColor }} />

                                                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums', minWidth: 62, textAlign: 'right', flexShrink: 0 }}>
                                                                {fmt(sc.amount)}
                                                            </Typography>

                                                            {isEditable ? (
                                                                <IconButton size="small" aria-label="Edit scheduled amount"
                                                                            onClick={() => openScheduleDialogForRow(sc.id)}
                                                                            sx={{ width: 26, height: 26, flexShrink: 0, color: '#bbb', '&:hover': { color: MAROON, bgcolor: alpha(MAROON, 0.06) } }}>
                                                                    <Pencil size={12} />
                                                                </IconButton>
                                                            ) : (
                                                                <Box sx={{ width: 26, flexShrink: 0 }} />
                                                            )}
                                                        </Box>
                                                    );
                                                })}
                                            </Stack>

                                            <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: '#fbf1f1', border: BORDER, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography sx={{ fontWeight: 500, fontSize: '0.75rem', color: '#333' }}>Total scheduled</Typography>
                                                    <Typography sx={{ fontSize: '0.65rem', color: '#999' }}>
                                                        {fmt(scheduledContributions.filter(c => c.status === 'PAID').reduce((s, c) => s + c.amount, 0))} paid so far
                                                    </Typography>
                                                </Box>
                                                <Typography sx={{ fontWeight: 500, fontSize: '0.95rem', color, fontVariantNumeric: 'tabular-nums' }}>
                                                    {fmt(scheduledContributions.reduce((s, c) => s + c.amount, 0))}
                                                </Typography>
                                            </Box>
                                        </>
                                    )}
                                </>
                            )}

                            {/* Budget impact tab */}
                            {tab === 'budget' && (
                                <Stack spacing={1.25}>
                                    <Box sx={{ p: 1.25, borderRadius: '8px', border: BORDER }}>
                                        <Typography sx={SECTION_LABEL_SX}>Budget share</Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
                                            <Typography sx={{ fontSize: '1.05rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
                                                {fmt(thisAllocated)}<Box component="span" sx={{ fontSize: '0.72rem', color: '#999', fontWeight: 400 }}>/mo</Box>
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.72rem', color: shareColor, fontWeight: 500 }}>
                                                {sharePct.toFixed(0)}% of {fmt(totalActiveAllocated)} total
                                            </Typography>
                                        </Box>
                                        <LinearProgress variant="determinate" value={sharePct}
                                                        sx={{ height: 6, borderRadius: 3, bgcolor: '#f0dede', '& .MuiLinearProgress-bar': { bgcolor: shareColor, borderRadius: 3 } }} />
                                    </Box>

                                    <Box sx={{ p: 1.25, borderRadius: '8px', border: BORDER }}>
                                        <Typography sx={SECTION_LABEL_SX}>Balance threshold safety</Typography>

                                        {thresholdStatus === null ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                                                <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: '#f0dede', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Gauge size={15} color="#a35c5c" />
                                                </Box>
                                                <Typography sx={{ fontSize: '0.72rem', color: '#999', lineHeight: 1.5 }}>
                                                    Account balance isn't connected yet. Once it is, this will show whether your envelope contributions keep you above your balance threshold.
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                                                    <Box sx={{
                                                        width: 30, height: 30, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                        bgcolor: thresholdStatus === 'safe' ? '#eaf3de' : '#fdeaea',
                                                    }}>
                                                        {thresholdStatus === 'safe'
                                                            ? <ShieldCheck size={16} color="#3b6d11" />
                                                            : <AlertTriangle size={16} color="#a32d2d" />}
                                                    </Box>
                                                    <Box>
                                                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, color: thresholdStatus === 'safe' ? '#27500a' : '#791f1f' }}>
                                                            {thresholdStatus === 'safe' ? 'Staying safely above threshold'
                                                                : thresholdStatus === 'at-risk' ? 'Close to your minimum threshold'
                                                                    : 'Below your minimum threshold'}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.68rem', color: thresholdStatus === 'safe' ? '#639922' : '#c14d4d', mt: 0.1 }}>
                                                            {thresholdBuffer! >= 0
                                                                ? `${fmt(thresholdBuffer!)} buffer left after this month's allocations`
                                                                : `${fmt(Math.abs(thresholdBuffer!))} below threshold after this month's allocations`}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Box sx={{ position: 'relative', height: 8, borderRadius: '4px', overflow: 'hidden', bgcolor: thresholdStatus === 'safe' ? '#eaf3de' : '#fdeaea' }}>
                                                    <Box sx={{
                                                        position: 'absolute', left: 0, top: 0, bottom: 0,
                                                        width: `${Math.max(0, Math.min(100, (projectedBalance! / (accountBalance ?? 1)) * 100))}%`,
                                                        bgcolor: thresholdStatus === 'safe' ? '#639922' : '#a32d2d',
                                                    }} />
                                                    <Box sx={{
                                                        position: 'absolute', top: -3, bottom: -3, width: '2px',
                                                        left: `${Math.max(0, Math.min(100, (balanceThreshold! / (accountBalance ?? 1)) * 100))}%`,
                                                        bgcolor: thresholdStatus === 'safe' ? '#27500a' : '#791f1f',
                                                    }} />
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                                    <Typography sx={{ fontSize: '0.6rem', color: '#999' }}>$0</Typography>
                                                    <Typography sx={{ fontSize: '0.6rem', color: thresholdStatus === 'safe' ? '#27500a' : '#791f1f' }}>min threshold {fmt(balanceThreshold!)}</Typography>
                                                    <Typography sx={{ fontSize: '0.6rem', color: '#999' }}>balance {fmt(accountBalance!)}</Typography>
                                                </Box>

                                                {thresholdStatus !== 'safe' && (
                                                    <Box sx={{ mt: 1, p: 1, borderRadius: '7px', bgcolor: '#fdf0e0', border: '1px solid #f5d9a8' }}>
                                                        <Typography sx={{ fontSize: '0.68rem', color: '#633806' }}>
                                                            Consider pausing or reducing an envelope's contribution this month.
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </>
                                        )}
                                    </Box>
                                </Stack>
                            )}
                        </Box>
                    </>
                ) : (
                    linkedGroup && (
                        <>
                            {/* ── Group overview ──────────────────────────────────── */}
                            <Box sx={{ p: 2.5, borderBottom: BORDER }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                                    <Typography sx={{ fontSize: '1.7rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
                                        {fmt(groupCurrentTotal)}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>of {fmt(groupTargetTotal)} combined</Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={groupProgressPct}
                                                sx={{ height: 6, borderRadius: 3, bgcolor: alpha(MAROON, 0.12), '& .MuiLinearProgress-bar': { bgcolor: MAROON, borderRadius: 3 } }} />
                                <Typography sx={{ fontSize: '0.72rem', color: MAROON, fontWeight: 500, mt: 0.75 }}>
                                    {groupProgressPct.toFixed(1)}% of group target
                                </Typography>
                            </Box>

                            <Box sx={{ p: 2.5, borderBottom: BORDER }}>
                                <Typography sx={SECTION_LABEL_SX}>Overview</Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 2, rowGap: 0.75 }}>
                                    {[
                                        { label: 'Remaining',    value: fmt(groupRemainingTotal) },
                                        { label: 'Allocated',    value: `${fmt(groupAllocatedTotal)}/mo` },
                                        { label: 'Nearest target', value: groupNearestTarget ? new Date(groupNearestTarget).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
                                        { label: 'This month',   value: groupThisMonthTotal > 0 ? fmt(groupThisMonthTotal) : '—' },
                                    ].map(({ label, value }) => (
                                        <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>{label}</Typography>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>

                            {/* ── Allocation breakdown ─────────────────────────────── */}
                            <Box sx={{ p: 2.5, borderBottom: BORDER }}>
                                <Typography sx={SECTION_LABEL_SX}>Allocation breakdown</Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
                                    <Typography sx={{ fontSize: '0.72rem', color: '#999' }}>Shared budget</Typography>
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, color: MAROON }}>{fmt(linkedGroup.sharedBudget)}/mo</Typography>
                                </Box>
                                <Box sx={{ height: 14, borderRadius: '7px', overflow: 'hidden', display: 'flex', mb: 1.25 }}>
                                    {linkedGroup.envelopes.map(member => {
                                        const memberColor = ENVELOPE_COLORS[member.envelopeType] ?? MAROON;
                                        const widthPct = linkedGroup.sharedBudget > 0 ? Math.min((member.allocatedAmount / linkedGroup.sharedBudget) * 100, 100) : 0;
                                        return widthPct > 0 ? <Box key={member.id} sx={{ width: `${widthPct}%`, bgcolor: memberColor }} /> : null;
                                    })}
                                    {allocationHeadroom > 0 && (
                                        <Box sx={{ width: `${headroomPct}%`, bgcolor: '#f0dede' }} />
                                    )}
                                </Box>
                                <Stack spacing={0.75}>
                                    {linkedGroup.envelopes.map(member => {
                                        const memberColor = ENVELOPE_COLORS[member.envelopeType] ?? MAROON;
                                        const memberSharePct = linkedGroup.sharedBudget > 0 ? (member.allocatedAmount / linkedGroup.sharedBudget) * 100 : 0;
                                        return (
                                            <Box key={member.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: memberColor, flexShrink: 0 }} />
                                                <Typography sx={{ flex: 1, fontSize: '0.75rem', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {member.envelopeName}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
                                                    {fmt(member.allocatedAmount)}/mo
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.68rem', color: '#999', width: 34, textAlign: 'right', flexShrink: 0 }}>
                                                    {memberSharePct.toFixed(0)}%
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                    {allocationHeadroom > 0 && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: '#f0dede', flexShrink: 0 }} />
                                            <Typography sx={{ flex: 1, fontSize: '0.75rem', color: '#999' }}>Unallocated headroom</Typography>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#999', fontVariantNumeric: 'tabular-nums' }}>
                                                {fmt(allocationHeadroom)}/mo
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.68rem', color: '#999', width: 34, textAlign: 'right', flexShrink: 0 }}>
                                                {headroomPct.toFixed(0)}%
                                            </Typography>
                                        </Box>
                                    )}
                                    {linkedGroup.sharedBudget > 0 && groupAllocatedTotal > linkedGroup.sharedBudget && (
                                        <Typography sx={{ fontSize: '0.68rem', color: '#dc2626', mt: 0.25 }}>
                                            Allocated total exceeds the shared budget by {fmt(groupAllocatedTotal - linkedGroup.sharedBudget)}/mo.
                                        </Typography>
                                    )}
                                </Stack>
                            </Box>

                            {/* ── Group actions ───────────────────────────────────── */}
                            {(onOpenLinkedGoalUpdate || onOpenGroupNotificationSettings) && (
                                <Box sx={{ p: 2.5, borderBottom: BORDER }}>
                                    <Typography sx={SECTION_LABEL_SX}>Actions</Typography>
                                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                                        {onOpenLinkedGoalUpdate && (
                                            <Button fullWidth variant="outlined" size="small" startIcon={<SlidersHorizontal size={13} />}
                                                    onClick={() => onOpenLinkedGoalUpdate(linkedGroup)}
                                                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', borderColor: '#ecd9d9', color: '#7a4a4a', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: '#fbf1f1' } }}>
                                                Update group goal
                                            </Button>
                                        )}
                                        {onOpenGroupNotificationSettings && (
                                            <Button fullWidth variant="outlined" size="small" startIcon={<Settings2 size={13} />}
                                                    onClick={() => onOpenGroupNotificationSettings(linkedGroup)}
                                                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', borderColor: '#ecd9d9', color: '#7a4a4a', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: '#fbf1f1' } }}>
                                                Notifications
                                            </Button>
                                        )}
                                    </Box>
                                </Box>
                            )}

                            {/* ── Budget impact ────────────────────────────────────── */}
                            <Box sx={{ p: 2.5, borderBottom: BORDER }}>
                                <Typography sx={SECTION_LABEL_SX}>Budget impact</Typography>
                                <Stack spacing={1.25}>
                                    <Box sx={{ p: 1.25, borderRadius: '8px', border: BORDER }}>
                                        <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.75 }}>Group's share of your budget</Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
                                            <Typography sx={{ fontSize: '1.05rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
                                                {fmt(thisAllocated)}<Box component="span" sx={{ fontSize: '0.72rem', color: '#999', fontWeight: 400 }}>/mo</Box>
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.72rem', color: shareColor, fontWeight: 500 }}>
                                                {sharePct.toFixed(0)}% of {fmt(totalActiveAllocated)} total
                                            </Typography>
                                        </Box>
                                        <LinearProgress variant="determinate" value={sharePct}
                                                        sx={{ height: 6, borderRadius: 3, bgcolor: '#f0dede', '& .MuiLinearProgress-bar': { bgcolor: shareColor, borderRadius: 3 } }} />
                                    </Box>

                                    <Box sx={{ p: 1.25, borderRadius: '8px', border: BORDER }}>
                                        <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.75 }}>Balance threshold safety</Typography>
                                        {thresholdStatus === null ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                                                <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: '#f0dede', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Gauge size={15} color="#a35c5c" />
                                                </Box>
                                                <Typography sx={{ fontSize: '0.72rem', color: '#999', lineHeight: 1.5 }}>
                                                    Account balance isn't connected yet. Once it is, this will show whether this group's contributions keep you above your balance threshold.
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{
                                                    width: 30, height: 30, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                    bgcolor: thresholdStatus === 'safe' ? '#eaf3de' : '#fdeaea',
                                                }}>
                                                    {thresholdStatus === 'safe'
                                                        ? <ShieldCheck size={16} color="#3b6d11" />
                                                        : <AlertTriangle size={16} color="#a32d2d" />}
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, color: thresholdStatus === 'safe' ? '#27500a' : '#791f1f' }}>
                                                        {thresholdStatus === 'safe' ? 'Staying safely above threshold'
                                                            : thresholdStatus === 'at-risk' ? 'Close to your minimum threshold'
                                                                : 'Below your minimum threshold'}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.68rem', color: thresholdStatus === 'safe' ? '#639922' : '#c14d4d', mt: 0.1 }}>
                                                        {thresholdBuffer! >= 0
                                                            ? `${fmt(thresholdBuffer!)} buffer left after this month's allocations`
                                                            : `${fmt(Math.abs(thresholdBuffer!))} below threshold after this month's allocations`}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                </Stack>
                            </Box>

                            {/* ── Member envelopes ────────────────────────────────── */}
                            <Box sx={{ p: 2.5 }}>
                                <Typography sx={SECTION_LABEL_SX}>Envelopes in this group</Typography>
                                <Stack spacing={0.75}>
                                    {linkedGroup.envelopes.map(member => {
                                        const memberColor = ENVELOPE_COLORS[member.envelopeType] ?? MAROON;
                                        const memberPct   = progressPct(member.currentAmount, member.targetAmount);
                                        const isCurrent   = member.id === selectedEnvelope.id;
                                        return (
                                            <Box key={member.id}
                                                 onClick={() => { onSelectEnvelope(member.id); }}
                                                 sx={{ p: 1, borderRadius: '8px', border: `1px solid ${isCurrent ? alpha(MAROON, 0.35) : '#ecd9d9'}`, bgcolor: isCurrent ? alpha(MAROON, 0.04) : '#fff', cursor: 'pointer', '&:hover': { borderColor: alpha(MAROON, 0.3), bgcolor: '#fbf1f1' } }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: memberColor, flexShrink: 0 }} />
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, color: '#111' }}>{member.envelopeName}</Typography>
                                                        <LinearProgress variant="determinate" value={memberPct}
                                                                        sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: alpha(memberColor, 0.12), '& .MuiLinearProgress-bar': { bgcolor: memberColor, borderRadius: 2 } }} />
                                                    </Box>
                                                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: memberColor, fontVariantNumeric: 'tabular-nums' }}>
                                                            {memberPct.toFixed(0)}%
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>{fmt(member.currentAmount)} / {fmt(member.targetAmount)}</Typography>
                                                    </Box>
                                                    {!isCurrent && <ArrowRight size={13} color="#ccc" style={{ flexShrink: 0 }} />}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        </>
                    )
                )}
            </Box>

            <NotificationSettingsDialog
                open={notifSettingsOpen}
                onClose={() => setNotifSettingsOpen(false)}
                subjectName={selectedEnvelope.envelopeName}
                prefs={notifPrefs}
                onTogglePref={handleTogglePref}
                eventSettings={eventSettings}
                onToggleEvent={handleToggleEvent}
                onSave={() => {
                    // TODO: POST to your API
                    onSnack('Notification settings saved', 'success');
                }}
            />

            <BulkScheduleUpdateDialog
                open={scheduleDialogOpen}
                onClose={closeScheduleDialog}
                envelopeId={selectedEnvelope.id}
                envelopeName={selectedEnvelope.envelopeName}
                scheduledContributions={scheduledContributions}
                color={color}
                initialSelectedIds={scheduleDialogTargetId !== null ? [scheduleDialogTargetId] : undefined}
                onSubmit={handleScheduleDialogSubmit}
            />

            <GoalUpdateDialog
                open={goalDialogOpen}
                envelope={selectedEnvelope}
                isLinked={selectedEnvelope.linked ?? false}
                onClose={() => setGoalDialogOpen(false)}
                onSubmit={handleGoalUpdate}
                totalEnvelopes={totalEnvelopes ?? envelopes.filter(e => e.status === 'ACTIVE').length}
            />

            {/* ── Plaid Link — only mounted when the user has no usable connection yet and needs
                 to run Link before we can list any accounts to pick from. ── */}
            {plaidLinkToken && (
                <PlaidLink
                    key={plaidLinkToken}
                    ref={plaidLinkRef}
                    linkToken={plaidLinkToken}
                    onConnect={() => {
                        plaidLinkRef.current?.open();
                    }}
                    onSuccess={async (publicToken) => {
                        setPlaidLinkToken(null);
                        if (userId) {
                            try {
                                await PlaidService.getInstance().exchangePublicToken(publicToken, userId);
                                await PlaidService.getInstance().fetchAndLinkPlaidAccounts(userId);
                                await loadEligibleAccounts(userId);
                                setConnectDialogOpen(true);
                            } catch {
                                onSnack('Connected to Plaid, but could not load your accounts', 'error');
                            }
                        }
                    }}
                    onExit={(error) => {
                        setPlaidLinkToken(null);
                        if (error) onSnack('Account connection was not completed', 'info');
                    }}
                />
            )}

            <ConnectFundAccountDialog
                open={connectDialogOpen}
                loading={connectAccountsLoading}
                accounts={eligibleAccounts}
                envelopeName={selectedEnvelope.envelopeName}
                onSelect={handleAccountSelected}
                onLinkNewAccount={handleLinkNewAccount}
                onClose={() => { setConnectDialogOpen(false); setPendingConnectEnvelopeId(null); }}
            />
        </>
    );
};

export default EnvelopeDetailPanel;