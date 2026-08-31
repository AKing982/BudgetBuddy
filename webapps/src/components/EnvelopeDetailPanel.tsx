import React, { useEffect, useState } from 'react';
import {
    alpha, Box, Button, Chip, Divider, IconButton,
    LinearProgress, Stack, Typography,
} from '@mui/material';
import {
    Plus, Target, MoreHorizontal, PauseCircle, CreditCard,
    Settings2, RefreshCcw, ChevronRight, SlidersHorizontal,
    Pencil, ArrowRight, ShieldCheck, AlertTriangle, Gauge,
    Link2, CheckCircle2, Info,
} from 'lucide-react';
import { XCircle } from 'lucide-react';
import { BudgetEnvelope, EnvelopeContribution, ScheduledContribution } from '../config/Types';
import { LinkedEnvelopeGroup } from '../services/BudgetEnvelopeService';
import { ENVELOPE_COLORS, MAROON, MAROON_DARK, FREQUENCY_OPTIONS } from '../config/Constants';
import { fmt, daysUntil, progressPct, velocityDays, requiredMonthly, monthlyContributed, isEnvelopeActiveInMonth } from '../config/Helpers';
import { VelocityChip, PanelHeader, ContributionRow } from './Shared';
import GoalUpdateDialog, { GoalUpdateValues } from './GoalUpdateDialog';
import NotificationDialog from "./NotificationsDialog";
import { Bell } from 'lucide-react';
import NotificationSettingsDialog from "./NotificationSettingsDialog";
import {NotificationEventSettings, NotificationPrefs} from "./NotificationToggle";
import BulkScheduleUpdateDialog from './BulkScheduleUpdateDialog';

type LeftPanelView = 'envelopes' | 'analytics' | 'paymentplan' | 'planadjuster';

interface ScheduleUpdate {
    id:     number;
    amount: number;
}

// ─────────────────────────────────────────────────────────────────────────
// TODO: move these two types + the FundConnectionStatus union into
// ../config/Types.ts, and add 'PAYOFF' | 'FUND' to BudgetEnvelope.envelopeType
// (plus a 'FUND' entry in ENVELOPE_COLORS) if they aren't there already.
// They're kept local here so this file is a drop-in preview of the feature;
// wiring them onto BudgetEnvelope itself is a one-line follow-up per project.
// ─────────────────────────────────────────────────────────────────────────

/** Payoff-specific plan info — merchant financing, BNPL, or a straight credit card. */
export interface PaymentPlanDetails {
    /** Who the money is owed to, e.g. "Amazon", "Chase". */
    merchant: string;
    /** The financing partner, if any — "Affirm", "Klarna". Null for a plain credit card. */
    provider?: string | null;
    /** Free-text plan label: "Credit card", "Pay in 4", "Pay in 30", "Installments", etc. */
    paymentType: string;
    /** 0 for interest-free BNPL plans. */
    apr: number;
    isDeferred: boolean;
    deferredInterest?: number;
    deferredEndsOn?: string | null;
    /** What one unit of the plan is called — drives copy like "installment 2 of 4" vs "month 6 of 18". */
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
    institution?: string | null;
    /** e.g. "Roth IRA", "High-Yield Savings", "Brokerage". */
    accountType: string;
    apy?: number | null;
    lastSyncedAt?: string | null;
    /** Annual contribution cap, for accounts that have one (Roth IRA, HSA, ...). Null if not applicable. */
    contributionLimitYear?: number | null;
    contributionYTD?: number | null;
    liquidityNote?: string;
    taxAdvantaged?: boolean;
    /** Whether extra envelope funds automatically sweep into the linked account. */
    autoSweep?: boolean;
    /** Only set once connectionStatus is 'critical' — when the envelope will auto-close if nothing is connected. */
    closureDeadline?: string | null;
    daysUntilClosure?: number | null;
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
    /** Total active envelopes count — passed to the priority slider */
    totalEnvelopes?:        number;
    /** Persist edited amounts for one or more scheduled (not-yet-paid) contributions */
    onUpdateSchedule?:      (envelopeId: number, updates: ScheduleUpdate[]) => Promise<void> | void;
    /** The linked group the selected envelope belongs to, if any — enables the individual/group toggle */
    linkedGroup?:                    LinkedEnvelopeGroup | null;
    onOpenLinkedGoalUpdate?:         (group: LinkedEnvelopeGroup) => void;
    onOpenGroupNotificationSettings?:(group: LinkedEnvelopeGroup) => void;
    /** Which view to show first for the current selection — lets the caller open straight into group stats */
    initialDetailView?:              'individual' | 'group';
    /**
     * Current account balance, once wired up on the backend. Until then this stays
     * undefined and the balance-threshold-safety card shows a "not connected yet" state
     * instead of guessing at numbers.
     */
    accountBalance?:                 number;
    /** PAYOFF envelopes only — merchant, provider, plan progress. Undefined shows a placeholder. */
    paymentPlanDetails?:             PaymentPlanDetails;
    /** FUND envelopes only — linked-account status and fund-specific criteria. Undefined shows a placeholder. */
    fundAccountDetails?:             FundAccountDetails;
    /** FUND envelopes only — called when the user starts linking an account (fresh connect or re-auth after an error). */
    onConnectAccount?:               (envelopeId: number) => void;
    /** FUND envelopes only — called when the user wants to manage an already-connected account. */
    onManageAccount?:                (envelopeId: number) => void;
}

// ── Shared style tokens — warm maroon-tinted surfaces, not stark white ─────
const SECTION_LABEL_SX = {
    fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.06em', color: '#a35c5c', mb: 1,
};
const BORDER    = '1px solid #ecd9d9';
const PANEL_BG  = '#fdf7f7';
const CARD_HOVER_BG = '#fbf1f1';

