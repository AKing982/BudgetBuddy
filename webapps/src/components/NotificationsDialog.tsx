import React, { useMemo, useState } from 'react';
import {
    alpha, Box, Button, Chip, Collapse, Dialog, DialogContent,
    IconButton, Stack, Typography,
} from '@mui/material';
import { Bell, ChevronDown, ChevronUp, X as XIcon } from 'lucide-react';
import { MAROON } from '../config/Constants';
import EnvelopeNotificationService from "../services/EnvelopeNotificationService";

export type NotificationCategory = 'contribution' | 'goal' | 'account' | 'group';

export interface EnvelopeNotificationItem {
    id:           string;
    envelopeId:   number;
    envelopeName: string;
    category:     NotificationCategory;
    date:         string;
    message:      string;
    badge:        string;
    badgeType:    'due' | 'behind' | 'reminder' | 'goal' | 'read';
    isRead:       boolean;
}

interface NotificationsDialogProps {
    open:          boolean;
    onClose:       () => void;
    subjectName:   string;
    notifications: EnvelopeNotificationItem[];
    onMarkAllRead: () => void;
    onAccept:      (id: string) => void;
}

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
    due:      { bg: alpha('#dc2626', 0.10), color: '#991b1b' },
    behind:   { bg: alpha('#d97706', 0.12), color: '#92400e' },
    reminder: { bg: alpha('#d97706', 0.12), color: '#92400e' },
    goal:     { bg: alpha('#16a34a', 0.10), color: '#14532d' },
    read:     { bg: '#f0ede6',              color: '#888'    },
};

const DOT_COLORS: Record<string, string> = {
    due:      '#dc2626',
    behind:   '#d97706',
    reminder: '#d97706',
    goal:     '#16a34a',
    read:     '#c4c4c4',
};

const CATEGORY_META: Record<NotificationCategory, { label: string; bg: string; color: string }> = {
    contribution: { label: 'Contributions', bg: alpha('#dc2626', 0.10), color: '#991b1b' },
    goal:         { label: 'Goals',         bg: alpha('#7c3aed', 0.10), color: '#5b21b6' },
    account:      { label: 'Account',       bg: alpha('#d97706', 0.12), color: '#92400e' },
    group:        { label: 'Group',         bg: alpha('#0284c7', 0.10), color: '#075985' },
};

/** Last instant of the current month — anything scheduled after this is "future" and gets collapsed. */
const endOfCurrentMonth = (): Date => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
};

