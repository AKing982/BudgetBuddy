import React, { useState } from 'react';
import {
    alpha, Box, Chip, Collapse, Divider, Grid, IconButton,
    LinearProgress, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import {
    ChevronDown, ChevronUp, Layers, RefreshCcw, PiggyBank,
    XCircle, Wallet, Flame, CheckCircle, TrendingUp, PauseCircle,
    X, RotateCcw, Plus, Unlink, AlertTriangle,
} from 'lucide-react';
import { LinkedEnvelopeGroup } from '../services/BudgetEnvelopeService';
import { ENVELOPE_COLORS, MAROON } from '../config/Constants';
import { fmt, progressPct, velocityDays, daysUntil, requiredMonthly } from '../config/Helpers';
import { VelocityChip } from './Shared';
import { BudgetEnvelope } from '../config/Types';
import NotificationToggle, { NotificationPrefs } from './NotificationToggle';

/** Fallback used wherever a notification preference hasn't been supplied yet */
const DEFAULT_NOTIF_PREFS: NotificationPrefs = { system: true, email: false };

interface LinkedEnvelopeGroupCardProps {
    group:            LinkedEnvelopeGroup;
    onSelectEnvelope: (id: number) => void;
    selectedId:       number | null;
    /** When true, the card renders in edit mode (member add/remove controls visible) */
    editMode?:        boolean;
    /** Called when the user saves membership changes */
    onSaveGroupEdit?: (groupId: number, newName: string, removedIds: number[], addedIds: number[]) => void;
    /** Called when the user confirms dissolve */
    onDissolveGroup?: (groupId: number) => void;
    /** All individual (non-linked) envelopes available to be added to this group */
    availableEnvelopes?: BudgetEnvelope[];
    /** Master system/email notification state for the whole group */
    groupNotificationPrefs?:      NotificationPrefs;
    /** Toggles the group's master notification switch (cascades to all members) */
    onToggleGroupNotification?:   (channel: 'system' | 'email') => void;
    /** Looks up an individual member's own notification prefs by envelope id */
    getMemberNotificationPrefs?:  (envelopeId: number) => NotificationPrefs;
    /** Toggles one member's notification channel independent of the group */
    onToggleMemberNotification?:  (envelopeId: number, channel: 'system' | 'email') => void;
    /** Opens the combined notification settings/history dialog for the whole group */
    onOpenGroupNotificationSettings?:  (channel: 'system' | 'email') => void;
    /** Opens the combined notification settings/history dialog for a single member */
    onOpenMemberNotificationSettings?: (envelopeId: number, channel: 'system' | 'email') => void;
    onOpenGoalUpdate?: () => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    SAVINGS:   <PiggyBank size={13} />,
    PAYOFF:    <XCircle   size={13} />,
    PURCHASE:  <Wallet    size={13} />,
    EMERGENCY: <Flame     size={13} />,
};

const STATUS_ICON: Record<string, React.ReactNode> = {
    ACTIVE:    <TrendingUp  size={10} />,
    COMPLETED: <CheckCircle size={10} />,
    PAUSED:    <PauseCircle size={10} />,
};

// ── MemberCard (view mode) ─────────────────────────────────────────────────────
const MemberCard: React.FC<{
    env:                  BudgetEnvelope;
    isSelected:           boolean;
    onClick:              () => void;
    notificationPrefs:    NotificationPrefs;
    onToggleNotification: (channel: 'system' | 'email') => void;
    onOpenNotificationSettings?: (channel: 'system' | 'email') => void;
}> = ({
          env, isSelected, onClick, notificationPrefs, onToggleNotification, onOpenNotificationSettings,
      }) => {
    const c    = ENVELOPE_COLORS[env.envelopeType];
    const pct  = progressPct(env.currentAmount, env.targetAmount);
    const vel  = velocityDays(env);
    const req  = requiredMonthly(env);
    const days = daysUntil(env.targetDate);

    return (
        <Box onClick={onClick} sx={{
            borderRadius: '10px',
            border: `1px solid ${isSelected ? c : alpha(c, 0.2)}`,
            borderTop: `3px solid ${c}`,
            bgcolor: isSelected ? alpha(c, 0.04) : '#fff',
            p: 1.25,
            cursor: 'pointer',
            transition: 'all 0.15s',
            '&:hover': { boxShadow: `0 4px 14px ${alpha(c, 0.15)}`, transform: 'translateY(-1px)' },
            position: 'relative',
            overflow: 'hidden',
        }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mb: 1 }}>
                <Box sx={{ width: 26, height: 26, borderRadius: '7px', bgcolor: alpha(c, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: c, flexShrink: 0 }}>
                    {TYPE_ICONS[env.envelopeType]}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#111', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {env.envelopeName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.2 }}>
                        <Box sx={{ color: env.status === 'ACTIVE' ? '#16a34a' : env.status === 'COMPLETED' ? '#0284c7' : '#d97706' }}>
                            {STATUS_ICON[env.status]}
                        </Box>
                        <Typography sx={{ fontSize: '0.58rem', color: '#888' }}>{env.status.toLowerCase()}</Typography>
                        {env.contributionMode === 'AUTO' && <RefreshCcw size={8} color="#0284c7" />}
                    </Box>
                </Box>
                <NotificationToggle prefs={notificationPrefs} onToggle={onToggleNotification} onOpenSettings={onOpenNotificationSettings} size={11} />
            </Box>

            <Typography sx={{ fontSize: '1rem', fontWeight: 900, color: c, fontVariantNumeric: 'tabular-nums', lineHeight: 1, mb: 0.25 }}>
                {fmt(env.currentAmount)}
            </Typography>
            <Typography sx={{ fontSize: '0.58rem', color: '#aaa', mb: 0.75 }}>of {fmt(env.targetAmount)}</Typography>

            <LinearProgress variant="determinate" value={pct}
                            sx={{ height: 5, borderRadius: 3, bgcolor: alpha(c, 0.12), mb: 0.75, '& .MuiLinearProgress-bar': { bgcolor: c, borderRadius: 3 } }} />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, mb: 0.75 }}>
                <Box sx={{ p: 0.5, borderRadius: '5px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
                    <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ccc', mb: 0.1 }}>Need/mo</Typography>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: req !== null && req > env.allocatedAmount ? '#dc2626' : '#111', fontVariantNumeric: 'tabular-nums' }}>
                        {req !== null ? fmt(req) : '—'}
                    </Typography>
                </Box>
                <Box sx={{ p: 0.5, borderRadius: '5px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
                    <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ccc', mb: 0.1 }}>Remaining</Typography>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(env.remainingAmount)}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {days !== null
                    ? <Chip size="small" label={`${days}d left`}
                            sx={{ height: 15, fontSize: '0.55rem', fontWeight: 700, bgcolor: days <= 60 ? alpha('#d97706', 0.1) : alpha('#16a34a', 0.1), color: days <= 60 ? '#d97706' : '#16a34a' }} />
                    : <Box />}
                <VelocityChip days={vel} />
            </Box>
        </Box>
    );
};

// ── EditMemberCard — compact card shown inside the group in edit mode ──────────
const EditMemberCard: React.FC<{
    env:       BudgetEnvelope;
    flagged:   boolean;
    isAdding?: boolean;
    onToggle:  () => void;
}> = ({ env, flagged, isAdding = false, onToggle }) => {
    const c   = ENVELOPE_COLORS[env.envelopeType];
    const pct = progressPct(env.currentAmount, env.targetAmount);

    return (
        <Box sx={{
            borderRadius: '10px',
            border: `1px solid ${flagged ? alpha('#dc2626', 0.35) : isAdding ? alpha('#16a34a', 0.35) : alpha(c, 0.2)}`,
            borderTop: `3px solid ${flagged ? '#dc2626' : isAdding ? '#16a34a' : c}`,
            bgcolor: flagged ? alpha('#dc2626', 0.03) : isAdding ? alpha('#16a34a', 0.04) : '#fff',
            p: 1.25,
            opacity: flagged ? 0.55 : 1,
            transition: 'all 0.15s',
            position: 'relative',
        }}>
            {/* Remove / undo button */}
            <Tooltip title={flagged ? 'Undo removal' : isAdding ? 'Undo add' : 'Remove from group'}>
                <Box
                    onClick={onToggle}
                    sx={{
                        position: 'absolute', top: 6, right: 6,
                        width: 20, height: 20, borderRadius: '5px',
                        border: `1px solid ${flagged ? alpha('#16a34a', 0.4) : isAdding ? alpha('#dc2626', 0.3) : alpha('#000', 0.12)}`,
                        bgcolor: flagged ? alpha('#16a34a', 0.06) : isAdding ? alpha('#dc2626', 0.04) : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        color: flagged ? '#16a34a' : isAdding ? '#dc2626' : '#aaa',
                        '&:hover': {
                            borderColor: flagged ? '#16a34a' : '#dc2626',
                            color: flagged ? '#16a34a' : '#dc2626',
                            bgcolor: flagged ? alpha('#16a34a', 0.1) : alpha('#dc2626', 0.06),
                        },
                    }}
                >
                    {flagged || isAdding ? <RotateCcw size={10} /> : <X size={10} />}
                </Box>
            </Tooltip>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.6, pr: 2.5 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: c, flexShrink: 0 }} />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {env.envelopeName}
                </Typography>
            </Box>

            <Typography sx={{ fontSize: '0.62rem', color: '#888', fontVariantNumeric: 'tabular-nums', mb: 0.5 }}>
                {fmt(env.currentAmount)} / {fmt(env.targetAmount)}
            </Typography>

            <LinearProgress variant="determinate" value={pct}
                            sx={{ height: 3, borderRadius: 2, bgcolor: alpha(c, 0.12), '& .MuiLinearProgress-bar': { bgcolor: flagged ? '#dc2626' : isAdding ? '#16a34a' : c, borderRadius: 2 } }} />

            {flagged && (
                <Typography sx={{ fontSize: '0.55rem', color: '#dc2626', fontWeight: 700, mt: 0.5 }}>
                    will be removed
                </Typography>
            )}
            {isAdding && (
                <Typography sx={{ fontSize: '0.55rem', color: '#16a34a', fontWeight: 700, mt: 0.5 }}>
                    will be added
                </Typography>
            )}
        </Box>
    );
};

