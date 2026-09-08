import React, { useState } from 'react';
import {
    alpha, Box, Divider, IconButton, ListItemIcon, ListItemText,
    LinearProgress, Menu, MenuItem, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import {
    Layers, RefreshCcw, X, RotateCcw, Plus, Unlink, AlertTriangle,
    ArrowRight, MoreHorizontal, Check, Circle, Settings2, Target,
    Wallet, CreditCard, ShieldCheck, PiggyBank, LayoutGrid, GitBranch,
} from 'lucide-react';
import { LinkedEnvelopeGroup } from '../services/BudgetEnvelopeService';
import { ENVELOPE_COLORS, MAROON, MAROON_DARK } from '../config/Constants';
import { fmt, progressPct, daysUntil } from '../config/Helpers';
import { BudgetEnvelope } from '../config/Types';
import NotificationToggle, { NotificationPrefs } from './NotificationToggle';

/** Fallback used wherever a notification preference hasn't been supplied yet */
const DEFAULT_NOTIF_PREFS: NotificationPrefs = { system: true, email: false };

/** Falls back to the same neutral maroon used elsewhere whenever ENVELOPE_COLORS is missing an
 * entry for a given type (e.g. a newly-added type like FUND before the constant catches up) —
 * without this, alpha(undefined) crashes the card, same failure mode fixed earlier in
 * EnvelopeDetailPanel/EnvelopeLeftPanel. */
const colorFor = (type: string) => ENVELOPE_COLORS[type as keyof typeof ENVELOPE_COLORS] ?? '#6b1a1a';

/**
 * Local icon-per-type map, kept here rather than imported from Constants because that file's
 * TYPE_ICONS stores mixed/rendered values (not plain component references), which doesn't
 * type-check as React.ElementType. Falls back to a generic target icon for any type not
 * listed here — same defensive pattern as colorFor above.
 */
const TYPE_ICON_MAP: Record<string, React.ElementType> = {
    SAVINGS:   Wallet,
    PAYOFF:    CreditCard,
    PURCHASE:  Target,
    EMERGENCY: ShieldCheck,
    FUND:      PiggyBank,
};
const iconFor = (type: string): React.ElementType => TYPE_ICON_MAP[type] ?? Target;

/** Short "Oct 12" style date, used by the funding-order view where an exact date reads more
 * plainly than a days-remaining count. */
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const SECTION_LABEL_SX = {
    fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.06em', color: '#a35c5c', mb: 0.75,
};

interface LinkedEnvelopeGroupCardProps {
    group:            LinkedEnvelopeGroup;
    onSelectEnvelope: (id: number) => void;
    selectedId:       number | null;
    onSelectGroup?:   () => void;
    isGroupSelected?: boolean;
    editMode?:        boolean;
    onSaveGroupEdit?: (groupId: number, newName: string, removedIds: number[], addedIds: number[]) => void;
    onDissolveGroup?: (groupId: number) => void;
    availableEnvelopes?: BudgetEnvelope[];
    groupNotificationPrefs?:      NotificationPrefs;
    onToggleGroupNotification?:   (channel: 'system' | 'email') => void;
    getMemberNotificationPrefs?:  (envelopeId: number) => NotificationPrefs;
    onToggleMemberNotification?:  (envelopeId: number, channel: 'system' | 'email') => void;
    onOpenGroupNotificationSettings?:  (channel: 'system' | 'email') => void;
    onOpenMemberNotificationSettings?: (envelopeId: number, channel: 'system' | 'email') => void;
    onOpenGoalUpdate?: () => void;
}

/** A circular ring showing overall percent complete — replaces the old linear "combined
 * progress" box as the card's visual anchor. */
const ProgressRing: React.FC<{ pct: number; size?: number }> = ({ pct, size = 56 }) => {
    const stroke = 6;
    const r = (size - stroke) / 2;
    const circumference = 2 * Math.PI * r;
    const filled = Math.min(Math.max(pct, 0), 100) / 100 * circumference;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0dede" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={MAROON} strokeWidth={stroke}
                    strokeDasharray={`${filled} ${circumference}`} strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`} />
            <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize="12" fontWeight={500} fill="#1a1a1a">
                {pct.toFixed(0)}%
            </text>
        </svg>
    );
};

/** One member envelope as a small card in the 2-column grid — replaces the previous
 * full-width MemberRow. */
const MiniMemberCard: React.FC<{
    env:                  BudgetEnvelope;
    isSelected:           boolean;
    onClick:              () => void;
    notificationPrefs:    NotificationPrefs;
    onToggleNotification: (channel: 'system' | 'email') => void;
    onOpenNotificationSettings?: (channel: 'system' | 'email') => void;
    /** Shows "Due Oct 12" instead of "12d" — used by the funding-order view, where a plain
     * date reads more naturally next to "funded first/next" language than a countdown. */
    showExactDate?: boolean;
}> = ({ env, isSelected, onClick, notificationPrefs, onToggleNotification, onOpenNotificationSettings, showExactDate = false }) => {
    const c    = colorFor(env.envelopeType);
    const Icon = iconFor(env.envelopeType);
    const pct  = progressPct(env.currentAmount, env.targetAmount);
    const days = daysUntil(env.targetDate);
    const deadlineColor = days === null ? '#999' : days <= 60 ? '#d97706' : '#16a34a';

    return (
        <Box onClick={onClick} sx={{
            borderRadius: '10px',
            border: `1px solid ${isSelected ? MAROON : '#ecd9d9'}`,
            bgcolor: isSelected ? alpha(MAROON, 0.03) : '#fff',
            cursor: 'pointer',
            boxShadow: isSelected ? `0 0 0 1px ${MAROON}` : 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            p: 1,
            '&:hover': { borderColor: MAROON },
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.75 }}>
                <Icon size={13} color={c} />
                <Typography sx={{ fontSize: '0.74rem', fontWeight: 500, color: '#111', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {env.envelopeName}
                </Typography>
                {env.contributionMode === 'AUTO' && <RefreshCcw size={9} color="#0284c7" />}
            </Box>

            <LinearProgress variant="determinate" value={pct}
                            sx={{ height: 4, borderRadius: 2, bgcolor: alpha(c, 0.15), mb: 0.6, '& .MuiLinearProgress-bar': { bgcolor: c, borderRadius: 2 } }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
                <Typography sx={{ fontSize: '0.62rem', color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fmt(env.currentAmount)} / {fmt(env.targetAmount)}
                </Typography>
                {days !== null && (
                    <Box component="span" sx={{ fontSize: '0.6rem', fontWeight: 500, color: deadlineColor, bgcolor: alpha(deadlineColor, 0.1), px: 0.6, borderRadius: '99px', flexShrink: 0 }}>
                        {showExactDate ? `Due ${fmtDate(env.targetDate!)}` : `${days}d`}
                    </Box>
                )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.4 }} onClick={e => e.stopPropagation()}>
                <NotificationToggle prefs={notificationPrefs} onToggle={onToggleNotification} onOpenSettings={onOpenNotificationSettings} size={10} />
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
    const c   = colorFor(env.envelopeType);
    const pct = progressPct(env.currentAmount, env.targetAmount);
    const stateColor = flagged ? '#dc2626' : isAdding ? '#16a34a' : undefined;

    return (
        <Box sx={{
            borderRadius: '10px',
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
    const [removingIds,   setRemovingIds]   = useState<Set<number>>(new Set());
    const [addingIds,     setAddingIds]     = useState<Set<number>>(new Set());
    const [groupName,     setGroupName]     = useState(group.linkName);
    const [showDissolve,  setShowDissolve]  = useState(false);
    /** Grid (ring + mini-card grid) vs funding order (shared budget flowing into envelopes
     * in priority order) — two different questions about the same group, so a toggle rather
     * than picking one permanently. */
    const [viewMode, setViewMode] = useState<'grid' | 'funding'>('grid');

    // Secondary actions (notification toggles/settings) live behind this kebab instead of
    // sitting permanently on the card — same pattern used in EnvelopeDetailPanel.
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const closeMenu = () => setMenuAnchor(null);

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
    const overallPct     = progressPct(totalSaved, totalTarget);
    const activeCount    = group.envelopes.filter(e => e.status === 'ACTIVE').length;

    const nearestDays = group.envelopes
        .map(e => daysUntil(e.targetDate))
        .filter((d): d is number => d !== null)
        .sort((a, b) => a - b)[0] ?? null;

    /** Priority order for the funding-order view — lower priority number funds first, same
     * convention used for the "By priority" quick-overview list on the panel with nothing selected. */
    const fundingOrder = [...group.envelopes].sort((a, b) => a.priority - b.priority);

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
            border: `1px solid ${isGroupSelected ? MAROON : '#ecd9d9'}`,
            bgcolor: '#fff',
            overflow: 'hidden',
            boxShadow: isGroupSelected ? `0 2px 12px ${alpha(MAROON, 0.18)}` : 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
        }}>

            {editMode ? (
                /* ── Edit-mode header — unchanged: name field + dissolve toggle ──────── */
                <Box sx={{ background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 100%)`, px: 1.75, py: 1.5, position: 'relative', overflow: 'hidden' }}>
                    <Box sx={{ position: 'absolute', top: -14, right: -14, width: 60, height: 60, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'relative' }}>
                        <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Layers size={14} color="#fff" />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
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
                            <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.72)', mt: 0.15 }}>
                                {group.envelopes.length} envelopes · {activeCount} active
                            </Typography>
                        </Box>
                        <Tooltip title="Dissolve group — all envelopes become individual">
                            <Box
                                onClick={() => setShowDissolve(p => !p)}
                                sx={{
                                    display: 'flex', alignItems: 'center', gap: 0.4, flexShrink: 0,
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
                    </Box>
                </Box>
            ) : (
                /* ── View-mode header — flat, single line, kebab replaces the old
                    always-visible notification toggle ─────────────────────────────── */
                <Box sx={{ px: 1.75, py: 1.25, borderBottom: '1px solid #ecd9d9', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: alpha(MAROON, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Layers size={14} color={MAROON} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 500, fontSize: '0.83rem', color: '#111', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {group.linkName}
                        </Typography>
                        <Typography sx={{ fontSize: '0.66rem', color: '#999', mt: 0.1 }}>
                            {group.envelopes.length} envelopes · {activeCount} active
                        </Typography>
                    </Box>
                    <IconButton size="small" aria-label="Group actions" onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ color: '#a35c5c', flexShrink: 0 }}>
                        <MoreHorizontal size={16} />
                    </IconButton>
                    <Menu
                        anchorEl={menuAnchor}
                        open={Boolean(menuAnchor)}
                        onClose={closeMenu}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        PaperProps={{ sx: { borderRadius: '10px', border: '1px solid #ecd9d9', boxShadow: '0 8px 24px rgba(122,31,43,0.18)', minWidth: 210, mt: 0.5 } }}
                    >
                        <MenuItem onClick={(e) => { e.stopPropagation(); onToggleGroupNotification?.('system'); }}>
                            <ListItemIcon sx={{ minWidth: 30 }}>
                                {groupNotificationPrefs.system ? <Check size={15} color={MAROON} /> : <Circle size={13} color="#ccc" />}
                            </ListItemIcon>
                            <ListItemText primaryTypographyProps={{ fontSize: '0.8rem' }}>System notifications</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={(e) => { e.stopPropagation(); onToggleGroupNotification?.('email'); }}>
                            <ListItemIcon sx={{ minWidth: 30 }}>
                                {groupNotificationPrefs.email ? <Check size={15} color={MAROON} /> : <Circle size={13} color="#ccc" />}
                            </ListItemIcon>
                            <ListItemText primaryTypographyProps={{ fontSize: '0.8rem' }}>Email notifications</ListItemText>
                        </MenuItem>
                        <Divider sx={{ my: 0.5 }} />
                        <MenuItem onClick={() => { closeMenu(); onOpenGroupNotificationSettings?.('system'); }}>
                            <ListItemIcon sx={{ minWidth: 30 }}><Settings2 size={15} color="#a35c5c" /></ListItemIcon>
                            <ListItemText primaryTypographyProps={{ fontSize: '0.8rem' }}>Notification settings</ListItemText>
                        </MenuItem>
                    </Menu>
                </Box>
            )}

            {/* ── Grid / funding-order toggle — visible on the card itself, not hidden in a
                menu, since it changes what the whole card shows below ────────────────── */}
            {!editMode && (
                <Box sx={{ px: 1.75, py: 1.25, borderBottom: '1px solid #ecd9d9' }}>
                    <Box sx={{ display: 'flex', gap: 0.5, p: '3px', borderRadius: '8px', bgcolor: '#f5e5e5' }}>
                        {([
                            { key: 'grid' as const, label: 'Grid', icon: LayoutGrid },
                            { key: 'funding' as const, label: 'Funding order', icon: GitBranch },
                        ]).map(({ key, label, icon: Icon }) => (
                            <Box key={key} onClick={() => setViewMode(key)}
                                 sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, py: 0.5, borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 500,
                                     ...(viewMode === key
                                         ? { bgcolor: '#fff', color: MAROON, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }
                                         : { color: '#a35c5c' }) }}>
                                <Icon size={13} />
                                {label}
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {/* ── Group body ───────────────────────────────────────────────── */}
            <Box sx={{ p: 1.75, bgcolor: '#fff' }}>

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

                {/* ── Ring + budget tiles, or the funding-order flow — two different
                    questions about the same group, switched from the kebab menu ────── */}
                {!editMode && viewMode === 'grid' && (
                    <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                            <ProgressRing pct={overallPct} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontSize: '0.95rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalSaved)}</Typography>
                                <Typography sx={{ fontSize: '0.7rem', color: '#999' }}>of {fmt(totalTarget)} combined</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 1.5 }}>
                            <Box sx={{ bgcolor: '#fbf1f1', borderRadius: '8px', p: 1 }}>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#111' }}>{fmt(group.sharedBudget)}/mo</Typography>
                                <Typography sx={{ fontSize: '0.6rem', color: '#999', mt: 0.1 }}>Shared budget</Typography>
                            </Box>
                            <Box sx={{ bgcolor: '#fbf1f1', borderRadius: '8px', p: 1 }}>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#111' }}>{fmt(group.totalSpent)}</Typography>
                                <Typography sx={{ fontSize: '0.6rem', color: '#999', mt: 0.1 }}>Spent</Typography>
                            </Box>
                            <Box sx={{ bgcolor: '#fbf1f1', borderRadius: '8px', p: 1 }}>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#111' }}>{nearestDays !== null ? `${nearestDays}d` : '—'}</Typography>
                                <Typography sx={{ fontSize: '0.6rem', color: '#999', mt: 0.1 }}>Nearest target</Typography>
                            </Box>
                        </Box>

                        {/* ── Members grid — always visible; the ring/tiles above make the
                            card compact enough that a collapse toggle isn't needed ──────── */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 1.25 }}>
                            {group.envelopes.map(env => (
                                <MiniMemberCard
                                    key={env.id}
                                    env={env}
                                    isSelected={!isGroupSelected && env.id === selectedId}
                                    onClick={() => onSelectEnvelope(env.id)}
                                    notificationPrefs={getMemberNotificationPrefs?.(env.id) ?? DEFAULT_NOTIF_PREFS}
                                    onToggleNotification={(channel) => onToggleMemberNotification?.(env.id, channel)}
                                    onOpenNotificationSettings={(channel) => onOpenMemberNotificationSettings?.(env.id, channel)}
                                />
                            ))}
                        </Box>
                    </>
                )}

                {!editMode && viewMode === 'funding' && (
                    <Box sx={{ mb: 1.25 }}>
                        {/* Shared budget pill — the single source the flow starts from */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#fbf1f1', border: '1px solid #ecd9d9', borderRadius: '999px', px: 2, py: 0.65 }}>
                                <Wallet size={14} color={MAROON} />
                                <Typography sx={{ fontSize: '0.76rem', fontWeight: 500, color: '#1a1a1a' }}>{fmt(group.sharedBudget)}/mo shared budget</Typography>
                            </Box>
                        </Box>

                        {/* Stem from the pill down to the fork (or straight down for a single member) */}
                        <Box sx={{ width: '2px', height: 14, bgcolor: '#d9b8ba', mx: 'auto' }} />

                        {fundingOrder.length > 1 ? (
                            <Box sx={{ display: 'flex' }}>
                                {fundingOrder.map((env, i) => (
                                    <Box key={env.id} sx={{
                                        flex: 1, position: 'relative', height: 20,
                                        '&::before': {
                                            content: '""', position: 'absolute', top: 0,
                                            left: i === 0 ? '50%' : 0,
                                            right: i === fundingOrder.length - 1 ? '50%' : 0,
                                            borderTop: '2px solid #d9b8ba',
                                        },
                                        '&::after': {
                                            content: '""', position: 'absolute', top: 0, left: '50%',
                                            width: '2px', height: 20, bgcolor: '#d9b8ba', transform: 'translateX(-50%)',
                                        },
                                    }} />
                                ))}
                            </Box>
                        ) : (
                            <Box sx={{ width: '2px', height: 20, bgcolor: '#d9b8ba', mx: 'auto' }} />
                        )}

                        {/* Numbered badges + plain-language funding order labels */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {fundingOrder.map((env, i) => (
                                <Box key={env.id} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', mt: -1.5 }}>
                                    <Box sx={{
                                        width: 20, height: 20, borderRadius: '50%', color: '#fff',
                                        bgcolor: i === 0 ? MAROON : '#a35c5c',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.65rem', fontWeight: 600, mb: 0.5, flexShrink: 0,
                                    }}>
                                        {i + 1}
                                    </Box>
                                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 500, color: i === 0 ? MAROON : '#a35c5c', textAlign: 'center' }}>
                                        {i === 0 ? 'Funded first' : i === fundingOrder.length - 1 ? 'Funded last' : 'Funded next'}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        {/* Cards in priority order, with an exact due date rather than a countdown */}
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.75 }}>
                            {fundingOrder.map(env => (
                                <Box key={env.id} sx={{ flex: 1, minWidth: 0 }}>
                                    <MiniMemberCard
                                        env={env}
                                        isSelected={!isGroupSelected && env.id === selectedId}
                                        onClick={() => onSelectEnvelope(env.id)}
                                        notificationPrefs={getMemberNotificationPrefs?.(env.id) ?? DEFAULT_NOTIF_PREFS}
                                        onToggleNotification={(channel) => onToggleMemberNotification?.(env.id, channel)}
                                        onOpenNotificationSettings={(channel) => onOpenMemberNotificationSettings?.(env.id, channel)}
                                        showExactDate
                                    />
                                </Box>
                            ))}
                        </Box>

                        {/* Plain-language consequence — the thing people actually want to know */}
                        {fundingOrder.length > 1 && (
                            <Typography sx={{ fontSize: '0.68rem', color: '#bbb', textAlign: 'center', mt: 1.25 }}>
                                If money runs short this month, {fundingOrder[0].envelopeName} gets funded before {fundingOrder[fundingOrder.length - 1].envelopeName}.
                            </Typography>
                        )}
                    </Box>
                )}

                {!editMode && (
                    <Box
                        onClick={onSelectGroup}
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.4, cursor: onSelectGroup ? 'pointer' : 'default', color: MAROON, '&:hover': onSelectGroup ? { opacity: 0.75 } : undefined }}
                    >
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: MAROON }}>
                            {isGroupSelected ? 'Viewing group stats' : 'View group stats'}
                        </Typography>
                        {!isGroupSelected && <ArrowRight size={12} />}
                    </Box>
                )}
            </Box>

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
                                        const c       = colorFor(env.envelopeType);
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
// import React, { useState } from 'react';
// import {
//     alpha, Box, Divider, IconButton, ListItemIcon, ListItemText,
//     LinearProgress, Menu, MenuItem, Stack, TextField, Tooltip, Typography,
// } from '@mui/material';
// import {
//     Layers, RefreshCcw, X, RotateCcw, Plus, Unlink, AlertTriangle,
//     ArrowRight, MoreHorizontal, Check, Circle, Settings2, Target,
//     Wallet, CreditCard, ShieldCheck, PiggyBank,
// } from 'lucide-react';
// import { LinkedEnvelopeGroup } from '../services/BudgetEnvelopeService';
// import { ENVELOPE_COLORS, MAROON, MAROON_DARK } from '../config/Constants';
// import { fmt, progressPct, daysUntil } from '../config/Helpers';
// import { BudgetEnvelope } from '../config/Types';
// import NotificationToggle, { NotificationPrefs } from './NotificationToggle';
//
// /** Fallback used wherever a notification preference hasn't been supplied yet */
// const DEFAULT_NOTIF_PREFS: NotificationPrefs = { system: true, email: false };
//
// /** Falls back to the same neutral maroon used elsewhere whenever ENVELOPE_COLORS is missing an
//  * entry for a given type (e.g. a newly-added type like FUND before the constant catches up) —
//  * without this, alpha(undefined) crashes the card, same failure mode fixed earlier in
//  * EnvelopeDetailPanel/EnvelopeLeftPanel. */
// const colorFor = (type: string) => ENVELOPE_COLORS[type as keyof typeof ENVELOPE_COLORS] ?? '#6b1a1a';
//
// /**
//  * Local icon-per-type map, kept here rather than imported from Constants because that file's
//  * TYPE_ICONS stores mixed/rendered values (not plain component references), which doesn't
//  * type-check as React.ElementType. Falls back to a generic target icon for any type not
//  * listed here — same defensive pattern as colorFor above.
//  */
// const TYPE_ICON_MAP: Record<string, React.ElementType> = {
//     SAVINGS:   Wallet,
//     PAYOFF:    CreditCard,
//     PURCHASE:  Target,
//     EMERGENCY: ShieldCheck,
//     FUND:      PiggyBank,
// };
// const iconFor = (type: string): React.ElementType => TYPE_ICON_MAP[type] ?? Target;
//
// const SECTION_LABEL_SX = {
//     fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' as const,
//     letterSpacing: '0.06em', color: '#a35c5c', mb: 0.75,
// };
//
// interface LinkedEnvelopeGroupCardProps {
//     group:            LinkedEnvelopeGroup;
//     onSelectEnvelope: (id: number) => void;
//     selectedId:       number | null;
//     onSelectGroup?:   () => void;
//     isGroupSelected?: boolean;
//     editMode?:        boolean;
//     onSaveGroupEdit?: (groupId: number, newName: string, removedIds: number[], addedIds: number[]) => void;
//     onDissolveGroup?: (groupId: number) => void;
//     availableEnvelopes?: BudgetEnvelope[];
//     groupNotificationPrefs?:      NotificationPrefs;
//     onToggleGroupNotification?:   (channel: 'system' | 'email') => void;
//     getMemberNotificationPrefs?:  (envelopeId: number) => NotificationPrefs;
//     onToggleMemberNotification?:  (envelopeId: number, channel: 'system' | 'email') => void;
//     onOpenGroupNotificationSettings?:  (channel: 'system' | 'email') => void;
//     onOpenMemberNotificationSettings?: (envelopeId: number, channel: 'system' | 'email') => void;
//     onOpenGoalUpdate?: () => void;
// }
//
// /** A circular ring showing overall percent complete — replaces the old linear "combined
//  * progress" box as the card's visual anchor. */
// const ProgressRing: React.FC<{ pct: number; size?: number }> = ({ pct, size = 56 }) => {
//     const stroke = 6;
//     const r = (size - stroke) / 2;
//     const circumference = 2 * Math.PI * r;
//     const filled = Math.min(Math.max(pct, 0), 100) / 100 * circumference;
//
//     return (
//         <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
//             <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0dede" strokeWidth={stroke} />
//             <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={MAROON} strokeWidth={stroke}
//                     strokeDasharray={`${filled} ${circumference}`} strokeLinecap="round"
//                     transform={`rotate(-90 ${size / 2} ${size / 2})`} />
//             <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize="12" fontWeight={500} fill="#1a1a1a">
//                 {pct.toFixed(0)}%
//             </text>
//         </svg>
//     );
// };
//
// /** One member envelope as a small card in the 2-column grid — replaces the previous
//  * full-width MemberRow. */
// const MiniMemberCard: React.FC<{
//     env:                  BudgetEnvelope;
//     isSelected:           boolean;
//     onClick:              () => void;
//     notificationPrefs:    NotificationPrefs;
//     onToggleNotification: (channel: 'system' | 'email') => void;
//     onOpenNotificationSettings?: (channel: 'system' | 'email') => void;
// }> = ({ env, isSelected, onClick, notificationPrefs, onToggleNotification, onOpenNotificationSettings }) => {
//     const c    = colorFor(env.envelopeType);
//     const Icon = iconFor(env.envelopeType);
//     const pct  = progressPct(env.currentAmount, env.targetAmount);
//     const days = daysUntil(env.targetDate);
//     const deadlineColor = days === null ? '#999' : days <= 60 ? '#d97706' : '#16a34a';
//
//     return (
//         <Box onClick={onClick} sx={{
//             borderRadius: '10px',
//             border: `1px solid ${isSelected ? MAROON : '#ecd9d9'}`,
//             bgcolor: isSelected ? alpha(MAROON, 0.03) : '#fff',
//             cursor: 'pointer',
//             boxShadow: isSelected ? `0 0 0 1px ${MAROON}` : 'none',
//             transition: 'border-color 0.15s, box-shadow 0.15s',
//             p: 1,
//             '&:hover': { borderColor: MAROON },
//         }}>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.75 }}>
//                 <Icon size={13} color={c} />
//                 <Typography sx={{ fontSize: '0.74rem', fontWeight: 500, color: '#111', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                     {env.envelopeName}
//                 </Typography>
//                 {env.contributionMode === 'AUTO' && <RefreshCcw size={9} color="#0284c7" />}
//             </Box>
//
//             <LinearProgress variant="determinate" value={pct}
//                             sx={{ height: 4, borderRadius: 2, bgcolor: alpha(c, 0.15), mb: 0.6, '& .MuiLinearProgress-bar': { bgcolor: c, borderRadius: 2 } }} />
//
//             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
//                 <Typography sx={{ fontSize: '0.62rem', color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                     {fmt(env.currentAmount)} / {fmt(env.targetAmount)}
//                 </Typography>
//                 {days !== null && (
//                     <Box component="span" sx={{ fontSize: '0.6rem', fontWeight: 500, color: deadlineColor, bgcolor: alpha(deadlineColor, 0.1), px: 0.6, borderRadius: '99px', flexShrink: 0 }}>
//                         {days}d
//                     </Box>
//                 )}
//             </Box>
//
//             <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.4 }} onClick={e => e.stopPropagation()}>
//                 <NotificationToggle prefs={notificationPrefs} onToggle={onToggleNotification} onOpenSettings={onOpenNotificationSettings} size={10} />
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
//     const c   = colorFor(env.envelopeType);
//     const pct = progressPct(env.currentAmount, env.targetAmount);
//     const stateColor = flagged ? '#dc2626' : isAdding ? '#16a34a' : undefined;
//
//     return (
//         <Box sx={{
//             borderRadius: '10px',
//             border: `1px solid ${flagged ? alpha('#dc2626', 0.3) : isAdding ? alpha('#16a34a', 0.3) : '#ecd9d9'}`,
//             bgcolor: flagged ? alpha('#dc2626', 0.03) : isAdding ? alpha('#16a34a', 0.04) : '#fff',
//             p: 1.1,
//             transition: 'all 0.15s',
//             position: 'relative',
//         }}>
//             <Tooltip title={flagged ? 'Undo removal' : isAdding ? 'Undo add' : 'Remove from group'}>
//                 <Box
//                     onClick={onToggle}
//                     sx={{
//                         position: 'absolute', top: 8, right: 8,
//                         width: 20, height: 20, borderRadius: '5px',
//                         border: `1px solid ${flagged || isAdding ? alpha(stateColor!, 0.3) : '#e0e0e0'}`,
//                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                         cursor: 'pointer',
//                         color: flagged || isAdding ? stateColor : '#bbb',
//                         '&:hover': { borderColor: flagged ? '#16a34a' : '#dc2626', color: flagged ? '#16a34a' : '#dc2626' },
//                     }}
//                 >
//                     {flagged || isAdding ? <RotateCcw size={10} /> : <X size={10} />}
//                 </Box>
//             </Tooltip>
//
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.5, pr: 2.5 }}>
//                 <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: c, flexShrink: 0 }} />
//                 <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                     {env.envelopeName}
//                 </Typography>
//             </Box>
//
//             <Typography sx={{ fontSize: '0.65rem', color: '#999', fontVariantNumeric: 'tabular-nums', mb: 0.5 }}>
//                 {fmt(env.currentAmount)} / {fmt(env.targetAmount)}
//             </Typography>
//
//             <LinearProgress variant="determinate" value={pct}
//                             sx={{ height: 3, borderRadius: 2, bgcolor: alpha(c, 0.12), '& .MuiLinearProgress-bar': { bgcolor: stateColor ?? c, borderRadius: 2 } }} />
//
//             {(flagged || isAdding) && (
//                 <Typography sx={{ fontSize: '0.6rem', color: stateColor, fontWeight: 500, mt: 0.5 }}>
//                     {flagged ? 'Will be removed' : 'Will be added'}
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
//                                                                              onSelectGroup,
//                                                                              isGroupSelected = false,
//                                                                              editMode = false,
//                                                                              onSaveGroupEdit,
//                                                                              onDissolveGroup,
//                                                                              availableEnvelopes = [],
//                                                                              groupNotificationPrefs = DEFAULT_NOTIF_PREFS,
//                                                                              onToggleGroupNotification,
//                                                                              getMemberNotificationPrefs,
//                                                                              onToggleMemberNotification,
//                                                                              onOpenGroupNotificationSettings,
//                                                                              onOpenMemberNotificationSettings,
//                                                                          }) => {
//     const [removingIds,   setRemovingIds]   = useState<Set<number>>(new Set());
//     const [addingIds,     setAddingIds]     = useState<Set<number>>(new Set());
//     const [groupName,     setGroupName]     = useState(group.linkName);
//     const [showDissolve,  setShowDissolve]  = useState(false);
//
//     // Secondary actions (notification toggles/settings) live behind this kebab instead of
//     // sitting permanently on the card — same pattern used in EnvelopeDetailPanel.
//     const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
//     const closeMenu = () => setMenuAnchor(null);
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
//     const overallPct     = progressPct(totalSaved, totalTarget);
//     const activeCount    = group.envelopes.filter(e => e.status === 'ACTIVE').length;
//
//     const nearestDays = group.envelopes
//         .map(e => daysUntil(e.targetDate))
//         .filter((d): d is number => d !== null)
//         .sort((a, b) => a - b)[0] ?? null;
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
//             border: `1px solid ${isGroupSelected ? MAROON : '#ecd9d9'}`,
//             bgcolor: '#fff',
//             overflow: 'hidden',
//             boxShadow: isGroupSelected ? `0 2px 12px ${alpha(MAROON, 0.18)}` : 'none',
//             transition: 'border-color 0.15s, box-shadow 0.15s',
//         }}>
//
//             {editMode ? (
//                 /* ── Edit-mode header — unchanged: name field + dissolve toggle ──────── */
//                 <Box sx={{ background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 100%)`, px: 1.75, py: 1.5, position: 'relative', overflow: 'hidden' }}>
//                     <Box sx={{ position: 'absolute', top: -14, right: -14, width: 60, height: 60, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'relative' }}>
//                         <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                             <Layers size={14} color="#fff" />
//                         </Box>
//                         <Box sx={{ flex: 1, minWidth: 0 }}>
//                             <TextField
//                                 size="small"
//                                 value={groupName}
//                                 onChange={e => setGroupName(e.target.value)}
//                                 variant="outlined"
//                                 sx={{
//                                     width: '100%', bgcolor: '#fff', borderRadius: '6px',
//                                     '& .MuiInputBase-input': { fontSize: '0.82rem', fontWeight: 500, py: 0.5, px: 1 },
//                                     '& .MuiOutlinedInput-root': { borderRadius: '6px' },
//                                 }}
//                             />
//                             <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.72)', mt: 0.15 }}>
//                                 {group.envelopes.length} envelopes · {activeCount} active
//                             </Typography>
//                         </Box>
//                         <Tooltip title="Dissolve group — all envelopes become individual">
//                             <Box
//                                 onClick={() => setShowDissolve(p => !p)}
//                                 sx={{
//                                     display: 'flex', alignItems: 'center', gap: 0.4, flexShrink: 0,
//                                     cursor: 'pointer', color: '#fff',
//                                     bgcolor: 'rgba(255,255,255,0.16)', px: 0.9, py: 0.4, borderRadius: '6px',
//                                     fontSize: '0.66rem', fontWeight: 500,
//                                     '&:hover': { bgcolor: 'rgba(255,255,255,0.26)' },
//                                 }}
//                             >
//                                 <Unlink size={11} />
//                                 Dissolve
//                             </Box>
//                         </Tooltip>
//                     </Box>
//                 </Box>
//             ) : (
//                 /* ── View-mode header — flat, single line, kebab replaces the old
//                     always-visible notification toggle ─────────────────────────────── */
//                 <Box sx={{ px: 1.75, py: 1.25, borderBottom: '1px solid #ecd9d9', display: 'flex', alignItems: 'center', gap: 1 }}>
//                     <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: alpha(MAROON, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                         <Layers size={14} color={MAROON} />
//                     </Box>
//                     <Box sx={{ flex: 1, minWidth: 0 }}>
//                         <Typography sx={{ fontWeight: 500, fontSize: '0.83rem', color: '#111', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                             {group.linkName}
//                         </Typography>
//                         <Typography sx={{ fontSize: '0.66rem', color: '#999', mt: 0.1 }}>
//                             {group.envelopes.length} envelopes · {activeCount} active
//                         </Typography>
//                     </Box>
//                     <IconButton size="small" aria-label="Group actions" onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ color: '#a35c5c', flexShrink: 0 }}>
//                         <MoreHorizontal size={16} />
//                     </IconButton>
//                     <Menu
//                         anchorEl={menuAnchor}
//                         open={Boolean(menuAnchor)}
//                         onClose={closeMenu}
//                         anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
//                         transformOrigin={{ vertical: 'top', horizontal: 'right' }}
//                         PaperProps={{ sx: { borderRadius: '10px', border: '1px solid #ecd9d9', boxShadow: '0 8px 24px rgba(122,31,43,0.18)', minWidth: 210, mt: 0.5 } }}
//                     >
//                         <MenuItem onClick={(e) => { e.stopPropagation(); onToggleGroupNotification?.('system'); }}>
//                             <ListItemIcon sx={{ minWidth: 30 }}>
//                                 {groupNotificationPrefs.system ? <Check size={15} color={MAROON} /> : <Circle size={13} color="#ccc" />}
//                             </ListItemIcon>
//                             <ListItemText primaryTypographyProps={{ fontSize: '0.8rem' }}>System notifications</ListItemText>
//                         </MenuItem>
//                         <MenuItem onClick={(e) => { e.stopPropagation(); onToggleGroupNotification?.('email'); }}>
//                             <ListItemIcon sx={{ minWidth: 30 }}>
//                                 {groupNotificationPrefs.email ? <Check size={15} color={MAROON} /> : <Circle size={13} color="#ccc" />}
//                             </ListItemIcon>
//                             <ListItemText primaryTypographyProps={{ fontSize: '0.8rem' }}>Email notifications</ListItemText>
//                         </MenuItem>
//                         <Divider sx={{ my: 0.5 }} />
//                         <MenuItem onClick={() => { closeMenu(); onOpenGroupNotificationSettings?.('system'); }}>
//                             <ListItemIcon sx={{ minWidth: 30 }}><Settings2 size={15} color="#a35c5c" /></ListItemIcon>
//                             <ListItemText primaryTypographyProps={{ fontSize: '0.8rem' }}>Notification settings</ListItemText>
//                         </MenuItem>
//                     </Menu>
//                 </Box>
//             )}
//
//             {/* ── Group body ───────────────────────────────────────────────── */}
//             <Box sx={{ p: 1.75, bgcolor: '#fff' }}>
//
//                 {/* Dissolve confirmation */}
//                 {showDissolve && (
//                     <Box sx={{ mb: 1.5, p: 1.25, borderRadius: '8px', border: `1px solid ${alpha('#dc2626', 0.3)}` }}>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
//                             <AlertTriangle size={13} color="#dc2626" />
//                             <Typography sx={{ fontWeight: 500, fontSize: '0.8rem', color: '#dc2626' }}>Dissolve this group?</Typography>
//                         </Box>
//                         <Typography sx={{ fontSize: '0.72rem', color: '#a34848', lineHeight: 1.5, mb: 1 }}>
//                             All {group.envelopes.length} envelopes will become individual. Contribution history and targets are preserved. This cannot be undone.
//                         </Typography>
//                         <Box sx={{ display: 'flex', gap: 0.75 }}>
//                             <Box
//                                 onClick={() => setShowDissolve(false)}
//                                 sx={{ flex: 1, py: 0.6, borderRadius: '6px', border: `1px solid #e0e0e0`, textAlign: 'center', cursor: 'pointer', fontSize: '0.74rem', color: '#666', '&:hover': { bgcolor: '#f5f5f5' } }}
//                             >
//                                 Cancel
//                             </Box>
//                             <Box
//                                 onClick={handleDissolve}
//                                 sx={{ flex: 1, py: 0.6, borderRadius: '6px', bgcolor: '#dc2626', textAlign: 'center', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 500, color: '#fff', '&:hover': { bgcolor: '#b91c1c' } }}
//                             >
//                                 Yes, dissolve
//                             </Box>
//                         </Box>
//                     </Box>
//                 )}
//
//                 {/* ── Ring + budget tiles — the card's new visual anchor, replacing the
//                     old linear "combined progress" box and the plain stats sentence ──── */}
//                 {!editMode && (
//                     <>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
//                             <ProgressRing pct={overallPct} />
//                             <Box sx={{ flex: 1, minWidth: 0 }}>
//                                 <Typography sx={{ fontSize: '0.95rem', fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalSaved)}</Typography>
//                                 <Typography sx={{ fontSize: '0.7rem', color: '#999' }}>of {fmt(totalTarget)} combined</Typography>
//                             </Box>
//                         </Box>
//
//                         <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 1.5 }}>
//                             <Box sx={{ bgcolor: '#fbf1f1', borderRadius: '8px', p: 1 }}>
//                                 <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#111' }}>{fmt(group.sharedBudget)}/mo</Typography>
//                                 <Typography sx={{ fontSize: '0.6rem', color: '#999', mt: 0.1 }}>Shared budget</Typography>
//                             </Box>
//                             <Box sx={{ bgcolor: '#fbf1f1', borderRadius: '8px', p: 1 }}>
//                                 <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#111' }}>{fmt(group.totalSpent)}</Typography>
//                                 <Typography sx={{ fontSize: '0.6rem', color: '#999', mt: 0.1 }}>Spent</Typography>
//                             </Box>
//                             <Box sx={{ bgcolor: '#fbf1f1', borderRadius: '8px', p: 1 }}>
//                                 <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#111' }}>{nearestDays !== null ? `${nearestDays}d` : '—'}</Typography>
//                                 <Typography sx={{ fontSize: '0.6rem', color: '#999', mt: 0.1 }}>Nearest target</Typography>
//                             </Box>
//                         </Box>
//
//                         {/* ── Members grid — always visible; the ring/tiles above make the
//                             card compact enough that a collapse toggle isn't needed ──────── */}
//                         <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 1.25 }}>
//                             {group.envelopes.map(env => (
//                                 <MiniMemberCard
//                                     key={env.id}
//                                     env={env}
//                                     isSelected={!isGroupSelected && env.id === selectedId}
//                                     onClick={() => onSelectEnvelope(env.id)}
//                                     notificationPrefs={getMemberNotificationPrefs?.(env.id) ?? DEFAULT_NOTIF_PREFS}
//                                     onToggleNotification={(channel) => onToggleMemberNotification?.(env.id, channel)}
//                                     onOpenNotificationSettings={(channel) => onOpenMemberNotificationSettings?.(env.id, channel)}
//                                 />
//                             ))}
//                         </Box>
//
//                         <Box
//                             onClick={onSelectGroup}
//                             sx={{ display: 'flex', alignItems: 'center', gap: 0.4, cursor: onSelectGroup ? 'pointer' : 'default', color: MAROON, '&:hover': onSelectGroup ? { opacity: 0.75 } : undefined }}
//                         >
//                             <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: MAROON }}>
//                                 {isGroupSelected ? 'Viewing group stats' : 'View group stats'}
//                             </Typography>
//                             {!isGroupSelected && <ArrowRight size={12} />}
//                         </Box>
//                     </>
//                 )}
//             </Box>
//
//             {/* ── Edit mode: member grid with remove controls ───────────────── */}
//             {editMode && (
//                 <>
//                     <Divider sx={{ borderColor: '#ecd9d9' }} />
//                     <Box sx={{ p: 1.5, bgcolor: '#fdf7f7' }}>
//
//                         {/* Existing members */}
//                         <Typography sx={SECTION_LABEL_SX}>Current members</Typography>
//                         <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: addable.length > 0 ? 1.5 : 0 }}>
//                             {group.envelopes.map(env => (
//                                 <EditMemberCard
//                                     key={env.id}
//                                     env={env}
//                                     flagged={removingIds.has(env.id)}
//                                     onToggle={() => toggleRemove(env.id)}
//                                 />
//                             ))}
//
//                             {/* Preview cards for envelopes being added */}
//                             {addable.filter(e => addingIds.has(e.id)).map(env => (
//                                 <EditMemberCard
//                                     key={`adding-${env.id}`}
//                                     env={env}
//                                     flagged={false}
//                                     isAdding={true}
//                                     onToggle={() => toggleAdd(env.id)}
//                                 />
//                             ))}
//                         </Box>
//
//                         {/* Available to add */}
//                         {addable.length > 0 && (
//                             <>
//                                 <Divider sx={{ mb: 1.25, borderColor: '#ecd9d9' }} />
//                                 <Typography sx={SECTION_LABEL_SX}>Add to group</Typography>
//                                 <Stack spacing={0.6}>
//                                     {addable.map(env => {
//                                         const c       = colorFor(env.envelopeType);
//                                         const isAdded = addingIds.has(env.id);
//                                         return (
//                                             <Box key={env.id} sx={{
//                                                 display: 'flex', alignItems: 'center', gap: 1,
//                                                 p: 0.9, borderRadius: '8px',
//                                                 border: `1px solid ${isAdded ? alpha('#16a34a', 0.3) : '#ecd9d9'}`,
//                                                 bgcolor: isAdded ? alpha('#16a34a', 0.04) : '#fff',
//                                                 transition: 'all 0.15s',
//                                             }}>
//                                                 <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: c, flexShrink: 0 }} />
//                                                 <Box sx={{ flex: 1, minWidth: 0 }}>
//                                                     <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                                                         {env.envelopeName}
//                                                     </Typography>
//                                                     <Typography sx={{ fontSize: '0.62rem', color: '#999', fontVariantNumeric: 'tabular-nums' }}>
//                                                         {fmt(env.currentAmount)} / {fmt(env.targetAmount)} · {env.status.toLowerCase()}
//                                                     </Typography>
//                                                 </Box>
//                                                 <Tooltip title={isAdded ? 'Undo' : 'Add to group'}>
//                                                     <Box
//                                                         onClick={() => toggleAdd(env.id)}
//                                                         sx={{
//                                                             width: 22, height: 22, borderRadius: '5px', flexShrink: 0,
//                                                             border: `1px solid ${isAdded ? alpha('#16a34a', 0.35) : '#e0e0e0'}`,
//                                                             color: isAdded ? '#16a34a' : '#bbb',
//                                                             display: 'flex', alignItems: 'center', justifyContent: 'center',
//                                                             cursor: 'pointer',
//                                                             '&:hover': { borderColor: isAdded ? '#dc2626' : '#16a34a', color: isAdded ? '#dc2626' : '#16a34a' },
//                                                         }}
//                                                     >
//                                                         {isAdded ? <RotateCcw size={11} /> : <Plus size={11} />}
//                                                     </Box>
//                                                 </Tooltip>
//                                             </Box>
//                                         );
//                                     })}
//                                 </Stack>
//                             </>
//                         )}
//
//                         {addable.length === 0 && group.envelopes.length > 0 && (
//                             <Typography sx={{ fontSize: '0.68rem', color: '#bbb', fontStyle: 'italic', mt: 0.5 }}>
//                                 No individual envelopes available to add.
//                             </Typography>
//                         )}
//                     </Box>
//
//                     {/* Pending changes banner */}
//                     {hasPendingChanges && (
//                         <Box sx={{ mx: 1.5, mb: 1.5, p: 1, borderRadius: '8px', border: `1px solid ${alpha(MAROON, 0.25)}` }}>
//                             <Typography sx={{ fontSize: '0.7rem', color: MAROON }}>
//                                 Pending: {pendingSummaryParts.join(' · ')}
//                             </Typography>
//                         </Box>
//                     )}
//
//                     {/* Save / discard footer */}
//                     <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'flex-end', px: 1.5, pb: 1.5 }}>
//                         <Box
//                             onClick={handleDiscard}
//                             sx={{
//                                 px: 1.5, py: 0.6, borderRadius: '7px', border: `1px solid #e0e0e0`,
//                                 fontSize: '0.75rem', color: '#666', cursor: 'pointer',
//                                 '&:hover': { bgcolor: '#f5f5f5' },
//                             }}
//                         >
//                             Discard
//                         </Box>
//                         <Box
//                             onClick={handleSave}
//                             sx={{
//                                 px: 1.5, py: 0.6, borderRadius: '7px', bgcolor: MAROON, border: 'none',
//                                 fontSize: '0.75rem', fontWeight: 500, color: '#fff', cursor: 'pointer',
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