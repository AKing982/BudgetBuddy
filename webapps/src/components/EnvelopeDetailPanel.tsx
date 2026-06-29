import React, { useState } from 'react';
import {
    alpha, Box, Button, Chip, Divider, Grid, IconButton,
    LinearProgress, Stack, Typography,
} from '@mui/material';
import {
    Plus, Target, MoreHorizontal, PauseCircle, CreditCard,
    Settings2, RefreshCcw, ChevronRight, SlidersHorizontal,
} from 'lucide-react';
import { XCircle } from 'lucide-react';
import { BudgetEnvelope, EnvelopeContribution, ScheduledContribution } from '../config/Types';
import { ENVELOPE_COLORS, MAROON, FREQUENCY_OPTIONS } from '../config/Constants';
import { fmt, daysUntil, progressPct, velocityDays, requiredMonthly, monthlyContributed, isEnvelopeActiveInMonth } from '../config/Helpers';
import { VelocityChip, PanelHeader, ContributionRow } from './Shared';
import GoalUpdateDialog, { GoalUpdateValues } from './GoalUpdateDialog';
import NotificationDialog from "./NotificationsDialog";
import { Bell } from 'lucide-react';
import NotificationSettingsDialog from "./NotificationSettingsDialog";
import {NotificationEventSettings, NotificationPrefs} from "./NotificationToggle";

type LeftPanelView = 'envelopes' | 'analytics' | 'paymentplan' | 'planadjuster';

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
}