const NotifCard: React.FC<{
    n:        EnvelopeNotificationItem;
    selected: boolean;
    onSelect: () => void;
    onAccept: () => void;
}> = ({ n, selected, onSelect, onAccept }) => {
    const badge = BADGE_STYLES[n.badgeType];
    const dot   = DOT_COLORS[n.badgeType];
    return (
        <Box
            onClick={onSelect}
            sx={{
                display: 'flex', alignItems: 'flex-start', gap: 1.25, p: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${selected ? MAROON : n.isRead ? '#eeece7' : alpha(MAROON, 0.18)}`,
                bgcolor: selected ? alpha(MAROON, 0.05) : n.isRead ? '#fafaf8' : alpha(MAROON, 0.02),
                mb: 0.6, '&:last-child': { mb: 0 },
                cursor: 'pointer',
                transition: 'all 0.15s',
                '&:hover': { borderColor: alpha(MAROON, 0.4), bgcolor: alpha(MAROON, 0.03) },
            }}
        >
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: dot, flexShrink: 0, mt: '6px' }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{
                    fontSize: '0.78rem',
                    color: '#111',
                    lineHeight: 1.4,
                    fontWeight: selected ? 700 : 600,
                }}>
                    {n.message}
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', color: '#a35c5c', fontWeight: 600, mt: 0.15 }}>
                    {n.envelopeName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.4 }}>
                    <Typography sx={{ fontSize: '0.65rem', color: '#aaa', fontVariantNumeric: 'tabular-nums' }}>
                        {new Date(n.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Typography>
                    <Chip size="small" label={n.badge} sx={{
                        height: 15, fontSize: '0.58rem', fontWeight: 700,
                        borderRadius: '4px',
                        bgcolor: badge.bg, color: badge.color,
                        '& .MuiChip-label': { px: '6px' },
                    }} />
                </Box>

                {selected && (
                    <Box sx={{ mt: 1 }}>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={e => { e.stopPropagation(); onAccept(); }}
                            sx={{
                                borderRadius: '6px', textTransform: 'none',
                                fontWeight: 700, fontSize: '0.68rem',
                                py: 0.4, px: 1.25, minHeight: 0,
                                bgcolor: MAROON, '&:hover': { bgcolor: alpha(MAROON, 0.85) },
                            }}
                        >
                            Accept
                        </Button>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export const NotificationsDialog: React.FC<NotificationsDialogProps> = ({
                                                                            open, onClose, subjectName, notifications, onMarkAllRead, onAccept,
                                                                        }) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [showFuture, setShowFuture] = useState(false);
    const [envelopeFilter, setEnvelopeFilter] = useState<number | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | 'all'>('all');
    const notificationService = EnvelopeNotificationService.getInstance();

    // ── Dedupe by id first — upstream fetch/creation is producing duplicate notification
    // records for the same envelope+date, so this strips repeats before anything else runs. ──
    const deduped = useMemo(() => {
        const seen = new Set<string>();
        return notifications.filter(n => {
            if (seen.has(n.id)) return false;
            seen.add(n.id);
            return true;
        });
    }, [notifications]);

    // ── Distinct envelopes present, each with a total notification count for its chip. ─────
    const envelopeChips = useMemo(() => {
        const counts = new Map<number, { name: string; count: number }>();
        deduped.forEach(n => {
            const entry = counts.get(n.envelopeId);
            if (entry) {
                entry.count += 1;
            } else {
                counts.set(n.envelopeId, { name: n.envelopeName, count: 1 });
            }
        });
        return Array.from(counts.entries()).map(([envelopeId, { name, count }]) => ({ envelopeId, name, count }));
    }, [deduped]);

    // Reset the selected card and the second filter row whenever the envelope filter changes,
    // since the category counts (and the Active list it was indexing into) are about to change.
    const handleSelectEnvelopeFilter = (value: number | 'all') => {
        setEnvelopeFilter(value);
        setCategoryFilter('all');
        setSelectedIndex(null);
        setShowFuture(false);
    };

    const byEnvelope = useMemo(
        () => envelopeFilter === 'all' ? deduped : deduped.filter(n => n.envelopeId === envelopeFilter),
        [deduped, envelopeFilter]
    );

    // ── Category counts computed from the envelope-filtered set, so switching envelopes
    // keeps this row's counts (and which categories even appear) in sync. ───────────────
    const categoryChips = useMemo(() => {
        const counts = new Map<NotificationCategory, number>();
        byEnvelope.forEach(n => {
            counts.set(n.category, (counts.get(n.category) ?? 0) + 1);
        });
        return Array.from(counts.entries()).map(([category, count]) => ({ category, count }));
    }, [byEnvelope]);

    const handleSelectCategoryFilter = (value: NotificationCategory | 'all') => {
        setCategoryFilter(value);
        setSelectedIndex(null);
        setShowFuture(false);
    };

    const filtered = useMemo(
        () => categoryFilter === 'all' ? byEnvelope : byEnvelope.filter(n => n.category === categoryFilter),
        [byEnvelope, categoryFilter]
    );

    // ── Split by date: current-month-or-earlier is shown by default, anything scheduled
    // strictly after this month is collapsed since it isn't actionable yet. ──────────────
    const { visible, future } = useMemo(() => {
        const cutoff = endOfCurrentMonth();
        const visible: EnvelopeNotificationItem[] = [];
        const future: EnvelopeNotificationItem[] = [];
        filtered.forEach(n => {
            (new Date(n.date) <= cutoff ? visible : future).push(n);
        });
        return { visible, future };
    }, [filtered]);

    const active = useMemo(
        () => visible.filter(n => !n.isRead).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        [visible]
    );
    const history = visible.filter(n => n.isRead);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '14px',
                        border: `1px solid ${alpha(MAROON, 0.12)}`,
                        boxShadow: `0 8px 32px ${alpha(MAROON, 0.12)}, 0 2px 8px rgba(0,0,0,0.08)`,
                    }
                }}>

            {/* Header */}
            <Box sx={{
                background: `linear-gradient(135deg, ${alpha(MAROON, 0.92)} 0%, ${MAROON} 100%)`,
                px: 2.5, py: 1.75,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'relative', overflow: 'hidden',
            }}>
                <Box sx={{ position: 'absolute', top: -12, right: -12, width: 60, height: 60, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box sx={{ width: 28, height: 28, borderRadius: '7px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Bell size={14} color="#fff" />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#fff', lineHeight: 1.2 }}>
                            Notifications
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.72)', mt: 0.1 }}>
                            {subjectName}{active.length > 0 ? ` · ${active.length} unread` : ''}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small"
                            sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                    <XIcon size={15} />
                </IconButton>
            </Box>

            <DialogContent sx={{ pt: 2, pb: 2.5, px: 2.5, bgcolor: '#fff' }}>

                {/* Envelope filter chips — only worth showing when more than one envelope is present */}
                {envelopeChips.length > 1 && (
                    <Box sx={{
                        display: 'flex', gap: 0.6, mb: 1, overflowX: 'auto', pb: 0.25,
                        '&::-webkit-scrollbar': { height: '3px' },
                        '&::-webkit-scrollbar-thumb': { bgcolor: alpha(MAROON, 0.2), borderRadius: '4px' },
                    }}>
                        <Chip
                            size="small"
                            label={`All · ${deduped.length}`}
                            onClick={() => handleSelectEnvelopeFilter('all')}
                            sx={{
                                flexShrink: 0, height: 24, fontSize: '0.68rem', fontWeight: 700, borderRadius: '14px',
                                px: 0.5,
                                ...(envelopeFilter === 'all'
                                    ? { bgcolor: MAROON, color: '#fff', '&:hover': { bgcolor: MAROON } }
                                    : { bgcolor: '#f5e5e5', color: '#7a4a4a', '&:hover': { bgcolor: '#efd9d9' } }),
                            }}
                        />
                        {envelopeChips.map(({ envelopeId, name, count }) => (
                            <Chip
                                key={envelopeId}
                                size="small"
                                label={`${name} · ${count}`}
                                onClick={() => handleSelectEnvelopeFilter(envelopeId)}
                                sx={{
                                    flexShrink: 0, height: 24, fontSize: '0.68rem', fontWeight: 700, borderRadius: '14px',
                                    px: 0.5,
                                    ...(envelopeFilter === envelopeId
                                        ? { bgcolor: MAROON, color: '#fff', '&:hover': { bgcolor: MAROON } }
                                        : { bgcolor: '#f5e5e5', color: '#7a4a4a', '&:hover': { bgcolor: '#efd9d9' } }),
                                }}
                            />
                        ))}
                    </Box>
                )}

                {/* Category/type filter chips — only worth showing when more than one type is present */}
                {categoryChips.length > 1 && (
                    <Box sx={{
                        display: 'flex', gap: 0.5, mb: 2, overflowX: 'auto', pb: 0.25,
                        '&::-webkit-scrollbar': { height: '3px' },
                        '&::-webkit-scrollbar-thumb': { bgcolor: alpha(MAROON, 0.2), borderRadius: '4px' },
                    }}>
                        <Chip
                            size="small"
                            label="All types"
                            onClick={() => handleSelectCategoryFilter('all')}
                            sx={{
                                flexShrink: 0, height: 20, fontSize: '0.6rem', fontWeight: 700, borderRadius: '12px',
                                px: 0.4,
                                ...(categoryFilter === 'all'
                                    ? { bgcolor: MAROON, color: '#fff', '&:hover': { bgcolor: MAROON } }
                                    : { bgcolor: '#f0ede6', color: '#888', '&:hover': { bgcolor: '#e5e0d6' } }),
                            }}
                        />
                        {categoryChips.map(({ category, count }) => {
                            const meta = CATEGORY_META[category];
                            const isSelected = categoryFilter === category;
                            return (
                                <Chip
                                    key={category}
                                    size="small"
                                    label={`${meta.label} · ${count}`}
                                    onClick={() => handleSelectCategoryFilter(category)}
                                    sx={{
                                        flexShrink: 0, height: 20, fontSize: '0.6rem', fontWeight: 700, borderRadius: '12px',
                                        px: 0.4,
                                        ...(isSelected
                                            ? { bgcolor: meta.color, color: '#fff', '&:hover': { bgcolor: meta.color } }
                                            : { bgcolor: meta.bg, color: meta.color, '&:hover': { filter: 'brightness(0.96)' } }),
                                    }}
                                />
                            );
                        })}
                    </Box>
                )}

                {/* Active section */}
                <Typography sx={{
                    fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase',
                    letterSpacing: '0.09em', color: '#bbb', mb: 1,
                }}>
                    Active
                </Typography>

                {active.length === 0 ? (
                    <Box sx={{ py: 1.5, px: 1.5, borderRadius: '8px', bgcolor: '#f8f8f6', border: '1px solid #eee', mb: 1.5 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: '#bbb', fontStyle: 'italic', textAlign: 'center' }}>
                            No active notifications
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <Stack sx={{ mb: 1 }}>
                            {active.map((n, idx) => (
                                <NotifCard
                                    key={`${n.id}-${idx}`}
                                    n={n}
                                    selected={selectedIndex === idx}
                                    onSelect={() => setSelectedIndex(prev => prev === idx ? null : idx)}
                                    onAccept={async () => {
                                        onAccept(n.id);
                                        await notificationService.sendEnvelopeAcceptNotification(Number(n.id));
                                    }}
                                />
                            ))}
                        </Stack>
                        <Button fullWidth size="small" variant="outlined" onClick={onMarkAllRead}
                                sx={{
                                    mt: 0.75, mb: 0.5, borderRadius: '7px', textTransform: 'none',
                                    fontWeight: 700, fontSize: '0.72rem', py: 0.6,
                                    borderColor: alpha(MAROON, 0.25), color: MAROON,
                                    '&:hover': { bgcolor: alpha(MAROON, 0.04), borderColor: alpha(MAROON, 0.4) },
                                }}>
                            Mark all as read
                        </Button>
                    </>
                )}

                {/* Divider */}
                <Box sx={{ height: '1px', bgcolor: '#f0ede7', my: 1.75 }} />

                {/* History section */}
                <Typography sx={{
                    fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase',
                    letterSpacing: '0.09em', color: '#bbb', mb: 1,
                }}>
                    History
                </Typography>

                {history.length === 0 ? (
                    <Box sx={{ py: 1.5, px: 1.5, borderRadius: '8px', bgcolor: '#f8f8f6', border: '1px solid #eee' }}>
                        <Typography sx={{ fontSize: '0.75rem', color: '#bbb', fontStyle: 'italic', textAlign: 'center' }}>
                            No past notifications
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{
                        maxHeight: 200, overflowY: 'auto', pr: 0.25,
                        '&::-webkit-scrollbar': { width: '3px' },
                        '&::-webkit-scrollbar-thumb': { bgcolor: alpha(MAROON, 0.2), borderRadius: '4px' },
                        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                    }}>
                        {history.map((n, idx) => (
                            <NotifCard
                                key={`${n.id}-${idx}`}
                                n={n}
                                selected={false}
                                onSelect={() => {}}
                                onAccept={() => {}}
                            />
                        ))}
                    </Box>
                )}

                {/* Upcoming (future months) — collapsed by default, not actionable yet */}
                {future.length > 0 && (
                    <>
                        <Box sx={{ height: '1px', bgcolor: '#f0ede7', my: 1.75 }} />
                        <Button
                            fullWidth
                            size="small"
                            onClick={() => setShowFuture(p => !p)}
                            endIcon={showFuture ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            sx={{
                                justifyContent: 'space-between', textTransform: 'none',
                                fontWeight: 700, fontSize: '0.68rem', color: '#999',
                                px: 0.5, minWidth: 0,
                                '&:hover': { bgcolor: 'transparent', color: MAROON },
                            }}
                        >
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                Upcoming
                                <Chip size="small" label={future.length} sx={{
                                    height: 15, fontSize: '0.58rem', fontWeight: 700,
                                    borderRadius: '4px', bgcolor: '#f0ede6', color: '#999',
                                    '& .MuiChip-label': { px: '6px' },
                                }} />
                            </Box>
                        </Button>
                        <Collapse in={showFuture}>
                            <Stack sx={{ mt: 1 }}>
                                {future.map((n, idx) => (
                                    <NotifCard
                                        key={`${n.id}-${idx}`}
                                        n={n}
                                        selected={false}
                                        onSelect={() => {}}
                                        onAccept={() => {}}
                                    />
                                ))}
                            </Stack>
                        </Collapse>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default NotificationsDialog;