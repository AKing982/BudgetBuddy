import React, { useState } from 'react';
import {
    alpha, Box, Chip, Collapse, Divider, IconButton,
    LinearProgress, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import {
    ChevronDown, ChevronUp, Layers, RefreshCcw, PiggyBank,
    XCircle, Wallet, Flame, CheckCircle, TrendingUp, PauseCircle,
    X, RotateCcw, Plus, Unlink, AlertTriangle, ArrowRight,
} from 'lucide-react';
import { LinkedEnvelopeGroup } from '../services/BudgetEnvelopeService';
import { ENVELOPE_COLORS, MAROON, MAROON_DARK } from '../config/Constants';
import { fmt, progressPct, velocityDays, daysUntil, requiredMonthly } from '../config/Helpers';
import { VelocityChip } from './Shared';
import { BudgetEnvelope } from '../config/Types';
import NotificationToggle, { NotificationPrefs } from './NotificationToggle';

/** Fallback used wherever a notification preference hasn't been supplied yet */
const DEFAULT_NOTIF_PREFS: NotificationPrefs = { system: true, email: false };

// ── Shared style tokens — warm maroon-tinted surfaces, not stark white ─────
const SECTION_LABEL_SX = {
    fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.06em', color: '#a35c5c', mb: 0.75,
};
const BORDER = '1px solid #ecd9d9';

interface LinkedEnvelopeGroupCardProps {
    group:            LinkedEnvelopeGroup;
    onSelectEnvelope: (id: number) => void;
    selectedId:       number | null;
    /** Called when the user wants to view aggregated stats for the whole group in the right panel */
    onSelectGroup?:   () => void;
    /** Whether the group itself (not a specific member) is the current right-panel selection */
    isGroupSelected?: boolean;
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
    SAVINGS:   <PiggyBank size={12} />,
    PAYOFF:    <XCircle   size={12} />,
    PURCHASE:  <Wallet    size={12} />,
    EMERGENCY: <Flame     size={12} />,
};

const STATUS_ICON: Record<string, React.ReactNode> = {
    ACTIVE:    <TrendingUp  size={9} />,
    COMPLETED: <CheckCircle size={9} />,
    PAUSED:    <PauseCircle size={9} />,
};

// ── MemberRow (view mode) — compact, flat row for one envelope in the group ────
const MemberRow: React.FC<{
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
    const days = daysUntil(env.targetDate);

    return (
        <Box onClick={onClick} sx={{
            borderRadius: '8px',
            overflow: 'hidden',
            border: `1px solid ${isSelected ? MAROON : alpha(c, 0.35)}`,
            bgcolor: '#fff',
            cursor: 'pointer',
            boxShadow: isSelected ? `0 0 0 1px ${MAROON}` : 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            '&:hover': { borderColor: MAROON },
        }}>
            {/* Colored header strip — envelope type color */}
            <Box sx={{ bgcolor: c, px: 1, py: 0.7, display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <Box sx={{ color: '#fff', display: 'flex', alignItems: 'center' }}>
                    {TYPE_ICONS[env.envelopeType]}
                </Box>
                <Typography sx={{ fontWeight: 500, fontSize: '0.78rem', color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                    {env.envelopeName}
                </Typography>
                {env.contributionMode === 'AUTO' && <RefreshCcw size={9} color="rgba(255,255,255,0.85)" />}
            </Box>

            {/* Body */}
            <Box sx={{ p: 1.1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <Box sx={{ color: env.status === 'ACTIVE' ? '#16a34a' : env.status === 'COMPLETED' ? '#0284c7' : '#d97706' }}>
                            {STATUS_ICON[env.status]}
                        </Box>
                        <Typography sx={{ fontSize: '0.62rem', color: '#999' }}>{env.status.toLowerCase()}</Typography>
                    </Box>
                    <NotificationToggle prefs={notificationPrefs} onToggle={onToggleNotification} onOpenSettings={onOpenNotificationSettings} size={11} />
                </Box>

                <LinearProgress variant="determinate" value={pct}
                                sx={{ height: 4, borderRadius: 2, bgcolor: alpha(c, 0.15), mb: 0.6, '& .MuiLinearProgress-bar': { bgcolor: c, borderRadius: 2 } }} />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(env.currentAmount)} <Box component="span" sx={{ color: '#bbb', fontWeight: 400 }}>/ {fmt(env.targetAmount)}</Box>
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {days !== null && (
                            <Typography sx={{ fontSize: '0.62rem', color: days <= 60 ? '#d97706' : '#999' }}>{days}d left</Typography>
                        )}
                        <VelocityChip days={vel} />
                    </Box>
                </Box>
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
    const stateColor = flagged ? '#dc2626' : isAdding ? '#16a34a' : undefined;

    return (
        <Box sx={{
            borderRadius: '8px',
            border: `1px solid ${flagged ? alpha('#dc2626', 0.3) : isAdding ? alpha('#16a34a', 0.3) : '#ecd9d9'}`,
            bgcolor: flagged ? alpha('#dc2626', 0.03) : isAdding ? alpha('#16a34a', 0.04) : '#fff',
            p: 1.1,
            transition: 'all 0.15s',
            position: 'relative',
        }}>
            <Tooltip title={flagged ? 'Undo removal' : isAdding ? 'Undo add' : 'Remove from group'}>
                <Box
                    onClick={onToggle}
                    sx={{
                        position: 'absolute', top: 8, right: 8,
                        width: 20, height: 20, borderRadius: '5px',
                        border: `1px solid ${flagged || isAdding ? alpha(stateColor!, 0.3) : '#e0e0e0'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        color: flagged || isAdding ? stateColor : '#bbb',
                        '&:hover': { borderColor: flagged ? '#16a34a' : '#dc2626', color: flagged ? '#16a34a' : '#dc2626' },
                    }}
                >
                    {flagged || isAdding ? <RotateCcw size={10} /> : <X size={10} />}
                </Box>
            </Tooltip>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.5, pr: 2.5 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: c, flexShrink: 0 }} />
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {env.envelopeName}
                </Typography>
            </Box>

            <Typography sx={{ fontSize: '0.65rem', color: '#999', fontVariantNumeric: 'tabular-nums', mb: 0.5 }}>
                {fmt(env.currentAmount)} / {fmt(env.targetAmount)}
            </Typography>

            <LinearProgress variant="determinate" value={pct}
                            sx={{ height: 3, borderRadius: 2, bgcolor: alpha(c, 0.12), '& .MuiLinearProgress-bar': { bgcolor: stateColor ?? c, borderRadius: 2 } }} />

            {(flagged || isAdding) && (
                <Typography sx={{ fontSize: '0.6rem', color: stateColor, fontWeight: 500, mt: 0.5 }}>
                    {flagged ? 'Will be removed' : 'Will be added'}
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
                                                                             onSelectGroup,
                                                                             isGroupSelected = false,
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
            borderRadius: '10px',
            border: `1px solid ${isGroupSelected ? MAROON : alpha(MAROON, 0.3)}`,
            bgcolor: '#fff',
            overflow: 'hidden',
            boxShadow: isGroupSelected ? `0 2px 12px ${alpha(MAROON, 0.22)}` : `0 1px 6px ${alpha(MAROON, 0.1)}`,
            transition: 'border-color 0.15s, box-shadow 0.15s',
        }}>

            {/* ── Group header band ────────────────────────────────────────── */}
            <Box sx={{ background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 100%)`, px: 1.75, py: 1.5, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -14, right: -14, width: 60, height: 60, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'relative' }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: '7px', bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Layers size={14} color="#fff" />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {!editMode && (
                            <Typography sx={{ fontWeight: 500, fontSize: '0.85rem', color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {group.linkName}
                            </Typography>
                        )}
                        {editMode && (
                            <TextField
                                size="small"
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                                variant="outlined"
                                sx={{
                                    width: '100%', bgcolor: '#fff', borderRadius: '6px',
                                    '& .MuiInputBase-input': { fontSize: '0.82rem', fontWeight: 500, py: 0.5, px: 1 },
                                    '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                                }}
                            />
                        )}
                        <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.72)', mt: 0.15 }}>
                            {group.envelopes.length} envelopes · {activeCount} active
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
                        {editMode && (
                            <Tooltip title="Dissolve group — all envelopes become individual">
                                <Box
                                    onClick={() => setShowDissolve(p => !p)}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 0.4,
                                        cursor: 'pointer', color: '#fff',
                                        bgcolor: 'rgba(255,255,255,0.16)', px: 0.9, py: 0.4, borderRadius: '6px',
                                        fontSize: '0.66rem', fontWeight: 500,
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.26)' },
                                    }}
                                >
                                    <Unlink size={11} />
                                    Dissolve
                                </Box>
                            </Tooltip>
                        )}
                        {!editMode && (
                            <Box sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff', fontSize: '0.62rem', fontWeight: 500, px: 0.9, py: 0.3, borderRadius: '10px' }}>
                                Linked
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* ── Group body ───────────────────────────────────────────────── */}
            <Box sx={{ p: 1.75, bgcolor: '#fff' }}>

                {!editMode && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                        <NotificationToggle
                            prefs={groupNotificationPrefs}
                            onToggle={(channel) => onToggleGroupNotification?.(channel)}
                            onOpenSettings={(channel) => onOpenGroupNotificationSettings?.(channel)}
                        />
                    </Box>
                )}

                {/* Dissolve confirmation */}
                {showDissolve && (
                    <Box sx={{ mb: 1.5, p: 1.25, borderRadius: '8px', border: `1px solid ${alpha('#dc2626', 0.3)}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                            <AlertTriangle size={13} color="#dc2626" />
                            <Typography sx={{ fontWeight: 500, fontSize: '0.8rem', color: '#dc2626' }}>Dissolve this group?</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.72rem', color: '#a34848', lineHeight: 1.5, mb: 1 }}>
                            All {group.envelopes.length} envelopes will become individual. Contribution history and targets are preserved. This cannot be undone.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.75 }}>
                            <Box
                                onClick={() => setShowDissolve(false)}
                                sx={{ flex: 1, py: 0.6, borderRadius: '6px', border: `1px solid #e0e0e0`, textAlign: 'center', cursor: 'pointer', fontSize: '0.74rem', color: '#666', '&:hover': { bgcolor: '#f5f5f5' } }}
                            >
                                Cancel
                            </Box>
                            <Box
                                onClick={handleDissolve}
                                sx={{ flex: 1, py: 0.6, borderRadius: '6px', bgcolor: '#dc2626', textAlign: 'center', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 500, color: '#fff', '&:hover': { bgcolor: '#b91c1c' } }}
                            >
                                Yes, dissolve
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* Combined progress */}
                {!editMode && (
                    <Box sx={{ mb: 1.25, p: 1.1, borderRadius: '8px', bgcolor: '#fbf1f1', border: `1px solid ${alpha(MAROON, 0.15)}` }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
                            <Typography sx={{ fontSize: '1.1rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalSaved)}</Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: '#888' }}>of {fmt(totalTarget)}</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={overallPct}
                                        sx={{ height: 5, borderRadius: 3, bgcolor: alpha(MAROON, 0.15), '& .MuiLinearProgress-bar': { bgcolor: MAROON, borderRadius: 3 } }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.4 }}>
                            <Typography sx={{ fontSize: '0.66rem', color: MAROON, fontWeight: 500 }}>{overallPct.toFixed(0)}% complete</Typography>
                            <Typography sx={{ fontSize: '0.66rem', color: '#999' }}>{fmt(totalRemaining)} to go</Typography>
                        </Box>
                    </Box>
                )}

                {/* Summary stats */}
                {!editMode && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75, mb: 1.25 }}>
                        {[
                            { label: 'Shared budget', value: `${fmt(group.sharedBudget)}/mo` },
                            { label: 'Total spent',   value: fmt(group.totalSpent) },
                            { label: 'Score',         value: group.score.toFixed(1) },
                        ].map(({ label, value }) => (
                            <Box key={label} sx={{ p: 0.75, borderRadius: '6px', border: BORDER, bgcolor: '#fff' }}>
                                <Typography sx={SECTION_LABEL_SX}>{label}</Typography>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Action row: view group stats + expand toggle */}
                {!editMode && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                        <Box
                            onClick={onSelectGroup}
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.4, cursor: onSelectGroup ? 'pointer' : 'default', color: MAROON, '&:hover': onSelectGroup ? { opacity: 0.75 } : undefined }}
                        >
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 500, color: MAROON }}>
                                {isGroupSelected ? 'Viewing group stats' : 'View group stats'}
                            </Typography>
                            {!isGroupSelected && <ArrowRight size={12} />}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, cursor: 'pointer', color: '#999' }}
                             onClick={() => setExpanded(p => !p)}>
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 500, color: '#999' }}>
                                {expanded ? 'Hide envelopes' : `Show ${group.envelopes.length} envelopes`}
                            </Typography>
                            <IconButton size="small" sx={{ p: 0.15, color: '#999' }}>
                                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </IconButton>
                        </Box>
                    </Box>
                )}
            </Box>

            {/* ── View mode: expanded member rows ──────────────────────────── */}
            {!editMode && (
                <Collapse in={expanded}>
                    <Divider sx={{ borderColor: '#ecd9d9' }} />
                    <Box sx={{ p: 1.5, bgcolor: '#fdf7f7' }}>
                        <Stack spacing={0.75}>
                            {group.envelopes.map(env => (
                                <MemberRow
                                    key={env.id}
                                    env={env}
                                    isSelected={!isGroupSelected && env.id === selectedId}
                                    onClick={() => onSelectEnvelope(env.id)}
                                    notificationPrefs={getMemberNotificationPrefs?.(env.id) ?? DEFAULT_NOTIF_PREFS}
                                    onToggleNotification={(channel) => onToggleMemberNotification?.(env.id, channel)}
                                    onOpenNotificationSettings={(channel) => onOpenMemberNotificationSettings?.(env.id, channel)}
                                />
                            ))}
                        </Stack>
                    </Box>
                </Collapse>
            )}

            {/* ── Edit mode: member grid with remove controls ───────────────── */}
            {editMode && (
                <>
                    <Divider sx={{ borderColor: '#ecd9d9' }} />
                    <Box sx={{ p: 1.5, bgcolor: '#fdf7f7' }}>

                        {/* Existing members */}
                        <Typography sx={SECTION_LABEL_SX}>Current members</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: addable.length > 0 ? 1.5 : 0 }}>
                            {group.envelopes.map(env => (
                                <EditMemberCard
                                    key={env.id}
                                    env={env}
                                    flagged={removingIds.has(env.id)}
                                    onToggle={() => toggleRemove(env.id)}
                                />
                            ))}

                            {/* Preview cards for envelopes being added */}
                            {addable.filter(e => addingIds.has(e.id)).map(env => (
                                <EditMemberCard
                                    key={`adding-${env.id}`}
                                    env={env}
                                    flagged={false}
                                    isAdding={true}
                                    onToggle={() => toggleAdd(env.id)}
                                />
                            ))}
                        </Box>

                        {/* Available to add */}
                        {addable.length > 0 && (
                            <>
                                <Divider sx={{ mb: 1.25, borderColor: '#ecd9d9' }} />
                                <Typography sx={SECTION_LABEL_SX}>Add to group</Typography>
                                <Stack spacing={0.6}>
                                    {addable.map(env => {
                                        const c       = ENVELOPE_COLORS[env.envelopeType];
                                        const isAdded = addingIds.has(env.id);
                                        return (
                                            <Box key={env.id} sx={{
                                                display: 'flex', alignItems: 'center', gap: 1,
                                                p: 0.9, borderRadius: '8px',
                                                border: `1px solid ${isAdded ? alpha('#16a34a', 0.3) : '#ecd9d9'}`,
                                                bgcolor: isAdded ? alpha('#16a34a', 0.04) : '#fff',
                                                transition: 'all 0.15s',
                                            }}>
                                                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: c, flexShrink: 0 }} />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {env.envelopeName}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.62rem', color: '#999', fontVariantNumeric: 'tabular-nums' }}>
                                                        {fmt(env.currentAmount)} / {fmt(env.targetAmount)} · {env.status.toLowerCase()}
                                                    </Typography>
                                                </Box>
                                                <Tooltip title={isAdded ? 'Undo' : 'Add to group'}>
                                                    <Box
                                                        onClick={() => toggleAdd(env.id)}
                                                        sx={{
                                                            width: 22, height: 22, borderRadius: '5px', flexShrink: 0,
                                                            border: `1px solid ${isAdded ? alpha('#16a34a', 0.35) : '#e0e0e0'}`,
                                                            color: isAdded ? '#16a34a' : '#bbb',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            '&:hover': { borderColor: isAdded ? '#dc2626' : '#16a34a', color: isAdded ? '#dc2626' : '#16a34a' },
                                                        }}
                                                    >
                                                        {isAdded ? <RotateCcw size={11} /> : <Plus size={11} />}
                                                    </Box>
                                                </Tooltip>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </>
                        )}

                        {addable.length === 0 && group.envelopes.length > 0 && (
                            <Typography sx={{ fontSize: '0.68rem', color: '#bbb', fontStyle: 'italic', mt: 0.5 }}>
                                No individual envelopes available to add.
                            </Typography>
                        )}
                    </Box>

                    {/* Pending changes banner */}
                    {hasPendingChanges && (
                        <Box sx={{ mx: 1.5, mb: 1.5, p: 1, borderRadius: '8px', border: `1px solid ${alpha(MAROON, 0.25)}` }}>
                            <Typography sx={{ fontSize: '0.7rem', color: MAROON }}>
                                Pending: {pendingSummaryParts.join(' · ')}
                            </Typography>
                        </Box>
                    )}

                    {/* Save / discard footer */}
                    <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'flex-end', px: 1.5, pb: 1.5 }}>
                        <Box
                            onClick={handleDiscard}
                            sx={{
                                px: 1.5, py: 0.6, borderRadius: '7px', border: `1px solid #e0e0e0`,
                                fontSize: '0.75rem', color: '#666', cursor: 'pointer',
                                '&:hover': { bgcolor: '#f5f5f5' },
                            }}
                        >
                            Discard
                        </Box>
                        <Box
                            onClick={handleSave}
                            sx={{
                                px: 1.5, py: 0.6, borderRadius: '7px', bgcolor: MAROON, border: 'none',
                                fontSize: '0.75rem', fontWeight: 500, color: '#fff', cursor: 'pointer',
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