const EnvelopeDetailPanel: React.FC<EnvelopeDetailPanelProps> = ({
                                                                     selectedEnvelope, envelopes, contributions, scheduledContributions,
                                                                     monthStart, monthEnd, monthLabel,
                                                                     onClose, onAddManual, onToggleContribMode,
                                                                     onSetLeftPanel, onSnack, onSelectEnvelope,
                                                                     totalEnvelopes,
                                                                 }) => {
    const [tab, setTab] = useState<'history' | 'schedule'>('history');

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

    // ── Filtered contributions ─────────────────────────────────────────────────
    const selectedContributions = contributions.filter(c => {
        if (c.envelopeId !== selectedEnvelope?.id) return false;
        const d = new Date(c.contributedAt);
        return d >= monthStart && d <= monthEnd;
    });

    // ── Quick overview (nothing selected) ─────────────────────────────────────
    if (!selectedEnvelope) {
        return (
            <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}` }}>
                <PanelHeader icon={<Target size={15} color="white" />} title="Quick Overview" subtitle="Tap any envelope card for details" />
                <Box sx={{ bgcolor: '#fff', p: 2.5 }}>
                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.5 }}>By Priority</Typography>
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
                                         sx={{ p: 1.5, borderRadius: '10px', cursor: 'pointer', border: `1px solid ${alpha(c, 0.2)}`, '&:hover': { bgcolor: alpha(c, 0.04), borderColor: alpha(c, 0.4) }, transition: 'all 0.15s' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: c, flexShrink: 0 }} />
                                                <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#111' }}>{env.envelopeName}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                {env.contributionMode === 'AUTO' && <RefreshCcw size={9} color="#0284c7" />}
                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: c, fontVariantNumeric: 'tabular-nums' }}>{pct.toFixed(0)}%</Typography>
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

                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.25 }}>
                        Upcoming Deadlines
                    </Typography>
                    <Stack spacing={1}>
                        {envelopes
                            .filter(e => e.status === 'ACTIVE' && e.targetDate && isEnvelopeActiveInMonth(e, monthStart, monthEnd))
                            .sort((a, b) => new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime())
                            .slice(0, 3)
                            .map(env => {
                                const days = daysUntil(env.targetDate)!;
                                const dc   = days <= 60 ? '#d97706' : '#16a34a';
                                return (
                                    <Box key={env.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75, borderBottom: `1px solid ${alpha('#000', 0.05)}`, '&:last-child': { borderBottom: 'none' } }}>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#333' }}>{env.envelopeName}</Typography>
                                        <Chip size="small" label={`${days}d`} sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: alpha(dc, 0.1), color: dc }} />
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

    const paidCount     = scheduledContributions.filter(c => c.status === 'PAID').length;
    const missedCount   = scheduledContributions.filter(c => c.status === 'MISSED').length;
    const upcomingCount = scheduledContributions.filter(c => c.status === 'SCHEDULED').length;

    return (
        <>
            <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(color, 0.25)}`, boxShadow: `0 4px 24px ${alpha(color, 0.12)}` }}>
                {/* Header */}
                <Box sx={{ background: `linear-gradient(135deg, ${alpha(color, 0.9)} 0%, ${color} 100%)`, px: 3, py: 2, position: 'relative', overflow: 'hidden' }}>
                    <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>{selectedEnvelope.envelopeName}</Typography>
                            <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.75)', mt: 0.1 }}>{selectedEnvelope.description}</Typography>
                        </Box>
                        <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                            <XCircle size={16} />
                        </IconButton>
                    </Box>
                </Box>

                <Box sx={{ bgcolor: '#fff', p: 2.5 }}>
                    {/* Big progress */}
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                            {fmt(selectedEnvelope.currentAmount)}
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#888', mt: 0.4 }}>of {fmt(selectedEnvelope.targetAmount)} goal</Typography>
                        <LinearProgress variant="determinate" value={progressPct(selectedEnvelope.currentAmount, selectedEnvelope.targetAmount)}
                                        sx={{ mt: 1.5, height: 8, borderRadius: 4, bgcolor: alpha(color, 0.12), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 } }} />
                        <Typography sx={{ fontSize: '0.72rem', color, fontWeight: 700, mt: 0.75 }}>
                            {progressPct(selectedEnvelope.currentAmount, selectedEnvelope.targetAmount).toFixed(1)}% complete
                        </Typography>
                    </Box>

                    {/* Velocity box */}
                    {(vel !== null || req !== null) && (
                        <Box sx={{ mb: 2, p: 1.25, borderRadius: '8px', bgcolor: vel && vel > 0 ? alpha('#16a34a', 0.06) : alpha('#d97706', 0.06), border: `1px solid ${vel && vel > 0 ? alpha('#16a34a', 0.2) : alpha('#d97706', 0.2)}` }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography sx={{ fontSize: '0.6rem', color: '#aaa', mb: 0.25 }}>Velocity</Typography>
                                    <VelocityChip days={vel} />
                                </Box>
                                {req !== null && (
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography sx={{ fontSize: '0.6rem', color: '#aaa', mb: 0.25 }}>Need/mo to hit deadline</Typography>
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: req > selectedEnvelope.allocatedAmount ? '#dc2626' : '#16a34a', fontVariantNumeric: 'tabular-nums' }}>
                                            {fmt(req)}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    )}

                    {/* Contribution mode toggle */}
                    {selectedEnvelope.status === 'ACTIVE' && (
                        <Box sx={{ mb: 2, p: 1.5, borderRadius: '10px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', mb: 1 }}>Contribution mode</Typography>
                            <Box sx={{ display: 'flex', gap: 0.75 }}>
                                {(['MANUAL', 'AUTO'] as const).map(mode => (
                                    <Button key={mode} size="small" fullWidth
                                            variant={selectedEnvelope.contributionMode === mode ? 'contained' : 'outlined'}
                                            startIcon={mode === 'MANUAL' ? <Plus size={12} /> : <RefreshCcw size={12} />}
                                            onClick={() => onToggleContribMode(selectedEnvelope.id, mode)}
                                            sx={{ borderRadius: '7px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem',
                                                ...(selectedEnvelope.contributionMode === mode
                                                    ? { bgcolor: color, '&:hover': { bgcolor: alpha(color, 0.85) } }
                                                    : { borderColor: '#d5d5d5', color: '#777', '&:hover': { borderColor: color, color } }) }}>
                                        {mode === 'MANUAL' ? 'Manual' : 'Auto-track'}
                                    </Button>
                                ))}
                            </Box>
                            {selectedEnvelope.contributionMode === 'AUTO' && selectedEnvelope.autoRule && (
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <RefreshCcw size={10} color="#0284c7" />
                                    <Typography sx={{ fontSize: '0.65rem', color: '#0284c7', fontWeight: 600 }}>
                                        {fmt(selectedEnvelope.autoRule.amount)} · {FREQUENCY_OPTIONS.find(o => o.value === selectedEnvelope.autoRule?.frequency)?.label ?? selectedEnvelope.autoRule?.frequency}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}

                    <Divider sx={{ mb: 2 }} />

                    {/* Stats grid */}
                    <Grid container spacing={1.5} sx={{ mb: 2 }}>
                        {[
                            { label: 'Remaining',   value: fmt(selectedEnvelope.remainingAmount) },
                            { label: 'Allocated',   value: `${fmt(selectedEnvelope.allocatedAmount)}/mo` },
                            { label: 'Target Date', value: selectedEnvelope.targetDate ? new Date(selectedEnvelope.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
                            { label: 'Days Left',   value: daysUntil(selectedEnvelope.targetDate) !== null ? `${daysUntil(selectedEnvelope.targetDate)}d` : '—' },
                            { label: 'Streak',      value: `${selectedEnvelope.streakMonths ?? 0}mo` },
                            { label: 'This month',  value: (() => { const mc = monthlyContributed(contributions, selectedEnvelope.id, monthStart, monthEnd); return mc > 0 ? fmt(mc) : '—'; })() },
                        ].map(({ label, value }) => (
                            <Grid item xs={6} key={label}>
                                <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
                                    <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', mb: 0.3 }}>{label}</Typography>
                                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>

                    {/* ── Action buttons ─────────────────────────────────────── */}
                    <Stack spacing={1} sx={{ mb: 2 }}>
                        {selectedEnvelope.contributionMode === 'MANUAL' ? (
                            <Button fullWidth variant="contained" startIcon={<Plus size={14} />}
                                    onClick={() => onAddManual(selectedEnvelope.id)}
                                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', bgcolor: color, '&:hover': { bgcolor: alpha(color, 0.85) } }}>
                                Add Contribution
                            </Button>
                        ) : (
                            <Button fullWidth variant="outlined" startIcon={<Settings2 size={14} />}
                                    onClick={() => onAddManual(selectedEnvelope.id)}
                                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', borderColor: '#0284c7', color: '#0284c7', '&:hover': { bgcolor: alpha('#0284c7', 0.05) } }}>
                                Edit auto-track rule
                            </Button>
                        )}

                        {/* Update goal + pause row */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {/* ── Update goal ── */}
                            <Button
                                fullWidth
                                variant="outlined"
                                size="small"
                                startIcon={<SlidersHorizontal size={13} />}
                                onClick={() => setGoalDialogOpen(true)}
                                sx={{
                                    borderRadius: '8px', textTransform: 'none',
                                    fontWeight: 600, fontSize: '0.72rem',
                                    borderColor: alpha(MAROON, 0.35), color: MAROON,
                                    '&:hover': { borderColor: MAROON, bgcolor: alpha(MAROON, 0.04) },
                                }}
                            >
                                Update goal
                            </Button>
                            <Button fullWidth variant="outlined" size="small" startIcon={<Settings2 size={13} />}
                                    onClick={() => setNotifSettingsOpen(true)}
                                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', borderColor: '#d5d5d5', color: '#555', '&:hover': { borderColor: MAROON, color: MAROON } }}>
                                Notification settings
                            </Button>

                            {selectedEnvelope.status === 'ACTIVE' && (
                                <Button fullWidth variant="outlined" size="small" startIcon={<PauseCircle size={13} />}
                                        onClick={() => onSnack('Pause — coming soon!', 'info')}
                                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', borderColor: '#d5d5d5', color: '#d97706', '&:hover': { borderColor: '#d97706', bgcolor: alpha('#d97706', 0.04) } }}>
                                    Pause
                                </Button>
                            )}
                        </Box>

                        {/* Edit (misc) */}
                        <Button fullWidth variant="outlined" size="small" startIcon={<MoreHorizontal size={13} />}
                                onClick={() => onSnack('Edit — coming soon!', 'info')}
                                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', borderColor: '#d5d5d5', color: '#555', '&:hover': { borderColor: MAROON, color: MAROON } }}>
                            More options
                        </Button>
                    </Stack>

                    {/* Payment plan prompt */}
                    {selectedEnvelope.envelopeType === 'PAYOFF' && selectedEnvelope.paymentPlan && (
                        <Box sx={{ mb: 2, p: 1.5, borderRadius: '10px', bgcolor: alpha('#dc2626', 0.05), border: `1px solid ${alpha('#dc2626', 0.18)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CreditCard size={14} color="#dc2626" style={{ flexShrink: 0 }} />
                                <Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#dc2626' }}>Payment plan available</Typography>
                                    <Typography sx={{ fontSize: '0.63rem', color: '#7f1d1d', mt: 0.1 }}>
                                        {selectedEnvelope.paymentPlan.isDeferred
                                            ? `${fmt(selectedEnvelope.paymentPlan.deferredInterest)} interest at risk`
                                            : `${selectedEnvelope.paymentPlan.termMonths}-month plan`}
                                    </Typography>
                                </Box>
                            </Box>
                            <Button size="small" variant="outlined" onClick={() => onSetLeftPanel('paymentplan')}
                                    endIcon={<ChevronRight size={12} />}
                                    sx={{ borderRadius: '7px', textTransform: 'none', fontWeight: 700, fontSize: '0.7rem', borderColor: alpha('#dc2626', 0.35), color: '#dc2626', flexShrink: 0, '&:hover': { borderColor: '#dc2626', bgcolor: alpha('#dc2626', 0.05) } }}>
                                View plan
                            </Button>
                        </Box>
                    )}

                    <Divider sx={{ mb: 1.5 }} />

                    {/* ── Contributions section ──────────────────────────────── */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
                        <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa' }}>
                            Contributions
                        </Typography>
                        {scheduledContributions.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {paidCount > 0     && <Chip size="small" label={`${paidCount} paid`}      sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700, bgcolor: alpha('#16a34a', 0.1), color: '#16a34a' }} />}
                                {missedCount > 0   && <Chip size="small" label={`${missedCount} missed`}   sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700, bgcolor: alpha('#dc2626', 0.1), color: '#dc2626' }} />}
                                {upcomingCount > 0 && <Chip size="small" label={`${upcomingCount} ahead`}  sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700, bgcolor: alpha('#aaa', 0.1),    color: '#888'    }} />}
                            </Box>
                        )}
                    </Box>

                    {/* Tab switcher */}
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, p: '3px', borderRadius: '8px', bgcolor: '#f0f0f0' }}>
                        {(['history', 'schedule'] as const).map(t => (
                            <Button key={t} size="small" fullWidth onClick={() => setTab(t)}
                                    sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', py: 0.4,
                                        ...(tab === t
                                            ? { bgcolor: '#fff', color: MAROON, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', '&:hover': { bgcolor: '#fff' } }
                                            : { bgcolor: 'transparent', color: '#888', '&:hover': { bgcolor: alpha('#fff', 0.5) } }) }}>
                                {t === 'history' ? `History (${monthLabel})` : `Schedule (${scheduledContributions.length})`}
                            </Button>
                        ))}
                    </Box>

                    {/* History tab */}
                    {tab === 'history' && (
                        <Box sx={{ maxHeight: 280, overflowY: 'auto', pr: 0.5 }}>
                            {selectedContributions.length === 0
                                ? <Typography sx={{ fontSize: '0.75rem', color: '#bbb', textAlign: 'center', py: 2 }}>No contributions in {monthLabel}</Typography>
                                : <>
                                    {selectedContributions.map(c => <ContributionRow key={c.id} c={c} color={color} />)}
                                    <Box sx={{ mt: 1.5, p: 1.25, borderRadius: '8px', bgcolor: alpha(color, 0.06), border: `1px solid ${alpha(color, 0.15)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#333' }}>Total this month</Typography>
                                        <Typography sx={{ fontWeight: 900, fontSize: '0.95rem', color, fontVariantNumeric: 'tabular-nums' }}>
                                            {fmt(selectedContributions.reduce((s, c) => s + c.amount, 0))}
                                        </Typography>
                                    </Box>
                                </>}
                        </Box>
                    )}

                    {/* Schedule tab */}
                    {tab === 'schedule' && (
                        scheduledContributions.length === 0 ? (
                            <Typography sx={{ fontSize: '0.75rem', color: '#bbb', textAlign: 'center', py: 2 }}>No schedule generated</Typography>
                        ) : (
                            <>
                                <Stack spacing={0.75} sx={{ maxHeight: 240, overflowY: 'auto', pr: 0.5, mb: 0.75 }}>
                                    {scheduledContributions.map(sc => {
                                        const isPaid      = sc.status === 'PAID';
                                        const isMissed    = sc.status === 'MISSED';
                                        const isDue       = new Date(sc.scheduledDate) <= now && !isPaid && !isMissed;
                                        const rowColor    = isPaid ? '#16a34a' : isMissed ? '#dc2626' : isDue ? '#d97706' : '#94a3b8';
                                        const rowBg       = isPaid ? alpha('#16a34a', 0.05) : isMissed ? alpha('#dc2626', 0.05) : isDue ? alpha('#d97706', 0.05) : '#f8f8f8';
                                        const statusLabel = isPaid ? 'Paid' : isMissed ? 'Missed' : isDue ? 'Due' : 'Upcoming';
                                        return (
                                            <Box key={sc.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1, borderRadius: '8px', bgcolor: rowBg, border: `1px solid ${alpha(rowColor, 0.2)}` }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: rowColor, flexShrink: 0 }} />
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#111' }}>
                                                        {new Date(sc.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>{sc.frequency}</Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'right' }}>
                                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: rowColor, fontVariantNumeric: 'tabular-nums' }}>
                                                        {fmt(sc.amount)}
                                                    </Typography>
                                                    <Chip size="small" label={statusLabel}
                                                          sx={{ height: 14, fontSize: '0.55rem', fontWeight: 700, bgcolor: alpha(rowColor, 0.1), color: rowColor }} />
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                                {/* Total pinned outside scroll */}
                                <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: alpha(color, 0.06), border: `1px solid ${alpha(color, 0.15)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#333' }}>Total scheduled</Typography>
                                        <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>
                                            {fmt(scheduledContributions.filter(c => c.status === 'PAID').reduce((s, c) => s + c.amount, 0))} paid so far
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ fontWeight: 900, fontSize: '0.95rem', color, fontVariantNumeric: 'tabular-nums' }}>
                                        {fmt(scheduledContributions.reduce((s, c) => s + c.amount, 0))}
                                    </Typography>
                                </Box>
                            </>
                        )
                    )}
                </Box>
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

// import React, { useState } from 'react';
// import {
//     alpha, Box, Button, Chip, Divider, Grid, IconButton,
//     LinearProgress, Stack, Typography,
// } from '@mui/material';
// import {
//     Plus, Target, MoreHorizontal, PauseCircle, CreditCard,
//     Settings2, RefreshCcw, ChevronRight,
// } from 'lucide-react';
// import { XCircle } from 'lucide-react';
// import { BudgetEnvelope, EnvelopeContribution, ScheduledContribution } from '../config/Types';
// import { ENVELOPE_COLORS, MAROON, FREQUENCY_OPTIONS } from '../config/Constants';
// import { fmt, daysUntil, progressPct, velocityDays, requiredMonthly, monthlyContributed, isEnvelopeActiveInMonth } from '../config/Helpers';
// import { VelocityChip, PanelHeader, ContributionRow } from './Shared';
//
// type LeftPanelView = 'envelopes' | 'analytics' | 'paymentplan';
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
// }
//
// const EnvelopeDetailPanel: React.FC<EnvelopeDetailPanelProps> = ({
//                                                                      selectedEnvelope, envelopes, contributions, scheduledContributions,
//                                                                      monthStart, monthEnd, monthLabel,
//                                                                      onClose, onAddManual, onToggleContribMode,
//                                                                      onSetLeftPanel, onSnack, onSelectEnvelope,
//                                                                  }) => {
//     const [tab, setTab] = useState<'history' | 'schedule'>('history');
//
//     const selectedContributions = contributions.filter(c => {
//         if (c.envelopeId !== selectedEnvelope?.id) return false;
//         const d = new Date(c.contributedAt);
//         return d >= monthStart && d <= monthEnd;
//     });
//
//     // ── Quick overview (nothing selected) ─────────────────────────────────────
//     if (!selectedEnvelope) {
//         return (
//             <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}` }}>
//                 <PanelHeader icon={<Target size={15} color="white" />} title="Quick Overview" subtitle="Tap any envelope card for details" />
//                 <Box sx={{ bgcolor: '#fff', p: 2.5 }}>
//                     <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.5 }}>By Priority</Typography>
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
//                                          sx={{ p: 1.5, borderRadius: '10px', cursor: 'pointer', border: `1px solid ${alpha(c, 0.2)}`, '&:hover': { bgcolor: alpha(c, 0.04), borderColor: alpha(c, 0.4) }, transition: 'all 0.15s' }}>
//                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                                                 <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: c, flexShrink: 0 }} />
//                                                 <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#111' }}>{env.envelopeName}</Typography>
//                                             </Box>
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                                                 {env.contributionMode === 'AUTO' && <RefreshCcw size={9} color="#0284c7" />}
//                                                 <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: c, fontVariantNumeric: 'tabular-nums' }}>{pct.toFixed(0)}%</Typography>
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
//                     <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.25 }}>
//                         Upcoming Deadlines
//                     </Typography>
//                     <Stack spacing={1}>
//                         {envelopes
//                             .filter(e => e.status === 'ACTIVE' && e.targetDate && isEnvelopeActiveInMonth(e, monthStart, monthEnd))
//                             .sort((a, b) => new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime())
//                             .slice(0, 3)
//                             .map(env => {
//                                 const days = daysUntil(env.targetDate)!;
//                                 const dc   = days <= 60 ? '#d97706' : '#16a34a';
//                                 return (
//                                     <Box key={env.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75, borderBottom: `1px solid ${alpha('#000', 0.05)}`, '&:last-child': { borderBottom: 'none' } }}>
//                                         <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#333' }}>{env.envelopeName}</Typography>
//                                         <Chip size="small" label={`${days}d`} sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: alpha(dc, 0.1), color: dc }} />
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
//
//     return (
//         <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(color, 0.25)}`, boxShadow: `0 4px 24px ${alpha(color, 0.12)}` }}>
//             {/* Header */}
//             <Box sx={{ background: `linear-gradient(135deg, ${alpha(color, 0.9)} 0%, ${color} 100%)`, px: 3, py: 2, position: 'relative', overflow: 'hidden' }}>
//                 <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
//                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                     <Box>
//                         <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>{selectedEnvelope.envelopeName}</Typography>
//                         <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.75)', mt: 0.1 }}>{selectedEnvelope.description}</Typography>
//                     </Box>
//                     <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
//                         <XCircle size={16} />
//                     </IconButton>
//                 </Box>
//             </Box>
//
//             <Box sx={{ bgcolor: '#fff', p: 2.5 }}>
//                 {/* Big progress */}
//                 <Box sx={{ textAlign: 'center', mb: 2 }}>
//                     <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
//                         {fmt(selectedEnvelope.currentAmount)}
//                     </Typography>
//                     <Typography sx={{ fontSize: '0.72rem', color: '#888', mt: 0.4 }}>of {fmt(selectedEnvelope.targetAmount)} goal</Typography>
//                     <LinearProgress variant="determinate" value={progressPct(selectedEnvelope.currentAmount, selectedEnvelope.targetAmount)}
//                                     sx={{ mt: 1.5, height: 8, borderRadius: 4, bgcolor: alpha(color, 0.12), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 } }} />
//                     <Typography sx={{ fontSize: '0.72rem', color, fontWeight: 700, mt: 0.75 }}>
//                         {progressPct(selectedEnvelope.currentAmount, selectedEnvelope.targetAmount).toFixed(1)}% complete
//                     </Typography>
//                 </Box>
//
//                 {/* Velocity box */}
//                 {(vel !== null || req !== null) && (
//                     <Box sx={{ mb: 2, p: 1.25, borderRadius: '8px', bgcolor: vel && vel > 0 ? alpha('#16a34a', 0.06) : alpha('#d97706', 0.06), border: `1px solid ${vel && vel > 0 ? alpha('#16a34a', 0.2) : alpha('#d97706', 0.2)}` }}>
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                             <Box>
//                                 <Typography sx={{ fontSize: '0.6rem', color: '#aaa', mb: 0.25 }}>Velocity</Typography>
//                                 <VelocityChip days={vel} />
//                             </Box>
//                             {req !== null && (
//                                 <Box sx={{ textAlign: 'right' }}>
//                                     <Typography sx={{ fontSize: '0.6rem', color: '#aaa', mb: 0.25 }}>Need/mo to hit deadline</Typography>
//                                     <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: req > selectedEnvelope.allocatedAmount ? '#dc2626' : '#16a34a', fontVariantNumeric: 'tabular-nums' }}>
//                                         {fmt(req)}
//                                     </Typography>
//                                 </Box>
//                             )}
//                         </Box>
//                     </Box>
//                 )}
//
//                 {/* Contribution mode toggle */}
//                 {selectedEnvelope.status === 'ACTIVE' && (
//                     <Box sx={{ mb: 2, p: 1.5, borderRadius: '10px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
//                         <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', mb: 1 }}>Contribution mode</Typography>
//                         <Box sx={{ display: 'flex', gap: 0.75 }}>
//                             {(['MANUAL', 'AUTO'] as const).map(mode => (
//                                 <Button key={mode} size="small" fullWidth
//                                         variant={selectedEnvelope.contributionMode === mode ? 'contained' : 'outlined'}
//                                         startIcon={mode === 'MANUAL' ? <Plus size={12} /> : <RefreshCcw size={12} />}
//                                         onClick={() => onToggleContribMode(selectedEnvelope.id, mode)}
//                                         sx={{ borderRadius: '7px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem',
//                                             ...(selectedEnvelope.contributionMode === mode
//                                                 ? { bgcolor: color, '&:hover': { bgcolor: alpha(color, 0.85) } }
//                                                 : { borderColor: '#d5d5d5', color: '#777', '&:hover': { borderColor: color, color } }) }}>
//                                     {mode === 'MANUAL' ? 'Manual' : 'Auto-track'}
//                                 </Button>
//                             ))}
//                         </Box>
//                         {selectedEnvelope.contributionMode === 'AUTO' && selectedEnvelope.autoRule && (
//                             <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                                 <RefreshCcw size={10} color="#0284c7" />
//                                 <Typography sx={{ fontSize: '0.65rem', color: '#0284c7', fontWeight: 600 }}>
//                                     {fmt(selectedEnvelope.autoRule.amount)} · {FREQUENCY_OPTIONS.find(o => o.value === selectedEnvelope.autoRule?.frequency)?.label ?? selectedEnvelope.autoRule?.frequency}
//                                 </Typography>
//                             </Box>
//                         )}
//                     </Box>
//                 )}
//
//                 <Divider sx={{ mb: 2 }} />
//
//                 {/* Stats grid */}
//                 <Grid container spacing={1.5} sx={{ mb: 2 }}>
//                     {[
//                         { label: 'Remaining',   value: fmt(selectedEnvelope.remainingAmount) },
//                         { label: 'Allocated',   value: `${fmt(selectedEnvelope.allocatedAmount)}/mo` },
//                         { label: 'Target Date', value: selectedEnvelope.targetDate ? new Date(selectedEnvelope.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
//                         { label: 'Days Left',   value: daysUntil(selectedEnvelope.targetDate) !== null ? `${daysUntil(selectedEnvelope.targetDate)}d` : '—' },
//                         { label: 'Streak',      value: `${selectedEnvelope.streakMonths ?? 0}mo` },
//                         { label: 'This month',  value: (() => { const mc = monthlyContributed(contributions, selectedEnvelope.id, monthStart, monthEnd); return mc > 0 ? fmt(mc) : '—'; })() },
//                     ].map(({ label, value }) => (
//                         <Grid item xs={6} key={label}>
//                             <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
//                                 <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', mb: 0.3 }}>{label}</Typography>
//                                 <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
//                             </Box>
//                         </Grid>
//                     ))}
//                 </Grid>
//
//                 {/* Action buttons */}
//                 <Stack spacing={1} sx={{ mb: 2 }}>
//                     {selectedEnvelope.contributionMode === 'MANUAL' ? (
//                         <Button fullWidth variant="contained" startIcon={<Plus size={14} />}
//                                 onClick={() => onAddManual(selectedEnvelope.id)}
//                                 sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', bgcolor: color, '&:hover': { bgcolor: alpha(color, 0.85) } }}>
//                             Add Contribution
//                         </Button>
//                     ) : (
//                         <Button fullWidth variant="outlined" startIcon={<Settings2 size={14} />}
//                                 onClick={() => onAddManual(selectedEnvelope.id)}
//                                 sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', borderColor: '#0284c7', color: '#0284c7', '&:hover': { bgcolor: alpha('#0284c7', 0.05) } }}>
//                             Edit auto-track rule
//                         </Button>
//                     )}
//                     <Box sx={{ display: 'flex', gap: 1 }}>
//                         <Button fullWidth variant="outlined" size="small" startIcon={<MoreHorizontal size={13} />}
//                                 onClick={() => onSnack('Edit — coming soon!', 'info')}
//                                 sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', borderColor: '#d5d5d5', color: '#555', '&:hover': { borderColor: MAROON, color: MAROON } }}>
//                             Edit
//                         </Button>
//                         {selectedEnvelope.status === 'ACTIVE' && (
//                             <Button fullWidth variant="outlined" size="small" startIcon={<PauseCircle size={13} />}
//                                     onClick={() => onSnack('Pause — coming soon!', 'info')}
//                                     sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', borderColor: '#d5d5d5', color: '#d97706', '&:hover': { borderColor: '#d97706', bgcolor: alpha('#d97706', 0.04) } }}>
//                                 Pause
//                             </Button>
//                         )}
//                     </Box>
//                 </Stack>
//
//                 {/* Payment plan prompt */}
//                 {selectedEnvelope.envelopeType === 'PAYOFF' && selectedEnvelope.paymentPlan && (
//                     <Box sx={{ mb: 2, p: 1.5, borderRadius: '10px', bgcolor: alpha('#dc2626', 0.05), border: `1px solid ${alpha('#dc2626', 0.18)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                             <CreditCard size={14} color="#dc2626" style={{ flexShrink: 0 }} />
//                             <Box>
//                                 <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#dc2626' }}>Payment plan available</Typography>
//                                 <Typography sx={{ fontSize: '0.63rem', color: '#7f1d1d', mt: 0.1 }}>
//                                     {selectedEnvelope.paymentPlan.isDeferred
//                                         ? `${fmt(selectedEnvelope.paymentPlan.deferredInterest)} interest at risk`
//                                         : `${selectedEnvelope.paymentPlan.termMonths}-month plan`}
//                                 </Typography>
//                             </Box>
//                         </Box>
//                         <Button size="small" variant="outlined" onClick={() => onSetLeftPanel('paymentplan')}
//                                 endIcon={<ChevronRight size={12} />}
//                                 sx={{ borderRadius: '7px', textTransform: 'none', fontWeight: 700, fontSize: '0.7rem', borderColor: alpha('#dc2626', 0.35), color: '#dc2626', flexShrink: 0, '&:hover': { borderColor: '#dc2626', bgcolor: alpha('#dc2626', 0.05) } }}>
//                             View plan
//                         </Button>
//                     </Box>
//                 )}
//
//                 <Divider sx={{ mb: 1.5 }} />
//
//                 {/* ── Contributions section ──────────────────────────────── */}
//                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
//                     <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa' }}>
//                         Contributions
//                     </Typography>
//                     {scheduledContributions.length > 0 && (
//                         <Box sx={{ display: 'flex', gap: 0.5 }}>
//                             {paidCount > 0     && <Chip size="small" label={`${paidCount} paid`}      sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700, bgcolor: alpha('#16a34a', 0.1), color: '#16a34a' }} />}
//                             {missedCount > 0   && <Chip size="small" label={`${missedCount} missed`}   sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700, bgcolor: alpha('#dc2626', 0.1), color: '#dc2626' }} />}
//                             {upcomingCount > 0 && <Chip size="small" label={`${upcomingCount} ahead`}  sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700, bgcolor: alpha('#aaa', 0.1),    color: '#888'    }} />}
//                         </Box>
//                     )}
//                 </Box>
//
//                 {/* Tab switcher */}
//                 <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, p: '3px', borderRadius: '8px', bgcolor: '#f0f0f0' }}>
//                     {(['history', 'schedule'] as const).map(t => (
//                         <Button key={t} size="small" fullWidth onClick={() => setTab(t)}
//                                 sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', py: 0.4,
//                                     ...(tab === t
//                                         ? { bgcolor: '#fff', color: MAROON, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', '&:hover': { bgcolor: '#fff' } }
//                                         : { bgcolor: 'transparent', color: '#888', '&:hover': { bgcolor: alpha('#fff', 0.5) } }) }}>
//                             {t === 'history' ? `History (${monthLabel})` : `Schedule (${scheduledContributions.length})`}
//                         </Button>
//                     ))}
//                 </Box>
//
//                 {/* History tab */}
//                 {tab === 'history' && (
//                     <Box sx={{ maxHeight: 280, overflowY: 'auto', pr: 0.5 }}>
//                         {selectedContributions.length === 0
//                             ? <Typography sx={{ fontSize: '0.75rem', color: '#bbb', textAlign: 'center', py: 2 }}>No contributions in {monthLabel}</Typography>
//                             : <>
//                                 {selectedContributions.map(c => <ContributionRow key={c.id} c={c} color={color} />)}
//                                 <Box sx={{ mt: 1.5, p: 1.25, borderRadius: '8px', bgcolor: alpha(color, 0.06), border: `1px solid ${alpha(color, 0.15)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                     <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#333' }}>Total this month</Typography>
//                                     <Typography sx={{ fontWeight: 900, fontSize: '0.95rem', color, fontVariantNumeric: 'tabular-nums' }}>
//                                         {fmt(selectedContributions.reduce((s, c) => s + c.amount, 0))}
//                                     </Typography>
//                                 </Box>
//                             </>}
//                     </Box>
//                 )}
//
//                 {/* Schedule tab */}
//                 {tab === 'schedule' && (
//                     scheduledContributions.length === 0 ? (
//                         <Typography sx={{ fontSize: '0.75rem', color: '#bbb', textAlign: 'center', py: 2 }}>No schedule generated</Typography>
//                     ) : (
//                         <>
//                             <Stack spacing={0.75} sx={{ maxHeight: 240, overflowY: 'auto', pr: 0.5, mb: 0.75 }}>
//                                 {scheduledContributions.map(sc => {
//                                     const isPaid      = sc.status === 'PAID';
//                                     const isMissed    = sc.status === 'MISSED';
//                                     const isDue       = new Date(sc.scheduledDate) <= now && !isPaid && !isMissed;
//                                     const rowColor    = isPaid ? '#16a34a' : isMissed ? '#dc2626' : isDue ? '#d97706' : '#94a3b8';
//                                     const rowBg       = isPaid ? alpha('#16a34a', 0.05) : isMissed ? alpha('#dc2626', 0.05) : isDue ? alpha('#d97706', 0.05) : '#f8f8f8';
//                                     const statusLabel = isPaid ? 'Paid' : isMissed ? 'Missed' : isDue ? 'Due' : 'Upcoming';
//                                     return (
//                                         <Box key={sc.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1, borderRadius: '8px', bgcolor: rowBg, border: `1px solid ${alpha(rowColor, 0.2)}` }}>
//                                             <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: rowColor, flexShrink: 0 }} />
//                                             <Box sx={{ flex: 1 }}>
//                                                 <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#111' }}>
//                                                     {new Date(sc.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
//                                                 </Typography>
//                                                 <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>{sc.frequency}</Typography>
//                                             </Box>
//                                             <Box sx={{ textAlign: 'right' }}>
//                                                 <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: rowColor, fontVariantNumeric: 'tabular-nums' }}>
//                                                     {fmt(sc.amount)}
//                                                 </Typography>
//                                                 <Chip size="small" label={statusLabel}
//                                                       sx={{ height: 14, fontSize: '0.55rem', fontWeight: 700, bgcolor: alpha(rowColor, 0.1), color: rowColor }} />
//                                             </Box>
//                                         </Box>
//                                     );
//                                 })}
//                             </Stack>
//                             {/* Total pinned outside scroll */}
//                             <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: alpha(color, 0.06), border: `1px solid ${alpha(color, 0.15)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                 <Box>
//                                     <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#333' }}>Total scheduled</Typography>
//                                     <Typography sx={{ fontSize: '0.6rem', color: '#aaa' }}>
//                                         {fmt(scheduledContributions.filter(c => c.status === 'PAID').reduce((s, c) => s + c.amount, 0))} paid so far
//                                     </Typography>
//                                 </Box>
//                                 <Typography sx={{ fontWeight: 900, fontSize: '0.95rem', color, fontVariantNumeric: 'tabular-nums' }}>
//                                     {fmt(scheduledContributions.reduce((s, c) => s + c.amount, 0))}
//                                 </Typography>
//                             </Box>
//                         </>
//                     )
//                 )}
//             </Box>
//         </Box>
//     );
// };
//
// export default EnvelopeDetailPanel;
