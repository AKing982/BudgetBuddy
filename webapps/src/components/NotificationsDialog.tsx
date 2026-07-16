import React, { useState } from 'react';
import {
    alpha, Box, Button, Chip, Dialog, DialogContent,
    IconButton, Stack, Typography,
} from '@mui/material';
import { Bell, X as XIcon } from 'lucide-react';
import { MAROON } from '../config/Constants';
import EnvelopeNotificationService from "../services/EnvelopeNotificationService";
import envelopeNotificationService from "../services/EnvelopeNotificationService";

export interface EnvelopeNotificationItem {
    id:        string;
    date:      string;
    message:   string;
    badge:     string;
    badgeType: 'due' | 'behind' | 'reminder' | 'goal' | 'read';
    isRead:    boolean;
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
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const active  = notifications.filter(n => !n.isRead);
    const history = notifications.filter(n => n.isRead);
    const notificationService = EnvelopeNotificationService.getInstance();

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
                            {active.map(n => (
                                <NotifCard
                                    key={n.id}
                                    n={n}
                                    selected={selectedId === n.id}
                                    onSelect={() => setSelectedId(prev => prev === n.id ? null : n.id)}
                                    onAccept={async () => {
                                        onAccept(n.id);
                                        console.log(n.id);
                                        await notificationService.sendEnvelopeAcceptNotification(Number(selectedId));
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
                        {history.map(n => (
                            <NotifCard
                                key={n.id}
                                n={n}
                                selected={false}
                                onSelect={() => {}}
                                onAccept={() => {}}
                            />
                        ))}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default NotificationsDialog;