// Connection-status → color/label/icon, shared by the banner and the strip below it.
const CONNECTION_META: Record<FundConnectionStatus, { color: string; label: string; icon: React.ElementType }> = {
    connected:    { color: '#16a34a', label: 'Connected',    icon: CheckCircle2 },
    disconnected: { color: '#8a8a8a', label: 'Not connected', icon: Link2 },
    critical:     { color: '#dc2626', label: 'Action needed', icon: AlertTriangle },
    error:        { color: '#dc2626', label: 'Sync error',   icon: AlertTriangle },
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const EnvelopeDetailPanel: React.FC<EnvelopeDetailPanelProps> = ({
                                                                     selectedEnvelope, envelopes, contributions, scheduledContributions,
                                                                     monthStart, monthEnd, monthLabel,
                                                                     onClose, onAddManual, onToggleContribMode,
                                                                     onSetLeftPanel, onSnack, onSelectEnvelope,
                                                                     totalEnvelopes, onUpdateSchedule,
                                                                     linkedGroup, onOpenLinkedGoalUpdate, onOpenGroupNotificationSettings,
                                                                     initialDetailView = 'individual',
                                                                     accountBalance,
                                                                     paymentPlanDetails, fundAccountDetails,
                                                                     onConnectAccount, onManageAccount,
                                                                 }) => {
    type TabKey = 'history' | 'schedule' | 'budget' | 'plan' | 'funddetails';
    const [tab, setTab] = useState<TabKey>('history');

    // ── Individual envelope vs linked-group stats toggle ────────────────────────
    const [detailView, setDetailView] = useState<'individual' | 'group'>(initialDetailView);
    useEffect(() => {
        setDetailView(initialDetailView);
    }, [selectedEnvelope?.id, initialDetailView]);

    // Default to the type-specific tab (Payment plan / Fund details) whenever the
    // selection changes, so the most relevant info is what the user sees first.
    useEffect(() => {
        console.log('Selected envelope changed:', selectedEnvelope);
        console.log('Selected envelope changed:', selectedEnvelope?.id);
        console.log('Select Envelope Type: ', selectedEnvelope?.envelopeType);
        setTab(
            selectedEnvelope?.envelopeType === 'PAYOFF' ? 'plan'
                : selectedEnvelope?.envelopeType === 'FUND' ? 'funddetails'
                    : 'history'
        );
    }, [selectedEnvelope?.id]);

    // ── Goal update dialog ─────────────────────────────────────────────────────
    const [goalDialogOpen, setGoalDialogOpen] = useState(false);
    const [notifDialogOpen, setNotifDialogOpen] = useState(false);
    const [notifOpen,         setNotifOpen]         = useState(false);
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
        console.log('Goal update requested:', envelopeId, values);
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
                                const c   = ENVELOPE_COLORS[env.envelopeType];
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
    const color = ENVELOPE_COLORS[selectedEnvelope.envelopeType];
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

    const overviewStats: { label: string; value: string }[] = [
        { label: 'Remaining',   value: fmt(selectedEnvelope.remainingAmount) },
        { label: 'Allocated',   value: `${fmt(selectedEnvelope.allocatedAmount)}/mo` },
        { label: 'Target date', value: selectedEnvelope.targetDate ? new Date(selectedEnvelope.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
        { label: 'Days left',   value: daysUntil(selectedEnvelope.targetDate) !== null ? `${daysUntil(selectedEnvelope.targetDate)}d` : '—' },
        { label: 'Streak',      value: `${selectedEnvelope.streakMonths ?? 0}mo` },
        { label: 'This month',  value: (() => { const mc = monthlyContributed(contributions, selectedEnvelope.id, monthStart, monthEnd); return mc > 0 ? fmt(mc) : '—'; })() },
    ];

    // ── Contribution / plan tabs — Payment plan and Fund details are inserted
    // ahead of the generic tabs when the envelope type calls for them ─────────
    const tabOptions: { key: TabKey; label: string }[] = [
        ...(isPayoff ? [{ key: 'plan' as TabKey, label: 'Payment plan' }] : []),
        ...(isFund ? [{ key: 'funddetails' as TabKey, label: 'Fund details' }] : []),
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

    // Balance threshold: individual envelopes carry their own; for a group, use the lowest threshold set among members
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

                {/* ── Header ──────────────────────────────────────────────── */}
                <Box sx={{ p: 2.5, background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 60%, #5a1515 100%)`, position: 'relative', overflow: 'hidden' }}>
                    <Box sx={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.75, position: 'relative' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Target size={18} color="#fff" />
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 500, fontSize: '0.92rem', color: '#fff' }}>{selectedEnvelope.envelopeName}</Typography>
                                <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>{selectedEnvelope.description}</Typography>
                                {/* Merchant / payment-type chips — Payoff envelopes only */}
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
                        <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.75)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' } }}>
                            <XCircle size={16} />
                        </IconButton>
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
                        {/* ── Fund: critical closure warning — outranks the plain connection strip ── */}
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
                                        onClick={() => onConnectAccount?.(selectedEnvelope.id)}
                                        sx={{ bgcolor: '#dc2626', textTransform: 'none', fontWeight: 500, fontSize: '0.7rem', borderRadius: '8px', flexShrink: 0, '&:hover': { bgcolor: '#b91c1c' } }}>
                                    Connect
                                </Button>
                            </Box>
                        )}

                        {/* ── Fund: linked-account status strip ──────────────────── */}
                        {isFund && fund && connMeta && (
                            <Box sx={{ px: 2.5, py: 1.25, borderBottom: BORDER, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip size="small"
                                          icon={<connMeta.icon size={11} />}
                                          label={connMeta.label}
                                          sx={{
                                              height: 20, fontSize: '0.65rem', fontWeight: 500,
                                              bgcolor: alpha(connMeta.color, 0.1), color: connMeta.color,
                                              '& .MuiChip-icon': { color: 'inherit', ml: '6px' },
                                          }} />
                                    {fund.institution && (
                                        <Typography sx={{ fontSize: '0.72rem', color: '#888' }}>{fund.institution} · {fund.accountType}</Typography>
                                    )}
                                </Box>
                                {fund.connectionStatus === 'connected' ? (
                                    <Button size="small" startIcon={<Settings2 size={13} />}
                                            onClick={() => onManageAccount?.(selectedEnvelope.id)}
                                            sx={{ textTransform: 'none', fontWeight: 500, fontSize: '0.7rem', color: '#7a4a4a', minWidth: 0 }}>
                                        Manage
                                    </Button>
                                ) : (
                                    <Button size="small"
                                            variant={fund.connectionStatus === 'critical' ? 'contained' : 'outlined'}
                                            disableElevation
                                            startIcon={<Link2 size={13} />}
                                            onClick={() => onConnectAccount?.(selectedEnvelope.id)}
                                            sx={fund.connectionStatus === 'critical'
                                                ? { bgcolor: '#dc2626', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', borderRadius: '8px', '&:hover': { bgcolor: '#b91c1c' } }
                                                : { borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', borderColor: '#ecd9d9', color: MAROON, '&:hover': { borderColor: MAROON, bgcolor: '#fbf1f1' } }}>
                                        {fund.connectionStatus === 'error' ? 'Reconnect' : 'Connect account'}
                                    </Button>
                                )}
                            </Box>
                        )}
                        {isFund && !fund && (
                            <Box sx={{ px: 2.5, py: 1.25, borderBottom: BORDER, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                <Typography sx={{ fontSize: '0.72rem', color: '#999' }}>No account connected yet</Typography>
                                <Button size="small" variant="outlined" startIcon={<Link2 size={13} />}
                                        onClick={() => onConnectAccount?.(selectedEnvelope.id)}
                                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', borderColor: '#ecd9d9', color: MAROON, '&:hover': { borderColor: MAROON, bgcolor: '#fbf1f1' } }}>
                                    Connect account
                                </Button>
                            </Box>
                        )}

                        {/* ── Overview ────────────────────────────────────────────── */}
                        <Box sx={{ p: 2.5, borderBottom: BORDER }}>
                            <Typography sx={SECTION_LABEL_SX}>Overview</Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 2, rowGap: 0.75 }}>
                                {overviewStats.map(({ label, value }) => (
                                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>{label}</Typography>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                                    </Box>
                                ))}
                            </Box>

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

                        {/* ── Actions ─────────────────────────────────────────────── */}
                        <Box sx={{ p: 2.5, borderBottom: BORDER }}>
                            <Typography sx={SECTION_LABEL_SX}>Actions</Typography>
                            <Stack spacing={0.75}>
                                {selectedEnvelope.contributionMode === 'MANUAL' ? (
                                    <Button fullWidth variant="contained" disableElevation startIcon={<Plus size={14} />}
                                            onClick={() => onAddManual(selectedEnvelope.id)}
                                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.78rem', bgcolor: color, '&:hover': { bgcolor: alpha(color, 0.85) } }}>
                                        Add contribution
                                    </Button>
                                ) : (
                                    <Button fullWidth variant="outlined" startIcon={<Settings2 size={14} />}
                                            onClick={() => onAddManual(selectedEnvelope.id)}
                                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.78rem', borderColor: '#0284c7', color: '#0284c7', '&:hover': { bgcolor: alpha('#0284c7', 0.05) } }}>
                                        Edit auto-track rule
                                    </Button>
                                )}

                                <Box sx={{ display: 'flex', gap: 0.75 }}>
                                    <Button fullWidth variant="outlined" size="small" startIcon={<SlidersHorizontal size={13} />}
                                            onClick={() => setGoalDialogOpen(true)}
                                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', borderColor: '#ecd9d9', color: '#7a4a4a', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: '#fbf1f1' } }}>
                                        Update goal
                                    </Button>
                                    <Button fullWidth variant="outlined" size="small" startIcon={<Settings2 size={13} />}
                                            onClick={() => setNotifSettingsOpen(true)}
                                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', borderColor: '#ecd9d9', color: '#7a4a4a', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: '#fbf1f1' } }}>
                                        Notifications
                                    </Button>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 0.75 }}>
                                    {selectedEnvelope.status === 'ACTIVE' && (
                                        <Button fullWidth variant="outlined" size="small" startIcon={<PauseCircle size={13} />}
                                                onClick={() => onSnack('Pause — coming soon!', 'info')}
                                                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', borderColor: '#ecd9d9', color: '#d97706', '&:hover': { borderColor: '#d97706', bgcolor: alpha('#d97706', 0.04) } }}>
                                            Pause
                                        </Button>
                                    )}
                                    <Button fullWidth variant="outlined" size="small" startIcon={<MoreHorizontal size={13} />}
                                            onClick={() => onSnack('Edit — coming soon!', 'info')}
                                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', borderColor: '#ecd9d9', color: '#7a4a4a', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: '#fbf1f1' } }}>
                                        More options
                                    </Button>
                                </Box>
                            </Stack>

                            {/* Payment plan prompt — links out to the dedicated plan-adjuster panel;
                                the "Payment plan" tab below covers the inline summary. */}
                            {selectedEnvelope.envelopeType === 'PAYOFF' && selectedEnvelope.paymentPlan && (
                                <Box sx={{ mt: 1.5, p: 1.25, borderRadius: '8px', border: `1px solid ${alpha('#dc2626', 0.25)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CreditCard size={14} color="#dc2626" style={{ flexShrink: 0 }} />
                                        <Box>
                                            <Typography sx={{ fontWeight: 500, fontSize: '0.75rem', color: '#dc2626' }}>Payment plan available</Typography>
                                            <Typography sx={{ fontSize: '0.63rem', color: '#a34848', mt: 0.1 }}>
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
                        </Box>

                        {/* ── Contributions ───────────────────────────────────────── */}
                        <Box sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography sx={SECTION_LABEL_SX}>Contributions</Typography>
                                {scheduledContributions.length > 0 && (
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        {paidCount > 0     && <Chip size="small" label={`${paidCount} paid`}      sx={{ height: 16, fontSize: '0.55rem', fontWeight: 500, bgcolor: alpha('#16a34a', 0.1), color: '#16a34a' }} />}
                                        {missedCount > 0   && <Chip size="small" label={`${missedCount} missed`}   sx={{ height: 16, fontSize: '0.55rem', fontWeight: 500, bgcolor: alpha('#dc2626', 0.1), color: '#dc2626' }} />}
                                        {upcomingCount > 0 && <Chip size="small" label={`${upcomingCount} ahead`}  sx={{ height: 16, fontSize: '0.55rem', fontWeight: 500, bgcolor: '#f0dede',    color: '#a35c5c'    }} />}
                                    </Box>
                                )}
                            </Box>

                            {/* Tab switcher — Payment plan / Fund details slot in ahead of the generic tabs */}
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

                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            {paidCount > 0     && <Chip size="small" label={`${paidCount} paid`}     sx={{ height: 18, fontSize: '0.6rem', fontWeight: 500, bgcolor: alpha('#16a34a', 0.1), color: '#16a34a' }} />}
                                            {missedCount > 0   && <Chip size="small" label={`${missedCount} missed`}  sx={{ height: 18, fontSize: '0.6rem', fontWeight: 500, bgcolor: alpha('#dc2626', 0.1), color: '#dc2626' }} />}
                                            {upcomingCount > 0 && <Chip size="small" label={`${upcomingCount} ahead`} sx={{ height: 18, fontSize: '0.6rem', fontWeight: 500, bgcolor: '#f0dede', color: '#a35c5c' }} />}
                                        </Box>
                                    </Stack>
                                ) : (
                                    <Typography sx={{ fontSize: '0.75rem', color: '#bbb', textAlign: 'center', py: 2 }}>Payment plan details aren't available yet</Typography>
                                )
                            )}

                            {/* Fund details tab — FUND only */}
                            {tab === 'funddetails' && isFund && (
                                fund ? (
                                    <Stack spacing={1.25}>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 2, rowGap: 0.75 }}>
                                            {[
                                                ['Account type', fund.accountType],
                                                ['Institution', fund.institution ?? '—'],
                                                ['APY', fund.apy != null ? `${fund.apy}%` : '—'],
                                                ['Tax-advantaged', fund.taxAdvantaged ? 'Yes' : 'No'],
                                            ].map(([l, v]) => (
                                                <Box key={l} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>{l}</Typography>
                                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#111' }}>{v}</Typography>
                                                </Box>
                                            ))}
                                        </Box>

                                        {fund.contributionLimitYear != null && (
                                            <Box sx={{ p: 1.25, borderRadius: '8px', border: BORDER }}>
                                                <Typography sx={SECTION_LABEL_SX}>Contribution limit ({new Date().getFullYear()})</Typography>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography sx={{ fontSize: '0.75rem' }}>{fmt(fund.contributionYTD ?? 0)} contributed</Typography>
                                                    <Typography sx={{ fontSize: '0.72rem', color: '#999' }}>of {fmt(fund.contributionLimitYear)}</Typography>
                                                </Box>
                                                <LinearProgress variant="determinate" value={Math.min(((fund.contributionYTD ?? 0) / fund.contributionLimitYear) * 100, 100)}
                                                                sx={{ height: 5, borderRadius: 3, bgcolor: '#fbeedd', '& .MuiLinearProgress-bar': { bgcolor: '#d97706', borderRadius: 3 } }} />
                                            </Box>
                                        )}

                                        {fund.liquidityNote && (
                                            <Typography sx={{ fontSize: '0.72rem', color: '#999', display: 'flex', gap: 0.75 }}>
                                                <Info size={12} style={{ marginTop: 2, flexShrink: 0 }} /> {fund.liquidityNote}
                                            </Typography>
                                        )}
                                        {fund.autoSweep && (
                                            <Typography sx={{ fontSize: '0.72rem', color: '#999', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <RefreshCcw size={11} /> Auto-sweep on — extra envelope funds move to this account monthly
                                            </Typography>
                                        )}
                                    </Stack>
                                ) : (
                                    <Typography sx={{ fontSize: '0.75rem', color: '#bbb', textAlign: 'center', py: 2 }}>Connect an account to see fund details</Typography>
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
                                                    sx={{ textTransform: 'none', fontWeight: 500, fontSize: '0.7rem', color: MAROON, minWidth: 0 }}>
                                                Update multiple
                                            </Button>
                                        </Box>
                                    )}

                                    {scheduledContributions.length === 0 ? (
                                        <Typography sx={{ fontSize: '0.75rem', color: '#bbb', textAlign: 'center', py: 2 }}>No schedule generated</Typography>
                                    ) : (
                                        <>
                                            <Stack spacing={0.75} sx={{ maxHeight: 280, overflowY: 'auto', pr: 0.5, mb: 0.75 }}>
                                                {scheduledContributions.map(sc => {
                                                    const isPaid      = sc.status === 'PAID';
                                                    const isMissed    = sc.status === 'MISSED';
                                                    const isDue       = new Date(sc.scheduledDate) <= now && !isPaid && !isMissed;
                                                    const isEditable  = !isPaid && !isMissed; // SCHEDULED (upcoming or due) rows only

                                                    const statusColor = isPaid ? '#16a34a' : isMissed ? '#dc2626' : isDue ? '#d97706' : '#999';
                                                    const statusLabel = isPaid ? 'Paid' : isMissed ? 'Missed' : isDue ? 'Due' : 'Upcoming';

                                                    return (
                                                        <Box key={sc.id} sx={{ p: 1, borderRadius: '8px', border: '1px solid #ecd9d9', bgcolor: '#fff' }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: statusColor, flexShrink: 0 }} />
                                                                <Box sx={{ flex: 1 }}>
                                                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#111' }}>
                                                                        {new Date(sc.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                    </Typography>
                                                                    <Typography sx={{ fontSize: '0.65rem', color: '#999' }}>{sc.frequency}</Typography>
                                                                </Box>

                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <Box sx={{ textAlign: 'right' }}>
                                                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
                                                                            {fmt(sc.amount)}
                                                                        </Typography>
                                                                        <Chip size="small" label={statusLabel}
                                                                              sx={{ height: 14, fontSize: '0.55rem', fontWeight: 500, bgcolor: alpha(statusColor, 0.1), color: statusColor }} />
                                                                    </Box>
                                                                    {isEditable && (
                                                                        <IconButton size="small" aria-label="Edit scheduled amount"
                                                                                    onClick={() => openScheduleDialogForRow(sc.id)}
                                                                                    sx={{ width: 24, height: 24, color: '#bbb', '&:hover': { color: MAROON, bgcolor: alpha(MAROON, 0.06) } }}>
                                                                            <Pencil size={12} />
                                                                        </IconButton>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                    );
                                                })}
                                            </Stack>

                                            {/* Total pinned outside scroll */}
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
                                    {/* Budget share */}
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

                                    {/* Balance threshold safety */}
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
                                        const memberColor = ENVELOPE_COLORS[member.envelopeType];
                                        const widthPct = linkedGroup.sharedBudget > 0 ? Math.min((member.allocatedAmount / linkedGroup.sharedBudget) * 100, 100) : 0;
                                        return widthPct > 0 ? <Box key={member.id} sx={{ width: `${widthPct}%`, bgcolor: memberColor }} /> : null;
                                    })}
                                    {allocationHeadroom > 0 && (
                                        <Box sx={{ width: `${headroomPct}%`, bgcolor: '#f0dede' }} />
                                    )}
                                </Box>
                                <Stack spacing={0.75}>
                                    {linkedGroup.envelopes.map(member => {
                                        const memberColor = ENVELOPE_COLORS[member.envelopeType];
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
                                        const memberColor = ENVELOPE_COLORS[member.envelopeType];
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

            {/* ── Scheduled contribution update dialog — single row or bulk selection ────────── */}
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

            {/* ── Goal update dialog ───────────────────────────────────────── */}
            <GoalUpdateDialog
                open={goalDialogOpen}
                envelope={selectedEnvelope}
                isLinked={selectedEnvelope.linked ?? false}
                onClose={() => setGoalDialogOpen(false)}
                onSubmit={handleGoalUpdate}
                totalEnvelopes={totalEnvelopes ?? envelopes.filter(e => e.status === 'ACTIVE').length}
            />
        </>
    );
};

export default EnvelopeDetailPanel;

// import React, { useEffect, useState } from 'react';
// import {
//     alpha, Box, Button, Chip, Divider, IconButton,
//     LinearProgress, Stack, Typography,
// } from '@mui/material';
// import {
//     Plus, Target, MoreHorizontal, PauseCircle, CreditCard,
//     Settings2, RefreshCcw, ChevronRight, SlidersHorizontal,
//     Pencil, Layers, ArrowRight, ShieldCheck, AlertTriangle, Gauge,
// } from 'lucide-react';
// import { XCircle } from 'lucide-react';
// import { BudgetEnvelope, EnvelopeContribution, ScheduledContribution } from '../config/Types';
// import { LinkedEnvelopeGroup } from '../services/BudgetEnvelopeService';
// import { ENVELOPE_COLORS, MAROON, MAROON_DARK, FREQUENCY_OPTIONS } from '../config/Constants';
// import { fmt, daysUntil, progressPct, velocityDays, requiredMonthly, monthlyContributed, isEnvelopeActiveInMonth } from '../config/Helpers';
// import { VelocityChip, PanelHeader, ContributionRow } from './Shared';
// import GoalUpdateDialog, { GoalUpdateValues } from './GoalUpdateDialog';
// import NotificationDialog from "./NotificationsDialog";
// import { Bell } from 'lucide-react';
// import NotificationSettingsDialog from "./NotificationSettingsDialog";
// import {NotificationEventSettings, NotificationPrefs} from "./NotificationToggle";
// import BulkScheduleUpdateDialog from './BulkScheduleUpdateDialog';
//
// type LeftPanelView = 'envelopes' | 'analytics' | 'paymentplan' | 'planadjuster';
//
// interface ScheduleUpdate {
//     id:     number;
//     amount: number;
// }
//
// interface EnvelopeDetailPanelProps {
//     selectedEnvelope:       BudgetEnvelope | null;
//     envelopes:              BudgetEnvelope[];
//     contributions:          EnvelopeContribution[];
//     scheduledContributions: ScheduledContribution[];
//     monthStart:             Date;
//     monthEnd:               Date;
//     monthLabel:             string;
//     onClose:                () => void;
//     onAddManual:            (id: number) => void;
//     onToggleContribMode:    (id: number, mode: 'MANUAL' | 'AUTO') => void;
//     onSetLeftPanel:         (view: LeftPanelView) => void;
//     onSnack:                (msg: string, sev: 'success' | 'error' | 'info' | 'warning') => void;
//     onSelectEnvelope:       (id: number) => void;
//     /** Total active envelopes count — passed to the priority slider */
//     totalEnvelopes?:        number;
//     /** Persist edited amounts for one or more scheduled (not-yet-paid) contributions */
//     onUpdateSchedule?:      (envelopeId: number, updates: ScheduleUpdate[]) => Promise<void> | void;
//     /** The linked group the selected envelope belongs to, if any — enables the individual/group toggle */
//     linkedGroup?:                    LinkedEnvelopeGroup | null;
//     onOpenLinkedGoalUpdate?:         (group: LinkedEnvelopeGroup) => void;
//     onOpenGroupNotificationSettings?:(group: LinkedEnvelopeGroup) => void;
//     /** Which view to show first for the current selection — lets the caller open straight into group stats */
//     initialDetailView?:              'individual' | 'group';
//     /**
//      * Current account balance, once wired up on the backend. Until then this stays
//      * undefined and the balance-threshold-safety card shows a "not connected yet" state
//      * instead of guessing at numbers.
//      */
//     accountBalance?:                 number;
// }
//
// // ── Shared style tokens — warm maroon-tinted surfaces, not stark white ─────
// const SECTION_LABEL_SX = {
//     fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' as const,
//     letterSpacing: '0.06em', color: '#a35c5c', mb: 1,
// };
// const BORDER    = '1px solid #ecd9d9';
// const PANEL_BG  = '#fdf7f7';
// const CARD_HOVER_BG = '#fbf1f1';
//
// const EnvelopeDetailPanel: React.FC<EnvelopeDetailPanelProps> = ({
//                                                                      selectedEnvelope, envelopes, contributions, scheduledContributions,
//                                                                      monthStart, monthEnd, monthLabel,
//                                                                      onClose, onAddManual, onToggleContribMode,
//                                                                      onSetLeftPanel, onSnack, onSelectEnvelope,
//                                                                      totalEnvelopes, onUpdateSchedule,
//                                                                      linkedGroup, onOpenLinkedGoalUpdate, onOpenGroupNotificationSettings,
//                                                                      initialDetailView = 'individual',
//                                                                      accountBalance,
//                                                                  }) => {
//     const [tab, setTab] = useState<'history' | 'schedule' | 'budget'>('history');
//
//     // ── Individual envelope vs linked-group stats toggle ────────────────────────
//     const [detailView, setDetailView] = useState<'individual' | 'group'>(initialDetailView);
//     useEffect(() => {
//         setDetailView(initialDetailView);
//     }, [selectedEnvelope?.id, initialDetailView]);
//
//     // ── Goal update dialog ─────────────────────────────────────────────────────
//     const [goalDialogOpen, setGoalDialogOpen] = useState(false);
//     const [notifDialogOpen, setNotifDialogOpen] = useState(false);
//     const [notifOpen,         setNotifOpen]         = useState(false);
//     const [notifSettingsOpen, setNotifSettingsOpen] = useState(false);
//     const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({ system: true, email: false });
//     const [eventSettings, setEventSettings] = useState<NotificationEventSettings>({
//         contributionReceived: true,
//         goalReached:          true,
//         fallingBehind:        true,
//         monthlyReminder:      false,
//     });
//
//     const handleTogglePref  = (channel: 'system' | 'email') =>
//         setNotifPrefs(p => ({ ...p, [channel]: !p[channel] }));
//
//     const handleToggleEvent = (key: keyof NotificationEventSettings) =>
//         setEventSettings(p => ({ ...p, [key]: !p[key] }));
//
//     const handleGoalUpdate = async (envelopeId: number, values: GoalUpdateValues) => {
//         // TODO: wire to real API call, e.g.:
//         // await BudgetEnvelopeService.getInstance().updateEnvelopeGoal(envelopeId, values);
//         console.log('Goal update requested:', envelopeId, values);
//         onSnack('Goal updated!', 'success');
//     };
//
//     // ── Scheduled contribution update dialog — handles both a single row and a bulk selection ──
//     const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
//     const [scheduleDialogTargetId, setScheduleDialogTargetId] = useState<number | null>(null);
//
//     const openScheduleDialogForRow = (id: number) => {
//         setScheduleDialogTargetId(id);
//         setScheduleDialogOpen(true);
//     };
//
//     const openScheduleDialogForBulk = () => {
//         setScheduleDialogTargetId(null);
//         setScheduleDialogOpen(true);
//     };
//
//     const closeScheduleDialog = () => {
//         setScheduleDialogOpen(false);
//         setScheduleDialogTargetId(null);
//     };
//
//     const handleScheduleDialogSubmit = async (envelopeId: number, updates: ScheduleUpdate[]) => {
//         try {
//             await onUpdateSchedule?.(envelopeId, updates);
//             onSnack(`Updated ${updates.length} scheduled contribution${updates.length > 1 ? 's' : ''}`, 'success');
//         } catch {
//             onSnack('Failed to update schedule', 'error');
//         }
//     };
//
//     // ── Filtered contributions ─────────────────────────────────────────────────
//     const selectedContributions = contributions.filter(c => {
//         if (c.envelopeId !== selectedEnvelope?.id) return false;
//         const d = new Date(c.contributedAt);
//         return d >= monthStart && d <= monthEnd;
//     });
//
//     // ── Quick overview (nothing selected) ─────────────────────────────────────
//     if (!selectedEnvelope) {
//         return (
//             <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: BORDER }}>
//                 <PanelHeader icon={<Target size={15} color="white" />} title="Quick overview" subtitle="Tap any envelope card for details" />
//                 <Box sx={{ bgcolor: PANEL_BG, p: 2.5 }}>
//                     <Typography sx={SECTION_LABEL_SX}>By priority</Typography>
//                     <Stack spacing={1.25}>
//                         {envelopes
//                             .filter(e => e.status === 'ACTIVE' && isEnvelopeActiveInMonth(e, monthStart, monthEnd))
//                             .sort((a, b) => a.priority - b.priority)
//                             .map(env => {
//                                 const c   = ENVELOPE_COLORS[env.envelopeType];
//                                 const pct = progressPct(env.currentAmount, env.targetAmount);
//                                 const vel = velocityDays(env);
//                                 return (
//                                     <Box key={env.id} onClick={() => onSelectEnvelope(env.id)}
//                                          sx={{ p: 1.5, borderRadius: '10px', cursor: 'pointer', border: BORDER, bgcolor: '#fff', '&:hover': { bgcolor: '#fbf1f1', borderColor: '#ddd' }, transition: 'all 0.15s' }}>
//                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                                                 <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: c, flexShrink: 0 }} />
//                                                 <Typography sx={{ fontWeight: 500, fontSize: '0.78rem', color: '#111' }}>{env.envelopeName}</Typography>
//                                             </Box>
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                                                 {env.contributionMode === 'AUTO' && <RefreshCcw size={9} color="#0284c7" />}
//                                                 <Typography sx={{ fontSize: '0.68rem', fontWeight: 500, color: c, fontVariantNumeric: 'tabular-nums' }}>{pct.toFixed(0)}%</Typography>
//                                             </Box>
//                                         </Box>
//                                         <LinearProgress variant="determinate" value={pct}
//                                                         sx={{ height: 4, borderRadius: 2, bgcolor: alpha(c, 0.12), '& .MuiLinearProgress-bar': { bgcolor: c, borderRadius: 2 } }} />
//                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, alignItems: 'center' }}>
//                                             <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>{fmt(env.currentAmount)} / {fmt(env.targetAmount)}</Typography>
//                                             <VelocityChip days={vel} />
//                                         </Box>
//                                     </Box>
//                                 );
//                             })}
//                     </Stack>
//
//                     <Divider sx={{ my: 2 }} />
//
//                     <Typography sx={SECTION_LABEL_SX}>Upcoming deadlines</Typography>
//                     <Stack spacing={1}>
//                         {envelopes
//                             .filter(e => e.status === 'ACTIVE' && e.targetDate && isEnvelopeActiveInMonth(e, monthStart, monthEnd))
//                             .sort((a, b) => new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime())
//                             .slice(0, 3)
//                             .map(env => {
//                                 const days = daysUntil(env.targetDate)!;
//                                 const dc   = days <= 60 ? '#d97706' : '#16a34a';
//                                 return (
//                                     <Box key={env.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75, borderBottom: BORDER, '&:last-child': { borderBottom: 'none' } }}>
//                                         <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#333' }}>{env.envelopeName}</Typography>
//                                         <Chip size="small" label={`${days}d`} sx={{ height: 18, fontSize: '0.6rem', fontWeight: 500, bgcolor: alpha(dc, 0.1), color: dc }} />
//                                     </Box>
//                                 );
//                             })}
//                     </Stack>
//                 </Box>
//             </Box>
//         );
//     }
//
//     // ── Selected envelope detail ───────────────────────────────────────────────
//     const color = ENVELOPE_COLORS[selectedEnvelope.envelopeType];
//     const vel   = velocityDays(selectedEnvelope);
//     const req   = requiredMonthly(selectedEnvelope);
//     const now   = new Date();
//
//     const paidCount     = scheduledContributions.filter(c => c.status === 'PAID').length;
//     const missedCount   = scheduledContributions.filter(c => c.status === 'MISSED').length;
//     const upcomingCount = scheduledContributions.filter(c => c.status === 'SCHEDULED').length;
//     const hasEditableSchedule = scheduledContributions.some(c => c.status !== 'PAID' && c.status !== 'MISSED');
//
//     const overviewStats: { label: string; value: string }[] = [
//         { label: 'Remaining',   value: fmt(selectedEnvelope.remainingAmount) },
//         { label: 'Allocated',   value: `${fmt(selectedEnvelope.allocatedAmount)}/mo` },
//         { label: 'Target date', value: selectedEnvelope.targetDate ? new Date(selectedEnvelope.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
//         { label: 'Days left',   value: daysUntil(selectedEnvelope.targetDate) !== null ? `${daysUntil(selectedEnvelope.targetDate)}d` : '—' },
//         { label: 'Streak',      value: `${selectedEnvelope.streakMonths ?? 0}mo` },
//         { label: 'This month',  value: (() => { const mc = monthlyContributed(contributions, selectedEnvelope.id, monthStart, monthEnd); return mc > 0 ? fmt(mc) : '—'; })() },
//     ];
//
//     // ── Linked-group aggregate stats (only computed when a group is present) ───
//     const groupCurrentTotal  = linkedGroup?.envelopes.reduce((s, e) => s + e.currentAmount, 0) ?? 0;
//     const groupTargetTotal   = linkedGroup?.envelopes.reduce((s, e) => s + e.targetAmount, 0) ?? 0;
//     const groupRemainingTotal= linkedGroup?.envelopes.reduce((s, e) => s + e.remainingAmount, 0) ?? 0;
//     const groupAllocatedTotal= linkedGroup?.envelopes.reduce((s, e) => s + e.allocatedAmount, 0) ?? 0;
//     const groupThisMonthTotal= linkedGroup?.envelopes.reduce((s, e) => s + monthlyContributed(contributions, e.id, monthStart, monthEnd), 0) ?? 0;
//     const groupProgressPct   = groupTargetTotal > 0 ? Math.min((groupCurrentTotal / groupTargetTotal) * 100, 100) : 0;
//     const groupNearestTarget = linkedGroup?.envelopes
//         .filter(e => e.targetDate)
//         .sort((a, b) => new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime())[0]?.targetDate ?? null;
//     const allocationHeadroom = linkedGroup ? Math.max(0, linkedGroup.sharedBudget - groupAllocatedTotal) : 0;
//     const headroomPct        = linkedGroup && linkedGroup.sharedBudget > 0 ? (allocationHeadroom / linkedGroup.sharedBudget) * 100 : 0;
//
//     // ── Budget impact — this envelope/group's share of total allocation, plus balance-threshold safety ──
//     const totalActiveAllocated = envelopes.filter(e => e.status === 'ACTIVE').reduce((s, e) => s + e.allocatedAmount, 0);
//     const thisAllocated = detailView === 'group' && linkedGroup
//         ? linkedGroup.envelopes.reduce((s, e) => s + e.allocatedAmount, 0)
//         : selectedEnvelope.allocatedAmount;
//     const sharePct = totalActiveAllocated > 0 ? Math.min((thisAllocated / totalActiveAllocated) * 100, 100) : 0;
//     const shareColor = sharePct >= 75 ? '#dc2626' : sharePct >= 50 ? '#d97706' : MAROON;
//
//     // Balance threshold: individual envelopes carry their own; for a group, use the lowest threshold set among members
//     const balanceThreshold = detailView === 'group' && linkedGroup
//         ? linkedGroup.envelopes.map(e => e.balanceThreshold).filter((t): t is number => t != null).sort((a, b) => a - b)[0]
//         : selectedEnvelope.balanceThreshold;
//     const projectedBalance = accountBalance !== undefined ? accountBalance - totalActiveAllocated : undefined;
//     const thresholdBuffer  = projectedBalance !== undefined && balanceThreshold !== undefined ? projectedBalance - balanceThreshold : undefined;
//     const thresholdStatus: 'safe' | 'at-risk' | 'over' | null =
//         thresholdBuffer === undefined ? null
//             : thresholdBuffer <= 0 ? 'over'
//                 : thresholdBuffer < balanceThreshold! * 0.5 ? 'at-risk'
//                     : 'safe';
//
//     return (
//         <>
//             <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: BORDER, bgcolor: PANEL_BG, boxShadow: '0 2px 10px rgba(122,31,43,0.08)' }}>
//
//                 {/* ── Header ──────────────────────────────────────────────── */}
//                 <Box sx={{ p: 2.5, background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 60%, #5a1515 100%)`, position: 'relative', overflow: 'hidden' }}>
//                     <Box sx={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)' }} />
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.75, position: 'relative' }}>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
//                             <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                                 <Target size={18} color="#fff" />
//                             </Box>
//                             <Box>
//                                 <Typography sx={{ fontWeight: 500, fontSize: '0.92rem', color: '#fff' }}>{selectedEnvelope.envelopeName}</Typography>
//                                 <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>{selectedEnvelope.description}</Typography>
//                             </Box>
//                         </Box>
//                         <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.75)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' } }}>
//                             <XCircle size={16} />
//                         </IconButton>
//                     </Box>
//
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1, position: 'relative' }}>
//                         <Typography sx={{ fontSize: '1.7rem', fontWeight: 500, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
//                             {fmt(selectedEnvelope.currentAmount)}
//                         </Typography>
//                         <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>of {fmt(selectedEnvelope.targetAmount)}</Typography>
//                     </Box>
//                     <LinearProgress variant="determinate" value={progressPct(selectedEnvelope.currentAmount, selectedEnvelope.targetAmount)}
//                                     sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)', position: 'relative', '& .MuiLinearProgress-bar': { bgcolor: '#fff', borderRadius: 3 } }} />
//
//                     {(vel !== null || req !== null) && (
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.25, position: 'relative' }}>
//                             <VelocityChip days={vel} />
//                             {req !== null && (
//                                 <Typography sx={{ fontSize: '0.72rem', color: '#fff', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
//                                     {fmt(req)}/mo needed
//                                 </Typography>
//                             )}
//                         </Box>
//                     )}
//                 </Box>
//
//                 {/* ── Individual / linked-group toggle ───────────────────── */}
//                 {selectedEnvelope.linked && linkedGroup && (
//                     <Box sx={{ px: 2.5, py: 1.25, borderBottom: BORDER, display: 'flex', alignItems: 'center', gap: 1 }}>
//                         <Box sx={{ display: 'flex', gap: 0.5, p: '3px', borderRadius: '8px', bgcolor: '#f5e5e5', flex: 1 }}>
//                             {([
//                                 { key: 'individual' as const, label: 'This envelope' },
//                                 { key: 'group' as const, label: `Group (${linkedGroup.envelopes.length})` },
//                             ]).map(({ key, label }) => (
//                                 <Button key={key} size="small" fullWidth onClick={() => setDetailView(key)}
//                                         sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', py: 0.4,
//                                             ...(detailView === key
//                                                 ? { bgcolor: '#fff', color: MAROON, boxShadow: '0 1px 2px rgba(0,0,0,0.08)', '&:hover': { bgcolor: '#fff' } }
//                                                 : { bgcolor: 'transparent', color: '#a35c5c', '&:hover': { bgcolor: alpha('#fff', 0.5) } }) }}>
//                                     {label}
//                                 </Button>
//                             ))}
//                         </Box>
//                     </Box>
//                 )}
//
//                 {detailView === 'individual' ? (
//                     <>
//                         {/* ── Overview ────────────────────────────────────────────── */}
//                         <Box sx={{ p: 2.5, borderBottom: BORDER }}>
//                             <Typography sx={SECTION_LABEL_SX}>Overview</Typography>
//                             <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 2, rowGap: 0.75 }}>
//                                 {overviewStats.map(({ label, value }) => (
//                                     <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
//                                         <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>{label}</Typography>
//                                         <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
//                                     </Box>
//                                 ))}
//                             </Box>
//
//                             {selectedEnvelope.status === 'ACTIVE' && (
//                                 <>
//                                     <Divider sx={{ my: 1.5 }} />
//                                     <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                                         <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>Contribution mode</Typography>
//                                         <Box sx={{ display: 'flex', gap: 0.5 }}>
//                                             {(['MANUAL', 'AUTO'] as const).map(mode => (
//                                                 <Button key={mode} size="small"
//                                                         onClick={() => onToggleContribMode(selectedEnvelope.id, mode)}
//                                                         sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 500, fontSize: '0.68rem', px: 1, py: 0.25, minWidth: 0,
//                                                             ...(selectedEnvelope.contributionMode === mode
//                                                                 ? { bgcolor: alpha(color, 0.12), color, '&:hover': { bgcolor: alpha(color, 0.18) } }
//                                                                 : { color: '#999', '&:hover': { bgcolor: '#fbf1f1' } }) }}>
//                                                     {mode === 'MANUAL' ? 'Manual' : 'Auto-track'}
//                                                 </Button>
//                                             ))}
//                                         </Box>
//                                     </Box>
//                                     {selectedEnvelope.contributionMode === 'AUTO' && selectedEnvelope.autoRule && (
//                                         <Typography sx={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 500, mt: 0.5, textAlign: 'right' }}>
//                                             {fmt(selectedEnvelope.autoRule.amount)} · {FREQUENCY_OPTIONS.find(o => o.value === selectedEnvelope.autoRule?.frequency)?.label ?? selectedEnvelope.autoRule?.frequency}
//                                         </Typography>
//                                     )}
//                                 </>
//                             )}
//                         </Box>
//
//                         {/* ── Actions ─────────────────────────────────────────────── */}
//                         <Box sx={{ p: 2.5, borderBottom: BORDER }}>
//                             <Typography sx={SECTION_LABEL_SX}>Actions</Typography>
//                             <Stack spacing={0.75}>
//                                 {selectedEnvelope.contributionMode === 'MANUAL' ? (
//                                     <Button fullWidth variant="contained" disableElevation startIcon={<Plus size={14} />}
//                                             onClick={() => onAddManual(selectedEnvelope.id)}
//                                             sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.78rem', bgcolor: color, '&:hover': { bgcolor: alpha(color, 0.85) } }}>
//                                         Add contribution
//                                     </Button>
//                                 ) : (
//                                     <Button fullWidth variant="outlined" startIcon={<Settings2 size={14} />}
//                                             onClick={() => onAddManual(selectedEnvelope.id)}
//                                             sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.78rem', borderColor: '#0284c7', color: '#0284c7', '&:hover': { bgcolor: alpha('#0284c7', 0.05) } }}>
//                                         Edit auto-track rule
//                                     </Button>
//                                 )}
//
//                                 <Box sx={{ display: 'flex', gap: 0.75 }}>
//                                     <Button fullWidth variant="outlined" size="small" startIcon={<SlidersHorizontal size={13} />}
//                                             onClick={() => setGoalDialogOpen(true)}
//                                             sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', borderColor: '#ecd9d9', color: '#7a4a4a', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: '#fbf1f1' } }}>
//                                         Update goal
//                                     </Button>
//                                     <Button fullWidth variant="outlined" size="small" startIcon={<Settings2 size={13} />}
//                                             onClick={() => setNotifSettingsOpen(true)}
//                                             sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', borderColor: '#ecd9d9', color: '#7a4a4a', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: '#fbf1f1' } }}>
//                                         Notifications
//                                     </Button>
//                                 </Box>
//
//                                 <Box sx={{ display: 'flex', gap: 0.75 }}>
//                                     {selectedEnvelope.status === 'ACTIVE' && (
//                                         <Button fullWidth variant="outlined" size="small" startIcon={<PauseCircle size={13} />}
//                                                 onClick={() => onSnack('Pause — coming soon!', 'info')}
//                                                 sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', borderColor: '#ecd9d9', color: '#d97706', '&:hover': { borderColor: '#d97706', bgcolor: alpha('#d97706', 0.04) } }}>
//                                             Pause
//                                         </Button>
//                                     )}
//                                     <Button fullWidth variant="outlined" size="small" startIcon={<MoreHorizontal size={13} />}
//                                             onClick={() => onSnack('Edit — coming soon!', 'info')}
//                                             sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', borderColor: '#ecd9d9', color: '#7a4a4a', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: '#fbf1f1' } }}>
//                                         More options
//                                     </Button>
//                                 </Box>
//                             </Stack>
//
//                             {/* Payment plan prompt */}
//                             {selectedEnvelope.envelopeType === 'PAYOFF' && selectedEnvelope.paymentPlan && (
//                                 <Box sx={{ mt: 1.5, p: 1.25, borderRadius: '8px', border: `1px solid ${alpha('#dc2626', 0.25)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
//                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                         <CreditCard size={14} color="#dc2626" style={{ flexShrink: 0 }} />
//                                         <Box>
//                                             <Typography sx={{ fontWeight: 500, fontSize: '0.75rem', color: '#dc2626' }}>Payment plan available</Typography>
//                                             <Typography sx={{ fontSize: '0.63rem', color: '#a34848', mt: 0.1 }}>
//                                                 {selectedEnvelope.paymentPlan.isDeferred
//                                                     ? `${fmt(selectedEnvelope.paymentPlan.deferredInterest)} interest at risk`
//                                                     : `${selectedEnvelope.paymentPlan.termMonths}-month plan`}
//                                             </Typography>
//                                         </Box>
//                                     </Box>
//                                     <Button size="small" onClick={() => onSetLeftPanel('paymentplan')}
//                                             endIcon={<ChevronRight size={12} />}
//                                             sx={{ textTransform: 'none', fontWeight: 500, fontSize: '0.7rem', color: '#dc2626', minWidth: 0, flexShrink: 0 }}>
//                                         View plan
//                                     </Button>
//                                 </Box>
//                             )}
//                         </Box>
//
//                         {/* ── Contributions ───────────────────────────────────────── */}
//                         <Box sx={{ p: 2.5 }}>
//                             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
//                                 <Typography sx={SECTION_LABEL_SX}>Contributions</Typography>
//                                 {scheduledContributions.length > 0 && (
//                                     <Box sx={{ display: 'flex', gap: 0.5 }}>
//                                         {paidCount > 0     && <Chip size="small" label={`${paidCount} paid`}      sx={{ height: 16, fontSize: '0.55rem', fontWeight: 500, bgcolor: alpha('#16a34a', 0.1), color: '#16a34a' }} />}
//                                         {missedCount > 0   && <Chip size="small" label={`${missedCount} missed`}   sx={{ height: 16, fontSize: '0.55rem', fontWeight: 500, bgcolor: alpha('#dc2626', 0.1), color: '#dc2626' }} />}
//                                         {upcomingCount > 0 && <Chip size="small" label={`${upcomingCount} ahead`}  sx={{ height: 16, fontSize: '0.55rem', fontWeight: 500, bgcolor: '#f0dede',    color: '#a35c5c'    }} />}
//                                     </Box>
//                                 )}
//                             </Box>
//
//                             {/* Tab switcher */}
//                             <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, p: '3px', borderRadius: '8px', bgcolor: '#f5e5e5' }}>
//                                 {(['history', 'schedule', 'budget'] as const).map(t => (
//                                     <Button key={t} size="small" fullWidth onClick={() => setTab(t)}
//                                             sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', py: 0.4,
//                                                 ...(tab === t
//                                                     ? { bgcolor: '#fff', color: '#111', boxShadow: '0 1px 2px rgba(0,0,0,0.08)', '&:hover': { bgcolor: '#fff' } }
//                                                     : { bgcolor: 'transparent', color: '#999', '&:hover': { bgcolor: alpha('#fff', 0.6) } }) }}>
//                                         {t === 'history' ? `History (${monthLabel})` : t === 'schedule' ? `Schedule (${scheduledContributions.length})` : 'Budget impact'}
//                                     </Button>
//                                 ))}
//                             </Box>
//
//                             {/* History tab */}
//                             {tab === 'history' && (
//                                 <Box sx={{ maxHeight: 280, overflowY: 'auto', pr: 0.5 }}>
//                                     {selectedContributions.length === 0
//                                         ? <Typography sx={{ fontSize: '0.75rem', color: '#bbb', textAlign: 'center', py: 2 }}>No contributions in {monthLabel}</Typography>
//                                         : <>
//                                             {selectedContributions.map(c => <ContributionRow key={c.id} c={c} color={color} />)}
//                                             <Box sx={{ mt: 1.5, p: 1.25, borderRadius: '8px', bgcolor: '#fbf1f1', border: BORDER, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                                 <Typography sx={{ fontWeight: 500, fontSize: '0.75rem', color: '#333' }}>Total this month</Typography>
//                                                 <Typography sx={{ fontWeight: 500, fontSize: '0.95rem', color, fontVariantNumeric: 'tabular-nums' }}>
//                                                     {fmt(selectedContributions.reduce((s, c) => s + c.amount, 0))}
//                                                 </Typography>
//                                             </Box>
//                                         </>}
//                                 </Box>
//                             )}
//
//                             {/* Schedule tab */}
//                             {tab === 'schedule' && (
//                                 <>
//                                     {hasEditableSchedule && (
//                                         <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
//                                             <Button size="small" startIcon={<SlidersHorizontal size={13} />}
//                                                     onClick={openScheduleDialogForBulk}
//                                                     sx={{ textTransform: 'none', fontWeight: 500, fontSize: '0.7rem', color: MAROON, minWidth: 0 }}>
//                                                 Update multiple
//                                             </Button>
//                                         </Box>
//                                     )}
//
//                                     {scheduledContributions.length === 0 ? (
//                                         <Typography sx={{ fontSize: '0.75rem', color: '#bbb', textAlign: 'center', py: 2 }}>No schedule generated</Typography>
//                                     ) : (
//                                         <>
//                                             <Stack spacing={0.75} sx={{ maxHeight: 280, overflowY: 'auto', pr: 0.5, mb: 0.75 }}>
//                                                 {scheduledContributions.map(sc => {
//                                                     const isPaid      = sc.status === 'PAID';
//                                                     const isMissed    = sc.status === 'MISSED';
//                                                     const isDue       = new Date(sc.scheduledDate) <= now && !isPaid && !isMissed;
//                                                     const isEditable  = !isPaid && !isMissed; // SCHEDULED (upcoming or due) rows only
//
//                                                     const statusColor = isPaid ? '#16a34a' : isMissed ? '#dc2626' : isDue ? '#d97706' : '#999';
//                                                     const statusLabel = isPaid ? 'Paid' : isMissed ? 'Missed' : isDue ? 'Due' : 'Upcoming';
//
//                                                     return (
//                                                         <Box key={sc.id} sx={{ p: 1, borderRadius: '8px', border: '1px solid #ecd9d9', bgcolor: '#fff' }}>
//                                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
//                                                                 <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: statusColor, flexShrink: 0 }} />
//                                                                 <Box sx={{ flex: 1 }}>
//                                                                     <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#111' }}>
//                                                                         {new Date(sc.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
//                                                                     </Typography>
//                                                                     <Typography sx={{ fontSize: '0.65rem', color: '#999' }}>{sc.frequency}</Typography>
//                                                                 </Box>
//
//                                                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                                                                     <Box sx={{ textAlign: 'right' }}>
//                                                                         <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
//                                                                             {fmt(sc.amount)}
//                                                                         </Typography>
//                                                                         <Chip size="small" label={statusLabel}
//                                                                               sx={{ height: 14, fontSize: '0.55rem', fontWeight: 500, bgcolor: alpha(statusColor, 0.1), color: statusColor }} />
//                                                                     </Box>
//                                                                     {isEditable && (
//                                                                         <IconButton size="small" aria-label="Edit scheduled amount"
//                                                                                     onClick={() => openScheduleDialogForRow(sc.id)}
//                                                                                     sx={{ width: 24, height: 24, color: '#bbb', '&:hover': { color: MAROON, bgcolor: alpha(MAROON, 0.06) } }}>
//                                                                             <Pencil size={12} />
//                                                                         </IconButton>
//                                                                     )}
//                                                                 </Box>
//                                                             </Box>
//                                                         </Box>
//                                                     );
//                                                 })}
//                                             </Stack>
//
//                                             {/* Total pinned outside scroll */}
//                                             <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: '#fbf1f1', border: BORDER, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                                 <Box>
//                                                     <Typography sx={{ fontWeight: 500, fontSize: '0.75rem', color: '#333' }}>Total scheduled</Typography>
//                                                     <Typography sx={{ fontSize: '0.65rem', color: '#999' }}>
//                                                         {fmt(scheduledContributions.filter(c => c.status === 'PAID').reduce((s, c) => s + c.amount, 0))} paid so far
//                                                     </Typography>
//                                                 </Box>
//                                                 <Typography sx={{ fontWeight: 500, fontSize: '0.95rem', color, fontVariantNumeric: 'tabular-nums' }}>
//                                                     {fmt(scheduledContributions.reduce((s, c) => s + c.amount, 0))}
//                                                 </Typography>
//                                             </Box>
//                                         </>
//                                     )}
//                                 </>
//                             )}
//
//                             {/* Budget impact tab */}
//                             {tab === 'budget' && (
//                                 <Stack spacing={1.25}>
//                                     {/* Budget share */}
//                                     <Box sx={{ p: 1.25, borderRadius: '8px', border: BORDER }}>
//                                         <Typography sx={SECTION_LABEL_SX}>Budget share</Typography>
//                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
//                                             <Typography sx={{ fontSize: '1.05rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
//                                                 {fmt(thisAllocated)}<Box component="span" sx={{ fontSize: '0.72rem', color: '#999', fontWeight: 400 }}>/mo</Box>
//                                             </Typography>
//                                             <Typography sx={{ fontSize: '0.72rem', color: shareColor, fontWeight: 500 }}>
//                                                 {sharePct.toFixed(0)}% of {fmt(totalActiveAllocated)} total
//                                             </Typography>
//                                         </Box>
//                                         <LinearProgress variant="determinate" value={sharePct}
//                                                         sx={{ height: 6, borderRadius: 3, bgcolor: '#f0dede', '& .MuiLinearProgress-bar': { bgcolor: shareColor, borderRadius: 3 } }} />
//                                     </Box>
//
//                                     {/* Balance threshold safety */}
//                                     <Box sx={{ p: 1.25, borderRadius: '8px', border: BORDER }}>
//                                         <Typography sx={SECTION_LABEL_SX}>Balance threshold safety</Typography>
//
//                                         {thresholdStatus === null ? (
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
//                                                 <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: '#f0dede', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                                                     <Gauge size={15} color="#a35c5c" />
//                                                 </Box>
//                                                 <Typography sx={{ fontSize: '0.72rem', color: '#999', lineHeight: 1.5 }}>
//                                                     Account balance isn't connected yet. Once it is, this will show whether your envelope contributions keep you above your balance threshold.
//                                                 </Typography>
//                                             </Box>
//                                         ) : (
//                                             <>
//                                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
//                                                     <Box sx={{
//                                                         width: 30, height: 30, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
//                                                         bgcolor: thresholdStatus === 'safe' ? '#eaf3de' : '#fdeaea',
//                                                     }}>
//                                                         {thresholdStatus === 'safe'
//                                                             ? <ShieldCheck size={16} color="#3b6d11" />
//                                                             : <AlertTriangle size={16} color="#a32d2d" />}
//                                                     </Box>
//                                                     <Box>
//                                                         <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, color: thresholdStatus === 'safe' ? '#27500a' : '#791f1f' }}>
//                                                             {thresholdStatus === 'safe' ? 'Staying safely above threshold'
//                                                                 : thresholdStatus === 'at-risk' ? 'Close to your minimum threshold'
//                                                                     : 'Below your minimum threshold'}
//                                                         </Typography>
//                                                         <Typography sx={{ fontSize: '0.68rem', color: thresholdStatus === 'safe' ? '#639922' : '#c14d4d', mt: 0.1 }}>
//                                                             {thresholdBuffer! >= 0
//                                                                 ? `${fmt(thresholdBuffer!)} buffer left after this month's allocations`
//                                                                 : `${fmt(Math.abs(thresholdBuffer!))} below threshold after this month's allocations`}
//                                                         </Typography>
//                                                     </Box>
//                                                 </Box>
//
//                                                 <Box sx={{ position: 'relative', height: 8, borderRadius: '4px', overflow: 'hidden', bgcolor: thresholdStatus === 'safe' ? '#eaf3de' : '#fdeaea' }}>
//                                                     <Box sx={{
//                                                         position: 'absolute', left: 0, top: 0, bottom: 0,
//                                                         width: `${Math.max(0, Math.min(100, (projectedBalance! / (accountBalance ?? 1)) * 100))}%`,
//                                                         bgcolor: thresholdStatus === 'safe' ? '#639922' : '#a32d2d',
//                                                     }} />
//                                                     <Box sx={{
//                                                         position: 'absolute', top: -3, bottom: -3, width: '2px',
//                                                         left: `${Math.max(0, Math.min(100, (balanceThreshold! / (accountBalance ?? 1)) * 100))}%`,
//                                                         bgcolor: thresholdStatus === 'safe' ? '#27500a' : '#791f1f',
//                                                     }} />
//                                                 </Box>
//                                                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
//                                                     <Typography sx={{ fontSize: '0.6rem', color: '#999' }}>$0</Typography>
//                                                     <Typography sx={{ fontSize: '0.6rem', color: thresholdStatus === 'safe' ? '#27500a' : '#791f1f' }}>min threshold {fmt(balanceThreshold!)}</Typography>
//                                                     <Typography sx={{ fontSize: '0.6rem', color: '#999' }}>balance {fmt(accountBalance!)}</Typography>
//                                                 </Box>
//
//                                                 {thresholdStatus !== 'safe' && (
//                                                     <Box sx={{ mt: 1, p: 1, borderRadius: '7px', bgcolor: '#fdf0e0', border: '1px solid #f5d9a8' }}>
//                                                         <Typography sx={{ fontSize: '0.68rem', color: '#633806' }}>
//                                                             Consider pausing or reducing an envelope's contribution this month.
//                                                         </Typography>
//                                                     </Box>
//                                                 )}
//                                             </>
//                                         )}
//                                     </Box>
//                                 </Stack>
//                             )}
//                         </Box>
//                     </>
//                 ) : (
//                     linkedGroup && (
//                         <>
//                             {/* ── Group overview ──────────────────────────────────── */}
//                             <Box sx={{ p: 2.5, borderBottom: BORDER }}>
//                                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
//                                     <Typography sx={{ fontSize: '1.7rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
//                                         {fmt(groupCurrentTotal)}
//                                     </Typography>
//                                     <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>of {fmt(groupTargetTotal)} combined</Typography>
//                                 </Box>
//                                 <LinearProgress variant="determinate" value={groupProgressPct}
//                                                 sx={{ height: 6, borderRadius: 3, bgcolor: alpha(MAROON, 0.12), '& .MuiLinearProgress-bar': { bgcolor: MAROON, borderRadius: 3 } }} />
//                                 <Typography sx={{ fontSize: '0.72rem', color: MAROON, fontWeight: 500, mt: 0.75 }}>
//                                     {groupProgressPct.toFixed(1)}% of group target
//                                 </Typography>
//                             </Box>
//
//                             <Box sx={{ p: 2.5, borderBottom: BORDER }}>
//                                 <Typography sx={SECTION_LABEL_SX}>Overview</Typography>
//                                 <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 2, rowGap: 0.75 }}>
//                                     {[
//                                         { label: 'Remaining',    value: fmt(groupRemainingTotal) },
//                                         { label: 'Allocated',    value: `${fmt(groupAllocatedTotal)}/mo` },
//                                         { label: 'Nearest target', value: groupNearestTarget ? new Date(groupNearestTarget).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
//                                         { label: 'This month',   value: groupThisMonthTotal > 0 ? fmt(groupThisMonthTotal) : '—' },
//                                     ].map(({ label, value }) => (
//                                         <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
//                                             <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>{label}</Typography>
//                                             <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
//                                         </Box>
//                                     ))}
//                                 </Box>
//                             </Box>
//
//                             {/* ── Allocation breakdown ─────────────────────────────── */}
//                             <Box sx={{ p: 2.5, borderBottom: BORDER }}>
//                                 <Typography sx={SECTION_LABEL_SX}>Allocation breakdown</Typography>
//                                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
//                                     <Typography sx={{ fontSize: '0.72rem', color: '#999' }}>Shared budget</Typography>
//                                     <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, color: MAROON }}>{fmt(linkedGroup.sharedBudget)}/mo</Typography>
//                                 </Box>
//                                 <Box sx={{ height: 14, borderRadius: '7px', overflow: 'hidden', display: 'flex', mb: 1.25 }}>
//                                     {linkedGroup.envelopes.map(member => {
//                                         const memberColor = ENVELOPE_COLORS[member.envelopeType];
//                                         const widthPct = linkedGroup.sharedBudget > 0 ? Math.min((member.allocatedAmount / linkedGroup.sharedBudget) * 100, 100) : 0;
//                                         return widthPct > 0 ? <Box key={member.id} sx={{ width: `${widthPct}%`, bgcolor: memberColor }} /> : null;
//                                     })}
//                                     {allocationHeadroom > 0 && (
//                                         <Box sx={{ width: `${headroomPct}%`, bgcolor: '#f0dede' }} />
//                                     )}
//                                 </Box>
//                                 <Stack spacing={0.75}>
//                                     {linkedGroup.envelopes.map(member => {
//                                         const memberColor = ENVELOPE_COLORS[member.envelopeType];
//                                         const memberSharePct = linkedGroup.sharedBudget > 0 ? (member.allocatedAmount / linkedGroup.sharedBudget) * 100 : 0;
//                                         return (
//                                             <Box key={member.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                                 <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: memberColor, flexShrink: 0 }} />
//                                                 <Typography sx={{ flex: 1, fontSize: '0.75rem', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                                                     {member.envelopeName}
//                                                 </Typography>
//                                                 <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
//                                                     {fmt(member.allocatedAmount)}/mo
//                                                 </Typography>
//                                                 <Typography sx={{ fontSize: '0.68rem', color: '#999', width: 34, textAlign: 'right', flexShrink: 0 }}>
//                                                     {memberSharePct.toFixed(0)}%
//                                                 </Typography>
//                                             </Box>
//                                         );
//                                     })}
//                                     {allocationHeadroom > 0 && (
//                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                             <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: '#f0dede', flexShrink: 0 }} />
//                                             <Typography sx={{ flex: 1, fontSize: '0.75rem', color: '#999' }}>Unallocated headroom</Typography>
//                                             <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#999', fontVariantNumeric: 'tabular-nums' }}>
//                                                 {fmt(allocationHeadroom)}/mo
//                                             </Typography>
//                                             <Typography sx={{ fontSize: '0.68rem', color: '#999', width: 34, textAlign: 'right', flexShrink: 0 }}>
//                                                 {headroomPct.toFixed(0)}%
//                                             </Typography>
//                                         </Box>
//                                     )}
//                                     {linkedGroup.sharedBudget > 0 && groupAllocatedTotal > linkedGroup.sharedBudget && (
//                                         <Typography sx={{ fontSize: '0.68rem', color: '#dc2626', mt: 0.25 }}>
//                                             Allocated total exceeds the shared budget by {fmt(groupAllocatedTotal - linkedGroup.sharedBudget)}/mo.
//                                         </Typography>
//                                     )}
//                                 </Stack>
//                             </Box>
//
//                             {/* ── Group actions ───────────────────────────────────── */}
//                             {(onOpenLinkedGoalUpdate || onOpenGroupNotificationSettings) && (
//                                 <Box sx={{ p: 2.5, borderBottom: BORDER }}>
//                                     <Typography sx={SECTION_LABEL_SX}>Actions</Typography>
//                                     <Box sx={{ display: 'flex', gap: 0.75 }}>
//                                         {onOpenLinkedGoalUpdate && (
//                                             <Button fullWidth variant="outlined" size="small" startIcon={<SlidersHorizontal size={13} />}
//                                                     onClick={() => onOpenLinkedGoalUpdate(linkedGroup)}
//                                                     sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', borderColor: '#ecd9d9', color: '#7a4a4a', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: '#fbf1f1' } }}>
//                                                 Update group goal
//                                             </Button>
//                                         )}
//                                         {onOpenGroupNotificationSettings && (
//                                             <Button fullWidth variant="outlined" size="small" startIcon={<Settings2 size={13} />}
//                                                     onClick={() => onOpenGroupNotificationSettings(linkedGroup)}
//                                                     sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', borderColor: '#ecd9d9', color: '#7a4a4a', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: '#fbf1f1' } }}>
//                                                 Notifications
//                                             </Button>
//                                         )}
//                                     </Box>
//                                 </Box>
//                             )}
//
//                             {/* ── Budget impact ────────────────────────────────────── */}
//                             <Box sx={{ p: 2.5, borderBottom: BORDER }}>
//                                 <Typography sx={SECTION_LABEL_SX}>Budget impact</Typography>
//                                 <Stack spacing={1.25}>
//                                     <Box sx={{ p: 1.25, borderRadius: '8px', border: BORDER }}>
//                                         <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.75 }}>Group's share of your budget</Typography>
//                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
//                                             <Typography sx={{ fontSize: '1.05rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
//                                                 {fmt(thisAllocated)}<Box component="span" sx={{ fontSize: '0.72rem', color: '#999', fontWeight: 400 }}>/mo</Box>
//                                             </Typography>
//                                             <Typography sx={{ fontSize: '0.72rem', color: shareColor, fontWeight: 500 }}>
//                                                 {sharePct.toFixed(0)}% of {fmt(totalActiveAllocated)} total
//                                             </Typography>
//                                         </Box>
//                                         <LinearProgress variant="determinate" value={sharePct}
//                                                         sx={{ height: 6, borderRadius: 3, bgcolor: '#f0dede', '& .MuiLinearProgress-bar': { bgcolor: shareColor, borderRadius: 3 } }} />
//                                     </Box>
//
//                                     <Box sx={{ p: 1.25, borderRadius: '8px', border: BORDER }}>
//                                         <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.75 }}>Balance threshold safety</Typography>
//                                         {thresholdStatus === null ? (
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
//                                                 <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: '#f0dede', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                                                     <Gauge size={15} color="#a35c5c" />
//                                                 </Box>
//                                                 <Typography sx={{ fontSize: '0.72rem', color: '#999', lineHeight: 1.5 }}>
//                                                     Account balance isn't connected yet. Once it is, this will show whether this group's contributions keep you above your balance threshold.
//                                                 </Typography>
//                                             </Box>
//                                         ) : (
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                                 <Box sx={{
//                                                     width: 30, height: 30, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
//                                                     bgcolor: thresholdStatus === 'safe' ? '#eaf3de' : '#fdeaea',
//                                                 }}>
//                                                     {thresholdStatus === 'safe'
//                                                         ? <ShieldCheck size={16} color="#3b6d11" />
//                                                         : <AlertTriangle size={16} color="#a32d2d" />}
//                                                 </Box>
//                                                 <Box>
//                                                     <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, color: thresholdStatus === 'safe' ? '#27500a' : '#791f1f' }}>
//                                                         {thresholdStatus === 'safe' ? 'Staying safely above threshold'
//                                                             : thresholdStatus === 'at-risk' ? 'Close to your minimum threshold'
//                                                                 : 'Below your minimum threshold'}
//                                                     </Typography>
//                                                     <Typography sx={{ fontSize: '0.68rem', color: thresholdStatus === 'safe' ? '#639922' : '#c14d4d', mt: 0.1 }}>
//                                                         {thresholdBuffer! >= 0
//                                                             ? `${fmt(thresholdBuffer!)} buffer left after this month's allocations`
//                                                             : `${fmt(Math.abs(thresholdBuffer!))} below threshold after this month's allocations`}
//                                                     </Typography>
//                                                 </Box>
//                                             </Box>
//                                         )}
//                                     </Box>
//                                 </Stack>
//                             </Box>
//
//                             {/* ── Member envelopes ────────────────────────────────── */}
//                             <Box sx={{ p: 2.5 }}>
//                                 <Typography sx={SECTION_LABEL_SX}>Envelopes in this group</Typography>
//                                 <Stack spacing={0.75}>
//                                     {linkedGroup.envelopes.map(member => {
//                                         const memberColor = ENVELOPE_COLORS[member.envelopeType];
//                                         const memberPct   = progressPct(member.currentAmount, member.targetAmount);
//                                         const isCurrent   = member.id === selectedEnvelope.id;
//                                         return (
//                                             <Box key={member.id}
//                                                  onClick={() => { onSelectEnvelope(member.id); }}
//                                                  sx={{ p: 1, borderRadius: '8px', border: `1px solid ${isCurrent ? alpha(MAROON, 0.35) : '#ecd9d9'}`, bgcolor: isCurrent ? alpha(MAROON, 0.04) : '#fff', cursor: 'pointer', '&:hover': { borderColor: alpha(MAROON, 0.3), bgcolor: '#fbf1f1' } }}>
//                                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                                     <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: memberColor, flexShrink: 0 }} />
//                                                     <Box sx={{ flex: 1, minWidth: 0 }}>
//                                                         <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, color: '#111' }}>{member.envelopeName}</Typography>
//                                                         <LinearProgress variant="determinate" value={memberPct}
//                                                                         sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: alpha(memberColor, 0.12), '& .MuiLinearProgress-bar': { bgcolor: memberColor, borderRadius: 2 } }} />
//                                                     </Box>
//                                                     <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
//                                                         <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: memberColor, fontVariantNumeric: 'tabular-nums' }}>
//                                                             {memberPct.toFixed(0)}%
//                                                         </Typography>
//                                                         <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>{fmt(member.currentAmount)} / {fmt(member.targetAmount)}</Typography>
//                                                     </Box>
//                                                     {!isCurrent && <ArrowRight size={13} color="#ccc" style={{ flexShrink: 0 }} />}
//                                                 </Box>
//                                             </Box>
//                                         );
//                                     })}
//                                 </Stack>
//                             </Box>
//                         </>
//                     )
//                 )}
//             </Box>
//
//             <NotificationSettingsDialog
//                 open={notifSettingsOpen}
//                 onClose={() => setNotifSettingsOpen(false)}
//                 subjectName={selectedEnvelope.envelopeName}
//                 prefs={notifPrefs}
//                 onTogglePref={handleTogglePref}
//                 eventSettings={eventSettings}
//                 onToggleEvent={handleToggleEvent}
//                 onSave={() => {
//                     // TODO: POST to your API
//                     onSnack('Notification settings saved', 'success');
//                 }}
//             />
//
//             {/* ── Scheduled contribution update dialog — single row or bulk selection ────────── */}
//             <BulkScheduleUpdateDialog
//                 open={scheduleDialogOpen}
//                 onClose={closeScheduleDialog}
//                 envelopeId={selectedEnvelope.id}
//                 envelopeName={selectedEnvelope.envelopeName}
//                 scheduledContributions={scheduledContributions}
//                 color={color}
//                 initialSelectedIds={scheduleDialogTargetId !== null ? [scheduleDialogTargetId] : undefined}
//                 onSubmit={handleScheduleDialogSubmit}
//             />
//
//             {/* ── Goal update dialog ───────────────────────────────────────── */}
//             <GoalUpdateDialog
//                 open={goalDialogOpen}
//                 envelope={selectedEnvelope}
//                 isLinked={selectedEnvelope.linked ?? false}
//                 onClose={() => setGoalDialogOpen(false)}
//                 onSubmit={handleGoalUpdate}
//                 totalEnvelopes={totalEnvelopes ?? envelopes.filter(e => e.status === 'ACTIVE').length}
//             />
//         </>
//     );
// };
//
// export default EnvelopeDetailPanel;