// ── Main component ─────────────────────────────────────────────────────────────
const LinkedEnvelopeGroupCard: React.FC<LinkedEnvelopeGroupCardProps> = ({
                                                                             group,
                                                                             onSelectEnvelope,
                                                                             selectedId,
                                                                             editMode = false,
                                                                             onSaveGroupEdit,
                                                                             onDissolveGroup,
                                                                             availableEnvelopes = [],
                                                                             groupNotificationPrefs = DEFAULT_NOTIF_PREFS,
                                                                             onToggleGroupNotification,
                                                                             getMemberNotificationPrefs,
                                                                             onToggleMemberNotification,
                                                                             onOpenGroupNotificationSettings,
                                                                             onOpenMemberNotificationSettings,
                                                                             onOpenGoalUpdate
                                                                         }) => {
    const [expanded,      setExpanded]      = useState(false);
    const [removingIds,   setRemovingIds]   = useState<Set<number>>(new Set());
    const [addingIds,     setAddingIds]     = useState<Set<number>>(new Set());
    const [groupName,     setGroupName]     = useState(group.linkName);
    const [showDissolve,  setShowDissolve]  = useState(false);

    // Reset local edit state when editMode is turned off externally
    React.useEffect(() => {
        if (!editMode) {
            setRemovingIds(new Set());
            setAddingIds(new Set());
            setGroupName(group.linkName);
            setShowDissolve(false);
        }
    }, [editMode, group.linkName]);

    const totalSaved     = group.envelopes.reduce((s, e) => s + e.currentAmount,  0);
    const totalTarget    = group.envelopes.reduce((s, e) => s + e.targetAmount,   0);
    const totalRemaining = group.envelopes.reduce((s, e) => s + e.remainingAmount, 0);
    const overallPct     = progressPct(totalSaved, totalTarget);
    const activeCount    = group.envelopes.filter(e => e.status === 'ACTIVE').length;

    const hasPendingChanges =
        removingIds.size > 0 ||
        addingIds.size   > 0 ||
        groupName !== group.linkName;

    const pendingSummaryParts: string[] = [];
    if (removingIds.size) pendingSummaryParts.push(`${removingIds.size} envelope${removingIds.size > 1 ? 's' : ''} will be removed`);
    if (addingIds.size)   pendingSummaryParts.push(`${addingIds.size} envelope${addingIds.size > 1 ? 's' : ''} will be added`);
    if (groupName !== group.linkName) pendingSummaryParts.push('group name updated');

    const toggleRemove = (id: number) => {
        setRemovingIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAdd = (id: number) => {
        setAddingIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleSave = () => {
        onSaveGroupEdit?.(
            group.id,
            groupName,
            Array.from(removingIds),
            Array.from(addingIds),
        );
        setRemovingIds(new Set());
        setAddingIds(new Set());
        setShowDissolve(false);
    };

    const handleDiscard = () => {
        setRemovingIds(new Set());
        setAddingIds(new Set());
        setGroupName(group.linkName);
        setShowDissolve(false);
    };

    const handleDissolve = () => {
        onDissolveGroup?.(group.id);
        setShowDissolve(false);
    };

    // Envelopes that can be added: individual (non-linked) and not already a member
    const memberIds = new Set(group.envelopes.map(e => e.id));
    const addable   = availableEnvelopes.filter(e => !memberIds.has(e.id));

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <Box sx={{
            borderRadius: '12px',
            border: `1px solid ${editMode ? alpha(MAROON, 0.4) : alpha(MAROON, 0.25)}`,
            borderTop: `3px solid ${MAROON}`,
            overflow: 'hidden',
            transition: 'box-shadow 0.2s',
            mb: editMode ? 0 : undefined,
            '&:hover': { boxShadow: `0 4px 18px ${alpha(MAROON, 0.12)}` },
        }}>

            {/* ── Group header ─────────────────────────────────────────────── */}
            <Box sx={{ p: 2, bgcolor: '#fff' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: editMode ? 1 : 1.25 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: alpha(MAROON, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Layers size={15} color={MAROON} />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* View mode: static name */}
                        {!editMode && (
                            <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#111', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {group.linkName}
                            </Typography>
                        )}

                        {/* Edit mode: editable name + dissolve link */}
                        {editMode && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TextField
                                    size="small"
                                    value={groupName}
                                    onChange={e => setGroupName(e.target.value)}
                                    variant="outlined"
                                    sx={{
                                        flex: 1,
                                        '& .MuiInputBase-input': { fontSize: '0.85rem', fontWeight: 700, py: 0.6, px: 1 },
                                        '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                                    }}
                                />
                                <Tooltip title="Dissolve group — all envelopes become individual">
                                    <Box
                                        onClick={() => setShowDissolve(p => !p)}
                                        sx={{
                                            display: 'flex', alignItems: 'center', gap: 0.4,
                                            cursor: 'pointer', color: '#dc2626',
                                            fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                                            '&:hover': { textDecoration: 'underline' },
                                        }}
                                    >
                                        <Unlink size={11} />
                                        Dissolve
                                    </Box>
                                </Tooltip>
                            </Box>
                        )}

                        <Typography sx={{ fontSize: '0.63rem', color: '#888', mt: 0.2 }}>
                            {group.envelopes.length} envelopes · {activeCount} active
                        </Typography>
                    </Box>

                    <NotificationToggle
                        prefs={groupNotificationPrefs}
                        onToggle={(channel) => onToggleGroupNotification?.(channel)}
                        onOpenSettings={(channel) => onOpenGroupNotificationSettings?.(channel)}
                    />

                    <Chip size="small" label="Linked"
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(MAROON, 0.1), color: MAROON, flexShrink: 0 }} />
                </Box>

                {/* Dissolve confirmation */}
                {showDissolve && (
                    <Box sx={{ mb: 1.5, p: 1.5, borderRadius: '10px', bgcolor: alpha('#dc2626', 0.05), border: `1px solid ${alpha('#dc2626', 0.25)}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                            <AlertTriangle size={13} color="#dc2626" />
                            <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: '#dc2626' }}>Dissolve this group?</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.7rem', color: '#7f1d1d', lineHeight: 1.5, mb: 1 }}>
                            All {group.envelopes.length} envelopes will become individual. Contribution history and targets are preserved. This cannot be undone.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.75 }}>
                            <Box
                                onClick={() => setShowDissolve(false)}
                                sx={{ flex: 1, py: 0.6, borderRadius: '6px', border: `1px solid #d5d5d5`, textAlign: 'center', cursor: 'pointer', fontSize: '0.72rem', color: '#555', '&:hover': { bgcolor: '#f5f5f5' } }}
                            >
                                Cancel
                            </Box>
                            <Box
                                onClick={handleDissolve}
                                sx={{ flex: 1, py: 0.6, borderRadius: '6px', bgcolor: '#dc2626', textAlign: 'center', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, color: '#fff', '&:hover': { bgcolor: '#b91c1c' } }}
                            >
                                Yes, dissolve
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* Combined progress */}
                {!editMode && (
                    <Box sx={{ mb: 1.25 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography sx={{ fontSize: '0.72rem', color: '#555', fontWeight: 600 }}>{fmt(totalSaved)} combined</Typography>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: MAROON }}>{overallPct.toFixed(0)}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={overallPct}
                                        sx={{ height: 6, borderRadius: 3, bgcolor: alpha(MAROON, 0.1), '& .MuiLinearProgress-bar': { bgcolor: MAROON, borderRadius: 3 } }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.4 }}>
                            <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>Goal: {fmt(totalTarget)}</Typography>
                            <Typography sx={{ fontSize: '0.62rem', color: MAROON, fontWeight: 700 }}>{fmt(totalRemaining)} to go</Typography>
                        </Box>
                    </Box>
                )}

                {/* Summary stats */}
                {!editMode && (
                    <Grid container spacing={0.75} sx={{ mb: 1.25 }}>
                        {[
                            { label: 'Shared budget', value: `${fmt(group.sharedBudget)}/mo` },
                            { label: 'Total spent',   value: fmt(group.totalSpent) },
                            { label: 'Score',         value: group.score.toFixed(1) },
                        ].map(({ label, value }) => (
                            <Grid item xs={4} key={label}>
                                <Box sx={{ p: 0.75, borderRadius: '6px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
                                    <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#bbb', mb: 0.2 }}>{label}</Typography>
                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: MAROON, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* View mode expand toggle */}
                {!editMode && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                         onClick={() => setExpanded(p => !p)}>
                        <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: MAROON }}>
                            {expanded ? 'Hide envelopes' : `View ${group.envelopes.length} envelopes`}
                        </Typography>
                        <IconButton size="small" sx={{ p: 0.25, color: MAROON }}>
                            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </IconButton>
                    </Box>
                )}
            </Box>

            {/* ── View mode: expanded member cards ─────────────────────────── */}
            {!editMode && (
                <Collapse in={expanded}>
                    <Divider />
                    <Box sx={{ bgcolor: '#f9f9f9', p: 1.5 }}>
                        <Grid container spacing={1.25}>
                            {group.envelopes.map(env => (
                                <Grid item xs={12} sm={6} key={env.id}>
                                    <MemberCard
                                        env={env}
                                        isSelected={env.id === selectedId}
                                        onClick={() => onSelectEnvelope(env.id)}
                                        notificationPrefs={getMemberNotificationPrefs?.(env.id) ?? DEFAULT_NOTIF_PREFS}
                                        onToggleNotification={(channel) => onToggleMemberNotification?.(env.id, channel)}
                                        onOpenNotificationSettings={(channel) => onOpenMemberNotificationSettings?.(env.id, channel)}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Collapse>
            )}

            {/* ── Edit mode: member grid with remove controls ───────────────── */}
            {editMode && (
                <>
                    <Divider />
                    <Box sx={{ bgcolor: '#f9f9f9', p: 1.5 }}>

                        {/* Existing members */}
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#bbb', mb: 1 }}>
                            Current members
                        </Typography>
                        <Grid container spacing={1} sx={{ mb: addable.length > 0 ? 1.5 : 0 }}>
                            {group.envelopes.map(env => (
                                <Grid item xs={12} sm={6} key={env.id}>
                                    <EditMemberCard
                                        env={env}
                                        flagged={removingIds.has(env.id)}
                                        onToggle={() => toggleRemove(env.id)}
                                    />
                                </Grid>
                            ))}

                            {/* Preview cards for envelopes being added */}
                            {addable.filter(e => addingIds.has(e.id)).map(env => (
                                <Grid item xs={12} sm={6} key={`adding-${env.id}`}>
                                    <EditMemberCard
                                        env={env}
                                        flagged={false}
                                        isAdding={true}
                                        onToggle={() => toggleAdd(env.id)}
                                    />
                                </Grid>
                            ))}
                        </Grid>

                        {/* Available to add */}
                        {addable.length > 0 && (
                            <>
                                <Divider sx={{ mb: 1.25 }} />
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#bbb', mb: 0.75 }}>
                                    Add to group
                                </Typography>
                                {addable.map(env => {
                                    const c       = ENVELOPE_COLORS[env.envelopeType];
                                    const isAdded = addingIds.has(env.id);
                                    return (
                                        <Box key={env.id} sx={{
                                            display: 'flex', alignItems: 'center', gap: 1,
                                            p: 0.9, mb: 0.6, borderRadius: '8px',
                                            border: `1px solid ${isAdded ? alpha('#16a34a', 0.35) : '#eee'}`,
                                            bgcolor: isAdded ? alpha('#16a34a', 0.04) : '#fff',
                                            transition: 'all 0.15s',
                                        }}>
                                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: c, flexShrink: 0 }} />
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {env.envelopeName}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.6rem', color: '#aaa', fontVariantNumeric: 'tabular-nums' }}>
                                                    {fmt(env.currentAmount)} / {fmt(env.targetAmount)} · {env.status.toLowerCase()}
                                                </Typography>
                                            </Box>
                                            <Tooltip title={isAdded ? 'Undo' : 'Add to group'}>
                                                <Box
                                                    onClick={() => toggleAdd(env.id)}
                                                    sx={{
                                                        width: 22, height: 22, borderRadius: '5px', flexShrink: 0,
                                                        border: `1px solid ${isAdded ? alpha('#16a34a', 0.4) : '#ddd'}`,
                                                        bgcolor: isAdded ? alpha('#16a34a', 0.06) : 'transparent',
                                                        color: isAdded ? '#16a34a' : '#aaa',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        '&:hover': { borderColor: isAdded ? '#dc2626' : '#16a34a', color: isAdded ? '#dc2626' : '#16a34a', bgcolor: isAdded ? alpha('#dc2626', 0.04) : alpha('#16a34a', 0.06) },
                                                    }}
                                                >
                                                    {isAdded ? <RotateCcw size={11} /> : <Plus size={11} />}
                                                </Box>
                                            </Tooltip>
                                        </Box>
                                    );
                                })}
                            </>
                        )}

                        {addable.length === 0 && group.envelopes.length > 0 && (
                            <Typography sx={{ fontSize: '0.65rem', color: '#bbb', fontStyle: 'italic', mt: 0.5 }}>
                                No individual envelopes available to add.
                            </Typography>
                        )}
                    </Box>

                    {/* Pending changes banner */}
                    {hasPendingChanges && (
                        <Box sx={{ mx: 2, mb: 1.5, p: 1, borderRadius: '8px', bgcolor: alpha(MAROON, 0.05), border: `1px solid ${alpha(MAROON, 0.18)}` }}>
                            <Typography sx={{ fontSize: '0.68rem', color: '#555' }}>
                                ⚠ Pending: {pendingSummaryParts.join(' · ')}
                            </Typography>
                        </Box>
                    )}

                    {/* Save / discard footer */}
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', px: 2, pb: 1.5 }}>
                        <Box
                            onClick={handleDiscard}
                            sx={{
                                px: 2, py: 0.7, borderRadius: '7px', border: `1px solid #d5d5d5`,
                                fontSize: '0.75rem', color: '#666', cursor: 'pointer',
                                '&:hover': { bgcolor: '#f5f5f5' },
                            }}
                        >
                            Discard
                        </Box>
                        <Box
                            onClick={handleSave}
                            sx={{
                                px: 2, py: 0.7, borderRadius: '7px', bgcolor: MAROON, border: 'none',
                                fontSize: '0.75rem', fontWeight: 700, color: '#fff', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 0.5,
                                '&:hover': { bgcolor: '#7f1d1d' },
                                opacity: hasPendingChanges ? 1 : 0.5,
                            }}
                        >
                            Save changes
                        </Box>
                    </Box>
                </>
            )}
        </Box>
    );
};

export default LinkedEnvelopeGroupCard;

// import React, { useState } from 'react';
// import {
//     alpha, Box, Chip, Collapse, Divider, Grid, IconButton,
//     LinearProgress, Stack, TextField, Tooltip, Typography,
// } from '@mui/material';
// import {
//     ChevronDown, ChevronUp, Layers, RefreshCcw, PiggyBank,
//     XCircle, Wallet, Flame, CheckCircle, TrendingUp, PauseCircle,
//     X, RotateCcw, Plus, Unlink, AlertTriangle,
// } from 'lucide-react';
// import { LinkedEnvelopeGroup } from '../services/BudgetEnvelopeService';
// import { ENVELOPE_COLORS, MAROON } from '../config/Constants';
// import { fmt, progressPct, velocityDays, daysUntil, requiredMonthly } from '../config/Helpers';
// import { VelocityChip } from './Shared';
// import { BudgetEnvelope } from '../config/Types';
// import NotificationToggle, { NotificationPrefs } from './NotificationToggle';
//
// /** Fallback used wherever a notification preference hasn't been supplied yet */
// const DEFAULT_NOTIF_PREFS: NotificationPrefs = { system: true, email: false };
//
// interface LinkedEnvelopeGroupCardProps {
//     group:            LinkedEnvelopeGroup;
//     onSelectEnvelope: (id: number) => void;
//     selectedId:       number | null;
//     /** When true, the card renders in edit mode (member add/remove controls visible) */
//     editMode?:        boolean;
//     /** Called when the user saves membership changes */
//     onSaveGroupEdit?: (groupId: number, newName: string, removedIds: number[], addedIds: number[]) => void;
//     /** Called when the user confirms dissolve */
//     onDissolveGroup?: (groupId: number) => void;
//     /** All individual (non-linked) envelopes available to be added to this group */
//     availableEnvelopes?: BudgetEnvelope[];
//     /** Master system/email notification state for the whole group */
//     groupNotificationPrefs?:      NotificationPrefs;
//     /** Toggles the group's master notification switch (cascades to all members) */
//     onToggleGroupNotification?:   (channel: 'system' | 'email') => void;
//     /** Looks up an individual member's own notification prefs by envelope id */
//     getMemberNotificationPrefs?:  (envelopeId: number) => NotificationPrefs;
//     /** Toggles one member's notification channel independent of the group */
//     onToggleMemberNotification?:  (envelopeId: number, channel: 'system' | 'email') => void;
// }
//
// const TYPE_ICONS: Record<string, React.ReactNode> = {
//     SAVINGS:   <PiggyBank size={13} />,
//     PAYOFF:    <XCircle   size={13} />,
//     PURCHASE:  <Wallet    size={13} />,
//     EMERGENCY: <Flame     size={13} />,
// };
//
// const STATUS_ICON: Record<string, React.ReactNode> = {
//     ACTIVE:    <TrendingUp  size={10} />,
//     COMPLETED: <CheckCircle size={10} />,
//     PAUSED:    <PauseCircle size={10} />,
// };
//
// // ── MemberCard (view mode) ─────────────────────────────────────────────────────
// const MemberCard: React.FC<{
//     env:                  BudgetEnvelope;
//     isSelected:           boolean;
//     onClick:              () => void;
//     notificationPrefs:    NotificationPrefs;
//     onToggleNotification: (channel: 'system' | 'email') => void;
// }> = ({
//           env, isSelected, onClick, notificationPrefs, onToggleNotification,
//       }) => {
//     const c    = ENVELOPE_COLORS[env.envelopeType];
//     const pct  = progressPct(env.currentAmount, env.targetAmount);
//     const vel  = velocityDays(env);
//     const req  = requiredMonthly(env);
//     const days = daysUntil(env.targetDate);
//
//     return (
//         <Box onClick={onClick} sx={{
//             borderRadius: '10px',
//             border: `1px solid ${isSelected ? c : alpha(c, 0.2)}`,
//             borderTop: `3px solid ${c}`,
//             bgcolor: isSelected ? alpha(c, 0.04) : '#fff',
//             p: 1.25,
//             cursor: 'pointer',
//             transition: 'all 0.15s',
//             '&:hover': { boxShadow: `0 4px 14px ${alpha(c, 0.15)}`, transform: 'translateY(-1px)' },
//             position: 'relative',
//             overflow: 'hidden',
//         }}>
//             <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mb: 1 }}>
//                 <Box sx={{ width: 26, height: 26, borderRadius: '7px', bgcolor: alpha(c, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: c, flexShrink: 0 }}>
//                     {TYPE_ICONS[env.envelopeType]}
//                 </Box>
//                 <Box sx={{ minWidth: 0, flex: 1 }}>
//                     <Typography sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#111', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                         {env.envelopeName}
//                     </Typography>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.2 }}>
//                         <Box sx={{ color: env.status === 'ACTIVE' ? '#16a34a' : env.status === 'COMPLETED' ? '#0284c7' : '#d97706' }}>
//                             {STATUS_ICON[env.status]}
//                         </Box>
//                         <Typography sx={{ fontSize: '0.58rem', color: '#888' }}>{env.status.toLowerCase()}</Typography>
//                         {env.contributionMode === 'AUTO' && <RefreshCcw size={8} color="#0284c7" />}
//                     </Box>
//                 </Box>
//                 <NotificationToggle prefs={notificationPrefs} onToggle={onToggleNotification} size={11} />
//             </Box>
//
//             <Typography sx={{ fontSize: '1rem', fontWeight: 900, color: c, fontVariantNumeric: 'tabular-nums', lineHeight: 1, mb: 0.25 }}>
//                 {fmt(env.currentAmount)}
//             </Typography>
//             <Typography sx={{ fontSize: '0.58rem', color: '#aaa', mb: 0.75 }}>of {fmt(env.targetAmount)}</Typography>
//
//             <LinearProgress variant="determinate" value={pct}
//                             sx={{ height: 5, borderRadius: 3, bgcolor: alpha(c, 0.12), mb: 0.75, '& .MuiLinearProgress-bar': { bgcolor: c, borderRadius: 3 } }} />
//
//             <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, mb: 0.75 }}>
//                 <Box sx={{ p: 0.5, borderRadius: '5px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
//                     <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ccc', mb: 0.1 }}>Need/mo</Typography>
//                     <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: req !== null && req > env.allocatedAmount ? '#dc2626' : '#111', fontVariantNumeric: 'tabular-nums' }}>
//                         {req !== null ? fmt(req) : '—'}
//                     </Typography>
//                 </Box>
//                 <Box sx={{ p: 0.5, borderRadius: '5px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
//                     <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ccc', mb: 0.1 }}>Remaining</Typography>
//                     <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
//                         {fmt(env.remainingAmount)}
//                     </Typography>
//                 </Box>
//             </Box>
//
//             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                 {days !== null
//                     ? <Chip size="small" label={`${days}d left`}
//                             sx={{ height: 15, fontSize: '0.55rem', fontWeight: 700, bgcolor: days <= 60 ? alpha('#d97706', 0.1) : alpha('#16a34a', 0.1), color: days <= 60 ? '#d97706' : '#16a34a' }} />
//                     : <Box />}
//                 <VelocityChip days={vel} />
//             </Box>
//         </Box>
//     );
// };
//
// // ── EditMemberCard — compact card shown inside the group in edit mode ──────────
// const EditMemberCard: React.FC<{
//     env:       BudgetEnvelope;
//     flagged:   boolean;
//     isAdding?: boolean;
//     onToggle:  () => void;
// }> = ({ env, flagged, isAdding = false, onToggle }) => {
//     const c   = ENVELOPE_COLORS[env.envelopeType];
//     const pct = progressPct(env.currentAmount, env.targetAmount);
//
//     return (
//         <Box sx={{
//             borderRadius: '10px',
//             border: `1px solid ${flagged ? alpha('#dc2626', 0.35) : isAdding ? alpha('#16a34a', 0.35) : alpha(c, 0.2)}`,
//             borderTop: `3px solid ${flagged ? '#dc2626' : isAdding ? '#16a34a' : c}`,
//             bgcolor: flagged ? alpha('#dc2626', 0.03) : isAdding ? alpha('#16a34a', 0.04) : '#fff',
//             p: 1.25,
//             opacity: flagged ? 0.55 : 1,
//             transition: 'all 0.15s',
//             position: 'relative',
//         }}>
//             {/* Remove / undo button */}
//             <Tooltip title={flagged ? 'Undo removal' : isAdding ? 'Undo add' : 'Remove from group'}>
//                 <Box
//                     onClick={onToggle}
//                     sx={{
//                         position: 'absolute', top: 6, right: 6,
//                         width: 20, height: 20, borderRadius: '5px',
//                         border: `1px solid ${flagged ? alpha('#16a34a', 0.4) : isAdding ? alpha('#dc2626', 0.3) : alpha('#000', 0.12)}`,
//                         bgcolor: flagged ? alpha('#16a34a', 0.06) : isAdding ? alpha('#dc2626', 0.04) : 'transparent',
//                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                         cursor: 'pointer',
//                         color: flagged ? '#16a34a' : isAdding ? '#dc2626' : '#aaa',
//                         '&:hover': {
//                             borderColor: flagged ? '#16a34a' : '#dc2626',
//                             color: flagged ? '#16a34a' : '#dc2626',
//                             bgcolor: flagged ? alpha('#16a34a', 0.1) : alpha('#dc2626', 0.06),
//                         },
//                     }}
//                 >
//                     {flagged || isAdding ? <RotateCcw size={10} /> : <X size={10} />}
//                 </Box>
//             </Tooltip>
//
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.6, pr: 2.5 }}>
//                 <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: c, flexShrink: 0 }} />
//                 <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                     {env.envelopeName}
//                 </Typography>
//             </Box>
//
//             <Typography sx={{ fontSize: '0.62rem', color: '#888', fontVariantNumeric: 'tabular-nums', mb: 0.5 }}>
//                 {fmt(env.currentAmount)} / {fmt(env.targetAmount)}
//             </Typography>
//
//             <LinearProgress variant="determinate" value={pct}
//                             sx={{ height: 3, borderRadius: 2, bgcolor: alpha(c, 0.12), '& .MuiLinearProgress-bar': { bgcolor: flagged ? '#dc2626' : isAdding ? '#16a34a' : c, borderRadius: 2 } }} />
//
//             {flagged && (
//                 <Typography sx={{ fontSize: '0.55rem', color: '#dc2626', fontWeight: 700, mt: 0.5 }}>
//                     will be removed
//                 </Typography>
//             )}
//             {isAdding && (
//                 <Typography sx={{ fontSize: '0.55rem', color: '#16a34a', fontWeight: 700, mt: 0.5 }}>
//                     will be added
//                 </Typography>
//             )}
//         </Box>
//     );
// };
//
// // ── Main component ─────────────────────────────────────────────────────────────
// const LinkedEnvelopeGroupCard: React.FC<LinkedEnvelopeGroupCardProps> = ({
//                                                                              group,
//                                                                              onSelectEnvelope,
//                                                                              selectedId,
//                                                                              editMode = false,
//                                                                              onSaveGroupEdit,
//                                                                              onDissolveGroup,
//                                                                              availableEnvelopes = [],
//                                                                              groupNotificationPrefs = DEFAULT_NOTIF_PREFS,
//                                                                              onToggleGroupNotification,
//                                                                              getMemberNotificationPrefs,
//                                                                              onToggleMemberNotification,
//                                                                          }) => {
//     const [expanded,      setExpanded]      = useState(false);
//     const [removingIds,   setRemovingIds]   = useState<Set<number>>(new Set());
//     const [addingIds,     setAddingIds]     = useState<Set<number>>(new Set());
//     const [groupName,     setGroupName]     = useState(group.linkName);
//     const [showDissolve,  setShowDissolve]  = useState(false);
//
//     // Reset local edit state when editMode is turned off externally
//     React.useEffect(() => {
//         if (!editMode) {
//             setRemovingIds(new Set());
//             setAddingIds(new Set());
//             setGroupName(group.linkName);
//             setShowDissolve(false);
//         }
//     }, [editMode, group.linkName]);
//
//     const totalSaved     = group.envelopes.reduce((s, e) => s + e.currentAmount,  0);
//     const totalTarget    = group.envelopes.reduce((s, e) => s + e.targetAmount,   0);
//     const totalRemaining = group.envelopes.reduce((s, e) => s + e.remainingAmount, 0);
//     const overallPct     = progressPct(totalSaved, totalTarget);
//     const activeCount    = group.envelopes.filter(e => e.status === 'ACTIVE').length;
//
//     const hasPendingChanges =
//         removingIds.size > 0 ||
//         addingIds.size   > 0 ||
//         groupName !== group.linkName;
//
//     const pendingSummaryParts: string[] = [];
//     if (removingIds.size) pendingSummaryParts.push(`${removingIds.size} envelope${removingIds.size > 1 ? 's' : ''} will be removed`);
//     if (addingIds.size)   pendingSummaryParts.push(`${addingIds.size} envelope${addingIds.size > 1 ? 's' : ''} will be added`);
//     if (groupName !== group.linkName) pendingSummaryParts.push('group name updated');
//
//     const toggleRemove = (id: number) => {
//         setRemovingIds(prev => {
//             const next = new Set(prev);
//             next.has(id) ? next.delete(id) : next.add(id);
//             return next;
//         });
//     };
//
//     const toggleAdd = (id: number) => {
//         setAddingIds(prev => {
//             const next = new Set(prev);
//             next.has(id) ? next.delete(id) : next.add(id);
//             return next;
//         });
//     };
//
//     const handleSave = () => {
//         onSaveGroupEdit?.(
//             group.id,
//             groupName,
//             Array.from(removingIds),
//             Array.from(addingIds),
//         );
//         setRemovingIds(new Set());
//         setAddingIds(new Set());
//         setShowDissolve(false);
//     };
//
//     const handleDiscard = () => {
//         setRemovingIds(new Set());
//         setAddingIds(new Set());
//         setGroupName(group.linkName);
//         setShowDissolve(false);
//     };
//
//     const handleDissolve = () => {
//         onDissolveGroup?.(group.id);
//         setShowDissolve(false);
//     };
//
//     // Envelopes that can be added: individual (non-linked) and not already a member
//     const memberIds = new Set(group.envelopes.map(e => e.id));
//     const addable   = availableEnvelopes.filter(e => !memberIds.has(e.id));
//
//     // ── Render ─────────────────────────────────────────────────────────────────
//     return (
//         <Box sx={{
//             borderRadius: '12px',
//             border: `1px solid ${editMode ? alpha(MAROON, 0.4) : alpha(MAROON, 0.25)}`,
//             borderTop: `3px solid ${MAROON}`,
//             overflow: 'hidden',
//             transition: 'box-shadow 0.2s',
//             mb: editMode ? 0 : undefined,
//             '&:hover': { boxShadow: `0 4px 18px ${alpha(MAROON, 0.12)}` },
//         }}>
//
//             {/* ── Group header ─────────────────────────────────────────────── */}
//             <Box sx={{ p: 2, bgcolor: '#fff' }}>
//                 <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: editMode ? 1 : 1.25 }}>
//                     <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: alpha(MAROON, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                         <Layers size={15} color={MAROON} />
//                     </Box>
//
//                     <Box sx={{ flex: 1, minWidth: 0 }}>
//                         {/* View mode: static name */}
//                         {!editMode && (
//                             <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#111', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                                 {group.linkName}
//                             </Typography>
//                         )}
//
//                         {/* Edit mode: editable name + dissolve link */}
//                         {editMode && (
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                 <TextField
//                                     size="small"
//                                     value={groupName}
//                                     onChange={e => setGroupName(e.target.value)}
//                                     variant="outlined"
//                                     sx={{
//                                         flex: 1,
//                                         '& .MuiInputBase-input': { fontSize: '0.85rem', fontWeight: 700, py: 0.6, px: 1 },
//                                         '& .MuiOutlinedInput-root': { borderRadius: '6px' },
//                                     }}
//                                 />
//                                 <Tooltip title="Dissolve group — all envelopes become individual">
//                                     <Box
//                                         onClick={() => setShowDissolve(p => !p)}
//                                         sx={{
//                                             display: 'flex', alignItems: 'center', gap: 0.4,
//                                             cursor: 'pointer', color: '#dc2626',
//                                             fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
//                                             '&:hover': { textDecoration: 'underline' },
//                                         }}
//                                     >
//                                         <Unlink size={11} />
//                                         Dissolve
//                                     </Box>
//                                 </Tooltip>
//                             </Box>
//                         )}
//
//                         <Typography sx={{ fontSize: '0.63rem', color: '#888', mt: 0.2 }}>
//                             {group.envelopes.length} envelopes · {activeCount} active
//                         </Typography>
//                     </Box>
//
//                     <NotificationToggle
//                         prefs={groupNotificationPrefs}
//                         onToggle={(channel) => onToggleGroupNotification?.(channel)}
//                     />
//
//                     <Chip size="small" label="Linked"
//                           sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(MAROON, 0.1), color: MAROON, flexShrink: 0 }} />
//                 </Box>
//
//                 {/* Dissolve confirmation */}
//                 {showDissolve && (
//                     <Box sx={{ mb: 1.5, p: 1.5, borderRadius: '10px', bgcolor: alpha('#dc2626', 0.05), border: `1px solid ${alpha('#dc2626', 0.25)}` }}>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
//                             <AlertTriangle size={13} color="#dc2626" />
//                             <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: '#dc2626' }}>Dissolve this group?</Typography>
//                         </Box>
//                         <Typography sx={{ fontSize: '0.7rem', color: '#7f1d1d', lineHeight: 1.5, mb: 1 }}>
//                             All {group.envelopes.length} envelopes will become individual. Contribution history and targets are preserved. This cannot be undone.
//                         </Typography>
//                         <Box sx={{ display: 'flex', gap: 0.75 }}>
//                             <Box
//                                 onClick={() => setShowDissolve(false)}
//                                 sx={{ flex: 1, py: 0.6, borderRadius: '6px', border: `1px solid #d5d5d5`, textAlign: 'center', cursor: 'pointer', fontSize: '0.72rem', color: '#555', '&:hover': { bgcolor: '#f5f5f5' } }}
//                             >
//                                 Cancel
//                             </Box>
//                             <Box
//                                 onClick={handleDissolve}
//                                 sx={{ flex: 1, py: 0.6, borderRadius: '6px', bgcolor: '#dc2626', textAlign: 'center', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, color: '#fff', '&:hover': { bgcolor: '#b91c1c' } }}
//                             >
//                                 Yes, dissolve
//                             </Box>
//                         </Box>
//                     </Box>
//                 )}
//
//                 {/* Combined progress */}
//                 {!editMode && (
//                     <Box sx={{ mb: 1.25 }}>
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
//                             <Typography sx={{ fontSize: '0.72rem', color: '#555', fontWeight: 600 }}>{fmt(totalSaved)} combined</Typography>
//                             <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: MAROON }}>{overallPct.toFixed(0)}%</Typography>
//                         </Box>
//                         <LinearProgress variant="determinate" value={overallPct}
//                                         sx={{ height: 6, borderRadius: 3, bgcolor: alpha(MAROON, 0.1), '& .MuiLinearProgress-bar': { bgcolor: MAROON, borderRadius: 3 } }} />
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.4 }}>
//                             <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>Goal: {fmt(totalTarget)}</Typography>
//                             <Typography sx={{ fontSize: '0.62rem', color: MAROON, fontWeight: 700 }}>{fmt(totalRemaining)} to go</Typography>
//                         </Box>
//                     </Box>
//                 )}
//
//                 {/* Summary stats */}
//                 {!editMode && (
//                     <Grid container spacing={0.75} sx={{ mb: 1.25 }}>
//                         {[
//                             { label: 'Shared budget', value: `${fmt(group.sharedBudget)}/mo` },
//                             { label: 'Total spent',   value: fmt(group.totalSpent) },
//                             { label: 'Score',         value: group.score.toFixed(1) },
//                         ].map(({ label, value }) => (
//                             <Grid item xs={4} key={label}>
//                                 <Box sx={{ p: 0.75, borderRadius: '6px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
//                                     <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#bbb', mb: 0.2 }}>{label}</Typography>
//                                     <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: MAROON, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
//                                 </Box>
//                             </Grid>
//                         ))}
//                     </Grid>
//                 )}
//
//                 {/* View mode expand toggle */}
//                 {!editMode && (
//                     <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
//                          onClick={() => setExpanded(p => !p)}>
//                         <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: MAROON }}>
//                             {expanded ? 'Hide envelopes' : `View ${group.envelopes.length} envelopes`}
//                         </Typography>
//                         <IconButton size="small" sx={{ p: 0.25, color: MAROON }}>
//                             {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
//                         </IconButton>
//                     </Box>
//                 )}
//             </Box>
//
//             {/* ── View mode: expanded member cards ─────────────────────────── */}
//             {!editMode && (
//                 <Collapse in={expanded}>
//                     <Divider />
//                     <Box sx={{ bgcolor: '#f9f9f9', p: 1.5 }}>
//                         <Grid container spacing={1.25}>
//                             {group.envelopes.map(env => (
//                                 <Grid item xs={12} sm={6} key={env.id}>
//                                     <MemberCard
//                                         env={env}
//                                         isSelected={env.id === selectedId}
//                                         onClick={() => onSelectEnvelope(env.id)}
//                                         notificationPrefs={getMemberNotificationPrefs?.(env.id) ?? DEFAULT_NOTIF_PREFS}
//                                         onToggleNotification={(channel) => onToggleMemberNotification?.(env.id, channel)}
//                                     />
//                                 </Grid>
//                             ))}
//                         </Grid>
//                     </Box>
//                 </Collapse>
//             )}
//
//             {/* ── Edit mode: member grid with remove controls ───────────────── */}
//             {editMode && (
//                 <>
//                     <Divider />
//                     <Box sx={{ bgcolor: '#f9f9f9', p: 1.5 }}>
//
//                         {/* Existing members */}
//                         <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#bbb', mb: 1 }}>
//                             Current members
//                         </Typography>
//                         <Grid container spacing={1} sx={{ mb: addable.length > 0 ? 1.5 : 0 }}>
//                             {group.envelopes.map(env => (
//                                 <Grid item xs={12} sm={6} key={env.id}>
//                                     <EditMemberCard
//                                         env={env}
//                                         flagged={removingIds.has(env.id)}
//                                         onToggle={() => toggleRemove(env.id)}
//                                     />
//                                 </Grid>
//                             ))}
//
//                             {/* Preview cards for envelopes being added */}
//                             {addable.filter(e => addingIds.has(e.id)).map(env => (
//                                 <Grid item xs={12} sm={6} key={`adding-${env.id}`}>
//                                     <EditMemberCard
//                                         env={env}
//                                         flagged={false}
//                                         isAdding={true}
//                                         onToggle={() => toggleAdd(env.id)}
//                                     />
//                                 </Grid>
//                             ))}
//                         </Grid>
//
//                         {/* Available to add */}
//                         {addable.length > 0 && (
//                             <>
//                                 <Divider sx={{ mb: 1.25 }} />
//                                 <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#bbb', mb: 0.75 }}>
//                                     Add to group
//                                 </Typography>
//                                 {addable.map(env => {
//                                     const c       = ENVELOPE_COLORS[env.envelopeType];
//                                     const isAdded = addingIds.has(env.id);
//                                     return (
//                                         <Box key={env.id} sx={{
//                                             display: 'flex', alignItems: 'center', gap: 1,
//                                             p: 0.9, mb: 0.6, borderRadius: '8px',
//                                             border: `1px solid ${isAdded ? alpha('#16a34a', 0.35) : '#eee'}`,
//                                             bgcolor: isAdded ? alpha('#16a34a', 0.04) : '#fff',
//                                             transition: 'all 0.15s',
//                                         }}>
//                                             <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: c, flexShrink: 0 }} />
//                                             <Box sx={{ flex: 1, minWidth: 0 }}>
//                                                 <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                                                     {env.envelopeName}
//                                                 </Typography>
//                                                 <Typography sx={{ fontSize: '0.6rem', color: '#aaa', fontVariantNumeric: 'tabular-nums' }}>
//                                                     {fmt(env.currentAmount)} / {fmt(env.targetAmount)} · {env.status.toLowerCase()}
//                                                 </Typography>
//                                             </Box>
//                                             <Tooltip title={isAdded ? 'Undo' : 'Add to group'}>
//                                                 <Box
//                                                     onClick={() => toggleAdd(env.id)}
//                                                     sx={{
//                                                         width: 22, height: 22, borderRadius: '5px', flexShrink: 0,
//                                                         border: `1px solid ${isAdded ? alpha('#16a34a', 0.4) : '#ddd'}`,
//                                                         bgcolor: isAdded ? alpha('#16a34a', 0.06) : 'transparent',
//                                                         color: isAdded ? '#16a34a' : '#aaa',
//                                                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                                                         cursor: 'pointer',
//                                                         '&:hover': { borderColor: isAdded ? '#dc2626' : '#16a34a', color: isAdded ? '#dc2626' : '#16a34a', bgcolor: isAdded ? alpha('#dc2626', 0.04) : alpha('#16a34a', 0.06) },
//                                                     }}
//                                                 >
//                                                     {isAdded ? <RotateCcw size={11} /> : <Plus size={11} />}
//                                                 </Box>
//                                             </Tooltip>
//                                         </Box>
//                                     );
//                                 })}
//                             </>
//                         )}
//
//                         {addable.length === 0 && group.envelopes.length > 0 && (
//                             <Typography sx={{ fontSize: '0.65rem', color: '#bbb', fontStyle: 'italic', mt: 0.5 }}>
//                                 No individual envelopes available to add.
//                             </Typography>
//                         )}
//                     </Box>
//
//                     {/* Pending changes banner */}
//                     {hasPendingChanges && (
//                         <Box sx={{ mx: 2, mb: 1.5, p: 1, borderRadius: '8px', bgcolor: alpha(MAROON, 0.05), border: `1px solid ${alpha(MAROON, 0.18)}` }}>
//                             <Typography sx={{ fontSize: '0.68rem', color: '#555' }}>
//                                 ⚠ Pending: {pendingSummaryParts.join(' · ')}
//                             </Typography>
//                         </Box>
//                     )}
//
//                     {/* Save / discard footer */}
//                     <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', px: 2, pb: 1.5 }}>
//                         <Box
//                             onClick={handleDiscard}
//                             sx={{
//                                 px: 2, py: 0.7, borderRadius: '7px', border: `1px solid #d5d5d5`,
//                                 fontSize: '0.75rem', color: '#666', cursor: 'pointer',
//                                 '&:hover': { bgcolor: '#f5f5f5' },
//                             }}
//                         >
//                             Discard
//                         </Box>
//                         <Box
//                             onClick={handleSave}
//                             sx={{
//                                 px: 2, py: 0.7, borderRadius: '7px', bgcolor: MAROON, border: 'none',
//                                 fontSize: '0.75rem', fontWeight: 700, color: '#fff', cursor: 'pointer',
//                                 display: 'flex', alignItems: 'center', gap: 0.5,
//                                 '&:hover': { bgcolor: '#7f1d1d' },
//                                 opacity: hasPendingChanges ? 1 : 0.5,
//                             }}
//                         >
//                             Save changes
//                         </Box>
//                     </Box>
//                 </>
//             )}
//         </Box>
//     );
// };
//
// export default LinkedEnvelopeGroupCard;